-- Phase 03 completion: membership-bound sales profiles, immutable assignment snapshots,
-- idempotent master-data import batches and tenant-private Realtime invalidations.
begin;

create schema if not exists private;
revoke all on schema private from public, anon, authenticated;

create unique index if not exists organization_memberships_org_id_id_uq
  on public.organization_memberships(organization_id,id);

alter table public.sales_profiles
  add column if not exists membership_id uuid;

update public.sales_profiles sp
set membership_id = m.id
from public.organization_memberships m
where m.organization_id = sp.organization_id
  and m.user_id = sp.user_id
  and sp.membership_id is null;

do $$
begin
  if not exists (select 1 from pg_constraint where conname='sales_profiles_membership_same_org_fk') then
    alter table public.sales_profiles
      add constraint sales_profiles_membership_same_org_fk
      foreign key (organization_id,membership_id)
      references public.organization_memberships(organization_id,id) on delete restrict;
  end if;
end $$;

create index if not exists sales_profiles_org_membership_idx
  on public.sales_profiles(organization_id,membership_id);

alter table public.outlet_assignment_history
  add column if not exists previous_assignment_id uuid,
  add column if not exists previous_sales_profile_id uuid,
  add column if not exists previous_team_id uuid,
  add column if not exists previous_supervisor_user_id uuid,
  add column if not exists previous_territory_id uuid,
  add column if not exists assigned_team_id uuid,
  add column if not exists assigned_supervisor_user_id uuid,
  add column if not exists assigned_territory_id uuid,
  add column if not exists unassigned_by uuid references public.profiles(id) on delete restrict,
  add column if not exists change_reason text;

do $$
begin
  if not exists (select 1 from pg_constraint where conname='outlet_assignment_previous_same_org_fk') then
    alter table public.outlet_assignment_history
      add constraint outlet_assignment_previous_same_org_fk
      foreign key (organization_id,previous_sales_profile_id)
      references public.sales_profiles(organization_id,id) on delete restrict;
  end if;
  if not exists (select 1 from pg_constraint where conname='outlet_assignment_assigned_team_same_org_fk') then
    alter table public.outlet_assignment_history
      add constraint outlet_assignment_assigned_team_same_org_fk
      foreign key (organization_id,assigned_team_id)
      references public.teams(organization_id,id) on delete restrict;
  end if;
  if not exists (select 1 from pg_constraint where conname='outlet_assignment_assigned_territory_same_org_fk') then
    alter table public.outlet_assignment_history
      add constraint outlet_assignment_assigned_territory_same_org_fk
      foreign key (organization_id,assigned_territory_id)
      references public.territories(organization_id,id) on delete restrict;
  end if;
  if not exists (select 1 from pg_constraint where conname='outlet_assignment_previous_team_same_org_fk') then
    alter table public.outlet_assignment_history
      add constraint outlet_assignment_previous_team_same_org_fk
      foreign key (organization_id,previous_team_id)
      references public.teams(organization_id,id) on delete restrict;
  end if;
  if not exists (select 1 from pg_constraint where conname='outlet_assignment_previous_territory_same_org_fk') then
    alter table public.outlet_assignment_history
      add constraint outlet_assignment_previous_territory_same_org_fk
      foreign key (organization_id,previous_territory_id)
      references public.territories(organization_id,id) on delete restrict;
  end if;
  if not exists (select 1 from pg_constraint where conname='outlet_assignment_assigned_supervisor_fk') then
    alter table public.outlet_assignment_history
      add constraint outlet_assignment_assigned_supervisor_fk
      foreign key (assigned_supervisor_user_id) references public.profiles(id) on delete restrict;
  end if;
  if not exists (select 1 from pg_constraint where conname='outlet_assignment_previous_supervisor_fk') then
    alter table public.outlet_assignment_history
      add constraint outlet_assignment_previous_supervisor_fk
      foreign key (previous_supervisor_user_id) references public.profiles(id) on delete restrict;
  end if;
  if not exists (select 1 from pg_constraint where conname='outlet_assignment_previous_assignment_fk') then
    alter table public.outlet_assignment_history
      add constraint outlet_assignment_previous_assignment_fk
      foreign key (previous_assignment_id) references public.outlet_assignment_history(id) on delete restrict;
  end if;
end $$;

create index if not exists outlet_assignment_team_history_idx
  on public.outlet_assignment_history(organization_id,assigned_team_id,assigned_at desc);
create index if not exists outlet_assignment_territory_history_idx
  on public.outlet_assignment_history(organization_id,assigned_territory_id,assigned_at desc);

create table if not exists public.master_data_import_batches (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete restrict,
  resource text not null check (resource in ('branches','teams','territories','outlets','sales_profiles')),
  idempotency_key text not null check (length(trim(idempotency_key)) between 8 and 128),
  status text not null default 'in_progress' check (status in ('in_progress','completed')),
  result jsonb,
  created_by uuid not null references public.profiles(id) on delete restrict,
  created_at timestamptz not null default now(),
  completed_at timestamptz,
  constraint master_data_import_batch_idempotency_uq unique(organization_id,resource,idempotency_key),
  constraint master_data_import_batch_result_object check (result is null or jsonb_typeof(result)='object')
);
create index if not exists master_data_import_batches_org_created_idx
  on public.master_data_import_batches(organization_id,created_at desc);
alter table public.master_data_import_batches enable row level security;
drop policy if exists master_data_import_batches_client_deny on public.master_data_import_batches;
create policy master_data_import_batches_client_deny
  on public.master_data_import_batches for all to anon,authenticated
  using (false) with check (false);
revoke all on public.master_data_import_batches from anon,authenticated;
grant select,insert,update on public.master_data_import_batches to service_role;

insert into public.permissions(key,resource,action,description) values
 ('master_data:import','master_data','import','Import tenant master data with row validation and idempotency'),
 ('master_data:export','master_data','export','Export tenant master data'),
 ('master_data:assignment_context:read','master_data','read_assignment_context','Read own assigned sales and outlet context')
on conflict(key) do update set resource=excluded.resource,action=excluded.action,description=excluded.description;

insert into public.role_permissions(role_id,permission_key)
select r.id,p.key
from public.roles r
cross join public.permissions p
where (r.key in ('platform_admin','tenant_owner','company_admin')
       and p.key in ('master_data:import','master_data:export','master_data:assignment_context:read'))
   or (r.key in ('sales_rep','supervisor')
       and p.key in ('master_data:assignment_context:read','sales_profile:read','assignment:read'))
on conflict(role_id,permission_key) do nothing;

-- Tenant-scoped private Broadcast topic. Payloads carry identifiers/status only, never PII.
create or replace function private.broadcast_master_data_change()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, public, realtime
as $$
declare
  v_org_id uuid;
  v_record_id uuid;
  v_status text;
  v_topic text;
begin
  if TG_OP = 'DELETE' then
    v_org_id := OLD.organization_id;
    v_record_id := OLD.id;
    v_status := null;
  else
    v_org_id := NEW.organization_id;
    v_record_id := NEW.id;
    v_status := to_jsonb(NEW)->>'status';
  end if;
  v_topic := 'tenant:' || v_org_id::text || ':master-data';
  perform realtime.send(
    jsonb_build_object(
      'organization_id',v_org_id,
      'resource',TG_TABLE_NAME,
      'record_id',v_record_id,
      'operation',TG_OP,
      'status',v_status,
      'occurred_at',clock_timestamp()
    ),
    'master_data.changed',
    v_topic,
    true
  );
  return null;
end;
$$;
revoke all on function private.broadcast_master_data_change() from public,anon,authenticated;

do $$
declare t text;
begin
  foreach t in array array['branches','teams','territories','outlets','sales_profiles','outlet_assignment_history'] loop
    execute format('drop trigger if exists %I on public.%I',t||'_master_data_broadcast',t);
    execute format(
      'create trigger %I after insert or update or delete on public.%I for each row execute function private.broadcast_master_data_change()',
      t||'_master_data_broadcast',t
    );
  end loop;
end $$;

alter table realtime.messages enable row level security;
drop policy if exists salesx_master_data_private_read on realtime.messages;
create policy salesx_master_data_private_read
on realtime.messages for select to authenticated
using (
  extension = 'broadcast'
  and (select realtime.topic()) ~ '^tenant:[0-9a-fA-F-]{36}:master-data$'
  and exists (
    select 1
    from public.organization_memberships m
    join public.user_role_assignments ura
      on ura.membership_id=m.id
     and ura.revoked_at is null
     and ura.starts_at<=now()
     and (ura.expires_at is null or ura.expires_at>now())
    join public.role_permissions rp on rp.role_id=ura.role_id
    join public.permissions p on p.key=rp.permission_key
    where m.user_id=(select auth.uid())
      and m.status='active'
      and m.organization_id=split_part((select realtime.topic()),':',2)::uuid
      and p.key in (
        'branch:read','team:read','territory:read','outlet:read',
        'sales_profile:read','assignment:read','master_data:assignment_context:read'
      )
  )
);

commit;
