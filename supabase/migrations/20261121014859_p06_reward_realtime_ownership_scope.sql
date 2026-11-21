begin;
create or replace function public.reward_emit_private_event()
returns trigger language plpgsql security definer set search_path=pg_catalog,public,realtime as $$
declare org_id uuid; rid uuid; res text; op text; participant_id uuid; requester_id uuid; branch_id uuid; payload jsonb;
begin
 if TG_OP='DELETE' then org_id:=old.organization_id; rid:=old.id; op:='DELETE'; participant_id:=old.participant_user_id;
 else org_id:=new.organization_id; rid:=new.id; op:=TG_OP; participant_id:=new.participant_user_id; end if;
 res:=TG_TABLE_NAME;
 begin requester_id:=(to_jsonb(new)->>'requested_by')::uuid; exception when others then requester_id:=null; end;
 select m.branch_id into branch_id from public.organization_memberships m where m.organization_id=org_id and m.user_id=participant_id and m.status='active' limit 1;
 payload:=jsonb_build_object('event_id',gen_random_uuid(),'organization_id',org_id,'resource',res,'record_id',rid,'operation',op,'status',to_jsonb(new)->>'status','occurred_at',now());
 if participant_id is not null then perform realtime.send(payload,'smartreward.changed','tenant:'||org_id::text||':user:'||participant_id::text||':smartreward',true); end if;
 if requester_id is not null and requester_id is distinct from participant_id then perform realtime.send(payload,'smartreward.changed','tenant:'||org_id::text||':user:'||requester_id::text||':smartreward',true); end if;
 if branch_id is not null then perform realtime.send(payload,'smartreward.changed','tenant:'||org_id::text||':branch:'||branch_id::text||':smartreward',true); end if;
 perform realtime.send(payload,'smartreward.changed','tenant:'||org_id::text||':smartreward',true);
 if TG_OP='DELETE' then return old; end if; return new;
end $$;
revoke all on function public.reward_emit_private_event() from public,anon,authenticated;
drop trigger if exists reward_approval_private_event on public.reward_approval_requests;
create trigger reward_approval_private_event after insert or update on public.reward_approval_requests for each row execute function public.reward_emit_private_event();

create or replace function public.reward_write_private_outbox()
returns trigger language plpgsql security definer set search_path=pg_catalog,public as $$
declare org_id uuid; rid uuid; resource_name text; state text; event_time timestamptz:=now(); event_key uuid:=gen_random_uuid(); participant_id uuid; requester_id uuid; branch_id uuid;
begin
 org_id:=new.organization_id; rid:=new.id; resource_name:=TG_TABLE_NAME; state:=to_jsonb(new)->>'status';
 begin participant_id:=(to_jsonb(new)->>'participant_user_id')::uuid; exception when others then participant_id:=null; end;
 begin requester_id:=(to_jsonb(new)->>'requested_by')::uuid; exception when others then requester_id:=null; end;
 if participant_id is not null then select m.branch_id into branch_id from public.organization_memberships m where m.organization_id=org_id and m.user_id=participant_id and m.status='active' limit 1; end if;
 insert into public.reward_event_outbox(organization_id,event_type,resource_id,payload,occurred_at)
 values(org_id,'smartreward.changed',rid,jsonb_build_object('event_id',event_key,'organization_id',org_id,'resource',resource_name,'record_id',rid,'operation',TG_OP,'status',state,'occurred_at',event_time,'participant_user_id',participant_id,'requested_by',requester_id,'branch_id',branch_id),event_time);
 return new;
end $$;
revoke all on function public.reward_write_private_outbox() from public,anon,authenticated;

drop policy if exists smartreward_private_read on realtime.messages;
create policy smartreward_private_read on realtime.messages for select to authenticated using (
 extension='broadcast' and (
  (realtime.topic() ~ '^tenant:[0-9a-fA-F-]{36}:user:[0-9a-fA-F-]{36}:smartreward$'
   and split_part(realtime.topic(),':',4)::uuid=(select auth.uid())
   and exists (select 1 from public.organization_memberships m
    join public.user_role_assignments ura on ura.membership_id=m.id and ura.revoked_at is null and ura.starts_at<=now() and (ura.expires_at is null or ura.expires_at>now())
    join public.role_permissions rp on rp.role_id=ura.role_id where m.user_id=(select auth.uid()) and m.status='active'
     and m.organization_id=split_part(realtime.topic(),':',2)::uuid
     and rp.permission_key in ('smartreward:ledger:read','smartreward:redemption:read','smartreward:approval:read')))
  or
  (realtime.topic() ~ '^tenant:[0-9a-fA-F-]{36}:branch:[0-9a-fA-F-]{36}:smartreward$'
   and exists (select 1 from public.organization_memberships m
    join public.user_role_assignments ura on ura.membership_id=m.id and ura.scope_type='branch' and ura.scope_id=split_part(realtime.topic(),':',4)::uuid
     and ura.revoked_at is null and ura.starts_at<=now() and (ura.expires_at is null or ura.expires_at>now())
    join public.roles r on r.id=ura.role_id and r.key='supervisor'
    join public.role_permissions rp on rp.role_id=ura.role_id where m.user_id=(select auth.uid()) and m.status='active'
     and m.organization_id=split_part(realtime.topic(),':',2)::uuid
     and rp.permission_key in ('smartreward:ledger:read','smartreward:redemption:read','smartreward:approval:read')))
  or
  (realtime.topic() ~ '^tenant:[0-9a-fA-F-]{36}:smartreward$'
   and exists (select 1 from public.organization_memberships m
    join public.user_role_assignments ura on ura.membership_id=m.id and ura.scope_type='tenant'
     and ura.revoked_at is null and ura.starts_at<=now() and (ura.expires_at is null or ura.expires_at>now())
    join public.roles r on r.id=ura.role_id and r.key in ('tenant_owner','company_admin','principal_user','distributor_user')
    join public.role_permissions rp on rp.role_id=ura.role_id where m.user_id=(select auth.uid()) and m.status='active'
     and m.organization_id=split_part(realtime.topic(),':',2)::uuid
     and rp.permission_key in ('smartreward:ledger:read','smartreward:redemption:read','smartreward:report:read','smartreward:approval:read')))
 )
);
commit;