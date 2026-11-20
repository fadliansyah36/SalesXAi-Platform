begin;
-- Inventory/stock movements are owned by the warehouse tenant, not necessarily
-- by the organization that owns the catalog product.
alter table public.stock_movements drop constraint if exists stock_movement_product_fk;
alter table public.stock_movements drop constraint if exists stock_movement_variant_fk;

alter table public.stock_transfers add column if not exists product_owner_organization_id uuid;
update public.stock_transfers set product_owner_organization_id=organization_id where product_owner_organization_id is null;
alter table public.stock_transfers alter column product_owner_organization_id set not null;
alter table public.stock_transfers drop constraint if exists stock_transfer_product_fk;
alter table public.stock_transfers drop constraint if exists stock_transfer_variant_fk;
alter table public.stock_transfers
 add constraint stock_transfer_product_owner_fk foreign key(product_owner_organization_id,product_id) references public.products(organization_id,id) on delete restrict,
 add constraint stock_transfer_variant_owner_fk foreign key(product_owner_organization_id,variant_id) references public.product_variants(organization_id,id) on delete restrict;
create index if not exists stock_transfers_product_owner_idx on public.stock_transfers(product_owner_organization_id,product_id,variant_id);

create or replace function public.smartorder_set_legacy_owner_scope()
returns trigger language plpgsql set search_path=pg_catalog,public as $$
begin
 if tg_table_name in ('cart_items','order_items','inventory_balances','stock_movements','stock_transfers') then
  new.product_owner_organization_id := coalesce(new.product_owner_organization_id,new.organization_id);
 elsif tg_table_name='fulfillments' then
  new.fulfillment_organization_id := coalesce(new.fulfillment_organization_id,new.organization_id);
 end if;
 return new;
end
$$;
revoke all on function public.smartorder_set_legacy_owner_scope() from public,anon,authenticated;
drop trigger if exists smartorder_stock_transfers_owner_scope on public.stock_transfers;
create trigger smartorder_stock_transfers_owner_scope before insert or update on public.stock_transfers for each row execute function public.smartorder_set_legacy_owner_scope();
commit;