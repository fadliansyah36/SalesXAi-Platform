-- SalesX-Ai Phase 02 — least-privilege platform read permissions and audit index
-- Target: eyofuiyxalbehbqoaeny
-- Read-only platform directories must not require mutation permissions.

begin;

insert into public.permissions (key, resource, action, description)
values
  ('account:read', 'account', 'read', 'Read the platform account directory without changing account status'),
  ('role:read', 'role', 'read', 'Read platform role definitions and permission assignments without assigning roles')
on conflict (key) do update
set resource = excluded.resource,
    action = excluded.action,
    description = excluded.description;

insert into public.role_permissions (role_id, permission_key)
select r.id, p.key
from public.roles r
join public.permissions p on p.key in ('account:read', 'role:read')
where r.key = 'platform_admin'
on conflict (role_id, permission_key) do nothing;

create index if not exists admin_audit_platform_time_idx
  on public.admin_audit_logs (occurred_at desc, id desc)
  where organization_id is null;

commit;
