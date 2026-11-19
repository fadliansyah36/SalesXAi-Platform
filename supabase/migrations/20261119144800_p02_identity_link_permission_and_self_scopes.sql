-- Phase 02: explicit self-scoped identity permissions.
begin;
insert into public.permissions(key,resource,action,description)
values
 ('identity:link:self','identity','link:self','Link a provider identity to the authenticated user account.'),
 ('identity:read:self','identity','read:self','Read linked identities belonging to the authenticated user account.'),
 ('identity:unlink:self','identity','unlink:self','Unlink an identity belonging to the authenticated user account.')
on conflict (key) do update set resource=excluded.resource,action=excluded.action,description=excluded.description;
insert into public.role_permissions(role_id,permission_key)
select r.id,p.key
from public.roles r
cross join public.permissions p
where p.key in ('identity:link:self','identity:read:self','identity:unlink:self')
on conflict do nothing;
commit;
