from uuid import UUID
import asyncpg

class IdentityReadRepository:
 async def get_profile(self,connection:asyncpg.Connection,user_id:UUID):
  return await connection.fetchrow("select id,email,display_name,status from public.profiles where id=$1",user_id)
 async def list_memberships(self,connection:asyncpg.Connection,user_id:UUID):
  return await connection.fetch("""select m.id,m.organization_id,o.name organization_name,m.status,m.branch_id
   from public.organization_memberships m join public.organizations o on o.id=m.organization_id
   where m.user_id=$1 and m.status in ('active','invited','suspended') order by o.name""",user_id)
 async def list_membership_roles(self,connection:asyncpg.Connection,user_id:UUID,membership_id:UUID,status:str,organization_id:UUID):
  return await connection.fetch("""select distinct r.key from public.user_role_assignments ura join public.roles r on r.id=ura.role_id
   where ura.user_id=$1 and ura.membership_id=$2 and $3='active' and ura.revoked_at is null
   and ura.starts_at<=now() and (ura.expires_at is null or ura.expires_at>now())
   and (r.scope_type<>'branch' or exists(select 1 from public.branches b where b.id=ura.scope_id and b.organization_id=$4 and b.status='active')) order by r.key""",
   user_id,membership_id,status,organization_id)
 async def list_membership_permissions(self,connection:asyncpg.Connection,user_id:UUID,membership_id:UUID,status:str,organization_id:UUID):
  return await connection.fetch("""with recursive role_tree(role_id,parent_role_id) as (
    select r.id,r.parent_role_id from public.user_role_assignments ura join public.roles r on r.id=ura.role_id
    where ura.user_id=$1 and ura.membership_id=$2 and $3='active' and ura.revoked_at is null
      and ura.starts_at<=now() and (ura.expires_at is null or ura.expires_at>now())
      and (r.scope_type<>'branch' or exists(select 1 from public.branches b where b.id=ura.scope_id and b.organization_id=$4 and b.status='active'))
    union select p.id,p.parent_role_id from role_tree rt join public.roles p on p.id=rt.parent_role_id)
   select distinct rp.permission_key from role_tree rt join public.role_permissions rp on rp.role_id=rt.role_id
   order by rp.permission_key""",user_id,membership_id,status,organization_id)
 async def list_platform_permissions(self,connection:asyncpg.Connection,user_id:UUID):
  return await connection.fetch("""with recursive role_tree(role_id,parent_role_id) as (
    select r.id,r.parent_role_id from public.user_role_assignments ura
    join public.roles r on r.id=ura.role_id
    where ura.user_id=$1 and ura.scope_type='platform' and ura.membership_id is null
      and ura.scope_id is null and ura.revoked_at is null and ura.starts_at<=now()
      and (ura.expires_at is null or ura.expires_at>now())
    union select p.id,p.parent_role_id from role_tree rt join public.roles p on p.id=rt.parent_role_id)
   select distinct rp.permission_key from role_tree rt
   join public.role_permissions rp on rp.role_id=rt.role_id order by rp.permission_key""",user_id)
 async def list_sessions(self,connection:asyncpg.Connection,user_id:UUID,session_id:UUID):
  rows=await connection.fetch("""select auth_session_id,device_id,device_name,platform,last_seen_at,expires_at,revoked_at,created_at,
   (auth_session_id=$2) current from public.session_devices where user_id=$1 order by last_seen_at desc""",user_id,session_id)
  return [dict(row) for row in rows]
 async def list_linked_identities(self,connection:asyncpg.Connection,user_id:UUID):
  rows=await connection.fetch("""select auth_identity_id id,provider,email,is_primary,created_at
   from public.user_identities where user_id=$1 order by is_primary desc,created_at""",user_id)
  return [dict(row) for row in rows]
