from uuid import UUID
import asyncpg
from fastapi import APIRouter, Depends, Request, Response
from app.db import get_connection
from app.errors import APIError
from app.schemas.identity import AuthContextResponse, MembershipResponse, ProfileResponse, SessionRegistration, SignOutRequest
from app.security.dependencies import Principal, get_current_principal
from app.services.audit import write_audit

router=APIRouter(prefix="/auth",tags=["identity"])

@router.get("/me",response_model=AuthContextResponse)
async def get_auth_context(
    principal: Principal=Depends(get_current_principal),
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
    principal: Principal=Depends(get_current_principal),
    connection: asyncpg.Connection=Depends(get_connection),
)->None:
    auth_session=await connection.fetchrow(
        "select not_after as expires_at from auth.sessions where id=$1 and user_id=$2",
        principal.session_id,principal.user_id)
    if auth_session is None:
        raise APIError(401,"session_revoked","The Supabase Auth session is no longer active.")
    async with connection.transaction():
        existing=await connection.fetchrow("select revoked_at from public.session_devices where auth_session_id=$1",principal.session_id)
        if existing and existing["revoked_at"] is not None:
            raise APIError(401,"session_revoked","This device session has been revoked.")
        await connection.execute(
          """insert into public.session_devices(auth_session_id,user_id,device_id,device_name,platform,user_agent,expires_at,last_seen_at)
          values ($1,$2,$3,$4,$5,$6,$7,now())
          on conflict(auth_session_id) do update set device_id=excluded.device_id,device_name=excluded.device_name,
          platform=excluded.platform,user_agent=excluded.user_agent,expires_at=excluded.expires_at,last_seen_at=now()""",
          principal.session_id,principal.user_id,payload.device_id,payload.device_name,payload.platform,
          payload.user_agent or request.headers.get("user-agent","")[:512],auth_session["expires_at"])
        await write_audit(connection,request,principal,"auth.session.registered","auth_session",
          str(principal.session_id),metadata={"platform":payload.platform})

@router.get("/sessions")
async def list_sessions(
    principal: Principal=Depends(get_current_principal),
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
    principal: Principal=Depends(get_current_principal),
    connection: asyncpg.Connection=Depends(get_connection),
)->None:
    exists=await connection.fetchval("select exists(select 1 from auth.sessions where id=$1 and user_id=$2)",session_id,principal.user_id)
    if not exists:
        raise APIError(404,"session_not_found","The requested session was not found.")
    async with connection.transaction():
        await connection.execute(
          """insert into public.session_devices(auth_session_id,user_id,platform,revoked_at)
          values ($1,$2,'unknown',now()) on conflict(auth_session_id) do update set revoked_at=now()""",
          session_id,principal.user_id)
        await write_audit(connection,request,principal,"auth.session.revoked","auth_session",
          str(session_id),metadata={"current_session":session_id==principal.session_id})


@router.post("/sign-out", status_code=204)
async def sign_out(
    payload: SignOutRequest,
    request: Request,
    response: Response,
    principal: Principal = Depends(get_current_principal),
    connection: asyncpg.Connection = Depends(get_connection),
) -> None:
    authorization = request.headers.get("authorization", "")
    access_token = authorization[7:] if authorization.lower().startswith("bearer ") else ""
    if not access_token:
        raise APIError(401, "unauthenticated", "A valid access token is required.")

    # Supabase Auth revokes the refresh-token session(s); FastAPI additionally
    # enforces the session registry/epoch because already-issued JWTs are stateless.
    await request.app.state.supabase_auth.sign_out(access_token, payload.scope)

    async with connection.transaction():
        if payload.scope == "global":
            await connection.execute(
                "update public.profiles set session_revoked_at=now(),updated_at=now() where id=$1",
                principal.user_id,
            )
            await connection.execute(
                "update public.session_devices set revoked_at=coalesce(revoked_at,now()) where user_id=$1",
                principal.user_id,
            )
        elif payload.scope == "others":
            await connection.execute(
                """update public.session_devices set revoked_at=coalesce(revoked_at,now())
                where user_id=$1 and auth_session_id<>$2""",
                principal.user_id, principal.session_id,
            )
        else:
            await connection.execute(
                """insert into public.session_devices(auth_session_id,user_id,platform,revoked_at)
                values ($1,$2,'unknown',now())
                on conflict(auth_session_id) do update set revoked_at=coalesce(public.session_devices.revoked_at,now())""",
                principal.session_id, principal.user_id,
            )
        await write_audit(
            connection, request, principal, "auth.session.remote_signed_out",
            "auth_session", str(principal.session_id),
            metadata={"scope": payload.scope, "supabase_auth_confirmed": True},
        )
    response.status_code = 204


@router.get("/identities")
async def list_linked_identities(
    principal: Principal = Depends(get_current_principal),
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
    principal: Principal = Depends(get_current_principal),
    connection: asyncpg.Connection = Depends(get_connection),
) -> None:
    identity = await connection.fetchrow(
        """select auth_identity_id,provider from public.user_identities
        where auth_identity_id=$1 and user_id=$2""",
        identity_id, principal.user_id,
    )
    if identity is None:
        raise APIError(404, "identity_not_found", "Linked identity was not found on the active account.")
    count = await connection.fetchval(
        "select count(*) from auth.identities where user_id=$1", principal.user_id
    )
    if count is None or count <= 1:
        raise APIError(409, "last_identity_cannot_be_removed",
                       "At least one verified sign-in identity must remain.")
    authorization = request.headers.get("authorization", "")
    access_token = authorization[7:] if authorization.lower().startswith("bearer ") else ""
    if not access_token:
        raise APIError(401, "unauthenticated", "A valid access token is required.")
    # Supabase Auth validates the caller JWT and ownership of this identity.
    # The auth.identities mirror trigger writes the immutable audit event.
    await request.app.state.supabase_auth.unlink_identity(access_token, str(identity_id))
