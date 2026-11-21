import React,{useCallback,useEffect,useMemo,useRef,useState} from "react";
import {AppState,Linking,Pressable,TextInput,View} from "react-native";
import * as Location from "expo-location";
import * as ImagePicker from "expo-image-picker";
import * as DocumentPicker from "expo-document-picker";
import * as SQLite from "expo-sqlite";
import * as FileSystem from "expo-file-system/legacy";
import {NativeInline,NativeStack,NativeSurface,NativeText,useNativeTheme} from "@salesx-ai/design-system/native";
import type {SmartTeamActivity,SmartTeamAttendance,SmartTeamLocationCapture,SmartTeamTarget,SmartTeamVisit,SmartTeamVisitEvidence} from "@salesx-ai/api-client";

type AuthState={
 status:string;
 context:{user:{id:string}}|null;
 activeOrganizationId:string|null;
 apiClient:import("@salesx-ai/api-client").SalesXApiClient|null;
 canPerformApiAction:(id:import("@salesx-ai/permissions").ApiActionId)=>boolean;
};
type QueueKind="clock_in"|"clock_out"|"visit_check_in"|"visit_check_out"|"activity_create"|"evidence_upload";
type OutboxRow={id:string;organization_id:string;kind:QueueKind;payload_json:string;created_at:string;attempts:number;last_error:string|null;status:"pending"|"blocked";next_attempt_at:string};
type CacheRow={payload_json:string;updated_at:string};
const makeKey=()=>Date.now().toString(36)+"-"+Math.random().toString(36).slice(2)+"-"+Math.random().toString(36).slice(2);
const dateText=(value:string|null|undefined)=>value?new Date(value).toLocaleString("id-ID"):"—";

async function getQueueDatabase(){
 const db=await SQLite.openDatabaseAsync("salesx-smartteam.db");
 await db.execAsync("PRAGMA journal_mode = WAL; CREATE TABLE IF NOT EXISTS smartteam_outbox (id TEXT PRIMARY KEY NOT NULL, organization_id TEXT NOT NULL, kind TEXT NOT NULL, payload_json TEXT NOT NULL, created_at TEXT NOT NULL, attempts INTEGER NOT NULL DEFAULT 0, last_error TEXT, status TEXT NOT NULL DEFAULT 'pending', next_attempt_at TEXT NOT NULL DEFAULT ''); CREATE INDEX IF NOT EXISTS smartteam_outbox_org_created_idx ON smartteam_outbox(organization_id,status,next_attempt_at,created_at); CREATE TABLE IF NOT EXISTS smartteam_cache (organization_id TEXT NOT NULL, cache_key TEXT NOT NULL, payload_json TEXT NOT NULL, updated_at TEXT NOT NULL, PRIMARY KEY(organization_id,cache_key));");
 const columns=await db.getAllAsync<{name:string}>("PRAGMA table_info(smartteam_outbox)");
 if(!columns.some(column=>column.name==="status"))await db.execAsync("ALTER TABLE smartteam_outbox ADD COLUMN status TEXT NOT NULL DEFAULT 'pending'");
 if(!columns.some(column=>column.name==="next_attempt_at"))await db.execAsync("ALTER TABLE smartteam_outbox ADD COLUMN next_attempt_at TEXT NOT NULL DEFAULT ''");
 return db;
}

async function captureForegroundLocation():Promise<SmartTeamLocationCapture>{
 let permission=await Location.getForegroundPermissionsAsync();
 if(!permission.granted)permission=await Location.requestForegroundPermissionsAsync();
 if(!permission.granted)throw new Error("Izin lokasi ditolak. Aktifkan izin lokasi saat menggunakan aplikasi untuk mencatat kehadiran atau kunjungan.");
 const position=await Location.getCurrentPositionAsync({accuracy:Location.Accuracy.High});
 return {latitude:position.coords.latitude,longitude:position.coords.longitude,accuracy_m:position.coords.accuracy??0,source:"gps",captured_at:new Date().toISOString()};
}

export function SmartTeamHome({auth,salesProfileId,onShiftContextChange}:{auth:AuthState;salesProfileId:string|null;onShiftContextChange?:(shiftId:string|null,ready:boolean)=>void}){
 const {colors}=useNativeTheme();
 const dbRef=useRef<Awaited<ReturnType<typeof getQueueDatabase>>|null>(null);
 const [visits,setVisits]=useState<SmartTeamVisit[]>([]);
 const [attendance,setAttendance]=useState<SmartTeamAttendance[]>([]);
 const [attendanceLoaded,setAttendanceLoaded]=useState(false);
 const [activities,setActivities]=useState<SmartTeamActivity[]>([]);
 const [targets,setTargets]=useState<SmartTeamTarget[]>([]);
 const [expandedVisitId,setExpandedVisitId]=useState<string|null>(null);
 const [visitHistory,setVisitHistory]=useState<Record<string,Array<Record<string,unknown>>>>({});
 const [visitEvidence,setVisitEvidence]=useState<Record<string,SmartTeamVisitEvidence[]>>({});
 const [outbox,setOutbox]=useState<OutboxRow[]>([]);
 const [activityTitle,setActivityTitle]=useState("");
 const [activityType,setActivityType]=useState<"task"|"call"|"meeting"|"follow_up"|"prospecting"|"report"|"other">("task");
 const [busy,setBusy]=useState(false);
 const [syncing,setSyncing]=useState(false);
 const [evidenceProgress,setEvidenceProgress]=useState<Record<string,number>>({});
 const uploadAbortRef=useRef<AbortController|null>(null);
 const syncingRef=useRef(false);
 const [notice,setNotice]=useState("");
 const [error,setError]=useState("");
 const [outcome,setOutcome]=useState<"productive"|"not_productive"|"order_taken"|"follow_up"|"closed"|"no_contact">("follow_up");
 const organizationId=auth.activeOrganizationId;
 const api=auth.apiClient;
 const canReadVisits=auth.canPerformApiAction("smartteam.visits.read");
 const canCheckInVisit=auth.canPerformApiAction("smartteam.visits.execute");
 const canCheckOutVisit=auth.canPerformApiAction("smartteam.visits.checkout");
 const canUploadEvidence=auth.canPerformApiAction("smartteam.visits.evidence.upload");
 const canReadAttendance=auth.canPerformApiAction("smartteam.attendance.read");
 const canClockIn=auth.canPerformApiAction("smartteam.attendance.clock_in");
 const canClockOut=auth.canPerformApiAction("smartteam.attendance.clock_out");
 const canReadActivities=auth.canPerformApiAction("smartteam.activities.read");
 const canManageActivities=auth.canPerformApiAction("smartteam.activities.create");
 const canReadTargets=auth.canPerformApiAction("smartteam.targets.read");
 useEffect(()=>{
  setAttendance([]);
  setAttendanceLoaded(false);
  setOutbox([]);
 },[organizationId]);
 const activeShift=useMemo(()=>{
  if(outbox.some(row=>row.kind==="clock_out"&&row.status==="pending"))return undefined;
  return attendance.find(row=>row.user_id===auth.context?.user.id&&row.status==="active");
 },[attendance,auth.context?.user.id,outbox]);
 useEffect(()=>{onShiftContextChange?.(activeShift?.id??null,attendanceLoaded);},[activeShift?.id,attendanceLoaded,onShiftContextChange]);

 const refreshQueue=useCallback(async()=>{
  const db=dbRef.current;if(!db||!organizationId)return;
  const rows=await db.getAllAsync<OutboxRow>("select * from smartteam_outbox where organization_id=? order by created_at asc",[organizationId]);
  setOutbox(rows);
 },[organizationId]);

 const refresh=useCallback(async()=>{
  if(!api||!organizationId||auth.status!=="authenticated")return;
  setError("");setNotice("");
  const db=dbRef.current;
  const persist=async(cacheKey:string,payload:unknown)=>{
   if(db)await db.runAsync("insert or replace into smartteam_cache(organization_id,cache_key,payload_json,updated_at) values(?,?,?,?)",
    [organizationId,cacheKey,JSON.stringify(payload),new Date().toISOString()]);
  };
  try{
   const jobs:Promise<unknown>[]=[];
   if(canReadVisits)jobs.push(api.listSmartTeamVisits(organizationId,{limit:200}).then(async rows=>{setVisits(rows);await persist("visits",rows);}));
   if(canReadAttendance)jobs.push(api.listSmartTeamAttendance(organizationId,200,0).then(async rows=>{setAttendance(rows);await persist("attendance",rows);}));
   if(canReadActivities)jobs.push(api.listSmartTeamActivities(organizationId,200,0).then(async rows=>{setActivities(rows);await persist("activities",rows);}));
   if(canReadTargets)jobs.push(api.listSmartTeamTargets(organizationId,200,0).then(async rows=>{setTargets(rows);await persist("targets",rows);}));
   await Promise.all(jobs);
   if(canReadAttendance)setAttendanceLoaded(true);
  }catch(cause){
   const loadCache=async<T,>(key:string,setter:(value:T)=>void)=>{
    if(!db)return false;
    const cached=await db.getFirstAsync<CacheRow>("select payload_json,updated_at from smartteam_cache where organization_id=? and cache_key=?",[organizationId,key]);
    if(!cached)return false;
    setter(JSON.parse(cached.payload_json) as T);
    return true;
   };
   const cached=await Promise.all([
    canReadVisits?loadCache<SmartTeamVisit[]>("visits",setVisits):Promise.resolve(false),
    canReadAttendance?loadCache<SmartTeamAttendance[]>("attendance",setAttendance):Promise.resolve(false),
    canReadActivities?loadCache<SmartTeamActivity[]>("activities",setActivities):Promise.resolve(false),
    canReadTargets?loadCache<SmartTeamTarget[]>("targets",setTargets):Promise.resolve(false),
   ]);
   if(canReadAttendance)setAttendanceLoaded(true);
   if(cached.some(Boolean))setNotice("Koneksi API terputus. Data terakhir ditampilkan dari cache perangkat; aksi baru masuk ke outbox sampai tersambung.");
   setError(cause instanceof Error?cause.message:"Data SmartTeam tidak dapat dimuat dari FastAPI.");
  }
 },[api,organizationId,auth.status,canReadVisits,canReadAttendance,canReadActivities,canReadTargets]);

 const syncOutbox=useCallback(async(force=false)=>{
  const db=dbRef.current;if(!db||!api||!organizationId||syncingRef.current)return;
  syncingRef.current=true;setSyncing(true);setError("");
  try{
   if(force)await db.runAsync("update smartteam_outbox set status='pending',next_attempt_at=? where organization_id=?",[new Date().toISOString(),organizationId]);
   const rows=await db.getAllAsync<OutboxRow>("select * from smartteam_outbox where organization_id=? and status='pending' and (next_attempt_at='' or next_attempt_at<=?) order by created_at asc",[organizationId,new Date().toISOString()]);
   for(const row of rows){
    const payload=JSON.parse(row.payload_json) as Record<string,any>;
    try{
     if(row.kind==="clock_in")await api.clockInSmartTeam(organizationId,payload.location,payload.idempotency_key);
     else if(row.kind==="clock_out")await api.clockOutSmartTeam(organizationId,payload.location,payload.idempotency_key);
     else if(row.kind==="visit_check_in")await api.checkInSmartTeamVisit(organizationId,payload.visit_id,{location:payload.location,idempotency_key:payload.idempotency_key});
     else if(row.kind==="visit_check_out")await api.checkOutSmartTeamVisit(organizationId,payload.visit_id,{location:payload.location,outcome:payload.outcome,notes:payload.notes,idempotency_key:payload.idempotency_key});
     else if(row.kind==="activity_create")await api.createSmartTeamActivity(organizationId,payload.activity);
     else if(row.kind==="evidence_upload"){
      const file=await fetch(payload.local_uri).then(response=>{if(!response.ok)throw new Error("File bukti offline tidak tersedia.");return response.blob();});
      const controller=new AbortController();
      uploadAbortRef.current=controller;
      try{
       await api.uploadSmartTeamVisitEvidence(organizationId,payload.visit_id,file,payload.file_name,payload.mime_type,{
        signal:controller.signal,
        onProgress:(loaded,total)=>setEvidenceProgress(current=>({...current,[payload.visit_id]:total>0?Math.min(100,Math.round(loaded/total*100)):0})),
       });
       await FileSystem.deleteAsync(payload.local_uri,{idempotent:true}).catch(()=>undefined);
      }finally{
       if(uploadAbortRef.current===controller)uploadAbortRef.current=null;
       setEvidenceProgress(current=>{const next={...current};delete next[payload.visit_id];return next;});
      }
     }
     await db.runAsync("delete from smartteam_outbox where id=?",[row.id]);
    }catch(cause){
     if(cause instanceof Error&&cause.name==="AbortError"){
      await db.runAsync("update smartteam_outbox set status='pending',next_attempt_at='',last_error=? where id=?",[cause.message,row.id]);
      setNotice("Upload dibatalkan. File tetap tersimpan di antrean dan dapat dicoba kembali.");
      break;
     }
     const attempts=row.attempts+1;
     const statusCode=Number((cause as {status?:number})?.status??0);
     const blocked=statusCode>=400&&statusCode<500&&statusCode!==408&&statusCode!==429;
     const nextAttempt=new Date(Date.now()+Math.min(300000,1000*2**Math.min(attempts,8))).toISOString();
     await db.runAsync("update smartteam_outbox set attempts=?,last_error=?,status=?,next_attempt_at=? where id=?",
      [attempts,cause instanceof Error?cause.message:"Sinkronisasi gagal",blocked?"blocked":"pending",nextAttempt,row.id]);
     setError(cause instanceof Error?cause.message:"Sinkronisasi tertunda; item tetap aman di antrean perangkat.");
     break;
    }
   }
   await refreshQueue();
   await refresh();
  }finally{syncingRef.current=false;setSyncing(false);}
 },[api,organizationId,refresh,refreshQueue]);

 useEffect(()=>{
  let active=true;
  void (async()=>{
   try{dbRef.current=await getQueueDatabase();if(active){await refreshQueue();await refresh();}}
   catch(cause){if(active)setError(cause instanceof Error?cause.message:"Penyimpanan offline tidak tersedia.");}
  })();
  return()=>{active=false;};
 },[refreshQueue,refresh]);

 useEffect(()=>{
  if(!dbRef.current||!api||!organizationId)return;
  void syncOutbox();
 },[api,organizationId,syncOutbox]);
 useEffect(()=>{
  const interval=setInterval(()=>{if(AppState.currentState==="active"){void refresh();void syncOutbox();}},30000);
  const subscription=AppState.addEventListener("change",state=>{if(state==="active"){void refresh();void syncOutbox();}});
  return()=>{clearInterval(interval);subscription.remove();};
 },[refresh,syncOutbox]);


 async function enqueue(kind:QueueKind,payload:Record<string,unknown>){
  const db=dbRef.current;if(!db||!organizationId)throw new Error("Penyimpanan offline belum siap.");
  await db.runAsync("insert or ignore into smartteam_outbox(id,organization_id,kind,payload_json,created_at,attempts,status,next_attempt_at) values(?,?,?,?,?,0,'pending',?)",
   [makeKey(),organizationId,kind,JSON.stringify(payload),new Date().toISOString(),new Date().toISOString()]);
  await refreshQueue();
  await syncOutbox(false);
 }

 async function captureAndEnqueue(kind:QueueKind,build:(location:SmartTeamLocationCapture,key:string)=>Record<string,unknown>){
  setBusy(true);setNotice("");setError("");
  try{const location=await captureForegroundLocation();const key=makeKey();await enqueue(kind,build(location,key));setNotice("Aksi disimpan. Status server akan diperbarui setelah sinkronisasi.");}
  catch(cause){setError(cause instanceof Error?cause.message:"Lokasi atau aksi SmartTeam tidak dapat diproses.");}
  finally{setBusy(false);}
 }

 const clockIn=()=>captureAndEnqueue("clock_in",(location,key)=>({location,idempotency_key:key}));
 const clockOut=()=>captureAndEnqueue("clock_out",(location,key)=>({location,idempotency_key:key}));
 const checkIn=(visit:SmartTeamVisit)=>captureAndEnqueue("visit_check_in",(location,key)=>({visit_id:visit.id,location,idempotency_key:key}));
 const checkOut=(visit:SmartTeamVisit)=>captureAndEnqueue("visit_check_out",(location,key)=>({visit_id:visit.id,location,outcome,notes:null,idempotency_key:key}));

 async function loadVisitDetails(visitId:string){
  if(!api||!organizationId)return;
  setExpandedVisitId(current=>current===visitId?null:visitId);
  try{
   const [history,evidence]=await Promise.all([
    api.getSmartTeamVisitHistory(organizationId,visitId),
    api.listSmartTeamVisitEvidence(organizationId,visitId),
   ]);
   setVisitHistory(current=>({...current,[visitId]:history}));
   setVisitEvidence(current=>({...current,[visitId]:evidence}));
  }catch(cause){setError(cause instanceof Error?cause.message:"Detail kunjungan tidak dapat dimuat.");}
 }

 async function uploadEvidence(visit:SmartTeamVisit){
  if(!api||!organizationId)return;
  setBusy(true);setError("");setNotice("");
  try{
   const permission=await ImagePicker.requestMediaLibraryPermissionsAsync();
   if(!permission.granted)throw new Error("Izin galeri ditolak. Aktifkan izin foto untuk memilih bukti kunjungan.");
   const result=await ImagePicker.launchImageLibraryAsync({mediaTypes:["images"],quality:0.85,allowsEditing:false});
   if(result.canceled||!result.assets[0])return;
   const asset=result.assets[0];
   const root=FileSystem.documentDirectory;
   if(!root)throw new Error("Penyimpanan dokumen perangkat tidak tersedia.");
   const directory=root+"smartteam-evidence/";
   const directoryInfo=await FileSystem.getInfoAsync(directory);
   if(!directoryInfo.exists)await FileSystem.makeDirectoryAsync(directory,{intermediates:true});
   const fileName=asset.fileName??("visit-evidence-"+Date.now()+".jpg");
   const localUri=directory+makeKey()+"-"+fileName.replace(/[^a-zA-Z0-9._-]/g,"_");
   await FileSystem.copyAsync({from:asset.uri,to:localUri});
   await enqueue("evidence_upload",{visit_id:visit.id,local_uri:localUri,file_name:fileName,mime_type:asset.mimeType??"image/jpeg"});
   setNotice("Bukti disimpan di antrean perangkat dan akan diunggah otomatis saat koneksi tersedia.");
   const evidence=await api.listSmartTeamVisitEvidence(organizationId,visit.id).catch(()=>null);
   if(evidence)setVisitEvidence(current=>({...current,[visit.id]:evidence}));
   await refresh();
  }catch(cause){setError(cause instanceof Error?cause.message:"Bukti kunjungan tidak dapat diunggah.");}
  finally{setBusy(false);}
 }

 async function uploadDocumentEvidence(visit:SmartTeamVisit){
  if(!api||!organizationId)return;
  setBusy(true);setError("");setNotice("");
  try{
   const result=await DocumentPicker.getDocumentAsync({type:["image/jpeg","image/png","application/pdf"],copyToCacheDirectory:true,multiple:false});
   if(result.canceled||!result.assets[0])return;
   const asset=result.assets[0];
   const mimeType=(asset.mimeType??"").toLowerCase();
   if(!["image/jpeg","image/png","application/pdf"].includes(mimeType))throw new Error("Format bukti harus JPEG, PNG, atau PDF.");
   const info=await FileSystem.getInfoAsync(asset.uri);
   const sizeBytes=asset.size??(info.exists&&"size" in info?info.size:0);
   if(!sizeBytes||sizeBytes<=0)throw new Error("Ukuran file tidak dapat diverifikasi.");
   if(sizeBytes>10*1024*1024)throw new Error("Ukuran bukti maksimal 10 MB.");
   const root=FileSystem.documentDirectory;
   if(!root)throw new Error("Penyimpanan dokumen perangkat tidak tersedia.");
   const directory=root+"smartteam-evidence/";
   const directoryInfo=await FileSystem.getInfoAsync(directory);
   if(!directoryInfo.exists)await FileSystem.makeDirectoryAsync(directory,{intermediates:true});
   const safeName=asset.name.replace(/[^a-zA-Z0-9._-]/g,"_");
   const localUri=directory+makeKey()+"-"+safeName;
   await FileSystem.copyAsync({from:asset.uri,to:localUri});
   await enqueue("evidence_upload",{visit_id:visit.id,local_uri:localUri,file_name:asset.name,mime_type:mimeType,size_bytes:sizeBytes});
   setNotice("Dokumen disimpan di antrean dan akan diunggah melalui FastAPI saat koneksi tersedia.");
   await refresh();
  }catch(cause){setError(cause instanceof Error?cause.message:"Dokumen bukti tidak dapat diproses.");}
  finally{setBusy(false);}
 }

 const cancelEvidenceUpload=()=>uploadAbortRef.current?.abort();

 async function createActivity(){
  if(!api||!organizationId||!salesProfileId||!activityTitle.trim())return;
  setBusy(true);setError("");setNotice("");
  try{
   const activity={sales_profile_id:salesProfileId,activity_type:activityType,title:activityTitle.trim(),idempotency_key:makeKey()};
   await enqueue("activity_create",{activity});
   setActivityTitle("");setNotice("Aktivitas ditambahkan ke antrean sinkronisasi.");
  }catch(cause){setError(cause instanceof Error?cause.message:"Aktivitas tidak dapat disimpan.");}
  finally{setBusy(false);}
 }

 return <NativeStack gap="4">
  <NativeSurface elevation="sm" radius="2xl" style={{padding:18}}>
   <NativeStack gap="3">
    <NativeInline style={{justifyContent:"space-between",alignItems:"center"}}>
     <NativeText variant="title" weight="semibold">SmartTeam · Operasional Harian</NativeText>
     <Pressable onPress={()=>void refresh()}><NativeText color={colors.primary} weight="semibold">Refresh</NativeText></Pressable>
    </NativeInline>
    <NativeText color={colors.textSecondary}>GPS untuk kehadiran dan kunjungan hanya diminta saat aksi terkait. Pelacakan latar belakang adalah fitur terpisah, memerlukan persetujuan eksplisit dan hanya aktif selama shift kerja.</NativeText>
    {error!==""&&<NativeText color={colors.textSecondary}>{error}</NativeText>}
    {notice!==""&&<NativeText color={colors.textSecondary}>{notice}</NativeText>}
    <NativeInline gap="2" style={{flexWrap:"wrap"}}>
     {canClockIn&&<Pressable disabled={busy||Boolean(activeShift)} onPress={()=>void clockIn()} style={{padding:12,borderRadius:10,backgroundColor:colors.primary,opacity:busy||activeShift?0.45:1}}><NativeText color={colors.surface} weight="semibold">Clock-in + GPS</NativeText></Pressable>}
     {canClockOut&&<Pressable disabled={busy||!activeShift} onPress={()=>void clockOut()} style={{padding:12,borderRadius:10,borderWidth:1,borderColor:colors.border,opacity:busy||!activeShift?0.45:1}}><NativeText weight="semibold">Clock-out + GPS</NativeText></Pressable>}
     <Pressable disabled={syncing||outbox.length===0} onPress={()=>void syncOutbox(true)} style={{padding:12,borderRadius:10,borderWidth:1,borderColor:colors.border,opacity:syncing||outbox.length===0?0.45:1}}><NativeText weight="semibold">{syncing?"Syncing…":`Sync antrean (${outbox.length})`}</NativeText></Pressable>
    </NativeInline>
    <NativeText variant="caption" color={colors.textSecondary}>{activeShift?"Shift aktif":"Belum ada shift aktif"} · {outbox.length} aksi menunggu sinkronisasi</NativeText>
   </NativeStack>
  </NativeSurface>

  {canReadVisits&&<NativeSurface elevation="sm" radius="2xl" style={{padding:18}}>
   <NativeStack gap="3">
    <NativeText variant="title" weight="semibold">Jadwal kunjungan</NativeText>
    {visits.map(visit=><View key={visit.id} style={{paddingVertical:10,borderTopWidth:1,borderColor:colors.border}}>
     <NativeText weight="semibold">{visit.outlet_name??visit.outlet_code??"Outlet"}</NativeText>
     <NativeText variant="caption" color={colors.textSecondary}>{dateText(visit.scheduled_at)} · {visit.status}</NativeText>
     <NativeText variant="caption" color={colors.textSecondary}>Check-in {dateText(visit.check_in_at)} · Check-out {dateText(visit.check_out_at)}</NativeText>
     <NativeInline gap="2" style={{marginTop:8,flexWrap:"wrap"}}>
      {canCheckInVisit&&visit.status==="scheduled"&&<Pressable disabled={busy} onPress={()=>void checkIn(visit)} style={{padding:10,borderRadius:8,backgroundColor:colors.primary}}><NativeText color={colors.surface} weight="semibold">Check-in GPS</NativeText></Pressable>}
      {canCheckOutVisit&&visit.status==="in_progress"&&<Pressable disabled={busy} onPress={()=>void checkOut(visit)} style={{padding:10,borderRadius:8,borderWidth:1,borderColor:colors.border}}><NativeText weight="semibold">Check-out GPS</NativeText></Pressable>}
      {canCheckOutVisit&&visit.status==="in_progress"&&<NativeInline gap="1" style={{flexWrap:"wrap",alignItems:"center"}}>
       {(["productive","not_productive","order_taken","follow_up","closed","no_contact"] as const).map(value=><Pressable key={value} onPress={()=>setOutcome(value)} style={{padding:6,borderRadius:7,borderWidth:1,borderColor:outcome===value?colors.primary:colors.border,backgroundColor:outcome===value?colors.primary:colors.surface}}><NativeText color={outcome===value?colors.surface:colors.textPrimary} variant="caption">{value.replaceAll("_"," ")}</NativeText></Pressable>)}
      </NativeInline>}
      {canUploadEvidence&&["in_progress","completed"].includes(visit.status)&&<Pressable disabled={busy} onPress={()=>void uploadEvidence(visit)} style={{padding:10,borderRadius:8,borderWidth:1,borderColor:colors.border}}><NativeText weight="semibold">Tambah bukti foto</NativeText></Pressable>}
      {canUploadEvidence&&["in_progress","completed"].includes(visit.status)&&<Pressable disabled={busy} onPress={()=>void uploadDocumentEvidence(visit)} style={{padding:10,borderRadius:8,borderWidth:1,borderColor:colors.border}}><NativeText weight="semibold">Pilih dokumen / PDF</NativeText></Pressable>}
      {evidenceProgress[visit.id]!==undefined&&<NativeInline gap="2" style={{alignItems:"center"}}>
       <NativeText variant="caption" color={colors.textSecondary}>Upload {evidenceProgress[visit.id]}%</NativeText>
       <Pressable onPress={cancelEvidenceUpload}><NativeText color={colors.primary} weight="semibold">Batalkan</NativeText></Pressable>
      </NativeInline>}
      <Pressable disabled={busy} onPress={()=>void loadVisitDetails(visit.id)} style={{padding:10,borderRadius:8,borderWidth:1,borderColor:colors.border}}><NativeText weight="semibold">{expandedVisitId===visit.id?"Tutup detail":"Riwayat & bukti"}</NativeText></Pressable>
     </NativeInline>
     {expandedVisitId===visit.id&&<View style={{marginTop:10,padding:12,borderRadius:10,backgroundColor:colors.surface,borderWidth:1,borderColor:colors.border}}>
      <NativeText weight="semibold">Visit timeline</NativeText>
      {(visitHistory[visit.id]??[]).map((event,index)=><View key={String(event.id??index)} style={{paddingVertical:6,borderTopWidth:1,borderColor:colors.border}}>
       <NativeText>{String(event.event_type??"Perubahan kunjungan")}</NativeText>
       <NativeText variant="caption" color={colors.textSecondary}>{dateText(String(event.occurred_at??""))} · {String(event.actor_name??"Aktor tercatat")}</NativeText>
      </View>)}
      {(visitHistory[visit.id]??[]).length===0&&<NativeText variant="caption" color={colors.textSecondary}>Belum ada riwayat yang dimuat.</NativeText>}
      <NativeText weight="semibold" style={{marginTop:10}}>Evidence</NativeText>
      {(visitEvidence[visit.id]??[]).map(item=><NativeInline key={item.id} style={{justifyContent:"space-between",alignItems:"center",paddingVertical:6,borderTopWidth:1,borderColor:colors.border}}>
       <View style={{flex:1}}><NativeText>{item.mime_type} · {Math.ceil(item.size_bytes/1024)} KB</NativeText><NativeText variant="caption" color={colors.textSecondary}>{dateText(item.created_at)}</NativeText></View>
       {item.download_url&&<Pressable onPress={()=>void Linking.openURL(item.download_url!)}><NativeText color={colors.primary} weight="semibold">Buka</NativeText></Pressable>}
      </NativeInline>)}
      {(visitEvidence[visit.id]??[]).length===0&&<NativeText variant="caption" color={colors.textSecondary}>Belum ada bukti yang tercatat.</NativeText>}
     </View>}
    </View>)}
    {visits.length===0&&<NativeText color={colors.textSecondary}>Tidak ada kunjungan yang ditugaskan pada cakupan akun ini.</NativeText>}
   </NativeStack>
  </NativeSurface>}

  {canReadActivities&&<NativeSurface elevation="sm" radius="2xl" style={{padding:18}}>
   <NativeStack gap="3">
    <NativeText variant="title" weight="semibold">Aktivitas harian</NativeText>
    {canManageActivities&&<NativeStack gap="2">
     <NativeInline gap="1" style={{flexWrap:"wrap"}}>
      {(["task","call","meeting","follow_up","prospecting","report","other"] as const).map(value=><Pressable key={value} onPress={()=>setActivityType(value)} style={{padding:7,borderRadius:8,borderWidth:1,borderColor:activityType===value?colors.primary:colors.border,backgroundColor:activityType===value?colors.primary:colors.surface}}><NativeText variant="caption" color={activityType===value?colors.surface:colors.textPrimary}>{value.replaceAll("_"," ")}</NativeText></Pressable>)}
     </NativeInline>
     <NativeInline gap="2" style={{alignItems:"center"}}>
      <TextInput value={activityTitle} onChangeText={setActivityTitle} placeholder="Catat aktivitas sales…" placeholderTextColor={colors.textMuted} style={{flex:1,borderWidth:1,borderColor:colors.border,borderRadius:10,padding:12,color:colors.textPrimary}}/>
      <Pressable disabled={busy||!activityTitle.trim()} onPress={()=>void createActivity()} style={{padding:12,borderRadius:10,backgroundColor:colors.primary,opacity:busy||!activityTitle.trim()?0.45:1}}><NativeText color={colors.surface} weight="semibold">Simpan</NativeText></Pressable>
     </NativeInline>
    </NativeStack>}
    {activities.slice(0,8).map(item=><View key={item.id} style={{paddingVertical:8,borderTopWidth:1,borderColor:colors.border}}><NativeText weight="semibold">{item.title}</NativeText><NativeText variant="caption" color={colors.textSecondary}>{item.activity_type} · {item.status}</NativeText></View>)}
   </NativeStack>
  </NativeSurface>}

  {canReadTargets&&<NativeSurface elevation="sm" radius="2xl" style={{padding:18}}>
   <NativeStack gap="3">
    <NativeText variant="title" weight="semibold">Target operasional</NativeText>
    {targets.map(target=><NativeInline key={target.id} style={{justifyContent:"space-between",alignItems:"center"}}>
     <View><NativeText weight="semibold">{target.metric_key.replaceAll("_"," ")}</NativeText><NativeText variant="caption" color={colors.textSecondary}>{target.period_start} – {target.period_end}</NativeText></View>
     <View style={{alignItems:"flex-end"}}><NativeText weight="semibold">{target.actual_value===null?"—":target.actual_value} / {target.target_value}</NativeText><NativeText variant="caption" color={colors.textSecondary}>{target.progress_percentage===null?"Belum ada data aktual":`${target.progress_percentage}% tercapai`}</NativeText></View>
    </NativeInline>)}
    {targets.length===0&&<NativeText color={colors.textSecondary}>Target belum tersedia.</NativeText>}
   </NativeStack>
  </NativeSurface>}

  {canReadAttendance&&<NativeSurface elevation="sm" radius="2xl" style={{padding:18}}>
   <NativeStack gap="2">
    <NativeText variant="title" weight="semibold">Riwayat kehadiran</NativeText>
    {attendance.slice(0,8).map(row=><NativeInline key={row.id} style={{justifyContent:"space-between",alignItems:"center"}}>
     <View><NativeText weight="semibold">{row.shift_date}</NativeText><NativeText variant="caption" color={colors.textSecondary}>{dateText(row.clock_in_at)} – {dateText(row.clock_out_at)}</NativeText></View>
     <View style={{alignItems:"flex-end"}}><NativeText variant="caption" weight="semibold">{row.attendance_status??row.status}</NativeText><NativeText variant="caption" color={colors.textSecondary}>{row.events?.length??0} riwayat</NativeText></View>
    </NativeInline>)}
   </NativeStack>
  </NativeSurface>}
 </NativeStack>;
}
