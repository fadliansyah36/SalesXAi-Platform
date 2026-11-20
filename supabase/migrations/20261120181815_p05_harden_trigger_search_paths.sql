begin;
create or replace function public.smartorder_protect_order_price_snapshot()
returns trigger language plpgsql set search_path=pg_catalog,public as $$
begin
 if row(old.cart_id,old.customer_organization_id,old.customer_user_id,old.channel,old.currency,old.subtotal,old.discount_total,old.tax_total,old.grand_total,old.price_snapshot,old.promotion_snapshot,old.customer_snapshot,old.shipping_snapshot)
    is distinct from
    row(new.cart_id,new.customer_organization_id,new.customer_user_id,new.channel,new.currency,new.subtotal,new.discount_total,new.tax_total,new.grand_total,new.price_snapshot,new.promotion_snapshot,new.customer_snapshot,new.shipping_snapshot) then
  raise exception 'SmartOrder order commercial snapshots are immutable' using errcode='23514',constraint='orders_commercial_snapshot_immutable';
 end if;
 return new;
end $$;
create or replace function public.smartorder_protect_promotion_redemption()
returns trigger language plpgsql set search_path=pg_catalog,public as $$
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
create or replace function public.smartorder_audit_promotion_redemption()
returns trigger language plpgsql set search_path=pg_catalog,public as $$
declare audit_action text;
declare actor uuid;
begin
 actor:=coalesce(nullif(current_setting('app.actor_id',true), '')::uuid,new.customer_user_id);
 if tg_op='INSERT' then
  audit_action:='promotion.redemption.reserved';
 elsif new.status is distinct from old.status then
  audit_action:=case new.status when 'redeemed' then 'promotion.redemption.redeemed' when 'reversed' then 'promotion.redemption.reversed' else 'promotion.redemption.status_changed' end;
 else return new;
 end if;
 insert into public.commerce_audit_events(organization_id,actor_user_id,action,resource_type,resource_id,metadata)
 values(new.organization_id,actor,'promotion.redemption.'||split_part(audit_action,'.',3),'promotion_redemption',new.id,
  jsonb_build_object('promotion_owner_organization_id',new.promotion_owner_organization_id,'promotion_id',new.promotion_id,
   'order_id',new.order_id,'customer_organization_id',new.customer_organization_id,'discount_amount',new.discount_amount,
   'status',new.status,'audit_action',audit_action));
 return new;
end $$;
commit;