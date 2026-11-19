'use client';

import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { AuthClientError, type AuthSession } from "@salesx-ai/auth-client";
import { SalesXApiClient } from "@salesx-ai/api-client";
import type { AuthContext as SalesXAuthContextData, PortalKey } from "@salesx-ai/shared-types";
import { canAccessPortal as permissionCanAccessPortal, hasPermission as permissionHasPermission } from "@salesx-ai/permissions";

type AuthStatus = "loading" | "unauthenticated" | "authenticated" | "configuration_error" | "error";
type WebSession = {
  user: { id: string; email?: string | null; phone?: string | null };
  expires_at: number;
  expires_in: number;
  token_type: string;
};
type AuthResponse = { session: WebSession | null; verification_required?: boolean };

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
  apiClient:SalesXApiClient|null;
}
const SalesXAuthContext=createContext<SalesXAuthValue|null>(null);

function browserSession(value:WebSession|null):AuthSession|null {
  if(!value)return null;
  // Access and refresh tokens stay in HttpOnly cookies; these empty fields preserve the
  // existing consumer type without exposing credential material to browser JavaScript.
  return {
    access_token:"",
    refresh_token:"",
    token_type:value.token_type||"bearer",
    expires_in:value.expires_in,
    expires_at:value.expires_at,
    user:{id:value.user.id,email:value.user.email??undefined,phone:value.user.phone??undefined},
  };
}

export function SalesXAuthProvider({children}:{children:React.ReactNode}) {
  const [status,setStatus]=useState<AuthStatus>("loading");
  const [session,setSession]=useState<AuthSession|null>(null);
  const [context,setContext]=useState<SalesXAuthContextData|null>(null);
  const [activeOrganizationId,setActiveOrganizationIdState]=useState<string|null>(null);
  const [error,setError]=useState<string|null>(null);
  const [consumerEpoch,setConsumerEpoch]=useState(0);
  const hydrating=useRef(false);
  const csrfToken=useRef("");
  const apiClientRef=useRef<SalesXApiClient|null>(null);

  const ensureCsrf=useCallback(async()=>{
    if(csrfToken.current)return csrfToken.current;
    const response=await fetch("/api/auth/csrf",{method:"GET",credentials:"same-origin",cache:"no-store"});
    const body=await response.json().catch(()=>({}));
    if(!response.ok||typeof body.csrfToken!=="string")throw new Error("CSRF session bootstrap failed.");
    csrfToken.current=body.csrfToken;
    return csrfToken.current;
  },[]);

  const authRequest=useCallback(async<T=Record<string,unknown>>(action:string,payload?:Record<string,unknown>):Promise<T>=>{
    const csrf=await ensureCsrf();
    const send=(token:string)=>fetch("/api/auth/"+action,{
      method:"POST",
      credentials:"same-origin",
      headers:{"Content-Type":"application/json","X-CSRF-Token":token},
      body:JSON.stringify(payload??{}),
      cache:"no-store",
    });
    let response=await send(csrf);
    let body=await response.json().catch(()=>({}));
    if(response.status===403&&body?.error?.code==="csrf_validation_failed"){
      csrfToken.current="";
      response=await send(await ensureCsrf());
      body=await response.json().catch(()=>({}));
    }
    if(!response.ok)throw new AuthClientError(
      body?.error?.message??"Web authentication request failed.",
      response.status,
      body?.error?.code,
    );
    return body as T;
  },[ensureCsrf]);

  const clearCookieSession=useCallback(async()=>{
    const send=(csrf:string)=>fetch("/api/auth/session",{
      method:"DELETE",
      credentials:"same-origin",
      headers:{"X-CSRF-Token":csrf},
      cache:"no-store",
    });
    let response=await send(await ensureCsrf());
    if(response.status===403){
      csrfToken.current="";
      response=await send(await ensureCsrf());
    }
    if(!response.ok)throw new Error("Web session cookie could not be cleared.");
  },[ensureCsrf]);

  const invalidateSession=useCallback(async()=>{
    try{await clearCookieSession();}catch{}
    setSession(null);setContext(null);setActiveOrganizationIdState(null);
    setStatus("unauthenticated");setError(null);setConsumerEpoch(value=>value+1);
  },[clearCookieSession]);

  const apiClient=useMemo(()=>new SalesXApiClient({
    baseUrl:"/api/backend",
    platform:"web",
    authMode:"cookie",
    auth:{
      getAccessToken:async()=>null,
      refreshAccessToken:async()=>null,
      refreshCookieSession:async()=>{
        try{await authRequest("refresh");return true;}
        catch{return false;}
      },
      getOrganizationId:()=>activeOrganizationId,
      onSessionInvalidated:invalidateSession,
    },
  }),[activeOrganizationId,authRequest,invalidateSession]);
  apiClientRef.current=apiClient;

  const loadContext=useCallback(async(current:WebSession)=>{
    const transport=apiClientRef.current;
    if(!transport)throw new Error("FastAPI cookie transport belum siap.");
    await transport.registerCurrentSession({platform:"web",device_name:"SalesX-Ai Web Portal"});
    const next=await transport.getAuthContext();
    setContext(next);
    setActiveOrganizationIdState(previous=>
      previous&&next.memberships.some(m=>m.organization_id===previous&&m.status==="active")
        ?previous:next.memberships.find(m=>m.status==="active")?.organization_id??null);
    setSession(browserSession(current));setStatus("authenticated");setError(null);
  },[]);

  const hydrate=useCallback(async()=>{
    if(hydrating.current)return;
    hydrating.current=true;
    try{
      await ensureCsrf();
      const response=await fetch("/api/auth/session",{method:"GET",credentials:"same-origin",cache:"no-store"});
      const body=await response.json().catch(()=>({session:null})) as AuthResponse;
      if(!response.ok||!body.session){
        setSession(null);setContext(null);setActiveOrganizationIdState(null);
        setStatus("unauthenticated");setError(null);return;
      }
      setStatus("loading");
      await loadContext(body.session);
    }catch(cause){
      setStatus("error");
      setError(cause instanceof Error?cause.message:"Web session could not be restored.");
    }finally{hydrating.current=false;}
  },[ensureCsrf,loadContext]);

  useEffect(()=>{
    // Remove the pre-BFF browser token store during the one-time HttpOnly migration.
    try{
      window.localStorage.removeItem("salesx-web-auth");
      window.localStorage.removeItem("salesx-web-auth:oauth-pending");
      window.sessionStorage.removeItem("salesx-web-auth:oauth-pending");
    }catch{}
    void hydrate();
    const onOnline=()=>void hydrate();
    const onFocus=()=>void hydrate();
    window.addEventListener("online",onOnline);
    window.addEventListener("focus",onFocus);
    return()=>{window.removeEventListener("online",onOnline);window.removeEventListener("focus",onFocus);};
  },[hydrate]);

  const acceptSession=useCallback(async(result:AuthResponse)=>{
    if(result.session)await loadContext(result.session);
    else{
      setSession(null);setContext(null);setActiveOrganizationIdState(null);setStatus("unauthenticated");
    }
  },[loadContext]);

  const signInWithPassword=useCallback(async(identifier:string,password:string)=>{
    const result=await authRequest<AuthResponse>("sign-in",{identifier:identifier.trim(),password});
    await acceptSession(result);
  },[authRequest,acceptSession]);

  const signUp=useCallback(async(email:string,password:string)=>{
    const result=await authRequest<AuthResponse>("sign-up",{email:email.trim().toLowerCase(),password});
    await acceptSession(result);
    return result.verification_required===true;
  },[authRequest,acceptSession]);

  const signInWithOAuth=useCallback(async(provider:"google")=>{
    const result=await authRequest<{authorization_url:string}>("oauth-start",{provider,flow:"signin"});
    if(!result.authorization_url)throw new Error("Supabase did not return an OAuth authorization URL.");
    window.location.assign(result.authorization_url);
  },[authRequest]);

  const linkIdentity=useCallback(async(provider:"google")=>{
    const result=await authRequest<{authorization_url:string}>("oauth-start",{provider,flow:"link"});
    if(!result.authorization_url)throw new Error("Supabase did not return an identity-link authorization URL.");
    window.location.assign(result.authorization_url);
  },[authRequest]);

  const unlinkIdentity=useCallback(async(identityId:string)=>{
    const transport=apiClientRef.current;
    if(!transport)throw new Error("FastAPI cookie transport belum siap.");
    await transport.unlinkIdentity(identityId);
    await hydrate();
  },[hydrate]);

  const completeAuthCallback=useCallback(async()=>{
    const params=new URLSearchParams(window.location.search);
    const tokenHash=params.get("token_hash");
    const type=params.get("type")??params.get("flow")??"signup";
    const oauthError=params.get("error");
    const code=params.get("code");
    let result:AuthResponse;
    if(oauthError){
      await authRequest("oauth-error",{state:params.get("oauth_state")??params.get("state")});
      throw new AuthClientError(params.get("error_description")??"OAuth provider authorization was denied.",400,oauthError);
    }
    if(code){
      const limited=await authRequest<AuthResponse>("oauth-complete",{
        code,state:params.get("oauth_state")??params.get("state")??"",
      });
      result=limited;
    }else if(tokenHash){
      result=await authRequest<AuthResponse>("verify",{
        token_hash:tokenHash,
        type:type==="recovery"?"recovery":type==="invite"?"invite":type==="magiclink"?"magiclink":type==="email_change"?"email_change":"signup",
      });
    }else return "none" as const;
    if(!result.session)return "none" as const;
    await acceptSession(result);
    return type==="recovery"?"recovery" as const:"authenticated" as const;
  },[authRequest,acceptSession]);

  const requestPasswordReset=useCallback(async(email:string)=>{
    await authRequest("recover",{email:email.trim().toLowerCase()});
  },[authRequest]);

  const updatePassword=useCallback(async(password:string)=>{
    await authRequest("update-password",{password});
  },[authRequest]);

  const signInWithOtp=useCallback(async(phone:string)=>{
    await authRequest("otp-send",{phone:phone.trim()});
  },[authRequest]);

  const verifyOtp=useCallback(async(phone:string,token:string)=>{
    const result=await authRequest<AuthResponse>("otp-verify",{phone:phone.trim(),token:token.trim()});
    await acceptSession(result);
  },[authRequest,acceptSession]);

  const signOut=useCallback(async(scope:"local"|"global"|"others"="local")=>{
    if(scope==="others"){
      await apiClient.signOut(scope);
      return;
    }
    try{
      await apiClient.signOut(scope);
    }catch{
      // Provider-native logout is attempted by the server BFF if the API cannot complete.
      try{await authRequest("sign-out",{scope});}catch{}
    }finally{
      await invalidateSession();
    }
  },[apiClient,authRequest,invalidateSession]);

  const switchAccount=useCallback(async()=>{
    await signOut("local");
    setContext(null);setActiveOrganizationIdState(null);
  },[signOut]);

  const setActiveOrganization=useCallback((id:string)=>{
    if(!context?.memberships.some(m=>m.organization_id===id&&m.status==="active"))
      throw new Error("Membership aktif untuk organisasi tersebut tidak ditemukan.");
    if(id!==activeOrganizationId)setConsumerEpoch(value=>value+1);
    setActiveOrganizationIdState(id);
  },[context,activeOrganizationId]);

  const activeMembership=useMemo(
    ()=>context?.memberships.find(m=>m.organization_id===activeOrganizationId&&m.status==="active")??null,
    [context,activeOrganizationId],
  );
  const permissionValues=[...(activeMembership?.permissions??[]),...(context?.platform_permissions??[])];
  const hasPermission=useCallback((permission:string)=>
    permissionHasPermission(permissionValues,permission as never),[activeMembership,context?.platform_permissions]);
  const canAccessPortal=useCallback((portal:PortalKey)=>
    permissionCanAccessPortal(permissionValues,portal),[activeMembership,context?.platform_permissions]);

  const apiFetch=useCallback(async(path:string,init:RequestInit={})=>{
    if(!apiClient)throw new Error("FastAPI cookie transport belum dikonfigurasi.");
    return apiClient.fetch(path,init);
  },[apiClient]);

  const value=useMemo<SalesXAuthValue>(()=>({
    status,session,context,activeMembership,activeOrganizationId,error,
    signInWithPassword,signUp,signInWithOAuth,linkIdentity,unlinkIdentity,
    requestPasswordReset,updatePassword,signInWithOtp,verifyOtp,signOut,completeAuthCallback,switchAccount,
    setActiveOrganization,hasPermission,canAccessPortal,apiFetch,apiClient,
  }),[status,session,context,activeMembership,activeOrganizationId,error,apiClient,signInWithPassword,
    signUp,signInWithOAuth,linkIdentity,unlinkIdentity,requestPasswordReset,updatePassword,
    signInWithOtp,verifyOtp,signOut,completeAuthCallback,switchAccount,setActiveOrganization,hasPermission,canAccessPortal,apiFetch]);
  return <SalesXAuthContext.Provider value={value}>
    <React.Fragment key={consumerEpoch}>{children}</React.Fragment>
  </SalesXAuthContext.Provider>;
}

export function useSalesXAuth(){
  const value=useContext(SalesXAuthContext);
  if(!value)throw new Error("useSalesXAuth must be used inside SalesXAuthProvider.");
  return value;
}
