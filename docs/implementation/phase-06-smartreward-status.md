# Phase 06 — SmartReward & Incentive Status

Date: 2026-11-21
Repository: fadliansyah36/SalesXAi-Platform
Branch: main
Supabase: eyofuiyxalbehbqoaeny

## Status

**IN_PROGRESS — NOT COMPLETED.** See the authoritative Phase 06 addendum in `docs/implementation/phase-status.md` for current evidence and blockers.

## Current implementation

- Reward program CRUD and period/status/audience/configuration fields.
- Incentive rule CRUD and deterministic fixed-points / points-per-unit calculation for completed order, completed visit, and visit-target achievement sources.
- Immutable points ledger with append-only trigger, row-locked reward account, idempotency key, before/after balances, source/reference/actor/reason metadata, and balance reconciliation against ledger sum.
- Reward catalog CRUD, stock reservation, redemption request, decision, cancellation, fulfillment, history, compensating ledger entries, and adjustment/reversal.
- FastAPI routes, Pydantic request schemas, shared TypeScript contracts, typed API client factory, Python and TypeScript action matrices.
- Supabase RLS deny-client policies, scoped role permissions, audit events, private Realtime broadcast trigger/policy.

## Migration register

| Version | Migration |
|---|---|
| 20261121012020 | p06_reward_core |
| 20261121012025 | p06_reward_ledger_compensation_signs |
| 20261121012115 | p06_reward_fk_indexes |

## Evidence

- Railway API deployment on `c9e5bd3910212ca9ddcf133c293576038cbe6dad`: SUCCESS; startup complete; `/readyz` HTTP 200.
- Supabase Security Advisor: 0 lints.
- Supabase Performance Advisor: no unindexed-FK warning after index migration; unused-index notices remain informational.

## Outstanding Definition of Done

- Integrate all existing Web portals and Expo; no UI integration is claimed yet.
- Implement manager redemption inbox and branch/team-scoped reporting.
- Complete rule engine for activities, transactions, targets/KPIs, role and organization audience, period and limits.
- Implement approved manual earning workflow, approval policy lifecycle and expiry scheduler/ledger issuance.
- Add Realtime client subscriptions and portal refresh behavior.
- Complete Super Admin governance and principal cross-organization scope.
- Run focused API, ledger concurrency/idempotency, typecheck, lint and complete portal/Expo build validation on the final commit.

Phase 07 remains LOCKED until all Phase 06 blockers are closed.
