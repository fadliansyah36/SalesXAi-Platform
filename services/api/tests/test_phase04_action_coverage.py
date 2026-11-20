from __future__ import annotations

import csv
import re
import unittest
from collections import Counter
from pathlib import Path

from app.main import app
from app.security.action_matrix import API_ACTION_MATRIX, validate_api_action_matrix

ROOT = Path(__file__).resolve().parents[3]
COVERAGE = ROOT / "docs/implementation/phase-04-action-coverage.tsv"
SMARTTEAM_UI = ROOT / "components/smart-team/SmartTeamConsole.tsx"
SUPER_ADMIN_UI = ROOT / "components/super-admin/SuperAdminPortalApp.tsx"
API_CLIENT = ROOT / "packages/api-client/src/index.ts"
MOBILE_UI = ROOT / "apps/mobile-sales/src/smart-team/SmartTeamHome.tsx"
PORTAL_SCOPE = ROOT / "docs/implementation/phase-04-portal-scope.tsv"
PERMISSIONS = ROOT / "packages/permissions/src/index.ts"
PORTAL_COMPONENTS = [
    ROOT / "components/portal/SalesPortalApp.tsx",
    ROOT / "components/company/CompanyPortalApp.tsx",
    ROOT / "components/supervisor/SupervisorPortalApp.tsx",
]

class Phase04ActionCoverageTests(unittest.TestCase):
    def setUp(self) -> None:
        with COVERAGE.open(encoding="utf-8", newline="") as stream:
            self.rows = list(csv.DictReader(stream, delimiter="\t"))
        self.contracts = {item.id: item for item in API_ACTION_MATRIX}

    def test_all_phase04_contracts_have_complete_portal_placements(self) -> None:
        expected = {item.id for item in API_ACTION_MATRIX if item.id.startswith("smartteam.") or item.id == "platform.smartteam.overview.read"}
        self.assertEqual(len(expected), 23)
        self.assertEqual({row["action_id"] for row in self.rows}, expected)
        self.assertEqual(Counter(row["portal"] for row in self.rows), Counter({"Sales": 22, "Company": 22, "Supervisor": 22, "Super Admin": 1, "Mobile Sales": 12}))
        self.assertEqual(len(self.rows), 79)

    def test_every_placement_matches_fastapi_contract_and_typed_client(self) -> None:
        client = API_CLIENT.read_text(encoding="utf-8")
        smart_ui = SMARTTEAM_UI.read_text(encoding="utf-8")
        admin_ui = SUPER_ADMIN_UI.read_text(encoding="utf-8")
        mobile_ui = MOBILE_UI.read_text(encoding="utf-8")
        permission_registry = PERMISSIONS.read_text(encoding="utf-8")
        for row in self.rows:
            contract = self.contracts[row["action_id"]]
            self.assertEqual(row["http_method"], contract.method, row["action_id"])
            self.assertEqual(row["endpoint"], contract.path, row["action_id"])
            self.assertTrue(contract.permission_key, row["action_id"] + " has no permission")
            self.assertEqual(row["permission"], contract.permission_key, row["action_id"])
            self.assertIn(f'"{contract.permission_key}"', permission_registry, row["action_id"])
            self.assertIn(row["typed_api_method"] + "(", client, row["action_id"])
            source = admin_ui if row["portal"] == "Super Admin" else mobile_ui if row["portal"] == "Mobile Sales" else smart_ui
            self.assertIn(row["typed_api_method"] + "(", source, row["action_id"])

    def test_every_registered_fastapi_route_is_action_mapped(self) -> None:
        validate_api_action_matrix(app.routes)

    def test_phase04_scope_explicitly_covers_all_eight_web_portals(self) -> None:
        with PORTAL_SCOPE.open(encoding="utf-8", newline="") as stream:
            rows = list(csv.DictReader(stream, delimiter="\\t"))
        expected = {"Website", "Customer Portal", "Sales Portal", "Company Portal", "Distributor Portal", "Principal Portal", "Supervisor Portal", "Super Admin"}
        self.assertEqual({row["portal"] for row in rows if row["portal"] != "Mobile Sales"}, expected)

    def test_web_visit_history_and_evidence_controls_are_read_permission_gated(self) -> None:
        source = SMARTTEAM_UI.read_text(encoding="utf-8")
        self.assertIn("{canReadVisits&&<button disabled={busy} onClick={()=>void loadVisitHistory", source)
        self.assertIn("{canReadVisits&&<button disabled={busy} onClick={()=>void loadVisitEvidence", source)

    def test_mobile_mutations_are_gated_by_their_exact_action_ids(self) -> None:
        source = MOBILE_UI.read_text(encoding="utf-8")
        for action_id in ("smartteam.attendance.clock_in", "smartteam.attendance.clock_out", "smartteam.visits.execute", "smartteam.visits.checkout", "smartteam.activities.create", "smartteam.visits.evidence.upload"):
            self.assertIn(f'auth.canPerformApiAction("{action_id}")', source, action_id)

    def test_active_phase04_ui_does_not_mutate_supabase_directly(self) -> None:
        for path in (SMARTTEAM_UI, SUPER_ADMIN_UI, MOBILE_UI, *PORTAL_COMPONENTS):
            source = path.read_text(encoding="utf-8")
            self.assertIsNone(re.search(r"supabase\s*\.\s*(?:from|rpc|storage)\b", source, re.I), str(path))
        for path in PORTAL_COMPONENTS:
            source = path.read_text(encoding="utf-8")
            self.assertIn("const LEGACY_SMARTTEAM_UI_ENABLED = false", source, str(path))
            self.assertIn("<SmartTeamConsole", source, str(path))

if __name__ == "__main__":
    unittest.main()
