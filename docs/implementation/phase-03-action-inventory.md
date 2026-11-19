# Phase 03 — Master Data & Organization Action Inventory

Status: **IN_PROGRESS**  
Repository: `fadliansyah36/SalesXAi-Platform` · branch `main`  
Database: Supabase project `eyofuiyxalbehbqoaeny`

## Implemented vertical slice

The following UI surfaces now use the typed API client and FastAPI rather than local-only mutations:

- Company Portal: branch list/create/status update.
- Company Portal: territory list/create.
- Company Portal: outlet list/create/status update.
- Super Admin: tenant list/create/status update.
- Super Admin: organization branch / head-office / regional-warehouse list/create/update.

The existing UI components and design system were retained. The Company Portal's branch, territory and outlet master-data arrays are loaded from the active tenant API. Super Admin tenant and branch screens are loaded from platform-scoped APIs. Loading and API error states are surfaced; unsupported billing-plan changes are read-only because billing is not part of this master-data slice.

## API action contracts

Canonical registries:
- Python: `services/api/app/security/action_matrix.py`
- TypeScript: `packages/permissions/src/action-matrix.ts`

Both registries currently contain **50 action IDs** and the Python/TypeScript ID sets match exactly. Phase 03 introduced 22 contracts:

| Action ID | HTTP endpoint | Permission | Application service |
|---|---|---|---|
| `master.branches.read` | GET `/api/v1/organizations/{organization_id}/branches` | `branch:read` | `MasterDataService.list` |
| `master.branches.create` | POST `/api/v1/organizations/{organization_id}/branches` | `branch:manage` | `MasterDataService.create` |
| `master.branches.update` | PATCH `/api/v1/organizations/{organization_id}/branches/{record_id}` | `branch:manage` | `MasterDataService.update` |
| `master.teams.read/create/update` | GET/POST/PATCH `/api/v1/organizations/{organization_id}/teams` | `team:read/manage` | `MasterDataService` |
| `master.territories.read/create/update` | GET/POST/PATCH `/api/v1/organizations/{organization_id}/territories` | `territory:read/manage` | `MasterDataService` |
| `master.outlets.read/create/update` | GET/POST/PATCH `/api/v1/organizations/{organization_id}/outlets` | `outlet:read/manage` | `MasterDataService` |
| `master.sales_profiles.read/create/update` | GET/POST/PATCH `/api/v1/organizations/{organization_id}/sales-profiles` | `sales_profile:read/manage` | `MasterDataService` |
| `master.assignments.read` | GET `/api/v1/organizations/{organization_id}/outlet-assignments` | `assignment:read` | `MasterDataService.list_assignments` |
| `master.assignments.manage` | POST `/api/v1/organizations/{organization_id}/outlets/{outlet_id}/assignments` | `assignment:manage` | `MasterDataService.assign_outlet` |
| `platform.organizations.list` | GET `/api/v1/admin/organizations` | platform `organization:read` | `OrganizationMutationService.list_platform_organizations` |
| `platform.organizations.update` | PATCH `/api/v1/admin/organizations/{organization_id}` | platform `organization:update` | `OrganizationMutationService.update_platform_organization_status` |
| `platform.organizations.branches.read/create/update` | GET/POST/PATCH `/api/v1/admin/organizations/{organization_id}/branches` | platform `organization:read/update` | `OrganizationMutationService` + `MasterDataRepository` |

Every endpoint has a matching server-side `require_api_action` dependency. Tenant routes verify the active organization context and use organization-scoped predicates and composite foreign keys. Platform tenant-management routes require platform-scoped permissions.

## Backend layers

- `services/api/app/routers/master_data.py`: HTTP/request/response and action dependencies only.
- `services/api/app/services/master_data.py`: tenant checks, reference validation, transaction boundaries and audit receipts.
- `services/api/app/repositories/master_data.py`: parameterized SQL for branches, teams, territories, outlets, sales profiles and outlet assignments.
- `services/api/app/services/organization_mutations.py` and `repositories/organization_mutations.py`: platform tenant and branch management.
- `packages/api-contracts/src/index.ts`: shared request/response contracts.
- `packages/api-client/src/index.ts`: typed Web client methods.

Tenant invariants include active membership for assigned sales/supervisor/manager users, same-organization branch/team/territory references, active outlet and sales-profile assignment targets, unique tenant-scoped codes, and one active outlet assignment at a time. Mutations are transaction-wrapped and audited.

## Supabase migrations applied

| Migration version | File | Scope |
|---|---|---|
| `20261119175922` | `20261119175922_p03_master_data_core.sql` | teams, territories, outlets, sales_profiles, outlet_assignment_history; permissions, role grants, RLS and client-deny policies |
| `20261119180611` | `20261119180611_p03_branch_contact_location_fields.sql` | branch city, address, manager, phone and coordinate fields |
| `20261119181929` | `20261119181929_p03_branch_type.sql` | head_office / branch / warehouse discriminator |

All three migrations are applied to the target Supabase project. Current database evidence: **19 applied migrations, 17 public tables, RLS enabled on 17/17 tables, 35 permission keys, 8 roles, 122 role-permission grants**. All five Phase 03 tables have RLS enabled and explicit deny policies for direct `anon`/`authenticated` table access; FastAPI service role remains the application data path.

## Remaining Phase 03 work

- Wire Company Portal team-personnel screen and modals to active organization membership, team hierarchy, sales profiles and supervisor assignments. The APIs and typed contracts exist; the legacy personnel UI still needs this user-selection flow.
- Add import/export foundation for master-data entities, including validation, row-level errors, audit and idempotent batch boundaries.
- Decide and implement private realtime invalidation/broadcast only for screens requiring multi-user live updates. Current integrated master-data screens refresh through FastAPI; private broadcast subscriptions are not yet implemented.
- Complete remaining tenant-level branch/outlet detail and operational assignments across the existing portals.
- Run fresh API, Web and Expo static CI against the final combined commit and repair any failures.

**Phase 03 remains IN_PROGRESS.** The current implementation is a working master-data/API foundation and a partial portal vertical slice, not a completed phase.


## 2026-11-20 continuation — Company Team hierarchy and profile assignment

The existing Company Portal Team screen is now partially connected to live master data:

- Team list is loaded from `GET /api/v1/organizations/{organization_id}/teams`.
- Sales profiles are loaded from `GET /api/v1/organizations/{organization_id}/sales-profiles`.
- Active organization memberships are loaded from `GET /api/v1/organizations/{organization_id}/members` for supervisor labels and selection.
- The existing Team Structure modal now creates a team through FastAPI, including branch, optional supervisor and optional parent-team references.
- The Team Structure view displays real team, branch, supervisor and parent-team relationships; the former hardcoded team counts/hierarchy were removed.
- The personnel assignment modal now updates an existing sales profile's `team_id`, `manager_user_id` and status through the typed API client. Clearing a supervisor is supported by preserving explicit nullable update values through the repository.
- Company Portal no longer initializes Team personnel from `INITIAL_TEAM_MEMBERS`. GPS maps are withheld until actual location telemetry exists; Phase 07 location data is not fabricated.

The current UI still does not create a new sales profile from an organization membership. RBAC role assignment is intentionally kept in the existing Access Console and is not simulated by the Team modal.

### Updated remaining Phase 03 work

- Add a Company Portal flow to create a sales profile for an existing active organization member, including team/manager and effective dates.
- Integrate outlet assignment list/create/history into Company/Sales/Supervisor surfaces.
- Complete update/deactivation workflows for territories, teams and outlets in their existing screens.
- Add master-data import/export foundation with validation, row-level errors, audit and idempotent batch processing.
- Add private tenant-authorized Realtime invalidation/broadcast where required.
- Connect Expo assigned team/outlet context to the same typed API and permission contracts.

**Phase 03 remains IN_PROGRESS.** This update records an additional connected vertical slice; it does not imply full phase completion.
