# SalesX-Ai — Repository Agent & Engineering Instructions

## 1. Mission and authoritative documents
Build SalesX-Ai as a sales, distribution, field-operations, location-intelligence and content platform.

Canonical product and execution baselines:
- `Docs/SalesX-Ai_Master_PRD_v1.0.md`
- `Docs/SalesX-Ai_Engineering_Execution_Master_Plan_v1.0.md`

The copies under `public/assets/aistudio/` are existing repository assets. The `Docs/` copies are the engineering source-of-truth documents. Keep both copies content-equivalent when either is intentionally revised.

## 2. Current implementation boundary — critical
The repository already contains the Next.js frontend, portal routes, portal components, shared UI, PWA assets and design tokens. Treat this frontend as an existing product UI to integrate, not a blank project.

Primary mission is backend and integration engineering:
- Python FastAPI application and versioned API.
- Supabase PostgreSQL schema, migrations, RLS, functions, triggers, indexes and Realtime.
- Domain models, repositories, services, CRUD and business rules.
- Workflow/state machines, background jobs, event handling and orchestration.
- Identity, tenant resolution, role/permission enforcement and audit trail.
- API contracts, generated/shared types and frontend API client integration.
- Strong application, database, infrastructure and integration security.

Do not redesign, replace, restructure or visually refactor existing frontend screens as part of backend phases. Preserve routes, component hierarchy, visual styling, design tokens and responsive behavior. Change frontend only where required to connect an existing screen/action to the new API, expose a missing integration state, or correct a demonstrable API contract mismatch. Prefer small, scoped integration changes.

## 3. Repository architecture
- Existing Next.js UI remains the presentation layer.
- FastAPI is the authoritative business API and business-logic boundary.
- Supabase PostgreSQL is the primary source of truth.
- Supabase Auth provides identity; FastAPI validates JWTs and resolves tenant context.
- Supabase Storage stores governed files/media.
- Supabase Realtime is used selectively for authorized, tenant-scoped events.
- PostGIS supports spatial data; pgvector is reserved for the AI phase.
- Background workers handle durable/long-running jobs; do not run heavy work in request handlers.
- Keep shared API contracts and typed clients versioned in the monorepo.
- Keep services modular by domain; do not create a microservice per table or CRUD endpoint.

Suggested backend layout (adapt to repository conventions without moving existing UI):
- `services/api/` — FastAPI app, routers, dependencies, middleware.
- `services/api/domain/` — entities, value objects and business rules.
- `services/api/repositories/` — database persistence.
- `services/api/schemas/` — Pydantic request/response contracts.
- `services/api/services/` — application services and use cases.
- `services/api/workflows/` — workflow/state-machine definitions.
- `services/workers/` — durable background workers.
- `packages/api-contracts/` — shared API/event contracts and generated types.
- `supabase/migrations/` — ordered SQL migrations.
- `supabase/seed/` — deterministic development/reference data only when explicitly needed.

Do not create a second production database or bypass FastAPI for business-critical frontend mutations.

## 4. Existing portals — preserve UI
- `/` — Public Website
- `/portal` — Sales Portal
- `/company` — Company Portal
- `/customer` — Customer Portal
- `/distributor` — Distributor Portal
- `/principal` — Principal Portal
- `/supervisor` — Supervisor Portal
- `/super-admin` — Super Admin Portal

Existing portal components and data modules are integration targets. Replace mock/static business data only through deliberate API integration, not through UI redesign.

## 5. Backend/API engineering rules
1. Use versioned REST endpoints under `/api/v1`; publish OpenAPI from FastAPI.
2. Validate all input with Pydantic; use explicit response schemas and stable error envelopes.
3. Enforce authentication, tenant isolation, permission checks and resource ownership server-side on every protected operation.
4. Treat tenant_id and actor identity as trusted only after server-side resolution; never trust tenant identifiers supplied by a client without authorization.
5. Use transaction boundaries, idempotency keys for retryable mutations, pagination, filtering, sorting and concurrency controls where relevant.
6. Keep business calculations deterministic in domain services; LLM output must never become source-of-truth for stock, price, orders, incentives or financial totals.
7. Separate routers, services, repositories and domain rules. Avoid SQL/business logic inside route handlers.
8. Record security-sensitive and business-critical actions in an append-only audit trail.
9. Use structured logs, correlation/request IDs, safe error handling, rate limits and bounded timeouts.
10. Do not add fake/mock production fallbacks. If a dependency is unavailable, return an explicit actionable error.
11. Generate or update typed frontend API clients from the canonical OpenAPI/contracts; avoid duplicated handwritten schemas.
12. Keep API compatibility explicit; document breaking changes and migration order.

## 6. Supabase, schema and migration discipline
- Target Supabase project ref: `eyofuiyxalbehbqoaeny` (`SalesXAi Db`).
- Every phase that changes data, schema, policy, function, trigger, index, publication or event contract MUST include a versioned migration under `supabase/migrations/` and apply it to this target project as part of that phase.
- Migration filenames use ordered UTC timestamp plus snake_case purpose.
- Migrations must be deterministic, reviewable, idempotent where practical and safe for existing data.
- Never drop/rename production objects without a compatibility migration and explicit data-preservation path.
- Every tenant-owned table must have tenant ownership strategy, indexes, grants and RLS policies. Deny by default.
- Keep service-role credentials server-side only. Never expose them to browser bundles, mobile apps, logs or repository files.
- Use least-privilege database roles and explicit grants. Do not assume RLS replaces API authorization; enforce both layers.
- Realtime is part of the phase migration: configure only the required publication/channel/event behavior, private-channel authorization, tenant/role filtering and retention/replay strategy. Do not broadcast every table or expose raw sensitive rows.
- Use Broadcast for high-frequency/sensitive domain events where appropriate; use Postgres Changes only for suitable low-volume data updates.
- Persist migration name, applied timestamp, target project ref, commit SHA and schema impact in phase documentation.
- Never claim a migration is applied unless the Supabase operation succeeded and the migration is visible in migration history.

Initial Supabase inspection for this execution found project `eyofuiyxalbehbqoaeny` active/healthy, PostgreSQL 17, with no recorded migrations and no tables in `public`. Treat this as the initial observed state only; refresh live schema before designing each migration.

## 7. Security baseline
Implement defense in depth:
- Supabase Auth JWT signature/issuer/audience/expiry validation.
- Tenant-scoped authorization and permission matrix; deny by default.
- RLS on tenant-owned tables; private Realtime channels.
- Strict CORS allowlist, CSRF strategy where cookie auth is used, secure headers and TLS.
- Rate limiting, abuse controls, request-size limits and upload MIME/size validation.
- Parameterized SQL/ORM queries; no dynamic SQL from untrusted input.
- Secret manager/environment injection; no secrets committed.
- Encryption in transit and provider-managed encryption at rest.
- Audit events for privilege, tenant, finance, order, reward and security changes.
- Webhook signature verification, replay protection and idempotent event processing.
- SSRF protections for outbound URL fetches; allowlists for integrations.
- Safe file storage paths, signed URL expiry and authorization before download.
- PII minimization, retention/deletion rules and access logging.
- Dependency and runtime updates are normal engineering maintenance; license review is not an implementation gate for this plan.

## 8. Realtime and workflow principles
- Use durable workflow state and explicit transitions; never rely on browser memory for job truth.
- Persist workflow/run status, attempts, scheduling metadata, checkpoints and terminal errors.
- Support retry with backoff, timeout, cancellation, idempotency and dead-letter handling where relevant.
- Publish domain events through a controlled outbox/event dispatcher when delivery consistency requires it.
- Realtime events are notifications of authorized state changes; database remains source of truth.
- Use tenant-aware channel naming and server-authorized subscriptions.

## 9. AI and Telegram sequencing
AI capabilities are reserved for Phase 11. Telegram integration is reserved for Phase 12.
- Do not expand existing Gemini/AI routes into new SalesX-Ai capabilities before Phase 11.
- Preserve existing UI assets and code while deferring new AI business workflows until the designated phase.
- Phase 11 introduces one unified AI orchestration layer, model router, provider adapters, tool gateway, memory/RAG governance, usage metering and AI security controls.
- Phase 12 introduces Telegram bot/webhook integration, tenant binding, notification/workflow delivery, opt-in/consent, command authorization and audit.
- Do not build duplicate model routers, orchestrators or memory coordinators in multiple modules.

## 10. Phase sequence — mandatory order
- Phase 00 — Repository Bootstrap & Engineering Governance
- Phase 01 — Backend Foundation, FastAPI Core & Supabase Connectivity
- Phase 02 — Identity, Authentication, Tenant & Authorization
- Phase 03 — Master Data, Organization, Branch, Territory, Team & Outlet
- Phase 04 — SmartTeam: Sales Operations, Attendance, Visits & Targets
- Phase 05 — SmartOrder: Catalog, Pricing, Inventory, Cart & Orders
- Phase 06 — SmartReward: Loyalty, Incentives, Points & Redemption
- Phase 07 — Location Intelligence, GPS Ingestion, Geofence & Route History
- Phase 08 — Analytics, KPI Aggregation & Operational Reporting
- Phase 09 — Workflow Engine, Scheduling, Notifications & Durable Jobs
- Phase 10 — Remotion Renderer & Content Workflow Foundation (non-AI/template-first)
- Phase 11 — Unified AI Platform, Model Router, Agents, Memory, RAG & Sales Intelligence (FINAL AI PHASE)
- Phase 12 — Telegram Integration, Bot Workflows & Proactive Notifications (FINAL TELEGRAM PHASE)
- Phase 13 — Super Admin Governance, Security Operations & Platform Controls

Every phase must ship its relevant Supabase migration and Realtime configuration/application before the phase is considered implemented. If a phase has no schema delta, document the explicit no-op migration decision and still reconcile the live schema/migration state; do not invent empty migrations.

## 11. Execution constraints
- Work directly on the repository's `main` branch unless the user explicitly changes this instruction.
- No staging environment or staging deployment.
- No real-world/field testing requirement.
- No Product Owner Acceptance gate.
- No license-check/review gate.
- Do not create a Product Owner sign-off or UAT stage under another name.
- Static engineering controls (lint, type checks, build, schema/contract validation, migration review, security configuration review and static analysis) may be used as engineering safeguards; they are not field-testing, staging or Product Owner gates.
- Do not deploy or claim runtime behavior without an actual deployment action and evidence.
- Keep phase progress factual: distinguish implemented, migrated, connected, deployed and deferred.
- Do not mark a phase complete while its code, migrations, RLS, API contracts, Realtime behavior or frontend integration tasks remain incomplete.

## 12. Completion record for each phase
Record in `Docs/phase-tracker.md` or the relevant phase document:
- Phase ID and scope.
- Backend/API modules and portal actions integrated.
- Files/commits changed.
- Supabase migration name and applied status.
- RLS/grants/indexes/functions/triggers changed.
- Realtime publication/channel/event policy.
- Security controls implemented.
- Remaining gaps and next phase dependencies.

These instructions apply to all agents and contributors. Preserve the existing frontend experience and focus implementation effort on backend, data, APIs, workflows, orchestration and security.
