"""Canonical action contract for every currently registered FastAPI route.

This registry is intentionally limited to implemented API routes. Portal business
actions without a domain endpoint are not represented as server-enforced actions.
"""
from dataclasses import dataclass
from typing import Iterable

from fastapi.routing import APIRoute


@dataclass(frozen=True)
class ApiActionContract:
    method: str
    path: str
    feature: str
    action: str
    permission_key: str | None
    scope: str
    enforcement: str


API_ACTION_MATRIX: tuple[ApiActionContract, ...] = (
    ApiActionContract("GET", "/api/v1/auth/me", "identity", "read_context", None, "self", "verified_session"),
    ApiActionContract("POST", "/api/v1/auth/sessions/current", "identity", "register_session", None, "self", "verified_session_and_session_registry"),
    ApiActionContract("GET", "/api/v1/auth/sessions", "identity", "list_sessions", "profile:read:self", "self", "self_permission_and_owner_filter"),
    ApiActionContract("DELETE", "/api/v1/auth/sessions/{session_id}", "identity", "revoke_session", "profile:update:self", "self", "self_permission_and_owner_filter"),
    ApiActionContract("POST", "/api/v1/auth/sign-out", "identity", "sign_out", None, "self", "verified_session_and_provider_signout"),
    ApiActionContract("POST", "/api/v1/auth/identities/link-authorize", "identity", "link_identity", "identity:link:self", "self", "self_permission"),
    ApiActionContract("GET", "/api/v1/auth/identities", "identity", "read_identities", "identity:read:self", "self", "self_permission_and_owner_filter"),
    ApiActionContract("DELETE", "/api/v1/auth/identities/{identity_id}", "identity", "unlink_identity", "identity:unlink:self", "self", "self_permission_and_owner_filter"),
    ApiActionContract("GET", "/api/v1/admin/users", "platform_security", "list_users", "account:status:manage", "platform", "platform_permission"),
    ApiActionContract("GET", "/api/v1/admin/roles", "platform_security", "list_roles", "role:assign", "platform", "platform_permission"),
    ApiActionContract("PATCH", "/api/v1/admin/users/{user_id}/account-status", "platform_security", "change_account_status", "account:status:manage", "platform", "platform_permission_and_session_revocation"),
    ApiActionContract("GET", "/api/v1/organizations", "organization", "list_my_organizations", None, "self", "verified_identity_and_membership_owner_filter"),
    ApiActionContract("POST", "/api/v1/organizations", "organization", "create", "organization:create", "platform", "platform_permission"),
    ApiActionContract("GET", "/api/v1/organizations/{organization_id}/members", "organization", "read_members", "organization:members:read", "tenant", "tenant_permission_and_resource_tenant_match"),
    ApiActionContract("POST", "/api/v1/organizations/{organization_id}/members", "organization", "invite_member", "organization:members:manage", "tenant", "tenant_permission_and_resource_tenant_match"),
    ApiActionContract("PATCH", "/api/v1/organizations/{organization_id}/members/{user_id}", "organization", "change_membership", "organization:members:manage", "tenant", "tenant_permission_hierarchy_and_resource_tenant_match"),
    ApiActionContract("POST", "/api/v1/organizations/{organization_id}/members/{user_id}/roles", "organization", "assign_role", "role:assign", "tenant", "tenant_permission_hierarchy_and_resource_tenant_match"),
    ApiActionContract("GET", "/api/v1/organizations/{organization_id}/assignable-roles", "organization", "read_assignable_roles", "organization:invitations:manage", "tenant", "tenant_permission_and_delegation_hierarchy"),
    ApiActionContract("GET", "/api/v1/organizations/{organization_id}/invitations", "organization", "read_invitations", "organization:invitations:manage", "tenant", "tenant_permission_and_resource_tenant_match"),
    ApiActionContract("POST", "/api/v1/organizations/{organization_id}/invitations", "organization", "create_invitation", "organization:invitations:manage", "tenant", "tenant_permission_and_delegation_hierarchy"),
    ApiActionContract("POST", "/api/v1/organizations/invitations/accept", "organization", "accept_invitation", None, "self", "verified_identity_and_single_use_token"),
    ApiActionContract("POST", "/api/v1/organizations/invitations/reject", "organization", "reject_invitation", None, "self", "verified_identity_and_single_use_token"),
    ApiActionContract("POST", "/api/v1/organizations/{organization_id}/invitations/{invitation_id}/revoke", "organization", "revoke_invitation", "organization:invitations:manage", "tenant", "tenant_permission_and_resource_tenant_match"),
    ApiActionContract("POST", "/api/v1/organizations/{organization_id}/invitations/{invitation_id}/resend", "organization", "resend_invitation", "organization:invitations:manage", "tenant", "tenant_permission_and_delegation_hierarchy"),
    ApiActionContract("GET", "/api/v1/organizations/{organization_id}/audit", "audit", "read_audit", "audit:read", "tenant", "tenant_permission_and_resource_tenant_match"),
    ApiActionContract("POST", "/api/v1/security/refresh-authorize", "security", "authorize_refresh", None, "bff", "shared_secret_and_live_device_session"),
    ApiActionContract("POST", "/api/v1/security/rate-limit", "security", "consume_external_rate_limit", None, "bff", "shared_secret_and_database_rate_limit"),
)


def validate_api_action_matrix(routes: Iterable[object]) -> None:
    """Fail startup if any /api/v1 route is missing from or stale in the matrix."""
    registered: set[tuple[str, str]] = set()
    for route in routes:
        if not isinstance(route, APIRoute) or not route.path.startswith("/api/v1/"):
            continue
        for method in route.methods or set():
            if method not in {"HEAD", "OPTIONS"}:
                registered.add((method, route.path))

    declared = {(entry.method, entry.path) for entry in API_ACTION_MATRIX}
    missing = sorted(registered - declared)
    stale = sorted(declared - registered)
    if missing or stale:
        raise RuntimeError(
            "FastAPI action matrix drift detected; "
            f"unmapped_routes={missing}; stale_contracts={stale}"
        )
