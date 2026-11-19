from dataclasses import dataclass
from datetime import UTC, datetime
from typing import Any
from uuid import UUID
import asyncpg
from fastapi import Depends, Request
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from app.db import get_connection
from app.errors import APIError
from app.security.jwt import SupabaseJWTVerifier
from app.security.policy import abac_conditions_match

bearer_scheme = HTTPBearer(auto_error=False)

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
    row = await connection.fetchrow(
        """
        select p.email,p.display_name,p.status,p.session_revoked_at,u.email_confirmed_at,u.phone_confirmed_at,
               (s.id is not null) session_exists,sd.revoked_at device_revoked_at
        from public.profiles p join auth.users u on u.id=p.id
        left join auth.sessions s on s.id=$2 and s.user_id=p.id
        left join public.session_devices sd on sd.auth_session_id=s.id
        where p.id=$1
        """, user_id, session_id,
    )
    if row is None:
        raise APIError(403, "identity_not_provisioned", "User profile is not provisioned.")
    if row["status"] != "active":
        raise APIError(403, "account_inactive", "This account is not active.")
    if row["email_confirmed_at"] is None and row["phone_confirmed_at"] is None:
        raise APIError(403, "identity_unverified", "Verify the account email or phone before continuing.")
    issued_at = datetime.fromtimestamp(float(claims["iat"]), tz=UTC)
    if (not row["session_exists"] or row["device_revoked_at"] is not None
            or (row["session_revoked_at"] is not None and issued_at <= row["session_revoked_at"])):
        raise APIError(401, "session_revoked", "This Supabase Auth session is no longer active.")
    return Principal(user_id,row["email"],row["display_name"],session_id,claims)

async def resolve_tenant_context(
    request: Request, principal: Principal, connection: asyncpg.Connection
) -> TenantContext:
    raw_org_id = request.headers.get("x-organization-id")
    if raw_org_id:
        try:
            org_id = UUID(raw_org_id)
        except ValueError as exc:
            raise APIError(400,"invalid_tenant_context","X-Organization-ID must be a UUID.") from exc
        rows = await connection.fetch(
            """
            select m.id membership_id,m.organization_id,m.branch_id,o.name organization_name
            from public.organization_memberships m join public.organizations o on o.id=m.organization_id
            where m.user_id=$1 and m.organization_id=$2 and m.status='active' and o.status='active'
            """,principal.user_id,org_id)
    else:
        rows = await connection.fetch(
            """
            select m.id membership_id,m.organization_id,m.branch_id,o.name organization_name
            from public.organization_memberships m join public.organizations o on o.id=m.organization_id
            where m.user_id=$1 and m.status='active' and o.status='active' order by m.created_at
            """,principal.user_id)
    if not rows:
        raise APIError(403,"tenant_membership_required","No active organization membership is available.")
    if len(rows) != 1:
        raise APIError(400,"invalid_tenant_context","Select one organization using X-Organization-ID.")
    row=rows[0]
    context=TenantContext(row["organization_id"],row["membership_id"],row["branch_id"],row["organization_name"])
    request.state.tenant_context=context
    return context

def require_permission(permission_key: str):
    async def dependency(
        request: Request,
        principal: Principal = Depends(get_current_principal),
        connection: asyncpg.Connection = Depends(get_connection),
    ) -> TenantContext:
        tenant=await resolve_tenant_context(request,principal,connection)
        raw_branch=request.headers.get("x-resource-branch-id")
        branch_id=tenant.branch_id
        if raw_branch:
            try:
                branch_id=UUID(raw_branch)
            except ValueError as exc:
                raise APIError(400,"invalid_tenant_context","Resource branch identifier is invalid.") from exc
            branch_is_in_tenant=await connection.fetchval(
                "select exists(select 1 from public.branches where id=$1 and organization_id=$2 and status='active')",
                branch_id,tenant.organization_id)
            if not branch_is_in_tenant:
                raise APIError(403,"invalid_tenant_context","The selected branch does not belong to the active tenant.")
        assignments=await connection.fetch(
            """
            with recursive role_tree(role_id,parent_role_id,attributes) as (
              select r.id,r.parent_role_id,ura.attributes
              from public.user_role_assignments ura join public.roles r on r.id=ura.role_id
              where ura.user_id=$1 and ura.revoked_at is null and ura.starts_at<=now()
                and (ura.expires_at is null or ura.expires_at>now())
                and ((ura.scope_type='platform' and ura.membership_id is null)
                  or (ura.scope_type='tenant' and ura.membership_id=$2 and ura.scope_id=$3)
                  or (ura.scope_type='branch' and ura.membership_id=$2 and ura.scope_id=$4))
              union
              select p.id,p.parent_role_id,c.attributes from role_tree c
              join public.roles p on p.id=c.parent_role_id
            )
            select rt.attributes from role_tree rt join public.role_permissions rp on rp.role_id=rt.role_id
            where rp.permission_key=$5
            """,principal.user_id,tenant.membership_id,tenant.organization_id,branch_id,permission_key)
        resource=getattr(request.state,"resource_attributes",{})
        allowed=any(abac_conditions_match(row["attributes"],resource) for row in assignments)
        if not allowed:
            raise APIError(403,"forbidden","The requested action is not permitted in this tenant context.")
        request.state.authorized_permission=permission_key
        return tenant
    return dependency


def require_platform_permission(permission_key: str):
    async def dependency(
        principal: Principal = Depends(get_current_principal),
        connection: asyncpg.Connection = Depends(get_connection),
    ) -> Principal:
        allowed = await connection.fetchval(
            """
            with recursive role_tree(role_id,parent_role_id) as (
              select r.id,r.parent_role_id
              from public.user_role_assignments ura
              join public.roles r on r.id=ura.role_id
              where ura.user_id=$1 and ura.scope_type='platform'
                and ura.membership_id is null and ura.scope_id is null
                and ura.revoked_at is null and ura.starts_at<=now()
                and (ura.expires_at is null or ura.expires_at>now())
              union
              select parent.id,parent.parent_role_id
              from role_tree child join public.roles parent on parent.id=child.parent_role_id
            )
            select exists(
              select 1 from role_tree tree
              join public.role_permissions rp on rp.role_id=tree.role_id
              where rp.permission_key=$2
            )
            """, principal.user_id, permission_key,
        )
        if not allowed:
            raise APIError(403,"forbidden","A platform-scoped permission is required.")
        return principal
    return dependency
