-- Phase 07 database lifecycle validation.
-- Rollback-only synthetic fixtures: never persists Auth, tenant, shift or GPS data.
begin;

do $$
declare
  v_user uuid := gen_random_uuid();
  v_org uuid := gen_random_uuid();
  v_branch uuid := gen_random_uuid();
  v_team uuid := gen_random_uuid();
  v_territory uuid := gen_random_uuid();
  v_membership uuid;
  v_profile uuid := gen_random_uuid();
  v_shift uuid := gen_random_uuid();
  v_auth_session uuid := gen_random_uuid();
  v_device text := 'phase07-fixture-' || gen_random_uuid()::text;
  v_tracking uuid := gen_random_uuid();
  v_geofence uuid := gen_random_uuid();
  v_p1 uuid;
  v_p2 uuid;
  v_p3 uuid;
  v_p4 uuid;
  v_t0 timestamptz := now() - interval '60 seconds';
  v_presence record;
  v_latest uuid;
  v_route record;
  v_events integer;
  v_points integer;
begin
  insert into auth.users
    (id,aud,role,email,encrypted_password,email_confirmed_at,raw_app_meta_data,
     raw_user_meta_data,created_at,updated_at)
  values
    (v_user,'authenticated','authenticated',
     'phase07-'||v_user::text||'@salesx.invalid','fixture-only-no-login',now(),
     '{"provider":"email","providers":["email"]}'::jsonb,
     '{"display_name":"Phase 07 isolated GPS fixture"}'::jsonb,now(),now());

  insert into public.organizations(id,slug,name,status,created_by)
  values(v_org,'phase07-'||v_org::text,'Phase 07 isolated location fixture','active',v_user);

  insert into public.branches(id,organization_id,code,name,status)
  values(v_branch,v_org,'P07-'||left(v_branch::text,8),'Phase 07 Branch','active');

  insert into public.teams(id,organization_id,branch_id,code,name,status)
  values(v_team,v_org,v_branch,'P07T-'||left(v_team::text,8),'Phase 07 Team','active');

  insert into public.territories(id,organization_id,branch_id,code,name,status)
  values(v_territory,v_org,v_branch,'P07R-'||left(v_territory::text,8),'Phase 07 Territory','active');

  insert into public.organization_memberships(organization_id,user_id,branch_id,status,joined_at)
  values(v_org,v_user,v_branch,'active',now())
  returning id into v_membership;

  insert into public.sales_profiles(id,organization_id,user_id,team_id,territory_id,membership_id,status)
  values(v_profile,v_org,v_user,v_team,v_territory,v_membership,'active');

  insert into public.smartteam_shifts(
    id,organization_id,sales_profile_id,user_id,branch_id,team_id,shift_date,
    status,clock_in_at,idempotency_key,created_by
  )
  values(
    v_shift,v_org,v_profile,v_user,v_branch,v_team,current_date,
    'active',v_t0,'phase07:'||v_shift::text,v_user
  );

  insert into auth.sessions(id,user_id,created_at,updated_at,not_after)
  values(v_auth_session,v_user,now(),now(),now()+interval '1 hour');

  insert into public.session_devices(auth_session_id,user_id,device_id,platform)
  values(v_auth_session,v_user,v_device,'android');

  insert into public.location_tracking_sessions(
    id,organization_id,sales_profile_id,user_id,shift_id,device_id,
    consented_at,consent_policy_version,status
  )
  values(
    v_tracking,v_org,v_profile,v_user,v_shift,v_device,
    now(),'salesx-location-consent-v1','active'
  );

  insert into public.location_geofences(
    id,organization_id,code,name,geofence_type,boundary,event_types,
    dwell_seconds,accuracy_limit_m,status,created_by
  )
  values(
    v_geofence,v_org,'P07-GEOFENCE','Phase 07 Fixture Geofence','custom',
    extensions.st_geomfromtext(
      'POLYGON((106.79 -6.21,106.81 -6.21,106.81 -6.19,106.79 -6.19,106.79 -6.21))',
      4326
    )::extensions.geography,
    array['enter','exit','dwell'],5,100,'active',v_user
  );

  insert into public.location_points(
    organization_id,session_id,user_id,device_id,client_point_id,recorded_at,
    latitude,longitude,accuracy_m,source,metadata
  )
  values(
    v_org,v_tracking,v_user,v_device,'p1',v_t0,
    -6.200000,106.800000,5,'gps',
    '{}'::jsonb
  ) returning id into v_p1;

  insert into public.location_points(
    organization_id,session_id,user_id,device_id,client_point_id,recorded_at,
    latitude,longitude,accuracy_m,source,metadata
  )
  values(
    v_org,v_tracking,v_user,v_device,'p2',v_t0+interval '10 seconds',
    -6.200100,106.800100,5,'gps',
    '{}'::jsonb
  ) returning id into v_p2;

  insert into public.location_points(
    organization_id,session_id,user_id,device_id,client_point_id,recorded_at,
    latitude,longitude,accuracy_m,source,metadata
  )
  values(
    v_org,v_tracking,v_user,v_device,'p3',v_t0+interval '20 seconds',
    -6.220000,106.820000,5,'gps',
    '{}'::jsonb
  ) returning id into v_p3;

  -- Delayed offline point: older than p3 and must not rewind current state.
  insert into public.location_points(
    organization_id,session_id,user_id,device_id,client_point_id,recorded_at,
    latitude,longitude,accuracy_m,source,metadata
  )
  values(
    v_org,v_tracking,v_user,v_device,'p4-delayed',v_t0+interval '5 seconds',
    -6.200000,106.800000,5,'gps',
    '{"offline_batch":true}'::jsonb
  ) returning id into v_p4;

  -- Duplicate client point ID is a no-op under the same idempotency key.
  insert into public.location_points(
    organization_id,session_id,user_id,device_id,client_point_id,recorded_at,
    latitude,longitude,accuracy_m,source,metadata
  )
  values(
    v_org,v_tracking,v_user,v_device,'p1',v_t0,
    -6.200000,106.800000,5,'gps',
    '{}'::jsonb
  )
  on conflict(organization_id,session_id,client_point_id) do nothing;

  select * into v_presence
  from public.location_geofence_presence
  where organization_id=v_org and session_id=v_tracking and geofence_id=v_geofence;

  select point_id into v_latest
  from public.location_latest_positions
  where organization_id=v_org and user_id=v_user;

  select * into v_route
  from public.location_route_summaries
  where organization_id=v_org and session_id=v_tracking and route_date=v_t0::date;

  select count(*) into v_events
  from public.location_geofence_events
  where organization_id=v_org and session_id=v_tracking and geofence_id=v_geofence;

  select count(*) into v_points
  from public.location_points
  where organization_id=v_org and session_id=v_tracking;

  if v_presence.is_inside is distinct from false or v_presence.last_point_id is distinct from v_p3 then
    raise exception 'P07 geofence chronology failed: delayed point rewound presence state';
  end if;
  if v_latest is distinct from v_p3 then
    raise exception 'P07 live projection failed: latest position is not the newest timestamp';
  end if;
  if v_events<>3 then
    raise exception 'P07 geofence event lifecycle failed: expected enter/dwell/exit, got %',v_events;
  end if;
  if v_points<>4 then
    raise exception 'P07 point deduplication failed: expected 4 unique points, got %',v_points;
  end if;
  if v_route.point_count<>4 or v_route.distance_m<=0 or v_route.route is null then
    raise exception 'P07 route reconstruction failed: route summary is incomplete';
  end if;

  raise notice 'P07 PASS: shift-bound session, GPS ingest, offline chronology, dedup, enter/dwell/exit, latest projection, route summary';
end;
$$;

rollback;
