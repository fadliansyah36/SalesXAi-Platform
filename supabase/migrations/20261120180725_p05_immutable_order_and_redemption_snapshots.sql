begin;
create or replace function public.smartorder_protect_order_price_snapshot()
returns trigger language plpgsql as $$
begin
 if row(old.cart_id,old.customer_organization_id,old.customer_user_id,old.channel,old.currency,old.subtotal,old.discount_total,old.tax_total,old.grand_total,old.price_snapshot,old.promotion_snapshot,old.customer_snapshot,old.shipping_snapshot)
    is distinct from
    row(new.cart_id,new.customer_organization_id,new.customer_user_id,new.channel,new.currency,new.subtotal,new.discount_total,new.tax_total,new.grand_total,new.price_snapshot,new.promotion_snapshot,new.customer_snapshot,new.shipping_snapshot) then
  raise exception 'SmartOrder order commercial snapshots are immutable' using errcode='23514',constraint='orders_commercial_snapshot_immutable';
 end if;
 return new;
end $$;
revoke all on function public.smartorder_protect_order_price_snapshot() from public,anon,authenticated;
drop trigger if exists smartorder_orders_snapshot_immutable on public.orders;
create trigger smartorder_orders_snapshot_immutable before update on public.orders for each row execute function public.smartorder_protect_order_price_snapshot();
create or replace function public.smartorder_protect_promotion_redemption()
returns trigger language plpgsql as $$
begin
 if row(old.organization_id,old.promotion_owner_organization_id,old.promotion_id,old.order_id,old.customer_user_id,old.customer_organization_id,old.discount_amount)
    is distinct from
    row(new.organization_id,new.promotion_owner_organization_id,new.promotion_id,new.order_id,new.customer_user_id,new.customer_organization_id,new.discount_amount) then
  raise exception 'SmartOrder promotion redemption ownership and discount are immutable' using errcode='23514',constraint='promotion_redemption_snapshot_immutable';
 end if;
 if old.status='reversed' and new.status<>'reversed' then
  raise exception 'Reversed promotion redemptions are terminal' using errcode='23514',constraint='promotion_redemption_terminal';
 end if;
 if old.status='redeemed' and new.status='reserved' then
  raise exception 'Redeemed promotion cannot return to reserved' using errcode='23514',constraint='promotion_redemption_transition';
 end if;
 return new;
end $$;
revoke all on function public.smartorder_protect_promotion_redemption() from public,anon,authenticated;
drop trigger if exists smartorder_promotion_redemption_immutable on public.promotion_redemptions;
create trigger smartorder_promotion_redemption_immutable before update on public.promotion_redemptions for each row execute function public.smartorder_protect_promotion_redemption();
commit;