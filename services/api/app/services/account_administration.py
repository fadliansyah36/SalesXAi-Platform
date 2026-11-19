from uuid import UUID
from fastapi import Request
import asyncpg
from app.errors import APIError
from app.security.dependencies import Principal
from app.services.audit import write_audit
from app.services.authorization import authorization_service
from app.repositories.account_administration import AccountAdministrationRepository

class AccountAdministrationService:
 def __init__(self,repository:AccountAdministrationRepository|None=None):
  self.repository=repository or AccountAdministrationRepository()

 async def update_status(self,connection:asyncpg.Connection,request:Request,principal:Principal,user_id:UUID,status:str)->dict:
  authorization_service.assert_action_context(request,"platform.users.status",principal.user_id)
  if user_id==principal.user_id:
   raise APIError(409,"self_lockout_prevented","You cannot suspend or deactivate your own platform account.")
  target=await self.repository.get_account(connection,user_id)
  if target is None:
   raise APIError(404,"identity_not_found","Target profile was not found.")
  ban_duration="876000h" if status in {"suspended","deactivated"} else "none"
  async with connection.transaction():
   row=await self.repository.set_status(connection,user_id,status)
   await write_audit(connection,request,principal,"platform.account.status_changed","profile",str(user_id),
    metadata={"previous_status":target["status"],"status":status,"auth_ban_applied":False,"auth_ban_pending":True})
  try:
   await request.app.state.supabase_auth.set_user_ban(str(user_id),ban_duration)
  except Exception:
   async with connection.transaction():
    await write_audit(connection,request,principal,"platform.account.auth_ban_failed","profile",str(user_id),
     metadata={"status":status,"api_deny_enforced":True})
   raise
  async with connection.transaction():
   await write_audit(connection,request,principal,"platform.account.auth_ban_applied","profile",str(user_id),
    metadata={"status":status,"ban_duration":ban_duration})
  return {"user_id":str(row["id"]),"status":row["status"],"session_revoked_at":row["session_revoked_at"],
   "supabase_auth_ban_applied":True,"api_session_epoch_enforced":status!="active"}

account_administration_service=AccountAdministrationService()
