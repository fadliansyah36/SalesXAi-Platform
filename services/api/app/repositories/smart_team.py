from __future__ import annotations
from typing import Any
from uuid import UUID
import json
import asyncpg


class SmartTeamRepository:
    async def profile_for_user(
        self, connection: asyncpg.Connection, organization_id: UUID, user_id: UUID
    ):
        return await connection.fetchrow(
            """select id,user_id,team_id,territory_id,status from public.sales_profiles
               where organization_id=$1 and user_id=$2 and status='active' and effective_from<=current_date
               and (effective_until is null or effective_until>=current_date)""",
            organization_id,
            user_id,
        )

    async def profile_in_org(
        self, connection: asyncpg.Connection, organization_id: UUID, profile_id: UUID
    ):
        return await connection.fetchrow(
            """select id,user_id,team_id,territory_id,status from public.sales_profiles
               where organization_id=$1 and id=$2 and status='active' and effective_from<=current_date
               and (effective_until is null or effective_until>=current_date)""",
            organization_id,
            profile_id,
        )

    async def can_access_profile(
        self,
        connection: asyncpg.Connection,
        organization_id: UUID,
        profile_id: UUID,
        actor_id: UUID,
    ) -> bool:
        return bool(
            await connection.fetchval(
                """select exists(select 1 from public.sales_profiles sp
               where sp.organization_id=$1 and sp.id=$2 and sp.status='active'
                 and sp.effective_from<=current_date and (sp.effective_until is null or sp.effective_until>=current_date) and (
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
               ))""",
                organization_id,
                profile_id,
                actor_id,
            )
        )

    async def outlet_is_assigned(
        self,
        connection: asyncpg.Connection,
        organization_id: UUID,
        profile_id: UUID,
        outlet_id: UUID,
    ) -> bool:
        return bool(
            await connection.fetchval(
                """select exists(select 1 from public.outlet_assignment_history
               where organization_id=$1 and sales_profile_id=$2 and outlet_id=$3
               and assignment_status='active' and unassigned_at is null)""",
                organization_id,
                profile_id,
                outlet_id,
            )
        )

    async def list_visits(
        self,
        connection: asyncpg.Connection,
        organization_id: UUID,
        actor_id: UUID,
        profile_id: UUID | None,
        status: str | None,
        limit: int,
        offset: int,
    ):
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
                     and ura.revoked_at is null and r.key in ('company_admin','tenant_owner','platform_admin')
                 ))
               order by v.scheduled_at desc limit $5 offset $6""",
            organization_id,
            profile_id,
            status,
            actor_id,
            limit,
            offset,
        )

    async def create_visit(
        self,
        connection: asyncpg.Connection,
        organization_id: UUID,
        actor_id: UUID,
        data: dict[str, Any],
    ):
        async with connection.transaction():
            existing = await connection.fetchrow(
                "select * from public.smartteam_visits where organization_id=$1 and idempotency_key=$2",
                organization_id,
                data["idempotency_key"],
            )
            if existing:
                return existing
            profile = await self.profile_in_org(
                connection, organization_id, data["sales_profile_id"]
            )
            if profile is None:
                raise ValueError("sales_profile_not_found")
            if not await self.can_access_profile(
                connection, organization_id, data["sales_profile_id"], actor_id
            ):
                raise ValueError("profile_scope_forbidden")
            outlet = await connection.fetchrow(
                "select branch_id,territory_id from public.outlets where organization_id=$1 and id=$2 and status='active'",
                organization_id,
                data["outlet_id"],
            )
            if outlet is None:
                raise ValueError("outlet_not_found")
            if profile["team_id"] is not None:
                team = await connection.fetchrow(
                    "select branch_id from public.teams where organization_id=$1 and id=$2 and status='active'",
                    organization_id,
                    profile["team_id"],
                )
                if team is None:
                    raise ValueError("sales_team_not_found")
                if team["branch_id"] is not None and outlet["branch_id"] != team["branch_id"]:
                    raise ValueError("outlet_branch_mismatch")
            if (
                profile["territory_id"] is not None
                and outlet["territory_id"] != profile["territory_id"]
            ):
                raise ValueError("outlet_territory_mismatch")
            assigned = await self.outlet_is_assigned(
                connection, organization_id, data["sales_profile_id"], data["outlet_id"]
            )
            if not assigned:
                raise ValueError("outlet_not_assigned")
            row = await connection.fetchrow(
                """insert into public.smartteam_visits
                (organization_id,sales_profile_id,outlet_id,branch_id,team_id,assigned_by,scheduled_at,window_end_at,notes,idempotency_key)
                values ($1,$2,$3,(select branch_id from public.outlets where organization_id=$1 and id=$3),
                  (select team_id from public.sales_profiles where organization_id=$1 and id=$2),
                  $4,$5,$6,$7,$8) returning *""",
                organization_id,
                data["sales_profile_id"],
                data["outlet_id"],
                actor_id,
                data["scheduled_at"],
                data.get("window_end_at"),
                data.get("notes"),
                data["idempotency_key"],
            )
            await connection.execute(
                """insert into public.smartteam_visit_events(organization_id,visit_id,actor_user_id,event_type,to_status,idempotency_key,metadata)
                   values($1,$2,$3,'created',$4,$5,$6::jsonb)""",
                organization_id,
                row["id"],
                actor_id,
                row["status"],
                data["idempotency_key"],
                json.dumps(
                    {
                        "sales_profile_id": str(data["sales_profile_id"]),
                        "outlet_id": str(data["outlet_id"]),
                    }
                ),
            )
            return row

    async def visit(self, connection: asyncpg.Connection, organization_id: UUID, visit_id: UUID):
        return await connection.fetchrow(
            "select * from public.smartteam_visits where organization_id=$1 and id=$2",
            organization_id,
            visit_id,
        )

    async def assign_visit(
        self,
        connection: asyncpg.Connection,
        organization_id: UUID,
        actor_id: UUID,
        visit_id: UUID,
        sales_profile_id: UUID,
        idempotency_key: str,
    ):
        async with connection.transaction():
            prior = await connection.fetchrow(
                "select visit_id,event_type from public.smartteam_visit_events where organization_id=$1 and idempotency_key=$2",
                organization_id,
                idempotency_key,
            )
            if prior:
                if prior["visit_id"] != visit_id or prior["event_type"] not in ("assigned", "reassigned"):
                    raise ValueError("idempotency_conflict")
                return await self.visit(connection, organization_id, visit_id)
            current = await self.visit(connection, organization_id, visit_id)
            if current is None:
                raise ValueError("visit_not_found")
            if current["status"] not in ("scheduled", "assigned"):
                raise ValueError("visit_transition_invalid")
            profile = await self.profile_in_org(connection, organization_id, sales_profile_id)
            if profile is None:
                raise ValueError("sales_profile_not_found")
            if not await self.can_access_profile(connection, organization_id, sales_profile_id, actor_id):
                raise ValueError("profile_scope_forbidden")
            if not await self.outlet_is_assigned(
                connection, organization_id, sales_profile_id, current["outlet_id"]
            ):
                raise ValueError("outlet_not_assigned")
            outlet = await connection.fetchrow(
                "select branch_id,territory_id from public.outlets where organization_id=$1 and id=$2 and status='active'",
                organization_id,
                current["outlet_id"],
            )
            if outlet is None:
                raise ValueError("outlet_not_found")
            if profile["team_id"] is not None:
                team = await connection.fetchrow(
                    "select branch_id from public.teams where organization_id=$1 and id=$2 and status='active'",
                    organization_id,
                    profile["team_id"],
                )
                if team is None:
                    raise ValueError("sales_team_not_found")
                if team["branch_id"] is not None and outlet["branch_id"] != team["branch_id"]:
                    raise ValueError("outlet_branch_mismatch")
            if profile["territory_id"] is not None and outlet["territory_id"] != profile["territory_id"]:
                raise ValueError("outlet_territory_mismatch")
            updated = await connection.fetchrow(
                """update public.smartteam_visits
                   set sales_profile_id=$3,team_id=$4,branch_id=$5,assigned_by=$6,
                       status='assigned',updated_at=now()
                   where organization_id=$1 and id=$2 returning *""",
                organization_id,
                visit_id,
                sales_profile_id,
                profile["team_id"],
                outlet["branch_id"],
                actor_id,
            )
            await connection.execute(
                """insert into public.smartteam_visit_events
                   (organization_id,visit_id,actor_user_id,event_type,from_status,to_status,idempotency_key,metadata)
                   values($1,$2,$3,$4,$5,$6,$7,$8::jsonb)""",
                organization_id,
                visit_id,
                actor_id,
                "reassigned" if current["sales_profile_id"] != sales_profile_id else "assigned",
                current["status"],
                updated["status"],
                idempotency_key,
                json.dumps({
                    "previous_sales_profile_id": str(current["sales_profile_id"]),
                    "sales_profile_id": str(sales_profile_id),
                    "outlet_id": str(current["outlet_id"]),
                }),
            )
            return updated

    async def check_in(
        self,
        connection: asyncpg.Connection,
        organization_id: UUID,
        actor_id: UUID,
        visit_id: UUID,
        location: dict[str, Any],
        idempotency_key: str,
    ):
        async with connection.transaction():
            prior = await connection.fetchrow(
                "select visit_id,event_type from public.smartteam_visit_events where organization_id=$1 and idempotency_key=$2",
                organization_id,
                idempotency_key,
            )
            if prior:
                if prior["visit_id"] != visit_id or prior["event_type"] != "checked_in":
                    raise ValueError("idempotency_conflict")
                return await self.visit(connection, organization_id, visit_id)
            row = await self.visit(connection, organization_id, visit_id)
            if row is None:
                raise ValueError("visit_not_found")
            if row["status"] not in ("scheduled", "assigned"):
                raise ValueError("visit_transition_invalid")
            if not await self.can_access_profile(
                connection, organization_id, row["sales_profile_id"], actor_id
            ):
                raise ValueError("profile_scope_forbidden")
            if not await self.outlet_is_assigned(
                connection, organization_id, row["sales_profile_id"], row["outlet_id"]
            ):
                raise ValueError("outlet_assignment_inactive")
            updated = await connection.fetchrow(
                """update public.smartteam_visits set status='in_progress',check_in_at=now(),
                check_in_latitude=$3,check_in_longitude=$4,check_in_accuracy_m=$5,check_in_source=$6,updated_at=now()
                where organization_id=$1 and id=$2 and check_in_at is null returning *""",
                organization_id,
                visit_id,
                location["latitude"],
                location["longitude"],
                location["accuracy_m"],
                location["source"],
            )
            if updated is None:
                raise ValueError("visit_already_checked_in")
            await connection.execute(
                """insert into public.smartteam_visit_events(organization_id,visit_id,actor_user_id,event_type,from_status,to_status,idempotency_key,metadata)
                   values($1,$2,$3,'checked_in',$4,$5,$6,$7::jsonb)""",
                organization_id,
                visit_id,
                actor_id,
                row["status"],
                updated["status"],
                idempotency_key,
                json.dumps(
                    {
                        "captured_at": location.get("captured_at").isoformat()
                        if location.get("captured_at")
                        else None,
                        "latitude": location["latitude"],
                        "longitude": location["longitude"],
                        "accuracy_m": location["accuracy_m"],
                        "source": location["source"],
                    }
                ),
            )
            return updated

    async def check_out(
        self,
        connection: asyncpg.Connection,
        organization_id: UUID,
        actor_id: UUID,
        visit_id: UUID,
        location: dict[str, Any],
        outcome: str | None,
        notes: str | None,
        idempotency_key: str,
    ):
        async with connection.transaction():
            prior = await connection.fetchrow(
                "select visit_id,event_type from public.smartteam_visit_events where organization_id=$1 and idempotency_key=$2",
                organization_id,
                idempotency_key,
            )
            if prior:
                if prior["visit_id"] != visit_id or prior["event_type"] != "checked_out":
                    raise ValueError("idempotency_conflict")
                return await self.visit(connection, organization_id, visit_id)
            row = await self.visit(connection, organization_id, visit_id)
            if row is None:
                raise ValueError("visit_not_found")
            if row["status"] != "in_progress" or row["check_in_at"] is None:
                raise ValueError("visit_transition_invalid")
            if not await self.can_access_profile(
                connection, organization_id, row["sales_profile_id"], actor_id
            ):
                raise ValueError("profile_scope_forbidden")
            if not await self.outlet_is_assigned(
                connection, organization_id, row["sales_profile_id"], row["outlet_id"]
            ):
                raise ValueError("outlet_assignment_inactive")
            updated = await connection.fetchrow(
                """update public.smartteam_visits set status='completed',check_out_at=now(),outcome=coalesce($3,outcome),
                notes=coalesce($4,notes),check_out_latitude=$5,check_out_longitude=$6,check_out_accuracy_m=$7,
                check_out_source=$8,updated_at=now() where organization_id=$1 and id=$2 and status='in_progress' returning *""",
                organization_id,
                visit_id,
                outcome,
                notes,
                location["latitude"],
                location["longitude"],
                location["accuracy_m"],
                location["source"],
            )
            if updated is None:
                raise ValueError("visit_transition_invalid")
            await connection.execute(
                """insert into public.smartteam_visit_events(organization_id,visit_id,actor_user_id,event_type,from_status,to_status)
                   values($1,$2,$3,'checked_out',$4,$5)""",
                organization_id,
                visit_id,
                row["status"],
                updated["status"],
            )
            return updated

    async def cancel_visit(
        self,
        connection: asyncpg.Connection,
        organization_id: UUID,
        actor_id: UUID,
        visit_id: UUID,
        reason: str,
    ):
        async with connection.transaction():
            row = await self.visit(connection, organization_id, visit_id)
            if row is None:
                raise ValueError("visit_not_found")
            if row["status"] not in ("scheduled", "assigned"):
                raise ValueError("visit_transition_invalid")
            if not await self.can_access_profile(
                connection, organization_id, row["sales_profile_id"], actor_id
            ):
                raise ValueError("profile_scope_forbidden")
            updated = await connection.fetchrow(
                """update public.smartteam_visits set status='cancelled',cancel_reason=$3,updated_at=now()
                   where organization_id=$1 and id=$2 returning *""",
                organization_id,
                visit_id,
                reason,
            )
            await connection.execute(
                """insert into public.smartteam_visit_events(organization_id,visit_id,actor_user_id,event_type,from_status,to_status,reason)
                   values($1,$2,$3,'cancelled',$4,$5,$6)""",
                organization_id,
                visit_id,
                actor_id,
                row["status"],
                updated["status"],
                reason,
            )
            return updated

    async def list_shifts(
        self,
        connection: asyncpg.Connection,
        organization_id: UUID,
        actor_id: UUID,
        limit: int,
        offset: int,
    ):
        return await connection.fetch(
            """select sh.*,sp.employee_code,p.display_name,tm.name team_name,
                      case when sh.status='cancelled' then 'cancelled' when sh.clock_in_at is null then 'absent'
                           when sh.clock_out_at is null then 'present' else 'completed' end attendance_status,
                      coalesce((select jsonb_agg(jsonb_build_object('id',e.id,'event_type',e.event_type,'actor_user_id',e.actor_user_id,
                        'actor_name',ep.display_name,'occurred_at',e.occurred_at,'metadata',e.metadata) order by e.occurred_at desc)
                        from public.smartteam_attendance_events e join public.profiles ep on ep.id=e.actor_user_id
                        where e.organization_id=sh.organization_id and e.shift_id=sh.id),'[]'::jsonb) events
               from public.smartteam_shifts sh join public.sales_profiles sp on sp.organization_id=sh.organization_id and sp.id=sh.sales_profile_id
               join public.profiles p on p.id=sh.user_id left join public.teams tm on tm.organization_id=sh.organization_id and tm.id=sh.team_id
               where sh.organization_id=$1 and (sh.user_id=$2 or sp.manager_user_id=$2 or exists(
                select 1 from public.teams t where t.organization_id=sh.organization_id and t.id=sh.team_id and t.supervisor_user_id=$2)
                or exists(select 1 from public.organization_memberships m join public.user_role_assignments ura on ura.membership_id=m.id
                join public.roles r on r.id=ura.role_id where m.organization_id=$1 and m.user_id=$2 and m.status='active'
                and r.key in ('company_admin','tenant_owner') and ura.revoked_at is null))
               order by sh.shift_date desc limit $3 offset $4""",
            organization_id,
            actor_id,
            limit,
            offset,
        )

    async def clock_in(
        self,
        connection: asyncpg.Connection,
        organization_id: UUID,
        actor_id: UUID,
        location: dict[str, Any],
        key: str,
    ):
        profile = await self.profile_for_user(connection, organization_id, actor_id)
        if profile is None:
            raise ValueError("active_sales_profile_required")
        async with connection.transaction():
            local_date = await connection.fetchval(
                "select (now() at time zone coalesce(timezone,'UTC'))::date from public.profiles where id=$1",
                actor_id,
            )
            existing = await connection.fetchrow(
                "select * from public.smartteam_shifts where organization_id=$1 and user_id=$2 and shift_date=$3",
                organization_id,
                actor_id,
                local_date,
            )
            if existing:
                if existing["status"] == "active":
                    return existing
                raise ValueError("shift_already_closed_today")
            row = await connection.fetchrow(
                """insert into public.smartteam_shifts(organization_id,sales_profile_id,user_id,branch_id,team_id,shift_date,status,
                clock_in_at,clock_in_latitude,clock_in_longitude,clock_in_accuracy_m,clock_in_source,idempotency_key,created_by)
                values($1,$2,$3,(select branch_id from public.teams where organization_id=$1 and id=$4),
                $4,$5,'active',now(),$6,$7,$8,$9,$10,$3) returning *""",
                organization_id,
                profile["id"],
                actor_id,
                profile["team_id"],
                local_date,
                location["latitude"],
                location["longitude"],
                location["accuracy_m"],
                location["source"],
                key,
            )
            await connection.execute(
                """insert into public.smartteam_attendance_events(organization_id,shift_id,actor_user_id,event_type,idempotency_key,metadata)
                   values($1,$2,$3,'clocked_in',$4,$5::jsonb)""",
                organization_id,
                row["id"],
                actor_id,
                key,
                json.dumps(
                    {
                        "captured_at": location.get("captured_at").isoformat()
                        if location.get("captured_at")
                        else None,
                        "latitude": location["latitude"],
                        "longitude": location["longitude"],
                        "accuracy_m": location["accuracy_m"],
                        "source": location["source"],
                    }
                ),
            )
            return row

    async def clock_out(
        self,
        connection: asyncpg.Connection,
        organization_id: UUID,
        actor_id: UUID,
        location: dict[str, Any],
        key: str,
    ):
        async with connection.transaction():
            local_date = await connection.fetchval(
                "select (now() at time zone coalesce(timezone,'UTC'))::date from public.profiles where id=$1",
                actor_id,
            )
            shift = await connection.fetchrow(
                "select * from public.smartteam_shifts where organization_id=$1 and user_id=$2 and shift_date=$3 for update",
                organization_id,
                actor_id,
                local_date,
            )
            if shift is None:
                raise ValueError("active_shift_not_found")
            if shift["status"] == "completed" and shift["clock_out_idempotency_key"] == key:
                return shift
            if shift["status"] != "active":
                raise ValueError("active_shift_not_found")
            row = await connection.fetchrow(
                """update public.smartteam_shifts set status='completed',clock_out_at=now(),clock_out_latitude=$4,
                clock_out_longitude=$5,clock_out_accuracy_m=$6,clock_out_source=$7,clock_out_idempotency_key=$8,updated_at=now()
                where organization_id=$1 and user_id=$2 and shift_date=$3 and status='active' returning *""",
                organization_id,
                actor_id,
                local_date,
                location["latitude"],
                location["longitude"],
                location["accuracy_m"],
                location["source"],
                key,
            )
            if row is None:
                raise ValueError("active_shift_not_found")
            await connection.execute(
                """insert into public.smartteam_attendance_events(organization_id,shift_id,actor_user_id,event_type,idempotency_key,metadata)
                   values($1,$2,$3,'clocked_out',$4,$5::jsonb)""",
                organization_id,
                row["id"],
                actor_id,
                key,
                json.dumps(
                    {
                        "captured_at": location.get("captured_at").isoformat()
                        if location.get("captured_at")
                        else None,
                        "latitude": location["latitude"],
                        "longitude": location["longitude"],
                        "accuracy_m": location["accuracy_m"],
                        "source": location["source"],
                    }
                ),
            )
            return row

    async def correct_attendance(
        self,
        connection: asyncpg.Connection,
        organization_id: UUID,
        actor_id: UUID,
        shift_id: UUID,
        clock_in_at,
        clock_out_at,
        reason: str,
    ):
        async with connection.transaction():
            shift = await connection.fetchrow(
                "select * from public.smartteam_shifts where organization_id=$1 and id=$2 for update",
                organization_id,
                shift_id,
            )
            if shift is None:
                raise ValueError("shift_not_found")
            if not await self.can_access_profile(
                connection, organization_id, shift["sales_profile_id"], actor_id
            ):
                raise ValueError("profile_scope_forbidden")
            next_clock_in = clock_in_at or shift["clock_in_at"]
            next_clock_out = clock_out_at if clock_out_at is not None else shift["clock_out_at"]
            if next_clock_out is not None and (
                next_clock_in is None or next_clock_out < next_clock_in
            ):
                raise ValueError("attendance_time_range_invalid")
            row = await connection.fetchrow(
                """update public.smartteam_shifts set clock_in_at=$3,clock_out_at=$4,
                status=case when $4 is not null then 'completed' when status='completed' then 'active' else status end,
                correction_reason=$5,corrected_by=$6,corrected_at=now(),updated_at=now()
                where organization_id=$1 and id=$2 returning *""",
                organization_id,
                shift_id,
                next_clock_in,
                next_clock_out,
                reason,
                actor_id,
            )
            if row is None:
                raise ValueError("shift_not_found")
            await connection.execute(
                """insert into public.smartteam_attendance_events(organization_id,shift_id,actor_user_id,event_type,metadata)
                   values($1,$2,$3,'corrected',$4::jsonb)""",
                organization_id,
                shift_id,
                actor_id,
                json.dumps(
                    {
                        "reason": reason,
                        "before": {
                            "clock_in_at": shift["clock_in_at"].isoformat()
                            if shift["clock_in_at"]
                            else None,
                            "clock_out_at": shift["clock_out_at"].isoformat()
                            if shift["clock_out_at"]
                            else None,
                        },
                        "after": {
                            "clock_in_at": next_clock_in.isoformat() if next_clock_in else None,
                            "clock_out_at": next_clock_out.isoformat() if next_clock_out else None,
                        },
                    }
                ),
            )
            return row

    async def list_activities(
        self,
        connection: asyncpg.Connection,
        organization_id: UUID,
        actor_id: UUID,
        limit: int,
        offset: int,
    ):
        return await connection.fetch(
            """select a.*,sp.user_id sales_user_id,sp.employee_code from public.smartteam_activities a
               join public.sales_profiles sp on sp.organization_id=a.organization_id and sp.id=a.sales_profile_id
               where a.organization_id=$1 and (sp.user_id=$2 or sp.manager_user_id=$2 or exists(
                select 1 from public.teams t where t.organization_id=sp.organization_id and t.id=sp.team_id and t.supervisor_user_id=$2)
                or exists(select 1 from public.organization_memberships m join public.user_role_assignments ura on ura.membership_id=m.id
                join public.roles r on r.id=ura.role_id where m.organization_id=$1 and m.user_id=$2 and m.status='active'
                and r.key in ('company_admin','tenant_owner') and ura.revoked_at is null))
               order by a.created_at desc limit $3 offset $4""",
            organization_id,
            actor_id,
            limit,
            offset,
        )

    async def create_activity(
        self,
        connection: asyncpg.Connection,
        organization_id: UUID,
        actor_id: UUID,
        data: dict[str, Any],
    ):
        async with connection.transaction():
            existing = await connection.fetchrow(
                "select * from public.smartteam_activities where organization_id=$1 and idempotency_key=$2",
                organization_id,
                data["idempotency_key"],
            )
            if existing:
                return existing
            profile = await self.profile_in_org(
                connection, organization_id, data["sales_profile_id"]
            )
            if profile is None:
                raise ValueError("sales_profile_not_found")
            if not await self.can_access_profile(
                connection, organization_id, data["sales_profile_id"], actor_id
            ):
                raise ValueError("profile_scope_forbidden")
            if data.get("visit_id"):
                linked_visit = await self.visit(connection, organization_id, data["visit_id"])
                if linked_visit is None:
                    raise ValueError("visit_not_found")
                if linked_visit["sales_profile_id"] != data["sales_profile_id"]:
                    raise ValueError("visit_profile_mismatch")
            return await connection.fetchrow(
                """insert into public.smartteam_activities(organization_id,sales_profile_id,visit_id,created_by,activity_type,title,description,due_at,idempotency_key)
                   values($1,$2,$3,$4,$5,$6,$7,$8,$9) returning *""",
                organization_id,
                data["sales_profile_id"],
                data.get("visit_id"),
                actor_id,
                data["activity_type"],
                data["title"],
                data.get("description"),
                data.get("due_at"),
                data["idempotency_key"],
            )

    async def update_activity(
        self,
        connection: asyncpg.Connection,
        organization_id: UUID,
        actor_id: UUID,
        activity_id: UUID,
        data: dict[str, Any],
    ):
        existing = await connection.fetchrow(
            "select sales_profile_id from public.smartteam_activities where organization_id=$1 and id=$2",
            organization_id,
            activity_id,
        )
        if existing is None:
            return None
        if not await self.can_access_profile(
            connection, organization_id, existing["sales_profile_id"], actor_id
        ):
            raise ValueError("profile_scope_forbidden")
        assignments = []
        values = [organization_id, activity_id]
        for field in ("title", "description", "due_at", "status"):
            if field in data:
                values.append(data[field])
                assignments.append(f"{field}=${len(values)}")
        if not assignments:
            return await connection.fetchrow(
                "select * from public.smartteam_activities where organization_id=$1 and id=$2",
                organization_id,
                activity_id,
            )
        assignments.append(
            "completed_at=case when $"
            + str(len(values) + 1)
            + "='completed' then now() when $"
            + str(len(values) + 1)
            + "='open' then null else completed_at end"
        )
        values.append(data.get("status"))
        assignments.append("updated_at=now()")
        return await connection.fetchrow(
            "update public.smartteam_activities set "
            + ",".join(assignments)
            + " where organization_id=$1 and id=$2 returning *",
            *values,
        )

    async def list_targets(
        self,
        connection: asyncpg.Connection,
        organization_id: UUID,
        actor_id: UUID,
        limit: int,
        offset: int,
    ):
        return await connection.fetch(
            """select t.*,sp.employee_code,tm.name team_name,b.name branch_name,
                      progress.actual_value,
                      case when progress.actual_value is not null and t.target_value>0
                           then round(progress.actual_value/t.target_value*100,2) else null end progress_percentage
               from public.smartteam_targets t
               left join public.sales_profiles sp on sp.organization_id=t.organization_id and sp.id=t.sales_profile_id
               left join public.teams tm on tm.organization_id=t.organization_id and tm.id=t.team_id
               left join public.branches b on b.organization_id=t.organization_id and b.id=t.branch_id
               left join lateral (
                 select case
                   when t.metric_key='visits' then (
                     select count(*)::numeric from public.smartteam_visits v
                     where v.organization_id=t.organization_id and v.status='completed'
                       and v.scheduled_at::date between t.period_start and t.period_end
                       and ((t.sales_profile_id is not null and v.sales_profile_id=t.sales_profile_id)
                         or (t.team_id is not null and v.team_id=t.team_id)
                         or (t.branch_id is not null and v.branch_id=t.branch_id))
                   )
                   when t.metric_key='productive_visits' then (
                     select count(*)::numeric from public.smartteam_visits v
                     where v.organization_id=t.organization_id and v.status='completed'
                       and v.outcome in ('productive','order_taken')
                       and v.scheduled_at::date between t.period_start and t.period_end
                       and ((t.sales_profile_id is not null and v.sales_profile_id=t.sales_profile_id)
                         or (t.team_id is not null and v.team_id=t.team_id)
                         or (t.branch_id is not null and v.branch_id=t.branch_id))
                   )
                   when t.metric_key='activities' then (
                     select count(*)::numeric from public.smartteam_activities a
                     join public.sales_profiles asp on asp.organization_id=a.organization_id and asp.id=a.sales_profile_id
                     where a.organization_id=t.organization_id and a.status='completed'
                       and a.completed_at::date between t.period_start and t.period_end
                       and ((t.sales_profile_id is not null and a.sales_profile_id=t.sales_profile_id)
                         or (t.team_id is not null and asp.team_id=t.team_id)
                         or (t.branch_id is not null and exists(select 1 from public.teams at where at.organization_id=asp.organization_id and at.id=asp.team_id and at.branch_id=t.branch_id)))
                   )
                   else null
                 end actual_value
               ) progress on true
               where t.organization_id=$1 and (
                 (t.sales_profile_id is not null and (sp.user_id=$2 or sp.manager_user_id=$2 or exists(select 1 from public.teams st where st.organization_id=sp.organization_id and st.id=sp.team_id and st.supervisor_user_id=$2)))
                 or (t.team_id is not null and exists(select 1 from public.teams st where st.organization_id=t.organization_id and st.id=t.team_id and st.supervisor_user_id=$2))
                 or (t.branch_id is not null and exists(select 1 from public.organization_memberships m join public.user_role_assignments ura on ura.membership_id=m.id join public.roles r on r.id=ura.role_id where m.organization_id=$1 and m.user_id=$2 and m.status='active' and r.key in ('company_admin','tenant_owner','platform_admin') and ura.revoked_at is null))
                 or exists(select 1 from public.organization_memberships m join public.user_role_assignments ura on ura.membership_id=m.id join public.roles r on r.id=ura.role_id where m.organization_id=$1 and m.user_id=$2 and m.status='active' and r.key in ('company_admin','tenant_owner','platform_admin') and ura.revoked_at is null)
               ) order by t.period_start desc limit $3 offset $4""",
            organization_id,
            actor_id,
            limit,
            offset,
        )

    async def create_target(
        self,
        connection: asyncpg.Connection,
        organization_id: UUID,
        actor_id: UUID,
        data: dict[str, Any],
    ):
        scope_field = next(
            field
            for field in ("sales_profile_id", "team_id", "branch_id")
            if data.get(field) is not None
        )
        table = {"sales_profile_id": "sales_profiles", "team_id": "teams", "branch_id": "branches"}[
            scope_field
        ]
        exists = await connection.fetchval(
            f"select exists(select 1 from public.{table} where organization_id=$1 and id=$2 and status='active')",
            organization_id,
            data[scope_field],
        )
        if not exists:
            raise ValueError("target_scope_not_found")
        if scope_field == "sales_profile_id" and not await self.can_access_profile(
            connection, organization_id, data[scope_field], actor_id
        ):
            raise ValueError("profile_scope_forbidden")
        if scope_field == "team_id":
            team_allowed = await connection.fetchval(
                """select exists(select 1 from public.teams where organization_id=$1 and id=$2 and supervisor_user_id=$3)
              or exists(select 1 from public.organization_memberships m join public.user_role_assignments ura on ura.membership_id=m.id join public.roles r on r.id=ura.role_id
              where m.organization_id=$1 and m.user_id=$3 and m.status='active' and r.key in ('company_admin','tenant_owner','platform_admin') and ura.revoked_at is null)""",
                organization_id,
                data[scope_field],
                actor_id,
            )
            if not team_allowed:
                raise ValueError("profile_scope_forbidden")
        if scope_field == "branch_id":
            branch_allowed = await connection.fetchval(
                """select exists(select 1 from public.organization_memberships m join public.user_role_assignments ura on ura.membership_id=m.id join public.roles r on r.id=ura.role_id
              where m.organization_id=$1 and m.user_id=$2 and m.status='active' and r.key in ('company_admin','tenant_owner','platform_admin') and ura.revoked_at is null)""",
                organization_id,
                actor_id,
            )
            if not branch_allowed:
                raise ValueError("profile_scope_forbidden")
        return await connection.fetchrow(
            """insert into public.smartteam_targets(organization_id,sales_profile_id,team_id,branch_id,metric_key,period_start,period_end,target_value,created_by,updated_by)
               values($1,$2,$3,$4,$5,$6,$7,$8,$9,$9) returning *""",
            organization_id,
            data.get("sales_profile_id"),
            data.get("team_id"),
            data.get("branch_id"),
            data["metric_key"],
            data["period_start"],
            data["period_end"],
            data["target_value"],
            actor_id,
        )

    async def update_visit(
        self,
        connection: asyncpg.Connection,
        organization_id: UUID,
        actor_id: UUID,
        visit_id: UUID,
        data: dict[str, Any],
    ):
        current = await self.visit(connection, organization_id, visit_id)
        if current is None:
            return None
        if current["status"] not in ("scheduled", "assigned"):
            raise ValueError("visit_transition_invalid")
        if not await self.can_access_profile(
            connection, organization_id, current["sales_profile_id"], actor_id
        ):
            raise ValueError("profile_scope_forbidden")
        fields = ("scheduled_at", "window_end_at", "notes", "outcome")
        assignments = []
        values = [organization_id, visit_id]
        for field in fields:
            if field in data:
                values.append(data[field])
                assignments.append(f"{field}=${len(values)}")
        if not assignments:
            return current
        next_start = data.get("scheduled_at", current["scheduled_at"])
        next_end = data.get("window_end_at", current["window_end_at"])
        if next_end is not None and next_end < next_start:
            raise ValueError("visit_window_invalid")
        assignments.append("updated_at=now()")
        updated = await connection.fetchrow(
            "update public.smartteam_visits set "
            + ",".join(assignments)
            + " where organization_id=$1 and id=$2 returning *",
            *values,
        )
        await connection.execute(
            """insert into public.smartteam_visit_events(organization_id,visit_id,actor_user_id,event_type,from_status,to_status,metadata)
               values($1,$2,$3,$4,$5,$6,$7::jsonb)""",
            organization_id,
            visit_id,
            actor_id,
            "outcome_recorded" if "outcome" in data else "updated",
            current["status"],
            updated["status"],
            json.dumps({"updated_fields": sorted(data)}),
        )
        return updated

    async def list_visit_events(
        self, connection: asyncpg.Connection, organization_id: UUID, actor_id: UUID, visit_id: UUID
    ):
        visit = await self.visit(connection, organization_id, visit_id)
        if visit is None:
            raise ValueError("visit_not_found")
        if not await self.can_access_profile(
            connection, organization_id, visit["sales_profile_id"], actor_id
        ):
            raise ValueError("profile_scope_forbidden")
        return await connection.fetch(
            """select e.*,p.display_name actor_name from public.smartteam_visit_events e
               join public.profiles p on p.id=e.actor_user_id
               where e.organization_id=$1 and e.visit_id=$2 order by e.occurred_at desc""",
            organization_id,
            visit_id,
        )

    async def update_target(
        self,
        connection: asyncpg.Connection,
        organization_id: UUID,
        actor_id: UUID,
        target_id: UUID,
        data: dict[str, Any],
    ):
        current = await connection.fetchrow(
            "select * from public.smartteam_targets where organization_id=$1 and id=$2",
            organization_id,
            target_id,
        )
        if current is None:
            return None
        if current["sales_profile_id"] is not None:
            if not await self.can_access_profile(
                connection, organization_id, current["sales_profile_id"], actor_id
            ):
                raise ValueError("profile_scope_forbidden")
        elif current["team_id"] is not None:
            allowed = await connection.fetchval(
                """select exists(select 1 from public.teams where organization_id=$1 and id=$2 and supervisor_user_id=$3)
              or exists(select 1 from public.organization_memberships m join public.user_role_assignments ura on ura.membership_id=m.id join public.roles r on r.id=ura.role_id
              where m.organization_id=$1 and m.user_id=$3 and m.status='active' and r.key in ('company_admin','tenant_owner','platform_admin') and ura.revoked_at is null)""",
                organization_id,
                current["team_id"],
                actor_id,
            )
            if not allowed:
                raise ValueError("profile_scope_forbidden")
        else:
            allowed = await connection.fetchval(
                """select exists(select 1 from public.organization_memberships m join public.user_role_assignments ura on ura.membership_id=m.id join public.roles r on r.id=ura.role_id
              where m.organization_id=$1 and m.user_id=$2 and m.status='active' and r.key in ('company_admin','tenant_owner','platform_admin') and ura.revoked_at is null)""",
                organization_id,
                actor_id,
            )
            if not allowed:
                raise ValueError("profile_scope_forbidden")
        if "period_start" in data and data["period_start"] is not None and "period_end" not in data:
            data["period_end"] = current["period_end"]
        if "period_end" in data and data["period_end"] is not None and "period_start" not in data:
            data["period_start"] = current["period_start"]
        start = data.get("period_start", current["period_start"])
        end = data.get("period_end", current["period_end"])
        if end < start:
            raise ValueError("target_period_invalid")
        return await connection.fetchrow(
            """update public.smartteam_targets set period_start=$3,period_end=$4,target_value=coalesce($5,target_value),
               updated_by=$6,updated_at=now() where organization_id=$1 and id=$2 returning *""",
            organization_id,
            target_id,
            start,
            end,
            data.get("target_value"),
            actor_id,
        )

    async def ensure_visit_evidence_scope(
        self, connection: asyncpg.Connection, organization_id: UUID, actor_id: UUID, visit_id: UUID
    ):
        visit = await self.visit(connection, organization_id, visit_id)
        if visit is None:
            raise ValueError("visit_not_found")
        if visit["status"] not in ("in_progress", "completed"):
            raise ValueError("visit_evidence_state_invalid")
        if not await self.can_access_profile(
            connection, organization_id, visit["sales_profile_id"], actor_id
        ):
            raise ValueError("profile_scope_forbidden")
        return visit

    async def create_visit_evidence(
        self,
        connection: asyncpg.Connection,
        organization_id: UUID,
        visit_id: UUID,
        actor_id: UUID,
        storage_path: str,
        mime_type: str,
        size_bytes: int,
        sha256: str,
    ):
        return await connection.fetchrow(
            """insert into public.smartteam_visit_evidence
               (organization_id,visit_id,uploaded_by,storage_path,mime_type,size_bytes,sha256)
               values($1,$2,$3,$4,$5,$6,$7) returning *""",
            organization_id,
            visit_id,
            actor_id,
            storage_path,
            mime_type,
            size_bytes,
            sha256,
        )

    async def list_visit_evidence(
        self, connection: asyncpg.Connection, organization_id: UUID, actor_id: UUID, visit_id: UUID
    ):
        await self.ensure_visit_evidence_scope(connection, organization_id, actor_id, visit_id)
        return await connection.fetch(
            """select e.*,p.display_name uploader_name from public.smartteam_visit_evidence e
               join public.profiles p on p.id=e.uploaded_by
               where e.organization_id=$1 and e.visit_id=$2 order by e.created_at desc""",
            organization_id,
            visit_id,
        )

    async def can_receive_event(
        self,
        connection: asyncpg.Connection,
        organization_id: UUID,
        actor_id: UUID,
        event: dict[str, Any],
    ) -> bool:
        if str(event.get("organization_id")) != str(organization_id):
            return False
        resource = event.get("resource")
        record_id = event.get("record_id")
        if not record_id:
            return False
        if resource == "smartteam_visits":
            row = await connection.fetchrow(
                "select sales_profile_id from public.smartteam_visits where organization_id=$1 and id=$2",
                organization_id,
                record_id,
            )
            return bool(
                row
                and await self.can_access_profile(
                    connection, organization_id, row["sales_profile_id"], actor_id
                )
            )
        if resource == "smartteam_shifts":
            row = await connection.fetchrow(
                "select sales_profile_id from public.smartteam_shifts where organization_id=$1 and id=$2",
                organization_id,
                record_id,
            )
            return bool(
                row
                and await self.can_access_profile(
                    connection, organization_id, row["sales_profile_id"], actor_id
                )
            )
        if resource == "smartteam_activities":
            row = await connection.fetchrow(
                "select sales_profile_id from public.smartteam_activities where organization_id=$1 and id=$2",
                organization_id,
                record_id,
            )
            return bool(
                row
                and await self.can_access_profile(
                    connection, organization_id, row["sales_profile_id"], actor_id
                )
            )
        if resource == "smartteam_visit_evidence":
            row = await connection.fetchrow(
                """select v.sales_profile_id from public.smartteam_visit_evidence e
                   join public.smartteam_visits v on v.organization_id=e.organization_id and v.id=e.visit_id
                   where e.organization_id=$1 and e.id=$2""",
                organization_id,
                record_id,
            )
            return bool(
                row
                and await self.can_access_profile(
                    connection, organization_id, row["sales_profile_id"], actor_id
                )
            )
        if resource == "smartteam_targets":
            row = await connection.fetchrow(
                "select sales_profile_id,team_id,branch_id from public.smartteam_targets where organization_id=$1 and id=$2",
                organization_id,
                record_id,
            )
            if row is None:
                return False
            if row["sales_profile_id"] is not None:
                return await self.can_access_profile(
                    connection, organization_id, row["sales_profile_id"], actor_id
                )
            if row["team_id"] is not None:
                return bool(
                    await connection.fetchval(
                        """select exists(select 1 from public.teams where organization_id=$1 and id=$2 and supervisor_user_id=$3)
                  or exists(select 1 from public.organization_memberships m join public.user_role_assignments ura on ura.membership_id=m.id and ura.revoked_at is null join public.roles r on r.id=ura.role_id
                  where m.organization_id=$1 and m.user_id=$3 and m.status='active' and r.key in ('company_admin','tenant_owner','platform_admin'))""",
                        organization_id,
                        row["team_id"],
                        actor_id,
                    )
                )
            return bool(
                await connection.fetchval(
                    """select exists(select 1 from public.organization_memberships m join public.user_role_assignments ura on ura.membership_id=m.id and ura.revoked_at is null join public.roles r on r.id=ura.role_id
              where m.organization_id=$1 and m.user_id=$2 and m.status='active' and r.key in ('company_admin','tenant_owner','platform_admin'))""",
                    organization_id,
                    actor_id,
                )
            )
        return False

    async def platform_overview(self, connection: asyncpg.Connection, limit: int, offset: int):
        return await connection.fetch(
            """select o.id organization_id,o.name organization_name,o.status organization_status,
                (select count(*) from public.smartteam_visits v where v.organization_id=o.id) visits_total,
                (select count(*) from public.smartteam_visits v where v.organization_id=o.id and v.status='in_progress') visits_in_progress,
                (select count(*) from public.smartteam_visits v where v.organization_id=o.id and v.status='completed') visits_completed,
                (select count(*) from public.smartteam_shifts sh where sh.organization_id=o.id and sh.shift_date>=current_date-30) attendance_30d,
                (select count(*) from public.smartteam_shifts sh where sh.organization_id=o.id and sh.status='active') active_shifts,
                (select count(*) from public.smartteam_activities a where a.organization_id=o.id and a.created_at>=now()-interval '30 days') activities_30d,
                (select count(*) from public.smartteam_targets t where t.organization_id=o.id and current_date between t.period_start and t.period_end) active_targets
               from public.organizations o
               order by o.name asc limit $1 offset $2""",
            limit,
            offset,
        )


smart_team_repository = SmartTeamRepository()
