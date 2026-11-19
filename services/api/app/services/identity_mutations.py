from uuid import UUID
import asyncpg
from fastapi import Request
from app.errors import APIError
from app.security.dependencies import Principal
from app.services.authorization import authorization_service
from app.repositories.identity_mutations import IdentityMutationRepository

class IdentityMutationService:
 def __init__(self,repository:IdentityMutationRepository|None=None):
  self.repository=repository or IdentityMutationRepository()
 async def unlink_own_identity(self,connection:asyncpg.Connection,request:Request,principal:Principal,identity_id:UUID)->None:
  authorization_service.assert_action_context(request,"identity.link.unlink",principal.user_id)
  identity=await self.repository.get_owned_identity(connection,identity_id,principal.user_id)
  if identity is None:
      raise APIError(404,"identity_not_found","Linked identity was not found on the active account.")
  if await self.repository.count_auth_identities(connection,principal.user_id)<=1:
   raise APIError(409,"last_identity_cannot_be_removed","At least one verified sign-in identity must remain.")
  authorization=request.headers.get("authorization","")
  access_token=authorization[7:] if authorization.lower().startswith("bearer ") else ""
  if not access_token:
      raise APIError(401,"unauthenticated","A valid access token is required.")
  await request.app.state.supabase_auth.unlink_identity(access_token,str(identity_id))

identity_mutation_service=IdentityMutationService()
