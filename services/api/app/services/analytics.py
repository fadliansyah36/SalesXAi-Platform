from __future__ import annotations

import asyncio
import json
import urllib.error
import urllib.parse
import urllib.request
from datetime import date
from uuid import UUID

import asyncpg

from app.config import get_settings
from app.errors import APIError
from app.repositories.analytics import AnalyticsRepository,analytics_repository
from app.security.dependencies import Principal,TenantContext


class AnalyticsService:
    """Tenant/scope-aware deterministic reporting and private artifact delivery."""

    def __init__(self,repository:AnalyticsRepository|None=None):
        self.repository=repository or analytics_repository

    @staticmethod
    def _tenant(organization_id:UUID,tenant:TenantContext)->None:
        if tenant.organization_id!=organization_id:
            raise APIError(403,"forbidden","Cross-tenant analytics access is denied.")

    async def dashboard(self,connection,organization_id,tenant,principal,period_start,period_end,grain,scope_type=None,scope_id=None):
        self._tenant(organization_id,tenant)
        if period_end<period_start or (period_end-period_start).days>366:
            raise APIError(422,"invalid_analytics_period","Analytics period must be ordered and no longer than 366 days.")
        scopes=await self.repository.list_scopes(connection,organization_id,principal.user_id)
        if not scopes:
            raise APIError(403,"analytics_scope_denied","No analytics dashboard scope is assigned.")
        if scope_id is not None and scope_type is None:
            raise APIError(422,"invalid_analytics_scope","scope_type is required when scope_id is supplied.")
        if scope_type is not None:
            allowed=await self.repository.can_access_scope(
                connection,organization_id,principal.user_id,scope_type,scope_id,"analytics:dashboard:read"
            )
            if not allowed:
                raise APIError(403,"analytics_scope_denied","Requested KPI scope is outside the caller's assignment.")
        metrics=await self.repository.dashboard_metrics(
            connection,organization_id,principal.user_id,period_start,period_end,grain,scope_type,scope_id
        )
        freshness=await self.repository.dashboard_freshness(connection,organization_id,period_start,period_end,grain)
        return {
            "organization_id":organization_id,"period_start":period_start,"period_end":period_end,
            "period_grain":grain,
            "scopes":[{"scope_type":r["scope_type"],"scope_id":r["scope_id"]} for r in scopes],
            "metrics":[dict(r) for r in metrics],"data_as_of":freshness,"is_stale":freshness is None,
        }

    async def list_reports(self,connection,organization_id,tenant,principal,limit):
        self._tenant(organization_id,tenant)
        rows=await self.repository.list_reports(connection,organization_id,principal.user_id,limit)
        return [dict(row) for row in rows]

    async def create_report(self,connection,organization_id,tenant,principal,payload):
        self._tenant(organization_id,tenant)
        if payload["period_end"]<payload["period_start"] or (payload["period_end"]-payload["period_start"]).days>366:
            raise APIError(422,"invalid_report_period","Report period must be ordered and no longer than 366 days.")
        scope_type=payload["scope_type"]
        scope_id=payload.get("scope_id")
        if (scope_type=="tenant" and scope_id is not None) or (scope_type!="tenant" and scope_id is None):
            raise APIError(422,"invalid_report_scope","The selected report scope requires a valid scope identifier.")
        allowed=await self.repository.can_access_scope(
            connection,organization_id,principal.user_id,scope_type,scope_id,"analytics:reports:manage"
        )
        if not allowed:
            raise APIError(403,"analytics_report_scope_denied","Report creation is outside the assigned tenant or organizational scope.")
        async with connection.transaction():
            return await self.repository.create_report(connection,organization_id,principal.user_id,payload)

    @staticmethod
    def _create_signed_url(artifact_path:str)->str:
        settings=get_settings()
        secret=settings.supabase_secret_key
        if secret is None:
            raise APIError(503,"analytics_storage_not_configured","Private report storage signing is not configured on the API.")
        encoded=urllib.parse.quote(artifact_path,safe="/")
        url=f"{str(settings.supabase_url).rstrip('/')}/storage/v1/object/sign/analytics-private/{encoded}"
        payload=json.dumps({"expiresIn":60}).encode()
        key=secret.get_secret_value()
        request=urllib.request.Request(url,data=payload,method="POST",headers={
            "Authorization":"Bearer "+key,"apikey":key,"Content-Type":"application/json",
        })
        try:
            with urllib.request.urlopen(request,timeout=8) as response:
                body=json.loads(response.read().decode())
        except (urllib.error.HTTPError,urllib.error.URLError,TimeoutError) as exc:
            raise APIError(503,"analytics_storage_sign_failed","The private report download could not be signed.") from exc
        signed=body.get("signedURL")
        if not isinstance(signed,str) or not signed:
            raise APIError(503,"analytics_storage_sign_failed","The storage provider returned no signed download URL.")
        if signed.startswith("http://") or signed.startswith("https://"):
            return signed
        return f"{str(settings.supabase_url).rstrip('/')}/storage/v1"+(signed if signed.startswith("/") else "/"+signed)

    async def download_report(self,connection,organization_id,tenant,principal,report_run_id):
        self._tenant(organization_id,tenant)
        artifact=await self.repository.completed_report_artifact(
            connection,organization_id,principal.user_id,report_run_id
        )
        if not artifact:
            raise APIError(404,"analytics_report_not_available","The requested report is unavailable or not authorized.")
        signed=await asyncio.to_thread(self._create_signed_url,artifact["artifact_path"])
        await self.repository.record_report_access(connection,organization_id,principal.user_id,report_run_id,"signed_url_issued")
        return {"report_run_id":str(report_run_id),"download_url":signed,"expires_in_seconds":60}


analytics_service=AnalyticsService()
