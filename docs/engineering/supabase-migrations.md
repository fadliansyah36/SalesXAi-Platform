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

Static design tokens do not require a migration or Realtime. Future business Realtime must be private, authorized and tenant-scoped.
