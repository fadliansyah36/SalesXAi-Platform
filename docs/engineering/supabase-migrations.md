# Supabase Migration and Recovery Workflow

Target project ref: `eyofuiyxalbehbqoaeny` only.

## Migration workflow
1. Inspect live schema and migration history.
2. Add ordered UTC timestamp + snake_case SQL under `supabase/migrations/`.
3. Keep DDL deterministic and backward-compatible; do not create future-phase business tables early.
4. Review constraints, indexes, grants, RLS, functions, triggers, Storage and Realtime impact.
5. Apply against the explicitly linked project.
6. Verify both migration history and resulting schema on the same project ref.
7. Record filename/version, project ref, commit SHA, apply timestamp, schema impact and Realtime decision in the phase tracker.

```sh
supabase link --project-ref eyofuiyxalbehbqoaeny
supabase migration list
supabase db push
supabase migration list
```

## Backup and rollback
- Confirm managed backup/PITR availability and recovery point with the project operator before production DDL; do not assume a retention tier.
- Use Supabase CLI database dumps for portable schema evidence and store backups only in an approved secure location, never Git.
- Prefer forward-fix/compensating migrations for applied changes; never rewrite an applied migration to simulate rollback.
- For destructive/incompatible changes, stop until a recoverable backup and reviewed rollback/restore plan are confirmed.
- Record restore point, operator, timestamp, affected objects and post-recovery verification.

## Phase 00 record
`20261119101638_p00_create_private_schema.sql` is recorded as migration `20261119101638 / p00_create_private_schema`. It creates only non-exposed schema `app_private`, revokes public/anon/authenticated access, and adds no business tables or tenant data.

`20261119103355_p00_restrict_rls_auto_enable_execution.sql` is recorded as migration `20261119103355 / p00_restrict_rls_auto_enable_execution`. It revokes direct EXECUTE on the postgres-owned `public.rls_auto_enable()` SECURITY DEFINER event-trigger function from PUBLIC, anon and authenticated while retaining service_role execution. The postgres-owned `ensure_rls` event trigger remains enabled. Live privilege verification confirmed anon/authenticated cannot execute it; the Supabase security advisor returned no remaining lints.

Static design tokens do not require a migration or Realtime. Future business Realtime must be private, authorized and tenant-scoped.


## Phase 06 — SmartReward & Incentive migration ledger

Target project: `eyofuiyxalbehbqoaeny`  
Applied and verified: **2026-11-21**. Repository filenames and Supabase `schema_migrations` versions were reconciled; **16/16 Phase 06 migrations match exactly**.

| Version | Migration | Commit (short SHA) | Scope |
|---|---|---|---|
| 20261121012020 | `p06_reward_core` | `0231396da6ef` | Programs, incentive rules, catalog, accounts, immutable ledger, redemptions, audit and outbox foundations; tenant RLS and permissions |
| 20261121012025 | `p06_reward_ledger_compensation_signs` | `0231396da6ef` | Reversal and adjustment sign constraints and compensating ledger semantics |
| 20261121012115 | `p06_reward_fk_indexes` | `ef0e948ed7ab` | Core reward foreign-key indexes |
| 20261121013104 | `p06_reward_expiration_approval_lots` | `1b14499f191b` | Point lots, expiration processing and approval lifecycle foundation |
| 20261121013452 | `p06_reward_approval_self_read` | `f81e7fca250f` | Participant-owned approval request read policy |
| 20261121013538 | `p06_reward_private_outbox_stream` | `fddf4bb92ec6` | Private reward event outbox and stream foundation |
| 20261121013653 | `p06_reward_approval_history_and_participant_rules` | `c85df048277e` | Immutable approval decision history and participant rule constraints |
| 20261121013846 | `p06_reward_participant_rule_read` | `645cbad0e101` | Participant rule read permission |
| 20261121014304 | `p06_reward_lifecycle_fk_indexes` | `76bc6e07ef5c` | Lifecycle and approval foreign-key indexes |
| 20261121014859 | `p06_reward_realtime_ownership_scope` | `ee027950d8a1` | Private Realtime user, branch and tenant authorization scopes |
| 20261121020010 | `p06_reward_platform_overview_permission` | `8bc104eedeae` | Platform-level SmartReward aggregate read permission |
| 20261121024447 | `p06_reward_private_realtime_all_lifecycle_events` | `d89a5e1b3923` | Private broadcast triggers for ledger, redemption, approval, program, rule and catalog changes |
| 20261121025010 | `p06_reward_expiration_reconcile_ledger_first` | `65a2085a731b` | Reconcile account projection from ledger before point-lot expiration entries |
| 20261121025805 | `p06_reward_outbox_owner_scope` | `68206b1e1866` | Participant, requester and branch ownership metadata in outbox events; catalog/program/rule outbox triggers |
| 20261121030129 | `p06_reward_reporting_expiry_indexes` | `66f740106c37` | Expiration scan, incentive-period and catalog redemption reporting indexes |
| 20261121030235 | `p06_reward_outbox_retention` | `22ff14f15b00` | Scheduled 30-day private outbox retention |

Verification notes:
- Reward tables: 13; RLS enabled: 13.
- Supabase Security Advisor: zero lints. Performance Advisor: zero unindexed-foreign-key warnings.
- Private expiration job `salesx_reward_expiration` is active at `10 0 * * *` UTC.
- Private outbox retention job `salesx_reward_outbox_retention` is active at `30 0 * * *` UTC.
- No reward accounts or ledger transactions exist in the linked project at verification time; balance mismatch count is therefore zero across zero accounts. This is schema/constraint verification, not evidence of populated production reward activity.
