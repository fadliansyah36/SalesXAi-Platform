-- Phase 07 additive continuation. Applied migration version: 20261121083536.
-- Existing five foundation tables remain canonical.
create table if not exists public.location_latest_positions (
 organization_id uuid not null references public.organizations(id) on delete cascade,
 user_id uuid not null references public.profiles(id) on delete restrict,
 session_id uuid not null, sales_profile_id uuid not null, branch_id uuid, team_id uuid, territory_id uuid,
 device_id text not null, point_id uuid not null,
 latitude double precision not null check(latitude between -90 and 90),
 longitude double precision not null check(longitude between -180 and 180),
 accuracy_m double precision not null check(accuracy_m between 0 and 10000),
 source text not null check(source in ('gps','network','fused')),
 recorded_at timestamptz not null, received_at timestamptz not null default now(),
 location extensions.geography(Point,4326) generated always as
 (extensions.st_setsrid(extensions.st_makepoint(longitude,latitude),4326)::extensions.geography) stored,
 primary key(organization_id,user_id),
 foreign key(organization_id,session_id) references public.location_tracking_sessions(organization_id,id) on delete cascade,
 foreign key(organization_id,sales_profile_id) references public.sales_profiles(organization_id,id) on delete cascade,
 foreign key(organization_id,point_id) references public.location_points(organization_id,id) on delete cascade
);
create index if not exists idx_location_latest_team on public.location_latest_positions(organization_id,team_id,recorded_at desc);
create index if not exists idx_location_latest_branch on public.location_latest_positions(organization_id,branch_id,recorded_at desc);
create index if not exists idx_location_latest_territory on public.location_latest_positions(organization_id,territory_id,recorded_at desc);
create index if not exists idx_location_latest_geography on public.location_latest_positions using gist(location);

create table if not exists public.location_geofence_presence (
 organization_id uuid not null, session_id uuid not null, geofence_id uuid not null,
 is_inside boolean not null, entered_at timestamptz, last_point_id uuid not null,
 dwell_emitted_at timestamptz, updated_at timestamptz not null default now(),
 primary key(organization_id,session_id,geofence_id),
 foreign key(organization_id,session_id) references public.location_tracking_sessions(organization_id,id) on delete cascade,
 foreign key(organization_id,geofence_id) references public.location_geofences(organization_id,id) on delete cascade,
 foreign key(organization_id,last_point_id) references public.location_points(organization_id,id) on delete cascade
);
create index if not exists idx_location_geofence_presence_inside on public.location_geofence_presence(organization_id,geofence_id,is_inside);

create table if not exists public.location_access_audit (
 id uuid primary key default gen_random_uuid(),
 organization_id uuid not null references public.organizations(id) on delete cascade,
 actor_user_id uuid not null references public.profiles(id) on delete restrict,
 resource_type text not null check(resource_type in ('live_map','route_history','geofence','session')),
 resource_id uuid, action text not null, filters jsonb not null default '{}'::jsonb,
 occurred_at timestamptz not null default now()
);
create index if not exists idx_location_access_audit_org_time on public.location_access_audit(organization_id,occurred_at desc);

do $$ declare t text; begin
 foreach t in array array['location_latest_positions','location_geofence_presence','location_access_audit'] loop
  execute format('alter table public.%I enable row level security',t);
  execute format('drop policy if exists location_deny_client on public.%I',t);
  execute format('create policy location_deny_client on public.%I for all to anon, authenticated using (false) with check (false)',t);
  execute format('revoke all on public.%I from anon, authenticated',t);
  execute format('grant select,insert,update,delete on public.%I to service_role',t);
 end loop;
end $$;

create or replace function private.location_after_point_insert()
returns trigger language plpgsql security definer
set search_path=pg_catalog,public,extensions,private,realtime
as $$
declare profile_row record; fence record; prior record; inside_now boolean;
begin
 select sp.id,sp.team_id,sp.territory_id,om.branch_id into profile_row
 from public.sales_profiles sp
 left join public.organization_memberships om on om.organization_id=sp.organization_id and om.user_id=sp.user_id and om.status='active'
 where sp.organization_id=new.organization_id and sp.id=(select s.sales_profile_id from public.location_tracking_sessions s where s.organization_id=new.organization_id and s.id=new.session_id);

 insert into public.location_latest_positions(organization_id,user_id,session_id,sales_profile_id,branch_id,team_id,territory_id,device_id,point_id,latitude,longitude,accuracy_m,source,recorded_at,received_at)
 values(new.organization_id,new.user_id,new.session_id,profile_row.id,profile_row.branch_id,profile_row.team_id,profile_row.territory_id,new.device_id,new.id,new.latitude,new.longitude,new.accuracy_m,new.source,new.recorded_at,new.received_at)
 on conflict(organization_id,user_id) do update set session_id=excluded.session_id,sales_profile_id=excluded.sales_profile_id,branch_id=excluded.branch_id,team_id=excluded.team_id,territory_id=excluded.territory_id,device_id=excluded.device_id,point_id=excluded.point_id,latitude=excluded.latitude,longitude=excluded.longitude,accuracy_m=excluded.accuracy_m,source=excluded.source,recorded_at=excluded.recorded_at,received_at=excluded.received_at
 where excluded.recorded_at>=public.location_latest_positions.recorded_at;

 for fence in select g.* from public.location_geofences g where g.organization_id=new.organization_id and g.status='active' and new.accuracy_m<=g.accuracy_limit_m loop
  inside_now:=extensions.st_covers(fence.boundary::extensions.geometry,new.location::extensions.geometry);
  select * into prior from public.location_geofence_presence p where p.organization_id=new.organization_id and p.session_id=new.session_id and p.geofence_id=fence.id for update;
  if not found then
   insert into public.location_geofence_presence(organization_id,session_id,geofence_id,is_inside,entered_at,last_point_id) values(new.organization_id,new.session_id,fence.id,inside_now,case when inside_now then new.recorded_at else null end,new.id);
   if inside_now and 'enter'=any(fence.event_types) then
    insert into public.location_geofence_events(organization_id,geofence_id,session_id,location_point_id,event_type,occurred_at) values(new.organization_id,fence.id,new.session_id,new.id,'enter',new.recorded_at) on conflict do nothing;
   end if;
  else
   if prior.is_inside is distinct from inside_now then
    if inside_now and 'enter'=any(fence.event_types) then
     insert into public.location_geofence_events(organization_id,geofence_id,session_id,location_point_id,event_type,occurred_at) values(new.organization_id,fence.id,new.session_id,new.id,'enter',new.recorded_at) on conflict do nothing;
    elsif not inside_now and 'exit'=any(fence.event_types) then
     insert into public.location_geofence_events(organization_id,geofence_id,session_id,location_point_id,event_type,occurred_at) values(new.organization_id,fence.id,new.session_id,new.id,'exit',new.recorded_at) on conflict do nothing;
    end if;
    update public.location_geofence_presence set is_inside=inside_now,entered_at=case when inside_now then new.recorded_at else null end,last_point_id=new.id,dwell_emitted_at=null,updated_at=now() where organization_id=new.organization_id and session_id=new.session_id and geofence_id=fence.id;
   else
    update public.location_geofence_presence set last_point_id=new.id,updated_at=now() where organization_id=new.organization_id and session_id=new.session_id and geofence_id=fence.id;
   end if;
   if inside_now and fence.dwell_seconds>0 and prior.dwell_emitted_at is null and prior.entered_at is not null and new.recorded_at>=prior.entered_at+make_interval(secs=>fence.dwell_seconds) and 'dwell'=any(fence.event_types) then
    insert into public.location_geofence_events(organization_id,geofence_id,session_id,location_point_id,event_type,occurred_at) values(new.organization_id,fence.id,new.session_id,new.id,'dwell',new.recorded_at) on conflict do nothing;
    update public.location_geofence_presence set dwell_emitted_at=new.recorded_at where organization_id=new.organization_id and session_id=new.session_id and geofence_id=fence.id;
   end if;
  end if;
 end loop;

 with ordered as(select location,recorded_at,lag(location) over(order by recorded_at,id) prev from public.location_points where organization_id=new.organization_id and session_id=new.session_id and recorded_at::date=new.recorded_at::date),
 agg as(select count(*)::integer n,min(recorded_at) s,max(recorded_at) e,coalesce(sum(extensions.st_distance(location,prev)) filter(where prev is not null),0)::double precision d,case when count(*)>=2 then extensions.st_makeline(array_agg(location::extensions.geometry order by recorded_at)) else null end r from ordered)
 insert into public.location_route_summaries(organization_id,session_id,route_date,started_at,ended_at,point_count,distance_m,route,computed_at)
 select new.organization_id,new.session_id,new.recorded_at::date,s,e,n,d,r,now() from agg
 on conflict(organization_id,session_id,route_date) do update set started_at=excluded.started_at,ended_at=excluded.ended_at,point_count=excluded.point_count,distance_m=excluded.distance_m,route=excluded.route,computed_at=now();

 perform realtime.send(jsonb_build_object('organization_id',new.organization_id,'session_id',new.session_id,'user_id',new.user_id,'point_id',new.id,'recorded_at',new.recorded_at,'event_type','location.updated'),'location.updated','location:'||new.organization_id::text||':live',true);
 perform pg_notify('salesx_location',jsonb_build_object('organization_id',new.organization_id,'session_id',new.session_id,'user_id',new.user_id,'point_id',new.id,'recorded_at',new.recorded_at,'event_type','location.updated')::text);
 return null;
end $$;
revoke all on function private.location_after_point_insert() from public,anon,authenticated;
drop trigger if exists location_points_after_insert on public.location_points;
create trigger location_points_after_insert after insert on public.location_points for each row execute function private.location_after_point_insert();
insert into public.permissions(key,resource,action,description) values
 ('location.live.read','location.live','read','Subscribe to private organization live location updates'),
 ('location.access.audit.read','location.access.audit','read','Read location access audit records')
on conflict(key) do update set resource=excluded.resource,action=excluded.action,description=excluded.description;
comment on table public.location_latest_positions is 'Server-maintained latest position projection; clients read through FastAPI only.';
comment on table public.location_access_audit is 'Append-only audit of privileged location map and route-history reads.';
