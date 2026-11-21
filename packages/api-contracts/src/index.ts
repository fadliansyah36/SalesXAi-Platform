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

export interface SmartTeamLocationCapture { latitude:number; longitude:number; accuracy_m:number; source:"gps"|"network"|"fused"|"manual"; captured_at?:ISODateTime|null; }
export interface SmartTeamVisit {
 id:UUID; organization_id:UUID; sales_profile_id:UUID; outlet_id:UUID; scheduled_at:ISODateTime;
 window_end_at:ISODateTime|null; status:"scheduled"|"assigned"|"in_progress"|"completed"|"cancelled"|"missed";
 outcome:"productive"|"not_productive"|"order_taken"|"follow_up"|"closed"|"no_contact"|null;
 notes:string|null; check_in_at:ISODateTime|null; check_out_at:ISODateTime|null;
 check_in_latitude:number|null; check_in_longitude:number|null; check_in_accuracy_m:number|null; check_in_source:string|null;
 check_out_latitude:number|null; check_out_longitude:number|null; check_out_accuracy_m:number|null; check_out_source:string|null;
 outlet_code?:string; outlet_name?:string; sales_user_id?:UUID;
}
export interface SmartTeamAttendance {
 id:UUID; organization_id:UUID; sales_profile_id:UUID; user_id:UUID; shift_date:string;
 status:"scheduled"|"active"|"completed"|"cancelled"; attendance_status?:"absent"|"present"|"completed"|"cancelled"; scheduled_start:ISODateTime|null; scheduled_end:ISODateTime|null;
 clock_in_at:ISODateTime|null; clock_out_at:ISODateTime|null; clock_in_latitude:number|null; clock_in_longitude:number|null;
 clock_in_accuracy_m:number|null; clock_in_source:string|null; clock_out_latitude:number|null; clock_out_longitude:number|null;
 clock_out_accuracy_m:number|null; clock_out_source:string|null; correction_reason:string|null; corrected_at:ISODateTime|null;
 display_name?:string|null; employee_code?:string|null; team_name?:string|null;
 events?:Array<{id:UUID;event_type:"clocked_in"|"clocked_out"|"corrected";actor_user_id:UUID;actor_name?:string|null;occurred_at:ISODateTime;metadata:Record<string,unknown>}>;
}
export interface SmartTeamActivity {
 id:UUID; organization_id:UUID; sales_profile_id:UUID; visit_id:UUID|null; activity_type:"task"|"call"|"meeting"|"follow_up"|"prospecting"|"report"|"other";
 title:string; description:string|null; due_at:ISODateTime|null; completed_at:ISODateTime|null; status:"open"|"in_progress"|"completed"|"cancelled";
 created_at:ISODateTime; updated_at:ISODateTime;
}
export interface SmartTeamTarget {
 id:UUID; organization_id:UUID; sales_profile_id:UUID|null; team_id:UUID|null; branch_id:UUID|null;
 metric_key:"visits"|"productive_visits"|"activities"|"orders"|"sales_value"; period_start:string; period_end:string;
 target_value:string|number; actual_value:number|null; progress_percentage:number|null; employee_code?:string|null; team_name?:string|null; branch_name?:string|null;
}
export interface SmartTeamVisitCreate {
 sales_profile_id:UUID; outlet_id:UUID; scheduled_at:ISODateTime; window_end_at?:ISODateTime|null; notes?:string|null; idempotency_key:string;
}
export interface SmartTeamActivityCreate {
 sales_profile_id:UUID; visit_id?:UUID|null; activity_type:SmartTeamActivity["activity_type"]; title:string; description?:string|null; due_at?:ISODateTime|null; idempotency_key:string;
}
export interface SmartTeamTargetWrite {
 sales_profile_id?:UUID|null; team_id?:UUID|null; branch_id?:UUID|null; metric_key:SmartTeamTarget["metric_key"];
 period_start:string; period_end:string; target_value:number;
}

export interface SmartTeamDashboard {
 visits_total:number;visits_scheduled:number;visits_in_progress:number;visits_completed:number;
 attendance_records:number;active_shifts:number;activities_open:number;targets_visible:number;
}
export interface SmartTeamTargetUpdate {period_start?:string;period_end?:string;target_value?:number;}

export interface PlatformSmartTeamOverviewRow {
 organization_id:UUID;organization_name:string;organization_status:string;
 visits_total:number;visits_in_progress:number;visits_completed:number;
 attendance_30d:number;active_shifts:number;activities_30d:number;active_targets:number;
}

export interface SmartTeamVisitEvidence {
 id:UUID;organization_id:UUID;visit_id:UUID;uploaded_by:UUID;uploader_name?:string;
 storage_path:string;mime_type:"image/jpeg"|"image/png"|"application/pdf";size_bytes:number;sha256:string;
 created_at:ISODateTime;download_url?:string;
}

export interface SmartTeamVisitAssign { sales_profile_id:UUID; idempotency_key:string; }


export interface SmartOrderVariant {id:UUID;sku:string;name:string;barcode?:string|null;attributes:Record<string,unknown>;specifications?:Record<string,unknown>;weight_grams?:number|null;}
export interface SmartOrderProductImage {id:UUID;storage_path:string;mime_type:string;alt_text?:string|null;sort_order:number;signed_url?:string;}
export interface SmartOrderProduct {id:UUID;organization_id:UUID;product_code:string;name:string;description?:string|null;status:string;tax_rate:string|number;specifications?:Record<string,unknown>;category_id?:UUID|null;brand_id?:UUID|null;unit_id?:UUID|null;category_name?:string|null;brand_name?:string|null;variants:SmartOrderVariant[];images?:SmartOrderProductImage[];}
export interface SmartOrderProductPage {items:SmartOrderProduct[];page:number;page_size:number;total:number;}
export interface SmartOrderProductWrite {product_code:string;name:string;description?:string|null;category_id?:UUID|null;brand_id?:UUID|null;unit_id?:UUID|null;tax_rate?:number;specifications?:Record<string,unknown>;status?:"draft"|"published"|"inactive"|"archived";variants: Array<{sku:string;name:string;barcode?:string|null;attributes?:Record<string,unknown>;specifications?:Record<string,unknown>;weight_grams?:number|null}>;}
export interface SmartOrderPriceQuote {unit_price:string|number;currency:string;price_list_id:UUID;price_list_name:string;scope_type:string;tax_rate:string|number;sku:string;product_name:string;variant_name:string;}
export interface SmartOrderInventoryBalance {id:UUID;warehouse_id:UUID;warehouse_code:string;warehouse_name:string;product_id:UUID;variant_id:UUID;on_hand:string|number;reserved:string|number;committed:string|number;available:string|number;version:number;}
export interface SmartOrderStockMovementWrite {warehouse_id:UUID;product_id:UUID;variant_id:UUID;movement_type:"stock_in"|"stock_out"|"adjustment";quantity:number;adjustment_delta?:number;reason:string;idempotency_key:string;}
export interface SmartOrderPromotion {id:UUID;organization_id?:UUID;code:string;name:string;description?:string|null;priority:number;stackable:boolean;stacking_group?:string|null;max_redemptions?:number|null;max_per_customer?:number|null;status?:string;starts_at:string;ends_at:string;rules:Array<{rule_type:string;rule_config:Record<string,unknown>}>;}
export interface SmartOrderPromotionUpdate extends SmartOrderPromotionWrite {status:"active"|"inactive"|"archived";}
export interface SmartOrderPromotionWrite {code:string;name:string;description?:string|null;starts_at:string;ends_at:string;priority?:number;stackable?:boolean;stacking_group?:string|null;max_redemptions?:number|null;max_per_customer?:number|null;rules:Array<{rule_type:string;rule_config:Record<string,unknown>}>;}
export interface SmartOrderCart {cart:Record<string,unknown>;items:Array<Record<string,unknown>>;}
export interface SmartOrderCartItemWrite {product_id:UUID;variant_id:UUID;quantity:number;notes?:string|null;}
export interface SmartOrderOrderCreate {cart_id:UUID;idempotency_key:string;promotion_codes?:string[];shipping_snapshot?:Record<string,unknown>;notes?:string|null;}
export interface SmartOrderOrder {id:UUID;order_number:string;status:string;currency:string;subtotal:string|number;discount_total:string|number;tax_total:string|number;grand_total:string|number;items?:Array<Record<string,unknown>>;history?:Array<Record<string,unknown>>;approvals?:Array<Record<string,unknown>>;fulfillments?:Array<Record<string,unknown>>;}
export interface SmartOrderOrderPage {items:SmartOrderOrder[];page:number;page_size:number;total:number;}
export interface SmartOrderFulfillmentWrite {warehouse_id?:UUID|null;assigned_to?:UUID|null;}
export interface SmartOrderFulfillmentUpdate {status:"picking"|"packed"|"handed_over"|"failed"|"cancelled";carrier?:string|null;tracking_number?:string|null;}

export interface SmartOrderPriceListWrite {name:string;code:string;currency?:string;scope_type:"tenant"|"principal"|"distributor"|"company"|"customer"|"region"|"channel"|"contract";scope_id?:UUID|null;channel?:string|null;priority?:number;effective_from:string;effective_until?:string|null;status?:"draft"|"active"|"inactive"|"archived";prices:Array<{product_id:UUID;variant_id:UUID;unit_price:number;minimum_quantity?:number;maximum_quantity?:number|null}>;}
export interface SmartOrderPriceListLine {id?:UUID;product_id:UUID;variant_id:UUID;unit_price:string|number;minimum_quantity:string|number;maximum_quantity?:string|number|null;effective_from?:string;effective_until?:string|null;}
export interface SmartOrderPriceList {id:UUID;name:string;code:string;currency:string;scope_type:"tenant"|"principal"|"distributor"|"customer"|"region"|"channel"|"contract";scope_id?:UUID|null;channel?:string|null;priority:number;effective_from:string;effective_until?:string|null;status:string;prices:SmartOrderPriceListLine[];}
export interface SmartOrderWarehouse {id:UUID;code:string;name:string;branch_id?:UUID|null;address?:string|null;status:string;}
export interface SmartOrderWarehouseWrite {code:string;name:string;branch_id?:UUID|null;address?:string|null;}
export interface SmartOrderCategory {id:UUID;parent_id?:UUID|null;code:string;name:string;description?:string|null;sort_order:number;status:string;}
export interface SmartOrderCategoryWrite {code:string;name:string;parent_id?:UUID|null;description?:string|null;sort_order?:number;}
export interface SmartOrderBrandWrite {name:string;}
export interface SmartOrderUnitWrite {code:string;name:string;symbol?:string|null;decimal_places?:number;}
export interface SmartOrderCatalogAccessWrite {consumer_organization_id:UUID;product_id?:UUID|null;access_type:"catalog"|"pricing"|"inventory"|"ordering";starts_at:string;ends_at?:string|null;}
export interface SmartOrderStockTransferWrite {from_warehouse_id:UUID;to_warehouse_id:UUID;product_id:UUID;variant_id:UUID;quantity:number;reason:string;idempotency_key:string;}
export interface SmartOrderProductImageWrite {product_id:UUID;variant_id?:UUID|null;storage_path:string;mime_type:"image/jpeg"|"image/png"|"image/webp";size_bytes:number;alt_text?:string|null;sort_order?:number;}
export interface SmartOrderOrderCancel {reason:string;}

export interface SmartOrderPartnerDecision {id:UUID;decision:"accepted"|"rejected"|"revision_requested";reason?:string|null;actor_user_id:UUID;decided_at:string;}
export interface SmartOrderPartnerDecisionWrite {decision:"accepted"|"rejected"|"revision_requested";reason?:string|null;idempotency_key:string;}
export interface SmartOrderPartnerOrderSummary {id:UUID;buyer_organization_id:UUID;order_number:string;status:string;currency:string;partner_item_count:number;partner_item_total:string|number;partner_fulfillment_id?:UUID|null;partner_fulfillment_status?:string|null;partner_decision?:"accepted"|"rejected"|"revision_requested"|null;created_at:string;updated_at:string;}
export interface SmartOrderPartnerOrderPage {items:SmartOrderPartnerOrderSummary[];page:number;page_size:number;total:number;}
export interface SmartOrderPartnerOrder extends Omit<SmartOrderPartnerOrderSummary,"partner_item_count"|"partner_item_total"> {items:Array<Record<string,unknown>>;fulfillments:Array<Record<string,unknown>>;partner_decisions:SmartOrderPartnerDecision[];}
export interface SmartOrderPartnerOrganization {id:UUID;slug:string;name:string;relationship_type:"principal"|"distributor"|"company"|"customer";starts_at:string;ends_at?:string|null;}
export interface SmartOrderPartnerLinkWrite {partner_organization_id:UUID;relationship_type:"principal"|"distributor"|"company"|"customer";starts_at:string;ends_at?:string|null;}
export interface SmartOrderAssistedCartWrite {customer_organization_id:UUID;}

export interface SmartOrderPriceHistoryPage {items:Array<{id:UUID;entity_type:string;entity_id:UUID;action:string;before_snapshot?:Record<string,unknown>|null;after_snapshot?:Record<string,unknown>|null;actor_user_id?:UUID|null;occurred_at:string}>;page:number;page_size:number;total:number;}

export interface SmartOrderApprovalPolicy {id:UUID;name:string;minimum_total:number;maximum_total?:number|null;required_approval_count:number;required_roles:string[];auto_approve_below:boolean;status:"active"|"inactive";}
export interface SmartOrderApprovalPolicyWrite {name:string;minimum_total?:number;maximum_total?:number|null;required_approval_count?:number;required_roles?:string[];auto_approve_below?:boolean;status?:"active"|"inactive";}
export interface SmartOrderStockMovement {id:UUID;warehouse_id:UUID;warehouse_code:string;warehouse_name:string;product_id:UUID;product_name:string;variant_id:UUID;sku:string;movement_type:string;quantity:number|string;on_hand_delta:number|string;reserved_delta:number|string;committed_delta:number|string;reference_type?:string|null;reference_id?:UUID|null;reason:string;actor_user_id?:UUID|null;occurred_at:string;}
export interface SmartOrderStockMovementPage {items:SmartOrderStockMovement[];page:number;page_size:number;total:number;}
export interface SmartOrderBrand {id:UUID;name:string;status:string;}
export interface SmartOrderUnit {id:UUID;code:string;name:string;symbol?:string|null;decimal_places:number;status:string;}
export interface SmartOrderRealtimeEvent {event_id?:UUID;organization_id:UUID;resource:string;record_id:UUID;order_id?:UUID|null;operation:"INSERT"|"UPDATE"|"DELETE";status?:string|null;occurred_at:string;}

export type RewardProgramType="loyalty"|"incentive"|"campaign";
export interface RewardProgramWrite {
 code:string;name:string;description?:string|null;program_type:RewardProgramType;
 reward_type:"points"|"tier"|"voucher";starts_at:ISODateTime;ends_at:ISODateTime;
 status:"draft"|"active"|"paused"|"completed"|"archived";
 audience?:Record<string,unknown>;configuration?:Record<string,unknown>;customer_segment_id?:UUID|null;
}
export interface RewardRuleWrite {
 code:string;name:string;event_key:"order.completed"|"visit.completed"|"target.achieved"|"manual.approved";
 priority?:number;rule_config?:Record<string,unknown>;points_per_unit?:number;fixed_points?:number;
 max_points?:number|null;requires_approval?:boolean;status?:"active"|"inactive"|"archived";customer_segment_id?:UUID|null;
}
export interface RewardCatalogWrite {
 program_id?:UUID|null;code:string;name:string;description?:string|null;category:string;points_cost:number;
 quantity_total?:number|null;starts_at?:ISODateTime|null;ends_at?:ISODateTime|null;
 eligibility?:Record<string,unknown>;metadata?:Record<string,unknown>;customer_segment_id?:UUID|null;
 status?:"draft"|"active"|"paused"|"out_of_stock"|"archived";
}
export interface RewardEarnWrite {
 program_id:UUID;rule_id:UUID;participant_user_id:UUID;source_type:"order"|"visit"|"target"|"manual";
 source_id:UUID;idempotency_key:string;reason:string;metric_value?:number;
}
export interface RewardAdjustmentWrite {
 participant_user_id:UUID;points_delta:number;reference_type:string;reference_id:UUID;
 idempotency_key:string;reason:string;
}
export interface RewardReverseWrite {idempotency_key:string;reason:string;}
export interface RewardProgram {id:UUID;organization_id:UUID;code:string;name:string;description:string|null;program_type:RewardProgramType;reward_type:"points"|"tier"|"voucher";starts_at:ISODateTime;ends_at:ISODateTime;status:"draft"|"active"|"paused"|"completed"|"archived";audience:Record<string,unknown>;configuration:Record<string,unknown>;customer_segment_id?:UUID|null;created_at:ISODateTime;updated_at:ISODateTime;}
export interface RewardRule {id:UUID;organization_id:UUID;program_id:UUID;code:string;name:string;event_key:"order.completed"|"visit.completed"|"target.achieved"|"manual.approved";priority:number;rule_config:Record<string,unknown>;points_per_unit:string|number;fixed_points:number;max_points:number|null;requires_approval:boolean;status:"active"|"inactive"|"archived";customer_segment_id?:UUID|null;}
export interface RewardCatalogItem {id:UUID;organization_id:UUID;program_id:UUID|null;code:string;name:string;description:string|null;category:string;points_cost:number;quantity_total:number|null;quantity_reserved:number;quantity_fulfilled:number;eligibility:Record<string,unknown>;metadata:Record<string,unknown>;customer_segment_id?:UUID|null;eligible?:boolean;eligibility_reason?:string|null;available_stock?:number|null;points_balance?:number;period_remaining?:number|null;catalog_period_remaining?:number|null;status:"draft"|"active"|"paused"|"out_of_stock"|"archived";}
export interface RewardLedgerEntry {id:UUID;expires_at?:ISODateTime|null;entry_type:"earn"|"debit"|"redemption"|"reversal"|"adjustment"|"expiration";points_delta:number;balance_before:number;balance_after:number;source_type:string;source_id:UUID;reference_type:string|null;reference_id:UUID|null;actor_user_id:UUID;reason:string;occurred_at:ISODateTime;metadata:Record<string,unknown>;}
export interface RewardBalance {account_id:UUID;organization_id:UUID;participant_user_id:UUID;points_balance:number;next_expiration_at?:ISODateTime|null;expiring_points_30d?:number;}
export interface RewardRedemption {
 id:UUID;organization_id:UUID;account_id:UUID;catalog_item_id:UUID;participant_user_id:UUID;
 quantity:number;points_reserved:number;status:"requested"|"approved"|"rejected"|"cancelled"|"fulfilling"|"fulfilled";
 idempotency_key:string;requested_by:UUID;decided_by:UUID|null;fulfilled_by:UUID|null;
 fulfillment_reference:string|null;reason:string|null;requested_at:ISODateTime;decided_at:ISODateTime|null;
 fulfilled_at:ISODateTime|null;updated_at:ISODateTime;catalog_code?:string;catalog_name?:string;category?:string;
}
export interface RewardRedemptionDecision {decision:"approved"|"rejected";reason:string;}
export interface RewardFulfillmentWrite {fulfillment_reference:string;reason?:string|null;}
export interface RewardPage<T>{items:T[];page:number;page_size:number;total:number;}

export interface RewardApprovalRequest {
 id:UUID;organization_id:UUID;request_type:"manual_earning"|"rule_earning"|"redemption_override";
 participant_user_id:UUID;program_id:UUID|null;rule_id:UUID|null;source_type:string|null;source_id:UUID|null;
 points_requested:number;metric_value:string|number;requested_by:UUID;idempotency_key:string;
 status:"pending"|"approved"|"rejected"|"cancelled";request_reason:string;decision_reason:string|null;
 decided_by:UUID|null;decided_at:ISODateTime|null;ledger_entry_id:UUID|null;history?:RewardApprovalHistory[];created_at:ISODateTime;updated_at:ISODateTime;
}
export interface RewardApprovalWrite {
 request_type:"manual_earning"|"rule_earning";participant_user_id:UUID;program_id:UUID;rule_id:UUID;
 source_type?:"order"|"visit"|"target"|"manual";source_id?:UUID|null;manual_points?:number|null;
 metric_value?:number;idempotency_key:string;reason:string;
}
export interface RewardApprovalDecision {decision:"approved"|"rejected";reason:string;}

export interface SmartRewardRealtimeEvent {event_id?:string;organization_id:string;resource:string;record_id:string;operation:string;status?:string|null;occurred_at:string;}

export interface RewardApprovalHistory {id:UUID;from_status:string|null;to_status:string;actor_user_id:UUID;reason:string;occurred_at:ISODateTime;}

export interface PlatformSmartRewardOverviewRow {organization_id:UUID;organization_name:string;earned_points:number;redeemed_points:number;outstanding_points:number;expired_points:number;adjusted_points:number;reversed_points:number;incentive_achievements:number;pending_redemptions:number;pending_approvals:number;participants:number;}

export interface RewardProgressItem {program_id:UUID;program_name:string;rule_id:UUID;rule_name:string;event_key:string;period_days:number;points_earned:number;points_limit:number|null;points_remaining:number|null;metric_achieved:string|number;target_metric:string|number|null;progress_percent:string|number|null;requires_approval:boolean;}
export interface RewardProgressResponse {organization_id:UUID;participant_user_id:UUID;items:RewardProgressItem[];}

export interface RewardCustomerSegmentCriteria {roles:string[];branch_ids:UUID[];user_ids:UUID[];minimum_points_balance:number;}
export interface RewardCustomerSegment {id:UUID;organization_id:UUID;code:string;name:string;description:string|null;status:"draft"|"active"|"paused"|"archived";membership_mode:"manual"|"rule_based"|"hybrid";criteria:RewardCustomerSegmentCriteria;starts_at:ISODateTime|null;ends_at:ISODateTime|null;created_by:UUID;updated_by:UUID;created_at:ISODateTime;updated_at:ISODateTime;member_count?:number;}
export interface RewardCustomerSegmentWrite {code:string;name:string;description?:string|null;status:"draft"|"active"|"paused"|"archived";membership_mode:"manual"|"rule_based"|"hybrid";criteria:RewardCustomerSegmentCriteria;starts_at?:ISODateTime|null;ends_at?:ISODateTime|null;}
export interface RewardCustomerSegmentMember {id:UUID;organization_id:UUID;segment_id:UUID;participant_user_id:UUID;membership_source:"manual"|"rule"|"import";status:"active"|"inactive"|"removed";matched_criteria:Record<string,unknown>;joined_at:ISODateTime;expires_at:ISODateTime|null;updated_at:ISODateTime;}
export interface RewardCustomerSegmentMemberWrite {participant_user_id:UUID;expires_at?:ISODateTime|null;}

export interface RewardCustomerSegmentReport {active_members:number;inactive_members:number;removed_members:number;ledger_entries:number;earned_points:number;redeemed_points:number;expired_points:number;adjusted_points:number;}

export interface LocationSessionStart {device_id:string;consent_policy_version:string;shift_id:UUID;}
export interface LocationSessionAction {action:"pause"|"resume"|"stop"|"revoke";reason?:string|null;}
export interface LocationSession {id:UUID;organization_id:UUID;sales_profile_id:UUID;user_id:UUID;shift_id:UUID|null;device_id:string;consented_at:ISODateTime;consent_policy_version:string;started_at:ISODateTime;ended_at:ISODateTime|null;status:"active"|"paused"|"completed"|"revoked";}
export interface LocationPointWrite {client_point_id:string;recorded_at:ISODateTime;latitude:number;longitude:number;accuracy_m:number;altitude_m?:number|null;speed_mps?:number|null;heading_deg?:number|null;source:"gps"|"network"|"fused";metadata?:Record<string,unknown>;}
export interface LocationPointBatch {points:LocationPointWrite[];}
export interface LocationBatchResult {session_id:UUID;accepted:number;duplicates:number;received:number;}
export interface LocationLatestPosition {organization_id:UUID;user_id:UUID;sales_profile_id:UUID;branch_id:UUID|null;team_id:UUID|null;territory_id:UUID|null;session_id:UUID;latitude:number;longitude:number;accuracy_m:number;source:"gps"|"network"|"fused";recorded_at:ISODateTime;received_at:ISODateTime;stale:boolean;}
export interface LocationHistoryPoint {id:UUID;session_id:UUID;user_id:UUID;client_point_id:string;recorded_at:ISODateTime;received_at:ISODateTime;latitude:number;longitude:number;accuracy_m:number;altitude_m:number|null;speed_mps:number|null;heading_deg:number|null;source:"gps"|"network"|"fused";}
export interface LocationHistoryPage {items:LocationHistoryPoint[];page:number;page_size:number;total:number;from_at:ISODateTime;to_at:ISODateTime;}
export interface LocationRouteReplayPage {route_id:UUID;session_id:UUID;sales_profile_id:UUID;user_id:UUID;from_at:ISODateTime;to_at:ISODateTime;items:LocationHistoryPoint[];page:number;page_size:number;total:number;}
export interface LocationRouteSummary {id:UUID;organization_id:UUID;session_id:UUID;sales_profile_id:UUID;user_id:UUID;route_date:string;started_at:ISODateTime;ended_at:ISODateTime;point_count:number;distance_m:number;route_geojson:Record<string,unknown>|null;computed_at:ISODateTime;}
export interface LocationGeofence {id:UUID;organization_id:UUID;code:string;name:string;geofence_type:"outlet"|"territory"|"custom";outlet_id:UUID|null;territory_id:UUID|null;boundary_geojson?:Record<string,unknown>|null;event_types:Array<"enter"|"exit"|"dwell">;dwell_seconds:number;accuracy_limit_m:number;status:"active"|"inactive"|"archived";created_at:ISODateTime;updated_at:ISODateTime;}
export interface LocationGeofenceWrite {code:string;name:string;geofence_type:"outlet"|"territory"|"custom";outlet_id?:UUID|null;territory_id?:UUID|null;boundary_geojson:Record<string,unknown>;event_types:Array<"enter"|"exit"|"dwell">;dwell_seconds:number;accuracy_limit_m:number;}

export interface LocationGeofenceEvent {id:UUID;geofence_id:UUID;geofence_name:string;session_id:UUID;location_point_id:UUID;event_type:"enter"|"exit"|"dwell";occurred_at:ISODateTime;sales_profile_id:UUID;user_id:UUID;}
export interface LocationGeofenceEventPage {items:LocationGeofenceEvent[];page:number;page_size:number;total:number;}


export interface MapsRuntimeStatus {
  provider:"google"|"none";
  server_routes_enabled:boolean;
  server_places_enabled:boolean;
  language:string;
  region:string;
}
export interface MapCoordinateContract {lat:number;lng:number;}
export interface MapRouteComputeRequest {
  origin:MapCoordinateContract;
  destination:MapCoordinateContract;
  intermediates?:MapCoordinateContract[];
  travel_mode:"DRIVE"|"BICYCLE"|"WALK"|"TWO_WHEELER";
}
export interface MapRouteComputeResult {
  provider:"google";
  distance_m:number;
  duration:string;
  encoded_polyline:string;
}
export interface MapPlacesSearchRequest {
  text_query:string;
  included_type?:string;
  strict_type_filtering?:boolean;
  location_bias?:{lat:number;lng:number;radius_meters?:number};
  page_size?:number;
  page_token?:string;
}
export interface MapPlaceResult {
  id:string;
  displayName?:{text?:string;languageCode?:string};
  formattedAddress?:string;
  nationalPhoneNumber?:string;
  internationalPhoneNumber?:string;
  location?:{latitude:number;longitude:number};
  googleMapsUri?:string;
  websiteUri?:string;
  businessStatus?:string;
  rating?:number;
  userRatingCount?:number;
  primaryTypeDisplayName?:{text?:string;languageCode?:string};
}
export interface MapPlacesSearchResponse {places:MapPlaceResult[];nextPageToken:string|null;}

export type AnalyticsPeriodGrain = "day" | "week" | "month";
export type AnalyticsScopeType = "tenant" | "branch" | "team" | "territory" | "user";
export interface AnalyticsMetricPoint {
  metric_key:string; period_start:string; period_end:string;
  scope_type:AnalyticsScopeType; scope_id:UUID|null; metric_value:number;
  dimensions:Record<string,unknown>; source_watermark:ISODateTime|null; calculated_at:ISODateTime;
}
export interface AnalyticsDashboardResponse {
  organization_id:UUID; period_start:string; period_end:string; period_grain:AnalyticsPeriodGrain;
  scopes:Array<{scope_type:AnalyticsScopeType;scope_id:UUID|null}>;
  metrics:AnalyticsMetricPoint[]; data_as_of:ISODateTime|null; is_stale:boolean;
}
export interface AnalyticsReportRunCreate {
  report_key:string; period_start:string; period_end:string; period_grain:AnalyticsPeriodGrain;
  scope_type:AnalyticsScopeType; scope_id?:UUID|null; idempotency_key:string; parameters?:Record<string,unknown>;
}
export interface AnalyticsReportRun {
  id:UUID; report_key:string; status:"queued"|"running"|"completed"|"failed"|"cancelled";
  period_start:string; period_end:string; period_grain:AnalyticsPeriodGrain; requested_at:ISODateTime;
}

export interface AnalyticsReportExportResponse extends AnalyticsReportRun {
  export_id:UUID;
  export_status:"queued"|"running"|"completed"|"failed"|"cancelled";
}
export interface AnalyticsReportDownloadResponse {
  report_run_id:UUID;
  download_url:string;
  expires_in_seconds:60;
}
export interface AnalyticsScheduledJob {
  id:UUID; job_key:string; job_type:"refresh_daily"|"refresh_weekly"|"refresh_monthly"|"export_report";
  schedule_kind:"interval"|"daily"|"weekly"|"monthly"; timezone:string; next_run_at:ISODateTime;
  enabled:boolean; last_run_at:ISODateTime|null; last_status:"completed"|"failed"|"skipped"|null;
}
