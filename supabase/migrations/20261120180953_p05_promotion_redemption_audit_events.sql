begin;
create or replace function public.smartorder_audit_promotion_redemption()
returns trigger language plpgsql as $$
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
revoke all on function public.smartorder_audit_promotion_redemption() from public,anon,authenticated;
drop trigger if exists smartorder_promotion_redemption_audit on public.promotion_redemptions;
create trigger smartorder_promotion_redemption_audit after insert or update of status on public.promotion_redemptions
 for each row execute function public.smartorder_audit_promotion_redemption();
commit;