import unittest
from decimal import Decimal

from app.domain.smart_order_rules import (
    available_stock,
    can_cancel_order,
    can_transition_fulfillment,
    fixed_discount,
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

    def test_order_cancellation_window(self):
        self.assertTrue(can_cancel_order("draft"))
        self.assertTrue(can_cancel_order("pending_approval"))
        self.assertTrue(can_cancel_order("revision_requested"))
        self.assertTrue(can_cancel_order("approved"))
        self.assertFalse(can_cancel_order("processing"))
        self.assertFalse(can_cancel_order("completed"))


if __name__ == "__main__":
    unittest.main()
