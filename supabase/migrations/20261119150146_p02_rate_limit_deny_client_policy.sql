-- Explicit deny-all policy for every client role; FastAPI database owner bypasses RLS.
create policy api_rate_limit_buckets_deny_client
on app_private.api_rate_limit_buckets
for all to public
using (false)
with check (false);
