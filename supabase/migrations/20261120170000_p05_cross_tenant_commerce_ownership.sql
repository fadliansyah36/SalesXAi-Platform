begin;
alter table public.cart_items add column if not exists product_owner_organization_id uuid;
update public.cart_items set product_owner_organization_id=organization_id where product_owner_organization_id is null;
alter table public.cart_items alter column product_owner_organization_id set not null;
alter table public.order_items add column if not exists product_owner_organization_id uuid;
update public.order_items set product_owner_organization_id=organization_id where product_owner_organization_id is null;
alter table public.order_items alter column product_owner_organization_id set not null;
alter table public.inventory_balances add column if not exists product_owner_organization_id uuid;
update public.inventory_balances set product_owner_organization_id=organization_id where product_owner_organization_id is null;
alter table public.inventory_balances alter column product_owner_organization_id set not null;
alter table public.stock_movements add column if not exists product_owner_organization_id uuid;
update public.stock_movements set product_owner_organization_id=organization_id where product_owner_organization_id is null;
alter table public.stock_movements alter column product_owner_organization_id set not null;
alter table public.fulfillments add column if not exists fulfillment_organization_id uuid;
update public.fulfillments set fulfillment_organization_id=organization_id where fulfillment_organization_id is null;
alter table public.fulfillments alter column fulfillment_organization_id set not null;
alter table public.cart_items drop constraint if exists cart_items_product_fk;
alter table public.cart_items drop constraint if exists cart_items_variant_fk;
alter table public.cart_items add constraint cart_items_product_owner_fk foreign key(product_owner_organization_id,product_id) references public.products(organization_id,id) on delete restrict,
 add constraint cart_items_variant_owner_fk foreign key(product_owner_organization_id,variant_id) references public.product_variants(organization_id,id) on delete restrict;
alter table public.order_items drop constraint if exists order_items_product_fk;
alter table public.order_items drop constraint if exists order_items_variant_fk;
alter table public.order_items add constraint order_items_product_owner_fk foreign key(product_owner_organization_id,product_id) references public.products(organization_id,id) on delete restrict,
 add constraint order_items_variant_owner_fk foreign key(product_owner_organization_id,variant_id) references public.product_variants(organization_id,id) on delete restrict;
alter table public.inventory_balances drop constraint if exists inventory_product_fk;
alter table public.inventory_balances drop constraint if exists inventory_variant_fk;
alter table public.inventory_balances add constraint inventory_product_owner_fk foreign key(product_owner_organization_id,product_id) references public.products(organization_id,id) on delete restrict,
 add constraint inventory_variant_owner_fk foreign key(product_owner_organization_id,variant_id) references public.product_variants(organization_id,id) on delete restrict;
alter table public.stock_movements add constraint stock_movements_product_owner_fk foreign key(product_owner_organization_id,product_id) references public.products(organization_id,id) on delete restrict,
 add constraint stock_movements_variant_owner_fk foreign key(product_owner_organization_id,variant_id) references public.product_variants(organization_id,id) on delete restrict;
alter table public.fulfillments drop constraint if exists fulfillments_warehouse_fk;
alter table public.fulfillments add constraint fulfillments_warehouse_owner_fk foreign key(fulfillment_organization_id,warehouse_id) references public.warehouses(organization_id,id) on delete restrict;
create index if not exists cart_items_product_owner_idx on public.cart_items(product_owner_organization_id,product_id,variant_id);
create index if not exists order_items_product_owner_idx on public.order_items(product_owner_organization_id,product_id,variant_id);
create index if not exists inventory_balances_product_owner_idx on public.inventory_balances(product_owner_organization_id,product_id,variant_id);
create index if not exists stock_movements_product_owner_idx on public.stock_movements(product_owner_organization_id,product_id,variant_id);
create index if not exists fulfillments_warehouse_owner_idx on public.fulfillments(fulfillment_organization_id,warehouse_id);
create table if not exists public.order_item_fulfillment_allocations(
 id uuid primary key default gen_random_uuid(),
 buyer_organization_id uuid not null references public.organizations(id) on delete restrict,
 order_id uuid not null, order_item_id uuid not null, fulfillment_id uuid not null,
 inventory_owner_organization_id uuid not null references public.organizations(id) on delete restrict,
 warehouse_id uuid not null, quantity numeric(18,3) not null check(quantity>0),
 created_at timestamptz not null default now(),
 constraint order_item_alloc_order_fk foreign key(buyer_organization_id,order_id) references public.orders(organization_id,id) on delete restrict,
 constraint order_item_alloc_item_fk foreign key(buyer_organization_id,order_item_id) references public.order_items(organization_id,id) on delete restrict,
 constraint order_item_alloc_fulfillment_fk foreign key(buyer_organization_id,fulfillment_id) references public.fulfillments(organization_id,id) on delete restrict,
 constraint order_item_alloc_warehouse_fk foreign key(inventory_owner_organization_id,warehouse_id) references public.warehouses(organization_id,id) on delete restrict,
 constraint order_item_alloc_unique unique(fulfillment_id,order_item_id)
);
create index if not exists order_item_alloc_order_idx on public.order_item_fulfillment_allocations(buyer_organization_id,order_id);
create index if not exists order_item_alloc_inventory_idx on public.order_item_fulfillment_allocations(inventory_owner_organization_id,warehouse_id);
alter table public.order_item_fulfillment_allocations enable row level security;
drop policy if exists order_item_fulfillment_allocations_deny_client on public.order_item_fulfillment_allocations;
create policy order_item_fulfillment_allocations_deny_client on public.order_item_fulfillment_allocations for all to anon,authenticated using(false) with check(false);
revoke all on table public.order_item_fulfillment_allocations from anon,authenticated;
grant select,insert,update,delete on table public.order_item_fulfillment_allocations to service_role;
commit;