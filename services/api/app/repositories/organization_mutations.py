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

 async def lock_member(self,connection:asyncpg.Connection,organization_id:UUID,user_id:UUID):
  return await connection.fetchrow("""select id,branch_id,status from public.organization_memberships
   where organization_id=$1 and user_id=$2 for update""",organization_id,user_id)
 async def target_is_platform_admin(self,connection:asyncpg.Connection,user_id:UUID)->bool:
  return bool(await connection.fetchval("""select exists(select 1 from public.user_role_assignments
   where user_id=$1 and scope_type='platform' and revoked_at is null and starts_at<=now()
   and (expires_at is null or expires_at>now()))""",user_id))
 async def delegation_rows(self,connection:asyncpg.Connection,user_id:UUID,membership_id:UUID,organization_id:UUID,branch_id:UUID|None,permission_key:str):
  return await connection.fetch("""with recursive role_tree(role_id,parent_role_id,attributes) as (
    select r.id,r.parent_role_id,ura.attributes from public.user_role_assignments ura
    join public.roles r on r.id=ura.role_id where ura.user_id=$1 and ura.revoked_at is null
      and ura.starts_at<=now() and (ura.expires_at is null or ura.expires_at>now())
      and ((ura.scope_type='platform' and ura.membership_id is null and ura.scope_id is null)
       or (ura.scope_type='tenant' and ura.membership_id=$2 and ura.scope_id=$3)
       or ($4::uuid is not null and ura.scope_type='branch' and ura.membership_id=$2 and ura.scope_id=$4))
    union select parent.id,parent.parent_role_id,child.attributes from role_tree child
    join public.roles parent on parent.id=child.parent_role_id)
    select distinct r.hierarchy_level,tree.attributes from role_tree tree join public.roles r on r.id=tree.role_id
    join public.role_permissions rp on rp.role_id=r.id and rp.permission_key=$5""",
    user_id,membership_id,organization_id,branch_id,permission_key)
 async def member_hierarchy_level(self,connection:asyncpg.Connection,user_id:UUID,membership_id:UUID,organization_id:UUID):
  return await connection.fetchval("""with recursive role_tree(role_id,parent_role_id) as (
    select r.id,r.parent_role_id from public.user_role_assignments ura join public.roles r on r.id=ura.role_id
    where ura.user_id=$1 and ura.membership_id=$2 and ura.revoked_at is null
      and ura.starts_at<=now() and (ura.expires_at is null or ura.expires_at>now())
      and ((ura.scope_type='tenant' and ura.scope_id=$3) or (ura.scope_type='branch' and exists(
       select 1 from public.branches b where b.id=ura.scope_id and b.organization_id=$3 and b.status='active')))
    union select parent.id,parent.parent_role_id from role_tree child join public.roles parent on parent.id=child.parent_role_id)
    select min(r.hierarchy_level) from role_tree tree join public.roles r on r.id=tree.role_id""",
    user_id,membership_id,organization_id)
 async def update_membership_status(self,connection:asyncpg.Connection,organization_id:UUID,user_id:UUID,status:str):
  return await connection.fetchrow("""update public.organization_memberships set status=$3,
   joined_at=case when $3='active' then coalesce(joined_at,now()) else joined_at end,updated_at=now()
   where organization_id=$1 and user_id=$2 returning id,user_id,organization_id,status""",organization_id,user_id,status)
 async def revoke_membership_roles(self,connection:asyncpg.Connection,membership_id:UUID):
  await connection.execute("""update public.user_role_assignments set revoked_at=coalesce(revoked_at,now())
   where membership_id=$1 and revoked_at is null""",membership_id)
 async def get_active_member(self,connection:asyncpg.Connection,organization_id:UUID,user_id:UUID):
  return await connection.fetchrow("""select id,branch_id from public.organization_memberships
   where organization_id=$1 and user_id=$2 and status='active'""",organization_id,user_id)
 async def get_role(self,connection:asyncpg.Connection,role_key:str):
  return await connection.fetchrow("select id,key,scope_type,hierarchy_level from public.roles where key=$1",role_key)
 async def branch_is_active(self,connection:asyncpg.Connection,branch_id:UUID,organization_id:UUID)->bool:
  return bool(await connection.fetchval("select exists(select 1 from public.branches where id=$1 and organization_id=$2 and status='active')",branch_id,organization_id))
 async def insert_role_assignment(self,connection:asyncpg.Connection,user_id:UUID,membership_id:UUID,role_id:UUID,scope_type:str,scope_id:UUID,actor_id:UUID):
  return await connection.fetchrow("""insert into public.user_role_assignments(user_id,membership_id,role_id,scope_type,scope_id,assigned_by)
   values($1,$2,$3,$4,$5,$6) returning id,user_id,membership_id,role_id,scope_type,scope_id,created_at""",
   user_id,membership_id,role_id,scope_type,scope_id,actor_id)

 async def list_platform_organizations(self,connection:asyncpg.Connection,limit:int,offset:int):
  return await connection.fetch("""select o.id,o.slug,o.name,o.legal_name,o.status,o.created_at,
   count(distinct b.id)::int branch_count,count(distinct m.id)::int member_count,
   count(distinct out.id)::int outlet_count
   from public.organizations o
   left join public.branches b on b.organization_id=o.id
   left join public.organization_memberships m on m.organization_id=o.id and m.status='active'
   left join public.outlets out on out.organization_id=o.id
   group by o.id order by o.created_at desc limit $1 offset $2""",limit,offset)
 async def update_organization_status(self,connection:asyncpg.Connection,organization_id:UUID,status:str):
  return await connection.fetchrow("""update public.organizations set status=$2,updated_at=now()
   where id=$1 returning id,slug,name,legal_name,status,created_at""",organization_id,status)
