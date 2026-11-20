-- SalesX-Ai Phase 02: shared PostgreSQL-backed API abuse-control buckets.
-- The FastAPI service connects as the bound project's database owner; client roles
-- have no schema/table access. Keys are SHA-256 pseudonyms, never raw identifiers.
begin;
create table if not exists app_private.api_rate_limit_buckets (
  bucket_key text primary key check (bucket_key ~ '^[0-9a-f]{64}$'),
  bucket_name text not null check (length(bucket_name) between 1 and 64),
  window_started_at timestamptz not null,
  hit_count integer not null check (hit_count > 0),
  blocked_until timestamptz,
  updated_at timestamptz not null default now()
);
create index if not exists api_rate_limit_buckets_updated_idx
  on app_private.api_rate_limit_buckets(updated_at);
revoke all on app_private.api_rate_limit_buckets from public, anon, authenticated, service_role;
comment on table app_private.api_rate_limit_buckets is
  'Private multi-instance FastAPI abuse-control counters. Keys are SHA-256 pseudonyms; no raw IP, email, phone, access token or password is stored.';
commit;
