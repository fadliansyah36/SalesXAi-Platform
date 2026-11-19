import asyncpg
from datetime import datetime

class PlatformReadRepository:
 async def list_users(self,connection:asyncpg.Connection,q:str|None,limit:int,offset:int):
  return await connection.fetch("""select p.id,
   coalesce(nullif(p.display_name,''),nullif(u.email,''),'Unknown') name,
   coalesce(u.email,'') email,
   coalesce((select string_agg(distinct o.slug,', ' order by o.slug)
    from public.organization_memberships m join public.organizations o on o.id=m.organization_id
    where m.user_id=p.id and m.status='active' and o.status='active'),'') tenant_id,
   coalesce((select string_agg(distinct o.name,', ' order by o.name)
    from public.organization_memberships m join public.organizations o on o.id=m.organization_id
    where m.user_id=p.id and m.status='active' and o.status='active'),'') tenant_name,
   coalesce((select string_agg(distinct r.key,', ' order by r.key)
    from public.user_role_assignments ura join public.roles r on r.id=ura.role_id
    left join public.organization_memberships m on m.id=ura.membership_id
    left join public.organizations o on o.id=m.organization_id
    left join public.branches b on b.id=ura.scope_id
    where ura.user_id=p.id and ura.revoked_at is null and ura.starts_at<=now()
     and (ura.expires_at is null or ura.expires_at>now())
     and ((ura.scope_type='platform' and ura.membership_id is null and ura.scope_id is null)
      or (ura.scope_type='tenant' and m.status='active' and o.status='active' and ura.scope_id=o.id)
      or (ura.scope_type='branch' and m.status='active' and o.status='active' and b.organization_id=o.id and b.status='active' and ura.scope_id=b.id))),'unassigned') role,
   p.status,exists(select 1 from auth.mfa_factors mf where mf.user_id=p.id and mf.status='verified') mfa_enabled,
   (select max(sd.last_seen_at) from public.session_devices sd where sd.user_id=p.id and sd.revoked_at is null) last_active
   from public.profiles p join auth.users u on u.id=p.id
   where $1::text is null or lower(coalesce(u.email,'')) like '%'||lower($1)||'%'
    or lower(coalesce(p.display_name,'')) like '%'||lower($1)||'%'
   order by u.created_at desc limit $2 offset $3""",q,limit,offset)
 async def list_roles(self,connection:asyncpg.Connection):
  return await connection.fetch("""select r.id,r.key,r.name,r.scope_type,r.hierarchy_level,
   coalesce(array_agg(distinct rp.permission_key order by rp.permission_key)
    filter (where rp.permission_key is not null),array[]::text[]) permissions,
   count(distinct ura.user_id) filter (where ura.revoked_at is null and ura.starts_at<=now()
    and (ura.expires_at is null or ura.expires_at>now())) assigned_users
   from public.roles r left join public.role_permissions rp on rp.role_id=r.id
   left join public.user_role_assignments ura on ura.role_id=r.id group by r.id
   order by case r.scope_type when 'platform' then 0 when 'tenant' then 1 else 2 end,r.hierarchy_level,r.key""")
 async def list_audit_logs(self,connection:asyncpg.Connection,before:datetime|None,limit:int):
  return await connection.fetch("""select l.id,l.actor_user_id,l.organization_id,l.action,l.resource_type,
   l.resource_id,l.correlation_id,l.occurred_at,l.metadata,
   coalesce(nullif(p.display_name,''),nullif(p.email,''),
    case when l.actor_user_id is null then 'System' else l.actor_user_id::text end) actor_label
   from public.admin_audit_logs l left join public.profiles p on p.id=l.actor_user_id
   where l.organization_id is null and ($1::timestamptz is null or l.occurred_at<$1)
   order by l.occurred_at desc,l.id desc limit $2""",before,limit)
