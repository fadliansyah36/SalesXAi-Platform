-- Phase 07: privacy-first location intelligence foundation.
-- All writes are performed by FastAPI using the server-side service role.
create extension if not exists postgis with schema extensions;

create table if not exists public.location_tracking_sessions (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  sales_profile_id uuid not null,
  user_id uuid not null references public.profiles(id) on delete restrict,
  shift_id uuid null references public.smartteam_shifts(id) on delete set null,
  device_id text not null,
  consented_at timestamptz not null,
  consent_policy_version text not null,
  started_at timestamptz not null default now(),
  ended_at timestamptz null,
  status text not null default 'active' check (status in ('active','paused','completed','revoked')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id,id),
  foreign key (organization_id,sales_profile_id)
    references public.sales_profiles(organization_id,id) on delete restrict,
  check (ended_at is null or ended_at >= started_at),
  check ((status in ('active','paused') and ended_at is null) or status in ('completed','revoked'))
);

create unique index if not exists uq_location_one_active_session_per_user
  on public.location_tracking_sessions(organization_id,user_id)
  where status='active';
create index if not exists idx_location_sessions_org_started
  on public.location_tracking_sessions(organization_id,started_at desc);
create index if not exists idx_location_sessions_sales
  on public.location_tracking_sessions(organization_id,sales_profile_id,started_at desc);

create table if not exists public.location_points (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  session_id uuid not null,
  user_id uuid not null references public.profiles(id) on delete restrict,
  device_id text not null,
  client_point_id text not null,
  recorded_at timestamptz not null,
  received_at timestamptz not null default now(),
  latitude double precision not null check (latitude between -90 and 90),
  longitude double precision not null check (longitude between -180 and 180),
  accuracy_m double precision not null check (accuracy_m >= 0 and accuracy_m <= 10000),
  altitude_m double precision null,
  speed_mps double precision null check (speed_mps is null or speed_mps >= 0),
  heading_deg double precision null check (heading_deg is null or heading_deg between 0 and 360),
  source text not null check (source in ('gps','network','fused')),
  location extensions.geography(Point,4326) generated always as
    (extensions.st_setsrid(extensions.st_makepoint(longitude,latitude),4326)::extensions.geography) stored,
  metadata jsonb not null default '{}'::jsonb,
  unique (organization_id,session_id,client_point_id),
  foreign key (organization_id,session_id)
    references public.location_tracking_sessions(organization_id,id) on delete cascade
);
create index if not exists idx_location_points_org_recorded
  on public.location_points(organization_id,recorded_at desc);
create index if not exists idx_location_points_session_recorded
  on public.location_points(session_id,recorded_at asc);
create index if not exists idx_location_points_geography
  on public.location_points using gist(location);

create table if not exists public.location_geofences (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  code text not null,
  name text not null,
  geofence_type text not null check (geofence_type in ('outlet','territory','custom')),
  outlet_id uuid null,
  territory_id uuid null,
  boundary extensions.geography(Polygon,4326) not null,
  event_types text[] not null default array['enter','exit']::text[],
  dwell_seconds integer not null default 0 check (dwell_seconds >= 0),
  accuracy_limit_m double precision not null default 100 check (accuracy_limit_m > 0),
  status text not null default 'active' check (status in ('active','inactive','archived')),
  created_by uuid not null references public.profiles(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id,code),
  foreign key (organization_id,outlet_id) references public.outlets(organization_id,id) on delete restrict,
  foreign key (organization_id,territory_id) references public.territories(organization_id,id) on delete restrict,
  check ((geofence_type='outlet' and outlet_id is not null and territory_id is null)
      or (geofence_type='territory' and territory_id is not null and outlet_id is null)
      or (geofence_type='custom' and outlet_id is null and territory_id is null)),
  check (extensions.st_isvalid(boundary::extensions.geometry))
);
create index if not exists idx_location_geofences_org_status
  on public.location_geofences(organization_id,status);
create index if not exists idx_location_geofences_boundary
  on public.location_geofences using gist(boundary);

create table if not exists public.location_geofence_events (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  geofence_id uuid not null,
  session_id uuid not null,
  location_point_id uuid not null,
  event_type text not null check (event_type in ('enter','exit','dwell')),
  occurred_at timestamptz not null,
  created_at timestamptz not null default now(),
  unique (organization_id,geofence_id,location_point_id,event_type),
  foreign key (organization_id,geofence_id) references public.location_geofences(organization_id,id) on delete cascade,
  foreign key (organization_id,session_id) references public.location_tracking_sessions(organization_id,id) on delete cascade,
  foreign key (organization_id,location_point_id) references public.location_points(organization_id,id) on delete cascade
);
create index if not exists idx_location_geofence_events_org_time
  on public.location_geofence_events(organization_id,occurred_at desc);

create table if not exists public.location_route_summaries (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  session_id uuid not null,
  route_date date not null,
  started_at timestamptz not null,
  ended_at timestamptz not null,
  point_count integer not null default 0 check (point_count >= 0),
  distance_m double precision not null default 0 check (distance_m >= 0),
  route extensions.geometry(LineString,4326) null,
  computed_at timestamptz not null default now(),
  unique (organization_id,session_id,route_date),
  foreign key (organization_id,session_id) references public.location_tracking_sessions(organization_id,id) on delete cascade,
  check (ended_at >= started_at)
);
create index if not exists idx_location_routes_org_date
  on public.location_route_summaries(organization_id,route_date desc);
create index if not exists idx_location_routes_geometry
  on public.location_route_summaries using gist(route);

-- No browser/mobile role receives direct access to location business data.
do $$
declare t text;
begin
  foreach t in array array[
    'location_tracking_sessions','location_points','location_geofences',
    'location_geofence_events','location_route_summaries'
  ] loop
    execute format('alter table public.%I enable row level security',t);
    execute format('drop policy if exists location_deny_client on public.%I',t);
    execute format('create policy location_deny_client on public.%I for all to anon, authenticated using (false) with check (false)',t);
    execute format('revoke all on public.%I from anon, authenticated',t);
    execute format('grant select,insert,update,delete on public.%I to service_role',t);
  end loop;
end $$;

insert into public.permissions(key,resource,action,description) values
 ('location.sessions.read','location.sessions','read','Read authorized location tracking sessions'),
 ('location.sessions.manage','location.sessions','manage','Start, pause, resume and stop authorized location sessions'),
 ('location.points.ingest','location.points','ingest','Ingest idempotent device location points'),
 ('location.history.read','location.history','read','Read tenant-scoped location and route history'),
 ('location.geofences.read','location.geofences','read','Read organization geofence definitions'),
 ('location.geofences.manage','location.geofences','manage','Manage organization geofence definitions'),
 ('location.reports.read','location.reports','read','Read authorized location and route reports')
on conflict (key) do update set resource=excluded.resource,action=excluded.action,description=excluded.description;

comment on table public.location_points is 'Consent-bound, device-attributed GPS observations. Clients must use FastAPI; no direct client grants.';
comment on table public.location_tracking_sessions is 'Visible tracking lifecycle bound to an authorized sales profile, user, device and optional shift.';
comment on table public.location_geofences is 'Tenant-owned geospatial boundaries used for explicit operational geofence events.';
