from uuid import UUID
import asyncpg
from fastapi import Request
from app.errors import APIError
from app.schemas.identity import OrganizationCreate
from app.security.dependencies import Principal,TenantContext
from app.services.audit import write_audit
from app.services.authorization import authorization_service
from app.repositories.organization_mutations import OrganizationMutationRepository

class OrganizationMutationService:
 def __init__(self,repository:OrganizationMutationRepository|None=None):
  self.repository=repository or OrganizationMutationRepository()
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

organization_mutation_service=OrganizationMutationService()
