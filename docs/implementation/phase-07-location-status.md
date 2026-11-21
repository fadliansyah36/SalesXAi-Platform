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
