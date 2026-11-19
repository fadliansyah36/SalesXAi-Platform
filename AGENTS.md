# SalesX-Ai — Repository Agent & Engineering Instructions

## 1. Mission and authoritative documents

Build SalesX-Ai as one integrated sales, distribution, field-operations, location-intelligence and content platform.

Canonical documents:
- `Docs/SalesX-Ai_Master_PRD_v1.0.md` — product scope and target architecture.
- `Docs/SalesX-Ai_Engineering_Execution_Master_Plan_v1.0.md` — phase backlog and execution governance.
- `Docs/SalesX-Ai_Cross-Platform_Implementation_Flow_v1.0.md` — mandatory vertical-slice flow connecting backend, database, APIs, Web and native Expo.
- Canonical design tokens and design-system specifications in the repository.

Master PRD remains the product baseline. The Cross-Platform Implementation Flow operationalizes the PRD; it does not replace or silently alter product scope.

## 2. Exact project binding — never substitute

- GitHub repository: `fadliansyah36/SalesXAi-Platform`
- Branch: `main`
- Supabase project: `SalesXAi Db`
- Supabase project ref: `eyofuiyxalbehbqoaeny`
- Supabase URL: `https://eyofuiyxalbehbqoaeny.supabase.co`

This is SalesXAi, not Agentzy. Never use `Agentzy-platform`, Supabase ref `cwhjdnkotuhueeudpgeu`, or any Agentzy credentials/project. Before a write or migration, verify repository owner/name/branch or Supabase project ref from the tool result; do not rely on connector display labels alone.

## 3. Product surfaces and architecture

SalesXAi is a single GitHub monorepo with independently deployable applications/services and one shared business data platform:

- Existing Next.js Web portals and routes remain the presentation layer.
- Native Sales application: `apps/mobile-sales/`, React Native + Expo, Android/iOS.
- Backend: `services/api/`, Python FastAPI.
- Data: the single bound Supabase PostgreSQL project.
- Shared contracts/client/types: packages consumed by Web and Expo.
- Workers execute durable background work; Remotion renderer remains a separate Node service.
- Supabase Auth provides identity; FastAPI verifies JWT and resolves tenant context.
- Supabase Storage, Realtime, PostGIS and pgvector are used according to domain requirements and phase order.

The repository already contains substantial Next.js UI. Preserve existing routes, screens, components, hierarchy, design tokens, styling and responsive behavior. Do not redesign or visually refactor the Web product as a backend prerequisite. Make only scoped changes required to connect existing actions to APIs or add missing integration states.

## 4. Single source of truth and ownership

- Supabase PostgreSQL is the canonical durable business-data source.
- FastAPI owns business rules, authorization and business-critical mutations.
- FastAPI OpenAPI and versioned shared contracts define the API surface.
- Web and Expo consume the same typed API contracts/client and business semantics.
- Supabase Realtime is a delivery/notification mechanism; committed database state remains authoritative.
- Mobile local storage/SQLite is cache and explicitly designed offline outbox only, never a second business database.
- Do not duplicate authoritative price, stock, order, promotion, reward or financial calculations in clients or LLMs.
- Do not create a separate mobile backend or a database per portal.

Client access to Supabase is limited to documented, narrowly scoped capabilities such as Auth session establishment or authorized Storage flows. Business reads/mutations must go through FastAPI unless an explicit architecture decision documents otherwise.

## 5. Mandatory vertical-slice implementation order

For every business capability and phase, implement and connect the complete applicable slice in this order:

1. Domain model, tenant ownership, business invariants, lifecycle and audit requirements.
2. Supabase schema, constraints, indexes, grants, RLS, Storage policy and selective Realtime design.
3. Versioned SQL migration under `supabase/migrations/`; apply to project ref `eyofuiyxalbehbqoaeny` and record evidence.
4. FastAPI Pydantic schemas, repositories, domain/application services, transactions, authorization and audit.
5. Versioned `/api/v1` endpoints, OpenAPI, shared contracts/types and typed API client.
6. Integrate the relevant existing Web portal screen/action without redesigning the UI.
7. Integrate the corresponding native Expo feature using the same API contracts, permission model and business semantics.
8. Connect workers, storage, outbox and authorized Realtime events for the full lifecycle.
9. Record implementation, migration, contract, security, integration evidence and remaining gaps.

Do not call a feature fully integrated when only its database, API, Web screen or mobile screen exists. Complete all applicable surfaces for the slice. If a surface does not consume a feature, record “not applicable” and why.

## 6. Native React Native Expo requirements

`apps/mobile-sales/` is a first-class product application, not an optional future add-on. Implement its foundation and feature slices alongside the relevant domain phases, not as a detached final project.

Required engineering responsibilities:
- Expo app configuration, navigation/router, Android/iOS identifiers, environments and EAS build profiles.
- Authentication/session lifecycle with secure native token storage; no privileged database secrets in the app.
- Shared typed FastAPI API client, request/error handling and compatible API contracts.
- Feature modules for profile, shifts/attendance, assigned outlets, visit planning/check-in/check-out, evidence, catalog, orders, promotions, targets/performance, notifications and settings according to phase scope.
- Offline support only for defined field workflows, with local outbox, idempotency keys, retry/backoff, deduplication, conflict handling, sync state and restart recovery.
- Native UI consumes generated canonical design tokens; no separate token source.
- Platform-specific permission, background execution, storage and notification configuration.

GPS rules:
- Expo Location and Expo TaskManager are the first-party mobile GPS capture path.
- Background task must be defined at module scope as required by Expo TaskManager.
- Explain location purpose before requesting permissions.
- Bind tracking to authorized user/shift/session and applicable work policy.
- Provide visible tracking/sync state and stop tracking according to policy.
- Document Android/iOS and device/OS limitations; never promise uninterrupted tracking.
- Phase 07 implements specialized GPS ingestion, PostGIS, geofence, live map and route history; earlier phases still implement mobile foundations and their own native workflows.

## 7. Backend/API engineering rules

1. Use versioned REST endpoints under `/api/v1`; publish OpenAPI.
2. Validate requests with Pydantic and define explicit response schemas/stable error envelopes.
3. Enforce authentication, tenant isolation, permission and resource ownership server-side.
4. Resolve actor and tenant from verified identity; never trust client-supplied tenant IDs.
5. Use transactions, idempotency, pagination, filtering, sorting and concurrency controls where relevant.
6. Keep deterministic business logic in domain services, not route handlers or clients.
7. Separate routers, services, repositories and domain rules.
8. Audit security-sensitive and business-critical operations.
9. Use structured logs, correlation IDs, safe errors, rate limits and bounded timeouts.
10. No fake/mock production fallbacks; return explicit actionable errors.
11. Generate/update shared typed clients from canonical contracts.
12. Document compatibility and migration order for breaking changes.

Suggested layout (adapt to actual repository conventions without moving existing UI):
- `services/api/` — FastAPI app, routers, dependencies and middleware.
- `services/api/domain/` — entities, value objects and business rules.
- `services/api/repositories/` — persistence.
- `services/api/schemas/` — Pydantic contracts.
- `services/api/services/` — application services/use cases.
- `services/api/workflows/` — workflow/state machines.
- `services/workers/` — durable workers.
- `packages/api-contracts/`, `packages/api-client/`, `packages/shared-types/` — shared contracts and clients.
- `supabase/migrations/` — ordered SQL migrations.

## 8. Supabase, schema and Realtime discipline

- Target only project ref `eyofuiyxalbehbqoaeny`.
- Every phase that changes schema, policy, function, trigger, index, publication or event contract must include a versioned migration and apply it to the target project.
- Migration names use ordered UTC timestamp plus snake_case purpose.
- Migrations must be deterministic, reviewable and safe for existing data; never make untracked dashboard-only schema changes.
- Every tenant-owned table requires ownership strategy, indexes, grants and deny-by-default RLS.
- Service-role credentials are server-only; never expose them to Web, Expo, logs or source.
- Realtime must be selective, private, authorized and tenant-scoped. Do not broadcast every table or sensitive raw rows.
- Use Broadcast for high-frequency/sensitive events where appropriate; use Postgres Changes only for suitable low-volume updates.
- Persist migration name, applied timestamp, target ref, commit SHA and schema impact.
- Never claim migration applied unless Supabase confirms success and migration history reflects it.
- If a phase has no schema delta, document the no-op decision; do not invent empty migrations.

## 9. Security baseline

Implement defense in depth:
- Verify Supabase Auth JWT signature, issuer, audience and expiry.
- Tenant-scoped RBAC/ABAC; deny by default.
- RLS, least-privilege grants and private Realtime authorization.
- Strict CORS, CSRF strategy where cookie auth is used, secure headers and TLS.
- Rate limits, abuse controls, request-size limits and upload MIME/size validation.
- Parameterized SQL, secret manager/environment injection and no committed secrets.
- Audit privilege, tenant, finance, order, reward and security changes.
- Webhook signature verification, replay protection and idempotent processing.
- SSRF protection and outbound integration allowlists.
- Signed URL expiry, PII minimization, retention/deletion and access logging.

## 10. Realtime and durable workflow principles

- Persist workflow/run state, attempts, scheduling, checkpoints and terminal errors.
- Support retry/backoff, timeout, cancellation, idempotency and dead-letter handling where relevant.
- Use an outbox/event dispatcher when transactional delivery consistency requires it.
- Do not publish before the database transaction commits.
- Realtime payloads contain minimal identifiers/state; clients fetch current authorized details from FastAPI.

## 11. Phase sequence and platform participation

Follow the phase order in the Engineering Execution Master Plan. Native Expo participates in applicable domain phases; it is not deferred wholesale to one mobile-only phase.

- Phase 00 — Repository Bootstrap & Engineering Governance.
- Phase 01 — Canonical Design System & Design Tokens.
- Phase 02 — Identity, Tenant & Authorization Foundation.
- Phase 03 — Master Data, Organization, Branch, Territory, Team & Outlet.
- Phase 04 — SmartTeam: Sales Operations, Attendance, Visits & Targets.
- Phase 05 — SmartOrder: Catalog, Pricing, Inventory, Cart & Orders.
- Phase 06 — SmartReward: Loyalty, Incentives, Points & Redemption.
- Phase 07 — Location Intelligence, GPS Ingestion, Geofence & Route History.
- Phase 08 — Analytics, KPI Aggregation & Operational Reporting.
- Phase 09 — Workflow Engine, Scheduling, Notifications & Durable Jobs.
- Phase 10 — Remotion Renderer & Content Workflow Foundation (non-AI/template-first).
- Phase 11 — Unified AI Platform, Model Router, Agents, Memory, RAG & Sales Intelligence (FINAL AI PHASE).
- Phase 12 — Telegram Integration, Bot Workflows & Proactive Notifications (FINAL TELEGRAM PHASE).
- Phase 13 — Super Admin Governance, Security Operations & Platform Controls.

Cross-surface phase mapping:
- Identity: Web and Expo authentication/tenant context.
- Master data: company/admin portals and native assigned outlet/team context.
- SmartTeam: Web sales/supervisor/company flows and native shift/attendance/visits/evidence.
- SmartOrder: customer/distributor/principal/sales portals and native catalog/order flows.
- SmartReward: applicable portal reward flows and native eligible reward views/actions.
- Location: Expo capture/queue -> FastAPI ingestion -> Supabase/PostGIS -> authorized supervisor Web map/history.
- Analytics/workflow: role-specific Web dashboards and native summaries/notifications.
- AI and Telegram remain in their designated final phases.

## 12. AI and Telegram sequencing

AI capabilities are reserved for Phase 11; Telegram integration is reserved for Phase 12.
- Do not expand existing Gemini/AI routes into new SalesX-Ai capabilities before Phase 11.
- Preserve existing UI assets and code while deferring new AI business workflows.
- Phase 11 introduces one unified AI orchestration layer, model router, provider adapters, tool gateway, memory/RAG governance, usage metering and AI security.
- Phase 12 introduces Telegram webhook, tenant binding, notification/workflow delivery, opt-in/consent, command authorization and audit.
- Do not build duplicate orchestrators, model routers or memory coordinators.

## 13. Execution constraints

- Work directly on `main` unless user explicitly changes the instruction.
- No staging environment or staging deployment.
- No real-world/field testing requirement.
- No Product Owner Acceptance gate or UAT under another name.
- No license-check/review gate.
- Static engineering safeguards (lint, type/build, schema/contract validation, migration review, security configuration review and static analysis) are allowed; they are not field-testing, staging or PO gates.
- Do not deploy or claim runtime behavior without actual deployment action and evidence.
- Distinguish implemented, migrated, connected and deployed.
- Do not mark a phase complete while its code, migration, RLS, API contracts, Realtime or applicable Web/Expo integration remains incomplete.

## 14. Phase completion record

Update `Docs/phase-tracker.md` or the relevant phase document with:
- Phase ID/scope and domain vertical slices.
- Backend/API modules and endpoints.
- Web portal actions connected.
- Native Expo features connected.
- Shared contract/client versions.
- Files and commit SHA.
- Supabase migration name, target project ref and applied status.
- RLS/grants/indexes/functions/triggers/storage changes.
- Realtime channel/event policy.
- Offline queue/idempotency/sync behavior where applicable.
- Security/observability controls.
- Deployment evidence (only if actually deployed).
- Remaining gaps and next phase dependencies.

These instructions apply to all agents and contributors. SalesXAi is one ecosystem: one monorepo, one bound Supabase source of truth, one FastAPI business layer, shared API contracts, existing Web portals and native React Native Expo clients.


## 15. Canonical JavaScript workspace and Native app foundation

- Bun is the sole JavaScript package manager. Keep one root \`bun.lock\`; do not add pnpm, npm or Yarn lockfiles.
- Root Bun workspaces include \`apps/*\` and \`packages/*\`. Internal packages use \`workspace:*\`.
- Turborepo is the task orchestrator; it does not replace Bun.
- Node.js 22.13+ is required by the canonical Expo SDK 58 mobile workspace.
- Run \`bun install --frozen-lockfile\` from repository root. Run token generation/check through \`bun run tokens:build\` and \`bun run tokens:check\`.
- The Native Sales app is runnable from \`apps/mobile-sales/\`; it consumes generated tokens and shared Native design-system exports. Do not introduce a second token source.
- Exclude \`apps/mobile-sales/\` from the root Next.js TypeScript project; the Expo app has its own \`expo/tsconfig.base\` configuration and typecheck script.
- Root CI validates Bun install/lockfile, token generation, Web checks and Expo config/dependency resolution, Metro startup and Android/iOS JS bundle exports.
