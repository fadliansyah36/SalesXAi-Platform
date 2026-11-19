from datetime import UTC,datetime
import hashlib
import secrets
from uuid import UUID
import asyncpg
from fastapi import Request
from app.errors import APIError
from app.schemas.identity import InvitationCreate,InvitationToken
from app.security.dependencies import Principal,TenantContext
from app.services.audit import write_audit
from app.services.authorization import authorization_service
from app.services.organization_mutations import organization_mutation_service
from app.repositories.invitation_mutations import InvitationMutationRepository

class InvitationMutationService:
 def __init__(self,repository:InvitationMutationRepository|None=None):
  self.repository=repository or InvitationMutationRepository()
 def _hash(self,token:str)->str:
  return hashlib.sha256(token.encode("utf-8")).hexdigest()
 def _url(self,request:Request,token:str,callback:bool=False)->str:
  settings=request.app.state.settings
  base=str(settings.app_public_url).rstrip("/") if settings.app_public_url else ""
  if not base:
      raise APIError(503,"app_public_url_not_configured","APP_PUBLIC_URL is required to create an invitation URL.")
  return base+("/auth/callback?organization_invite=" if callback else "/auth/accept-invitation?token=")+token
 async def _delivery(self,request:Request,principal:Principal,tenant:TenantContext,invitation:dict,token:str,identity,connection:asyncpg.Connection,provider_failure_revokes:bool)->str:
  invite_url=self._url(request,token)
  try:
   if identity and identity["email_confirmed_at"] is not None:
    await request.app.state.invitation_delivery.send(recipient=invitation["email"],organization_name=tenant.organization_name,
     role_key=invitation["role_key"],invitation_url=invite_url)
    return "smtp_email_sent"
   callback=self._url(request,token,True)
   if identity:
    await request.app.state.supabase_auth.resend_signup_confirmation(invitation["email"],callback)
    return "supabase_auth_verification_sent"
   await request.app.state.supabase_auth.invite_user(invitation["email"],callback)
   return "supabase_auth_invite_sent"
  except Exception:
   async with connection.transaction():
    if provider_failure_revokes and (not identity or identity["email_confirmed_at"] is None):
     await self.repository.revoke_delivery_failure(connection,invitation["id"])
    await write_audit(connection,request,principal,"organization.invitation.delivery_failed","organization_invitation",
     str(invitation["id"]),tenant,metadata={"delivery_provider":"smtp_or_supabase_auth"})
   raise
 async def list_invitations(self,connection:asyncpg.Connection,request:Request,principal:Principal,tenant:TenantContext,organization_id:UUID)->list[dict]:
  if tenant.organization_id!=organization_id:
      raise APIError(403,"forbidden","Cross-tenant invitation access is denied.")
  async with connection.transaction():
   expired=await self.repository.expire_pending(connection,organization_id)
   for item in expired:
    await write_audit(connection,request,principal,"organization.invitation.expired","organization_invitation",str(item["id"]),tenant,metadata={"email":item["email"]})
  rows=await self.repository.list_for_tenant(connection,organization_id)
  return [dict(row) for row in rows]
 async def create_invitation(self,connection:asyncpg.Connection,request:Request,principal:Principal,tenant:TenantContext,organization_id:UUID,payload:InvitationCreate)->dict:
  authorization_service.assert_action_context(request,"organization.invitations.create",principal.user_id,organization_id)
  if tenant.organization_id!=organization_id:
      raise APIError(403,"forbidden","Cross-tenant invitation access is denied.")
  email=payload.email.strip().lower()
  role=await self.repository.get_role(connection,payload.role_key)
  if role is None or role["scope_type"] not in {"tenant","branch"} or role["key"]=="tenant_owner":
   raise APIError(400,"invalid_role","Only delegable tenant- or branch-scoped roles can be invited.")
  actor_level=await organization_mutation_service._delegation_level(connection,principal.user_id,tenant.membership_id,organization_id,
   "organization:invitations:manage",payload.branch_id if role["scope_type"]=="branch" else None,getattr(request.state,"resource_attributes",{}))
  if actor_level is None or role["hierarchy_level"]<=actor_level:
   raise APIError(403,"privilege_escalation_denied","You cannot invite an equal- or higher-privilege role.")
  if role["scope_type"]=="branch":
   if payload.branch_id is None:
       raise APIError(400,"branch_scope_required","A branch ID is required for this role.")
   if not await self.repository.branch_is_active(connection,payload.branch_id,organization_id):
    raise APIError(403,"invalid_branch_scope","The selected branch is outside this organization.")
  elif payload.branch_id is not None:
      raise APIError(400,"invalid_branch_scope","Tenant-scoped roles cannot carry a branch ID.")
  membership_status=await self.repository.existing_membership_status(connection,organization_id,email)
  if membership_status=="active":
      raise APIError(409,"member_already_active","This identity is already an active organization member.")
  if membership_status=="suspended":
      raise APIError(409,"membership_suspended","A suspended membership must be reinstated by an organization administrator.")
  if await self.repository.pending_invitation_exists(connection,organization_id,email):
   raise APIError(409,"pending_invitation_exists","A pending invitation already exists for this email.")
  token=secrets.token_urlsafe(40)
  self._url(request,token)
  identity=await self.repository.auth_identity(connection,email)
  async with connection.transaction():
   invitation=await self.repository.create(connection,organization_id,email,payload.title,payload.branch_id,payload.role_key,self._hash(token),principal.user_id)
   await write_audit(connection,request,principal,"organization.invitation.created","organization_invitation",str(invitation["id"]),tenant,
    metadata={"email":email,"role_key":payload.role_key})
  delivery=await self._delivery(request,principal,tenant,dict(invitation),token,identity,connection,True)
  return {**dict(invitation),"invitation_url":self._url(request,token),"delivery_status":delivery}
 async def accept_invitation(self,connection:asyncpg.Connection,request:Request,principal:Principal,payload:InvitationToken)->dict:
  authorization_service.assert_action_context(request,"organization.invitations.accept",principal.user_id)
  expired=False
  result=None
  async with connection.transaction():
   invitation=await self.repository.lock_for_accept(connection,self._hash(payload.token),principal.user_id)
   if invitation is None:
       raise APIError(404,"invitation_not_found","Invitation is invalid, used or revoked.")
   if invitation["expires_at"]<=datetime.now(UTC):
    await self.repository.expire_one(connection,invitation["id"])
     expired=True
   elif (not invitation["auth_email"] or invitation["email_confirmed_at"] is None or invitation["auth_email"].lower()!=invitation["email"]):
    raise APIError(403,"invitation_email_mismatch","Sign in with the verified email address that received this invitation.")
   else:
    role=await self.repository.get_role(connection,invitation["role_key"])
    if role is None:
        raise APIError(409,"invitation_role_unavailable","The invitation role is no longer available.")
    if role["scope_type"]=="branch":
     if invitation["branch_id"] is None or not await self.repository.branch_is_active(connection,invitation["branch_id"],invitation["organization_id"]):
      raise APIError(409,"invitation_scope_invalid","The invited branch is no longer active in this organization.")
    elif invitation["branch_id"] is not None:
        raise APIError(409,"invitation_scope_invalid","A tenant-scoped invitation cannot include a branch.")
    member=await self.repository.upsert_accepted_membership(connection,invitation["organization_id"],principal.user_id,invitation["branch_id"],invitation["title"])
    if member is None:
        raise APIError(409,"membership_not_eligible","A suspended membership must be reinstated by an organization administrator.")
    scope_id=invitation["branch_id"] if role["scope_type"]=="branch" else invitation["organization_id"]
    exists=await self.repository.has_role_assignment(connection,principal.user_id,member["id"],role["id"],role["scope_type"],scope_id)
    if not exists:
        await self.repository.assign_invited_role(connection,principal.user_id,member["id"],role["id"],role["scope_type"],scope_id,invitation["invited_by"])
    await self.repository.mark_accepted(connection,invitation["id"],principal.user_id)
    result={"membership_id":str(member["id"]),"organization_id":str(member["organization_id"]),"status":member["status"]}
    await write_audit(connection,request,principal,"organization.invitation.accepted","organization_invitation",str(invitation["id"]),
     metadata={"organization_id":str(invitation["organization_id"])})
  if expired:
      raise APIError(410,"invitation_expired","Invitation has expired. Ask the organization administrator to resend it.")
  return result or {}
 async def reject_invitation(self,connection:asyncpg.Connection,request:Request,principal:Principal,payload:InvitationToken)->dict:
  authorization_service.assert_action_context(request,"organization.invitations.reject",principal.user_id)
  async with connection.transaction():
   row=await self.repository.reject(connection,self._hash(payload.token),principal.user_id)
   if row is None:
       raise APIError(404,"invitation_not_found","Invitation is invalid, expired or not addressed to this account.")
   await write_audit(connection,request,principal,"organization.invitation.rejected","organization_invitation",str(row["id"]),
    metadata={"organization_id":str(row["organization_id"])})
  return {"id":str(row["id"]),"status":"rejected"}
 async def revoke_invitation(self,connection:asyncpg.Connection,request:Request,principal:Principal,tenant:TenantContext,organization_id:UUID,invitation_id:UUID)->dict:
  authorization_service.assert_action_context(request,"organization.invitations.revoke",principal.user_id,organization_id)
  if tenant.organization_id!=organization_id:
      raise APIError(403,"forbidden","Cross-tenant invitation access is denied.")
  async with connection.transaction():
   row=await self.repository.revoke(connection,invitation_id,organization_id)
   if row is None:
       raise APIError(404,"invitation_not_found","Pending invitation was not found.")
   await write_audit(connection,request,principal,"organization.invitation.revoked","organization_invitation",str(row["id"]),tenant,metadata={"email":row["email"]})
  return {"id":str(row["id"]),"status":"revoked"}
 async def resend_invitation(self,connection:asyncpg.Connection,request:Request,principal:Principal,tenant:TenantContext,organization_id:UUID,invitation_id:UUID)->dict:
  authorization_service.assert_action_context(request,"organization.invitations.resend",principal.user_id,organization_id)
  if tenant.organization_id!=organization_id:
      raise APIError(403,"forbidden","Cross-tenant invitation access is denied.")
  token=secrets.token_urlsafe(40)
  self._url(request,token)
  async with connection.transaction():
   row=await self.repository.resend(connection,invitation_id,organization_id,self._hash(token))
   if row is None:
       raise APIError(404,"invitation_not_found","Pending invitation was not found.")
   role=await self.repository.get_role(connection,row["role_key"])
   if role is None:
       raise APIError(409,"invitation_role_unavailable","The invitation role is no longer available.")
   if role["scope_type"]=="branch":
    if row["branch_id"] is None or not await self.repository.branch_is_active(connection,row["branch_id"],organization_id):
     raise APIError(409,"invitation_scope_invalid","The invitation branch is no longer active in this organization.")
   elif row["branch_id"] is not None:
       raise APIError(409,"invitation_scope_invalid","A tenant-scoped invitation cannot include a branch.")
   actor_level=await organization_mutation_service._delegation_level(connection,principal.user_id,tenant.membership_id,organization_id,
    "organization:invitations:manage",row["branch_id"] if role["scope_type"]=="branch" else None,getattr(request.state,"resource_attributes",{}))
   if actor_level is None or role["hierarchy_level"]<=actor_level:
    raise APIError(403,"privilege_escalation_denied","You cannot resend an equal- or higher-privilege invitation.")
   await write_audit(connection,request,principal,"organization.invitation.resent","organization_invitation",str(row["id"]),tenant,metadata={"email":row["email"]})
  identity=await self.repository.auth_identity(connection,row["email"])
  delivery=await self._delivery(request,principal,tenant,dict(row),token,identity,connection,False)
  return {**dict(row),"invitation_url":self._url(request,token),"delivery_status":delivery}

invitation_mutation_service=InvitationMutationService()
