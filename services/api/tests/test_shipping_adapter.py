import unittest

from app.integrations.shipping import ShippingAdapterRegistry, ShippingAdapterUnavailable


class ShippingAdapterRegistryTests(unittest.TestCase):
    def test_provider_is_not_faked_when_unconfigured(self):
        registry = ShippingAdapterRegistry()
        with self.assertRaises(ShippingAdapterUnavailable):
            registry.resolve(None)

    def test_unknown_provider_fails_closed(self):
        registry = ShippingAdapterRegistry()
        with self.assertRaises(ShippingAdapterUnavailable):
            registry.resolve("unconfigured-provider")


if __name__ == "__main__":
    unittest.main()
