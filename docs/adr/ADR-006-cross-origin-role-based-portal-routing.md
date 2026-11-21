# ADR-006 — Cross-Origin Role-Based Portal Routing

- Status: Accepted
- Date: 2026-11-21
- Scope: Web portal routing, authentication continuity and Super Admin isolation

## Context

SalesX-Ai serves multiple portal applications across the existing four-service Railway topology. The website/Sales portal, Customer portal and Company portal use different origins. Distributor, Principal, Supervisor and Super Admin are path-routed within the Company service. A relative-path redirect cannot preserve a Web session across these origins because the BFF session cookies are host-scoped.

## Decision

1. Resolve portal access from the authenticated FastAPI auth context and active organization membership. A portal route guard is a navigation aid only; FastAPI authorization remains authoritative.
2. Use the canonical public origins:
   - Website/Sales: `NEXT_PUBLIC_SALESX_WEBSITE_URL`
   - Customer: `NEXT_PUBLIC_SALESX_CUSTOMER_URL`
   - Company and partner portals: `NEXT_PUBLIC_SALESX_COMPANY_URL`
3. Preserve authenticated sessions across portal origins through a one-time BFF handoff:
   - Source BFF encrypts access/refresh session data with AES-256-GCM using the existing `SALESX_BFF_SHARED_SECRET`.
   - API stores only the SHA-256 hash of a random one-time ticket and the encrypted session envelope.
   - Ticket is bound to an exact portal-to-origin mapping, active organization, actor user and target portal; it expires after 60 seconds.
   - Target BFF atomically consumes the ticket, decrypts the envelope, verifies the access token/user, and sets its own HttpOnly session cookies.
   - Raw access and refresh tokens never appear in the redirect URL.
4. Portal switchers use the same handoff. Public landing/login links remain ordinary links because no authenticated session is available there.
5. Super Admin is omitted from public landing, login and ordinary portal navigation. The protected entry is the direct Company-origin route `/super-admin`; the route guard and platform API permissions continue to enforce Super Admin authorization. URL knowledge alone grants no access.
6. No Railway service or database is added. SMTP and Google OAuth credentials remain deployment-pending.

## Security properties

- Opaque single-use ticket, SHA-256 hash at rest, atomic consume, 60-second expiry, organization/actor foreign-key binding.
- AES-256-GCM encrypted session envelope; no plaintext refresh token stored in the database.
- Shared BFF secret required for API create/exchange calls.
- Exact target-origin allow-list check and portal-origin mapping validated by FastAPI.
- Existing FastAPI tenant/role/scope authorization remains the authority after handoff.
- Public navigation does not expose Super Admin.

## Consequences

- Cross-origin role redirects can establish a fresh HttpOnly BFF session on the destination portal without exposing Supabase tokens in URLs.
- All production portal origins must be present in API `CORS_ORIGINS`, and the same existing BFF secret must be configured in the API and all Web BFF services.
- Changes to custom domains require updating the three public origin variables and API allow-list configuration.
