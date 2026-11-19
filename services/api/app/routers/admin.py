from uuid import UUID

import asyncpg
from fastapi import APIRouter, Depends, Request

from app.db import get_connection
from app.errors import APIError
from app.schemas.identity import AccountStatusUpdate
from app.security.dependencies import Principal, require_platform_permission
from app.services.audit import write_audit

router = APIRouter(prefix="/admin", tags=["platform-security"])


@router.get("/roles")
async def list_platform_roles(
    principal: Principal = Depends(require_platform_permission("role:assign")),
    connection: asyncpg.Connection = Depends(get_connection),
) -> list[dict]:
    rows = await connection.fetch(
        """
        select r.id,r.key,r.name,r.scope_type,r.hierarchy_level,
          coalesce(array_agg(distinct rp.permission_key order by rp.permission_key)
            filter (where rp.permission_key is not null),array[]::text[]) permissions,
          count(distinct ura.user_id) filter (
            where ura.revoked_at is null and ura.starts_at<=now()
              and (ura.expires_at is null or ura.expires_at>now())
          ) assigned_users
        from public.roles r
        left join public.role_permissions rp on rp.role_id=r.id
        left join public.user_role_assignments ura on ura.role_id=r.id
        group by r.id
        order by case r.scope_type when 'platform' then 0 when 'tenant' then 1 else 2 end,
          r.hierarchy_level,r.key
        """
    )
    return [
        {
            "id":str(row["id"]),
            "key":row["key"],
            "name":row["name"],
            "scope_type":row["scope_type"],
            "hierarchy_level":row["hierarchy_level"],
            "permissions":list(row["permissions"] or []),
            "assigned_users":row["assigned_users"],
        }
        for row in rows
    ]


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

    ban_duration = "876000h" if payload.status in {"suspended", "deactivated"} else "none"

    # Commit the API deny state first. If Auth Admin is unavailable, suspended
    # identities still fail closed at FastAPI and existing JWTs remain revoked.
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
                      "auth_ban_applied": False, "auth_ban_pending": True},
        )

    try:
        await request.app.state.supabase_auth.set_user_ban(str(user_id), ban_duration)
    except Exception:
        async with connection.transaction():
            await write_audit(
                connection, request, principal, "platform.account.auth_ban_failed",
                "profile", str(user_id),
                metadata={"status": payload.status, "api_deny_enforced": True},
            )
        raise

    async with connection.transaction():
        await write_audit(
            connection, request, principal, "platform.account.auth_ban_applied",
            "profile", str(user_id),
            metadata={"status": payload.status, "ban_duration": ban_duration},
        )
    return {
        "user_id": str(row["id"]),
        "status": row["status"],
        "session_revoked_at": row["session_revoked_at"],
        "supabase_auth_ban_applied": True,
        "api_session_epoch_enforced": payload.status != "active",
    }
