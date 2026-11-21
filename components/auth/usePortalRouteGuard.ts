'use client';

import {useEffect,useRef} from "react";
import {getSalesXPortalUrlForPath,getSalesXPortalKeyForPath} from "@/components/auth/portalUrls";
import {getPreferredPortalPath} from "@salesx-ai/permissions";
import type {PortalKey} from "@salesx-ai/shared-types";
import {useSalesXAuth} from "@/components/providers/AppProviders";

/** UX routing guard only. FastAPI remains the authorization authority for every API action. */
export function usePortalRouteGuard(portal:PortalKey){
 const auth=useSalesXAuth();
 const redirecting=useRef(false);
 useEffect(()=>{
  if(auth.status!=="authenticated"||auth.canAccessPortal(portal)||redirecting.current)return;
  redirecting.current=true;
  const memberships=(auth.context?.memberships??[]).filter(membership=>membership.status==="active");
  const targetMembership=memberships.map(membership=>({
    membership,
    destination:getPreferredPortalPath([...(auth.context?.platform_permissions??[]),...membership.permissions]),
  })).find(candidate=>candidate.destination!==null);
  const destination=targetMembership?.destination??null;
  const target=destination?getSalesXPortalKeyForPath(destination):null;
  if(target&&targetMembership){
   auth.setActiveOrganization(targetMembership.membership.organization_id);
   void auth.createPortalHandoff(target,targetMembership.membership.organization_id).then(url=>window.location.replace(url)).catch(()=>window.location.replace(getSalesXPortalUrlForPath(destination!)));
  }else window.location.replace(getSalesXPortalUrlForPath("/"));
 },[auth.status,auth.activeMembership,auth.context,auth.canAccessPortal,auth.createPortalHandoff,auth.setActiveOrganization,portal]);
}
