begin;
create table if not exists public.analytics_report_access_events (
 id uuid primary key default gen_random_uuid(),
 organization_id uuid not null references public.organizations(id) on delete cascade,
 report_run_id uuid not null references public.analytics_report_runs(id) on delete cascade,
 actor_user_id uuid not null,
 event_type text not null check(event_type in ('signed_url_issued','export_requested')),
 occurred_at timestamptz not null default now(),
 metadata jsonb not null default '{}'::jsonb
);
create index if not exists analytics_report_access_events_run_idx on public.analytics_report_access_events(organization_id,report_run_id,occurred_at desc);
create index if not exists analytics_report_access_events_actor_idx on public.analytics_report_access_events(organization_id,actor_user_id,occurred_at desc);
alter table public.analytics_report_access_events enable row level security;
revoke all on public.analytics_report_access_events from anon,authenticated;
grant select on public.analytics_report_access_events to authenticated;
grant all on public.analytics_report_access_events to service_role;
drop policy if exists analytics_report_access_events_scoped_read on public.analytics_report_access_events;
create policy analytics_report_access_events_scoped_read on public.analytics_report_access_events
for select to authenticated using (
 exists (
  select 1 from public.organization_memberships m
  join public.user_role_assignments ura on ura.membership_id=m.id
  join public.role_permissions rp on rp.role_id=ura.role_id
  where m.organization_id=analytics_report_access_events.organization_id
    and m.user_id=(select auth.uid()) and m.status='active'
    and ura.revoked_at is null and ura.starts_at<=now()
    and (ura.expires_at is null or ura.expires_at>now())
    and rp.permission_key='analytics:reports:read'
    and ((ura.scope_type in ('tenant','organization') and ura.scope_id=m.organization_id)
      or analytics_report_access_events.actor_user_id=(select auth.uid()))
 )
);
commit;