from __future__ import annotations

import json
from datetime import date
from uuid import UUID

import asyncpg


class AnalyticsRepository:
    async def list_scopes(self, connection: asyncpg.Connection, organization_id: UUID, user_id: UUID):
        return await connection.fetch(
            """select distinct ura.scope_type, ura.scope_id
               from public.organization_memberships m
               join public.user_role_assignments ura on ura.membership_id=m.id
               join public.role_permissions rp on rp.role_id=ura.role_id
               where m.organization_id=$1 and m.user_id=$2 and m.status='active'
                 and ura.revoked_at is null and ura.starts_at<=now()
                 and (ura.expires_at is null or ura.expires_at>now())
                 and rp.permission_key='analytics:dashboard:read'""",
            organization_id, user_id,
        )

    async def dashboard_metrics(self, connection, organization_id, user_id, start, end, grain):
        return await connection.fetch(
            """select s.metric_key,s.period_start,s.period_end,s.scope_type,s.scope_id,
                      s.metric_value,s.dimensions,s.source_watermark,s.calculated_at
               from public.analytics_metric_snapshots s
               where s.organization_id=$1 and s.period_grain=$2
                 and s.period_start between $3 and $4
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
            organization_id, grain, start, end, user_id,
        )

    async def dashboard_freshness(self, connection, organization_id, start, end, grain):
        return await connection.fetchval(
            """select max(calculated_at) from public.analytics_metric_snapshots
               where organization_id=$1 and period_grain=$2 and period_start between $3 and $4""",
            organization_id, grain, start, end,
        )

    async def list_reports(self, connection, organization_id, user_id, limit):
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
            organization_id, user_id, limit,
        )

    async def can_manage_reports(self, connection, organization_id, user_id):
        return bool(await connection.fetchval(
            """select exists(
                 select 1 from public.organization_memberships m
                 join public.user_role_assignments ura on ura.membership_id=m.id
                 join public.role_permissions rp on rp.role_id=ura.role_id
                 where m.organization_id=$1 and m.user_id=$2 and m.status='active'
                   and ura.revoked_at is null and ura.starts_at<=now()
                   and (ura.expires_at is null or ura.expires_at>now())
                   and rp.permission_key='analytics:reports:manage'
                   and ura.scope_type in ('tenant','organization') and ura.scope_id=m.organization_id
               )""",
            organization_id, user_id,
        ))

    async def create_report(self, connection, organization_id, user_id, payload):
        return await connection.fetchrow(
            """insert into public.analytics_report_runs
               (organization_id,report_key,requested_by,period_start,period_end,period_grain,
                scope_type,scope_id,idempotency_key,parameters)
               values ($1,$2,$3,$4,$5,$6,'tenant',null,$7,$8::jsonb)
               on conflict (organization_id,requested_by,idempotency_key)
               do update set idempotency_key=excluded.idempotency_key
               returning id,report_key,status,period_start,period_end,period_grain,requested_at""",
            organization_id, payload["report_key"], user_id, payload["period_start"],
            payload["period_end"], payload["period_grain"], payload["idempotency_key"],
            json.dumps(payload.get("parameters", {})),
        )


analytics_repository = AnalyticsRepository()
