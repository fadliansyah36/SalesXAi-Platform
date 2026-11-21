# Analytics API — Phase 08

All endpoints require a verified Supabase Auth session, active organization membership, the matching FastAPI action permission, and organization scope. Business data is read from Supabase through FastAPI only.

## Dashboard

GET /api/v1/organizations/{organization_id}/analytics/dashboard

Query:
- period_start: ISO date (required)
- period_end: ISO date (required)
- grain: day | week | month (default day)

Returns the authorized metric snapshots, caller scopes, period, data_as_of and is_stale. Maximum range is 366 days. Tenant, branch, team, territory and self scopes are filtered by the server-side assignment resolver and database RLS.

## Report runs

GET /api/v1/organizations/{organization_id}/analytics/reports?limit=50

Returns tenant-authorized report runs and the caller's own runs.

POST /api/v1/organizations/{organization_id}/analytics/reports

Body:
{
  "report_key": "sales.performance",
  "period_start": "2026-11-01",
  "period_end": "2026-11-21",
  "period_grain": "day",
  "scope_type": "tenant",
  "idempotency_key": "caller-generated-stable-key",
  "parameters": {}
}

Requires analytics:reports:manage at tenant scope. The endpoint registers an idempotent durable report run and returns HTTP 202. It does not claim an export artifact exists until an export worker completes the job.

## Permissions

- analytics:dashboard:read
- analytics:reports:read
- analytics:reports:manage
- analytics:metrics:refresh (service/worker operation; not exposed as a user endpoint)

## Current implementation boundary

The current refresh worker and SQL function produce daily tenant-level order, visit, outlet-coverage, inventory and reward snapshots. Weekly/monthly rollups, full branch/team/territory materialization and export artifact processing remain Phase 08 work in progress. The API returns stale metadata when no matching snapshots exist; it does not synthesize data.


## Scoped KPI queries

`GET /api/v1/organizations/{organization_id}/analytics/dashboard` accepts:
- `period_start`, `period_end`, `grain=day|week|month`
- optional `scope_type=tenant|branch|team|territory|user`
- optional `scope_id` (required for non-tenant scope)

The service verifies the requested scope against active membership, role assignment, permission and organization. Tenant roles may view all hierarchy levels; supervisors are restricted to assigned branch/team/territory; salesperson roles are restricted to their own user scope. Weekly/monthly coverage is calculated as period-level distinct outlets, not a sum of daily distinct counts.

## Report export and secure download

- `POST /api/v1/organizations/{organization_id}/analytics/reports` creates an idempotent report run and a queued CSV export job. It returns HTTP 202 with `export_id` and `export_status`.
- The API runtime starts the singleton analytics scheduler in FastAPI lifespan. It claims due jobs using a PostgreSQL advisory lock and row-level `SKIP LOCKED`, records each execution and retries failed runs with exponential backoff.
- The export worker reads authorized snapshots, writes CSV to the private `analytics-private` Storage bucket, and updates report/export lifecycle state.
- `GET /api/v1/organizations/{organization_id}/analytics/reports/{report_run_id}/download` verifies tenant, active membership, report scope and report-read permission. It issues a signed URL with a 60-second expiry and records `signed_url_issued` in `analytics_report_access_events`.
- The bucket is private. No permanent object URL or bucket credential is returned to the browser.

## Scheduling

Each active organization receives an idempotent daily refresh schedule at 00:15 in its `organizations.timezone`. The first execution is due immediately after scheduler initialization; later runs follow the local daily schedule. The refresh updates daily tenant and scope snapshots, then weekly/monthly rollups. `analytics_scheduled_jobs` and `analytics_job_executions` retain due time, attempts, status, retry time and error metadata.
