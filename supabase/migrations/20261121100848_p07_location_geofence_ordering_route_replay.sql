-- Phase 07: monotonic geofence state and indexed route replay.
-- GPS points remain append-only. Out-of-order points remain in history and
-- route reconstruction, but cannot rewind the live geofence state machine.
create index if not exists idx_location_points_route_replay
  on public.location_points(organization_id, session_id, recorded_at, id);

create or replace function private.location_after_point_insert()
returns trigger
language plpgsql
security definer
set search_path=pg_catalog,public,extensions,private,realtime
as $$
declare
  profile_row record;
  fence record;
  prior record;
  inside_now boolean;
begin
  select sp.id, sp.team_id, sp.territory_id, om.branch_id
    into profile_row
  from public.sales_profiles sp
  left join public.organization_memberships om
    on om.organization_id=sp.organization_id
   and om.user_id=sp.user_id
   and om.status='active'
  where sp.organization_id=new.organization_id
    and sp.id=(
      select s.sales_profile_id
      from public.location_tracking_sessions s
      where s.organization_id=new.organization_id and s.id=new.session_id
    );

  insert into public.location_latest_positions(
    organization_id,user_id,session_id,sales_profile_id,branch_id,team_id,territory_id,
    device_id,point_id,latitude,longitude,accuracy_m,source,recorded_at,received_at
  )
  values(
    new.organization_id,new.user_id,new.session_id,profile_row.id,profile_row.branch_id,
    profile_row.team_id,profile_row.territory_id,new.device_id,new.id,new.latitude,
    new.longitude,new.accuracy_m,new.source,new.recorded_at,new.received_at
  )
  on conflict(organization_id,user_id) do update set
    session_id=excluded.session_id,
    sales_profile_id=excluded.sales_profile_id,
    branch_id=excluded.branch_id,
    team_id=excluded.team_id,
    territory_id=excluded.territory_id,
    device_id=excluded.device_id,
    point_id=excluded.point_id,
    latitude=excluded.latitude,
    longitude=excluded.longitude,
    accuracy_m=excluded.accuracy_m,
    source=excluded.source,
    recorded_at=excluded.recorded_at,
    received_at=excluded.received_at
  where excluded.recorded_at>=public.location_latest_positions.recorded_at;

  for fence in
    select g.*
    from public.location_geofences g
    where g.organization_id=new.organization_id
      and g.status='active'
      and new.accuracy_m<=g.accuracy_limit_m
  loop
    inside_now:=extensions.st_covers(
      fence.boundary::extensions.geometry,
      new.location::extensions.geometry
    );

    select p.*, lp.recorded_at as last_recorded_at
      into prior
    from public.location_geofence_presence p
    join public.location_points lp
      on lp.organization_id=p.organization_id and lp.id=p.last_point_id
    where p.organization_id=new.organization_id
      and p.session_id=new.session_id
      and p.geofence_id=fence.id
    for update of p;

    if not found then
      insert into public.location_geofence_presence(
        organization_id,session_id,geofence_id,is_inside,entered_at,last_point_id
      )
      values(
        new.organization_id,new.session_id,fence.id,inside_now,
        case when inside_now then new.recorded_at else null end,new.id
      );

      if inside_now and 'enter'=any(fence.event_types) then
        insert into public.location_geofence_events(
          organization_id,geofence_id,session_id,location_point_id,event_type,occurred_at
        )
        values(new.organization_id,fence.id,new.session_id,new.id,'enter',new.recorded_at)
        on conflict do nothing;
      end if;
    else
      -- Preserve chronological state when an offline batch arrives out of order.
      if new.recorded_at<=prior.last_recorded_at then
        continue;
      end if;

      if prior.is_inside is distinct from inside_now then
        if inside_now and 'enter'=any(fence.event_types) then
          insert into public.location_geofence_events(
            organization_id,geofence_id,session_id,location_point_id,event_type,occurred_at
          )
          values(new.organization_id,fence.id,new.session_id,new.id,'enter',new.recorded_at)
          on conflict do nothing;
        elsif not inside_now and 'exit'=any(fence.event_types) then
          insert into public.location_geofence_events(
            organization_id,geofence_id,session_id,location_point_id,event_type,occurred_at
          )
          values(new.organization_id,fence.id,new.session_id,new.id,'exit',new.recorded_at)
          on conflict do nothing;
        end if;

        update public.location_geofence_presence
        set is_inside=inside_now,
            entered_at=case when inside_now then new.recorded_at else null end,
            last_point_id=new.id,
            dwell_emitted_at=null,
            updated_at=now()
        where organization_id=new.organization_id
          and session_id=new.session_id
          and geofence_id=fence.id;
      else
        update public.location_geofence_presence
        set last_point_id=new.id,updated_at=now()
        where organization_id=new.organization_id
          and session_id=new.session_id
          and geofence_id=fence.id;
      end if;

      if inside_now
        and fence.dwell_seconds>0
        and prior.dwell_emitted_at is null
        and prior.entered_at is not null
        and new.recorded_at>=prior.entered_at+make_interval(secs=>fence.dwell_seconds)
        and 'dwell'=any(fence.event_types)
      then
        insert into public.location_geofence_events(
          organization_id,geofence_id,session_id,location_point_id,event_type,occurred_at
        )
        values(new.organization_id,fence.id,new.session_id,new.id,'dwell',new.recorded_at)
        on conflict do nothing;

        update public.location_geofence_presence
        set dwell_emitted_at=new.recorded_at
        where organization_id=new.organization_id
          and session_id=new.session_id
          and geofence_id=fence.id;
      end if;
    end if;
  end loop;

  with ordered as (
    select location,recorded_at,
      lag(location) over(order by recorded_at,id) prev
    from public.location_points
    where organization_id=new.organization_id
      and session_id=new.session_id
      and recorded_at::date=new.recorded_at::date
  ),
  agg as (
    select count(*)::integer n,
      min(recorded_at) s,
      max(recorded_at) e,
      coalesce(sum(extensions.st_distance(location,prev)) filter(where prev is not null),0)::double precision d,
      case when count(*)>=2
        then extensions.st_makeline(array_agg(location::extensions.geometry order by recorded_at))
        else null
      end r
    from ordered
  )
  insert into public.location_route_summaries(
    organization_id,session_id,route_date,started_at,ended_at,point_count,distance_m,route,computed_at
  )
  select new.organization_id,new.session_id,new.recorded_at::date,s,e,n,d,r,now()
  from agg
  on conflict(organization_id,session_id,route_date) do update set
    started_at=excluded.started_at,
    ended_at=excluded.ended_at,
    point_count=excluded.point_count,
    distance_m=excluded.distance_m,
    route=excluded.route,
    computed_at=now();

  perform realtime.send(
    jsonb_build_object(
      'organization_id',new.organization_id,
      'session_id',new.session_id,
      'user_id',new.user_id,
      'point_id',new.id,
      'recorded_at',new.recorded_at,
      'event_type','location.updated'
    ),
    'location.updated',
    'location:'||new.organization_id::text||':live',
    true
  );

  perform pg_notify(
    'salesx_location',
    jsonb_build_object(
      'organization_id',new.organization_id,
      'session_id',new.session_id,
      'user_id',new.user_id,
      'point_id',new.id,
      'recorded_at',new.recorded_at,
      'event_type','location.updated'
    )::text
  );

  return null;
end;
$$;

revoke all on function private.location_after_point_insert() from public,anon,authenticated;
