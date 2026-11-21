begin;

create table public.reward_programs (
 id uuid primary key default gen_random_uuid(),
 organization_id uuid not null references public.organizations(id) on delete restrict,
 code text not null,
 name text not null,
 description text,
 program_type text not null check (program_type in ('loyalty','incentive','campaign')),
 reward_type text not null default 'points' check (reward_type in ('points','tier','voucher')),
 starts_at timestamptz not null,
 ends_at timestamptz not null,
 status text not null default 'draft' check (status in ('draft','active','paused','completed','archived')),
 audience jsonb not null default '{}'::jsonb check (jsonb_typeof(audience)='object'),
 configuration jsonb not null default '{}'::jsonb check (jsonb_typeof(configuration)='object'),
 created_by uuid not null references public.profiles(id),
 updated_by uuid not null references public.profiles(id),
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now(),
 unique (organization_id,code),
 unique (organization_id,id),
 check (ends_at>starts_at)
);

create table public.reward_incentive_rules (
 id uuid primary key default gen_random_uuid(),
 organization_id uuid not null,
 program_id uuid not null,
 code text not null,
 name text not null,
 event_key text not null check (event_key in ('order.completed','visit.completed','target.achieved','manual.approved')),
 priority integer not null default 100,
 rule_config jsonb not null default '{}'::jsonb check (jsonb_typeof(rule_config)='object'),
 points_per_unit numeric(18,4) not null default 0 check (points_per_unit>=0),
 fixed_points bigint not null default 0 check (fixed_points>=0),
 max_points bigint check (max_points is null or max_points>=0),
 requires_approval boolean not null default false,
 status text not null default 'active' check (status in ('active','inactive','archived')),
 created_by uuid not null references public.profiles(id),
 updated_by uuid not null references public.profiles(id),
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now(),
 unique (organization_id,program_id,code),
 unique (organization_id,id),
 foreign key (organization_id,program_id) references public.reward_programs(organization_id,id) on delete restrict
);

create table public.reward_catalog_items (
 id uuid primary key default gen_random_uuid(),
 organization_id uuid not null,
 program_id uuid,
 code text not null,
 name text not null,
 description text,
 category text not null,
 points_cost bigint not null check (points_cost>0),
 quantity_total bigint check (quantity_total is null or quantity_total>=0),
 quantity_reserved bigint not null default 0 check (quantity_reserved>=0),
 quantity_fulfilled bigint not null default 0 check (quantity_fulfilled>=0),
 starts_at timestamptz,
 ends_at timestamptz,
 eligibility jsonb not null default '{}'::jsonb check (jsonb_typeof(eligibility)='object'),
 metadata jsonb not null default '{}'::jsonb check (jsonb_typeof(metadata)='object'),
 status text not null default 'draft' check (status in ('draft','active','paused','out_of_stock','archived')),
 created_by uuid not null references public.profiles(id),
 updated_by uuid not null references public.profiles(id),
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now(),
 unique (organization_id,code),
 unique (organization_id,id),
 foreign key (organization_id,program_id) references public.reward_programs(organization_id,id) on delete restrict,
 check (ends_at is null or starts_at is null or ends_at>starts_at),
 check (quantity_total is null or quantity_reserved+quantity_fulfilled<=quantity_total)
);

create table public.reward_accounts (
 id uuid primary key default gen_random_uuid(),
 organization_id uuid not null references public.organizations(id) on delete restrict,
 participant_user_id uuid not null references public.profiles(id) on delete restrict,
 points_balance bigint not null default 0 check (points_balance>=0),
 status text not null default 'active' check (status in ('active','suspended','closed')),
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now(),
 unique (organization_id,participant_user_id),
 unique (organization_id,id)
);

create table public.reward_points_ledger (
 id uuid primary key default gen_random_uuid(),
 organization_id uuid not null,
 account_id uuid not null,
 participant_user_id uuid not null references public.profiles(id) on delete restrict,
 entry_type text not null check (entry_type in ('earn','debit','redemption','reversal','adjustment','expiration')),
 points_delta bigint not null check (points_delta<>0),
 balance_before bigint not null check (balance_before>=0),
 balance_after bigint not null check (balance_after>=0),
 source_type text not null,
 source_id uuid not null,
 reference_type text,
 reference_id uuid,
 actor_user_id uuid not null references public.profiles(id) on delete restrict,
 idempotency_key text not null check (length(btrim(idempotency_key)) between 8 and 180),
 reason text not null check (length(btrim(reason)) between 3 and 1000),
 occurred_at timestamptz not null default now(),
 metadata jsonb not null default '{}'::jsonb check (jsonb_typeof(metadata)='object'),
 reversal_of uuid references public.reward_points_ledger(id) on delete restrict,
 unique (organization_id,id),
 unique (organization_id,participant_user_id,idempotency_key),
 foreign key (organization_id,account_id) references public.reward_accounts(organization_id,id) on delete restrict,
 check (balance_after=balance_before+points_delta),
 check ((entry_type in ('earn','reversal','adjustment') and points_delta>0) or
        (entry_type in ('debit','redemption','expiration') and points_delta<0)),
 check (reversal_of is null or entry_type in ('reversal','adjustment'))
);

create unique index reward_ledger_one_compensation_per_entry
 on public.reward_points_ledger(reversal_of) where reversal_of is not null;
create index reward_ledger_account_time_idx on public.reward_points_ledger(organization_id,account_id,occurred_at desc,id desc);
create index reward_ledger_source_idx on public.reward_points_ledger(organization_id,source_type,source_id);
create index reward_programs_status_period_idx on public.reward_programs(organization_id,status,starts_at,ends_at);
create index reward_rules_event_idx on public.reward_incentive_rules(organization_id,event_key,status,priority);
create index reward_catalog_status_idx on public.reward_catalog_items(organization_id,status,category);
create index reward_accounts_user_idx on public.reward_accounts(organization_id,participant_user_id,status);

create table public.reward_redemptions (
 id uuid primary key default gen_random_uuid(),
 organization_id uuid not null,
 account_id uuid not null,
 catalog_item_id uuid not null,
 participant_user_id uuid not null references public.profiles(id) on delete restrict,
 quantity integer not null default 1 check (quantity>0),
 points_reserved bigint not null check (points_reserved>0),
 status text not null default 'requested' check (status in ('requested','approved','rejected','cancelled','fulfilling','fulfilled')),
 idempotency_key text not null check (length(btrim(idempotency_key)) between 8 and 180),
 requested_by uuid not null references public.profiles(id),
 decided_by uuid references public.profiles(id),
 fulfilled_by uuid references public.profiles(id),
 fulfillment_reference text,
 reason text,
 requested_at timestamptz not null default now(),
 decided_at timestamptz,
 fulfilled_at timestamptz,
 updated_at timestamptz not null default now(),
 unique (organization_id,id),
 unique (organization_id,participant_user_id,idempotency_key),
 foreign key (organization_id,account_id) references public.reward_accounts(organization_id,id) on delete restrict,
 foreign key (organization_id,catalog_item_id) references public.reward_catalog_items(organization_id,id) on delete restrict
);
create index reward_redemptions_status_idx on public.reward_redemptions(organization_id,status,requested_at desc);
create index reward_redemptions_participant_idx on public.reward_redemptions(organization_id,participant_user_id,requested_at desc);

create table public.reward_redemption_history (
 id uuid primary key default gen_random_uuid(),
 organization_id uuid not null,
 redemption_id uuid not null,
 from_status text,
 to_status text not null,
 actor_user_id uuid not null references public.profiles(id),
 reason text,
 metadata jsonb not null default '{}'::jsonb,
 occurred_at timestamptz not null default now(),
 foreign key (organization_id,redemption_id) references public.reward_redemptions(organization_id,id) on delete restrict
);
create index reward_redemption_history_lookup_idx on public.reward_redemption_history(organization_id,redemption_id,occurred_at);

create table public.reward_audit_events (
 id uuid primary key default gen_random_uuid(),
 organization_id uuid not null references public.organizations(id) on delete restrict,
 actor_user_id uuid not null references public.profiles(id) on delete restrict,
 action text not null,
 resource_type text not null,
 resource_id uuid,
 reason text,
 correlation_id text,
 metadata jsonb not null default '{}'::jsonb,
 occurred_at timestamptz not null default now()
);
create index reward_audit_org_time_idx on public.reward_audit_events(organization_id,occurred_at desc);

create table public.reward_event_outbox (
 id uuid primary key default gen_random_uuid(),
 organization_id uuid not null references public.organizations(id) on delete restrict,
 event_type text not null,
 resource_id uuid not null,
 payload jsonb not null default '{}'::jsonb,
 occurred_at timestamptz not null default now(),
 published_at timestamptz
);
create index reward_outbox_pending_idx on public.reward_event_outbox(occurred_at) where published_at is null;

create or replace function public.reject_reward_ledger_mutation()
returns trigger language plpgsql set search_path=pg_catalog,public as $$
begin
 raise exception 'reward points ledger is append-only' using errcode='55000';
end $$;
create trigger reward_ledger_immutable before update or delete on public.reward_points_ledger
 for each row execute function public.reject_reward_ledger_mutation();
create trigger reward_redemption_history_immutable before update or delete on public.reward_redemption_history
 for each row execute function public.reject_reward_ledger_mutation();
create trigger reward_audit_events_immutable before update or delete on public.reward_audit_events
 for each row execute function public.reject_reward_ledger_mutation();

create or replace function public.reward_emit_private_event()
returns trigger language plpgsql security definer set search_path=pg_catalog,public,realtime as $$
declare org_id uuid; rid uuid; res text; op text;
begin
 if TG_OP='DELETE' then org_id:=old.organization_id; rid:=old.id; op:='DELETE';
 else org_id:=new.organization_id; rid:=new.id; op:=TG_OP; end if;
 res:=TG_TABLE_NAME;
 perform realtime.send(jsonb_build_object('organization_id',org_id,'resource',res,'record_id',rid,
   'operation',op,'occurred_at',now()),'smartreward.changed','tenant:'||org_id::text||':smartreward',true);
 if TG_OP='DELETE' then return old; end if;
 return new;
end $$;
revoke all on function public.reward_emit_private_event() from public,anon,authenticated;
create trigger reward_ledger_private_event after insert on public.reward_points_ledger
 for each row execute function public.reward_emit_private_event();
create trigger reward_redemption_private_event after insert or update on public.reward_redemptions
 for each row execute function public.reward_emit_private_event();

alter table public.reward_programs enable row level security;
alter table public.reward_incentive_rules enable row level security;
alter table public.reward_catalog_items enable row level security;
alter table public.reward_accounts enable row level security;
alter table public.reward_points_ledger enable row level security;
alter table public.reward_redemptions enable row level security;
alter table public.reward_redemption_history enable row level security;
alter table public.reward_audit_events enable row level security;
alter table public.reward_event_outbox enable row level security;

create policy reward_programs_deny_client on public.reward_programs for all to anon,authenticated using (false) with check (false);
create policy reward_rules_deny_client on public.reward_incentive_rules for all to anon,authenticated using (false) with check (false);
create policy reward_catalog_deny_client on public.reward_catalog_items for all to anon,authenticated using (false) with check (false);
create policy reward_accounts_deny_client on public.reward_accounts for all to anon,authenticated using (false) with check (false);
create policy reward_ledger_deny_client on public.reward_points_ledger for all to anon,authenticated using (false) with check (false);
create policy reward_redemptions_deny_client on public.reward_redemptions for all to anon,authenticated using (false) with check (false);
create policy reward_redemption_history_deny_client on public.reward_redemption_history for all to anon,authenticated using (false) with check (false);
create policy reward_audit_deny_client on public.reward_audit_events for all to anon,authenticated using (false) with check (false);
create policy reward_outbox_deny_client on public.reward_event_outbox for all to anon,authenticated using (false) with check (false);

revoke all on public.reward_programs,public.reward_incentive_rules,public.reward_catalog_items,public.reward_accounts,
 public.reward_points_ledger,public.reward_redemptions,public.reward_redemption_history,public.reward_audit_events,
 public.reward_event_outbox from anon,authenticated;
grant select,insert,update on public.reward_programs,public.reward_incentive_rules,public.reward_catalog_items,
 public.reward_accounts,public.reward_redemptions,public.reward_event_outbox to service_role;
grant select,insert on public.reward_points_ledger,public.reward_redemption_history,public.reward_audit_events to service_role;
grant usage,select on all sequences in schema public to service_role;

insert into public.permissions(key,resource,action,description) values
 ('smartreward:program:read','smartreward.program','read','Read reward programs'),
 ('smartreward:program:manage','smartreward.program','manage','Create and manage reward programs'),
 ('smartreward:rule:read','smartreward.rule','read','Read incentive rules'),
 ('smartreward:rule:manage','smartreward.rule','manage','Create and manage incentive rules'),
 ('smartreward:catalog:read','smartreward.catalog','read','Read reward catalog'),
 ('smartreward:catalog:manage','smartreward.catalog','manage','Create and manage reward catalog'),
 ('smartreward:ledger:read','smartreward.ledger','read','Read own or authorized points ledger'),
 ('smartreward:earn:issue','smartreward.ledger','issue','Issue points from verified source activity'),
 ('smartreward:redemption:create','smartreward.redemption','create','Request reward redemption'),
 ('smartreward:redemption:read','smartreward.redemption','read','Read reward redemptions'),
 ('smartreward:redemption:approve','smartreward.redemption','approve','Approve or reject reward redemptions'),
 ('smartreward:redemption:fulfill','smartreward.redemption','fulfill','Fulfill approved reward redemptions'),
 ('smartreward:adjustment:manage','smartreward.ledger','adjust','Issue authorized compensating point entries'),
 ('smartreward:report:read','smartreward.report','read','Read reward and incentive reports')
on conflict(key) do update set description=excluded.description;

insert into public.role_permissions(role_id,permission_key)
select r.id,p.key
from public.roles r cross join public.permissions p
where
 (r.key in ('tenant_owner','company_admin') and p.key like 'smartreward:%')
 or (r.key='supervisor' and p.key in ('smartreward:program:read','smartreward:rule:read','smartreward:catalog:read','smartreward:ledger:read','smartreward:earn:issue','smartreward:redemption:read','smartreward:redemption:approve','smartreward:report:read'))
 or (r.key='sales_rep' and p.key in ('smartreward:program:read','smartreward:catalog:read','smartreward:ledger:read','smartreward:redemption:create','smartreward:redemption:read'))
 or (r.key='customer_user' and p.key in ('smartreward:program:read','smartreward:catalog:read','smartreward:ledger:read','smartreward:redemption:create','smartreward:redemption:read'))
 or (r.key='distributor_user' and p.key in ('smartreward:program:read','smartreward:rule:read','smartreward:catalog:read','smartreward:ledger:read','smartreward:redemption:read','smartreward:report:read'))
 or (r.key='principal_user' and p.key in ('smartreward:program:read','smartreward:program:manage','smartreward:rule:read','smartreward:rule:manage','smartreward:catalog:read','smartreward:catalog:manage','smartreward:ledger:read','smartreward:earn:issue','smartreward:redemption:read','smartreward:redemption:approve','smartreward:redemption:fulfill','smartreward:adjustment:manage','smartreward:report:read'))
on conflict(role_id,permission_key) do nothing;

drop policy if exists smartreward_private_read on realtime.messages;
create policy smartreward_private_read on realtime.messages for select to authenticated
 using (
  extension='broadcast'
  and realtime.topic() ~ '^tenant:[0-9a-fA-F-]{36}:smartreward$'
  and exists (
   select 1 from public.organization_memberships m
   join public.user_role_assignments ura on ura.membership_id=m.id
    and ura.scope_type in ('tenant','branch') and ura.revoked_at is null
    and ura.starts_at<=now() and (ura.expires_at is null or ura.expires_at>now())
   join public.role_permissions rp on rp.role_id=ura.role_id
   where m.user_id=(select auth.uid()) and m.status='active'
    and m.organization_id=split_part(realtime.topic(),':',2)::uuid
    and rp.permission_key in ('smartreward:ledger:read','smartreward:redemption:read','smartreward:report:read')
  )
 );

commit;
