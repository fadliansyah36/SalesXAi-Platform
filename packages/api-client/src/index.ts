export type { SmartOrderProduct, SmartOrderProductImage, SmartOrderStockMovement, SmartOrderStockMovementPage, SmartOrderProductPage, SmartOrderProductWrite, SmartOrderVariant, SmartOrderPriceQuote, SmartOrderInventoryBalance, SmartOrderStockMovementWrite, SmartOrderPromotion, SmartOrderPromotionWrite, SmartOrderCart, SmartOrderCartItemWrite, SmartOrderOrderCreate, SmartOrderOrder, SmartOrderOrderPage, SmartOrderFulfillmentWrite, SmartOrderFulfillmentUpdate, SmartOrderPriceListWrite, SmartOrderPriceList, SmartOrderWarehouse, SmartOrderWarehouseWrite, SmartOrderCategory, SmartOrderCategoryWrite, SmartOrderBrandWrite, SmartOrderUnitWrite, SmartOrderCatalogAccessWrite, SmartOrderStockTransferWrite, SmartOrderProductImageWrite, SmartOrderOrderCancel, SmartOrderPartnerOrganization, SmartOrderPartnerLinkWrite, SmartOrderAssistedCartWrite, SmartOrderPriceHistoryPage, SmartOrderApprovalPolicy, SmartOrderApprovalPolicyWrite } from "@salesx-ai/api-contracts";
export type { MasterDataChangedEvent, MasterDataResource, PlatformAuditLog, PlatformRole, PlatformUserSummary, SmartTeamActivity, SmartTeamAttendance, SmartTeamDashboard, SmartTeamLocationCapture, SmartTeamTarget, SmartTeamTargetUpdate, SmartTeamTargetWrite, SmartTeamVisit, SmartTeamVisitCreate, PlatformSmartTeamOverviewRow, SmartTeamVisitEvidence, SmartTeamVisitAssign } from "@salesx-ai/api-contracts";
import type {
  AccountStatusUpdateRequest,
  AccountStatusUpdateResponse,
  AssignableRole,
  AuthContext,
  InvitationAcceptResponse,
  InvitationActionResponse,
  InvitationCreateRequest,
  InvitationDeliveryResult,
  InvitationRecord,
  InvitationTokenRequest,
  LinkedIdentity,
  MemberCreateRequest,
  MemberStatusResponse,
  MemberStatusUpdateRequest,
  MasterDataImportRequest,
  MasterDataImportResult,
  SalesAssignmentContext,
  MasterDataRecord,
  MasterDataWrite,
  OutletAssignmentCreate,
  OutletAssignmentUnassignRequest,
  OutletAssignmentRecord,
  PlatformOrganization,
  PlatformOrganizationStatusUpdate,
  MyOrganizationSummary,
  OrganizationCreateRequest,
  OrganizationMember,
  OrganizationSummary,
  PlatformAuditLog,
  PlatformRole,
  PlatformUserSummary,
  RoleAssignmentRequest,
  RoleAssignmentResponse,
  SessionDeviceRegistration,
  SessionDeviceSummary,
} from "@salesx-ai/api-contracts";

export type ApiPlatform = "web" | "android" | "ios" | "unknown";
export type AuthFailureCode = "session_revoked" | "account_inactive" | "identity_unverified";

export interface ApiClientAuth {
  getAccessToken(): Promise<string | null>;
  refreshAccessToken(): Promise<string | null>;
  refreshCookieSession?(): Promise<boolean>;
  getCsrfToken?(): Promise<string | null>;
  getOrganizationId?(): string | null;
  onSessionInvalidated?(code: string): Promise<void> | void;
}

export interface SalesXApiClientOptions {
  baseUrl: string;
  platform: ApiPlatform;
  auth: ApiClientAuth;
  authMode?: "bearer" | "cookie";
  fetcher?: typeof fetch;
}

export class SalesXApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly code?: string,
    public readonly correlationId?: string | null,
  ) {
    super(message);
    this.name = "SalesXApiError";
  }
}

/** One typed transport for Web and Expo; authorization remains enforced by FastAPI. */
export class SalesXApiClient {
  private readonly baseUrl: string;
  private readonly platform: ApiPlatform;
  private readonly auth: ApiClientAuth;
  private readonly authMode: "bearer" | "cookie";
  private readonly fetcher: typeof fetch;

  constructor(options: SalesXApiClientOptions) {
    this.baseUrl = options.baseUrl.replace(/\/$/, "");
    this.platform = options.platform;
    this.auth = options.auth;
    this.authMode = options.authMode ?? "bearer";
    this.fetcher = options.fetcher ?? fetch;
    if (!this.baseUrl) throw new Error("FastAPI base URL is required.");
  }

  async fetch(path: string, init: RequestInit = {}): Promise<Response> {
    if (!path.startsWith("/") || path.startsWith("//")) {
      throw new Error("API paths must be relative to the configured FastAPI origin.");
    }
    let token = this.authMode === "cookie" ? null : await this.auth.getAccessToken();
    if (this.authMode === "bearer" && !token) throw new SalesXApiError("An authenticated session is required.", 401, "unauthenticated");

    const send = async (accessToken: string | null) => {
      const headers = new Headers(init.headers);
      if (this.authMode === "cookie") headers.delete("Authorization");
      else if (accessToken) headers.set("Authorization", "Bearer " + accessToken);
      headers.set("X-Client-Platform", this.platform);
      const method = (init.method ?? "GET").toUpperCase();
      if (this.authMode === "cookie" && !["GET","HEAD","OPTIONS"].includes(method)) {
        const csrf = await this.auth.getCsrfToken?.();
        if (!csrf) throw new SalesXApiError("A valid CSRF token is required for this Web action.", 403, "csrf_token_missing");
        headers.set("X-CSRF-Token", csrf);
      }
      const organizationId = this.auth.getOrganizationId?.();
      if (organizationId) headers.set("X-Organization-ID", organizationId);
      if (typeof init.body === "string" && !headers.has("Content-Type")) headers.set("Content-Type", "application/json");
      return this.fetcher(this.baseUrl + path, {
        ...init,
        headers,
        ...(this.authMode === "cookie" ? { credentials: "same-origin" as const } : {}),
        cache: "no-store",
      });
    };

    let response = await send(token);
    if (response.status === 401) {
      const initialBody = await response.clone().json().catch(() => ({}));
      const initialCode = initialBody?.error?.code ?? "unauthorized";
      if (["session_revoked", "account_inactive", "identity_unverified"].includes(initialCode)) {
        await this.auth.onSessionInvalidated?.(initialCode);
        return response;
      }
      try {
        if (this.authMode === "cookie") {
          const refreshed = await this.auth.refreshCookieSession?.() ?? false;
          if (refreshed) response = await send(null);
          else await this.auth.onSessionInvalidated?.("refresh_token_missing");
        } else {
          const refreshed = await this.auth.refreshAccessToken();
          if (refreshed) {
            token = refreshed;
            response = await send(token);
          } else {
            await this.auth.onSessionInvalidated?.("refresh_token_missing");
          }
        }
      } catch (cause) {
        const status = (cause as { status?: number })?.status;
        if (status === 400 || status === 401 || status === 403) {
          await this.auth.onSessionInvalidated?.("refresh_token_rejected");
        }
        throw cause;
      }
    }

    if (response.status === 401 || response.status === 403) {
      const body = await response.clone().json().catch(() => ({}));
      const code = body?.error?.code ?? "unauthorized";
      if (
        response.status === 401 ||
        (["session_revoked", "account_inactive", "identity_unverified"] as AuthFailureCode[]).includes(code)
      ) {
        await this.auth.onSessionInvalidated?.(code);
      }
    }
    return response;
  }

  async request<T = unknown>(path: string, init: RequestInit = {}): Promise<T> {
    const response = await this.fetch(path, init);
    if (response.status === 204) return undefined as T;
    const body = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new SalesXApiError(
        body?.error?.message ?? "FastAPI request failed.",
        response.status,
        body?.error?.code,
        body?.error?.correlation_id ?? response.headers.get("X-Correlation-ID"),
      );
    }
    return body as T;
  }

  getAuthContext(): Promise<AuthContext> {
    return this.request<AuthContext>("/api/v1/auth/me");
  }

  registerCurrentSession(payload: SessionDeviceRegistration): Promise<void> {
    return this.request<void>("/api/v1/auth/sessions/current", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  }

  listMyOrganizations(): Promise<MyOrganizationSummary[]> {
    return this.request<MyOrganizationSummary[]>("/api/v1/organizations");
  }

  createOrganization(payload: OrganizationCreateRequest): Promise<OrganizationSummary> {
    return this.request<OrganizationSummary>("/api/v1/organizations", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  }

  listOrganizationMembers(organizationId: string): Promise<OrganizationMember[]> {
    return this.request<OrganizationMember[]>(`/api/v1/organizations/${encodeURIComponent(organizationId)}/members`);
  }

  addExistingOrganizationMember(organizationId: string, payload: MemberCreateRequest): Promise<unknown> {
    return this.request(`/api/v1/organizations/${encodeURIComponent(organizationId)}/members`, {
      method: "POST",
      body: JSON.stringify(payload),
    });
  }

  updateOrganizationMember(
    organizationId: string,
    userId: string,
    payload: MemberStatusUpdateRequest,
  ): Promise<MemberStatusResponse> {
    return this.request<MemberStatusResponse>(
      `/api/v1/organizations/${encodeURIComponent(organizationId)}/members/${encodeURIComponent(userId)}`,
      { method: "PATCH", body: JSON.stringify(payload) },
    );
  }

  assignMemberRole(
    organizationId: string,
    userId: string,
    payload: RoleAssignmentRequest,
  ): Promise<RoleAssignmentResponse> {
    return this.request<RoleAssignmentResponse>(
      `/api/v1/organizations/${encodeURIComponent(organizationId)}/members/${encodeURIComponent(userId)}/roles`,
      { method: "POST", body: JSON.stringify(payload) },
    );
  }

  listAssignableRoles(organizationId: string): Promise<AssignableRole[]> {
    return this.request<AssignableRole[]>(
      `/api/v1/organizations/${encodeURIComponent(organizationId)}/assignable-roles`,
    );
  }

  listInvitations(organizationId: string): Promise<InvitationRecord[]> {
    return this.request<InvitationRecord[]>(
      `/api/v1/organizations/${encodeURIComponent(organizationId)}/invitations`,
    );
  }

  createInvitation(organizationId: string, payload: InvitationCreateRequest): Promise<InvitationDeliveryResult> {
    return this.request<InvitationDeliveryResult>(
      `/api/v1/organizations/${encodeURIComponent(organizationId)}/invitations`,
      { method: "POST", body: JSON.stringify(payload) },
    );
  }

  resendInvitation(organizationId: string, invitationId: string): Promise<InvitationDeliveryResult> {
    return this.request<InvitationDeliveryResult>(
      `/api/v1/organizations/${encodeURIComponent(organizationId)}/invitations/${encodeURIComponent(invitationId)}/resend`,
      { method: "POST" },
    );
  }

  revokeInvitation(organizationId: string, invitationId: string): Promise<InvitationActionResponse> {
    return this.request<InvitationActionResponse>(
      `/api/v1/organizations/${encodeURIComponent(organizationId)}/invitations/${encodeURIComponent(invitationId)}/revoke`,
      { method: "POST" },
    );
  }

  acceptInvitation(payload: InvitationTokenRequest): Promise<InvitationAcceptResponse> {
    return this.request<InvitationAcceptResponse>("/api/v1/organizations/invitations/accept", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  }

  rejectInvitation(payload: InvitationTokenRequest): Promise<InvitationActionResponse> {
    return this.request<InvitationActionResponse>("/api/v1/organizations/invitations/reject", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  }

  listPlatformUsers(query?: string): Promise<PlatformUserSummary[]> {
    const params = new URLSearchParams({ limit: "500" });
    if (query?.trim()) params.set("q", query.trim());
    return this.request<PlatformUserSummary[]>("/api/v1/admin/users?" + params.toString());
  }

  listPlatformRoles(): Promise<PlatformRole[]> {
    return this.request<PlatformRole[]>("/api/v1/admin/roles");
  }

  listPlatformAuditLogs(options: { before?: string; limit?: number } = {}): Promise<PlatformAuditLog[]> {
    const params = new URLSearchParams({ limit: String(options.limit ?? 100) });
    if (options.before) params.set("before", options.before);
    return this.request<PlatformAuditLog[]>("/api/v1/admin/audit?" + params.toString());
  }

  updateAccountStatus(userId: string, payload: AccountStatusUpdateRequest): Promise<AccountStatusUpdateResponse> {
    return this.request<AccountStatusUpdateResponse>(
      `/api/v1/admin/users/${encodeURIComponent(userId)}/account-status`,
      { method: "PATCH", body: JSON.stringify(payload) },
    );
  }

  listLinkedIdentities(): Promise<LinkedIdentity[]> {
    return this.request<LinkedIdentity[]>("/api/v1/auth/identities");
  }

  unlinkIdentity(identityId: string): Promise<void> {
    return this.request<void>(`/api/v1/auth/identities/${encodeURIComponent(identityId)}`, { method: "DELETE" });
  }

  listSessions(): Promise<SessionDeviceSummary[]> {
    return this.request<SessionDeviceSummary[]>("/api/v1/auth/sessions");
  }

  revokeSession(sessionId: string): Promise<void> {
    return this.request<void>(`/api/v1/auth/sessions/${encodeURIComponent(sessionId)}`, { method: "DELETE" });
  }


  listBranches(organizationId: string): Promise<MasterDataRecord[]> {
    return this.request(`/api/v1/organizations/${encodeURIComponent(organizationId)}/branches`);
  }
  createBranch(organizationId: string, payload: MasterDataWrite): Promise<MasterDataRecord> {
    return this.request(`/api/v1/organizations/${encodeURIComponent(organizationId)}/branches`, { method: "POST", body: JSON.stringify(payload) });
  }
  updateBranch(organizationId: string, id: string, payload: MasterDataWrite): Promise<MasterDataRecord> {
    return this.request(`/api/v1/organizations/${encodeURIComponent(organizationId)}/branches/${encodeURIComponent(id)}`, { method: "PATCH", body: JSON.stringify(payload) });
  }
  listTeams(organizationId: string): Promise<MasterDataRecord[]> {
    return this.request(`/api/v1/organizations/${encodeURIComponent(organizationId)}/teams`);
  }
  createTeam(organizationId: string, payload: MasterDataWrite): Promise<MasterDataRecord> {
    return this.request(`/api/v1/organizations/${encodeURIComponent(organizationId)}/teams`, { method: "POST", body: JSON.stringify(payload) });
  }
  updateTeam(organizationId: string, id: string, payload: MasterDataWrite): Promise<MasterDataRecord> {
    return this.request(`/api/v1/organizations/${encodeURIComponent(organizationId)}/teams/${encodeURIComponent(id)}`, { method: "PATCH", body: JSON.stringify(payload) });
  }
  listTerritories(organizationId: string): Promise<MasterDataRecord[]> {
    return this.request(`/api/v1/organizations/${encodeURIComponent(organizationId)}/territories`);
  }
  createTerritory(organizationId: string, payload: MasterDataWrite): Promise<MasterDataRecord> {
    return this.request(`/api/v1/organizations/${encodeURIComponent(organizationId)}/territories`, { method: "POST", body: JSON.stringify(payload) });
  }
  updateTerritory(organizationId: string, id: string, payload: MasterDataWrite): Promise<MasterDataRecord> {
    return this.request(`/api/v1/organizations/${encodeURIComponent(organizationId)}/territories/${encodeURIComponent(id)}`, { method: "PATCH", body: JSON.stringify(payload) });
  }
  listOutlets(organizationId: string): Promise<MasterDataRecord[]> {
    return this.request(`/api/v1/organizations/${encodeURIComponent(organizationId)}/outlets`);
  }
  createOutlet(organizationId: string, payload: MasterDataWrite): Promise<MasterDataRecord> {
    return this.request(`/api/v1/organizations/${encodeURIComponent(organizationId)}/outlets`, { method: "POST", body: JSON.stringify(payload) });
  }
  updateOutlet(organizationId: string, id: string, payload: MasterDataWrite): Promise<MasterDataRecord> {
    return this.request(`/api/v1/organizations/${encodeURIComponent(organizationId)}/outlets/${encodeURIComponent(id)}`, { method: "PATCH", body: JSON.stringify(payload) });
  }
  listSalesProfiles(organizationId: string): Promise<MasterDataRecord[]> {
    return this.request(`/api/v1/organizations/${encodeURIComponent(organizationId)}/sales-profiles`);
  }
  createSalesProfile(organizationId: string, payload: MasterDataWrite): Promise<MasterDataRecord> {
    return this.request(`/api/v1/organizations/${encodeURIComponent(organizationId)}/sales-profiles`, { method: "POST", body: JSON.stringify(payload) });
  }
  updateSalesProfile(organizationId: string, id: string, payload: MasterDataWrite): Promise<MasterDataRecord> {
    return this.request(`/api/v1/organizations/${encodeURIComponent(organizationId)}/sales-profiles/${encodeURIComponent(id)}`, { method: "PATCH", body: JSON.stringify(payload) });
  }
  getMySalesAssignmentContext(organizationId: string): Promise<SalesAssignmentContext> {
    return this.request(`/api/v1/organizations/${encodeURIComponent(organizationId)}/sales-profiles/me/assignment-context`);
  }
  importMasterData(organizationId: string, resource: string, payload: MasterDataImportRequest): Promise<MasterDataImportResult> {
    return this.request(`/api/v1/organizations/${encodeURIComponent(organizationId)}/master-data/${encodeURIComponent(resource)}/import`, {
      method: "POST", body: JSON.stringify(payload),
    });
  }
  exportMasterData(organizationId: string, resource: string): Promise<Response> {
    return this.fetch(`/api/v1/organizations/${encodeURIComponent(organizationId)}/master-data/${encodeURIComponent(resource)}/export`);
  }

  listOutletAssignments(organizationId: string): Promise<OutletAssignmentRecord[]> {
    return this.request(`/api/v1/organizations/${encodeURIComponent(organizationId)}/outlet-assignments`);
  }
  assignOutlet(organizationId: string, outletId: string, payload: OutletAssignmentCreate): Promise<OutletAssignmentRecord> {
    return this.request(`/api/v1/organizations/${encodeURIComponent(organizationId)}/outlets/${encodeURIComponent(outletId)}/assignments`, { method: "POST", body: JSON.stringify(payload) });
  }



  unassignOutletAssignment(organizationId: string, assignmentId: string, payload: OutletAssignmentUnassignRequest): Promise<OutletAssignmentRecord> {
    return this.request(`/api/v1/organizations/${encodeURIComponent(organizationId)}/outlet-assignments/${encodeURIComponent(assignmentId)}/unassign`, {
      method: "POST", body: JSON.stringify(payload),
    });
  }

  listOrganizationBranches(organizationId: string): Promise<MasterDataRecord[]> {
    return this.request(`/api/v1/admin/organizations/${encodeURIComponent(organizationId)}/branches`);
  }
  createOrganizationBranch(organizationId: string, payload: MasterDataWrite): Promise<MasterDataRecord> {
    return this.request(`/api/v1/admin/organizations/${encodeURIComponent(organizationId)}/branches`, { method: "POST", body: JSON.stringify(payload) });
  }
  updateOrganizationBranch(organizationId: string, branchId: string, payload: MasterDataWrite): Promise<MasterDataRecord> {
    return this.request(`/api/v1/admin/organizations/${encodeURIComponent(organizationId)}/branches/${encodeURIComponent(branchId)}`, { method: "PATCH", body: JSON.stringify(payload) });
  }

  listPlatformOrganizations(): Promise<PlatformOrganization[]> {
    return this.request("/api/v1/admin/organizations");
  }
  updatePlatformOrganization(organizationId: string, payload: PlatformOrganizationStatusUpdate): Promise<PlatformOrganization> {
    return this.request(`/api/v1/admin/organizations/${encodeURIComponent(organizationId)}`, { method: "PATCH", body: JSON.stringify(payload) });
  }


  listSmartTeamVisits(organizationId:string,options:{status?:string;profileId?:string;limit?:number;offset?:number}={}):Promise<import("@salesx-ai/api-contracts").SmartTeamVisit[]> {
    const query=new URLSearchParams({limit:String(options.limit??100),offset:String(options.offset??0)});
    if(options.status)query.set("status",options.status);if(options.profileId)query.set("profile_id",options.profileId);
    return this.request(`/api/v1/organizations/${encodeURIComponent(organizationId)}/smart-team/visits?${query.toString()}`);
  }
  createSmartTeamVisit(organizationId:string,payload:import("@salesx-ai/api-contracts").SmartTeamVisitCreate):Promise<import("@salesx-ai/api-contracts").SmartTeamVisit> {
    return this.request(`/api/v1/organizations/${encodeURIComponent(organizationId)}/smart-team/visits`,{method:"POST",body:JSON.stringify(payload)});
  }

  assignSmartTeamVisit(organizationId:string,visitId:string,payload:import("@salesx-ai/api-contracts").SmartTeamVisitAssign):Promise<import("@salesx-ai/api-contracts").SmartTeamVisit> {
    return this.request(`/api/v1/organizations/${encodeURIComponent(organizationId)}/smart-team/visits/${encodeURIComponent(visitId)}/assign`,{method:"POST",body:JSON.stringify(payload)});
  }

  checkInSmartTeamVisit(organizationId:string,visitId:string,payload:{location:import("@salesx-ai/api-contracts").SmartTeamLocationCapture;idempotency_key:string}):Promise<import("@salesx-ai/api-contracts").SmartTeamVisit> {
    return this.request(`/api/v1/organizations/${encodeURIComponent(organizationId)}/smart-team/visits/${encodeURIComponent(visitId)}/check-in`,{method:"POST",body:JSON.stringify(payload)});
  }
  checkOutSmartTeamVisit(organizationId:string,visitId:string,payload:{location:import("@salesx-ai/api-contracts").SmartTeamLocationCapture;outcome?:string|null;notes?:string|null;idempotency_key:string}):Promise<import("@salesx-ai/api-contracts").SmartTeamVisit> {
    return this.request(`/api/v1/organizations/${encodeURIComponent(organizationId)}/smart-team/visits/${encodeURIComponent(visitId)}/check-out`,{method:"POST",body:JSON.stringify(payload)});
  }
  cancelSmartTeamVisit(organizationId:string,visitId:string,reason:string):Promise<import("@salesx-ai/api-contracts").SmartTeamVisit> {
    return this.request(`/api/v1/organizations/${encodeURIComponent(organizationId)}/smart-team/visits/${encodeURIComponent(visitId)}/cancel`,{method:"POST",body:JSON.stringify({reason})});
  }
  listSmartTeamAttendance(organizationId:string,limit=100,offset=0):Promise<import("@salesx-ai/api-contracts").SmartTeamAttendance[]> {
    const query=new URLSearchParams({limit:String(limit),offset:String(offset)});
    return this.request(`/api/v1/organizations/${encodeURIComponent(organizationId)}/smart-team/attendance?${query.toString()}`);
  }
  clockInSmartTeam(organizationId:string,location:import("@salesx-ai/api-contracts").SmartTeamLocationCapture,idempotencyKey:string):Promise<import("@salesx-ai/api-contracts").SmartTeamAttendance> {
    return this.request(`/api/v1/organizations/${encodeURIComponent(organizationId)}/smart-team/attendance/clock-in`,{method:"POST",body:JSON.stringify({location,idempotency_key:idempotencyKey})});
  }
  clockOutSmartTeam(organizationId:string,location:import("@salesx-ai/api-contracts").SmartTeamLocationCapture,idempotencyKey:string):Promise<import("@salesx-ai/api-contracts").SmartTeamAttendance> {
    return this.request(`/api/v1/organizations/${encodeURIComponent(organizationId)}/smart-team/attendance/clock-out`,{method:"POST",body:JSON.stringify({location,idempotency_key:idempotencyKey})});
  }
  correctSmartTeamAttendance(organizationId:string,shiftId:string,payload:{clock_in_at?:string|null;clock_out_at?:string|null;reason:string}):Promise<import("@salesx-ai/api-contracts").SmartTeamAttendance> {
    return this.request(`/api/v1/organizations/${encodeURIComponent(organizationId)}/smart-team/attendance/${encodeURIComponent(shiftId)}/correct`,{method:"POST",body:JSON.stringify(payload)});
  }
  listSmartTeamActivities(organizationId:string,limit=100,offset=0):Promise<import("@salesx-ai/api-contracts").SmartTeamActivity[]> {
    const query=new URLSearchParams({limit:String(limit),offset:String(offset)});
    return this.request(`/api/v1/organizations/${encodeURIComponent(organizationId)}/smart-team/activities?${query.toString()}`);
  }
  createSmartTeamActivity(organizationId:string,payload:import("@salesx-ai/api-contracts").SmartTeamActivityCreate):Promise<import("@salesx-ai/api-contracts").SmartTeamActivity> {
    return this.request(`/api/v1/organizations/${encodeURIComponent(organizationId)}/smart-team/activities`,{method:"POST",body:JSON.stringify(payload)});
  }
  updateSmartTeamActivity(organizationId:string,activityId:string,payload:Record<string,unknown>):Promise<import("@salesx-ai/api-contracts").SmartTeamActivity> {
    return this.request(`/api/v1/organizations/${encodeURIComponent(organizationId)}/smart-team/activities/${encodeURIComponent(activityId)}`,{method:"PATCH",body:JSON.stringify(payload)});
  }
  listSmartTeamTargets(organizationId:string,limit=100,offset=0):Promise<import("@salesx-ai/api-contracts").SmartTeamTarget[]> {
    const query=new URLSearchParams({limit:String(limit),offset:String(offset)});
    return this.request(`/api/v1/organizations/${encodeURIComponent(organizationId)}/smart-team/targets?${query.toString()}`);
  }
  createSmartTeamTarget(organizationId:string,payload:import("@salesx-ai/api-contracts").SmartTeamTargetWrite):Promise<import("@salesx-ai/api-contracts").SmartTeamTarget> {
    return this.request(`/api/v1/organizations/${encodeURIComponent(organizationId)}/smart-team/targets`,{method:"POST",body:JSON.stringify(payload)});
  }


  getSmartTeamDashboard(organizationId:string):Promise<import("@salesx-ai/api-contracts").SmartTeamDashboard> {
    return this.request(`/api/v1/organizations/${encodeURIComponent(organizationId)}/smart-team/dashboard`);
  }

  subscribeSmartTeamEvents(organizationId:string,onChanged:()=>void):()=>void {
    if(typeof EventSource==="undefined")return ()=>undefined;
    const url=this.baseUrl+`/api/v1/organizations/${encodeURIComponent(organizationId)}/smart-team/events`;
    const source=new EventSource(url,{withCredentials:this.authMode==="cookie"});
    const listener=()=>onChanged();
    source.addEventListener("smartteam.changed",listener);
    return ()=>{source.removeEventListener("smartteam.changed",listener);source.close();};
  }
  updateSmartTeamVisit(organizationId:string,visitId:string,payload:Record<string,unknown>):Promise<import("@salesx-ai/api-contracts").SmartTeamVisit> {
    return this.request(`/api/v1/organizations/${encodeURIComponent(organizationId)}/smart-team/visits/${encodeURIComponent(visitId)}`,{method:"PATCH",body:JSON.stringify(payload)});
  }
  getSmartTeamVisitHistory(organizationId:string,visitId:string):Promise<Array<Record<string,unknown>>> {
    return this.request(`/api/v1/organizations/${encodeURIComponent(organizationId)}/smart-team/visits/${encodeURIComponent(visitId)}/history`);
  }
  updateSmartTeamTarget(organizationId:string,targetId:string,payload:import("@salesx-ai/api-contracts").SmartTeamTargetUpdate):Promise<import("@salesx-ai/api-contracts").SmartTeamTarget> {
    return this.request(`/api/v1/organizations/${encodeURIComponent(organizationId)}/smart-team/targets/${encodeURIComponent(targetId)}`,{method:"PATCH",body:JSON.stringify(payload)});
  }


  listPlatformSmartTeamOverview(limit=100,offset=0):Promise<import("@salesx-ai/api-contracts").PlatformSmartTeamOverviewRow[]> {
    const query=new URLSearchParams({limit:String(limit),offset:String(offset)});
    return this.request(`/api/v1/admin/smart-team/overview?${query.toString()}`);
  }


  async uploadSmartTeamVisitEvidence(
    organizationId:string,visitId:string,file:Blob,fileName:string,mimeType:string,
    options:{onProgress?:(loaded:number,total:number)=>void;signal?:AbortSignal}={}
  ):Promise<import("@salesx-ai/api-contracts").SmartTeamVisitEvidence> {
    const path=`/api/v1/organizations/${encodeURIComponent(organizationId)}/smart-team/visits/${encodeURIComponent(visitId)}/evidence`;
    const send=(token:string|null)=>new Promise<{status:number;payload:any}>((resolve,reject)=>{
      const xhr=new XMLHttpRequest();
      let settled=false;
      const cleanup=()=>options.signal?.removeEventListener("abort",abort);
      const finish=(fn:()=>void)=>{if(settled)return;settled=true;cleanup();fn();};
      const abortError=()=>{const error=new Error("Evidence upload cancelled.");error.name="AbortError";return error;};
      const abort=()=>{xhr.abort();finish(()=>reject(abortError()));};
      if(options.signal?.aborted){reject(abortError());return;}
      options.signal?.addEventListener("abort",abort,{once:true});
      xhr.open("POST",this.baseUrl+path,true);
      xhr.withCredentials=this.authMode==="cookie";
      xhr.setRequestHeader("Content-Type",mimeType);
      xhr.setRequestHeader("X-File-Name",encodeURIComponent(fileName));
      xhr.setRequestHeader("X-Client-Platform",this.platform);
      xhr.setRequestHeader("X-Organization-ID",organizationId);
      if(this.authMode==="bearer"&&token)xhr.setRequestHeader("Authorization","Bearer "+token);
      xhr.upload.onprogress=event=>{if(event.lengthComputable)options.onProgress?.(event.loaded,event.total);};
      xhr.onload=()=>{
        let payload:any={};
        try{payload=JSON.parse(xhr.responseText||"{}");}catch{/* use the stable API error below */}
        finish(()=>resolve({status:xhr.status,payload}));
      };
      xhr.onerror=()=>finish(()=>reject(new SalesXApiError("Network error while uploading visit evidence.",0,"network_error")));
      xhr.onabort=()=>finish(()=>reject(abortError()));
      const transmit=async()=>{
        if(this.authMode==="cookie"){
          const csrf=await this.auth.getCsrfToken?.();
          if(!csrf){finish(()=>reject(new SalesXApiError("A valid CSRF token is required for this Web action.",403,"csrf_token_missing")));return;}
          xhr.setRequestHeader("X-CSRF-Token",csrf);
        }
        if(!settled)xhr.send(file);
      };
      void transmit().catch(cause=>finish(()=>reject(cause)));
    });
    let token=this.authMode==="cookie"?null:await this.auth.getAccessToken();
    if(this.authMode==="bearer"&&!token)throw new SalesXApiError("An authenticated session is required.",401,"unauthenticated");
    let response=await send(token);
    if(response.status===401){
      const code=response.payload?.error?.code??"unauthorized";
      if(["session_revoked","account_inactive","identity_unverified"].includes(code)){
        await this.auth.onSessionInvalidated?.(code);
      }else if(this.authMode==="cookie"){
        if(await (this.auth.refreshCookieSession?.()??Promise.resolve(false)))response=await send(null);
      }else{
        token=await this.auth.refreshAccessToken();
        if(token)response=await send(token);
        else await this.auth.onSessionInvalidated?.("refresh_token_missing");
      }
    }
    if(response.status<200||response.status>=300){
      const error=response.payload?.error??{};
      throw new SalesXApiError(error.message??"Visit evidence upload failed.",response.status,error.code,error.correlation_id);
    }
    return response.payload as import("@salesx-ai/api-contracts").SmartTeamVisitEvidence;
  }
  listSmartTeamVisitEvidence(organizationId:string,visitId:string):Promise<import("@salesx-ai/api-contracts").SmartTeamVisitEvidence[]> {
    return this.request(`/api/v1/organizations/${encodeURIComponent(organizationId)}/smart-team/visits/${encodeURIComponent(visitId)}/evidence`);
  }


  listSmartOrderProducts(organizationId:string,options:{search?:string;categoryId?:string;page?:number;pageSize?:number}={}):Promise<import("@salesx-ai/api-contracts").SmartOrderProductPage>{
    const q=new URLSearchParams();if(options.search)q.set("search",options.search);if(options.categoryId)q.set("category_id",options.categoryId);q.set("page",String(options.page??1));q.set("page_size",String(options.pageSize??24));
    return this.request(`/api/v1/organizations/${encodeURIComponent(organizationId)}/smart-order/catalog/products?${q.toString()}`);
  }
  getSmartOrderProduct(organizationId:string,productId:string):Promise<import("@salesx-ai/api-contracts").SmartOrderProduct>{
    return this.request(`/api/v1/organizations/${encodeURIComponent(organizationId)}/smart-order/catalog/products/${encodeURIComponent(productId)}`);
  }
  createSmartOrderProduct(organizationId:string,payload:import("@salesx-ai/api-contracts").SmartOrderProductWrite):Promise<import("@salesx-ai/api-contracts").SmartOrderProduct>{
    return this.request(`/api/v1/organizations/${encodeURIComponent(organizationId)}/smart-order/products`,{method:"POST",body:JSON.stringify(payload)});
  }
  updateSmartOrderProductStatus(organizationId:string,productId:string,status:"draft"|"published"|"inactive"|"archived"):Promise<import("@salesx-ai/api-contracts").SmartOrderProduct>{
    return this.request(`/api/v1/organizations/${encodeURIComponent(organizationId)}/smart-order/products/${encodeURIComponent(productId)}/status`,{method:"PATCH",body:JSON.stringify({status})});
  }
  quoteSmartOrderPrice(organizationId:string,productId:string,variantId:string,quantity:number,customerOrganizationId?:string):Promise<import("@salesx-ai/api-contracts").SmartOrderPriceQuote>{
    const q=new URLSearchParams({product_id:productId,variant_id:variantId,quantity:String(quantity)});if(customerOrganizationId)q.set("customer_organization_id",customerOrganizationId);
    return this.request(`/api/v1/organizations/${encodeURIComponent(organizationId)}/smart-order/pricing/quote?${q.toString()}`);
  }
  getSmartOrderInventory(organizationId:string,options:{variantId?:string;warehouseId?:string}={}):Promise<import("@salesx-ai/api-contracts").SmartOrderInventoryBalance[]>{
    const q=new URLSearchParams();if(options.variantId)q.set("variant_id",options.variantId);if(options.warehouseId)q.set("warehouse_id",options.warehouseId);
    return this.request(`/api/v1/organizations/${encodeURIComponent(organizationId)}/smart-order/inventory?${q.toString()}`);
  }
  createSmartOrderStockMovement(organizationId:string,payload:import("@salesx-ai/api-contracts").SmartOrderStockMovementWrite):Promise<Record<string,unknown>>{
    return this.request(`/api/v1/organizations/${encodeURIComponent(organizationId)}/smart-order/inventory/movements`,{method:"POST",body:JSON.stringify(payload)});
  }
  listSmartOrderPromotions(organizationId:string):Promise<import("@salesx-ai/api-contracts").SmartOrderPromotion[]>{
    return this.request(`/api/v1/organizations/${encodeURIComponent(organizationId)}/smart-order/promotions`);
  }
  createSmartOrderPromotion(organizationId:string,payload:import("@salesx-ai/api-contracts").SmartOrderPromotionWrite):Promise<import("@salesx-ai/api-contracts").SmartOrderPromotion>{
    return this.request(`/api/v1/organizations/${encodeURIComponent(organizationId)}/smart-order/promotions`,{method:"POST",body:JSON.stringify(payload)});
  }
  evaluateSmartOrderPromotions(organizationId:string,cartId:string,codes:string[]):Promise<Record<string,unknown>>{
    return this.request(`/api/v1/organizations/${encodeURIComponent(organizationId)}/smart-order/promotions/evaluate`,{method:"POST",body:JSON.stringify({cart_id:cartId,codes})});
  }
  getSmartOrderCart(organizationId:string):Promise<import("@salesx-ai/api-contracts").SmartOrderCart>{
    return this.request(`/api/v1/organizations/${encodeURIComponent(organizationId)}/smart-order/cart`);
  }
  addSmartOrderCartItem(organizationId:string,payload:import("@salesx-ai/api-contracts").SmartOrderCartItemWrite):Promise<Record<string,unknown>>{
    return this.request(`/api/v1/organizations/${encodeURIComponent(organizationId)}/smart-order/cart/items`,{method:"POST",body:JSON.stringify(payload)});
  }
  updateSmartOrderCartItem(organizationId:string,itemId:string,payload:{quantity:number;notes?:string|null}):Promise<Record<string,unknown>>{
    return this.request(`/api/v1/organizations/${encodeURIComponent(organizationId)}/smart-order/cart/items/${encodeURIComponent(itemId)}`,{method:"PATCH",body:JSON.stringify(payload)});
  }
  removeSmartOrderCartItem(organizationId:string,itemId:string):Promise<{removed:boolean}>{
    return this.request(`/api/v1/organizations/${encodeURIComponent(organizationId)}/smart-order/cart/items/${encodeURIComponent(itemId)}`,{method:"DELETE"});
  }
  createSmartOrderOrder(organizationId:string,payload:import("@salesx-ai/api-contracts").SmartOrderOrderCreate):Promise<import("@salesx-ai/api-contracts").SmartOrderOrder>{
    return this.request(`/api/v1/organizations/${encodeURIComponent(organizationId)}/smart-order/orders`,{method:"POST",body:JSON.stringify(payload)});
  }
  listMySmartOrderOrders(organizationId:string,page=1,pageSize=20,status?:string):Promise<import("@salesx-ai/api-contracts").SmartOrderOrderPage>{
    const q=new URLSearchParams({page:String(page),page_size:String(pageSize)});if(status)q.set("status",status);
    return this.request(`/api/v1/organizations/${encodeURIComponent(organizationId)}/smart-order/orders?${q.toString()}`);
  }
  listSmartOrderOperations(organizationId:string,page=1,pageSize=20,status?:string):Promise<import("@salesx-ai/api-contracts").SmartOrderOrderPage>{
    const q=new URLSearchParams({page:String(page),page_size:String(pageSize)});if(status)q.set("status",status);
    return this.request(`/api/v1/organizations/${encodeURIComponent(organizationId)}/smart-order/orders/operations?${q.toString()}`);
  }
  getSmartOrderOrder(organizationId:string,orderId:string):Promise<import("@salesx-ai/api-contracts").SmartOrderOrder>{
    return this.request(`/api/v1/organizations/${encodeURIComponent(organizationId)}/smart-order/orders/${encodeURIComponent(orderId)}`);
  }
  submitSmartOrderOrder(organizationId:string,orderId:string):Promise<import("@salesx-ai/api-contracts").SmartOrderOrder>{
    return this.request(`/api/v1/organizations/${encodeURIComponent(organizationId)}/smart-order/orders/${encodeURIComponent(orderId)}/submit`,{method:"POST"});
  }
  decideSmartOrderOrder(organizationId:string,orderId:string,payload:{decision:"approved"|"rejected"|"revision_requested";reason?:string|null}):Promise<import("@salesx-ai/api-contracts").SmartOrderOrder>{
    return this.request(`/api/v1/organizations/${encodeURIComponent(organizationId)}/smart-order/orders/${encodeURIComponent(orderId)}/decision`,{method:"POST",body:JSON.stringify(payload)});
  }
  createSmartOrderFulfillment(organizationId:string,orderId:string,payload:import("@salesx-ai/api-contracts").SmartOrderFulfillmentWrite):Promise<Record<string,unknown>>{
    return this.request(`/api/v1/organizations/${encodeURIComponent(organizationId)}/smart-order/orders/${encodeURIComponent(orderId)}/fulfillments`,{method:"POST",body:JSON.stringify(payload)});
  }
  updateSmartOrderFulfillment(organizationId:string,fulfillmentId:string,payload:import("@salesx-ai/api-contracts").SmartOrderFulfillmentUpdate):Promise<Record<string,unknown>>{
    return this.request(`/api/v1/organizations/${encodeURIComponent(organizationId)}/smart-order/fulfillments/${encodeURIComponent(fulfillmentId)}`,{method:"PATCH",body:JSON.stringify(payload)});
  }


  listSmartOrderCategories(organizationId:string):Promise<import("@salesx-ai/api-contracts").SmartOrderCategory[]>{return this.request("/api/v1/organizations/"+encodeURIComponent(organizationId)+"/smart-order/catalog/categories");}
  createSmartOrderCategory(organizationId:string,payload:import("@salesx-ai/api-contracts").SmartOrderCategoryWrite):Promise<import("@salesx-ai/api-contracts").SmartOrderCategory>{return this.request("/api/v1/organizations/"+encodeURIComponent(organizationId)+"/smart-order/catalog/categories",{method:"POST",body:JSON.stringify(payload)});}
  listSmartOrderBrands(organizationId:string):Promise<import("@salesx-ai/api-contracts").SmartOrderBrand[]>{return this.request("/api/v1/organizations/"+encodeURIComponent(organizationId)+"/smart-order/catalog/brands");}
  listSmartOrderUnits(organizationId:string):Promise<import("@salesx-ai/api-contracts").SmartOrderUnit[]>{return this.request("/api/v1/organizations/"+encodeURIComponent(organizationId)+"/smart-order/catalog/units");}
  createSmartOrderBrand(organizationId:string,payload:import("@salesx-ai/api-contracts").SmartOrderBrandWrite):Promise<Record<string,unknown>>{return this.request("/api/v1/organizations/"+encodeURIComponent(organizationId)+"/smart-order/catalog/brands",{method:"POST",body:JSON.stringify(payload)});}
  createSmartOrderUnit(organizationId:string,payload:import("@salesx-ai/api-contracts").SmartOrderUnitWrite):Promise<Record<string,unknown>>{return this.request("/api/v1/organizations/"+encodeURIComponent(organizationId)+"/smart-order/catalog/units",{method:"POST",body:JSON.stringify(payload)});}
  uploadSmartOrderProductImage(organizationId:string,productId:string,content:Blob,mimeType:"image/jpeg"|"image/png"|"image/webp",altText?:string,sortOrder=0):Promise<Record<string,unknown>>{return this.request("/api/v1/organizations/"+encodeURIComponent(organizationId)+"/smart-order/products/"+encodeURIComponent(productId)+"/images",{method:"POST",headers:{"Content-Type":mimeType,"X-Alt-Text":altText??"","X-Sort-Order":String(sortOrder)},body:content});}
  grantSmartOrderCatalogAccess(organizationId:string,payload:import("@salesx-ai/api-contracts").SmartOrderCatalogAccessWrite):Promise<Record<string,unknown>>{return this.request("/api/v1/organizations/"+encodeURIComponent(organizationId)+"/smart-order/catalog/access",{method:"POST",body:JSON.stringify(payload)});}
  listSmartOrderPriceLists(organizationId:string):Promise<import("@salesx-ai/api-contracts").SmartOrderPriceList[]>{return this.request("/api/v1/organizations/"+encodeURIComponent(organizationId)+"/smart-order/pricing/price-lists");}
  createSmartOrderPriceList(organizationId:string,payload:import("@salesx-ai/api-contracts").SmartOrderPriceListWrite):Promise<import("@salesx-ai/api-contracts").SmartOrderPriceList>{return this.request("/api/v1/organizations/"+encodeURIComponent(organizationId)+"/smart-order/pricing/price-lists",{method:"POST",body:JSON.stringify(payload)});}
  listSmartOrderStockMovements(organizationId:string,page=1,pageSize=50,variantId?:string,warehouseId?:string):Promise<import("@salesx-ai/api-contracts").SmartOrderStockMovementPage>{const q=new URLSearchParams({page:String(page),page_size:String(pageSize)});if(variantId)q.set("variant_id",variantId);if(warehouseId)q.set("warehouse_id",warehouseId);return this.request("/api/v1/organizations/"+encodeURIComponent(organizationId)+"/smart-order/inventory/movements?"+q.toString());}
  listSmartOrderWarehouses(organizationId:string):Promise<import("@salesx-ai/api-contracts").SmartOrderWarehouse[]>{return this.request("/api/v1/organizations/"+encodeURIComponent(organizationId)+"/smart-order/warehouses");}
  createSmartOrderWarehouse(organizationId:string,payload:import("@salesx-ai/api-contracts").SmartOrderWarehouseWrite):Promise<import("@salesx-ai/api-contracts").SmartOrderWarehouse>{return this.request("/api/v1/organizations/"+encodeURIComponent(organizationId)+"/smart-order/warehouses",{method:"POST",body:JSON.stringify(payload)});}
  transferSmartOrderStock(organizationId:string,payload:import("@salesx-ai/api-contracts").SmartOrderStockTransferWrite):Promise<Record<string,unknown>>{return this.request("/api/v1/organizations/"+encodeURIComponent(organizationId)+"/smart-order/inventory/transfers",{method:"POST",body:JSON.stringify(payload)});}
  cancelSmartOrderOrder(organizationId:string,orderId:string,reason:string):Promise<import("@salesx-ai/api-contracts").SmartOrderOrder>{return this.request("/api/v1/organizations/"+encodeURIComponent(organizationId)+"/smart-order/orders/"+encodeURIComponent(orderId)+"/cancel",{method:"POST",body:JSON.stringify({reason})});}


  listSmartOrderPartnerOrganizations(organizationId:string):Promise<import("@salesx-ai/api-contracts").SmartOrderPartnerOrganization[]>{return this.request("/api/v1/organizations/"+encodeURIComponent(organizationId)+"/smart-order/partner-organizations");}
  createSmartOrderPartnerLink(organizationId:string,payload:import("@salesx-ai/api-contracts").SmartOrderPartnerLinkWrite):Promise<Record<string,unknown>>{return this.request("/api/v1/organizations/"+encodeURIComponent(organizationId)+"/smart-order/partner-links",{method:"POST",body:JSON.stringify(payload)});}
  setSmartOrderAssistedCustomer(organizationId:string,customerOrganizationId:string):Promise<Record<string,unknown>>{return this.request("/api/v1/organizations/"+encodeURIComponent(organizationId)+"/smart-order/cart/assisted-customer",{method:"POST",body:JSON.stringify({customer_organization_id:customerOrganizationId})});}


  listSmartOrderPriceHistory(organizationId:string,priceListId:string,page=1,pageSize=50):Promise<import("@salesx-ai/api-contracts").SmartOrderPriceHistoryPage>{const q=new URLSearchParams({page:String(page),page_size:String(pageSize)});return this.request("/api/v1/organizations/"+encodeURIComponent(organizationId)+"/smart-order/pricing/price-lists/"+encodeURIComponent(priceListId)+"/history?"+q.toString());}


  listSmartOrderApprovalPolicies(organizationId:string):Promise<import("@salesx-ai/api-contracts").SmartOrderApprovalPolicy[]>{return this.request("/api/v1/organizations/"+encodeURIComponent(organizationId)+"/smart-order/approval-policies");}
  createSmartOrderApprovalPolicy(organizationId:string,payload:import("@salesx-ai/api-contracts").SmartOrderApprovalPolicyWrite):Promise<import("@salesx-ai/api-contracts").SmartOrderApprovalPolicy>{return this.request("/api/v1/organizations/"+encodeURIComponent(organizationId)+"/smart-order/approval-policies",{method:"POST",body:JSON.stringify(payload)});}

  signOut(scope: "local" | "global" | "others" = "local"): Promise<void> {
    return this.request<void>("/api/v1/auth/sign-out", {
      method: "POST",
      body: JSON.stringify({ scope }),
    });
  }
}
