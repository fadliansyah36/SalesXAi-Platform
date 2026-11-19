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
        self.assertEqual(rule_for_request("GET", "/api/v1/admin/roles").name, "admin_role_list")

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


class RefreshAuthorizationGateTests(unittest.IsolatedAsyncioTestCase):
    async def _authorize(self, *, revoked_at=None, session_id="7d3f65c4-9d7e-4b7f-bb17-1a65c3d6c002",
                         account_status="active", session_revoked_at=None, device_id="device-1",
                         bff_secret="s" * 32):
        from datetime import UTC, datetime, timedelta
        from types import SimpleNamespace
        from pydantic import SecretStr
        from app.errors import APIError
        from app.routers.security import authorize_session_refresh

        now = datetime.now(UTC)
        row = {
            "status": account_status,
            "session_revoked_at": session_revoked_at,
            "email_confirmed_at": now,
            "phone_confirmed_at": None,
            "session_id": session_id,
            "not_after": now + timedelta(days=1),
            "device_id": device_id,
            "revoked_at": revoked_at,
            "expires_at": now + timedelta(days=1),
        }

        class Connection:
            async def fetchrow(self, *_args):
                return row

        class Acquire:
            async def __aenter__(self):
                return Connection()

            async def __aexit__(self, *_args):
                return None

        class Pool:
            def acquire(self):
                return Acquire()

        class Verifier:
            async def verify(self, token, *, allow_expired=False):
                self.token = token
                self.allow_expired = allow_expired
                return {
                    "sub": "8d3f65c4-9d7e-4b7f-bb17-1a65c3d6c001",
                    "session_id": session_id,
                    "iat": now.timestamp() - 3600,
                }

        settings = SimpleNamespace(salesx_bff_shared_secret=SecretStr("s" * 32))
        verifier = Verifier()
        request = SimpleNamespace(
            app=SimpleNamespace(state=SimpleNamespace(
                settings=settings, jwt_verifier=verifier, db_pool=Pool()
            )),
            headers={
                "x-salesx-bff-secret": bff_secret,
                "authorization": "Bearer signed-expired-access-token",
            },
        )
        return await authorize_session_refresh(request)

    async def test_active_registered_session_can_refresh_with_expired_access_token(self):
        response = await self._authorize()
        self.assertEqual(response.status_code, 204)

    async def test_revoked_device_cannot_refresh(self):
        from app.errors import APIError
        with self.assertRaises(APIError) as raised:
            await self._authorize(revoked_at=__import__("datetime").datetime.now(__import__("datetime").UTC))
        self.assertEqual(raised.exception.code, "session_revoked")

    async def test_unregistered_device_cannot_refresh(self):
        from app.errors import APIError
        with self.assertRaises(APIError) as raised:
            await self._authorize(device_id=None)
        self.assertEqual(raised.exception.code, "session_revoked")

    async def test_inactive_account_cannot_refresh(self):
        from app.errors import APIError
        with self.assertRaises(APIError) as raised:
            await self._authorize(account_status="suspended")
        self.assertEqual(raised.exception.code, "account_inactive")

    async def test_refresh_gate_requires_internal_bff_secret(self):
        from app.errors import APIError
        with self.assertRaises(APIError) as raised:
            await self._authorize(bff_secret="incorrect")
        self.assertEqual(raised.exception.status_code, 404)
