from __future__ import annotations

import json
from uuid import UUID

import asyncpg


class AnalyticsRepository:
    async def list_scopes(self, connection: asyncpg.Connection, organization_id: UUID, user_id: UUID):
        return await connection.fetch(
            """select distinct case when r.key='sales_rep' then 'user' else ura.scope_type end scope_type,
                      case when r.key='sales_rep' then m.user_id else ura.scope_id end scope_id
               from public.organization_memberships m
               join public.user_role_assignments ura on ura.membership_id=m.id
               join public.roles r on r.id=ura.role_id
               join public.role_permissions rp on rp.role_id=ura.role_id
               where m.organization_id=$1 and m.user_id=$2 and m.status='active'
                 and ura.revoked_at is null and ura.starts_at<=now()
                 and (ura.expires_at is null or ura.expires_at>now())
                 and rp.permission_key='analytics:dashboard:read'""",
            organization_id,user_id,
        )

    async def dashboard_metrics(self,connection,organization_id,user_id,start,end,grain):
        return await connection.fetch(
            """select s.metric_key,s.period_start,s.period_end,s.scope_type,s.scope_id,
                      s.metric_value,s.dimensions,s.source_watermark,s.calculated_at
               from public.analytics_metric_snapshots s
               where s.organization_id=$1 and s.period_grain=$2
                 and s.period_start between $3 and $4
                 and exists (
                   select 1 from public.organization_memberships m
                   join public.user_role_assignments ura on ura.membership_id=m.id
                   join public.roles r on r.id=ura.role_id
                   join public.role_permissions rp on rp.role_id=ura.role_id
                   where m.organization_id=s.organization_id and m.user_id=$5 and m.status='active'
                     and ura.revoked_at is null and ura.starts_at<=now()
                     and (ura.expires_at is null or ura.expires_at>now())
                     and rp.permission_key='analytics:dashboard:read'
                     and (
                       (s.scope_type='tenant' and ura.scope_type in ('tenant','organization') and ura.scope_id=m.organization_id)
                       or (s.scope_type='branch' and r.key='supervisor' and ura.scope_type='branch' and ura.scope_id=s.scope_id)
                       or (s.scope_type='team' and ura.scope_type='team' and ura.scope_id=s.scope_id)
                       or (s.scope_type='territory' and ura.scope_type='territory' and ura.scope_id=s.scope_id)
                       or (s.scope_type='user' and s.scope_id=$5)
                       or (ura.scope_type in ('tenant','organization') and ura.scope_id=m.organization_id)
                     )
                 )
               order by s.period_start,s.metric_key,s.scope_type,s.scope_id""",
            organization_id,grain,start,end,user_id,
        )

    async def dashboard_freshness(self,connection,organization_id,start,end,grain):
        return await connection.fetchval(
            """select max(calculated_at) from public.analytics_metric_snapshots
               where organization_id=$1 and period_grain=$2 and period_start between $3 and $4""",
            organization_id,grain,start,end,
        )

    async def can_access_scope(self,connection,organization_id,user_id,scope_type,scope_id,permission):
        if scope_type=="tenant":
            return bool(await connection.fetchval(
                """select exists(select 1 from public.organization_memberships m
                   join public.user_role_assignments ura on ura.membership_id=m.id
                   join public.role_permissions rp on rp.role_id=ura.role_id
                   where m.organization_id=$1 and m.user_id=$2 and m.status='active'
                     and ura.revoked_at is null and ura.starts_at<=now()
                     and (ura.expires_at is null or ura.expires_at>now())
                     and rp.permission_key=$3 and ura.scope_type in ('tenant','organization')
                     and ura.scope_id=m.organization_id)""",
                organization_id,user_id,permission,
            ))
        if scope_type=="user" and scope_id==user_id:
            return bool(await connection.fetchval(
                """select exists(select 1 from public.organization_memberships m
                   join public.user_role_assignments ura on ura.membership_id=m.id
                   join public.role_permissions rp on rp.role_id=ura.role_id
                   where m.organization_id=$1 and m.user_id=$2 and m.status='active'
                     and ura.revoked_at is null and ura.starts_at<=now()
                     and (ura.expires_at is null or ura.expires_at>now())
                     and rp.permission_key=$3)""",
                organization_id,user_id,permission,
            ))
        return bool(await connection.fetchval(
            """select exists(select 1 from public.organization_memberships m
               join public.user_role_assignments ura on ura.membership_id=m.id
               join public.role_permissions rp on rp.role_id=ura.role_id
               where m.organization_id=$1 and m.user_id=$2 and m.status='active'
                 and ura.revoked_at is null and ura.starts_at<=now()
                 and (ura.expires_at is null or ura.expires_at>now())
                 and rp.permission_key=$5 and (
                   (ura.scope_type in ('tenant','organization') and ura.scope_id=m.organization_id)
                   or (ura.scope_type=$3 and ura.scope_id=$4)
                 ))""",
            organization_id,user_id,scope_type,scope_id,permission,
        ))

    async def list_reports(self,connection,organization_id,user_id,limit):
        return await connection.fetch(
            """select r.id,r.report_key,r.period_start,r.period_end,r.period_grain,r.scope_type,r.scope_id,
                      r.status,r.requested_at,r.started_at,r.completed_at,r.data_as_of,r.row_count,r.error_code,
                      e.id export_id,e.status export_status,e.requested_at export_requested_at,
                      e.completed_at export_completed_at,e.artifact_bytes
               from public.analytics_report_runs r
               left join lateral (
                 select x.* from public.analytics_report_exports x
                 where x.report_run_id=r.id and x.organization_id=r.organization_id
                 order by x.requested_at desc limit 1
               ) e on true
               where r.organization_id=$1 and (
                 r.requested_by=$2 or exists (
                   select 1 from public.organization_memberships m
                   join public.user_role_assignments ura on ura.membership_id=m.id
                   join public.role_permissions rp on rp.role_id=ura.role_id
                   where m.organization_id=r.organization_id and m.user_id=$2 and m.status='active'
                     and ura.revoked_at is null and ura.starts_at<=now()
                     and (ura.expires_at is null or ura.expires_at>now())
                     and rp.permission_key='analytics:reports:read'
                     and ((ura.scope_type in ('tenant','organization') and ura.scope_id=m.organization_id)
                       or (ura.scope_type=r.scope_type and ura.scope_id=r.scope_id)
                       or (r.scope_type='user' and r.scope_id=$2))
                 ))
               order by r.requested_at desc limit $3""",
            organization_id,user_id,limit,
        )

    async def create_report(self,connection,organization_id,user_id,payload):
        row=await connection.fetchrow(
            """insert into public.analytics_report_runs
               (organization_id,report_key,requested_by,period_start,period_end,period_grain,
                scope_type,scope_id,idempotency_key,parameters)
               values($1,$2,$3,$4,$5,$6,$7,$8,$9,$10::jsonb)
               on conflict(organization_id,requested_by,idempotency_key)
               do update set idempotency_key=excluded.idempotency_key
               returning id,report_key,status,period_start,period_end,period_grain,scope_type,scope_id,requested_at""",
            organization_id,payload["report_key"],user_id,payload["period_start"],payload["period_end"],
            payload["period_grain"],payload["scope_type"],payload.get("scope_id"),
            payload["idempotency_key"],json.dumps(payload.get("parameters",{})),
        )
        export=await connection.fetchrow(
            """insert into public.analytics_report_exports
               (organization_id,report_run_id,requested_by,format,idempotency_key)
               values($1,$2,$3,'csv',$4)
               on conflict(organization_id,requested_by,idempotency_key)
               do update set idempotency_key=excluded.idempotency_key
               returning id,status,requested_at""",
            organization_id,row["id"],user_id,payload["idempotency_key"]+":csv",
        )
        return {**dict(row),"export_id":export["id"],"export_status":export["status"]}

    async def completed_report_artifact(self,connection,organization_id,user_id,report_run_id):
        return await connection.fetchrow(
            """select r.id report_run_id,r.scope_type,r.scope_id,e.artifact_path,e.status
               from public.analytics_report_runs r
               join public.analytics_report_exports e on e.report_run_id=r.id
                    and e.organization_id=r.organization_id
               where r.id=$1 and r.organization_id=$2 and e.status='completed'
                 and e.artifact_path is not null
                 and exists (
                   select 1 from public.organization_memberships m
                   join public.user_role_assignments ura on ura.membership_id=m.id
                   join public.role_permissions rp on rp.role_id=ura.role_id
                   where m.organization_id=r.organization_id and m.user_id=$3 and m.status='active'
                     and ura.revoked_at is null and ura.starts_at<=now()
                     and (ura.expires_at is null or ura.expires_at>now())
                     and rp.permission_key='analytics:reports:read'
                     and ((ura.scope_type in ('tenant','organization') and ura.scope_id=m.organization_id)
                       or (ura.scope_type=r.scope_type and ura.scope_id=r.scope_id)
                       or (r.scope_type='user' and r.scope_id=$3))
                 )
               order by e.completed_at desc limit 1""",
            report_run_id,organization_id,user_id,
        )


analytics_repository=AnalyticsRepository()
