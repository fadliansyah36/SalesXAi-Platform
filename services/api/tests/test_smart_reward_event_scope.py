import unittest
from pathlib import Path

from app.routers.smart_reward import _reward_event_audience


class SmartRewardEventAudienceTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        root = Path(__file__).resolve().parents[1]
        repo_root = root.parent.parent
        cls.broadcast_migration = (
            repo_root / "supabase" / "migrations"
            / "20261121101601_p06_reward_broadcast_disable_unsafe_tenant_topic.sql"
        ).read_text(encoding="utf-8")
        cls.owner_policy = (
            repo_root / "supabase" / "owner-pending"
            / "20261121101500_smartreward_realtime_role_scope_policy.sql"
        ).read_text(encoding="utf-8")

    def test_branch_scoped_company_admin_is_not_tenant_wide(self):
        audience = _reward_event_audience([
            {"role_key": "company_admin", "scope_type": "branch", "scope_id": "branch-a",
             "permission_key": "smartreward:ledger:read"}
        ])
        self.assertEqual(audience["tenant_resources"], [])
        self.assertEqual(audience["branch_scopes"], [])
        self.assertEqual(audience["catalog_resources"], [])

    def test_supervisor_receives_only_assigned_branch_and_exact_resource(self):
        audience = _reward_event_audience([
            {"role_key": "supervisor", "scope_type": "branch", "scope_id": "branch-a",
             "permission_key": "smartreward:ledger:read"},
            {"role_key": "supervisor", "scope_type": "branch", "scope_id": "branch-a",
             "permission_key": "smartreward:catalog:read"},
        ])
        self.assertEqual(audience["tenant_resources"], [])
        self.assertEqual(audience["branch_scopes"], [
            {"branch_id": "branch-a", "resources": ["reward_points_ledger"]}
        ])
        self.assertEqual(audience["catalog_resources"], [])

    def test_tenant_owner_requires_tenant_scope_and_exact_resource(self):
        audience = _reward_event_audience([
            {"role_key": "tenant_owner", "scope_type": "tenant", "scope_id": "org-a",
             "permission_key": "smartreward:ledger:read"}
        ])
        self.assertEqual(audience["tenant_resources"], ["reward_points_ledger"])
        self.assertEqual(audience["branch_scopes"], [])
        self.assertEqual(audience["catalog_resources"], [])

    def test_branch_permissions_do_not_widen_across_assigned_branches(self):
        audience = _reward_event_audience([
            {"role_key": "supervisor", "scope_type": "branch", "scope_id": "branch-a",
             "permission_key": "smartreward:ledger:read"},
            {"role_key": "supervisor", "scope_type": "branch", "scope_id": "branch-b",
             "permission_key": "smartreward:redemption:read"},
        ])
        self.assertEqual(audience["branch_scopes"], [
            {"branch_id": "branch-a", "resources": ["reward_points_ledger"]},
            {"branch_id": "branch-b", "resources": ["reward_redemptions"]},
        ])

    def test_tenant_catalog_permission_is_separate_from_ledger_audience(self):
        audience = _reward_event_audience([
            {"role_key": "tenant_owner", "scope_type": "tenant", "scope_id": "org-a",
             "permission_key": "smartreward:ledger:read"},
            {"role_key": "tenant_owner", "scope_type": "tenant", "scope_id": "org-a",
             "permission_key": "smartreward:catalog:read"},
        ])
        self.assertEqual(audience["tenant_resources"], ["reward_points_ledger"])
        self.assertEqual(audience["catalog_resources"], ["reward_catalog_items"])

    def test_legacy_tenant_broadcast_is_suppressed_until_owner_policy_is_active(self):
        self.assertIn("no tenant-wide Broadcast topic", self.broadcast_migration)
        self.assertNotIn("||org_id::text||':smartreward'", self.broadcast_migration)
        self.assertIn("corresponding read permission", self.owner_policy)
        self.assertIn("smartreward:ledger:read", self.owner_policy)
        self.assertIn("smartreward:catalog:read", self.owner_policy)


if __name__ == "__main__":
    unittest.main()
