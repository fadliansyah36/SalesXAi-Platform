begin;
insert into public.role_permissions(role_id,permission_key)
select r.id,'smartreward:rule:read' from public.roles r where r.key in ('sales_rep','customer_user')
on conflict(role_id,permission_key) do nothing;
drop trigger if exists reward_approval_history_immutable on public.reward_approval_history;
create trigger reward_approval_history_immutable before update or delete on public.reward_approval_history
 for each row execute function public.reject_reward_ledger_mutation();
create or replace function public.reward_write_private_outbox()
returns trigger language plpgsql security definer set search_path=pg_catalog,public as $$
declare org_id uuid; rid uuid; resource_name text; state text; event_time timestamptz:=now(); event_key uuid:=gen_random_uuid();
begin
 org_id:=new.organization_id; rid:=new.id; resource_name:=TG_TABLE_NAME; state:=to_jsonb(new)->>'status';
 insert into public.reward_event_outbox(organization_id,event_type,resource_id,payload,occurred_at)
 values(org_id,'smartreward.changed',rid,jsonb_build_object('event_id',event_key,'organization_id',org_id,'resource',resource_name,'record_id',rid,'operation',TG_OP,'status',state,'occurred_at',event_time),event_time);
 return new;
end $$;
revoke all on function public.reward_write_private_outbox() from public,anon,authenticated;
commit;