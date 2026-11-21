"""Real row-lock/idempotency integration tests.

Run only against a disposable local Supabase database:
SALESX_TEST_DATABASE_URL=postgresql://...@127.0.0.1:54322/postgres
The test intentionally skips remote/staging/production URLs and does not create login sessions.
Fixture rows are unique and remain in the disposable database for reset after the test run.
"""
from __future__ import annotations

import asyncio
import os
import unittest
from types import SimpleNamespace
from uuid import uuid4

import asyncpg

from app.errors import APIError
from app.repositories.smart_reward import SmartRewardRepository
from app.services.smart_reward import smart_reward_service


class _BarrierConnection:
    def __init__(self, connection: asyncpg.Connection, barrier: asyncio.Barrier):
        self._connection = connection
        self._barrier = barrier
        self._waited = False

    def __getattr__(self, name: str):
        return getattr(self._connection, name)

    async def fetchrow(self, query: str, *args):
        if not self._waited and "from public.reward_redemptions" in query.lower():
            self._waited = True
            await self._barrier.wait()
        return await self._connection.fetchrow(query, *args)


class SmartRewardConcurrentRedemptionTests(unittest.IsolatedAsyncioTestCase):
    async def asyncSetUp(self):
        database_url = os.getenv("SALESX_TEST_DATABASE_URL", "").strip()
        if not database_url:
            self.skipTest("SALESX_TEST_DATABASE_URL is not configured.")
        if not any(host in database_url for host in ("@127.0.0.1", "@localhost", "@[::1]")):
            self.skipTest("SmartReward concurrency tests run only on a disposable local Supabase database.")
        if database_url == os.getenv("DATABASE_URL", "").strip():
            self.skipTest("The isolated test database must not equal DATABASE_URL.")

        self.database_url = database_url
        self.organization_id = uuid4()
        self.user_id = uuid4()
        self.account_id = uuid4()
        self.catalog_item_id = uuid4()
        self.earn_source_id = uuid4()
        self.db = await asyncpg.connect(database_url)

        await self.db.execute(
            """insert into auth.users
               (id,aud,role,email,encrypted_password,email_confirmed_at,raw_app_meta_data,
                raw_user_meta_data,created_at,updated_at)
               values($1,'authenticated','authenticated',$2,'fixture-only-no-login',now(),
                '{"provider":"email","providers":["email"]}'::jsonb,
                '{"display_name":"Phase 06 concurrency fixture"}'::jsonb,now(),now())""",
            self.user_id,
            f"phase06-{self.user_id}@salesx.invalid",
        )
        await self.db.execute(
            """insert into public.organizations(id,slug,name,status,created_by)
               values($1,$2,'Phase 06 isolated concurrency fixture','active',$3)""",
            self.organization_id,
            f"phase06-concurrency-{self.organization_id}",
            self.user_id,
        )
        await self.db.execute(
            """insert into public.organization_memberships(organization_id,user_id,status,joined_at)
               values($1,$2,'active',now())""",
            self.organization_id,
            self.user_id,
        )
        await self.db.execute(
            """insert into public.reward_accounts(id,organization_id,participant_user_id,points_balance,status)
               values($1,$2,$3,100,'active')""",
            self.account_id,
            self.organization_id,
            self.user_id,
        )
        await self.db.execute(
            """insert into public.reward_catalog_items
               (id,organization_id,code,name,category,points_cost,quantity_total,status,created_by,updated_by)
               values($1,$2,$3,'Concurrent fixture reward','fixture',80,10,'active',$4,$4)""",
            self.catalog_item_id,
            self.organization_id,
            f"FIX-{self.catalog_item_id}",
            self.user_id,
        )
        await self.db.execute(
            """insert into public.reward_points_ledger
               (organization_id,account_id,participant_user_id,entry_type,points_delta,
                balance_before,balance_after,source_type,source_id,actor_user_id,idempotency_key,reason)
               values($1,$2,$3,'earn',100,0,100,'fixture',$4,$3,$5,'Initial isolated fixture balance')""",
            self.organization_id,
            self.account_id,
            self.user_id,
            self.earn_source_id,
            f"earn-{self.earn_source_id}",
        )

    async def asyncTearDown(self):
        if getattr(self, "db", None):
            if getattr(self, "organization_id", None):
                await self.db.execute("ALTER TABLE public.reward_points_ledger DISABLE TRIGGER reward_ledger_immutable")
                for table in (
                    "reward_event_outbox",
                    "reward_audit_events",
                    "reward_point_lot_allocations",
                    "reward_approval_history",
                    "reward_approval_requests",
                    "reward_redemptions",
                    "reward_point_lots",
                    "reward_points_ledger",
                    "reward_accounts",
                    "reward_catalog_items",
                ):
                    await self.db.execute(
                        f"delete from public.{table} where organization_id=$1",
                        self.organization_id,
                    )
                await self.db.execute(
                    "delete from public.organization_memberships where organization_id=$1",
                    self.organization_id,
                )
                await self.db.execute("delete from public.organizations where id=$1", self.organization_id)
            if getattr(self, "user_id", None):
                await self.db.execute("delete from auth.users where id=$1", self.user_id)
            await self.db.close()

    async def _redeem_pair(self, first_key: str, second_key: str):
        first = await asyncpg.connect(self.database_url)
        second = await asyncpg.connect(self.database_url)
        barrier = asyncio.Barrier(2)
        payloads = [
            SimpleNamespace(catalog_item_id=self.catalog_item_id, quantity=1, idempotency_key=first_key),
            SimpleNamespace(catalog_item_id=self.catalog_item_id, quantity=1, idempotency_key=second_key),
        ]
        try:
            return await asyncio.wait_for(
                asyncio.gather(
                    smart_reward_service.redeem(
                        SmartRewardRepository(_BarrierConnection(first, barrier)),
                        self.organization_id, self.user_id, payloads[0]
                    ),
                    smart_reward_service.redeem(
                        SmartRewardRepository(_BarrierConnection(second, barrier)),
                        self.organization_id, self.user_id, payloads[1]
                    ),
                    return_exceptions=True,
                ),
                timeout=25,
            )
        finally:
            await first.close()
            await second.close()

    async def _assert_one_debit_and_reconciled_balance(self):
        account_balance = await self.db.fetchval(
            "select points_balance from public.reward_accounts where id=$1", self.account_id
        )
        ledger_balance = await self.db.fetchval(
            "select coalesce(sum(points_delta),0) from public.reward_points_ledger where organization_id=$1 and account_id=$2",
            self.organization_id,
            self.account_id,
        )
        redemption_count = await self.db.fetchval(
            "select count(*) from public.reward_redemptions where organization_id=$1 and account_id=$2",
            self.organization_id,
            self.account_id,
        )
        debit_count = await self.db.fetchval(
            "select count(*) from public.reward_points_ledger where organization_id=$1 and account_id=$2 and entry_type='redemption'",
            self.organization_id,
            self.account_id,
        )
        self.assertEqual(account_balance, 20)
        self.assertEqual(ledger_balance, 20)
        self.assertEqual(redemption_count, 1)
        self.assertEqual(debit_count, 1)

    async def test_same_idempotency_key_has_one_atomic_redemption(self):
        results = await self._redeem_pair("same-key-phase06-0001", "same-key-phase06-0001")
        self.assertTrue(all(isinstance(result, dict) for result in results), results)
        self.assertEqual(results[0]["id"], results[1]["id"])
        await self._assert_one_debit_and_reconciled_balance()

    async def test_distinct_concurrent_keys_cannot_overdraw_balance(self):
        results = await self._redeem_pair("different-key-phase06-01", "different-key-phase06-02")
        successful = [result for result in results if isinstance(result, dict)]
        failures = [result for result in results if isinstance(result, APIError)]
        self.assertEqual(len(successful), 1, results)
        self.assertEqual(len(failures), 1, results)
        self.assertEqual(failures[0].code, "insufficient_reward_points")
        await self._assert_one_debit_and_reconciled_balance()


if __name__ == "__main__":
    unittest.main()
