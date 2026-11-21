type PortalKey="sales"|"company"|"customer"|"distributor"|"principal"|"supervisor"|"super_admin";
export const PERMISSIONS=[
  "account:read",
  "account:status:manage",
  "audit:read",
  "branch:manage",
  "branch:read",
  "team:read",
  "team:manage",
  "territory:read",
  "territory:manage",
  "outlet:read",
  "outlet:manage",
  "sales_profile:read",
  "sales_profile:manage",
  "assignment:read",
  "assignment:manage",
  "master_data:import",
  "master_data:export",
  "master_data:assignment_context:read",
  "identity:link:self",
  "identity:read:self",
  "identity:unlink:self",
  "organization:create",
  "organization:read",
  "organization:update",
  "organization:invitations:manage",
  "organization:members:manage",
  "organization:members:read",
  "portal:company:access",
  "portal:customer:access",
  "portal:distributor:access",
  "portal:principal:access",
  "portal:sales:access",
  "portal:super_admin:access",
  "portal:supervisor:access",
  "profile:read:self",
  "profile:update:self",
  "role:assign",
  "role:read",
  "smartteam:attendance:read",
  "smartteam:attendance:manage",
  "smartteam:attendance:correct",
  "smartteam:visit:read",
  "smartteam:visit:manage",
  "smartteam:visit:execute",
  "smartteam:activity:read",
  "smartteam:activity:manage",
  "smartteam:target:read",
  "smartteam:target:manage",
  "smartteam:dashboard:read",
] as const;
export type Permission=(typeof PERMISSIONS)[number];
/** UX helper only; FastAPI remains the authorization authority. */
export function hasPermission(values:readonly string[]|null|undefined,permission:Permission):boolean {
 return Boolean(values?.includes(permission));
}
const portalPermission:Record<PortalKey,Permission>={
 sales:"portal:sales:access",company:"portal:company:access",customer:"portal:customer:access",
 distributor:"portal:distributor:access",principal:"portal:principal:access",
 supervisor:"portal:supervisor:access",super_admin:"portal:super_admin:access",
};
/** Navigation hint only; each API route must independently enforce policy. */
export function canAccessPortal(values:readonly string[]|null|undefined,portal:PortalKey):boolean {
 return hasPermission(values,portalPermission[portal]);
}

export * from "./action-matrix";

/** Returns a role-first destination for ordinary portal navigation. Platform administration is intentionally excluded. */
export function getPreferredPortalPath(values:readonly string[]|null|undefined):string|null {
 const candidates:Array<[Permission,string]>=[
  ["portal:company:access","/company"],
  ["portal:supervisor:access","/supervisor"],
  ["portal:distributor:access","/distributor"],
  ["portal:principal:access","/principal"],
  ["portal:sales:access","/portal"],
  ["portal:customer:access","/customer"],
 ];
 return candidates.find(([permission])=>hasPermission(values,permission))?.[1]??null;
}
