'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import {
  Home,
  Package,
  ShoppingCart,
  Boxes,
  Menu as MenuIcon,
  ArrowLeftRight,
  Truck,
  Store,
  Users,
  MapPin,
  BarChart3,
  Megaphone,
  Settings,
  Search,
  Plus,
  ChevronRight,
  CheckCircle2,
  Clock,
  AlertTriangle,
  XCircle,
  Mail,
  Lock,
  Eye,
  EyeOff,
  Building2,
  ShieldCheck,
  Bell,
  SlidersHorizontal,
  LogOut,
  Download,
  TrendingUp,
  Sun,
  Moon,
  Sparkles,
  Puzzle,
  Award,
} from 'lucide-react';
import { BrandLogo } from '@/components/common/BrandLogo';
import { useTheme } from '@/components/providers/AppProviders';
import { SalesGoogleMap } from '@/components/maps/SalesGoogleMap';
import { PortalShell, type PortalNavGroup } from '@/components/design-system/PortalShell';
import { KpiMetricCard } from '@/components/design-system/KpiMetricCard';
import { StatusTag } from '@/components/design-system/StatusTag';
import { PluginActivationModal } from '@/components/design-system/PluginActivationModal';
import { PortalAiCoachModal } from '@/components/design-system/PortalAiCoachModal';
import { useSalesXAuth } from '@/components/providers/AppProviders';
import { SmartRewardWorkspace } from '@/components/smart-reward/SmartRewardWorkspace';
import { PortalSignupAction } from '@/components/auth/PortalSignupAction';
import {
  formatRupiah,
  INITIAL_NOTIFICATIONS,
  type NotificationItem,
} from '@/lib/salesx-data';
import {
  DISTRIBUTOR_PROFILE,
  DISTRIBUTOR_ORDER_TREND,
  INITIAL_DISTRIBUTOR_INVENTORY,
  INITIAL_STOCK_MOVEMENTS,
  INITIAL_DISTRIBUTOR_ORDERS,
  INITIAL_FULFILLMENTS,
  INITIAL_DISTRIBUTOR_OUTLETS,
  INITIAL_DISTRIBUTOR_SALES_TEAM,
  DISTRIBUTOR_REPORTS_LIST,
  INITIAL_DISTRIBUTOR_PROMOS,
  type DistributorInventoryItem,
  type StockMovementRecord,
  type DistributorOrderProcess,
  type DistributorFulfillmentRecord,
  type DistributorOutletRecord,
  type DistributorSalesRep,
  type DistributorPromoCampaign,
} from '@/lib/salesx-portals-data';
import {
  DaftarDistributorModal,
  StockDetailModal,
  CreateStockMovementModal,
  CreateShipmentModal,
  AddOutletDistributorModal,
  AddSalesTeamModal,
  CreatePromoDistributorModal,
  DistributorReportModal,
  FulfillmentDetailModal,
  DistributorNotificationsModal,
  CoverageManageModal,
  OrderProcessDetailModal,
  StockReplenishOrderModal,
  StockMovementDetailModal,
  BatchProcessMovementsModal,
  DistributorOutletDetailModal,
  DistributorSalesRepModal,
  DistributorPromoDetailModal,
  DistributorCompanyProfileModal,
  DistributorOperationsModal,
  DistributorSecurityModal,
} from './DistributorModals';

export type DistributorTab =
  | 'dashboard'
  | 'catalog'
  | 'orders'
  | 'inventory'
  | 'stock_movement'
  | 'fulfillment'
  | 'delivery_status'
  | 'outlets'
  | 'team'
  | 'coverage'
  | 'reports'
  | 'promotions'
  | 'settings'
  | 'smartreward';

export function DistributorPortalApp() {
  const auth = useSalesXAuth();
  const { theme, toggleTheme } = useTheme();

  // Auth state
  const authenticated = auth.status === 'authenticated';
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [authNotice, setAuthNotice] = useState<string | null>(null);
  const [oauthBusy, setOauthBusy] = useState(false);
  const [daftarModalOpen, setDaftarModalOpen] = useState(false);

  // Navigation
  const [activeTab, setActiveTab] = useState<DistributorTab>('dashboard');
  const [period, setPeriod] = useState<'Bulan Ini' | 'Kuartal Ini' | 'Tahun Ini'>('Bulan Ini');

  // Domain state
  const [inventory, setInventory] = useState<DistributorInventoryItem[]>(
    INITIAL_DISTRIBUTOR_INVENTORY
  );
  const [movements, setMovements] = useState<StockMovementRecord[]>(
    INITIAL_STOCK_MOVEMENTS
  );
  const [orders, setOrders] = useState<DistributorOrderProcess[]>(
    INITIAL_DISTRIBUTOR_ORDERS
  );
  const [fulfillments, setFulfillments] = useState<DistributorFulfillmentRecord[]>(
    INITIAL_FULFILLMENTS
  );
  const [outlets, setOutlets] = useState<DistributorOutletRecord[]>(
    INITIAL_DISTRIBUTOR_OUTLETS
  );
  const [salesTeam, setSalesTeam] = useState<DistributorSalesRep[]>(
    INITIAL_DISTRIBUTOR_SALES_TEAM
  );
  const [promos, setPromos] = useState<DistributorPromoCampaign[]>(
    INITIAL_DISTRIBUTOR_PROMOS
  );
  const [notifications, setNotifications] = useState<NotificationItem[]>(
    INITIAL_NOTIFICATIONS
  );

  // Filters per module
  const [catalogSearch, setCatalogSearch] = useState('');
  const [catalogCategory, setCatalogCategory] = useState<string>('Semua');
  const [catalogTag, setCatalogTag] = useState<string>('Semua');
  const [inventorySubTab, setInventorySubTab] = useState<'current' | 'minimum'>('current');
  const [inventorySearch, setInventorySearch] = useState('');
  const [inventoryWarehouse, setInventoryWarehouse] = useState<string>('Semua');
  const [inventoryStatusFilter, setInventoryStatusFilter] = useState<'Semua' | 'Menipis' | 'Habis'>('Semua');
  const [movementPeriod, setMovementPeriod] = useState<
    '24 Jun 2025 – 24 Jul 2025' | '7 Hari Terakhir' | 'Semua Periode'
  >('24 Jun 2025 – 24 Jul 2025');
  const [movementFilter, setMovementFilter] = useState<
    'Semua' | 'Stok Masuk' | 'Stok Keluar' | 'Penyesuaian Stok'
  >('Semua');
  const [orderQueueFilter, setOrderQueueFilter] = useState<'Semua' | 'Diproses' | 'Siap Kirim' | 'Retur'>('Semua');
  const [fulfillmentSubTab, setFulfillmentSubTab] = useState<'Siap Kirim' | 'Dalam Pengiriman'>(
    'Siap Kirim'
  );
  const [selectedDeliveryId, setSelectedDeliveryId] = useState<string>('FUL-20250723-006');
  const [outletSearch, setOutletSearch] = useState('');
  const [outletFilter, setOutletFilter] = useState<'Semua' | 'Aktif' | 'Prioritas' | 'Nonaktif'>(
    'Semua'
  );
  const [teamSubTab, setTeamSubTab] = useState<'Daftar Tim' | 'Kinerja'>('Daftar Tim');
  const [coverageSubTab, setCoverageSubTab] = useState<'Peta Cakupan' | 'Daftar Wilayah'>(
    'Peta Cakupan'
  );
  const [selectedMapOutletId, setSelectedMapOutletId] = useState<string>('do-1');
  const [reportSubTab, setReportSubTab] = useState<'Penjualan' | 'Distribusi' | 'Stok' | 'Tim'>(
    'Penjualan'
  );
  const [promoSubTab, setPromoSubTab] = useState<'Program' | 'Campaign'>('Program');
  const [selectedOrderId, setSelectedOrderId] = useState<string>('ORD-20250724-001');

  const [distributorProfile, setDistributorProfile] = useState({
    name: DISTRIBUTOR_PROFILE.name,
    cityArea: DISTRIBUTOR_PROFILE.area,
    email: DISTRIBUTOR_PROFILE.email,
    picName: DISTRIBUTOR_PROFILE.picName,
    phone: DISTRIBUTOR_PROFILE.phone,
  });

  // Modals
  const [stockDetailItem, setStockDetailItem] = useState<DistributorInventoryItem | null>(null);
  const [replenishItem, setReplenishItem] = useState<DistributorInventoryItem | null>(null);
  const [createMovementOpen, setCreateMovementOpen] = useState(false);
  const [selectedMovementModal, setSelectedMovementModal] =
    useState<StockMovementRecord | null>(null);
  const [batchProcessModalOpen, setBatchProcessModalOpen] = useState(false);
  const [createShipmentOpen, setCreateShipmentOpen] = useState(false);
  const [addOutletOpen, setAddOutletOpen] = useState(false);
  const [selectedOutletModal, setSelectedOutletModal] =
    useState<DistributorOutletRecord | null>(null);
  const [addTeamOpen, setAddTeamOpen] = useState(false);
  const [selectedRepModal, setSelectedRepModal] = useState<DistributorSalesRep | null>(null);
  const [createPromoOpen, setCreatePromoOpen] = useState(false);
  const [selectedPromoModal, setSelectedPromoModal] =
    useState<DistributorPromoCampaign | null>(null);
  const [companyProfileModalOpen, setCompanyProfileModalOpen] = useState(false);
  const [operationsModalOpen, setOperationsModalOpen] = useState(false);
  const [securityModalOpen, setSecurityModalOpen] = useState(false);
  const [activeReportModal, setActiveReportModal] = useState<{
    title: string;
    subtitle: string;
    metric: string;
  } | null>(null);
  const [detailFulfillment, setDetailFulfillment] =
    useState<DistributorFulfillmentRecord | null>(null);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [coverageManageOpen, setCoverageManageOpen] = useState(false);
  const [orderProcessModal, setOrderProcessModal] =
    useState<DistributorOrderProcess | null>(null);
  const [pluginsModalOpen, setPluginsModalOpen] = useState(false);
  const [pluginDefaultTab, setPluginDefaultTab] = useState<
    'workspace' | 'maps' | 'ai' | 'telegram'
  >('workspace');
  const [aiCoachOpen, setAiCoachOpen] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3200);
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  const navGroups: PortalNavGroup<DistributorTab>[] = [
    {
      group: 'Ringkasan',
      items: [
        { id: 'dashboard', label: 'Beranda', icon: Home },
        { id: 'catalog', label: 'Katalog Produk', icon: Package },
      ],
    },
    {
      group: 'Gudang & Order',
      items: [
        { id: 'inventory', label: 'Inventori Stok', icon: Boxes },
        { id: 'stock_movement', label: 'Pergerakan Stok', icon: ArrowLeftRight },
        { id: 'orders', label: 'Penerimaan Order', icon: ShoppingCart },
        { id: 'fulfillment', label: 'Fulfillment & Kirim', icon: Truck },
        { id: 'delivery_status', label: 'Status Pengiriman', icon: Clock },
      ],
    },
    {
      group: 'Jaringan & Analitik',
      items: [
        { id: 'outlets', label: 'Direktori Outlet', icon: Store },
        { id: 'team', label: 'Tim Sales Distributor', icon: Users },
        { id: 'coverage', label: 'Cakupan Outlet', icon: MapPin },
        { id: 'reports', label: 'Laporan', icon: BarChart3 },
        { id: 'promotions', label: 'Promosi & Campaign', icon: Megaphone },
        ...(auth.canPerformApiAction('smartreward.catalog.read') ? [{ id: 'smartreward' as DistributorTab, label: 'SmartReward & Incentive', icon: Award }] : []),
      ],
    },
    {
      group: 'Sistem',
      items: [{ id: 'settings', label: 'Akun & Pengaturan', icon: Settings }],
    },
  ];

  const bottomNavItems = [
    { id: 'dashboard' as DistributorTab, label: 'Beranda', icon: Home },
    { id: 'catalog' as DistributorTab, label: 'Produk', icon: Package },
    { id: 'orders' as DistributorTab, label: 'Order', icon: ShoppingCart },
    { id: 'inventory' as DistributorTab, label: 'Stok', icon: Boxes },
    { id: 'settings' as DistributorTab, label: 'Lainnya', icon: MenuIcon },
  ];

  const filteredCatalog = useMemo(() => {
    return inventory.filter((item) => {
      const matchSearch =
        item.name.toLowerCase().includes(catalogSearch.toLowerCase()) ||
        item.sku.toLowerCase().includes(catalogSearch.toLowerCase());
      const matchCategory =
        catalogCategory === 'Semua' || item.category === catalogCategory;
      const matchTag = catalogTag === 'Semua' || item.tag === catalogTag;
      return matchSearch && matchCategory && matchTag;
    });
  }, [inventory, catalogSearch, catalogCategory, catalogTag]);

  const filteredInventory = useMemo(() => {
    return inventory.filter((item) => {
      const matchSearch =
        item.name.toLowerCase().includes(inventorySearch.toLowerCase()) ||
        item.sku.toLowerCase().includes(inventorySearch.toLowerCase()) ||
        item.warehouse.toLowerCase().includes(inventorySearch.toLowerCase());
      const matchWarehouse =
        inventoryWarehouse === 'Semua' || item.warehouse === inventoryWarehouse;
      const matchStatus =
        inventoryStatusFilter === 'Semua'
          ? true
          : inventoryStatusFilter === 'Habis'
            ? item.stock === 0
            : item.stock > 0 && item.stock <= item.minStock;
      if (inventorySubTab === 'minimum') {
        return matchSearch && matchWarehouse && matchStatus && item.stock <= item.minStock;
      }
      return matchSearch && matchWarehouse && matchStatus;
    });
  }, [inventory, inventorySearch, inventorySubTab, inventoryWarehouse, inventoryStatusFilter]);

  const filteredMovements = useMemo(() => {
    return movements.filter((m) => {
      const matchType = movementFilter === 'Semua' || m.type === movementFilter;
      const matchPeriod =
        movementPeriod === 'Semua Periode'
          ? true
          : movementPeriod === '7 Hari Terakhir'
            ? m.dateLabel.includes('24 Jul') ||
              m.dateLabel.includes('23 Jul') ||
              m.dateLabel.includes('Baru saja')
            : true;
      return matchType && matchPeriod;
    });
  }, [movements, movementFilter, movementPeriod]);

  const filteredOrders = useMemo(() => {
    if (orderQueueFilter === 'Semua') return orders;
    if (orderQueueFilter === 'Siap Kirim') return orders.filter((o) => o.currentStep >= 4);
    if (orderQueueFilter === 'Retur') {
      return orders.filter((o) => o.steps.some((s) => s.label.includes('Retur')));
    }
    return orders.filter((o) => o.currentStep < 4);
  }, [orders, orderQueueFilter]);

  const activeOrder =
    filteredOrders.find((o) => o.id === selectedOrderId) || filteredOrders[0] || orders[0];

  const activeDelivery =
    fulfillments.find((f) => f.id === selectedDeliveryId) || fulfillments[0];

  const filteredOutlets = useMemo(() => {
    return outlets.filter((o) => {
      const matchQuery =
        o.name.toLowerCase().includes(outletSearch.toLowerCase()) ||
        o.city.toLowerCase().includes(outletSearch.toLowerCase());
      if (outletFilter === 'Aktif') return matchQuery && o.status === 'Aktif';
      if (outletFilter === 'Prioritas') return matchQuery && o.isPriority;
      if (outletFilter === 'Nonaktif') return matchQuery && o.status === 'Nonaktif';
      return matchQuery;
    });
  }, [outlets, outletSearch, outletFilter]);

  const handleAdjustStock = (sku: string, delta: number, notes: string) => {
    setInventory((prev) =>
      prev.map((item) =>
        item.sku === sku
          ? { ...item, stock: Math.max(0, item.stock + delta) }
          : item
      )
    );
    const target = inventory.find((i) => i.sku === sku);
    if (target) {
      setMovements((prev) => [
        {
          id: `${delta >= 0 ? 'PO' : 'ADJ'}-${Date.now().toString().slice(-6)}`,
          type: delta >= 0 ? 'Stok Masuk' : 'Penyesuaian Stok',
          sku,
          productName: target.name,
          qtyDelta: delta,
          unit: target.unit,
          dateLabel: 'Baru saja',
          status: 'Selesai',
          warehouse: target.warehouse,
          notes,
        },
        ...prev,
      ]);
      showToast(`Stok ${target.name} berhasil diperbarui.`);
    }
  };

  const handleAdvanceOrderStep = (orderId: string) => {
    setOrders((prev) =>
      prev.map((order) => {
        if (order.id !== orderId || order.currentStep >= 4) return order;
        const nextStep = (order.currentStep + 1) as 1 | 2 | 3 | 4;
        const pctMap: Record<number, number> = { 1: 25, 2: 60, 3: 85, 4: 100 };
        const updatedSteps = order.steps.map((s) => ({
          ...s,
          status:
            s.step < nextStep
              ? ('done' as const)
              : s.step === nextStep
                ? nextStep === 4
                  ? ('done' as const)
                  : ('active' as const)
                : ('pending' as const),
          detail:
            s.step < nextStep
              ? 'Selesai – terverifikasi'
              : s.step === nextStep
                ? nextStep === 4
                  ? 'Siap diangkut armada'
                  : 'Sedang diproses...'
                : 'Menunggu',
        }));
        return {
          ...order,
          currentStep: nextStep,
          progressPct: pctMap[nextStep],
          steps: updatedSteps,
        };
      })
    );
    showToast(`Progress pemrosesan ${orderId} diperbarui.`);
  };

  const handleAdvanceFulfillment = (id: string) => {
    setFulfillments((prev) =>
      prev.map((f) => {
        if (f.id !== id) return f;
        const nextStatus: DistributorFulfillmentRecord['status'] =
          f.status === 'Siap Kirim'
            ? 'Dalam Pengiriman'
            : f.status === 'Dalam Pengiriman' || f.status === 'Dikirim'
              ? 'Selesai'
              : 'Selesai';
        return {
          ...f,
          status: nextStatus,
          timeline: f.timeline.map((step, i) => {
            if (nextStatus === 'Dalam Pengiriman' && i <= 2) {
              return { ...step, state: i === 2 ? 'active' : 'done' };
            }
            if (nextStatus === 'Selesai') {
              return { ...step, state: 'done' };
            }
            return step;
          }),
        };
      })
    );
    showToast(`Status pengiriman ${id} diperbarui.`);
  };

  const handleGoogleLogin = async () => {
    setOauthBusy(true);
    setAuthNotice(null);
    try { await auth.signInWithOAuth('google'); }
    catch (err) { setAuthNotice(err instanceof Error ? err.message : 'Autentikasi Google Supabase gagal.'); setOauthBusy(false); }
  };

  /* -------------------- SCREEN 1: LOGIN / MASUK -------------------- */
  if (authenticated && !auth.canAccessPortal('distributor')) {
    return <main className="flex min-h-screen items-center justify-center p-6"><section className="max-w-md rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 text-center"><h1 className="text-lg font-bold">Akses portal tidak tersedia</h1><p className="mt-2 text-sm text-[var(--color-text-secondary)]">Role aktif tidak memiliki permission untuk portal ini.</p><button onClick={() => void auth.signOut('local')} className="mt-4 rounded-lg bg-[#236D91] px-4 py-2 text-white">Keluar</button></section></main>;
  }
  if (!authenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#F3FAFC] via-[#E5F4F8] to-white dark:from-[#0B1220] dark:via-[#111C2D] dark:to-[#0B1220] flex flex-col justify-between p-4 sm:p-8">
        <div className="mx-auto w-full max-w-md flex items-center justify-between">
          <Link href="/">
            <BrandLogo subtitle="DISTRIBUTOR PORTAL" compact />
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
            <BrandLogo subtitle="DISTRIBUTOR PORTAL" />
            <h1 className="mt-5 text-2xl font-bold text-[#123A54] dark:text-white">
              Portal Distributor SalesX-Ai
            </h1>
            <p className="mt-1.5 text-xs sm:text-sm text-[var(--color-text-secondary)]">
              Kelola stok, order, distribusi, dan jaringan outlet secara terintegrasi.
            </p>
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!loginEmail.trim() || !loginPassword.trim()) {
                setAuthNotice('Mohon isi Email/No. HP dan Password Anda.');
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
                aria-label="Lihat sandi"
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
                onClick={() => { void auth.requestPasswordReset(loginEmail).then(() => setAuthNotice('Tautan pemulihan dikirim jika email terdaftar.')).catch(err => setAuthNotice(err instanceof Error ? err.message : 'Reset password gagal.')); }}
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
              className="w-full rounded-xl bg-[#194F70] hover:bg-[#123A54] py-3 text-sm font-bold text-white transition-colors cursor-pointer"
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
              className="w-full rounded-xl border border-[#348CB2] bg-[var(--color-surface)] hover:bg-[#F3FAFC] dark:hover:bg-[#172438] py-2.5 text-sm font-bold text-[#194F70] dark:text-[#87CEEB] cursor-pointer"
            >
              Daftar Distributor
            </button>

            <button
              type="button"
              disabled={oauthBusy}
              onClick={handleGoogleLogin}
              className="w-full inline-flex items-center justify-center gap-2 rounded-xl border border-[var(--color-border-strong)] bg-[var(--color-surface)] hover:bg-[var(--color-surface-muted)] py-2.5 text-xs font-semibold cursor-pointer"
            >
              <Mail className="h-4 w-4 text-[#348CB2]" />
              <span>
                {oauthBusy ? 'Menghubungkan...' : 'Masuk dengan Google Workspace'}
              </span>
            </button>
          
            <PortalSignupAction email={loginEmail} password={loginPassword} onMessage={setAuthNotice} />
</form>
        </div>

        <p className="text-center text-xs text-[var(--color-text-muted)]">
          © 2026 SalesX-Ai · Ekosistem Distribusi & Penjualan Terintegrasi
        </p>

        <DaftarDistributorModal
          open={daftarModalOpen}
          onClose={() => setDaftarModalOpen(false)}
        />
      </div>
    );
  }

  return (
    <PortalShell<DistributorTab>
      portalSubtitle="DISTRIBUTOR PORTAL"
      entityName={DISTRIBUTOR_PROFILE.name}
      entityBadge={`${DISTRIBUTOR_PROFILE.area} · ${DISTRIBUTOR_PROFILE.id}`}
      activeTab={activeTab}
      onSelectTab={setActiveTab}
      navGroups={navGroups}
      bottomNavItems={bottomNavItems}
      unreadNotificationsCount={unreadCount}
      onOpenNotifications={() => setNotificationsOpen(true)}
      onOpenPlugins={() => {
        setPluginDefaultTab('workspace');
        setPluginsModalOpen(true);
      }}
      onOpenAiAssistant={() => setAiCoachOpen(true)}
      aiAssistantLabel="Asisten AI Gudang"
      onRequestLogout={() => void auth.signOut('local')}
      currentPortalPath="/distributor"
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

      {/* -------------------- SCREEN 2: DASHBOARD DISTRIBUTOR -------------------- */}
      {activeTab === 'dashboard' && (
        <div className="space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-[#123A54] dark:text-white">
                Halo, {DISTRIBUTOR_PROFILE.name}
              </h2>
              <p className="text-xs sm:text-sm text-[var(--color-text-secondary)]">
                {DISTRIBUTOR_PROFILE.area} · Sinkronisasi stok & order real-time
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

          {/* 4 KPI Cards matching Screen 2 */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
            <KpiMetricCard
              label="Total Order"
              value={period === 'Bulan Ini' ? '1.248' : period === 'Kuartal Ini' ? '3.640' : '14.210'}
              trend="+14,6%"
              trendTone="positive"
              icon={<ShoppingCart className="h-5 w-5" />}
              onClick={() => setActiveTab('orders')}
            />
            <KpiMetricCard
              label="Nilai Order"
              value={period === 'Bulan Ini' ? 'Rp 625,8 jt' : period === 'Kuartal Ini' ? 'Rp 1,82 M' : 'Rp 7,45 M'}
              trend="+18,2%"
              trendTone="positive"
              accentBgClass="bg-[#ECFDF5] dark:bg-[#064E3B]/50 text-[#047857] dark:text-[#34D399]"
              icon={<TrendingUp className="h-5 w-5" />}
              onClick={() => setActiveTab('reports')}
            />
            <KpiMetricCard
              label="Stok Aktif"
              value="12.540 SKU"
              sublabel="42 menipis"
              trendTone="neutral"
              icon={<Boxes className="h-5 w-5" />}
              onClick={() => setActiveTab('inventory')}
            />
            <KpiMetricCard
              label="Outlet Aktif"
              value="1.045"
              sublabel="94,3% tercakup"
              trendTone="positive"
              accentBgClass="bg-[#FFFBEB] dark:bg-[#451A03]/40 text-[#B45309] dark:text-[#FBBF24]"
              icon={<Store className="h-5 w-5" />}
              onClick={() => setActiveTab('outlets')}
            />
          </div>

          {/* Tren Order Chart + Quick Action Tiles */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            <div className="lg:col-span-7 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-[#123A54] dark:text-white">
                    Tren Order (6 Bulan Terakhir)
                  </h3>
                  <p className="text-xs text-[var(--color-text-muted)]">
                    Pertumbuhan volume penerimaan order & nilai fulfillment
                  </p>
                </div>
                <span className="text-xs font-bold text-[#047857] dark:text-[#34D399] font-mono tabular-nums">
                  +18,2% YoY
                </span>
              </div>
              <div className="grid grid-cols-6 gap-2.5 items-end h-44 pt-4">
                {DISTRIBUTOR_ORDER_TREND.map((row) => (
                  <div key={row.month} className="flex flex-col items-center gap-2 h-full justify-end">
                    <span className="text-[10px] font-mono font-semibold text-[var(--color-text-muted)] tabular-nums">
                      {row.valueJt}jt
                    </span>
                    <div
                      className="w-full max-w-[44px] rounded-t-lg bg-gradient-to-t from-[#194F70] via-[#348CB2] to-[#87CEEB]"
                      style={{ height: `${Math.round((row.orders / 40) * 100)}%` }}
                    />
                    <span className="text-xs font-semibold text-[var(--color-text-secondary)]">
                      {row.month}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="lg:col-span-5 space-y-4">
              {/* 4 Quick Actions from Screen 2 */}
              <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5">
                <h3 className="text-sm font-bold text-[#123A54] dark:text-white mb-3">
                  Akses Cepat Operasional
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    {
                      label: 'Penerimaan Order',
                      sub: `${orders.length} antrean aktif`,
                      tab: 'orders' as DistributorTab,
                      icon: ShoppingCart,
                    },
                    {
                      label: 'Proses Order',
                      sub: 'Picking & QC',
                      tab: 'orders' as DistributorTab,
                      icon: Package,
                    },
                    {
                      label: 'Fulfillment',
                      sub: `${fulfillments.length} pengiriman`,
                      tab: 'fulfillment' as DistributorTab,
                      icon: Truck,
                    },
                    {
                      label: 'Stok & Gudang',
                      sub: '85.320 unit',
                      tab: 'inventory' as DistributorTab,
                      icon: Boxes,
                    },
                  ].map((act) => {
                    const Icon = act.icon;
                    return (
                      <button
                        key={act.label}
                        type="button"
                        onClick={() => setActiveTab(act.tab)}
                        className="flex flex-col items-start gap-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] p-3.5 text-left hover:border-[#348CB2] transition-colors cursor-pointer"
                      >
                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#E5F4F8] dark:bg-[#19394B] text-[#348CB2]">
                          <Icon className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="text-xs font-bold">{act.label}</p>
                          <p className="text-[11px] text-[var(--color-text-muted)]">{act.sub}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Ekosistem Plugin Banner */}
              <div className="rounded-2xl border border-[#ADD8E6] bg-gradient-to-r from-[#194F70] to-[#348CB2] p-4 text-white flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-bold flex items-center gap-1.5">
                    <Puzzle className="h-4 w-4" />
                    <span>Plugin Google Workspace & Maps Aktif</span>
                  </p>
                  <p className="text-[11px] text-white/85 mt-0.5">
                    Kirim surat jalan via Gmail, pantau peta cakupan & Telegram Bot.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setPluginsModalOpen(true)}
                  className="rounded-xl bg-white px-3 py-2 text-xs font-bold text-[#123A54] shrink-0 cursor-pointer"
                >
                  Kelola
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* -------------------- SCREEN 3: KATALOG PRODUK -------------------- */}
      {activeTab === 'catalog' && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-[#123A54] dark:text-white">
                Katalog Produk
              </h2>
              <p className="text-xs text-[var(--color-text-secondary)]">
                Daftar SKU tersedia beserta harga grosir dan jumlah stok gudang
              </p>
            </div>
            <button
              type="button"
              onClick={() => setCreateMovementOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-xl bg-[#194F70] hover:bg-[#123A54] px-4 py-2 text-xs font-bold text-white cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              <span>Tambah Stok Masuk</span>
            </button>
          </div>

          <div className="flex flex-wrap gap-2">
            <div className="relative w-full sm:flex-1 sm:min-w-[220px]">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--color-text-muted)]" />
              <input
                type="text"
                value={catalogSearch}
                onChange={(e) => setCatalogSearch(e.target.value)}
                placeholder="Cari produk, kategori, atau SKU..."
                className="w-full rounded-xl border border-[var(--color-border-strong)] bg-[var(--color-surface)] pl-10 pr-4 py-2.5 text-xs sm:text-sm"
              />
            </div>
            {(['Semua', 'Minuman', 'Makanan', 'Perawatan', 'Lainnya'] as const).map(
              (cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setCatalogCategory(cat)}
                  className={`rounded-xl border px-3.5 py-2 text-xs font-semibold cursor-pointer ${
                    catalogCategory === cat
                      ? 'border-[#194F70] bg-[#194F70] text-white'
                      : 'border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-secondary)]'
                  }`}
                >
                  {cat}
                </button>
              )
            )}
          </div>

          <div className="flex flex-wrap gap-2">
            {(['Semua', 'Best Seller', 'Promo', 'Baru'] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setCatalogTag(t)}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold cursor-pointer ${
                  catalogTag === t
                    ? 'bg-[#348CB2] text-white'
                    : 'bg-[var(--color-surface-muted)] text-[var(--color-text-secondary)]'
                }`}
              >
                {t}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filteredCatalog.map((item) => (
              <div
                key={item.sku}
                className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 flex items-center justify-between gap-3 hover:border-[#348CB2] transition-colors"
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <div
                    className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-white font-bold text-xs"
                    style={{ backgroundColor: item.accentHex }}
                  >
                    {item.sku.slice(3, 6)}
                  </div>
                  <div className="min-w-0">
                    <p className="text-[11px] font-mono text-[var(--color-text-muted)]">
                      {item.sku}
                    </p>
                    <p className="text-sm font-bold truncate">{item.name}</p>
                    <p className="text-xs font-semibold text-[#047857] dark:text-[#34D399] font-mono tabular-nums mt-0.5">
                      Stok: {item.stock.toLocaleString('id-ID')} {item.unit} ·{' '}
                      {formatRupiah(item.price)}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setStockDetailItem(item)}
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#194F70] text-white hover:bg-[#123A54] cursor-pointer"
                  title="Sesuaikan Stok"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* -------------------- SCREEN 4: INVENTORI STOK -------------------- */}
      {activeTab === 'inventory' && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-[#123A54] dark:text-white">
                Inventori Stok
              </h2>
              <p className="text-xs text-[var(--color-text-secondary)]">
                Pemantauan posisi stok real-time dan ambang batas stok minimum
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setActiveTab('stock_movement')}
                className="rounded-xl border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-3.5 py-2 text-xs font-semibold cursor-pointer"
              >
                Lihat Pergerakan Stok
              </button>
              <button
                type="button"
                onClick={() => setCreateMovementOpen(true)}
                className="inline-flex items-center gap-1.5 rounded-xl bg-[#194F70] px-3.5 py-2 text-xs font-bold text-white cursor-pointer"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Mutasi Stok</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-1 rounded-xl bg-[var(--color-surface-muted)] p-1 max-w-sm text-xs font-semibold">
            <button
              type="button"
              onClick={() => setInventorySubTab('current')}
              className={`rounded-lg py-2 cursor-pointer ${
                inventorySubTab === 'current'
                  ? 'bg-[#194F70] text-white'
                  : 'text-[var(--color-text-secondary)]'
              }`}
            >
              Stok Saat Ini
            </button>
            <button
              type="button"
              onClick={() => setInventorySubTab('minimum')}
              className={`rounded-lg py-2 cursor-pointer ${
                inventorySubTab === 'minimum'
                  ? 'bg-[#194F70] text-white'
                  : 'text-[var(--color-text-secondary)]'
              }`}
            >
              Stok Minimum
            </button>
          </div>

          {/* 4 Summary Cards matching Screen 4 (Menipis & Habis filterable) */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
            <button
              type="button"
              onClick={() => setInventoryStatusFilter('Semua')}
              className={`text-left rounded-2xl transition-all cursor-pointer ${
                inventoryStatusFilter === 'Semua' ? 'ring-2 ring-[#348CB2]/40' : ''
              }`}
            >
              <KpiMetricCard
                label="Total SKU"
                value={DISTRIBUTOR_PROFILE.totalSkuSummary.toLocaleString('id-ID')}
                icon={<Boxes className="h-5 w-5" />}
              />
            </button>
            <button
              type="button"
              onClick={() => setInventoryStatusFilter('Semua')}
              className="text-left rounded-2xl cursor-pointer"
            >
              <KpiMetricCard
                label="Total Stok"
                value={DISTRIBUTOR_PROFILE.totalStockUnitsSummary.toLocaleString('id-ID')}
                accentBgClass="bg-[#ECFDF5] dark:bg-[#064E3B]/50 text-[#047857]"
                icon={<CheckCircle2 className="h-5 w-5" />}
              />
            </button>
            <button
              type="button"
              onClick={() =>
                setInventoryStatusFilter((prev) => (prev === 'Menipis' ? 'Semua' : 'Menipis'))
              }
              className={`text-left rounded-2xl transition-all cursor-pointer ${
                inventoryStatusFilter === 'Menipis' ? 'ring-2 ring-[#F59E0B]' : ''
              }`}
            >
              <KpiMetricCard
                label="Menipis"
                value={`${DISTRIBUTOR_PROFILE.lowStockSkuCount} SKU`}
                accentBgClass="bg-[#FFFBEB] dark:bg-[#451A03]/40 text-[#B45309]"
                icon={<AlertTriangle className="h-5 w-5" />}
              />
            </button>
            <button
              type="button"
              onClick={() =>
                setInventoryStatusFilter((prev) => (prev === 'Habis' ? 'Semua' : 'Habis'))
              }
              className={`text-left rounded-2xl transition-all cursor-pointer ${
                inventoryStatusFilter === 'Habis' ? 'ring-2 ring-[#EF4444]' : ''
              }`}
            >
              <KpiMetricCard
                label="Habis"
                value={`${DISTRIBUTOR_PROFILE.outOfStockSkuCount} SKU`}
                accentBgClass="bg-[#FEF2F2] dark:bg-[#450A0A]/40 text-[#B91C1C]"
                icon={<XCircle className="h-5 w-5" />}
              />
            </button>
          </div>

          <div className="flex flex-col sm:flex-row gap-2.5">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--color-text-muted)]" />
              <input
                type="text"
                value={inventorySearch}
                onChange={(e) => setInventorySearch(e.target.value)}
                placeholder="Cari produk atau lokasi gudang..."
                className="w-full rounded-xl border border-[var(--color-border-strong)] bg-[var(--color-surface)] pl-10 pr-4 py-2.5 text-xs sm:text-sm"
              />
            </div>
            <select
              value={inventoryWarehouse}
              onChange={(e) => setInventoryWarehouse(e.target.value)}
              className="rounded-xl border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-3.5 py-2.5 text-xs font-semibold"
            >
              <option value="Semua">Semua Gudang</option>
              <option value="Gudang Utama">Gudang Utama</option>
              <option value="Gudang A">Gudang A</option>
              <option value="Gudang B">Gudang B</option>
            </select>
          </div>

          <div className="space-y-2.5">
            {filteredInventory.length === 0 ? (
              <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 text-center text-xs text-[var(--color-text-secondary)]">
                Tidak ada SKU yang sesuai filter inventori saat ini.
              </div>
            ) : (
              filteredInventory.map((item) => {
                const statusLabel =
                  item.stock === 0
                    ? 'Habis'
                    : item.stock <= item.minStock
                      ? 'Menipis'
                      : 'Aman';
                return (
                  <button
                    key={item.sku}
                    type="button"
                    onClick={() => setStockDetailItem(item)}
                    className="w-full text-left rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 flex items-center justify-between gap-3 hover:border-[#348CB2] transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
                      <div
                        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-white font-bold text-xs"
                        style={{ backgroundColor: item.accentHex }}
                      >
                        {item.sku.slice(-3)}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-bold truncate">{item.name}</p>
                        <p className="text-xs font-mono tabular-nums text-[var(--color-text-secondary)]">
                          Stok:{' '}
                          <strong>
                            {item.stock.toLocaleString('id-ID')} {item.unit}
                          </strong>{' '}
                          · Lokasi: {item.warehouse}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <StatusTag label={statusLabel} showIcon />
                      <ChevronRight className="h-4 w-4 text-[var(--color-text-muted)]" />
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* -------------------- SCREEN 5: PERGERAKAN STOK -------------------- */}
      {activeTab === 'stock_movement' && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-[#123A54] dark:text-white">
                Pergerakan Stok
              </h2>
              <p className="text-xs text-[var(--color-text-secondary)]">
                Riwayat masuk, keluar & penyesuaian stok antar gudang
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setCreateMovementOpen(true)}
                className="inline-flex items-center gap-1.5 rounded-xl border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-3.5 py-2.5 text-xs font-semibold cursor-pointer"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Catat Mutasi</span>
              </button>
              <button
                type="button"
                onClick={() => setBatchProcessModalOpen(true)}
                className="rounded-xl bg-[#194F70] hover:bg-[#123A54] px-4 py-2.5 text-xs font-bold text-white cursor-pointer"
              >
                Terima & Proses ({movements.filter((m) => m.status === 'Baru').length})
              </button>
            </div>
          </div>

          {/* Interactive Date Range Pill matching Screen 5 */}
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-2.5">
            <span className="text-xs font-semibold text-[var(--color-text-secondary)]">
              Rentang Tanggal
            </span>
            <select
              value={movementPeriod}
              onChange={(e) =>
                setMovementPeriod(
                  e.target.value as
                    | '24 Jun 2025 – 24 Jul 2025'
                    | '7 Hari Terakhir'
                    | 'Semua Periode'
                )
              }
              className="rounded-xl border border-[var(--color-border-strong)] bg-[var(--color-background)] px-3 py-1.5 text-xs font-bold font-mono"
            >
              <option value="24 Jun 2025 – 24 Jul 2025">24 Jun 2025 – 24 Jul 2025</option>
              <option value="7 Hari Terakhir">7 Hari Terakhir</option>
              <option value="Semua Periode">Semua Periode</option>
            </select>
          </div>

          <div className="flex flex-wrap gap-2">
            {(
              [
                { id: 'Semua', label: 'Semua' },
                { id: 'Stok Masuk', label: 'Masuk' },
                { id: 'Stok Keluar', label: 'Keluar' },
                { id: 'Penyesuaian Stok', label: 'Adjust' },
              ] as const
            ).map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setMovementFilter(f.id)}
                className={`rounded-xl px-4 py-2 text-xs font-semibold cursor-pointer ${
                  movementFilter === f.id
                    ? 'bg-[#194F70] text-white'
                    : 'border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-secondary)]'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          <div className="space-y-2.5">
            {filteredMovements.map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => setSelectedMovementModal(m)}
                className="w-full text-left rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 flex flex-wrap items-center justify-between gap-3 hover:border-[#348CB2] transition-colors cursor-pointer"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold">{m.type}</span>
                    <span className="text-xs font-mono text-[var(--color-text-muted)]">
                      {m.id}
                    </span>
                  </div>
                  <p className="text-xs font-medium text-[var(--color-text-primary)] mt-0.5">
                    {m.productName} ({m.qtyDelta > 0 ? `+${m.qtyDelta}` : m.qtyDelta}{' '}
                    {m.unit}) · {m.warehouse}
                  </p>
                  <p className="text-[11px] text-[var(--color-text-muted)] mt-0.5">
                    {m.dateLabel} · {m.notes}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <StatusTag label={m.status} />
                  <ChevronRight className="h-4 w-4 text-[var(--color-text-muted)]" />
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* -------------------- SCREEN 6 (5 Order Processing): PENERIMAAN ORDER -------------------- */}
      {activeTab === 'orders' && (
        <div className="space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-[#123A54] dark:text-white">
                Penerimaan Order & Pemrosesan
              </h2>
              <p className="text-xs text-[var(--color-text-secondary)]">
                Alur gudang terstruktur: Picking → Packing → QC → Siap Kirim
              </p>
            </div>
            <button
              type="button"
              onClick={() => setActiveTab('fulfillment')}
              className="rounded-xl border border-[#348CB2] px-3.5 py-2 text-xs font-bold text-[#194F70] dark:text-[#87CEEB] cursor-pointer"
            >
              Buka Fulfillment & Pengiriman
            </button>
          </div>

          <div className="flex flex-wrap gap-2">
            {(['Semua', 'Diproses', 'Siap Kirim', 'Retur'] as const).map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setOrderQueueFilter(tab)}
                className={`rounded-xl px-3.5 py-2 text-xs font-semibold cursor-pointer ${
                  orderQueueFilter === tab
                    ? 'bg-[#194F70] text-white'
                    : 'border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-secondary)]'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            {/* Order Queue List */}
            <div className="lg:col-span-5 space-y-2.5">
              {filteredOrders.length === 0 ? (
                <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 text-center text-xs text-[var(--color-text-secondary)]">
                  Tidak ada order pada filter &ldquo;{orderQueueFilter}&rdquo;.
                </div>
              ) : (
                filteredOrders.map((ord) => (
                  <button
                    key={ord.id}
                    type="button"
                    onClick={() => setSelectedOrderId(ord.id)}
                    className={`w-full text-left rounded-2xl border p-4 transition-colors cursor-pointer ${
                      activeOrder?.id === ord.id
                        ? 'border-[#348CB2] bg-[#F3FAFC] dark:bg-[#172438]'
                        : 'border-[var(--color-border)] bg-[var(--color-surface)]'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-mono font-bold text-[#194F70] dark:text-[#87CEEB]">
                        {ord.id}
                      </span>
                      <span className="text-xs font-bold font-mono tabular-nums">
                        {ord.progressPct}%
                      </span>
                    </div>
                    <p className="text-sm font-bold mt-1">{ord.outletName}</p>
                    <p className="text-xs font-bold font-mono tabular-nums text-[#047857] dark:text-[#34D399] mt-0.5">
                      {formatRupiah(ord.total)}
                    </p>
                    <div className="mt-2 h-2 w-full rounded-full bg-[var(--color-surface-muted)] overflow-hidden">
                      <div
                        className="h-full rounded-full bg-[#10B981]"
                        style={{ width: `${ord.progressPct}%` }}
                      />
                    </div>
                  </button>
                ))
              )}
            </div>

            {/* Active 4-Step Order Processing Card matching Screen 5 (Order Processing) */}
            {activeOrder && (
              <div className="lg:col-span-7 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 space-y-5">
                {/* 4-Step Stepper */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-center text-[11px] font-semibold">
                  {['Picking', 'Packing', 'QC', 'Siap Kirim'].map((label, idx) => {
                    const stepNum = idx + 1;
                    const done = stepNum <= activeOrder.currentStep;
                    return (
                      <div key={label} className="flex flex-col items-center gap-1">
                        <div
                          className={`flex h-8 w-8 items-center justify-center rounded-full font-bold ${
                            done
                              ? 'bg-[#194F70] text-white'
                              : 'bg-[var(--color-surface-muted)] text-[var(--color-text-muted)]'
                          }`}
                        >
                          {stepNum}
                        </div>
                        <span
                          className={
                            done
                              ? 'text-[#123A54] dark:text-white'
                              : 'text-[var(--color-text-muted)]'
                          }
                        >
                          {label}
                        </span>
                      </div>
                    );
                  })}
                </div>

                <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <p className="text-xs font-mono text-[var(--color-text-muted)]">
                        {activeOrder.id} · {activeOrder.warehouse}
                      </p>
                      <p className="text-base font-bold mt-0.5">{activeOrder.outletName}</p>
                      <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">
                        {activeOrder.itemsSummary}
                      </p>
                    </div>
                    <p className="text-lg font-bold font-mono tabular-nums text-[#123A54] dark:text-white">
                      {formatRupiah(activeOrder.total)}
                    </p>
                  </div>

                  <div className="mt-4">
                    <div className="flex items-center justify-between text-xs font-semibold mb-1.5">
                      <span>Progress Pemrosesan</span>
                      <span className="font-mono tabular-nums">{activeOrder.progressPct}%</span>
                    </div>
                    <div className="h-2.5 w-full rounded-full bg-[var(--color-surface-muted)] overflow-hidden">
                      <div
                        className="h-full rounded-full bg-[#10B981] transition-all"
                        style={{ width: `${activeOrder.progressPct}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Vertical Checklist */}
                <div className="space-y-3">
                  {activeOrder.steps.map((s) => (
                    <div
                      key={s.step}
                      className="flex items-center justify-between gap-3 rounded-xl border border-[var(--color-border)] p-3"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`flex h-7 w-7 items-center justify-center rounded-full ${
                            s.status === 'done'
                              ? 'bg-[#10B981] text-white'
                              : s.status === 'active'
                                ? 'bg-[#348CB2] text-white'
                                : 'bg-[var(--color-surface-muted)] text-[var(--color-text-muted)]'
                          }`}
                        >
                          {s.status === 'done' ? (
                            <CheckCircle2 className="h-4 w-4" />
                          ) : (
                            <Clock className="h-3.5 w-3.5" />
                          )}
                        </div>
                        <div>
                          <p className="text-xs font-bold">{s.label}</p>
                          <p className="text-[11px] text-[var(--color-text-muted)]">{s.detail}</p>
                        </div>
                      </div>
                      <StatusTag
                        label={
                          s.status === 'done'
                            ? 'Selesai'
                            : s.status === 'active'
                              ? 'Diproses'
                              : 'Menunggu'
                        }
                      />
                    </div>
                  ))}
                </div>

                <div className="flex flex-wrap gap-2 justify-end">
                  <button
                    type="button"
                    onClick={() => setOrderProcessModal(activeOrder)}
                    className="rounded-xl border border-[var(--color-border-strong)] px-4 py-2.5 text-xs font-semibold cursor-pointer"
                  >
                    Rincian Item
                  </button>
                  <button
                    type="button"
                    disabled={activeOrder.currentStep >= 4}
                    onClick={() => handleAdvanceOrderStep(activeOrder.id)}
                    className="rounded-xl bg-[#194F70] hover:bg-[#123A54] disabled:opacity-50 px-5 py-2.5 text-xs font-bold text-white cursor-pointer"
                  >
                    {activeOrder.currentStep >= 4
                      ? 'Order Siap Kirim'
                      : 'Update Progress'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* -------------------- SCREEN 8: FULFILLMENT & PENGIRIMAN -------------------- */}
      {activeTab === 'fulfillment' && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-[#123A54] dark:text-white">
                Fulfillment & Pengiriman
              </h2>
              <p className="text-xs text-[var(--color-text-secondary)]">
                Jadwal keberangkatan armada dan surat jalan distribusi
              </p>
            </div>
            <button
              type="button"
              onClick={() => setCreateShipmentOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-xl bg-[#194F70] hover:bg-[#123A54] px-4 py-2.5 text-xs font-bold text-white cursor-pointer"
            >
              <Truck className="h-4 w-4" />
              <span>Buat Pengiriman</span>
            </button>
          </div>

          <div className="grid grid-cols-2 gap-1 rounded-xl bg-[var(--color-surface-muted)] p-1 max-w-sm text-xs font-semibold">
            <button
              type="button"
              onClick={() => setFulfillmentSubTab('Siap Kirim')}
              className={`rounded-lg py-2 cursor-pointer ${
                fulfillmentSubTab === 'Siap Kirim'
                  ? 'bg-[#194F70] text-white'
                  : 'text-[var(--color-text-secondary)]'
              }`}
            >
              Siap Kirim ({fulfillments.filter((f) => f.status === 'Siap Kirim').length})
            </button>
            <button
              type="button"
              onClick={() => setFulfillmentSubTab('Dalam Pengiriman')}
              className={`rounded-lg py-2 cursor-pointer ${
                fulfillmentSubTab === 'Dalam Pengiriman'
                  ? 'bg-[#194F70] text-white'
                  : 'text-[var(--color-text-secondary)]'
              }`}
            >
              Dalam Pengiriman (
              {
                fulfillments.filter(
                  (f) => f.status === 'Dalam Pengiriman' || f.status === 'Dikirim'
                ).length
              }
              )
            </button>
          </div>

          <div className="space-y-2.5">
            {fulfillments
              .filter((f) =>
                fulfillmentSubTab === 'Siap Kirim'
                  ? f.status === 'Siap Kirim'
                  : f.status !== 'Siap Kirim'
              )
              .map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setDetailFulfillment(item)}
                  className="w-full text-left rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 flex flex-wrap items-center justify-between gap-3 hover:border-[#348CB2] transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#E5F4F8] dark:bg-[#19394B] text-[#348CB2]">
                      <Truck className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-sm font-bold font-mono">{item.id}</p>
                      <p className="text-xs font-semibold">{item.outletName}</p>
                      <p className="text-[11px] text-[var(--color-text-muted)]">
                        {item.dateLabel} · {item.driverName}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-bold font-mono tabular-nums">
                      {formatRupiah(item.total)}
                    </span>
                    <StatusTag label={item.status} showIcon />
                    <ChevronRight className="h-4 w-4 text-[var(--color-text-muted)]" />
                  </div>
                </button>
              ))}
          </div>
        </div>
      )}

      {/* -------------------- SCREEN 9: STATUS PENGIRIMAN -------------------- */}
      {activeTab === 'delivery_status' && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-[#123A54] dark:text-white">
                Status Pengiriman (Live Delivery Tracking)
              </h2>
              <p className="text-xs text-[var(--color-text-secondary)]">
                Lacak timeline pengiriman dari gudang distributor hingga konfirmasi outlet
              </p>
            </div>
            <select
              value={selectedDeliveryId}
              onChange={(e) => setSelectedDeliveryId(e.target.value)}
              className="rounded-xl border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-3.5 py-2 text-xs font-semibold"
            >
              {fulfillments.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.id} — {f.outletName}
                </option>
              ))}
            </select>
          </div>

          {activeDelivery && (
            <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 space-y-5">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--color-border)] pb-4">
                <div>
                  <p className="text-base font-bold font-mono">{activeDelivery.id}</p>
                  <p className="text-sm font-semibold">{activeDelivery.outletName}</p>
                  <p className="text-base font-bold font-mono tabular-nums text-[#194F70] dark:text-[#87CEEB] mt-1">
                    {formatRupiah(activeDelivery.total)}
                  </p>
                </div>
                <StatusTag label={activeDelivery.status} showIcon />
              </div>

              <div className="space-y-4">
                {activeDelivery.timeline.map((step, idx) => (
                  <div key={step.title} className="flex items-start gap-3.5">
                    <div className="flex flex-col items-center">
                      <div
                        className={`flex h-8 w-8 items-center justify-center rounded-full ${
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
                          <Clock className="h-4 w-4" />
                        )}
                      </div>
                      {idx < activeDelivery.timeline.length - 1 && (
                        <div className="h-7 w-0.5 bg-[var(--color-border)] my-1" />
                      )}
                    </div>
                    <div className="pt-1">
                      <p className="text-sm font-bold">{step.title}</p>
                      <p className="text-xs text-[var(--color-text-muted)] font-mono">
                        {step.timestamp}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {activeDelivery.status !== 'Selesai' && (
                <div className="flex justify-end pt-2 border-t border-[var(--color-border)]">
                  <button
                    type="button"
                    onClick={() => handleAdvanceFulfillment(activeDelivery.id)}
                    className="rounded-xl bg-[#194F70] hover:bg-[#123A54] px-5 py-2.5 text-xs font-bold text-white cursor-pointer"
                  >
                    Konfirmasi Tahap Berikutnya
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* -------------------- SCREEN 10: DIREKTORI OUTLET -------------------- */}
      {activeTab === 'outlets' && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-[#123A54] dark:text-white">
                Direktori Outlet
              </h2>
              <p className="text-xs text-[var(--color-text-secondary)]">
                Mitra outlet terdaftar dalam jaringan distribusi {DISTRIBUTOR_PROFILE.name}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setAddOutletOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-xl bg-[#194F70] hover:bg-[#123A54] px-4 py-2.5 text-xs font-bold text-white cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              <span>+ Tambah Outlet</span>
            </button>
          </div>

          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--color-text-muted)]" />
            <input
              type="text"
              value={outletSearch}
              onChange={(e) => setOutletSearch(e.target.value)}
              placeholder="Cari outlet, kota, atau area..."
              className="w-full rounded-xl border border-[var(--color-border-strong)] bg-[var(--color-surface)] pl-10 pr-4 py-2.5 text-xs sm:text-sm"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            {(['Semua', 'Aktif', 'Prioritas', 'Nonaktif'] as const).map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => setOutletFilter(f)}
                className={`rounded-xl px-3.5 py-2 text-xs font-semibold cursor-pointer ${
                  outletFilter === f
                    ? 'bg-[#194F70] text-white'
                    : 'border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-secondary)]'
                }`}
              >
                {f}
              </button>
            ))}
          </div>

          <div className="space-y-2.5">
            {filteredOutlets.map((o) => (
              <button
                key={o.id}
                type="button"
                onClick={() => setSelectedOutletModal(o)}
                className="w-full text-left rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 flex flex-wrap items-center justify-between gap-3 hover:border-[#348CB2] transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#E5F4F8] dark:bg-[#19394B] text-[#348CB2]">
                    <Store className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-bold truncate">{o.name}</p>
                    <p className="text-xs text-[var(--color-text-secondary)] truncate">
                      {o.city} · PIC {o.picName} ({o.phone})
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {o.isPriority && <StatusTag label="Prioritas" tone="brand" />}
                  <StatusTag label={o.status} />
                  <ChevronRight className="h-4 w-4 text-[var(--color-text-muted)]" />
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* -------------------- SCREEN 11: TIM SALES DISTRIBUTOR -------------------- */}
      {activeTab === 'team' && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-[#123A54] dark:text-white">
                Tim Sales Distributor
              </h2>
              <p className="text-xs text-[var(--color-text-secondary)]">
                Ringkasan Tim: Total <strong>{42 + (salesTeam.length - 4)}</strong> · Aktif{' '}
                <strong className="text-[#047857]">
                  {40 + salesTeam.filter((r) => r.status === 'Aktif').length - 4}
                </strong>{' '}
                · Tidak Aktif{' '}
                <strong>{2 + salesTeam.filter((r) => r.status !== 'Aktif').length}</strong>
              </p>
            </div>
            <button
              type="button"
              onClick={() => setAddTeamOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-xl bg-[#194F70] hover:bg-[#123A54] px-4 py-2.5 text-xs font-bold text-white cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              <span>Tambah Anggota</span>
            </button>
          </div>

          <div className="grid grid-cols-2 gap-1 rounded-xl bg-[var(--color-surface-muted)] p-1 max-w-sm text-xs font-semibold">
            {(['Daftar Tim', 'Kinerja'] as const).map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setTeamSubTab(tab)}
                className={`rounded-lg py-2 cursor-pointer ${
                  teamSubTab === tab
                    ? 'bg-[#194F70] text-white'
                    : 'text-[var(--color-text-secondary)]'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          <div className="space-y-2.5">
            {salesTeam.map((rep) => (
              <button
                key={rep.id}
                type="button"
                onClick={() => setSelectedRepModal(rep)}
                className="w-full text-left rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 flex flex-wrap items-center justify-between gap-3 hover:border-[#348CB2] transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#194F70] text-white text-xs font-bold">
                    {rep.name
                      .split(' ')
                      .map((n) => n[0])
                      .join('')
                      .slice(0, 2)}
                  </div>
                  <div>
                    <p className="text-sm font-bold">{rep.name}</p>
                    <p className="text-xs text-[var(--color-text-secondary)]">
                      {rep.area} · {rep.outletsHandled} outlet binaan
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {teamSubTab === 'Daftar Tim' ? (
                    <StatusTag label={rep.status} showIcon />
                  ) : (
                    <div className="text-right font-mono tabular-nums">
                      <p className="text-xs font-bold text-[#123A54] dark:text-white">
                        {formatRupiah(rep.monthlyOrderTotal)}
                      </p>
                      <p className="text-[11px] text-[var(--color-text-muted)]">
                        Kunjungan: {rep.visitsCompleted}/{rep.targetVisits}
                      </p>
                    </div>
                  )}
                  <ChevronRight className="h-4 w-4 text-[var(--color-text-muted)]" />
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* -------------------- SCREEN 12: CAKUPAN OUTLET (GOOGLE MAPS) -------------------- */}
      {activeTab === 'coverage' && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-[#123A54] dark:text-white">
                Cakupan Outlet
              </h2>
              <p className="text-xs text-[var(--color-text-secondary)]">
                Pemetaan sebaran outlet tercakup & belum tercakup via Google Maps Platform
              </p>
            </div>
            <button
              type="button"
              onClick={() => setCoverageManageOpen(true)}
              className="rounded-xl bg-[#194F70] hover:bg-[#123A54] px-4 py-2.5 text-xs font-bold text-white cursor-pointer"
            >
              Kelola Cakupan Wilayah
            </button>
          </div>

          <div className="grid grid-cols-2 gap-1 rounded-xl bg-[var(--color-surface-muted)] p-1 max-w-sm text-xs font-semibold">
            {(['Peta Cakupan', 'Daftar Wilayah'] as const).map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setCoverageSubTab(tab)}
                className={`rounded-lg py-2 cursor-pointer ${
                  coverageSubTab === tab
                    ? 'bg-[#194F70] text-white'
                    : 'text-[var(--color-text-secondary)]'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          {coverageSubTab === 'Peta Cakupan' ? (
            <SalesGoogleMap
              currentPos={{ lat: -6.595204, lng: 106.797781 }}
              currentPosLabel={`Gudang ${distributorProfile.name}`}
              outlets={outlets}
              selectedOutlet={
                outlets.find((o) => o.id === selectedMapOutletId) || outlets[0]
              }
              onSelectOutlet={(o) => setSelectedMapOutletId(o.id)}
              heightClass="h-[340px]"
            />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                { area: 'Kota Bogor', count: 312, pct: '96,2%', outletId: 'do-1' },
                { area: 'Kab. Bogor (Cibinong)', count: 298, pct: '93,8%', outletId: 'do-3' },
                { area: 'Kota Depok', count: 245, pct: '95,1%', outletId: 'do-2' },
                { area: 'Kota Tangerang & Bekasi', count: 190, pct: '91,4%', outletId: 'do-5' },
              ].map((w) => (
                <button
                  key={w.area}
                  type="button"
                  onClick={() => {
                    setSelectedMapOutletId(w.outletId);
                    setCoverageSubTab('Peta Cakupan');
                    showToast(`Menampilkan peta cakupan wilayah ${w.area}.`);
                  }}
                  className="text-left rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 flex items-center justify-between hover:border-[#348CB2] transition-colors cursor-pointer"
                >
                  <div>
                    <p className="text-sm font-bold">{w.area}</p>
                    <p className="text-xs text-[var(--color-text-muted)]">
                      {w.count} outlet terdaftar
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold font-mono tabular-nums text-[#047857]">
                      {w.pct}
                    </span>
                    <ChevronRight className="h-4 w-4 text-[var(--color-text-muted)]" />
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* Ringkasan Cakupan card matching Screen 12 */}
          <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
            <h3 className="text-sm font-bold mb-3">Ringkasan Cakupan</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div>
                <p className="text-[var(--color-text-muted)]">Total Outlet</p>
                <p className="text-base font-bold font-mono tabular-nums mt-0.5">
                  1.045
                </p>
              </div>
              <div>
                <p className="text-[var(--color-text-muted)]">Tercakup</p>
                <p className="text-base font-bold font-mono tabular-nums text-[#047857] mt-0.5">
                  985 (94,3%)
                </p>
              </div>
              <div>
                <p className="text-[var(--color-text-muted)]">Belum Tercakup</p>
                <p className="text-base font-bold font-mono tabular-nums text-[#B45309] mt-0.5">
                  60 (5,7%)
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* -------------------- SCREEN 13: LAPORAN -------------------- */}
      {activeTab === 'reports' && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-[#123A54] dark:text-white">
                Laporan Distributor
              </h2>
              <p className="text-xs text-[var(--color-text-secondary)]">
                Rekapitulasi penjualan, order, distribusi, stok, outlet, dan kinerja tim sales
              </p>
            </div>
            <button
              type="button"
              onClick={() => setActiveReportModal(DISTRIBUTOR_REPORTS_LIST[0])}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 rounded-xl bg-[#194F70] hover:bg-[#123A54] px-4 py-2.5 text-xs font-bold text-white cursor-pointer"
            >
              <Download className="h-4 w-4" />
              <span>Unduh Laporan</span>
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-1 rounded-xl bg-[var(--color-surface-muted)] p-1 w-full max-w-md text-xs font-semibold">
            {(['Penjualan', 'Distribusi', 'Stok', 'Tim'] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setReportSubTab(t)}
                className={`rounded-lg py-2 cursor-pointer ${
                  reportSubTab === t
                    ? 'bg-[#194F70] text-white'
                    : 'text-[var(--color-text-secondary)]'
                }`}
              >
                {t}
              </button>
            ))}
          </div>

          <div className="space-y-2.5">
            {DISTRIBUTOR_REPORTS_LIST.filter(
              (r) => reportSubTab === 'Penjualan' || r.tab === reportSubTab
            ).map((rep) => (
              <button
                key={rep.id}
                type="button"
                onClick={() => setActiveReportModal(rep)}
                className="w-full text-left rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 flex items-center justify-between gap-3 hover:border-[#348CB2] transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#E5F4F8] dark:bg-[#19394B] text-[#348CB2]">
                    <BarChart3 className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm font-bold">{rep.title}</p>
                    <p className="text-xs text-[var(--color-text-muted)]">{rep.subtitle}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold font-mono text-[#194F70] dark:text-[#87CEEB]">
                    {rep.metric}
                  </span>
                  <ChevronRight className="h-4 w-4 text-[var(--color-text-muted)]" />
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* -------------------- SCREEN 14: PROMOSI & CAMPAIGN -------------------- */}
      {activeTab === 'promotions' && (
        <div className="space-y-4">
          <div className="rounded-2xl bg-gradient-to-r from-[#194F70] via-[#348CB2] to-[#5BAFD0] p-5 text-white flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-xs font-semibold text-[#ADD8E6]">
                Program Promosi Distributor
              </p>
              <h2 className="text-xl sm:text-2xl font-bold mt-1">
                Diskon hingga 25%
              </h2>
              <p className="text-xs sm:text-sm text-white/90 mt-1">
                Untuk produk pilihan SalesX-Ai di seluruh jaringan outlet aktif.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setCreatePromoOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-xl bg-white px-4 py-2.5 text-xs font-bold text-[#123A54] cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              <span>Buat Program Promosi</span>
            </button>
          </div>

          <div className="grid grid-cols-2 gap-1 rounded-xl bg-[var(--color-surface-muted)] p-1 max-w-sm text-xs font-semibold">
            <button
              type="button"
              onClick={() => setPromoSubTab('Program')}
              className={`rounded-lg py-2 cursor-pointer ${
                promoSubTab === 'Program'
                  ? 'bg-[#194F70] text-white'
                  : 'text-[var(--color-text-secondary)]'
              }`}
            >
              Program ({promos.filter((p) => p.kind === 'Program').length})
            </button>
            <button
              type="button"
              onClick={() => setPromoSubTab('Campaign')}
              className={`rounded-lg py-2 cursor-pointer ${
                promoSubTab === 'Campaign'
                  ? 'bg-[#194F70] text-white'
                  : 'text-[var(--color-text-secondary)]'
              }`}
            >
              Campaign ({promos.filter((p) => p.kind === 'Campaign').length})
            </button>
          </div>

          <div className="space-y-2.5">
            {promos
              .filter((p) => p.kind === promoSubTab)
              .map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setSelectedPromoModal(p)}
                  className="w-full text-left rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 flex flex-wrap items-center justify-between gap-3 hover:border-[#348CB2] transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#FFFBEB] dark:bg-[#451A03]/40 text-[#F97316]">
                      <Megaphone className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-sm font-bold">{p.title}</p>
                      <p className="text-xs text-[var(--color-text-secondary)]">
                        Periode: {p.period} · {p.discountRule}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <StatusTag label={p.status} />
                    <ChevronRight className="h-4 w-4 text-[var(--color-text-muted)]" />
                  </div>
                </button>
              ))}
          </div>
        </div>
      )}

      {/* -------------------- SCREEN 15: AKUN & PENGATURAN -------------------- */}
      {activeTab === 'settings' && (
        <div className="space-y-4">
          <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#194F70] text-white font-bold">
                MD
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-bold">
                  {distributorProfile.name}
                </h2>
                <p className="text-xs text-[var(--color-text-secondary)]">
                  Distributor · ID: <span className="font-mono">{DISTRIBUTOR_PROFILE.id}</span>
                </p>
                <div className="mt-1">
                  <StatusTag label="Aktif" showIcon />
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setAiCoachOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-xl border border-[#348CB2] bg-[#F3FAFC] dark:bg-[#19394B] px-3.5 py-2 text-xs font-bold text-[#194F70] dark:text-[#87CEEB] cursor-pointer"
            >
              <Sparkles className="h-4 w-4 text-[#348CB2]" />
              <span>Konsultasi AI Distributor</span>
            </button>
          </div>

          <div className="divide-y divide-[var(--color-border)] rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)]">
            {[
              {
                title: 'Profil Perusahaan',
                subtitle: `Data dan detail distributor · ${distributorProfile.cityArea}`,
                icon: Building2,
                action: () => setCompanyProfileModalOpen(true),
              },
              {
                title: 'Pengaturan Pengguna',
                subtitle: 'Role, akses, dan izin tim gudang & admin',
                icon: Users,
                action: () => setActiveTab('team'),
              },
              {
                title: 'Pengaturan Integrasi (Workspace, Maps, AI & Telegram)',
                subtitle: 'Google Workspace (Gmail/Calendar/Meet), Google Maps, API & Webhook',
                icon: Puzzle,
                action: () => {
                  setPluginDefaultTab('workspace');
                  setPluginsModalOpen(true);
                },
              },
              {
                title: 'Preferensi Notifikasi',
                subtitle: 'Email, push, Telegram Bot, dan in-app alert',
                icon: Bell,
                action: () => {
                  setPluginDefaultTab('telegram');
                  setPluginsModalOpen(true);
                },
              },
              {
                title: 'Pengaturan Operasional',
                subtitle: 'Gudang Utama, Gudang A/B, cut-off & aturan QC',
                icon: SlidersHorizontal,
                action: () => setOperationsModalOpen(true),
              },
              {
                title: 'Keamanan Akun',
                subtitle: 'Password, 2FA, dan sesi perangkat aktif',
                icon: ShieldCheck,
                action: () => setSecurityModalOpen(true),
              },
            ].map((row) => {
              const Icon = row.icon;
              return (
                <button
                  key={row.title}
                  type="button"
                  onClick={row.action}
                  className="w-full flex items-center justify-between gap-3 p-4 text-left hover:bg-[var(--color-surface-muted)] transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#E5F4F8] dark:bg-[#19394B] text-[#348CB2]">
                      <Icon className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-sm font-bold">{row.title}</p>
                      <p className="text-xs text-[var(--color-text-muted)]">
                        {row.subtitle}
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-[var(--color-text-muted)]" />
                </button>
              );
            })}
          </div>

          <button
            type="button"
            onClick={() => void auth.signOut('local')}
            className="w-full inline-flex items-center justify-center gap-2 rounded-2xl border border-red-200 dark:border-red-900/60 bg-[var(--color-surface)] py-3 text-sm font-bold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 cursor-pointer"
          >
            <LogOut className="h-4 w-4" />
            <span>Keluar</span>
          </button>
        </div>
      )}

      {/* Modals */}
      <StockDetailModal
        item={stockDetailItem}
        onClose={() => setStockDetailItem(null)}
        onAdjustStock={handleAdjustStock}
        onRequestRestock={(item) => setReplenishItem(item)}
      />
      <StockReplenishOrderModal
        item={replenishItem}
        onClose={() => setReplenishItem(null)}
        onSubmitReplenish={(sku, qty, warehouse, notes) => {
          const target = inventory.find((i) => i.sku === sku);
          setMovements((prev) => [
            {
              id: `PO-${Date.now().toString().slice(-6)}`,
              type: 'Stok Masuk',
              sku,
              productName: target?.name || sku,
              qtyDelta: qty,
              unit: target?.unit || 'dus',
              dateLabel: 'Baru saja',
              status: 'Baru',
              warehouse,
              notes,
            },
            ...prev,
          ]);
          showToast(`PO Restock ${sku} (+${qty}) dikirim ke Principal (${warehouse}).`);
        }}
      />
      <CreateStockMovementModal
        open={createMovementOpen}
        onClose={() => setCreateMovementOpen(false)}
        inventory={inventory}
        onCreateMovement={(rec) => {
          setMovements((prev) => [
            {
              ...rec,
              id: `MOV-${Date.now().toString().slice(-6)}`,
              dateLabel: 'Baru saja',
            },
            ...prev,
          ]);
          handleAdjustStock(rec.sku, rec.qtyDelta, rec.notes);
        }}
      />
      <StockMovementDetailModal
        movement={selectedMovementModal}
        onClose={() => setSelectedMovementModal(null)}
        onUpdateStatus={(id, nextStatus) => {
          setMovements((prev) =>
            prev.map((m) => (m.id === id ? { ...m, status: nextStatus } : m))
          );
          if (nextStatus === 'Selesai') {
            const target = movements.find((m) => m.id === id);
            if (target) {
              setInventory((inv) =>
                inv.map((i) =>
                  i.sku === target.sku
                    ? { ...i, stock: Math.max(0, i.stock + target.qtyDelta) }
                    : i
                )
              );
            }
          }
          showToast(`Status dokumen mutasi ${id} diperbarui menjadi ${nextStatus}.`);
        }}
      />
      <BatchProcessMovementsModal
        open={batchProcessModalOpen}
        onClose={() => setBatchProcessModalOpen(false)}
        pendingMovements={movements.filter((m) => m.status === 'Baru')}
        onConfirmBatch={() => {
          const pending = movements.filter((m) => m.status === 'Baru');
          setMovements((prev) =>
            prev.map((m) => (m.status === 'Baru' ? { ...m, status: 'Selesai' } : m))
          );
          setInventory((inv) =>
            inv.map((item) => {
              const delta = pending
                .filter((m) => m.sku === item.sku)
                .reduce((sum, m) => sum + m.qtyDelta, 0);
              return delta !== 0 ? { ...item, stock: Math.max(0, item.stock + delta) } : item;
            })
          );
          showToast(`${pending.length} dokumen mutasi stok berhasil diterima & diproses.`);
        }}
      />
      <CreateShipmentModal
        open={createShipmentOpen}
        onClose={() => setCreateShipmentOpen(false)}
        orders={orders}
        onCreateShipment={(payload) => {
          const order = orders.find((o) => o.id === payload.orderId) || orders[0];
          const newFul: DistributorFulfillmentRecord = {
            id: `FUL-${Date.now().toString().slice(-6)}`,
            orderId: payload.orderId,
            outletName: order?.outletName || 'Toko Makmur Jaya',
            city: order?.city || 'Kota Bogor',
            dateLabel: 'Hari ini',
            total: order?.total || 12_500_000,
            status: 'Siap Kirim',
            driverName: payload.driverName,
            vehiclePlate: payload.vehiclePlate,
            etaLabel: payload.etaLabel,
            timeline: [
              { title: 'Order Diproses', timestamp: 'Hari ini', state: 'done' },
              {
                title: 'Disiapkan (Fulfillment)',
                timestamp: 'Baru saja',
                state: 'done',
              },
              {
                title: 'Dalam Pengiriman',
                timestamp: 'Menunggu keberangkatan',
                state: 'pending',
              },
              { title: 'Sampai di Outlet', timestamp: payload.etaLabel, state: 'pending' },
              { title: 'Selesai', timestamp: 'Menunggu konfirmasi outlet', state: 'pending' },
            ],
          };
          setFulfillments((prev) => [newFul, ...prev]);
          showToast(`Surat jalan ${newFul.id} berhasil diterbitkan.`);
        }}
      />
      <AddOutletDistributorModal
        open={addOutletOpen}
        onClose={() => setAddOutletOpen(false)}
        onAddOutlet={(o) => {
          setOutlets((prev) => [o, ...prev]);
          showToast(`Outlet ${o.name} ditambahkan ke direktori.`);
        }}
      />
      <DistributorOutletDetailModal
        outlet={selectedOutletModal}
        onClose={() => setSelectedOutletModal(null)}
        onTogglePriority={(id) => {
          setOutlets((prev) =>
            prev.map((o) => (o.id === id ? { ...o, isPriority: !o.isPriority } : o))
          );
          setSelectedOutletModal((cur) =>
            cur && cur.id === id ? { ...cur, isPriority: !cur.isPriority } : cur
          );
          showToast('Status prioritas outlet diperbarui.');
        }}
        onToggleStatus={(id) => {
          setOutlets((prev) =>
            prev.map((o) =>
              o.id === id
                ? { ...o, status: o.status === 'Aktif' ? 'Nonaktif' : 'Aktif' }
                : o
            )
          );
          setSelectedOutletModal((cur) =>
            cur && cur.id === id
              ? { ...cur, status: cur.status === 'Aktif' ? 'Nonaktif' : 'Aktif' }
              : cur
          );
          showToast('Status keaktifan outlet diperbarui.');
        }}
        onOpenCoverageMap={(outletId) => {
          setSelectedMapOutletId(outletId);
          setCoverageSubTab('Peta Cakupan');
          setActiveTab('coverage');
        }}
        onOpenWorkspace={(o) => {
          setPluginDefaultTab('workspace');
          setPluginsModalOpen(true);
          showToast(`Menghubungkan Google Workspace untuk koordinasi ${o.name}.`);
        }}
      />
      <AddSalesTeamModal
        open={addTeamOpen}
        onClose={() => setAddTeamOpen(false)}
        onAddRep={(rep) => {
          setSalesTeam((prev) => [rep, ...prev]);
          showToast(`Sales ${rep.name} (${rep.area}) ditambahkan.`);
        }}
      />
      <DistributorSalesRepModal
        rep={selectedRepModal}
        onClose={() => setSelectedRepModal(null)}
        onUpdateRep={(id, updates) => {
          setSalesTeam((prev) =>
            prev.map((r) => (r.id === id ? { ...r, ...updates } : r))
          );
          showToast('Data anggota tim sales distributor diperbarui.');
        }}
      />
      <CreatePromoDistributorModal
        open={createPromoOpen}
        onClose={() => setCreatePromoOpen(false)}
        onAddPromo={(p) => {
          setPromos((prev) => [p, ...prev]);
          showToast(`Program promosi "${p.title}" telah diaktifkan.`);
        }}
      />
      <DistributorPromoDetailModal
        promo={selectedPromoModal}
        onClose={() => setSelectedPromoModal(null)}
        onUpdateStatus={(id, status) => {
          setPromos((prev) =>
            prev.map((p) => (p.id === id ? { ...p, status } : p))
          );
          showToast(`Status promo diperbarui menjadi ${status}.`);
        }}
        onAskAi={() => setAiCoachOpen(true)}
      />
      <DistributorCompanyProfileModal
        open={companyProfileModalOpen}
        onClose={() => setCompanyProfileModalOpen(false)}
        profile={distributorProfile}
        onSaveProfile={(next) => {
          setDistributorProfile(next);
          showToast(`Profil perusahaan ${next.name} berhasil disimpan.`);
        }}
      />
      <DistributorOperationsModal
        open={operationsModalOpen}
        onClose={() => setOperationsModalOpen(false)}
        onSave={(msg) => showToast(msg)}
      />
      <DistributorSecurityModal
        open={securityModalOpen}
        onClose={() => setSecurityModalOpen(false)}
        onSave={(msg) => showToast(msg)}
      />
      <DistributorReportModal
        report={activeReportModal}
        onClose={() => setActiveReportModal(null)}
      />
      <FulfillmentDetailModal
        fulfillment={detailFulfillment}
        onClose={() => setDetailFulfillment(null)}
        onAdvanceStatus={handleAdvanceFulfillment}
      />
      <DistributorNotificationsModal
        open={notificationsOpen}
        onClose={() => setNotificationsOpen(false)}
        notifications={notifications}
        onMarkAllRead={() =>
          setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
        }
      />
      <CoverageManageModal
        open={coverageManageOpen}
        onClose={() => setCoverageManageOpen(false)}
        outlets={outlets}
        onToggleCovered={(id) =>
          setOutlets((prev) =>
            prev.map((o) => (o.id === id ? { ...o, covered: !o.covered } : o))
          )
        }
      />
      <OrderProcessDetailModal
        order={orderProcessModal}
        onClose={() => setOrderProcessModal(null)}
        onAdvanceStep={handleAdvanceOrderStep}
        onMarkReturn={(orderId, reason) => {
          setOrders((prev) =>
            prev.map((ord) =>
              ord.id === orderId
                ? {
                    ...ord,
                    steps: ord.steps.map((s) =>
                      s.step === 1
                        ? { ...s, label: `Retur: ${reason}`, status: 'pending', detail: reason }
                        : s
                    ),
                  }
                : ord
            )
          );
          showToast(`Order ${orderId} ditandai Retur (${reason}).`);
        }}
      />
      <PluginActivationModal
        open={pluginsModalOpen}
        onClose={() => setPluginsModalOpen(false)}
        portalName={`Distributor Portal (${distributorProfile.name})`}
        outlets={outlets}
        defaultTab={pluginDefaultTab}
        prefillEmailTo={distributorProfile.email}
      />
      <PortalAiCoachModal
        open={aiCoachOpen}
        onClose={() => setAiCoachOpen(false)}
        title="Asisten AI Distributor SalesX-Ai"
        subtitle="Rekomendasi restock gudang, prioritas fulfillment, dan cakupan outlet"
        contextSummary={`Distributor: ${distributorProfile.name} (${DISTRIBUTOR_PROFILE.id}). Total SKU: 12.540, menipis: 42 SKU, habis: 6 SKU (termasuk Sampo Herbal 180 ml). Order bulan ini: 1.248 transaksi senilai Rp 625,8 jt. Cakupan outlet: 985 / 1.045 (94,3%).`}
        quickPrompts={[
          'SKU mana yang harus segera di-restock minggu ini?',
          'Susun prioritas pengiriman fulfillment untuk hari ini.',
          'Strategi menjangkau 60 outlet yang belum tercakup di Bogor & Depok.',
        ]}
      />
          {activeTab === 'smartreward' && <SmartRewardWorkspace />}
</PortalShell>
  );
}
