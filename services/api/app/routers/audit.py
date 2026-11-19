from uuid import UUID
import asyncpg
from fastapi import APIRouter,Depends,Query
from app.db import get_connection
from app.errors import APIError
from app.security.dependencies import TenantContext,require_api_action

router=APIRouter(prefix="/organizations",tags=["audit"])

@router.get("/{organization_id}/audit")
async def list_organization_audit(
    organization_id: UUID,
    tenant: TenantContext=Depends(require_api_action("audit.organization.read")),
    connection: asyncpg.Connection=Depends(get_connection),
    limit: int=Query(default=50,ge=1,le=100),
    before: str|None=None,
)->list[dict]:
    if tenant.organization_id!=organization_id:
        raise APIError(403,"forbidden","Cross-tenant audit access is denied.")
    if before:
        rows=await connection.fetch(
          """select id,actor_user_id,organization_id,action,resource_type,resource_id,
          correlation_id,occurred_at,metadata from public.admin_audit_logs
          where organization_id=$1 and occurred_at<$2::timestamptz
          order by occurred_at desc limit $3""",organization_id,before,limit)
    else:
        rows=await connection.fetch(
          """select id,actor_user_id,organization_id,action,resource_type,resource_id,
          correlation_id,occurred_at,metadata from public.admin_audit_logs
          where organization_id=$1 order by occurred_at desc limit $2""",organization_id,limit)
    return [dict(row) for row in rows]
