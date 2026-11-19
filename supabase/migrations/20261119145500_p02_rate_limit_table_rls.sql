-- Defense in depth: the private rate-limit counter table has no client policies.
alter table app_private.api_rate_limit_buckets enable row level security;
revoke all on app_private.api_rate_limit_buckets from public, anon, authenticated, service_role;
