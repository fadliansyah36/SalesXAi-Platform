import unittest

from app.main import app
from app.security.action_matrix import API_ACTION_MATRIX, validate_api_action_matrix


class ApiActionMatrixTests(unittest.TestCase):
    def test_every_registered_api_route_has_one_action_contract(self) -> None:
        validate_api_action_matrix(app.routes)

    def test_action_contract_ids_and_routes_are_unique(self) -> None:
        ids = [item.id for item in API_ACTION_MATRIX]
        routes = [(item.method, item.path) for item in API_ACTION_MATRIX]
        self.assertEqual(len(ids), len(set(ids)))
        self.assertEqual(len(routes), len(set(routes)))

    def test_tenant_and_platform_actions_declare_permissions(self) -> None:
        for item in API_ACTION_MATRIX:
            if item.scope in {"tenant", "platform"}:
                self.assertIsNotNone(item.permission_key, item.id)


if __name__ == "__main__":
    unittest.main()
