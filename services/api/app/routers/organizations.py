import asyncpg
from fastapi import APIRouter, Depends, Request
from uuid import UUID
from app.db import get_connection
from app.errors import APIError
from app.schemas.identity import MemberCreate,MemberStatusUpdate,OrganizationCreate,OrganizationResponse,RoleAssignmentCreate,InvitationCreate,InvitationToken
from app.security.dependencies import Principal,TenantContext,get_current_principal,require_api_action
from app.security.policy import abac_conditions_match
from app.services.authorization import authorization_service
from app.services.organization_mutations import organization_mutation_service
from app.services.invitation_mutations import invitation_mutation_service

router=APIRouter(prefix="/organizations",tags=["organizations"])


async def _delegation_hierarchy_level(
    connection: asyncpg.Connection,
    user_id: UUID,
    membership_id: UUID,
    organization_id: UUID,
    permission_key: str,
    branch_id: UUID | None = None,
    resource_attributes: dict | None = None,
) -> int | None:
    """Resolve hierarchy only from assignments that actually authorize this action.

    Parent-role inheritance, target scope and the same ABAC attributes used by
    require_permission are applied before choosing the actor's delegation level.
    """
    rows = await connection.fetch(
        """
        with recursive role_tree(role_id, parent_role_id, attributes) as (
          select r.id, r.parent_role_id, ura.attributes
          from public.user_role_assignments ura
          join public.roles r on r.id=ura.role_id
          where ura.user_id=$1 and ura.revoked_at is null
            and ura.starts_at<=now() and (ura.expires_at is null or ura.expires_at>now())
            and (
              (ura.scope_type='platform' and ura.membership_id is null and ura.scope_id is null)
              or (ura.scope_type='tenant' and ura.membership_id=$2 and ura.scope_id=$3)
              or ($4::uuid is not null and ura.scope_type='branch'
                  and ura.membership_id=$2 and ura.scope_id=$4)
            )
          union
          select parent.id, parent.parent_role_id, child.attributes
          from role_tree child
          join public.roles parent on parent.id=child.parent_role_id
        )
        select distinct r.hierarchy_level, tree.attributes
        from role_tree tree
        join public.roles r on r.id=tree.role_id
        join public.role_permissions rp on rp.role_id=r.id and rp.permission_key=$5
        """,
        user_id, membership_id, organization_id, branch_id, permission_key,
    )
    allowed_levels = [
        row["hierarchy_level"] for row in rows
        if abac_conditions_match(row["attributes"], resource_attributes or {})
    ]
    return min(allowed_levels) if allowed_levels else None


async def _member_hierarchy_level(
    connection: asyncpg.Connection,
    user_id: UUID,
    membership_id: UUID,
    organization_id: UUID,
) -> int | None:
    """Return the target member's highest active tenant/branch role level."""
    return await connection.fetchval(
        """
        with recursive role_tree(role_id, parent_role_id) as (
          select r.id, r.parent_role_id
          from public.user_role_assignments ura
          join public.roles r on r.id=ura.role_id
          where ura.user_id=$1 and ura.membership_id=$2 and ura.revoked_at is null
            and ura.starts_at<=now() and (ura.expires_at is null or ura.expires_at>now())
            and (
              (ura.scope_type='tenant' and ura.scope_id=$3)
              or (ura.scope_type='branch' and exists(
                select 1 from public.branches b
                where b.id=ura.scope_id and b.organization_id=$3 and b.status='active'
              ))
            )
          union
          select parent.id, parent.parent_role_id
          from role_tree child join public.roles parent on parent.id=child.parent_role_id
        )
        select min(r.hierarchy_level)
        from role_tree tree join public.roles r on r.id=tree.role_id
        """,
        user_id,membership_id,organization_id,
    )


@router.get("")
async def list_my_organizations(
    principal: Principal=Depends(require_api_action("organization.list.self")),
    connection: asyncpg.Connection=Depends(get_connection),
)->list[dict]:
    rows=await connection.fetch(
      """select o.id,o.slug,o.name,o.status,m.id membership_id,m.status membership_status
      from public.organization_memberships m join public.organizations o on o.id=m.organization_id
      where m.user_id=$1 and m.status<>'removed' order by o.name""",principal.user_id)
    return [dict(row) for row in rows]

@router.post("",response_model=OrganizationResponse,status_code=201)
async def create_organization(
    payload: OrganizationCreate,request: Request,
    principal: Principal=Depends(require_api_action("organization.create")),
    connection: asyncpg.Connection=Depends(get_connection),
)->OrganizationResponse:
    row=await organization_mutation_service.create_organization(connection,request,principal,payload)
    return OrganizationResponse(**row)


@router.get("/{organization_id}/members")
async def list_members(
    organization_id: UUID,
    tenant: TenantContext=Depends(require_api_action("organization.members.read")),
    connection: asyncpg.Connection=Depends(get_connection),
)->list[dict]:
    if tenant.organization_id!=organization_id:
        raise APIError(403,"forbidden","Cross-tenant membership access is denied.")
    rows=await connection.fetch(
      """select m.user_id,p.email,p.display_name,p.status account_status,m.status membership_status,
      m.title,m.branch_id,m.joined_at from public.organization_memberships m
      join public.profiles p on p.id=m.user_id where m.organization_id=$1
      order by p.display_name nulls last,p.email""",organization_id)
    return [dict(row) for row in rows]

@router.post("/{organization_id}/members",status_code=201)
async def add_existing_member(
    organization_id: UUID,payload: MemberCreate,request: Request,
    principal: Principal=Depends(get_current_principal),
    tenant: TenantContext=Depends(require_api_action("organization.members.invite")),
    connection: asyncpg.Connection=Depends(get_connection),
)->dict:
    return await organization_mutation_service.add_member(
        connection,request,principal,tenant,organization_id,payload.user_id,payload.title
    )


@router.patch("/{organization_id}/members/{user_id}")
async def update_member_status(
    organization_id: UUID,user_id: UUID,payload: MemberStatusUpdate,request: Request,
    principal: Principal=Depends(get_current_principal),
    tenant: TenantContext=Depends(require_api_action("organization.members.update")),
    connection: asyncpg.Connection=Depends(get_connection),
)->dict:
    return await organization_mutation_service.update_member_status(
        connection,request,principal,tenant,organization_id,user_id,payload.status
    )

@router.post("/{organization_id}/members/{user_id}/roles",status_code=201)
async def assign_member_role(
    organization_id: UUID,user_id: UUID,payload: RoleAssignmentCreate,request: Request,
    principal: Principal=Depends(get_current_principal),
    tenant: TenantContext=Depends(require_api_action("organization.roles.assign")),
    connection: asyncpg.Connection=Depends(get_connection),
)->dict:
    return await organization_mutation_service.assign_member_role(
        connection,request,principal,tenant,organization_id,user_id,payload.role_key,payload.branch_id
    )


@router.get("/{organization_id}/assignable-roles")
async def list_assignable_roles(
    organization_id: UUID,
    request: Request,
    principal: Principal = Depends(get_current_principal),
    tenant: TenantContext = Depends(require_api_action("organization.roles.assignable")),
    connection: asyncpg.Connection = Depends(get_connection),
 ) -> list[dict]:
    authorization_service.assert_action_context(request,"organization.invitations.read",principal.user_id,organization_id)
    if tenant.organization_id != organization_id:
        raise APIError(403,"forbidden","Cross-tenant role catalog access is denied.")
    selected_branch_id=tenant.branch_id
    raw_branch_id=request.headers.get("x-resource-branch-id")
    if raw_branch_id:
        try:
            selected_branch_id=UUID(raw_branch_id)
        except ValueError as exc:
            raise APIError(400,"invalid_tenant_context","Resource branch identifier is invalid.") from exc
    tenant_level = await _delegation_hierarchy_level(
        connection,principal.user_id,tenant.membership_id,organization_id,
        "organization:invitations:manage",resource_attributes=getattr(request.state,"resource_attributes",{}))
    branch_level = await _delegation_hierarchy_level(
        connection,principal.user_id,tenant.membership_id,organization_id,
        "organization:invitations:manage",selected_branch_id,
        getattr(request.state,"resource_attributes",{}))
    if tenant_level is None and branch_level is None:
        raise APIError(403,"forbidden","An active scoped role is required to delegate access.")
    rows = await connection.fetch(
        """select key,name,scope_type,hierarchy_level from public.roles
        where key<>'tenant_owner' and (
          (scope_type='tenant' and $1::int is not null and hierarchy_level>$1)
          or (scope_type='branch' and $2::int is not null and hierarchy_level>$2)
        ) order by hierarchy_level desc,name""",
        tenant_level,branch_level,
    )
    return [dict(row) for row in rows]




@router.get("/{organization_id}/invitations")
async def list_invitations(
    organization_id: UUID, request: Request,
    tenant: TenantContext = Depends(require_api_action("organization.invitations.read")),
    principal: Principal = Depends(get_current_principal),
    connection: asyncpg.Connection = Depends(get_connection),
) -> list[dict]:
    return await invitation_mutation_service.list_invitations(connection,request,principal,tenant,organization_id)


@router.post("/{organization_id}/invitations", status_code=201)
async def create_invitation(
    organization_id: UUID, payload: InvitationCreate, request: Request,
    principal: Principal = Depends(get_current_principal),
    tenant: TenantContext = Depends(require_api_action("organization.invitations.create")),
    connection: asyncpg.Connection = Depends(get_connection),
) -> dict:
    return await invitation_mutation_service.create_invitation(connection,request,principal,tenant,organization_id,payload)


@router.post("/invitations/accept")
async def accept_invitation(
    payload: InvitationToken, request: Request,
    principal: Principal = Depends(require_api_action("organization.invitations.accept")),
    connection: asyncpg.Connection = Depends(get_connection),
) -> dict:
    return await invitation_mutation_service.accept_invitation(connection,request,principal,payload)


@router.post("/invitations/reject")
async def reject_invitation(
    payload: InvitationToken, request: Request,
    principal: Principal = Depends(require_api_action("organization.invitations.reject")),
    connection: asyncpg.Connection = Depends(get_connection),
) -> dict:
    return await invitation_mutation_service.reject_invitation(connection,request,principal,payload)


@router.post("/{organization_id}/invitations/{invitation_id}/revoke")
async def revoke_invitation(
    organization_id: UUID, invitation_id: UUID, request: Request,
    principal: Principal = Depends(get_current_principal),
    tenant: TenantContext = Depends(require_api_action("organization.invitations.revoke")),
    connection: asyncpg.Connection = Depends(get_connection),
) -> dict:
    return await invitation_mutation_service.revoke_invitation(connection,request,principal,tenant,organization_id,invitation_id)


@router.post("/{organization_id}/invitations/{invitation_id}/resend")
async def resend_invitation(
    organization_id: UUID, invitation_id: UUID, request: Request,
    principal: Principal = Depends(get_current_principal),
    tenant: TenantContext = Depends(require_api_action("organization.invitations.resend")),
    connection: asyncpg.Connection = Depends(get_connection),
) -> dict:
    return await invitation_mutation_service.resend_invitation(connection,request,principal,tenant,organization_id,invitation_id)
