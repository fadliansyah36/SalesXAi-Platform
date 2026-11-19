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

Web authentication now uses the Next.js server-side Auth BFF. Access, refresh and OAuth transaction material is held in HttpOnly cookies (Secure in production; SameSite=Lax for auth cookies), never returned in the browser session view or persisted in browser localStorage. Mutating BFF/API requests require exact-origin validation and a CSRF token bound to an HttpOnly cookie. The backend proxy forwards the cookie-held access token to FastAPI and refreshes only through the server-side BFF. The provider removes the legacy browser auth and PKCE stores during migration. Do not store any server key in browser code.

## Session revocation semantics

- local: Supabase Auth /logout?scope=local revokes the current refresh-token session. FastAPI marks the current session_devices row revoked.
- global: Supabase Auth /logout?scope=global revokes all refresh-token sessions. FastAPI advances profiles.session_revoked_at and revokes all registered device rows.
- others: Supabase Auth /logout?scope=others revokes other refresh-token sessions. FastAPI revokes all other registered device rows while retaining the current one.
- DELETE /api/v1/auth/sessions/{session_id} is a server-side session-registry revocation for that device. It does not claim to revoke the provider refresh token for an arbitrary other device. The revoked session is denied by FastAPI and by the BFF refresh-authorization gate before another Supabase refresh is attempted.
- Revoked access JWTs remain cryptographically valid until exp. FastAPI rejects them on every protected request using the live Auth session, registered device row, account state and profile revocation epoch. The server-only /api/v1/security/refresh-authorize gate verifies the prior access JWT signature/issuer/audience while deliberately allowing its exp to have elapsed, then checks auth.sessions.not_after, registered session_devices, device revocation, account verification/status and the revocation epoch before the Web or Expo BFF can submit the refresh token to Supabase Auth. This is application-level refresh enforcement, not provider refresh-token revocation.

Account suspension/deactivation first commits the database deny state, advances the revocation epoch and revokes registered device rows, then calls Supabase Auth Admin. If Auth Admin credentials/provider calls fail, FastAPI still denies the account and writes a failed-ban audit event; the endpoint does not claim that the provider ban succeeded. Reactivation preserves the prior session revocation epoch so old JWTs remain invalid.

## Invitation lifecycle

Organization invitations are stored as SHA-256 token hashes, expire after seven days and are bound to the verified Auth email. Create, accept, reject, expire, revoke and resend operations are tenant-scoped and audited. Role assignment is checked against the inviter's hierarchy and the invited role's tenant/branch scope; branch activity and organization ownership are revalidated at acceptance. Acceptance and rejection require the signed-in Auth user's email to match the invitation and email_confirmed_at to be non-null. New Auth identities receive Supabase Auth Admin invitations; existing but unverified identities receive Supabase Auth signup-verification resend; verified existing identities receive the one-time organization invitation through the InvitationDelivery provider interface and SMTP adapter (SMTP_HOST, SMTP_PORT, SMTP_USERNAME, SMTP_PASSWORD, SMTP_FROM_EMAIL, SMTP_STARTTLS). The invitation record is persisted before delivery; failed Auth Admin delivery revokes the pending record and is audited, while SMTP/resend delivery failures are audited and can be retried. The raw token is stored only as a SHA-256 hash in PostgreSQL and included only in the delivery path/authorized create response. Providers remain unconfigured until deployment secrets are supplied.

## Expo native session storage

The Expo app uses the shared Auth REST client with an Expo SecureStore adapter. Supabase access/refresh tokens are stored in the platform secure store, not AsyncStorage or plaintext files. The app restores sessions on launch, refreshes expired sessions, handles OAuth/email verification/password-recovery deep links, uses FastAPI auth context and tenant selection, and invokes server-backed remote logout before clearing local secure storage. If the device is offline, local credentials are cleared but the UI explicitly reports that remote revocation could not be confirmed.

## Runtime environment

FastAPI configuration is code-ready without secret values: settings are loaded lazily, the Supabase URL, canonical JWKS endpoint, issuer and authenticated audience are bound to project eyofuiyxalbehbqoaeny, and DATABASE_URL is validated to target the project's direct database host or Supabase pooler username. The asyncpg pool uses TLS, bounded connection/command/statement timeouts, a pool lifecycle and disabled statement cache for pooler compatibility. If DATABASE_URL is absent, the process can import/start for health checks but /readyz returns 503 and database dependencies fail closed. Runtime still requires deployment values for DATABASE_URL, exact CORS origins, APP_PUBLIC_URL, SUPABASE_PUBLISHABLE_KEY, SUPABASE_SECRET_KEY and SMTP. Values are supplied only through server environment/secrets; committed .env.example files contain placeholders only.

The repository connector can verify project metadata and SQL schema but does not expose the database password or deployment environment secret values. Runtime database connectivity and Auth Admin operations must not be reported as verified until the server environment has those secrets and /readyz plus authenticated API checks pass.


## Phase 02 implementation continuation — 2026-11-19

- Organization creation now requires the platform-scoped `organization:create` permission. The API no longer permits any authenticated identity to create a tenant without an explicit permission.
- The shared permissions package now exports all 23 permission identifiers currently present in the bound Supabase `public.permissions` table. This is a client-side visibility vocabulary only; FastAPI dependencies remain the enforcement boundary.
- Existing-user organization invitation delivery now uses the server-side SMTP adapter. New, unregistered identities continue to receive Supabase Auth Admin invitations. SMTP values are documented as placeholders in `services/api/.env.example`; no live SMTP credentials or provider have been configured.
- Invitation acceptance/rejection now requires a verified email identity matching the invited email, preventing a phone-verified account with an unverified matching email from accepting an invitation.
- No schema change was required for these application-layer changes. The target Supabase migration ledger remains at nine applied versions.
- Google OAuth provider settings, runtime secrets and live API/provider verification remain DEPLOYMENT_PENDING. Supabase does not support arbitrary other-device refresh-token revocation; application refresh/API enforcement is implemented through the server-side session registry gate.


## Shared API contract and consumer integration

- The AuthContext response includes platform_permissions in both FastAPI's Pydantic response schema and packages/api-contracts.
- The shared @salesx-ai/api-client transport is consumed by the Web auth provider and Expo native auth hook. It imports canonical AuthContext, session, organization, membership, role, invitation, account-status and error contracts from packages/api-contracts. It exposes typed Phase 02 operations for /auth/me, session registration/list/revocation/sign-out, linked identity list/unlink, organization/member/role CRUD, invitation lifecycle and platform account status; /auth/me and current-session registration now use this typed transport. It adds the bearer token, client platform and active organization, performs one refresh/retry, and clears client session/context when FastAPI explicitly rejects a revoked/inactive session.
- Web portals continue to share the root SalesXAuthProvider; no UI redesign was introduced. Web access/refresh tokens remain in server-only HttpOnly cookies through the Auth BFF; the browser receives a tokenless session view. Expo uses expo-secure-store for auth session and pending PKCE material, with the same shared AuthClient/API client contracts.
- Account switching clears the current Supabase session, pending OAuth verifier/state and active organization/membership context. Native invitation callback accepts organization_invite through the same FastAPI API client after Supabase email verification. No separate persistent business cache is introduced by the auth layer.
- Client-side permission helpers are navigation/action visibility hints only. Every protected API mutation still uses FastAPI dependencies and server-derived tenant/resource context.

## Code-ready OAuth, invitation and runtime implementation — 2026-11-19

- OAuth sign-in and manual identity linking use PKCE S256 with a secure random verifier, a callback-bound random oauth_state, expiry validation and one-time code exchange. Manual linking is bound to the same Supabase user ID that initiated the flow.
- Invitation delivery is routed through InvitationDelivery; SMTP is the current configurable adapter. Unverified existing identities use Supabase Auth signup-verification resend; new identities use Auth Admin invite.
- FastAPI runtime and database pool can be imported/started with secrets intentionally unset. /readyz remains unavailable until the target DATABASE_URL is supplied; this is readiness behavior, not a successful database connection claim.
- No provider credentials, OAuth provider settings, runtime deployment variables or Supabase project configuration were changed by these code changes.


## Authorization hardening continuation

- Recursive role inheritance uses deduplicating UNION semantics so malformed cyclic parent-role references cannot cause unbounded recursive queries.
- Permission resolution validates both an explicitly selected resource branch and the membership's default branch against the active organization and active branch state before resolving scoped roles.
- The auth context omits tenant permissions for invited/suspended/removed memberships and excludes branch-scoped permissions when the referenced branch is inactive.


## Final Phase 02 continuation — 2026-11-19

### OAuth/OIDC nonce

The shared Auth client generates a separate cryptographically random nonce for Google sign-in and manual identity linking, stores it with the pending PKCE transaction, and sends it to Supabase Auth's authorize endpoint. Supabase Auth forwards the nonce to the upstream OIDC provider and validates the returned ID-token nonce. The application separately validates its callback-bound `oauth_state`, enforces the 10-minute pending-flow lifetime, performs a one-time PKCE code exchange, and verifies that manual linking resolves to the original Supabase user ID. Provider credentials and callback allowlists are deployment configuration, not committed values.

### Invitation callback and scope-safe delegation

The Supabase signup-verification and Auth Admin invite redirect now use the exact callback parameter `organization_invite=<raw-token>`. The Web callback preserves the explicit invitation accept/reject screen after verification; the Expo callback accepts through the shared typed API client. Invitation resend regenerates the token and validates the role's branch scope is still active in the same organization. Invitation creation rejects already-active and suspended memberships.

Delegation hierarchy is resolved recursively with deduplicating `UNION`, including inherited parent roles and platform/tenant/target-branch scope. Invitation create/resend, member role assignment and assignable-role discovery use the same hierarchy rule. A branch role cannot authorize delegation in another branch, and a branch-scoped role cannot delegate a tenant-wide role.

### Consumer context isolation

The Web Auth provider increments a consumer epoch on account invalidation/logout and active-organization changes, remounting portal descendants to discard in-memory state from the previous principal/tenant. Expo exposes the same context epoch and keys the native Sales screen to it. No new business-data cache or local business source of truth is introduced.

### Session revocation boundary

FastAPI checks the live Supabase Auth session, device revocation record, profile status and JWT revocation epoch for every protected request. The per-device session registry prevents a revoked device session from accessing SalesX-Ai APIs even if its already-issued JWT has not expired. Supabase remote sign-out remains available for its supported `local`, `global` and `others` scopes. Supabase does not expose a supported API to revoke an arbitrary other device's refresh token by session ID; this remains a provider-level limitation and must not be described as remote provider revocation.


## Final consumer, session and authorization hardening — 2026-11-19

- Pending OAuth state is stored/read/cleared exclusively through the injected OAuth storage adapter. Web uses tab-scoped sessionStorage; Expo uses SecureStore. Error/denial callbacks must present the matching callback-bound state before pending state is cleared. Successful PKCE exchange and account switching clear the same adapter.
- Google OAuth sign-in and manual identity linking include a separate random OIDC nonce. Supabase Auth performs upstream OIDC nonce verification; application credentials/provider settings remain deployment-dependent.
- The delegation hierarchy resolver is permission-specific and ABAC-aware: it considers only roles that grant the action permission, carries assignment attributes through parent-role inheritance, and limits branch assignments to the target branch. Membership status changes compare actor and target hierarchy, protect platform-scoped identities, and revoke assignments when membership is removed.
- Invitation callback token handling is consistent for create/resend. Invitation acceptance cannot reactivate an already-active membership or change its branch through an old invitation; active/suspended membership conflicts and stale branch invitations are rejected.
- Platform account status changes commit the API deny state before attempting Auth Admin ban/unban, so an Auth Admin failure cannot leave a suspended identity authorized by FastAPI.
- Device session registration stores the actual Auth `not_after` timestamp as the device registry expiry. Principal resolution enforces that expiry in addition to live `auth.sessions`, device revocation and profile revocation epoch.
- The Web access console and native Sales app expose session list/revocation through typed API client methods. The revoke action is explicitly an API deny-list operation; it is not described as arbitrary remote Supabase refresh-token revocation.
- FastAPI security middleware sets security response headers, enforces the configured declared Content-Length maximum and rejects chunked request bodies. `APP_PUBLIC_URL` is validated as an exact origin and must be included in CORS origins when CORS is configured.
- Distributed PostgreSQL-backed API and Auth BFF rate limiting is implemented. Current workflow evidence is recorded in docs/implementation/phase-status.md. Full permission-aware feature-action mapping across every business screen and action remains incomplete.


## Latest implementation evidence — 2026-11-19

### Web HttpOnly BFF and native refresh enforcement

- Web session storage is server-side: salesx_access, salesx_refresh and expiry cookies are HttpOnly; Secure is enabled in production and auth cookies use SameSite=Lax. The CSRF cookie is HttpOnly/SameSite=Strict; mutating routes require a matching X-CSRF-Token and exact configured origin. /api/auth/session exposes only a tokenless session view.
- /api/backend/* proxies typed API requests through the server-held cookie and performs CSRF checks for mutations. Legacy browser auth and PKCE local/session storage keys are removed during provider initialization.
- Expo persists the complete Supabase Auth session and PKCE state in expo-secure-store. Its AuthClient sends the prior access token when refreshing so the native Auth BFF can apply the same session-registry check.
- /api/v1/security/refresh-authorize is BFF-secret protected. It allows an expired-but-validly-signed prior access JWT only for checking the original session registry; it does not make that JWT valid for ordinary API requests. A missing, expired provider session, revoked device, unregistered device, inactive/unverified account or stale revocation epoch denies refresh before the BFF calls Supabase Auth.
- Supabase Auth does not expose a supported operation to revoke one arbitrary other device's refresh token by session ID. The refresh token may remain provider-valid until its natural/provider-side revocation, but the device cannot refresh through SalesX-Ai BFF or access protected FastAPI APIs after registry revocation. This distinction is mandatory in operational reporting.

### Distributed rate limiting

- FastAPI uses the shared PostgreSQL app_private.api_rate_limit_buckets store with atomic upsert/window accounting, bounded retention cleanup, HMAC-keyed pseudonymous identifiers when the server BFF secret is configured, and fail-closed behavior when the store is unavailable.
- FastAPI limits sensitive auth-context/session/identity/admin reads, session registration/sign-out/revocation, invitation create/resend/accept/reject, membership changes and account-status changes using IP plus account/identifier dimensions where available.
- The Web and native Auth BFF use the same PostgreSQL limiter through the server-only /api/v1/security/rate-limit endpoint for login, signup, OTP send/verify, email verification, password recovery/update, OAuth start/complete, identity link, refresh and sign-out. The BFF trusts only ingress-provided X-Real-IP; it does not accept a client-supplied forwarded-IP chain.
- Rate-limit buckets are in a non-exposed schema with RLS enabled, an explicit deny-client policy and no anon/authenticated table grants.

### Authorization boundary and current scope

- FastAPI remains the authorization authority. The current permissions catalog is synchronized with the 23 identifiers in the bound database; recursive role inheritance, tenant/branch scope, ABAC attributes, self-owned identity operations and platform-scoped account administration are enforced server-side.
- Web portal switching and portal access are permission-filtered. Super Admin navigation for users, roles, audit, organizations and tenants is permission-filtered. The full feature-action matrix for every business screen, button, menu and native business action is not yet exhaustive; future business API endpoints must each use the central FastAPI permission/resource-ownership dependencies. This remains a Phase 02 closure item rather than an assumed completion.

### Deployment-pending configuration

DEPLOYMENT_PENDING: DATABASE_URL, SUPABASE_PUBLISHABLE_KEY, SUPABASE_SECRET_KEY, SALESX_API_URL, SALESX_BFF_SHARED_SECRET (32+ random characters), APP_PUBLIC_URL, exact CORS_ORIGINS, Expo Auth BFF/API origins, Google OAuth credentials/provider enablement/callback allowlist/manual identity-linking enablement, and SMTP credentials. No values are committed or populated. No runtime/provider-live verification is claimed.
