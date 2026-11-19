from pathlib import Path
from types import SimpleNamespace
import unittest
from uuid import uuid4

from app.main import app
from app.repositories.master_data import MasterDataRepository, RESOURCE_TABLES
from app.security.action_matrix import API_ACTION_MATRIX, validate_api_action_matrix
from app.services.master_data import MasterDataService
from app.errors import APIError


class Phase03MasterDataContractTests(unittest.TestCase):
    def test_every_master_data_route_has_a_server_action_contract(self) -> None:
        validate_api_action_matrix(app.routes)
        contracts = {item.id: item for item in API_ACTION_MATRIX}
        expected = {
            "master.branches.read", "master.branches.create", "master.branches.update",
            "master.teams.read", "master.teams.create", "master.teams.update",
            "master.territories.read", "master.territories.create", "master.territories.update",
            "master.outlets.read", "master.outlets.create", "master.outlets.update",
            "master.sales_profiles.read", "master.sales_profiles.create", "master.sales_profiles.update",
            "master.assignments.read", "master.assignments.manage",
            "platform.organizations.list", "platform.organizations.update",
            "platform.organizations.branches.read", "platform.organizations.branches.create",
            "platform.organizations.branches.update",
        }
        self.assertTrue(expected.issubset(contracts))
        actual = {item.id for item in API_ACTION_MATRIX if item.id.startswith("master.") or item.id.startswith("platform.organizations.")}
        self.assertEqual(expected, actual)

    def test_typescript_action_registry_mirrors_master_data_ids(self) -> None:
        root = Path(__file__).resolve().parents[3]
        typescript = (root / "packages/permissions/src/action-matrix.ts").read_text()
        for item in API_ACTION_MATRIX:
            if item.id.startswith("master."):
                self.assertIn(f'id:"{item.id}"', typescript)

    def test_repository_only_accepts_known_domain_tables(self) -> None:
        repository = MasterDataRepository()
        for resource in RESOURCE_TABLES:
            self.assertEqual(repository._table(resource), resource)
        with self.assertRaises(ValueError):
            repository._table("user_supplied_table")

    def test_cross_tenant_service_context_is_denied(self) -> None:
        service = MasterDataService()
        with self.assertRaises(APIError):
            service._tenant(uuid4(), SimpleNamespace(organization_id=uuid4()))

    def test_phase03_migration_is_present_and_rls_scoped(self) -> None:
        root = Path(__file__).resolve().parents[3]
        migration = root / "supabase/migrations/20261119175922_p03_master_data_core.sql"
        self.assertTrue(migration.exists())
        sql = migration.read_text().lower()
        for table in ("teams", "territories", "outlets", "sales_profiles", "outlet_assignment_history"):
            self.assertIn(f"'{table}'", sql)
            self.assertIn(f"public.{table}", sql)
        self.assertIn("alter table public.%i enable row level security", sql)
        self.assertIn("outlet_assignment_one_active_uq", sql)
        self.assertIn("foreign key (organization_id,branch_id)", sql)
        self.assertTrue((root / "supabase/migrations/20261119180611_p03_branch_contact_location_fields.sql").exists())
        self.assertTrue((root / "supabase/migrations/20261119181929_p03_branch_type.sql").exists())


if __name__ == "__main__":
    unittest.main()
