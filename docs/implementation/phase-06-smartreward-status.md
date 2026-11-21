# Phase 06 — SmartReward & Incentive Status

Date: 2026-11-21
Repository: fadliansyah36/SalesXAi-Platform
Branch: main
Supabase: eyofuiyxalbehbqoaeny
Latest runtime implementation SHA: a7066dfcd842fc1497eb75497508c0eb08be0b6d
Latest main SHA before this tracker update: 823072c098dcbee285d5a0157e33fa47b6371075

## Status

**IN_PROGRESS — FOUR-SERVICE RELEASE AND PORTAL RUNTIME VALIDATION PASS; POPULATED-DATA AND AUTHENTICATED SECURITY GATES REMAIN OPEN.**

The four required Railway services are now ONLINE with successful latest deployments and health checks. Phase 06 remains IN_PROGRESS because the linked Supabase project has no organizations, Auth users, reward accounts or reward transactions; populated-ledger reconciliation and authenticated concurrency/cross-tenant tests therefore cannot be truthfully completed. Phase 07 remains LOCKED.

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

| Existing service | Build configuration | Current live successful deployment | Latest source deployment |
|---|---|---|---|
| `salesx-api` | Dockerfile builder; `services/api/Dockerfile`; root `/services/api` | **SUCCESS** — `2e75c3f6-370b-4ecb-9381-12c499fa840e`, source `ad6ef56e66ea69759f6b3daa41c298dfa2dca3d3`; deploy log confirms `GET /readyz 200 OK` | Same deployment — SUCCESS |
| `salesx-website` | Dockerfile builder; `infrastructure/docker/Dockerfile.website`; monorepo root | **SUCCESS** — `43a74cb4-2e67-467e-a277-3bea64765871`, source `683d371af1a0c87d5f959616092ebf516abb1f05`; gateway routes `/` and `/sales`, both Next processes Ready | QUEUED — `5eb62c98-fcf7-4dde-8b0a-1d4a4d427d61`, source `a5f73c7f45d6703e61122f3436b9174f6c70d134` |
| `salesx-customer` | Dockerfile builder; `infrastructure/docker/Dockerfile.customer`; monorepo root | **SUCCESS** — `aaff5a51-46d6-471f-a8dc-0dac8d56c376`, source `683d371af1a0c87d5f959616092ebf516abb1f05`; Next server Ready | QUEUED — `1bf7b603-740c-4bb9-ab15-4d5f940608a4`, source `a5f73c7f` |
| `salesx-company` | Dockerfile builder; `infrastructure/docker/Dockerfile.company`; monorepo root | **SUCCESS** — `c2bed96f-fec0-43a9-a046-2bf35e2cc631`, source `683d371af1a0c87d5f959616092ebf516abb1f05`; gateway routes `/`, `/distributor`, `/principal`, `/supervisor`, `/admin`; all five Next processes Ready | QUEUED — `5fef1b26-c3a6-4792-856a-700f8a7a5645`, source `a5f73c7f` |

The three portal services now use the explicit production Dockerfiles, Node 22/Bun 1.4.5 build stages, complete Next standalone trees and CSS-aware gateway health checks. Website and Company gateways check every child app's canonical root/deep route, JavaScript asset, CSS asset, manifest and scoped service worker. Railway deployments are not claimed successful until the queued deployment IDs above report SUCCESS and health checks pass.

Historical Railway failures were diagnosed:
- An older Sales Portal build failed because `filteredOutlets` was not defined; the current source restores the filter derivation and the independent portal build passes.
- An older API deployment failed at startup because `get_smart_reward_repository` was missing; the dependency is now present, FastAPI route/action-matrix import validation passes, and a later API deployment succeeded. The latest API code is still queued for release.

## Latest verified release and evidence — 2026-11-21

### Railway production release

All four required services are ONLINE with one running replica and SUCCESS deployment:

| Service | Deployment | Source SHA | Runtime verification |
|---|---|---|---|
| salesx-api | 9da9cb24-196d-41ca-b093-f11066e78dd2 | 823072c098dcbee285d5a0157e33fa47b6371075 | /readyz healthcheck succeeded |
| salesx-website | 283bdd58-7e86-4b0f-a129-6a0a0f2d54fb | a7066dfcd842fc1497eb75497508c0eb08be0b6d | gateway website + sales routes; healthcheck succeeded |
| salesx-customer | 5970d381-b17b-491d-8ec4-55ae9cd618e3 | a7066dfcd842fc1497eb75497508c0eb08be0b6d | gateway customer route; healthcheck succeeded |
| salesx-company | 9f89b114-6fc5-4cd2-a40e-0e0468ff5538 | a7066dfcd842fc1497eb75497508c0eb08be0b6d | company/distributor/principal/supervisor/admin child apps ready; healthcheck succeeded |

The latest main commit 823072c is a test-only follow-up in `services/api/tests/test_smart_reward_contracts.py`; portal source paths were unchanged, so Railway correctly skipped unnecessary portal redeploys. Their latest runtime source remains a7066df. The Customer Railway Start Command override was corrected to `node infrastructure/scripts/portal-gateway.mjs customer`, and watch patterns now include the gateway and runtime-verifier scripts. The new Customer deployment log confirms the customer gateway is active.

### Portal, API and Expo validation

- Portal build matrix: 8/8 SUCCESS (Customer, Sales, Supervisor, Company, Principal, Distributor, Super Admin, Website).
- Production container runtime validation: 3/3 SUCCESS (customer, website, company).
- CSS/JS checks served actual HTML, stylesheet and JavaScript assets with expected MIME types. Verified pages: customer (1 CSS/12 JS), website (1/10), sales (1/11), company (1/11), distributor (1/12), principal (1/12), supervisor (1/12), admin (1/11). Canonical token CSS was present for every portal.
- API CI: 115 tests PASS; compileall, Ruff and FastAPI container build PASS. SmartReward contracts include append-only ledger, tenant-aware private events, approval reasons, idempotency/serialization contracts and transactional balance projection.
- Web auth: typecheck PASS; lint has 0 errors and 2 existing `@next/next/no-img-element` warnings.
- Native Expo Mobile Sales: typecheck PASS and Android bundle export PASS.
- API and portal release metadata now expose source commit identifiers for runtime verification.

### Supabase production state

- Phase 06 migrations applied: 16/16.
- Reward tables: 13; RLS enabled: 13/13; direct client table grants: 0.
- Supabase Security Advisor: 0 lints.
- Production rows: organizations 0, profiles 0, auth.users 0, reward_accounts 0, reward_points_ledger 0, reward_redemptions 0, reward_point_lots 0, reward_approval_requests 0 and reward_audit_events 0.
- A zero-row reconciliation is not populated-ledger evidence and is not counted as a successful ledger reconciliation.

### Remaining blockers — Phase 06 is not COMPLETED

1. **Populated transaction evidence:** no tenant, Auth user, reward account or reward transaction exists. Do not create fake production activity or bypass the application workflow. A controlled isolated test tenant and authenticated test identity must be provisioned through Supabase Auth and the application workflow before earning, redemption, expiration, reversal and adjustment can be reconciled with real row counts and references.
2. **Concurrency and authorization:** the CI contract suite verifies implementation contracts, row-lock/idempotency structure and transaction boundaries; it is not a live concurrent load test. No authenticated cross-tenant session or private Realtime subscription denial test has been run because there are zero Auth users and organizations.
3. **PRD submodule mapping:** Master PRD 5.3 lists Reward Campaign and Customer Segment alongside program, ledger, rules, catalog, eligibility, redemption and analytics. Current schema has reward programs/rules/catalog/reporting but no first-class customer-segment entity; program periods/audience cover campaign-like behavior only. This mapping/implementation gap must be closed or explicitly scoped before Phase 06 can be called complete.
4. **Incentive source coverage:** implemented verified sources are completed orders, completed visits and visit-target achievement. Additional activity/KPI adapters remain a gap if required by the full business catalog.
5. SMTP and Google OAuth secrets remain intentionally deferred; no placeholder credentials were added.

**Closure rule:** Phase 06 stays IN_PROGRESS and Phase 07 stays LOCKED until populated ledger evidence, reconciliation, live concurrency, authenticated cross-tenant/private-Realtime validation and remaining PRD submodule gaps are closed. Next phase after closure: **Phase 07 — Realtime Location & Route History**.


## Latest-source UI release continuation — 2026-11-21

- Source commit: `627ce255e770e2712a479cff9ce3d6b5c08f17c7` (main). This change adds explicit Tailwind v4 `@source` roots for the shared app, Website, Sales Portal, root components and shared design-system/token packages. The missing explicit monorepo source roots are the leading code-level explanation for a stylesheet that loads but omits layout utility classes; this is a targeted source correction, not a visual redesign.
- Railway latest-source deployments for the portal group all report SUCCESS on this exact SHA:
  - `salesx-website`: `041b40bf-9a86-4813-beab-68a331c42bd8` — SUCCESS, gateway starts Website and Sales child Next servers.
  - `salesx-customer`: `a0610b6f-8642-4a04-b2a1-c88ad1a1ee57` — SUCCESS, customer gateway starts Next server.
  - `salesx-company`: `b98a72dc-6902-4d14-91cf-de91751dc021` — SUCCESS, gateway starts Company, Distributor, Principal, Supervisor and Super Admin child Next servers.
- The required `salesx-api` deployment remains SUCCESS at `9da9cb24-196d-41ca-b093-f11066e78dd2`, source `823072c098dcbee285d5a0157e33fa47b6371075`. Commit 627ce255 changes only shared Web CSS; Railway correctly skipped an API redeploy. Its latest API code SHA remains 823072c.
- GitHub combined status for commit 627ce255 reports success for all four required Railway services; Railway environment status independently confirms all four required services ONLINE with 1/1 running replica.
- Website and Sales Portal Next builds both report “Compiled successfully”; the Company build reports successful compilation for all five grouped child portals. Deployment logs show the expected gateway route groups and each Next server Ready.
- The CSS source correction is now deployed. However, the connected Railway tools do not expose a browser screenshot/computed-style inspection, and this execution environment cannot resolve the public Railway domain directly. Therefore the visual appearance on a handset is not claimed as independently confirmed. A successful CSS/JS HTTP health probe is not the same as a manual visual rendering review.
- Supabase row counts were re-read after the release: organizations 0, profiles 0, reward_accounts 0, reward_points_ledger 0, reward_redemptions 0, reward_point_lots 0, reward_approval_requests 0, reward_audit_events 0. No production data was seeded.
- Phase 06 remains IN_PROGRESS. Populated-ledger evidence, authenticated test identities/tenant, live concurrency and cross-tenant/private-Realtime tests remain blocked; Customer Segment is still a PRD 5.3 gap. Phase 07 remains LOCKED.


## Customer Segment implementation continuation — 2026-11-21

- Master PRD 5.3 requires Customer Segment as an independent SmartReward submodule; it is no longer represented only by campaign/program audience.
- Applied migration `20261121054216_p06_reward_customer_segments` to Supabase ref `eyofuiyxalbehbqoaeny`. It creates tenant-owned `reward_customer_segments` and `reward_customer_segment_members`, active/status and membership-source state, JSONB segment criteria, period constraints, uniqueness and tenant composite FKs. It adds nullable segment relationships to reward programs, incentive rules and catalog items, indexes, RLS deny policies, service-role grants, private lifecycle Broadcast triggers and explicit `smartreward:segment:read/manage` permission assignments.
- Live SQL confirms the migration is recorded under version `20261121054216`, both new tables exist with RLS enabled, both permission keys exist, and the Phase 06 migration ledger now contains 17 entries. Segment/member row counts are 0; no production tenant, profile or reward activity was seeded.
- Backend implementation: `services/api/app/schemas/smart_reward.py`, `services/api/app/services/smart_reward_segments.py`, `services/api/app/routers/smart_reward.py`, and `services/api/app/security/action_matrix.py`. New endpoints cover paginated segment list, create, detail, update, member list, member add/remove, and rule-based evaluate. Every route uses the action matrix and tenant context; membership changes are audited and rule evaluation runs in a transaction.
- Program, incentive-rule and catalog schemas/services now persist optional `customer_segment_id`; server-side catalog eligibility, direct redemption and source-based point issuance enforce active segment membership. No frontend business mutation bypass was added.
- Shared contracts and typed API client now expose segment CRUD, membership and evaluation methods. The existing shared SmartReward Web workspace includes Customer Segment management, rule evaluation and manual member management, and allows programs/rules/catalog items to be linked to a segment. Existing design tokens and page layout are retained.
- Code commits in this continuation include migration/schema/service/router/action-matrix/contracts/client/shared UI changes; current main HEAD at time of tracker update is `0d26429ce7fe72e04d00a8348c37935502578392`.
- The current Railway environment has queued deployments for the newest API and three portal groups. The latest GitHub status contexts report SUCCESS, but Railway still reports queued/applying deployments, so latest-source production rollout is NOT claimed complete until the active deployment IDs settle and logs confirm the source SHA.
- Remaining validation: no populated reward accounts or transaction fixtures exist; no populated ledger reconciliation, concurrent DB transaction test, isolated authenticated cross-tenant session, or Realtime denial session has been executed. These remain release blockers. Native Expo continues to use the shared SmartReward typed API for eligible catalog, balance, ledger and redemption; segment eligibility is enforced server-side. Native customer-segment authoring is not a Mobile Sales workflow.

**Phase 06 remains IN_PROGRESS. Phase 07 remains LOCKED.**
