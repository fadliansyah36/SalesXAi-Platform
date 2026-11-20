export interface Outlet {
  id: string;
  name: string;
  city: string;
  address: string;
  distanceKm: number;
  isPriority: boolean;
  visitToday: boolean;
  status: 'Aktif' | 'Nonaktif';
  category: string;
  picName: string;
  phone: string;
  email: string;
  lat: number;
  lng: number;
  lastOrderTotal: number;
  lastVisitDate: string;
  branchId?: string;
  territoryId?: string;
}

export interface Product {
  sku: string;
  name: string;
  category: 'Minuman' | 'Makanan' | 'Perawatan' | 'Lainnya';
  unit: string;
  price: number;
  stock: number;
  tag: 'Best Seller' | 'Promo' | 'Baru';
  promoDiscountPct?: number;
  accentHex: string;
}

export interface OrderItem {
  sku: string;
  name: string;
  unitPrice: number;
  qty: number;
}

export interface OrderRecord {
  id: string;
  outletId: string;
  outletName: string;
  city: string;
  dateLabel: string;
  status: 'Diproses' | 'Dikirim' | 'Selesai' | 'Batal';
  items: OrderItem[];
  subtotal: number;
  discount: number;
  total: number;
}

export type LeadStatus =
  | 'Baru'
  | 'Dihubungi'
  | 'Tertarik'
  | 'Follow-up'
  | 'Konversi'
  | 'Dibatalkan';

export interface LeadRecord {
  id: string;
  placeId?: string;
  businessName: string;
  picName: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  lat: number;
  lng: number;
  status: LeadStatus;
  productCategory: 'Minuman' | 'Makanan' | 'Perawatan' | 'Lainnya';
  lastInteractionDate: string; // YYYY-MM-DD
  estimatedValue: number;
  source: 'CRM' | 'Google Maps';
  rating?: number;
  userRatingCount?: number;
  websiteUri?: string;
  googleMapsUri?: string;
  notes: string;
}

export interface RewardItem {
  id: string;
  title: string;
  category: 'Voucher' | 'Insentif Tunai' | 'Merchandise';
  pointsCost: number;
  description: string;
  stockLabel: string;
}

export interface RewardLedgerEntry {
  id: string;
  title: string;
  dateLabel: string;
  pointsDelta: number;
  type: 'Perolehan' | 'Penukaran';
}

export interface VisitItem {
  id: string;
  outletId: string;
  outletName: string;
  city: string;
  address: string;
  timeRange: string;
  dateKey: 'today' | 'tomorrow' | 'thursday';
  status: 'Selesai' | 'Sedang Berjalan' | 'Menunggu';
  isPriority: boolean;
  lat: number;
  lng: number;
  notes?: string;
  photoCount?: number;
}

export interface PromotionItem {
  id: string;
  title: string;
  subtitle: string;
  validUntil: string;
  type: 'Promo' | 'Campaign';
  status: 'Aktif' | 'Berakhir';
  discountRule: string;
  terms?: string[];
  targetSku?: string;
}

export interface NotificationItem {
  id: string;
  title: string;
  detail: string;
  timeAgo: string;
  category: 'Aktivitas' | 'Sistem';
  read: boolean;
}

export const SALES_REP_PROFILE = {
  name: 'Budi Santoso',
  role: 'Sales Representative',
  area: 'Area Bogor',
  officeName: 'Kantor Area Bogor',
  officeLat: -6.595204,
  officeLng: 106.797781,
  geofenceRadiusM: 100,
  monthlyTarget: 100_000_000,
  monthlyRealized: 62_500_000,
  shiftSchedule: '08:00 – 17:00 WIB',
};

export const INITIAL_OUTLETS: Outlet[] = [
  {
    id: 'out-1',
    name: 'Toko Makmur Jaya',
    city: 'Kota Bogor',
    address: 'Jl. Raya Bogor No. 12, Bogor Tengah',
    distanceKm: 2.4,
    isPriority: true,
    visitToday: true,
    status: 'Aktif',
    category: 'General Trade',
    picName: 'Bapak Hendra',
    phone: '0812-3456-7890',
    email: 'toko.makmurjaya@example.com',
    lat: -6.597147,
    lng: 106.806039,
    lastOrderTotal: 8_750_000,
    lastVisitDate: '24 Jun 2025',
  },
  {
    id: 'out-2',
    name: 'Toko Sentosa',
    city: 'Kota Bogor',
    address: 'Jl. Melati No. 10, Bogor Timur',
    distanceKm: 3.1,
    isPriority: true,
    visitToday: true,
    status: 'Aktif',
    category: 'General Trade',
    picName: 'Ibu Ratna Sari',
    phone: '0813-9988-1122',
    email: 'sentosa.outlet@example.com',
    lat: -6.605421,
    lng: 106.81421,
    lastOrderTotal: 12_500_000,
    lastVisitDate: '24 Jun 2025',
  },
  {
    id: 'out-3',
    name: 'Toko Sumber Rezeki',
    city: 'Kab. Bogor',
    address: 'Jl. Pajajaran Indah No. 45, Cibinong',
    distanceKm: 6.8,
    isPriority: false,
    visitToday: true,
    status: 'Aktif',
    category: 'Semi Grosir',
    picName: 'Bapak Agus',
    phone: '0815-7700-3344',
    email: 'sumber.rezeki@example.com',
    lat: -6.57892,
    lng: 106.81945,
    lastOrderTotal: 5_200_000,
    lastVisitDate: '23 Jun 2025',
  },
  {
    id: 'out-4',
    name: 'Toko Maju Bersama',
    city: 'Kota Depok',
    address: 'Jl. Margonda Raya No. 88, Depok',
    distanceKm: 8.2,
    isPriority: true,
    visitToday: true,
    status: 'Aktif',
    category: 'Modern Trade',
    picName: 'Ibu Dewi Lestari',
    phone: '0817-2233-4455',
    email: 'majubersama@example.com',
    lat: -6.55421,
    lng: 106.8019,
    lastOrderTotal: 15_200_000,
    lastVisitDate: '22 Jun 2025',
  },
  {
    id: 'out-5',
    name: 'Toko Abadi',
    city: 'Kota Bogor',
    address: 'Jl. Siliwangi No. 27, Bogor Selatan',
    distanceKm: 9.1,
    isPriority: false,
    visitToday: true,
    status: 'Aktif',
    category: 'General Trade',
    picName: 'Bapak Darmawan',
    phone: '0818-5566-7788',
    email: 'toko.abadi@example.com',
    lat: -6.61842,
    lng: 106.80912,
    lastOrderTotal: 6_450_000,
    lastVisitDate: '21 Jun 2025',
  },
  {
    id: 'out-6',
    name: 'Minimart Harapan Baru',
    city: 'Kota Bogor',
    address: 'Jl. Ahmad Yani No. 62, Tanah Sareal',
    distanceKm: 4.5,
    isPriority: true,
    visitToday: false,
    status: 'Aktif',
    category: 'Modern Trade',
    picName: 'Ibu Maya Putri',
    phone: '0819-3344-5566',
    email: 'harapanbaru@example.com',
    lat: -6.57411,
    lng: 106.79245,
    lastOrderTotal: 9_800_000,
    lastVisitDate: '20 Jun 2025',
  },
];

export const INITIAL_PRODUCTS: Product[] = [
  {
    sku: 'SX-MNM-001',
    name: 'Minuman Energi 250 ml',
    category: 'Minuman',
    unit: 'pcs',
    price: 5000,
    stock: 480,
    tag: 'Best Seller',
    promoDiscountPct: 20,
    accentHex: '#F97316',
  },
  {
    sku: 'SX-BSK-002',
    name: 'Biskuit Cokelat 100 g',
    category: 'Makanan',
    unit: 'pcs',
    price: 8500,
    stock: 310,
    tag: 'Promo',
    accentHex: '#B45309',
  },
  {
    sku: 'SX-PRW-003',
    name: 'Sabun Wangi 80 g',
    category: 'Perawatan',
    unit: 'pcs',
    price: 4000,
    stock: 620,
    tag: 'Best Seller',
    accentHex: '#10B981',
  },
  {
    sku: 'SX-MNM-004',
    name: 'Teh Hijau Botol 350 ml',
    category: 'Minuman',
    unit: 'pcs',
    price: 4500,
    stock: 540,
    tag: 'Baru',
    accentHex: '#047857',
  },
  {
    sku: 'SX-MKN-005',
    name: 'Keripik Kentang 75 g',
    category: 'Makanan',
    unit: 'pcs',
    price: 7000,
    stock: 225,
    tag: 'Best Seller',
    accentHex: '#F59E0B',
  },
  {
    sku: 'SX-PRW-006',
    name: 'Shampo Herbal 170 ml',
    category: 'Perawatan',
    unit: 'pcs',
    price: 16500,
    stock: 150,
    tag: 'Baru',
    accentHex: '#348CB2',
  },
  {
    sku: 'SX-LNY-007',
    name: 'Tisu Lipat Kemasan 200 Lembar',
    category: 'Lainnya',
    unit: 'pack',
    price: 9500,
    stock: 410,
    tag: 'Promo',
    accentHex: '#6366F1',
  },
];

export const INITIAL_VISITS: VisitItem[] = [
  {
    id: 'vis-1',
    outletId: 'out-1',
    outletName: 'Toko Makmur Jaya',
    city: 'Kota Bogor',
    address: 'Jl. Raya Bogor No. 12',
    timeRange: '08:00 – 09:00',
    dateKey: 'today',
    status: 'Selesai',
    isPriority: true,
    lat: -6.597147,
    lng: 106.806039,
    notes: 'Display produk sesuai planogram. Stok Minuman Energi aman untuk 5 hari.',
    photoCount: 2,
  },
  {
    id: 'vis-2',
    outletId: 'out-2',
    outletName: 'Toko Sentosa',
    city: 'Kota Bogor',
    address: 'Jl. Melati No. 10',
    timeRange: '09:15 – 10:00',
    dateKey: 'today',
    status: 'Sedang Berjalan',
    isPriority: true,
    lat: -6.605421,
    lng: 106.81421,
    notes: 'Siap melakukan reorder SKU Best Seller dan pasang materi promo.',
    photoCount: 1,
  },
  {
    id: 'vis-3',
    outletId: 'out-3',
    outletName: 'Toko Sumber Rezeki',
    city: 'Kab. Bogor',
    address: 'Jl. Pajajaran Indah No. 45',
    timeRange: '10:30 – 11:15',
    dateKey: 'today',
    status: 'Menunggu',
    isPriority: false,
    lat: -6.57892,
    lng: 106.81945,
  },
  {
    id: 'vis-4',
    outletId: 'out-4',
    outletName: 'Toko Maju Bersama',
    city: 'Kota Depok',
    address: 'Jl. Margonda Raya No. 88',
    timeRange: '13:00 – 14:00',
    dateKey: 'today',
    status: 'Menunggu',
    isPriority: true,
    lat: -6.55421,
    lng: 106.8019,
  },
  {
    id: 'vis-5',
    outletId: 'out-5',
    outletName: 'Toko Abadi',
    city: 'Kota Bogor',
    address: 'Jl. Siliwangi No. 27',
    timeRange: '14:15 – 15:00',
    dateKey: 'today',
    status: 'Menunggu',
    isPriority: false,
    lat: -6.61842,
    lng: 106.80912,
  },
  {
    id: 'vis-6',
    outletId: 'out-6',
    outletName: 'Minimart Harapan Baru',
    city: 'Kota Bogor',
    address: 'Jl. Ahmad Yani No. 62',
    timeRange: '09:00 – 10:00',
    dateKey: 'tomorrow',
    status: 'Menunggu',
    isPriority: true,
    lat: -6.57411,
    lng: 106.79245,
  },
  {
    id: 'vis-7',
    outletId: 'out-1',
    outletName: 'Toko Makmur Jaya',
    city: 'Kota Bogor',
    address: 'Jl. Raya Bogor No. 12',
    timeRange: '08:30 – 09:30',
    dateKey: 'thursday',
    status: 'Menunggu',
    isPriority: true,
    lat: -6.597147,
    lng: 106.806039,
  },
  {
    id: 'vis-8',
    outletId: 'out-4',
    outletName: 'Toko Maju Bersama',
    city: 'Kota Depok',
    address: 'Jl. Margonda Raya No. 88',
    timeRange: '11:00 – 12:00',
    dateKey: 'thursday',
    status: 'Menunggu',
    isPriority: true,
    lat: -6.55421,
    lng: 106.8019,
  },
];

export const INITIAL_ORDERS: OrderRecord[] = [
  {
    id: 'ORD-20250624-001',
    outletId: 'out-2',
    outletName: 'Toko Sentosa',
    city: 'Kota Bogor',
    dateLabel: '24 Jun 2025, 10:24',
    status: 'Selesai',
    items: [
      { sku: 'SX-MNM-001', name: 'Minuman Energi 250 ml', unitPrice: 5000, qty: 1500 },
      { sku: 'SX-BSK-002', name: 'Biskuit Cokelat 100 g', unitPrice: 8500, qty: 600 },
    ],
    subtotal: 12_600_000,
    discount: 100_000,
    total: 12_500_000,
  },
  {
    id: 'ORD-20250623-006',
    outletId: 'out-1',
    outletName: 'Toko Makmur Jaya',
    city: 'Kota Bogor',
    dateLabel: '23 Jun 2025, 14:10',
    status: 'Diproses',
    items: [
      { sku: 'SX-BSK-002', name: 'Biskuit Cokelat 100 g', unitPrice: 8500, qty: 1000 },
      { sku: 'SX-PRW-003', name: 'Sabun Wangi 80 g', unitPrice: 4000, qty: 200 },
    ],
    subtotal: 9_300_000,
    discount: 550_000,
    total: 8_750_000,
  },
  {
    id: 'ORD-20250623-005',
    outletId: 'out-3',
    outletName: 'Toko Sumber Rezeki',
    city: 'Kab. Bogor',
    dateLabel: '23 Jun 2025, 11:30',
    status: 'Selesai',
    items: [
      { sku: 'SX-MNM-004', name: 'Teh Hijau Botol 350 ml', unitPrice: 4500, qty: 1200 },
    ],
    subtotal: 5_400_000,
    discount: 200_000,
    total: 5_200_000,
  },
  {
    id: 'ORD-20250622-003',
    outletId: 'out-4',
    outletName: 'Toko Maju Bersama',
    city: 'Kota Depok',
    dateLabel: '22 Jun 2025, 16:00',
    status: 'Batal',
    items: [
      { sku: 'SX-PRW-006', name: 'Shampo Herbal 170 ml', unitPrice: 16500, qty: 920 },
    ],
    subtotal: 15_180_000,
    discount: 0,
    total: 15_200_000,
  },
];

export const INITIAL_PROMOTIONS: PromotionItem[] = [
  {
    id: 'promo-1',
    title: 'Diskon 20% Minuman Energi',
    subtitle: 'Potongan langsung harga distributor untuk pembelian minimal 5 karton.',
    validUntil: '31 Okt 2026',
    type: 'Promo',
    status: 'Aktif',
    discountRule: 'Diskon 20% SKU SX-MNM-001',
    targetSku: 'SX-MNM-001',
    terms: [
      'Berlaku untuk seluruh outlet General Trade & Modern Trade Area Bogor.',
      'Potongan otomatis dihitung oleh sistem SmartOrder.',
      'Dapat digabungkan dengan program akumulasi poin SmartReward.',
    ],
  },
  {
    id: 'promo-2',
    title: 'Beli 5 Gratis 1 Biskuit',
    subtitle: 'Bonus 1 karton Biskuit Cokelat 100 g setiap pembelian 5 karton.',
    validUntil: '31 Okt 2026',
    type: 'Promo',
    status: 'Aktif',
    discountRule: 'Bonus unit otomatis via SmartOrder',
    targetSku: 'SX-BSK-002',
    terms: [
      'Minimal pemesanan 5 karton SKU SX-BSK-002 dalam satu faktur.',
      'Bonus langsung muncul pada dokumen pengiriman distributor.',
    ],
  },
  {
    id: 'promo-3',
    title: 'Point x2 Semua Produk',
    subtitle: 'Gandakan poin SmartReward untuk seluruh outlet kategori General Trade.',
    validUntil: '31 Okt 2026',
    type: 'Promo',
    status: 'Aktif',
    discountRule: '2x Ledger Points SmartReward',
    targetSku: 'SX-PRW-003',
    terms: [
      'Poin dikreditkan otomatis setelah status order menjadi Selesai.',
      'Berlaku untuk seluruh transaksi tanpa minimum pembelian.',
    ],
  },
  {
    id: 'camp-1',
    title: 'Kampanye Retail Bogor Q4',
    subtitle: 'Program aktivasi rak display prioritas untuk 32 outlet Area Bogor.',
    validUntil: '30 Nov 2026',
    type: 'Campaign',
    status: 'Aktif',
    discountRule: 'Rebate 5% untuk bukti foto rak tervalidasi',
    targetSku: 'SX-MNM-001',
    terms: [
      'Wajib unggah minimal 2 foto rak display melalui fitur Check-in Kunjungan.',
      'Validasi foto dilakukan otomatis berdasarkan timestamp & koordinat GPS.',
    ],
  },
  {
    id: 'camp-2',
    title: 'Peluncuran Teh Hijau 350 ml',
    subtitle: 'Materi poster promosi dan paket tester untuk outlet Modern Trade.',
    validUntil: '15 Des 2026',
    type: 'Campaign',
    status: 'Aktif',
    discountRule: 'Dukungan aset AI Content Studio',
    targetSku: 'SX-MNM-004',
    terms: [
      'Outlet berhak mendapatkan poster cetak & konten WhatsApp dari Content Studio.',
      'Target penetrasi minimal 15 outlet baru di Kota & Kab. Bogor.',
    ],
  },
];

export const INITIAL_NOTIFICATIONS: NotificationItem[] = [
  {
    id: 'notif-1',
    title: 'Order Terkonfirmasi',
    detail: 'ORD-20250624-001 untuk Toko Sentosa telah diterima dan diproses distributor.',
    timeAgo: '12 menit yang lalu',
    category: 'Aktivitas',
    read: false,
  },
  {
    id: 'notif-2',
    title: 'Pengingat Kunjungan',
    detail: 'Jadwal kunjungan Toko Maju Bersama (13:00 WIB) dengan rute teroptimasi.',
    timeAgo: '30 menit yang lalu',
    category: 'Aktivitas',
    read: false,
  },
  {
    id: 'notif-3',
    title: 'Target Mingguan',
    detail: 'Pencapaian realisasi bulan ini berada di 62,5% (Rp 62.500.000).',
    timeAgo: '1 jam yang lalu',
    category: 'Sistem',
    read: true,
  },
  {
    id: 'notif-4',
    title: 'Promo Baru Aktif',
    detail: 'Diskon 25% Minuman Energi & materi AI Content Studio siap dibagikan ke outlet.',
    timeAgo: '2 jam yang lalu',
    category: 'Sistem',
    read: true,
  },
];

export const LANDING_FAQ_ITEMS = [
  {
    q: 'Apa itu SalesX-Ai?',
    a: 'SalesX-Ai adalah platform operasional penjualan dan distribusi berbasis AI yang menghubungkan tim sales lapangan, outlet, pemesanan (SmartOrder), program loyalitas (SmartReward), pelacakan GPS saat jam kerja, serta asisten Staff AI dalam satu ekosistem terintegrasi.',
  },
  {
    q: 'Apa saja fitur utamanya?',
    a: 'Fitur utama meliputi SmartTeam (absensi geofence, jadwal & bukti kunjungan, rute GPS real-time), SmartOrder (katalog SKU, validasi harga & stok deterministik, riwayat order), SmartReward (poin & insentif), Staff AI SalesX-Ai, AI Content Studio, serta integrasi Google Maps & Google Workspace.',
  },
  {
    q: 'Bagaimana sistem Staff AI bekerja?',
    a: 'Staff AI membaca konteks data bisnis aktual seperti target bulanan, riwayat order, dan daftar outlet untuk menyarankan prioritas kunjungan, analisis performa, serta draf konten promosi. Seluruh harga dan transaksi tetap dikontrol oleh aturan bisnis deterministik.',
  },
  {
    q: 'Apakah ada biaya tambahan?',
    a: 'Paket Starter, Growth, dan Business sudah mencakup seluruh modul operasional sesuai kapasitas paket. Biaya tambahan hanya berlaku apabila perusahaan meminta kustomisasi integrasi ERP khusus atau volume render video skala enterprise.',
  },
  {
    q: 'Bisakah digunakan di banyak cabang?',
    a: 'Ya. Arsitektur multi-tenant SalesX-Ai mendukung hierarki perusahaan, banyak cabang, wilayah/teritori, tim supervisor, hingga jaringan distributor dan principal dalam satu sumber data terpusat.',
  },
  {
    q: 'Bagaimana cara berlangganan?',
    a: 'Anda dapat mengisi Formulir Pendaftaran Langganan di bagian bawah halaman ini dengan memilih paket Starter, Growth, Business, atau Enterprise, lalu tim kami akan mengaktifkan workspace tenant Anda.',
  },
  {
    q: 'Apakah tersedia demo produk?',
    a: 'Tersedia. Klik tombol Jadwalkan Demo pada formulir di bawah atau langsung coba alur Sales Portal PWA melalui tombol Masuk Sales Portal.',
  },
];

export const MONTHLY_REALIZATION_DATA = [
  { month: 'Jan', value: 42 },
  { month: 'Feb', value: 48 },
  { month: 'Mar', value: 53 },
  { month: 'Apr', value: 51 },
  { month: 'Mei', value: 59 },
  { month: 'Jun', value: 62.5 },
];

export const PERFORMANCE_BY_PERIOD: Record<
  string,
  {
    target: number;
    realized: number;
    ordersLabel: string;
    ordersGrowth: string;
    visitsLabel: string;
    visitsGrowth: string;
    coverageLabel: string;
    coverageGrowth: string;
    categories: Array<{ name: string; pct: number }>;
  }
> = {
  'Jun 2025': {
    target: 100_000_000,
    realized: 62_500_000,
    ordersLabel: '24 transaksi',
    ordersGrowth: '+18,2%',
    visitsLabel: '98 outlet',
    visitsGrowth: '+12,5%',
    coverageLabel: '81,7%',
    coverageGrowth: '+4,6%',
    categories: [
      { name: 'Minuman', pct: 82.3 },
      { name: 'Makanan', pct: 76.0 },
      { name: 'Perawatan', pct: 69.8 },
      { name: 'Lainnya', pct: 71.5 },
    ],
  },
  'Mei 2025': {
    target: 95_000_000,
    realized: 88_350_000,
    ordersLabel: '31 transaksi',
    ordersGrowth: '+11,4%',
    visitsLabel: '112 outlet',
    visitsGrowth: '+8,9%',
    coverageLabel: '89,2%',
    coverageGrowth: '+6,1%',
    categories: [
      { name: 'Minuman', pct: 94.0 },
      { name: 'Makanan', pct: 88.5 },
      { name: 'Perawatan', pct: 84.0 },
      { name: 'Lainnya', pct: 79.2 },
    ],
  },
};

export const INITIAL_REWARD_CATALOG: RewardItem[] = [
  {
    id: 'rew-1',
    title: 'Saldo E-Wallet Insentif Rp 250.000',
    category: 'Insentif Tunai',
    pointsCost: 5000,
    description: 'Pencairan insentif pencapaian target mingguan ke dompet digital.',
    stockLabel: 'Tersedia',
  },
  {
    id: 'rew-2',
    title: 'Voucher BBM Operasional Rp 150.000',
    category: 'Voucher',
    pointsCost: 3000,
    description: 'Voucher bahan bakar untuk mobilitas kunjungan area Bogor & Depok.',
    stockLabel: 'Tersedia',
  },
  {
    id: 'rew-3',
    title: 'Jaket Lapangan Eksklusif SalesX-Ai',
    category: 'Merchandise',
    pointsCost: 4500,
    description: 'Jaket tahan air ringan edisi resmi tim SalesX-Ai.',
    stockLabel: 'Stok 12 pcs',
  },
];

export const INITIAL_REWARD_LEDGER: RewardLedgerEntry[] = [
  {
    id: 'led-1',
    title: 'Order Terkonfirmasi ORD-20250624-001 (2x Poin)',
    dateLabel: '24 Jun 2025, 10:25',
    pointsDelta: 2500,
    type: 'Perolehan',
  },
  {
    id: 'led-2',
    title: 'Check-in Bukti Display Kampanye Bogor Q4',
    dateLabel: '24 Jun 2025, 09:05',
    pointsDelta: 1200,
    type: 'Perolehan',
  },
  {
    id: 'led-3',
    title: 'Target Mingguan 60%+ Tercapai',
    dateLabel: '22 Jun 2025, 17:15',
    pointsDelta: 4000,
    type: 'Perolehan',
  },
];

export const INITIAL_LEADS: LeadRecord[] = [
  {
    id: 'lead-1',
    placeId: 'ChIJ_sx_lead_01',
    businessName: 'Minimarket Berkah Jaya',
    picName: 'Bapak Ridwan',
    phone: '0812-8890-1122',
    email: 'berkah.jaya@example.com',
    address: 'Jl. Pajajaran No. 104, Bogor Timur',
    city: 'Kota Bogor',
    lat: -6.6012,
    lng: 106.8095,
    status: 'Tertarik',
    productCategory: 'Minuman',
    lastInteractionDate: '2025-06-24',
    estimatedValue: 8_500_000,
    source: 'CRM',
    rating: 4.7,
    userRatingCount: 128,
    notes: 'Tertarik paket Minuman Energi 250 ml diskon 20%, minta dikirim penawaran via Gmail.',
  },
  {
    id: 'lead-2',
    placeId: 'ChIJ_sx_lead_02',
    businessName: 'Warung Sembako Bu Dewi',
    picName: 'Ibu Dewi Anggraini',
    phone: '0813-4455-6677',
    email: 'sembako.dewi@example.com',
    address: 'Jl. Raya Tajur No. 55, Bogor Selatan',
    city: 'Kota Bogor',
    lat: -6.6251,
    lng: 106.8241,
    status: 'Follow-up',
    productCategory: 'Makanan',
    lastInteractionDate: '2025-06-23',
    estimatedValue: 5_200_000,
    source: 'CRM',
    rating: 4.5,
    userRatingCount: 64,
    notes: 'Perlu follow-up jadwal kirim tester Biskuit Cokelat 100 g minggu ini.',
  },
  {
    id: 'lead-3',
    businessName: 'Apotek & Swalayan Sehat Mandiri',
    picName: 'Ibu Nadia Kusuma',
    phone: '0811-7788-9900',
    email: 'procurement@sehatmandiri.example.com',
    address: 'Jl. Margonda Raya No. 210, Depok',
    city: 'Kota Depok',
    lat: -6.3792,
    lng: 106.8315,
    status: 'Baru',
    productCategory: 'Perawatan',
    lastInteractionDate: '2025-06-24',
    estimatedValue: 11_000_000,
    source: 'Google Maps',
    rating: 4.8,
    userRatingCount: 215,
    websiteUri: 'https://sehatmandiri.example.com',
    notes: 'Prospek modern retail dengan trafik tinggi untuk lini Shampo Herbal & Sabun Wangi.',
  },
  {
    id: 'lead-4',
    businessName: 'Kafe & Kopi Tepi Kebun',
    picName: 'Mas Yoga Pratama',
    phone: '0856-9090-3311',
    email: 'halo@tepikebun.example.com',
    address: 'Jl. Surya Kencana No. 78, Bogor Tengah',
    city: 'Kota Bogor',
    lat: -6.6059,
    lng: 106.7988,
    status: 'Dihubungi',
    productCategory: 'Minuman',
    lastInteractionDate: '2025-06-21',
    estimatedValue: 4_300_000,
    source: 'Google Maps',
    rating: 4.6,
    userRatingCount: 342,
    notes: 'Sudah dihubungi via WhatsApp, menunggu konfirmasi stok chiller untuk Teh Hijau 350 ml.',
  },
  {
    id: 'lead-5',
    businessName: 'Toko Grosir Sinar Harapan',
    picName: 'Bapak Gunawan',
    phone: '0819-2211-4433',
    email: 'sinar.harapan@example.com',
    address: 'Jl. Raya Jakarta-Bogor Km. 42, Cibinong',
    city: 'Kab. Bogor',
    lat: -6.4841,
    lng: 106.8421,
    status: 'Konversi',
    productCategory: 'Makanan',
    lastInteractionDate: '2025-06-19',
    estimatedValue: 16_400_000,
    source: 'CRM',
    rating: 4.4,
    userRatingCount: 89,
    notes: 'Berhasil konversi ke mitra SmartOrder dengan PO awal Rp 16,4 juta.',
  },
  {
    id: 'lead-6',
    businessName: 'Kios Kebutuhan Rumah Tangga Amanah',
    picName: 'Ibu Siti Aminah',
    phone: '0852-1122-8899',
    email: 'kios.amanah@example.com',
    address: 'Jl. Merdeka No. 19, Bogor Tengah',
    city: 'Kota Bogor',
    lat: -6.5882,
    lng: 106.7892,
    status: 'Dibatalkan',
    productCategory: 'Lainnya',
    lastInteractionDate: '2025-06-14',
    estimatedValue: 2_800_000,
    source: 'CRM',
    notes: 'Sedang renovasi toko hingga bulan depan, jadwalkan ulang di Juli.',
  },
];

export function formatRupiah(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(amount);
}

/* ============================================================================
 * COMPANY PORTAL DATA & TYPES (PRD Sections 4.1, 6, 7, 10, 12)
 * ============================================================================ */
export interface BranchItem {
  id: string;
  name: string;
  city: string;
  address: string;
  managerName: string;
  phone: string;
  salesCount: number;
  outletCount: number;
  monthlyTarget: number;
  monthlyRealized: number;
  status: 'Aktif' | 'Nonaktif';
  lat: number;
  lng: number;
}

export interface TerritoryItem {
  id: string;
  name: string;
  branchName: string;
  branchId?: string;
  outletCount: number;
  salesAssigned: number;
  coveragePct: number;
  colorHex: string;
  lat: number;
  lng: number;
  status?: 'Aktif' | 'Nonaktif';
}

export interface TeamMemberItem {
  id: string;
  userId?: string;
  teamId?: string;
  territoryId?: string;
  managerUserId?: string;
  name: string;
  role: 'Direktur Operasional' | 'Area Manager' | 'Supervisor' | 'Sales Rep';
  area: string;
  branchId: string;
  phone: string;
  status: 'Online' | 'Offline';
  currentLocation: string;
  speedKmh: number;
  accuracyM: number;
  lastUpdate: string;
  lat: number;
  lng: number;
  monthlyOrderValue: number;
  visitsToday: number;
  targetVisits: number;
}

export interface CompanyOrderItem {
  id: string;
  outletId: string;
  outletName: string;
  branchName: string;
  salesName: string;
  dateLabel: string;
  total: number;
  status: 'Pending' | 'Diproses' | 'Dikirim' | 'Selesai' | 'Batal';
  itemsCount: number;
  paymentStatus: 'Lunas' | 'Piutang';
  cancelReason?: string;
}

export interface CompanyAttendanceItem {
  id: string;
  memberId: string;
  staffName: string;
  role: string;
  branchName: string;
  officeName: string;
  shiftTime: string;
  clockInTime: string;
  clockOutTime: string;
  geofenceStatus: 'Dalam Radius' | 'Luar Radius' | 'Belum Absen';
  distanceM: number;
  status: 'Hadir' | 'Terlambat' | 'Belum Absen';
  notes: string;
}

export interface CompanyAuditLogEntry {
  id: string;
  actorName: string;
  action: string;
  targetStaff: string;
  timestamp: string;
  ipLabel: string;
}

export interface CompanyIntegrationSetting {
  id: string;
  title: string;
  subtitle: string;
  category: 'api' | 'erp' | 'inventory' | 'ai' | 'notifications' | 'external';
  connected: boolean;
  lastSync: string;
}

export const COMPANY_PROFILE = {
  name: 'PT Maju Distribusi',
  email: 'admin@majudistribusi.co.id',
  hqCity: 'Kota Bogor',
  plan: 'Growth (Multi-Cabang)',
  activeSalesCount: 42,
  activeOutletsCount: 1045,
  outletCoveragePct: 83.8,
  monthlyTargetOrder: 600_000_000,
  monthlyRealizedOrder: 625_800_000,
  monthlyTotalOrders: 1248,
  receivables: 48_200_000,
  paymentsReceived: 577_600_000,
};

export const INITIAL_BRANCHES: BranchItem[] = [
  {
    id: 'br-1',
    name: 'Kantor Pusat',
    city: 'Kota Bogor',
    address: 'Jl. Raya Pajajaran No. 88, Bogor Tengah',
    managerName: 'Hendra Wijaya',
    phone: '0251-8321-400',
    salesCount: 14,
    outletCount: 312,
    monthlyTarget: 180_000_000,
    monthlyRealized: 202_500_000,
    status: 'Aktif',
    lat: -6.595204,
    lng: 106.797781,
  },
  {
    id: 'br-2',
    name: 'Cabang Bandung',
    city: 'Kota Bandung',
    address: 'Jl. Soekarno-Hatta No. 412, Bandung',
    managerName: 'Rizky Ramadhan',
    phone: '022-7312-900',
    salesCount: 10,
    outletCount: 248,
    monthlyTarget: 150_000_000,
    monthlyRealized: 154_800_000,
    status: 'Aktif',
    lat: -6.917464,
    lng: 107.619123,
  },
  {
    id: 'br-3',
    name: 'Cabang Bekasi',
    city: 'Kota Bekasi',
    address: 'Jl. Ahmad Yani No. 25, Bekasi Selatan',
    managerName: 'Dian Permata',
    phone: '021-8890-120',
    salesCount: 8,
    outletCount: 205,
    monthlyTarget: 140_000_000,
    monthlyRealized: 138_040_000,
    status: 'Aktif',
    lat: -6.23827,
    lng: 106.975573,
  },
  {
    id: 'br-4',
    name: 'Cabang Tangerang',
    city: 'Kota Tangerang',
    address: 'Jl. Jenderal Sudirman No. 19, Cikokol',
    managerName: 'Fajar Nugroho',
    phone: '021-5578-330',
    salesCount: 6,
    outletCount: 162,
    monthlyTarget: 130_000_000,
    monthlyRealized: 130_460_000,
    status: 'Aktif',
    lat: -6.178306,
    lng: 106.631889,
  },
  {
    id: 'br-5',
    name: 'Cabang Depok',
    city: 'Kota Depok',
    address: 'Jl. Margonda Raya No. 142, Beji',
    managerName: 'Siti Rahma',
    phone: '021-7721-550',
    salesCount: 4,
    outletCount: 118,
    monthlyTarget: 95_000_000,
    monthlyRealized: 96_800_000,
    status: 'Aktif',
    lat: -6.385589,
    lng: 106.830711,
  },
];

export const INITIAL_TERRITORIES: TerritoryItem[] = [
  {
    id: 'ter-1',
    name: 'Teritori Bogor',
    branchName: 'Kantor Pusat',
    outletCount: 12,
    salesAssigned: 14,
    coveragePct: 88.4,
    colorHex: '#10B981',
    lat: -6.597147,
    lng: 106.806039,
  },
  {
    id: 'ter-2',
    name: 'Teritori Bandung',
    branchName: 'Cabang Bandung',
    outletCount: 18,
    salesAssigned: 10,
    coveragePct: 84.2,
    colorHex: '#348CB2',
    lat: -6.917464,
    lng: 107.619123,
  },
  {
    id: 'ter-3',
    name: 'Teritori Bekasi',
    branchName: 'Cabang Bekasi',
    outletCount: 15,
    salesAssigned: 8,
    coveragePct: 79.5,
    colorHex: '#F97316',
    lat: -6.23827,
    lng: 106.975573,
  },
  {
    id: 'ter-4',
    name: 'Teritori Tangerang',
    branchName: 'Cabang Tangerang',
    outletCount: 10,
    salesAssigned: 6,
    coveragePct: 81.0,
    colorHex: '#6366F1',
    lat: -6.178306,
    lng: 106.631889,
  },
];

export const INITIAL_TEAM_MEMBERS: TeamMemberItem[] = [
  {
    id: 'tm-1',
    name: 'Budi Santoso',
    role: 'Sales Rep',
    area: 'Sales - Area Bogor',
    branchId: 'br-1',
    phone: '0812-8899-2025',
    status: 'Online',
    currentLocation: 'Jl. Raya Bogor No. 12',
    speedKmh: 0,
    accuracyM: 5,
    lastUpdate: '09:41 WIB',
    lat: -6.597147,
    lng: 106.806039,
    monthlyOrderValue: 62_500_000,
    visitsToday: 6,
    targetVisits: 8,
  },
  {
    id: 'tm-2',
    name: 'Andi Pratama',
    role: 'Sales Rep',
    area: 'Sales - Area Bandung',
    branchId: 'br-2',
    phone: '0813-4422-7788',
    status: 'Online',
    currentLocation: 'Jl. Buah Batu No. 89',
    speedKmh: 24,
    accuracyM: 7,
    lastUpdate: '09:40 WIB',
    lat: -6.605421,
    lng: 106.81421,
    monthlyOrderValue: 58_400_000,
    visitsToday: 5,
    targetVisits: 8,
  },
  {
    id: 'tm-3',
    name: 'Rina Amelia',
    role: 'Sales Rep',
    area: 'Sales - Area Bekasi',
    branchId: 'br-3',
    phone: '0815-6677-9900',
    status: 'Online',
    currentLocation: 'Jl. Kalimalang Raya No. 41',
    speedKmh: 18,
    accuracyM: 6,
    lastUpdate: '09:38 WIB',
    lat: -6.57892,
    lng: 106.81945,
    monthlyOrderValue: 55_200_000,
    visitsToday: 5,
    targetVisits: 7,
  },
  {
    id: 'tm-4',
    name: 'Dedi Kurniawan',
    role: 'Sales Rep',
    area: 'Sales - Area Tangerang',
    branchId: 'br-4',
    phone: '0817-9900-1122',
    status: 'Offline',
    currentLocation: 'Kantor Cabang Tangerang',
    speedKmh: 0,
    accuracyM: 12,
    lastUpdate: '08:55 WIB',
    lat: -6.55421,
    lng: 106.8019,
    monthlyOrderValue: 49_800_000,
    visitsToday: 3,
    targetVisits: 7,
  },
  {
    id: 'tm-5',
    name: 'Hendra Wijaya',
    role: 'Area Manager',
    area: 'Jawa Barat & Jabodetabek',
    branchId: 'br-1',
    phone: '0811-2233-4455',
    status: 'Online',
    currentLocation: 'Kantor Pusat Bogor',
    speedKmh: 0,
    accuracyM: 4,
    lastUpdate: '09:41 WIB',
    lat: -6.595204,
    lng: 106.797781,
    monthlyOrderValue: 202_500_000,
    visitsToday: 2,
    targetVisits: 3,
  },
];

export const COMPANY_MONTHLY_TRENDS = [
  { month: 'Jan', orderValueJt: 412, paymentValueJt: 390 },
  { month: 'Feb', orderValueJt: 458, paymentValueJt: 432 },
  { month: 'Mar', orderValueJt: 505, paymentValueJt: 480 },
  { month: 'Apr', orderValueJt: 540, paymentValueJt: 510 },
  { month: 'Mei', orderValueJt: 582, paymentValueJt: 548 },
  { month: 'Jun', orderValueJt: 625.8, paymentValueJt: 577.6 },
];

export const COMPANY_ORDER_COMPOSITION = [
  { name: 'Minuman', pct: 42, colorHex: '#348CB2' },
  { name: 'Makanan', pct: 28, colorHex: '#10B981' },
  { name: 'Perawatan', pct: 18, colorHex: '#F97316' },
  { name: 'Lainnya', pct: 12, colorHex: '#94A3B8' },
];

export const INITIAL_COMPANY_ORDERS: CompanyOrderItem[] = [
  {
    id: 'ORD-20250624-001',
    outletId: 'out-1',
    outletName: 'Toko Makmur Jaya',
    branchName: 'Kantor Pusat Bogor',
    salesName: 'Budi Santoso',
    dateLabel: '24 Jun 2025, 09:12',
    total: 12_500_000,
    status: 'Selesai',
    itemsCount: 6,
    paymentStatus: 'Lunas',
  },
  {
    id: 'ORD-20250624-002',
    outletId: 'out-2',
    outletName: 'Toko Sentosa',
    branchName: 'Cabang Bandung',
    salesName: 'Andi Pratama',
    dateLabel: '24 Jun 2025, 10:15',
    total: 8_750_000,
    status: 'Diproses',
    itemsCount: 4,
    paymentStatus: 'Piutang',
  },
  {
    id: 'ORD-20250624-003',
    outletId: 'out-4',
    outletName: 'Toko Maju Bersama',
    branchName: 'Cabang Bekasi',
    salesName: 'Rina Amelia',
    dateLabel: '24 Jun 2025, 11:02',
    total: 15_200_000,
    status: 'Pending',
    itemsCount: 8,
    paymentStatus: 'Piutang',
  },
  {
    id: 'ORD-20250623-004',
    outletId: 'out-3',
    outletName: 'Toko Sumber Rezeki',
    branchName: 'Cabang Tangerang',
    salesName: 'Dedi Kurniawan',
    dateLabel: '23 Jun 2025, 15:40',
    total: 6_450_000,
    status: 'Dikirim',
    itemsCount: 3,
    paymentStatus: 'Lunas',
  },
];

export const INITIAL_COMPANY_INTEGRATIONS: CompanyIntegrationSetting[] = [
  {
    id: 'int-api',
    title: 'API & Webhook',
    subtitle: 'Kunci API, webhook event order/visit, dan sinkronisasi real-time',
    category: 'api',
    connected: true,
    lastSync: '24 Jun 2025, 09:30 WIB',
  },
  {
    id: 'int-erp',
    title: 'Integrasi ERP',
    subtitle: 'Koneksi data faktur, piutang, dan buku besar perusahaan',
    category: 'erp',
    connected: true,
    lastSync: '24 Jun 2025, 09:00 WIB',
  },
  {
    id: 'int-inv',
    title: 'Integrasi Inventory',
    subtitle: 'Sinkronisasi stok gudang multi-cabang secara otomatis',
    category: 'inventory',
    connected: true,
    lastSync: '24 Jun 2025, 09:39 WIB',
  },
  {
    id: 'int-ai',
    title: 'Integrasi AI',
    subtitle: 'Sales Assistant, Content Studio & Executive Analytics Brief',
    category: 'ai',
    connected: true,
    lastSync: 'Aktif · Gemini Cloud Engine',
  },
  {
    id: 'int-notif',
    title: 'Pengaturan Notifikasi',
    subtitle: 'Email, sistem portal, approval alert, & Telegram Bot',
    category: 'notifications',
    connected: true,
    lastSync: 'Aktif · 3 kanal aktif',
  },
  {
    id: 'int-ext',
    title: 'Koneksi Eksternal (Workspace & Maps)',
    subtitle: 'Google Workspace (Gmail, Calendar, Meet) & Google Maps Platform',
    category: 'external',
    connected: true,
    lastSync: 'Terhubung · Layanan Resmi',
  },
];

export const COMPANY_REPORTS_LIST = [
  {
    id: 'rep-sales',
    title: 'Laporan Penjualan',
    subtitle: 'Nilai order, tren bulanan, dan realisasi per cabang',
    rowsCount: 1248,
    period: 'Jun 2025',
  },
  {
    id: 'rep-order',
    title: 'Laporan Order',
    subtitle: 'Detail nomor order, item SKU, dan status pengiriman',
    rowsCount: 1248,
    period: 'Jun 2025',
  },
  {
    id: 'rep-outlet',
    title: 'Laporan Outlet',
    subtitle: 'Aktivitas reorder, cakupan wilayah, dan performa outlet',
    rowsCount: 1045,
    period: 'Jun 2025',
  },
  {
    id: 'rep-team',
    title: 'Laporan Tim',
    subtitle: 'Kinerja sales, pencapaian target, dan ranking cabang',
    rowsCount: 42,
    period: 'Jun 2025',
  },
  {
    id: 'rep-absensi',
    title: 'Laporan Absensi',
    subtitle: 'Rekap kehadiran geofence, jam mulai shift, & kepatuhan',
    rowsCount: 924,
    period: 'Jun 2025',
  },
];

/* ============================================================================
 * CUSTOMER PORTAL DATA & TYPES (PRD Sections 4.3, 5, 7, 10)
 * ============================================================================ */
export interface CustomerContractPrice {
  sku: string;
  name: string;
  category: 'Minuman' | 'Makanan' | 'Perawatan' | 'Lainnya';
  unit: string;
  packDesc: string;
  listPrice: number;
  contractPrice: number;
  minBulkQty: number;
  bulkPrice: number;
  accentHex: string;
}

export interface CustomerCartItem {
  sku: string;
  name: string;
  unit: string;
  unitPrice: number;
  qty: number;
  selected: boolean;
  accentHex: string;
}

export interface CustomerOrderStatusLog {
  title: string;
  timestamp: string;
  completed: boolean;
}

export interface CustomerOrderRecord {
  id: string;
  dateLabel: string;
  deliveryDate: string;
  status: 'Dibuat' | 'Diproses' | 'Dikirim' | 'Selesai' | 'Batal';
  items: Array<{ sku: string; name: string; unitPrice: number; qty: number }>;
  subtotal: number;
  promoDiscount: number;
  total: number;
  notes?: string;
  cancelReason?: string;
  address: string;
  timeline: CustomerOrderStatusLog[];
}

export interface CustomerVoucherItem {
  id: string;
  code: string;
  title: string;
  discountAmount: number;
  minSpend: number;
  validUntil: string;
  used: boolean;
}

export const CUSTOMER_OUTLET_PROFILE = {
  id: 'out-1',
  name: 'Toko Makmur Jaya',
  city: 'Kota Bogor',
  category: 'Outlet • General Trade',
  picName: 'Bapak Hendra',
  phone: '0878-1234-5678',
  email: 'toko.makmurjaya@example.com',
  address: 'Jl. Raya Bogor No. 12, Bogor',
  lat: -6.597147,
  lng: 106.806039,
  monthlyOrderTotal: 12_500_000,
  monthlyGrowthPct: '+18,2%',
  totalOrdersCount: 24,
  processingCount: 6,
  completedCount: 17,
  pointsBalance: 4250,
};

export const CUSTOMER_CONTRACT_PRICES: CustomerContractPrice[] = [
  {
    sku: 'SX-MNM-001',
    name: 'Minuman Energi 250 ml',
    category: 'Minuman',
    unit: 'pcs',
    packDesc: 'Dus (24 pcs)',
    listPrice: 5500,
    contractPrice: 5000,
    minBulkQty: 48,
    bulkPrice: 4600,
    accentHex: '#348CB2',
  },
  {
    sku: 'SX-BSK-002',
    name: 'Biskuit Cokelat 100 g',
    category: 'Makanan',
    unit: 'pcs',
    packDesc: 'Karton (24 pcs)',
    listPrice: 9000,
    contractPrice: 8500,
    minBulkQty: 48,
    bulkPrice: 8000,
    accentHex: '#F97316',
  },
  {
    sku: 'SX-PRW-003',
    name: 'Sabun Wangi 80 g',
    category: 'Perawatan',
    unit: 'pcs',
    packDesc: 'Box (36 pcs)',
    listPrice: 4400,
    contractPrice: 4000,
    minBulkQty: 72,
    bulkPrice: 3750,
    accentHex: '#10B981',
  },
  {
    sku: 'SX-MNM-004',
    name: 'Teh Hijau Botol 350 ml',
    category: 'Minuman',
    unit: 'pcs',
    packDesc: 'Dus (24 pcs)',
    listPrice: 4800,
    contractPrice: 4500,
    minBulkQty: 48,
    bulkPrice: 4200,
    accentHex: '#047857',
  },
  {
    sku: 'SX-MKN-005',
    name: 'Keripik Kentang 75 g',
    category: 'Makanan',
    unit: 'pcs',
    packDesc: 'Karton (20 pcs)',
    listPrice: 7500,
    contractPrice: 7000,
    minBulkQty: 40,
    bulkPrice: 6600,
    accentHex: '#F59E0B',
  },
  {
    sku: 'SX-PRW-006',
    name: 'Shampo Herbal 170 ml',
    category: 'Perawatan',
    unit: 'pcs',
    packDesc: 'Box (12 pcs)',
    listPrice: 17500,
    contractPrice: 16500,
    minBulkQty: 24,
    bulkPrice: 15800,
    accentHex: '#236D91',
  },
];

export const CUSTOMER_INITIAL_CART: CustomerCartItem[] = [
  {
    sku: 'SX-MNM-001',
    name: 'Minuman Energi 250 ml',
    unit: 'pcs',
    unitPrice: 5000,
    qty: 24,
    selected: true,
    accentHex: '#348CB2',
  },
  {
    sku: 'SX-BSK-002',
    name: 'Biskuit Cokelat 100 g',
    unit: 'pcs',
    unitPrice: 8500,
    qty: 10,
    selected: true,
    accentHex: '#F97316',
  },
  {
    sku: 'SX-PRW-003',
    name: 'Sabun Wangi 80 g',
    unit: 'pcs',
    unitPrice: 4000,
    qty: 12,
    selected: true,
    accentHex: '#10B981',
  },
];

export const CUSTOMER_INITIAL_ORDERS: CustomerOrderRecord[] = [
  {
    id: 'ORD-20251024-001',
    dateLabel: '24 Okt 2026, 10:24',
    deliveryDate: 'Selasa, 27 Okt 2026',
    status: 'Diproses',
    items: [
      { sku: 'SX-MNM-001', name: 'Minuman Energi 250 ml', unitPrice: 5000, qty: 24 },
      { sku: 'SX-BSK-002', name: 'Biskuit Cokelat 100 g', unitPrice: 8500, qty: 10 },
      { sku: 'SX-PRW-003', name: 'Sabun Wangi 80 g', unitPrice: 4000, qty: 12 },
    ],
    subtotal: 253_000,
    promoDiscount: 25_300,
    total: 227_700,
    notes: 'Mohon dikirim sebelum pukul 14:00 WIB.',
    address: 'Jl. Raya Bogor No. 12, Bogor',
    timeline: [
      { title: 'Order dibuat', timestamp: '24 Okt 2026, 10:24', completed: true },
      { title: 'Sedang diproses distributor', timestamp: '24 Okt 2026, 10:30', completed: true },
    ],
  },
  {
    id: 'ORD-20251019-008',
    dateLabel: '19 Okt 2026, 09:15',
    deliveryDate: '20 Okt 2026',
    status: 'Selesai',
    items: [
      { sku: 'SX-MNM-001', name: 'Minuman Energi 250 ml', unitPrice: 5000, qty: 240 },
      { sku: 'SX-MNM-004', name: 'Teh Hijau Botol 350 ml', unitPrice: 4500, qty: 120 },
    ],
    subtotal: 1_740_000,
    promoDiscount: 120_000,
    total: 1_620_000,
    address: 'Jl. Raya Bogor No. 12, Bogor',
    timeline: [
      { title: 'Order dibuat', timestamp: '19 Okt 2026, 09:15', completed: true },
      { title: 'Sedang diproses', timestamp: '19 Okt 2026, 09:45', completed: true },
      { title: 'Dalam pengiriman armada', timestamp: '20 Okt 2026, 08:10', completed: true },
      { title: 'Pesanan diterima outlet', timestamp: '20 Okt 2026, 11:05', completed: true },
    ],
  },
];

export const CUSTOMER_REWARD_CATALOG: RewardItem[] = [
  {
    id: 'crew-1',
    title: 'Voucher Diskon Rp 25.000',
    category: 'Voucher',
    pointsCost: 2500,
    description: 'Potongan langsung Rp 25.000 untuk pemesanan outlet berikutnya.',
    stockLabel: 'Tersedia',
  },
  {
    id: 'crew-2',
    title: 'Produk Gratis (Pilihan)',
    category: 'Merchandise',
    pointsCost: 5000,
    description: '1 karton Minuman Energi 250 ml atau Biskuit Cokelat 100 g.',
    stockLabel: 'Tersedia',
  },
  {
    id: 'crew-3',
    title: 'Diskon Pengiriman Rp 10.000',
    category: 'Voucher',
    pointsCost: 1000,
    description: 'Subsidi ongkos kirim ekspres untuk pengiriman area Bogor.',
    stockLabel: 'Tersedia',
  },
];

export const CUSTOMER_REWARD_LEDGER: RewardLedgerEntry[] = [
  {
    id: 'cled-1',
    title: 'Order Selesai ORD-20251019-008 (Point x2)',
    dateLabel: '20 Okt 2026, 11:05',
    pointsDelta: 1500,
    type: 'Perolehan',
  },
  {
    id: 'cled-2',
    title: 'Bonus Aktivasi Promo Minuman Energi',
    dateLabel: '14 Okt 2026, 15:20',
    pointsDelta: 1000,
    type: 'Perolehan',
  },
  {
    id: 'cled-3',
    title: 'Order Bulanan Toko Makmur Jaya',
    dateLabel: '05 Okt 2026, 09:40',
    pointsDelta: 1750,
    type: 'Perolehan',
  },
];

export const CUSTOMER_NOTIFICATIONS: NotificationItem[] = [
  {
    id: 'cnotif-1',
    title: 'Pesanan ORD-20251024-001 Sedang Diproses',
    detail: 'Tim gudang PT Maju Distribusi sedang menyiapkan 3 item pesanan Anda.',
    timeAgo: '15 menit yang lalu',
    category: 'Aktivitas',
    read: false,
  },
  {
    id: 'cnotif-2',
    title: 'Promo Spesial Outlet: Diskon 20%',
    detail: 'Nikmati potongan khusus Minuman Energi 250 ml berlaku hingga 31 Okt 2026.',
    timeAgo: '1 jam yang lalu',
    category: 'Sistem',
    read: false,
  },
  {
    id: 'cnotif-3',
    title: 'Poin SmartReward Tersedia 4.250 Poin',
    detail: 'Poin Anda cukup untuk menukar Voucher Diskon Rp 25.000 atau Diskon Ongkir.',
    timeAgo: '3 jam yang lalu',
    category: 'Sistem',
    read: false,
  },
];

export const INITIAL_COMPANY_ATTENDANCE: CompanyAttendanceItem[] = [
  {
    id: 'att-1',
    memberId: 'tm-1',
    staffName: 'Budi Santoso',
    role: 'Sales Rep',
    branchName: 'Kantor Pusat Bogor',
    officeName: 'Kantor Area Bogor',
    shiftTime: '08:00 – 17:00',
    clockInTime: '07:54 WIB',
    clockOutTime: '— : —',
    geofenceStatus: 'Dalam Radius',
    distanceM: 12,
    status: 'Hadir',
    notes: 'Absen masuk tervalidasi GPS kantor cabang dalam radius 100 m.',
  },
  {
    id: 'att-2',
    memberId: 'tm-2',
    staffName: 'Andi Pratama',
    role: 'Sales Rep',
    branchName: 'Cabang Bandung',
    officeName: 'Kantor Cabang Bandung',
    shiftTime: '08:00 – 17:00',
    clockInTime: '07:58 WIB',
    clockOutTime: '— : —',
    geofenceStatus: 'Dalam Radius',
    distanceM: 28,
    status: 'Hadir',
    notes: 'Siap rute pagi area Buah Batu dan Kiaracondong.',
  },
  {
    id: 'att-3',
    memberId: 'tm-3',
    staffName: 'Rina Amelia',
    role: 'Sales Rep',
    branchName: 'Cabang Bekasi',
    officeName: 'Kantor Cabang Bekasi',
    shiftTime: '08:00 – 17:00',
    clockInTime: '08:19 WIB',
    clockOutTime: '— : —',
    geofenceStatus: 'Dalam Radius',
    distanceM: 45,
    status: 'Terlambat',
    notes: 'Terlambat 19 menit karena kepadatan arus Kalimalang.',
  },
  {
    id: 'att-4',
    memberId: 'tm-4',
    staffName: 'Dedi Kurniawan',
    role: 'Sales Rep',
    branchName: 'Cabang Tangerang',
    officeName: 'Kantor Cabang Tangerang',
    shiftTime: '08:00 – 17:00',
    clockInTime: '— : —',
    clockOutTime: '— : —',
    geofenceStatus: 'Belum Absen',
    distanceM: 0,
    status: 'Belum Absen',
    notes: 'Menunggu konfirmasi absen masuk atau izin cuti dari supervisor.',
  },
  {
    id: 'att-5',
    memberId: 'tm-5',
    staffName: 'Hendra Wijaya',
    role: 'Area Manager',
    branchName: 'Kantor Pusat Bogor',
    officeName: 'Kantor Pusat Bogor',
    shiftTime: '08:00 – 17:00',
    clockInTime: '07:45 WIB',
    clockOutTime: '— : —',
    geofenceStatus: 'Dalam Radius',
    distanceM: 8,
    status: 'Hadir',
    notes: 'Briefing pagi pimpinan cabang dan pemantauan target bulanan.',
  },
];

export const INITIAL_GPS_AUDIT_LOGS: CompanyAuditLogEntry[] = [
  {
    id: 'aud-1',
    actorName: 'Hendra Wijaya (Area Manager)',
    action: 'Membuka Riwayat Rute GPS (24 Jun 2025)',
    targetStaff: 'Budi Santoso',
    timestamp: '24 Jun 2025, 09:35 WIB',
    ipLabel: 'Audit ID #AUD-9041',
  },
  {
    id: 'aud-2',
    actorName: 'Admin Perusahaan',
    action: 'Memeriksa Telemetry Live & Geofence Kantor',
    targetStaff: 'Andi Pratama',
    timestamp: '24 Jun 2025, 09:12 WIB',
    ipLabel: 'Audit ID #AUD-9038',
  },
  {
    id: 'aud-3',
    actorName: 'Dian Permata (Supervisor Bekasi)',
    action: 'Verifikasi Check-in Bukti Foto Display',
    targetStaff: 'Rina Amelia',
    timestamp: '24 Jun 2025, 08:40 WIB',
    ipLabel: 'Audit ID #AUD-9025',
  },
];

export const CUSTOMER_INITIAL_VOUCHERS: CustomerVoucherItem[] = [
  {
    id: 'cv-1',
    code: 'MAKMUR-25K',
    title: 'Voucher Diskon Rp 25.000',
    discountAmount: 25_000,
    minSpend: 150_000,
    validUntil: '31 Des 2026',
    used: false,
  },
  {
    id: 'cv-2',
    code: 'ONGKIR-10K',
    title: 'Diskon Pengiriman Rp 10.000',
    discountAmount: 10_000,
    minSpend: 100_000,
    validUntil: '31 Des 2026',
    used: false,
  },
];

