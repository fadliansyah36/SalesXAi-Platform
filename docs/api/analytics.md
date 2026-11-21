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
