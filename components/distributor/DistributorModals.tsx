'use client';

import React, { useState } from 'react';
import {
  CheckCircle2,
  Download,
  Bell,
  Package,
  Truck,
  UserPlus,
  Store,
  Sparkles,
  FileSpreadsheet,
  ArrowRight,
  Clock,
  MapPin,
  Building2,
  ShieldCheck,
  SlidersHorizontal,
  Megaphone,
  AlertTriangle,
  RefreshCw,
} from 'lucide-react';
import { Modal } from '@/components/common/Modal';
import { StatusTag } from '@/components/design-system/StatusTag';
import { formatRupiah, type NotificationItem } from '@/lib/salesx-data';
import type {
  DistributorInventoryItem,
  StockMovementRecord,
  DistributorOrderProcess,
  DistributorFulfillmentRecord,
  DistributorOutletRecord,
  DistributorSalesRep,
  DistributorPromoCampaign,
} from '@/lib/salesx-portals-data';

/* 1. Daftar Distributor Modal (dari layar Login) */
export function DaftarDistributorModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [companyName, setCompanyName] = useState('');
  const [city, setCity] = useState('Kota Bogor');
  const [picName, setPicName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyName.trim() || !picName.trim() || !email.trim()) return;
    setSubmitted(true);
  };

  return (
    <Modal
      open={open}
      onClose={() => {
        setSubmitted(false);
        onClose();
      }}
      title="Daftar Akun Distributor"
      subtitle="Registrasi mitra distributor resmi ekosistem SalesX-Ai"
    >
      {submitted ? (
        <div className="space-y-4 text-xs sm:text-sm">
          <div className="rounded-xl bg-[#ECFDF5] dark:bg-[#064E3B]/40 p-4 text-[#047857] dark:text-[#34D399] flex items-start gap-2.5">
            <CheckCircle2 className="h-5 w-5 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">Pengajuan Kemitraan Diterima</p>
              <p className="mt-1">
                Tim Principal & Enterprise akan memverifikasi{' '}
                <strong>{companyName}</strong> ({city}) dan mengirimkan aktivasi
                portal ke <strong>{email}</strong>.
              </p>
            </div>
          </div>
          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => {
                setSubmitted(false);
                onClose();
              }}
              className="rounded-xl bg-[#194F70] px-4 py-2 text-xs font-bold text-white cursor-pointer"
            >
              Selesai
            </button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-3 text-xs sm:text-sm">
          <div>
            <label className="block font-semibold mb-1">Nama Badan Usaha</label>
            <input
              required
              type="text"
              placeholder="Contoh: PT Karya Niaga Sentosa"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              className="w-full rounded-xl border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-3.5 py-2.5"
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold mb-1">Wilayah Operasi</label>
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full rounded-xl border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-3.5 py-2.5"
              />
            </div>
            <div>
              <label className="block font-semibold mb-1">Nama PIC</label>
              <input
                required
                type="text"
                placeholder="Nama penanggung jawab"
                value={picName}
                onChange={(e) => setPicName(e.target.value)}
                className="w-full rounded-xl border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-3.5 py-2.5"
              />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold mb-1">No. HP / WhatsApp</label>
              <input
                required
                type="tel"
                placeholder="0812-xxxx-xxxx"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full rounded-xl border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-3.5 py-2.5"
              />
            </div>
            <div>
              <label className="block font-semibold mb-1">Email Bisnis</label>
              <input
                required
                type="email"
                placeholder="pic@perusahaan.co.id"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
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
              className="rounded-xl bg-[#194F70] hover:bg-[#123A54] px-4 py-2 text-xs font-bold text-white cursor-pointer"
            >
              Ajukan Pendaftaran
            </button>
          </div>
        </form>
      )}
    </Modal>
  );
}

/* 2. Stock Detail & Quick Adjust Modal */
export function StockDetailModal({
  item,
  onClose,
  onAdjustStock,
  onRequestRestock,
}: {
  item: DistributorInventoryItem | null;
  onClose: () => void;
  onAdjustStock: (sku: string, delta: number, notes: string) => void;
  onRequestRestock?: (item: DistributorInventoryItem) => void;
}) {
  const [deltaStr, setDeltaStr] = useState('100');
  const [mode, setMode] = useState<'in' | 'out'>('in');
  const [notes, setNotes] = useState('Penambahan stok dari pengiriman Principal');

  if (!item) return null;

  const handleApply = (e: React.FormEvent) => {
    e.preventDefault();
    const raw = Math.abs(parseInt(deltaStr, 10) || 0);
    if (raw <= 0) return;
    onAdjustStock(item.sku, mode === 'in' ? raw : -raw, notes);
    onClose();
  };

  return (
    <Modal
      open={!!item}
      onClose={onClose}
      title={item.name}
      subtitle={`${item.sku} · ${item.warehouse}`}
    >
      <form onSubmit={handleApply} className="space-y-4 text-xs sm:text-sm">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] p-3.5">
          <div>
            <p className="text-[11px] text-[var(--color-text-muted)]">Stok Saat Ini</p>
            <p className="text-base font-bold font-mono tabular-nums mt-0.5">
              {item.stock.toLocaleString('id-ID')} {item.unit}
            </p>
          </div>
          <div>
            <p className="text-[11px] text-[var(--color-text-muted)]">Batas Minimum</p>
            <p className="text-base font-bold font-mono tabular-nums mt-0.5">
              {item.minStock.toLocaleString('id-ID')} {item.unit}
            </p>
          </div>
          <div>
            <p className="text-[11px] text-[var(--color-text-muted)]">Harga Satuan</p>
            <p className="text-base font-bold font-mono tabular-nums mt-0.5">
              {formatRupiah(item.price)}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 rounded-xl bg-[var(--color-surface-muted)] p-1 text-xs font-semibold">
          <button
            type="button"
            onClick={() => {
              setMode('in');
              setNotes('Stok masuk dari Principal');
            }}
            className={`rounded-lg py-2 cursor-pointer ${
              mode === 'in' ? 'bg-[#194F70] text-white' : 'text-[var(--color-text-secondary)]'
            }`}
          >
            + Stok Masuk
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('out');
              setNotes('Koreksi stok keluar / rusak');
            }}
            className={`rounded-lg py-2 cursor-pointer ${
              mode === 'out' ? 'bg-[#194F70] text-white' : 'text-[var(--color-text-secondary)]'
            }`}
          >
            - Penyesuaian Keluar
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block font-semibold mb-1">Jumlah ({item.unit})</label>
            <input
              type="number"
              min={1}
              value={deltaStr}
              onChange={(e) => setDeltaStr(e.target.value)}
              className="w-full rounded-xl border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-3.5 py-2 font-mono tabular-nums"
            />
          </div>
          <div>
            <label className="block font-semibold mb-1">Keterangan</label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full rounded-xl border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-3.5 py-2"
            />
          </div>
        </div>

        <div className="flex flex-wrap justify-between gap-2 pt-2">
          {onRequestRestock && item.stock <= item.minStock ? (
            <button
              type="button"
              onClick={() => {
                const target = item;
                onClose();
                onRequestRestock(target);
              }}
              className="inline-flex items-center gap-1.5 rounded-xl border border-[#348CB2] bg-[#F3FAFC] dark:bg-[#19394B] px-3.5 py-2 text-xs font-bold text-[#194F70] dark:text-[#87CEEB] cursor-pointer"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              <span>Order Restock ke Principal</span>
            </button>
          ) : (
            <span />
          )}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-[var(--color-border)] px-4 py-2 text-xs font-semibold cursor-pointer"
            >
              Tutup
            </button>
            <button
              type="submit"
              className="rounded-xl bg-[#194F70] hover:bg-[#123A54] px-4 py-2 text-xs font-bold text-white cursor-pointer"
            >
              Simpan Pergerakan Stok
            </button>
          </div>
        </div>
      </form>
    </Modal>
  );
}

/* 3. Create Stock Movement Modal */
export function CreateStockMovementModal({
  open,
  onClose,
  inventory,
  onCreateMovement,
}: {
  open: boolean;
  onClose: () => void;
  inventory: DistributorInventoryItem[];
  onCreateMovement: (rec: Omit<StockMovementRecord, 'id' | 'dateLabel'>) => void;
}) {
  const [type, setType] = useState<StockMovementRecord['type']>('Stok Masuk');
  const [sku, setSku] = useState(inventory[0]?.sku || 'SX-MNM-001');
  const [qty, setQty] = useState('250');
  const [notes, setNotes] = useState('Penerimaan barang PO rutin');

  const selectedProd = inventory.find((i) => i.sku === sku) || inventory[0];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProd) return;
    const absQty = Math.max(1, parseInt(qty, 10) || 1);
    onCreateMovement({
      type,
      sku: selectedProd.sku,
      productName: selectedProd.name,
      qtyDelta: type === 'Stok Keluar' ? -absQty : absQty,
      unit: selectedProd.unit,
      status: 'Baru',
      warehouse: selectedProd.warehouse,
      notes,
    });
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Catat Pergerakan Stok Baru"
      subtitle="Penerimaan barang masuk, pengeluaran gudang, atau stock opname"
    >
      <form onSubmit={handleSubmit} className="space-y-3 text-xs sm:text-sm">
        <div>
          <label className="block font-semibold mb-1">Jenis Pergerakan</label>
          <select
            value={type}
            onChange={(e) => setType(e.target.value as StockMovementRecord['type'])}
            className="w-full rounded-xl border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-3.5 py-2.5"
          >
            <option value="Stok Masuk">Stok Masuk (Inbound PO)</option>
            <option value="Stok Keluar">Stok Keluar (Outbound SO)</option>
            <option value="Penyesuaian Stok">Penyesuaian Stok (Adjustment)</option>
          </select>
        </div>
        <div>
          <label className="block font-semibold mb-1">Pilih SKU Produk</label>
          <select
            value={sku}
            onChange={(e) => setSku(e.target.value)}
            className="w-full rounded-xl border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-3.5 py-2.5"
          >
            {inventory.map((i) => (
              <option key={i.sku} value={i.sku}>
                {i.sku} — {i.name} ({i.warehouse})
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block font-semibold mb-1">
            Jumlah ({selectedProd?.unit || 'unit'})
          </label>
          <input
            type="number"
            min={1}
            value={qty}
            onChange={(e) => setQty(e.target.value)}
            className="w-full rounded-xl border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-3.5 py-2.5 font-mono tabular-nums"
          />
        </div>
        <div>
          <label className="block font-semibold mb-1">Catatan</label>
          <textarea
            rows={2}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full rounded-xl border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-3.5 py-2"
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
            className="rounded-xl bg-[#194F70] hover:bg-[#123A54] px-4 py-2 text-xs font-bold text-white cursor-pointer"
          >
            Simpan Transaksi
          </button>
        </div>
      </form>
    </Modal>
  );
}

/* 4. Create Shipment / Fulfillment Modal */
export function CreateShipmentModal({
  open,
  onClose,
  orders,
  onCreateShipment,
}: {
  open: boolean;
  onClose: () => void;
  orders: DistributorOrderProcess[];
  onCreateShipment: (payload: {
    orderId: string;
    driverName: string;
    vehiclePlate: string;
    etaLabel: string;
  }) => void;
}) {
  const [orderId, setOrderId] = useState(orders[0]?.id || 'ORD-20250724-001');
  const [driverName, setDriverName] = useState('Armada Box F 8899 GH');
  const [vehiclePlate, setVehiclePlate] = useState('F 8899 GH');
  const [etaLabel, setEtaLabel] = useState('Estimasi: Hari ini, 16:30 WIB');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onCreateShipment({ orderId, driverName, vehiclePlate, etaLabel });
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Buat Pengiriman Baru (Fulfillment)"
      subtitle="Tetapkan armada pengantaran untuk order yang sudah siap kirim"
    >
      <form onSubmit={handleSubmit} className="space-y-3 text-xs sm:text-sm">
        <div>
          <label className="block font-semibold mb-1">Order Terkait</label>
          <select
            value={orderId}
            onChange={(e) => setOrderId(e.target.value)}
            className="w-full rounded-xl border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-3.5 py-2.5"
          >
            {orders.map((o) => (
              <option key={o.id} value={o.id}>
                {o.id} — {o.outletName} ({formatRupiah(o.total)})
              </option>
            ))}
          </select>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block font-semibold mb-1">Armada / Pengemudi</label>
            <input
              required
              type="text"
              value={driverName}
              onChange={(e) => setDriverName(e.target.value)}
              className="w-full rounded-xl border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-3.5 py-2.5"
            />
          </div>
          <div>
            <label className="block font-semibold mb-1">Plat Nomor</label>
            <input
              required
              type="text"
              value={vehiclePlate}
              onChange={(e) => setVehiclePlate(e.target.value)}
              className="w-full rounded-xl border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-3.5 py-2.5 font-mono"
            />
          </div>
        </div>
        <div>
          <label className="block font-semibold mb-1">Estimasi Tiba (ETA)</label>
          <input
            type="text"
            value={etaLabel}
            onChange={(e) => setEtaLabel(e.target.value)}
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
            className="inline-flex items-center gap-1.5 rounded-xl bg-[#194F70] hover:bg-[#123A54] px-4 py-2 text-xs font-bold text-white cursor-pointer"
          >
            <Truck className="h-3.5 w-3.5" />
            <span>Terbitkan Surat Jalan</span>
          </button>
        </div>
      </form>
    </Modal>
  );
}

/* 5. Add Outlet Distributor Modal */
export function AddOutletDistributorModal({
  open,
  onClose,
  onAddOutlet,
}: {
  open: boolean;
  onClose: () => void;
  onAddOutlet: (outlet: DistributorOutletRecord) => void;
}) {
  const [name, setName] = useState('');
  const [city, setCity] = useState('Kota Bogor');
  const [address, setAddress] = useState('');
  const [picName, setPicName] = useState('');
  const [phone, setPhone] = useState('');
  const [tier, setTier] = useState<'Prioritas' | 'Reguler'>('Prioritas');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onAddOutlet({
      id: `do-${Date.now()}`,
      name: name.trim(),
      city,
      address: address.trim() || `Jl. Raya ${city}`,
      distanceKm: 3.8,
      isPriority: tier === 'Prioritas',
      visitToday: true,
      status: 'Aktif',
      tier,
      covered: true,
      category: 'General Trade',
      picName: picName.trim() || 'Pemilik Toko',
      phone: phone.trim() || '0812-0000-1111',
      email: 'outlet@example.com',
      lat: -6.597 + (Math.random() - 0.5) * 0.03,
      lng: 106.806 + (Math.random() - 0.5) * 0.03,
      lastOrderTotal: 0,
      lastVisitDate: 'Hari ini',
    });
    setName('');
    setAddress('');
    setPicName('');
    setPhone('');
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Tambah Outlet Jaringan"
      subtitle="Daftarkan toko retail/grosir baru ke dalam cakupan distributor"
    >
      <form onSubmit={handleSubmit} className="space-y-3 text-xs sm:text-sm">
        <div>
          <label className="block font-semibold mb-1">Nama Outlet / Toko</label>
          <input
            required
            type="text"
            placeholder="Contoh: Toko Barokah Jaya"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-xl border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-3.5 py-2.5"
          />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block font-semibold mb-1">Kota / Wilayah</label>
            <input
              type="text"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className="w-full rounded-xl border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-3.5 py-2.5"
            />
          </div>
          <div>
            <label className="block font-semibold mb-1">Kategori Tier</label>
            <select
              value={tier}
              onChange={(e) => setTier(e.target.value as 'Prioritas' | 'Reguler')}
              className="w-full rounded-xl border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-3.5 py-2.5"
            >
              <option value="Prioritas">Prioritas</option>
              <option value="Reguler">Reguler</option>
            </select>
          </div>
        </div>
        <div>
          <label className="block font-semibold mb-1">Alamat Lengkap</label>
          <input
            type="text"
            placeholder="Jl. ..."
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            className="w-full rounded-xl border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-3.5 py-2.5"
          />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block font-semibold mb-1">Nama PIC</label>
            <input
              type="text"
              value={picName}
              onChange={(e) => setPicName(e.target.value)}
              className="w-full rounded-xl border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-3.5 py-2.5"
            />
          </div>
          <div>
            <label className="block font-semibold mb-1">No. Telepon</label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
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
            className="inline-flex items-center gap-1.5 rounded-xl bg-[#194F70] hover:bg-[#123A54] px-4 py-2 text-xs font-bold text-white cursor-pointer"
          >
            <Store className="h-3.5 w-3.5" />
            <span>Simpan Outlet</span>
          </button>
        </div>
      </form>
    </Modal>
  );
}

/* 6. Add Sales Team Member Modal */
export function AddSalesTeamModal({
  open,
  onClose,
  onAddRep,
}: {
  open: boolean;
  onClose: () => void;
  onAddRep: (rep: DistributorSalesRep) => void;
}) {
  const [name, setName] = useState('');
  const [area, setArea] = useState('Area Bogor');
  const [phone, setPhone] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onAddRep({
      id: `dsr-${Date.now()}`,
      name: name.trim(),
      area,
      status: 'Aktif',
      phone: phone.trim() || '0812-5555-7777',
      outletsHandled: 15,
      monthlyOrderTotal: 0,
      visitsCompleted: 0,
      targetVisits: 20,
    });
    setName('');
    setPhone('');
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Tambah Anggota Tim Sales"
      subtitle="Tambahkan sales distributor beserta area penugasannya"
    >
      <form onSubmit={handleSubmit} className="space-y-3 text-xs sm:text-sm">
        <div>
          <label className="block font-semibold mb-1">Nama Lengkap Sales</label>
          <input
            required
            type="text"
            placeholder="Contoh: Hendra Kurniawan"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-xl border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-3.5 py-2.5"
          />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block font-semibold mb-1">Area Penugasan</label>
            <select
              value={area}
              onChange={(e) => setArea(e.target.value)}
              className="w-full rounded-xl border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-3.5 py-2.5"
            >
              <option value="Area Bogor">Area Bogor</option>
              <option value="Area Depok">Area Depok</option>
              <option value="Area Tangerang">Area Tangerang</option>
              <option value="Area Bekasi">Area Bekasi</option>
            </select>
          </div>
          <div>
            <label className="block font-semibold mb-1">No. WhatsApp</label>
            <input
              type="tel"
              placeholder="0812-xxxx-xxxx"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
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
            className="inline-flex items-center gap-1.5 rounded-xl bg-[#194F70] hover:bg-[#123A54] px-4 py-2 text-xs font-bold text-white cursor-pointer"
          >
            <UserPlus className="h-3.5 w-3.5" />
            <span>Tambah Sales</span>
          </button>
        </div>
      </form>
    </Modal>
  );
}

/* 7. Create Promo / Campaign Modal */
export function CreatePromoDistributorModal({
  open,
  onClose,
  onAddPromo,
}: {
  open: boolean;
  onClose: () => void;
  onAddPromo: (promo: DistributorPromoCampaign) => void;
}) {
  const [title, setTitle] = useState('');
  const [kind, setKind] = useState<'Program' | 'Campaign'>('Program');
  const [period, setPeriod] = useState('1–30 Nov 2026');
  const [discountRule, setDiscountRule] = useState('Diskon 15% min. pembelian 10 dus');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    onAddPromo({
      id: `dpromo-${Date.now()}`,
      title: title.trim(),
      period,
      kind,
      status: 'Aktif',
      discountRule,
      targetSku: 'SX-MNM-001',
      description: 'Program promosi baru diterbitkan dari Distributor Portal.',
    });
    setTitle('');
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Buat Program Promosi / Campaign"
      subtitle="Terbitkan program insentif outlet untuk mendorong volume order"
    >
      <form onSubmit={handleSubmit} className="space-y-3 text-xs sm:text-sm">
        <div>
          <label className="block font-semibold mb-1">Judul Program</label>
          <input
            required
            type="text"
            placeholder="Contoh: Cashback Akhir Bulan 10%"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full rounded-xl border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-3.5 py-2.5"
          />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block font-semibold mb-1">Jenis</label>
            <select
              value={kind}
              onChange={(e) => setKind(e.target.value as 'Program' | 'Campaign')}
              className="w-full rounded-xl border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-3.5 py-2.5"
            >
              <option value="Program">Program Diskon</option>
              <option value="Campaign">Campaign Display</option>
            </select>
          </div>
          <div>
            <label className="block font-semibold mb-1">Periode Berlaku</label>
            <input
              type="text"
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              className="w-full rounded-xl border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-3.5 py-2.5"
            />
          </div>
        </div>
        <div>
          <label className="block font-semibold mb-1">Aturan Diskon / Benefit</label>
          <input
            type="text"
            value={discountRule}
            onChange={(e) => setDiscountRule(e.target.value)}
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
            className="inline-flex items-center gap-1.5 rounded-xl bg-[#194F70] hover:bg-[#123A54] px-4 py-2 text-xs font-bold text-white cursor-pointer"
          >
            <Sparkles className="h-3.5 w-3.5" />
            <span>Aktifkan Promosi</span>
          </button>
        </div>
      </form>
    </Modal>
  );
}

/* 8. Distributor Report Preview & CSV Download Modal */
export function DistributorReportModal({
  report,
  onClose,
}: {
  report: { title: string; subtitle: string; metric: string } | null;
  onClose: () => void;
}) {
  if (!report) return null;

  const handleDownloadCsv = () => {
    const csvContent = [
      'Laporan,Metrik Utama,Periode,Distributor',
      `"${report.title}","${report.metric}","Jul 2025","PT Maju Distribusi (DIST-0001)"`,
      '"Area Bogor","Rp 248.400.000","Jul 2025","412 outlet"',
      '"Area Depok","Rp 164.200.000","Jul 2025","265 outlet"',
      '"Area Tangerang","Rp 122.100.000","Jul 2025","198 outlet"',
      '"Area Bekasi","Rp 91.100.000","Jul 2025","170 outlet"',
    ].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${report.title.toLowerCase().replace(/\s+/g, '-')}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Modal
      open={!!report}
      onClose={onClose}
      title={report.title}
      subtitle={`${report.subtitle} · Ringkasan Real-Time`}
    >
      <div className="space-y-4 text-xs sm:text-sm">
        <div className="rounded-xl border border-[#ADD8E6] bg-[#F3FAFC] dark:bg-[#172438] p-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-[11px] text-[var(--color-text-muted)]">Capaian Utama</p>
            <p className="text-xl font-bold font-mono tabular-nums text-[#123A54] dark:text-white">
              {report.metric}
            </p>
          </div>
          <FileSpreadsheet className="h-8 w-8 text-[#348CB2]" />
        </div>
        <div className="overflow-x-auto rounded-xl border border-[var(--color-border)]">
          <table className="w-full text-left text-xs">
            <thead className="bg-[var(--color-surface-muted)] text-[var(--color-text-secondary)]">
              <tr>
                <th className="px-3 py-2.5">Wilayah</th>
                <th className="px-3 py-2.5">Realisasi</th>
                <th className="px-3 py-2.5">SLA</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-border)] font-mono tabular-nums">
              <tr>
                <td className="px-3 py-2 font-sans font-semibold">Area Bogor</td>
                <td className="px-3 py-2">Rp 248.400.000</td>
                <td className="px-3 py-2 text-[#047857]">97,8%</td>
              </tr>
              <tr>
                <td className="px-3 py-2 font-sans font-semibold">Area Depok</td>
                <td className="px-3 py-2">Rp 164.200.000</td>
                <td className="px-3 py-2 text-[#047857]">96,1%</td>
              </tr>
              <tr>
                <td className="px-3 py-2 font-sans font-semibold">Area Tangerang</td>
                <td className="px-3 py-2">Rp 122.100.000</td>
                <td className="px-3 py-2 text-[#047857]">95,4%</td>
              </tr>
            </tbody>
          </table>
        </div>
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-[var(--color-border)] px-4 py-2 text-xs font-semibold cursor-pointer"
          >
            Tutup
          </button>
          <button
            type="button"
            onClick={handleDownloadCsv}
            className="inline-flex items-center gap-1.5 rounded-xl bg-[#194F70] hover:bg-[#123A54] px-4 py-2 text-xs font-bold text-white cursor-pointer"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Unduh CSV</span>
          </button>
        </div>
      </div>
    </Modal>
  );
}

/* 9. Fulfillment Delivery Timeline Modal */
export function FulfillmentDetailModal({
  fulfillment,
  onClose,
  onAdvanceStatus,
}: {
  fulfillment: DistributorFulfillmentRecord | null;
  onClose: () => void;
  onAdvanceStatus: (id: string) => void;
}) {
  if (!fulfillment) return null;

  return (
    <Modal
      open={!!fulfillment}
      onClose={onClose}
      title={`Status Pengiriman — ${fulfillment.id}`}
      subtitle={`${fulfillment.outletName} · ${formatRupiah(fulfillment.total)}`}
    >
      <div className="space-y-4 text-xs sm:text-sm">
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] p-3.5">
          <div>
            <p className="font-bold">{fulfillment.driverName}</p>
            <p className="text-[11px] text-[var(--color-text-secondary)]">
              {fulfillment.etaLabel}
            </p>
          </div>
          <StatusTag label={fulfillment.status} showIcon />
        </div>

        <div className="space-y-3 pl-1">
          {fulfillment.timeline.map((step, idx) => (
            <div key={step.title} className="flex items-start gap-3">
              <div className="flex flex-col items-center">
                <div
                  className={`flex h-7 w-7 items-center justify-center rounded-full ${
                    step.state === 'done'
                      ? 'bg-[#10B981] text-white'
                      : step.state === 'active'
                        ? 'bg-[#348CB2] text-white'
                        : 'bg-[var(--color-surface-muted)] text-[var(--color-text-muted)]'
                  }`}
                >
                  {step.state === 'done' ? (
                    <CheckCircle2 className="h-4 w-4" />
                  ) : step.state === 'active' ? (
                    <Truck className="h-4 w-4" />
                  ) : (
                    <Clock className="h-3.5 w-3.5" />
                  )}
                </div>
                {idx < fulfillment.timeline.length - 1 && (
                  <div className="h-6 w-0.5 bg-[var(--color-border)] my-0.5" />
                )}
              </div>
              <div className="pt-0.5">
                <p className="font-bold text-[var(--color-text-primary)]">{step.title}</p>
                <p className="text-[11px] text-[var(--color-text-muted)] font-mono">
                  {step.timestamp}
                </p>
              </div>
            </div>
          ))}
        </div>

        <div className="flex justify-end gap-2 pt-2 border-t border-[var(--color-border)]">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-[var(--color-border)] px-4 py-2 text-xs font-semibold cursor-pointer"
          >
            Tutup
          </button>
          {fulfillment.status !== 'Selesai' && (
            <button
              type="button"
              onClick={() => {
                onAdvanceStatus(fulfillment.id);
                onClose();
              }}
              className="inline-flex items-center gap-1.5 rounded-xl bg-[#194F70] hover:bg-[#123A54] px-4 py-2 text-xs font-bold text-white cursor-pointer"
            >
              <span>Perbarui Status Pengiriman</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>
    </Modal>
  );
}

/* 10. Notifications Modal */
export function DistributorNotificationsModal({
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
      title="Notifikasi Distributor"
      subtitle="Pembaruan order masuk, stok menipis, dan SLA pengiriman"
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
        <div className="space-y-2 max-h-[340px] overflow-y-auto">
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

/* 11. Coverage Management Modal */
export function CoverageManageModal({
  open,
  onClose,
  outlets,
  onToggleCovered,
}: {
  open: boolean;
  onClose: () => void;
  outlets: DistributorOutletRecord[];
  onToggleCovered: (id: string) => void;
}) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Kelola Cakupan Wilayah Outlet"
      subtitle="Tetapkan status cakupan distribusi aktif untuk tiap outlet di wilayah"
    >
      <div className="space-y-2.5 text-xs sm:text-sm max-h-[380px] overflow-y-auto">
        {outlets.map((o) => (
          <div
            key={o.id}
            className="flex items-center justify-between gap-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-3"
          >
            <div className="min-w-0">
              <p className="font-bold truncate">{o.name}</p>
              <p className="text-[11px] text-[var(--color-text-muted)] truncate">
                {o.city} · {o.address}
              </p>
            </div>
            <button
              type="button"
              onClick={() => onToggleCovered(o.id)}
              className={`rounded-lg px-3 py-1.5 text-[11px] font-bold cursor-pointer shrink-0 ${
                o.covered
                  ? 'bg-[#ECFDF5] text-[#047857] border border-[#A7F3D0]'
                  : 'bg-amber-50 text-amber-800 border border-amber-200'
              }`}
            >
              {o.covered ? 'Tercakup' : 'Belum Tercakup'}
            </button>
          </div>
        ))}
      </div>
    </Modal>
  );
}

/* 12. Order Process Detail Modal */
export function OrderProcessDetailModal({
  order,
  onClose,
  onAdvanceStep,
  onMarkReturn,
}: {
  order: DistributorOrderProcess | null;
  onClose: () => void;
  onAdvanceStep: (orderId: string) => void;
  onMarkReturn?: (orderId: string, reason: string) => void;
}) {
  const [returnReason, setReturnReason] = useState('');
  const [confirmReturn, setConfirmReturn] = useState(false);

  if (!order) return null;

  const handleDownloadPickingList = () => {
    const csv = [
      'ID Order,Outlet,Kota,Gudang,Ringkasan Item,Total Nilai,Progress (%)',
      `"${order.id}","${order.outletName}","${order.city}","${order.warehouse}","${order.itemsSummary}",${order.total},${order.progressPct}`,
    ].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `picking-list-${order.id}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Modal
      open={!!order}
      onClose={() => {
        setConfirmReturn(false);
        onClose();
      }}
      title={`Detail Pemrosesan ${order.id}`}
      subtitle={`${order.outletName} (${order.city}) · ${order.warehouse}`}
    >
      <div className="space-y-4 text-xs sm:text-sm">
        <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] p-3.5 space-y-1">
          <p className="font-semibold text-[var(--color-text-secondary)]">Rincian Item</p>
          <p className="font-bold text-[var(--color-text-primary)]">{order.itemsSummary}</p>
          <p className="font-mono font-bold text-[#194F70] dark:text-[#87CEEB] pt-1">
            Total Nilai: {formatRupiah(order.total)}
          </p>
        </div>

        {confirmReturn && onMarkReturn && (
          <div className="rounded-xl border border-amber-300 bg-amber-50 dark:bg-amber-950/30 p-3.5 space-y-2">
            <p className="font-bold text-amber-900 dark:text-amber-300 flex items-center gap-1.5">
              <AlertTriangle className="h-4 w-4" />
              <span>Konfirmasi Retur / Pembatalan Order</span>
            </p>
            <input
              type="text"
              placeholder="Alasan retur/tolak (cth: Stok tidak mencukupi / Outlet reschedule)"
              value={returnReason}
              onChange={(e) => setReturnReason(e.target.value)}
              className="w-full rounded-xl border border-amber-300 bg-white dark:bg-[#111C2D] px-3 py-2 text-xs"
            />
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setConfirmReturn(false)}
                className="rounded-lg border border-[var(--color-border)] px-3 py-1.5 text-xs font-semibold cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => {
                  onMarkReturn(order.id, returnReason.trim() || 'Retur dijadwalkan ulang');
                  setConfirmReturn(false);
                  setReturnReason('');
                  onClose();
                }}
                className="rounded-lg bg-red-600 hover:bg-red-700 px-3 py-1.5 text-xs font-bold text-white cursor-pointer"
              >
                Konfirmasi Retur
              </button>
            </div>
          </div>
        )}

        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-[var(--color-border)]">
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleDownloadPickingList}
              className="inline-flex items-center gap-1.5 rounded-xl border border-[var(--color-border-strong)] px-3 py-2 text-xs font-semibold cursor-pointer"
            >
              <Download className="h-3.5 w-3.5" />
              <span>Picking List</span>
            </button>
            {onMarkReturn && !confirmReturn && (
              <button
                type="button"
                onClick={() => setConfirmReturn(true)}
                className="rounded-xl border border-red-200 text-red-600 hover:bg-red-50 dark:border-red-900/60 dark:text-red-400 px-3 py-2 text-xs font-semibold cursor-pointer"
              >
                Retur / Tolak
              </button>
            )}
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-[var(--color-border)] px-4 py-2 text-xs font-semibold cursor-pointer"
            >
              Tutup
            </button>
            {order.currentStep < 4 && (
              <button
                type="button"
                onClick={() => {
                  onAdvanceStep(order.id);
                  onClose();
                }}
                className="inline-flex items-center gap-1.5 rounded-xl bg-[#194F70] px-4 py-2 text-xs font-bold text-white cursor-pointer"
              >
                <Package className="h-3.5 w-3.5" />
                <span>Lanjutkan Tahap Berikutnya</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
}

/* 13. Stock Replenish PO to Principal Modal */
export function StockReplenishOrderModal({
  item,
  onClose,
  onSubmitReplenish,
}: {
  item: DistributorInventoryItem | null;
  onClose: () => void;
  onSubmitReplenish: (sku: string, qty: number, warehouse: string, notes: string) => void;
}) {
  const [qtyStr, setQtyStr] = useState('300');
  const [warehouse, setWarehouse] = useState(item?.warehouse || 'Gudang Utama');
  const [notes, setNotes] = useState('Permintaan PO restock prioritas ke Principal');

  if (!item) return null;
  const qty = Math.max(10, parseInt(qtyStr, 10) || 0);
  const estTotal = qty * item.price;

  return (
    <Modal
      open={!!item}
      onClose={onClose}
      title={`Buat PO Restock — ${item.sku}`}
      subtitle={`${item.name} · Estimasi Total ${formatRupiah(estTotal)}`}
    >
      <form
        onSubmit={(e) => {
          e.preventDefault();
          onSubmitReplenish(item.sku, qty, warehouse, notes);
          onClose();
        }}
        className="space-y-3.5 text-xs sm:text-sm"
      >
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block font-semibold mb-1">Jumlah Order ({item.unit})</label>
            <input
              type="number"
              min={10}
              value={qtyStr}
              onChange={(e) => setQtyStr(e.target.value)}
              className="w-full rounded-xl border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-3.5 py-2 font-mono tabular-nums"
            />
          </div>
          <div>
            <label className="block font-semibold mb-1">Gudang Tujuan</label>
            <select
              value={warehouse}
              onChange={(e) => setWarehouse(e.target.value)}
              className="w-full rounded-xl border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-3.5 py-2"
            >
              <option value="Gudang Utama">Gudang Utama</option>
              <option value="Gudang A">Gudang A</option>
              <option value="Gudang B">Gudang B</option>
            </select>
          </div>
        </div>
        <div>
          <label className="block font-semibold mb-1">Catatan ke Principal</label>
          <input
            type="text"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full rounded-xl border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-3.5 py-2"
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
            className="rounded-xl bg-[#194F70] hover:bg-[#123A54] px-4 py-2 text-xs font-bold text-white cursor-pointer"
          >
            Kirim PO Restock
          </button>
        </div>
      </form>
    </Modal>
  );
}

/* 14. Stock Movement Detail Modal */
export function StockMovementDetailModal({
  movement,
  onClose,
  onUpdateStatus,
}: {
  movement: StockMovementRecord | null;
  onClose: () => void;
  onUpdateStatus: (id: string, nextStatus: StockMovementRecord['status']) => void;
}) {
  if (!movement) return null;

  return (
    <Modal
      open={!!movement}
      onClose={onClose}
      title={`${movement.type} — ${movement.id}`}
      subtitle={`${movement.sku} · ${movement.warehouse}`}
    >
      <div className="space-y-4 text-xs sm:text-sm">
        <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] p-4 space-y-2">
          <div className="flex items-center justify-between gap-2">
            <span className="font-bold text-sm">{movement.productName}</span>
            <StatusTag label={movement.status} />
          </div>
          <p className="font-mono font-bold tabular-nums text-[#194F70] dark:text-[#87CEEB]">
            Perubahan Kuantitas: {movement.qtyDelta > 0 ? `+${movement.qtyDelta}` : movement.qtyDelta}{' '}
            {movement.unit}
          </p>
          <p className="text-xs text-[var(--color-text-secondary)]">
            Waktu: {movement.dateLabel} · {movement.notes}
          </p>
        </div>

        <div className="flex flex-wrap justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-[var(--color-border)] px-4 py-2 text-xs font-semibold cursor-pointer"
          >
            Tutup
          </button>
          {movement.status === 'Baru' && (
            <button
              type="button"
              onClick={() => {
                onUpdateStatus(movement.id, 'Diproses');
                onClose();
              }}
              className="rounded-xl bg-[#348CB2] hover:bg-[#236D91] px-4 py-2 text-xs font-bold text-white cursor-pointer"
            >
              Proses Dokumen
            </button>
          )}
          {movement.status !== 'Selesai' && (
            <button
              type="button"
              onClick={() => {
                onUpdateStatus(movement.id, 'Selesai');
                onClose();
              }}
              className="rounded-xl bg-[#194F70] hover:bg-[#123A54] px-4 py-2 text-xs font-bold text-white cursor-pointer"
            >
              Verifikasi & Selesaikan
            </button>
          )}
        </div>
      </div>
    </Modal>
  );
}

/* 15. Batch Process Pending Stock Movements Modal */
export function BatchProcessMovementsModal({
  open,
  onClose,
  pendingMovements,
  onConfirmBatch,
}: {
  open: boolean;
  onClose: () => void;
  pendingMovements: StockMovementRecord[];
  onConfirmBatch: () => void;
}) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`Terima & Proses Dokumen Mutasi (${pendingMovements.length})`}
      subtitle="Konfirmasi penerimaan barang masuk & penyesuaian stok status Baru"
    >
      <div className="space-y-4 text-xs sm:text-sm">
        {pendingMovements.length === 0 ? (
          <p className="rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] p-4 text-[var(--color-text-secondary)]">
            Tidak ada dokumen pergerakan stok berstatus Baru saat ini.
          </p>
        ) : (
          <div className="space-y-2 max-h-[280px] overflow-y-auto">
            {pendingMovements.map((m) => (
              <div
                key={m.id}
                className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-3 flex items-center justify-between gap-3"
              >
                <div>
                  <p className="font-bold">
                    {m.type} · <span className="font-mono">{m.id}</span>
                  </p>
                  <p className="text-[11px] text-[var(--color-text-secondary)]">
                    {m.productName} ({m.qtyDelta > 0 ? `+${m.qtyDelta}` : m.qtyDelta} {m.unit}) ·{' '}
                    {m.warehouse}
                  </p>
                </div>
                <StatusTag label={m.status} />
              </div>
            ))}
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
          {pendingMovements.length > 0 && (
            <button
              type="button"
              onClick={() => {
                onConfirmBatch();
                onClose();
              }}
              className="inline-flex items-center gap-1.5 rounded-xl bg-[#194F70] hover:bg-[#123A54] px-4 py-2 text-xs font-bold text-white cursor-pointer"
            >
              <CheckCircle2 className="h-3.5 w-3.5" />
              <span>Terima & Selesaikan Semua ({pendingMovements.length})</span>
            </button>
          )}
        </div>
      </div>
    </Modal>
  );
}

/* 16. Distributor Outlet Detail Modal */
export function DistributorOutletDetailModal({
  outlet,
  onClose,
  onTogglePriority,
  onToggleStatus,
  onOpenCoverageMap,
  onOpenWorkspace,
}: {
  outlet: DistributorOutletRecord | null;
  onClose: () => void;
  onTogglePriority: (id: string) => void;
  onToggleStatus: (id: string) => void;
  onOpenCoverageMap: (outletId: string) => void;
  onOpenWorkspace: (outlet: DistributorOutletRecord) => void;
}) {
  if (!outlet) return null;

  return (
    <Modal
      open={!!outlet}
      onClose={onClose}
      title={outlet.name}
      subtitle={`${outlet.city} · PIC ${outlet.picName} (${outlet.phone})`}
    >
      <div className="space-y-4 text-xs sm:text-sm">
        <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] p-4 space-y-1.5">
          <div className="flex flex-wrap items-center gap-2">
            {outlet.isPriority && <StatusTag label="Prioritas" tone="brand" />}
            <StatusTag label={outlet.status} showIcon />
            <StatusTag label={outlet.covered ? 'Tercakup' : 'Belum Tercakup'} />
          </div>
          <p className="text-xs text-[var(--color-text-secondary)] pt-1">
            Alamat: <strong>{outlet.address}</strong>
          </p>
          <p className="text-xs font-mono tabular-nums text-[var(--color-text-muted)]">
            Koordinat GPS: {outlet.lat.toFixed(5)}, {outlet.lng.toFixed(5)}
          </p>
          <p className="text-xs font-bold font-mono tabular-nums text-[#047857] dark:text-[#34D399]">
            Order Terakhir: {formatRupiah(outlet.lastOrderTotal)}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => onTogglePriority(outlet.id)}
            className="rounded-xl border border-[var(--color-border-strong)] px-3 py-2 text-xs font-semibold cursor-pointer hover:bg-[var(--color-surface-muted)]"
          >
            {outlet.isPriority ? 'Hapus Label Prioritas' : 'Jadikan Outlet Prioritas'}
          </button>
          <button
            type="button"
            onClick={() => onToggleStatus(outlet.id)}
            className="rounded-xl border border-[var(--color-border-strong)] px-3 py-2 text-xs font-semibold cursor-pointer hover:bg-[var(--color-surface-muted)]"
          >
            {outlet.status === 'Aktif' ? 'Nonaktifkan Outlet' : 'Aktifkan Outlet'}
          </button>
        </div>

        <div className="flex flex-wrap justify-between gap-2 pt-2 border-t border-[var(--color-border)]">
          <button
            type="button"
            onClick={() => {
              onClose();
              onOpenCoverageMap(outlet.id);
            }}
            className="inline-flex items-center gap-1.5 rounded-xl border border-[#348CB2] px-3.5 py-2 text-xs font-bold text-[#194F70] dark:text-[#87CEEB] cursor-pointer"
          >
            <MapPin className="h-3.5 w-3.5" />
            <span>Lihat di Cakupan Maps</span>
          </button>
          <button
            type="button"
            onClick={() => {
              onClose();
              onOpenWorkspace(outlet);
            }}
            className="inline-flex items-center gap-1.5 rounded-xl bg-[#194F70] hover:bg-[#123A54] px-4 py-2 text-xs font-bold text-white cursor-pointer"
          >
            <Store className="h-3.5 w-3.5" />
            <span>Hubungi Outlet (Workspace)</span>
          </button>
        </div>
      </div>
    </Modal>
  );
}

/* 17. Distributor Sales Rep Detail Modal */
export function DistributorSalesRepModal({
  rep,
  onClose,
  onUpdateRep,
}: {
  rep: DistributorSalesRep | null;
  onClose: () => void;
  onUpdateRep: (
    id: string,
    updates: Partial<Pick<DistributorSalesRep, 'area' | 'targetVisits' | 'status'>>
  ) => void;
}) {
  const [area, setArea] = useState(rep?.area || 'Area Bogor');
  const [targetStr, setTargetStr] = useState(String(rep?.targetVisits ?? 8));
  const [status, setStatus] = useState<DistributorSalesRep['status']>(rep?.status || 'Aktif');

  if (!rep) return null;

  return (
    <Modal
      open={!!rep}
      onClose={onClose}
      title={rep.name}
      subtitle={`${rep.outletsHandled} outlet binaan · Pencapaian ${formatRupiah(rep.monthlyOrderTotal)}`}
    >
      <form
        onSubmit={(e) => {
          e.preventDefault();
          onUpdateRep(rep.id, {
            area,
            targetVisits: Math.max(1, parseInt(targetStr, 10) || 8),
            status,
          });
          onClose();
        }}
        className="space-y-3.5 text-xs sm:text-sm"
      >
        <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] p-3.5 flex items-center justify-between">
          <div>
            <p className="text-[11px] text-[var(--color-text-muted)]">Kunjungan Tercapai</p>
            <p className="font-mono font-bold tabular-nums">
              {rep.visitsCompleted} / {rep.targetVisits} kunjungan
            </p>
          </div>
          <StatusTag label={status} showIcon />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block font-semibold mb-1">Area Penugasan</label>
            <input
              type="text"
              value={area}
              onChange={(e) => setArea(e.target.value)}
              className="w-full rounded-xl border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-3.5 py-2"
            />
          </div>
          <div>
            <label className="block font-semibold mb-1">Target Kunjungan/Hari</label>
            <input
              type="number"
              min={1}
              value={targetStr}
              onChange={(e) => setTargetStr(e.target.value)}
              className="w-full rounded-xl border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-3.5 py-2 font-mono tabular-nums"
            />
          </div>
        </div>
        <div>
          <label className="block font-semibold mb-1">Status Anggota</label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as DistributorSalesRep['status'])}
            className="w-full rounded-xl border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-3.5 py-2"
          >
            <option value="Aktif">Aktif</option>
            <option value="Tidak Aktif">Tidak Aktif</option>
          </select>
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
            className="rounded-xl bg-[#194F70] hover:bg-[#123A54] px-4 py-2 text-xs font-bold text-white cursor-pointer"
          >
            Simpan Perubahan Tim
          </button>
        </div>
      </form>
    </Modal>
  );
}

/* 18. Distributor Promo Detail Modal */
export function DistributorPromoDetailModal({
  promo,
  onClose,
  onUpdateStatus,
  onAskAi,
}: {
  promo: DistributorPromoCampaign | null;
  onClose: () => void;
  onUpdateStatus: (id: string, status: DistributorPromoCampaign['status']) => void;
  onAskAi: () => void;
}) {
  if (!promo) return null;

  return (
    <Modal
      open={!!promo}
      onClose={onClose}
      title={promo.title}
      subtitle={`${promo.kind} · Periode: ${promo.period}`}
    >
      <div className="space-y-4 text-xs sm:text-sm">
        <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] p-4 space-y-1.5">
          <div className="flex items-center justify-between gap-2">
            <span className="font-bold flex items-center gap-1.5">
              <Megaphone className="h-4 w-4 text-[#F97316]" />
              <span>Aturan Diskon & Insentif</span>
            </span>
            <StatusTag label={promo.status} />
          </div>
          <p className="text-xs text-[var(--color-text-secondary)]">{promo.discountRule}</p>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 pt-2">
          <button
            type="button"
            onClick={() => {
              onClose();
              onAskAi();
            }}
            className="inline-flex items-center gap-1.5 rounded-xl border border-[#348CB2] bg-[#F3FAFC] dark:bg-[#19394B] px-3.5 py-2 text-xs font-bold text-[#194F70] dark:text-[#87CEEB] cursor-pointer"
          >
            <Sparkles className="h-3.5 w-3.5 text-[#348CB2]" />
            <span>Tanya AI Strategi Promo</span>
          </button>
          <div className="flex gap-2">
            {promo.status !== 'Aktif' ? (
              <button
                type="button"
                onClick={() => {
                  onUpdateStatus(promo.id, 'Aktif');
                  onClose();
                }}
                className="rounded-xl bg-[#194F70] hover:bg-[#123A54] px-4 py-2 text-xs font-bold text-white cursor-pointer"
              >
                Aktifkan Sekarang
              </button>
            ) : (
              <button
                type="button"
                onClick={() => {
                  onUpdateStatus(promo.id, 'Selesai');
                  onClose();
                }}
                className="rounded-xl border border-amber-300 bg-amber-50 text-amber-800 px-4 py-2 text-xs font-bold cursor-pointer"
              >
                Tandai Selesai
              </button>
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
}

/* 19. Distributor Company Profile Modal */
export function DistributorCompanyProfileModal({
  open,
  onClose,
  profile,
  onSaveProfile,
}: {
  open: boolean;
  onClose: () => void;
  profile: { name: string; cityArea: string; email: string; picName: string; phone: string };
  onSaveProfile: (next: {
    name: string;
    cityArea: string;
    email: string;
    picName: string;
    phone: string;
  }) => void;
}) {
  const [name, setName] = useState(profile.name);
  const [cityArea, setCityArea] = useState(profile.cityArea);
  const [email, setEmail] = useState(profile.email);
  const [picName, setPicName] = useState(profile.picName);
  const [phone, setPhone] = useState(profile.phone);

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Profil Perusahaan Distributor"
      subtitle="Identitas legal, gudang pusat, dan kontak PIC operasional"
    >
      <form
        onSubmit={(e) => {
          e.preventDefault();
          onSaveProfile({ name, cityArea, email, picName, phone });
          onClose();
        }}
        className="space-y-3 text-xs sm:text-sm"
      >
        <div className="flex items-center gap-2 rounded-xl bg-[#F3FAFC] dark:bg-[#19394B] p-3 text-xs text-[#194F70] dark:text-[#87CEEB]">
          <Building2 className="h-4 w-4 shrink-0" />
          <span>Data profil ini tampil di surat jalan fulfillment & katalog outlet.</span>
        </div>
        <div>
          <label className="block font-semibold mb-1">Nama Badan Usaha</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-xl border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-3.5 py-2"
          />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block font-semibold mb-1">Wilayah Gudang Pusat</label>
            <input
              type="text"
              value={cityArea}
              onChange={(e) => setCityArea(e.target.value)}
              className="w-full rounded-xl border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-3.5 py-2"
            />
          </div>
          <div>
            <label className="block font-semibold mb-1">Nama PIC</label>
            <input
              type="text"
              value={picName}
              onChange={(e) => setPicName(e.target.value)}
              className="w-full rounded-xl border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-3.5 py-2"
            />
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block font-semibold mb-1">Telepon Operasional</label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full rounded-xl border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-3.5 py-2"
            />
          </div>
          <div>
            <label className="block font-semibold mb-1">Email Bisnis</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-xl border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-3.5 py-2"
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
            className="rounded-xl bg-[#194F70] hover:bg-[#123A54] px-4 py-2 text-xs font-bold text-white cursor-pointer"
          >
            Simpan Profil
          </button>
        </div>
      </form>
    </Modal>
  );
}

/* 20. Distributor Operations Settings Modal */
export function DistributorOperationsModal({
  open,
  onClose,
  onSave,
}: {
  open: boolean;
  onClose: () => void;
  onSave: (msg: string) => void;
}) {
  const [defaultWarehouse, setDefaultWarehouse] = useState('Gudang Utama');
  const [cutoffTime, setCutoffTime] = useState('15:00');
  const [autoQc, setAutoQc] = useState(true);

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Pengaturan Operasional Gudang"
      subtitle="Konfigurasi gudang default, jam cut-off same-day, dan aturan QC fulfillment"
    >
      <form
        onSubmit={(e) => {
          e.preventDefault();
          onSave(
            `Operasional diperbarui: ${defaultWarehouse}, cut-off ${cutoffTime} WIB${autoQc ? ' · Auto-QC aktif' : ''}.`
          );
          onClose();
        }}
        className="space-y-3.5 text-xs sm:text-sm"
      >
        <div className="flex items-center gap-2 rounded-xl bg-[#F3FAFC] dark:bg-[#19394B] p-3 text-xs text-[#194F70] dark:text-[#87CEEB]">
          <SlidersHorizontal className="h-4 w-4 shrink-0" />
          <span>Aturan ini mengontrol antrean otomatis Picking → Packing → QC → Siap Kirim.</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block font-semibold mb-1">Gudang Default Fulfillment</label>
            <select
              value={defaultWarehouse}
              onChange={(e) => setDefaultWarehouse(e.target.value)}
              className="w-full rounded-xl border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-3.5 py-2"
            >
              <option value="Gudang Utama">Gudang Utama</option>
              <option value="Gudang A">Gudang A</option>
              <option value="Gudang B">Gudang B</option>
            </select>
          </div>
          <div>
            <label className="block font-semibold mb-1">Cut-off Pengiriman Hari Sama</label>
            <input
              type="time"
              value={cutoffTime}
              onChange={(e) => setCutoffTime(e.target.value)}
              className="w-full rounded-xl border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-3.5 py-2 font-mono"
            />
          </div>
        </div>
        <label className="flex items-center justify-between gap-3 rounded-xl border border-[var(--color-border)] p-3 cursor-pointer">
          <div>
            <p className="font-semibold">Wajib Checklist Quality Control (QC)</p>
            <p className="text-[11px] text-[var(--color-text-muted)]">
              Order harus melewati verifikasi QC sebelum surat jalan diterbitkan
            </p>
          </div>
          <input
            type="checkbox"
            checked={autoQc}
            onChange={(e) => setAutoQc(e.target.checked)}
            className="h-4 w-4 accent-[#194F70]"
          />
        </label>
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
            className="rounded-xl bg-[#194F70] hover:bg-[#123A54] px-4 py-2 text-xs font-bold text-white cursor-pointer"
          >
            Simpan Operasional
          </button>
        </div>
      </form>
    </Modal>
  );
}

/* 21. Distributor Security Settings Modal */
export function DistributorSecurityModal({
  open,
  onClose,
  onSave,
}: {
  open: boolean;
  onClose: () => void;
  onSave: (msg: string) => void;
}) {
  const [twoFactor, setTwoFactor] = useState(true);
  const [newPass, setNewPass] = useState('');

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Keamanan Akun Distributor"
      subtitle="Autentikasi dua faktor (2FA), sandi akses, dan kontrol sesi perangkat"
    >
      <form
        onSubmit={(e) => {
          e.preventDefault();
          onSave(
            `Keamanan akun diperbarui${newPass ? ' (kata sandi baru tersimpan)' : ''} · 2FA ${twoFactor ? 'Aktif' : 'Nonaktif'}.`
          );
          setNewPass('');
          onClose();
        }}
        className="space-y-3.5 text-xs sm:text-sm"
      >
        <div className="flex items-center gap-2 rounded-xl bg-[#ECFDF5] dark:bg-[#064E3B]/40 p-3 text-xs text-[#047857] dark:text-[#34D399]">
          <ShieldCheck className="h-4 w-4 shrink-0" />
          <span>2 sesi perangkat aktif terenkripsi (Web Admin Bogor & Tablet Gudang Utama).</span>
        </div>
        <label className="flex items-center justify-between gap-3 rounded-xl border border-[var(--color-border)] p-3 cursor-pointer">
          <div>
            <p className="font-semibold">Autentikasi Dua Faktor (OTP Email / Authenticator)</p>
            <p className="text-[11px] text-[var(--color-text-muted)]">
              Proteksi tambahan saat ekspor laporan keuangan & mutasi gudang
            </p>
          </div>
          <input
            type="checkbox"
            checked={twoFactor}
            onChange={(e) => setTwoFactor(e.target.checked)}
            className="h-4 w-4 accent-[#194F70]"
          />
        </label>
        <div>
          <label className="block font-semibold mb-1">Ubah Kata Sandi (Opsional)</label>
          <input
            type="password"
            placeholder="Biarkan kosong jika tidak ingin mengubah"
            value={newPass}
            onChange={(e) => setNewPass(e.target.value)}
            className="w-full rounded-xl border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-3.5 py-2"
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
            type="submit"
            className="rounded-xl bg-[#194F70] hover:bg-[#123A54] px-4 py-2 text-xs font-bold text-white cursor-pointer"
          >
            Simpan Keamanan
          </button>
        </div>
      </form>
    </Modal>
  );
}

