from __future__ import annotations
from typing import Any
from uuid import UUID
import asyncpg

RESOURCE_TABLES: dict[str, frozenset[str]] = {
 "branches": frozenset({"code","name","status","city","address","manager_name","phone","latitude","longitude"}),
 "teams": frozenset({"branch_id","parent_team_id","code","name","supervisor_user_id","status"}),
 "territories": frozenset({"branch_id","parent_territory_id","code","name","boundary_geojson","status"}),
 "outlets": frozenset({"branch_id","territory_id","code","name","category","address","city","province","postal_code","phone","pic_name","latitude","longitude","status"}),
 "sales_profiles": frozenset({"user_id","employee_code","team_id","territory_id","manager_user_id","status","effective_from","effective_until"}),
}
class MasterDataRepository:
 def _table(self, resource: str) -> str:
  if resource not in RESOURCE_TABLES: raise ValueError("Unsupported master-data resource")
  return resource
 async def list(self, connection: asyncpg.Connection, resource: str, organization_id: UUID, limit: int, offset: int) -> list[dict[str, Any]]:
  table=self._table(resource)
  if resource=="sales_profiles":
   rows=await connection.fetch("""select sp.*,p.display_name,p.phone from public.sales_profiles sp
     join public.profiles p on p.id=sp.user_id where sp.organization_id=$1
     order by sp.created_at desc limit $2 offset $3""",organization_id,limit,offset)
  else:
   rows=await connection.fetch(f"select * from public.{table} where organization_id=$1 order by created_at desc limit $2 offset $3",organization_id,limit,offset)
  return [dict(row) for row in rows]
 async def create(self, connection: asyncpg.Connection, resource: str, organization_id: UUID, values: dict[str, Any]) -> dict[str, Any]:
  table=self._table(resource); allowed=RESOURCE_TABLES[table]
  clean={key:value for key,value in values.items() if key in allowed and value is not None}
  if not {"code","name"}.issubset(clean) and table!="sales_profiles": raise ValueError("code and name are required")
  if table=="sales_profiles" and "user_id" not in clean: raise ValueError("user_id is required")
  columns=["organization_id",*clean.keys()]; args=[organization_id,*clean.values()]
  placeholders=",".join("$" + str(index) for index in range(1,len(args)+1))
  row=await connection.fetchrow(f"insert into public.{table} ({','.join(columns)}) values ({placeholders}) returning *",*args)
  return dict(row)
 async def update(self, connection: asyncpg.Connection, resource: str, organization_id: UUID, resource_id: UUID, values: dict[str, Any]) -> dict[str, Any] | None:
  table=self._table(resource); clean={key:value for key,value in values.items() if key in RESOURCE_TABLES[table] and value is not None}
  if not clean: raise ValueError("At least one mutable field is required")
  assignments=",".join(f"{key}=" + "$" + str(index) for index,key in enumerate(clean,1))
  args=[*clean.values(),resource_id,organization_id]
  row=await connection.fetchrow(f"update public.{table} set {assignments},updated_at=now() where id=$" + str(len(clean)+1) + " and organization_id=$" + str(len(clean)+2) + " returning *",*args)
  return dict(row) if row else None
 async def assign_outlet(self, connection: asyncpg.Connection, organization_id: UUID, outlet_id: UUID, sales_profile_id: UUID, actor_id: UUID, note: str | None) -> dict[str, Any]:
  row=await connection.fetchrow("""with closed as (
      update public.outlet_assignment_history set unassigned_at=now()
      where organization_id=$1 and outlet_id=$2 and unassigned_at is null returning id
    ) insert into public.outlet_assignment_history(organization_id,outlet_id,sales_profile_id,assigned_by,note)
    values($1,$2,$3,$4,$5) returning *""",organization_id,outlet_id,sales_profile_id,actor_id,note)
  return dict(row)
 async def list_assignments(self, connection: asyncpg.Connection, organization_id: UUID, limit: int, offset: int) -> list[dict[str, Any]]:
  rows=await connection.fetch("""select a.*,o.code outlet_code,o.name outlet_name,sp.user_id sales_user_id,sp.employee_code
    from public.outlet_assignment_history a join public.outlets o on o.id=a.outlet_id and o.organization_id=a.organization_id
    join public.sales_profiles sp on sp.id=a.sales_profile_id and sp.organization_id=a.organization_id
    where a.organization_id=$1 order by a.assigned_at desc limit $2 offset $3""",organization_id,limit,offset)
  return [dict(row) for row in rows]
