-- Phase 03: tenant-scoped master data foundation.
-- Existing organizations and branches remain the Phase 02 identity roots.
begin;

create table if not exists public.teams (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete restrict,
  branch_id uuid,
  parent_team_id uuid,
  code text not null,
  name text not null,
  supervisor_user_id uuid references public.profiles(id) on delete set null,
  status text not null default 'active' check (status in ('active','inactive','archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint teams_code_nonempty check (length(trim(code)) between 1 and 40),
  constraint teams_name_nonempty check (length(trim(name)) between 2 and 160),
  constraint teams_org_id_id_unique unique (organization_id,id),
  constraint teams_org_branch_fk foreign key (organization_id,branch_id)
    references public.branches(organization_id,id) on delete restrict,
  constraint teams_parent_same_org_fk foreign key (organization_id,parent_team_id)
    references public.teams(organization_id,id) on delete restrict
);
create unique index if not exists teams_org_code_uq on public.teams(organization_id,lower(code));
create index if not exists teams_org_branch_status_idx on public.teams(organization_id,branch_id,status);

create table if not exists public.territories (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete restrict,
  branch_id uuid,
  parent_territory_id uuid,
  code text not null,
  name text not null,
  boundary_geojson jsonb,
  status text not null default 'active' check (status in ('active','inactive','archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint territories_code_nonempty check (length(trim(code)) between 1 and 40),
  constraint territories_name_nonempty check (length(trim(name)) between 2 and 160),
  constraint territories_boundary_object check (boundary_geojson is null or jsonb_typeof(boundary_geojson)='object'),
  constraint territories_org_id_id_unique unique (organization_id,id),
  constraint territories_org_branch_fk foreign key (organization_id,branch_id)
    references public.branches(organization_id,id) on delete restrict,
  constraint territories_parent_same_org_fk foreign key (organization_id,parent_territory_id)
    references public.territories(organization_id,id) on delete restrict
);
create unique index if not exists territories_org_code_uq on public.territories(organization_id,lower(code));
create index if not exists territories_org_branch_status_idx on public.territories(organization_id,branch_id,status);

create table if not exists public.outlets (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete restrict,
  branch_id uuid,
  territory_id uuid,
  code text not null,
  name text not null,
  category text,
  address text,
  city text,
  province text,
  postal_code text,
  phone text,
  pic_name text,
  latitude double precision,
  longitude double precision,
  status text not null default 'active' check (status in ('active','inactive','archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint outlets_code_nonempty check (length(trim(code)) between 1 and 60),
  constraint outlets_name_nonempty check (length(trim(name)) between 2 and 180),
  constraint outlets_latitude_range check (latitude is null or latitude between -90 and 90),
  constraint outlets_longitude_range check (longitude is null or longitude between -180 and 180),
  constraint outlets_org_id_id_unique unique (organization_id,id),
  constraint outlets_org_branch_fk foreign key (organization_id,branch_id)
    references public.branches(organization_id,id) on delete restrict,
  constraint outlets_territory_same_org_fk foreign key (organization_id,territory_id)
    references public.territories(organization_id,id) on delete restrict
);
create unique index if not exists outlets_org_code_uq on public.outlets(organization_id,lower(code));
create index if not exists outlets_org_branch_status_idx on public.outlets(organization_id,branch_id,status);
create index if not exists outlets_org_territory_idx on public.outlets(organization_id,territory_id);

create table if not exists public.sales_profiles (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete restrict,
  user_id uuid not null references public.profiles(id) on delete restrict,
  employee_code text,
  team_id uuid,
  territory_id uuid,
  manager_user_id uuid references public.profiles(id) on delete set null,
  status text not null default 'active' check (status in ('active','inactive','suspended')),
  effective_from date not null default current_date,
  effective_until date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint sales_profiles_user_unique unique (organization_id,user_id),
  constraint sales_profiles_org_id_id_unique unique (organization_id,id),
  constraint sales_profiles_employee_code_nonempty check (employee_code is null or length(trim(employee_code)) between 1 and 60),
  constraint sales_profiles_effective_dates check (effective_until is null or effective_until>=effective_from),
  constraint sales_profiles_team_same_org_fk foreign key (organization_id,team_id)
    references public.teams(organization_id,id) on delete restrict,
  constraint sales_profiles_territory_same_org_fk foreign key (organization_id,territory_id)
    references public.territories(organization_id,id) on delete restrict
);
create unique index if not exists sales_profiles_org_employee_code_uq
  on public.sales_profiles(organization_id,lower(employee_code)) where employee_code is not null;
create index if not exists sales_profiles_org_team_status_idx on public.sales_profiles(organization_id,team_id,status);
create index if not exists sales_profiles_org_territory_status_idx on public.sales_profiles(organization_id,territory_id,status);

create table if not exists public.outlet_assignment_history (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete restrict,
  outlet_id uuid not null,
  sales_profile_id uuid not null,
  assigned_by uuid not null references public.profiles(id) on delete restrict,
  assigned_at timestamptz not null default now(),
  unassigned_at timestamptz,
  note text,
  constraint outlet_assignment_dates check (unassigned_at is null or unassigned_at>=assigned_at),
  constraint outlet_assignment_outlet_same_org_fk foreign key (organization_id,outlet_id)
    references public.outlets(organization_id,id) on delete restrict,
  constraint outlet_assignment_sales_same_org_fk foreign key (organization_id,sales_profile_id)
    references public.sales_profiles(organization_id,id) on delete restrict
);
create unique index if not exists outlet_assignment_one_active_uq
  on public.outlet_assignment_history(organization_id,outlet_id) where unassigned_at is null;
create index if not exists outlet_assignment_sales_history_idx
  on public.outlet_assignment_history(organization_id,sales_profile_id,assigned_at desc);

-- New domain permissions; existing branch permissions are reused.
insert into public.permissions(key,resource,action,description) values
 ('team:read','team','read','Read tenant team hierarchy'),
 ('team:manage','team','manage','Create and manage tenant teams'),
 ('territory:read','territory','read','Read tenant territories'),
 ('territory:manage','territory','manage','Create and manage tenant territories'),
 ('outlet:read','outlet','read','Read tenant outlet master'),
 ('outlet:manage','outlet','manage','Create and manage tenant outlets'),
 ('sales_profile:read','sales_profile','read','Read tenant sales profiles'),
 ('sales_profile:manage','sales_profile','manage','Create and manage tenant sales profiles'),
 ('assignment:read','outlet_assignment','read','Read outlet assignment history'),
 ('assignment:manage','outlet_assignment','manage','Manage outlet sales assignments')
on conflict(key) do update set resource=excluded.resource,action=excluded.action,description=excluded.description;

insert into public.role_permissions(role_id,permission_key)
select r.id,p.key
from public.roles r
cross join public.permissions p
where r.key in ('platform_admin','tenant_owner','company_admin')
  and p.key in ('branch:read','branch:manage','team:read','team:manage',
    'territory:read','territory:manage','outlet:read','outlet:manage',
    'sales_profile:read','sales_profile:manage','assignment:read','assignment:manage')
on conflict(role_id,permission_key) do nothing;

do $$
declare table_name text;
begin
  foreach table_name in array array['teams','territories','outlets','sales_profiles','outlet_assignment_history'] loop
    execute format('alter table public.%I enable row level security',table_name);
    execute format('drop policy if exists %I on public.%I',table_name||'_client_deny',table_name);
    execute format('create policy %I on public.%I for all using (false) with check (false)',table_name||'_client_deny',table_name);
    execute format('revoke all on table public.%I from anon, authenticated',table_name);
    execute format('grant select,insert,update,delete on table public.%I to service_role',table_name);
  end loop;
end $$;

commit;
