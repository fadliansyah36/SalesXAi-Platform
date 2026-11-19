type PortalKey="sales"|"company"|"customer"|"distributor"|"principal"|"supervisor"|"super_admin";
export const PERMISSIONS=[\n  "account:status:manage",\n  "audit:read",\n  "branch:manage",\n  "branch:read",\n  "identity:read:self",\n  "identity:unlink:self",\n  "organization:create",\n  "organization:read",\n  "organization:update",\n  "organization:invitations:manage",\n  "organization:members:manage",\n  "organization:members:read",\n  "portal:company:access",\n  "portal:customer:access",\n  "portal:distributor:access",\n  "portal:principal:access",\n  "portal:sales:access",\n  "portal:super_admin:access",\n  "portal:supervisor:access",\n  "profile:read:self",\n  "profile:update:self",\n  "role:assign",\n] as const;
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
