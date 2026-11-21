from __future__ import annotations

from datetime import date
from uuid import UUID

import asyncpg

from app.errors import APIError
from app.security.dependencies import Principal, TenantContext


class AnalyticsService:
    """Deterministic analytics reads and durable report-run registration."""

    async def _scopes(self, connection: asyncpg.Connection, organization_id: UUID, user_id: UUID):
        rows = await connection.fetch(
            """select distinct ura.scope_type, ura.scope_id
               from public.organization_memberships m
               join public.user_role_assignments ura on ura.membership_id=m.id
               join public.role_permissions rp on rp.role_id=ura.role_id
               where m.organization_id=$1 and m.user_id=$2 and m.status='active'
                 and ura.revoked_at is null and ura.starts_at<=now()
                 and (ura.expires_at is null or ura.expires_at>now())
                 and rp.permission_key='analytics:dashboard:read'""",
            organization_id,
            user_id,
        )
        scopes = {(row["scope_type"], row["scope_id"]) for row in rows}
        if any(scope_type in ("tenant", "organization") and scope_id == organization_id for scope_type, scope_id in scopes):
            return [("tenant", None)]
        if not scopes:
            raise APIError(403, "analytics_scope_denied", "No analytics scope is assigned to this user.")
        return sorted(scopes, key=lambda item: (item[0], str(item[1])))

    async def dashboard(
        self,
        connection: asyncpg.Connection,
        organization_id: UUID,
        tenant: TenantContext,
        principal: Principal,
        period_start: date,
        period_end: date,
        grain: str,
    ):
        if tenant.organization_id != organization_id:
            raise APIError(403, "forbidden", "Cross-tenant analytics access is denied.")
        scopes = await self._scopes(connection, organization_id, principal.user_id)
        rows = await connection.fetch(
            """select s.metric_key,s.period_start,s.period_end,s.scope_type,s.scope_id,
                      s.metric_value,s.dimensions,s.source_watermark,s.calculated_at
               from public.analytics_metric_snapshots s
               where s.organization_id=$1 and s.period_grain=$2
                 and s.period_start >= $3 and s.period_start <= $4
                 and exists (
                   select 1 from public.organization_memberships m
                   join public.user_role_assignments ura on ura.membership_id=m.id
                   join public.role_permissions rp on rp.role_id=ura.role_id
                   where m.organization_id=s.organization_id and m.user_id=$5 and m.status='active'
                     and ura.revoked_at is null and ura.starts_at<=now()
                     and (ura.expires_at is null or ura.expires_at>now())
                     and rp.permission_key='analytics:dashboard:read'
                     and (
                       (s.scope_type='tenant' and ura.scope_type in ('tenant','organization') and ura.scope_id=m.organization_id)
                       or (s.scope_type='branch' and ura.scope_type='branch' and ura.scope_id=s.scope_id)
                       or (s.scope_type='team' and ura.scope_type='team' and ura.scope_id=s.scope_id)
                       or (s.scope_type='territory' and ura.scope_type='territory' and ura.scope_id=s.scope_id)
                       or (s.scope_type='user' and s.scope_id=$5)
                     )
                 )
               order by s.period_start,s.metric_key,s.scope_type,s.scope_id""",
            organization_id,
            grain,
            period_start,
            period_end,
            principal.user_id,
        )
        freshness = await connection.fetchval(
            """select max(calculated_at) from public.analytics_metric_snapshots
               where organization_id=$1 and period_grain=$2 and period_start between $3 and $4""",
            organization_id,
            grain,
            period_start,
            period_end,
        )
        return {
            "organization_id": organization_id,
            "period_start": period_start,
            "period_end": period_end,
            "period_grain": grain,
            "scopes": [{"scope_type": kind, "scope_id": scope_id} for kind, scope_id in scopes],
            "metrics": [dict(row) for row in rows],
            "data_as_of": freshness,
            "is_stale": freshness is None,
        }

    async def list_reports(
        self, connection: asyncpg.Connection, organization_id: UUID, tenant: TenantContext,
        principal: Principal, limit: int,
    ):
        if tenant.organization_id != organization_id:
            raise APIError(403, "forbidden", "Cross-tenant report access is denied.")
        return await connection.fetch(
            """select id,report_key,period_start,period_end,period_grain,scope_type,scope_id,
                      status,requested_at,started_at,completed_at,data_as_of,row_count,artifact_path,error_code
               from public.analytics_report_runs
               where organization_id=$1
                 and (requested_by=$2 or exists (
                   select 1 from public.organization_memberships m
                   join public.user_role_assignments ura on ura.membership_id=m.id
                   join public.role_permissions rp on rp.role_id=ura.role_id
                   where m.organization_id=$1 and m.user_id=$2 and m.status='active'
                     and ura.revoked_at is null and rp.permission_key='analytics:reports:read'
                     and ura.scope_type in ('tenant','organization') and ura.scope_id=m.organization_id
                 ))
               order by requested_at desc limit $3""",
            organization_id, principal.user_id, limit,
        )

    async def create_report(
        self, connection: asyncpg.Connection, organization_id: UUID, tenant: TenantContext,
        principal: Principal, payload: dict,
    ):
        if tenant.organization_id != organization_id:
            raise APIError(403, "forbidden", "Cross-tenant report creation is denied.")
        allowed = await connection.fetchval(
            """select exists(
                 select 1 from public.organization_memberships m
                 join public.user_role_assignments ura on ura.membership_id=m.id
                 join public.role_permissions rp on rp.role_id=ura.role_id
                 where m.organization_id=$1 and m.user_id=$2 and m.status='active'
                   and ura.revoked_at is null and rp.permission_key='analytics:reports:manage'
                   and ura.scope_type in ('tenant','organization') and ura.scope_id=m.organization_id
               )""",
            organization_id, principal.user_id,
        )
        if not allowed:
            raise APIError(403, "analytics_report_scope_denied", "Report runs require tenant-scoped report management permission.")
        if payload["period_end"] < payload["period_start"]:
            raise APIError(422, "invalid_report_period", "Report end date must not precede start date.")
        if payload["scope_type"] != "tenant" or payload.get("scope_id") is not None:
            raise APIError(422, "unsupported_report_scope", "Tenant report runs are enabled; scoped report exports are queued for the next analytics slice.")
        async with connection.transaction():
            row = await connection.fetchrow(
                """insert into public.analytics_report_runs
                   (organization_id,report_key,requested_by,period_start,period_end,period_grain,
                    scope_type,scope_id,idempotency_key,parameters)
                   values ($1,$2,$3,$4,$5,$6,'tenant',null,$7,$8::jsonb)
                   on conflict (organization_id,requested_by,idempotency_key)
                   do update set idempotency_key=excluded.idempotency_key
                   returning id,report_key,status,period_start,period_end,period_grain,requested_at""",
                organization_id, payload["report_key"], principal.user_id,
                payload["period_start"], payload["period_end"], payload["period_grain"],
                payload["idempotency_key"], __import__("json").dumps(payload.get("parameters", {})),
            )
        return dict(row)


analytics_service = AnalyticsService()
