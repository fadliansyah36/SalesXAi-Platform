from datetime import datetime
from uuid import UUID

import asyncpg
from fastapi import APIRouter, Depends, Query, Request

from app.db import get_connection
from app.errors import APIError
from app.schemas.identity import AccountStatusUpdate, PlatformAuditLogResponse
from app.security.dependencies import Principal, require_api_action
from app.services.audit import write_audit
from app.services.authorization import authorization_service

router = APIRouter(prefix="/admin", tags=["platform-security"])


@router.get("/users")
async def list_platform_users(
    q: str | None = Query(default=None,max_length=160),
    limit: int = Query(default=100,ge=1,le=500),
    offset: int = Query(default=0,ge=0,le=100000),
    principal: Principal = Depends(require_api_action("platform.users.list")),
    connection: asyncpg.Connection = Depends(get_connection),
) -> list[dict]:
    rows = await connection.fetch(
        """
        select p.id,
          coalesce(nullif(p.display_name,''),nullif(u.email,''),'Unknown') name,
          coalesce(u.email,'') email,
          coalesce((
            select string_agg(distinct o.slug,', ' order by o.slug)
            from public.organization_memberships m
            join public.organizations o on o.id=m.organization_id
            where m.user_id=p.id and m.status='active' and o.status='active'
          ),'') tenant_id,
          coalesce((
            select string_agg(distinct o.name,', ' order by o.name)
            from public.organization_memberships m
            join public.organizations o on o.id=m.organization_id
            where m.user_id=p.id and m.status='active' and o.status='active'
          ),'') tenant_name,
          coalesce((
            select string_agg(distinct r.key,', ' order by r.key)
            from public.user_role_assignments ura
            join public.roles r on r.id=ura.role_id
            left join public.organization_memberships m on m.id=ura.membership_id
            left join public.organizations o on o.id=m.organization_id
            left join public.branches b on b.id=ura.scope_id
            where ura.user_id=p.id and ura.revoked_at is null
              and ura.starts_at<=now() and (ura.expires_at is null or ura.expires_at>now())
              and (
                (ura.scope_type='platform' and ura.membership_id is null and ura.scope_id is null)
                or (ura.scope_type='tenant' and m.status='active' and o.status='active' and ura.scope_id=o.id)
                or (ura.scope_type='branch' and m.status='active' and o.status='active'
                    and b.organization_id=o.id and b.status='active' and ura.scope_id=b.id)
              )
          ),'unassigned') role,
          p.status,
          exists(select 1 from auth.mfa_factors mf where mf.user_id=p.id and mf.status='verified') mfa_enabled,
          (select max(sd.last_seen_at) from public.session_devices sd
            where sd.user_id=p.id and sd.revoked_at is null) last_active
        from public.profiles p
        join auth.users u on u.id=p.id
        where $1::text is null
          or lower(coalesce(u.email,'')) like '%'||lower($1)||'%'
          or lower(coalesce(p.display_name,'')) like '%'||lower($1)||'%'
        order by u.created_at desc
        limit $2 offset $3
        """,
        q.strip() if q and q.strip() else None,limit,offset,
    )
    return [
        {
            "id":str(row["id"]),
            "name":row["name"],
            "email":row["email"],
            "tenant_id":row["tenant_id"],
            "tenant_name":row["tenant_name"],
            "role":row["role"],
            "status":row["status"],
            "mfa_enabled":row["mfa_enabled"],
            "last_active":row["last_active"].isoformat() if row["last_active"] else None,
        }
        for row in rows
    ]


@router.get("/roles")
async def list_platform_roles(
    principal: Principal = Depends(require_api_action("platform.roles.list")),
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
    principal: Principal = Depends(require_api_action("platform.users.status")),
    connection: asyncpg.Connection = Depends(get_connection),
) -> dict:
    authorization_service.assert_action_context(request,"platform.users.status",principal.user_id)
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


@router.get("/audit", response_model=list[PlatformAuditLogResponse])
async def list_platform_audit_logs(
    request: Request,
    before: datetime | None = Query(default=None),
    limit: int = Query(default=50, ge=1, le=100),
    principal: Principal = Depends(require_api_action("platform.audit.read")),
    connection: asyncpg.Connection = Depends(get_connection),
) -> list[PlatformAuditLogResponse]:
    authorization_service.assert_action_context(request,"platform.audit.read",principal.user_id)
    rows = await connection.fetch(
        """
        select l.id,l.actor_user_id,l.organization_id,l.action,l.resource_type,
          l.resource_id,l.correlation_id,l.occurred_at,l.metadata,
          coalesce(nullif(p.display_name,''),nullif(p.email,''),
            case when l.actor_user_id is null then 'System' else l.actor_user_id::text end) actor_label
        from public.admin_audit_logs l
        left join public.profiles p on p.id=l.actor_user_id
        where l.organization_id is null
          and ($1::timestamptz is null or l.occurred_at<$1)
        order by l.occurred_at desc,l.id desc
        limit $2
        """,
        before, limit,
    )
    await write_audit(
        connection, request, principal, "platform.audit.read", "admin_audit_log",
        metadata={"limit": limit, "before": before.isoformat() if before else None},
    )
    return [PlatformAuditLogResponse(**dict(row)) for row in rows]
