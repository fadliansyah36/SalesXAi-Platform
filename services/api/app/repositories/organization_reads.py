from uuid import UUID
import asyncpg

class OrganizationReadRepository:
 async def list_my_organizations(self,connection:asyncpg.Connection,user_id:UUID):
  rows=await connection.fetch("""select o.id,o.slug,o.name,o.status,m.id membership_id,m.status membership_status
   from public.organization_memberships m join public.organizations o on o.id=m.organization_id
   where m.user_id=$1 and m.status<>'removed' order by o.name""",user_id)
  return [dict(row) for row in rows]
 async def list_members(self,connection:asyncpg.Connection,organization_id:UUID):
  rows=await connection.fetch("""select m.user_id,p.email,p.display_name,p.status account_status,m.status membership_status,
   m.title,m.branch_id,m.joined_at from public.organization_memberships m
   join public.profiles p on p.id=m.user_id where m.organization_id=$1
   order by p.display_name nulls last,p.email""",organization_id)
  return [dict(row) for row in rows]
 async def delegation_levels(self,connection:asyncpg.Connection,user_id:UUID,membership_id:UUID,organization_id:UUID,
  permission_key:str,branch_id:UUID|None,resource_attributes:dict):
  rows=await connection.fetch("""with recursive role_tree(role_id,parent_role_id,attributes) as (
   select r.id,r.parent_role_id,ura.attributes from public.user_role_assignments ura
   join public.roles r on r.id=ura.role_id
   where ura.user_id=$1 and ura.revoked_at is null and ura.starts_at<=now()
    and (ura.expires_at is null or ura.expires_at>now())
    and ((ura.scope_type='platform' and ura.membership_id is null and ura.scope_id is null)
      or (ura.scope_type='tenant' and ura.membership_id=$2 and ura.scope_id=$3)
      or ($4::uuid is not null and ura.scope_type='branch' and ura.membership_id=$2 and ura.scope_id=$4))
   union select parent.id,parent.parent_role_id,child.attributes from role_tree child
    join public.roles parent on parent.id=child.parent_role_id)
   select distinct r.hierarchy_level,tree.attributes from role_tree tree
   join public.roles r on r.id=tree.role_id
   join public.role_permissions rp on rp.role_id=r.id and rp.permission_key=$5""",
   user_id,membership_id,organization_id,branch_id,permission_key)
  return [row for row in rows]
 async def list_delegable_roles(self,connection:asyncpg.Connection,tenant_level:int|None,branch_level:int|None):
  rows=await connection.fetch("""select key,name,scope_type,hierarchy_level from public.roles
   where key<>'tenant_owner' and ((scope_type='tenant' and $1::int is not null and hierarchy_level>$1)
   or (scope_type='branch' and $2::int is not null and hierarchy_level>$2))
   order by hierarchy_level desc,name""",tenant_level,branch_level)
  return [dict(row) for row in rows]
