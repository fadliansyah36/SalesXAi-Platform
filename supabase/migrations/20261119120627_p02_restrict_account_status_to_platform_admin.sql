-- Restrict global account status administration to a platform-scoped role.
begin;

delete from public.role_permissions rp
using public.roles r
where rp.role_id=r.id
  and r.key in ('tenant_owner','company_admin')
  and rp.permission_key='account:status:manage';

-- Seed the permission before assigning it. Clean local resets do not inherit
-- the historical dashboard-created permission row present in the live project.
insert into public.permissions(key,resource,action,description)
values ('account:status:manage','account','status:manage','Manage account status at platform scope')
on conflict (key) do update
set resource=excluded.resource,action=excluded.action,description=excluded.description;

insert into public.role_permissions(role_id,permission_key)
select r.id,'account:status:manage'
from public.roles r
where r.key='platform_admin'
on conflict do nothing;

comment on column public.profiles.session_revoked_at is
  'Platform-wide FastAPI JWT revocation epoch; account administration is restricted to platform-scoped permission.';

commit;
