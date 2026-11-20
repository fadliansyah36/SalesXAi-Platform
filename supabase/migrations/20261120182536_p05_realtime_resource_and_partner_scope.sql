begin;
create or replace function public.smartorder_broadcast_change()
returns trigger language plpgsql security definer set search_path=pg_catalog,public,realtime as $$
declare
 org_id uuid; record_id uuid; resource_name text; state_value text;
 event_payload jsonb; order_id_value uuid; buyer_org uuid; target_org uuid;
begin
 if TG_OP='DELETE' then org_id:=old.organization_id; record_id:=old.id; state_value:=null;
 else
  org_id:=new.organization_id; record_id:=new.id;
  if TG_TABLE_NAME='orders' then state_value:=new.status;
  elsif TG_TABLE_NAME='carts' then state_value:=new.status;
  elsif TG_TABLE_NAME='fulfillments' then state_value:=new.status;
  else state_value:=null; end if;
 end if;
 resource_name:=TG_TABLE_NAME;
 if TG_TABLE_NAME='orders' then order_id_value:=record_id;
 elsif TG_TABLE_NAME in ('order_items','order_status_history','order_approvals','promotion_redemptions','fulfillments') then
  if TG_OP='DELETE' then order_id_value:=old.order_id; else order_id_value:=new.order_id; end if;
 elsif TG_TABLE_NAME='stock_movements' then
  if TG_OP='DELETE' then
   if old.reference_type='order' then order_id_value:=old.reference_id;
   elsif old.reference_type='fulfillment' then select f.order_id into order_id_value from public.fulfillments f where f.id=old.reference_id; end if;
  else
   if new.reference_type='order' then order_id_value:=new.reference_id;
   elsif new.reference_type='fulfillment' then select f.order_id into order_id_value from public.fulfillments f where f.id=new.reference_id; end if;
  end if;
 end if;
 event_payload:=jsonb_build_object('event_id',gen_random_uuid(),'organization_id',org_id,'resource',resource_name,
  'record_id',record_id,'order_id',order_id_value,'operation',TG_OP,'status',state_value,'occurred_at',now());
 perform realtime.send(event_payload,'smartorder.changed','tenant:'||org_id::text||':smartorder',true);
 if order_id_value is not null then
  select o.organization_id into buyer_org from public.orders o where o.id=order_id_value;
  if buyer_org is not null and buyer_org<>org_id then
   perform realtime.send(event_payload||jsonb_build_object('organization_id',buyer_org),
    'smartorder.changed','tenant:'||buyer_org::text||':smartorder',true);
  end if;
  for target_org in
   select distinct x.organization_id from (
    select oi.product_owner_organization_id organization_id from public.order_items oi where oi.organization_id=buyer_org and oi.order_id=order_id_value
    union select sm.organization_id from public.stock_movements sm where sm.reference_type='order' and sm.reference_id=order_id_value
    union select f.fulfillment_organization_id from public.fulfillments f where f.organization_id=buyer_org and f.order_id=order_id_value
    union select pr.promotion_owner_organization_id from public.promotion_redemptions pr where pr.organization_id=buyer_org and pr.order_id=order_id_value
   ) x
   where x.organization_id is not null and x.organization_id<>buyer_org
    and exists(select 1 from public.commerce_partner_links pl where pl.organization_id=x.organization_id
     and pl.partner_organization_id=buyer_org and pl.relationship_type in ('principal','distributor','company','customer')
     and pl.status='active' and pl.starts_at<=now() and (pl.ends_at is null or pl.ends_at>now()))
    and (
     exists(select 1 from public.commerce_catalog_access ca where ca.owner_organization_id=x.organization_id
      and ca.consumer_organization_id=buyer_org and ca.access_type in ('ordering','inventory')
      and (ca.product_id is null or exists(select 1 from public.order_items oi where oi.organization_id=buyer_org and oi.order_id=order_id_value and oi.product_id=ca.product_id))
      and ca.starts_at<=now() and (ca.ends_at is null or ca.ends_at>now()))
     or (resource_name='promotion_redemptions' and exists(select 1 from public.promotion_redemptions pr
      where pr.organization_id=buyer_org and pr.order_id=order_id_value and pr.promotion_owner_organization_id=x.organization_id))
    )
  loop
   if target_org<>org_id then perform realtime.send(event_payload||jsonb_build_object('organization_id',target_org),
    'smartorder.changed','tenant:'||target_org::text||':smartorder',true); end if;
  end loop;
 end if;
 if TG_OP='DELETE' then return old; end if;
 return new;
end $$;
revoke all on function public.smartorder_broadcast_change() from public,anon,authenticated;
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
   where m.user_id=auth.uid() and m.status='active'
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