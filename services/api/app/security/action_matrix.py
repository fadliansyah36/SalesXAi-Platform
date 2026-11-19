"""Canonical action contract for every currently registered FastAPI route.

This registry is intentionally limited to implemented API routes. Portal business
actions without a domain endpoint are not represented as server-enforced actions.
"""
from collections.abc import Iterable
from dataclasses import dataclass

from fastapi.routing import APIRoute


@dataclass(frozen=True)
class ApiActionContract:
    id: str
    method: str
    path: str
    feature: str
    action: str
    resource: str
    role_policy: str
    permission_key: str | None
    scope: str
    enforcement: str


API_ACTION_MATRIX: tuple[ApiActionContract, ...] = (
    ApiActionContract("identity.context.read", "GET", "/api/v1/auth/me", "identity", "read_context", "profile", "verified_identity_and_session_owner", None, "self", "verified_session"),
    ApiActionContract("identity.session.register", "POST", "/api/v1/auth/sessions/current", "identity", "register_session", "auth_session", "verified_identity_and_session_registry", None, "self", "verified_session_and_session_registry"),
    ApiActionContract("identity.session.list", "GET", "/api/v1/auth/sessions", "identity", "list_sessions", "auth_session", "permission:profile:read:self", "profile:read:self", "self", "self_permission_and_owner_filter"),
    ApiActionContract("identity.session.revoke", "DELETE", "/api/v1/auth/sessions/{session_id}", "identity", "revoke_session", "auth_session", "permission:profile:update:self", "profile:update:self", "self", "self_permission_and_owner_filter"),
    ApiActionContract("identity.session.signout", "POST", "/api/v1/auth/sign-out", "identity", "sign_out", "auth_session", "verified_identity_and_provider_signout", None, "self", "verified_session_and_provider_signout"),
    ApiActionContract("identity.link.authorize", "POST", "/api/v1/auth/identities/link-authorize", "identity", "link_identity", "auth_identity", "permission:identity:link:self", "identity:link:self", "self", "self_permission"),
    ApiActionContract("identity.link.list", "GET", "/api/v1/auth/identities", "identity", "read_identities", "auth_identity", "permission:identity:read:self", "identity:read:self", "self", "self_permission_and_owner_filter"),
    ApiActionContract("identity.link.unlink", "DELETE", "/api/v1/auth/identities/{identity_id}", "identity", "unlink_identity", "auth_identity", "permission:identity:unlink:self", "identity:unlink:self", "self", "self_permission_and_owner_filter"),
    ApiActionContract("platform.users.list", "GET", "/api/v1/admin/users", "platform_security", "list_users", "account", "platform_permission:account:read", "account:read", "platform", "platform_permission"),
    ApiActionContract("platform.roles.list", "GET", "/api/v1/admin/roles", "platform_security", "list_roles", "role", "platform_permission:role:read", "role:read", "platform", "platform_permission"),
    ApiActionContract("platform.users.status", "PATCH", "/api/v1/admin/users/{user_id}/account-status", "platform_security", "change_account_status", "account", "platform_permission:account:status:manage_and_session_revocation", "account:status:manage", "platform", "platform_permission_and_session_revocation"),
    ApiActionContract("platform.audit.read", "GET", "/api/v1/admin/audit", "audit", "read_platform_audit", "admin_audit_log", "platform_permission:audit:read_and_platform_scope", "audit:read", "platform", "platform_permission_and_platform_scope"),
    ApiActionContract("organization.list.self", "GET", "/api/v1/organizations", "organization", "list_my_organizations", "organization_membership", "verified_identity_and_membership_owner_filter", None, "self", "verified_identity_and_membership_owner_filter"),
    ApiActionContract("organization.create", "POST", "/api/v1/organizations", "organization", "create", "organization", "platform_permission:organization:create", "organization:create", "platform", "platform_permission"),
    ApiActionContract("organization.members.read", "GET", "/api/v1/organizations/{organization_id}/members", "organization", "read_members", "organization_membership", "tenant_permission:organization:members:read_and_tenant_match", "organization:members:read", "tenant", "tenant_permission_and_resource_tenant_match"),
    ApiActionContract("organization.members.invite", "POST", "/api/v1/organizations/{organization_id}/members", "organization", "invite_member", "organization_membership", "tenant_permission:organization:members:manage_and_tenant_match", "organization:members:manage", "tenant", "tenant_permission_and_resource_tenant_match"),
    ApiActionContract("organization.members.update", "PATCH", "/api/v1/organizations/{organization_id}/members/{user_id}", "organization", "change_membership", "organization_membership", "tenant_permission:organization:members:manage_hierarchy_and_tenant_match", "organization:members:manage", "tenant", "tenant_permission_hierarchy_and_resource_tenant_match"),
    ApiActionContract("organization.roles.assign", "POST", "/api/v1/organizations/{organization_id}/members/{user_id}/roles", "organization", "assign_role", "user_role_assignment", "tenant_permission:role:assign_hierarchy_and_tenant_match", "role:assign", "tenant", "tenant_permission_hierarchy_and_resource_tenant_match"),
    ApiActionContract("organization.roles.assignable", "GET", "/api/v1/organizations/{organization_id}/assignable-roles", "organization", "read_assignable_roles", "role", "tenant_permission:organization:invitations:manage_and_delegation_hierarchy", "organization:invitations:manage", "tenant", "tenant_permission_and_delegation_hierarchy"),
    ApiActionContract("organization.invitations.read", "GET", "/api/v1/organizations/{organization_id}/invitations", "organization", "read_invitations", "organization_invitation", "tenant_permission:organization:invitations:manage_and_tenant_match", "organization:invitations:manage", "tenant", "tenant_permission_and_resource_tenant_match"),
    ApiActionContract("organization.invitations.create", "POST", "/api/v1/organizations/{organization_id}/invitations", "organization", "create_invitation", "organization_invitation", "tenant_permission:organization:invitations:manage_and_delegation_hierarchy", "organization:invitations:manage", "tenant", "tenant_permission_and_delegation_hierarchy"),
    ApiActionContract("organization.invitations.accept", "POST", "/api/v1/organizations/invitations/accept", "organization", "accept_invitation", "organization_invitation", "verified_identity_and_single_use_token", None, "self", "verified_identity_and_single_use_token"),
    ApiActionContract("organization.invitations.reject", "POST", "/api/v1/organizations/invitations/reject", "organization", "reject_invitation", "organization_invitation", "verified_identity_and_single_use_token", None, "self", "verified_identity_and_single_use_token"),
    ApiActionContract("organization.invitations.revoke", "POST", "/api/v1/organizations/{organization_id}/invitations/{invitation_id}/revoke", "organization", "revoke_invitation", "organization_invitation", "tenant_permission:organization:invitations:manage_and_tenant_match", "organization:invitations:manage", "tenant", "tenant_permission_and_resource_tenant_match"),
    ApiActionContract("organization.invitations.resend", "POST", "/api/v1/organizations/{organization_id}/invitations/{invitation_id}/resend", "organization", "resend_invitation", "organization_invitation", "tenant_permission:organization:invitations:manage_and_delegation_hierarchy", "organization:invitations:manage", "tenant", "tenant_permission_and_delegation_hierarchy"),
    ApiActionContract("audit.organization.read", "GET", "/api/v1/organizations/{organization_id}/audit", "audit", "read_audit", "admin_audit_log", "tenant_permission:audit:read_and_tenant_match", "audit:read", "tenant", "tenant_permission_and_resource_tenant_match"),
    ApiActionContract("security.refresh.authorize", "POST", "/api/v1/security/refresh-authorize", "security", "authorize_refresh", "bff_refresh_gate", "bff_shared_secret_and_live_device_session", None, "bff", "shared_secret_and_live_device_session"),
    ApiActionContract("security.auth.rate_limit", "POST", "/api/v1/security/rate-limit", "security", "consume_external_rate_limit", "bff_rate_limit", "bff_shared_secret_and_database_rate_limit", None, "bff", "shared_secret_and_database_rate_limit"),
)


def validate_api_action_matrix(routes: Iterable[object]) -> None:
    """Fail startup when a route is unmapped, stale, or wired to the wrong action ID."""
    registered: set[tuple[str, str]] = set()
    route_by_key: dict[tuple[str, str], APIRoute] = {}
    for route in routes:
        if not isinstance(route, APIRoute) or not route.path.startswith("/api/v1/"):
            continue
        for method in route.methods or set():
            if method not in {"HEAD", "OPTIONS"}:
                key = (method, route.path)
                registered.add(key)
                route_by_key[key] = route

    declared = {(entry.method, entry.path) for entry in API_ACTION_MATRIX}
    missing = sorted(registered - declared)
    stale = sorted(declared - registered)
    if missing or stale:
        raise RuntimeError(
            "FastAPI action matrix drift detected; "
            f"unmapped_routes={missing}; stale_contracts={stale}"
        )

    contracts = {(entry.method, entry.path): entry for entry in API_ACTION_MATRIX}

    def dependency_action_ids(dependant: object) -> set[str]:
        found: set[str] = set()
        for child in getattr(dependant, "dependencies", ()):
            action_id = getattr(getattr(child, "call", None), "__api_action_id__", None)
            if action_id:
                found.add(action_id)
            found.update(dependency_action_ids(child))
        return found

    wiring_errors: list[str] = []
    for key, route in route_by_key.items():
        contract = contracts[key]
        if contract.scope == "bff":
            actual = getattr(route.endpoint, "__api_action_id__", None)
            if actual != contract.id:
                wiring_errors.append(f"{key} expected explicit BFF marker {contract.id}, got {actual}")
            continue
        actual_ids = dependency_action_ids(route.dependant)
        if actual_ids != {contract.id}:
            wiring_errors.append(f"{key} expected dependency action {contract.id}, got {sorted(actual_ids)}")
    if wiring_errors:
        raise RuntimeError("FastAPI action dependency wiring drift detected; " + "; ".join(wiring_errors))
