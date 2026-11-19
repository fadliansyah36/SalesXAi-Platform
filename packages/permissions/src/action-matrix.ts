export type ApiActionScope = "self" | "tenant" | "platform" | "bff";
export interface ApiActionContract {
  id: string;
  method: "GET" | "POST" | "PATCH" | "PUT" | "DELETE";
  path: string;
  feature: string;
  action: string;
  permission: string | null;
  scope: ApiActionScope;
  serverEnforcement: string;
}

/** Mirrors the FastAPI registry. This is a UI hint; the server remains authoritative. */
export const API_ACTION_MATRIX: readonly ApiActionContract[] = [
  {id:"identity.context.read",method:"GET",path:"/api/v1/auth/me",feature:"identity",action:"read_context",permission:null,scope:"self",serverEnforcement:"verified_session"},
  {id:"identity.session.register",method:"POST",path:"/api/v1/auth/sessions/current",feature:"identity",action:"register_session",permission:null,scope:"self",serverEnforcement:"verified_session_and_session_registry"},
  {id:"identity.session.list",method:"GET",path:"/api/v1/auth/sessions",feature:"identity",action:"list_sessions",permission:"profile:read:self",scope:"self",serverEnforcement:"self_permission_and_owner_filter"},
  {id:"identity.session.revoke",method:"DELETE",path:"/api/v1/auth/sessions/{session_id}",feature:"identity",action:"revoke_session",permission:"profile:update:self",scope:"self",serverEnforcement:"self_permission_and_owner_filter"},
  {id:"identity.session.signout",method:"POST",path:"/api/v1/auth/sign-out",feature:"identity",action:"sign_out",permission:null,scope:"self",serverEnforcement:"verified_session_and_provider_signout"},
  {id:"identity.link.authorize",method:"POST",path:"/api/v1/auth/identities/link-authorize",feature:"identity",action:"link_identity",permission:"identity:link:self",scope:"self",serverEnforcement:"self_permission"},
  {id:"identity.link.list",method:"GET",path:"/api/v1/auth/identities",feature:"identity",action:"read_identities",permission:"identity:read:self",scope:"self",serverEnforcement:"self_permission_and_owner_filter"},
  {id:"identity.link.unlink",method:"DELETE",path:"/api/v1/auth/identities/{identity_id}",feature:"identity",action:"unlink_identity",permission:"identity:unlink:self",scope:"self",serverEnforcement:"self_permission_and_owner_filter"},
  {id:"platform.users.list",method:"GET",path:"/api/v1/admin/users",feature:"platform_security",action:"list_users",permission:"account:status:manage",scope:"platform",serverEnforcement:"platform_permission"},
  {id:"platform.roles.list",method:"GET",path:"/api/v1/admin/roles",feature:"platform_security",action:"list_roles",permission:"role:assign",scope:"platform",serverEnforcement:"platform_permission"},
  {id:"platform.users.status",method:"PATCH",path:"/api/v1/admin/users/{user_id}/account-status",feature:"platform_security",action:"change_account_status",permission:"account:status:manage",scope:"platform",serverEnforcement:"platform_permission_and_session_revocation"},
  {id:"organization.list.self",method:"GET",path:"/api/v1/organizations",feature:"organization",action:"list_my_organizations",permission:null,scope:"self",serverEnforcement:"verified_identity_and_membership_owner_filter"},
  {id:"organization.create",method:"POST",path:"/api/v1/organizations",feature:"organization",action:"create",permission:"organization:create",scope:"platform",serverEnforcement:"platform_permission"},
  {id:"organization.members.read",method:"GET",path:"/api/v1/organizations/{organization_id}/members",feature:"organization",action:"read_members",permission:"organization:members:read",scope:"tenant",serverEnforcement:"tenant_permission_and_resource_tenant_match"},
  {id:"organization.members.invite",method:"POST",path:"/api/v1/organizations/{organization_id}/members",feature:"organization",action:"invite_member",permission:"organization:members:manage",scope:"tenant",serverEnforcement:"tenant_permission_and_resource_tenant_match"},
  {id:"organization.members.update",method:"PATCH",path:"/api/v1/organizations/{organization_id}/members/{user_id}",feature:"organization",action:"change_membership",permission:"organization:members:manage",scope:"tenant",serverEnforcement:"tenant_permission_hierarchy_and_resource_tenant_match"},
  {id:"organization.roles.assign",method:"POST",path:"/api/v1/organizations/{organization_id}/members/{user_id}/roles",feature:"organization",action:"assign_role",permission:"role:assign",scope:"tenant",serverEnforcement:"tenant_permission_hierarchy_and_resource_tenant_match"},
  {id:"organization.roles.assignable",method:"GET",path:"/api/v1/organizations/{organization_id}/assignable-roles",feature:"organization",action:"read_assignable_roles",permission:"organization:invitations:manage",scope:"tenant",serverEnforcement:"tenant_permission_and_delegation_hierarchy"},
  {id:"organization.invitations.read",method:"GET",path:"/api/v1/organizations/{organization_id}/invitations",feature:"organization",action:"read_invitations",permission:"organization:invitations:manage",scope:"tenant",serverEnforcement:"tenant_permission_and_resource_tenant_match"},
  {id:"organization.invitations.create",method:"POST",path:"/api/v1/organizations/{organization_id}/invitations",feature:"organization",action:"create_invitation",permission:"organization:invitations:manage",scope:"tenant",serverEnforcement:"tenant_permission_and_delegation_hierarchy"},
  {id:"organization.invitations.accept",method:"POST",path:"/api/v1/organizations/invitations/accept",feature:"organization",action:"accept_invitation",permission:null,scope:"self",serverEnforcement:"verified_identity_and_single_use_token"},
  {id:"organization.invitations.reject",method:"POST",path:"/api/v1/organizations/invitations/reject",feature:"organization",action:"reject_invitation",permission:null,scope:"self",serverEnforcement:"verified_identity_and_single_use_token"},
  {id:"organization.invitations.revoke",method:"POST",path:"/api/v1/organizations/{organization_id}/invitations/{invitation_id}/revoke",feature:"organization",action:"revoke_invitation",permission:"organization:invitations:manage",scope:"tenant",serverEnforcement:"tenant_permission_and_resource_tenant_match"},
  {id:"organization.invitations.resend",method:"POST",path:"/api/v1/organizations/{organization_id}/invitations/{invitation_id}/resend",feature:"organization",action:"resend_invitation",permission:"organization:invitations:manage",scope:"tenant",serverEnforcement:"tenant_permission_and_delegation_hierarchy"},
  {id:"audit.organization.read",method:"GET",path:"/api/v1/organizations/{organization_id}/audit",feature:"audit",action:"read_audit",permission:"audit:read",scope:"tenant",serverEnforcement:"tenant_permission_and_resource_tenant_match"},
  {id:"security.refresh.authorize",method:"POST",path:"/api/v1/security/refresh-authorize",feature:"security",action:"authorize_refresh",permission:null,scope:"bff",serverEnforcement:"shared_secret_and_live_device_session"},
  {id:"security.auth.rate_limit",method:"POST",path:"/api/v1/security/rate-limit",feature:"security",action:"consume_external_rate_limit",permission:null,scope:"bff",serverEnforcement:"shared_secret_and_database_rate_limit"},
] as const;

export type ApiActionId = (typeof API_ACTION_MATRIX)[number]["id"];

export function getApiAction(id: ApiActionId): ApiActionContract | undefined {
  return API_ACTION_MATRIX.find((item) => item.id === id);
}

/** Client-side visibility hint only. Resource ownership and scope are rechecked by FastAPI. */
export function canPerformApiAction(
  id: ApiActionId,
  permissions: readonly string[] | null | undefined,
  authenticated: boolean,
): boolean {
  const action = getApiAction(id);
  if (!action || !authenticated) return false;
  return action.permission === null || Boolean(permissions?.includes(action.permission));
}
