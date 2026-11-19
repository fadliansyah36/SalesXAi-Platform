from __future__ import annotations

import logging
from typing import Any
from uuid import UUID

import asyncpg
from fastapi import Request

from app.errors import APIError
from app.repositories.authorization import authorization_repository
from app.security.policy import abac_conditions_match

logger = logging.getLogger("salesx.api.authorization")


class AuthorizationService:
    """Application service for identity, tenant and RBAC/ABAC authorization."""

    def __init__(self, repository=authorization_repository) -> None:
        self.repository = repository

    async def get_principal_session(
        self, connection: asyncpg.Connection, user_id: UUID, session_id: UUID
    ) -> asyncpg.Record | None:
        return await self.repository.get_principal_session(connection, user_id, session_id)

    async def find_active_memberships(
        self, connection: asyncpg.Connection, user_id: UUID,
        organization_id: UUID | None = None,
    ) -> list[asyncpg.Record]:
        return await self.repository.find_active_memberships(connection, user_id, organization_id)

    async def has_self_permission(
        self, connection: asyncpg.Connection, user_id: UUID, permission_key: str
    ) -> bool:
        assignments = await self.repository.get_self_permission_attributes(
            connection, user_id, permission_key
        )
        resource = {"owner_user_id": str(user_id)}
        return any(abac_conditions_match(row["attributes"], resource) for row in assignments)

    async def branch_belongs_to_tenant(
        self, connection: asyncpg.Connection, branch_id: UUID, organization_id: UUID
    ) -> bool:
        return await self.repository.branch_belongs_to_tenant(connection, branch_id, organization_id)

    async def has_tenant_permission(
        self, connection: asyncpg.Connection, user_id: UUID, membership_id: UUID,
        organization_id: UUID, branch_id: UUID | None, permission_key: str,
        resource_attributes: dict[str, Any] | None = None,
    ) -> bool:
        assignments = await self.repository.get_tenant_permission_attributes(
            connection, user_id, membership_id, organization_id, branch_id, permission_key
        )
        resource = resource_attributes or {}
        return any(abac_conditions_match(row["attributes"], resource) for row in assignments)

    async def has_platform_permission(
        self, connection: asyncpg.Connection, user_id: UUID, permission_key: str
    ) -> bool:
        return await self.repository.has_platform_permission(connection, user_id, permission_key)

    async def record_denial(
        self, request: Request, principal: Any, permission_key: str,
        connection: asyncpg.Connection, tenant: Any = None,
    ) -> None:
        try:
            await self.repository.insert_authorization_denial(
                connection,
                actor_user_id=principal.user_id,
                organization_id=tenant.organization_id if tenant else None,
                resource_path=request.url.path,
                correlation_id=getattr(request.state, "correlation_id", None),
                user_agent=request.headers.get("user-agent", ""),
                method=request.method,
                permission_key=permission_key,
            )
            request.state.authorization_denial_audited = True
        except (asyncpg.PostgresError, asyncpg.InterfaceError):
            logger.exception(
                "authorization_denial_audit_failed",
                extra={"correlation_id": getattr(request.state, "correlation_id", None)},
            )

    def assert_action_context(
        self, request: Request, action_id: str, actor_user_id: UUID,
        organization_id: UUID | None = None,
    ) -> None:
        authorized_action = getattr(request.state, "authorized_api_action_id", None)
        principal = getattr(request.state, "principal", None)
        tenant = getattr(request.state, "tenant_context", None)
        if authorized_action != action_id or principal is None or principal.user_id != actor_user_id:
            raise APIError(403, "service_authorization_required", "The business service requires the matching authorized action context.")
        if organization_id is not None and (tenant is None or tenant.organization_id != organization_id):
            raise APIError(403, "service_tenant_scope_required", "The business service requires the active tenant scope.")


authorization_service = AuthorizationService()
