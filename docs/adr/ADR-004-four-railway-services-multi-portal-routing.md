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

- Railway root/build context remains the monorepo root for all four services.
- `salesx-api` uses the existing `services/api/Dockerfile` with root directory `/services/api`.
- `salesx-website` uses `infrastructure/docker/Dockerfile.website` and builds `@salesx-ai/website` plus `@salesx-ai/sales-portal` sequentially.
- `salesx-customer` uses `infrastructure/docker/Dockerfile.customer` and builds `@salesx-ai/customer-portal`.
- `salesx-company` uses `infrastructure/docker/Dockerfile.company` and builds `@salesx-ai/company-portal`, `@salesx-ai/distributor-portal`, `@salesx-ai/principal-portal`, `@salesx-ai/supervisor-portal`, and `@salesx-ai/super-admin` sequentially.
- Portal Dockerfiles use Node 22 and Bun 1.4.5, install the shared workspace lockfile, and copy the complete Next standalone runtime tree, including generated `.next/static` CSS/JS and shared/app public assets.
- Each standalone Next server binds only to loopback on its own internal port. The gateway binds to Railway's `PORT` on `0.0.0.0`.
- The gateway preserves request path, query string, cookies, authorization, request body, forwarded origin headers and WebSocket upgrades.
- `GET /api/health` is the group health contract. It checks each grouped portal's canonical base route, `/portal` deep route, generated JavaScript and CSS assets, manifest and scoped service worker; it also calls the root portal's existing API-dependent health route, which in turn checks FastAPI `/readyz`.
- All services retain the root monorepo build context, shared Bun lockfile, packages and canonical tokens. No new database, Supabase project or portal-specific backend is introduced.

## Security and operations

- FastAPI remains the only business mutation and authorization boundary. Group routing does not merge role permissions or tenant scopes.
- Website, Customer and Company remain the only browser origins in API CORS. Path prefixes are not separate origins.
- Each grouped service's `APP_PUBLIC_URL` must match its own exact Railway Default Domain. Website is the mobile Auth BFF origin.
- Provider credentials remain unset until real deployment secrets are supplied. No wildcard credentialed CORS or client-side service-role key is permitted.
- The gateway fails health checks if a child portal process, JavaScript/CSS asset delivery or FastAPI readiness is unavailable; Railway can retain its prior healthy deployment until the replacement passes its health check.
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


## Production Dockerfile and CSS validation addendum — 2026-11-21

The three existing portal services are configured to use the monorepo-root Dockerfiles listed above. Their Railway service root directory remains `.`; no portal-specific Railway service was added. The API remains on its existing Dockerfile service. Website and Company retain the existing gateway start commands, and all three portal services use `/api/health` with deployment overlap/draining to avoid replacing a healthy release before the new group passes.

A production-container CI workflow builds Website, Customer and Company images and probes every app's canonical route and emitted CSS. The verified group results are:
- Website and Sales: CSS links and token stylesheet served through `/` and `/sales`.
- Customer: CSS links and token stylesheet served through `/`.
- Company, Distributor, Principal, Supervisor and Super Admin: CSS links and token stylesheet served through their respective root/basePath routes.

This validation confirms the standalone container includes and serves the canonical SalesX design-token CSS. Railway's latest deployments remain queued until the deployment system processes the latest source; do not infer production success from CI container success.
