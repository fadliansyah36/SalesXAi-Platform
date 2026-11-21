'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import {
  Home,
  Package,
  Building2,
  BarChart3,
  Menu as MenuIcon,
  Layers,
  Barcode,
  ClipboardList,
  SlidersHorizontal,
  Megaphone,
  ShoppingCart,
  Bot,
  Search,
  Plus,
  ChevronRight,
  Mail,
  Lock,
  Eye,
  EyeOff,
  Phone,
  MapPin,
  FileText,
  Sparkles,
  ShieldCheck,
  Settings,
  Sun,
  Moon,
  TrendingUp,
  Trophy,
  Puzzle,
  Edit3,
  Power,
  Download,
  Map as MapIcon,
} from 'lucide-react';
import { BrandLogo } from '@/components/common/BrandLogo';
import { useTheme } from '@/components/providers/AppProviders';
import { PortalShell, type PortalNavGroup } from '@/components/design-system/PortalShell';
import { KpiMetricCard } from '@/components/design-system/KpiMetricCard';
import { StatusTag } from '@/components/design-system/StatusTag';
import { PluginActivationModal } from '@/components/design-system/PluginActivationModal';
import { PortalAiCoachModal } from '@/components/design-system/PortalAiCoachModal';
import { SalesGoogleMap } from '@/components/maps/SalesGoogleMap';
import { useSalesXAuth } from '@/components/providers/AppProviders';
import { SmartRewardWorkspace } from '@/components/smart-reward/SmartRewardWorkspace';
import { PortalSignupAction } from '@/components/auth/PortalSignupAction';
import {
  formatRupiah,
  INITIAL_NOTIFICATIONS,
  INITIAL_OUTLETS,
  type NotificationItem,
  type Outlet,
} from '@/lib/salesx-data';
import {
  PRINCIPAL_PROFILE,
  PRINCIPAL_SALES_THROUGH_TREND,
  PRINCIPAL_CAMPAIGN_ANALYTICS,
  INITIAL_PRINCIPAL_PRODUCTS,
  INITIAL_PRINCIPAL_CATEGORIES,
  INITIAL_PRINCIPAL_VARIANTS,
  INITIAL_PRINCIPAL_PRICELIST,
  INITIAL_PRICING_POLICIES,
  INITIAL_PRINCIPAL_CAMPAIGNS,
  INITIAL_PRINCIPAL_DISTRIBUTORS,
  INITIAL_PRINCIPAL_ORDERS,
  type PrincipalProductRecord,
  type PrincipalCategorySummary,
  type PrincipalProductVariant,
  type PrincipalDistributorPriceRow,
  type PricingPolicyRule,
  type PrincipalCampaignItem,
  type PrincipalDistributorPartner,
  type PrincipalDistributorOrder,
} from '@/lib/salesx-portals-data';
import {
  DaftarPrincipalModal,
  AddProductPrincipalModal,
  AddCategoryModal,
  AddVariantModal,
  UpdatePriceListModal,
  PricingPolicyModal,
  CreateCampaignModal,
  AddDistributorModal,
  DistributorNoteModal,
  PrincipalOrderDetailModal,
  PrincipalAccessModal,
  PrincipalNotificationsModal,
  PrincipalProductDetailModal,
  EditVariantModal,
  AddPriceListRowModal,
  EditCampaignModal,
  PrincipalProfileModal,
} from './PrincipalModals';

export type PrincipalTab =
  | 'dashboard'
  | 'products'
  | 'categories'
  | 'variants'
  | 'pricelist'
  | 'pricing_policy'
  | 'campaigns'
  | 'campaign_detail'
  | 'distributors'
  | 'distributor_detail'
  | 'dist_orders'
  | 'analytics'
  | 'ai_settings'
  | 'smartreward';

export function PrincipalPortalApp() {
  const auth = useSalesXAuth();
  const { theme, toggleTheme } = useTheme();

  // Auth
  const authenticated = auth.status === 'authenticated';
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [authNotice, setAuthNotice] = useState<string | null>(null);
  const [oauthBusy, setOauthBusy] = useState(false);
  const [daftarModalOpen, setDaftarModalOpen] = useState(false);

  // Navigation
  const [activeTab, setActiveTab] = useState<PrincipalTab>('dashboard');
  const [period, setPeriod] = useState<'Bulan Ini' | 'Kuartal Ini' | 'Tahun Ini'>('Bulan Ini');

  // Data state
  const [products, setProducts] = useState<PrincipalProductRecord[]>(
    INITIAL_PRINCIPAL_PRODUCTS
  );
  const [categories, setCategories] = useState<PrincipalCategorySummary[]>(
    INITIAL_PRINCIPAL_CATEGORIES
  );
  const [variants, setVariants] = useState<PrincipalProductVariant[]>(
    INITIAL_PRINCIPAL_VARIANTS
  );
  const [priceList, setPriceList] = useState<PrincipalDistributorPriceRow[]>(
    INITIAL_PRINCIPAL_PRICELIST
  );
  const [policies, setPolicies] = useState<PricingPolicyRule[]>(
    INITIAL_PRICING_POLICIES
  );
  const [campaigns, setCampaigns] = useState<PrincipalCampaignItem[]>(
    INITIAL_PRINCIPAL_CAMPAIGNS
  );
  const [distributors, setDistributors] = useState<PrincipalDistributorPartner[]>(
    INITIAL_PRINCIPAL_DISTRIBUTORS
  );
  const [distOrders, setDistOrders] = useState<PrincipalDistributorOrder[]>(
    INITIAL_PRINCIPAL_ORDERS
  );
  const [notifications, setNotifications] = useState<NotificationItem[]>(
    INITIAL_NOTIFICATIONS
  );
  const [principalProfile, setPrincipalProfile] = useState({
    companyName: PRINCIPAL_PROFILE.companyName,
    email: PRINCIPAL_PROFILE.email,
    monthlyTargetRp: 5_000_000_000,
    autoApprovePo: true,
  });

  // Filters & Selections
  const [productSearch, setProductSearch] = useState('');
  const [productFilter, setProductFilter] = useState<'Semua' | 'Aktif' | 'Nonaktif'>(
    'Semua'
  );
  const [productCategoryFilter, setProductCategoryFilter] = useState<string>('Semua');
  const [selectedParentSku, setSelectedParentSku] = useState('SX-MNM-001');
  const [variantTab, setVariantTab] = useState<'Varian' | 'Detail'>('Varian');
  const [priceListMode, setPriceListMode] = useState<'Per Distributor' | 'Rekap'>(
    'Per Distributor'
  );
  const [selectedPriceDistId, setSelectedPriceDistId] = useState('pdist-1');
  const [priceListSearch, setPriceListSearch] = useState('');
  const [campaignFilter, setCampaignFilter] = useState<
    'Program' | 'Draft' | 'Selesai'
  >('Program');
  const [selectedCampaignId, setSelectedCampaignId] = useState('pcamp-1');
  const [campaignDetailTab, setCampaignDetailTab] = useState<
    'Ringkasan' | 'Target' | 'Distribusi'
  >('Ringkasan');
  const [distSearch, setDistSearch] = useState('');
  const [distStatusFilter, setDistStatusFilter] = useState<
    'Semua' | 'Aktif' | 'Nonaktif'
  >('Semua');
  const [distRegionFilter, setDistRegionFilter] = useState<string>('Semua');
  const [showDistributorMap, setShowDistributorMap] = useState(false);
  const [selectedDistributorId, setSelectedDistributorId] = useState('pdist-1');
  const [distDetailTab, setDistDetailTab] = useState<
    'Informasi' | 'Kinerja' | 'Kontrak'
  >('Informasi');
  const [orderDistFilterId, setOrderDistFilterId] = useState('pdist-1');
  const [orderPeriodFilter, setOrderPeriodFilter] = useState<
    'Bulan Ini' | 'Kuartal Ini' | 'Semua'
  >('Bulan Ini');
  const [orderStatusFilter, setOrderStatusFilter] = useState<
    'Semua' | 'Diproses' | 'Dikirim' | 'Selesai'
  >('Semua');
  const [analyticsSubTab, setAnalyticsSubTab] = useState<'Sales-through' | 'Campaign'>(
    'Sales-through'
  );

  // Modals
  const [addProdOpen, setAddProdOpen] = useState(false);
  const [editingProductDetail, setEditingProductDetail] =
    useState<PrincipalProductRecord | null>(null);
  const [addCatOpen, setAddCatOpen] = useState(false);
  const [addVariantOpen, setAddVariantOpen] = useState(false);
  const [editingVariant, setEditingVariant] =
    useState<PrincipalProductVariant | null>(null);
  const [editingPriceRow, setEditingPriceRow] =
    useState<PrincipalDistributorPriceRow | null>(null);
  const [addPriceListOpen, setAddPriceListOpen] = useState(false);
  const [editingPolicy, setEditingPolicy] = useState<PricingPolicyRule | null>(null);
  const [createCampaignOpen, setCreateCampaignOpen] = useState(false);
  const [editingCampaign, setEditingCampaign] =
    useState<PrincipalCampaignItem | null>(null);
  const [addDistributorOpen, setAddDistributorOpen] = useState(false);
  const [noteDistributor, setNoteDistributor] =
    useState<PrincipalDistributorPartner | null>(null);
  const [detailOrder, setDetailOrder] =
    useState<PrincipalDistributorOrder | null>(null);
  const [accessModalOpen, setAccessModalOpen] = useState(false);
  const [principalProfileOpen, setPrincipalProfileOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [pluginsModalOpen, setPluginsModalOpen] = useState(false);
  const [pluginDefaultTab, setPluginDefaultTab] = useState<
    'workspace' | 'maps' | 'ai' | 'telegram'
  >('workspace');
  const [pluginPrefillEmail, setPluginPrefillEmail] = useState<string | undefined>(
    undefined
  );
  const [aiCoachOpen, setAiCoachOpen] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3200);
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  const navGroups: PortalNavGroup<PrincipalTab>[] = [
    {
      group: 'Beranda',
      items: [{ id: 'dashboard', label: 'Principal Dashboard', icon: Home }],
    },
    {
      group: 'Katalog & Harga',
      items: [
        { id: 'products', label: 'Product Master', icon: Package },
        { id: 'categories', label: 'Kategori Produk', icon: Layers },
        { id: 'variants', label: 'Varian / SKU Produk', icon: Barcode },
        { id: 'pricelist', label: 'Ketersediaan & Price List', icon: ClipboardList },
        { id: 'pricing_policy', label: 'Pricing Policy', icon: SlidersHorizontal },
      ],
    },
    {
      group: 'Promosi & Distribusi',
      items: [
        { id: 'campaigns', label: 'Promotion Campaign', icon: Megaphone },
        { id: 'distributors', label: 'Jaringan Distributor', icon: Building2 },
        { id: 'dist_orders', label: 'Order Distributor', icon: ShoppingCart },
      ],
    },
    {
      group: 'Analitik & AI',
      items: [
        { id: 'analytics', label: 'Sales-through & Analitik', icon: BarChart3 },
        { id: 'ai_settings', label: 'AI Insight & Akses', icon: Bot },
        ...(auth.canPerformApiAction('smartreward.catalog.read') ? [{ id: 'smartreward' as PrincipalTab, label: 'SmartReward & Incentive', icon: Trophy }] : []),
      ],
    },
  ];

  const bottomNavItems = [
    { id: 'dashboard' as PrincipalTab, label: 'Beranda', icon: Home },
    { id: 'products' as PrincipalTab, label: 'Produk', icon: Package },
    { id: 'distributors' as PrincipalTab, label: 'Distribusi', icon: Building2 },
    { id: 'analytics' as PrincipalTab, label: 'Laporan', icon: BarChart3 },
    { id: 'ai_settings' as PrincipalTab, label: 'Lainnya', icon: MenuIcon },
  ];

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchSearch =
        p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
        p.sku.toLowerCase().includes(productSearch.toLowerCase());
      const matchFilter =
        productFilter === 'Semua' || p.status === productFilter;
      const matchCategory =
        productCategoryFilter === 'Semua' || p.category === productCategoryFilter;
      return matchSearch && matchFilter && matchCategory;
    });
  }, [products, productSearch, productFilter, productCategoryFilter]);

  const activeParentProduct =
    products.find((p) => p.sku === selectedParentSku) || products[0];

  const parentVariants = useMemo(
    () => variants.filter((v) => v.parentSku === selectedParentSku),
    [variants, selectedParentSku]
  );

  const activeCampaign =
    campaigns.find((c) => c.id === selectedCampaignId) || campaigns[0];

  const activeDistributor =
    distributors.find((d) => d.id === selectedDistributorId) || distributors[0];

  const filteredDistributors = useMemo(() => {
    return distributors.filter((d) => {
      const matchQuery =
        d.name.toLowerCase().includes(distSearch.toLowerCase()) ||
        d.region.toLowerCase().includes(distSearch.toLowerCase());
      const matchStatus =
        distStatusFilter === 'Semua' || d.status === distStatusFilter;
      const matchRegion =
        distRegionFilter === 'Semua' || d.region === distRegionFilter;
      return matchQuery && matchStatus && matchRegion;
    });
  }, [distributors, distSearch, distStatusFilter, distRegionFilter]);

  const distributorMapOutlets: Outlet[] = useMemo(() => {
    const coordsByRegion: Record<string, { lat: number; lng: number }> = {
      'Jawa Barat': { lat: -6.597147, lng: 106.806039 },
      'Jawa Tengah': { lat: -6.966667, lng: 110.416664 },
      'Jawa Timur': { lat: -7.257472, lng: 112.752088 },
      Sumatera: { lat: 3.595196, lng: 98.672226 },
    };
    return filteredDistributors.map((d, idx) => {
      const base = coordsByRegion[d.region] || {
        lat: -6.2 + idx * 0.08,
        lng: 106.8 + idx * 0.08,
      };
      return {
        id: d.id,
        name: d.name,
        city: d.region,
        address: `${d.warehouseLocation} (${d.region})`,
        distanceKm: 4.5 + idx * 12,
        isPriority: d.slaOnTimePct >= 95,
        visitToday: d.status === 'Aktif',
        status: d.status,
        category: 'Distributor Hub',
        picName: d.picName,
        phone: d.phone,
        email: d.email,
        lat: base.lat,
        lng: base.lng,
        lastOrderTotal: d.monthlySalesValue,
        lastVisitDate: 'Hari ini',
      };
    });
  }, [filteredDistributors]);

  const filteredPriceRows = useMemo(() => {
    const base =
      priceListMode === 'Rekap'
        ? priceList
        : priceList.filter((r) => r.distributorId === selectedPriceDistId);
    if (!priceListSearch.trim()) return base;
    const q = priceListSearch.toLowerCase();
    return base.filter(
      (r) =>
        r.productName.toLowerCase().includes(q) ||
        r.sku.toLowerCase().includes(q) ||
        r.distributorName.toLowerCase().includes(q)
    );
  }, [priceList, priceListMode, selectedPriceDistId, priceListSearch]);

  const filteredDistOrders = useMemo(() => {
    return distOrders.filter((o) => {
      const matchDist =
        orderDistFilterId === 'ALL' || o.distributorId === orderDistFilterId;
      const matchStatus =
        orderStatusFilter === 'Semua' || o.status === orderStatusFilter;
      return matchDist && matchStatus;
    });
  }, [distOrders, orderDistFilterId, orderStatusFilter]);

  const handleGoogleLogin = async () => {
    setOauthBusy(true);
    setAuthNotice(null);
    try { await auth.signInWithOAuth('google'); }
    catch (err) { setAuthNotice(err instanceof Error ? err.message : 'Autentikasi Google Supabase gagal.'); setOauthBusy(false); }
  };

  /* -------------------- SCREEN 1: LOGIN / MASUK -------------------- */
  if (authenticated && !auth.canAccessPortal('principal')) {
    return <main className="flex min-h-screen items-center justify-center p-6"><section className="max-w-md rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 text-center"><h1 className="text-lg font-bold">Akses portal tidak tersedia</h1><p className="mt-2 text-sm text-[var(--color-text-secondary)]">Role aktif tidak memiliki permission untuk portal ini.</p><button onClick={() => void auth.signOut('local')} className="mt-4 rounded-lg bg-[#236D91] px-4 py-2 text-white">Keluar</button></section></main>;
  }
  if (!authenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#F3FAFC] via-[#E5F4F8] to-white dark:from-[#0B1220] dark:via-[#111C2D] dark:to-[#0B1220] flex flex-col justify-between p-4 sm:p-8">
        <div className="mx-auto w-full max-w-md flex items-center justify-between">
          <Link href="/">
            <BrandLogo subtitle="PRINCIPAL PORTAL" compact />
          </Link>
          <button
            type="button"
            onClick={toggleTheme}
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] cursor-pointer"
            aria-label="Ganti tema"
          >
            {theme === 'light' ? (
              <Moon className="h-4 w-4" />
            ) : (
              <Sun className="h-4 w-4" />
            )}
          </button>
        </div>

        <div className="mx-auto w-full max-w-md my-8 rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 sm:p-8 shadow-sm">
          <div className="flex flex-col items-center text-center">
            <BrandLogo subtitle="PRINCIPAL PORTAL" />
            <p className="mt-4 text-xs sm:text-sm text-[var(--color-text-secondary)] max-w-xs">
              Portal Principal untuk mengelola produk, pricing, promosi, dan jaringan distribusi secara terintegrasi.
            </p>
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!loginEmail.trim() || !loginPassword.trim()) {
                setAuthNotice('Mohon masukkan Email/No. HP dan Password.');
                return;
              }
              setAuthNotice(null);
              void auth.signInWithPassword(loginEmail, loginPassword)
                .then(() => setAuthNotice(null))
                .catch(err => setAuthNotice(err instanceof Error ? err.message : 'Login gagal.'));
            }}
            className="mt-6 space-y-3.5 text-sm"
          >
            <div className="relative">
              <Mail className="pointer-events-none absolute left-3.5 top-3.5 h-4 w-4 text-[var(--color-text-muted)]" />
              <input
                type="text"
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                placeholder="Email / No. HP"
                className="w-full rounded-xl border border-[var(--color-border-strong)] bg-[var(--color-background)] pl-10 pr-4 py-3 text-xs sm:text-sm"
              />
            </div>

            <div className="relative">
              <Lock className="pointer-events-none absolute left-3.5 top-3.5 h-4 w-4 text-[var(--color-text-muted)]" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                placeholder="Password"
                className="w-full rounded-xl border border-[var(--color-border-strong)] bg-[var(--color-background)] pl-10 pr-10 py-3 text-xs sm:text-sm"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3 top-3 text-[var(--color-text-muted)] cursor-pointer"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>

            <div className="flex items-center justify-between text-xs">
              <label className="inline-flex items-center gap-2 cursor-pointer text-[var(--color-text-secondary)]">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="h-4 w-4 accent-[#348CB2]"
                />
                <span>Ingat saya</span>
              </label>
              <button
                type="button"
                onClick={() => { void auth.requestPasswordReset(loginEmail).then(() => setAuthNotice('Instruksi pemulihan dikirim jika email terdaftar.')).catch(err => setAuthNotice(err instanceof Error ? err.message : 'Reset password gagal.')); }}
                className="font-semibold text-[#348CB2] hover:underline cursor-pointer"
              >
                Lupa password?
              </button>
            </div>

            {authNotice && (
              <div className="rounded-xl border border-[#ADD8E6] bg-[#F3FAFC] dark:bg-[#172438] p-3 text-xs text-[#194F70] dark:text-[#87CEEB]">
                {authNotice}
              </div>
            )}

            <button
              type="submit"
              className="w-full rounded-xl bg-[#194F70] hover:bg-[#123A54] py-3 text-sm font-bold text-white cursor-pointer"
            >
              Masuk
            </button>

            <div className="flex items-center gap-3 text-xs text-[var(--color-text-muted)]">
              <span className="h-px flex-1 bg-[var(--color-border)]" />
              <span>atau</span>
              <span className="h-px flex-1 bg-[var(--color-border)]" />
            </div>

            <button
              type="button"
              onClick={() => setDaftarModalOpen(true)}
              className="w-full rounded-xl border border-[#348CB2] py-2.5 text-sm font-bold text-[#194F70] dark:text-[#87CEEB] cursor-pointer"
            >
              Daftar Principal
            </button>

            <button
              type="button"
              disabled={oauthBusy}
              onClick={handleGoogleLogin}
              className="w-full inline-flex items-center justify-center gap-2 rounded-xl border border-[var(--color-border-strong)] py-2.5 text-xs font-semibold cursor-pointer"
            >
              <Mail className="h-4 w-4 text-[#348CB2]" />
              <span>
                {oauthBusy ? 'Menghubungkan...' : 'Masuk dengan Google Workspace'}
              </span>
            </button>

            <div className="rounded-xl bg-[#F3FAFC] dark:bg-[#172438] p-2.5 text-center text-[11px] font-medium text-[#194F70] dark:text-[#87CEEB]">
              Akses Khusus untuk Principal / Pemilik Produk
            </div>
          
            <PortalSignupAction email={loginEmail} password={loginPassword} onMessage={setAuthNotice} />
</form>
        </div>

        <p className="text-center text-xs text-[var(--color-text-muted)]">
          © 2026 SalesX-Ai · Principal Portal
        </p>

        <DaftarPrincipalModal
          open={daftarModalOpen}
          onClose={() => setDaftarModalOpen(false)}
        />
      </div>
    );
  }

  return (
    <PortalShell<PrincipalTab>
      portalSubtitle="PRINCIPAL PORTAL"
      entityName={PRINCIPAL_PROFILE.companyName}
      entityBadge={`${distributors.filter((d) => d.status === 'Aktif').length} Distributor Aktif`}
      activeTab={activeTab}
      onSelectTab={setActiveTab}
      navGroups={navGroups}
      bottomNavItems={bottomNavItems}
      unreadNotificationsCount={unreadCount}
      onOpenNotifications={() => setNotificationsOpen(true)}
      onOpenPlugins={() => {
        setPluginDefaultTab('workspace');
        setPluginPrefillEmail(undefined);
        setPluginsModalOpen(true);
      }}
      onOpenAiAssistant={() => setAiCoachOpen(true)}
      aiAssistantLabel="AI Business Insight"
      onRequestLogout={() => void auth.signOut('local')}
      currentPortalPath="/principal"
    >
      {toastMsg && (
        <div className="mb-4 rounded-xl border border-[#A7F3D0] bg-[#ECFDF5] dark:bg-[#064E3B]/50 px-4 py-2.5 text-xs font-semibold text-[#047857] dark:text-[#34D399] flex items-center justify-between">
          <span>{toastMsg}</span>
          <button
            type="button"
            onClick={() => setToastMsg(null)}
            className="text-[11px] underline cursor-pointer"
          >
            Tutup
          </button>
        </div>
      )}

      {/* -------------------- SCREEN 2: PRINCIPAL DASHBOARD -------------------- */}
      {activeTab === 'dashboard' && (
        <div className="space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-[#123A54] dark:text-white">
                Halo, {PRINCIPAL_PROFILE.companyName}
              </h2>
              <p className="text-xs sm:text-sm text-[var(--color-text-secondary)]">
                Principal Dashboard · Kendali produk, harga, campaign & jaringan distribusi nasional
              </p>
            </div>
            <div className="flex items-center gap-2">
              <label className="text-xs font-medium text-[var(--color-text-muted)]">
                Periode:
              </label>
              <select
                value={period}
                onChange={(e) =>
                  setPeriod(e.target.value as 'Bulan Ini' | 'Kuartal Ini' | 'Tahun Ini')
                }
                className="rounded-xl border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-3 py-2 text-xs font-semibold"
              >
                <option value="Bulan Ini">Bulan Ini</option>
                <option value="Kuartal Ini">Kuartal Ini</option>
                <option value="Tahun Ini">Tahun Ini</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
            <KpiMetricCard
              label="Sales-through"
              value={period === 'Bulan Ini' ? 'Rp 4.258,9 jt' : period === 'Kuartal Ini' ? 'Rp 12,1 M' : 'Rp 48,4 M'}
              trend="+18,2%"
              trendTone="positive"
              icon={<TrendingUp className="h-5 w-5" />}
              onClick={() => setActiveTab('analytics')}
            />
            <KpiMetricCard
              label="Total Order"
              value={period === 'Bulan Ini' ? '8.425' : period === 'Kuartal Ini' ? '24.810' : '96.420'}
              trend="+15,6%"
              trendTone="positive"
              accentBgClass="bg-[#ECFDF5] dark:bg-[#064E3B]/50 text-[#047857]"
              icon={<ShoppingCart className="h-5 w-5" />}
              onClick={() => setActiveTab('dist_orders')}
            />
            <KpiMetricCard
              label="Distributor"
              value="24"
              sublabel="Aktif"
              trendTone="positive"
              icon={<Building2 className="h-5 w-5" />}
              onClick={() => setActiveTab('distributors')}
            />
            <KpiMetricCard
              label="Produk Aktif"
              value="320"
              sublabel="SKU"
              trendTone="positive"
              accentBgClass="bg-[#FFFBEB] dark:bg-[#451A03]/40 text-[#B45309]"
              icon={<Package className="h-5 w-5" />}
              onClick={() => setActiveTab('products')}
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            {/* Tren Penjualan (Sales-through) Area-style Chart */}
            <div className="lg:col-span-7 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-[#123A54] dark:text-white">
                    Tren Penjualan (Sales-through)
                  </h3>
                  <p className="text-xs text-[var(--color-text-muted)]">
                    Realisasi penjualan nasional ke outlet melalui jaringan distributor
                  </p>
                </div>
                <span className="text-xs font-bold text-[#047857] font-mono tabular-nums">
                  +18,2%
                </span>
              </div>
              <div className="grid grid-cols-6 gap-2.5 items-end h-44 pt-4">
                {PRINCIPAL_SALES_THROUGH_TREND.map((row) => (
                  <div key={row.month} className="flex flex-col items-center gap-2 h-full justify-end">
                    <span className="text-[10px] font-mono font-semibold text-[var(--color-text-muted)] tabular-nums">
                      {row.valueJt}jt
                    </span>
                    <div
                      className="w-full max-w-[44px] rounded-t-lg bg-gradient-to-t from-[#194F70] via-[#348CB2] to-[#87CEEB]"
                      style={{ height: `${Math.round((row.displayScale / 48) * 100)}%` }}
                    />
                    <span className="text-xs font-semibold text-[var(--color-text-secondary)]">
                      {row.month}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Modules matching Screen 2 */}
            <div className="lg:col-span-5 space-y-4">
              <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5">
                <h3 className="text-sm font-bold text-[#123A54] dark:text-white mb-3">
                  Menu Utama Principal
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: 'Produk Master', sub: '320 SKU', tab: 'products' as PrincipalTab, icon: Package },
                    { label: 'Promo & Campaign', sub: `${campaigns.length} program`, tab: 'campaigns' as PrincipalTab, icon: Megaphone },
                    { label: 'Distributor', sub: '24 mitra aktif', tab: 'distributors' as PrincipalTab, icon: Building2 },
                    { label: 'Laporan Analitik', sub: 'Sales-through', tab: 'analytics' as PrincipalTab, icon: BarChart3 },
                  ].map((item) => {
                    const Icon = item.icon;
                    return (
                      <button
                        key={item.label}
                        type="button"
                        onClick={() => setActiveTab(item.tab)}
                        className="flex flex-col items-start gap-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] p-3.5 text-left hover:border-[#348CB2] cursor-pointer"
                      >
                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#E5F4F8] dark:bg-[#19394B] text-[#348CB2]">
                          <Icon className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="text-xs font-bold">{item.label}</p>
                          <p className="text-[11px] text-[var(--color-text-muted)]">{item.sub}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="rounded-2xl bg-gradient-to-r from-[#194F70] to-[#348CB2] p-4 text-white flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-bold flex items-center gap-1.5">
                    <Sparkles className="h-4 w-4" />
                    <span>AI Business Insight Siap</span>
                  </p>
                  <p className="text-[11px] text-white/85 mt-0.5">
                    Analisis peluang pasar & performa SKU di tiap distributor.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setAiCoachOpen(true)}
                  className="rounded-xl bg-white px-3 py-2 text-xs font-bold text-[#123A54] shrink-0 cursor-pointer"
                >
                  Analisis AI
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* -------------------- SCREEN 3: PRODUCT MASTER -------------------- */}
      {activeTab === 'products' && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-[#123A54] dark:text-white">
                Product Master
              </h2>
              <p className="text-xs text-[var(--color-text-secondary)]">
                Kelola SKU induk, status katalog aktif, dan harga dasar distributor
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setActiveTab('categories')}
                className="rounded-xl border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-3.5 py-2 text-xs font-semibold cursor-pointer"
              >
                Kategori Produk
              </button>
              <button
                type="button"
                onClick={() => setAddProdOpen(true)}
                className="inline-flex items-center gap-1.5 rounded-xl bg-[#194F70] hover:bg-[#123A54] px-4 py-2 text-xs font-bold text-white cursor-pointer"
              >
                <Plus className="h-4 w-4" />
                <span>+ Tambah Produk</span>
              </button>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-2.5">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--color-text-muted)]" />
              <input
                type="text"
                value={productSearch}
                onChange={(e) => setProductSearch(e.target.value)}
                placeholder="Cari produk atau SKU..."
                className="w-full rounded-xl border border-[var(--color-border-strong)] bg-[var(--color-surface)] pl-10 pr-4 py-2.5 text-xs sm:text-sm"
              />
            </div>
            <select
              value={productCategoryFilter}
              onChange={(e) => setProductCategoryFilter(e.target.value)}
              className="rounded-xl border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-3.5 py-2.5 text-xs font-semibold"
              aria-label="Filter kategori produk"
            >
              <option value="Semua">Semua Kategori</option>
              {categories.map((c) => (
                <option key={c.id} value={c.name}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-wrap gap-2">
            {(
              [
                { id: 'Semua', label: `Semua (${315 + products.length})` },
                {
                  id: 'Aktif',
                  label: `Aktif (${294 + products.filter((p) => p.status === 'Aktif').length})`,
                },
                {
                  id: 'Nonaktif',
                  label: `Nonaktif (${21 + products.filter((p) => p.status === 'Nonaktif').length})`,
                },
              ] as const
            ).map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setProductFilter(f.id)}
                className={`rounded-xl px-3.5 py-2 text-xs font-semibold cursor-pointer ${
                  productFilter === f.id
                    ? 'bg-[#194F70] text-white'
                    : 'border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-secondary)]'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          <div className="space-y-2.5">
            {filteredProducts.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-[var(--color-border-strong)] bg-[var(--color-surface)] p-6 text-center text-xs text-[var(--color-text-muted)]">
                Tidak ada produk master pada kategori atau filter tersebut.
              </div>
            ) : (
              filteredProducts.map((p) => (
                <div
                  key={p.sku}
                  className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 flex flex-wrap items-center justify-between gap-3 hover:border-[#348CB2] transition-colors"
                >
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedParentSku(p.sku);
                      setActiveTab('variants');
                    }}
                    className="flex flex-1 items-center gap-3.5 min-w-0 text-left cursor-pointer"
                  >
                    <div
                      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-white font-bold text-xs"
                      style={{ backgroundColor: p.accentHex }}
                    >
                      {p.sku.slice(3, 6)}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-bold truncate">{p.name}</p>
                      <p className="text-xs font-mono text-[var(--color-text-muted)]">
                        SKU: {p.sku} · {p.category} · RRP {formatRupiah(p.rrp)}
                      </p>
                    </div>
                  </button>
                  <div className="flex items-center gap-2 shrink-0">
                    <StatusTag label={p.status} />
                    <button
                      type="button"
                      onClick={() => setEditingProductDetail(p)}
                      className="rounded-lg border border-[var(--color-border-strong)] px-2.5 py-1 text-[11px] font-semibold hover:bg-[var(--color-surface-muted)] cursor-pointer"
                    >
                      Ubah
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedParentSku(p.sku);
                        setActiveTab('variants');
                      }}
                      aria-label={`Lihat varian ${p.name}`}
                      className="p-1 text-[var(--color-text-muted)] cursor-pointer"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* -------------------- SCREEN 4: KATEGORI PRODUK -------------------- */}
      {activeTab === 'categories' && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-[#123A54] dark:text-white">
                Kategori Produk
              </h2>
              <p className="text-xs text-[var(--color-text-secondary)]">
                Struktur kategori produk master SalesX-Ai
              </p>
            </div>
            <button
              type="button"
              onClick={() => setAddCatOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-xl bg-[#194F70] hover:bg-[#123A54] px-4 py-2 text-xs font-bold text-white cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              <span>+ Tambah Kategori</span>
            </button>
          </div>

          <div className="space-y-2.5">
            {categories.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => {
                  setProductCategoryFilter(c.name);
                  setActiveTab('products');
                }}
                className="w-full text-left rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 flex items-center justify-between gap-3 hover:border-[#348CB2] cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#E5F4F8] dark:bg-[#19394B] text-[#348CB2]">
                    <Layers className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm font-bold">{c.name}</p>
                    <p className="text-xs text-[var(--color-text-muted)]">
                      ({c.productCount} Produk) · {c.description}
                    </p>
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 text-[var(--color-text-muted)]" />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* -------------------- SCREEN 5: VARIAN / SKU PRODUK -------------------- */}
      {activeTab === 'variants' && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-[#123A54] dark:text-white">
                Varian / SKU Produk
              </h2>
              <p className="text-xs text-[var(--color-text-secondary)]">
                Daftar varian rasa, ukuran kemasan, dan barcode EAN-13 per SKU induk
              </p>
            </div>
            <button
              type="button"
              onClick={() => setAddVariantOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-xl bg-[#194F70] hover:bg-[#123A54] px-4 py-2 text-xs font-bold text-white cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              <span>+ Tambah Varian / SKU</span>
            </button>
          </div>

          {activeParentProduct && (
            <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div
                  className="flex h-12 w-12 items-center justify-center rounded-xl text-white font-bold text-xs"
                  style={{ backgroundColor: activeParentProduct.accentHex }}
                >
                  {activeParentProduct.sku.slice(3, 6)}
                </div>
                <div>
                  <p className="text-base font-bold">{activeParentProduct.name}</p>
                  <p className="text-xs font-mono text-[var(--color-text-muted)]">
                    SKU Induk: {activeParentProduct.sku} · Kategori:{' '}
                    {activeParentProduct.category}
                  </p>
                </div>
              </div>
              <select
                value={selectedParentSku}
                onChange={(e) => setSelectedParentSku(e.target.value)}
                className="rounded-xl border border-[var(--color-border-strong)] bg-[var(--color-background)] px-3 py-2 text-xs font-semibold"
              >
                {products.map((p) => (
                  <option key={p.sku} value={p.sku}>
                    {p.sku} — {p.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="grid grid-cols-2 gap-1 rounded-xl bg-[var(--color-surface-muted)] p-1 max-w-sm text-xs font-semibold">
            <button
              type="button"
              onClick={() => setVariantTab('Varian')}
              className={`rounded-lg py-2 cursor-pointer ${
                variantTab === 'Varian'
                  ? 'bg-[#194F70] text-white'
                  : 'text-[var(--color-text-secondary)]'
              }`}
            >
              Varian ({parentVariants.length})
            </button>
            <button
              type="button"
              onClick={() => setVariantTab('Detail')}
              className={`rounded-lg py-2 cursor-pointer ${
                variantTab === 'Detail'
                  ? 'bg-[#194F70] text-white'
                  : 'text-[var(--color-text-secondary)]'
              }`}
            >
              Detail
            </button>
          </div>

          {variantTab === 'Varian' ? (
            <div className="space-y-2.5">
              {parentVariants.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-[var(--color-border-strong)] bg-[var(--color-surface)] p-6 text-center space-y-2">
                  <p className="text-xs text-[var(--color-text-muted)]">
                    Belum ada sub-varian terdaftar untuk SKU {selectedParentSku}.
                  </p>
                  <button
                    type="button"
                    onClick={() => setAddVariantOpen(true)}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-[#194F70] px-4 py-2 text-xs font-bold text-white cursor-pointer"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>+ Tambah Varian / SKU</span>
                  </button>
                </div>
              ) : (
                parentVariants.map((v) => (
                  <button
                    key={v.id}
                    type="button"
                    onClick={() => setEditingVariant(v)}
                    className="w-full text-left rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 flex items-center justify-between gap-3 hover:border-[#348CB2] transition-colors cursor-pointer"
                  >
                    <div>
                      <p className="text-sm font-bold font-mono">{v.sku}</p>
                      <p className="text-xs font-medium text-[var(--color-text-primary)] mt-0.5">
                        {v.variantLabel}
                      </p>
                      <p className="text-[11px] font-mono text-[var(--color-text-muted)] mt-0.5">
                        Barcode: {v.barcode}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <StatusTag label={v.status} />
                      <ChevronRight className="h-4 w-4 text-[var(--color-text-muted)]" />
                    </div>
                  </button>
                ))
              )}
            </div>
          ) : (
            <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 text-xs sm:text-sm space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="font-bold">Spesifikasi Produk Induk</p>
                {activeParentProduct && (
                  <button
                    type="button"
                    onClick={() => setEditingProductDetail(activeParentProduct)}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-[#348CB2] px-3 py-1.5 text-xs font-bold text-[#194F70] dark:text-[#87CEEB] cursor-pointer"
                  >
                    <Edit3 className="h-3.5 w-3.5" />
                    <span>Ubah Spesifikasi & RRP</span>
                  </button>
                )}
              </div>
              <p className="text-[var(--color-text-secondary)]">
                {activeParentProduct?.description}
              </p>
              <p className="font-mono tabular-nums">
                RRP Nasional: <strong>{formatRupiah(activeParentProduct?.rrp || 6000)}</strong> ·
                Harga Distributor:{' '}
                <strong>{formatRupiah(activeParentProduct?.distributorPrice || 5000)}</strong> ·
                MOQ Distributor: <strong>{activeParentProduct?.moq || 10} dus</strong>
              </p>
            </div>
          )}
        </div>
      )}

      {/* -------------------- SCREEN 7: KETERSEDIAAN PRODUK & PRICE LIST -------------------- */}
      {activeTab === 'pricelist' && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-[#123A54] dark:text-white">
                Ketersediaan Produk & Price List
              </h2>
              <p className="text-xs text-[var(--color-text-secondary)]">
                Pantau level stok dan daftar harga resmi per distributor
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setAddPriceListOpen(true)}
                className="inline-flex items-center gap-1.5 rounded-xl border border-[#348CB2] px-3.5 py-2 text-xs font-bold text-[#194F70] dark:text-[#87CEEB] cursor-pointer"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Tambah Price List</span>
              </button>
              <button
                type="button"
                onClick={() => setPriceListMode('Rekap')}
                className="rounded-xl bg-[#194F70] hover:bg-[#123A54] px-4 py-2 text-xs font-bold text-white cursor-pointer"
              >
                Lihat Semua List
              </button>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="grid grid-cols-2 gap-1 rounded-xl bg-[var(--color-surface-muted)] p-1 w-64 text-xs font-semibold">
              {(['Per Distributor', 'Rekap'] as const).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setPriceListMode(m)}
                  className={`rounded-lg py-2 cursor-pointer ${
                    priceListMode === m
                      ? 'bg-[#194F70] text-white'
                      : 'text-[var(--color-text-secondary)]'
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>

            <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-2 w-full sm:w-auto sm:flex-initial justify-end">
              <div className="relative w-full sm:w-auto sm:min-w-[200px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[var(--color-text-muted)]" />
                <input
                  type="text"
                  value={priceListSearch}
                  onChange={(e) => setPriceListSearch(e.target.value)}
                  placeholder="Cari SKU atau produk..."
                  className="w-full rounded-xl border border-[var(--color-border-strong)] bg-[var(--color-surface)] pl-8 pr-3 py-2.5 text-xs"
                />
              </div>
              {priceListMode === 'Per Distributor' && (
                <select
                  value={selectedPriceDistId}
                  onChange={(e) => setSelectedPriceDistId(e.target.value)}
                  className="w-full sm:w-auto rounded-xl border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-3.5 py-2.5 text-xs font-semibold"
                >
                  {distributors.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name}
                    </option>
                  ))}
                </select>
              )}
            </div>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)]">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-[var(--color-surface-muted)] text-[var(--color-text-secondary)] text-xs">
                <tr>
                  <th className="px-4 py-3">Produk</th>
                  {priceListMode === 'Rekap' && <th className="px-4 py-3">Distributor</th>}
                  <th className="px-4 py-3">Stok</th>
                  <th className="px-4 py-3">Harga (Rp)</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-border)]">
                {filteredPriceRows.map((row) => (
                  <tr key={row.id} className="hover:bg-[var(--color-background)]">
                    <td className="px-4 py-3">
                      <p className="font-bold">{row.productName}</p>
                      <p className="text-[11px] font-mono text-[var(--color-text-muted)]">
                        {row.sku}
                      </p>
                    </td>
                    {priceListMode === 'Rekap' && (
                      <td className="px-4 py-3 text-xs font-medium">
                        {row.distributorName}
                      </td>
                    )}
                    <td className="px-4 py-3 font-mono font-bold tabular-nums">
                      {row.stockQty.toLocaleString('id-ID')}
                    </td>
                    <td className="px-4 py-3 font-mono font-bold tabular-nums">
                      {formatRupiah(row.pricePerUnit)}
                    </td>
                    <td className="px-4 py-3">
                      <StatusTag label={row.stockStatus} showIcon />
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        type="button"
                        onClick={() => setEditingPriceRow(row)}
                        className="rounded-lg border border-[var(--color-border-strong)] px-3 py-1.5 text-xs font-semibold hover:bg-[var(--color-surface-muted)] cursor-pointer"
                      >
                        Ubah
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* -------------------- SCREEN 8: PRICING POLICY -------------------- */}
      {activeTab === 'pricing_policy' && (
        <div className="space-y-4">
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-[#123A54] dark:text-white">
              Pricing Policy
            </h2>
            <p className="text-xs text-[var(--color-text-secondary)]">
              Aturan harga RRP, struktur diskon channel, wilayah, dan Minimum Order Quantity (MOQ)
            </p>
          </div>

          <div className="space-y-2.5">
            {policies.map((pol) => (
              <button
                key={pol.id}
                type="button"
                onClick={() => setEditingPolicy(pol)}
                className="w-full text-left rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 flex items-center justify-between gap-3 hover:border-[#348CB2] cursor-pointer"
              >
                <div className="flex items-center gap-3.5">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#E5F4F8] dark:bg-[#19394B] text-[#348CB2]">
                    <SlidersHorizontal className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm font-bold">{pol.title}</p>
                    <p className="text-xs text-[var(--color-text-secondary)]">
                      {pol.subtitle} · <span className="font-medium">{pol.activeSummary}</span>
                    </p>
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 text-[var(--color-text-muted)] shrink-0" />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* -------------------- SCREEN 9: PROMOTION CAMPAIGN -------------------- */}
      {activeTab === 'campaigns' && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-[#123A54] dark:text-white">
                Promotion Campaign
              </h2>
              <p className="text-xs text-[var(--color-text-secondary)]">
                Kelola program promosi terpusat untuk seluruh jaringan distributor
              </p>
            </div>
            <button
              type="button"
              onClick={() => setCreateCampaignOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-xl bg-[#194F70] hover:bg-[#123A54] px-4 py-2 text-xs font-bold text-white cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              <span>+ Buat Campaign</span>
            </button>
          </div>

          <div className="grid grid-cols-3 gap-1 rounded-xl bg-[var(--color-surface-muted)] p-1 max-w-md text-xs font-semibold">
            {(['Program', 'Draft', 'Selesai'] as const).map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setCampaignFilter(tab)}
                className={`rounded-lg py-2 cursor-pointer ${
                  campaignFilter === tab
                    ? 'bg-[#194F70] text-white'
                    : 'text-[var(--color-text-secondary)]'
                }`}
              >
                {tab} (
                {tab === 'Program'
                  ? campaigns.filter((c) => c.status !== 'Draft' && c.status !== 'Selesai')
                      .length
                  : campaigns.filter((c) => c.status === tab).length}
                )
              </button>
            ))}
          </div>

          <div className="space-y-2.5">
            {campaigns
              .filter((c) =>
                campaignFilter === 'Program'
                  ? c.status !== 'Draft' && c.status !== 'Selesai'
                  : c.status === campaignFilter
              )
              .map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => {
                    setSelectedCampaignId(c.id);
                    setActiveTab('campaign_detail');
                  }}
                  className="w-full text-left rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 flex items-center justify-between gap-3 hover:border-[#348CB2] cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#FFFBEB] dark:bg-[#451A03]/40 text-[#F97316]">
                      <Megaphone className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-sm font-bold">{c.title}</p>
                      <p className="text-xs text-[var(--color-text-muted)]">
                        {c.period} · {c.distributorScope}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <StatusTag label={c.status} />
                    <ChevronRight className="h-4 w-4 text-[var(--color-text-muted)]" />
                  </div>
                </button>
              ))}
          </div>
        </div>
      )}

      {/* -------------------- SCREEN 10: DETAIL CAMPAIGN MANAGEMENT -------------------- */}
      {activeTab === 'campaign_detail' && activeCampaign && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => setActiveTab('campaigns')}
              className="text-xs font-bold text-[#348CB2] hover:underline cursor-pointer"
            >
              ← Kembali ke Daftar Campaign
            </button>
            <StatusTag label={activeCampaign.status} showIcon />
          </div>

          <div className="rounded-2xl bg-gradient-to-r from-[#123A54] via-[#194F70] to-[#348CB2] p-6 text-white">
            <p className="text-xs font-semibold text-[#ADD8E6]">
              {activeCampaign.discountLabel}
            </p>
            <h2 className="text-xl sm:text-2xl font-bold mt-1">{activeCampaign.title}</h2>
            <p className="text-xs sm:text-sm text-white/90 mt-1">
              Periode: {activeCampaign.period}
            </p>
          </div>

          <div className="grid grid-cols-3 gap-1 rounded-xl bg-[var(--color-surface-muted)] p-1 max-w-md text-xs font-semibold">
            {(['Ringkasan', 'Target', 'Distribusi'] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setCampaignDetailTab(t)}
                className={`rounded-lg py-2 cursor-pointer ${
                  campaignDetailTab === t
                    ? 'bg-[#194F70] text-white'
                    : 'text-[var(--color-text-secondary)]'
                }`}
              >
                {t}
              </button>
            ))}
          </div>

          <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 space-y-4 text-xs sm:text-sm">
            {campaignDetailTab === 'Ringkasan' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <p className="text-[11px] text-[var(--color-text-muted)]">Periode</p>
                  <p className="font-bold mt-0.5">{activeCampaign.period}</p>
                </div>
                <div>
                  <p className="text-[11px] text-[var(--color-text-muted)]">
                    Target Penjualan
                  </p>
                  <p className="font-bold font-mono tabular-nums mt-0.5">
                    {formatRupiah(activeCampaign.targetSales)}
                  </p>
                </div>
                <div>
                  <p className="text-[11px] text-[var(--color-text-muted)]">Produk</p>
                  <p className="font-bold mt-0.5">
                    {activeCampaign.productLine} ({activeCampaign.skuCount} SKU)
                  </p>
                </div>
                <div>
                  <p className="text-[11px] text-[var(--color-text-muted)]">Cakupan</p>
                  <p className="font-bold mt-0.5">{activeCampaign.distributorScope}</p>
                </div>
              </div>
            )}

            {campaignDetailTab === 'Target' && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between font-mono tabular-nums">
                    <span>Realisasi Saat Ini: {formatRupiah(activeCampaign.realizedSales)}</span>
                    <span>
                      {Math.round(
                        (activeCampaign.realizedSales / activeCampaign.targetSales) * 100
                      )}
                      %
                    </span>
                  </div>
                  <div className="h-3 rounded-full bg-[var(--color-surface-muted)] overflow-hidden">
                    <div
                      className="h-full bg-[#10B981]"
                      style={{
                        width: `${Math.min(
                          100,
                          Math.round(
                            (activeCampaign.realizedSales / activeCampaign.targetSales) * 100
                          )
                        )}%`,
                      }}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-2">
                  {distributors.slice(0, 3).map((d, idx) => {
                    const sharePct = [42, 33, 25][idx] || 20;
                    const distReal = Math.round((activeCampaign.realizedSales * sharePct) / 100);
                    return (
                      <div
                        key={d.id}
                        className="rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] p-3"
                      >
                        <p className="text-xs font-bold">{d.name}</p>
                        <p className="text-[11px] text-[var(--color-text-muted)]">{d.region}</p>
                        <p className="text-xs font-bold font-mono tabular-nums mt-1 text-[#194F70] dark:text-[#87CEEB]">
                          {formatRupiah(distReal)} ({sharePct}%)
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {campaignDetailTab === 'Distribusi' && (
              <div className="space-y-3">
                <p className="text-[var(--color-text-secondary)]">
                  Campaign aktif pada {activeCampaign.distributorCount} distributor resmi.{' '}
                  {activeCampaign.notes}
                </p>
                <div className="space-y-2">
                  {distributors.map((d, idx) => (
                    <div
                      key={d.id}
                      className="flex items-center justify-between rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] px-3.5 py-2.5"
                    >
                      <div>
                        <p className="text-xs font-bold">{d.name}</p>
                        <p className="text-[11px] text-[var(--color-text-muted)]">
                          {d.region} · {d.warehouseLocation}
                        </p>
                      </div>
                      <StatusTag
                        label={d.status === 'Aktif' && idx < 3 ? 'Tersinkron' : 'Menunggu'}
                        tone={d.status === 'Aktif' && idx < 3 ? 'success' : 'warning'}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex flex-wrap justify-end gap-2 pt-3 border-t border-[var(--color-border)]">
              <button
                type="button"
                onClick={() => setEditingCampaign(activeCampaign)}
                className="inline-flex items-center gap-1.5 rounded-xl border border-[#348CB2] px-4 py-2 text-xs font-bold text-[#194F70] dark:text-[#87CEEB] cursor-pointer"
              >
                <Edit3 className="h-3.5 w-3.5" />
                <span>Edit</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setCampaigns((prev) =>
                    prev.map((c) =>
                      c.id === activeCampaign.id
                        ? {
                            ...c,
                            status: c.status === 'Aktif' ? 'Selesai' : 'Aktif',
                          }
                        : c
                    )
                  );
                  showToast(`Status campaign "${activeCampaign.title}" diperbarui.`);
                }}
                className="inline-flex items-center gap-1.5 rounded-xl border border-red-200 px-4 py-2 text-xs font-bold text-red-600 cursor-pointer"
              >
                <Power className="h-3.5 w-3.5" />
                <span>
                  {activeCampaign.status === 'Aktif' ? 'Nonaktifkan' : 'Aktifkan Kembali'}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* -------------------- SCREEN 11: JARINGAN DISTRIBUTOR -------------------- */}
      {activeTab === 'distributors' && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-[#123A54] dark:text-white">
                Jaringan Distributor
              </h2>
              <p className="text-xs text-[var(--color-text-secondary)]">
                Kelola kemitraan distributor per region & evaluasi SLA pengiriman
              </p>
            </div>
            <button
              type="button"
              onClick={() => setAddDistributorOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-xl bg-[#194F70] hover:bg-[#123A54] px-4 py-2 text-xs font-bold text-white cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              <span>+ Tambah Distributor</span>
            </button>
          </div>

          <div className="flex flex-col sm:flex-row gap-2.5">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--color-text-muted)]" />
              <input
                type="text"
                value={distSearch}
                onChange={(e) => setDistSearch(e.target.value)}
                placeholder="Cari distributor atau region..."
                className="w-full rounded-xl border border-[var(--color-border-strong)] bg-[var(--color-surface)] pl-10 pr-4 py-2.5 text-xs sm:text-sm"
              />
            </div>
            <select
              value={distRegionFilter}
              onChange={(e) => setDistRegionFilter(e.target.value)}
              className="rounded-xl border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-3.5 py-2.5 text-xs font-semibold"
              aria-label="Filter wilayah distributor"
            >
              <option value="Semua">Semua Region</option>
              <option value="Jawa Barat">Jawa Barat</option>
              <option value="Jawa Tengah">Jawa Tengah</option>
              <option value="Jawa Timur">Jawa Timur</option>
              <option value="Sumatera">Sumatera</option>
            </select>
            <button
              type="button"
              onClick={() => setShowDistributorMap((prev) => !prev)}
              className={`inline-flex items-center justify-center gap-1.5 rounded-xl px-3.5 py-2.5 text-xs font-bold cursor-pointer ${
                showDistributorMap
                  ? 'bg-[#194F70] text-white'
                  : 'border border-[#348CB2] text-[#194F70] dark:text-[#87CEEB] bg-[var(--color-surface)]'
              }`}
            >
              <MapIcon className="h-4 w-4" />
              <span>{showDistributorMap ? 'Sembunyikan Peta' : 'Peta Sebaran'}</span>
            </button>
          </div>

          {showDistributorMap && (
            <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 space-y-2.5">
              <p className="text-xs font-bold text-[#123A54] dark:text-white">
                Peta Sebaran Gudang Mitra Distributor (Google Maps)
              </p>
              <SalesGoogleMap
                currentPos={{
                  lat: distributorMapOutlets[0]?.lat ?? -6.597147,
                  lng: distributorMapOutlets[0]?.lng ?? 106.806039,
                }}
                currentPosLabel={`Hub Nasional · ${principalProfile.companyName}`}
                outlets={distributorMapOutlets}
                selectedOutlet={
                  distributorMapOutlets.find((o) => o.id === selectedDistributorId) ||
                  distributorMapOutlets[0] ||
                  null
                }
                onSelectOutlet={(o) => setSelectedDistributorId(o.id)}
                showRouteToSelected={false}
                heightClass="h-[260px]"
              />
            </div>
          )}

          <div className="flex flex-wrap gap-2">
            {(
              [
                { id: 'Semua', label: `Semua (${20 + distributors.length})` },
                {
                  id: 'Aktif',
                  label: `Aktif (${19 + distributors.filter((d) => d.status === 'Aktif').length})`,
                },
                {
                  id: 'Nonaktif',
                  label: `Nonaktif (${1 + distributors.filter((d) => d.status === 'Nonaktif').length})`,
                },
              ] as const
            ).map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setDistStatusFilter(f.id)}
                className={`rounded-xl px-3.5 py-2 text-xs font-semibold cursor-pointer ${
                  distStatusFilter === f.id
                    ? 'bg-[#194F70] text-white'
                    : 'border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-secondary)]'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          <div className="space-y-2.5">
            {filteredDistributors.map((d) => (
              <button
                key={d.id}
                type="button"
                onClick={() => {
                  setSelectedDistributorId(d.id);
                  setActiveTab('distributor_detail');
                }}
                className="w-full text-left rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 flex items-center justify-between gap-3 hover:border-[#348CB2] cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#E5F4F8] dark:bg-[#19394B] text-[#348CB2]">
                    <Building2 className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm font-bold">{d.name}</p>
                    <p className="text-xs text-[var(--color-text-muted)]">
                      Region: {d.region} · PIC: {d.picName}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <StatusTag label={d.status} />
                  <ChevronRight className="h-4 w-4 text-[var(--color-text-muted)]" />
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* -------------------- SCREEN 12: HUBUNGAN DISTRIBUTOR -------------------- */}
      {activeTab === 'distributor_detail' && activeDistributor && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => setActiveTab('distributors')}
              className="text-xs font-bold text-[#348CB2] hover:underline cursor-pointer"
            >
              ← Kembali ke Jaringan Distributor
            </button>
            <StatusTag label={activeDistributor.status} showIcon />
          </div>

          <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#194F70] text-white font-bold">
                  <Building2 className="h-6 w-6" />
                </div>
                <div>
                  <h2 className="text-lg font-bold">{activeDistributor.name}</h2>
                  <p className="text-xs text-[var(--color-text-secondary)]">
                    Region: {activeDistributor.region}
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setPluginDefaultTab('workspace');
                    setPluginPrefillEmail(activeDistributor.email);
                    setPluginsModalOpen(true);
                  }}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-[#194F70] px-4 py-2 text-xs font-bold text-white cursor-pointer"
                >
                  <Mail className="h-3.5 w-3.5" />
                  <span>Hubungi</span>
                </button>
                <button
                  type="button"
                  onClick={() => setNoteDistributor(activeDistributor)}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-[#348CB2] px-4 py-2 text-xs font-bold text-[#194F70] dark:text-[#87CEEB] cursor-pointer"
                >
                  <FileText className="h-3.5 w-3.5" />
                  <span>Catatan</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-1 rounded-xl bg-[var(--color-surface-muted)] p-1 max-w-md text-xs font-semibold">
              {(['Informasi', 'Kinerja', 'Kontrak'] as const).map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setDistDetailTab(tab)}
                  className={`rounded-lg py-2 cursor-pointer ${
                    distDetailTab === tab
                      ? 'bg-[#194F70] text-white'
                      : 'text-[var(--color-text-secondary)]'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            {distDetailTab === 'Informasi' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs sm:text-sm pt-2">
                <div className="flex items-start gap-2.5">
                  <Building2 className="h-4 w-4 text-[#348CB2] mt-0.5" />
                  <div>
                    <p className="text-[11px] text-[var(--color-text-muted)]">
                      PIC Distributor
                    </p>
                    <p className="font-bold">{activeDistributor.picName}</p>
                  </div>
                </div>
                <div className="flex items-start gap-2.5">
                  <Phone className="h-4 w-4 text-[#348CB2] mt-0.5" />
                  <div>
                    <p className="text-[11px] text-[var(--color-text-muted)]">Kontak</p>
                    <p className="font-bold font-mono">{activeDistributor.phone}</p>
                  </div>
                </div>
                <div className="flex items-start gap-2.5">
                  <Mail className="h-4 w-4 text-[#348CB2] mt-0.5" />
                  <div>
                    <p className="text-[11px] text-[var(--color-text-muted)]">Email</p>
                    <p className="font-bold">{activeDistributor.email}</p>
                  </div>
                </div>
                <div className="flex items-start gap-2.5">
                  <MapPin className="h-4 w-4 text-[#348CB2] mt-0.5" />
                  <div>
                    <p className="text-[11px] text-[var(--color-text-muted)]">
                      Gudang Utama
                    </p>
                    <p className="font-bold">{activeDistributor.warehouseLocation}</p>
                  </div>
                </div>
              </div>
            )}

            {distDetailTab === 'Kinerja' && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <KpiMetricCard
                  label="Sales-through Bulanan"
                  value={formatRupiah(activeDistributor.monthlySalesValue)}
                />
                <KpiMetricCard
                  label="Total Order"
                  value={`${activeDistributor.orderCount} PO`}
                />
                <KpiMetricCard
                  label="Ketepatan Pengiriman (SLA)"
                  value={`${activeDistributor.slaOnTimePct}%`}
                />
              </div>
            )}

            {distDetailTab === 'Kontrak' && (
              <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] p-4 text-xs sm:text-sm space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="font-bold">Perjanjian Kemitraan Resmi</p>
                    <p className="text-[var(--color-text-secondary)] mt-1">
                      Periode: <strong>{activeDistributor.contractPeriod}</strong> · Target SLA{' '}
                      <strong>{activeDistributor.slaOnTimePct}%</strong>
                    </p>
                  </div>
                  <StatusTag
                    label={activeDistributor.status === 'Aktif' ? 'Terikat Kontrak' : 'Review'}
                    tone={activeDistributor.status === 'Aktif' ? 'success' : 'warning'}
                  />
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setDistributors((prev) =>
                        prev.map((d) =>
                          d.id === activeDistributor.id
                            ? {
                                ...d,
                                status: 'Aktif',
                                contractPeriod: 'Jan 2026 – Des 2027 (Diperpanjang)',
                                slaOnTimePct: Math.min(99, Number((d.slaOnTimePct + 1.5).toFixed(1))),
                              }
                            : d
                        )
                      );
                      showToast(`Kontrak & SLA ${activeDistributor.name} diperpanjang.`);
                    }}
                    className="rounded-xl bg-[#194F70] px-3.5 py-2 text-xs font-bold text-white cursor-pointer"
                  >
                    Perbarui Periode Kontrak / SLA
                  </button>
                  <button
                    type="button"
                    onClick={() => setAiCoachOpen(true)}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-[#348CB2] px-3.5 py-2 text-xs font-bold text-[#194F70] dark:text-[#87CEEB] cursor-pointer"
                  >
                    <Sparkles className="h-3.5 w-3.5" />
                    <span>Tanya AI Evaluasi Distributor</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* -------------------- SCREEN 13: ORDER DISTRIBUTOR -------------------- */}
      {activeTab === 'dist_orders' && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-[#123A54] dark:text-white">
                Order Distributor
              </h2>
              <p className="text-xs text-[var(--color-text-secondary)]">
                Visibilitas Purchase Order masuk dari jaringan distributor
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <select
                value={orderPeriodFilter}
                onChange={(e) =>
                  setOrderPeriodFilter(
                    e.target.value as 'Bulan Ini' | 'Kuartal Ini' | 'Semua'
                  )
                }
                className="rounded-xl border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-3 py-2 text-xs font-semibold"
                aria-label="Periode order distributor"
              >
                <option value="Bulan Ini">Periode: Bulan Ini</option>
                <option value="Kuartal Ini">Periode: Kuartal Ini</option>
                <option value="Semua">Periode: Semua</option>
              </select>
              <select
                value={orderDistFilterId}
                onChange={(e) => setOrderDistFilterId(e.target.value)}
                className="rounded-xl border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-3.5 py-2 text-xs font-semibold"
              >
                <option value="ALL">Semua Distributor</option>
                {distributors.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <KpiMetricCard
              label="Total Order"
              value={
                orderPeriodFilter === 'Bulan Ini'
                  ? '624'
                  : orderPeriodFilter === 'Kuartal Ini'
                  ? '1.840'
                  : '2.495'
              }
              trend="+12,4%"
              trendTone="positive"
              icon={<ShoppingCart className="h-5 w-5" />}
            />
            <KpiMetricCard
              label="Nilai Order"
              value={
                orderPeriodFilter === 'Bulan Ini'
                  ? 'Rp 625,8 jt'
                  : orderPeriodFilter === 'Kuartal Ini'
                  ? 'Rp 1.890,4 jt'
                  : 'Rp 2.410,0 jt'
              }
              trend="+18,2%"
              trendTone="positive"
              icon={<TrendingUp className="h-5 w-5" />}
            />
          </div>

          <div className="flex flex-wrap gap-2">
            {(['Semua', 'Diproses', 'Dikirim', 'Selesai'] as const).map((st) => (
              <button
                key={st}
                type="button"
                onClick={() => setOrderStatusFilter(st)}
                className={`rounded-xl px-3.5 py-1.5 text-xs font-semibold cursor-pointer ${
                  orderStatusFilter === st
                    ? 'bg-[#194F70] text-white'
                    : 'border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-secondary)]'
                }`}
              >
                {st}
              </button>
            ))}
          </div>

          <div className="space-y-2.5">
            {filteredDistOrders.map((o) => (
              <button
                key={o.id}
                type="button"
                onClick={() => setDetailOrder(o)}
                className="w-full text-left rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 flex items-center justify-between gap-3 hover:border-[#348CB2] cursor-pointer"
              >
                <div>
                  <p className="text-sm font-bold font-mono">{o.id}</p>
                  <p className="text-xs text-[var(--color-text-secondary)]">
                    {o.distributorName} · {o.dateLabel}
                  </p>
                  <p className="text-xs font-bold font-mono tabular-nums text-[#123A54] dark:text-white mt-0.5">
                    {formatRupiah(o.total)}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <StatusTag label={o.status} showIcon />
                  <ChevronRight className="h-4 w-4 text-[var(--color-text-muted)]" />
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* -------------------- SCREEN 14: SALES-THROUGH & ANALITIK -------------------- */}
      {activeTab === 'analytics' && (
        <div className="space-y-5">
          <div className="grid grid-cols-2 gap-1 rounded-xl bg-[var(--color-surface-muted)] p-1 max-w-sm text-xs font-semibold">
            {(['Sales-through', 'Campaign'] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setAnalyticsSubTab(t)}
                className={`rounded-lg py-2 cursor-pointer ${
                  analyticsSubTab === t
                    ? 'bg-[#194F70] text-white'
                    : 'text-[var(--color-text-secondary)]'
                }`}
              >
                {t}
              </button>
            ))}
          </div>

          {analyticsSubTab === 'Sales-through' ? (
            <>
              <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-medium text-[var(--color-text-secondary)]">
                      Total Sales-through
                    </p>
                    <p className="text-2xl sm:text-3xl font-bold font-mono tabular-nums text-[#123A54] dark:text-white">
                      {formatRupiah(PRINCIPAL_PROFILE.salesThroughFull)}
                    </p>
                  </div>
                  <StatusTag label="+18,2% Pertumbuhan" tone="success" />
                </div>

                <div className="grid grid-cols-6 gap-2.5 items-end h-44 pt-4">
                  {PRINCIPAL_SALES_THROUGH_TREND.map((row) => (
                    <div
                      key={row.month}
                      className="flex flex-col items-center gap-2 h-full justify-end"
                    >
                      <span className="text-[10px] font-mono text-[var(--color-text-muted)] tabular-nums">
                        {row.valueJt}jt
                      </span>
                      <div
                        className="w-full max-w-[44px] rounded-t-lg bg-gradient-to-t from-[#194F70] to-[#348CB2]"
                        style={{
                          height: `${Math.round((row.displayScale / 48) * 100)}%`,
                        }}
                      />
                      <span className="text-xs font-semibold">{row.month}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 space-y-3">
                <h3 className="text-sm font-bold">Top Distributor (Nilai Sales)</h3>
                {distributors.slice(0, 3).map((d, idx) => (
                  <div
                    key={d.id}
                    className="flex items-center justify-between rounded-xl border border-[var(--color-border)] p-3.5"
                  >
                    <div className="flex items-center gap-3">
                      <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#FFFBEB] text-[#B45309] font-bold text-xs">
                        {idx + 1}
                      </span>
                      <div>
                        <p className="text-sm font-bold">{d.name}</p>
                        <p className="text-[11px] text-[var(--color-text-muted)]">
                          {d.region} · SLA {d.slaOnTimePct}%
                        </p>
                      </div>
                    </div>
                    <span className="text-sm font-bold font-mono tabular-nums text-[#123A54] dark:text-white">
                      {formatRupiah(d.monthlySalesValue)}
                    </span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-xs font-semibold text-[var(--color-text-secondary)]">
                  Efektivitas Campaign Nasional & Uplift Penjualan
                </p>
                <button
                  type="button"
                  onClick={() => {
                    const csv = [
                      'Campaign,Status,Target_Rp,Realisasi_Rp,Uplift_Pct',
                      ...campaigns.map((c, idx) => {
                        const an =
                          PRINCIPAL_CAMPAIGN_ANALYTICS.find(
                            (x) =>
                              x.campaignId === c.id.replace(/^p/, '') ||
                              x.name === c.title
                          ) || PRINCIPAL_CAMPAIGN_ANALYTICS[idx];
                        return `"${c.title}","${c.status}",${c.targetSales},${c.realizedSales},${an?.upliftPct ?? 12.5}`;
                      }),
                    ].join('\n');
                    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = 'analitik-campaign-principal.csv';
                    a.click();
                    URL.revokeObjectURL(url);
                    showToast('Laporan analitik campaign berhasil diunduh (CSV).');
                  }}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-[#194F70] px-3.5 py-2 text-xs font-bold text-white cursor-pointer"
                >
                  <Download className="h-3.5 w-3.5" />
                  <span>Unduh Laporan Analitik CSV</span>
                </button>
              </div>
              {campaigns.map((c, idx) => {
                const metric =
                  PRINCIPAL_CAMPAIGN_ANALYTICS.find(
                    (x) =>
                      x.campaignId === c.id.replace(/^p/, '') || x.name === c.title
                  ) || PRINCIPAL_CAMPAIGN_ANALYTICS[idx];
                const pct = Math.min(
                  100,
                  Math.round((c.realizedSales / Math.max(1, c.targetSales)) * 100)
                );
                return (
                  <div
                    key={c.id}
                    className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 space-y-2.5"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <p className="text-sm font-bold">{c.title}</p>
                        <p className="text-[11px] text-[var(--color-text-muted)]">
                          {metric?.participatingDistributors ?? c.distributorCount} Distributor
                          berpartisipasi · Uplift{' '}
                          <span className="font-bold text-[#047857]">
                            +{metric?.upliftPct ?? 14.0}%
                          </span>
                        </p>
                      </div>
                      <StatusTag label={c.status} />
                    </div>
                    <div className="flex justify-between text-xs font-mono tabular-nums text-[var(--color-text-secondary)]">
                      <span>
                        Realisasi: {formatRupiah(c.realizedSales)} /{' '}
                        {formatRupiah(c.targetSales)}
                      </span>
                      <span className="font-bold text-[#123A54] dark:text-white">{pct}%</span>
                    </div>
                    <div className="h-2.5 rounded-full bg-[var(--color-surface-muted)] overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-[#194F70] to-[#348CB2]"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* -------------------- SCREEN 15: AI BUSINESS INSIGHT & ACCESS MANAGEMENT -------------------- */}
      {activeTab === 'ai_settings' && (
        <div className="space-y-4">
          <div className="rounded-2xl border border-[#ADD8E6] bg-gradient-to-br from-[#F3FAFC] via-white to-[#E5F4F8] dark:from-[#172438] dark:via-[#111C2D] dark:to-[#19394B] p-6 text-center space-y-3">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#194F70] text-white">
              <Bot className="h-7 w-7" />
            </div>
            <h2 className="text-xl font-bold text-[#123A54] dark:text-white">
              AI Business Insight
            </h2>
            <p className="text-xs sm:text-sm text-[var(--color-text-secondary)] max-w-lg mx-auto">
              Analisis penjualan nasional, peluang pasar per wilayah, restock distributor, dan rekomendasi strategi produk.
            </p>
            <button
              type="button"
              onClick={() => setAiCoachOpen(true)}
              className="inline-flex items-center gap-2 rounded-xl bg-[#194F70] hover:bg-[#123A54] px-6 py-3 text-sm font-bold text-white cursor-pointer"
            >
              <Sparkles className="h-4 w-4" />
              <span>Mulai Analisis AI</span>
            </button>
          </div>

          <div className="divide-y divide-[var(--color-border)] rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)]">
            {[
              {
                title: 'Account & Access Management',
                subtitle: 'Kelola pengguna, role, dan izin akses Principal',
                icon: ShieldCheck,
                action: () => setAccessModalOpen(true),
              },
              {
                title: 'Laporan & Insight AI',
                subtitle: 'Rekomendasi produk, pertumbuhan, dan ekspor CSV',
                icon: Trophy,
                action: () => setActiveTab('analytics'),
              },
              {
                title: 'Pengaturan Principal',
                subtitle: 'Profil perusahaan, target sales-through nasional, dan approval PO',
                icon: Settings,
                action: () => setPrincipalProfileOpen(true),
              },
              {
                title: 'Koneksi Plugin Ekosistem (Workspace, Maps & Telegram)',
                subtitle: 'Aktivasi Google Workspace, Maps Platform, Gemini AI & Telegram Bot',
                icon: Puzzle,
                action: () => {
                  setPluginDefaultTab('workspace');
                  setPluginsModalOpen(true);
                },
              },
            ].map((row) => {
              const Icon = row.icon;
              return (
                <button
                  key={row.title}
                  type="button"
                  onClick={row.action}
                  className="w-full flex items-center justify-between gap-3 p-4 text-left hover:bg-[var(--color-surface-muted)] cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#E5F4F8] dark:bg-[#19394B] text-[#348CB2]">
                      <Icon className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-sm font-bold">{row.title}</p>
                      <p className="text-xs text-[var(--color-text-muted)]">{row.subtitle}</p>
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-[var(--color-text-muted)]" />
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Modals */}
      <AddProductPrincipalModal
        open={addProdOpen}
        onClose={() => setAddProdOpen(false)}
        onAddProduct={(p) => {
          setProducts((prev) => [p, ...prev]);
          showToast(`Produk master ${p.name} (${p.sku}) ditambahkan.`);
        }}
      />
      <AddCategoryModal
        open={addCatOpen}
        onClose={() => setAddCatOpen(false)}
        onAddCategory={(c) => {
          setCategories((prev) => [...prev, c]);
          showToast(`Kategori ${c.name} diperbarui.`);
        }}
      />
      <AddVariantModal
        open={addVariantOpen}
        onClose={() => setAddVariantOpen(false)}
        parentSku={selectedParentSku}
        onAddVariant={(v) => {
          setVariants((prev) => [...prev, v]);
          showToast(`Varian ${v.sku} ditambahkan.`);
        }}
      />
      <UpdatePriceListModal
        row={editingPriceRow}
        onClose={() => setEditingPriceRow(null)}
        onUpdateRow={(id, price, stockStatus) => {
          setPriceList((prev) =>
            prev.map((r) => (r.id === id ? { ...r, pricePerUnit: price, stockStatus } : r))
          );
          showToast('Harga & status ketersediaan distributor diperbarui.');
        }}
      />
      <PricingPolicyModal
        policy={editingPolicy}
        onClose={() => setEditingPolicy(null)}
        onSavePolicy={(id, summary) => {
          setPolicies((prev) =>
            prev.map((p) => (p.id === id ? { ...p, activeSummary: summary } : p))
          );
          showToast('Kebijakan Pricing Policy berhasil diperbarui.');
        }}
      />
      <CreateCampaignModal
        open={createCampaignOpen}
        onClose={() => setCreateCampaignOpen(false)}
        onCreateCampaign={(c) => {
          setCampaigns((prev) => [c, ...prev]);
          showToast(`Campaign "${c.title}" berhasil diterbitkan.`);
        }}
      />
      <AddDistributorModal
        open={addDistributorOpen}
        onClose={() => setAddDistributorOpen(false)}
        onAddDistributor={(d) => {
          setDistributors((prev) => [d, ...prev]);
          showToast(`Distributor ${d.name} bergabung ke jaringan.`);
        }}
      />
      <DistributorNoteModal
        distributor={noteDistributor}
        onClose={() => setNoteDistributor(null)}
        onAddNote={(id, note) => {
          setDistributors((prev) =>
            prev.map((d) =>
              d.id === id ? { ...d, notes: [`Hari ini: ${note}`, ...d.notes] } : d
            )
          );
          showToast('Catatan hubungan distributor tersimpan.');
        }}
      />
      <PrincipalOrderDetailModal
        order={detailOrder}
        onClose={() => setDetailOrder(null)}
        onUpdateStatus={(orderId, nextStatus) => {
          setDistOrders((prev) =>
            prev.map((o) => (o.id === orderId ? { ...o, status: nextStatus } : o))
          );
          showToast(`Status PO ${orderId} diperbarui menjadi "${nextStatus}".`);
        }}
      />
      <PrincipalProductDetailModal
        product={editingProductDetail}
        onClose={() => setEditingProductDetail(null)}
        onSaveProduct={(sku, patch) => {
          setProducts((prev) =>
            prev.map((p) => (p.sku === sku ? { ...p, ...patch } : p))
          );
          showToast(`Spesifikasi produk ${sku} berhasil diperbarui.`);
        }}
      />
      <EditVariantModal
        variant={editingVariant}
        onClose={() => setEditingVariant(null)}
        onSaveVariant={(id, patch) => {
          setVariants((prev) =>
            prev.map((v) => (v.id === id ? { ...v, ...patch } : v))
          );
          showToast('Detail varian SKU berhasil diperbarui.');
        }}
      />
      <AddPriceListRowModal
        open={addPriceListOpen}
        onClose={() => setAddPriceListOpen(false)}
        distributors={distributors}
        products={products}
        onAddRow={(row) => {
          setPriceList((prev) => [row, ...prev]);
          showToast(`Price list ${row.sku} untuk ${row.distributorName} ditambahkan.`);
        }}
      />
      <EditCampaignModal
        campaign={editingCampaign}
        onClose={() => setEditingCampaign(null)}
        onSaveCampaign={(id, patch) => {
          setCampaigns((prev) =>
            prev.map((c) => (c.id === id ? { ...c, ...patch } : c))
          );
          showToast('Detail campaign berhasil diperbarui.');
        }}
      />
      <PrincipalProfileModal
        open={principalProfileOpen}
        onClose={() => setPrincipalProfileOpen(false)}
        profile={principalProfile}
        onSaveProfile={(next) => {
          setPrincipalProfile(next);
          showToast('Pengaturan perusahaan Principal tersimpan.');
        }}
      />
      <PrincipalAccessModal
        open={accessModalOpen}
        onClose={() => setAccessModalOpen(false)}
      />
      <PrincipalNotificationsModal
        open={notificationsOpen}
        onClose={() => setNotificationsOpen(false)}
        notifications={notifications}
        onMarkAllRead={() =>
          setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
        }
      />
      <PluginActivationModal
        open={pluginsModalOpen}
        onClose={() => setPluginsModalOpen(false)}
        portalName={`Principal Portal (${principalProfile.companyName})`}
        outlets={INITIAL_OUTLETS}
        defaultTab={pluginDefaultTab}
        prefillEmailTo={pluginPrefillEmail}
      />
      <PortalAiCoachModal
        open={aiCoachOpen}
        onClose={() => setAiCoachOpen(false)}
        title="AI Business Insight Principal"
        subtitle="Analisis sales-through nasional, stok distributor, dan rekomendasi campaign"
        contextSummary={`Principal: ${principalProfile.companyName}. Sales-through bulan ini: Rp 4.258,9 jt (+18,2%). Total Order: 8.425 (+15,6%). Distributor aktif: 24. Produk aktif: 320 SKU. Top distributor: PT Maju Distribusi (Rp 1.256,8 jt), PT Sentosa Niaga (Rp 892,4 jt), PT Karya Distribusi (Rp 756 jt). Catatan stok: Sampo Herbal 180 ml habis di PT Maju Distribusi.`}
        quickPrompts={[
          'Distributor mana yang perlu segera didorong kampanye restock?',
          'Rekomendasi strategi campaign Q4 untuk Minuman Energi 250 ml.',
          'Evaluasi kebijakan Pricing Policy & MOQ untuk peningkatan margin.',
        ]}
      />
          {activeTab === 'smartreward' && <SmartRewardWorkspace />}
</PortalShell>
  );
}
