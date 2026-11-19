export type UUID=string;
export type ISODateTime=string;
export type AccountStatus="active"|"pending"|"suspended"|"deactivated";
export type MembershipStatus="invited"|"active"|"suspended"|"removed";
export type OrganizationStatus="active"|"suspended"|"archived";
export type PortalKey="sales"|"company"|"customer"|"distributor"|"principal"|"supervisor"|"super_admin";
export interface IdentityProfile { id:UUID; email:string|null; display_name:string|null; status:AccountStatus; }
export interface OrganizationMembership {
 id:UUID; organization_id:UUID; organization_name:string; status:MembershipStatus;
 branch_id:UUID|null; roles:string[]; permissions:string[];
}
export interface AuthContext { user:IdentityProfile; session_id:UUID; memberships:OrganizationMembership[]; platform_permissions:string[]; }
export interface ApiErrorEnvelope { error:{code:string;message:string;correlation_id:string|null}; }
