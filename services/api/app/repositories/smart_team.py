from __future__ import annotations
from typing import Any
from uuid import UUID
import asyncpg

class SmartTeamRepository:
    async def profile_for_user(self, connection: asyncpg.Connection, organization_id: UUID, user_id: UUID):
        return await connection.fetchrow(
            """select id,user_id,team_id,territory_id,status from public.sales_profiles
               where organization_id=$1 and user_id=$2 and status='active' and effective_from<=current_date
               and (effective_until is null or effective_until>=current_date)""",
            organization_id,user_id)

    async def profile_in_org(self, connection: asyncpg.Connection, organization_id: UUID, profile_id: UUID):
        return await connection.fetchrow(
            """select id,user_id,team_id,territory_id,status from public.sales_profiles
               where organization_id=$1 and id=$2 and status='active'""",organization_id,profile_id)

    async def can_access_profile(self, connection: asyncpg.Connection, organization_id: UUID, profile_id: UUID, actor_id: UUID) -> bool:
        return bool(await connection.fetchval(
            """select exists(select 1 from public.sales_profiles sp
               where sp.organization_id=$1 and sp.id=$2 and (
                 sp.user_id=$3 or sp.manager_user_id=$3 or exists(
                   select 1 from public.teams t where t.organization_id=sp.organization_id
                   and t.id=sp.team_id and t.supervisor_user_id=$3
                 ) or exists(
                   select 1 from public.organization_memberships m
                   join public.user_role_assignments ura on ura.membership_id=m.id and ura.revoked_at is null
                   join public.roles r on r.id=ura.role_id
                   where m.organization_id=$1 and m.user_id=$3 and m.status='active'
                   and r.key in ('company_admin','tenant_owner','platform_admin')
                 )
               ))""",organization_id,profile_id,actor_id))

    async def outlet_is_assigned(self, connection: asyncpg.Connection, organization_id: UUID, profile_id: UUID, outlet_id: UUID) -> bool:
        return bool(await connection.fetchval(
            """select exists(select 1 from public.outlet_assignment_history
               where organization_id=$1 and sales_profile_id=$2 and outlet_id=$3
               and assignment_status='active' and unassigned_at is null)""",
            organization_id,profile_id,outlet_id))

    async def list_visits(self, connection: asyncpg.Connection, organization_id: UUID, actor_id: UUID, profile_id: UUID | None, status: str | None, limit: int, offset: int):
        return await connection.fetch(
            """select v.*,o.code outlet_code,o.name outlet_name,o.address,o.city,
                      sp.user_id sales_user_id,sp.employee_code,t.name team_name
               from public.smartteam_visits v
               join public.outlets o on o.organization_id=v.organization_id and o.id=v.outlet_id
               join public.sales_profiles sp on sp.organization_id=v.organization_id and sp.id=v.sales_profile_id
               left join public.teams t on t.organization_id=sp.organization_id and t.id=sp.team_id
               where v.organization_id=$1
                 and ($2::uuid is null or v.sales_profile_id=$2)
                 and ($3::text is null or v.status=$3)
                 and (sp.user_id=$4 or sp.manager_user_id=$4 or exists(
                   select 1 from public.teams tm where tm.organization_id=sp.organization_id
                   and tm.id=sp.team_id and tm.supervisor_user_id=$4
                 ) or exists(
                   select 1 from public.user_role_assignments ura
                   join public.roles r on r.id=ura.role_id
                   where ura.membership_id=(select id from public.organization_memberships where organization_id=$1 and user_id=$4 and status='active' limit 1)
                     and ura.revoked_at is null and r.key in ('company_admin','tenant_owner')
                 ))
               order by v.scheduled_at desc limit $5 offset $6""",
            organization_id,profile_id,status,actor_id,limit,offset)

    async def create_visit(self, connection: asyncpg.Connection, organization_id: UUID, actor_id: UUID, data: dict[str,Any]):
        async with connection.transaction():
            existing=await connection.fetchrow(
                "select * from public.smartteam_visits where organization_id=$1 and idempotency_key=$2",
                organization_id,data["idempotency_key"])
            if existing: return existing
            profile=await self.profile_in_org(connection,organization_id,data["sales_profile_id"])
            if profile is None: raise ValueError("sales_profile_not_found")
            if not await self.can_access_profile(connection,organization_id,data["sales_profile_id"],actor_id):
                raise ValueError("profile_scope_forbidden")
            outlet=await connection.fetchval(
                "select exists(select 1 from public.outlets where organization_id=$1 and id=$2 and status='active')",
                organization_id,data["outlet_id"])
            if not outlet: raise ValueError("outlet_not_found")
            assigned=await self.outlet_is_assigned(connection,organization_id,data["sales_profile_id"],data["outlet_id"])
            if not assigned: raise ValueError("outlet_not_assigned")
            row=await connection.fetchrow(
                """insert into public.smartteam_visits
                (organization_id,sales_profile_id,outlet_id,branch_id,team_id,assigned_by,scheduled_at,window_end_at,notes,idempotency_key)
                values ($1,$2,$3,(select branch_id from public.outlets where organization_id=$1 and id=$3),
                  (select team_id from public.sales_profiles where organization_id=$1 and id=$2),
                  $4,$5,$6,$7,$8) returning *""",
                organization_id,data["sales_profile_id"],data["outlet_id"],actor_id,data["scheduled_at"],
                data.get("window_end_at"),data.get("notes"),data["idempotency_key"])
            await connection.execute(
                """insert into public.smartteam_visit_events(organization_id,visit_id,actor_user_id,event_type,to_status)
                   values($1,$2,$3,'created',$4)""",organization_id,row["id"],actor_id,row["status"])
            return row

    async def visit(self, connection: asyncpg.Connection, organization_id: UUID, visit_id: UUID):
        return await connection.fetchrow(
            "select * from public.smartteam_visits where organization_id=$1 and id=$2",organization_id,visit_id)

    async def check_in(self, connection: asyncpg.Connection, organization_id: UUID, actor_id: UUID, visit_id: UUID, location: dict[str,Any]):
        async with connection.transaction():
            row=await self.visit(connection,organization_id,visit_id)
            if row is None: raise ValueError("visit_not_found")
            if row["status"] not in ("scheduled","assigned"): raise ValueError("visit_transition_invalid")
            if not await self.can_access_profile(connection,organization_id,row["sales_profile_id"],actor_id):
                raise ValueError("profile_scope_forbidden")
            if not await self.outlet_is_assigned(connection,organization_id,row["sales_profile_id"],row["outlet_id"]):
                raise ValueError("outlet_assignment_inactive")
            updated=await connection.fetchrow(
                """update public.smartteam_visits set status='in_progress',check_in_at=now(),
                check_in_latitude=$3,check_in_longitude=$4,check_in_accuracy_m=$5,check_in_source=$6,updated_at=now()
                where organization_id=$1 and id=$2 and check_in_at is null returning *""",
                organization_id,visit_id,location["latitude"],location["longitude"],location["accuracy_m"],location["source"])
            if updated is None: raise ValueError("visit_already_checked_in")
            await connection.execute(
                """insert into public.smartteam_visit_events(organization_id,visit_id,actor_user_id,event_type,from_status,to_status)
                   values($1,$2,$3,'checked_in',$4,$5)""",organization_id,visit_id,actor_id,row["status"],updated["status"])
            return updated

    async def check_out(self, connection: asyncpg.Connection, organization_id: UUID, actor_id: UUID, visit_id: UUID, location: dict[str,Any], outcome: str | None, notes: str | None):
        async with connection.transaction():
            row=await self.visit(connection,organization_id,visit_id)
            if row is None: raise ValueError("visit_not_found")
            if row["status"]!="in_progress" or row["check_in_at"] is None: raise ValueError("visit_transition_invalid")
            if not await self.can_access_profile(connection,organization_id,row["sales_profile_id"],actor_id):
                raise ValueError("profile_scope_forbidden")
            if not await self.outlet_is_assigned(connection,organization_id,row["sales_profile_id"],row["outlet_id"]):
                raise ValueError("outlet_assignment_inactive")
            updated=await connection.fetchrow(
                """update public.smartteam_visits set status='completed',check_out_at=now(),outcome=coalesce($3,outcome),
                notes=coalesce($4,notes),check_out_latitude=$5,check_out_longitude=$6,check_out_accuracy_m=$7,
                check_out_source=$8,updated_at=now() where organization_id=$1 and id=$2 and status='in_progress' returning *""",
                organization_id,visit_id,outcome,notes,location["latitude"],location["longitude"],location["accuracy_m"],location["source"])
            if updated is None: raise ValueError("visit_transition_invalid")
            await connection.execute(
                """insert into public.smartteam_visit_events(organization_id,visit_id,actor_user_id,event_type,from_status,to_status)
                   values($1,$2,$3,'checked_out',$4,$5)""",organization_id,visit_id,row["status"],updated["status"])
            return updated

    async def cancel_visit(self, connection: asyncpg.Connection, organization_id: UUID, actor_id: UUID, visit_id: UUID, reason: str):
        async with connection.transaction():
            row=await self.visit(connection,organization_id,visit_id)
            if row is None: raise ValueError("visit_not_found")
            if row["status"] not in ("scheduled","assigned"): raise ValueError("visit_transition_invalid")
            if not await self.can_access_profile(connection,organization_id,row["sales_profile_id"],actor_id):
                raise ValueError("profile_scope_forbidden")
            updated=await connection.fetchrow(
                """update public.smartteam_visits set status='cancelled',cancel_reason=$3,updated_at=now()
                   where organization_id=$1 and id=$2 returning *""",organization_id,visit_id,reason)
            await connection.execute(
                """insert into public.smartteam_visit_events(organization_id,visit_id,actor_user_id,event_type,from_status,to_status,reason)
                   values($1,$2,$3,'cancelled',$4,$5,$6)""",organization_id,visit_id,actor_id,row["status"],updated["status"],reason)
            return updated

    async def list_shifts(self, connection: asyncpg.Connection, organization_id: UUID, actor_id: UUID, limit: int, offset: int):
        return await connection.fetch(
            """select sh.*,sp.employee_code,p.display_name,tm.name team_name
               from public.smartteam_shifts sh join public.sales_profiles sp on sp.organization_id=sh.organization_id and sp.id=sh.sales_profile_id
               join public.profiles p on p.id=sh.user_id left join public.teams tm on tm.organization_id=sh.organization_id and tm.id=sh.team_id
               where sh.organization_id=$1 and (sh.user_id=$2 or sp.manager_user_id=$2 or exists(
                select 1 from public.teams t where t.organization_id=sh.organization_id and t.id=sh.team_id and t.supervisor_user_id=$2)
                or exists(select 1 from public.organization_memberships m join public.user_role_assignments ura on ura.membership_id=m.id
                join public.roles r on r.id=ura.role_id where m.organization_id=$1 and m.user_id=$2 and m.status='active'
                and r.key in ('company_admin','tenant_owner') and ura.revoked_at is null))
               order by sh.shift_date desc limit $3 offset $4""",organization_id,actor_id,limit,offset)

    async def clock_in(self, connection: asyncpg.Connection, organization_id: UUID, actor_id: UUID, location: dict[str,Any], key: str):
        profile=await self.profile_for_user(connection,organization_id,actor_id)
        if profile is None: raise ValueError("active_sales_profile_required")
        async with connection.transaction():
            existing=await connection.fetchrow(
                "select * from public.smartteam_shifts where organization_id=$1 and user_id=$2 and shift_date=current_date",
                organization_id,actor_id)
            if existing:
                if existing["status"]=="active": return existing
                raise ValueError("shift_already_closed_today")
            return await connection.fetchrow(
                """insert into public.smartteam_shifts(organization_id,sales_profile_id,user_id,branch_id,team_id,shift_date,status,
                clock_in_at,clock_in_latitude,clock_in_longitude,clock_in_accuracy_m,clock_in_source,idempotency_key,created_by)
                values($1,$2,$3,(select branch_id from public.outlets where organization_id=$1 and id=(select outlet_id from public.outlet_assignment_history where organization_id=$1 and sales_profile_id=$2 and assignment_status='active' limit 1)),
                $4,current_date,'active',now(),$5,$6,$7,$8,$9,$3) returning *""",
                organization_id,profile["id"],actor_id,profile["team_id"],location["latitude"],location["longitude"],
                location["accuracy_m"],location["source"],key)

    async def clock_out(self, connection: asyncpg.Connection, organization_id: UUID, actor_id: UUID, location: dict[str,Any]):
        async with connection.transaction():
            row=await connection.fetchrow(
                """update public.smartteam_shifts set status='completed',clock_out_at=now(),clock_out_latitude=$3,
                clock_out_longitude=$4,clock_out_accuracy_m=$5,clock_out_source=$6,updated_at=now()
                where organization_id=$1 and user_id=$2 and shift_date=current_date and status='active' returning *""",
                organization_id,actor_id,location["latitude"],location["longitude"],location["accuracy_m"],location["source"])
            if row is None: raise ValueError("active_shift_not_found")
            return row

    async def correct_attendance(self, connection: asyncpg.Connection, organization_id: UUID, actor_id: UUID, shift_id: UUID, clock_in_at, clock_out_at, reason: str):
        async with connection.transaction():
            shift=await connection.fetchrow("select sales_profile_id from public.smartteam_shifts where organization_id=$1 and id=$2",organization_id,shift_id)
            if shift is None: raise ValueError("shift_not_found")
            if not await self.can_access_profile(connection,organization_id,shift["sales_profile_id"],actor_id):
                raise ValueError("profile_scope_forbidden")
            row=await connection.fetchrow(
                """update public.smartteam_shifts set clock_in_at=coalesce($3,clock_in_at),clock_out_at=coalesce($4,clock_out_at),
                status=case when coalesce($4,clock_out_at) is not null then 'completed' else status end,
                correction_reason=$5,corrected_by=$6,corrected_at=now(),updated_at=now()
                where organization_id=$1 and id=$2 returning *""",
                organization_id,shift_id,clock_in_at,clock_out_at,reason,actor_id)
            if row is None: raise ValueError("shift_not_found")
            return row

    async def list_activities(self, connection: asyncpg.Connection, organization_id: UUID, actor_id: UUID, limit: int, offset: int):
        return await connection.fetch(
            """select a.*,sp.user_id sales_user_id,sp.employee_code from public.smartteam_activities a
               join public.sales_profiles sp on sp.organization_id=a.organization_id and sp.id=a.sales_profile_id
               where a.organization_id=$1 and (sp.user_id=$2 or sp.manager_user_id=$2 or exists(
                select 1 from public.teams t where t.organization_id=sp.organization_id and t.id=sp.team_id and t.supervisor_user_id=$2)
                or exists(select 1 from public.organization_memberships m join public.user_role_assignments ura on ura.membership_id=m.id
                join public.roles r on r.id=ura.role_id where m.organization_id=$1 and m.user_id=$2 and m.status='active'
                and r.key in ('company_admin','tenant_owner') and ura.revoked_at is null))
               order by a.created_at desc limit $3 offset $4""",organization_id,actor_id,limit,offset)

    async def create_activity(self, connection: asyncpg.Connection, organization_id: UUID, actor_id: UUID, data: dict[str,Any]):
        async with connection.transaction():
            existing=await connection.fetchrow("select * from public.smartteam_activities where organization_id=$1 and idempotency_key=$2",organization_id,data["idempotency_key"])
            if existing:return existing
            profile=await self.profile_in_org(connection,organization_id,data["sales_profile_id"])
            if profile is None:raise ValueError("sales_profile_not_found")
            if not await self.can_access_profile(connection,organization_id,data["sales_profile_id"],actor_id):
                raise ValueError("profile_scope_forbidden")
            if data.get("visit_id"):
                linked_visit=await self.visit(connection,organization_id,data["visit_id"])
                if linked_visit is None:raise ValueError("visit_not_found")
                if linked_visit["sales_profile_id"]!=data["sales_profile_id"]:raise ValueError("visit_profile_mismatch")
            return await connection.fetchrow(
                """insert into public.smartteam_activities(organization_id,sales_profile_id,visit_id,created_by,activity_type,title,description,due_at,idempotency_key)
                   values($1,$2,$3,$4,$5,$6,$7,$8,$9) returning *""",
                organization_id,data["sales_profile_id"],data.get("visit_id"),actor_id,data["activity_type"],data["title"],data.get("description"),data.get("due_at"),data["idempotency_key"])

    async def update_activity(self, connection: asyncpg.Connection, organization_id: UUID, actor_id: UUID, activity_id: UUID, data: dict[str,Any]):
        existing=await connection.fetchrow("select sales_profile_id from public.smartteam_activities where organization_id=$1 and id=$2",organization_id,activity_id)
        if existing is None: return None
        if not await self.can_access_profile(connection,organization_id,existing["sales_profile_id"],actor_id):
            raise ValueError("profile_scope_forbidden")
        assignments=[];values=[organization_id,activity_id]
        for field in ("title","description","due_at","status"):
            if field in data:
                values.append(data[field]);assignments.append(f"{field}=${len(values)}")
        if not assignments: return await connection.fetchrow("select * from public.smartteam_activities where organization_id=$1 and id=$2",organization_id,activity_id)
        assignments.append("completed_at=case when $"+str(len(values)+1)+"='completed' then now() when $"+str(len(values)+1)+"='open' then null else completed_at end")
        values.append(data.get("status"))
        assignments.append("updated_at=now()")
        return await connection.fetchrow("update public.smartteam_activities set "+",".join(assignments)+" where organization_id=$1 and id=$2 returning *",*values)

    async def list_targets(self, connection: asyncpg.Connection, organization_id: UUID, actor_id: UUID, limit: int, offset: int):
        return await connection.fetch(
            """select t.*,sp.employee_code,tm.name team_name,b.name branch_name from public.smartteam_targets t
               left join public.sales_profiles sp on sp.organization_id=t.organization_id and sp.id=t.sales_profile_id
               left join public.teams tm on tm.organization_id=t.organization_id and tm.id=t.team_id
               left join public.branches b on b.organization_id=t.organization_id and b.id=t.branch_id
               where t.organization_id=$1 and (
                 (t.sales_profile_id is not null and (sp.user_id=$2 or sp.manager_user_id=$2 or exists(select 1 from public.teams st where st.organization_id=sp.organization_id and st.id=sp.team_id and st.supervisor_user_id=$2)))
                 or (t.team_id is not null and exists(select 1 from public.teams st where st.organization_id=t.organization_id and st.id=t.team_id and st.supervisor_user_id=$2))
                 or (t.branch_id is not null and exists(select 1 from public.organization_memberships m join public.user_role_assignments ura on ura.membership_id=m.id join public.roles r on r.id=ura.role_id where m.organization_id=$1 and m.user_id=$2 and m.status='active' and r.key in ('company_admin','tenant_owner','platform_admin') and ura.revoked_at is null))
                 or exists(select 1 from public.organization_memberships m join public.user_role_assignments ura on ura.membership_id=m.id join public.roles r on r.id=ura.role_id where m.organization_id=$1 and m.user_id=$2 and m.status='active' and r.key in ('company_admin','tenant_owner','platform_admin') and ura.revoked_at is null)
               ) order by t.period_start desc limit $3 offset $4""",organization_id,actor_id,limit,offset)

    async def create_target(self, connection: asyncpg.Connection, organization_id: UUID, actor_id: UUID, data: dict[str,Any]):
        scope_field=next(field for field in ("sales_profile_id","team_id","branch_id") if data.get(field) is not None)
        table={"sales_profile_id":"sales_profiles","team_id":"teams","branch_id":"branches"}[scope_field]
        exists=await connection.fetchval(f"select exists(select 1 from public.{table} where organization_id=$1 and id=$2 and status='active')",organization_id,data[scope_field])
        if not exists: raise ValueError("target_scope_not_found")
        if scope_field=="sales_profile_id" and not await self.can_access_profile(connection,organization_id,data[scope_field],actor_id):
            raise ValueError("profile_scope_forbidden")
        if scope_field=="team_id":
            team_allowed=await connection.fetchval("""select exists(select 1 from public.teams where organization_id=$1 and id=$2 and supervisor_user_id=$3)
              or exists(select 1 from public.organization_memberships m join public.user_role_assignments ura on ura.membership_id=m.id join public.roles r on r.id=ura.role_id
              where m.organization_id=$1 and m.user_id=$3 and m.status='active' and r.key in ('company_admin','tenant_owner','platform_admin') and ura.revoked_at is null)""",organization_id,data[scope_field],actor_id)
            if not team_allowed: raise ValueError("profile_scope_forbidden")
        if scope_field=="branch_id":
            branch_allowed=await connection.fetchval("""select exists(select 1 from public.organization_memberships m join public.user_role_assignments ura on ura.membership_id=m.id join public.roles r on r.id=ura.role_id
              where m.organization_id=$1 and m.user_id=$2 and m.status='active' and r.key in ('company_admin','tenant_owner','platform_admin') and ura.revoked_at is null)""",organization_id,actor_id)
            if not branch_allowed: raise ValueError("profile_scope_forbidden")
        return await connection.fetchrow(
            """insert into public.smartteam_targets(organization_id,sales_profile_id,team_id,branch_id,metric_key,period_start,period_end,target_value,created_by,updated_by)
               values($1,$2,$3,$4,$5,$6,$7,$8,$9,$9) returning *""",
            organization_id,data.get("sales_profile_id"),data.get("team_id"),data.get("branch_id"),data["metric_key"],data["period_start"],data["period_end"],data["target_value"],actor_id)

smart_team_repository=SmartTeamRepository()
