-- Phase 08 hardening: metric catalog read policy and durable export jobs.
begin;

drop policy if exists analytics_metric_definitions_active_read on public.analytics_metric_definitions;
create policy analytics_metric_definitions_active_read
on public.analytics_metric_definitions
for select to authenticated
using (is_active = true);

create table if not exists public.analytics_report_exports (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  report_run_id uuid not null references public.analytics_report_runs(id) on delete cascade,
  requested_by uuid not null,
  format text not null check (format in ('csv')),
  status text not null default 'queued' check (status in ('queued','running','completed','failed','cancelled')),
  idempotency_key text not null,
  artifact_path text,
  artifact_bytes bigint,
  row_count bigint,
  data_as_of timestamptz,
  requested_at timestamptz not null default now(),
  started_at timestamptz,
  completed_at timestamptz,
  error_code text,
  error_message text,
  unique (organization_id,requested_by,idempotency_key)
);

create index if not exists analytics_report_exports_queue_idx
on public.analytics_report_exports(status,requested_at)
where status in ('queued','running');
create index if not exists analytics_report_exports_run_idx
on public.analytics_report_exports(organization_id,report_run_id,requested_at desc);

alter table public.analytics_report_exports enable row level security;
drop policy if exists analytics_report_exports_scoped_read on public.analytics_report_exports;
create policy analytics_report_exports_scoped_read
on public.analytics_report_exports for select to authenticated
using (
 exists (
   select 1
   from public.organization_memberships m
   join public.user_role_assignments ura on ura.membership_id=m.id
   join public.role_permissions rp on rp.role_id=ura.role_id
   where m.organization_id=analytics_report_exports.organization_id
     and m.user_id=(select auth.uid()) and m.status='active'
     and ura.revoked_at is null and ura.starts_at<=now()
     and (ura.expires_at is null or ura.expires_at>now())
     and rp.permission_key='analytics:reports:read'
     and (
       (ura.scope_type in ('tenant','organization') and ura.scope_id=m.organization_id)
       or analytics_report_exports.requested_by=(select auth.uid())
     )
 )
);

revoke all on public.analytics_report_exports from anon,authenticated;
grant select on public.analytics_report_exports to authenticated;
grant select on public.analytics_metric_definitions to authenticated;

commit;