begin;
drop policy if exists smartorder_private_read on realtime.messages;
create policy smartorder_private_read on realtime.messages
 for select to authenticated
 using (
  extension='broadcast'
  and realtime.topic() ~ '^tenant:[0-9a-fA-F-]{36}:smartorder$'
  and exists(
   select 1
   from public.organization_memberships m
   join public.user_role_assignments ura
    on ura.membership_id=m.id and ura.scope_type='tenant' and ura.scope_id=m.organization_id
    and ura.revoked_at is null and ura.starts_at<=now() and (ura.expires_at is null or ura.expires_at>now())
   join public.role_permissions rp on rp.role_id=ura.role_id
   join public.permissions p on p.key=rp.permission_key
   where m.user_id=auth.uid() and m.status='active'
    and m.organization_id=split_part(realtime.topic(),':',2)::uuid
    and p.key=any(array['commerce:catalog:read','commerce:order:read','commerce:order:approve','commerce:order:manage','commerce:order:operations:read','commerce:inventory:read','commerce:cart:read'])
  )
 );
commit;