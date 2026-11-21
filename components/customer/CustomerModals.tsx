'use client';

import React, { useState } from 'react';
import {
  CheckCircle2,
  Sparkles,
  Award,
  XCircle,
  KeyRound,
  BellRing,
  Sun,
  Moon,
  Truck,
} from 'lucide-react';
import { Modal } from '@/components/common/Modal';
import { SalesGoogleMap } from '@/components/maps/SalesGoogleMap';
import { WorkspaceHubView } from '@/components/portal/SalesWorkspaceModals';
import {
  formatRupiah,
  type Outlet,
  type PromotionItem,
  type RewardItem,
  type RewardLedgerEntry,
  type NotificationItem,
  type CustomerOrderRecord,
  type CustomerContractPrice,
} from '@/lib/salesx-data';

/* ============================================================================
 * 1. CREATE OUTLET ACCOUNT MODAL
 * ============================================================================ */
export function CreateCustomerAccountModal({
  open,
  onClose,
  onSuccess,
}: {
  open: boolean;
  onClose: () => void;
  onSuccess: (outletName: string, email: string) => void;
}) {
  const [outletName, setOutletName] = useState('Toko Berkah Bogor');
  const [picName, setPicName] = useState('Bapak Hendra');
  const [phone, setPhone] = useState('0878-1234-5678');
  const [email, setEmail] = useState('outlet.berkah@example.com');
  const [address, setAddress] = useState('Jl. Pajajaran No. 52, Bogor');
  const [done, setDone] = useState(false);

  return (
    <Modal
      open={open}
      onClose={() => {
        setDone(false);
        onClose();
      }}
      title="Buat Akun Outlet Pelanggan"
      subtitle="Daftar sebagai outlet mitra SalesX-Ai untuk harga kontrak & poin loyalitas"
      maxWidthClass="max-w-md"
    >
      {!done ? (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            setDone(true);
            onSuccess(outletName, email);
          }}
          className="space-y-3 text-xs sm:text-sm"
        >
          <div>
            <label className="block text-xs font-semibold mb-1">
              Nama Outlet / Toko
            </label>
            <input
              required
              type="text"
              value={outletName}
              onChange={(e) => setOutletName(e.target.value)}
              className="w-full rounded-xl border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-3.5 py-2"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold mb-1">
                Nama Pemilik / PIC
              </label>
              <input
                required
                type="text"
                value={picName}
                onChange={(e) => setPicName(e.target.value)}
                className="w-full rounded-xl border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-3.5 py-2"
              />
            </div>
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
          </div>
          <div>
            <label className="block text-xs font-semibold mb-1">
              Email Outlet
            </label>
            <input
              required
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-xl border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-3.5 py-2"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold mb-1">
              Alamat Pengiriman
            </label>
            <input
              required
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="w-full rounded-xl border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-3.5 py-2"
            />
          </div>
          <button
            type="submit"
            className="w-full rounded-xl bg-[#348CB2] hover:bg-[#236D91] py-2.5 text-sm font-bold text-white cursor-pointer"
          >
            Daftarkan Akun Outlet
          </button>
        </form>
      ) : (
        <div className="space-y-4 text-xs">
          <div className="rounded-xl bg-[#ECFDF5] dark:bg-[#064E3B]/40 p-4 text-[#047857] dark:text-[#34D399]">
            <p className="font-bold text-sm">Akun {outletName} Siap</p>
            <p className="mt-1">
              Silakan masuk menggunakan <strong>{email}</strong> untuk mulai
              memesan produk dan mengumpulkan poin SmartReward.
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              setDone(false);
              onClose();
            }}
            className="w-full rounded-xl bg-[#348CB2] py-2.5 font-bold text-white cursor-pointer"
          >
            Lanjutkan Masuk
          </button>
        </div>
      )}
    </Modal>
  );
}

/* ============================================================================
 * 2. CONTRACT PRICING DETAIL & PROMO DETAIL MODALS
 * ============================================================================ */
export function ContractPriceModal({
  item,
  onClose,
  onAddToCart,
}: {
  item: CustomerContractPrice | null;
  onClose: () => void;
  onAddToCart: (sku: string, qty: number) => void;
}) {
  if (!item) return null;
  const savings = item.listPrice - item.contractPrice;
  return (
    <Modal
      open={Boolean(item)}
      onClose={onClose}
      title={item.name}
      subtitle={`SKU ${item.sku} · ${item.packDesc}`}
      maxWidthClass="max-w-md"
    >
      <div className="space-y-4 text-xs">
        <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] p-4 space-y-2.5">
          <div className="flex justify-between">
            <span className="text-[var(--color-text-muted)]">Harga Price List</span>
            <span className="line-through text-[var(--color-text-muted)] tabular-nums">
              {formatRupiah(item.listPrice)} / {item.unit}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="font-semibold">Harga Kontrak Outlet Anda</span>
            <span className="font-bold text-[#348CB2] tabular-nums">
              {formatRupiah(item.contractPrice)} / {item.unit}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-[var(--color-text-muted)]">
              Hemat per {item.unit}
            </span>
            <span className="font-bold text-[#10B981] tabular-nums">
              {formatRupiah(savings)}
            </span>
          </div>
          <div className="pt-2 border-t border-[var(--color-border)] flex justify-between">
            <span className="font-semibold">
              Harga Grosir (≥ {item.minBulkQty} {item.unit})
            </span>
            <span className="font-bold text-[#F97316] tabular-nums">
              {formatRupiah(item.bulkPrice)} / {item.unit}
            </span>
          </div>
        </div>
        <button
          type="button"
          onClick={() => {
            onAddToCart(item.sku, 24);
            onClose();
          }}
          className="w-full rounded-xl bg-[#348CB2] hover:bg-[#236D91] py-2.5 text-sm font-bold text-white cursor-pointer"
        >
          Tambah 1 Kemasan ke Keranjang
        </button>
      </div>
    </Modal>
  );
}

export function CustomerPromoDetailModal({
  promo,
  onClose,
  onUsePromo,
}: {
  promo: PromotionItem | null;
  onClose: () => void;
  onUsePromo: (promo: PromotionItem) => void;
}) {
  if (!promo) return null;
  return (
    <Modal
      open={Boolean(promo)}
      onClose={onClose}
      title={promo.title}
      subtitle={`Berlaku hingga ${promo.validUntil}`}
      maxWidthClass="max-w-md"
    >
      <div className="space-y-4 text-xs">
        <div className="rounded-xl bg-[#FFF7ED] dark:bg-[#431407]/40 border border-[#F97316]/30 p-4">
          <p className="font-bold text-[#C2410C] dark:text-[#FB923C]">
            {promo.discountRule}
          </p>
          <p className="text-[var(--color-text-secondary)] mt-1">
            {promo.subtitle}
          </p>
        </div>
        {promo.terms && (
          <ul className="space-y-2">
            {promo.terms.map((t) => (
              <li key={t} className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-[#10B981] shrink-0 mt-0.5" />
                <span>{t}</span>
              </li>
            ))}
          </ul>
        )}
        <button
          type="button"
          onClick={() => {
            onUsePromo(promo);
            onClose();
          }}
          className="w-full rounded-xl bg-[#348CB2] hover:bg-[#236D91] py-2.5 text-sm font-bold text-white cursor-pointer"
        >
          Terapkan Promo ke Keranjang
        </button>
      </div>
    </Modal>
  );
}

/* ============================================================================
 * 3. DELIVERY ADDRESS & GOOGLE MAPS LOCATION + ORDER DETAIL MODALS
 * ============================================================================ */
export function DeliveryAddressModal({
  open,
  address,
  phone,
  lat,
  lng,
  outletName,
  onClose,
  onSave,
}: {
  open: boolean;
  address: string;
  phone: string;
  lat: number;
  lng: number;
  outletName: string;
  onClose: () => void;
  onSave: (newAddr: string, newPhone: string) => void;
}) {
  const [draftAddr, setDraftAddr] = useState(address);
  const [draftPhone, setDraftPhone] = useState(phone);

  const outletStub: Outlet[] = [
    {
      id: 'cust-loc',
      name: outletName,
      city: 'Kota Bogor',
      address: draftAddr,
      distanceKm: 0,
      isPriority: true,
      visitToday: true,
      status: 'Aktif',
      category: 'Outlet',
      picName: 'Bapak Hendra',
      phone: draftPhone,
      email: 'toko.makmurjaya@example.com',
      lat,
      lng,
      lastOrderTotal: 12_500_000,
      lastVisitDate: 'Hari ini',
    },
  ];

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Alamat & Lokasi Pengiriman Outlet"
      subtitle="Titik lokasi terhubung ke Google Maps Platform untuk akurasi pengiriman"
      maxWidthClass="max-w-lg"
    >
      <div className="space-y-4 text-xs">
        <SalesGoogleMap
          currentPos={{ lat, lng }}
          outlets={outletStub}
          selectedOutlet={outletStub[0]}
          onSelectOutlet={() => {}}
          showRouteToSelected={false}
          heightClass="h-[220px]"
        />
        <div>
          <label className="block font-semibold mb-1">Alamat Pengiriman</label>
          <input
            type="text"
            value={draftAddr}
            onChange={(e) => setDraftAddr(e.target.value)}
            className="w-full rounded-xl border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-3.5 py-2 text-xs sm:text-sm"
          />
        </div>
        <div>
          <label className="block font-semibold mb-1">
            Nomor Telepon Penerima
          </label>
          <input
            type="tel"
            value={draftPhone}
            onChange={(e) => setDraftPhone(e.target.value)}
            className="w-full rounded-xl border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-3.5 py-2 text-xs sm:text-sm tabular-nums"
          />
        </div>
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-[var(--color-border)] px-4 py-2 font-semibold cursor-pointer"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={() => {
              onSave(draftAddr, draftPhone);
              onClose();
            }}
            className="rounded-xl bg-[#348CB2] px-4 py-2 font-bold text-white cursor-pointer"
          >
            Simpan Alamat
          </button>
        </div>
      </div>
    </Modal>
  );
}

export function CustomerOrderDetailModal({
  order,
  onClose,
  onOpenWorkspace,
}: {
  order: CustomerOrderRecord | null;
  onClose: () => void;
  onOpenWorkspace: () => void;
}) {
  if (!order) return null;
  return (
    <Modal
      open={Boolean(order)}
      onClose={onClose}
      title={`Detail Pesanan ${order.id}`}
      subtitle={`Tanggal Order: ${order.dateLabel} · Status: ${order.status}`}
      maxWidthClass="max-w-md"
    >
      <div className="space-y-4 text-xs">
        <div className="divide-y divide-[var(--color-border)] rounded-xl border border-[var(--color-border)] bg-[var(--color-background)]">
          {order.items.map((it) => (
            <div
              key={it.sku}
              className="flex items-center justify-between px-3.5 py-2.5"
            >
              <div>
                <p className="font-bold">{it.name}</p>
                <p className="text-[11px] text-[var(--color-text-muted)] tabular-nums">
                  {it.qty} pcs × {formatRupiah(it.unitPrice)}
                </p>
              </div>
              <span className="font-bold tabular-nums">
                {formatRupiah(it.qty * it.unitPrice)}
              </span>
            </div>
          ))}
        </div>

        <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-3.5 space-y-1.5">
          <div className="flex justify-between">
            <span className="text-[var(--color-text-muted)]">Subtotal</span>
            <span className="tabular-nums">{formatRupiah(order.subtotal)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-[var(--color-text-muted)]">Diskon Promo</span>
            <span className="text-[#10B981] font-semibold tabular-nums">
              - {formatRupiah(order.promoDiscount)}
            </span>
          </div>
          <div className="flex justify-between pt-2 border-t border-[var(--color-border)] text-sm font-bold">
            <span>Total Pembayaran</span>
            <span className="text-[#348CB2] tabular-nums">
              {formatRupiah(order.total)}
            </span>
          </div>
        </div>

        <div className="flex justify-between gap-2">
          <button
            type="button"
            onClick={() => {
              onClose();
              onOpenWorkspace();
            }}
            className="flex-1 rounded-xl border border-[#348CB2] py-2 font-bold text-[#236D91] dark:text-[#87CEEB] cursor-pointer"
          >
            Kirim Faktur via Gmail
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
 * 4. REWARD LEDGER + REDEEM + SUPPORT + WORKSPACE + NOTIFICATIONS MODALS
 * ============================================================================ */
export function RewardRedeemModal({
  reward,
  balance,
  onClose,
  onConfirmRedeem,
}: {
  reward: RewardItem | null;
  balance: number;
  onClose: () => void;
  onConfirmRedeem: (reward: RewardItem) => void;
}) {
  if (!reward) return null;
  const enough = balance >= reward.pointsCost;

  return (
    <Modal
      open={Boolean(reward)}
      onClose={onClose}
      title="Konfirmasi Penukaran Reward"
      subtitle={reward.title}
      maxWidthClass="max-w-sm"
    >
      <div className="space-y-4 text-xs">
        <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] p-4 space-y-2">
          <p className="text-[var(--color-text-secondary)]">
            {reward.description}
          </p>
          <div className="flex justify-between pt-2 border-t border-[var(--color-border)]">
            <span>Biaya Poin</span>
            <span className="font-bold text-[#F97316] tabular-nums">
              {reward.pointsCost.toLocaleString('id-ID')} Poin
            </span>
          </div>
          <div className="flex justify-between">
            <span>Saldo Poin Anda</span>
            <span className="font-bold tabular-nums">
              {balance.toLocaleString('id-ID')} Poin
            </span>
          </div>
        </div>

        {!enough && (
          <p className="rounded-xl bg-red-50 dark:bg-red-950/40 p-3 text-red-700 dark:text-red-300">
            Saldo poin Anda belum mencukupi. Lakukan pemesanan produk promo untuk
            mengumpulkan poin tambahan.
          </p>
        )}

        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-[var(--color-border)] px-4 py-2 font-semibold cursor-pointer"
          >
            Batal
          </button>
          <button
            type="button"
            disabled={!enough}
            onClick={() => {
              onConfirmRedeem(reward);
              onClose();
            }}
            className="rounded-xl bg-[#F97316] disabled:opacity-50 px-4 py-2 font-bold text-white cursor-pointer"
          >
            Tukar Sekarang
          </button>
        </div>
      </div>
    </Modal>
  );
}

export function RewardLedgerModal({
  open,
  ledger,
  balance,
  onClose,
}: {
  open: boolean;
  ledger: RewardLedgerEntry[];
  balance: number;
  onClose: () => void;
}) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Riwayat Poin SmartReward"
      subtitle={`Saldo Poin Saat Ini: ${balance.toLocaleString('id-ID')} Poin`}
      maxWidthClass="max-w-md"
    >
      <div className="space-y-2.5 text-xs max-h-[340px] overflow-y-auto pr-1">
        {ledger.map((entry) => (
          <div
            key={entry.id}
            className="flex items-center justify-between gap-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] p-3"
          >
            <div>
              <p className="font-bold">{entry.title}</p>
              <p className="text-[11px] text-[var(--color-text-muted)] tabular-nums">
                {entry.dateLabel} · {entry.type}
              </p>
            </div>
            <span
              className={`font-bold tabular-nums shrink-0 ${
                entry.pointsDelta >= 0 ? 'text-[#10B981]' : 'text-[#F97316]'
              }`}
            >
              {entry.pointsDelta >= 0 ? '+' : ''}
              {entry.pointsDelta.toLocaleString('id-ID')}
            </span>
          </div>
        ))}
      </div>
    </Modal>
  );
}

export function CustomerSupportModal({
  open,
  outletName,
  onClose,
}: {
  open: boolean;
  outletName: string;
  onClose: () => void;
}) {
  const [question, setQuestion] = useState(
    'Bagaimana cara mengecek status pengiriman order ORD-20251024-001 dan syarat promo Minuman Energi?'
  );
  const [reply, setReply] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const askSupportAi = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/gemini/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: question,
          context: `Pelanggan Customer Portal: ${outletName}. Order aktif ORD-20251024-001 (Rp 227.700, status Diproses). Promo aktif: Diskon 20% Minuman Energi 250 ml s/d 31 Okt 2026.`,
        }),
      });
      const data = await res.json();
      setReply(data.text || data.error || 'Tim support siap membantu Anda.');
    } catch {
      setReply('Layanan chat sedang sibuk. Silakan hubungi WhatsApp Support +62 811-8890-2026.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Customer Support SalesX-Ai"
      subtitle="Bantuan instan outlet & kontak tim distributor resmi"
      maxWidthClass="max-w-md"
    >
      <div className="space-y-4 text-xs">
        <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] p-3.5 space-y-2">
          <p className="font-bold">Tanya Asisten Bantuan Outlet</p>
          <textarea
            rows={3}
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            className="w-full rounded-xl border border-[var(--color-border-strong)] bg-[var(--color-surface)] p-2.5"
          />
          <button
            type="button"
            onClick={askSupportAi}
            disabled={loading}
            className="inline-flex items-center gap-1.5 rounded-xl bg-[#348CB2] hover:bg-[#236D91] px-4 py-2 font-bold text-white cursor-pointer"
          >
            <Sparkles className="h-3.5 w-3.5" />
            <span>{loading ? 'Memproses...' : 'Kirim Pertanyaan'}</span>
          </button>
        </div>

        {reply && (
          <div className="rounded-xl border border-[#ADD8E6] bg-[#F3FAFC] dark:bg-[#172438] p-3.5 whitespace-pre-line leading-relaxed">
            {reply}
          </div>
        )}

        <div className="rounded-xl border border-[var(--color-border)] p-3.5 space-y-1 text-[var(--color-text-secondary)]">
          <p className="font-bold text-[var(--color-text-primary)]">
            Kontak Distributor PT Maju Distribusi
          </p>
          <p>WhatsApp Layanan Outlet: +62 811-8890-2026</p>
          <p>Email Billing & Order: support@majudistribusi.co.id</p>
        </div>
      </div>
    </Modal>
  );
}

export function CustomerWorkspaceModal({
  open,
  outletProfile,
  onClose,
}: {
  open: boolean;
  outletProfile: Outlet;
  onClose: () => void;
}) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Google Workspace & Faktur Outlet"
      subtitle="Kirim salinan invoice ke Gmail atau jadwalkan penerimaan pengiriman di Google Calendar"
      maxWidthClass="max-w-3xl"
    >
      <WorkspaceHubView
        outlets={[outletProfile]}
        prefillEmailTo={outletProfile.email}
        prefillCalendarOutlet={outletProfile}
      />
    </Modal>
  );
}

export function CustomerNotificationsModal({
  open,
  notifications,
  onMarkRead,
  onClose,
}: {
  open: boolean;
  notifications: NotificationItem[];
  onMarkRead: () => void;
  onClose: () => void;
}) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Notifikasi Outlet"
      subtitle="Status pesanan, promo khusus outlet, dan pembaruan poin"
      maxWidthClass="max-w-md"
    >
      <div className="space-y-3 text-xs">
        <div className="flex justify-end">
          <button
            type="button"
            onClick={onMarkRead}
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
                <p className="font-bold">{n.title}</p>
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

export function CollectPointsInfoModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Cara Kumpulkan Poin SmartReward"
      subtitle="Semakin rutin berbelanja, semakin cepat poin terkumpul"
      maxWidthClass="max-w-sm"
    >
      <ul className="space-y-2.5 text-xs">
        {[
          'Setiap Rp 10.000 pembelian di Katalog menghasilkan 10 Poin otomatis.',
          'Gunakan promo "Point x2 Semua Produk" untuk menggandakan poin setiap order.',
          'Pesanan yang selesai tepat waktu mendapat bonus poin loyalitas bulanan.',
        ].map((item) => (
          <li key={item} className="flex items-start gap-2">
            <Award className="h-4 w-4 text-[#F97316] shrink-0 mt-0.5" />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </Modal>
  );
}

/* ============================================================================
 * 5. ORDER SUCCESS, CANCEL ORDER & ACCOUNT SETTINGS MODALS
 * ============================================================================ */
export function OrderSuccessModal({
  result,
  onClose,
  onTrackOrder,
  onBrowseCatalog,
}: {
  result: {
    orderId: string;
    total: number;
    earnedPoints?: number;
    deliveryDate: string;
  } | null;
  onClose: () => void;
  onTrackOrder: () => void;
  onBrowseCatalog: () => void;
}) {
  if (!result) return null;
  return (
    <Modal
      open={Boolean(result)}
      onClose={onClose}
      title="Pesanan Berhasil Dikirim!"
      subtitle={`Nomor Referensi: ${result.orderId}`}
      maxWidthClass="max-w-sm"
    >
      <div className="space-y-4 text-xs text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#ECFDF5] dark:bg-[#064E3B]/50 text-[#10B981]">
          <CheckCircle2 className="h-8 w-8" />
        </div>
        <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-background)] p-4 space-y-2 text-left">
          <div className="flex justify-between">
            <span className="text-[var(--color-text-muted)]">ID Order</span>
            <span className="font-mono font-bold">{result.orderId}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-[var(--color-text-muted)]">
              Jadwal Pengiriman
            </span>
            <span className="font-semibold tabular-nums">
              {result.deliveryDate}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-[var(--color-text-muted)]">
              Total Pembayaran
            </span>
            <span className="font-bold text-[#348CB2] tabular-nums">
              {formatRupiah(result.total)}
            </span>
          </div>
          {result.earnedPoints != null && (
            <div className="flex justify-between pt-2 border-t border-[var(--color-border)]">
              <span className="font-semibold text-[#F97316]">Bonus SmartReward</span>
              <span className="font-bold text-[#F97316] tabular-nums">+{result.earnedPoints.toLocaleString('id-ID')} Poin</span>
            </div>
          )}
        </div>
        <div className="space-y-2">
          <button
            type="button"
            onClick={onTrackOrder}
            className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-[#236D91] hover:bg-[#194F70] py-2.5 text-sm font-bold text-white cursor-pointer"
          >
            <Truck className="h-4 w-4" />
            <span>Lacak Status Pesanan</span>
          </button>
          <button
            type="button"
            onClick={onBrowseCatalog}
            className="w-full rounded-xl border border-[var(--color-border)] py-2.5 text-xs font-semibold hover:bg-[var(--color-surface-muted)] cursor-pointer"
          >
            Lanjut Belanja di Katalog
          </button>
        </div>
      </div>
    </Modal>
  );
}

export function CancelCustomerOrderModal({
  order,
  onClose,
  onConfirmCancel,
}: {
  order: CustomerOrderRecord | null;
  onClose: () => void;
  onConfirmCancel: (orderId: string, reason: string) => void;
}) {
  const [reason, setReason] = useState('Ingin mengubah jumlah atau daftar SKU pesanan');
  if (!order) return null;

  const quickReasons = [
    'Ingin mengubah jumlah atau daftar SKU pesanan',
    'Salah memilih jadwal pengiriman outlet',
    'Promo atau voucher SmartReward belum diterapkan',
  ];

  return (
    <Modal
      open={Boolean(order)}
      onClose={onClose}
      title={`Batalkan Pesanan ${order.id}?`}
      subtitle={`Total ${formatRupiah(order.total)} · Status saat ini: ${order.status}`}
      maxWidthClass="max-w-md"
    >
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (!reason.trim()) return;
          onConfirmCancel(order.id, reason.trim());
          onClose();
        }}
        className="space-y-3.5 text-xs"
      >
        <div className="rounded-xl border border-red-200 dark:border-red-900/40 bg-red-50 dark:bg-red-950/30 p-3 flex items-start gap-2 text-red-700 dark:text-red-300">
          <XCircle className="h-4 w-4 shrink-0 mt-0.5" />
          <span>
            Pembatalan hanya tersedia selama pesanan belum dikirim oleh armada distributor.
          </span>
        </div>

        <div className="space-y-1.5">
          <p className="font-semibold">Pilih Alasan Cepat</p>
          <div className="flex flex-wrap gap-1.5">
            {quickReasons.map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setReason(r)}
                className={`rounded-lg border px-2.5 py-1.5 text-[11px] font-semibold text-left cursor-pointer ${
                  reason === r
                    ? 'border-[#348CB2] bg-[#E5F4F8] dark:bg-[#19394B] text-[#123A54] dark:text-[#87CEEB]'
                    : 'border-[var(--color-border)] bg-[var(--color-surface)]'
                }`}
              >
                {r}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block font-semibold mb-1">
            Catatan Pembatalan
          </label>
          <textarea
            required
            rows={2}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="w-full rounded-xl border border-[var(--color-border-strong)] bg-[var(--color-surface)] p-2.5"
          />
        </div>

        <div className="flex justify-end gap-2 pt-1">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-[var(--color-border)] px-4 py-2 font-semibold cursor-pointer"
          >
            Kembali
          </button>
          <button
            type="submit"
            className="rounded-xl bg-red-600 hover:bg-red-700 px-4 py-2 font-bold text-white cursor-pointer"
          >
            Konfirmasi Batalkan Order
          </button>
        </div>
      </form>
    </Modal>
  );
}

export function CustomerAccountSettingsModal({
  open,
  email,
  theme,
  notifPrefs,
  onToggleTheme,
  onToggleNotifPref,
  onChangePassword,
  onClose,
}: {
  open: boolean;
  email: string;
  theme: 'light' | 'dark';
  notifPrefs: {
    orderUpdates: boolean;
    promoAlerts: boolean;
    rewardReminders: boolean;
  };
  onToggleTheme: () => void;
  onToggleNotifPref: (key: 'orderUpdates' | 'promoAlerts' | 'rewardReminders') => void;
  onChangePassword: (newPwd: string) => void;
  onClose: () => void;
}) {
  const [oldPwd, setOldPwd] = useState('');
  const [newPwd, setNewPwd] = useState('');
  const [confirmPwd, setConfirmPwd] = useState('');
  const [pwdMsg, setPwdMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const handlePwdSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!oldPwd.trim() || newPwd.length < 8) {
      setPwdMsg({
        ok: false,
        text: 'Masukkan kata sandi lama dan kata sandi baru minimal 8 karakter.',
      });
      return;
    }
    if (newPwd !== confirmPwd) {
      setPwdMsg({
        ok: false,
        text: 'Konfirmasi kata sandi baru tidak cocok.',
      });
      return;
    }
    onChangePassword(newPwd);
    setPwdMsg({ ok: true, text: 'Kata sandi akun outlet berhasil diperbarui.' });
    setOldPwd('');
    setNewPwd('');
    setConfirmPwd('');
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Pengaturan Akun & Keamanan"
      subtitle={`Akun terdaftar: ${email}`}
      maxWidthClass="max-w-md"
    >
      <div className="space-y-4 text-xs">
        {/* Theme & Notifications */}
        <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-background)] p-3.5 space-y-3">
          <div className="flex items-center justify-between">
            <span className="font-bold flex items-center gap-2">
              {theme === 'light' ? (
                <Sun className="h-4 w-4 text-[#F97316]" />
              ) : (
                <Moon className="h-4 w-4 text-[#348CB2]" />
              )}
              <span>Mode Tampilan</span>
            </span>
            <button
              type="button"
              onClick={onToggleTheme}
              className="rounded-lg bg-[#E5F4F8] dark:bg-[#19394B] px-3 py-1.5 font-bold text-[#236D91] dark:text-[#87CEEB] cursor-pointer"
            >
              {theme === 'light' ? 'Aktifkan Mode Gelap' : 'Aktifkan Mode Terang'}
            </button>
          </div>

          <div className="pt-2.5 border-t border-[var(--color-border)] space-y-2">
            <p className="font-bold flex items-center gap-1.5 text-[var(--color-text-primary)]">
              <BellRing className="h-3.5 w-3.5 text-[#348CB2]" />
              <span>Preferensi Notifikasi</span>
            </p>
            {(
              [
                { key: 'orderUpdates', label: 'Update Status Pesanan & Pengiriman' },
                { key: 'promoAlerts', label: 'Promo Khusus Outlet & Diskon SKU' },
                { key: 'rewardReminders', label: 'Pengingat Poin & Voucher SmartReward' },
              ] as const
            ).map((pref) => (
              <label
                key={pref.key}
                className="flex items-center justify-between gap-2 cursor-pointer"
              >
                <span className="text-[var(--color-text-secondary)]">
                  {pref.label}
                </span>
                <input
                  type="checkbox"
                  checked={notifPrefs[pref.key]}
                  onChange={() => onToggleNotifPref(pref.key)}
                  className="h-4 w-4 rounded accent-[#348CB2]"
                />
              </label>
            ))}
          </div>
        </div>

        {/* Password Change Form */}
        <form
          onSubmit={handlePwdSubmit}
          className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-background)] p-3.5 space-y-2.5"
        >
          <p className="font-bold flex items-center gap-1.5">
            <KeyRound className="h-3.5 w-3.5 text-[#348CB2]" />
            <span>Ubah Kata Sandi</span>
          </p>
          {pwdMsg && (
            <p
              className={`rounded-xl px-3 py-2 text-[11px] font-semibold ${
                pwdMsg.ok
                  ? 'bg-[#ECFDF5] dark:bg-[#064E3B]/40 text-[#047857] dark:text-[#34D399]'
                  : 'bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300'
              }`}
            >
              {pwdMsg.text}
            </p>
          )}
          <input
            type="password"
            value={oldPwd}
            onChange={(e) => setOldPwd(e.target.value)}
            placeholder="Kata sandi saat ini"
            className="w-full rounded-xl border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-3 py-2"
          />
          <div className="grid grid-cols-2 gap-2">
            <input
              type="password"
              value={newPwd}
              onChange={(e) => setNewPwd(e.target.value)}
              placeholder="Sandi baru (min 8)"
              className="w-full rounded-xl border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-3 py-2"
            />
            <input
              type="password"
              value={confirmPwd}
              onChange={(e) => setConfirmPwd(e.target.value)}
              placeholder="Ulangi sandi baru"
              className="w-full rounded-xl border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-3 py-2"
            />
          </div>
          <button
            type="submit"
            className="w-full rounded-xl bg-[#348CB2] hover:bg-[#236D91] py-2 font-bold text-white cursor-pointer"
          >
            Perbarui Kata Sandi
          </button>
        </form>
      </div>
    </Modal>
  );
}

