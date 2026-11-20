from uuid import UUID
import asyncio
import json
import asyncpg
from fastapi import APIRouter, Depends, Query, Request
from fastapi.responses import StreamingResponse
from app.db import get_connection
from app.errors import APIError
from app.schemas.smart_team import (
    VisitCreate,
    VisitUpdate,
    VisitExecution,
    VisitCancel,
    ClockInRequest,
    ClockOutRequest,
    AttendanceCorrection,
    ActivityCreate,
    ActivityUpdate,
    TargetWrite,
    TargetUpdate,
)
from app.security.dependencies import (
    Principal,
    TenantContext,
    get_current_principal,
    require_api_action,
)
from app.services.smart_team import smart_team_service

router = APIRouter(prefix="/organizations", tags=["smart-team"])


@router.get("/{organization_id}/smart-team/events")
async def stream_smartteam_events(
    organization_id: UUID,
    principal: Principal = Depends(get_current_principal),
    tenant: TenantContext = Depends(require_api_action("smartteam.events.read")),
    connection: asyncpg.Connection = Depends(get_connection),
):
    if tenant.organization_id != organization_id:
        raise APIError(403, "forbidden", "Cross-tenant SmartTeam event subscription is denied.")
    queue: asyncio.Queue[dict] = asyncio.Queue(maxsize=64)

    def receive(_connection, _pid, _channel, payload: str):
        try:
            event = json.loads(payload)
            if event.get("organization_id") == str(organization_id):
                if queue.full():
                    queue.get_nowait()
                queue.put_nowait(event)
        except (ValueError, TypeError):
            return

    async def stream():
        await connection.add_listener("salesx_smartteam", receive)
        try:
            yield ": connected\\n\\n"
            while True:
                try:
                    event = await asyncio.wait_for(queue.get(), timeout=20)
                    if await smart_team_service.can_receive_event(
                        connection, organization_id, principal.user_id, event
                    ):
                        yield (
                            "event: smartteam.changed\\ndata: "
                            + json.dumps(event, default=str)
                            + "\\n\\n"
                        )
                except TimeoutError:
                    yield ": keep-alive\\n\\n"
        finally:
            await connection.remove_listener("salesx_smartteam", receive)

    return StreamingResponse(
        stream(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache, no-transform", "X-Accel-Buffering": "no"},
    )


@router.get("/{organization_id}/smart-team/dashboard")
async def dashboard(
    organization_id: UUID,
    principal: Principal = Depends(get_current_principal),
    tenant: TenantContext = Depends(require_api_action("smartteam.dashboard.read")),
    connection: asyncpg.Connection = Depends(get_connection),
):
    return await smart_team_service.dashboard(connection, organization_id, tenant, principal)


@router.patch("/{organization_id}/smart-team/visits/{visit_id}")
async def update_visit(
    organization_id: UUID,
    visit_id: UUID,
    payload: VisitUpdate,
    request: Request,
    principal: Principal = Depends(get_current_principal),
    tenant: TenantContext = Depends(require_api_action("smartteam.visits.manage")),
    connection: asyncpg.Connection = Depends(get_connection),
):
    return await smart_team_service.update_visit(
        connection,
        request,
        organization_id,
        tenant,
        principal,
        visit_id,
        payload.model_dump(exclude_unset=True),
    )


@router.post("/{organization_id}/smart-team/visits/{visit_id}/evidence", status_code=201)
async def upload_visit_evidence(
    organization_id: UUID,
    visit_id: UUID,
    request: Request,
    principal: Principal = Depends(get_current_principal),
    tenant: TenantContext = Depends(require_api_action("smartteam.visits.evidence.upload")),
    connection: asyncpg.Connection = Depends(get_connection),
):
    content = await request.body()
    return await smart_team_service.upload_visit_evidence(
        connection,
        request,
        organization_id,
        tenant,
        principal,
        visit_id,
        request.headers.get("content-type", "").split(";")[0].strip().lower(),
        content,
    )


@router.get("/{organization_id}/smart-team/visits/{visit_id}/evidence")
async def list_visit_evidence(
    organization_id: UUID,
    visit_id: UUID,
    principal: Principal = Depends(get_current_principal),
    tenant: TenantContext = Depends(require_api_action("smartteam.visits.evidence.read")),
    connection: asyncpg.Connection = Depends(get_connection),
):
    return await smart_team_service.list_visit_evidence(
        connection, organization_id, tenant, principal, visit_id
    )


@router.get("/{organization_id}/smart-team/visits/{visit_id}/history")
async def visit_history(
    organization_id: UUID,
    visit_id: UUID,
    principal: Principal = Depends(get_current_principal),
    tenant: TenantContext = Depends(require_api_action("smartteam.visits.history")),
    connection: asyncpg.Connection = Depends(get_connection),
):
    return await smart_team_service.list_visit_history(
        connection, organization_id, tenant, principal, visit_id
    )


@router.patch("/{organization_id}/smart-team/targets/{target_id}")
async def update_target(
    organization_id: UUID,
    target_id: UUID,
    payload: TargetUpdate,
    request: Request,
    principal: Principal = Depends(get_current_principal),
    tenant: TenantContext = Depends(require_api_action("smartteam.targets.update")),
    connection: asyncpg.Connection = Depends(get_connection),
):
    return await smart_team_service.update_target(
        connection,
        request,
        organization_id,
        tenant,
        principal,
        target_id,
        payload.model_dump(exclude_unset=True),
    )


@router.get("/{organization_id}/smart-team/visits")
async def list_visits(
    organization_id: UUID,
    status: str | None = None,
    profile_id: UUID | None = None,
    limit: int = Query(100, ge=1, le=500),
    offset: int = Query(0, ge=0),
    tenant: TenantContext = Depends(require_api_action("smartteam.visits.read")),
    principal: Principal = Depends(get_current_principal),
    connection: asyncpg.Connection = Depends(get_connection),
):
    return await smart_team_service.list_visits(
        connection, organization_id, tenant, principal, profile_id, status, limit, offset
    )


@router.post("/{organization_id}/smart-team/visits", status_code=201)
async def create_visit(
    organization_id: UUID,
    payload: VisitCreate,
    request: Request,
    principal: Principal = Depends(get_current_principal),
    tenant: TenantContext = Depends(require_api_action("smartteam.visits.create")),
    connection: asyncpg.Connection = Depends(get_connection),
):
    return await smart_team_service.create_visit(
        connection, request, organization_id, tenant, principal, payload.model_dump()
    )


@router.post("/{organization_id}/smart-team/visits/{visit_id}/check-in")
async def check_in(
    organization_id: UUID,
    visit_id: UUID,
    payload: VisitExecution,
    request: Request,
    principal: Principal = Depends(get_current_principal),
    tenant: TenantContext = Depends(require_api_action("smartteam.visits.execute")),
    connection: asyncpg.Connection = Depends(get_connection),
):
    return await smart_team_service.check_in(
        connection,
        request,
        organization_id,
        tenant,
        principal,
        visit_id,
        payload.location.model_dump(),
        payload.idempotency_key,
    )


@router.post("/{organization_id}/smart-team/visits/{visit_id}/check-out")
async def check_out(
    organization_id: UUID,
    visit_id: UUID,
    payload: VisitExecution,
    request: Request,
    principal: Principal = Depends(get_current_principal),
    tenant: TenantContext = Depends(require_api_action("smartteam.visits.checkout")),
    connection: asyncpg.Connection = Depends(get_connection),
):
    return await smart_team_service.check_out(
        connection,
        request,
        organization_id,
        tenant,
        principal,
        visit_id,
        payload.location.model_dump(),
        payload.outcome,
        payload.notes,
        payload.idempotency_key,
    )


@router.post("/{organization_id}/smart-team/visits/{visit_id}/cancel")
async def cancel_visit(
    organization_id: UUID,
    visit_id: UUID,
    payload: VisitCancel,
    request: Request,
    principal: Principal = Depends(get_current_principal),
    tenant: TenantContext = Depends(require_api_action("smartteam.visits.cancel")),
    connection: asyncpg.Connection = Depends(get_connection),
):
    return await smart_team_service.cancel_visit(
        connection, request, organization_id, tenant, principal, visit_id, payload.reason
    )


@router.get("/{organization_id}/smart-team/attendance")
async def list_attendance(
    organization_id: UUID,
    limit: int = Query(100, ge=1, le=500),
    offset: int = Query(0, ge=0),
    tenant: TenantContext = Depends(require_api_action("smartteam.attendance.read")),
    principal: Principal = Depends(get_current_principal),
    connection: asyncpg.Connection = Depends(get_connection),
):
    return await smart_team_service.list_shifts(
        connection, organization_id, tenant, principal, limit, offset
    )


@router.post("/{organization_id}/smart-team/attendance/clock-in", status_code=201)
async def clock_in(
    organization_id: UUID,
    payload: ClockInRequest,
    request: Request,
    principal: Principal = Depends(get_current_principal),
    tenant: TenantContext = Depends(require_api_action("smartteam.attendance.clock_in")),
    connection: asyncpg.Connection = Depends(get_connection),
):
    return await smart_team_service.clock_in(
        connection,
        request,
        organization_id,
        tenant,
        principal,
        payload.location.model_dump(),
        payload.idempotency_key,
    )


@router.post("/{organization_id}/smart-team/attendance/clock-out")
async def clock_out(
    organization_id: UUID,
    payload: ClockOutRequest,
    request: Request,
    principal: Principal = Depends(get_current_principal),
    tenant: TenantContext = Depends(require_api_action("smartteam.attendance.clock_out")),
    connection: asyncpg.Connection = Depends(get_connection),
):
    return await smart_team_service.clock_out(
        connection,
        request,
        organization_id,
        tenant,
        principal,
        payload.location.model_dump(),
        payload.idempotency_key,
    )


@router.post("/{organization_id}/smart-team/attendance/{shift_id}/correct")
async def correct_attendance(
    organization_id: UUID,
    shift_id: UUID,
    payload: AttendanceCorrection,
    request: Request,
    principal: Principal = Depends(get_current_principal),
    tenant: TenantContext = Depends(require_api_action("smartteam.attendance.correct")),
    connection: asyncpg.Connection = Depends(get_connection),
):
    return await smart_team_service.correct_attendance(
        connection,
        request,
        organization_id,
        tenant,
        principal,
        shift_id,
        payload.clock_in_at,
        payload.clock_out_at,
        payload.reason,
    )


@router.get("/{organization_id}/smart-team/activities")
async def list_activities(
    organization_id: UUID,
    limit: int = Query(100, ge=1, le=500),
    offset: int = Query(0, ge=0),
    tenant: TenantContext = Depends(require_api_action("smartteam.activities.read")),
    principal: Principal = Depends(get_current_principal),
    connection: asyncpg.Connection = Depends(get_connection),
):
    return await smart_team_service.list_activities(
        connection, organization_id, tenant, principal, limit, offset
    )


@router.post("/{organization_id}/smart-team/activities", status_code=201)
async def create_activity(
    organization_id: UUID,
    payload: ActivityCreate,
    request: Request,
    principal: Principal = Depends(get_current_principal),
    tenant: TenantContext = Depends(require_api_action("smartteam.activities.create")),
    connection: asyncpg.Connection = Depends(get_connection),
):
    return await smart_team_service.create_activity(
        connection, request, organization_id, tenant, principal, payload.model_dump()
    )


@router.patch("/{organization_id}/smart-team/activities/{activity_id}")
async def update_activity(
    organization_id: UUID,
    activity_id: UUID,
    payload: ActivityUpdate,
    request: Request,
    principal: Principal = Depends(get_current_principal),
    tenant: TenantContext = Depends(require_api_action("smartteam.activities.update")),
    connection: asyncpg.Connection = Depends(get_connection),
):
    return await smart_team_service.update_activity(
        connection,
        request,
        organization_id,
        tenant,
        principal,
        activity_id,
        payload.model_dump(exclude_unset=True),
    )


@router.get("/{organization_id}/smart-team/targets")
async def list_targets(
    organization_id: UUID,
    limit: int = Query(100, ge=1, le=500),
    offset: int = Query(0, ge=0),
    tenant: TenantContext = Depends(require_api_action("smartteam.targets.read")),
    principal: Principal = Depends(get_current_principal),
    connection: asyncpg.Connection = Depends(get_connection),
):
    return await smart_team_service.list_targets(
        connection, organization_id, tenant, principal, limit, offset
    )


@router.post("/{organization_id}/smart-team/targets", status_code=201)
async def create_target(
    organization_id: UUID,
    payload: TargetWrite,
    request: Request,
    principal: Principal = Depends(get_current_principal),
    tenant: TenantContext = Depends(require_api_action("smartteam.targets.create")),
    connection: asyncpg.Connection = Depends(get_connection),
):
    return await smart_team_service.create_target(
        connection, request, organization_id, tenant, principal, payload.model_dump()
    )
