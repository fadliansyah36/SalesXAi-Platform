begin;

create or replace function public.process_reward_expirations(p_limit integer default 500)
returns integer
language plpgsql
security definer
set search_path=pg_catalog,public
as $$
declare
 lot record;
 current_balance bigint;
 expired bigint;
 processed integer:=0;
 key text;
begin
 for lot in
  select * from public.reward_point_lots
  where expires_at is not null and expires_at<=now() and points_remaining>0
  order by expires_at,created_at
  for update skip locked
  limit greatest(1,least(p_limit,5000))
 loop
  perform 1 from public.reward_accounts
   where id=lot.account_id and organization_id=lot.organization_id
   for update;
  if not found then
   raise exception 'reward account missing for point lot %',lot.id using errcode='23503';
  end if;
  select coalesce(sum(points_delta),0)::bigint into current_balance
   from public.reward_points_ledger
   where organization_id=lot.organization_id and account_id=lot.account_id;
  if current_balance<0 then
   raise exception 'reward ledger balance is negative for account %',lot.account_id using errcode='23514';
  end if;
  update public.reward_accounts set points_balance=current_balance,updated_at=now()
   where id=lot.account_id and organization_id=lot.organization_id;
  expired:=lot.points_remaining;
  if expired<=0 then continue; end if;
  if current_balance<expired then
   raise exception 'reward balance is below unexpired point lot for account %',lot.account_id using errcode='23514';
  end if;
  update public.reward_point_lots set points_remaining=0 where id=lot.id;
  key:='expire:'||lot.id::text;
  insert into public.reward_points_ledger(
   organization_id,account_id,participant_user_id,entry_type,points_delta,
   balance_before,balance_after,source_type,source_id,reference_type,reference_id,
   actor_user_id,idempotency_key,reason,metadata
  ) values(
   lot.organization_id,lot.account_id,lot.participant_user_id,'expiration',-expired,
   current_balance,current_balance-expired,'reward_point_lot',lot.id,
   'reward_point_lot',lot.id,lot.participant_user_id,key,'Reward points expired',
   jsonb_build_object('lot_id',lot.id,'expired_points',expired)
  );
  update public.reward_accounts set points_balance=current_balance-expired,updated_at=now()
   where id=lot.account_id and organization_id=lot.organization_id;
  insert into public.reward_event_outbox(organization_id,event_type,resource_id,payload)
   values(lot.organization_id,'reward.points.expired',lot.id,
    jsonb_build_object('account_id',lot.account_id,'participant_user_id',lot.participant_user_id,'expired_points',expired));
  processed:=processed+1;
 end loop;
 return processed;
end
$$;

revoke all on function public.process_reward_expirations(integer) from public,anon,authenticated;
grant execute on function public.process_reward_expirations(integer) to service_role;

commit;
