import type { Outlet } from './salesx-data';

/* ============================================================================
 * 1. DISTRIBUTOR PORTAL DATA & TYPES (PT Maju Distribusi · DIST-0001)
 * ============================================================================ */

export interface DistributorInventoryItem {
  sku: string;
  name: string;
  category: 'Minuman' | 'Makanan' | 'Perawatan' | 'Lainnya';
  unit: string;
  stock: number;
  minStock: number;
  warehouse: string;
  price: number;
  tag: 'Best Seller' | 'Promo' | 'Baru';
  accentHex: string;
}

export interface StockMovementRecord {
  id: string;
  type: 'Stok Masuk' | 'Stok Keluar' | 'Penyesuaian Stok';
  sku: string;
  productName: string;
  qtyDelta: number;
  unit: string;
  dateLabel: string;
  status: 'Baru' | 'Diproses' | 'Selesai';
  warehouse: string;
  notes: string;
}

export interface DistributorOrderProcess {
  id: string;
  outletName: string;
  city: string;
  total: number;
  dateLabel: string;
  currentStep: 1 | 2 | 3 | 4; // 1=Picking, 2=Packing, 3=QC, 4=Siap Kirim
  progressPct: number;
  itemsSummary: string;
  warehouse: string;
  steps: Array<{
    step: number;
    label: string;
    detail: string;
    status: 'done' | 'active' | 'pending';
  }>;
}

export interface DistributorFulfillmentRecord {
  id: string;
  orderId: string;
  outletName: string;
  city: string;
  dateLabel: string;
  total: number;
  status: 'Siap Kirim' | 'Dikirim' | 'Dalam Pengiriman' | 'Selesai';
  driverName: string;
  vehiclePlate: string;
  etaLabel: string;
  timeline: Array<{
    title: string;
    timestamp: string;
    state: 'done' | 'active' | 'pending';
  }>;
}

export interface DistributorOutletRecord extends Outlet {
  tier: 'Prioritas' | 'Reguler';
  covered: boolean;
}

export interface DistributorSalesRep {
  id: string;
  name: string;
  area: string;
  status: 'Aktif' | 'Nonaktif';
  phone: string;
  outletsHandled: number;
  monthlyOrderTotal: number;
  visitsCompleted: number;
  targetVisits: number;
}

export interface DistributorPromoCampaign {
  id: string;
  title: string;
  period: string;
  kind: 'Program' | 'Campaign';
  status: 'Aktif' | 'Terjadwal' | 'Selesai';
  discountRule: string;
  targetSku: string;
  description: string;
}

export const DISTRIBUTOR_PROFILE = {
  id: 'DIST-0001',
  name: 'PT Maju Distribusi',
  area: 'Distributor Area Bogor',
  status: 'Aktif' as const,
  picName: 'Andi Pratama',
  email: 'andi@majudistribusi.co.id',
  phone: '0812-3456-7890',
  warehouseAddress: 'Jl. Raya Bogor Km. 38, Kab. Bogor, Jawa Barat',
  totalSkuSummary: 12_540,
  totalStockUnitsSummary: 85_320,
  lowStockSkuCount: 42,
  outOfStockSkuCount: 6,
  totalOutletsCount: 1045,
  coveredOutletsCount: 985,
  uncoveredOutletsCount: 60,
  totalSalesCount: 42,
  activeSalesCount: 40,
  inactiveSalesCount: 2,
};

export const DISTRIBUTOR_ORDER_TREND = [
  { month: 'Jan', orders: 14, valueJt: 410 },
  { month: 'Feb', orders: 18, valueJt: 465 },
  { month: 'Mar', orders: 21, valueJt: 510 },
  { month: 'Apr', orders: 24, valueJt: 545 },
  { month: 'Mei', orders: 31, valueJt: 588 },
  { month: 'Jun', orders: 38, valueJt: 625.8 },
];

export const INITIAL_DISTRIBUTOR_INVENTORY: DistributorInventoryItem[] = [
  {
    sku: 'SX-MNM-001',
    name: 'Minuman Energi 250 ml',
    category: 'Minuman',
    unit: 'dus',
    stock: 1240,
    minStock: 300,
    warehouse: 'Gudang Utama',
    price: 120_000,
    tag: 'Best Seller',
    accentHex: '#F97316',
  },
  {
    sku: 'SX-BSK-002',
    name: 'Biskuit Cokelat 100 g',
    category: 'Makanan',
    unit: 'dus',
    stock: 850,
    minStock: 250,
    warehouse: 'Gudang A',
    price: 204_000,
    tag: 'Promo',
    accentHex: '#B45309',
  },
  {
    sku: 'SX-PRW-003',
    name: 'Sabun Wangi 80 g',
    category: 'Perawatan',
    unit: 'pcs',
    stock: 2350,
    minStock: 600,
    warehouse: 'Gudang B',
    price: 4_000,
    tag: 'Best Seller',
    accentHex: '#10B981',
  },
  {
    sku: 'SX-MNM-004',
    name: 'Teh Hijau Botol 350 ml',
    category: 'Minuman',
    unit: 'dus',
    stock: 110,
    minStock: 180,
    warehouse: 'Gudang Utama',
    price: 108_000,
    tag: 'Baru',
    accentHex: '#047857',
  },
  {
    sku: 'SX-SMP-004',
    name: 'Sampo Herbal 180 ml',
    category: 'Perawatan',
    unit: 'pcs',
    stock: 0,
    minStock: 200,
    warehouse: 'Gudang B',
    price: 16_500,
    tag: 'Baru',
    accentHex: '#348CB2',
  },
  {
    sku: 'SX-LNY-007',
    name: 'Tisu Lipat 200 Lembar',
    category: 'Lainnya',
    unit: 'pack',
    stock: 95,
    minStock: 150,
    warehouse: 'Gudang A',
    price: 9_500,
    tag: 'Promo',
    accentHex: '#6366F1',
  },
];

export const INITIAL_STOCK_MOVEMENTS: StockMovementRecord[] = [
  {
    id: 'PO-20250724-001',
    type: 'Stok Masuk',
    sku: 'SX-MNM-001',
    productName: 'Minuman Energi 250 ml',
    qtyDelta: 500,
    unit: 'dus',
    dateLabel: '24 Jul 2025, 10:24',
    status: 'Baru',
    warehouse: 'Gudang Utama',
    notes: 'Penerimaan pengiriman Principal PT Sinar Produk Utama.',
  },
  {
    id: 'SO-20250723-004',
    type: 'Stok Keluar',
    sku: 'SX-BSK-002',
    productName: 'Biskuit Cokelat 100 g',
    qtyDelta: -120,
    unit: 'dus',
    dateLabel: '23 Jul 2025, 16:40',
    status: 'Baru',
    warehouse: 'Gudang A',
    notes: 'Alokasi order Toko Makmur Jaya & Toko Sentosa.',
  },
  {
    id: 'ADJ-20250722-001',
    type: 'Penyesuaian Stok',
    sku: 'SX-PRW-003',
    productName: 'Sabun Wangi 80 g',
    qtyDelta: -15,
    unit: 'pcs',
    dateLabel: '22 Jul 2025, 11:05',
    status: 'Diproses',
    warehouse: 'Gudang B',
    notes: 'Stock opname mingguan — kemasan rusak dalam palet 3.',
  },
  {
    id: 'PO-20250720-009',
    type: 'Stok Masuk',
    sku: 'SX-PRW-003',
    productName: 'Sabun Wangi 80 g',
    qtyDelta: 800,
    unit: 'pcs',
    dateLabel: '20 Jul 2025, 09:15',
    status: 'Selesai',
    warehouse: 'Gudang B',
    notes: 'Telah diverifikasi oleh Kepala Gudang.',
  },
];

export const INITIAL_DISTRIBUTOR_ORDERS: DistributorOrderProcess[] = [
  {
    id: 'ORD-20250724-001',
    outletName: 'Toko Makmur Jaya',
    city: 'Kota Bogor',
    total: 12_500_000,
    dateLabel: '24 Jul 2025, 10:15',
    currentStep: 2,
    progressPct: 60,
    itemsSummary: '100 dus Minuman Energi 250 ml · 20 dus Biskuit Cokelat',
    warehouse: 'Gudang Utama',
    steps: [
      {
        step: 1,
        label: 'Picking Barang',
        detail: 'Selesai – 10:32',
        status: 'done',
      },
      {
        step: 2,
        label: 'Packing',
        detail: 'Sedang diproses...',
        status: 'active',
      },
      {
        step: 3,
        label: 'Quality Check',
        detail: 'Menunggu',
        status: 'pending',
      },
      {
        step: 4,
        label: 'Siap Kirim',
        detail: 'Menunggu',
        status: 'pending',
      },
    ],
  },
  {
    id: 'ORD-20250724-002',
    outletName: 'Toko Sentosa',
    city: 'Kota Bogor',
    total: 8_750_000,
    dateLabel: '24 Jul 2025, 09:40',
    currentStep: 1,
    progressPct: 25,
    itemsSummary: '40 dus Biskuit Cokelat 100 g · 250 pcs Sabun Wangi',
    warehouse: 'Gudang A',
    steps: [
      {
        step: 1,
        label: 'Picking Barang',
        detail: 'Sedang diproses...',
        status: 'active',
      },
      { step: 2, label: 'Packing', detail: 'Menunggu', status: 'pending' },
      { step: 3, label: 'Quality Check', detail: 'Menunggu', status: 'pending' },
      { step: 4, label: 'Siap Kirim', detail: 'Menunggu', status: 'pending' },
    ],
  },
  {
    id: 'ORD-20250723-008',
    outletName: 'Toko Sumber Rezeki',
    city: 'Kab. Bogor',
    total: 6_450_000,
    dateLabel: '23 Jul 2025, 15:20',
    currentStep: 4,
    progressPct: 100,
    itemsSummary: '50 dus Minuman Energi 250 ml',
    warehouse: 'Gudang Utama',
    steps: [
      { step: 1, label: 'Picking Barang', detail: 'Selesai – 15:35', status: 'done' },
      { step: 2, label: 'Packing', detail: 'Selesai – 16:05', status: 'done' },
      { step: 3, label: 'Quality Check', detail: 'Selesai – 16:20', status: 'done' },
      { step: 4, label: 'Siap Kirim', detail: 'Terjadwal armada', status: 'done' },
    ],
  },
];

export const INITIAL_FULFILLMENTS: DistributorFulfillmentRecord[] = [
  {
    id: 'FUL-20250724-001',
    orderId: 'ORD-20250724-001',
    outletName: 'Toko Makmur Jaya',
    city: 'Kota Bogor',
    dateLabel: '24 Jul 2025',
    total: 12_500_000,
    status: 'Siap Kirim',
    driverName: 'Armada Box F 8821 AB',
    vehiclePlate: 'F 8821 AB',
    etaLabel: 'Estimasi: 24 Jul 2025, 15:30',
    timeline: [
      { title: 'Order Diproses', timestamp: '24 Jul 2025, 10:15', state: 'done' },
      { title: 'Disiapkan (Fulfillment)', timestamp: '24 Jul 2025, 11:30', state: 'done' },
      { title: 'Dalam Pengiriman', timestamp: 'Menunggu keberangkatan', state: 'pending' },
      { title: 'Sampai di Outlet', timestamp: 'Estimasi: 24 Jul 2025, 15:30', state: 'pending' },
      { title: 'Selesai', timestamp: 'Menunggu konfirmasi outlet', state: 'pending' },
    ],
  },
  {
    id: 'FUL-20250724-002',
    orderId: 'ORD-20250724-002',
    outletName: 'Toko Sentosa',
    city: 'Kota Bogor',
    dateLabel: '24 Jul 2025',
    total: 8_750_000,
    status: 'Siap Kirim',
    driverName: 'Armada Van F 9042 CD',
    vehiclePlate: 'F 9042 CD',
    etaLabel: 'Estimasi: 24 Jul 2025, 16:30',
    timeline: [
      { title: 'Order Diproses', timestamp: '24 Jul 2025, 09:40', state: 'done' },
      { title: 'Disiapkan (Fulfillment)', timestamp: '24 Jul 2025, 11:10', state: 'done' },
      { title: 'Dalam Pengiriman', timestamp: 'Siap muat dok 2', state: 'pending' },
      { title: 'Sampai di Outlet', timestamp: 'Estimasi: 24 Jul 2025, 16:30', state: 'pending' },
      { title: 'Selesai', timestamp: 'Menunggu konfirmasi outlet', state: 'pending' },
    ],
  },
  {
    id: 'FUL-20250723-006',
    orderId: 'ORD-20250723-006',
    outletName: 'Toko Abadi',
    city: 'Kota Depok',
    dateLabel: '23 Jul 2025',
    total: 5_200_000,
    status: 'Dalam Pengiriman',
    driverName: 'Kurir Wahyu (B 9410 UX)',
    vehiclePlate: 'B 9410 UX',
    etaLabel: 'Estimasi: 23 Jul 2025, 16:00',
    timeline: [
      { title: 'Order Diproses', timestamp: '23 Jul 2025, 09:20', state: 'done' },
      { title: 'Disiapkan (Fulfillment)', timestamp: '23 Jul 2025, 11:05', state: 'done' },
      { title: 'Dalam Pengiriman', timestamp: '23 Jul 2025, 14:10', state: 'active' },
      { title: 'Sampai di Outlet', timestamp: 'Estimasi: 23 Jul 2025, 16:00', state: 'pending' },
      { title: 'Selesai', timestamp: 'Menunggu konfirmasi outlet', state: 'pending' },
    ],
  },
  {
    id: 'FUL-20250723-005',
    orderId: 'ORD-20250723-005',
    outletName: 'Toko Maju Bersama',
    city: 'Kota Tangerang',
    dateLabel: '23 Jul 2025',
    total: 9_400_000,
    status: 'Dikirim',
    driverName: 'Armada Box B 8120 KL',
    vehiclePlate: 'B 8120 KL',
    etaLabel: 'Estimasi: 23 Jul 2025, 17:15',
    timeline: [
      { title: 'Order Diproses', timestamp: '23 Jul 2025, 08:45', state: 'done' },
      { title: 'Disiapkan (Fulfillment)', timestamp: '23 Jul 2025, 10:20', state: 'done' },
      { title: 'Dalam Pengiriman', timestamp: '23 Jul 2025, 13:30', state: 'active' },
      { title: 'Sampai di Outlet', timestamp: 'Estimasi: 23 Jul 2025, 17:15', state: 'pending' },
      { title: 'Selesai', timestamp: 'Menunggu konfirmasi outlet', state: 'pending' },
    ],
  },
];

export const INITIAL_DISTRIBUTOR_OUTLETS: DistributorOutletRecord[] = [
  {
    id: 'do-1',
    name: 'Toko Makmur Jaya',
    city: 'Kota Bogor',
    address: 'Jl. Raya Bogor No. 12, Bogor Tengah',
    distanceKm: 2.4,
    isPriority: true,
    visitToday: true,
    status: 'Aktif',
    tier: 'Prioritas',
    covered: true,
    category: 'General Trade',
    picName: 'Bapak Hendra',
    phone: '0812-3456-7890',
    email: 'toko.makmurjaya@example.com',
    lat: -6.597147,
    lng: 106.806039,
    lastOrderTotal: 12_500_000,
    lastVisitDate: '24 Jul 2025',
  },
  {
    id: 'do-2',
    name: 'Toko Sentosa',
    city: 'Kota Bogor',
    address: 'Jl. Melati No. 10, Bogor Timur',
    distanceKm: 3.1,
    isPriority: true,
    visitToday: true,
    status: 'Aktif',
    tier: 'Prioritas',
    covered: true,
    category: 'General Trade',
    picName: 'Ibu Ratna Sari',
    phone: '0813-9988-1122',
    email: 'sentosa.outlet@example.com',
    lat: -6.605421,
    lng: 106.81421,
    lastOrderTotal: 8_750_000,
    lastVisitDate: '24 Jul 2025',
  },
  {
    id: 'do-3',
    name: 'Toko Sumber Rezeki',
    city: 'Kab. Bogor',
    address: 'Jl. Pajajaran Indah No. 45, Cibinong',
    distanceKm: 6.8,
    isPriority: false,
    visitToday: true,
    status: 'Aktif',
    tier: 'Reguler',
    covered: true,
    category: 'Semi Grosir',
    picName: 'Bapak Agus',
    phone: '0815-7700-3344',
    email: 'sumber.rezeki@example.com',
    lat: -6.57892,
    lng: 106.81945,
    lastOrderTotal: 6_450_000,
    lastVisitDate: '23 Jul 2025',
  },
  {
    id: 'do-4',
    name: 'Toko Abadi',
    city: 'Kota Depok',
    address: 'Jl. Tole Iskandar No. 19, Depok',
    distanceKm: 9.4,
    isPriority: false,
    visitToday: false,
    status: 'Aktif',
    tier: 'Reguler',
    covered: true,
    category: 'General Trade',
    picName: 'Bapak Darmawan',
    phone: '0818-5566-7788',
    email: 'toko.abadi@example.com',
    lat: -6.40248,
    lng: 106.83312,
    lastOrderTotal: 5_200_000,
    lastVisitDate: '23 Jul 2025',
  },
  {
    id: 'do-5',
    name: 'Toko Maju Bersama',
    city: 'Kota Tangerang',
    address: 'Jl. Jenderal Sudirman No. 88, Tangerang',
    distanceKm: 18.2,
    isPriority: false,
    visitToday: false,
    status: 'Nonaktif',
    tier: 'Reguler',
    covered: false,
    category: 'Modern Trade',
    picName: 'Ibu Dewi Lestari',
    phone: '0817-2233-4455',
    email: 'majubersama@example.com',
    lat: -6.178306,
    lng: 106.631889,
    lastOrderTotal: 9_400_000,
    lastVisitDate: '12 Jun 2025',
  },
];

export const INITIAL_DISTRIBUTOR_SALES_TEAM: DistributorSalesRep[] = [
  {
    id: 'dsr-1',
    name: 'Budi Santoso',
    area: 'Area Bogor',
    status: 'Aktif',
    phone: '0812-8899-2025',
    outletsHandled: 28,
    monthlyOrderTotal: 162_500_000,
    visitsCompleted: 24,
    targetVisits: 25,
  },
  {
    id: 'dsr-2',
    name: 'Andi Pratama',
    area: 'Area Depok',
    status: 'Aktif',
    phone: '0813-4422-7788',
    outletsHandled: 24,
    monthlyOrderTotal: 148_200_000,
    visitsCompleted: 20,
    targetVisits: 24,
  },
  {
    id: 'dsr-3',
    name: 'Rina Amelia',
    area: 'Area Tangerang',
    status: 'Aktif',
    phone: '0815-6677-9900',
    outletsHandled: 22,
    monthlyOrderTotal: 139_400_000,
    visitsCompleted: 19,
    targetVisits: 22,
  },
  {
    id: 'dsr-4',
    name: 'Dewi Lestari',
    area: 'Area Bekasi',
    status: 'Aktif',
    phone: '0817-9900-1122',
    outletsHandled: 19,
    monthlyOrderTotal: 118_700_000,
    visitsCompleted: 16,
    targetVisits: 20,
  },
];

export const DISTRIBUTOR_REPORTS_LIST = [
  {
    id: 'drep-sales',
    tab: 'Penjualan' as const,
    title: 'Laporan Penjualan',
    subtitle: 'Nilai, volume, dan per produk',
    metric: 'Rp 625,8 jt',
  },
  {
    id: 'drep-order',
    tab: 'Penjualan' as const,
    title: 'Laporan Order',
    subtitle: 'Rekap order dan status',
    metric: '1.248 order',
  },
  {
    id: 'drep-dist',
    tab: 'Distribusi' as const,
    title: 'Laporan Distribusi',
    subtitle: 'Pengiriman, fulfillment, dan SLA',
    metric: '96,4% on-time',
  },
  {
    id: 'drep-stok',
    tab: 'Stok' as const,
    title: 'Laporan Stok',
    subtitle: 'Posisi, pergerakan, dan valuasi',
    metric: '85.320 unit',
  },
  {
    id: 'drep-outlet',
    tab: 'Distribusi' as const,
    title: 'Laporan Outlet',
    subtitle: 'Aktivitas, cakupan, dan performa',
    metric: '94,3% tercakup',
  },
  {
    id: 'drep-team',
    tab: 'Tim' as const,
    title: 'Laporan Tim Sales',
    subtitle: 'Kinerja, kunjungan, dan realisasi',
    metric: '40 / 42 aktif',
  },
];

export const INITIAL_DISTRIBUTOR_PROMOS: DistributorPromoCampaign[] = [
  {
    id: 'dpromo-1',
    title: 'Diskon 20% Minuman Energi',
    period: '1–31 Okt 2026',
    kind: 'Program',
    status: 'Aktif',
    discountRule: 'Potongan 20% pembelian min. 5 dus',
    targetSku: 'SX-MNM-001',
    description: 'Diskon berlaku untuk seluruh outlet Area Bogor, Depok, Bekasi & Tangerang.',
  },
  {
    id: 'dpromo-2',
    title: 'Beli 5 Gratis 1 Biskuit',
    period: '1–31 Okt 2026',
    kind: 'Program',
    status: 'Aktif',
    discountRule: 'Bonus 1 dus setiap kelipatan 5 dus',
    targetSku: 'SX-BSK-002',
    description: 'Otomatis ditambahkan pada manifest pengiriman fulfillment distributor.',
  },
  {
    id: 'dpromo-3',
    title: 'Point x2 Semua Produk',
    period: '1–31 Okt 2026',
    kind: 'Program',
    status: 'Terjadwal',
    discountRule: '2x SmartReward Points per transaksi selesai',
    targetSku: 'SX-PRW-003',
    description: 'Kampanye loyalitas akhir bulan bagi mitra outlet prioritas.',
  },
  {
    id: 'dcamp-1',
    title: 'Display Rak Utama Jawa Barat',
    period: '1–30 Nov 2026',
    kind: 'Campaign',
    status: 'Aktif',
    discountRule: 'Rebate 5% untuk foto rak tervalidasi GPS',
    targetSku: 'SX-MNM-001',
    description: 'Program aktivasi rak end-cap minimarket dan toko kelontong besar.',
  },
  {
    id: 'dcamp-2',
    title: 'Ekspansi Outlet Baru Cibinong',
    period: '15 Okt – 15 Des 2026',
    kind: 'Campaign',
    status: 'Aktif',
    discountRule: 'Voucher starter Rp 250.000 per outlet baru',
    targetSku: 'SX-MNM-004',
    description: 'Target akuisisi 60 outlet yang belum tercakup di wilayah Kab. Bogor.',
  },
];

/* ============================================================================
 * 2. PRINCIPAL PORTAL DATA & TYPES (PT Sinar Produk Utama)
 * ============================================================================ */

export interface PrincipalProductRecord {
  sku: string;
  name: string;
  category: 'Minuman' | 'Makanan' | 'Perawatan Pribadi' | 'Kebersihan Rumah' | 'Lainnya';
  status: 'Aktif' | 'Nonaktif';
  rrp: number;
  distributorPrice: number;
  moq: number;
  accentHex: string;
  description: string;
}

export interface PrincipalProductVariant {
  id: string;
  parentSku: string;
  sku: string;
  variantLabel: string;
  barcode: string;
  status: 'Aktif' | 'Nonaktif';
  unitWeight: string;
}

export interface PrincipalCategorySummary {
  id: string;
  name: 'Minuman' | 'Makanan' | 'Perawatan Pribadi' | 'Kebersihan Rumah' | 'Lainnya';
  productCount: number;
  description: string;
}

export interface PrincipalDistributorPriceRow {
  id: string;
  distributorId: string;
  distributorName: string;
  sku: string;
  productName: string;
  stockQty: number;
  stockStatus: 'Aman' | 'Rendah' | 'Habis';
  pricePerUnit: number;
}

export interface PricingPolicyRule {
  id: string;
  title: string;
  subtitle: string;
  activeSummary: string;
  ruleType: 'RRP' | 'Diskon' | 'Wilayah' | 'Channel' | 'MOQ';
  updatedAt: string;
  detailRules: string[];
}

export interface PrincipalCampaignItem {
  id: string;
  title: string;
  period: string;
  status: 'Aktif' | 'Terjadwal' | 'Draft' | 'Selesai';
  discountLabel: string;
  productLine: string;
  skuCount: number;
  targetSales: number;
  realizedSales: number;
  distributorScope: string;
  distributorCount: number;
  notes: string;
}

export interface PrincipalDistributorPartner {
  id: string;
  name: string;
  region: string;
  status: 'Aktif' | 'Nonaktif';
  picName: string;
  phone: string;
  email: string;
  warehouseLocation: string;
  monthlySalesValue: number;
  orderCount: number;
  contractPeriod: string;
  slaOnTimePct: number;
  notes: string[];
}

export interface PrincipalDistributorOrder {
  id: string;
  distributorId: string;
  distributorName: string;
  dateLabel: string;
  total: number;
  status: 'Diproses' | 'Dikirim' | 'Selesai';
  itemsSummary: string;
}

export const PRINCIPAL_PROFILE = {
  companyName: 'PT Sinar Produk Utama',
  email: 'principal@sinarprodukutama.co.id',
  salesThroughValueJt: 4258.9,
  salesThroughFull: 4_258_900_000,
  salesThroughGrowth: '+18,2%',
  totalOrderCount: 8425,
  totalOrderGrowth: '+15,6%',
  activeDistributorsCount: 24,
  activeProductsCount: 320,
};

export const PRINCIPAL_SALES_THROUGH_TREND = [
  { month: 'Jan', valueJt: 480, displayScale: 18 },
  { month: 'Feb', valueJt: 560, displayScale: 22 },
  { month: 'Mar', valueJt: 640, displayScale: 26 },
  { month: 'Apr', valueJt: 720, displayScale: 31 },
  { month: 'Mei', valueJt: 860, displayScale: 39 },
  { month: 'Jun', valueJt: 998.9, displayScale: 46 },
];

export const INITIAL_PRINCIPAL_PRODUCTS: PrincipalProductRecord[] = [
  {
    sku: 'SX-MNM-001',
    name: 'Minuman Energi 250 ml',
    category: 'Minuman',
    status: 'Aktif',
    rrp: 6000,
    distributorPrice: 5000,
    moq: 10,
    accentHex: '#F97316',
    description: 'Minuman energi bervitamin dalam kemasan botol 250 ml siap distribusi nasional.',
  },
  {
    sku: 'SX-BSK-002',
    name: 'Biskuit Cokelat 100 g',
    category: 'Makanan',
    status: 'Aktif',
    rrp: 9500,
    distributorPrice: 8500,
    moq: 10,
    accentHex: '#B45309',
    description: 'Biskuit lapis krim cokelat renyah untuk segmen General Trade & Modern Trade.',
  },
  {
    sku: 'SX-PRW-003',
    name: 'Sabun Wangi 80 g',
    category: 'Perawatan Pribadi',
    status: 'Aktif',
    rrp: 4800,
    distributorPrice: 4000,
    moq: 20,
    accentHex: '#10B981',
    description: 'Sabun mandi aromaterapi harian dengan formula lembut untuk keluarga.',
  },
  {
    sku: 'SX-SMP-004',
    name: 'Sampo Herbal 180 ml',
    category: 'Perawatan Pribadi',
    status: 'Aktif',
    rrp: 18500,
    distributorPrice: 16500,
    moq: 12,
    accentHex: '#047857',
    description: 'Sampo ekstrak bahan alami untuk kesehatan akar rambut.',
  },
  {
    sku: 'SX-KBR-005',
    name: 'Cairan Pembersih Lantai 800 ml',
    category: 'Kebersihan Rumah',
    status: 'Nonaktif',
    rrp: 14500,
    distributorPrice: 12000,
    moq: 12,
    accentHex: '#348CB2',
    description: 'Pembersih lantai antibakteri dengan aroma pinus segar (sedang reformulasi kemasan).',
  },
];

export const INITIAL_PRINCIPAL_CATEGORIES: PrincipalCategorySummary[] = [
  { id: 'cat-1', name: 'Minuman', productCount: 42, description: 'Minuman energi, teh kemasan, dan isotonik' },
  { id: 'cat-2', name: 'Makanan', productCount: 68, description: 'Biskuit, makanan ringan, dan wafer keluarga' },
  { id: 'cat-3', name: 'Perawatan Pribadi', productCount: 56, description: 'Sabun, sampo herbal, dan perawatan tubuh' },
  { id: 'cat-4', name: 'Kebersihan Rumah', productCount: 38, description: 'Pembersih lantai, deterjen, dan pewangi' },
  { id: 'cat-5', name: 'Lainnya', productCount: 16, description: 'Produk tisu, perlengkapan harian & paket promo' },
];

export const INITIAL_PRINCIPAL_VARIANTS: PrincipalProductVariant[] = [
  {
    id: 'var-1',
    parentSku: 'SX-MNM-001',
    sku: 'SX-MNM-001-A',
    variantLabel: 'Rasa Original · 250 ml',
    barcode: '8991234560012',
    status: 'Aktif',
    unitWeight: '250 ml',
  },
  {
    id: 'var-2',
    parentSku: 'SX-MNM-001',
    sku: 'SX-MNM-001-B',
    variantLabel: 'Rasa Jeruk · 250 ml',
    barcode: '8991234560013',
    status: 'Aktif',
    unitWeight: '250 ml',
  },
  {
    id: 'var-3',
    parentSku: 'SX-MNM-001',
    sku: 'SX-MNM-001-C',
    variantLabel: 'Rasa Anggur · 250 ml',
    barcode: '8991234560014',
    status: 'Aktif',
    unitWeight: '250 ml',
  },
];

export const INITIAL_PRINCIPAL_PRICELIST: PrincipalDistributorPriceRow[] = [
  {
    id: 'pl-1',
    distributorId: 'pdist-1',
    distributorName: 'PT Maju Distribusi',
    sku: 'SX-MNM-001',
    productName: 'Minuman Energi 250 ml',
    stockQty: 1400,
    stockStatus: 'Aman',
    pricePerUnit: 5000,
  },
  {
    id: 'pl-2',
    distributorId: 'pdist-1',
    distributorName: 'PT Maju Distribusi',
    sku: 'SX-BSK-002',
    productName: 'Biskuit Cokelat 100 g',
    stockQty: 8500,
    stockStatus: 'Aman',
    pricePerUnit: 8500,
  },
  {
    id: 'pl-3',
    distributorId: 'pdist-1',
    distributorName: 'PT Maju Distribusi',
    sku: 'SX-PRW-003',
    productName: 'Sabun Wangi 80 g',
    stockQty: 4000,
    stockStatus: 'Rendah',
    pricePerUnit: 4000,
  },
  {
    id: 'pl-4',
    distributorId: 'pdist-1',
    distributorName: 'PT Maju Distribusi',
    sku: 'SX-SMP-004',
    productName: 'Sampo Herbal 180 ml',
    stockQty: 0,
    stockStatus: 'Habis',
    pricePerUnit: 16500,
  },
  {
    id: 'pl-5',
    distributorId: 'pdist-2',
    distributorName: 'PT Sentosa Niaga',
    sku: 'SX-MNM-001',
    productName: 'Minuman Energi 250 ml',
    stockQty: 2200,
    stockStatus: 'Aman',
    pricePerUnit: 5000,
  },
  {
    id: 'pl-6',
    distributorId: 'pdist-2',
    distributorName: 'PT Sentosa Niaga',
    sku: 'SX-SMP-004',
    productName: 'Sampo Herbal 180 ml',
    stockQty: 320,
    stockStatus: 'Rendah',
    pricePerUnit: 16800,
  },
  {
    id: 'pl-7',
    distributorId: 'pdist-3',
    distributorName: 'PT Karya Distribusi',
    sku: 'SX-BSK-002',
    productName: 'Biskuit Cokelat 100 g',
    stockQty: 4100,
    stockStatus: 'Aman',
    pricePerUnit: 8600,
  },
];

export const INITIAL_PRICING_POLICIES: PricingPolicyRule[] = [
  {
    id: 'pol-1',
    title: 'Aturan Harga Dasar',
    subtitle: 'Harga rekomendasi (RRP)',
    activeSummary: 'Margin standar distributor 16–20% dari RRP nasional',
    ruleType: 'RRP',
    updatedAt: '20 Jun 2025',
    detailRules: [
      'RRP wajib dicantumkan seragam pada seluruh katalog outlet resmi.',
      'Perubahan harga dasar harus disahkan minimal 14 hari sebelum berlaku.',
    ],
  },
  {
    id: 'pol-2',
    title: 'Diskon & Potongan',
    subtitle: 'Aturan diskon per channel',
    activeSummary: 'Maksimal diskon promo terpusat 20% + rebate volume 5%',
    ruleType: 'Diskon',
    updatedAt: '18 Jun 2025',
    detailRules: [
      'General Trade: diskon kuantitas hingga 12% untuk order > 50 dus.',
      'Modern Trade: rebate listing & promo musiman maksimal 20%.',
    ],
  },
  {
    id: 'pol-3',
    title: 'Harga Berdasarkan Wilayah',
    subtitle: 'Per wilayah distribusi',
    activeSummary: 'Zona 1 Jawa-Bali (Harga Dasar), Zona 2 Sumatera (+2,5%)',
    ruleType: 'Wilayah',
    updatedAt: '15 Jun 2025',
    detailRules: [
      'Jawa Barat, Jawa Tengah & Jawa Timur menggunakan tarif Zona 1.',
      'Sumatera & Kalimantan memperhitungkan subsidi logistik +2,5%.',
    ],
  },
  {
    id: 'pol-4',
    title: 'Harga Berdasarkan Channel',
    subtitle: 'Distributor, modern trade, dll.',
    activeSummary: 'Tier harga khusus untuk Distributor Utama, Grosir, & Retail',
    ruleType: 'Channel',
    updatedAt: '12 Jun 2025',
    detailRules: [
      'Distributor Tier-A mendapat harga pabrik nett dengan termin TOP 30 hari.',
      'Semi-Grosir mendapat harga grosir berjenjang berdasarkan MOQ.',
    ],
  },
  {
    id: 'pol-5',
    title: 'Minimum Order',
    subtitle: 'Aturan MOQ per produk',
    activeSummary: 'MOQ Pembelian Distributor: 10 dus/SKU',
    ruleType: 'MOQ',
    updatedAt: '10 Jun 2025',
    detailRules: [
      'Order di bawah MOQ otomatis diarahkan ke bundling campuran SKU.',
      'Pengiriman bebas ongkos kirim untuk order di atas Rp 25.000.000.',
    ],
  },
];

export const INITIAL_PRINCIPAL_CAMPAIGNS: PrincipalCampaignItem[] = [
  {
    id: 'pcamp-1',
    title: 'Diskon 20% Minuman Energi',
    period: '1–31 Okt 2026',
    status: 'Aktif',
    discountLabel: 'Diskon 20%',
    productLine: 'Minuman Energi',
    skuCount: 3,
    targetSales: 1_000_000_000,
    realizedSales: 742_000_000,
    distributorScope: '24 Distributor · Nasional',
    distributorCount: 24,
    notes: 'Berlaku untuk seluruh varian 250 ml (Original, Jeruk, Anggur).',
  },
  {
    id: 'pcamp-2',
    title: 'Beli 5 Gratis 1 Biskuit',
    period: '1–31 Okt 2026',
    status: 'Aktif',
    discountLabel: 'Bonus 5+1',
    productLine: 'Biskuit Cokelat',
    skuCount: 2,
    targetSales: 650_000_000,
    realizedSales: 488_000_000,
    distributorScope: '18 Distributor · Jawa & Bali',
    distributorCount: 18,
    notes: 'Alokasi stok bonus langsung ditambahkan dalam PO distributor.',
  },
  {
    id: 'pcamp-3',
    title: 'Point x2 Semua Produk',
    period: '1–31 Okt 2026',
    status: 'Terjadwal',
    discountLabel: 'Point 2x',
    productLine: 'Seluruh Kategori',
    skuCount: 12,
    targetSales: 1_200_000_000,
    realizedSales: 0,
    distributorScope: '24 Distributor · Nasional',
    distributorCount: 24,
    notes: 'Program akselerasi loyalitas outlet menjelang akhir kuartal.',
  },
  {
    id: 'pcamp-4',
    title: 'Bundling Hemat Keluarga',
    period: '1–15 Nov 2026',
    status: 'Draft',
    discountLabel: 'Paket Bundling',
    productLine: 'Perawatan & Makanan',
    skuCount: 4,
    targetSales: 500_000_000,
    realizedSales: 0,
    distributorScope: '12 Distributor · Jabodetabek',
    distributorCount: 12,
    notes: 'Menunggu persetujuan final materi visual dari divisi brand.',
  },
];

export const INITIAL_PRINCIPAL_DISTRIBUTORS: PrincipalDistributorPartner[] = [
  {
    id: 'pdist-1',
    name: 'PT Maju Distribusi',
    region: 'Jawa Barat',
    status: 'Aktif',
    picName: 'Andi Pratama',
    phone: '0812-3456-7890',
    email: 'andi@majudistribusi.co.id',
    warehouseLocation: 'Kab. Bogor, Jawa Barat',
    monthlySalesValue: 1_256_800_000,
    orderCount: 624,
    contractPeriod: 'Jan 2025 – Des 2026 (Tier-A Nasional)',
    slaOnTimePct: 96.4,
    notes: [
      '24 Jun 2025: Prioritaskan restock SX-SMP-004 minggu ini karena stok di Gudang B kosong.',
      '15 Jun 2025: Pencapaian kuartal melampaui target 108%.',
    ],
  },
  {
    id: 'pdist-2',
    name: 'PT Sentosa Niaga',
    region: 'Jawa Tengah',
    status: 'Aktif',
    picName: 'Rudi Hartono',
    phone: '0813-2244-6688',
    email: 'rudi@sentosaniaga.co.id',
    warehouseLocation: 'Kota Semarang, Jawa Tengah',
    monthlySalesValue: 892_400_000,
    orderCount: 412,
    contractPeriod: 'Mar 2025 – Feb 2027 (Tier-A Regional)',
    slaOnTimePct: 94.1,
    notes: ['Fokus ekspansi outlet modern trade Semarang & Solo.'],
  },
  {
    id: 'pdist-3',
    name: 'PT Karya Distribusi',
    region: 'Jawa Timur',
    status: 'Aktif',
    picName: 'Sari Wulandari',
    phone: '0811-3355-7799',
    email: 'sari@karyadistribusi.co.id',
    warehouseLocation: 'Surabaya, Jawa Timur',
    monthlySalesValue: 756_000_000,
    orderCount: 368,
    contractPeriod: 'Jan 2025 – Des 2026 (Tier-B)',
    slaOnTimePct: 91.8,
    notes: ['Permintaan promo ekstra untuk produk Minuman Energi jelang acara kota.'],
  },
  {
    id: 'pdist-4',
    name: 'PT Bumi Sejahtera',
    region: 'Sumatera',
    status: 'Nonaktif',
    picName: 'Bapak Iskandar',
    phone: '0819-6677-8899',
    email: 'iskandar@bumisejahtera.co.id',
    warehouseLocation: 'Kota Medan, Sumatera Utara',
    monthlySalesValue: 215_000_000,
    orderCount: 95,
    contractPeriod: 'Dalam evaluasi perpanjangan kontrak',
    slaOnTimePct: 82.5,
    notes: ['Audit pergudangan dan pembaruan dokumen pajak sedang berlangsung.'],
  },
];

export const INITIAL_PRINCIPAL_ORDERS: PrincipalDistributorOrder[] = [
  {
    id: 'ORD-20250624-001',
    distributorId: 'pdist-1',
    distributorName: 'PT Maju Distribusi',
    dateLabel: '24 Jun 2025',
    total: 125_000_000,
    status: 'Diproses',
    itemsSummary: '1.200 dus Minuman Energi · 400 dus Biskuit Cokelat',
  },
  {
    id: 'ORD-20250623-006',
    distributorId: 'pdist-1',
    distributorName: 'PT Maju Distribusi',
    dateLabel: '23 Jun 2025',
    total: 87_500_000,
    status: 'Dikirim',
    itemsSummary: '950 dus Sabun Wangi 80 g · 300 dus Sampo Herbal',
  },
  {
    id: 'ORD-20250622-003',
    distributorId: 'pdist-1',
    distributorName: 'PT Maju Distribusi',
    dateLabel: '22 Jun 2025',
    total: 52_000_000,
    status: 'Selesai',
    itemsSummary: '600 dus Minuman Energi 250 ml',
  },
  {
    id: 'ORD-20250621-011',
    distributorId: 'pdist-2',
    distributorName: 'PT Sentosa Niaga',
    dateLabel: '21 Jun 2025',
    total: 94_000_000,
    status: 'Selesai',
    itemsSummary: '1.100 dus Biskuit Cokelat 100 g',
  },
  {
    id: 'ORD-20250620-007',
    distributorId: 'pdist-3',
    distributorName: 'PT Karya Distribusi',
    dateLabel: '20 Jun 2025',
    total: 78_200_000,
    status: 'Dikirim',
    itemsSummary: '850 dus Minuman Energi 250 ml',
  },
];

/* ============================================================================
 * 3. SUPERVISOR PORTAL DATA & TYPES (Andi Pratama · Supervisor Area Bogor)
 * ============================================================================ */

export interface SupervisorTeamRep {
  id: string;
  name: string;
  areaLabel: string;
  cityArea: 'Area Bogor' | 'Area Depok' | 'Area Bekasi' | 'Area Tangerang';
  status: 'Aktif' | 'Nonaktif';
  shiftStatus: 'Dalam Shift' | 'Terlambat' | 'Belum Masuk';
  clockInTime: string;
  online: boolean;
  lastSeenLabel: string;
  locationLabel: string;
  speedKmh: number;
  batteryPct: number;
  accuracyM: number;
  lat: number;
  lng: number;
  monthlySalesJt: number;
  targetPct: number;
  visitsToday: number;
  targetVisits: number;
  phone: string;
}

export interface SupervisorVisitItem {
  id: string;
  repId: string;
  repName: string;
  outletName: string;
  checkInTime: string;
  durationLabel: string;
  status: 'Berlangsung' | 'Selesai' | 'Rencana';
  shiftTag: 'Dalam Shift' | 'Selesai' | 'Terjadwal';
  notes: string;
  lat: number;
  lng: number;
}

export interface RouteReplayWaypoint {
  id: string;
  time: string;
  label: string;
  address: string;
  speedKmh: number;
  lat: number;
  lng: number;
}

export interface AreaCoverageStat {
  id: string;
  area: 'Area Bogor' | 'Area Depok' | 'Area Bekasi' | 'Area Tangerang';
  outletCount: number;
  coveragePct: number;
  colorHex: string;
}

export interface SupervisorTimelineEvent {
  id: string;
  repId: string;
  time: string;
  title: string;
  subtitle: string;
  kind: 'attendance' | 'visit' | 'order' | 'checkout';
  toneColor: string;
}

export interface SupervisorAlertItem {
  id: string;
  title: string;
  subtitle: string;
  severity: 'Penting' | 'Follow-up';
  repName: string;
  area: string;
  resolved: boolean;
  recommendedAction: string;
}

export const SUPERVISOR_PROFILE = {
  name: 'Andi Pratama',
  roleTitle: 'Supervisor - Area Bogor',
  badge: 'Supervisor',
  dateLabel: 'Hari ini, 24 Jun 2025',
  email: 'andi.pratama@majudistribusi.co.id',
  phone: '0812-9000-4455',
  activeTeamCount: 12,
  totalTeamCount: 15,
  visitsTodayCount: 98,
  visitsGrowth: '+14,6%',
  ordersValueJt: 125.8,
  ordersGrowth: '+18,2%',
  targetPct: 76.4,
  monthlyTarget: 500_000_000,
  monthlyRealized: 382_000_000,
  monthlyRemaining: 118_000_000,
};

export const SUPERVISOR_VISIT_TREND = [
  { month: 'Jan', visits: 18 },
  { month: 'Feb', visits: 21 },
  { month: 'Mar', visits: 23 },
  { month: 'Apr', visits: 25 },
  { month: 'Mei', visits: 29 },
  { month: 'Jun', visits: 34 },
];

export const INITIAL_SUPERVISOR_TEAM: SupervisorTeamRep[] = [
  {
    id: 'sup-rep-1',
    name: 'Budi Santoso',
    areaLabel: 'Sales - Bogor',
    cityArea: 'Area Bogor',
    status: 'Aktif',
    shiftStatus: 'Dalam Shift',
    clockInTime: 'Masuk 08:01',
    online: true,
    lastSeenLabel: '2 menit lalu',
    locationLabel: 'Jl. Raya Bogor',
    speedKmh: 8,
    batteryPct: 78,
    accuracyM: 5,
    lat: -6.597147,
    lng: 106.806039,
    monthlySalesJt: 125.8,
    targetPct: 104.6,
    visitsToday: 6,
    targetVisits: 8,
    phone: '0812-8899-2025',
  },
  {
    id: 'sup-rep-2',
    name: 'Rina Amelia',
    areaLabel: 'Sales - Depok',
    cityArea: 'Area Depok',
    status: 'Aktif',
    shiftStatus: 'Dalam Shift',
    clockInTime: 'Masuk 08:05',
    online: true,
    lastSeenLabel: '1 menit lalu',
    locationLabel: 'Jl. Margonda Raya, Depok',
    speedKmh: 16,
    batteryPct: 84,
    accuracyM: 6,
    lat: -6.385589,
    lng: 106.830711,
    monthlySalesJt: 98.4,
    targetPct: 98.2,
    visitsToday: 5,
    targetVisits: 7,
    phone: '0813-4422-7788',
  },
  {
    id: 'sup-rep-3',
    name: 'Dedi Kurniawan',
    areaLabel: 'Sales - Bogor',
    cityArea: 'Area Bogor',
    status: 'Aktif',
    shiftStatus: 'Dalam Shift',
    clockInTime: 'Masuk 08:12',
    online: true,
    lastSeenLabel: '4 menit lalu',
    locationLabel: 'Jl. Pajajaran Indah, Cibinong',
    speedKmh: 12,
    batteryPct: 65,
    accuracyM: 7,
    lat: -6.57892,
    lng: 106.81945,
    monthlySalesJt: 87.5,
    targetPct: 92.1,
    visitsToday: 5,
    targetVisits: 7,
    phone: '0815-6677-9900',
  },
  {
    id: 'sup-rep-4',
    name: 'Siti Rahma',
    areaLabel: 'Sales - Tangerang',
    cityArea: 'Area Tangerang',
    status: 'Aktif',
    shiftStatus: 'Terlambat',
    clockInTime: 'Terlambat 08:32',
    online: true,
    lastSeenLabel: '5 menit lalu',
    locationLabel: 'Jl. Jend. Sudirman, Tangerang',
    speedKmh: 0,
    batteryPct: 91,
    accuracyM: 8,
    lat: -6.178306,
    lng: 106.631889,
    monthlySalesJt: 76.2,
    targetPct: 88.4,
    visitsToday: 4,
    targetVisits: 7,
    phone: '0817-9900-1122',
  },
  {
    id: 'sup-rep-5',
    name: 'Fajar Hidayat',
    areaLabel: 'Sales - Bekasi',
    cityArea: 'Area Bekasi',
    status: 'Nonaktif',
    shiftStatus: 'Belum Masuk',
    clockInTime: 'Belum Absen',
    online: false,
    lastSeenLabel: '32 menit lalu',
    locationLabel: 'Terakhir di Bekasi Barat',
    speedKmh: 0,
    batteryPct: 19,
    accuracyM: 25,
    lat: -6.23827,
    lng: 106.975573,
    monthlySalesJt: 62.0,
    targetPct: 81.3,
    visitsToday: 2,
    targetVisits: 7,
    phone: '0819-5544-3322',
  },
];

export const INITIAL_SUPERVISOR_VISITS: SupervisorVisitItem[] = [
  {
    id: 'svis-1',
    repId: 'sup-rep-1',
    repName: 'Budi Santoso',
    outletName: 'Toko Makmur Jaya',
    checkInTime: 'Check-in 09:10',
    durationLabel: '00:42:15',
    status: 'Berlangsung',
    shiftTag: 'Dalam Shift',
    notes: 'Pengecekan stok Minuman Energi & negosiasi display akhir bulan.',
    lat: -6.597147,
    lng: 106.806039,
  },
  {
    id: 'svis-2',
    repId: 'sup-rep-2',
    repName: 'Rina Amelia',
    outletName: 'Toko Maju Bersama',
    checkInTime: 'Check-in 09:25',
    durationLabel: '00:27:03',
    status: 'Berlangsung',
    shiftTag: 'Dalam Shift',
    notes: 'Pemasangan materi promo Biskuit Cokelat 100 g.',
    lat: -6.385589,
    lng: 106.830711,
  },
  {
    id: 'svis-3',
    repId: 'sup-rep-3',
    repName: 'Dedi Kurniawan',
    outletName: 'Toko Sumber Rezeki',
    checkInTime: 'Check-in 09:40',
    durationLabel: '00:12:18',
    status: 'Berlangsung',
    shiftTag: 'Dalam Shift',
    notes: 'Follow-up faktur & konfirmasi reorder mingguan.',
    lat: -6.57892,
    lng: 106.81945,
  },
  {
    id: 'svis-4',
    repId: 'sup-rep-1',
    repName: 'Budi Santoso',
    outletName: 'Toko Sentosa',
    checkInTime: 'Check-in 08:15',
    durationLabel: '00:35:00',
    status: 'Selesai',
    shiftTag: 'Selesai',
    notes: 'Order ORD-20250624-001 berhasil dikonfirmasi senilai Rp 12.500.000.',
    lat: -6.605421,
    lng: 106.81421,
  },
  {
    id: 'svis-6',
    repId: 'sup-rep-2',
    repName: 'Rina Amelia',
    outletName: 'Toko Abadi',
    checkInTime: 'Check-in 08:20',
    durationLabel: '00:41:10',
    status: 'Selesai',
    shiftTag: 'Selesai',
    notes: 'Pengiriman & audit rak display kategori Perawatan Pribadi.',
    lat: -6.39121,
    lng: 106.82451,
  },
  {
    id: 'svis-7',
    repId: 'sup-rep-3',
    repName: 'Dedi Kurniawan',
    outletName: 'Warung Berkah Mandiri',
    checkInTime: 'Check-in 08:30',
    durationLabel: '00:28:45',
    status: 'Selesai',
    shiftTag: 'Selesai',
    notes: 'Restock 15 dus Biskuit Cokelat & pelunasan faktur.',
    lat: -6.58812,
    lng: 106.81292,
  },
  {
    id: 'svis-8',
    repId: 'sup-rep-4',
    repName: 'Siti Rahma',
    outletName: 'Minimart Raya Tangerang',
    checkInTime: 'Check-in 08:45',
    durationLabel: '00:32:12',
    status: 'Selesai',
    shiftTag: 'Selesai',
    notes: 'Update harga kontrak outlet & aktivasi promo poin x2.',
    lat: -6.1789,
    lng: 106.6311,
  },
  {
    id: 'svis-5',
    repId: 'sup-rep-4',
    repName: 'Siti Rahma',
    outletName: 'Minimart Harapan Baru',
    checkInTime: 'Rencana 13:30',
    durationLabel: 'Terjadwal',
    status: 'Rencana',
    shiftTag: 'Terjadwal',
    notes: 'Presentasi varian baru Minuman Energi Rasa Anggur.',
    lat: -6.57411,
    lng: 106.79245,
  },
  {
    id: 'svis-9',
    repId: 'sup-rep-1',
    repName: 'Budi Santoso',
    outletName: 'Supermarket Sentral Bogor',
    checkInTime: 'Rencana 14:15',
    durationLabel: 'Terjadwal',
    status: 'Rencana',
    shiftTag: 'Terjadwal',
    notes: 'Negosiasi sewa end-cap display untuk promo Diskon 20%.',
    lat: -6.6122,
    lng: 106.8099,
  },
  {
    id: 'svis-10',
    repId: 'sup-rep-2',
    repName: 'Rina Amelia',
    outletName: 'Toko Sinar Depok',
    checkInTime: 'Rencana 15:00',
    durationLabel: 'Terjadwal',
    status: 'Rencana',
    shiftTag: 'Terjadwal',
    notes: 'Follow-up piutang jatuh tempo dan order awal bulan.',
    lat: -6.4021,
    lng: 106.8188,
  },
];

export const ROUTE_REPLAY_WAYPOINTS: RouteReplayWaypoint[] = [
  {
    id: 'wp-1',
    time: '09:10',
    label: 'Titik 1 · Kantor Area Bogor',
    address: 'Jl. Raya Pajajaran No. 88 (Absensi Masuk)',
    speedKmh: 0,
    lat: -6.595204,
    lng: 106.797781,
  },
  {
    id: 'wp-2',
    time: '09:45',
    label: 'Titik 2 · Toko Makmur Jaya',
    address: 'Jl. Raya Bogor No. 12',
    speedKmh: 22,
    lat: -6.597147,
    lng: 106.806039,
  },
  {
    id: 'wp-3',
    time: '10:35',
    label: 'Titik 3 · Toko Sentosa',
    address: 'Jl. Melati No. 10, Bogor Timur',
    speedKmh: 18,
    lat: -6.605421,
    lng: 106.81421,
  },
  {
    id: 'wp-4',
    time: '11:35',
    label: 'Titik 4 · Toko Sumber Rezeki',
    address: 'Jl. Pajajaran Indah No. 45, Cibinong',
    speedKmh: 28,
    lat: -6.57892,
    lng: 106.81945,
  },
];

export const ROUTE_REPLAY_BY_REP: Record<
  string,
  { totalDistanceKm: string; totalDurationLabel: string; waypoints: RouteReplayWaypoint[] }
> = {
  'sup-rep-1': {
    totalDistanceKm: '18,4 km',
    totalDurationLabel: '09:10 – 11:35',
    waypoints: ROUTE_REPLAY_WAYPOINTS,
  },
  'sup-rep-2': {
    totalDistanceKm: '14,2 km',
    totalDurationLabel: '08:05 – 11:20',
    waypoints: [
      {
        id: 'wp-r2-1',
        time: '08:05',
        label: 'Titik 1 · Kantor Cabang Depok',
        address: 'Jl. Margonda Raya No. 101',
        speedKmh: 0,
        lat: -6.3895,
        lng: 106.8295,
      },
      {
        id: 'wp-r2-2',
        time: '08:40',
        label: 'Titik 2 · Toko Abadi',
        address: 'Jl. Nusantara No. 18, Depok',
        speedKmh: 24,
        lat: -6.39121,
        lng: 106.82451,
      },
      {
        id: 'wp-r2-3',
        time: '09:25',
        label: 'Titik 3 · Toko Maju Bersama',
        address: 'Jl. Juanda No. 22, Depok',
        speedKmh: 19,
        lat: -6.385589,
        lng: 106.830711,
      },
      {
        id: 'wp-r2-4',
        time: '11:20',
        label: 'Titik 4 · Toko Sinar Depok',
        address: 'Jl. Tole Iskandar No. 54',
        speedKmh: 26,
        lat: -6.4021,
        lng: 106.8188,
      },
    ],
  },
  'sup-rep-3': {
    totalDistanceKm: '16,9 km',
    totalDurationLabel: '08:12 – 11:15',
    waypoints: [
      {
        id: 'wp-r3-1',
        time: '08:12',
        label: 'Titik 1 · Pos Cibinong',
        address: 'Jl. Mayor Oking No. 4',
        speedKmh: 0,
        lat: -6.4812,
        lng: 106.8541,
      },
      {
        id: 'wp-r3-2',
        time: '08:50',
        label: 'Titik 2 · Warung Berkah Mandiri',
        address: 'Jl. Alternatif Sentul No. 15',
        speedKmh: 30,
        lat: -6.58812,
        lng: 106.81292,
      },
      {
        id: 'wp-r3-3',
        time: '09:40',
        label: 'Titik 3 · Toko Sumber Rezeki',
        address: 'Jl. Pajajaran Indah No. 45',
        speedKmh: 25,
        lat: -6.57892,
        lng: 106.81945,
      },
    ],
  },
};

export interface SupervisorTeamGroup {
  id: string;
  teamName: string;
  area: string;
  memberCount: number;
  activeToday: number;
  visitsCount: number;
  realizationJt: number;
  targetJt: number;
  targetPct: number;
  leadName: string;
}

export const SUPERVISOR_TEAM_GROUPS: SupervisorTeamGroup[] = [
  {
    id: 'tg-bogor',
    teamName: 'Tim Bogor',
    area: 'Kota & Kab. Bogor',
    memberCount: 5,
    activeToday: 5,
    visitsCount: 34,
    realizationJt: 148.2,
    targetJt: 180.0,
    targetPct: 82.3,
    leadName: 'Budi Santoso',
  },
  {
    id: 'tg-depok',
    teamName: 'Tim Depok',
    area: 'Kota Depok',
    memberCount: 4,
    activeToday: 4,
    visitsCount: 27,
    realizationJt: 102.1,
    targetJt: 130.0,
    targetPct: 78.6,
    leadName: 'Rina Amelia',
  },
  {
    id: 'tg-tangerang',
    teamName: 'Tim Tangerang',
    area: 'Kota Tangerang',
    memberCount: 3,
    activeToday: 3,
    visitsCount: 21,
    realizationJt: 69.8,
    targetJt: 100.0,
    targetPct: 69.8,
    leadName: 'Siti Rahma',
  },
  {
    id: 'tg-bekasi',
    teamName: 'Tim Bekasi',
    area: 'Bekasi Barat & Timur',
    memberCount: 3,
    activeToday: 2,
    visitsCount: 16,
    realizationJt: 61.9,
    targetJt: 90.0,
    targetPct: 68.8,
    leadName: 'Fajar Hidayat',
  },
];

export const AREA_COVERAGE_STATS: AreaCoverageStat[] = [
  { id: 'ac-1', area: 'Area Bogor', outletCount: 248, coveragePct: 82.3, colorHex: '#10B981' },
  { id: 'ac-2', area: 'Area Depok', outletCount: 186, coveragePct: 78.5, colorHex: '#F59E0B' },
  { id: 'ac-3', area: 'Area Bekasi', outletCount: 210, coveragePct: 76.0, colorHex: '#348CB2' },
  { id: 'ac-4', area: 'Area Tangerang', outletCount: 175, coveragePct: 81.7, colorHex: '#0EA5E9' },
];

export const TEAM_TARGET_PROGRESS_BARS = [
  { team: 'Tim Bogor', pct: 82.3 },
  { team: 'Tim Depok', pct: 78.6 },
  { team: 'Tim Bekasi', pct: 71.9 },
  { team: 'Tim Tangerang', pct: 69.8 },
];

export const INITIAL_SUPERVISOR_TIMELINE: SupervisorTimelineEvent[] = [
  {
    id: 'tl-1',
    repId: 'sup-rep-1',
    time: '08:01',
    title: 'Absensi Masuk',
    subtitle: 'Kantor Area Bogor',
    kind: 'attendance',
    toneColor: '#10B981',
  },
  {
    id: 'tl-2',
    repId: 'sup-rep-1',
    time: '09:10',
    title: 'Kunjungan',
    subtitle: 'Toko Makmur Jaya',
    kind: 'visit',
    toneColor: '#348CB2',
  },
  {
    id: 'tl-3',
    repId: 'sup-rep-1',
    time: '10:05',
    title: 'Kunjungan',
    subtitle: 'Toko Sentosa',
    kind: 'visit',
    toneColor: '#348CB2',
  },
  {
    id: 'tl-4',
    repId: 'sup-rep-1',
    time: '11:10',
    title: 'Kunjungan',
    subtitle: 'Toko Sumber Rezeki',
    kind: 'visit',
    toneColor: '#348CB2',
  },
  {
    id: 'tl-5',
    repId: 'sup-rep-1',
    time: '13:25',
    title: 'Order',
    subtitle: 'ORD-20250624-001 · Rp 12.500.000',
    kind: 'order',
    toneColor: '#047857',
  },
  {
    id: 'tl-6',
    repId: 'sup-rep-1',
    time: '17:02',
    title: 'Absensi Pulang',
    subtitle: 'Kantor Area Bogor',
    kind: 'checkout',
    toneColor: '#1E293B',
  },
  {
    id: 'tl-7',
    repId: 'sup-rep-2',
    time: '08:05',
    title: 'Absensi Masuk',
    subtitle: 'Kantor Cabang Depok',
    kind: 'attendance',
    toneColor: '#10B981',
  },
  {
    id: 'tl-8',
    repId: 'sup-rep-2',
    time: '09:25',
    title: 'Kunjungan',
    subtitle: 'Toko Maju Bersama',
    kind: 'visit',
    toneColor: '#348CB2',
  },
];

export const INITIAL_SUPERVISOR_ALERTS: SupervisorAlertItem[] = [
  {
    id: 'alt-1',
    title: 'GPS Tidak Aktif',
    subtitle: 'Fajar Hidayat – 32 menit lalu',
    severity: 'Penting',
    repName: 'Fajar Hidayat',
    area: 'Area Bekasi',
    resolved: false,
    recommendedAction: 'Hubungi via telepon/Meet untuk verifikasi koneksi GPS sesi shift.',
  },
  {
    id: 'alt-2',
    title: 'Belum Kunjungan',
    subtitle: '2 outlet belum dikunjungi · Tim Depok – hari ini',
    severity: 'Follow-up',
    repName: 'Rina Amelia',
    area: 'Area Depok',
    resolved: false,
    recommendedAction: 'Jadwalkan ulang prioritas kunjungan sore di Google Calendar.',
  },
  {
    id: 'alt-3',
    title: 'Target Dibawah 70%',
    subtitle: 'Tim Bekasi – 66,8% · Periode bulan ini',
    severity: 'Penting',
    repName: 'Tim Bekasi',
    area: 'Area Bekasi',
    resolved: false,
    recommendedAction: 'Adakan sesi coaching target mingguan via Google Meet.',
  },
  {
    id: 'alt-4',
    title: 'Keterlambatan Absensi',
    subtitle: 'Siti Rahma – masuk 08:32',
    severity: 'Follow-up',
    repName: 'Siti Rahma',
    area: 'Area Tangerang',
    resolved: false,
    recommendedAction: 'Kirim pengingat kepatuhan jadwal shift 08:00 WIB.',
  },
  {
    id: 'alt-5',
    title: 'Durasi Kunjungan Anomali (> 90 Menit)',
    subtitle: 'Dedi Kurniawan · Area Cibinong – 18 menit lalu',
    severity: 'Penting',
    repName: 'Dedi Kurniawan',
    area: 'Area Bogor',
    resolved: false,
    recommendedAction: 'Cek status kendala negosiasi atau penginputan order di outlet.',
  },
  {
    id: 'alt-6',
    title: 'Outlet Prioritas Tanpa Reorder 14 Hari',
    subtitle: 'Minimart Harapan Baru · Area Tangerang',
    severity: 'Follow-up',
    repName: 'Siti Rahma',
    area: 'Area Tangerang',
    resolved: false,
    recommendedAction: 'Tawarkan paket promo Diskon 20% saat kunjungan pukul 13:30.',
  },
];

export const SUPERVISOR_REPORTS_LIST = [
  {
    id: 'srep-perf',
    title: 'Laporan Performa Tim Harian & Bulanan',
    subtitle: 'Pencapaian omzet, konversi order, dan efektivitas kunjungan',
    metric: 'Rp 382 jt / Rp 500 jt',
  },
  {
    id: 'srep-visit',
    title: 'Laporan Kunjungan & Kepatuhan Rute GPS',
    subtitle: 'Durasi per outlet, bukti check-in, dan deviasi rute',
    metric: '98 kunjungan (+14,6%)',
  },
  {
    id: 'srep-shift',
    title: 'Laporan Shift & Absensi Geofence',
    subtitle: 'Rekap tepat waktu, keterlambatan, dan status shift tim',
    metric: '12 masuk · 1 terlambat · 2 belum',
  },
];

export const PRINCIPAL_CAMPAIGN_ANALYTICS = [
  {
    campaignId: 'camp-1',
    name: 'Diskon 20% Minuman Energi',
    targetRp: 1000000000,
    achievedRp: 842500000,
    upliftPct: 24.6,
    participatingDistributors: 22,
  },
  {
    campaignId: 'camp-2',
    name: 'Beli 5 Gratis 1 Biskuit',
    targetRp: 750000000,
    achievedRp: 618000000,
    upliftPct: 18.4,
    participatingDistributors: 19,
  },
  {
    campaignId: 'camp-3',
    name: 'Point x2 Semua Produk',
    targetRp: 600000000,
    achievedRp: 120000000,
    upliftPct: 9.2,
    participatingDistributors: 16,
  },
];

