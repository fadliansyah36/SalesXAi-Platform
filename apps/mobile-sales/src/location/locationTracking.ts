import * as Location from "expo-location";
import * as TaskManager from "expo-task-manager";
import * as SQLite from "expo-sqlite";
import * as SecureStore from "expo-secure-store";
import type { SalesXApiClient } from "@salesx-ai/api-client";
import { createLocationApi } from "@salesx-ai/api-client";

export const LOCATION_TASK_NAME="salesx-location-background-v1";
const DB_NAME="salesx-location-outbox.db";
const SESSION_KEY="salesx-location-session-v1";
const ORG_KEY="salesx-location-org-v1";
const DEVICE_KEY="salesx-location-device-v1";
const TOKEN_KEY="salesx-location-token-v1";
const STOP_PENDING_KEY="salesx-location-stop-pending-v1";
const API_ORIGIN=(process.env.EXPO_PUBLIC_SALESX_API_URL??"").replace(/\/$/,"");

type QueuedPoint={id:string;payload:string;attempts:number};
async function database(){
 const db=await SQLite.openDatabaseAsync(DB_NAME);
 await db.execAsync("CREATE TABLE IF NOT EXISTS location_outbox (id TEXT PRIMARY KEY NOT NULL,payload TEXT NOT NULL,created_at TEXT NOT NULL,attempts INTEGER NOT NULL DEFAULT 0,next_attempt_at INTEGER NOT NULL DEFAULT 0)");
 return db;
}
function pointId(){return "loc-"+Date.now().toString(36)+"-"+Math.random().toString(36).slice(2,12);}

async function storeLocations(locations:Location.LocationObject[]){
 const sessionId=await SecureStore.getItemAsync(SESSION_KEY);
 const orgId=await SecureStore.getItemAsync(ORG_KEY);
 const deviceId=await SecureStore.getItemAsync(DEVICE_KEY);
 if(!sessionId||!orgId||!deviceId||!locations.length)return;
 const db=await database();
 for(const location of locations){
  const payload={
   client_point_id:pointId(),recorded_at:new Date(location.timestamp).toISOString(),
   latitude:location.coords.latitude,longitude:location.coords.longitude,
   accuracy_m:Math.max(0,location.coords.accuracy??10000),
   altitude_m:location.coords.altitude,speed_mps:location.coords.speed,
   heading_deg:location.coords.heading,source:"gps",metadata:{provider:location.mocked?"mocked":"device"}
  };
  await db.runAsync("INSERT OR IGNORE INTO location_outbox(id,payload,created_at) VALUES(?,?,?)",payload.client_point_id,JSON.stringify(payload),new Date().toISOString());
 }
 await flushBackgroundOutbox();
}

async function flushBackgroundOutbox(){
 const sessionId=await SecureStore.getItemAsync(SESSION_KEY),orgId=await SecureStore.getItemAsync(ORG_KEY);
 const deviceId=await SecureStore.getItemAsync(DEVICE_KEY),token=await SecureStore.getItemAsync(TOKEN_KEY);
 if(!sessionId||!orgId||!deviceId||!token||!API_ORIGIN)return;
 const db=await database();
 const rows=await db.getAllAsync<QueuedPoint>("SELECT id,payload,attempts FROM location_outbox WHERE next_attempt_at<=? ORDER BY created_at LIMIT 100",Date.now());
 if(!rows.length)return;
 try{
  const response=await fetch(API_ORIGIN+"/api/v1/organizations/"+encodeURIComponent(orgId)+"/location/sessions/"+encodeURIComponent(sessionId)+"/points",{
   method:"POST",headers:{"Authorization":"Bearer "+token,"Content-Type":"application/json","X-Organization-ID":orgId,"X-Device-ID":deviceId},
   body:JSON.stringify({points:rows.map(row=>JSON.parse(row.payload))})
  });
  if(!response.ok)throw new Error("Location sync returned HTTP "+response.status);
  for(const row of rows)await db.runAsync("DELETE FROM location_outbox WHERE id=?",row.id);
 }catch{
  for(const row of rows){
   const attempts=row.attempts+1,delay=Math.min(60000,1000*Math.pow(2,Math.min(attempts,6)));
   await db.runAsync("UPDATE location_outbox SET attempts=?,next_attempt_at=? WHERE id=?",attempts,Date.now()+delay,row.id);
  }
 }
}

export async function flushLocationOutbox(api:SalesXApiClient,organizationId:string,deviceId:string){
 const sessionId=await SecureStore.getItemAsync(SESSION_KEY);
 if(!sessionId)return;
 const db=await database();
 const rows=await db.getAllAsync<QueuedPoint>("SELECT id,payload,attempts FROM location_outbox WHERE next_attempt_at<=? ORDER BY created_at LIMIT 100",Date.now());
 if(!rows.length)return;
 try{
  await createLocationApi(api,organizationId).ingest(sessionId,deviceId,{points:rows.map(row=>JSON.parse(row.payload))});
  for(const row of rows)await db.runAsync("DELETE FROM location_outbox WHERE id=?",row.id);
 }catch{
  for(const row of rows){
   const attempts=row.attempts+1,delay=Math.min(60000,1000*Math.pow(2,Math.min(attempts,6)));
   await db.runAsync("UPDATE location_outbox SET attempts=?,next_attempt_at=? WHERE id=?",attempts,Date.now()+delay,row.id);
  }
 }
}

TaskManager.defineTask(LOCATION_TASK_NAME,async({data,error})=>{
 if(error)throw error;
 const locations=(data as {locations?:Location.LocationObject[]}|undefined)?.locations??[];
 await storeLocations(locations);
});

export async function ensureLocationDeviceId(){
 let value=await SecureStore.getItemAsync(DEVICE_KEY);
 if(!value){value="salesx-"+Date.now().toString(36)+"-"+Math.random().toString(36).slice(2,12);await SecureStore.setItemAsync(DEVICE_KEY,value);}
 return value;
}

export async function syncLocationAccessToken(token:string|null){
 if(token)await SecureStore.setItemAsync(TOKEN_KEY,token);
}

export async function startLocationTracking(api:SalesXApiClient,organizationId:string,accessToken:string,deviceId:string,shiftId?:string|null){
 if(!(await TaskManager.isAvailableAsync()))throw new Error("Background TaskManager tidak tersedia. Gunakan native development/production build, bukan web runtime.");
 const foreground=await Location.requestForegroundPermissionsAsync();
 if(foreground.status!=="granted")throw new Error("Izin lokasi saat aplikasi digunakan wajib diberikan.");
 const background=await Location.requestBackgroundPermissionsAsync();
 if(background.status!=="granted")throw new Error("Izin lokasi latar belakang belum diberikan. Pelacakan tidak dimulai.");
 const locationApi=createLocationApi(api,organizationId);
 const session=await locationApi.startSession({device_id:deviceId,consent_policy_version:"sales-location-v1",shift_id:shiftId??null});
 await SecureStore.setItemAsync(SESSION_KEY,session.id);
 await SecureStore.setItemAsync(ORG_KEY,organizationId);
 await SecureStore.setItemAsync(TOKEN_KEY,accessToken);
 await SecureStore.deleteItemAsync(STOP_PENDING_KEY);
 try{
  await Location.startLocationUpdatesAsync(LOCATION_TASK_NAME,{
   accuracy:Location.Accuracy.Balanced,timeInterval:30000,distanceInterval:50,
   pausesUpdatesAutomatically:true,showsBackgroundLocationIndicator:true,
   foregroundService:{notificationTitle:"SalesX-Ai location tracking",notificationBody:"Pelacakan lokasi aktif atas persetujuan Anda."}
  });
 }catch(error){
  await locationApi.updateSession(session.id,{action:"stop",reason:"native_location_task_start_failed"});
  await SecureStore.deleteItemAsync(SESSION_KEY);await SecureStore.deleteItemAsync(ORG_KEY);
  throw error;
 }
 return session;
}

export async function stopLocationTracking(api:SalesXApiClient,organizationId:string){
 const sessionId=await SecureStore.getItemAsync(SESSION_KEY);
 if(await Location.hasStartedLocationUpdatesAsync(LOCATION_TASK_NAME))await Location.stopLocationUpdatesAsync(LOCATION_TASK_NAME);
 if(!sessionId)return;
 const deviceId=await SecureStore.getItemAsync(DEVICE_KEY);
 if(deviceId)await flushLocationOutbox(api,organizationId,deviceId);
 try{
  await createLocationApi(api,organizationId).updateSession(sessionId,{action:"stop",reason:"user_requested"});
  await SecureStore.deleteItemAsync(SESSION_KEY);await SecureStore.deleteItemAsync(ORG_KEY);
  await SecureStore.deleteItemAsync(STOP_PENDING_KEY);
 }catch(error){
  await SecureStore.setItemAsync(STOP_PENDING_KEY,"true");
  throw new Error("Pengambilan lokasi sudah dihentikan di perangkat; status stop server menunggu sinkronisasi jaringan.");
 }
}
