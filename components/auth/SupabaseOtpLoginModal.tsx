'use client';

import { useState } from "react";
import { Modal } from "@/components/common/Modal";
import { useSalesXAuth } from "@/components/providers/AppProviders";

export function SupabaseOtpLoginModal({open,onClose,onSuccess}:{open:boolean;onClose:()=>void;onSuccess:()=>void}){
 const auth=useSalesXAuth();
 const [phone,setPhone]=useState("");
 const [token,setToken]=useState("");
 const [sent,setSent]=useState(false);
 const [busy,setBusy]=useState(false);
 const [message,setMessage]=useState("");
 async function send(){
  setBusy(true);setMessage("");
  try{await auth.signInWithOtp(phone);setSent(true);setMessage("Kode OTP dikirim oleh Supabase Auth.");}
  catch(e){setMessage(e instanceof Error?e.message:"OTP gagal dikirim.");}
  finally{setBusy(false);}
 }
 async function verify(){
  setBusy(true);setMessage("");
  try{await auth.verifyOtp(phone,token);onSuccess();onClose();}
  catch(e){setMessage(e instanceof Error?e.message:"Kode OTP tidak valid.");}
  finally{setBusy(false);}
 }
 return <Modal open={open} onClose={onClose} title="Masuk dengan OTP Supabase" subtitle="Verifikasi nomor telepon melalui Supabase Auth." maxWidthClass="max-w-sm">
  <div className="space-y-3">
   <input type="tel" value={phone} onChange={e=>setPhone(e.target.value)} placeholder="+6281234567890" className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-3 text-sm"/>
   {!sent?<button disabled={busy||!phone.trim()} onClick={()=>void send()} className="w-full rounded-lg bg-[#236D91] p-3 text-sm font-semibold text-white disabled:opacity-50">{busy?"Mengirim…":"Kirim kode OTP"}</button>:<>
    <input inputMode="numeric" autoComplete="one-time-code" value={token} onChange={e=>setToken(e.target.value)} placeholder="Kode OTP" className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-3 text-sm"/>
    <button disabled={busy||!token.trim()} onClick={()=>void verify()} className="w-full rounded-lg bg-[#236D91] p-3 text-sm font-semibold text-white disabled:opacity-50">{busy?"Memverifikasi…":"Verifikasi OTP"}</button>
   </>}
   {message&&<p role="status" className="text-xs text-[var(--color-text-secondary)]">{message}</p>}
  </div>
 </Modal>;
}
