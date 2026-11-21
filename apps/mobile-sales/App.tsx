import React, { useCallback, useEffect, useState } from "react";
import { AppState } from "react-native";
import * as SecureStore from "expo-secure-store";
import { ActivityIndicator, Pressable, ScrollView, StatusBar, TextInput } from "react-native";
import { useFonts } from "expo-font";
import { PlusJakartaSans_400Regular } from "@expo-google-fonts/plus-jakarta-sans/400Regular";
import { PlusJakartaSans_500Medium } from "@expo-google-fonts/plus-jakarta-sans/500Medium";
import { PlusJakartaSans_600SemiBold } from "@expo-google-fonts/plus-jakarta-sans/600SemiBold";
import { PlusJakartaSans_700Bold } from "@expo-google-fonts/plus-jakarta-sans/700Bold";
import { JetBrainsMono_400Regular } from "@expo-google-fonts/jetbrains-mono/400Regular";
import { JetBrainsMono_500Medium } from "@expo-google-fonts/jetbrains-mono/500Medium";
import { JetBrainsMono_600SemiBold } from "@expo-google-fonts/jetbrains-mono/600SemiBold";
import { NativeInline, NativePageShell, NativeStack, NativeSurface, NativeText, NativeThemeProvider, NativeThemeToggle, useNativeTheme } from "@salesx-ai/design-system/native";
import { useMobileSalesAuth } from "./src/auth/useMobileSalesAuth";
import { SmartTeamHome } from "./src/smart-team/SmartTeamHome";
import { SmartOrderHome } from "./src/smart-order/SmartOrderHome";
import { SmartRewardHome } from "./src/smart-reward/SmartRewardHome";
import { AnalyticsHome } from "./src/analytics/AnalyticsHome";
import { LocationTrackingControl } from "./src/location/LocationTrackingControl";
import "./src/location/locationTracking";

type AuthState=ReturnType<typeof useMobileSalesAuth>;
type AuthMode="login"|"signup"|"recovery"|"otp";
type Session={auth_session_id:string;device_name:string|null;platform:string;last_seen_at:string|null;expires_at:string|null;revoked_at:string|null;current:boolean};
type Identity={id:string;provider:string;email:string|null;is_primary:boolean;created_at:string};
type AssignmentContext={sales_profile:Record<string,unknown>|null;assignments:Array<Record<string,unknown>>};

function Field({value,onChangeText,placeholder,secureTextEntry=false,keyboardType="default"}:{
 value:string;onChangeText:(value:string)=>void;placeholder:string;secureTextEntry?:boolean;keyboardType?:"default"|"email-address"|"phone-pad"
}){
 const {colors}=useNativeTheme();
 return <TextInput value={value} onChangeText={onChangeText} placeholder={placeholder}
  placeholderTextColor={colors.textMuted} secureTextEntry={secureTextEntry}
  keyboardType={keyboardType} autoCapitalize={keyboardType==="email-address"?"none":"sentences"}
  style={{padding:14,borderRadius:12,borderWidth:1,borderColor:colors.border,color:colors.textPrimary}}/>;
}

function Action({label,onPress,disabled=false,secondary=false}:{label:string;onPress:()=>void;disabled?:boolean;secondary?:boolean}){
 const {colors}=useNativeTheme();
 return <Pressable disabled={disabled} onPress={onPress} style={{padding:14,borderRadius:12,backgroundColor:secondary?colors.surface:colors.primary,borderWidth:secondary?1:0,borderColor:colors.border,opacity:disabled?0.45:1}}>
  <NativeText weight="semibold" color={secondary?colors.textPrimary:colors.surface}>{label}</NativeText>
 </Pressable>;
}

function SalesHome({auth}:{auth:AuthState}){
 const {colors,theme}=useNativeTheme();
 const [mode,setMode]=useState<AuthMode>("login");
 const [activeShiftId,setActiveShiftId]=useState<string|null>(null);
 const [shiftContextReady,setShiftContextReady]=useState(false);
 const onShiftContextChange=useCallback((shiftId:string|null,ready:boolean)=>{setActiveShiftId(shiftId);setShiftContextReady(ready);},[]);
 const [email,setEmail]=useState("");
 const [phone,setPhone]=useState("");
 const [password,setPassword]=useState("");
 const [confirmation,setConfirmation]=useState("");
 const [otp,setOtp]=useState("");
 const [otpSent,setOtpSent]=useState(false);
 const [notice,setNotice]=useState("");
 const [busy,setBusy]=useState(false);
 const [sessions,setSessions]=useState<Session[]>([]);
 const [identities,setIdentities]=useState<Identity[]>([]);
 const [assignmentContext,setAssignmentContext]=useState<AssignmentContext|null>(null);
 const [assignmentContextOffline,setAssignmentContextOffline]=useState(false);
 const canReadAssignmentContext=auth.canPerformApiAction("master.assignments.context.read");
 const canReadSessions=auth.canPerformApiAction("identity.session.list");
 const canRevokeSessions=auth.canPerformApiAction("identity.session.revoke");
 const canReadIdentities=auth.canPerformApiAction("identity.link.list");
 const canLinkIdentity=auth.canPerformApiAction("identity.link.authorize");
 const canUnlinkIdentity=auth.canPerformApiAction("identity.link.unlink");

 useEffect(()=>{
  const api=auth.apiClient;
  if(auth.status!=="authenticated"||!api){setSessions([]);setIdentities([]);return;}
  let active=true;
  const jobs:Promise<void>[]=[];
  if(canReadSessions)jobs.push(api.listSessions().then(items=>{if(active)setSessions(items);}));
  else setSessions([]);
  if(canReadIdentities)jobs.push(api.listLinkedIdentities().then(items=>{if(active)setIdentities(items);}));
  else setIdentities([]);
  void Promise.all(jobs).catch(error=>{
   if(active)setNotice(error instanceof Error?error.message:"Data identitas tidak dapat dimuat.");
  });
  return()=>{active=false;};
 },[auth.status,auth.apiClient,auth.contextEpoch,canReadSessions,canReadIdentities]);


 useEffect(()=>{
  const api=auth.apiClient;
  const organizationId=auth.activeOrganizationId;
  const cacheKey=organizationId&&auth.context?.user.id?"salesx-assignment-context:"+auth.context.user.id+":"+organizationId:null;
  if(auth.status!=="authenticated"||!api||!organizationId||!canReadAssignmentContext){
   setAssignmentContext(null);setAssignmentContextOffline(false);return;
  }
  let active=true;
  let refreshing=false;
  const refresh=async()=>{
   if(refreshing)return;
   refreshing=true;
   try{
    const result=await api.getMySalesAssignmentContext(organizationId);
    if(!active)return;
    setAssignmentContext(result as AssignmentContext);
    setAssignmentContextOffline(false);
    if(cacheKey)await SecureStore.setItemAsync(cacheKey,JSON.stringify(result));
   }catch(error){
    if(!active)return;
    if(cacheKey){
     const cached=await SecureStore.getItemAsync(cacheKey);
     if(cached){try{setAssignmentContext(JSON.parse(cached) as AssignmentContext);setAssignmentContextOffline(true);}catch{}}
    }
    setNotice(error instanceof Error?error.message:"Konteks assignment tidak dapat diperbarui.");
   }finally{refreshing=false;}
  };
  void refresh();
  const subscription=AppState.addEventListener("change",state=>{if(state==="active")void refresh();});
  const heartbeat=setInterval(()=>{if(AppState.currentState==="active")void refresh();},30_000);
  return()=>{active=false;subscription.remove();clearInterval(heartbeat);};
 },[auth.status,auth.apiClient,auth.activeOrganizationId,auth.contextEpoch,canReadAssignmentContext]);

 async function revokeDeviceSession(sessionId:string){
  if(!canRevokeSessions)throw new Error("Permission pencabutan sesi tidak tersedia.");
  const api=auth.apiClient;
  if(!api)throw new Error("FastAPI client belum dikonfigurasi.");
  await api.revokeSession(sessionId);
  setSessions(await api.listSessions());
 }

 async function run(action:()=>Promise<unknown>,success:string){
  setBusy(true);setNotice("");
  try{await action();setNotice(success);}
  catch(e){setNotice(e instanceof Error?e.message:"Permintaan autentikasi gagal.");}
  finally{setBusy(false);}
 }

 const activeMembership=auth.context?.memberships.find(m=>m.organization_id===auth.activeOrganizationId);
 return <>
  <StatusBar barStyle={theme==="dark"?"light-content":"dark-content"}/>
  <NativePageShell>
   <ScrollView contentContainerStyle={{flexGrow:1,paddingBottom:32}} keyboardShouldPersistTaps="handled">
    <NativeStack gap="6">
     <NativeInline gap="3" style={{justifyContent:"space-between"}}>
      <NativeStack gap="0">
       <NativeText variant="title" weight="bold">SalesX-Ai</NativeText>
       <NativeText variant="caption" color={colors.textSecondary}>MOBILE SALES PLATFORM</NativeText>
      </NativeStack>
      <NativeThemeToggle/>
     </NativeInline>

     {auth.status==="loading"&&<NativeSurface elevation="sm" radius="2xl" style={{padding:24}}>
      <NativeInline gap="3"><ActivityIndicator color={colors.primary}/><NativeText>Memulihkan sesi terenkripsi…</NativeText></NativeInline>
     </NativeSurface>}

     {(auth.status==="configuration_error"||auth.status==="error")&&<NativeSurface elevation="sm" radius="2xl" style={{padding:20}}>
      <NativeText variant="title" weight="semibold">{auth.status==="configuration_error"?"Konfigurasi autentikasi":"Koneksi sesi terganggu"}</NativeText>
      <NativeText color={colors.textSecondary}>{auth.error??"Periksa konfigurasi dan koneksi jaringan."}</NativeText>
      <Action label="Coba lagi" onPress={()=>void auth.retry()} secondary/>
     </NativeSurface>}

     {auth.status==="authenticated"&&<NativeSurface elevation="sm" radius="2xl" style={{padding:24}}>
      <NativeStack gap="4">
       <NativeText variant="caption" weight="bold" color={colors.primary}>SESSION TERVERIFIKASI</NativeText>
       <NativeText variant="heading" weight="bold">Selamat datang</NativeText>
       <NativeText color={colors.textSecondary}>{auth.context?.user.email??"Akun SalesX-Ai"}</NativeText>
       {auth.recoveryPending&&<NativeStack gap="3">
        <NativeText variant="title" weight="semibold">Atur password baru</NativeText>
        <Field value={password} onChangeText={setPassword} placeholder="Password baru (minimal 12 karakter)" secureTextEntry/>
        <Field value={confirmation} onChangeText={setConfirmation} placeholder="Konfirmasi password" secureTextEntry/>
        <Action label={busy?"Menyimpan…":"Perbarui password"} disabled={busy||password.length<12||password!==confirmation} onPress={()=>void run(async()=>{await auth.updatePassword(password);setPassword("");setConfirmation("");},"Password diperbarui.")}/>
       </NativeStack>}
       <NativeText variant="title" weight="semibold">Organisasi aktif</NativeText>
       {auth.context?.memberships.filter(m=>m.status==="active").map(m=><Pressable key={m.id} onPress={()=>auth.setActiveOrganization(m.organization_id)} style={{padding:14,borderRadius:12,borderWidth:1,borderColor:auth.activeOrganizationId===m.organization_id?colors.primary:colors.border}}>
        <NativeText weight="semibold">{m.organization_name}</NativeText>
        <NativeText variant="caption" color={colors.textSecondary}>{m.roles.join(", ")||"Role belum ditetapkan"}</NativeText>
       </Pressable>)}
       {activeMembership&&<NativeStack gap="2">
        <NativeText variant="title" weight="semibold">Hak akses aktif</NativeText>
        <NativeText color={colors.textSecondary}>{activeMembership.permissions.length} permission dimuat dari FastAPI.</NativeText>
       </NativeStack>}

       {auth.activeOrganizationId&&<>
         <SmartTeamHome auth={auth} salesProfileId={typeof assignmentContext?.sales_profile?.id==="string"?String(assignmentContext.sales_profile.id):null} onShiftContextChange={onShiftContextChange}/>
       <SmartOrderHome auth={auth}/>
       <SmartRewardHome auth={auth}/>
       <AnalyticsHome auth={auth}/>
         <LocationTrackingControl api={auth.apiClient} organizationId={auth.activeOrganizationId} accessToken={auth.session?.access_token??null} actorUserId={auth.context?.user.id??null} shiftId={activeShiftId} shiftContextReady={shiftContextReady}/>
        </>}

       {canReadAssignmentContext&&assignmentContext&&<NativeStack gap="2">
        <NativeText variant="title" weight="semibold">Konteks Penugasan Lapangan</NativeText>
        {assignmentContextOffline&&<NativeText variant="caption" color={colors.textSecondary}>Mode offline · menampilkan cache terakhir dari SecureStore</NativeText>}
        {assignmentContext.sales_profile&&<NativeSurface elevation="sm" radius="lg" style={{padding:14}}>
         <NativeStack gap="1">
          <NativeText weight="semibold">{String(assignmentContext.sales_profile.display_name??"Sales Profile")}</NativeText>
          <NativeText variant="caption" color={colors.textSecondary}>Tim: {String(assignmentContext.sales_profile.team_name??"Belum ditetapkan")} · Supervisor: {String(assignmentContext.sales_profile.supervisor_name??"Belum ditetapkan")}</NativeText>
          <NativeText variant="caption" color={colors.textSecondary}>Teritori: {String(assignmentContext.sales_profile.territory_name??"Belum ditetapkan")}</NativeText>
         </NativeStack>
        </NativeSurface>}
        {assignmentContext.assignments.map(item=><NativeSurface key={String(item.id)} elevation="sm" radius="lg" style={{padding:12}}>
         <NativeText weight="semibold">{String(item.outlet_name??item.outlet_code??"Outlet")}</NativeText>
         <NativeText variant="caption" color={colors.textSecondary}>{String(item.address??"")} · {String(item.city??"")}</NativeText>
        </NativeSurface>)}
        {assignmentContext.assignments.length===0&&<NativeText variant="caption" color={colors.textSecondary}>Belum ada outlet aktif yang ditugaskan.</NativeText>}
       </NativeStack>}
       {canReadSessions&&<NativeStack gap="2">
        <NativeText variant="title" weight="semibold">Sesi perangkat</NativeText>
        <NativeText variant="caption" color={colors.textSecondary}>Pencabutan ini memblokir akses API SalesX-Ai. Supabase Auth tidak menyediakan revoke refresh token untuk satu perangkat lain berdasarkan session ID.</NativeText>
        {sessions.map(item=><NativeSurface key={item.auth_session_id} elevation="sm" radius="lg" style={{padding:12}}>
         <NativeStack gap="2">
          <NativeText weight="semibold">{item.device_name??item.platform}{item.current?" · Perangkat ini":""}</NativeText>
          <NativeText variant="caption" color={colors.textSecondary}>{item.platform} · {item.revoked_at?"Akses dicabut":item.current?"Aktif sekarang":"Aktif"} · {item.last_seen_at?new Date(item.last_seen_at).toLocaleString():"Belum ada aktivitas"}</NativeText>
          {canRevokeSessions&&!item.current&&!item.revoked_at&&<Action label="Cabut akses API" secondary onPress={()=>void run(()=>revokeDeviceSession(item.auth_session_id),"Akses API perangkat dicabut.")}/>}
         </NativeStack>
        </NativeSurface>)}
       </NativeStack>}
       {canReadIdentities&&<NativeStack gap="2">
        <NativeText variant="title" weight="semibold">Identitas login</NativeText>
        {canLinkIdentity&&<Action label="Hubungkan Google identity" secondary onPress={()=>void run(auth.linkIdentity,"Google identity linking dimulai. Selesaikan verifikasi di browser.")}/>}
        {identities.map(identity=><NativeSurface key={identity.id} elevation="sm" radius="lg" style={{padding:12}}>
         <NativeInline gap="3" style={{justifyContent:"space-between",alignItems:"center"}}>
          <NativeStack gap="0">
           <NativeText weight="semibold">{identity.provider}{identity.is_primary?" · Primary":""}</NativeText>
           <NativeText variant="caption" color={colors.textSecondary}>{identity.email??identity.id}</NativeText>
          </NativeStack>
          {canUnlinkIdentity&&<Action label="Unlink" secondary disabled={busy||identity.is_primary||identities.length<=1} onPress={()=>void run(async()=>{
           await auth.unlinkIdentity(identity.id);
           const api=auth.apiClient;if(api)setIdentities(await api.listLinkedIdentities());
          },"Identitas dilepas.")}/>}
         </NativeInline>
        </NativeSurface>)}
       </NativeStack>}
       <Action label="Keluar dari perangkat ini" onPress={()=>void run(()=>auth.signOut("local"),"Sesi perangkat ini dicabut.")}/>
       <Action label="Ganti akun" secondary onPress={()=>void run(auth.switchAccount,"Akun sebelumnya dibersihkan. Silakan masuk dengan akun lain.")}/>
      </NativeStack>
     </NativeSurface>}

     {auth.status==="unauthenticated"&&<NativeSurface elevation="sm" radius="2xl" style={{padding:24}}>
      <NativeStack gap="4">
       <NativeText variant="caption" weight="bold" color={colors.primary}>SUPABASE AUTH · SECURE STORE</NativeText>
       <NativeText variant="heading" weight="bold">{mode==="login"?"Masuk ke SalesX-Ai":mode==="signup"?"Buat akun SalesX-Ai":mode==="recovery"?"Pulihkan password":"Masuk dengan SMS OTP"}</NativeText>
       <NativeText color={colors.textSecondary}>Sesi disimpan melalui iOS Keychain / Android Keystore. Profil, membership, role, permission dan tenant context dibaca dari FastAPI.</NativeText>
       {mode==="otp"?<>
        <Field value={phone} onChangeText={setPhone} placeholder="Nomor telepon format +62…" keyboardType="phone-pad"/>
        {otpSent&&<Field value={otp} onChangeText={setOtp} placeholder="Kode OTP" keyboardType="phone-pad"/>}
        {!otpSent?<Action label={busy?"Mengirim…":"Kirim kode OTP"} disabled={busy||!phone.trim()} onPress={()=>void run(async()=>{await auth.signInWithOtp(phone);setOtpSent(true);},"Kode OTP dikirim oleh Supabase Auth.")}/>:<Action label={busy?"Memverifikasi…":"Verifikasi OTP"} disabled={busy||!otp.trim()} onPress={()=>void run(()=>auth.verifyOtp(phone,otp),"Nomor telepon berhasil diverifikasi.")}/>}
       </>:<>
        <Field value={email} onChangeText={setEmail} placeholder="Email" keyboardType="email-address"/>
        {mode!=="recovery"&&<Field value={password} onChangeText={setPassword} placeholder="Password (minimal 12 karakter)" secureTextEntry/>}
        {mode==="signup"&&<NativeText variant="caption" color={colors.textSecondary}>Verifikasi email wajib dilakukan sebelum akses organisasi diberikan.</NativeText>}
        <Action label={busy?"Memproses…":mode==="login"?"Masuk":mode==="signup"?"Daftar":"Kirim tautan pemulihan"} disabled={busy||!email.trim()||(mode!=="recovery"&&!password)} onPress={()=>void run(async()=>{
         if(mode==="login")await auth.signInWithPassword(email,password);
         else if(mode==="signup"){
          const verificationRequired=await auth.signUp(email,password);
          setNotice(verificationRequired?"Akun dibuat. Periksa email untuk verifikasi.":"Akun dibuat dan sesi aktif.");
         }else await auth.requestPasswordReset(email);
        },mode==="login"?"Login berhasil.":mode==="signup"?"Pendaftaran diproses.":"Tautan pemulihan dikirim jika email terdaftar.")}/>
        {mode==="login"&&<Action label="Masuk dengan Google" secondary onPress={()=>void run(auth.signInWithOAuth,"Membuka Google OAuth.")}/>}
       </>}
       {notice&&<NativeText color={colors.textSecondary}>{notice}</NativeText>}
       <NativeInline gap="3" style={{flexWrap:"wrap"}}>
        <Pressable onPress={()=>{setMode("login");setOtpSent(false);setNotice("");}}><NativeText color={colors.primary}>Masuk</NativeText></Pressable>
        <Pressable onPress={()=>{setMode("signup");setNotice("");}}><NativeText color={colors.primary}>Daftar</NativeText></Pressable>
        <Pressable onPress={()=>{setMode("recovery");setNotice("");}}><NativeText color={colors.primary}>Lupa password</NativeText></Pressable>
        <Pressable onPress={()=>{setMode("otp");setOtpSent(false);setNotice("");}}><NativeText color={colors.primary}>SMS OTP</NativeText></Pressable>
       </NativeInline>
      </NativeStack>
     </NativeSurface>}

     <NativeStack gap="2">
      <NativeText variant="title" weight="semibold">Satu sumber otorisasi</NativeText>
      <NativeText color={colors.textSecondary}>Semua business request menggunakan access token Supabase dan diperiksa ulang oleh FastAPI. UI hanya menampilkan tindakan sesuai permission yang dikembalikan API.</NativeText>
     </NativeStack>
    </NativeStack>
   </ScrollView>
  </NativePageShell>
 </>;
}

export default function App(){
 const [fontsLoaded]=useFonts({PlusJakartaSans_400Regular,PlusJakartaSans_500Medium,PlusJakartaSans_600SemiBold,PlusJakartaSans_700Bold,JetBrainsMono_400Regular,JetBrainsMono_500Medium,JetBrainsMono_600SemiBold});
 const auth=useMobileSalesAuth();
 if(!fontsLoaded)return null;
 return <NativeThemeProvider><SalesHome key={auth.contextEpoch} auth={auth}/></NativeThemeProvider>;
}
