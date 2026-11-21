import unittest
from pathlib import Path
from types import SimpleNamespace
from uuid import uuid4

from app.errors import APIError
from app.services.location import LocationService


class LocationRouteReplayScopeTests(unittest.IsolatedAsyncioTestCase):
    async def test_geofence_read_rejects_cross_tenant_before_repository_access(self):
        service = LocationService()
        with self.assertRaises(APIError) as caught:
            await service.geofences(
                SimpleNamespace(),
                uuid4(),
                SimpleNamespace(organization_id=uuid4()),
                uuid4(),
            )
        self.assertEqual(caught.exception.status_code, 403)
        self.assertEqual(caught.exception.code, "tenant_scope_mismatch")

    async def test_route_replay_rejects_cross_tenant_before_repository_access(self):
        service = LocationService()
        with self.assertRaises(APIError) as caught:
            await service.route_replay(
                SimpleNamespace(),
                uuid4(),
                SimpleNamespace(organization_id=uuid4()),
                uuid4(),
                uuid4(),
                None,
                None,
                1,
                500,
            )
        self.assertEqual(caught.exception.status_code, 403)
        self.assertEqual(caught.exception.code, "tenant_scope_mismatch")


class LocationRepositoryAndMigrationContracts(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        root = Path(__file__).resolve().parents[1]
        cls.repository = (root / "app" / "repositories" / "location.py").read_text(encoding="utf-8")
        cls._service_text = (root / "app" / "services" / "location.py").read_text(encoding="utf-8")
        cls.migration = (
            root.parent.parent / "supabase" / "migrations"
            / "20261121100848_p07_location_geofence_ordering_route_replay.sql"
        ).read_text(encoding="utf-8")

    def test_geofence_reads_are_assignment_scoped_and_auditable(self):
        self.assertIn("ura.scope_type='branch'", self.repository)
        self.assertIn("ura.scope_type='territory'", self.repository)
        self.assertIn("ura.scope_type='team'", self.repository)
        self.assertIn("async def list_geofences", self.repository)

    def test_route_replay_queries_are_time_bounded_and_ordered(self):
        self.assertIn("recorded_at >= $3 and recorded_at <= $4", self.repository)
        self.assertIn("order by recorded_at asc,id asc", self.repository)
        self.assertIn("async def get_route_replay_context", self.repository)

    def test_location_profile_visibility_is_permission_scoped(self):
        self.assertIn("join public.role_permissions rp on rp.role_id=ura.role_id and rp.permission_key=$3", self._service_text)
        self.assertIn("async def visible_profiles(self, db, org, actor, permission_key", self._service_text)

    def test_geofence_visibility_requires_exact_read_permission(self):
        self.assertIn("rp.permission_key='location.geofences.read'", self.repository)

    def test_geofence_visibility_includes_assigned_supervisor_team(self):
        self.assertIn("supervised_team.supervisor_user_id=$2", self.repository)
        self.assertIn("supervised_profile.territory_id=coalesce(g.territory_id,o.territory_id)", self.repository)

    def test_out_of_order_points_cannot_rewind_geofence_state(self):
        self.assertIn("new.recorded_at<=prior.last_recorded_at", self.migration)
        self.assertIn("continue;", self.migration)
        self.assertIn("idx_location_points_route_replay", self.migration)


if __name__ == "__main__":
    unittest.main()
