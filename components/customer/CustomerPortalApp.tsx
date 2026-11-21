'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  Home,
  LayoutGrid,
  ShoppingCart,
  ShoppingBag,
  Gift,
  Menu,
  User,
  Bell,
  Search,
  SlidersHorizontal,
  Heart,
  Plus,
  Minus,
  Trash2,
  MapPin,
  Calendar,
  Send,
  ChevronRight,
  ChevronLeft,
  ArrowLeft,
  CheckCircle2,
  XCircle,
  Clock,
  Tag,
  Percent,
  Star,
  HelpCircle,
  Settings,
  Info,
  LogOut,
  Mail,
  Lock,
  Eye,
  EyeOff,
  Sun,
  Moon,
  X,
  Truck,
  Package,
  FileSpreadsheet,
  RefreshCw,
  Ticket,
} from 'lucide-react';
import { BrandLogo } from '@/components/common/BrandLogo';
import { Modal } from '@/components/common/Modal';
import { PWAInstallButton } from '@/components/common/PWAInstallButton';
import { useSalesXAuth } from '@/components/providers/AppProviders';
import { SmartRewardWorkspace } from '@/components/smart-reward/SmartRewardWorkspace';
import { PortalSignupAction } from '@/components/auth/PortalSignupAction';
import {
  CUSTOMER_OUTLET_PROFILE,
  CUSTOMER_CONTRACT_PRICES,
  CUSTOMER_INITIAL_CART,
  CUSTOMER_INITIAL_ORDERS,
  CUSTOMER_NOTIFICATIONS,
  INITIAL_PRODUCTS,
  INITIAL_PROMOTIONS,
  formatRupiah,
  type Product,
  type PromotionItem,
  type NotificationItem,
  type CustomerCartItem,
  type CustomerOrderRecord,
  type CustomerContractPrice,
  type Outlet,
} from '@/lib/salesx-data';
import {
  CreateCustomerAccountModal,
  ContractPriceModal,
  CustomerPromoDetailModal,
  DeliveryAddressModal,
  CustomerOrderDetailModal,
  CustomerSupportModal,
  CustomerWorkspaceModal,
  CustomerNotificationsModal,
  OrderSuccessModal,
  CancelCustomerOrderModal,
  CustomerAccountSettingsModal,
} from '@/components/customer/CustomerModals';

export type CustomerTabId =
  | 'dashboard'
  | 'catalog'
  | 'product_detail'
  | 'pricing'
  | 'promo'
  | 'cart'
  | 'checkout'
  | 'order_status'
  | 'reward'
  | 'more';

export function CustomerPortalApp() {
  const auth = useSalesXAuth();
  const visiblePortalSwitchLinks = [
    {href:"/company",label:"Company",portal:"company"},
    {href:"/portal",label:"Sales Portal",portal:"sales"},
    {href:"/distributor",label:"Distributor",portal:"distributor"},
    {href:"/principal",label:"Principal",portal:"principal"},
    {href:"/supervisor",label:"Supervisor",portal:"supervisor"},
    {href:"/super-admin",label:"Super Admin",portal:"super_admin"},
  ] as const;
  // Screen 1 (Splash) -> Screen 2 (Login) -> Authenticated
  const [authStage, setAuthStage] = useState<'splash' | 'login' | 'app'>(
    'splash'
  );
  useEffect(() => {
    if (auth.status === 'authenticated') setAuthStage('app');
    else if (auth.status === 'unauthenticated' && authStage === 'app') setAuthStage('login');
  }, [auth.status, authStage]);

  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [loginId, setLoginId] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [wsLoading, setWsLoading] = useState(false);
  const [createAccountOpen, setCreateAccountOpen] = useState(false);
  const [forgotModalOpen, setForgotModalOpen] = useState(false);
  const [forgotSent, setForgotSent] = useState(false);

  // Active Screen / Navigation
  const [activeTab, setActiveTab] = useState<CustomerTabId>('dashboard');
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);

  // Customer Profile & Address
  const [outletName, setOutletName] = useState(CUSTOMER_OUTLET_PROFILE.name);
  const [picName, setPicName] = useState(CUSTOMER_OUTLET_PROFILE.picName);
  const [outletPhone, setOutletPhone] = useState(CUSTOMER_OUTLET_PROFILE.phone);
  const [outletAddress, setOutletAddress] = useState(
    CUSTOMER_OUTLET_PROFILE.address
  );
  const [outletEmail, setOutletEmail] = useState(CUSTOMER_OUTLET_PROFILE.email);

  // Dashboard carousel
  const [promoSlideIdx, setPromoSlideIdx] = useState(0);

  // Catalog & Product Detail
  const [catalogSearch, setCatalogSearch] = useState('');
  const [catalogCategory, setCatalogCategory] = useState<
    'Semua' | Product['category']
  >('Semua');
  const [catalogTag, setCatalogTag] = useState<
    'Semua' | 'Best Seller' | 'Promo' | 'Baru'
  >('Semua');
  const [selectedProduct, setSelectedProduct] = useState<Product>(
    INITIAL_PRODUCTS[0]
  );
  const [detailQty, setDetailQty] = useState(1);
  const [favoriteSkus, setFavoriteSkus] = useState<string[]>(['SX-MNM-001']);
  const [filterModalOpen, setFilterModalOpen] = useState(false);

  // Pricing
  const [pricingTab, setPricingTab] = useState<'Harga Saya' | 'Price List'>(
    'Harga Saya'
  );
  const [pricingSearch, setPricingSearch] = useState('');
  const [selectedContractPrice, setSelectedContractPrice] =
    useState<CustomerContractPrice | null>(null);

  // Promo & Vouchers
  const [selectedPromo, setSelectedPromo] = useState<PromotionItem | null>(
    null
  );
  const [appliedPromoTitle, setAppliedPromoTitle] = useState<string | null>(
    'Diskon 20% Minuman Energi'
  );

  // Cart & Checkout
  const [cart, setCart] = useState<CustomerCartItem[]>(CUSTOMER_INITIAL_CART);
  const [deliveryDate, setDeliveryDate] = useState('2026-10-27');
  const [orderNotes, setOrderNotes] = useState('');
  const [addressModalOpen, setAddressModalOpen] = useState(false);
  const [submittingOrder, setSubmittingOrder] = useState(false);
  const [orderSuccessResult, setOrderSuccessResult] = useState<{
    orderId: string;
    total: number;
    deliveryDate: string;
  } | null>(null);

  // Orders
  const [orders, setOrders] = useState<CustomerOrderRecord[]>(
    CUSTOMER_INITIAL_ORDERS
  );
  const [activeOrderId, setActiveOrderId] = useState(
    CUSTOMER_INITIAL_ORDERS[0].id
  );
  const [orderFilterStatus, setOrderFilterStatus] = useState<
    'Semua' | 'Proses' | 'Selesai' | 'Batal'
  >('Semua');
  const [orderSearchQuery, setOrderSearchQuery] = useState('');
  const [orderDetailModal, setOrderDetailModal] =
    useState<CustomerOrderRecord | null>(null);
  const [cancelOrderModal, setCancelOrderModal] =
    useState<CustomerOrderRecord | null>(null);

  // More / Support / Profile / Workspace / Settings
  const [notifications, setNotifications] = useState<NotificationItem[]>(
    CUSTOMER_NOTIFICATIONS
  );
  const [notifPrefs, setNotifPrefs] = useState({
    orderUpdates: true,
    promoAlerts: true,
    rewardReminders: true,
  });
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [supportModalOpen, setSupportModalOpen] = useState(false);
  const [workspaceModalOpen, setWorkspaceModalOpen] = useState(false);
  const [profileEditModalOpen, setProfileEditModalOpen] = useState(false);
  const [accountSettingsOpen, setAccountSettingsOpen] = useState(false);
  const [aboutModalOpen, setAboutModalOpen] = useState(false);
  const [logoutConfirmOpen, setLogoutConfirmOpen] = useState(false);
  const [toastNotice, setToastNotice] = useState<string | null>(null);

  const triggerToast = (msg: string) => {
    setToastNotice(msg);
    setTimeout(() => setToastNotice(null), 3200);
  };

  const toggleTheme = () => {
    const next = theme === 'light' ? 'dark' : 'light';
    setTheme(next);
    if (typeof document !== 'undefined') {
      document.documentElement.classList.toggle('dark', next === 'dark');
    }
  };

  const unreadCount = useMemo(
    () => notifications.filter((n) => !n.read).length,
    [notifications]
  );

  // Deterministic Cart Totals
  const selectedCartItems = useMemo(
    () => cart.filter((c) => c.selected),
    [cart]
  );
  const cartSubtotal = useMemo(
    () =>
      selectedCartItems.reduce((sum, item) => sum + item.unitPrice * item.qty, 0),
    [selectedCartItems]
  );
  const cartPromoDiscount = useMemo(() => {
    if (!appliedPromoTitle || cartSubtotal === 0) return 0;
    return Math.round(cartSubtotal * 0.1);
  }, [appliedPromoTitle, cartSubtotal]);

  // Reward vouchers are not applied as checkout discounts until the FastAPI
  // order contract supports an authoritative reward-redemption reference.
  const cartTotalDiscount = Math.min(cartSubtotal, cartPromoDiscount);
  const cartGrandTotal = Math.max(0, cartSubtotal - cartTotalDiscount);

  const addToCart = (product: Product, qty = 1) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.sku === product.sku);
      if (existing) {
        return prev.map((i) =>
          i.sku === product.sku
            ? { ...i, qty: i.qty + qty, selected: true }
            : i
        );
      }
      return [
        ...prev,
        {
          sku: product.sku,
          name: product.name,
          unit: product.unit,
          unitPrice: product.price,
          qty,
          selected: true,
          accentHex: product.accentHex,
        },
      ];
    });
    triggerToast(`${product.name} (${qty} ${product.unit}) masuk keranjang.`);
  };

  const addBySkuToCart = (sku: string, qty: number) => {
    const prod =
      INITIAL_PRODUCTS.find((p) => p.sku === sku) || INITIAL_PRODUCTS[0];
    addToCart(prod, qty);
  };

  const reorderToCart = (order: CustomerOrderRecord) => {
    setCart((prev) => {
      const next = [...prev];
      for (const it of order.items) {
        const prod = INITIAL_PRODUCTS.find((p) => p.sku === it.sku);
        const existingIdx = next.findIndex((c) => c.sku === it.sku);
        if (existingIdx >= 0) {
          next[existingIdx] = {
            ...next[existingIdx],
            qty: next[existingIdx].qty + it.qty,
            selected: true,
          };
        } else {
          next.push({
            sku: it.sku,
            name: it.name,
            unit: prod?.unit || 'pcs',
            unitPrice: it.unitPrice,
            qty: it.qty,
            selected: true,
            accentHex: prod?.accentHex || '#348CB2',
          });
        }
      }
      return next;
    });
    triggerToast(`${order.items.length} produk dari ${order.id} ditambahkan ke keranjang.`);
    setActiveTab('cart');
  };

  const handleCheckoutSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (submittingOrder || selectedCartItems.length === 0) return;
    setSubmittingOrder(true);

    const newId = `ORD-20261024-${String(orders.length + 1).padStart(3, '0')}`;
    const createdOrder: CustomerOrderRecord = {
      id: newId,
      dateLabel: 'Baru saja',
      deliveryDate,
      status: 'Diproses',
      items: selectedCartItems.map((c) => ({
        sku: c.sku,
        name: c.name,
        unitPrice: c.unitPrice,
        qty: c.qty,
      })),
      subtotal: cartSubtotal,
      promoDiscount: cartTotalDiscount,
      total: cartGrandTotal,
      notes: orderNotes.trim() || undefined,
      address: outletAddress,
      timeline: [
        { title: 'Order dibuat', timestamp: 'Baru saja', completed: true },
        {
          title: 'Sedang diproses distributor',
          timestamp: 'Menunggu konfirmasi gudang',
          completed: true,
        },
      ],
    };

    setOrders((prev) => [createdOrder, ...prev]);
    setActiveOrderId(newId);
    setCart((prev) => prev.filter((item) => !item.selected));
    setOrderNotes('');
    setSubmittingOrder(false);
    setOrderSuccessResult({
      orderId: newId,
      total: cartGrandTotal,
      deliveryDate,
    });
  };

  const activeOrder =
    orders.find((o) => o.id === activeOrderId) || orders[0];

  const dashboardPromos = INITIAL_PROMOTIONS.slice(0, 3);
  const currentPromoSlide =
    dashboardPromos[promoSlideIdx % dashboardPromos.length];

  const filteredCatalogProducts = useMemo(() => {
    const q = catalogSearch.trim().toLowerCase();
    return INITIAL_PRODUCTS.filter(
      (p) =>
        (catalogCategory === 'Semua' || p.category === catalogCategory) &&
        (catalogTag === 'Semua' || p.tag === catalogTag) &&
        (!q ||
          p.name.toLowerCase().includes(q) ||
          p.sku.toLowerCase().includes(q) ||
          p.category.toLowerCase().includes(q))
    );
  }, [catalogCategory, catalogTag, catalogSearch]);

  const filteredOrders = useMemo(() => {
    const q = orderSearchQuery.trim().toLowerCase();
    return orders.filter((o) => {
      const matchesStatus =
        orderFilterStatus === 'Semua' ||
        (orderFilterStatus === 'Proses' &&
          (o.status === 'Dibuat' ||
            o.status === 'Diproses' ||
            o.status === 'Dikirim')) ||
        o.status === orderFilterStatus;
      const matchesQuery =
        !q ||
        o.id.toLowerCase().includes(q) ||
        o.items.some((it) => it.name.toLowerCase().includes(q));
      return matchesStatus && matchesQuery;
    });
  }, [orders, orderFilterStatus, orderSearchQuery]);

  const outletObjForWorkspace: Outlet = {
    id: CUSTOMER_OUTLET_PROFILE.id,
    name: outletName,
    city: CUSTOMER_OUTLET_PROFILE.city,
    address: outletAddress,
    distanceKm: 0,
    isPriority: true,
    visitToday: true,
    status: 'Aktif',
    category: 'General Trade',
    picName,
    phone: outletPhone,
    email: outletEmail,
    lat: CUSTOMER_OUTLET_PROFILE.lat,
    lng: CUSTOMER_OUTLET_PROFILE.lng,
    lastOrderTotal: CUSTOMER_OUTLET_PROFILE.monthlyOrderTotal,
    lastVisitDate: 'Hari ini',
  };

  /* ========================================================================
   * SCREEN 1: SPLASH / WELCOME
   * ======================================================================== */
  if (auth.status === 'authenticated' && !auth.canAccessPortal('customer')) {
    return <main className="flex min-h-screen items-center justify-center p-6"><section className="max-w-md rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 text-center"><h1 className="text-lg font-bold">Akses Customer Portal tidak tersedia</h1><p className="mt-2 text-sm text-[var(--color-text-secondary)]">Membership aktif tidak memiliki permission untuk Customer Portal.</p><button onClick={() => void auth.signOut('local')} className="mt-4 rounded-lg bg-[#236D91] px-4 py-2 text-white">Keluar</button></section></main>;
  }

  if (authStage === 'splash') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#E5F4F8] via-[#F3FAFC] to-[#FFFFFF] dark:from-[#0B1220] dark:via-[#111C2D] dark:to-[#0B1220] flex flex-col justify-between px-4 py-6 sm:px-6">
        <div className="mx-auto flex w-full max-w-md flex-wrap items-center justify-between gap-2">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-[#236D91] dark:text-[#87CEEB] hover:bg-white/70"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Beranda</span>
          </Link>
          <div className="flex flex-wrap items-center justify-end gap-x-2 gap-y-1 text-xs font-semibold">
            <Link href="/company" className="text-[#348CB2] hover:underline">
              Company
            </Link>
            <span className="text-[var(--color-text-muted)]">·</span>
            <Link href="/portal" className="text-[#348CB2] hover:underline">
              Sales
            </Link>
            <span className="text-[var(--color-text-muted)]">·</span>
            <Link href="/distributor" className="text-[#348CB2] hover:underline">
              Distributor
            </Link>
            <span className="text-[var(--color-text-muted)]">·</span>
            <Link href="/principal" className="text-[#348CB2] hover:underline">
              Principal
            </Link>
            <span className="text-[var(--color-text-muted)]">·</span>
            <Link href="/supervisor" className="text-[#348CB2] hover:underline">
              Supervisor
            </Link>
            <span className="text-[var(--color-text-muted)]">·</span>
            <Link href="/super-admin" className="text-[#194F70] dark:text-[#87CEEB] hover:underline">
              Super Admin
            </Link>
          </div>
        </div>

        <div className="mx-auto my-8 w-full max-w-md rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 sm:p-8 text-center shadow-lg">
          <div className="flex justify-center">
            <BrandLogo subtitle="CUSTOMER PORTAL" />
          </div>

          <h1 className="mt-8 text-2xl font-bold text-[#123A54] dark:text-white text-balance">
            Portal Pelanggan SalesX-Ai
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-[var(--color-text-secondary)]">
            Pesan produk, pantau pesanan, nikmati promo, dan dapatkan reward
            untuk outlet Anda.
          </p>

          {/* Pagination Dots */}
          <div className="mt-8 flex items-center justify-center gap-2">
            <span className="h-2 w-6 rounded-full bg-[#348CB2]" />
            <span className="h-2 w-2 rounded-full bg-[var(--color-border-strong)]" />
            <span className="h-2 w-2 rounded-full bg-[var(--color-border-strong)]" />
          </div>

          <button
            type="button"
            onClick={() => setAuthStage('login')}
            className="mt-7 w-full rounded-xl bg-[#236D91] hover:bg-[#194F70] py-3.5 text-sm font-bold text-white shadow-sm transition-colors cursor-pointer"
          >
            Mulai Sekarang
          </button>

          <p className="mt-4 text-xs text-[var(--color-text-secondary)]">
            Sudah punya akun?{' '}
            <button
              type="button"
              onClick={() => setAuthStage('login')}
              className="font-bold text-[#348CB2] hover:underline cursor-pointer"
            >
              Masuk
            </button>
          </p>
        </div>

        <p className="text-center text-xs text-[var(--color-text-muted)]">
          SalesX-Ai Customer B2B Portal · Outlet & Retail Partner
        </p>
      </div>
    );
  }

  /* ========================================================================
   * SCREEN 2: LOGIN / REGISTRASI
   * ======================================================================== */
  if (authStage === 'login') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#E5F4F8] via-[#F3FAFC] to-[#F8FAFC] dark:from-[#0B1220] dark:via-[#111C2D] dark:to-[#0B1220] flex flex-col justify-between px-4 py-6 sm:px-6">
        <div className="mx-auto flex w-full max-w-md items-center justify-between">
          <button
            type="button"
            onClick={() => setAuthStage('splash')}
            className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-[#236D91] dark:text-[#87CEEB] hover:bg-white/70 cursor-pointer"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Kembali</span>
          </button>
          <Link
            href="/"
            className="text-xs font-semibold text-[#348CB2] hover:underline"
          >
            Landing Page
          </Link>
        </div>

        <div className="mx-auto my-6 w-full max-w-md rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 sm:p-8 shadow-lg">
          <div className="flex flex-col items-center text-center">
            <BrandLogo subtitle="CUSTOMER PORTAL" />
            <h1 className="mt-5 text-xl font-bold text-[#123A54] dark:text-white">
              Masuk ke Customer Portal
            </h1>
          </div>

          {loginError && (
            <div className="mt-4 rounded-xl border border-red-200 bg-red-50 dark:border-red-900/50 dark:bg-red-950/40 px-3.5 py-2.5 text-xs text-red-700 dark:text-red-300">
              {loginError}
            </div>
          )}

          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!loginId.trim() || !loginPassword.trim()) {
                setLoginError('Masukkan Email / No. HP dan kata sandi.');
                return;
              }
              setLoginError(null);
              void auth.signInWithPassword(loginId, loginPassword)
                .then(() => setAuthStage('app'))
                .catch(err => setLoginError(err instanceof Error ? err.message : 'Login gagal.'));
            }}
            className="mt-6 space-y-4"
          >
            <div>
              <label className="block text-xs font-semibold mb-1.5">
                Email / No. HP
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--color-text-muted)]" />
                <input
                  type="text"
                  value={loginId}
                  onChange={(e) => setLoginId(e.target.value)}
                  className="w-full rounded-xl border border-[var(--color-border-strong)] bg-[var(--color-surface)] pl-10 pr-4 py-2.5 text-sm focus:border-[#348CB2] focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--color-text-muted)]" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  className="w-full rounded-xl border border-[var(--color-border-strong)] bg-[var(--color-surface)] pl-10 pr-10 py-2.5 text-sm focus:border-[#348CB2] focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((p) => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] cursor-pointer"
                  aria-label="Lihat atau sembunyikan kata sandi"
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs">
              <label className="inline-flex items-center gap-2 cursor-pointer text-[var(--color-text-secondary)]">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="h-4 w-4 rounded"
                />
                <span>Ingat saya</span>
              </label>
              <button
                type="button"
                onClick={() => {
                  setForgotSent(false);
                  setForgotModalOpen(true);
                }}
                className="font-semibold text-[#348CB2] hover:underline cursor-pointer"
              >
                Lupa password?
              </button>
            </div>

            <button
              type="submit"
              className="w-full rounded-xl bg-[#236D91] hover:bg-[#194F70] py-3 text-sm font-bold text-white shadow-sm cursor-pointer"
            >
              Masuk
            </button>
          
            <PortalSignupAction email={loginId} password={loginPassword} onMessage={setLoginError} />
</form>

          <div className="my-4 flex items-center gap-3 text-xs text-[var(--color-text-muted)]">
            <div className="h-px flex-1 bg-[var(--color-border)]" />
            <span>atau</span>
            <div className="h-px flex-1 bg-[var(--color-border)]" />
          </div>

          <div className="space-y-2.5">
            <button
              type="button"
              onClick={() => setCreateAccountOpen(true)}
              className="w-full rounded-xl border border-[#348CB2] bg-[var(--color-surface)] py-2.5 text-sm font-semibold text-[#236D91] dark:text-[#87CEEB] hover:bg-[#F3FAFC] dark:hover:bg-[#19394B] cursor-pointer"
            >
              Buat Akun Outlet
            </button>

            <button
              type="button"
              onClick={async () => {
                setWsLoading(true);
                setLoginError(null);
                try {
                  await auth.signInWithOAuth('google');
                } catch (err) {
                  setLoginError(
                    err instanceof Error
                      ? err.message
                      : 'Login Google Workspace dibatalkan.'
                  );
                } finally {
                  setWsLoading(false);
                }
              }}
              disabled={wsLoading}
              className="gsi-material-button w-full"
            >
              <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
                <path
                  fill="#4285F4"
                  d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17Z"
                />
                <path
                  fill="#34A853"
                  d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.11-6.72-4.96H1.29v3.14C3.26 21.3 7.31 24 12 24Z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.28 14.24c-.24-.72-.38-1.49-.38-2.24s.14-1.52.38-2.24V6.62H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.38l3.99-3.14Z"
                />
                <path
                  fill="#EA4335"
                  d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.62l3.99 3.14c.95-2.85 3.6-4.96 6.72-4.96Z"
                />
              </svg>
              <span>
                {wsLoading ? 'Menghubungkan...' : 'Masuk dengan Akun Google'}
              </span>
            </button>
          </div>
        </div>

        <p className="text-center text-xs text-[var(--color-text-muted)]">
          SalesX-Ai Customer Portal · Terhubung Langsung ke Distributor Resmi
        </p>

        <CreateCustomerAccountModal
          open={createAccountOpen}
          onClose={() => setCreateAccountOpen(false)}
          onSuccess={(newName, newEmail) => {
            setOutletName(newName);
            setOutletEmail(newEmail);
            setLoginId(newEmail);
          }}
        />

        <Modal
          open={forgotModalOpen}
          onClose={() => setForgotModalOpen(false)}
          title="Reset Kata Sandi Outlet"
          subtitle="Masukkan email atau No. WhatsApp outlet terdaftar"
          maxWidthClass="max-w-sm"
        >
          <div className="space-y-4 text-xs">
            <input
              type="text"
              value={loginId}
              onChange={(e) => setLoginId(e.target.value)}
              className="w-full rounded-xl border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-3.5 py-2.5"
            />
            {forgotSent ? (
              <p className="rounded-xl bg-[#ECFDF5] p-3 text-[#047857]">
                Tautan pemulihan telah dikirim ke <strong>{loginId}</strong>.
              </p>
            ) : (
              <button
                type="button"
                onClick={() => { if (!loginId.includes('@')) { setLoginError('Masukkan alamat email untuk pemulihan password.'); return; } void auth.requestPasswordReset(loginId).then(() => setForgotSent(true)).catch(err => setLoginError(err instanceof Error ? err.message : 'Permintaan reset gagal.')); }}
                className="w-full rounded-xl bg-[#348CB2] py-2.5 font-bold text-white cursor-pointer"
              >
                Kirim Tautan Pemulihan
              </button>
            )}
          </div>
        </Modal>
      </div>
    );
  }

  /* ========================================================================
   * AUTHENTICATED CUSTOMER PORTAL SHELL
   * ======================================================================== */
  const sidebarNavItems: Array<{
    id: CustomerTabId;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    badge?: number;
  }> = [
    { id: 'dashboard', label: 'Beranda', icon: Home },
    { id: 'catalog', label: 'Katalog Produk', icon: LayoutGrid },
    { id: 'pricing', label: 'Daftar Harga Outlet', icon: Percent },
    { id: 'promo', label: 'Promo & Campaign', icon: Tag },
    {
      id: 'cart',
      label: 'Keranjang',
      icon: ShoppingCart,
      badge: cart.length,
    },
    { id: 'order_status', label: 'Status Pesanan', icon: ShoppingBag },
    { id: 'reward', label: 'Reward & Loyalty', icon: Gift },
    { id: 'more', label: 'Profil & Lainnya', icon: User },
  ];

  return (
    <div className="min-h-screen overflow-x-hidden bg-[var(--color-background)] text-[var(--color-text-primary)] flex flex-col lg:flex-row">
      {/* Desktop Left Sidebar */}
      <aside className="hidden lg:flex lg:w-[250px] lg:shrink-0 lg:flex-col border-r border-[var(--color-border)] bg-[var(--color-surface)] sticky top-0 h-screen overflow-y-auto">
        <div className="flex h-16 items-center px-4 border-b border-[var(--color-border)] shrink-0">
          <Link href="/">
            <BrandLogo subtitle="CUSTOMER PORTAL" compact />
          </Link>
        </div>

        <div className="p-3.5 space-y-1 flex-1">
          {sidebarNavItems.map((item) => {
            const Icon = item.icon;
            const active =
              activeTab === item.id ||
              (item.id === 'catalog' && activeTab === 'product_detail') ||
              (item.id === 'cart' && activeTab === 'checkout');
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center justify-between rounded-xl px-3 py-2.5 text-xs font-semibold transition-colors cursor-pointer ${
                  active
                    ? 'bg-[#348CB2] text-white shadow-xs'
                    : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-muted)] hover:text-[var(--color-text-primary)]'
                }`}
              >
                <span className="flex items-center gap-2.5">
                  <Icon className="h-4 w-4 shrink-0" />
                  <span>{item.label}</span>
                </span>
                {item.badge !== undefined && item.badge > 0 && (
                  <span
                    className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold tabular-nums ${
                      active
                        ? 'bg-white text-[#348CB2]'
                        : 'bg-[#F97316] text-white'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
          {auth.canPerformApiAction("smartorder.catalog.products.read") && <Link href="/customer/smart-order" className="mt-2 flex items-center gap-2.5 rounded-xl border border-[var(--color-border)] px-3 py-2.5 text-xs font-semibold text-[var(--color-text-secondary)]"><ShoppingCart className="h-4 w-4"/>SmartOrder</Link>}
          {auth.canPerformApiAction("smartreward.catalog.read") && <Link href="/customer/smart-reward" className="mt-2 flex items-center gap-2.5 rounded-xl border border-[var(--color-border)] px-3 py-2.5 text-xs font-semibold text-[var(--color-text-secondary)]">SmartReward</Link>}
        </div>

        <div className="border-t border-[var(--color-border)] p-3.5 space-y-2 shrink-0">
          <div className="grid grid-cols-2 gap-1.5 text-[11px] font-semibold">
            {visiblePortalSwitchLinks.filter(item=>auth.canAccessPortal(item.portal)).map(item=>(
              <Link key={item.href} href={item.href} className="rounded-lg border border-[var(--color-border)] py-1.5 text-center hover:bg-[var(--color-surface-muted)]">
                {item.label}
              </Link>
            ))}
          </div>
          <button
            type="button"
            onClick={() => setLogoutConfirmOpen(true)}
            className="w-full inline-flex items-center justify-center gap-1.5 rounded-xl border border-red-200 dark:border-red-900/50 py-2 text-xs font-semibold text-red-600 dark:text-red-400 hover:bg-red-50 cursor-pointer"
          >
            <LogOut className="h-3.5 w-3.5" />
            <span>Keluar</span>
          </button>
        </div>
      </aside>

      {/* Main Column */}
      <div className="flex-1 flex flex-col min-w-0 pb-24 lg:pb-8">
        <header className="sticky top-0 z-30 border-b border-[var(--color-border)] bg-[var(--color-surface)]/95 backdrop-blur-md">
          <div className="flex h-16 items-center justify-between gap-2 sm:gap-3 px-3 sm:px-6">
            <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
              <button
                type="button"
                onClick={() => setMobileDrawerOpen(true)}
                className="lg:hidden inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[var(--color-border)] cursor-pointer"
                aria-label="Buka menu outlet"
              >
                <Menu className="h-5 w-5" />
              </button>
              <div className="lg:hidden min-w-0 truncate">
                <BrandLogo subtitle="CUSTOMER PORTAL" compact />
              </div>
              <div className="hidden lg:block">
                <h1 className="text-base font-bold text-[#123A54] dark:text-white">
                  {outletName}
                </h1>
                <p className="text-xs text-[var(--color-text-muted)]">
                  {CUSTOMER_OUTLET_PROFILE.category} ·{' '}
                  {CUSTOMER_OUTLET_PROFILE.city}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
              <div className="hidden sm:block">
                <PWAInstallButton variant="compact" />
              </div>
              <button
                type="button"
                onClick={() => setActiveTab('cart')}
                aria-label="Keranjang belanja"
                className="relative inline-flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] hover:text-[#348CB2] cursor-pointer shrink-0"
              >
                <ShoppingCart className="h-4 w-4" />
                {cart.length > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-[#348CB2] text-[10px] font-bold text-white tabular-nums">
                    {cart.length}
                  </span>
                )}
              </button>
              <button
                type="button"
                onClick={toggleTheme}
                aria-label="Ubah tema"
                className="inline-flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] cursor-pointer shrink-0"
              >
                {theme === 'light' ? (
                  <Moon className="h-4 w-4" />
                ) : (
                  <Sun className="h-4 w-4" />
                )}
              </button>
              <button
                type="button"
                onClick={() => setNotificationsOpen(true)}
                aria-label="Notifikasi"
                className="relative inline-flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] cursor-pointer shrink-0"
              >
                <Bell className="h-4 w-4" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-[#F97316] text-[10px] font-bold text-white tabular-nums">
                    {unreadCount}
                  </span>
                )}
              </button>
            </div>
          </div>
        </header>

        {toastNotice && (
          <div className="mx-auto mt-3 w-full max-w-5xl px-4 sm:px-6">
            <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 dark:border-emerald-900/50 dark:bg-emerald-950/40 px-4 py-2.5 text-xs font-semibold text-emerald-700 dark:text-emerald-300">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              <span>{toastNotice}</span>
            </div>
          </div>
        )}

        <main className="mx-auto w-full max-w-5xl px-4 sm:px-6 py-5 space-y-6">
          {/* ================================================================
           * SCREEN 3: DASHBOARD
           * ================================================================ */}
          {activeTab === 'dashboard' && (
            <div className="space-y-5">
              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-[#123A54] dark:text-white">
                  Halo, {outletName}
                </h2>
                <p className="text-xs sm:text-sm text-[var(--color-text-secondary)]">
                  Outlet • {CUSTOMER_OUTLET_PROFILE.city}
                </p>
              </div>

              {/* Hero Summary Card */}
              <div className="rounded-3xl bg-gradient-to-r from-[#236D91] via-[#348CB2] to-[#56A8CC] p-6 text-white shadow-md">
                <p className="text-xs font-medium text-white/85">
                  Total Order Bulan Ini
                </p>
                <div className="mt-1.5 flex flex-wrap items-baseline justify-between gap-2">
                  <p className="text-2xl sm:text-3xl font-bold tabular-nums">
                    {formatRupiah(CUSTOMER_OUTLET_PROFILE.monthlyOrderTotal)}
                  </p>
                  <span className="text-xs sm:text-sm font-bold text-emerald-200 tabular-nums">
                    ↑ {CUSTOMER_OUTLET_PROFILE.monthlyGrowthPct}
                  </span>
                </div>
              </div>

              {/* 4 KPI Quick Tiles */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-4">
                {[
                  {
                    label: 'Order',
                    val: orders.length + 22,
                    icon: ShoppingCart,
                    color: 'text-[#348CB2]',
                    action: () => setActiveTab('order_status'),
                  },
                  {
                    label: 'Proses',
                    val: orders.filter((o) => o.status !== 'Selesai').length + 5,
                    icon: Clock,
                    color: 'text-[#236D91]',
                    action: () => setActiveTab('order_status'),
                  },
                  {
                    label: 'Selesai',
                    val: 17,
                    icon: CheckCircle2,
                    color: 'text-[#10B981]',
                    action: () => setActiveTab('order_status'),
                  },
                  {
                    label: 'Poin',
                    val: 'Buka',
                    icon: Star,
                    color: 'text-[#F97316]',
                    action: () => setActiveTab('reward'),
                  },
                ].map((tile) => {
                  const TileIcon = tile.icon;
                  return (
                    <button
                      key={tile.label}
                      type="button"
                      onClick={tile.action}
                      className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-3 sm:p-4 text-center hover:border-[#348CB2] cursor-pointer"
                    >
                      <TileIcon
                        className={`h-5 w-5 mx-auto mb-1 ${tile.color}`}
                      />
                      <p className="text-[11px] text-[var(--color-text-muted)]">
                        {tile.label}
                      </p>
                      <p className="text-sm sm:text-base font-bold tabular-nums mt-0.5">
                        {tile.val}
                      </p>
                    </button>
                  );
                })}
              </div>

              {/* Promo Spesial Outlet Interactive Carousel + Active Order Strip */}
              <div className="rounded-2xl border border-[#F97316]/30 bg-gradient-to-r from-[#FFF7ED] to-[#FFEDD5] dark:from-[#431407]/40 dark:to-[#1F2937] p-4 sm:p-5 space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <button
                    type="button"
                    onClick={() => setSelectedPromo(currentPromoSlide)}
                    className="flex-1 text-left flex items-center justify-between gap-4 cursor-pointer"
                  >
                    <div className="min-w-0">
                      <div className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-[#C2410C] dark:text-[#FB923C]">
                        <Tag className="h-3.5 w-3.5" />
                        <span>Promo Spesial Outlet</span>
                      </div>
                      <p className="text-sm sm:text-base font-bold text-[#9A3412] dark:text-[#FDBA74] mt-0.5 truncate">
                        {currentPromoSlide.title}
                      </p>
                      <p className="text-xs text-[#7C2D12] dark:text-[#FED7AA] mt-0.5 line-clamp-1">
                        {currentPromoSlide.discountRule} · s/d{' '}
                        {currentPromoSlide.validUntil}
                      </p>
                    </div>
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#F97316] text-white">
                      <Gift className="h-5 w-5" />
                    </div>
                  </button>
                </div>
                <div className="flex items-center justify-between pt-1">
                  <div className="flex items-center gap-1.5">
                    {dashboardPromos.map((dp, idx) => (
                      <button
                        key={dp.id}
                        type="button"
                        onClick={() => setPromoSlideIdx(idx)}
                        aria-label={`Slide promo ${idx + 1}`}
                        className={`h-2 rounded-full transition-all cursor-pointer ${
                          promoSlideIdx === idx
                            ? 'w-6 bg-[#F97316]'
                            : 'w-2 bg-[#F97316]/30'
                        }`}
                      />
                    ))}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() =>
                        setPromoSlideIdx(
                          (idx) =>
                            (idx - 1 + dashboardPromos.length) %
                            dashboardPromos.length
                        )
                      }
                      aria-label="Promo sebelumnya"
                      className="flex h-7 w-7 items-center justify-center rounded-lg border border-[#F97316]/30 bg-white/70 dark:bg-slate-900/40 text-[#9A3412] dark:text-[#FDBA74] cursor-pointer"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setPromoSlideIdx(
                          (idx) => (idx + 1) % dashboardPromos.length
                        )
                      }
                      aria-label="Promo berikutnya"
                      className="flex h-7 w-7 items-center justify-center rounded-lg border border-[#F97316]/30 bg-white/70 dark:bg-slate-900/40 text-[#9A3412] dark:text-[#FDBA74] cursor-pointer"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Active Order Quick Strip */}
              {activeOrder && (
                <button
                  type="button"
                  onClick={() => setActiveTab('order_status')}
                  className="w-full rounded-2xl border border-[#ADD8E6] bg-[#F3FAFC] dark:bg-[#172438] px-4 py-3 flex items-center justify-between gap-3 text-left hover:border-[#348CB2] cursor-pointer"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#348CB2] text-white">
                      <Truck className="h-4 w-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-[#123A54] dark:text-white truncate">
                        Status Order Terkini · {activeOrder.id}
                      </p>
                      <p className="text-[11px] text-[var(--color-text-secondary)] truncate tabular-nums">
                        {activeOrder.status} · {activeOrder.items.length} item ·{' '}
                        {formatRupiah(activeOrder.total)}
                      </p>
                    </div>
                  </div>
                  <span className="inline-flex items-center gap-1 text-xs font-bold text-[#348CB2] shrink-0">
                    <span>Lacak</span>
                    <ChevronRight className="h-4 w-4" />
                  </span>
                </button>
              )}

              {/* Quick Navigation Shortcuts */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  {
                    tab: 'catalog' as const,
                    label: 'Pesan Produk',
                    sub: 'Lihat katalog SKU',
                    icon: LayoutGrid,
                  },
                  {
                    tab: 'pricing' as const,
                    label: 'Daftar Harga',
                    sub: 'Harga kontrak outlet',
                    icon: Percent,
                  },
                  {
                    tab: 'cart' as const,
                    label: `Keranjang (${cart.length})`,
                    sub: 'Lanjut checkout',
                    icon: ShoppingCart,
                  },
                  {
                    tab: 'order_status' as const,
                    label: 'Lacak Order',
                    sub: activeOrder.id,
                    icon: Truck,
                  },
                ].map((q) => {
                  const QIcon = q.icon;
                  return (
                    <button
                      key={q.tab}
                      type="button"
                      onClick={() => setActiveTab(q.tab)}
                      className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 text-left hover:border-[#348CB2] cursor-pointer"
                    >
                      <QIcon className="h-5 w-5 text-[#348CB2] mb-2" />
                      <p className="text-xs sm:text-sm font-bold">{q.label}</p>
                      <p className="text-[11px] text-[var(--color-text-muted)] mt-0.5 truncate">
                        {q.sub}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* ================================================================
           * SCREEN 4: KATALOG PRODUK
           * ================================================================ */}
          {activeTab === 'catalog' && (
            <div className="space-y-4">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--color-text-muted)]" />
                  <input
                    type="text"
                    value={catalogSearch}
                    onChange={(e) => setCatalogSearch(e.target.value)}
                    placeholder="Cari produk, kategori, atau SKU..."
                    className="w-full rounded-xl border border-[var(--color-border-strong)] bg-[var(--color-surface)] pl-10 pr-4 py-2.5 text-sm"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => setFilterModalOpen(true)}
                  className="inline-flex items-center justify-center rounded-xl border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-3.5 hover:bg-[var(--color-surface-muted)] cursor-pointer"
                  aria-label="Filter kategori"
                >
                  <SlidersHorizontal className="h-4 w-4" />
                </button>
              </div>

              {/* 4 Visual Category Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {(['Minuman', 'Makanan', 'Perawatan', 'Lainnya'] as const).map(
                  (cat) => {
                    const active = catalogCategory === cat;
                    return (
                      <button
                        key={cat}
                        type="button"
                        onClick={() =>
                          setCatalogCategory(active ? 'Semua' : cat)
                        }
                        className={`rounded-2xl border p-3 text-center transition-colors cursor-pointer ${
                          active
                            ? 'border-[#348CB2] bg-[#E5F4F8] dark:bg-[#19394B]'
                            : 'border-[var(--color-border)] bg-[var(--color-surface)]'
                        }`}
                      >
                        <Package className="h-5 w-5 mx-auto text-[#348CB2] mb-1" />
                        <span className="text-xs font-bold block">{cat}</span>
                      </button>
                    );
                  }
                )}
              </div>

              {/* Tag Sub-tabs */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 rounded-xl bg-[var(--color-surface-muted)] p-1">
                {(['Semua', 'Best Seller', 'Promo', 'Baru'] as const).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setCatalogTag(t)}
                    className={`rounded-lg py-2 text-xs font-bold cursor-pointer ${
                      catalogTag === t
                        ? 'bg-[#348CB2] text-white'
                        : 'text-[var(--color-text-secondary)]'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>

              {/* Product List or Empty State */}
              <div className="space-y-3">
                {filteredCatalogProducts.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-[var(--color-border-strong)] bg-[var(--color-surface)] p-8 text-center space-y-3">
                    <Package className="h-9 w-9 mx-auto text-[var(--color-text-muted)]" />
                    <div>
                      <p className="text-sm font-bold">
                        Produk tidak ditemukan
                      </p>
                      <p className="text-xs text-[var(--color-text-muted)] mt-0.5">
                        Tidak ada SKU yang sesuai dengan pencarian atau filter kategori/tag Anda.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setCatalogSearch('');
                        setCatalogCategory('Semua');
                        setCatalogTag('Semua');
                      }}
                      className="rounded-xl bg-[#348CB2] px-4 py-2 text-xs font-bold text-white cursor-pointer"
                    >
                      Reset Filter
                    </button>
                  </div>
                ) : (
                  filteredCatalogProducts.map((prod) => (
                    <div
                      key={prod.sku}
                      className="flex items-center justify-between gap-3 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4"
                    >
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedProduct(prod);
                          setDetailQty(1);
                          setActiveTab('product_detail');
                        }}
                        className="flex items-center gap-3.5 text-left min-w-0 flex-1 cursor-pointer"
                      >
                        <div
                          className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl text-white font-bold text-xs"
                          style={{ backgroundColor: prod.accentHex }}
                        >
                          {prod.category.slice(0, 3).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="text-[11px] font-mono text-[var(--color-text-muted)]">
                              {prod.sku} · {prod.tag}
                            </p>
                            {prod.promoDiscountPct && (
                              <span className="rounded-md bg-[#FFF7ED] dark:bg-[#431407]/50 px-1.5 py-0.5 text-[10px] font-bold text-[#F97316] tabular-nums">
                                -{prod.promoDiscountPct}%
                              </span>
                            )}
                          </div>
                          <p className="text-sm font-bold truncate">
                            {prod.name}
                          </p>
                          <p className="text-xs sm:text-sm font-bold text-[#123A54] dark:text-[#87CEEB] tabular-nums mt-0.5">
                            {formatRupiah(prod.price)} / {prod.unit}
                          </p>
                        </div>
                      </button>
                      <button
                        type="button"
                        onClick={() => addToCart(prod, 1)}
                        aria-label={`Tambah ${prod.name} ke keranjang`}
                        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#348CB2] hover:bg-[#236D91] text-white cursor-pointer"
                      >
                        <Plus className="h-5 w-5" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* ================================================================
           * SCREEN 5: DETAIL PRODUK
           * ================================================================ */}
          {activeTab === 'product_detail' && (
            <div className="space-y-5 max-w-2xl">
              <button
                type="button"
                onClick={() => setActiveTab('catalog')}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-[#348CB2] hover:underline cursor-pointer"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Kembali ke Katalog Produk</span>
              </button>

              <div className="rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface)] overflow-hidden">
                <div
                  className="relative h-52 flex flex-col items-center justify-center text-white p-6"
                  style={{
                    background: `linear-gradient(135deg, ${selectedProduct.accentHex}, #236D91)`,
                  }}
                >
                  <button
                    type="button"
                    onClick={() =>
                      setFavoriteSkus((prev) =>
                        prev.includes(selectedProduct.sku)
                          ? prev.filter((s) => s !== selectedProduct.sku)
                          : [...prev, selectedProduct.sku]
                      )
                    }
                    className="absolute top-4 right-4 flex h-10 w-10 items-center justify-center rounded-full bg-white/90 text-[#123A54] cursor-pointer"
                    aria-label="Favorit produk"
                  >
                    <Heart
                      className={`h-5 w-5 ${
                        favoriteSkus.includes(selectedProduct.sku)
                          ? 'fill-red-500 text-red-500'
                          : ''
                      }`}
                    />
                  </button>
                  <Package className="h-16 w-16 mb-2 opacity-90" />
                  <p className="text-sm font-bold">{selectedProduct.name}</p>
                </div>

                <div className="p-6 space-y-5">
                  <div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-mono text-[var(--color-text-muted)]">
                        {selectedProduct.sku}
                      </span>
                      <span className="text-xs font-bold text-[#348CB2]">
                        {selectedProduct.tag}
                      </span>
                    </div>
                    <h2 className="mt-1 text-xl font-bold text-[#123A54] dark:text-white">
                      {selectedProduct.name}
                    </h2>
                    <p className="mt-1 text-lg font-bold text-[#F97316] tabular-nums">
                      {formatRupiah(selectedProduct.price)} /{' '}
                      {selectedProduct.unit}
                    </p>
                    <p className="mt-2 text-xs sm:text-sm text-[var(--color-text-secondary)]">
                      {selectedProduct.name} kemasan resmi PT Maju Distribusi,
                      cocok untuk penjualan harian dan etalase utama outlet
                      Anda.
                    </p>
                  </div>

                  {(() => {
                    const contractSpec = CUSTOMER_CONTRACT_PRICES.find(
                      (c) => c.sku === selectedProduct.sku
                    );
                    const matchingPromo = INITIAL_PROMOTIONS.find(
                      (pr) => pr.targetSku === selectedProduct.sku
                    );
                    const relatedProducts = INITIAL_PRODUCTS.filter(
                      (p) => p.sku !== selectedProduct.sku
                    ).slice(0, 3);
                    return (
                      <>
                        {(selectedProduct.promoDiscountPct || matchingPromo) && (
                          <div className="rounded-2xl border border-[#F97316]/30 bg-[#FFF7ED] dark:bg-[#431407]/40 p-3.5 flex items-center justify-between gap-3 text-xs">
                            <div>
                              <p className="font-bold text-[#C2410C] dark:text-[#FB923C]">
                                {matchingPromo
                                  ? matchingPromo.title
                                  : `Promo Diskon ${selectedProduct.promoDiscountPct}%`}
                              </p>
                              <p className="text-[11px] text-[#7C2D12] dark:text-[#FED7AA] mt-0.5">
                                {matchingPromo
                                  ? matchingPromo.discountRule
                                  : 'Potongan langsung otomatis di keranjang belanja'}
                              </p>
                            </div>
                            {matchingPromo && (
                              <button
                                type="button"
                                onClick={() => setSelectedPromo(matchingPromo)}
                                className="shrink-0 rounded-lg bg-[#F97316] px-2.5 py-1.5 text-[11px] font-bold text-white cursor-pointer"
                              >
                                Detail Promo
                              </button>
                            )}
                          </div>
                        )}

                        <div className="divide-y divide-[var(--color-border)] rounded-2xl border border-[var(--color-border)] bg-[var(--color-background)] text-xs">
                          <div className="flex justify-between px-4 py-3">
                            <span className="text-[var(--color-text-muted)]">
                              Kemasan
                            </span>
                            <span className="font-semibold">
                              {contractSpec?.packDesc || 'Dus (24 pcs)'}
                            </span>
                          </div>
                          <div className="flex justify-between px-4 py-3">
                            <span className="text-[var(--color-text-muted)]">
                              SKU
                            </span>
                            <span className="font-mono font-semibold">
                              {selectedProduct.sku}
                            </span>
                          </div>
                          <div className="flex justify-between px-4 py-3">
                            <span className="text-[var(--color-text-muted)]">
                              Stok Tersedia
                            </span>
                            <span className="font-bold text-[#10B981] tabular-nums">
                              {(selectedProduct.stock * 2).toLocaleString(
                                'id-ID'
                              )}{' '}
                              {selectedProduct.unit}
                            </span>
                          </div>
                          {contractSpec && (
                            <div className="flex justify-between px-4 py-3">
                              <span className="text-[var(--color-text-muted)]">
                                Harga Grosir (≥ {contractSpec.minBulkQty}{' '}
                                {contractSpec.unit})
                              </span>
                              <span className="font-bold text-[#F97316] tabular-nums">
                                {formatRupiah(contractSpec.bulkPrice)} /{' '}
                                {contractSpec.unit}
                              </span>
                            </div>
                          )}
                        </div>

                        <div className="flex items-center gap-3">
                          <div className="flex items-center rounded-xl border border-[var(--color-border-strong)] bg-[var(--color-background)]">
                            <button
                              type="button"
                              onClick={() =>
                                setDetailQty((q) => Math.max(1, q - 1))
                              }
                              className="px-3.5 py-2.5 cursor-pointer"
                              aria-label="Kurangi jumlah"
                            >
                              <Minus className="h-4 w-4" />
                            </button>
                            <span className="px-3 text-sm font-bold tabular-nums">
                              {detailQty}
                            </span>
                            <button
                              type="button"
                              onClick={() => setDetailQty((q) => q + 1)}
                              className="px-3.5 py-2.5 cursor-pointer"
                              aria-label="Tambah jumlah"
                            >
                              <Plus className="h-4 w-4" />
                            </button>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              addToCart(selectedProduct, detailQty);
                              setActiveTab('cart');
                            }}
                            className="flex-1 rounded-xl bg-[#236D91] hover:bg-[#194F70] py-3 text-sm font-bold text-white cursor-pointer"
                          >
                            + Keranjang
                          </button>
                        </div>

                        {/* Produk Terkait */}
                        <div className="pt-2 border-t border-[var(--color-border)] space-y-2.5">
                          <p className="text-xs font-bold text-[#123A54] dark:text-white">
                            Produk Terkait Lainnya
                          </p>
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                            {relatedProducts.map((rel) => (
                              <button
                                key={rel.sku}
                                type="button"
                                onClick={() => {
                                  setSelectedProduct(rel);
                                  setDetailQty(1);
                                }}
                                className="rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] p-3 text-left hover:border-[#348CB2] cursor-pointer"
                              >
                                <p className="text-xs font-bold truncate">
                                  {rel.name}
                                </p>
                                <p className="text-[11px] font-bold text-[#348CB2] tabular-nums mt-0.5">
                                  {formatRupiah(rel.price)} / {rel.unit}
                                </p>
                              </button>
                            ))}
                          </div>
                        </div>
                      </>
                    );
                  })()}
                </div>
              </div>
            </div>
          )}

          {/* ================================================================
           * SCREEN 6: DAFTAR HARGA (PRICING)
           * ================================================================ */}
          {activeTab === 'pricing' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="grid grid-cols-2 gap-1.5 rounded-xl bg-[var(--color-surface-muted)] p-1 max-w-sm w-full">
                  {(['Harga Saya', 'Price List'] as const).map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setPricingTab(t)}
                      className={`rounded-lg py-2 text-xs font-bold cursor-pointer ${
                        pricingTab === t
                          ? 'bg-[#348CB2] text-white'
                          : 'text-[var(--color-text-secondary)]'
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
                <div className="relative flex-1 max-w-xs">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--color-text-muted)]" />
                  <input
                    type="text"
                    value={pricingSearch}
                    onChange={(e) => setPricingSearch(e.target.value)}
                    placeholder="Cari produk atau SKU..."
                    className="w-full rounded-xl border border-[var(--color-border-strong)] bg-[var(--color-surface)] pl-10 pr-3.5 py-2 text-xs"
                  />
                </div>
              </div>

              <div className="flex items-start gap-2.5 rounded-2xl border border-[#ADD8E6] bg-[#F3FAFC] dark:bg-[#172438] p-4 text-xs text-[#236D91] dark:text-[#87CEEB]">
                <Info className="h-4 w-4 shrink-0 mt-0.5" />
                <span>
                  {pricingTab === 'Harga Saya'
                    ? 'Harga khusus kontrak untuk outlet Anda beserta tier harga grosir per kuantitas.'
                    : 'Daftar harga price list standar distributor sebelum potongan kontrak outlet.'}
                </span>
              </div>

              <div className="space-y-2.5">
                {CUSTOMER_CONTRACT_PRICES.filter((cp) => {
                  const q = pricingSearch.trim().toLowerCase();
                  return (
                    !q ||
                    cp.name.toLowerCase().includes(q) ||
                    cp.sku.toLowerCase().includes(q)
                  );
                }).map((cp) => {
                  const savings = cp.listPrice - cp.contractPrice;
                  return (
                    <button
                      key={cp.sku}
                      type="button"
                      onClick={() => setSelectedContractPrice(cp)}
                      className="w-full flex items-center justify-between gap-4 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 text-left hover:border-[#348CB2] cursor-pointer"
                    >
                      <div className="flex items-center gap-3.5 min-w-0">
                        <div
                          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-white font-bold text-xs"
                          style={{ backgroundColor: cp.accentHex }}
                        >
                          {cp.category.slice(0, 3).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="text-sm font-bold">{cp.name}</p>
                            {pricingTab === 'Harga Saya' && savings > 0 && (
                              <span className="rounded-md bg-[#ECFDF5] dark:bg-[#064E3B]/50 px-1.5 py-0.5 text-[10px] font-bold text-[#047857] dark:text-[#34D399] tabular-nums">
                                Hemat {formatRupiah(savings)}
                              </span>
                            )}
                          </div>
                          <p className="text-xs font-mono text-[var(--color-text-muted)]">
                            {cp.sku} · {cp.packDesc}
                          </p>
                          <div className="flex flex-wrap items-baseline gap-2 mt-0.5">
                            <p className="text-xs sm:text-sm font-bold text-[#123A54] dark:text-[#87CEEB] tabular-nums">
                              {formatRupiah(
                                pricingTab === 'Harga Saya'
                                  ? cp.contractPrice
                                  : cp.listPrice
                              )}{' '}
                              / {cp.unit}
                            </p>
                            {pricingTab === 'Harga Saya' && (
                              <span className="text-[11px] line-through text-[var(--color-text-muted)] tabular-nums">
                                {formatRupiah(cp.listPrice)}
                              </span>
                            )}
                          </div>
                          {pricingTab === 'Harga Saya' && (
                            <p className="text-[11px] text-[#F97316] font-semibold tabular-nums mt-0.5">
                              Grosir ≥ {cp.minBulkQty} {cp.unit}:{' '}
                              {formatRupiah(cp.bulkPrice)} / {cp.unit}
                            </p>
                          )}
                        </div>
                      </div>
                      <ChevronRight className="h-4 w-4 shrink-0 text-[var(--color-text-muted)]" />
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* ================================================================
           * SCREEN 7: PROMO & CAMPAIGN
           * ================================================================ */}
          {activeTab === 'promo' && (
            <div className="space-y-5">
              <div className="rounded-3xl bg-gradient-to-r from-[#236D91] to-[#348CB2] p-6 text-white flex items-center justify-between gap-4">
                <div>
                  <span className="text-xs font-semibold text-[#FDBA74]">
                    Promo Bulan Ini
                  </span>
                  <h2 className="mt-1 text-2xl font-bold">Diskon 20%</h2>
                  <p className="text-xs sm:text-sm text-white/90 mt-0.5">
                    untuk produk pilihan SalesX-Ai
                  </p>
                </div>
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[#F97316] text-white">
                  <Tag className="h-7 w-7" />
                </div>
              </div>

              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-bold text-[#123A54] dark:text-white">
                    Promo Aktif
                  </h3>
                  <span className="text-xs font-semibold text-[#348CB2]">
                    {INITIAL_PROMOTIONS.length} Program
                  </span>
                </div>
                {INITIAL_PROMOTIONS.map((pr) => (
                  <button
                    key={pr.id}
                    type="button"
                    onClick={() => setSelectedPromo(pr)}
                    className="w-full flex items-center justify-between gap-3 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 text-left hover:border-[#348CB2] cursor-pointer"
                  >
                    <div className="flex items-center gap-3.5">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#FFF7ED] dark:bg-[#431407]/40 text-[#F97316]">
                        <Tag className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-sm font-bold">{pr.title}</p>
                        <p className="text-xs text-[var(--color-text-muted)]">
                          Berlaku s/d {pr.validUntil}
                        </p>
                      </div>
                    </div>
                    <ChevronRight className="h-4 w-4 text-[var(--color-text-muted)]" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ================================================================
           * SCREEN 8: KERANJANG (CART)
           * ================================================================ */}
          {activeTab === 'cart' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-[#123A54] dark:text-white tabular-nums">
                  {selectedCartItems.length} Produk Dipilih
                </h2>
                {cart.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setCart([])}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-red-600 cursor-pointer"
                  >
                    <Trash2 className="h-4 w-4" />
                    <span>Kosongkan</span>
                  </button>
                )}
              </div>

              {cart.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-[var(--color-border-strong)] bg-[var(--color-surface)] p-10 text-center space-y-3">
                  <ShoppingCart className="h-10 w-10 mx-auto text-[var(--color-text-muted)]" />
                  <p className="text-sm font-semibold">
                    Keranjang belanja Anda masih kosong.
                  </p>
                  <button
                    type="button"
                    onClick={() => setActiveTab('catalog')}
                    className="rounded-xl bg-[#348CB2] px-5 py-2.5 text-xs font-bold text-white cursor-pointer"
                  >
                    Jelajahi Katalog Produk
                  </button>
                </div>
              ) : (
                <>
                  <div className="space-y-3">
                    {cart.map((item) => (
                      <div
                        key={item.sku}
                        className="flex items-center justify-between gap-3 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <input
                            type="checkbox"
                            checked={item.selected}
                            onChange={() =>
                              setCart((prev) =>
                                prev.map((c) =>
                                  c.sku === item.sku
                                    ? { ...c, selected: !c.selected }
                                    : c
                                )
                              )
                            }
                            className="h-4 w-4 rounded accent-[#348CB2]"
                            aria-label={`Pilih ${item.name}`}
                          />
                          <div
                            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-white font-bold text-xs"
                            style={{ backgroundColor: item.accentHex }}
                          >
                            SKU
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-bold truncate">
                              {item.name}
                            </p>
                            <p className="text-xs text-[var(--color-text-muted)] tabular-nums">
                              {formatRupiah(item.unitPrice)} / {item.unit}
                            </p>
                            <div className="mt-2 inline-flex items-center rounded-lg border border-[var(--color-border)] bg-[var(--color-background)]">
                              <button
                                type="button"
                                onClick={() =>
                                  setCart((prev) =>
                                    prev.map((c) =>
                                      c.sku === item.sku
                                        ? { ...c, qty: Math.max(1, c.qty - 1) }
                                        : c
                                    )
                                  )
                                }
                                className="px-2.5 py-1 cursor-pointer"
                                aria-label="Kurangi"
                              >
                                <Minus className="h-3.5 w-3.5" />
                              </button>
                              <span className="px-2.5 text-xs font-bold tabular-nums">
                                {item.qty}
                              </span>
                              <button
                                type="button"
                                onClick={() =>
                                  setCart((prev) =>
                                    prev.map((c) =>
                                      c.sku === item.sku
                                        ? { ...c, qty: c.qty + 1 }
                                        : c
                                    )
                                  )
                                }
                                className="px-2.5 py-1 cursor-pointer"
                                aria-label="Tambah"
                              >
                                <Plus className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2.5 shrink-0">
                          <p className="text-sm font-bold text-[#123A54] dark:text-white tabular-nums">
                            {formatRupiah(item.unitPrice * item.qty)}
                          </p>
                          <button
                            type="button"
                            onClick={() => {
                              setCart((prev) =>
                                prev.filter((c) => c.sku !== item.sku)
                              );
                              triggerToast(`${item.name} dihapus dari keranjang.`);
                            }}
                            aria-label={`Hapus ${item.name} dari keranjang`}
                            className="flex h-8 w-8 items-center justify-center rounded-lg border border-red-200 dark:border-red-900/40 text-red-600 hover:bg-red-50 cursor-pointer"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 space-y-2.5">
                    <div className="flex items-center gap-2 text-xs font-bold text-[#123A54] dark:text-white">
                      <Ticket className="h-4 w-4 text-[#F97316]" />
                      <span>Reward & Voucher</span>
                    </div>
                    <p className="text-xs text-[var(--color-text-secondary)]">
                      Penukaran poin dan voucher reward dikelola melalui SmartReward. Voucher belum mengurangi total checkout sampai kontrak order mendukung validasi redemption dari FastAPI.
                    </p>
                    <Link href="/customer/smart-reward" className="inline-flex rounded-lg border border-[var(--color-border)] px-3 py-2 text-xs font-semibold text-[var(--color-primary)]">
                      Buka katalog SmartReward
                    </Link>
                  </div>

                  <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 space-y-3">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-[var(--color-text-secondary)]">
                        Subtotal Terpilih
                      </span>
                      <span className="font-semibold tabular-nums">
                        {formatRupiah(cartSubtotal)}
                      </span>
                    </div>
                    {cartTotalDiscount > 0 && (
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-[var(--color-text-secondary)]">
                          Estimasi Potongan Promo & Voucher
                        </span>
                        <span className="font-bold text-[#10B981] tabular-nums">
                          - {formatRupiah(cartTotalDiscount)}
                        </span>
                      </div>
                    )}
                    <div className="flex items-center justify-between pt-2 border-t border-[var(--color-border)]">
                      <span className="text-sm font-semibold text-[var(--color-text-secondary)]">
                        Total Belanja
                      </span>
                      <span className="text-xl font-bold text-[#123A54] dark:text-white tabular-nums">
                        {formatRupiah(cartGrandTotal)}
                      </span>
                    </div>
                    <button
                      type="button"
                      disabled={selectedCartItems.length === 0}
                      onClick={() => setActiveTab('checkout')}
                      className="w-full rounded-xl bg-[#236D91] hover:bg-[#194F70] disabled:opacity-50 py-3.5 text-sm font-bold text-white cursor-pointer"
                    >
                      Buat Order
                    </button>
                  </div>
                </>
              )}
            </div>
          )}

          {/* ================================================================
           * SCREEN 9: BUAT ORDER (CHECKOUT)
           * ================================================================ */}
          {activeTab === 'checkout' && (
            <form onSubmit={handleCheckoutSubmit} className="space-y-4 max-w-2xl">
              <button
                type="button"
                onClick={() => setActiveTab('cart')}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-[#348CB2] hover:underline cursor-pointer"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Kembali ke Keranjang</span>
              </button>

              <div>
                <p className="text-xs font-bold uppercase text-[var(--color-text-muted)] mb-1.5">
                  Alamat Pengiriman
                </p>
                <button
                  type="button"
                  onClick={() => setAddressModalOpen(true)}
                  className="w-full flex items-center justify-between gap-3 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 text-left hover:border-[#348CB2] cursor-pointer"
                >
                  <div className="flex items-start gap-3">
                    <MapPin className="h-5 w-5 text-[#348CB2] shrink-0 mt-0.5" />
                    <div className="text-xs sm:text-sm">
                      <p className="font-bold">{outletName}</p>
                      <p className="text-[var(--color-text-secondary)]">
                        {outletAddress}
                      </p>
                      <p className="text-[var(--color-text-muted)] tabular-nums">
                        {outletPhone}
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-[var(--color-text-muted)]" />
                </button>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-[var(--color-text-muted)] mb-1.5">
                  Jadwal Pengiriman
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#348CB2]" />
                  <input
                    type="date"
                    value={deliveryDate}
                    onChange={(e) => setDeliveryDate(e.target.value)}
                    className="w-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] pl-10 pr-4 py-3 text-sm tabular-nums"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-[var(--color-text-muted)] mb-1.5">
                  Catatan (opsional)
                </label>
                <textarea
                  rows={2}
                  value={orderNotes}
                  onChange={(e) => setOrderNotes(e.target.value)}
                  placeholder="Contoh: kirim pagi sebelum pukul 11.00 WIB"
                  className="w-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-3.5 text-sm"
                />
              </div>

              <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 space-y-2.5 text-sm">
                <p className="font-bold text-[#123A54] dark:text-white">
                  Ringkasan Order
                </p>
                <div className="flex justify-between text-xs">
                  <span className="text-[var(--color-text-secondary)]">
                    Total Produk ({selectedCartItems.length})
                  </span>
                  <span className="font-semibold tabular-nums">
                    {formatRupiah(cartSubtotal)}
                  </span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-[var(--color-text-secondary)]">
                    Diskon Promo{' '}
                    {appliedPromoTitle ? `(${appliedPromoTitle})` : ''}
                  </span>
                  <span className="font-bold text-[#10B981] tabular-nums">
                    - {formatRupiah(cartPromoDiscount)}
                  </span>
                </div>
                <div className="flex justify-between pt-2.5 border-t border-[var(--color-border)] font-bold">
                  <span>Total Pembayaran</span>
                  <span className="text-lg text-[#123A54] dark:text-white tabular-nums">
                    {formatRupiah(cartGrandTotal)}
                  </span>
                </div>
              </div>

              <button
                type="submit"
                disabled={submittingOrder || selectedCartItems.length === 0}
                className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-[#236D91] hover:bg-[#194F70] disabled:opacity-60 py-3.5 text-sm font-bold text-white cursor-pointer"
              >
                <Send className="h-4 w-4" />
                <span>{submittingOrder ? 'Memproses Order...' : 'Kirim Order'}</span>
              </button>
            </form>
          )}

          {/* ================================================================
           * SCREEN 10: ORDER STATUS & TRACKING
           * ================================================================ */}
          {activeTab === 'order_status' && (
            <div className="space-y-5">
              {/* Filter Tabs & Search */}
              <div className="flex flex-col sm:flex-row gap-2.5">
                <div className="relative flex-1">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--color-text-muted)]" />
                  <input
                    type="text"
                    value={orderSearchQuery}
                    onChange={(e) => setOrderSearchQuery(e.target.value)}
                    placeholder="Cari nomor order atau nama produk..."
                    className="w-full rounded-xl border border-[var(--color-border-strong)] bg-[var(--color-surface)] pl-10 pr-4 py-2 text-xs sm:text-sm"
                  />
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-1 rounded-xl bg-[var(--color-surface-muted)] p-1">
                  {(['Semua', 'Proses', 'Selesai', 'Batal'] as const).map(
                    (st) => (
                      <button
                        key={st}
                        type="button"
                        onClick={() => setOrderFilterStatus(st)}
                        className={`rounded-lg px-2.5 py-1.5 text-xs font-bold cursor-pointer ${
                          orderFilterStatus === st
                            ? 'bg-[#348CB2] text-white'
                            : 'text-[var(--color-text-secondary)]'
                        }`}
                      >
                        {st}
                      </button>
                    )
                  )}
                </div>
              </div>

              {/* Order Selector Pills */}
              <div className="flex gap-2 overflow-x-auto pb-1">
                {filteredOrders.length === 0 ? (
                  <p className="text-xs text-[var(--color-text-muted)] py-1">
                    Tidak ada order yang sesuai filter.
                  </p>
                ) : (
                  filteredOrders.map((ord) => (
                    <button
                      key={ord.id}
                      type="button"
                      onClick={() => setActiveOrderId(ord.id)}
                      className={`shrink-0 rounded-xl border px-3.5 py-2 text-xs font-bold tabular-nums cursor-pointer ${
                        activeOrder.id === ord.id
                          ? 'border-[#348CB2] bg-[#348CB2] text-white'
                          : 'border-[var(--color-border)] bg-[var(--color-surface)]'
                      }`}
                    >
                      {ord.id} · {ord.status}
                    </button>
                  ))
                )}
              </div>

              {/* 4-Step Horizontal Progress or Cancelled Notice */}
              {activeOrder.status === 'Batal' ? (
                <div className="rounded-2xl border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-950/30 p-5 flex items-start gap-3 text-xs text-red-700 dark:text-red-300">
                  <XCircle className="h-5 w-5 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold text-sm">Pesanan Dibatalkan</p>
                    <p className="mt-1">
                      Alasan:{' '}
                      {activeOrder.cancelReason ||
                        'Dibatalkan oleh outlet sebelum pengiriman.'}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
                    {(['Dibuat', 'Diproses', 'Dikirim', 'Selesai'] as const).map(
                      (stepLabel, idx) => {
                        const stepOrder = [
                          'Dibuat',
                          'Diproses',
                          'Dikirim',
                          'Selesai',
                        ].indexOf(activeOrder.status);
                        const reached = idx <= stepOrder;
                        return (
                          <div key={stepLabel} className="space-y-1.5">
                            <div
                              className={`mx-auto flex h-9 w-9 items-center justify-center rounded-full ${
                                reached
                                  ? 'bg-[#10B981] text-white'
                                  : 'bg-[var(--color-surface-muted)] text-[var(--color-text-muted)]'
                              }`}
                            >
                              <CheckCircle2 className="h-5 w-5" />
                            </div>
                            <p
                              className={`text-xs font-bold ${
                                reached
                                  ? 'text-[var(--color-text-primary)]'
                                  : 'text-[var(--color-text-muted)]'
                              }`}
                            >
                              {stepLabel}
                            </p>
                          </div>
                        );
                      }
                    )}
                  </div>
                </div>
              )}

              {/* Order Summary Card */}
              <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-mono font-bold text-[#123A54] dark:text-white">
                      {activeOrder.id}
                    </p>
                    <p className="text-xs text-[var(--color-text-muted)] tabular-nums">
                      {activeOrder.dateLabel} · Jadwal Kirim:{' '}
                      {activeOrder.deliveryDate}
                    </p>
                  </div>
                  <span
                    className={`rounded-lg px-2.5 py-1 text-xs font-bold ${
                      activeOrder.status === 'Batal'
                        ? 'bg-red-100 text-red-700'
                        : 'bg-[#ECFDF5] text-[#047857]'
                    }`}
                  >
                    {activeOrder.status}
                  </span>
                </div>

                <div className="flex justify-between text-xs pt-2 border-t border-[var(--color-border)]">
                  <span className="text-[var(--color-text-secondary)]">
                    Total Order
                  </span>
                  <span className="font-bold text-sm tabular-nums">
                    {formatRupiah(activeOrder.total)}
                  </span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-[var(--color-text-secondary)]">
                    Total Produk
                  </span>
                  <span className="font-bold tabular-nums">
                    {activeOrder.items.length} item
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setOrderDetailModal(activeOrder)}
                    className="rounded-xl border border-[var(--color-border-strong)] py-2.5 px-3 text-xs font-bold text-[#236D91] dark:text-[#87CEEB] hover:bg-[var(--color-surface-muted)] cursor-pointer"
                  >
                    Detail & Faktur
                  </button>
                  <button
                    type="button"
                    onClick={() => reorderToCart(activeOrder)}
                    className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-[#348CB2] hover:bg-[#236D91] py-2.5 px-3 text-xs font-bold text-white cursor-pointer"
                  >
                    <RefreshCw className="h-3.5 w-3.5" />
                    <span>Pesan Lagi</span>
                  </button>
                  {(activeOrder.status === 'Dibuat' ||
                    activeOrder.status === 'Diproses') && (
                    <button
                      type="button"
                      onClick={() => setCancelOrderModal(activeOrder)}
                      className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-red-200 dark:border-red-900/50 py-2.5 px-3 text-xs font-bold text-red-600 hover:bg-red-50 cursor-pointer"
                    >
                      <XCircle className="h-3.5 w-3.5" />
                      <span>Batalkan</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Vertical Timeline */}
              <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 space-y-3">
                <h3 className="text-sm font-bold">Riwayat Status</h3>
                <div className="space-y-3">
                  {activeOrder.timeline.map((log) => (
                    <div key={log.title} className="flex items-start gap-3">
                      <CheckCircle2 className="h-4 w-4 text-[#10B981] shrink-0 mt-0.5" />
                      <div>
                        <p className="text-xs font-bold">{log.title}</p>
                        <p className="text-[11px] text-[var(--color-text-muted)] tabular-nums">
                          {log.timestamp}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ================================================================
           * SCREEN 11: REWARD & LOYALTY
           * ================================================================ */}
          {activeTab === 'reward' && (
            <div className="space-y-5">
              <SmartRewardWorkspace />
            </div>
          )}

          {/* ================================================================
           * SCREEN 12: LAINNYA (NOTIFIKASI, SUPPORT, PROFIL, WORKSPACE, KELUAR)
           * ================================================================ */}
          {activeTab === 'more' && (
            <div className="space-y-3 max-w-2xl">
              <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 flex items-center gap-4">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[#348CB2] text-white font-bold text-lg">
                  {outletName.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <p className="text-base font-bold">{outletName}</p>
                  <p className="text-xs text-[var(--color-text-secondary)]">
                    PIC: {picName} · {outletPhone}
                  </p>
                  <p className="text-xs text-[var(--color-text-muted)]">
                    {outletAddress}
                  </p>
                </div>
              </div>

              <div className="divide-y divide-[var(--color-border)] rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] overflow-hidden">
                <button
                  type="button"
                  onClick={() => setNotificationsOpen(true)}
                  className="w-full flex items-center justify-between p-4 text-left hover:bg-[var(--color-surface-muted)] cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <Bell className="h-5 w-5 text-[#348CB2]" />
                    <div>
                      <p className="text-sm font-bold">Notifikasi</p>
                      <p className="text-xs text-[var(--color-text-muted)]">
                        Pemberitahuan order, promo, dan aktivitas
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {unreadCount > 0 && (
                      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[11px] font-bold text-white tabular-nums">
                        {unreadCount}
                      </span>
                    )}
                    <ChevronRight className="h-4 w-4 text-[var(--color-text-muted)]" />
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setSupportModalOpen(true)}
                  className="w-full flex items-center justify-between p-4 text-left hover:bg-[var(--color-surface-muted)] cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <HelpCircle className="h-5 w-5 text-[#348CB2]" />
                    <div>
                      <p className="text-sm font-bold">Customer Support</p>
                      <p className="text-xs text-[var(--color-text-muted)]">
                        Chat bantuan AI & pertanyaan distributor
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-[var(--color-text-muted)]" />
                </button>

                <button
                  type="button"
                  onClick={() => setProfileEditModalOpen(true)}
                  className="w-full flex items-center justify-between p-4 text-left hover:bg-[var(--color-surface-muted)] cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <User className="h-5 w-5 text-[#348CB2]" />
                    <div>
                      <p className="text-sm font-bold">Profil Outlet</p>
                      <p className="text-xs text-[var(--color-text-muted)]">
                        Data outlet, kontak, dan alamat GPS
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-[var(--color-text-muted)]" />
                </button>

                <button
                  type="button"
                  onClick={() => setWorkspaceModalOpen(true)}
                  className="w-full flex items-center justify-between p-4 text-left hover:bg-[var(--color-surface-muted)] cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <FileSpreadsheet className="h-5 w-5 text-[#10B981]" />
                    <div>
                      <p className="text-sm font-bold">
                        Google Workspace & Faktur
                      </p>
                      <p className="text-xs text-[var(--color-text-muted)]">
                        Kirim faktur via Gmail & pengingat Calendar
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-[var(--color-text-muted)]" />
                </button>

                <button
                  type="button"
                  onClick={() => setAccountSettingsOpen(true)}
                  className="w-full flex items-center justify-between p-4 text-left hover:bg-[var(--color-surface-muted)] cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <Settings className="h-5 w-5 text-[#348CB2]" />
                    <div>
                      <p className="text-sm font-bold">Pengaturan Akun</p>
                      <p className="text-xs text-[var(--color-text-muted)]">
                        Password, keamanan, dan preferensi tema
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-[var(--color-text-muted)]" />
                </button>

                <button
                  type="button"
                  onClick={() => setAboutModalOpen(true)}
                  className="w-full flex items-center justify-between p-4 text-left hover:bg-[var(--color-surface-muted)] cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <Info className="h-5 w-5 text-[#348CB2]" />
                    <div>
                      <p className="text-sm font-bold">Tentang SalesX-Ai</p>
                      <p className="text-xs text-[var(--color-text-muted)]">
                        Versi aplikasi, kebijakan, dan bantuan
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-[var(--color-text-muted)]" />
                </button>
              </div>

              <button
                type="button"
                onClick={() => setLogoutConfirmOpen(true)}
                className="w-full inline-flex items-center justify-center gap-2 rounded-2xl border border-red-200 dark:border-red-900/50 bg-[var(--color-surface)] py-3.5 text-sm font-bold text-red-600 dark:text-red-400 hover:bg-red-50 cursor-pointer"
              >
                <LogOut className="h-4 w-4" />
                <span>Keluar</span>
              </button>
            </div>
          )}
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <nav className="lg:hidden fixed bottom-0 inset-x-0 z-30 border-t border-[var(--color-border)] bg-[var(--color-surface)]/95 backdrop-blur-md grid grid-cols-5 pb-[env(safe-area-inset-bottom)]">
        {[
          { id: 'dashboard' as const, label: 'Beranda', icon: Home },
          { id: 'catalog' as const, label: 'Katalog', icon: LayoutGrid },
          { id: 'order_status' as const, label: 'Order', icon: ShoppingBag },
          { id: 'reward' as const, label: 'Reward', icon: Gift },
          { id: 'more' as const, label: 'Profil', icon: Menu },
        ].map((nav) => {
          const Icon = nav.icon;
          const active = activeTab === nav.id;
          return (
            <button
              key={nav.id}
              type="button"
              onClick={() => setActiveTab(nav.id)}
              className={`flex flex-col items-center justify-center py-2.5 text-[11px] font-semibold cursor-pointer ${
                active ? 'text-[#348CB2]' : 'text-[var(--color-text-muted)]'
              }`}
            >
              <Icon className="h-5 w-5 mb-0.5" />
              <span>{nav.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Mobile Drawer */}
      {mobileDrawerOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div
            className="fixed inset-0 bg-slate-900/50"
            onClick={() => setMobileDrawerOpen(false)}
          />
          <div className="relative z-10 w-72 max-w-[85vw] bg-[var(--color-surface)] h-full overflow-y-auto p-4 space-y-3">
            <div className="flex items-center justify-between pb-3 border-b border-[var(--color-border)]">
              <BrandLogo subtitle="CUSTOMER PORTAL" compact />
              <button
                type="button"
                onClick={() => setMobileDrawerOpen(false)}
                className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg border border-[var(--color-border)] cursor-pointer"
                aria-label="Tutup menu"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="sm:hidden pb-2 border-b border-[var(--color-border)]">
              <PWAInstallButton variant="compact" />
            </div>
            {sidebarNavItems.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    setActiveTab(item.id);
                    setMobileDrawerOpen(false);
                  }}
                  className={`w-full flex items-center justify-between rounded-xl px-3 py-2.5 text-xs font-semibold ${
                    activeTab === item.id
                      ? 'bg-[#348CB2] text-white'
                      : 'text-[var(--color-text-secondary)]'
                  }`}
                >
                  <span className="flex items-center gap-2.5">
                    <Icon className="h-4 w-4" />
                    <span>{item.label}</span>
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Customer Portal Modals */}
      <ContractPriceModal
        item={selectedContractPrice}
        onClose={() => setSelectedContractPrice(null)}
        onAddToCart={addBySkuToCart}
      />
      <CustomerPromoDetailModal
        promo={selectedPromo}
        onClose={() => setSelectedPromo(null)}
        onUsePromo={(pr) => {
          setAppliedPromoTitle(pr.title);
          triggerToast(`Promo "${pr.title}" aktif pada keranjang belanja Anda.`);
          setActiveTab('cart');
        }}
      />
      <DeliveryAddressModal
        open={addressModalOpen}
        address={outletAddress}
        phone={outletPhone}
        lat={CUSTOMER_OUTLET_PROFILE.lat}
        lng={CUSTOMER_OUTLET_PROFILE.lng}
        outletName={outletName}
        onClose={() => setAddressModalOpen(false)}
        onSave={(newAddr, newPhone) => {
          setOutletAddress(newAddr);
          setOutletPhone(newPhone);
          triggerToast('Alamat & nomor kontak pengiriman diperbarui.');
        }}
      />
      <CustomerOrderDetailModal
        order={orderDetailModal}
        onClose={() => setOrderDetailModal(null)}
        onOpenWorkspace={() => setWorkspaceModalOpen(true)}
      />
      <OrderSuccessModal
        result={orderSuccessResult}
        onClose={() => setOrderSuccessResult(null)}
        onTrackOrder={() => {
          setOrderSuccessResult(null);
          setActiveTab('order_status');
        }}
        onBrowseCatalog={() => {
          setOrderSuccessResult(null);
          setActiveTab('catalog');
        }}
      />
      <CancelCustomerOrderModal
        key={cancelOrderModal?.id ?? 'cancel-closed'}
        order={cancelOrderModal}
        onClose={() => setCancelOrderModal(null)}
        onConfirmCancel={(orderId, reason) => {
          setOrders((prev) =>
            prev.map((o) =>
              o.id === orderId
                ? {
                    ...o,
                    status: 'Batal',
                    cancelReason: reason,
                    timeline: [
                      ...o.timeline,
                      {
                        title: `Dibatalkan oleh outlet: ${reason}`,
                        timestamp: 'Baru saja',
                        completed: true,
                      },
                    ],
                  }
                : o
            )
          );
          triggerToast(`Pesanan ${orderId} telah dibatalkan.`);
        }}
      />
      <CustomerNotificationsModal
        open={notificationsOpen}
        notifications={notifications}
        onMarkRead={() =>
          setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
        }
        onClose={() => setNotificationsOpen(false)}
      />
      <CustomerSupportModal
        open={supportModalOpen}
        outletName={outletName}
        onClose={() => setSupportModalOpen(false)}
      />
      <CustomerWorkspaceModal
        open={workspaceModalOpen}
        outletProfile={outletObjForWorkspace}
        onClose={() => setWorkspaceModalOpen(false)}
      />

      {/* Catalog Filter Modal */}
      <Modal
        open={filterModalOpen}
        onClose={() => setFilterModalOpen(false)}
        title="Filter Katalog Produk"
        maxWidthClass="max-w-sm"
      >
        <div className="space-y-3 text-xs">
          <p className="font-semibold">Kategori Produk</p>
          <div className="grid grid-cols-2 gap-2">
            {(
              ['Semua', 'Minuman', 'Makanan', 'Perawatan', 'Lainnya'] as const
            ).map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => {
                  setCatalogCategory(cat);
                  setFilterModalOpen(false);
                }}
                className={`rounded-xl py-2 font-bold cursor-pointer ${
                  catalogCategory === cat
                    ? 'bg-[#348CB2] text-white'
                    : 'border border-[var(--color-border)]'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </Modal>

      {/* Edit Outlet Profile Modal */}
      <Modal
        open={profileEditModalOpen}
        onClose={() => setProfileEditModalOpen(false)}
        title="Profil Outlet Terdaftar"
        subtitle="Perbarui informasi PIC & kontak outlet Anda"
        maxWidthClass="max-w-md"
      >
        <div className="space-y-3 text-xs">
          <div>
            <label className="block font-semibold mb-1">Nama Outlet</label>
            <input
              type="text"
              value={outletName}
              onChange={(e) => setOutletName(e.target.value)}
              className="w-full rounded-xl border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-3.5 py-2"
            />
          </div>
          <div>
            <label className="block font-semibold mb-1">PIC / Pemilik</label>
            <input
              type="text"
              value={picName}
              onChange={(e) => setPicName(e.target.value)}
              className="w-full rounded-xl border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-3.5 py-2"
            />
          </div>
          <div>
            <label className="block font-semibold mb-1">No. HP / WA</label>
            <input
              type="tel"
              value={outletPhone}
              onChange={(e) => setOutletPhone(e.target.value)}
              className="w-full rounded-xl border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-3.5 py-2 tabular-nums"
            />
          </div>
          <div>
            <label className="block font-semibold mb-1">Alamat</label>
            <input
              type="text"
              value={outletAddress}
              onChange={(e) => setOutletAddress(e.target.value)}
              className="w-full rounded-xl border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-3.5 py-2"
            />
          </div>
          <button
            type="button"
            onClick={() => {
              setProfileEditModalOpen(false);
              setAddressModalOpen(true);
            }}
            className="w-full inline-flex items-center justify-center gap-1.5 rounded-xl border border-[#348CB2] py-2 font-bold text-[#236D91] dark:text-[#87CEEB] hover:bg-[#F3FAFC] dark:hover:bg-[#19394B] cursor-pointer"
          >
            <MapPin className="h-4 w-4" />
            <span>Atur Titik Lokasi GPS (Google Maps)</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setProfileEditModalOpen(false);
              triggerToast('Data profil outlet berhasil disimpan.');
            }}
            className="w-full rounded-xl bg-[#348CB2] py-2.5 font-bold text-white cursor-pointer"
          >
            Simpan Perubahan
          </button>
        </div>
      </Modal>

      <CustomerAccountSettingsModal
        key={accountSettingsOpen ? 'acc-open' : 'acc-closed'}
        open={accountSettingsOpen}
        email={outletEmail}
        theme={theme}
        notifPrefs={notifPrefs}
        onToggleTheme={toggleTheme}
        onToggleNotifPref={(key) =>
          setNotifPrefs((prev) => ({ ...prev, [key]: !prev[key] }))
        }
        onChangePassword={(newPwd) => {
          setLoginPassword(newPwd);
          triggerToast('Kata sandi akun outlet berhasil diperbarui.');
        }}
        onClose={() => setAccountSettingsOpen(false)}
      />

      {/* About Modal */}
      <Modal
        open={aboutModalOpen}
        onClose={() => setAboutModalOpen(false)}
        title="Tentang SalesX-Ai Customer Portal"
        subtitle="PWA v1.0.0 · PT Maju Distribusi"
        maxWidthClass="max-w-sm"
      >
        <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed">
          Portal Pelanggan B2B SalesX-Ai mempermudah outlet melakukan pemesanan
          mandiri, mengecek harga kontrak resmi, melacak pengiriman armada,
          serta menukar poin SmartReward.
        </p>
      </Modal>

      {/* Logout Confirm Modal */}
      <Modal
        open={logoutConfirmOpen}
        onClose={() => setLogoutConfirmOpen(false)}
        title="Keluar dari Customer Portal?"
        maxWidthClass="max-w-sm"
      >
        <div className="flex justify-end gap-2 pt-2 text-xs">
          <button
            type="button"
            onClick={() => setLogoutConfirmOpen(false)}
            className="rounded-xl border border-[var(--color-border)] px-4 py-2 font-semibold cursor-pointer"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={() => {
              setLogoutConfirmOpen(false);
              void auth.signOut('local').then(() => setAuthStage('splash'));
            }}
            className="rounded-xl bg-red-600 px-4 py-2 font-bold text-white cursor-pointer"
          >
            Ya, Keluar
          </button>
        </div>
      </Modal>
    </div>
  );
}
