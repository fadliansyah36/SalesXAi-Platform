import unittest
from pathlib import Path


class SmartOrderRepositoryContractTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.source = (
            Path(__file__).resolve().parents[1]
            / "app"
            / "repositories"
            / "smart_order.py"
        ).read_text(encoding="utf-8")

    def test_cross_tenant_promotions_are_locked_and_snapshotted(self):
        self.assertIn("pg_advisory_xact_lock(hashtextextended($1,0))", self.source)
        self.assertIn("promotion_owner_organization_id", self.source)
        self.assertIn("promotion_snapshot", self.source)
        self.assertIn("promotion_redemptions", self.source)

    def test_partner_approval_includes_product_and_inventory_owners(self):
        self.assertIn("pending_partners=await db.fetchval", self.source)
        self.assertIn("select sm.organization_id partner_org", self.source)
        self.assertIn("order_partner_decisions", self.source)
        self.assertIn("partner_approval_pending", self.source)

    def test_sku_updates_preserve_variant_identity_and_archive_removed_skus(self):
        self.assertIn("if v.id:", self.source)
        self.assertIn("invalid_product_variant", self.source)
        self.assertIn("id=any($3::uuid[])", self.source)
        self.assertIn("archived_product_variant", self.source)

    def test_fulfillment_allocations_are_item_and_warehouse_scoped(self):
        self.assertIn("order_item_fulfillment_allocations", self.source)
        self.assertIn("fulfillment_organization_id", self.source)
        self.assertIn("Replacement fulfillment commitment", self.source)
        self.assertIn("shipping_failure_release_conflict", self.source)

    def test_cancellation_releases_net_reserved_and_committed_stock(self):
        self.assertIn("async def cancel_order", self.source)
        self.assertIn("inventory_release_conflict", self.source)
        self.assertIn("promotion_redemptions set status='reversed'", self.source)
        self.assertIn("cancelled_fulfillments", self.source)


if __name__ == "__main__":
    unittest.main()
