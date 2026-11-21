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
   join public.user_role_assignments ura on ura.membership_id=m.id
    and ura.scope_type='tenant' and ura.scope_id=m.organization_id
    and ura.revoked_at is null and ura.starts_at<=now() and (ura.expires_at is null or ura.expires_at>now())
   join public.role_permissions rp on rp.role_id=ura.role_id
   join public.permissions p on p.key=rp.permission_key
   where m.user_id=(select auth.uid()) and m.status='active'
    and m.organization_id=split_part(realtime.topic(),':',2)::uuid
    and (
     (payload->>'resource' in ('orders','order_items','order_status_history','order_approvals','order_partner_decisions','fulfillments','order_returns','order_return_items')
      and p.key=any(array['commerce:order:read','commerce:order:approve','commerce:order:manage','commerce:order:operations:read','commerce:order:fulfill']))
     or (payload->>'resource'='promotion_redemptions'
      and p.key=any(array['commerce:order:read','commerce:order:approve','commerce:order:manage','commerce:promotion:read','commerce:promotion:manage']))
     or (payload->>'resource'='stock_movements' and payload->>'order_id' is not null
      and p.key=any(array['commerce:order:read','commerce:order:operations:read','commerce:order:fulfill','commerce:inventory:read','commerce:inventory:manage']))
     or (payload->>'resource'='stock_movements' and payload->>'order_id' is null
      and p.key=any(array['commerce:inventory:read','commerce:inventory:manage']))
     or (payload->>'resource' in ('carts','cart_items')
      and p.key=any(array['commerce:cart:read','commerce:cart:manage','commerce:cart:assisted']))
     or (payload->>'resource' in ('inventory_balances','stock_transfers','warehouses')
      and p.key=any(array['commerce:inventory:read','commerce:inventory:manage']))
     or (payload->>'resource' in ('products','product_variants','product_brands','product_categories','product_images','units_of_measure','commerce_catalog_access')
      and p.key=any(array['commerce:catalog:read','commerce:catalog:manage']))
     or (payload->>'resource' in ('price_lists','product_prices','price_list_history')
      and p.key=any(array['commerce:pricing:read','commerce:pricing:manage']))
     or (payload->>'resource' in ('promotions','promotion_rules')
      and p.key=any(array['commerce:promotion:read','commerce:promotion:manage']))
     or (payload->>'resource'='order_approval_policies'
      and p.key=any(array['commerce:order:approve','commerce:order:manage']))
    )
  )
 );
commit;