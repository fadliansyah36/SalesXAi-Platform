begin;
insert into public.permissions(key,resource,action,description)
values('smartreward:platform:read','smartreward','read','Read cross-tenant SmartReward operational aggregates in Super Admin.')
on conflict(key) do update set resource=excluded.resource,action=excluded.action,description=excluded.description;
insert into public.role_permissions(role_id,permission_key)
select r.id,'smartreward:platform:read' from public.roles r where r.key='platform_admin'
on conflict(role_id,permission_key) do nothing;
commit;