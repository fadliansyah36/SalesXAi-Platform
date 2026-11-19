# SalesX-Ai FastAPI

Phase 02 adds the FastAPI identity and authorization service under app/.

## Runtime
Python 3.12+. Install with python -m pip install -e '.[dev]' from services/api.
Run with uvicorn app.main:app --host 0.0.0.0 --port 8000.
OpenAPI: /api/v1/openapi.json; interactive docs: /api/v1/docs.
Health/readiness: /healthz and /readyz.

## Required server environment
- SUPABASE_URL: exact bound project URL.
- DATABASE_URL: server-only PostgreSQL connection string for project eyofuiyxalbehbqoaeny; require TLS.
- SUPABASE_JWKS_URL: optional override; defaults to /auth/v1/.well-known/jwks.json.
- SUPABASE_JWT_ISSUER: optional override; defaults to {SUPABASE_URL}/auth/v1.
- SUPABASE_JWT_AUDIENCE: defaults to authenticated.
- SUPABASE_JWT_SECRET: optional server-only legacy HS256 verifier. Prefer asymmetric signing keys/JWKS.
- SUPABASE_PUBLISHABLE_KEY: project publishable key for caller-authorized remote Auth logout.
- SUPABASE_SECRET_KEY: server-only Supabase secret key for Auth Admin invite and account ban operations.
- APP_PUBLIC_URL: canonical Web origin used for invitation and Auth callback URLs.
- AUTH_ADMIN_TIMEOUT_SECONDS, DB_POOL_MIN_SIZE, DB_POOL_MAX_SIZE, DB_COMMAND_TIMEOUT_SECONDS: bounded runtime controls.
- CORS_ORIGINS: comma-separated exact portal origins; no wildcard with credentials.

The service requires DATABASE_URL at startup. Do not add service-role credentials to Web or Expo. Authorization data is read from PostgreSQL, never user-editable JWT metadata or client-supplied role claims.

## Phase 02 endpoints
- GET /api/v1/auth/me
- POST /api/v1/auth/sessions/current
- GET /api/v1/auth/sessions
- POST /api/v1/auth/sign-out (local/global/others remote Supabase Auth logout plus FastAPI audit/epoch)
- GET /api/v1/auth/identities
- DELETE /api/v1/auth/identities/{identity_id} (owner-only, cannot unlink last identity)
- DELETE /api/v1/auth/sessions/{session_id} (FastAPI session deny-list; not a remote refresh-token revocation for another device)
- GET /api/v1/organizations
- POST /api/v1/organizations
- GET /api/v1/organizations/{organization_id}/members
- GET /api/v1/organizations/{organization_id}/assignable-roles (role catalog filtered by delegable hierarchy)
- GET /api/v1/organizations/{organization_id}/invitations
- POST /api/v1/organizations/{organization_id}/invitations
- POST /api/v1/organizations/invitations/accept
- POST /api/v1/organizations/invitations/reject
- POST /api/v1/organizations/{organization_id}/invitations/{invitation_id}/revoke
- POST /api/v1/organizations/{organization_id}/invitations/{invitation_id}/resend
- POST /api/v1/organizations/{organization_id}/members
- PATCH /api/v1/organizations/{organization_id}/members/{user_id}
- POST /api/v1/organizations/{organization_id}/members/{user_id}/roles
- GET /api/v1/organizations/{organization_id}/audit
- PATCH /api/v1/admin/users/{user_id}/account-status (platform-scoped permission; requires SUPABASE_SECRET_KEY)

Tenant context is resolved from verified active membership. X-Organization-ID is only a selector; it is never trusted without a membership lookup. A missing selector is accepted only when exactly one active membership exists. Multiple memberships require an explicit selector. RBAC uses active database assignments with recursive parent-role inheritance and default-deny.

## Security boundaries
Supabase Auth owns signup, password sign-in, refresh, recovery and verification; this API never stores credentials. JWT validation checks signature, issuer, audience, expiry, issued-at, subject and session ID. Every protected request checks profile status, email/phone verification, the live auth.sessions row and any local device revocation record. Device rows contain metadata only. Administrative audit rows are append-only and unavailable to browser/mobile database roles.
No Phase 02 Realtime channel is created; authorization reads current PostgreSQL state on every protected request.
Web/Expo rollout, deployment environment configuration and remote Auth Admin session revocation remain required integration work.
