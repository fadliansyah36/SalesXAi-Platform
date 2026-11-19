import asyncpg
from fastapi import APIRouter, Depends, Request
from uuid import UUID
from app.db import get_connection
from app.errors import APIError
from app.schemas.identity import MemberCreate,MemberStatusUpdate,OrganizationCreate,OrganizationResponse,RoleAssignmentCreate
from app.security.dependencies import Principal,TenantContext,get_current_principal,require_permission
from app.services.audit import write_audit

router=APIRouter(prefix="/organizations",tags=["organizations"])

@router.get("")
async def list_my_organizations(
    principal: Principal=Depends(get_current_principal),
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
    principal: Principal=Depends(get_current_principal),
    connection: asyncpg.Connection=Depends(get_connection),
)->OrganizationResponse:
    async with connection.transaction():
        org=await connection.fetchrow(
          """insert into public.organizations(slug,name,legal_name,created_by)
          values ($1,$2,$3,$4) returning id,slug,name,status,created_at""",
          payload.slug,payload.name.strip(),payload.legal_name,principal.user_id)
        member=await connection.fetchrow(
          """insert into public.organization_memberships(organization_id,user_id,status,joined_at,title)
          values ($1,$2,'active',now(),'Owner') returning id""",org["id"],principal.user_id)
        role_id=await connection.fetchval("select id from public.roles where key='tenant_owner'")
        await connection.execute(
          """insert into public.user_role_assignments(user_id,membership_id,role_id,scope_type,scope_id,assigned_by)
          values ($1,$2,$3,'tenant',$4,$1)""",principal.user_id,member["id"],role_id,org["id"])
        await write_audit(connection,request,principal,"organization.created","organization",
          str(org["id"]),metadata={"slug":payload.slug})
    return OrganizationResponse(**dict(org))

@router.get("/{organization_id}/members")
async def list_members(
    organization_id: UUID,
    tenant: TenantContext=Depends(require_permission("organization:members:read")),
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
    tenant: TenantContext=Depends(require_permission("organization:members:manage")),
    connection: asyncpg.Connection=Depends(get_connection),
)->dict:
    if tenant.organization_id!=organization_id:
        raise APIError(403,"forbidden","Cross-tenant membership access is denied.")
    if not await connection.fetchval("select exists(select 1 from auth.users where id=$1)",payload.user_id):
        raise APIError(404,"identity_not_found","The Supabase Auth identity does not exist.")
    async with connection.transaction():
        row=await connection.fetchrow(
          """insert into public.organization_memberships(organization_id,user_id,status,title)
          values ($1,$2,'invited',$3)
          on conflict(organization_id,user_id) do update set title=excluded.title,
          status=case when public.organization_memberships.status='removed' then 'invited'
          else public.organization_memberships.status end,updated_at=now()
          returning id,user_id,organization_id,status,title""",
          organization_id,payload.user_id,payload.title)
        await write_audit(connection,request,principal,"organization.member.invited",
          "organization_membership",str(row["id"]),tenant,metadata={"member_user_id":str(payload.user_id)})
    return dict(row)

@router.patch("/{organization_id}/members/{user_id}")
async def update_member_status(
    organization_id: UUID,user_id: UUID,payload: MemberStatusUpdate,request: Request,
    principal: Principal=Depends(get_current_principal),
    tenant: TenantContext=Depends(require_permission("organization:members:manage")),
    connection: asyncpg.Connection=Depends(get_connection),
)->dict:
    if tenant.organization_id!=organization_id:
        raise APIError(403,"forbidden","Cross-tenant membership access is denied.")
    if user_id==principal.user_id and payload.status!="active":
        raise APIError(409,"self_lockout_prevented","You cannot suspend or remove your own membership.")
    async with connection.transaction():
        row=await connection.fetchrow(
          """update public.organization_memberships set status=$3,
          joined_at=case when $3='active' then coalesce(joined_at,now()) else joined_at end,updated_at=now()
          where organization_id=$1 and user_id=$2 returning id,user_id,organization_id,status""",
          organization_id,user_id,payload.status)
        if row is None:
            raise APIError(404,"membership_not_found","Organization membership was not found.")
        await write_audit(connection,request,principal,"organization.member.status_changed",
          "organization_membership",str(row["id"]),tenant,
          metadata={"member_user_id":str(user_id),"status":payload.status})
    return dict(row)

@router.post("/{organization_id}/members/{user_id}/roles",status_code=201)
async def assign_member_role(
    organization_id: UUID,user_id: UUID,payload: RoleAssignmentCreate,request: Request,
    principal: Principal=Depends(get_current_principal),
    tenant: TenantContext=Depends(require_permission("role:assign")),
    connection: asyncpg.Connection=Depends(get_connection),
)->dict:
    if tenant.organization_id!=organization_id:
        raise APIError(403,"forbidden","Cross-tenant role assignment is denied.")
    async with connection.transaction():
        member=await connection.fetchrow(
          "select id,branch_id from public.organization_memberships where organization_id=$1 and user_id=$2 and status='active'",
          organization_id,user_id)
        if member is None:
            raise APIError(404,"membership_not_found","An active target membership is required.")
        role=await connection.fetchrow(
          "select id,key,scope_type,hierarchy_level from public.roles where key=$1",payload.role_key)
        if role is None or role["scope_type"] not in {"tenant","branch"} or role["key"]=="tenant_owner":
            raise APIError(400,"invalid_role","Only delegable tenant- or branch-scoped roles can be assigned.")
        if role["scope_type"] == "branch":
            if payload.branch_id is None:
                raise APIError(400,"branch_scope_required","A branch ID is required for this role.")
            branch_exists = await connection.fetchval(
                "select exists(select 1 from public.branches where id=$1 and organization_id=$2 and status='active')",
                payload.branch_id, organization_id)
            if not branch_exists or (member["branch_id"] is not None and member["branch_id"] != payload.branch_id):
                raise APIError(403,"invalid_branch_scope","The selected branch is outside the target membership scope.")
            assignment_scope_id = payload.branch_id
        else:
            if payload.branch_id is not None:
                raise APIError(400,"invalid_branch_scope","Tenant roles cannot carry a branch scope.")
            assignment_scope_id = organization_id
        actor_level=await connection.fetchval(
          """select min(r.hierarchy_level) from public.user_role_assignments ura
          join public.roles r on r.id=ura.role_id where ura.user_id=$1 and ura.membership_id=$2
          and ura.revoked_at is null and ura.starts_at<=now()
          and (ura.expires_at is null or ura.expires_at>now())""",
          principal.user_id,tenant.membership_id)
        if actor_level is None or role["hierarchy_level"]<=actor_level:
            raise APIError(403,"privilege_escalation_denied","You cannot assign an equal or higher privilege role.")
        assignment=await connection.fetchrow(
          """insert into public.user_role_assignments(user_id,membership_id,role_id,scope_type,scope_id,assigned_by)
          values ($1,$2,$3,$4,$5,$6)
          returning id,user_id,membership_id,role_id,scope_type,scope_id,created_at""",
          user_id,member["id"],role["id"],role["scope_type"],assignment_scope_id,principal.user_id)
        await write_audit(connection,request,principal,"organization.member.role_assigned",
          "user_role_assignment",str(assignment["id"]),tenant,
          metadata={"member_user_id":str(user_id),"role_key":role["key"]})
    return dict(assignment)
