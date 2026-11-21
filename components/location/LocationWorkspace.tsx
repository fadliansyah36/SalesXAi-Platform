"use client";
import {useCallback,useEffect,useMemo,useState} from "react";
import {GoogleMapsCanvas} from "@/components/location/GoogleMapsCanvas";
import {geoJsonLineCoordinates,geoJsonPolygonRings,resolveMapsRuntimeConfig} from "@/packages/maps/src";
import {createLocationApi,type LocationLatestPosition,type LocationRouteSummary,type LocationGeofence,type LocationGeofenceEvent} from "@salesx-ai/api-client";
import {useSalesXAuth} from "@/components/providers/AppProviders";

export function LocationWorkspace(){
 const auth=useSalesXAuth(),org=auth.activeOrganizationId,client=auth.apiClient;
 const api=useMemo(()=>client&&org?createLocationApi(client,org):null,[client,org]);
 const [live,setLive]=useState<LocationLatestPosition[]>([]);
 const [routes,setRoutes]=useState<LocationRouteSummary[]>([]);
 const [geofences,setGeofences]=useState<LocationGeofence[]>([]);
 const [events,setEvents]=useState<LocationGeofenceEvent[]>([]);
 const [busy,setBusy]=useState(false),[error,setError]=useState(""),[updatedAt,setUpdatedAt]=useState("");
 const can=(id:string)=>auth.canPerformApiAction(id as never);
 const canLive=can("location.live.read"),canHistory=can("location.history.read"),canGeofences=can("location.geofences.read");
 const refresh=useCallback(async()=>{
  if(!api||auth.status!=="authenticated"||!org)return;
  setBusy(true);setError("");
  const jobs:Promise<void>[]=[];
  if(canLive)jobs.push(api.live().then(x=>setLive(x.items)));
  if(canHistory){
   jobs.push(api.routes().then(x=>setRoutes(x.items)));
   jobs.push(api.geofenceEvents(1,100).then(x=>setEvents(x.items)));
  }
  if(canGeofences)jobs.push(api.geofences().then(x=>setGeofences(x.items)));
  const results=await Promise.allSettled(jobs);
  const failed=results.find(x=>x.status==="rejected");
  if(failed&&failed.status==="rejected")setError(failed.reason instanceof Error?failed.reason.message:"Location data could not be loaded.");
  setUpdatedAt(new Date().toLocaleTimeString("id-ID"));
  setBusy(false);
 },[api,auth.status,org,canLive,canHistory,canGeofences]);
 useEffect(()=>{void refresh();},[refresh]);
 useEffect(()=>{
  if(!api||!org||!canLive||auth.status!=="authenticated")return;
  return api.subscribeEvents(()=>void refresh(),()=>void refresh());
 },[api,org,canLive,auth.status,refresh]);
 const center=live[0]?{lat:live[0].latitude,lng:live[0].longitude}:null;
 const mapsConfig=resolveMapsRuntimeConfig("web",{
  NEXT_PUBLIC_GOOGLE_MAPS_API_KEY:process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY,
  NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID:process.env.NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID,
  GOOGLE_MAPS_LANGUAGE:process.env.GOOGLE_MAPS_LANGUAGE,
  GOOGLE_MAPS_REGION:process.env.GOOGLE_MAPS_REGION,
 });
 const mapMarkers=live.map(item=>({id:item.user_id,title:item.user_id,position:{lat:item.latitude,lng:item.longitude},tone:item.stale?"stale" as const:"active" as const}));
 const mapRoutes=routes.flatMap(route=>{const coordinates=geoJsonLineCoordinates(route.route_geojson);return coordinates.length>1?[{id:route.id,coordinates}]:[];});
 const mapPolygons=geofences.flatMap(fence=>geoJsonPolygonRings(fence.boundary_geojson).map((coordinates,index)=>({id:fence.id+":"+index,label:fence.name,coordinates})));
 return <section className="space-y-5">
  <header className="flex flex-wrap items-end justify-between gap-3">
   <div><p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--color-text-secondary)]">Field Operations</p><h1 className="mt-1 text-2xl font-semibold text-[var(--color-text-primary)]">Location Intelligence</h1><p className="mt-1 text-sm text-[var(--color-text-secondary)]">Live sales position, route history and geofence activity.</p></div>
   <button onClick={()=>void refresh()} disabled={busy} className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-2 text-sm font-semibold text-[var(--color-text-primary)] disabled:opacity-50">{busy?"Refreshing…":"Refresh data"}</button>
  </header>
  {error&&<div role="alert" className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
  <div className="grid gap-3 sm:grid-cols-3">
   <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4"><p className="text-xs text-[var(--color-text-secondary)]">Visible live positions</p><p className="mt-1 text-2xl font-semibold tabular-nums">{live.length}</p></div>
   <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4"><p className="text-xs text-[var(--color-text-secondary)]">Route summaries</p><p className="mt-1 text-2xl font-semibold tabular-nums">{routes.length}</p></div>
   <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4"><p className="text-xs text-[var(--color-text-secondary)]">Geofence events</p><p className="mt-1 text-2xl font-semibold tabular-nums">{events.length}</p></div>
  </div>
  <div className="overflow-hidden rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)]">
   <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--color-border)] px-4 py-3"><h2 className="font-semibold">Live map</h2><span className="text-xs text-[var(--color-text-secondary)]">Updated {updatedAt||"—"}</span></div>
   {center?<GoogleMapsCanvas config={mapsConfig} center={center} markers={mapMarkers} routes={mapRoutes} polygons={mapPolygons} height={420}/>:<div className="p-5"><p className="text-sm text-[var(--color-text-secondary)]">No authorized live location has been received yet. Location is collected only after a Sales user explicitly starts a consented tracking session.</p></div>}
   {live.length>0&&<div className="divide-y divide-[var(--color-border)]">{live.slice(0,20).map(item=><div key={item.user_id} className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 text-sm"><div><p className="font-medium">{item.user_id}</p><p className="text-xs text-[var(--color-text-secondary)]">{item.team_id?"Team "+item.team_id:"No team"} · Accuracy ±{Math.round(item.accuracy_m)} m</p></div><div className="text-right"><p className="font-mono text-xs tabular-nums">{item.latitude.toFixed(6)}, {item.longitude.toFixed(6)}</p><p className="text-xs text-[var(--color-text-secondary)]">{new Date(item.recorded_at).toLocaleString("id-ID")} · {item.stale?"Stale":"Current"}</p></div><a className="text-xs font-semibold text-[var(--color-primary)]" href={`https://www.google.com/maps/search/?api=1&query=${item.latitude},${item.longitude}`} target="_blank" rel="noreferrer">Open map</a></div>)}</div>}
  </div>
  <div className="grid gap-4 lg:grid-cols-2">
   <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)]"><div className="border-b border-[var(--color-border)] px-4 py-3"><h2 className="font-semibold">Route history</h2></div>{routes.length===0?<p className="p-4 text-sm text-[var(--color-text-secondary)]">No route summaries available for the authorized scope.</p>:<div className="divide-y divide-[var(--color-border)]">{routes.slice(0,30).map(route=><div key={route.id} className="flex items-center justify-between gap-3 px-4 py-3"><div><p className="text-sm font-medium">{route.route_date}</p><p className="text-xs text-[var(--color-text-secondary)]">{route.point_count} GPS points · {route.sales_profile_id}</p></div><p className="text-sm font-semibold tabular-nums">{(route.distance_m/1000).toFixed(2)} km</p></div>)}</div>}</div>
   <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)]"><div className="border-b border-[var(--color-border)] px-4 py-3"><h2 className="font-semibold">Geofence activity</h2></div>{events.length===0?<p className="p-4 text-sm text-[var(--color-text-secondary)]">No geofence events for the authorized scope.</p>:<div className="divide-y divide-[var(--color-border)]">{events.slice(0,30).map(event=><div key={event.id} className="flex items-center justify-between gap-3 px-4 py-3"><div><p className="text-sm font-medium">{event.geofence_name} · {event.event_type}</p><p className="text-xs text-[var(--color-text-secondary)]">{event.user_id}</p></div><time className="text-xs text-[var(--color-text-secondary)]">{new Date(event.occurred_at).toLocaleString("id-ID")}</time></div>)}</div>}</div>
  </div>
  <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)]"><div className="border-b border-[var(--color-border)] px-4 py-3"><h2 className="font-semibold">Configured geofences</h2></div>{geofences.length===0?<p className="p-4 text-sm text-[var(--color-text-secondary)]">No geofences configured.</p>:<div className="grid gap-3 p-4 sm:grid-cols-2 xl:grid-cols-3">{geofences.map(item=><div key={item.id} className="rounded-lg border border-[var(--color-border)] p-3"><p className="font-medium">{item.name}</p><p className="mt-1 text-xs text-[var(--color-text-secondary)]">{item.code} · {item.geofence_type} · {item.status}</p><p className="mt-1 text-xs text-[var(--color-text-secondary)]">Dwell {item.dwell_seconds}s · Accuracy ±{item.accuracy_limit_m}m</p></div>)}</div>}</div>
 </section>;
}
