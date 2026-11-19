type PortalKey="sales"|"company"|"customer"|"distributor"|"principal"|"supervisor"|"super_admin";
export const PERMISSIONS=[
  "account:read",
  "account:status:manage",
  "audit:read",
  "branch:manage",
  "branch:read",
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
