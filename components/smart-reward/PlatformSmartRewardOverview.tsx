"use client";
import { useEffect, useState } from "react";
import { useSalesXAuth } from "@/components/providers/AppProviders";
import type { PlatformSmartRewardOverviewRow } from "@salesx-ai/api-client";

const fmt=(value:number)=>new Intl.NumberFormat("id-ID").format(Number(value||0));
export function PlatformSmartRewardOverview(){
 const auth=useSalesXAuth();
 const [rows,setRows]=useState<PlatformSmartRewardOverviewRow[]>([]);
 const [total,setTotal]=useState(0);
 const [start,setStart]=useState("");
 const [end,setEnd]=useState("");
 const [loading,setLoading]=useState(false);
 const [error,setError]=useState<string|null>(null);
 const [refreshKey,setRefreshKey]=useState(0);
 const allowed=auth.canPerformApiAction("platform.smartreward.overview.read");
 useEffect(()=>{
  if(!allowed||!auth.apiClient){setRows([]);setTotal(0);setError("Akses platform SmartReward tidak diizinkan.");return;}
  let active=true;setLoading(true);setError(null);
  const startAt=start?new Date(start+"T00:00:00").toISOString():undefined;
  const endAt=end?new Date(end+"T23:59:59.999").toISOString():undefined;
  void auth.apiClient.listPlatformSmartRewardOverview(500,0,startAt,endAt)
   .then(result=>{if(active){setRows(result.items);setTotal(result.total);}})
   .catch(reason=>{if(active)setError(reason instanceof Error?reason.message:"Gagal memuat overview SmartReward.");})
   .finally(()=>{if(active)setLoading(false);});
  return()=>{active=false;};
 },[allowed,auth.apiClient,start,end,refreshKey]);
 const totals=rows.reduce((sum,row)=>({earned:sum.earned+row.earned_points,redeemed:sum.redeemed+row.redeemed_points,outstanding:sum.outstanding+row.outstanding_points,expired:sum.expired+row.expired_points,participants:sum.participants+row.participants}),{earned:0,redeemed:0,outstanding:0,expired:0,participants:0});
 const metrics=[["Tenant aktif",fmt(total)],["Peserta reward",fmt(totals.participants)],["Poin diperoleh",fmt(totals.earned)],["Poin ditukar",fmt(totals.redeemed)],["Outstanding",fmt(totals.outstanding)],["Poin expired",fmt(totals.expired)]];
 return <section className="space-y-5">
  <header className="flex flex-wrap items-start justify-between gap-3"><div><h2 className="text-xl font-semibold text-[var(--salesx-color-text-primary)]">SmartReward Global Operations</h2><p className="mt-1 text-sm text-[var(--salesx-color-text-secondary)]">Agregasi lintas organisasi. Detail peserta dan ledger individual tetap berada di tenant masing-masing.</p></div><button onClick={()=>setRefreshKey(v=>v+1)} disabled={loading} className="rounded-lg border border-[var(--salesx-color-border)] px-3 py-2 text-sm disabled:opacity-50">Refresh</button></header>
  <div className="flex flex-wrap items-end gap-3 rounded-xl border border-[var(--salesx-color-border)] p-4"><label className="text-xs text-[var(--salesx-color-text-secondary)]">Dari<input type="date" value={start} onChange={e=>setStart(e.target.value)} className="mt-1 block rounded-lg border border-[var(--salesx-color-border)] bg-[var(--salesx-color-surface)] px-3 py-2"/></label><label className="text-xs text-[var(--salesx-color-text-secondary)]">Sampai<input type="date" value={end} onChange={e=>setEnd(e.target.value)} className="mt-1 block rounded-lg border border-[var(--salesx-color-border)] bg-[var(--salesx-color-surface)] px-3 py-2"/></label><span className="text-xs text-[var(--salesx-color-text-muted)]">Periode membatasi transaksi; saldo outstanding adalah posisi saat ini.</span></div>
  {error&&<div role="alert" className="rounded-xl border border-[var(--salesx-color-danger)] p-3 text-sm text-[var(--salesx-color-danger)]">{error}</div>}
  <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">{metrics.map(([label,value])=><article key={label} className="rounded-xl border border-[var(--salesx-color-border)] p-4"><p className="text-xs text-[var(--salesx-color-text-muted)]">{label}</p><strong className="mt-1 block text-2xl text-[var(--salesx-color-text-primary)]">{value}</strong></article>)}</div>
  <div className="overflow-x-auto rounded-xl border border-[var(--salesx-color-border)]"><table className="w-full min-w-[900px] text-left text-sm"><thead className="bg-[var(--salesx-color-surface-muted)] text-[var(--salesx-color-text-secondary)]"><tr>{["Organisasi","Peserta","Earned","Redeemed","Outstanding","Expired","Adjusted","Incentive","Pending redeem","Pending approval"].map(x=><th key={x} className="px-3 py-3 font-medium">{x}</th>)}</tr></thead><tbody>{rows.map(row=><tr key={row.organization_id} className="border-t border-[var(--salesx-color-border)]"><td className="px-3 py-3 font-medium">{row.organization_name}</td><td className="px-3 py-3">{fmt(row.participants)}</td><td className="px-3 py-3">{fmt(row.earned_points)}</td><td className="px-3 py-3">{fmt(row.redeemed_points)}</td><td className="px-3 py-3">{fmt(row.outstanding_points)}</td><td className="px-3 py-3">{fmt(row.expired_points)}</td><td className="px-3 py-3">{fmt(row.adjusted_points)}</td><td className="px-3 py-3">{fmt(row.reversed_points)}</td><td className="px-3 py-3">{fmt(row.incentive_achievements)}</td><td className="px-3 py-3">{fmt(row.pending_redemptions)}</td><td className="px-3 py-3">{fmt(row.pending_approvals)}</td></tr>)}{!loading&&rows.length===0&&<tr><td colSpan={11} className="px-3 py-8 text-center text-[var(--salesx-color-text-muted)]">Belum ada data reward di organisasi aktif.</td></tr>}</tbody></table></div>
  {loading&&<p className="text-sm text-[var(--salesx-color-text-muted)]">Memuat agregasi platform…</p>}
 </section>;
}
