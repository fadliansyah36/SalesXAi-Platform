import unittest
from pathlib import Path


class SmartOrderMigrationIndexTests(unittest.TestCase):
    def test_phase05_cross_tenant_promotion_partner_and_snapshot_guards_are_versioned(self):
        root = Path(__file__).resolve().parents[3] / "supabase" / "migrations"
        expected = {
            "20261120180237_p05_company_partner_and_promotion_audience.sql": "relationship_type",
            "20261120180544_p05_company_price_scope.sql": "price_lists_scope_type_check",
            "20261120180652_p05_realtime_partner_event_identity.sql": "event_id",
            "20261120180725_p05_immutable_order_and_redemption_snapshots.sql": "orders_commercial_snapshot_immutable",
            "20261120180953_p05_promotion_redemption_audit_events.sql": "promotion.redemption",
            "20261120181305_p05_promotion_organization_audience_rule.sql": "organization_type",
            "20261120181815_p05_harden_trigger_search_paths.sql": "search_path=pg_catalog,public",
            "20261120182440_p05_realtime_tenant_role_scope.sql": "scope_type='tenant'",
            "20261120182536_p05_realtime_resource_and_partner_scope.sql": "payload->>'resource'",
            "20261120182937_p05_notify_smartorder_sse_events.sql": "pg_notify('smartorder_events'",
            "20261121010512_p05_realtime_auth_rls_initplan.sql": "m.user_id=(select auth.uid())",
        }
        for filename, marker in expected.items():
            sql = (root / filename).read_text(encoding="utf-8")
            self.assertIn(marker, sql)
        partner = (root / "20261120174702_p05_partner_approval_cross_tenant_promotions.sql").read_text(encoding="utf-8")
        self.assertIn("order_partner_decisions", partner)
        self.assertIn("promotion_owner_organization_id", partner)

    def test_phase05_foreign_key_indexes_cover_the_advisor_findings(self):
        migration = (
            Path(__file__).resolve().parents[3]
            / "supabase"
            / "migrations"
            / "20261120155706_p05_smartorder_foreign_key_indexes.sql"
        )
        sql = migration.read_text(encoding="utf-8")
        statements = [
            line for line in sql.splitlines()
            if line.lower().startswith("create index if not exists ")
        ]
        self.assertEqual(len(statements), 48)
        self.assertEqual(len(set(statements)), 48)
        self.assertIn("public.cart_items (organization_id,cart_id)", sql)
        self.assertIn("public.orders (organization_id,cart_id)", sql)
        self.assertIn("public.stock_transfers (organization_id,to_warehouse_id)", sql)


if __name__ == "__main__":
    unittest.main()
