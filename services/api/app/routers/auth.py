from uuid import UUID
import asyncpg
from fastapi import APIRouter, Depends, Request
from app.db import get_connection
from app.schemas.identity import AuthContextResponse, SessionRegistration, SignOutRequest
from app.security.dependencies import Principal, require_api_action
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
