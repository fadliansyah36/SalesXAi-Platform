from dataclasses import dataclass
from datetime import UTC, datetime
from typing import Any
from uuid import UUID
import asyncpg
from fastapi import Depends, Request
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from app.db import get_connection
from app.errors import APIError
from app.security.action_matrix import API_ACTION_MATRIX
from app.security.jwt import SupabaseJWTVerifier
from app.services.authorization import authorization_service

bearer_scheme = HTTPBearer(auto_error=False)
async def audit_authorization_denial(request: Request, principal: 'Principal', permission_key: str, connection: asyncpg.Connection, tenant: 'TenantContext | None' = None) -> None:
    """Persist a credential-free denial receipt through the authorization service."""
    await authorization_service.record_denial(request, principal, permission_key, connection, tenant)

@dataclass(frozen=True)
class Principal:
    user_id: UUID
    email: str | None
    display_name: str | None
    session_id: UUID
    claims: dict[str, Any]

@dataclass(frozen=True)
class TenantContext:
    organization_id: UUID
    membership_id: UUID
    branch_id: UUID | None
    organization_name: str

async def get_current_principal(
    request: Request,
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer_scheme),
    connection: asyncpg.Connection = Depends(get_connection),
) -> Principal:
    if credentials is None or credentials.scheme.lower() != "bearer":
        raise APIError(401, "unauthenticated", "A valid Supabase access token is required.")
    verifier: SupabaseJWTVerifier = request.app.state.jwt_verifier
    claims = await verifier.verify(credentials.credentials)
    try:
        user_id, session_id = UUID(claims["sub"]), UUID(claims["session_id"])
    except (ValueError, TypeError) as exc:
        raise APIError(401, "invalid_token", "Token identity claims are malformed.") from exc
    row = await authorization_service.get_principal_session(connection, user_id, session_id)
    if row is None:
        raise APIError(403, "identity_not_provisioned", "User profile is not provisioned.")
    if row["status"] != "active":
        raise APIError(403, "account_inactive", "This account is not active.")
    if row["email_confirmed_at"] is None and row["phone_confirmed_at"] is None:
        raise APIError(403, "identity_unverified", "Verify the account email or phone before continuing.")
    issued_at = datetime.fromtimestamp(float(claims["iat"]), tz=UTC)
    if (not row["session_exists"] or row["device_revoked_at"] is not None
            or (row["session_not_after"] is not None and row["session_not_after"] <= datetime.now(UTC))
            or (row["session_revoked_at"] is not None and issued_at <= row["session_revoked_at"])):
        raise APIError(401, "session_revoked", "This Supabase Auth session is no longer active.")
    if row["session_device_id"] is None and request.url.path != "/api/v1/auth/sessions/current":
        raise APIError(401,"session_not_registered","Register this device session before accessing SalesX-Ai APIs.")
    principal=Principal(user_id,row["email"],row["display_name"],session_id,claims)
    request.state.principal=principal
    return principal

async def resolve_tenant_context(
    request: Request, principal: Principal, connection: asyncpg.Connection
) -> TenantContext:
    raw_org_id = request.headers.get("x-organization-id")
    org_id = None
    if raw_org_id:
        try:
            org_id = UUID(raw_org_id)
        except ValueError as exc:
            raise APIError(400,"invalid_tenant_context","X-Organization-ID must be a UUID.") from exc
    rows = await authorization_service.find_active_memberships(connection, principal.user_id, org_id)
    if not rows:
        raise APIError(403,"tenant_membership_required","No active organization membership is available.")
    if len(rows) != 1:
        raise APIError(400,"invalid_tenant_context","Select one organization using X-Organization-ID.")
    row=rows[0]
    context=TenantContext(row["organization_id"],row["membership_id"],row["branch_id"],row["organization_name"])
    request.state.tenant_context=context
    return context

def require_self_permission(permission_key: str):
    """Authorize an account-owned action from active platform/tenant/branch assignments."""
    async def dependency(
        request: Request,
        principal: Principal = Depends(get_current_principal),
        connection: asyncpg.Connection = Depends(get_connection),
    ) -> Principal:
        request.state.required_permission=permission_key
        allowed = await authorization_service.has_self_permission(connection, principal.user_id, permission_key)
        resource={"owner_user_id":str(principal.user_id)}
        if not allowed:
            await audit_authorization_denial(request,principal,permission_key,connection)
            raise APIError(403,"forbidden","The requested self-scoped identity action is not permitted.")
        request.state.authorized_permission=permission_key
        request.state.resource_attributes=resource
        return principal
    return dependency


def require_permission(permission_key: str):
    async def dependency(
        request: Request,
        principal: Principal = Depends(get_current_principal),
        connection: asyncpg.Connection = Depends(get_connection),
    ) -> TenantContext:
        request.state.required_permission=permission_key
        tenant=await resolve_tenant_context(request,principal,connection)
        raw_branch=request.headers.get("x-resource-branch-id")
        branch_id=tenant.branch_id
        if raw_branch:
            try:
                branch_id=UUID(raw_branch)
            except ValueError as exc:
                raise APIError(400,"invalid_tenant_context","Resource branch identifier is invalid.") from exc
        if branch_id is not None:
            branch_is_in_tenant = await authorization_service.branch_belongs_to_tenant(
                connection, branch_id, tenant.organization_id
            )
            if not branch_is_in_tenant:
                raise APIError(403,"invalid_tenant_context","The selected branch does not belong to the active tenant.")
        resource=getattr(request.state,"resource_attributes",{})
        allowed=await authorization_service.has_tenant_permission(
            connection,principal.user_id,tenant.membership_id,tenant.organization_id,
            branch_id,permission_key,resource,
        )
        if not allowed:
            await audit_authorization_denial(request,principal,permission_key,connection,tenant)
            raise APIError(403,"forbidden","The requested action is not permitted in this tenant context.")
        request.state.authorized_permission=permission_key
        return tenant
    return dependency


def require_platform_permission(permission_key: str):
    async def dependency(
        request: Request,
        principal: Principal = Depends(get_current_principal),
        connection: asyncpg.Connection = Depends(get_connection),
    ) -> Principal:
        request.state.required_permission=permission_key
        allowed = await authorization_service.has_platform_permission(
            connection, principal.user_id, permission_key
        )
        if not allowed:
            await audit_authorization_denial(request,principal,permission_key,connection)
            raise APIError(403,"forbidden","A platform-scoped permission is required.")
        return principal
    return dependency


_ACTION_CONTRACTS_BY_ID = {item.id: item for item in API_ACTION_MATRIX}


def require_api_action(action_id: str):
    """Resolve a route dependency from the canonical action contract and tag its ID."""
    contract = _ACTION_CONTRACTS_BY_ID.get(action_id)
    if contract is None:
        raise RuntimeError(f"Unknown API action contract: {action_id}")
    if contract.scope == "bff":
        raise RuntimeError(f"BFF-only action cannot use user authorization dependency: {action_id}")
    if contract.scope == "self":
        if contract.permission_key:
            dependency = require_self_permission(contract.permission_key)
        else:
            async def dependency(principal: Principal = Depends(get_current_principal)) -> Principal:
                return principal
    elif contract.scope == "tenant":
        if not contract.permission_key:
            raise RuntimeError(f"Tenant action has no permission key: {action_id}")
        dependency = require_permission(contract.permission_key)
    elif contract.scope == "platform":
        if not contract.permission_key:
            raise RuntimeError(f"Platform action has no permission key: {action_id}")
        dependency = require_platform_permission(contract.permission_key)
    else:
        raise RuntimeError(f"Unsupported API action scope for {action_id}: {contract.scope}")
    async def action_dependency(request: Request, result=Depends(dependency)):
        request.state.authorized_api_action_id = action_id
        return result

    action_dependency.__api_action_id__ = action_id
    return action_dependency
