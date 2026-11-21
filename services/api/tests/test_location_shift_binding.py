from __future__ import annotations

import unittest
from types import SimpleNamespace
from uuid import uuid4

from pydantic import ValidationError

from app.errors import APIError
from app.schemas.location import LocationSessionStart
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


class LocationShiftBindingTests(unittest.IsolatedAsyncioTestCase):
    def test_location_session_schema_requires_shift_id(self):
        with self.assertRaises(ValidationError):
            LocationSessionStart(
                device_id="device-fixture-0001",
                consent_policy_version="sales-location-v1",
            )

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


if __name__ == "__main__":
    unittest.main()
