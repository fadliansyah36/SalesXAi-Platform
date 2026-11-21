begin;
alter table public.reward_points_ledger add column if not exists expires_at timestamptz;
create index if not exists reward_ledger_expiry_due_idx on public.reward_points_ledger(expires_at,organization_id) where entry_type='earn' and expires_at is not null;
create table if not exists public.reward_point_lots (
 id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id) on delete restrict,
 account_id uuid not null references public.reward_accounts(id) on delete restrict, participant_user_id uuid not null references public.profiles(id) on delete restrict,
 source_ledger_entry_id uuid not null unique references public.reward_points_ledger(id) on delete restrict,
 points_issued bigint not null check(points_issued>0), points_remaining bigint not null check(points_remaining>=0 and points_remaining<=points_issued),
 expires_at timestamptz, created_at timestamptz not null default now()
);
create index if not exists reward_point_lots_available_idx on public.reward_point_lots(account_id,expires_at,created_at) where points_remaining>0;
create table if not exists public.reward_point_lot_allocations (
 id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id) on delete restrict,
 ledger_entry_id uuid not null references public.reward_points_ledger(id) on delete restrict, lot_id uuid not null references public.reward_point_lots(id) on delete restrict,
 points_allocated bigint not null check(points_allocated<>0), created_at timestamptz not null default now(), unique(ledger_entry_id,lot_id)
);
create index if not exists reward_lot_allocations_lot_idx on public.reward_point_lot_allocations(lot_id,created_at);
create table if not exists public.reward_approval_requests (
 id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id) on delete restrict,
 request_type text not null check(request_type in ('manual_earning','rule_earning','redemption_override')),
 participant_user_id uuid not null references public.profiles(id) on delete restrict,
 program_id uuid references public.reward_programs(id) on delete restrict, rule_id uuid references public.reward_incentive_rules(id) on delete restrict,
 source_type text, source_id uuid, points_requested bigint not null check(points_requested>0),
 metric_value numeric(18,4) not null default 1 check(metric_value>=0), requested_by uuid not null references public.profiles(id) on delete restrict,
 idempotency_key text not null, status text not null default 'pending' check(status in ('pending','approved','rejected','cancelled')),
 request_reason text not null, decision_reason text, decided_by uuid references public.profiles(id) on delete restrict,
 decided_at timestamptz, ledger_entry_id uuid references public.reward_points_ledger(id) on delete restrict,
 metadata jsonb not null default '{}'::jsonb check(jsonb_typeof(metadata)='object'), created_at timestamptz not null default now(),
 updated_at timestamptz not null default now(), unique(organization_id,requested_by,idempotency_key),
 check((status='pending' and decided_at is null and decided_by is null) or (status<>'pending' and decided_at is not null and decided_by is not null))
);
create index if not exists reward_approval_inbox_idx on public.reward_approval_requests(organization_id,status,created_at desc);
create index if not exists reward_approval_participant_idx on public.reward_approval_requests(organization_id,participant_user_id,created_at desc);
create table if not exists public.reward_approval_history (
 id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id) on delete restrict,
 approval_request_id uuid not null references public.reward_approval_requests(id) on delete restrict,
 from_status text, to_status text not null, actor_user_id uuid not null references public.profiles(id) on delete restrict,
 reason text not null, occurred_at timestamptz not null default now()
);
create index if not exists reward_approval_history_request_idx on public.reward_approval_history(approval_request_id,occurred_at);

create or replace function public.reward_set_ledger_expiry()
returns trigger language plpgsql set search_path=pg_catalog,public as $$
declare days integer; rule_cfg jsonb; program_cfg jsonb; pid uuid; rid uuid;
begin
 if new.entry_type<>'earn' or new.expires_at is not null then return new; end if;
 begin rid:=(new.metadata->>'rule_id')::uuid; exception when others then rid:=null; end;
 begin pid:=(new.metadata->>'program_id')::uuid; exception when others then pid:=null; end;
 if rid is not null then select rule_config into rule_cfg from public.reward_incentive_rules where id=rid and organization_id=new.organization_id; end if;
 if pid is not null then select configuration into program_cfg from public.reward_programs where id=pid and organization_id=new.organization_id; end if;
 days:=coalesce(nullif(rule_cfg->>'expiration_days','')::integer,nullif(program_cfg->>'expiration_days','')::integer);
 if days is not null and days>0 then new.expires_at:=now()+make_interval(days=>days); end if;
 return new;
end $$;
drop trigger if exists reward_ledger_set_expiry on public.reward_points_ledger;
create trigger reward_ledger_set_expiry before insert on public.reward_points_ledger for each row execute function public.reward_set_ledger_expiry();

create or replace function public.reward_track_point_lots()
returns trigger language plpgsql set search_path=pg_catalog,public as $$
declare remaining bigint; take_points bigint; lot record; original_delta bigint;
begin
 if new.entry_type='expiration' then return new; end if;
 if new.entry_type='reversal' and new.reversal_of is not null then
  select points_delta into original_delta from public.reward_points_ledger where id=new.reversal_of;
  if original_delta<0 and new.points_delta>0 then
   for lot in select a.lot_id,a.points_allocated from public.reward_point_lot_allocations a where a.ledger_entry_id=new.reversal_of and a.points_allocated>0 loop
    update public.reward_point_lots set points_remaining=least(points_issued,points_remaining+lot.points_allocated) where id=lot.lot_id;
    insert into public.reward_point_lot_allocations(organization_id,ledger_entry_id,lot_id,points_allocated) values(new.organization_id,new.id,lot.lot_id,-lot.points_allocated);
   end loop;
   return new;
  elsif original_delta>0 and new.points_delta<0 then
   update public.reward_point_lots set points_remaining=points_remaining+new.points_delta where source_ledger_entry_id=new.reversal_of and points_remaining>=-new.points_delta;
   if not found then raise exception 'reversal exceeds unspent points from original earning' using errcode='23514'; end if;
   insert into public.reward_point_lot_allocations(organization_id,ledger_entry_id,lot_id,points_allocated)
    select new.organization_id,new.id,id,-new.points_delta from public.reward_point_lots where source_ledger_entry_id=new.reversal_of;
   return new;
  end if;
 end if;
 if new.points_delta>0 then
  insert into public.reward_point_lots(organization_id,account_id,participant_user_id,source_ledger_entry_id,points_issued,points_remaining,expires_at)
  values(new.organization_id,new.account_id,new.participant_user_id,new.id,new.points_delta,new.points_delta,new.expires_at);
  return new;
 end if;
 remaining:=-new.points_delta;
 for lot in select id,points_remaining from public.reward_point_lots where account_id=new.account_id and points_remaining>0 and (expires_at is null or expires_at>now())
  order by expires_at asc nulls last,created_at,id for update
 loop
  exit when remaining=0; take_points:=least(remaining,lot.points_remaining);
  update public.reward_point_lots set points_remaining=points_remaining-take_points where id=lot.id;
  insert into public.reward_point_lot_allocations(organization_id,ledger_entry_id,lot_id,points_allocated) values(new.organization_id,new.id,lot.id,take_points);
  remaining:=remaining-take_points;
 end loop;
 if remaining>0 then raise exception 'insufficient unexpired reward point lots' using errcode='23514'; end if;
 return new;
end $$;
drop trigger if exists reward_ledger_track_lots on public.reward_points_ledger;
create trigger reward_ledger_track_lots after insert on public.reward_points_ledger for each row execute function public.reward_track_point_lots();

create or replace function public.process_reward_expirations(p_limit integer default 500)
returns integer language plpgsql security definer set search_path=pg_catalog,public as $$
declare lot record; account_row record; expired bigint; processed integer:=0; key text;
begin
 for lot in select * from public.reward_point_lots where expires_at is not null and expires_at<=now() and points_remaining>0 order by expires_at,created_at for update skip locked limit greatest(1,least(p_limit,5000))
 loop
  select * into account_row from public.reward_accounts where id=lot.account_id and organization_id=lot.organization_id for update;
  expired:=lot.points_remaining; if expired<=0 then continue; end if;
  if account_row.points_balance<expired then raise exception 'reward balance projection is below unexpired lot balance for account %',lot.account_id using errcode='23514'; end if;
  update public.reward_point_lots set points_remaining=0 where id=lot.id; key:='expire:'||lot.id::text;
  insert into public.reward_points_ledger(organization_id,account_id,participant_user_id,entry_type,points_delta,balance_before,balance_after,source_type,source_id,reference_type,reference_id,actor_user_id,idempotency_key,reason,metadata)
  values(lot.organization_id,lot.account_id,lot.participant_user_id,'expiration',-expired,account_row.points_balance,account_row.points_balance-expired,'reward_point_lot',lot.id,'reward_point_lot',lot.id,lot.participant_user_id,key,'Reward points expired',jsonb_build_object('lot_id',lot.id,'expired_points',expired));
  update public.reward_accounts set points_balance=points_balance-expired,updated_at=now() where id=lot.account_id;
  insert into public.reward_event_outbox(organization_id,event_type,resource_id,payload) values(lot.organization_id,'reward.points.expired',lot.id,jsonb_build_object('account_id',lot.account_id,'participant_user_id',lot.participant_user_id,'expired_points',expired));
  processed:=processed+1;
 end loop; return processed;
end $$;
revoke all on function public.process_reward_expirations(integer) from public,anon,authenticated;
grant execute on function public.process_reward_expirations(integer) to service_role;

create or replace function public.reward_approval_private_event()
returns trigger language plpgsql security definer set search_path=pg_catalog,public,realtime as $$
begin
 perform realtime.send(jsonb_build_object('organization_id',new.organization_id,'resource','reward_approval_requests','record_id',new.id,'operation',TG_OP,'status',new.status,'occurred_at',now()),'smartreward.changed','tenant:'||new.organization_id::text||':smartreward',true);
 return new;
end $$;
revoke all on function public.reward_approval_private_event() from public,anon,authenticated;
drop trigger if exists reward_approval_private_event on public.reward_approval_requests;
create trigger reward_approval_private_event after insert or update on public.reward_approval_requests for each row execute function public.reward_approval_private_event();

alter table public.reward_point_lots enable row level security;
alter table public.reward_point_lot_allocations enable row level security;
alter table public.reward_approval_requests enable row level security;
alter table public.reward_approval_history enable row level security;
drop policy if exists reward_point_lots_deny_client on public.reward_point_lots;
drop policy if exists reward_lot_allocations_deny_client on public.reward_point_lot_allocations;
drop policy if exists reward_approval_requests_deny_client on public.reward_approval_requests;
drop policy if exists reward_approval_history_deny_client on public.reward_approval_history;
create policy reward_point_lots_deny_client on public.reward_point_lots for all to anon,authenticated using(false) with check(false);
create policy reward_lot_allocations_deny_client on public.reward_point_lot_allocations for all to anon,authenticated using(false) with check(false);
create policy reward_approval_requests_deny_client on public.reward_approval_requests for all to anon,authenticated using(false) with check(false);
create policy reward_approval_history_deny_client on public.reward_approval_history for all to anon,authenticated using(false) with check(false);
revoke all on public.reward_point_lots,public.reward_point_lot_allocations,public.reward_approval_requests,public.reward_approval_history from anon,authenticated;
grant select,insert,update on public.reward_point_lots to service_role;
grant select,insert on public.reward_point_lot_allocations,public.reward_approval_history to service_role;
grant select,insert,update on public.reward_approval_requests to service_role;

insert into public.permissions(key,resource,action,description) values
 ('smartreward:approval:read','smartreward.approval','read','Read reward approval inbox and history'),
 ('smartreward:approval:request','smartreward.approval','request','Request reward or manual earning approval'),
 ('smartreward:approval:decide','smartreward.approval','decide','Approve or reject reward requests')
on conflict(key) do update set description=excluded.description;
insert into public.role_permissions(role_id,permission_key)
select r.id,p.key from public.roles r cross join public.permissions p
where (r.key in ('tenant_owner','company_admin','principal_user') and p.key in ('smartreward:approval:read','smartreward:approval:decide','smartreward:approval:request'))
 or (r.key='supervisor' and p.key in ('smartreward:approval:read','smartreward:approval:decide','smartreward:approval:request'))
 or (r.key in ('sales_rep','customer_user') and p.key='smartreward:approval:request')
on conflict(role_id,permission_key) do nothing;

drop policy if exists smartreward_private_read on realtime.messages;
create policy smartreward_private_read on realtime.messages for select to authenticated using (
 extension='broadcast' and realtime.topic() ~ '^tenant:[0-9a-fA-F-]{36}:smartreward$'
 and exists (
  select 1 from public.organization_memberships m
  join public.user_role_assignments ura on ura.membership_id=m.id and ura.scope_type in ('tenant','branch') and ura.revoked_at is null and ura.starts_at<=now() and (ura.expires_at is null or ura.expires_at>now())
  join public.role_permissions rp on rp.role_id=ura.role_id
  where m.user_id=(select auth.uid()) and m.status='active' and m.organization_id=split_part(realtime.topic(),':',2)::uuid
   and rp.permission_key in ('smartreward:ledger:read','smartreward:redemption:read','smartreward:report:read','smartreward:approval:read')
 )
);
do $$
begin
 begin execute 'create extension if not exists pg_cron'; exception when others then raise notice 'pg_cron is not enabled; expiration processing remains callable by the application service'; end;
 if to_regnamespace('cron') is not null then
  begin
   execute 'select cron.unschedule(jobid) from cron.job where jobname = ''salesx_reward_expiration''';
   execute 'select cron.schedule(''salesx_reward_expiration'',''10 0 * * *'',''select public.process_reward_expirations(1000)'')';
  exception when others then raise notice 'pg_cron scheduling unavailable; expiration processing remains callable by the application service'; end;
 end if;
end $$;
commit;