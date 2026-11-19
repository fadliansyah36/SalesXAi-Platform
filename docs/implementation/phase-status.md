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
- Previous implementation baseline: 7d5c916d2b6fdb623b71afe1a773456f0dacb6fd. Current Phase 02 code head before documentation commits: 0df9c63f821028e3b2a8bfa9467473ad30be1f6b.
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
- Added packages/api-client and wired it into the Web auth provider and Expo native auth hook. It centralizes bearer token, platform, active organization, one refresh/retry and session invalidation handling. Added package workspace entries and Bun lock references.
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
