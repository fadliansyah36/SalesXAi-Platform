from __future__ import annotations
from datetime import UTC, datetime, timedelta
import asyncpg
from app.errors import APIError
from app.repositories.location import location_repository

class LocationService:
    def _tenant(self, org, tenant):
        if tenant.organization_id != org:
            raise APIError(403, "tenant_scope_mismatch", "Location access is restricted to the active organization.")

    async def visible_profiles(self, db, org, actor, permission_key="location.history.read"):
        rows = await db.fetch("""select sp.id from public.sales_profiles sp
          left join public.organization_memberships om
            on om.organization_id=sp.organization_id and om.user_id=sp.user_id and om.status='active'
          where sp.organization_id=$1 and sp.status='active' and (
            sp.user_id=$2
            or exists(select 1
              from public.user_role_assignments ura
              join public.roles r on r.id=ura.role_id
              join public.role_permissions rp on rp.role_id=ura.role_id and rp.permission_key=$3
              join public.organization_memberships m on m.id=ura.membership_id
              where m.organization_id=$1 and m.user_id=$2 and m.status='active'
                and ura.revoked_at is null and ura.starts_at<=now()
                and (ura.expires_at is null or ura.expires_at>now())
                and ((r.key in ('tenant_owner','tenant_admin','company_admin')
                      and ura.scope_type in ('organization','tenant') and ura.scope_id=$1)
                  or (ura.scope_type='team' and ura.scope_id=sp.team_id)
                  or (ura.scope_type='branch' and ura.scope_id=om.branch_id)
                  or (ura.scope_type='territory' and ura.scope_id=sp.territory_id)))
            or exists(select 1 from public.teams t
              where t.organization_id=$1 and t.id=sp.team_id and t.supervisor_user_id=$2))""",
          org, actor, permission_key)
        return [r["id"] for r in rows]

    async def profile_allowed(self, db, org, actor, profile, permission_key="location.live.read"):
        return profile in await self.visible_profiles(db, org, actor, permission_key)

    async def start(self, db, org, tenant, actor, auth_session_id, payload):
        self._tenant(org, tenant)
        async with db.transaction():
            registered_device = await db.fetchval("""select exists(select 1 from public.session_devices
              where auth_session_id=$1 and user_id=$2 and device_id=$3 and revoked_at is null
              and (expires_at is null or expires_at>now()))""", auth_session_id, actor, payload.device_id)
            if not registered_device:
                raise APIError(403, "location_device_not_registered", "The native device must be registered to the current authenticated session.")
            profile = await db.fetchrow("""select id from public.sales_profiles where organization_id=$1 and user_id=$2
              and status='active' and effective_from<=current_date and (effective_until is null or effective_until>=current_date) for update""", org, actor)
            if not profile:
                raise APIError(403, "sales_profile_required", "An active Sales profile is required to start location tracking.")
            shift = await db.fetchval("""select exists(select 1 from public.smartteam_shifts where organization_id=$1
              and id=$2 and user_id=$3 and sales_profile_id=$4 and clock_in_at is not null and clock_out_at is null)""",
              org, payload.shift_id, actor, profile["id"])
            if not shift:
                raise APIError(409, "location_shift_not_active", "An active shift owned by this Sales profile is required for location tracking.")
            active = await db.fetchrow("""select * from public.location_tracking_sessions
              where organization_id=$1 and user_id=$2 and status='active' for update""", org, actor)
            if active:
                if active["device_id"] == payload.device_id and active["consent_policy_version"] == payload.consent_policy_version:
                    return dict(active)
                raise APIError(409, "location_session_already_active", "Another active location session is already bound to this user.")
            try:
                row = await location_repository.create_session(db,org,profile["id"],actor,payload.shift_id,payload.device_id,payload.consent_policy_version)
            except asyncpg.UniqueViolationError as exc:
                active = await db.fetchrow("""select * from public.location_tracking_sessions
                  where organization_id=$1 and user_id=$2 and status='active'""", org, actor)
                if active and active["device_id"] == payload.device_id and active["consent_policy_version"] == payload.consent_policy_version:
                    return dict(active)
                raise APIError(409, "location_session_already_active", "A location session is already active for this user.") from exc
            await location_repository.audit_session(db,actor,org,"location.session.started",row["id"],{"device_id":payload.device_id,"consent_policy_version":payload.consent_policy_version})
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
            if payload.action == "stop" and row["status"] == "completed":
                return dict(row)
            if row["status"] not in allowed:
                raise APIError(409, "location_session_transition_invalid", "The requested location session transition is not valid.")
            updated = await location_repository.update_session(db,org,session_id,target,target in {"completed","revoked"})
            await location_repository.audit_session(db,actor,org,"location.session."+payload.action,session_id,{"reason":payload.reason})
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
            if not session["shift_id"]:
                raise APIError(409, "location_shift_not_active", "Location sessions must be bound to an active SmartTeam shift.")
            shift = await db.fetchrow("""select id,clock_in_at,clock_out_at
              from public.smartteam_shifts
              where organization_id=$1 and id=$2 and user_id=$3 and sales_profile_id=$4
              for update""", org, session["shift_id"], actor, session["sales_profile_id"])
            if not shift or shift["clock_in_at"] is None:
                raise APIError(409, "location_shift_not_active", "The linked SmartTeam shift is not valid for this Sales profile.")
            accepted = duplicates = 0
            for point in payload.points:
                stamp = point.recorded_at
                if stamp.tzinfo is None or stamp > now+timedelta(minutes=5) or stamp < now-timedelta(days=30):
                    raise APIError(422, "location_timestamp_invalid", "Location timestamps must include timezone and be within the last 30 days.")
                if shift["clock_out_at"] is not None and stamp > shift["clock_out_at"]:
                    raise APIError(409, "location_shift_ended", "Location points recorded after the shift ended are not accepted.")
                inserted = await location_repository.insert_point(db,org,session_id,actor,device_id,point)
                if inserted: accepted += 1
                else: duplicates += 1
            if shift["clock_out_at"] is not None:
                completed = await location_repository.update_session(
                    db, org, session_id, "completed", True, shift["clock_out_at"]
                )
                await location_repository.audit_session(
                    db, actor, org, "location.session.completed",
                    session_id, {"reason": "shift_ended", "shift_id": str(session["shift_id"])}
                )
            return {"session_id":session_id,"accepted":accepted,"duplicates":duplicates,"received":len(payload.points)}

    async def live(self, db, org, tenant, actor):
        self._tenant(org, tenant)
        ids = await self.visible_profiles(db, org, actor, "location.live.read")
        rows = await db.fetch("""select l.organization_id,l.user_id,l.sales_profile_id,l.branch_id,l.team_id,l.territory_id,
          l.session_id,l.latitude,l.longitude,l.accuracy_m,l.source,l.recorded_at,l.received_at,
          (l.recorded_at < now()-interval '15 minutes') stale
          from public.location_latest_positions l where l.organization_id=$1 and l.sales_profile_id=any($2::uuid[])
          order by l.recorded_at desc limit 500""", org, ids)
        await location_repository.audit_access(db,org,actor,"live_map","read")
        return [dict(r) for r in rows]

    async def history(self, db, org, tenant, actor, from_at, to_at, profile_id, page, size):
        self._tenant(org, tenant)
        now=datetime.now(UTC); end=to_at or now; start=from_at or end-timedelta(days=7)
        if start.tzinfo is None or end.tzinfo is None or end<=start or end-start>timedelta(days=31) or end>now+timedelta(minutes=5):
            raise APIError(422,"location_history_window_invalid","Location history requires a timezone-aware window of at most 31 days.")
        ids=await self.visible_profiles(db,org,actor,"location.history.read")
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
        await location_repository.audit_access(db,org,actor,"route_history","read",{"from":start.isoformat(),"to":end.isoformat()})
        return {"items":[dict(r) for r in rows],"page":page,"page_size":size,"total":int(total or 0),"from_at":start,"to_at":end}

    async def routes(self, db, org, tenant, actor, from_date, to_date, profile_id):
        self._tenant(org,tenant); ids=await self.visible_profiles(db,org,actor,"location.history.read")
        if profile_id and profile_id not in ids:
            raise APIError(403,"location_profile_scope_forbidden","The requested Sales profile is outside your authorized scope.")
        start=from_date or (datetime.now(UTC).date()-timedelta(days=7)); end=to_date or datetime.now(UTC).date()
        if end<start or (end-start).days>31:
            raise APIError(422,"location_route_window_invalid","Route history window must be within 31 days.")
        rows=await db.fetch("""select r.id,r.organization_id,r.session_id,r.route_date,r.started_at,r.ended_at,r.point_count,r.distance_m,extensions.st_asgeojson(r.route)::json route_geojson,r.computed_at,s.sales_profile_id,s.user_id from public.location_route_summaries r
          join public.location_tracking_sessions s on s.organization_id=r.organization_id and s.id=r.session_id
          where r.organization_id=$1 and s.sales_profile_id=any($2::uuid[]) and ($3::uuid is null or s.sales_profile_id=$3)
          and r.route_date between $4 and $5 order by r.route_date desc,r.started_at desc""",org,ids,profile_id,start,end)
        await location_repository.audit_access(db,org,actor,"route_history","read",{"from_date":str(start),"to_date":str(end)})
        return [dict(r) for r in rows]


    async def geofences(self, db, org, tenant, actor):
        self._tenant(org, tenant)
        rows = await location_repository.list_geofences(db, org, actor)
        await location_repository.audit_access(db, org, actor, "geofence", "read")
        return [dict(row) for row in rows]

    async def create_geofence(self, db, org, tenant, actor, payload):
        self._tenant(org, tenant)
        row = await location_repository.create_geofence(db, org, actor, payload)
        await location_repository.audit_access(
            db, org, actor, "geofence", "create", {"geofence_id": str(row["id"])}
        )
        return dict(row)

    async def route_replay(self, db, org, tenant, actor, route_id, from_at, to_at, page, size):
        self._tenant(org, tenant)
        visible_ids = await self.visible_profiles(db, org, actor, "location.history.read")
        route = await location_repository.get_route_replay_context(db, org, route_id, visible_ids)
        if not route:
            raise APIError(404, "location_route_not_found", "Route was not found in your authorized scope.")
        start = from_at or route["started_at"]
        end = to_at or route["ended_at"]
        now = datetime.now(UTC)
        if (start.tzinfo is None or end.tzinfo is None or end < start
                or end-start > timedelta(days=31) or start < route["started_at"]
                or end > route["ended_at"] or end > now+timedelta(minutes=5)):
            raise APIError(422, "location_route_replay_window_invalid",
                           "Route replay requires a timezone-aware window inside the selected route and no longer than 31 days.")
        total = await location_repository.count_route_replay_points(db, org, route["session_id"], start, end)
        points = await location_repository.list_route_replay_points(
            db, org, route["session_id"], start, end, page, size
        )
        await location_repository.audit_access(
            db, org, actor, "route_history", "replay",
            {"route_id": str(route_id), "from": start.isoformat(), "to": end.isoformat()}
        )
        return {
            "route_id": route_id, "session_id": route["session_id"],
            "sales_profile_id": route["sales_profile_id"], "user_id": route["user_id"],
            "from_at": start, "to_at": end, "items": [dict(point) for point in points],
            "page": page, "page_size": size, "total": int(total or 0),
        }

    async def geofence_events(self, db, org, tenant, actor, page=1, size=100):
        self._tenant(org, tenant)
        ids = await self.visible_profiles(db, org, actor, "location.history.read")
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
        await location_repository.audit_access(db,org,actor,"geofence","read",{"page":page,"page_size":size})
        return {"items":[dict(r) for r in rows],"page":page,"page_size":size,"total":int(total or 0)}

location_service=LocationService()
