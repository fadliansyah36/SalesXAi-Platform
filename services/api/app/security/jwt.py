import asyncio
from typing import Any
import jwt
from jwt import PyJWKClient
from jwt.exceptions import InvalidTokenError
from app.config import Settings
from app.errors import APIError

class SupabaseJWTVerifier:
    def __init__(self, settings: Settings) -> None:
        self.settings = settings
        self.jwks = PyJWKClient(settings.jwks_url, cache_keys=True, timeout=5)

    async def verify(self, token: str, *, allow_expired: bool = False) -> dict[str, Any]:
        try:
            algorithm = jwt.get_unverified_header(token).get("alg")
            if algorithm == "HS256":
                if self.settings.supabase_jwt_secret is None:
                    raise APIError(401, "invalid_token", "Legacy signing key is not configured.")
                key: Any = self.settings.supabase_jwt_secret.get_secret_value()
            elif algorithm in {"ES256", "RS256", "EdDSA"}:
                key = (await asyncio.to_thread(self.jwks.get_signing_key_from_jwt, token)).key
            else:
                raise APIError(401, "invalid_token", "Unsupported JWT signing algorithm.")
            claims = jwt.decode(
                token, key, algorithms=[algorithm],
                audience=self.settings.supabase_jwt_audience,
                issuer=self.settings.auth_issuer,
                leeway=self.settings.jwt_clock_skew_seconds,
                options={"require": ["exp", "iat", "sub", "session_id", "iss", "aud"], "verify_exp": not allow_expired},
            )
            if not isinstance(claims.get("sub"), str) or not isinstance(claims.get("session_id"), str):
                raise APIError(401, "invalid_token", "Required identity claims are missing.")
            return claims
        except APIError:
            raise
        except (InvalidTokenError, ValueError, KeyError, TypeError) as exc:
            raise APIError(401, "invalid_token", "Access token is invalid or expired.") from exc
        except Exception as exc:
            raise APIError(503, "identity_provider_unavailable", "Identity verification is temporarily unavailable.") from exc
