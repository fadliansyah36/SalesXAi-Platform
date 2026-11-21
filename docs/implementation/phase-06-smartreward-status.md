# PHASE 06 CURRENT EXECUTION SNAPSHOT — 2026-11-21

**Status: IN_PROGRESS — not closed.**

- 18 Phase 06 migrations are applied.
- Customer Segment schema, membership, program/rule eligibility and reporting foundation remain in place.
- Existing SmartReward service paths use transaction-scoped account locking and idempotency constraints. Existing API tests include serialized/idempotent lifecycle assertions.
- Added isolated SQL fixture: supabase/tests/phase06_smartreward_ledger.sql.
- The fixture was executed in a rollback-only database transaction. It verified ledger entries for earn, redemption, expiration, reversal (linked to the original redemption), and adjustment; ledger sum reconciliation to 850; duplicate idempotency rejection; and cross-tenant account-reference rejection. All fixture rows were rolled back.
- Security Advisor reports 0 security lints; the latest Performance Advisor reports 0 unindexed foreign-key lints.
- An existing SmartReward Realtime policy is present but is not sufficient: it matches the tenant topic only and allows branch-scoped assignments to subscribe to the tenant-wide topic; participant/branch topics are not covered. A role-scope owner-pending replacement is prepared but not active.

**Remaining Phase 06 gates:**
1. Run the existing SmartReward API concurrency tests against an isolated test database using two real concurrent connections; the rollback-only fixture is not a substitute for this.
2. Verify authenticated cross-tenant API access with isolated test sessions, without manual login/register using real customer accounts.
3. Verify private SmartReward Realtime subscription authorization with a test session.
4. Verify all portal and Expo SmartReward actions against their typed FastAPI contracts and the populated fixture.

Do not mark Phase 06 COMPLETED until these gates have evidence.

## 2026-11-21 continuation — concurrency and Realtime

- Applied migration `20261121093654_p06_reward_realtime_payload_scope`. The private event payload now carries only organization, participant, requester and branch identifiers in addition to existing event/resource/status metadata. No profile or business PII is added.
- Added `services/api/tests/test_smart_reward_concurrency_integration.py`: two independent PostgreSQL connections are synchronized at the initial idempotency lookup, then exercise the actual `smart_reward_service.redeem` transaction path. It covers same-key idempotency and distinct-key insufficient-balance serialization.
- The integration test is deliberately restricted to a disposable local Supabase database via `SALESX_TEST_DATABASE_URL`; it was not executed in this environment. Existing static service tests prove `FOR UPDATE`, transaction and idempotency implementation, but are not live concurrent evidence.
- Live `smartreward_private_read` was inspected directly. Its current predicate authorizes only `tenant:{org}:smartreward` and permits a branch-scoped assignment on that topic, which is broader than the participant/branch topic design. The corrected user/branch/tenant policy with payload/channel matching is prepared in `supabase/owner-pending/20261121101500_smartreward_realtime_role_scope_policy.sql`; it is not applied.
- The current policy therefore does not satisfy the Phase 06 private Realtime Definition of Done. Owner-level authorization on `realtime.messages` is required before replacement and authenticated subscription tests can complete.

---

# Phase 06 — SmartReward & Incentive Status

Date: 2026-11-21
Repository: fadliansyah36/SalesXAi-Platform
Branch: main
Supabase: eyofuiyxalbehbqoaeny
Latest runtime implementation SHA: a7066dfcd842fc1497eb75497508c0eb08be0b6d
Latest main SHA before this tracker update: 823072c098dcbee285d5a0157e33fa47b6371075

## Status

**IN_PROGRESS — FOUR-SERVICE RELEASE AND PORTAL RUNTIME VALIDATION PASS; POPULATED-DATA AND AUTHENTICATED SECURITY GATES REMAIN OPEN.**

The four required Railway services are now ONLINE with successful latest deployments and health checks. Phase 06 remains IN_PROGRESS because the linked Supabase project has no organizations, Auth users, reward accounts or reward transactions; populated-ledger reconciliation and authenticated concurrency/cross-tenant tests therefore cannot be truthfully completed. Phase 07 remains IN_PROGRESS.

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

- Database broadcast triggers cover ledger, redemption, approval, program, rule and catalog lifecycle changes. Private topics are emitted separately for participant, branch and tenant audiences.
- Applied migration `20261121093654_p06_reward_realtime_payload_scope` adds only organization, participant, requester and branch identifiers to the minimal event/status payload so the owner policy can match event audience to topic.
- The live `smartreward_private_read` policy currently matches only the tenant topic and permits branch-scoped assignments to subscribe to it. Participant/branch subscriptions are not currently authorized by that policy; the broad tenant-topic grant is not an acceptable substitute for branch filtering.
- Corrected owner-gated policy source is prepared in `supabase/owner-pending/20261121101500_smartreward_realtime_role_scope_policy.sql`. It is not active because `realtime.messages` is owned by `supabase_realtime_admin`.
- Portal workspace continues to use FastAPI private SSE for server-authorized tenant/branch scope, with Last-Event-ID replay, reconnect and duplicate-event handling. Do not enable direct participant/branch Supabase subscriptions until the owner policy is applied and authenticated allow/deny tests pass.
- Broadcast payloads contain identifiers and status metadata only; clients re-fetch authoritative state from FastAPI.
- Reward tables deny direct anon/authenticated business-table grants; authorization is enforced by API permissions, membership, ownership and tenant scope.

## Supabase migration and live schema evidence

All **18/18 Phase 06 migrations** are applied and match the local migration ledger in project `eyofuiyxalbehbqoaeny`:

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
| 20261121054216 | p06_reward_customer_segments |
| 20261121093654 | p06_reward_realtime_payload_scope |

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

**Closure rule:** Phase 06 stays IN_PROGRESS and Phase 07 stays IN_PROGRESS until populated ledger evidence, reconciliation, live concurrency, authenticated cross-tenant/private-Realtime validation and remaining PRD submodule gaps are closed. Next phase after closure: **Phase 07 — Realtime Location & Route History**.


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
- Phase 06 remains IN_PROGRESS. Populated-ledger evidence, authenticated test identities/tenant, live concurrency and cross-tenant/private-Realtime tests remain blocked; Customer Segment is still a PRD 5.3 gap. Phase 07 remains IN_PROGRESS.


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

**Phase 06 remains IN_PROGRESS. Phase 07 remains IN_PROGRESS.**


## Segment CRUD, membership and analytics UI completion — 2026-11-21

- Added tenant-scoped Customer Segment analytics endpoint `GET /api/v1/organizations/{organization_id}/smart-reward/segments/{segment_id}/report`, returning active/inactive/removed membership counts and segment-scoped earned, redeemed, expired, adjusted points and ledger entry totals.
- Added API action `smartreward.segments.report`, reusing the existing organization reward-report permission. Shared TypeScript response contract and typed API client method are present.
- Existing shared SmartReward workspace now supports segment create, active/paused/archive state changes, rule evaluation, member add/remove, member listing, segment analytics, and linking a segment to a program, incentive rule and catalog item. All actions use the shared typed FastAPI client.
- Rule evaluation preserves manually managed memberships in hybrid segments; only rule-origin memberships are updated/deactivated by evaluation.
- Latest repository main HEAD: `b2dd365e930c8c5216402bbda0ef36484e9e7889`. Latest API source commit containing segment routes/action matrix: `90770cd1fa7e151b9e16861d700a99c2d23f2cf2`; latest shared portal UI source: `b2dd365e930c8c5216402bbda0ef36484e9e7889`.
- Railway current latest deployments are still QUEUED (not live): API `fe707dc3-4569-41fa-9d59-fda4f6420e47` (source 90770cd1), Website `e790cd63-0959-436e-bad1-b7c3fc7b8e3b`, Customer `64cf1a75-4f25-4cc6-801a-b1e1d6a6afcf`, Company `bb8eb2ee-1540-49bd-8562-4cacbfba104d` (portal source b2dd365e). Latest-source release is therefore not marked deployed.
- Supabase confirms 18 Phase 06 migrations including customer segments; Security Advisor returned zero lints. Customer segment tables and permission keys exist. Production reward and segment row counts remain zero.

**Phase 06 remains IN_PROGRESS; Phase 07 remains IN_PROGRESS.**


## Final continuation checkpoint — 2026-11-21

- Final API source after the latest segment eligibility correction: `53f81413b03b3960a31c453ae50ee358d0bc41b1`.
- Latest portal UI source: `b2dd365e930c8c5216402bbda0ef36484e9e7889` (the later API-only correction does not change portal files).
- Latest Railway API deployment: `ef89372c-0dba-4f9e-b45d-245a803e41cd`, source `53f81413`, status QUEUED. Latest portal deployments remain queued on source `b2dd365e`: Website `e790cd63-0959-436e-bad1-b7c3fc7b8e3b`, Customer `64cf1a75-4f25-4cc6-801a-b1e1d6a6afcf`, Company `bb8eb2ee-1549-49bd-8562-4cacbfba104d`. No latest-source deployment success is claimed.
- Existing successful production deployments from earlier commits remain live until these queued releases settle. Railway environment currently reports the four required services in DEPLOYING state.
- Current code has not yet been validated by a fresh API/portal/Expo CI run after the Customer Segment additions. Previous 115 API tests and 8/8 portal/Expo build results are historical baseline evidence only.
- No production reward account, ledger, redemption, lot, approval or segment fixture was created. Populated-ledger evidence, concurrency, cross-tenant and private Realtime session tests remain open. Do not seed fake production data or use a real user account.

**Phase 06 remains IN_PROGRESS; Phase 07 remains IN_PROGRESS.**


## Release recovery checkpoint — 2026-11-21 (latest execution)

- Main branch latest engineering fix: `f1cbc3921efef90782da1cdf8cdea44ac3793077` — aligns all Customer Segment router dependencies with the canonical API action matrix. The preceding API deployment `ef89372c-0dba-4f9e-b45d-245a803e41cd` failed at import because the router referenced unknown action `smartreward.segments.manage`. This was corrected by using the existing canonical action IDs for segment list/create/detail/update, member list/add/remove, report and evaluate.
- Latest API deployment: `2320ba70-5976-4592-9912-ff3ae74dbc31`, source `f1cbc3921efef90782da1cdf8cdea44ac3793077`, Railway status **SUCCESS**. Build completed and `GET /readyz` returned `200 OK`; FastAPI application startup completed.
- Latest relevant portal source remains `b2dd365e930c8c5216402bbda0ef36484e9e7889`; the API-only commit does not change portal build inputs. Website and Customer deployments on that source are SUCCESS; Company deployment `bb8eb2ee-1540-49bd-8562-4cacbfba104d` is SUCCESS with all five grouped Next.js servers reporting Ready. The portal gateway starts Website/Sales and Company/Distributor/Principal/Supervisor/Super Admin groups. This confirms production build/runtime startup, not a browser visual/computed-style inspection.
- Railway project remains `026ec9f8-398a-4177-bbbf-afdb302972b9`, production environment; exactly the four required services are maintained. Native `@salesx-ai/mobile-sales` remains untouched/offline.
- Supabase project `eyofuiyxalbehbqoaeny` remains ACTIVE_HEALTHY. The 18 Phase 06 migrations remain recorded, and Security Advisor returns zero lints. Read-only populated-row check still reports 0 organizations, 0 profiles, 0 reward accounts, 0 ledger entries, 0 redemptions, 0 point lots, 0 approvals, 0 reward audit events, 0 customer segments and 0 segment members. No production fixtures were created; no populated-ledger or concurrency claim is made.
- A temporary Supabase development branch is the safe available path for isolated populated fixtures. Branch creation requires explicit cost confirmation at **US$0.01344 per hour**; no branch has been created pending that approval. No production data has been written.
- No fresh API pytest/Ruff, portal typecheck/lint/build matrix or Expo typecheck/bundle export has been run on the current segment source. Historical CI baseline is not counted as current-source validation.
- **Phase 06 remains IN_PROGRESS; Phase 07 remains IN_PROGRESS.** Remaining DoD: isolated fixture branch approval and execution; earning/redemption/expiration/reversal/adjustment reconciliation and concurrency/idempotency; authenticated cross-tenant/private Realtime tests; fresh current-source CI/build/Expo checks; portal asset HTTP verification beyond build/gateway readiness.


## Live portal asset verification — 2026-11-21

- Live HTML was fetched for Website, Sales (`/portal`), Customer, Company, Distributor, Principal, Supervisor and Super Admin (`/admin`): all returned HTTP 200.
- CSS was fetched from the Website, Customer and Company portal roots, plus the nested Super Admin asset path: all returned HTTP 200 with `text/css; charset=UTF-8`.
- Page-specific Next.js JavaScript chunks were fetched for Website, Sales, Customer, Company, Distributor, Principal, Supervisor and Super Admin: all returned HTTP 200 with `application/javascript; charset=UTF-8`.
- The Company gateway uses `/admin` for Super Admin; `/super-admin` returns 404 and is not the deployed route. Distributor, Principal and Supervisor use their respective gateway path prefixes.
- This verifies production HTML and referenced static asset delivery. It does not claim a signed-in interaction/browser hydration test; no real user credentials were used.
 

## Execution continuation — no Supabase staging — 2026-11-21

The user explicitly directed that no Supabase staging/development branch or staging database tests be created. No staging branch was created and no test fixtures were inserted into production. Populated transaction verification with real accounts is deferred to the user's final integrated validation phase; this supersedes the earlier note requesting approval for a temporary Supabase branch.

Code integration continued on `main`:
- Added typed write contracts for Reward Program, Incentive Rule, Catalog, earning, adjustment and reversal; the shared API client now uses these instead of untyped `unknown` mutation bodies.
- Corrected PATCH semantics for Program, Rule and Catalog. The portal's status controls send partial bodies; FastAPI now merges them against tenant-owned persisted rows, validates the complete write schema, and serializes the read/merge/update under a row lock and transaction. Persisted timestamp values are normalized before schema validation.
- Customer Segment period validation now rejects timezone-naive timestamps. Segment report and evaluation endpoints have explicit response schemas. Segment status query values are constrained.
- Mirrored all nine Customer Segment action IDs in the shared TypeScript permission registry; the API action-matrix parity test had exposed the missing client entries.
- Native Expo SmartReward now supports participant cancellation of pending redemption and retains the same idempotency key when retrying a redemption after a network failure.
- Web SmartReward also retains redemption idempotency keys across retries.
- Super Admin SmartReward page now includes the cross-organization `PlatformSmartRewardOverview` as well as its tenant workspace. Customer, Sales, Supervisor, Company, Principal and Distributor pages already mount the shared SmartReward workspace.

Validation evidence:
- The API static workflow previously completed the full Python suite with **119 tests passing**, Python compileall passing, and Docker API image build succeeding. Ruff found two unused imports in the segment service; both were removed. A new API run on the final API changes is pending/in progress and includes additional partial-update merge tests.
- An earlier portal typecheck caught an incentive-event form state typed as generic string. It was corrected to the RewardRule event union and the select handler now narrows to that union. The final portal build matrix is running against the current source.
- Native Expo typecheck and Android bundle export passed in the earlier run; the current workflow is rerunning applicable mobile checks.
- Latest API code commit: `3c28491de66fd3fae80ca47dd808d7eb679306bd`. Latest Super Admin portal page commit: `8c4b711955427d29aed5bd55eeef9594f47fe9b0`. Subsequent CI runs are tracked against these current sources.

No new Supabase migration was needed for these API/client integration fixes; the existing Phase 06 migration set remains applied. Do not interpret this code-level checkpoint as populated-ledger, real-account concurrency, or authenticated cross-tenant runtime test evidence.

**Phase 06 remains IN_PROGRESS while current CI/build and latest-source Railway deployments complete. Phase 07 remains IN_PROGRESS.** Final real-account transaction and tenant authorization validation is deferred per the user's instruction.


## Latest API and portal build evidence — 2026-11-21

- Latest successful API source: `8bb17e30a94a1435da17a27383a14e52993643af`; Railway deployment `e3a20eb8-9dea-464d-b341-a53079fb2627` is SUCCESS, `/readyz` returned 200, and application startup completed.
- Live `/api/v1/openapi.json` returned 200 and exposes 28 SmartReward paths. Live PATCH request schemas are `RewardProgramPatch`, `RewardRulePatch`, and `RewardCatalogPatch`; Segment report/evaluation responses are explicitly typed.
- API CI on the latest API code: 122 tests PASS, compileall PASS, Ruff PASS, Docker API image build PASS. Web/Auth static workflow PASS. Expo typecheck and Android bundle export PASS.
- Portal build matrix on commit `3da8b210cbab1fe4ba8882757ef995b86a14ea18`: all 8 portal builds PASS (Website, Customer, Sales, Company, Distributor, Principal, Supervisor, Super Admin). Railway container/CSS runtime validation: Customer, Website and Company all PASS.
- Live route inspection found Next.js basePath prefixes duplicated in role-specific SmartReward page paths. Added basePath-aligned route aliases for Distributor, Principal, Supervisor and Super Admin. Sales route resolves at `/sales/portal/smart-reward`; existing prefixed routes remain compatible.
- Railway `salesx-company` deployment for route-alias source `3da8b210` is still QUEUED while earlier builds finish. The last live Company source is still `8c4b7119`; do not claim latest route aliases are live until deployment succeeds and the new single-prefix routes return 200 with CSS/JS assets.
- Website and Customer latest relevant deployments remain SUCCESS at source `c26f67ce`; API latest relevant deployment remains SUCCESS at source `8bb17e30`. No stale build or additional Railway service was created.

**Phase 06 remains IN_PROGRESS until the Company route-alias deployment and live route/static-asset verification finish. No Supabase staging branch or production fixture data was created; populated transaction/concurrency and real-account authorization validation remain deferred to final integrated testing per the user's direction.**

## 2026-11-21 final continuation — scoped SSE and Native fallback

- The SmartReward event stream now resolves tenant-wide audience only when a tenant-management role has `scope_type` `tenant` or `organization`; a branch-scoped company-admin assignment can no longer become tenant-wide. Supervisor event scope is limited to assigned branch IDs.
- Four unit tests cover tenant-owner scope, branch-supervisor scope, branch-scoped company-admin denial and catalog permission separation. They are included in the 134-test passing API suite.
- Native SmartReward no longer attempts direct Supabase user-topic Broadcast by default. `EXPO_PUBLIC_SMARTREWARD_PRIVATE_BROADCAST_ENABLED` must remain unset/false until the owner policy is applied and authenticated allow/deny subscriptions pass.
- The two live concurrency tests remain skipped in CI because no disposable local Supabase database is configured. The authenticated cross-tenant API integration tests remain an open Phase 06 gate.