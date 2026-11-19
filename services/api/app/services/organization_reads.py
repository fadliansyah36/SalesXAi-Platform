from uuid import UUID
import asyncpg
from fastapi import Request
from app.errors import APIError
from app.repositories.organization_reads import OrganizationReadRepository
from app.security.dependencies import Principal,TenantContext
from app.security.policy import abac_conditions_match
from app.services.authorization import authorization_service

class OrganizationReadService:
 def __init__(self,repository:OrganizationReadRepository|None=None):
  self.repository=repository or OrganizationReadRepository()
 async def list_my_organizations(self,connection:asyncpg.Connection,principal:Principal)->list[dict]:
  return await self.repository.list_my_organizations(connection,principal.user_id)
 async def list_members(self,connection:asyncpg.Connection,organization_id:UUID,tenant:TenantContext)->list[dict]:
  if tenant.organization_id!=organization_id:
   raise APIError(403,"forbidden","Cross-tenant membership access is denied.")
  return await self.repository.list_members(connection,organization_id)
 async def list_assignable_roles(self,connection:asyncpg.Connection,request:Request,principal:Principal,
  tenant:TenantContext,organization_id:UUID)->list[dict]:
  authorization_service.assert_action_context(request,"organization.roles.assignable",principal.user_id,organization_id)
  if tenant.organization_id!=organization_id:
   raise APIError(403,"forbidden","Cross-tenant role catalog access is denied.")
  selected_branch_id=tenant.branch_id
  raw_branch_id=request.headers.get("x-resource-branch-id")
  if raw_branch_id:
   try:
    selected_branch_id=UUID(raw_branch_id)
   except ValueError as exc:
    raise APIError(400,"invalid_tenant_context","Resource branch identifier is invalid.") from exc
  attributes=getattr(request.state,"resource_attributes",{})
  tenant_rows=await self.repository.delegation_levels(connection,principal.user_id,tenant.membership_id,
   organization_id,"organization:invitations:manage",None,attributes)
  branch_rows=await self.repository.delegation_levels(connection,principal.user_id,tenant.membership_id,
   organization_id,"organization:invitations:manage",selected_branch_id,attributes)
  tenant_levels=[row["hierarchy_level"] for row in tenant_rows if abac_conditions_match(row["attributes"],attributes)]
  branch_levels=[row["hierarchy_level"] for row in branch_rows if abac_conditions_match(row["attributes"],attributes)]
  tenant_level=min(tenant_levels) if tenant_levels else None
  branch_level=min(branch_levels) if branch_levels else None
  if tenant_level is None and branch_level is None:
   raise APIError(403,"forbidden","An active scoped role is required to delegate access.")
  return await self.repository.list_delegable_roles(connection,tenant_level,branch_level)

organization_read_service=OrganizationReadService()
