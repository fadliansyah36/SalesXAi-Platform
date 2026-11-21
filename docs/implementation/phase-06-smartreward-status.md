# PHASE 06 — SMARTREWARD COMPLETION STATUS

**Status: IN_PROGRESS — NOT COMPLETED.** Existing reward lifecycle features are retained; this continuation closes validation/security gaps without reimplementing completed workflows.

## Implemented SmartReward scope

- Reward Programs, Customer Segments and memberships, Incentive Rules and eligibility evaluation.
- Points Ledger with immutable entries, account-level transaction locking, idempotency, balance projection and reconciliation.
- Earning, redemption reservation/decision/cancellation/fulfillment, approval history, expiration issuance, reversal and adjustment.
- Participant balances, catalog, tenant/period/branch/platform reporting and audit.
- Typed FastAPI contracts/client and Web/Native/role portal integrations remain in place.

## Applied migration ledger — 19/19 Phase 06 migrations

| Version | Migration |
|---|---|
| 20261121012020 | p06_reward_core |
| 20261121012025 | p06_reward_ledger_compensation_signs |
| 20261121012115 | p06_reward_fk_indexes |
| 20261121013104 | p06_reward_expiration_approval_lots |
| 20261121013452 | p06_reward_approval_self_read |
| 20261121013538 | p06_reward_private_outbox_stream |
| 20261121013653 | p06_reward_approval_history_and_participant_rules |
| 20261121013846 | p06_reward_participant_rule_read |
| 20261121014304 | p06_reward_lifecycle_fk_indexes |
| 20261121014859 | p06_reward_realtime_ownership_scope |
| 20261121020010 | p06_reward_platform_overview_permission |
| 20261121024447 | p06_reward_private_realtime_all_lifecycle_events |
| 20261121025010 | p06_reward_expiration_reconcile_ledger_first |
| 20261121025805 | p06_reward_outbox_owner_scope |
| 20261121030129 | p06_reward_reporting_expiry_indexes |
| 20261121030235 | p06_reward_outbox_retention |
| 20261121054216 | p06_reward_customer_segments |
| 20261121093654 | p06_reward_realtime_payload_scope |
| 20261121101601 | p06_reward_broadcast_disable_unsafe_tenant_topic |

## Verified evidence

- `supabase/tests/phase06_smartreward_ledger.sql` ran in a rollback-only transaction. Earn, redemption, expiration, reversal linkage and adjustment entries reconciled to a ledger sum of **850**. Duplicate idempotency and cross-tenant account-reference rejection passed. Fixture rows were rolled back.
- Existing service paths retain account locking and idempotency constraints.
- **Parallel redemption — PASS:** CI run `44899182981`, job `phase06-isolated-db-integration`, executed two independent PostgreSQL connections concurrently. `test_same_idempotency_key_has_one_atomic_redemption` and `test_distinct_concurrent_keys_cannot_overdraw_balance` both passed. The same key produced one atomic redemption; distinct keys serialized against the locked account balance without overdraw. Fixtures ran only in a disposable local Supabase stack, which was stopped after the run.
- **Authenticated cross-tenant — PASS:** the same isolated CI job passed membership, read endpoint, write endpoint, resource read and redemption mutation denial tests (5/5). Synthetic Auth users/sessions/devices and short-lived fixture JWTs exercised the actual JWT verifier, registered-session/device lookup, tenant permission dependency and route handlers. No real account login/register or production user data was used. The tests do not claim a full browser/production JWKS HTTP round-trip.
- **Ledger — PASS:** the rollback-only SQL fixture reconciled earn, redemption, expiration, reversal linkage and adjustment to a net ledger sum of **850**; duplicate idempotency and cross-tenant account-reference rejection passed. Fixture rows were rolled back.
- **Private event filtering — code/test PASS, owner policy PENDING:** SSE audience construction now derives participant, branch and tenant resource lists from exact read permissions, keeps branch-to-resource mappings separate, and prevents a branch/catalog permission from widening to tenant events. API unit/contract suite passed 164 tests at source `1cf969802c4043d0390ad203144e7c40c6293cab`. This does not substitute for authenticated Supabase Broadcast subscription authorization.
- Applied migration `20261121101601` suppresses the legacy tenant-wide Broadcast topic while the existing `realtime.messages` policy is too broad. Web and Native use the permission-checked FastAPI SSE fallback; Native direct Supabase Broadcast remains disabled by default.

## Private Realtime owner gate

- Live `realtime.messages` owner: `supabase_realtime_admin`.
- Current live `smartreward_private_read` policy is not sufficient for participant/branch subscriptions and previously permitted branch scope on the tenant-wide topic.
- Correct resource-permission-scoped replacement is prepared at `supabase/owner-pending/20261121101500_smartreward_realtime_role_scope_policy.sql`; it is **not applied**.
- Tenant-wide Broadcast reactivation is separately prepared at `supabase/owner-pending/20261121104500_smartreward_enable_tenant_broadcast_after_policy.sql`. It must only run after owner policy application and authenticated allow/deny tests.
- No ownership change, privilege escalation, or policy bypass was attempted.

## Remaining Definition-of-Done gates

1. Obtain project-owner authorization to apply `supabase/owner-pending/20261121101500_smartreward_realtime_role_scope_policy.sql` through the official owner-level path.
2. Validate authenticated participant, branch and tenant private subscription allow cases plus cross-tenant, cross-branch and wrong-role denials against the live owner-applied policy.
3. Only after those checks pass, apply the separate tenant Broadcast reactivation SQL and enable direct Native/Web private Broadcast subscriptions.

**Phase 06 remains IN_PROGRESS.** The rollback-only ledger fixture and code-level guards do not substitute for the three remaining runtime gates.


## Latest execution checkpoint — 2026-11-21

- GitHub API workflow 44899483509 on source 27dc32b5984fac315a4027aecfe3ca3f8e3217d6 completed successfully.
- Isolated Phase 06 database integration job passed **7/7**: two independent-connection concurrent redemption cases (same-key idempotency and distinct-key no-overdraw) plus five authenticated tenant-isolation cases covering membership, read, write, resource read and redemption mutation.
- The same workflow's API static job passed **164 tests**, Python compileall and Ruff. The Expo mobile-sales-build job passed.
- The live realtime.messages policy is still not the prepared participant/branch/resource-scoped policy. Direct SmartReward private Broadcast remains disabled; permission-checked FastAPI SSE remains the active fallback.
- Owner-pending policy SQL remains unapplied because the live table owner is supabase_realtime_admin and the connected SQL principal cannot assume that role.

**Current status remains IN_PROGRESS:** concurrency, ledger and authenticated cross-tenant validation pass; authenticated private Supabase Realtime allow/deny validation remains an external owner-level gate.


## Latest live gate recheck — 2026-11-21

- The live Realtime messages table remains owned by supabase_realtime_admin; connected SQL principal is postgres and pg_has_role(current_user,'supabase_realtime_admin','MEMBER') is false.
- No owner-level SmartReward policy application or authenticated private-channel allow/deny result has been recorded. Existing tenant-wide Broadcast remains disabled by migration 20261121101601; permission-checked FastAPI SSE remains the supported fallback.
- Phase 06 remains IN_PROGRESS. Do not mark complete until the owner applies the prepared resource-scoped policy and synthetic authenticated participant/branch/tenant allow/deny subscriptions pass.
