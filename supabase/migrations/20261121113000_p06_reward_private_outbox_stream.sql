begin;
create index if not exists reward_outbox_org_time_idx on public.reward_event_outbox(organization_id,occurred_at,id);
create or replace function public.reward_write_private_outbox()
returns trigger language plpgsql security definer set search_path=pg_catalog,public as $$
declare org_id uuid; rid uuid; resource_name text; state text; event_time timestamptz:=now();
begin
 org_id:=new.organization_id; rid:=new.id; resource_name:=TG_TABLE_NAME;
 state:=to_jsonb(new)->>'status';
 insert into public.reward_event_outbox(organization_id,event_type,resource_id,payload,occurred_at)
 values(org_id,'smartreward.changed',rid,jsonb_build_object('event_id',rid,'organization_id',org_id,'resource',resource_name,'record_id',rid,'operation',TG_OP,'status',state,'occurred_at',event_time),event_time);
 return new;
end $$;
revoke all on function public.reward_write_private_outbox() from public,anon,authenticated;
drop trigger if exists reward_ledger_outbox on public.reward_points_ledger;
drop trigger if exists reward_redemption_outbox on public.reward_redemptions;
drop trigger if exists reward_approval_outbox on public.reward_approval_requests;
create trigger reward_ledger_outbox after insert on public.reward_points_ledger for each row execute function public.reward_write_private_outbox();
create trigger reward_redemption_outbox after insert or update on public.reward_redemptions for each row execute function public.reward_write_private_outbox();
create trigger reward_approval_outbox after insert or update on public.reward_approval_requests for each row execute function public.reward_write_private_outbox();
commit;