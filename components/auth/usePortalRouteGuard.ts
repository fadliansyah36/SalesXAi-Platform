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
  const priority:Record<string,number>={"/company":0,"/supervisor":1,"/distributor":2,"/principal":3,"/portal":4,"/customer":5};
  const targetMembership=memberships.map(membership=>({
    membership,
    destination:getPreferredPortalPath([...(auth.context?.platform_permissions??[]),...membership.permissions]),
  })).filter((candidate):candidate is {membership:typeof memberships[number];destination:string}=>Boolean(candidate.destination))
    .sort((a,b)=>(priority[a.destination]??99)-(priority[b.destination]??99))[0]??null;
  const destination=targetMembership?.destination??null;
  const target=destination?getSalesXPortalKeyForPath(destination):null;
  if(target&&targetMembership){
   auth.setActiveOrganization(targetMembership.membership.organization_id);
   void auth.createPortalHandoff(target,targetMembership.membership.organization_id).then(url=>window.location.replace(url)).catch(()=>window.location.replace(getSalesXPortalUrlForPath(destination!)));
  }else window.location.replace(getSalesXPortalUrlForPath("/"));
 },[auth.status,auth.activeMembership,auth.context,auth.canAccessPortal,auth.createPortalHandoff,auth.setActiveOrganization,portal]);
}
