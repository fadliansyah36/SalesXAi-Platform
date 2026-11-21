# Portal origin and route map

The deployment uses the existing four Railway services only.

| Portal | Origin | Public path |
|---|---|---|
| Landing / Sales | `NEXT_PUBLIC_SALESX_WEBSITE_URL` | `/` / `/sales/portal` |
| Customer | `NEXT_PUBLIC_SALESX_CUSTOMER_URL` | `/` |
| Company | `NEXT_PUBLIC_SALESX_COMPANY_URL` | `/` |
| Distributor | Company origin | `/distributor/portal` |
| Principal | Company origin | `/principal/portal` |
| Supervisor | Company origin | `/supervisor/portal` |
| Super Admin | Company origin | `/admin/portal` (direct URL only; not linked publicly) |

Current Railway-generated origins (public configuration defaults):
- `https://salesx-website-production.up.railway.app`
- `https://salesx-customer-production.up.railway.app`
- `https://salesx-company-production.up.railway.app`

Set the three `NEXT_PUBLIC_SALESX_*_URL` variables at Web build time when custom domains are introduced. Keep the exact origins in API `CORS_ORIGINS`. All Web BFF services and FastAPI must share the existing `SALESX_BFF_SHARED_SECRET`; do not create a second secret or expose it to client bundles.

Authenticated cross-origin navigation uses the one-time portal handoff described in ADR-006. Public landing links do not carry a session. The Super Admin entry is never included in public or ordinary portal navigation.
