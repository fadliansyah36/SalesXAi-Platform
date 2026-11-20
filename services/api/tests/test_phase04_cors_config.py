from __future__ import annotations

import unittest
from app.config import Settings

WEBSITE = "https://salesx-website-production.up.railway.app"
CUSTOMER = "https://salesx-customer-production.up.railway.app"
COMPANY = "https://salesx-company-production.up.railway.app"
EXACT_ORIGINS = ",".join((WEBSITE, CUSTOMER, COMPANY))

class Phase04CorsConfigurationTests(unittest.TestCase):
    def test_exact_portal_origins_are_accepted_with_canonical_app_origin(self) -> None:
        settings = Settings(cors_origins=EXACT_ORIGINS, app_public_url=WEBSITE)
        self.assertEqual(settings.allowed_origins, [WEBSITE, CUSTOMER, COMPANY])
        self.assertEqual(settings.app_public_url, WEBSITE)

    def test_wildcard_and_path_origins_are_rejected(self) -> None:
        with self.assertRaises(ValueError):
            Settings(cors_origins="*", app_public_url=WEBSITE)
        with self.assertRaises(ValueError):
            Settings(cors_origins=WEBSITE + "/sales", app_public_url=WEBSITE)

if __name__ == "__main__":
    unittest.main()
