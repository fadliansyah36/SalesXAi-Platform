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

## Phase 03 — IN_PROGRESS

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
