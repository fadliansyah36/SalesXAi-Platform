import unittest
from types import SimpleNamespace
from uuid import uuid4

from app.errors import APIError
from app.services.authorization import authorization_service


class AuthorizationServiceBoundaryTests(unittest.TestCase):
    def setUp(self) -> None:
        self.actor_id = uuid4()
        self.organization_id = uuid4()
        self.request = SimpleNamespace(
            state=SimpleNamespace(
                authorized_api_action_id="organization.members.update",
                principal=SimpleNamespace(user_id=self.actor_id),
                tenant_context=SimpleNamespace(organization_id=self.organization_id),
            )
        )

    def test_matching_action_actor_and_tenant_are_required(self) -> None:
        authorization_service.assert_action_context(
            self.request,
            "organization.members.update",
            self.actor_id,
            self.organization_id,
        )

    def test_wrong_action_fails_closed(self) -> None:
        with self.assertRaises(APIError):
            authorization_service.assert_action_context(
                self.request, "organization.members.invite", self.actor_id,
                self.organization_id,
            )

    def test_wrong_actor_fails_closed(self) -> None:
        with self.assertRaises(APIError):
            authorization_service.assert_action_context(
                self.request, "organization.members.update", uuid4(),
                self.organization_id,
            )

    def test_cross_tenant_service_scope_fails_closed(self) -> None:
        with self.assertRaises(APIError):
            authorization_service.assert_action_context(
                self.request, "organization.members.update", self.actor_id,
                uuid4(),
            )


if __name__ == "__main__":
    unittest.main()
