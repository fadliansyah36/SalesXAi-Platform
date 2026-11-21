insert into public.role_permissions(role_id,permission_key)
select r.id,p.key from public.roles r cross join public.permissions p
where
 (r.key='sales_rep' and p.key in ('location.sessions.manage','location.sessions.read','location.points.ingest','location.history.read'))
 or (r.key='supervisor' and p.key in ('location.sessions.read','location.live.read','location.history.read','location.geofences.read','location.reports.read'))
 or (r.key='company_admin' and p.key in ('location.sessions.manage','location.sessions.read','location.points.ingest','location.live.read','location.history.read','location.geofences.read','location.geofences.manage','location.reports.read','location.access.audit.read'))
 or (r.key='tenant_owner' and p.key in ('location.sessions.manage','location.sessions.read','location.points.ingest','location.live.read','location.history.read','location.geofences.read','location.geofences.manage','location.reports.read','location.access.audit.read'))
on conflict(role_id,permission_key) do nothing;
