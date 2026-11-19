-- Phase 02 hardening: preserve immutable audit attribution across identity/tenant deletion
-- and restrict execution of private trigger functions.
begin;
alter table public.admin_audit_logs
  drop constraint if exists admin_audit_logs_actor_user_id_fkey;
alter table public.admin_audit_logs
  drop constraint if exists admin_audit_logs_organization_id_fkey;

revoke all on function app_private.set_updated_at() from public, anon, authenticated;
revoke all on function app_private.sync_auth_user_profile() from public, anon, authenticated;
revoke all on function app_private.sync_auth_identity() from public, anon, authenticated;
revoke all on function app_private.prevent_audit_mutation() from public, anon, authenticated;
revoke all on function app_private.is_active_org_member(uuid) from public, anon;
grant execute on function app_private.is_active_org_member(uuid) to authenticated, service_role;

comment on column public.admin_audit_logs.actor_user_id is
  'Historical Supabase Auth user UUID; intentionally not FK-constrained so immutable audit attribution survives account deletion.';
comment on column public.admin_audit_logs.organization_id is
  'Historical organization UUID; intentionally not FK-constrained so immutable audit records survive tenant archival/deletion.';
commit;