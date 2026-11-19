from uuid import UUID
import asyncpg

class AccountAdministrationRepository:
 async def get_account(self, connection: asyncpg.Connection, user_id: UUID):
  return await connection.fetchrow("select id,status from public.profiles where id=$1",user_id)

 async def set_status(self, connection: asyncpg.Connection, user_id: UUID, status: str):
  if status in {"suspended","deactivated"}:
   row=await connection.fetchrow("""update public.profiles
     set status=$2,session_revoked_at=now(),updated_at=now()
     where id=$1 returning id,status,session_revoked_at""",user_id,status)
   await connection.execute("""update public.session_devices
     set revoked_at=coalesce(revoked_at,now()) where user_id=$1""",user_id)
   return row
  return await connection.fetchrow("""update public.profiles set status='active',updated_at=now()
    where id=$1 returning id,status,session_revoked_at""",user_id)
