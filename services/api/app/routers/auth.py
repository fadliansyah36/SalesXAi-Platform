from uuid import UUID
from datetime import datetime, timezone, timedelta
from hashlib import sha256
from hmac import compare_digest
from typing import Literal
from pydantic import BaseModel, Field
import asyncpg
from fastapi import APIRouter, Depends, Request
from app.db import get_connection
from app.schemas.identity import AuthContextResponse, SessionRegistration, SignOutRequest
from app.security.dependencies import Principal, require_api_action
from app.config import get_settings
from app.services.session_mutations import session_mutation_service
from app.services.identity_mutations import identity_mutation_service
from app.services.identity_reads import identity_read_service

router=APIRouter(prefix="/auth",tags=["identity"])

@router.get("/me",response_model=AuthContextResponse)
async def get_auth_context(
    principal: Principal=Depends(require_api_action("identity.context.read")),
    connection: asyncpg.Connection=Depends(get_connection),
)->AuthContextResponse:
    return await identity_read_service.get_auth_context(connection,principal)


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
    return await identity_read_service.list_sessions(connection,principal)


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
    principal: Principal=Depends(require_api_action("identity.link.list")),
    connection: asyncpg.Connection=Depends(get_connection),
)->list[dict]:
    return await identity_read_service.list_linked_identities(connection,principal)


@router.delete("/identities/{identity_id}", status_code=204)
async def unlink_own_identity(
    identity_id: UUID,
    request: Request,
    principal: Principal = Depends(require_api_action("identity.link.unlink")),
    connection: asyncpg.Connection = Depends(get_connection),
) -> None:
    await identity_mutation_service.unlink_own_identity(connection,request,principal,identity_id)


class PortalHandoffCreate(BaseModel):
    token:str=Field(min_length=32,max_length=128)
    encrypted_session:str=Field(min_length=80,max_length=8192)
    target_portal:Literal["sales","customer","company","distributor","principal","supervisor"]
    organization_id:UUID
    target_origin:str=Field(min_length=8,max_length=300)
    expires_at:datetime


def _bff_secret_valid(request:Request)->bool:
    expected=get_settings().salesx_bff_shared_secret
    supplied=request.headers.get("x-salesx-bff-secret","")
    return bool(expected and supplied and compare_digest(expected.get_secret_value(),supplied))


def bff_api_action(action_id:str):
    def decorate(endpoint):
        endpoint.__api_action_id__=action_id
        return endpoint
    return decorate


@router.post("/portal-handoffs",status_code=201)
async def create_portal_handoff(
    payload:PortalHandoffCreate,
    request:Request,
    principal:Principal=Depends(require_api_action("identity.portal.handoff.create")),
    connection:asyncpg.Connection=Depends(get_connection),
)->dict:
    settings=get_settings()
    if not _bff_secret_valid(request):
        from app.errors import APIError
        raise APIError(403,"bff_handoff_forbidden","A trusted Web authentication BFF is required.")
    expected_portal_origin={
        "sales":settings.salesx_website_origin,
        "customer":settings.salesx_customer_origin,
        "company":settings.salesx_company_origin,
        "distributor":settings.salesx_company_origin,
        "principal":settings.salesx_company_origin,
        "supervisor":settings.salesx_company_origin,
    }[payload.target_portal]
    if not expected_portal_origin or payload.target_origin!=expected_portal_origin:
        from app.errors import APIError
        raise APIError(400,"portal_origin_mismatch","The destination origin does not match the registered portal.")
    allowed_origins=set(settings.allowed_origins)
    if settings.app_public_url:
        allowed_origins.add(settings.app_public_url)
    if payload.target_origin not in allowed_origins:
        from app.errors import APIError
        raise APIError(400,"portal_origin_not_allowed","The target portal origin is not registered.")
    now=datetime.now(timezone.utc)
    expiry=payload.expires_at
    if expiry.tzinfo is None or expiry<=now or expiry>now.replace(microsecond=0)+timedelta(seconds=120):
        from app.errors import APIError
        raise APIError(422,"invalid_handoff_expiry","Portal handoff tickets must expire within 120 seconds.")
    permission_key=f"portal:{payload.target_portal}:access"
    authorized=await connection.fetchval(
        """with recursive role_tree(role_id,parent_role_id) as (
             select r.id,r.parent_role_id from public.organization_memberships m
             join public.user_role_assignments ura on ura.membership_id=m.id and ura.user_id=m.user_id
             join public.roles r on r.id=ura.role_id
             where m.organization_id=$1 and m.user_id=$2 and m.status='active'
               and ura.revoked_at is null and ura.starts_at<=now()
               and (ura.expires_at is null or ura.expires_at>now())
             union
             select parent.id,parent.parent_role_id from role_tree child
             join public.roles parent on parent.id=child.parent_role_id
           )
           select exists(select 1 from role_tree rt join public.role_permissions rp on rp.role_id=rt.role_id
             where rp.permission_key=$3)""",
        payload.organization_id,principal.user_id,permission_key,
    )
    if not authorized:
        from app.errors import APIError
        raise APIError(403,"portal_access_denied","The authenticated user is not assigned to the requested portal in this organization.")
    token_hash=sha256(payload.token.encode()).hexdigest()
    await connection.execute("delete from public.auth_portal_handoffs where expires_at<now()-interval '1 day' or consumed_at<now()-interval '1 day'")
    await connection.execute(
        """insert into public.auth_portal_handoffs
           (token_hash,actor_user_id,organization_id,target_portal,target_origin,encrypted_session,expires_at)
           values($1,$2,$3,$4,$5,$6,$7)""",
        token_hash,principal.user_id,payload.organization_id,payload.target_portal,payload.target_origin,payload.encrypted_session,expiry,
    )
    return {"accepted":True,"expires_at":expiry}


@router.post("/portal-handoffs/exchange")
@bff_api_action("identity.portal.handoff.exchange")
async def exchange_portal_handoff(
    payload:dict,
    request:Request,
    connection:asyncpg.Connection=Depends(get_connection),
)->dict:
    from app.errors import APIError
    if not _bff_secret_valid(request):
        raise APIError(403,"bff_handoff_forbidden","A trusted Web authentication BFF is required.")
    token=payload.get("token")
    target_origin=payload.get("target_origin")
    if not isinstance(token,str) or len(token)<32 or not isinstance(target_origin,str):
        raise APIError(400,"invalid_handoff_ticket","A valid one-time handoff ticket is required.")
    settings=get_settings()
    allowed_origins=set(settings.allowed_origins)
    if settings.app_public_url:
        allowed_origins.add(settings.app_public_url)
    expected_origins={
        "sales":settings.salesx_website_origin,
        "customer":settings.salesx_customer_origin,
        "company":settings.salesx_company_origin,
        "distributor":settings.salesx_company_origin,
        "principal":settings.salesx_company_origin,
        "supervisor":settings.salesx_company_origin,
    }
    if target_origin not in allowed_origins or target_origin not in {value for value in expected_origins.values() if value}:
        raise APIError(400,"portal_origin_not_allowed","The target portal origin is not registered.")
    token_hash=sha256(token.encode()).hexdigest()
    row=await connection.fetchrow(
        """update public.auth_portal_handoffs h set consumed_at=now()
           where h.token_hash=$1 and h.target_origin=$2 and h.expires_at>now() and h.consumed_at is null
             and exists (
               with recursive role_tree(role_id,parent_role_id) as (
                 select r.id,r.parent_role_id from public.organization_memberships m
                 join public.user_role_assignments ura on ura.membership_id=m.id and ura.user_id=m.user_id
                 join public.roles r on r.id=ura.role_id
                 where m.organization_id=h.organization_id and m.user_id=h.actor_user_id and m.status='active'
                   and ura.revoked_at is null and ura.starts_at<=now()
                   and (ura.expires_at is null or ura.expires_at>now())
                 union select parent.id,parent.parent_role_id from role_tree child
                   join public.roles parent on parent.id=child.parent_role_id
               )
               select 1 from role_tree rt join public.role_permissions rp on rp.role_id=rt.role_id
               where rp.permission_key='portal:'||h.target_portal||':access'
             )
           returning h.encrypted_session""",
        token_hash,target_origin,
    )
    if not row:
        raise APIError(404,"handoff_ticket_invalid_or_expired","The portal handoff ticket is invalid, expired or already used.")
    return {"encrypted_session":row["encrypted_session"]}
