# Supabase Migration Ledger — Phase 06/07

**Project:** `eyofuiyxalbehbqoaeny`  
**Canonical repository:** `fadliansyah36/SalesXAi-Platform`  
**Branch:** `main`  
**Snapshot:** 2026-11-21  
**Live project state:** `ACTIVE_HEALTHY`, PostgreSQL 17.12.0.000, region `ap-northeast-1`.

## Live ledger reconciliation

- Total applied migrations: **92**
- Latest applied version: **20261121101601**
- Phase 06 applied migrations: **19**
- Phase 07 applied migrations: **6**
- Public base tables: **80**
- Public tables with RLS enabled: **80**
- Security Advisor: **0 lints**
- Performance Advisor: **0 unindexed-FK lints**; 270 unused-index findings are informational and are not grounds for dropping the FK/lookup indexes.
- Owner-pending SQL is intentionally outside `supabase/migrations/` and is **not** part of the applied migration ledger.

## Phase 06 — applied versions (19)

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

## Phase 07 — applied versions (6)

| Version | Migration |
|---|---|
| 20261121082433 | p07_location_intelligence_foundation |
| 20261121083536 | p07_location_live_projection_geofence_realtime |
| 20261121084148 | p07_location_role_permission_bindings |
| 20261121084817 | p07_location_and_segment_fk_indexes |
| 20261121085755 | p07_location_assignment_and_device_integrity |
| 20261121100848 | p07_location_geofence_ordering_route_replay |

## Owner-pending SQL — not applied

| File | Purpose | Status |
|---|---|---|
| `supabase/owner-pending/20261121101500_smartreward_realtime_role_scope_policy.sql` | Resource-specific participant/branch/tenant SmartReward private topic authorization | Requires authorized owner execution |
| `supabase/owner-pending/20261121100000_location_realtime_messages_owner_policy.sql` | Location live topic authorization by tenant, membership, permission and branch/team/territory | Requires authorized owner execution |
| `supabase/owner-pending/20261121104500_smartreward_enable_tenant_broadcast_after_policy.sql` | Re-enable tenant-wide SmartReward Broadcast only after policy application and subscription allow/deny validation | Requires policy gate first |

The connected SQL principal cannot assume the owner of `realtime.messages` (`supabase_realtime_admin`). No ownership change, privilege escalation or RLS bypass was attempted. Until owner authorization is available, permission-checked FastAPI SSE remains the supported event delivery path.

## Ledger integrity rule

The two latest applied migration filenames in `supabase/migrations/` are aligned to the exact versions returned by `supabase_migrations.schema_migrations`. Do not add owner-pending SQL to the applied migration ledger or mark it applied before the project owner confirms execution.
