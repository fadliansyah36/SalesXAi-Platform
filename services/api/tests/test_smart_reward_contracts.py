import unittest
from datetime import datetime, timezone
from pathlib import Path
from uuid import uuid4

from pydantic import ValidationError

from app.schemas.smart_reward import (
    PlatformSmartRewardOverviewResponse,
    RewardApprovalDecision,
    RewardBalanceResponse,
    RewardPageResponse,
    RewardProgramResponse,
    RewardProgramWrite,
    RewardRedemptionWrite,
    RewardReportResponse,
    RewardRuleWrite,
)


class SmartRewardSchemaTests(unittest.TestCase):
    def test_program_period_requires_timezone_and_forward_range(self):
        base = {
            "code": "LOYALTY-2026",
            "name": "Customer Loyalty",
            "starts_at": "2026-11-20T00:00:00Z",
            "ends_at": "2026-12-20T00:00:00Z",
        }
        self.assertEqual(RewardProgramWrite(**base).program_type, "loyalty")
        with self.assertRaises(ValidationError):
            RewardProgramWrite(**{**base, "starts_at": "2026-11-20T00:00:00"})
        with self.assertRaises(ValidationError):
            RewardProgramWrite(**{**base, "ends_at": "2026-11-19T00:00:00Z"})

    def test_rule_points_and_approval_policy_are_bounded(self):
        valid = RewardRuleWrite(
            code="VISIT-10",
            name="Completed visit",
            event_key="visit.completed",
            fixed_points=10,
            max_points=100,
            requires_approval=True,
        )
        self.assertTrue(valid.requires_approval)
        with self.assertRaises(ValidationError):
            RewardRuleWrite(
                code="VISIT-NEG",
                name="Invalid negative reward",
                event_key="visit.completed",
                fixed_points=-1,
            )

    def test_redemption_requires_positive_quantity_and_idempotency_key(self):
        valid = RewardRedemptionWrite(
            catalog_item_id=uuid4(),
            quantity=2,
            idempotency_key="redemption-key-0001",
        )
        self.assertEqual(valid.quantity, 2)
        with self.assertRaises(ValidationError):
            RewardRedemptionWrite(
                catalog_item_id=uuid4(),
                quantity=0,
                idempotency_key="redemption-key-0001",
            )

    def test_approval_decision_requires_a_meaningful_reason(self):
        with self.assertRaises(ValidationError):
            RewardApprovalDecision(decision="rejected", reason="no")
        decision = RewardApprovalDecision(
            decision="approved",
            reason="Verified completed visit and target evidence",
        )
        self.assertEqual(decision.decision, "approved")

    def test_response_models_accept_authoritative_balance_and_page(self):
        now = datetime.now(timezone.utc)
        balance = RewardBalanceResponse(
            account_id=uuid4(),
            organization_id=uuid4(),
            participant_user_id=uuid4(),
            points_balance=125,
            next_expiration_at=now,
            expiring_points_30d=25,
        )
        self.assertEqual(balance.points_balance, 125)
        page = RewardPageResponse[RewardProgramResponse](
            items=[],
            page=1,
            page_size=25,
            total=0,
        )
        self.assertEqual(page.total, 0)

    def test_company_and_platform_report_schemas_include_lifecycle_metrics(self):
        report = RewardReportResponse(
            earned_points=100,
            redeemed_points=20,
            outstanding_points=80,
            expired_points=5,
            adjusted_points=3,
            reversed_points=-2,
            incentive_achievements=4,
            ledger_entries=9,
            participants=2,
            pending_redemptions=1,
            pending_approvals=1,
            page=1,
            page_size=25,
            period_start=None,
            period_end=None,
        )
        self.assertEqual(report.expired_points, 5)
        platform = PlatformSmartRewardOverviewResponse(
            items=[{
                "organization_id": uuid4(),
                "organization_name": "Tenant A",
                "earned_points": 100,
                "redeemed_points": 20,
                "outstanding_points": 80,
                "expired_points": 5,
                "adjusted_points": 3,
                "reversed_points": -2,
                "incentive_achievements": 4,
                "pending_redemptions": 1,
                "pending_approvals": 1,
                "participants": 2,
            }],
            total=1,
            limit=100,
            offset=0,
        )
        self.assertEqual(platform.items[0].reversed_points, -2)


class SmartRewardRepositoryContractTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        root = Path(__file__).resolve().parents[1]
        cls.service = (root / "app" / "services" / "smart_reward.py").read_text(encoding="utf-8")
        cls.approval = (root / "app" / "services" / "smart_reward_approval.py").read_text(encoding="utf-8")
        cls.router = (root / "app" / "routers" / "smart_reward.py").read_text(encoding="utf-8")
        cls.repository = (root / "app" / "repositories" / "smart_reward.py").read_text(encoding="utf-8")
        migrations = root.parent.parent / "supabase" / "migrations"
        cls.core_migration = (migrations / "20261121012020_p06_reward_core.sql").read_text(encoding="utf-8")
        cls.expiry_migration = (migrations / "20261121025010_p06_reward_expiration_reconcile_ledger_first.sql").read_text(encoding="utf-8")
        cls.realtime_migration = (migrations / "20261121024447_p06_reward_private_realtime_all_lifecycle_events.sql").read_text(encoding="utf-8")
        cls.outbox_migration = (migrations / "20261121025805_p06_reward_outbox_owner_scope.sql").read_text(encoding="utf-8")

    def test_application_services_use_repository_boundary_and_transactions(self):
        self.assertIn("class SmartRewardRepository", self.repository)
        self.assertIn("db:SmartRewardRepository", self.service)
        self.assertIn("async with db.transaction()", self.service)
        self.assertIn("async with db.transaction()", self.approval)

    def test_issuance_redemption_and_approval_are_serialized_and_idempotent(self):
        self.assertIn("for update", self.service.lower())
        self.assertIn("idempotency_key", self.service)
        self.assertIn("pg_advisory_xact_lock(hashtextextended($1,0))", self.approval)
        self.assertIn("for update", self.approval.lower())

    def test_source_ownership_and_program_audience_are_server_checked(self):
        self.assertIn("reward_source_owner_mismatch", self.service)
        self.assertIn("owner!=user", self.service)
        self.assertIn("eligible_roles", self.service)
        self.assertIn("eligible_branch_ids", self.service)
        self.assertIn("max_total_per_period", self.service)

    def test_expiration_reconciles_from_immutable_ledger_and_is_scheduled(self):
        self.assertIn("process_reward_expirations", self.service)
        self.assertIn("sum(points_delta)", self.expiry_migration)
        self.assertIn("reward_points_ledger", self.expiry_migration)
        self.assertIn("balance_before", self.expiry_migration)
        self.assertIn("reward_point_lots", self.expiry_migration)

    def test_private_events_are_minimal_and_scope_aware(self):
        self.assertIn("smartreward.changed", self.realtime_migration)
        self.assertIn("tenant:'||org_id::text||':user:", self.realtime_migration)
        self.assertIn("tenant:'||org_id::text||':branch:", self.realtime_migration)
        self.assertIn("participant_user_id", self.outbox_migration)
        self.assertIn("requested_by", self.outbox_migration)
        self.assertIn("branch_id", self.outbox_migration)
        self.assertIn("catalog_scope", self.router)
        self.assertIn("payload->>'branch_id'=any($6::text[])", self.router)

    def test_ledger_is_append_only_and_client_access_is_denied(self):
        self.assertIn("reward_ledger_immutable", self.core_migration)
        self.assertIn("reward_ledger_deny_client", self.core_migration)
        self.assertIn("reversal_of", self.core_migration)
        self.assertIn("balance_before", self.core_migration)
        self.assertIn("balance_after", self.core_migration)


if __name__ == "__main__":
    unittest.main()
