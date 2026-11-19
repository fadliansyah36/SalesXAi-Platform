export type ApiActionScope = "self" | "tenant" | "platform" | "bff";
export interface ApiActionContract {
  id: string;
  method: "GET" | "POST" | "PATCH" | "PUT" | "DELETE";
  path: string;
  feature: string;
  action: string;
  resource: string;
  rolePolicy: string;
  permission: string | null;
  scope: ApiActionScope;
  serverEnforcement: string;
}

/** Mirrors the FastAPI registry. This is a UI hint; the server remains authoritative. */
export const API_ACTION_MATRIX: readonly ApiActionContract[] = [
  {id:"identity.context.read",method:"GET",path:"/api/v1/auth/me",feature:"identity",action:"read_context",resource:"profile",rolePolicy:"verified_identity_and_session_owner",permission:null,scope:"self",serverEnforcement:"verified_session"},
  {id:"identity.session.register",method:"POST",path:"/api/v1/auth/sessions/current",feature:"identity",action:"register_session",resource:"auth_session",rolePolicy:"verified_identity_and_session_registry",permission:null,scope:"self",serverEnforcement:"verified_session_and_session_registry"},
  {id:"identity.session.list",method:"GET",path:"/api/v1/auth/sessions",feature:"identity",action:"list_sessions",resource:"auth_session",rolePolicy:"permission:profile:read:self",permission:"profile:read:self",scope:"self",serverEnforcement:"self_permission_and_owner_filter"},
  {id:"identity.session.revoke",method:"DELETE",path:"/api/v1/auth/sessions/{session_id}",feature:"identity",action:"revoke_session",resource:"auth_session",rolePolicy:"permission:profile:update:self",permission:"profile:update:self",scope:"self",serverEnforcement:"self_permission_and_owner_filter"},
  {id:"identity.session.signout",method:"POST",path:"/api/v1/auth/sign-out",feature:"identity",action:"sign_out",resource:"auth_session",rolePolicy:"verified_identity_and_provider_signout",permission:null,scope:"self",serverEnforcement:"verified_session_and_provider_signout"},
  {id:"identity.link.authorize",method:"POST",path:"/api/v1/auth/identities/link-authorize",feature:"identity",action:"link_identity",resource:"auth_identity",rolePolicy:"permission:identity:link:self",permission:"identity:link:self",scope:"self",serverEnforcement:"self_permission"},
  {id:"identity.link.list",method:"GET",path:"/api/v1/auth/identities",feature:"identity",action:"read_identities",resource:"auth_identity",rolePolicy:"permission:identity:read:self",permission:"identity:read:self",scope:"self",serverEnforcement:"self_permission_and_owner_filter"},
  {id:"identity.link.unlink",method:"DELETE",path:"/api/v1/auth/identities/{identity_id}",feature:"identity",action:"unlink_identity",resource:"auth_identity",rolePolicy:"permission:identity:unlink:self",permission:"identity:unlink:self",scope:"self",serverEnforcement:"self_permission_and_owner_filter"},
  {id:"platform.users.list",method:"GET",path:"/api/v1/admin/users",feature:"platform_security",action:"list_users",resource:"account",rolePolicy:"platform_permission:account:status:manage",permission:"account:status:manage",scope:"platform",serverEnforcement:"platform_permission"},
  {id:"platform.roles.list",method:"GET",path:"/api/v1/admin/roles",feature:"platform_security",action:"list_roles",resource:"role",rolePolicy:"platform_permission:role:assign",permission:"role:assign",scope:"platform",serverEnforcement:"platform_permission"},
  {id:"platform.users.status",method:"PATCH",path:"/api/v1/admin/users/{user_id}/account-status",feature:"platform_security",action:"change_account_status",resource:"account",rolePolicy:"platform_permission:account:status:manage_and_session_revocation",permission:"account:status:manage",scope:"platform",serverEnforcement:"platform_permission_and_session_revocation"},
  {id:"organization.list.self",method:"GET",path:"/api/v1/organizations",feature:"organization",action:"list_my_organizations",resource:"organization_membership",rolePolicy:"verified_identity_and_membership_owner_filter",permission:null,scope:"self",serverEnforcement:"verified_identity_and_membership_owner_filter"},
  {id:"organization.create",method:"POST",path:"/api/v1/organizations",feature:"organization",action:"create",resource:"organization",rolePolicy:"platform_permission:organization:create",permission:"organization:create",scope:"platform",serverEnforcement:"platform_permission"},
  {id:"organization.members.read",method:"GET",path:"/api/v1/organizations/{organization_id}/members",feature:"organization",action:"read_members",resource:"organization_membership",rolePolicy:"tenant_permission:organization:members:read_and_tenant_match",permission:"organization:members:read",scope:"tenant",serverEnforcement:"tenant_permission_and_resource_tenant_match"},
  {id:"organization.members.invite",method:"POST",path:"/api/v1/organizations/{organization_id}/members",feature:"organization",action:"invite_member",resource:"organization_membership",rolePolicy:"tenant_permission:organization:members:manage_and_tenant_match",permission:"organization:members:manage",scope:"tenant",serverEnforcement:"tenant_permission_and_resource_tenant_match"},
  {id:"organization.members.update",method:"PATCH",path:"/api/v1/organizations/{organization_id}/members/{user_id}",feature:"organization",action:"change_membership",resource:"organization_membership",rolePolicy:"tenant_permission:organization:members:manage_hierarchy_and_tenant_match",permission:"organization:members:manage",scope:"tenant",serverEnforcement:"tenant_permission_hierarchy_and_resource_tenant_match"},
  {id:"organization.roles.assign",method:"POST",path:"/api/v1/organizations/{organization_id}/members/{user_id}/roles",feature:"organization",action:"assign_role",resource:"user_role_assignment",rolePolicy:"tenant_permission:role:assign_hierarchy_and_tenant_match",permission:"role:assign",scope:"tenant",serverEnforcement:"tenant_permission_hierarchy_and_resource_tenant_match"},
  {id:"organization.roles.assignable",method:"GET",path:"/api/v1/organizations/{organization_id}/assignable-roles",feature:"organization",action:"read_assignable_roles",resource:"role",rolePolicy:"tenant_permission:organization:invitations:manage_and_delegation_hierarchy",permission:"organization:invitations:manage",scope:"tenant",serverEnforcement:"tenant_permission_and_delegation_hierarchy"},
  {id:"organization.invitations.read",method:"GET",path:"/api/v1/organizations/{organization_id}/invitations",feature:"organization",action:"read_invitations",resource:"organization_invitation",rolePolicy:"tenant_permission:organization:invitations:manage_and_tenant_match",permission:"organization:invitations:manage",scope:"tenant",serverEnforcement:"tenant_permission_and_resource_tenant_match"},
  {id:"organization.invitations.create",method:"POST",path:"/api/v1/organizations/{organization_id}/invitations",feature:"organization",action:"create_invitation",resource:"organization_invitation",rolePolicy:"tenant_permission:organization:invitations:manage_and_delegation_hierarchy",permission:"organization:invitations:manage",scope:"tenant",serverEnforcement:"tenant_permission_and_delegation_hierarchy"},
  {id:"organization.invitations.accept",method:"POST",path:"/api/v1/organizations/invitations/accept",feature:"organization",action:"accept_invitation",resource:"organization_invitation",rolePolicy:"verified_identity_and_single_use_token",permission:null,scope:"self",serverEnforcement:"verified_identity_and_single_use_token"},
  {id:"organization.invitations.reject",method:"POST",path:"/api/v1/organizations/invitations/reject",feature:"organization",action:"reject_invitation",resource:"organization_invitation",rolePolicy:"verified_identity_and_single_use_token",permission:null,scope:"self",serverEnforcement:"verified_identity_and_single_use_token"},
  {id:"organization.invitations.revoke",method:"POST",path:"/api/v1/organizations/{organization_id}/invitations/{invitation_id}/revoke",feature:"organization",action:"revoke_invitation",resource:"organization_invitation",rolePolicy:"tenant_permission:organization:invitations:manage_and_tenant_match",permission:"organization:invitations:manage",scope:"tenant",serverEnforcement:"tenant_permission_and_resource_tenant_match"},
  {id:"organization.invitations.resend",method:"POST",path:"/api/v1/organizations/{organization_id}/invitations/{invitation_id}/resend",feature:"organization",action:"resend_invitation",resource:"organization_invitation",rolePolicy:"tenant_permission:organization:invitations:manage_and_delegation_hierarchy",permission:"organization:invitations:manage",scope:"tenant",serverEnforcement:"tenant_permission_and_delegation_hierarchy"},
  {id:"audit.organization.read",method:"GET",path:"/api/v1/organizations/{organization_id}/audit",feature:"audit",action:"read_audit",resource:"admin_audit_log",rolePolicy:"tenant_permission:audit:read_and_tenant_match",permission:"audit:read",scope:"tenant",serverEnforcement:"tenant_permission_and_resource_tenant_match"},
  {id:"security.refresh.authorize",method:"POST",path:"/api/v1/security/refresh-authorize",feature:"security",action:"authorize_refresh",resource:"bff_refresh_gate",rolePolicy:"bff_shared_secret_and_live_device_session",permission:null,scope:"bff",serverEnforcement:"shared_secret_and_live_device_session"},
  {id:"security.auth.rate_limit",method:"POST",path:"/api/v1/security/rate-limit",feature:"security",action:"consume_external_rate_limit",resource:"bff_rate_limit",rolePolicy:"bff_shared_secret_and_database_rate_limit",permission:null,scope:"bff",serverEnforcement:"shared_secret_and_database_rate_limit"},
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
  if (!action || !authenticated || action.scope === "bff") return false;
  return action.permission === null || Boolean(permissions?.includes(action.permission));
}
