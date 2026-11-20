'use client';
import React,{useCallback,useEffect,useMemo,useState} from "react";
import {useSalesXAuth} from "@/components/providers/AppProviders";
import type {SmartTeamActivity,SmartTeamAttendance,SmartTeamLocationCapture,SmartTeamTarget,SmartTeamVisit} from "@salesx-ai/api-client";

type Tab="visits"|"attendance"|"activities"|"targets";
type MasterRecord={id:string;name?:string;code?:string;employee_code?:string;user_id?:string;status?:string};
function locationCapture():Promise<SmartTeamLocationCapture>{
 return new Promise((resolve,reject)=>{
  if(!navigator.geolocation){reject(new Error("Perangkat tidak menyediakan layanan lokasi."));return;}
  navigator.geolocation.getCurrentPosition(
   position=>resolve({latitude:position.coords.latitude,longitude:position.coords.longitude,accuracy_m:position.coords.accuracy,source:"gps"}),
   error=>reject(new Error(error.code===1?"Izin lokasi ditolak. Aktifkan izin lokasi untuk melanjutkan.":error.code===2?"Lokasi tidak tersedia. Periksa GPS dan jaringan.":"Permintaan lokasi melewati batas waktu.")),
   {enableHighAccuracy:true,timeout:15000,maximumAge:10000}
  );
 });
}
const dateLabel=(value:string|null|undefined)=>value?new Date(value).toLocaleString("id-ID"):"—";
export function SmartTeamConsole({surface}:{surface:"company"|"supervisor"|"sales"}){
 const auth=useSalesXAuth();
 const organizationId=auth.activeOrganizationId;
 const api=auth.apiClient;
 const [tab,setTab]=useState<Tab>("visits");
 const [visits,setVisits]=useState<SmartTeamVisit[]>([]);
 const [attendance,setAttendance]=useState<SmartTeamAttendance[]>([]);
 const [activities,setActivities]=useState<SmartTeamActivity[]>([]);
 const [targets,setTargets]=useState<SmartTeamTarget[]>([]);
 const [profiles,setProfiles]=useState<MasterRecord[]>([]);
 const [outlets,setOutlets]=useState<MasterRecord[]>([]);
 const [myProfileId,setMyProfileId]=useState<string|null>(null);
 const [profileId,setProfileId]=useState("");
 const [outletId,setOutletId]=useState("");
 const [scheduledAt,setScheduledAt]=useState("");
 const [activityTitle,setActivityTitle]=useState("");
 const [activityType,setActivityType]=useState<"call"|"meeting"|"follow_up"|"prospecting"|"report"|"other">("follow_up");
 const [notice,setNotice]=useState("");
 const [error,setError]=useState("");
 const [busy,setBusy]=useState(false);
 const can=useCallback((permission:string)=>auth.hasPermission(permission),[auth.hasPermission]);
 const canReadVisits=can("smartteam:visit:read");
 const canManageVisits=can("smartteam:visit:manage");
 const canExecuteVisits=can("smartteam:visit:execute");
 const canReadAttendance=can("smartteam:attendance:read");
 const canManageAttendance=can("smartteam:attendance:manage");
 const canCorrectAttendance=can("smartteam:attendance:correct");
 const canReadActivities=can("smartteam:activity:read");
 const canManageActivities=can("smartteam:activity:manage");
 const canReadTargets=can("smartteam:target:read");
 const canManageTargets=can("smartteam:target:manage");
 const canReadDashboard=can("smartteam:dashboard:read");
 const reload=useCallback(async()=>{
  if(!api||!organizationId)return;
  setError("");
  try{
   const jobs:Promise<unknown>[]=[];
   if(canReadVisits)jobs.push(api.listSmartTeamVisits(organizationId).then(setVisits));
   if(canReadAttendance)jobs.push(api.listSmartTeamAttendance(organizationId).then(setAttendance));
   if(canReadActivities)jobs.push(api.listSmartTeamActivities(organizationId).then(setActivities));
   if(canReadTargets)jobs.push(api.listSmartTeamTargets(organizationId).then(setTargets));
   if(can("master_data:sales_profiles:read")||can("sales_profile:read"))jobs.push(api.listSalesProfiles(organizationId).then(setProfiles));
   if(can("master_data:outlets:read")||can("outlet:read"))jobs.push(api.listOutlets(organizationId).then(setOutlets));
   if(can("master_data:assignment_context:read")){
    jobs.push(api.getMySalesAssignmentContext(organizationId).then(context=>{
     const profile=context.sales_profile as Record<string,unknown>|null;
     setMyProfileId(typeof profile?.id==="string"?profile.id:null);
    }));
   }
   await Promise.all(jobs);
  }catch(cause){setError(cause instanceof Error?cause.message:"Data SmartTeam tidak dapat dimuat.");}
 },[api,organizationId,canReadVisits,canReadAttendance,canReadActivities,canReadTargets,can]);
 useEffect(()=>{void reload();},[reload]);
 const activeShift=useMemo(()=>attendance.find(item=>item.status==="active"&&item.user_id===auth.context?.user.id),[attendance,auth.context?.user.id]);
 async function perform(action:()=>Promise<unknown>,success:string){
  setBusy(true);setError("");setNotice("");
  try{await action();setNotice(success);await reload();}
  catch(cause){setError(cause instanceof Error?cause.message:"Permintaan SmartTeam gagal.");}
  finally{setBusy(false);}
 }
 async function clockIn(){if(!api||!organizationId)return;const location=await locationCapture();await perform(()=>api.clockInSmartTeam(organizationId,location,crypto.randomUUID()),"Clock-in tersimpan dengan timestamp server.");}
 async function clockOut(){if(!api||!organizationId)return;const location=await locationCapture();await perform(()=>api.clockOutSmartTeam(organizationId,location),"Clock-out tersimpan dengan timestamp server.");}
 async function checkIn(visit:SmartTeamVisit){if(!api||!organizationId)return;const location=await locationCapture();await perform(()=>api.checkInSmartTeamVisit(organizationId,visit.id,{location}),"Check-in kunjungan tersimpan.");}
 async function checkOut(visit:SmartTeamVisit){if(!api||!organizationId)return;const location=await locationCapture();await perform(()=>api.checkOutSmartTeamVisit(organizationId,visit.id,{location,outcome:"follow_up"}),"Kunjungan selesai dan outcome tersimpan.");}
 async function createVisit(event:React.FormEvent){
  event.preventDefault();if(!api||!organizationId)return;
  await perform(()=>api.createSmartTeamVisit(organizationId,{sales_profile_id:profileId,outlet_id:outletId,scheduled_at:new Date(scheduledAt).toISOString(),idempotency_key:crypto.randomUUID()}),"Kunjungan berhasil dijadwalkan.");
 }
 async function createActivity(event:React.FormEvent){
  event.preventDefault();if(!api||!organizationId||!myProfileId)return;
  await perform(()=>api.createSmartTeamActivity(organizationId,{sales_profile_id:myProfileId,activity_type:activityType,title:activityTitle,idempotency_key:crypto.randomUUID()}),"Aktivitas harian tersimpan.");
  setActivityTitle("");
 }
 const tabs:Tab[]=["visits","attendance","activities","targets"];
 return <section className="mx-auto w-full max-w-7xl space-y-6 px-4 py-6 sm:px-6">
  <header className="flex flex-wrap items-end justify-between gap-4">
   <div><p className="text-xs font-semibold uppercase tracking-[.16em] text-[var(--color-primary)]">SmartTeam · {surface}</p><h1 className="mt-2 text-2xl font-semibold text-[var(--color-text)]">Sales Operations</h1><p className="mt-1 text-sm text-[var(--color-text-secondary)]">Kunjungan, kehadiran, aktivitas dan target operasional berdasarkan data FastAPI.</p></div>
   <button type="button" onClick={()=>void reload()} disabled={busy} className="rounded-lg border border-[var(--color-border)] px-4 py-2 text-sm font-medium disabled:opacity-50">Refresh data</button>
  </header>
  {!organizationId&&<p className="rounded-xl border border-[var(--color-border)] p-4 text-sm">Pilih organisasi aktif untuk membuka SmartTeam.</p>}
  {error&&<div role="alert" className="rounded-xl border border-red-300 bg-red-50 p-3 text-sm text-red-800">{error}</div>}
  {notice&&<div role="status" className="rounded-xl border border-emerald-300 bg-emerald-50 p-3 text-sm text-emerald-800">{notice}</div>}
  {canReadDashboard&&<div className="grid grid-cols-2 gap-3 md:grid-cols-4">
   {[["Kunjungan",visits.length],["Kehadiran",attendance.length],["Aktivitas",activities.length],["Target",targets.length]].map(([label,value])=><div key={String(label)} className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4"><p className="text-xs text-[var(--color-text-secondary)]">{label}</p><p className="mt-1 text-2xl font-semibold">{value}</p></div>)}
  </div>}
  <nav className="flex flex-wrap gap-2 border-b border-[var(--color-border)] pb-3">
   {tabs.map(value=><button key={value} type="button" onClick={()=>setTab(value)} className={`rounded-lg px-3 py-2 text-sm font-medium ${tab===value?"bg-[var(--color-primary)] text-white":"border border-[var(--color-border)]"}`}>{value==="visits"?"Visits":value==="attendance"?"Attendance":value==="activities"?"Daily Activity":"Targets"}</button>)}
  </nav>
  {tab==="visits"&&<div className="space-y-4">
   {canManageVisits&&<form onSubmit={createVisit} className="grid gap-3 rounded-xl border border-[var(--color-border)] p-4 md:grid-cols-4">
    <select required value={profileId} onChange={e=>setProfileId(e.target.value)} className="rounded-lg border border-[var(--color-border)] bg-transparent p-2 text-sm"><option value="">Pilih sales</option>{profiles.map(p=><option key={p.id} value={p.id}>{p.employee_code??p.name??p.id}</option>)}</select>
    <select required value={outletId} onChange={e=>setOutletId(e.target.value)} className="rounded-lg border border-[var(--color-border)] bg-transparent p-2 text-sm"><option value="">Pilih outlet</option>{outlets.map(o=><option key={o.id} value={o.id}>{o.code??o.name??o.id}</option>)}</select>
    <input required type="datetime-local" value={scheduledAt} onChange={e=>setScheduledAt(e.target.value)} className="rounded-lg border border-[var(--color-border)] bg-transparent p-2 text-sm"/>
    <button disabled={busy} className="rounded-lg bg-[var(--color-primary)] px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">Jadwalkan visit</button>
   </form>}
   <div className="space-y-3">{visits.map(visit=><article key={visit.id} className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
    <div className="flex flex-wrap items-start justify-between gap-3"><div><h3 className="font-semibold">{visit.outlet_name??visit.outlet_code??"Outlet"}</h3><p className="text-sm text-[var(--color-text-secondary)]">{dateLabel(visit.scheduled_at)} · {visit.status}</p><p className="mt-1 text-xs text-[var(--color-text-secondary)]">Sales profile: {visit.sales_profile_id}</p></div>
     <div className="flex flex-wrap gap-2">{canExecuteVisits&&visit.status==="scheduled"&&<button disabled={busy} onClick={()=>void checkIn(visit)} className="rounded-lg bg-[var(--color-primary)] px-3 py-2 text-xs font-semibold text-white">Check-in + GPS</button>}{canExecuteVisits&&visit.status==="in_progress"&&<button disabled={busy} onClick={()=>void checkOut(visit)} className="rounded-lg bg-[var(--color-primary)] px-3 py-2 text-xs font-semibold text-white">Check-out + GPS</button>}{canManageVisits&&["scheduled","assigned"].includes(visit.status)&&<button disabled={busy} onClick={()=>void perform(()=>api!.cancelSmartTeamVisit(organizationId!,visit.id,"Dibatalkan melalui Company/Supervisor Portal"),"Kunjungan dibatalkan.")} className="rounded-lg border border-[var(--color-border)] px-3 py-2 text-xs">Cancel</button>}</div>
    </div><p className="mt-3 text-xs text-[var(--color-text-secondary)]">Check-in: {dateLabel(visit.check_in_at)} · Check-out: {dateLabel(visit.check_out_at)} · Outcome: {visit.outcome??"—"}</p>
   </article>)}{visits.length===0&&<p className="rounded-xl border border-dashed border-[var(--color-border)] p-6 text-sm text-[var(--color-text-secondary)]">Belum ada kunjungan dalam cakupan akses Anda.</p>}</div>
  </div>}
  {tab==="attendance"&&<div className="space-y-4">
   {canManageAttendance&&<div className="flex flex-wrap gap-2 rounded-xl border border-[var(--color-border)] p-4"><button disabled={busy||Boolean(activeShift)} onClick={()=>void clockIn()} className="rounded-lg bg-[var(--color-primary)] px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">Clock-in + GPS</button><button disabled={busy||!activeShift} onClick={()=>void clockOut()} className="rounded-lg border border-[var(--color-border)] px-4 py-2 text-sm disabled:opacity-50">Clock-out + GPS</button><span className="self-center text-xs text-[var(--color-text-secondary)]">{activeShift?"Shift sedang aktif":"Tidak ada shift aktif untuk akun ini"}</span></div>}
   <div className="overflow-x-auto rounded-xl border border-[var(--color-border)]"><table className="w-full min-w-[640px] text-left text-sm"><thead className="bg-[var(--color-surface)] text-xs"><tr><th className="p-3">Sales</th><th className="p-3">Tanggal</th><th className="p-3">Clock-in</th><th className="p-3">Clock-out</th><th className="p-3">Status</th><th className="p-3">GPS accuracy</th></tr></thead><tbody>{attendance.map(item=><tr key={item.id} className="border-t border-[var(--color-border)]"><td className="p-3">{item.display_name??item.employee_code??item.user_id}</td><td className="p-3">{item.shift_date}</td><td className="p-3">{dateLabel(item.clock_in_at)}</td><td className="p-3">{dateLabel(item.clock_out_at)}</td><td className="p-3">{item.attendance_status??item.status}</td><td className="p-3">{item.clock_in_accuracy_m==null?"—":`${Math.round(item.clock_in_accuracy_m)} m`}</td></tr>)}</tbody></table></div>
  </div>}
  {tab==="activities"&&<div className="space-y-4">
   {canManageActivities&&myProfileId&&<form onSubmit={createActivity} className="flex flex-wrap gap-2 rounded-xl border border-[var(--color-border)] p-4"><select value={activityType} onChange={e=>setActivityType(e.target.value as typeof activityType)} className="rounded-lg border border-[var(--color-border)] bg-transparent p-2 text-sm"><option value="follow_up">Follow-up</option><option value="call">Call</option><option value="meeting">Meeting</option><option value="prospecting">Prospecting</option><option value="report">Report</option><option value="other">Other</option></select><input required value={activityTitle} onChange={e=>setActivityTitle(e.target.value)} placeholder="Deskripsi aktivitas" className="min-w-[220px] flex-1 rounded-lg border border-[var(--color-border)] bg-transparent p-2 text-sm"/><button disabled={busy} className="rounded-lg bg-[var(--color-primary)] px-4 py-2 text-sm font-semibold text-white">Tambah aktivitas</button></form>}
   <div className="space-y-2">{activities.map(item=><article key={item.id} className="flex flex-wrap justify-between gap-3 rounded-xl border border-[var(--color-border)] p-4"><div><h3 className="font-medium">{item.title}</h3><p className="text-xs text-[var(--color-text-secondary)]">{item.activity_type} · {item.status} · {dateLabel(item.created_at)}</p></div>{canManageActivities&&item.status!=="completed"&&<button disabled={busy} onClick={()=>void perform(()=>api!.updateSmartTeamActivity(organizationId!,item.id,{status:"completed"}),"Aktivitas ditandai selesai.")} className="rounded-lg border border-[var(--color-border)] px-3 py-2 text-xs">Tandai selesai</button>}</article>)}{activities.length===0&&<p className="rounded-xl border border-dashed border-[var(--color-border)] p-6 text-sm text-[var(--color-text-secondary)]">Belum ada aktivitas.</p>}</div>
  </div>}
  {tab==="targets"&&<div className="space-y-2">{targets.map(item=><article key={item.id} className="rounded-xl border border-[var(--color-border)] p-4"><div className="flex justify-between gap-3"><strong>{item.metric_key.replaceAll("_"," ")}</strong><span className="font-semibold">{item.target_value}</span></div><p className="mt-1 text-xs text-[var(--color-text-secondary)]">{item.period_start} — {item.period_end} · {item.employee_code??item.team_name??item.branch_name??"Scope"}</p></article>)}{targets.length===0&&<p className="rounded-xl border border-dashed border-[var(--color-border)] p-6 text-sm text-[var(--color-text-secondary)]">Belum ada target yang terlihat pada scope Anda.</p>}</div>}
 </section>;
}
