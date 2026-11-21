import unittest

from pydantic import ValidationError

from app.config import Settings


class GoogleMapsEnvironmentContractTests(unittest.TestCase):
    def test_server_routes_are_disabled_without_server_key(self):
        settings = Settings(_env_file=None, maps_provider="google", google_maps_server_api_key=None)
        self.assertFalse(settings.google_maps_routes_enabled)
        self.assertEqual(settings.maps_provider, "google")
        self.assertEqual(settings.google_maps_language, "id")
        self.assertEqual(settings.google_maps_region, "ID")

    def test_provider_can_be_disabled_without_credentials(self):
        settings = Settings(_env_file=None, maps_provider="none", google_maps_server_api_key=None)
        self.assertFalse(settings.google_maps_routes_enabled)
        self.assertEqual(settings.maps_provider, "none")

    def test_server_places_are_disabled_without_places_key(self):
        settings = Settings(_env_file=None, maps_provider="google", google_maps_places_api_key=None)
        self.assertFalse(settings.google_maps_places_enabled)

    def test_server_places_enable_only_with_server_key(self):
        settings = Settings(
            _env_file=None,
            maps_provider="google",
            google_maps_places_api_key="fixture-server-places-key",
        )
        self.assertTrue(settings.google_maps_places_enabled)

    def test_unknown_provider_is_rejected_by_environment_schema(self):
        with self.assertRaises(ValidationError):
            Settings(_env_file=None, maps_provider="unregistered-provider")


if __name__ == "__main__":
    unittest.main()
