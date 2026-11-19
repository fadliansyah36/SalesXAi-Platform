import unittest

from app.services.rate_limit import RateLimitRule, _bucket_key, rule_for_request
from app.routers.security import EXTERNAL_AUTH_RULES


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

    def test_sensitive_identity_and_admin_reads_are_limited(self):
        self.assertEqual(rule_for_request("GET", "/api/v1/auth/me").name, "auth_context_read")
        self.assertEqual(rule_for_request("GET", "/api/v1/auth/sessions").name, "session_list")
        self.assertEqual(rule_for_request("GET", "/api/v1/auth/identities").name, "identity_list")
        self.assertEqual(rule_for_request("GET", "/api/v1/admin/users").name, "admin_user_list")

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

    def test_external_bff_auth_actions_are_all_rate_limited(self):
        expected = {
            "login", "signup", "otp_send", "otp_verify", "password_recovery",
            "email_verify", "oauth_start", "oauth_complete", "identity_link",
            "password_update", "refresh", "signout",
        }
        self.assertEqual(set(EXTERNAL_AUTH_RULES), expected)


if __name__ == "__main__":
    unittest.main()
