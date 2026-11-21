begin;

-- Broadcast only minimal state notifications; clients re-fetch authoritative data from FastAPI.
create or replace function public.reward_emit_private_event()
returns trigger
language plpgsql
security definer
set search_path=pg_catalog,public,realtime
as $$
declare
 row_data jsonb;
 org_id uuid;
 record_id uuid;
 operation_name text;
 participant_id uuid;
 requester_id uuid;
 branch_id uuid;
 payload jsonb;
begin
 if TG_OP='DELETE' then
  row_data:=to_jsonb(old);
  org_id:=old.organization_id;
  record_id:=old.id;
 else
  row_data:=to_jsonb(new);
  org_id:=new.organization_id;
  record_id:=new.id;
 end if;
 operation_name:=TG_OP;
 begin participant_id:=nullif(row_data->>'participant_user_id','')::uuid; exception when others then participant_id:=null; end;
 begin requester_id:=nullif(row_data->>'requested_by','')::uuid; exception when others then requester_id:=null; end;
 if participant_id is not null then
  select m.branch_id into branch_id from public.organization_memberships m
   where m.organization_id=org_id and m.user_id=participant_id and m.status='active' limit 1;
 end if;
 payload:=jsonb_build_object(
  'event_id',gen_random_uuid(),'organization_id',org_id,'resource',TG_TABLE_NAME,
  'record_id',record_id,'operation',operation_name,'status',row_data->>'status','occurred_at',now()
 );
 if participant_id is not null then
  perform realtime.send(payload,'smartreward.changed',
   'tenant:'||org_id::text||':user:'||participant_id::text||':smartreward',true);
 end if;
 if requester_id is not null and requester_id is distinct from participant_id then
  perform realtime.send(payload,'smartreward.changed',
   'tenant:'||org_id::text||':user:'||requester_id::text||':smartreward',true);
 end if;
 if branch_id is not null then
  perform realtime.send(payload,'smartreward.changed',
   'tenant:'||org_id::text||':branch:'||branch_id::text||':smartreward',true);
 end if;
 perform realtime.send(payload,'smartreward.changed',
  'tenant:'||org_id::text||':smartreward',true);
 if TG_OP='DELETE' then return old; end if;
 return new;
end
$$;

revoke all on function public.reward_emit_private_event() from public,anon,authenticated;

drop trigger if exists reward_ledger_private_event on public.reward_points_ledger;
create trigger reward_ledger_private_event
 after insert or update on public.reward_points_ledger
 for each row execute function public.reward_emit_private_event();

drop trigger if exists reward_redemption_private_event on public.reward_redemptions;
create trigger reward_redemption_private_event
 after insert or update on public.reward_redemptions
 for each row execute function public.reward_emit_private_event();

drop trigger if exists reward_program_private_event on public.reward_programs;
create trigger reward_program_private_event
 after insert or update on public.reward_programs
 for each row execute function public.reward_emit_private_event();

drop trigger if exists reward_rule_private_event on public.reward_incentive_rules;
create trigger reward_rule_private_event
 after insert or update on public.reward_incentive_rules
 for each row execute function public.reward_emit_private_event();

drop trigger if exists reward_catalog_private_event on public.reward_catalog_items;
create trigger reward_catalog_private_event
 after insert or update on public.reward_catalog_items
 for each row execute function public.reward_emit_private_event();

drop trigger if exists reward_approval_private_event on public.reward_approval_requests;
create trigger reward_approval_private_event
 after insert or update on public.reward_approval_requests
 for each row execute function public.reward_emit_private_event();

commit;
