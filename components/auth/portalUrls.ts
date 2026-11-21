import type {PortalKey} from "@salesx-ai/shared-types";
export type SalesXPortal="sales"|"customer"|"company"|"distributor"|"principal"|"supervisor"|"super_admin";

const origin=(value:string|undefined,fallback:string)=> (value?.trim()||fallback).replace(/\/$/,"");
const website=()=>origin(process.env.NEXT_PUBLIC_SALESX_WEBSITE_URL,"https://salesx-website-production.up.railway.app");
const customer=()=>origin(process.env.NEXT_PUBLIC_SALESX_CUSTOMER_URL,"https://salesx-customer-production.up.railway.app");
const company=()=>origin(process.env.NEXT_PUBLIC_SALESX_COMPANY_URL,"https://salesx-company-production.up.railway.app");

export function getSalesXPortalUrl(portal:SalesXPortal):string{
 switch(portal){
  case "sales":return website()+"/portal";
  case "customer":return customer()+"/";
  case "company":return company()+"/";
  case "distributor":return company()+"/distributor";
  case "principal":return company()+"/principal";
  case "supervisor":return company()+"/supervisor";
  case "super_admin":return company()+"/super-admin";
 }
}

export function getSalesXPortalUrlForPath(path:string):string{
 const normalized=path.replace(/\/$/,"")||"/";
 if(normalized==="/portal"||normalized.startsWith("/portal/"))return website()+normalized;
 if(normalized.startsWith("/sales"))return getSalesXPortalUrl("sales");
 if(normalized==="/customer")return getSalesXPortalUrl("customer");
 if(normalized.startsWith("/customer/"))return customer()+normalized;
 if(normalized==="/company")return getSalesXPortalUrl("company");
 if(normalized.startsWith("/company/"))return company()+normalized;
 if(normalized==="/distributor/portal"||normalized.startsWith("/distributor/portal/"))return company()+"/distributor"+normalized.slice("/distributor/portal".length);
 if(normalized==="/principal/portal"||normalized.startsWith("/principal/portal/"))return company()+"/principal"+normalized.slice("/principal/portal".length);
 if(normalized==="/supervisor/portal"||normalized.startsWith("/supervisor/portal/"))return company()+"/supervisor"+normalized.slice("/supervisor/portal".length);
 if(normalized==="/admin/portal"||normalized.startsWith("/admin/portal/"))return company()+"/super-admin"+normalized.slice("/admin/portal".length);
 if(normalized==="/distributor"||normalized.startsWith("/distributor/"))return company()+normalized;
 if(normalized==="/principal"||normalized.startsWith("/principal/"))return company()+normalized;
 if(normalized==="/supervisor"||normalized.startsWith("/supervisor/"))return company()+normalized;
 if(normalized==="/super-admin"||normalized.startsWith("/super-admin/"))return company()+normalized;
 if(normalized.startsWith("/admin"))return company()+"/super-admin"+normalized.slice("/admin".length);
 return website()+normalized;
}

export function getSalesXPortalKeyForPath(path:string):PortalKey|null{
 const normalized=path.replace(/\/$/,"")||"/";
 if(normalized==="/portal"||normalized.startsWith("/sales"))return "sales";
 if(normalized==="/customer"||normalized.startsWith("/customer/"))return "customer";
 if(normalized==="/company"||normalized.startsWith("/company/"))return "company";
 if(normalized==="/distributor"||normalized.startsWith("/distributor/"))return "distributor";
 if(normalized==="/principal"||normalized.startsWith("/principal/"))return "principal";
 if(normalized==="/supervisor"||normalized.startsWith("/supervisor/"))return "supervisor";
 if(normalized==="/super-admin"||normalized.startsWith("/super-admin/")||normalized.startsWith("/admin"))return "super_admin";
 return null;
}
