from uuid import UUID
import asyncpg
from fastapi import APIRouter, Depends, Request
from app.db import get_connection
from app.errors import APIError
from app.schemas.identity import AuthContextResponse, MembershipResponse, ProfileResponse, SessionRegistration
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
          where ura.user_id=$1 and ura.membership_id=$2 and ura.revoked_at is null
          and ura.starts_at<=now() and (ura.expires_at is null or ura.expires_at>now()) order by r.key""",
          principal.user_id,row["id"])
        permissions=await connection.fetch(
          """with recursive role_tree(role_id,parent_role_id) as (
            select r.id,r.parent_role_id from public.user_role_assignments ura join public.roles r on r.id=ura.role_id
            where ura.user_id=$1 and ura.membership_id=$2 and ura.revoked_at is null
              and ura.starts_at<=now() and (ura.expires_at is null or ura.expires_at>now())
            union all select p.id,p.parent_role_id from role_tree rt join public.roles p on p.id=rt.parent_role_id)
          select distinct rp.permission_key from role_tree rt join public.role_permissions rp on rp.role_id=rt.role_id
          order by rp.permission_key""",principal.user_id,row["id"])
        memberships.append(MembershipResponse(
          id=row["id"],organization_id=row["organization_id"],organization_name=row["organization_name"],
          status=row["status"],branch_id=row["branch_id"],roles=[x["key"] for x in roles],
          permissions=[x["permission_key"] for x in permissions]))
    return AuthContextResponse(user=ProfileResponse(**dict(profile)),session_id=principal.session_id,memberships=memberships)

@router.post("/sessions/current",status_code=204)
async def register_current_session(
    request: Request,payload: SessionRegistration,
    principal: Principal=Depends(get_current_principal),
    connection: asyncpg.Connection=Depends(get_connection),
)->None:
    async with connection.transaction():
        existing=await connection.fetchrow("select revoked_at from public.session_devices where auth_session_id=$1",principal.session_id)
        if existing and existing["revoked_at"] is not None:
            raise APIError(401,"session_revoked","This device session has been revoked.")
        await connection.execute(
          """insert into public.session_devices(auth_session_id,user_id,device_id,device_name,platform,user_agent,last_seen_at)
          values ($1,$2,$3,$4,$5,$6,now())
          on conflict(auth_session_id) do update set device_id=excluded.device_id,device_name=excluded.device_name,
          platform=excluded.platform,user_agent=excluded.user_agent,last_seen_at=now()""",
          principal.session_id,principal.user_id,payload.device_id,payload.device_name,payload.platform,
          payload.user_agent or request.headers.get("user-agent","")[:512])
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
