# FastAPI Google Maps adapter

All Google Maps server calls are isolated behind the FastAPI provider boundary. Browser and Native SDKs must not receive the server credential.

## Endpoints

- `GET /api/v1/maps/config` — returns provider/readiness metadata and whether server-side route calculation is enabled. It never returns a credential.
- `POST /api/v1/organizations/{organization_id}/maps/routes/compute` — validates the authenticated tenant context and `location.history.read` permission, then calls Google Routes API through the server adapter.

If `MAPS_PROVIDER` is not `google` or `GOOGLE_MAPS_SERVER_API_KEY` is absent, route computation fails closed with `maps_provider_not_configured`. Do not add a placeholder key or fall back to direct browser-to-server credential exposure.

## Environment separation

- Server-only: `GOOGLE_MAPS_SERVER_API_KEY`, `MAPS_PROVIDER`.
- Web public/build-time: `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`, `NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID`, `NEXT_PUBLIC_GOOGLE_MAPS_ENABLED`.
- Native build-time: `GOOGLE_MAPS_ANDROID_API_KEY`, `GOOGLE_MAPS_IOS_API_KEY`, `EXPO_PUBLIC_GOOGLE_MAPS_ENABLED`.

Restrict browser keys by HTTP referrer and Android/iOS keys by package/bundle identifier and signing certificate. Restrict the server key to the required Routes API and server egress. No credentials are committed to this repository.