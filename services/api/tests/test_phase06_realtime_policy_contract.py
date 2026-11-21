import unittest
from pathlib import Path


class Phase06RealtimePolicyContractTests(unittest.TestCase):
    def test_owner_pending_policy_separates_user_branch_and_tenant_channels(self):
        root = Path(__file__).resolve().parents[3]
        policy = (
            root
            / "supabase"
            / "owner-pending"
            / "20261121101500_smartreward_realtime_role_scope_policy.sql"
        ).read_text(encoding="utf-8")
        self.assertIn("tenant:[0-9a-fA-F-]{36}:user:", policy)
        self.assertIn("tenant:[0-9a-fA-F-]{36}:branch:", policy)
        self.assertIn("tenant:[0-9a-fA-F-]{36}:smartreward", policy)
        self.assertIn("split_part(realtime.topic(), ':', 4) = (select auth.uid())::text", policy)
        self.assertIn("r.key = 'supervisor'", policy)
        self.assertIn("r.key in ('tenant_owner', 'company_admin', 'principal_user', 'distributor_user')", policy)
        self.assertIn("rp.permission_key", policy)
        self.assertIn("payload ->> 'organization_id'", policy)
        self.assertIn("payload ->> 'participant_user_id'", policy)
        self.assertIn("payload ->> 'branch_id'", policy)
        self.assertIn("extension = 'broadcast'", policy)

    def test_location_realtime_policy_is_owner_gated_and_payload_scoped(self):
        root = Path(__file__).resolve().parents[3]
        policy = (
            root
            / "supabase"
            / "owner-pending"
            / "20261121100000_location_realtime_messages_owner_policy.sql"
        ).read_text(encoding="utf-8")
        self.assertIn("OWNER-GATED MIGRATION", policy)
        self.assertIn("payload ->> 'organization_id'", policy)
        self.assertIn("payload ->> 'user_id'", policy)
        self.assertIn("location.live.read", policy)
        self.assertIn("supervisor_user_id", policy)


if __name__ == "__main__":
    unittest.main()
