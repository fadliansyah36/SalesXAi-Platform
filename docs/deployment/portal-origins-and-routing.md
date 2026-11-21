# Portal origin and route map

The deployment uses the existing four Railway services only.

| Portal | Origin | Public path |
|---|---|---|
| Landing / Sales | `NEXT_PUBLIC_SALESX_WEBSITE_URL` | `/` / `/portal` |
| Customer | `NEXT_PUBLIC_SALESX_CUSTOMER_URL` | `/` |
| Company | `NEXT_PUBLIC_SALESX_COMPANY_URL` | `/` |
| Distributor | Company origin | `/distributor` |
| Principal | Company origin | `/principal` |
| Supervisor | Company origin | `/supervisor` |
| Super Admin | Company origin | `/super-admin` (direct URL only; not linked publicly) |

Current Railway-generated origins (public configuration defaults):
- `https://salesx-website-production.up.railway.app`
- `https://salesx-customer-production.up.railway.app`
- `https://salesx-company-production.up.railway.app`

Set the three `NEXT_PUBLIC_SALESX_*_URL` variables at Web build time when custom domains are introduced. Keep the exact origins in API `CORS_ORIGINS`. All Web BFF services and FastAPI must share the existing `SALESX_BFF_SHARED_SECRET`; do not create a second secret or expose it to client bundles.

Authenticated cross-origin navigation uses the one-time portal handoff described in ADR-006. Public landing links do not carry a session. The Super Admin entry is never included in public or ordinary portal navigation. Company service explicitly exposes the role portal paths `/distributor`, `/principal`, `/supervisor`, and the direct-only `/super-admin` route; each is protected by its portal route guard and FastAPI permissions.
