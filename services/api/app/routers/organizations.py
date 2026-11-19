import asyncpg
from fastapi import APIRouter, Depends, Request
from uuid import UUID
from app.db import get_connection
from app.errors import APIError
from app.schemas.identity import MemberCreate,MemberStatusUpdate,OrganizationCreate,OrganizationResponse,RoleAssignmentCreate,InvitationCreate,InvitationToken
from app.security.dependencies import Principal,TenantContext,get_current_principal,require_api_action
from app.services.organization_mutations import organization_mutation_service
from app.services.organization_reads import organization_read_service
from app.services.invitation_mutations import invitation_mutation_service

router=APIRouter(prefix="/organizations",tags=["organizations"])


@router.get("")
async def list_my_organizations(
    principal: Principal=Depends(require_api_action("organization.list.self")),
    connection: asyncpg.Connection=Depends(get_connection),
)->list[dict]:
    return await organization_read_service.list_my_organizations(connection,principal)


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
    return await organization_read_service.list_members(connection,organization_id,tenant)


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
    organization_id: UUID, request: Request,
    principal: Principal=Depends(require_api_action("organization.roles.assignable")),
    tenant: TenantContext=Depends(require_api_action("organization.roles.assignable")),
    connection: asyncpg.Connection=Depends(get_connection),
)->list[dict]:
    return await organization_read_service.list_assignable_roles(connection,request,principal,tenant,organization_id)


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
