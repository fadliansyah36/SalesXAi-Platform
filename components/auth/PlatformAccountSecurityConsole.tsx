'use client';

import { useState } from "react";
import { useSalesXAuth } from "@/components/providers/AppProviders";

export function PlatformAccountSecurityConsole(){
 const auth=useSalesXAuth();
 const [userId,setUserId]=useState("");
 const [status,setStatus]=useState<"active"|"suspended"|"deactivated">("suspended");
 const [message,setMessage]=useState("");
 const [busy,setBusy]=useState(false);
 if(!auth.hasPermission("account:status:manage"))return <p className="text-sm text-[var(--color-text-secondary)]">Administrasi status akun hanya tersedia untuk platform administrator.</p>;
 async function update(event:React.FormEvent){
  event.preventDefault();setBusy(true);setMessage("");
  try{
   const response=await auth.apiFetch("/api/v1/admin/users/"+encodeURIComponent(userId)+"/account-status",{
    method:"PATCH",body:JSON.stringify({status}),
   });
   const body=await response.json().catch(()=>({}));
   if(!response.ok)throw new Error(body?.error?.message??"Status akun gagal diperbarui.");
   setMessage("Status akun: "+body.status+". Supabase Auth ban: "+String(body.supabase_auth_ban_applied)+".");
  }catch(e){setMessage(e instanceof Error?e.message:"Operasi gagal.");}
  finally{setBusy(false);}
 }
 return <section className="space-y-3 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
  <h2 className="text-lg font-semibold">Platform account security</h2>
  <p className="text-sm text-[var(--color-text-secondary)]">Suspend/deactivate menerapkan Supabase Auth ban dan menaikkan session revocation epoch. Reactivate tidak menghidupkan kembali JWT lama.</p>
  <form onSubmit={update} className="grid gap-3 md:grid-cols-[2fr_1fr_auto]">
   <label className="text-sm">User UUID<input required value={userId} onChange={e=>setUserId(e.target.value)} placeholder="UUID user target" className="mt-1 w-full rounded-lg border border-[var(--color-border)] bg-transparent p-2.5"/></label>
   <label className="text-sm">Status<select value={status} onChange={e=>setStatus(e.target.value as typeof status)} className="mt-1 w-full rounded-lg border border-[var(--color-border)] bg-transparent p-2.5"><option value="suspended">Suspend</option><option value="deactivated">Deactivate</option><option value="active">Activate / Reactivate</option></select></label>
   <button disabled={busy} className="self-end rounded-lg bg-[#236D91] px-4 py-3 font-semibold text-white disabled:opacity-50">Terapkan</button>
  </form>
  {message&&<p role="status" className="break-all text-sm">{message}</p>}
 </section>;
}
