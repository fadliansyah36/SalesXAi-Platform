begin;
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
      (ura.scope_type in ('tenant','organization') and ura.scope_id=m.organization_id)
      or (analytics_metric_snapshots.scope_type='branch' and r.key='supervisor' and ura.scope_type='branch' and ura.scope_id=analytics_metric_snapshots.scope_id)
      or (analytics_metric_snapshots.scope_type='team' and ura.scope_type='team' and ura.scope_id=analytics_metric_snapshots.scope_id)
      or (analytics_metric_snapshots.scope_type='territory' and ura.scope_type='territory' and ura.scope_id=analytics_metric_snapshots.scope_id)
      or (analytics_metric_snapshots.scope_type='user' and analytics_metric_snapshots.scope_id=(select auth.uid()))
    )
 )
);
commit;