"""Authenticated tenant-boundary tests using isolated fixture identities.

Run only against a disposable local Supabase database:
SALESX_TEST_DATABASE_URL=postgresql://...@127.0.0.1:54322/postgres

The test creates synthetic Auth/profile/membership/role fixtures and calls the real
tenant permission resolver plus FastAPI route handlers. No real customer account,
password login, SMTP, OAuth or production data is used.
"""
from __future__ import annotations

import os
import unittest
from types import SimpleNamespace
from uuid import uuid4

import asyncpg
from starlette.requests import Request

from app.errors import APIError
from app.routers import smart_reward
from app.schemas.smart_reward import RewardProgramWrite, RewardRedemptionWrite
from app.security.dependencies import Principal, require_permission


class SmartRewardAuthenticatedTenantIsolationTests(unittest.IsolatedAsyncioTestCase):
    async def asyncSetUp(self):
        database_url = os.getenv("SALESX_TEST_DATABASE_URL", "").strip()
        if not database_url:
            self.skipTest("SALESX_TEST_DATABASE_URL is not configured.")
        if not any(host in database_url for host in ("@127.0.0.1", "@localhost", "@[::1]")):
            self.skipTest("Tenant isolation tests run only on a disposable local Supabase database.")
        if database_url == os.getenv("DATABASE_URL", "").strip():
            self.skipTest("The isolated test database must not equal DATABASE_URL.")

        self.db = await asyncpg.connect(database_url)
        self.user_id = uuid4()
        self.session_id = uuid4()
        self.organization_id = uuid4()
        self.other_organization_id = uuid4()
        self.email = f"phase06-tenant-{self.user_id}@salesx.invalid"

        await self.db.execute(
            """insert into auth.users
               (id,aud,role,email,encrypted_password,email_confirmed_at,raw_app_meta_data,
                raw_user_meta_data,created_at,updated_at)
               values($1,'authenticated','authenticated',$2,'fixture-only-no-login',now(),
                '{"provider":"email","providers":["email"]}'::jsonb,
                '{"display_name":"Phase 06 tenant fixture"}'::jsonb,now(),now())""",
            self.user_id,
            self.email,
        )
        await self.db.execute(
            "insert into public.profiles(id,email,display_name,status) values($1,$2,'Phase 06 tenant fixture','active')",
            self.user_id,
            self.email,
        )
        await self.db.execute(
            """insert into public.organizations(id,slug,name,status,created_by)
               values($1,$2,'Phase 06 isolated tenant A','active',$3),
                     ($4,$5,'Phase 06 isolated tenant B','active',$3)""",
            self.organization_id,
            f"phase06-tenant-a-{self.organization_id}",
            self.user_id,
            self.other_organization_id,
            f"phase06-tenant-b-{self.other_organization_id}",
        )
        membership_id = await self.db.fetchval(
            """insert into public.organization_memberships(organization_id,user_id,status,joined_at)
               values($1,$2,'active',now()) returning id""",
            self.organization_id,
            self.user_id,
        )
        role_id = await self.db.fetchval(
            "select id from public.roles where key='tenant_owner' limit 1"
        )
        if role_id is None:
            self.skipTest("Canonical tenant_owner role is not installed in the disposable database.")
        await self.db.execute(
            """insert into public.user_role_assignments
               (user_id,membership_id,role_id,scope_type,scope_id,attributes,assigned_by,starts_at)
               values($1,$2,$3,'tenant',$4,'{}'::jsonb,$1,now())""",
            self.user_id,
            membership_id,
            role_id,
            self.organization_id,
        )
        self.principal = Principal(
            user_id=self.user_id,
            email=self.email,
            display_name="Phase 06 tenant fixture",
            session_id=self.session_id,
            claims={"sub": str(self.user_id), "session_id": str(self.session_id), "fixture": True},
        )

    async def asyncTearDown(self):
        if getattr(self, "db", None):
            await self.db.execute("delete from public.organizations where id = any($1::uuid[])", [
                self.organization_id, self.other_organization_id
            ])
            await self.db.execute("delete from public.profiles where id=$1", self.user_id)
            await self.db.execute("delete from auth.users where id=$1", self.user_id)
            await self.db.close()

    def _request(self, organization_id):
        return Request({
            "type": "http",
            "method": "GET",
            "scheme": "http",
            "server": ("test", 80),
            "client": ("127.0.0.1", 12345),
            "path": f"/api/v1/organizations/{organization_id}/smart-reward",
            "query_string": b"",
            "headers": [(b"x-organization-id", str(organization_id).encode())],
            "state": {},
        })

    async def _tenant(self, permission_key, organization_id=None):
        request = self._request(organization_id or self.organization_id)
        dependency = require_permission(permission_key)
        return await dependency(request, self.principal, self.db)

    async def _assert_cross_tenant_denied(self, operation):
        with self.assertRaises(APIError) as caught:
            await operation
        self.assertEqual(caught.exception.status_code, 403)
        self.assertEqual(caught.exception.code, "tenant_scope_mismatch")

    async def test_read_endpoint_rejects_other_organization_path(self):
        tenant = await self._tenant("smartreward:program:read")
        await self._assert_cross_tenant_denied(
            smart_reward.programs(
                organization_id=self.other_organization_id,
                tenant=tenant,
                db=SimpleNamespace(),
            )
        )

    async def test_write_endpoint_rejects_other_organization_path(self):
        tenant = await self._tenant("smartreward:program:manage")
        payload = RewardProgramWrite(
            code="FIXTURE-REWARD",
            name="Isolated fixture reward",
            starts_at="2026-11-21T00:00:00Z",
            ends_at="2026-12-21T00:00:00Z",
        )
        await self._assert_cross_tenant_denied(
            smart_reward.create_program(
                organization_id=self.other_organization_id,
                payload=payload,
                principal=self.principal,
                tenant=tenant,
                db=SimpleNamespace(),
            )
        )

    async def test_resource_read_rejects_other_organization_path(self):
        tenant = await self._tenant("smartreward:segment:read")
        await self._assert_cross_tenant_denied(
            smart_reward.customer_segment_detail(
                organization_id=self.other_organization_id,
                segment_id=uuid4(),
                tenant=tenant,
                db=SimpleNamespace(),
            )
        )

    async def test_redemption_mutation_rejects_other_organization_path(self):
        tenant = await self._tenant("smartreward:redemption:create")
        payload = RewardRedemptionWrite(
            catalog_item_id=uuid4(),
            quantity=1,
            idempotency_key=f"phase06-cross-tenant-{uuid4()}",
        )
        await self._assert_cross_tenant_denied(
            smart_reward.redeem(
                organization_id=self.other_organization_id,
                payload=payload,
                principal=self.principal,
                tenant=tenant,
                db=SimpleNamespace(),
            )
        )

    async def test_membership_resolver_rejects_unjoined_organization(self):
        with self.assertRaises(APIError) as caught:
            await self._tenant("smartreward:program:read", self.other_organization_id)
        self.assertEqual(caught.exception.status_code, 403)
        self.assertEqual(caught.exception.code, "tenant_membership_required")


if __name__ == "__main__":
    unittest.main()
