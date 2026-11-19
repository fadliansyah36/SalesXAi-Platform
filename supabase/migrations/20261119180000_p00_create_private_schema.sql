-- SalesX-Ai Phase 00: establish a non-exposed namespace for privileged
-- database helpers that may be introduced by later phases.
-- No tenant, user, business or application data is created in this bootstrap.

create schema if not exists app_private;

comment on schema app_private is
  'SalesX-Ai private database implementation namespace; never expose through the Supabase Data API.';

revoke all on schema app_private from public;
revoke all on schema app_private from anon;
revoke all on schema app_private from authenticated;
