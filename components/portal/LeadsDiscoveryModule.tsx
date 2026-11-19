'use client';

import React, { useMemo, useState } from 'react';
import {
  Search,
  MapPin,
  Phone,
  Mail,
  Calendar,
  ExternalLink,
  Copy,
  Check,
  Download,
  Plus,
  RotateCcw,
  Star,
  Globe,
  Building2,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ArrowRight,
  SlidersHorizontal,
  UserPlus,
  MessageSquare,
} from 'lucide-react';
import { Modal } from '@/components/common/Modal';
import { SalesGoogleMap } from '@/components/maps/SalesGoogleMap';
import {
  formatRupiah,
  type LeadRecord,
  type LeadStatus,
  type Outlet,
} from '@/lib/salesx-data';

interface PlaceSearchResult {
  id: string;
  displayName?: { text?: string; languageCode?: string };
  formattedAddress?: string;
  nationalPhoneNumber?: string;
  internationalPhoneNumber?: string;
  location?: { latitude: number; longitude: number };
  googleMapsUri?: string;
  websiteUri?: string;
  businessStatus?: string;
  rating?: number;
  userRatingCount?: number;
  primaryTypeDisplayName?: { text?: string };
}

function createLeadId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
}

const LEAD_STATUS_OPTIONS: LeadStatus[] = [
  'Baru',
  'Dihubungi',
  'Tertarik',
  'Follow-up',
  'Konversi',
  'Dibatalkan',
];

const PRODUCT_CATEGORIES = [
  'Minuman',
  'Makanan',
  'Perawatan',
  'Lainnya',
] as const;

function getStatusColorClass(status: LeadStatus): string {
  switch (status) {
    case 'Baru':
      return 'text-[#236D91] dark:text-[#87CEEB]';
    case 'Dihubungi':
      return 'text-[#348CB2] dark:text-[#7DD3FC]';
    case 'Tertarik':
      return 'text-[#C2410C] dark:text-[#FB923C]';
    case 'Follow-up':
      return 'text-[#6D28D9] dark:text-[#C4B5FD]';
    case 'Konversi':
      return 'text-[#047857] dark:text-[#34D399]';
    case 'Dibatalkan':
      return 'text-red-600 dark:text-red-400';
  }
}

function toWhatsAppUrl(phone: string): string {
  const digits = phone.replace(/[^\d]/g, '');
  if (!digits) return 'https://wa.me/';
  const normalized = digits.startsWith('0')
    ? `62${digits.slice(1)}`
    : digits.startsWith('62')
      ? digits
      : `62${digits}`;
  return `https://wa.me/${normalized}`;
}

function shiftIsoDate(baseIso: string, deltaDays: number): string {
  const [y, m, d] = baseIso.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d + deltaDays));
  return dt.toISOString().slice(0, 10);
}

export function LeadsDiscoveryModule({
  leads,
  onAddLead,
  onUpdateLead,
  onConvertLeadToOutlet,
  onOpenWorkspaceWithLead,
  currentPos,
  onToast,
}: {
  leads: LeadRecord[];
  onAddLead: (lead: LeadRecord) => void;
  onUpdateLead: (lead: LeadRecord) => void;
  onConvertLeadToOutlet: (lead: LeadRecord) => void;
  onOpenWorkspaceWithLead: (lead: LeadRecord) => void;
  currentPos: { lat: number; lng: number };
  onToast: (msg: string) => void;
}) {
  const [subTab, setSubTab] = useState<'crm' | 'maps'>('crm');

  // --- TAB 1: ADVANCED LEADS SEARCH & FILTERS ---
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'Semua' | LeadStatus>('Semua');
  const [categoryFilter, setCategoryFilter] = useState<
    'Semua' | 'Minuman' | 'Makanan' | 'Perawatan' | 'Lainnya'
  >('Semua');
  const [datePreset, setDatePreset] = useState<
    'all' | 'today' | '7d' | '30d' | 'custom'
  >('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [sortBy, setSortBy] = useState<'date_desc' | 'value_desc' | 'name_asc'>(
    'date_desc'
  );

  // Lead Detail Modal & Add Manual Lead Modal
  const [selectedLead, setSelectedLead] = useState<LeadRecord | null>(null);
  const [editStatus, setEditStatus] = useState<LeadStatus>('Baru');
  const [editNotes, setEditNotes] = useState('');
  const [editDate, setEditDate] = useState('2025-06-24');

  const [addModalOpen, setAddModalOpen] = useState(false);
  const [newBusinessName, setNewBusinessName] = useState('');
  const [newPicName, setNewPicName] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newCity, setNewCity] = useState('Kota Bogor');
  const [newAddress, setNewAddress] = useState('');
  const [newCategory, setNewCategory] =
    useState<LeadRecord['productCategory']>('Minuman');
  const [newStatus, setNewStatus] = useState<LeadStatus>('Baru');
  const [newEstValue, setNewEstValue] = useState('5000000');
  const [newNotes, setNewNotes] = useState('');

  // --- TAB 2: GOOGLE MAPS PLACES API (NEW) DISCOVERY ---
  const [mapsQuery, setMapsQuery] = useState('Minimarket dan Toko Kelontong');
  const [mapsCityArea, setMapsCityArea] = useState('Kota Bogor');
  const [mapsRadiusM, setMapsRadiusM] = useState<number>(5000);
  const [mapsPlaceType, setMapsPlaceType] = useState<string>('all');
  const [mapsTargetCategory, setMapsTargetCategory] =
    useState<LeadRecord['productCategory']>('Minuman');
  const [mapsLoading, setMapsLoading] = useState(false);
  const [mapsError, setMapsError] = useState<string | null>(null);
  const [mapsResults, setMapsResults] = useState<PlaceSearchResult[]>([]);
  const [nextPageToken, setNextPageToken] = useState<string | null>(null);
  const [lastSubmittedQuery, setLastSubmittedQuery] = useState<string>('');
  const [copiedPhoneId, setCopiedPhoneId] = useState<string | null>(null);
  const [selectedPlaceOutletId, setSelectedPlaceOutletId] = useState<
    string | null
  >(null);

  const applyDatePreset = (preset: 'all' | 'today' | '7d' | '30d') => {
    setDatePreset(preset);
    const refDate = '2025-06-24';
    if (preset === 'all') {
      setDateFrom('');
      setDateTo('');
    } else if (preset === 'today') {
      setDateFrom(refDate);
      setDateTo(refDate);
    } else if (preset === '7d') {
      setDateFrom(shiftIsoDate(refDate, -7));
      setDateTo(refDate);
    } else {
      setDateFrom(shiftIsoDate(refDate, -30));
      setDateTo(refDate);
    }
  };

  const resetAllFilters = () => {
    setQuery('');
    setStatusFilter('Semua');
    setCategoryFilter('Semua');
    setDatePreset('all');
    setDateFrom('');
    setDateTo('');
    setSortBy('date_desc');
  };

  const filteredLeads = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = leads.filter((lead) => {
      if (q) {
        const haystack =
          `${lead.businessName} ${lead.picName} ${lead.phone} ${lead.city} ${lead.address}`.toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      if (statusFilter !== 'Semua' && lead.status !== statusFilter) {
        return false;
      }
      if (
        categoryFilter !== 'Semua' &&
        lead.productCategory !== categoryFilter
      ) {
        return false;
      }
      if (dateFrom && lead.lastInteractionDate < dateFrom) return false;
      if (dateTo && lead.lastInteractionDate > dateTo) return false;
      return true;
    });

    return [...list].sort((a, b) => {
      if (sortBy === 'value_desc') return b.estimatedValue - a.estimatedValue;
      if (sortBy === 'name_asc')
        return a.businessName.localeCompare(b.businessName, 'id');
      return b.lastInteractionDate.localeCompare(a.lastInteractionDate);
    });
  }, [leads, query, statusFilter, categoryFilter, dateFrom, dateTo, sortBy]);

  const totalPipelineValue = useMemo(
    () =>
      filteredLeads
        .filter((l) => l.status !== 'Dibatalkan')
        .reduce((acc, l) => acc + l.estimatedValue, 0),
    [filteredLeads]
  );

  const openLeadModal = (lead: LeadRecord) => {
    setSelectedLead(lead);
    setEditStatus(lead.status);
    setEditNotes(lead.notes);
    setEditDate(lead.lastInteractionDate);
  };

  const handleSaveLeadUpdate = () => {
    if (!selectedLead) return;
    const updated: LeadRecord = {
      ...selectedLead,
      status: editStatus,
      notes: editNotes.trim(),
      lastInteractionDate: editDate,
    };
    onUpdateLead(updated);
    setSelectedLead(null);
    onToast(`Data prospek ${updated.businessName} berhasil diperbarui.`);
  };

  const handleExportCsv = () => {
    const header = [
      'ID',
      'Place ID',
      'Nama Bisnis',
      'PIC',
      'No Telepon',
      'Email',
      'Kota',
      'Alamat',
      'Status Prospek',
      'Kategori Produk',
      'Tanggal Interaksi',
      'Estimasi Nilai (IDR)',
      'Sumber',
    ].join(',');
    const rows = filteredLeads.map((l) =>
      [
        l.id,
        l.placeId || '',
        `"${l.businessName.replace(/"/g, '""')}"`,
        `"${l.picName.replace(/"/g, '""')}"`,
        `"${l.phone}"`,
        `"${l.email}"`,
        `"${l.city}"`,
        `"${l.address.replace(/"/g, '""')}"`,
        l.status,
        l.productCategory,
        l.lastInteractionDate,
        l.estimatedValue,
        l.source,
      ].join(',')
    );
    const csv = [header, ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `salesx-ai-leads-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    onToast(`${filteredLeads.length} data Leads berhasil diekspor ke CSV.`);
  };

  const handleCreateManualLead = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBusinessName.trim() || !newPhone.trim()) return;
    const created: LeadRecord = {
      id: createLeadId('lead'),
      businessName: newBusinessName.trim(),
      picName: newPicName.trim() || 'Pemilik / PIC Usaha',
      phone: newPhone.trim(),
      email: newEmail.trim() || 'kontak@outlet.example.com',
      address: newAddress.trim() || `Area ${newCity}`,
      city: newCity,
      lat: currentPos.lat,
      lng: currentPos.lng,
      status: newStatus,
      productCategory: newCategory,
      lastInteractionDate: new Date().toISOString().slice(0, 10),
      estimatedValue: Number(newEstValue) || 5_000_000,
      source: 'CRM',
      notes: newNotes.trim() || 'Prospek baru ditambahkan dari Sales Portal.',
    };
    onAddLead(created);
    setAddModalOpen(false);
    setNewBusinessName('');
    setNewPicName('');
    setNewPhone('');
    setNewEmail('');
    setNewAddress('');
    setNewNotes('');
    onToast(`Lead baru "${created.businessName}" berhasil disimpan.`);
  };

  // --- GOOGLE MAPS PLACES SEARCH HANDLER ---
  const handleRunPlacesSearch = async (pageTokenToUse?: string) => {
    const trimmed = mapsQuery.trim();
    if (!trimmed || mapsLoading) return;

    const fullQuery =
      mapsCityArea === 'Semua Area'
        ? trimmed
        : `${trimmed} di ${mapsCityArea}`;

    setMapsLoading(true);
    setMapsError(null);

    try {
      const res = await fetch('/api/maps/places-search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          textQuery: pageTokenToUse ? lastSubmittedQuery || fullQuery : fullQuery,
          includedType: mapsPlaceType,
          locationBias: {
            lat: currentPos.lat,
            lng: currentPos.lng,
            radiusMeters: mapsRadiusM,
          },
          pageSize: 10,
          pageToken: pageTokenToUse,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        if (data.quotaExceeded && typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('gmp-quota-exceeded'));
        }
        setMapsError(
          data.error || 'Gagal mencari bisnis di Google Maps Places.'
        );
        return;
      }

      const incoming: PlaceSearchResult[] = Array.isArray(data.places)
        ? data.places
        : [];
      setLastSubmittedQuery(fullQuery);
      setNextPageToken(data.nextPageToken || null);
      if (pageTokenToUse) {
        setMapsResults((prev) => [...prev, ...incoming]);
      } else {
        setMapsResults(incoming);
        if (incoming.length > 0) {
          setSelectedPlaceOutletId(incoming[0].id);
        }
      }
    } catch {
      setMapsError('Koneksi ke Google Maps Places API gagal.');
    } finally {
      setMapsLoading(false);
    }
  };

  // Adapt discovered Google Maps Places into Outlet shape for SalesGoogleMap visualization
  const mappedPlaceOutlets: Outlet[] = useMemo(() => {
    return mapsResults
      .filter((p) => p.location)
      .map((p, idx) => ({
        id: p.id,
        name: p.displayName?.text || `Bisnis #${idx + 1}`,
        city: mapsCityArea === 'Semua Area' ? 'Jabodetabek' : mapsCityArea,
        address: p.formattedAddress || 'Alamat tersedia di Google Maps',
        distanceKm: Number(((idx + 1) * 0.9).toFixed(1)),
        isPriority: Boolean(p.nationalPhoneNumber || p.internationalPhoneNumber),
        visitToday: false,
        status: 'Aktif',
        category: p.primaryTypeDisplayName?.text || 'Prospek Google Maps',
        picName: 'Kontak Bisnis',
        phone: p.nationalPhoneNumber || p.internationalPhoneNumber || '-',
        email: '',
        lat: p.location!.latitude,
        lng: p.location!.longitude,
        lastOrderTotal: 0,
        lastVisitDate: '-',
      }));
  }, [mapsResults, mapsCityArea]);

  const selectedMapPlaceOutlet =
    mappedPlaceOutlets.find((o) => o.id === selectedPlaceOutletId) ||
    mappedPlaceOutlets[0] ||
    null;

  const isPlaceAlreadySaved = (placeId: string) =>
    leads.some((l) => l.placeId === placeId);

  const handleSavePlaceAsLead = (place: PlaceSearchResult) => {
    if (isPlaceAlreadySaved(place.id)) {
      onToast('Bisnis ini sudah tersimpan di daftar Leads Anda.');
      return;
    }
    const name = place.displayName?.text || 'Prospek Bisnis Baru';
    const phone =
      place.nationalPhoneNumber ||
      place.internationalPhoneNumber ||
      'Belum tersedia';
    const newLead: LeadRecord = {
      id: createLeadId('lead'),
      placeId: place.id,
      businessName: name,
      picName: `Pemilik / Pengelola ${name.split(' ').slice(0, 2).join(' ')}`,
      phone,
      email: `info@${name
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '')
        .slice(0, 14) || 'prospek'}.example.com`,
      address: place.formattedAddress || `Area ${mapsCityArea}`,
      city: mapsCityArea === 'Semua Area' ? 'Area Bogor & Depok' : mapsCityArea,
      lat: place.location?.latitude ?? currentPos.lat,
      lng: place.location?.longitude ?? currentPos.lng,
      status: 'Baru',
      productCategory: mapsTargetCategory,
      lastInteractionDate: '2025-06-24',
      estimatedValue: 6_500_000,
      source: 'Google Maps',
      rating: place.rating,
      userRatingCount: place.userRatingCount,
      websiteUri: place.websiteUri,
      googleMapsUri: place.googleMapsUri,
      notes: `Ditemukan via Google Maps Places API (${place.primaryTypeDisplayName?.text || 'Bisnis Retail'}). Kategori target: ${mapsTargetCategory}.`,
    };
    onAddLead(newLead);
    onToast(`"${name}" beserta kontak (${phone}) berhasil disimpan ke Leads.`);
  };

  return (
    <div className="space-y-5">
      {/* Header & Top Switcher */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-[#123A54] dark:text-white">
            Pencarian Lanjutan Leads & Google Maps
          </h1>
          <p className="text-xs sm:text-sm text-[var(--color-text-secondary)]">
            Filter data prospek multi-kriteria dan temukan bisnis potensial
            beserta nomor kontak aktif via Google Maps Places.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setAddModalOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-xl border border-[#348CB2] bg-[var(--color-surface)] px-3.5 py-2 text-xs font-bold text-[#348CB2] hover:bg-[#F3FAFC] cursor-pointer whitespace-nowrap shrink-0"
          >
            <UserPlus className="h-3.5 w-3.5" />
            <span>Tambah Lead</span>
          </button>
          <button
            type="button"
            onClick={handleExportCsv}
            className="inline-flex items-center gap-1.5 rounded-xl bg-[#123A54] hover:bg-[#194F70] px-3.5 py-2 text-xs font-bold text-white cursor-pointer whitespace-nowrap shrink-0"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Ekspor CSV ({filteredLeads.length})</span>
          </button>
        </div>
      </div>

      {/* Sub-Tabs */}
      <div className="grid grid-cols-2 gap-2 rounded-xl bg-[var(--color-surface-muted)] p-1.5 max-w-xl">
        <button
          type="button"
          onClick={() => setSubTab('crm')}
          className={`inline-flex items-center justify-center gap-2 rounded-lg py-2.5 px-3 text-xs sm:text-sm font-semibold cursor-pointer transition-colors whitespace-nowrap ${
            subTab === 'crm'
              ? 'bg-[#348CB2] text-white shadow-xs'
              : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
          }`}
        >
          <SlidersHorizontal className="h-4 w-4 shrink-0" />
          <span>Pencarian Lanjutan Leads ({leads.length})</span>
        </button>
        <button
          type="button"
          onClick={() => setSubTab('maps')}
          className={`inline-flex items-center justify-center gap-2 rounded-lg py-2.5 px-3 text-xs sm:text-sm font-semibold cursor-pointer transition-colors whitespace-nowrap ${
            subTab === 'maps'
              ? 'bg-[#F97316] text-white shadow-xs'
              : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
          }`}
        >
          <MapPin className="h-4 w-4 shrink-0" />
          <span>Cari Bisnis Google Maps</span>
        </button>
      </div>

      {/* ===================================================================
          SUB-TAB 1: PENCARIAN LANJUTAN LEADS
         =================================================================== */}
      {subTab === 'crm' && (
        <div className="space-y-4">
          {/* Multi-criteria Filter Card */}
          <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 sm:p-5 space-y-4 shadow-xs">
            <div className="grid gap-3 md:grid-cols-12">
              <div className="relative md:col-span-5">
                <Search className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--color-text-muted)]" />
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Cari nama pelanggan, PIC, nomor HP, atau kota..."
                  className="w-full rounded-xl border border-[var(--color-border-strong)] bg-[var(--color-background)] pl-10 pr-4 py-2.5 text-xs sm:text-sm focus:border-[#348CB2] focus:outline-none"
                />
              </div>

              <div className="md:col-span-3">
                <select
                  aria-label="Filter Status Prospek"
                  value={statusFilter}
                  onChange={(e) =>
                    setStatusFilter(e.target.value as 'Semua' | LeadStatus)
                  }
                  className="w-full rounded-xl border border-[var(--color-border-strong)] bg-[var(--color-background)] px-3 py-2.5 text-xs sm:text-sm font-semibold"
                >
                  <option value="Semua">Status: Semua Prospek</option>
                  {LEAD_STATUS_OPTIONS.map((st) => (
                    <option key={st} value={st}>
                      Status: {st}
                    </option>
                  ))}
                </select>
              </div>

              <div className="md:col-span-2">
                <select
                  aria-label="Filter Kategori Produk"
                  value={categoryFilter}
                  onChange={(e) =>
                    setCategoryFilter(
                      e.target.value as
                        | 'Semua'
                        | 'Minuman'
                        | 'Makanan'
                        | 'Perawatan'
                        | 'Lainnya'
                    )
                  }
                  className="w-full rounded-xl border border-[var(--color-border-strong)] bg-[var(--color-background)] px-3 py-2.5 text-xs sm:text-sm font-semibold"
                >
                  <option value="Semua">Kategori: Semua</option>
                  {PRODUCT_CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <div className="md:col-span-2">
                <select
                  aria-label="Urutkan Leads"
                  value={sortBy}
                  onChange={(e) =>
                    setSortBy(
                      e.target.value as 'date_desc' | 'value_desc' | 'name_asc'
                    )
                  }
                  className="w-full rounded-xl border border-[var(--color-border-strong)] bg-[var(--color-background)] px-3 py-2.5 text-xs sm:text-sm font-semibold"
                >
                  <option value="date_desc">Interaksi Terbaru</option>
                  <option value="value_desc">Nilai Tertinggi</option>
                  <option value="name_asc">Nama A–Z</option>
                </select>
              </div>
            </div>

            {/* Tanggal Interaksi Preset + Custom Range */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-[var(--color-border)]">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-bold text-[var(--color-text-secondary)]">
                  Tanggal Interaksi:
                </span>
                {[
                  { id: 'all' as const, label: 'Semua' },
                  { id: 'today' as const, label: 'Hari Ini' },
                  { id: '7d' as const, label: '7 Hari Terakhir' },
                  { id: '30d' as const, label: '30 Hari Terakhir' },
                ].map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => applyDatePreset(p.id)}
                    className={`rounded-lg px-3 py-1.5 text-xs font-semibold cursor-pointer whitespace-nowrap transition-colors ${
                      datePreset === p.id
                        ? 'bg-[#348CB2] text-white'
                        : 'bg-[var(--color-surface-muted)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>

              <div className="flex flex-wrap items-center gap-2 text-xs">
                <label className="flex items-center gap-1.5 text-[var(--color-text-muted)]">
                  <span>Dari:</span>
                  <input
                    type="date"
                    value={dateFrom}
                    onChange={(e) => {
                      setDateFrom(e.target.value);
                      setDatePreset('custom');
                    }}
                    className="rounded-lg border border-[var(--color-border-strong)] bg-[var(--color-background)] px-2.5 py-1.5 text-xs text-[var(--color-text-primary)] tabular-nums"
                  />
                </label>
                <label className="flex items-center gap-1.5 text-[var(--color-text-muted)]">
                  <span>Sampai:</span>
                  <input
                    type="date"
                    value={dateTo}
                    onChange={(e) => {
                      setDateTo(e.target.value);
                      setDatePreset('custom');
                    }}
                    className="rounded-lg border border-[var(--color-border-strong)] bg-[var(--color-background)] px-2.5 py-1.5 text-xs text-[var(--color-text-primary)] tabular-nums"
                  />
                </label>
                <button
                  type="button"
                  onClick={resetAllFilters}
                  className="inline-flex items-center gap-1 rounded-lg border border-[var(--color-border)] px-2.5 py-1.5 text-xs font-semibold text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-muted)] cursor-pointer"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  <span>Reset</span>
                </button>
              </div>
            </div>
          </div>

          {/* KPI Summary Strip */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
              <p className="text-xs text-[var(--color-text-muted)]">
                Hasil Ditemukan
              </p>
              <p className="mt-1 text-lg font-bold text-[#123A54] dark:text-white font-mono tabular-nums">
                {filteredLeads.length} Prospek
              </p>
            </div>
            <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
              <p className="text-xs text-[var(--color-text-muted)]">
                Potensi Nilai Pipeline
              </p>
              <p className="mt-1 text-lg font-bold text-[#236D91] dark:text-[#87CEEB] tabular-nums">
                {formatRupiah(totalPipelineValue)}
              </p>
            </div>
            <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
              <p className="text-xs text-[var(--color-text-muted)]">
                Tertarik & Follow-up
              </p>
              <p className="mt-1 text-lg font-bold text-[#F97316] font-mono tabular-nums">
                {
                  filteredLeads.filter(
                    (l) => l.status === 'Tertarik' || l.status === 'Follow-up'
                  ).length
                }
              </p>
            </div>
            <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
              <p className="text-xs text-[var(--color-text-muted)]">
                Dari Google Maps
              </p>
              <p className="mt-1 text-lg font-bold text-[#10B981] font-mono tabular-nums">
                {
                  filteredLeads.filter((l) => l.source === 'Google Maps')
                    .length
                }
              </p>
            </div>
          </div>

          {/* Results Table (Desktop) & Cards (Mobile) */}
          {filteredLeads.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-[var(--color-border-strong)] bg-[var(--color-surface)] p-8 text-center space-y-3">
              <p className="text-sm font-bold text-[var(--color-text-primary)]">
                Tidak ada Leads yang cocok dengan filter saat ini
              </p>
              <p className="text-xs text-[var(--color-text-muted)] max-w-md mx-auto">
                Coba reset filter pencarian atau gunakan tab Cari Bisnis Google
                Maps untuk menemukan prospek baru di sekitar area kerja Anda.
              </p>
              <div className="flex flex-wrap justify-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={resetAllFilters}
                  className="rounded-xl border border-[var(--color-border-strong)] px-4 py-2 text-xs font-semibold cursor-pointer"
                >
                  Reset Filter
                </button>
                <button
                  type="button"
                  onClick={() => setSubTab('maps')}
                  className="rounded-xl bg-[#F97316] px-4 py-2 text-xs font-bold text-white cursor-pointer"
                >
                  Cari Bisnis di Google Maps
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Desktop Data Table */}
              <div className="hidden md:block overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-xs">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="border-b border-[var(--color-border)] bg-[var(--color-background)] text-[var(--color-text-muted)]">
                      <tr>
                        <th className="px-4 py-3 font-bold">
                          Pelanggan / Bisnis
                        </th>
                        <th className="px-4 py-3 font-bold">PIC & Kontak</th>
                        <th className="px-4 py-3 font-bold">Kategori</th>
                        <th className="px-4 py-3 font-bold">Status Prospek</th>
                        <th className="px-4 py-3 font-bold">Interaksi</th>
                        <th className="px-4 py-3 font-bold text-right">
                          Estimasi Nilai
                        </th>
                        <th className="px-4 py-3 font-bold text-right">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--color-border)]">
                      {filteredLeads.map((lead) => (
                        <tr
                          key={lead.id}
                          onClick={() => openLeadModal(lead)}
                          className="hover:bg-[var(--color-background)] cursor-pointer transition-colors"
                        >
                          <td className="px-4 py-3.5">
                            <p className="font-bold text-sm text-[var(--color-text-primary)]">
                              {lead.businessName}
                            </p>
                            <p className="text-[11px] text-[var(--color-text-muted)] mt-0.5">
                              {lead.city} · Sumber: {lead.source}
                            </p>
                          </td>
                          <td className="px-4 py-3.5">
                            <p className="font-semibold text-[var(--color-text-primary)]">
                              {lead.picName}
                            </p>
                            <p className="font-mono text-[11px] text-[#348CB2] tabular-nums mt-0.5">
                              {lead.phone}
                            </p>
                          </td>
                          <td className="px-4 py-3.5 font-semibold text-[var(--color-text-secondary)]">
                            {lead.productCategory}
                          </td>
                          <td className="px-4 py-3.5">
                            <span
                              className={`font-bold ${getStatusColorClass(lead.status)}`}
                            >
                              {lead.status}
                            </span>
                          </td>
                          <td className="px-4 py-3.5 font-mono text-[var(--color-text-secondary)] tabular-nums">
                            {lead.lastInteractionDate}
                          </td>
                          <td className="px-4 py-3.5 text-right font-bold text-[var(--color-text-primary)] tabular-nums">
                            {formatRupiah(lead.estimatedValue)}
                          </td>
                          <td className="px-4 py-3.5 text-right">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                openLeadModal(lead);
                              }}
                              className="rounded-lg border border-[var(--color-border-strong)] px-3 py-1.5 text-xs font-semibold text-[#348CB2] hover:bg-[#F3FAFC] cursor-pointer whitespace-nowrap"
                            >
                              Detail
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Mobile Card List */}
              <div className="grid gap-3 md:hidden">
                {filteredLeads.map((lead) => (
                  <button
                    key={lead.id}
                    type="button"
                    onClick={() => openLeadModal(lead)}
                    className="w-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 text-left space-y-2.5 hover:border-[#348CB2] cursor-pointer"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-sm font-bold text-[var(--color-text-primary)]">
                          {lead.businessName}
                        </p>
                        <p className="text-xs text-[var(--color-text-muted)]">
                          {lead.picName} · {lead.city}
                        </p>
                      </div>
                      <span
                        className={`text-xs font-bold shrink-0 ${getStatusColorClass(lead.status)}`}
                      >
                        {lead.status}
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center justify-between gap-2 text-xs pt-2 border-t border-[var(--color-border)]">
                      <span className="font-mono text-[#348CB2] tabular-nums">
                        {lead.phone}
                      </span>
                      <span className="text-[var(--color-text-secondary)]">
                        {lead.productCategory} ·{' '}
                        <span className="font-mono tabular-nums">
                          {lead.lastInteractionDate}
                        </span>
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {/* ===================================================================
          SUB-TAB 2: CARI BISNIS & KONTAK VIA GOOGLE MAPS PLACES API (NEW)
         =================================================================== */}
      {subTab === 'maps' && (
        <div className="space-y-4">
          {/* ToS Compliance Notice */}
          <div className="rounded-2xl border border-[#ADD8E6]/60 bg-[#F3FAFC] dark:bg-[#172438] px-4 py-3 flex items-start gap-3 text-xs">
            <CheckCircle2 className="h-4 w-4 text-[#348CB2] shrink-0 mt-0.5" />
            <div className="text-[var(--color-text-secondary)]">
              <strong className="text-[#123A54] dark:text-white">
                Pencarian Bisnis Resmi Google Maps Platform Places API (New):
              </strong>{' '}
              Temukan prospek toko, minimarket, apotek, dan kafe beserta nomor
              telepon, alamat terverifikasi, rating, dan{' '}
              <code className="font-mono">place_id</code> untuk langsung
              disimpan ke daftar Leads CRM Anda.
            </div>
          </div>

          {/* Search Form */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleRunPlacesSearch();
            }}
            className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 sm:p-5 space-y-4 shadow-xs"
          >
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-12">
              <div className="lg:col-span-4">
                <label className="block text-xs font-bold text-[var(--color-text-primary)] mb-1">
                  Kata Kunci Bisnis
                </label>
                <input
                  type="text"
                  value={mapsQuery}
                  onChange={(e) => setMapsQuery(e.target.value)}
                  placeholder="Contoh: Minimarket, Toko Kelontong, Kafe..."
                  className="w-full rounded-xl border border-[var(--color-border-strong)] bg-[var(--color-background)] px-3.5 py-2.5 text-xs sm:text-sm focus:border-[#348CB2] focus:outline-none"
                />
              </div>

              <div className="lg:col-span-2">
                <label className="block text-xs font-bold text-[var(--color-text-primary)] mb-1">
                  Kota / Area
                </label>
                <select
                  value={mapsCityArea}
                  onChange={(e) => setMapsCityArea(e.target.value)}
                  className="w-full rounded-xl border border-[var(--color-border-strong)] bg-[var(--color-background)] px-3 py-2.5 text-xs sm:text-sm font-semibold"
                >
                  <option value="Kota Bogor">Kota Bogor</option>
                  <option value="Kab. Bogor">Kab. Bogor</option>
                  <option value="Kota Depok">Kota Depok</option>
                  <option value="Semua Area">Sekitar Posisi GPS</option>
                </select>
              </div>

              <div className="lg:col-span-2">
                <label className="block text-xs font-bold text-[var(--color-text-primary)] mb-1">
                  Tipe Bisnis
                </label>
                <select
                  value={mapsPlaceType}
                  onChange={(e) => setMapsPlaceType(e.target.value)}
                  className="w-full rounded-xl border border-[var(--color-border-strong)] bg-[var(--color-background)] px-3 py-2.5 text-xs sm:text-sm font-semibold"
                >
                  <option value="all">Semua Tipe</option>
                  <option value="supermarket">Supermarket</option>
                  <option value="convenience_store">Minimarket</option>
                  <option value="store">Toko Retail</option>
                  <option value="pharmacy">Apotek</option>
                  <option value="cafe">Kafe</option>
                  <option value="restaurant">Restoran</option>
                </select>
              </div>

              <div className="lg:col-span-2">
                <label className="block text-xs font-bold text-[var(--color-text-primary)] mb-1">
                  Radius Pencarian
                </label>
                <select
                  value={mapsRadiusM}
                  onChange={(e) => setMapsRadiusM(Number(e.target.value))}
                  className="w-full rounded-xl border border-[var(--color-border-strong)] bg-[var(--color-background)] px-3 py-2.5 text-xs sm:text-sm font-semibold tabular-nums"
                >
                  <option value={2000}>2 km</option>
                  <option value={5000}>5 km</option>
                  <option value={10000}>10 km</option>
                  <option value={25000}>25 km</option>
                </select>
              </div>

              <div className="lg:col-span-2">
                <label className="block text-xs font-bold text-[var(--color-text-primary)] mb-1">
                  Kategori Produk
                </label>
                <select
                  value={mapsTargetCategory}
                  onChange={(e) =>
                    setMapsTargetCategory(
                      e.target.value as LeadRecord['productCategory']
                    )
                  }
                  className="w-full rounded-xl border border-[var(--color-border-strong)] bg-[var(--color-background)] px-3 py-2.5 text-xs sm:text-sm font-semibold"
                >
                  {PRODUCT_CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap gap-1.5">
                {[
                  'Minimarket',
                  'Toko Sembako',
                  'Apotek',
                  'Warung Kopi',
                  'Toko Grosir',
                ].map((chip) => (
                  <button
                    key={chip}
                    type="button"
                    onClick={() => setMapsQuery(chip)}
                    className="rounded-lg border border-[var(--color-border)] bg-[var(--color-background)] px-2.5 py-1 text-xs font-medium text-[#236D91] dark:text-[#87CEEB] hover:border-[#348CB2] cursor-pointer"
                  >
                    {chip}
                  </button>
                ))}
              </div>

              <button
                type="submit"
                disabled={mapsLoading || !mapsQuery.trim()}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#F97316] hover:bg-[#EA580C] disabled:opacity-60 px-5 py-2.5 text-xs sm:text-sm font-bold text-white cursor-pointer whitespace-nowrap shrink-0"
              >
                {mapsLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Search className="h-4 w-4" />
                )}
                <span>
                  {mapsLoading
                    ? 'Mencari di Google Maps...'
                    : 'Cari Bisnis & Nomor Kontak'}
                </span>
              </button>
            </div>
          </form>

          {mapsError && (
            <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 dark:border-red-900/50 dark:bg-red-950/40 px-4 py-3 text-xs text-red-700 dark:text-red-300">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{mapsError}</span>
            </div>
          )}

          {/* Split View: Interactive Map + Places Result Cards */}
          <div className="grid gap-5 lg:grid-cols-12">
            <div className="lg:col-span-6 space-y-3">
              <SalesGoogleMap
                currentPos={currentPos}
                outlets={mappedPlaceOutlets}
                selectedOutlet={selectedMapPlaceOutlet}
                onSelectOutlet={(o) => setSelectedPlaceOutletId(o.id)}
                showRouteToSelected={Boolean(selectedMapPlaceOutlet)}
                heightClass="h-[320px] lg:h-[460px]"
              />
            </div>

            <div className="lg:col-span-6 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-[#123A54] dark:text-white">
                  Hasil Bisnis Google Maps ({mapsResults.length})
                </h3>
                {nextPageToken && (
                  <button
                    type="button"
                    onClick={() => handleRunPlacesSearch(nextPageToken)}
                    disabled={mapsLoading}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-[#348CB2] px-3 py-1.5 text-xs font-bold text-[#348CB2] hover:bg-[#F3FAFC] cursor-pointer"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>Muat Halaman Berikutnya</span>
                  </button>
                )}
              </div>

              {mapsResults.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-[var(--color-border-strong)] bg-[var(--color-surface)] p-8 text-center space-y-2">
                  <Building2 className="h-8 w-8 mx-auto text-[#348CB2]" />
                  <p className="text-sm font-bold text-[var(--color-text-primary)]">
                    Siap Mencari Prospek Bisnis di Google Maps
                  </p>
                  <p className="text-xs text-[var(--color-text-muted)]">
                    Masukkan jenis usaha (misal &ldquo;Minimarket&rdquo;,
                    &ldquo;Toko Sembako&rdquo;, atau &ldquo;Apotek&rdquo;) lalu
                    klik <strong>Cari Bisnis & Nomor Kontak</strong> untuk
                    menampilkan alamat, nomor telepon, dan titik lokasi langsung
                    dari Google Maps Platform.
                  </p>
                </div>
              ) : (
                <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
                  {mapsResults.map((place) => {
                    const name = place.displayName?.text || 'Bisnis Tanpa Nama';
                    const phone =
                      place.nationalPhoneNumber ||
                      place.internationalPhoneNumber ||
                      '';
                    const saved = isPlaceAlreadySaved(place.id);
                    const activePin = selectedPlaceOutletId === place.id;

                    return (
                      <div
                        key={place.id}
                        onClick={() => setSelectedPlaceOutletId(place.id)}
                        className={`rounded-2xl border p-4 space-y-2.5 transition-all cursor-pointer ${
                          activePin
                            ? 'border-[#348CB2] bg-[#F3FAFC] dark:bg-[#172438]'
                            : 'border-[var(--color-border)] bg-[var(--color-surface)] hover:border-[#348CB2]/60'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className="text-sm font-bold text-[var(--color-text-primary)]">
                              {name}
                            </p>
                            <p className="text-[11px] text-[var(--color-text-muted)] mt-0.5">
                              {place.primaryTypeDisplayName?.text ||
                                'Bisnis Retail'}{' '}
                              {place.businessStatus === 'OPERATIONAL'
                                ? '· Beroperasi'
                                : ''}
                            </p>
                          </div>
                          {place.rating && (
                            <span className="inline-flex items-center gap-1 text-xs font-bold text-[#C2410C] dark:text-[#FB923C] tabular-nums shrink-0">
                              <Star className="h-3.5 w-3.5 fill-current" />
                              <span>{place.rating}</span>
                              {place.userRatingCount && (
                                <span className="text-[var(--color-text-muted)] font-normal">
                                  ({place.userRatingCount})
                                </span>
                              )}
                            </span>
                          )}
                        </div>

                        <p className="text-xs text-[var(--color-text-secondary)]">
                          {place.formattedAddress}
                        </p>

                        {/* Extracted Phone & Website */}
                        <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
                          {phone ? (
                            <div className="flex flex-wrap items-center gap-1.5">
                              <a
                                href={`tel:${phone}`}
                                onClick={(e) => e.stopPropagation()}
                                className="inline-flex items-center gap-1 rounded-lg bg-[#E5F4F8] dark:bg-[#19394B] px-2.5 py-1 font-mono font-bold text-[#236D91] dark:text-[#87CEEB] tabular-nums"
                              >
                                <Phone className="h-3 w-3" />
                                <span>{phone}</span>
                              </a>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  navigator.clipboard?.writeText(phone);
                                  setCopiedPhoneId(place.id);
                                  setTimeout(
                                    () => setCopiedPhoneId(null),
                                    2000
                                  );
                                }}
                                className="inline-flex items-center gap-1 rounded-lg border border-[var(--color-border)] px-2 py-1 text-[11px] font-semibold cursor-pointer"
                              >
                                {copiedPhoneId === place.id ? (
                                  <Check className="h-3 w-3 text-emerald-600" />
                                ) : (
                                  <Copy className="h-3 w-3" />
                                )}
                                <span>
                                  {copiedPhoneId === place.id
                                    ? 'Tersalin'
                                    : 'Salin'}
                                </span>
                              </button>
                              <a
                                href={toWhatsAppUrl(phone)}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={(e) => e.stopPropagation()}
                                className="inline-flex items-center gap-1 rounded-lg border border-emerald-200 dark:border-emerald-900/50 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-1 text-[11px] font-semibold text-emerald-700 dark:text-emerald-300"
                              >
                                <MessageSquare className="h-3 w-3" />
                                <span>WA</span>
                              </a>
                            </div>
                          ) : (
                            <span className="text-[11px] text-[var(--color-text-muted)]">
                              Nomor telepon belum terdaftar di Google Maps
                            </span>
                          )}
                        </div>

                        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-[var(--color-border)]">
                          <div className="flex items-center gap-3 text-[11px] font-semibold text-[#348CB2]">
                            {place.googleMapsUri && (
                              <a
                                href={place.googleMapsUri}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={(e) => e.stopPropagation()}
                                className="inline-flex items-center gap-1 hover:underline"
                              >
                                <ExternalLink className="h-3 w-3" />
                                <span>Lihat di Maps</span>
                              </a>
                            )}
                            {place.websiteUri && (
                              <a
                                href={place.websiteUri}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={(e) => e.stopPropagation()}
                                className="inline-flex items-center gap-1 hover:underline"
                              >
                                <Globe className="h-3 w-3" />
                                <span>Website</span>
                              </a>
                            )}
                          </div>

                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSavePlaceAsLead(place);
                            }}
                            disabled={saved}
                            className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold cursor-pointer ${
                              saved
                                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                                : 'bg-[#348CB2] hover:bg-[#236D91] text-white'
                            }`}
                          >
                            {saved ? (
                              <>
                                <Check className="h-3.5 w-3.5" />
                                <span>Tersimpan di Leads</span>
                              </>
                            ) : (
                              <>
                                <Plus className="h-3.5 w-3.5" />
                                <span>Simpan ke Leads</span>
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================
          MODAL: LEAD DETAIL & FOLLOW-UP WORKFLOW
         =================================================================== */}
      <Modal
        open={Boolean(selectedLead)}
        onClose={() => setSelectedLead(null)}
        title={selectedLead?.businessName || ''}
        subtitle={
          selectedLead
            ? `${selectedLead.city} · Sumber: ${selectedLead.source}${
                selectedLead.placeId ? ` · Place ID: ${selectedLead.placeId}` : ''
              }`
            : ''
        }
        maxWidthClass="max-w-lg"
      >
        {selectedLead && (
          <div className="space-y-4">
            <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] p-3.5 text-xs space-y-1.5">
              <p>
                <strong>PIC:</strong> {selectedLead.picName}
              </p>
              <p>
                <strong>Alamat:</strong> {selectedLead.address}
              </p>
              <p className="tabular-nums">
                <strong>Kontak:</strong> {selectedLead.phone} ·{' '}
                {selectedLead.email}
              </p>
              <p className="tabular-nums">
                <strong>Estimasi Nilai Order:</strong>{' '}
                <span className="font-bold text-[#236D91] dark:text-[#87CEEB]">
                  {formatRupiah(selectedLead.estimatedValue)}
                </span>{' '}
                ({selectedLead.productCategory})
              </p>
            </div>

            {/* Quick Contact & Workspace Triggers */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
              <a
                href={`tel:${selectedLead.phone}`}
                className="flex flex-col items-center justify-center gap-1 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] py-2.5 font-semibold hover:bg-[var(--color-surface-muted)]"
              >
                <Phone className="h-4 w-4 text-[#348CB2]" />
                <span>Telepon</span>
              </a>
              <a
                href={toWhatsAppUrl(selectedLead.phone)}
                target="_blank"
                rel="noopener noreferrer"
                className="flex flex-col items-center justify-center gap-1 rounded-xl border border-emerald-200 dark:border-emerald-900/50 bg-emerald-50 dark:bg-emerald-950/30 py-2.5 font-semibold text-emerald-700 dark:text-emerald-300"
              >
                <MessageSquare className="h-4 w-4" />
                <span>WhatsApp</span>
              </a>
              <button
                type="button"
                onClick={() => {
                  const target = selectedLead;
                  setSelectedLead(null);
                  onOpenWorkspaceWithLead(target);
                }}
                className="flex flex-col items-center justify-center gap-1 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] py-2.5 font-semibold hover:bg-[var(--color-surface-muted)] cursor-pointer"
              >
                <Mail className="h-4 w-4 text-[#348CB2]" />
                <span>Gmail</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  const target = selectedLead;
                  setSelectedLead(null);
                  onOpenWorkspaceWithLead(target);
                }}
                className="flex flex-col items-center justify-center gap-1 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] py-2.5 font-semibold hover:bg-[var(--color-surface-muted)] cursor-pointer"
              >
                <Calendar className="h-4 w-4 text-[#F97316]" />
                <span>Calendar</span>
              </button>
            </div>

            {/* Editable Status, Date, Notes */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-[var(--color-text-primary)] mb-1">
                  Status Prospek
                </label>
                <select
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value as LeadStatus)}
                  className="w-full rounded-xl border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-3 py-2 text-xs sm:text-sm font-semibold"
                >
                  {LEAD_STATUS_OPTIONS.map((st) => (
                    <option key={st} value={st}>
                      {st}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-[var(--color-text-primary)] mb-1">
                  Tanggal Interaksi
                </label>
                <input
                  type="date"
                  value={editDate}
                  onChange={(e) => setEditDate(e.target.value)}
                  className="w-full rounded-xl border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-3 py-2 text-xs sm:text-sm tabular-nums"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-[var(--color-text-primary)] mb-1">
                Catatan Interaksi Sales
              </label>
              <textarea
                rows={3}
                value={editNotes}
                onChange={(e) => setEditNotes(e.target.value)}
                className="w-full rounded-xl border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-3 py-2 text-xs sm:text-sm"
              />
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-[var(--color-border)]">
              <button
                type="button"
                onClick={() => {
                  const target = {
                    ...selectedLead,
                    status: 'Konversi' as LeadStatus,
                    notes: editNotes.trim(),
                    lastInteractionDate: editDate,
                  };
                  setSelectedLead(null);
                  onConvertLeadToOutlet(target);
                }}
                className="inline-flex items-center gap-1.5 rounded-xl bg-[#F97316] hover:bg-[#EA580C] px-3.5 py-2 text-xs font-bold text-white cursor-pointer"
              >
                <span>Konversi ke Outlet & Order</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedLead(null)}
                  className="rounded-xl border border-[var(--color-border)] px-3.5 py-2 text-xs font-semibold cursor-pointer"
                >
                  Tutup
                </button>
                <button
                  type="button"
                  onClick={handleSaveLeadUpdate}
                  className="rounded-xl bg-[#348CB2] hover:bg-[#236D91] px-4 py-2 text-xs font-bold text-white cursor-pointer"
                >
                  Simpan Perubahan
                </button>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* ===================================================================
          MODAL: TAMBAH LEAD MANUAL
         =================================================================== */}
      <Modal
        open={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        title="Tambah Prospek / Lead Baru"
        subtitle="Catat prospek outlet baru langsung dari lapangan"
        maxWidthClass="max-w-md"
      >
        <form onSubmit={handleCreateManualLead} className="space-y-3">
          <div>
            <label className="block text-xs font-bold mb-1">
              Nama Bisnis / Toko *
            </label>
            <input
              type="text"
              required
              value={newBusinessName}
              onChange={(e) => setNewBusinessName(e.target.value)}
              placeholder="Contoh: Toko Sinar Pagi"
              className="w-full rounded-xl border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-3 py-2 text-xs sm:text-sm"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold mb-1">Nama PIC</label>
              <input
                type="text"
                value={newPicName}
                onChange={(e) => setNewPicName(e.target.value)}
                placeholder="Bapak/Ibu..."
                className="w-full rounded-xl border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-3 py-2 text-xs sm:text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-bold mb-1">
                No. WhatsApp / HP *
              </label>
              <input
                type="tel"
                required
                value={newPhone}
                onChange={(e) => setNewPhone(e.target.value)}
                placeholder="0812-xxxx-xxxx"
                className="w-full rounded-xl border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-3 py-2 text-xs sm:text-sm"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold mb-1">Kota / Area</label>
              <select
                value={newCity}
                onChange={(e) => setNewCity(e.target.value)}
                className="w-full rounded-xl border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-3 py-2 text-xs sm:text-sm"
              >
                <option value="Kota Bogor">Kota Bogor</option>
                <option value="Kab. Bogor">Kab. Bogor</option>
                <option value="Kota Depok">Kota Depok</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold mb-1">
                Kategori Produk
              </label>
              <select
                value={newCategory}
                onChange={(e) =>
                  setNewCategory(e.target.value as LeadRecord['productCategory'])
                }
                className="w-full rounded-xl border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-3 py-2 text-xs sm:text-sm"
              >
                {PRODUCT_CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold mb-1">
                Status Awal
              </label>
              <select
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value as LeadStatus)}
                className="w-full rounded-xl border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-3 py-2 text-xs sm:text-sm"
              >
                {LEAD_STATUS_OPTIONS.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold mb-1">
                Estimasi Nilai (Rp)
              </label>
              <input
                type="number"
                value={newEstValue}
                onChange={(e) => setNewEstValue(e.target.value)}
                className="w-full rounded-xl border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-3 py-2 text-xs sm:text-sm tabular-nums"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold mb-1">Email (Opsional)</label>
            <input
              type="email"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              placeholder="email@toko.com"
              className="w-full rounded-xl border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-3 py-2 text-xs sm:text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-bold mb-1">Alamat</label>
            <input
              type="text"
              value={newAddress}
              onChange={(e) => setNewAddress(e.target.value)}
              placeholder="Jl. ..."
              className="w-full rounded-xl border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-3 py-2 text-xs sm:text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-bold mb-1">Catatan</label>
            <textarea
              rows={2}
              value={newNotes}
              onChange={(e) => setNewNotes(e.target.value)}
              placeholder="Kebutuhan produk, minat promo, atau jadwal follow-up..."
              className="w-full rounded-xl border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-3 py-2 text-xs sm:text-sm"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setAddModalOpen(false)}
              className="rounded-xl border border-[var(--color-border)] px-4 py-2 text-xs font-semibold cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              className="rounded-xl bg-[#348CB2] hover:bg-[#236D91] px-4 py-2 text-xs font-bold text-white cursor-pointer"
            >
              Simpan Lead
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
