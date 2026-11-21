import React,{useCallback,useEffect,useMemo,useState} from "react";
import {Pressable} from "react-native";
import {createAnalyticsApi} from "@salesx-ai/api-client";
import type {AnalyticsDashboardResponse} from "@salesx-ai/api-contracts";
import {NativeInline,NativeStack,NativeSurface,NativeText,useNativeTheme} from "@salesx-ai/design-system/native";

export function AnalyticsHome({auth}:{auth:{status:string;apiClient:any;activeOrganizationId:string|null;canPerformApiAction:(id:string)=>boolean}}){
 const {colors}=useNativeTheme();
 const [data,setData]=useState<AnalyticsDashboardResponse|null>(null);
 const [busy,setBusy]=useState(false);
 const [error,setError]=useState<string|null>(null);
 const end=new Date().toISOString().slice(0,10);
 const start=new Date(Date.now()-6*86400000).toISOString().slice(0,10);
 const api=useMemo(()=>auth.apiClient&&auth.activeOrganizationId?createAnalyticsApi(auth.apiClient,auth.activeOrganizationId):null,[auth.apiClient,auth.activeOrganizationId]);
 const refresh=useCallback(async()=>{
  if(!api)return;
  setBusy(true);setError(null);
  try{setData(await api.dashboard(start,end,"day"));}
  catch(cause){setError(cause instanceof Error?cause.message:"Ringkasan KPI tidak dapat dimuat.");}
  finally{setBusy(false);}
 },[api,start,end]);
 useEffect(()=>{if(auth.status==="authenticated")void refresh();},[auth.status,refresh]);
 const metrics=useMemo(()=>{
  const map=new Map<string,number>();
  for(const item of data?.metrics??[])if(item.scope_type==="user")map.set(item.metric_key,(map.get(item.metric_key)??0)+Number(item.metric_value));
  return [...map.entries()];
 },[data]);
 if(!api||!auth.canPerformApiAction("analytics.dashboard.read"))return null;
 return <NativeSurface elevation="sm" radius="2xl" style={{padding:18}}>
  <NativeStack gap="3">
   <NativeInline style={{justifyContent:"space-between",alignItems:"center"}}>
    <NativeText variant="title" weight="bold">Kinerja 7 Hari</NativeText>
    <NativeText variant="caption" color={colors.textSecondary}>{busy?"Memuat…":data?.data_as_of?new Date(data.data_as_of).toLocaleDateString("id-ID"):"Belum tersedia"}</NativeText>
   </NativeInline>
   {error&&<NativeText color="#B91C1C">{error}</NativeText>}
   {metrics.length===0&&!busy&&<NativeText color={colors.textSecondary}>Snapshot KPI salesperson belum tersedia pada periode ini.</NativeText>}
   {metrics.map(([key,value])=><NativeInline key={key} style={{justifyContent:"space-between",paddingVertical:8,borderBottomWidth:1,borderBottomColor:colors.border}}>
    <NativeText color={colors.textSecondary}>{key}</NativeText>
    <NativeText weight="bold">{new Intl.NumberFormat("id-ID",{maximumFractionDigits:2}).format(value)}</NativeText>
   </NativeInline>)}
   <NativeInline style={{justifyContent:"space-between",alignItems:"center"}}>
    <NativeText variant="caption" color={colors.textMuted}>Sumber: Analytics API · {start} s.d. {end}</NativeText>
    <Pressable onPress={()=>void refresh()} accessibilityRole="button"><NativeText variant="caption" color={colors.primary}>Perbarui</NativeText></Pressable>
   </NativeInline>
  </NativeStack>
 </NativeSurface>;
}
