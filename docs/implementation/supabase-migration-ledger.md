# Supabase Migration Ledger — Phase 06/07

**Project:** `eyofuiyxalbehbqoaeny`  
**Canonical repository:** `fadliansyah36/SalesXAi-Platform`  
**Branch:** `main`  
**Snapshot:** 2026-11-21  
**Live project state:** `ACTIVE_HEALTHY`, PostgreSQL 17.12.0.000, region `ap-northeast-1`.

## Live ledger reconciliation

- Total applied migrations: **115**
- Latest applied version: **20261121143047**
- Phase 06 applied migrations: **19**
- Phase 07 applied migrations: **7**
- Phase 08 applied migrations: **22**
- Public base tables: **89**
- Public tables with RLS enabled: **89**
- Security Advisor: **0 lints**
- Performance Advisor: **0 unindexed-FK lints**; 274 unused-index findings are informational because this project currently has no Auth users or organizations.
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

## Phase 07 — applied versions (7)

| Version | Migration |
|---|---|
| 20261121082433 | p07_location_intelligence_foundation |
| 20261121083536 | p07_location_live_projection_geofence_realtime |
| 20261121084148 | p07_location_role_permission_bindings |
| 20261121084817 | p07_location_and_segment_fk_indexes |
| 20261121085755 | p07_location_assignment_and_device_integrity |
| 20261121100848 | p07_location_geofence_ordering_route_replay |
| 20261121110006 | p07_location_tracking_sessions_require_shift |

## Owner-pending SQL — not applied

| File | Purpose | Status |
|---|---|---|
| `supabase/owner-pending/20261121101500_smartreward_realtime_role_scope_policy.sql` | Resource-specific participant/branch/tenant SmartReward private topic authorization | Requires authorized owner execution |
| `supabase/owner-pending/20261121100000_location_realtime_messages_owner_policy.sql` | Location live topic authorization by tenant, membership, permission and branch/team/territory | Requires authorized owner execution |
| `supabase/owner-pending/20261121104500_smartreward_enable_tenant_broadcast_after_policy.sql` | Re-enable tenant-wide SmartReward Broadcast only after policy application and subscription allow/deny validation | Requires policy gate first |

The connected SQL principal cannot assume the owner of `realtime.messages` (`supabase_realtime_admin`). No ownership change, privilege escalation or RLS bypass was attempted. Until owner authorization is available, permission-checked FastAPI SSE remains the supported event delivery path.

## Ledger integrity rule

The latest applied migration filename `20261121110006_p07_location_tracking_sessions_require_shift.sql` is aligned to the exact version returned by `supabase_migrations.schema_migrations`. The rollback-only Phase 07 database lifecycle fixture is documented at `supabase/tests/phase07_location_lifecycle.sql` and is not a migration. Do not add owner-pending SQL to the applied migration ledger or mark it applied before the project owner confirms execution.


## Latest live reconciliation — 2026-11-21

The connected Supabase project was re-queried after the final applied migration. Counts remain unchanged and aligned: **93 applied migrations**, latest 20261121110006, **19 Phase 06** migrations, **7 Phase 07** migrations, **80/80 public tables with RLS**, **0 Security Advisor lints**, and **0 unindexed foreign-key lints**. The owner-pending Realtime policy files remain intentionally outside the applied ledger.


## Phase 08 live ledger reconciliation — 2026-11-21 (latest)

- Live project: **115 applied migrations**, latest **20261121143047**, PostgreSQL 17.12, `ACTIVE_HEALTHY`.
- Phase 08 migrations: **22 applied**, all versioned files are present under `supabase/migrations/` with filenames matching the live migration versions.
- Public base tables: **89/89 have RLS enabled**. Security Advisor: **0 lints**. Performance Advisor: **0 unindexed-FK lints**; 274 unused-index notices are informational and expected while there are no organizations/users.
- Analytics private Storage bucket `analytics-private` is confirmed `public=false`, 50 MiB maximum, CSV MIME types only.
- Live data state: **0 organizations, 0 Auth users, 0 scheduled jobs, 0 job executions, 0 report runs, 0 report exports**. No fixture or mock business data was inserted.
- Portal handoff table is RLS-enabled with explicit deny policies for `anon` and `authenticated`; only service role can operate it. Actor and organization are non-null and actor is FK-bound to `auth.users`.

| Version | Migration |
|---|---|
| 20261121130029 | p08_analytics_reporting_foundation |
| 20261121130209 | p08_analytics_daily_refresh_function |
| 20261121130429 | p08_analytics_export_jobs_and_metric_catalog_policy |
| 20261121131321 | p08_analytics_weekly_monthly_rollups |
| 20261121132348 | p08_scoped_kpi_exports_scheduler |
| 20261121132754 | p08_salesperson_dashboard_permission |
| 20261121133238 | p08_salesperson_scope_rls_and_worker_grants |
| 20261121133352 | p08_scoped_inventory_and_reward_metrics |
| 20261121133658 | p08_supervisor_scoped_report_permission |
| 20261121134150 | p08_period_distinct_outlet_coverage |
| 20261121134219 | p08_report_access_audit_events |
| 20261121134252 | p08_scheduler_retry_controls |
| 20261121135044 | p08_cross_portal_one_time_handoff |
| 20261121135742 | p08_scoped_coverage_cte_fix |
| 20261121135823 | p08_tenant_admin_all_scope_snapshots |
| 20261121140047 | p08_scheduler_durable_leases |
| 20261121140239 | p08_report_export_retention_lifecycle |
| 20261121141029 | p08_portal_handoff_authorization_binding |
| 20261121142145 | p08_reward_metric_definition_alignment |
| 20261121142225 | p08_portal_handoff_explicit_client_deny |
| 20261121142813 | p08_portal_handoff_required_identity_constraints |
| 20261121143047 | p08_analytics_portal_fk_indexes |

- KPI refresh functions, RLS policies, indexes, private Storage, export lifecycle, audit trail, scheduler retry/lease controls and portal handoff constraints are applied to project `eyofuiyxalbehbqoaeny`.
- Phase 08 remains **IN_PROGRESS** until runtime data is provisioned by normal product onboarding and the full KPI/export/download/scheduler flow can be verified without synthetic persistent data; Web/Expo and routing CI checks are tracked separately.
- No Railway production deployment is claimed by this migration ledger.
