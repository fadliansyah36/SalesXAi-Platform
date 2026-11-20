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
            "master.assignments.read", "master.assignments.manage", "master.assignments.unassign", "master.assignments.context.read",
            "master.data.import", "master.data.export", "master.data.events.read",
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
            self.assertIn(f'id:"{item.id}"', typescript)

    def test_repository_only_accepts_known_domain_tables(self) -> None:
        repository = MasterDataRepository()
        for resource in RESOURCE_TABLES:
            self.assertEqual(repository._table(resource), resource)
        with self.assertRaises(ValueError):
            repository._table("user_supplied_table")

    def test_phase03_closure_and_next_phase_are_recorded(self) -> None:
        root = Path(__file__).resolve().parents[3]
        tracker = (root / "docs/implementation/phase-status.md").read_text()
        self.assertIn("Phase 03 final closure", tracker)
        self.assertIn("Decision: Phase 03 — COMPLETED.", tracker)
        self.assertIn("Phase 04 — SmartTeam: Visit, Attendance & Sales Operations", tracker)
        plan = (root / "Docs/SalesX-Ai_Engineering_Execution_Master_Plan_v1.0.md").read_text()
        lines = plan.splitlines()
        start = next(i for i, line in enumerate(lines) if "## Phase 03 --- Core Master Data & Company Administration" in line)
        end = next(i for i, line in enumerate(lines) if i > start and "## Phase 04 --- SmartTeam" in line)
        self.assertFalse(any("-   [ ]" in line for line in lines[start:end]))

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
        for version in ("20261120022931_p03_master_data_completion.sql", "20261120023456_p03_master_data_event_stream.sql", "20261120023600_p03_assignment_status.sql", "20261120023800_p03_realtime_tenant_admin_scope.sql", "20261120024014_p03_realtime_tenant_scope.sql", "20261120024249_p03_master_data_fk_indexes.sql", "20261120025728_p03_master_data_event_triggers.sql"):
            self.assertTrue((root / "supabase/migrations" / version).exists())



class FakeAssignmentHistoryConnection:
    def __init__(self, current=None, affected=1):
        self.current = current
        self.affected = affected
        self.query = ""
        self.args = ()
        self.scope_query = ""
        self.scope_args = ()

    async def fetchrow(self, query, *args):
        self.query = query
        self.args = args
        return self.current or {"id": args[1], "unassigned_by": args[2]}

    async def fetchval(self, query, *args):
        self.scope_query = query
        self.scope_args = args
        return self.affected


class Phase03AssignmentHistoryTests(unittest.IsolatedAsyncioTestCase):
    async def test_manual_unassignment_is_tenant_scoped_and_actor_stamped(self) -> None:
        organization_id, assignment_id, actor_id = uuid4(), uuid4(), uuid4()
        connection = FakeAssignmentHistoryConnection()
        result = await MasterDataRepository().unassign_outlet(
            connection, organization_id, assignment_id, actor_id, "sales reassigned",
        )
        self.assertEqual(result["id"], assignment_id)
        self.assertEqual(connection.args, (organization_id, assignment_id, actor_id, "sales reassigned"))
        self.assertIn("where organization_id=$1 and id=$2 and unassigned_at is null", connection.query)
        self.assertIn("unassigned_by=$3", connection.query)
        self.assertIn("nullif($4,'')", connection.query)

    async def test_sales_scope_change_closes_active_outlet_assignment_history(self) -> None:
        organization_id, profile_id, actor_id = uuid4(), uuid4(), uuid4()
        connection = FakeAssignmentHistoryConnection(
            current={"team_id": uuid4(), "territory_id": uuid4(), "manager_user_id": uuid4()},
            affected=2,
        )
        closed = await MasterDataRepository().close_profile_assignments_if_scope_changed(
            connection, organization_id, profile_id,
            {"team_id": None, "territory_id": None, "manager_user_id": None}, actor_id,
        )
        self.assertEqual(closed, 2)
        self.assertEqual(connection.scope_args, (organization_id, profile_id, actor_id))
        self.assertIn("change_reason='sales_profile_scope_changed'", connection.scope_query)
        self.assertIn("unassigned_at is null", connection.scope_query)


if __name__ == "__main__":
    unittest.main()
