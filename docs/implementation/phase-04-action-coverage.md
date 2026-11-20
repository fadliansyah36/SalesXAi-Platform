# Phase 04 — Active Action-to-API Coverage

Scope follows Master PRD v1.0 and Engineering Execution Master Plan v1.0: SmartTeam / Field Operations (employee/team context, visits, attendance/shifts, evidence, daily activity, targets, supervisor monitoring and Super Admin global overview). SmartOrder, SmartReward, Location Intelligence, Analytics, Workflow, AI and governance business workflows remain in their owning phases and are not fabricated here.

## Eight portal coverage

| Portal | Phase 04 actions | Integrated | Remaining | Scope decision |
|---|---:|---:|---:|---|
| Website | 0 | 0 | 0 | Public website; no SmartTeam business actions in Phase 04 |
| Customer Portal | 0 | 0 | 0 | Commerce belongs to Phase 05; no SmartTeam business actions |
| Sales Portal | 22 | 22 | 0 | Shared SmartTeamConsole with role-gated actions |
| Company Portal | 22 | 22 | 0 | Shared SmartTeamConsole with role-gated actions |
| Distributor Portal | 0 | 0 | 0 | Order/inventory/fulfillment belongs to Phase 05 |
| Principal Portal | 0 | 0 | 0 | Product/pricing/campaign views belong to Phase 05/06 |
| Supervisor Portal | 22 | 22 | 0 | Shared SmartTeamConsole with role-gated monitoring and management |
| Super Admin | 1 | 1 | 0 | Platform-scoped SmartTeam overview |
| **Total placements** | **67** | **67** | **0** | **23 unique FastAPI action contracts** |

The three tenant portals share the same component but remain distinct portal applications/routes and retain independent role/permission evaluation. The Super Admin action is platform-scoped and is not granted tenant-level access by the portal.

## Canonical action map

The companion TSV maps each active Phase 04 action placement to its UI handler, typed API client method, HTTP method/path, FastAPI router, application service, repository and permission contract. It contains 67 portal/action placements for 23 unique action IDs (22 tenant SmartTeam actions plus one platform overview action).

- SmartTeam UI: `components/smart-team/SmartTeamConsole.tsx`.
- Super Admin overview: `components/super-admin/SuperAdminPortalApp.tsx`.
- Typed client: `packages/api-client/src/index.ts`.
- API action registry and startup drift validator: `services/api/app/security/action_matrix.py`.
- FastAPI routers/services/repositories: `services/api/app/routers/smart_team.py`, `services/api/app/routers/admin.py`, `services/api/app/services/smart_team.py`, `services/api/app/repositories/smart_team.py`.

## Action completeness and enforcement

- All 22 SmartTeam action contracts are exposed by the shared typed API client and active SmartTeam UI handlers, including target update and the tenant-authorized event stream.
- Super Admin global overview is exposed through `listPlatformSmartTeamOverview` and `platform.smartteam.overview.read`, with `platform_permission:organization:read` enforced at the platform scope.
- The event stream is opened through `SalesXApiClient.subscribeSmartTeamEvents` and the same-origin Website Auth BFF proxy; it is no longer instantiated directly by the UI.
- Every registered FastAPI `/api/v1` route must have exactly one action contract and a matching `require_api_action` dependency (or an explicit BFF marker). FastAPI startup rejects missing, stale or miswired contracts.
- SmartTeam route dependencies enforce verified identity, tenant match, permission and resource ownership/scope in the application service/repository. UI gates are convenience only; server authorization remains authoritative.
- Active Phase 04 components do not perform direct Supabase business mutations. Reads and writes use the shared typed FastAPI client; Supabase Auth is isolated in the auth provider/BFF flow.

## Mobile Sales (Expo) — separate native channel

The native Sales app is not one of the eight Web portals. Its existing Phase 04 screen uses the same typed client for 12 operations: visit/attendance/activity/target reads, clock-in/out, visit check-in/out, activity creation, evidence upload, visit history and evidence listing. SQLite remains the offline outbox/cache, with idempotency and server reconciliation; it is not a second business database.

## Source inventory interpretation

The broad handler inventories count callback/event prop occurrences (including form inputs and UI-state-only handlers), not unique business actions. Their Phase 02/03/future-phase scope tags must not be interpreted as active Phase 04 API coverage. This Phase 04 matrix records only the active SmartTeam business action contracts and the four portal surfaces that actually consume them. Website, Customer, Distributor and Principal are explicitly not applicable to Phase 04 by the PRD phase sequence; their SmartOrder and reward workflows remain deferred.
