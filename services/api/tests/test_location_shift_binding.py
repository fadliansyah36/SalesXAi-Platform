from __future__ import annotations

import unittest
from pathlib import Path
from datetime import UTC, datetime, timedelta
from types import SimpleNamespace
from uuid import uuid4

from pydantic import ValidationError

from app.errors import APIError
from app.schemas.location import LocationPointWrite, LocationSessionStart
from app.services.location import LocationService


class _Transaction:
    async def __aenter__(self):
        return self

    async def __aexit__(self, *_args):
        return False


class _ShiftDatabase:
    def __init__(self, shift_is_active: bool):
        self.fetchval_results = [True, shift_is_active]
        self.profile_id = uuid4()
        self.session_id = uuid4()

    def transaction(self):
        return _Transaction()

    async def fetchval(self, *_args):
        return self.fetchval_results.pop(0)

    async def fetchrow(self, query, *args):
        if "from public.sales_profiles" in query:
            return {"id": self.profile_id}
        if "from public.location_tracking_sessions" in query:
            return None
        if "insert into public.location_tracking_sessions" in query:
            return {"id": self.session_id, "device_id": args[4], "consent_policy_version": args[5]}
        raise AssertionError(f"Unexpected query: {query}")

    async def execute(self, *_args):
        return "INSERT 0 1"


class _IngestDatabase:
    def __init__(self, organization_id, actor_id, shift_id, clock_out_at):
        self.organization_id = organization_id
        self.actor_id = actor_id
        self.shift_id = shift_id
        self.clock_out_at = clock_out_at
        self.session_id = uuid4()
        self.profile_id = uuid4()
        self.completed_at = None
        self.point_inserted = False

    def transaction(self):
        return _Transaction()

    async def fetchrow(self, query, *args):
        if "select * from public.location_tracking_sessions" in query:
            return {
                "id": self.session_id,
                "organization_id": self.organization_id,
                "user_id": self.actor_id,
                "device_id": "device-fixture-0001",
                "shift_id": self.shift_id,
                "sales_profile_id": self.profile_id,
                "status": "active",
                "ended_at": None,
            }
        if "from public.smartteam_shifts" in query:
            return {
                "id": self.shift_id,
                "clock_in_at": datetime.now(UTC) - timedelta(hours=2),
                "clock_out_at": self.clock_out_at,
            }
        if "update public.location_tracking_sessions" in query:
            self.completed_at = args[4]
            return {"id": self.session_id, "status": "completed", "ended_at": self.completed_at}
        raise AssertionError(f"Unexpected query: {query}")

    async def fetchval(self, *_args):
        self.point_inserted = True
        return uuid4()

    async def execute(self, *_args):
        return "INSERT 0 1"


class LocationShiftBindingTests(unittest.IsolatedAsyncioTestCase):
    def test_location_session_schema_requires_shift_id(self):
        with self.assertRaises(ValidationError):
            LocationSessionStart(
                device_id="device-fixture-0001",
                consent_policy_version="sales-location-v1",
            )

    def test_database_requires_shift_binding_for_location_sessions(self):
        root = Path(__file__).resolve().parents[2]
        migration = (
            root.parent / "supabase" / "migrations"
            / "20261121110006_p07_location_tracking_sessions_require_shift.sql"
        ).read_text(encoding="utf-8")
        self.assertIn("alter column shift_id set not null", migration)

    async def test_session_start_rejects_shift_not_active_for_sales_profile(self):
        organization_id = uuid4()
        payload = LocationSessionStart(
            device_id="device-fixture-0001",
            consent_policy_version="sales-location-v1",
            shift_id=uuid4(),
        )
        with self.assertRaises(APIError) as caught:
            await LocationService().start(
                _ShiftDatabase(shift_is_active=False),
                organization_id,
                SimpleNamespace(organization_id=organization_id),
                uuid4(),
                uuid4(),
                payload,
            )
        self.assertEqual(caught.exception.status_code, 409)
        self.assertEqual(caught.exception.code, "location_shift_not_active")

    async def test_session_start_checks_device_and_active_shift_before_insert(self):
        organization_id = uuid4()
        user_id = uuid4()
        payload = LocationSessionStart(
            device_id="device-fixture-0001",
            consent_policy_version="sales-location-v1",
            shift_id=uuid4(),
        )
        database = _ShiftDatabase(shift_is_active=True)
        result = await LocationService().start(
            database,
            organization_id,
            SimpleNamespace(organization_id=organization_id),
            user_id,
            uuid4(),
            payload,
        )
        self.assertEqual(result["id"], database.session_id)

    async def test_ingest_rejects_points_recorded_after_shift_end(self):
        organization_id = uuid4()
        actor_id = uuid4()
        shift_id = uuid4()
        clock_out_at = datetime.now(UTC) - timedelta(minutes=1)
        database = _IngestDatabase(organization_id, actor_id, shift_id, clock_out_at)
        payload = SimpleNamespace(points=[
            LocationPointWrite(
                client_point_id="location-fixture-point-0001",
                recorded_at=datetime.now(UTC),
                latitude=-6.2,
                longitude=106.8,
                accuracy_m=12,
            )
        ])
        with self.assertRaises(APIError) as caught:
            await LocationService().ingest(
                database,
                organization_id,
                SimpleNamespace(organization_id=organization_id),
                actor_id,
                database.session_id,
                "device-fixture-0001",
                payload,
            )
        self.assertEqual(caught.exception.status_code, 409)
        self.assertEqual(caught.exception.code, "location_shift_ended")
        self.assertFalse(database.point_inserted)

    async def test_ingest_accepts_offline_points_recorded_before_shift_end(self):
        organization_id = uuid4()
        actor_id = uuid4()
        shift_id = uuid4()
        clock_out_at = datetime.now(UTC) - timedelta(minutes=1)
        database = _IngestDatabase(organization_id, actor_id, shift_id, clock_out_at)
        payload = SimpleNamespace(points=[
            LocationPointWrite(
                client_point_id="location-fixture-point-0002",
                recorded_at=clock_out_at - timedelta(minutes=1),
                latitude=-6.2,
                longitude=106.8,
                accuracy_m=12,
            )
        ])
        result = await LocationService().ingest(
            database,
            organization_id,
            SimpleNamespace(organization_id=organization_id),
            actor_id,
            database.session_id,
            "device-fixture-0001",
            payload,
        )
        self.assertEqual(result["accepted"], 1)
        self.assertEqual(database.completed_at, clock_out_at)


if __name__ == "__main__":
    unittest.main()
