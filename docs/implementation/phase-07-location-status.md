# PHASE 07 CURRENT EXECUTION SNAPSHOT — 2026-11-21

**Status: IN_PROGRESS — implementation is open; not complete.**

## Google Maps foundation — 2026-11-21 continuation

- Shared provider-neutral contracts: `packages/maps/src/index.ts` (coordinates, markers, polylines, polygons, runtime config, GeoJSON conversion and Haversine distance).
- Web adapter: `components/location/GoogleMapsCanvas.tsx`, using existing `@vis.gl/react-google-maps`; `LocationWorkspace` now renders through the adapter.
- Native Expo adapter: `apps/mobile-sales/src/location/LocationMap.tsx`, using `react-native-maps@1.29.11` and `PROVIDER_GOOGLE`. Expo config injects separately restricted Android/iOS keys only when configured. The tracking control renders current device coordinates after the consented tracking session is active.
- FastAPI provider boundary: `GET /api/v1/maps/config` and `POST /api/v1/organizations/{organization_id}/maps/routes/compute`. Route computation uses only `GOOGLE_MAPS_SERVER_API_KEY` and fails closed when absent. Shared API contracts/client include route request/response.
- Geofence list responses now include boundary GeoJSON; Web map overlays render authorized geofences and reconstructed route polylines.
- Credential contract and activation sequence are documented in `docs/architecture/google-maps.md`. No fake key or map ID is used; no map tiles are claimed active.
- Owner-gated Location Realtime SQL is prepared at `supabase/owner-pending/20261121100000_location_realtime_messages_owner_policy.sql` and is not applied. It filters private Broadcast subscriptions by organization, authenticated membership, location permission and branch/team/territory assignment.
- Google Maps Foundation is code-ready for final credential activation, pending final GitHub CI evidence and actual credential activation.
## Applied database changes
- 20261121082433_p07_location_intelligence_foundation: tracking sessions, points, geofences, geofence events and route summaries.
- 20261121083536_p07_location_live_projection_geofence_realtime: latest-position projection, geofence presence state, access audit, PostGIS route/geofence processing, private Broadcast and server notification.
- 20261121084148_p07_location_role_permission_bindings: Sales, Supervisor, Company Admin and Tenant Owner location permissions.
- 20261121084817_p07_location_and_segment_fk_indexes: indexes for Phase 06/07 foreign keys flagged by Performance Advisor.
- 20261121085755_p07_location_assignment_and_device_integrity: composite session/user/device ownership constraints, branch/team/territory/shift assignment foreign keys and supporting indexes.

## Implemented code and integration
- FastAPI router: services/api/app/routers/location.py.
- Application service: services/api/app/services/location.py.
- Persistence boundary: services/api/app/repositories/location.py.
- Request schemas: services/api/app/schemas/location.py.
- Endpoints: session start/update; GPS batch ingestion; live positions; time-bounded paginated history; route summaries; geofence create/list; geofence event history; private SSE location events.
- Device ownership: session start requires the device ID registered to the current authenticated session. Points are accepted only for the session owner and matching device. Composite database foreign keys now enforce the organization/session/user/device relationship for points and latest-position projection.
- GPS points are coordinate/accuracy/source/time validated, idempotent by session + client point ID, and written by FastAPI.
- Latest position is maintained by a database trigger. Route summaries are reconstructed by PostGIS. Geofence enter/exit/dwell events are evaluated from accepted points.
- Location reads are tenant- and Sales-profile-scope checked; privileged map/history reads are audited. Latest-position assignments are constrained to the same organization’s branch, team and territory; tracking shifts are constrained to the same organization.
- Shared contracts and typed API client include session, ingestion, live, history, route, geofence and event APIs.
- Expo uses a visible consent control, OS foreground/background permissions, authenticated device identity, background location task, SQLite offline outbox, schema version, actor/device/tenant/session context, deduplication, retry/backoff and sync-state tracking.
- Supervisor live_map and route_replay tabs and Company gps_live and gps_history tabs use the shared LocationWorkspace and FastAPI.
- Four named Railway services are preserved. An additional @salesx-ai/mobile-sales Railway service already exists in the connected Railway project; it was not created or removed by this change.

## Realtime authorization limitation
The trigger emits a private Broadcast to location:{organization_id}:live and a PostgreSQL notification. The owner-gated policy source is prepared, but the current database connector principal cannot create a policy on realtime.messages because that table is owned by supabase_realtime_admin. The permission-checked FastAPI SSE endpoint remains the available live-event delivery path until the project owner applies the policy.

## Remaining implementation/verification gates
1. Add the owner-authorized realtime.messages policy for location channels and verify subscription isolation.
2. Complete native Android/iOS build and background/foreground lifecycle verification on an isolated test device with explicit consent.
3. Verify geofence enter/exit/dwell edge cases, out-of-order offline batches, and route reconstruction under batch ingestion.
4. Verify live-map and route-history UI builds for Supervisor and Company; configure/confirm the existing Maps key in deployment environment if map tiles are required.
5. Verify the latest Railway API and mobile deployment builds. No production success is claimed while deployments remain queued or build evidence is unavailable.

Phase 07 must remain IN_PROGRESS until all lifecycle, authorization, offline-sync, portal and deployment gates are evidenced.

---

# Phase 07 — Realtime Location & Route History

Status: IN_PROGRESS — schema foundation applied; API/native/portal slices remain open.

Target repository: `fadliansyah36/SalesXAi-Platform` (`main`)  
Supabase project ref: `eyofuiyxalbehbqoaeny`

## Applied foundation

Migration: `20261121082433_p07_location_intelligence_foundation`  
Migration source commit: `8958af8e7be464f2b2642ea07866905fb5937aa7`  
Migration application: SUCCESS, confirmed by Supabase SQL readback.

Objects:
- `location_tracking_sessions`: consent-bound lifecycle, user, device, sales profile and optional shift.
- `location_points`: GPS/network/fused points, coordinate and accuracy constraints, recorded/received timestamps, device attribution and client idempotency key.
- `location_geofences`: tenant-owned outlet/territory/custom Polygon boundaries and accuracy/dwell settings.
- `location_geofence_events`: deduplicated enter/exit/dwell events linked to point/session/geofence.
- `location_route_summaries`: per-session/day route geometry, point count and distance projection.

PostGIS geography/geometry types and GiST indexes are installed. All five tables have RLS enabled and explicit deny policies for anon/authenticated. Table privileges are granted only to server-side service_role. Seven location permission catalog keys are present.

## Required next vertical slices

1. FastAPI session lifecycle, consent verification, device ownership, batch ingestion and idempotent point repository.
2. Route reconstruction and time-window history queries with tenant/role checks.
3. Geofence evaluation worker/service, event deduplication and audit.
4. Private Realtime Broadcast topic authorization and minimal event payloads.
5. Shared API contracts/client for Web and Expo.
6. Native Expo Location + TaskManager capture, visible consent/status, shift/session-bound tracking, offline outbox, retry/backoff and deduplication.
7. Existing Supervisor/Company map and route-history UI connected to FastAPI; preserve existing design system and route layout.
8. Role/territory/team/outlet-scoped reporting, pagination and retention controls.

## Security and privacy invariants

- Tracking starts only after explicit device permission and a visible user consent record tied to a policy version.
- Tracking is bound to an authenticated user, registered device, organization, sales profile and optional active shift.
- Stop/pause/revoke ends collection according to the session lifecycle; no hidden background tracking.
- Never trust client-supplied organization/user identity; derive from verified FastAPI principal and server-side assignment lookup.
- Realtime carries minimal identifiers/status only; clients fetch authorized detail through FastAPI.
- Do not expose direct client table grants or service-role credentials.

## Not yet implemented / not claimed

The earlier initial checkpoint below is historical and is superseded by the current execution snapshot and Google Maps continuation above. Remaining gates are owner-level Realtime policy application and subscription isolation, device-level background lifecycle verification, offline/out-of-order batch verification, geofence and route reconstruction edge-case validation, and production deployment evidence.

Phase 06 SmartReward remains IN_PROGRESS. Its populated ledger fixture/reconciliation, concurrency/idempotency and authenticated cross-tenant/private-Realtime gates remain separate open work. Phase 07 is authorized to proceed in parallel by the latest execution decision.
