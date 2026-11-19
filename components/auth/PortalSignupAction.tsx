'use client';

import { useState } from "react";
import { useSalesXAuth } from "@/components/providers/AppProviders";

export function PortalSignupAction({email,password,onMessage,showRecovery=false}:{email:string;password:string;onMessage:(message:string)=>void;showRecovery?:boolean}){
 const auth=useSalesXAuth();
 const [busy,setBusy]=useState(false);
 return <div className="space-y-2">
  <button type="button" disabled={busy||!email.trim()||!email.includes('@')||password.length<12} onClick={async()=>{
   setBusy(true);
   try{
    const verificationRequired=await auth.signUp(email,password);
    onMessage(verificationRequired?"Akun dibuat. Periksa email untuk verifikasi sebelum masuk.":"Akun dibuat. Pilih organisasi atau terima undangan untuk mengaktifkan akses.");
   }catch(e){onMessage(e instanceof Error?e.message:"Pendaftaran gagal.");}
   finally{setBusy(false);}
  }} className="w-full rounded-xl border border-[#348CB2] py-2.5 text-sm font-semibold text-[#236D91] dark:text-[#87CEEB] disabled:opacity-40">
   {busy?"Mendaftarkan…":"Buat akun baru"}
  </button>
  {showRecovery&&<button type="button" onClick={async()=>{
   if(!email.trim()||!email.includes("@")){onMessage("Masukkan alamat email untuk pemulihan password.");return;}
   try{await auth.requestPasswordReset(email);onMessage("Tautan pemulihan dikirim jika email terdaftar.");}
   catch(e){onMessage(e instanceof Error?e.message:"Pemulihan password gagal.");}
  }} className="w-full py-2 text-xs font-semibold text-[#236D91] dark:text-[#87CEEB]">Lupa password?</button>}
 </div>;
}
