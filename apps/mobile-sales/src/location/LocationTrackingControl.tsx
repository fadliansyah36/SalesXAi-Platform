import React,{useEffect,useRef,useState} from "react";
import {AppState,Pressable} from "react-native";
import * as Location from "expo-location";
import type {SalesXApiClient} from "@salesx-ai/api-client";
import {NativeInline,NativeStack,NativeSurface,NativeText,useNativeTheme} from "@salesx-ai/design-system/native";
import {ensureLocationDeviceId,flushLocationOutbox,getLocalLocationRoute,startLocationTracking,stopLocationTracking,syncLocationAccessToken,syncPendingLocationStop,getStoredLocationContext,LOCATION_TASK_NAME} from "./locationTracking";
import {LocationMap} from "./LocationMap";
import type {MapCoordinate,MapPolyline} from "../../../../packages/maps/src";

export function LocationTrackingControl({api,organizationId,accessToken,actorUserId,shiftId,shiftContextReady}:{api:SalesXApiClient|null;organizationId:string|null;accessToken:string|null;actorUserId:string|null;shiftId:string|null;shiftContextReady:boolean}){
 const {colors}=useNativeTheme();const stopRequested=useRef(false);const [consent,setConsent]=useState(false);const [active,setActive]=useState(false);const [busy,setBusy]=useState(false);const [notice,setNotice]=useState("");const [currentCoordinate,setCurrentCoordinate]=useState<MapCoordinate|null>(null);const [currentRoute,setCurrentRoute]=useState<MapPolyline[]>([]);
 useEffect(()=>{void (async()=>{setActive(await Location.hasStartedLocationUpdatesAsync(LOCATION_TASK_NAME));})();},[]);
 useEffect(()=>{
  if(!active||!api||!organizationId||stopRequested.current)return;
  stopRequested.current=true;
  void getStoredLocationContext().then(async stored=>{
   const organizationChanged=stored.organizationId!==organizationId;
   const shiftChanged=shiftContextReady&&(!shiftId||(stored.shiftId&&stored.shiftId!==shiftId));
   if(organizationChanged||shiftChanged){
    setBusy(true);
    try{await stopLocationTracking(api,stored.organizationId??organizationId);}
    catch(error){setNotice(error instanceof Error?error.message:"Shift berakhir; penghentian tracking menunggu sinkronisasi.");}
    finally{setActive(false);setConsent(false);setBusy(false);}
   }
  }).catch(error=>setNotice(error instanceof Error?error.message:"Konteks sesi lokasi tidak dapat dibaca."))
   .finally(()=>{stopRequested.current=false;});
 },[active,api,organizationId,shiftContextReady,shiftId]);

 useEffect(()=>{
  if(!active){setCurrentCoordinate(null);return;}
  let mounted=true;
  void Location.getCurrentPositionAsync({accuracy:Location.Accuracy.Balanced}).then(position=>{
   if(mounted)setCurrentCoordinate({lat:position.coords.latitude,lng:position.coords.longitude});
  }).catch(()=>undefined);
  return ()=>{mounted=false;};
 },[active]);
 useEffect(()=>{
  if(!organizationId||!actorUserId){setCurrentRoute([]);return;}
  let mounted=true;
  const refresh=async()=>{try{const route=await getLocalLocationRoute(organizationId,actorUserId);if(mounted)setCurrentRoute(route);}catch{}};
  void refresh();
  const subscription=AppState.addEventListener("change",state=>{if(state==="active")void refresh();});
  return ()=>{mounted=false;subscription.remove();};
 },[organizationId,actorUserId]);
 useEffect(()=>{void syncLocationAccessToken(accessToken);},[accessToken]);
 useEffect(()=>{
  if(!api||!organizationId)return;
  const subscription=AppState.addEventListener("change",state=>{if(state==="active")void ensureLocationDeviceId().then(async id=>{const context=await getStoredLocationContext();const owningOrganizationId=context.organizationId??organizationId;await flushLocationOutbox(api,owningOrganizationId,id);await syncPendingLocationStop(api,owningOrganizationId);});});
  return ()=>subscription.remove();
 },[api,organizationId]);
 const toggle=async()=>{
  if(!api||!organizationId||!accessToken||!actorUserId)return;
  if(!active&&!shiftId){setNotice("Mulai shift kerja terlebih dahulu sebelum mengaktifkan pelacakan lokasi.");return;}
  setBusy(true);setNotice("");
  try{
   if(active){await stopLocationTracking(api,organizationId);setActive(false);setConsent(false);setNotice("Pelacakan dihentikan. Data tertunda akan disinkronkan saat jaringan tersedia.");}
   else{
    if(!consent)throw new Error("Persetujuan pelacakan harus diberikan terlebih dahulu.");
    const device=await ensureLocationDeviceId();
    await startLocationTracking(api,organizationId,accessToken,device,actorUserId,shiftId);
    setActive(true);setCurrentRoute(await getLocalLocationRoute(organizationId,actorUserId));setNotice("Pelacakan lokasi aktif. Anda dapat menghentikannya kapan saja.");
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
   <NativeText color={colors.textSecondary}>Lokasi GPS hanya dikumpulkan setelah persetujuan dan izin perangkat, terikat pada shift kerja aktif. Tracking berhenti saat shift berakhir; data offline disinkronkan melalui FastAPI saat jaringan tersedia.</NativeText>
   <LocationMap center={currentCoordinate??currentRoute[0]?.coordinates[currentRoute[0].coordinates.length-1]??null} routes={currentRoute} />
   {!active&&<Pressable onPress={()=>setConsent(v=>!v)} style={{padding:12,borderRadius:12,borderWidth:1,borderColor:consent?colors.primary:colors.border}}>
    <NativeText color={consent?colors.primary:colors.textPrimary}> {consent?"✓ ":"□ "}Saya menyetujui pelacakan lokasi selama sesi kerja dan memahami bahwa saya dapat menghentikannya.</NativeText>
   </Pressable>}
   <Pressable disabled={busy||!api||!organizationId||!accessToken||!actorUserId||(!active&&(!consent||!shiftContextReady||!shiftId))} onPress={()=>void toggle()} style={{padding:14,borderRadius:12,backgroundColor:active?colors.surfaceMuted:colors.primarySubtle,borderWidth:active?1:0,borderColor:colors.border,opacity:busy?0.6:1}}>
    <NativeText weight="semibold" color={colors.textPrimary}>{busy?"Memproses…":active?"Hentikan pelacakan":"Mulai pelacakan lokasi"}</NativeText>
   </Pressable>
   {!!notice&&<NativeText variant="caption" color={colors.textSecondary}>{notice}</NativeText>}
  </NativeStack>
 </NativeSurface>;
}
