import unittest

from app.routers.smart_reward import _reward_event_audience


class SmartRewardEventAudienceTests(unittest.TestCase):
    def test_branch_scoped_company_admin_is_not_tenant_wide(self):
        tenant, branches, catalog = _reward_event_audience([
            {"role_key": "company_admin", "scope_type": "branch", "scope_id": "branch-a",
             "permission_key": "smartreward:ledger:read"}
        ])
        self.assertFalse(tenant)
        self.assertEqual(branches, [])
        self.assertFalse(catalog)

    def test_supervisor_receives_only_assigned_branch_scope(self):
        tenant, branches, catalog = _reward_event_audience([
            {"role_key": "supervisor", "scope_type": "branch", "scope_id": "branch-a",
             "permission_key": "smartreward:ledger:read"}
        ])
        self.assertFalse(tenant)
        self.assertEqual(branches, ["branch-a"])
        self.assertFalse(catalog)

    def test_tenant_owner_requires_tenant_scope(self):
        tenant, branches, catalog = _reward_event_audience([
            {"role_key": "tenant_owner", "scope_type": "tenant", "scope_id": "org-a",
             "permission_key": "smartreward:ledger:read"}
        ])
        self.assertTrue(tenant)
        self.assertEqual(branches, [])
        self.assertFalse(catalog)

    def test_catalog_permission_is_separate_from_ledger_audience(self):
        tenant, branches, catalog = _reward_event_audience([
            {"role_key": "supervisor", "scope_type": "branch", "scope_id": "branch-a",
             "permission_key": "smartreward:catalog:read"}
        ])
        self.assertFalse(tenant)
        self.assertEqual(branches, ["branch-a"])
        self.assertTrue(catalog)


if __name__ == "__main__":
    unittest.main()
