import React,{useEffect,useState} from "react";
import {AppState,Pressable} from "react-native";
import * as Location from "expo-location";
import type {SalesXApiClient} from "@salesx-ai/api-client";
import {NativeInline,NativeStack,NativeSurface,NativeText,useNativeTheme} from "@salesx-ai/design-system/native";
import {ensureLocationDeviceId,flushLocationOutbox,startLocationTracking,stopLocationTracking,syncLocationAccessToken,syncPendingLocationStop,LOCATION_TASK_NAME} from "./locationTracking";

export function LocationTrackingControl({api,organizationId,accessToken,actorUserId,shiftId}:{api:SalesXApiClient|null;organizationId:string|null;accessToken:string|null;actorUserId:string|null;shiftId?:string|null}){
 const {colors}=useNativeTheme();const [consent,setConsent]=useState(false);const [active,setActive]=useState(false);const [busy,setBusy]=useState(false);const [notice,setNotice]=useState("");
 useEffect(()=>{void (async()=>{setActive(await Location.hasStartedLocationUpdatesAsync(LOCATION_TASK_NAME));})();},[]);
 useEffect(()=>{void syncLocationAccessToken(accessToken);},[accessToken]);
 useEffect(()=>{
  if(!api||!organizationId)return;
  const subscription=AppState.addEventListener("change",state=>{if(state==="active")void ensureLocationDeviceId().then(async id=>{await flushLocationOutbox(api,organizationId,id);await syncPendingLocationStop(api,organizationId);});});
  return ()=>subscription.remove();
 },[api,organizationId]);
 const toggle=async()=>{
  if(!api||!organizationId||!accessToken||!actorUserId)return;
  setBusy(true);setNotice("");
  try{
   if(active){await stopLocationTracking(api,organizationId);setActive(false);setConsent(false);setNotice("Pelacakan dihentikan. Data tertunda akan disinkronkan saat jaringan tersedia.");}
   else{
    if(!consent)throw new Error("Persetujuan pelacakan harus diberikan terlebih dahulu.");
    const device=await ensureLocationDeviceId();
    await startLocationTracking(api,organizationId,accessToken,device,actorUserId,shiftId);
    setActive(true);setNotice("Pelacakan lokasi aktif. Anda dapat menghentikannya kapan saja.");
   }
  }catch(error){setNotice(error instanceof Error?error.message:"Tidak dapat mengubah status pelacakan.");}
  finally{setBusy(false);}
 };
 return <NativeSurface elevation="sm" radius="2xl" style={{padding:18}}>
  <NativeStack gap="3">
   <NativeInline style={{justifyContent:"space-between",alignItems:"center"}}>
    <NativeText variant="title" weight="semibold">Pelacakan lokasi kerja</NativeText>
    <NativeText variant="caption" color={active?colors.success:colors.textSecondary}>{active?"AKTIF":"NONAKTIF"}</NativeText>
   </NativeInline>
   <NativeText color={colors.textSecondary}>Lokasi GPS hanya dikumpulkan setelah Anda menyetujui dan memberikan izin perangkat. Data disimpan sementara secara lokal ketika offline dan dikirim ke FastAPI saat koneksi tersedia.</NativeText>
   {!active&&<Pressable onPress={()=>setConsent(v=>!v)} style={{padding:12,borderRadius:12,borderWidth:1,borderColor:consent?colors.primary:colors.border}}>
    <NativeText color={consent?colors.primary:colors.textPrimary}> {consent?"✓ ":"□ "}Saya menyetujui pelacakan lokasi selama sesi kerja dan memahami bahwa saya dapat menghentikannya.</NativeText>
   </Pressable>}
   <Pressable disabled={busy||!api||!organizationId||!accessToken||!actorUserId||(!active&&!consent)} onPress={()=>void toggle()} style={{padding:14,borderRadius:12,backgroundColor:active?colors.surfaceMuted:colors.primarySubtle,borderWidth:active?1:0,borderColor:colors.border,opacity:busy?0.6:1}}>
    <NativeText weight="semibold" color={colors.textPrimary}>{busy?"Memproses…":active?"Hentikan pelacakan":"Mulai pelacakan lokasi"}</NativeText>
   </Pressable>
   {!!notice&&<NativeText variant="caption" color={colors.textSecondary}>{notice}</NativeText>}
  </NativeStack>
 </NativeSurface>;
}
