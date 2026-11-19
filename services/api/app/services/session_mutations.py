import asyncpg
from fastapi import Request
from uuid import UUID
from app.errors import APIError
from app.schemas.identity import SessionRegistration,SignOutRequest
from app.security.dependencies import Principal
from app.services.audit import write_audit
from app.services.authorization import authorization_service
from app.repositories.session_mutations import SessionMutationRepository

class SessionMutationService:
 def __init__(self,repository:SessionMutationRepository|None=None):
  self.repository=repository or SessionMutationRepository()
 async def register(self,connection:asyncpg.Connection,request:Request,principal:Principal,payload:SessionRegistration)->None:
  authorization_service.assert_action_context(request,"identity.session.register",principal.user_id)
  auth_session=await self.repository.get_auth_session_expiry(connection,principal.session_id,principal.user_id)
  if auth_session is None: raise APIError(401,"session_revoked","The Supabase Auth session is no longer active.")
  async with connection.transaction():
   existing=await self.repository.get_session_revocation(connection,principal.session_id)
   if existing and existing["revoked_at"] is not None: raise APIError(401,"session_revoked","This device session has been revoked.")
   await self.repository.register(connection,principal.session_id,principal.user_id,payload.device_id,payload.device_name,
    payload.platform,payload.user_agent or request.headers.get("user-agent","")[:512],auth_session["expires_at"])
   await write_audit(connection,request,principal,"auth.session.registered","auth_session",str(principal.session_id),metadata={"platform":payload.platform})
 async def revoke(self,connection:asyncpg.Connection,request:Request,principal:Principal,session_id:UUID)->None:
  authorization_service.assert_action_context(request,"identity.session.revoke",principal.user_id)
  if not await self.repository.owns_auth_session(connection,session_id,principal.user_id):
   raise APIError(404,"session_not_found","The requested session was not found.")
  async with connection.transaction():
   await self.repository.revoke(connection,session_id,principal.user_id)
   await write_audit(connection,request,principal,"auth.session.revoked","auth_session",str(session_id),
    metadata={"current_session":session_id==principal.session_id})
 async def sign_out(self,connection:asyncpg.Connection,request:Request,principal:Principal,payload:SignOutRequest)->None:
  authorization_service.assert_action_context(request,"identity.session.signout",principal.user_id)
  authorization=request.headers.get("authorization","")
  access_token=authorization[7:] if authorization.lower().startswith("bearer ") else ""
  if not access_token: raise APIError(401,"unauthenticated","A valid access token is required.")
  await request.app.state.supabase_auth.sign_out(access_token,payload.scope)
  async with connection.transaction():
   await self.repository.apply_signout(connection,principal.user_id,principal.session_id,payload.scope)
   await write_audit(connection,request,principal,"auth.session.remote_signed_out","auth_session",str(principal.session_id),
    metadata={"scope":payload.scope,"supabase_auth_confirmed":True})

session_mutation_service=SessionMutationService()
