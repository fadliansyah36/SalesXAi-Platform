import asyncio
import json
from datetime import date, datetime
from uuid import UUID
import asyncpg
from fastapi import APIRouter, Depends, Query, Request
from fastapi.responses import StreamingResponse
from app.db import get_connection
from app.errors import APIError
from app.security.dependencies import Principal, TenantContext, get_current_principal, require_api_action
from app.schemas.location import LocationSessionStart, LocationSessionAction, LocationPointBatch, LocationGeofenceWrite
from app.services.location import location_service
from app.repositories.location import location_repository

router=APIRouter(prefix="/organizations",tags=["location-intelligence"])

def _device_id(request: Request)->str:
    value=request.headers.get("x-device-id","").strip()
    if not 8<=len(value)<=180:
        raise APIError(400,"location_device_id_required","X-Device-ID must identify the registered native device.")
    return value

@router.post("/{organization_id}/location/sessions",status_code=201)
async def start_session(organization_id:UUID,payload:LocationSessionStart,principal:Principal=Depends(get_current_principal),
 tenant:TenantContext=Depends(require_api_action("location.sessions.start")),db:asyncpg.Connection=Depends(get_connection)):
 return await location_service.start(db,organization_id,tenant,principal.user_id,principal.session_id,payload)

@router.patch("/{organization_id}/location/sessions/{session_id}")
async def update_session(organization_id:UUID,session_id:UUID,payload:LocationSessionAction,principal:Principal=Depends(get_current_principal),
 tenant:TenantContext=Depends(require_api_action("location.sessions.manage")),db:asyncpg.Connection=Depends(get_connection)):
 return await location_service.update_session(db,organization_id,tenant,principal.user_id,session_id,payload)

@router.post("/{organization_id}/location/sessions/{session_id}/points")
async def ingest_points(organization_id:UUID,session_id:UUID,payload:LocationPointBatch,request:Request,principal:Principal=Depends(get_current_principal),
 tenant:TenantContext=Depends(require_api_action("location.points.ingest")),db:asyncpg.Connection=Depends(get_connection)):
 return await location_service.ingest(db,organization_id,tenant,principal.user_id,session_id,_device_id(request),payload)

@router.get("/{organization_id}/location/live")
async def live(organization_id:UUID,principal:Principal=Depends(get_current_principal),
 tenant:TenantContext=Depends(require_api_action("location.live.read")),db:asyncpg.Connection=Depends(get_connection)):
 return {"items":await location_service.live(db,organization_id,tenant,principal.user_id)}

@router.get("/{organization_id}/location/history")
async def history(organization_id:UUID,from_at:datetime|None=None,to_at:datetime|None=None,sales_profile_id:UUID|None=None,
 page:int=Query(1,ge=1),page_size:int=Query(100,ge=1,le=500),principal:Principal=Depends(get_current_principal),
 tenant:TenantContext=Depends(require_api_action("location.history.read")),db:asyncpg.Connection=Depends(get_connection)):
 return await location_service.history(db,organization_id,tenant,principal.user_id,from_at,to_at,sales_profile_id,page,page_size)

@router.get("/{organization_id}/location/routes")
async def routes(organization_id:UUID,from_date:date|None=None,to_date:date|None=None,sales_profile_id:UUID|None=None,
 principal:Principal=Depends(get_current_principal),tenant:TenantContext=Depends(require_api_action("location.routes.read")),
 db:asyncpg.Connection=Depends(get_connection)):
 return {"items":await location_service.routes(db,organization_id,tenant,principal.user_id,from_date,to_date,sales_profile_id)}

@router.get("/{organization_id}/location/geofences")
async def geofences(organization_id:UUID,principal:Principal=Depends(get_current_principal),
 tenant:TenantContext=Depends(require_api_action("location.geofences.read")),db:asyncpg.Connection=Depends(get_connection)):
 if tenant.organization_id!=organization_id: raise APIError(403,"tenant_scope_mismatch","Location access is restricted to the active organization.")
 rows=await db.fetch("""select id,organization_id,code,name,geofence_type,outlet_id,territory_id,event_types,dwell_seconds,
 accuracy_limit_m,status,created_at,updated_at from public.location_geofences where organization_id=$1 order by created_at desc""",organization_id)
 return {"items":[dict(r) for r in rows]}

@router.post("/{organization_id}/location/geofences",status_code=201)
async def create_geofence(organization_id:UUID,payload:LocationGeofenceWrite,principal:Principal=Depends(get_current_principal),
 tenant:TenantContext=Depends(require_api_action("location.geofences.manage")),db:asyncpg.Connection=Depends(get_connection)):
 if tenant.organization_id!=organization_id: raise APIError(403,"tenant_scope_mismatch","Location access is restricted to the active organization.")
 row=await location_repository.create_geofence(db,organization_id,principal.user_id,payload)
 return dict(row)


@router.get("/{organization_id}/location/geofence-events")
async def geofence_events(organization_id:UUID,page:int=Query(1,ge=1),page_size:int=Query(100,ge=1,le=500),
 principal:Principal=Depends(get_current_principal),tenant:TenantContext=Depends(require_api_action("location.geofence_events.read")),
 db:asyncpg.Connection=Depends(get_connection)):
 return await location_service.geofence_events(db,organization_id,tenant,principal.user_id,page,page_size)

@router.get("/{organization_id}/location/events")
async def events(organization_id:UUID,request:Request,principal:Principal=Depends(get_current_principal),
 tenant:TenantContext=Depends(require_api_action("location.events.read")),db:asyncpg.Connection=Depends(get_connection)):
 if tenant.organization_id!=organization_id: raise APIError(403,"tenant_scope_mismatch","Location access is restricted to the active organization.")
 queue:asyncio.Queue[dict]=asyncio.Queue(maxsize=128)
 def receive(_connection,_pid,_channel,payload:str):
  try:
   event=json.loads(payload)
   if event.get("organization_id")==str(organization_id):
    if queue.full(): queue.get_nowait()
    queue.put_nowait(event)
  except (ValueError,TypeError): return
 async def stream():
  await db.add_listener("salesx_location",receive)
  try:
   yield ": connected\n\n"
   while not await request.is_disconnected():
    try:
     event=await asyncio.wait_for(queue.get(),timeout=20)
     profile=await db.fetchval("select id from public.sales_profiles where organization_id=$1 and user_id=$2",organization_id,event.get("user_id"))
     if profile and await location_service.profile_allowed(db,organization_id,principal.user_id,profile):
      yield "event: location.updated\ndata: "+json.dumps(event,default=str)+"\n\n"
    except TimeoutError: yield ": keep-alive\n\n"
  finally: await db.remove_listener("salesx_location",receive)
 return StreamingResponse(stream(),media_type="text/event-stream",headers={"Cache-Control":"no-cache, no-transform","X-Accel-Buffering":"no","Connection":"keep-alive"})
