# Analytics API — Phase 08

All endpoints require a verified Supabase Auth session, active organization membership, the matching FastAPI action permission, and organization scope. Business data is read from Supabase through FastAPI only.

## Dashboard

GET /api/v1/organizations/{organization_id}/analytics/dashboard

Query:
- period_start: ISO date (required)
- period_end: ISO date (required)
- grain: day | week | month (default day)
- optional scope_type: tenant | branch | team | territory | user
- optional scope_id: UUID for a non-tenant scope

Returns the authorized metric snapshots, caller scopes, period, data_as_of and is_stale. Maximum range is 366 days. If no scope is supplied, the service returns only the caller's assigned scopes so the UI can choose a valid initial scope. Explicit scope filters are validated by active membership, role assignment, permission, tenant and resource scope before query execution.

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

Requires analytics:reports:manage within the caller's authorized organization/scope. The endpoint registers an idempotent durable report run and queued export, returning HTTP 202. The report is not downloadable until the export worker completes and the private artifact is available.

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


## KPI definitions and attribution

The metric catalog is the runtime source for display name, unit, aggregation and source-table provenance. Current deterministic definitions:

| Metric | Formula | Available scope |
|---|---|---|
| `orders.count` | Count of orders excluding `cancelled`, `expired`, and `draft` | Tenant, branch, team, territory, salesperson |
| `orders.gross_value` | Sum of `orders.grand_total` for the same eligible orders | Tenant, branch, team, territory, salesperson |
| `visits.scheduled` | Count by `smartteam_visits.scheduled_at` date | Tenant, branch, team, territory, salesperson |
| `visits.completed` | Count by `check_out_at` date | Tenant, branch, team, territory, salesperson |
| `visits.productive` | Completed visits with `outcome='productive'` | Tenant, branch, team, territory, salesperson |
| `outlets.covered` | Distinct outlet IDs with both check-in and check-out | Tenant, branch, team, territory, salesperson |
| `inventory.available` | Sum of current `inventory_balances.available` | Tenant, branch |
| `rewards.points_issued` | Sum of positive `reward_points_ledger.points_delta` | Tenant, branch, team, territory, salesperson |
| `rewards.points_redeemed` | Sum of `reward_redemptions.points_reserved` for fulfilled redemptions | Tenant, branch, team, territory, salesperson |

Orders are attributed through `orders.cart_id → carts.owner_user_id → sales_profiles.user_id`; branch comes from the active membership assignment, while team and territory come from the matching sales profile. Visits use their persisted branch/team IDs and the matching sales profile's territory/user. Reward activity is attributed to its participant user and current organization membership/profile. Every source query is constrained by the requested organization before aggregation.

Daily outlet coverage is distinct per day. Weekly and monthly coverage is recomputed as a distinct outlet count over the whole period; daily distinct counts are never summed to approximate period coverage. Weekly/monthly additive metrics sum daily snapshots; inventory uses the last available daily snapshot in the period. Inventory is intentionally not attributed to a salesperson or team because its source of truth is warehouse/branch stock, not an individual sales owner.

The dashboard's initial unfiltered request discovers only scopes assigned to the authenticated user. The UI then selects a valid assigned scope and reloads with explicit scope filters; it does not guess a tenant-wide scope for a salesperson.
