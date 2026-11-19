from __future__ import annotations

import hmac
import ipaddress
import logging
from typing import Literal

from fastapi import APIRouter, Request, Response
from datetime import UTC, datetime
from uuid import UUID
from pydantic import BaseModel, Field

from app.errors import APIError
from app.services.rate_limit import RateLimitRule, _consume
from app.services.session_mutations import session_mutation_service

router = APIRouter(prefix="/security", tags=["security"])


@router.post("/refresh-authorize", status_code=204)
async def authorize_session_refresh(request: Request) -> Response:
    """BFF-only gate: expired access JWT may refresh only while its registered device session is active."""
    settings = request.app.state.settings
    expected = settings.salesx_bff_shared_secret
    supplied = request.headers.get("x-salesx-bff-secret", "")
    if expected is None or not hmac.compare_digest(supplied, expected.get_secret_value()):
        raise APIError(404, "not_found", "Resource not found.")
    authorization = request.headers.get("authorization", "")
    if not authorization.lower().startswith("bearer "):
        raise APIError(401, "unauthenticated", "A prior access token is required to authorize refresh.")
    claims = await request.app.state.jwt_verifier.verify(authorization[7:].strip(), allow_expired=True)
    try:
        user_id, session_id = UUID(claims["sub"]), UUID(claims["session_id"])
        issued_at = datetime.fromtimestamp(float(claims["iat"]), tz=UTC)
    except (KeyError, ValueError, TypeError, OverflowError) as exc:
        raise APIError(401, "invalid_token", "Refresh session identity is invalid.") from exc
    pool = getattr(request.app.state, "db_pool", None)
    if pool is None:
        raise APIError(503, "database_not_ready", "Session registry is unavailable.")
    async with pool.acquire() as connection:
        await session_mutation_service.authorize_refresh(connection,user_id,session_id,issued_at)
    return Response(status_code=204)
logger = logging.getLogger("salesx.api.security")

EXTERNAL_AUTH_RULES: dict[str, RateLimitRule] = {
    "login": RateLimitRule("auth_login", 8, 300, 900),
    "signup": RateLimitRule("auth_signup", 4, 3600, 3600),
    "otp_send": RateLimitRule("auth_otp_send", 5, 600, 1800),
    "otp_verify": RateLimitRule("auth_otp_verify", 8, 600, 1800),
    "password_recovery": RateLimitRule("auth_password_recovery", 4, 3600, 3600),
    "email_verify": RateLimitRule("auth_email_verify", 10, 300, 900),
    "oauth_start": RateLimitRule("auth_oauth_start", 8, 300, 900),
    "oauth_complete": RateLimitRule("auth_oauth_complete", 10, 300, 900),
    "identity_link": RateLimitRule("auth_identity_link", 5, 600, 1800),
    "password_update": RateLimitRule("auth_password_update", 5, 300, 900),
    "refresh": RateLimitRule("auth_refresh", 60, 60, 120),
    "signout": RateLimitRule("auth_signout", 15, 60, 120),
}


class ExternalRateLimitRequest(BaseModel):
    action: Literal[
        "login", "signup", "otp_send", "otp_verify", "password_recovery",
        "email_verify", "oauth_start", "oauth_complete", "identity_link",
        "password_update", "refresh", "signout",
    ]
    identifier: str | None = Field(default=None, max_length=320)


@router.post("/rate-limit")
async def enforce_bff_rate_limit(payload: ExternalRateLimitRequest, request: Request) -> dict:
    settings = request.app.state.settings
    expected = settings.salesx_bff_shared_secret
    supplied = request.headers.get("x-salesx-bff-secret", "")
    if expected is None or not expected.get_secret_value() or not hmac.compare_digest(
        supplied, expected.get_secret_value()
    ):
        raise APIError(404, "not_found", "Resource not found.")

    raw_ip = request.headers.get("x-rate-limit-ip", "")
    try:
        client_ip = str(ipaddress.ip_address(raw_ip))
    except ValueError as exc:
        raise APIError(400, "invalid_rate_limit_ip", "A valid client IP address is required.") from exc

    pool: asyncpg.Pool | None = getattr(request.app.state, "db_pool", None)
    if pool is None:
        raise APIError(503, "rate_limit_store_unavailable", "The distributed security rate-limit store is unavailable.")

    rule = EXTERNAL_AUTH_RULES[payload.action]
    dimensions = [("ip", client_ip)]
    identifier = (payload.identifier or "").strip().lower()
    if identifier:
        dimensions.append(("identifier", identifier))

    try:
        async with pool.acquire() as connection:
            for dimension, value in dimensions:
                allowed, retry_after = await _consume(
                    connection,
                    name=f"{rule.name}:{dimension}",
                    identity=value,
                    rule=rule,
                    hash_secret=expected.get_secret_value(),
                )
                if not allowed:
                    logger.warning(
                        "security_rate_limit_exceeded",
                        extra={"bucket":rule.name,"dimension":dimension,
                               "correlation_id":getattr(request.state,"correlation_id",None)},
                    )
                    raise APIError(
                        429,
                        "rate_limit_exceeded",
                        "Too many requests. Wait before retrying.",
                        headers={"Retry-After": str(retry_after)},
                    )
    except APIError:
        raise
    except (asyncpg.PostgresError, asyncpg.InterfaceError, TimeoutError, OSError) as exc:
        logger.exception("external_auth_rate_limit_store_error")
        raise APIError(
            503,"rate_limit_store_unavailable",
            "The distributed security rate-limit store is unavailable.",
        ) from exc
    return {"allowed": True}


# The startup action-matrix validator requires explicit IDs for BFF-only routes.
authorize_session_refresh.__api_action_id__ = "security.refresh.authorize"
enforce_bff_rate_limit.__api_action_id__ = "security.auth.rate_limit"
