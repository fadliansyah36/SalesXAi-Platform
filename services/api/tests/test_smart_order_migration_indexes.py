import unittest
from pathlib import Path


class SmartOrderMigrationIndexTests(unittest.TestCase):
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
