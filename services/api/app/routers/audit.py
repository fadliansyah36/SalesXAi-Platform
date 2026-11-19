from uuid import UUID
import asyncpg
from fastapi import APIRouter,Depends,Query
from app.db import get_connection
from app.security.dependencies import TenantContext,require_api_action
from app.services.audit_reads import audit_read_service

router=APIRouter(prefix="/organizations",tags=["audit"])

@router.get("/{organization_id}/audit")
async def list_organization_audit(
    organization_id: UUID,
    tenant: TenantContext=Depends(require_api_action("audit.organization.read")),
    connection: asyncpg.Connection=Depends(get_connection),
    limit: int=Query(default=50,ge=1,le=100),
    before: str|None=None,
)->list[dict]:
    return await audit_read_service.list_organization_audit(connection,organization_id,tenant,before,limit)
