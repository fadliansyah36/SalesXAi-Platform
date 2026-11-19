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
- [x] RLS is enabled on all 11 Phase 02 public tables; client writes and sensitive table access are denied.
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
- [ ] Supabase manual identity linking provider setting and Google OAuth callback/provider configuration are not verified in the target project.
- [ ] Existing-user invitation email delivery is not connected to a transactional email provider: create/resend returns a one-time URL for authorized delivery. New unregistered identities receive Supabase Auth Admin invite email only when SUPABASE_SECRET_KEY is configured.
- [ ] Permission-aware navigation is wired as portal-level UX guards; action-level visibility across every existing feature is not yet exhaustively mapped. FastAPI remains the authorization boundary.
- [ ] FastAPI runtime is not configured/verified. DATABASE_URL (database password/session-pooler URL), SUPABASE_PUBLISHABLE_KEY, SUPABASE_SECRET_KEY, APP_PUBLIC_URL, exact CORS origins and API deployment secrets are not present in repository/runtime.
- [ ] Account status endpoint requires SUPABASE_SECRET_KEY for Auth Admin ban/unban; this secret is not available through the repository or database connector.
- [ ] Live FastAPI /readyz, authenticated /api/v1/auth/me, remote sign-out, invitation email delivery and Auth Admin ban checks remain unevidenced.
- [x] Web TypeScript and lint passed in GitHub Actions run 44527347416 (head 7ee0ffade24200816e7593b63eee6f13428dba2d) and again in foundation run 44527586969.
- [x] FastAPI unittest, compileall and Ruff passed in GitHub Actions run 44527586864.
- [x] Native TypeScript, Expo SDK dependency check, app config, Metro, Android/iOS bundle exports and Turborepo build passed in GitHub Actions run 44527586969.
- [x] Source files for all 8 applied migration versions are now present in the GitHub migration directory. The 20261119115701, 20261119120627 and 20261119120742 SQL files were restored as idempotent source mirrors from the live schema and applied migration evidence; no migration was re-applied during this continuation.
- [ ] Specific remote refresh-token revocation for a different device cannot be claimed from DELETE /auth/sessions/{id}; this endpoint denies that session at FastAPI only. Supabase global/others/local logout are remotely invoked when the active session is available.
- [ ] FastAPI runtime secret and PostgreSQL connection are not set or verified. The database connector proves SQL access to the target Supabase project, not the FastAPI process connection. No database password, API deployment secret store or runtime base URL was exposed through the available connectors.

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
- RLS enabled on all 11 Phase 02 public tables.
- Security Advisor: zero lints.
- Realtime: not applicable; authorization re-reads PostgreSQL state on each protected request.

### Engineering evidence
- Final code head: 7d5c916d2b6fdb623b71afe1a773456f0dacb6fd.
- Phase 02 CI: https://github.com/fadliansyah36/SalesXAi-Platform/actions/runs/44527586864.
- Bun/Web/Expo CI: https://github.com/fadliansyah36/SalesXAi-Platform/actions/runs/44527586969.
- FastAPI source: services/api/app/.
- Shared packages: packages/shared-types, packages/api-contracts, packages/permissions, packages/auth-client.
- Web consumer entry: components/providers/SalesXAuthProvider.tsx.
- Organization access UI: app/portal/access/.
- Auth/security architecture: docs/engineering/identity-and-authorization.md.
- API workflow: .github/workflows/phase-02-api-checks.yml.

Phase 02 remains PARTIAL. Expo and static CI validation are complete, and migration-source parity is restored. Closure is blocked by unavailable FastAPI runtime/database credentials, unverified Supabase OAuth/manual-linking configuration, missing transactional email delivery for existing-user invite resend, incomplete action-level permission visibility, and absent live authenticated API/session-revocation evidence.
 
## Next phase

Phase 02 remains in progress. Phase 03 is not authorized until Phase 02 reaches COMPLETED.
