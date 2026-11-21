import json

class LocationRepository:
    async def create_session(self, db, org, profile_id, actor, shift_id, device_id, consent_policy_version):
        return await db.fetchrow("""insert into public.location_tracking_sessions
          (organization_id,sales_profile_id,user_id,shift_id,device_id,consented_at,consent_policy_version)
          values($1,$2,$3,$4,$5,now(),$6) returning *""",
          org,profile_id,actor,shift_id,device_id,consent_policy_version)

    async def update_session(self, db, org, session_id, status, ended, ended_at=None):
        return await db.fetchrow("""update public.location_tracking_sessions set status=$3,
          ended_at=case when $4 then coalesce($5,now()) else null end,updated_at=now()
          where organization_id=$1 and id=$2 returning *""",org,session_id,status,ended,ended_at)

    async def insert_point(self, db, org, session_id, actor, device_id, point):
        return await db.fetchval("""insert into public.location_points
          (organization_id,session_id,user_id,device_id,client_point_id,recorded_at,latitude,longitude,accuracy_m,
           altitude_m,speed_mps,heading_deg,source,metadata)
          values($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14::jsonb)
          on conflict(organization_id,session_id,client_point_id) do nothing returning id""",
          org,session_id,actor,device_id,point.client_point_id,point.recorded_at,point.latitude,point.longitude,
          point.accuracy_m,point.altitude_m,point.speed_mps,point.heading_deg,point.source,json.dumps(point.metadata))

    async def audit_session(self, db, actor, org, action, resource_id, metadata):
        return await db.execute("""insert into public.admin_audit_logs(actor_user_id,organization_id,action,resource_type,resource_id,metadata)
          values($1,$2,$3,'location_session',$4::text,$5::jsonb)""",actor,org,action,resource_id,json.dumps(metadata))

    async def audit_access(self, db, org, actor, resource_type, action, filters=None):
        return await db.execute("""insert into public.location_access_audit(organization_id,actor_user_id,resource_type,action,filters)
          values($1,$2,$3,$4,$5::jsonb)""",org,actor,resource_type,action,json.dumps(filters or {}))

    async def list_geofences(self, db, org, actor):
        return await db.fetch("""select g.id,g.organization_id,g.code,g.name,g.geofence_type,
          g.outlet_id,g.territory_id,g.event_types,g.dwell_seconds,g.accuracy_limit_m,
          g.status,g.created_at,g.updated_at,
          extensions.st_asgeojson(g.boundary)::jsonb as boundary_geojson
          from public.location_geofences g
          left join public.outlets o on o.organization_id=g.organization_id and o.id=g.outlet_id
          left join public.territories t on t.organization_id=g.organization_id and t.id=g.territory_id
          where g.organization_id=$1 and (
            exists(select 1 from public.organization_memberships m
              join public.user_role_assignments ura on ura.membership_id=m.id
              join public.roles r on r.id=ura.role_id
              join public.role_permissions rp on rp.role_id=ura.role_id
                and rp.permission_key='location.geofences.read'
              where m.organization_id=g.organization_id and m.user_id=$2 and m.status='active'
                and ura.revoked_at is null and ura.starts_at<=now()
                and (ura.expires_at is null or ura.expires_at>now())
                and r.key in ('tenant_owner','tenant_admin','company_admin')
                and ura.scope_type in ('tenant','organization') and ura.scope_id=g.organization_id)
            or exists(select 1 from public.organization_memberships m
              join public.user_role_assignments ura on ura.membership_id=m.id
              join public.role_permissions rp on rp.role_id=ura.role_id
                and rp.permission_key='location.geofences.read'
              where m.organization_id=g.organization_id and m.user_id=$2 and m.status='active'
                and ura.revoked_at is null and ura.starts_at<=now()
                and (ura.expires_at is null or ura.expires_at>now())
                and ura.scope_type='branch' and ura.scope_id=coalesce(o.branch_id,t.branch_id))
            or exists(select 1 from public.organization_memberships m
              join public.user_role_assignments ura on ura.membership_id=m.id
              join public.role_permissions rp on rp.role_id=ura.role_id
                and rp.permission_key='location.geofences.read'
              where m.organization_id=g.organization_id and m.user_id=$2 and m.status='active'
                and ura.revoked_at is null and ura.starts_at<=now()
                and (ura.expires_at is null or ura.expires_at>now())
                and ura.scope_type='territory'
                and ura.scope_id=coalesce(g.territory_id,o.territory_id))
            or exists(select 1 from public.organization_memberships m
              join public.user_role_assignments ura on ura.membership_id=m.id
              join public.role_permissions rp on rp.role_id=ura.role_id
                and rp.permission_key='location.geofences.read'
              join public.sales_profiles sp on sp.organization_id=g.organization_id
                and sp.team_id=ura.scope_id and sp.status='active'
              where m.organization_id=g.organization_id and m.user_id=$2 and m.status='active'
                and ura.revoked_at is null and ura.starts_at<=now()
                and (ura.expires_at is null or ura.expires_at>now())
                and ura.scope_type='team'
                and sp.territory_id=coalesce(g.territory_id,o.territory_id))
            or exists(select 1 from public.teams supervised_team
              join public.sales_profiles supervised_profile
                on supervised_profile.organization_id=supervised_team.organization_id
               and supervised_profile.team_id=supervised_team.id
               and supervised_profile.status='active'
              where supervised_team.organization_id=g.organization_id
                and supervised_team.supervisor_user_id=$2
                and supervised_profile.territory_id=coalesce(g.territory_id,o.territory_id))
          )
          order by g.created_at desc""", org, actor)

    async def get_route_replay_context(self, db, org, route_id, visible_profile_ids):
        return await db.fetchrow("""select r.id,r.session_id,r.started_at,r.ended_at,
          r.route_date,r.point_count,s.sales_profile_id,s.user_id
          from public.location_route_summaries r
          join public.location_tracking_sessions s
            on s.organization_id=r.organization_id and s.id=r.session_id
          where r.organization_id=$1 and r.id=$2
            and s.sales_profile_id=any($3::uuid[])""", org, route_id, visible_profile_ids)

    async def count_route_replay_points(self, db, org, session_id, from_at, to_at):
        return await db.fetchval("""select count(*) from public.location_points
          where organization_id=$1 and session_id=$2
            and recorded_at >= $3 and recorded_at <= $4""",
          org, session_id, from_at, to_at)

    async def list_route_replay_points(self, db, org, session_id, from_at, to_at, page, size):
        return await db.fetch("""select id,session_id,user_id,client_point_id,recorded_at,received_at,
          latitude,longitude,accuracy_m,altitude_m,speed_mps,heading_deg,source
          from public.location_points
          where organization_id=$1 and session_id=$2
            and recorded_at >= $3 and recorded_at <= $4
          order by recorded_at asc,id asc limit $5 offset $6""",
          org, session_id, from_at, to_at, size, (page-1)*size)

    async def create_geofence(self, db, org, actor, payload):
        return await db.fetchrow("""insert into public.location_geofences
          (organization_id,code,name,geofence_type,outlet_id,territory_id,boundary,event_types,dwell_seconds,accuracy_limit_m,created_by)
          values($1,$2,$3,$4,$5,$6,extensions.st_geogfromgeojson($7::json),$8,$9,$10,$11)
          returning id,organization_id,code,name,geofence_type,outlet_id,territory_id,event_types,dwell_seconds,
          accuracy_limit_m,status,created_at,updated_at""",
          org,payload.code.upper(),payload.name,payload.geofence_type,payload.outlet_id,payload.territory_id,
          json.dumps(payload.boundary_geojson),payload.event_types,payload.dwell_seconds,payload.accuracy_limit_m,actor)

location_repository=LocationRepository()
