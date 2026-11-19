export type UUID=string;
export type ISODateTime=string;
export type AccountStatus="active"|"pending"|"suspended"|"deactivated";
export type MembershipStatus="invited"|"active"|"suspended"|"removed";
export type OrganizationStatus="active"|"suspended"|"archived";
export type InvitationStatus="pending"|"accepted"|"rejected"|"revoked"|"expired";
export type InvitationDeliveryStatus="smtp_email_sent"|"supabase_auth_verification_sent"|"supabase_auth_invite_sent";
export type ApiPlatform="web"|"android"|"ios"|"unknown";
export type SignOutScope="local"|"global"|"others";

export interface AuthContext {
  user:{id:UUID;email:string|null;display_name:string|null;status:AccountStatus};
  session_id:UUID;
  platform_permissions:string[];
  memberships:Array<{
    id:UUID;organization_id:UUID;organization_name:string;status:MembershipStatus;
    branch_id:UUID|null;roles:string[];permissions:string[];
  }>;
}
export type AuthContextResponse=AuthContext;

export interface OrganizationCreateRequest {name:string;slug:string;legal_name?:string|null;}
export interface OrganizationSummary {
  id:UUID;slug:string;name:string;status:OrganizationStatus;created_at:ISODateTime;
}
export interface MyOrganizationSummary {
  id:UUID;slug:string;name:string;status:OrganizationStatus;
  membership_id:UUID;membership_status:MembershipStatus;
}
export interface SessionDeviceRegistration {
  device_id?:string|null;device_name?:string|null;platform:ApiPlatform;user_agent?:string|null;
}
export interface SessionDeviceSummary {
  auth_session_id:UUID;device_id:string|null;device_name:string|null;platform:ApiPlatform;
  last_seen_at:ISODateTime|null;expires_at:ISODateTime|null;revoked_at:ISODateTime|null;
  created_at:ISODateTime;current:boolean;
}
export interface SignOutRequest {scope?:SignOutScope;}

export interface InvitationCreateRequest {
  email:string;role_key:string;branch_id?:UUID|null;title?:string|null;
}
export interface InvitationTokenRequest {token:string;}
export interface InvitationRecord {
  id:UUID;email:string;title:string|null;branch_id:UUID|null;role_key:string;
  status:InvitationStatus;expires_at:ISODateTime;accepted_at?:ISODateTime|null;
  rejected_at?:ISODateTime|null;revoked_at?:ISODateTime|null;resent_at?:ISODateTime|null;
  resend_count?:number;created_at:ISODateTime;
}
export interface InvitationDeliveryResult {
  id:UUID;email:string;role_key:string;status?:InvitationStatus;branch_id?:UUID|null;
  expires_at:ISODateTime;created_at?:ISODateTime;invitation_url:string;
  delivery_status:InvitationDeliveryStatus;
}
export interface InvitationAcceptResponse {
  membership_id:UUID;organization_id:UUID;status:MembershipStatus;
}
export interface InvitationActionResponse {id:UUID;status:"rejected"|"revoked";}

export interface AssignableRole {
  key:string;name:string;scope_type:"tenant"|"branch";hierarchy_level:number;
}
export interface OrganizationMember {
  user_id:UUID;email:string|null;display_name:string|null;account_status:AccountStatus;
  membership_status:MembershipStatus;title:string|null;branch_id:UUID|null;joined_at:ISODateTime|null;
}
export interface MemberCreateRequest {user_id:UUID;title?:string|null;}
export interface MemberStatusUpdateRequest {status:"active"|"suspended"|"removed";}
export interface MemberStatusResponse {id:UUID;user_id:UUID;organization_id:UUID;status:MembershipStatus;}
export interface RoleAssignmentRequest {role_key:string;branch_id?:UUID|null;}
export interface RoleAssignmentResponse {
  id:UUID;user_id:UUID;membership_id:UUID;role_id:UUID;
  scope_type:"tenant"|"branch";scope_id:UUID;created_at:ISODateTime;
}
export interface AccountStatusUpdateRequest {status:"active"|"suspended"|"deactivated";}
export interface ApiErrorEnvelope {
  error:{code:string;message:string;correlation_id:string|null};
}
