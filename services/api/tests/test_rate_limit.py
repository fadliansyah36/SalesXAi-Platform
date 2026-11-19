import unittest

from app.services.rate_limit import RateLimitRule, _bucket_key, rule_for_request


class DistributedRateLimitRuleTests(unittest.TestCase):
    def test_invitation_create_has_a_strict_write_limit(self):
        rule = rule_for_request("POST", "/api/v1/organizations/123/invitations")
        self.assertEqual(rule, RateLimitRule("invitation_create", 8, 600, 1800))

    def test_session_revocation_is_limited(self):
        rule = rule_for_request("DELETE", "/api/v1/auth/sessions/abc")
        self.assertIsNotNone(rule)
        self.assertEqual(rule.name, "auth_revoke")

    def test_unrelated_reads_are_not_limited_by_sensitive_write_rules(self):
        self.assertIsNone(rule_for_request("GET", "/api/v1/organizations"))

    def test_bucket_keys_are_stable_and_do_not_expose_identifiers(self):
        first = _bucket_key("auth:ip", "203.0.113.10")
        second = _bucket_key("auth:ip", "203.0.113.10")
        self.assertEqual(first, second)
        self.assertEqual(len(first), 64)
        self.assertNotIn("203.0.113.10", first)

    def test_bucket_keys_are_keyed_when_a_server_secret_is_available(self):
        first = _bucket_key("auth:account", "user-123", "a" * 32)
        same = _bucket_key("auth:account", "user-123", "a" * 32)
        different = _bucket_key("auth:account", "user-123", "b" * 32)
        self.assertEqual(first, same)
        self.assertNotEqual(first, different)
        self.assertNotIn("user-123", first)


if __name__ == "__main__":
    unittest.main()
