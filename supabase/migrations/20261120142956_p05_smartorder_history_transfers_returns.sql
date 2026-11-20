begin;
create table if not exists public.price_list_history (
 id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id) on delete restrict,
 price_list_id uuid not null, entity_type text not null check(entity_type in ('price_list','product_price')), entity_id uuid not null,
 action text not null check(action in ('insert','update','delete')), before_snapshot jsonb, after_snapshot jsonb,
 actor_user_id uuid references public.profiles(id) on delete set null, occurred_at timestamptz not null default now(),
 constraint price_list_history_list_fk foreign key(organization_id,price_list_id) references public.price_lists(organization_id,id) on delete restrict
);
create index if not exists price_list_history_lookup_idx on public.price_list_history(organization_id,price_list_id,occurred_at desc);
create or replace function public.smartorder_capture_price_history()
returns trigger language plpgsql security definer set search_path=pg_catalog,public as $$
declare org_id uuid; list_id uuid; entity_id uuid; before_data jsonb; after_data jsonb; actor_id uuid;
begin
 if TG_OP='DELETE' then org_id:=old.organization_id; entity_id:=old.id; before_data:=to_jsonb(old); after_data:=null;
 else org_id:=new.organization_id; entity_id:=new.id; after_data:=to_jsonb(new); if TG_OP='UPDATE' then before_data:=to_jsonb(old); end if; end if;
 if TG_TABLE_NAME='price_lists' then list_id:=entity_id; else list_id:=case when TG_OP='DELETE' then old.price_list_id else new.price_list_id end; end if;
 actor_id:=nullif(current_setting('app.actor_id',true),'')::uuid;
 insert into public.price_list_history(organization_id,price_list_id,entity_type,entity_id,action,before_snapshot,after_snapshot,actor_user_id)
 values(org_id,list_id,case when TG_TABLE_NAME='price_lists' then 'price_list' else 'product_price' end,entity_id,lower(TG_OP),before_data,after_data,actor_id);
 if TG_OP='DELETE' then return old; end if; return new;
end $$;
revoke all on function public.smartorder_capture_price_history() from public,anon,authenticated;
drop trigger if exists smartorder_price_list_history on public.price_lists;
create trigger smartorder_price_list_history after insert or update or delete on public.price_lists for each row execute function public.smartorder_capture_price_history();
drop trigger if exists smartorder_product_price_history on public.product_prices;
create trigger smartorder_product_price_history after insert or update or delete on public.product_prices for each row execute function public.smartorder_capture_price_history();
create table if not exists public.stock_transfers (
 id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id) on delete restrict,
 from_warehouse_id uuid not null, to_warehouse_id uuid not null, product_id uuid not null, variant_id uuid not null,
 quantity numeric(18,3) not null check(quantity>0), status text not null default 'completed' check(status in ('completed','cancelled')),
 reason text not null, actor_user_id uuid not null references public.profiles(id) on delete restrict, idempotency_key text not null,
 created_at timestamptz not null default now(), unique(organization_id,idempotency_key),
 constraint stock_transfer_different_warehouses check(from_warehouse_id<>to_warehouse_id),
 constraint stock_transfer_from_fk foreign key(organization_id,from_warehouse_id) references public.warehouses(organization_id,id) on delete restrict,
 constraint stock_transfer_to_fk foreign key(organization_id,to_warehouse_id) references public.warehouses(organization_id,id) on delete restrict,
 constraint stock_transfer_product_fk foreign key(organization_id,product_id) references public.products(organization_id,id) on delete restrict,
 constraint stock_transfer_variant_fk foreign key(organization_id,variant_id) references public.product_variants(organization_id,id) on delete restrict
);
create index if not exists stock_transfers_history_idx on public.stock_transfers(organization_id,created_at desc);
create table if not exists public.order_approval_policies (
 id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id) on delete restrict,
 name text not null, minimum_total numeric(18,2) not null default 0 check(minimum_total>=0), maximum_total numeric(18,2),
 required_approval_count smallint not null default 1 check(required_approval_count between 1 and 5),
 required_roles text[] not null default array[]::text[], auto_approve_below boolean not null default false,
 status text not null default 'active' check(status in ('active','inactive')), created_at timestamptz not null default now(),
 updated_at timestamptz not null default now(), unique(organization_id,id),
 constraint approval_policy_amount_range check(maximum_total is null or maximum_total>=minimum_total)
);
create index if not exists order_approval_policy_match_idx on public.order_approval_policies(organization_id,status,minimum_total,maximum_total);
create unique index if not exists order_items_org_id_uq on public.order_items(organization_id,id);
create table if not exists public.order_returns (
 id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id) on delete restrict,
 order_id uuid not null, return_number text not null, status text not null default 'requested' check(status in ('requested','approved','rejected','received','completed','cancelled')),
 reason text not null, requested_by uuid not null references public.profiles(id) on delete restrict, decided_by uuid references public.profiles(id) on delete set null,
 decided_at timestamptz, created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
 unique(organization_id,id), unique(organization_id,return_number),
 constraint order_returns_order_fk foreign key(organization_id,order_id) references public.orders(organization_id,id) on delete restrict
);
create table if not exists public.order_return_items (
 id uuid primary key default gen_random_uuid(), organization_id uuid not null, return_id uuid not null, order_item_id uuid not null,
 quantity numeric(18,3) not null check(quantity>0), disposition text not null default 'restock' check(disposition in ('restock','damaged','write_off')),
 created_at timestamptz not null default now(),
 constraint order_return_items_return_fk foreign key(organization_id,return_id) references public.order_returns(organization_id,id) on delete restrict,
 constraint order_return_items_order_item_fk foreign key(organization_id,order_item_id) references public.order_items(organization_id,id) on delete restrict
);
create index if not exists order_returns_order_idx on public.order_returns(organization_id,order_id,status);
do $$
declare t text;
begin
 foreach t in array array['price_list_history','stock_transfers','order_approval_policies','order_returns','order_return_items'] loop
  execute format('alter table public.%I enable row level security',t);
  execute format('drop policy if exists %I on public.%I',t||'_deny_client',t);
  execute format('create policy %I on public.%I for all to anon,authenticated using (false) with check (false)',t||'_deny_client',t);
  execute format('revoke all on table public.%I from anon,authenticated',t);
  execute format('grant select,insert,update,delete on table public.%I to service_role',t);
 end loop;
end $$;
commit;