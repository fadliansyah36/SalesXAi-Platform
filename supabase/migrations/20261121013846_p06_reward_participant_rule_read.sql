begin;
insert into public.role_permissions(role_id,permission_key)
select r.id,'smartreward:rule:read' from public.roles r where r.key in ('sales_rep','customer_user')
on conflict(role_id,permission_key) do nothing;
commit;