begin;
insert into public.role_permissions(role_id,permission_key)
select r.id,'analytics:reports:manage' from public.roles r where r.key='supervisor'
on conflict do nothing;
commit;