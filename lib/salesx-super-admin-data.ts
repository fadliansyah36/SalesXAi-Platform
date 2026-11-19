import type { Outlet } from './salesx-data';

/* ============================================================================
 * SUPER ADMIN PORTAL DATA & TYPES (admin.salesx-ai.com)
 * ============================================================================ */

export interface PlatformTenant {
  id: string; // e.g. TEN-0001
  name: string;
  plan: 'Basic' | 'Pro' | 'Enterprise' | 'Trial' | 'Belum dikonfigurasi';
  status: 'Aktif' | 'Trial' | 'Nonaktif';
  usersCount: number;
  monthlyOrders: number;
  monthlyGmvM: number; // in Miliar Rp
  domain: string;
  picName: string;
  picEmail: string;
  city: string;
  lat: number;
  lng: number;
  renewalDate: string;
}

export interface OrganizationNode {
  id: string;
  tenantId: string;
  name: string;
  nodeType: 'Head Office' | 'Cabang' | 'Gudang Regional';
  city: string;
  managerName: string;
  usersCount: number;
  status: 'Aktif' | 'Nonaktif';
}

export interface PlatformUserRecord {
  id: string;
  name: string;
  email: string;
  tenantId: string;
  tenantName: string;
  role: string;
  status: 'Aktif' | 'Suspended' | 'Pending' | 'Deactivated';
  mfaEnabled: boolean;
  lastActive: string;
}

export interface MasterDataCategory {
  id: string;
  title: string;
  subtitle: string;
  recordsCount: number;
  updatedLabel: string;
  items: Array<{
    id: string;
    code: string;
    name: string;
    detail: string;
    status: 'Aktif' | 'Nonaktif';
  }>;
}

export interface ServiceRegistryItem {
  id: string;
  name: string;
  version: string;
  runtime: string;
  status: 'Aktif' | 'Degraded' | 'Nonaktif';
  uptimePct: string;
  latencyMs: number;
  endpoint: string;
}

export interface DomainRegistryItem {
  id: string;
  domain: string;
  portalName: string;
  internalRoute: string;
  sslStatus: 'Valid · TLS 1.3' | 'Pending';
  status: 'Aktif' | 'Nonaktif';
  targetApp: string;
}

export interface FeatureFlagItem {
  id: string;
  key: string;
  label: string;
  description: string;
  enabled: boolean;
  rolloutScope: 'Semua Tenant' | 'Enterprise & Pro' | 'Pilot Beta';
}

export interface SubscriptionPackageItem {
  id: string;
  name: string;
  tagline: string;
  priceLabel: string;
  priceNumeric: number;
  maxUsers: number;
  maxOutlets: number;
  status: 'Aktif' | 'Nonaktif';
  features: string[];
}

export interface TenantSubscriberRecord {
  id: string;
  tenantId: string;
  tenantName: string;
  packageName: string;
  billingCycle: 'Bulanan' | 'Tahunan';
  amountLabel: string;
  status: 'Lunas' | 'Trial' | 'Jatuh Tempo';
  nextBillingDate: string;
}

export interface IntegrationRegistryItem {
  id: string;
  name: string;
  description: string;
  category: 'ERP' | 'Payment' | 'Logistics' | 'Email' | 'Google' | 'External API';
  status: 'Aktif' | 'Nonaktif';
  latencyLabel: string;
  pluginShortcut?: 'workspace' | 'maps' | 'ai' | 'telegram';
}

export interface WebhookEndpointItem {
  id: string;
  url: string;
  events: string[];
  status: 'Aktif' | 'Nonaktif';
  lastDelivery: string;
  successRate: string;
}

export interface PlatformApiKeyItem {
  id: string;
  label: string;
  prefix: string;
  scope: string;
  rateLimit: string;
  status: 'Aktif' | 'Dicabut';
}

export interface AiProviderItem {
  id: string;
  name: string;
  subtitle: string;
  status: 'Aktif' | 'Nonaktif';
  latencyMs: number;
  modelsCount: number;
}

export interface AiModelItem {
  id: string;
  code: string;
  purpose: string;
  providerName: string;
  modality: 'Text / Reasoning' | 'Vision / OCR' | 'Embeddings' | 'Speech';
  costPer1MTokens: string;
  status: 'Aktif' | 'Standby';
}

export interface AiRoutingRule {
  id: string;
  taskCategory: string;
  primaryModel: string;
  fallbackModel: string;
  maxLatencyMs: number;
  monthlyBudgetLimitRp: string;
}

export interface AiAgentItem {
  id: string;
  name: string;
  roleDescription: string;
  autonomyLevel: 'L0' | 'L1' | 'L2' | 'L3';
  status: 'Aktif' | 'Draft' | 'Nonaktif';
  assignedSkill: string;
}

export interface AiSkillToolItem {
  id: string;
  toolName: string;
  version: string;
  sideEffectClass: 'Read-Only' | 'Draft-Mutation' | 'Approval-Required';
  timeoutMs: number;
  idempotent: boolean;
}

export interface TelegramBotItem {
  id: string;
  tenantId: string;
  companyName: string;
  botHandle: string;
  status: 'Aktif' | 'Nonaktif';
  linkedUsers: number;
  dailyMessages: number;
  quietHours: string;
}

export interface SecurityEventItem {
  id: string;
  title: string;
  tenantId: string;
  severity: 'Kritis' | 'Tinggi' | 'Menengah';
  sourceIp: string;
  timestamp: string;
  detail: string;
  status: 'Terdeteksi' | 'Diinvestigasi' | 'Selesai';
}

export interface AuditLogItem {
  id: string;
  action: string;
  actorLabel: string;
  timestamp: string;
  kind: 'info' | 'warning' | 'success';
  module: string;
  correlationId: string;
  payloadSummary: string;
}

export interface ContentTemplateGovernanceItem {
  id: string;
  name: string;
  category: string;
  aspectRatio: '9:16 Reels' | '16:9 Landscape' | '1:1 Feed';
  status: 'Aktif' | 'Review' | 'Nonaktif';
  maxDurationSec: number;
  complianceCheckRequired: boolean;
}

export interface OperationalRunbookItem {
  id: string;
  title: string;
  ownerTeam: string;
  severityScope: 'P0 Kritis' | 'P1 Tinggi' | 'Rutin';
  lastExecuted: string;
  stepsSummary: string;
}

export interface BackupRecoveryPoint {
  id: string;
  targetName: string;
  schedule: string;
  lastSnapshot: string;
  sizeLabel: string;
  status: 'Terverifikasi' | 'Proses';
}

export const SUPER_ADMIN_PROFILE = {
  name: 'Budi Santoso',
  title: 'Platform Super Admin',
  email: 'budi@salesx-ai.com',
  phone: '+62 811-9000-8812',
  mfaMethod: 'Authenticator TOTP + OTP',
};

export const TENANT_GROWTH_TREND = [
  { month: 'Jan', tenants: 12 },
  { month: 'Feb', tenants: 18 },
  { month: 'Mar', tenants: 22 },
  { month: 'Apr', tenants: 27 },
  { month: 'Mei', tenants: 33 },
  { month: 'Jun', tenants: 39 },
];

export const AI_TOKEN_USAGE_TREND = [
  { month: 'Jan', tokensJt: 5.2, costJt: 52.4 },
  { month: 'Feb', tokensJt: 6.4, costJt: 64.1 },
  { month: 'Mar', tokensJt: 7.9, costJt: 78.8 },
  { month: 'Apr', tokensJt: 9.4, costJt: 95.0 },
  { month: 'Mei', tokensJt: 10.8, costJt: 109.2 },
  { month: 'Jun', tokensJt: 12.48, costJt: 126.5 },
];

export const INITIAL_PLATFORM_TENANTS: PlatformTenant[] = [
  {
    id: 'TEN-0001',
    name: 'PT Maju Distribusi',
    plan: 'Enterprise',
    status: 'Aktif',
    usersCount: 1480,
    monthlyOrders: 28450,
    monthlyGmvM: 6.25,
    domain: 'majudistribusi.salesx-ai.com',
    picName: 'Andi Pratama',
    picEmail: 'andi@majudistribusi.co.id',
    city: 'Bogor, Jawa Barat',
    lat: -6.597147,
    lng: 106.806039,
    renewalDate: '01 Jul 2025',
  },
  {
    id: 'TEN-0002',
    name: 'PT Sinar Produk Utama',
    plan: 'Enterprise',
    status: 'Aktif',
    usersCount: 1120,
    monthlyOrders: 21340,
    monthlyGmvM: 3.84,
    domain: 'sinarproduk.salesx-ai.com',
    picName: 'Hendra Wijaya',
    picEmail: 'hendra@sinarproduk.co.id',
    city: 'Jakarta Selatan',
    lat: -6.261493,
    lng: 106.8106,
    renewalDate: '12 Jul 2025',
  },
  {
    id: 'TEN-0003',
    name: 'PT Sentosa Niaga',
    plan: 'Pro',
    status: 'Aktif',
    usersCount: 890,
    monthlyOrders: 19220,
    monthlyGmvM: 4.92,
    domain: 'sentosaniaga.salesx-ai.com',
    picName: 'Rina Amelia',
    picEmail: 'rina@sentosaniaga.co.id',
    city: 'Semarang, Jawa Tengah',
    lat: -6.966667,
    lng: 110.416664,
    renewalDate: '18 Jul 2025',
  },
  {
    id: 'TEN-0004',
    name: 'PT Karya Retail',
    plan: 'Trial',
    status: 'Trial',
    usersCount: 410,
    monthlyOrders: 12180,
    monthlyGmvM: 4.18,
    domain: 'karyaretail.salesx-ai.com',
    picName: 'Dedi Kurniawan',
    picEmail: 'dedi@karyaretail.id',
    city: 'Surabaya, Jawa Timur',
    lat: -7.257472,
    lng: 112.752088,
    renewalDate: '30 Jun 2025',
  },
  {
    id: 'TEN-0005',
    name: 'PT Mitra Sejahtera FMCG',
    plan: 'Pro',
    status: 'Aktif',
    usersCount: 640,
    monthlyOrders: 10940,
    monthlyGmvM: 3.12,
    domain: 'mitrasejahtera.salesx-ai.com',
    picName: 'Siti Rahma',
    picEmail: 'siti@mitrasejahtera.id',
    city: 'Bandung, Jawa Barat',
    lat: -6.917464,
    lng: 107.619123,
    renewalDate: '05 Agu 2025',
  },
  {
    id: 'TEN-0006',
    name: 'CV Bumi Nusantara',
    plan: 'Basic',
    status: 'Nonaktif',
    usersCount: 85,
    monthlyOrders: 1120,
    monthlyGmvM: 0.42,
    domain: 'buminusantara.salesx-ai.com',
    picName: 'Fajar Hidayat',
    picEmail: 'fajar@buminusantara.id',
    city: 'Depok, Jawa Barat',
    lat: -6.402484,
    lng: 106.794243,
    renewalDate: '10 Jun 2025',
  },
];

export const PLATFORM_TENANT_OUTLETS: Outlet[] = INITIAL_PLATFORM_TENANTS.map((t, i) => ({
  id: t.id,
  name: `${t.name} (${t.id})`,
  city: t.city,
  address: `Hub Tenant ${t.domain}`,
  distanceKm: 2 + i * 4,
  isPriority: t.plan === 'Enterprise',
  visitToday: t.status === 'Aktif',
  status: t.status === 'Nonaktif' ? 'Nonaktif' : 'Aktif',
  category: `Paket ${t.plan}`,
  picName: t.picName,
  phone: '+62 812-3456-7890',
  email: t.picEmail,
  lat: t.lat,
  lng: t.lng,
  lastOrderTotal: Math.round(t.monthlyGmvM * 1_000_000_000),
  lastVisitDate: t.renewalDate,
}));

export const INITIAL_ORG_NODES: OrganizationNode[] = [
  {
    id: 'org-1',
    tenantId: 'TEN-0001',
    name: 'Kantor Pusat (Head Office)',
    nodeType: 'Head Office',
    city: 'Kota Bogor',
    managerName: 'Andi Pratama',
    usersCount: 420,
    status: 'Aktif',
  },
  {
    id: 'org-2',
    tenantId: 'TEN-0001',
    name: 'Cabang Bogor',
    nodeType: 'Cabang',
    city: 'Bogor Selatan',
    managerName: 'Budi Santoso',
    usersCount: 310,
    status: 'Aktif',
  },
  {
    id: 'org-3',
    tenantId: 'TEN-0001',
    name: 'Cabang Depok',
    nodeType: 'Cabang',
    city: 'Margonda, Depok',
    managerName: 'Rina Amelia',
    usersCount: 245,
    status: 'Aktif',
  },
  {
    id: 'org-4',
    tenantId: 'TEN-0001',
    name: 'Cabang Tangerang',
    nodeType: 'Cabang',
    city: 'BSD City, Tangerang',
    managerName: 'Siti Rahma',
    usersCount: 265,
    status: 'Aktif',
  },
  {
    id: 'org-5',
    tenantId: 'TEN-0001',
    name: 'Cabang Bekasi',
    nodeType: 'Cabang',
    city: 'Bekasi Barat',
    managerName: 'Fajar Hidayat',
    usersCount: 240,
    status: 'Aktif',
  },
  {
    id: 'org-6',
    tenantId: 'TEN-0002',
    name: 'Kantor Pusat Principal',
    nodeType: 'Head Office',
    city: 'Jakarta Selatan',
    managerName: 'Hendra Wijaya',
    usersCount: 680,
    status: 'Aktif',
  },
  {
    id: 'org-7',
    tenantId: 'TEN-0002',
    name: 'Gudang Regional Jawa Barat',
    nodeType: 'Gudang Regional',
    city: 'Cikarang, Bekasi',
    managerName: 'Wahyu Saputra',
    usersCount: 440,
    status: 'Aktif',
  },
  {
    id: 'org-8',
    tenantId: 'TEN-0003',
    name: 'Kantor Pusat Semarang',
    nodeType: 'Head Office',
    city: 'Semarang Tengah',
    managerName: 'Rina Amelia',
    usersCount: 540,
    status: 'Aktif',
  },
];

export const INITIAL_MASTER_DATA: MasterDataCategory[] = [
  {
    id: 'md-company',
    title: 'Data Perusahaan',
    subtitle: 'Entitas legal, NPWP, & alamat korporat tenant',
    recordsCount: 128,
    updatedLabel: 'Diperbarui hari ini',
    items: [
      { id: 'c1', code: 'CMP-001', name: 'PT Maju Distribusi', detail: 'NPWP 01.234.567.8-404 · Bogor', status: 'Aktif' },
      { id: 'c2', code: 'CMP-002', name: 'PT Sinar Produk Utama', detail: 'NPWP 02.456.789.1-012 · Jakarta', status: 'Aktif' },
      { id: 'c3', code: 'CMP-003', name: 'PT Sentosa Niaga', detail: 'NPWP 03.778.221.0-501 · Semarang', status: 'Aktif' },
    ],
  },
  {
    id: 'md-category',
    title: 'Kategori Bisnis',
    subtitle: 'Klasifikasi Distributor, Principal, Retail & Modern Trade',
    recordsCount: 14,
    updatedLabel: '3 hari lalu',
    items: [
      { id: 'k1', code: 'BIZ-DIST', name: 'Distributor Regional FMCG', detail: 'Skema gudang multi-cabang', status: 'Aktif' },
      { id: 'k2', code: 'BIZ-PRIN', name: 'Principal / Pemilik Merek', detail: 'Katalog master & RRP nasional', status: 'Aktif' },
      { id: 'k3', code: 'BIZ-GT', name: 'General Trade Outlet', detail: 'Toko kelontong & grosir mandiri', status: 'Aktif' },
    ],
  },
  {
    id: 'md-industry',
    title: 'Bidang / Industri',
    subtitle: 'Sektor FMCG, F&B, Kesehatan, Kosmetik, & Rumah Tangga',
    recordsCount: 18,
    updatedLabel: '1 minggu lalu',
    items: [
      { id: 'i1', code: 'IND-FMCG', name: 'Makanan & Minuman Kemasan', detail: 'High turnover SKU', status: 'Aktif' },
      { id: 'i2', code: 'IND-PC', name: 'Perawatan Pribadi & Rumah', detail: 'Sabun, sampo, detergen', status: 'Aktif' },
    ],
  },
  {
    id: 'md-product',
    title: 'Produk & Kategori',
    subtitle: 'Standar kategori SKU, barcode EAN-13, & HS code',
    recordsCount: 2460,
    updatedLabel: 'Hari ini',
    items: [
      { id: 'p1', code: 'CAT-MNM', name: 'Minuman Energi & Isotonik', detail: '842 SKU terdaftar', status: 'Aktif' },
      { id: 'p2', code: 'CAT-MKN', name: 'Biskuit & Snack Kemasan', detail: '1.120 SKU terdaftar', status: 'Aktif' },
      { id: 'p3', code: 'CAT-PRW', name: 'Perawatan Tubuh & Sabun', detail: '498 SKU terdaftar', status: 'Aktif' },
    ],
  },
  {
    id: 'md-territory',
    title: 'Wilayah & Teritori',
    subtitle: 'Provinsi, Kota/Kabupaten, Kecamatan, & Zona Geofence',
    recordsCount: 514,
    updatedLabel: '2 hari lalu',
    items: [
      { id: 'w1', code: 'TER-JABO', name: 'Jabodetabek & Bogor Raya', detail: '42 zona sales aktif', status: 'Aktif' },
      { id: 'w2', code: 'TER-JATENG', name: 'Jawa Tengah & DIY', detail: '28 zona distributor', status: 'Aktif' },
    ],
  },
  {
    id: 'md-outlet',
    title: 'Outlet / Pelanggan',
    subtitle: 'Klasifikasi tier Prioritas, Reguler, & Kredit Limit',
    recordsCount: 18420,
    updatedLabel: 'Real-time sync',
    items: [
      { id: 'o1', code: 'OUT-TIER-A', name: 'Outlet Prioritas (TOP 30 Hari)', detail: 'Limit kredit Rp 50 jt', status: 'Aktif' },
      { id: 'o2', code: 'OUT-TIER-B', name: 'Outlet Reguler (COD / TOP 14)', detail: 'Limit kredit Rp 15 jt', status: 'Aktif' },
    ],
  },
  {
    id: 'md-uom',
    title: 'Satuan & Atribut',
    subtitle: 'Dus/Karton, Pcs, Box, Lusin, & Konversi Unit',
    recordsCount: 32,
    updatedLabel: '2 minggu lalu',
    items: [
      { id: 'u1', code: 'UOM-DUS', name: 'Dus (24 pcs)', detail: 'Satuan standar B2B grosir', status: 'Aktif' },
      { id: 'u2', code: 'UOM-PCS', name: 'Pcs (Satuan Ecer)', detail: 'Unit terkecil kasir/outlet', status: 'Aktif' },
    ],
  },
  {
    id: 'md-sysref',
    title: 'Referensi Sistem',
    subtitle: 'Zona waktu Asia/Jakarta, Mata uang IDR, & Retensi Audit',
    recordsCount: 24,
    updatedLabel: 'Stabil',
    items: [
      { id: 's1', code: 'SYS-TZ', name: 'Asia/Jakarta (WIB, UTC+7)', detail: 'Timezone default seluruh report', status: 'Aktif' },
      { id: 's2', code: 'SYS-CUR', name: 'IDR (Rupiah Indonesia)', detail: 'Format tabular-nums deterministik', status: 'Aktif' },
    ],
  },
];

export const INITIAL_SERVICES_REGISTRY: ServiceRegistryItem[] = [
  {
    id: 'svc-1',
    name: 'API Gateway',
    version: 'v1.0.0',
    runtime: 'FastAPI · Cloud Run',
    status: 'Aktif',
    uptimePct: '99,98%',
    latencyMs: 38,
    endpoint: 'api.salesx-ai.com/api/v1',
  },
  {
    id: 'svc-2',
    name: 'Location Worker',
    version: 'v1.0.0',
    runtime: 'Python · PostGIS Queue',
    status: 'Aktif',
    uptimePct: '99,96%',
    latencyMs: 44,
    endpoint: 'services/location-worker',
  },
  {
    id: 'svc-3',
    name: 'Notification Worker',
    version: 'v1.0.0',
    runtime: 'Python · Push & Email',
    status: 'Aktif',
    uptimePct: '99,95%',
    latencyMs: 52,
    endpoint: 'services/notification-worker',
  },
  {
    id: 'svc-4',
    name: 'Analytics Worker',
    version: 'v1.0.0',
    runtime: 'Python · Rollup Jobs',
    status: 'Aktif',
    uptimePct: '99,94%',
    latencyMs: 112,
    endpoint: 'services/analytics-worker',
  },
  {
    id: 'svc-5',
    name: 'AI Worker',
    version: 'v1.0.0',
    runtime: 'Python · Gemini Orchestrator',
    status: 'Aktif',
    uptimePct: '99,92%',
    latencyMs: 280,
    endpoint: 'services/ai-worker',
  },
  {
    id: 'svc-6',
    name: 'Telegram Service',
    version: 'v1.0.0',
    runtime: 'Python · Webhook Bot',
    status: 'Aktif',
    uptimePct: '99,97%',
    latencyMs: 65,
    endpoint: 'services/telegram-service',
  },
  {
    id: 'svc-7',
    name: 'Remotion Renderer',
    version: 'v1.0.0',
    runtime: 'Node.js · FFmpeg Worker',
    status: 'Aktif',
    uptimePct: '99,91%',
    latencyMs: 410,
    endpoint: 'services/remotion-renderer',
  },
];

export const INITIAL_DOMAINS: DomainRegistryItem[] = [
  {
    id: 'dom-1',
    domain: 'salesx-ai.com',
    portalName: 'Website Utama',
    internalRoute: '/',
    sslStatus: 'Valid · TLS 1.3',
    status: 'Aktif',
    targetApp: 'apps/website',
  },
  {
    id: 'dom-2',
    domain: 'customer.salesx-ai.com',
    portalName: 'Customer Portal',
    internalRoute: '/customer',
    sslStatus: 'Valid · TLS 1.3',
    status: 'Aktif',
    targetApp: 'apps/customer-portal',
  },
  {
    id: 'dom-3',
    domain: 'company.salesx-ai.com',
    portalName: 'Company Portal',
    internalRoute: '/company',
    sslStatus: 'Valid · TLS 1.3',
    status: 'Aktif',
    targetApp: 'apps/company-portal',
  },
  {
    id: 'dom-4',
    domain: 'sales.salesx-ai.com',
    portalName: 'Sales Portal',
    internalRoute: '/portal',
    sslStatus: 'Valid · TLS 1.3',
    status: 'Aktif',
    targetApp: 'apps/sales-portal',
  },
  {
    id: 'dom-5',
    domain: 'distributor.salesx-ai.com',
    portalName: 'Distributor Portal',
    internalRoute: '/distributor',
    sslStatus: 'Valid · TLS 1.3',
    status: 'Aktif',
    targetApp: 'apps/distributor-portal',
  },
  {
    id: 'dom-6',
    domain: 'principal.salesx-ai.com',
    portalName: 'Principal Portal',
    internalRoute: '/principal',
    sslStatus: 'Valid · TLS 1.3',
    status: 'Aktif',
    targetApp: 'apps/principal-portal',
  },
  {
    id: 'dom-7',
    domain: 'supervisor.salesx-ai.com',
    portalName: 'Supervisor Portal',
    internalRoute: '/supervisor',
    sslStatus: 'Valid · TLS 1.3',
    status: 'Aktif',
    targetApp: 'apps/supervisor-portal',
  },
  {
    id: 'dom-8',
    domain: 'admin.salesx-ai.com',
    portalName: 'Super Admin Portal',
    internalRoute: '/super-admin',
    sslStatus: 'Valid · TLS 1.3',
    status: 'Aktif',
    targetApp: 'apps/super-admin',
  },
  {
    id: 'dom-9',
    domain: 'api.salesx-ai.com',
    portalName: 'Backend API',
    internalRoute: '/api/gemini/chat',
    sslStatus: 'Valid · TLS 1.3',
    status: 'Aktif',
    targetApp: 'services/api',
  },
];

export const INITIAL_FEATURE_FLAGS: FeatureFlagItem[] = [
  {
    id: 'ff-1',
    key: 'ai_sales_assistant',
    label: 'ai_sales_assistant',
    description: 'Fitur AI Sales Assistant',
    enabled: true,
    rolloutScope: 'Semua Tenant',
  },
  {
    id: 'ff-2',
    key: 'content_studio',
    label: 'content_studio',
    description: 'AI Content Studio',
    enabled: false,
    rolloutScope: 'Enterprise & Pro',
  },
  {
    id: 'ff-3',
    key: 'telegram_integration',
    label: 'telegram_integration',
    description: 'Integrasi Telegram',
    enabled: true,
    rolloutScope: 'Semua Tenant',
  },
  {
    id: 'ff-4',
    key: 'remotion_renderer',
    label: 'remotion_renderer',
    description: 'Render Video',
    enabled: false,
    rolloutScope: 'Enterprise & Pro',
  },
  {
    id: 'ff-5',
    key: 'advanced_analytics',
    label: 'advanced_analytics',
    description: 'Analitik Lanjutan',
    enabled: true,
    rolloutScope: 'Semua Tenant',
  },
];

export const INITIAL_SUBSCRIPTION_PACKAGES: SubscriptionPackageItem[] = [
  {
    id: 'pkg-basic',
    name: 'Basic',
    tagline: 'Untuk bisnis kecil',
    priceLabel: 'Rp 299.000 / bulan',
    priceNumeric: 299000,
    maxUsers: 15,
    maxOutlets: 250,
    status: 'Aktif',
    features: ['SmartTeam absensi & kunjungan', 'SmartOrder katalog dasar', 'Laporan harian'],
  },
  {
    id: 'pkg-pro',
    name: 'Pro',
    tagline: 'Untuk tim berkembang',
    priceLabel: 'Rp 699.000 / bulan',
    priceNumeric: 699000,
    maxUsers: 75,
    maxOutlets: 1500,
    status: 'Aktif',
    features: ['Multi-cabang & teritori', 'Live GPS & Telegram Bot', 'AI Sales Assistant'],
  },
  {
    id: 'pkg-ent',
    name: 'Enterprise',
    tagline: 'Untuk skala besar',
    priceLabel: 'Hubungi Sales',
    priceNumeric: 18000000,
    maxUsers: 5000,
    maxOutlets: 50000,
    status: 'Aktif',
    features: ['8 Portal Ekosistem penuh', 'Dedicated AI Orchestrator & Remotion', 'Audit Trail & SLA 99,9%'],
  },
];

export const INITIAL_SUBSCRIBERS: TenantSubscriberRecord[] = [
  {
    id: 'sub-1',
    tenantId: 'TEN-0001',
    tenantName: 'PT Maju Distribusi',
    packageName: 'Enterprise',
    billingCycle: 'Tahunan',
    amountLabel: 'Rp 18.000.000/bln',
    status: 'Lunas',
    nextBillingDate: '01 Jul 2025',
  },
  {
    id: 'sub-2',
    tenantId: 'TEN-0002',
    tenantName: 'PT Sinar Produk Utama',
    packageName: 'Enterprise',
    billingCycle: 'Tahunan',
    amountLabel: 'Rp 18.000.000/bln',
    status: 'Lunas',
    nextBillingDate: '12 Jul 2025',
  },
  {
    id: 'sub-3',
    tenantId: 'TEN-0003',
    tenantName: 'PT Sentosa Niaga',
    packageName: 'Pro',
    billingCycle: 'Bulanan',
    amountLabel: 'Rp 699.000/bln',
    status: 'Lunas',
    nextBillingDate: '18 Jul 2025',
  },
  {
    id: 'sub-4',
    tenantId: 'TEN-0004',
    tenantName: 'PT Karya Retail',
    packageName: 'Trial',
    billingCycle: 'Bulanan',
    amountLabel: 'Gratis 14 Hari',
    status: 'Trial',
    nextBillingDate: '30 Jun 2025',
  },
];

export const INITIAL_INTEGRATIONS: IntegrationRegistryItem[] = [
  {
    id: 'int-1',
    name: 'ERP / Sistem Internal',
    description: 'Integrasi data order & stok',
    category: 'ERP',
    status: 'Aktif',
    latencyLabel: '42 ms',
  },
  {
    id: 'int-2',
    name: 'Payment Gateway',
    description: 'Pembayaran online',
    category: 'Payment',
    status: 'Aktif',
    latencyLabel: '68 ms',
  },
  {
    id: 'int-3',
    name: 'Shipping / Logistik',
    description: 'Ongkir & tracking',
    category: 'Logistics',
    status: 'Aktif',
    latencyLabel: '85 ms',
  },
  {
    id: 'int-4',
    name: 'Email Service',
    description: 'Notifikasi email',
    category: 'Email',
    status: 'Aktif',
    latencyLabel: '54 ms',
  },
  {
    id: 'int-5',
    name: 'Google Workspace (OAuth)',
    description: 'Sinkronisasi Gmail, Calendar & Meet',
    category: 'Google',
    status: 'Aktif',
    latencyLabel: '39 ms',
    pluginShortcut: 'workspace',
  },
  {
    id: 'int-6',
    name: 'Google Maps Platform',
    description: 'Maps JS, Routes & Places API',
    category: 'Google',
    status: 'Aktif',
    latencyLabel: '46 ms',
    pluginShortcut: 'maps',
  },
  {
    id: 'int-7',
    name: 'Other API',
    description: 'Integrasi pihak ketiga',
    category: 'External API',
    status: 'Nonaktif',
    latencyLabel: '—',
  },
];

export const INITIAL_WEBHOOKS: WebhookEndpointItem[] = [
  {
    id: 'wh-1',
    url: 'https://erp.majudistribusi.co.id/webhooks/salesx',
    events: ['order.created', 'order.approved', 'inventory.updated'],
    status: 'Aktif',
    lastDelivery: '24 Jun 2025, 10:15 WIB',
    successRate: '99,9%',
  },
  {
    id: 'wh-2',
    url: 'https://hooks.sinarproduk.co.id/v1/sales-events',
    events: ['promotion.activated', 'visit.checked_in'],
    status: 'Aktif',
    lastDelivery: '24 Jun 2025, 09:50 WIB',
    successRate: '99,4%',
  },
];

export const INITIAL_API_KEYS: PlatformApiKeyItem[] = [
  {
    id: 'key-1',
    label: 'Gateway Sync Production (TEN-0001)',
    prefix: 'sx_live_98a2••••••••41f0',
    scope: 'orders:read orders:write inventory:sync',
    rateLimit: '1.200 req/menit',
    status: 'Aktif',
  },
  {
    id: 'key-2',
    label: 'Analytics BI Connector',
    prefix: 'sx_live_34c1••••••••90b2',
    scope: 'analytics:read reports:export',
    rateLimit: '300 req/menit',
    status: 'Aktif',
  },
];

export const INITIAL_AI_PROVIDERS: AiProviderItem[] = [
  {
    id: 'prov-1',
    name: 'SalesX-Ai LLM (SA-AI)',
    subtitle: 'Orchestrator Utama Platform',
    status: 'Aktif',
    latencyMs: 240,
    modelsCount: 4,
  },
  {
    id: 'prov-2',
    name: 'Provider A (via API)',
    subtitle: 'Google Gemini · Server-side Proxy',
    status: 'Aktif',
    latencyMs: 215,
    modelsCount: 3,
  },
  {
    id: 'prov-3',
    name: 'Provider B (via API)',
    subtitle: 'Fallback & Embedding Cluster',
    status: 'Aktif',
    latencyMs: 310,
    modelsCount: 2,
  },
];

export const INITIAL_AI_MODELS: AiModelItem[] = [
  {
    id: 'mod-1',
    code: 'sxai-chat',
    purpose: 'Untuk chat & asisten',
    providerName: 'SalesX-Ai LLM (SA-AI)',
    modality: 'Text / Reasoning',
    costPer1MTokens: 'Rp 9.500',
    status: 'Aktif',
  },
  {
    id: 'mod-2',
    code: 'sxai-vision',
    purpose: 'Untuk analisis gambar',
    providerName: 'Provider A (via API)',
    modality: 'Vision / OCR',
    costPer1MTokens: 'Rp 14.200',
    status: 'Aktif',
  },
  {
    id: 'mod-3',
    code: 'sxai-embed-v1',
    purpose: 'RAG produk & dokumen',
    providerName: 'Provider B (via API)',
    modality: 'Embeddings',
    costPer1MTokens: 'Rp 1.800',
    status: 'Standby',
  },
];

export const INITIAL_AI_ROUTING: AiRoutingRule[] = [
  {
    id: 'rt-1',
    taskCategory: 'Reasoning & Sales Chat',
    primaryModel: 'sxai-chat',
    fallbackModel: 'gemini-3-flash',
    maxLatencyMs: 1200,
    monthlyBudgetLimitRp: 'Rp 65.000.000',
  },
  {
    id: 'rt-2',
    taskCategory: 'Bukti Kunjungan & Rak OCR',
    primaryModel: 'sxai-vision',
    fallbackModel: 'sxai-chat',
    maxLatencyMs: 2200,
    monthlyBudgetLimitRp: 'Rp 40.000.000',
  },
  {
    id: 'rt-3',
    taskCategory: 'Ringkasan Suara & Briefing',
    primaryModel: 'sxai-chat',
    fallbackModel: 'sxai-embed-v1',
    maxLatencyMs: 1800,
    monthlyBudgetLimitRp: 'Rp 25.000.000',
  },
];

export const INITIAL_AI_AGENTS: AiAgentItem[] = [
  {
    id: 'ag-1',
    name: 'Sales Assistant',
    roleDescription: 'Agen penjualan',
    autonomyLevel: 'L1',
    status: 'Aktif',
    assignedSkill: 'order_draft_tool',
  },
  {
    id: 'ag-2',
    name: 'Visit Planner',
    roleDescription: 'Rencana kunjungan',
    autonomyLevel: 'L2',
    status: 'Aktif',
    assignedSkill: 'outlet_priority_tool',
  },
  {
    id: 'ag-3',
    name: 'Insight Analyst',
    roleDescription: 'Analisis penjualan',
    autonomyLevel: 'L1',
    status: 'Aktif',
    assignedSkill: 'sales_gap_analyzer',
  },
  {
    id: 'ag-4',
    name: 'Content Creator',
    roleDescription: 'Buat konten promosi',
    autonomyLevel: 'L2',
    status: 'Draft',
    assignedSkill: 'remotion_brief_tool',
  },
];

export const INITIAL_AI_SKILLS: AiSkillToolItem[] = [
  {
    id: 'sk-1',
    toolName: 'order_draft_tool',
    version: 'v1.2.0',
    sideEffectClass: 'Draft-Mutation',
    timeoutMs: 3000,
    idempotent: true,
  },
  {
    id: 'sk-2',
    toolName: 'outlet_priority_tool',
    version: 'v1.0.4',
    sideEffectClass: 'Read-Only',
    timeoutMs: 2000,
    idempotent: true,
  },
  {
    id: 'sk-3',
    toolName: 'remotion_brief_tool',
    version: 'v0.9.2',
    sideEffectClass: 'Approval-Required',
    timeoutMs: 4500,
    idempotent: true,
  },
];

export const INITIAL_TELEGRAM_BOTS: TelegramBotItem[] = [
  {
    id: 'bot-1',
    tenantId: 'TEN-0001',
    companyName: 'PT Maju Distribusi',
    botHandle: '@sxai_maju_bot',
    status: 'Aktif',
    linkedUsers: 184,
    dailyMessages: 1420,
    quietHours: '21:00 – 06:00 WIB',
  },
  {
    id: 'bot-2',
    tenantId: 'TEN-0003',
    companyName: 'PT Sentosa Niaga',
    botHandle: '@sxai_sentosa_bot',
    status: 'Aktif',
    linkedUsers: 96,
    dailyMessages: 685,
    quietHours: '21:00 – 06:00 WIB',
  },
  {
    id: 'bot-3',
    tenantId: 'TEN-0004',
    companyName: 'PT Karya Retail',
    botHandle: '@sxai_karya_bot',
    status: 'Aktif',
    linkedUsers: 42,
    dailyMessages: 290,
    quietHours: '22:00 – 06:00 WIB',
  },
];

export const INITIAL_SECURITY_EVENTS: SecurityEventItem[] = [
  {
    id: 'sec-1',
    title: 'Lonjakan Permintaan API / Rate-Limit Alert',
    tenantId: 'TEN-0003',
    severity: 'Tinggi',
    sourceIp: '103.144.82.19',
    timestamp: '24 Jun 2025, 09:40 WIB',
    detail: 'Terdeteksi 420 percobaan endpoint /api/v1/orders dalam 60 detik dari IP eksternal.',
    status: 'Terdeteksi',
  },
  {
    id: 'sec-2',
    title: 'Login Admin Dari Perangkat Baru Tanpa TOTP Awal',
    tenantId: 'TEN-0004',
    severity: 'Kritis',
    sourceIp: '182.253.112.44',
    timestamp: '23 Jun 2025, 22:18 WIB',
    detail: 'Akun dedi@karyaretail.id ditolak oleh policy MFA sebelum verifikasi OTP selesai.',
    status: 'Diinvestigasi',
  },
  {
    id: 'sec-3',
    title: 'Permintaan Ekspor Direktori Outlet Massal',
    tenantId: 'TEN-0001',
    severity: 'Menengah',
    sourceIp: '36.72.14.88',
    timestamp: '23 Jun 2025, 14:10 WIB',
    detail: 'Ekspor CSV 1.045 outlet telah diverifikasi melalui sesi Company Admin resmi.',
    status: 'Selesai',
  },
];

export const INITIAL_AUDIT_LOGS: AuditLogItem[] = [
  {
    id: 'aud-1',
    action: 'Ubah Paket Subscription',
    actorLabel: 'Oleh: Budi Santoso',
    timestamp: '24 Jun 2025, 10:24',
    kind: 'info',
    module: 'Subscription & Package',
    correlationId: 'corr-9821-sub',
    payloadSummary: 'Upgrade paket TEN-0003 dari Basic menjadi Pro (Rp 699.000/bln).',
  },
  {
    id: 'aud-2',
    action: 'Aktivitas Tidak Wajar',
    actorLabel: 'Tenant: TEN-0003',
    timestamp: '24 Jun 2025, 09:40',
    kind: 'warning',
    module: 'Security Events',
    correlationId: 'corr-9814-sec',
    payloadSummary: 'Rate limit threshold terlampaui sementara; trafik IP otomatis dibatasi.',
  },
  {
    id: 'aud-3',
    action: 'Ubah Role & Permission',
    actorLabel: 'User: Andi Pratama',
    timestamp: '23 Jun 2025, 16:12',
    kind: 'info',
    module: 'Role & Permission',
    correlationId: 'corr-9799-rbac',
    payloadSummary: 'Menambahkan izin approval order regional pada role distributor_admin.',
  },
  {
    id: 'aud-4',
    action: 'Aktifkan Feature Flag',
    actorLabel: 'Oleh: budi@salesx-ai.com',
    timestamp: '23 Jun 2025, 14:05',
    kind: 'success',
    module: 'Feature Flags',
    correlationId: 'corr-9782-flag',
    payloadSummary: 'Flag advanced_analytics diaktifkan secara global untuk tenant aktif.',
  },
];

export const INITIAL_SYSTEM_HEALTH_ITEMS = [
  { id: 'sh-1', name: 'API Gateway', status: 'Online · 99,98%', ok: true },
  { id: 'sh-2', name: 'Database', status: 'Online · 99,99%', ok: true },
  { id: 'sh-3', name: 'Workers', status: 'Online · 99,95%', ok: true },
  { id: 'sh-4', name: 'Realtime', status: 'Online · 99,97%', ok: true },
];

export const INITIAL_CONTENT_TEMPLATES: ContentTemplateGovernanceItem[] = [
  {
    id: 'tpl-1',
    name: 'Product Showcase',
    category: 'Katalog & SKU',
    aspectRatio: '9:16 Reels',
    status: 'Aktif',
    maxDurationSec: 30,
    complianceCheckRequired: true,
  },
  {
    id: 'tpl-2',
    name: 'Discount / Flash Sale',
    category: 'Promosi',
    aspectRatio: '9:16 Reels',
    status: 'Aktif',
    maxDurationSec: 15,
    complianceCheckRequired: true,
  },
  {
    id: 'tpl-3',
    name: 'Distributor Campaign',
    category: 'Kampanye B2B',
    aspectRatio: '16:9 Landscape',
    status: 'Aktif',
    maxDurationSec: 45,
    complianceCheckRequired: true,
  },
  {
    id: 'tpl-4',
    name: 'Store Visit Recap',
    category: 'Aktivitas Sales',
    aspectRatio: '1:1 Feed',
    status: 'Review',
    maxDurationSec: 20,
    complianceCheckRequired: true,
  },
];

export const INITIAL_RUNBOOKS: OperationalRunbookItem[] = [
  {
    id: 'rb-1',
    title: 'Failover AI Provider & Budget Circuit Breaker',
    ownerTeam: 'AI Platform Ops',
    severityScope: 'P0 Kritis',
    lastExecuted: '18 Jun 2025 (Simulasi)',
    stepsSummary:
      'Alihkan routing sxai-chat ke fallback model, batasi kuota tenant non-Enterprise, dan kirim alert Telegram ke SRE.',
  },
  {
    id: 'rb-2',
    title: 'Mitigasi Lonjakan Rate-Limit & Isolasi IP Mencurigakan',
    ownerTeam: 'Security Ops',
    severityScope: 'P1 Tinggi',
    lastExecuted: '24 Jun 2025',
    stepsSummary:
      'Cabut API key terdampak, aktifkan challenge MFA pada sesi aktif, dan blokir IP di API Gateway.',
  },
  {
    id: 'rb-3',
    title: 'Verifikasi Sinkronisasi PostGIS & Location Worker Queue',
    ownerTeam: 'Geo & Telemetry Ops',
    severityScope: 'Rutin',
    lastExecuted: '24 Jun 2025, 06:00 WIB',
    stepsSummary:
      'Periksa dead-letter queue lokasi, pastikan index GiST optimal, dan uji heartbeat GPS terbaru.',
  },
];

export const INITIAL_BACKUPS: BackupRecoveryPoint[] = [
  {
    id: 'bk-1',
    targetName: 'Database Utama PostgreSQL + PostGIS (PITR)',
    schedule: 'Harian 02:00 WIB + WAL Continuous',
    lastSnapshot: '24 Jun 2025, 02:04 WIB',
    sizeLabel: '48,6 GB',
    status: 'Terverifikasi',
  },
  {
    id: 'bk-2',
    targetName: 'Audit Trail & Security Events Archive',
    schedule: 'Setiap 6 Jam (Immutable Storage)',
    lastSnapshot: '24 Jun 2025, 06:01 WIB',
    sizeLabel: '14,2 GB',
    status: 'Terverifikasi',
  },
  {
    id: 'bk-3',
    targetName: 'Supabase Storage Media & Remotion Outputs',
    schedule: 'Harian 03:30 WIB',
    lastSnapshot: '24 Jun 2025, 03:38 WIB',
    sizeLabel: '112,4 GB',
    status: 'Terverifikasi',
  },
];

