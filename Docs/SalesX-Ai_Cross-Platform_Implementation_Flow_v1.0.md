# SalesX-Ai — Cross-Platform Vertical-Slice Implementation Flow

Version: 1.0  
Applies to: Master PRD v1.0, Engineering Execution Master Plan v1.0, root AGENTS.md  
Repository: fadliansyah36/SalesXAi-Platform (main)  
Supabase: SalesXAi Db / `eyofuiyxalbehbqoaeny`

## 1. Purpose and authority

This document operationalizes the Master PRD's single-monorepo, single-Supabase-source-of-truth, API-first architecture. It adds implementation sequencing; it does not replace the PRD's product scope, existing portal UI, or phase definitions.

The native Sales application is a first-class product surface, not an optional companion or a later standalone project:
- Web portals: existing Next.js applications and routes in this repository.
- Native Sales: `apps/mobile-sales/`, React Native + Expo, Android and iOS.
- Business backend: `services/api/`, Python FastAPI.
- Data platform: the one designated Supabase project.
- Shared contracts/client/types: workspace packages consumed by web and mobile.

## 2. Single source of truth

The canonical ownership model is:

| Concern | Authority |
|---|---|
| Business data and durable state | Supabase PostgreSQL |
| Identity | Supabase Auth; JWT verified by FastAPI |
| Business rules, authorization and mutations | FastAPI domain/application services |
| Public API contract | FastAPI OpenAPI + versioned shared API contracts |
| Web/native request behavior | Shared typed API client and generated types |
| Realtime | Supabase Realtime as delivery/notification; database remains truth |
| File/media metadata and access | Supabase Storage metadata/policies, issued through authorized backend flows |
| UI tokens | Canonical design-token package |
| Long-running work | Durable workflow/job state persisted in Supabase; workers execute it |

No portal or mobile app may create a parallel business database, independently calculate authoritative price/stock/order/reward values, or bypass FastAPI for business-critical writes. Do not store authoritative business state in AsyncStorage, browser storage, device SQLite, or Realtime payloads.

Mobile local persistence is a cache/outbox only. It may hold encrypted session material and explicitly designed offline drafts/queues. Each queued mutation must carry an idempotency key, actor/device context, creation time, schema/version marker and sync state. Server acceptance and database commit determine the authoritative result.

## 3. Mandatory vertical-slice order for every business capability

Implement each feature/domain in this order. Do not finish an isolated web screen or mobile screen and leave its backend contract for a later phase.

1. **Domain and data design**
   - Define entities, ownership/tenant boundaries, lifecycle/state transitions, invariants and audit requirements.
   - Define canonical PostgreSQL schema, constraints, indexes and retention needs.
   - Define RLS, grants, storage policy and selective Realtime impact.
2. **Database first**
   - Add ordered SQL migration(s) under `supabase/migrations/`.
   - Apply to the explicitly bound SalesXAi project `eyofuiyxalbehbqoaeny`.
   - Record migration ID, commit SHA, target ref, apply result and schema impact.
   - Do not make untracked manual schema changes.
3. **Backend/domain services**
   - Implement Pydantic schemas, repository, domain service/use case, transaction boundaries, authorization and audit.
   - Business logic stays out of route handlers and clients.
4. **API and endpoint contract**
   - Expose versioned `/api/v1` endpoints.
   - Publish OpenAPI; update shared API contracts/types and typed client.
   - Include validation, stable errors, pagination, idempotency, concurrency and ownership checks as appropriate.
5. **Existing Web portal integration**
   - Connect the relevant existing portal screen/action to the typed API client.
   - Preserve existing UI, routes, layout, design tokens and responsive behavior.
   - Remove production mock/static fallback for the workflow being integrated; show explicit loading/empty/error/success/sync states.
6. **Native Expo integration**
   - Implement the corresponding feature in `apps/mobile-sales/` using the same API contract and shared types/client.
   - Implement native permissions, secure storage, offline behavior, retry/deduplication and platform-specific behavior where the feature requires them.
   - Do not duplicate business rules or access Supabase business tables directly from the mobile app.
7. **Cross-surface integration**
   - Connect web, mobile, FastAPI, database, storage, workers and authorized Realtime events for the complete lifecycle.
   - Verify consistent state and permission behavior across all applicable personas and clients using static/contract/schema safeguards; no staging, field testing or Product Owner gate is introduced by this flow.
8. **Operational completion**
   - Update phase tracker, API docs, migration register, event contracts, environment/deployment metadata and remaining gaps.
   - Record exactly what is implemented, migrated, connected and deployed; never infer one from another.

A phase may contain multiple vertical slices. Each slice must complete the relevant layers before it is called integrated.

## 4. Native Expo application standard

Canonical app root: `apps/mobile-sales/`.

Expected responsibilities:
- Authentication/session lifecycle through Supabase Auth identity and FastAPI JWT validation.
- Secure token/session persistence using an appropriate native secure-storage adapter; never embed service-role or privileged database secrets.
- Typed FastAPI client from shared contracts; consistent request IDs, error handling and token refresh behavior.
- Feature modules aligned to business domains: profile, shift/attendance, assigned outlets, visits, evidence, catalog, order, promotion, target/performance, notifications and settings.
- Offline-first only for explicitly supported field workflows. Local queue is a durable client outbox, not a second source of truth.
- Sync engine with idempotency, retry/backoff, deduplication, conflict handling, observable queue status and safe recovery after app restart.
- Expo Router/navigation, app configuration, Android/iOS permissions, EAS build profiles and platform-specific capabilities.
- GPS background task defined at module scope as required by Expo TaskManager. Explain permission before requesting it, bind tracking to an authorized shift/session, show tracking state, stop according to policy and document OS/device limitations.
- Native design consumes canonical generated tokens; do not create a separate mobile design-token source.

Native feature implementation is not postponed until GPS Phase 07. Mobile foundation and the relevant native workflow are implemented alongside their domain phase. Phase 07 adds the specialized location capture/ingestion/live-location/route capabilities.

## 5. Phase-to-surface implementation map

| Execution phase | Database + FastAPI/API | Web consumers | Native Expo consumers |
|---|---|---|---|
| 00 Repository/governance | workspace, migration workflow, API/service skeleton conventions | Preserve and map existing portals | Establish `apps/mobile-sales` workspace/app foundation |
| 01 Design system | No business API unless preferences require persistence | Existing UI token integration only where needed | Native token exports and native component foundation |
| 02 Identity/tenant | Auth verification, tenant context, profiles, roles, permissions, audit | Connect all portal sessions/guards | Native sign-in/session/tenant/permission foundation |
| 03 Master data | Company, branch, team, territory, outlet, sales assignment CRUD | Company, admin, supervisor and sales views | Assigned outlets, team/profile and territory context |
| 04 SmartTeam operations | Shift, attendance, visit, schedule, evidence, targets | Sales, company and supervisor workflows | Shift, attendance, visit plan/check-in/out, evidence, offline visit queue |
| 05 SmartOrder | Catalog, price, promotion, inventory, cart/order, fulfillment | Customer, sales, distributor and principal flows | Catalog, price/promotion view, order creation and order status |
| 06 SmartReward | Reward programs, incentive rules, ledger and redemption | Customer/company/principal reward views | Eligible reward/points view and redemption flows as authorized |
| 07 Location | GPS sessions/points, PostGIS, ingestion, geofence, route projections | Supervisor live map/history, sales tracking status | Expo Location/TaskManager, consent, shift-bound capture, offline GPS queue and sync |
| 08 Analytics | Deterministic aggregates, KPI/report APIs | Role-scoped dashboards/reports | Sales personal performance/summary views |
| 09 Workflow | Durable jobs, scheduler, notification, outbox/events | Workflow/notification surfaces | Notification inbox and actionable status; no client-owned job truth |
| 10 Remotion/content foundation | Content requests, templates, render jobs/status APIs | Content workflow screens | Authorized content brief/request/status surfaces if in mobile scope |
| 11 Unified AI (final AI phase) | One orchestrator, model router, tools, memory/RAG, usage/security | Existing AI entry points connected to governed APIs | Native assistant entry points using the same AI APIs |
| 12 Telegram (final Telegram phase) | Bot binding, webhook, proactive delivery and audit | Admin/integration controls | Link/notification settings where required |
| 13 Governance | Platform control plane, security, feature flags, audit | Super Admin governance | Only mobile policy/config surfaces required by role |

The table extends the phase plan to make native delivery explicit; it does not move AI or Telegram earlier than their designated final phases.

## 6. Required API and integration pattern

```text
Existing Web Portal ─┐
                     ├── Shared API Contracts + Typed API Client
React Native Expo ───┘                  │
                                        ▼
                              FastAPI /api/v1
                                        │
                           AuthN + Tenant + RBAC/ABAC
                                        │
                           Domain Services / Workflows
                                        │
                           Repositories / Transactions
                                        │
                                        ▼
                         Supabase PostgreSQL (truth)
                         Auth / Storage / PostGIS
                                        │
                         Outbox / durable job records
                                        │
                     Workers + authorized Realtime events
                                        │
                 Web and Mobile refresh authorized API state
```

Rules:
- Client -> FastAPI for all business reads/mutations unless a documented, narrowly scoped Supabase client capability is explicitly approved (e.g. Auth session establishment or authorized Storage upload/download flow).
- No client-side service-role key, direct privileged SQL, or duplicated domain logic.
- Realtime payloads are minimal notifications, not authoritative records; clients fetch current authorized state from FastAPI.
- Every API endpoint documents actor, tenant scope, permission, request/response schema, error behavior, idempotency and event side effects.
- Web and native clients consume the same contract version. Platform-specific UI may differ; business semantics may not.

## 7. Phase completion checklist

- [ ] Domain model and business invariants documented.
- [ ] Migration authored, applied to the exact SalesXAi Supabase project and recorded.
- [ ] RLS, grants, indexes, constraints, storage policy and Realtime impact addressed.
- [ ] FastAPI domain service and transaction behavior implemented.
- [ ] Versioned endpoints and OpenAPI/shared contracts updated.
- [ ] Existing Web portal action connected where applicable.
- [ ] Native Expo feature connected where applicable.
- [ ] Offline queue/idempotency/sync handled for applicable mobile workflows.
- [ ] Cross-surface authorization and state consistency addressed.
- [ ] Security, observability, error and operational behavior documented.
- [ ] Commit, migration, API contract, files and remaining gaps recorded.

If a surface does not consume a capability, record “not applicable” with a reason. Do not leave the mobile column silently omitted.

## 8. Explicit implementation prohibitions

- No Agentzy repository, project or credentials. SalesXAi targets only the repository and Supabase ref declared above.
- No separate mobile backend, mobile database or duplicated business API.
- No direct web/mobile mutation of business tables to bypass FastAPI.
- No mock/demo business fallback in production flows.
- No redesign of existing Web UI as a prerequisite for backend integration.
- No staging environment, staging deployment, field-test requirement or Product Owner Acceptance gate.
- No AI or Telegram expansion before their designated final phases.
- No completion claim without implementation and migration evidence.
