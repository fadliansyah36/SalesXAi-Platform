# Phase 02 — Identity, Tenant & Authorization Action Inventory

Repository: `fadliansyah36/SalesXAi-Platform`  
Branch: `main`  
Supabase project ref: `eyofuiyxalbehbqoaeny`  
Source of truth: root `AGENTS.md`, Master PRD v1.0, Engineering Execution Master Plan v1.0, Cross-Platform Implementation Flow v1.0.

## 1. Phase boundary

Engineering Execution Master Plan v1.0 defines:
- **Phase 02:** Identity, Tenant & Authorization Foundation.
- **Phase 03:** Master Data, Organization, Branch, Territory, Team & Outlet.

Therefore SmartTeam, SmartOrder, SmartReward, Location, Analytics, Workflow, AI and Telegram business operations are not Phase 02 endpoint blockers. Their existing UI modules are inventoried below and remain assigned to their later domain phases. Phase 02 must deliver the identity/session/tenant/RBAC/ABAC/audit foundation consumed by all portals.

## 2. Application surface inventory

### Web routes and portal components

| Route entry | Portal component | Existing feature/module IDs discovered |
|---|---|---|
| `/portal` | `components/portal/SalesPortalApp.tsx` | catalog, create, history, promo, planner, schedule, gps, attendance, leads, smartreward, target, AI, Studio, workspace, Telegram, notifications, sync, settings, outlet, order, activity |
| `/company` | `components/company/CompanyPortalApp.tsx` | dashboard, analytics, financial, targets, branches, team, territories, outlets, products, master performance, live/history GPS, visits, attendance, orders, promotions, reports, integrations |
| `/customer` | `components/customer/CustomerPortalApp.tsx` | dashboard, catalog, pricing, promo, cart, order status, reward, more |
| `/distributor` | `components/distributor/DistributorPortalApp.tsx` | dashboard, catalog, inventory, stock movement, orders, fulfillment, delivery status, outlets, team, coverage, reports, promotions, settings |
| `/principal` | `components/principal/PrincipalPortalApp.tsx` | dashboard, products, categories, variants, price list, pricing policy, campaigns, distributors, distributor orders, analytics, AI settings |
| `/supervisor` | `components/supervisor/SupervisorPortalApp.tsx` | dashboard, team, shifts, live map, visits, route replay, coverage, performance, targets, timeline, alerts, reports, settings |
| `/super-admin` | `components/super-admin/SuperAdminPortalApp.tsx` | dashboard, tenants, organizations, users, analytics, master data, roles, domains, feature flags, services, subscriptions, integrations, AI providers, agents, Telegram bots, usage/cost, security events, audit logs, system health |

All seven authenticated Web portal components use the shared `canAccessPortal` route/surface resolver. Across these seven component sources, source scanning found **443 JSX `onClick` sites and 7 `onSubmit` sites**. These counts are source event-handler sites, not 450 distinct business mutations.

Important boundary finding:
- The six non-Super-Admin domain portals currently contain no typed `apiClient` call sites and no `canPerformApiAction` action-level checks in their portal component files. Their UI feature modules are the existing UI surfaces for Phases 03–13; they are not represented as implemented backend mutations by this Phase 02 work.
- The Super Admin portal now fails closed for modules without a Phase 02 action/API contract. Only Users, Roles and Audit Logs remain navigable in this phase. Later-phase modules such as Tenants, Organizations, Master Data, Analytics, Integrations, AI Providers, Agents, Telegram Bots, Security Events and System Health remain hidden until their own domain APIs and action contracts exist.
- The two role comparisons found in Company Portal are used for business presentation/ranking, not authorization. The inspected portal route/navigation guards do not rely on hardcoded role names.

### Shared Web identity and access screens

| Screen/component | Actions |
|---|---|
| `/portal/access` → Organization Access Console | active organization context, member list/update, assignable-role list, invitation list/create/resend/revoke, linked identity list/link/unlink, device session list/revoke |
| Platform Account Security Console | platform account status mutation |
| Super Admin Users | platform account directory read and status mutation |
| Super Admin Roles | platform role/permission catalogue read |
| Super Admin Audit Logs | platform-scoped audit read and local export of the authorized result set |
| `/auth/accept-invitation` | token-bound invitation accept/reject |
| Shared `SalesXAuthProvider` | BFF login/signup/OTP/OAuth/recovery/update-password/signout, `/api/v1/auth/me`, current-session registration, tenant selection, refresh/revocation, permission refresh |

### Expo Native Sales

| Surface | Actions |
|---|---|
| `apps/mobile-sales/App.tsx` | sign-in/sign-up, OTP, OAuth callback, profile, tenant selection, signout/account switch, session list/revoke, linked identity list/link/unlink, invitation deep-link acceptance |
| `apps/mobile-sales/src/auth/useMobileSalesAuth.ts` | Supabase Auth + SecureStore lifecycle, current-session registration, `/api/v1/auth/me`, tenant context, permission resolver, invitation and identity handlers |

The native screen source has **17 `onPress` sites** and uses the shared typed API client for its identity/session reads and mutations. Five distinct Phase 02 action gates are consumed by the native screen; the hook additionally checks identity-link/unlink and invitation-accept handler entrypoints.

## 3. Phase 02 UI action mapping

There are **18 unique action IDs** consumed by Web and/or Expo UI handlers:

1. `identity.session.list`
2. `identity.session.revoke`
3. `identity.link.authorize`
4. `identity.link.list`
5. `identity.link.unlink`
6. `organization.members.read`
7. `organization.members.update`
8. `organization.roles.assignable`
9. `organization.invitations.read`
10. `organization.invitations.create`
11. `organization.invitations.resend`
12. `organization.invitations.revoke`
13. `organization.invitations.accept`
14. `organization.invitations.reject`
15. `platform.users.list`
16. `platform.users.status`
17. `platform.roles.list`
18. `platform.audit.read`

The source scan found 40 calls to the shared `canPerformApiAction` / `permissionCanPerformApiAction` resolver across the Web access consoles, Super Admin portal, Web invitation page, Expo screen and Expo auth hook. The 18 IDs above are unique action identities; repeated call sites enforce both visibility and handler entry.

Actions such as session registration, context read, signout, organization list/create, role assignment and BFF refresh/rate-limit are invoked by the auth/provider or API lifecycle rather than by a user-visible button. They still have explicit endpoint contracts and server-side enforcement in the matrix.

## 4. Canonical action contract and endpoint mapping

The shared TypeScript registry is `packages/permissions/src/action-matrix.ts`; the FastAPI registry is `services/api/app/security/action_matrix.py`.

Each contract includes:
`action ID → method/path → feature/action → resource → role policy → permission key → scope → server enforcement`.

| Action group | Contracts | Enforcement |
|---|---:|---|
| Identity context/session | 5 | Verified JWT/session, device registry, self permission, owner filter, provider signout |
| Identity links | 3 | Self permission, verified identity ownership, provider identity lifecycle |
| Platform users/roles/audit | 4 | Platform-scoped permissions; account read/status are separate permissions; audit is platform-only |
| Organization/membership/invitations | 13 | Active membership, tenant/resource match, delegation hierarchy, single-use invitation token |
| Tenant audit | 1 | Tenant-scoped `audit:read` and organization match |
| BFF refresh/rate limit | 2 | Explicit internal shared-secret gate, active device session, distributed rate-limit storage |
| **Total** | **28** | **26 user-scoped FastAPI route actions + 2 BFF-only actions** |

The 28 TypeScript and Python contracts are source-verified **28/28 identical** across action ID, method, path, feature, action, resource, role policy, permission, scope and enforcement description.

FastAPI startup validation now checks:
- every registered `/api/v1` method/path has exactly one current action contract;
- no stale contract exists;
- each non-BFF route dependency tree contains exactly its contract's action ID;
- each BFF route carries its explicit BFF action marker.

All **26 user-scoped route contracts** are referenced through `require_api_action`; the two BFF routes are explicitly marked and cannot be passed to user authorization dependencies. Unknown IDs and BFF/user-scope mismatches fail closed.

## 5. Authorization service, repository and domain boundary

New Phase 02 authorization layers:
- `app/repositories/authorization.py`: principal/session record, active memberships, self/tenant/platform permission assignments, branch-to-tenant validation and denial audit persistence.
- `app/services/authorization.py`: RBAC/ABAC decisions, denial recording and service-boundary assertion of authorized action ID, actor and tenant.
- `app/security/dependencies.py`: JWT/session and tenant dependencies now delegate persistence/policy evaluation to the authorization service. `require_api_action` sets `request.state.authorized_api_action_id`.
- Phase 02 identity, membership, role, invitation, account-status and audit handlers call the service-boundary assertion before the protected operation. There are **16** explicit action/actor/tenant boundary assertions in the inspected Auth, Organization and Admin routers.

The service boundary rejects a missing/mismatched action ID, actor mismatch or cross-tenant context. The route dependencies still perform the actual database permission checks before a route handler runs.

## 6. RBAC, ABAC, ownership and tenant controls

- JWT subject/session claims are verified server-side; active profile, verified email/phone, registered device session, Auth session expiry, device revocation and session-revocation epoch are checked before API access.
- Tenant context is resolved from active organization membership; `X-Organization-ID` is a selector, not authority.
- Tenant action permissions are resolved through active scoped role assignments and recursive role hierarchy; branch selectors must belong to the resolved tenant.
- Self actions require self permission and owner scoping.
- Platform actions require a platform-scoped assignment; tenant grants cannot satisfy platform-only endpoints.
- Role and membership mutation handlers retain delegation hierarchy checks to prevent equal/higher privilege escalation.
- BFF refresh and rate-limit endpoints remain protected by the internal shared-secret gate; external auth routes retain distributed rate limiting.
- Web retains HttpOnly BFF cookie/session handling; Expo retains native SecureStore. Account/tenant/permission-context changes increment the consumer epoch so Web consumers remount and Expo state remounts on context epoch changes.

## 7. Platform audit and database security evidence

Live Supabase project inspection after migrations:

| Evidence | Current result |
|---|---:|
| Applied migrations | 16 |
| Public tables | 12 |
| Public tables with RLS enabled | 12/12 |
| Permission keys | 25 |
| Roles | 8 |
| Role-permission grants | 92 |
| Security Advisor | 0 lints |
| Platform audit partial index | Present |

New permission keys `account:read` and `role:read` are granted only to `platform_admin`; listing users/roles no longer requires mutation permissions `account:status:manage` or `role:assign`.

Platform audit:
- `GET /api/v1/admin/audit` is protected by platform-scoped `audit:read`, returns only platform-level rows (`organization_id IS NULL`), is rate limited and writes an audit receipt for the read action.
- `admin_audit_logs_deny_client_access` denies all table commands to `anon` and `authenticated`.
- The append-only trigger protects update/delete; the application `service_role` now has only SELECT and INSERT privileges on the audit table. Database owner privileges remain administrative.
- The partial index `admin_audit_platform_time_idx` supports platform audit ordering.

Migrations added and applied:
- `20261119172508_p02_platform_read_permissions_and_audit_index.sql`
- `20261119173915_p02_restrict_audit_mutation_grants.sql`
- `20261119174508_p02_revoke_audit_reference_trigger_grants.sql`

No deployment secrets, Google OAuth credentials, SMTP credentials or provider live settings were populated.

## 8. Fresh static CI evidence

Latest API workflow:
- Workflow: **SalesX-Ai Phase 02 API Checks #266**
- Run ID: `44580580455`
- Validated commit: `ffffde450adc8a0ee5c41452d835b822dc427d08`
- Result: SUCCESS.
- API tests: **39 passed**.
- `python -m compileall -q app`: passed.
- `ruff check app`: passed.
- Web `bun run typecheck`: passed.
- Web `bun run lint`: passed.

Latest foundation workflow:
- Workflow: **SalesX-Ai Phase 00-01 Foundation Verification #181**
- Run ID: `44580441850`
- Validated commit: `0f3e73722b68da18a8d6040c4fab15ed42f098fe`
- Result: SUCCESS.
- Bun frozen workspace install, design token generation/reproducibility, Web TypeScript/lint, Expo Native TypeScript, Expo SDK compatibility, app config, Metro, Android/iOS bundle exports and Turborepo workspace build: passed.

The Foundation workflow commit predates only later database migration/test/documentation changes; no Web/Expo source changes occurred after that validation. No staging or real-world test was run, as instructed.

## 9. Remaining closure blockers

1. **Business mutation service/repository completeness:** the authorization persistence/service layer and 16 service-boundary assertions are now implemented. However, several existing Phase 02 mutation handlers still contain their domain SQL directly in router functions rather than delegating each mutation to a dedicated application service and mutation repository. This does not satisfy the requested per-mutation service/repository separation yet.
2. **Exhaustive future-phase handler mapping:** the seven portal components contain 443 JSX click sites and 7 form-submit sites. The inventory identifies their module surfaces and maps them to later domain phases, but not every future-phase click handler has an individual resource/action/permission/API contract. These future domain actions are not Phase 02 domain blockers, but the broader all-platform action inventory requested remains incomplete at handler granularity.
3. Provider secrets and external OAuth/SMTP settings remain intentionally unset and are deployment-dependent, not code-completion evidence.

## 10. Phase decision

**Phase 02 status: PARTIAL / IN PROGRESS — NOT COMPLETED.**

The identity/tenant action matrix, 28 endpoint contracts, Web/Expo Phase 02 action gates, authorization service/repository, platform audit endpoint, database grants/RLS evidence and fresh static CI are implemented. Do not mark Phase 02 complete until the remaining mutation-specific service/repository separation and requested full handler-level action inventory are closed.

**Phase 03: NOT STARTED in this execution.** It remains eligible for a separate parallel workstream only after its migration, domain ownership and API contracts are isolated from Phase 02.


## 11. Phase 02 final mutation-service/repository refactor (2026-11-20)

The following Phase 02 mutation routes now delegate to dedicated application services and mutation repositories. Router functions are limited to request parsing, dependency injection, service invocation and response mapping.

| Domain | Mutation operations moved | Application service | Mutation repository |
|---|---:|---|---|
| Account administration | 1 — account status change, including session revocation | `AccountAdministrationService` | `AccountAdministrationRepository` |
| Session lifecycle | 3 — register, revoke, sign out | `SessionMutationService` | `SessionMutationRepository` |
| Identity lifecycle | 1 — unlink own provider identity | `IdentityMutationService` | `IdentityMutationRepository` |
| Organization/membership | 4 — create organization, add member, update membership status, assign role | `OrganizationMutationService` | `OrganizationMutationRepository` |
| Invitation lifecycle | 5 — create, accept, reject, revoke, resend | `InvitationMutationService` | `InvitationMutationRepository` |
| **Total mutation routes** | **14** | **5 dedicated services** | **5 dedicated repositories** |

Invitation expiry is also performed by `InvitationMutationService.list_invitations` with transaction and audit handling, rather than as a side effect in the HTTP router.

A source scan of every registered router file (`admin.py`, `audit.py`, `auth.py`, `master_data.py`, `organizations.py`, `security.py`) found **zero domain DML statements** (`INSERT`, `UPDATE public.*`, `DELETE FROM`) in router source. Domain SQL mutations now reside in repositories and are orchestrated by services with tenant/ownership checks, transactions and audit receipts. Provider actions (Supabase Auth invitation delivery, session signout and identity unlink) are orchestrated by application services; credentials remain deferred.

The Phase 02 UI action contract scope remains 18 unique UI action IDs and 40 resolver call sites across Web access/security, Super Admin, invitation and Expo auth surfaces. The source inventory records 443 Web `onClick`, 7 Web `onSubmit`, and 17 Expo `onPress` sites across the seven Web portal components and Expo Sales screen. The six business-domain portals whose actions belong to later phases are explicitly recorded as future-phase surfaces rather than misrepresented as Phase 02 identity actions.

Phase 03 has since added its own 22 master-data and platform-tenant action contracts. Those contracts are recorded separately in `docs/implementation/phase-03-action-inventory.md` and do not change the Phase 02 contract baseline of 28 actions.


## 12. Final closure evidence — 2026-11-20

### Router / service / repository boundary

All registered FastAPI routers were reconciled. The Phase 02 mutation operations moved to dedicated service/repository pairs:

| Domain | Mutation routes | Application service | Repository |
|---|---:|---|---|
| Account administration | 1 | `AccountAdministrationService` | `AccountAdministrationRepository` |
| Session lifecycle | 3 | `SessionMutationService` | `SessionMutationRepository` |
| Identity lifecycle | 1 | `IdentityMutationService` | `IdentityMutationRepository` |
| Organization / membership / role | 4 | `OrganizationMutationService` | `OrganizationMutationRepository` |
| Invitation lifecycle | 5 | `InvitationMutationService` | `InvitationMutationRepository` |
| **Total** | **14** | **5 mutation services** | **5 mutation repositories** |

The read/query boundary was also normalized:
- Identity profile, memberships, effective permissions, sessions and linked identities: `IdentityReadService` / `IdentityReadRepository`.
- Organization directory, membership directory and assignable-role delegation: `OrganizationReadService` / `OrganizationReadRepository`.
- Platform user, role and audit reads: `PlatformReadService` / `PlatformReadRepository`.
- Tenant audit reads: `AuditReadService` / `AuditReadRepository`.
- BFF session-refresh authorization now calls `SessionMutationService.authorize_refresh`.

A fresh source scan of all `services/api/app/routers/*.py` files found **zero** direct `connection.fetch/fetchrow/fetchval/execute/executemany` calls and **zero** domain DML statements. `test_phase02_mutation_architecture.py` enforces this boundary for every router file, and verifies the five mutation-specific service/repository pairs.

### Full source handler inventory

The handler-level source extract is committed at:

- `docs/implementation/handler-level-action-inventory.tsv`

It contains **868 callback/event prop occurrences** across the seven Web portal components and the Expo Sales app. The extract includes portal, source file, line, screen-context marker, handler prop, expression excerpt, scope classification and resource/action/permission/endpoint/service disposition.

Source event totals include:
- Web: **443** `onClick`, **7** `onSubmit`.
- Expo Sales: **17** `onPress`.
- Remaining rows include component callback props and local input/UI state handlers; they are deliberately distinguished from server mutations.

Automated scope tags in the inventory classify 87 rows as Phase 02 identity/session, 24 as Phase 03 master-data/tenant, 524 as future-phase domain actions and 233 as UI-state callbacks. Future-phase rows are recorded against their owning phase; no fake endpoint or permission contract is invented for an unimplemented domain. The canonical Phase 02 contract baseline remains 18 unique UI action IDs and 40 resolver call sites. The full API action registries now contain 50 IDs (28 Phase 02/platform foundation plus 22 Phase 03) with exact Python/TypeScript ID parity.

### Final engineering validation

- Phase 02 API Checks run **44591830007**, validated code commit `8917bcaac8da50e56e6a63c55569cab7c4811fbe`: **SUCCESS**.
  - 46 Python unit tests passed.
  - Python compileall passed.
  - Ruff passed.
  - Web TypeScript typecheck passed.
  - Web lint passed.
- Foundation Verification run **44588497867**, validated cross-platform source head `fcacb165b42f290ef8ad785513485fe1d3ee074b`: **SUCCESS**.
  - Bun frozen workspace installation and token reproducibility passed.
  - Web TypeScript/lint passed.
  - Expo Native TypeScript, SDK dependency compatibility, app config, Metro startup, Android/iOS bundle exports and Turborepo workspace build passed.
  - The latest Web/Expo/API-client source files at the time of that run are at or before the validated source head; subsequent changes in this closure stream were API service/repository code, tests and documentation.

### Closure decision

The requested Phase 02 identity, tenant, RBAC/ABAC, session, audit, API-client and router/service/repository boundaries are implemented. Supabase Auth/JWT/tenant authorization and RLS/grants evidence is recorded in the phase tracker. SMTP, Google OAuth credentials and deployment/provider secrets remain intentionally deferred; they are not implementation blockers.

**Phase 02 status: COMPLETED.** This closure is an engineering implementation status, not a claim of deployment or real-world validation.
