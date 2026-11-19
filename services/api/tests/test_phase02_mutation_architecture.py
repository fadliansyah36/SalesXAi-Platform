from pathlib import Path
import re
import unittest


class Phase02MutationArchitectureTests(unittest.TestCase):
    def test_phase02_routers_do_not_execute_domain_dml(self) -> None:
        root = Path(__file__).resolve().parents[3]
        router_paths = (root / "services/api/app/routers").glob("*.py")
        dml = re.compile(r"\b(?:insert\s+into|update\s+public\.|delete\s+from)\b", re.IGNORECASE)
        sql_calls = re.compile(r"\bconnection\.(?:fetch|fetchrow|fetchval|execute|executemany)\s*\(")
        for path in router_paths:
            source = path.read_text()
            self.assertFalse(dml.search(source), f"Domain DML remains in {path.name}")
            self.assertFalse(sql_calls.search(source), f"Direct SQL access remains in {path.name}")

    def test_phase02_mutation_services_have_dedicated_repositories(self) -> None:
        root = Path(__file__).resolve().parents[3]
        pairs = (
            ("account_administration", "AccountAdministrationService", "AccountAdministrationRepository"),
            ("session_mutations", "SessionMutationService", "SessionMutationRepository"),
            ("identity_mutations", "IdentityMutationService", "IdentityMutationRepository"),
            ("organization_mutations", "OrganizationMutationService", "OrganizationMutationRepository"),
            ("invitation_mutations", "InvitationMutationService", "InvitationMutationRepository"),
        )
        for module, service, repository in pairs:
            service_source = (root / f"services/api/app/services/{module}.py").read_text()
            repository_source = (root / f"services/api/app/repositories/{module}.py").read_text()
            self.assertIn(service, service_source)
            self.assertIn(repository, service_source)
            self.assertIn(f"class {repository}", repository_source)


if __name__ == "__main__":
    unittest.main()
