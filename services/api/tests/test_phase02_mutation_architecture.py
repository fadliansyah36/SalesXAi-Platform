from pathlib import Path
import re
import unittest


class Phase02MutationArchitectureTests(unittest.TestCase):
    def test_phase02_routers_do_not_execute_domain_dml(self) -> None:
        root = Path(__file__).resolve().parents[3]
        router_paths = (
            root / "services/api/app/routers/auth.py",
            root / "services/api/app/routers/admin.py",
            root / "services/api/app/routers/organizations.py",
        )
        dml = re.compile(r"\b(?:insert\s+into|update\s+public\.|delete\s+from)\b", re.IGNORECASE)
        for path in router_paths:
            self.assertFalse(dml.search(path.read_text()), f"Domain DML remains in {path.name}")

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
