# SalesX-Ai — Four-Service Railway Deployment

## Production service map

| Railway service | Application | Public route |
|---|---|---|
| salesx-api | FastAPI | API contract routes and /readyz |
| salesx-website | Website | / |
| salesx-website | Sales Portal | /sales |
| salesx-customer | Customer Portal | / |
| salesx-company | Company Portal | / |
| salesx-company | Distributor Portal | /distributor |
| salesx-company | Principal Portal | /principal |
| salesx-company | Supervisor Portal | /supervisor |
| salesx-company | Super Admin | /admin |

## Build and runtime

All Railway services use repository root `.` as source/build context. This is required for Bun workspaces, `bun.lock`, shared packages and token generation.

Website group build:

```sh
npm install --global bun@1.4.5
bun install --frozen-lockfile
bun run --filter @salesx-ai/website build
bun run --filter @salesx-ai/sales-portal build
node infrastructure/scripts/portal-gateway.mjs website
```

Company group build:

```sh
npm install --global bun@1.4.5
bun install --frozen-lockfile
bun run --filter @salesx-ai/company-portal build
bun run --filter @salesx-ai/distributor-portal build
bun run --filter @salesx-ai/principal-portal build
bun run --filter @salesx-ai/supervisor-portal build
bun run --filter @salesx-ai/super-admin build
node infrastructure/scripts/portal-gateway.mjs company
```

The gateway runs the Next standalone servers on loopback-only ports and exposes only the Railway-assigned public port. The root app for each group owns `/api/health`; the gateway health response is 200 only if all child portal root routes respond and FastAPI is ready.

## Operations

- Railway health check: `/api/health`, port 3000. It verifies every portal root, `/portal` deep route, a real generated `/_next/static/*.js` asset for each portal, the root BFF CSRF route, and FastAPI readiness.
- Website watch paths include Website, Sales, root UI aliases/components, shared packages, lockfile and gateway script.
- Company watch paths include Company, Distributor, Principal, Supervisor, Super Admin, root UI aliases/components, shared packages, lockfile and gateway script.
- Customer remains its own single Next.js deployment.
- FastAPI remains its own Docker/FastAPI service with `/readyz`.
- Expo is a native EAS application and consumes the same FastAPI URL and Website Auth BFF origin; it is not a fifth Railway web service.
- The obsolete pre-existing Railway `@salesx-ai/mobile-sales` service is not part of the target and is not deleted by this ADR.


## Auth callback path preservation

The Website and Company group BFFs receive requests from their own portal paths on the same origin. Signup, password recovery and OAuth redirect URLs now preserve an allowlisted return prefix (`/sales`, `/distributor`, `/principal`, `/supervisor`, `/admin`, or root). The callback page validates that prefix before routing to the original portal's reset-password, invitation or landing route. Untrusted origins and arbitrary external return URLs are rejected.
