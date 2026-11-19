from uuid import UUID
import asyncpg
from fastapi import Request
from app.errors import APIError
from app.schemas.identity import OrganizationCreate
from app.security.dependencies import Principal,TenantContext
from app.services.audit import write_audit
from app.services.authorization import authorization_service
from app.repositories.organization_mutations import OrganizationMutationRepository
from app.repositories.master_data import MasterDataRepository
from app.security.policy import abac_conditions_match

class OrganizationMutationService:
 def __init__(self,repository:OrganizationMutationRepository|None=None):
  self.repository=repository or OrganizationMutationRepository()
  self.master_data_repository=MasterDataRepository()
 async def create_organization(self,connection:asyncpg.Connection,request:Request,principal:Principal,payload:OrganizationCreate):
  authorization_service.assert_action_context(request,"organization.create",principal.user_id)
  async with connection.transaction():
   org=await self.repository.create_organization(connection,payload.slug,payload.name.strip(),payload.legal_name,principal.user_id)
   await write_audit(connection,request,principal,"organization.created","organization",str(org["id"]),metadata={"slug":payload.slug})
  return dict(org)
 async def add_member(self,connection:asyncpg.Connection,request:Request,principal:Principal,tenant:TenantContext,organization_id:UUID,user_id:UUID,title:str|None):
  authorization_service.assert_action_context(request,"organization.members.invite",principal.user_id,organization_id)
  if tenant.organization_id!=organization_id: raise APIError(403,"forbidden","Cross-tenant membership access is denied.")
  if not await self.repository.auth_identity_exists(connection,user_id):
   raise APIError(404,"identity_not_found","The Supabase Auth identity does not exist.")
  async with connection.transaction():
   row=await self.repository.add_member(connection,organization_id,user_id,title)
   await write_audit(connection,request,principal,"organization.member.invited","organization_membership",str(row["id"]),tenant,
    metadata={"member_user_id":str(user_id)})
  return dict(row)


 async def _delegation_level(self,connection:asyncpg.Connection,user_id:UUID,membership_id:UUID,organization_id:UUID,permission_key:str,branch_id:UUID|None,resource_attributes:dict|None)->int|None:
  rows=await self.repository.delegation_rows(connection,user_id,membership_id,organization_id,branch_id,permission_key)
  levels=[row["hierarchy_level"] for row in rows if abac_conditions_match(row["attributes"],resource_attributes or {})]
  return min(levels) if levels else None
 async def update_member_status(self,connection:asyncpg.Connection,request:Request,principal:Principal,tenant:TenantContext,organization_id:UUID,user_id:UUID,status:str)->dict:
  authorization_service.assert_action_context(request,"organization.members.update",principal.user_id,organization_id)
  if tenant.organization_id!=organization_id: raise APIError(403,"forbidden","Cross-tenant membership access is denied.")
  if user_id==principal.user_id and status!="active": raise APIError(409,"self_lockout_prevented","You cannot suspend or remove your own membership.")
  async with connection.transaction():
   member=await self.repository.lock_member(connection,organization_id,user_id)
   if member is None: raise APIError(404,"membership_not_found","Organization membership was not found.")
   if user_id!=principal.user_id:
    if await self.repository.target_is_platform_admin(connection,user_id):
     raise APIError(403,"platform_identity_protected","Tenant administrators cannot change a platform-scoped identity.")
    actor_level=await self._delegation_level(connection,principal.user_id,tenant.membership_id,organization_id,
     "organization:members:manage",member["branch_id"],getattr(request.state,"resource_attributes",{}))
    target_level=await self.repository.member_hierarchy_level(connection,user_id,member["id"],organization_id)
    if actor_level is None or (target_level is not None and actor_level>=target_level):
     raise APIError(403,"privilege_escalation_denied","You cannot change a membership with equal or higher privilege.")
   row=await self.repository.update_membership_status(connection,organization_id,user_id,status)
   if row is None: raise APIError(404,"membership_not_found","Organization membership was not found.")
   if status=="removed":
    await self.repository.revoke_membership_roles(connection,row["id"])
    await write_audit(connection,request,principal,"organization.member.roles_revoked_on_removal","organization_membership",str(row["id"]),tenant,metadata={"member_user_id":str(user_id)})
   await write_audit(connection,request,principal,"organization.member.status_changed","organization_membership",str(row["id"]),tenant,metadata={"member_user_id":str(user_id),"status":status})
  return dict(row)
 async def assign_member_role(self,connection:asyncpg.Connection,request:Request,principal:Principal,tenant:TenantContext,organization_id:UUID,user_id:UUID,role_key:str,branch_id:UUID|None)->dict:
  authorization_service.assert_action_context(request,"organization.roles.assign",principal.user_id,organization_id)
  if tenant.organization_id!=organization_id: raise APIError(403,"forbidden","Cross-tenant role assignment is denied.")
  async with connection.transaction():
   member=await self.repository.get_active_member(connection,organization_id,user_id)
   if member is None: raise APIError(404,"membership_not_found","An active target membership is required.")
   role=await self.repository.get_role(connection,role_key)
   if role is None or role["scope_type"] not in {"tenant","branch"} or role["key"]=="tenant_owner":
    raise APIError(400,"invalid_role","Only delegable tenant- or branch-scoped roles can be assigned.")
   if role["scope_type"]=="branch":
    if branch_id is None: raise APIError(400,"branch_scope_required","A branch ID is required for this role.")
    if not await self.repository.branch_is_active(connection,branch_id,organization_id) or (member["branch_id"] is not None and member["branch_id"]!=branch_id):
     raise APIError(403,"invalid_branch_scope","The selected branch is outside the target membership scope.")
    assignment_scope_id=branch_id
   else:
    if branch_id is not None: raise APIError(400,"invalid_branch_scope","Tenant roles cannot carry a branch scope.")
    assignment_scope_id=organization_id
   actor_level=await self._delegation_level(connection,principal.user_id,tenant.membership_id,organization_id,"role:assign",
    assignment_scope_id if role["scope_type"]=="branch" else None,getattr(request.state,"resource_attributes",{}))
   if actor_level is None or role["hierarchy_level"]<=actor_level:
    raise APIError(403,"privilege_escalation_denied","You cannot assign an equal or higher privilege role.")
   assignment=await self.repository.insert_role_assignment(connection,user_id,member["id"],role["id"],role["scope_type"],assignment_scope_id,principal.user_id)
   await write_audit(connection,request,principal,"organization.member.role_assigned","user_role_assignment",str(assignment["id"]),tenant,metadata={"member_user_id":str(user_id),"role_key":role["key"]})
  return dict(assignment)


 async def list_platform_organizations(self,connection:asyncpg.Connection,limit:int,offset:int)->list[dict]:
  rows=await self.repository.list_platform_organizations(connection,limit,offset)
  return [dict(row) for row in rows]
 async def update_platform_organization_status(self,connection:asyncpg.Connection,request:Request,principal:Principal,organization_id:UUID,status:str)->dict:
  authorization_service.assert_action_context(request,"platform.organizations.update",principal.user_id)
  async with connection.transaction():
   row=await self.repository.update_organization_status(connection,organization_id,status)
   if row is None: raise APIError(404,"organization_not_found","Organization was not found.")
   await write_audit(connection,request,principal,"platform.organization.status_changed","organization",str(organization_id),metadata={"status":status})
  return dict(row)


 async def list_platform_branches(self,connection:asyncpg.Connection,request:Request,principal:Principal,organization_id:UUID,limit:int,offset:int)->list[dict]:
  authorization_service.assert_action_context(request,"platform.organizations.branches.read",principal.user_id)
  rows=await self.master_data_repository.list(connection,"branches",organization_id,limit,offset)
  return rows
 async def create_platform_branch(self,connection:asyncpg.Connection,request:Request,principal:Principal,organization_id:UUID,values:dict)->dict:
  authorization_service.assert_action_context(request,"platform.organizations.branches.create",principal.user_id)
  async with connection.transaction():
   row=await self.master_data_repository.create(connection,"branches",organization_id,values)
   await write_audit(connection,request,principal,"platform.organization.branch_created","branch",str(row["id"]),metadata={"organization_id":str(organization_id),"code":row["code"]})
  return row
 async def update_platform_branch(self,connection:asyncpg.Connection,request:Request,principal:Principal,organization_id:UUID,branch_id:UUID,values:dict)->dict:
  authorization_service.assert_action_context(request,"platform.organizations.branches.update",principal.user_id)
  async with connection.transaction():
   row=await self.master_data_repository.update(connection,"branches",organization_id,branch_id,values)
   if row is None: raise APIError(404,"branch_not_found","Branch was not found in this organization.")
   await write_audit(connection,request,principal,"platform.organization.branch_updated","branch",str(branch_id),metadata={"organization_id":str(organization_id),"fields":sorted(values)})
  return row

organization_mutation_service=OrganizationMutationService()
