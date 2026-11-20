from __future__ import annotations

import asyncio
import json
from urllib.error import HTTPError, URLError
from urllib.parse import quote, urljoin
from urllib.request import Request, urlopen

from app.config import Settings, get_settings
from app.errors import APIError

BUCKET = "smartteam-visit-evidence"


class SupabaseStorageAdapter:
    """Server-only adapter for private Supabase Storage objects."""

    def __init__(self, settings: Settings | None = None):
        self.settings = settings or get_settings()

    def _credentials(self) -> tuple[str, str]:
        key = self.settings.supabase_secret_key
        if key is None or not key.get_secret_value().strip():
            raise APIError(503, "storage_not_configured", "SUPABASE_SECRET_KEY is required by the private evidence storage adapter.")
        return str(self.settings.supabase_url).rstrip("/"), key.get_secret_value()

    async def upload(self, path: str, content: bytes, mime_type: str) -> None:
        base, key = self._credentials()
        url = f"{base}/storage/v1/object/{BUCKET}/{quote(path, safe='/')}"
        headers = {"apikey": key, "Authorization": f"Bearer {key}", "Content-Type": mime_type, "x-upsert": "false"}
        def send() -> None:
            request = Request(url, data=content, headers=headers, method="POST")
            with urlopen(request, timeout=30) as response:
                response.read()
        try:
            await asyncio.to_thread(send)
        except HTTPError as error:
            if error.code == 409:
                raise APIError(409, "evidence_already_exists", "Evidence object already exists.") from error
            raise APIError(502, "storage_upload_failed", "Supabase Storage rejected the evidence upload.") from error
        except (URLError, TimeoutError) as error:
            raise APIError(502, "storage_unavailable", "Supabase Storage could not be reached.") from error

    async def delete(self, path: str) -> None:
        base, key = self._credentials()
        url = f"{base}/storage/v1/object/{BUCKET}"
        body = json.dumps({"prefixes": [path]}).encode()
        headers = {"apikey": key, "Authorization": f"Bearer {key}", "Content-Type": "application/json"}
        def send() -> None:
            request = Request(url, data=body, headers=headers, method="DELETE")
            with urlopen(request, timeout=15) as response:
                response.read()
        try:
            await asyncio.to_thread(send)
        except Exception:
            return

    async def signed_download_url(self, path: str, expires_in: int = 900) -> str:
        base, key = self._credentials()
        url = f"{base}/storage/v1/object/sign/{BUCKET}/{quote(path, safe='/')}"
        body = json.dumps({"expiresIn": expires_in}).encode()
        headers = {"apikey": key, "Authorization": f"Bearer {key}", "Content-Type": "application/json"}
        def send() -> str:
            request = Request(url, data=body, headers=headers, method="POST")
            with urlopen(request, timeout=15) as response:
                payload = json.loads(response.read().decode())
            signed = payload.get("signedURL") or payload.get("signedUrl")
            if not signed:
                raise ValueError("Supabase Storage did not return a signed URL.")
            return urljoin(base, signed)
        try:
            return await asyncio.to_thread(send)
        except HTTPError as error:
            raise APIError(502, "storage_signed_url_failed", "Supabase Storage could not sign the evidence URL.") from error
        except (URLError, TimeoutError, ValueError, json.JSONDecodeError) as error:
            raise APIError(502, "storage_unavailable", "Supabase Storage could not be reached.") from error


supabase_storage = SupabaseStorageAdapter()
