'use client';

import React, { useState } from 'react';
import {
  Navigation,
  CheckCircle2,
  Download,
  Sparkles,
  ShieldCheck,
  Copy,
  RefreshCw,
  Eye,
  EyeOff,
  Clock,
  MapPin,
  Bot,
} from 'lucide-react';
import { Modal } from '@/components/common/Modal';
import { WorkspaceHubView } from '@/components/portal/SalesWorkspaceModals';
import {
  formatRupiah,
  type BranchItem,
  type TerritoryItem,
  type TeamMemberItem,
  type Outlet,
  type Product,
  type CompanyOrderItem,
  type CompanyAttendanceItem,
  type PromotionItem,
  type NotificationItem,
  type CompanyIntegrationSetting,
} from '@/lib/salesx-data';

/* ============================================================================
 * 1. REGISTER COMPANY MODAL
 * ============================================================================ */
export function RegisterCompanyModal({
  open,
  onClose,
  onSuccess,
}: {
  open: boolean;
  onClose: () => void;
  onSuccess: (companyName: string, email: string) => void;
}) {
  const [companyName, setCompanyName] = useState('PT Distribusi Nusantara');
  const [city, setCity] = useState('');
  const [picName, setPicName] = useState('Hendra Wijaya');
  const [email, setEmail] = useState('admin@distribusinusantara.co.id');
  const [phone, setPhone] = useState('0811-2233-4455');
  const [plan, setPlan] = useState('Growth (Rp 4.900.000/bln)');
  const [submitted, setSubmitted] = useState(false);

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Daftar Perusahaan Baru"
      subtitle="Aktifkan workspace multi-cabang SalesX-Ai Company Portal"
      maxWidthClass="max-w-md"
    >
      {!submitted ? (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            setSubmitted(true);
            onSuccess(companyName, email);
          }}
          className="space-y-3.5 text-xs sm:text-sm"
        >
          <div>
            <label className="block text-xs font-semibold mb-1">
              Nama Perusahaan
            </label>
            <input
              required
              type="text"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              className="w-full rounded-xl border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-3.5 py-2"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold mb-1">
                Kota Kantor Pusat
              </label>
              <input
                required
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full rounded-xl border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-3.5 py-2"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1">
                Nama PIC Admin
              </label>
              <input
                required
                type="text"
                value={picName}
                onChange={(e) => setPicName(e.target.value)}
                className="w-full rounded-xl border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-3.5 py-2"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold mb-1">
              Email Perusahaan
            </label>
            <input
              required
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-xl border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-3.5 py-2"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold mb-1">
                No. WhatsApp
              </label>
              <input
                required
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full rounded-xl border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-3.5 py-2 tabular-nums"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1">
                Paket Langganan
              </label>
              <select
                value={plan}
                onChange={(e) => setPlan(e.target.value)}
                className="w-full rounded-xl border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-3 py-2 text-xs"
              >
                <option value="Starter (Rp 2.000.000/bln)">
                  Starter (Rp 2 jt)
                </option>
                <option value="Growth (Rp 4.900.000/bln)">
                  Growth (Rp 4,9 jt)
                </option>
                <option value="Business (Rp 9.500.000/bln)">
                  Business (Rp 9,5 jt)
                </option>
                <option value="Enterprise (Mulai Rp 18 jt/bln)">
                  Enterprise
                </option>
              </select>
            </div>
          </div>
          <button
            type="submit"
            className="w-full rounded-xl bg-[#348CB2] hover:bg-[#236D91] py-2.5 text-sm font-bold text-white cursor-pointer"
          >
            Aktifkan Tenant Perusahaan
          </button>
        </form>
      ) : (
        <div className="space-y-4 text-xs">
          <div className="rounded-xl bg-[#ECFDF5] dark:bg-[#064E3B]/40 p-4 text-[#047857] dark:text-[#34D399] space-y-1">
            <p className="font-bold text-sm">
              Tenant {companyName} Siap Digunakan
            </p>
            <p>
              Email <strong>{email}</strong> telah diisikan pada formulir
              masuk. Silakan klik Masuk untuk membuka dashboard Company Portal.
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              setSubmitted(false);
              onClose();
            }}
            className="w-full rounded-xl bg-[#348CB2] py-2.5 text-sm font-bold text-white cursor-pointer"
          >
            Lanjutkan ke Halaman Masuk
          </button>
        </div>
      )}
    </Modal>
  );
}

/* ============================================================================
 * 2. ADD / DETAIL BRANCH MODAL
 * ============================================================================ */
export function AddBranchModal({
  open,
  onClose,
  onAdd,
}: {
  open: boolean;
  onClose: () => void;
  onAdd: (branch: BranchItem) => void;
}) {
  const [name, setName] = useState('');
  const [city, setCity] = useState('');
  const [address, setAddress] = useState('');
  const [managerName, setManagerName] = useState('');
  const [target, setTarget] = useState('120000000');

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Tambah Cabang Baru"
      subtitle="Tambahkan cabang distribusi & target penjualan bulanan"
      maxWidthClass="max-w-md"
    >
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (!name.trim()) return;
          onAdd({
            id: `br-${Date.now()}`,
            name: name.trim(),
            city: city.trim(),
            address: address.trim(),
            managerName: managerName.trim(),
            phone: '',
            salesCount: 6,
            outletCount: 85,
            monthlyTarget: Number(target) || 120_000_000,
            monthlyRealized: 0,
            status: 'Aktif',
            lat: -6.3227,
            lng: 107.3376,
          });
          setName('');
          setAddress('');
          setManagerName('');
          onClose();
        }}
        className="space-y-3.5 text-xs sm:text-sm"
      >
        <div>
          <label className="block text-xs font-semibold mb-1">
            Nama Cabang
          </label>
          <input
            required
            type="text"
            placeholder="contoh: Cabang Karawang"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-xl border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-3.5 py-2"
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold mb-1">Kota</label>
            <input
              required
              type="text"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className="w-full rounded-xl border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-3.5 py-2"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold mb-1">
              Area Manager
            </label>
            <input
              type="text"
              placeholder="Nama Manager"
              value={managerName}
              onChange={(e) => setManagerName(e.target.value)}
              className="w-full rounded-xl border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-3.5 py-2"
            />
          </div>
        </div>
        <div>
          <label className="block text-xs font-semibold mb-1">
            Alamat Lengkap
          </label>
          <input
            type="text"
            placeholder="Jl. ..."
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            className="w-full rounded-xl border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-3.5 py-2"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold mb-1">
            Target Order Bulanan (Rp)
          </label>
          <input
            type="number"
            min={1000000}
            step={1000000}
            value={target}
            onChange={(e) => setTarget(e.target.value)}
            className="w-full rounded-xl border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-3.5 py-2 tabular-nums"
          />
        </div>
        <button
          type="submit"
          className="w-full rounded-xl bg-[#348CB2] hover:bg-[#236D91] py-2.5 text-sm font-bold text-white cursor-pointer"
        >
          Simpan Cabang
        </button>
      </form>
    </Modal>
  );
}

export function BranchDetailModal({
  branch,
  onClose,
  onToggleStatus,
  canToggleStatus = true,
}: {
  branch: BranchItem | null;
  onClose: () => void;
  onToggleStatus: (branchId: string) => void;
  canToggleStatus?: boolean;
}) {
  if (!branch) return null;
  const pct =
    branch.monthlyTarget > 0
      ? ((branch.monthlyRealized / branch.monthlyTarget) * 100).toFixed(1)
      : '0';

  return (
    <Modal
      open={Boolean(branch)}
      onClose={onClose}
      title={branch.name}
      subtitle={`${branch.city} · Status ${branch.status}`}
      maxWidthClass="max-w-md"
    >
      <div className="space-y-4 text-xs">
        <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] p-4 space-y-2">
          <div className="flex justify-between">
            <span className="text-[var(--color-text-muted)]">Alamat</span>
            <span className="font-semibold text-right max-w-[65%]">
              {branch.address}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-[var(--color-text-muted)]">
              Penanggung Jawab
            </span>
            <span className="font-semibold">{branch.managerName}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-[var(--color-text-muted)]">Tim & Outlet</span>
            <span className="font-semibold tabular-nums">
              {branch.salesCount} Sales · {branch.outletCount} Outlet
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-[var(--color-text-muted)]">
              Realisasi vs Target
            </span>
            <span className="font-bold text-[#348CB2] tabular-nums">
              {formatRupiah(branch.monthlyRealized)} ({pct}%)
            </span>
          </div>
        </div>
        <div className="flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={() => onToggleStatus(branch.id)}
            disabled={!canToggleStatus}
            className="rounded-xl border border-[var(--color-border-strong)] px-4 py-2 font-semibold hover:bg-[var(--color-surface-muted)] cursor-pointer"
          >
            {branch.status === 'Aktif' ? 'Nonaktifkan Cabang' : 'Aktifkan Cabang'}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl bg-[#348CB2] px-4 py-2 font-bold text-white cursor-pointer"
          >
            Tutup
          </button>
        </div>
      </div>
    </Modal>
  );
}

/* ============================================================================
 * 3. TEAM STRUCTURE & TERRITORY & OUTLET & PRODUCT & PROMO MODALS
 * ============================================================================ */
export function AddTeamMemberModal({
  open,
  branches,
  onClose,
  onAdd,
}: {
  open: boolean;
  branches: BranchItem[];
  onClose: () => void;
  onAdd: (member: TeamMemberItem) => void;
}) {
  const [name, setName] = useState('');
  const [role, setRole] = useState<TeamMemberItem['role']>('Sales Rep');
  const [branchId, setBranchId] = useState(branches[0]?.id || 'br-1');
  const [phone, setPhone] = useState('0812-7700-8899');

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Kelola & Tambah Struktur Tim"
      subtitle="Tambahkan personel sales atau supervisor ke cabang terkait"
      maxWidthClass="max-w-md"
    >
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (!name.trim()) return;
          const branch = branches.find((b) => b.id === branchId) || branches[0];
          onAdd({
            id: `tm-${Date.now()}`,
            name: name.trim(),
            role,
            area: `${role === 'Sales Rep' ? 'Sales' : role} - ${branch?.city || 'Area Bogor'}`,
            branchId,
            phone,
            status: 'Online',
            currentLocation: branch?.address || 'Kantor Cabang',
            speedKmh: 0,
            accuracyM: 6,
            lastUpdate: 'Baru saja',
            lat: branch?.lat || -6.595204,
            lng: branch?.lng || 106.797781,
            monthlyOrderValue: 28_500_000,
            visitsToday: 4,
            targetVisits: 8,
          });
          setName('');
          onClose();
        }}
        className="space-y-3.5 text-xs sm:text-sm"
      >
        <div>
          <label className="block text-xs font-semibold mb-1">
            Nama Personel
          </label>
          <input
            required
            type="text"
            placeholder="contoh: Wahyu Saputra"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-xl border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-3.5 py-2"
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold mb-1">Peran</label>
            <select
              value={role}
              onChange={(e) =>
                setRole(e.target.value as TeamMemberItem['role'])
              }
              className="w-full rounded-xl border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-3 py-2 text-xs"
            >
              <option value="Sales Rep">Sales Rep</option>
              <option value="Supervisor">Supervisor</option>
              <option value="Area Manager">Area Manager</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold mb-1">
              Cabang Penugasan
            </label>
            <select
              value={branchId}
              onChange={(e) => setBranchId(e.target.value)}
              className="w-full rounded-xl border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-3 py-2 text-xs"
            >
              {branches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div>
          <label className="block text-xs font-semibold mb-1">
            No. Kontak / WhatsApp
          </label>
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="w-full rounded-xl border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-3.5 py-2 tabular-nums"
          />
        </div>
        <button
          type="submit"
          className="w-full rounded-xl bg-[#348CB2] hover:bg-[#236D91] py-2.5 text-sm font-bold text-white cursor-pointer"
        >
          Simpan Anggota Tim
        </button>
      </form>
    </Modal>
  );
}

export function AddTerritoryModal({
  open,
  branches,
  onClose,
  onAdd,
}: {
  open: boolean;
  branches: BranchItem[];
  onClose: () => void;
  onAdd: (t: TerritoryItem) => void;
}) {
  const [name, setName] = useState('');
  const [branchName, setBranchName] = useState(
    branches[0]?.name || 'Kantor Pusat'
  );
  const [outletCount, setOutletCount] = useState('14');
  const [colorHex, setColorHex] = useState('#348CB2');

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Tambah Teritori Wilayah"
      subtitle="Tetapkan zona distribusi dan jumlah outlet target"
      maxWidthClass="max-w-md"
    >
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (!name.trim()) return;
          onAdd({
            id: `ter-${Date.now()}`,
            name: name.trim(),
            branchName,
            outletCount: Number(outletCount) || 12,
            salesAssigned: 5,
            coveragePct: 75.0,
            colorHex,
            lat: -6.58 + (Math.random() - 0.5) * 0.05,
            lng: 106.8 + (Math.random() - 0.5) * 0.05,
          });
          setName('');
          onClose();
        }}
        className="space-y-3.5 text-xs sm:text-sm"
      >
        <div>
          <label className="block text-xs font-semibold mb-1">
            Nama Teritori
          </label>
          <input
            required
            type="text"
            placeholder="contoh: Teritori Depok Selatan"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-xl border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-3.5 py-2"
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold mb-1">
              Cabang Induk
            </label>
            <select
              value={branchName}
              onChange={(e) => setBranchName(e.target.value)}
              className="w-full rounded-xl border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-3 py-2 text-xs"
            >
              {branches.map((b) => (
                <option key={b.id} value={b.name}>
                  {b.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold mb-1">
              Kuota Outlet
            </label>
            <input
              type="number"
              min={1}
              value={outletCount}
              onChange={(e) => setOutletCount(e.target.value)}
              className="w-full rounded-xl border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-3.5 py-2 tabular-nums"
            />
          </div>
        </div>
        <div>
          <label className="block text-xs font-semibold mb-1.5">
            Warna Penanda Wilayah
          </label>
          <div className="flex gap-2">
            {['#10B981', '#348CB2', '#F97316', '#6366F1'].map((hex) => (
              <button
                key={hex}
                type="button"
                onClick={() => setColorHex(hex)}
                className={`h-8 w-8 rounded-lg border-2 cursor-pointer ${
                  colorHex === hex ? 'border-[#123A54] scale-110' : 'border-transparent'
                }`}
                style={{ backgroundColor: hex }}
                aria-label={`Pilih warna ${hex}`}
              />
            ))}
          </div>
        </div>
        <button
          type="submit"
          className="w-full rounded-xl bg-[#348CB2] hover:bg-[#236D91] py-2.5 text-sm font-bold text-white cursor-pointer"
        >
          Simpan Teritori
        </button>
      </form>
    </Modal>
  );
}

export function AddOutletCompanyModal({
  open,
  onClose,
  onAdd,
}: {
  open: boolean;
  onClose: () => void;
  onAdd: (o: Outlet) => void;
}) {
  const [name, setName] = useState('');
  const [city, setCity] = useState('Kota Bogor');
  const [address, setAddress] = useState('');
  const [picName, setPicName] = useState('');
  const [phone, setPhone] = useState('');
  const [category, setCategory] = useState('General Trade');

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Tambah Outlet Mitra"
      subtitle="Daftarkan toko / outlet baru ke jaringan distribusi"
      maxWidthClass="max-w-md"
    >
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (!name.trim()) return;
          onAdd({
            id: `out-${Date.now()}`,
            name: name.trim(),
            city: city.trim(),
            address: address.trim(),
            distanceKm: 0,
            isPriority: false,
            visitToday: false,
            status: 'Aktif',
            category,
            picName: picName.trim(),
            phone: phone.trim(),
            email: '',
            lat: 0,
            lng: 0,
            lastOrderTotal: 0,
            lastVisitDate: 'Baru Terdaftar',
          });
          setName('');
          setAddress('');
          setPicName('');
          setPhone('');
          onClose();
        }}
        className="space-y-3 text-xs sm:text-sm"
      >
        <div>
          <label className="block text-xs font-semibold mb-1">Nama Outlet</label>
          <input
            required
            type="text"
            placeholder="contoh: Toko Berkah Mandiri"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-xl border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-3.5 py-2"
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold mb-1">Kota</label>
            <input
              type="text"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className="w-full rounded-xl border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-3.5 py-2"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold mb-1">Kategori</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full rounded-xl border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-3 py-2 text-xs"
            >
              <option value="General Trade">General Trade</option>
              <option value="Modern Trade">Modern Trade</option>
              <option value="Semi Grosir">Semi Grosir</option>
            </select>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold mb-1">Nama PIC</label>
            <input
              type="text"
              placeholder="Bapak / Ibu ..."
              value={picName}
              onChange={(e) => setPicName(e.target.value)}
              className="w-full rounded-xl border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-3.5 py-2"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold mb-1">No. HP</label>
            <input
              type="tel"
              placeholder="0812..."
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full rounded-xl border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-3.5 py-2 tabular-nums"
            />
          </div>
        </div>
        <div>
          <label className="block text-xs font-semibold mb-1">Alamat</label>
          <input
            type="text"
            placeholder="Jl. ..."
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            className="w-full rounded-xl border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-3.5 py-2"
          />
        </div>
        <button
          type="submit"
          className="w-full rounded-xl bg-[#348CB2] hover:bg-[#236D91] py-2.5 text-sm font-bold text-white cursor-pointer"
        >
          Simpan Outlet
        </button>
      </form>
    </Modal>
  );
}

export function AddProductModal({
  open,
  onClose,
  onAdd,
}: {
  open: boolean;
  onClose: () => void;
  onAdd: (p: Product) => void;
}) {
  const [sku, setSku] = useState('SX-MNM-008');
  const [name, setName] = useState('');
  const [category, setCategory] = useState<Product['category']>('Minuman');
  const [price, setPrice] = useState('6000');
  const [stock, setStock] = useState('500');

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Tambah Produk / SKU Baru"
      subtitle="Tambahkan produk ke katalog terpusat & sinkronkan ke seluruh portal"
      maxWidthClass="max-w-md"
    >
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (!name.trim() || !sku.trim()) return;
          onAdd({
            sku: sku.trim().toUpperCase(),
            name: name.trim(),
            category,
            unit: 'pcs',
            price: Number(price) || 5000,
            stock: Number(stock) || 100,
            tag: 'Baru',
            accentHex: '#348CB2',
          });
          setName('');
          onClose();
        }}
        className="space-y-3 text-xs sm:text-sm"
      >
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold mb-1">Kode SKU</label>
            <input
              required
              type="text"
              value={sku}
              onChange={(e) => setSku(e.target.value)}
              className="w-full rounded-xl border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-3.5 py-2 font-mono"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold mb-1">Kategori</label>
            <select
              value={category}
              onChange={(e) =>
                setCategory(e.target.value as Product['category'])
              }
              className="w-full rounded-xl border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-3 py-2 text-xs"
            >
              <option value="Minuman">Minuman</option>
              <option value="Makanan">Makanan</option>
              <option value="Perawatan">Perawatan</option>
              <option value="Lainnya">Lainnya</option>
            </select>
          </div>
        </div>
        <div>
          <label className="block text-xs font-semibold mb-1">Nama Produk</label>
          <input
            required
            type="text"
            placeholder="contoh: Kopi Susu Botol 200 ml"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-xl border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-3.5 py-2"
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold mb-1">
              Harga Dasar (Rp)
            </label>
            <input
              type="number"
              min={500}
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              className="w-full rounded-xl border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-3.5 py-2 tabular-nums"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold mb-1">Stok Awal</label>
            <input
              type="number"
              min={0}
              value={stock}
              onChange={(e) => setStock(e.target.value)}
              className="w-full rounded-xl border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-3.5 py-2 tabular-nums"
            />
          </div>
        </div>
        <button
          type="submit"
          className="w-full rounded-xl bg-[#348CB2] hover:bg-[#236D91] py-2.5 text-sm font-bold text-white cursor-pointer"
        >
          Simpan SKU Produk
        </button>
      </form>
    </Modal>
  );
}

export function AddPromotionModal({
  open,
  onClose,
  onAdd,
}: {
  open: boolean;
  onClose: () => void;
  onAdd: (p: PromotionItem) => void;
}) {
  const [title, setTitle] = useState('');
  const [type, setType] = useState<'Promo' | 'Campaign'>('Promo');
  const [rule, setRule] = useState('Diskon 15% pembelian minimal 3 karton');
  const [validUntil, setValidUntil] = useState('31 Des 2026');

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Buat Program Promosi"
      subtitle="Terapkan promo ke Sales Order & Customer Portal secara deterministik"
      maxWidthClass="max-w-md"
    >
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (!title.trim()) return;
          onAdd({
            id: `promo-${Date.now()}`,
            title: title.trim(),
            subtitle: rule,
            validUntil,
            type,
            status: 'Aktif',
            discountRule: rule,
            terms: [
              'Berlaku otomatis melalui mesin aturan harga SalesX-Ai.',
              'Dapat dipantau efektivitasnya pada laporan promosi perusahaan.',
            ],
          });
          setTitle('');
          onClose();
        }}
        className="space-y-3.5 text-xs sm:text-sm"
      >
        <div>
          <label className="block text-xs font-semibold mb-1">
            Nama Program Promosi
          </label>
          <input
            required
            type="text"
            placeholder="contoh: Promo Bundling Akhir Bulan 15%"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full rounded-xl border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-3.5 py-2"
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold mb-1">Jenis</label>
            <select
              value={type}
              onChange={(e) =>
                setType(e.target.value as 'Promo' | 'Campaign')
              }
              className="w-full rounded-xl border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-3 py-2 text-xs"
            >
              <option value="Promo">Program Promo</option>
              <option value="Campaign">Campaign Display</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold mb-1">
              Berlaku Hingga
            </label>
            <input
              type="text"
              value={validUntil}
              onChange={(e) => setValidUntil(e.target.value)}
              className="w-full rounded-xl border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-3.5 py-2"
            />
          </div>
        </div>
        <div>
          <label className="block text-xs font-semibold mb-1">
            Aturan Diskon / Insentif
          </label>
          <input
            type="text"
            value={rule}
            onChange={(e) => setRule(e.target.value)}
            className="w-full rounded-xl border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-3.5 py-2"
          />
        </div>
        <button
          type="submit"
          className="w-full rounded-xl bg-[#348CB2] hover:bg-[#236D91] py-2.5 text-sm font-bold text-white cursor-pointer"
        >
          Terbitkan Program Promosi
        </button>
      </form>
    </Modal>
  );
}

/* ============================================================================
 * 4. MONITORING MODALS (GPS Detail, GPS Journey, Visit Proof, Order Approval)
 * ============================================================================ */
export function TeamTelemetryModal({
  member,
  onClose,
}: {
  member: TeamMemberItem | null;
  onClose: () => void;
}) {
  if (!member) return null;
  return (
    <Modal
      open={Boolean(member)}
      onClose={onClose}
      title={`Detail Telemetry: ${member.name}`}
      subtitle={`${member.area} · Status ${member.status}`}
      maxWidthClass="max-w-md"
    >
      <div className="space-y-4 text-xs">
        <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] p-4 space-y-2">
          <div className="flex justify-between">
            <span className="text-[var(--color-text-muted)]">Lokasi Terakhir</span>
            <span className="font-semibold text-right">{member.currentLocation}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-[var(--color-text-muted)]">Koordinat GPS</span>
            <span className="font-mono tabular-nums">
              {member.lat.toFixed(5)}, {member.lng.toFixed(5)}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-[var(--color-text-muted)]">Kecepatan / Akurasi</span>
            <span className="font-semibold tabular-nums">
              {member.speedKmh} km/jam · ± {member.accuracyM} meter
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-[var(--color-text-muted)]">Kunjungan Hari Ini</span>
            <span className="font-bold text-[#348CB2] tabular-nums">
              {member.visitsToday} / {member.targetVisits} Outlet
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-[var(--color-text-muted)]">Nilai Order Bulan Ini</span>
            <span className="font-bold text-[#10B981] tabular-nums">
              {formatRupiah(member.monthlyOrderValue)}
            </span>
          </div>
        </div>
        <div className="flex items-start gap-2 rounded-xl bg-[#F3FAFC] dark:bg-[#172438] p-3 text-[11px] text-[#236D91] dark:text-[#87CEEB]">
          <ShieldCheck className="h-4 w-4 shrink-0 mt-0.5" />
          <span>
            Pelacakan lokasi hanya aktif saat jam kerja shift sales dan tercatat
            dalam jejak audit akses admin.
          </span>
        </div>
      </div>
    </Modal>
  );
}

export function GpsJourneyDetailModal({
  open,
  memberName,
  dateLabel,
  onClose,
}: {
  open: boolean;
  memberName: string;
  dateLabel: string;
  onClose: () => void;
}) {
  const checkpoints = [
    { time: '08:02 WIB', label: 'Absen Masuk Geofence Kantor Area Bogor', speed: '0 km/jam' },
    { time: '08:48 WIB', label: 'Check-in Toko Makmur Jaya (Jl. Raya Bogor)', speed: '0 km/jam' },
    { time: '09:35 WIB', label: 'Dalam Perjalanan menuju Bogor Timur', speed: '26 km/jam' },
    { time: '10:15 WIB', label: 'Check-in Toko Sentosa (Bukti Foto Diunggah)', speed: '0 km/jam' },
    { time: '13:10 WIB', label: 'Check-in Toko Sumber Rezeki Cibinong', speed: '0 km/jam' },
  ];

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`Detail Perjalanan: ${memberName}`}
      subtitle={`Tanggal ${dateLabel} · Total Jarak 27,4 km · 32 Titik GPS`}
      maxWidthClass="max-w-md"
    >
      <div className="space-y-3 text-xs">
        {checkpoints.map((cp) => (
          <div
            key={cp.time}
            className="flex items-start gap-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] p-3"
          >
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#E5F4F8] dark:bg-[#19394B] text-[#348CB2]">
              <Navigation className="h-3.5 w-3.5" />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <span className="font-bold text-[var(--color-text-primary)] tabular-nums">
                  {cp.time}
                </span>
                <span className="text-[11px] text-[var(--color-text-muted)] tabular-nums">
                  {cp.speed}
                </span>
              </div>
              <p className="text-[var(--color-text-secondary)] mt-0.5">
                {cp.label}
              </p>
            </div>
          </div>
        ))}
      </div>
    </Modal>
  );
}

export function CompanyOrderApprovalModal({
  order,
  onClose,
  onUpdateStatus,
}: {
  order: CompanyOrderItem | null;
  onClose: () => void;
  onUpdateStatus: (
    orderId: string,
    status: CompanyOrderItem['status'],
    cancelReason?: string
  ) => void;
}) {
  const [cancelMode, setCancelMode] = useState(false);
  const [cancelReason, setCancelReason] = useState(
    'Stok gudang cabang sedang direkonsiliasi'
  );
  if (!order) return null;

  const sampleItems = [
    { name: 'Minuman Energi 250 ml', qty: '120 dus', amount: Math.round(order.total * 0.55) },
    { name: 'Biskuit Cokelat 100 g', qty: '60 krt', amount: order.total - Math.round(order.total * 0.55) },
  ];

  return (
    <Modal
      open={Boolean(order)}
      onClose={() => {
        setCancelMode(false);
        onClose();
      }}
      title={`Detail Order ${order.id}`}
      subtitle={`${order.outletName} · ${order.branchName}`}
      maxWidthClass="max-w-md"
    >
      <div className="space-y-4 text-xs">
        <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] p-4 space-y-2">
          <div className="flex justify-between">
            <span className="text-[var(--color-text-muted)]">Sales Penanggung Jawab</span>
            <span className="font-semibold">{order.salesName}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-[var(--color-text-muted)]">Waktu Order</span>
            <span className="font-semibold tabular-nums">{order.dateLabel}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-[var(--color-text-muted)]">Jumlah Item SKU</span>
            <span className="font-semibold tabular-nums">{order.itemsCount} SKU</span>
          </div>
          <div className="flex justify-between">
            <span className="text-[var(--color-text-muted)]">Status Pembayaran</span>
            <span className="font-semibold">{order.paymentStatus}</span>
          </div>
          <div className="flex justify-between pt-2 border-t border-[var(--color-border)]">
            <span className="font-bold">Total Nilai Order</span>
            <span className="text-sm font-bold text-[#348CB2] tabular-nums">
              {formatRupiah(order.total)}
            </span>
          </div>
        </div>

        <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-3.5 space-y-2">
          <p className="font-bold text-[11px] uppercase tracking-wider text-[var(--color-text-muted)]">
            Rincian Produk Order
          </p>
          {sampleItems.map((it) => (
            <div key={it.name} className="flex justify-between items-center">
              <span>
                {it.name}{' '}
                <span className="text-[var(--color-text-muted)]">({it.qty})</span>
              </span>
              <span className="font-semibold tabular-nums">
                {formatRupiah(it.amount)}
              </span>
            </div>
          ))}
        </div>

        {order.cancelReason && (
          <div className="rounded-xl bg-red-50 dark:bg-red-950/40 p-3 text-red-700 dark:text-red-300">
            Alasan Pembatalan: <strong>{order.cancelReason}</strong>
          </div>
        )}

        {!cancelMode ? (
          <div className="space-y-2.5">
            <p className="text-xs font-semibold text-[var(--color-text-secondary)]">
              Perbarui Status Operasional Order
            </p>
            <div className="grid grid-cols-2 gap-2">
              {(['Diproses', 'Dikirim', 'Selesai'] as const).map((nextStatus) => (
                <button
                  key={nextStatus}
                  type="button"
                  onClick={() => {
                    onUpdateStatus(order.id, nextStatus);
                    onClose();
                  }}
                  className={`rounded-xl py-2.5 px-3 text-xs font-bold cursor-pointer border transition-colors ${
                    order.status === nextStatus
                      ? 'bg-[#348CB2] text-white border-[#348CB2]'
                      : 'border-[var(--color-border-strong)] hover:bg-[var(--color-surface-muted)]'
                  }`}
                >
                  Tandai {nextStatus}
                </button>
              ))}
              <button
                type="button"
                onClick={() => setCancelMode(true)}
                className="rounded-xl py-2.5 px-3 text-xs font-bold cursor-pointer border border-red-200 dark:border-red-900/50 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30"
              >
                Batalkan Order
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-2.5 rounded-xl border border-red-200 dark:border-red-900/50 p-3.5">
            <label className="block font-bold text-red-600 dark:text-red-400">
              Alasan Pembatalan Order
            </label>
            <textarea
              rows={2}
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              className="w-full rounded-xl border border-[var(--color-border-strong)] bg-[var(--color-surface)] p-2 text-xs"
            />
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setCancelMode(false)}
                className="rounded-lg border border-[var(--color-border)] px-3 py-1.5 font-semibold cursor-pointer"
              >
                Kembali
              </button>
              <button
                type="button"
                onClick={() => {
                  onUpdateStatus(order.id, 'Batal', cancelReason);
                  setCancelMode(false);
                  onClose();
                }}
                className="rounded-lg bg-red-600 px-3 py-1.5 font-bold text-white cursor-pointer"
              >
                Konfirmasi Batal
              </button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}

/* ============================================================================
 * 5. REPORT PREVIEW & CSV EXPORT + AI EXECUTIVE BRIEF + SETTINGS MODALS
 * ============================================================================ */
export function ReportPreviewModal({
  report,
  branches,
  orders,
  onClose,
}: {
  report: {
    id: string;
    title: string;
    subtitle: string;
    rowsCount: number;
    period: string;
  } | null;
  branches: BranchItem[];
  orders: CompanyOrderItem[];
  onClose: () => void;
}) {
  const [downloaded, setDownloaded] = useState(false);
  if (!report) return null;

  const handleDownloadCsv = () => {
    const header = 'Cabang,Kota,Order Terealisasi,Target Bulanan,Status\n';
    const rows = branches
      .map(
        (b) =>
          `"${b.name}","${b.city}",${b.monthlyRealized},${b.monthlyTarget},"${b.status}"`
      )
      .join('\n');
    const blob = new Blob([header + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${report.id}-${report.period.replace(/\s+/g, '-')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    setDownloaded(true);
  };

  return (
    <Modal
      open={Boolean(report)}
      onClose={() => {
        setDownloaded(false);
        onClose();
      }}
      title={report.title}
      subtitle={`${report.subtitle} · Periode ${report.period}`}
      maxWidthClass="max-w-lg"
    >
      <div className="space-y-4 text-xs">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
          <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] p-3">
            <p className="text-[11px] text-[var(--color-text-muted)]">Total Baris</p>
            <p className="text-base font-bold tabular-nums mt-0.5">
              {report.rowsCount.toLocaleString('id-ID')}
            </p>
          </div>
          <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] p-3">
            <p className="text-[11px] text-[var(--color-text-muted)]">Cabang</p>
            <p className="text-base font-bold tabular-nums mt-0.5">
              {branches.length} Aktif
            </p>
          </div>
          <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] p-3">
            <p className="text-[11px] text-[var(--color-text-muted)]">Sampel Order</p>
            <p className="text-base font-bold tabular-nums mt-0.5">
              {orders.length} Terbaru
            </p>
          </div>
        </div>

        <div className="rounded-xl border border-[var(--color-border)] overflow-x-auto">
          <table className="w-full min-w-[360px] text-left">
            <thead className="bg-[var(--color-surface-muted)] text-[11px] font-semibold">
              <tr>
                <th className="px-3 py-2">Cabang</th>
                <th className="px-3 py-2 text-right">Realisasi</th>
                <th className="px-3 py-2 text-right">Capaian</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-border)]">
              {branches.slice(0, 4).map((b) => {
                const pct = ((b.monthlyRealized / b.monthlyTarget) * 100).toFixed(1);
                return (
                  <tr key={b.id}>
                    <td className="px-3 py-2 font-medium">{b.name}</td>
                    <td className="px-3 py-2 text-right tabular-nums">
                      {formatRupiah(b.monthlyRealized)}
                    </td>
                    <td className="px-3 py-2 text-right font-bold text-[#10B981] tabular-nums">
                      {pct}%
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {downloaded && (
          <div className="flex items-center gap-2 rounded-xl bg-[#ECFDF5] dark:bg-[#064E3B]/40 px-3.5 py-2.5 text-[#047857] dark:text-[#34D399]">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            <span>Berkas CSV berhasil diunduh ke perangkat Anda.</span>
          </div>
        )}

        <div className="flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-[var(--color-border)] px-4 py-2 font-semibold cursor-pointer"
          >
            Tutup
          </button>
          <button
            type="button"
            onClick={handleDownloadCsv}
            className="inline-flex items-center gap-1.5 rounded-xl bg-[#348CB2] hover:bg-[#236D91] px-4 py-2 font-bold text-white cursor-pointer"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Unduh Laporan (.CSV)</span>
          </button>
        </div>
      </div>
    </Modal>
  );
}

export function IntegrationConfigModal({
  integration,
  outlets,
  onClose,
  onToggleConnect,
}: {
  integration: CompanyIntegrationSetting | null;
  outlets: Outlet[];
  onClose: () => void;
  onToggleConnect: (id: string) => void;
}) {
  const [aiQuestion, setAiQuestion] = useState(
    'Berikan ringkasan performa 5 cabang PT Maju Distribusi dan rekomendasi fokus peningkatan minggu depan.'
  );
  const [aiAnswer, setAiAnswer] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [webhookUrl, setWebhookUrl] = useState(
    'https://erp.majudistribusi.co.id/webhooks/salesx-events'
  );
  const [apiKey, setApiKey] = useState('sx_live_ptmaju_98f21a4bc701');
  const [showKey, setShowKey] = useState(false);
  const [copiedKey, setCopiedKey] = useState(false);
  const [webhookEvents, setWebhookEvents] = useState<string[]>([
    'order.created',
    'visit.checked_in',
    'shift.started',
  ]);
  const [telegramEnabled, setTelegramEnabled] = useState(true);
  const [telegramCode, setTelegramCode] = useState('SX-MAJU-2025');
  const [emailNotifEnabled, setEmailNotifEnabled] = useState(true);
  const [savedFlag, setSavedFlag] = useState(false);

  if (!integration) return null;

  const handleAskExecutiveAi = async () => {
    setAiLoading(true);
    try {
      const res = await fetch('/api/gemini/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: aiQuestion,
          context:
            'Perusahaan: PT Maju Distribusi. Target Bulanan Rp 600.000.000, Realisasi Rp 625.800.000 (104,3%). Total Order 1.248, Outlet Aktif 1.045 (83,8%), Tim Sales 42 aktif. Cabang Bekasi di 98,6% dan Bogor di 112,5%.',
        }),
      });
      const data = await res.json();
      setAiAnswer(data.text || data.error || 'Analisis berhasil dimuat.');
    } catch {
      setAiAnswer('Gagal menghubungi layanan AI Executive SalesX-Ai.');
    } finally {
      setAiLoading(false);
    }
  };

  const handleCopyKey = () => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(apiKey).catch(() => {});
    }
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2000);
  };

  const handleRegenerateKey = () => {
    const suffix = Math.random().toString(36).slice(2, 10);
    setApiKey(`sx_live_ptmaju_${suffix}`);
    setSavedFlag(true);
  };

  const toggleWebhookEvent = (ev: string) => {
    setWebhookEvents((prev) =>
      prev.includes(ev) ? prev.filter((item) => item !== ev) : [...prev, ev]
    );
  };

  return (
    <Modal
      open={Boolean(integration)}
      onClose={() => {
        setSavedFlag(false);
        onClose();
      }}
      title={integration.title}
      subtitle={integration.subtitle}
      maxWidthClass={
        integration.category === 'external' ? 'max-w-3xl' : 'max-w-lg'
      }
    >
      {integration.category === 'external' ? (
        <div className="space-y-4">
          <div className="rounded-xl border border-[#ADD8E6] bg-[#F3FAFC] dark:bg-[#172438] p-3.5 text-xs text-[#236D91] dark:text-[#87CEEB]">
            Google Maps Platform aktif untuk Manajemen Teritori, Pelacakan GPS
            Real-time, & Pencarian Leads. Hubungkan Google Workspace di bawah
            untuk sinkronisasi Gmail, Calendar, dan Meet tim perusahaan.
          </div>
          <WorkspaceHubView outlets={outlets} />
        </div>
      ) : integration.category === 'ai' ? (
        <div className="space-y-4 text-xs">
          <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] p-3.5">
            <p className="font-bold text-[var(--color-text-primary)] mb-1">
              Tanya Executive Staff AI SalesX-Ai
            </p>
            <textarea
              rows={3}
              value={aiQuestion}
              onChange={(e) => setAiQuestion(e.target.value)}
              className="w-full rounded-xl border border-[var(--color-border-strong)] bg-[var(--color-surface)] p-2.5 text-xs"
            />
            <button
              type="button"
              onClick={handleAskExecutiveAi}
              disabled={aiLoading}
              className="mt-2.5 inline-flex items-center gap-2 rounded-xl bg-[#348CB2] hover:bg-[#236D91] px-4 py-2 font-bold text-white cursor-pointer"
            >
              <Sparkles className="h-3.5 w-3.5" />
              <span>
                {aiLoading ? 'Menganalisis...' : 'Buat Ringkasan Eksekutif AI'}
              </span>
            </button>
          </div>
          {aiAnswer && (
            <div className="rounded-xl border border-[#ADD8E6] bg-[#F3FAFC] dark:bg-[#172438] p-4 whitespace-pre-line leading-relaxed text-[var(--color-text-primary)]">
              {aiAnswer}
            </div>
          )}
        </div>
      ) : integration.category === 'api' ? (
        <div className="space-y-4 text-xs">
          <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] p-4 space-y-3">
            <div>
              <label className="block font-semibold mb-1">
                Tenant API Key (Server-to-Server)
              </label>
              <div className="flex items-center gap-1.5">
                <input
                  readOnly
                  type={showKey ? 'text' : 'password'}
                  value={apiKey}
                  className="flex-1 rounded-xl border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-3 py-2 font-mono text-[11px]"
                />
                <button
                  type="button"
                  onClick={() => setShowKey((s) => !s)}
                  className="rounded-xl border border-[var(--color-border-strong)] p-2 cursor-pointer"
                  aria-label="Lihat API Key"
                >
                  {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
                <button
                  type="button"
                  onClick={handleCopyKey}
                  className="inline-flex items-center gap-1 rounded-xl border border-[var(--color-border-strong)] px-2.5 py-2 font-semibold cursor-pointer"
                >
                  <Copy className="h-3.5 w-3.5" />
                  <span>{copiedKey ? 'Disalin' : 'Salin'}</span>
                </button>
                <button
                  type="button"
                  onClick={handleRegenerateKey}
                  className="rounded-xl border border-[var(--color-border-strong)] p-2 text-[#348CB2] cursor-pointer"
                  title="Buat ulang API Key"
                >
                  <RefreshCw className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div>
              <label className="block font-semibold mb-1">
                Endpoint Webhook URL
              </label>
              <input
                type="url"
                value={webhookUrl}
                onChange={(e) => setWebhookUrl(e.target.value)}
                className="w-full rounded-xl border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-3 py-2 font-mono text-[11px]"
              />
            </div>

            <div>
              <p className="font-semibold mb-1.5">Langganan Event Webhook</p>
              <div className="grid grid-cols-2 gap-2">
                {[
                  'order.created',
                  'order.updated',
                  'visit.checked_in',
                  'shift.started',
                ].map((ev) => (
                  <label
                    key={ev}
                    className="flex items-center gap-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-2.5 py-2 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={webhookEvents.includes(ev)}
                      onChange={() => toggleWebhookEvent(ev)}
                      className="h-3.5 w-3.5 accent-[#348CB2]"
                    />
                    <span className="font-mono text-[11px]">{ev}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          {savedFlag && (
            <p className="rounded-xl bg-[#ECFDF5] dark:bg-[#064E3B]/40 p-3 text-[#047857] dark:text-[#34D399]">
              Kredensial API & Webhook berhasil diperbarui.
            </p>
          )}

          <div className="flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={() => onToggleConnect(integration.id)}
              className="rounded-xl border border-[var(--color-border-strong)] px-4 py-2 font-semibold cursor-pointer"
            >
              {integration.connected ? 'Nonaktifkan API' : 'Aktifkan API'}
            </button>
            <button
              type="button"
              onClick={() => setSavedFlag(true)}
              className="rounded-xl bg-[#348CB2] hover:bg-[#236D91] px-4 py-2 font-bold text-white cursor-pointer"
            >
              Simpan Pengaturan
            </button>
          </div>
        </div>
      ) : integration.category === 'notifications' ? (
        <div className="space-y-4 text-xs">
          <div className="rounded-xl border border-[#ADD8E6] bg-[#F3FAFC] dark:bg-[#172438] p-4 space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bot className="h-4 w-4 text-[#348CB2]" />
                <span className="font-bold text-[#123A54] dark:text-white">
                  Integrasi Telegram Bot (@SalesXAiBot)
                </span>
              </div>
              <input
                type="checkbox"
                checked={telegramEnabled}
                onChange={(e) => setTelegramEnabled(e.target.checked)}
                className="h-4 w-4 accent-[#348CB2]"
              />
            </div>
            <p className="text-[var(--color-text-secondary)]">
              Hubungkan admin cabang atau sales untuk menerima ringkasan pagi,
              alert target harian, dan perintah cepat <code>/order_hari_ini</code>.
            </p>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={telegramCode}
                onChange={(e) => setTelegramCode(e.target.value)}
                className="flex-1 rounded-xl border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-3 py-2 font-mono text-[11px]"
              />
              <button
                type="button"
                onClick={() => setTelegramCode(`SX-${Math.random().toString(36).slice(2, 8).toUpperCase()}`)}
                className="rounded-xl border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-3 py-2 font-semibold cursor-pointer"
              >
                Perbarui Token
              </button>
            </div>
          </div>

          <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] p-3.5 space-y-2">
            <label className="flex items-center justify-between cursor-pointer">
              <span className="font-semibold">Notifikasi Email Ringkasan Harian</span>
              <input
                type="checkbox"
                checked={emailNotifEnabled}
                onChange={(e) => setEmailNotifEnabled(e.target.checked)}
                className="h-4 w-4 accent-[#348CB2]"
              />
            </label>
            <div className="flex items-center justify-between">
              <span className="text-[var(--color-text-muted)]">Jam Aktif Pengingat Tim</span>
              <span className="font-bold tabular-nums">08:00 – 17:00 WIB</span>
            </div>
          </div>

          {savedFlag && (
            <p className="rounded-xl bg-[#ECFDF5] dark:bg-[#064E3B]/40 p-3 text-[#047857] dark:text-[#34D399]">
              Preferensi kanal notifikasi & Telegram Bot berhasil disimpan.
            </p>
          )}

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setSavedFlag(true)}
              className="rounded-xl bg-[#348CB2] hover:bg-[#236D91] px-4 py-2 font-bold text-white cursor-pointer"
            >
              Simpan Pengaturan Notifikasi
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-4 text-xs">
          <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-semibold">Status Koneksi</span>
              <span
                className={`font-bold ${
                  integration.connected ? 'text-[#10B981]' : 'text-[#F97316]'
                }`}
              >
                {integration.connected ? 'Aktif Terhubung' : 'Dijeda'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="font-semibold">Sinkronisasi Terakhir</span>
              <span className="tabular-nums text-[var(--color-text-secondary)]">
                {integration.lastSync}
              </span>
            </div>
            <div>
              <label className="block font-semibold mb-1">
                Endpoint / Webhook URL
              </label>
              <input
                type="url"
                value={webhookUrl}
                onChange={(e) => setWebhookUrl(e.target.value)}
                className="w-full rounded-xl border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-3 py-2 font-mono text-[11px]"
              />
            </div>
          </div>

          {savedFlag && (
            <p className="rounded-xl bg-[#ECFDF5] dark:bg-[#064E3B]/40 p-3 text-[#047857] dark:text-[#34D399]">
              Konfigurasi {integration.title} berhasil diperbarui.
            </p>
          )}

          <div className="flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={() => onToggleConnect(integration.id)}
              className="rounded-xl border border-[var(--color-border-strong)] px-4 py-2 font-semibold cursor-pointer"
            >
              {integration.connected ? 'Nonaktifkan Sementara' : 'Aktifkan'}
            </button>
            <button
              type="button"
              onClick={() => setSavedFlag(true)}
              className="rounded-xl bg-[#348CB2] hover:bg-[#236D91] px-4 py-2 font-bold text-white cursor-pointer"
            >
              Simpan Pengaturan
            </button>
          </div>
        </div>
      )}
    </Modal>
  );
}

export function CompanyNotificationsModal({
  open,
  notifications,
  onMarkAllRead,
  onClose,
}: {
  open: boolean;
  notifications: NotificationItem[];
  onMarkAllRead: () => void;
  onClose: () => void;
}) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Notifikasi Perusahaan"
      subtitle="Pembaruan order cabang, status shift tim, dan sinkronisasi integrasi"
      maxWidthClass="max-w-md"
    >
      <div className="space-y-3 text-xs">
        <div className="flex justify-end">
          <button
            type="button"
            onClick={onMarkAllRead}
            className="font-semibold text-[#348CB2] hover:underline cursor-pointer"
          >
            Tandai semua dibaca
          </button>
        </div>
        <div className="space-y-2.5 max-h-[340px] overflow-y-auto pr-1">
          {notifications.map((n) => (
            <div
              key={n.id}
              className={`rounded-xl border p-3.5 ${
                n.read
                  ? 'border-[var(--color-border)] bg-[var(--color-background)]'
                  : 'border-[#348CB2]/40 bg-[#F3FAFC] dark:bg-[#172438]'
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <p className="font-bold text-[var(--color-text-primary)]">
                  {n.title}
                </p>
                <span className="text-[11px] text-[var(--color-text-muted)]">
                  {n.timeAgo}
                </span>
              </div>
              <p className="text-[var(--color-text-secondary)] mt-1">
                {n.detail}
              </p>
            </div>
          ))}
        </div>
      </div>
    </Modal>
  );
}

/* ============================================================================
 * 6. ATTENDANCE DETAIL, USER ASSIGNMENT, PRODUCT EDIT, TARGET & PROMO MODALS
 * ============================================================================ */
export function AttendanceDetailModal({
  record,
  onClose,
  onUpdateStatus,
}: {
  record: CompanyAttendanceItem | null;
  onClose: () => void;
  onUpdateStatus: (id: string, status: CompanyAttendanceItem['status']) => void;
}) {
  if (!record) return null;
  return (
    <Modal
      open={Boolean(record)}
      onClose={onClose}
      title={`Absensi Geofence: ${record.staffName}`}
      subtitle={`${record.role} · ${record.branchName}`}
      maxWidthClass="max-w-md"
    >
      <div className="space-y-4 text-xs">
        <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] p-4 space-y-2">
          <div className="flex justify-between">
            <span className="text-[var(--color-text-muted)]">Kantor / Zona Geofence</span>
            <span className="font-semibold">{record.officeName}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-[var(--color-text-muted)]">Jadwal Shift</span>
            <span className="font-semibold tabular-nums">{record.shiftTime}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-[var(--color-text-muted)]">Clock-in / Clock-out</span>
            <span className="font-bold tabular-nums">
              {record.clockInTime} / {record.clockOutTime}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-[var(--color-text-muted)]">Validasi Jarak GPS</span>
            <span className="font-bold text-[#348CB2] tabular-nums">
              {record.geofenceStatus}{' '}
              {record.distanceM > 0 ? `(± ${record.distanceM} m)` : ''}
            </span>
          </div>
        </div>

        <div className="rounded-xl border border-[var(--color-border)] p-3.5">
          <p className="font-semibold mb-1 flex items-center gap-1.5">
            <MapPin className="h-3.5 w-3.5 text-[#348CB2]" />
            <span>Catatan Absensi</span>
          </p>
          <p className="text-[var(--color-text-secondary)]">{record.notes}</p>
        </div>

        <div className="flex justify-between gap-2">
          <button
            type="button"
            onClick={() => {
              onUpdateStatus(record.id, 'Hadir');
              onClose();
            }}
            className="flex-1 rounded-xl bg-[#10B981] hover:bg-[#059669] py-2 font-bold text-white cursor-pointer"
          >
            Validasi Hadir
          </button>
          <button
            type="button"
            onClick={() => {
              onUpdateStatus(record.id, 'Terlambat');
              onClose();
            }}
            className="rounded-xl border border-[var(--color-border-strong)] px-4 py-2 font-semibold cursor-pointer"
          >
            Tandai Terlambat
          </button>
        </div>
      </div>
    </Modal>
  );
}

export function EditUserAssignmentModal({
  member,
  branches,
  onClose,
  onSave,
}: {
  member: TeamMemberItem | null;
  branches: BranchItem[];
  onClose: () => void;
  onSave: (updated: TeamMemberItem) => void;
}) {
  const [role, setRole] = useState<TeamMemberItem['role']>(
    member?.role || 'Sales Rep'
  );
  const [branchId, setBranchId] = useState(
    member?.branchId || branches[0]?.id || 'br-1'
  );
  const [area, setArea] = useState(member?.area || '');
  const [status, setStatus] = useState<TeamMemberItem['status']>(
    member?.status || 'Online'
  );

  if (!member) return null;

  return (
    <Modal
      open={Boolean(member)}
      onClose={onClose}
      title={`Penugasan & Peran: ${member.name}`}
      subtitle="Atur RBAC role, penempatan cabang, dan area kerja personel"
      maxWidthClass="max-w-md"
    >
      <form
        onSubmit={(e) => {
          e.preventDefault();
          onSave({
            ...member,
            role,
            branchId,
            area: area.trim() || member.area,
            status,
          });
          onClose();
        }}
        className="space-y-3.5 text-xs"
      >
        <div>
          <label className="block font-semibold mb-1">Peran RBAC</label>
          <select
            value={role}
            onChange={(e) => setRole(e.target.value as TeamMemberItem['role'])}
            className="w-full rounded-xl border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-3 py-2"
          >
            <option value="Direktur Operasional">Direktur Operasional</option>
            <option value="Area Manager">Area Manager</option>
            <option value="Supervisor">Supervisor</option>
            <option value="Sales Rep">Sales Rep</option>
          </select>
        </div>
        <div>
          <label className="block font-semibold mb-1">Cabang Penugasan</label>
          <select
            value={branchId}
            onChange={(e) => setBranchId(e.target.value)}
            className="w-full rounded-xl border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-3 py-2"
          >
            {branches.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name} ({b.city})
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block font-semibold mb-1">Wilayah / Teritori</label>
          <input
            type="text"
            value={area}
            onChange={(e) => setArea(e.target.value)}
            className="w-full rounded-xl border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-3.5 py-2"
          />
        </div>
        <div className="flex items-center justify-between rounded-xl border border-[var(--color-border)] p-3">
          <span className="font-semibold">Status Operasional</span>
          <button
            type="button"
            onClick={() => setStatus((s) => (s === 'Online' ? 'Offline' : 'Online'))}
            className={`rounded-lg px-3 py-1 font-bold cursor-pointer ${
              status === 'Online'
                ? 'bg-[#ECFDF5] text-[#047857]'
                : 'bg-[var(--color-surface-muted)] text-[var(--color-text-muted)]'
            }`}
          >
            {status}
          </button>
        </div>
        <button
          type="submit"
          className="w-full rounded-xl bg-[#348CB2] hover:bg-[#236D91] py-2.5 text-sm font-bold text-white cursor-pointer"
        >
          Simpan Penugasan
        </button>
      </form>
    </Modal>
  );
}

export function EditProductCompanyModal({
  product,
  onClose,
  onSave,
}: {
  product: Product | null;
  onClose: () => void;
  onSave: (updated: Product) => void;
}) {
  const [price, setPrice] = useState(String(product?.price || 5000));
  const [stock, setStock] = useState(String(product?.stock || 100));
  const [tag, setTag] = useState<Product['tag']>(product?.tag || 'Best Seller');
  const [promoPct, setPromoPct] = useState(
    String(product?.promoDiscountPct || 0)
  );

  if (!product) return null;

  return (
    <Modal
      open={Boolean(product)}
      onClose={onClose}
      title={`Kelola Produk: ${product.name}`}
      subtitle={`SKU ${product.sku} · Kategori ${product.category}`}
      maxWidthClass="max-w-md"
    >
      <form
        onSubmit={(e) => {
          e.preventDefault();
          onSave({
            ...product,
            price: Number(price) || product.price,
            stock: Math.max(0, Number(stock) || 0),
            tag,
            promoDiscountPct:
              Number(promoPct) > 0 ? Number(promoPct) : undefined,
          });
          onClose();
        }}
        className="space-y-3.5 text-xs"
      >
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block font-semibold mb-1">Harga Dasar (Rp)</label>
            <input
              type="number"
              min={500}
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              className="w-full rounded-xl border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-3 py-2 tabular-nums"
            />
          </div>
          <div>
            <label className="block font-semibold mb-1">Stok Gudang</label>
            <input
              type="number"
              min={0}
              value={stock}
              onChange={(e) => setStock(e.target.value)}
              className="w-full rounded-xl border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-3 py-2 tabular-nums"
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block font-semibold mb-1">Label Katalog</label>
            <select
              value={tag}
              onChange={(e) => setTag(e.target.value as Product['tag'])}
              className="w-full rounded-xl border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-3 py-2"
            >
              <option value="Best Seller">Best Seller</option>
              <option value="Promo">Promo</option>
              <option value="Baru">Baru</option>
            </select>
          </div>
          <div>
            <label className="block font-semibold mb-1">Diskon Promo (%)</label>
            <input
              type="number"
              min={0}
              max={60}
              value={promoPct}
              onChange={(e) => setPromoPct(e.target.value)}
              className="w-full rounded-xl border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-3 py-2 tabular-nums"
            />
          </div>
        </div>
        <button
          type="submit"
          className="w-full rounded-xl bg-[#348CB2] hover:bg-[#236D91] py-2.5 text-sm font-bold text-white cursor-pointer"
        >
          Simpan Harga & Stok SKU
        </button>
      </form>
    </Modal>
  );
}

export function SetTargetModal({
  open,
  companyTarget,
  branches,
  onClose,
  onSave,
}: {
  open: boolean;
  companyTarget: number;
  branches: BranchItem[];
  onClose: () => void;
  onSave: (newCompanyTarget: number, branchTargets: Record<string, number>) => void;
}) {
  const [draftTarget, setDraftTarget] = useState(String(companyTarget));
  const [draftBranches, setDraftBranches] = useState<Record<string, string>>(
    () =>
      Object.fromEntries(
        branches.map((b) => [b.id, String(b.monthlyTarget)])
      )
  );

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Atur Target Penjualan Bulanan"
      subtitle="Sesuaikan target order perusahaan dan kuota per cabang"
      maxWidthClass="max-w-md"
    >
      <form
        onSubmit={(e) => {
          e.preventDefault();
          const parsedBranches: Record<string, number> = {};
          for (const [k, v] of Object.entries(draftBranches)) {
            parsedBranches[k] = Number(v) || 100_000_000;
          }
          onSave(Number(draftTarget) || companyTarget, parsedBranches);
          onClose();
        }}
        className="space-y-4 text-xs"
      >
        <div>
          <label className="block font-semibold mb-1">
            Target Order Perusahaan (Rp / Bulan)
          </label>
          <input
            type="number"
            step={5000000}
            value={draftTarget}
            onChange={(e) => setDraftTarget(e.target.value)}
            className="w-full rounded-xl border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-3.5 py-2.5 font-bold tabular-nums"
          />
        </div>

        <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
          <p className="font-semibold text-[var(--color-text-muted)]">
            Alokasi Target per Cabang
          </p>
          {branches.map((b) => (
            <div
              key={b.id}
              className="flex items-center justify-between gap-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] p-2.5"
            >
              <span className="font-semibold truncate">{b.name}</span>
              <input
                type="number"
                step={5000000}
                value={draftBranches[b.id] || String(b.monthlyTarget)}
                onChange={(e) =>
                  setDraftBranches((prev) => ({
                    ...prev,
                    [b.id]: e.target.value,
                  }))
                }
                className="w-36 rounded-lg border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-2.5 py-1.5 text-right tabular-nums"
              />
            </div>
          ))}
        </div>

        <button
          type="submit"
          className="w-full rounded-xl bg-[#348CB2] hover:bg-[#236D91] py-2.5 text-sm font-bold text-white cursor-pointer"
        >
          Simpan Target & KPI
        </button>
      </form>
    </Modal>
  );
}

export function PromoDetailCompanyModal({
  promo,
  onClose,
  onToggleStatus,
}: {
  promo: PromotionItem | null;
  onClose: () => void;
  onToggleStatus: (id: string) => void;
}) {
  if (!promo) return null;
  return (
    <Modal
      open={Boolean(promo)}
      onClose={onClose}
      title={promo.title}
      subtitle={`${promo.type} · Berlaku s/d ${promo.validUntil}`}
      maxWidthClass="max-w-md"
    >
      <div className="space-y-4 text-xs">
        <div className="rounded-xl bg-[#FFF7ED] dark:bg-[#431407]/40 border border-[#F97316]/30 p-4 space-y-1">
          <p className="font-bold text-[#C2410C] dark:text-[#FB923C]">
            {promo.discountRule}
          </p>
          <p className="text-[var(--color-text-secondary)]">{promo.subtitle}</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-center">
          <div className="rounded-xl border border-[var(--color-border)] p-3">
            <p className="text-[11px] text-[var(--color-text-muted)]">Penukaran</p>
            <p className="text-base font-bold tabular-nums mt-0.5">184 Outlet</p>
          </div>
          <div className="rounded-xl border border-[var(--color-border)] p-3">
            <p className="text-[11px] text-[var(--color-text-muted)]">Uplift Order</p>
            <p className="text-base font-bold text-[#10B981] tabular-nums mt-0.5">+22,4%</p>
          </div>
          <div className="rounded-xl border border-[var(--color-border)] p-3">
            <p className="text-[11px] text-[var(--color-text-muted)]">Status</p>
            <p className="text-base font-bold text-[#348CB2] mt-0.5">{promo.status}</p>
          </div>
        </div>

        {promo.terms && (
          <ul className="space-y-1.5">
            {promo.terms.map((t) => (
              <li key={t} className="flex items-start gap-2">
                <Clock className="h-3.5 w-3.5 text-[#348CB2] shrink-0 mt-0.5" />
                <span>{t}</span>
              </li>
            ))}
          </ul>
        )}

        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={() => {
              onToggleStatus(promo.id);
              onClose();
            }}
            className="rounded-xl border border-[var(--color-border-strong)] px-4 py-2 font-semibold cursor-pointer"
          >
            {promo.status === 'Aktif' ? 'Nonaktifkan Promo' : 'Aktifkan Kembali'}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl bg-[#348CB2] px-4 py-2 font-bold text-white cursor-pointer"
          >
            Tutup
          </button>
        </div>
      </div>
    </Modal>
  );
}
