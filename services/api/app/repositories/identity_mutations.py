from uuid import UUID
import asyncpg

class IdentityMutationRepository:
 async def get_owned_identity(self,connection:asyncpg.Connection,identity_id:UUID,user_id:UUID):
  return await connection.fetchrow("""select auth_identity_id,provider from public.user_identities
   where auth_identity_id=$1 and user_id=$2""",identity_id,user_id)
 async def count_auth_identities(self,connection:asyncpg.Connection,user_id:UUID)->int:
  return int(await connection.fetchval("select count(*) from auth.identities where user_id=$1",user_id) or 0)
