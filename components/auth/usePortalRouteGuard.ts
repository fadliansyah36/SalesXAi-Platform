'use client';

import {useEffect} from "react";
import {getSalesXPortalUrlForPath,getSalesXPortalKeyForPath} from "@/components/auth/portalUrls";
import {getPreferredPortalPath} from "@salesx-ai/permissions";
import type {PortalKey} from "@salesx-ai/shared-types";
import {useSalesXAuth} from "@/components/providers/AppProviders";

/** UX routing guard only. FastAPI remains the authorization authority for every API action. */
export function usePortalRouteGuard(portal:PortalKey){
 const auth=useSalesXAuth();
 useEffect(()=>{
  if(auth.status!=="authenticated"||auth.canAccessPortal(portal))return;
  const permissions=[
   ...(auth.activeMembership?.permissions??[]),
   ...(auth.context?.platform_permissions??[]),
  ];
  const destination=getPreferredPortalPath(permissions);
  const target=destination?getSalesXPortalKeyForPath(destination):null;
  if(target){
   void auth.createPortalHandoff(target).then(url=>window.location.replace(url)).catch(()=>window.location.replace(getSalesXPortalUrlForPath(destination!)));
  }else window.location.replace(getSalesXPortalUrlForPath("/"));
 },[auth.status,auth.activeMembership,auth.context,auth.canAccessPortal,auth.createPortalHandoff,portal]);
}
