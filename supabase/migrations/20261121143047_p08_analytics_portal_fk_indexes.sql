begin;
create index if not exists analytics_job_executions_scheduled_job_fk_idx
 on public.analytics_job_executions(scheduled_job_id) where scheduled_job_id is not null;
create index if not exists analytics_metric_snapshots_metric_key_fk_idx
 on public.analytics_metric_snapshots(metric_key);
create index if not exists analytics_report_access_events_report_run_fk_idx
 on public.analytics_report_access_events(report_run_id);
create index if not exists analytics_report_exports_report_run_fk_idx
 on public.analytics_report_exports(report_run_id);
create index if not exists analytics_report_runs_definition_fk_idx
 on public.analytics_report_runs(report_definition_id) where report_definition_id is not null;
create index if not exists auth_portal_handoffs_organization_fk_idx
 on public.auth_portal_handoffs(organization_id);
commit;