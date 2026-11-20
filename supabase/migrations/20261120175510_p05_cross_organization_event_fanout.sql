begin;
create or replace function public.smartorder_broadcast_change()
returns trigger language plpgsql security definer set search_path=pg_catalog,public,realtime as $$
declare
 org_id uuid;
 record_id uuid;
 resource_name text;
 state_value text;
 event_payload jsonb;
 order_id_value uuid;
 buyer_org uuid;
 target_org uuid;
begin
 if TG_OP='DELETE' then
  org_id:=old.organization_id; record_id:=old.id; state_value:=null;
 else
  org_id:=new.organization_id; record_id:=new.id;
  if TG_TABLE_NAME='orders' then state_value:=new.status;
  elsif TG_TABLE_NAME='carts' then state_value:=new.status;
  elsif TG_TABLE_NAME='fulfillments' then state_value:=new.status;
  else state_value:=null; end if;
 end if;
 resource_name:=TG_TABLE_NAME;
 if TG_TABLE_NAME='orders' then
  order_id_value:=record_id;
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
 event_payload:=jsonb_build_object('organization_id',org_id,'resource',resource_name,'record_id',record_id,
  'order_id',order_id_value,'operation',TG_OP,'status',state_value,'occurred_at',now());
 perform realtime.send(event_payload,'smartorder.changed','tenant:'||org_id::text||':smartorder',true);
 if order_id_value is not null then
  select o.organization_id into buyer_org from public.orders o where o.id=order_id_value;
  if buyer_org is not null and buyer_org<>org_id then
   perform realtime.send(event_payload||jsonb_build_object('organization_id',buyer_org),
    'smartorder.changed','tenant:'||buyer_org::text||':smartorder',true);
  end if;
  for target_org in
   select distinct x.organization_id from (
    select oi.product_owner_organization_id organization_id
     from public.order_items oi where oi.organization_id=buyer_org and oi.order_id=order_id_value
    union
    select sm.organization_id from public.stock_movements sm
     where sm.reference_type='order' and sm.reference_id=order_id_value
    union
    select f.fulfillment_organization_id from public.fulfillments f
     where f.organization_id=buyer_org and f.order_id=order_id_value
   ) x
   where x.organization_id is not null and x.organization_id<>buyer_org
    and exists(select 1 from public.commerce_catalog_access ca
     where ca.owner_organization_id=x.organization_id and ca.consumer_organization_id=buyer_org
      and ca.access_type in ('ordering','inventory') and ca.starts_at<=now()
      and (ca.ends_at is null or ca.ends_at>now()))
  loop
   if target_org<>org_id then
    perform realtime.send(event_payload||jsonb_build_object('organization_id',target_org),
     'smartorder.changed','tenant:'||target_org::text||':smartorder',true);
   end if;
  end loop;
 end if;
 if TG_OP='DELETE' then return old; end if;
 return new;
end $$;
revoke all on function public.smartorder_broadcast_change() from public,anon,authenticated;
drop trigger if exists smartorder_orders_broadcast on public.orders;
create trigger smartorder_orders_broadcast after insert or update or delete on public.orders
 for each row execute function public.smartorder_broadcast_change();
commit;