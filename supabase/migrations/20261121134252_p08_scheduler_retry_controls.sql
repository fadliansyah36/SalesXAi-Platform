begin;
alter table public.analytics_scheduled_jobs
 add column if not exists attempt_count integer not null default 0,
 add column if not exists max_attempts integer not null default 5,
 add column if not exists retry_at timestamptz;
alter table public.analytics_scheduled_jobs
 add constraint analytics_scheduled_jobs_attempt_bounds
 check(attempt_count>=0 and max_attempts between 1 and 10) not valid;
commit;