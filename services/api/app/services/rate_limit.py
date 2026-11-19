from __future__ import annotations

import base64
import hashlib
import hmac
import json
import logging
import re
import secrets
from dataclasses import dataclass
from datetime import UTC, datetime
from typing import Any

import asyncpg
from fastapi import Request

from app.errors import APIError

logger = logging.getLogger("salesx.api.security")


@dataclass(frozen=True)
class RateLimitRule:
    name: str
    limit: int
    window_seconds: int
    block_seconds: int


RULES: tuple[tuple[str, str, RateLimitRule], ...] = (
    ("POST", r"^/api/v1/auth/sessions/current$", RateLimitRule("session_register", 20, 60, 300)),
    ("POST", r"^/api/v1/auth/sign-out$", RateLimitRule("auth_signout", 15, 60, 120)),
    ("POST", r"^/api/v1/auth/identities/link-authorize$", RateLimitRule("identity_link_authorize", 5, 600, 1800)),
    ("DELETE", r"^/api/v1/auth/(identities|sessions)/[^/]+$", RateLimitRule("auth_revoke", 12, 300, 600)),
    ("POST", r"^/api/v1/organizations/[^/]+/invitations$", RateLimitRule("invitation_create", 8, 600, 1800)),
    ("POST", r"^/api/v1/organizations/[^/]+/invitations/[^/]+/resend$", RateLimitRule("invitation_resend", 5, 600, 1800)),
    ("POST", r"^/api/v1/organizations/invitations/(accept|reject)$", RateLimitRule("invitation_response", 12, 600, 900)),
    ("POST", r"^/api/v1/organizations/[^/]+/members(/[^/]+/roles)?$", RateLimitRule("membership_change", 20, 60, 300)),
    ("PATCH", r"^/api/v1/organizations/[^/]+/members/[^/]+$", RateLimitRule("membership_change", 20, 60, 300)),
    ("PATCH", r"^/api/v1/admin/users/[^/]+/account-status$", RateLimitRule("account_status", 8, 300, 1800)),
)


def rule_for_request(method: str, path: str) -> RateLimitRule | None:
    for expected_method, pattern, rule in RULES:
        if method.upper() == expected_method and re.fullmatch(pattern, path):
            return rule
    return None


def _unverified_subject(request: Request) -> str | None:
    """Use an unverified JWT subject only as a rate-limit partition key, never for auth."""
    authorization = request.headers.get("authorization", "")
    if not authorization.lower().startswith("bearer "):
        return None
    token = authorization[7:].strip()
    try:
        payload = token.split(".")[1]
        payload += "=" * (-len(payload) % 4)
        claims: dict[str, Any] = json.loads(base64.urlsafe_b64decode(payload))
        subject = claims.get("sub")
        return subject if isinstance(subject, str) and subject else None
    except (IndexError, ValueError, TypeError, json.JSONDecodeError):
        return None


def _bucket_key(name: str, identity: str, hash_secret: str | None = None) -> str:
    message = f"salesx-rate-limit-v1\0{name}\0{identity}".encode()
    if hash_secret:
        return hmac.new(hash_secret.encode(), message, hashlib.sha256).hexdigest()
    return hashlib.sha256(message).hexdigest()


async def _consume(
    connection: asyncpg.Connection,
    *,
    name: str,
    identity: str,
    rule: RateLimitRule,
    hash_secret: str | None = None,
) -> tuple[bool, int]:
    key = _bucket_key(name, identity, hash_secret)
    row = await connection.fetchrow(
        """
        insert into app_private.api_rate_limit_buckets
          (bucket_key,bucket_name,window_started_at,hit_count,blocked_until,updated_at)
        values ($1,$2,now(),1,null,now())
        on conflict (bucket_key) do update set
          hit_count = case
            when app_private.api_rate_limit_buckets.window_started_at
                 <= now() - make_interval(secs => $3) then 1
            else app_private.api_rate_limit_buckets.hit_count + 1
          end,
          window_started_at = case
            when app_private.api_rate_limit_buckets.window_started_at
                 <= now() - make_interval(secs => $3) then now()
            else app_private.api_rate_limit_buckets.window_started_at
          end,
          blocked_until = case
            when app_private.api_rate_limit_buckets.window_started_at
                 <= now() - make_interval(secs => $3) then null
            when app_private.api_rate_limit_buckets.blocked_until > now()
                 then app_private.api_rate_limit_buckets.blocked_until
            when app_private.api_rate_limit_buckets.hit_count + 1 > $4
                 then now() + make_interval(secs => $5)
            else null
          end,
          updated_at = now()
        returning hit_count,blocked_until,
          greatest(1,ceil(extract(epoch from
            (window_started_at + make_interval(secs => $3) - now())))::integer) as window_retry
        """,
        key,
        name,
        rule.window_seconds,
        rule.limit,
        rule.block_seconds,
    )
    blocked_until = row["blocked_until"]
    if row["hit_count"] > rule.limit or (blocked_until is not None and blocked_until > datetime.now(UTC)):
        retry = rule.block_seconds
        if blocked_until is None:
            retry = row["window_retry"]
        else:
            retry = max(1, int((blocked_until - datetime.now(UTC)).total_seconds()))
        return False, retry
    return True, 0


async def enforce_request_rate_limit(request: Request) -> None:
    settings = request.app.state.settings
    if not settings.rate_limit_enabled:
        return
    rule = rule_for_request(request.method, request.url.path)
    if rule is None:
        return
    pool: asyncpg.Pool | None = getattr(request.app.state, "db_pool", None)
    if pool is None:
        if settings.rate_limit_fail_closed:
            raise APIError(503, "rate_limit_store_unavailable", "The distributed security rate-limit store is unavailable.")
        return

    client_ip = request.client.host if request.client else "unknown"
    subject = _unverified_subject(request)
    identifier = request.headers.get("x-rate-limit-identifier", "").strip().lower()
    dimensions = [("ip", client_ip)]
    if subject:
        dimensions.append(("account", subject))
    if identifier and len(identifier) <= 320:
        dimensions.append(("identifier", identifier))

    try:
        async with pool.acquire() as connection:
            for dimension, identity in dimensions:
                allowed, retry_after = await _consume(
                    connection,
                    name=f"{rule.name}:{dimension}",
                    identity=identity,
                    rule=rule,
                    hash_secret=settings.salesx_bff_shared_secret.get_secret_value()
                        if settings.salesx_bff_shared_secret else None,
                )
                if not allowed:
                    logger.warning(
                        "security_rate_limit_exceeded",
                        extra={
                            "bucket": rule.name,
                            "dimension": dimension,
                            "key_fingerprint": _bucket_key(dimension, identity,
                                settings.salesx_bff_shared_secret.get_secret_value()
                                if settings.salesx_bff_shared_secret else None)[:12],
                            "correlation_id": getattr(request.state, "correlation_id", None),
                        },
                    )
                    raise APIError(
                        429,
                        "rate_limit_exceeded",
                        "Too many requests. Wait before retrying.",
                        headers={"Retry-After": str(retry_after)},
                    )
            # Opportunistic bounded retention cleanup; the table is shared by all API instances.
            if secrets.randbelow(256) == 0:
                await connection.execute(
                    "delete from app_private.api_rate_limit_buckets where updated_at < now()-interval '48 hours'"
                )
    except APIError:
        raise
    except (asyncpg.PostgresError, asyncpg.InterfaceError, TimeoutError, OSError) as exc:
        logger.exception("distributed_rate_limit_store_error")
        if settings.rate_limit_fail_closed:
            raise APIError(
                503,
                "rate_limit_store_unavailable",
                "The distributed security rate-limit store is unavailable.",
            ) from exc
