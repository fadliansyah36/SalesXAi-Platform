from uuid import UUID
import asyncpg

class SessionMutationRepository:
 async def get_auth_session_expiry(self,connection:asyncpg.Connection,session_id:UUID,user_id:UUID):
  return await connection.fetchrow("select not_after as expires_at from auth.sessions where id=$1 and user_id=$2",session_id,user_id)
 async def get_session_revocation(self,connection:asyncpg.Connection,session_id:UUID):
  return await connection.fetchrow("select revoked_at from public.session_devices where auth_session_id=$1",session_id)
 async def register(self,connection:asyncpg.Connection,session_id:UUID,user_id:UUID,device_id:str|None,device_name:str|None,platform:str,user_agent:str,expires_at):
  await connection.execute("""insert into public.session_devices(auth_session_id,user_id,device_id,device_name,platform,user_agent,expires_at,last_seen_at)
   values($1,$2,$3,$4,$5,$6,$7,now())
   on conflict(auth_session_id) do update set device_id=excluded.device_id,device_name=excluded.device_name,
   platform=excluded.platform,user_agent=excluded.user_agent,expires_at=excluded.expires_at,last_seen_at=now()""",
   session_id,user_id,device_id,device_name,platform,user_agent,expires_at)
 async def owns_auth_session(self,connection:asyncpg.Connection,session_id:UUID,user_id:UUID)->bool:
  return bool(await connection.fetchval("select exists(select 1 from auth.sessions where id=$1 and user_id=$2)",session_id,user_id))
 async def revoke(self,connection:asyncpg.Connection,session_id:UUID,user_id:UUID):
  await connection.execute("""insert into public.session_devices(auth_session_id,user_id,platform,revoked_at)
   values($1,$2,'unknown',now()) on conflict(auth_session_id) do update set revoked_at=now()""",session_id,user_id)
 async def apply_signout(self,connection:asyncpg.Connection,user_id:UUID,session_id:UUID,scope:str):
  if scope=="global":
   await connection.execute("update public.profiles set session_revoked_at=now(),updated_at=now() where id=$1",user_id)
   await connection.execute("update public.session_devices set revoked_at=coalesce(revoked_at,now()) where user_id=$1",user_id)
  elif scope=="others":
   await connection.execute("""update public.session_devices set revoked_at=coalesce(revoked_at,now())
    where user_id=$1 and auth_session_id<>$2""",user_id,session_id)
  else:
   await connection.execute("""insert into public.session_devices(auth_session_id,user_id,platform,revoked_at)
    values($1,$2,'unknown',now())
    on conflict(auth_session_id) do update set revoked_at=coalesce(public.session_devices.revoked_at,now())""",session_id,user_id)

