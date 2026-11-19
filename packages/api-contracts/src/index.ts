type UUID=string;
type ISODateTime=string;
export interface AuthContext { user: {id:UUID;email:string|null;display_name:string|null;status:string}; session_id:UUID; memberships:Array<{id:UUID;organization_id:UUID;organization_name:string;status:string;branch_id:UUID|null;roles:string[];permissions:string[]}>; }
export interface OrganizationCreateRequest {name:string;slug:string;legal_name?:string|null;}
export interface OrganizationSummary {id:UUID;slug:string;name:string;status:"active"|"suspended"|"archived";created_at:ISODateTime;}
export interface SessionDeviceRegistration {device_id?:string|null;device_name?:string|null;platform:"web"|"android"|"ios"|"unknown";user_agent?:string|null;}
export type AuthContextResponse=AuthContext;
