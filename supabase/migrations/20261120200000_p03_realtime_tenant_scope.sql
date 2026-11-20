-- A tenant-wide private event channel is only readable by tenant-scoped administrators.
drop policy if exists salesx_master_data_private_read on realtime.messages;
create policy salesx_master_data_private_read
on realtime.messages for select to authenticated
using (
  extension = 'broadcast'
  and (select realtime.topic()) ~ '^tenant:[0-9a-fA-F-]{36}:master-data$'
  and exists (
    select 1
    from public.organization_memberships m
    join public.user_role_assignments ura
      on ura.membership_id=m.id
     and ura.scope_type='tenant'
     and ura.scope_id=m.organization_id
     and ura.revoked_at is null
     and ura.starts_at<=now()
     and (ura.expires_at is null or ura.expires_at>now())
    join public.role_permissions rp on rp.role_id=ura.role_id
    join public.permissions p on p.key=rp.permission_key
    where m.user_id=(select auth.uid())
      and m.status='active'
      and m.organization_id=split_part((select realtime.topic()),':',2)::uuid
      and p.key in ('master_data:import','master_data:export')
  )
);
