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

class Phase04ActionCoverageTests(unittest.TestCase):
    def setUp(self) -> None:
        with COVERAGE.open(encoding="utf-8", newline="") as stream:
            self.rows = list(csv.DictReader(stream, delimiter="\t"))
        self.contracts = {item.id: item for item in API_ACTION_MATRIX}

    def test_all_phase04_contracts_have_complete_portal_placements(self) -> None:
        expected = {item.id for item in API_ACTION_MATRIX if item.id.startswith("smartteam.") or item.id == "platform.smartteam.overview.read"}
        self.assertEqual(len(expected), 23)
        self.assertEqual({row["action_id"] for row in self.rows}, expected)
        self.assertEqual(Counter(row["portal"] for row in self.rows), Counter({"Sales": 22, "Company": 22, "Supervisor": 22, "Super Admin": 1}))
        self.assertEqual(len(self.rows), 67)

    def test_every_placement_matches_fastapi_contract_and_typed_client(self) -> None:
        client = API_CLIENT.read_text(encoding="utf-8")
        smart_ui = SMARTTEAM_UI.read_text(encoding="utf-8")
        admin_ui = SUPER_ADMIN_UI.read_text(encoding="utf-8")
        for row in self.rows:
            contract = self.contracts[row["action_id"]]
            self.assertEqual(row["http_method"], contract.method, row["action_id"])
            self.assertEqual(row["endpoint"], contract.path, row["action_id"])
            self.assertEqual(row["permission"], contract.permission_key or "", row["action_id"])
            self.assertIn(row["typed_api_method"] + "(", client, row["action_id"])
            source = admin_ui if row["portal"] == "Super Admin" else smart_ui
            self.assertIn(row["typed_api_method"] + "(", source, row["action_id"])

    def test_every_registered_fastapi_route_is_action_mapped(self) -> None:
        validate_api_action_matrix(app.routes)

    def test_active_phase04_ui_does_not_mutate_supabase_directly(self) -> None:
        for path in (SMARTTEAM_UI, SUPER_ADMIN_UI):
            source = path.read_text(encoding="utf-8")
            self.assertIsNone(re.search(r"supabase\s*\.\s*(?:from|rpc|storage)\b", source, re.I), str(path))

if __name__ == "__main__":
    unittest.main()
