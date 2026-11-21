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
- Two-connection concurrency harness: `services/api/tests/test_smart_reward_concurrency_integration.py`. It is intentionally restricted to a disposable local Supabase DB (`SALESX_TEST_DATABASE_URL`) and has **not** run in this environment. The CI skip is not concurrency evidence.
- Authenticated tenant-isolation harness: `services/api/tests/test_smart_reward_tenant_isolation_integration.py`. It creates disposable Auth/profile/session/device/membership/role fixtures and exercises the principal/session resolver, tenant permission resolver and route guards. It is restricted to a disposable local database and has **not** run here. Its deterministic fixture JWT verifier does not prove production JWT signature validation or an HTTP round-trip.
- SmartReward SSE audience logic now separates tenant, branch and participant scopes and filters events by resource permission. Branch-scoped catalog permissions cannot widen to tenant-wide catalog events.
- Applied migration `20261121101601` suppresses the legacy tenant-wide Broadcast topic while the existing `realtime.messages` policy is too broad. Web and Native use the permission-checked FastAPI SSE fallback; Native direct Supabase Broadcast remains disabled by default.

## Private Realtime owner gate

- Live `realtime.messages` owner: `supabase_realtime_admin`.
- Current live `smartreward_private_read` policy is not sufficient for participant/branch subscriptions and previously permitted branch scope on the tenant-wide topic.
- Correct resource-permission-scoped replacement is prepared at `supabase/owner-pending/20261121101500_smartreward_realtime_role_scope_policy.sql`; it is **not applied**.
- Tenant-wide Broadcast reactivation is separately prepared at `supabase/owner-pending/20261121104500_smartreward_enable_tenant_broadcast_after_policy.sql`. It must only run after owner policy application and authenticated allow/deny tests.
- No ownership change, privilege escalation, or policy bypass was attempted.

## Remaining Definition-of-Done gates

1. Run concurrent redemption with two independent connections against a disposable local Supabase DB; verify same-key idempotency, distinct-key balance serialization, atomic ledger/balance state and rollback cleanup.
2. Run the isolated authenticated tenant tests using the complete supported auth/session path and HTTP route requests; verify read, write, resource and mutation denial across tenants.
3. Obtain project-owner authorization, apply the owner Realtime policy, then validate participant/branch/tenant allow cases and cross-tenant/cross-branch/wrong-role denials.
4. Keep direct Supabase subscriptions disabled until those owner-policy tests pass.

**Phase 06 remains IN_PROGRESS.** The rollback-only ledger fixture and code-level guards do not substitute for the three remaining runtime gates.
