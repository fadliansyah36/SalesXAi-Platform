import React,{useCallback,useEffect,useMemo,useRef,useState} from "react";
import {Pressable,TextInput,View} from "react-native";
import * as Location from "expo-location";
import * as SQLite from "expo-sqlite";
import {NativeInline,NativeStack,NativeSurface,NativeText,useNativeTheme} from "@salesx-ai/design-system/native";
import type {SmartTeamActivity,SmartTeamAttendance,SmartTeamLocationCapture,SmartTeamTarget,SmartTeamVisit} from "@salesx-ai/api-client";

type AuthState={
 status:string;
 context:{user:{id:string}}|null;
 activeOrganizationId:string|null;
 apiClient:import("@salesx-ai/api-client").SalesXApiClient|null;
 canPerformApiAction:(id:import("@salesx-ai/permissions").ApiActionId)=>boolean;
};
type QueueKind="clock_in"|"clock_out"|"visit_check_in"|"visit_check_out"|"activity_create";
type OutboxRow={id:string;organization_id:string;kind:QueueKind;payload_json:string;created_at:string;attempts:number;last_error:string|null};
const makeKey=()=>Date.now().toString(36)+"-"+Math.random().toString(36).slice(2)+"-"+Math.random().toString(36).slice(2);
const dateText=(value:string|null|undefined)=>value?new Date(value).toLocaleString("id-ID"):"—";

async function getQueueDatabase(){
 const db=await SQLite.openDatabaseAsync("salesx-smartteam.db");
 await db.execAsync("PRAGMA journal_mode = WAL; CREATE TABLE IF NOT EXISTS smartteam_outbox (id TEXT PRIMARY KEY NOT NULL, organization_id TEXT NOT NULL, kind TEXT NOT NULL, payload_json TEXT NOT NULL, created_at TEXT NOT NULL, attempts INTEGER NOT NULL DEFAULT 0, last_error TEXT); CREATE INDEX IF NOT EXISTS smartteam_outbox_org_created_idx ON smartteam_outbox(organization_id,created_at);");
 return db;
}

async function captureForegroundLocation():Promise<SmartTeamLocationCapture>{
 let permission=await Location.getForegroundPermissionsAsync();
 if(!permission.granted)permission=await Location.requestForegroundPermissionsAsync();
 if(!permission.granted)throw new Error("Izin lokasi ditolak. Aktifkan izin lokasi saat menggunakan aplikasi untuk mencatat kehadiran atau kunjungan.");
 const position=await Location.getCurrentPositionAsync({accuracy:Location.Accuracy.High});
 return {latitude:position.coords.latitude,longitude:position.coords.longitude,accuracy_m:position.coords.accuracy??0,source:"gps",captured_at:new Date().toISOString()};
}

export function SmartTeamHome({auth,salesProfileId}:{auth:AuthState;salesProfileId:string|null}){
 const {colors}=useNativeTheme();
 const dbRef=useRef<Awaited<ReturnType<typeof getQueueDatabase>>|null>(null);
 const [visits,setVisits]=useState<SmartTeamVisit[]>([]);
 const [attendance,setAttendance]=useState<SmartTeamAttendance[]>([]);
 const [activities,setActivities]=useState<SmartTeamActivity[]>([]);
 const [targets,setTargets]=useState<SmartTeamTarget[]>([]);
 const [outbox,setOutbox]=useState<OutboxRow[]>([]);
 const [activityTitle,setActivityTitle]=useState("");
 const [busy,setBusy]=useState(false);
 const [syncing,setSyncing]=useState(false);
 const syncingRef=useRef(false);
 const [notice,setNotice]=useState("");
 const [error,setError]=useState("");
 const [outcome,setOutcome]=useState<"productive"|"not_productive"|"order_taken"|"follow_up"|"closed"|"no_contact">("follow_up");
 const organizationId=auth.activeOrganizationId;
 const api=auth.apiClient;
 const canReadVisits=auth.canPerformApiAction("smartteam.visits.read");
 const canExecuteVisits=auth.canPerformApiAction("smartteam.visits.execute");
 const canReadAttendance=auth.canPerformApiAction("smartteam.attendance.read");
 const canManageAttendance=auth.canPerformApiAction("smartteam.attendance.clock_in");
 const canReadActivities=auth.canPerformApiAction("smartteam.activities.read");
 const canManageActivities=auth.canPerformApiAction("smartteam.activities.create");
 const canReadTargets=auth.canPerformApiAction("smartteam.targets.read");
 const activeShift=useMemo(()=>attendance.find(row=>row.user_id===auth.context?.user.id&&row.status==="active"),[attendance,auth.context?.user.id]);

 const refreshQueue=useCallback(async()=>{
  const db=dbRef.current;if(!db||!organizationId)return;
  const rows=await db.getAllAsync<OutboxRow>("select * from smartteam_outbox where organization_id=? order by created_at asc",[organizationId]);
  setOutbox(rows);
 },[organizationId]);

 const refresh=useCallback(async()=>{
  if(!api||!organizationId||auth.status!=="authenticated")return;
  setError("");
  try{
   const jobs:Promise<unknown>[]=[];
   if(canReadVisits)jobs.push(api.listSmartTeamVisits(organizationId,{limit:200}).then(setVisits));
   if(canReadAttendance)jobs.push(api.listSmartTeamAttendance(organizationId,200,0).then(setAttendance));
   if(canReadActivities)jobs.push(api.listSmartTeamActivities(organizationId,200,0).then(setActivities));
   if(canReadTargets)jobs.push(api.listSmartTeamTargets(organizationId,200,0).then(setTargets));
   await Promise.all(jobs);
  }catch(cause){setError(cause instanceof Error?cause.message:"Data SmartTeam tidak dapat dimuat dari FastAPI.");}
 },[api,organizationId,auth.status,canReadVisits,canReadAttendance,canReadActivities,canReadTargets]);

 const syncOutbox=useCallback(async()=>{
  const db=dbRef.current;if(!db||!api||!organizationId||syncingRef.current)return;
  syncingRef.current=true;setSyncing(true);setError("");
  try{
   const rows=await db.getAllAsync<OutboxRow>("select * from smartteam_outbox where organization_id=? order by created_at asc",[organizationId]);
   for(const row of rows){
    const payload=JSON.parse(row.payload_json) as Record<string,any>;
    try{
     if(row.kind==="clock_in")await api.clockInSmartTeam(organizationId,payload.location,payload.idempotency_key);
     else if(row.kind==="clock_out")await api.clockOutSmartTeam(organizationId,payload.location,payload.idempotency_key);
     else if(row.kind==="visit_check_in")await api.checkInSmartTeamVisit(organizationId,payload.visit_id,{location:payload.location,idempotency_key:payload.idempotency_key});
     else if(row.kind==="visit_check_out")await api.checkOutSmartTeamVisit(organizationId,payload.visit_id,{location:payload.location,outcome:payload.outcome,notes:payload.notes,idempotency_key:payload.idempotency_key});
     else if(row.kind==="activity_create")await api.createSmartTeamActivity(organizationId,payload.activity);
     await db.runAsync("delete from smartteam_outbox where id=?",[row.id]);
    }catch(cause){
     await db.runAsync("update smartteam_outbox set attempts=attempts+1,last_error=? where id=?",[cause instanceof Error?cause.message:"Sinkronisasi gagal",row.id]);
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

 async function enqueue(kind:QueueKind,payload:Record<string,unknown>){
  const db=dbRef.current;if(!db||!organizationId)throw new Error("Penyimpanan offline belum siap.");
  await db.runAsync("insert or ignore into smartteam_outbox(id,organization_id,kind,payload_json,created_at,attempts) values(?,?,?,?,?,0)",
   [makeKey(),organizationId,kind,JSON.stringify(payload),new Date().toISOString()]);
  await refreshQueue();
  await syncOutbox();
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

 async function createActivity(){
  if(!api||!organizationId||!salesProfileId||!activityTitle.trim())return;
  setBusy(true);setError("");setNotice("");
  try{
   const activity={sales_profile_id:salesProfileId,activity_type:"follow_up" as const,title:activityTitle.trim(),idempotency_key:makeKey()};
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
    <NativeText color={colors.textSecondary}>GPS hanya diminta saat Anda menekan Clock-in, Clock-out, Check-in atau Check-out. Lokasi dicatat untuk aktivitas kerja dan tidak berjalan diam-diam di latar belakang.</NativeText>
    {error!==""&&<NativeText color={colors.textSecondary}>{error}</NativeText>}
    {notice!==""&&<NativeText color={colors.textSecondary}>{notice}</NativeText>}
    <NativeInline gap="2" style={{flexWrap:"wrap"}}>
     {canManageAttendance&&<Pressable disabled={busy||Boolean(activeShift)} onPress={()=>void clockIn()} style={{padding:12,borderRadius:10,backgroundColor:colors.primary,opacity:busy||activeShift?0.45:1}}><NativeText color={colors.surface} weight="semibold">Clock-in + GPS</NativeText></Pressable>}
     {canManageAttendance&&<Pressable disabled={busy||!activeShift} onPress={()=>void clockOut()} style={{padding:12,borderRadius:10,borderWidth:1,borderColor:colors.border,opacity:busy||!activeShift?0.45:1}}><NativeText weight="semibold">Clock-out + GPS</NativeText></Pressable>}
     <Pressable disabled={syncing||outbox.length===0} onPress={()=>void syncOutbox()} style={{padding:12,borderRadius:10,borderWidth:1,borderColor:colors.border,opacity:syncing||outbox.length===0?0.45:1}}><NativeText weight="semibold">{syncing?"Syncing…":`Sync antrean (${outbox.length})`}</NativeText></Pressable>
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
      {canExecuteVisits&&visit.status==="scheduled"&&<Pressable disabled={busy} onPress={()=>void checkIn(visit)} style={{padding:10,borderRadius:8,backgroundColor:colors.primary}}><NativeText color={colors.surface} weight="semibold">Check-in GPS</NativeText></Pressable>}
      {canExecuteVisits&&visit.status==="in_progress"&&<Pressable disabled={busy} onPress={()=>void checkOut(visit)} style={{padding:10,borderRadius:8,borderWidth:1,borderColor:colors.border}}><NativeText weight="semibold">Check-out GPS</NativeText></Pressable>}
     </NativeInline>
    </View>)}
    {visits.length===0&&<NativeText color={colors.textSecondary}>Tidak ada kunjungan yang ditugaskan pada cakupan akun ini.</NativeText>}
   </NativeStack>
  </NativeSurface>}

  {canReadActivities&&<NativeSurface elevation="sm" radius="2xl" style={{padding:18}}>
   <NativeStack gap="3">
    <NativeText variant="title" weight="semibold">Aktivitas harian</NativeText>
    {canManageActivities&&<NativeInline gap="2" style={{alignItems:"center"}}>
     <TextInput value={activityTitle} onChangeText={setActivityTitle} placeholder="Catat aktivitas sales…" placeholderTextColor={colors.textMuted} style={{flex:1,borderWidth:1,borderColor:colors.border,borderRadius:10,padding:12,color:colors.textPrimary}}/>
     <Pressable disabled={busy||!activityTitle.trim()} onPress={()=>void createActivity()} style={{padding:12,borderRadius:10,backgroundColor:colors.primary,opacity:busy||!activityTitle.trim()?0.45:1}}><NativeText color={colors.surface} weight="semibold">Simpan</NativeText></Pressable>
    </NativeInline>}
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
