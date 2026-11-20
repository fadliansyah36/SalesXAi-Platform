# SalesX-Ai Phase Status

Target repository: fadliansyah36/SalesXAi-Platform
Branch: main
Supabase project ref: eyofuiyxalbehbqoaeny

## Phase 00 — Repository Bootstrap & Governance

Status: COMPLETED

- Root AGENTS.md, Master PRD, Engineering Execution Master Plan and cross-platform implementation flow remain canonical.
- Bun 1.4.5 is the only JavaScript package manager; Bun workspaces and Turborepo remain canonical.
- Existing Next.js portals and routes are preserved.
- Applied migrations: 20261119101638_p00_create_private_schema and 20261119103355_p00_restrict_rls_auto_enable_execution.
- The postgres-owned public.rls_auto_enable() SECURITY DEFINER function and ensure_rls event trigger remain intact; application roles cannot execute the function directly.
- No Phase 02 schema was introduced in Phase 00.

## Phase 01 — Canonical Design System & Design Tokens

Status: COMPLETED

- Nine canonical JSON token sources and deterministic Web/Native generation remain complete.
- Shared Web/Native Design System and runnable Expo SDK 58 application remain complete.
- Existing Web presentation and routes are preserved.
- Static theme does not require Supabase persistence or Realtime.

## Phase 02 — Identity, Tenant & Authorization Foundation

Status: PARTIAL

### Implemented and applied
- [x] Supabase Auth remains the sole credential/identity authority; profile and provider-identity mirror triggers are installed.
- [x] Organization, branch, profile, identity mapping, membership, role/permission, scoped assignment, session device and audit schema are applied to the bound Supabase project.
- [x] RLS is enabled on all 12 Phase 02 public tables; client writes and sensitive table access are denied.
- [x] FastAPI JWT verifier checks signing algorithm/signature, issuer, audience, expiry, issued-at, subject and session_id.
- [x] FastAPI principal resolver checks verified email/phone, profile status, live auth.sessions, device revocation and the profiles.session_revoked_at epoch on every protected request.
- [x] Tenant resolver and recursive database RBAC/ABAC checks remain authoritative; X-Organization-ID is only a selector.
- [x] FastAPI source now includes remote Auth sign-out scopes (local/global/others), own identity list/unlink, full invitation create/accept/reject/expire/revoke/resend lifecycle, and platform-scoped account status administration.
- [x] Web shared Auth provider is wired to existing Sales, Customer, Company, Distributor, Principal, Supervisor and Super Admin portals; it calls GET /api/v1/auth/me, registers device sessions, refreshes expired sessions, and supplies tenant/permission context.
- [x] Web login, signup, email verification callback, password recovery/reset, Google OAuth, SMS OTP, identity linking/unlinking, account switching and invitation acceptance UI are connected to the shared Auth provider source.
- [x] Organization access UI and platform account security UI are available under /portal/access.
- [x] Server environment examples and identity/session security documentation are updated.
- [x] Supabase Security Advisor returned zero lints after Phase 02 migrations.
- [x] Supabase project metadata verified: ACTIVE_HEALTHY, PostgreSQL 17.12, region ap-northeast-1.

### Remaining — phase completion blockers
- [x] Expo native auth uses Expo SecureStore, shared AuthClient, Supabase signup/login/verification/recovery/OTP/Google OAuth, session restoration/refresh, FastAPI auth/me and tenant context, account switching, identity link/unlink and remote logout. Frozen-lockfile install, Native TypeScript, Expo SDK compatibility, app config, Metro startup, Android/iOS JS bundle export and Turbo workspace build passed in GitHub Actions run 44527586969.
- [ ] OAuth code now uses PKCE S256, callback-bound state validation and account-bound manual linking. Google OAuth provider/callback settings and Supabase manual identity linking must still be enabled/verified in the target Auth configuration.
- [ ] Existing-user invitation delivery code now sends through the server-side SMTP adapter; SMTP host/from address/credentials are still not configured in a deployment secret manager, so delivery is not operationally verified. New unregistered identities still require Supabase Auth Admin invite delivery and SUPABASE_SECRET_KEY.
- [ ] The shared permissions package now contains all 22 permission identifiers in the live permissions catalog, and organization creation is enforced by platform-scoped organization:create. Action-level visibility across every existing feature action is not yet exhaustively mapped. FastAPI remains the authorization boundary.
- [ ] FastAPI runtime code is ready for deployment secrets: settings load without secret values, the target Supabase URL/JWKS/issuer/audience are bound, DATABASE_URL target validation supports direct DB and Supabase pooler, and the asyncpg TLS pool/readiness lifecycle is implemented. Actual DATABASE_URL, API deployment secrets, APP_PUBLIC_URL and exact CORS origins remain intentionally unset; runtime database connectivity is therefore not verified.
- [ ] Account status endpoint requires SUPABASE_SECRET_KEY for Auth Admin ban/unban; this secret is not available through the repository or database connector.
- [ ] Live FastAPI /readyz, authenticated /api/v1/auth/me, OAuth callback, remote sign-out, invitation email delivery and Auth Admin ban checks remain unevidenced because deployment values/providers are intentionally not configured.
- [x] Web TypeScript and lint passed in GitHub Actions run 44527347416 (head 7ee0ffade24200816e7593b63eee6f13428dba2d) and again in foundation run 44527586969.
- [x] FastAPI unittest, compileall and Ruff passed in GitHub Actions run 44527586864.
- [x] Native TypeScript, Expo SDK dependency check, app config, Metro, Android/iOS bundle exports and Turborepo build passed in GitHub Actions run 44527586969.
- [x] Source files for all 9 applied migration versions are now present in the GitHub migration directory. The 20261119115701, 20261119120627 and 20261119120742 SQL files were restored as idempotent source mirrors from the live schema and applied migration evidence; no migration was re-applied during this continuation.
- [ ] Specific remote refresh-token revocation for a different device cannot be claimed from DELETE /auth/sessions/{id}; this endpoint denies that session at FastAPI only. Supabase global/others/local logout are remotely invoked when the active session is available.
- [ ] Runtime secrets and PostgreSQL connection remain unset by instruction. The code is prepared to fail closed and return 503 from /readyz until the matching project DATABASE_URL is supplied. Supabase connector SQL access is not evidence of FastAPI process connectivity.

### Supabase evidence
- Project ref: eyofuiyxalbehbqoaeny; status ACTIVE_HEALTHY; PostgreSQL 17.12.
- Applied migrations:
  - 20261119101638 p00_create_private_schema
  - 20261119103355 p00_restrict_rls_auto_enable_execution
  - 20261119112132 p02_identity_tenant_authorization
  - 20261119112853 p02_audit_retention_and_private_function_grants
  - 20261119112941 p02_explicit_deny_policies_and_role_scope_guard
  - 20261119115701 p02_invitation_lifecycle_and_session_revocation_epoch
  - 20261119120627 p02_restrict_account_status_to_platform_admin
  - 20261119120742 p02_auth_identity_link_audit_trigger
  - 20261119131809 p02_add_missing_foreign_key_indexes
- RLS enabled on all 12 Phase 02 public tables.
- Security Advisor: zero lints.
- Realtime: not applicable; authorization re-reads PostgreSQL state on each protected request.

### Engineering evidence
- Previous implementation baseline: 7d5c916d2b6fdb623b71afe1a773456f0dacb6fd. Current Phase 02 code head before documentation commits: 8c926bd9ad07964447043df51887806cacfda696.
- Phase 02 CI: https://github.com/fadliansyah36/SalesXAi-Platform/actions/runs/44527586864.
- Bun/Web/Expo CI: https://github.com/fadliansyah36/SalesXAi-Platform/actions/runs/44527586969.
- FastAPI source: services/api/app/.
- Shared packages: packages/shared-types, packages/api-contracts, packages/api-client, packages/permissions, packages/auth-client.
- Web consumer entry: components/providers/SalesXAuthProvider.tsx.
- Organization access UI: app/portal/access/.
- Auth/security architecture: docs/engineering/identity-and-authorization.md.
- API workflow: .github/workflows/phase-02-api-checks.yml.

Phase 02 remains PARTIAL. Earlier Expo and static CI validation are complete, and migration-source parity is restored. Current code is prepared for runtime secrets, PKCE OAuth, invitation providers and shared Web/Expo API transport; closure is still blocked by unconfigured runtime/provider values, unverified Supabase Auth provider settings, per-device provider refresh-token revocation limits, and absent fresh CI/live API evidence.
 

## Phase 02 — Revalidation & additive database hardening (2026-11-19)

- Revalidated the bound Supabase project directly: ref `eyofuiyxalbehbqoaeny`, `ACTIVE_HEALTHY`, PostgreSQL 17.12, region `ap-northeast-1`.
- Reconciled the public schema inventory: 12 tables, each with RLS enabled and one explicit policy. The earlier “11 tables” count was stale.
- Revalidated the migration ledger: 9 applied versions, including `20261119131809_p02_add_missing_foreign_key_indexes`.
- Applied 12 additive FK lookup indexes to the bound project and committed the matching migration source at `supabase/migrations/20261119131809_p02_add_missing_foreign_key_indexes.sql`.
- Supabase Performance Advisor no longer reports `unindexed_foreign_keys`; informational unused-index notices remain because the Phase 02 schema has minimal live data. These notices are not grounds to remove the FK indexes.
- Supabase Security Advisor revalidation returned zero lints after the additive migration.
- Read-only SQL connectivity through the Supabase connector is confirmed. This is **not** evidence that the FastAPI runtime can connect: the deployment runtime and `DATABASE_URL` are not exposed through this connector.
- Phase 02 remains **PARTIAL**. The following blockers remain external/runtime-dependent and are not marked complete: Supabase manual identity-linking and Google OAuth provider/callback settings; transactional email delivery for existing-user invitations; deployment secrets (`DATABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SECRET_KEY`, `APP_PUBLIC_URL`, exact CORS origins); live FastAPI `/readyz` and authenticated `/api/v1/auth/me`; account-status Auth Admin operation; and action-level permission mapping across all existing feature actions.
- Specific-session API denial remains enforced through the FastAPI device registry, but remote revocation of another device's Supabase refresh token is not available through the current supported Auth operation. Do not report this as remote provider revocation.
- No OAuth settings, SMTP provider, deployment secrets, or runtime service were changed by this revalidation. No credentials were read or committed.

## Next phase

Phase 02 remains in progress. Phase 03 is not authorized until Phase 02 reaches COMPLETED.


## Phase 02 — Security and invitation implementation continuation (2026-11-19)

### Code changes committed to main
- Added `services/api/app/services/invitation_email.py`: asynchronous server-side SMTP delivery for existing-user organization invitations; no token or credential logging.
- Extended FastAPI settings and `services/api/.env.example` with SMTP host, port, username/password, sender, STARTTLS and timeout placeholders. SMTP password empty-string normalization is included.
- Updated organization invitation create/resend to send existing-user email through SMTP; new Auth identities continue through Supabase Auth Admin invitation.
- Invitation accept/reject now requires a verified Auth email matching the invitation email.
- Organization creation now requires the platform-scoped `organization:create` permission; authenticated-only tenant creation is no longer allowed.
- Expanded `packages/permissions` to expose all 22 permission identifiers currently present in the target Supabase permission catalog. This is UI vocabulary, not a replacement for FastAPI enforcement.

### Commits
- `9c0168016e5b58a5cd52ddede93c8773b1484a9a` — SMTP invitation delivery service.
- `222e805df328bef9fb2b565503d741c619e0a22a` — SMTP runtime settings.
- `98f6d56396b35b81897f878ed6c98a1ee9683509` — organization authorization and invitation workflow hardening.
- `d3ecf18c47ab171908c475523ebe5b11531cf787` — SMTP environment template.
- `e38faad2638733ed185930295fd8443798b72bbc` — initial permission catalog update (immediately corrected in the next commit).
- `1e2bbfc36ff99f3f75f8cb7ecab07df02b08e141` — corrected permission catalog formatting.
- `61bedc9e6f4e286b4771e07981036f7dcc08b1c6` — normalize optional SMTP password configuration.
- Identity/security documentation commit: `87594e8ae51ab76f6cb148328febe0ab1eb730cf`. Phase-status update commit: `6a5a8e99ee0140541baa1141b2287c2e258316cf`.

### Current evidence and remaining blockers
- Supabase project remains `ACTIVE_HEALTHY`, PostgreSQL 17.12, target ref `eyofuiyxalbehbqoaeny`.
- Live migration ledger has nine versions through `20261119131809_p02_add_missing_foreign_key_indexes`; no new migration was needed for these application-layer changes.
- The 12 FK indexes from the applied migration are present in `pg_indexes`. Performance Advisor reports no `unindexed_foreign_keys`; remaining findings are informational unused-index notices on the low-volume/new Phase 02 schema.
- Security Advisor returned zero lints.
- The GitHub connector did not return any status checks for the new commits, and the available workflow-run query returned no runs for the latest push. Therefore no fresh CI pass is claimed for these latest changes. Previous API/Web/Expo CI evidence remains historical and predates this continuation.
- No FastAPI runtime host/deployment secret manager is connected in this execution context. `DATABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SECRET_KEY`, `APP_PUBLIC_URL`, exact CORS origins and SMTP credentials remain unconfigured/unverified. Supabase connector SQL access is not proof of FastAPI process connectivity.
- Supabase Auth provider configuration for Google OAuth/manual identity linking is not accessible through the connected database operations and remains unverified.
- No verified remote API request to `/readyz`, authenticated `/api/v1/auth/me`, Auth Admin ban/unban, OAuth callback or SMTP delivery has been executed.
- A selected other-device session is denied by FastAPI's session registry, but the current supported Supabase Auth operation cannot revoke only that other device's refresh token. Global/others/local Auth logout are invoked only when an active session token is available.
- Action-level permission visibility across all feature actions and every Web portal/Expo screen is not proven complete; no blanket completion claim is made.

**Phase 02 status remains IN PROGRESS / PARTIAL. Phase 03 remains locked.**


## Phase 02 — Code-ready runtime, PKCE and shared API integration (2026-11-19)

### Implementation committed to main
- FastAPI settings now load without database credentials at import time. The Supabase project URL is fixed to ref eyofuiyxalbehbqoaeny; DATABASE_URL validation accepts only the project's direct database host or a Supabase pooler username scoped to the same project.
- Centralized asyncpg pool lifecycle is implemented with TLS, bounded connect/command/statement/idle-transaction timeouts, max pool settings and statement cache disabled for Supavisor compatibility. Without DATABASE_URL, the API process can start for health checks while /readyz and database dependencies fail closed with 503.
- Supabase JWT/JWKS issuer/audience defaults remain derived from the bound project. Root and API environment examples now list all DB, Auth, CORS, public URL and SMTP variable definitions as placeholders; no secrets were populated.
- Shared AuthClient now performs Google OAuth PKCE S256, callback-bound random oauth_state validation, pending-flow expiry checks, one-time code exchange and same-user validation for identity linking. Web and Expo callbacks consume the PKCE code/state path; Expo uses the same shared client and SecureStore.
- Manual identity linking now uses Supabase Auth's user/identities/authorize endpoint rather than the former authorize?link_identity=true pattern.
- Added packages/api-client and wired it into the Web auth provider and Expo native auth hook. It imports canonical AuthContext, session, organization, member, role, invitation, account-status and error contracts from packages/api-contracts; both Web and Expo use typed /auth/me and current-session registration methods, and the client now exposes typed Phase 02 organization/invitation/member/session/account-status operations. It centralizes bearer token, platform, active organization, one refresh/retry and session invalidation handling. Added package workspace entries and Bun lock references.
- AuthContext shared contract now includes platform_permissions. /api/v1/auth/me only returns tenant roles/permissions for active memberships.
- Invitation delivery now has an InvitationDelivery provider interface and SMTP implementation. Create persists the invitation before delivery; verified existing identities use SMTP, unverified identities use Supabase Auth signup verification resend, and new identities use Auth Admin invite. Provider failures are audited; failed new Auth Admin invites are revoked. Resend uses the matching delivery path.
- Invitation acceptance revalidates active branch and organization scope. Invitation role hierarchy is checked on create and resend. Organization creation remains guarded by platform organization:create.
- No UI redesign, new Supabase project or new database was introduced.

### Validation and evidence
- The shared PKCE SHA-256 implementation was checked against the standard SHA-256 test vector (abc). This validates the local digest implementation only; it is not an OAuth provider round-trip.
- Latest code commits include:
  - 1b7d98ef55d2b2a638f69cae94d8384819b4ae44 — PKCE OAuth and same-account identity linking.
  - 478574f2858e954de9a62dd6885399448eb4b136 — callback-bound OAuth state.
  - 120395f954ae2a33c8e6df12c6dc0aa44fbc969a — Web PKCE callback.
  - 353a36fa351e1bd15cf7fab9243101eb51e18eea — Expo PKCE callback and linking.
  - fbd35509a7efac7c28beb01502ba95100d19f994 — shared API client implementation.
  - b53df9c8d1ddeb2121801f2e1ed86f9f8b1a14d1 — Web shared API client integration.
  - 48c8d846bc1180f88420024a793b8c6cc11955e1 — Expo shared API client integration.
  - c67d46e462313e665789431d8a822ef55799b7a9 — FastAPI startup/readiness lifecycle.
  - 3cfdd317d004f95d7f17563f501093da8f0d6c08 — PostgreSQL pool adapter.
  - b538cab6f3a6eb13163813bdd90c38d042eadd94 — bound-project DATABASE_URL validation.
  - 23903f7c46ee645cb80d2422936ba0398dde582f — invitation verification resend.
  - ebc54f045cb5b527377ae77c7078505992790fce — invitation delivery failure audit.
  - d46a5301723c79e7b09f6ff95d136422d0b89dc5 — API client binds to canonical API contracts.
  - 23d1c0d355cb6aedc46ee756a716e5cbc43c555e — Web /auth/me and session registration use typed API client.
  - dd253025ebab12e5cf55e7139c7043b1f608d8e3 — Expo /auth/me and session registration use typed API client.
  - b14ad893ea515c363d9263ccfc3f92cd6a80d95f — auth contract status unions aligned.
  - 87f18fe0364cf9782d5e9c6eaab98d7e9015f01b — native invitation callback uses shared API client.
  - a64466ab462371a3163aecf1c46517dbcc58942a — clear pending OAuth state on sign-out/account switch.
  - 803e3cb4dbba4440c39cbf4fa21d47b366e46c1e — reject implicit tokens when a PKCE OAuth flow is pending.
  - 9764b841602670fb83d2e24617749b024bdddd83 — enforce target Supabase issuer/audience configuration.
  - b56cc5306a7ce91c505c8464c84b632effc4fbf9 — require the canonical target-project JWKS endpoint.
  - 9735204271832a125f1093ca37061192cf4ff197 — add isolated OAuth verifier storage adapter.
  - 88edc6236f70772fbbd23e86231f489ad9f6bae8 — store Web PKCE verifier/state in tab-scoped sessionStorage.
  - fc326b6ed67620fa88e064b43dc82642441d87b0 — stabilize native deep-link callback during tenant context updates.
  - 7520edd62c577f16aef7f5a6cbe4138df6a0c636 — stabilize Web auth hydration during tenant context updates.
  - d96a045bbca18333c169bc2963796a499deea538 — deduplicate Expo initial/event auth deep-link callbacks.
  - bad97a0138cc18ace94768bc056b4192fddc6d7a — preserve multipart content types in shared API client.
  - 923a263a88cce62e942a102b102f1af99ca4dacc — cycle-safe recursive role resolution in authorization dependency.
  - 61b325185177a6e8515d69836f8320a7f6643dd8 — cycle-safe role resolution in auth context.
  - bf4fa05b24591622c8eaac560e9881a8b201d7b3 — validate default and requested branch scope before authorization.
  - 8570bffbdbc6167b930a69b0f263ff366cc4349e — omit inactive branch permissions from auth context.
  - eaf300be54c0dab91c0c03b36cabcc7259d4a516 — add Phase 02 identity/organization request and response contracts.
  - 64f178223960f8c47910f134f70930c5864ce255 — align organization list contract.
  - cdf9644c0d33868511c31f788e315c884990a6ce — add account status response contract.
  - 3aecaf9e98253a83f72e445bccac999d3818fc46 — add typed platform account status API method.
  - 1c9693c0abfb8cf7394fc48d47f8d5913a7fc025 — add typed organization/invitation/member/session API methods.
  - fbcab8eb4ee832158eb41fe09cbb459421ba1e47 — use typed invitation acceptance in Expo callback.
  - 2bc1cb4194439bb11283a7a4f295ade69a57c2ab — add linked identity contract.
  - ed42fe1eea9ca690cb2f685b86c991c93250abe3 — add typed identity list/unlink API methods.
  - b19bbdffa28afef4d441affbb0f23341e170941d — Web identity unlink uses shared API client.
  - 8c926bd9ad07964447043df51887806cacfda696 — Expo identity and invitation actions use typed API methods.
- The GitHub workflow-run query returned no runs for the new code commits; no fresh Web/Expo typecheck, FastAPI compileall/Ruff or API contract suite is claimed for this continuation.
- No OAuth provider round-trip, /readyz, authenticated /api/v1/auth/me, SMTP delivery, Auth Admin operation or remote session revocation was executed.
- The live Supabase migration ledger remains at nine versions through 20261119131809_p02_add_missing_foreign_key_indexes. No schema delta was required for these application/package changes; no migration was applied in this continuation.
- Supabase Security Advisor most recently returned zero lints. Performance Advisor has only informational unused-index notices; the 12 FK indexes remain present.

### Remaining blockers — Phase 02 remains PARTIAL
- Google OAuth provider credentials/callback allowlist and Supabase manual identity linking setting must be enabled/verified in the target Supabase Auth configuration.
- DATABASE_URL, SUPABASE_PUBLISHABLE_KEY, SUPABASE_SECRET_KEY, APP_PUBLIC_URL, exact CORS origins and SMTP credentials must be supplied in the deployment secret manager. Runtime DB readiness, Auth Admin, remote sign-out and email delivery cannot be claimed until then.
- Per-device remote Supabase refresh-token revocation for another device is not exposed by the current supported Auth operation. FastAPI's session registry denies the revoked session; provider-level local/global/others logout remains available for scopes supported by Supabase.
- Fresh CI/typecheck/build and live API contract/tenant/session checks have not been produced for the latest changes.
- Full feature-action UI visibility is not exhaustively mapped across every portal screen; the backend policy boundary is centralized and remains default-deny for protected operations.

**Official status: IN PROGRESS / PARTIAL. Phase 03 remains LOCKED and has not been started.**


### Documentation synchronization commits
- `c8c239d16ce8c284de13d39cf5483899acdb0ceb` — phase tracker synchronized with typed identity API integration.
- `53e8534a48e8228d2ab33c194c11355c447874ba` — identity/security architecture synchronized with linked identity API methods.


## Phase 02 — final implementation continuation (2026-11-19)

### Additional code blockers closed in this continuation

- Google OAuth and manual identity linking now generate an independent cryptographically random OIDC nonce and send it to the Supabase Auth authorize endpoint alongside PKCE S256. Supabase Auth is responsible for validating the upstream provider ID-token nonce; Google credentials and provider enablement remain deployment-dependent.
- Corrected the organization invitation callback URL for both create and resend. The callback now carries the raw token as `organization_invite=<token>`; the previous string replacement incorrectly generated `organization_invite=token=<token>`. The Web callback continues to route the verified user to the explicit accept/reject screen; Expo completes acceptance through the typed FastAPI client after verification.
- Added one cycle-safe inherited role hierarchy resolver for invitation create/resend, member role assignment and assignable-role discovery. Delegation is evaluated against platform, tenant and exact target-branch scope, and no longer relies only on directly assigned roles.
- Invitation create now rejects an already-active or suspended membership. Invitation resend revalidates that the stored branch scope is still active and belongs to the same organization.
- Web portal descendants are remounted when the account or active organization changes. Expo exposes a context epoch and remounts the native Sales screen on account/tenant changes. This clears in-memory screen state without changing the existing UI design.
- No database schema delta was introduced by these changes; no migration was required or applied.

### Latest code commits

- `fb9511cf5472d2ad433fb2460c0129e73d97a4c2` — add OIDC nonce to Google OAuth sign-in and identity-link authorization.
- `9cf0d118432f4ca99311143c19daa9edbe5d661a` — cycle-safe inherited delegation hierarchy and corrected initial invitation callback.
- `50e39f4821e0378b93510526bf71618b4f2ace1d` — correct invitation callback token on resend.
- `41ad908e3e15e37996939cd99681c5cab249d256` — remount Web portal consumers on tenant/account context changes.
- `8bf6a955143c10139133534c8490b04f26638051` — expose native auth context epoch.
- `67e612b6a7c505a13fbd81b93a8753b613a67c61` — remount native Sales screen when tenant context changes.
- `0bcbd483d7d8e5e2db7a45c8f3e0eba3416b5809` — apply inherited scope-aware delegation checks on invitation resend.
- `2f396dcb914dcb4410b4703a81586546349031a5` — reject duplicate active/suspended memberships and stale branch scope during invitation resend.
- `eb966f68926c88a31fd0872587057ea562d3fd75` — preserve the explicit Web invitation accept/reject screen after callback verification.
- Latest verified code/documentation head for this continuation: `eb966f68926c88a31fd0872587057ea562d3fd75`.

### Current validation evidence

- Supabase project `eyofuiyxalbehbqoaeny`: `ACTIVE_HEALTHY`, PostgreSQL 17.12, region `ap-northeast-1`.
- Migration ledger remains at 9 applied versions through `20261119131809_p02_add_missing_foreign_key_indexes`; no migration was needed for this application-layer continuation.
- Read-only SQL confirms 12 public tables, 12/12 RLS enabled, and one explicit policy on each of the 12 tables.
- Security Advisor: zero lints.
- Performance Advisor: informational `unused_index` notices only (24 findings on the low-activity schema); no FK-index regression was reported. Existing FK indexes are retained.
- GitHub combined commit status for the latest code head returned no status entries; the workflow-run query returned no runs for the latest code head. Therefore no fresh typecheck/build, FastAPI compileall/Ruff, or API contract test is claimed for these additional commits.
- No live `/readyz`, authenticated `/api/v1/auth/me`, Google OAuth round-trip, SMTP delivery, Supabase Auth Admin ban/invite, or device revocation operation was executed.

### Revocation boundary and remaining blockers

- FastAPI checks the Supabase `auth.sessions` row, `session_devices.revoked_at`, profile account status and `session_revoked_at` on protected requests. A session revoked through `DELETE /api/v1/auth/sessions/{session_id}` is denied by the backend; the shared API client clears the local session/context when it receives the explicit revoked-session response.
- Supabase Auth's supported sign-out scopes remain `local`, `global` and `others` for the authenticated session. Supabase does not expose a supported operation to revoke only an arbitrary other device's refresh token by session ID. The per-device FastAPI deny-list therefore enforces product API revocation, but does not revoke that remote Supabase refresh token. This is an explicit unresolved provider-level blocker; it is not reported as complete.
- Google OAuth provider credentials, callback allowlist and manual identity-linking settings remain unconfigured in Supabase Auth.
- Deployment secrets remain intentionally unset: `DATABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SECRET_KEY`, `APP_PUBLIC_URL`, exact `CORS_ORIGINS`, and SMTP credentials. Runtime DB readiness, Auth Admin operations and invitation email delivery remain deployment-dependent.
- Full permission-aware visibility/action mapping across every existing portal feature screen is not yet evidenced exhaustively. FastAPI remains the authoritative default-deny boundary for the Phase 02 protected endpoints.

**Official status remains IN PROGRESS / PARTIAL. Phase 03 remains LOCKED and has not been started.**


## Phase 02 — final continuation hardening (2026-11-19)

### Additional implementation completed

- OAuth pending transactions now consistently use the platform-specific `oauthStorage` adapter for create, read, expiry cleanup, successful exchange, cancellation and sign-out cleanup. This fixes the previous Web adapter mismatch where pending PKCE state could be read/cleared from localStorage instead of tab-scoped sessionStorage. Provider-denial callbacks now validate the callback-bound state before clearing the pending flow.
- Google sign-in and manual identity linking carry an independent cryptographically random OIDC nonce to Supabase Auth together with PKCE S256. Supabase Auth is the provider-side ID-token nonce validation boundary; no Google credentials were committed.
- Invitation callback URLs for create/resend carry the raw token in `organization_invite=<token>`. Web preserves the explicit accept/reject screen; Expo accepts through the typed API client after verification. Invitation role hierarchy now uses inherited roles, exact tenant/branch scope, the permission that authorizes the action and the same ABAC conditions as `require_permission`.
- Member status changes now compare the actor's delegable hierarchy with the target member's effective hierarchy, protect platform-scoped identities from tenant-admin status changes, and revoke active role assignments when a membership is removed. Invitation acceptance cannot rebind an already-active membership; invite creation rejects active/suspended memberships; resend rejects stale/inactive branch scope.
- Platform account suspension/deactivation now commits the FastAPI deny state, revocation epoch and device revocations before calling Supabase Auth Admin. If Auth Admin credentials/provider calls fail, the database still denies access and the failed provider ban is audited. Reactivation preserves the prior session revocation epoch.
- Session registration records Supabase `auth.sessions.not_after` into `session_devices.expires_at`; the principal resolver rejects expired `not_after` sessions as well as missing Auth sessions, revoked device rows, inactive accounts and old JWTs relative to the revocation epoch.
- Web portal access screens now use typed API client methods for organization members, assignable roles, invitations, linked identities, platform account status and session list/revocation. The Web auth context exposes the shared typed client. Expo uses the same typed client for auth context, session registration, sign-out, invitation acceptance, identity unlink and session list/revocation.
- Web portal descendants and the Expo Sales auth screen are remounted on account/tenant context changes, clearing prior in-memory screen state. Existing UI layout and design tokens were preserved.
- FastAPI now adds security response headers, a configurable request `Content-Length` bound (default 1 MiB), rejects unbounded chunked request bodies, and validates `APP_PUBLIC_URL` as an exact HTTP(S) origin consistent with configured CORS origins.
- No database schema delta was required by these application-layer changes. The target migration ledger remains at 9 applied versions.

### Latest validation evidence

- Read-only Supabase SQL verified the recursive permission/ABAC delegation CTE and target-member hierarchy CTE parse against the live schema.
- Read-only schema inspection confirmed `auth.sessions.not_after` and `public.session_devices.expires_at`; code maps the actual Auth column `not_after` rather than assuming an `expires_at` column on `auth.sessions`.
- The current Supabase migration ledger remains nine applied versions through `20261119131809_p02_add_missing_foreign_key_indexes`.
- Public schema inventory remains 12 tables, all 12 have RLS enabled and one explicit policy each. Security Advisor remains zero lints. Performance Advisor currently reports 24 informational unused-index notices only.
- Latest code head: `8ff15f6e6abecde6400207ab2331908a15076848`. GitHub combined commit status has no status entries and workflow-run query returned no runs for this head. No fresh Web/Expo typecheck/build, FastAPI compileall/Ruff, or API contract suite is claimed.
- No live API, OAuth/Google provider, SMTP, Auth Admin, runtime DB connection or session-revocation request was executed.

### Remaining mandatory blockers

- Supabase Auth does not expose a supported API to revoke one arbitrary other device's refresh token by session ID. The backend deny-list blocks that device from every protected SalesX-Ai API request, while supported Supabase logout scopes remain local/global/others. Provider-level single-device refresh-token revocation remains unresolved.
- Google OAuth credentials, provider enablement, callback allowlist and manual identity-linking setting remain deployment-dependent.
- Deployment secrets remain intentionally unset: `DATABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SECRET_KEY`, `APP_PUBLIC_URL`, exact `CORS_ORIGINS` and SMTP credentials. Auth Admin invite/ban, SMTP delivery and runtime readiness cannot be reported as live.
- API rate limiting and broader abuse controls are not yet implemented in FastAPI; Supabase Auth's own rate-limit configuration is not verified. The current middleware only enforces bounded declared request bodies and rejects chunked bodies.
- Full permission-aware visibility/action mapping across every existing portal feature screen is not yet evidenced exhaustively. The Phase 02 organization, identity, invitation, membership, role, account-status and session surfaces now use typed API methods and server-side authorization.
- Browser Supabase sessions remain in the existing localStorage adapter; same-origin XSS exposure is documented and an HttpOnly SSR cookie migration remains outside this continuation.
- No fresh static CI/typecheck/build evidence exists for the latest commits.

**Official status remains IN PROGRESS / PARTIAL. Phase 03 remains LOCKED and has not been started.**


### Documentation synchronization

- `e7c31b8374d4b19e4017009999dfc8c036f80459` — phase tracker records final hardening, current validation evidence and all remaining blockers.
- `da727c5247599623c957a55b5d4a92bfed4bfa3a` — identity/authorization engineering document synchronized with final code.
- Latest repository head after documentation synchronization: `da727c5247599623c957a55b5d4a92bfed4bfa3a`.


## Phase 02 — final implementation continuation and evidence (2026-11-19)

**Current official status: PARTIAL — Phase 03 remains LOCKED.** This addendum supersedes earlier historical notes above where they state that rate limiting and the Web HttpOnly migration were still outstanding.

### Implementation committed to main

- **Session/device revocation:** FastAPI retains the per-device session_devices registry and checks live auth.sessions, not_after, device revocation, profile status and the session_revoked_at epoch on protected requests. Added BFF-only POST /api/v1/security/refresh-authorize: it verifies the prior JWT signature/issuer/audience with expiry ignored only for this gate, then requires an active, verified account, live Auth session, registered non-revoked device and a current revocation epoch. Web and Expo Auth BFFs call this gate before submitting a refresh token to Supabase Auth. This prevents a revoked device from refreshing through SalesX-Ai or using protected APIs. It does not revoke an arbitrary other device's provider refresh token; Supabase does not expose that individual operation.
- **Distributed rate limiting:** services/api/app/services/rate_limit.py enforces PostgreSQL-backed atomic fixed-window buckets for sensitive FastAPI routes, with IP/account/identifier partitions, HMAC pseudonymous bucket keys when the BFF secret is configured, fail-closed storage errors, Retry-After responses, security logs and bounded cleanup. The server-only POST /api/v1/security/rate-limit applies the same shared store to Web and Expo Auth BFF actions: login, signup, OTP send/verify, email verification, password recovery/update, OAuth start/complete, identity link, refresh and sign-out. No in-memory limiter is used as the production source of truth.
- **Web session hardening:** lib/auth/web-session.ts, app/api/auth/[...action]/route.ts, app/api/backend/[...path]/route.ts and middleware.ts implement the server-side Auth BFF, HttpOnly access/refresh cookies, Secure production cookies, SameSite policy, CSRF/origin checks, server-side refresh, tokenless browser session view and API proxy. Legacy browser localStorage/sessionStorage auth material is purged on provider initialization. Existing portal UI is preserved.
- **Expo and shared API:** Expo uses expo-secure-store, the shared AuthClient and typed API client. The native Auth BFF applies distributed rate limits and the session refresh gate. Auth context, current-session registration, tenant selection, invitation acceptance, identity linking/unlinking, session list/revocation, sign-out and account-switch state clearing use shared FastAPI contracts.
- **OAuth/invitation:** PKCE S256, callback-bound state, independent OIDC nonce, ten-minute transaction lifetime, one-time code exchange and original-user identity-link binding remain implemented. Invitation create/send/resend/accept/reject/expire/revoke and scope-safe role delegation remain implemented. Google provider activation/callback allowlist and SMTP/Auth Admin credentials are deployment configuration.
- **Authorization:** central FastAPI RBAC/ABAC, tenant/branch ownership checks, self-scoped identity permissions and Super Admin navigation permission filtering are implemented. The full feature-action matrix across every business screen, button, menu and native business action is not yet exhaustive. No future business API is represented as protected until it has an explicit permission/resource-ownership dependency. This is the remaining code-level Phase 02 blocker.

### Latest static validation evidence

- API workflow 44568450839 on fddf5a61676eabc1f6fcba6c1e693b3db8a8f083: Python unit tests, compileall, Ruff, Web typecheck and Web lint passed.
- API workflow 44568637366 on b846a4cd77496cefd997c5d12ab4806bbcafea42: API unit tests, compileall, Ruff, Web typecheck and Web lint passed.
- API workflow 44568750746 on 1b9aaece24a6a8c4a983535e4a0da9fe7062be8c: SUCCESS. Targeted refresh-gate tests for active registered sessions, revoked/unregistered devices, inactive accounts and BFF-secret enforcement passed; API unit tests, compileall, Ruff, Web typecheck and Web lint all passed.
- Foundation workflow 44568637437 on b846a4cd77496cefd997c5d12ab4806bbcafea42: SUCCESS. Bun workspace install/frozen lockfile, canonical token build/check, Web TypeScript/lint, Expo TypeScript/dependency compatibility/config/Metro, Android/iOS export and Turborepo workspace build all passed.
- No staging, production deployment, real-world test or live Auth/SMTP provider verification was run.

### Bound Supabase evidence

- Target: eyofuiyxalbehbqoaeny, PostgreSQL 17.12.
- Applied migration ledger: **13 versions**, through 20261119150146_p02_rate_limit_deny_client_policy. The four added Phase 02 migrations are 20261119143440_p02_distributed_rate_limit_buckets, 20261119145000_p02_identity_link_permission_and_self_scopes, 20261119145850_p02_rate_limit_table_rls, and 20261119150146_p02_rate_limit_deny_client_policy.
- Public schema: 12/12 tables have RLS enabled and exactly one explicit policy each. The private rate-limit table also has RLS enabled and one explicit deny-client policy. No anon/authenticated grants exist on app_private.api_rate_limit_buckets.
- Supabase Security Advisor: zero lints. Performance Advisor: 25 informational unused-index notices only; no security or unindexed-FK finding.
- No Phase 02 tables are included in supabase_realtime; Realtime impact is N/A because authorization and session state are re-read from PostgreSQL synchronously for every protected request.
- No schema migration was required for the latest refresh-gate code; it uses the existing auth.sessions and session_devices columns.

### DEPLOYMENT_PENDING — intentionally not configured

DATABASE_URL, SUPABASE_PUBLISHABLE_KEY, SUPABASE_SECRET_KEY, SALESX_API_URL, SALESX_BFF_SHARED_SECRET (32+ random characters), APP_PUBLIC_URL, exact CORS_ORIGINS, Expo Auth BFF/API origins, Google OAuth provider credentials/enablement/callback allowlist/manual identity-linking setting, and SMTP credentials. No credentials were requested, populated, committed or inferred. No live runtime, OAuth callback, SMTP delivery, Auth Admin operation or provider refresh-token revocation is claimed.

### Remaining Phase 02 closure gate

- Full permission-aware feature-screen/action mapping across all existing Web and Expo business actions remains incomplete. The centralized backend policy layer exists, but the current product screens include business capabilities whose corresponding domain APIs/permission contracts are not yet implemented. Phase 02 must remain PARTIAL until the required existing action matrix is explicitly mapped and its server enforcement exists.
- Latest API and foundation workflow statuses are SUCCESS as recorded above. Latest code/test head before documentation synchronization is 1b9aaece24a6a8c4a983535e4a0da9fe7062be8c. The refresh-gate implementation chain includes ffdf9dd5bcfd55b1c0d74d853aa3752d7ae1a3e0 (expired JWT signature verification mode), b29b189be5e9eaad98aaf7a60f95959f528f56f8 (FastAPI refresh gate), d71eca3f670478865e9e0931ae21f12c21cc645e (BFF gate client), 0a8f8cb9cf449c8fc1e1be09b25d0e7a2c167beb (Web Auth refresh), 47635c857e26581e74e783e4b15f4fa2b87a5b53 (Web API proxy refresh), 1c38b332400778b2797f3347be74cf9bc0124fec (native BFF refresh), 7772f54ccbf18841779c7e536ea8a0fbae76f56f (native prior-token binding), and 1b9aaece24a6a8c4a983535e4a0da9fe7062be8c (revocation-gate tests). Documentation sync commits before this tracker update: 6115ffee6864ecc4519c558bb47e811e0d409569 and af3fd7c6eb85ad1514e906f01766b77ec44ea5bd. The final repository head is the commit created by this tracker synchronization and is reported in the execution summary.
- Phase 03 remains LOCKED and has not been started.


## Phase 02 — action authorization implementation continuation (2026-11-19)

### Implemented on main
- Added a canonical FastAPI API action registry at `services/api/app/security/action_matrix.py`. It declares all **27 currently registered /api/v1 route-method contracts**, including feature, action, permission key (where applicable), scope and server-enforcement description.
- FastAPI startup now validates route-to-matrix parity and fails startup if a registered API route is unmapped or a matrix contract is stale.
- Added a shared TypeScript API action matrix and resolver at `packages/permissions/src/action-matrix.ts`, exported from the permissions package.
- Web Auth provider and Expo Mobile Sales auth hook expose the shared `canPerformApiAction` resolver using effective active-tenant plus platform permissions. This is a client visibility hint; FastAPI remains authoritative.
- Added explicit `profile:read:self` and `profile:update:self` checks to session list and session revoke endpoints. Session ownership remains restricted to the authenticated user.
- Permission dependency denials write credential-free audit records with actor, tenant when resolved, API resource path, action, method, permission and correlation ID. The API error handler also records permission/resource-level 403 denials not already audited by the dependency. No credentials or bearer material are written.
- Added `services/api/tests/test_action_matrix.py` to check route coverage, uniqueness and permission declaration for tenant/platform actions.
- No Supabase schema change was required for these code-level controls; no migration was created or applied.

### Commit chain
- `570e0af01e7c7719a399712d89df87c2f102b5e4` — audit denied permission checks.
- `500bdcb71d238c677c8ef476759d3963e9a5fc3e` — audit resource-level authorization denials.
- `6da43ee1042e8836b0f9d0f3cda5e732867bc950` — platform permission dependency request binding.
- `bcb5eae0655f23ae4b981bf991fdb07e29b3fe6e` — canonical FastAPI action matrix.
- `3b234dbd26bd21914d7148d64735218264eebe86` — fail startup on unmapped API routes.
- `6da938adc197d8c7dfa37e43c82756e4de1aa232` — session self-permission enforcement.
- `b844244387e15812a9c2891d95ff51a80d98e957` — shared TypeScript API action matrix.
- `19bcc9fe3f61080c72072a5c9fb8ec8f67523395` — export shared action resolver.
- `9a728dca1e9ed544637585dc60e1573c0aaf4213` — expose resolver to Web consumers.
- `515174a526819bf28807580166964d212933593f` — expose resolver to Expo consumers.
- `493f0429a8df83b70ba2dc0cd76c2078b56473bf` — add action matrix tests.
- `6920f924b5daeb7255eb4e235fe45027c446b023` — Ruff import modernization.
- `0116be2327154ea12800df64c58ab6f750eac36d` — correct action matrix test assertions.

### Explicit remaining Phase 02 blockers
- The 27-entry registry covers the **currently implemented FastAPI API surface only**. It does not establish full action coverage for every business screen, navigation item, button and handler in the seven Web portals and Expo.
- The current repository still lacks FastAPI domain endpoints for multiple UI business capabilities (including sales visits/attendance, orders/catalog/inventory, rewards, location/route, analytics and notifications). Several existing UI interactions remain local state/demo behavior. No endpoint enforcement can be claimed for actions that do not yet have a backend endpoint.
- The shared Web/Expo resolver is exposed through auth context, but the complete UI action-handler integration and replacement of local-only business mutations remains unfinished.
- Existing Supabase role_permissions currently contains 23 permission keys across eight roles. No broad role grants were added for not-yet-implemented domain actions; doing so would grant access without corresponding server-side business services.
- No new database migration, RLS or grant change was required for this code-only continuation. The existing 13 applied Phase 02 migration versions remain unchanged.
- Latest static CI for the continuation is being reconciled after initial failures in Ruff import modernization and action-matrix test assertions. No green result is claimed in this addendum.



### Validation evidence — action authorization continuation

- API workflow **44572852325** on code head `0116be2327154ea12800df64c58ab6f750eac36d`: SUCCESS.
  - 26 Python unit tests passed, including 3 action-matrix coverage tests.
  - FastAPI `compileall` passed.
  - Ruff passed.
  - Web TypeScript passed.
  - Web lint passed.
- Foundation workflow **44572686520** on code head `515174a526819bf28807580166964d212933593f`: SUCCESS.
  - Bun frozen workspace install and canonical token generation/reproducibility passed.
  - Web TypeScript/lint passed.
  - Expo Native TypeScript and SDK compatibility passed.
  - Expo app config and Metro startup passed.
  - Android and iOS JS bundle exports passed.
  - Turborepo workspace build passed.
- The follow-up commit `4b4b411e8258af68fb5a70722e110551d0eec975` makes BFF-only API action IDs return false from the client resolver. API workflow **44572989578** on this commit completed SUCCESS, including API tests, compileall, Ruff, Web TypeScript and Web lint. The separate foundation workflow **44572989593** was still running its Expo/native verification at the time of this update.
- No live Auth provider, SMTP, runtime DB, deployment, or real-world behavior is claimed.

**Official Phase 02 status remains IN PROGRESS / PARTIAL. Phase 03 status remains independently tracked and does not change Phase 02 closure criteria.**


## Phase 02 — full action authorization continuation (2026-11-20)

### New implementation on main
- Added explicit `resource` and `rolePolicy` metadata to the shared TypeScript action contracts and matching `resource` / `role_policy` metadata to the FastAPI registry. The `scope` field remains the self/tenant/platform/BFF boundary. This makes the existing 27 endpoint contracts express resource, action, permission, role policy, scope and endpoint together.
- Expanded action-matrix unit coverage to require non-empty resource and role-policy metadata and a valid scope for every contract.
- Wired the shared resolver into the existing Web Organization Access Console for session list/revoke, linked identity list/link/unlink, membership read/update, assignable roles, invitation read/create/resend/revoke; the Platform Account Security Console now gates account-status mutation through the same resolver.
- Fixed the session-list consumer so it does not call the protected endpoint when the effective self-scoped read permission is absent. Mutation handlers re-check the resolver before sending the typed API request.
- Added `docs/implementation/phase-02-action-inventory.md` with the seven Web portal surfaces, Expo surface, current 27 API contracts, 13 Web action gates, live permission/role evidence and remaining gaps.

### Commits
- `e076ed934ee17fa95ce95742c12bee2eeee71df9` — Web access UI resolver integration.
- `662da074c5088cf40be3aa30e3d9f6fb89afe6b8` — platform account status UI resolver integration.
- `fcb43e5a6256c6a6252a91cc8cda2018f259897c` — shared TypeScript resource/role-policy contract metadata.
- `03dcdc66419537857e5b56c481667f34dcd959f7` — FastAPI resource/role-policy metadata parity.
- `f18b7904ad2c127486d60243d66033d9f1aecf1e` — metadata completeness tests.

### Live database evidence (read-only; target ref verified)
- Project ref `eyofuiyxalbehbqoaeny`; current project remains ACTIVE_HEALTHY.
- `public` schema: 12 tables, all 12 have RLS enabled.
- Permission catalogue: 23 keys; 8 roles; 90 role-permission grants.
- Supabase Security Advisor: zero lints.
- Existing Phase 02 migration ledger remains at 13 applied versions. No new migration was required for this application-code-only continuation; no RLS/grant/schema/Realtime publication change was made.

### Validation status
- Earlier API workflow `44572989578` and foundation workflow `44572989593` both completed SUCCESS on code head `4b4b411e8258af68fb5a70722e110551d0eec975` (including API tests/compileall/Ruff, Web typecheck/lint, Expo Native typecheck/config/Metro and Android/iOS bundle exports, plus workspace build).
- The commits in this continuation were made after that successful run. No fresh successful CI result for `e076ed9`, `662da07`, `fcb43e5`, `03dcdc6` or `f18b790` is claimed here.

### Remaining closure blockers
- Full page/route/menu/button/handler inventory across all seven Web portals and Expo has not been proven exhaustive; the repository surface inventory is documented, but not every screen/action has been inspected and mapped.
- Expo exposes the shared resolver but full native screen/action-handler wiring remains unproven.
- The 27 contracts cover existing FastAPI routes only. SmartTeam, SmartOrder, SmartReward, Location, Analytics and Workflow business mutations still do not have their complete domain API/service slices in this Phase 02 implementation; no placeholder endpoints or broad permission grants were added.
- Local/demo-only business interactions in existing feature screens have not been comprehensively replaced by server-backed mutations or proven fail-closed.
- Fresh static validation is required for the latest commits before any completion decision.

**Decision: Phase 02 remains PARTIAL / IN PROGRESS. Phase 03 remains NOT STARTED.**


## Phase 02 — FastAPI runtime resolver wired to canonical action contracts (2026-11-20)

### Implementation committed to main
- Added stable action IDs to all 27 Python `ApiActionContract` entries; the Python and TypeScript matrices now share the same action ID, method, route, feature, action, resource, role-policy metadata, permission, scope and enforcement description.
- Added `require_api_action(action_id)` to FastAPI authorization dependencies. It resolves the action contract at runtime and dispatches to the existing self, tenant or platform server-side authorization dependency. Unknown IDs fail closed; BFF-only IDs are rejected by this factory and continue to use their explicit shared-secret gate.
- Rebound all 25 user-authenticated route contracts across Auth, Organization, Admin and Audit routers to the canonical runtime resolver. The two BFF security routes remain protected by the existing explicit shared-secret + session/rate-limit checks.
- Extended tests to check action-ID uniqueness, runtime resolver dispatch for all user-scoped actions, rejection of BFF actions from user dependencies, and rejection of unknown action IDs.

### Runtime resolver commit chain
- `487484162ce56df2014988cbbcd1b7f859d50c33` — add shared action IDs to FastAPI registry.
- `ee86d35a3557d854e93a0ca7f25282d048030fa4` — add canonical runtime dependency resolver.
- `04223c2679dcf3d4201b409ab0d609b54b7dbc71` — bind organization routes to action IDs.
- `399368380ff4a44119b620751a8e581cdd848140` — bind identity routes to action IDs.
- `7a321438d92ee237d04c6661bc3a45d1d0eab315` — bind platform routes to action IDs.
- `14ccd6e67cdb206b1bd67afdc40f69ad0a8e3ace` — bind audit route to action ID.
- `fd67aa4bd0763b94808ae74edae479fd6444e995` — test runtime resolver and unknown/BFF denial.
- `47c53c4a08b4b718f362c868492ffdb23cb2236a` and `1b0b88782e196d0d6f523bbbbbb89de413d19369` — import ordering.

### Static source checks performed in this continuation
- TypeScript action contracts parsed: 27; FastAPI contracts parsed: 27.
- Cross-language contract parity check: 27/27 matching on ID, method, path, feature, action, resource, role policy, permission, scope and enforcement description.
- User-scoped route dependencies referencing `require_api_action`: 25 unique IDs; all 25 non-BFF contracts are referenced exactly once by the inspected router sources.
- BFF routes: two explicit shared-secret gates retained; no BFF contract can be passed to the user dependency resolver.
- Web action resolver integration: 13 gates in the two existing Phase 02 access consoles.
- These checks are source-level checks performed through the GitHub file connector; they are not a substitute for the Python unittest/Ruff or Web/Expo typecheck CI jobs.

### Validation status and remaining blockers
- Latest prior API/foundation workflows `44572989578` and `44572989593` succeeded on the earlier code head `4b4b411e8258af68fb5a70722e110551d0eec975`. The latest resolver commits post-date those runs; no fresh CI pass is claimed for this commit chain.
- Live Supabase evidence remains: 13 applied migrations, 12/12 public tables RLS-enabled, 23 permission keys, 8 roles, 90 role grants, Security Advisor zero lints. No migration or grant change was required for the runtime dependency refactor.
- Full route/screen/menu/button/handler inventory across all seven Web portals and Expo remains unproven; full native screen/action-handler wiring is not yet evidenced.
- Business-domain mutations for SmartTeam, SmartOrder, SmartReward, Location, Analytics and Workflow remain outside the current API contract set and must be implemented in their designated domain phases. They are not falsely declared covered by Phase 02.
- Latest static CI for the resolver commit chain is still required before closure.

**Phase 02 remains PARTIAL / IN PROGRESS. Phase 03 remains NOT STARTED.**


## Phase 02 — final source reconciliation for this execution (2026-11-20)

- Latest repository head before this tracker entry: `e3c60447d522306302a48ab64a918f78df6444ed` (action inventory documentation update). The tracker update commit becomes the new main head.
- Repeated source-level reconciliation against current `main`: TypeScript 27 contracts; Python 27 contracts; 27/27 parity across action ID, method, path, feature, action, resource, role policy, permission, scope and enforcement.
- All 25 non-BFF contracts are referenced by 25 unique `require_api_action` route dependencies. The two BFF endpoints retain explicit shared-secret protection.
- Thirteen Phase 02 Web action gates are present in the two existing access consoles. Expo still only exposes the resolver; exhaustive native consumer wiring is not evidenced.
- The current commit combined-status query returned no status contexts for the latest documentation commit. Therefore no fresh API/Web/Expo typecheck, compileall or Ruff success is claimed for the new runtime-resolver/UI commits. Earlier successful workflow runs remain historical baseline only.
- Bound Supabase read-only evidence remains unchanged: 13 applied migrations, 12/12 public tables RLS-enabled, 23 permission keys, 8 roles, 90 role grants, and Security Advisor zero lints. No schema migration or grants were changed during this code continuation.

**Phase 02 remains PARTIAL. The DoD is not satisfied because exhaustive Web/Expo action inventory and wiring, business-domain endpoint/service coverage, and fresh static CI evidence are still outstanding. Phase 03 remains NOT STARTED.**


## Phase 02 — final implementation reconciliation (2026-11-20)

This section supersedes earlier Phase 02 addenda where SmartTeam, SmartOrder, SmartReward, Location, Analytics or Workflow were listed as Phase 02 blockers. Engineering Execution Master Plan v1.0 assigns those business domains to later phases; Phase 02 remains the Identity, Tenant & Authorization Foundation. Their existing portal UI modules are recorded in `docs/implementation/phase-02-action-inventory.md` as later-phase surfaces.

### Latest implementation evidence
- Shared TypeScript and Python action matrix: **28/28 exact contract parity** across action ID, method, path, feature, action, resource, role policy, permission, scope and enforcement description.
- FastAPI route enforcement: **26/26 user-scoped routes** use `require_api_action`; two BFF routes use explicit BFF markers and shared-secret enforcement. Startup validation rejects unmapped/stale routes and mismatched action dependency IDs.
- UI action resolver: **18 unique Phase 02 action IDs** consumed across Web and Expo; 40 resolver call sites across the inspected access, Super Admin, invitation and native auth components.
- Service/repository layer: authorization persistence repository and RBAC/ABAC application service now own principal/session, active membership, self/tenant/platform permission, branch-scope and denial-audit queries. Service boundary asserts action ID, actor and tenant before protected Phase 02 route operations (16 assertions).
- Web/Expo: all seven authenticated Web portal surfaces retain shared portal access resolution; Web access, invitation and Super Admin identity/audit actions use the shared action resolver. Expo native session/identity/invitation actions use the same resolver and typed API client. Context fingerprint/epoch invalidates consumer state when account, membership, role, permission or active tenant changes.
- Platform audit read API added at `GET /api/v1/admin/audit`, platform-scoped `audit:read`, rate-limited, and itself audited. Account and role directory reads now use least-privilege `account:read` and `role:read` rather than mutation permissions.

### Full portal source inventory evidence
- Seven Web portal components scanned: **443 JSX onClick sites**, **7 onSubmit sites**; Expo Sales source: **17 onPress sites**.
- Six non-Super-Admin domain portal components currently have no typed API client call sites or action-level permission resolver calls. Their business features are assigned to later domain phases, not claimed as implemented mutations in Phase 02.
- Super Admin navigation now fails closed for modules without Phase 02 contracts; only Users, Roles and Audit Logs remain visible in this phase.
- The 18 unique Phase 02 UI action IDs and per-portal module inventory are recorded in `docs/implementation/phase-02-action-inventory.md`.

### Live Supabase evidence after three additional migrations
- Applied migration count: **16**.
- Public tables: **12**, RLS enabled on **12/12**.
- Permission keys: **25**; roles: **8**; role-permission grants: **92**.
- New `account:read` and `role:read` grants are assigned only to `platform_admin`.
- `admin_audit_logs`: client roles `anon` and `authenticated` denied by policy; application `service_role` restricted to SELECT/INSERT; append-only trigger and platform partial index verified.
- Security Advisor: **0 lints**.
- Applied migration files now aligned with Supabase migration versions: `20261119172508`, `20261119173915`, `20261119174508`.

### Fresh static CI evidence
- Phase 02 API Checks **#266**, run `44580580455`, validated code head `ffffde450adc8a0ee5c41452d835b822dc427d08`: SUCCESS. 39 Python tests passed; compileall, Ruff, Web typecheck and Web lint passed.
- Foundation Verification **#181**, run `44580441850`, validated Web/Expo source head `0f3e73722b68da18a8d6040c4fab15ed42f098fe`: SUCCESS. Bun workspace install, design tokens, Web TypeScript/lint, Expo Native TypeScript, SDK/config/Metro, Android/iOS bundle exports and Turborepo build passed. No Web/Expo source changes occurred after this Foundation run; subsequent commits changed only API/database tests/migrations and docs.
- No staging, deployment, provider-live verification or real-world testing was run.

### Remaining closure blockers
1. The authorization service/repository is implemented, and 16 Phase 02 route operations assert the authorized action/actor/tenant at the service boundary. However, several existing Phase 02 mutation handlers still contain domain SQL in router functions rather than delegating each mutation to its own application service and mutation repository. This does not yet satisfy the requested per-mutation service/repository architecture.
2. The seven portal source inventory records all module surfaces and source event-handler counts, but every future-phase click handler has not yet been assigned an individual resource/action/permission/API contract. This is broader than the Phase 02 identity/tenant scope but remains part of the requested full platform action inventory.
3. Deployment-dependent credentials and provider configuration remain intentionally unset.

**Decision: Phase 02 remains PARTIAL / IN PROGRESS — NOT COMPLETED.** The action matrix, 28 API contracts, Web/Expo Phase 02 resolver integration, authorization service/repository, platform audit, RLS/grant evidence and fresh static CI are in place. Do not close Phase 02 until the remaining mutation-specific service/repository separation and handler-level action inventory are complete.

**Phase 03: NOT STARTED in this execution.** A separate parallel workstream may be opened only with isolated Phase 03 migrations, domain ownership and API contracts; it must not alter Phase 02 completion evidence.


# Final reconciliation — Phase 02 closure and Phase 03 parallel stream (2026-11-20)

This entry supersedes earlier status addenda below for the current execution. Phase numbering follows root `AGENTS.md` and the Engineering Execution Master Plan v1.0:
- Phase 02 — Identity, Tenant & Authorization Foundation.
- Phase 03 — Master Data, Organization, Branch, Territory, Team & Outlet.

The Master PRD v1.0's legacy “Master Phases” list uses a different numbering for its early phases. Root `AGENTS.md` explicitly directs implementation to follow the Engineering Execution Master Plan sequence; this tracker therefore uses the latter sequence without modifying the PRD baseline.

## Phase 02 — COMPLETED

### Implementation and architecture
- 14 mutation routes moved to dedicated application services and mutation repositories:
  - Account administration: 1.
  - Session lifecycle: 3.
  - Identity lifecycle: 1.
  - Organization/membership/role: 4.
  - Invitation lifecycle: 5.
- Added dedicated read service/repository boundaries for identity context/session/identity reads, organization/member/role-delegation reads, platform user/role/audit reads, and tenant audit reads.
- BFF session-refresh authorization now delegates database/session checks to `SessionMutationService`.
- All registered FastAPI router files contain **zero direct connection SQL calls** and **zero domain DML statements**. Router-only HTTP/dependency/validation/service invocation is enforced by `services/api/tests/test_phase02_mutation_architecture.py`.
- Authorization repository/service, verified Supabase Auth JWT, active tenant context, organization/branch scope, profile, RBAC/ABAC, session lifecycle, invitation lifecycle, platform/tenant audit and shared Web/Expo auth clients are implemented.
- Existing Web/Expo Phase 02 action gates remain integrated: 18 unique Phase 02 UI action IDs and 40 resolver call sites.
- Full handler inventory committed at `docs/implementation/handler-level-action-inventory.tsv`: 868 callback/event prop occurrences across seven Web portal components and Expo Sales. It records 443 Web `onClick`, 7 Web `onSubmit`, 17 Expo `onPress`, plus custom component callbacks and UI state handlers. Future-phase actions are explicitly assigned to their owning phase without inventing endpoints or permissions.

### Contracts and authorization
- Canonical action registries: **50/50** Python and TypeScript action IDs match exactly.
- Phase 02/platform identity foundation baseline: 28 contracts.
- Phase 03 master-data/tenant stream: 22 additional contracts, separately documented.
- Phase 02 route enforcement and default-deny checks remain enforced by startup contract validation and API tests.
- The full handler inventory is a source-level inventory and scope classification; it does not claim future-phase APIs have already been implemented.

### Supabase evidence
Target project: `eyofuiyxalbehbqoaeny`.

- **19** applied migrations in the live migration history.
- **17/17** public tables have RLS enabled.
- **35** permission keys, **8** roles, **122** role-permission grants.
- Five Phase 03 master-data tables have their own RLS policies and direct client access is denied.
- Security Advisor: **0 security lints**.
- Phase 02 migration history comprises the 16 migrations through `20261119174508`; Phase 03 adds the three migration versions below.

### Engineering validation evidence
- Phase 02 API Checks run **44591830007**, code commit `8917bcaac8da50e56e6a63c55569cab7c4811fbe`: **SUCCESS**.
  - 46 Python tests passed.
  - Python compileall passed.
  - Ruff passed.
  - Web TypeScript typecheck and Web lint passed.
  - Run: https://github.com/fadliansyah36/SalesXAi-Platform/actions/runs/44591830007
- Foundation Verification run **44588497867**, cross-platform source head `fcacb165b42f290ef8ad785513485fe1d3ee074b`: **SUCCESS**.
  - Bun frozen install and canonical token reproducibility passed.
  - Web TypeScript/lint passed.
  - Expo Native TypeScript, SDK compatibility, Expo config, Metro startup, Android/iOS bundle exports and Turborepo build passed.
  - Run: https://github.com/fadliansyah36/SalesXAi-Platform/actions/runs/44588497867
- No staging, deployment, real-world testing, SMTP credential population, Google OAuth credential population or production secret verification was performed or claimed.

**Decision: Phase 02 = COMPLETED.** No Phase 02 implementation-code blocker remains. Deferred provider/deployment credentials are not a code blocker.

## Phase 03 — COMPLETED

### Implemented
- Supabase core master-data migration:
  - `20261119175922_p03_master_data_core.sql` — teams, territories, outlets, sales profiles, outlet assignment history, permissions/grants, indexes, constraints and RLS.
- Supabase branch metadata migration:
  - `20261119180611_p03_branch_contact_location_fields.sql` — branch contact/location attributes.
- Supabase branch type migration:
  - `20261119181929_p03_branch_type.sql` — `head_office`, `branch`, `warehouse`.
- All three migrations are applied to target project `eyofuiyxalbehbqoaeny`.
- FastAPI master-data router, Pydantic schema, application service and repository support branch, team, territory, outlet, sales profile and outlet assignment reads/mutations.
- Tenant-scoped constraints, composite foreign keys, tenant membership/reference validation, unique tenant codes, assignment history and one-active-assignment index are implemented.
- 22 Phase 03 action contracts are mirrored in Python and TypeScript registries and included in the 50/50 parity result.
- Shared API contracts and typed API client methods are implemented for master-data resources and assignments.
- Existing Company Portal branch, territory and outlet screens are partially connected to FastAPI with permission gates and loading/error states.
- Existing Super Admin tenant list/create/status and organization branch/head-office/warehouse list/create/update screens are connected to platform-scoped FastAPI endpoints. Unsupported billing-plan changes remain read-only; no billing endpoint is fabricated.

### Remaining Phase 03 implementation
1. Connect the Company Portal Team screen and personnel/assignment modals to live organization memberships, team hierarchy, sales profiles, supervisor hierarchy and role assignments. The underlying API contracts and endpoints exist; the existing personnel UI is not yet fully connected.
2. Complete Company Portal update flows for territory/outlet and full branch lifecycle; current UI coverage is a partial vertical slice.
3. Integrate outlet assignment history and sales profile assignment workflows into the existing Company and relevant Sales/Supervisor portal surfaces.
4. Add master-data import/export with schema validation, row-level error reporting, audit and idempotent batch processing.
5. Implement private, tenant-authorized Realtime invalidation/broadcast for master-data/assignment events where required. Current screens refresh from FastAPI; private event subscriptions are not yet implemented.
6. Connect the native Expo assigned outlet/team context to the same typed API and permission contracts.
7. Run fresh combined static CI after the next Phase 03 UI integration batch.

**Decision: Phase 03 = IN_PROGRESS.** It is not complete and no completion claim is made.


## Phase 03 continuation update — Company Team vertical slice (2026-11-20)

This update supersedes the earlier Phase 03 remaining-work note where it said the Company Team screen was not yet connected.

### Newly implemented
- Company Portal now reads live teams, sales profiles and organization memberships through the typed API client and FastAPI.
- Existing Team Structure modal creates tenant-scoped teams with branch, optional active supervisor and optional parent-team references.
- Existing Team Structure screen renders actual team/branch/supervisor/parent relationships; hardcoded team hierarchy counts were removed.
- Existing personnel assignment modal updates a sales profile's team, manager/supervisor and status through `updateSalesProfile`; nullable repository updates now preserve explicit null so supervisor assignments can be cleared.
- Company Portal Team personnel no longer initialize from `INITIAL_TEAM_MEMBERS`. GPS maps are withheld until real location telemetry exists; no fabricated location coordinates are displayed.
- Role changes remain managed through the existing Access Console. The Company Team modal does not simulate RBAC role assignment.

### Updated Phase 03 remaining work
- Create sales profiles for existing active organization members from the Company Portal.
- Complete team role assignment through the existing RBAC delegation contract and expose only roles actually assignable to the actor.
- Connect outlet assignment history and assignment create/revoke flows to Company/Sales/Supervisor surfaces.
- Complete territory/team/outlet update/deactivation screens and branch lifecycle.
- Add import/export with validation, row-level errors, audit and idempotent batches.
- Add private tenant-authorized Realtime events/subscriptions where required.
- Connect Expo assigned team/outlet context to the shared API.

### Expanded source handler inventory
The combined route/portal/modal inventory now has **1,575 callback/event prop occurrences across 21 TSX source files**:
- `handler-level-action-inventory.tsv` — seven Web portal roots and Expo Sales.
- `handler-level-modal-inventory.tsv` — 11 modal/dialog components.
- `handler-level-route-inventory.tsv` — 13 Next.js route pages.
Scope tags: 99 Phase 02, 67 Phase 03, 789 future-phase and 620 UI-state callbacks. These are source occurrences, not unique business actions.

### Latest engineering validation
- API Checks run **44593859276**, code head `6f314455b6e344f9519abfe6a53bf8162779ca29`: **SUCCESS** — 46 Python tests, compileall, Ruff, Web typecheck and lint.
  - https://github.com/fadliansyah36/SalesXAi-Platform/actions/runs/44593859276
- Foundation Verification run **44593859301**, same code head: all 20 engineering steps succeeded — Bun workspace, token reproducibility, Web TypeScript/lint, Expo Native TypeScript, SDK compatibility, Expo config, Metro, Android/iOS exports and Turborepo build.
  - https://github.com/fadliansyah36/SalesXAi-Platform/actions/runs/44593859301

**Status remains: Phase 02 = COMPLETED; Phase 03 = IN_PROGRESS.** The new Team slice is partial; the remaining Phase 03 tasks above are still open.


## Final evidence refresh — 2026-11-20

### Handler inventory correction
The combined inventory was expanded beyond the seven portal roots and Expo screen to include nested dialogs and Next.js route pages. The current combined total is **1,575 callback/event prop occurrences across 21 distinct TSX source files**, split into:
- 99 Phase 02 identity/session.
- 67 Phase 03 master-data/tenant.
- 789 future-phase domain callbacks.
- 620 UI-state callbacks.

The three committed source inventories are:
- `docs/implementation/handler-level-action-inventory.tsv`
- `docs/implementation/handler-level-modal-inventory.tsv`
- `docs/implementation/handler-level-route-inventory.tsv`

These are source occurrences, not unique business actions. Future-phase entries are inventory-only until their owning phase defines a real contract.

### Phase 03 Company Team progress correction
Company Portal Team Structure now reads live teams, sales profiles and organization memberships from FastAPI. The existing structure modal creates tenant-scoped teams with branch/supervisor/parent references. The existing personnel modal updates a sales profile's team, supervisor/manager and status through FastAPI. Team members no longer use the initial demo array; GPS screens do not show maps until actual location telemetry is available.

Remaining Phase 03 tasks include sales profile creation from active memberships, outlet assignment UI/history, complete update/deactivation surfaces, import/export, private realtime events where needed, and Expo assigned team/outlet context.

### Supabase state re-verified
Live migration history contains **19 applied versions**: 2 Phase 00 foundation migrations, 14 Phase 02 migrations through `20261119174508`, and 3 Phase 03 migrations:
- `20261119175922_p03_master_data_core`
- `20261119180611_p03_branch_contact_location_fields`
- `20261119181929_p03_branch_type`

Current live state: **17/17 public tables RLS-enabled; 35 permissions; 8 roles; 122 role-permission grants; five Phase 03 RLS policies; seven branch metadata/type columns; Security Advisor 0 lints**.

### Final validation for the current Phase 03 UI/code batch
- API Checks **44593859276** — success on code commit `6f314455b6e344f9519abfe6a53bf8162779ca29`; 46 Python tests, compileall, Ruff, Web TypeScript and lint passed.
- Foundation Verification **44593859301** — all 20 steps succeeded on the same code commit, including Expo Native TypeScript, SDK compatibility, Metro, Android/iOS bundle exports and Turborepo build.

**Phase 02 remains COMPLETED. Phase 03 remains IN_PROGRESS.**


## Auth/access handler inventory extension — 2026-11-20

Added `docs/implementation/handler-level-auth-inventory.tsv` for the Organization Access Console, Platform Account Security Console, shared auth provider, portal login/signup and invitation/reset/callback routes.

The four handler inventories now cover **1,619 callback/event prop occurrences across 25 distinct TSX source files**. Scope tags: 143 Phase 02, 67 Phase 03, 789 future-phase and 620 UI-state callbacks. Event counts include 693 `onClick`, 71 `onSubmit`, 17 `onPress`, 358 `onChange` and 286 `onClose`. These are source occurrences, not unique business actions. The Phase 02 canonical contract remains 18 unique UI action IDs with 40 resolver call sites.


## Phase 03 final implementation continuation — 2026-11-20

- Manual outlet assignment unassignment is available through the tenant-scoped FastAPI endpoint, transaction-wrapped repository update, actor/time/reason snapshot, and audit receipt. Existing history rows remain immutable except for their lifecycle closure fields.
- Company Portal now exposes an unassign action on active assignment history rows with a confirmation/reason prompt and displays outlet, sales, team, supervisor, territory, assignment actor/time and unassignment actor/time.
- Company Portal now has reusable full-edit forms for Branch, Team, Territory and Outlet covering every mutable column declared by the master-data repository, including hierarchy, branch type, supervisor, outlet contacts/coordinates and territory GeoJSON.
- Shared API contract, typed client and both action registries include manual unassignment.
- Migration `20261120025728_p03_master_data_event_triggers` is applied to Supabase project `eyofuiyxalbehbqoaeny`; verified six AFTER INSERT/UPDATE/DELETE triggers on branches, teams, territories, outlets, sales_profiles and outlet_assignment_history. Company Portal debounces SSE invalidation and refetches from FastAPI; Expo refreshes assigned context on resume and every 30 seconds while foregrounded with overlapping requests suppressed.
- Phase 03 remains IN_PROGRESS until fresh CI and database security/schema checks on the final commit pass.


## Phase 03 final closure — 2026-11-20

**Decision: Phase 03 — COMPLETED.** This closure supersedes earlier historical IN_PROGRESS/remaining-work notes in this tracker.

### Completed implementation
- Company Portal master data now supports create, full edit and lifecycle status for Branch, Team, Territory and Outlet through FastAPI; Super Admin tenant and organization-branch administration remains platform-scoped.
- Team hierarchy, supervisor assignment, territory relations and membership-backed sales profiles are tenant-validated. Sales profile team/territory/supervisor unassignment closes active outlet assignments with actor/time/reason while preserving prior history.
- Manual outlet unassignment is available in Company Portal with confirmation and reason; FastAPI route, application service, repository transaction, tenant permission and audit receipt are connected.
- Assignment history retains prior/current sales, team, supervisor, territory and outlet snapshots, assignment/unassignment actor and timestamps, reason and lifecycle status.
- Import/export uses application service/repository, row-level validation/errors, batch audit and idempotency. Export is audited and preserves structured CSV fields.
- Private Realtime trigger and tenant-admin-only read policy are installed. Six triggers cover branches, teams, territories, outlets, sales profiles and outlet assignment history. Company Portal debounces SSE invalidation and refetches authoritative FastAPI state; Expo refreshes assigned context on app resume and every 30 seconds while foregrounded.
- Expo assigned team/supervisor/territory/outlet context uses the shared API contract and protected local cache; offline cache is not the source of truth.

### Database evidence
- Applied final Phase 03 trigger migration: `20261120025728_p03_master_data_event_triggers`.
- Supabase migration history: 26 applied migrations; public tables: 18/18 with RLS enabled; private Realtime messages policy: 1; master-data change triggers: 6.
- Security Advisor: 0 lints. The performance advisor reports informational unused-index observations; no security blocker is reported.
- `assignment:manage` is granted to company_admin, tenant_owner and platform_admin; assignment-context read is granted to the permitted company, sales and supervisor roles according to the existing role matrix.

### Engineering evidence
- API Checks run `44665532137`, code/test HEAD `e83f297879ff56c8840b29b0f329ace3e561675e`: **SUCCESS** — 49 Python tests, Python compileall, Ruff, Web TypeScript and Web lint.
- Foundation Verification run `44665532140`, application HEAD `e83f297879ff56c8840b29b0f329ace3e561675e`: **SUCCESS** — 20/20 steps including design-token reproducibility, Web TypeScript/lint, Expo Native TypeScript, SDK compatibility, Expo config, Metro, Android/iOS bundle exports and Turborepo workspace build.
- Final implementation code commit validated by both CI workflows: `e83f297879ff56c8840b29b0f329ace3e561675e`. This documentation evidence refresh does not change application code.
- No staging, production deployment, real-world testing, Product Owner Acceptance or provider credential population was performed.

**Next phase: Phase 04 — SmartTeam: Visit, Attendance & Sales Operations.** Phase 04 may begin from this completed Phase 03 baseline.


## Phase 04 — SmartTeam full implementation continuation — 2026-11-20

**Current status: IN_PROGRESS — SmartTeam and Mobile evidence work are committed; independent portal roots, remaining Railway services and API production readiness remain open.** This entry supersedes the earlier Phase 03 “Next phase: Phase 04” note; Phase 03 remains COMPLETED.

### Implemented and connected

- FastAPI SmartTeam router, Pydantic schemas, application service and repository cover tenant-scoped visit planning/assignment/update/cancel, check-in/check-out, shift clock-in/clock-out, attendance correction/history, daily activities, target CRUD, evidence upload/list, dashboard and authorized event stream.
- Existing Web surfaces consume the shared FastAPI client: Sales Portal at `/portal` (SmartTeam tab), Company Portal at `/company`, Supervisor Portal at `/supervisor`, and Super Admin global SmartTeam overview.
- Expo Sales app consumes the same API contract. Assigned outlet/team/supervisor/territory context is shown from the Phase 03 API; SmartTeam includes shift/attendance, visits, daily activity, targets, visit timeline and evidence history.
- Native field actions use SQLite outbox with idempotency, retry/backoff and foreground/resume synchronization. Evidence files are copied into app document storage before queuing; successful upload is deduplicated server-side by tenant + visit + SHA-256.
- Visit outcome is selectable in Web and Mobile. Activity type `task` is accepted by the API schema, shared contract, Web and Mobile clients.
- Evidence MIME validation checks JPEG/PNG/PDF file signatures before private Storage upload. Evidence metadata records uploader, MIME, byte size, digest and timestamp.
- FastAPI Railway container and service config are present at `services/api/Dockerfile` and `services/api/railway.toml`; the API workflow now builds this container. EAS preview/production profiles select named EAS environments.

### Database and security evidence

- Supabase project: `eyofuiyxalbehbqoaeny`.
- Applied migrations: **35 total**, including **9 Phase 04 migrations**. The Phase 04 migration files are named to match their applied migration versions:
  - `20261120033210_p04_smartteam_operations`
  - `20261120035216_p04_smartteam_offline_evidence`
  - `20261120040009_p04_smartteam_event_stream_bridge`
  - `20261120040308_p04_smartteam_private_realtime_scope`
  - `20261120040825_p04_smartteam_storage_scope`
  - `20261120040910_p04_smartteam_fk_indexes`
  - `20261120041314_p04_smartteam_evidence_broadcast`
  - `20261120041531_p04_smartteam_task_activity`
  - `20261120043558_p04_smartteam_evidence_content_dedup`
- Public tables: **25**; RLS-enabled public tables: **25/25**. SmartTeam tables: **7/7** with RLS. Private evidence Storage policy: **1**. SmartTeam trigger functions: **5**.
- SmartTeam uses private tenant-scoped Supabase Broadcast (`realtime.send(..., true)`) and a PostgreSQL NOTIFY bridge consumed by the FastAPI SSE endpoint. Event payloads carry identifiers/status only; recipients are re-authorized server-side before delivery.
- Supabase Security Advisor: **0 lints**.
- Evidence content deduplication index `smartteam_visit_evidence_content_uidx` is present on `(organization_id, visit_id, sha256)`; no existing duplicate content groups were found before applying it.

### Engineering validation

- Foundation Verification run **44675962379** — SUCCESS on commit `3716b6072fe65d9daf20fbcab470590915415796`; includes Web typecheck/lint, native TypeScript, Expo dependency/config/Metro checks, Android/iOS bundle exports and workspace build.
- API Checks run **44676185657** — **SUCCESS** on code commit `0f0d244e40fd412e5f64254b5153bb7ab961921b`: **59 Python tests**, compileall, Ruff, Web TypeScript, Web lint and Railway FastAPI Docker image build all passed.
- Foundation Verification run **44675962379** — **SUCCESS** on commit `3716b6072fe65d9daf20fbcab470590915415796`: Web typecheck/lint, native TypeScript, Expo dependency/config/Metro checks, Android/iOS bundle exports and workspace build passed.
- API Checks run **44675962378** — **SUCCESS** on commit `3716b6072fe65d9daf20fbcab470590915415796`.
- An earlier run **44676028737** failed because a test referenced the pre-alignment migration filename. The test and filenames were corrected; the latest API run above validates the corrected migration register and code. Current `main` head `de52c60f34c42aa2e5ba54dc346f6ad2a17e25b7` adds documentation after the validated code commit; no application code changed after the validated commit.

### Railway and production blockers

- Railway connector **SalesXAi** currently maps to user **Arrohmaniyah** and workspace `Arrohmaniyah's Projects`, project `heroic-expression`. The project contains the pre-existing `@salesx-ai/mobile-sales` service linked to this exact repository and `main`; it is the active connected deployment target. A `salesx-api` service has since been provisioned as recorded in the continuation entries below.
- The current source tree has one root Next.js app serving Website/Customer/Company/Sales/Distributor/Principal/Supervisor/Super Admin routes. The eight independent `apps/*-portal` roots listed in the Engineering Execution Plan do not exist. The deployment registry records the root Web app as the existing boundary. Creating eight Railway services against the same root would duplicate a monolith, not provide independent portal deployments; this has not been done.
- `salesx-api` now has Railway service ID `14b0489c-8431-480d-828f-d001b5c82fdd` and Default Domain `salesx-api-production.up.railway.app`; its initial deployment failed the `/readyz` health check because `DATABASE_URL` is not configured.
- Custom domains, DNS ownership and TLS remain unverified. EAS production `EXPO_PUBLIC_SALESX_API_URL` is now set to the Railway API Default Domain; `EXPO_PUBLIC_AUTH_BFF_URL` remains pending the independent Website deployment. SMTP/OAuth/provider credentials remain intentionally unset.
- No staging environment, staging deployment, field test or Product Owner Acceptance gate was introduced.

**Phase 04 is NOT COMPLETED.** Code-level work is substantially integrated, but the required production deployment cannot be completed until the Railway connector is switched to the intended SalesXAi workspace and the Web deployment boundary decision is resolved. Do not begin Phase 05 until Phase 04 is closed with the deployment status and remaining evidence recorded.


## Phase 04 — final implementation continuation and Railway API provisioning — 2026-11-20

This entry corrects the earlier Railway identity note above. The connected Railway connector is named **SalesXAi**. Its production project is `heroic-expression` in workspace `Arrohmaniyah's Projects`; the project contains a pre-existing service linked to this exact repository and `main`. The project is therefore being used as the currently connected SalesXAi deployment target; no unrelated Railway account was substituted.

### Mobile evidence implementation added

- `apps/mobile-sales` now includes Expo SDK 58-compatible `expo-document-picker` at `~58.0.5`, registered in the Expo config and Bun workspace lock.
- SmartTeam Mobile can select JPEG, PNG and PDF documents, validates MIME and file size (10 MB maximum), copies selected files into app document storage, and enqueues metadata for offline-safe upload.
- Shared API client upload now supports byte progress callbacks, cancellation via AbortSignal, and bearer-token refresh. Mobile exposes upload progress and cancellation; cancellation retains the local file and pending outbox row for retry.
- EAS production profile now has `EXPO_PUBLIC_SALESX_API_URL=https://salesx-api-production.up.railway.app`. The Auth BFF URL remains pending the independent Website deployment URL; no secret is embedded in the mobile bundle.
- Implementation commits include: `e58498a7af592c0099281b2f7fd5b7c53ee8c0c7`, `71812613d5cb1d1ec4afb2e0b4a991981dc3ef9d`, `4c5b8e1473d768870634ac8b4e7e94bf23ca2e42`, `b197693ac01d81ef62735d0817a514c4e757f24c`, `71f1de588bca77f15e4b73e3694a502c428c0fd7`, `0ce75eb2fc8fa5c0f3227d4713b9467569f3411f`, `4090ae92d94beaa4fbe1a2a1c6d26ae5f0ed5bea`, `2760219025b3cf4a927d602c538b3b2f7441df2d`, and `b03459f7ed95bf43bb90653afa60305d0501b24c`.

### Fresh engineering validation

- API Checks run `44680288962` succeeded on `0ce75eb2fc8fa5c0f3227d4713b9467569f3411f`: Python unit tests, compileall, Ruff, Web typecheck and lint passed. This run does not include the later SDK version alignment or production API URL change.
- Foundation Verification run `44680288934` failed on `0ce75eb2fc8fa5c0f3227d4713b9467569f3411f` because Expo expected `expo-document-picker ~58.0.5`; the package was updated to that version.
- API Checks run `44680626066` and Foundation Verification run `44680626014` were triggered for implementation commit `b03459f7ed95bf43bb90653afa60305d0501b24c`; final outcomes are pending at the time of this tracker entry. Do not treat earlier runs as validation of this latest commit.

### Railway API service provisioned

- Project: `heroic-expression`; environment: `production`.
- Service: `salesx-api`; service ID: `14b0489c-8431-480d-828f-d001b5c82fdd`.
- Source: `fadliansyah36/SalesXAi-Platform`, branch `main`.
- Root directory: `/services/api`; Dockerfile: `Dockerfile`; healthcheck: `/readyz`; target port: `8080`.
- Railway Default Domain: `https://salesx-api-production.up.railway.app`.
- The container built and Uvicorn started. Railway readiness currently returns HTTP 503 because `DATABASE_URL` has not yet been added. The API config also requires deployment-time Supabase server credentials for private Storage/Auth operations. The health check remains `/readyz`; it was not weakened to report a database-disconnected API as ready.
- Required secret values to complete API readiness: `DATABASE_URL` (Supabase PostgreSQL connection string with TLS), `SUPABASE_SECRET_KEY`, `SUPABASE_PUBLISHABLE_KEY` (for server-side Auth BFF interactions), and `SALESX_BFF_SHARED_SECRET` where the BFF/API shared-secret contract is enabled. Configure these in Railway's production secret variables, not in Git.
- `CORS_ORIGINS` and `APP_PUBLIC_URL` remain pending the actual independent portal domains.
- A pre-existing service `@salesx-ai/mobile-sales` remains untouched; it is not one of the nine target Railway services, has no public domain, and its latest deployment was failed. No new Mobile Railway service was created.

### Remaining Phase 04 work / status

- The eight independent portal roots (`apps/website`, `apps/customer-portal`, `apps/company-portal`, `apps/sales-portal`, `apps/distributor-portal`, `apps/principal-portal`, `apps/supervisor-portal`, `apps/super-admin`) still do not exist. Existing portal UI remains in the root Next.js application. Do not create eight empty wrappers or point eight services at the same monolith.
- The other eight Railway portal services are not provisioned because their application roots and independent build/runtime boundaries are not implemented yet.
- API production runtime is not ready until the deployment secrets above are configured and `/readyz` reports database connectivity.
- Expo production API origin is set, but Auth BFF origin awaits the Website portal's Railway Default Domain. Portal CORS/trusted origins and portal-to-API connectivity await the independent portal deployments.
- Supabase migration history was re-queried and contains **35 applied migrations**, including the nine Phase 04 SmartTeam migrations already listed above. No new database migration was required for this client-side document picker/API upload progress change.
- Phase 04 remains **IN_PROGRESS / NOT COMPLETED**. Do not begin Phase 05 until all ten Definition of Done items, including all eight portal builds and nine Railway service domains/health states, have current evidence.


## Phase 04 — final validation and live Supabase/Railway state correction — 2026-11-20

### Latest implementation validation

The latest application-code commit is `b03459f7ed95bf43bb90653afa60305d0501b24c`. The current repository HEAD `854f8c1602f18ffff7bc193166a4f01134ca4913` is a documentation-only Phase 04 tracker update; no application code changed after `b03459f`.

- API Checks run **44680626066** — **SUCCESS** on code commit `b03459f7ed95bf43bb90653afa60305d0501b24c`: **59 Python tests**, compileall, Ruff, FastAPI Docker image build, Web TypeScript and Web lint all passed.
- Foundation Verification run **44680626014** — **SUCCESS** on code commit `b03459f7ed95bf43bb90653afa60305d0501b24c`: **20/20 steps** passed, including Bun workspace resolution/frozen install, design-token reproducibility, Web TypeScript/lint, Expo Native TypeScript, SDK dependency compatibility, Expo config, Metro startup, Android bundle export, iOS bundle export and Turborepo workspace build.
- The earlier SDK compatibility failure was resolved by aligning `expo-document-picker` to `~58.0.5`, the version expected by the installed Expo SDK 58.

### Live Supabase verification

- Migration history was re-read from project `eyofuiyxalbehbqoaeny`: **35 applied migrations**, including all nine Phase 04 migrations from `20261120033210` through `20261120043558`.
- Live public schema: **25 tables; 25/25 RLS enabled**. The seven SmartTeam tables (`smartteam_shifts`, `smartteam_visits`, `smartteam_visit_events`, `smartteam_activities`, `smartteam_targets`, `smartteam_visit_evidence`, `smartteam_attendance_events`) all have RLS enabled.
- Security Advisor: **0 lints**.
- Performance Advisor: **81 informational unused-index observations**. These are informational and are not security lints; no index was dropped as part of this phase.

### Railway API deployment outcome

- Deployment `2405f36c-160b-4633-a7a4-3c64f9977404` for `salesx-api` built the container and started Uvicorn, but ended **FAILED at HEALTHCHECK**.
- Railway logs show repeated `GET /readyz` responses of HTTP 503. The API intentionally returns 503 while `DATABASE_URL` is absent; this is a real readiness blocker, not a container/build failure.
- The generated Railway Default Domain exists, but it is **not a healthy production API endpoint yet**. Do not claim portal connectivity or a successful API deployment until the Supabase database connection secret is configured and a new deployment passes `/readyz`.

**Phase 04 remains IN_PROGRESS / NOT COMPLETED.** The successful engineering checks validate the current monolith and Mobile code batch; they do not satisfy the eight independent portal boundary requirement or the nine-service Railway Definition of Done.


## Phase 04 — Railway Supabase variable binding continuation — 2026-11-20

- Verified Supabase project `eyofuiyxalbehbqoaeny` is `ACTIVE_HEALTHY`, PostgreSQL 17.12, region `ap-northeast-1`; canonical API URL and JWKS/Auth issuer match the existing Railway configuration.
- Retrieved the active Supabase publishable key through the connected Supabase project connector and set Railway production variable `SUPABASE_PUBLISHABLE_KEY` on `salesx-api`. This is a public/publishable key, not a service-role credential.
- Railway automatically triggered deployment `b5b51d28-f8ab-4248-b84f-e51ccd40d39c` from `main` commit `12a21fd0bcd91d678e5b64221ca580974fb1ca9e`. Build completed and Uvicorn started; `/readyz` continues to return HTTP 503 while `DATABASE_URL` is absent. Railway reports the deployment as `DEPLOYING` at the time of this record.
- The connected Supabase project API exposes project metadata, URL and publishable keys, but does not expose the database password/connection secret or server secret key. These cannot be derived from the project ref, URL, anon key or publishable key. No guessed credential was written. The server-only variables `DATABASE_URL` and `SUPABASE_SECRET_KEY` remain to be added securely to Railway production Variables; `SALESX_BFF_SHARED_SECRET` remains conditional on enabling the BFF shared-secret contract.
- The eight independent portal roots remain absent in the repository tree. No empty portal services were created; doing so would produce invalid deployments rather than independently runnable apps. Existing Mobile Railway service remains untouched.
- Phase 04 remains **IN_PROGRESS / NOT COMPLETED**. API Default Domain exists but is not yet a healthy production endpoint; portal domains and CORS/trusted origins cannot be completed until portal app roots exist and API readiness is healthy.


## Phase 04 — API recovery and portal deployment continuation — 2026-11-20

### Source and implementation review
- Re-read repository `AGENTS.md`, canonical Master PRD v1.0, Engineering Execution Master Plan v1.0 and Cross-Platform Implementation Flow on `main`.
- Repository HEAD at start of this continuation: `18501d1201d8c93a9895397b63b3684cab05ed45`.
- Confirmed `services/api/app/main.py` registers auth, admin, organizations, master_data, smart_team, audit and security routers under `/api/v1`; `/healthz` is process health and `/readyz` performs an actual PostgreSQL `select 1` readiness check.
- Confirmed API container build and Uvicorn startup succeeded. Railway deployment `b5b51d28-f8ab-4248-b84f-e51ccd40d39c` ended **FAILED at HEALTHCHECK**, with repeated HTTP 503 from `/readyz`. Root cause: Railway production variables do not contain `DATABASE_URL`; the code intentionally leaves `db_pool` unset without it and does not report database readiness.
- Confirmed `SUPABASE_PUBLISHABLE_KEY` is configured on `salesx-api`, together with project URL, JWKS, JWT issuer/audience and pool/runtime settings. Supabase connector can return only public/publishable keys; no database password/connection secret or server secret-key retrieval operation is exposed. No credential was guessed or printed.
- Supabase project `eyofuiyxalbehbqoaeny` is `ACTIVE_HEALTHY`, PostgreSQL 17.12, region `ap-northeast-1`. The database connection must be supplied securely to Railway as `DATABASE_URL`; `SUPABASE_SECRET_KEY` is still required for privileged Auth/Storage flows that use it.
- API Default Domain remains `https://salesx-api-production.up.railway.app`; it is not a healthy API endpoint until the real database connection passes `/readyz`.

### Portal boundary inspection
- The recursive Git tree at HEAD `18501d1201d8c93a9895397b63b3684cab05ed45` confirms all eight requested app roots remain absent: `apps/website`, `apps/customer-portal`, `apps/company-portal`, `apps/sales-portal`, `apps/distributor-portal`, `apps/principal-portal`, `apps/supervisor-portal`, `apps/super-admin`.
- Existing Next.js routes remain in root `app/`; the route inventory includes Website `app/page.tsx`, Sales `app/portal/page.tsx`, Company `app/company/page.tsx`, Customer `app/customer/page.tsx`, Distributor `app/distributor/page.tsx`, Principal `app/principal/page.tsx`, Supervisor `app/supervisor/page.tsx`, and Super Admin `app/super-admin/page.tsx`, with existing nested SmartTeam routes and shared root components.
- Root workspace is Bun + Turborepo, with `apps/*` and `packages/*` workspaces. Portal extraction must preserve root build context/shared packages and existing UI routes/assets. No empty wrappers, duplicated monolith copies, or invalid Railway service placeholders were created.
- Consequently, only two services are currently visible in the connected Railway production project: pre-existing `@salesx-ai/mobile-sales` (left untouched) and `salesx-api`. The other eight requested portal services are not yet provisioned because their independent app roots/build targets do not yet exist.

### Phase status
- Existing SmartTeam and Expo Mobile Evidence implementation/migrations are preserved. Previously recorded 35 applied migrations, 25/25 public-table RLS coverage and 0 Security Advisor lints remain the latest verified database evidence; no new schema delta was introduced in this continuation.
- Expo production API base URL remains configured to the API Default Domain; Auth BFF origin remains pending Website app/domain extraction.
- `CORS_ORIGINS` / `APP_PUBLIC_URL` remain unset until independent portal domains exist.
- Phase 04 remains **IN_PROGRESS — NOT COMPLETED**. No Phase 05 work is started.


## Phase 04 — Railway database connectivity follow-up — 2026-11-20

- Rechecked Railway production service `salesx-api` after the user added database/server variables. Railway now lists `DATABASE_URL` and `SUPABASE_SECRET_KEY` alongside `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`, and JWT settings. OAuth connector redacts variable values; presence is verified, credential contents are not readable or logged.
- New deployment `8558c4ce-2350-4e46-bcab-3f4276f4cb82` for main commit `d8d77149d526ab3eb5087c4a4ffab1b161666318` successfully built the FastAPI Docker image but failed during application startup while `asyncpg.create_pool` attempted the PostgreSQL connection. Runtime error: `OSError: [Errno 101] Network is unreachable`; Railway healthcheck `/readyz` therefore did not pass.
- Supabase project `eyofuiyxalbehbqoaeny` reports region `ap-northeast-1` and direct database host `db.eyofuiyxalbehbqoaeny.supabase.co`. Supabase connection documentation states direct database connections are IPv6-only unless the IPv4 add-on is enabled. For IPv4-only runtime networks, use Supavisor Shared Pooler **Session mode** on port `5432`.
- The Railway connector returns variable names only and cannot read or transform the existing secret value. Do not replace `DATABASE_URL` with a guessed connection string or invent the database password. Required operator action: copy the exact Session Pooler connection string from Supabase Dashboard → Connect → Session pooler, retain the project's database password, and set it as Railway `salesx-api` → production `DATABASE_URL`. Keep TLS enabled. Do not send the password in chat.
- API remains NOT READY until a subsequent deployment starts successfully and `/readyz` confirms a real PostgreSQL `select 1`.
- Eight portal app roots remain absent; no placeholder portal services have been provisioned. Existing Mobile Railway service remains untouched. Phase 04 remains **IN_PROGRESS — NOT COMPLETED**; Phase 05 has not started.


## Phase 04 — IPv6 egress enabled; TLS trust is next blocker — 2026-11-20

- User enabled Railway IPv6 egress for `salesx-api`. Railway service config now confirms `deploy.ipv6EgressEnabled=true`.
- On the prior deployment, DNS for `db.eyofuiyxalbehbqoaeny.supabase.co` returned an AAAA record (`2406:da14:1772:ea01:467a:e532:2860:c87b`) and no A record. The previous `OSError: [Errno 101] Network is unreachable` was therefore addressed by enabling IPv6 egress.
- The subsequent deployment `9b55cdb1-ea01-4a6e-8e47-c794467d1ce1` now gets through TCP/IPv6 and PostgreSQL TLS negotiation, but FastAPI startup fails with `ssl.SSLCertVerificationError: certificate verify failed: self-signed certificate in certificate chain` because `services/api/app/db.py` currently passes `ssl=True` to asyncpg, which verifies against the container's default trust store.
- Supabase's current SSL docs recommend downloading the project root CA certificate from Database Settings and configuring the driver for `verify-full` with that CA. Do not disable certificate verification, do not set `ssl=False`, and do not silently downgrade to insecure transport.
- Next engineering change: add a server-only `SUPABASE_DB_CA_CERT` setting (SecretStr), create an SSLContext with CA loaded from this PEM, and retain hostname verification / CERT_REQUIRED; alternatively mount the official Supabase CA certificate as a protected Railway file and configure the same verified SSL context. Do not put CA material into public portal or Expo variables. Need obtain the official CA certificate from Supabase Dashboard → Database Settings → SSL Configuration → Download Certificate, then supply it to Railway backend securely. The existing connector cannot download private dashboard artifacts or read secret variable values.
- Latest deployment remains in progress at the time of this update; API is NOT READY until `/readyz` passes. Eight portal apps and corresponding services remain unimplemented/unprovisioned. Phase 04 remains **IN_PROGRESS — NOT COMPLETED**.


## Phase 04 — Supabase PostgreSQL TLS trust and API readiness restored — 2026-11-20

- User supplied `prod-ca-2021.crt`. The PEM parses successfully as a self-signed CA certificate with subject/issuer `CN=Supabase Root 2021 CA`, validity 2021-04-28 through 2031-04-26, and local OpenSSL self-verification returned `OK`.
- Added the public Supabase root CA to `services/api/certs/supabase-prod-ca-2021.crt`; this is a public trust anchor, not a database password or service credential.
- `services/api/app/db.py` now creates a Python SSL context using system trust roots plus the Supabase CA. Hostname checking remains enabled and verification mode remains `CERT_REQUIRED`; asyncpg receives the explicit context rather than `ssl=True` with an incomplete container trust store.
- `services/api/Dockerfile` installs the CA at `/etc/ssl/certs/supabase-prod-ca-2021.crt`, outside the Python package discovery root. The initial packaging attempt exposed a setuptools flat-layout discovery conflict when the CA directory was copied into `/app`; this was corrected by copying the certificate directly into the OS certificate directory.
- Relevant implementation commits on `main`: `7cc896091da9d8ab22765af9ae2a29177e525e36` (CA file), `c9f80429234c15e0844f9f56a7110ccc57b7fe8f` (verified SSL context), `7f8df3844409cf67a718ebc10d558f06f41efdb6` (initial Docker CA copy), `029f8da651ff4f58c78da60c32fac982299b9532` (package-discovery path fix), and `722d4e9d559bb241db6d1977464b4d98f1c37ef9` (final OS certificate installation).
- Final Railway deployment `8437d31e-d78c-4788-9970-94771e01b3e4`, service `salesx-api`, branch `main`, commit `722d4e9d559bb241db6d1977464b4d98f1c37ef9`, reached **SUCCESS**. Runtime logs show Uvicorn startup completed and Railway health check received `GET /readyz` → **HTTP 200** at 2026-11-20 06:02:25 UTC. In this codebase `/readyz` executes a real PostgreSQL `select 1`; this is evidence the API established its database pool and passed readiness.
- The direct external browser fetch of the Railway URL was not accessible through the web retrieval surface; readiness evidence is from Railway's deployment/runtime health-check logs. No authenticated business API request is claimed.
- Phase 04 blockers remain: eight independent portal app roots and eight corresponding Railway services/domains have not been implemented/provisioned; CORS and Website/Auth BFF origins remain dependent on those app boundaries. Existing UI has not been redesigned, no empty portal wrappers or duplicate services were created, and the pre-existing Mobile Railway service remains untouched.
- Phase 04 remains **IN_PROGRESS / NOT COMPLETED**. API TLS and database readiness are now restored, but all ten Phase 04 Definition of Done items are not yet evidenced. Phase 05 remains locked.


## Phase 04 — Eight portal app roots, typed SmartTeam integration and production deployment continuation — 2026-11-20

### Canonical governance re-read
- Re-read `AGENTS.md`, Master PRD v1.0, Engineering Execution Master Plan v1.0 and Cross-Platform Implementation Flow against the bound repository and branch `main`.
- Engineering constraints retained: one Bun monorepo and lockfile; existing UI/routes/components/design tokens remain authoritative; FastAPI owns business reads/mutations and authorization; no direct business-table mutation from Web/Expo; no mock/demo business fallback in production; no staging, field test or Product Owner Acceptance gate; Phase 05 remains locked until Phase 04 closure.

### Eight independent Next.js workspaces
- Implemented the independent workspaces under:
  - `apps/website`
  - `apps/customer-portal`
  - `apps/company-portal`
  - `apps/sales-portal`
  - `apps/distributor-portal`
  - `apps/principal-portal`
  - `apps/supervisor-portal`
  - `apps/super-admin`
- Each workspace has its own package manifest and build/dev/start/typecheck scripts, Next config, TypeScript config, App Router root, page boundary, environment example and standalone output preparation. Existing route components are reused from the monorepo root through shared aliases; public assets are copied into each standalone output by `infrastructure/scripts/prepare-next-standalone.mjs`. This avoids copying or redesigning the existing portal UI.
- Root `bun.lock` includes all eight workspace dependency graphs. The portal CI performs `bun install --frozen-lockfile` before building each workspace.
- Each app includes its own Auth/Backend API route boundary, shared root route handlers, auth callback pages, manifest and health route. Website additionally exposes the Mobile Auth BFF route for Expo.
- Railway build context is the repository root, preserving shared packages, lockfile, public assets and the existing dependency graph. Each service build command filters to its own workspace and the standalone start command points to that workspace's generated server.

### Engineering validation
- Phase 04 Independent Portal Builds workflow run **44689132198** on commit `0d2c5f103cfe276fa1f7c4d44c7b8dce18614eec`: **8/8 portal builds SUCCESS** (Website, Customer, Company, Sales, Distributor, Principal, Supervisor and Super Admin). The workflow also validates frozen Bun lockfile install and standalone server/static/public output paths.
- Phase 02 API Checks run **44689132151** on the same commit: **SUCCESS**.
- Foundation Verification run **44689132195** was still in progress at the time of this tracker update; do not treat it as passed until its final result is available.
- Earlier portal matrix failures on commit `cbe66fa095a85ec4156cacdabae34331c29c5229` were caused by build-time `next/font/google` fetch/parser errors in two workspaces. Commit `a2704753a0443897c73f52298f0e3470e68ae83e` removed that network-dependent build step while preserving the Plus Jakarta Sans and JetBrains Mono font family declarations through CSS; the subsequent eight-app build matrix passed.

### Shared API client, SmartTeam and Website BFF
- All eight portal layouts reuse the existing shared `AppProviders` / `SalesXAuthProvider`, which constructs `SalesXApiClient` and uses the shared API contracts/client for auth/session and FastAPI transport. Per-portal `/api/auth` and `/api/backend` route boundaries re-export the canonical root BFF handlers; no portal has its own business-data backend or direct Supabase business mutation.
- The Website app exposes the existing `/api/mobile-auth` BFF route. Shared Web session code uses HttpOnly cookies, Secure in production, SameSite policy, exact `APP_PUBLIC_URL` origin validation, CSRF cookie/header matching, server-side Supabase Auth calls, refresh authorization, BFF rate limiting and server-only `SUPABASE_PUBLISHABLE_KEY` / `SALESX_BFF_SHARED_SECRET`. Provider-specific Google OAuth and SMTP credentials remain deferred to deployment configuration.
- Company, Sales and Supervisor surfaces expose the SmartTeam Console. It uses typed FastAPI client methods for visits, assignments, check-in/out, attendance, activity, targets, visit history/evidence, private Storage uploads and authorized SmartTeam events. This continuation additionally binds the dashboard summary to `getSmartTeamDashboard` and adds Web evidence MIME/size validation, upload progress and cancellation.
- Existing non-SmartTeam modules for SmartOrder, SmartReward, GPS intelligence, analytics, AI and Telegram remain governed by their later phases. Their legacy UI data/demo content is not evidence of backend integration; those feature slices must be connected or explicitly disabled/marked unavailable before any production-completion claim. Phase 05+ scope is not started here.

### Expo configuration
- EAS production environment includes `EXPO_PUBLIC_SALESX_API_URL=https://salesx-api-production.up.railway.app` and `EXPO_PUBLIC_AUTH_BFF_URL=https://salesx-website-production.up.railway.app`.
- Added separate development and production environment examples; development values are local/LAN-only placeholders. Auth tokens remain in Expo SecureStore and no privileged server credentials are placed in the native bundle.
- Existing native document picker, offline evidence outbox, retry, upload progress and cancellation implementation is preserved. The pre-existing Mobile Railway service is not part of the nine-service target and remains untouched.

### Railway production state and resource blocker
- Bound Railway project `heroic-expression`, production environment `4be54e25-86f0-409a-87d2-36e475f67a1f`.
- FastAPI service `salesx-api` (`14b0489c-8431-480d-828f-d001b5c82fdd`) is **Online**. Deployment `b0f7ea0b-8380-4cb2-bc81-6b1e7882d0d9` logged repeated `GET /readyz` → HTTP 200. The API CORS allowlist and `APP_PUBLIC_URL` are currently set for the three provisioned portal origins.
- Provisioned portal services and generated Default Domains:
  - `salesx-website` — service `7b4bc26e-545a-4ed8-8cdb-9057fdd26fb1` — `https://salesx-website-production.up.railway.app`
  - `salesx-customer` — service `09c11984-87ea-4ff0-ae0f-8c1512d7feda` — `https://salesx-customer-production.up.railway.app`
  - `salesx-company` — service `f91fc3c9-ddca-4e24-a381-e6736fe938cb` — `https://salesx-company-production.up.railway.app`
- These three portal services use the monorepo root as build context, service-specific Bun workspace build filters, standalone runtime start commands, `/api/health` health checks and app-specific watch patterns. Their latest deployment chain was still BUILDING/QUEUED at the time of this update; do not mark them production healthy until the final deployment status and API-dependent health check are successful.
- Attempted to create the remaining five services (`salesx-sales`, `salesx-distributor`, `salesx-principal`, `salesx-supervisor`, `salesx-admin`). Railway rejected service provisioning with **“Free plan resource provision limit exceeded.”** No placeholder services were created. The project already contains the pre-existing `@salesx-ai/mobile-sales` service; it remains untouched as instructed. The current resource limit prevents provisioning all eight portal services in this Railway project.
- CORS allowlist currently includes only the three provisioned portal origins. It must be extended to the remaining five actual Railway Default Domains after Railway resource capacity is available. Do not invent or predeclare unprovisioned domains.

### Current commits
- Independent portal build foundation and font build fix: `a2704753a0443897c73f52298f0e3470e68ae83e`.
- Expo production API and Website Auth BFF environment binding: `ce46b4976074319c5fb0b509abfa5d0dfac8e2f9`.
- API-dependent health routes for all eight portal apps: `ae831d602738622beb461ec086e74ca8651fee57`.
- SmartTeam dashboard contract binding and Web evidence upload progress/cancellation: `afb4e19b56683afea0627074f6c60ac67b476b9c`, `0d2c5f103cfe276fa1f7c4d44c7b8dce18614eec`.

**Phase 04 remains IN_PROGRESS / NOT COMPLETED.** The eight app roots and their CI builds are complete, and API readiness is healthy. The remaining five Railway services cannot be provisioned under the current Railway Free plan resource limit; the three deployed portal services still need final health confirmation; CORS needs all eight real domains; and full role-scoped integration/no-demo cleanup of all relevant existing dashboard actions remains outstanding. Do not start Phase 05.


## Phase 04 — Railway portal health-check deployment evidence — 2026-11-20

- The three provisioned portal services completed their API-dependent health-check deployment on commit `e2725dfe89a1f43854f204d95f012fe75ece9abe`:
  - Website deployment `151405db-cb1d-42eb-bad9-fe1e1528f7ab` — **SUCCESS**.
  - Customer deployment `cbfaa5a1-ee77-4676-bf28-411396248be4` — **SUCCESS**.
  - Company deployment `96b7134e-1c31-46c7-93c6-b0a36522990f` — **SUCCESS**.
- Their Railway health check path is `/api/health`; each handler calls the configured FastAPI `/readyz` endpoint and returns HTTP 200 only when the API reports readiness. Successful Railway health-check deployment therefore confirms the three portal runtimes could reach the healthy FastAPI dependency at that deployment revision.
- API deployment `b0f7ea0b-8380-4cb2-bc81-6b1e7882d0d9` remains **SUCCESS/Online** and logged repeated `/readyz` HTTP 200.
- The latest application commit `0d2c5f103cfe276fa1f7c4d44c7b8dce18614eec` includes the SmartTeam dashboard and evidence upload progress/cancellation refinements. Its corresponding Railway redeployments were still QUEUED behind the previous deployment chain at this check; do not claim that these latest component changes are live until those deployment IDs finish successfully.
- The eight-portal GitHub build matrix on `0d2c5f1` is **8/8 SUCCESS**, and API Checks are **SUCCESS**. Foundation Verification run `44689132195` remains in progress.
- The five missing portal services remain blocked by Railway Free plan resource provisioning limit. CORS remains scoped to the three actual provisioned domains only. Phase 04 remains **IN_PROGRESS**.


## Phase 04 — Four-service multi-portal deployment implementation — 2026-11-20

### Deployment topology decision
- This section supersedes earlier Phase 04 notes that targeted nine Railway services / one public domain per portal. The user-approved production topology is exactly four Railway services:
  - `salesx-api`: FastAPI.
  - `salesx-website`: Website landing page at `/` and the independently built Sales Portal at `/sales`.
  - `salesx-customer`: Customer Portal at `/`.
  - `salesx-company`: Company Portal at `/`, Distributor at `/distributor`, Principal at `/principal`, Supervisor at `/supervisor`, and Super Admin at `/admin`.
- Each portal retains its own `apps/*` workspace, Next.js config, App Router, layout, route handlers, package scripts and standalone build. The grouped services run one Node gateway and one isolated Next.js standalone process per portal; no portal source is copied into another portal and no redirect-only routing is used.
- This is an explicit deployment-topology exception to the original PRD/Engineering Plan's one-service-per-app deployment boundary. Product/application ownership, independent workspace builds and source boundaries remain intact. See `docs/adr/ADR-004-four-railway-services-multi-portal-routing.md`.

### Implementation committed
- Added `infrastructure/scripts/portal-gateway.mjs`: production HTTP reverse gateway with path-bound routing, original request/cookie/header forwarding, WebSocket upgrade forwarding, child-process supervision and an API-dependent health endpoint that checks every portal runtime.
- Set Next.js `basePath` on Sales `/sales`, Distributor `/distributor`, Principal `/principal`, Supervisor `/supervisor`, and Super Admin `/admin`. Website, Customer and Company remain at root in their service group.
- Updated the Website and Company group documentation and each grouped portal README.
- Railway build contexts remain repository root. Group builds are sequential to reduce peak build memory and each portal's Next standalone output remains independently generated.

### Railway current state before group deployment
- The four required Railway services already exist in production:
  - `salesx-api`: `https://salesx-api-production.up.railway.app`
  - `salesx-website`: `https://salesx-website-production.up.railway.app`
  - `salesx-customer`: `https://salesx-customer-production.up.railway.app`
  - `salesx-company`: `https://salesx-company-production.up.railway.app`
- Before the new group gateway is deployed, Website and Company still run only their original single Next.js workspace. The presence of four healthy service deployments alone does not prove grouped route delivery.
- API readiness deployment `b0f7ea0b-8380-4cb2-bc81-6b1e7882d0d9`, Website `d1dc31e4-735a-47f1-aa49-26c8bd378f3a`, Customer `e8dad41a-a542-444e-9aa4-61a4635f7f9c`, and Company `015e5184-07bf-430b-85e6-666eab5133d2` were reported SUCCESS before this source revision.
- The previous Railway Free-plan service-count blocker is no longer relevant to this four-service topology. The old `@salesx-ai/mobile-sales` Railway service is not part of the target and remains untouched; Expo mobile is built/released through EAS.

### Remaining validation and blockers
- The grouped Website and Company Railway build/start commands and watch paths must be applied and their deployments must pass the `/api/health` gate. This gate verifies every local portal process plus the default portal's FastAPI `/readyz` dependency.
- Validate direct requests for all eight public routes, including a nested/deep route and `_next/static` asset delivery for each basePath. Do not infer route success from build success alone.
- Verify Railway environment CORS origins remain the three actual service origins (Website, Customer, Company), not eight fictional portal origins. Each grouped web service must keep its own exact `APP_PUBLIC_URL`; the Website origin remains the Expo Auth BFF origin.
- API FastAPI readiness and database TLS/migration evidence remain as previously recorded. Do not populate dummy SMTP, OAuth or provider credentials.
- Repository phase tracker currently has a governance inconsistency: its Phase 02 section remains PARTIAL and a later entry says Phase 03 is LOCKED, while later Phase 04 entries record implementation already performed. Resolve this phase-sequence/status conflict against current source evidence before declaring Phase 04 complete.
- SmartTeam feature action coverage and all existing dashboard local/demo interactions still require evidence of complete Fastapi typed-client integration; later-phase SmartOrder/Reward/AI/GPS/Analytics UI is not to be treated as Phase 04 completion evidence.

**Phase 04 remains IN_PROGRESS — NOT COMPLETED. Phase 05 — SmartOrder remains locked.**


## Phase 04 — Route asset and authentication callback hardening — 2026-11-20

- Website and Company grouped deployments are now `SUCCESS` on commit `1c95a6187c8ea17505bc39f45ac111e804602d91`; Customer deployment on the same commit is `SUCCESS`; API remains online on its previous successful deployment.
- Runtime logs confirm Website + Sales gateway starts both Next.js servers and reports both ready. Company gateway starts all five Next.js servers and reports each ready. All four target Railway services are online.
- The BFF callback path is now preserved from same-origin Referer into Supabase signup, recovery and OAuth callback URLs, with strict allowlisted route-prefix validation in the callback page. This prevents a login or recovery initiated in a child portal from returning users to the wrong root portal.
- Gateway readiness now checks each app root, its `/portal` deep route, one generated Next static JavaScript asset, root BFF CSRF, and FastAPI readiness. This is the production health gate for route and asset delivery.
- These source changes trigger a follow-up deployment of Website, Customer and Company. Update this record with their final deployment IDs/status and verify the health gate before treating route/asset readiness as complete.

**Phase 04 remains IN_PROGRESS — NOT COMPLETED. Phase 05 — SmartOrder remains locked.**


## Phase 04 — PWA scope and cache isolation — 2026-11-20

- The grouped portal manifests previously inherited the root manifest and registered one root-scoped service worker. That caused child portal installs to start at the wrong route and allowed the shared worker to cache dynamic HTML across portal paths.
- Updated Sales, Distributor, Principal, Supervisor and Super Admin manifests with independent IDs, `start_url`, `scope` and basePath-prefixed icons.
- Updated shared `AppProviders` to register the correct service worker URL and scope from the current portal prefix.
- Updated `public/sw.js` to namespace caches per portal scope and cache only public static assets/icons/manifests. API, auth and dynamic HTML responses are never cached.
- Extended grouped gateway readiness to require each portal root, `/portal` deep route, generated Next static JS asset, manifest and scoped service worker, plus BFF CSRF and FastAPI health.
- Added `/public/**` to Website, Customer and Company Railway watch paths so future PWA/static asset changes redeploy the correct service.
- These changes trigger the next deployment of Website, Customer and Company. Phase 04 remains IN_PROGRESS until all three deployments pass the expanded health gate.

**Phase 04 remains IN_PROGRESS — NOT COMPLETED. Phase 05 — SmartOrder remains locked.**


### PWA service-worker syntax validation correction — 2026-11-20
- Corrected the JavaScript regular-expression escaping in `public/sw.js` so scope-key normalization and static-file filtering are valid JavaScript.
- Railway Website, Customer and Company build commands now run `node --check public/sw.js`; Website and Company also run `node --check infrastructure/scripts/portal-gateway.mjs` before building portal workspaces.
- The correction is committed before final PWA deployment. Phase 04 remains IN_PROGRESS until the three resulting deployments pass the expanded health gate.
