import asyncpg
import hashlib
import secrets
from datetime import UTC, datetime
from fastapi import APIRouter, Depends, Request
from uuid import UUID
from app.db import get_connection
from app.errors import APIError
from app.schemas.identity import MemberCreate,MemberStatusUpdate,OrganizationCreate,OrganizationResponse,RoleAssignmentCreate,InvitationCreate,InvitationToken
from app.security.dependencies import Principal,TenantContext,get_current_principal,require_api_action
from app.security.policy import abac_conditions_match
from app.services.audit import write_audit

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
    tenant: TenantContext=Depends(require_api_action("organization.members.update")),
    connection: asyncpg.Connection=Depends(get_connection),
)->dict:
    if tenant.organization_id!=organization_id:
        raise APIError(403,"forbidden","Cross-tenant membership access is denied.")
    if user_id==principal.user_id and payload.status!="active":
        raise APIError(409,"self_lockout_prevented","You cannot suspend or remove your own membership.")
    async with connection.transaction():
        member=await connection.fetchrow(
          """select id,branch_id,status from public.organization_memberships
          where organization_id=$1 and user_id=$2 for update""",
          organization_id,user_id)
        if member is None:
            raise APIError(404,"membership_not_found","Organization membership was not found.")
        if user_id!=principal.user_id:
            target_is_platform_admin=await connection.fetchval(
              """select exists(select 1 from public.user_role_assignments
              where user_id=$1 and scope_type='platform' and revoked_at is null
                and starts_at<=now() and (expires_at is null or expires_at>now()))""",
              user_id)
            if target_is_platform_admin:
                raise APIError(403,"platform_identity_protected",
                               "Tenant administrators cannot change a platform-scoped identity.")
            actor_level=await _delegation_hierarchy_level(
              connection,principal.user_id,tenant.membership_id,organization_id,
              "organization:members:manage",member["branch_id"],
              getattr(request.state,"resource_attributes",{}))
            target_level=await _member_hierarchy_level(
              connection,user_id,member["id"],organization_id)
            if actor_level is None or (target_level is not None and actor_level>=target_level):
                raise APIError(403,"privilege_escalation_denied",
                               "You cannot change a membership with equal or higher privilege.")
        row=await connection.fetchrow(
          """update public.organization_memberships set status=$3,
          joined_at=case when $3='active' then coalesce(joined_at,now()) else joined_at end,updated_at=now()
          where organization_id=$1 and user_id=$2 returning id,user_id,organization_id,status""",
          organization_id,user_id,payload.status)
        if row is None:
            raise APIError(404,"membership_not_found","Organization membership was not found.")
        if payload.status=="removed":
            await connection.execute(
              """update public.user_role_assignments set revoked_at=coalesce(revoked_at,now())
              where membership_id=$1 and revoked_at is null""",
              row["id"])
            await write_audit(connection,request,principal,"organization.member.roles_revoked_on_removal",
              "organization_membership",str(row["id"]),tenant,
              metadata={"member_user_id":str(user_id)})
        await write_audit(connection,request,principal,"organization.member.status_changed",
          "organization_membership",str(row["id"]),tenant,
          metadata={"member_user_id":str(user_id),"status":payload.status})
    return dict(row)

@router.post("/{organization_id}/members/{user_id}/roles",status_code=201)
async def assign_member_role(
    organization_id: UUID,user_id: UUID,payload: RoleAssignmentCreate,request: Request,
    principal: Principal=Depends(get_current_principal),
    tenant: TenantContext=Depends(require_api_action("organization.roles.assign")),
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
        actor_level=await _delegation_hierarchy_level(
          connection,principal.user_id,tenant.membership_id,organization_id,"role:assign",
          assignment_scope_id if role["scope_type"]=="branch" else None,
          getattr(request.state,"resource_attributes",{}))
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


@router.get("/{organization_id}/assignable-roles")
async def list_assignable_roles(
    organization_id: UUID,
    request: Request,
    principal: Principal = Depends(get_current_principal),
    tenant: TenantContext = Depends(require_api_action("organization.roles.assignable")),
    connection: asyncpg.Connection = Depends(get_connection),
) -> list[dict]:
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


def _invitation_hash(token: str) -> str:
    return hashlib.sha256(token.encode("utf-8")).hexdigest()


def _invitation_url(request: Request, token: str) -> str:
    settings = request.app.state.settings
    base = str(settings.app_public_url).rstrip("/") if settings.app_public_url else ""
    if not base:
        raise APIError(503, "app_public_url_not_configured",
                       "APP_PUBLIC_URL is required to create an invitation URL.")
    return base + "/auth/accept-invitation?token=" + token


def _invitation_callback_url(request: Request, token: str) -> str:
    settings = request.app.state.settings
    base = str(settings.app_public_url).rstrip("/") if settings.app_public_url else ""
    if not base:
        raise APIError(503, "app_public_url_not_configured",
                       "APP_PUBLIC_URL is required to create an invitation callback URL.")
    return base + "/auth/callback?organization_invite=" + token


@router.get("/{organization_id}/invitations")
async def list_invitations(
    organization_id: UUID,
    request: Request,
    tenant: TenantContext = Depends(require_api_action("organization.invitations.read")),
    principal: Principal = Depends(get_current_principal),
    connection: asyncpg.Connection = Depends(get_connection),
) -> list[dict]:
    if tenant.organization_id != organization_id:
        raise APIError(403, "forbidden", "Cross-tenant invitation access is denied.")
    async with connection.transaction():
        expired = await connection.fetch(
            """update public.organization_invitations
            set status='expired',updated_at=now()
            where organization_id=$1 and status='pending' and expires_at<=now()
            returning id,email""", organization_id,
        )
        for item in expired:
            await write_audit(connection, request, principal, "organization.invitation.expired",
                               "organization_invitation", str(item["id"]), tenant,
                               metadata={"email": item["email"]})
    rows = await connection.fetch(
        """select id,email,title,branch_id,role_key,status,expires_at,accepted_at,
        rejected_at,revoked_at,resent_at,resend_count,created_at
        from public.organization_invitations where organization_id=$1
        order by created_at desc limit 200""", organization_id,
    )
    return [dict(row) for row in rows]


@router.post("/{organization_id}/invitations", status_code=201)
async def create_invitation(
    organization_id: UUID,
    payload: InvitationCreate,
    request: Request,
    principal: Principal = Depends(get_current_principal),
    tenant: TenantContext = Depends(require_api_action("organization.invitations.create")),
    connection: asyncpg.Connection = Depends(get_connection),
) -> dict:
    if tenant.organization_id != organization_id:
        raise APIError(403, "forbidden", "Cross-tenant invitation access is denied.")
    email = payload.email.strip().lower()
    role = await connection.fetchrow(
        "select id,key,scope_type,hierarchy_level from public.roles where key=$1",
        payload.role_key,
    )
    if role is None or role["scope_type"] not in {"tenant", "branch"} or role["key"] == "tenant_owner":
        raise APIError(400, "invalid_role", "Only delegable tenant- or branch-scoped roles can be invited.")
    actor_level = await _delegation_hierarchy_level(
        connection,principal.user_id,tenant.membership_id,organization_id,
        "organization:invitations:manage",
        payload.branch_id if role["scope_type"]=="branch" else None,
        getattr(request.state,"resource_attributes",{}))
    if actor_level is None or role["hierarchy_level"] <= actor_level:
        raise APIError(403, "privilege_escalation_denied",
                       "You cannot invite an equal- or higher-privilege role.")
    if role["scope_type"] == "branch":
        if payload.branch_id is None:
            raise APIError(400, "branch_scope_required", "A branch ID is required for this role.")
        valid_branch = await connection.fetchval(
            "select exists(select 1 from public.branches where id=$1 and organization_id=$2 and status='active')",
            payload.branch_id, organization_id,
        )
        if not valid_branch:
            raise APIError(403, "invalid_branch_scope", "The selected branch is outside this organization.")
    elif payload.branch_id is not None:
        raise APIError(400, "invalid_branch_scope", "Tenant-scoped roles cannot carry a branch ID.")

    existing_membership_status = await connection.fetchval(
        """select m.status from public.organization_memberships m
        join auth.users u on u.id=m.user_id
        where m.organization_id=$1 and lower(u.email)=lower($2)
        limit 1""",
        organization_id,email,
    )
    if existing_membership_status == "active":
        raise APIError(409,"member_already_active","This identity is already an active organization member.")
    if existing_membership_status == "suspended":
        raise APIError(409,"membership_suspended","A suspended membership must be reinstated by an organization administrator.")
    duplicate = await connection.fetchval(
        """select exists(select 1 from public.organization_invitations
        where organization_id=$1 and email=$2 and status='pending' and expires_at>now())""",
        organization_id, email,
    )
    if duplicate:
        raise APIError(409, "pending_invitation_exists", "A pending invitation already exists for this email.")

    token = secrets.token_urlsafe(40)
    invite_url = _invitation_url(request, token)
    identity = await connection.fetchrow(
        "select email_confirmed_at from auth.users where lower(email)=lower($1) limit 1", email
    )
    async with connection.transaction():
        invitation = await connection.fetchrow(
            """insert into public.organization_invitations
            (organization_id,email,title,branch_id,role_key,token_hash,status,invited_by,expires_at)
            values ($1,$2,$3,$4,$5,$6,'pending',$7,now()+interval '7 days')
            returning id,email,role_key,status,expires_at,created_at""",
            organization_id,email,payload.title,payload.branch_id,payload.role_key,
            _invitation_hash(token),principal.user_id,
        )
        await write_audit(connection,request,principal,"organization.invitation.created",
            "organization_invitation",str(invitation["id"]),tenant,
            metadata={"email":email,"role_key":payload.role_key})
    if identity and identity["email_confirmed_at"] is not None:
        try:
            await request.app.state.invitation_delivery.send(
                recipient=email,
                organization_name=tenant.organization_name,
                role_key=payload.role_key,
                invitation_url=invite_url,
            )
        except Exception:
            async with connection.transaction():
                await write_audit(connection,request,principal,"organization.invitation.delivery_failed",
                    "organization_invitation",str(invitation["id"]),tenant,
                    metadata={"delivery_provider":"smtp"})
            raise
        delivery_status = "smtp_email_sent"
    else:
        callback_url = _invitation_callback_url(request, token)
        provider = "supabase_auth_verification" if identity else "supabase_auth_invite"
        try:
            if identity:
                await request.app.state.supabase_auth.resend_signup_confirmation(email, callback_url)
                delivery_status = "supabase_auth_verification_sent"
            else:
                await request.app.state.supabase_auth.invite_user(email, callback_url)
                delivery_status = "supabase_auth_invite_sent"
        except Exception:
            async with connection.transaction():
                await connection.execute(
                    """update public.organization_invitations
                    set status='revoked',revoked_at=now(),updated_at=now() where id=$1 and status='pending'""",
                    invitation["id"],
                )
                await write_audit(connection,request,principal,"organization.invitation.delivery_failed",
                    "organization_invitation",str(invitation["id"]),tenant,
                    metadata={"delivery_provider":provider})
            raise
    return {**dict(invitation),"invitation_url":invite_url,"delivery_status":delivery_status}


@router.post("/invitations/accept")
async def accept_invitation(
    payload: InvitationToken,
    request: Request,
    principal: Principal = Depends(require_api_action("organization.invitations.accept")),
    connection: asyncpg.Connection = Depends(get_connection),
) -> dict:
    expired = False
    result: dict | None = None
    async with connection.transaction():
        invitation = await connection.fetchrow(
            """select i.*,u.email auth_email,u.email_confirmed_at
            from public.organization_invitations i
            join auth.users u on u.id=$2
            where i.token_hash=$1 and i.status='pending'
            for update of i""",
            _invitation_hash(payload.token),principal.user_id,
        )
        if invitation is None:
            raise APIError(404,"invitation_not_found","Invitation is invalid, used or revoked.")
        if invitation["expires_at"] <= datetime.now(UTC):
            await connection.execute(
                "update public.organization_invitations set status='expired',updated_at=now() where id=$1",
                invitation["id"],
            )
            expired = True
        elif (not invitation["auth_email"] or invitation["email_confirmed_at"] is None
              or invitation["auth_email"].lower() != invitation["email"]):
            raise APIError(403,"invitation_email_mismatch",
                           "Sign in with the verified email address that received this invitation.")
        else:
            role = await connection.fetchrow(
                "select id,key,scope_type from public.roles where key=$1",invitation["role_key"]
            )
            if role is None:
                raise APIError(409,"invitation_role_unavailable","The invitation role is no longer available.")
            if role["scope_type"] == "branch":
                if invitation["branch_id"] is None:
                    raise APIError(409,"invitation_scope_invalid","The invitation is missing its required branch scope.")
                branch_active = await connection.fetchval(
                    """select exists(select 1 from public.branches
                    where id=$1 and organization_id=$2 and status='active')""",
                    invitation["branch_id"],invitation["organization_id"],
                )
                if not branch_active:
                    raise APIError(409,"invitation_scope_invalid","The invited branch is no longer active in this organization.")
            elif invitation["branch_id"] is not None:
                raise APIError(409,"invitation_scope_invalid","A tenant-scoped invitation cannot include a branch.")
            member = await connection.fetchrow(
                """insert into public.organization_memberships
                (organization_id,user_id,branch_id,status,title,joined_at)
                values ($1,$2,$3,'active',$4,now())
                on conflict(organization_id,user_id) do update
                set status='active',branch_id=excluded.branch_id,title=excluded.title,
                    joined_at=coalesce(public.organization_memberships.joined_at,now()),updated_at=now()
                where public.organization_memberships.status in ('invited','removed')
                returning id,organization_id,user_id,status,branch_id""",
                invitation["organization_id"],principal.user_id,invitation["branch_id"],invitation["title"],
            )
            if member is None:
                raise APIError(409,"membership_not_eligible","A suspended membership must be reinstated by an organization administrator.")
            scope_id = invitation["branch_id"] if role["scope_type"] == "branch" else invitation["organization_id"]
            exists = await connection.fetchval(
                """select exists(select 1 from public.user_role_assignments
                where user_id=$1 and membership_id=$2 and role_id=$3 and scope_type=$4
                  and scope_id=$5 and revoked_at is null
                  and (expires_at is null or expires_at>now()))""",
                principal.user_id,member["id"],role["id"],role["scope_type"],scope_id,
            )
            if not exists:
                await connection.execute(
                    """insert into public.user_role_assignments
                    (user_id,membership_id,role_id,scope_type,scope_id,assigned_by)
                    values ($1,$2,$3,$4,$5,$6)""",
                    principal.user_id,member["id"],role["id"],role["scope_type"],scope_id,
                    invitation["invited_by"],
                )
            await connection.execute(
                """update public.organization_invitations
                set status='accepted',accepted_by=$2,accepted_at=now(),updated_at=now()
                where id=$1""",invitation["id"],principal.user_id,
            )
            result = {"membership_id":str(member["id"]),
                      "organization_id":str(member["organization_id"]),
                      "status":member["status"]}
            await write_audit(connection,request,principal,"organization.invitation.accepted",
                "organization_invitation",str(invitation["id"]),
                metadata={"organization_id":str(invitation["organization_id"])})
    if expired:
        raise APIError(410,"invitation_expired","Invitation has expired. Ask the organization administrator to resend it.")
    return result or {}


@router.post("/invitations/reject")
async def reject_invitation(
    payload: InvitationToken,
    request: Request,
    principal: Principal = Depends(require_api_action("organization.invitations.reject")),
    connection: asyncpg.Connection = Depends(get_connection),
) -> dict:
    async with connection.transaction():
        row = await connection.fetchrow(
            """update public.organization_invitations i
            set status='rejected',rejected_at=now(),updated_at=now()
            from auth.users u
            where i.token_hash=$1 and i.status='pending' and u.id=$2
              and u.email_confirmed_at is not null
              and lower(u.email)=i.email and i.expires_at>now()
            returning i.id,i.organization_id,i.email""",
            _invitation_hash(payload.token),principal.user_id,
        )
        if row is None:
            raise APIError(404,"invitation_not_found","Invitation is invalid, expired or not addressed to this account.")
        await write_audit(connection,request,principal,"organization.invitation.rejected",
            "organization_invitation",str(row["id"]),
            metadata={"organization_id":str(row["organization_id"])})
    return {"id":str(row["id"]),"status":"rejected"}


@router.post("/{organization_id}/invitations/{invitation_id}/revoke")
async def revoke_invitation(
    organization_id: UUID,invitation_id: UUID,request: Request,
    principal: Principal = Depends(get_current_principal),
    tenant: TenantContext = Depends(require_api_action("organization.invitations.revoke")),
    connection: asyncpg.Connection = Depends(get_connection),
) -> dict:
    if tenant.organization_id != organization_id:
        raise APIError(403,"forbidden","Cross-tenant invitation access is denied.")
    async with connection.transaction():
        row = await connection.fetchrow(
            """update public.organization_invitations
            set status='revoked',revoked_at=now(),updated_at=now()
            where id=$1 and organization_id=$2 and status='pending'
            returning id,email""",invitation_id,organization_id,
        )
        if row is None:
            raise APIError(404,"invitation_not_found","Pending invitation was not found.")
        await write_audit(connection,request,principal,"organization.invitation.revoked",
            "organization_invitation",str(row["id"]),tenant,metadata={"email":row["email"]})
    return {"id":str(row["id"]),"status":"revoked"}


@router.post("/{organization_id}/invitations/{invitation_id}/resend")
async def resend_invitation(
    organization_id: UUID,invitation_id: UUID,request: Request,
    principal: Principal = Depends(get_current_principal),
    tenant: TenantContext = Depends(require_api_action("organization.invitations.resend")),
    connection: asyncpg.Connection = Depends(get_connection),
) -> dict:
    if tenant.organization_id != organization_id:
        raise APIError(403,"forbidden","Cross-tenant invitation access is denied.")
    token = secrets.token_urlsafe(40)
    invite_url = _invitation_url(request,token)
    async with connection.transaction():
        row = await connection.fetchrow(
            """update public.organization_invitations
            set token_hash=$3,expires_at=now()+interval '7 days',resent_at=now(),
                resend_count=resend_count+1,updated_at=now()
            where id=$1 and organization_id=$2 and status='pending'
            returning id,email,role_key,branch_id,expires_at""",
            invitation_id,organization_id,_invitation_hash(token),
        )
        if row is None:
            raise APIError(404,"invitation_not_found","Pending invitation was not found.")
        role = await connection.fetchrow(
            "select scope_type,hierarchy_level from public.roles where key=$1",row["role_key"]
        )
        if role is None:
            raise APIError(409,"invitation_role_unavailable","The invitation role is no longer available.")
        if role["scope_type"] == "branch":
            branch_active = await connection.fetchval(
                """select exists(select 1 from public.branches
                where id=$1 and organization_id=$2 and status='active')""",
                row["branch_id"],organization_id,
            )
            if row["branch_id"] is None or not branch_active:
                raise APIError(409,"invitation_scope_invalid","The invitation branch is no longer active in this organization.")
        elif row["branch_id"] is not None:
            raise APIError(409,"invitation_scope_invalid","A tenant-scoped invitation cannot include a branch.")
        actor_level = await _delegation_hierarchy_level(
            connection,principal.user_id,tenant.membership_id,organization_id,
            "organization:invitations:manage",
            row["branch_id"] if role["scope_type"]=="branch" else None,
            getattr(request.state,"resource_attributes",{}))
        if role is None or actor_level is None or role["hierarchy_level"] <= actor_level:
            raise APIError(403,"privilege_escalation_denied","You cannot resend an equal- or higher-privilege invitation.")
        await write_audit(connection,request,principal,"organization.invitation.resent",
            "organization_invitation",str(row["id"]),tenant,metadata={"email":row["email"]})
    identity = await connection.fetchrow(
        "select email_confirmed_at from auth.users where lower(email)=lower($1) limit 1",row["email"]
    )
    try:
        if identity and identity["email_confirmed_at"] is not None:
            await request.app.state.invitation_delivery.send(
                recipient=row["email"],
                organization_name=tenant.organization_name,
                role_key=row["role_key"],
                invitation_url=invite_url,
            )
            delivery_status = "smtp_email_sent"
        else:
            callback_url = _invitation_callback_url(request, token)
            if identity:
                await request.app.state.supabase_auth.resend_signup_confirmation(row["email"], callback_url)
                delivery_status = "supabase_auth_verification_sent"
            else:
                await request.app.state.supabase_auth.invite_user(row["email"], callback_url)
                delivery_status = "supabase_auth_invite_sent"
    except Exception:
        async with connection.transaction():
            await write_audit(connection,request,principal,"organization.invitation.delivery_failed",
                "organization_invitation",str(row["id"]),tenant,
                metadata={"delivery_provider":"smtp_or_supabase_auth"})
        raise
    return {**dict(row),"invitation_url":invite_url,"delivery_status":delivery_status}
