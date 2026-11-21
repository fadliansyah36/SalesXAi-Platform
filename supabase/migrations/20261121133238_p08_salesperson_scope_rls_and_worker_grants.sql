begin;
insert into public.role_permissions(role_id,permission_key)
select r.id,'analytics:dashboard:read' from public.roles r where r.key='sales_rep'
on conflict do nothing;
drop policy if exists analytics_snapshots_scoped_read on public.analytics_metric_snapshots;
create policy analytics_snapshots_scoped_read on public.analytics_metric_snapshots
for select to authenticated using (
 exists (
  select 1 from public.organization_memberships m
  join public.user_role_assignments ura on ura.membership_id=m.id
  join public.roles r on r.id=ura.role_id
  join public.role_permissions rp on rp.role_id=ura.role_id
  where m.organization_id=analytics_metric_snapshots.organization_id
    and m.user_id=(select auth.uid()) and m.status='active'
    and ura.revoked_at is null and ura.starts_at<=now()
    and (ura.expires_at is null or ura.expires_at>now())
    and rp.permission_key='analytics:dashboard:read'
    and (
      (analytics_metric_snapshots.scope_type='tenant' and ura.scope_type in ('tenant','organization') and ura.scope_id=m.organization_id)
      or (analytics_metric_snapshots.scope_type='branch' and r.key='supervisor' and ura.scope_type='branch' and ura.scope_id=analytics_metric_snapshots.scope_id)
      or (analytics_metric_snapshots.scope_type='team' and ura.scope_type='team' and ura.scope_id=analytics_metric_snapshots.scope_id)
      or (analytics_metric_snapshots.scope_type='territory' and ura.scope_type='territory' and ura.scope_id=analytics_metric_snapshots.scope_id)
      or (analytics_metric_snapshots.scope_type='user' and analytics_metric_snapshots.scope_id=(select auth.uid()))
    )
 )
);
grant all on public.analytics_report_exports,public.analytics_scheduled_jobs,public.analytics_job_executions to service_role;
grant execute on function public.analytics_refresh_daily_metrics(uuid,date,date) to service_role;
grant execute on function public.analytics_refresh_scoped_daily_metrics(uuid,date,date) to service_role;
grant execute on function public.analytics_refresh_period_rollups(uuid,date,date) to service_role;
commit;