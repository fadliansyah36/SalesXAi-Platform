'use client';

import {useEffect} from "react";
import {useRouter} from "next/navigation";
import {getPreferredPortalPath} from "@salesx-ai/permissions";
import type {PortalKey} from "@salesx-ai/shared-types";
import {useSalesXAuth} from "@/components/providers/AppProviders";

/** UX routing guard only. FastAPI remains the authorization authority for every API action. */
export function usePortalRouteGuard(portal:PortalKey){
 const auth=useSalesXAuth();
 const router=useRouter();
 useEffect(()=>{
  if(auth.status!=="authenticated"||auth.canAccessPortal(portal))return;
  const permissions=[
   ...(auth.activeMembership?.permissions??[]),
   ...(auth.context?.platform_permissions??[]),
  ];
  router.replace(getPreferredPortalPath(permissions)??"/");
 },[auth.status,auth.activeMembership,auth.context,auth.canAccessPortal,portal,router]);
}
