import {useCallback,useEffect,useMemo,useState} from "react";
import {Pressable,View} from "react-native";
import {NativeStack,NativeSurface,NativeText,useNativeTheme} from "@salesx-ai/design-system/native";
import {createSmartRewardApi,type RewardBalance,type RewardCatalogItem,type RewardLedgerEntry,type RewardRedemption,type RewardProgram,type RewardApprovalRequest} from "@salesx-ai/api-client";
import {useMobileSalesAuth} from "../auth/useMobileSalesAuth";
type Auth=ReturnType<typeof useMobileSalesAuth>;
const fmt=(n:number)=>new Intl.NumberFormat("id-ID").format(n);
export function SmartRewardHome({auth}:{auth:Auth}){
 const {colors}=useNativeTheme(),org=auth.activeOrganizationId,client=auth.apiClient;
 const api=useMemo(()=>client&&org?createSmartRewardApi(client,org):null,[client,org]);
 const [balance,setBalance]=useState<RewardBalance|null>(null),[catalog,setCatalog]=useState<RewardCatalogItem[]>([]),[ledger,setLedger]=useState<RewardLedgerEntry[]>([]),[redemptions,setRedemptions]=useState<RewardRedemption[]>([]),[programs,setPrograms]=useState<RewardProgram[]>([]),[approvals,setApprovals]=useState<RewardApprovalRequest[]>([]);
 const [busy,setBusy]=useState(false),[notice,setNotice]=useState(""),[error,setError]=useState("");
 const can=(id:string)=>auth.canPerformApiAction(id as never);
 const canRealtime=can("smartreward.ledger.read")||can("smartreward.redemptions.read");
 const refresh=useCallback(async()=>{
  if(!api||auth.status!=="authenticated")return;
  const jobs:Promise<void>[]=[];
  if(can("smartreward.balance.read"))jobs.push(api.balance().then(setBalance));
  if(can("smartreward.catalog.read"))jobs.push(api.catalog(1,30).then(r=>setCatalog(r.items)));
  if(can("smartreward.ledger.read"))jobs.push(api.ledger(1,20).then(r=>setLedger(r.items)));
  if(can("smartreward.redemptions.read"))jobs.push(api.redemptions(1,20).then(r=>setRedemptions(r.items)));
  if(can("smartreward.programs.read"))jobs.push(api.programs(1,20).then(r=>setPrograms(r.items)));
  if(can("smartreward.approvals.read"))jobs.push(api.approvals(1,20).then(r=>setApprovals(r.items)));
  const settled=await Promise.allSettled(jobs),failed=settled.find(x=>x.status==="rejected");
  if(failed&&failed.status==="rejected")setError(failed.reason instanceof Error?failed.reason.message:"Data reward gagal dimuat.");
 },[api,auth.status,auth.contextEpoch,org]);
 useEffect(()=>{void refresh();},[refresh]);
 useEffect(()=>{
  if(!client||!org||auth.status!=="authenticated"||!canRealtime)return;
  const url=process.env.EXPO_PUBLIC_SUPABASE_URL??"",key=process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY??"";
  if(url&&key)return client.subscribeSmartRewardBroadcast(org,auth.context!.user.id,url,key,()=>void refresh(),()=>void refresh());
  return client.subscribeSmartRewardEvents(org,()=>void refresh(),()=>void refresh());
 },[client,org,auth.status,canRealtime,refresh]);
 const redeem=async(item:RewardCatalogItem)=>{
  if(!api)return;setBusy(true);setError("");setNotice("");
  try{await api.redeem({catalog_item_id:item.id,quantity:1,idempotency_key:"expo-reward-"+Date.now()+"-"+Math.random().toString(36).slice(2)});setNotice("Permintaan penukaran dikirim.");await refresh();}
  catch(e){setError(e instanceof Error?e.message:"Penukaran reward gagal.");}
  finally{setBusy(false);}
 };
 if(!org)return null;
 return <NativeStack gap="3">
  <NativeText variant="title" weight="semibold">SmartReward & Incentive</NativeText>
  <NativeSurface elevation="sm" radius="lg" style={{padding:16}}><NativeText color={colors.textSecondary}>Saldo poin</NativeText><NativeText variant="heading" weight="bold">{balance?fmt(balance.points_balance):"—"}</NativeText><NativeText variant="caption" color={colors.textSecondary}>Saldo dihitung dan direkonsiliasi oleh FastAPI.</NativeText>{balance?.next_expiration_at&&<NativeText variant="caption" color={colors.textSecondary}>{fmt(balance.expiring_points_30d??0)} poin kedaluwarsa dalam 30 hari · berikutnya {new Date(balance.next_expiration_at).toLocaleDateString("id-ID")}</NativeText>}</NativeSurface>
  <NativeSurface elevation="sm" radius="lg" style={{padding:14}}><NativeText weight="semibold">Progress incentive</NativeText><NativeText variant="title">{programs.filter(p=>p.status==="active").length} program aktif</NativeText><NativeText variant="caption" color={colors.textSecondary}>{fmt(ledger.filter(x=>x.points_delta>0&&x.entry_type==="earn").reduce((n,x)=>n+x.points_delta,0))} poin diperoleh dari ledger</NativeText></NativeSurface>
  {notice!==""&&<NativeText color={colors.success}>{notice}</NativeText>}{error!==""&&<NativeText color={colors.danger}>{error}</NativeText>}
  <NativeText variant="title" weight="semibold">Katalog reward</NativeText>
  {catalog.map(item=><NativeSurface key={item.id} elevation="sm" radius="lg" style={{padding:14}}><NativeStack gap="2"><NativeText weight="semibold">{item.name}</NativeText><NativeText variant="caption" color={colors.textSecondary}>{fmt(item.points_cost)} poin · {item.status}</NativeText>{can("smartreward.redemptions.create")&&<Pressable disabled={busy||item.status!=="active"} onPress={()=>void redeem(item)} style={{padding:12,borderRadius:10,backgroundColor:colors.primary,opacity:busy?0.5:1}}><NativeText color={colors.surface} weight="semibold">Tukar reward</NativeText></Pressable>}</NativeStack></NativeSurface>)}
  <NativeText variant="title" weight="semibold">Riwayat poin</NativeText>
  {ledger.slice(0,10).map(item=><View key={item.id} style={{paddingVertical:8,borderBottomWidth:1,borderBottomColor:colors.border}}><NativeText>{item.reason||item.entry_type} · {item.points_delta>0?"+":""}{fmt(item.points_delta)}</NativeText></View>)}
  <NativeText variant="title" weight="semibold">Status penukaran</NativeText>
  {redemptions.map(item=><NativeSurface key={item.id} elevation="sm" radius="md" style={{padding:12}}><NativeText weight="semibold">{item.status}</NativeText><NativeText variant="caption" color={colors.textSecondary}>{item.quantity} item · {fmt(item.points_reserved)} poin</NativeText></NativeSurface>)}
  {approvals.length>0&&<><NativeText variant="title" weight="semibold">Status approval</NativeText>{approvals.map(item=><NativeSurface key={item.id} elevation="sm" radius="md" style={{padding:12}}><NativeText weight="semibold">{item.status}</NativeText><NativeText variant="caption" color={colors.textSecondary}>{item.request_type} · {fmt(item.points_requested)} poin</NativeText></NativeSurface>)}</>}
 </NativeStack>;
}
