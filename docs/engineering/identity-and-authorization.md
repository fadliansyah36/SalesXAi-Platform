# SalesX-Ai Identity & Authorization — Phase 02

## Authority
- Supabase Auth owns credentials, signup/sign-in, refresh, recovery, verification, MFA and provider identities.
- FastAPI verifies access JWTs and is the only business authorization authority.
- PostgreSQL stores profiles, organization membership, scoped roles, permissions, device metadata and append-only administrative audit.
- Browser/mobile permission state is navigation UX only. Never trust user metadata, role claims, tenant IDs in request bodies or client-computed authorization.

## JWT verification
FastAPI accepts configured Supabase signing algorithms: asymmetric ES256/RS256/EdDSA through the project's JWKS endpoint, or legacy HS256 only when a server-side SUPABASE_JWT_SECRET is explicitly configured. It validates signature, issuer, audience, expiry, issued-at, subject and session ID. Each authenticated request also checks profile status, email/phone verification, the live auth.sessions row and local device revocation state.

## Tenant context and policy
X-Organization-ID selects a candidate tenant only. FastAPI resolves the authenticated user's active membership and active organization from PostgreSQL. A missing selector is accepted only when exactly one active membership exists. Multiple memberships require an explicit selector. RBAC uses scoped assignments and recursive parent-role permissions; ABAC assignment conditions are matched against server-derived resource attributes. Missing permission, inactive membership, invalid scope or unmatched conditions mean deny. JWT user_metadata is never an authorization source.

## Session lifecycle and identity linking
Supabase Auth owns refresh-token rotation and session termination. session_devices stores only device metadata and the Supabase session_id; it never stores tokens. API requests are denied if the Auth session row is absent or a device session is locally revoked. Clients must call Supabase Auth signOut to revoke refresh credentials as well as recording device logout. Remote Admin API revocation of other Auth sessions remains a separate server integration requirement.
Supabase Auth automatic identity linking remains authoritative. A database trigger mirrors provider identity references from auth.identities into public.user_identities; it does not copy credentials or use provider metadata for authorization. Manual linking remains subject to Auth provider configuration and an authenticated explicit linking flow.

## Realtime
No Phase 02 Realtime channel is created. Account, membership and tenant state is re-read from PostgreSQL on every protected request. If UX later needs push invalidation, use private tenant-scoped Broadcast containing identifiers only.

## Migration and RLS
Migration 20261119120000_p02_identity_tenant_authorization is applied to project eyofuiyxalbehbqoaeny. It creates tenant/branch foundation, profiles, identity mapping, memberships, role/permission catalogs and assignments, session metadata, append-only audit, indexes, triggers, RLS and least-privilege grants.
The existing postgres-owned public.rls_auto_enable() SECURITY DEFINER function and ensure_rls event trigger were inspected and preserved. Application roles have no direct EXECUTE privilege. New tables also explicitly enable RLS.

## Deployment
Configure FastAPI server environment variables in the API deployment secret store. Set public Supabase URL/publishable key and API origin per portal. No credentials belong in source control.
