begin;
insert into public.permissions(key,resource,action,description) values
 ('commerce:order:cancel','commerce.order','cancel','Cancel eligible draft, submitted or approved orders and reverse allocations'),
 ('commerce:order:operations:read','commerce.order','operations_read','Read tenant-wide operational orders for approval and fulfillment')
on conflict(key) do update set resource=excluded.resource,action=excluded.action,description=excluded.description;
insert into public.role_permissions(role_id,permission_key)
select r.id,p.key from public.roles r cross join public.permissions p
where (r.key in ('platform_admin','tenant_owner','company_admin') and p.key in ('commerce:order:cancel','commerce:order:operations:read'))
 or (r.key in ('distributor_user','principal_user','supervisor') and p.key='commerce:order:operations:read')
 or (r.key in ('distributor_user','sales_rep','customer_user') and p.key='commerce:order:cancel')
on conflict(role_id,permission_key) do nothing;

create or replace function public.smartorder_reject_ledger_mutation()
returns trigger language plpgsql set search_path=pg_catalog,public as $$
begin raise exception 'immutable_ledger_record' using errcode='55000'; end $$;
revoke all on function public.smartorder_reject_ledger_mutation() from public,anon,authenticated;
drop trigger if exists price_list_history_immutable on public.price_list_history;
create trigger price_list_history_immutable before update or delete on public.price_list_history for each row execute function public.smartorder_reject_ledger_mutation();
drop trigger if exists stock_transfers_immutable on public.stock_transfers;
create trigger stock_transfers_immutable before update or delete on public.stock_transfers for each row execute function public.smartorder_reject_ledger_mutation();
drop trigger if exists order_return_items_immutable on public.order_return_items;
create trigger order_return_items_immutable before update or delete on public.order_return_items for each row execute function public.smartorder_reject_ledger_mutation();
commit;