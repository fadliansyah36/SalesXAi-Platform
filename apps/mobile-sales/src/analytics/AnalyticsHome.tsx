import React,{useCallback,useEffect,useMemo,useState} from "react";
import {Linking,Pressable,View} from "react-native";
import {createAnalyticsApi} from "@salesx-ai/api-client";
import type {AnalyticsDashboardResponse,AnalyticsReportRun} from "@salesx-ai/api-contracts";
import {NativeInline,NativeStack,NativeSurface,NativeText,useNativeTheme} from "@salesx-ai/design-system/native";

type ScopeType="tenant"|"branch"|"team"|"territory"|"user";
type AuthProps={
 status:string;
 apiClient:any;
 activeOrganizationId:string|null;
 canPerformApiAction:(id:any)=>boolean;
};

const formatValue=(value:number)=>new Intl.NumberFormat("id-ID",{maximumFractionDigits:2}).format(value);
const today=()=>new Date().toISOString().slice(0,10);

export function AnalyticsHome({auth}:{auth:AuthProps}){
 const {colors}=useNativeTheme();
 const [data,setData]=useState<AnalyticsDashboardResponse|null>(null);
 const [reports,setReports]=useState<AnalyticsReportRun[]>([]);
 const [days,setDays]=useState<7|30>(7);
 const [scopeType,setScopeType]=useState<ScopeType>("user");
 const [scopeId,setScopeId]=useState<string|null>(null);
 const [busy,setBusy]=useState(false);
 const [exportBusy,setExportBusy]=useState(false);
 const [error,setError]=useState<string|null>(null);
 const end=today();
 const start=new Date(Date.now()-(days-1)*86400000).toISOString().slice(0,10);
 const api=useMemo(()=>auth.apiClient&&auth.activeOrganizationId?createAnalyticsApi(auth.apiClient,auth.activeOrganizationId):null,[auth.apiClient,auth.activeOrganizationId]);

 const refresh=useCallback(async()=>{
  if(!api)return;
  setBusy(true);setError(null);
  try{
   const [result,history]=await Promise.all([api.dashboard(start,end,"day",scopeType,scopeId),api.reports()]);
   setData(result);setReports(history);
  }catch(cause){setError(cause instanceof Error?cause.message:"Ringkasan KPI tidak dapat dimuat.");}
  finally{setBusy(false);}
 },[api,start,end,scopeType,scopeId]);
 useEffect(()=>{if(auth.status==="authenticated")void refresh();},[auth.status,refresh]);
 useEffect(()=>{
  const available=(data?.scopes??[]).filter(scope=>scope.scope_type===scopeType);
  if(!available.length&&data?.scopes?.length){
   setScopeType(data.scopes[0].scope_type);
   setScopeId(data.scopes[0].scope_id);
  }else if(available.length&&!available.some(scope=>scope.scope_id===scopeId)){
   setScopeId(scopeType==="tenant"?null:available[0].scope_id);
  }
 },[data,scopeType,scopeId]);
 useEffect(()=>{
  if(!api||!reports.some(report=>report.status==="queued"||report.status==="running"))return;
  const timer=setInterval(()=>{void api.reports().then(setReports).catch(()=>undefined);},5000);
  return()=>clearInterval(timer);
 },[api,reports]);

 const metrics=useMemo(()=>{
  const map=new Map<string,number>();
  for(const item of data?.metrics??[])map.set(item.metric_key,(map.get(item.metric_key)??0)+Number(item.metric_value));
  return [...map.entries()].map(([key,value])=>({key,value}));
 },[data]);
 const chart=useMemo(()=>{
  return ["orders.count","visits.completed"].map(key=>{
   const points=(data?.metrics??[]).filter(item=>item.metric_key===key).sort((a,b)=>a.period_start.localeCompare(b.period_start));
   const max=Math.max(1,...points.map(item=>Number(item.metric_value)));
   return {key,points:points.slice(-10),max};
  }).filter(group=>group.points.length>0);
 },[data]);

 const requestExport=async()=>{
  if(!api||!auth.canPerformApiAction("analytics.reports.create"))return;
  setExportBusy(true);setError(null);
  try{
   const selected=(data?.scopes??[]).find(scope=>scope.scope_type===scopeType&&scope.scope_id===scopeId);
   const result=await api.createReport({
    report_key:"operational-kpi",period_start:start,period_end:end,period_grain:"day",
    scope_type:scopeType,scope_id:scopeType==="tenant"?null:selected?.scope_id??scopeId,
    idempotency_key:"mobile-analytics-"+scopeType+"-"+(scopeId??"tenant")+"-"+start+"-"+end+"-"+Date.now(),
   });
   setReports(current=>[result,...current.filter(item=>item.id!==result.id)]);
  }catch(cause){setError(cause instanceof Error?cause.message:"Permintaan ekspor gagal.");}
  finally{setExportBusy(false);}
 };
 const download=async(reportId:string)=>{
  if(!api)return;
  setExportBusy(true);setError(null);
  try{const result=await api.downloadReport(reportId);await Linking.openURL(result.download_url);}
  catch(cause){setError(cause instanceof Error?cause.message:"Unduhan laporan belum tersedia.");}
  finally{setExportBusy(false);}
 };

 if(!api||!auth.canPerformApiAction("analytics.dashboard.read"))return null;
 return <NativeSurface elevation="sm" radius="2xl" style={{padding:18}}>
  <NativeStack gap="3">
   <NativeInline style={{justifyContent:"space-between",alignItems:"center"}}>
    <NativeStack gap="1"><NativeText variant="title" weight="bold">Analytics & KPI</NativeText><NativeText variant="caption" color={colors.textSecondary}>Data operasional aktual · {start} s.d. {end}</NativeText></NativeStack>
    <Pressable onPress={()=>void refresh()} accessibilityRole="button"><NativeText color={colors.primary}>{busy?"Memuat…":"Refresh"}</NativeText></Pressable>
   </NativeInline>
   <NativeInline gap="2">
    {[7,30].map(value=><Pressable key={value} onPress={()=>setDays(value as 7|30)} accessibilityRole="button" style={{paddingVertical:7,paddingHorizontal:12,borderRadius:10,backgroundColor:days===value?colors.primary:"transparent",borderWidth:1,borderColor:colors.border}}>
     <NativeText color={days===value?"#FFFFFF":colors.textSecondary} weight="semibold">{value} Hari</NativeText>
    </Pressable>)}
   </NativeInline>
   {error&&<NativeText color="#B91C1C">{error}</NativeText>}
   <View style={{flexDirection:"row",flexWrap:"wrap",gap:8}}>
    {metrics.map(item=><View key={item.key} style={{width:"48%",padding:12,borderRadius:12,borderWidth:1,borderColor:colors.border}}>
     <NativeText variant="caption" color={colors.textSecondary}>{item.key}</NativeText>
     <NativeText variant="title" weight="bold">{formatValue(item.value)}</NativeText>
    </View>)}
    {metrics.length===0&&!busy&&<NativeText color={colors.textSecondary}>Snapshot KPI salesperson belum tersedia pada periode ini.</NativeText>}
   </View>
   {chart.map(group=><NativeStack key={group.key} gap="2">
    <NativeText weight="semibold">{group.key}</NativeText>
    <View accessibilityRole="image" accessibilityLabel={"Grafik "+group.key} style={{height:90,flexDirection:"row",alignItems:"flex-end",gap:5,borderBottomWidth:1,borderBottomColor:colors.border,paddingBottom:2}}>
     {group.points.map((point,index)=><View key={point.period_start+index} style={{flex:1,justifyContent:"flex-end",height:"100%"}}>
      <View style={{height:Math.max(3,Number(point.metric_value)/group.max*100)+"%",backgroundColor:colors.primary,borderTopLeftRadius:4,borderTopRightRadius:4}}/>
     </View>)}
    </View>
    <NativeInline style={{justifyContent:"space-between"}}><NativeText variant="caption" color={colors.textMuted}>{group.points[0]?.period_start}</NativeText><NativeText variant="caption" color={colors.textMuted}>{group.points.at(-1)?.period_start}</NativeText></NativeInline>
   </NativeStack>)}
   <NativeStack gap="2">
    <NativeText weight="semibold">Rincian KPI</NativeText>
    {(data?.metrics??[]).slice(-8).map((item,index)=><NativeInline key={item.metric_key+item.period_start+index} style={{justifyContent:"space-between",paddingVertical:6,borderBottomWidth:1,borderBottomColor:colors.border}}>
     <NativeStack gap="1"><NativeText>{item.metric_key}</NativeText><NativeText variant="caption" color={colors.textMuted}>{item.period_start} · {item.scope_type}</NativeText></NativeStack>
     <NativeText weight="bold">{formatValue(Number(item.metric_value))}</NativeText>
    </NativeInline>)}
   </NativeStack>
   {auth.canPerformApiAction("analytics.reports.create")&&<Pressable onPress={()=>void requestExport()} disabled={exportBusy} accessibilityRole="button" style={{padding:12,borderRadius:12,backgroundColor:colors.primary,opacity:exportBusy?0.6:1}}>
    <NativeText color="#FFFFFF" weight="semibold">{exportBusy?"Memproses…":"Ekspor CSV"}</NativeText>
   </Pressable>}
   {reports.length>0&&<NativeStack gap="2">
    <NativeText weight="semibold">Riwayat Laporan</NativeText>
    {reports.slice(0,5).map(report=><NativeInline key={report.id} style={{justifyContent:"space-between",alignItems:"center",paddingVertical:8,borderBottomWidth:1,borderBottomColor:colors.border}}>
     <NativeStack gap="1"><NativeText>{report.report_key}</NativeText><NativeText variant="caption" color={colors.textMuted}>{report.status} · {report.period_start} – {report.period_end}</NativeText></NativeStack>
     {report.status==="completed"&&report.download_available!==false&&<Pressable onPress={()=>void download(report.id)} disabled={exportBusy} accessibilityRole="button"><NativeText color={colors.primary}>Download</NativeText></Pressable>}
    </NativeInline>)}
   </NativeStack>}
   <NativeText variant="caption" color={colors.textMuted}>Sumber: FastAPI Analytics · {data?.data_as_of?new Date(data.data_as_of).toLocaleString("id-ID"):"Menunggu snapshot"}</NativeText>
  </NativeStack>
 </NativeSurface>;
}
