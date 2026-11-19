# Identity, Authentication & Authorization — Phase 02

Target: eyofuiyxalbehbqoaeny / https://eyofuiyxalbehbqoaeny.supabase.co

## Authority boundaries

- Supabase Auth is the only credential, password, verification and refresh-token authority.
- FastAPI verifies JWT signature, issuer, audience, expiry, issued-at, subject and session_id.
- FastAPI reads auth.sessions, profile status, verification state, session device revocation and profiles.session_revoked_at on every protected request.
- Organization membership, role inheritance, scoped assignments and ABAC conditions are read from PostgreSQL. Client claims and user-editable metadata are never authorization inputs.
- Web and Expo may establish/refresh Supabase Auth sessions, but business access and tenant authorization remain in FastAPI.

## Auth lifecycle

Web uses the shared @salesx-ai/auth-client and GET /api/v1/auth/me context provider. Email/password signup, verification callback, password recovery/reset, Google OAuth, SMS OTP, refresh and local account switching are connected to the shared provider. The callback accepts Supabase implicit-flow tokens and token_hash verification links. Manual Google identity linking is initiated only by an authenticated user and requires Supabase Auth manual linking to be enabled in the target project.

The browser adapter persists Supabase session material in browser local storage. This is compatible with the current client-only portal architecture but remains exposed to same-origin XSS; a future SSR-only HttpOnly cookie session is a separate hardening step. Do not store any server key in browser code.

## Session revocation semantics

- local: Supabase Auth /logout?scope=local revokes the current refresh-token session. FastAPI marks the current session_devices row revoked.
- global: Supabase Auth /logout?scope=global revokes all refresh-token sessions. FastAPI advances profiles.session_revoked_at and revokes all registered device rows.
- others: Supabase Auth /logout?scope=others revokes other refresh-token sessions. FastAPI revokes all other registered device rows while retaining the current one.
- DELETE /api/v1/auth/sessions/{session_id} is a server-side API deny-list operation for that session. It cannot revoke another device's Supabase refresh token because the server does not possess that device's access token. The revoked session is denied by FastAPI.
- Revoked access JWTs are cryptographically valid until exp; Supabase documents this behavior. FastAPI rejects old JWTs by checking the session row, device registry and profile revocation epoch on every request.

Account suspension/deactivation requires SUPABASE_SECRET_KEY for the Auth Admin ban. The API applies the ban before changing profile state; a missing admin secret returns a configuration error and does not claim a remote ban.

## Invitation lifecycle

Organization invitations are stored as SHA-256 token hashes, expire after seven days and are bound to the verified Auth email. Create, accept, reject, expire, revoke and resend operations are tenant-scoped and audited. Role assignment is checked against the inviter's hierarchy and the invited role's tenant/branch scope. New Auth identities require Supabase Auth Admin invitation email; existing identities receive the one-time invitation URL through the authorized organization workflow.

## Runtime environment

FastAPI requires DATABASE_URL for the exact Supabase project, TLS, Supabase issuer/JWKS/audience configuration, exact CORS origins, APP_PUBLIC_URL, SUPABASE_PUBLISHABLE_KEY for remote logout and SUPABASE_SECRET_KEY for Auth Admin operations. Values are provided only through server environment/secrets. The committed .env.example files contain placeholders only.

The repository connector can verify project metadata and SQL schema but does not expose the database password or deployment environment secret values. Runtime database connectivity and Auth Admin operations must not be reported as verified until the server environment has those secrets and /readyz plus authenticated API checks pass.
