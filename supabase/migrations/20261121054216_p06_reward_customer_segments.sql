begin;

create table public.reward_customer_segments (
 id uuid primary key default gen_random_uuid(),
 organization_id uuid not null references public.organizations(id) on delete restrict,
 code text not null,
 name text not null,
 description text,
 status text not null default 'draft' check (status in ('draft','active','paused','archived')),
 membership_mode text not null default 'hybrid' check (membership_mode in ('manual','rule_based','hybrid')),
 criteria jsonb not null default '{}'::jsonb check (jsonb_typeof(criteria)='object'),
 starts_at timestamptz,
 ends_at timestamptz,
 created_by uuid not null references public.profiles(id) on delete restrict,
 updated_by uuid not null references public.profiles(id) on delete restrict,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now(),
 unique (organization_id,code),
 unique (organization_id,id),
 check (ends_at is null or starts_at is null or ends_at>starts_at)
);
create index reward_customer_segments_status_idx
 on public.reward_customer_segments(organization_id,status,starts_at,ends_at);

create table public.reward_customer_segment_members (
 id uuid primary key default gen_random_uuid(),
 organization_id uuid not null,
 segment_id uuid not null,
 participant_user_id uuid not null references public.profiles(id) on delete restrict,
 membership_source text not null default 'manual' check (membership_source in ('manual','rule','import')),
 status text not null default 'active' check (status in ('active','inactive','removed')),
 matched_criteria jsonb not null default '{}'::jsonb check (jsonb_typeof(matched_criteria)='object'),
 joined_at timestamptz not null default now(),
 expires_at timestamptz,
 updated_at timestamptz not null default now(),
 unique (organization_id,segment_id,participant_user_id),
 unique (organization_id,id),
 foreign key (organization_id,segment_id)
   references public.reward_customer_segments(organization_id,id) on delete restrict,
 check (expires_at is null or expires_at>joined_at)
);
create index reward_segment_members_user_idx
 on public.reward_customer_segment_members(organization_id,participant_user_id,status);
create index reward_segment_members_segment_idx
 on public.reward_customer_segment_members(organization_id,segment_id,status,joined_at desc);

alter table public.reward_programs
 add column customer_segment_id uuid;
alter table public.reward_programs
 add constraint reward_program_segment_fk
 foreign key (organization_id,customer_segment_id)
 references public.reward_customer_segments(organization_id,id) on delete restrict;
alter table public.reward_incentive_rules
 add column customer_segment_id uuid;
alter table public.reward_incentive_rules
 add constraint reward_rule_segment_fk
 foreign key (organization_id,customer_segment_id)
 references public.reward_customer_segments(organization_id,id) on delete restrict;
alter table public.reward_catalog_items
 add column customer_segment_id uuid;
alter table public.reward_catalog_items
 add constraint reward_catalog_segment_fk
 foreign key (organization_id,customer_segment_id)
 references public.reward_customer_segments(organization_id,id) on delete restrict;

create index reward_program_segment_idx on public.reward_programs(organization_id,customer_segment_id);
create index reward_rule_segment_idx on public.reward_incentive_rules(organization_id,customer_segment_id);
create index reward_catalog_segment_idx on public.reward_catalog_items(organization_id,customer_segment_id);

alter table public.reward_customer_segments enable row level security;
alter table public.reward_customer_segment_members enable row level security;
create policy reward_customer_segments_deny_client
 on public.reward_customer_segments for all to anon,authenticated using(false) with check(false);
create policy reward_customer_segment_members_deny_client
 on public.reward_customer_segment_members for all to anon,authenticated using(false) with check(false);
revoke all on public.reward_customer_segments,public.reward_customer_segment_members from anon,authenticated;
grant select,insert,update on public.reward_customer_segments,public.reward_customer_segment_members to service_role;

create trigger reward_customer_segments_private_event
 after insert or update on public.reward_customer_segments
 for each row execute function public.reward_emit_private_event();
create trigger reward_customer_segment_members_private_event
 after insert or update on public.reward_customer_segment_members
 for each row execute function public.reward_emit_private_event();

insert into public.permissions(key,resource,action,description) values
 ('smartreward:segment:read','smartreward.customer_segment','read','Read customer segments and membership'),
 ('smartreward:segment:manage','smartreward.customer_segment','manage','Create and manage customer segments and membership')
on conflict(key) do update set description=excluded.description;

insert into public.role_permissions(role_id,permission_key)
select r.id,p.key from public.roles r cross join public.permissions p
where (r.key in ('tenant_owner','company_admin','principal_user') and p.key in ('smartreward:segment:read','smartreward:segment:manage'))
   or (r.key in ('supervisor','distributor_user') and p.key='smartreward:segment:read')
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
    and rp.permission_key in ('smartreward:ledger:read','smartreward:redemption:read','smartreward:report:read','smartreward:segment:read')
  )
 );

commit;
