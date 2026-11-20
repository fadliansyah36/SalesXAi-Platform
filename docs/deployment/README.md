# Deployment Boundary Registry

Each app/service has an independent release boundary. A commit does not imply deployment. Do not claim a deployment until runtime root, environment schema, build/start commands, health/readiness behavior, target and rollback metadata are implemented and verified.

| Unit | Canonical path | Runtime | Phase | Boundary status |
|---|---|---|---:|---|
| Existing Web app / portals | Root `app/`, `components/`, `lib/` | Next.js 15 / React 19 | Existing | Existing; preserved in place |
| Native Sales | `apps/mobile-sales/` | React Native Expo | 00–01 foundation; features by domain phase | Runnable Expo SDK 58 app, native token adapter, EAS build profiles and independent app workspace established; no mobile binary deployed |
| Business API | `services/api/` | Python 3.12 / FastAPI | 02+ | Dockerfile + Railway config + `/healthz` and DB-backed `/readyz` present; production service not yet provisioned |
| Location worker | `services/location-worker/` | Python | 07 | Documented; runtime not yet implemented |
| Analytics worker | `services/analytics-worker/` | Python | 08 | Documented; runtime not yet implemented |
| Notification worker | `services/notification-worker/` | Python | 09 | Documented; runtime not yet implemented |
| Remotion renderer | `services/remotion-renderer/` | Node.js | 10 | Documented; runtime not yet implemented |
| AI worker | `services/ai-worker/` | Python | 11 | Reserved for final AI phase |
| Telegram service | `services/telegram-service/` | Python | 12 | Reserved for final Telegram phase |

Deploy only the changed unit to its own target. Inject secrets from the platform secret store; never expose service-role/provider credentials to Web or Expo. Record commit SHA, deployment artifact/ID, target, environment and rollback reference. No staging environment/deployment is required.

## Phase 04 Railway execution profile

### FastAPI service

| Setting | Value |
|---|---|
| Railway service name | `salesx-api` |
| Repository | `fadliansyah36/SalesXAi-Platform` |
| Branch | `main` |
| Root directory | `/services/api` |
| Config file | `services/api/railway.toml` |
| Builder | Dockerfile |
| Dockerfile | `services/api/Dockerfile` |
| Runtime | Python 3.12 / Uvicorn |
| Port | Railway `PORT` environment variable; container default 8080 |
| Health check | `/readyz` (requires valid `DATABASE_URL`) |
| Restart | `ON_FAILURE`, up to 10 retries |

The container installs the API package from `services/api/pyproject.toml`; no web portal, worker, Remotion or Telegram process is included.

### Existing Web portal deployment boundary

The current repository has one Next.js application rooted at `/` with routes for Website, Customer, Company, Sales, Distributor, Principal, Supervisor and Super Admin. It does **not** currently contain the eight independent Next.js roots listed in the Engineering Execution Master Plan (`apps/website`, `apps/customer-portal`, `apps/company-portal`, `apps/sales-portal`, `apps/distributor-portal`, `apps/principal-portal`, `apps/supervisor-portal`, `apps/super-admin`). The deployment boundary registry therefore remains the current root Web application. Creating eight Railway services pointed at the same root would duplicate one monolithic deployment and would not create independent application boundaries. Do not create those duplicate services or claim portal isolation until the source tree is split into independently buildable apps without importing another app's private source.

### Requested Railway target map

| Target service | Requested root | Current repository state | Deployment |
|---|---|---|---|
| `salesx-website` | `apps/website` | Missing; landing page currently in root app | Blocked by app boundary |
| `salesx-customer` | `apps/customer-portal` | Missing; route currently in root app | Blocked by app boundary |
| `salesx-company` | `apps/company-portal` | Missing; route currently in root app | Blocked by app boundary |
| `salesx-sales` | `apps/sales-portal` | Missing; route currently in root app | Blocked by app boundary |
| `salesx-distributor` | `apps/distributor-portal` | Missing; route currently in root app | Blocked by app boundary |
| `salesx-principal` | `apps/principal-portal` | Missing; route currently in root app | Blocked by app boundary |
| `salesx-supervisor` | `apps/supervisor-portal` | Missing; route currently in root app | Blocked by app boundary |
| `salesx-admin` | `apps/super-admin` | Missing; route currently in root app | Blocked by app boundary |
| `salesx-api` | `services/api` | Present; container config added | Awaiting correct Railway workspace |

### Environment variables — API

Populate only through Railway service variables/secrets. Never commit values.

Required for DB-backed production readiness:
- `DATABASE_URL` — TLS PostgreSQL connection string for project `eyofuiyxalbehbqoaeny`.
- `SUPABASE_SECRET_KEY` — server-only key used by private Storage/Auth Admin operations.
- `SUPABASE_URL` — fixed to `https://eyofuiyxalbehbqoaeny.supabase.co`.
- `SUPABASE_JWKS_URL` and `SUPABASE_JWT_ISSUER` — canonical values shown in `services/api/.env.example`.
- `APP_PUBLIC_URL` — exact HTTPS origin of the Web BFF that the API trusts.
- `CORS_ORIGINS` — comma-separated exact HTTPS origins; no wildcard.
- `SALESX_BFF_SHARED_SECRET` — same random value as the Web BFF, minimum 32 characters.

Optional/operational:
- `SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_JWT_SECRET` (legacy HS256 only), `SUPABASE_JWT_AUDIENCE`, DB pool/timeouts, request limit and rate-limit controls.
- SMTP variables (`SMTP_HOST`, `SMTP_PORT`, `SMTP_USERNAME`, `SMTP_PASSWORD`, `SMTP_FROM_EMAIL`) remain intentionally unset until credential handoff.

### Mobile EAS environment

The Expo `preview` and `production` profiles now select their corresponding EAS environments. Configure `EXPO_PUBLIC_AUTH_BFF_URL` and `EXPO_PUBLIC_SALESX_API_URL` in the EAS environment before producing a production binary. Do not put Supabase secret/service-role keys in Expo variables.

### Domain and deployment evidence

The requested custom domains are targets only. No domain has been attached, DNS ownership has not been verified, and TLS certificates have not been confirmed. Use Railway-generated domains until the correct workspace is connected and the user has confirmed domain ownership.

At the time of this record, the connected Railway identity resolves to an account named `Arrohmaniyah` with an unrelated project `heroic-expression`. No SalesXAi Railway service was created or modified. Reconnect the Railway connector to the intended SalesXAi workspace before provisioning or attaching domains.

### Rollback metadata

No Railway deployment ID or production rollback target exists yet. Last previously validated source baseline before the evidence-dedup hardening is commit `9e2775931859745e028f2bb2d9847764bbf750c2`; this is a source rollback candidate only, not a deployed artifact. Database changes are additive; do not roll back the migration after evidence records have been created.
