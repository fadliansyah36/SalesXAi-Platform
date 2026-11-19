export interface AuthUser {
 id:string; email?:string; phone?:string;
 identities?:Array<{id:string;identity_id?:string;provider:string;identity_data?:Record<string,unknown>}>;
}
export interface AuthSession {
 access_token:string; refresh_token:string; token_type:string; expires_in:number; expires_at?:number; user:AuthUser;
}
export interface SessionStorage {
 getItem(key:string):Promise<string|null>;
 setItem(key:string,value:string):Promise<void>;
 removeItem(key:string):Promise<void>;
}
export interface AuthClientOptions {
 supabaseUrl:string; publishableKey:string; storage:SessionStorage; fetcher?:typeof fetch; storageKey?:string;
}
export class AuthClientError extends Error {
 constructor(message:string,public readonly status:number,public readonly code?:string) {
  super(message);this.name="AuthClientError";
 }
}
/** Supabase Auth REST client. Each platform must provide an appropriate session-storage adapter. */
export class SalesXAuthClient {
 private readonly baseUrl:string;
 private readonly key:string;
 private readonly storage:SessionStorage;
 private readonly fetcher:typeof fetch;
 private readonly storageKey:string;
 private readonly listeners=new Set<(session:AuthSession|null)=>void>();
 private refreshInFlight:Promise<AuthSession|null>|null=null;
 constructor(options:AuthClientOptions) {
  this.baseUrl=options.supabaseUrl.replace(/\/$/,"");
  this.key=options.publishableKey;
  this.storage=options.storage;
  this.fetcher=options.fetcher??fetch;
  this.storageKey=options.storageKey??"salesx-auth-session";
  if(!this.baseUrl||!this.key)throw new Error("Supabase URL and publishable key are required.");
 }
 subscribe(listener:(session:AuthSession|null)=>void):()=>void {
  this.listeners.add(listener);
  return ()=>this.listeners.delete(listener);
 }
 private emit(session:AuthSession|null):void {
  for(const listener of this.listeners) listener(session);
 }
 private async request<T>(path:string,init:RequestInit={},token?:string):Promise<T> {
  const headers=new Headers(init.headers);
  headers.set("apikey",this.key);
  headers.set("Content-Type","application/json");
  if(token)headers.set("Authorization","Bearer "+token);
  const response=await this.fetcher(this.baseUrl+"/auth/v1/"+path,{...init,headers});
  const body=await response.json().catch(()=>({}));
  if(!response.ok) {
   const message=typeof body.message==="string"?body.message:
    typeof body.msg==="string"?body.msg:"Supabase Auth request failed.";
   throw new AuthClientError(message,response.status,body.code);
  }
  return body as T;
 }
 async getSession():Promise<AuthSession|null> {
  const raw=await this.storage.getItem(this.storageKey);
  if(!raw)return null;
  let session:AuthSession;
  try{session=JSON.parse(raw) as AuthSession;}
  catch{await this.clearSession();return null;}
  const expires=session.expires_at??Math.floor(Date.now()/1000)+session.expires_in;
  if(expires>Math.floor(Date.now()/1000)+60)return session;
  return this.refreshSession(session.refresh_token);
 }
 async signUp(email:string,password:string,redirectTo?:string):Promise<AuthSession|null> {
  const endpoint="signup"+(redirectTo?"?redirect_to="+encodeURIComponent(redirectTo):"");
  const data=await this.request<AuthSession|{user:AuthUser}>(endpoint,{
   method:"POST",body:JSON.stringify({email,password}),
  });
  if("access_token" in data){await this.saveSession(data);return data;}
  return null;
 }
 async signInWithPassword(identifier:string,password:string):Promise<AuthSession> {
  const credentials=identifier.includes("@")?{email:identifier}:{phone:identifier};
  const session=await this.request<AuthSession>("token?grant_type=password",{
   method:"POST",body:JSON.stringify({...credentials,password}),
  });
  await this.saveSession(session);return session;
 }
 async signInWithOtp(phone:string):Promise<void> {
  await this.request("otp",{method:"POST",body:JSON.stringify({phone,create_user:false})});
 }
 async verifyOtp(phone:string,token:string):Promise<AuthSession> {
  const session=await this.request<AuthSession>("verify",{
   method:"POST",body:JSON.stringify({phone,token,type:"sms"}),
  });
  await this.saveSession(session);return session;
 }
 async signInWithOAuth(provider:"google",redirectTo:string):Promise<void> {
  const url=new URL(this.baseUrl+"/auth/v1/authorize");
  url.searchParams.set("provider",provider);
  url.searchParams.set("redirect_to",redirectTo);
  if(typeof window==="undefined")throw new Error("OAuth redirect requires a browser.");
  window.location.assign(url.toString());
 }
 async beginIdentityLink(provider:"google",redirectTo:string):Promise<void> {
  const session=await this.getSession();
  if(!session)throw new AuthClientError("Authenticated session required to link an identity.",401,"unauthenticated");
  const url=new URL(this.baseUrl+"/auth/v1/authorize");
  url.searchParams.set("provider",provider);
  url.searchParams.set("redirect_to",redirectTo);
  url.searchParams.set("link_identity","true");
  url.searchParams.set("skip_http_redirect","true");
  const response=await this.fetcher(url.toString(),{
   headers:{apikey:this.key,Authorization:"Bearer "+session.access_token},
   redirect:"follow",
  });
  const data=await response.json().catch(()=>({}));
  if(!response.ok||typeof data.url!=="string")throw new AuthClientError("Supabase did not start identity linking.",response.status);
  window.location.assign(data.url);
 }
 async acceptOAuthCallback(hash:string):Promise<AuthSession|null> {
  const params=new URLSearchParams(hash.replace(/^#/,""));
  const accessToken=params.get("access_token");
  const refreshToken=params.get("refresh_token");
  if(!accessToken||!refreshToken)return null;
  const user=await this.request<AuthUser>("user",{method:"GET"},accessToken);
  const expiresIn=Number(params.get("expires_in")??3600);
  const session:AuthSession={
   access_token:accessToken,refresh_token:refreshToken,token_type:params.get("token_type")??"bearer",
   expires_in:expiresIn,expires_at:Number(params.get("expires_at")??Math.floor(Date.now()/1000)+expiresIn),user,
  };
  await this.saveSession(session);
  return session;
 }
 async refreshSession(refreshToken?:string):Promise<AuthSession|null> {
  if(this.refreshInFlight)return this.refreshInFlight;
  this.refreshInFlight=(async()=>{
   let token=refreshToken;
   if(!token) {
    const raw=await this.storage.getItem(this.storageKey);
    if(!raw)return null;
    try{token=(JSON.parse(raw) as AuthSession).refresh_token;}
    catch{await this.clearSession();return null;}
   }
   try {
    const session=await this.request<AuthSession>("token?grant_type=refresh_token",{
     method:"POST",body:JSON.stringify({refresh_token:token}),
    });
    await this.saveSession(session);return session;
   } catch(error){await this.clearSession();throw error;}
  })();
  try{return await this.refreshInFlight;}finally{this.refreshInFlight=null;}
 }
 async signOut(scope:"local"|"global"|"others"="local"):Promise<void> {
  const session=await this.getSession();
  try {
   if(session)await this.request<void>("logout?scope="+scope,{method:"POST"},session.access_token);
  } finally {
   if(scope!=="others")await this.clearSession();
  }
 }
 async clearSession():Promise<void> {
  await this.storage.removeItem(this.storageKey);
  this.emit(null);
 }
 async recoverPassword(email:string,redirectTo?:string):Promise<void> {
  await this.request<void>("recover"+(redirectTo?"?redirect_to="+encodeURIComponent(redirectTo):""),{method:"POST",body:JSON.stringify({email})});
 }
 async verifyEmailToken(tokenHash:string,type:"signup"|"invite"|"magiclink"|"recovery"|"email_change"="signup"):Promise<AuthSession|null> {
  const data=await this.request<AuthSession|{user:AuthUser}>("verify",{
   method:"POST",body:JSON.stringify({token_hash:tokenHash,type}),
  });
  if("access_token" in data){await this.saveSession(data);return data;}
  return null;
 }
 async updatePassword(password:string):Promise<AuthUser> {
  const session=await this.getSession();
  if(!session)throw new AuthClientError("Authenticated session required.",401,"unauthenticated");
  return this.request<AuthUser>("user",{method:"PUT",body:JSON.stringify({password})},session.access_token);
 }
 async getUser():Promise<AuthUser|null> {
  const session=await this.getSession();
  return session?this.request<AuthUser>("user",{method:"GET"},session.access_token):null;
 }
 async saveSession(session:AuthSession):Promise<void> {
  const normalized={...session,expires_at:session.expires_at??Math.floor(Date.now()/1000)+session.expires_in};
  await this.storage.setItem(this.storageKey,JSON.stringify(normalized));
  this.emit(normalized);
 }
}
