'use client';

import { useCallback, useEffect, useState } from "react";
import { useSalesXAuth } from "@/components/providers/AppProviders";

type Member={user_id:string;email:string|null;display_name:string|null;account_status:string;membership_status:string;title:string|null;branch_id:string|null};
type Invitation={id:string;email:string;role_key:string;status:string;expires_at:string;resend_count?:number};
type Identity={id:string;provider:string;email:string|null;is_primary:boolean;created_at:string};
type RoleOption={key:string;name:string;scope_type:'tenant'|'branch';hierarchy_level:number};
type Session={auth_session_id:string;device_name:string|null;platform:string;last_seen_at:string|null;expires_at:string|null;revoked_at:string|null;current:boolean};

export function OrganizationAccessConsole(){
 const auth=useSalesXAuth();
 const org=auth.activeOrganizationId;
 const [members,setMembers]=useState<Member[]>([]);
 const [invitations,setInvitations]=useState<Invitation[]>([]);
 const [identities,setIdentities]=useState<Identity[]>([]);
 const [roleOptions,setRoleOptions]=useState<RoleOption[]>([]);
 const [sessions,setSessions]=useState<Session[]>([]);
 const [email,setEmail]=useState("");
 const [role,setRole]=useState("");
 const [branch,setBranch]=useState("");
 const [message,setMessage]=useState("");
 const [busy,setBusy]=useState(false);
 const canManageInvites=auth.hasPermission("organization:invitations:manage");
 const canReadMembers=auth.hasPermission("organization:members:read");
 const canManageMembers=auth.hasPermission("organization:members:manage");

 const load=useCallback(async()=>{
  if(!org||!auth.apiClient)return;
  const api=auth.apiClient;
  const jobs:Promise<void>[]=[];
  if(canReadMembers)jobs.push((async()=>{
   setMembers(await api.listOrganizationMembers(org));
  })());
  if(canManageInvites)jobs.push((async()=>{
   const roles=await api.listAssignableRoles(org);
   setRoleOptions(roles);
   if(roles.length)setRole(previous=>roles.some(item=>item.key===previous)?previous:roles[0].key);
   setInvitations(await api.listInvitations(org));
  })());
  jobs.push((async()=>{
   setIdentities(await api.listLinkedIdentities());
   setSessions(await api.listSessions());
  })());
  await Promise.all(jobs);
 },[org,canReadMembers,canManageInvites,auth.apiClient]);

 useEffect(()=>{void load().catch(e=>setMessage(e instanceof Error?e.message:"Gagal memuat akses organisasi."));},[load]);

 async function createInvite(event:React.FormEvent){
  event.preventDefault();if(!org)return;setBusy(true);setMessage("");
  try{
   const api=auth.apiClient;
   if(!api)throw new Error("FastAPI client belum dikonfigurasi.");
   const body=await api.createInvitation(org,{email,role_key:role,branch_id:branch||null});
   setMessage("Undangan dibuat. Tautan sekali pakai: "+body.invitation_url);
   setEmail("");await load();
  }catch(e){setMessage(e instanceof Error?e.message:"Undangan gagal dibuat.");}
  finally{setBusy(false);}
 }
 async function inviteAction(id:string,action:"resend"|"revoke"){
  if(!org)return;setBusy(true);
  try{
   const api=auth.apiClient;
   if(!api)throw new Error("FastAPI client belum dikonfigurasi.");
   if(action==="resend"){
    const body=await api.resendInvitation(org,id);
    setMessage("Tautan undangan baru: "+body.invitation_url);
   }else{
    await api.revokeInvitation(org,id);
    setMessage("Undangan dicabut.");
   }
   await load();
  }catch(e){setMessage(e instanceof Error?e.message:"Operasi undangan gagal.");}
  finally{setBusy(false);}
 }
 async function memberStatus(userId:string,status:"active"|"suspended"|"removed"){
  if(!org)return;setBusy(true);
  try{
   const api=auth.apiClient;
   if(!api)throw new Error("FastAPI client belum dikonfigurasi.");
   await api.updateOrganizationMember(org,userId,{status});
   setMessage("Status membership diperbarui.");await load();
  }catch(e){setMessage(e instanceof Error?e.message:"Pembaruan membership gagal.");}
  finally{setBusy(false);}
 }
 async function revokeDeviceSession(sessionId:string){
  const api=auth.apiClient;
  if(!api)throw new Error("FastAPI client belum dikonfigurasi.");
  await api.revokeSession(sessionId);
  setSessions(await api.listSessions());
  setMessage("Akses API SalesX-Ai untuk sesi perangkat tersebut dicabut.");
 }
 async function linkGoogle(){
  try{await auth.linkIdentity("google");}
  catch(e){setMessage(e instanceof Error?e.message:"Google identity linking gagal.");}
 }
 async function unlink(id:string){
  try{await auth.unlinkIdentity(id);await load();setMessage("Identitas dilepas.");}
  catch(e){setMessage(e instanceof Error?e.message:"Identitas tidak dapat dilepas.");}
 }

 if(auth.status!=="authenticated")return <p className="text-sm text-[var(--color-text-secondary)]">Masuk untuk mengelola identitas dan membership.</p>;
 return <div className="space-y-8">
  <header><h1 className="text-2xl font-bold">Akses & Identitas</h1><p className="mt-1 text-sm text-[var(--color-text-secondary)]">Organisasi aktif: {auth.activeMembership?.organization_name??"Belum dipilih"}</p></header>
  {message&&<p role="status" className="break-all rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-3 text-sm">{message}</p>}
  <section className="space-y-3 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
   <h2 className="text-lg font-semibold">Sesi perangkat</h2>
   <p className="text-xs text-[var(--color-text-secondary)]">Cabut akses API untuk perangkat lain. Supabase Auth tidak menyediakan pencabutan refresh token per-perangkat berdasarkan session ID.</p>
   <div className="space-y-2">{sessions.map(session=><div key={session.auth_session_id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-[var(--color-border)] p-3">
    <div><p className="font-medium">{session.device_name??session.platform} {session.current?"· Perangkat ini":""}</p><p className="text-xs text-[var(--color-text-muted)]">{session.platform} · {session.revoked_at?"Akses dicabut":session.current?"Aktif sekarang":"Aktif"} · {session.last_seen_at?new Date(session.last_seen_at).toLocaleString():"Belum ada aktivitas"}</p></div>
    {!session.current&&!session.revoked_at&&<button disabled={busy} onClick={()=>void revokeDeviceSession(session.auth_session_id).catch(e=>setMessage(e instanceof Error?e.message:"Sesi tidak dapat dicabut."))} className="text-xs font-semibold text-red-600">Cabut akses</button>}
   </div>)}</div>
  </section>
  <section className="space-y-3 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
   <h2 className="text-lg font-semibold">Identitas login</h2>
   <button onClick={()=>void linkGoogle()} className="rounded-lg border border-[var(--color-border)] px-3 py-2 text-sm font-semibold">Hubungkan Google identity</button>
   <div className="space-y-2">{identities.map(identity=><div key={identity.id} className="flex items-center justify-between gap-3 rounded-lg border border-[var(--color-border)] p-3"><div><p className="font-medium">{identity.provider}</p><p className="text-xs text-[var(--color-text-muted)]">{identity.email??identity.id}{identity.is_primary?" · Primary":""}</p></div><button disabled={identity.is_primary||identities.length<=1} onClick={()=>void unlink(identity.id)} className="text-xs font-semibold text-red-600 disabled:opacity-40">Unlink</button></div>)}</div>
  </section>
  {org&&canManageInvites&&<section className="space-y-3">
   <h2 className="text-lg font-semibold">Undangan anggota</h2>
   <form onSubmit={createInvite} className="grid gap-3 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 md:grid-cols-4">
    <label className="text-sm">Email<input required type="email" value={email} onChange={e=>setEmail(e.target.value)} className="mt-1 w-full rounded-lg border border-[var(--color-border)] bg-transparent p-2.5"/></label>
    <label className="text-sm">Role<select required value={role} onChange={e=>setRole(e.target.value)} className="mt-1 w-full rounded-lg border border-[var(--color-border)] bg-transparent p-2.5">{roleOptions.map(item=><option key={item.key} value={item.key}>{item.name} · {item.scope_type}</option>)}</select></label>
    <label className="text-sm">Branch ID<input value={branch} onChange={e=>setBranch(e.target.value)} placeholder="UUID jika diperlukan" className="mt-1 w-full rounded-lg border border-[var(--color-border)] bg-transparent p-2.5"/></label>
    <button disabled={busy||roleOptions.length===0||!role} className="self-end rounded-lg bg-[#236D91] p-3 font-semibold text-white disabled:opacity-50">Buat undangan</button>
   </form>
   <div className="space-y-2">{invitations.map(invite=><article key={invite.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-3"><div><p className="font-medium">{invite.email}</p><p className="text-xs text-[var(--color-text-muted)]">{invite.role_key} · {invite.status} · {new Date(invite.expires_at).toLocaleString()}</p></div>{invite.status==="pending"&&<div className="flex gap-3"><button disabled={busy} onClick={()=>void inviteAction(invite.id,"resend")} className="text-xs font-semibold text-[#236D91]">Resend</button><button disabled={busy} onClick={()=>void inviteAction(invite.id,"revoke")} className="text-xs font-semibold text-red-600">Revoke</button></div>}</article>)}</div>
  </section>}
  {org&&canReadMembers&&<section className="space-y-3"><h2 className="text-lg font-semibold">Membership organisasi</h2><div className="overflow-x-auto rounded-2xl border border-[var(--color-border)]"><table className="w-full text-left text-sm"><thead><tr className="bg-[var(--color-surface-muted)]"><th className="p-3">Anggota</th><th className="p-3">Akun</th><th className="p-3">Membership</th>{canManageMembers&&<th className="p-3">Aksi</th>}</tr></thead><tbody>{members.map(m=><tr key={m.user_id} className="border-t border-[var(--color-border)]"><td className="p-3">{m.display_name??m.email}<div className="text-xs text-[var(--color-text-muted)]">{m.email}</div></td><td className="p-3">{m.account_status}</td><td className="p-3">{m.membership_status}</td>{canManageMembers&&<td className="p-3"><div className="flex gap-2"><button disabled={busy} onClick={()=>void memberStatus(m.user_id,"active")} className="text-xs text-[#236D91]">Aktifkan</button><button disabled={busy} onClick={()=>void memberStatus(m.user_id,"suspended")} className="text-xs text-amber-700">Suspend</button><button disabled={busy} onClick={()=>void memberStatus(m.user_id,"removed")} className="text-xs text-red-600">Remove</button></div></td>}</tr>)}</tbody></table></div></section>}
 </div>;
}
