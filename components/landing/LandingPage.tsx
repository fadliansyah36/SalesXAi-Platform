'use client';
import { getSalesXPortalUrlForPath } from '@/components/auth/portalUrls';

import React, { useState } from 'react';
import Link from 'next/link';
import { motion } from 'motion/react';
import {
  Users,
  ShoppingCart,
  Gift,
  Zap,
  Layers,
  ShieldCheck,
  Target,
  MapPin,
  Package,
  Megaphone,
  Bell,
  BarChart3,
  GitBranch,
  Link2,
  CheckCircle2,
  ArrowRight,
  Calendar,
  ChevronDown,
  Menu,
  X,
  Sun,
  Moon,
  Bot,
  Wand2,
  Briefcase,
  Building2,
  User,
  Mail,
  Phone,
  Navigation,
  Clock,
  Cpu,
  Mic,
  Image as ImageIcon,
  MapPinned,
  WifiOff,
  MessageSquare,
  Lock,
  Globe,
  Compass,
  FileCheck2,
} from 'lucide-react';
import { BrandLogo } from '@/components/common/BrandLogo';
import { PWAInstallButton } from '@/components/common/PWAInstallButton';
import { Modal } from '@/components/common/Modal';
import { useTheme } from '@/components/providers/AppProviders';
import { LANDING_FAQ_ITEMS } from '@/lib/salesx-data';

interface FeatureDetail {
  title: string;
  category: string;
  description: string;
  bullets: string[];
}

const CORE_PRODUCTS: FeatureDetail[] = [
  {
    title: 'SmartTeam',
    category: 'Field Operations',
    description:
      'Kelola tim sales, absensi geofence, jadwal kunjungan outlet, bukti kunjungan foto, dan rute perjalanan secara real-time.',
    bullets: [
      'Absensi masuk/pulang tervalidasi radius geofence kantor & outlet.',
      'Visit planner dengan prioritas outlet dan optimasi rute perjalanan.',
      'Pelacakan GPS hanya aktif saat sesi kerja dengan audit akses transparan.',
      'Mendukung antrean offline pada aplikasi mobile saat sinyal terbatas.',
    ],
  },
  {
    title: 'SmartOrder',
    category: 'Commerce & Distribution',
    description:
      'Kelola katalog SKU, pemesanan (order) idempotent, validasi harga & diskon deterministik, dan stok inventori distributor.',
    bullets: [
      'Perhitungan harga, diskon promosi, dan stok divalidasi server secara deterministik.',
      'Snapshot harga transaksi tersimpan rapi di setiap nomor order.',
      'Alur persetujuan dan pelacakan status dari Diproses hingga Selesai.',
      'Terintegrasi dengan portal Customer, Sales, Distributor, dan Principal.',
    ],
  },
  {
    title: 'SmartReward',
    category: 'Loyalty & Incentive',
    description:
      'Program loyalitas outlet, insentif tim sales, dan katalog reward berbasis ledger yang dapat diaudit untuk meningkatkan penjualan.',
    bullets: [
      'Pencatatan poin berbasis ledger append-oriented yang akurat.',
      'Aturan kelayakan (eligibility) dan kampanye poin ganda otomatis.',
      'Penukaran reward (redemption) tervalidasi saldo secara real-time.',
      'Analitik efektivitas program loyalitas untuk Company dan Principal.',
    ],
  },
];

const EXTRA_FEATURES: Array<{
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  summary: string;
  bullets: string[];
}> = [
  {
    title: 'Manajemen Target & KPI',
    icon: Target,
    summary:
      'Penetapan target penjualan per sales, wilayah, dan kategori produk dengan pemantauan realisasi harian.',
    bullets: [
      'Progres target bulanan & tren realisasi per bulan.',
      'Indikator pencapaian kunjungan efektif dan cakupan outlet.',
    ],
  },
  {
    title: 'Manajemen Outlet & Area',
    icon: MapPin,
    summary:
      'Direktori outlet General Trade & Modern Trade lengkap dengan PIC, koordinat GPS, dan penugasan teritori.',
    bullets: [
      'Filter outlet prioritas dan jadwal kunjungan hari ini.',
      'Riwayat transaksi dan kunjungan tiap toko.',
    ],
  },
  {
    title: 'Inventori & Stok',
    icon: Package,
    summary:
      'Visibilitas stok SKU per distributor untuk memastikan ketersediaan barang sebelum pemesanan.',
    bullets: [
      'Peringatan stok menipis dan pergerakan barang real-time.',
      'Sinkronisasi otomatis dengan modul SmartOrder.',
    ],
  },
  {
    title: 'Promo & Campaign',
    icon: Megaphone,
    summary:
      'Pengaturan diskon produk, paket beli gratis, dan kampanye display rak dengan validasi foto kunjungan.',
    bullets: [
      'Masa berlaku promo terjadwal dan terukur.',
      'Penerapan diskon otomatis saat pembuatan order.',
    ],
  },
  {
    title: 'Notifikasi & Pengingat',
    icon: Bell,
    summary:
      'Pengingat jadwal shift, kunjungan jatuh tempo, konfirmasi order, dan pencapaian target.',
    bullets: [
      'Inbox notifikasi aktivitas & sistem dalam aplikasi PWA.',
      'Dukungan pengingat proaktif sesuai jam kerja.',
    ],
  },
  {
    title: 'Laporan & Analitik',
    icon: BarChart3,
    summary:
      'Ringkasan penjualan harian, mingguan, dan bulanan per wilayah, produk, dan outlet.',
    bullets: [
      'Metrik konsisten dengan satuan waktu dan sumber data jelas.',
      'Ekspor laporan operasional dan eksekutif.',
    ],
  },
  {
    title: 'Workflow & Approval',
    icon: GitBranch,
    summary:
      'Otomatisasi alur kerja dengan persetujuan berjenjang (human-governed) untuk transaksi bernilai tinggi.',
    bullets: [
      'Jejak audit perubahan assignment, target, dan order.',
      'Persetujuan konten promosi sebelum dipublikasikan.',
    ],
  },
  {
    title: 'Integrasi & Ekstensi',
    icon: Link2,
    summary:
      'Terhubung dengan Google Maps Platform, Gmail, Google Calendar, Google Meet, dan ekosistem AI.',
    bullets: [
      'Navigasi & rute akurat menggunakan Google Maps Platform.',
      'Sinkronisasi jadwal kunjungan ke Calendar dan tindak lanjut via Gmail/Meet.',
    ],
  },
];

type AiLayerId = 'orchestrator' | 'agents' | 'guardrails';
type AdvantageCategory =
  | 'Semua'
  | 'Akuisisi & Lapangan'
  | 'Kolaborasi & Ekosistem'
  | 'Keamanan & Multi-Portal';

interface AiLayerSpec {
  id: AiLayerId;
  label: string;
  headline: string;
  summary: string;
  metricsLabel: string;
  pillars: Array<{
    title: string;
    tag: string;
    description: string;
    detailBullets: string[];
  }>;
}

const AI_TECH_LAYERS: AiLayerSpec[] = [
  {
    id: 'orchestrator',
    label: 'Unified AI Orchestrator',
    headline: 'Satu Pusat Orkestrasi Multimodal untuk Seluruh Modul Sales',
    summary:
      'Model Router SalesX-Ai memilih jalur pemrosesan paling tepat untuk penalaran percakapan, ekstraksi data terstruktur, transkripsi suara lapangan, hingga pembuatan materi visual promosi.',
    metricsLabel: 'Multimodal · Context Engine · Knowledge RAG',
    pillars: [
      {
        title: 'AI Sales Assistant & Territory Context',
        tag: 'Penalaran Operasional',
        description:
          'Menjawab pertanyaan kinerja harian, peluang reorder outlet, dan prioritas kunjungan berdasarkan data aktual wilayah serta katalog produk aktif.',
        detailBullets: [
          'Membaca konteks outlet binaan, histori order, dan target bulanan sales.',
          'Menyertakan ringkasan alasan dan rekomendasi langkah tindak lanjut.',
          'Menolak mengarang metrik apabila data periode belum tersedia.',
        ],
      },
      {
        title: 'Voice-to-Report Transkripsi Lapangan',
        tag: 'Audio & Speech AI',
        description:
          'Sales dapat merekam catatan hasil kunjungan outlet secara lisan di lapangan, lalu sistem mengubahnya menjadi ringkasan teks rapi pada bukti kunjungan.',
        detailBullets: [
          'Mendukung Bahasa Indonesia percakapan lapangan secara natural.',
          'Menghemat waktu input laporan setelah selesai bertemu PIC toko.',
          'Terhubung langsung ke form Check-in & Bukti Kunjungan.',
        ],
      },
      {
        title: 'AI Route & Visit Priority Planner',
        tag: 'Optimasi Rute',
        description:
          'Menyusun rekomendasi urutan kunjungan outlet paling efisien dengan mempertimbangkan kedekatan geografis, jadwal toko, dan status prioritas.',
        detailBullets: [
          'Bekerja selaras dengan koordinat Google Maps Platform.',
          'Mengurangi waktu tempuh antar titik kunjungan di area kerja.',
          'Dapat disesuaikan ulang secara manual oleh sales sebelum disimpan.',
        ],
      },
    ],
  },
  {
    id: 'agents',
    label: 'Agen AI & Content Studio',
    headline: 'Agen Spesialis Terkoordinasi untuk Penjualan & Pemasaran',
    summary:
      'Setiap agen memiliki peran, memori konteks, dan batasan kewenangan jelas—mulai dari Sales Coach lapangan hingga Content Strategist untuk materi promosi resmi.',
    metricsLabel: 'Agent Registry · Brand Compliance · Content Studio',
    pillars: [
      {
        title: 'Sales Coach & Outlet Intelligence Agent',
        tag: 'Produktivitas Tim',
        description:
          'Menganalisis celah pencapaian target (target gap), mengidentifikasi outlet yang lama tidak melakukan reorder, dan memberi tips pendekatan produk.',
        detailBullets: [
          'Memantau perbandingan realisasi vs target secara harian.',
          'Menyarankan SKU unggulan yang relevan dengan karakter tiap outlet.',
          'Tersedia di Web Sales Portal maupun aplikasi mobile lapangan.',
        ],
      },
      {
        title: 'AI Content Studio (Poster, Caption & Video)',
        tag: 'Pemasaran Produk',
        description:
          'Menghasilkan materi promosi produk lengkap—teks caption media sosial, poster promosi 1K–4K, dan konsep video pendek—yang tetap konsisten dengan promo resmi.',
        detailBullets: [
          'Mendukung format rasio 1:1, 4:5, dan 9:16 siap kirim ke WhatsApp outlet.',
          'Validasi konsistensi nama produk, harga, dan periode promo berlaku.',
          'Dilengkapi aksi Edit Prompt, Unduh, dan Bagikan langsung.',
        ],
      },
      {
        title: 'Memory & Provenance Terkendali',
        tag: 'Konteks Terstruktur',
        description:
          'Mengingat preferensi komunikasi dan riwayat interaksi dalam batas ruang tenant sehingga rekomendasi semakin relevan dari waktu ke waktu.',
        detailBullets: [
          'Isolasi memori ketat per tenant dan per peran pengguna.',
          'Pemfilteran data sensitif sebelum diproses oleh model AI.',
          'Mendukung kebijakan retensi dan audit akses perusahaan.',
        ],
      },
    ],
  },
  {
    id: 'guardrails',
    label: 'Guardrails & Kontrol Manusia',
    headline: 'AI Membantu Keputusan, Aturan Bisnis Menjaga Akurasi Finansial',
    summary:
      'SalesX-Ai memisahkan kecerdasan generatif dari kalkulasi transaksi inti. Harga, diskon, stok, dan poin loyalitas tetap dikendalikan aturan bisnis deterministik.',
    metricsLabel: 'Deterministic Rules · Approval Engine · Audit Trail',
    pillars: [
      {
        title: 'Kalkulasi Harga & Stok Deterministik',
        tag: 'Integritas Transaksi',
        description:
          'LLM hanya membantu menyiapkan saran atau draf order, sedangkan subtotal, potongan promo, ketersediaan stok, dan poin SmartReward selalu dihitung server.',
        detailBullets: [
          'Mencegah kesalahan harga atau diskon fiktif pada faktur pelanggan.',
          'Snapshot harga transaksi tersimpan permanen di setiap nomor order.',
          'Mendukung proses pemesanan idempotent agar tidak terjadi order ganda.',
        ],
      },
      {
        title: 'Human-Governed Approval (Level L0–L4)',
        tag: 'Tata Kelola AI',
        description:
          'Operasi berisiko tinggi seperti pengiriman email ke pelanggan, penjadwalan kalender, atau perubahan status transaksi memerlukan konfirmasi pengguna.',
        detailBullets: [
          'Dialog tinjauan wajib sebelum mengirim email Gmail atau acara Calendar.',
          'Tingkat otonomi agen dapat dikonfigurasi oleh admin perusahaan.',
          'Setiap rekomendasi disertai konteks dan dapat ditolak atau diubah.',
        ],
      },
      {
        title: 'AI Usage Metering & Jejak Audit',
        tag: 'Transparansi Enterprise',
        description:
          'Seluruh pemanggilan alat (Tool Gateway), rekomendasi penting, dan pembuatan materi tercatat untuk kebutuhan pemantauan biaya serta kepatuhan.',
        detailBullets: [
          'Verifikasi izin pengguna ulang setiap kali alat AI dieksekusi.',
          'Kunci API dan kredensial provider tersimpan aman di sisi server.',
          'Menjaga keamanan data bisnis multi-cabang dan multi-distributor.',
        ],
      },
    ],
  },
];

const ADDITIONAL_ADVANTAGE_FEATURES: Array<{
  title: string;
  category: Exclude<AdvantageCategory, 'Semua'>;
  meta: string;
  icon: React.ComponentType<{ className?: string }>;
  summary: string;
  bullets: string[];
}> = [
  {
    title: 'Pencarian Lanjutan Leads & Google Maps',
    category: 'Akuisisi & Lapangan',
    meta: 'Prospek · Places API Resmi',
    icon: MapPinned,
    summary:
      'Saring daftar prospek berdasarkan nama, status, kategori produk, dan tanggal interaksi, sekaligus cari bisnis baru langsung dari Google Maps lengkap dengan nomor kontak.',
    bullets: [
      'Filter multi-kriteria (Status Prospek, Kategori Produk, Rentang Tanggal) dan ekspor CSV.',
      'Pencarian bisnis resmi Google Maps Platform beserta nomor telepon, alamat, dan rating.',
      'Simpan temuan Maps menjadi Lead dan konversi langsung ke Outlet Binaan & Order.',
    ],
  },
  {
    title: 'PWA Offline-First & Sinkronisasi Antrean',
    category: 'Akuisisi & Lapangan',
    meta: 'Mobile & Web · Tahan Sinyal Lemah',
    icon: WifiOff,
    summary:
      'Sales lapangan tetap dapat melihat katalog, menyusun draft order, dan mencatat kunjungan di area minim sinyal; seluruh antrean terkirim otomatis saat internet kembali.',
    bullets: [
      'Unduh data katalog, daftar outlet, dan promo aktif untuk akses offline.',
      'Status sinkronisasi transparan per modul (Kunjungan, Order, Foto, Lokasi GPS).',
      'Deduplikasi transaksi mencegah pengiriman data ganda saat koneksi pulih.',
    ],
  },
  {
    title: 'Integrasi Langsung Google Workspace',
    category: 'Kolaborasi & Ekosistem',
    meta: 'Gmail · Calendar · Google Meet',
    icon: Mail,
    summary:
      'Tindak lanjuti outlet dan prospek tanpa berpindah aplikasi: kirim penawaran via Gmail, jadwalkan kunjungan di Google Calendar, hingga buat tautan Google Meet instan.',
    bullets: [
      'OAuth Google Workspace terverifikasi langsung atas otorisasi akun pengguna.',
      'Prapengisian alamat email outlet & lokasi acara dari data CRM/Leads.',
      'Konfirmasi eksplisit sebelum email atau undangan kalender dikirimkan.',
    ],
  },
  {
    title: 'Telegram Proactive Assistant Bot',
    category: 'Kolaborasi & Ekosistem',
    meta: 'Bot Interaktif · Notifikasi Shift',
    icon: MessageSquare,
    summary:
      'Terima briefing jadwal harian, ringkasan omzet, dan pengingat kunjungan jatuh tempo langsung di Telegram dengan tautan akun sekali pakai yang aman.',
    bullets: [
      'Perintah cepat /today, /sales, /target, dan /outlet langsung dari chat Telegram.',
      'Aktivasi aman menggunakan One-Time Link Token dari profil portal.',
      'Kontrol jam tenang (quiet hours) dan preferensi notifikasi per pengguna.',
    ],
  },
  {
    title: 'Arsitektur Multi-Portal & Multi-Tenant',
    category: 'Keamanan & Multi-Portal',
    meta: '8 Portal Peran · Satu Sumber Data',
    icon: Globe,
    summary:
      'Menghubungkan Customer/Outlet, Sales, Supervisor, Distributor, Principal, Company Admin, hingga Platform Super Admin dengan batasan hak akses yang tegas.',
    bullets: [
      'Isolasi data antar perusahaan (tenant), cabang, dan wilayah operasional.',
      'Visibilitas stok & pemenuhan order real-time antara Distributor dan Principal.',
      'Portal terpadu namun tetap dapat dikembangkan dan dirilis secara modular.',
    ],
  },
  {
    title: 'Kepatuhan Privasi GPS & Audit Geofence',
    category: 'Keamanan & Multi-Portal',
    meta: 'Geofence 100 m · Sesi Kerja Eksplisit',
    icon: Lock,
    summary:
      'Pelacakan lokasi GPS hanya berjalan ketika sesi kerja aktif dan berhenti otomatis saat absen pulang, dilengkapi catatan akurasi serta audit akses supervisor.',
    bullets: [
      'Indikator status GPS, akurasi meter, dan jadwal shift terlihat jelas oleh sales.',
      'Validasi radius geofence saat absensi kantor maupun check-in kunjungan outlet.',
      'Jejak audit transparan untuk melindungi privasi tim di luar jam kerja.',
    ],
  },
];

export function LandingPage() {
  const { theme, toggleTheme } = useTheme();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [selectedDetail, setSelectedDetail] = useState<FeatureDetail | null>(
    null
  );
  const [openFaqIdx, setOpenFaqIdx] = useState<number | null>(0);

  // Interactive Content Preview on Landing Page
  const [previewPrompt, setPreviewPrompt] = useState(
    'Promosi produk Minuman Energi 250 ml diskon 20% untuk outlet Bogor'
  );
  const [previewResult, setPreviewResult] = useState(
    'Promo Produk Baru! Dapatkan penawaran spesial diskon 20% Minuman Energi 250 ml khusus untuk outlet pilihan Anda minggu ini.'
  );
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState<string | null>(null);

  // Registration & Demo Form State
  const [formTab, setFormTab] = useState<'subscribe' | 'demo'>('subscribe');
  const [fullName, setFullName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [email, setEmail] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [selectedPlan, setSelectedPlan] = useState('Growth (Rp 4.900.000/bulan)');
  const [demoDate, setDemoDate] = useState('2026-11-25');
  const [formError, setFormError] = useState<string | null>(null);
  const [submittedModal, setSubmittedModal] = useState(false);
  const [legalModalOpen, setLegalModalOpen] = useState(false);
  const [supportModalOpen, setSupportModalOpen] = useState(false);
  const [activeAiLayer, setActiveAiLayer] = useState<AiLayerId>('orchestrator');
  const [advantageFilter, setAdvantageFilter] =
    useState<AdvantageCategory>('Semua');

  const handleGeneratePreview = async () => {
    if (!previewPrompt.trim()) return;
    setPreviewLoading(true);
    setPreviewError(null);
    try {
      const res = await fetch('/api/gemini/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'gemini-3.1-flash-lite',
          message: `Buatkan 1 teks promosi singkat (maksimal 25 kata, menarik, jelas, Bahasa Indonesia) untuk outlet retail berdasarkan brief ini: ${previewPrompt}`,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setPreviewError(data.error || 'Gagal menghasilkan konten.');
      } else if (data.text) {
        setPreviewResult(data.text);
      }
    } catch {
      setPreviewError('Koneksi ke server AI terputus.');
    } finally {
      setPreviewLoading(false);
    }
  };

  const handleChoosePlan = (planLabel: string) => {
    setSelectedPlan(planLabel);
    setFormTab('subscribe');
    const el = document.getElementById('daftar');
    el?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSubmitRegistration = (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !fullName.trim() ||
      !companyName.trim() ||
      !email.trim() ||
      !whatsapp.trim()
    ) {
      setFormError('Mohon lengkapi seluruh data pendaftaran Anda.');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setFormError('Format alamat email tidak valid.');
      return;
    }
    setFormError(null);
    setSubmittedModal(true);
  };

  return (
    <div className="min-h-screen overflow-x-hidden bg-[var(--color-background)] text-[var(--color-text-primary)]">
      {/* Top Navigation Bar — Strict 3-Zone Contract */}
      <header className="sticky top-0 z-40 border-b border-[var(--color-border)] bg-[var(--color-surface)]/95 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-3 sm:gap-8 px-4 sm:px-6 lg:px-8">
          <Link href={getSalesXPortalUrlForPath("/")} className="shrink-0 min-w-0">
            <BrandLogo />
          </Link>

          <nav
            aria-label="Navigasi utama"
            className="hidden md:flex items-center gap-7 text-sm font-medium text-[var(--color-text-secondary)]"
          >
            <a
              href="#produk"
              className="hover:text-[#348CB2] transition-colors whitespace-nowrap shrink-0"
            >
              Produk
            </a>
            <a
              href="#fitur"
              className="hover:text-[#348CB2] transition-colors whitespace-nowrap shrink-0"
            >
              Fitur
            </a>
            <a
              href="#teknologi-ai"
              className="hover:text-[#348CB2] transition-colors whitespace-nowrap shrink-0"
            >
              Teknologi AI
            </a>
            <a
              href="#harga"
              className="hover:text-[#348CB2] transition-colors whitespace-nowrap shrink-0"
            >
              Harga
            </a>
            <a
              href="#faq"
              className="hover:text-[#348CB2] transition-colors whitespace-nowrap shrink-0"
            >
              FAQ
            </a>
          </nav>

          <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
            <div className="hidden lg:block">
              <PWAInstallButton variant="compact" />
            </div>
            <button
              type="button"
              onClick={toggleTheme}
              aria-label="Ganti tema tampilan"
              className="hidden sm:inline-flex min-h-[40px] min-w-[40px] items-center justify-center rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors cursor-pointer"
            >
              {theme === 'light' ? (
                <Moon className="h-4 w-4" />
              ) : (
                <Sun className="h-4 w-4" />
              )}
            </button>
            <Link
              href={getSalesXPortalUrlForPath("/portal")}
              className="hidden sm:inline-flex items-center gap-2 rounded-lg bg-[#348CB2] px-4 py-2 text-sm font-semibold text-white hover:bg-[#236D91] transition-colors whitespace-nowrap shrink-0"
            >
              <span>Masuk Portal</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle menu navigasi"
              className="md:hidden min-h-[44px] min-w-[44px] inline-flex items-center justify-center rounded-lg border border-[var(--color-border)] text-[var(--color-text-primary)]"
            >
              {mobileMenuOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Drawer */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-4 space-y-3">
            <div className="grid grid-cols-2 gap-2 text-sm font-medium">
              <a
                href="#produk"
                onClick={() => setMobileMenuOpen(false)}
                className="rounded-lg px-3 py-2.5 hover:bg-[var(--color-surface-muted)]"
              >
                Produk
              </a>
              <a
                href="#fitur"
                onClick={() => setMobileMenuOpen(false)}
                className="rounded-lg px-3 py-2.5 hover:bg-[var(--color-surface-muted)]"
              >
                Fitur
              </a>
              <a
                href="#teknologi-ai"
                onClick={() => setMobileMenuOpen(false)}
                className="rounded-lg px-3 py-2.5 hover:bg-[var(--color-surface-muted)]"
              >
                Teknologi AI
              </a>
              <a
                href="#keunggulan-lainnya"
                onClick={() => setMobileMenuOpen(false)}
                className="rounded-lg px-3 py-2.5 hover:bg-[var(--color-surface-muted)]"
              >
                Keunggulan Lainnya
              </a>
              <a
                href="#harga"
                onClick={() => setMobileMenuOpen(false)}
                className="rounded-lg px-3 py-2.5 hover:bg-[var(--color-surface-muted)]"
              >
                Harga
              </a>
              <a
                href="#faq"
                onClick={() => setMobileMenuOpen(false)}
                className="rounded-lg px-3 py-2.5 hover:bg-[var(--color-surface-muted)]"
              >
                FAQ
              </a>
            </div>
            <div className="flex flex-col gap-2.5 pt-3 border-t border-[var(--color-border)]">
              <Link
                href={getSalesXPortalUrlForPath("/portal")}
                onClick={() => setMobileMenuOpen(false)}
                className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-[#348CB2] py-3 text-sm font-bold text-white hover:bg-[#236D91] transition-colors"
              >
                <span>Masuk Portal</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <PWAInstallButton variant="compact" />
                <button
                  type="button"
                  onClick={toggleTheme}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 text-xs font-semibold text-[var(--color-text-secondary)] cursor-pointer"
                >
                  {theme === 'light' ? (
                    <>
                      <Moon className="h-3.5 w-3.5" />
                      <span>Mode Gelap</span>
                    </>
                  ) : (
                    <>
                      <Sun className="h-3.5 w-3.5" />
                      <span>Mode Terang</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </header>

      <main>
        {/* 1. HERO SECTION */}
        <section className="relative overflow-hidden bg-gradient-to-b from-[#F3FAFC] via-[var(--color-surface)] to-[var(--color-background)] dark:from-[#111C2D] dark:via-[#0B1220] dark:to-[#0B1220] py-12 sm:py-16 lg:py-20">
          <div className="mx-auto grid max-w-7xl grid-cols-1 items-stretch gap-10 px-4 sm:px-6 lg:grid-cols-12 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
              className="lg:col-span-6 flex flex-col justify-center"
            >
              <p className="text-xs font-semibold tracking-wider text-[#348CB2] dark:text-[#87CEEB] uppercase">
                Ekosistem Operasional Sales Berbasis AI
              </p>
              <h1 className="mt-3 text-3xl sm:text-4xl lg:text-[46px] font-bold leading-[1.14] tracking-tight text-[#123A54] dark:text-white text-balance">
                Platform Sales Cerdas untuk Pertumbuhan Bisnis Anda
              </h1>
              <p className="mt-4 max-w-xl text-base sm:text-lg leading-relaxed text-[var(--color-text-secondary)]">
                Kelola tim sales, pantau aktivitas lapangan, tingkatkan
                penjualan, dan optimalkan kinerja dengan Staff AI SalesX-Ai.
              </p>

              <div className="mt-7 flex flex-col sm:flex-row sm:flex-wrap items-stretch sm:items-center gap-3">
                <a
                  href="#daftar"
                  onClick={() => setFormTab('subscribe')}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#F97316] px-5 py-3.5 text-sm font-bold text-white shadow-sm hover:bg-[#EA580C] transition-colors text-center sm:whitespace-nowrap"
                >
                  <span>Mulai Berlangganan</span>
                  <ArrowRight className="h-4 w-4 shrink-0" />
                </a>
                <a
                  href="#daftar"
                  onClick={() => setFormTab('demo')}
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-5 py-3.5 text-sm font-semibold text-[#123A54] dark:text-white hover:bg-[var(--color-surface-muted)] transition-colors text-center sm:whitespace-nowrap"
                >
                  <Calendar className="h-4 w-4 shrink-0 text-[#348CB2]" />
                  <span>Jadwalkan Demo</span>
                </a>
                <Link
                  href={getSalesXPortalUrlForPath("/portal")}
                  className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-[#ADD8E6] bg-[#E5F4F8] dark:bg-[#19394B] dark:border-[#348CB2] px-5 py-3.5 text-sm font-semibold text-[#194F70] dark:text-[#87CEEB] hover:bg-[#ADD8E6]/40 transition-colors text-center sm:whitespace-nowrap"
                >
                  <span>Masuk ke Portal</span>
                </Link>
              </div>
            </motion.div>

            {/* Right Hero Operations Visual */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25 }}
              className="lg:col-span-6 flex items-stretch"
            >
              <div className="w-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 sm:p-6 shadow-sm flex flex-col justify-between">
                <div className="flex items-center justify-between border-b border-[var(--color-border)] pb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#348CB2] text-white text-xs font-bold">
                      SX
                    </div>
                    <div>
                      <p className="text-sm font-bold text-[var(--color-text-primary)]">
                        SalesX-Ai Operations Hub
                      </p>
                      <p className="text-xs text-[var(--color-text-muted)]">
                        Area Bogor · Pembaruan Lapangan
                      </p>
                    </div>
                  </div>
                  <span className="text-xs font-semibold text-[#047857] dark:text-[#34D399]">
                    Sesi Aktif
                  </span>
                </div>

                {/* Illustrated Field Map + Chart */}
                <div className="my-4 grid grid-cols-1 sm:grid-cols-12 gap-4">
                  <div className="sm:col-span-7 rounded-xl border border-[#ADD8E6]/60 bg-[#F3FAFC] dark:bg-[#172438] dark:border-[#26374B] p-4 flex flex-col justify-between">
                    <div className="flex items-center justify-between text-xs text-[var(--color-text-secondary)]">
                      <span className="font-semibold text-[#123A54] dark:text-[#ADD8E6]">
                        Rute Kunjungan Outlet
                      </span>
                      <span className="font-mono tabular-nums">5 / 8</span>
                    </div>
                    <svg
                      viewBox="0 0 280 120"
                      className="my-3 w-full h-24"
                      aria-hidden="true"
                    >
                      <rect
                        width="280"
                        height="120"
                        rx="10"
                        fill="#E5F4F8"
                        className="dark:fill-[#111C2D]"
                      />
                      <path
                        d="M0 40 H280 M0 85 H280 M70 0 V120 M190 0 V120"
                        stroke="#CBD5E1"
                        strokeOpacity="0.45"
                        strokeWidth="1.5"
                      />
                      <path
                        d="M34 86 C75 40, 120 88, 155 48 C185 18, 220 55, 246 34"
                        fill="none"
                        stroke="#348CB2"
                        strokeWidth="4"
                        strokeLinecap="round"
                      />
                      <circle cx="34" cy="86" r="7" fill="#10B981" />
                      <circle cx="155" cy="48" r="7" fill="#348CB2" />
                      <circle cx="246" cy="34" r="7" fill="#F97316" />
                    </svg>
                    <div className="flex items-center justify-between text-xs text-[var(--color-text-secondary)]">
                      <span>Toko Makmur Jaya → Toko Sentosa</span>
                      <span className="font-semibold text-[#348CB2]">3,1 km</span>
                    </div>
                  </div>

                  <div className="sm:col-span-5 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-muted)] p-4 flex flex-col justify-between">
                    <p className="text-xs font-semibold text-[var(--color-text-secondary)]">
                      Realisasi Bulan Ini
                    </p>
                    <p className="text-2xl font-bold text-[#123A54] dark:text-white font-mono tabular-nums my-2">
                      62,5%
                    </p>
                    <div className="flex items-end gap-1.5 h-16">
                      {[42, 55, 62, 58, 76, 88].map((h, idx) => (
                        <div
                          key={idx}
                          className="flex-1 rounded-t-sm bg-[#87CEEB] dark:bg-[#348CB2]"
                          style={{ height: `${h}%` }}
                        />
                      ))}
                    </div>
                    <p className="mt-2 text-[11px] text-[var(--color-text-muted)] tabular-nums">
                      Rp 62.500.000 / Rp 100.000.000
                    </p>
                  </div>
                </div>

                {/* 3 KPI Strip */}
                <div className="grid grid-cols-3 gap-3 border-t border-[var(--color-border)] pt-4">
                  <div>
                    <p className="text-xs text-[var(--color-text-muted)]">Order</p>
                    <p className="text-lg sm:text-xl font-bold text-[#123A54] dark:text-white font-mono tabular-nums">
                      +328
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-[var(--color-text-muted)]">
                      Kunjungan
                    </p>
                    <p className="text-lg sm:text-xl font-bold text-[#123A54] dark:text-white font-mono tabular-nums">
                      1.245
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-[var(--color-text-muted)]">
                      Tim Aktif
                    </p>
                    <p className="text-lg sm:text-xl font-bold text-[#123A54] dark:text-white font-mono tabular-nums">
                      24
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* 2. PRODUK UNGGULAN SALESX-AI */}
        <section id="produk" className="py-14 sm:py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="max-w-2xl">
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#123A54] dark:text-white">
                Produk Unggulan SalesX-Ai
              </h2>
              <p className="mt-2 text-sm sm:text-base text-[var(--color-text-secondary)]">
                Solusi lengkap untuk mengelola tim, penjualan, dan loyalitas
                pelanggan dalam satu arsitektur terpadu.
              </p>
            </div>

            <div className="mt-8 grid grid-cols-1 gap-5 lg:grid-cols-12">
              {/* SmartTeam featured wide */}
              <button
                type="button"
                onClick={() => setSelectedDetail(CORE_PRODUCTS[0])}
                className="lg:col-span-6 text-left rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 hover:border-[#348CB2] transition-colors cursor-pointer flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#E5F4F8] dark:bg-[#19394B] text-[#348CB2] dark:text-[#87CEEB]">
                      <Users className="h-6 w-6" />
                    </div>
                    <span className="text-xs font-medium text-[var(--color-text-muted)]">
                      SmartTeam · Field Operations
                    </span>
                  </div>
                  <h3 className="mt-5 text-xl font-bold text-[var(--color-text-primary)]">
                    SmartTeam
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-[var(--color-text-secondary)]">
                    {CORE_PRODUCTS[0].description}
                  </p>
                </div>
                <span className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-[#348CB2] dark:text-[#87CEEB]">
                  <span>Lihat detail modul</span>
                  <ArrowRight className="h-4 w-4" />
                </span>
              </button>

              {/* SmartOrder */}
              <button
                type="button"
                onClick={() => setSelectedDetail(CORE_PRODUCTS[1])}
                className="lg:col-span-3 text-left rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 hover:border-[#348CB2] transition-colors cursor-pointer flex flex-col justify-between"
              >
                <div>
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#E5F4F8] dark:bg-[#19394B] text-[#348CB2] dark:text-[#87CEEB]">
                    <ShoppingCart className="h-6 w-6" />
                  </div>
                  <h3 className="mt-5 text-xl font-bold text-[var(--color-text-primary)]">
                    SmartOrder
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-[var(--color-text-secondary)]">
                    {CORE_PRODUCTS[1].description}
                  </p>
                </div>
                <span className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-[#348CB2] dark:text-[#87CEEB]">
                  <span>Detail modul</span>
                  <ArrowRight className="h-4 w-4" />
                </span>
              </button>

              {/* SmartReward */}
              <button
                type="button"
                onClick={() => setSelectedDetail(CORE_PRODUCTS[2])}
                className="lg:col-span-3 text-left rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 hover:border-[#F97316] transition-colors cursor-pointer flex flex-col justify-between"
              >
                <div>
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#FFFBEB] dark:bg-[#3B2612] text-[#F97316]">
                    <Gift className="h-6 w-6" />
                  </div>
                  <h3 className="mt-5 text-xl font-bold text-[var(--color-text-primary)]">
                    SmartReward
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-[var(--color-text-secondary)]">
                    {CORE_PRODUCTS[2].description}
                  </p>
                </div>
                <span className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-[#F97316]">
                  <span>Detail modul</span>
                  <ArrowRight className="h-4 w-4" />
                </span>
              </button>
            </div>
          </div>
        </section>

        {/* 3. KEUNGGULAN & FITUR LAINNYA */}
        <section
          id="fitur"
          className="border-y border-[var(--color-border)] bg-[var(--color-surface)] py-14 sm:py-20"
        >
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 gap-10 lg:grid-cols-12">
              <div className="lg:col-span-5">
                <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#123A54] dark:text-white">
                  Keunggulan SalesX-Ai
                </h2>
                <p className="mt-2 text-sm sm:text-base text-[var(--color-text-secondary)]">
                  Dirancang untuk ketepatan operasional lapangan sekaligus
                  kontrol penuh bagi manajemen perusahaan.
                </p>

                <div className="mt-6 space-y-4">
                  {[
                    {
                      icon: Zap,
                      title: 'Realtime & Terintegrasi',
                      desc: 'Data, lokasi, dan aktivitas tim terpantau secara langsung dalam satu sumber kebenaran.',
                      tone: 'text-[#F59E0B] bg-[#FFFBEB] dark:bg-[#3B2612]',
                    },
                    {
                      icon: BarChart3,
                      title: 'Berbasis AI',
                      desc: 'Didukung Staff AI untuk analitik, rekomendasi kunjungan, dan otomasi teks promosi.',
                      tone: 'text-[#348CB2] bg-[#E5F4F8] dark:bg-[#19394B]',
                    },
                    {
                      icon: Layers,
                      title: 'Mudah Digunakan',
                      desc: 'Antarmuka sederhana, cepat, dan mobile-first untuk penggunaan di lapangan.',
                      tone: 'text-[#1D4ED8] bg-[#EFF6FF] dark:bg-[#172554]',
                    },
                    {
                      icon: ShieldCheck,
                      title: 'Aman & Andal',
                      desc: 'Data bisnis terisolasi per tenant dan tersimpan aman dengan arsitektur tervalidasi.',
                      tone: 'text-[#047857] bg-[#ECFDF5] dark:bg-[#064E3B]',
                    },
                  ].map((item) => {
                    const Icon = item.icon;
                    return (
                      <div
                        key={item.title}
                        className="flex items-start gap-4 rounded-xl border border-[var(--color-border)] p-4"
                      >
                        <div
                          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${item.tone}`}
                        >
                          <Icon className="h-5 w-5" />
                        </div>
                        <div>
                          <h3 className="text-base font-bold text-[var(--color-text-primary)]">
                            {item.title}
                          </h3>
                          <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
                            {item.desc}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="lg:col-span-7">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-[#F97316]">
                      Fitur Unggulan Lainnya
                    </p>
                    <h3 className="mt-1 text-xl sm:text-2xl font-bold text-[#123A54] dark:text-white">
                      Keunggulan Fitur Lengkap End-to-End
                    </h3>
                  </div>
                </div>
                <p className="mt-2 text-sm text-[var(--color-text-secondary)]">
                  Pilih modul di bawah ini untuk melihat detail alur kerja dan
                  cakupan operasionalnya.
                </p>

                <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {EXTRA_FEATURES.map((feat) => {
                    const Icon = feat.icon;
                    return (
                      <button
                        key={feat.title}
                        type="button"
                        onClick={() =>
                          setSelectedDetail({
                            title: feat.title,
                            category: 'Modul Operasional SalesX-Ai',
                            description: feat.summary,
                            bullets: feat.bullets,
                          })
                        }
                        className="flex items-center justify-between gap-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] px-4 py-3.5 text-left hover:border-[#348CB2] transition-colors cursor-pointer"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#E5F4F8] dark:bg-[#19394B] text-[#348CB2] dark:text-[#87CEEB]">
                            <Icon className="h-4 w-4" />
                          </div>
                          <span className="text-sm font-semibold text-[var(--color-text-primary)] truncate">
                            {feat.title}
                          </span>
                        </div>
                        <ArrowRight className="h-4 w-4 shrink-0 text-[var(--color-text-muted)]" />
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 4. CARA KERJA & REALTIME GPS */}
        <section id="cara-kerja" className="py-14 sm:py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-16">
            <div>
              <div className="max-w-2xl">
                <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#123A54] dark:text-white">
                  Cara Kerja SalesX-Ai
                </h2>
                <p className="mt-2 text-sm sm:text-base text-[var(--color-text-secondary)]">
                  Alur sederhana dari perencanaan lapangan hingga laporan
                  penjualan yang terukur.
                </p>
              </div>

              <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
                {[
                  {
                    step: '01',
                    title: 'Tentukan Tim & Wilayah',
                    desc: 'Atur tim sales, target bulanan, outlet prioritas, dan area kerja.',
                  },
                  {
                    step: '02',
                    title: 'Kunjungan & Order',
                    desc: 'Sales melakukan check-in outlet dengan foto bukti dan input order.',
                  },
                  {
                    step: '03',
                    title: 'Monitoring & Analitik',
                    desc: 'Pantau aktivitas, order, rute GPS, dan kinerja tim secara real-time.',
                  },
                  {
                    step: '04',
                    title: 'Evaluasi & Growth',
                    desc: 'Gunakan insight dan Staff AI untuk mengoptimalkan penjualan.',
                  },
                ].map((item) => (
                  <div
                    key={item.step}
                    className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5"
                  >
                    <span className="font-mono text-sm font-bold text-[#348CB2] dark:text-[#87CEEB]">
                      {item.step}.
                    </span>
                    <h3 className="mt-2 text-base font-bold text-[var(--color-text-primary)]">
                      {item.title}
                    </h3>
                    <p className="mt-1.5 text-sm text-[var(--color-text-secondary)]">
                      {item.desc}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Realtime GPS & Privasi Terjaga */}
            <div className="grid grid-cols-1 items-center gap-8 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 sm:p-8 lg:grid-cols-12">
              <div className="lg:col-span-6">
                <h2 className="text-2xl font-bold text-[#123A54] dark:text-white">
                  Realtime GPS & Riwayat Rute
                </h2>
                <p className="mt-2 text-sm sm:text-base text-[var(--color-text-secondary)]">
                  Pantau pergerakan tim sales, validasi geofence kunjungan
                  outlet, dan rute perjalanan secara real-time menggunakan
                  Google Maps Platform.
                </p>

                <ul className="mt-5 space-y-2.5 text-sm text-[var(--color-text-primary)]">
                  {[
                    'Lokasi tim sales real-time saat sesi kerja aktif',
                    'Check-in & check-out di outlet dengan validasi radius',
                    'Riwayat kunjungan lengkap beserta bukti foto & catatan',
                    'Rute kunjungan yang efisien dengan Routes API',
                  ].map((line) => (
                    <li key={line} className="flex items-center gap-2.5">
                      <CheckCircle2 className="h-4 w-4 text-[#10B981] shrink-0" />
                      <span>{line}</span>
                    </li>
                  ))}
                </ul>

                <div className="mt-6 flex items-start gap-3 rounded-xl border border-[#ADD8E6] bg-[#F3FAFC] dark:bg-[#19394B] dark:border-[#348CB2] p-4">
                  <ShieldCheck className="h-5 w-5 text-[#348CB2] dark:text-[#87CEEB] shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-bold text-[#123A54] dark:text-white">
                      Privasi Terjaga
                    </p>
                    <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">
                      Pelacakan lokasi hanya aktif saat jam kerja dengan izin
                      transparan pengguna dan jejak audit akses yang jelas.
                    </p>
                  </div>
                </div>
              </div>

              <div className="lg:col-span-6">
                <div className="rounded-2xl border border-[#ADD8E6]/70 bg-[#E5F4F8] dark:bg-[#172438] dark:border-[#26374B] p-5">
                  <div className="flex items-center justify-between text-xs font-semibold text-[#194F70] dark:text-[#ADD8E6] mb-3">
                    <span className="inline-flex items-center gap-1.5">
                      <Navigation className="h-3.5 w-3.5" />
                      Simulasi Peta Rute Area Bogor
                    </span>
                    <span>Radius Geofence: 100 m</span>
                  </div>
                  <svg viewBox="0 0 420 210" className="w-full h-48 rounded-xl">
                    <rect
                      width="420"
                      height="210"
                      rx="12"
                      fill="#FFFFFF"
                      className="dark:fill-[#0B1220]"
                    />
                    <path
                      d="M0 55 H420 M0 115 H420 M0 170 H420 M90 0 V210 M210 0 V210 M330 0 V210"
                      stroke="#E2E8F0"
                      className="dark:stroke-[#26374B]"
                      strokeWidth="1.5"
                    />
                    <circle
                      cx="340"
                      cy="72"
                      r="36"
                      fill="#10B981"
                      fillOpacity="0.14"
                      stroke="#10B981"
                      strokeDasharray="4 3"
                    />
                    <path
                      d="M65 148 C125 65, 195 155, 255 95 C290 60, 315 80, 340 72"
                      fill="none"
                      stroke="#348CB2"
                      strokeWidth="5"
                      strokeLinecap="round"
                    />
                    <circle cx="65" cy="148" r="9" fill="#348CB2" />
                    <circle cx="255" cy="95" r="8" fill="#87CEEB" stroke="#123A54" strokeWidth="2" />
                    <circle cx="340" cy="72" r="9" fill="#F97316" />
                  </svg>
                  <div className="mt-3 flex items-center justify-between text-xs text-[var(--color-text-secondary)]">
                    <span>Kantor Area Bogor → Toko Sentosa</span>
                    <Link
                      href={getSalesXPortalUrlForPath("/portal")+"?tab=aktivitas"}
                      className="font-semibold text-[#348CB2] hover:underline"
                    >
                      Lihat Peta Live di Portal →
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 5. STAFF AI & AI GENERATE CONTENT */}
        <section className="border-y border-[var(--color-border)] bg-[var(--color-surface)] py-14 sm:py-20">
          <div className="mx-auto grid max-w-7xl grid-cols-1 gap-8 px-4 sm:px-6 lg:grid-cols-12 lg:px-8">
            <div className="lg:col-span-6 rounded-2xl border border-[var(--color-border)] bg-[var(--color-primary-subtle)] p-6 sm:p-8">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#348CB2] text-white">
                  <Bot className="h-6 w-6" />
                </div>
                <div>
                  <h2 className="text-xl sm:text-2xl font-bold text-[#123A54] dark:text-white">
                    Staff AI SalesX-Ai
                  </h2>
                  <p className="text-xs sm:text-sm text-[var(--color-text-secondary)]">
                    Asisten digital cerdas untuk mendukung produktivitas tim
                    sales.
                  </p>
                </div>
              </div>

              <ul className="mt-6 space-y-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 text-sm">
                {[
                  'Insight penjualan harian berbasis data aktual',
                  'Rekomendasi kunjungan & outlet prioritas',
                  'Coaching & tips penjualan untuk tim lapangan',
                  'Bantuan pembuatan konten promosi produk',
                ].map((item) => (
                  <li
                    key={item}
                    className="flex items-center gap-2.5 text-[var(--color-text-primary)]"
                  >
                    <CheckCircle2 className="h-4 w-4 text-[#348CB2] shrink-0" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>

              <div className="mt-6">
                <Link
                  href={getSalesXPortalUrlForPath("/portal")+"?tab=ai"}
                  className="inline-flex items-center gap-2 rounded-xl bg-[#348CB2] px-5 py-3 text-sm font-semibold text-white hover:bg-[#236D91] transition-colors"
                >
                  <span>Coba Staff AI di Sales Portal</span>
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>

            <div className="lg:col-span-6 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 sm:p-8">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl sm:text-2xl font-bold text-[#123A54] dark:text-white">
                    AI Generate Content
                  </h2>
                  <p className="mt-1 text-xs sm:text-sm text-[var(--color-text-secondary)]">
                    Buat konten promosi, teks penjualan, dan materi marketing
                    dengan cepat.
                  </p>
                </div>
              </div>

              <div className="mt-5 space-y-3">
                <label
                  htmlFor="landing-content-prompt"
                  className="block text-xs font-semibold text-[var(--color-text-secondary)]"
                >
                  Buat Konten Promosi
                </label>
                <textarea
                  id="landing-content-prompt"
                  rows={3}
                  maxLength={500}
                  value={previewPrompt}
                  onChange={(e) => setPreviewPrompt(e.target.value)}
                  className="w-full rounded-xl border border-[var(--color-border-strong)] bg-[var(--color-background)] p-3 text-sm text-[var(--color-text-primary)] focus:border-[#348CB2] focus:outline-none"
                />
                <div className="flex items-center justify-between text-xs text-[var(--color-text-muted)]">
                  <span className="font-mono tabular-nums">
                    {previewPrompt.length} / 500
                  </span>
                  <button
                    type="button"
                    onClick={handleGeneratePreview}
                    disabled={previewLoading}
                    className="inline-flex items-center gap-2 rounded-lg bg-[#348CB2] px-4 py-2 text-xs font-semibold text-white hover:bg-[#236D91] disabled:opacity-60 transition-colors cursor-pointer"
                  >
                    <Wand2 className="h-3.5 w-3.5" />
                    <span>
                      {previewLoading ? 'Menghasilkan...' : 'Generate Konten'}
                    </span>
                  </button>
                </div>

                {previewError && (
                  <p className="text-xs text-red-600 dark:text-red-400">
                    {previewError}
                  </p>
                )}

                <div className="rounded-xl border border-[#ADD8E6] bg-[#F3FAFC] dark:bg-[#172438] dark:border-[#348CB2] p-4">
                  <p className="text-xs font-semibold text-[#348CB2] dark:text-[#87CEEB]">
                    Hasil Konten
                  </p>
                  <p className="mt-1.5 text-sm font-medium text-[var(--color-text-primary)]">
                    {previewResult}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 5B. TEKNOLOGI AI YANG DITERAPKAN DI SALESX-AI */}
        <section id="teknologi-ai" className="py-14 sm:py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
              <div className="max-w-2xl">
                <p className="text-xs font-semibold text-[#348CB2] dark:text-[#87CEEB]">
                  Arsitektur Kecerdasan Buatan Terpadu
                </p>
                <h2 className="mt-1.5 text-2xl sm:text-3xl font-bold tracking-tight text-[#123A54] dark:text-white text-balance">
                  Teknologi AI yang Diterapkan di SalesX-Ai
                </h2>
                <p className="mt-2 text-sm sm:text-base text-[var(--color-text-secondary)]">
                  Dibangun di atas satu Unified AI Orchestrator yang memadukan
                  kecerdasan multimodal, konteks wilayah operasional, dan aturan
                  bisnis deterministik yang tetap berada di bawah kendali manusia.
                </p>
              </div>

              {/* Layer Switcher Tabs */}
              <div
                role="tablist"
                aria-label="Lapisan Teknologi AI SalesX-Ai"
                className="flex flex-wrap gap-1 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-muted)] p-1 w-full sm:w-auto self-start"
              >
                {AI_TECH_LAYERS.map((layer) => {
                  const active = activeAiLayer === layer.id;
                  return (
                    <button
                      key={layer.id}
                      type="button"
                      role="tab"
                      aria-selected={active}
                      onClick={() => setActiveAiLayer(layer.id)}
                      className={`flex-1 sm:flex-initial rounded-lg px-3 py-2 text-xs font-semibold transition-colors text-center cursor-pointer ${
                        active
                          ? 'bg-[#348CB2] text-white shadow-xs'
                          : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
                      }`}
                    >
                      {layer.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {(() => {
              const currentLayer =
                AI_TECH_LAYERS.find((l) => l.id === activeAiLayer) ||
                AI_TECH_LAYERS[0];
              return (
                <div className="mt-8 space-y-6">
                  {/* Layer Overview Strip */}
                  <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 sm:p-7 grid grid-cols-1 lg:grid-cols-12 gap-5 items-center">
                    <div className="lg:col-span-8 space-y-2 min-w-0">
                      <p className="text-xs font-medium text-[var(--color-text-muted)]">
                        {currentLayer.metricsLabel}
                      </p>
                      <h3 className="text-xl sm:text-2xl font-bold text-[#123A54] dark:text-white text-balance">
                        {currentLayer.headline}
                      </h3>
                      <p className="text-sm leading-relaxed text-[var(--color-text-secondary)] max-w-3xl">
                        {currentLayer.summary}
                      </p>
                    </div>
                    <div className="lg:col-span-4 flex lg:justify-end">
                      <Link
                        href={getSalesXPortalUrlForPath("/portal")+"?tab=ai"}
                        className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-[#123A54] hover:bg-[#194F70] px-5 py-3 text-sm font-semibold text-white transition-colors text-center"
                      >
                        <span>Uji Staff AI di Portal</span>
                        <ArrowRight className="h-4 w-4 shrink-0" />
                      </Link>
                    </div>
                  </div>

                  {/* 3 Layer Pillar Cards */}
                  <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
                    {currentLayer.pillars.map((pillar, idx) => (
                      <button
                        key={pillar.title}
                        type="button"
                        onClick={() =>
                          setSelectedDetail({
                            title: pillar.title,
                            category: `${currentLayer.label} · ${pillar.tag}`,
                            description: pillar.description,
                            bullets: pillar.detailBullets,
                          })
                        }
                        className="text-left rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 hover:border-[#348CB2] transition-colors cursor-pointer flex flex-col justify-between"
                      >
                        <div>
                          <div className="flex items-center justify-between gap-2 text-xs text-[var(--color-text-muted)]">
                            <span className="font-mono font-bold text-[#348CB2] dark:text-[#87CEEB]">
                              0{idx + 1}.
                            </span>
                            <span>{pillar.tag}</span>
                          </div>
                          <h4 className="mt-3 text-base sm:text-lg font-bold text-[var(--color-text-primary)]">
                            {pillar.title}
                          </h4>
                          <p className="mt-2 text-sm leading-relaxed text-[var(--color-text-secondary)]">
                            {pillar.description}
                          </p>
                        </div>
                        <span className="mt-5 inline-flex items-center gap-1.5 text-xs font-semibold text-[#348CB2] dark:text-[#87CEEB]">
                          <span>Pelajari cara kerja</span>
                          <ArrowRight className="h-3.5 w-3.5" />
                        </span>
                      </button>
                    ))}
                  </div>

                  {/* 4 Capability Highlights Row (Hardware/Pipeline style strip) */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
                    {[
                      {
                        icon: Cpu,
                        title: 'Model Routing Adaptif',
                        desc: 'Pemilihan model AI otomatis berdasarkan kecepatan, akurasi penalaran, dan jenis tugas.',
                      },
                      {
                        icon: Mic,
                        title: 'Transkripsi Suara Lapangan',
                        desc: 'Rekam laporan kunjungan lisan menjadi catatan teks terstruktur saat berada di outlet.',
                      },
                      {
                        icon: ImageIcon,
                        title: 'Generasi Aset Promosi',
                        desc: 'Pembuatan poster 1K–4K, caption, dan konsep video kampanye langsung dari data SKU.',
                      },
                      {
                        icon: FileCheck2,
                        title: 'Validasi Harga Non-LLM',
                        desc: 'Angka order, diskon, dan saldo reward 100% dihitung mesin aturan deterministik.',
                      },
                    ].map((cap) => {
                      const CapIcon = cap.icon;
                      return (
                        <div
                          key={cap.title}
                          className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-primary-subtle)] p-4 flex items-start gap-3"
                        >
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[var(--color-surface)] border border-[var(--color-border)] text-[#348CB2] dark:text-[#87CEEB]">
                            <CapIcon className="h-4 w-4" />
                          </div>
                          <div>
                            <p className="text-sm font-bold text-[#123A54] dark:text-white">
                              {cap.title}
                            </p>
                            <p className="mt-1 text-xs leading-relaxed text-[var(--color-text-secondary)]">
                              {cap.desc}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })()}
          </div>
        </section>

        {/* 5C. FITUR-FITUR KEUNGGULAN LAINNYA (EKOSISTEM & SKALABILITAS) */}
        <section
          id="keunggulan-lainnya"
          className="border-y border-[var(--color-border)] bg-[var(--color-surface)] py-14 sm:py-20"
        >
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
              <div className="max-w-2xl">
                <p className="text-xs font-semibold text-[#F97316]">
                  Ekosistem Terbuka & Ketahanan Operasional
                </p>
                <h2 className="mt-1.5 text-2xl sm:text-3xl font-bold tracking-tight text-[#123A54] dark:text-white text-balance">
                  Fitur-Fitur Keunggulan Lainnya di SalesX-Ai
                </h2>
                <p className="mt-2 text-sm sm:text-base text-[var(--color-text-secondary)]">
                  Melampaui pencatatan penjualan dasar—hadir dengan pencarian
                  prospek Google Maps, ketahanan offline PWA, integrasi Google
                  Workspace, serta tata kelola multi-portal.
                </p>
              </div>

              {/* Interactive Category Filter */}
              <div className="flex flex-wrap gap-1 rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] p-1 w-full sm:w-auto self-start">
                {(
                  [
                    'Semua',
                    'Akuisisi & Lapangan',
                    'Kolaborasi & Ekosistem',
                    'Keamanan & Multi-Portal',
                  ] as const
                ).map((cat) => {
                  const active = advantageFilter === cat;
                  return (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setAdvantageFilter(cat)}
                      className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors text-left cursor-pointer ${
                        active
                          ? 'bg-[#123A54] text-white shadow-xs'
                          : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
                      }`}
                    >
                      {cat}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="mt-8 grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
              {ADDITIONAL_ADVANTAGE_FEATURES.filter(
                (item) =>
                  advantageFilter === 'Semua' ||
                  item.category === advantageFilter
              ).map((item, idx) => {
                const AdvIcon = item.icon;
                const featured = idx === 0 && advantageFilter === 'Semua';
                return (
                  <button
                    key={item.title}
                    type="button"
                    onClick={() =>
                      setSelectedDetail({
                        title: item.title,
                        category: `${item.category} · ${item.meta}`,
                        description: item.summary,
                        bullets: item.bullets,
                      })
                    }
                    className={`text-left rounded-2xl border border-[var(--color-border)] bg-[var(--color-background)] p-5 sm:p-6 hover:border-[#348CB2] transition-colors cursor-pointer flex flex-col justify-between ${
                      featured ? 'md:col-span-2 lg:col-span-2' : ''
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#E5F4F8] dark:bg-[#19394B] text-[#348CB2] dark:text-[#87CEEB] shrink-0">
                          <AdvIcon className="h-5 w-5" />
                        </div>
                        <span className="text-xs text-[var(--color-text-muted)] text-right">
                          {item.meta}
                        </span>
                      </div>
                      <h3 className="mt-4 text-lg font-bold text-[var(--color-text-primary)]">
                        {item.title}
                      </h3>
                      <p className="mt-2 text-sm leading-relaxed text-[var(--color-text-secondary)]">
                        {item.summary}
                      </p>
                    </div>
                    <div className="mt-5 pt-4 border-t border-[var(--color-border)] flex flex-wrap items-center justify-between gap-2 text-xs font-semibold text-[#348CB2] dark:text-[#87CEEB]">
                      <span>{item.category}</span>
                      <span className="inline-flex items-center gap-1">
                        <span>Lihat rincian fitur</span>
                        <ArrowRight className="h-3.5 w-3.5" />
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Bottom Action Strip */}
            <div className="mt-8 rounded-2xl border border-[#ADD8E6] bg-[#F3FAFC] dark:bg-[#172438] dark:border-[#26374B] p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-start sm:items-center gap-3 min-w-0">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#348CB2] text-white">
                  <Compass className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-bold text-[#123A54] dark:text-white">
                    Ingin mencoba langsung Pencarian Leads Google Maps, AI
                    Assistant, dan SmartOrder?
                  </p>
                  <p className="text-xs text-[var(--color-text-secondary)]">
                    Seluruh modul dapat dieksplorasi secara interaktif di dalam
                    Sales Portal PWA.
                  </p>
                </div>
              </div>
              <Link
                href={getSalesXPortalUrlForPath("/portal")}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-[#F97316] hover:bg-[#EA580C] px-5 py-3 text-sm font-bold text-white transition-colors text-center shrink-0"
              >
                <span>Buka Sales Portal Sekarang</span>
                <ArrowRight className="h-4 w-4 shrink-0" />
              </Link>
            </div>
          </div>
        </section>

        {/* 6. PAKET BERLANGGANAN */}
        <section id="harga" className="py-14 sm:py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-2xl mx-auto">
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#123A54] dark:text-white">
                Paket Berlangganan
              </h2>
              <p className="mt-2 text-sm sm:text-base text-[var(--color-text-secondary)]">
                Pilih paket sesuai skala tim dan kebutuhan distribusi bisnis
                Anda.
              </p>
            </div>

            <div className="mt-10 grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-4">
              {/* Starter */}
              <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#E5F4F8] dark:bg-[#19394B] text-[#348CB2] shrink-0">
                      <Briefcase className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold">Starter</h3>
                      <p className="text-xs text-[var(--color-text-muted)]">
                        Tim kecil & distribusi awal
                      </p>
                    </div>
                  </div>
                  <div className="mt-5 flex items-baseline gap-1">
                    <span className="text-2xl sm:text-[26px] font-bold font-mono tabular-nums text-[#123A54] dark:text-white">
                      Rp 2.000.000
                    </span>
                    <span className="text-xs text-[var(--color-text-muted)]">
                      /bulan
                    </span>
                  </div>
                  <ul className="mt-5 space-y-2.5 text-sm text-[var(--color-text-secondary)]">
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-[#10B981] shrink-0 mt-0.5" />
                      <span>Hingga 15 sales lapangan</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-[#10B981] shrink-0 mt-0.5" />
                      <span>SmartTeam absensi geofence & kunjungan</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-[#10B981] shrink-0 mt-0.5" />
                      <span>SmartOrder katalog SKU & transaksi</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-[#10B981] shrink-0 mt-0.5" />
                      <span>Laporan penjualan harian</span>
                    </li>
                  </ul>
                </div>
                <button
                  type="button"
                  onClick={() => handleChoosePlan('Starter (Rp 2.000.000/bulan)')}
                  className="mt-6 w-full rounded-xl border border-[#348CB2] py-2.5 text-sm font-semibold text-[#348CB2] hover:bg-[#E5F4F8] dark:hover:bg-[#19394B] transition-colors cursor-pointer whitespace-nowrap"
                >
                  Pilih Starter
                </button>
              </div>

              {/* Growth (Paling Populer) */}
              <div className="relative rounded-2xl border-2 border-[#F97316] bg-[var(--color-surface)] p-6 shadow-sm flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#FFFBEB] text-[#F97316] shrink-0">
                        <BarChart3 className="h-5 w-5" />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold">Growth</h3>
                        <p className="text-xs font-semibold text-[#EA580C]">
                          Paling Populer · Tim berkembang
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="mt-5 flex items-baseline gap-1">
                    <span className="text-2xl sm:text-[26px] font-bold font-mono tabular-nums text-[#F97316]">
                      Rp 4.900.000
                    </span>
                    <span className="text-xs text-[var(--color-text-muted)]">
                      /bulan
                    </span>
                  </div>
                  <ul className="mt-5 space-y-2.5 text-sm text-[var(--color-text-secondary)]">
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-[#10B981] shrink-0 mt-0.5" />
                      <span>Hingga 50 sales & multi cabang</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-[#10B981] shrink-0 mt-0.5" />
                      <span>SmartTeam, SmartOrder & SmartReward</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-[#10B981] shrink-0 mt-0.5" />
                      <span>Realtime GPS & Staff AI Assistant</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-[#10B981] shrink-0 mt-0.5" />
                      <span>Pencarian Leads Maps & Google Workspace</span>
                    </li>
                  </ul>
                </div>
                <button
                  type="button"
                  onClick={() => handleChoosePlan('Growth (Rp 4.900.000/bulan)')}
                  className="mt-6 w-full rounded-xl bg-[#F97316] py-3 text-sm font-bold text-white hover:bg-[#EA580C] transition-colors cursor-pointer whitespace-nowrap"
                >
                  Daftar Sekarang →
                </button>
              </div>

              {/* Business */}
              <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#E5F4F8] dark:bg-[#19394B] text-[#348CB2] shrink-0">
                      <Layers className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold">Business</h3>
                      <p className="text-xs text-[var(--color-text-muted)]">
                        Skala regional & multi-distributor
                      </p>
                    </div>
                  </div>
                  <div className="mt-5 flex items-baseline gap-1">
                    <span className="text-2xl sm:text-[26px] font-bold font-mono tabular-nums text-[#123A54] dark:text-white">
                      Rp 9.500.000
                    </span>
                    <span className="text-xs text-[var(--color-text-muted)]">
                      /bulan
                    </span>
                  </div>
                  <ul className="mt-5 space-y-2.5 text-sm text-[var(--color-text-secondary)]">
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-[#10B981] shrink-0 mt-0.5" />
                      <span>Hingga 150 sales, Supervisor & Distributor Portal</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-[#10B981] shrink-0 mt-0.5" />
                      <span>AI Content Studio & Telegram Proactive Bot</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-[#10B981] shrink-0 mt-0.5" />
                      <span>Workflow Approval & Audit Trail lengkap</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-[#10B981] shrink-0 mt-0.5" />
                      <span>Analitik performa multi-teritori</span>
                    </li>
                  </ul>
                </div>
                <button
                  type="button"
                  onClick={() => handleChoosePlan('Business (Rp 9.500.000/bulan)')}
                  className="mt-6 w-full rounded-xl bg-[#348CB2] py-2.5 text-sm font-semibold text-white hover:bg-[#236D91] transition-colors cursor-pointer whitespace-nowrap"
                >
                  Pilih Business
                </button>
              </div>

              {/* Enterprise */}
              <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#E5F4F8] dark:bg-[#19394B] text-[#123A54] dark:text-[#87CEEB] shrink-0">
                      <Building2 className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold">Enterprise</h3>
                      <p className="text-xs text-[var(--color-text-muted)]">
                        Distribusi nasional & Principal
                      </p>
                    </div>
                  </div>
                  <div className="mt-5 flex items-baseline gap-1">
                    <span className="text-xl sm:text-2xl font-bold font-mono tabular-nums text-[#123A54] dark:text-white">
                      Mulai Rp 18.000.000
                    </span>
                    <span className="text-xs text-[var(--color-text-muted)]">
                      /bulan
                    </span>
                  </div>
                  <ul className="mt-5 space-y-2.5 text-sm text-[var(--color-text-secondary)]">
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-[#10B981] shrink-0 mt-0.5" />
                      <span>Sales, Distributor & Principal tanpa batas</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-[#10B981] shrink-0 mt-0.5" />
                      <span>Dedicated AI orchestration & integrasi ERP API</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-[#10B981] shrink-0 mt-0.5" />
                      <span>Ekosistem 8 Portal & SLA prioritas</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-[#10B981] shrink-0 mt-0.5" />
                      <span>Kebijakan retensi & audit keamanan khusus</span>
                    </li>
                  </ul>
                </div>
                <button
                  type="button"
                  onClick={() => handleChoosePlan('Enterprise (Mulai Rp 18.000.000/bulan)')}
                  className="mt-6 w-full rounded-xl border border-[var(--color-border-strong)] py-2.5 text-sm font-semibold hover:bg-[var(--color-surface-muted)] transition-colors cursor-pointer whitespace-nowrap"
                >
                  Hubungi Tim Sales
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* 7. FAQ & FORMULIR PENDAFTARAN */}
        <section
          id="faq"
          className="border-t border-[var(--color-border)] bg-[var(--color-surface)] py-14 sm:py-20"
        >
          <div className="mx-auto grid max-w-7xl grid-cols-1 gap-10 px-4 sm:px-6 lg:grid-cols-12 lg:px-8">
            <div className="lg:col-span-6">
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#123A54] dark:text-white">
                FAQ Pertanyaan Umum
              </h2>
              <p className="mt-2 text-sm text-[var(--color-text-secondary)]">
                Jawaban cepat seputar implementasi, keamanan data, dan sistem
                berlangganan SalesX-Ai.
              </p>

              <div className="mt-6 divide-y divide-[var(--color-border)] rounded-2xl border border-[var(--color-border)] bg-[var(--color-background)]">
                {LANDING_FAQ_ITEMS.map((item, idx) => {
                  const isOpen = openFaqIdx === idx;
                  return (
                    <div key={item.q}>
                      <button
                        type="button"
                        onClick={() => setOpenFaqIdx(isOpen ? null : idx)}
                        className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left text-sm font-semibold text-[var(--color-text-primary)] hover:bg-[var(--color-surface)] transition-colors cursor-pointer"
                      >
                        <span>{item.q}</span>
                        <ChevronDown
                          className={`h-4 w-4 shrink-0 text-[var(--color-text-muted)] transition-transform ${
                            isOpen ? 'rotate-180' : ''
                          }`}
                        />
                      </button>
                      {isOpen && (
                        <div className="px-5 pb-4 text-sm leading-relaxed text-[var(--color-text-secondary)]">
                          {item.a}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            <div id="daftar" className="lg:col-span-6">
              <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-background)] p-6 sm:p-7">
                <div className="grid grid-cols-2 gap-1 rounded-xl bg-[var(--color-surface-muted)] p-1">
                  <button
                    type="button"
                    onClick={() => setFormTab('subscribe')}
                    className={`rounded-lg py-2.5 text-sm font-semibold transition-colors cursor-pointer ${
                      formTab === 'subscribe'
                        ? 'bg-[#123A54] text-white shadow-xs'
                        : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
                    }`}
                  >
                    Daftar Langganan
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormTab('demo')}
                    className={`rounded-lg py-2.5 text-sm font-semibold transition-colors cursor-pointer ${
                      formTab === 'demo'
                        ? 'bg-[#123A54] text-white shadow-xs'
                        : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
                    }`}
                  >
                    Jadwal Demo
                  </button>
                </div>

                <h3 className="mt-5 text-xl font-bold text-[#123A54] dark:text-white">
                  {formTab === 'subscribe'
                    ? 'Formulir Pendaftaran Langganan'
                    : 'Formulir Penjadwalan Demo Produk'}
                </h3>

                <form
                  onSubmit={handleSubmitRegistration}
                  className="mt-4 space-y-3.5"
                >
                  <div className="relative">
                    <User className="pointer-events-none absolute left-3.5 top-3 h-4 w-4 text-[var(--color-text-muted)]" />
                    <input
                      type="text"
                      placeholder="Nama Lengkap"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="w-full rounded-xl border border-[var(--color-border-strong)] bg-[var(--color-surface)] py-2.5 pl-10 pr-4 text-sm focus:border-[#348CB2] focus:outline-none"
                    />
                  </div>
                  <div className="relative">
                    <Building2 className="pointer-events-none absolute left-3.5 top-3 h-4 w-4 text-[var(--color-text-muted)]" />
                    <input
                      type="text"
                      placeholder="Nama Perusahaan"
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      className="w-full rounded-xl border border-[var(--color-border-strong)] bg-[var(--color-surface)] py-2.5 pl-10 pr-4 text-sm focus:border-[#348CB2] focus:outline-none"
                    />
                  </div>
                  <div className="relative">
                    <Mail className="pointer-events-none absolute left-3.5 top-3 h-4 w-4 text-[var(--color-text-muted)]" />
                    <input
                      type="email"
                      placeholder="Email Perusahaan"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full rounded-xl border border-[var(--color-border-strong)] bg-[var(--color-surface)] py-2.5 pl-10 pr-4 text-sm focus:border-[#348CB2] focus:outline-none"
                    />
                  </div>
                  <div className="relative">
                    <Phone className="pointer-events-none absolute left-3.5 top-3 h-4 w-4 text-[var(--color-text-muted)]" />
                    <input
                      type="tel"
                      placeholder="No. WhatsApp"
                      value={whatsapp}
                      onChange={(e) => setWhatsapp(e.target.value)}
                      className="w-full rounded-xl border border-[var(--color-border-strong)] bg-[var(--color-surface)] py-2.5 pl-10 pr-4 text-sm focus:border-[#348CB2] focus:outline-none"
                    />
                  </div>

                  {formTab === 'subscribe' ? (
                    <div>
                      <select
                        aria-label="Paket Pilihan"
                        value={selectedPlan}
                        onChange={(e) => setSelectedPlan(e.target.value)}
                        className="w-full rounded-xl border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-3.5 py-2.5 text-sm focus:border-[#348CB2] focus:outline-none"
                      >
                        <option value="Starter (Rp 2.000.000/bulan)">
                          Starter — Rp 2.000.000 /bulan
                        </option>
                        <option value="Growth (Rp 4.900.000/bulan)">
                          Growth — Rp 4.900.000 /bulan (Paling Populer)
                        </option>
                        <option value="Business (Rp 9.500.000/bulan)">
                          Business — Rp 9.500.000 /bulan
                        </option>
                        <option value="Enterprise (Mulai Rp 18.000.000/bulan)">
                          Enterprise — Mulai Rp 18.000.000 /bulan (Custom)
                        </option>
                      </select>
                    </div>
                  ) : (
                    <div className="relative">
                      <Clock className="pointer-events-none absolute left-3.5 top-3 h-4 w-4 text-[var(--color-text-muted)]" />
                      <input
                        type="date"
                        value={demoDate}
                        onChange={(e) => setDemoDate(e.target.value)}
                        className="w-full rounded-xl border border-[var(--color-border-strong)] bg-[var(--color-surface)] py-2.5 pl-10 pr-4 text-sm focus:border-[#348CB2] focus:outline-none"
                      />
                    </div>
                  )}

                  {formError && (
                    <p className="text-xs font-medium text-red-600 dark:text-red-400">
                      {formError}
                    </p>
                  )}

                  <button
                    type="submit"
                    className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-[#194F70] py-3 text-sm font-bold text-white hover:bg-[#123A54] transition-colors cursor-pointer"
                  >
                    <span>
                      {formTab === 'subscribe'
                        ? 'Kirim Pendaftaran'
                        : 'Ajukan Jadwal Demo'}
                    </span>
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </form>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Quiet Footer */}
      <footer className="border-t border-[var(--color-border)] bg-[var(--color-background)] py-10">
        <div className="mx-auto flex max-w-7xl flex-col sm:flex-row items-start sm:items-center justify-between gap-6 px-4 sm:px-6 lg:px-8">
          <div>
            <BrandLogo />
            <p className="mt-2 text-xs text-[var(--color-text-muted)]">
              © 2026 SalesX-Ai. Platform Operasional Penjualan & Distribusi
              Cerdas.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-5 text-xs font-medium text-[var(--color-text-secondary)]">
            <Link href={getSalesXPortalUrlForPath("/distributor")} className="hover:text-[#348CB2]">
              Distributor Portal
            </Link>
            <Link href={getSalesXPortalUrlForPath("/principal")} className="hover:text-[#348CB2]">
              Principal Portal
            </Link>
            <Link href={getSalesXPortalUrlForPath("/supervisor")} className="hover:text-[#348CB2]">
              Supervisor Portal
            </Link>
            <Link href={getSalesXPortalUrlForPath("/company")} className="hover:text-[#348CB2]">
              Company Portal
            </Link>
            <Link href={getSalesXPortalUrlForPath("/portal")} className="hover:text-[#348CB2]">
              Sales Portal
            </Link>
            <Link href={getSalesXPortalUrlForPath("/customer")} className="hover:text-[#348CB2]">
              Customer Portal
            </Link>
            <a href="#produk" className="hover:text-[#348CB2]">
              Produk
            </a>
            <a href="#harga" className="hover:text-[#348CB2]">
              Paket
            </a>
            <a href="#faq" className="hover:text-[#348CB2]">
              FAQ
            </a>
            <button
              type="button"
              onClick={() => setLegalModalOpen(true)}
              className="hover:text-[#348CB2] cursor-pointer"
            >
              Privasi & Kepatuhan GPS
            </button>
            <button
              type="button"
              onClick={() => setSupportModalOpen(true)}
              className="hover:text-[#348CB2] cursor-pointer"
            >
              Dukungan Enterprise
            </button>
            <PWAInstallButton variant="compact" />
          </div>
        </div>
      </footer>

      {/* Detail Modal for Products & Features */}
      <Modal
        open={!!selectedDetail}
        onClose={() => setSelectedDetail(null)}
        title={selectedDetail?.title || ''}
        subtitle={selectedDetail?.category}
      >
        {selectedDetail && (
          <div className="space-y-4">
            <p className="text-sm leading-relaxed text-[var(--color-text-secondary)]">
              {selectedDetail.description}
            </p>
            <ul className="space-y-2.5 text-sm text-[var(--color-text-primary)]">
              {selectedDetail.bullets.map((b) => (
                <li key={b} className="flex items-start gap-2.5">
                  <CheckCircle2 className="h-4 w-4 text-[#10B981] shrink-0 mt-0.5" />
                  <span>{b}</span>
                </li>
              ))}
            </ul>
            <div className="pt-2 flex flex-col-reverse sm:flex-row sm:items-center sm:justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setSelectedDetail(null)}
                className="w-full sm:w-auto rounded-lg border border-[var(--color-border)] px-4 py-2.5 text-sm font-medium hover:bg-[var(--color-surface-muted)] cursor-pointer"
              >
                Tutup
              </button>
              <Link
                href={getSalesXPortalUrlForPath("/portal")}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 rounded-lg bg-[#348CB2] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#236D91]"
              >
                <span>Buka di Sales Portal</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        )}
      </Modal>

      {/* Registration / Demo Confirmation Modal */}
      <Modal
        open={submittedModal}
        onClose={() => setSubmittedModal(false)}
        title={
          formTab === 'subscribe'
            ? 'Pendaftaran Langganan Diterima'
            : 'Permintaan Demo Dijadwalkan'
        }
        subtitle={`Atas nama ${fullName} · ${companyName}`}
      >
        <div className="space-y-4">
          <div className="rounded-xl bg-[#ECFDF5] dark:bg-[#064E3B]/50 p-4 text-sm text-[#047857] dark:text-[#34D399]">
            Terima kasih! Tim SalesX-Ai akan menghubungi{' '}
            <strong>{email}</strong> dan WhatsApp <strong>{whatsapp}</strong>{' '}
            untuk aktivasi{' '}
            {formTab === 'subscribe'
              ? `paket ${selectedPlan}`
              : `sesi demo tanggal ${demoDate}`}
            .
          </div>
          <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-end gap-2.5">
            <button
              type="button"
              onClick={() => setSubmittedModal(false)}
              className="w-full sm:w-auto rounded-lg border border-[var(--color-border)] px-4 py-2.5 text-sm font-medium cursor-pointer"
            >
              Selesai
            </button>
            <Link
              href={getSalesXPortalUrlForPath("/portal")}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 rounded-lg bg-[#348CB2] px-4 py-2.5 text-sm font-semibold text-white"
            >
              <span>Masuk ke Sales Portal</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </Modal>

      {/* Kebijakan Privasi & GPS Modal */}
      <Modal
        open={legalModalOpen}
        onClose={() => setLegalModalOpen(false)}
        title="Kebijakan Privasi & Kepatuhan GPS"
        subtitle="Transparansi pelacakan lokasi & keamanan data operasional SalesX-Ai"
      >
        <div className="space-y-3 text-sm text-[var(--color-text-secondary)]">
          <div className="rounded-xl border border-[#ADD8E6] bg-[#F3FAFC] dark:bg-[#172438] p-4 space-y-1.5">
            <p className="font-bold text-[#123A54] dark:text-[#87CEEB]">
              Pelacakan Hanya Aktif Saat Jam Kerja
            </p>
            <p className="text-xs leading-relaxed">
              Lokasi GPS hanya dikirim saat tim sales menekan Mulai Sesi Kerja / Check-in Geofence dan berhenti otomatis ketika shift berakhir.
            </p>
          </div>
          <ul className="space-y-2 text-xs">
            <li className="flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 text-[#10B981] shrink-0 mt-0.5" />
              <span>Data kunjungan, bukti foto outlet, dan riwayat order dienkripsi end-to-end dengan jejak audit aktivitas.</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 text-[#10B981] shrink-0 mt-0.5" />
              <span>Pencarian bisnis dan tempat menggunakan layanan resmi Google Maps Platform tanpa penyimpanan data cache ilegal.</span>
            </li>
          </ul>
          <div className="flex justify-end pt-2">
            <button
              type="button"
              onClick={() => setLegalModalOpen(false)}
              className="w-full sm:w-auto rounded-lg bg-[#348CB2] px-4 py-2.5 text-xs font-semibold text-white cursor-pointer"
            >
              Saya Mengerti
            </button>
          </div>
        </div>
      </Modal>

      {/* Dukungan Enterprise Modal */}
      <Modal
        open={supportModalOpen}
        onClose={() => setSupportModalOpen(false)}
        title="Pusat Dukungan Enterprise SalesX-Ai"
        subtitle="Konsultasi implementasi tim distribusi, ERP, & SLA"
      >
        <div className="space-y-3 text-xs text-[var(--color-text-secondary)]">
          <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] p-4 space-y-2">
            <p className="font-bold text-sm text-[var(--color-text-primary)]">
              Kanal Bantuan Resmi
            </p>
            <p>Email Implementasi: <strong>enterprise@salesx-ai.id</strong></p>
            <p>WhatsApp Business Support: <strong>+62 811-8890-2026</strong> (Senin–Sabtu, 08:00–18:00 WIB)</p>
            <p>Kantor Pusat Operasional: Jl. Raya Pajajaran No. 88, Kota Bogor, Jawa Barat</p>
          </div>
          <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setSupportModalOpen(false)}
              className="w-full sm:w-auto rounded-lg border border-[var(--color-border)] px-4 py-2.5 text-xs font-semibold cursor-pointer"
            >
              Tutup
            </button>
            <a
              href="#daftar"
              onClick={() => {
                setSupportModalOpen(false);
                setFormTab('demo');
              }}
              className="w-full sm:w-auto text-center rounded-lg bg-[#F97316] px-4 py-2.5 text-xs font-bold text-white"
            >
              Jadwalkan Konsultasi
            </a>
          </div>
        </div>
      </Modal>
    </div>
  );
}
