from __future__ import annotations
import json
from datetime import UTC, datetime, timedelta
from uuid import UUID
import asyncpg
from app.errors import APIError

class LocationService:
    def _tenant(self, org, tenant):
        if tenant.organization_id != org:
            raise APIError(403, "tenant_scope_mismatch", "Location access is restricted to the active organization.")

    async def visible_profiles(self, db, org, actor):
        rows = await db.fetch("""select sp.id from public.sales_profiles sp
          left join public.organization_memberships om on om.organization_id=sp.organization_id and om.user_id=sp.user_id and om.status='active'
          where sp.organization_id=$1 and sp.status='active' and (
            sp.user_id=$2 or exists(select 1 from public.user_role_assignments ura
              join public.roles r on r.id=ura.role_id join public.organization_memberships m on m.id=ura.membership_id
              where m.organization_id=$1 and m.user_id=$2 and m.status='active' and ura.revoked_at is null
                and ura.starts_at<=now() and (ura.expires_at is null or ura.expires_at>now())
                and ((r.key in ('tenant_owner','tenant_admin','company_admin') and ura.scope_type in ('organization','tenant'))
                  or (ura.scope_type='team' and ura.scope_id=sp.team_id)
                  or (ura.scope_type='branch' and ura.scope_id=om.branch_id)
                  or (ura.scope_type='territory' and ura.scope_id=sp.territory_id)))
            or exists(select 1 from public.teams t where t.organization_id=$1 and t.id=sp.team_id and t.supervisor_user_id=$2))""", org, actor)
        return [r["id"] for r in rows]

    async def profile_allowed(self, db, org, actor, profile):
        return profile in await self.visible_profiles(db, org, actor)

    async def start(self, db, org, tenant, actor, payload):
        self._tenant(org, tenant)
        async with db.transaction():
            profile = await db.fetchrow("""select id from public.sales_profiles where organization_id=$1 and user_id=$2
              and status='active' and effective_from<=current_date and (effective_until is null or effective_until>=current_date) for update""", org, actor)
            if not profile:
                raise APIError(403, "sales_profile_required", "An active Sales profile is required to start location tracking.")
            if payload.shift_id:
                shift = await db.fetchval("""select exists(select 1 from public.smartteam_shifts where organization_id=$1
                  and id=$2 and user_id=$3 and sales_profile_id=$4 and clock_out_at is null)""", org, payload.shift_id, actor, profile["id"])
                if not shift:
                    raise APIError(409, "location_shift_not_active", "The selected shift is not active for this Sales user.")
            try:
                row = await db.fetchrow("""insert into public.location_tracking_sessions
                  (organization_id,sales_profile_id,user_id,shift_id,device_id,consented_at,consent_policy_version)
                  values($1,$2,$3,$4,$5,now(),$6) returning *""",
                  org, profile["id"], actor, payload.shift_id, payload.device_id, payload.consent_policy_version)
            except asyncpg.UniqueViolationError as exc:
                raise APIError(409, "location_session_already_active", "A location session is already active for this user.") from exc
            await db.execute("""insert into public.admin_audit_logs(actor_user_id,organization_id,action,resource_type,resource_id,metadata)
              values($1,$2,'location.session.started','location_session',$3::text,$4::jsonb)""",
              actor, org, row["id"], json.dumps({"device_id":payload.device_id,"consent_policy_version":payload.consent_policy_version}))
            return dict(row)

    async def update_session(self, db, org, tenant, actor, session_id, payload):
        self._tenant(org, tenant)
        transitions = {"pause": (("active",), "paused"), "resume": (("paused",), "active"),
          "stop": (("active","paused"), "completed"), "revoke": (("active","paused"), "revoked")}
        allowed, target = transitions[payload.action]
        async with db.transaction():
            row = await db.fetchrow("select * from public.location_tracking_sessions where organization_id=$1 and id=$2 for update", org, session_id)
            if not row:
                raise APIError(404, "location_session_not_found", "Location session was not found.")
            if row["user_id"] != actor and not await self.profile_allowed(db, org, actor, row["sales_profile_id"]):
                raise APIError(403, "location_session_forbidden", "The session is outside your authorized scope.")
            if row["status"] not in allowed:
                raise APIError(409, "location_session_transition_invalid", "The requested location session transition is not valid.")
            updated = await db.fetchrow("""update public.location_tracking_sessions set status=$3,
              ended_at=case when $4 then now() else null end,updated_at=now()
              where organization_id=$1 and id=$2 returning *""", org, session_id, target, target in {"completed","revoked"})
            await db.execute("""insert into public.admin_audit_logs(actor_user_id,organization_id,action,resource_type,resource_id,metadata)
              values($1,$2,$3,'location_session',$4::text,$5::jsonb)""", actor, org, "location.session."+payload.action, session_id, json.dumps({"reason":payload.reason}))
            return dict(updated)

    async def ingest(self, db, org, tenant, actor, session_id, device_id, payload):
        self._tenant(org, tenant)
        now = datetime.now(UTC)
        async with db.transaction():
            session = await db.fetchrow("select * from public.location_tracking_sessions where organization_id=$1 and id=$2 for update", org, session_id)
            if not session:
                raise APIError(404, "location_session_not_found", "Location session was not found.")
            if session["user_id"] != actor or session["device_id"] != device_id:
                raise APIError(403, "location_device_owner_mismatch", "Location session is bound to another user or device.")
            if session["status"] != "active" or session["ended_at"] is not None:
                raise APIError(409, "location_session_not_active", "Location points can only be uploaded to an active session.")
            accepted = duplicates = 0
            for point in payload.points:
                stamp = point.recorded_at
                if stamp.tzinfo is None or stamp > now+timedelta(minutes=5) or stamp < now-timedelta(days=30):
                    raise APIError(422, "location_timestamp_invalid", "Location timestamps must include timezone and be within the last 30 days.")
                inserted = await db.fetchval("""insert into public.location_points
                  (organization_id,session_id,user_id,device_id,client_point_id,recorded_at,latitude,longitude,accuracy_m,
                   altitude_m,speed_mps,heading_deg,source,metadata)
                  values($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14::jsonb)
                  on conflict(organization_id,session_id,client_point_id) do nothing returning id""",
                  org, session_id, actor, device_id, point.client_point_id, stamp, point.latitude, point.longitude,
                  point.accuracy_m, point.altitude_m, point.speed_mps, point.heading_deg, point.source, json.dumps(point.metadata))
                if inserted: accepted += 1
                else: duplicates += 1
            return {"session_id":session_id,"accepted":accepted,"duplicates":duplicates,"received":len(payload.points)}

    async def live(self, db, org, tenant, actor):
        self._tenant(org, tenant)
        ids = await self.visible_profiles(db, org, actor)
        rows = await db.fetch("""select l.organization_id,l.user_id,l.sales_profile_id,l.branch_id,l.team_id,l.territory_id,
          l.session_id,l.latitude,l.longitude,l.accuracy_m,l.source,l.recorded_at,l.received_at,
          (l.recorded_at < now()-interval '15 minutes') stale
          from public.location_latest_positions l where l.organization_id=$1 and l.sales_profile_id=any($2::uuid[])
          order by l.recorded_at desc limit 500""", org, ids)
        await db.execute("""insert into public.location_access_audit(organization_id,actor_user_id,resource_type,action)
          values($1,$2,'live_map','read')""", org, actor)
        return [dict(r) for r in rows]

    async def history(self, db, org, tenant, actor, from_at, to_at, profile_id, page, size):
        self._tenant(org, tenant)
        now=datetime.now(UTC); end=to_at or now; start=from_at or end-timedelta(days=7)
        if start.tzinfo is None or end.tzinfo is None or end<=start or end-start>timedelta(days=31) or end>now+timedelta(minutes=5):
            raise APIError(422,"location_history_window_invalid","Location history requires a timezone-aware window of at most 31 days.")
        ids=await self.visible_profiles(db,org,actor)
        if profile_id and profile_id not in ids:
            raise APIError(403,"location_profile_scope_forbidden","The requested Sales profile is outside your authorized scope.")
        total=await db.fetchval("""select count(*) from public.location_points p join public.location_tracking_sessions s
          on s.organization_id=p.organization_id and s.id=p.session_id
          where p.organization_id=$1 and s.sales_profile_id=any($2::uuid[]) and ($3::uuid is null or s.sales_profile_id=$3)
          and p.recorded_at >= $4 and p.recorded_at < $5""",org,ids,profile_id,start,end)
        rows=await db.fetch("""select p.id,p.session_id,p.user_id,p.client_point_id,p.recorded_at,p.received_at,
          p.latitude,p.longitude,p.accuracy_m,p.altitude_m,p.speed_mps,p.heading_deg,p.source
          from public.location_points p join public.location_tracking_sessions s
          on s.organization_id=p.organization_id and s.id=p.session_id
          where p.organization_id=$1 and s.sales_profile_id=any($2::uuid[]) and ($3::uuid is null or s.sales_profile_id=$3)
          and p.recorded_at >= $4 and p.recorded_at < $5 order by p.recorded_at desc,p.id desc limit $6 offset $7""",
          org,ids,profile_id,start,end,size,(page-1)*size)
        await db.execute("""insert into public.location_access_audit(organization_id,actor_user_id,resource_type,action,filters)
          values($1,$2,'route_history','read',$3::jsonb)""",org,actor,json.dumps({"from":start.isoformat(),"to":end.isoformat()}))
        return {"items":[dict(r) for r in rows],"page":page,"page_size":size,"total":int(total or 0),"from_at":start,"to_at":end}

    async def routes(self, db, org, tenant, actor, from_date, to_date, profile_id):
        self._tenant(org,tenant); ids=await self.visible_profiles(db,org,actor)
        if profile_id and profile_id not in ids:
            raise APIError(403,"location_profile_scope_forbidden","The requested Sales profile is outside your authorized scope.")
        start=from_date or (datetime.now(UTC).date()-timedelta(days=7)); end=to_date or datetime.now(UTC).date()
        if end<start or (end-start).days>31:
            raise APIError(422,"location_route_window_invalid","Route history window must be within 31 days.")
        rows=await db.fetch("""select r.id,r.organization_id,r.session_id,r.route_date,r.started_at,r.ended_at,r.point_count,r.distance_m,extensions.st_asgeojson(r.route)::json route_geojson,r.computed_at,s.sales_profile_id,s.user_id from public.location_route_summaries r
          join public.location_tracking_sessions s on s.organization_id=r.organization_id and s.id=r.session_id
          where r.organization_id=$1 and s.sales_profile_id=any($2::uuid[]) and ($3::uuid is null or s.sales_profile_id=$3)
          and r.route_date between $4 and $5 order by r.route_date desc,r.started_at desc""",org,ids,profile_id,start,end)
        await db.execute("""insert into public.location_access_audit(organization_id,actor_user_id,resource_type,action,filters)
          values($1,$2,'route_history','read',$3::jsonb)""",org,actor,json.dumps({"from_date":str(start),"to_date":str(end)}))
        return [dict(r) for r in rows]


    async def geofence_events(self, db, org, tenant, actor, page=1, size=100):
        self._tenant(org, tenant)
        ids = await self.visible_profiles(db, org, actor)
        rows = await db.fetch("""select e.id,e.geofence_id,g.name geofence_name,e.session_id,e.location_point_id,
          e.event_type,e.occurred_at,s.sales_profile_id,s.user_id
          from public.location_geofence_events e
          join public.location_geofences g on g.organization_id=e.organization_id and g.id=e.geofence_id
          join public.location_tracking_sessions s on s.organization_id=e.organization_id and s.id=e.session_id
          where e.organization_id=$1 and s.sales_profile_id=any($2::uuid[])
          order by e.occurred_at desc,e.id desc limit $3 offset $4""",org,ids,size,(page-1)*size)
        total = await db.fetchval("""select count(*) from public.location_geofence_events e
          join public.location_tracking_sessions s on s.organization_id=e.organization_id and s.id=e.session_id
          where e.organization_id=$1 and s.sales_profile_id=any($2::uuid[])""",org,ids)
        await db.execute("""insert into public.location_access_audit(organization_id,actor_user_id,resource_type,action,filters)
          values($1,$2,'geofence','read',$3::jsonb)""",org,actor,json.dumps({"page":page,"page_size":size}))
        return {"items":[dict(r) for r in rows],"page":page,"page_size":size,"total":int(total or 0)}

location_service=LocationService()
