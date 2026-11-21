begin;
insert into public.role_permissions(role_id,permission_key)
select r.id,'analytics:dashboard:read' from public.roles r where r.key='sales_rep'
on conflict do nothing;
commit;