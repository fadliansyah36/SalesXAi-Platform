begin;
insert into public.permissions(key,resource,action,description)
values('commerce:cart:assisted','commerce.cart','assisted_customer','Set a verified linked customer on a sales-assisted cart')
on conflict(key) do update set resource=excluded.resource,action=excluded.action,description=excluded.description;
insert into public.role_permissions(role_id,permission_key)
select r.id,p.key from public.roles r cross join public.permissions p
where r.key in ('platform_admin','tenant_owner','company_admin','sales_rep') and p.key='commerce:cart:assisted'
on conflict(role_id,permission_key) do nothing;
commit;