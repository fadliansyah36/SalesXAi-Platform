begin;
alter table public.analytics_scheduled_jobs
 add column if not exists lease_owner text,
 add column if not exists lease_expires_at timestamptz;
create index if not exists analytics_scheduled_jobs_lease_idx
 on public.analytics_scheduled_jobs(lease_expires_at) where lease_owner is not null;
commit;