from __future__ import annotations
from typing import Any
from uuid import UUID
import asyncpg
from fastapi import Request
from app.errors import APIError
from app.security.dependencies import Principal,TenantContext
from app.repositories.master_data import MasterDataRepository
from app.services.audit import write_audit

class MasterDataService:
 def __init__(self, repository: MasterDataRepository | None = None):
  self.repository=repository or MasterDataRepository()
 def _tenant(self, organization_id: UUID, tenant: TenantContext) -> None:
  if tenant.organization_id != organization_id:
   raise APIError(403,"forbidden","Cross-tenant master-data access is denied.")
 async def list(self, connection: asyncpg.Connection, resource: str, organization_id: UUID, tenant: TenantContext, limit: int, offset: int) -> list[dict[str,Any]]:
  self._tenant(organization_id,tenant)
  return await self.repository.list(connection,resource,organization_id,limit,offset)
 async def _validate_references(self, connection: asyncpg.Connection, organization_id: UUID, resource: str, values: dict[str,Any]) -> None:
  allowed_status = {"active","inactive","suspended"} if resource=="sales_profiles" else {"active","inactive","archived"}
  if values.get("status") is not None and values["status"] not in allowed_status:
   raise APIError(422,"invalid_master_data_status","The status is not supported for this resource.")
  for field in ("user_id","supervisor_user_id","manager_user_id"):
   user_id=values.get(field)
   if user_id is not None:
    member=await connection.fetchval("select exists(select 1 from public.organization_memberships where organization_id=$1 and user_id=$2 and status='active')",organization_id,user_id)
    if not member: raise APIError(422,"tenant_member_required","Assigned users must have an active membership in this organization.")
 async def list_assignments(self, connection: asyncpg.Connection, organization_id: UUID, tenant: TenantContext, limit: int, offset: int) -> list[dict[str,Any]]:
  self._tenant(organization_id,tenant)
  return await self.repository.list_assignments(connection,organization_id,limit,offset)
 async def create(self, connection: asyncpg.Connection, request: Request, principal: Principal, tenant: TenantContext, resource: str, organization_id: UUID, values: dict[str,Any]) -> dict[str,Any]:
  self._tenant(organization_id,tenant)
  await self._validate_references(connection,organization_id,resource,values)
  try:
   async with connection.transaction():
    row=await self.repository.create(connection,resource,organization_id,values)
    await write_audit(connection,request,principal,f"{resource}.created",resource,str(row["id"]),tenant,{"fields":sorted(values)})
    return row
  except ValueError as exc:
   raise APIError(422,"invalid_master_data",str(exc)) from exc
  except asyncpg.UniqueViolationError as exc:
   raise APIError(409,"master_data_conflict","A tenant-scoped code or identity already exists.") from exc
  except asyncpg.ForeignKeyViolationError as exc:
   raise APIError(422,"invalid_master_data_reference","A referenced branch, team, territory or user is not valid for this tenant.") from exc
 async def update(self, connection: asyncpg.Connection, request: Request, principal: Principal, tenant: TenantContext, resource: str, organization_id: UUID, resource_id: UUID, values: dict[str,Any]) -> dict[str,Any]:
  self._tenant(organization_id,tenant)
  await self._validate_references(connection,organization_id,resource,values)
  try:
   async with connection.transaction():
    row=await self.repository.update(connection,resource,organization_id,resource_id,values)
    if row is None: raise APIError(404,"master_data_not_found","The tenant-owned record was not found.")
    await write_audit(connection,request,principal,f"{resource}.updated",resource,str(resource_id),tenant,{"fields":sorted(values)})
    return row
  except ValueError as exc:
   raise APIError(422,"invalid_master_data",str(exc)) from exc
  except asyncpg.UniqueViolationError as exc:
   raise APIError(409,"master_data_conflict","A tenant-scoped code already exists.") from exc
  except asyncpg.ForeignKeyViolationError as exc:
   raise APIError(422,"invalid_master_data_reference","A referenced record does not belong to this tenant.") from exc
 async def assign_outlet(self, connection: asyncpg.Connection, request: Request, principal: Principal, tenant: TenantContext, organization_id: UUID, outlet_id: UUID, sales_profile_id: UUID, note: str | None) -> dict[str,Any]:
  self._tenant(organization_id,tenant)
  try:
   valid=await connection.fetchval("""select exists(select 1 from public.outlets where id=$1 and organization_id=$2 and status='active')
     and exists(select 1 from public.sales_profiles where id=$3 and organization_id=$2 and status='active')""",outlet_id,organization_id,sales_profile_id)
   if not valid: raise APIError(422,"invalid_assignment_target","An active tenant outlet and active sales profile are required.")
   async with connection.transaction():
    row=await self.repository.assign_outlet(connection,organization_id,outlet_id,sales_profile_id,principal.user_id,note)
    await write_audit(connection,request,principal,"outlet.assignment.created","outlet_assignment",str(row["id"]),tenant,{"outlet_id":str(outlet_id),"sales_profile_id":str(sales_profile_id)})
    return row
  except asyncpg.UniqueViolationError as exc:
   raise APIError(409,"assignment_conflict","An active assignment already exists for this outlet.") from exc
  except asyncpg.ForeignKeyViolationError as exc:
   raise APIError(404,"assignment_resource_not_found","Outlet or sales profile does not exist in the active tenant.") from exc

master_data_service=MasterDataService()
