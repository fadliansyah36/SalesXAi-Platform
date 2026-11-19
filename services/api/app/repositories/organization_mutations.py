from uuid import UUID
import asyncpg

class OrganizationMutationRepository:
 async def create_organization(self,connection:asyncpg.Connection,slug:str,name:str,legal_name:str|None,actor_id:UUID):
  org=await connection.fetchrow("""insert into public.organizations(slug,name,legal_name,created_by)
   values($1,$2,$3,$4) returning id,slug,name,status,created_at""",slug,name,legal_name,actor_id)
  member=await connection.fetchrow("""insert into public.organization_memberships(organization_id,user_id,status,joined_at,title)
   values($1,$2,'active',now(),'Owner') returning id""",org["id"],actor_id)
  role_id=await connection.fetchval("select id from public.roles where key='tenant_owner'")
  await connection.execute("""insert into public.user_role_assignments(user_id,membership_id,role_id,scope_type,scope_id,assigned_by)
   values($1,$2,$3,'tenant',$4,$1)""",actor_id,member["id"],role_id,org["id"])
  return org

 async def auth_identity_exists(self,connection:asyncpg.Connection,user_id:UUID)->bool:
  return bool(await connection.fetchval("select exists(select 1 from auth.users where id=$1)",user_id))

 async def add_member(self,connection:asyncpg.Connection,organization_id:UUID,user_id:UUID,title:str|None):
  return await connection.fetchrow("""insert into public.organization_memberships(organization_id,user_id,status,title)
   values($1,$2,'invited',$3)
   on conflict(organization_id,user_id) do update set title=excluded.title,
   status=case when public.organization_memberships.status='removed' then 'invited'
   else public.organization_memberships.status end,updated_at=now()
   returning id,user_id,organization_id,status,title""",organization_id,user_id,title)
