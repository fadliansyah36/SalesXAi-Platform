export interface AuthUser {
 id:string; email?:string; phone?:string;
 identities?:Array<{id:string;provider:string;identity_data?:Record<string,unknown>}>;
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
/** Supabase Auth REST client. A platform secure-storage adapter is mandatory. */
export class SalesXAuthClient {
 private readonly baseUrl:string;
 private readonly key:string;
 private readonly storage:SessionStorage;
 private readonly fetcher:typeof fetch;
 private readonly storageKey:string;
 constructor(options:AuthClientOptions) {
  this.baseUrl=options.supabaseUrl.replace(/\/$/,"");
  this.key=options.publishableKey;
  this.storage=options.storage;
  this.fetcher=options.fetcher??fetch;
  this.storageKey=options.storageKey??"salesx-auth-session";
  if(!this.baseUrl||!this.key)throw new Error("Supabase URL and publishable key are required.");
 }
 private async request<T>(path:string,init:RequestInit={},token?:string):Promise<T> {
  const response=await this.fetcher(this.baseUrl+"/auth/v1/"+path,{
   ...init,headers:{apikey:this.key,"Content-Type":"application/json",
    ...(token?{Authorization:"Bearer "+token}:{}),...init.headers},
  });
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
  catch{await this.storage.removeItem(this.storageKey);return null;}
  const expires=session.expires_at??Math.floor(Date.now()/1000)+session.expires_in;
  if(expires>Math.floor(Date.now()/1000)+60)return session;
  return this.refreshSession(session.refresh_token);
 }
 async signUp(email:string,password:string,redirectTo?:string):Promise<AuthSession|null> {
  const data=await this.request<AuthSession|{user:AuthUser}>("signup",{
   method:"POST",body:JSON.stringify({email,password,options:redirectTo?{emailRedirectTo:redirectTo}:undefined}),
  });
  if("access_token" in data){await this.saveSession(data);return data;}
  return null;
 }
 async signInWithPassword(email:string,password:string):Promise<AuthSession> {
  const session=await this.request<AuthSession>("token?grant_type=password",{
   method:"POST",body:JSON.stringify({email,password}),
  });
  await this.saveSession(session);return session;
 }
 async refreshSession(refreshToken?:string):Promise<AuthSession|null> {
  let token=refreshToken;
  if(!token) {
   const raw=await this.storage.getItem(this.storageKey);
   if(!raw)return null;
   token=(JSON.parse(raw) as AuthSession).refresh_token;
  }
  try {
   const session=await this.request<AuthSession>("token?grant_type=refresh_token",{
    method:"POST",body:JSON.stringify({refresh_token:token}),
   });
   await this.saveSession(session);return session;
  } catch(error){await this.storage.removeItem(this.storageKey);throw error;}
 }
 async signOut(scope:"local"|"global"|"others"="local"):Promise<void> {
  const session=await this.getSession();
  try {
   if(session) await this.request<void>("logout?scope="+scope,{method:"POST"},session.access_token);
  } finally {
   await this.storage.removeItem(this.storageKey);
  }
 }
 async recoverPassword(email:string,redirectTo?:string):Promise<void> {
  await this.request<void>("recover",{method:"POST",body:JSON.stringify({email,redirect_to:redirectTo})});
 }
 async verifyEmail(email:string,token:string):Promise<AuthSession|null> {
  const data=await this.request<AuthSession|{user:AuthUser}>("verify",{
   method:"POST",body:JSON.stringify({email,token,type:"email"}),
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
 }
}
