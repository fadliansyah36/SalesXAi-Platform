'use client';

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSalesXAuth } from "@/components/providers/AppProviders";

export default function ResetPasswordPage() {
  const auth=useSalesXAuth();
  const router=useRouter();
  const [password,setPassword]=useState("");
  const [confirmation,setConfirmation]=useState("");
  const [message,setMessage]=useState("");
  const [busy,setBusy]=useState(false);
  async function submit(event:React.FormEvent) {
    event.preventDefault();
    if(password.length<12) {setMessage("Password minimal 12 karakter.");return;}
    if(password!==confirmation) {setMessage("Konfirmasi password tidak sama.");return;}
    setBusy(true);setMessage("");
    try {
      await auth.updatePassword(password);
      setMessage("Password berhasil diperbarui. Silakan masuk kembali.");
      await auth.signOut("local");
      router.replace("/portal");
    } catch(cause) {setMessage(cause instanceof Error?cause.message:"Password tidak dapat diperbarui.");}
    finally {setBusy(false);}
  }
  return <main className="mx-auto flex min-h-screen max-w-md items-center px-5"><form onSubmit={submit} className="w-full space-y-4 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6"><h1 className="text-xl font-bold">Buat password baru</h1><p className="text-sm text-[var(--color-text-secondary)]">Gunakan minimal 12 karakter.</p><input type="password" autoComplete="new-password" required value={password} onChange={e=>setPassword(e.target.value)} placeholder="Password baru" className="w-full rounded-lg border border-[var(--color-border)] bg-transparent p-3"/><input type="password" autoComplete="new-password" required value={confirmation} onChange={e=>setConfirmation(e.target.value)} placeholder="Ulangi password" className="w-full rounded-lg border border-[var(--color-border)] bg-transparent p-3"/>{message&&<p role="status" className="text-sm text-[var(--color-text-secondary)]">{message}</p>}<button disabled={busy||auth.status!=="authenticated"} className="w-full rounded-lg bg-[#236D91] p-3 font-semibold text-white disabled:opacity-50">{busy?"Menyimpan…":"Perbarui password"}</button></form></main>;
}
