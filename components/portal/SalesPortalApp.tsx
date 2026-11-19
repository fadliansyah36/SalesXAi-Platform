'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import {
  Home,
  Store,
  ShoppingCart,
  MapPin,
  Menu,
  Bell,
  Bot,
  Wand2,
  Target,
  RefreshCw,
  Settings,
  Calendar,
  Clock,
  CheckCircle2,
  Navigation,
  Search,
  ChevronRight,
  ChevronUp,
  ChevronDown,
  Plus,
  Minus,
  Sun,
  Moon,
  LogOut,
  ArrowLeft,
  Sparkles,
  Megaphone,
  ShieldCheck,
  Mail,
  Loader2,
  Wifi,
  SlidersHorizontal,
  Gift,
  MessageSquare,
  Coffee,
  Cookie,
  Sparkles as CareIcon,
  Package,
  Battery,
  HardDriveDownload,
  Trash2,
  Lock,
  HelpCircle,
  Info,
  Radar,
} from 'lucide-react';
import { BrandLogo } from '@/components/common/BrandLogo';
import { PWAInstallButton } from '@/components/common/PWAInstallButton';
import { Modal } from '@/components/common/Modal';
import { useTheme } from '@/components/providers/AppProviders';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';
import { SalesGoogleMap } from '@/components/maps/SalesGoogleMap';
import { PortalLoginView } from '@/components/portal/PortalLoginView';
import { AIChatAndStudio } from '@/components/portal/AIChatAndStudio';
import { LeadsDiscoveryModule } from '@/components/portal/LeadsDiscoveryModule';
import {
  WorkspaceHubView,
  OutletDetailModal,
  VisitEvidenceModal,
  OrderDetailModal,
  RouteReplayModal,
  NavigationPreviewModal,
  SmartRewardModal,
  ProductDetailModal,
  PromoDetailModal,
  VisitHistoryDetailModal,
  TelegramBotModal,
  PortalAccountModal,
} from '@/components/portal/SalesWorkspaceModals';
import {
  SALES_REP_PROFILE,
  INITIAL_OUTLETS,
  INITIAL_PRODUCTS,
  INITIAL_VISITS,
  INITIAL_ORDERS,
  INITIAL_PROMOTIONS,
  INITIAL_NOTIFICATIONS,
  INITIAL_LEADS,
  INITIAL_REWARD_CATALOG,
  INITIAL_REWARD_LEDGER,
  MONTHLY_REALIZATION_DATA,
  PERFORMANCE_BY_PERIOD,
  formatRupiah,
  type Outlet,
  type Product,
  type VisitItem,
  type OrderRecord,
  type PromotionItem,
  type NotificationItem,
  type LeadRecord,
  type RewardItem,
  type RewardLedgerEntry,
} from '@/lib/salesx-data';

type MainSection =
  | 'beranda'
  | 'outlet'
  | 'leads'
  | 'order'
  | 'aktivitas'
  | 'lainnya';
type OrderSubTab = 'catalog' | 'create' | 'history' | 'promo';
type AktivitasSubTab = 'planner' | 'schedule' | 'history' | 'gps' | 'attendance';
type LainnyaSubTab =
  | 'menu'
  | 'target'
  | 'ai'
  | 'studio'
  | 'workspace'
  | 'notifications'
  | 'sync'
  | 'settings';

export function SalesPortalApp() {
  const { theme, toggleTheme } = useTheme();
  const isOnline = useOnlineStatus();

  // Auth & Shift State
  const [authenticated, setAuthenticated] = useState(false);
  const [shiftActive, setShiftActive] = useState(false);
  const [shiftStartTime, setShiftStartTime] = useState<string>('08:01 WIB');
  const [checkInTime, setCheckInTime] = useState<string | null>('08:01');
  const [checkOutTime, setCheckOutTime] = useState<string | null>(null);
  const [gpsEnabled, setGpsEnabled] = useState(true);
  const [currentPos, setCurrentPos] = useState<{ lat: number; lng: number }>({
    lat: SALES_REP_PROFILE.officeLat,
    lng: SALES_REP_PROFILE.officeLng,
  });
  const [gpsStatusMsg, setGpsStatusMsg] = useState<string | null>(null);

  // Navigation State
  const [section, setSection] = useState<MainSection>('beranda');
  const [orderTab, setOrderTab] = useState<OrderSubTab>('catalog');
  const [aktivitasTab, setAktivitasTab] =
    useState<AktivitasSubTab>('schedule');
  const [lainnyaTab, setLainnyaTab] = useState<LainnyaSubTab>('menu');

  // Domain Data State
  const [outlets, setOutlets] = useState<Outlet[]>(INITIAL_OUTLETS);
  const [products] = useState<Product[]>(INITIAL_PRODUCTS);
  const [visits, setVisits] = useState<VisitItem[]>(INITIAL_VISITS);
  const [orders, setOrders] = useState<OrderRecord[]>(INITIAL_ORDERS);
  const [leads, setLeads] = useState<LeadRecord[]>(INITIAL_LEADS);
  const [notifications, setNotifications] = useState<NotificationItem[]>(
    INITIAL_NOTIFICATIONS
  );
  const [rewardPoints, setRewardPoints] = useState<number>(14_500);
  const [rewardLedger, setRewardLedger] = useState<RewardLedgerEntry[]>(
    INITIAL_REWARD_LEDGER
  );

  // Filters & Search
  const [berandaPeriod, setBerandaPeriod] = useState<'today' | 'yesterday' | 'week'>('today');
  const [outletSearch, setOutletSearch] = useState('');
  const [outletFilter, setOutletFilter] = useState<
    'all' | 'priority' | 'today'
  >('all');
  const [outletCityFilter, setOutletCityFilter] = useState('Semua');
  const [outletCategoryFilter, setOutletCategoryFilter] = useState('Semua');
  const [outletFilterModalOpen, setOutletFilterModalOpen] = useState(false);

  const [productSearch, setProductSearch] = useState('');
  const [productCat, setProductCat] = useState<string>('Semua');
  const [productTag, setProductTag] = useState<string>('Semua');
  const [orderSearch, setOrderSearch] = useState('');
  const [orderStatusFilter, setOrderStatusFilter] = useState<string>('Semua');
  const [orderFilterModalOpen, setOrderFilterModalOpen] = useState(false);
  const [promoTab, setPromoTab] = useState<'Semua' | 'Promo' | 'Campaign'>(
    'Semua'
  );
  const [visitDateTab, setVisitDateTab] = useState<
    'today' | 'tomorrow' | 'thursday'
  >('today');
  const [plannerDate, setPlannerDate] = useState('2025-06-24');
  const [addVisitModalOpen, setAddVisitModalOpen] = useState(false);
  const [historyPeriodFilter, setHistoryPeriodFilter] = useState<'7d' | '30d'>('7d');
  const [attendanceSubTab, setAttendanceSubTab] = useState<'absen' | 'rekap'>(
    'absen'
  );
  const [notifFilter, setNotifFilter] = useState<
    'Semua' | 'Aktivitas' | 'Sistem'
  >('Semua');
  const [targetPeriod, setTargetPeriod] = useState('Jun 2025');

  // Cart & Order Creation State
  const [selectedOrderOutletId, setSelectedOrderOutletId] = useState<string>(
    INITIAL_OUTLETS[1].id
  );
  const [changeOutletModalOpen, setChangeOutletModalOpen] = useState(false);
  const [cart, setCart] = useState<Record<string, number>>({
    'SX-MNM-001': 10,
    'SX-BSK-002': 5,
  });

  // Workspace Prefill from Leads
  const [wsPrefillEmail, setWsPrefillEmail] = useState<string | undefined>(undefined);
  const [wsPrefillOutlet, setWsPrefillOutlet] = useState<Outlet | null>(null);

  // Modals & Interactive States
  const [detailOutlet, setDetailOutlet] = useState<Outlet | null>(null);
  const [evidenceVisit, setEvidenceVisit] = useState<VisitItem | null>(null);
  const [navigationVisit, setNavigationVisit] = useState<VisitItem | null>(null);
  const [historyDetailVisit, setHistoryDetailVisit] = useState<VisitItem | null>(null);
  const [detailOrder, setDetailOrder] = useState<OrderRecord | null>(null);
  const [detailProduct, setDetailProduct] = useState<Product | null>(null);
  const [detailPromo, setDetailPromo] = useState<PromotionItem | null>(null);
  const [smartRewardOpen, setSmartRewardOpen] = useState(false);
  const [routeModalOpen, setRouteModalOpen] = useState(false);
  const [shiftModalOpen, setShiftModalOpen] = useState(false);
  const [logoutModalOpen, setLogoutModalOpen] = useState(false);
  const [telegramModalOpen, setTelegramModalOpen] = useState(false);
  const [telegramLinked, setTelegramLinked] = useState(false);
  const [accountModalMode, setAccountModalMode] = useState<
    'account' | 'security' | 'help' | 'about' | null
  >(null);
  const [mapSelectedOutlet, setMapSelectedOutlet] = useState<Outlet | null>(
    INITIAL_OUTLETS[1]
  );

  // Planner AI Route Optimization
  const [plannerAiNote, setPlannerAiNote] = useState<string | null>(null);
  const [plannerOptimizing, setPlannerOptimizing] = useState(false);
  const [plannerSavedNotice, setPlannerSavedNotice] = useState(false);

  // Sync & Settings State
  const [lastSyncLabel, setLastSyncLabel] = useState('24 Jun 2025, 09:41');
  const [syncChecking, setSyncChecking] = useState(false);
  const [cacheSizeLabel, setCacheSizeLabel] = useState('42,6 MB');
  const [offlineDownloaded, setOfflineDownloaded] = useState(false);
  const [notifToggle, setNotifToggle] = useState(true);
  const [autoSyncToggle, setAutoSyncToggle] = useState(true);
  const [bannerToast, setBannerToast] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setBannerToast(msg);
    setTimeout(() => setBannerToast(null), 3500);
  };

  // Derived KPIs
  const unreadNotifCount = notifications.filter((n) => !n.read).length;
  const completedVisitsCount = visits.filter(
    (v) => v.status === 'Selesai'
  ).length;
  const todayOrderTotal = useMemo(() => {
    const newOrdersSum = orders
      .filter((o) => o.dateLabel.startsWith('Hari ini'))
      .reduce((acc, o) => acc + o.total, 0);
    return 12_500_000 + newOrdersSum;
  }, [orders]);

  const totalRealized = useMemo(() => {
    const newOrdersSum = orders
      .filter((o) => o.dateLabel.startsWith('Hari ini'))
      .reduce((acc, o) => acc + o.total, 0);
    return SALES_REP_PROFILE.monthlyRealized + newOrdersSum;
  }, [orders]);

  const targetPercentage = Math.min(
    100,
    Math.round((totalRealized / SALES_REP_PROFILE.monthlyTarget) * 1000) / 10
  );

  // Cart Calculations (Deterministic)
  const cartItems = useMemo(() => {
    return products
      .filter((p) => (cart[p.sku] || 0) > 0)
      .map((p) => ({
        product: p,
        qty: cart[p.sku] || 0,
        lineTotal: p.price * (cart[p.sku] || 0),
        lineDiscount: p.promoDiscountPct
          ? Math.round(
              p.price * (cart[p.sku] || 0) * (p.promoDiscountPct / 100)
            )
          : 0,
      }));
  }, [products, cart]);

  const cartSubtotal = cartItems.reduce((acc, i) => acc + i.lineTotal, 0);
  const cartDiscount = cartItems.reduce((acc, i) => acc + i.lineDiscount, 0);
  const cartGrandTotal = Math.max(0, cartSubtotal - cartDiscount);
  const cartTotalUnits = cartItems.reduce((acc, i) => acc + i.qty, 0);

  const updateCartQty = (sku: string, delta: number) => {
    setCart((prev) => {
      const nextQty = Math.max(0, (prev[sku] || 0) + delta);
      const copy = { ...prev };
      if (nextQty === 0) delete copy[sku];
      else copy[sku] = nextQty;
      return copy;
    });
  };

  const handleSubmitOrder = () => {
    if (cartItems.length === 0) return;
    const outlet =
      outlets.find((o) => o.id === selectedOrderOutletId) || outlets[0];
    const now = new Date();
    const hh = String(now.getHours()).padStart(2, '0');
    const mm = String(now.getMinutes()).padStart(2, '0');
    const newOrder: OrderRecord = {
      id: `ORD-20250624-${String(orders.length + 1).padStart(3, '0')}`,
      outletId: outlet.id,
      outletName: outlet.name,
      city: outlet.city,
      dateLabel: `Hari ini, ${hh}:${mm}`,
      status: 'Diproses',
      items: cartItems.map((ci) => ({
        sku: ci.product.sku,
        name: ci.product.name,
        unitPrice: ci.product.price,
        qty: ci.qty,
      })),
      subtotal: cartSubtotal,
      discount: cartDiscount,
      total: cartGrandTotal,
    };
    setOrders((prev) => [newOrder, ...prev]);
    setCart({});
    setOrderTab('history');
    showToast(`Order ${newOrder.id} untuk ${outlet.name} berhasil dibuat.`);
  };

  const handleRefreshGps = () => {
    setGpsStatusMsg('Mengambil koordinat GPS terkini...');
    if (typeof navigator !== 'undefined' && 'geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setCurrentPos({
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
          });
          setGpsEnabled(true);
          setGpsStatusMsg('Koordinat GPS diperbarui secara real-time.');
        },
        () => {
          setGpsStatusMsg(
            'Izin lokasi browser tidak aktif. Menampilkan koordinat Kantor Area Bogor.'
          );
        },
        { enableHighAccuracy: true, timeout: 6000 }
      );
    } else {
      setGpsStatusMsg('Geolocation tidak tersedia di perangkat ini.');
    }
  };

  const handleMoveVisit = (idx: number, dir: -1 | 1) => {
    setVisits((prev) => {
      const copy = [...prev];
      const targetIdx = idx + dir;
      if (targetIdx < 0 || targetIdx >= copy.length) return prev;
      const temp = copy[idx];
      copy[idx] = copy[targetIdx];
      copy[targetIdx] = temp;
      return copy;
    });
  };

  const handleOptimizeRouteAI = async () => {
    setPlannerOptimizing(true);
    setPlannerAiNote(null);
    try {
      const listText = visits
        .filter((v) => v.dateKey === 'today')
        .map((v, i) => `${i + 1}. ${v.outletName} (${v.address})`)
        .join('\n');
      const res = await fetch('/api/gemini/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'gemini-3.1-flash-lite',
          message: `Berikan saran urutan kunjungan harian paling efisien (maksimal 3 kalimat singkat) untuk daftar outlet di Bogor/Depok berikut:\n${listText}`,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setPlannerAiNote(data.error || 'Gagal mengoptimasi rute.');
      } else {
        setPlannerAiNote(data.text);
      }
    } catch {
      setPlannerAiNote('Koneksi ke Staff AI terputus.');
    } finally {
      setPlannerOptimizing(false);
    }
  };

  const handleSubmitEvidence = (
    visitId: string,
    notes: string,
    photoCount: number
  ) => {
    setVisits((prev) =>
      prev.map((v) =>
        v.id === visitId
          ? { ...v, status: 'Selesai', notes, photoCount }
          : v
      )
    );
    setEvidenceVisit(null);
    showToast('Bukti kunjungan berhasil disimpan & diverifikasi geofence.');
  };

  const handleCheckSync = () => {
    setSyncChecking(true);
    setTimeout(() => {
      const now = new Date();
      setLastSyncLabel(
        `Hari ini, ${String(now.getHours()).padStart(2, '0')}:${String(
          now.getMinutes()
        ).padStart(2, '0')}`
      );
      setSyncChecking(false);
      showToast('Seluruh data kunjungan, order, dan GPS telah tersinkron.');
    }, 600);
  };

  if (!authenticated) {
    return (
      <PortalLoginView
        onCompleteLogin={({ gpsGranted, shiftStarted, coords }) => {
          setGpsEnabled(gpsGranted);
          setShiftActive(shiftStarted);
          if (coords) setCurrentPos(coords);
          if (shiftStarted) {
            const now = new Date();
            const label = `${String(now.getHours()).padStart(2, '0')}:${String(
              now.getMinutes()
            ).padStart(2, '0')}`;
            setShiftStartTime(`${label} WIB`);
            setCheckInTime(label);
          }
          setAuthenticated(true);
        }}
      />
    );
  }

  const handleConvertLeadToOutlet = (lead: LeadRecord) => {
    setLeads((prev) => prev.map((l) => (l.id === lead.id ? lead : l)));
    const newOutletId = `out-${lead.id}`;
    const existing = outlets.find((o) => o.id === newOutletId);
    if (!existing) {
      const converted: Outlet = {
        id: newOutletId,
        name: lead.businessName,
        city: lead.city,
        address: lead.address,
        distanceKm: 3.4,
        isPriority: true,
        visitToday: true,
        status: 'Aktif',
        category: 'General Trade',
        picName: lead.picName,
        phone: lead.phone,
        email: lead.email,
        lat: lead.lat,
        lng: lead.lng,
        lastOrderTotal: lead.estimatedValue,
        lastVisitDate: 'Hari ini',
      };
      setOutlets((prev) => [converted, ...prev]);
    }
    setSelectedOrderOutletId(newOutletId);
    setSection('order');
    setOrderTab('create');
    showToast(`${lead.businessName} dikonversi menjadi Outlet Binaan & siap dibuatkan Order.`);
  };

  const handleRedeemReward = (item: RewardItem) => {
    if (rewardPoints < item.pointsCost) return;
    setRewardPoints((prev) => prev - item.pointsCost);
    setRewardLedger((prev) => [
      {
        id: `led-${Date.now()}`,
        title: `Penukaran: ${item.title}`,
        dateLabel: 'Hari ini, baru saja',
        pointsDelta: -item.pointsCost,
        type: 'Penukaran',
      },
      ...prev,
    ]);
    showToast(`Berhasil menukarkan ${item.pointsCost.toLocaleString('id-ID')} poin untuk ${item.title}.`);
  };

  // Filtered collections
  const filteredOutlets = outlets.filter((o) => {
    const matchText =
      o.name.toLowerCase().includes(outletSearch.toLowerCase()) ||
      o.city.toLowerCase().includes(outletSearch.toLowerCase());
    if (!matchText) return false;
    if (outletFilter === 'priority' && !o.isPriority) return false;
    if (outletFilter === 'today' && !o.visitToday) return false;
    if (outletCityFilter !== 'Semua' && o.city !== outletCityFilter)
      return false;
    if (outletCategoryFilter !== 'Semua' && o.category !== outletCategoryFilter)
      return false;
    return true;
  });

  const filteredProducts = products.filter((p) => {
    const matchText =
      p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
      p.sku.toLowerCase().includes(productSearch.toLowerCase());
    if (!matchText) return false;
    if (productCat !== 'Semua' && p.category !== productCat) return false;
    if (productTag !== 'Semua' && p.tag !== productTag) return false;
    return true;
  });

  const filteredOrders = orders.filter((o) => {
    const matchText =
      o.id.toLowerCase().includes(orderSearch.toLowerCase()) ||
      o.outletName.toLowerCase().includes(orderSearch.toLowerCase());
    if (!matchText) return false;
    if (orderStatusFilter !== 'Semua' && o.status !== orderStatusFilter)
      return false;
    return true;
  });

  const filteredPromos = INITIAL_PROMOTIONS.filter(
    (p) => promoTab === 'Semua' || p.type === promoTab
  );

  const filteredNotifs = notifications.filter(
    (n) => notifFilter === 'Semua' || n.category === notifFilter
  );

  const sidebarNavItems: Array<{
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    isActive: boolean;
    onClick: () => void;
    badge?: number;
  }> = [
    {
      label: 'Beranda',
      icon: Home,
      isActive: section === 'beranda',
      onClick: () => setSection('beranda'),
    },
    {
      label: 'Outlet',
      icon: Store,
      isActive: section === 'outlet',
      onClick: () => setSection('outlet'),
    },
    {
      label: 'Leads & Google Maps',
      icon: Search,
      isActive: section === 'leads',
      onClick: () => setSection('leads'),
      badge: leads.length,
    },
    {
      label: 'Katalog & Order',
      icon: ShoppingCart,
      isActive: section === 'order',
      onClick: () => setSection('order'),
      badge: cartTotalUnits > 0 ? cartTotalUnits : undefined,
    },
    {
      label: 'Aktivitas & GPS',
      icon: MapPin,
      isActive: section === 'aktivitas',
      onClick: () => setSection('aktivitas'),
    },
    {
      label: 'Target & Kinerja',
      icon: Target,
      isActive: section === 'lainnya' && lainnyaTab === 'target',
      onClick: () => {
        setSection('lainnya');
        setLainnyaTab('target');
      },
    },
    {
      label: 'AI Sales Assistant',
      icon: Bot,
      isActive: section === 'lainnya' && lainnyaTab === 'ai',
      onClick: () => {
        setSection('lainnya');
        setLainnyaTab('ai');
      },
    },
    {
      label: 'Content Studio',
      icon: Wand2,
      isActive: section === 'lainnya' && lainnyaTab === 'studio',
      onClick: () => {
        setSection('lainnya');
        setLainnyaTab('studio');
      },
    },
    {
      label: 'Google Workspace',
      icon: Mail,
      isActive: section === 'lainnya' && lainnyaTab === 'workspace',
      onClick: () => {
        setSection('lainnya');
        setLainnyaTab('workspace');
      },
    },
    {
      label: 'Notifikasi',
      icon: Bell,
      isActive: section === 'lainnya' && lainnyaTab === 'notifications',
      onClick: () => {
        setSection('lainnya');
        setLainnyaTab('notifications');
      },
      badge: unreadNotifCount > 0 ? unreadNotifCount : undefined,
    },
    {
      label: 'Status Sinkronisasi',
      icon: RefreshCw,
      isActive: section === 'lainnya' && lainnyaTab === 'sync',
      onClick: () => {
        setSection('lainnya');
        setLainnyaTab('sync');
      },
    },
    {
      label: 'Profil & Pengaturan',
      icon: Settings,
      isActive: section === 'lainnya' && lainnyaTab === 'settings',
      onClick: () => {
        setSection('lainnya');
        setLainnyaTab('settings');
      },
    },
  ];

  return (
    <div className="min-h-screen bg-[var(--color-background)] text-[var(--color-text-primary)] flex">
      {/* Desktop Left Sidebar (248px) */}
      <aside className="hidden lg:flex lg:w-[248px] lg:flex-col lg:fixed lg:inset-y-0 border-r border-[var(--color-border)] bg-[var(--color-surface)] z-30">
        <div className="h-16 px-5 flex items-center justify-between border-b border-[var(--color-border)]">
          <BrandLogo subtitle="SALES PORTAL" />
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          {sidebarNavItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.label}
                type="button"
                onClick={item.onClick}
                className={`w-full flex items-center justify-between gap-2.5 rounded-xl px-3.5 py-2.5 text-sm font-semibold transition-colors cursor-pointer ${
                  item.isActive
                    ? 'bg-[#E5F4F8] dark:bg-[#19394B] text-[#123A54] dark:text-[#87CEEB]'
                    : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-muted)] hover:text-[var(--color-text-primary)]'
                }`}
              >
                <span className="flex items-center gap-2.5 truncate">
                  <Icon className="h-4 w-4 shrink-0" />
                  <span className="truncate">{item.label}</span>
                </span>
                {item.badge !== undefined && (
                  <span className="font-mono text-xs font-bold text-[#348CB2] dark:text-[#87CEEB] tabular-nums">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        <div className="p-4 border-t border-[var(--color-border)] space-y-2.5">
          <Link
            href="/"
            className="w-full inline-flex items-center justify-center gap-2 rounded-xl border border-[var(--color-border)] px-3 py-2 text-xs font-semibold text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-muted)]"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Kembali ke Landing Page</span>
          </Link>
        </div>
      </aside>

      {/* Main Content Wrapper */}
      <div className="flex-1 lg:pl-[248px] flex flex-col min-w-0 pb-20 lg:pb-6">
        {/* Top Header (64px) */}
        <header className="sticky top-0 z-20 h-16 border-b border-[var(--color-border)] bg-[var(--color-surface)]/95 backdrop-blur-md px-4 sm:px-6 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="lg:hidden">
              <BrandLogo subtitle="SALES PORTAL" compact />
            </div>
            <div className="hidden lg:block">
              <p className="text-sm font-bold text-[#123A54] dark:text-white">
                {SALES_REP_PROFILE.name}
              </p>
              <p className="text-xs text-[var(--color-text-muted)]">
                {SALES_REP_PROFILE.role} · {SALES_REP_PROFILE.area}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-2.5">
            <button
              type="button"
              onClick={() => setShiftModalOpen(true)}
              className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold cursor-pointer whitespace-nowrap transition-colors ${
                shiftActive
                  ? 'bg-[#ECFDF5] dark:bg-[#064E3B]/50 text-[#047857] dark:text-[#34D399]'
                  : 'bg-[var(--color-surface-muted)] text-[var(--color-text-secondary)]'
              }`}
            >
              <Clock className="h-3.5 w-3.5" />
              <span>{shiftActive ? 'Sesi Aktif' : 'Mulai Shift'}</span>
            </button>

            <PWAInstallButton variant="compact" />

            <button
              type="button"
              onClick={() => {
                setSection('lainnya');
                setLainnyaTab('notifications');
              }}
              aria-label="Notifikasi"
              className="relative inline-flex h-9 w-9 items-center justify-center rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] hover:bg-[var(--color-surface-muted)] cursor-pointer"
            >
              <Bell className="h-4 w-4" />
              {unreadNotifCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-[#F97316] text-[10px] font-bold text-white tabular-nums">
                  {unreadNotifCount}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={toggleTheme}
              aria-label="Ubah Tema"
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] hover:bg-[var(--color-surface-muted)] cursor-pointer"
            >
              {theme === 'dark' ? (
                <Sun className="h-4 w-4" />
              ) : (
                <Moon className="h-4 w-4" />
              )}
            </button>
          </div>
        </header>

        {/* Action Feedback Toast */}
        {bannerToast && (
          <div className="mx-4 sm:mx-6 mt-4 flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 dark:border-emerald-900/50 dark:bg-emerald-950/40 px-4 py-2.5 text-xs font-semibold text-emerald-800 dark:text-emerald-300">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            <span>{bannerToast}</span>
          </div>
        )}

        {/* Active Viewport Content */}
        <main className="mx-auto w-full max-w-6xl p-4 sm:p-6 space-y-6">
          {/* ================================================================
              1. BERANDA (DASHBOARD SALES - Screen 2 & Mobile 4)
             ================================================================ */}
          {section === 'beranda' && (
            <div className="space-y-6">
              {/* Greeting & Shift Hero Card */}
              <div className="rounded-2xl border border-[#ADD8E6]/60 bg-gradient-to-br from-[#E5F4F8] via-[#F3FAFC] to-white dark:from-[#172438] dark:via-[#111C2D] dark:to-[#111C2D] p-5 sm:p-6 shadow-xs">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <h1 className="text-xl sm:text-2xl font-bold text-[#123A54] dark:text-white">
                      Halo, {SALES_REP_PROFILE.name}
                    </h1>
                    <p className="text-xs sm:text-sm text-[var(--color-text-secondary)] mt-0.5">
                      {SALES_REP_PROFILE.role} · {SALES_REP_PROFILE.area} ·{' '}
                      {shiftActive
                        ? `Sesi Kerja Aktif sejak ${shiftStartTime}`
                        : 'Shift belum dimulai'}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-[#236D91] dark:text-[#87CEEB]" />
                    <select
                      aria-label="Pilih Periode Dashboard"
                      value={berandaPeriod}
                      onChange={(e) =>
                        setBerandaPeriod(
                          e.target.value as 'today' | 'yesterday' | 'week'
                        )
                      }
                      className="text-xs font-semibold text-[#236D91] dark:text-[#87CEEB] rounded-xl border border-[#ADD8E6] bg-white/85 dark:bg-[#19394B] px-3 py-2 tabular-nums cursor-pointer"
                    >
                      <option value="today">Hari ini, 24 Jun 2025</option>
                      <option value="yesterday">Kemarin, 23 Jun 2025</option>
                      <option value="week">Minggu Ini (18–24 Jun)</option>
                    </select>
                  </div>
                </div>

                {/* 4 KPI Cards */}
                <div className="mt-5 grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                  <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
                    <p className="text-xs font-semibold text-[var(--color-text-muted)]">
                      {berandaPeriod === 'today'
                        ? 'Order Hari Ini'
                        : berandaPeriod === 'yesterday'
                          ? 'Order Kemarin'
                          : 'Order Minggu Ini'}
                    </p>
                    <p className="mt-1.5 text-base sm:text-lg font-bold text-[#123A54] dark:text-white tabular-nums">
                      {formatRupiah(
                        berandaPeriod === 'today'
                          ? todayOrderTotal
                          : berandaPeriod === 'yesterday'
                            ? 13_950_000
                            : 38_400_000
                      )}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
                    <p className="text-xs font-semibold text-[var(--color-text-muted)]">
                      Outlet Dikunjungi
                    </p>
                    <p className="mt-1.5 text-base sm:text-lg font-bold text-[#123A54] dark:text-white tabular-nums">
                      {berandaPeriod === 'today'
                        ? `${completedVisitsCount + 4} / 8`
                        : berandaPeriod === 'yesterday'
                          ? '7 / 8'
                          : '29 / 32'}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
                    <p className="text-xs font-semibold text-[var(--color-text-muted)]">
                      Kunjungan Selesai
                    </p>
                    <p className="mt-1.5 text-base sm:text-lg font-bold text-[#123A54] dark:text-white tabular-nums">
                      {berandaPeriod === 'today'
                        ? completedVisitsCount + 3
                        : berandaPeriod === 'yesterday'
                          ? 7
                          : 29}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
                    <p className="text-xs font-semibold text-[var(--color-text-muted)]">
                      Pencapaian Target
                    </p>
                    <p className="mt-1.5 text-base sm:text-lg font-bold text-[#F97316] tabular-nums">
                      {targetPercentage}%
                    </p>
                  </div>
                </div>

                {/* Progress Target Bulan Ini */}
                <div className="mt-4 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs sm:text-sm">
                    <span className="font-bold text-[var(--color-text-primary)]">
                      Progress Target Bulan Ini
                    </span>
                    <span className="font-mono font-bold text-[#236D91] dark:text-[#87CEEB] tabular-nums">
                      {formatRupiah(totalRealized)} /{' '}
                      {formatRupiah(SALES_REP_PROFILE.monthlyTarget)} ·{' '}
                      {targetPercentage}%
                    </span>
                  </div>
                  <div className="mt-2.5 h-2.5 w-full overflow-hidden rounded-full bg-[var(--color-surface-muted)]">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-[#348CB2] to-[#10B981] transition-all"
                      style={{ width: `${targetPercentage}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Quick Actions (5 items incl. Leads & Google Maps) */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                {[
                  {
                    label: 'Kunjungan',
                    desc: 'Jadwal & bukti',
                    icon: MapPin,
                    color: 'bg-[#E5F4F8] text-[#236D91] dark:bg-[#19394B] dark:text-[#87CEEB]',
                    onClick: () => {
                      setSection('aktivitas');
                      setAktivitasTab('schedule');
                    },
                  },
                  {
                    label: 'Buat Order',
                    desc: 'Katalog SmartOrder',
                    icon: ShoppingCart,
                    color: 'bg-[#FFF7ED] text-[#C2410C] dark:bg-[#431407]/50 dark:text-[#FB923C]',
                    onClick: () => {
                      setSection('order');
                      setOrderTab('create');
                    },
                  },
                  {
                    label: 'Outlet',
                    desc: 'Daftar toko',
                    icon: Store,
                    color: 'bg-[#ECFDF5] text-[#047857] dark:bg-[#064E3B]/50 dark:text-[#34D399]',
                    onClick: () => setSection('outlet'),
                  },
                  {
                    label: 'Cari Leads & Maps',
                    desc: 'Filter & Google Maps',
                    icon: Search,
                    color: 'bg-[#F3FAFC] text-[#123A54] dark:bg-[#172438] dark:text-[#87CEEB]',
                    onClick: () => setSection('leads'),
                  },
                  {
                    label: 'AI Sales',
                    desc: 'Staff AI & Studio',
                    icon: Bot,
                    color: 'bg-[#EDE9FE] text-[#6D28D9] dark:bg-[#4C1D95]/50 dark:text-[#DDD6FE]',
                    onClick: () => {
                      setSection('lainnya');
                      setLainnyaTab('ai');
                    },
                  },
                ].map((qa) => {
                  const Icon = qa.icon;
                  return (
                    <button
                      key={qa.label}
                      type="button"
                      onClick={qa.onClick}
                      className="flex items-center gap-3 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 text-left hover:border-[#348CB2] hover:shadow-xs transition-all cursor-pointer"
                    >
                      <div
                        className={`flex h-11 w-11 items-center justify-center rounded-xl shrink-0 ${qa.color}`}
                      >
                        <Icon className="h-5 w-5" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-[var(--color-text-primary)] truncate">
                          {qa.label}
                        </p>
                        <p className="text-xs text-[var(--color-text-muted)] truncate">
                          {qa.desc}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* SmartReward Banner Card */}
              <div className="rounded-2xl border border-[#F97316]/30 bg-gradient-to-r from-[#FFF7ED] to-white dark:from-[#431407]/30 dark:to-[#111C2D] p-4 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#F97316] text-white shrink-0">
                    <Gift className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-[#C2410C] dark:text-[#FB923C]">
                      SmartReward — Poin Insentif Aktif
                    </p>
                    <p className="font-mono text-base font-bold text-[#123A54] dark:text-white tabular-nums">
                      {rewardPoints.toLocaleString('id-ID')} poin siap ditukar
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setSmartRewardOpen(true)}
                  className="rounded-xl bg-[#F97316] hover:bg-[#EA580C] px-4 py-2 text-xs font-bold text-white cursor-pointer"
                >
                  Buka Katalog Reward
                </button>
              </div>

              {/* Aktivitas Hari Ini & Google Workspace Quick Card */}
              <div className="grid gap-5 lg:grid-cols-2">
                <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <h2 className="text-base font-bold text-[#123A54] dark:text-white">
                      Aktivitas Hari Ini
                    </h2>
                    <button
                      type="button"
                      onClick={() => {
                        setSection('aktivitas');
                        setAktivitasTab('schedule');
                      }}
                      className="text-xs font-semibold text-[#348CB2] hover:underline cursor-pointer"
                    >
                      Lihat Semua
                    </button>
                  </div>
                  <div className="space-y-3">
                    {[
                      {
                        time: checkInTime || '08:01',
                        title: 'Absensi Masuk',
                        sub: `${SALES_REP_PROFILE.officeName} · Valid Geofence`,
                        done: true,
                      },
                      {
                        time: '09:15',
                        title: 'Kunjungan: Toko Makmur Jaya',
                        sub: 'Selesai · 2 foto display terunggah',
                        done: true,
                      },
                      {
                        time: '10:32',
                        title: 'Order: ORD-20250624-001',
                        sub: 'Toko Sentosa · Rp 12.500.000',
                        done: true,
                      },
                    ].map((act) => (
                      <div
                        key={act.title}
                        className="flex items-start justify-between gap-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] p-3"
                      >
                        <div className="flex items-start gap-3">
                          <span className="font-mono text-xs font-bold text-[#348CB2] tabular-nums pt-0.5">
                            {act.time}
                          </span>
                          <div>
                            <p className="text-xs sm:text-sm font-bold text-[var(--color-text-primary)]">
                              {act.title}
                            </p>
                            <p className="text-xs text-[var(--color-text-muted)]">
                              {act.sub}
                            </p>
                          </div>
                        </div>
                        <CheckCircle2 className="h-4 w-4 text-[#10B981] shrink-0 mt-0.5" />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Quick Maps & Workspace Summary */}
                <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <h2 className="text-base font-bold text-[#123A54] dark:text-white">
                      Google Workspace & Rute Lapangan
                    </h2>
                    <button
                      type="button"
                      onClick={() => {
                        setSection('lainnya');
                        setLainnyaTab('workspace');
                      }}
                      className="text-xs font-semibold text-[#348CB2] hover:underline cursor-pointer"
                    >
                      Buka Hub
                    </button>
                  </div>
                  <p className="text-xs text-[var(--color-text-secondary)]">
                    Kirim ringkasan order lewat Gmail, jadwalkan kunjungan
                    outlet ke Google Calendar, atau buat ruang rapat Google Meet
                    instan.
                  </p>
                  <div className="grid sm:grid-cols-2 gap-2.5">
                    <button
                      type="button"
                      onClick={() => {
                        setSection('lainnya');
                        setLainnyaTab('workspace');
                      }}
                      className="flex items-center gap-2.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] p-3 text-left hover:border-[#348CB2] cursor-pointer"
                    >
                      <Mail className="h-4 w-4 text-[#348CB2] shrink-0" />
                      <div>
                        <p className="text-xs font-bold">Gmail & Calendar</p>
                        <p className="text-[11px] text-[var(--color-text-muted)]">
                          Follow-up & Jadwal
                        </p>
                      </div>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setSection('aktivitas');
                        setAktivitasTab('gps');
                      }}
                      className="flex items-center gap-2.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] p-3 text-left hover:border-[#348CB2] cursor-pointer"
                    >
                      <Navigation className="h-4 w-4 text-[#10B981] shrink-0" />
                      <div>
                        <p className="text-xs font-bold">Peta & Rute GPS</p>
                        <p className="text-[11px] text-[var(--color-text-muted)]">
                          Navigasi Google Maps
                        </p>
                      </div>
                    </button>
                  </div>

                  {/* Promo Highlight */}
                  <button
                    type="button"
                    onClick={() => {
                      setSection('order');
                      setOrderTab('promo');
                    }}
                    className="w-full flex items-center justify-between rounded-xl bg-gradient-to-r from-[#348CB2] to-[#194F70] p-4 text-left text-white cursor-pointer hover:opacity-95 transition-opacity"
                  >
                    <div>
                      <p className="text-xs font-bold uppercase tracking-wider text-[#ADD8E6]">
                        Promo Sales Aktif
                      </p>
                      <p className="mt-0.5 text-sm font-bold">
                        Diskon hingga 25% & Point SmartReward x2
                      </p>
                    </div>
                    <ChevronRight className="h-5 w-5 shrink-0" />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ================================================================
              2. OUTLET (Assigned Outlets & Detail - Screen 3 & 4)
             ================================================================ */}
          {section === 'outlet' && (
            <div className="space-y-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h1 className="text-xl font-bold text-[#123A54] dark:text-white">
                    Assigned Outlets
                  </h1>
                  <p className="text-xs sm:text-sm text-[var(--color-text-secondary)]">
                    Daftar outlet binaan Sales Area Bogor & Depok.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setSection('leads')}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-[#F97316] hover:bg-[#EA580C] px-3.5 py-2 text-xs font-bold text-white cursor-pointer"
                >
                  <Search className="h-3.5 w-3.5" />
                  <span>Cari Prospek & Google Maps</span>
                </button>
              </div>

              {/* Search, Filter Icon Button & Segmented Filter */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--color-text-muted)]" />
                    <input
                      type="text"
                      value={outletSearch}
                      onChange={(e) => setOutletSearch(e.target.value)}
                      placeholder="Cari nama outlet atau kota..."
                      className="w-full rounded-xl border border-[var(--color-border-strong)] bg-[var(--color-surface)] pl-10 pr-4 py-2.5 text-sm focus:border-[#348CB2] focus:outline-none"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => setOutletFilterModalOpen(true)}
                    aria-label="Filter Outlet Lanjutan"
                    className="inline-flex h-10 items-center gap-1.5 rounded-xl border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-3.5 text-xs font-semibold hover:bg-[var(--color-surface-muted)] cursor-pointer shrink-0"
                  >
                    <SlidersHorizontal className="h-4 w-4 text-[#348CB2]" />
                    <span className="hidden sm:inline">Filter</span>
                  </button>
                </div>
                <div className="inline-flex rounded-xl bg-[var(--color-surface-muted)] p-1">
                  {[
                    { id: 'all' as const, label: `Semua (${outlets.length})` },
                    {
                      id: 'priority' as const,
                      label: `Prioritas (${outlets.filter((o) => o.isPriority).length})`,
                    },
                    {
                      id: 'today' as const,
                      label: `Hari Ini (${outlets.filter((o) => o.visitToday).length})`,
                    },
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setOutletFilter(tab.id)}
                      className={`rounded-lg px-3.5 py-1.5 text-xs font-semibold cursor-pointer whitespace-nowrap transition-colors ${
                        outletFilter === tab.id
                          ? 'bg-[#348CB2] text-white'
                          : 'text-[var(--color-text-secondary)]'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Outlet List */}
              <div className="grid gap-3 sm:grid-cols-2">
                {filteredOutlets.map((outlet) => (
                  <button
                    key={outlet.id}
                    type="button"
                    onClick={() => setDetailOutlet(outlet)}
                    className="flex items-center justify-between gap-3 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 text-left hover:border-[#348CB2] hover:shadow-xs transition-all cursor-pointer"
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
                      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#E5F4F8] dark:bg-[#19394B] text-[#348CB2] shrink-0">
                        <Store className="h-5 w-5" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-[var(--color-text-primary)] truncate">
                          {outlet.name}
                        </p>
                        <p className="text-xs text-[var(--color-text-secondary)] mt-0.5 tabular-nums">
                          {outlet.city} · {outlet.distanceKm} km
                        </p>
                        <p className="text-[11px] font-semibold mt-1 text-[#236D91] dark:text-[#87CEEB]">
                          {outlet.visitToday ? 'Hari Ini' : 'Terjadwal'} ·{' '}
                          {outlet.isPriority ? 'Prioritas' : outlet.category}
                        </p>
                      </div>
                    </div>
                    <ChevronRight className="h-4 w-4 text-[var(--color-text-muted)] shrink-0" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ================================================================
              2B. LEADS & GOOGLE MAPS BUSINESS DISCOVERY
             ================================================================ */}
          {section === 'leads' && (
            <LeadsDiscoveryModule
              leads={leads}
              onAddLead={(lead) => setLeads((prev) => [lead, ...prev])}
              onUpdateLead={(updated) =>
                setLeads((prev) =>
                  prev.map((l) => (l.id === updated.id ? updated : l))
                )
              }
              onConvertLeadToOutlet={handleConvertLeadToOutlet}
              onOpenWorkspaceWithLead={(lead) => {
                setWsPrefillEmail(lead.email);
                setWsPrefillOutlet({
                  id: `out-${lead.id}`,
                  name: lead.businessName,
                  city: lead.city,
                  address: lead.address,
                  distanceKm: 3.0,
                  isPriority: true,
                  visitToday: true,
                  status: 'Aktif',
                  category: 'General Trade',
                  picName: lead.picName,
                  phone: lead.phone,
                  email: lead.email,
                  lat: lead.lat,
                  lng: lead.lng,
                  lastOrderTotal: lead.estimatedValue,
                  lastVisitDate: lead.lastInteractionDate,
                });
                setSection('lainnya');
                setLainnyaTab('workspace');
              }}
              currentPos={currentPos}
              onToast={showToast}
            />
          )}

          {/* ================================================================
              3. ORDER (Katalog, Buat Order, Riwayat Order, Promo - Screens 8,9,10 & Mobile 14,15,16,18)
             ================================================================ */}
          {section === 'order' && (
            <div className="space-y-5">
              {/* Sub-navigation */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 rounded-xl bg-[var(--color-surface-muted)] p-1.5">
                {[
                  { id: 'catalog' as const, label: 'Katalog Produk' },
                  {
                    id: 'create' as const,
                    label: `Buat Order${cartTotalUnits > 0 ? ` (${cartTotalUnits})` : ''}`,
                  },
                  { id: 'history' as const, label: 'Riwayat Order' },
                  { id: 'promo' as const, label: 'Promo & Campaign' },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setOrderTab(tab.id)}
                    className={`rounded-lg py-2 text-xs sm:text-sm font-semibold cursor-pointer transition-colors whitespace-nowrap ${
                      orderTab === tab.id
                        ? 'bg-[#348CB2] text-white shadow-xs'
                        : 'text-[var(--color-text-secondary)]'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* 3A. Katalog Produk */}
              {orderTab === 'catalog' && (
                <div className="space-y-4">
                  <div className="relative">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--color-text-muted)]" />
                    <input
                      type="text"
                      value={productSearch}
                      onChange={(e) => setProductSearch(e.target.value)}
                      placeholder="Cari produk, kategori, atau SKU (cth: SX-MNM-001)..."
                      className="w-full rounded-xl border border-[var(--color-border-strong)] bg-[var(--color-surface)] pl-10 pr-4 py-2.5 text-sm focus:border-[#348CB2] focus:outline-none"
                    />
                  </div>

                  {/* 4 Visual Category Cards (Screen 9 / Mobile 14) */}
                  <div className="grid grid-cols-4 gap-2 sm:gap-3">
                    {[
                      { name: 'Minuman', icon: Coffee, tone: 'text-[#348CB2] bg-[#E5F4F8] dark:bg-[#19394B]' },
                      { name: 'Makanan', icon: Cookie, tone: 'text-[#EA580C] bg-[#FFF7ED] dark:bg-[#431407]/50' },
                      { name: 'Perawatan', icon: CareIcon, tone: 'text-[#7C3AED] bg-[#F5F3FF] dark:bg-[#2E1065]/50' },
                      { name: 'Lainnya', icon: Package, tone: 'text-emerald-700 bg-emerald-50 dark:bg-emerald-950/50 dark:text-emerald-300' },
                    ].map((catCard) => {
                      const CatIcon = catCard.icon;
                      const active = productCat === catCard.name;
                      return (
                        <button
                          key={catCard.name}
                          type="button"
                          onClick={() =>
                            setProductCat(active ? 'Semua' : catCard.name)
                          }
                          className={`flex flex-col items-center justify-center gap-1.5 rounded-2xl border p-3 text-xs font-bold transition-all cursor-pointer ${
                            active
                              ? 'border-[#348CB2] bg-[#F3FAFC] dark:bg-[#172438] ring-2 ring-[#348CB2]/20'
                              : 'border-[var(--color-border)] bg-[var(--color-surface)] hover:border-[#348CB2]'
                          }`}
                        >
                          <div
                            className={`flex h-10 w-10 items-center justify-center rounded-xl ${catCard.tone}`}
                          >
                            <CatIcon className="h-5 w-5" />
                          </div>
                          <span className="text-[var(--color-text-primary)] truncate">
                            {catCard.name}
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  {/* Category & Tag Filters */}
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex flex-wrap gap-1.5">
                      {[
                        'Semua',
                        'Minuman',
                        'Makanan',
                        'Perawatan',
                        'Lainnya',
                      ].map((cat) => (
                        <button
                          key={cat}
                          type="button"
                          onClick={() => setProductCat(cat)}
                          className={`rounded-lg border px-3 py-1.5 text-xs font-semibold cursor-pointer ${
                            productCat === cat
                              ? 'border-[#348CB2] bg-[#E5F4F8] dark:bg-[#19394B] text-[#123A54] dark:text-[#87CEEB]'
                              : 'border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-secondary)]'
                          }`}
                        >
                          {cat}
                        </button>
                      ))}
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {['Semua', 'Best Seller', 'Promo', 'Baru'].map((tag) => (
                        <button
                          key={tag}
                          type="button"
                          onClick={() => setProductTag(tag)}
                          className={`rounded-lg px-3 py-1.5 text-xs font-semibold cursor-pointer ${
                            productTag === tag
                              ? 'bg-[#348CB2] text-white'
                              : 'bg-[var(--color-surface-muted)] text-[var(--color-text-secondary)]'
                          }`}
                        >
                          {tag}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Product Grid */}
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {filteredProducts.map((p) => {
                      const inCartQty = cart[p.sku] || 0;
                      return (
                        <div
                          key={p.sku}
                          className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 flex items-center justify-between gap-3 hover:border-[#348CB2] transition-colors"
                        >
                          <button
                            type="button"
                            onClick={() => setDetailProduct(p)}
                            className="flex items-center gap-3 min-w-0 flex-1 text-left cursor-pointer"
                          >
                            <div
                              className="flex h-12 w-12 items-center justify-center rounded-xl text-white font-mono text-xs font-bold shrink-0"
                              style={{ backgroundColor: p.accentHex }}
                            >
                              {p.sku.slice(3, 6)}
                            </div>
                            <div className="min-w-0">
                              <p className="font-mono text-[11px] font-semibold text-[var(--color-text-muted)]">
                                {p.sku} · {p.tag}
                              </p>
                              <p className="text-sm font-bold text-[var(--color-text-primary)] truncate">
                                {p.name}
                              </p>
                              <p className="text-xs font-bold text-[#236D91] dark:text-[#87CEEB] mt-0.5 tabular-nums">
                                {formatRupiah(p.price)} / {p.unit} · Stok{' '}
                                {p.stock}
                              </p>
                            </div>
                          </button>

                          <div className="flex items-center gap-1.5 shrink-0">
                            {inCartQty > 0 && (
                              <span className="font-mono text-xs font-bold text-[#348CB2] px-1.5 tabular-nums">
                                {inCartQty}
                              </span>
                            )}
                            <button
                              type="button"
                              onClick={() => updateCartQty(p.sku, 5)}
                              aria-label={`Tambah ${p.name}`}
                              className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#348CB2] hover:bg-[#236D91] text-white cursor-pointer"
                            >
                              <Plus className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {cartTotalUnits > 0 && (
                    <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#ADD8E6] bg-[#F3FAFC] dark:bg-[#172438] p-4">
                      <div className="text-xs sm:text-sm">
                        <span className="font-bold text-[#123A54] dark:text-white tabular-nums">
                          {cartTotalUnits} pcs dipilih
                        </span>{' '}
                        · Estimasi Total{' '}
                        <strong className="tabular-nums text-[#236D91] dark:text-[#87CEEB]">
                          {formatRupiah(cartGrandTotal)}
                        </strong>
                      </div>
                      <button
                        type="button"
                        onClick={() => setOrderTab('create')}
                        className="rounded-xl bg-[#F97316] hover:bg-[#EA580C] px-4 py-2 text-xs sm:text-sm font-bold text-white cursor-pointer"
                      >
                        Lanjut ke Buat Order
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* 3B. Buat Order (Mobile Screen 15) */}
              {orderTab === 'create' && (
                <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 space-y-5">
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between gap-3 rounded-xl border border-[#ADD8E6] bg-[#F3FAFC] dark:bg-[#172438] p-3.5">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#348CB2] text-white shrink-0">
                          <Store className="h-5 w-5" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-[11px] font-semibold text-[#236D91] dark:text-[#87CEEB]">
                            Outlet Tujuan Pemesanan
                          </p>
                          <p className="text-sm font-bold text-[#123A54] dark:text-white truncate">
                            {(
                              outlets.find((o) => o.id === selectedOrderOutletId) ||
                              outlets[0]
                            )?.name}{' '}
                            —{' '}
                            {(
                              outlets.find((o) => o.id === selectedOrderOutletId) ||
                              outlets[0]
                            )?.city}
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setChangeOutletModalOpen(true)}
                        className="rounded-xl border border-[#348CB2] bg-[var(--color-surface)] px-3 py-1.5 text-xs font-bold text-[#348CB2] hover:bg-[#E5F4F8] cursor-pointer shrink-0"
                      >
                        Ubah Outlet
                      </button>
                    </div>
                  </div>

                  {cartItems.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-[var(--color-border-strong)] p-8 text-center space-y-3">
                      <p className="text-sm font-semibold text-[var(--color-text-primary)]">
                        Keranjang order masih kosong
                      </p>
                      <button
                        type="button"
                        onClick={() => setOrderTab('catalog')}
                        className="rounded-xl bg-[#348CB2] px-4 py-2 text-xs font-bold text-white cursor-pointer"
                      >
                        Pilih Produk dari Katalog
                      </button>
                    </div>
                  ) : (
                    <>
                      <div className="space-y-2.5">
                        {cartItems.map(({ product, qty, lineTotal }) => (
                          <div
                            key={product.sku}
                            className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] p-3.5"
                          >
                            <div>
                              <p className="font-mono text-[11px] font-semibold text-[var(--color-text-muted)]">
                                {product.sku}
                              </p>
                              <p className="text-sm font-bold text-[var(--color-text-primary)]">
                                {product.name}
                              </p>
                              <p className="text-xs text-[var(--color-text-secondary)] tabular-nums">
                                {formatRupiah(product.price)} × {qty} ={' '}
                                <strong>{formatRupiah(lineTotal)}</strong>
                              </p>
                            </div>
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => updateCartQty(product.sku, -1)}
                                aria-label="Kurangi"
                                className="flex h-8 w-8 items-center justify-center rounded-lg border border-[var(--color-border-strong)] bg-[var(--color-surface)] cursor-pointer"
                              >
                                <Minus className="h-3.5 w-3.5" />
                              </button>
                              <span className="w-8 text-center font-mono text-sm font-bold tabular-nums">
                                {qty}
                              </span>
                              <button
                                type="button"
                                onClick={() => updateCartQty(product.sku, 1)}
                                aria-label="Tambah"
                                className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#348CB2] text-white cursor-pointer"
                              >
                                <Plus className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>

                      <div className="rounded-xl bg-[#F3FAFC] dark:bg-[#172438] p-4 space-y-2 text-xs sm:text-sm">
                        <div className="flex justify-between">
                          <span className="text-[var(--color-text-secondary)]">
                            Subtotal
                          </span>
                          <span className="font-semibold tabular-nums">
                            {formatRupiah(cartSubtotal)}
                          </span>
                        </div>
                        <div className="flex justify-between text-emerald-700 dark:text-emerald-400">
                          <span>Diskon Promo Aktif</span>
                          <span className="font-semibold tabular-nums">
                            -{formatRupiah(cartDiscount)}
                          </span>
                        </div>
                        <div className="flex justify-between pt-2 border-t border-[var(--color-border)] text-base font-bold text-[#123A54] dark:text-white">
                          <span>Total Order</span>
                          <span className="tabular-nums">
                            {formatRupiah(cartGrandTotal)}
                          </span>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={handleSubmitOrder}
                        className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-[#348CB2] hover:bg-[#236D91] py-3 text-sm font-bold text-white shadow-sm cursor-pointer"
                      >
                        <ShoppingCart className="h-4 w-4" />
                        <span>Buat Order</span>
                      </button>
                    </>
                  )}
                </div>
              )}

              {/* 3C. Riwayat Order (Screen 8 & Mobile 16) */}
              {orderTab === 'history' && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <div className="relative flex-1">
                      <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--color-text-muted)]" />
                      <input
                        type="text"
                        value={orderSearch}
                        onChange={(e) => setOrderSearch(e.target.value)}
                        placeholder="Cari nomor order atau nama outlet..."
                        className="w-full rounded-xl border border-[var(--color-border-strong)] bg-[var(--color-surface)] pl-10 pr-4 py-2.5 text-sm focus:border-[#348CB2] focus:outline-none"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => setOrderFilterModalOpen(true)}
                      aria-label="Filter riwayat order"
                      className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-[var(--color-border-strong)] bg-[var(--color-surface)] text-[#348CB2] hover:bg-[#F3FAFC] cursor-pointer shrink-0"
                    >
                      <SlidersHorizontal className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="inline-flex rounded-xl bg-[var(--color-surface-muted)] p-1">
                    {['Semua', 'Diproses', 'Selesai', 'Batal'].map((st) => (
                      <button
                        key={st}
                        type="button"
                        onClick={() => setOrderStatusFilter(st)}
                        className={`rounded-lg px-3.5 py-1.5 text-xs font-semibold cursor-pointer ${
                          orderStatusFilter === st
                            ? 'bg-[#348CB2] text-white'
                            : 'text-[var(--color-text-secondary)]'
                        }`}
                      >
                        {st}
                      </button>
                    ))}
                  </div>
                  <div className="space-y-3">
                    {filteredOrders.map((ord) => (
                      <button
                        key={ord.id}
                        type="button"
                        onClick={() => setDetailOrder(ord)}
                        className="w-full flex items-center justify-between gap-4 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 text-left hover:border-[#348CB2] cursor-pointer"
                      >
                        <div>
                          <p className="font-mono text-xs font-bold text-[#236D91] dark:text-[#87CEEB]">
                            {ord.id}
                          </p>
                          <p className="text-sm font-bold text-[var(--color-text-primary)] mt-0.5">
                            {ord.outletName}
                          </p>
                          <p className="text-xs text-[var(--color-text-muted)] tabular-nums">
                            {ord.dateLabel} · {ord.items.length} SKU
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-bold text-[var(--color-text-primary)] tabular-nums">
                            {formatRupiah(ord.total)}
                          </p>
                          <p
                            className={`text-xs font-bold mt-1 ${
                              ord.status === 'Selesai'
                                ? 'text-emerald-600'
                                : ord.status === 'Diproses'
                                  ? 'text-[#348CB2]'
                                  : 'text-red-600'
                            }`}
                          >
                            {ord.status}
                          </p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* 3D. Promo & Campaign (Screen 10 & Mobile 18) */}
              {orderTab === 'promo' && (
                <div className="space-y-4">
                  <div className="rounded-2xl bg-gradient-to-r from-[#348CB2] to-[#123A54] p-5 sm:p-6 text-white flex flex-wrap items-center justify-between gap-4">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-wider text-[#ADD8E6]">
                        Program SmartReward & Promosi
                      </p>
                      <h2 className="mt-1 text-lg sm:text-xl font-bold">
                        Promo Sales — Diskon hingga 25%
                      </h2>
                      <p className="mt-1 text-xs sm:text-sm text-[#E5F4F8]">
                        Berlaku untuk produk pilihan SalesX-Ai periode Q4 2026.
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => setSmartRewardOpen(true)}
                        className="inline-flex items-center gap-2 rounded-xl bg-[#F97316] hover:bg-[#EA580C] px-4 py-2.5 text-xs sm:text-sm font-bold text-white shadow-sm cursor-pointer"
                      >
                        <Gift className="h-4 w-4" />
                        <span>Katalog SmartReward</span>
                      </button>
                      <Megaphone className="hidden sm:block h-10 w-10 text-[#ADD8E6]" />
                    </div>
                  </div>

                  <div className="inline-flex rounded-xl bg-[var(--color-surface-muted)] p-1">
                    {(['Semua', 'Promo', 'Campaign'] as const).map((t) => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setPromoTab(t)}
                        className={`rounded-lg px-4 py-1.5 text-xs font-semibold cursor-pointer ${
                          promoTab === t
                            ? 'bg-[#348CB2] text-white'
                            : 'text-[var(--color-text-secondary)]'
                        }`}
                      >
                        {t === 'Promo' ? 'Promo Aktif' : t}
                      </button>
                    ))}
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    {filteredPromos.map((promo) => (
                      <button
                        key={promo.id}
                        type="button"
                        onClick={() => setDetailPromo(promo)}
                        className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 space-y-2 text-left hover:border-[#348CB2] transition-colors cursor-pointer"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <h3 className="text-sm font-bold text-[var(--color-text-primary)]">
                            {promo.title}
                          </h3>
                          <span className="text-xs font-bold text-emerald-600 shrink-0">
                            {promo.status}
                          </span>
                        </div>
                        <p className="text-xs text-[var(--color-text-secondary)]">
                          {promo.subtitle}
                        </p>
                        <div className="pt-2 border-t border-[var(--color-border)] flex items-center justify-between text-[11px] text-[var(--color-text-muted)]">
                          <span className="font-semibold text-[#348CB2]">
                            {promo.discountRule}
                          </span>
                          <span className="tabular-nums">
                            s/d {promo.validUntil}
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ================================================================
              4. AKTIVITAS (Planner, Jadwal, Riwayat, GPS Map, Absensi - Screens 5,7,12,13)
             ================================================================ */}
          {section === 'aktivitas' && (
            <div className="space-y-5">
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5 rounded-xl bg-[var(--color-surface-muted)] p-1.5">
                {[
                  { id: 'planner' as const, label: 'Visit Planner' },
                  { id: 'schedule' as const, label: 'Jadwal Kunjungan' },
                  { id: 'history' as const, label: 'Riwayat Kunjungan' },
                  { id: 'gps' as const, label: 'Lokasi & GPS' },
                  { id: 'attendance' as const, label: 'Absensi Geofence' },
                ].map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setAktivitasTab(t.id)}
                    className={`rounded-lg py-2 px-2 text-xs font-semibold cursor-pointer transition-colors whitespace-nowrap ${
                      aktivitasTab === t.id
                        ? 'bg-[#348CB2] text-white shadow-xs'
                        : 'text-[var(--color-text-secondary)]'
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>

              {/* 4A. Visit Planner (Screen 5) */}
              {aktivitasTab === 'planner' && (
                <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <h2 className="text-base font-bold text-[#123A54] dark:text-white">
                        Rencana Kunjungan ({visits.length})
                      </h2>
                      <p className="text-xs text-[var(--color-text-secondary)]">
                        Atur periode tanggal, tambah outlet, atau optimasi rute AI.
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <input
                        type="date"
                        aria-label="Periode tanggal Visit Planner"
                        value={plannerDate}
                        onChange={(e) => setPlannerDate(e.target.value)}
                        className="rounded-xl border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-3 py-1.5 text-xs font-semibold tabular-nums"
                      />
                      <button
                        type="button"
                        onClick={() => setAddVisitModalOpen(true)}
                        className="inline-flex items-center gap-1 rounded-xl border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-3 py-2 text-xs font-bold text-[#123A54] dark:text-white hover:bg-[var(--color-surface-muted)] cursor-pointer"
                      >
                        <Plus className="h-3.5 w-3.5 text-[#348CB2]" />
                        <span>Tambah Outlet</span>
                      </button>
                      <button
                        type="button"
                        onClick={handleOptimizeRouteAI}
                        disabled={plannerOptimizing}
                        className="inline-flex items-center gap-1.5 rounded-xl bg-[#348CB2] hover:bg-[#236D91] px-3.5 py-2 text-xs font-bold text-white cursor-pointer"
                      >
                        {plannerOptimizing ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Sparkles className="h-3.5 w-3.5" />
                        )}
                        <span>Optimasi Rute (AI)</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setPlannerSavedNotice(true);
                          showToast(`Rencana kunjungan tanggal ${plannerDate} berhasil disimpan.`);
                        }}
                        className="rounded-xl border border-[#348CB2] px-3.5 py-2 text-xs font-bold text-[#348CB2] hover:bg-[#F3FAFC] cursor-pointer"
                      >
                        Simpan Rencana
                      </button>
                    </div>
                  </div>

                  {plannerAiNote && (
                    <div className="rounded-xl border border-[#ADD8E6] bg-[#F3FAFC] dark:bg-[#172438] p-3.5 text-xs text-[var(--color-text-primary)]">
                      <p className="font-bold text-[#236D91] dark:text-[#87CEEB] mb-1">
                        Rekomendasi Urutan Rute Staff AI:
                      </p>
                      <p className="whitespace-pre-line">{plannerAiNote}</p>
                    </div>
                  )}

                  {plannerSavedNotice && (
                    <p className="text-xs font-semibold text-emerald-600">
                      Urutan rute terakhir tersimpan untuk shift hari ini.
                    </p>
                  )}

                  <div className="space-y-2.5">
                    {visits.map((v, idx) => (
                      <div
                        key={v.id}
                        className="flex items-center justify-between gap-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] p-3.5"
                      >
                        <div className="flex items-center gap-3">
                          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#E5F4F8] dark:bg-[#19394B] font-mono text-xs font-bold text-[#123A54] dark:text-[#87CEEB] tabular-nums">
                            {idx + 1}
                          </span>
                          <div>
                            <p className="text-sm font-bold text-[var(--color-text-primary)]">
                              {v.outletName}
                            </p>
                            <p className="text-xs text-[var(--color-text-muted)] tabular-nums">
                              {v.timeRange} · {v.city}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleMoveVisit(idx, -1)}
                            disabled={idx === 0}
                            aria-label="Naikkan urutan"
                            className="rounded-lg border border-[var(--color-border)] p-1.5 disabled:opacity-40 cursor-pointer"
                          >
                            <ChevronUp className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleMoveVisit(idx, 1)}
                            disabled={idx === visits.length - 1}
                            aria-label="Turunkan urutan"
                            className="rounded-lg border border-[var(--color-border)] p-1.5 disabled:opacity-40 cursor-pointer"
                          >
                            <ChevronDown className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 4B. Jadwal Kunjungan (Screen 7) */}
              {aktivitasTab === 'schedule' && (
                <div className="space-y-4">
                  <div className="inline-flex rounded-xl bg-[var(--color-surface-muted)] p-1">
                    {[
                      { id: 'today' as const, label: 'Hari ini (24 Jun)' },
                      { id: 'tomorrow' as const, label: 'Besok (25 Jun)' },
                      { id: 'thursday' as const, label: 'Kam (26 Jun)' },
                    ].map((d) => (
                      <button
                        key={d.id}
                        type="button"
                        onClick={() => setVisitDateTab(d.id)}
                        className={`rounded-lg px-4 py-1.5 text-xs font-semibold cursor-pointer ${
                          visitDateTab === d.id
                            ? 'bg-[#348CB2] text-white'
                            : 'text-[var(--color-text-secondary)]'
                        }`}
                      >
                        {d.label}
                      </button>
                    ))}
                  </div>

                  <div className="space-y-3">
                    {visits
                      .filter((v) => v.dateKey === visitDateTab)
                      .map((v) => (
                        <div
                          key={v.id}
                          className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 flex flex-wrap items-center justify-between gap-4"
                        >
                          <div>
                            <p className="font-mono text-xs font-bold text-[#348CB2] tabular-nums">
                              {v.timeRange} · {v.status}
                            </p>
                            <h3 className="text-sm font-bold text-[var(--color-text-primary)] mt-0.5">
                              {v.outletName}
                            </h3>
                            <p className="text-xs text-[var(--color-text-muted)]">
                              {v.address}, {v.city}
                            </p>
                          </div>
                          <div className="flex flex-wrap items-center gap-2">
                            <button
                              type="button"
                              onClick={() => setNavigationVisit(v)}
                              className="inline-flex items-center gap-1.5 rounded-xl border border-[var(--color-border-strong)] px-3 py-2 text-xs font-semibold hover:bg-[var(--color-surface-muted)] cursor-pointer"
                            >
                              <Navigation className="h-3.5 w-3.5 text-[#348CB2]" />
                              <span>Navigasi</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => setEvidenceVisit(v)}
                              className="inline-flex items-center gap-1.5 rounded-xl bg-[#348CB2] hover:bg-[#236D91] px-3.5 py-2 text-xs font-bold text-white cursor-pointer"
                            >
                              <CheckCircle2 className="h-3.5 w-3.5" />
                              <span>
                                {v.status === 'Selesai'
                                  ? 'Lihat Bukti'
                                  : 'Check-in & Bukti'}
                              </span>
                            </button>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              )}

              {/* 4C. Riwayat Kunjungan (Mobile Screen 13) */}
              {aktivitasTab === 'history' && (
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <h2 className="text-sm font-bold text-[#123A54] dark:text-white">
                      Riwayat Kunjungan Selesai
                    </h2>
                    <select
                      aria-label="Filter periode riwayat kunjungan"
                      value={historyPeriodFilter}
                      onChange={(e) =>
                        setHistoryPeriodFilter(e.target.value as '7d' | '30d')
                      }
                      className="rounded-xl border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-3 py-1.5 text-xs font-semibold"
                    >
                      <option value="7d">7 Hari Terakhir</option>
                      <option value="30d">30 Hari Terakhir</option>
                    </select>
                  </div>

                  {visits
                    .filter((v) => v.status === 'Selesai')
                    .map((v) => (
                      <button
                        key={v.id}
                        type="button"
                        onClick={() => setHistoryDetailVisit(v)}
                        className="w-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 flex items-start justify-between gap-4 text-left hover:border-[#348CB2] transition-colors cursor-pointer"
                      >
                        <div>
                          <p className="text-sm font-bold text-[var(--color-text-primary)]">
                            {v.outletName}
                          </p>
                          <p className="text-xs text-[var(--color-text-muted)] tabular-nums mt-0.5">
                            {historyPeriodFilter === '7d' ? '24 Jun 2025' : 'Jun 2025'} · {v.timeRange} ·{' '}
                            {v.photoCount || 1} foto bukti
                          </p>
                          {v.notes && (
                            <p className="mt-2 text-xs text-[var(--color-text-secondary)]">
                              {v.notes}
                            </p>
                          )}
                        </div>
                        <span className="text-xs font-bold text-emerald-600 shrink-0">
                          Selesai →
                        </span>
                      </button>
                    ))}
                </div>
              )}

              {/* 4D. Lokasi & Aktivitas GPS (Screen 12 & Mobile 5) */}
              {aktivitasTab === 'gps' && (
                <div className="space-y-4">
                  <div className="rounded-2xl border border-emerald-200 bg-emerald-50 dark:border-emerald-900/50 dark:bg-emerald-950/30 p-4 flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-bold text-emerald-800 dark:text-emerald-300">
                        GPS Aktif (Realtime)
                      </p>
                      <p className="text-xs text-emerald-700 dark:text-emerald-400">
                        Mengirim lokasi secara berkala hanya selama sesi kerja
                        aktif ({SALES_REP_PROFILE.shiftSchedule}).
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={handleRefreshGps}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 px-3.5 py-2 text-xs font-bold text-white cursor-pointer"
                    >
                      <Navigation className="h-3.5 w-3.5" />
                      <span>Perbarui Lokasi GPS</span>
                    </button>
                  </div>

                  {gpsStatusMsg && (
                    <p className="text-xs font-medium text-[#236D91] dark:text-[#87CEEB]">
                      {gpsStatusMsg}
                    </p>
                  )}

                  <SalesGoogleMap
                    currentPos={currentPos}
                    outlets={outlets}
                    selectedOutlet={mapSelectedOutlet}
                    onSelectOutlet={(o) => setMapSelectedOutlet(o)}
                    heightClass="h-[340px] sm:h-[400px]"
                  />

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                    <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-3.5">
                      <p className="text-[var(--color-text-muted)]">Status Tracking</p>
                      <p className="mt-1 font-bold text-emerald-600 tabular-nums">
                        {shiftActive ? 'Aktif' : 'Standby'} · {SALES_REP_PROFILE.shiftSchedule}
                      </p>
                    </div>
                    <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-3.5">
                      <p className="text-[var(--color-text-muted)]">Update Terakhir</p>
                      <p className="mt-1 font-mono font-bold tabular-nums">
                        09:41:12 WIB
                      </p>
                    </div>
                    <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-3.5">
                      <p className="text-[var(--color-text-muted)]">Akurasi Lokasi</p>
                      <p className="mt-1 font-bold tabular-nums">± 8 meter</p>
                    </div>
                    <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-3.5 flex items-center justify-between">
                      <div>
                        <p className="text-[var(--color-text-muted)]">Baterai Perangkat</p>
                        <p className="mt-1 font-bold tabular-nums">78%</p>
                      </div>
                      <Battery className="h-5 w-5 text-emerald-600" />
                    </div>
                    <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-3.5">
                      <p className="text-[var(--color-text-muted)]">Koneksi & Kecepatan</p>
                      <p className="mt-1 font-bold tabular-nums">
                        {isOnline ? 'Online' : 'Offline'} · 0 km/jam
                      </p>
                    </div>
                    <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-3.5">
                      <p className="text-[var(--color-text-muted)]">Lokasi Saat Ini</p>
                      <p className="mt-1 font-mono font-bold tabular-nums">
                        {currentPos.lat.toFixed(5)}, {currentPos.lng.toFixed(5)}
                      </p>
                    </div>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setRouteModalOpen(true)}
                      className="w-full rounded-xl bg-[#348CB2] hover:bg-[#236D91] py-3 text-sm font-bold text-white cursor-pointer"
                    >
                      Lihat Riwayat Perjalanan
                    </button>
                    <button
                      type="button"
                      onClick={() => setShiftModalOpen(true)}
                      className="w-full rounded-xl border border-[#348CB2] bg-[var(--color-surface)] py-3 text-sm font-bold text-[#348CB2] hover:bg-[#F3FAFC] cursor-pointer"
                    >
                      Kelola Sesi Kerja ({shiftActive ? 'Aktif' : 'Standby'})
                    </button>
                  </div>
                </div>
              )}

              {/* 4E. Absensi Geofence (Screen 13 & Mobile 6) */}
              {aktivitasTab === 'attendance' && (
                <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 space-y-5">
                  <div className="inline-flex rounded-xl bg-[var(--color-surface-muted)] p-1">
                    {(['absen', 'rekap'] as const).map((t) => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setAttendanceSubTab(t)}
                        className={`rounded-lg px-5 py-1.5 text-xs font-semibold cursor-pointer capitalize ${
                          attendanceSubTab === t
                            ? 'bg-[#348CB2] text-white'
                            : 'text-[var(--color-text-secondary)]'
                        }`}
                      >
                        {t}
                      </button>
                    ))}
                  </div>

                  {attendanceSubTab === 'absen' ? (
                    <div className="space-y-4">
                      <div className="rounded-2xl border border-emerald-200 bg-emerald-50 dark:border-emerald-900/50 dark:bg-emerald-950/30 p-4 flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className="flex h-12 w-12 items-center justify-center rounded-full border-2 border-emerald-400 bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 shrink-0">
                            <Radar className="h-6 w-6" />
                          </div>
                          <div>
                            <p className="text-sm font-bold text-emerald-800 dark:text-emerald-300">
                              Dalam Area Kerja ({SALES_REP_PROFILE.officeName})
                            </p>
                            <p className="text-xs text-emerald-700 dark:text-emerald-400 tabular-nums mt-0.5">
                              Jarak: 12 meter · Radius Geofence{' '}
                              {SALES_REP_PROFILE.geofenceRadiusM} meter · Valid
                            </p>
                          </div>
                        </div>
                        <CheckCircle2 className="h-6 w-6 text-emerald-600 shrink-0" />
                      </div>

                      <div className="grid sm:grid-cols-2 gap-3">
                        <button
                          type="button"
                          onClick={() => {
                            const now = new Date();
                            const t = `${String(now.getHours()).padStart(
                              2,
                              '0'
                            )}:${String(now.getMinutes()).padStart(2, '0')}`;
                            setCheckInTime(t);
                            setShiftActive(true);
                            showToast(`Absen masuk tercatat pukul ${t} WIB.`);
                          }}
                          className="rounded-2xl bg-[#123A54] hover:bg-[#194F70] p-4 text-left text-white cursor-pointer"
                        >
                          <p className="text-xs text-[#ADD8E6]">Absen Masuk</p>
                          <p className="mt-1 font-mono text-xl font-bold tabular-nums">
                            {checkInTime || '--:--'} WIB
                          </p>
                          <p className="mt-1 text-[11px] text-[#E5F4F8]">
                            Klik untuk memperbarui check-in geofence
                          </p>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            const now = new Date();
                            const t = `${String(now.getHours()).padStart(
                              2,
                              '0'
                            )}:${String(now.getMinutes()).padStart(2, '0')}`;
                            setCheckOutTime(t);
                            setShiftActive(false);
                            showToast(`Absen pulang tercatat pukul ${t} WIB.`);
                          }}
                          className="rounded-2xl border border-[var(--color-border-strong)] bg-[var(--color-background)] p-4 text-left hover:border-[#348CB2] cursor-pointer"
                        >
                          <p className="text-xs text-[var(--color-text-muted)]">
                            Absen Pulang
                          </p>
                          <p className="mt-1 font-mono text-xl font-bold text-[var(--color-text-primary)] tabular-nums">
                            {checkOutTime ? `${checkOutTime} WIB` : '-- : --'}
                          </p>
                          <p className="mt-1 text-[11px] text-[var(--color-text-secondary)]">
                            Catat selesai jam kerja lapangan
                          </p>
                        </button>
                      </div>

                      <div className="text-center pt-1">
                        <button
                          type="button"
                          onClick={() => setAttendanceSubTab('rekap')}
                          className="text-xs font-bold text-[#348CB2] hover:underline cursor-pointer"
                        >
                          Lihat Riwayat Absensi →
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2.5 text-xs">
                      {[
                        {
                          date: 'Sen, 24 Jun 2025',
                          inTime: checkInTime || '08:01',
                          outTime: checkOutTime || 'Aktif',
                          loc: 'Kantor Area Bogor',
                        },
                        {
                          date: 'Sab, 21 Jun 2025',
                          inTime: '08:04',
                          outTime: '17:02',
                          loc: 'Kantor Area Bogor',
                        },
                        {
                          date: 'Jum, 20 Jun 2025',
                          inTime: '07:58',
                          outTime: '17:05',
                          loc: 'Kantor Area Bogor',
                        },
                      ].map((row) => (
                        <div
                          key={row.date}
                          className="flex items-center justify-between rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] p-3.5"
                        >
                          <div>
                            <p className="font-bold text-[var(--color-text-primary)]">
                              {row.date}
                            </p>
                            <p className="text-[var(--color-text-muted)]">
                              {row.loc}
                            </p>
                          </div>
                          <div className="text-right font-mono font-semibold tabular-nums">
                            <span>Masuk {row.inTime}</span> ·{' '}
                            <span>Pulang {row.outTime}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* ================================================================
              5. LAINNYA (Menu, Target, AI, Studio, Workspace, Notifikasi, Sync, Profil)
             ================================================================ */}
          {section === 'lainnya' && (
            <div className="space-y-5">
              {lainnyaTab !== 'menu' && (
                <button
                  type="button"
                  onClick={() => setLainnyaTab('menu')}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#348CB2] hover:underline cursor-pointer"
                >
                  <ArrowLeft className="h-3.5 w-3.5" />
                  <span>Semua Menu Lainnya</span>
                </button>
              )}

              {lainnyaTab === 'menu' && (
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {[
                    {
                      id: 'leads' as const,
                      title: 'Pencarian Leads & Google Maps',
                      sub: `${leads.length} prospek aktif & cari bisnis Maps`,
                      icon: Search,
                      onSelect: () => setSection('leads'),
                    },
                    {
                      id: 'smartreward' as const,
                      title: 'SmartReward (Poin & Insentif)',
                      sub: `${rewardPoints.toLocaleString('id-ID')} poin dapat ditukar`,
                      icon: Gift,
                      onSelect: () => setSmartRewardOpen(true),
                    },
                    {
                      id: 'target' as const,
                      title: 'Target & Kinerja',
                      sub: `${targetPercentage}% tercapai bulan ini`,
                      icon: Target,
                      onSelect: () => setLainnyaTab('target'),
                    },
                    {
                      id: 'ai' as const,
                      title: 'AI Sales Assistant',
                      sub: 'Chatbot Gemini & Maps Grounding',
                      icon: Bot,
                      onSelect: () => setLainnyaTab('ai'),
                    },
                    {
                      id: 'studio' as const,
                      title: 'Content Studio (AI)',
                      sub: 'Poster 1K–4K, Caption & Video',
                      icon: Wand2,
                      onSelect: () => setLainnyaTab('studio'),
                    },
                    {
                      id: 'workspace' as const,
                      title: 'Google Workspace',
                      sub: 'Gmail, Calendar & Google Meet',
                      icon: Mail,
                      onSelect: () => setLainnyaTab('workspace'),
                    },
                    {
                      id: 'telegram' as const,
                      title: 'Telegram Assistant Bot',
                      sub: telegramLinked ? 'Terhubung (@SalesXAi_FieldBot)' : 'Tautkan perintah /today & /sales',
                      icon: MessageSquare,
                      onSelect: () => setTelegramModalOpen(true),
                    },
                    {
                      id: 'notifications' as const,
                      title: 'Notifikasi',
                      sub: `${unreadNotifCount} pesan belum dibaca`,
                      icon: Bell,
                      onSelect: () => setLainnyaTab('notifications'),
                    },
                    {
                      id: 'sync' as const,
                      title: 'Status Sinkronisasi',
                      sub: `Terakhir ${lastSyncLabel}`,
                      icon: RefreshCw,
                      onSelect: () => setLainnyaTab('sync'),
                    },
                    {
                      id: 'settings' as const,
                      title: 'Profil & Pengaturan',
                      sub: 'Akun, GPS, Keamanan, Offline & PWA',
                      icon: Settings,
                      onSelect: () => setLainnyaTab('settings'),
                    },
                  ].map((item) => {
                    const Icon = item.icon;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={item.onSelect}
                        className="flex items-center justify-between gap-3 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 text-left hover:border-[#348CB2] cursor-pointer"
                      >
                        <div className="flex items-center gap-3">
                          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#E5F4F8] dark:bg-[#19394B] text-[#348CB2] shrink-0">
                            <Icon className="h-5 w-5" />
                          </div>
                          <div>
                            <p className="text-sm font-bold text-[var(--color-text-primary)]">
                              {item.title}
                            </p>
                            <p className="text-xs text-[var(--color-text-muted)]">
                              {item.sub}
                            </p>
                          </div>
                        </div>
                        <ChevronRight className="h-4 w-4 text-[var(--color-text-muted)] shrink-0" />
                      </button>
                    );
                  })}
                </div>
              )}

              {/* 5A. Target & Kinerja (Screen 11 & Mobile 19) */}
              {lainnyaTab === 'target' && (() => {
                const perf =
                  PERFORMANCE_BY_PERIOD[targetPeriod] ||
                  PERFORMANCE_BY_PERIOD['Jun 2025'];
                const activeRealized =
                  targetPeriod === 'Jun 2025' ? totalRealized : perf.realized;
                const activePct =
                  targetPeriod === 'Jun 2025'
                    ? targetPercentage
                    : Math.min(100, Math.round((perf.realized / perf.target) * 1000) / 10);
                const activeTxCount =
                  targetPeriod === 'Jun 2025'
                    ? `${20 + orders.length} transaksi`
                    : perf.ordersLabel;

                return (
                  <div className="space-y-5">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <h2 className="text-lg font-bold text-[#123A54] dark:text-white">
                        Target & Pencapaian Kinerja
                      </h2>
                      <select
                        value={targetPeriod}
                        onChange={(e) => setTargetPeriod(e.target.value)}
                        className="rounded-xl border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-3 py-2 text-xs font-semibold"
                      >
                        <option value="Jun 2025">Bulan Ini (Jun 2025)</option>
                        <option value="Mei 2025">Mei 2025</option>
                      </select>
                    </div>

                    {/* Ring + KPI Summary */}
                    <div className="grid gap-5 lg:grid-cols-3">
                      <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 flex items-center gap-5">
                        <svg className="h-24 w-24 shrink-0" viewBox="0 0 100 100">
                          <circle
                            cx="50"
                            cy="50"
                            r="40"
                            fill="none"
                            stroke="#E2E8F0"
                            strokeWidth="10"
                          />
                          <circle
                            cx="50"
                            cy="50"
                            r="40"
                            fill="none"
                            stroke="#348CB2"
                            strokeWidth="10"
                            strokeLinecap="round"
                            strokeDasharray={`${(activePct / 100) * 251.2} 251.2`}
                            transform="rotate(-90 50 50)"
                          />
                          <text
                            x="50"
                            y="55"
                            textAnchor="middle"
                            className="fill-[#123A54] dark:fill-white font-mono text-sm font-bold"
                          >
                            {activePct}%
                          </text>
                        </svg>
                        <div className="space-y-1 text-xs">
                          <p className="text-[var(--color-text-muted)]">
                            Target Order
                          </p>
                          <p className="font-bold text-sm tabular-nums">
                            {formatRupiah(perf.target)}
                          </p>
                          <p className="text-[var(--color-text-muted)] pt-1">
                            Realisasi
                          </p>
                          <p className="font-bold text-sm text-[#348CB2] tabular-nums">
                            {formatRupiah(activeRealized)}
                          </p>
                          <p className="text-[11px] text-[var(--color-text-muted)] tabular-nums">
                            Sisa: {formatRupiah(Math.max(0, perf.target - activeRealized))}
                          </p>
                        </div>
                      </div>

                      <div className="lg:col-span-2 grid grid-cols-3 gap-3">
                        {[
                          {
                            label: 'Order',
                            val: activeTxCount,
                            growth: perf.ordersGrowth,
                          },
                          {
                            label: 'Kunjungan',
                            val: perf.visitsLabel,
                            growth: perf.visitsGrowth,
                          },
                          {
                            label: 'Cakupan Outlet',
                            val: perf.coverageLabel,
                            growth: perf.coverageGrowth,
                          },
                        ].map((kpi) => (
                          <div
                            key={kpi.label}
                            className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4"
                          >
                            <p className="text-xs text-[var(--color-text-muted)]">
                              {kpi.label}
                            </p>
                            <p className="mt-1 text-sm sm:text-base font-bold text-[var(--color-text-primary)] tabular-nums">
                              {kpi.val}
                            </p>
                            <p className="mt-1 text-xs font-bold text-emerald-600 tabular-nums">
                              {kpi.growth}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Chart & Category Breakdown */}
                    <div className="grid gap-5 lg:grid-cols-2">
                      <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5">
                        <h3 className="text-sm font-bold text-[var(--color-text-primary)] mb-4">
                          Tren Realisasi (Juta Rp · Jan–Jun)
                        </h3>
                        <div className="h-44 flex items-end justify-between gap-3 pt-4">
                          {MONTHLY_REALIZATION_DATA.map((d) => (
                            <div
                              key={d.month}
                              className="flex-1 flex flex-col items-center gap-2"
                            >
                              <span className="font-mono text-[11px] font-bold text-[#348CB2] tabular-nums">
                                {d.value}
                              </span>
                              <div
                                className={`w-full max-w-[36px] rounded-t-lg bg-gradient-to-t ${
                                  d.month === targetPeriod.slice(0, 3)
                                    ? 'from-[#F97316] to-[#FB923C]'
                                    : 'from-[#348CB2] to-[#87CEEB]'
                                }`}
                                style={{ height: `${Math.round(d.value * 1.8)}px` }}
                              />
                              <span className="text-xs font-semibold text-[var(--color-text-muted)]">
                                {d.month}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 space-y-3.5">
                        <h3 className="text-sm font-bold text-[var(--color-text-primary)]">
                          Progress Per Kategori Produk ({targetPeriod})
                        </h3>
                        {perf.categories.map((cat) => (
                          <div key={cat.name} className="space-y-1">
                            <div className="flex justify-between text-xs font-semibold">
                              <span>{cat.name}</span>
                              <span className="font-mono tabular-nums text-[#236D91] dark:text-[#87CEEB]">
                                {cat.pct}%
                              </span>
                            </div>
                            <div className="h-2 rounded-full bg-[var(--color-surface-muted)] overflow-hidden">
                              <div
                                className="h-full rounded-full bg-[#348CB2]"
                                style={{ width: `${cat.pct}%` }}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* 5B. AI Sales Assistant */}
              {lainnyaTab === 'ai' && (
                <AIChatAndStudio
                  initialMode="chat"
                  currentPos={currentPos}
                  outlets={outlets}
                  orders={orders}
                  onSwitchMode={(mode) =>
                    setLainnyaTab(mode === 'studio' ? 'studio' : 'ai')
                  }
                />
              )}

              {/* 5C. Content Studio */}
              {lainnyaTab === 'studio' && (
                <AIChatAndStudio
                  initialMode="studio"
                  currentPos={currentPos}
                  outlets={outlets}
                  orders={orders}
                  onSwitchMode={(mode) =>
                    setLainnyaTab(mode === 'chat' ? 'ai' : 'studio')
                  }
                />
              )}

              {/* 5D. Google Workspace Hub */}
              {lainnyaTab === 'workspace' && (
                <WorkspaceHubView
                  outlets={outlets}
                  prefillEmailTo={wsPrefillEmail}
                  prefillCalendarOutlet={wsPrefillOutlet}
                />
              )}

              {/* 5E. Notifikasi (Mobile Screen 20/21) */}
              {lainnyaTab === 'notifications' && (
                <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="inline-flex rounded-xl bg-[var(--color-surface-muted)] p-1">
                      {(['Semua', 'Aktivitas', 'Sistem'] as const).map((t) => (
                        <button
                          key={t}
                          type="button"
                          onClick={() => setNotifFilter(t)}
                          className={`rounded-lg px-3.5 py-1.5 text-xs font-semibold cursor-pointer ${
                            notifFilter === t
                              ? 'bg-[#348CB2] text-white'
                              : 'text-[var(--color-text-secondary)]'
                          }`}
                        >
                          {t}
                        </button>
                      ))}
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        setNotifications((prev) =>
                          prev.map((n) => ({ ...n, read: true }))
                        )
                      }
                      className="text-xs font-semibold text-[#348CB2] hover:underline cursor-pointer"
                    >
                      Tandai Semua Dibaca
                    </button>
                  </div>

                  <div className="space-y-2.5">
                    {filteredNotifs.map((n) => (
                      <div
                        key={n.id}
                        className={`rounded-xl border p-3.5 ${
                          n.read
                            ? 'border-[var(--color-border)] bg-[var(--color-background)]'
                            : 'border-[#348CB2]/40 bg-[#F3FAFC] dark:bg-[#172438]'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-sm font-bold text-[var(--color-text-primary)]">
                            {n.title}
                          </p>
                          <span className="text-[11px] text-[var(--color-text-muted)]">
                            {n.timeAgo}
                          </span>
                        </div>
                        <p className="text-xs text-[var(--color-text-secondary)] mt-1">
                          {n.detail}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 5F. Status Sinkronisasi (Mobile Screen 22) */}
              {lainnyaTab === 'sync' && (
                <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 space-y-4">
                  <div className="rounded-2xl border border-emerald-200 bg-emerald-50 dark:border-emerald-900/50 dark:bg-emerald-950/30 p-4 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <Wifi className="h-6 w-6 text-emerald-600 shrink-0" />
                      <div>
                        <p className="text-sm font-bold text-emerald-800 dark:text-emerald-300">
                          {isOnline
                            ? 'Data Tersinkron'
                            : 'Mode Offline — Antrean Lokal Aktif'}
                        </p>
                        <p className="text-xs text-emerald-700 dark:text-emerald-400 tabular-nums">
                          Terakhir diperiksa: {lastSyncLabel}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="divide-y divide-[var(--color-border)] rounded-xl border border-[var(--color-border)] text-xs sm:text-sm">
                    {[
                      { label: 'Kunjungan', status: '0 tertunda' },
                      { label: 'Order', status: '0 tertunda' },
                      { label: 'Foto & Dokumen', status: '0 tertunda' },
                      { label: 'Lokasi GPS', status: 'Realtime' },
                      { label: 'Data Lainnya', status: 'Sinkron' },
                    ].map((row) => (
                      <div
                        key={row.label}
                        className="flex items-center justify-between px-4 py-3"
                      >
                        <span className="font-semibold">{row.label}</span>
                        <span className="font-mono font-bold text-emerald-600">
                          {row.status}
                        </span>
                      </div>
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={handleCheckSync}
                    disabled={syncChecking}
                    className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-[#348CB2] hover:bg-[#236D91] py-3 text-sm font-bold text-white cursor-pointer"
                  >
                    <RefreshCw
                      className={`h-4 w-4 ${syncChecking ? 'animate-spin' : ''}`}
                    />
                    <span>
                      {syncChecking ? 'Memeriksa...' : 'Cek Sekarang'}
                    </span>
                  </button>
                </div>
              )}

              {/* 5G. Profil & Pengaturan (Screen 16 & Mobile 23) */}
              {lainnyaTab === 'settings' && (
                <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 space-y-5">
                  <div className="flex items-center gap-4 pb-4 border-b border-[var(--color-border)]">
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#348CB2] text-white text-lg font-bold shrink-0">
                      BS
                    </div>
                    <div>
                      <h2 className="text-base font-bold text-[#123A54] dark:text-white">
                        {SALES_REP_PROFILE.name}
                      </h2>
                      <p className="text-xs text-[var(--color-text-secondary)]">
                        {SALES_REP_PROFILE.role} · {SALES_REP_PROFILE.area} ·
                        Status Aktif
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2.5 text-sm">
                    <div className="flex items-center justify-between rounded-xl border border-[var(--color-border)] p-3.5">
                      <div>
                        <p className="font-semibold">Notifikasi Aktivitas</p>
                        <p className="text-xs text-[var(--color-text-muted)]">
                          Terima pengingat kunjungan & status order
                        </p>
                      </div>
                      <input
                        type="checkbox"
                        checked={notifToggle}
                        onChange={(e) => setNotifToggle(e.target.checked)}
                        className="h-4 w-4 accent-[#348CB2]"
                      />
                    </div>

                    <div className="flex items-center justify-between rounded-xl border border-[var(--color-border)] p-3.5">
                      <div>
                        <p className="font-semibold">
                          Izin Lokasi & GPS (Wajib Aktif Saat Shift)
                        </p>
                        <p className="text-xs text-[var(--color-text-muted)]">
                          Tracking hanya aktif saat sesi kerja berlangsung
                        </p>
                      </div>
                      <input
                        type="checkbox"
                        checked={gpsEnabled}
                        onChange={(e) => setGpsEnabled(e.target.checked)}
                        className="h-4 w-4 accent-[#348CB2]"
                      />
                    </div>

                    <div className="flex items-center justify-between rounded-xl border border-[var(--color-border)] p-3.5">
                      <div>
                        <p className="font-semibold">Sinkronisasi Otomatis</p>
                        <p className="text-xs text-[var(--color-text-muted)]">
                          Kirim antrean offline saat jaringan tersedia
                        </p>
                      </div>
                      <input
                        type="checkbox"
                        checked={autoSyncToggle}
                        onChange={(e) => setAutoSyncToggle(e.target.checked)}
                        className="h-4 w-4 accent-[#348CB2]"
                      />
                    </div>

                    <div className="flex items-center justify-between rounded-xl border border-[var(--color-border)] p-3.5">
                      <div>
                        <p className="font-semibold">Tema Antarmuka</p>
                        <p className="text-xs text-[var(--color-text-muted)]">
                          Saat ini: {theme === 'light' ? 'Mode Terang' : 'Mode Gelap'}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={toggleTheme}
                        className="rounded-lg border border-[var(--color-border-strong)] px-3 py-1.5 text-xs font-semibold cursor-pointer"
                      >
                        Ganti ke {theme === 'light' ? 'Gelap' : 'Terang'}
                      </button>
                    </div>

                    {/* Additional Screen 16 & Mobile 23 Interactive Rows */}
                    <button
                      type="button"
                      onClick={() => {
                        setSection('aktivitas');
                        setAktivitasTab('gps');
                      }}
                      className="w-full flex items-center justify-between rounded-xl border border-[var(--color-border)] p-3.5 text-left hover:border-[#348CB2] cursor-pointer"
                    >
                      <div className="flex items-center gap-3">
                        <MapPin className="h-4 w-4 text-[#348CB2]" />
                        <div>
                          <p className="font-semibold">Aktivitas & Riwayat GPS</p>
                          <p className="text-xs text-[var(--color-text-muted)]">
                            Lihat peta pergerakan & timeline check-in
                          </p>
                        </div>
                      </div>
                      <ChevronRight className="h-4 w-4 text-[var(--color-text-muted)]" />
                    </button>

                    <button
                      type="button"
                      onClick={() => setAccountModalMode('account')}
                      className="w-full flex items-center justify-between rounded-xl border border-[var(--color-border)] p-3.5 text-left hover:border-[#348CB2] cursor-pointer"
                    >
                      <div className="flex items-center gap-3">
                        <Settings className="h-4 w-4 text-[#348CB2]" />
                        <div>
                          <p className="font-semibold">Pengaturan Akun</p>
                          <p className="text-xs text-[var(--color-text-muted)]">
                            Nama, nomor WhatsApp, & area operasional
                          </p>
                        </div>
                      </div>
                      <ChevronRight className="h-4 w-4 text-[var(--color-text-muted)]" />
                    </button>

                    <button
                      type="button"
                      onClick={() => setAccountModalMode('security')}
                      className="w-full flex items-center justify-between rounded-xl border border-[var(--color-border)] p-3.5 text-left hover:border-[#348CB2] cursor-pointer"
                    >
                      <div className="flex items-center gap-3">
                        <Lock className="h-4 w-4 text-[#348CB2]" />
                        <div>
                          <p className="font-semibold">Keamanan (PIN & Biometrik)</p>
                          <p className="text-xs text-[var(--color-text-muted)]">
                            Ubah kata sandi, PIN portal, & biometrik
                          </p>
                        </div>
                      </div>
                      <ChevronRight className="h-4 w-4 text-[var(--color-text-muted)]" />
                    </button>

                    <button
                      type="button"
                      onClick={() => setTelegramModalOpen(true)}
                      className="w-full flex items-center justify-between rounded-xl border border-[var(--color-border)] p-3.5 text-left hover:border-[#348CB2] cursor-pointer"
                    >
                      <div className="flex items-center gap-3">
                        <MessageSquare className="h-4 w-4 text-[#348CB2]" />
                        <div>
                          <p className="font-semibold">Telegram Assistant Bot</p>
                          <p className="text-xs text-[var(--color-text-muted)]">
                            {telegramLinked ? 'Terhubung (@SalesXAi_FieldBot)' : 'Hubungkan akun untuk perintah cepat'}
                          </p>
                        </div>
                      </div>
                      <ChevronRight className="h-4 w-4 text-[var(--color-text-muted)]" />
                    </button>

                    <div className="grid sm:grid-cols-2 gap-2.5">
                      <button
                        type="button"
                        onClick={() => {
                          setOfflineDownloaded(true);
                          showToast('Katalog SKU, daftar outlet, & promo berhasil disimpan offline.');
                        }}
                        className="flex items-center justify-between rounded-xl border border-[var(--color-border)] p-3.5 text-left hover:border-[#348CB2] cursor-pointer"
                      >
                        <div className="flex items-center gap-3">
                          <HardDriveDownload className="h-4 w-4 text-[#348CB2]" />
                          <div>
                            <p className="font-semibold">Unduh Data Offline</p>
                            <p className="text-xs text-[var(--color-text-muted)]">
                              {offlineDownloaded ? 'Tersimpan di perangkat' : 'Katalog, outlet, dan promo'}
                            </p>
                          </div>
                        </div>
                        <ChevronRight className="h-4 w-4 text-[var(--color-text-muted)]" />
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setCacheSizeLabel('0 MB');
                          showToast('Cache aplikasi berhasil dibersihkan.');
                        }}
                        className="flex items-center justify-between rounded-xl border border-[var(--color-border)] p-3.5 text-left hover:border-[#348CB2] cursor-pointer"
                      >
                        <div className="flex items-center gap-3">
                          <Trash2 className="h-4 w-4 text-[#F97316]" />
                          <div>
                            <p className="font-semibold">Bersihkan Cache</p>
                            <p className="text-xs text-[var(--color-text-muted)] tabular-nums">
                              Ukuran: {cacheSizeLabel}
                            </p>
                          </div>
                        </div>
                        <ChevronRight className="h-4 w-4 text-[var(--color-text-muted)]" />
                      </button>
                    </div>

                    <div className="grid sm:grid-cols-2 gap-2.5">
                      <button
                        type="button"
                        onClick={() => setAccountModalMode('help')}
                        className="flex items-center justify-between rounded-xl border border-[var(--color-border)] p-3.5 text-left hover:border-[#348CB2] cursor-pointer"
                      >
                        <div className="flex items-center gap-3">
                          <HelpCircle className="h-4 w-4 text-[#348CB2]" />
                          <span className="font-semibold">Bantuan & Dukungan</span>
                        </div>
                        <ChevronRight className="h-4 w-4 text-[var(--color-text-muted)]" />
                      </button>

                      <button
                        type="button"
                        onClick={() => setAccountModalMode('about')}
                        className="flex items-center justify-between rounded-xl border border-[var(--color-border)] p-3.5 text-left hover:border-[#348CB2] cursor-pointer"
                      >
                        <div className="flex items-center gap-3">
                          <Info className="h-4 w-4 text-[#348CB2]" />
                          <span className="font-semibold">Tentang SalesX-Ai</span>
                        </div>
                        <ChevronRight className="h-4 w-4 text-[var(--color-text-muted)]" />
                      </button>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-[var(--color-border)] text-xs text-[var(--color-text-muted)]">
                    <span className="inline-flex items-center gap-1.5">
                      <ShieldCheck className="h-4 w-4 text-[#348CB2]" />
                      <span>Versi Aplikasi PWA v1.0.0 (Expo Ready)</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => setLogoutModalOpen(true)}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-red-200 dark:border-red-900/60 px-4 py-2 text-xs font-bold text-red-600 dark:text-red-400 hover:bg-red-50 cursor-pointer"
                    >
                      <LogOut className="h-3.5 w-3.5" />
                      <span>Keluar</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </main>
      </div>

      {/* Mobile Bottom Navigation (5 Tabs matching UI/UX Image 3 & 4) */}
      <nav
        aria-label="Navigasi Portal Sales Mobile"
        className="lg:hidden fixed bottom-0 inset-x-0 z-30 h-16 border-t border-[var(--color-border)] bg-[var(--color-surface)]/95 backdrop-blur-md grid grid-cols-5"
      >
        {[
          { id: 'beranda' as const, label: 'Beranda', icon: Home },
          { id: 'outlet' as const, label: 'Outlet', icon: Store },
          { id: 'order' as const, label: 'Order', icon: ShoppingCart },
          { id: 'aktivitas' as const, label: 'Aktivitas', icon: MapPin },
          { id: 'lainnya' as const, label: 'Lainnya', icon: Menu },
        ].map((tab) => {
          const Icon = tab.icon;
          const active = section === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => {
                setSection(tab.id);
                if (tab.id === 'lainnya') setLainnyaTab('menu');
              }}
              className={`flex flex-col items-center justify-center gap-1 text-[11px] font-semibold cursor-pointer ${
                active
                  ? 'text-[#348CB2] dark:text-[#87CEEB]'
                  : 'text-[var(--color-text-muted)]'
              }`}
            >
              <Icon className="h-5 w-5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Shared Modals */}
      <OutletDetailModal
        outlet={detailOutlet}
        orders={orders}
        visits={visits}
        onClose={() => setDetailOutlet(null)}
        onStartVisit={(outlet) => {
          const matchedVisit =
            visits.find((v) => v.outletId === outlet.id) || visits[1];
          setDetailOutlet(null);
          setEvidenceVisit(matchedVisit);
        }}
        onCreateOrder={(outlet) => {
          setSelectedOrderOutletId(outlet.id);
          setDetailOutlet(null);
          setSection('order');
          setOrderTab('create');
        }}
        onOpenWorkspace={() => {
          setSection('lainnya');
          setLainnyaTab('workspace');
        }}
      />

      <VisitEvidenceModal
        visit={evidenceVisit}
        onClose={() => setEvidenceVisit(null)}
        onSubmitEvidence={handleSubmitEvidence}
      />

      <OrderDetailModal
        order={detailOrder}
        onClose={() => setDetailOrder(null)}
        onOpenWorkspace={() => {
          setSection('lainnya');
          setLainnyaTab('workspace');
        }}
      />

      <RouteReplayModal
        open={routeModalOpen}
        onClose={() => setRouteModalOpen(false)}
        currentPos={currentPos}
        outlets={outlets}
        selectedOutlet={mapSelectedOutlet}
        onSelectOutlet={(o) => setMapSelectedOutlet(o)}
      />

      <NavigationPreviewModal
        visit={navigationVisit}
        currentPos={currentPos}
        outlets={outlets}
        onClose={() => setNavigationVisit(null)}
        onOpenEvidence={(v) => setEvidenceVisit(v)}
      />

      <SmartRewardModal
        open={smartRewardOpen}
        onClose={() => setSmartRewardOpen(false)}
        pointsBalance={rewardPoints}
        catalog={INITIAL_REWARD_CATALOG}
        ledger={rewardLedger}
        onRedeem={handleRedeemReward}
      />

      <ProductDetailModal
        product={detailProduct}
        onClose={() => setDetailProduct(null)}
        onAddToOrder={(sku) => {
          updateCartQty(sku, 5);
          showToast('5 unit produk ditambahkan ke keranjang order.');
        }}
      />

      <PromoDetailModal
        promo={detailPromo}
        onClose={() => setDetailPromo(null)}
        onApplyToOrder={(sku) => {
          if (sku) updateCartQty(sku, 5);
          setOrderTab('create');
          showToast('Promo diterapkan ke keranjang Buat Order.');
        }}
      />

      <VisitHistoryDetailModal
        visit={historyDetailVisit}
        onClose={() => setHistoryDetailVisit(null)}
      />

      <TelegramBotModal
        open={telegramModalOpen}
        onClose={() => setTelegramModalOpen(false)}
        linked={telegramLinked}
        onToggleLink={(next) => {
          setTelegramLinked(next);
          showToast(
            next
              ? 'Telegram Assistant Bot berhasil ditautkan.'
              : 'Tautan Telegram Assistant Bot diputuskan.'
          );
        }}
      />

      <PortalAccountModal
        mode={accountModalMode}
        onClose={() => setAccountModalMode(null)}
        onToast={showToast}
      />

      {/* Filter Outlet Lanjutan Modal */}
      <Modal
        open={outletFilterModalOpen}
        onClose={() => setOutletFilterModalOpen(false)}
        title="Filter Outlet Binaan"
        subtitle="Saring daftar outlet berdasarkan wilayah kota dan kategori toko"
        maxWidthClass="max-w-md"
      >
        <div className="space-y-4 text-xs">
          <div>
            <label className="block font-bold mb-1.5">Kota / Wilayah</label>
            <select
              value={outletCityFilter}
              onChange={(e) => setOutletCityFilter(e.target.value)}
              className="w-full rounded-xl border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-3 py-2.5 font-semibold"
            >
              <option value="Semua">Semua Wilayah</option>
              <option value="Kota Bogor">Kota Bogor</option>
              <option value="Kab. Bogor">Kab. Bogor</option>
              <option value="Kota Depok">Kota Depok</option>
            </select>
          </div>
          <div>
            <label className="block font-bold mb-1.5">Kategori Outlet</label>
            <select
              value={outletCategoryFilter}
              onChange={(e) => setOutletCategoryFilter(e.target.value)}
              className="w-full rounded-xl border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-3 py-2.5 font-semibold"
            >
              <option value="Semua">Semua Kategori</option>
              <option value="General Trade">General Trade</option>
              <option value="Modern Trade">Modern Trade</option>
              <option value="Minimarket">Minimarket</option>
            </select>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => {
                setOutletCityFilter('Semua');
                setOutletCategoryFilter('Semua');
              }}
              className="rounded-xl border border-[var(--color-border)] px-3.5 py-2 font-semibold cursor-pointer"
            >
              Reset
            </button>
            <button
              type="button"
              onClick={() => setOutletFilterModalOpen(false)}
              className="rounded-xl bg-[#348CB2] px-4 py-2 font-bold text-white cursor-pointer"
            >
              Terapkan Filter
            </button>
          </div>
        </div>
      </Modal>

      {/* Filter Riwayat Order Modal */}
      <Modal
        open={orderFilterModalOpen}
        onClose={() => setOrderFilterModalOpen(false)}
        title="Filter Riwayat Order"
        subtitle="Pilih status transaksi untuk ditampilkan pada daftar order"
        maxWidthClass="max-w-sm"
      >
        <div className="space-y-3 text-xs">
          <div className="grid grid-cols-2 gap-2">
            {['Semua', 'Diproses', 'Selesai', 'Batal'].map((st) => (
              <button
                key={st}
                type="button"
                onClick={() => {
                  setOrderStatusFilter(st);
                  setOrderFilterModalOpen(false);
                }}
                className={`rounded-xl border py-2.5 font-bold cursor-pointer ${
                  orderStatusFilter === st
                    ? 'border-[#348CB2] bg-[#E5F4F8] text-[#123A54]'
                    : 'border-[var(--color-border)] bg-[var(--color-surface)]'
                }`}
              >
                {st}
              </button>
            ))}
          </div>
        </div>
      </Modal>

      {/* Pilih / Ubah Outlet Modal (Screen Buat Order) */}
      <Modal
        open={changeOutletModalOpen}
        onClose={() => setChangeOutletModalOpen(false)}
        title="Pilih Outlet Tujuan Order"
        subtitle="Pilih outlet binaan aktif untuk transaksi SmartOrder"
        maxWidthClass="max-w-md"
      >
        <div className="space-y-2 max-h-80 overflow-y-auto text-xs">
          {outlets.map((o) => (
            <button
              key={o.id}
              type="button"
              onClick={() => {
                setSelectedOrderOutletId(o.id);
                setChangeOutletModalOpen(false);
              }}
              className={`w-full flex items-center justify-between rounded-xl border p-3 text-left cursor-pointer ${
                selectedOrderOutletId === o.id
                  ? 'border-[#348CB2] bg-[#F3FAFC] dark:bg-[#172438]'
                  : 'border-[var(--color-border)] bg-[var(--color-surface)]'
              }`}
            >
              <div>
                <p className="font-bold text-sm text-[var(--color-text-primary)]">
                  {o.name}
                </p>
                <p className="text-[var(--color-text-muted)]">
                  {o.address}, {o.city}
                </p>
              </div>
              <span className="font-semibold text-[#348CB2] tabular-nums">
                {o.distanceKm} km
              </span>
            </button>
          ))}
        </div>
      </Modal>

      {/* Tambah Outlet ke Visit Planner Modal */}
      <Modal
        open={addVisitModalOpen}
        onClose={() => setAddVisitModalOpen(false)}
        title="Tambah Outlet ke Visit Planner"
        subtitle={`Jadwal rencana tanggal ${plannerDate}`}
        maxWidthClass="max-w-md"
      >
        <div className="space-y-2 max-h-80 overflow-y-auto text-xs">
          {outlets.map((o) => {
            const alreadyInToday = visits.some(
              (v) => v.outletId === o.id && v.dateKey === 'today'
            );
            return (
              <div
                key={o.id}
                className="flex items-center justify-between rounded-xl border border-[var(--color-border)] p-3"
              >
                <div>
                  <p className="font-bold text-sm text-[var(--color-text-primary)]">
                    {o.name}
                  </p>
                  <p className="text-[var(--color-text-muted)]">
                    {o.address}, {o.city}
                  </p>
                </div>
                <button
                  type="button"
                  disabled={alreadyInToday}
                  onClick={() => {
                    setVisits((prev) => [
                      ...prev,
                      {
                        id: `vis-${Date.now()}`,
                        outletId: o.id,
                        outletName: o.name,
                        address: o.address,
                        city: o.city,
                        timeRange: '15:00 – 15:45',
                        status: 'Menunggu',
                        isPriority: o.isPriority,
                        dateKey: 'today',
                        lat: o.lat,
                        lng: o.lng,
                      },
                    ]);
                    setAddVisitModalOpen(false);
                    showToast(`${o.name} ditambahkan ke Visit Planner.`);
                  }}
                  className="rounded-lg bg-[#348CB2] disabled:opacity-40 px-3 py-1.5 font-bold text-white cursor-pointer"
                >
                  {alreadyInToday ? 'Terjadwal' : '+ Tambah'}
                </button>
              </div>
            );
          })}
        </div>
      </Modal>

      {/* Sesi Kerja / Mulai Shift Modal (Mobile Screen 3) */}
      <Modal
        open={shiftModalOpen}
        onClose={() => setShiftModalOpen(false)}
        title="Manajemen Sesi Kerja & GPS"
        subtitle={`Jadwal Shift: ${SALES_REP_PROFILE.shiftSchedule}`}
        maxWidthClass="max-w-md"
      >
        <div className="space-y-4 text-xs">
          <div className="rounded-xl border border-[#ADD8E6] bg-[#F3FAFC] dark:bg-[#172438] p-4 space-y-2">
            <div className="flex justify-between">
              <span className="text-[var(--color-text-secondary)]">Status Sesi</span>
              <span className={`font-bold ${shiftActive ? 'text-emerald-600' : 'text-[#F97316]'}`}>
                {shiftActive ? `Aktif (Mulai ${shiftStartTime})` : 'Standby'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-[var(--color-text-secondary)]">Geofence Kantor</span>
              <span className="font-bold">
                {SALES_REP_PROFILE.officeName} (Radius {SALES_REP_PROFILE.geofenceRadiusM}m)
              </span>
            </div>
          </div>
          <p className="text-[var(--color-text-secondary)]">
            Pelacakan lokasi GPS hanya aktif selama sesi kerja lapangan berlangsung dan berhenti otomatis saat Anda mengakhiri shift.
          </p>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setShiftModalOpen(false)}
              className="rounded-xl border border-[var(--color-border)] px-4 py-2 font-semibold cursor-pointer"
            >
              Tutup
            </button>
            <button
              type="button"
              onClick={() => {
                const next = !shiftActive;
                setShiftActive(next);
                if (next) {
                  const now = new Date();
                  const lbl = `${String(now.getHours()).padStart(2, '0')}:${String(
                    now.getMinutes()
                  ).padStart(2, '0')} WIB`;
                  setShiftStartTime(lbl);
                }
                setShiftModalOpen(false);
                showToast(
                  next
                    ? 'Sesi kerja dimulai & GPS aktif.'
                    : 'Sesi kerja diakhiri & tracking GPS dijeda.'
                );
              }}
              className={`rounded-xl px-4 py-2 font-bold text-white cursor-pointer ${
                shiftActive ? 'bg-[#F97316] hover:bg-[#EA580C]' : 'bg-[#348CB2] hover:bg-[#236D91]'
              }`}
            >
              {shiftActive ? 'Akhiri Sesi Kerja' : 'Mulai Sesi Kerja'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Konfirmasi Keluar Akun Modal */}
      <Modal
        open={logoutModalOpen}
        onClose={() => setLogoutModalOpen(false)}
        title="Keluar dari Sales Portal?"
        subtitle="Pastikan seluruh antrean order dan bukti kunjungan telah tersinkron"
        maxWidthClass="max-w-sm"
      >
        <div className="space-y-4 text-xs">
          <p className="text-[var(--color-text-secondary)]">
            Anda akan keluar dari sesi {SALES_REP_PROFILE.name} ({SALES_REP_PROFILE.area}).
          </p>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setLogoutModalOpen(false)}
              className="rounded-xl border border-[var(--color-border)] px-4 py-2 font-semibold cursor-pointer"
            >
              Batal
            </button>
            <button
              type="button"
              onClick={() => {
                setLogoutModalOpen(false);
                setAuthenticated(false);
              }}
              className="rounded-xl bg-red-600 hover:bg-red-700 px-4 py-2 font-bold text-white cursor-pointer"
            >
              Ya, Keluar Sekarang
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
