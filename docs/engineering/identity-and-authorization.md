# Identity, Authentication & Authorization — Phase 02

Target: eyofuiyxalbehbqoaeny / https://eyofuiyxalbehbqoaeny.supabase.co

## Authority boundaries

- Supabase Auth is the only credential, password, verification and refresh-token authority.
- FastAPI verifies JWT signature, issuer, audience, expiry, issued-at, subject and session_id.
- FastAPI reads auth.sessions, profile status, verification state, session device revocation and profiles.session_revoked_at on every protected request.
- Organization membership, role inheritance, scoped assignments and ABAC conditions are read from PostgreSQL. Client claims and user-editable metadata are never authorization inputs.
- Web and Expo may establish/refresh Supabase Auth sessions, but business access and tenant authorization remain in FastAPI.

## Auth lifecycle

Web uses the shared @salesx-ai/auth-client and @salesx-ai/api-client packages with GET /api/v1/auth/me as its context contract. Email/password signup, verification callback, password recovery/reset, Google OAuth, SMS OTP, refresh and local account switching are connected to the shared provider. Google OAuth now uses PKCE (S256), a random callback-bound oauth_state, a ten-minute pending-flow lifetime and one-time code exchange. Legacy implicit-token callbacks are rejected whenever a PKCE flow is pending. Manual Google identity linking uses the Supabase Auth user/identities/authorize endpoint and binds the returned session to the original user ID before replacing the stored session. Supabase Auth manual linking must still be enabled in the target project.

The browser adapter persists Supabase session material in browser local storage. This is compatible with the current client-only portal architecture but remains exposed to same-origin XSS; a future SSR-only HttpOnly cookie session is a separate hardening step. Do not store any server key in browser code.

## Session revocation semantics

- local: Supabase Auth /logout?scope=local revokes the current refresh-token session. FastAPI marks the current session_devices row revoked.
- global: Supabase Auth /logout?scope=global revokes all refresh-token sessions. FastAPI advances profiles.session_revoked_at and revokes all registered device rows.
- others: Supabase Auth /logout?scope=others revokes other refresh-token sessions. FastAPI revokes all other registered device rows while retaining the current one.
- DELETE /api/v1/auth/sessions/{session_id} is a server-side API deny-list operation for that session. It cannot revoke another device's Supabase refresh token because the server does not possess that device's access token. The revoked session is denied by FastAPI.
- Revoked access JWTs are cryptographically valid until exp; Supabase documents this behavior. FastAPI rejects old JWTs by checking the session row, device registry and profile revocation epoch on every request.

Account suspension/deactivation requires SUPABASE_SECRET_KEY for the Auth Admin ban. The API applies the ban before changing profile state; a missing admin secret returns a configuration error and does not claim a remote ban.

## Invitation lifecycle

Organization invitations are stored as SHA-256 token hashes, expire after seven days and are bound to the verified Auth email. Create, accept, reject, expire, revoke and resend operations are tenant-scoped and audited. Role assignment is checked against the inviter's hierarchy and the invited role's tenant/branch scope; branch activity and organization ownership are revalidated at acceptance. Acceptance and rejection require the signed-in Auth user's email to match the invitation and email_confirmed_at to be non-null. New Auth identities receive Supabase Auth Admin invitations; existing but unverified identities receive Supabase Auth signup-verification resend; verified existing identities receive the one-time organization invitation through the InvitationDelivery provider interface and SMTP adapter (SMTP_HOST, SMTP_PORT, SMTP_USERNAME, SMTP_PASSWORD, SMTP_FROM_EMAIL, SMTP_STARTTLS). The invitation record is persisted before delivery; failed Auth Admin delivery revokes the pending record and is audited, while SMTP/resend delivery failures are audited and can be retried. The raw token is stored only as a SHA-256 hash in PostgreSQL and included only in the delivery path/authorized create response. Providers remain unconfigured until deployment secrets are supplied.

## Expo native session storage

The Expo app uses the shared Auth REST client with an Expo SecureStore adapter. Supabase access/refresh tokens are stored in the platform secure store, not AsyncStorage or plaintext files. The app restores sessions on launch, refreshes expired sessions, handles OAuth/email verification/password-recovery deep links, uses FastAPI auth context and tenant selection, and invokes server-backed remote logout before clearing local secure storage. If the device is offline, local credentials are cleared but the UI explicitly reports that remote revocation could not be confirmed.

## Runtime environment

FastAPI configuration is code-ready without secret values: settings are loaded lazily, the Supabase URL/JWKS/issuer/audience defaults are bound to project eyofuiyxalbehbqoaeny, and DATABASE_URL is validated to target the project's direct database host or Supabase pooler username. The asyncpg pool uses TLS, bounded connection/command/statement timeouts, a pool lifecycle and disabled statement cache for pooler compatibility. If DATABASE_URL is absent, the process can import/start for health checks but /readyz returns 503 and database dependencies fail closed. Runtime still requires deployment values for DATABASE_URL, exact CORS origins, APP_PUBLIC_URL, SUPABASE_PUBLISHABLE_KEY, SUPABASE_SECRET_KEY and SMTP. Values are supplied only through server environment/secrets; committed .env.example files contain placeholders only.

The repository connector can verify project metadata and SQL schema but does not expose the database password or deployment environment secret values. Runtime database connectivity and Auth Admin operations must not be reported as verified until the server environment has those secrets and /readyz plus authenticated API checks pass.


## Phase 02 implementation continuation — 2026-11-19

- Organization creation now requires the platform-scoped `organization:create` permission. The API no longer permits any authenticated identity to create a tenant without an explicit permission.
- The shared permissions package now exports all 22 permission identifiers currently present in the bound Supabase `public.permissions` table. This is a client-side visibility vocabulary only; FastAPI dependencies remain the enforcement boundary.
- Existing-user organization invitation delivery now uses the server-side SMTP adapter. New, unregistered identities continue to receive Supabase Auth Admin invitations. SMTP values are documented as placeholders in `services/api/.env.example`; no live SMTP credentials or provider have been configured.
- Invitation acceptance/rejection now requires a verified email identity matching the invited email, preventing a phone-verified account with an unverified matching email from accepting an invitation.
- No schema change was required for these application-layer changes. The target Supabase migration ledger remains at nine applied versions.
- Manual identity-linking/Google OAuth provider settings, runtime secrets, live API verification and per-device provider refresh-token revocation remain external/runtime blockers.


## Shared API contract and consumer integration

- The AuthContext response includes platform_permissions in both FastAPI's Pydantic response schema and packages/api-contracts.
- The shared @salesx-ai/api-client transport is consumed by the Web auth provider and Expo native auth hook. It imports canonical AuthContext and SessionDeviceRegistration contracts from packages/api-contracts; /auth/me and current-session registration now use this typed transport. It adds the bearer token, client platform and active organization, performs one refresh/retry, and clears client session/context when FastAPI explicitly rejects a revoked/inactive session.
- Web portals continue to share the root SalesXAuthProvider; no UI redesign was introduced. Expo continues to use expo-secure-store for auth session storage and the same shared AuthClient/API client contracts.
- Account switching clears the current Supabase session, pending OAuth verifier/state and active organization/membership context. Native invitation callback accepts organization_invite through the same FastAPI API client after Supabase email verification. No separate persistent business cache is introduced by the auth layer.
- Client-side permission helpers are navigation/action visibility hints only. Every protected API mutation still uses FastAPI dependencies and server-derived tenant/resource context.

## Code-ready OAuth, invitation and runtime implementation — 2026-11-19

- OAuth sign-in and manual identity linking use PKCE S256 with a secure random verifier, a callback-bound random oauth_state, expiry validation and one-time code exchange. Manual linking is bound to the same Supabase user ID that initiated the flow.
- Invitation delivery is routed through InvitationDelivery; SMTP is the current configurable adapter. Unverified existing identities use Supabase Auth signup-verification resend; new identities use Auth Admin invite.
- FastAPI runtime and database pool can be imported/started with secrets intentionally unset. /readyz remains unavailable until the target DATABASE_URL is supplied; this is readiness behavior, not a successful database connection claim.
- No provider credentials, OAuth provider settings, runtime deployment variables or Supabase project configuration were changed by these code changes.
