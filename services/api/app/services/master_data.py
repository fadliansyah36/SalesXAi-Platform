from __future__ import annotations

import json
from typing import Any
from uuid import UUID

import asyncpg
from fastapi import Request

from app.errors import APIError
from app.repositories.master_data import MasterDataRepository, RESOURCE_TABLES
from app.security.dependencies import Principal, TenantContext
from app.services.audit import write_audit


class MasterDataService:
    def __init__(self, repository: MasterDataRepository | None = None):
        self.repository = repository or MasterDataRepository()

    def _tenant(self, organization_id: UUID, tenant: TenantContext) -> None:
        if tenant.organization_id != organization_id:
            raise APIError(403, "forbidden", "Cross-tenant master-data access is denied.")

    async def list(self, connection: asyncpg.Connection, resource: str, organization_id: UUID, tenant: TenantContext, limit: int, offset: int) -> list[dict[str, Any]]:
        self._tenant(organization_id, tenant)
        if resource not in RESOURCE_TABLES:
            raise APIError(404, "master_data_resource_not_found", "Unsupported master-data resource.")
        return await self.repository.list(connection, resource, organization_id, limit, offset)

    async def list_assignments(self, connection: asyncpg.Connection, organization_id: UUID, tenant: TenantContext, limit: int, offset: int) -> list[dict[str, Any]]:
        self._tenant(organization_id, tenant)
        return await self.repository.list_assignments(connection, organization_id, limit, offset)

    async def my_assignment_context(self, connection: asyncpg.Connection, organization_id: UUID, tenant: TenantContext, principal: Principal) -> dict[str, Any]:
        self._tenant(organization_id, tenant)
        return await self.repository.my_assignment_context(connection, organization_id, principal.user_id)

    async def _validate_references(self, connection: asyncpg.Connection, organization_id: UUID, resource: str, values: dict[str, Any]) -> dict[str, Any]:
        allowed_status = {"active", "inactive", "suspended"} if resource == "sales_profiles" else {"active", "inactive", "archived"}
        if values.get("status") is not None and values["status"] not in allowed_status:
            raise APIError(422, "invalid_master_data_status", "The status is not supported for this resource.")
        for field in ("branch_id", "team_id", "territory_id", "parent_team_id", "parent_territory_id"):
            ref_id = values.get(field)
            if ref_id is not None:
                table = "branches" if field == "branch_id" else "teams" if field == "team_id" or field == "parent_team_id" else "territories"
                exists = await connection.fetchval(
                    f"select exists(select 1 from public.{table} where organization_id=$1 and id=$2 and status='active')",
                    organization_id, ref_id,
                )
                if not exists:
                    raise APIError(422, "invalid_master_data_reference", f"{field} must reference an active record in this organization.")
        for field in ("user_id", "supervisor_user_id", "manager_user_id"):
            user_id = values.get(field)
            if user_id is not None:
                member = await connection.fetchval(
                    """select exists(
                         select 1 from public.organization_memberships m
                         where m.organization_id=$1 and m.user_id=$2 and m.status='active'
                       )""",
                    organization_id, user_id,
                )
                if not member:
                    raise APIError(422, "tenant_member_required", "Assigned users must have an active membership in this organization.")
        if resource == "sales_profiles":
            user_id = values.get("user_id")
            if user_id is None:
                raise APIError(422, "sales_profile_user_required", "Select a user with an active organization membership.")
            membership = await connection.fetchrow(
                """select m.id,m.user_id from public.organization_memberships m
                   where m.organization_id=$1 and m.user_id=$2 and m.status='active'
                     and exists (
                       select 1 from public.user_role_assignments ura
                       join public.roles r on r.id=ura.role_id
                       where ura.membership_id=m.id and ura.revoked_at is null
                         and ura.starts_at<=now() and (ura.expires_at is null or ura.expires_at>now())
                         and r.key in ('sales_rep','supervisor')
                     )
                   order by m.created_at desc limit 1""",
                organization_id, user_id,
            )
            if membership is None:
                raise APIError(422, "sales_profile_membership_role_required", "Sales profile requires an active membership with sales_rep or supervisor role.")
            values["membership_id"] = membership["id"]
            values["user_id"] = membership["user_id"]
        if resource == "teams" and values.get("supervisor_user_id") is not None:
            valid_supervisor = await connection.fetchval(
                """select exists(
                     select 1 from public.organization_memberships m
                     join public.user_role_assignments ura on ura.membership_id=m.id
                     join public.roles r on r.id=ura.role_id
                     where m.organization_id=$1 and m.user_id=$2 and m.status='active'
                       and r.key='supervisor' and ura.revoked_at is null
                       and ura.starts_at<=now() and (ura.expires_at is null or ura.expires_at>now())
                   )""",
                organization_id, values["supervisor_user_id"],
            )
            if not valid_supervisor:
                raise APIError(422, "supervisor_role_required", "Team supervisor must have an active supervisor role in this organization.")
        return values

    async def create(self, connection: asyncpg.Connection, request: Request, principal: Principal, tenant: TenantContext, resource: str, organization_id: UUID, values: dict[str, Any]) -> dict[str, Any]:
        self._tenant(organization_id, tenant)
        if resource not in RESOURCE_TABLES:
            raise APIError(404, "master_data_resource_not_found", "Unsupported master-data resource.")
        try:
            async with connection.transaction():
                clean = await self._validate_references(connection, organization_id, resource, dict(values))
                row = await self.repository.create(connection, resource, organization_id, clean)
                await write_audit(connection, request, principal, f"{resource}.created", resource, str(row["id"]), tenant, {"fields": sorted(clean)})
                return row
        except ValueError as exc:
            raise APIError(422, "invalid_master_data", str(exc)) from exc
        except asyncpg.UniqueViolationError as exc:
            raise APIError(409, "master_data_conflict", "A tenant-scoped code or identity already exists.") from exc
        except asyncpg.ForeignKeyViolationError as exc:
            raise APIError(422, "invalid_master_data_reference", "A referenced branch, team, territory, membership or user is not valid for this tenant.") from exc

    async def update(self, connection: asyncpg.Connection, request: Request, principal: Principal, tenant: TenantContext, resource: str, organization_id: UUID, resource_id: UUID, values: dict[str, Any]) -> dict[str, Any]:
        self._tenant(organization_id, tenant)
        if resource not in RESOURCE_TABLES:
            raise APIError(404, "master_data_resource_not_found", "Unsupported master-data resource.")
        try:
            async with connection.transaction():
                clean = await self._validate_references(connection, organization_id, resource, dict(values))
                row = await self.repository.update(connection, resource, organization_id, resource_id, clean)
                if row is None:
                    raise APIError(404, "master_data_not_found", "The tenant-owned record was not found.")
                dependency_counts = {}
                if clean.get("status") in {"inactive", "archived"}:
                    dependency_counts = await self.repository.deactivate_dependents(connection, resource, organization_id, resource_id, principal.user_id)
                await write_audit(
                    connection, request, principal, f"{resource}.updated", resource, str(resource_id), tenant,
                    {"fields": sorted(clean), "dependency_changes": dependency_counts},
                )
                return {**row, "dependency_changes": dependency_counts}
        except ValueError as exc:
            raise APIError(422, "invalid_master_data", str(exc)) from exc
        except asyncpg.UniqueViolationError as exc:
            raise APIError(409, "master_data_conflict", "A tenant-scoped code already exists.") from exc
        except asyncpg.ForeignKeyViolationError as exc:
            raise APIError(422, "invalid_master_data_reference", "A referenced record does not belong to this tenant.") from exc

    async def assign_outlet(self, connection: asyncpg.Connection, request: Request, principal: Principal, tenant: TenantContext, organization_id: UUID, outlet_id: UUID, sales_profile_id: UUID, note: str | None) -> dict[str, Any]:
        self._tenant(organization_id, tenant)
        try:
            async with connection.transaction():
                valid = await connection.fetchval(
                    """select exists(select 1 from public.outlets where id=$1 and organization_id=$2 and status='active')
                       and exists(
                         select 1 from public.sales_profiles sp
                         join public.organization_memberships m on m.id=sp.membership_id
                           and m.organization_id=sp.organization_id and m.user_id=sp.user_id and m.status='active'
                         left join public.teams t on t.id=sp.team_id and t.organization_id=sp.organization_id
                         left join public.territories ter on ter.id=sp.territory_id and ter.organization_id=sp.organization_id
                         where sp.id=$3 and sp.organization_id=$2 and sp.status='active'
                           and (sp.team_id is null or t.status='active')
                           and (sp.territory_id is null or ter.status='active')
                       )""",
                    outlet_id, organization_id, sales_profile_id,
                )
                if not valid:
                    raise APIError(422, "invalid_assignment_target", "An active tenant outlet, active membership and active sales profile with valid team/territory are required.")
                row = await self.repository.assign_outlet(connection, organization_id, outlet_id, sales_profile_id, principal.user_id, note)
                await write_audit(
                    connection, request, principal, "outlet.assignment.created", "outlet_assignment", str(row["id"]), tenant,
                    {"outlet_id": str(outlet_id), "sales_profile_id": str(sales_profile_id), "team_id": str(row["assigned_team_id"]) if row["assigned_team_id"] else None, "territory_id": str(row["assigned_territory_id"]) if row["assigned_territory_id"] else None},
                )
                return row
        except asyncpg.UniqueViolationError as exc:
            raise APIError(409, "assignment_conflict", "An active assignment already exists for this outlet.") from exc
        except asyncpg.ForeignKeyViolationError as exc:
            raise APIError(404, "assignment_resource_not_found", "Outlet or sales profile does not exist in the active tenant.") from exc

    async def import_rows(self, connection: asyncpg.Connection, request: Request, principal: Principal, tenant: TenantContext, organization_id: UUID, resource: str, idempotency_key: str, rows: list[dict[str, Any]]) -> dict[str, Any]:
        self._tenant(organization_id, tenant)
        if resource not in RESOURCE_TABLES:
            raise APIError(404, "master_data_resource_not_found", "Unsupported master-data resource.")
        if len(idempotency_key.strip()) < 8:
            raise APIError(422, "invalid_idempotency_key", "Idempotency key must contain at least 8 characters.")
        async with connection.transaction():
            batch = await self.repository.begin_import(connection, organization_id, resource, idempotency_key, principal.user_id)
            if batch is None:
                existing = await self.repository.get_import(connection, organization_id, resource, idempotency_key)
                if existing and existing["status"] == "completed" and existing["result"]:
                    return dict(existing["result"])
                raise APIError(409, "import_in_progress", "An import with this idempotency key is already running.")
            errors: list[dict[str, Any]] = []
            imported = 0
            for index, raw in enumerate(rows, start=1):
                try:
                    async with connection.transaction():
                        clean = {key: value for key, value in raw.items() if key in RESOURCE_TABLES[resource]}
                        clean = await self._validate_references(connection, organization_id, resource, clean)
                        await self.repository.create(connection, resource, organization_id, clean)
                        imported += 1
                except APIError as exc:
                    errors.append({"row": index, "code": exc.code, "message": exc.message})
                except asyncpg.UniqueViolationError:
                    errors.append({"row": index, "code": "duplicate_record", "message": "A tenant-scoped code or identity already exists."})
                except asyncpg.ForeignKeyViolationError:
                    errors.append({"row": index, "code": "invalid_reference", "message": "A referenced record does not belong to this tenant."})
                except ValueError as exc:
                    errors.append({"row": index, "code": "invalid_row", "message": str(exc)})
            result = {
                "batch_id": batch["id"], "resource": resource, "total_rows": len(rows),
                "imported_rows": imported, "failed_rows": len(errors), "errors": errors,
            }
            await self.repository.complete_import(connection, batch["id"], result)
            await write_audit(
                connection, request, principal, f"{resource}.imported", "master_data_import_batch",
                str(batch["id"]), tenant,
                {"total_rows": len(rows), "imported_rows": imported, "failed_rows": len(errors), "idempotency_key": idempotency_key},
            )
            return result


master_data_service = MasterDataService()
