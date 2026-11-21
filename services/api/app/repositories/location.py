import json

class LocationRepository:
    async def create_session(self, db, org, profile_id, actor, shift_id, device_id, consent_policy_version):
        return await db.fetchrow("""insert into public.location_tracking_sessions
          (organization_id,sales_profile_id,user_id,shift_id,device_id,consented_at,consent_policy_version)
          values($1,$2,$3,$4,$5,now(),$6) returning *""",
          org,profile_id,actor,shift_id,device_id,consent_policy_version)

    async def update_session(self, db, org, session_id, status, ended):
        return await db.fetchrow("""update public.location_tracking_sessions set status=$3,
          ended_at=case when $4 then now() else null end,updated_at=now()
          where organization_id=$1 and id=$2 returning *""",org,session_id,status,ended)

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

    async def create_geofence(self, db, org, actor, payload):
        return await db.fetchrow("""insert into public.location_geofences
          (organization_id,code,name,geofence_type,outlet_id,territory_id,boundary,event_types,dwell_seconds,accuracy_limit_m,created_by)
          values($1,$2,$3,$4,$5,$6,extensions.st_geogfromgeojson($7::json),$8,$9,$10,$11)
          returning id,organization_id,code,name,geofence_type,outlet_id,territory_id,event_types,dwell_seconds,
          accuracy_limit_m,status,created_at,updated_at""",
          org,payload.code.upper(),payload.name,payload.geofence_type,payload.outlet_id,payload.territory_id,
          json.dumps(payload.boundary_geojson),payload.event_types,payload.dwell_seconds,payload.accuracy_limit_m,actor)

location_repository=LocationRepository()
