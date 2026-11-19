'use client';

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSalesXAuth } from "@/components/providers/AppProviders";

export default function AcceptInvitationPage(){
 const auth=useSalesXAuth();
 const params=useSearchParams();
 const router=useRouter();
 const token=params.get("token");
 const [message,setMessage]=useState("Memeriksa undangan…");
 const [busy,setBusy]=useState(false);
 useEffect(()=>{
  if(auth.status==="unauthenticated")setMessage("Masuk dengan email yang menerima undangan untuk melanjutkan.");
  else if(auth.status==="configuration_error")setMessage(auth.error??"Konfigurasi autentikasi belum tersedia.");
 },[auth.status,auth.error]);
 async function action(kind:"accept"|"reject"){
  if(!token)return;
  setBusy(true);setMessage("");
  try{
   if(!auth.apiClient)throw new Error("FastAPI client belum dikonfigurasi.");
   if(kind==="accept")await auth.apiClient.acceptInvitation({token});
   else await auth.apiClient.rejectInvitation({token});
   setMessage(kind==="accept"?"Undangan diterima. Membership organisasi aktif.":"Undangan ditolak.");
   if(kind==="accept")router.replace("/portal/access");
  }catch(e){setMessage(e instanceof Error?e.message:"Undangan gagal diproses.");}
  finally{setBusy(false);}
 }
 return <main className="mx-auto flex min-h-screen max-w-md items-center px-5"><section className="w-full space-y-4 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6"><h1 className="text-xl font-bold">Undangan organisasi SalesX-Ai</h1><p className="text-sm text-[var(--color-text-secondary)]">{message}</p>{auth.status==="unauthenticated"&&<a href="/portal" className="inline-flex rounded-lg bg-[#236D91] px-4 py-2 text-white">Masuk</a>}{auth.status==="authenticated"&&<div className="flex gap-3"><button disabled={busy||!token} onClick={()=>void action("accept")} className="rounded-lg bg-[#236D91] px-4 py-2 text-white disabled:opacity-50">Terima</button><button disabled={busy||!token} onClick={()=>void action("reject")} className="rounded-lg border border-[var(--color-border)] px-4 py-2 disabled:opacity-50">Tolak</button></div>}</section></main>;
}
