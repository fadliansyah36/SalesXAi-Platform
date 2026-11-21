# PHASE 07 — REALTIME LOCATION & ROUTE HISTORY STATUS

**Status: IN_PROGRESS — implementation is substantially integrated; owner authorization and runtime validation remain open.**

## Applied migration ledger — 7/7 Phase 07 migrations

| Version | Migration |
|---|---|
| 20261121082433 | p07_location_intelligence_foundation |
| 20261121083536 | p07_location_live_projection_geofence_realtime |
| 20261121084148 | p07_location_role_permission_bindings |
| 20261121084817 | p07_location_and_segment_fk_indexes |
| 20261121085755 | p07_location_assignment_and_device_integrity |
| 20261121100848 | p07_location_geofence_ordering_route_replay |
| 20261121110006 | p07_location_tracking_sessions_require_shift |

## Database and security

- Tracking sessions, GPS points, latest-position projection, geofences, geofence presence/events, route summaries and access audit are in the existing Supabase project.
- RLS is enabled for the location tables; client table grants are denied. API operations use the FastAPI service connection.
- Composite tenant/device/session/profile/assignment foreign keys and route replay/time-series indexes are applied. Migration `20261121110006` makes a valid active SmartTeam shift a required location-session parent, matching the Native tracking lifecycle.
- Latest-position projection is monotonic. Applied migration `20261121100848` prevents late offline points from rewinding geofence presence or generating out-of-order transitions. All points remain in history and route reconstruction remains timestamp ordered.
- Geofence listing is scoped to active tenant, branch, territory or team assignments. Geofence reads, writes and live stream subscriptions are audited.
- Security Advisor: 0 security lints. Performance Advisor: 0 unindexed-FK lints; 270 unused-index notices are informational on the low-traffic/new schema.

## FastAPI and typed API integration

- Router: `services/api/app/routers/location.py`.
- Application service: `services/api/app/services/location.py`.
- Repository: `services/api/app/repositories/location.py`.
- Schemas: `services/api/app/schemas/location.py`.
- Typed contracts/client and Python/TypeScript action matrices include session lifecycle, point ingestion, live projection, time-bounded history, route summaries, route replay, geofence CRUD/events and private SSE.
- Key endpoints:
  - `POST /api/v1/organizations/{organization_id}/location/sessions`
  - `PATCH /api/v1/organizations/{organization_id}/location/sessions/{session_id}`
  - `POST /api/v1/organizations/{organization_id}/location/sessions/{session_id}/points`
  - `GET /api/v1/organizations/{organization_id}/location/live`
  - `GET /api/v1/organizations/{organization_id}/location/history`
  - `GET /api/v1/organizations/{organization_id}/location/routes`
  - `GET /api/v1/organizations/{organization_id}/location/routes/{route_id}/replay`
  - `GET/POST /api/v1/organizations/{organization_id}/location/geofences`
  - `GET /api/v1/organizations/{organization_id}/location/geofence-events`
  - `GET /api/v1/organizations/{organization_id}/location/events` (permission-checked SSE with replay/reconnect)
- Route replay is paginated, time-window bounded, profile-scope checked and audit logged. Supervisor/Company map workspace supports route selection and time scrubbing.
- `POST /api/v1/maps/places/search` now centralizes Google Places calls in FastAPI; all portal `/api/maps/places-search` paths bridge through the authenticated BFF and cannot call Google directly.

## Native Expo tracking

- Expo TaskManager background task and Location APIs capture only after explicit in-app consent plus OS foreground/background permission.
- Tracking binds to verified user, organization, registered device and session. Stop/pause and revocation are explicit lifecycle states.
- SQLite outbox stores actor/org/session/device/schema context, deduplicates client point IDs, retries with backoff and syncs through the typed FastAPI client.
- Native map shows current location and the local captured route; offline capture does not depend on Google map tiles.
- Android foreground notification and OS permission configuration are present. Physical-device background suspension, battery optimization, permission revocation and offline resume have not been runtime-verified.

## Portal surfaces and role boundaries

- Sales: consented own-device capture and local route preview in Native Expo.
- Supervisor: assigned branch/team/territory live map, geofence events and route history/replay.
- Company Admin/Tenant Owner: tenant-scoped operational map and reporting.
- Distributor and Principal do not receive raw employee GPS under the current permission matrix. Super Admin receives governance/configuration, not raw tenant employee GPS by default.
- Existing portal UI, design tokens and route structure are preserved.

## Realtime authorization gate

- Database triggers emit minimal location Broadcast and PostgreSQL notification payloads.
- FastAPI SSE remains the active permission-checked and audited delivery path.
- Owner policy is prepared at `supabase/owner-pending/20261121100000_location_realtime_messages_owner_policy.sql`, but is **not active**. `realtime.messages` is owned by `supabase_realtime_admin`; the connected database principal cannot assume that owner role.
- Do not claim private Supabase Location subscriptions until the project owner applies the policy and authenticated tenant/branch/team/territory allow/deny tests pass.

## Google Maps foundation

- Shared provider-neutral contracts in `packages/maps/src/index.ts`: coordinate/location, markers, viewport/bounds, polylines, geofence polygons, map events, feature flags, GeoJSON conversion, encoded-polyline decoding, distance and provider adapters.
- Web renderer: `components/location/GoogleMapsCanvas.tsx` using existing `@vis.gl/react-google-maps`.
- Native renderer: `apps/mobile-sales/src/location/LocationMap.tsx` using `react-native-maps` with `PROVIDER_GOOGLE`.
- FastAPI provider config, Places and Routes adapters: `GET /api/v1/maps/config`, `POST /api/v1/maps/places/search`, `POST /api/v1/organizations/{organization_id}/maps/routes/compute`. Places search uses the authenticated `/api/backend` BFF bridge and the server-only Places key.
- Environment schema validates `MAPS_PROVIDER`, locale, server-only `GOOGLE_MAPS_SERVER_API_KEY` (Routes) and `GOOGLE_MAPS_PLACES_API_KEY` (Places); client browser/Android/iOS keys remain separate.
- No API key, map ID, billing credential or fake placeholder is committed. Map tiles, Places search and server route calculation remain inactive until restricted credentials are supplied. `MapsRuntimeStatus` exposes only provider/readiness flags, never secret values.

## Verified rollback-only database lifecycle fixture

- `supabase/tests/phase07_location_lifecycle.sql` was executed against the bound Supabase project in a single rollback-only transaction using synthetic Auth/tenant/branch/team/territory/shift/device/session/geofence fixtures.
- The database accepted four unique GPS points, ignored the duplicate client point ID, preserved the newest live position when an older offline point arrived, and retained chronological geofence state.
- Geofence event sequence validated `enter`, `dwell`, `exit` (3 events); route reconstruction produced a non-empty route with 4 points and positive distance.
- Post-rollback verification returned zero fixture Auth users, organizations, location sessions and GPS points. No production records were written.

## Remaining Definition-of-Done gates

1. Owner-level Location Realtime policy application and authenticated tenant/branch/team/territory subscription authorization.
2. Physical Expo device lifecycle verification for foreground/background, OS suspension, permission revocation and offline resume/sync.
3. Latest-source four-service Railway production deployment and runtime/UI verification.
4. Final Google Maps credential/billing activation (not required for code foundation readiness).

**Phase 07 remains IN_PROGRESS.** Database lifecycle, API, portal build, Expo bundle and provider-neutral Maps foundation are implemented; owner authorization, physical-device evidence and production release remain open.


## Latest integration and production checkpoint — 2026-11-21

- The API/typed-client route replay integration includes GET /api/v1/organizations/{organization_id}/location/routes/{route_id}/replay, bounded time-window validation, tenant/profile scope checks, audit logging, and a time-scrubbable map replay control in the shared LocationWorkspace.
- Geofence listing is scoped by active tenant/branch/territory/team assignments. The applied chronological-state migration keeps older offline points in history without rewinding live geofence state.
- GitHub API/Expo workflow 44899483509 passed on code snapshot 27dc32b5984fac315a4027aecfe3ca3f8e3217d6; API static suite passed 164 tests and the Expo mobile build passed.
- All four designated Railway services subsequently deployed successfully from branch main at source 27dc32b5984fac315a4027aecfe3ca3f8e3217d6. Production health checks verified API readiness and all eight portal groups' root/deep-link, JavaScript, CSS, manifest and service-worker responses as HTTP 200.
- Google Maps remains provider-neutral and keyless: Web/Expo renderers, FastAPI config/route/Places adapters, feature flags and fallbacks are ready; Google map tiles, Routes and Places calls remain disabled until restricted credentials and billing are supplied.

## Remaining Definition-of-Done gates

1. Official owner-level application and authenticated tenant/branch/team/territory allow/deny validation for the Location private Realtime policy.
2. Physical Expo device lifecycle evidence for background execution, OS suspension, permission revocation and offline resume/sync.

**Phase 07 remains IN_PROGRESS.** The code, migrations, API, Expo build and portal integration are implemented; owner policy authorization and physical-device runtime evidence remain open.


## Final deployment alignment — 2026-11-21

Latest successful runtime source for the four designated Railway services is 833235184befbc2ed7ac41d161d07ab0d6fc188e. All services are connected to repository branch main without a pinned commit. The app-code snapshot is 27dc32b; subsequent commits 833235 and 261b are documentation-only. Railway watch patterns correctly skip docs-only changes, so no application code is omitted from the runtime.

- salesx-api deployment bb101799-8d7c-46bd-bf4b-ac1d864da8af — SUCCESS
- salesx-website deployment 491a7417-3825-418e-b319-1cfdd850405a — SUCCESS
- salesx-customer deployment 760c94dc-9890-452c-ac1b-a14397bc6852 — SUCCESS
- salesx-company deployment 42af78b1-8aaa-4c5b-b3d1-8232708b0822 — SUCCESS

Live API readiness and all eight portal-group health probes returned healthy; no new service or database was created.


## Execution reconciliation — 2026-11-21

This addendum reconciles Phase 07 gates against the canonical Engineering Execution Master Plan and root AGENTS.md.

- The canonical plan explicitly excludes real-world/field testing as a phase prerequisite. Physical-device observations (OS suspension, battery optimization, permission revocation and offline resume) remain documented operational caveats, but are not an additional Phase 07 acceptance gate. The implementation retains explicit consent, foreground/background permission handling, visible tracking state, shift-bound session ownership, offline outbox, idempotent ingestion and sync recovery.
- The current source contains the Expo Location/TaskManager implementation, SQLite outbox, FastAPI ingestion/history/replay/geofence endpoints, PostGIS schema, role-scoped map workspace and provider-neutral Google Maps adapters. The code snapshot validated by API/Expo workflow 44899483509 is 27dc32b5984fac315a4027aecfe3ca3f8e3217d6.
- The seven Phase 07 migrations are present in the live Supabase ledger through 20261121110006. No duplicate schema migration is justified by the reviewed scope.
- The four designated Railway services have successful deployments from the code-equivalent source 27dc32b5984fac315a4027aecfe3ca3f8e3217d6, with subsequent documentation-only commits. Latest successful deployment IDs are recorded in phase-status.md. The separate pre-existing @salesx-ai/mobile-sales Railway service is not one of the four release services and is not a substitute for the Expo/EAS mobile build.
- The sole Phase 07 DoD blocker is official owner-level application of supabase/owner-pending/20261121100000_location_realtime_messages_owner_policy.sql followed by authenticated subscription allow/deny validation. Until then, permission-checked FastAPI SSE remains the active delivery path.
- Google Maps Foundation is READY FOR FINAL CREDENTIAL ACTIVATION: shared contracts/adapters, Web and Expo renderers, FastAPI config/Places/Routes adapters, environment separation and keyless fallback are implemented. Google tiles/Places/Routes remain disabled until real restricted credentials, map ID where required, and billing are supplied.

**Reconciled Phase 07 status: IN_PROGRESS only because the owner-level private Realtime authorization gate is still pending.** No physical-device field test, staging deployment, manual real-user login, or Product Owner Acceptance is required by canonical execution governance.


## Latest live gate recheck — 2026-11-21

- Live realtime.messages owner is still supabase_realtime_admin; connected SQL principal cannot assume that role. The prepared Location policy is not active.
- Existing database lifecycle fixture proves SQL-level point deduplication, monotonic latest position, geofence enter/dwell/exit, and chronological route replay in a rollback-only transaction. It does not prove authenticated private Realtime subscription authorization.
- Phase 07 remains IN_PROGRESS solely for the owner-authorized private Realtime policy and authenticated tenant/team/branch/territory allow/deny evidence. FastAPI permission-checked SSE remains active.
