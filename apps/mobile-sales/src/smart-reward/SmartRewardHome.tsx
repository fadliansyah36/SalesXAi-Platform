import {useCallback,useEffect,useMemo,useRef,useState} from "react";
import {Pressable,TextInput,View} from "react-native";
import {NativeStack,NativeSurface,NativeText,useNativeTheme} from "@salesx-ai/design-system/native";
import {createSmartRewardApi,type RewardBalance,type RewardCatalogItem,type RewardLedgerEntry,type RewardRedemption,type RewardProgram,type RewardApprovalRequest,type RewardProgressItem} from "@salesx-ai/api-client";
import {useMobileSalesAuth} from "../auth/useMobileSalesAuth";
type Auth=ReturnType<typeof useMobileSalesAuth>;
const fmt=(n:number)=>new Intl.NumberFormat("id-ID").format(n);
const eligibilityLabel=(reason?:string|null)=>({membership_required:"Keanggotaan aktif diperlukan",catalog_inactive:"Reward tidak aktif",catalog_not_started:"Periode belum dimulai",catalog_expired:"Periode berakhir",out_of_stock:"Stok habis",reward_program_inactive:"Program tidak aktif",role_ineligible:"Role tidak memenuhi syarat",branch_ineligible:"Cabang tidak memenuhi syarat",participant_ineligible:"Peserta tidak termasuk audience",insufficient_minimum_balance:"Saldo minimum belum tercapai",participant_period_limit:"Batas periode tercapai",catalog_period_limit:"Batas katalog tercapai",insufficient_points:"Poin tidak mencukupi"} as Record<string,string>)[reason??""]??"Belum memenuhi syarat";
export function SmartRewardHome({auth}:{auth:Auth}){
 const {colors}=useNativeTheme(),org=auth.activeOrganizationId,client=auth.apiClient;
 const api=useMemo(()=>client&&org?createSmartRewardApi(client,org):null,[client,org]);
 const [balance,setBalance]=useState<RewardBalance|null>(null),[catalog,setCatalog]=useState<RewardCatalogItem[]>([]),[ledger,setLedger]=useState<RewardLedgerEntry[]>([]),[redemptions,setRedemptions]=useState<RewardRedemption[]>([]),[programs,setPrograms]=useState<RewardProgram[]>([]),[approvals,setApprovals]=useState<RewardApprovalRequest[]>([]),[progress,setProgress]=useState<RewardProgressItem[]>([]);
 const [busy,setBusy]=useState(false),[notice,setNotice]=useState(""),[error,setError]=useState("");
 const [redemptionReasons,setRedemptionReasons]=useState<Record<string,string>>({});
 const [fulfillmentRefs,setFulfillmentRefs]=useState<Record<string,string>>({});
 const [approvalReasons,setApprovalReasons]=useState<Record<string,string>>({});
 const redemptionKeys=useRef<Record<string,string>>({});
 const can=(id:string)=>auth.canPerformApiAction(id as never);
 const canDecideRedemptions=can("smartreward.redemptions.decide");
 const canFulfillRedemptions=can("smartreward.redemptions.fulfill");
 const canCancelRedemptions=can("smartreward.redemptions.cancel");
 const canDecideApprovals=can("smartreward.approvals.decide");
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
  if(can("smartreward.progress.read"))jobs.push(api.progress().then(r=>setProgress(r.items)));
  const settled=await Promise.allSettled(jobs),failed=settled.find(x=>x.status==="rejected");
  if(failed&&failed.status==="rejected")setError(failed.reason instanceof Error?failed.reason.message:"Data reward gagal dimuat.");
 },[api,auth.status,auth.contextEpoch,org]);
 useEffect(()=>{void refresh();},[refresh]);
 useEffect(()=>{
  if(!client||!org||auth.status!=="authenticated"||!canRealtime)return;
  const url=process.env.EXPO_PUBLIC_SUPABASE_URL??"",key=process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY??"";
  const needsScopedStream=can("smartreward.redemptions.decide")||can("smartreward.approvals.decide")||can("smartreward.reports.read");
  // Supabase private user-topic Broadcast stays disabled until the owner policy is applied and verified.
  const privateBroadcastReady=process.env.EXPO_PUBLIC_SMARTREWARD_PRIVATE_BROADCAST_ENABLED==="true";
  if(url&&key&&privateBroadcastReady&&!needsScopedStream)return client.subscribeSmartRewardBroadcast(org,auth.context!.user.id,url,key,()=>void refresh(),()=>void refresh());
  // Default to the server-authorized tenant/branch/participant SSE stream until
  // the owner-level Supabase private-channel policy is active and verified.
  return client.subscribeSmartRewardEvents(org,()=>void refresh(),()=>void refresh());
 },[client,org,auth.status,canRealtime,refresh]);
 const mutate=async(action:()=>Promise<unknown>,success:string):Promise<boolean>=>{
  if(!api)return false;setBusy(true);setError("");setNotice("");
  try{await action();setNotice(success);await refresh();return true;}
  catch(e){setError(e instanceof Error?e.message:"Permintaan SmartReward gagal.");return false;}
  finally{setBusy(false);}
 };
 const redeem=async(item:RewardCatalogItem)=>{
  const key=redemptionKeys.current[item.id]??("expo-reward-"+Date.now()+"-"+Math.random().toString(36).slice(2));
  redemptionKeys.current[item.id]=key;
  const success=await mutate(
   ()=>api!.redeem({catalog_item_id:item.id,quantity:1,idempotency_key:key}),
   "Permintaan penukaran dikirim."
  );
  if(success)delete redemptionKeys.current[item.id];
 };
 if(!org)return null;
 return <NativeStack gap="3">
  <NativeText variant="title" weight="semibold">SmartReward & Incentive</NativeText>
  <NativeSurface elevation="sm" radius="lg" style={{padding:16}}><NativeText color={colors.textSecondary}>Saldo poin</NativeText><NativeText variant="heading" weight="bold">{balance?fmt(balance.points_balance):"—"}</NativeText><NativeText variant="caption" color={colors.textSecondary}>Saldo dihitung dan direkonsiliasi oleh FastAPI.</NativeText>{balance?.next_expiration_at&&<NativeText variant="caption" color={colors.textSecondary}>{fmt(balance.expiring_points_30d??0)} poin kedaluwarsa dalam 30 hari · berikutnya {new Date(balance.next_expiration_at).toLocaleDateString("id-ID")}</NativeText>}</NativeSurface>
  <NativeSurface elevation="sm" radius="lg" style={{padding:14}}><NativeText weight="semibold">Progress incentive</NativeText><NativeText variant="title">{programs.filter(p=>p.status==="active").length} program aktif</NativeText><NativeText variant="caption" color={colors.textSecondary}>{fmt(ledger.filter(x=>x.points_delta>0&&x.entry_type==="earn").reduce((n,x)=>n+x.points_delta,0))} poin diperoleh dari ledger</NativeText>{progress.map(item=><View key={item.rule_id} style={{paddingTop:10,marginTop:10,borderTopWidth:1,borderTopColor:colors.border}}><NativeText weight="semibold">{item.rule_name}</NativeText><NativeText variant="caption" color={colors.textSecondary}>{item.program_name} · {item.period_days} hari</NativeText><NativeText variant="caption">{fmt(item.points_earned)} poin{item.points_limit!==null?" / "+fmt(item.points_limit)+" poin":""}</NativeText>{item.target_metric!==null&&<NativeText variant="caption" color={colors.textSecondary}>Metric {String(item.metric_achieved)} / {String(item.target_metric)}</NativeText>}{item.progress_percent!==null&&<View style={{height:6,backgroundColor:colors.border,borderRadius:8,overflow:"hidden",marginTop:6}}><View style={{height:6,width:Math.max(0,Math.min(100,Number(item.progress_percent)))+"%",backgroundColor:colors.primary,borderRadius:8}}/></View>}</View>)}</NativeSurface>
  {notice!==""&&<NativeText color={colors.success}>{notice}</NativeText>}{error!==""&&<NativeText color={colors.danger}>{error}</NativeText>}
  <NativeText variant="title" weight="semibold">Katalog reward</NativeText>
  {catalog.map(item=><NativeSurface key={item.id} elevation="sm" radius="lg" style={{padding:14}}><NativeStack gap="2"><NativeText weight="semibold">{item.name}</NativeText><NativeText variant="caption" color={colors.textSecondary}>{fmt(item.points_cost)} poin · {item.status} · {item.available_stock===null?"Stok unlimited":fmt(item.available_stock??0)+" tersedia"}</NativeText><NativeText variant="caption" color={item.eligible?colors.success:colors.warning}>{item.eligible?"Memenuhi syarat":eligibilityLabel(item.eligibility_reason)}</NativeText>{item.period_remaining!==null&&item.period_remaining!==undefined&&<NativeText variant="caption" color={colors.textSecondary}>Sisa batas periode: {fmt(item.period_remaining)}</NativeText>}{item.catalog_period_remaining!==null&&item.catalog_period_remaining!==undefined&&<NativeText variant="caption" color={colors.textSecondary}>Sisa batas katalog: {fmt(item.catalog_period_remaining)}</NativeText>}{can("smartreward.redemptions.create")&&<Pressable disabled={busy||item.status!=="active"||item.eligible!==true} onPress={()=>void redeem(item)} style={{padding:12,borderRadius:10,backgroundColor:colors.primary,opacity:busy?0.5:1}}><NativeText color={colors.surface} weight="semibold">Tukar reward</NativeText></Pressable>}</NativeStack></NativeSurface>)}
  <NativeText variant="title" weight="semibold">Riwayat poin</NativeText>
  {ledger.slice(0,10).map(item=><View key={item.id} style={{paddingVertical:8,borderBottomWidth:1,borderBottomColor:colors.border}}><NativeText>{item.reason||item.entry_type} · {item.points_delta>0?"+":""}{fmt(item.points_delta)}</NativeText></View>)}
  <NativeText variant="title" weight="semibold">Status penukaran</NativeText>
  {redemptions.map(item=><NativeSurface key={item.id} elevation="sm" radius="md" style={{padding:12}}><NativeStack gap="2">
   <NativeText weight="semibold">{item.status}</NativeText>
   <NativeText variant="caption" color={colors.textSecondary}>{item.quantity} item · {fmt(item.points_reserved)} poin</NativeText>
   {item.fulfillment_reference&&<NativeText variant="caption" color={colors.textSecondary}>Referensi fulfillment: {item.fulfillment_reference}</NativeText>}
   {item.status==="requested"&&canDecideRedemptions&&<><TextInput value={redemptionReasons[item.id]??""} onChangeText={value=>setRedemptionReasons(current=>({...current,[item.id]:value}))} placeholder="Alasan keputusan (min. 5 karakter)" placeholderTextColor={colors.textMuted} style={{borderWidth:1,borderColor:colors.border,borderRadius:10,padding:10,color:colors.textPrimary}}/><View style={{flexDirection:"row",gap:8}}><Pressable disabled={busy||(redemptionReasons[item.id]??"").trim().length<5} onPress={()=>void mutate(()=>api!.decide(item.id,{decision:"approved",reason:redemptionReasons[item.id]}),"Penukaran disetujui.")} style={{flex:1,padding:10,borderRadius:10,backgroundColor:colors.primary,opacity:busy?0.5:1}}><NativeText color={colors.surface} weight="semibold">Setujui</NativeText></Pressable><Pressable disabled={busy||(redemptionReasons[item.id]??"").trim().length<5} onPress={()=>void mutate(()=>api!.decide(item.id,{decision:"rejected",reason:redemptionReasons[item.id]}),"Penukaran ditolak.")} style={{flex:1,padding:10,borderRadius:10,borderWidth:1,borderColor:colors.border,opacity:busy?0.5:1}}><NativeText weight="semibold">Tolak</NativeText></Pressable></View></>}
   {item.status==="requested"&&canCancelRedemptions&&item.participant_user_id===auth.context?.user.id&&<Pressable disabled={busy} onPress={()=>void mutate(()=>api!.cancel(item.id),"Permintaan penukaran dibatalkan.")} style={{padding:10,borderRadius:10,borderWidth:1,borderColor:colors.border,opacity:busy?0.5:1}}><NativeText>Batalkan penukaran</NativeText></Pressable>}
   {item.status==="approved"&&canFulfillRedemptions&&<><TextInput value={fulfillmentRefs[item.id]??""} onChangeText={value=>setFulfillmentRefs(current=>({...current,[item.id]:value}))} placeholder="Referensi fulfillment" placeholderTextColor={colors.textMuted} style={{borderWidth:1,borderColor:colors.border,borderRadius:10,padding:10,color:colors.textPrimary}}/><Pressable disabled={busy||(fulfillmentRefs[item.id]??"").trim().length<2} onPress={()=>void mutate(()=>api!.fulfill(item.id,{fulfillment_reference:fulfillmentRefs[item.id]}),"Reward ditandai telah dipenuhi.")} style={{padding:10,borderRadius:10,backgroundColor:colors.primary,opacity:busy?0.5:1}}><NativeText color={colors.surface} weight="semibold">Konfirmasi fulfillment</NativeText></Pressable></>}
  </NativeStack></NativeSurface>)}
  {approvals.length>0&&<><NativeText variant="title" weight="semibold">Status approval</NativeText>{approvals.map(item=><NativeSurface key={item.id} elevation="sm" radius="md" style={{padding:12}}><NativeStack gap="2"><NativeText weight="semibold">{item.status}</NativeText><NativeText variant="caption" color={colors.textSecondary}>{item.request_type} · {fmt(item.points_requested)} poin</NativeText><NativeText variant="caption" color={colors.textSecondary}>{item.request_reason}</NativeText>{item.decision_reason&&<NativeText variant="caption" color={colors.textSecondary}>Alasan keputusan: {item.decision_reason}</NativeText>}{item.status==="pending"&&canDecideApprovals&&<><TextInput value={approvalReasons[item.id]??""} onChangeText={value=>setApprovalReasons(current=>({...current,[item.id]:value}))} placeholder="Alasan keputusan (min. 5 karakter)" placeholderTextColor={colors.textMuted} style={{borderWidth:1,borderColor:colors.border,borderRadius:10,padding:10,color:colors.textPrimary}}/><View style={{flexDirection:"row",gap:8}}><Pressable disabled={busy||(approvalReasons[item.id]??"").trim().length<5} onPress={()=>void mutate(()=>api!.decideApproval(item.id,{decision:"approved",reason:approvalReasons[item.id]}),"Approval reward disetujui.")} style={{flex:1,padding:10,borderRadius:10,backgroundColor:colors.primary,opacity:busy?0.5:1}}><NativeText color={colors.surface} weight="semibold">Setujui</NativeText></Pressable><Pressable disabled={busy||(approvalReasons[item.id]??"").trim().length<5} onPress={()=>void mutate(()=>api!.decideApproval(item.id,{decision:"rejected",reason:approvalReasons[item.id]}),"Pengajuan reward ditolak.")} style={{flex:1,padding:10,borderRadius:10,borderWidth:1,borderColor:colors.border,opacity:busy?0.5:1}}><NativeText weight="semibold">Tolak</NativeText></Pressable></View></>}</NativeStack></NativeSurface>)}</>}
 </NativeStack>;
}
