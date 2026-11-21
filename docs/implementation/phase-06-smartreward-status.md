# Phase 06 — SmartReward & Incentive Status

Date: 2026-11-21
Repository: fadliansyah36/SalesXAi-Platform
Branch: main
Supabase: eyofuiyxalbehbqoaeny
Latest implementation source SHA at this update: c95d558a81c5a9058cde0daa351de555328b69e4

## Status

**IN_PROGRESS — IMPLEMENTATION AND CI VALIDATION PASS; PRODUCTION RELEASE NOT YET VERIFIED.**

Phase 06 is not marked COMPLETED because the latest Railway deployments are still QUEUED. The four-service production release gate remains open until the latest FastAPI and portal deployments report SUCCESS and health checks pass. Phase 07 remains LOCKED.

## Implemented backend and lifecycle

- Reward program CRUD, active period, status, tenant ownership, audience and configuration.
- Incentive rule CRUD and server-side point calculation for supported verified sources: completed orders, completed visits and visit-target achievement. Rule processing includes configured fixed points, points-per-unit, caps, minimum metrics, role/branch/user audience, active program period and per-period limits.
- Catalog CRUD and server-side eligibility: active linked program/catalog period, active organization membership, role/branch/user audience, minimum balance, available stock, per-participant period limits and catalog-wide period limits.
- Immutable points ledger with append-only update/delete protection, account row locks, idempotency keys, balance-before/after, source/reference/actor/reason metadata and account projection reconciliation from ledger entries.
- Redemption lifecycle: request, participant/manager reads, approval/rejection with required reason, cancellation, fulfillment, stock reservation, compensating ledger entries, history and audit.
- Approval lifecycle: request creation, approver role and resource-scope validation, self-approval prevention, decision reason, approve/reject state transitions, immutable history and ledger issuance after approval. Unapproved manual earning fails closed.
- Expiration: point lots and FIFO allocation, scheduled expiration processing, immutable negative expiration ledger entries, account projection reconciliation, outbox notification and retention.
- Reporting: date-range and branch-scoped tenant reports for earning, redemption, outstanding balance, expiration, adjustment, reversal, incentive achievement, pending redemptions and pending approvals; platform-level organization summary for Super Admin.
- Tenant permission checks and Python/TypeScript API action matrix coverage.

### API and service surface

Tenant endpoints under `/api/v1/organizations/{organization_id}/smart-reward`:

- `GET/POST/PATCH programs`
- `GET rules`, `POST programs/{program_id}/rules`, `PATCH rules/{rule_id}`
- `GET/POST/PATCH catalog`
- `GET balance`, `GET progress`, `GET ledger`, `POST earnings`
- `GET/POST redemptions`, `PATCH redemptions/{redemption_id}`, `POST redemptions/{redemption_id}/fulfill`, `POST redemptions/{redemption_id}/cancel`
- `POST adjustments`, `POST ledger/{entry_id}/reverse`
- `GET reports`
- `GET/POST approvals`, `PATCH approvals/{approval_id}`
- `GET events` (private, server-authorized event stream)

Platform endpoint: `GET /api/v1/admin/smart-reward/overview`.

The current action matrix contains 25 SmartReward contracts including the platform overview contract. FastAPI response schemas and shared TypeScript request/response contracts are present; the typed API client is used by Web and Expo clients.

## Web portal and Native Expo integration

- Customer: `/customer/smart-reward`; legacy local points/voucher checkout mutation removed. Checkout links to the API-backed reward catalog; no local reward points are minted.
- Sales: `/portal/smart-reward`; legacy local reward balance/redemption actions removed and routed to the API-backed workspace.
- Supervisor: `/supervisor/smart-reward`; permission-gated branch/approval workspace.
- Company: `/company/smart-reward`; tenant program, rule, catalog and reporting workspace.
- Principal: `/principal/smart-reward`; tenant-scoped program/report workspace.
- Distributor: `/distributor/smart-reward`; permission-gated catalog and redemption visibility.
- Super Admin: `/super-admin/smart-reward`; platform organization overview.
- Native Expo Mobile Sales embeds `SmartRewardHome` and uses the shared typed API client for progress, balance, next expiration, ledger, catalog eligibility, redemption, approval and fulfillment status/actions. Approval and fulfillment actions are permission-gated and require reason/reference input.
- SmartReward frontends do not write business data directly to Supabase. Business mutations go through FastAPI; Supabase Realtime is used only for private event delivery.

## Private Realtime and event security

- Database broadcast triggers cover ledger, redemption, approval, program, rule and catalog lifecycle changes. Topics are private and scoped to tenant, participant and branch.
- Portal workspace uses the FastAPI private SSE event stream for server-authorized tenant/branch scope, with Last-Event-ID replay, reconnect and duplicate-event handling.
- Expo uses private Supabase Broadcast for participant-scoped events when the public Realtime configuration is present; manager roles use the authorized SSE stream so branch/tenant events for other participants are not missed.
- Broadcast payloads contain identifiers and status metadata only; clients re-fetch authoritative state from FastAPI.
- Reward tables deny direct anon/authenticated business-table grants; authorization is enforced by API permissions, membership, ownership and tenant scope.

## Supabase migration and live schema evidence

All **16/16 Phase 06 migrations** are applied and match the local migration ledger in project `eyofuiyxalbehbqoaeny`:

| Version | Migration |
|---|---|
| 20261121012020 | p06_reward_core |
| 20261121012025 | p06_reward_ledger_compensation_signs |
| 20261121012115 | p06_reward_fk_indexes |
| 20261121013104 | p06_reward_expiration_approval_lots |
| 20261121013452 | p06_reward_approval_self_read |
| 20261121013538 | p06_reward_private_outbox_stream |
| 20261121013653 | p06_reward_approval_history_and_participant_rules |
| 20261121013846 | p06_reward_participant_rule_read |
| 20261121014304 | p06_reward_lifecycle_fk_indexes |
| 20261121014859 | p06_reward_realtime_ownership_scope |
| 20261121020010 | p06_reward_platform_overview_permission |
| 20261121024447 | p06_reward_private_realtime_all_lifecycle_events |
| 20261121025010 | p06_reward_expiration_reconcile_ledger_first |
| 20261121025805 | p06_reward_outbox_owner_scope |
| 20261121030129 | p06_reward_reporting_expiry_indexes |
| 20261121030235 | p06_reward_outbox_retention |

Live verification:
- 13 reward tables; RLS enabled on 13/13.
- No direct `anon` or `authenticated` table grants on reward tables.
- Supabase Security Advisor: zero lints.
- Performance Advisor: zero unindexed-foreign-key warnings.
- `salesx_reward_expiration` cron active at `10 0 * * *` UTC.
- `salesx_reward_outbox_retention` cron active at `30 0 * * *` UTC.
- The production project currently has zero reward accounts; ledger/account mismatch query therefore returned zero mismatches across zero accounts. This is not evidence of populated-ledger transaction or load testing.

## Engineering validation evidence

- API workflow run **44865292600**: 114 tests passed, Ruff clean, API package/container build successful.
- Independent portal build run **44865381049**: all 8 Web portal workspaces passed typecheck/lint/build; Expo typecheck and Android bundle export passed.
- Railway container/CSS runtime run **44865538227**: Website, Customer and Company production containers built; all 8 grouped portal routes returned linked CSS and standalone CSS containing canonical SalesX design tokens.
- The final mobile manager event-scope adjustment is commit `c95d558a81c5a9058cde0daa351de555328b69e4`; follow-up Phase 02/API workflow run **44866343986** passed, including `mobile-sales-build` typecheck and Android bundle export. The latest independent portal build run **44866343983** passed all 8/8 portal jobs on the same source commit.
- These are focused CI and schema validations. No populated production reward-account transaction, load/concurrency test or signed-in cross-tenant browser session was performed.

## Railway deployment and release evidence

The four existing services are preserved; no new service or database was created.

| Existing service | Current build configuration | Latest deployment at this update |
|---|---|---|
| `salesx-api` | Dockerfile builder; `services/api/Dockerfile`; root `/services/api` | **SUCCESS** — `2e75c3f6-370b-4ecb-9381-12c499fa840e`, source commit `ad6ef56e66ea69759f6b3daa41c298dfa2dca3d3`; deploy log confirms `GET /readyz 200 OK` |
| `salesx-website` | Dockerfile builder; `infrastructure/docker/Dockerfile.website`; monorepo root | QUEUED — `5eb62c98-fcf7-4dde-8b0a-1d4a4d427d61` |
| `salesx-customer` | Dockerfile builder; `infrastructure/docker/Dockerfile.customer`; monorepo root | QUEUED — `1bf7b603-740c-4bb9-ab15-4d5f940608a4` |
| `salesx-company` | Dockerfile builder; `infrastructure/docker/Dockerfile.company`; monorepo root | QUEUED — `5fef1b26-c3a6-4792-856a-700f8a7a5645` |

The three portal services now use the explicit production Dockerfiles, Node 22/Bun 1.4.5 build stages, complete Next standalone trees and CSS-aware gateway health checks. Website and Company gateways check every child app's canonical root/deep route, JavaScript asset, CSS asset, manifest and scoped service worker. Railway deployments are not claimed successful until the queued deployment IDs above report SUCCESS and health checks pass.

Historical Railway failures were diagnosed:
- An older Sales Portal build failed because `filteredOutlets` was not defined; the current source restores the filter derivation and the independent portal build passes.
- An older API deployment failed at startup because `get_smart_reward_repository` was missing; the dependency is now present, FastAPI route/action-matrix import validation passes, and a later API deployment succeeded. The latest API code is still queued for release.

## Remaining blockers — Phase 06 is not COMPLETED

1. `salesx-api` is deployed and ready. The latest `salesx-website`, `salesx-customer` and `salesx-company` Dockerfile deployments remain queued; their current live deployments still run earlier successful source commits.
2. The linked production Supabase project has no reward accounts/ledger rows, so reconciliation is verified structurally but not against populated reward activity.
3. The supported incentive source set is completed orders, completed visits and visit-target achievement; additional activity/KPI source adapters must be added if required by the full business catalog.
4. No real populated-data concurrency/load exercise or authenticated cross-tenant browser session was performed; do not describe static locks/constraints as load-test evidence.
5. SMTP and Google OAuth credentials remain intentionally deferred until the corresponding deployment configuration is supplied; no placeholder secret is used.

**Closure rule:** keep Phase 06 IN_PROGRESS and Phase 07 LOCKED until the latest API and all three portal Dockerfile deployments succeed, their health checks pass, and the remaining evidence gaps are explicitly closed. The next phase after closure is **Phase 07 — Realtime Location & Route History**.
