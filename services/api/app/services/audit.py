import json
from typing import Any
import asyncpg
from fastapi import Request
from app.security.dependencies import Principal, TenantContext

async def write_audit(
    connection: asyncpg.Connection, request: Request, principal: Principal | None,
    action: str, resource_type: str, resource_id: str | None = None,
    tenant: TenantContext | None = None, metadata: dict[str, Any] | None = None,
) -> None:
    safe_metadata=metadata or {}
    if {"password","access_token","refresh_token","authorization","secret","jwt"} & safe_metadata.keys():
        raise ValueError("Sensitive authentication material cannot be written to audit metadata.")
    await connection.execute(
        """
        insert into public.admin_audit_logs
          (actor_user_id,organization_id,action,resource_type,resource_id,correlation_id,user_agent,metadata)
        values ($1,$2,$3,$4,$5,$6,$7,$8::jsonb)
        """,
        principal.user_id if principal else None,tenant.organization_id if tenant else None,
        action,resource_type,resource_id,getattr(request.state,"correlation_id",None),
        request.headers.get("user-agent","")[:512],json.dumps(safe_metadata))
