from uuid import UUID
import asyncpg
from app.errors import APIError
from app.schemas.identity import AuthContextResponse,MembershipResponse,ProfileResponse
from app.security.dependencies import Principal
from app.repositories.identity_reads import IdentityReadRepository

class IdentityReadService:
 def __init__(self,repository:IdentityReadRepository|None=None):
  self.repository=repository or IdentityReadRepository()
 async def get_auth_context(self,connection:asyncpg.Connection,principal:Principal)->AuthContextResponse:
  profile=await self.repository.get_profile(connection,principal.user_id)
  if profile is None: raise APIError(404,"profile_not_found","The authenticated profile was not found.")
  rows=await self.repository.list_memberships(connection,principal.user_id)
  memberships=[]
  for row in rows:
   roles=await self.repository.list_membership_roles(connection,principal.user_id,row["id"],row["status"],row["organization_id"])
   permissions=await self.repository.list_membership_permissions(connection,principal.user_id,row["id"],row["status"],row["organization_id"])
   memberships.append(MembershipResponse(
    id=row["id"],organization_id=row["organization_id"],organization_name=row["organization_name"],
    status=row["status"],branch_id=row["branch_id"],roles=[x["key"] for x in roles],
    permissions=[x["permission_key"] for x in permissions]))
  platform=await self.repository.list_platform_permissions(connection,principal.user_id)
  return AuthContextResponse(user=ProfileResponse(**dict(profile)),session_id=principal.session_id,
   memberships=memberships,platform_permissions=[x["permission_key"] for x in platform])
 async def list_sessions(self,connection:asyncpg.Connection,principal:Principal)->list[dict]:
  return await self.repository.list_sessions(connection,principal.user_id,principal.session_id)
 async def list_linked_identities(self,connection:asyncpg.Connection,principal:Principal)->list[dict]:
  return await self.repository.list_linked_identities(connection,principal.user_id)

identity_read_service=IdentityReadService()
