from __future__ import annotations

from typing import Any
from uuid import UUID

import asyncpg


RESOURCE_TABLES: dict[str, frozenset[str]] = {
    "branches": frozenset({"code", "name", "status", "city", "address", "manager_name", "phone", "latitude", "longitude", "branch_type"}),
    "teams": frozenset({"branch_id", "parent_team_id", "code", "name", "supervisor_user_id", "status"}),
    "territories": frozenset({"branch_id", "parent_territory_id", "code", "name", "boundary_geojson", "status"}),
    "outlets": frozenset({"branch_id", "territory_id", "code", "name", "category", "address", "city", "province", "postal_code", "phone", "pic_name", "latitude", "longitude", "status"}),
    "sales_profiles": frozenset({"user_id", "membership_id", "employee_code", "team_id", "territory_id", "manager_user_id", "status", "effective_from", "effective_until"}),
}


class MasterDataRepository:
    def _table(self, resource: str) -> str:
        if resource not in RESOURCE_TABLES:
            raise ValueError("Unsupported master-data resource")
        return resource

    async def list(self, connection: asyncpg.Connection, resource: str, organization_id: UUID, limit: int, offset: int) -> list[dict[str, Any]]:
        table = self._table(resource)
        if resource == "sales_profiles":
            rows = await connection.fetch(
                """select sp.*,p.display_name,p.phone,m.title membership_title,m.status membership_status
                   from public.sales_profiles sp
                   join public.profiles p on p.id=sp.user_id
                   left join public.organization_memberships m on m.id=sp.membership_id and m.organization_id=sp.organization_id
                   where sp.organization_id=$1
                   order by sp.created_at desc limit $2 offset $3""",
                organization_id, limit, offset,
            )
        else:
            rows = await connection.fetch(
                f"select * from public.{table} where organization_id=$1 order by created_at desc limit $2 offset $3",
                organization_id, limit, offset,
            )
        return [dict(row) for row in rows]

    async def create(self, connection: asyncpg.Connection, resource: str, organization_id: UUID, values: dict[str, Any]) -> dict[str, Any]:
        table = self._table(resource)
        clean = {key: value for key, value in values.items() if key in RESOURCE_TABLES[table]}
        if table != "sales_profiles" and not {"code", "name"}.issubset(clean):
            raise ValueError("code and name are required")
        if table == "sales_profiles" and not {"user_id", "membership_id"}.issubset(clean):
            raise ValueError("An active membership-backed user_id is required")
        columns = ["organization_id", *clean.keys()]
        args = [organization_id, *clean.values()]
        placeholders = ",".join(f"${index}" for index in range(1, len(args) + 1))
        row = await connection.fetchrow(
            f"insert into public.{table} ({','.join(columns)}) values ({placeholders}) returning *",
            *args,
        )
        return dict(row)

    async def update(self, connection: asyncpg.Connection, resource: str, organization_id: UUID, resource_id: UUID, values: dict[str, Any]) -> dict[str, Any] | None:
        table = self._table(resource)
        clean = {key: value for key, value in values.items() if key in RESOURCE_TABLES[table]}
        if not clean:
            raise ValueError("At least one mutable field is required")
        assignments = ",".join(f"{key}=${index}" for index, key in enumerate(clean, 1))
        args = [*clean.values(), resource_id, organization_id]
        row = await connection.fetchrow(
            f"update public.{table} set {assignments},updated_at=now() where id=${len(clean)+1} and organization_id=${len(clean)+2} returning *",
            *args,
        )
        return dict(row) if row else None

    async def deactivate_dependents(self, connection: asyncpg.Connection, resource: str, organization_id: UUID, resource_id: UUID, actor_id: UUID) -> dict[str, int]:
        counts = {"teams": 0, "territories": 0, "outlets": 0, "sales_profiles": 0, "assignments_closed": 0}
        if resource == "branches":
            counts["teams"] = await connection.fetchval("update public.teams set status='inactive',updated_at=now() where organization_id=$1 and branch_id=$2 and status='active' returning count(*)", organization_id, resource_id) or 0
            counts["territories"] = await connection.fetchval("update public.territories set status='inactive',updated_at=now() where organization_id=$1 and branch_id=$2 and status='active' returning count(*)", organization_id, resource_id) or 0
            counts["outlets"] = await connection.fetchval("update public.outlets set status='inactive',updated_at=now() where organization_id=$1 and branch_id=$2 and status='active' returning count(*)", organization_id, resource_id) or 0
            counts["sales_profiles"] = await connection.fetchval(
                """update public.sales_profiles sp set status='inactive',updated_at=now()
                   where sp.organization_id=$1 and sp.status='active'
                     and (sp.team_id in (select id from public.teams where organization_id=$1 and branch_id=$2)
                       or sp.territory_id in (select id from public.territories where organization_id=$1 and branch_id=$2))
                   returning count(*)""", organization_id, resource_id,
            ) or 0
        elif resource == "teams":
            counts["sales_profiles"] = await connection.fetchval(
                "update public.sales_profiles set status='inactive',updated_at=now() where organization_id=$1 and team_id=$2 and status='active' returning count(*)",
                organization_id, resource_id,
            ) or 0
        elif resource == "territories":
            counts["outlets"] = await connection.fetchval(
                "update public.outlets set status='inactive',updated_at=now() where organization_id=$1 and territory_id=$2 and status='active' returning count(*)",
                organization_id, resource_id,
            ) or 0
            counts["sales_profiles"] = await connection.fetchval(
                "update public.sales_profiles set status='inactive',updated_at=now() where organization_id=$1 and territory_id=$2 and status='active' returning count(*)",
                organization_id, resource_id,
            ) or 0
        elif resource == "outlets":
            counts["assignments_closed"] = await connection.fetchval(
                """update public.outlet_assignment_history set unassigned_at=now(),unassigned_by=$3,
                          change_reason='outlet_deactivated'
                   where organization_id=$1 and outlet_id=$2 and unassigned_at is null returning count(*)""",
                organization_id, resource_id, actor_id,
            ) or 0
        if resource in {"branches", "teams", "territories"} and counts["sales_profiles"]:
            counts["assignments_closed"] = await connection.fetchval(
                """update public.outlet_assignment_history a set unassigned_at=now(),unassigned_by=$3,
                          change_reason='master_data_dependency_deactivated'
                   where a.organization_id=$1 and a.unassigned_at is null
                     and a.sales_profile_id in (
                       select id from public.sales_profiles
                       where organization_id=$1 and status='inactive'
                     ) returning count(*)""",
                organization_id, resource_id, actor_id,
            ) or 0
        return counts

    async def assign_outlet(self, connection: asyncpg.Connection, organization_id: UUID, outlet_id: UUID, sales_profile_id: UUID, actor_id: UUID, note: str | None) -> dict[str, Any]:
        previous = await connection.fetchrow(
            """select a.id,a.sales_profile_id,a.assigned_team_id,a.assigned_supervisor_user_id,a.assigned_territory_id
               from public.outlet_assignment_history a
               where a.organization_id=$1 and a.outlet_id=$2 and a.unassigned_at is null
               for update""",
            organization_id, outlet_id,
        )
        target = await connection.fetchrow(
            """select sp.team_id,sp.territory_id,t.supervisor_user_id
               from public.sales_profiles sp
               left join public.teams t on t.id=sp.team_id and t.organization_id=sp.organization_id
               where sp.organization_id=$1 and sp.id=$2 and sp.status='active'""",
            organization_id, sales_profile_id,
        )
        if target is None:
            raise asyncpg.ForeignKeyViolationError("active sales profile not found")
        if previous:
            await connection.execute(
                """update public.outlet_assignment_history
                   set unassigned_at=now(),unassigned_by=$3,change_reason='reassigned'
                   where id=$1 and organization_id=$2""",
                previous["id"], organization_id, actor_id,
            )
        row = await connection.fetchrow(
            """insert into public.outlet_assignment_history(
                 organization_id,outlet_id,sales_profile_id,assigned_by,note,
                 previous_assignment_id,previous_sales_profile_id,previous_team_id,
                 previous_supervisor_user_id,previous_territory_id,
                 assigned_team_id,assigned_supervisor_user_id,assigned_territory_id,change_reason
               ) values($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14) returning *""",
            organization_id, outlet_id, sales_profile_id, actor_id, note,
            previous["id"] if previous else None,
            previous["sales_profile_id"] if previous else None,
            previous["assigned_team_id"] if previous else None,
            previous["assigned_supervisor_user_id"] if previous else None,
            previous["assigned_territory_id"] if previous else None,
            target["team_id"], target["supervisor_user_id"], target["territory_id"],
            "assigned" if previous is None else "reassigned",
        )
        return dict(row)

    async def list_assignments(self, connection: asyncpg.Connection, organization_id: UUID, limit: int, offset: int) -> list[dict[str, Any]]:
        rows = await connection.fetch(
            """select a.*,o.code outlet_code,o.name outlet_name,sp.user_id sales_user_id,sp.employee_code,
                      t.name team_name,ter.name territory_name,p.display_name supervisor_name
               from public.outlet_assignment_history a
               join public.outlets o on o.id=a.outlet_id and o.organization_id=a.organization_id
               join public.sales_profiles sp on sp.id=a.sales_profile_id and sp.organization_id=a.organization_id
               left join public.teams t on t.id=a.assigned_team_id and t.organization_id=a.organization_id
               left join public.territories ter on ter.id=a.assigned_territory_id and ter.organization_id=a.organization_id
               left join public.profiles p on p.id=a.assigned_supervisor_user_id
               where a.organization_id=$1 order by a.assigned_at desc limit $2 offset $3""",
            organization_id, limit, offset,
        )
        return [dict(row) for row in rows]

    async def my_assignment_context(self, connection: asyncpg.Connection, organization_id: UUID, user_id: UUID) -> dict[str, Any]:
        profile = await connection.fetchrow(
            """select sp.*,p.display_name,p.phone,t.name team_name,t.branch_id,
                      t.supervisor_user_id,s.display_name supervisor_name,
                      ter.name territory_name,ter.status territory_status
               from public.sales_profiles sp
               join public.organization_memberships m on m.id=sp.membership_id
                 and m.organization_id=sp.organization_id and m.user_id=sp.user_id and m.status='active'
               join public.profiles p on p.id=sp.user_id
               left join public.teams t on t.id=sp.team_id and t.organization_id=sp.organization_id
               left join public.profiles s on s.id=t.supervisor_user_id
               left join public.territories ter on ter.id=sp.territory_id and ter.organization_id=sp.organization_id
               where sp.organization_id=$1 and sp.user_id=$2 and sp.status='active'
                 and sp.effective_from<=current_date and (sp.effective_until is null or sp.effective_until>=current_date)
               limit 1""",
            organization_id, user_id,
        )
        if profile is None:
            return {"sales_profile": None, "assignments": []}
        assignments = await connection.fetch(
            """select a.id,a.outlet_id,a.assigned_at,a.note,o.code outlet_code,o.name outlet_name,
                      o.address,o.city,o.latitude,o.longitude,a.assigned_team_id,a.assigned_supervisor_user_id,
                      a.assigned_territory_id
               from public.outlet_assignment_history a
               join public.outlets o on o.id=a.outlet_id and o.organization_id=a.organization_id
               where a.organization_id=$1 and a.sales_profile_id=$2 and a.unassigned_at is null
                 and o.status='active'
               order by a.assigned_at desc""",
            organization_id, profile["id"],
        )
        return {"sales_profile": dict(profile), "assignments": [dict(row) for row in assignments]}

    async def begin_import(self, connection: asyncpg.Connection, organization_id: UUID, resource: str, idempotency_key: str, actor_id: UUID) -> dict[str, Any] | None:
        row = await connection.fetchrow(
            """insert into public.master_data_import_batches(organization_id,resource,idempotency_key,created_by)
               values($1,$2,$3,$4) on conflict(organization_id,resource,idempotency_key) do nothing returning *""",
            organization_id, resource, idempotency_key, actor_id,
        )
        return dict(row) if row else None

    async def get_import(self, connection: asyncpg.Connection, organization_id: UUID, resource: str, idempotency_key: str) -> dict[str, Any] | None:
        row = await connection.fetchrow(
            """select * from public.master_data_import_batches
               where organization_id=$1 and resource=$2 and idempotency_key=$3""",
            organization_id, resource, idempotency_key,
        )
        return dict(row) if row else None

    async def complete_import(self, connection: asyncpg.Connection, batch_id: UUID, result: dict[str, Any]) -> None:
        await connection.execute(
            """update public.master_data_import_batches
               set status='completed',result=$2::jsonb,completed_at=now() where id=$1""",
            batch_id, __import__("json").dumps(result, default=str),
        )


master_data_repository = MasterDataRepository()
