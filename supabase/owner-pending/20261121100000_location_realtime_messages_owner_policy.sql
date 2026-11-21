-- OWNER-GATED MIGRATION — DO NOT APPLY WITH THE CURRENT POSTGRES CONNECTOR.
-- realtime.messages is owned by supabase_realtime_admin. Apply only through the
-- Supabase project owner / authorized database role after formal owner approval.
-- The payload check filters each event to the actor's live branch/team/territory scope.
begin;
drop policy if exists location_private_read on realtime.messages;
create policy location_private_read on realtime.messages
for select to authenticated
using (
  extension = 'broadcast'
  and realtime.topic() ~ '^location:[0-9a-fA-F-]{36}:live$'
  and payload ->> 'organization_id' = split_part(realtime.topic(), ':', 2)
  and exists (
    select 1
    from public.organization_memberships actor_membership
    join public.user_role_assignments actor_assignment on actor_assignment.membership_id = actor_membership.id
    join public.roles actor_role on actor_role.id = actor_assignment.role_id
    join public.role_permissions actor_permission on actor_permission.role_id = actor_role.id
    join public.sales_profiles target_profile
      on target_profile.organization_id = actor_membership.organization_id
     and target_profile.user_id::text = payload ->> 'user_id'
     and target_profile.status = 'active'
    left join public.organization_memberships target_membership
      on target_membership.organization_id = target_profile.organization_id
     and target_membership.user_id = target_profile.user_id and target_membership.status = 'active'
    where actor_membership.user_id = (select auth.uid())
      and actor_membership.organization_id = split_part(realtime.topic(), ':', 2)::uuid
      and actor_membership.status = 'active'
      and actor_assignment.revoked_at is null
      and actor_assignment.starts_at <= now()
      and (actor_assignment.expires_at is null or actor_assignment.expires_at > now())
      and actor_permission.permission_key = 'location.live.read'
      and (
        (actor_role.key in ('tenant_owner', 'company_admin')
          and actor_assignment.scope_type in ('tenant', 'organization')
          and actor_assignment.scope_id = actor_membership.organization_id)
        or (actor_assignment.scope_type = 'team' and actor_assignment.scope_id = target_profile.team_id)
        or (actor_assignment.scope_type = 'territory' and actor_assignment.scope_id = target_profile.territory_id)
        or (actor_assignment.scope_type = 'branch' and actor_assignment.scope_id = target_membership.branch_id)
        or (actor_role.key = 'supervisor' and exists (
          select 1 from public.teams supervised_team
          where supervised_team.organization_id = target_profile.organization_id
            and supervised_team.id = target_profile.team_id
            and supervised_team.supervisor_user_id = (select auth.uid())
        ))
      )
  )
);
commit;
