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

No FastAPI location router/application service/repository, OpenAPI endpoints, generated shared client methods, Expo background task/outbox, portal map/history integration, private Realtime authorization policy, geofence evaluator, route reconstruction worker, or authenticated tenant-isolation evidence is claimed complete in this checkpoint.

Phase 06 SmartReward remains IN_PROGRESS. Its populated ledger fixture/reconciliation, concurrency/idempotency and authenticated cross-tenant/private-Realtime gates remain separate open work. Phase 07 is authorized to proceed in parallel by the latest execution decision.
