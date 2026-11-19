# Phase 02 — Web/Expo Action Inventory & Authorization Evidence

Repository: `fadliansyah36/SalesXAi-Platform`  
Branch: `main`  
Supabase project ref: `eyofuiyxalbehbqoaeny`  
Baseline: Master PRD v1.0, Engineering Execution Master Plan v1.0, root `AGENTS.md`

## 1. Product surfaces in scope

The repository engineering contract defines seven authenticated Web portals and one native Expo application:

| Surface | Canonical consumer | Phase 02 authorization participation |
|---|---|---|
| Customer Portal | Existing Next.js customer portal | Shared Web Auth context, portal permission vocabulary |
| Company Portal | Existing Next.js company portal | Shared Web Auth context, tenant membership and permissions |
| Sales Portal | Existing Next.js sales portal | Shared Web Auth context, tenant membership and permissions |
| Distributor Portal | Existing Next.js distributor portal | Shared Web Auth context, tenant membership and permissions |
| Principal Portal | Existing Next.js principal portal | Shared Web Auth context, tenant membership and permissions |
| Supervisor Portal | Existing Next.js supervisor portal | Shared Web Auth context, tenant membership and permissions |
| Super Admin Portal | Existing Next.js Super Admin portal | Shared Web Auth context, platform permission context |
| Native Sales | `apps/mobile-sales/` Expo | Shared AuthClient/API client and action resolver |

Public Website is not an authenticated business portal and is not included in tenant-action coverage.

This is the application-surface inventory from the canonical repository contract. It is **not** a verified exhaustive route/page/button/handler inventory: the current GitHub connector inspection did not provide a complete recursive source-tree listing, and no unsupported screen counts are asserted.

## 2. Current FastAPI action inventory

The canonical Python and TypeScript registries cover **27/27 currently registered `/api/v1` route-method contracts**. FastAPI startup fails when a registered route is missing from the registry or a registry entry is stale.

| Feature group | Contracts | Protected action examples |
|---|---:|---|
| Identity and session | 8 | Read context, register/list/revoke session, sign-out, link/list/unlink identity |
| Platform security | 3 | List users, list roles, change account status |
| Organization and membership | 13 | List/create organization, read/invite/update members, assign role, list assignable roles, invitation read/create/accept/reject/revoke/resend |
| Audit | 1 | Read organization audit |
| BFF security | 2 | Refresh authorization and distributed rate-limit consumption |

The shared contracts now carry these dimensions:
- `resource`: protected resource class;
- `feature` and `action`: domain/action identity;
- `permission`: canonical permission key, or null for self/token/BFF gates;
- `rolePolicy` / `role_policy`: policy requirement;
- `scope`: self, tenant, platform or BFF scope;
- HTTP method and route path;
- server enforcement description.

The 27-entry route matrix is complete for the **current API only**. It must not be represented as coverage of all business actions described in the Master PRD.

## 3. Existing Web action-handler integration

The existing `/portal/access` surface is backed by:
- `components/auth/OrganizationAccessConsole.tsx`
- `components/auth/PlatformAccountSecurityConsole.tsx`

These components now use `canPerformApiAction` from the shared resolver for the following **13 UI action gates**:

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
13. `platform.users.status`

The session list is no longer requested when the effective self permission is absent. Each guarded mutation handler also rechecks the shared resolver before issuing the typed API call. FastAPI remains the authoritative enforcement layer.

The Web Auth provider and Expo auth hook both expose the same shared action resolver. The inspected Phase 02 Expo auth hook does not itself prove that every native feature screen/button/action handler consumes the resolver; complete Expo screen-level wiring remains open.

## 4. Live Supabase permission and tenant evidence

Read-only inspection of the bound project returned:

- Public tables: **12**
- Public tables with RLS enabled: **12/12**
- Permission keys: **23**
- Role-permission grants: **90**
- Roles: **8**
- Security Advisor: **0 lints**

Observed role keys and scopes:
- Platform: `platform_admin`
- Tenant: `tenant_owner`, `company_admin`, `distributor_user`, `principal_user`, `customer_user`
- Branch: `supervisor`, `sales_rep`

The live permission catalogue includes profile/self, identity/self, organization, membership, invitation, role assignment, branch, audit, account-status and portal-access permissions. The action registry does not create new role grants for business domains whose services/endpoints are not implemented.

The existing Phase 02 migration ledger remains at 13 applied versions as recorded in the phase tracker. This continuation added no schema delta, so no migration or Realtime publication change was applied. Existing private audit/RLS/grant controls remain in place. Security Advisor's zero-lint result is current read-only evidence, not a substitute for route/UI coverage.

## 5. Authorization enforcement boundaries

- FastAPI verifies Supabase JWT and resolves the actor/session from server-verified identity.
- Tenant selection is resolved against active membership; client-supplied organization IDs are selectors, not authority.
- Tenant and platform permissions are derived from scoped role assignments and inherited role permissions.
- Organization resource IDs are checked against the resolved tenant.
- Membership/role changes enforce delegation hierarchy and prevent equal/higher privilege assignment or modification.
- Session list/revoke are self-scoped and permission-gated.
- Permission/resource denial auditing records actor, tenant when resolved, resource/path, action/method, permission and correlation ID without credentials.
- Supabase RLS is enabled on all 12 public tables; client business writes remain denied by the existing policies/grants.

## 6. Remaining blockers — Phase 02 is not complete

1. **Full Web route/screen/menu/button/handler inventory is not yet proven.** The seven portal surfaces are identified, but a complete per-route and per-action source inventory has not been established.
2. **Full Expo action-handler integration is not proven.** The resolver is available from the native auth hook, but the full set of native screens/actions has not been mapped and wired.
3. **Business-domain actions do not have current FastAPI endpoints.** The inspected schema and current API registry are identity/tenant/security foundations; SmartTeam, SmartOrder, SmartReward, Location, Analytics and Workflow business mutations are not covered by the 27 current endpoints. Their endpoint/service work belongs to their phase sequence and must not be faked or marked enforced in Phase 02.
4. **No proof that every local-state/demo-style interaction in existing feature screens has been replaced or fail-closed.** Those actions remain outside the current API matrix until their real domain service/API exists.
5. **Latest code changes still require fresh static CI evidence.** Successful earlier API/foundation workflows do not validate commits made after those runs.
6. Deployment secrets/provider settings remain intentionally unset; no live FastAPI runtime, OAuth provider, SMTP delivery or Auth Admin operation is claimed. These are not silently marked configured.

## 7. Latest code commits in this continuation

- `e076ed934ee17fa95ce95742c12bee2eeee71df9` — Web organization access UI now gates session, identity, membership and invitation actions through the shared resolver.
- `662da074c5088cf40be3aa30e3d9f6fb89afe6b8` — platform account-status UI gates the mutation through the shared resolver.
- `fcb43e5a6256c6a6252a91cc8cda2018f259897c` — TypeScript action contracts now include resource and role-policy metadata.
- `03dcdc66419537857e5b56c481667f34dcd959f7` — FastAPI action registry aligned with resource and role-policy metadata.
- `f18b7904ad2c127486d60243d66033d9f1aecf1e` — tests require complete resource/policy/scope metadata.

Earlier workflows `44572989578` (API) and `44572989593` (Web/Expo foundation) completed successfully on the earlier `4b4b411e8258af68fb5a70722e110551d0eec975` code head. They are historical baseline evidence only, not validation of the commits listed above.

## 8. Phase decision

**Phase 02 status: PARTIAL / IN PROGRESS.**  
**Phase 03: NOT STARTED, as explicitly instructed.**

Do not mark Phase 02 COMPLETED until all current Web and Expo business action consumers are inventoried, every relevant action is guarded, and every business mutation has a real FastAPI service/endpoint with server-side permission, tenant/ownership and audit enforcement. No mock endpoint or permission grant may be used to make the matrix appear complete.


## 8. Runtime use of the canonical registry

The FastAPI registry is now used by route dependencies, not merely by startup parity validation:
- `require_api_action(action_id)` resolves the Python contract and selects the server-side self, tenant or platform dependency.
- All 25 user-scoped route contracts in Auth, Organization, Admin and Audit routers reference their stable action IDs through this resolver.
- The two BFF contracts are intentionally excluded from user dependencies and continue through explicit shared-secret gates.
- Unknown action IDs and attempts to use a BFF action as a user dependency fail closed.
- TypeScript and Python registry parity was checked for all 27 contracts.

This centralizes the authorization policy selection for existing API routes. It does not add missing business-domain endpoints or prove exhaustive Web/Expo screen-level wiring; the Phase 02 closure blockers in section 6 remain.
