"use client";
import {useCallback,useEffect,useMemo,useState} from "react";
import {createSmartRewardApi,type RewardBalance,type RewardCatalogItem,type RewardLedgerEntry,type RewardProgram,type RewardRedemption} from "@salesx-ai/api-client";
import {useSalesXAuth} from "@/components/providers/AppProviders";
type Tab="overview"|"catalog"|"history"|"programs"|"reports";
const fmt=(n:number)=>new Intl.NumberFormat("id-ID").format(n);
export function SmartRewardWorkspace(){
 const auth=useSalesXAuth(),org=auth.activeOrganizationId,client=auth.apiClient;
 const api=useMemo(()=>client&&org?createSmartRewardApi(client,org):null,[client,org]);
 const [tab,setTab]=useState<Tab>("overview"),[balance,setBalance]=useState<RewardBalance|null>(null),[catalog,setCatalog]=useState<RewardCatalogItem[]>([]),[ledger,setLedger]=useState<RewardLedgerEntry[]>([]),[redemptions,setRedemptions]=useState<RewardRedemption[]>([]),[programs,setPrograms]=useState<RewardProgram[]>([]),[report,setReport]=useState<Record<string,unknown>|null>(null);
 const [busy,setBusy]=useState(false),[loading,setLoading]=useState(false),[error,setError]=useState(""),[notice,setNotice]=useState("");
 const [qty,setQty]=useState<Record<string,string>>({});
 const can=(id:string)=>auth.canPerformApiAction(id as never);
 const canRealtime=can("smartreward.ledger.read")||can("smartreward.redemptions.read");
 const refresh=useCallback(async()=>{
  if(!api||auth.status!=="authenticated")return;setLoading(true);setError("");
  const jobs:Promise<void>[]=[];
  if(can("smartreward.balance.read"))jobs.push(api.balance().then(setBalance));
  if(can("smartreward.catalog.read"))jobs.push(api.catalog(1,40).then(x=>setCatalog(x.items)));
  if(can("smartreward.ledger.read"))jobs.push(api.ledger(1,30).then(x=>setLedger(x.items)));
  if(can("smartreward.redemptions.read"))jobs.push(api.redemptions(1,30).then(x=>setRedemptions(x.items)));
  if(can("smartreward.programs.read"))jobs.push(api.programs(1,30).then(x=>setPrograms(x.items)));
  if(can("smartreward.reports.read"))jobs.push(api.reports(1,30).then(setReport));
  const results=await Promise.allSettled(jobs),failed=results.find(x=>x.status==="rejected");
  if(failed&&failed.status==="rejected")setError(failed.reason instanceof Error?failed.reason.message:"Data SmartReward gagal dimuat.");
  setLoading(false);
 },[api,auth.status,auth.contextEpoch,auth.activeOrganizationId,auth.context]);
 useEffect(()=>{void refresh();},[refresh]);
 useEffect(()=>{
  if(!client||!org||auth.status!=="authenticated"||!canRealtime)return;
  const url=process.env.NEXT_PUBLIC_SUPABASE_URL??"",key=process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY??"";
  if(!url||!key)return;
  return client.subscribeSmartRewardBroadcast(org,url,key,()=>void refresh(),()=>void refresh());
 },[client,org,auth.status,canRealtime,refresh]);
 const run=async(fn:()=>Promise<unknown>,message:string)=>{setBusy(true);setError("");setNotice("");try{await fn();setNotice(message);await refresh();}catch(e){setError(e instanceof Error?e.message:"Permintaan SmartReward gagal.");}finally{setBusy(false);}};
 const tabs:Tab[]=["overview","catalog","history",...(can("smartreward.programs.read")?["programs" as const]:[]),...(can("smartreward.reports.read")?["reports" as const]:[])];
 if(!org)return <section className="rounded-2xl border p-6"><h1 className="text-xl font-semibold">SmartReward</h1><p className="mt-2 text-sm text-slate-500">Pilih organisasi aktif untuk memuat reward.</p></section>;
 return <section className="space-y-5">
  <header className="flex flex-wrap items-center justify-between gap-3"><div><p className="text-xs font-semibold uppercase tracking-wider text-sky-700">Loyalty & Incentive</p><h1 className="text-2xl font-semibold">SmartReward</h1><p className="text-sm text-slate-500">Saldo, ledger, katalog, dan penukaran dari FastAPI.</p></div><button className="rounded-xl border px-4 py-2 text-sm" disabled={loading} onClick={()=>void refresh()}>{loading?"Memuat…":"Muat ulang"}</button></header>
  <nav className="flex flex-wrap gap-2">{tabs.map(t=><button key={t} onClick={()=>setTab(t)} className={"rounded-full border px-4 py-2 text-sm "+(tab===t?"border-sky-600 bg-sky-50 text-sky-900":"")}>{({overview:"Ringkasan",catalog:"Katalog",history:"Riwayat",programs:"Program",reports:"Laporan"} as Record<string,string>)[t]}</button>)}</nav>
  {error&&<p role="alert" className="rounded-xl border border-red-300 bg-red-50 p-3 text-sm text-red-800">{error}</p>}{notice&&<p role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">{notice}</p>}
  {tab==="overview"&&<div className="grid gap-4 md:grid-cols-3"><article className="rounded-2xl border p-5"><p className="text-sm text-slate-500">Saldo poin</p><p className="mt-2 text-3xl font-semibold">{balance?fmt(balance.points_balance):"—"}</p></article><article className="rounded-2xl border p-5"><p className="text-sm text-slate-500">Item reward</p><p className="mt-2 text-3xl font-semibold">{catalog.length}</p></article><article className="rounded-2xl border p-5"><p className="text-sm text-slate-500">Penukaran</p><p className="mt-2 text-3xl font-semibold">{redemptions.length}</p></article><article className="rounded-2xl border p-5 md:col-span-3"><h2 className="font-semibold">Aktivitas poin terbaru</h2>{ledger.slice(0,8).map(x=><div key={x.id} className="flex justify-between gap-3 border-t py-3 text-sm"><span>{x.reason||x.entry_type}</span><strong>{x.points_delta>0?"+":""}{fmt(x.points_delta)}</strong></div>)}{ledger.length===0&&<p className="mt-3 text-sm text-slate-500">Belum ada transaksi poin.</p>}</article></div>}
  {tab==="catalog"&&<div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{catalog.map(item=><article key={item.id} className="rounded-2xl border p-5"><h2 className="font-semibold">{item.name}</h2><p className="text-xs text-slate-500">{item.category} · {item.code}</p><p className="my-3 text-sm text-slate-600">{item.description||"Reward katalog organisasi."}</p><strong>{fmt(item.points_cost)} poin</strong><p className="mt-1 text-xs text-slate-500">{item.quantity_total===null?"Stok tidak dibatasi":Math.max(0,item.quantity_total-item.quantity_reserved-item.quantity_fulfilled)+" tersedia"}</p>{can("smartreward.redemptions.create")&&<div className="mt-4 flex gap-2"><input aria-label={"Jumlah "+item.name} className="w-20 rounded-lg border px-2" type="number" min="1" max="100" value={qty[item.id]??"1"} onChange={e=>setQty(v=>({...v,[item.id]:e.target.value}))}/><button disabled={busy||item.status!=="active"} className="rounded-lg bg-sky-700 px-3 py-2 text-sm text-white disabled:opacity-50" onClick={()=>void run(()=>api!.redeem({catalog_item_id:item.id,quantity:Math.max(1,Number(qty[item.id]??1)),idempotency_key:"web-reward-"+crypto.randomUUID()}),"Permintaan penukaran dikirim.")}>Tukar poin</button></div>}</article>)}{catalog.length===0&&<p className="text-sm text-slate-500">Belum ada reward aktif.</p>}</div>}
  {tab==="history"&&<div className="grid gap-4 lg:grid-cols-2"><article className="rounded-2xl border p-5"><h2 className="font-semibold">Ledger poin</h2>{ledger.map(x=><div key={x.id} className="flex justify-between gap-3 border-t py-3 text-sm"><span>{x.reason||x.entry_type}<small className="block text-xs text-slate-500">{new Date(x.occurred_at).toLocaleString("id-ID")}</small></span><strong>{x.points_delta>0?"+":""}{fmt(x.points_delta)}</strong></div>)}</article><article className="rounded-2xl border p-5"><h2 className="font-semibold">Penukaran reward</h2>{redemptions.map(x=><div key={x.id} className="border-t py-3 text-sm"><div className="flex justify-between"><strong>{x.id.slice(0,8)}</strong><span>{x.status}</span></div><small className="text-slate-500">{x.quantity} item · {fmt(x.points_reserved)} poin</small></div>)}</article></div>}
  {tab==="programs"&&<div className="space-y-3">{programs.map(p=><article key={p.id} className="rounded-xl border p-4"><div className="flex justify-between gap-3"><div><h2 className="font-semibold">{p.name}</h2><p className="text-xs text-slate-500">{p.code} · {p.program_type}</p></div><span className="text-xs">{p.status}</span></div><p className="mt-2 text-sm text-slate-500">{new Date(p.starts_at).toLocaleDateString("id-ID")} – {new Date(p.ends_at).toLocaleDateString("id-ID")}</p></article>)}{programs.length===0&&<p className="text-sm text-slate-500">Belum ada program reward.</p>}</div>}
  {tab==="reports"&&<article className="rounded-2xl border p-5"><h2 className="font-semibold">Ringkasan reward organisasi</h2><pre className="mt-3 overflow-auto rounded-xl bg-slate-50 p-4 text-xs">{JSON.stringify(report??{},null,2)}</pre></article>}
 </section>;
}
