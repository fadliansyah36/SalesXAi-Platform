-- SalesX-Ai Phase 02 — Identity, Tenant & Authorization Foundation
-- Target: eyofuiyxalbehbqoaeny
-- Supabase Auth remains the sole credential and identity authority.
-- No passwords, refresh tokens, access tokens or secrets are stored here.

begin;

create schema if not exists app_private;
revoke all on schema app_private from public, anon, authenticated;
grant usage on schema app_private to service_role;

create table if not exists public.organizations (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug = lower(slug) and slug ~ '^[a-z0-9][a-z0-9-]{1,61}[a-z0-9]$'),
  name text not null check (length(trim(name)) between 2 and 160),
  legal_name text,
  status text not null default 'active' check (status in ('active','suspended','archived')),
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.branches (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete restrict,
  code text not null check (length(trim(code)) between 1 and 40),
  name text not null check (length(trim(name)) between 2 and 160),
  status text not null default 'active' check (status in ('active','inactive','archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, id),
  unique (organization_id, code)
);

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  phone text,
  display_name text,
  avatar_url text,
  status text not null default 'active' check (status in ('active','pending','suspended','deactivated')),
  locale text not null default 'id-ID',
  timezone text not null default 'Asia/Jakarta',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.user_identities (
  id uuid primary key default gen_random_uuid(),
  auth_identity_id uuid not null unique,
  user_id uuid not null references auth.users(id) on delete cascade,
  provider text not null,
  provider_subject text not null,
  email text,
  is_primary boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (provider, provider_subject)
);

create table if not exists public.organization_memberships (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete restrict,
  user_id uuid not null references auth.users(id) on delete cascade,
  branch_id uuid,
  status text not null default 'invited' check (status in ('invited','active','suspended','removed')),
  title text,
  joined_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, user_id),
  unique (id, user_id),
  foreign key (organization_id, branch_id) references public.branches(organization_id, id) on delete restrict
);

create table if not exists public.roles (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,
  name text not null,
  description text not null default '',
  scope_type text not null check (scope_type in ('platform','tenant','branch')),
  hierarchy_level integer not null default 100 check (hierarchy_level >= 0),
  parent_role_id uuid references public.roles(id) on delete restrict,
  is_system boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.permissions (
  key text primary key,
  resource text not null,
  action text not null,
  description text not null default '',
  created_at timestamptz not null default now()
);

create table if not exists public.role_permissions (
  role_id uuid not null references public.roles(id) on delete cascade,
  permission_key text not null references public.permissions(key) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (role_id, permission_key)
);

create table if not exists public.user_role_assignments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  membership_id uuid,
  role_id uuid not null references public.roles(id) on delete restrict,
  scope_type text not null check (scope_type in ('platform','tenant','branch')),
  scope_id uuid,
  attributes jsonb not null default '{}'::jsonb check (jsonb_typeof(attributes) = 'object'),
  assigned_by uuid references auth.users(id) on delete set null,
  starts_at timestamptz not null default now(),
  expires_at timestamptz,
  revoked_at timestamptz,
  created_at timestamptz not null default now(),
  foreign key (membership_id, user_id)
    references public.organization_memberships(id, user_id) on delete cascade,
  check (
    (scope_type = 'platform' and membership_id is null and scope_id is null)
    or (scope_type = 'tenant' and membership_id is not null and scope_id is not null)
    or (scope_type = 'branch' and membership_id is not null and scope_id is not null)
  ),
  check (expires_at is null or expires_at > starts_at)
);

create unique index if not exists user_role_assignments_unique_active
  on public.user_role_assignments(user_id, role_id, scope_type, coalesce(scope_id, '00000000-0000-0000-0000-000000000000'::uuid))
  where revoked_at is null;

create table if not exists public.session_devices (
  id uuid primary key default gen_random_uuid(),
  auth_session_id uuid not null unique,
  user_id uuid not null references auth.users(id) on delete cascade,
  device_id text,
  device_name text,
  platform text not null check (platform in ('web','android','ios','unknown')),
  user_agent text,
  last_seen_at timestamptz not null default now(),
  expires_at timestamptz,
  revoked_at timestamptz,
  created_at timestamptz not null default now(),
  check (device_id is null or length(device_id) <= 160),
  check (device_name is null or length(device_name) <= 160),
  check (user_agent is null or length(user_agent) <= 512)
);

create table if not exists public.admin_audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_user_id uuid references auth.users(id) on delete set null,
  organization_id uuid references public.organizations(id) on delete set null,
  action text not null check (length(action) between 2 and 160),
  resource_type text not null check (length(resource_type) between 2 and 120),
  resource_id text,
  correlation_id text,
  occurred_at timestamptz not null default now(),
  ip_hash text,
  user_agent text,
  metadata jsonb not null default '{}'::jsonb check (jsonb_typeof(metadata) = 'object'),
  check (not (metadata ?| array['password','access_token','refresh_token','authorization','service_role_key','jwt','secret']))
);

create index if not exists organizations_status_idx on public.organizations(status);
create index if not exists branches_org_status_idx on public.branches(organization_id, status);
create index if not exists profiles_status_idx on public.profiles(status);
create index if not exists memberships_user_status_idx on public.organization_memberships(user_id, status);
create index if not exists memberships_org_status_idx on public.organization_memberships(organization_id, status);
create index if not exists user_roles_user_scope_idx on public.user_role_assignments(user_id, scope_type, scope_id)
  where revoked_at is null;
create index if not exists user_roles_membership_idx on public.user_role_assignments(membership_id)
  where revoked_at is null;
create index if not exists audit_org_time_idx on public.admin_audit_logs(organization_id, occurred_at desc);
create index if not exists audit_actor_time_idx on public.admin_audit_logs(actor_user_id, occurred_at desc);
create index if not exists session_devices_user_active_idx on public.session_devices(user_id, last_seen_at desc)
  where revoked_at is null;

create or replace function app_private.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create or replace function app_private.is_active_org_member(p_organization_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.organization_memberships m
    join public.organizations o on o.id = m.organization_id
    where m.organization_id = p_organization_id
      and m.user_id = (select auth.uid())
      and m.status = 'active'
      and o.status = 'active'
  );
$$;

create or replace function app_private.sync_auth_user_profile()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, email, phone, display_name, avatar_url, status)
  values (
    new.id,
    new.email,
    new.phone,
    nullif(coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name'), ''),
    nullif(new.raw_user_meta_data->>'avatar_url', ''),
    'active'
  )
  on conflict (id) do update set
    email = excluded.email,
    phone = excluded.phone,
    display_name = coalesce(excluded.display_name, public.profiles.display_name),
    avatar_url = coalesce(excluded.avatar_url, public.profiles.avatar_url),
    updated_at = now();
  return new;
end;
$$;

create or replace function app_private.sync_auth_identity()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_identity_id uuid;
  v_user_id uuid;
  v_provider text;
  v_subject text;
  v_email text;
begin
  if tg_op = 'DELETE' then
    delete from public.user_identities where auth_identity_id = old.id;
    return old;
  end if;

  v_identity_id := new.id;
  v_user_id := new.user_id;
  v_provider := new.provider;
  v_subject := coalesce(new.identity_data->>'sub', new.id::text);
  v_email := new.identity_data->>'email';

  insert into public.user_identities
    (auth_identity_id, user_id, provider, provider_subject, email)
  values (v_identity_id, v_user_id, v_provider, v_subject, v_email)
  on conflict (auth_identity_id) do update set
    user_id = excluded.user_id,
    provider = excluded.provider,
    provider_subject = excluded.provider_subject,
    email = excluded.email,
    updated_at = now();
  return new;
end;
$$;

create or replace function app_private.prevent_audit_mutation()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  raise exception 'admin_audit_logs is append-only';
end;
$$;

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at before update on public.profiles
for each row execute function app_private.set_updated_at();
drop trigger if exists organizations_set_updated_at on public.organizations;
create trigger organizations_set_updated_at before update on public.organizations
for each row execute function app_private.set_updated_at();
drop trigger if exists branches_set_updated_at on public.branches;
create trigger branches_set_updated_at before update on public.branches
for each row execute function app_private.set_updated_at();
drop trigger if exists memberships_set_updated_at on public.organization_memberships;
create trigger memberships_set_updated_at before update on public.organization_memberships
for each row execute function app_private.set_updated_at();

drop trigger if exists salesx_auth_user_profile_sync on auth.users;
create trigger salesx_auth_user_profile_sync
after insert or update of email, phone, raw_user_meta_data on auth.users
for each row execute function app_private.sync_auth_user_profile();

drop trigger if exists salesx_auth_identity_sync on auth.identities;
create trigger salesx_auth_identity_sync
after insert or update or delete on auth.identities
for each row execute function app_private.sync_auth_identity();

drop trigger if exists admin_audit_logs_immutable on public.admin_audit_logs;
create trigger admin_audit_logs_immutable before update or delete on public.admin_audit_logs
for each row execute function app_private.prevent_audit_mutation();

insert into public.roles (key, name, description, scope_type, hierarchy_level)
values
 ('platform_admin','Platform Administrator','Global platform governance and security operations','platform',0),
 ('tenant_owner','Tenant Owner','Organization owner with full tenant administration','tenant',10),
 ('company_admin','Company Administrator','Company-level administration','tenant',20),
 ('supervisor','Supervisor','Team supervision and operational visibility','branch',30),
 ('sales_rep','Sales Representative','Assigned sales operations','branch',40),
 ('distributor_user','Distributor User','Distributor portal access','tenant',50),
 ('principal_user','Principal User','Principal portal access','tenant',50),
 ('customer_user','Customer User','Customer portal access','tenant',60)
on conflict (key) do update set
  name = excluded.name,
  description = excluded.description,
  scope_type = excluded.scope_type,
  hierarchy_level = excluded.hierarchy_level;

update public.roles r set parent_role_id = p.id
from public.roles p
where (r.key = 'tenant_owner' and p.key = 'company_admin')
   or (r.key = 'company_admin' and p.key = 'supervisor')
   or (r.key = 'supervisor' and p.key = 'sales_rep');

insert into public.permissions (key, resource, action, description) values
 ('profile:read:self','profile','read:self','Read own profile'),
 ('profile:update:self','profile','update:self','Update own profile'),
 ('organization:create','organization','create','Create an organization and initial owner membership'),
 ('organization:read','organization','read','Read organization metadata'),
 ('organization:update','organization','update','Update organization settings'),
 ('organization:members:read','organization_membership','read','Read organization membership'),
 ('organization:members:manage','organization_membership','manage','Invite, suspend or remove members'),
 ('role:assign','role_assignment','assign','Assign or revoke scoped roles'),
 ('audit:read','audit_log','read','Read tenant administrative audit events'),
 ('branch:read','branch','read','Read branch metadata'),
 ('branch:manage','branch','manage','Manage branch metadata'),
 ('portal:sales:access','portal','sales:access','Access Sales portal'),
 ('portal:company:access','portal','company:access','Access Company portal'),
 ('portal:customer:access','portal','customer:access','Access Customer portal'),
 ('portal:distributor:access','portal','distributor:access','Access Distributor portal'),
 ('portal:principal:access','portal','principal:access','Access Principal portal'),
 ('portal:supervisor:access','portal','supervisor:access','Access Supervisor portal'),
 ('portal:super_admin:access','portal','super_admin:access','Access Super Admin portal')
on conflict (key) do update set resource=excluded.resource, action=excluded.action, description=excluded.description;

insert into public.role_permissions(role_id, permission_key)
select r.id, p.key
from public.roles r
cross join public.permissions p
where r.key = 'platform_admin'
on conflict do nothing;

insert into public.role_permissions(role_id, permission_key)
select r.id, p.key
from public.roles r
join public.permissions p on p.key = any(array[
 'profile:read:self','profile:update:self','organization:read','organization:update',
 'organization:members:read','organization:members:manage','role:assign','audit:read',
 'branch:read','branch:manage','portal:company:access','portal:supervisor:access','portal:sales:access'
])
where r.key = 'tenant_owner'
on conflict do nothing;

insert into public.role_permissions(role_id, permission_key)
select r.id, p.key
from public.roles r
join public.permissions p on p.key = any(array[
 'profile:read:self','profile:update:self','organization:read','organization:members:read',
 'organization:members:manage','branch:read','branch:manage','portal:company:access',
 'portal:supervisor:access','portal:sales:access'
])
where r.key = 'company_admin'
on conflict do nothing;

insert into public.role_permissions(role_id, permission_key)
select r.id, p.key
from public.roles r
join public.permissions p on p.key = any(array[
 'profile:read:self','profile:update:self','organization:read','organization:members:read',
 'branch:read','portal:supervisor:access','portal:sales:access'
])
where r.key = 'supervisor'
on conflict do nothing;

insert into public.role_permissions(role_id, permission_key)
select r.id, p.key
from public.roles r
join public.permissions p on p.key = any(array[
 'profile:read:self','profile:update:self','organization:read','branch:read','portal:sales:access'
])
where r.key = 'sales_rep'
on conflict do nothing;

insert into public.role_permissions(role_id, permission_key)
select r.id, p.key
from public.roles r
join public.permissions p on p.key = any(array['profile:read:self','profile:update:self','portal:distributor:access'])
where r.key = 'distributor_user'
on conflict do nothing;

insert into public.role_permissions(role_id, permission_key)
select r.id, p.key
from public.roles r
join public.permissions p on p.key = any(array['profile:read:self','profile:update:self','portal:principal:access'])
where r.key = 'principal_user'
on conflict do nothing;

insert into public.role_permissions(role_id, permission_key)
select r.id, p.key
from public.roles r
join public.permissions p on p.key = any(array['profile:read:self','profile:update:self','portal:customer:access'])
where r.key = 'customer_user'
on conflict do nothing;

grant usage on schema app_private to authenticated;
grant execute on function app_private.is_active_org_member(uuid) to authenticated, service_role;
grant select on public.profiles, public.user_identities, public.organization_memberships to authenticated;
grant select on public.organizations, public.branches to authenticated;
grant all on public.organizations, public.branches, public.profiles, public.user_identities,
  public.organization_memberships, public.roles, public.permissions, public.role_permissions,
  public.user_role_assignments, public.session_devices, public.admin_audit_logs to service_role;

alter table public.organizations enable row level security;
alter table public.branches enable row level security;
alter table public.profiles enable row level security;
alter table public.user_identities enable row level security;
alter table public.organization_memberships enable row level security;
alter table public.roles enable row level security;
alter table public.permissions enable row level security;
alter table public.role_permissions enable row level security;
alter table public.user_role_assignments enable row level security;
alter table public.session_devices enable row level security;
alter table public.admin_audit_logs enable row level security;

drop policy if exists profiles_select_self on public.profiles;
create policy profiles_select_self on public.profiles for select to authenticated
using (id = (select auth.uid()));

drop policy if exists identities_select_self on public.user_identities;
create policy identities_select_self on public.user_identities for select to authenticated
using (user_id = (select auth.uid()));

drop policy if exists memberships_select_self on public.organization_memberships;
create policy memberships_select_self on public.organization_memberships for select to authenticated
using (user_id = (select auth.uid()));

drop policy if exists organizations_select_member on public.organizations;
create policy organizations_select_member on public.organizations for select to authenticated
using (app_private.is_active_org_member(id));

drop policy if exists branches_select_member on public.branches;
create policy branches_select_member on public.branches for select to authenticated
using (app_private.is_active_org_member(organization_id));

revoke all on public.organizations, public.branches, public.profiles, public.user_identities,
  public.organization_memberships, public.roles, public.permissions, public.role_permissions,
  public.user_role_assignments, public.session_devices, public.admin_audit_logs from anon, authenticated;
grant select on public.profiles, public.user_identities, public.organization_memberships,
  public.organizations, public.branches to authenticated;

comment on table public.organizations is 'Tenant root; all business data is organization-scoped.';
comment on table public.organization_memberships is 'User-to-tenant membership and active access status.';
comment on table public.user_role_assignments is 'Scoped RBAC assignments; authorization is resolved server-side by FastAPI.';
comment on table public.admin_audit_logs is 'Append-only administrative and security audit trail; server/service-role writes only.';
comment on table public.session_devices is 'Device metadata linked to Supabase Auth session IDs; never stores tokens.';
comment on schema app_private is 'Non-exposed SalesX-Ai security helper namespace.';

commit;
