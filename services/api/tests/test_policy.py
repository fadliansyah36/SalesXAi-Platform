import unittest

from app.security.policy import abac_conditions_match


class AbacPolicyTests(unittest.TestCase):
    def test_empty_conditions_are_non_restrictive_after_rbac_grant(self):
        self.assertTrue(abac_conditions_match({}, {"branch_id":"branch-a"}))

    def test_matching_resource_attributes_are_allowed(self):
        self.assertTrue(abac_conditions_match(
            {"conditions":{"branch_id":"branch-a","region":"west"}},
            {"branch_id":"branch-a","region":"west"},
        ))

    def test_mismatched_resource_attributes_are_denied(self):
        self.assertFalse(abac_conditions_match(
            {"conditions":{"branch_id":"branch-a"}},
            {"branch_id":"branch-b"},
        ))

    def test_jsonb_string_attributes_are_supported(self):
        self.assertTrue(abac_conditions_match(
            '{"conditions":{"owner_user_id":"user-a"}}',
            {"owner_user_id":"user-a"},
        ))

    def test_malformed_attributes_fail_closed(self):
        self.assertFalse(abac_conditions_match("{not-json", {}))


if __name__=="__main__":
    unittest.main()
