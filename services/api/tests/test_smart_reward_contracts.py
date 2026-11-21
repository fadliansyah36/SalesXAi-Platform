import unittest
from datetime import datetime, timezone
from pathlib import Path
from types import SimpleNamespace
from uuid import uuid4

from pydantic import ValidationError

from app.routers.smart_reward import _merge_smart_reward_patch
from app.schemas.smart_reward import (
    PlatformSmartRewardOverviewResponse,
    RewardApprovalDecision,
    RewardBalanceResponse,
    RewardCatalogItemResponse,
    RewardCatalogWrite,
    RewardPageResponse,
    RewardProgramResponse,
    RewardProgramWrite,
    RewardProgressResponse,
    RewardRedemptionWrite,
    RewardReportResponse,
    RewardRuleWrite,
    RewardCustomerSegmentCriteria,
    RewardCustomerSegmentWrite,
    RewardCustomerSegmentMemberWrite,
    RewardProgramPatch,
    RewardRulePatch,
    RewardCatalogPatch,
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

    def test_catalog_response_exposes_server_eligibility_and_usage(self):
        item = RewardCatalogItemResponse(
            id=uuid4(),
            organization_id=uuid4(),
            program_id=None,
            code="VOUCHER-1",
            name="Voucher",
            category="voucher",
            points_cost=100,
            quantity_total=10,
            quantity_reserved=2,
            quantity_fulfilled=1,
            eligibility={},
            metadata={},
            status="active",
            created_by=uuid4(),
            updated_by=uuid4(),
            created_at=datetime.now(timezone.utc),
            updated_at=datetime.now(timezone.utc),
            eligible=False,
            eligibility_reason="insufficient_points",
            available_stock=7,
            points_balance=50,
            period_remaining=1,
            catalog_period_remaining=2,
        )
        self.assertFalse(item.eligible)
        self.assertEqual(item.eligibility_reason, "insufficient_points")
        self.assertEqual(item.available_stock, 7)
        self.assertEqual(item.catalog_period_remaining, 2)

    def test_server_progress_response_carries_metric_and_period_progress(self):
        progress = RewardProgressResponse(
            organization_id=uuid4(),
            participant_user_id=uuid4(),
            items=[{
                "program_id": uuid4(),
                "program_name": "Sales Incentive",
                "rule_id": uuid4(),
                "rule_name": "Completed visits",
                "event_key": "visit.completed",
                "period_days": 30,
                "points_earned": 120,
                "points_limit": 500,
                "points_remaining": 380,
                "metric_achieved": 6,
                "target_metric": 10,
                "progress_percent": 60,
                "requires_approval": False,
            }],
        )
        self.assertEqual(progress.items[0].points_remaining, 380)
        self.assertEqual(progress.items[0].progress_percent, 60)


    def test_customer_segment_schema_enforces_tenant_safe_bounded_criteria(self):
        valid = RewardCustomerSegmentWrite(
            code="VIP-CUSTOMERS",
            name="VIP Customers",
            status="active",
            membership_mode="hybrid",
            criteria={
                "roles": ["sales"],
                "branch_ids": [uuid4()],
                "user_ids": [uuid4()],
                "minimum_points_balance": 500,
            },
        )
        self.assertEqual(valid.criteria.minimum_points_balance, 500)
        with self.assertRaises(ValidationError):
            RewardCustomerSegmentWrite(
                code="V",
                name="Invalid",
                criteria={"minimum_points_balance": -1},
            )
        with self.assertRaises(ValidationError):
            RewardCustomerSegmentCriteria(
                roles=["sales"],
                untrusted_tenant_id=str(uuid4()),
            )

    def test_reward_patch_schemas_accept_status_only_updates(self):
        self.assertEqual(RewardProgramPatch(status="paused").status, "paused")
        self.assertEqual(RewardRulePatch(status="inactive").status, "inactive")
        self.assertEqual(RewardCatalogPatch(status="paused").status, "paused")
        with self.assertRaises(ValidationError):
            RewardCatalogPatch(points_cost=0)

    def test_customer_segment_requires_timezone_aware_period(self):
        with self.assertRaises(ValidationError):
            RewardCustomerSegmentWrite(
                code="VIP-TIME",
                name="VIP Time",
                starts_at="2026-11-21T00:00:00",
            )

    def test_customer_segment_period_and_member_identity_are_validated(self):
        with self.assertRaises(ValidationError):
            RewardCustomerSegmentWrite(
                code="VIP-1",
                name="VIP",
                starts_at="2026-12-20T00:00:00Z",
                ends_at="2026-12-19T00:00:00Z",
            )
        member = RewardCustomerSegmentMemberWrite(participant_user_id=uuid4())
        self.assertIsNotNone(member.participant_user_id)

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


class SmartRewardPartialUpdateMergeTests(unittest.TestCase):
    def test_program_patch_merges_persisted_periods_and_preserves_untouched_fields(self):
        current = {
            "code": "LOYALTY",
            "name": "Loyalty",
            "description": None,
            "program_type": "loyalty",
            "reward_type": "points",
            "starts_at": datetime(2026, 11, 20, tzinfo=timezone.utc),
            "ends_at": datetime(2026, 12, 20, tzinfo=timezone.utc),
            "status": "active",
            "audience": {"roles": ["sales"]},
            "configuration": {"expiration_days": 365},
            "customer_segment_id": None,
        }
        merged = _merge_smart_reward_patch(current, RewardProgramPatch(status="paused"), RewardProgramWrite)
        self.assertEqual(merged.status, "paused")
        self.assertEqual(merged.name, "Loyalty")
        self.assertTrue(merged.starts_at.endswith("+00:00"))

    def test_rule_and_catalog_status_patches_preserve_required_fields(self):
        rule = {
            "code": "VISIT", "name": "Visit", "event_key": "visit.completed",
            "priority": 100, "rule_config": {}, "points_per_unit": 0,
            "fixed_points": 10, "max_points": None, "requires_approval": False,
            "status": "active", "customer_segment_id": None,
        }
        merged_rule = _merge_smart_reward_patch(rule, RewardRulePatch(status="inactive"), RewardRuleWrite)
        self.assertEqual(merged_rule.status, "inactive")
        catalog = {
            "program_id": None, "code": "VOUCHER", "name": "Voucher",
            "description": None, "category": "voucher", "points_cost": 100,
            "quantity_total": 5, "starts_at": None, "ends_at": None,
            "eligibility": {}, "metadata": {}, "customer_segment_id": None, "status": "active",
        }
        merged_catalog = _merge_smart_reward_patch(catalog, RewardCatalogPatch(status="paused"), RewardCatalogWrite)
        self.assertEqual(merged_catalog.status, "paused")
        self.assertEqual(merged_catalog.points_cost, 100)


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

    def test_smartreward_tenant_guard_rejects_cross_organization_scope(self):
        from app.services.smart_reward import smart_reward_service
        with self.assertRaises(Exception) as caught:
            smart_reward_service._tenant(uuid4(), SimpleNamespace(organization_id=uuid4()))
        self.assertEqual(getattr(caught.exception, "code", None), "tenant_scope_mismatch")

    def test_application_services_use_repository_boundary_and_transactions(self):
        self.assertIn("class SmartRewardRepository", self.repository)
        self.assertIn("db:SmartRewardRepository", self.service)
        self.assertIn("async with db.transaction()", self.service)
        self.assertIn("async with db.transaction()", self.approval)

    def test_balance_projection_and_expiration_read_share_one_transaction(self):
        balance = self.service.split("async def balance", 1)[1].split("async def progress", 1)[0]
        self.assertIn("async with db.transaction()", balance)
        self.assertIn("self._account(db,org,user)", balance)

    def test_issuance_redemption_and_approval_are_serialized_and_idempotent(self):
        self.assertIn("for update", self.service.lower())
        self.assertIn("idempotency_key", self.service)
        self.assertIn("pg_advisory_xact_lock(hashtextextended($1,0))", self.approval)
        self.assertIn("for update", self.approval.lower())

    def test_source_ownership_and_program_audience_are_server_checked(self):
        self.assertIn("async def progress", self.service)
        self.assertIn("eligibility_reason", self.service)
        self.assertIn("participant_period_limit", self.service)
        self.assertIn("status not in ('rejected','cancelled')", self.service)
        self.assertIn("metric_achieved", self.service)
        self.assertIn("smartreward.progress.read", self.router)
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
