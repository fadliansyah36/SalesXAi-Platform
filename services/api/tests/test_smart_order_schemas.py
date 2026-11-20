import unittest
from uuid import uuid4

from pydantic import ValidationError

from app.schemas.smart_order import (
    FulfillmentUpdate,
    PriceListWrite,
    PromotionWrite,
    StockMovementWrite,
    PartnerOrderDecision,
)


class SmartOrderSchemaTests(unittest.TestCase):
    def test_handover_requires_real_carrier_and_tracking_reference(self):
        with self.assertRaises(ValidationError):
            FulfillmentUpdate(status="handed_over")
        payload = FulfillmentUpdate(status="handed_over", carrier="Carrier X", tracking_number="TRACK-123")
        self.assertEqual(payload.tracking_number, "TRACK-123")

    def test_price_list_requires_scope_for_non_tenant_rules(self):
        with self.assertRaises(ValidationError):
            PriceListWrite(
                name="Customer pricing",
                code="CUST-1",
                scope_type="customer",
                effective_from="2026-11-20T00:00:00Z",
                prices=[{"product_id": str(uuid4()), "variant_id": str(uuid4()), "unit_price": 100}],
            )

    def test_channel_price_list_requires_channel_and_no_scope_id(self):
        base = {
            "name": "Mobile pricing",
            "code": "MOBILE-1",
            "scope_type": "channel",
            "effective_from": "2026-11-20T00:00:00Z",
            "prices": [{"product_id": str(uuid4()), "variant_id": str(uuid4()), "unit_price": 100}],
        }
        with self.assertRaises(ValidationError):
            PriceListWrite(**base)
        valid = PriceListWrite(**base, channel="mobile")
        self.assertEqual(valid.channel, "mobile")

    def test_promotion_discount_rules_require_valid_bounds(self):
        base = {
            "code": "SAVE",
            "name": "Save campaign",
            "starts_at": "2026-11-20T00:00:00Z",
            "ends_at": "2026-12-20T00:00:00Z",
            "rules": [{"rule_type": "discount_percent", "rule_config": {"percent": 150}}],
        }
        with self.assertRaises(ValidationError):
            PromotionWrite(**base)
        valid = PromotionWrite(**{**base, "rules": [{"rule_type": "discount_percent", "rule_config": {"percent": 15}}]})
        self.assertEqual(valid.rules[0]["rule_type"], "discount_percent")

    def test_company_price_scope_requires_and_accepts_tenant_scope_id(self):
        base = {
            "name": "Company pricing",
            "code": "COMPANY-1",
            "scope_type": "company",
            "effective_from": "2026-11-20T00:00:00Z",
            "prices": [{"product_id": str(uuid4()), "variant_id": str(uuid4()), "unit_price": 100}],
        }
        with self.assertRaises(ValidationError):
            PriceListWrite(**base)
        valid = PriceListWrite(**base, scope_id=str(uuid4()))
        self.assertEqual(valid.scope_type, "company")

    def test_promotion_organization_audience_accepts_supported_tenant_types(self):
        base = {
            "code": "B2B",
            "name": "Partner campaign",
            "starts_at": "2026-11-20T00:00:00Z",
            "ends_at": "2026-12-20T00:00:00Z",
            "rules": [
                {"rule_type": "organization_type", "rule_config": {"organization_types": ["principal", "distributor", "company", "customer"]}},
                {"rule_type": "discount_percent", "rule_config": {"percent": 10}},
            ],
        }
        self.assertEqual(PromotionWrite(**base).rules[0]["rule_type"], "organization_type")
        with self.assertRaises(ValidationError):
            PromotionWrite(**{**base, "rules": [{"rule_type": "organization_type", "rule_config": {"organization_types": ["unknown"]}}, base["rules"][1]]})

    def test_partner_decision_requires_reason_for_rejection_and_idempotency(self):
        with self.assertRaises(ValidationError):
            PartnerOrderDecision(decision="rejected", reason="no", idempotency_key="key-12345")
        accepted = PartnerOrderDecision(decision="accepted", idempotency_key="key-12345")
        self.assertEqual(accepted.decision, "accepted")

    def test_adjustment_delta_and_quantity_must_match(self):
        base = {
            "warehouse_id": str(uuid4()),
            "product_id": str(uuid4()),
            "variant_id": str(uuid4()),
            "movement_type": "adjustment",
            "quantity": 2,
            "adjustment_delta": -3,
            "reason": "Physical count adjustment",
            "idempotency_key": "adjustment-123",
        }
        with self.assertRaises(ValidationError):
            StockMovementWrite(**base)
        valid = StockMovementWrite(**{**base, "quantity": 3})
        self.assertEqual(valid.adjustment_delta, -3)


if __name__ == "__main__":
    unittest.main()
