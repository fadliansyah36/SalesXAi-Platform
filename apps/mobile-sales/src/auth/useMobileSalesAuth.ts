import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AppState, Linking, Platform } from "react-native";
import * as SecureStore from "expo-secure-store";
import { AuthClientError, SalesXAuthClient, type AuthSession, type SessionStorage } from "@salesx-ai/auth-client";
import { SalesXApiClient } from "@salesx-ai/api-client";
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
 const processedAuthUrls=useRef<Set<string>>(new Set());
 const apiClient=useMemo(()=>client?new SalesXApiClient({
  baseUrl:apiOrigin,
  platform:Platform.OS==="ios"?"ios":"android",
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
 const apiClientRef=useRef<SalesXApiClient|null>(null);
 apiClientRef.current=apiClient;

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
  const transport=apiClientRef.current;
  if(!transport)throw new Error("FastAPI client belum dikonfigurasi.");
  const next=await transport.getAuthContext();
  setContext(next);
  setActiveOrganizationIdState(previous=>
   previous&&next.memberships.some(m=>m.organization_id===previous&&m.status==="active")
    ?previous:next.memberships.find(m=>m.status==="active")?.organization_id??null);
  await transport.registerCurrentSession({
   platform:Platform.OS==="ios"?"ios":"android",
   device_name:"SalesX-Ai Mobile Sales",
  });
  const resolvedSession=client?await client.getSession():null;
  setSession(resolvedSession??current);setStatus("authenticated");setError(null);
 },[client]);

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
  if(!url||!client||processedAuthUrls.current.has(url))return;
  processedAuthUrls.current.add(url);
  try{
   const parsedUrl=new URL(url);
   const params=parsedUrl.searchParams;
   const tokenHash=params.get("token_hash");
   const invitationToken=params.get("organization_invite");
   const flowType=params.get("type")??params.get("flow")??"signup";
   const oauthError=params.get("error");
   const code=params.get("code");
   if(oauthError){
    await client.cancelOAuthFlow();
    throw new AuthClientError(params.get("error_description")??"OAuth provider authorization was denied.",400,oauthError);
   }
   let next:AuthSession|null=null;
   if(code)next=await client.completeOAuthCallback(code,params.get("oauth_state")??params.get("state"));
   else next=await client.acceptOAuthCallback(url.includes("#")?url.slice(url.indexOf("#")+1):"");
   if(!next&&tokenHash){
    next=await client.verifyEmailToken(tokenHash,
     flowType==="recovery"?"recovery":flowType==="invite"?"invite":flowType==="magiclink"?"magiclink":flowType==="email_change"?"email_change":"signup");
   }
   if(next){
    setRecoveryPending(flowType==="recovery");
    await loadContext(next);
    if(invitationToken){
     const transport=apiClientRef.current;
     if(!transport)throw new Error("FastAPI client belum dikonfigurasi.");
     await transport.request("/api/v1/organizations/invitations/accept",{
      method:"POST",
      body:JSON.stringify({token:invitationToken}),
     });
     await loadContext(next);
    }
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
  if(!client)throw new Error("Supabase Auth belum siap.");
  const authorizationUrl=await client.signInWithOAuth("google",redirectUrl);
  await Linking.openURL(authorizationUrl);
 },[client]);

 const linkIdentity=useCallback(async()=>{
  if(!client)throw new Error("Supabase Auth belum siap.");
  const authorizationUrl=await client.beginIdentityLink("google",redirectUrl);
  await Linking.openURL(authorizationUrl);
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
  if(!apiClient)throw new Error("Supabase Auth atau FastAPI belum dikonfigurasi.");
  return apiClient.request<T>(path,init);
 },[apiClient]);

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
