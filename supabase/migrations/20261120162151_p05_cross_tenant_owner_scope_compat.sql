begin;
create or replace function public.smartorder_set_legacy_owner_scope()
returns trigger
language plpgsql
set search_path=pg_catalog,public
as $$
begin
  if tg_table_name in ('cart_items','order_items','inventory_balances','stock_movements') then
    new.product_owner_organization_id := coalesce(new.product_owner_organization_id,new.organization_id);
  elsif tg_table_name='fulfillments' then
    new.fulfillment_organization_id := coalesce(new.fulfillment_organization_id,new.organization_id);
  end if;
  return new;
end
$$;
revoke all on function public.smartorder_set_legacy_owner_scope() from public,anon,authenticated;
drop trigger if exists smartorder_cart_items_owner_scope on public.cart_items;
create trigger smartorder_cart_items_owner_scope before insert or update on public.cart_items for each row execute function public.smartorder_set_legacy_owner_scope();
drop trigger if exists smartorder_order_items_owner_scope on public.order_items;
create trigger smartorder_order_items_owner_scope before insert or update on public.order_items for each row execute function public.smartorder_set_legacy_owner_scope();
drop trigger if exists smartorder_inventory_owner_scope on public.inventory_balances;
create trigger smartorder_inventory_owner_scope before insert or update on public.inventory_balances for each row execute function public.smartorder_set_legacy_owner_scope();
drop trigger if exists smartorder_stock_movement_owner_scope on public.stock_movements;
create trigger smartorder_stock_movement_owner_scope before insert or update on public.stock_movements for each row execute function public.smartorder_set_legacy_owner_scope();
drop trigger if exists smartorder_fulfillment_owner_scope on public.fulfillments;
create trigger smartorder_fulfillment_owner_scope before insert or update on public.fulfillments for each row execute function public.smartorder_set_legacy_owner_scope();
commit;