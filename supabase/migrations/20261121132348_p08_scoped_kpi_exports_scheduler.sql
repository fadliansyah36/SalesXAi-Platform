-- Phase 08: scoped daily KPI refresh, durable export queue, private storage and scheduler registry.
begin;
alter table public.organizations add column if not exists timezone text not null default 'UTC';
alter table public.organizations add constraint organizations_timezone_valid
check (timezone='UTC' or timezone ~ '^[A-Za-z_]+/[A-Za-z_]+$') not valid;
alter table public.analytics_report_exports
 add column if not exists attempt_count integer not null default 0,
 add column if not exists max_attempts integer not null default 5,
 add column if not exists next_attempt_at timestamptz not null default now(),
 add column if not exists lease_owner text,
 add column if not exists lease_expires_at timestamptz,
 add column if not exists last_error_at timestamptz,
 add column if not exists updated_at timestamptz not null default now();
create index if not exists analytics_report_exports_claim_idx on public.analytics_report_exports(next_attempt_at,requested_at) where status in ('queued','failed');
create table if not exists public.analytics_scheduled_jobs (
 id uuid primary key default gen_random_uuid(),organization_id uuid not null references public.organizations(id) on delete cascade,
 job_key text not null,job_type text not null check(job_type in ('refresh_daily','refresh_weekly','refresh_monthly','export_report')),
 schedule_kind text not null check(schedule_kind in ('interval','daily','weekly','monthly')),
 interval_minutes integer,local_time time,timezone text not null default 'UTC',day_of_week smallint,day_of_month smallint,
 parameters jsonb not null default '{}'::jsonb,enabled boolean not null default true,next_run_at timestamptz not null,
 last_run_at timestamptz,last_status text check(last_status in ('completed','failed','skipped')),last_error text,
 idempotency_cursor text,created_by uuid,created_at timestamptz not null default now(),updated_at timestamptz not null default now(),
 unique(organization_id,job_key),
 check((schedule_kind='interval' and interval_minutes between 1 and 10080) or (schedule_kind<>'interval' and interval_minutes is null)),
 check((schedule_kind='daily' and local_time is not null) or (schedule_kind<>'daily' and local_time is null)),
 check((schedule_kind='weekly' and local_time is not null and day_of_week between 0 and 6) or (schedule_kind<>'weekly' and day_of_week is null)),
 check((schedule_kind='monthly' and local_time is not null and day_of_month between 1 and 28) or (schedule_kind<>'monthly' and day_of_month is null))
);
create index if not exists analytics_scheduled_jobs_due_idx on public.analytics_scheduled_jobs(next_run_at,organization_id) where enabled;
create table if not exists public.analytics_job_executions (
 id uuid primary key default gen_random_uuid(),organization_id uuid not null references public.organizations(id) on delete cascade,
 scheduled_job_id uuid references public.analytics_scheduled_jobs(id) on delete set null,job_type text not null,
 idempotency_key text not null,status text not null default 'running' check(status in ('running','completed','failed','skipped')),
 attempt_count integer not null default 1,started_at timestamptz not null default now(),completed_at timestamptz,
 error_code text,error_message text,metadata jsonb not null default '{}'::jsonb,unique(organization_id,idempotency_key)
);
create index if not exists analytics_job_executions_recent_idx on public.analytics_job_executions(organization_id,started_at desc);
alter table public.analytics_scheduled_jobs enable row level security;
alter table public.analytics_job_executions enable row level security;
revoke all on public.analytics_scheduled_jobs,public.analytics_job_executions from anon,authenticated;
grant select on public.analytics_scheduled_jobs,public.analytics_job_executions to authenticated;
drop policy if exists analytics_scheduled_jobs_tenant_read on public.analytics_scheduled_jobs;
create policy analytics_scheduled_jobs_tenant_read on public.analytics_scheduled_jobs for select to authenticated using (
 exists(select 1 from public.organization_memberships m join public.user_role_assignments ura on ura.membership_id=m.id
 join public.role_permissions rp on rp.role_id=ura.role_id where m.organization_id=analytics_scheduled_jobs.organization_id
 and m.user_id=(select auth.uid()) and m.status='active' and ura.revoked_at is null and ura.starts_at<=now()
 and (ura.expires_at is null or ura.expires_at>now()) and rp.permission_key='analytics:reports:read'
 and ura.scope_type in ('tenant','organization') and ura.scope_id=m.organization_id));
drop policy if exists analytics_job_executions_tenant_read on public.analytics_job_executions;
create policy analytics_job_executions_tenant_read on public.analytics_job_executions for select to authenticated using (
 exists(select 1 from public.organization_memberships m join public.user_role_assignments ura on ura.membership_id=m.id
 join public.role_permissions rp on rp.role_id=ura.role_id where m.organization_id=analytics_job_executions.organization_id
 and m.user_id=(select auth.uid()) and m.status='active' and ura.revoked_at is null and ura.starts_at<=now()
 and (ura.expires_at is null or ura.expires_at>now()) and rp.permission_key='analytics:reports:read'
 and ura.scope_type in ('tenant','organization') and ura.scope_id=m.organization_id));
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values('analytics-private','analytics-private',false,52428800,array['text/csv','application/csv'])
on conflict(id) do update set public=false,file_size_limit=excluded.file_size_limit,allowed_mime_types=excluded.allowed_mime_types;
drop policy if exists analytics_private_service_only on storage.objects;
create policy analytics_private_service_only on storage.objects for all to service_role using(bucket_id='analytics-private') with check(bucket_id='analytics-private');

create or replace function public.analytics_refresh_scoped_daily_metrics(p_organization_id uuid,p_period_start date,p_period_end date)
returns bigint language plpgsql security definer set search_path=pg_catalog,public as $$
declare affected bigint:=0; changed bigint:=0;
begin
 if p_organization_id is null or p_period_start is null or p_period_end is null or p_period_end<p_period_start or p_period_end-p_period_start>366 then
  raise exception 'invalid_scoped_analytics_range' using errcode='22023';
 end if;
 delete from public.analytics_metric_snapshots where organization_id=p_organization_id and period_grain='day'
 and period_start between p_period_start and p_period_end and scope_type<>'tenant';
 with visit_events as (
  select v.organization_id,v.scheduled_at::date metric_day,'visits.scheduled'::text metric_key,
         coalesce(v.branch_id,m.branch_id) branch_id,v.team_id,sp.territory_id,sp.user_id,1::numeric metric_value,v.updated_at watermark
  from public.smartteam_visits v join public.sales_profiles sp on sp.id=v.sales_profile_id and sp.organization_id=v.organization_id
  left join public.organization_memberships m on m.id=sp.membership_id and m.organization_id=sp.organization_id
  where v.organization_id=p_organization_id and v.scheduled_at::date between p_period_start and p_period_end
  union all
  select v.organization_id,v.check_out_at::date,'visits.completed',coalesce(v.branch_id,m.branch_id),v.team_id,sp.territory_id,sp.user_id,1::numeric,v.updated_at
  from public.smartteam_visits v join public.sales_profiles sp on sp.id=v.sales_profile_id and sp.organization_id=v.organization_id
  left join public.organization_memberships m on m.id=sp.membership_id and m.organization_id=sp.organization_id
  where v.organization_id=p_organization_id and v.check_out_at is not null and v.check_out_at::date between p_period_start and p_period_end
  union all
  select v.organization_id,v.check_out_at::date,'visits.productive',coalesce(v.branch_id,m.branch_id),v.team_id,sp.territory_id,sp.user_id,1::numeric,v.updated_at
  from public.smartteam_visits v join public.sales_profiles sp on sp.id=v.sales_profile_id and sp.organization_id=v.organization_id
  left join public.organization_memberships m on m.id=sp.membership_id and m.organization_id=sp.organization_id
  where v.organization_id=p_organization_id and v.check_out_at is not null and v.outcome='productive'
    and v.check_out_at::date between p_period_start and p_period_end
 ), visit_scopes as (
  select organization_id,metric_day,metric_key,'branch'::text scope_type,branch_id scope_id,metric_value,watermark from visit_events where branch_id is not null
  union all select organization_id,metric_day,metric_key,'team',team_id,metric_value,watermark from visit_events where team_id is not null
  union all select organization_id,metric_day,metric_key,'territory',territory_id,metric_value,watermark from visit_events where territory_id is not null
  union all select organization_id,metric_day,metric_key,'user',user_id,metric_value,watermark from visit_events where user_id is not null
 ), coverage_events as (
  select v.organization_id,v.check_in_at::date metric_day,v.outlet_id,coalesce(v.branch_id,m.branch_id) branch_id,
         v.team_id,sp.territory_id,sp.user_id,v.updated_at watermark
  from public.smartteam_visits v join public.sales_profiles sp on sp.id=v.sales_profile_id and sp.organization_id=v.organization_id
  left join public.organization_memberships m on m.id=sp.membership_id and m.organization_id=sp.organization_id
  where v.organization_id=p_organization_id and v.check_in_at is not null and v.check_out_at is not null
    and v.check_in_at::date between p_period_start and p_period_end
 ), coverage_scopes as (
  select organization_id,metric_day,'outlets.covered'::text metric_key,'branch'::text scope_type,branch_id scope_id,outlet_id,watermark from coverage_events where branch_id is not null
  union all select organization_id,metric_day,'outlets.covered','team',team_id,outlet_id,watermark from coverage_events where team_id is not null
  union all select organization_id,metric_day,'outlets.covered','territory',territory_id,outlet_id,watermark from coverage_events where territory_id is not null
  union all select organization_id,metric_day,'outlets.covered','user',user_id,outlet_id,watermark from coverage_events where user_id is not null
 ), order_events as (
  select o.organization_id,o.created_at::date metric_day,o.grand_total,m.branch_id,sp.team_id,sp.territory_id,sp.user_id,coalesce(o.updated_at,o.created_at) watermark
  from public.orders o join public.carts c on c.id=o.cart_id and c.organization_id=o.organization_id
  join public.sales_profiles sp on sp.user_id=c.owner_user_id and sp.organization_id=o.organization_id
  left join public.organization_memberships m on m.id=sp.membership_id and m.organization_id=sp.organization_id
  where o.organization_id=p_organization_id and o.created_at::date between p_period_start and p_period_end
    and o.status not in ('cancelled','expired','draft')
 ), order_scopes as (
  select organization_id,metric_day,'orders.count'::text metric_key,'branch'::text scope_type,branch_id scope_id,1::numeric metric_value,watermark from order_events where branch_id is not null
  union all select organization_id,metric_day,'orders.count','team',team_id,1::numeric,watermark from order_events where team_id is not null
  union all select organization_id,metric_day,'orders.count','territory',territory_id,1::numeric,watermark from order_events where territory_id is not null
  union all select organization_id,metric_day,'orders.count','user',user_id,1::numeric,watermark from order_events where user_id is not null
  union all select organization_id,metric_day,'orders.gross_value','branch',branch_id,grand_total,watermark from order_events where branch_id is not null
  union all select organization_id,metric_day,'orders.gross_value','team',team_id,grand_total,watermark from order_events where team_id is not null
  union all select organization_id,metric_day,'orders.gross_value','territory',territory_id,grand_total,watermark from order_events where territory_id is not null
  union all select organization_id,metric_day,'orders.gross_value','user',user_id,grand_total,watermark from order_events where user_id is not null
 ), summed as (
  select metric_day,metric_key,scope_type,scope_id,sum(metric_value) metric_value,max(watermark) watermark
  from (select metric_day,metric_key,scope_type,scope_id,metric_value,watermark from visit_scopes
        union all select metric_day,metric_key,scope_type,scope_id,metric_value,watermark from order_scopes) x
  group by metric_day,metric_key,scope_type,scope_id
 )
 insert into public.analytics_metric_snapshots
 (organization_id,metric_key,period_grain,period_start,period_end,scope_type,scope_id,metric_value,dimensions,source_watermark,calculated_at)
 select p_organization_id,metric_key,'day',metric_day,metric_day,scope_type,scope_id,metric_value,'{}'::jsonb,watermark,now() from summed;
 get diagnostics changed=row_count; affected:=affected+changed;
 insert into public.analytics_metric_snapshots
 (organization_id,metric_key,period_grain,period_start,period_end,scope_type,scope_id,metric_value,dimensions,source_watermark,calculated_at)
 select p_organization_id,metric_key,'day',metric_day,metric_day,scope_type,scope_id,count(distinct outlet_id)::numeric,'{}'::jsonb,max(watermark),now()
 from coverage_scopes group by metric_key,metric_day,scope_type,scope_id;
 get diagnostics changed=row_count; affected:=affected+changed;
 return affected;
end; $$;
revoke all on function public.analytics_refresh_scoped_daily_metrics(uuid,date,date) from public,anon,authenticated;
grant execute on function public.analytics_refresh_scoped_daily_metrics(uuid,date,date) to service_role;
commit;