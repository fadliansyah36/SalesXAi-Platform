import unittest
from decimal import Decimal

from app.domain.smart_order_rules import (
    available_stock,
    can_cancel_order,
    can_transition_fulfillment,
    fixed_discount,
    evaluate_promotion_candidates,
    line_totals,
    money,
    percentage_discount,
)


class SmartOrderRulesTests(unittest.TestCase):
    def test_money_uses_half_up_for_currency_snapshots(self):
        self.assertEqual(money("1.005"), Decimal("1.01"))

    def test_price_and_tax_snapshot(self):
        result = line_totals("12500.50", "2", "11")
        self.assertEqual(result["subtotal"], Decimal("25001.00"))
        self.assertEqual(result["tax"], Decimal("2750.11"))
        self.assertEqual(result["total"], Decimal("27751.11"))

    def test_discount_is_bounded_by_base(self):
        self.assertEqual(percentage_discount("1000", "150"), Decimal("1000.00"))
        self.assertEqual(fixed_discount("1000", "1250"), Decimal("1000.00"))

    def test_inventory_available_invariant(self):
        self.assertEqual(available_stock("100", "20", "30"), Decimal("50"))
        with self.assertRaises(ValueError):
            available_stock("10", "8", "3")

    def test_fulfillment_transition_graph(self):
        self.assertTrue(can_transition_fulfillment("queued", "picking"))
        self.assertFalse(can_transition_fulfillment("handed_over", "delivered"))
        self.assertFalse(can_transition_fulfillment("queued", "delivered"))
        self.assertFalse(can_transition_fulfillment("delivered", "picking"))

    def test_product_targeted_discount_is_independent_of_rule_order(self):
        promo = {"id": "promo-1", "code": "SKU10", "priority": 1, "stackable": False, "rules": [
            {"rule_type": "discount_percent", "rule_config": {"percent": 10}},
            {"rule_type": "product", "rule_config": {"product_id": "p1"}},
        ]}
        lines = [
            {"product_id": "p1", "category_id": "c1", "subtotal": "100"},
            {"product_id": "p2", "category_id": "c2", "subtotal": "900"},
        ]
        applied, total = evaluate_promotion_candidates([promo], "1000", "2", "customer-1", lines)
        self.assertEqual(total, Decimal("10.00"))
        self.assertEqual(applied[0]["discount_amount"], "10.00")

    def test_customer_and_category_eligibility_are_enforced(self):
        promo = {"id": "promo-2", "code": "CAT", "priority": 1, "stackable": False, "rules": [
            {"rule_type": "category", "rule_config": {"category_id": "c1"}},
            {"rule_type": "customer", "rule_config": {"organization_id": "customer-1"}},
            {"rule_type": "discount_percent", "rule_config": {"percent": 20}},
        ]}
        lines = [
            {"product_id": "p1", "category_id": "c1", "subtotal": "200"},
            {"product_id": "p2", "category_id": "c2", "subtotal": "800"},
        ]
        applied, total = evaluate_promotion_candidates([promo], "1000", "2", "customer-1", lines)
        self.assertEqual(total, Decimal("40.00"))
        rejected, rejected_total = evaluate_promotion_candidates([promo], "1000", "2", "customer-2", lines)
        self.assertEqual(rejected, [])
        self.assertEqual(rejected_total, Decimal("0"))

    def test_non_stackable_promotion_stops_lower_priority_candidates(self):
        promos = [
            {"id": "a", "code": "A", "priority": 1, "stackable": False, "rules": [{"rule_type": "discount_amount", "rule_config": {"amount": 20}}]},
            {"id": "b", "code": "B", "priority": 2, "stackable": True, "rules": [{"rule_type": "discount_amount", "rule_config": {"amount": 30}}]},
        ]
        applied, total = evaluate_promotion_candidates(promos, "100", "1", None, [])
        self.assertEqual([item["code"] for item in applied], ["A"])
        self.assertEqual(total, Decimal("20.00"))

    def test_stacking_group_and_voucher_rule_are_enforced(self):
        promos = [
            {"id": "a", "code": "A", "priority": 1, "stackable": True, "stacking_group": "exclusive", "rules": [
                {"rule_type": "voucher", "rule_config": {"code": "A"}},
                {"rule_type": "discount_amount", "rule_config": {"amount": 10}},
            ]},
            {"id": "b", "code": "B", "priority": 2, "stackable": True, "stacking_group": "exclusive", "rules": [
                {"rule_type": "discount_amount", "rule_config": {"amount": 20}},
            ]},
        ]
        applied, total = evaluate_promotion_candidates(promos, "100", "1", None, [])
        self.assertEqual([item["code"] for item in applied], ["A"])
        self.assertEqual(total, Decimal("10.00"))

        mismatched = [{**promos[0], "rules": [
            {"rule_type": "voucher", "rule_config": {"code": "OTHER"}},
            {"rule_type": "discount_amount", "rule_config": {"amount": 10}},
        ]}]
        rejected, rejected_total = evaluate_promotion_candidates(mismatched, "100", "1", None, [])
        self.assertEqual(rejected, [])
        self.assertEqual(rejected_total, Decimal("0"))

    def test_promotion_audience_is_scoped_to_active_partner_type(self):
        promo = {"id": "promo-company", "organization_id": "principal-1", "code": "B2B",
                 "priority": 1, "stackable": False, "consumer_relationship_type": "distributor",
                 "rules": [
                     {"rule_type": "organization_type", "rule_config": {"organization_types": ["distributor", "company"]}},
                     {"rule_type": "discount_percent", "rule_config": {"percent": 12}},
                 ]}
        applied, total = evaluate_promotion_candidates([promo], "1000", "1", "buyer-1", [])
        self.assertEqual(total, Decimal("120.00"))
        self.assertEqual(applied[0]["promotion_owner_organization_id"], "principal-1")
        self.assertEqual(applied[0]["rules_snapshot"], promo["rules"])
        rejected, rejected_total = evaluate_promotion_candidates(
            [{**promo, "consumer_relationship_type": "customer"}], "1000", "1", "buyer-1", []
        )
        self.assertEqual(rejected, [])
        self.assertEqual(rejected_total, Decimal("0"))

    def test_order_cancellation_window(self):
        self.assertTrue(can_cancel_order("draft"))
        self.assertTrue(can_cancel_order("pending_approval"))
        self.assertTrue(can_cancel_order("revision_requested"))
        self.assertTrue(can_cancel_order("approved"))
        self.assertFalse(can_cancel_order("processing"))
        self.assertFalse(can_cancel_order("completed"))


if __name__ == "__main__":
    unittest.main()
