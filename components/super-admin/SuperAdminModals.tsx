'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Building2,
  KeyRound,
  Plus,
  ShieldCheck,
  Globe,
  Flag,
  CreditCard,
  Plug,
  Cpu,
  Bot,
  Send,
  Search,
  Edit3,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  Bell,
  ExternalLink,
  Sliders,
  Lock,
  UserPlus,
  Server,
  Webhook,
  RefreshCw,
  HardDriveDownload,
  Terminal,
  GitBranch,
} from 'lucide-react';
import { Modal } from '@/components/common/Modal';
import { StatusTag } from '@/components/design-system/StatusTag';
import type { NotificationItem } from '@/lib/salesx-data';
import type {
  PlatformTenant,
  OrganizationNode,
  PlatformUserRecord,
  MasterDataCategory,
  ServiceRegistryItem,
  DomainRegistryItem,
  FeatureFlagItem,
  SubscriptionPackageItem,
  TenantSubscriberRecord,
  IntegrationRegistryItem,
  WebhookEndpointItem,
  PlatformApiKeyItem,
  AiProviderItem,
  AiAgentItem,
  TelegramBotItem,
  SecurityEventItem,
  AuditLogItem,
  OperationalRunbookItem,
  BackupRecoveryPoint,
} from '@/lib/salesx-super-admin-data';

/* 1. Super Admin OTP MFA Modal (Screen 1) */
export function SuperAdminOtpModal({
  open,
  onClose,
  onSuccess,
}: {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [contact, setContact] = useState('budi@salesx-ai.com');
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState('884210');

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Masuk dengan Kode OTP & MFA"
      subtitle="Autentikasi 2-langkah wajib untuk akses Platform Super Admin"
    >
      <div className="space-y-4 text-xs sm:text-sm">
        <div>
          <label className="block font-semibold mb-1">
            Email Admin / Nomor HP Terdaftar
          </label>
          <input
            type="text"
            value={contact}
            onChange={(e) => setContact(e.target.value)}
            className="w-full rounded-xl border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-3.5 py-2.5"
          />
        </div>
        {otpSent && (
          <div>
            <label className="block font-semibold mb-1">
              Kode OTP 6 Digit (TOTP / SMS)
            </label>
            <input
              type="text"
              value={otpCode}
              onChange={(e) => setOtpCode(e.target.value)}
              className="w-full rounded-xl border border-[#348CB2] bg-[var(--color-surface)] px-3.5 py-2.5 font-mono text-center tracking-widest font-bold"
            />
          </div>
        )}
        <div className="flex justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-[var(--color-border)] px-4 py-2 text-xs font-semibold cursor-pointer"
          >
            Batal
          </button>
          {!otpSent ? (
            <button
              type="button"
              onClick={() => setOtpSent(true)}
              className="inline-flex items-center gap-1.5 rounded-xl bg-[#194F70] px-4 py-2 text-xs font-bold text-white cursor-pointer"
            >
              <KeyRound className="h-3.5 w-3.5" />
              <span>Kirim Kode OTP</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => {
                onClose();
                onSuccess();
              }}
              className="inline-flex items-center gap-1.5 rounded-xl bg-[#194F70] px-4 py-2 text-xs font-bold text-white cursor-pointer"
            >
              <ShieldCheck className="h-3.5 w-3.5" />
              <span>Verifikasi & Masuk</span>
            </button>
          )}
        </div>
      </div>
    </Modal>
  );
}

/* 2. Add Tenant Modal (Screen 3) */
export function AddTenantModal({
  open,
  onClose,
  onAddTenant,
}: {
  open: boolean;
  onClose: () => void;
  onAddTenant: (t: PlatformTenant) => void;
}) {
  const [name, setName] = useState('');
  const [plan, setPlan] = useState<'Basic' | 'Pro' | 'Enterprise' | 'Trial'>('Pro');
  const [picName, setPicName] = useState('');
  const [picEmail, setPicEmail] = useState('');
  const [city, setCity] = useState('Jakarta Selatan');

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Tambah Tenant Baru"
      subtitle="Registrasi perusahaan tenant baru pada ekosistem SalesX-Ai"
    >
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (!name.trim()) return;
          const slug = name
            .toLowerCase()
            .replace(/[^a-z0-9]/g, '')
            .slice(0, 14);
          onAddTenant({
            id: `TEN-${String(Math.floor(1000 + Math.random() * 8999))}`,
            name: name.trim(),
            plan,
            status: plan === 'Trial' ? 'Trial' : 'Aktif',
            usersCount: plan === 'Enterprise' ? 250 : plan === 'Pro' ? 45 : 15,
            monthlyOrders: 0,
            monthlyGmvM: 0.15,
            domain: `${slug || 'tenant'}.salesx-ai.com`,
            picName: picName.trim() || 'Admin Tenant',
            picEmail: picEmail.trim() || `admin@${slug || 'tenant'}.co.id`,
            city: city.trim() || 'Jakarta',
            lat: -6.208763,
            lng: 106.845599,
            renewalDate: '24 Jul 2025',
          });
          setName('');
          setPicName('');
          setPicEmail('');
          onClose();
        }}
        className="space-y-3 text-xs sm:text-sm"
      >
        <div>
          <label className="block font-semibold mb-1">Nama Perusahaan Tenant</label>
          <input
            type="text"
            required
            placeholder="Contoh: PT Nusantara Distribusi"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-xl border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-3.5 py-2.5"
          />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block font-semibold mb-1">Paket Langganan</label>
            <select
              value={plan}
              onChange={(e) =>
                setPlan(e.target.value as 'Basic' | 'Pro' | 'Enterprise' | 'Trial')
              }
              className="w-full rounded-xl border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-3.5 py-2.5"
            >
              <option value="Basic">Basic (Rp 299 rb/bln)</option>
              <option value="Pro">Pro (Rp 699 rb/bln)</option>
              <option value="Enterprise">Enterprise (Custom SLA)</option>
              <option value="Trial">Trial 14 Hari</option>
            </select>
          </div>
          <div>
            <label className="block font-semibold mb-1">Kota / Wilayah</label>
            <input
              type="text"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className="w-full rounded-xl border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-3.5 py-2.5"
            />
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block font-semibold mb-1">PIC Tenant</label>
            <input
              type="text"
              required
              placeholder="Nama penanggung jawab"
              value={picName}
              onChange={(e) => setPicName(e.target.value)}
              className="w-full rounded-xl border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-3.5 py-2.5"
            />
          </div>
          <div>
            <label className="block font-semibold mb-1">Email Admin Tenant</label>
            <input
              type="email"
              required
              placeholder="admin@perusahaan.co.id"
              value={picEmail}
              onChange={(e) => setPicEmail(e.target.value)}
              className="w-full rounded-xl border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-3.5 py-2.5"
            />
          </div>
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-[var(--color-border)] px-4 py-2 text-xs font-semibold cursor-pointer"
          >
            Batal
          </button>
          <button
            type="submit"
            className="inline-flex items-center gap-1.5 rounded-xl bg-[#194F70] px-4 py-2 text-xs font-bold text-white cursor-pointer"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Simpan Tenant</span>
          </button>
        </div>
      </form>
    </Modal>
  );
}

/* 3. Tenant Detail & Governance Modal (Screen 3) */
function TenantDetailForm({
  tenant,
  onClose,
  onUpdateTenant,
  onOpenOrganizations,
}: {
  tenant: PlatformTenant;
  onClose: () => void;
  onUpdateTenant: (id: string, patch: Partial<PlatformTenant>) => void;
  onOpenOrganizations: (tenantId: string) => void;
}) {
  const [plan, setPlan] = useState<PlatformTenant['plan']>(tenant.plan);
  const [status, setStatus] = useState<PlatformTenant['status']>(tenant.status);

  return (
    <div className="space-y-4 text-xs sm:text-sm">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] p-3">
          <p className="text-[11px] text-[var(--color-text-muted)]">Pengguna</p>
          <p className="font-bold font-mono tabular-nums mt-0.5">
            {tenant.usersCount.toLocaleString('id-ID')}
          </p>
        </div>
        <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] p-3">
          <p className="text-[11px] text-[var(--color-text-muted)]">Order / Bln</p>
          <p className="font-bold font-mono tabular-nums mt-0.5">
            {tenant.monthlyOrders.toLocaleString('id-ID')}
          </p>
        </div>
        <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] p-3">
          <p className="text-[11px] text-[var(--color-text-muted)]">GMV</p>
          <p className="font-bold font-mono tabular-nums mt-0.5">
            Rp {tenant.monthlyGmvM.toFixed(2).replace('.', ',')} M
          </p>
        </div>
        <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] p-3">
          <p className="text-[11px] text-[var(--color-text-muted)]">Perpanjangan</p>
          <p className="font-bold font-mono tabular-nums mt-0.5">
            {tenant.renewalDate}
          </p>
        </div>
      </div>

      <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] p-3.5 space-y-1">
        <p className="font-bold">{tenant.picName}</p>
        <p className="text-xs text-[var(--color-text-muted)]">
          {tenant.picEmail} · {tenant.city}
        </p>
        <p className="text-xs font-mono text-[#348CB2]">{tenant.domain}</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block font-semibold mb-1">Paket Langganan</label>
          <select
            value={plan}
            disabled
            onChange={(e) => setPlan(e.target.value as PlatformTenant['plan'])
            className="w-full rounded-xl border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-3 py-2"
          >
            <option value="Basic">Basic</option>
            <option value="Pro">Pro</option>
            <option value="Enterprise">Enterprise</option>
            <option value="Trial">Trial</option>
            <option value="Belum dikonfigurasi">Belum dikonfigurasi</option>
          </select>
        </div>
        <div>
          <label className="block font-semibold mb-1">Status Tenant</label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as PlatformTenant['status'])}
            className="w-full rounded-xl border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-3 py-2"
          >
            <option value="Aktif">Aktif</option>
            <option value="Trial">Trial</option>
            <option value="Nonaktif">Nonaktif</option>
          </select>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-[var(--color-border)]">
        <button
          type="button"
          onClick={() => {
            onClose();
            onOpenOrganizations(tenant.id);
          }}
          className="inline-flex items-center gap-1.5 rounded-xl border border-[#348CB2] px-3.5 py-2 text-xs font-bold text-[#194F70] dark:text-[#87CEEB] cursor-pointer"
        >
          <Building2 className="h-3.5 w-3.5" />
          <span>Lihat Struktur Organisasi</span>
        </button>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-[var(--color-border)] px-4 py-2 text-xs font-semibold cursor-pointer"
          >
            Tutup
          </button>
          <button
            type="button"
            onClick={() => {
              onUpdateTenant(tenant.id, { plan, status });
              onClose();
            }}
            className="rounded-xl bg-[#194F70] px-4 py-2 text-xs font-bold text-white cursor-pointer"
          >
            Simpan Governance
          </button>
        </div>
      </div>
    </div>
  );
}

export function TenantDetailModal({
  tenant,
  onClose,
  onUpdateTenant,
  onOpenOrganizations,
}: {
  tenant: PlatformTenant | null;
  onClose: () => void;
  onUpdateTenant: (id: string, patch: Partial<PlatformTenant>) => void;
  onOpenOrganizations: (tenantId: string) => void;
}) {
  if (!tenant) return null;
  return (
    <Modal
      open={!!tenant}
      onClose={onClose}
      title={`${tenant.name}`}
      subtitle={`ID: ${tenant.id} · Paket ${tenant.plan}`}
      maxWidthClass="max-w-xl"
    >
      <TenantDetailForm
        key={tenant.id}
        tenant={tenant}
        onClose={onClose}
        onUpdateTenant={onUpdateTenant}
        onOpenOrganizations={onOpenOrganizations}
      />
    </Modal>
  );
}

/* 4. Add Organization Node Modal (Screen 4) */
export function AddOrganizationModal({
  open,
  onClose,
  tenants,
  defaultTenantId,
  onAddOrg,
}: {
  open: boolean;
  onClose: () => void;
  tenants: PlatformTenant[];
  defaultTenantId: string;
  onAddOrg: (node: OrganizationNode) => void;
}) {
  const [tenantId, setTenantId] = useState(defaultTenantId || tenants[0]?.id || 'TEN-0001');
  const [name, setName] = useState('');
  const [nodeType, setNodeType] = useState<OrganizationNode['nodeType']>('Cabang');
  const [city, setCity] = useState('');
  const [managerName, setManagerName] = useState('');

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Tambah Organisasi / Cabang"
      subtitle="Tambahkan struktur Head Office, Cabang, atau Gudang Regional ke tenant"
    >
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (!name.trim()) return;
          onAddOrg({
            id: `org-${Date.now()}`,
            tenantId,
            name: name.trim(),
            nodeType,
            city: city.trim() || 'Indonesia',
            managerName: managerName.trim() || 'Kepala Cabang',
            usersCount: 25,
            status: 'Aktif',
          });
          setName('');
          setCity('');
          setManagerName('');
          onClose();
        }}
        className="space-y-3 text-xs sm:text-sm"
      >
        <div>
          <label className="block font-semibold mb-1">Tenant Induk</label>
          <select
            value={tenantId}
            onChange={(e) => setTenantId(e.target.value)}
            className="w-full rounded-xl border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-3.5 py-2.5"
          >
            {tenants.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name} ({t.id})
              </option>
            ))}
          </select>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block font-semibold mb-1">Nama Organisasi</label>
            <input
              type="text"
              required
              placeholder="Cabang Bandung"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-xl border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-3.5 py-2.5"
            />
          </div>
          <div>
            <label className="block font-semibold mb-1">Tipe Unit</label>
            <select
              value={nodeType}
              onChange={(e) =>
                setNodeType(e.target.value as OrganizationNode['nodeType'])
              }
              className="w-full rounded-xl border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-3.5 py-2.5"
            >
              <option value="Cabang">Cabang</option>
              <option value="Head Office">Head Office</option>
              <option value="Gudang Regional">Gudang Regional</option>
            </select>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block font-semibold mb-1">Kota</label>
            <input
              type="text"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="Kota Bandung"
              className="w-full rounded-xl border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-3.5 py-2.5"
            />
          </div>
          <div>
            <label className="block font-semibold mb-1">Penanggung Jawab</label>
            <input
              type="text"
              value={managerName}
              onChange={(e) => setManagerName(e.target.value)}
              placeholder="Nama manajer unit"
              className="w-full rounded-xl border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-3.5 py-2.5"
            />
          </div>
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-[var(--color-border)] px-4 py-2 text-xs font-semibold cursor-pointer"
          >
            Batal
          </button>
          <button
            type="submit"
            className="rounded-xl bg-[#194F70] px-4 py-2 text-xs font-bold text-white cursor-pointer"
          >
            Simpan Organisasi
          </button>
        </div>
      </form>
    </Modal>
  );
}

/* 5. Add Platform User Modal (Screen 5) */
export function AddPlatformUserModal({
  open,
  onClose,
  tenants,
  onAddUser,
}: {
  open: boolean;
  onClose: () => void;
  tenants: PlatformTenant[];
  onAddUser: (u: PlatformUserRecord) => void;
}) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [tenantId, setTenantId] = useState(tenants[0]?.id || 'TEN-0001');
  const [role, setRole] = useState('company_admin');

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Tambah Pengguna & Hak Akses"
      subtitle="Undang admin tenant atau operator platform dengan MFA wajib"
    >
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (!name.trim() || !email.trim()) return;
          const t = tenants.find((x) => x.id === tenantId);
          onAddUser({
            id: `usr-${Date.now()}`,
            name: name.trim(),
            email: email.trim(),
            tenantId,
            tenantName: t?.name || 'SalesX-Ai Platform Core',
            role,
            status: 'Aktif',
            mfaEnabled: true,
            lastActive: 'Baru diundang',
          });
          setName('');
          setEmail('');
          onClose();
        }}
        className="space-y-3 text-xs sm:text-sm"
      >
        <div>
          <label className="block font-semibold mb-1">Nama Lengkap</label>
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Contoh: Nadia Kusuma"
            className="w-full rounded-xl border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-3.5 py-2.5"
          />
        </div>
        <div>
          <label className="block font-semibold mb-1">Email Korporat</label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="nadia@perusahaan.co.id"
            className="w-full rounded-xl border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-3.5 py-2.5"
          />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block font-semibold mb-1">Scope Tenant</label>
            <select
              value={tenantId}
              onChange={(e) => setTenantId(e.target.value)}
              className="w-full rounded-xl border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-3.5 py-2.5"
            >
              <option value="PLATFORM">Platform Core</option>
              {tenants.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block font-semibold mb-1">Role Baseline</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full rounded-xl border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-3.5 py-2.5"
            >
              <option value="platform_super_admin">platform_super_admin</option>
              <option value="company_admin">company_admin</option>
              <option value="principal_admin">principal_admin</option>
              <option value="distributor_admin">distributor_admin</option>
              <option value="supervisor">supervisor</option>
              <option value="sales">sales</option>
              <option value="customer">customer</option>
            </select>
          </div>
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-[var(--color-border)] px-4 py-2 text-xs font-semibold cursor-pointer"
          >
            Batal
          </button>
          <button
            type="submit"
            className="inline-flex items-center gap-1.5 rounded-xl bg-[#194F70] px-4 py-2 text-xs font-bold text-white cursor-pointer"
          >
            <UserPlus className="h-3.5 w-3.5" />
            <span>Buat Akun Pengguna</span>
          </button>
        </div>
      </form>
    </Modal>
  );
}

/* 6. Master Data CRUD Modal (Screen 6) */
function MasterDataCrudBody({
  category,
  onSaveItem,
  onDeleteItem,
  onToggleItemStatus,
}: {
  category: MasterDataCategory;
  onSaveItem: (
    categoryId: string,
    item: { id: string; code: string; name: string; detail: string; status: 'Aktif' | 'Nonaktif' }
  ) => void;
  onDeleteItem: (categoryId: string, itemId: string) => void;
  onToggleItemStatus: (categoryId: string, itemId: string) => void;
}) {
  const [search, setSearch] = useState('');
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [detail, setDetail] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);

  const filtered = category.items.filter((it) => {
    const q = search.toLowerCase();
    return (
      !q ||
      it.name.toLowerCase().includes(q) ||
      it.code.toLowerCase().includes(q) ||
      it.detail.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-4 text-xs sm:text-sm">
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-[var(--color-text-muted)]" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={`Cari entri ${category.title.toLowerCase()}...`}
          className="w-full rounded-xl border border-[var(--color-border-strong)] bg-[var(--color-surface)] py-2 pl-9 pr-3 text-xs"
        />
      </div>

      {/* Add / Edit inline CRUD bar */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (!name.trim()) return;
          onSaveItem(category.id, {
            id: editingId || `md-${Date.now()}`,
            code: code.trim() || `REF-${Math.floor(100 + Math.random() * 899)}`,
            name: name.trim(),
            detail: detail.trim() || 'Entri master data platform',
            status: 'Aktif',
          });
          setCode('');
          setName('');
          setDetail('');
          setEditingId(null);
        }}
        className="rounded-xl border border-[#ADD8E6] bg-[#F3FAFC] dark:bg-[#172438] p-3 grid grid-cols-1 sm:grid-cols-12 gap-2"
      >
        <input
          type="text"
          placeholder="Kode"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          className="sm:col-span-3 rounded-lg border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-2.5 py-1.5 text-xs font-mono"
        />
        <input
          type="text"
          required
          placeholder="Nama entri..."
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="sm:col-span-4 rounded-lg border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-2.5 py-1.5 text-xs"
        />
        <input
          type="text"
          placeholder="Keterangan"
          value={detail}
          onChange={(e) => setDetail(e.target.value)}
          className="sm:col-span-3 rounded-lg border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-2.5 py-1.5 text-xs"
        />
        <button
          type="submit"
          className="sm:col-span-2 rounded-lg bg-[#194F70] px-3 py-1.5 text-xs font-bold text-white cursor-pointer"
        >
          {editingId ? 'Update' : '+ Tambah'}
        </button>
      </form>

      <div className="space-y-2 max-h-[280px] overflow-y-auto">
        {filtered.map((item) => (
          <div
            key={item.id}
            className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] p-3"
          >
            <div>
              <p className="font-bold">
                <span className="font-mono text-[#348CB2] mr-1.5">{item.code}</span>
                {item.name}
              </p>
              <p className="text-[11px] text-[var(--color-text-muted)]">{item.detail}</p>
            </div>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => onToggleItemStatus(category.id, item.id)}
                className="cursor-pointer"
              >
                <StatusTag label={item.status} />
              </button>
              <button
                type="button"
                onClick={() => {
                  setEditingId(item.id);
                  setCode(item.code);
                  setName(item.name);
                  setDetail(item.detail);
                }}
                className="rounded-lg border border-[var(--color-border)] p-1.5 hover:bg-[var(--color-surface-muted)] cursor-pointer"
                title="Ubah entri"
              >
                <Edit3 className="h-3.5 w-3.5 text-[#348CB2]" />
              </button>
              <button
                type="button"
                onClick={() => onDeleteItem(category.id, item.id)}
                className="rounded-lg border border-[var(--color-border)] p-1.5 hover:bg-red-50 dark:hover:bg-red-950/30 cursor-pointer"
                title="Hapus entri"
              >
                <Trash2 className="h-3.5 w-3.5 text-red-500" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function MasterDataCrudModal({
  category,
  onClose,
  onSaveItem,
  onDeleteItem,
  onToggleItemStatus,
}: {
  category: MasterDataCategory | null;
  onClose: () => void;
  onSaveItem: (
    categoryId: string,
    item: { id: string; code: string; name: string; detail: string; status: 'Aktif' | 'Nonaktif' }
  ) => void;
  onDeleteItem: (categoryId: string, itemId: string) => void;
  onToggleItemStatus: (categoryId: string, itemId: string) => void;
}) {
  if (!category) return null;
  return (
    <Modal
      open={!!category}
      onClose={onClose}
      title={`Master Data — ${category.title}`}
      subtitle={`${category.subtitle} · Total ${category.recordsCount.toLocaleString('id-ID')} entri`}
      maxWidthClass="max-w-2xl"
    >
      <MasterDataCrudBody
        key={category.id}
        category={category}
        onSaveItem={onSaveItem}
        onDeleteItem={onDeleteItem}
        onToggleItemStatus={onToggleItemStatus}
      />
    </Modal>
  );
}

/* 7. Add & Detail Domain Modal (Screen 10) */
export function AddDomainModal({
  open,
  onClose,
  onAddDomain,
}: {
  open: boolean;
  onClose: () => void;
  onAddDomain: (d: DomainRegistryItem) => void;
}) {
  const [domain, setDomain] = useState('');
  const [portalName, setPortalName] = useState('Company Portal');
  const [internalRoute, setInternalRoute] = useState('/company');

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Tambah Domain Portal"
      subtitle="Mapping subdomain tenant/portal ke deployment target SalesX-Ai"
    >
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (!domain.trim()) return;
          onAddDomain({
            id: `dom-${Date.now()}`,
            domain: domain.trim().toLowerCase(),
            portalName,
            internalRoute,
            sslStatus: 'Valid · TLS 1.3',
            status: 'Aktif',
            targetApp: `apps/${internalRoute.replace('/', '') || 'website'}`,
          });
          setDomain('');
          onClose();
        }}
        className="space-y-3 text-xs sm:text-sm"
      >
        <div>
          <label className="block font-semibold mb-1">Hostname / Domain</label>
          <input
            type="text"
            required
            placeholder="distribusi.mitra.co.id"
            value={domain}
            onChange={(e) => setDomain(e.target.value)}
            className="w-full rounded-xl border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-3.5 py-2.5 font-mono"
          />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block font-semibold mb-1">Target Portal</label>
            <select
              value={internalRoute}
              onChange={(e) => {
                const val = e.target.value;
                setInternalRoute(val);
                const map: Record<string, string> = {
                  '/': 'Website Utama',
                  '/company': 'Company Portal',
                  '/distributor': 'Distributor Portal',
                  '/principal': 'Principal Portal',
                  '/supervisor': 'Supervisor Portal',
                  '/portal': 'Sales Portal',
                  '/customer': 'Customer Portal',
                };
                setPortalName(map[val] || 'Portal Kustom');
              }}
              className="w-full rounded-xl border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-3.5 py-2.5"
            >
              <option value="/company">Company Portal (/company)</option>
              <option value="/distributor">Distributor Portal (/distributor)</option>
              <option value="/principal">Principal Portal (/principal)</option>
              <option value="/supervisor">Supervisor Portal (/supervisor)</option>
              <option value="/portal">Sales Portal (/portal)</option>
              <option value="/customer">Customer Portal (/customer)</option>
              <option value="/">Website Utama (/)</option>
            </select>
          </div>
          <div>
            <label className="block font-semibold mb-1">Label Aplikasi</label>
            <input
              type="text"
              value={portalName}
              onChange={(e) => setPortalName(e.target.value)}
              className="w-full rounded-xl border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-3.5 py-2.5"
            />
          </div>
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-[var(--color-border)] px-4 py-2 text-xs font-semibold cursor-pointer"
          >
            Batal
          </button>
          <button
            type="submit"
            className="inline-flex items-center gap-1.5 rounded-xl bg-[#194F70] px-4 py-2 text-xs font-bold text-white cursor-pointer"
          >
            <Globe className="h-3.5 w-3.5" />
            <span>Simpan Domain</span>
          </button>
        </div>
      </form>
    </Modal>
  );
}

export function DomainDetailModal({
  domainItem,
  onClose,
  onToggleStatus,
}: {
  domainItem: DomainRegistryItem | null;
  onClose: () => void;
  onToggleStatus: (id: string) => void;
}) {
  if (!domainItem) return null;
  return (
    <Modal
      open={!!domainItem}
      onClose={onClose}
      title={domainItem.domain}
      subtitle={`${domainItem.portalName} · Target ${domainItem.targetApp}`}
    >
      <div className="space-y-4 text-xs sm:text-sm">
        <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] p-4 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[var(--color-text-muted)]">Status SSL</span>
            <span className="font-bold text-[#047857] dark:text-[#34D399]">
              {domainItem.sslStatus}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[var(--color-text-muted)]">Rute Aplikasi</span>
            <span className="font-mono font-bold text-[#348CB2]">
              {domainItem.internalRoute}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[var(--color-text-muted)]">Status Domain</span>
            <StatusTag label={domainItem.status} showIcon />
          </div>
        </div>
        <div className="flex flex-wrap justify-between gap-2">
          <button
            type="button"
            onClick={() => onToggleStatus(domainItem.id)}
            className="rounded-xl border border-[var(--color-border)] px-3.5 py-2 text-xs font-semibold cursor-pointer"
          >
            {domainItem.status === 'Aktif' ? 'Nonaktifkan Domain' : 'Aktifkan Domain'}
          </button>
          <div className="flex gap-2">
            <Link
              href={domainItem.internalRoute.startsWith('/api') ? '/' : domainItem.internalRoute}
              className="inline-flex items-center gap-1.5 rounded-xl bg-[#194F70] px-4 py-2 text-xs font-bold text-white"
            >
              <span>Buka Portal</span>
              <ExternalLink className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </Modal>
  );
}

/* 8. Add Feature Flag Modal (Screen 11) */
export function AddFeatureFlagModal({
  open,
  onClose,
  onAddFlag,
}: {
  open: boolean;
  onClose: () => void;
  onAddFlag: (ff: FeatureFlagItem) => void;
}) {
  const [key, setKey] = useState('');
  const [description, setDescription] = useState('');
  const [rolloutScope, setRolloutScope] =
    useState<FeatureFlagItem['rolloutScope']>('Enterprise & Pro');

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Tambah Feature Flag"
      subtitle="Kontrol rilis fitur bertahap di seluruh tenant platform"
    >
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (!key.trim()) return;
          const cleanKey = key.trim().toLowerCase().replace(/\s+/g, '_');
          onAddFlag({
            id: `ff-${Date.now()}`,
            key: cleanKey,
            label: cleanKey,
            description: description.trim() || 'Pengaturan modul fitur baru',
            enabled: true,
            rolloutScope,
          });
          setKey('');
          setDescription('');
          onClose();
        }}
        className="space-y-3 text-xs sm:text-sm"
      >
        <div>
          <label className="block font-semibold mb-1">Key Identifier</label>
          <input
            type="text"
            required
            placeholder="smart_route_optimization"
            value={key}
            onChange={(e) => setKey(e.target.value)}
            className="w-full rounded-xl border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-3.5 py-2.5 font-mono"
          />
        </div>
        <div>
          <label className="block font-semibold mb-1">Deskripsi Fitur</label>
          <input
            type="text"
            required
            placeholder="Optimasi rute kunjungan otomatis"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full rounded-xl border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-3.5 py-2.5"
          />
        </div>
        <div>
          <label className="block font-semibold mb-1">Target Rollout Tenant</label>
          <select
            value={rolloutScope}
            onChange={(e) =>
              setRolloutScope(e.target.value as FeatureFlagItem['rolloutScope'])
            }
            className="w-full rounded-xl border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-3.5 py-2.5"
          >
            <option value="Semua Tenant">Semua Tenant</option>
            <option value="Enterprise & Pro">Enterprise & Pro</option>
            <option value="Pilot Beta">Pilot Beta</option>
          </select>
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-[var(--color-border)] px-4 py-2 text-xs font-semibold cursor-pointer"
          >
            Batal
          </button>
          <button
            type="submit"
            className="inline-flex items-center gap-1.5 rounded-xl bg-[#194F70] px-4 py-2 text-xs font-bold text-white cursor-pointer"
          >
            <Flag className="h-3.5 w-3.5" />
            <span>Aktifkan Flag</span>
          </button>
        </div>
      </form>
    </Modal>
  );
}

/* 9. Add Subscription Package Modal (Screen 12) */
export function AddPackageModal({
  open,
  onClose,
  onAddPackage,
}: {
  open: boolean;
  onClose: () => void;
  onAddPackage: (p: SubscriptionPackageItem) => void;
}) {
  const [name, setName] = useState('');
  const [tagline, setTagline] = useState('');
  const [priceNumeric, setPriceNumeric] = useState('1499000');
  const [maxUsers, setMaxUsers] = useState('150');

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Tambah Paket Subscription"
      subtitle="Definisikan tier harga, batas pengguna, dan fitur modul platform"
    >
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (!name.trim()) return;
          const num = Number(priceNumeric) || 1499000;
          onAddPackage({
            id: `pkg-${Date.now()}`,
            name: name.trim(),
            tagline: tagline.trim() || 'Untuk distribusi regional',
            priceLabel: `Rp ${num.toLocaleString('id-ID')} / bulan`,
            priceNumeric: num,
            maxUsers: Number(maxUsers) || 100,
            maxOutlets: 3000,
            status: 'Aktif',
            features: ['SmartTeam & SmartOrder', 'Analytics & Telegram Bot'],
          });
          setName('');
          setTagline('');
          onClose();
        }}
        className="space-y-3 text-xs sm:text-sm"
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block font-semibold mb-1">Nama Paket</label>
            <input
              type="text"
              required
              placeholder="Business"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-xl border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-3.5 py-2.5"
            />
          </div>
          <div>
            <label className="block font-semibold mb-1">Tagline Singkat</label>
            <input
              type="text"
              required
              placeholder="Untuk distribusi regional"
              value={tagline}
              onChange={(e) => setTagline(e.target.value)}
              className="w-full rounded-xl border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-3.5 py-2.5"
            />
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block font-semibold mb-1">Harga / Bulan (Rp)</label>
            <input
              type="number"
              value={priceNumeric}
              onChange={(e) => setPriceNumeric(e.target.value)}
              className="w-full rounded-xl border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-3.5 py-2.5 font-mono"
            />
          </div>
          <div>
            <label className="block font-semibold mb-1">Batas Maks. User</label>
            <input
              type="number"
              value={maxUsers}
              onChange={(e) => setMaxUsers(e.target.value)}
              className="w-full rounded-xl border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-3.5 py-2.5 font-mono"
            />
          </div>
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-[var(--color-border)] px-4 py-2 text-xs font-semibold cursor-pointer"
          >
            Batal
          </button>
          <button
            type="submit"
            className="inline-flex items-center gap-1.5 rounded-xl bg-[#194F70] px-4 py-2 text-xs font-bold text-white cursor-pointer"
          >
            <CreditCard className="h-3.5 w-3.5" />
            <span>Simpan Paket</span>
          </button>
        </div>
      </form>
    </Modal>
  );
}

/* 10. Add Integration Modal (Screen 13) */
export function AddIntegrationModal({
  open,
  onClose,
  onAddIntegration,
}: {
  open: boolean;
  onClose: () => void;
  onAddIntegration: (item: IntegrationRegistryItem) => void;
}) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] =
    useState<IntegrationRegistryItem['category']>('ERP');

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Tambah Integrasi Ekosistem"
      subtitle="Daftarkan konektor ERP, Payment, Logistik, atau Webhook API baru"
    >
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (!name.trim()) return;
          onAddIntegration({
            id: `int-${Date.now()}`,
            name: name.trim(),
            description: description.trim() || 'Konektor integrasi API terkelola',
            category,
            status: 'Aktif',
            latencyLabel: '48 ms',
          });
          setName('');
          setDescription('');
          onClose();
        }}
        className="space-y-3 text-xs sm:text-sm"
      >
        <div>
          <label className="block font-semibold mb-1">Nama Integrasi</label>
          <input
            type="text"
            required
            placeholder="SAP Business One Connector"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-xl border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-3.5 py-2.5"
          />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block font-semibold mb-1">Kategori</label>
            <select
              value={category}
              onChange={(e) =>
                setCategory(e.target.value as IntegrationRegistryItem['category'])
              }
              className="w-full rounded-xl border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-3.5 py-2.5"
            >
              <option value="ERP">ERP</option>
              <option value="Payment">Payment</option>
              <option value="Logistics">Logistics</option>
              <option value="Email">Email</option>
              <option value="Google">Google Cloud / Workspace</option>
              <option value="External API">External API</option>
            </select>
          </div>
          <div>
            <label className="block font-semibold mb-1">Deskripsi</label>
            <input
              type="text"
              required
              placeholder="Sinkronisasi faktur & stok"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full rounded-xl border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-3.5 py-2.5"
            />
          </div>
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-[var(--color-border)] px-4 py-2 text-xs font-semibold cursor-pointer"
          >
            Batal
          </button>
          <button
            type="submit"
            className="inline-flex items-center gap-1.5 rounded-xl bg-[#194F70] px-4 py-2 text-xs font-bold text-white cursor-pointer"
          >
            <Plug className="h-3.5 w-3.5" />
            <span>Tambah Integrasi</span>
          </button>
        </div>
      </form>
    </Modal>
  );
}

/* 11. Add AI Provider Modal (Screen 14) */
export function AddAiProviderModal({
  open,
  onClose,
  onAddProvider,
}: {
  open: boolean;
  onClose: () => void;
  onAddProvider: (p: AiProviderItem) => void;
}) {
  const [name, setName] = useState('');
  const [subtitle, setSubtitle] = useState('Server-side Model Router');

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Tambah AI Provider"
      subtitle="Konfigurasi provider LLM & vision melalui gateway server-side"
    >
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (!name.trim()) return;
          onAddProvider({
            id: `prov-${Date.now()}`,
            name: name.trim(),
            subtitle: subtitle.trim() || 'API Gateway Provider',
            status: 'Aktif',
            latencyMs: 260,
            modelsCount: 2,
          });
          setName('');
          onClose();
        }}
        className="space-y-3 text-xs sm:text-sm"
      >
        <div>
          <label className="block font-semibold mb-1">Nama Provider</label>
          <input
            type="text"
            required
            placeholder="Provider C (Enterprise Vertex)"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-xl border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-3.5 py-2.5"
          />
        </div>
        <div>
          <label className="block font-semibold mb-1">Keterangan / Routing Role</label>
          <input
            type="text"
            value={subtitle}
            onChange={(e) => setSubtitle(e.target.value)}
            className="w-full rounded-xl border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-3.5 py-2.5"
          />
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-[var(--color-border)] px-4 py-2 text-xs font-semibold cursor-pointer"
          >
            Batal
          </button>
          <button
            type="submit"
            className="inline-flex items-center gap-1.5 rounded-xl bg-[#194F70] px-4 py-2 text-xs font-bold text-white cursor-pointer"
          >
            <Cpu className="h-3.5 w-3.5" />
            <span>Simpan Provider</span>
          </button>
        </div>
      </form>
    </Modal>
  );
}

/* 12. Add Agent / Skill Modal (Screen 15) */
export function AddAgentSkillModal({
  open,
  onClose,
  onAddAgent,
}: {
  open: boolean;
  onClose: () => void;
  onAddAgent: (ag: AiAgentItem) => void;
}) {
  const [name, setName] = useState('');
  const [roleDescription, setRoleDescription] = useState('');
  const [autonomyLevel, setAutonomyLevel] = useState<AiAgentItem['autonomyLevel']>('L1');

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Tambah AI Agent & Skill"
      subtitle="Registrasi agen pada Unified AI Orchestrator dengan batas otonomi L0–L3"
    >
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (!name.trim()) return;
          onAddAgent({
            id: `ag-${Date.now()}`,
            name: name.trim(),
            roleDescription: roleDescription.trim() || 'Asisten operasional terotorisasi',
            autonomyLevel,
            status: 'Aktif',
            assignedSkill: 'outlet_priority_tool',
          });
          setName('');
          setRoleDescription('');
          onClose();
        }}
        className="space-y-3 text-xs sm:text-sm"
      >
        <div>
          <label className="block font-semibold mb-1">Nama AI Agent</label>
          <input
            type="text"
            required
            placeholder="Promotion Advisor"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-xl border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-3.5 py-2.5"
          />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block font-semibold mb-1">Peran Utama</label>
            <input
              type="text"
              required
              placeholder="Rekomendasi promo outlet"
              value={roleDescription}
              onChange={(e) => setRoleDescription(e.target.value)}
              className="w-full rounded-xl border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-3.5 py-2.5"
            />
          </div>
          <div>
            <label className="block font-semibold mb-1">Level Otonomi</label>
            <select
              value={autonomyLevel}
              onChange={(e) =>
                setAutonomyLevel(e.target.value as AiAgentItem['autonomyLevel'])
              }
              className="w-full rounded-xl border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-3.5 py-2.5"
            >
              <option value="L0">L0 — Explain / Answer</option>
              <option value="L1">L1 — Recommend</option>
              <option value="L2">L2 — Draft Action</option>
              <option value="L3">L3 — Execute after Approval</option>
            </select>
          </div>
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-[var(--color-border)] px-4 py-2 text-xs font-semibold cursor-pointer"
          >
            Batal
          </button>
          <button
            type="submit"
            className="inline-flex items-center gap-1.5 rounded-xl bg-[#194F70] px-4 py-2 text-xs font-bold text-white cursor-pointer"
          >
            <Bot className="h-3.5 w-3.5" />
            <span>Daftarkan Agent</span>
          </button>
        </div>
      </form>
    </Modal>
  );
}

/* 13. Add Telegram Bot Modal (Screen 16) */
export function AddTelegramBotModal({
  open,
  onClose,
  tenants,
  onAddBot,
}: {
  open: boolean;
  onClose: () => void;
  tenants: PlatformTenant[];
  onAddBot: (bot: TelegramBotItem) => void;
}) {
  const [tenantId, setTenantId] = useState(tenants[0]?.id || 'TEN-0001');
  const [botHandle, setBotHandle] = useState('@sxai_baru_bot');

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Tambah Bot Telegram Perusahaan"
      subtitle="Hubungkan bot proaktif Telegram terisolasi per tenant"
    >
      <form
        onSubmit={(e) => {
          e.preventDefault();
          const t = tenants.find((x) => x.id === tenantId) || tenants[0];
          const handle = botHandle.startsWith('@')
            ? botHandle.trim()
            : `@${botHandle.trim()}`;
          onAddBot({
            id: `bot-${Date.now()}`,
            tenantId: t.id,
            companyName: t.name,
            botHandle: handle,
            status: 'Aktif',
            linkedUsers: 1,
            dailyMessages: 0,
            quietHours: '21:00 – 06:00 WIB',
          });
          onClose();
        }}
        className="space-y-3 text-xs sm:text-sm"
      >
        <div>
          <label className="block font-semibold mb-1">Perusahaan Tenant</label>
          <select
            value={tenantId}
            onChange={(e) => setTenantId(e.target.value)}
            className="w-full rounded-xl border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-3.5 py-2.5"
          >
            {tenants.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name} ({t.id})
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block font-semibold mb-1">Username Bot Telegram</label>
          <input
            type="text"
            required
            value={botHandle}
            onChange={(e) => setBotHandle(e.target.value)}
            className="w-full rounded-xl border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-3.5 py-2.5 font-mono"
          />
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-[var(--color-border)] px-4 py-2 text-xs font-semibold cursor-pointer"
          >
            Batal
          </button>
          <button
            type="submit"
            className="inline-flex items-center gap-1.5 rounded-xl bg-[#194F70] px-4 py-2 text-xs font-bold text-white cursor-pointer"
          >
            <Send className="h-3.5 w-3.5" />
            <span>Aktifkan Bot</span>
          </button>
        </div>
      </form>
    </Modal>
  );
}

/* 14. Security Event Detail Modal (Screen 18) */
export function SecurityEventDetailModal({
  eventItem,
  onClose,
  onResolveEvent,
}: {
  eventItem: SecurityEventItem | null;
  onClose: () => void;
  onResolveEvent: (id: string, nextStatus: SecurityEventItem['status']) => void;
}) {
  if (!eventItem) return null;
  return (
    <Modal
      open={!!eventItem}
      onClose={onClose}
      title={eventItem.title}
      subtitle={`Tenant ${eventItem.tenantId} · IP ${eventItem.sourceIp}`}
    >
      <div className="space-y-4 text-xs sm:text-sm">
        <div className="rounded-xl border border-amber-200 bg-amber-50 dark:bg-amber-950/30 dark:border-amber-900/50 p-3.5 space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="font-bold text-amber-800 dark:text-amber-300 flex items-center gap-1.5">
              <AlertTriangle className="h-4 w-4" />
              Severity: {eventItem.severity}
            </span>
            <StatusTag label={eventItem.status} />
          </div>
          <p className="text-xs text-[var(--color-text-secondary)]">{eventItem.detail}</p>
          <p className="text-[11px] font-mono text-[var(--color-text-muted)]">
            {eventItem.timestamp}
          </p>
        </div>
        <div className="flex flex-wrap justify-end gap-2">
          <button
            type="button"
            onClick={() => {
              onResolveEvent(eventItem.id, 'Diinvestigasi');
              onClose();
            }}
            className="rounded-xl border border-[#348CB2] px-3.5 py-2 text-xs font-bold text-[#194F70] dark:text-[#87CEEB] cursor-pointer"
          >
            Tandai Investigasi
          </button>
          <button
            type="button"
            onClick={() => {
              onResolveEvent(eventItem.id, 'Selesai');
              onClose();
            }}
            className="inline-flex items-center gap-1.5 rounded-xl bg-[#194F70] px-4 py-2 text-xs font-bold text-white cursor-pointer"
          >
            <CheckCircle2 className="h-3.5 w-3.5" />
            <span>Blokir IP & Selesaikan</span>
          </button>
        </div>
      </div>
    </Modal>
  );
}

/* 15. Audit Log Detail Modal (Screen 19) */
export function AuditLogDetailModal({
  auditItem,
  onClose,
}: {
  auditItem: AuditLogItem | null;
  onClose: () => void;
}) {
  if (!auditItem) return null;
  return (
    <Modal
      open={!!auditItem}
      onClose={onClose}
      title={auditItem.action}
      subtitle={`Correlation ID: ${auditItem.correlationId}`}
    >
      <div className="space-y-3 text-xs sm:text-sm">
        <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] p-4 space-y-2">
          <p>
            <span className="text-[var(--color-text-muted)]">Aktor:</span>{' '}
            <strong>{auditItem.actorLabel}</strong>
          </p>
          <p>
            <span className="text-[var(--color-text-muted)]">Modul:</span>{' '}
            <strong>{auditItem.module}</strong>
          </p>
          <p>
            <span className="text-[var(--color-text-muted)]">Waktu:</span>{' '}
            <span className="font-mono">{auditItem.timestamp}</span>
          </p>
          <div className="border-t border-[var(--color-border)] pt-2">
            <p className="font-semibold mb-1">Ringkasan Perubahan:</p>
            <p className="text-xs text-[var(--color-text-secondary)]">
              {auditItem.payloadSummary}
            </p>
          </div>
        </div>
        <div className="flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl bg-[#194F70] px-4 py-2 text-xs font-bold text-white cursor-pointer"
          >
            Tutup
          </button>
        </div>
      </div>
    </Modal>
  );
}

/* 16. Platform Settings Modal (Screen 20) */
export function PlatformSettingsModal({
  open,
  onClose,
  onSave,
}: {
  open: boolean;
  onClose: () => void;
  onSave: (msg: string) => void;
}) {
  const [mfaMandatory, setMfaMandatory] = useState(true);
  const [gpsRetentionDays, setGpsRetentionDays] = useState('90');
  const [quietHours, setQuietHours] = useState('21:00 – 06:00 WIB');
  const [rateLimitRpm, setRateLimitRpm] = useState('1200');

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Platform Settings & Security Governance"
      subtitle="Kebijakan global MFA, retensi data GPS, quiet hours Telegram, & rate limit"
    >
      <form
        onSubmit={(e) => {
          e.preventDefault();
          onSave('Pengaturan platform global berhasil disimpan.');
          onClose();
        }}
        className="space-y-3 text-xs sm:text-sm"
      >
        <label className="flex items-center justify-between rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] p-3.5 cursor-pointer">
          <div>
            <p className="font-bold flex items-center gap-1.5">
              <Lock className="h-4 w-4 text-[#348CB2]" />
              <span>Wajibkan MFA untuk Seluruh Admin Portal</span>
            </p>
            <p className="text-[11px] text-[var(--color-text-muted)]">
              Super Admin, Company Admin, Principal & Distributor wajib verifikasi 2FA
            </p>
          </div>
          <input
            type="checkbox"
            checked={mfaMandatory}
            onChange={(e) => setMfaMandatory(e.target.checked)}
            className="h-4 w-4 accent-[#194F70]"
          />
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block font-semibold mb-1">Retensi GPS (Hari)</label>
            <input
              type="number"
              value={gpsRetentionDays}
              onChange={(e) => setGpsRetentionDays(e.target.value)}
              className="w-full rounded-xl border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-3 py-2 font-mono"
            />
          </div>
          <div>
            <label className="block font-semibold mb-1">Telegram Quiet Hours</label>
            <input
              type="text"
              value={quietHours}
              onChange={(e) => setQuietHours(e.target.value)}
              className="w-full rounded-xl border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-3 py-2 font-mono"
            />
          </div>
          <div>
            <label className="block font-semibold mb-1">API Rate Limit (/mnt)</label>
            <input
              type="number"
              value={rateLimitRpm}
              onChange={(e) => setRateLimitRpm(e.target.value)}
              className="w-full rounded-xl border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-3 py-2 font-mono"
            />
          </div>
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-[var(--color-border)] px-4 py-2 text-xs font-semibold cursor-pointer"
          >
            Batal
          </button>
          <button
            type="submit"
            className="inline-flex items-center gap-1.5 rounded-xl bg-[#194F70] px-4 py-2 text-xs font-bold text-white cursor-pointer"
          >
            <Sliders className="h-3.5 w-3.5" />
            <span>Simpan Konfigurasi</span>
          </button>
        </div>
      </form>
    </Modal>
  );
}

/* 17. Super Admin Notifications Modal */
export function SuperAdminNotificationsModal({
  open,
  onClose,
  notifications,
  onMarkAllRead,
}: {
  open: boolean;
  onClose: () => void;
  notifications: NotificationItem[];
  onMarkAllRead: () => void;
}) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Notifikasi Platform Super Admin"
      subtitle="Peringatan sistem, langganan tenant, & event keamanan"
    >
      <div className="space-y-3 text-xs sm:text-sm">
        <div className="flex justify-end">
          <button
            type="button"
            onClick={onMarkAllRead}
            className="text-xs font-semibold text-[#348CB2] hover:underline cursor-pointer"
          >
            Tandai Semua Dibaca
          </button>
        </div>
        <div className="space-y-2 max-h-[320px] overflow-y-auto">
          {notifications.map((n) => (
            <div
              key={n.id}
              className={`rounded-xl border p-3.5 ${
                n.read
                  ? 'border-[var(--color-border)] bg-[var(--color-background)]'
                  : 'border-[#348CB2] bg-[#F3FAFC] dark:bg-[#172438]'
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <p className="font-bold flex items-center gap-1.5">
                  <Bell className="h-3.5 w-3.5 text-[#348CB2]" />
                  <span>{n.title}</span>
                </p>
                <span className="text-[11px] text-[var(--color-text-muted)]">
                  {n.timeAgo}
                </span>
              </div>
              <p className="mt-1 text-xs text-[var(--color-text-secondary)]">
                {n.detail}
              </p>
            </div>
          ))}
        </div>
      </div>
    </Modal>
  );
}

/* 18. Organization Node Detail & Edit Modal (Screen 4) */
function OrganizationNodeForm({
  node,
  onClose,
  onSave,
}: {
  node: OrganizationNode;
  onClose: () => void;
  onSave: (id: string, patch: Partial<OrganizationNode>) => void;
}) {
  const [name, setName] = useState(node.name);
  const [nodeType, setNodeType] = useState<OrganizationNode['nodeType']>(node.nodeType);
  const [city, setCity] = useState(node.city);
  const [managerName, setManagerName] = useState(node.managerName);
  const [status, setStatus] = useState<OrganizationNode['status']>(node.status);

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSave(node.id, { name, nodeType, city, managerName, status });
        onClose();
      }}
      className="space-y-3 text-xs sm:text-sm"
    >
      <div>
        <label className="block font-semibold mb-1">Nama Unit / Cabang</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full rounded-xl border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-3.5 py-2.5"
        />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block font-semibold mb-1">Tipe Unit</label>
          <select
            value={nodeType}
            onChange={(e) =>
              setNodeType(e.target.value as OrganizationNode['nodeType'])
            }
            className="w-full rounded-xl border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-3.5 py-2.5"
          >
            <option value="Head Office">Head Office</option>
            <option value="Cabang">Cabang</option>
            <option value="Gudang Regional">Gudang Regional</option>
          </select>
        </div>
        <div>
          <label className="block font-semibold mb-1">Status Operasional</label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as OrganizationNode['status'])}
            className="w-full rounded-xl border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-3.5 py-2.5"
          >
            <option value="Aktif">Aktif</option>
            <option value="Nonaktif">Nonaktif</option>
          </select>
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block font-semibold mb-1">Kota / Lokasi</label>
          <input
            type="text"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            className="w-full rounded-xl border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-3.5 py-2.5"
          />
        </div>
        <div>
          <label className="block font-semibold mb-1">Penanggung Jawab</label>
          <input
            type="text"
            value={managerName}
            onChange={(e) => setManagerName(e.target.value)}
            className="w-full rounded-xl border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-3.5 py-2.5"
          />
        </div>
      </div>
      <div className="flex justify-end gap-2 pt-2">
        <button
          type="button"
          onClick={onClose}
          className="rounded-xl border border-[var(--color-border)] px-4 py-2 text-xs font-semibold cursor-pointer"
        >
          Tutup
        </button>
        <button
          type="submit"
          className="inline-flex items-center gap-1.5 rounded-xl bg-[#194F70] px-4 py-2 text-xs font-bold text-white cursor-pointer"
        >
          <GitBranch className="h-3.5 w-3.5" />
          <span>Simpan Perubahan Unit</span>
        </button>
      </div>
    </form>
  );
}

export function OrganizationNodeDetailModal({
  node,
  onClose,
  onSave,
}: {
  node: OrganizationNode | null;
  onClose: () => void;
  onSave: (id: string, patch: Partial<OrganizationNode>) => void;
}) {
  if (!node) return null;
  return (
    <Modal
      open={!!node}
      onClose={onClose}
      title={node.name}
      subtitle={`Tenant ${node.tenantId} · ${node.usersCount} pengguna terdaftar`}
    >
      <OrganizationNodeForm key={node.id} node={node} onClose={onClose} onSave={onSave} />
    </Modal>
  );
}

/* 19. Platform User Detail & MFA Governance Modal (Screen 5) */
function PlatformUserForm({
  user,
  onClose,
  onUpdate,
}: {
  user: PlatformUserRecord;
  onClose: () => void;
  onUpdate: (id: string, patch: Partial<PlatformUserRecord>, revokeSessions?: boolean) => void;
}) {
  const [role, setRole] = useState(user.role);
  const [status, setStatus] = useState<PlatformUserRecord['status']>(user.status);
  const [mfaEnabled, setMfaEnabled] = useState(user.mfaEnabled);

  return (
    <div className="space-y-4 text-xs sm:text-sm">
      <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] p-3.5 space-y-1">
        <p className="font-bold text-[#123A54] dark:text-white">{user.name}</p>
        <p className="text-xs text-[var(--color-text-muted)]">
          {user.email} · {user.tenantName}
        </p>
        <p className="text-[11px] font-mono text-[#348CB2]">
          Aktivitas terakhir: {user.lastActive}
        </p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block font-semibold mb-1">Role Baseline</label>
          <select
            value={role}
            onChange={(e) => setRole(e.target.value)}
            className="w-full rounded-xl border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-3 py-2"
          >
            <option value="platform_super_admin">platform_super_admin</option>
            <option value="platform_support">platform_support</option>
            <option value="tenant_owner">tenant_owner</option>
            <option value="company_admin">company_admin</option>
            <option value="principal_admin">principal_admin</option>
            <option value="distributor_admin">distributor_admin</option>
            <option value="area_manager">area_manager</option>
            <option value="supervisor">supervisor</option>
            <option value="sales">sales</option>
            <option value="customer">customer</option>
            <option value="finance">finance</option>
            <option value="analyst">analyst</option>
            <option value="content_manager">content_manager</option>
          </select>
        </div>
        <div>
          <label className="block font-semibold mb-1">Status Akun</label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as PlatformUserRecord['status'])}
            className="w-full rounded-xl border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-3 py-2"
          >
            <option value="Aktif">Aktif</option>
            <option value="Suspended">Suspended</option>
          </select>
        </div>
      </div>
      <label className="flex items-center justify-between rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] p-3 cursor-pointer">
        <span className="font-semibold">Wajibkan Autentikasi 2-Faktor (MFA)</span>
        <input
          type="checkbox"
          checked={mfaEnabled}
          onChange={(e) => setMfaEnabled(e.target.checked)}
          className="h-4 w-4 accent-[#194F70]"
        />
      </label>
      <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-[var(--color-border)]">
        <button
          type="button"
          onClick={() => {
            onUpdate(user.id, { role, status, mfaEnabled }, true);
            onClose();
          }}
          className="rounded-xl border border-amber-300 px-3 py-2 text-xs font-bold text-amber-700 dark:text-amber-300 cursor-pointer"
        >
          Cabut Semua Sesi Aktif
        </button>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-[var(--color-border)] px-4 py-2 text-xs font-semibold cursor-pointer"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={() => {
              onUpdate(user.id, { role, status, mfaEnabled }, false);
              onClose();
            }}
            className="rounded-xl bg-[#194F70] px-4 py-2 text-xs font-bold text-white cursor-pointer"
          >
            Simpan Akun
          </button>
        </div>
      </div>
    </div>
  );
}

export function PlatformUserDetailModal({
  user,
  onClose,
  onUpdate,
}: {
  user: PlatformUserRecord | null;
  onClose: () => void;
  onUpdate: (id: string, patch: Partial<PlatformUserRecord>, revokeSessions?: boolean) => void;
}) {
  if (!user) return null;
  return (
    <Modal
      open={!!user}
      onClose={onClose}
      title={`Governance User — ${user.name}`}
      subtitle={`Scope: ${user.tenantId} · Role saat ini: ${user.role}`}
    >
      <PlatformUserForm key={user.id} user={user} onClose={onClose} onUpdate={onUpdate} />
    </Modal>
  );
}

/* 20. Service Detail & Health Restart Modal (Screen 8) */
export function ServiceDetailModal({
  service,
  onClose,
  onAction,
}: {
  service: ServiceRegistryItem | null;
  onClose: () => void;
  onAction: (id: string, actionType: 'restart' | 'toggle') => void;
}) {
  if (!service) return null;
  return (
    <Modal
      open={!!service}
      onClose={onClose}
      title={`${service.name} (${service.version})`}
      subtitle={`${service.runtime} · Endpoint ${service.endpoint}`}
    >
      <div className="space-y-4 text-xs sm:text-sm">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
          <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] p-3">
            <p className="text-[11px] text-[var(--color-text-muted)]">Uptime SLA</p>
            <p className="font-bold font-mono text-[#047857] dark:text-[#34D399] mt-0.5 tabular-nums">
              {service.uptimePct}
            </p>
          </div>
          <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] p-3">
            <p className="text-[11px] text-[var(--color-text-muted)]">Latensi p95</p>
            <p className="font-bold font-mono mt-0.5 tabular-nums">
              {service.latencyMs} ms
            </p>
          </div>
          <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] p-3">
            <p className="text-[11px] text-[var(--color-text-muted)]">Status</p>
            <div className="mt-1">
              <StatusTag label={service.status} showIcon />
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] p-3.5 font-mono text-[11px] text-[var(--color-text-secondary)] space-y-1">
          <p className="font-bold text-[#123A54] dark:text-white flex items-center gap-1.5">
            <Server className="h-3.5 w-3.5 text-[#348CB2]" />
            <span>Health Telemetry Log Terakhir</span>
          </p>
          <p>[OK] Readiness probe passed · 200 OK · Memory usage 42%</p>
          <p>[OK] Worker queue backlog: 0 dead-letter messages</p>
        </div>
        <div className="flex flex-wrap justify-between gap-2">
          <button
            type="button"
            onClick={() => {
              onAction(service.id, 'toggle');
              onClose();
            }}
            className="rounded-xl border border-[var(--color-border)] px-3.5 py-2 text-xs font-semibold cursor-pointer"
          >
            {service.status === 'Aktif' ? 'Tandai Degraded' : 'Pulihkan Aktif'}
          </button>
          <button
            type="button"
            onClick={() => {
              onAction(service.id, 'restart');
              onClose();
            }}
            className="inline-flex items-center gap-1.5 rounded-xl bg-[#194F70] px-4 py-2 text-xs font-bold text-white cursor-pointer"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            <span>Graceful Rolling Restart</span>
          </button>
        </div>
      </div>
    </Modal>
  );
}

/* 21. Subscriber Billing Detail Modal (Screen 12) */
function SubscriberDetailForm({
  sub,
  onClose,
  onUpdate,
}: {
  sub: TenantSubscriberRecord;
  onClose: () => void;
  onUpdate: (id: string, patch: Partial<TenantSubscriberRecord>) => void;
}) {
  const [packageName, setPackageName] = useState(sub.packageName);
  const [billingCycle, setBillingCycle] =
    useState<TenantSubscriberRecord['billingCycle']>(sub.billingCycle);
  const [status, setStatus] = useState<TenantSubscriberRecord['status']>(sub.status);

  return (
    <div className="space-y-3 text-xs sm:text-sm">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div>
          <label className="block font-semibold mb-1">Paket Langganan</label>
          <select
            value={packageName}
            onChange={(e) => setPackageName(e.target.value)}
            className="w-full rounded-xl border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-3 py-2"
          >
            <option value="Basic">Basic (Rp 299.000/bln)</option>
            <option value="Pro">Pro (Rp 699.000/bln)</option>
            <option value="Enterprise">Enterprise (Rp 18.000.000/bln)</option>
            <option value="Trial">Trial</option>
          </select>
        </div>
        <div>
          <label className="block font-semibold mb-1">Siklus Tagihan</label>
          <select
            value={billingCycle}
            onChange={(e) =>
              setBillingCycle(e.target.value as TenantSubscriberRecord['billingCycle'])
            }
            className="w-full rounded-xl border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-3 py-2"
          >
            <option value="Bulanan">Bulanan</option>
            <option value="Tahunan">Tahunan</option>
          </select>
        </div>
        <div>
          <label className="block font-semibold mb-1">Status Pembayaran</label>
          <select
            value={status}
            onChange={(e) =>
              setStatus(e.target.value as TenantSubscriberRecord['status'])
            }
            className="w-full rounded-xl border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-3 py-2"
          >
            <option value="Lunas">Lunas</option>
            <option value="Trial">Trial</option>
            <option value="Jatuh Tempo">Jatuh Tempo</option>
          </select>
        </div>
      </div>
      <div className="flex justify-end gap-2 pt-2">
        <button
          type="button"
          onClick={onClose}
          className="rounded-xl border border-[var(--color-border)] px-4 py-2 text-xs font-semibold cursor-pointer"
        >
          Tutup
        </button>
        <button
          type="button"
          onClick={() => {
            const amtMap: Record<string, string> = {
              Basic: 'Rp 299.000/bln',
              Pro: 'Rp 699.000/bln',
              Enterprise: 'Rp 18.000.000/bln',
              Trial: 'Gratis 14 Hari',
            };
            onUpdate(sub.id, {
              packageName,
              billingCycle,
              status,
              amountLabel: amtMap[packageName] || sub.amountLabel,
            });
            onClose();
          }}
          className="rounded-xl bg-[#194F70] px-4 py-2 text-xs font-bold text-white cursor-pointer"
        >
          Perbarui Langganan
        </button>
      </div>
    </div>
  );
}

export function SubscriberDetailModal({
  sub,
  onClose,
  onUpdate,
}: {
  sub: TenantSubscriberRecord | null;
  onClose: () => void;
  onUpdate: (id: string, patch: Partial<TenantSubscriberRecord>) => void;
}) {
  if (!sub) return null;
  return (
    <Modal
      open={!!sub}
      onClose={onClose}
      title={`Billing Subscriber — ${sub.tenantName}`}
      subtitle={`ID Tenant ${sub.tenantId} · Tagihan berikutnya ${sub.nextBillingDate}`}
    >
      <SubscriberDetailForm key={sub.id} sub={sub} onClose={onClose} onUpdate={onUpdate} />
    </Modal>
  );
}

/* 22. Add Webhook Endpoint Modal (Screen 13) */
export function AddWebhookModal({
  open,
  onClose,
  onAddWebhook,
}: {
  open: boolean;
  onClose: () => void;
  onAddWebhook: (wh: WebhookEndpointItem) => void;
}) {
  const [url, setUrl] = useState('');
  const [eventsText, setEventsText] = useState('order.created, visit.checked_in');

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Tambah Webhook Endpoint"
      subtitle="Terima push event real-time dari SalesX-Ai API Gateway ke sistem eksternal"
    >
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (!url.trim()) return;
          onAddWebhook({
            id: `wh-${Date.now()}`,
            url: url.trim(),
            events: eventsText
              .split(',')
              .map((s) => s.trim())
              .filter(Boolean),
            status: 'Aktif',
            lastDelivery: 'Belum ada pengiriman',
            successRate: '100%',
          });
          setUrl('');
          onClose();
        }}
        className="space-y-3 text-xs sm:text-sm"
      >
        <div>
          <label className="block font-semibold mb-1">Payload URL (HTTPS)</label>
          <input
            type="url"
            required
            placeholder="https://erp.perusahaan.co.id/webhooks/salesx"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            className="w-full rounded-xl border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-3.5 py-2.5 font-mono"
          />
        </div>
        <div>
          <label className="block font-semibold mb-1">
            Event Subscriptions (pisahkan koma)
          </label>
          <input
            type="text"
            value={eventsText}
            onChange={(e) => setEventsText(e.target.value)}
            className="w-full rounded-xl border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-3.5 py-2.5 font-mono"
          />
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-[var(--color-border)] px-4 py-2 text-xs font-semibold cursor-pointer"
          >
            Batal
          </button>
          <button
            type="submit"
            className="inline-flex items-center gap-1.5 rounded-xl bg-[#194F70] px-4 py-2 text-xs font-bold text-white cursor-pointer"
          >
            <Webhook className="h-3.5 w-3.5" />
            <span>Simpan Webhook</span>
          </button>
        </div>
      </form>
    </Modal>
  );
}

/* 23. Add API Key Modal (Screen 13) */
export function AddApiKeyModal({
  open,
  onClose,
  onAddApiKey,
}: {
  open: boolean;
  onClose: () => void;
  onAddApiKey: (key: PlatformApiKeyItem) => void;
}) {
  const [label, setLabel] = useState('');
  const [scope, setScope] = useState('orders:read orders:write');
  const [rateLimit, setRateLimit] = useState('600 req/menit');

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Buat Platform API Key Baru"
      subtitle="Terbitkan API key bertoken aman untuk integrasi B2B / ERP tenant"
    >
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (!label.trim()) return;
          const rand = Math.random().toString(16).slice(2, 6);
          onAddApiKey({
            id: `key-${Date.now()}`,
            label: label.trim(),
            prefix: `sx_live_${rand}••••••••9f21`,
            scope: scope.trim(),
            rateLimit,
            status: 'Aktif',
          });
          setLabel('');
          onClose();
        }}
        className="space-y-3 text-xs sm:text-sm"
      >
        <div>
          <label className="block font-semibold mb-1">Nama / Label Integrasi</label>
          <input
            type="text"
            required
            placeholder="Connector Gudang Surabaya"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            className="w-full rounded-xl border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-3.5 py-2.5"
          />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block font-semibold mb-1">Scope Otorisasi</label>
            <input
              type="text"
              value={scope}
              onChange={(e) => setScope(e.target.value)}
              className="w-full rounded-xl border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-3.5 py-2.5 font-mono"
            />
          </div>
          <div>
            <label className="block font-semibold mb-1">Rate Limit</label>
            <select
              value={rateLimit}
              onChange={(e) => setRateLimit(e.target.value)}
              className="w-full rounded-xl border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-3.5 py-2.5"
            >
              <option value="300 req/menit">300 req/menit</option>
              <option value="600 req/menit">600 req/menit</option>
              <option value="1.200 req/menit">1.200 req/menit</option>
            </select>
          </div>
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-[var(--color-border)] px-4 py-2 text-xs font-semibold cursor-pointer"
          >
            Batal
          </button>
          <button
            type="submit"
            className="inline-flex items-center gap-1.5 rounded-xl bg-[#194F70] px-4 py-2 text-xs font-bold text-white cursor-pointer"
          >
            <KeyRound className="h-3.5 w-3.5" />
            <span>Terbitkan API Key</span>
          </button>
        </div>
      </form>
    </Modal>
  );
}

/* 24. AI Agent Detail & Autonomy Governance Modal (Screen 15) */
function AiAgentForm({
  agent,
  onClose,
  onUpdate,
}: {
  agent: AiAgentItem;
  onClose: () => void;
  onUpdate: (id: string, patch: Partial<AiAgentItem>) => void;
}) {
  const [autonomyLevel, setAutonomyLevel] = useState<AiAgentItem['autonomyLevel']>(
    agent.autonomyLevel
  );
  const [status, setStatus] = useState<AiAgentItem['status']>(agent.status);
  const [assignedSkill, setAssignedSkill] = useState(agent.assignedSkill);

  return (
    <div className="space-y-3 text-xs sm:text-sm">
      <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] p-3.5">
        <p className="font-bold text-[#123A54] dark:text-white">{agent.name}</p>
        <p className="text-xs text-[var(--color-text-muted)]">{agent.roleDescription}</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block font-semibold mb-1">Level Otonomi (L0–L3)</label>
          <select
            value={autonomyLevel}
            onChange={(e) =>
              setAutonomyLevel(e.target.value as AiAgentItem['autonomyLevel'])
            }
            className="w-full rounded-xl border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-3 py-2"
          >
            <option value="L0">L0 — Explain / Answer Only</option>
            <option value="L1">L1 — Recommend</option>
            <option value="L2">L2 — Draft Action (Approval Gate)</option>
            <option value="L3">L3 — Audited Execute After Approval</option>
          </select>
        </div>
        <div>
          <label className="block font-semibold mb-1">Status Agent</label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as AiAgentItem['status'])}
            className="w-full rounded-xl border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-3 py-2"
          >
            <option value="Aktif">Aktif</option>
            <option value="Draft">Draft</option>
            <option value="Nonaktif">Nonaktif</option>
          </select>
        </div>
      </div>
      <div>
        <label className="block font-semibold mb-1">Assigned Tool / Skill</label>
        <input
          type="text"
          value={assignedSkill}
          onChange={(e) => setAssignedSkill(e.target.value)}
          className="w-full rounded-xl border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-3 py-2 font-mono"
        />
      </div>
      <div className="flex justify-end gap-2 pt-2">
        <button
          type="button"
          onClick={onClose}
          className="rounded-xl border border-[var(--color-border)] px-4 py-2 text-xs font-semibold cursor-pointer"
        >
          Tutup
        </button>
        <button
          type="button"
          onClick={() => {
            onUpdate(agent.id, { autonomyLevel, status, assignedSkill });
            onClose();
          }}
          className="rounded-xl bg-[#194F70] px-4 py-2 text-xs font-bold text-white cursor-pointer"
        >
          Simpan Policy Agent
        </button>
      </div>
    </div>
  );
}

export function AiAgentDetailModal({
  agent,
  onClose,
  onUpdate,
}: {
  agent: AiAgentItem | null;
  onClose: () => void;
  onUpdate: (id: string, patch: Partial<AiAgentItem>) => void;
}) {
  if (!agent) return null;
  return (
    <Modal
      open={!!agent}
      onClose={onClose}
      title={`Governance AI Agent — ${agent.name}`}
      subtitle="Atur tingkat otonomi & skill deterministik yang diizinkan"
    >
      <AiAgentForm key={agent.id} agent={agent} onClose={onClose} onUpdate={onUpdate} />
    </Modal>
  );
}

/* 25. Telegram Bot Detail & Pairing Modal (Screen 16) */
function TelegramBotForm({
  bot,
  onClose,
  onUpdate,
}: {
  bot: TelegramBotItem;
  onClose: () => void;
  onUpdate: (id: string, patch: Partial<TelegramBotItem>) => void;
}) {
  const [quietHours, setQuietHours] = useState(bot.quietHours);
  const [status, setStatus] = useState<TelegramBotItem['status']>(bot.status);

  return (
    <div className="space-y-3 text-xs sm:text-sm">
      <div className="rounded-xl border border-[#ADD8E6] bg-[#F3FAFC] dark:bg-[#172438] p-3.5 space-y-1">
        <p className="font-bold text-[#123A54] dark:text-white">
          {bot.companyName} ({bot.tenantId})
        </p>
        <p className="font-mono text-[#348CB2]">{bot.botHandle}</p>
        <p className="text-[11px] text-[var(--color-text-muted)] tabular-nums">
          {bot.linkedUsers} akun terverifikasi · {bot.dailyMessages} pesan proaktif / hari
        </p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block font-semibold mb-1">Kebijakan Quiet Hours</label>
          <input
            type="text"
            value={quietHours}
            onChange={(e) => setQuietHours(e.target.value)}
            className="w-full rounded-xl border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-3 py-2 font-mono"
          />
        </div>
        <div>
          <label className="block font-semibold mb-1">Status Webhook Bot</label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as TelegramBotItem['status'])}
            className="w-full rounded-xl border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-3 py-2"
          >
            <option value="Aktif">Aktif</option>
            <option value="Nonaktif">Nonaktif</option>
          </select>
        </div>
      </div>
      <div className="flex justify-end gap-2 pt-2">
        <button
          type="button"
          onClick={onClose}
          className="rounded-xl border border-[var(--color-border)] px-4 py-2 text-xs font-semibold cursor-pointer"
        >
          Tutup
        </button>
        <button
          type="button"
          onClick={() => {
            onUpdate(bot.id, { quietHours, status });
            onClose();
          }}
          className="rounded-xl bg-[#194F70] px-4 py-2 text-xs font-bold text-white cursor-pointer"
        >
          Simpan Konfigurasi Bot
        </button>
      </div>
    </div>
  );
}

export function TelegramBotDetailModal({
  bot,
  onClose,
  onUpdate,
}: {
  bot: TelegramBotItem | null;
  onClose: () => void;
  onUpdate: (id: string, patch: Partial<TelegramBotItem>) => void;
}) {
  if (!bot) return null;
  return (
    <Modal
      open={!!bot}
      onClose={onClose}
      title={`Konfigurasi Bot Telegram — ${bot.botHandle}`}
      subtitle={`Isolasi perusahaan ${bot.companyName}`}
    >
      <TelegramBotForm key={bot.id} bot={bot} onClose={onClose} onUpdate={onUpdate} />
    </Modal>
  );
}

/* 26. Operational Runbooks & Backup Recovery Modal (Screen 20 / Phase 13) */
export function RunbookBackupModal({
  open,
  onClose,
  runbooks,
  backups,
  onExecuteAction,
}: {
  open: boolean;
  onClose: () => void;
  runbooks: OperationalRunbookItem[];
  backups: BackupRecoveryPoint[];
  onExecuteAction: (msg: string) => void;
}) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Operational Runbooks & Backup Recovery"
      subtitle="Prosedur insiden platform P0/P1 serta snapshot PITR PostgreSQL & PostGIS"
      maxWidthClass="max-w-2xl"
    >
      <div className="space-y-4 text-xs sm:text-sm max-h-[65vh] overflow-y-auto pr-1">
        <div className="space-y-2">
          <p className="text-[11px] font-bold uppercase tracking-wider text-[var(--color-text-muted)] flex items-center gap-1.5">
            <Terminal className="h-3.5 w-3.5 text-[#348CB2]" />
            <span>Operational Runbooks</span>
          </p>
          {runbooks.map((rb) => (
            <div
              key={rb.id}
              className="rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] p-3.5 space-y-1.5"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="font-bold text-[#123A54] dark:text-white">{rb.title}</p>
                <StatusTag label={rb.severityScope} />
              </div>
              <p className="text-xs text-[var(--color-text-secondary)]">
                {rb.stepsSummary}
              </p>
              <div className="flex items-center justify-between pt-1">
                <span className="text-[11px] text-[var(--color-text-muted)]">
                  {rb.ownerTeam} · Terakhir: {rb.lastExecuted}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    onExecuteAction(`Simulasi runbook "${rb.title}" berhasil dijalankan.`);
                    onClose();
                  }}
                  className="rounded-lg border border-[#348CB2] px-2.5 py-1 text-[11px] font-bold text-[#194F70] dark:text-[#87CEEB] cursor-pointer"
                >
                  Jalankan Simulasi
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="space-y-2 pt-2 border-t border-[var(--color-border)]">
          <p className="text-[11px] font-bold uppercase tracking-wider text-[var(--color-text-muted)] flex items-center gap-1.5">
            <HardDriveDownload className="h-3.5 w-3.5 text-[#348CB2]" />
            <span>Backup & Recovery Snapshots</span>
          </p>
          {backups.map((bk) => (
            <div
              key={bk.id}
              className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] p-3"
            >
              <div>
                <p className="font-bold text-[#123A54] dark:text-white">
                  {bk.targetName}
                </p>
                <p className="text-[11px] text-[var(--color-text-muted)]">
                  {bk.schedule} · Snapshot: {bk.lastSnapshot} ({bk.sizeLabel})
                </p>
              </div>
              <StatusTag label={bk.status} />
            </div>
          ))}
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-[var(--color-border)] px-4 py-2 text-xs font-semibold cursor-pointer"
          >
            Tutup
          </button>
          <button
            type="button"
            onClick={() => {
              onExecuteAction('Manual checkpoint backup & restore verification dimulai.');
              onClose();
            }}
            className="inline-flex items-center gap-1.5 rounded-xl bg-[#194F70] px-4 py-2 text-xs font-bold text-white cursor-pointer"
          >
            <HardDriveDownload className="h-3.5 w-3.5" />
            <span>Buat Snapshot Sekarang</span>
          </button>
        </div>
      </div>
    </Modal>
  );
}

