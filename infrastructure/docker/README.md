# SalesX-Ai Railway container builds

**Railway configuration:** the existing `salesx-website`, `salesx-customer`, and `salesx-company` services are configured to use the Dockerfile builder with the paths below. Their build context remains the monorepo root; no additional service is created.

All three Dockerfiles are built with the **repository root as the Docker build context**. Do not set a portal subdirectory as the Railway Root Directory: the applications consume the shared Bun lockfile, workspace packages, canonical design tokens and root App Router presentation source.

| Existing Railway service | Dockerfile path | Runtime |
|---|---|---|
| `salesx-website` | `infrastructure/docker/Dockerfile.website` | Website `/`, Sales `/sales/*` |
| `salesx-customer` | `infrastructure/docker/Dockerfile.customer` | Customer `/` |
| `salesx-company` | `infrastructure/docker/Dockerfile.company` | Company `/`, Distributor `/distributor/*`, Principal `/principal/*`, Supervisor `/supervisor/*`, Super Admin `/admin/*` |
| `salesx-api` | existing `services/api/Dockerfile` | FastAPI |

For each service, keep the monorepo root as the build context, select the listed Dockerfile path, expose application port `3000`, and use the Dockerfile's default command. Railway supplies `PORT`; the website/company gateway binds to it and starts each child Next standalone server on its private loopback port.

The build stage uses Node 22 and Bun 1.4.5, installs the one workspace lockfile, and builds each portal in its existing workspace. The runtime stage copies the complete Next standalone tree, including `.next/static`, generated CSS, JS, and public assets. Website and Company use the existing `portal-gateway.mjs`; no additional Railway service is created.

Do not set a service Root Directory to `apps/website`, `apps/sales-portal`, `apps/customer-portal`, or another child app. That would remove the shared workspace packages and root build context required by the canonical architecture.

After applying the Dockerfile path to the existing Railway service, deploy the service and verify its `/api/health` group check. That check includes each child app's root/deep route, JS asset, CSS asset, manifest and scoped service worker. Keep the previous healthy deployment available for rollback until the new deployment reports healthy.
