'use client';

import React, { useState } from 'react';
import {
  CheckCircle2,
  Plus,
  Building2,
  ShieldCheck,
  Mail,
  MessageSquarePlus,
  Download,
  Bell,
  Package,
  Truck,
  Edit3,
  Settings,
} from 'lucide-react';
import { Modal } from '@/components/common/Modal';
import { StatusTag } from '@/components/design-system/StatusTag';
import { formatRupiah, type NotificationItem } from '@/lib/salesx-data';
import type {
  PrincipalProductRecord,
  PrincipalCategorySummary,
  PrincipalProductVariant,
  PricingPolicyRule,
  PrincipalCampaignItem,
  PrincipalDistributorPartner,
  PrincipalDistributorOrder,
  PrincipalDistributorPriceRow,
} from '@/lib/salesx-portals-data';

/* 1. Daftar Principal Modal */
export function DaftarPrincipalModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [company, setCompany] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [sent, setSent] = useState(false);

  return (
    <Modal
      open={open}
      onClose={() => {
        setSent(false);
        onClose();
      }}
      title="Pendaftaran Principal / Pemilik Produk"
      subtitle="Akses khusus brand owner untuk mengelola jaringan distributor nasional"
    >
      {sent ? (
        <div className="space-y-4 text-xs sm:text-sm">
          <div className="rounded-xl bg-[#ECFDF5] dark:bg-[#064E3B]/40 p-4 text-[#047857] dark:text-[#34D399] flex items-start gap-2.5">
            <CheckCircle2 className="h-5 w-5 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">Permintaan Akses Principal Terkirim</p>
              <p className="mt-1">
                Tim enterprise SalesX-Ai akan memverifikasi{' '}
                <strong>{company}</strong> dan menghubungi <strong>{email}</strong>.
              </p>
            </div>
          </div>
          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => {
                setSent(false);
                onClose();
              }}
              className="rounded-xl bg-[#194F70] px-4 py-2 text-xs font-bold text-white cursor-pointer"
            >
              Tutup
            </button>
          </div>
        </div>
      ) : (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!company.trim() || !email.trim()) return;
            setSent(true);
          }}
          className="space-y-3 text-xs sm:text-sm"
        >
          <div>
            <label className="block font-semibold mb-1">Nama Perusahaan Principal</label>
            <input
              required
              type="text"
              placeholder="Contoh: PT Sinar Pangan Nusantara"
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              className="w-full rounded-xl border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-3.5 py-2.5"
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold mb-1">Email Resmi</label>
              <input
                required
                type="email"
                placeholder="principal@perusahaan.co.id"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-xl border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-3.5 py-2.5"
              />
            </div>
            <div>
              <label className="block font-semibold mb-1">No. Telepon</label>
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
              className="rounded-xl bg-[#194F70] px-4 py-2 text-xs font-bold text-white cursor-pointer"
            >
              Ajukan Akun Principal
            </button>
          </div>
        </form>
      )}
    </Modal>
  );
}

/* 2. Add Product Master Modal */
export function AddProductPrincipalModal({
  open,
  onClose,
  onAddProduct,
}: {
  open: boolean;
  onClose: () => void;
  onAddProduct: (prod: PrincipalProductRecord) => void;
}) {
  const [sku, setSku] = useState('SX-MNM-009');
  const [name, setName] = useState('');
  const [category, setCategory] =
    useState<PrincipalProductRecord['category']>('Minuman');
  const [rrp, setRrp] = useState('7000');
  const [distributorPrice, setDistributorPrice] = useState('5800');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onAddProduct({
      sku: sku.trim().toUpperCase(),
      name: name.trim(),
      category,
      status: 'Aktif',
      rrp: Number(rrp) || 6000,
      distributorPrice: Number(distributorPrice) || 5000,
      moq: 10,
      accentHex: '#348CB2',
      description: 'SKU master baru diterbitkan dari Principal Portal.',
    });
    setName('');
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Tambah Produk Master Baru"
      subtitle="Definisikan SKU induk, kategori, dan rekomendasi harga RRP"
    >
      <form onSubmit={handleSubmit} className="space-y-3 text-xs sm:text-sm">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block font-semibold mb-1">Kode SKU Induk</label>
            <input
              required
              type="text"
              value={sku}
              onChange={(e) => setSku(e.target.value)}
              className="w-full rounded-xl border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-3.5 py-2.5 font-mono"
            />
          </div>
          <div>
            <label className="block font-semibold mb-1">Kategori</label>
            <select
              value={category}
              onChange={(e) =>
                setCategory(e.target.value as PrincipalProductRecord['category'])
              }
              className="w-full rounded-xl border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-3.5 py-2.5"
            >
              <option value="Minuman">Minuman</option>
              <option value="Makanan">Makanan</option>
              <option value="Perawatan Pribadi">Perawatan Pribadi</option>
              <option value="Kebersihan Rumah">Kebersihan Rumah</option>
              <option value="Lainnya">Lainnya</option>
            </select>
          </div>
        </div>
        <div>
          <label className="block font-semibold mb-1">Nama Produk</label>
          <input
            required
            type="text"
            placeholder="Contoh: Minuman Isotonik Lemon 330 ml"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-xl border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-3.5 py-2.5"
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block font-semibold mb-1">Harga Distributor (Rp)</label>
            <input
              type="number"
              value={distributorPrice}
              onChange={(e) => setDistributorPrice(e.target.value)}
              className="w-full rounded-xl border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-3.5 py-2.5 font-mono"
            />
          </div>
          <div>
            <label className="block font-semibold mb-1">Harga RRP (Rp)</label>
            <input
              type="number"
              value={rrp}
              onChange={(e) => setRrp(e.target.value)}
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
            <Package className="h-3.5 w-3.5" />
            <span>Simpan Produk Master</span>
          </button>
        </div>
      </form>
    </Modal>
  );
}

/* 3. Add Category Modal */
export function AddCategoryModal({
  open,
  onClose,
  onAddCategory,
}: {
  open: boolean;
  onClose: () => void;
  onAddCategory: (cat: PrincipalCategorySummary) => void;
}) {
  const [name, setName] = useState('Makanan');
  const [description, setDescription] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) return;
    onAddCategory({
      id: `cat-${Date.now()}`,
      name: name as PrincipalCategorySummary['name'],
      productCount: 1,
      description: description.trim(),
    });
    setDescription('');
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Tambah Kategori Produk"
      subtitle="Pengelompokan katalog produk master untuk analitik & promo"
    >
      <form onSubmit={handleSubmit} className="space-y-3 text-xs sm:text-sm">
        <div>
          <label className="block font-semibold mb-1">Kelompok Kategori</label>
          <select
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-xl border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-3.5 py-2.5"
          >
            <option value="Minuman">Minuman</option>
            <option value="Makanan">Makanan</option>
            <option value="Perawatan Pribadi">Perawatan Pribadi</option>
            <option value="Kebersihan Rumah">Kebersihan Rumah</option>
            <option value="Lainnya">Lainnya</option>
          </select>
        </div>
        <div>
          <label className="block font-semibold mb-1">Deskripsi Sub-Kategori</label>
          <input
            required
            type="text"
            placeholder="Contoh: Susu UHT & Minuman Kesehatan"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
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
            className="rounded-xl bg-[#194F70] px-4 py-2 text-xs font-bold text-white cursor-pointer"
          >
            Simpan Kategori
          </button>
        </div>
      </form>
    </Modal>
  );
}

/* 4. Add Variant / SKU Modal */
export function AddVariantModal({
  open,
  onClose,
  parentSku,
  onAddVariant,
}: {
  open: boolean;
  onClose: () => void;
  parentSku: string;
  onAddVariant: (v: PrincipalProductVariant) => void;
}) {
  const [sku, setSku] = useState(`${parentSku}-D`);
  const [label, setLabel] = useState('Rasa Lemon · 250 ml');
  const [barcode, setBarcode] = useState('8991234560015');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!label.trim()) return;
    onAddVariant({
      id: `var-${Date.now()}`,
      parentSku,
      sku: sku.trim().toUpperCase(),
      variantLabel: label.trim(),
      barcode: barcode.trim(),
      status: 'Aktif',
      unitWeight: '250 ml',
    });
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Tambah Varian / SKU"
      subtitle={`SKU Induk: ${parentSku}`}
    >
      <form onSubmit={handleSubmit} className="space-y-3 text-xs sm:text-sm">
        <div>
          <label className="block font-semibold mb-1">Kode SKU Varian</label>
          <input
            required
            type="text"
            value={sku}
            onChange={(e) => setSku(e.target.value)}
            className="w-full rounded-xl border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-3.5 py-2.5 font-mono"
          />
        </div>
        <div>
          <label className="block font-semibold mb-1">Nama Varian & Kemasan</label>
          <input
            required
            type="text"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            className="w-full rounded-xl border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-3.5 py-2.5"
          />
        </div>
        <div>
          <label className="block font-semibold mb-1">Nomor Barcode EAN-13</label>
          <input
            required
            type="text"
            value={barcode}
            onChange={(e) => setBarcode(e.target.value)}
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
            className="rounded-xl bg-[#194F70] px-4 py-2 text-xs font-bold text-white cursor-pointer"
          >
            Tambah Varian
          </button>
        </div>
      </form>
    </Modal>
  );
}

/* 5. Update Price List / Stock Status Modal */
export function UpdatePriceListModal({
  row,
  onClose,
  onUpdateRow,
}: {
  row: PrincipalDistributorPriceRow | null;
  onClose: () => void;
  onUpdateRow: (id: string, price: number, stockStatus: 'Aman' | 'Rendah' | 'Habis') => void;
}) {
  const [price, setPrice] = useState(row?.pricePerUnit.toString() || '5000');
  const [stockStatus, setStockStatus] = useState<'Aman' | 'Rendah' | 'Habis'>(
    row?.stockStatus || 'Aman'
  );

  if (!row) return null;

  return (
    <Modal
      open={!!row}
      onClose={onClose}
      title={`Price List — ${row.productName}`}
      subtitle={`${row.distributorName} · SKU ${row.sku}`}
    >
      <form
        onSubmit={(e) => {
          e.preventDefault();
          onUpdateRow(row.id, Number(price) || row.pricePerUnit, stockStatus);
          onClose();
        }}
        className="space-y-3 text-xs sm:text-sm"
      >
        <div>
          <label className="block font-semibold mb-1">Harga Distributor (Rp)</label>
          <input
            type="number"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            className="w-full rounded-xl border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-3.5 py-2.5 font-mono"
          />
        </div>
        <div>
          <label className="block font-semibold mb-1">Status Ketersediaan Stok</label>
          <select
            value={stockStatus}
            onChange={(e) =>
              setStockStatus(e.target.value as 'Aman' | 'Rendah' | 'Habis')
            }
            className="w-full rounded-xl border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-3.5 py-2.5"
          >
            <option value="Aman">Aman</option>
            <option value="Rendah">Rendah (Perlu Restock)</option>
            <option value="Habis">Habis</option>
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
            className="rounded-xl bg-[#194F70] px-4 py-2 text-xs font-bold text-white cursor-pointer"
          >
            Perbarui Harga
          </button>
        </div>
      </form>
    </Modal>
  );
}

/* 6. Pricing Policy Modal */
export function PricingPolicyModal({
  policy,
  onClose,
  onSavePolicy,
}: {
  policy: PricingPolicyRule | null;
  onClose: () => void;
  onSavePolicy: (id: string, summary: string) => void;
}) {
  const [summary, setSummary] = useState(policy?.activeSummary || '');

  if (!policy) return null;

  return (
    <Modal
      open={!!policy}
      onClose={onClose}
      title={policy.title}
      subtitle={`${policy.subtitle} · Pembaruan terakhir: ${policy.updatedAt}`}
    >
      <div className="space-y-4 text-xs sm:text-sm">
        <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] p-3.5 space-y-1.5">
          {policy.detailRules.map((r) => (
            <p key={r} className="flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 text-[#10B981] shrink-0 mt-0.5" />
              <span>{r}</span>
            </p>
          ))}
        </div>
        <div>
          <label className="block font-semibold mb-1">Ringkasan Kebijakan Aktif</label>
          <input
            type="text"
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
            className="w-full rounded-xl border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-3.5 py-2.5"
          />
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
            onClick={() => {
              onSavePolicy(policy.id, summary);
              onClose();
            }}
            className="rounded-xl bg-[#194F70] px-4 py-2 text-xs font-bold text-white cursor-pointer"
          >
            Simpan Kebijakan
          </button>
        </div>
      </div>
    </Modal>
  );
}

/* 7. Create Campaign Modal */
export function CreateCampaignModal({
  open,
  onClose,
  onCreateCampaign,
}: {
  open: boolean;
  onClose: () => void;
  onCreateCampaign: (camp: PrincipalCampaignItem) => void;
}) {
  const [title, setTitle] = useState('');
  const [period, setPeriod] = useState('1–30 Nov 2026');
  const [productLine, setProductLine] = useState('Minuman Energi (3 SKU)');
  const [targetSales, setTargetSales] = useState('750000000');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    onCreateCampaign({
      id: `pcamp-${Date.now()}`,
      title: title.trim(),
      period,
      status: 'Aktif',
      discountLabel: 'Promo Nasional',
      productLine,
      skuCount: 3,
      targetSales: Number(targetSales) || 750_000_000,
      realizedSales: 0,
      distributorScope: '24 Distributor · Nasional',
      distributorCount: 24,
      notes: 'Campaign baru diterbitkan langsung dari Principal Portal.',
    });
    setTitle('');
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Buat Promotion Campaign Baru"
      subtitle="Terbitkan program promosi nasional ke seluruh jaringan distributor"
    >
      <form onSubmit={handleSubmit} className="space-y-3 text-xs sm:text-sm">
        <div>
          <label className="block font-semibold mb-1">Nama Campaign</label>
          <input
            required
            type="text"
            placeholder="Contoh: Cashback Akhir Tahun 15%"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full rounded-xl border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-3.5 py-2.5"
          />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block font-semibold mb-1">Periode Campaign</label>
            <input
              type="text"
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              className="w-full rounded-xl border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-3.5 py-2.5"
            />
          </div>
          <div>
            <label className="block font-semibold mb-1">Target Penjualan (Rp)</label>
            <input
              type="number"
              value={targetSales}
              onChange={(e) => setTargetSales(e.target.value)}
              className="w-full rounded-xl border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-3.5 py-2.5 font-mono"
            />
          </div>
        </div>
        <div>
          <label className="block font-semibold mb-1">Lini Produk Cakupan</label>
          <input
            type="text"
            value={productLine}
            onChange={(e) => setProductLine(e.target.value)}
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
            <Plus className="h-3.5 w-3.5" />
            <span>Terbitkan Campaign</span>
          </button>
        </div>
      </form>
    </Modal>
  );
}

/* 8. Add Distributor Partner Modal */
export function AddDistributorModal({
  open,
  onClose,
  onAddDistributor,
}: {
  open: boolean;
  onClose: () => void;
  onAddDistributor: (dist: PrincipalDistributorPartner) => void;
}) {
  const [name, setName] = useState('');
  const [region, setRegion] = useState('Jawa Barat');
  const [picName, setPicName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onAddDistributor({
      id: `pdist-${Date.now()}`,
      name: name.trim(),
      region,
      status: 'Aktif',
      picName: picName.trim() || 'PIC Distributor',
      phone: phone.trim() || '0812-0000-2222',
      email: email.trim() || 'mitra@distributor.co.id',
      warehouseLocation: `Gudang ${region}`,
      monthlySalesValue: 0,
      orderCount: 0,
      contractPeriod: 'Jan 2026 – Des 2027 (Tier-B)',
      slaOnTimePct: 100,
      notes: ['Mitra distributor baru didaftarkan.'],
    });
    setName('');
    setPicName('');
    setPhone('');
    setEmail('');
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Tambah Mitra Distributor"
      subtitle="Integrasikan distributor baru ke jaringan distribusi Principal"
    >
      <form onSubmit={handleSubmit} className="space-y-3 text-xs sm:text-sm">
        <div>
          <label className="block font-semibold mb-1">Nama Perusahaan Distributor</label>
          <input
            required
            type="text"
            placeholder="Contoh: PT Mitra Jaya Abadi"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-xl border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-3.5 py-2.5"
          />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block font-semibold mb-1">Region</label>
            <input
              type="text"
              value={region}
              onChange={(e) => setRegion(e.target.value)}
              className="w-full rounded-xl border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-3.5 py-2.5"
            />
          </div>
          <div>
            <label className="block font-semibold mb-1">PIC Distributor</label>
            <input
              type="text"
              value={picName}
              onChange={(e) => setPicName(e.target.value)}
              className="w-full rounded-xl border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-3.5 py-2.5"
            />
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block font-semibold mb-1">Kontak</label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full rounded-xl border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-3.5 py-2.5"
            />
          </div>
          <div>
            <label className="block font-semibold mb-1">Email</label>
            <input
              type="email"
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
            className="inline-flex items-center gap-1.5 rounded-xl bg-[#194F70] px-4 py-2 text-xs font-bold text-white cursor-pointer"
          >
            <Building2 className="h-3.5 w-3.5" />
            <span>Tambah Distributor</span>
          </button>
        </div>
      </form>
    </Modal>
  );
}

/* 9. Add Note to Distributor Modal */
export function DistributorNoteModal({
  distributor,
  onClose,
  onAddNote,
}: {
  distributor: PrincipalDistributorPartner | null;
  onClose: () => void;
  onAddNote: (distId: string, note: string) => void;
}) {
  const [note, setNote] = useState('');

  if (!distributor) return null;

  return (
    <Modal
      open={!!distributor}
      onClose={onClose}
      title={`Catatan Hubungan — ${distributor.name}`}
      subtitle={`PIC: ${distributor.picName} · ${distributor.region}`}
    >
      <div className="space-y-4 text-xs sm:text-sm">
        <div className="space-y-2 max-h-[200px] overflow-y-auto">
          {distributor.notes.map((n, idx) => (
            <div
              key={idx}
              className="rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] p-3 text-xs"
            >
              {n}
            </div>
          ))}
        </div>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!note.trim()) return;
            onAddNote(distributor.id, note.trim());
            setNote('');
            onClose();
          }}
          className="space-y-2"
        >
          <label className="block font-semibold">Tambah Catatan Kinerja / Follow-up</label>
          <textarea
            rows={2}
            required
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Tulis catatan evaluasi distribusi atau alokasi promo..."
            className="w-full rounded-xl border border-[var(--color-border-strong)] bg-[var(--color-surface)] p-3"
          />
          <div className="flex justify-end gap-2">
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
              <MessageSquarePlus className="h-3.5 w-3.5" />
              <span>Simpan Catatan</span>
            </button>
          </div>
        </form>
      </div>
    </Modal>
  );
}

/* 10. Order Detail Modal */
export function PrincipalOrderDetailModal({
  order,
  onClose,
  onUpdateStatus,
}: {
  order: PrincipalDistributorOrder | null;
  onClose: () => void;
  onUpdateStatus?: (orderId: string, nextStatus: 'Diproses' | 'Dikirim' | 'Selesai') => void;
}) {
  if (!order) return null;

  return (
    <Modal
      open={!!order}
      onClose={onClose}
      title={`Detail Order ${order.id}`}
      subtitle={`${order.distributorName} · ${order.dateLabel}`}
    >
      <div className="space-y-4 text-xs sm:text-sm">
        <div className="flex items-center justify-between rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] p-4">
          <div>
            <p className="text-[11px] text-[var(--color-text-muted)]">Total Nilai PO</p>
            <p className="text-lg font-bold font-mono tabular-nums text-[#123A54] dark:text-white">
              {formatRupiah(order.total)}
            </p>
          </div>
          <StatusTag label={order.status} showIcon />
        </div>
        <div className="rounded-xl border border-[var(--color-border)] p-4">
          <p className="font-semibold text-[var(--color-text-secondary)]">Rincian Alokasi SKU</p>
          <p className="font-bold mt-1">{order.itemsSummary}</p>
        </div>
        <div className="flex flex-wrap justify-end gap-2">
          {onUpdateStatus && order.status === 'Diproses' && (
            <button
              type="button"
              onClick={() => {
                onUpdateStatus(order.id, 'Dikirim');
                onClose();
              }}
              className="inline-flex items-center gap-1.5 rounded-xl bg-[#348CB2] hover:bg-[#236D91] px-4 py-2 text-xs font-bold text-white cursor-pointer"
            >
              <Truck className="h-3.5 w-3.5" />
              <span>Kirim Barang (Dikirim)</span>
            </button>
          )}
          {onUpdateStatus && order.status === 'Dikirim' && (
            <button
              type="button"
              onClick={() => {
                onUpdateStatus(order.id, 'Selesai');
                onClose();
              }}
              className="inline-flex items-center gap-1.5 rounded-xl bg-[#10B981] hover:bg-[#059669] px-4 py-2 text-xs font-bold text-white cursor-pointer"
            >
              <CheckCircle2 className="h-3.5 w-3.5" />
              <span>Tandai Selesai</span>
            </button>
          )}
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

/* 11. Account & Access Management Modal (Screen 15 item) */
export function PrincipalAccessModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [roles, setRoles] = useState([
    { id: 'r1', name: 'Direktur Brand & Produk', email: 'brand.lead@sinarprodukutama.co.id', level: 'Full Admin', active: true },
    { id: 'r2', name: 'National Key Account Manager', email: 'nkam@sinarprodukutama.co.id', level: 'Pricing & Campaign', active: true },
    { id: 'r3', name: 'Trade Marketing Analyst', email: 'trademarket@sinarprodukutama.co.id', level: 'Analytics & AI', active: true },
  ]);

  const handleExportPrincipalCsv = () => {
    const csv = [
      'Distributor,Region,Sales_Through,Total_Order,SLA',
      '"PT Maju Distribusi","Jawa Barat","Rp 1.256.800.000",624,"96,4%"',
      '"PT Sentosa Niaga","Jawa Tengah","Rp 892.400.000",412,"94,1%"',
      '"PT Karya Distribusi","Jawa Timur","Rp 756.000.000",368,"91,8%"',
    ].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'principal-sales-through.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Account & Access Management"
      subtitle="Kelola pengguna Principal, hak akses modul, dan ekspor laporan eksekutif"
      maxWidthClass="max-w-2xl"
    >
      <div className="space-y-4 text-xs sm:text-sm">
        <div className="space-y-2">
          {roles.map((r) => (
            <div
              key={r.id}
              className="flex items-center justify-between gap-3 rounded-xl border border-[var(--color-border)] p-3.5"
            >
              <div>
                <p className="font-bold flex items-center gap-1.5">
                  <ShieldCheck className="h-4 w-4 text-[#348CB2]" />
                  <span>{r.name}</span>
                </p>
                <p className="text-[11px] text-[var(--color-text-muted)]">
                  {r.email} · Peran: {r.level}
                </p>
              </div>
              <button
                type="button"
                onClick={() =>
                  setRoles((prev) =>
                    prev.map((x) => (x.id === r.id ? { ...x, active: !x.active } : x))
                  )
                }
                className={`rounded-lg px-3 py-1.5 text-[11px] font-bold cursor-pointer ${
                  r.active
                    ? 'bg-[#ECFDF5] text-[#047857] border border-[#A7F3D0]'
                    : 'bg-[var(--color-surface-muted)] text-[var(--color-text-secondary)]'
                }`}
              >
                {r.active ? 'Aktif' : 'Nonaktif'}
              </button>
            </div>
          ))}
        </div>
        <div className="flex flex-wrap justify-between gap-2 pt-2 border-t border-[var(--color-border)]">
          <button
            type="button"
            onClick={handleExportPrincipalCsv}
            className="inline-flex items-center gap-1.5 rounded-xl border border-[#348CB2] px-4 py-2 text-xs font-bold text-[#194F70] dark:text-[#87CEEB] cursor-pointer"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Unduh Laporan Sales-through CSV</span>
          </button>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl bg-[#194F70] px-4 py-2 text-xs font-bold text-white cursor-pointer"
          >
            Selesai
          </button>
        </div>
      </div>
    </Modal>
  );
}

/* 12. Principal Notifications Modal */
export function PrincipalNotificationsModal({
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
      title="Notifikasi Principal"
      subtitle="Peringatan stok distributor, pencapaian campaign, dan order masuk"
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
              <div className="flex items-center justify-between">
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

function PrincipalProductDetailForm({
  product,
  onClose,
  onSaveProduct,
}: {
  product: PrincipalProductRecord;
  onClose: () => void;
  onSaveProduct: (sku: string, patch: Partial<PrincipalProductRecord>) => void;
}) {
  const [rrp, setRrp] = useState(String(product.rrp));
  const [distributorPrice, setDistributorPrice] = useState(String(product.distributorPrice));
  const [moq, setMoq] = useState(String(product.moq));
  const [status, setStatus] = useState<'Aktif' | 'Nonaktif'>(product.status);
  const [description, setDescription] = useState(product.description);

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSaveProduct(product.sku, {
          rrp: Number(rrp) || product.rrp,
          distributorPrice: Number(distributorPrice) || product.distributorPrice,
          moq: Number(moq) || product.moq,
          status,
          description: description.trim() || product.description,
        });
        onClose();
      }}
      className="space-y-3 text-xs sm:text-sm"
    >
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div>
          <label className="block font-semibold mb-1">Harga RRP (Rp)</label>
          <input
            type="number"
            value={rrp}
            onChange={(e) => setRrp(e.target.value)}
            className="w-full rounded-xl border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-3 py-2 font-mono tabular-nums"
          />
        </div>
        <div>
          <label className="block font-semibold mb-1">Harga Distributor</label>
          <input
            type="number"
            value={distributorPrice}
            onChange={(e) => setDistributorPrice(e.target.value)}
            className="w-full rounded-xl border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-3 py-2 font-mono tabular-nums"
          />
        </div>
        <div>
          <label className="block font-semibold mb-1">MOQ (Dus)</label>
          <input
            type="number"
            value={moq}
            onChange={(e) => setMoq(e.target.value)}
            className="w-full rounded-xl border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-3 py-2 font-mono tabular-nums"
          />
        </div>
      </div>
      <div>
        <label className="block font-semibold mb-1">Status Katalog Master</label>
        <div className="flex gap-2">
          {(['Aktif', 'Nonaktif'] as const).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setStatus(s)}
              className={`flex-1 rounded-xl py-2 text-xs font-bold cursor-pointer ${
                status === s
                  ? 'bg-[#194F70] text-white'
                  : 'border border-[var(--color-border)] bg-[var(--color-background)]'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>
      <div>
        <label className="block font-semibold mb-1">Deskripsi Produk</label>
        <textarea
          rows={2}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full rounded-xl border border-[var(--color-border-strong)] bg-[var(--color-surface)] p-3"
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
          <Edit3 className="h-3.5 w-3.5" />
          <span>Simpan Perubahan</span>
        </button>
      </div>
    </form>
  );
}

/* 13. Principal Product Detail & Edit Modal (Screen 3 & 5) */
export function PrincipalProductDetailModal({
  product,
  onClose,
  onSaveProduct,
}: {
  product: PrincipalProductRecord | null;
  onClose: () => void;
  onSaveProduct: (sku: string, patch: Partial<PrincipalProductRecord>) => void;
}) {
  if (!product) return null;

  return (
    <Modal
      open={!!product}
      onClose={onClose}
      title={`Spesifikasi Produk — ${product.name}`}
      subtitle={`SKU Induk: ${product.sku} · Kategori: ${product.category}`}
    >
      <PrincipalProductDetailForm
        key={product.sku}
        product={product}
        onClose={onClose}
        onSaveProduct={onSaveProduct}
      />
    </Modal>
  );
}

function EditVariantForm({
  variant,
  onClose,
  onSaveVariant,
}: {
  variant: PrincipalProductVariant;
  onClose: () => void;
  onSaveVariant: (id: string, patch: Partial<PrincipalProductVariant>) => void;
}) {
  const [variantLabel, setVariantLabel] = useState(variant.variantLabel);
  const [barcode, setBarcode] = useState(variant.barcode);
  const [status, setStatus] = useState<'Aktif' | 'Nonaktif'>(variant.status);

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSaveVariant(variant.id, {
          variantLabel: variantLabel.trim() || variant.variantLabel,
          barcode: barcode.trim() || variant.barcode,
          status,
        });
        onClose();
      }}
      className="space-y-3 text-xs sm:text-sm"
    >
      <div>
        <label className="block font-semibold mb-1">Label Rasa / Kemasan</label>
        <input
          type="text"
          required
          value={variantLabel}
          onChange={(e) => setVariantLabel(e.target.value)}
          className="w-full rounded-xl border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-3.5 py-2.5"
        />
      </div>
      <div>
        <label className="block font-semibold mb-1">Barcode EAN-13</label>
        <input
          type="text"
          required
          value={barcode}
          onChange={(e) => setBarcode(e.target.value)}
          className="w-full rounded-xl border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-3.5 py-2.5 font-mono"
        />
      </div>
      <div>
        <label className="block font-semibold mb-1">Status SKU Varian</label>
        <div className="flex gap-2">
          {(['Aktif', 'Nonaktif'] as const).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setStatus(s)}
              className={`flex-1 rounded-xl py-2 text-xs font-bold cursor-pointer ${
                status === s
                  ? 'bg-[#194F70] text-white'
                  : 'border border-[var(--color-border)] bg-[var(--color-background)]'
              }`}
            >
              {s}
            </button>
          ))}
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
          Simpan Varian
        </button>
      </div>
    </form>
  );
}

/* 14. Edit Variant Modal (Screen 5) */
export function EditVariantModal({
  variant,
  onClose,
  onSaveVariant,
}: {
  variant: PrincipalProductVariant | null;
  onClose: () => void;
  onSaveVariant: (id: string, patch: Partial<PrincipalProductVariant>) => void;
}) {
  if (!variant) return null;

  return (
    <Modal
      open={!!variant}
      onClose={onClose}
      title={`Kelola Varian ${variant.sku}`}
      subtitle={`SKU Induk: ${variant.parentSku}`}
    >
      <EditVariantForm
        key={variant.id}
        variant={variant}
        onClose={onClose}
        onSaveVariant={onSaveVariant}
      />
    </Modal>
  );
}

/* 15. Add Price List Row Modal (Screen 7) */
export function AddPriceListRowModal({
  open,
  onClose,
  distributors,
  products,
  onAddRow,
}: {
  open: boolean;
  onClose: () => void;
  distributors: PrincipalDistributorPartner[];
  products: PrincipalProductRecord[];
  onAddRow: (row: PrincipalDistributorPriceRow) => void;
}) {
  const [distId, setDistId] = useState(distributors[0]?.id || 'pdist-1');
  const [sku, setSku] = useState(products[0]?.sku || 'SX-MNM-001');
  const [stockQty, setStockQty] = useState('1000');
  const [price, setPrice] = useState('5000');

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Tambah Price List & Alokasi Stok"
      subtitle="Tetapkan daftar harga resmi dan alokasi stok untuk distributor"
    >
      <form
        onSubmit={(e) => {
          e.preventDefault();
          const dist = distributors.find((d) => d.id === distId) || distributors[0];
          const prod = products.find((p) => p.sku === sku) || products[0];
          const qtyNum = Math.max(0, Number(stockQty) || 0);
          onAddRow({
            id: `pl-${Date.now()}`,
            distributorId: dist.id,
            distributorName: dist.name,
            sku: prod.sku,
            productName: prod.name,
            stockQty: qtyNum,
            stockStatus: qtyNum === 0 ? 'Habis' : qtyNum < 500 ? 'Rendah' : 'Aman',
            pricePerUnit: Number(price) || prod.distributorPrice,
          });
          onClose();
        }}
        className="space-y-3 text-xs sm:text-sm"
      >
        <div>
          <label className="block font-semibold mb-1">Distributor Mitra</label>
          <select
            value={distId}
            onChange={(e) => setDistId(e.target.value)}
            className="w-full rounded-xl border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-3.5 py-2.5"
          >
            {distributors.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name} ({d.region})
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block font-semibold mb-1">Produk Master</label>
          <select
            value={sku}
            onChange={(e) => {
              const nextSku = e.target.value;
              setSku(nextSku);
              const found = products.find((p) => p.sku === nextSku);
              if (found) setPrice(String(found.distributorPrice));
            }}
            className="w-full rounded-xl border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-3.5 py-2.5"
          >
            {products.map((p) => (
              <option key={p.sku} value={p.sku}>
                {p.sku} — {p.name}
              </option>
            ))}
          </select>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block font-semibold mb-1">Alokasi Stok Awal</label>
            <input
              type="number"
              value={stockQty}
              onChange={(e) => setStockQty(e.target.value)}
              className="w-full rounded-xl border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-3.5 py-2.5 font-mono"
            />
          </div>
          <div>
            <label className="block font-semibold mb-1">Harga Distributor (Rp)</label>
            <input
              type="number"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
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
            <Plus className="h-3.5 w-3.5" />
            <span>Simpan Price List</span>
          </button>
        </div>
      </form>
    </Modal>
  );
}

function EditCampaignForm({
  campaign,
  onClose,
  onSaveCampaign,
}: {
  campaign: PrincipalCampaignItem;
  onClose: () => void;
  onSaveCampaign: (id: string, patch: Partial<PrincipalCampaignItem>) => void;
}) {
  const [title, setTitle] = useState(campaign.title);
  const [period, setPeriod] = useState(campaign.period);
  const [targetSales, setTargetSales] = useState(String(campaign.targetSales));
  const [productLine, setProductLine] = useState(campaign.productLine);
  const [discountLabel, setDiscountLabel] = useState(campaign.discountLabel);
  const [status, setStatus] = useState<'Aktif' | 'Terjadwal' | 'Draft' | 'Selesai'>(
    campaign.status
  );

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSaveCampaign(campaign.id, {
          title: title.trim() || campaign.title,
          period: period.trim() || campaign.period,
          targetSales: Number(targetSales) || campaign.targetSales,
          productLine: productLine.trim() || campaign.productLine,
          discountLabel: discountLabel.trim() || campaign.discountLabel,
          status,
        });
        onClose();
      }}
      className="space-y-3 text-xs sm:text-sm"
    >
      <div>
        <label className="block font-semibold mb-1">Nama Campaign</label>
        <input
          type="text"
          required
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full rounded-xl border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-3.5 py-2.5"
        />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block font-semibold mb-1">Periode Campaign</label>
          <input
            type="text"
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            className="w-full rounded-xl border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-3.5 py-2.5"
          />
        </div>
        <div>
          <label className="block font-semibold mb-1">Label Diskon / Mekanik</label>
          <input
            type="text"
            value={discountLabel}
            onChange={(e) => setDiscountLabel(e.target.value)}
            className="w-full rounded-xl border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-3.5 py-2.5"
          />
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block font-semibold mb-1">Target Penjualan (Rp)</label>
          <input
            type="number"
            value={targetSales}
            onChange={(e) => setTargetSales(e.target.value)}
            className="w-full rounded-xl border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-3.5 py-2.5 font-mono"
          />
        </div>
        <div>
          <label className="block font-semibold mb-1">Status Program</label>
          <select
            value={status}
            onChange={(e) =>
              setStatus(e.target.value as 'Aktif' | 'Terjadwal' | 'Draft' | 'Selesai')
            }
            className="w-full rounded-xl border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-3.5 py-2.5"
          >
            <option value="Aktif">Aktif</option>
            <option value="Terjadwal">Terjadwal</option>
            <option value="Draft">Draft</option>
            <option value="Selesai">Selesai</option>
          </select>
        </div>
      </div>
      <div>
        <label className="block font-semibold mb-1">Lini Produk</label>
        <input
          type="text"
          value={productLine}
          onChange={(e) => setProductLine(e.target.value)}
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
          <Edit3 className="h-3.5 w-3.5" />
          <span>Simpan Campaign</span>
        </button>
      </div>
    </form>
  );
}

/* 16. Edit Campaign Modal (Screen 10) */
export function EditCampaignModal({
  campaign,
  onClose,
  onSaveCampaign,
}: {
  campaign: PrincipalCampaignItem | null;
  onClose: () => void;
  onSaveCampaign: (id: string, patch: Partial<PrincipalCampaignItem>) => void;
}) {
  if (!campaign) return null;

  return (
    <Modal
      open={!!campaign}
      onClose={onClose}
      title={`Edit Campaign — ${campaign.title}`}
      subtitle="Perbarui periode, target penjualan, atau skema promo distributor"
    >
      <EditCampaignForm
        key={campaign.id}
        campaign={campaign}
        onClose={onClose}
        onSaveCampaign={onSaveCampaign}
      />
    </Modal>
  );
}

interface PrincipalProfileFormProps {
  profile: {
    companyName: string;
    email: string;
    monthlyTargetRp: number;
    autoApprovePo: boolean;
  };
  onClose: () => void;
  onSaveProfile: (next: {
    companyName: string;
    email: string;
    monthlyTargetRp: number;
    autoApprovePo: boolean;
  }) => void;
}

function PrincipalProfileForm({
  profile,
  onClose,
  onSaveProfile,
}: PrincipalProfileFormProps) {
  const [companyName, setCompanyName] = useState(profile.companyName);
  const [email, setEmail] = useState(profile.email);
  const [monthlyTargetRp, setMonthlyTargetRp] = useState(String(profile.monthlyTargetRp));
  const [autoApprovePo, setAutoApprovePo] = useState(profile.autoApprovePo);

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSaveProfile({
          companyName: companyName.trim() || profile.companyName,
          email: email.trim() || profile.email,
          monthlyTargetRp: Number(monthlyTargetRp) || profile.monthlyTargetRp,
          autoApprovePo,
        });
        onClose();
      }}
      className="space-y-3 text-xs sm:text-sm"
    >
      <div>
        <label className="block font-semibold mb-1">Nama Perusahaan Principal</label>
        <input
          type="text"
          required
          value={companyName}
          onChange={(e) => setCompanyName(e.target.value)}
          className="w-full rounded-xl border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-3.5 py-2.5"
        />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block font-semibold mb-1">Email Korporat</label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-xl border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-3.5 py-2.5"
          />
        </div>
        <div>
          <label className="block font-semibold mb-1">Target Sales-through / Bulan</label>
          <input
            type="number"
            value={monthlyTargetRp}
            onChange={(e) => setMonthlyTargetRp(e.target.value)}
            className="w-full rounded-xl border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-3.5 py-2.5 font-mono"
          />
        </div>
      </div>
      <label className="flex items-center justify-between rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] p-3.5 cursor-pointer">
        <div>
          <p className="font-bold flex items-center gap-1.5">
            <Settings className="h-4 w-4 text-[#348CB2]" />
            <span>Persetujuan Otomatis PO Distributor Tier-A</span>
          </p>
          <p className="text-[11px] text-[var(--color-text-muted)]">
            PO distributor resmi langsung diproses bila memenuhi MOQ &amp; batas kredit
          </p>
        </div>
        <input
          type="checkbox"
          checked={autoApprovePo}
          onChange={(e) => setAutoApprovePo(e.target.checked)}
          className="h-4 w-4 accent-[#194F70]"
        />
      </label>
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
          Simpan Pengaturan
        </button>
      </div>
    </form>
  );
}

/* 17. Principal Profile & Preferences Modal (Screen 15) */
export function PrincipalProfileModal({
  open,
  onClose,
  profile,
  onSaveProfile,
}: {
  open: boolean;
  onClose: () => void;
  profile: {
    companyName: string;
    email: string;
    monthlyTargetRp: number;
    autoApprovePo: boolean;
  };
  onSaveProfile: (next: {
    companyName: string;
    email: string;
    monthlyTargetRp: number;
    autoApprovePo: boolean;
  }) => void;
}) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Pengaturan Principal & Target Nasional"
      subtitle="Kelola identitas perusahaan Principal, target sales-through, dan otomasi PO"
    >
      {open && (
        <PrincipalProfileForm
          key={`${profile.companyName}-${profile.email}-${profile.monthlyTargetRp}`}
          profile={profile}
          onClose={onClose}
          onSaveProfile={onSaveProfile}
        />
      )}
    </Modal>
  );
}

