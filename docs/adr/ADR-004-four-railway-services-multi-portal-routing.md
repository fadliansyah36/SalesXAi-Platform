# ADR-004 — Four Railway Services with Multi-Portal Path Routing

- Status: Accepted by explicit project-owner instruction
- Date: 2026-11-20
- Scope: Production deployment topology for the eight SalesX-Ai Web portals

## Context

The Master PRD and Engineering Execution Master Plan originally describe an independent deployment target for each app. The project owner has explicitly selected a four-service Railway production topology to avoid provisioning eight separate portal services while preserving eight independent app workspaces.

## Decision

Use exactly four Railway services:

| Service | Public routes |
|---|---|
| `salesx-api` | FastAPI `/api/v1/*`, `/readyz` |
| `salesx-website` | Website landing `/`; Sales Portal `/sales/*` |
| `salesx-customer` | Customer Portal `/` |
| `salesx-company` | Company `/`; Distributor `/distributor/*`; Principal `/principal/*`; Supervisor `/supervisor/*`; Super Admin `/admin/*` |

Each portal remains a separate Bun workspace and Next.js application with its own App Router, layout, Next config, build target and standalone server. Website and Company production containers run a Node HTTP gateway that forwards the original path to the matching standalone server. Child apps use Next.js `basePath` for non-root routes. No portal is implemented as a redirect to another host or by copying its source into another app.

## Runtime contract

- Railway root/build context remains the monorepo root.
- Website service builds `@salesx-ai/website` and `@salesx-ai/sales-portal` sequentially; Company service builds `@salesx-ai/company-portal`, `@salesx-ai/distributor-portal`, `@salesx-ai/principal-portal`, `@salesx-ai/supervisor-portal`, and `@salesx-ai/super-admin` sequentially.
- Each standalone Next server binds only to loopback on its own internal port. The gateway binds to Railway's `PORT` on `0.0.0.0`.
- The gateway preserves request path, query string, cookies, authorization, request body, forwarded origin headers and WebSocket upgrades.
- `GET /api/health` is the group health contract. It checks all grouped portal roots and calls the root portal's existing API-dependent health route, which in turn checks FastAPI `/readyz`.
- All services retain the root monorepo build context, shared Bun lockfile, packages and canonical tokens. No new database, Supabase project or portal-specific backend is introduced.

## Security and operations

- FastAPI remains the only business mutation and authorization boundary. Group routing does not merge role permissions or tenant scopes.
- Website, Customer and Company remain the only browser origins in API CORS. Path prefixes are not separate origins.
- Each grouped service's `APP_PUBLIC_URL` must match its own exact Railway Default Domain. Website is the mobile Auth BFF origin.
- Provider credentials remain unset until real deployment secrets are supplied. No wildcard credentialed CORS or client-side service-role key is permitted.
- The gateway fails health checks if a child portal process or FastAPI readiness is unavailable; Railway can retain its prior healthy deployment until the replacement passes its health check.
- Rollback is to the prior successful deployment of the affected Railway service.

## Consequences

- Each portal is still independently buildable and has its own source/configuration, but portals in a group share one Railway deploy/release boundary and replica lifecycle.
- A failure in one grouped child makes the group unhealthy; this is intentional to avoid silently serving a partial portal group.
- Changes to any grouped portal or shared UI/runtime dependency must trigger the corresponding group deployment.


## Route and BFF readiness gate

The gateway `/api/health` endpoint checks, for every child app, its basePath root, its `/portal` deep route and one generated JavaScript asset under its own `/_next/static` namespace. It also checks the root BFF CSRF endpoint and the root app's FastAPI-dependent health route. This catches missing child processes, basePath mismatches and static-asset path collisions before Railway marks the group healthy.

Auth callback redirects preserve the same-origin portal prefix and accept only the allowlisted portal paths. A callback from Sales returns to `/sales`; Distributor, Principal, Supervisor and Super Admin return to their respective path prefixes. Recovery and invitation routes are scoped the same way.


## PWA isolation and cache safety

Grouped portal PWAs use distinct manifest IDs, start URLs, scopes and service-worker registrations. The service worker derives a per-scope cache namespace and caches only static assets, icons and the manifest. API, auth and dynamic HTML responses are excluded to avoid cross-portal cache collisions and caching authenticated tenant data. Gateway readiness verifies each app's manifest and scoped service-worker endpoint.
