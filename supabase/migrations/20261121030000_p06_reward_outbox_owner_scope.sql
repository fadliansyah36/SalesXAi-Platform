begin;

create or replace function public.reward_write_private_outbox()
returns trigger
language plpgsql
security definer
set search_path=pg_catalog,public
as $$
declare
 row_data jsonb;
 org_id uuid;
 rid uuid;
 resource_name text;
 state text;
 participant_id uuid;
 requester_id uuid;
 branch_id uuid;
 event_time timestamptz:=now();
 event_key uuid:=gen_random_uuid();
 payload jsonb;
begin
 row_data:=to_jsonb(new);
 org_id:=new.organization_id;
 rid:=new.id;
 resource_name:=TG_TABLE_NAME;
 state:=row_data->>'status';
 begin participant_id:=nullif(row_data->>'participant_user_id','')::uuid; exception when others then participant_id:=null; end;
 begin requester_id:=nullif(row_data->>'requested_by','')::uuid; exception when others then requester_id:=null; end;
 if participant_id is not null then
  select m.branch_id into branch_id from public.organization_memberships m
   where m.organization_id=org_id and m.user_id=participant_id and m.status='active' limit 1;
 end if;
 payload:=jsonb_build_object(
  'event_id',event_key,'organization_id',org_id,'resource',resource_name,
  'record_id',rid,'operation',TG_OP,'status',state,'occurred_at',event_time,
  'participant_user_id',participant_id,'requested_by',requester_id,'branch_id',branch_id
 );
 insert into public.reward_event_outbox(organization_id,event_type,resource_id,payload,occurred_at)
 values(org_id,'smartreward.changed',rid,payload,event_time);
 return new;
end
$$;
revoke all on function public.reward_write_private_outbox() from public,anon,authenticated;

drop trigger if exists reward_program_outbox on public.reward_programs;
create trigger reward_program_outbox after insert or update on public.reward_programs
 for each row execute function public.reward_write_private_outbox();
drop trigger if exists reward_rule_outbox on public.reward_incentive_rules;
create trigger reward_rule_outbox after insert or update on public.reward_incentive_rules
 for each row execute function public.reward_write_private_outbox();
drop trigger if exists reward_catalog_outbox on public.reward_catalog_items;
create trigger reward_catalog_outbox after insert or update on public.reward_catalog_items
 for each row execute function public.reward_write_private_outbox();

commit;
