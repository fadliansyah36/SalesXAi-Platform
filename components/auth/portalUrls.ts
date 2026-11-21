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
 if(normalized==="/portal"||normalized.startsWith("/sales"))return getSalesXPortalUrl("sales");
 if(normalized==="/customer")return getSalesXPortalUrl("customer");
 if(normalized==="/company")return getSalesXPortalUrl("company");
 if(normalized==="/distributor"||normalized.startsWith("/distributor/"))return getSalesXPortalUrl("distributor");
 if(normalized==="/principal"||normalized.startsWith("/principal/"))return getSalesXPortalUrl("principal");
 if(normalized==="/supervisor"||normalized.startsWith("/supervisor/"))return getSalesXPortalUrl("supervisor");
 if(normalized==="/super-admin"||normalized.startsWith("/super-admin/")||normalized.startsWith("/admin"))return getSalesXPortalUrl("super_admin");
 return website()+normalized;
}

export function getSalesXPortalKeyForPath(path:string):PortalKey|null{
 const normalized=path.replace(/\/$/,"")||"/";
 if(normalized==="/portal"||normalized.startsWith("/sales"))return "sales";
 if(normalized==="/customer")return "customer";
 if(normalized==="/company")return "company";
 if(normalized==="/distributor"||normalized.startsWith("/distributor/"))return "distributor";
 if(normalized==="/principal"||normalized.startsWith("/principal/"))return "principal";
 if(normalized==="/supervisor"||normalized.startsWith("/supervisor/"))return "supervisor";
 if(normalized==="/super-admin"||normalized.startsWith("/admin"))return "super_admin";
 return null;
}
