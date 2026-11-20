-- Phase 04 SmartTeam: tenant-scoped attendance, visits, activities and targets.
create table if not exists public.smartteam_shifts (
 id uuid primary key default gen_random_uuid(),
 organization_id uuid not null references public.organizations(id) on delete restrict,
 sales_profile_id uuid not null,
 user_id uuid not null references public.profiles(id) on delete restrict,
 branch_id uuid,
 team_id uuid,
 shift_date date not null,
 status text not null default 'scheduled' check (status in ('scheduled','active','completed','cancelled')),
 scheduled_start timestamptz,
 scheduled_end timestamptz,
 clock_in_at timestamptz,
 clock_out_at timestamptz,
 clock_in_latitude double precision,
 clock_in_longitude double precision,
 clock_in_accuracy_m double precision,
 clock_in_source text,
 clock_out_latitude double precision,
 clock_out_longitude double precision,
 clock_out_accuracy_m double precision,
 clock_out_source text,
 correction_reason text,
 corrected_by uuid references public.profiles(id),
 corrected_at timestamptz,
 idempotency_key text not null,
 created_by uuid not null references public.profiles(id),
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now(),
 unique (organization_id,id),
 unique (organization_id,user_id,shift_date),
 unique (organization_id,idempotency_key),
 constraint smartteam_shift_sales_profile_fk foreign key (organization_id,sales_profile_id) references public.sales_profiles(organization_id,id),
 constraint smartteam_shift_branch_fk foreign key (organization_id,branch_id) references public.branches(organization_id,id),
 constraint smartteam_shift_team_fk foreign key (organization_id,team_id) references public.teams(organization_id,id),
 constraint smartteam_shift_clock_range check (clock_out_at is null or clock_in_at is not null and clock_out_at >= clock_in_at),
 constraint smartteam_shift_latitude check ((clock_in_latitude is null or clock_in_latitude between -90 and 90) and (clock_out_latitude is null or clock_out_latitude between -90 and 90)),
 constraint smartteam_shift_longitude check ((clock_in_longitude is null or clock_in_longitude between -180 and 180) and (clock_out_longitude is null or clock_out_longitude between -180 and 180)),
 constraint smartteam_shift_accuracy check ((clock_in_accuracy_m is null or clock_in_accuracy_m >= 0) and (clock_out_accuracy_m is null or clock_out_accuracy_m >= 0))
);

create table if not exists public.smartteam_visits (
 id uuid primary key default gen_random_uuid(),
 organization_id uuid not null references public.organizations(id) on delete restrict,
 sales_profile_id uuid not null,
 outlet_id uuid not null,
 branch_id uuid,
 team_id uuid,
 assigned_by uuid not null references public.profiles(id),
 scheduled_at timestamptz not null,
 window_end_at timestamptz,
 status text not null default 'scheduled' check (status in ('scheduled','assigned','in_progress','completed','cancelled','missed')),
 outcome text check (outcome is null or outcome in ('productive','not_productive','order_taken','follow_up','closed','no_contact')),
 notes text,
 check_in_at timestamptz,
 check_out_at timestamptz,
 check_in_latitude double precision,
 check_in_longitude double precision,
 check_in_accuracy_m double precision,
 check_in_source text,
 check_out_latitude double precision,
 check_out_longitude double precision,
 check_out_accuracy_m double precision,
 check_out_source text,
 cancel_reason text,
 idempotency_key text not null,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now(),
 unique (organization_id,id),
 unique (organization_id,idempotency_key),
 constraint smartteam_visit_sales_profile_fk foreign key (organization_id,sales_profile_id) references public.sales_profiles(organization_id,id),
 constraint smartteam_visit_outlet_fk foreign key (organization_id,outlet_id) references public.outlets(organization_id,id),
 constraint smartteam_visit_branch_fk foreign key (organization_id,branch_id) references public.branches(organization_id,id),
 constraint smartteam_visit_team_fk foreign key (organization_id,team_id) references public.teams(organization_id,id),
 constraint smartteam_visit_window check (window_end_at is null or window_end_at >= scheduled_at),
 constraint smartteam_visit_check_range check (check_out_at is null or check_in_at is not null and check_out_at >= check_in_at),
 constraint smartteam_visit_latitude check ((check_in_latitude is null or check_in_latitude between -90 and 90) and (check_out_latitude is null or check_out_latitude between -90 and 90)),
 constraint smartteam_visit_longitude check ((check_in_longitude is null or check_in_longitude between -180 and 180) and (check_out_longitude is null or check_out_longitude between -180 and 180)),
 constraint smartteam_visit_accuracy check ((check_in_accuracy_m is null or check_in_accuracy_m >= 0) and (check_out_accuracy_m is null or check_out_accuracy_m >= 0))
);

create table if not exists public.smartteam_visit_events (
 id uuid primary key default gen_random_uuid(),
 organization_id uuid not null,
 visit_id uuid not null,
 actor_user_id uuid not null references public.profiles(id),
 event_type text not null check (event_type in ('created','assigned','updated','checked_in','checked_out','cancelled','outcome_recorded','corrected')),
 from_status text,
 to_status text,
 reason text,
 metadata jsonb not null default '{}'::jsonb check (jsonb_typeof(metadata)='object'),
 occurred_at timestamptz not null default now(),
 constraint smartteam_visit_event_visit_fk foreign key (organization_id,visit_id) references public.smartteam_visits(organization_id,id) on delete restrict
);

create table if not exists public.smartteam_activities (
 id uuid primary key default gen_random_uuid(),
 organization_id uuid not null references public.organizations(id) on delete restrict,
 sales_profile_id uuid not null,
 visit_id uuid,
 created_by uuid not null references public.profiles(id),
 activity_type text not null check (activity_type in ('call','meeting','follow_up','prospecting','report','other')),
 title text not null check (length(trim(title)) between 2 and 180),
 description text,
 due_at timestamptz,
 completed_at timestamptz,
 status text not null default 'open' check (status in ('open','in_progress','completed','cancelled')),
 idempotency_key text not null,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now(),
 unique (organization_id,id),
 unique (organization_id,idempotency_key),
 constraint smartteam_activity_sales_profile_fk foreign key (organization_id,sales_profile_id) references public.sales_profiles(organization_id,id),
 constraint smartteam_activity_visit_fk foreign key (organization_id,visit_id) references public.smartteam_visits(organization_id,id)
);

create table if not exists public.smartteam_targets (
 id uuid primary key default gen_random_uuid(),
 organization_id uuid not null references public.organizations(id) on delete restrict,
 sales_profile_id uuid,
 team_id uuid,
 branch_id uuid,
 metric_key text not null check (metric_key in ('visits','productive_visits','activities','orders','sales_value')),
 period_start date not null,
 period_end date not null,
 target_value numeric(18,2) not null check (target_value >= 0),
 created_by uuid not null references public.profiles(id),
 updated_by uuid not null references public.profiles(id),
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now(),
 unique (organization_id,id),
 constraint smartteam_target_scope check (num_nonnulls(sales_profile_id,team_id,branch_id)=1),
 constraint smartteam_target_period check (period_end >= period_start),
 constraint smartteam_target_sales_profile_fk foreign key (organization_id,sales_profile_id) references public.sales_profiles(organization_id,id),
 constraint smartteam_target_team_fk foreign key (organization_id,team_id) references public.teams(organization_id,id),
 constraint smartteam_target_branch_fk foreign key (organization_id,branch_id) references public.branches(organization_id,id)
);

create table if not exists public.smartteam_visit_evidence (
 id uuid primary key default gen_random_uuid(),
 organization_id uuid not null references public.organizations(id) on delete restrict,
 visit_id uuid not null,
 uploaded_by uuid not null references public.profiles(id),
 storage_path text not null,
 mime_type text not null check (mime_type in ('image/jpeg','image/png','application/pdf')),
 size_bytes bigint not null check (size_bytes between 1 and 10485760),
 sha256 text not null check (sha256 ~ '^[0-9a-f]{64}$'),
 created_at timestamptz not null default now(),
 constraint smartteam_evidence_visit_fk foreign key (organization_id,visit_id) references public.smartteam_visits(organization_id,id) on delete restrict,
 unique (organization_id,storage_path)
);

create index if not exists smartteam_shifts_org_date_idx on public.smartteam_shifts(organization_id,shift_date desc,status);
create index if not exists smartteam_shifts_user_date_idx on public.smartteam_shifts(organization_id,user_id,shift_date desc);
create index if not exists smartteam_visits_org_schedule_idx on public.smartteam_visits(organization_id,scheduled_at,status);
create index if not exists smartteam_visits_sales_schedule_idx on public.smartteam_visits(organization_id,sales_profile_id,scheduled_at desc);
create index if not exists smartteam_visits_outlet_schedule_idx on public.smartteam_visits(organization_id,outlet_id,scheduled_at desc);
create index if not exists smartteam_visit_events_visit_idx on public.smartteam_visit_events(organization_id,visit_id,occurred_at desc);
create index if not exists smartteam_activities_sales_due_idx on public.smartteam_activities(organization_id,sales_profile_id,due_at,status);
create index if not exists smartteam_targets_scope_period_idx on public.smartteam_targets(organization_id,period_start,period_end,metric_key);

alter table public.smartteam_shifts enable row level security;
alter table public.smartteam_visits enable row level security;
alter table public.smartteam_visit_events enable row level security;
alter table public.smartteam_activities enable row level security;
alter table public.smartteam_targets enable row level security;
alter table public.smartteam_visit_evidence enable row level security;

revoke all on public.smartteam_shifts,public.smartteam_visits,public.smartteam_visit_events,public.smartteam_activities,public.smartteam_targets,public.smartteam_visit_evidence from anon,authenticated;
drop policy if exists smartteam_shifts_deny_client on public.smartteam_shifts;
create policy smartteam_shifts_deny_client on public.smartteam_shifts for all to anon,authenticated using (false) with check (false);
drop policy if exists smartteam_visits_deny_client on public.smartteam_visits;
create policy smartteam_visits_deny_client on public.smartteam_visits for all to anon,authenticated using (false) with check (false);
drop policy if exists smartteam_visit_events_deny_client on public.smartteam_visit_events;
create policy smartteam_visit_events_deny_client on public.smartteam_visit_events for all to anon,authenticated using (false) with check (false);
drop policy if exists smartteam_activities_deny_client on public.smartteam_activities;
create policy smartteam_activities_deny_client on public.smartteam_activities for all to anon,authenticated using (false) with check (false);
drop policy if exists smartteam_targets_deny_client on public.smartteam_targets;
create policy smartteam_targets_deny_client on public.smartteam_targets for all to anon,authenticated using (false) with check (false);
drop policy if exists smartteam_visit_evidence_deny_client on public.smartteam_visit_evidence;
create policy smartteam_visit_evidence_deny_client on public.smartteam_visit_evidence for all to anon,authenticated using (false) with check (false);

insert into public.permissions(key,resource,action,description) values
 ('smartteam:attendance:read','smartteam.attendance','read','Read tenant-scoped attendance and shift status'),
 ('smartteam:attendance:manage','smartteam.attendance','manage','Clock in/out for own active sales profile'),
 ('smartteam:attendance:correct','smartteam.attendance','correct','Correct attendance with reason and audit'),
 ('smartteam:visit:read','smartteam.visit','read','Read authorized visit schedule and history'),
 ('smartteam:visit:manage','smartteam.visit','manage','Create, assign, update and cancel visits'),
 ('smartteam:visit:execute','smartteam.visit','execute','Check in/out and record visit outcome'),
 ('smartteam:activity:read','smartteam.activity','read','Read authorized sales activities'),
 ('smartteam:activity:manage','smartteam.activity','manage','Create and update sales activities'),
 ('smartteam:target:read','smartteam.target','read','Read operational targets and progress'),
 ('smartteam:target:manage','smartteam.target','manage','Create and update operational targets'),
 ('smartteam:dashboard:read','smartteam.dashboard','read','Read SmartTeam operational dashboard')
on conflict (key) do nothing;

insert into public.role_permissions(role_id,permission_key)
select r.id,p.key
from public.roles r
cross join public.permissions p
where
 (r.key in ('company_admin','tenant_owner','platform_admin') and p.key like 'smartteam:%')
 or (r.key='supervisor' and p.key in (
  'smartteam:attendance:read','smartteam:attendance:correct','smartteam:visit:read','smartteam:visit:manage',
  'smartteam:activity:read','smartteam:activity:manage','smartteam:target:read','smartteam:target:manage','smartteam:dashboard:read'
 ))
 or (r.key='sales_rep' and p.key in (
  'smartteam:attendance:read','smartteam:attendance:manage','smartteam:visit:read','smartteam:visit:execute',
  'smartteam:activity:read','smartteam:activity:manage','smartteam:target:read','smartteam:dashboard:read'
 ))
on conflict do nothing;

-- Private SmartTeam broadcast channel: only active tenant members with a SmartTeam read permission can subscribe.
drop policy if exists smartteam_private_read on realtime.messages;
create policy smartteam_private_read on realtime.messages for select to authenticated
using (
 extension='broadcast'
 and (select realtime.topic()) ~ '^tenant:[0-9a-fA-F-]{36}:smartteam$'
 and exists (
  select 1
  from public.organization_memberships m
  join public.user_role_assignments ura on ura.membership_id=m.id
   and ura.revoked_at is null and ura.starts_at<=now() and (ura.expires_at is null or ura.expires_at>now())
  join public.role_permissions rp on rp.role_id=ura.role_id
  join public.permissions p on p.key=rp.permission_key
  where m.user_id=(select auth.uid()) and m.status='active'
   and m.organization_id=split_part((select realtime.topic()),':',2)::uuid
   and p.key in ('smartteam:attendance:read','smartteam:visit:read','smartteam:activity:read','smartteam:dashboard:read')
 )
);

create or replace function public.smartteam_broadcast_change()
returns trigger language plpgsql security definer set search_path=pg_catalog,public,realtime as $$
declare
 org_id uuid;
 record_id uuid;
 record_status text;
 resource_name text;
begin
 if TG_OP='DELETE' then
  org_id:=old.organization_id; record_id:=old.id; record_status:=null;
 else
  org_id:=new.organization_id; record_id:=new.id;
  if TG_TABLE_NAME='smartteam_shifts' then record_status:=new.status;
  elsif TG_TABLE_NAME='smartteam_visits' then record_status:=new.status;
  elsif TG_TABLE_NAME='smartteam_activities' then record_status:=new.status;
  else record_status:=null; end if;
 end if;
 resource_name:=TG_TABLE_NAME;
 perform realtime.send(
  jsonb_build_object('organization_id',org_id,'resource',resource_name,'record_id',record_id,'operation',TG_OP,'status',record_status,'occurred_at',now()),
  'smartteam.changed',
  'tenant:'||org_id::text||':smartteam',
  true
 );
 if TG_OP='DELETE' then return old; end if;
 return new;
end $$;
revoke all on function public.smartteam_broadcast_change() from public,anon,authenticated;

drop trigger if exists smartteam_shifts_broadcast on public.smartteam_shifts;
create trigger smartteam_shifts_broadcast after insert or update or delete on public.smartteam_shifts for each row execute function public.smartteam_broadcast_change();
drop trigger if exists smartteam_visits_broadcast on public.smartteam_visits;
create trigger smartteam_visits_broadcast after insert or update or delete on public.smartteam_visits for each row execute function public.smartteam_broadcast_change();
drop trigger if exists smartteam_activities_broadcast on public.smartteam_activities;
create trigger smartteam_activities_broadcast after insert or update or delete on public.smartteam_activities for each row execute function public.smartteam_broadcast_change();
drop trigger if exists smartteam_targets_broadcast on public.smartteam_targets;
create trigger smartteam_targets_broadcast after insert or update or delete on public.smartteam_targets for each row execute function public.smartteam_broadcast_change();
