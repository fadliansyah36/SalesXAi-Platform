from uuid import UUID
from datetime import datetime, timezone
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
    allowed_origins=set(settings.allowed_origins)
    if settings.app_public_url:
        allowed_origins.add(settings.app_public_url)
    if payload.target_origin not in allowed_origins:
        from app.errors import APIError
        raise APIError(400,"portal_origin_not_allowed","The target portal origin is not registered.")
    now=datetime.now(timezone.utc)
    expiry=payload.expires_at
    if expiry.tzinfo is None or expiry<=now or expiry>now.replace(microsecond=0)+__import__("datetime").timedelta(seconds=120):
        from app.errors import APIError
        raise APIError(422,"invalid_handoff_expiry","Portal handoff tickets must expire within 120 seconds.")
    token_hash=sha256(payload.token.encode()).hexdigest()
    await connection.execute(
        """insert into public.auth_portal_handoffs
           (token_hash,target_portal,target_origin,encrypted_session,expires_at)
           values($1,$2,$3,$4,$5)""",
        token_hash,payload.target_portal,payload.target_origin,payload.encrypted_session,expiry,
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
    if target_origin not in allowed_origins:
        raise APIError(400,"portal_origin_not_allowed","The target portal origin is not registered.")
    token_hash=sha256(token.encode()).hexdigest()
    row=await connection.fetchrow(
        """update public.auth_portal_handoffs set consumed_at=now()
           where token_hash=$1 and target_origin=$2 and expires_at>now() and consumed_at is null
           returning encrypted_session""",
        token_hash,target_origin,
    )
    if not row:
        raise APIError(404,"handoff_ticket_invalid_or_expired","The portal handoff ticket is invalid, expired or already used.")
    return {"encrypted_session":row["encrypted_session"]}
