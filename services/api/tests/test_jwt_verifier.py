import time
import unittest
import jwt

from app.config import Settings
from app.errors import APIError
from app.security.jwt import SupabaseJWTVerifier

SECRET="salesx-phase02-unit-test-secret"


class SupabaseJWTVerifierTests(unittest.IsolatedAsyncioTestCase):
    def setUp(self):
        self.settings=Settings(
            supabase_url="https://eyofuiyxalbehbqoaeny.supabase.co",
            database_url="postgresql://salesx:local@127.0.0.1:5432/salesx",
            supabase_jwt_secret=SECRET,
            jwt_clock_skew_seconds=0,
        )
        self.verifier=SupabaseJWTVerifier(self.settings)

    def token(self, **overrides):
        now=int(time.time())
        claims={
            "sub":"8d3f65c4-9d7e-4b7f-bb17-1a65c3d6c001",
            "session_id":"7d3f65c4-9d7e-4b7f-bb17-1a65c3d6c002",
            "iss":self.settings.auth_issuer,
            "aud":"authenticated",
            "iat":now,
            "exp":now+300,
        }
        claims.update(overrides)
        return jwt.encode(claims,SECRET,algorithm="HS256")

    async def test_accepts_valid_legacy_hs256_token_when_explicitly_configured(self):
        claims=await self.verifier.verify(self.token())
        self.assertEqual(claims["aud"],"authenticated")

    async def test_rejects_wrong_issuer(self):
        with self.assertRaises(APIError) as raised:
            await self.verifier.verify(self.token(iss="https://attacker.invalid/auth/v1"))
        self.assertEqual(raised.exception.status_code,401)

    async def test_rejects_wrong_audience(self):
        with self.assertRaises(APIError) as raised:
            await self.verifier.verify(self.token(aud="anon"))
        self.assertEqual(raised.exception.status_code,401)

    async def test_rejects_expired_token(self):
        with self.assertRaises(APIError) as raised:
            await self.verifier.verify(self.token(exp=int(time.time())-30))
        self.assertEqual(raised.exception.status_code,401)

    async def test_requires_session_and_subject_claims(self):
        token=self.token()
        claims=jwt.decode(token,SECRET,algorithms=["HS256"],options={"verify_signature":False,"verify_aud":False})
        claims.pop("session_id")
        malformed=jwt.encode(claims,SECRET,algorithm="HS256")
        with self.assertRaises(APIError) as raised:
            await self.verifier.verify(malformed)
        self.assertEqual(raised.exception.status_code,401)


if __name__=="__main__":
    unittest.main()
