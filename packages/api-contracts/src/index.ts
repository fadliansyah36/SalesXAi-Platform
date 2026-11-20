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
export interface LinkedIdentity {
  id:UUID;provider:string;email:string|null;is_primary:boolean;created_at:ISODateTime;
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
export interface AccountStatusUpdateResponse {
  user_id:UUID;status:AccountStatus;session_revoked_at:ISODateTime|null;
  supabase_auth_ban_applied:boolean;api_session_epoch_enforced:boolean;
}
export interface ApiErrorEnvelope {
  error:{code:string;message:string;correlation_id:string|null};
}

export interface PlatformRole {
  id:UUID;
  key:string;
  name:string;
  scope_type:"platform"|"tenant"|"branch";
  hierarchy_level:number;
  permissions:string[];
  assigned_users:number;
}

export interface PlatformUserSummary {
  id:UUID;
  name:string;
  email:string;
  tenant_id:string;
  tenant_name:string;
  role:string;
  status:AccountStatus;
  mfa_enabled:boolean;
  last_active:ISODateTime|null;
}


export interface PlatformAuditLog {
  id:UUID;
  actor_user_id:UUID|null;
  actor_label:string;
  organization_id:UUID|null;
  action:string;
  resource_type:string;
  resource_id:string|null;
  correlation_id:string|null;
  occurred_at:ISODateTime;
  metadata:Record<string,unknown>;
}


export interface MasterDataWrite {
  code?: string;
  branch_type?: "head_office" | "branch" | "warehouse";
  name?: string;
  status?: "active" | "inactive" | "archived" | "suspended";
  branch_id?: UUID | null;
  parent_team_id?: UUID | null;
  parent_territory_id?: UUID | null;
  supervisor_user_id?: UUID | null;
  territory_id?: UUID | null;
  category?: string | null;
  address?: string | null;
  city?: string | null;
  manager_name?: string | null;
  province?: string | null;
  postal_code?: string | null;
  phone?: string | null;
  pic_name?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  boundary_geojson?: Record<string, unknown> | null;
  user_id?: UUID;
  employee_code?: string | null;
  team_id?: UUID | null;
  manager_user_id?: UUID | null;
  effective_from?: string;
  effective_until?: string | null;
}
export interface MasterDataRecord {
  id: UUID;
  organization_id: UUID;
  created_at: ISODateTime;
  updated_at: ISODateTime;
  [field: string]: unknown;
}
export interface OutletAssignmentCreate { sales_profile_id: UUID; note?: string | null; }
export interface OutletAssignmentUnassignRequest { reason?: string | null; }
export interface MasterDataImportRequest { idempotency_key: string; rows: Array<Record<string, unknown>>; }
export interface MasterDataImportRowError { row: number; code: string; message: string; }
export interface MasterDataImportResult {
  batch_id: UUID; resource: string; total_rows: number; imported_rows: number; failed_rows: number;
  errors: MasterDataImportRowError[];
}
export interface SalesAssignmentContext {
  sales_profile: (MasterDataRecord & Record<string, unknown>) | null;
  assignments: Array<Record<string, unknown>>;
}
export type MasterDataResource = 'branches' | 'teams' | 'territories' | 'outlets' | 'sales_profiles' | 'outlet_assignment_history';
export interface MasterDataChangedEvent {
  organization_id: UUID;
  resource: MasterDataResource;
  record_id: UUID;
  operation: 'INSERT' | 'UPDATE' | 'DELETE';
  status: string | null;
  occurred_at: ISODateTime;
}
export interface OutletAssignmentRecord {
  id: UUID;
  organization_id: UUID;
  outlet_id: UUID;
  sales_profile_id: UUID;
  assigned_by: UUID;
  assigned_at: ISODateTime;
  unassigned_at: ISODateTime | null;
  unassigned_by?: UUID | null;
  assignment_status: 'active' | 'unassigned';
  change_reason?: string | null;
  note: string | null;
  previous_assignment_id?: UUID | null;
  previous_sales_profile_id?: UUID | null;
  previous_team_id?: UUID | null;
  previous_supervisor_user_id?: UUID | null;
  previous_territory_id?: UUID | null;
  assigned_team_id?: UUID | null;
  assigned_supervisor_user_id?: UUID | null;
  assigned_territory_id?: UUID | null;
  outlet_code?: string;
  outlet_name?: string;
  sales_user_id?: UUID;
  employee_code?: string | null;
  team_name?: string | null;
  supervisor_name?: string | null;
  territory_name?: string | null;
}

export interface PlatformOrganization {
  id: UUID;
  slug: string;
  name: string;
  legal_name: string | null;
  status: OrganizationStatus;
  created_at: ISODateTime;
  branch_count: number;
  member_count: number;
  outlet_count: number;
}
export interface PlatformOrganizationStatusUpdate { status: OrganizationStatus; }
