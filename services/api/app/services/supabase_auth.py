from __future__ import annotations

import asyncio
import json
from typing import Any
from urllib.error import HTTPError, URLError
from urllib.parse import urlencode
from urllib.request import Request, urlopen

from app.config import Settings
from app.errors import APIError


class SupabaseAuthService:
    """Server-side Auth REST adapter. Never logs credentials or token material."""

    def __init__(self, settings: Settings) -> None:
        self.base_url = str(settings.supabase_url).rstrip("/")
        self.publishable_key = settings.supabase_publishable_key
        self.secret_key = settings.supabase_secret_key
        self.timeout = settings.auth_admin_timeout_seconds
        self.app_public_url = str(settings.app_public_url).rstrip("/") if settings.app_public_url else None

    async def _request(
        self, method: str, path: str, *, api_key: str, bearer: str | None = None,
        payload: dict[str, Any] | None = None,
    ) -> dict[str, Any] | None:
        def send() -> dict[str, Any] | None:
            headers = {"apikey": api_key, "Content-Type": "application/json"}
            if bearer:
                headers["Authorization"] = f"Bearer {bearer}"
            body = json.dumps(payload).encode() if payload is not None else None
            request = Request(self.base_url + "/auth/v1/" + path, data=body, headers=headers, method=method)
            try:
                with urlopen(request, timeout=self.timeout) as response:
                    content = response.read()
                    return json.loads(content) if content else None
            except HTTPError as exc:
                # Do not surface raw Auth responses; they may include identity data.
                raise APIError(502, "identity_provider_request_failed",
                               "Supabase Auth rejected the requested operation.") from exc
            except (URLError, TimeoutError, OSError) as exc:
                raise APIError(503, "identity_provider_unavailable",
                               "Supabase Auth is temporarily unavailable.") from exc
        return await asyncio.to_thread(send)

    async def sign_out(self, access_token: str, scope: str) -> None:
        if self.publishable_key is None:
            raise APIError(503, "auth_api_key_not_configured",
                           "SUPABASE_PUBLISHABLE_KEY is required for remote Auth sign-out.")
        await self._request("POST", "logout?" + urlencode({"scope": scope}),
                            api_key=self.publishable_key.get_secret_value(), bearer=access_token)

    async def unlink_identity(self, access_token: str, identity_id: str) -> None:
        if self.publishable_key is None:
            raise APIError(503, "auth_api_key_not_configured",
                           "SUPABASE_PUBLISHABLE_KEY is required for identity unlink.")
        await self._request("DELETE", "user/identities/" + identity_id,
                            api_key=self.publishable_key.get_secret_value(), bearer=access_token)

    async def invite_user(self, email: str, redirect_to: str) -> None:
        if self.secret_key is None:
            raise APIError(503, "auth_admin_not_configured",
                           "SUPABASE_SECRET_KEY is required to invite a new Auth identity.")
        secret = self.secret_key.get_secret_value()
        await self._request("POST", "invite?" + urlencode({"redirect_to": redirect_to}),
                            api_key=secret, bearer=secret, payload={"email": email})

    async def set_user_ban(self, user_id: str, duration: str) -> None:
        if self.secret_key is None:
            raise APIError(503, "auth_admin_not_configured",
                           "SUPABASE_SECRET_KEY is required for account status administration.")
        secret = self.secret_key.get_secret_value()
        await self._request("PUT", "admin/users/" + user_id,
                            api_key=secret, bearer=secret,
                            payload={"ban_duration": duration})
