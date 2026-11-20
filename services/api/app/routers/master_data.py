import asyncio
import csv
import io
import json
from uuid import UUID

import asyncpg
from fastapi import APIRouter, Depends, Query, Request
from fastapi.responses import Response, StreamingResponse

from app.db import get_connection
from app.errors import APIError
from app.schemas.master_data import MasterDataImportRequest, MasterDataWrite, OutletAssignmentCreate, OutletAssignmentUnassignRequest
from app.security.dependencies import Principal, TenantContext, get_current_principal, require_api_action
from app.services.master_data import master_data_service
from app.repositories.master_data import RESOURCE_TABLES

router = APIRouter(prefix="/organizations", tags=["master-data"])


async def _list(resource: str, organization_id: UUID, tenant: TenantContext, connection: asyncpg.Connection, limit: int, offset: int):
    return await master_data_service.list(connection, resource, organization_id, tenant, limit, offset)


async def _create(resource: str, organization_id: UUID, payload: MasterDataWrite, request: Request, principal: Principal, tenant: TenantContext, connection: asyncpg.Connection):
    return await master_data_service.create(connection, request, principal, tenant, resource, organization_id, payload.model_dump(exclude_unset=True))


async def _update(resource: str, organization_id: UUID, record_id: UUID, payload: MasterDataWrite, request: Request, principal: Principal, tenant: TenantContext, connection: asyncpg.Connection):
    return await master_data_service.update(connection, request, principal, tenant, resource, organization_id, record_id, payload.model_dump(exclude_unset=True))


@router.get("/{organization_id}/branches")
async def list_branches(organization_id: UUID, tenant: TenantContext = Depends(require_api_action("master.branches.read")), connection: asyncpg.Connection = Depends(get_connection), limit: int = Query(100, ge=1, le=500), offset: int = Query(0, ge=0)):
    return await _list("branches", organization_id, tenant, connection, limit, offset)


@router.post("/{organization_id}/branches", status_code=201)
async def create_branch(organization_id: UUID, payload: MasterDataWrite, request: Request, principal: Principal = Depends(get_current_principal), tenant: TenantContext = Depends(require_api_action("master.branches.create")), connection: asyncpg.Connection = Depends(get_connection)):
    return await _create("branches", organization_id, payload, request, principal, tenant, connection)


@router.patch("/{organization_id}/branches/{record_id}")
async def update_branch(organization_id: UUID, record_id: UUID, payload: MasterDataWrite, request: Request, principal: Principal = Depends(get_current_principal), tenant: TenantContext = Depends(require_api_action("master.branches.update")), connection: asyncpg.Connection = Depends(get_connection)):
    return await _update("branches", organization_id, record_id, payload, request, principal, tenant, connection)


@router.get("/{organization_id}/teams")
async def list_teams(organization_id: UUID, tenant: TenantContext = Depends(require_api_action("master.teams.read")), connection: asyncpg.Connection = Depends(get_connection), limit: int = Query(100, ge=1, le=500), offset: int = Query(0, ge=0)):
    return await _list("teams", organization_id, tenant, connection, limit, offset)


@router.post("/{organization_id}/teams", status_code=201)
async def create_team(organization_id: UUID, payload: MasterDataWrite, request: Request, principal: Principal = Depends(get_current_principal), tenant: TenantContext = Depends(require_api_action("master.teams.create")), connection: asyncpg.Connection = Depends(get_connection)):
    return await _create("teams", organization_id, payload, request, principal, tenant, connection)


@router.patch("/{organization_id}/teams/{record_id}")
async def update_team(organization_id: UUID, record_id: UUID, payload: MasterDataWrite, request: Request, principal: Principal = Depends(get_current_principal), tenant: TenantContext = Depends(require_api_action("master.teams.update")), connection: asyncpg.Connection = Depends(get_connection)):
    return await _update("teams", organization_id, payload=payload, record_id=record_id, request=request, principal=principal, tenant=tenant, connection=connection)


@router.get("/{organization_id}/territories")
async def list_territories(organization_id: UUID, tenant: TenantContext = Depends(require_api_action("master.territories.read")), connection: asyncpg.Connection = Depends(get_connection), limit: int = Query(100, ge=1, le=500), offset: int = Query(0, ge=0)):
    return await _list("territories", organization_id, tenant, connection, limit, offset)


@router.post("/{organization_id}/territories", status_code=201)
async def create_territory(organization_id: UUID, payload: MasterDataWrite, request: Request, principal: Principal = Depends(get_current_principal), tenant: TenantContext = Depends(require_api_action("master.territories.create")), connection: asyncpg.Connection = Depends(get_connection)):
    return await _create("territories", organization_id, payload, request, principal, tenant, connection)


@router.patch("/{organization_id}/territories/{record_id}")
async def update_territory(organization_id: UUID, record_id: UUID, payload: MasterDataWrite, request: Request, principal: Principal = Depends(get_current_principal), tenant: TenantContext = Depends(require_api_action("master.territories.update")), connection: asyncpg.Connection = Depends(get_connection)):
    return await _update("territories", organization_id, payload=payload, record_id=record_id, request=request, principal=principal, tenant=tenant, connection=connection)


@router.get("/{organization_id}/outlets")
async def list_outlets(organization_id: UUID, tenant: TenantContext = Depends(require_api_action("master.outlets.read")), connection: asyncpg.Connection = Depends(get_connection), limit: int = Query(100, ge=1, le=500), offset: int = Query(0, ge=0)):
    return await _list("outlets", organization_id, tenant, connection, limit, offset)


@router.post("/{organization_id}/outlets", status_code=201)
async def create_outlet(organization_id: UUID, payload: MasterDataWrite, request: Request, principal: Principal = Depends(get_current_principal), tenant: TenantContext = Depends(require_api_action("master.outlets.create")), connection: asyncpg.Connection = Depends(get_connection)):
    return await _create("outlets", organization_id, payload, request, principal, tenant, connection)


@router.patch("/{organization_id}/outlets/{record_id}")
async def update_outlet(organization_id: UUID, record_id: UUID, payload: MasterDataWrite, request: Request, principal: Principal = Depends(get_current_principal), tenant: TenantContext = Depends(require_api_action("master.outlets.update")), connection: asyncpg.Connection = Depends(get_connection)):
    return await _update("outlets", organization_id, payload=payload, record_id=record_id, request=request, principal=principal, tenant=tenant, connection=connection)


@router.get("/{organization_id}/sales-profiles")
async def list_sales_profiles(organization_id: UUID, tenant: TenantContext = Depends(require_api_action("master.sales_profiles.read")), connection: asyncpg.Connection = Depends(get_connection), limit: int = Query(100, ge=1, le=500), offset: int = Query(0, ge=0)):
    return await _list("sales_profiles", organization_id, tenant, connection, limit, offset)


@router.post("/{organization_id}/sales-profiles", status_code=201)
async def create_sales_profile(organization_id: UUID, payload: MasterDataWrite, request: Request, principal: Principal = Depends(get_current_principal), tenant: TenantContext = Depends(require_api_action("master.sales_profiles.create")), connection: asyncpg.Connection = Depends(get_connection)):
    return await _create("sales_profiles", organization_id, payload, request, principal, tenant, connection)


@router.patch("/{organization_id}/sales-profiles/{record_id}")
async def update_sales_profile(organization_id: UUID, record_id: UUID, payload: MasterDataWrite, request: Request, principal: Principal = Depends(get_current_principal), tenant: TenantContext = Depends(require_api_action("master.sales_profiles.update")), connection: asyncpg.Connection = Depends(get_connection)):
    return await _update("sales_profiles", organization_id, payload=payload, record_id=record_id, request=request, principal=principal, tenant=tenant, connection=connection)


@router.get("/{organization_id}/outlet-assignments")
async def list_outlet_assignments(organization_id: UUID, tenant: TenantContext = Depends(require_api_action("master.assignments.read")), connection: asyncpg.Connection = Depends(get_connection), limit: int = Query(100, ge=1, le=500), offset: int = Query(0, ge=0)):
    return await master_data_service.list_assignments(connection, organization_id, tenant, limit, offset)


@router.post("/{organization_id}/outlets/{outlet_id}/assignments", status_code=201)
async def assign_outlet(organization_id: UUID, outlet_id: UUID, payload: OutletAssignmentCreate, request: Request, principal: Principal = Depends(get_current_principal), tenant: TenantContext = Depends(require_api_action("master.assignments.manage")), connection: asyncpg.Connection = Depends(get_connection)):
    return await master_data_service.assign_outlet(connection, request, principal, tenant, organization_id, outlet_id, payload.sales_profile_id, payload.note)


@router.post("/{organization_id}/outlet-assignments/{assignment_id}/unassign")
async def unassign_outlet(
    organization_id: UUID, assignment_id: UUID, payload: OutletAssignmentUnassignRequest, request: Request,
    principal: Principal = Depends(get_current_principal),
    tenant: TenantContext = Depends(require_api_action("master.assignments.unassign")),
    connection: asyncpg.Connection = Depends(get_connection),
):
    return await master_data_service.unassign_outlet(
        connection, request, principal, tenant, organization_id, assignment_id, payload.reason,
    )


@router.get("/{organization_id}/sales-profiles/me/assignment-context")
async def my_assignment_context(organization_id: UUID, principal: Principal = Depends(get_current_principal), tenant: TenantContext = Depends(require_api_action("master.assignments.context.read")), connection: asyncpg.Connection = Depends(get_connection)):
    return await master_data_service.my_assignment_context(connection, organization_id, tenant, principal)


@router.post("/{organization_id}/master-data/{resource}/import", status_code=200)
async def import_master_data(organization_id: UUID, resource: str, payload: MasterDataImportRequest, request: Request, principal: Principal = Depends(get_current_principal), tenant: TenantContext = Depends(require_api_action("master.data.import")), connection: asyncpg.Connection = Depends(get_connection)):
    return await master_data_service.import_rows(connection, request, principal, tenant, organization_id, resource, payload.idempotency_key, payload.rows)



@router.get("/{organization_id}/master-data/events")
async def stream_master_data_events(
    organization_id: UUID,
    tenant: TenantContext = Depends(require_api_action("master.data.events.read")),
    connection: asyncpg.Connection = Depends(get_connection),
):
    if tenant.organization_id != organization_id:
        raise APIError(403, "forbidden", "Cross-tenant event subscription is denied.")
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
        await connection.add_listener("salesx_master_data", receive)
        try:
            yield ": connected\n\n"
            while True:
                try:
                    event = await asyncio.wait_for(queue.get(), timeout=20)
                    yield "event: master_data.changed\ndata: " + json.dumps(event, default=str) + "\n\n"
                except TimeoutError:
                    yield ": keep-alive\n\n"
        finally:
            await connection.remove_listener("salesx_master_data", receive)

    return StreamingResponse(
        stream(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache, no-transform", "X-Accel-Buffering": "no"},
    )

@router.get("/{organization_id}/master-data/{resource}/export")
async def export_master_data(organization_id: UUID, resource: str, request: Request, principal: Principal = Depends(get_current_principal), tenant: TenantContext = Depends(require_api_action("master.data.export")), connection: asyncpg.Connection = Depends(get_connection), limit: int = Query(5000, ge=1, le=5000)):
    rows = await master_data_service.list(connection, resource, organization_id, tenant, limit, 0)
    await master_data_service.audit_export(connection, request, principal, tenant, organization_id, resource, len(rows))
    output = io.StringIO()
    fields = sorted(RESOURCE_TABLES[resource] - {'membership_id'})
    writer = csv.DictWriter(output, fieldnames=fields, extrasaction="ignore")
    writer.writeheader()
    for row in rows:
        writer.writerow({
            key: json.dumps(row.get(key), separators=(",", ":")) if isinstance(row.get(key), dict | list)
            else str(row.get(key)) if row.get(key) is not None else ""
            for key in fields
        })
    return Response(content=output.getvalue(), media_type="text/csv; charset=utf-8", headers={"Content-Disposition": f'attachment; filename="{resource}.csv"'})
