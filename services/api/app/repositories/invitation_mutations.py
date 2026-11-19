from uuid import UUID
import asyncpg

class InvitationMutationRepository:
 async def expire_pending(self,connection:asyncpg.Connection,organization_id:UUID):
  return await connection.fetch("""update public.organization_invitations set status='expired',updated_at=now()
   where organization_id=$1 and status='pending' and expires_at<=now() returning id,email""",organization_id)
 async def list_for_tenant(self,connection:asyncpg.Connection,organization_id:UUID):
  return await connection.fetch("""select id,email,title,branch_id,role_key,status,expires_at,accepted_at,rejected_at,revoked_at,resent_at,resend_count,created_at
   from public.organization_invitations where organization_id=$1 order by created_at desc limit 200""",organization_id)
 async def get_role(self,connection:asyncpg.Connection,role_key:str):
  return await connection.fetchrow("select id,key,scope_type,hierarchy_level from public.roles where key=$1",role_key)
 async def branch_is_active(self,connection:asyncpg.Connection,branch_id:UUID,organization_id:UUID)->bool:
  return bool(await connection.fetchval("select exists(select 1 from public.branches where id=$1 and organization_id=$2 and status='active')",branch_id,organization_id))
 async def existing_membership_status(self,connection:asyncpg.Connection,organization_id:UUID,email:str):
  return await connection.fetchval("""select m.status from public.organization_memberships m
   join auth.users u on u.id=m.user_id where m.organization_id=$1 and lower(u.email)=lower($2) limit 1""",organization_id,email)
 async def pending_invitation_exists(self,connection:asyncpg.Connection,organization_id:UUID,email:str)->bool:
  return bool(await connection.fetchval("""select exists(select 1 from public.organization_invitations
   where organization_id=$1 and email=$2 and status='pending' and expires_at>now())""",organization_id,email))
 async def auth_identity(self,connection:asyncpg.Connection,email:str):
  return await connection.fetchrow("select email_confirmed_at from auth.users where lower(email)=lower($1) limit 1",email)
 async def create(self,connection:asyncpg.Connection,organization_id:UUID,email:str,title:str|None,branch_id:UUID|None,role_key:str,token_hash:str,actor_id:UUID):
  return await connection.fetchrow("""insert into public.organization_invitations
   (organization_id,email,title,branch_id,role_key,token_hash,status,invited_by,expires_at)
   values($1,$2,$3,$4,$5,$6,'pending',$7,now()+interval '7 days')
   returning id,email,role_key,status,expires_at,created_at""",
   organization_id,email,title,branch_id,role_key,token_hash,actor_id)
 async def revoke_delivery_failure(self,connection:asyncpg.Connection,invitation_id:UUID):
  await connection.execute("""update public.organization_invitations set status='revoked',revoked_at=now(),updated_at=now()
   where id=$1 and status='pending'""",invitation_id)
 async def lock_for_accept(self,connection:asyncpg.Connection,token_hash:str,user_id:UUID):
  return await connection.fetchrow("""select i.*,u.email auth_email,u.email_confirmed_at
   from public.organization_invitations i join auth.users u on u.id=$2
   where i.token_hash=$1 and i.status='pending' for update of i""",token_hash,user_id)
 async def expire_one(self,connection:asyncpg.Connection,invitation_id:UUID):
  await connection.execute("update public.organization_invitations set status='expired',updated_at=now() where id=$1",invitation_id)
 async def upsert_accepted_membership(self,connection:asyncpg.Connection,organization_id:UUID,user_id:UUID,branch_id:UUID|None,title:str|None):
  return await connection.fetchrow("""insert into public.organization_memberships
   (organization_id,user_id,branch_id,status,title,joined_at) values($1,$2,$3,'active',$4,now())
   on conflict(organization_id,user_id) do update set status='active',branch_id=excluded.branch_id,title=excluded.title,
   joined_at=coalesce(public.organization_memberships.joined_at,now()),updated_at=now()
   where public.organization_memberships.status in ('invited','removed')
   returning id,organization_id,user_id,status,branch_id""",organization_id,user_id,branch_id,title)
 async def has_role_assignment(self,connection:asyncpg.Connection,user_id:UUID,membership_id:UUID,role_id:UUID,scope_type:str,scope_id:UUID)->bool:
  return bool(await connection.fetchval("""select exists(select 1 from public.user_role_assignments
   where user_id=$1 and membership_id=$2 and role_id=$3 and scope_type=$4 and scope_id=$5
   and revoked_at is null and (expires_at is null or expires_at>now()))""",user_id,membership_id,role_id,scope_type,scope_id))
 async def assign_invited_role(self,connection:asyncpg.Connection,user_id:UUID,membership_id:UUID,role_id:UUID,scope_type:str,scope_id:UUID,actor_id:UUID):
  await connection.execute("""insert into public.user_role_assignments
   (user_id,membership_id,role_id,scope_type,scope_id,assigned_by) values($1,$2,$3,$4,$5,$6)""",
   user_id,membership_id,role_id,scope_type,scope_id,actor_id)
 async def mark_accepted(self,connection:asyncpg.Connection,invitation_id:UUID,user_id:UUID):
  await connection.execute("""update public.organization_invitations set status='accepted',accepted_by=$2,
   accepted_at=now(),updated_at=now() where id=$1""",invitation_id,user_id)
 async def reject(self,connection:asyncpg.Connection,token_hash:str,user_id:UUID):
  return await connection.fetchrow("""update public.organization_invitations i
   set status='rejected',rejected_at=now(),updated_at=now()
   from auth.users u where i.token_hash=$1 and i.status='pending' and u.id=$2
    and u.email_confirmed_at is not null and lower(u.email)=i.email and i.expires_at>now()
   returning i.id,i.organization_id,i.email""",token_hash,user_id)
 async def revoke(self,connection:asyncpg.Connection,invitation_id:UUID,organization_id:UUID):
  return await connection.fetchrow("""update public.organization_invitations set status='revoked',revoked_at=now(),updated_at=now()
   where id=$1 and organization_id=$2 and status='pending' returning id,email""",invitation_id,organization_id)
 async def resend(self,connection:asyncpg.Connection,invitation_id:UUID,organization_id:UUID,token_hash:str):
  return await connection.fetchrow("""update public.organization_invitations
   set token_hash=$3,expires_at=now()+interval '7 days',resent_at=now(),resend_count=resend_count+1,updated_at=now()
   where id=$1 and organization_id=$2 and status='pending'
   returning id,email,role_key,branch_id,expires_at""",invitation_id,organization_id,token_hash)
