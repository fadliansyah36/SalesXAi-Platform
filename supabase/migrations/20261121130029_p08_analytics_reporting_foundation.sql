-- Phase 08: deterministic, tenant-scoped analytics and operational reporting.
begin;

create table if not exists public.analytics_metric_definitions (
  metric_key text primary key,
  display_name text not null,
  description text not null,
  unit text not null check (unit in ('count','currency','points','quantity','ratio','minutes')),
  aggregation text not null check (aggregation in ('sum','count','distinct_count','ratio','latest')),
  source_tables text[] not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.analytics_metric_snapshots (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  metric_key text not null references public.analytics_metric_definitions(metric_key),
  period_grain text not null check (period_grain in ('day','week','month')),
  period_start date not null,
  period_end date not null,
  scope_type text not null check (scope_type in ('tenant','branch','team','territory','user')),
  scope_id uuid,
  metric_value numeric(24,6) not null,
  dimensions jsonb not null default '{}'::jsonb,
  source_watermark timestamptz,
  calculated_at timestamptz not null default now(),
  constraint analytics_metric_period_valid check (period_end >= period_start),
  constraint analytics_metric_scope_valid check ((scope_type='tenant' and scope_id is null) or (scope_type<>'tenant' and scope_id is not null)),
  unique (organization_id,metric_key,period_grain,period_start,scope_type,scope_id)
);

create table if not exists public.analytics_report_definitions (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  report_key text not null,
  display_name text not null,
  description text,
  allowed_grains text[] not null default array['day','week','month']::text[],
  allowed_metrics text[] not null default '{}'::text[],
  default_filters jsonb not null default '{}'::jsonb,
  is_active boolean not null default true,
  created_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id,report_key)
);

create table if not exists public.analytics_report_runs (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  report_definition_id uuid references public.analytics_report_definitions(id) on delete set null,
  report_key text not null,
  requested_by uuid not null,
  period_start date not null,
  period_end date not null,
  period_grain text not null check (period_grain in ('day','week','month')),
  scope_type text not null check (scope_type in ('tenant','branch','team','territory','user')),
  scope_id uuid,
  status text not null default 'queued' check (status in ('queued','running','completed','failed','cancelled')),
  idempotency_key text not null,
  requested_at timestamptz not null default now(),
  started_at timestamptz,
  completed_at timestamptz,
  data_as_of timestamptz,
  row_count bigint,
  artifact_path text,
  error_code text,
  error_message text,
  parameters jsonb not null default '{}'::jsonb,
  constraint analytics_report_period_valid check (period_end >= period_start),
  constraint analytics_report_scope_valid check ((scope_type='tenant' and scope_id is null) or (scope_type<>'tenant' and scope_id is not null)),
  unique (organization_id,requested_by,idempotency_key)
);

create index if not exists analytics_snapshots_tenant_period_idx
  on public.analytics_metric_snapshots (organization_id,period_grain,period_start desc,metric_key);
create index if not exists analytics_snapshots_scope_period_idx
  on public.analytics_metric_snapshots (organization_id,scope_type,scope_id,period_start desc);
create index if not exists analytics_report_runs_tenant_created_idx
  on public.analytics_report_runs (organization_id,requested_at desc);
create index if not exists analytics_report_runs_status_idx
  on public.analytics_report_runs (status,requested_at) where status in ('queued','running');

insert into public.permissions(key,resource,action,description)
values
 ('analytics:dashboard:read','analytics','dashboard_read','Read role-scoped analytics dashboards and KPI snapshots'),
 ('analytics:reports:read','analytics','reports_read','Read operational report definitions and report runs'),
 ('analytics:reports:manage','analytics','reports_manage','Create and manage operational report runs'),
 ('analytics:metrics:refresh','analytics','metrics_refresh','Refresh deterministic tenant analytics snapshots')
on conflict (key) do nothing;

insert into public.role_permissions(role_id,permission_key)
select r.id,p.key
from public.roles r
cross join (values
 ('analytics:dashboard:read'),
 ('analytics:reports:read'),
 ('analytics:reports:manage')
) p(key)
where r.key in ('tenant_owner','company_admin')
on conflict do nothing;

insert into public.role_permissions(role_id,permission_key)
select r.id,p.key
from public.roles r
cross join (values
 ('analytics:dashboard:read'),
 ('analytics:reports:read')
) p(key)
where r.key in ('supervisor','principal_user','distributor_user')
on conflict do nothing;

insert into public.analytics_metric_definitions
(metric_key,display_name,description,unit,aggregation,source_tables)
values
 ('orders.count','Orders','Count of submitted non-cancelled orders','count','count',array['orders']),
 ('orders.gross_value','Gross order value','Sum of order grand totals excluding cancelled/expired drafts','currency','sum',array['orders']),
 ('visits.scheduled','Scheduled visits','Visits scheduled in the selected period','count','count',array['smartteam_visits']),
 ('visits.completed','Completed visits','Visits completed in the selected period','count','count',array['smartteam_visits']),
 ('visits.productive','Productive visits','Completed visits with a productive outcome','count','count',array['smartteam_visits']),
 ('outlets.covered','Outlets covered','Distinct outlets with a completed check-in','count','distinct_count',array['smartteam_visits']),
 ('inventory.available','Available inventory','Current available inventory quantity','quantity','latest',array['inventory_balances']),
 ('rewards.points_issued','Reward points issued','Positive points ledger movements','points','sum',array['reward_points_ledger']),
 ('rewards.points_redeemed','Reward points redeemed','Negative points ledger movements','points','sum',array['reward_points_ledger'])
on conflict (metric_key) do update set
 display_name=excluded.display_name,description=excluded.description,unit=excluded.unit,
 aggregation=excluded.aggregation,source_tables=excluded.source_tables,is_active=true,updated_at=now();

alter table public.analytics_metric_snapshots enable row level security;
alter table public.analytics_report_definitions enable row level security;
alter table public.analytics_report_runs enable row level security;

drop policy if exists analytics_snapshots_scoped_read on public.analytics_metric_snapshots;
create policy analytics_snapshots_scoped_read on public.analytics_metric_snapshots
for select to authenticated using (
 exists (
  select 1
  from public.organization_memberships m
  join public.user_role_assignments ura on ura.membership_id=m.id
  join public.role_permissions rp on rp.role_id=ura.role_id
  where m.organization_id=analytics_metric_snapshots.organization_id
    and m.user_id=(select auth.uid()) and m.status='active'
    and ura.revoked_at is null and ura.starts_at<=now()
    and (ura.expires_at is null or ura.expires_at>now())
    and rp.permission_key='analytics:dashboard:read'
    and (
      (analytics_metric_snapshots.scope_type='tenant' and ura.scope_type in ('tenant','organization') and ura.scope_id=m.organization_id)
      or (analytics_metric_snapshots.scope_type='branch' and ura.scope_type='branch' and ura.scope_id=analytics_metric_snapshots.scope_id)
      or (analytics_metric_snapshots.scope_type='team' and ura.scope_type='team' and ura.scope_id=analytics_metric_snapshots.scope_id)
      or (analytics_metric_snapshots.scope_type='territory' and ura.scope_type='territory' and ura.scope_id=analytics_metric_snapshots.scope_id)
      or (analytics_metric_snapshots.scope_type='user' and analytics_metric_snapshots.scope_id=(select auth.uid()))
    )
 )
);

drop policy if exists analytics_report_definitions_scoped_read on public.analytics_report_definitions;
create policy analytics_report_definitions_scoped_read on public.analytics_report_definitions
for select to authenticated using (
 exists (
  select 1 from public.organization_memberships m
  join public.user_role_assignments ura on ura.membership_id=m.id
  join public.role_permissions rp on rp.role_id=ura.role_id
  where m.organization_id=analytics_report_definitions.organization_id
    and m.user_id=(select auth.uid()) and m.status='active'
    and ura.revoked_at is null and ura.starts_at<=now()
    and (ura.expires_at is null or ura.expires_at>now())
    and rp.permission_key='analytics:reports:read'
 )
);

drop policy if exists analytics_report_runs_scoped_read on public.analytics_report_runs;
create policy analytics_report_runs_scoped_read on public.analytics_report_runs
for select to authenticated using (
 exists (
  select 1 from public.organization_memberships m
  join public.user_role_assignments ura on ura.membership_id=m.id
  join public.role_permissions rp on rp.role_id=ura.role_id
  where m.organization_id=analytics_report_runs.organization_id
    and m.user_id=(select auth.uid()) and m.status='active'
    and ura.revoked_at is null and ura.starts_at<=now()
    and (ura.expires_at is null or ura.expires_at>now())
    and rp.permission_key='analytics:reports:read'
    and (
      analytics_report_runs.requested_by=(select auth.uid())
      or (ura.scope_type in ('tenant','organization') and ura.scope_id=m.organization_id)
      or (analytics_report_runs.scope_id is not null and ura.scope_id=analytics_report_runs.scope_id)
    )
 )
);

revoke all on public.analytics_metric_definitions,public.analytics_metric_snapshots,
 public.analytics_report_definitions,public.analytics_report_runs from anon,authenticated;
grant select on public.analytics_metric_definitions to authenticated;
grant select on public.analytics_metric_snapshots,public.analytics_report_definitions,public.analytics_report_runs to authenticated;

commit;
