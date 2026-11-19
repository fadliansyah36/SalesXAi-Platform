from uuid import UUID
import asyncpg
from fastapi import APIRouter, Depends, Request
from app.db import get_connection
from app.schemas.identity import AuthContextResponse, MembershipResponse, ProfileResponse, SessionRegistration, SignOutRequest
from app.security.dependencies import Principal, require_api_action
from app.services.session_mutations import session_mutation_service
from app.services.identity_mutations import identity_mutation_service

router=APIRouter(prefix="/auth",tags=["identity"])

@router.get("/me",response_model=AuthContextResponse)
async def get_auth_context(
    principal: Principal=Depends(require_api_action("identity.context.read")),
    connection: asyncpg.Connection=Depends(get_connection),
)->AuthContextResponse:
    profile=await connection.fetchrow("select id,email,display_name,status from public.profiles where id=$1",principal.user_id)
    rows=await connection.fetch(
      """select m.id,m.organization_id,o.name organization_name,m.status,m.branch_id
      from public.organization_memberships m join public.organizations o on o.id=m.organization_id
      where m.user_id=$1 and m.status in ('active','invited','suspended') order by o.name""",principal.user_id)
    memberships=[]
    for row in rows:
        roles=await connection.fetch(
          """select distinct r.key from public.user_role_assignments ura join public.roles r on r.id=ura.role_id
          where ura.user_id=$1 and ura.membership_id=$2 and $3='active' and ura.revoked_at is null
          and ura.starts_at<=now() and (ura.expires_at is null or ura.expires_at>now())
          and (r.scope_type<>'branch' or exists(select 1 from public.branches b where b.id=ura.scope_id and b.organization_id=$4 and b.status='active')) order by r.key""",
          principal.user_id,row["id"],row["status"],row["organization_id"])
        permissions=await connection.fetch(
          """with recursive role_tree(role_id,parent_role_id) as (
            select r.id,r.parent_role_id from public.user_role_assignments ura join public.roles r on r.id=ura.role_id
            where ura.user_id=$1 and ura.membership_id=$2 and $3='active' and ura.revoked_at is null
              and ura.starts_at<=now() and (ura.expires_at is null or ura.expires_at>now())
              and (r.scope_type<>'branch' or exists(select 1 from public.branches b where b.id=ura.scope_id and b.organization_id=$4 and b.status='active'))
            union select p.id,p.parent_role_id from role_tree rt join public.roles p on p.id=rt.parent_role_id)
          select distinct rp.permission_key from role_tree rt join public.role_permissions rp on rp.role_id=rt.role_id
          order by rp.permission_key""",principal.user_id,row["id"],row["status"],row["organization_id"])
        memberships.append(MembershipResponse(
          id=row["id"],organization_id=row["organization_id"],organization_name=row["organization_name"],
          status=row["status"],branch_id=row["branch_id"],roles=[x["key"] for x in roles],
          permissions=[x["permission_key"] for x in permissions]))
    platform_permissions=await connection.fetch(
      """with recursive role_tree(role_id,parent_role_id) as (
        select r.id,r.parent_role_id from public.user_role_assignments ura
        join public.roles r on r.id=ura.role_id
        where ura.user_id=$1 and ura.scope_type='platform' and ura.membership_id is null
          and ura.scope_id is null and ura.revoked_at is null and ura.starts_at<=now()
          and (ura.expires_at is null or ura.expires_at>now())
        union select p.id,p.parent_role_id from role_tree rt join public.roles p on p.id=rt.parent_role_id)
      select distinct rp.permission_key from role_tree rt
      join public.role_permissions rp on rp.role_id=rt.role_id order by rp.permission_key""",
      principal.user_id)
    return AuthContextResponse(user=ProfileResponse(**dict(profile)),session_id=principal.session_id,
      memberships=memberships,platform_permissions=[x["permission_key"] for x in platform_permissions])

@router.post("/sessions/current",status_code=204)
async def register_current_session(
    request: Request,payload: SessionRegistration,
    principal: Principal=Depends(require_api_action("identity.session.register")),
    connection: asyncpg.Connection=Depends(get_connection),
)->None:
    await session_mutation_service.register(connection,request,principal,payload)


@router.get("/sessions")
async def list_sessions(
    principal: Principal=Depends(require_api_action("identity.session.list")),
    connection: asyncpg.Connection=Depends(get_connection),
)->list[dict]:
    rows=await connection.fetch(
      """select auth_session_id,device_id,device_name,platform,last_seen_at,expires_at,revoked_at,created_at,
      (auth_session_id=$2) current from public.session_devices where user_id=$1 order by last_seen_at desc""",
      principal.user_id,principal.session_id)
    return [dict(row) for row in rows]

@router.delete("/sessions/{session_id}",status_code=204)
async def revoke_session(
    session_id: UUID,request: Request,
    principal: Principal=Depends(require_api_action("identity.session.revoke")),
    connection: asyncpg.Connection=Depends(get_connection),
)->None:
    await session_mutation_service.revoke(connection,request,principal,session_id)



@router.post("/sign-out", status_code=204)
async def sign_out(
    payload: SignOutRequest,
    request: Request,
    principal: Principal = Depends(require_api_action("identity.session.signout")),
    connection: asyncpg.Connection = Depends(get_connection),
) -> None:
    await session_mutation_service.sign_out(connection,request,principal,payload)



@router.post("/identities/link-authorize",status_code=204)
async def authorize_identity_link(
    principal: Principal = Depends(require_api_action("identity.link.authorize")),
) -> None:
    return None


@router.get("/identities")
async def list_linked_identities(
    principal: Principal = Depends(require_api_action("identity.link.list")),
    connection: asyncpg.Connection = Depends(get_connection),
) -> list[dict]:
    rows = await connection.fetch(
        """select auth_identity_id id,provider,email,is_primary,created_at
        from public.user_identities where user_id=$1 order by is_primary desc,created_at""",
        principal.user_id,
    )
    return [dict(row) for row in rows]


@router.delete("/identities/{identity_id}", status_code=204)
async def unlink_own_identity(
    identity_id: UUID,
    request: Request,
    principal: Principal = Depends(require_api_action("identity.link.unlink")),
    connection: asyncpg.Connection = Depends(get_connection),
) -> None:
    await identity_mutation_service.unlink_own_identity(connection,request,principal,identity_id)
