-- Phase 06 security hardening: stop publishing SmartReward events to the
-- legacy tenant-wide topic while realtime.messages still has its broad legacy policy.
-- Tenant-level consumers continue through the permission-checked FastAPI SSE outbox.
-- Participant and branch topics remain emitted for activation after owner policy approval.
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
  begin
    participant_id:=nullif(row_data->>'participant_user_id','')::uuid;
  exception when others then
    participant_id:=null;
  end;
  begin
    requester_id:=nullif(row_data->>'requested_by','')::uuid;
  exception when others then
    requester_id:=null;
  end;

  if participant_id is not null then
    select m.branch_id into branch_id
    from public.organization_memberships m
    where m.organization_id=org_id and m.user_id=participant_id and m.status='active'
    limit 1;
  end if;

  payload:=jsonb_build_object(
    'event_id',gen_random_uuid(),
    'organization_id',org_id,
    'resource',TG_TABLE_NAME,
    'record_id',record_id,
    'operation',operation_name,
    'status',row_data->>'status',
    'occurred_at',now(),
    'participant_user_id',participant_id,
    'requested_by',requester_id,
    'branch_id',branch_id
  );

  if participant_id is not null then
    perform realtime.send(
      payload,'smartreward.changed',
      'tenant:'||org_id::text||':user:'||participant_id::text||':smartreward',true
    );
  end if;

  if requester_id is not null and requester_id is distinct from participant_id then
    perform realtime.send(
      payload,'smartreward.changed',
      'tenant:'||org_id::text||':user:'||requester_id::text||':smartreward',true
    );
  end if;

  if branch_id is not null then
    perform realtime.send(
      payload,'smartreward.changed',
      'tenant:'||org_id::text||':branch:'||branch_id::text||':smartreward',true
    );
  end if;

  -- Intentionally no tenant-wide Broadcast topic until owner-scoped policy is active.
  if TG_OP='DELETE' then return old; end if;
  return new;
end;
$$;

revoke all on function public.reward_emit_private_event() from public,anon,authenticated;
