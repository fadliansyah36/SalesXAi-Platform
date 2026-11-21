from datetime import datetime
from uuid import UUID

import asyncpg
from fastapi import APIRouter, Depends, Query, Request

from app.db import get_connection
from app.schemas.identity import AccountStatusUpdate, PlatformAuditLogResponse
from app.schemas.master_data import MasterDataWrite, PlatformOrganizationStatusUpdate
from app.security.dependencies import Principal, require_api_action
from app.services.account_administration import account_administration_service
from app.services.organization_mutations import organization_mutation_service
from app.services.platform_reads import platform_read_service
from app.repositories.smart_reward import SmartRewardRepository
from app.schemas.smart_team import PlatformSmartTeamOverviewResponse
from app.services.account_administration import account_administration_service
from app.services.organization_mutations import organization_mutation_service
from app.services.platform_reads import platform_read_service
from app.services.smart_reward import smart_reward_service
from app.services.smart_team import smart_team_service

router = APIRouter(prefix="/admin", tags=["platform-security"])


@router.get("/smart-reward/overview")
async def list_platform_smartreward_overview(
    start_at: datetime | None = Query(default=None),
    end_at: datetime | None = Query(default=None),
    limit: int = Query(default=100, ge=1, le=500),
    offset: int = Query(default=0, ge=0, le=100000),
    principal: Principal = Depends(require_api_action("platform.smartreward.overview.read")),
    connection: asyncpg.Connection = Depends(get_connection),
) -> dict:
    return await smart_reward_service.platform_overview(
        SmartRewardRepository(connection), start_at, end_at, limit, offset
    )





@router.get("/smart-team/overview", response_model=list[PlatformSmartTeamOverviewResponse])
async def list_platform_smartteam_overview(
    limit: int = Query(default=100, ge=1, le=500),
    offset: int = Query(default=0, ge=0, le=100000),
    principal: Principal = Depends(require_api_action("platform.smartteam.overview.read")),
    connection: asyncpg.Connection = Depends(get_connection),
) -> list[dict]:
    return await smart_team_service.platform_overview(connection, limit, offset)


@router.get("/users")
async def list_platform_users(
    q: str | None = Query(default=None, max_length=160),
    limit: int = Query(default=100, ge=1, le=500),
    offset: int = Query(default=0, ge=0, le=100000),
    principal: Principal = Depends(require_api_action("platform.users.list")),
    connection: asyncpg.Connection = Depends(get_connection),
) -> list[dict]:
    return await platform_read_service.list_users(connection, q, limit, offset)


@router.get("/roles")
async def list_platform_roles(
    principal: Principal = Depends(require_api_action("platform.roles.list")),
    connection: asyncpg.Connection = Depends(get_connection),
) -> list[dict]:
    return await platform_read_service.list_roles(connection)


@router.patch("/users/{user_id}/account-status")
async def update_account_status(
    user_id: UUID,
    payload: AccountStatusUpdate,
    request: Request,
    principal: Principal = Depends(require_api_action("platform.users.status")),
    connection: asyncpg.Connection = Depends(get_connection),
) -> dict:
    return await account_administration_service.update_status(
        connection, request, principal, user_id, payload.status
    )


@router.get("/organizations")
async def list_platform_organizations(
    limit: int = Query(default=100, ge=1, le=500),
    offset: int = Query(default=0, ge=0, le=100000),
    principal: Principal = Depends(require_api_action("platform.organizations.list")),
    connection: asyncpg.Connection = Depends(get_connection),
) -> list[dict]:
    return await organization_mutation_service.list_platform_organizations(
        connection, limit, offset
    )


@router.patch("/organizations/{organization_id}")
async def update_platform_organization(
    organization_id: UUID,
    payload: PlatformOrganizationStatusUpdate,
    request: Request,
    principal: Principal = Depends(require_api_action("platform.organizations.update")),
    connection: asyncpg.Connection = Depends(get_connection),
) -> dict:
    return await organization_mutation_service.update_platform_organization_status(
        connection, request, principal, organization_id, payload.status
    )


@router.get("/organizations/{organization_id}/branches")
async def list_organization_branches(
    organization_id: UUID,
    request: Request,
    limit: int = Query(default=100, ge=1, le=500),
    offset: int = Query(default=0, ge=0, le=100000),
    principal: Principal = Depends(require_api_action("platform.organizations.branches.read")),
    connection: asyncpg.Connection = Depends(get_connection),
) -> list[dict]:
    return await organization_mutation_service.list_platform_branches(
        connection, request, principal, organization_id, limit, offset
    )


@router.post("/organizations/{organization_id}/branches", status_code=201)
async def create_organization_branch(
    organization_id: UUID,
    payload: MasterDataWrite,
    request: Request,
    principal: Principal = Depends(require_api_action("platform.organizations.branches.create")),
    connection: asyncpg.Connection = Depends(get_connection),
) -> dict:
    return await organization_mutation_service.create_platform_branch(
        connection, request, principal, organization_id, payload.model_dump(exclude_unset=True)
    )


@router.patch("/organizations/{organization_id}/branches/{branch_id}")
async def update_organization_branch(
    organization_id: UUID,
    branch_id: UUID,
    payload: MasterDataWrite,
    request: Request,
    principal: Principal = Depends(require_api_action("platform.organizations.branches.update")),
    connection: asyncpg.Connection = Depends(get_connection),
) -> dict:
    return await organization_mutation_service.update_platform_branch(
        connection,
        request,
        principal,
        organization_id,
        branch_id,
        payload.model_dump(exclude_unset=True),
    )


@router.get("/audit", response_model=list[PlatformAuditLogResponse])
async def list_platform_audit_logs(
    request: Request,
    before: datetime | None = Query(default=None),
    limit: int = Query(default=50, ge=1, le=100),
    principal: Principal = Depends(require_api_action("platform.audit.read")),
    connection: asyncpg.Connection = Depends(get_connection),
) -> list[PlatformAuditLogResponse]:
    rows = await platform_read_service.list_audit_logs(
        connection, request, principal, before, limit
    )
    return [PlatformAuditLogResponse(**row) for row in rows]
