from pathlib import Path
import re
import unittest


ROOT = Path(__file__).resolve().parents[3]
MIGRATIONS = ROOT / "supabase" / "migrations"
PERMISSION_REGISTRY = ROOT / "packages" / "permissions" / "src" / "index.ts"
ACTION_REGISTRY = ROOT / "packages" / "permissions" / "src" / "action-matrix.ts"
PYTHON_ACTION_REGISTRY = ROOT / "services" / "api" / "app" / "security" / "action_matrix.py"
PLATFORM_READ_MIGRATION = (
    MIGRATIONS / "20261119172508_p02_platform_read_permissions_and_audit_index.sql"
)
AUDIT_GRANT_MIGRATION = (
    MIGRATIONS / "20261119173915_p02_restrict_audit_mutation_grants.sql"
)
AUDIT_PRIVILEGE_MIGRATION = (
    MIGRATIONS / "20261119174508_p02_revoke_audit_reference_trigger_grants.sql"
)


class Phase02MigrationConsistencyTests(unittest.TestCase):
    def test_migration_versions_are_unique_and_timestamped(self) -> None:
        versions = []
        for migration in MIGRATIONS.glob("*.sql"):
            match = re.match(r"^(\d{14})_", migration.name)
            self.assertIsNotNone(match, migration.name)
            versions.append(match.group(1))
        self.assertEqual(len(versions), len(set(versions)))

    def test_phase02_migration_filenames_match_applied_remote_ledger(self) -> None:
        expected = {
            "20261119143440_p02_distributed_rate_limit_buckets.sql",
            "20261119145000_p02_identity_link_permission_and_self_scopes.sql",
            "20261119145850_p02_rate_limit_table_rls.sql",
            "20261119150146_p02_rate_limit_deny_client_policy.sql",
        }
        actual = {path.name for path in MIGRATIONS.glob("*.sql")}
        self.assertTrue(expected.issubset(actual))
        self.assertFalse(any(name.startswith(("20261119143000_", "20261119144800_", "20261119145500_", "20261119150000_")) for name in actual))

    def test_platform_read_permissions_match_both_action_registries(self) -> None:
        self.assertTrue(PLATFORM_READ_MIGRATION.is_file())
        migration = PLATFORM_READ_MIGRATION.read_text(encoding="utf-8")
        permissions = PERMISSION_REGISTRY.read_text(encoding="utf-8")
        typescript_actions = ACTION_REGISTRY.read_text(encoding="utf-8")
        python_actions = PYTHON_ACTION_REGISTRY.read_text(encoding="utf-8")

        for key in ("account:read", "role:read"):
            self.assertIn(f"'{key}'", migration)
            self.assertIn(f'"{key}"', permissions)
            self.assertIn(f'permission:"{key}"', typescript_actions)
            self.assertIn(f'"{key}"', python_actions)

        self.assertIn("where r.key = 'platform_admin'", migration)
        self.assertIn("on conflict (role_id, permission_key) do nothing", migration)

    def test_audit_grants_are_append_only_for_service_role(self) -> None:
        self.assertTrue(AUDIT_GRANT_MIGRATION.is_file())
        migration = AUDIT_GRANT_MIGRATION.read_text(encoding="utf-8").lower()
        self.assertIn("revoke update, delete, truncate", migration)
        self.assertIn("grant select, insert", migration)

    def test_service_role_has_only_audit_read_and_append_grants(self) -> None:
        self.assertTrue(AUDIT_PRIVILEGE_MIGRATION.is_file())
        migration = AUDIT_PRIVILEGE_MIGRATION.read_text(encoding="utf-8").lower()
        self.assertIn("revoke references, trigger", migration)

    def test_platform_audit_index_is_null_tenant_scoped(self) -> None:
        migration = PLATFORM_READ_MIGRATION.read_text(encoding="utf-8")
        self.assertIn("admin_audit_platform_time_idx", migration)
        self.assertIn("where organization_id is null", migration.lower())


if __name__ == "__main__":
    unittest.main()
