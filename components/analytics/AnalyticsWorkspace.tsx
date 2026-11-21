'use client';

import React,{useCallback,useEffect,useMemo,useState} from "react";
import {createAnalyticsApi} from "@salesx-ai/api-client";
import type {AnalyticsDashboardResponse,AnalyticsReportExportResponse,AnalyticsReportRun} from "@salesx-ai/api-contracts";
import {useSalesXAuth} from "@/components/providers/AppProviders";

const dateValue=(value:Date)=>value.toISOString().slice(0,10);
const initialEnd=dateValue(new Date());
const initialStart=dateValue(new Date(Date.now()-29*86400000));
const numberValue=(value:number)=>new Intl.NumberFormat("id-ID",{maximumFractionDigits:2}).format(value);

export function AnalyticsWorkspace({compact=false}:{compact?:boolean}){
 const auth=useSalesXAuth();
 const [periodStart,setPeriodStart]=useState(initialStart);
 const [periodEnd,setPeriodEnd]=useState(initialEnd);
 const [grain,setGrain]=useState<"day"|"week"|"month">("day");
 const [scopeType,setScopeType]=useState<"tenant"|"branch"|"team"|"territory"|"user">("tenant");
 const [scopeId,setScopeId]=useState("");
 const [dashboard,setDashboard]=useState<AnalyticsDashboardResponse|null>(null);
 const [reports,setReports]=useState<AnalyticsReportRun[]>([]);
 const [loading,setLoading]=useState(false);
 const [error,setError]=useState<string|null>(null);
 const [busy,setBusy]=useState(false);
 const [notice,setNotice]=useState<string|null>(null);
 const organizationId=auth.activeOrganizationId;
 const api=useMemo(()=>auth.apiClient&&organizationId?createAnalyticsApi(auth.apiClient,organizationId):null,[auth.apiClient,organizationId]);

 const refresh=useCallback(async()=>{
  if(!api)return;
  setLoading(true);setError(null);
  try{
   const [result,history]=await Promise.all([api.dashboard(periodStart,periodEnd,grain,scopeType,scopeId||null),api.reports()]);
   setDashboard(result);setReports(history);
  }catch(cause){setError(cause instanceof Error?cause.message:"Data analytics tidak dapat dimuat.");}
  finally{setLoading(false);}
 },[api,periodStart,periodEnd,grain,scopeType,scopeId]);
 useEffect(()=>{void refresh();},[refresh]);
 useEffect(()=>{
  if(!dashboard?.scopes.length)return;
  const available=dashboard.scopes.filter(scope=>scope.scope_type===scopeType);
  if(!available.length){setScopeType(dashboard.scopes[0].scope_type);return;}
  if(scopeType==="tenant"){setScopeId("");return;}
  if(!available.some(scope=>scope.scope_id===scopeId))setScopeId(available[0].scope_id??"");
 },[dashboard,scopeType,scopeId]);
 useEffect(()=>{
  if(!api||!reports.some(report=>report.status==="queued"||report.status==="running"))return;
  const timer=setInterval(()=>{void api.reports().then(setReports).catch(()=>undefined);},5000);
  return()=>clearInterval(timer);
 },[api,reports]);

 const visibleMetrics=useMemo(()=>{
  const values=dashboard?.metrics??[];
  if(scopeType==="tenant")return values.filter(item=>item.scope_type==="tenant");
  return values.filter(item=>item.scope_type===scopeType&&(!scopeId||item.scope_id===scopeId));
 },[dashboard,scopeType,scopeId]);
 const latestMetrics=useMemo(()=>{
  const latest=new Map<string,number>();
  for(const item of visibleMetrics)latest.set(item.metric_key,(latest.get(item.metric_key)??0)+Number(item.metric_value));
  return [...latest.entries()].map(([key,value])=>({key,value}));
 },[visibleMetrics]);

 const requestExport=async()=>{
  if(!api)return;
  setBusy(true);setNotice(null);setError(null);
  try{
   const selectedScope=dashboard?.scopes.find(scope=>scope.scope_type===scopeType&&(scopeType==="tenant"||scope.scope_id===scopeId));
   if(scopeType!=="tenant"&&!selectedScope?.scope_id)throw new Error("Scope laporan belum tersedia untuk cakupan ini.");
   const result:AnalyticsReportExportResponse=await api.createReport({
    report_key:"operational-kpi",period_start:periodStart,period_end:periodEnd,
    period_grain:grain,scope_type:scopeType,scope_id:scopeType==="tenant"?null:selectedScope?.scope_id??null,
    idempotency_key:"analytics-"+scopeType+"-"+(selectedScope?.scope_id??"tenant")+"-"+periodStart+"-"+periodEnd+"-"+grain+"-"+Date.now(),
   });
   setNotice("Ekspor CSV masuk antrean. Status akan diperbarui otomatis.");
   setReports(current=>[result,...current.filter(item=>item.id!==result.id)]);
   await refresh();
  }catch(cause){setError(cause instanceof Error?cause.message:"Permintaan ekspor gagal.");}
  finally{setBusy(false);}
 };

 const download=async(reportId:string)=>{
  if(!api)return;
  setBusy(true);setError(null);
  try{
   const result=await api.downloadReport(reportId);
   window.open(result.download_url,"_blank","noopener,noreferrer");
  }catch(cause){setError(cause instanceof Error?cause.message:"Unduhan laporan belum tersedia.");}
  finally{setBusy(false);}
 };

 if(!organizationId)return <div className="rounded-xl border border-[var(--color-border)] p-4 text-sm text-[var(--color-text-secondary)]">Pilih organisasi aktif untuk melihat Analytics.</div>;
 return <section className="space-y-4">
  <div className="flex flex-wrap items-end justify-between gap-3">
   <div><h2 className="text-lg font-bold text-[var(--color-text-primary)]">Analytics & KPI</h2>
    <p className="text-xs text-[var(--color-text-muted)]">Data aktual dari FastAPI dan snapshot KPI terjadwal.</p></div>
   <div className="flex flex-wrap gap-2">
    <button type="button" onClick={()=>void refresh()} disabled={loading} className="rounded-lg border border-[var(--color-border)] px-3 py-2 text-xs font-semibold disabled:opacity-50">{loading?"Memuat…":"Refresh"}</button>
    <button type="button" onClick={()=>void requestExport()} disabled={busy||!auth.canPerformApiAction("analytics.reports.create")} className="rounded-lg bg-[#348CB2] px-3 py-2 text-xs font-semibold text-white disabled:opacity-50">{busy?"Memproses…":"Ekspor CSV"}</button>
   </div>
  </div>
  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
   <label className="text-xs text-[var(--color-text-secondary)]">Dari<input type="date" value={periodStart} max={periodEnd} onChange={e=>setPeriodStart(e.target.value)} className="mt-1 w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-2 text-sm text-[var(--color-text-primary)]"/></label>
   <label className="text-xs text-[var(--color-text-secondary)]">Sampai<input type="date" value={periodEnd} min={periodStart} onChange={e=>setPeriodEnd(e.target.value)} className="mt-1 w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-2 text-sm text-[var(--color-text-primary)]"/></label>
   <label className="text-xs text-[var(--color-text-secondary)]">Periode<select value={grain} onChange={e=>setGrain(e.target.value as typeof grain)} className="mt-1 w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-2 text-sm text-[var(--color-text-primary)]"><option value="day">Harian</option><option value="week">Mingguan</option><option value="month">Bulanan</option></select></label>
   <label className="text-xs text-[var(--color-text-secondary)]">Cakupan<select value={scopeType} onChange={e=>setScopeType(e.target.value as typeof scopeType)} className="mt-1 w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-2 text-sm text-[var(--color-text-primary)]"><option value="tenant">Organisasi</option><option value="branch">Cabang</option><option value="team">Tim</option><option value="territory">Teritori</option><option value="user">Salesperson</option></select></label>
   {scopeType!=="tenant"&&<label className="text-xs text-[var(--color-text-secondary)]">ID Scope<select value={scopeId} onChange={e=>setScopeId(e.target.value)} className="mt-1 w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-2 text-xs text-[var(--color-text-primary)]">{(dashboard?.scopes??[]).filter(scope=>scope.scope_type===scopeType).map(scope=><option key={scope.scope_id??"tenant"} value={scope.scope_id??""}>{scope.scope_id}</option>)}</select></label>}
  </div>
  {error&&<p role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-700">{error}</p>}
  {notice&&<p role="status" className="rounded-lg border border-[var(--color-border)] p-3 text-xs text-[var(--color-text-secondary)]">{notice}</p>}
  <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
   {latestMetrics.map(item=><div key={item.key} className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-3">
    <p className="text-[11px] text-[var(--color-text-muted)]">{item.key}</p><p className="mt-1 text-xl font-bold tabular-nums text-[var(--color-text-primary)]">{numberValue(item.value)}</p>
   </div>)}
   {!loading&&latestMetrics.length===0&&<p className="col-span-full rounded-xl border border-dashed border-[var(--color-border)] p-4 text-xs text-[var(--color-text-muted)]">Belum ada snapshot untuk periode dan cakupan ini. Worker refresh akan mengisi data setelah sumber transaksi tersedia.</p>}
  </div>
  <div className="overflow-x-auto rounded-xl border border-[var(--color-border)]">
   <table className="w-full min-w-[720px] text-left text-xs">
    <thead className="bg-[var(--color-surface-muted)] text-[var(--color-text-secondary)]"><tr><th className="p-3">Metric</th><th className="p-3">Periode</th><th className="p-3">Scope</th><th className="p-3 text-right">Nilai</th><th className="p-3">Calculated</th></tr></thead>
    <tbody>{visibleMetrics.map((row,index)=><tr key={row.metric_key+row.period_start+row.scope_type+String(row.scope_id)+index} className="border-t border-[var(--color-border)]"><td className="p-3 font-semibold">{row.metric_key}</td><td className="p-3">{row.period_start} – {row.period_end}</td><td className="p-3">{row.scope_type}</td><td className="p-3 text-right tabular-nums">{numberValue(Number(row.metric_value))}</td><td className="p-3">{new Date(row.calculated_at).toLocaleString("id-ID")}</td></tr>)}</tbody>
   </table>
  </div>
  {!compact&&<div className="space-y-2">
   <h3 className="text-sm font-bold text-[var(--color-text-primary)]">Riwayat Laporan</h3>
   {reports.map(report=><div key={report.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[var(--color-border)] p-3">
    <div><p className="text-xs font-semibold">{report.report_key} · {report.period_start} – {report.period_end}</p><p className="mt-1 text-[11px] text-[var(--color-text-muted)]">Status report: {report.status}</p></div>
    <button type="button" disabled={busy||report.status!=="completed"} onClick={()=>void download(report.id)} className="rounded-lg border border-[var(--color-border)] px-3 py-2 text-xs font-semibold disabled:opacity-40">Download CSV</button>
   </div>)}
   {reports.length===0&&<p className="text-xs text-[var(--color-text-muted)]">Belum ada riwayat ekspor.</p>}
  </div>}
 </section>;
}
