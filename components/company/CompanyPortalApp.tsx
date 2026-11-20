'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  LayoutDashboard,
  TrendingUp,
  Wallet,
  Building2,
  Users,
  Map as MapIcon,
  Store,
  Package,
  Target,
  Navigation,
  Route,
  CalendarCheck,
  ShoppingBag,
  Tag,
  FileText,
  Settings,
  Award,
  Bell,
  Search,
  Plus,
  ChevronRight,
  Lock,
  Mail,
  Eye,
  EyeOff,
  Sun,
  Moon,
  LogOut,
  Menu,
  X,
  ArrowLeft,
  CheckCircle2,
  MapPin,
  Clock,
  SlidersHorizontal,
  Sparkles,
} from 'lucide-react';
import { BrandLogo } from '@/components/common/BrandLogo';
import type { MasterDataChangedEvent } from '@salesx-ai/api-contracts';
import { Modal } from '@/components/common/Modal';
import { PWAInstallButton } from '@/components/common/PWAInstallButton';
import { SalesGoogleMap } from '@/components/maps/SalesGoogleMap';
import { useSalesXAuth } from '@/components/providers/AppProviders';
import { PortalSignupAction } from '@/components/auth/PortalSignupAction';
import {
  COMPANY_PROFILE,
  COMPANY_MONTHLY_TRENDS,
  COMPANY_ORDER_COMPOSITION,
  COMPANY_REPORTS_LIST,
  INITIAL_PRODUCTS,
  INITIAL_VISITS,
  INITIAL_COMPANY_ORDERS,
  INITIAL_PROMOTIONS,
  INITIAL_COMPANY_INTEGRATIONS,
  INITIAL_NOTIFICATIONS,
  INITIAL_COMPANY_ATTENDANCE,
  INITIAL_GPS_AUDIT_LOGS,
  CUSTOMER_INITIAL_VOUCHERS,
  formatRupiah,
  type BranchItem,
  type TerritoryItem,
  type TeamMemberItem,
  type Outlet,
  type Product,
  type CompanyOrderItem,
  type CompanyAttendanceItem,
  type PromotionItem,
  type CompanyIntegrationSetting,
  type NotificationItem,
  type VisitItem,
} from '@/lib/salesx-data';
import {
  RegisterCompanyModal,
  AddBranchModal,
  BranchDetailModal,
  AddTeamMemberModal,
  AddTerritoryModal,
  AddOutletCompanyModal,
  AddProductModal,
  AddPromotionModal,
  TeamTelemetryModal,
  GpsJourneyDetailModal,
  CompanyOrderApprovalModal,
  ReportPreviewModal,
  IntegrationConfigModal,
  CompanyNotificationsModal,
  AttendanceDetailModal,
  EditUserAssignmentModal,
  EditProductCompanyModal,
  SetTargetModal,
  PromoDetailCompanyModal,
  EditCompanyMasterDataModal,
  type CompanyMasterDataResource,
} from '@/components/company/CompanyModals';

export type CompanyTabId =
  | 'dashboard'
  | 'analytics'
  | 'financial'
  | 'branches'
  | 'team'
  | 'territories'
  | 'outlets'
  | 'products'
  | 'targets'
  | 'gps_live'
  | 'gps_history'
  | 'visits'
  | 'attendance'
  | 'orders'
  | 'promotions'
  | 'reports'
  | 'integrations'
  | 'master_perf';

function parseMasterDataCsv(source: string): Array<Record<string, string>> {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = '';
  let quoted = false;
  for (let index = 0; index < source.length; index += 1) {
    const char = source[index];
    if (char === '"' && quoted && source[index + 1] === '"') { cell += '"'; index += 1; }
    else if (char === '"') quoted = !quoted;
    else if (char === ',' && !quoted) { row.push(cell); cell = ''; }
    else if ((char === '\n' || char === '\r') && !quoted) {
      if (char === '\r' && source[index + 1] === '\n') index += 1;
      row.push(cell); if (row.some((value) => value.trim())) rows.push(row);
      row = []; cell = '';
    } else cell += char;
  }
  row.push(cell); if (row.some((value) => value.trim())) rows.push(row);
  const headers = (rows.shift() ?? []).map((value) => value.trim());
  return rows.map((values) => Object.fromEntries(headers.map((header, index) => [header, values[index]?.trim() ?? ''])));
}

const asText = (value: unknown): string => typeof value === 'string' ? value : '';
const asNumber = (value: unknown): number => typeof value === 'number' && Number.isFinite(value) ? value : 0;
const masterCode = (value: string): string => value.normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toUpperCase().replace(/[^A-Z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40) || 'MASTER';
type OrganizationMemberRecord = { user_id: string; display_name?: string | null; email?: string | null; phone?: string | null; title?: string | null; status?: string; branch_id?: string | null };
type TeamRecord = Record<string, unknown>;
const EMPTY_TEAM_MEMBER: TeamMemberItem = {
  id: '', name: 'Belum ada personel', role: 'Sales Rep', area: '', branchId: '', phone: '',
  status: 'Offline', currentLocation: 'Belum tersedia', speedKmh: 0, accuracyM: 0,
  lastUpdate: 'Belum tersedia', lat: 0, lng: 0, monthlyOrderValue: 0, visitsToday: 0, targetVisits: 0,
};

const SIDEBAR_GROUPS: Array<{
  group: string;
  items: Array<{
    id: CompanyTabId;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
  }>;
}> = [
  {
    group: 'Ringkasan Eksekutif',
    items: [
      { id: 'dashboard', label: 'Beranda Perusahaan', icon: LayoutDashboard },
      { id: 'analytics', label: 'Analitik & Tren', icon: TrendingUp },
      { id: 'financial', label: 'Financial Overview', icon: Wallet },
      { id: 'targets', label: 'Target & KPI', icon: Target },
    ],
  },
  {
    group: 'Struktur & Master Data',
    items: [
      { id: 'branches', label: 'Manajemen Cabang', icon: Building2 },
      { id: 'team', label: 'Manajemen Tim', icon: Users },
      { id: 'territories', label: 'Manajemen Teritori', icon: MapIcon },
      { id: 'outlets', label: 'Manajemen Outlet', icon: Store },
      { id: 'products', label: 'Produk & Katalog', icon: Package },
      { id: 'master_perf', label: 'Master Data & Ranking', icon: Award },
    ],
  },
  {
    group: 'Operasional & GPS',
    items: [
      { id: 'gps_live', label: 'GPS Monitoring', icon: Navigation },
      { id: 'gps_history', label: 'GPS History', icon: Route },
      { id: 'visits', label: 'Visit Monitoring', icon: CalendarCheck },
      { id: 'attendance', label: 'Absensi & Geofence', icon: Clock },
      { id: 'orders', label: 'Order Overview', icon: ShoppingBag },
      { id: 'promotions', label: 'Manajemen Promosi', icon: Tag },
    ],
  },
  {
    group: 'Laporan & Sistem',
    items: [
      { id: 'reports', label: 'Laporan', icon: FileText },
      { id: 'integrations', label: 'Integration Settings', icon: Settings },
    ],
  },
];

export function CompanyPortalApp() {
  const auth = useSalesXAuth();
  const visiblePortalSwitchLinks = [
    {href:"/portal",label:"Sales Portal",portal:"sales"},
    {href:"/distributor",label:"Distributor",portal:"distributor"},
    {href:"/principal",label:"Principal",portal:"principal"},
    {href:"/supervisor",label:"Supervisor",portal:"supervisor"},
    {href:"/customer",label:"Customer",portal:"customer"},
    {href:"/super-admin",label:"Super Admin",portal:"super_admin"},
  ] as const;
  // Authentication & Theme
  const authenticated = auth.status === 'authenticated';
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [workspaceAuthLoading, setWorkspaceAuthLoading] = useState(false);
  const [forgotModalOpen, setForgotModalOpen] = useState(false);
  const [forgotSent, setForgotSent] = useState(false);
  const [registerModalOpen, setRegisterModalOpen] = useState(false);
  const [logoutConfirmOpen, setLogoutConfirmOpen] = useState(false);

  // Navigation
  const [activeTab, setActiveTab] = useState<CompanyTabId>('dashboard');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [period, setPeriod] = useState<'Bulan Ini' | 'Kuartal Ini'>('Bulan Ini');

  // Interactive Entities State
  const [companyName, setCompanyName] = useState(COMPANY_PROFILE.name);
  const [companyTargetOrder, setCompanyTargetOrder] = useState(
    COMPANY_PROFILE.monthlyTargetOrder
  );
  const [branches, setBranches] = useState<BranchItem[]>([]);
  const [territories, setTerritories] =
    useState<TerritoryItem[]>([]);
  const [teamMembers, setTeamMembers] = useState<TeamMemberItem[]>([]);
  const [teams, setTeams] = useState<TeamRecord[]>([]);
  const [organizationMembers, setOrganizationMembers] = useState<OrganizationMemberRecord[]>([]);
  const [outlets, setOutlets] = useState<Outlet[]>([]);
  const [products, setProducts] = useState<Product[]>(INITIAL_PRODUCTS);
  const [orders, setOrders] = useState<CompanyOrderItem[]>(
    INITIAL_COMPANY_ORDERS
  );
  const [promotions, setPromotions] =
    useState<PromotionItem[]>(INITIAL_PROMOTIONS);
  const [integrations, setIntegrations] = useState<
    CompanyIntegrationSetting[]
  >(INITIAL_COMPANY_INTEGRATIONS);
  const [notifications, setNotifications] = useState<NotificationItem[]>(
    INITIAL_NOTIFICATIONS
  );
  const [masterDataLoading, setMasterDataLoading] = useState(false);
  const [masterDataError, setMasterDataError] = useState<string | null>(null);
  const [masterDataRevision, setMasterDataRevision] = useState(0);
  const [assignmentHistory, setAssignmentHistory] = useState<Array<Record<string, unknown>>>([]);
  const [masterDataRows, setMasterDataRows] = useState<Record<CompanyMasterDataResource, Array<Record<string, unknown>>>>({ branches: [], teams: [], territories: [], outlets: [] });
  const [editingMasterData, setEditingMasterData] = useState<{ resource: CompanyMasterDataResource; record: Record<string, unknown> } | null>(null);
  const [newSalesUserId, setNewSalesUserId] = useState('');
  const [newSalesEmployeeCode, setNewSalesEmployeeCode] = useState('');
  const [newSalesTeamId, setNewSalesTeamId] = useState('');
  const [newSalesTerritoryId, setNewSalesTerritoryId] = useState('');
  const [selectedAssignmentProfileId, setSelectedAssignmentProfileId] = useState('');
  const [selectedAssignmentOutletId, setSelectedAssignmentOutletId] = useState('');
  const [masterDataTransferBusy, setMasterDataTransferBusy] = useState(false);
  const [attendanceRecords, setAttendanceRecords] = useState<
    CompanyAttendanceItem[]
  >(INITIAL_COMPANY_ATTENDANCE);

  // Sub-view Filters & Selections
  const [analyticsSubTab, setAnalyticsSubTab] = useState<
    'Penjualan' | 'Order' | 'Outlet' | 'Tim'
  >('Penjualan');
  const [branchSearch, setBranchSearch] = useState('');
  const [teamSubTab, setTeamSubTab] = useState<'Struktur Tim' | 'Penugasan'>(
    'Struktur Tim'
  );
  const [outletSearch, setOutletSearch] = useState('');
  const [outletFilter, setOutletFilter] = useState<
    'Semua' | 'Aktif' | 'Nonaktif'
  >('Semua');
  const [productSubTab, setProductSubTab] = useState<
    'Produk' | 'Kategori' | 'Harga' | 'Stok'
  >('Produk');
  const [productSearch, setProductSearch] = useState('');
  const [gpsSubTab, setGpsSubTab] = useState<'Realtime' | 'Daftar Tim'>(
    'Realtime'
  );
  const [gpsAuditOpen, setGpsAuditOpen] = useState(false);
  const [selectedTeamId, setSelectedTeamId] = useState('');
  const [historyStaffId, setHistoryStaffId] = useState('');
  const [historyDate, setHistoryDate] = useState('2025-06-24');
  const [visitSubTab, setVisitSubTab] = useState<
    'Jadwal' | 'Realisasi' | 'Peta'
  >('Jadwal');
  const [visitDateKey, setVisitDateKey] = useState<
    'today' | 'tomorrow' | 'thursday'
  >('today');
  const [orderSubTab, setOrderSubTab] = useState<
    'Semua' | 'Pending' | 'Diproses' | 'Dikirim' | 'Selesai' | 'Batal'
  >('Semua');
  const [orderSearch, setOrderSearch] = useState('');
  const [promoSubTab, setPromoSubTab] = useState<
    'Program' | 'Campaign' | 'Voucher'
  >('Program');
  const [masterSubTab, setMasterSubTab] = useState<
    'Master Data' | 'Evaluasi Tim' | 'Ranking'
  >('Ranking');
  const [rankingSubTab, setRankingSubTab] = useState<
    'Ranking Sales' | 'Ranking Cabang' | 'Ranking Outlet'
  >('Ranking Sales');

  // Modals State
  const [addBranchOpen, setAddBranchOpen] = useState(false);
  const [selectedBranch, setSelectedBranch] = useState<BranchItem | null>(null);
  const [addTeamOpen, setAddTeamOpen] = useState(false);
  const [addTerritoryOpen, setAddTerritoryOpen] = useState(false);
  const [addOutletOpen, setAddOutletOpen] = useState(false);
  const [selectedOutletDetail, setSelectedOutletDetail] =
    useState<Outlet | null>(null);
  const [addProductOpen, setAddProductOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [addPromoOpen, setAddPromoOpen] = useState(false);
  const [selectedPromoDetail, setSelectedPromoDetail] =
    useState<PromotionItem | null>(null);
  const [telemetryMember, setTelemetryMember] =
    useState<TeamMemberItem | null>(null);
  const [editingUserAssignment, setEditingUserAssignment] =
    useState<TeamMemberItem | null>(null);
  const [journeyDetailOpen, setJourneyDetailOpen] = useState(false);
  const [selectedOrderApproval, setSelectedOrderApproval] =
    useState<CompanyOrderItem | null>(null);
  const [selectedReport, setSelectedReport] = useState<
    (typeof COMPANY_REPORTS_LIST)[number] | null
  >(null);
  const [selectedIntegration, setSelectedIntegration] =
    useState<CompanyIntegrationSetting | null>(null);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [visitEvidence, setVisitEvidence] = useState<VisitItem | null>(null);
  const [selectedAttendance, setSelectedAttendance] =
    useState<CompanyAttendanceItem | null>(null);
  const [targetModalOpen, setTargetModalOpen] = useState(false);

  const unreadCount = useMemo(
    () => notifications.filter((n) => !n.read).length,
    [notifications]
  );

  const toggleTheme = () => {
    const next = theme === 'light' ? 'dark' : 'light';
    setTheme(next);
    if (typeof document !== 'undefined') {
      document.documentElement.classList.toggle('dark', next === 'dark');
    }
  };


  useEffect(() => {
    const organizationId = auth.activeOrganizationId;
    const api = auth.apiClient;
    if (auth.status !== 'authenticated' || !organizationId || !api) {
      setBranches([]);
      setTerritories([]);
      setOutlets([]);
      setTeams([]);
      setTeamMembers([]);
      setOrganizationMembers([]);
      setAssignmentHistory([]);
      setMasterDataRows({ branches: [], teams: [], territories: [], outlets: [] });
      setMasterDataLoading(false);
      return;
    }
    let cancelled = false;
    setMasterDataLoading(true);
    setMasterDataError(null);
    Promise.all([
      auth.canPerformApiAction('master.branches.read') ? api.listBranches(organizationId) : Promise.resolve([]),
      auth.canPerformApiAction('master.territories.read') ? api.listTerritories(organizationId) : Promise.resolve([]),
      auth.canPerformApiAction('master.outlets.read') ? api.listOutlets(organizationId) : Promise.resolve([]),
      auth.canPerformApiAction('master.teams.read') ? api.listTeams(organizationId) : Promise.resolve([]),
      auth.canPerformApiAction('master.sales_profiles.read') ? api.listSalesProfiles(organizationId) : Promise.resolve([]),
      auth.canPerformApiAction('organization.members.read') ? api.listOrganizationMembers(organizationId) : Promise.resolve([]),
      auth.canPerformApiAction('master.assignments.read') ? api.listOutletAssignments(organizationId) : Promise.resolve([]),
    ]).then(([branchRows, territoryRows, outletRows, teamRows, profileRows, memberRows, assignmentRows]) => {
      if (cancelled) return;
      const nextBranches: BranchItem[] = branchRows.map((row) => ({
        id: String(row.id), name: asText(row.name), city: asText(row.city),
        address: asText(row.address), managerName: asText(row.manager_name),
        phone: asText(row.phone), salesCount: 0, outletCount: 0,
        monthlyTarget: 0, monthlyRealized: 0,
        status: row.status === 'active' ? 'Aktif' : 'Nonaktif',
        lat: asNumber(row.latitude), lng: asNumber(row.longitude),
      }));
      const branchNames = new Map(nextBranches.map((branch) => [branch.id, branch.name]));
      const nextTerritories: TerritoryItem[] = territoryRows.map((row) => ({
        id: String(row.id), name: asText(row.name),
        branchName: branchNames.get(asText(row.branch_id)) ?? '', branchId: asText(row.branch_id),
        outletCount: 0, salesAssigned: 0, coveragePct: 0,
        colorHex: '#348CB2', lat: 0, lng: 0, status: row.status === 'active' ? 'Aktif' : 'Nonaktif',
      }));
      const nextOutlets: Outlet[] = outletRows.map((row) => ({
        id: String(row.id), name: asText(row.name), city: asText(row.city),
        address: asText(row.address), distanceKm: 0, isPriority: false,
        visitToday: false, status: row.status === 'active' ? 'Aktif' : 'Nonaktif',
        category: asText(row.category), picName: asText(row.pic_name),
        phone: asText(row.phone), email: '', lat: asNumber(row.latitude),
        lng: asNumber(row.longitude), lastOrderTotal: 0, lastVisitDate: '',
      }));
      const nextTeams = teamRows as TeamRecord[];
      const members = memberRows as OrganizationMemberRecord[];
      const membersById = new Map(members.map((member) => [member.user_id, member]));
      const teamsById = new Map(nextTeams.map((team) => [asText(team.id), team]));
      const nextTeamMembers: TeamMemberItem[] = (profileRows as Array<Record<string, unknown>>).map((profile) => {
        const userId = asText(profile.user_id);
        const member = membersById.get(userId);
        const team = teamsById.get(asText(profile.team_id));
        const title = asText(member?.title).toLowerCase();
        const role: TeamMemberItem['role'] = title.includes('supervisor') ? 'Supervisor'
          : title.includes('area manager') ? 'Area Manager'
          : title.includes('direktur') ? 'Direktur Operasional' : 'Sales Rep';
        const branchId = asText(team?.branch_id);
        const branch = nextBranches.find((item) => item.id === branchId);
        return {
          id: asText(profile.id), userId, teamId: asText(profile.team_id), managerUserId: asText(profile.manager_user_id) || undefined,
          name: asText(profile.display_name) || asText(member?.display_name) || asText(member?.email) || 'User',
          role, area: asText(team?.name) || 'Belum ditempatkan ke tim', branchId,
          phone: asText(profile.phone) || asText(member?.phone), territoryId: asText(profile.territory_id), status: profile.status === 'active' ? 'Online' : 'Offline',
          currentLocation: 'Belum tersedia', speedKmh: 0, accuracyM: 0, lastUpdate: 'Belum tersedia',
          lat: 0, lng: 0, monthlyOrderValue: 0, visitsToday: 0, targetVisits: 0,
        };
      });
      setMasterDataRows({ branches: branchRows as Array<Record<string, unknown>>, teams: teamRows as Array<Record<string, unknown>>, territories: territoryRows as Array<Record<string, unknown>>, outlets: outletRows as Array<Record<string, unknown>> });
      setBranches(nextBranches);
      setTerritories(nextTerritories);
      setOutlets(nextOutlets);
      setTeams(nextTeams);
      setOrganizationMembers(members);
      setTeamMembers(nextTeamMembers);
      setAssignmentHistory(assignmentRows as unknown as Array<Record<string, unknown>>);
      setSelectedAssignmentProfileId((current) => current || nextTeamMembers[0]?.id || '');
      setSelectedAssignmentOutletId((current) => current || nextOutlets[0]?.id || '');
      setSelectedTeamId((current) => current || nextTeamMembers[0]?.id || '');
      setHistoryStaffId((current) => current || nextTeamMembers[0]?.id || '');
    }).catch((error: unknown) => {
      if (!cancelled) setMasterDataError(error instanceof Error ? error.message : 'Master data gagal dimuat dari FastAPI.');
    }).finally(() => {
      if (!cancelled) setMasterDataLoading(false);
    });
    return () => { cancelled = true; };
  }, [auth.status, auth.activeOrganizationId, auth.apiClient, auth.canPerformApiAction, masterDataRevision]);

  const persistBranch = async (branch: BranchItem) => {
    if (!auth.canPerformApiAction('master.branches.create')) throw new Error('Akses membuat cabang tidak diizinkan.');
    if (!auth.apiClient || !auth.activeOrganizationId) throw new Error('Pilih organisasi aktif sebelum mengelola cabang.');
    const row = await auth.apiClient.createBranch(auth.activeOrganizationId, {
      code: masterCode(branch.name), name: branch.name, city: branch.city,
      address: branch.address, manager_name: branch.managerName, phone: branch.phone, status: 'active',
      latitude: branch.lat || undefined, longitude: branch.lng || undefined,
    });
    const created: BranchItem = {
      id: String(row.id), name: asText(row.name), city: asText(row.city),
      address: asText(row.address), managerName: asText(row.manager_name), phone: asText(row.phone),
      salesCount: 0, outletCount: 0, monthlyTarget: 0, monthlyRealized: 0,
      status: row.status === 'active' ? 'Aktif' : 'Nonaktif',
      lat: asNumber(row.latitude), lng: asNumber(row.longitude),
    };
    setBranches((current) => [created, ...current]);
  };

  const persistTerritory = async (territory: TerritoryItem) => {
    if (!auth.canPerformApiAction('master.territories.create')) throw new Error('Akses membuat teritori tidak diizinkan.');
    if (!auth.apiClient || !auth.activeOrganizationId) throw new Error('Pilih organisasi aktif sebelum mengelola teritori.');
    const branch = branches.find((item) => item.name === territory.branchName);
    const row = await auth.apiClient.createTerritory(auth.activeOrganizationId, {
      code: masterCode(territory.name), name: territory.name, branch_id: branch?.id, status: 'active',
    });
    setTerritories((current) => [{
      id: String(row.id), name: asText(row.name), branchName: territory.branchName, branchId: asText(row.branch_id),
      outletCount: 0, salesAssigned: 0, coveragePct: 0, colorHex: '#348CB2', lat: 0, lng: 0,
    }, ...current]);
  };

  const persistOutlet = async (outlet: Outlet) => {
    if (!auth.canPerformApiAction('master.outlets.create')) throw new Error('Akses membuat outlet tidak diizinkan.');
    if (!auth.apiClient || !auth.activeOrganizationId) throw new Error('Pilih organisasi aktif sebelum mengelola outlet.');
    const row = await auth.apiClient.createOutlet(auth.activeOrganizationId, {
      code: masterCode(outlet.name), name: outlet.name, city: outlet.city, address: outlet.address,
      category: outlet.category, pic_name: outlet.picName, phone: outlet.phone, branch_id: outlet.branchId, territory_id: outlet.territoryId, status: 'active',
    });
    setOutlets((current) => [{
      id: String(row.id), name: asText(row.name), city: asText(row.city), address: asText(row.address),
      distanceKm: 0, isPriority: false, visitToday: false, status: 'Aktif',
      category: asText(row.category), picName: asText(row.pic_name), phone: asText(row.phone),
      email: '', lat: 0, lng: 0, lastOrderTotal: 0, lastVisitDate: '',
    }, ...current]);
  };


  useEffect(() => {
    if (auth.status !== 'authenticated' || !auth.activeOrganizationId || !auth.canPerformApiAction('master.data.events.read')) return;
    const organizationId = auth.activeOrganizationId;
    const source = new EventSource('/api/backend/api/v1/organizations/' + encodeURIComponent(organizationId) + '/master-data/events', { withCredentials: true });
    let refreshTimer: ReturnType<typeof setTimeout> | undefined;
    source.addEventListener('master_data.changed', (event) => {
      let payload: MasterDataChangedEvent;
      try {
        payload = JSON.parse((event as MessageEvent<string>).data) as MasterDataChangedEvent;
      } catch {
        return;
      }
      if (payload.organization_id !== organizationId) return;
      if (refreshTimer) clearTimeout(refreshTimer);
      refreshTimer = setTimeout(() => setMasterDataRevision((value) => value + 1), 150);
    });
    source.onerror = () => { /* EventSource reconnects automatically; FastAPI remains the source of truth. */ };
    return () => { if (refreshTimer) clearTimeout(refreshTimer); source.close(); };
  }, [auth.status, auth.activeOrganizationId, auth.canPerformApiAction]);

  const createSalesProfile = async () => {
    if (!auth.canPerformApiAction('master.sales_profiles.create')) throw new Error('Akses membuat sales profile tidak diizinkan.');
    if (!auth.apiClient || !auth.activeOrganizationId || !newSalesUserId || !newSalesTeamId || !newSalesTerritoryId) throw new Error('Pilih anggota aktif, tim, dan teritori.');
    await auth.apiClient.createSalesProfile(auth.activeOrganizationId, {
      user_id: newSalesUserId, employee_code: newSalesEmployeeCode.trim() || undefined, team_id: newSalesTeamId, territory_id: newSalesTerritoryId, status: 'active',
    });
    setNewSalesUserId('');
    setNewSalesEmployeeCode('');
    setNewSalesTeamId('');
    setNewSalesTerritoryId('');
    setMasterDataRevision((value) => value + 1);
  };

  const assignOutletToSalesProfile = async () => {
    if (!auth.canPerformApiAction('master.assignments.manage')) throw new Error('Akses assignment outlet tidak diizinkan.');
    if (!auth.apiClient || !auth.activeOrganizationId || !selectedAssignmentOutletId || !selectedAssignmentProfileId) {
      throw new Error('Pilih outlet dan sales profile aktif.');
    }
    await auth.apiClient.assignOutlet(auth.activeOrganizationId, selectedAssignmentOutletId, {
      sales_profile_id: selectedAssignmentProfileId, note: 'Assignment melalui Company Portal',
    });
    const rows = await auth.apiClient.listOutletAssignments(auth.activeOrganizationId);
    setAssignmentHistory(rows as unknown as Array<Record<string, unknown>>);
  };

  const openMasterDataEdit = (resource: CompanyMasterDataResource, id: string) => {
    const record = masterDataRows[resource].find((item) => asText(item.id) === id);
    if (!record) { setMasterDataError('Data master tidak ditemukan. Muat ulang daftar lalu coba kembali.'); return; }
    setEditingMasterData({ resource, record });
  };

  const saveMasterDataEdit = async (resource: CompanyMasterDataResource, id: string, values: Record<string, unknown>) => {
    const api = auth.apiClient;
    const organizationId = auth.activeOrganizationId;
    if (!api || !organizationId) throw new Error('Pilih organisasi aktif terlebih dahulu.');
    const payload = values as Parameters<typeof api.updateBranch>[2];
    if (resource === 'branches') {
      if (!auth.canPerformApiAction('master.branches.update')) throw new Error('Akses edit cabang tidak diizinkan.');
      await api.updateBranch(organizationId, id, payload);
    } else if (resource === 'teams') {
      if (!auth.canPerformApiAction('master.teams.update')) throw new Error('Akses edit tim tidak diizinkan.');
      await api.updateTeam(organizationId, id, payload);
    } else if (resource === 'territories') {
      if (!auth.canPerformApiAction('master.territories.update')) throw new Error('Akses edit teritori tidak diizinkan.');
      await api.updateTerritory(organizationId, id, payload);
    } else {
      if (!auth.canPerformApiAction('master.outlets.update')) throw new Error('Akses edit outlet tidak diizinkan.');
      await api.updateOutlet(organizationId, id, payload);
    }
    setEditingMasterData(null);
    setMasterDataRevision((value) => value + 1);
  };

  const unassignOutletAssignment = async (assignmentId: string) => {
    if (!auth.canPerformApiAction('master.assignments.unassign')) throw new Error('Akses unassignment tidak diizinkan.');
    if (!auth.apiClient || !auth.activeOrganizationId) throw new Error('Pilih organisasi aktif terlebih dahulu.');
    const reason = window.prompt('Alasan unassignment (opsional):', 'manual_unassign');
    if (reason === null) return;
    if (!window.confirm('Akhiri assignment outlet ini? Histori sebelumnya tetap disimpan.')) return;
    await auth.apiClient.unassignOutletAssignment(auth.activeOrganizationId, assignmentId, { reason: reason.trim() || 'manual_unassign' });
    const rows = await auth.apiClient.listOutletAssignments(auth.activeOrganizationId);
    setAssignmentHistory(rows as unknown as Array<Record<string, unknown>>);
    setMasterDataRevision((value) => value + 1);
  };

  const toggleTeamStatus = async (teamId: string) => {
    const team = teams.find((item) => asText(item.id) === teamId);
    if (!team || !auth.apiClient || !auth.activeOrganizationId || !auth.canPerformApiAction('master.teams.update')) return;
    const row = await auth.apiClient.updateTeam(auth.activeOrganizationId, teamId, {
      status: asText(team.status) === 'active' ? 'inactive' : 'active',
    });
    setTeams((current) => current.map((item) => asText(item.id) === teamId ? { ...item, ...row } : item));
    setMasterDataRevision((value) => value + 1);
  };

  const toggleTerritoryStatus = async (territoryId: string) => {
    const territory = territories.find((item) => item.id === territoryId);
    if (!territory || !auth.apiClient || !auth.activeOrganizationId || !auth.canPerformApiAction('master.territories.update')) return;
    const row = await auth.apiClient.updateTerritory(auth.activeOrganizationId, territoryId, {
      status: territory.status === 'Aktif' ? 'inactive' : 'active',
    });
    setTerritories((current) => current.map((item) => item.id === territoryId
      ? { ...item, status: row.status === 'active' ? 'Aktif' : 'Nonaktif' } : item));
    setMasterDataRevision((value) => value + 1);
  };

  const transferMasterData = async (resource: 'branches' | 'teams' | 'territories' | 'outlets' | 'sales_profiles', mode: 'import' | 'export', file?: File) => {
    if (!auth.apiClient || !auth.activeOrganizationId) throw new Error('Pilih organisasi aktif terlebih dahulu.');
    setMasterDataTransferBusy(true);
    setMasterDataError(null);
    try {
      if (mode === 'export') {
        const response = await auth.apiClient.exportMasterData(auth.activeOrganizationId, resource);
        if (!response.ok) throw new Error('Export master data gagal diproses oleh FastAPI.');
        const blob = new Blob([await response.text()], { type: 'text/csv;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const anchor = document.createElement('a');
        anchor.href = url; anchor.download = resource + '.csv'; anchor.click();
        URL.revokeObjectURL(url);
      } else {
        if (!file) return;
        const rows = parseMasterDataCsv(await file.text());
        if (!rows.length) throw new Error('File CSV tidak memiliki baris data.');
        const result = await auth.apiClient.importMasterData(auth.activeOrganizationId, resource, {
          idempotency_key: crypto.randomUUID(), rows,
        });
        setMasterDataError('Import ' + resource + ': ' + result.imported_rows + '/' + result.total_rows + ' berhasil, ' + result.failed_rows + ' gagal.' +
          (result.errors.length ? ' Baris bermasalah: ' + result.errors.slice(0, 5).map((item) => '#' + item.row + ' ' + item.message).join('; ') : ''));
        setMasterDataRevision((value) => value + 1);
      }
    } catch (error) {
      setMasterDataError(error instanceof Error ? error.message : 'Transfer master data gagal.');
      throw error;
    } finally {
      setMasterDataTransferBusy(false);
    }
  };

  const renderMasterDataTransfer = (resource: 'branches' | 'teams' | 'territories' | 'outlets' | 'sales_profiles') => {
    const canImport = auth.canPerformApiAction('master.data.import');
    const canExport = auth.canPerformApiAction('master.data.export');
    if (!canImport && !canExport) return null;
    return (
      <div className="flex flex-wrap items-center gap-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-3">
        {canImport && <label className="cursor-pointer rounded-lg border border-[var(--color-border-strong)] px-3 py-2 text-xs font-semibold">
          {masterDataTransferBusy ? 'Memproses…' : 'Import CSV'}
          <input type="file" accept=".csv,text/csv" className="sr-only" disabled={masterDataTransferBusy}
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) void transferMasterData(resource, 'import', file).catch(() => undefined);
              event.currentTarget.value = '';
            }} />
        </label>}
        {canExport && <button type="button" disabled={masterDataTransferBusy}
          onClick={() => void transferMasterData(resource, 'export').catch(() => undefined)}
          className="rounded-lg border border-[var(--color-border-strong)] px-3 py-2 text-xs font-semibold disabled:opacity-50">
          Export CSV
        </button>}
        <span className="text-[11px] text-[var(--color-text-muted)]">CSV · validasi per baris · audit & idempotency FastAPI</span>
      </div>
    );
  };

  const toggleBranchStatus = async (branchId: string) => {
    const branch = branches.find((item) => item.id === branchId);
    if (!auth.canPerformApiAction('master.branches.update') || !branch || !auth.apiClient || !auth.activeOrganizationId) return;
    const row = await auth.apiClient.updateBranch(auth.activeOrganizationId, branchId, {
      status: branch.status === 'Aktif' ? 'inactive' : 'active',
    });
    setBranches((current) => current.map((item) => item.id === branchId
      ? { ...item, status: row.status === 'active' ? 'Aktif' : 'Nonaktif' } : item));
  };

  const toggleOutletStatus = async (outletId: string) => {
    const outlet = outlets.find((item) => item.id === outletId);
    if (!auth.canPerformApiAction('master.outlets.update') || !outlet || !auth.apiClient || !auth.activeOrganizationId) return;
    const row = await auth.apiClient.updateOutlet(auth.activeOrganizationId, outletId, {
      status: outlet.status === 'Aktif' ? 'inactive' : 'active',
    });
    setOutlets((current) => current.map((item) => item.id === outletId
      ? { ...item, status: row.status === 'active' ? 'Aktif' : 'Nonaktif' } : item));
  };

  const selectedTeamMember =
    teamMembers.find((m) => m.id === selectedTeamId) || teamMembers[0] || EMPTY_TEAM_MEMBER;
  const historyStaff =
    teamMembers.find((m) => m.id === historyStaffId) || teamMembers[0] || EMPTY_TEAM_MEMBER;
  const hasTeamLocation = teamMembers.some((member) => member.lat !== 0 || member.lng !== 0);

  const territoryOutletsForMap: Outlet[] = useMemo(
    () =>
      territories.map((t) => ({
        id: t.id,
        name: t.name,
        city: t.branchName,
        address: `${t.outletCount} Outlet Terkelola · Coverage ${t.coveragePct}%`,
        distanceKm: 0,
        isPriority: true,
        visitToday: true,
        status: 'Aktif',
        category: 'Teritori',
        picName: t.branchName,
        phone: '-',
        email: '-',
        lat: t.lat,
        lng: t.lng,
        lastOrderTotal: t.outletCount * 4_500_000,
        lastVisitDate: 'Hari ini',
      })),
    [territories]
  );

  const teamOutletsForMap: Outlet[] = useMemo(
    () =>
      teamMembers.map((m) => ({
        id: m.id,
        name: `${m.name} (${m.status})`,
        city: m.area,
        address: `${m.currentLocation} · Update ${m.lastUpdate}`,
        distanceKm: 0,
        isPriority: m.status === 'Online',
        visitToday: true,
        status: m.status === 'Online' ? 'Aktif' : 'Nonaktif',
        category: m.role,
        picName: m.name,
        phone: m.phone,
        email: '-',
        lat: m.lat,
        lng: m.lng,
        lastOrderTotal: m.monthlyOrderValue,
        lastVisitDate: m.lastUpdate,
      })),
    [teamMembers]
  );

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginEmail.trim() || !loginPassword.trim()) {
      setLoginError('Masukkan Email Perusahaan dan kata sandi.');
      return;
    }
    setLoginError(null);
    void auth.signInWithPassword(loginEmail, loginPassword).catch(err => setLoginError(err instanceof Error ? err.message : 'Login gagal.'));
  };

  const handleGoogleLogin = async () => {
    setWorkspaceAuthLoading(true);
    setLoginError(null);
    try { await auth.signInWithOAuth('google'); }
    catch (err) { setLoginError(err instanceof Error ? err.message : 'Autentikasi Google Supabase gagal.'); setWorkspaceAuthLoading(false); }
  };

  /* ========================================================================
   * SCREEN 1: COMPANY PORTAL LOGIN
   * ======================================================================== */
  if (authenticated && !auth.canAccessPortal('company')) {
    return <main className="flex min-h-screen items-center justify-center p-6"><section className="max-w-md rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 text-center"><h1 className="text-lg font-bold">Akses portal tidak tersedia</h1><p className="mt-2 text-sm text-[var(--color-text-secondary)]">Role aktif tidak memiliki permission untuk portal ini.</p><button onClick={() => void auth.signOut('local')} className="mt-4 rounded-lg bg-[#236D91] px-4 py-2 text-white">Keluar</button></section></main>;
  }
  if (!authenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#E5F4F8] via-[#F3FAFC] to-[#F8FAFC] dark:from-[#0B1220] dark:via-[#111C2D] dark:to-[#0B1220] flex flex-col justify-between px-4 py-6 sm:px-6">
        <div className="mx-auto flex w-full max-w-md flex-wrap items-center justify-between gap-2">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-[#236D91] dark:text-[#87CEEB] hover:bg-white/70 dark:hover:bg-[#172438]"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Beranda</span>
          </Link>
          <div className="flex flex-wrap items-center justify-end gap-x-2 gap-y-1 text-xs font-semibold">
            <Link
              href="/portal"
              className="text-[#348CB2] dark:text-[#87CEEB] hover:underline"
            >
              Sales
            </Link>
            <span className="text-[var(--color-text-muted)]">·</span>
            <Link
              href="/distributor"
              className="text-[#348CB2] dark:text-[#87CEEB] hover:underline"
            >
              Distributor
            </Link>
            <span className="text-[var(--color-text-muted)]">·</span>
            <Link
              href="/principal"
              className="text-[#348CB2] dark:text-[#87CEEB] hover:underline"
            >
              Principal
            </Link>
            <span className="text-[var(--color-text-muted)]">·</span>
            <Link
              href="/supervisor"
              className="text-[#348CB2] dark:text-[#87CEEB] hover:underline"
            >
              Supervisor
            </Link>
            <span className="text-[var(--color-text-muted)]">·</span>
            <Link
              href="/customer"
              className="text-[#348CB2] dark:text-[#87CEEB] hover:underline"
            >
              Customer
            </Link>
            <span className="text-[var(--color-text-muted)]">·</span>
            <Link
              href="/super-admin"
              className="text-[#194F70] dark:text-[#87CEEB] hover:underline"
            >
              Super Admin
            </Link>
          </div>
        </div>

        <div className="mx-auto my-6 w-full max-w-md rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 sm:p-8 shadow-lg">
          <div className="flex flex-col items-center text-center">
            <BrandLogo subtitle="COMPANY PORTAL" />
            <p className="mt-4 text-sm text-[var(--color-text-secondary)] max-w-xs leading-relaxed">
              Portal Manajemen Perusahaan untuk mengelola tim, operasional,
              penjualan, dan performa bisnis secara terintegrasi.
            </p>
          </div>

          {loginError && (
            <div className="mt-4 rounded-xl border border-red-200 bg-red-50 dark:border-red-900/50 dark:bg-red-950/40 px-3.5 py-2.5 text-xs font-medium text-red-700 dark:text-red-300">
              {loginError}
            </div>
          )}

          <form onSubmit={handleLogin} className="mt-6 space-y-4">
            <div>
              <label className="block text-xs font-semibold text-[var(--color-text-primary)] mb-1.5">
                Email Perusahaan
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--color-text-muted)]" />
                <input
                  type="email"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  className="w-full rounded-xl border border-[var(--color-border-strong)] bg-[var(--color-surface)] pl-10 pr-4 py-2.5 text-sm focus:border-[#348CB2] focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[var(--color-text-primary)] mb-1.5">
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
                  onClick={() => setShowPassword((prev) => !prev)}
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
                  className="h-4 w-4 rounded border-[var(--color-border-strong)]"
                />
                <span>Ingat saya</span>
              </label>
              <button
                type="button"
                onClick={() => {
                  setForgotSent(false);
                  setForgotModalOpen(true);
                }}
                className="font-semibold text-[#348CB2] dark:text-[#87CEEB] hover:underline cursor-pointer"
              >
                Lupa password?
              </button>
            </div>

            <button
              type="submit"
              className="w-full rounded-xl bg-[#236D91] hover:bg-[#194F70] py-3 text-sm font-bold text-white shadow-sm transition-colors cursor-pointer"
            >
              Masuk
            </button>
          
            <PortalSignupAction email={loginEmail} password={loginPassword} onMessage={setLoginError} />
</form>

          <div className="my-4 flex items-center gap-3 text-xs text-[var(--color-text-muted)]">
            <div className="h-px flex-1 bg-[var(--color-border)]" />
            <span>atau</span>
            <div className="h-px flex-1 bg-[var(--color-border)]" />
          </div>

          <div className="space-y-2.5">
            <button
              type="button"
              onClick={() => setRegisterModalOpen(true)}
              className="w-full rounded-xl border border-[#348CB2] bg-[var(--color-surface)] py-2.5 text-sm font-semibold text-[#236D91] dark:text-[#87CEEB] hover:bg-[#F3FAFC] dark:hover:bg-[#19394B] cursor-pointer"
            >
              Daftar Perusahaan
            </button>

            <button
              type="button"
              onClick={handleGoogleLogin}
              disabled={workspaceAuthLoading}
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
                {workspaceAuthLoading
                  ? 'Menghubungkan Google...'
                  : 'Masuk dengan Google Workspace'}
              </span>
            </button>
          </div>
        </div>

        <p className="text-center text-xs text-[var(--color-text-muted)]">
          SalesX-Ai Enterprise Company Portal · Multi-Branch & Real-time Ops
        </p>

        <RegisterCompanyModal
          open={registerModalOpen}
          onClose={() => setRegisterModalOpen(false)}
          onSuccess={(newComp, newEmail) => {
            setCompanyName(newComp);
            setLoginEmail(newEmail);
          }}
        />

        <Modal
          open={forgotModalOpen}
          onClose={() => setForgotModalOpen(false)}
          title="Pemulihan Password Admin Perusahaan"
          subtitle="Tautan reset akan dikirim ke email admin terdaftar"
          maxWidthClass="max-w-sm"
        >
          <div className="space-y-4 text-xs">
            <input
              type="email"
              value={loginEmail}
              onChange={(e) => setLoginEmail(e.target.value)}
              className="w-full rounded-xl border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-3.5 py-2.5"
            />
            {forgotSent ? (
              <p className="rounded-xl bg-[#ECFDF5] p-3 text-[#047857]">
                Tautan pemulihan telah dikirim ke <strong>{loginEmail}</strong>.
              </p>
            ) : (
              <button
                type="button"
                onClick={() => { void auth.requestPasswordReset(loginEmail).then(() => setForgotSent(true)).catch(err => setLoginError(err instanceof Error ? err.message : 'Reset password gagal.')); }}
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
   * AUTHENTICATED COMPANY PORTAL SHELL
   * ======================================================================== */
  const currentTabTitle =
    SIDEBAR_GROUPS.flatMap((g) => g.items).find((i) => i.id === activeTab)
      ?.label || 'Company Portal';

  const factor = period === 'Kuartal Ini' ? 3 : 1;

  return (
    <div className="min-h-screen overflow-x-hidden bg-[var(--color-background)] text-[var(--color-text-primary)] flex flex-col lg:flex-row">
      {(masterDataLoading || masterDataError) && (
        <div className={`fixed top-0 inset-x-0 z-[60] px-4 py-2 text-center text-xs ${masterDataError ? 'bg-red-50 text-red-800 dark:bg-red-950 dark:text-red-200' : 'bg-sky-50 text-sky-800 dark:bg-sky-950 dark:text-sky-200'}`}>
          {masterDataError ?? 'Memuat master data tenant dari FastAPI…'}
        </div>
      )}
      {/* Desktop Left Sidebar */}
      <aside className="hidden lg:flex lg:w-[260px] lg:shrink-0 lg:flex-col border-r border-[var(--color-border)] bg-[var(--color-surface)] sticky top-0 h-screen overflow-y-auto">
        <div className="flex h-16 items-center justify-between px-4 border-b border-[var(--color-border)] shrink-0">
          <Link href="/">
            <BrandLogo subtitle="COMPANY PORTAL" compact />
          </Link>
        </div>

        <div className="p-3.5 space-y-5 flex-1">
          {SIDEBAR_GROUPS.map((grp) => (
            <div key={grp.group}>
              <p className="px-2.5 text-[11px] font-bold uppercase tracking-wider text-[var(--color-text-muted)] mb-1.5">
                {grp.group}
              </p>
              <div className="space-y-0.5">
                {grp.items.map((item) => {
                  const Icon = item.icon;
                  const active = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setActiveTab(item.id)}
                      className={`w-full flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-semibold transition-colors cursor-pointer ${
                        active
                          ? 'bg-[#348CB2] text-white shadow-xs'
                          : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-muted)] hover:text-[var(--color-text-primary)]'
                      }`}
                    >
                      <Icon className="h-4 w-4 shrink-0" />
                      <span className="truncate">{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Cross-portal switcher & Logout */}
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
            className="w-full inline-flex items-center justify-center gap-1.5 rounded-xl border border-red-200 dark:border-red-900/50 py-2 text-xs font-semibold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 cursor-pointer"
          >
            <LogOut className="h-3.5 w-3.5" />
            <span>Keluar Portal</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 pb-24 lg:pb-8">
        {/* Top Header */}
        <header className="sticky top-0 z-30 border-b border-[var(--color-border)] bg-[var(--color-surface)]/95 backdrop-blur-md">
          <div className="flex h-16 items-center justify-between gap-2 sm:gap-3 px-3 sm:px-6">
            <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
              <button
                type="button"
                onClick={() => setMobileMenuOpen(true)}
                className="lg:hidden inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[var(--color-border)] cursor-pointer"
                aria-label="Buka menu perusahaan"
              >
                <Menu className="h-5 w-5" />
              </button>
              <div className="lg:hidden min-w-0 truncate">
                <BrandLogo subtitle="COMPANY PORTAL" compact />
              </div>
              <div className="hidden lg:block">
                <h1 className="text-base font-bold text-[#123A54] dark:text-white">
                  {currentTabTitle}
                </h1>
                <p className="text-xs text-[var(--color-text-muted)]">
                  {companyName} · {COMPANY_PROFILE.plan}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
              <div className="hidden sm:block">
                <PWAInstallButton variant="compact" />
              </div>
              <button
                type="button"
                onClick={toggleTheme}
                aria-label="Ubah tema"
                className="inline-flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] cursor-pointer shrink-0"
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
                aria-label="Notifikasi perusahaan"
                className="relative inline-flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-secondary)] hover:text-[#348CB2] cursor-pointer shrink-0"
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

        {/* Active View Content */}
        <main className="mx-auto w-full max-w-6xl px-4 sm:px-6 py-5 space-y-6">
          {/* Mobile Contextual Module Quick-Switcher Strip */}
          {(['analytics', 'financial', 'targets', 'reports'] as CompanyTabId[]).includes(activeTab) && (
            <div className="lg:hidden flex gap-1.5 overflow-x-auto pb-1">
              {(
                [
                  { id: 'analytics', label: 'Analitik' },
                  { id: 'financial', label: 'Financial' },
                  { id: 'targets', label: 'Target & KPI' },
                  { id: 'reports', label: 'Laporan' },
                ] as const
              ).map((chip) => (
                <button
                  key={chip.id}
                  type="button"
                  onClick={() => setActiveTab(chip.id)}
                  className={`shrink-0 rounded-xl px-3 py-1.5 text-xs font-bold cursor-pointer ${
                    activeTab === chip.id
                      ? 'bg-[#348CB2] text-white'
                      : 'border border-[var(--color-border)] bg-[var(--color-surface)]'
                  }`}
                >
                  {chip.label}
                </button>
              ))}
            </div>
          )}

          {(
            ['branches', 'team', 'territories', 'outlets', 'products', 'master_perf'] as CompanyTabId[]
          ).includes(activeTab) && (
            <div className="lg:hidden flex gap-1.5 overflow-x-auto pb-1">
              {(
                [
                  { id: 'branches', label: 'Cabang' },
                  { id: 'team', label: 'Tim' },
                  { id: 'territories', label: 'Teritori' },
                  { id: 'outlets', label: 'Outlet' },
                  { id: 'products', label: 'Produk' },
                  { id: 'master_perf', label: 'Ranking' },
                ] as const
              ).map((chip) => (
                <button
                  key={chip.id}
                  type="button"
                  onClick={() => setActiveTab(chip.id)}
                  className={`shrink-0 rounded-xl px-3 py-1.5 text-xs font-bold cursor-pointer ${
                    activeTab === chip.id
                      ? 'bg-[#348CB2] text-white'
                      : 'border border-[var(--color-border)] bg-[var(--color-surface)]'
                  }`}
                >
                  {chip.label}
                </button>
              ))}
            </div>
          )}

          {(
            ['orders', 'promotions', 'gps_live', 'gps_history', 'visits', 'attendance'] as CompanyTabId[]
          ).includes(activeTab) && (
            <div className="lg:hidden flex gap-1.5 overflow-x-auto pb-1">
              {(
                [
                  { id: 'orders', label: 'Order' },
                  { id: 'promotions', label: 'Promosi' },
                  { id: 'gps_live', label: 'GPS Live' },
                  { id: 'gps_history', label: 'GPS History' },
                  { id: 'visits', label: 'Visit' },
                  { id: 'attendance', label: 'Absensi' },
                ] as const
              ).map((chip) => (
                <button
                  key={chip.id}
                  type="button"
                  onClick={() => setActiveTab(chip.id)}
                  className={`shrink-0 rounded-xl px-3 py-1.5 text-xs font-bold cursor-pointer ${
                    activeTab === chip.id
                      ? 'bg-[#348CB2] text-white'
                      : 'border border-[var(--color-border)] bg-[var(--color-surface)]'
                  }`}
                >
                  {chip.label}
                </button>
              ))}
            </div>
          )}

          {/* ================================================================
           * SCREEN 2: DASHBOARD PERUSAHAAN
           * ================================================================ */}
          {activeTab === 'dashboard' && (
            <div className="space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-xl sm:text-2xl font-bold text-[#123A54] dark:text-white">
                    Halo, {companyName}
                  </h2>
                  <p className="text-xs sm:text-sm text-[var(--color-text-secondary)]">
                    Ringkasan performa multi-cabang dan tim lapangan hari ini
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-[var(--color-text-muted)]">
                    Periode:
                  </span>
                  <select
                    value={period}
                    onChange={(e) =>
                      setPeriod(e.target.value as 'Bulan Ini' | 'Kuartal Ini')
                    }
                    className="rounded-xl border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-3.5 py-2 text-xs font-bold cursor-pointer"
                  >
                    <option value="Bulan Ini">Bulan Ini</option>
                    <option value="Kuartal Ini">Kuartal Ini</option>
                  </select>
                </div>
              </div>

              {/* 4 KPI Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-xs">
                  <p className="text-xs font-semibold text-[var(--color-text-muted)]">
                    Nilai Order
                  </p>
                  <p className="mt-2 text-xl font-bold text-[#123A54] dark:text-white tabular-nums">
                    {formatRupiah(COMPANY_PROFILE.monthlyRealizedOrder * factor)}
                  </p>
                  <p className="mt-1 text-xs font-bold text-[#10B981] tabular-nums">
                    +18,2% vs periode lalu
                  </p>
                </div>

                <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-xs">
                  <p className="text-xs font-semibold text-[var(--color-text-muted)]">
                    Total Order
                  </p>
                  <p className="mt-2 text-xl font-bold text-[#123A54] dark:text-white tabular-nums">
                    {(COMPANY_PROFILE.monthlyTotalOrders * factor).toLocaleString(
                      'id-ID'
                    )}
                  </p>
                  <p className="mt-1 text-xs font-bold text-[#10B981] tabular-nums">
                    +14,6% transaksi terproses
                  </p>
                </div>

                <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-xs">
                  <p className="text-xs font-semibold text-[var(--color-text-muted)]">
                    Outlet Aktif
                  </p>
                  <p className="mt-2 text-xl font-bold text-[#123A54] dark:text-white tabular-nums">
                    {outlets.length + 1039}
                    <span className="ml-1.5 text-sm font-medium text-[var(--color-text-secondary)]">
                      ({COMPANY_PROFILE.outletCoveragePct}%)
                    </span>
                  </p>
                  <p className="mt-1 text-xs text-[var(--color-text-muted)]">
                    Tersebar di {branches.length} cabang
                  </p>
                </div>

                <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-xs">
                  <p className="text-xs font-semibold text-[var(--color-text-muted)]">
                    Tim Sales
                  </p>
                  <p className="mt-2 text-xl font-bold text-[#123A54] dark:text-white tabular-nums">
                    {COMPANY_PROFILE.activeSalesCount}{' '}
                    <span className="text-sm font-bold text-[#10B981]">
                      Aktif
                    </span>
                  </p>
                  <p className="mt-1 text-xs text-[var(--color-text-muted)]">
                    Terintegrasi absensi geofence
                  </p>
                </div>
              </div>

              {/* Tren Nilai Order Bar Chart + Quick Modules */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                <div className="lg:col-span-7 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-base font-bold text-[#123A54] dark:text-white">
                        Tren Nilai Order (Juta Rp)
                      </h3>
                      <p className="text-xs text-[var(--color-text-muted)]">
                        Pertumbuhan konsisten Januari – Juni
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setActiveTab('analytics')}
                      className="text-xs font-bold text-[#348CB2] hover:underline cursor-pointer"
                    >
                      Detail Analitik
                    </button>
                  </div>

                  <div className="grid grid-cols-6 gap-2.5 items-end h-44 pt-4">
                    {COMPANY_MONTHLY_TRENDS.map((m) => {
                      const heightPct = Math.round((m.orderValueJt / 650) * 100);
                      return (
                        <div
                          key={m.month}
                          className="flex flex-col items-center gap-1.5 h-full justify-end"
                        >
                          <span className="text-[11px] font-bold text-[#236D91] dark:text-[#87CEEB] tabular-nums">
                            {m.orderValueJt}
                          </span>
                          <div
                            className="w-full max-w-[38px] rounded-t-lg bg-gradient-to-t from-[#348CB2] to-[#87CEEB] transition-all"
                            style={{ height: `${heightPct}%` }}
                          />
                          <span className="text-xs font-semibold text-[var(--color-text-muted)]">
                            {m.month}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="lg:col-span-5 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 space-y-3">
                  <h3 className="text-base font-bold text-[#123A54] dark:text-white">
                    Akses Cepat Manajemen
                  </h3>
                  <div className="grid grid-cols-2 gap-2.5">
                    {[
                      {
                        tab: 'gps_live' as const,
                        label: 'GPS Monitoring',
                        sub: 'Posisi tim live',
                        icon: Navigation,
                      },
                      {
                        tab: 'financial' as const,
                        label: 'Keuangan & Piutang',
                        sub: 'Arus transaksi',
                        icon: Wallet,
                      },
                      {
                        tab: 'branches' as const,
                        label: 'Cabang & Tim',
                        sub: `${branches.length} cabang aktif`,
                        icon: Building2,
                      },
                      {
                        tab: 'integrations' as const,
                        label: 'AI & Workspace',
                        sub: 'Gmail, Maps, AI',
                        icon: Sparkles,
                      },
                    ].map((quick) => {
                      const QIcon = quick.icon;
                      return (
                        <button
                          key={quick.tab}
                          type="button"
                          onClick={() => setActiveTab(quick.tab)}
                          className="rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] p-3.5 text-left hover:border-[#348CB2] transition-colors cursor-pointer"
                        >
                          <QIcon className="h-5 w-5 text-[#348CB2] mb-2" />
                          <p className="text-xs font-bold text-[var(--color-text-primary)]">
                            {quick.label}
                          </p>
                          <p className="text-[11px] text-[var(--color-text-muted)] mt-0.5">
                            {quick.sub}
                          </p>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ================================================================
           * SCREEN 3: ANALITIK & TREN PENJUALAN
           * ================================================================ */}
          {activeTab === 'analytics' && (
            <div className="space-y-5">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 rounded-xl bg-[var(--color-surface-muted)] p-1.5 max-w-lg">
                {(['Penjualan', 'Order', 'Outlet', 'Tim'] as const).map(
                  (sub) => (
                    <button
                      key={sub}
                      type="button"
                      onClick={() => setAnalyticsSubTab(sub)}
                      className={`rounded-lg py-2 text-xs font-bold cursor-pointer ${
                        analyticsSubTab === sub
                          ? 'bg-[#348CB2] text-white'
                          : 'text-[var(--color-text-secondary)]'
                      }`}
                    >
                      {sub}
                    </button>
                  )
                )}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                {/* Trend Line Chart */}
                <div className="lg:col-span-7 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 space-y-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-xs font-semibold text-[var(--color-text-muted)]">
                        Nilai {analyticsSubTab} ({period})
                      </p>
                      <p className="text-2xl font-bold text-[#123A54] dark:text-white tabular-nums mt-1">
                        {analyticsSubTab === 'Penjualan'
                          ? formatRupiah(625_800_000 * factor)
                          : analyticsSubTab === 'Order'
                            ? `${(1248 * factor).toLocaleString('id-ID')} Order`
                            : analyticsSubTab === 'Outlet'
                              ? '1.045 Outlet Aktif'
                              : '42 Sales Aktif'}
                      </p>
                    </div>
                    <span className="text-xs font-bold text-[#10B981] tabular-nums">
                      +18,2%
                    </span>
                  </div>

                  <svg viewBox="0 0 420 150" className="w-full h-40">
                    <defs>
                      <linearGradient id="compTrendFill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#348CB2" stopOpacity="0.28" />
                        <stop offset="100%" stopColor="#348CB2" stopOpacity="0.0" />
                      </linearGradient>
                    </defs>
                    <path
                      d="M 24 115 L 98 98 L 172 82 L 246 72 L 320 50 L 396 32 L 396 130 L 24 130 Z"
                      fill="url(#compTrendFill)"
                    />
                    <path
                      d="M 24 115 L 98 98 L 172 82 L 246 72 L 320 50 L 396 32"
                      fill="none"
                      stroke="#348CB2"
                      strokeWidth="3.5"
                      strokeLinecap="round"
                    />
                    {[
                      { x: 24, y: 115, l: 'Jan' },
                      { x: 98, y: 98, l: 'Feb' },
                      { x: 172, y: 82, l: 'Mar' },
                      { x: 246, y: 72, l: 'Apr' },
                      { x: 320, y: 50, l: 'Mei' },
                      { x: 396, y: 32, l: 'Jun' },
                    ].map((pt) => (
                      <g key={pt.l}>
                        <circle
                          cx={pt.x}
                          cy={pt.y}
                          r="5"
                          fill="#FFFFFF"
                          stroke="#348CB2"
                          strokeWidth="3"
                        />
                        <text
                          x={pt.x}
                          y="145"
                          textAnchor="middle"
                          fontSize="11"
                          fill="#64748B"
                        >
                          {pt.l}
                        </text>
                      </g>
                    ))}
                  </svg>
                </div>

                {/* Komposisi Penjualan Donut */}
                <div className="lg:col-span-5 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 space-y-4">
                  <h3 className="text-base font-bold text-[#123A54] dark:text-white">
                    Komposisi Penjualan
                  </h3>
                  <div className="flex items-center gap-5">
                    <div className="relative h-32 w-32 shrink-0">
                      <svg viewBox="0 0 120 120" className="h-32 w-32 -rotate-90">
                        <circle
                          cx="60"
                          cy="60"
                          r="46"
                          fill="none"
                          stroke="#E2E8F0"
                          strokeWidth="16"
                        />
                        <circle
                          cx="60"
                          cy="60"
                          r="46"
                          fill="none"
                          stroke="#348CB2"
                          strokeWidth="16"
                          strokeDasharray="121 289"
                        />
                        <circle
                          cx="60"
                          cy="60"
                          r="46"
                          fill="none"
                          stroke="#10B981"
                          strokeWidth="16"
                          strokeDasharray="81 289"
                          strokeDashoffset="-121"
                        />
                        <circle
                          cx="60"
                          cy="60"
                          r="46"
                          fill="none"
                          stroke="#F97316"
                          strokeWidth="16"
                          strokeDasharray="52 289"
                          strokeDashoffset="-202"
                        />
                        <circle
                          cx="60"
                          cy="60"
                          r="46"
                          fill="none"
                          stroke="#94A3B8"
                          strokeWidth="16"
                          strokeDasharray="35 289"
                          strokeDashoffset="-254"
                        />
                      </svg>
                      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                        <span className="text-[10px] text-[var(--color-text-muted)]">
                          Total
                        </span>
                        <span className="text-xs font-bold tabular-nums">
                          Rp 625,8 jt
                        </span>
                      </div>
                    </div>

                    <div className="flex-1 space-y-2.5 text-xs">
                      {COMPANY_ORDER_COMPOSITION.map((c) => (
                        <div
                          key={c.name}
                          className="flex items-center justify-between"
                        >
                          <div className="flex items-center gap-2">
                            <span
                              className="h-2.5 w-2.5 rounded-full shrink-0"
                              style={{ backgroundColor: c.colorHex }}
                            />
                            <span className="font-medium">{c.name}</span>
                          </div>
                          <span className="font-bold tabular-nums">{c.pct}%</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ================================================================
           * SCREEN 4: FINANCIAL OVERVIEW
           * ================================================================ */}
          {activeTab === 'financial' && (
            <div className="space-y-5">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  {
                    label: 'Nilai Order',
                    val: formatRupiah(COMPANY_PROFILE.monthlyRealizedOrder),
                    color: 'text-[#348CB2]',
                  },
                  {
                    label: 'Piutang',
                    val: formatRupiah(COMPANY_PROFILE.receivables),
                    color: 'text-[#F97316]',
                  },
                  {
                    label: 'Pembayaran',
                    val: formatRupiah(COMPANY_PROFILE.paymentsReceived),
                    color: 'text-[#10B981]',
                  },
                  {
                    label: 'Outstanding',
                    val: formatRupiah(COMPANY_PROFILE.receivables),
                    color: 'text-[#123A54] dark:text-white',
                  },
                ].map((tile) => (
                  <div
                    key={tile.label}
                    className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4"
                  >
                    <p className="text-xs font-semibold text-[var(--color-text-muted)]">
                      {tile.label}
                    </p>
                    <p
                      className={`mt-1.5 text-lg font-bold tabular-nums ${tile.color}`}
                    >
                      {tile.val}
                    </p>
                  </div>
                ))}
              </div>

              <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h3 className="text-base font-bold text-[#123A54] dark:text-white">
                    Arus Transaksi (Order vs Pembayaran)
                  </h3>
                  <div className="flex items-center gap-4 text-xs">
                    <span className="inline-flex items-center gap-1.5">
                      <span className="h-2.5 w-2.5 rounded-full bg-[#348CB2]" />
                      Order
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <span className="h-2.5 w-2.5 rounded-full bg-[#10B981]" />
                      Pembayaran
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-6 gap-3 items-end h-44 pt-4">
                  {COMPANY_MONTHLY_TRENDS.map((m) => (
                    <div
                      key={m.month}
                      className="flex flex-col items-center gap-1.5 h-full justify-end"
                    >
                      <div className="flex items-end gap-1 h-full">
                        <div
                          className="w-3.5 sm:w-5 rounded-t bg-[#348CB2]"
                          style={{
                            height: `${Math.round((m.orderValueJt / 650) * 100)}%`,
                          }}
                          title={`Order ${m.month}: Rp ${m.orderValueJt} jt`}
                        />
                        <div
                          className="w-3.5 sm:w-5 rounded-t bg-[#10B981]"
                          style={{
                            height: `${Math.round((m.paymentValueJt / 650) * 100)}%`,
                          }}
                          title={`Pembayaran ${m.month}: Rp ${m.paymentValueJt} jt`}
                        />
                      </div>
                      <span className="text-xs font-semibold text-[var(--color-text-muted)]">
                        {m.month}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-2xl border border-[#ADD8E6] bg-[#F3FAFC] dark:bg-[#172438] p-5 flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold text-[var(--color-text-muted)]">
                    Ringkasan Keuangan · Realisasi vs Target
                  </p>
                  <p className="text-base sm:text-lg font-bold text-[#123A54] dark:text-white tabular-nums mt-0.5">
                    Rp 625,8 jt / Rp 600 jt
                  </p>
                </div>
                <span className="text-xl font-bold text-[#10B981] tabular-nums">
                  104,3%
                </span>
              </div>
            </div>
          )}

          {/* ================================================================
           * SCREEN 5: MANAJEMEN CABANG
           * ================================================================ */}
          {activeTab === 'branches' && (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="relative w-full sm:flex-1 sm:min-w-[220px] max-w-md">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--color-text-muted)]" />
                  <input
                    type="text"
                    value={branchSearch}
                    onChange={(e) => setBranchSearch(e.target.value)}
                    placeholder="Cari cabang..."
                    className="w-full rounded-xl border border-[var(--color-border-strong)] bg-[var(--color-surface)] pl-10 pr-4 py-2.5 text-sm"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => setAddBranchOpen(true)}
                  disabled={!auth.canPerformApiAction('master.branches.create')}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-[#348CB2] hover:bg-[#236D91] px-4 py-2.5 text-sm font-bold text-white cursor-pointer"
                >
                  <Plus className="h-4 w-4" />
                  <span>Tambah Cabang</span>
                </button>
              </div>

              {renderMasterDataTransfer('branches')}
              <div className="space-y-2.5">
                {branches
                  .filter(
                    (b) =>
                      b.name
                        .toLowerCase()
                        .includes(branchSearch.toLowerCase()) ||
                      b.city.toLowerCase().includes(branchSearch.toLowerCase())
                  )
                  .map((branch) => (
                    <button
                      key={branch.id}
                      type="button"
                      onClick={() => setSelectedBranch(branch)}
                      className="w-full flex items-center justify-between gap-4 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 text-left hover:border-[#348CB2] transition-colors cursor-pointer"
                    >
                      <div className="flex items-center gap-3.5 min-w-0">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#E5F4F8] dark:bg-[#19394B] text-[#348CB2]">
                          <Building2 className="h-5 w-5" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-bold text-[var(--color-text-primary)] truncate">
                            {branch.name}
                          </p>
                          <p className="text-xs text-[var(--color-text-secondary)]">
                            {branch.city} · {branch.salesCount} Sales ·{' '}
                            {branch.outletCount} Outlet
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span
                          className={`text-xs font-bold ${
                            branch.status === 'Aktif'
                              ? 'text-[#10B981]'
                              : 'text-[var(--color-text-muted)]'
                          }`}
                        >
                          {branch.status}
                        </span>
                        <ChevronRight className="h-4 w-4 text-[var(--color-text-muted)]" />
                      </div>
                    </button>
                  ))}
              </div>
            </div>
          )}

          {activeTab === 'gps_live' && !hasTeamLocation && (
            <div className="rounded-2xl border border-dashed border-[var(--color-border-strong)] bg-[var(--color-surface)] p-8 text-center text-sm text-[var(--color-text-muted)]">
              Data lokasi belum tersedia untuk sales profile. GPS telemetry akan tampil setelah Location Intelligence terhubung.
            </div>
          )}
          {activeTab === 'gps_history' && !hasTeamLocation && (
            <div className="rounded-2xl border border-dashed border-[var(--color-border-strong)] bg-[var(--color-surface)] p-8 text-center text-sm text-[var(--color-text-muted)]">
              Histori perjalanan belum tersedia. Lokasi dan perjalanan baru ditampilkan setelah data Location Intelligence tersedia.
            </div>
          )}

          {/* ================================================================
           * SCREEN 6 (7): MANAJEMEN TIM
           * ================================================================ */}
          {activeTab === 'team' && (
            <div className="space-y-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="grid grid-cols-2 gap-1.5 rounded-xl bg-[var(--color-surface-muted)] p-1 w-full max-w-xs">
                  {(['Struktur Tim', 'Penugasan'] as const).map((tab) => (
                    <button
                      key={tab}
                      type="button"
                      onClick={() => setTeamSubTab(tab)}
                      className={`rounded-lg py-2 text-xs font-bold cursor-pointer ${
                        teamSubTab === tab
                          ? 'bg-[#348CB2] text-white'
                          : 'text-[var(--color-text-secondary)]'
                      }`}
                    >
                      {tab}
                    </button>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() => setAddTeamOpen(true)}
                  disabled={!auth.canPerformApiAction('master.teams.create') || branches.length === 0}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-[#348CB2] hover:bg-[#236D91] px-4 py-2.5 text-sm font-bold text-white cursor-pointer disabled:opacity-50"
                >
                  <Plus className="h-4 w-4" />
                  <span>Kelola Struktur Tim</span>
                </button>
              </div>

              {teamSubTab === 'Struktur Tim' ? (
                <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 space-y-3">
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="rounded-xl bg-[var(--color-background)] p-3">
                      <p className="text-xl font-bold">{teams.length}</p><p className="text-[11px] text-[var(--color-text-muted)]">Tim</p>
                    </div>
                    <div className="rounded-xl bg-[var(--color-background)] p-3">
                      <p className="text-xl font-bold">{branches.length}</p><p className="text-[11px] text-[var(--color-text-muted)]">Cabang</p>
                    </div>
                    <div className="rounded-xl bg-[var(--color-background)] p-3">
                      <p className="text-xl font-bold">{teamMembers.length}</p><p className="text-[11px] text-[var(--color-text-muted)]">Sales Profile</p>
                    </div>
                  </div>
                  {teams.length === 0 ? (
                    <p className="rounded-xl border border-dashed border-[var(--color-border-strong)] p-5 text-center text-xs text-[var(--color-text-muted)]">
                      Belum ada struktur tim pada organisasi aktif. Buat tim dan tetapkan cabang serta supervisor.
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {teams.map((team) => {
                        const supervisor = organizationMembers.find((member) => member.user_id === asText(team.supervisor_user_id));
                        const parent = teams.find((candidate) => asText(candidate.id) === asText(team.parent_team_id));
                        const branch = branches.find((candidate) => candidate.id === asText(team.branch_id));
                        return (
                          <div key={asText(team.id)} className="rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] p-4">
                            <p className="text-sm font-bold">{asText(team.name)}</p>
                            <p className="mt-1 text-xs text-[var(--color-text-muted)]">
                              {branch?.name || 'Cabang belum ditetapkan'} · Supervisor: {asText(supervisor?.display_name) || 'Belum ditetapkan'}
                            </p>
                            {parent && <p className="mt-1 text-[11px] text-[var(--color-text-muted)]">Parent: {asText(parent.name)}</p>}
                            <button type="button" disabled={!auth.canPerformApiAction('master.teams.update')} onClick={() => openMasterDataEdit('teams', asText(team.id))} className="mt-2 ml-2 rounded-lg border border-[var(--color-border-strong)] px-3 py-1.5 text-[11px] font-semibold">Edit Data</button>
                            <button type="button" disabled={!auth.canPerformApiAction('master.teams.update')} onClick={() => void toggleTeamStatus(asText(team.id)).catch((error) => setMasterDataError(error instanceof Error ? error.message : 'Status tim gagal diperbarui.'))} className="mt-2 rounded-lg border border-[var(--color-border-strong)] px-3 py-1.5 text-[11px] font-semibold">{asText(team.status) === 'active' ? 'Nonaktifkan Tim' : 'Aktifkan Tim'}</button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between rounded-xl border border-[#ADD8E6] bg-[#F3FAFC] dark:bg-[#172438] px-4 py-2.5 text-xs">
                    <span className="font-semibold text-[#236D91] dark:text-[#87CEEB]">
                      Kelola penempatan tim dan supervisor. Role RBAC tetap dikelola melalui Access Console.
                    </span>
                    <button
                      type="button"
                      onClick={() => setActiveTab('attendance')}
                      className="font-bold text-[#348CB2] hover:underline cursor-pointer shrink-0 ml-2"
                    >
                      Buka Absensi Tim →
                    </button>
                  </div>
{renderMasterDataTransfer('teams')}
                  {renderMasterDataTransfer('sales_profiles')}

                  <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 space-y-3">
                    <div><p className="text-sm font-bold">Buat Sales Profile</p><p className="text-xs text-[var(--color-text-muted)]">Hanya anggota organisasi aktif dengan role sales_rep atau supervisor yang dapat didaftarkan.</p></div>
                    <select value={newSalesUserId} onChange={(event) => setNewSalesUserId(event.target.value)} className="w-full rounded-xl border border-[var(--color-border-strong)] bg-[var(--color-background)] px-3 py-2 text-xs">
                      <option value="">Pilih anggota aktif</option>
                      {organizationMembers.filter((member) => member.status === 'active').map((member) => <option key={member.user_id} value={member.user_id}>{member.display_name || member.email || member.user_id}</option>)}
                    </select>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <select value={newSalesTeamId} onChange={(event) => setNewSalesTeamId(event.target.value)} className="w-full rounded-xl border border-[var(--color-border-strong)] bg-[var(--color-background)] px-3 py-2 text-xs">
                        <option value="">Pilih tim aktif</option>
                        {teams.filter((team) => asText(team.status) === 'active').map((team) => <option key={asText(team.id)} value={asText(team.id)}>{asText(team.name)}</option>)}
                      </select>
                      <select value={newSalesTerritoryId} onChange={(event) => setNewSalesTerritoryId(event.target.value)} className="w-full rounded-xl border border-[var(--color-border-strong)] bg-[var(--color-background)] px-3 py-2 text-xs">
                        <option value="">Pilih teritori aktif</option>
                        {territories.filter((territory) => territory.status === 'Aktif' && (!newSalesTeamId || territory.branchId === asText(teams.find((team) => asText(team.id) === newSalesTeamId)?.branch_id))).map((territory) => <option key={territory.id} value={territory.id}>{territory.name}</option>)}
                      </select>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <input value={newSalesEmployeeCode} onChange={(event) => setNewSalesEmployeeCode(event.target.value)} placeholder="Kode karyawan (opsional)" className="min-w-[180px] flex-1 rounded-xl border border-[var(--color-border-strong)] bg-[var(--color-background)] px-3 py-2 text-xs"/>
                      <button type="button" disabled={!newSalesUserId || !newSalesTeamId || !newSalesTerritoryId || !auth.canPerformApiAction('master.sales_profiles.create')} onClick={() => void createSalesProfile().catch((error) => setMasterDataError(error instanceof Error ? error.message : 'Sales profile gagal dibuat.'))} className="rounded-xl bg-[#348CB2] px-4 py-2 text-xs font-bold text-white disabled:opacity-50">Buat Profile</button>
                    </div>
                  </div>
                  <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 space-y-3">
                    <div><p className="text-sm font-bold">Assignment Outlet</p><p className="text-xs text-[var(--color-text-muted)]">Assignment menyimpan snapshot tim, supervisor, dan teritori serta histori pergantian sales.</p></div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <select value={selectedAssignmentOutletId} onChange={(event) => setSelectedAssignmentOutletId(event.target.value)} className="w-full rounded-xl border border-[var(--color-border-strong)] bg-[var(--color-background)] px-3 py-2 text-xs">
                        <option value="">Pilih outlet aktif</option>
                        {outlets.filter((outlet) => outlet.status === 'Aktif').map((outlet) => <option key={outlet.id} value={outlet.id}>{outlet.name}</option>)}
                      </select>
                      <select value={selectedAssignmentProfileId} onChange={(event) => setSelectedAssignmentProfileId(event.target.value)} className="w-full rounded-xl border border-[var(--color-border-strong)] bg-[var(--color-background)] px-3 py-2 text-xs">
                        <option value="">Pilih sales profile aktif</option>
                        {teamMembers.filter((member) => member.status === 'Online').map((member) => <option key={member.id} value={member.id}>{member.name}</option>)}
                      </select>
                    </div>
                    <button type="button" disabled={!selectedAssignmentOutletId || !selectedAssignmentProfileId || !auth.canPerformApiAction('master.assignments.manage')} onClick={() => void assignOutletToSalesProfile().catch((error) => setMasterDataError(error instanceof Error ? error.message : 'Assignment outlet gagal.'))} className="rounded-xl bg-[#348CB2] px-4 py-2 text-xs font-bold text-white disabled:opacity-50">Simpan Assignment</button>
                    <div className="space-y-2">
                      <p className="text-xs font-bold">Riwayat Assignment</p>
                      {assignmentHistory.slice(0, 8).map((entry) => <div key={asText(entry.id)} className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-[var(--color-background)] p-2 text-[11px]"><span>{asText(entry.outlet_name)} · {asText(entry.team_name) || 'Tanpa tim'} · {asText(entry.supervisor_name) || 'Tanpa supervisor'} · {asText(entry.territory_name) || 'Tanpa teritori'}<span className="block text-[var(--color-text-muted)]">Dibuat {asText(entry.assigned_at)} · oleh {asText(entry.assigned_by)}{entry.unassigned_at ? ' · diakhiri ' + asText(entry.unassigned_at) + ' oleh ' + asText(entry.unassigned_by) : ''}</span></span><span className="flex items-center gap-2"><span className="text-[var(--color-text-muted)]">{entry.unassigned_at ? 'Selesai' : 'Aktif'}</span>{!entry.unassigned_at && <button type="button" disabled={!auth.canPerformApiAction('master.assignments.unassign')} onClick={() => void unassignOutletAssignment(asText(entry.id)).catch((error) => setMasterDataError(error instanceof Error ? error.message : 'Unassignment gagal.'))} className="rounded-lg border border-[var(--color-border-strong)] px-2 py-1 font-semibold disabled:opacity-50">Unassign</button>}</span></div>)}
                      {assignmentHistory.length === 0 && <p className="text-[11px] text-[var(--color-text-muted)]">Belum ada histori assignment.</p>}
                    </div>
                  </div>
                  {teamMembers.length === 0 && (
                    <div className="rounded-xl border border-dashed border-[var(--color-border-strong)] p-6 text-center text-xs text-[var(--color-text-muted)]">
                      Belum ada sales profile yang terhubung ke tim pada organisasi aktif.
                    </div>
                  )}
                  {teamMembers.map((tm) => (
                    <div
                      key={tm.id}
                      className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4"
                    >
                      <div>
                        <p className="text-sm font-bold">{tm.name}</p>
                        <p className="text-xs text-[var(--color-text-secondary)]">
                          {tm.role} · {tm.area}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-xs font-bold mr-1 ${
                            tm.status === 'Online'
                              ? 'text-[#10B981]'
                              : 'text-[var(--color-text-muted)]'
                          }`}
                        >
                          {tm.status}
                        </span>
                        <button
                          type="button"
                          onClick={() => setEditingUserAssignment(tm)}
                          disabled={!auth.canPerformApiAction('master.sales_profiles.update')}
                          className="rounded-lg border border-[#348CB2]/40 px-3 py-1.5 text-xs font-semibold text-[#236D91] dark:text-[#87CEEB] hover:bg-[#E5F4F8] dark:hover:bg-[#19394B] cursor-pointer disabled:opacity-50"
                        >
                          Atur Penugasan
                        </button>
                        <button
                          type="button"
                          onClick={() => setTelemetryMember(tm)}
                          className="rounded-lg border border-[var(--color-border-strong)] px-3 py-1.5 text-xs font-semibold hover:bg-[var(--color-surface-muted)] cursor-pointer"
                        >
                          Telemetry
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ================================================================
           * SCREEN 7 (8): MANAJEMEN TERITORI
           * ================================================================ */}
          {activeTab === 'territories' && (
            <div className="space-y-5">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold text-[#123A54] dark:text-white">
                    Peta & Distribusi Teritori Wilayah
                  </h2>
                  <p className="text-xs text-[var(--color-text-muted)]">
                    Terhubung ke Google Maps Platform untuk pemetaan zona cabang
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setAddTerritoryOpen(true)}
                  disabled={!auth.canPerformApiAction('master.territories.create')}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-[#348CB2] hover:bg-[#236D91] px-4 py-2.5 text-sm font-bold text-white cursor-pointer"
                >
                  <Plus className="h-4 w-4" />
                  <span>Tambah Teritori</span>
                </button>
              </div>

              {renderMasterDataTransfer('territories')}
              <SalesGoogleMap
                currentPos={{
                  lat: COMPANY_PROFILE ? -6.595204 : -6.595204,
                  lng: 106.797781,
                }}
                outlets={territoryOutletsForMap}
                selectedOutlet={territoryOutletsForMap[0] || null}
                onSelectOutlet={() => {}}
                showRouteToSelected={false}
                heightClass="h-[300px] sm:h-[340px]"
              />

              <div className="divide-y divide-[var(--color-border)] rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)]">
                {territories.map((ter) => (
                  <div
                    key={ter.id}
                    className="flex items-center justify-between px-4 py-3.5 text-sm"
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className="h-3.5 w-3.5 rounded-sm shrink-0"
                        style={{ backgroundColor: ter.colorHex }}
                      />
                      <div>
                        <p className="font-bold text-[var(--color-text-primary)]">
                          {ter.name}
                        </p>
                        <p className="text-xs text-[var(--color-text-muted)]">
                          {ter.branchName} · Coverage {ter.coveragePct}%
                        </p>
                      </div>
                    </div>
                    <span className="font-bold text-[#123A54] dark:text-[#87CEEB] tabular-nums">
{ter.outletCount} Outlet
                      <button type="button" disabled={!auth.canPerformApiAction('master.territories.update')} onClick={() => openMasterDataEdit('territories', ter.id)} className="ml-2 rounded-lg border border-[var(--color-border-strong)] px-2 py-1 text-[10px] font-semibold">Edit</button>
                      <button type="button" disabled={!auth.canPerformApiAction('master.territories.update')} onClick={() => void toggleTerritoryStatus(ter.id).catch((error) => setMasterDataError(error instanceof Error ? error.message : 'Status teritori gagal diperbarui.'))} className="ml-2 rounded-lg border border-[var(--color-border-strong)] px-2 py-1 text-[10px] font-semibold">{ter.status === 'Aktif' ? 'Nonaktifkan' : 'Aktifkan'}</button>
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ================================================================
           * SCREEN 8 (9): MANAJEMEN OUTLET
           * ================================================================ */}
          {activeTab === 'outlets' && (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="relative w-full sm:flex-1 sm:min-w-[220px] max-w-md">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--color-text-muted)]" />
                  <input
                    type="text"
                    value={outletSearch}
                    onChange={(e) => setOutletSearch(e.target.value)}
                    placeholder="Cari outlet..."
                    className="w-full rounded-xl border border-[var(--color-border-strong)] bg-[var(--color-surface)] pl-10 pr-4 py-2.5 text-sm"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => setAddOutletOpen(true)}
                  disabled={!auth.canPerformApiAction('master.outlets.create')}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-[#348CB2] hover:bg-[#236D91] px-4 py-2.5 text-sm font-bold text-white cursor-pointer"
                >
                  <Plus className="h-4 w-4" />
                  <span>Tambah Outlet</span>
                </button>
              </div>

              <div className="flex gap-2">
                {(['Semua', 'Aktif', 'Nonaktif'] as const).map((f) => (
                  <button
                    key={f}
                    type="button"
                    onClick={() => setOutletFilter(f)}
                    className={`rounded-xl px-4 py-2 text-xs font-bold cursor-pointer ${
                      outletFilter === f
                        ? 'bg-[#348CB2] text-white'
                        : 'border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-secondary)]'
                    }`}
                  >
                    {f}
                  </button>
                ))}
              </div>

              <div className="space-y-2.5">
                {outlets
                  .filter(
                    (o) =>
                      (outletFilter === 'Semua' || o.status === outletFilter) &&
                      (o.name.toLowerCase().includes(outletSearch.toLowerCase()) ||
                        o.city.toLowerCase().includes(outletSearch.toLowerCase()))
                  )
                  .map((o) => (
                    <button
                      key={o.id}
                      type="button"
                      onClick={() => setSelectedOutletDetail(o)}
                      className="w-full flex items-center justify-between gap-4 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 text-left hover:border-[#348CB2] cursor-pointer"
                    >
                      <div className="flex items-center gap-3.5 min-w-0">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#E5F4F8] dark:bg-[#19394B] text-[#348CB2]">
                          <Store className="h-5 w-5" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-bold truncate">{o.name}</p>
                          <p className="text-xs text-[var(--color-text-secondary)]">
                            {o.city} · {o.category}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span
                          className={`text-xs font-bold ${
                            o.status === 'Aktif'
                              ? 'text-[#10B981]'
                              : 'text-[var(--color-text-muted)]'
                          }`}
                        >
                          {o.status}
                        </span>
                        <ChevronRight className="h-4 w-4 text-[var(--color-text-muted)]" />
                      </div>
                    </button>
                  ))}
              </div>
            </div>
          )}

          {/* ================================================================
           * SCREEN 9 (10): PRODUK & KATALOG
           * ================================================================ */}
          {activeTab === 'products' && (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-1 rounded-xl bg-[var(--color-surface-muted)] p-1 w-full sm:w-auto">
                  {(['Produk', 'Kategori', 'Harga', 'Stok'] as const).map(
                    (tab) => (
                      <button
                        key={tab}
                        type="button"
                        onClick={() => setProductSubTab(tab)}
                        className={`rounded-lg px-3 py-1.5 text-xs font-bold cursor-pointer ${
                          productSubTab === tab
                            ? 'bg-[#348CB2] text-white'
                            : 'text-[var(--color-text-secondary)]'
                        }`}
                      >
                        {tab}
                      </button>
                    )
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => setAddProductOpen(true)}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-[#348CB2] hover:bg-[#236D91] px-4 py-2 text-xs sm:text-sm font-bold text-white cursor-pointer"
                >
                  <Plus className="h-4 w-4" />
                  <span>Tambah Produk</span>
                </button>
              </div>

              {renderMasterDataTransfer('outlets')}
              <div className="relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--color-text-muted)]" />
                <input
                  type="text"
                  value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)}
                  placeholder="Cari produk / SKU..."
                  className="w-full rounded-xl border border-[var(--color-border-strong)] bg-[var(--color-surface)] pl-10 pr-4 py-2.5 text-sm"
                />
              </div>

              {productSubTab === 'Kategori' ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  {(['Minuman', 'Makanan', 'Perawatan', 'Lainnya'] as const).map(
                    (cat) => {
                      const catItems = products.filter((p) => p.category === cat);
                      const totalStock = catItems.reduce(
                        (sum, it) => sum + it.stock * 2,
                        0
                      );
                      return (
                        <button
                          key={cat}
                          type="button"
                          onClick={() => {
                            setProductSearch(cat);
                            setProductSubTab('Produk');
                          }}
                          className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 text-left hover:border-[#348CB2] cursor-pointer space-y-2"
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-bold">{cat}</span>
                            <span className="rounded-lg bg-[#E5F4F8] dark:bg-[#19394B] px-2 py-0.5 text-[11px] font-bold text-[#236D91] dark:text-[#87CEEB] tabular-nums">
                              {catItems.length} SKU
                            </span>
                          </div>
                          <p className="text-xs text-[var(--color-text-muted)] tabular-nums">
                            Total Stok Cabang: {totalStock.toLocaleString('id-ID')} pcs
                          </p>
                        </button>
                      );
                    }
                  )}
                </div>
              ) : (
                <div className="space-y-2.5">
                  {products
                    .filter(
                      (p) =>
                        p.name
                          .toLowerCase()
                          .includes(productSearch.toLowerCase()) ||
                        p.sku
                          .toLowerCase()
                          .includes(productSearch.toLowerCase()) ||
                        p.category
                          .toLowerCase()
                          .includes(productSearch.toLowerCase())
                    )
                    .map((p) => {
                      const contractPrice = Math.round(p.price * 0.92);
                      return (
                        <div
                          key={p.sku}
                          className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4"
                        >
                          <div className="flex items-center gap-3.5">
                            <div
                              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-white font-bold text-xs"
                              style={{ backgroundColor: p.accentHex }}
                            >
                              {p.category.slice(0, 3).toUpperCase()}
                            </div>
                            <div>
                              <p className="text-[11px] font-mono text-[var(--color-text-muted)]">
                                {p.sku} · {p.category} · {p.tag}
                              </p>
                              <p className="text-sm font-bold">{p.name}</p>
                              {productSubTab === 'Harga' ? (
                                <p className="text-xs text-[var(--color-text-secondary)] tabular-nums">
                                  Kontrak Outlet: {formatRupiah(contractPrice)}
                                  {p.promoDiscountPct
                                    ? ` · Diskon Promo ${p.promoDiscountPct}%`
                                    : ''}
                                </p>
                              ) : (
                                <p className="text-xs font-semibold text-[#10B981] tabular-nums">
                                  Stok: {(p.stock * 2).toLocaleString('id-ID')}{' '}
                                  {p.unit}
                                </p>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-2.5">
                            <span className="text-sm font-bold text-[#123A54] dark:text-white tabular-nums">
                              {formatRupiah(p.price)}
                            </span>
                            {productSubTab === 'Stok' ? (
                              <button
                                type="button"
                                onClick={() =>
                                  setProducts((prev) =>
                                    prev.map((item) =>
                                      item.sku === p.sku
                                        ? { ...item, stock: item.stock + 50 }
                                        : item
                                    )
                                  )
                                }
                                className="rounded-lg bg-[#E5F4F8] dark:bg-[#19394B] px-2.5 py-1.5 text-xs font-bold text-[#236D91] dark:text-[#87CEEB] cursor-pointer"
                              >
                                +50 Stok
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() => setEditingProduct(p)}
                                className="rounded-lg border border-[var(--color-border-strong)] px-2.5 py-1.5 text-xs font-semibold hover:bg-[var(--color-surface-muted)] cursor-pointer"
                              >
                                Edit SKU
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                </div>
              )}
            </div>
          )}

          {/* ================================================================
           * SCREEN 10 (11): TARGET & KPI
           * ================================================================ */}
          {activeTab === 'targets' && (
            <div className="space-y-5">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold text-[#123A54] dark:text-white">
                    Target Penjualan & KPI Tim
                  </h2>
                  <p className="text-xs text-[var(--color-text-muted)]">
                    Pantau dan kelola target order bulanan perusahaan & per cabang
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setTargetModalOpen(true)}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-[#348CB2] hover:bg-[#236D91] px-4 py-2 text-xs sm:text-sm font-bold text-white cursor-pointer"
                >
                  <SlidersHorizontal className="h-4 w-4" />
                  <span>Atur Target Bulanan</span>
                </button>
              </div>

              <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 flex flex-wrap items-center justify-between gap-5">
                <div className="space-y-3">
                  <div>
                    <p className="text-xs font-semibold text-[var(--color-text-muted)]">
                      Target Order ({period})
                    </p>
                    <p className="text-lg font-bold text-[#123A54] dark:text-white tabular-nums">
                      {formatRupiah(companyTargetOrder * factor)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-[var(--color-text-muted)]">
                      Realisasi Order
                    </p>
                    <p className="text-xl font-bold text-[#10B981] tabular-nums">
                      {formatRupiah(COMPANY_PROFILE.monthlyRealizedOrder * factor)}
                    </p>
                  </div>
                </div>

                {(() => {
                  const pct = Number(
                    (
                      (COMPANY_PROFILE.monthlyRealizedOrder /
                        Math.max(1, companyTargetOrder)) *
                      100
                    ).toFixed(1)
                  );
                  const dashOffset = Math.max(0, 251 - (Math.min(pct, 100) / 100) * 251);
                  return (
                    <div className="relative h-28 w-28 shrink-0">
                      <svg viewBox="0 0 100 100" className="h-28 w-28 -rotate-90">
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
                          stroke="#10B981"
                          strokeWidth="10"
                          strokeDasharray="251"
                          strokeDashoffset={dashOffset}
                          strokeLinecap="round"
                        />
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-base font-bold text-[#123A54] dark:text-white tabular-nums">
                          {pct.toString().replace('.', ',')}%
                        </span>
                      </div>
                    </div>
                  );
                })()}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 space-y-3.5">
                  <h3 className="text-base font-bold text-[#123A54] dark:text-white">
                    Realisasi per Cabang
                  </h3>
                  {branches.slice(0, 4).map((b) => {
                    const pct = Number(
                      ((b.monthlyRealized / Math.max(1, b.monthlyTarget)) * 100).toFixed(1)
                    );
                    return (
                      <div key={b.id} className="space-y-1">
                        <div className="flex justify-between text-xs font-semibold">
                          <span>{b.city.replace('Kota ', '')}</span>
                          <span className="tabular-nums font-bold">{pct}%</span>
                        </div>
                        <div className="h-2.5 w-full rounded-full bg-[var(--color-surface-muted)] overflow-hidden">
                          <div
                            className="h-full rounded-full bg-[#348CB2]"
                            style={{ width: `${Math.min(pct, 100)}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 space-y-3">
                  <h3 className="text-base font-bold text-[#123A54] dark:text-white">
                    Ranking Sales (Nilai Order)
                  </h3>
                  {teamMembers
                    .filter((m) => m.role === 'Sales Rep')
                    .slice(0, 3)
                    .map((s, idx) => (
                      <div
                        key={s.id}
                        className="flex items-center justify-between rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] px-3.5 py-2.5 text-xs"
                      >
                        <div className="flex items-center gap-2.5">
                          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#F97316] text-[11px] font-bold text-white tabular-nums">
                            {idx + 1}
                          </span>
                          <span className="font-bold">{s.name}</span>
                        </div>
                        <span className="font-bold text-[#123A54] dark:text-[#87CEEB] tabular-nums">
                          {formatRupiah(s.monthlyOrderValue)}
                        </span>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          )}

          {/* ================================================================
           * SCREEN 11 (13): GPS MONITORING (REALTIME)
           * ================================================================ */}
          {activeTab === 'gps_live' && hasTeamLocation && (
            <div className="space-y-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="grid grid-cols-2 gap-1.5 rounded-xl bg-[var(--color-surface-muted)] p-1 w-full max-w-xs">
                  {(['Realtime', 'Daftar Tim'] as const).map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setGpsSubTab(t)}
                      className={`rounded-lg py-2 text-xs font-bold cursor-pointer ${
                        gpsSubTab === t
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
                  onClick={() => setGpsAuditOpen((o) => !o)}
                  className="rounded-xl border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-3.5 py-2 text-xs font-bold text-[#236D91] dark:text-[#87CEEB] cursor-pointer"
                >
                  {gpsAuditOpen ? 'Tutup Log Audit' : `Jejak Audit Akses (${INITIAL_GPS_AUDIT_LOGS.length})`}
                </button>
              </div>

              {gpsAuditOpen && (
                <div className="rounded-2xl border border-[#ADD8E6] bg-[#F3FAFC] dark:bg-[#172438] p-4 space-y-2.5 text-xs">
                  <p className="font-bold text-[#123A54] dark:text-white">
                    Log Audit Akses Lokasi & Privasi Tim
                  </p>
                  {INITIAL_GPS_AUDIT_LOGS.map((log) => (
                    <div
                      key={log.id}
                      className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)] px-3.5 py-2.5"
                    >
                      <div>
                        <p className="font-bold">{log.action}</p>
                        <p className="text-[var(--color-text-muted)]">
                          Oleh {log.actorName} · Target: {log.targetStaff}
                        </p>
                      </div>
                      <span className="font-mono text-[11px] text-[var(--color-text-muted)] tabular-nums">
                        {log.timestamp}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {gpsSubTab === 'Realtime' ? (
                <div className="space-y-4">
                  <SalesGoogleMap
                    currentPos={{
                      lat: selectedTeamMember.lat,
                      lng: selectedTeamMember.lng,
                    }}
                    outlets={teamOutletsForMap}
                    selectedOutlet={
                      teamOutletsForMap.find(
                        (o) => o.id === selectedTeamMember.id
                      ) || null
                    }
                    onSelectOutlet={(o) => setSelectedTeamId(o.id)}
                    showRouteToSelected={false}
                    heightClass="h-[320px] sm:h-[360px]"
                  />

                  <div className="flex gap-2 overflow-x-auto pb-1">
                    {teamMembers.slice(0, 4).map((m) => (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => setSelectedTeamId(m.id)}
                        className={`shrink-0 rounded-xl border px-3.5 py-2 text-xs font-bold cursor-pointer ${
                          selectedTeamMember.id === m.id
                            ? 'border-[#348CB2] bg-[#E5F4F8] dark:bg-[#19394B] text-[#123A54] dark:text-white'
                            : 'border-[var(--color-border)] bg-[var(--color-surface)]'
                        }`}
                      >
                        {m.name}
                      </button>
                    ))}
                  </div>

                  <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-base font-bold">
                          {selectedTeamMember.name}
                        </p>
                        <p className="text-xs text-[var(--color-text-muted)]">
                          {selectedTeamMember.area}
                        </p>
                      </div>
                      <span
                        className={`text-xs font-bold ${
                          selectedTeamMember.status === 'Online'
                            ? 'text-[#10B981]'
                            : 'text-[var(--color-text-muted)]'
                        }`}
                      >
                        {selectedTeamMember.status}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs pt-2 border-t border-[var(--color-border)]">
                      <div>
                        <p className="text-[var(--color-text-muted)]">Lokasi</p>
                        <p className="font-semibold mt-0.5">
                          {selectedTeamMember.currentLocation}
                        </p>
                      </div>
                      <div>
                        <p className="text-[var(--color-text-muted)]">
                          Kecepatan
                        </p>
                        <p className="font-semibold tabular-nums mt-0.5">
                          {selectedTeamMember.speedKmh} km/jam
                        </p>
                      </div>
                      <div>
                        <p className="text-[var(--color-text-muted)]">Akurasi</p>
                        <p className="font-semibold tabular-nums mt-0.5">
                          ± {selectedTeamMember.accuracyM} meter
                        </p>
                      </div>
                      <div>
                        <p className="text-[var(--color-text-muted)]">Update</p>
                        <p className="font-semibold tabular-nums mt-0.5">
                          {selectedTeamMember.lastUpdate}
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setTelemetryMember(selectedTeamMember)}
                      className="w-full rounded-xl bg-[#348CB2] hover:bg-[#236D91] py-2.5 text-sm font-bold text-white cursor-pointer"
                    >
                      Lihat Detail Telemetry
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {teamMembers.map((m) => (
                    <div
                      key={m.id}
                      className="flex items-center justify-between rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 text-xs"
                    >
                      <div>
                        <p className="text-sm font-bold">{m.name}</p>
                        <p className="text-[var(--color-text-secondary)]">
                          {m.currentLocation} · Update {m.lastUpdate}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setTelemetryMember(m)}
                        className="rounded-lg bg-[#E5F4F8] dark:bg-[#19394B] px-3 py-2 font-bold text-[#236D91] dark:text-[#87CEEB] cursor-pointer"
                      >
                        Detail
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ================================================================
           * SCREEN 12 (14): GPS HISTORY
           * ================================================================ */}
          {activeTab === 'gps_history' && hasTeamLocation && (
            <div className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold mb-1">
                    Pilih Staff
                  </label>
                  <select
                    value={historyStaffId}
                    onChange={(e) => setHistoryStaffId(e.target.value)}
                    className="w-full rounded-xl border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-3.5 py-2.5 text-sm font-semibold"
                  >
                    {teamMembers.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name} ({m.area})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1">
                    Tanggal
                  </label>
                  <input
                    type="date"
                    value={historyDate}
                    onChange={(e) => setHistoryDate(e.target.value)}
                    className="w-full rounded-xl border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-3.5 py-2.5 text-sm tabular-nums"
                  />
                </div>
              </div>

              <SalesGoogleMap
                currentPos={{ lat: historyStaff.lat, lng: historyStaff.lng }}
                outlets={outlets.slice(0, 4)}
                selectedOutlet={outlets[1]}
                onSelectOutlet={() => {}}
                showRouteToSelected={true}
                heightClass="h-[300px]"
              />

              <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 space-y-4">
                <h3 className="text-base font-bold text-[#123A54] dark:text-white">
                  Ringkasan Perjalanan ({historyStaff.name})
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-3 text-center">
                  <div className="rounded-xl bg-[var(--color-background)] p-3">
                    <p className="text-xs text-[var(--color-text-muted)]">Jarak</p>
                    <p className="text-base font-bold tabular-nums mt-0.5">
                      {(24.2 + (historyStaff.visitsToday || 3) * 0.6).toFixed(1)} km
                    </p>
                  </div>
                  <div className="rounded-xl bg-[var(--color-background)] p-3">
                    <p className="text-xs text-[var(--color-text-muted)]">
                      Durasi
                    </p>
                    <p className="text-base font-bold tabular-nums mt-0.5">
                      6j 12m
                    </p>
                  </div>
                  <div className="rounded-xl bg-[var(--color-background)] p-3">
                    <p className="text-xs text-[var(--color-text-muted)]">Titik</p>
                    <p className="text-base font-bold tabular-nums mt-0.5">
                      {24 + historyStaff.visitsToday * 2}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setJourneyDetailOpen(true)}
                  className="w-full rounded-xl bg-[#348CB2] hover:bg-[#236D91] py-2.5 text-sm font-bold text-white cursor-pointer"
                >
                  Lihat Detail Perjalanan
                </button>
              </div>
            </div>
          )}

          {/* ================================================================
           * SCREEN 13 (15): VISIT MONITORING
           * ================================================================ */}
          {activeTab === 'visits' && (
            <div className="space-y-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="grid grid-cols-3 gap-1.5 rounded-xl bg-[var(--color-surface-muted)] p-1 w-full max-w-md">
                  {(['Jadwal', 'Realisasi', 'Peta'] as const).map((sub) => (
                    <button
                      key={sub}
                      type="button"
                      onClick={() => setVisitSubTab(sub)}
                      className={`rounded-lg py-2 text-xs font-bold cursor-pointer ${
                        visitSubTab === sub
                          ? 'bg-[#348CB2] text-white'
                          : 'text-[var(--color-text-secondary)]'
                      }`}
                    >
                      {sub}
                    </button>
                  ))}
                </div>
                <select
                  value={visitDateKey}
                  onChange={(e) =>
                    setVisitDateKey(
                      e.target.value as 'today' | 'tomorrow' | 'thursday'
                    )
                  }
                  className="rounded-xl border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-3.5 py-2 text-xs font-bold"
                >
                  <option value="today">Hari ini, 24 Jun 2025</option>
                  <option value="tomorrow">Besok, 25 Jun 2025</option>
                  <option value="thursday">Kam, 26 Jun 2025</option>
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-3">
                {[
                  { label: 'Target', val: '120' },
                  { label: 'Kunjungan', val: '98' },
                  { label: 'Cakupan', val: '81,7%' },
                ].map((k) => (
                  <div
                    key={k.label}
                    className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 text-center"
                  >
                    <p className="text-xs text-[var(--color-text-muted)]">
                      {k.label}
                    </p>
                    <p className="text-xl font-bold text-[#123A54] dark:text-white tabular-nums mt-1">
                      {k.val}
                    </p>
                  </div>
                ))}
              </div>

              {visitSubTab === 'Peta' ? (
                <SalesGoogleMap
                  currentPos={{ lat: -6.595204, lng: 106.797781 }}
                  outlets={outlets}
                  selectedOutlet={outlets[0]}
                  onSelectOutlet={() => {}}
                  showRouteToSelected={false}
                />
              ) : (
                <div className="space-y-2.5">
                  {INITIAL_VISITS.filter((v) =>
                    visitSubTab === 'Realisasi'
                      ? v.status === 'Selesai' || v.status === 'Sedang Berjalan'
                      : v.dateKey === visitDateKey
                  ).map((v) => (
                    <div
                      key={v.id}
                      className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 text-xs"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#E5F4F8] dark:bg-[#19394B] text-[#348CB2]">
                          <Clock className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="text-sm font-bold">{v.outletName}</p>
                          <p className="text-[var(--color-text-secondary)] tabular-nums">
                            Check-in: {v.timeRange} · {v.city}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span
                          className={`font-bold ${
                            v.status === 'Selesai'
                              ? 'text-[#10B981]'
                              : v.status === 'Sedang Berjalan'
                                ? 'text-[#348CB2]'
                                : 'text-[var(--color-text-muted)]'
                          }`}
                        >
                          {v.status}
                        </span>
                        <button
                          type="button"
                          onClick={() => setVisitEvidence(v)}
                          className="rounded-lg border border-[var(--color-border-strong)] px-3 py-1.5 font-semibold hover:bg-[var(--color-surface-muted)] cursor-pointer"
                        >
                          Bukti Kunjungan
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ================================================================
           * SCREEN 19: ABSENSI & GEOFENCE TIM
           * ================================================================ */}
          {activeTab === 'attendance' && (
            <div className="space-y-5">
              <div>
                <h2 className="text-lg font-bold text-[#123A54] dark:text-white">
                  Absensi & Validasi Geofence Tim
                </h2>
                <p className="text-xs text-[var(--color-text-muted)]">
                  Pantau kehadiran shift harian, ketepatan jam masuk, dan radius GPS kantor cabang
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-3">
                <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 text-center">
                  <p className="text-xs text-[var(--color-text-muted)]">Hadir Tepat</p>
                  <p className="text-xl font-bold text-[#10B981] tabular-nums mt-1">
                    {attendanceRecords.filter((a) => a.status === 'Hadir').length}
                  </p>
                </div>
                <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 text-center">
                  <p className="text-xs text-[var(--color-text-muted)]">Terlambat</p>
                  <p className="text-xl font-bold text-[#F97316] tabular-nums mt-1">
                    {attendanceRecords.filter((a) => a.status === 'Terlambat').length}
                  </p>
                </div>
                <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 text-center">
                  <p className="text-xs text-[var(--color-text-muted)]">Belum Absen</p>
                  <p className="text-xl font-bold text-[var(--color-text-secondary)] tabular-nums mt-1">
                    {attendanceRecords.filter((a) => a.status === 'Belum Absen').length}
                  </p>
                </div>
              </div>

              <div className="space-y-2.5">
                {attendanceRecords.map((att) => (
                  <button
                    key={att.id}
                    type="button"
                    onClick={() => setSelectedAttendance(att)}
                    className="w-full flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 text-left hover:border-[#348CB2] cursor-pointer"
                  >
                    <div className="flex items-center gap-3.5">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#E5F4F8] dark:bg-[#19394B] text-[#348CB2]">
                        <Clock className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-sm font-bold">{att.staffName}</p>
                        <p className="text-xs text-[var(--color-text-secondary)]">
                          {att.branchName} · Masuk: {att.clockInTime} · {att.geofenceStatus}
                        </p>
                      </div>
                    </div>
                    <span
                      className={`rounded-lg px-2.5 py-1 text-xs font-bold ${
                        att.status === 'Hadir'
                          ? 'bg-[#ECFDF5] text-[#047857]'
                          : att.status === 'Terlambat'
                            ? 'bg-[#FFF7ED] text-[#C2410C]'
                            : 'bg-[var(--color-surface-muted)] text-[var(--color-text-muted)]'
                      }`}
                    >
                      {att.status}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ================================================================
           * SCREEN 14 (16): ORDER OVERVIEW
           * ================================================================ */}
          {activeTab === 'orders' && (
            <div className="space-y-4">
              <div className="flex flex-wrap gap-1.5">
                {(
                  [
                    'Semua',
                    'Pending',
                    'Diproses',
                    'Dikirim',
                    'Selesai',
                    'Batal',
                  ] as const
                ).map((st) => (
                  <button
                    key={st}
                    type="button"
                    onClick={() => setOrderSubTab(st)}
                    className={`rounded-xl px-4 py-2 text-xs font-bold cursor-pointer ${
                      orderSubTab === st
                        ? 'bg-[#348CB2] text-white'
                        : 'border border-[var(--color-border)] bg-[var(--color-surface)]'
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>

              <div className="relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--color-text-muted)]" />
                <input
                  type="text"
                  value={orderSearch}
                  onChange={(e) => setOrderSearch(e.target.value)}
                  placeholder="Cari nomor order atau outlet..."
                  className="w-full rounded-xl border border-[var(--color-border-strong)] bg-[var(--color-surface)] pl-10 pr-4 py-2.5 text-sm"
                />
              </div>

              <div className="space-y-2.5">
                {orders
                  .filter(
                    (o) =>
                      (orderSubTab === 'Semua' || o.status === orderSubTab) &&
                      (o.id.toLowerCase().includes(orderSearch.toLowerCase()) ||
                        o.outletName
                          .toLowerCase()
                          .includes(orderSearch.toLowerCase()))
                  )
                  .map((ord) => (
                    <button
                      key={ord.id}
                      type="button"
                      onClick={() => setSelectedOrderApproval(ord)}
                      className="w-full flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 text-left hover:border-[#348CB2] cursor-pointer"
                    >
                      <div>
                        <p className="text-xs font-mono font-bold text-[#348CB2]">
                          {ord.id}
                        </p>
                        <p className="text-sm font-bold mt-0.5">
                          {ord.outletName} · {ord.branchName}
                        </p>
                        <p className="text-xs text-[var(--color-text-muted)] mt-0.5 tabular-nums">
                          {ord.dateLabel} · Sales: {ord.salesName}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-[#123A54] dark:text-white tabular-nums">
                          {formatRupiah(ord.total)}
                        </p>
                        <span
                          className={`inline-block mt-1 text-xs font-bold ${
                            ord.status === 'Selesai'
                              ? 'text-[#10B981]'
                              : ord.status === 'Pending'
                                ? 'text-[#F97316]'
                                : ord.status === 'Batal'
                                  ? 'text-red-600'
                                  : 'text-[#348CB2]'
                          }`}
                        >
                          {ord.status}
                        </span>
                      </div>
                    </button>
                  ))}
              </div>
            </div>
          )}

          {/* ================================================================
           * SCREEN 15 (17): MANAJEMEN PROMOSI
           * ================================================================ */}
          {activeTab === 'promotions' && (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="grid grid-cols-3 gap-1 rounded-xl bg-[var(--color-surface-muted)] p-1">
                  {(['Program', 'Campaign', 'Voucher'] as const).map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setPromoSubTab(t)}
                      className={`rounded-lg px-3.5 py-1.5 text-xs font-bold cursor-pointer ${
                        promoSubTab === t
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
                  onClick={() => setAddPromoOpen(true)}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-[#348CB2] hover:bg-[#236D91] px-4 py-2 text-xs sm:text-sm font-bold text-white cursor-pointer"
                >
                  <Plus className="h-4 w-4" />
                  <span>Buat Program Promosi</span>
                </button>
              </div>

              {promoSubTab === 'Voucher' ? (
                <div className="space-y-2.5">
                  {CUSTOMER_INITIAL_VOUCHERS.map((vc) => (
                    <div
                      key={vc.id}
                      className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4"
                    >
                      <div>
                        <span className="rounded-lg bg-[#FFF7ED] dark:bg-[#431407]/40 px-2.5 py-1 font-mono text-xs font-bold text-[#F97316]">
                          {vc.code}
                        </span>
                        <p className="text-sm font-bold mt-1.5">{vc.title}</p>
                        <p className="text-xs text-[var(--color-text-muted)] tabular-nums">
                          Min. Belanja {formatRupiah(vc.minSpend)} · Berlaku s/d{' '}
                          {vc.validUntil}
                        </p>
                      </div>
                      <span className="rounded-lg bg-[#ECFDF5] px-3 py-1.5 text-xs font-bold text-[#047857]">
                        Aktif (SmartReward)
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-2.5">
                  {promotions
                    .filter(
                      (p) =>
                        promoSubTab === 'Program' ||
                        (promoSubTab === 'Campaign' && p.type === 'Campaign')
                    )
                    .map((p) => (
                      <div
                        key={p.id}
                        className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4"
                      >
                        <button
                          type="button"
                          onClick={() => setSelectedPromoDetail(p)}
                          className="flex items-start gap-3 text-left flex-1 cursor-pointer"
                        >
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#FFF7ED] dark:bg-[#431407]/40 text-[#F97316]">
                            <Tag className="h-5 w-5" />
                          </div>
                          <div>
                            <p className="text-sm font-bold">{p.title}</p>
                            <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">
                              Periode s/d {p.validUntil} · {p.discountRule}
                            </p>
                          </div>
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            setPromotions((prev) =>
                              prev.map((item) =>
                                item.id === p.id
                                  ? {
                                      ...item,
                                      status:
                                        item.status === 'Aktif'
                                          ? 'Berakhir'
                                          : 'Aktif',
                                    }
                                  : item
                              )
                            )
                          }
                          className={`rounded-lg px-3 py-1.5 text-xs font-bold cursor-pointer ${
                            p.status === 'Aktif'
                              ? 'bg-[#ECFDF5] text-[#047857]'
                              : 'bg-[var(--color-surface-muted)] text-[var(--color-text-muted)]'
                          }`}
                        >
                          {p.status}
                        </button>
                      </div>
                    ))}
                </div>
              )}
            </div>
          )}

          {/* ================================================================
           * SCREEN 16 (18): LAPORAN
           * ================================================================ */}
          {activeTab === 'reports' && (
            <div className="space-y-4">
              <div>
                <h2 className="text-lg font-bold text-[#123A54] dark:text-white">
                  Pilih Laporan Perusahaan
                </h2>
                <p className="text-xs text-[var(--color-text-muted)]">
                  Klik laporan untuk meninjau ringkasan data dan mengunduh CSV
                </p>
              </div>
              <div className="space-y-2.5">
                {COMPANY_REPORTS_LIST.map((rep) => (
                  <button
                    key={rep.id}
                    type="button"
                    onClick={() => setSelectedReport(rep)}
                    className="w-full flex items-center justify-between gap-4 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 text-left hover:border-[#348CB2] cursor-pointer"
                  >
                    <div className="flex items-center gap-3.5">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#E5F4F8] dark:bg-[#19394B] text-[#348CB2]">
                        <FileText className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-sm font-bold">{rep.title}</p>
                        <p className="text-xs text-[var(--color-text-secondary)]">
                          {rep.subtitle}
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
           * SCREEN 17 (19): INTEGRATION SETTINGS (WORKSPACE, MAPS, AI, ERP)
           * ================================================================ */}
          {activeTab === 'integrations' && (
            <div className="space-y-4">
              <div>
                <h2 className="text-lg font-bold text-[#123A54] dark:text-white">
                  Pengaturan Integrasi & Plugin Ekosistem
                </h2>
                <p className="text-xs text-[var(--color-text-muted)]">
                  Kelola API, ERP, Inventory, Staff AI, Google Workspace, &
                  Google Maps Platform
                </p>
              </div>
              <div className="space-y-2.5">
                {integrations.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setSelectedIntegration(item)}
                    className="w-full flex items-center justify-between gap-4 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 text-left hover:border-[#348CB2] cursor-pointer"
                  >
                    <div className="flex items-center gap-3.5">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#E5F4F8] dark:bg-[#19394B] text-[#348CB2]">
                        <SlidersHorizontal className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-sm font-bold">{item.title}</p>
                        <p className="text-xs text-[var(--color-text-secondary)]">
                          {item.subtitle}
                        </p>
                        <p className="text-[11px] font-semibold text-[#10B981] mt-0.5">
                          {item.lastSync}
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
           * SCREEN 18 (20): MASTER DATA & PERFORMA
           * ================================================================ */}
          {activeTab === 'master_perf' && (
            <div className="space-y-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="grid grid-cols-3 gap-1 rounded-xl bg-[var(--color-surface-muted)] p-1">
                  {(['Master Data', 'Evaluasi Tim', 'Ranking'] as const).map(
                    (tab) => (
                      <button
                        key={tab}
                        type="button"
                        onClick={() => setMasterSubTab(tab)}
                        className={`rounded-lg px-3 py-1.5 text-xs font-bold cursor-pointer ${
                          masterSubTab === tab
                            ? 'bg-[#348CB2] text-white'
                            : 'text-[var(--color-text-secondary)]'
                        }`}
                      >
                        {tab}
                      </button>
                    )
                  )}
                </div>
                <select
                  value={period}
                  onChange={(e) =>
                    setPeriod(e.target.value as 'Bulan Ini' | 'Kuartal Ini')
                  }
                  className="rounded-xl border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-3 py-2 text-xs font-bold"
                >
                  <option value="Bulan Ini">Bulan Ini</option>
                  <option value="Kuartal Ini">Kuartal Ini</option>
                </select>
              </div>

              {masterSubTab === 'Ranking' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    {(
                      [
                        'Ranking Sales',
                        'Ranking Cabang',
                        'Ranking Outlet',
                      ] as const
                    ).map((rt) => (
                      <button
                        key={rt}
                        type="button"
                        onClick={() => setRankingSubTab(rt)}
                        className={`rounded-xl py-2 px-3 text-xs font-bold cursor-pointer ${
                          rankingSubTab === rt
                            ? 'bg-[#123A54] text-white'
                            : 'border border-[var(--color-border)] bg-[var(--color-surface)]'
                        }`}
                      >
                        {rt}
                      </button>
                    ))}
                  </div>

                  <div className="space-y-2.5">
                    {rankingSubTab === 'Ranking Sales' &&
                      teamMembers
                        .filter((m) => m.role === 'Sales Rep')
                        .map((s, idx) => (
                          <div
                            key={s.id}
                            className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4"
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#F97316] text-xs font-bold text-white tabular-nums">
                                {idx + 1}
                              </span>
                              <div className="min-w-0">
                                <p className="text-sm font-bold truncate">{s.name}</p>
                                <p className="text-xs text-[var(--color-text-muted)]">
                                  {s.area}
                                </p>
                              </div>
                            </div>
                            <div className="text-right ml-auto">
                              <p className="text-sm font-bold tabular-nums">
                                {formatRupiah(s.monthlyOrderValue * factor)}
                              </p>
                              <p className="text-xs font-bold text-[#10B981] tabular-nums">
                                +{(18.2 - idx * 2.1).toFixed(1)}%
                              </p>
                            </div>
                          </div>
                        ))}

                    {rankingSubTab === 'Ranking Cabang' &&
                      branches.map((b, idx) => (
                        <div
                          key={b.id}
                          className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#348CB2] text-xs font-bold text-white tabular-nums">
                              {idx + 1}
                            </span>
                            <div className="min-w-0">
                              <p className="text-sm font-bold truncate">{b.name}</p>
                              <p className="text-xs text-[var(--color-text-muted)]">
                                {b.city}
                              </p>
                            </div>
                          </div>
                          <p className="text-sm font-bold tabular-nums ml-auto">
                            {formatRupiah(b.monthlyRealized * factor)}
                          </p>
                        </div>
                      ))}

                    {rankingSubTab === 'Ranking Outlet' &&
                      outlets.slice(0, 5).map((o, idx) => (
                        <div
                          key={o.id}
                          className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#10B981] text-xs font-bold text-white tabular-nums">
                              {idx + 1}
                            </span>
                            <div className="min-w-0">
                              <p className="text-sm font-bold truncate">{o.name}</p>
                              <p className="text-xs text-[var(--color-text-muted)]">
                                {o.city} · {o.category}
                              </p>
                            </div>
                          </div>
                          <p className="text-sm font-bold tabular-nums ml-auto">
                            {formatRupiah(o.lastOrderTotal * factor)}
                          </p>
                        </div>
                      ))}
                  </div>
                </div>
              )}

              {masterSubTab === 'Master Data' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
                  {[
                    {
                      label: 'Cabang Distribusi',
                      val: `${branches.length} Cabang Aktif`,
                      tab: 'branches' as const,
                    },
                    {
                      label: 'Teritori Wilayah',
                      val: `${territories.length} Zona Terpetakan`,
                      tab: 'territories' as const,
                    },
                    {
                      label: 'Outlet Terdaftar',
                      val: `${outlets.length + 1039} Outlet Mitra`,
                      tab: 'outlets' as const,
                    },
                    {
                      label: 'Katalog Produk',
                      val: `${products.length} SKU Terkelola`,
                      tab: 'products' as const,
                    },
                  ].map((dir) => (
                    <button
                      key={dir.label}
                      type="button"
                      onClick={() => setActiveTab(dir.tab)}
                      className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 text-left hover:border-[#348CB2] cursor-pointer"
                    >
                      <p className="text-xs text-[var(--color-text-muted)]">
                        {dir.label}
                      </p>
                      <p className="text-base font-bold text-[#123A54] dark:text-white tabular-nums mt-1">
                        {dir.val}
                      </p>
                      <span className="inline-block mt-2 text-xs font-bold text-[#348CB2]">
                        Kelola Data →
                      </span>
                    </button>
                  ))}
                </div>
              )}

              {masterSubTab === 'Evaluasi Tim' && (
                <div className="space-y-2.5">
                  {teamMembers.map((tm) => {
                    const coverage = Math.round(
                      (tm.visitsToday / Math.max(1, tm.targetVisits)) * 100
                    );
                    return (
                      <button
                        key={tm.id}
                        type="button"
                        onClick={() => setTelemetryMember(tm)}
                        className="w-full flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 text-left hover:border-[#348CB2] cursor-pointer"
                      >
                        <div>
                          <p className="text-sm font-bold">{tm.name}</p>
                          <p className="text-xs text-[var(--color-text-muted)]">
                            {tm.role} · {tm.area}
                          </p>
                        </div>
                        <div className="flex items-center gap-4 text-xs">
                          <div className="text-right">
                            <p className="text-[var(--color-text-muted)]">Kunjungan</p>
                            <p className="font-bold tabular-nums">
                              {tm.visitsToday}/{tm.targetVisits} ({coverage}%)
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-[var(--color-text-muted)]">Realisasi</p>
                            <p className="font-bold text-[#348CB2] tabular-nums">
                              {formatRupiah(tm.monthlyOrderValue)}
                            </p>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </main>
      </div>

      {/* Mobile Bottom Navigation (matching Reference Sheet: Beranda, Analytics, Order, Master, Lainnya) */}
      <nav className="lg:hidden fixed bottom-0 inset-x-0 z-30 border-t border-[var(--color-border)] bg-[var(--color-surface)]/95 backdrop-blur-md grid grid-cols-5 pb-[env(safe-area-inset-bottom)]">
        {[
          { id: 'dashboard' as const, label: 'Beranda', icon: LayoutDashboard },
          { id: 'analytics' as const, label: 'Analytics', icon: TrendingUp },
          { id: 'orders' as const, label: 'Order', icon: ShoppingBag },
          { id: 'branches' as const, label: 'Master', icon: Building2 },
          { id: 'integrations' as const, label: 'Lainnya', icon: Settings },
        ].map((navItem) => {
          const NavIcon = navItem.icon;
          const active = activeTab === navItem.id;
          return (
            <button
              key={navItem.id}
              type="button"
              onClick={() => setActiveTab(navItem.id)}
              className={`flex flex-col items-center justify-center py-2.5 text-[11px] font-semibold cursor-pointer ${
                active
                  ? 'text-[#348CB2]'
                  : 'text-[var(--color-text-muted)]'
              }`}
            >
              <NavIcon className="h-5 w-5 mb-0.5" />
              <span>{navItem.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Mobile Full Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div
            className="fixed inset-0 bg-slate-900/50"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="relative z-10 w-72 max-w-[85vw] bg-[var(--color-surface)] h-full overflow-y-auto p-4 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[var(--color-border)]">
              <BrandLogo subtitle="COMPANY PORTAL" compact />
              <button
                type="button"
                onClick={() => setMobileMenuOpen(false)}
                className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg border border-[var(--color-border)] cursor-pointer"
                aria-label="Tutup menu"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="sm:hidden pb-2 border-b border-[var(--color-border)]">
              <PWAInstallButton variant="compact" />
            </div>
            {SIDEBAR_GROUPS.map((grp) => (
              <div key={grp.group} className="space-y-1">
                <p className="px-2 text-[11px] font-bold uppercase text-[var(--color-text-muted)]">
                  {grp.group}
                </p>
                {grp.items.map((item) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => {
                        setActiveTab(item.id);
                        setMobileMenuOpen(false);
                      }}
                      className={`w-full flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-semibold cursor-pointer ${
                        activeTab === item.id
                          ? 'bg-[#348CB2] text-white'
                          : 'text-[var(--color-text-secondary)]'
                      }`}
                    >
                      <Icon className="h-4 w-4 shrink-0" />
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Company Portal Modals */}
      <AddBranchModal
        open={addBranchOpen}
        onClose={() => setAddBranchOpen(false)}
        onAdd={(b) => { void persistBranch(b).catch((error: unknown) => setMasterDataError(error instanceof Error ? error.message : 'Cabang gagal disimpan.')); }}
      />
      <BranchDetailModal
        branch={selectedBranch}
        canToggleStatus={auth.canPerformApiAction('master.branches.update')}
        onClose={() => setSelectedBranch(null)}
        onEdit={(id) => { setSelectedBranch(null); openMasterDataEdit('branches', id); }}
        onToggleStatus={(id) => { void toggleBranchStatus(id).catch((error: unknown) => setMasterDataError(error instanceof Error ? error.message : 'Status cabang gagal diperbarui.')); }}
      />
      <AddTeamMemberModal
        open={addTeamOpen}
        branches={branches}
        supervisors={organizationMembers.filter((member) => member.status === 'active').map((member) => ({
          userId: member.user_id, name: asText(member.display_name) || asText(member.email) || member.user_id,
        }))}
        teams={teams.map((team) => ({ id: asText(team.id), name: asText(team.name) }))}
        onClose={() => setAddTeamOpen(false)}
        onAdd={async (team) => {
          if (!auth.apiClient || !auth.activeOrganizationId || !auth.canPerformApiAction('master.teams.create')) {
            throw new Error('Akses pembuatan tim tidak diizinkan.');
          }
          const row = await auth.apiClient.createTeam(auth.activeOrganizationId, {
            code: masterCode(team.name), name: team.name, branch_id: team.branchId,
            supervisor_user_id: team.supervisorUserId || undefined,
            parent_team_id: team.parentTeamId || undefined, status: 'active',
          });
          setTeams((previous) => [row as TeamRecord, ...previous]);
        }}
      />
      <AddTerritoryModal
        open={addTerritoryOpen}
        branches={branches}
        onClose={() => setAddTerritoryOpen(false)}
        onAdd={(t) => { void persistTerritory(t).catch((error: unknown) => setMasterDataError(error instanceof Error ? error.message : 'Teritori gagal disimpan.')); }}
      />
      <AddOutletCompanyModal
        open={addOutletOpen}
        branches={branches}
        territories={territories}
        onClose={() => setAddOutletOpen(false)}
        onAdd={(o) => { void persistOutlet(o).catch((error: unknown) => setMasterDataError(error instanceof Error ? error.message : 'Outlet gagal disimpan.')); }}
      />
      <AddProductModal
        open={addProductOpen}
        onClose={() => setAddProductOpen(false)}
        onAdd={(p) => setProducts((prev) => [p, ...prev])}
      />
      <AddPromotionModal
        open={addPromoOpen}
        onClose={() => setAddPromoOpen(false)}
        onAdd={(pr) => setPromotions((prev) => [pr, ...prev])}
      />
      <TeamTelemetryModal
        member={telemetryMember}
        onClose={() => setTelemetryMember(null)}
      />
      <GpsJourneyDetailModal
        open={journeyDetailOpen}
        memberName={historyStaff.name}
        dateLabel={historyDate}
        onClose={() => setJourneyDetailOpen(false)}
      />
      <CompanyOrderApprovalModal
        order={selectedOrderApproval}
        onClose={() => setSelectedOrderApproval(null)}
        onUpdateStatus={(id, status, cancelReason) =>
          setOrders((prev) =>
            prev.map((o) =>
              o.id === id ? { ...o, status, cancelReason } : o
            )
          )
        }
      />
      <ReportPreviewModal
        report={selectedReport}
        branches={branches}
        orders={orders}
        onClose={() => setSelectedReport(null)}
      />
      <IntegrationConfigModal
        integration={selectedIntegration}
        outlets={outlets}
        onClose={() => setSelectedIntegration(null)}
        onToggleConnect={(id) =>
          setIntegrations((prev) =>
            prev.map((item) =>
              item.id === id ? { ...item, connected: !item.connected } : item
            )
          )
        }
      />
      <CompanyNotificationsModal
        open={notificationsOpen}
        notifications={notifications}
        onMarkAllRead={() =>
          setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
        }
        onClose={() => setNotificationsOpen(false)}
      />
      <AttendanceDetailModal
        record={selectedAttendance}
        onClose={() => setSelectedAttendance(null)}
        onUpdateStatus={(id, nextStatus) =>
          setAttendanceRecords((prev) =>
            prev.map((a) => (a.id === id ? { ...a, status: nextStatus } : a))
          )
        }
      />
      <EditUserAssignmentModal
        key={editingUserAssignment?.id || 'none'}
        member={editingUserAssignment}
        teams={teams.map((team) => ({ id: asText(team.id), name: asText(team.name), branchId: asText(team.branch_id) }))}
        territories={territories}
        supervisors={organizationMembers.filter((member) => member.status === 'active').map((member) => ({
          userId: member.user_id, name: asText(member.display_name) || asText(member.email) || member.user_id,
        }))}
        onClose={() => setEditingUserAssignment(null)}
        onSave={async (updated) => {
          if (!auth.apiClient || !auth.activeOrganizationId || !auth.canPerformApiAction('master.sales_profiles.update')) {
            throw new Error('Akses perubahan penugasan sales profile tidak diizinkan.');
          }
          const row = await auth.apiClient.updateSalesProfile(auth.activeOrganizationId, updated.id, {
            team_id: updated.teamId || null, territory_id: updated.territoryId || null, manager_user_id: updated.managerUserId ?? null,
            status: updated.status === 'Online' ? 'active' : 'inactive',
          });
          setTeamMembers((previous) => previous.map((member) => member.id === updated.id ? {
            ...member, teamId: asText(row.team_id), territoryId: asText(row.territory_id), managerUserId: asText(row.manager_user_id) || undefined,
            area: updated.area, branchId: updated.branchId, status: row.status === 'active' ? 'Online' : 'Offline',
          } : member));
          setEditingUserAssignment(null);
        }}
      />
      <EditCompanyMasterDataModal
        key={editingMasterData ? editingMasterData.resource + ':' + asText(editingMasterData.record.id) : 'master-data-closed'}
        resource={editingMasterData?.resource ?? null}
        record={editingMasterData?.record ?? null}
        branches={branches.map((item) => ({ id: item.id, name: item.name }))}
        teams={teams.map((item) => ({ id: asText(item.id), name: asText(item.name) }))}
        territories={territories.map((item) => ({ id: item.id, name: item.name, branchId: item.branchId }))}
        supervisors={organizationMembers.filter((member) => member.status === 'active').map((member) => ({
          userId: member.user_id, name: asText(member.display_name) || asText(member.email) || member.user_id,
        }))}
        onClose={() => setEditingMasterData(null)}
        onSave={saveMasterDataEdit}
      />
      <EditProductCompanyModal
        key={editingProduct?.sku || 'none'}
        product={editingProduct}
        onClose={() => setEditingProduct(null)}
        onSave={(updated) =>
          setProducts((prev) =>
            prev.map((p) => (p.sku === updated.sku ? updated : p))
          )
        }
      />
      <SetTargetModal
        key={targetModalOpen ? 'target-open' : 'target-closed'}
        open={targetModalOpen}
        companyTarget={companyTargetOrder}
        branches={branches}
        onClose={() => setTargetModalOpen(false)}
        onSave={(newCompanyTarget, branchTargets) => {
          setCompanyTargetOrder(newCompanyTarget);
          setBranches((prev) =>
            prev.map((b) => ({
              ...b,
              monthlyTarget: branchTargets[b.id] ?? b.monthlyTarget,
            }))
          );
        }}
      />
      <PromoDetailCompanyModal
        promo={selectedPromoDetail}
        onClose={() => setSelectedPromoDetail(null)}
        onToggleStatus={(id) =>
          setPromotions((prev) =>
            prev.map((p) =>
              p.id === id
                ? { ...p, status: p.status === 'Aktif' ? 'Berakhir' : 'Aktif' }
                : p
            )
          )
        }
      />

      {/* Outlet Detail Modal */}
      <Modal
        open={Boolean(selectedOutletDetail)}
        onClose={() => setSelectedOutletDetail(null)}
        title={selectedOutletDetail?.name || ''}
        subtitle={`${selectedOutletDetail?.city || ''} · ${selectedOutletDetail?.category || ''}`}
        maxWidthClass="max-w-md"
      >
        {selectedOutletDetail && (
          <div className="space-y-4 text-xs">
            <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] p-4 space-y-2">
              <div className="flex justify-between">
                <span className="text-[var(--color-text-muted)]">PIC Outlet</span>
                <span className="font-bold">{selectedOutletDetail.picName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--color-text-muted)]">Telepon</span>
                <span className="font-semibold tabular-nums">
                  {selectedOutletDetail.phone}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--color-text-muted)]">Alamat</span>
                <span className="font-medium text-right max-w-[60%]">
                  {selectedOutletDetail.address}
                </span>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <button type="button" disabled={!auth.canPerformApiAction('master.outlets.update')} onClick={() => { const id = selectedOutletDetail.id; setSelectedOutletDetail(null); openMasterDataEdit('outlets', id); }} className="rounded-xl border border-[var(--color-border-strong)] px-4 py-2 font-semibold">Edit Data</button>
              <button
                type="button"
                disabled={!auth.canPerformApiAction('master.outlets.update')}
                onClick={() => {
                  void toggleOutletStatus(selectedOutletDetail.id).catch((error: unknown) => setMasterDataError(error instanceof Error ? error.message : 'Status outlet gagal diperbarui.'));
                  setSelectedOutletDetail(null);
                }}
                className="rounded-xl border border-[var(--color-border-strong)] px-4 py-2 font-semibold cursor-pointer"
              >
                Ubah Status ({selectedOutletDetail.status})
              </button>
              <button
                type="button"
                onClick={() => setSelectedOutletDetail(null)}
                className="rounded-xl bg-[#348CB2] px-4 py-2 font-bold text-white cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Visit Proof Modal */}
      <Modal
        open={Boolean(visitEvidence)}
        onClose={() => setVisitEvidence(null)}
        title={`Bukti Kunjungan: ${visitEvidence?.outletName || ''}`}
        subtitle={`${visitEvidence?.city || ''} · Jam ${visitEvidence?.timeRange || ''}`}
        maxWidthClass="max-w-sm"
      >
        {visitEvidence && (
          <div className="space-y-3 text-xs">
            <div className="rounded-xl bg-[#E5F4F8] dark:bg-[#19394B] p-4 flex items-center gap-3">
              <CheckCircle2 className="h-6 w-6 text-[#10B981] shrink-0" />
              <div>
                <p className="font-bold text-[#123A54] dark:text-white">
                  Check-in Dalam Radius Geofence Outlet
                </p>
                <p className="text-[11px] text-[var(--color-text-secondary)] tabular-nums">
                  Koordinat {visitEvidence.lat.toFixed(5)},{' '}
                  {visitEvidence.lng.toFixed(5)} · Akurasi ± 5 m
                </p>
              </div>
            </div>
            <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] p-3.5">
              <p className="font-semibold mb-1 flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5 text-[#348CB2]" />
                <span>Catatan Kunjungan Sales:</span>
              </p>
              <p className="text-[var(--color-text-secondary)]">
                {visitEvidence.notes ||
                  'Kunjungan terjadwal ke outlet mitra PT Maju Distribusi.'}
              </p>
            </div>
          </div>
        )}
      </Modal>

      {/* Logout Confirmation Modal */}
      <Modal
        open={logoutConfirmOpen}
        onClose={() => setLogoutConfirmOpen(false)}
        title="Keluar dari Company Portal?"
        subtitle="Sesi manajemen perusahaan Anda akan diakhiri"
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
              void auth.signOut('local');
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
