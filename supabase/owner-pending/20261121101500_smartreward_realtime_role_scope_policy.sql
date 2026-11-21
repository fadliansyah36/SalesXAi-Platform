-- OWNER-GATED MIGRATION — do not apply through the ordinary postgres connector.
-- realtime.messages is owned by supabase_realtime_admin. Apply through the Supabase
-- project owner/authorized database role after owner approval.
-- Participant, branch-supervisor and tenant-management topics remain separate.
-- Each resource is authorized only by its corresponding read permission.
begin;

drop policy if exists smartreward_private_read on realtime.messages;
create policy smartreward_private_read on realtime.messages
for select to authenticated
using (
  extension = 'broadcast'
  and payload ->> 'organization_id' = split_part(realtime.topic(), ':', 2)
  and (
    (
      realtime.topic() ~ '^tenant:[0-9a-fA-F-]{36}:user:[0-9a-fA-F-]{36}:smartreward$'
      and split_part(realtime.topic(), ':', 4) = (select auth.uid())::text
      and (
        payload ->> 'participant_user_id' = split_part(realtime.topic(), ':', 4)
        or payload ->> 'requested_by' = split_part(realtime.topic(), ':', 4)
      )
      and exists (
        select 1
        from public.organization_memberships m
        join public.user_role_assignments ura on ura.membership_id = m.id
        join public.role_permissions rp on rp.role_id = ura.role_id
        where m.user_id = (select auth.uid())
          and m.status = 'active'
          and m.organization_id = split_part(realtime.topic(), ':', 2)::uuid
          and ura.revoked_at is null
          and ura.starts_at <= now()
          and (ura.expires_at is null or ura.expires_at > now())
          and (
            (payload ->> 'resource' = 'reward_points_ledger' and rp.permission_key = 'smartreward:ledger:read')
            or (payload ->> 'resource' = 'reward_redemptions' and rp.permission_key = 'smartreward:redemption:read')
            or (payload ->> 'resource' = 'reward_approval_requests' and rp.permission_key = 'smartreward:approval:read')
          )
      )
    )
    or
    (
      realtime.topic() ~ '^tenant:[0-9a-fA-F-]{36}:branch:[0-9a-fA-F-]{36}:smartreward$'
      and payload ->> 'branch_id' = split_part(realtime.topic(), ':', 4)
      and exists (
        select 1
        from public.organization_memberships m
        join public.user_role_assignments ura
          on ura.membership_id = m.id
         and ura.scope_type = 'branch'
         and ura.scope_id = split_part(realtime.topic(), ':', 4)::uuid
        join public.roles r on r.id = ura.role_id and r.key = 'supervisor'
        join public.role_permissions rp on rp.role_id = r.id
        where m.user_id = (select auth.uid())
          and m.status = 'active'
          and m.organization_id = split_part(realtime.topic(), ':', 2)::uuid
          and ura.revoked_at is null
          and ura.starts_at <= now()
          and (ura.expires_at is null or ura.expires_at > now())
          and (
            (payload ->> 'resource' = 'reward_points_ledger' and rp.permission_key = 'smartreward:ledger:read')
            or (payload ->> 'resource' = 'reward_redemptions' and rp.permission_key = 'smartreward:redemption:read')
            or (payload ->> 'resource' = 'reward_approval_requests' and rp.permission_key = 'smartreward:approval:read')
          )
      )
    )
    or
    (
      realtime.topic() ~ '^tenant:[0-9a-fA-F-]{36}:smartreward$'
      and exists (
        select 1
        from public.organization_memberships m
        join public.user_role_assignments ura
          on ura.membership_id = m.id
         and ura.scope_type in ('tenant', 'organization')
         and ura.scope_id = m.organization_id
        join public.roles r on r.id = ura.role_id
        join public.role_permissions rp on rp.role_id = r.id
        where m.user_id = (select auth.uid())
          and m.status = 'active'
          and m.organization_id = split_part(realtime.topic(), ':', 2)::uuid
          and r.key in ('tenant_owner', 'company_admin', 'principal_user', 'distributor_user')
          and ura.revoked_at is null
          and ura.starts_at <= now()
          and (ura.expires_at is null or ura.expires_at > now())
          and (
            (payload ->> 'resource' = 'reward_points_ledger' and rp.permission_key = 'smartreward:ledger:read')
            or (payload ->> 'resource' = 'reward_redemptions' and rp.permission_key = 'smartreward:redemption:read')
            or (payload ->> 'resource' = 'reward_approval_requests' and rp.permission_key = 'smartreward:approval:read')
            or (payload ->> 'resource' = 'reward_programs' and rp.permission_key = 'smartreward:program:read')
            or (payload ->> 'resource' = 'reward_incentive_rules' and rp.permission_key = 'smartreward:rule:read')
            or (payload ->> 'resource' = 'reward_catalog_items' and rp.permission_key = 'smartreward:catalog:read')
          )
      )
    )
  )
);
commit;
