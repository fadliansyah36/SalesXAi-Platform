import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AppState, Linking, Platform } from "react-native";
import * as SecureStore from "expo-secure-store";
import { AuthClientError, SalesXAuthClient, type AuthSession, type SessionStorage } from "@salesx-ai/auth-client";
import type { AuthContext } from "@salesx-ai/shared-types";

export type MobileAuthStatus="loading"|"unauthenticated"|"authenticated"|"configuration_error"|"error";
const supabaseUrl=process.env.EXPO_PUBLIC_SUPABASE_URL??"";
const publishableKey=process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY??"";
const apiOrigin=(process.env.EXPO_PUBLIC_SALESX_API_URL??"").replace(/\/$/,"");
const redirectUrl="salesxai://auth/callback";

export function useMobileSalesAuth(){
 const [client,setClient]=useState<SalesXAuthClient|null>(null);
 const [status,setStatus]=useState<MobileAuthStatus>("loading");
 const [session,setSession]=useState<AuthSession|null>(null);
 const [context,setContext]=useState<AuthContext|null>(null);
 const [activeOrganizationId,setActiveOrganizationIdState]=useState<string|null>(null);
 const [error,setError]=useState<string|null>(null);
 const [recoveryPending,setRecoveryPending]=useState(false);
 const busy=useRef(false);

 useEffect(()=>{
  if(!supabaseUrl||!publishableKey||!apiOrigin){
   setError("EXPO_PUBLIC_SUPABASE_URL, EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY dan EXPO_PUBLIC_SALESX_API_URL wajib dikonfigurasi.");
   setStatus("configuration_error");return;
  }
  const storage:SessionStorage={
   getItem:key=>SecureStore.getItemAsync(key),
   setItem:(key,value)=>SecureStore.setItemAsync(key,value,{keychainAccessible:SecureStore.AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY}),
   removeItem:key=>SecureStore.deleteItemAsync(key),
  };
  setClient(new SalesXAuthClient({supabaseUrl,publishableKey,storage,storageKey:"salesx-mobile-auth-v1"}));
 },[]);

 const loadContext=useCallback(async(current:AuthSession)=>{
  const response=await fetch(apiOrigin+"/api/v1/auth/me",{
   headers:{Authorization:"Bearer "+current.access_token,"X-Client-Platform":Platform.OS==="ios"?"ios":"android"},
   cache:"no-store",
  });
  const body=await response.json().catch(()=>({}));
  if(!response.ok)throw new AuthClientError(body?.error?.message??"FastAPI menolak sesi.",response.status,body?.error?.code);
  const next=body as AuthContext;
  setContext(next);
  setActiveOrganizationIdState(previous=>
   previous&&next.memberships.some(m=>m.organization_id===previous&&m.status==="active")
    ?previous:next.memberships.find(m=>m.status==="active")?.organization_id??null);
  const registered=await fetch(apiOrigin+"/api/v1/auth/sessions/current",{
   method:"POST",
   headers:{Authorization:"Bearer "+current.access_token,"Content-Type":"application/json","X-Client-Platform":Platform.OS==="ios"?"ios":"android"},
   body:JSON.stringify({platform:Platform.OS==="ios"?"ios":"android",device_name:"SalesX-Ai Mobile Sales"}),
   cache:"no-store",
  });
  if(!registered.ok)throw new Error("Sesi tidak dapat diregistrasikan ke FastAPI.");
  setSession(current);setStatus("authenticated");setError(null);
 },[]);

 const hydrate=useCallback(async(authClient:SalesXAuthClient)=>{
  if(busy.current)return;
  busy.current=true;
  try{
   const current=await authClient.getSession();
   if(!current){
    setSession(null);setContext(null);setActiveOrganizationIdState(null);
    setStatus("unauthenticated");setError(null);return;
   }
   setStatus("loading");
   await loadContext(current);
  }catch(cause){
   if(cause instanceof AuthClientError&&(cause.status===401||cause.status===403)){
    await authClient.clearSession();
    setSession(null);setContext(null);setActiveOrganizationIdState(null);setStatus("unauthenticated");
   }else{
    setStatus("error");
    setError(cause instanceof Error?cause.message:"Koneksi terputus. Coba pulihkan sesi saat jaringan tersedia.");
   }
  }finally{busy.current=false;}
 },[loadContext]);

 const handleAuthUrl=useCallback(async(url:string|null|undefined)=>{
  if(!url||!client)return;
  try{
   const parsedUrl=new URL(url);
   const params=parsedUrl.searchParams;
   const tokenHash=params.get("token_hash");
   const flowType=params.get("type")??params.get("flow")??"signup";
   let next:AuthSession|null=await client.acceptOAuthCallback(url.includes("#")?url.slice(url.indexOf("#")+1):"");
   if(!next&&tokenHash){
    next=await client.verifyEmailToken(tokenHash,
     flowType==="recovery"?"recovery":flowType==="invite"?"invite":flowType==="magiclink"?"magiclink":flowType==="email_change"?"email_change":"signup");
   }
   if(next){
    setRecoveryPending(flowType==="recovery");
    await loadContext(next);
   }
  }catch(cause){setError(cause instanceof Error?cause.message:"Callback autentikasi tidak valid.");setStatus("error");}
 },[client,loadContext]);

 useEffect(()=>{
  if(!client)return;
  void hydrate(client);
  const unsubscribe=client.subscribe(setSession);
  void Linking.getInitialURL().then(handleAuthUrl);
  const linkSubscription=Linking.addEventListener("url",event=>void handleAuthUrl(event.url));
  const appStateSubscription=AppState.addEventListener("change",state=>{
   if(state==="active")void hydrate(client);
  });
  return()=>{unsubscribe();linkSubscription.remove();appStateSubscription.remove();};
 },[client,hydrate,handleAuthUrl]);

 const signInWithPassword=useCallback(async(identifier:string,password:string)=>{
  if(!client)throw new Error("Supabase Auth belum siap.");
  const next=await client.signInWithPassword(identifier.trim(),password);
  await loadContext(next);
 },[client,loadContext]);

 const signUp=useCallback(async(email:string,password:string)=>{
  if(!client)throw new Error("Supabase Auth belum siap.");
  const next=await client.signUp(email.trim(),password,redirectUrl);
  if(next)await loadContext(next);
  return !next;
 },[client,loadContext]);

 const signInWithOtp=useCallback(async(phone:string)=>{
  if(!client)throw new Error("Supabase Auth belum siap.");
  await client.signInWithOtp(phone.trim());
 },[client]);

 const verifyOtp=useCallback(async(phone:string,token:string)=>{
  if(!client)throw new Error("Supabase Auth belum siap.");
  const next=await client.verifyOtp(phone.trim(),token.trim());
  await loadContext(next);
 },[client,loadContext]);

 const signInWithOAuth=useCallback(async()=>{
  const url=new URL(supabaseUrl+"/auth/v1/authorize");
  url.searchParams.set("provider","google");
  url.searchParams.set("redirect_to",redirectUrl);
  await Linking.openURL(url.toString());
 },[]);

 const linkIdentity=useCallback(async()=>{
  if(!client)throw new Error("Supabase Auth belum siap.");
  const current=await client.getSession();
  if(!current)throw new Error("Masuk sebelum menghubungkan identity.");
  const url=new URL(supabaseUrl+"/auth/v1/authorize");
  url.searchParams.set("provider","google");
  url.searchParams.set("redirect_to",redirectUrl);
  url.searchParams.set("link_identity","true");
  url.searchParams.set("skip_http_redirect","true");
  const response=await fetch(url.toString(),{headers:{apikey:publishableKey,Authorization:"Bearer "+current.access_token}});
  const body=await response.json().catch(()=>({}));
  if(!response.ok||typeof body.url!=="string")throw new Error("Supabase tidak dapat memulai identity linking.");
  await Linking.openURL(body.url);
 },[client]);

 const requestPasswordReset=useCallback(async(email:string)=>{
  if(!client)throw new Error("Supabase Auth belum siap.");
  await client.recoverPassword(email.trim(),redirectUrl+"?flow=recovery");
 },[client]);

 const updatePassword=useCallback(async(password:string)=>{
  if(!client)throw new Error("Supabase Auth belum siap.");
  await client.updatePassword(password);setRecoveryPending(false);
 },[client]);

 const signOut=useCallback(async(scope:"local"|"global"|"others"="local")=>{
  if(!client)throw new Error("Supabase Auth belum siap.");
  let remoteConfirmed=false;
  try{
   const current=await client.getSession();
   if(!current)remoteConfirmed=true;
   if(current){
    try{
     const response=await fetch(apiOrigin+"/api/v1/auth/sign-out",{
      method:"POST",headers:{Authorization:"Bearer "+current.access_token,"Content-Type":"application/json","X-Client-Platform":Platform.OS==="ios"?"ios":"android"},
      body:JSON.stringify({scope}),cache:"no-store",
     });
     if(!response.ok)throw new Error("FastAPI tidak mengonfirmasi remote logout.");
     remoteConfirmed=true;
    }catch{
     try{await client.signOut(scope);remoteConfirmed=true;}catch{remoteConfirmed=false;}
    }
   }
  }finally{
   if(scope!=="others"){
    await client.clearSession();
    setSession(null);setContext(null);setActiveOrganizationIdState(null);setStatus("unauthenticated");
   }
  }
  if(!remoteConfirmed)throw new Error("Sesi lokal dibersihkan, tetapi remote refresh-token revocation belum terkonfirmasi.");
 },[client]);

 const switchAccount=useCallback(async()=>{
  await signOut("local");
  setContext(null);setActiveOrganizationIdState(null);setRecoveryPending(false);
 },[signOut]);

 const setActiveOrganization=useCallback((id:string)=>{
  if(!context?.memberships.some(m=>m.organization_id===id&&m.status==="active"))
   throw new Error("Membership aktif untuk organisasi tersebut tidak ditemukan.");
  setActiveOrganizationIdState(id);
 },[context]);

 const apiRequest=useCallback(async<T=unknown>(path:string,init:RequestInit={})=>{
  if(!client)throw new Error("Supabase Auth belum siap.");
  let current=await client.getSession();
  if(!current)throw new Error("Sesi autentikasi tidak tersedia.");
  const send=(token:string)=>fetch(apiOrigin+path,{
   ...init,headers:{
    ...Object.fromEntries(new Headers(init.headers).entries()),
    Authorization:"Bearer "+token,
    "X-Client-Platform":Platform.OS==="ios"?"ios":"android",
    ...(activeOrganizationId?{"X-Organization-ID":activeOrganizationId}:{}),
    ...(init.body?{"Content-Type":"application/json"}:{}),
   },cache:"no-store",
  });
  let response=await send(current.access_token);
  if(response.status===401){
   try{current=await client.refreshSession();}
   catch(cause){
    if(cause instanceof AuthClientError&&[400,401,403].includes(cause.status)){
     await client.clearSession();setSession(null);setContext(null);setActiveOrganizationIdState(null);setStatus("unauthenticated");
    }
    throw cause;
   }
   if(!current)throw new Error("Sesi telah kedaluwarsa atau dicabut.");
   setSession(current);response=await send(current.access_token);
  }
  if(response.status===401||response.status===403){
   const body=await response.clone().json().catch(()=>({}));
   if(response.status===401||["session_revoked","account_inactive","identity_unverified"].includes(body?.error?.code)){
    await client.clearSession();setSession(null);setContext(null);setActiveOrganizationIdState(null);setStatus("unauthenticated");
   }
  }
  if(!response.ok){
   const body=await response.clone().json().catch(()=>({}));
   throw new Error(body?.error?.message??"FastAPI request failed.");
  }
  if(response.status===204)return undefined as T;
  return response.json() as Promise<T>;
 },[client,activeOrganizationId]);

 const unlinkIdentity=useCallback(async(identityId:string)=>{
  return apiRequest("/api/v1/auth/identities/"+encodeURIComponent(identityId),{method:"DELETE"});
 },[apiRequest]);

 const acceptInvitation=useCallback(async(token:string)=>{
  return apiRequest("/api/v1/organizations/invitations/accept",{method:"POST",body:JSON.stringify({token})});
 },[apiRequest]);

 const hasPermission=useCallback((permission:string)=>{
  const tenantPermissions=context?.memberships.find(m=>m.organization_id===activeOrganizationId)?.permissions??[];
  return tenantPermissions.includes(permission)||context?.platform_permissions.includes(permission)===true;
 },[context,activeOrganizationId]);

 return useMemo(()=>({
  status,session,context,activeOrganizationId,error,recoveryPending,
  signInWithPassword,signUp,signInWithOtp,verifyOtp,signInWithOAuth,linkIdentity,
  requestPasswordReset,updatePassword,signOut,switchAccount,setActiveOrganization,
  apiRequest,acceptInvitation,unlinkIdentity,hasPermission,retry:()=>client?hydrate(client):Promise.resolve(),
 }),[status,session,context,activeOrganizationId,error,recoveryPending,signInWithPassword,
  signUp,signInWithOtp,verifyOtp,signInWithOAuth,linkIdentity,requestPasswordReset,
  updatePassword,signOut,switchAccount,setActiveOrganization,apiRequest,acceptInvitation,unlinkIdentity,
  hasPermission,client,hydrate]);
}
