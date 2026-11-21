from __future__ import annotations

from datetime import date
from uuid import UUID

import asyncpg

from app.errors import APIError
from app.repositories.analytics import AnalyticsRepository, analytics_repository
from app.security.dependencies import Principal, TenantContext


class AnalyticsService:
    """Tenant and scope-aware application service for deterministic reporting."""

    def __init__(self, repository: AnalyticsRepository | None = None):
        self.repository = repository or analytics_repository

    @staticmethod
    def _tenant(organization_id: UUID, tenant: TenantContext) -> None:
        if tenant.organization_id != organization_id:
            raise APIError(403, "forbidden", "Cross-tenant analytics access is denied.")

    async def dashboard(
        self, connection: asyncpg.Connection, organization_id: UUID,
        tenant: TenantContext, principal: Principal, period_start: date,
        period_end: date, grain: str,
    ):
        self._tenant(organization_id, tenant)
        if period_end < period_start or (period_end - period_start).days > 366:
            raise APIError(422, "invalid_analytics_period", "Analytics period must be ordered and no longer than 366 days.")
        rows = await self.repository.list_scopes(connection, organization_id, principal.user_id)
        scopes = {(row["scope_type"], row["scope_id"]) for row in rows}
        if not scopes:
            raise APIError(403, "analytics_scope_denied", "No analytics dashboard scope is assigned.")
        tenant_scope = any(
            kind in ("tenant", "organization") and scope_id == organization_id
            for kind, scope_id in scopes
        )
        metrics = await self.repository.dashboard_metrics(
            connection, organization_id, principal.user_id, period_start, period_end, grain
        )
        freshness = await self.repository.dashboard_freshness(
            connection, organization_id, period_start, period_end, grain
        )
        return {
            "organization_id": organization_id,
            "period_start": period_start,
            "period_end": period_end,
            "period_grain": grain,
            "scopes": [{"scope_type": kind, "scope_id": scope_id} for kind, scope_id in sorted(scopes, key=lambda x: (x[0], str(x[1])))],
            "metrics": [dict(row) for row in metrics],
            "data_as_of": freshness,
            "is_stale": freshness is None,
            "tenant_scope": tenant_scope,
        }

    async def list_reports(
        self, connection: asyncpg.Connection, organization_id: UUID,
        tenant: TenantContext, principal: Principal, limit: int,
    ):
        self._tenant(organization_id, tenant)
        rows = await self.repository.list_reports(connection, organization_id, principal.user_id, limit)
        return [dict(row) for row in rows]

    async def create_report(
        self, connection: asyncpg.Connection, organization_id: UUID,
        tenant: TenantContext, principal: Principal, payload: dict,
    ):
        self._tenant(organization_id, tenant)
        if payload["period_end"] < payload["period_start"]:
            raise APIError(422, "invalid_report_period", "Report end date must not precede start date.")
        if (payload["period_end"] - payload["period_start"]).days > 366:
            raise APIError(422, "invalid_report_period", "Report period cannot exceed 366 days.")
        if payload["scope_type"] != "tenant" or payload.get("scope_id") is not None:
            raise APIError(422, "unsupported_report_scope", "Report creation currently accepts tenant scope only.")
        if not await self.repository.can_manage_reports(connection, organization_id, principal.user_id):
            raise APIError(403, "analytics_report_scope_denied", "Tenant-scoped report management permission is required.")
        async with connection.transaction():
            row = await self.repository.create_report(
                connection, organization_id, principal.user_id, payload
            )
        return dict(row)


analytics_service = AnalyticsService()
