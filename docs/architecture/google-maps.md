# Google Maps Foundation

Status: **code foundation implemented; credential activation pending**.

SalesX-Ai owns operational GPS capture and route history. Google Maps is a replaceable provider for map display and optional route calculation; it is not the source of operational location history or a way to import a user's private Google Maps Timeline.

## Provider boundary

- Provider-neutral coordinate, marker, viewport/bounds, route, polygon, map-event, feature-flag and runtime configuration contracts live in \`packages/maps/src/index.ts\`. The package also exposes Web/Native provider resolution, GeoJSON conversion, encoded-polyline decoding and distance calculation.
- Web renderer: \`components/location/GoogleMapsCanvas.tsx\`, using the existing \`@vis.gl/react-google-maps\` dependency.
- Native renderer: \`apps/mobile-sales/src/location/LocationMap.tsx\`, using \`react-native-maps\` with \`PROVIDER_GOOGLE\`.
- FastAPI: \`GET /api/v1/maps/config\` reports safe readiness flags; \`POST /api/v1/organizations/{organization_id}/maps/routes/compute\` uses the server-only Routes API adapter. The server key is modeled as a Pydantic SecretStr in \`services/api/app/config.py\`; no raw secret is returned by the config endpoint.
- Operational GPS, sessions, route history and geofences remain sourced from Supabase/PostGIS through permission-checked FastAPI endpoints.

## Environment contract

| Variable | Surface | Purpose |
|---|---|---|
| \`NEXT_PUBLIC_GOOGLE_MAPS_API_KEY\` | Web build | Browser Maps JavaScript key, restricted to production HTTP referrers |
| \`NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID\` | Web build | Optional Google Cloud map ID |
| \`GOOGLE_MAPS_ANDROID_API_KEY\` | Expo build config | Android Maps SDK key, restricted by package name and signing SHA-1 |
| \`GOOGLE_MAPS_IOS_API_KEY\` | Expo build config | iOS Maps SDK key, restricted by bundle identifier |
| \`EXPO_PUBLIC_GOOGLE_MAPS_ENABLED\` | Expo public build flag | Set to \`true\` only after native platform keys are configured |
| \`GOOGLE_MAPS_SERVER_API_KEY\` | FastAPI only | Server-side Routes API key; never expose to Web or Expo |
| \`GOOGLE_MAPS_LANGUAGE\` | Runtime config | Optional language override; defaults to \`id\` |
| \`GOOGLE_MAPS_REGION\` | Runtime config | Optional region override; defaults to \`ID\` |

No key, placeholder credential or billing configuration is committed. Browser and native SDK keys are public client credentials and must be restricted to their respective application identities. The server key is a secret and must be injected only into FastAPI.

## No-key behavior

- Web and Native components render explicit configuration fallbacks; authorized coordinates remain visible.
- Native tracking, offline queue, location ingestion, route history and geofence processing do not depend on map tiles.
- FastAPI route computation returns \`maps_provider_not_configured\` until \`GOOGLE_MAPS_SERVER_API_KEY\` is configured.
- No component substitutes mock map data or claims Google map tiles are active.

## Activation sequence

1. Enable billing and only the required Maps SDKs plus Routes API if route calculation is required.
2. Create separate restricted browser, Android, iOS and server keys.
3. Configure each variable in its corresponding existing service/build environment.
4. Set \`EXPO_PUBLIC_GOOGLE_MAPS_ENABLED=true\` only when native keys are present, then rebuild the Expo binary.
5. Verify production referrer/package/bundle restrictions, map rendering, route calculation and quotas.

Do not add a Google OAuth secret or reuse the server Routes key in a client bundle.

## Role exposure and least-privilege boundary

- Sales users capture and view their own consented current location and local route preview in the Native Expo app.
- Supervisors receive live location and route history only for their assigned branch/team/territory scope.
- Company Admin and Tenant Owner receive tenant-level operational location views under their assigned organization permissions.
- Distributor and Principal roles are not granted raw employee GPS access by the current Phase 07 permission matrix.
- Super Admin receives platform governance/configuration capabilities, not raw tenant employee location data by default. Any future platform-wide location access requires a separate explicit permission and audit contract.
- Web and Native renderers emit typed marker, route, geofence and viewport events. Supervisor/Company consume authorized map events and route replay through the typed FastAPI client. The UI must continue to enforce role-specific data scope at the FastAPI boundary.