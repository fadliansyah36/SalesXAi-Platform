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

type OAuthPending = {
 state:string;
 codeVerifier:string;
 flow:"signin"|"link";
 userId:string|null;
 createdAt:number;
};

function base64Url(bytes:Uint8Array):string {
 const alphabet="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_";
 let output="";
 for(let i=0;i<bytes.length;i+=3){
  const a=bytes[i],b=i+1<bytes.length?bytes[i+1]:0,d=i+2<bytes.length?bytes[i+2]:0;
  output+=alphabet[a>>2];
  output+=alphabet[((a&3)<<4)|(b>>4)];
  if(i+1<bytes.length)output+=alphabet[((b&15)<<2)|(d>>6)];
  if(i+2<bytes.length)output+=alphabet[d&63];
 }
 return output;
}

function secureRandom(size:number):Uint8Array {
 const source=(globalThis as {crypto?:{getRandomValues?<T extends ArrayBufferView>(array:T):T}}).crypto;
 if(!source?.getRandomValues)throw new Error("Secure random generation is unavailable in this runtime.");
 return source.getRandomValues(new Uint8Array(size));
}

function sha256(input:Uint8Array):Uint8Array {
 const k=[
  0x428a2f98,0x71374491,0xb5c0fbcf,0xe9b5dba5,0x3956c25b,0x59f111f1,0x923f82a4,0xab1c5ed5,
  0xd807aa98,0x12835b01,0x243185be,0x550c7dc3,0x72be5d74,0x80deb1fe,0x9bdc06a7,0xc19bf174,
  0xe49b69c1,0xefbe4786,0x0fc19dc6,0x240ca1cc,0x2de92c6f,0x4a7484aa,0x5cb0a9dc,0x76f988da,
  0x983e5152,0xa831c66d,0xb00327c8,0xbf597fc7,0xc6e00bf3,0xd5a79147,0x06ca6351,0x14292967,
  0x27b70a85,0x2e1b2138,0x4d2c6dfc,0x53380d13,0x650a7354,0x766a0abb,0x81c2c92e,0x92722c85,
  0xa2bfe8a1,0xa81a664b,0xc24b8b70,0xc76c51a3,0xd192e819,0xd6990624,0xf40e3585,0x106aa070,
  0x19a4c116,0x1e376c08,0x2748774c,0x34b0bcb5,0x391c0cb3,0x4ed8aa4a,0x5b9cca4f,0x682e6ff3,
  0x748f82ee,0x78a5636f,0x84c87814,0x8cc70208,0x90befffa,0xa4506ceb,0xbef9a3f7,0xc67178f2,
 ];
 const bitLength=input.length*8;
 const paddedLength=Math.ceil((input.length+9)/64)*64;
 const padded=new Uint8Array(paddedLength);
 padded.set(input);padded[input.length]=0x80;
 const view=new DataView(padded.buffer);
 view.setUint32(paddedLength-8,Math.floor(bitLength/0x100000000),false);
 view.setUint32(paddedLength-4,bitLength>>>0,false);
 const h=[0x6a09e667,0xbb67ae85,0x3c6ef372,0xa54ff53a,0x510e527f,0x9b05688c,0x1f83d9ab,0x5be0cd19];
 const rotr=(x:number,n:number)=>(x>>>n)|(x<<(32-n));
 for(let offset=0;offset<paddedLength;offset+=64){
  const w=new Uint32Array(64);
  for(let i=0;i<16;i++)w[i]=view.getUint32(offset+i*4,false);
  for(let i=16;i<64;i++){
   const x=w[i-15],y=w[i-2];
   const s0=rotr(x,7)^rotr(x,18)^(x>>>3);
   const s1=rotr(y,17)^rotr(y,19)^(y>>>10);
   w[i]=(w[i-16]+s0+w[i-7]+s1)>>>0;
  }
  let [a,b,c,d,e,f,g,hh]=h;
  for(let i=0;i<64;i++){
   const s1=rotr(e,6)^rotr(e,11)^rotr(e,25);
   const ch=(e&f)^(~e&g);
   const t1=(hh+s1+ch+k[i]+w[i])>>>0;
   const s0=rotr(a,2)^rotr(a,13)^rotr(a,22);
   const maj=(a&b)^(a&c)^(b&c);
   const t2=(s0+maj)>>>0;
   hh=g;g=f;f=e;e=(d+t1)>>>0;d=c;c=b;b=a;a=(t1+t2)>>>0;
  }
  h[0]=(h[0]+a)>>>0;h[1]=(h[1]+b)>>>0;h[2]=(h[2]+c)>>>0;h[3]=(h[3]+d)>>>0;
  h[4]=(h[4]+e)>>>0;h[5]=(h[5]+f)>>>0;h[6]=(h[6]+g)>>>0;h[7]=(h[7]+hh)>>>0;
 }
 const output=new Uint8Array(32);
 const outView=new DataView(output.buffer);
 h.forEach((value,index)=>outView.setUint32(index*4,value,false));
 return output;
}

function verifierBytes(value:string):Uint8Array { return Uint8Array.from(value.split("").map(char=>char.charCodeAt(0))); }

function constantTimeEqual(left:string,right:string):boolean {
 if(left.length!==right.length)return false;
 let mismatch=0;
 for(let i=0;i<left.length;i++)mismatch|=left.charCodeAt(i)^right.charCodeAt(i);
 return mismatch===0;
}

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
 private async createOAuthPending(flow:"signin"|"link",userId:string|null):Promise<OAuthPending> {
  const verifier=base64Url(secureRandom(32));
  const state=base64Url(secureRandom(32));
  const pending:OAuthPending={state,codeVerifier:verifier,flow,userId,createdAt:Date.now()};
  await this.storage.setItem(this.storageKey+":oauth-pending",JSON.stringify(pending));
  return pending;
 }
 async signInWithOAuth(provider:"google",redirectTo:string):Promise<string> {
  const pending=await this.createOAuthPending("signin",null);
  const url=new URL(this.baseUrl+"/auth/v1/authorize");
  url.searchParams.set("provider",provider);
  const callback = new URL(redirectTo);
  callback.searchParams.set("oauth_state",pending.state);
  url.searchParams.set("redirect_to",callback.toString());
  url.searchParams.set("code_challenge",base64Url(sha256(verifierBytes(pending.codeVerifier))));
  url.searchParams.set("code_challenge_method","s256");
  return url.toString();
 }
 async beginIdentityLink(provider:"google",redirectTo:string):Promise<string> {
  const session=await this.getSession();
  if(!session)throw new AuthClientError("Authenticated session required to link an identity.",401,"unauthenticated");
  const pending=await this.createOAuthPending("link",session.user.id);
  const url=new URL(this.baseUrl+"/auth/v1/user/identities/authorize");
  url.searchParams.set("provider",provider);
  const callback = new URL(redirectTo);
  callback.searchParams.set("oauth_state",pending.state);
  url.searchParams.set("redirect_to",callback.toString());
  url.searchParams.set("code_challenge",base64Url(sha256(verifierBytes(pending.codeVerifier))));
  url.searchParams.set("code_challenge_method","s256");
  url.searchParams.set("skip_http_redirect","true");
  const response=await this.fetcher(url.toString(),{
   headers:{apikey:this.key,Authorization:"Bearer "+session.access_token},
   redirect:"follow",
  });
  const data=await response.json().catch(()=>({}));
  if(!response.ok||typeof data.url!=="string"){
   await this.storage.removeItem(this.storageKey+":oauth-pending");
   throw new AuthClientError("Supabase did not start identity linking.",response.status);
  }
  return data.url;
 }
 async completeOAuthCallback(code:string,state:string|null):Promise<AuthSession> {
  const raw=await this.storage.getItem(this.storageKey+":oauth-pending");
  if(!raw)throw new AuthClientError("OAuth callback has no matching pending authorization.",400,"oauth_state_missing");
  let pending:OAuthPending;
  try{pending=JSON.parse(raw) as OAuthPending;}catch{
   await this.storage.removeItem(this.storageKey+":oauth-pending");
   throw new AuthClientError("OAuth authorization state is invalid.",400,"oauth_state_invalid");
  }
  if(!state||!constantTimeEqual(pending.state,state)||Date.now()-pending.createdAt>10*60*1000){
   await this.storage.removeItem(this.storageKey+":oauth-pending");
   throw new AuthClientError("OAuth state validation failed or expired.",400,"oauth_state_mismatch");
  }
  if(!code)throw new AuthClientError("OAuth authorization code is missing.",400,"oauth_code_missing");
  const session=await this.request<AuthSession>("token?grant_type=pkce",{
   method:"POST",body:JSON.stringify({auth_code:code,code_verifier:pending.codeVerifier}),
  });
  await this.storage.removeItem(this.storageKey+":oauth-pending");
  if(pending.flow==="link"&&pending.userId&&session.user?.id!==pending.userId){
   try{await this.request<void>("logout?scope=local",{method:"POST"},session.access_token);}catch{}
   throw new AuthClientError("Linked identity did not resolve to the original authenticated account.",403,"identity_link_account_mismatch");
  }
  await this.saveSession(session);
  return session;
 }
 async cancelOAuthFlow():Promise<void> {
  await this.storage.removeItem(this.storageKey+":oauth-pending");
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
   } catch(error){if(error instanceof AuthClientError&&[400,401,403].includes(error.status))await this.clearSession();throw error;}
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
  await this.storage.removeItem(this.storageKey+":oauth-pending");
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
