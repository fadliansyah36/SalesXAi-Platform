begin;
alter table public.analytics_report_exports
 add column if not exists expires_at timestamptz not null default (now()+interval '30 days'),
 add column if not exists artifact_deleted_at timestamptz,
 add column if not exists cleanup_attempt_count integer not null default 0;
create index if not exists analytics_report_exports_expiry_idx
 on public.analytics_report_exports(expires_at) where status='completed' and artifact_path is not null;
commit;