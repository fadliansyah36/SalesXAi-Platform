from __future__ import annotations

import hmac
import ipaddress
import logging
from typing import Literal

import asyncpg
from fastapi import APIRouter, Request
from pydantic import BaseModel, Field

from app.errors import APIError
from app.services.rate_limit import RateLimitRule, _consume

router = APIRouter(prefix="/security", tags=["security"])
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
        "password_update", "refresh",
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

    async with pool.acquire() as connection:
        for dimension, value in dimensions:
            allowed, retry_after = await _consume(
                connection,
                name=f"{rule.name}:{dimension}",
                identity=value,
                rule=rule,
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
    return {"allowed": True}
