'use client';

import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { SalesXAuthClient, AuthClientError, type AuthSession, type SessionStorage } from "@salesx-ai/auth-client";
import { SalesXApiClient } from "@salesx-ai/api-client";
import type { AuthContext as SalesXAuthContextData, PortalKey } from "@salesx-ai/shared-types";
import { canAccessPortal as permissionCanAccessPortal, hasPermission as permissionHasPermission } from "@salesx-ai/permissions";

type AuthStatus = "loading" | "unauthenticated" | "authenticated" | "configuration_error" | "error";
interface SalesXAuthValue {
  status: AuthStatus;
  session: AuthSession | null;
  context: SalesXAuthContextData | null;
  activeMembership: SalesXAuthContextData["memberships"][number] | null;
  activeOrganizationId: string | null;
  error: string | null;
  signInWithPassword(email:string,password:string):Promise<void>;
  signUp(email:string,password:string):Promise<boolean>;
  signInWithOAuth(provider:"google"):Promise<void>;
  linkIdentity(provider:"google"):Promise<void>;
  unlinkIdentity(identityId:string):Promise<void>;
  requestPasswordReset(email:string):Promise<void>;
  updatePassword(password:string):Promise<void>;
  signInWithOtp(phone:string):Promise<void>;
  verifyOtp(phone:string,token:string):Promise<void>;
  signOut(scope?:"local"|"global"|"others"):Promise<void>;
  completeAuthCallback():Promise<"authenticated"|"recovery"|"none">;
  switchAccount():Promise<void>;
  setActiveOrganization(id:string):void;
  hasPermission(permission:string):boolean;
  canAccessPortal(portal:PortalKey):boolean;
  apiFetch(path:string,init?:RequestInit):Promise<Response>;
}
const SalesXAuthContext=createContext<SalesXAuthValue|null>(null);
const supabaseUrl=process.env.NEXT_PUBLIC_SUPABASE_URL??"";
const publishableKey=process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY??"";
const apiOrigin=(process.env.NEXT_PUBLIC_SALESX_API_URL??"").replace(/\/$/,"");

export function SalesXAuthProvider({children}:{children:React.ReactNode}) {
  const [client,setClient]=useState<SalesXAuthClient|null>(null);
  const [status,setStatus]=useState<AuthStatus>("loading");
  const [session,setSession]=useState<AuthSession|null>(null);
  const [context,setContext]=useState<SalesXAuthContextData|null>(null);
  const [activeOrganizationId,setActiveOrganizationIdState]=useState<string|null>(null);
  const [error,setError]=useState<string|null>(null);
  const hydrating=useRef(false);
  const apiClient=useMemo(()=>client?new SalesXApiClient({
    baseUrl:apiOrigin,
    platform:"web",
    auth:{
      getAccessToken:async()=>(await client.getSession())?.access_token??null,
      refreshAccessToken:async()=>(await client.refreshSession())?.access_token??null,
      getOrganizationId:()=>activeOrganizationId,
      onSessionInvalidated:async()=>{
        await client.clearSession();
        setSession(null);setContext(null);setActiveOrganizationIdState(null);setStatus("unauthenticated");
      },
    },
  }):null,[client,activeOrganizationId]);

  useEffect(()=>{
    if(!supabaseUrl||!publishableKey||!apiOrigin) {
      setError("NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY dan NEXT_PUBLIC_SALESX_API_URL wajib dikonfigurasi.");
      setStatus("configuration_error");return;
    }
    const storage:SessionStorage={
      getItem:async key=>window.localStorage.getItem(key),
      setItem:async(key,value)=>window.localStorage.setItem(key,value),
      removeItem:async key=>window.localStorage.removeItem(key),
    };
    const oauthStorage:SessionStorage={
      getItem:async key=>window.sessionStorage.getItem(key),
      setItem:async(key,value)=>window.sessionStorage.setItem(key,value),
      removeItem:async key=>window.sessionStorage.removeItem(key),
    };
    setClient(new SalesXAuthClient({supabaseUrl,publishableKey,storage,oauthStorage,storageKey:"salesx-web-auth"}));
  },[]);

  const loadContext=useCallback(async(current:AuthSession)=>{
    if(!apiClient)throw new Error("FastAPI client belum dikonfigurasi.");
    const next=await apiClient.getAuthContext();
    setContext(next);
    setActiveOrganizationIdState(previous=>
      previous&&next.memberships.some(m=>m.organization_id===previous&&m.status==="active")
        ?previous:next.memberships.find(m=>m.status==="active")?.organization_id??null);
    await apiClient.registerCurrentSession({platform:"web",device_name:"SalesX-Ai Web Portal"});
    const resolvedSession=client?await client.getSession():null;
    setSession(resolvedSession??current);setStatus("authenticated");setError(null);
  },[apiClient,client]);

  const hydrate=useCallback(async(authClient:SalesXAuthClient)=>{
    if(hydrating.current)return;
    hydrating.current=true;
    try {
      const current=await authClient.getSession();
      if(!current) {
        setSession(null);setContext(null);setActiveOrganizationIdState(null);
        setStatus("unauthenticated");setError(null);return;
      }
      setStatus("loading");
      await loadContext(current);
    } catch(cause) {
      const message=cause instanceof Error?cause.message:"Sesi tidak dapat dipulihkan.";
      if(cause instanceof AuthClientError&&(cause.status===401||cause.status===403)) {
        await authClient.clearSession();
        setSession(null);setContext(null);setActiveOrganizationIdState(null);setStatus("unauthenticated");
      } else {
        setStatus("error");setError(message);
      }
    } finally {hydrating.current=false;}
  },[loadContext]);

  useEffect(()=>{
    if(!client)return;
    void hydrate(client);
    const unsubscribe=client.subscribe(next=>setSession(next));
    const onStorage=(event:StorageEvent)=>{
      if(event.key==="salesx-web-auth")void hydrate(client);
    };
    const onOnline=()=>void hydrate(client);
    window.addEventListener("storage",onStorage);
    window.addEventListener("online",onOnline);
    return()=>{unsubscribe();window.removeEventListener("storage",onStorage);window.removeEventListener("online",onOnline);};
  },[client,hydrate]);

  const signInWithPassword=useCallback(async(email:string,password:string)=>{
    if(!client)throw new Error("Supabase Auth belum siap.");
    const next=await client.signInWithPassword(email.trim(),password);
    await loadContext(next);
  },[client,loadContext]);

  const signUp=useCallback(async(email:string,password:string)=>{
    if(!client)throw new Error("Supabase Auth belum siap.");
    const redirect=window.location.origin+"/auth/callback";
    const next=await client.signUp(email.trim(),password,redirect);
    if(next)await loadContext(next);
    return !next;
  },[client,loadContext]);

  const signInWithOAuth=useCallback(async(provider:"google")=>{
    if(!client)throw new Error("Supabase Auth belum siap.");
    const authorizationUrl=await client.signInWithOAuth(provider,window.location.origin+"/auth/callback");
    window.location.assign(authorizationUrl);
  },[client]);

  const linkIdentity=useCallback(async(provider:"google")=>{
    if(!client)throw new Error("Supabase Auth belum siap.");
    const authorizationUrl=await client.beginIdentityLink(provider,window.location.origin+"/auth/callback?identity_link=1");
    window.location.assign(authorizationUrl);
  },[client]);

  const unlinkIdentity=useCallback(async(identityId:string)=>{
    if(!client)throw new Error("Supabase Auth belum siap.");
    const current=await client.getSession();
    if(!current)throw new Error("Sesi autentikasi tidak tersedia.");
    const response=await fetch(apiOrigin+"/api/v1/auth/identities/"+encodeURIComponent(identityId),{
      method:"DELETE",headers:{Authorization:"Bearer "+current.access_token,"X-Client-Platform":"web"},cache:"no-store",
    });
    if(!response.ok){
      const body=await response.json().catch(()=>({}));
      throw new Error(body?.error?.message??"Identitas tidak dapat dilepas.");
    }
    await hydrate(client);
  },[client,hydrate]);

  const completeAuthCallback=useCallback(async()=>{
    if(!client)throw new Error("Supabase Auth belum siap.");
    const params=new URLSearchParams(window.location.search);
    const tokenHash=params.get("token_hash");
    const type=params.get("type");
    const oauthError=params.get("error");
    const code=params.get("code");
    let next:AuthSession|null=null;
    if(oauthError) {
      await client.cancelOAuthFlow();
      throw new AuthClientError(params.get("error_description")??"OAuth provider authorization was denied.",400,oauthError);
    }
    if(code) {
      next=await client.completeOAuthCallback(code,params.get("oauth_state")??params.get("state"));
    } else {
      next=await client.acceptOAuthCallback(window.location.hash);
    }
    if(!next&&tokenHash) {
      next=await client.verifyEmailToken(tokenHash,
        type==="recovery"?"recovery":type==="invite"?"invite":type==="magiclink"?"magiclink":type==="email_change"?"email_change":"signup");
    }
    if(!next)return "none" as const;
    await loadContext(next);
    return type==="recovery"?"recovery" as const:"authenticated" as const;
  },[client,loadContext]);

  const requestPasswordReset=useCallback(async(email:string)=>{
    if(!client)throw new Error("Supabase Auth belum siap.");
    await client.recoverPassword(email.trim(),window.location.origin+"/auth/callback?flow=recovery");
  },[client]);

  const updatePassword=useCallback(async(password:string)=>{
    if(!client)throw new Error("Supabase Auth belum siap.");
    await client.updatePassword(password);
  },[client]);

  const signInWithOtp=useCallback(async(phone:string)=>{
    if(!client)throw new Error("Supabase Auth belum siap.");
    await client.signInWithOtp(phone.trim());
  },[client]);

  const verifyOtp=useCallback(async(phone:string,token:string)=>{
    if(!client)throw new Error("Supabase Auth belum siap.");
    const next=await client.verifyOtp(phone.trim(),token.trim());
    await loadContext(next);
  },[client,loadContext]);

  const signOut=useCallback(async(scope:"local"|"global"|"others"="local")=>{
    if(!client)throw new Error("Supabase Auth belum siap.");
    const current=await client.getSession();
    if(!current) {
      await client.clearSession();
      setSession(null);setContext(null);setActiveOrganizationIdState(null);setStatus("unauthenticated");
      return;
    }
    if(current&&apiOrigin) {
      try {
        const response=await fetch(apiOrigin+"/api/v1/auth/sign-out",{
          method:"POST",
          headers:{Authorization:"Bearer "+current.access_token,"Content-Type":"application/json","X-Client-Platform":"web"},
          body:JSON.stringify({scope}),cache:"no-store",
        });
        if(!response.ok)throw new Error("FastAPI tidak mengonfirmasi remote session revocation.");
      } catch(remoteError) {
        setError(remoteError instanceof Error?remoteError.message:"Remote logout belum terkonfirmasi.");
        // Fallback calls Supabase Auth directly. This still revokes refresh-token sessions.
        await client.signOut(scope);
      }
    } else if(current) {
      await client.signOut(scope);
    }
    if(scope!=="others") {
      await client.clearSession();
      setSession(null);setContext(null);setActiveOrganizationIdState(null);setStatus("unauthenticated");
    } else if(current) {
      setSession(current);
    }
  },[client]);

  const switchAccount=useCallback(async()=>{
    await signOut("local");
    setContext(null);setActiveOrganizationIdState(null);
  },[signOut]);

  const setActiveOrganization=useCallback((id:string)=>{
    if(!context?.memberships.some(m=>m.organization_id===id&&m.status==="active"))
      throw new Error("Membership aktif untuk organisasi tersebut tidak ditemukan.");
    setActiveOrganizationIdState(id);
  },[context]);

  const activeMembership=useMemo(
    ()=>context?.memberships.find(m=>m.organization_id===activeOrganizationId&&m.status==="active")??null,
    [context,activeOrganizationId],
  );
  const hasPermission=useCallback((permission:string)=>
    permissionHasPermission([...(activeMembership?.permissions??[]),...(context?.platform_permissions??[])],permission as never),[activeMembership]);
  const canAccessPortal=useCallback((portal:PortalKey)=>
    permissionCanAccessPortal([...(activeMembership?.permissions??[]),...(context?.platform_permissions??[])],portal),[activeMembership]);

  const apiFetch=useCallback(async(path:string,init:RequestInit={})=>{
    if(!apiClient)throw new Error("Supabase Auth atau FastAPI belum dikonfigurasi.");
    return apiClient.fetch(path,init);
  },[apiClient]);

  const value=useMemo<SalesXAuthValue>(()=>({
    status,session,context,activeMembership,activeOrganizationId,error,
    signInWithPassword,signUp,signInWithOAuth,linkIdentity,unlinkIdentity,
    requestPasswordReset,updatePassword,signInWithOtp,verifyOtp,signOut,completeAuthCallback,switchAccount,
    setActiveOrganization,hasPermission,canAccessPortal,apiFetch,
  }),[status,session,context,activeMembership,activeOrganizationId,error,signInWithPassword,
    signUp,signInWithOAuth,linkIdentity,unlinkIdentity,requestPasswordReset,updatePassword,
    signInWithOtp,verifyOtp,signOut,completeAuthCallback,switchAccount,setActiveOrganization,hasPermission,canAccessPortal,apiFetch]);
  return <SalesXAuthContext.Provider value={value}>{children}</SalesXAuthContext.Provider>;
}

export function useSalesXAuth(){
  const value=useContext(SalesXAuthContext);
  if(!value)throw new Error("useSalesXAuth must be used inside SalesXAuthProvider.");
  return value;
}
