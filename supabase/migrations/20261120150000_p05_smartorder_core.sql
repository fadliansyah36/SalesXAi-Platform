begin;

create table if not exists public.commerce_partner_links (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete restrict,
  partner_organization_id uuid not null references public.organizations(id) on delete restrict,
  relationship_type text not null check (relationship_type in ('principal','distributor','customer')),
  status text not null default 'active' check (status in ('pending','active','suspended','ended')),
  starts_at timestamptz not null default now(),
  ends_at timestamptz,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  constraint commerce_partner_not_self check (organization_id <> partner_organization_id),
  constraint commerce_partner_dates check (ends_at is null or ends_at > starts_at),
  unique (organization_id,partner_organization_id,relationship_type)
);

create table if not exists public.product_categories (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete restrict,
  parent_id uuid,
  code text not null,
  name text not null,
  description text,
  sort_order integer not null default 0,
  status text not null default 'active' check (status in ('active','inactive','archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id,id),
  constraint product_categories_parent_fk foreign key (organization_id,parent_id)
    references public.product_categories(organization_id,id) on delete restrict,
  constraint product_categories_name check (length(trim(name)) between 2 and 160)
);
create unique index if not exists product_categories_org_code_uq on public.product_categories(organization_id,lower(code));
create index if not exists product_categories_parent_idx on public.product_categories(organization_id,parent_id,status);

create table if not exists public.product_brands (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete restrict,
  name text not null,
  normalized_name text generated always as (lower(trim(name))) stored,
  status text not null default 'active' check (status in ('active','inactive','archived')),
  created_at timestamptz not null default now(),
  unique (organization_id,id),
  unique (organization_id,normalized_name)
);

create table if not exists public.units_of_measure (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete restrict,
  code text not null,
  name text not null,
  symbol text,
  decimal_places smallint not null default 0 check (decimal_places between 0 and 6),
  status text not null default 'active' check (status in ('active','inactive')),
  unique (organization_id,id),
  unique (organization_id,code)
);

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete restrict,
  category_id uuid,
  brand_id uuid,
  unit_id uuid,
  product_code text not null,
  name text not null,
  description text,
  specifications jsonb not null default '{}'::jsonb check (jsonb_typeof(specifications)='object'),
  tax_rate numeric(7,4) not null default 0 check (tax_rate between 0 and 100),
  status text not null default 'draft' check (status in ('draft','published','inactive','archived')),
  published_at timestamptz,
  created_by uuid references public.profiles(id) on delete set null,
  updated_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id,id),
  constraint products_category_fk foreign key (organization_id,category_id)
    references public.product_categories(organization_id,id) on delete restrict,
  constraint products_brand_fk foreign key (organization_id,brand_id)
    references public.product_brands(organization_id,id) on delete restrict,
  constraint products_unit_fk foreign key (organization_id,unit_id)
    references public.units_of_measure(organization_id,id) on delete restrict,
  constraint products_code_nonempty check (length(trim(product_code)) between 1 and 80),
  constraint products_name_nonempty check (length(trim(name)) between 2 and 240)
);
create unique index if not exists products_org_code_uq on public.products(organization_id,lower(product_code));
create index if not exists products_catalog_search_idx on public.products using gin
  (to_tsvector('simple',coalesce(name,'')||' '||coalesce(product_code,'')||' '||coalesce(description,'')));
create index if not exists products_catalog_status_idx on public.products(organization_id,status,category_id,updated_at desc);

create table if not exists public.product_variants (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null,
  product_id uuid not null,
  sku text not null,
  barcode text,
  name text not null,
  attributes jsonb not null default '{}'::jsonb check (jsonb_typeof(attributes)='object'),
  specifications jsonb not null default '{}'::jsonb check (jsonb_typeof(specifications)='object'),
  weight_grams integer check (weight_grams is null or weight_grams >= 0),
  status text not null default 'active' check (status in ('active','inactive','archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id,id),
  constraint product_variants_product_fk foreign key (organization_id,product_id)
    references public.products(organization_id,id) on delete restrict,
  constraint product_variants_sku_nonempty check (length(trim(sku)) between 1 and 100)
);
create unique index if not exists product_variants_org_sku_uq on public.product_variants(organization_id,lower(sku));
create unique index if not exists product_variants_org_barcode_uq on public.product_variants(organization_id,barcode) where barcode is not null;
create index if not exists product_variants_product_idx on public.product_variants(organization_id,product_id,status);

create table if not exists public.product_images (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null,
  product_id uuid not null,
  variant_id uuid,
  storage_path text not null,
  mime_type text not null check (mime_type in ('image/jpeg','image/png','image/webp')),
  size_bytes bigint not null check (size_bytes between 1 and 10485760),
  alt_text text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  unique (organization_id,storage_path),
  constraint product_images_product_fk foreign key (organization_id,product_id)
    references public.products(organization_id,id) on delete restrict,
  constraint product_images_variant_fk foreign key (organization_id,variant_id)
    references public.product_variants(organization_id,id) on delete restrict
);

create table if not exists public.commerce_catalog_access (
  id uuid primary key default gen_random_uuid(),
  owner_organization_id uuid not null references public.organizations(id) on delete restrict,
  consumer_organization_id uuid not null references public.organizations(id) on delete restrict,
  product_id uuid,
  access_type text not null default 'catalog' check (access_type in ('catalog','pricing','inventory','ordering')),
  starts_at timestamptz not null default now(),
  ends_at timestamptz,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  constraint commerce_catalog_access_dates check (ends_at is null or ends_at > starts_at),
  constraint commerce_catalog_access_product_fk foreign key (owner_organization_id,product_id)
    references public.products(organization_id,id) on delete restrict
);
create unique index if not exists commerce_catalog_access_uq
  on public.commerce_catalog_access(owner_organization_id,consumer_organization_id,coalesce(product_id,'00000000-0000-0000-0000-000000000000'::uuid),access_type);
create index if not exists commerce_catalog_access_consumer_idx
  on public.commerce_catalog_access(consumer_organization_id,access_type,starts_at,ends_at);

create table if not exists public.price_lists (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete restrict,
  name text not null,
  code text not null,
  currency char(3) not null default 'IDR',
  scope_type text not null default 'tenant' check (scope_type in ('tenant','principal','distributor','customer','region','channel','contract')),
  scope_id uuid,
  channel text,
  priority integer not null default 100,
  effective_from timestamptz not null default now(),
  effective_until timestamptz,
  status text not null default 'draft' check (status in ('draft','active','inactive','archived')),
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id,id),
  unique (organization_id,code),
  constraint price_lists_effective_dates check (effective_until is null or effective_until > effective_from)
);
create index if not exists price_lists_match_idx on public.price_lists(organization_id,status,scope_type,scope_id,priority,effective_from,effective_until);

create table if not exists public.product_prices (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null,
  price_list_id uuid not null,
  product_id uuid not null,
  variant_id uuid,
  unit_price numeric(18,2) not null check (unit_price >= 0),
  minimum_quantity numeric(18,3) not null default 1 check (minimum_quantity > 0),
  maximum_quantity numeric(18,3),
  effective_from timestamptz not null default now(),
  effective_until timestamptz,
  created_at timestamptz not null default now(),
  constraint product_prices_list_fk foreign key (organization_id,price_list_id)
    references public.price_lists(organization_id,id) on delete restrict,
  constraint product_prices_product_fk foreign key (organization_id,product_id)
    references public.products(organization_id,id) on delete restrict,
  constraint product_prices_variant_fk foreign key (organization_id,variant_id)
    references public.product_variants(organization_id,id) on delete restrict,
  constraint product_prices_quantity_range check (maximum_quantity is null or maximum_quantity >= minimum_quantity),
  constraint product_prices_effective_dates check (effective_until is null or effective_until > effective_from)
);
create index if not exists product_prices_lookup_idx on public.product_prices(organization_id,product_id,variant_id,effective_from,effective_until);

create table if not exists public.warehouses (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete restrict,
  branch_id uuid,
  code text not null,
  name text not null,
  address text,
  status text not null default 'active' check (status in ('active','inactive','archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id,id),
  constraint warehouses_branch_fk foreign key (organization_id,branch_id)
    references public.branches(organization_id,id) on delete restrict,
  unique (organization_id,code)
);

create table if not exists public.inventory_balances (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null,
  warehouse_id uuid not null,
  product_id uuid not null,
  variant_id uuid not null,
  on_hand numeric(18,3) not null default 0 check (on_hand >= 0),
  reserved numeric(18,3) not null default 0 check (reserved >= 0),
  committed numeric(18,3) not null default 0 check (committed >= 0),
  available numeric(18,3) generated always as (on_hand-reserved-committed) stored,
  version bigint not null default 0,
  updated_at timestamptz not null default now(),
  unique (organization_id,warehouse_id,variant_id),
  constraint inventory_warehouse_fk foreign key (organization_id,warehouse_id)
    references public.warehouses(organization_id,id) on delete restrict,
  constraint inventory_product_fk foreign key (organization_id,product_id)
    references public.products(organization_id,id) on delete restrict,
  constraint inventory_variant_fk foreign key (organization_id,variant_id)
    references public.product_variants(organization_id,id) on delete restrict,
  constraint inventory_reserved_committed_check check (reserved+committed <= on_hand)
);
create index if not exists inventory_availability_idx on public.inventory_balances(organization_id,product_id,variant_id,warehouse_id);

create table if not exists public.stock_movements (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null,
  warehouse_id uuid not null,
  product_id uuid not null,
  variant_id uuid not null,
  movement_type text not null check (movement_type in ('stock_in','stock_out','adjustment','transfer_in','transfer_out','reserve','release','commit')),
  quantity numeric(18,3) not null check (quantity > 0),
  on_hand_delta numeric(18,3) not null default 0,
  reserved_delta numeric(18,3) not null default 0,
  committed_delta numeric(18,3) not null default 0,
  reference_type text,
  reference_id uuid,
  reason text not null,
  actor_user_id uuid not null references public.profiles(id) on delete restrict,
  idempotency_key text not null,
  occurred_at timestamptz not null default now(),
  unique (organization_id,idempotency_key),
  constraint stock_movement_warehouse_fk foreign key (organization_id,warehouse_id)
    references public.warehouses(organization_id,id) on delete restrict,
  constraint stock_movement_product_fk foreign key (organization_id,product_id)
    references public.products(organization_id,id) on delete restrict,
  constraint stock_movement_variant_fk foreign key (organization_id,variant_id)
    references public.product_variants(organization_id,id) on delete restrict
);
create index if not exists stock_movements_history_idx on public.stock_movements(organization_id,warehouse_id,variant_id,occurred_at desc);

create table if not exists public.promotions (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete restrict,
  code text not null,
  name text not null,
  description text,
  priority integer not null default 100,
  stacking_group text,
  stackable boolean not null default false,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  status text not null default 'draft' check (status in ('draft','active','inactive','archived')),
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id,id),
  unique (organization_id,code),
  constraint promotions_dates check (ends_at > starts_at)
);

create table if not exists public.promotion_rules (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null,
  promotion_id uuid not null,
  rule_type text not null check (rule_type in ('minimum_value','minimum_quantity','product','category','customer','discount_percent','discount_amount','voucher')),
  rule_config jsonb not null default '{}'::jsonb check (jsonb_typeof(rule_config)='object'),
  created_at timestamptz not null default now(),
  constraint promotion_rules_promotion_fk foreign key (organization_id,promotion_id)
    references public.promotions(organization_id,id) on delete cascade
);
create index if not exists promotion_rules_promotion_idx on public.promotion_rules(organization_id,promotion_id);

create table if not exists public.carts (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete restrict,
  owner_user_id uuid not null references public.profiles(id) on delete restrict,
  customer_organization_id uuid references public.organizations(id) on delete restrict,
  channel text not null default 'customer' check (channel in ('customer','sales_assisted','mobile')),
  status text not null default 'active' check (status in ('active','submitted','converted','expired','abandoned')),
  currency char(3) not null default 'IDR',
  expires_at timestamptz not null default (now()+interval '7 days'),
  version bigint not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id,id)
);
create unique index if not exists carts_one_active_per_owner_uq on public.carts(organization_id,owner_user_id) where status='active';
create index if not exists carts_customer_idx on public.carts(organization_id,customer_organization_id,status,updated_at desc);

create table if not exists public.cart_items (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null,
  cart_id uuid not null,
  product_id uuid not null,
  variant_id uuid not null,
  quantity numeric(18,3) not null check (quantity > 0),
  notes text,
  price_snapshot jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint cart_items_cart_fk foreign key (organization_id,cart_id)
    references public.carts(organization_id,id) on delete cascade,
  constraint cart_items_product_fk foreign key (organization_id,product_id)
    references public.products(organization_id,id) on delete restrict,
  constraint cart_items_variant_fk foreign key (organization_id,variant_id)
    references public.product_variants(organization_id,id) on delete restrict,
  unique (cart_id,variant_id)
);

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete restrict,
  order_number text not null,
  cart_id uuid,
  customer_organization_id uuid references public.organizations(id) on delete restrict,
  customer_user_id uuid not null references public.profiles(id) on delete restrict,
  channel text not null check (channel in ('customer','sales_assisted','mobile')),
  status text not null default 'draft' check (status in ('draft','submitted','pending_approval','approved','rejected','processing','fulfilled','completed','cancelled')),
  currency char(3) not null default 'IDR',
  subtotal numeric(18,2) not null default 0 check (subtotal >= 0),
  discount_total numeric(18,2) not null default 0 check (discount_total >= 0),
  tax_total numeric(18,2) not null default 0 check (tax_total >= 0),
  shipping_total numeric(18,2) not null default 0 check (shipping_total >= 0),
  grand_total numeric(18,2) not null default 0 check (grand_total >= 0),
  price_snapshot jsonb not null default '{}'::jsonb,
  promotion_snapshot jsonb not null default '[]'::jsonb,
  customer_snapshot jsonb not null default '{}'::jsonb,
  shipping_snapshot jsonb not null default '{}'::jsonb,
  notes text,
  idempotency_key text not null,
  submitted_at timestamptz,
  approved_at timestamptz,
  fulfilled_at timestamptz,
  cancelled_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id,id),
  unique (organization_id,order_number),
  unique (organization_id,customer_user_id,idempotency_key),
  constraint orders_cart_fk foreign key (organization_id,cart_id)
    references public.carts(organization_id,id) on delete restrict
);
create index if not exists orders_org_status_date_idx on public.orders(organization_id,status,created_at desc);
create index if not exists orders_customer_history_idx on public.orders(organization_id,customer_user_id,created_at desc);

create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null,
  order_id uuid not null,
  product_id uuid not null,
  variant_id uuid not null,
  product_snapshot jsonb not null,
  quantity numeric(18,3) not null check (quantity > 0),
  unit_price numeric(18,2) not null check (unit_price >= 0),
  discount_amount numeric(18,2) not null default 0 check (discount_amount >= 0),
  tax_amount numeric(18,2) not null default 0 check (tax_amount >= 0),
  line_total numeric(18,2) not null check (line_total >= 0),
  created_at timestamptz not null default now(),
  constraint order_items_order_fk foreign key (organization_id,order_id)
    references public.orders(organization_id,id) on delete restrict,
  constraint order_items_product_fk foreign key (organization_id,product_id)
    references public.products(organization_id,id) on delete restrict,
  constraint order_items_variant_fk foreign key (organization_id,variant_id)
    references public.product_variants(organization_id,id) on delete restrict
);
create index if not exists order_items_order_idx on public.order_items(organization_id,order_id);

create table if not exists public.order_status_history (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null,
  order_id uuid not null,
  from_status text,
  to_status text not null,
  reason text,
  actor_user_id uuid not null references public.profiles(id) on delete restrict,
  occurred_at timestamptz not null default now(),
  constraint order_status_history_order_fk foreign key (organization_id,order_id)
    references public.orders(organization_id,id) on delete restrict
);
create index if not exists order_status_history_idx on public.order_status_history(organization_id,order_id,occurred_at desc);

create table if not exists public.order_approvals (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null,
  order_id uuid not null,
  decision text not null check (decision in ('approved','rejected','revision_requested')),
  reason text,
  actor_user_id uuid not null references public.profiles(id) on delete restrict,
  decided_at timestamptz not null default now(),
  constraint order_approvals_order_fk foreign key (organization_id,order_id)
    references public.orders(organization_id,id) on delete restrict
);

create table if not exists public.fulfillments (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null,
  order_id uuid not null,
  warehouse_id uuid,
  status text not null default 'queued' check (status in ('queued','picking','packed','handed_over','delivered','failed','cancelled')),
  carrier text,
  tracking_number text,
  external_status_at timestamptz,
  assigned_to uuid references public.profiles(id) on delete set null,
  created_by uuid not null references public.profiles(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint fulfillments_order_fk foreign key (organization_id,order_id)
    references public.orders(organization_id,id) on delete restrict,
  constraint fulfillments_warehouse_fk foreign key (organization_id,warehouse_id)
    references public.warehouses(organization_id,id) on delete restrict
);
create index if not exists fulfillments_order_idx on public.fulfillments(organization_id,order_id,status);

create table if not exists public.promotion_redemptions (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null,
  promotion_id uuid not null,
  order_id uuid not null,
  customer_user_id uuid not null references public.profiles(id) on delete restrict,
  discount_amount numeric(18,2) not null check (discount_amount >= 0),
  redeemed_at timestamptz not null default now(),
  unique (organization_id,promotion_id,order_id),
  constraint promotion_redemptions_promotion_fk foreign key (organization_id,promotion_id)
    references public.promotions(organization_id,id) on delete restrict,
  constraint promotion_redemptions_order_fk foreign key (organization_id,order_id)
    references public.orders(organization_id,id) on delete restrict
);

create table if not exists public.commerce_audit_events (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete restrict,
  actor_user_id uuid references public.profiles(id) on delete set null,
  action text not null,
  resource_type text not null,
  resource_id uuid,
  correlation_id text,
  metadata jsonb not null default '{}'::jsonb,
  occurred_at timestamptz not null default now()
);
create index if not exists commerce_audit_org_time_idx on public.commerce_audit_events(organization_id,occurred_at desc);

create or replace function public.smartorder_reject_immutable_mutation()
returns trigger language plpgsql set search_path=pg_catalog,public as $$
begin
  raise exception 'immutable_ledger_record' using errcode='55000';
end $$;
revoke all on function public.smartorder_reject_immutable_mutation() from public,anon,authenticated;

drop trigger if exists stock_movements_immutable on public.stock_movements;
create trigger stock_movements_immutable before update or delete on public.stock_movements
for each row execute function public.smartorder_reject_immutable_mutation();

drop trigger if exists order_items_immutable on public.order_items;
create trigger order_items_immutable before update or delete on public.order_items
for each row execute function public.smartorder_reject_immutable_mutation();

drop trigger if exists order_status_history_immutable on public.order_status_history;
create trigger order_status_history_immutable before update or delete on public.order_status_history
for each row execute function public.smartorder_reject_immutable_mutation();

create or replace function public.smartorder_broadcast_change()
returns trigger language plpgsql security definer set search_path=pg_catalog,public,realtime as $$
declare org_id uuid; record_id uuid; resource_name text; state_value text;
begin
  if TG_OP='DELETE' then org_id:=old.organization_id; record_id:=old.id; state_value:=null;
  else org_id:=new.organization_id; record_id:=new.id;
    if TG_TABLE_NAME='orders' then state_value:=new.status;
    elsif TG_TABLE_NAME='carts' then state_value:=new.status;
    else state_value:=null; end if;
  end if;
  resource_name:=TG_TABLE_NAME;
  perform realtime.send(
    jsonb_build_object('organization_id',org_id,'resource',resource_name,'record_id',record_id,'operation',TG_OP,'status',state_value,'occurred_at',now()),
    'smartorder.changed','tenant:'||org_id::text||':smartorder',true
  );
  if TG_OP='DELETE' then return old; end if;
  return new;
end $$;
revoke all on function public.smartorder_broadcast_change() from public,anon,authenticated;

drop trigger if exists smartorder_orders_broadcast on public.orders;
create trigger smartorder_orders_broadcast after insert or update or delete on public.orders for each row execute function public.smartorder_broadcast_change();
drop trigger if exists smartorder_carts_broadcast on public.carts;
create trigger smartorder_carts_broadcast after insert or update or delete on public.carts for each row execute function public.smartorder_broadcast_change();
drop trigger if exists smartorder_inventory_broadcast on public.inventory_balances;
create trigger smartorder_inventory_broadcast after insert or update on public.inventory_balances for each row execute function public.smartorder_broadcast_change();

drop policy if exists smartorder_private_read on realtime.messages;
create policy smartorder_private_read on realtime.messages for select to authenticated
using (
  extension='broadcast'
  and (select realtime.topic()) ~ '^tenant:[0-9a-fA-F-]{36}:smartorder$'
  and exists (
    select 1 from public.organization_memberships m
    join public.user_role_assignments ura on ura.membership_id=m.id
      and ura.revoked_at is null and ura.starts_at<=now() and (ura.expires_at is null or ura.expires_at>now())
    join public.role_permissions rp on rp.role_id=ura.role_id
    where m.user_id=(select auth.uid()) and m.status='active'
      and m.organization_id=split_part((select realtime.topic()),':',2)::uuid
      and rp.permission_key in ('commerce:catalog:read','commerce:order:read','commerce:inventory:read','commerce:cart:read')
  )
);

insert into public.permissions(key,resource,action,description) values
 ('commerce:catalog:read','commerce.catalog','read','Read authorized product catalog'),
 ('commerce:catalog:manage','commerce.catalog','manage','Create and manage product master and SKU'),
 ('commerce:pricing:read','commerce.pricing','read','Read effective price lists and quotes'),
 ('commerce:pricing:manage','commerce.pricing','manage','Manage price lists and product prices'),
 ('commerce:inventory:read','commerce.inventory','read','Read warehouse inventory availability'),
 ('commerce:inventory:manage','commerce.inventory','manage','Record stock movements and inventory adjustments'),
 ('commerce:promotion:read','commerce.promotion','read','Read active promotions'),
 ('commerce:promotion:manage','commerce.promotion','manage','Manage promotions and eligibility rules'),
 ('commerce:cart:read','commerce.cart','read','Read own or authorized carts'),
 ('commerce:cart:manage','commerce.cart','manage','Manage cart items and drafts'),
 ('commerce:order:read','commerce.order','read','Read authorized orders and history'),
 ('commerce:order:create','commerce.order','create','Create and submit orders'),
 ('commerce:order:manage','commerce.order','manage','Manage order lifecycle and cancellation'),
 ('commerce:order:approve','commerce.order','approve','Approve or reject orders'),
 ('commerce:order:fulfill','commerce.order','fulfill','Process order fulfillment')
on conflict(key) do update set resource=excluded.resource,action=excluded.action,description=excluded.description;

insert into public.role_permissions(role_id,permission_key)
select r.id,p.key
from public.roles r cross join public.permissions p
where
 (r.key in ('platform_admin','tenant_owner','company_admin') and p.key like 'commerce:%')
 or (r.key='principal_user' and p.key in ('commerce:catalog:read','commerce:catalog:manage','commerce:pricing:read','commerce:pricing:manage','commerce:promotion:read','commerce:promotion:manage','commerce:order:read'))
 or (r.key='distributor_user' and p.key in ('commerce:catalog:read','commerce:pricing:read','commerce:inventory:read','commerce:inventory:manage','commerce:promotion:read','commerce:order:read','commerce:order:manage','commerce:order:fulfill'))
 or (r.key='supervisor' and p.key in ('commerce:catalog:read','commerce:pricing:read','commerce:promotion:read','commerce:cart:read','commerce:order:read','commerce:order:create'))
 or (r.key='sales_rep' and p.key in ('commerce:catalog:read','commerce:pricing:read','commerce:promotion:read','commerce:cart:read','commerce:cart:manage','commerce:order:read','commerce:order:create'))
 or (r.key='customer_user' and p.key in ('commerce:catalog:read','commerce:pricing:read','commerce:promotion:read','commerce:cart:read','commerce:cart:manage','commerce:order:read','commerce:order:create'))
on conflict(role_id,permission_key) do nothing;

do $$
declare t text;
begin
  foreach t in array array[
    'commerce_partner_links','product_categories','product_brands','units_of_measure','products',
    'product_variants','product_images','commerce_catalog_access','price_lists','product_prices',
    'warehouses','inventory_balances','stock_movements','promotions','promotion_rules',
    'carts','cart_items','orders','order_items','order_status_history','order_approvals',
    'fulfillments','promotion_redemptions','commerce_audit_events'
  ] loop
    execute format('alter table public.%I enable row level security',t);
    execute format('drop policy if exists %I on public.%I',t||'_deny_client',t);
    execute format('create policy %I on public.%I for all to anon,authenticated using (false) with check (false)',t||'_deny_client',t);
    execute format('revoke all on table public.%I from anon,authenticated',t);
    execute format('grant select,insert,update,delete on table public.%I to service_role',t);
  end loop;
end $$;

insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values ('smartorder-product-media','smartorder-product-media',false,10485760,array['image/jpeg','image/png','image/webp'])
on conflict(id) do update set public=false,file_size_limit=10485760,allowed_mime_types=excluded.allowed_mime_types;

commit;