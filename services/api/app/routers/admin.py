from uuid import UUID

import asyncpg
from fastapi import APIRouter, Depends, Request

from app.db import get_connection
from app.errors import APIError
from app.schemas.identity import AccountStatusUpdate
from app.security.dependencies import Principal, require_platform_permission
from app.services.audit import write_audit

router = APIRouter(prefix="/admin", tags=["platform-security"])


@router.patch("/users/{user_id}/account-status")
async def update_account_status(
    user_id: UUID,
    payload: AccountStatusUpdate,
    request: Request,
    principal: Principal = Depends(require_platform_permission("account:status:manage")),
    connection: asyncpg.Connection = Depends(get_connection),
) -> dict:
    if user_id == principal.user_id:
        raise APIError(409, "self_lockout_prevented",
                       "You cannot suspend or deactivate your own platform account.")

    target = await connection.fetchrow(
        "select id,status from public.profiles where id=$1", user_id
    )
    if target is None:
        raise APIError(404, "identity_not_found", "Target profile was not found.")

    # Supabase Auth Admin is the credential authority. Do this before the database
    # transition so a missing/rejected admin credential cannot create split-brain state.
    ban_duration = "876000h" if payload.status in {"suspended", "deactivated"} else "none"
    await request.app.state.supabase_auth.set_user_ban(str(user_id), ban_duration)

    async with connection.transaction():
        if payload.status in {"suspended", "deactivated"}:
            row = await connection.fetchrow(
                """
                update public.profiles
                set status=$2,session_revoked_at=now(),updated_at=now()
                where id=$1
                returning id,status,session_revoked_at
                """, user_id, payload.status,
            )
            await connection.execute(
                """
                update public.session_devices
                set revoked_at=coalesce(revoked_at,now())
                where user_id=$1
                """, user_id,
            )
        else:
            # Keep the revocation epoch: previously issued JWTs must stay invalid.
            row = await connection.fetchrow(
                """
                update public.profiles set status='active',updated_at=now()
                where id=$1 returning id,status,session_revoked_at
                """, user_id,
            )
        await write_audit(
            connection, request, principal, "platform.account.status_changed",
            "profile", str(user_id),
            metadata={"previous_status": target["status"], "status": payload.status,
                      "auth_ban_applied": True},
        )
    return {
        "user_id": str(row["id"]),
        "status": row["status"],
        "session_revoked_at": row["session_revoked_at"],
        "supabase_auth_ban_applied": True,
        "api_session_epoch_enforced": payload.status != "active",
    }
