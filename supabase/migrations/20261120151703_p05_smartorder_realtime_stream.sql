begin;
create or replace function public.smartorder_broadcast_change()
returns trigger language plpgsql security definer set search_path=pg_catalog,public,realtime as $$
declare org_id uuid; record_id uuid; resource_name text; state_value text; event_payload jsonb;
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
  event_payload:=jsonb_build_object('organization_id',org_id,'resource',resource_name,'record_id',record_id,'operation',TG_OP,'status',state_value,'occurred_at',now());
  perform realtime.send(event_payload,'smartorder.changed','tenant:'||org_id::text||':smartorder',true);
  perform pg_notify('smartorder_events',event_payload::text);
  if TG_OP='DELETE' then return old; end if;
  return new;
end $$;
revoke all on function public.smartorder_broadcast_change() from public,anon,authenticated;

do $$
declare table_name text;
begin
 foreach table_name in array array[
  'product_categories','product_brands','units_of_measure','products','product_variants','product_images',
  'commerce_catalog_access','price_lists','product_prices','warehouses','stock_movements','promotions',
  'promotion_rules','cart_items','order_items','order_status_history','order_approvals','fulfillments',
  'promotion_redemptions','price_list_history','stock_transfers','order_approval_policies','order_returns','order_return_items'
 ] loop
  execute format('drop trigger if exists smartorder_%I_broadcast on public.%I',table_name,table_name);
  if table_name in ('stock_movements','order_items','order_status_history','order_approvals','promotion_redemptions','price_list_history','stock_transfers','order_returns','order_return_items') then
   execute format('create trigger smartorder_%I_broadcast after insert on public.%I for each row execute function public.smartorder_broadcast_change()',table_name,table_name);
  else
   execute format('create trigger smartorder_%I_broadcast after insert or update or delete on public.%I for each row execute function public.smartorder_broadcast_change()',table_name,table_name);
  end if;
 end loop;
end $$;
commit;
