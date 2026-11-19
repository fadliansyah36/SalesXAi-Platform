from __future__ import annotations

import json
from uuid import UUID

import asyncpg


class AuthorizationRepository:
    """Persistence boundary for Phase 02 identity, tenant and permission reads."""

    async def get_principal_session(
        self, connection: asyncpg.Connection, user_id: UUID, session_id: UUID
    ) -> asyncpg.Record | None:
        return await connection.fetchrow(
            """
            select p.email,p.display_name,p.status,p.session_revoked_at,
                   u.email_confirmed_at,u.phone_confirmed_at,
                   (s.id is not null) session_exists,s.not_after session_not_after,
                   sd.id session_device_id,sd.revoked_at device_revoked_at
            from public.profiles p join auth.users u on u.id=p.id
            left join auth.sessions s on s.id=$2 and s.user_id=p.id
            left join public.session_devices sd on sd.auth_session_id=s.id
            where p.id=$1
            """,
            user_id, session_id,
        )

    async def find_active_memberships(
        self, connection: asyncpg.Connection, user_id: UUID,
        organization_id: UUID | None = None,
    ) -> list[asyncpg.Record]:
        if organization_id is not None:
            return await connection.fetch(
                """
                select m.id membership_id,m.organization_id,m.branch_id,o.name organization_name
                from public.organization_memberships m
                join public.organizations o on o.id=m.organization_id
                where m.user_id=$1 and m.organization_id=$2
                  and m.status='active' and o.status='active'
                """,
                user_id, organization_id,
            )
        return await connection.fetch(
            """
            select m.id membership_id,m.organization_id,m.branch_id,o.name organization_name
            from public.organization_memberships m
            join public.organizations o on o.id=m.organization_id
            where m.user_id=$1 and m.status='active' and o.status='active'
            order by m.created_at
            """,
            user_id,
        )

    async def get_self_permission_attributes(
        self, connection: asyncpg.Connection, user_id: UUID, permission_key: str
    ) -> list[asyncpg.Record]:
        return await connection.fetch(
            """
            with recursive role_tree(role_id,parent_role_id,attributes) as (
              select r.id,r.parent_role_id,ura.attributes
              from public.user_role_assignments ura
              join public.roles r on r.id=ura.role_id
              left join public.organization_memberships m on m.id=ura.membership_id
              left join public.organizations o on o.id=m.organization_id
              left join public.branches b on b.id=ura.scope_id
              where ura.user_id=$1 and ura.revoked_at is null
                and ura.starts_at<=now() and (ura.expires_at is null or ura.expires_at>now())
                and (
                  (ura.scope_type='platform' and ura.membership_id is null and ura.scope_id is null)
                  or (ura.scope_type='tenant' and m.user_id=$1 and m.status='active'
                      and o.status='active' and ura.scope_id=o.id)
                  or (ura.scope_type='branch' and m.user_id=$1 and m.status='active'
                      and o.status='active' and b.organization_id=o.id and b.status='active'
                      and ura.scope_id=b.id)
                )
              union
              select parent.id,parent.parent_role_id,child.attributes
              from role_tree child join public.roles parent on parent.id=child.parent_role_id
            )
            select distinct tree.attributes
            from role_tree tree
            join public.role_permissions rp on rp.role_id=tree.role_id
            where rp.permission_key=$2
            """,
            user_id, permission_key,
        )

    async def branch_belongs_to_tenant(
        self, connection: asyncpg.Connection, branch_id: UUID, organization_id: UUID
    ) -> bool:
        return bool(await connection.fetchval(
            "select exists(select 1 from public.branches where id=$1 and organization_id=$2 and status='active')",
            branch_id, organization_id,
        ))

    async def get_tenant_permission_attributes(
        self, connection: asyncpg.Connection, user_id: UUID, membership_id: UUID,
        organization_id: UUID, branch_id: UUID | None, permission_key: str,
    ) -> list[asyncpg.Record]:
        return await connection.fetch(
            """
            with recursive role_tree(role_id,parent_role_id,attributes) as (
              select r.id,r.parent_role_id,ura.attributes
              from public.user_role_assignments ura join public.roles r on r.id=ura.role_id
              where ura.user_id=$1 and ura.revoked_at is null and ura.starts_at<=now()
                and (ura.expires_at is null or ura.expires_at>now())
                and ((ura.scope_type='platform' and ura.membership_id is null)
                  or (ura.scope_type='tenant' and ura.membership_id=$2 and ura.scope_id=$3)
                  or (ura.scope_type='branch' and ura.membership_id=$2 and ura.scope_id=$4))
              union
              select p.id,p.parent_role_id,c.attributes from role_tree c
              join public.roles p on p.id=c.parent_role_id
            )
            select rt.attributes from role_tree rt join public.role_permissions rp on rp.role_id=rt.role_id
            where rp.permission_key=$5
            """,
            user_id, membership_id, organization_id, branch_id, permission_key,
        )

    async def has_platform_permission(
        self, connection: asyncpg.Connection, user_id: UUID, permission_key: str
    ) -> bool:
        return bool(await connection.fetchval(
            """
            with recursive role_tree(role_id,parent_role_id) as (
              select r.id,r.parent_role_id
              from public.user_role_assignments ura
              join public.roles r on r.id=ura.role_id
              where ura.user_id=$1 and ura.scope_type='platform'
                and ura.membership_id is null and ura.scope_id is null
                and ura.revoked_at is null and ura.starts_at<=now()
                and (ura.expires_at is null or ura.expires_at>now())
              union
              select parent.id,parent.parent_role_id
              from role_tree child join public.roles parent on parent.id=child.parent_role_id
            )
            select exists(
              select 1 from role_tree tree
              join public.role_permissions rp on rp.role_id=tree.role_id
              where rp.permission_key=$2
            )
            """,
            user_id, permission_key,
        ))

    async def insert_authorization_denial(
        self, connection: asyncpg.Connection, *, actor_user_id: UUID,
        organization_id: UUID | None, resource_path: str, correlation_id: str | None,
        user_agent: str, method: str, permission_key: str,
    ) -> None:
        await connection.execute(
            """
            insert into public.admin_audit_logs
              (actor_user_id,organization_id,action,resource_type,resource_id,correlation_id,user_agent,metadata)
              values ($1,$2,'authorization.denied','api_action',$3,$4,$5,$6::jsonb)
            """,
            actor_user_id, organization_id, resource_path[:512], correlation_id,
            user_agent[:512],
            json.dumps({"method": method, "permission": permission_key, "outcome": "denied"}),
        )


authorization_repository = AuthorizationRepository()
