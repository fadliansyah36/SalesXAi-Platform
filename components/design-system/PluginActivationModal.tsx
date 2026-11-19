'use client';

import React, { useState } from 'react';
import {
  Mail,
  MapPin,
  Bot,
  Sparkles,
  CheckCircle2,
  Send,
  RefreshCw,
  Search,
  ExternalLink,
  Copy,
  Check,
  ShieldCheck,
} from 'lucide-react';
import { Modal } from '@/components/common/Modal';
import { WorkspaceHubView } from '@/components/portal/SalesWorkspaceModals';
import { SalesGoogleMap } from '@/components/maps/SalesGoogleMap';
import type { Outlet } from '@/lib/salesx-data';

interface PluginActivationModalProps {
  open: boolean;
  onClose: () => void;
  portalName: string;
  outlets: Outlet[];
  defaultTab?: 'workspace' | 'maps' | 'ai' | 'telegram';
  prefillEmailTo?: string;
}

interface PlaceSearchResult {
  id: string;
  displayName?: { text?: string };
  formattedAddress?: string;
  nationalPhoneNumber?: string;
  rating?: number;
  googleMapsUri?: string;
}

export function PluginActivationModal({
  open,
  onClose,
  portalName,
  outlets,
  defaultTab = 'workspace',
  prefillEmailTo,
}: PluginActivationModalProps) {
  const [tab, setTab] = useState<'workspace' | 'maps' | 'ai' | 'telegram'>(
    defaultTab
  );
  const [mapsEnabled, setMapsEnabled] = useState(true);
  const [placesQuery, setPlacesQuery] = useState('Toko Sembako Bogor');
  const [placesResults, setPlacesResults] = useState<PlaceSearchResult[]>([]);
  const [placesLoading, setPlacesLoading] = useState(false);
  const [placesError, setPlacesError] = useState<string | null>(null);

  // Telegram & Webhook plugin state
  const [telegramToken, setTelegramToken] = useState('SX-LINK-9042');
  const [copiedToken, setCopiedToken] = useState(false);
  const [quietHours, setQuietHours] = useState('21:00 – 06:00 WIB');
  const [proactiveAlerts, setProactiveAlerts] = useState({
    orderUpdates: true,
    stockLow: true,
    dailyDigest: true,
    gpsAlerts: true,
  });

  // Gemini AI Plugin test state
  const [aiPrompt, setAiPrompt] = useState(
    `Berikan 3 prioritas tindakan operasional hari ini untuk ${portalName}.`
  );
  const [aiReply, setAiReply] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);

  const handleSearchPlaces = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!placesQuery.trim()) return;
    setPlacesLoading(true);
    setPlacesError(null);
    try {
      const res = await fetch('/api/maps/places-search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          textQuery: placesQuery,
          pageSize: 5,
          locationBias: {
            lat: outlets[0]?.lat ?? -6.597147,
            lng: outlets[0]?.lng ?? 106.806039,
            radiusMeters: 15000,
          },
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setPlacesError(data.error || 'Gagal mencari lokasi via Places API.');
      } else {
        setPlacesResults(data.places || []);
      }
    } catch {
      setPlacesError('Koneksi ke server Google Maps Places gagal.');
    } finally {
      setPlacesLoading(false);
    }
  };

  const handleTestAi = async () => {
    setAiLoading(true);
    try {
      const res = await fetch('/api/gemini/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'gemini-4-hydrogen',
          message: aiPrompt,
          contextSummary: `Portal aktif: ${portalName}. Jumlah outlet terdaftar: ${outlets.length}.`,
        }),
      });
      const data = await res.json();
      setAiReply(
        data.text ||
          data.error ||
          'Staff AI SalesX-Ai siap membantu analitik operasional Anda.'
      );
    } catch {
      setAiReply('Koneksi ke server Gemini AI terputus.');
    } finally {
      setAiLoading(false);
    }
  };

  const handleCopyToken = () => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(telegramToken).catch(() => {});
    }
    setCopiedToken(true);
    setTimeout(() => setCopiedToken(false), 1800);
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`Aktivasi Plugin & Ekosistem — ${portalName}`}
      subtitle="Kelola koneksi Google Workspace, Google Maps Platform, Gemini AI, dan Telegram Bot"
      maxWidthClass="max-w-3xl"
    >
      <div className="space-y-4">
        {/* Plugin Tabs */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 rounded-xl bg-[var(--color-surface-muted)] p-1 text-xs font-semibold">
          <button
            type="button"
            onClick={() => setTab('workspace')}
            className={`inline-flex items-center justify-center gap-1.5 rounded-lg py-2 px-2 transition-colors cursor-pointer ${
              tab === 'workspace'
                ? 'bg-[#194F70] text-white shadow-xs'
                : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
            }`}
          >
            <Mail className="h-3.5 w-3.5" />
            <span>Google Workspace</span>
          </button>
          <button
            type="button"
            onClick={() => setTab('maps')}
            className={`inline-flex items-center justify-center gap-1.5 rounded-lg py-2 px-2 transition-colors cursor-pointer ${
              tab === 'maps'
                ? 'bg-[#194F70] text-white shadow-xs'
                : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
            }`}
          >
            <MapPin className="h-3.5 w-3.5" />
            <span>Google Maps</span>
          </button>
          <button
            type="button"
            onClick={() => setTab('ai')}
            className={`inline-flex items-center justify-center gap-1.5 rounded-lg py-2 px-2 transition-colors cursor-pointer ${
              tab === 'ai'
                ? 'bg-[#194F70] text-white shadow-xs'
                : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
            }`}
          >
            <Sparkles className="h-3.5 w-3.5" />
            <span>Gemini AI</span>
          </button>
          <button
            type="button"
            onClick={() => setTab('telegram')}
            className={`inline-flex items-center justify-center gap-1.5 rounded-lg py-2 px-2 transition-colors cursor-pointer ${
              tab === 'telegram'
                ? 'bg-[#194F70] text-white shadow-xs'
                : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
            }`}
          >
            <Bot className="h-3.5 w-3.5" />
            <span>Telegram & API</span>
          </button>
        </div>

        {/* Tab 1: Google Workspace */}
        {tab === 'workspace' && (
          <div className="space-y-3">
            <div className="flex items-start gap-2.5 rounded-xl border border-[#ADD8E6] bg-[#F3FAFC] dark:bg-[#172438] p-3.5 text-xs text-[#194F70] dark:text-[#87CEEB]">
              <ShieldCheck className="h-4 w-4 shrink-0 mt-0.5" />
              <span>
                Autentikasi Google Workspace menggunakan Firebase OAuth resmi
                dengan penyimpanan token di memori dan konfirmasi eksplisit
                sebelum mengirim Gmail, membuat jadwal Calendar, atau ruang Meet.
              </span>
            </div>
            <WorkspaceHubView
              outlets={outlets}
              prefillEmailTo={prefillEmailTo}
            />
          </div>
        )}

        {/* Tab 2: Google Maps Platform */}
        {tab === 'maps' && (
          <div className="space-y-4 text-xs">
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] p-4">
              <div>
                <p className="font-bold text-sm text-[var(--color-text-primary)]">
                  Google Maps Platform (Maps JS · Routes API · Places API New)
                </p>
                <p className="text-[var(--color-text-secondary)] mt-0.5">
                  Aktif untuk pemetaan cakupan outlet, rute pengiriman, live
                  tracking supervisor, dan penemuan prospek outlet baru.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setMapsEnabled((v) => !v)}
                className={`rounded-xl px-3.5 py-2 font-bold cursor-pointer ${
                  mapsEnabled
                    ? 'bg-[#ECFDF5] text-[#047857] border border-[#A7F3D0]'
                    : 'bg-[var(--color-surface-muted)] text-[var(--color-text-secondary)] border border-[var(--color-border)]'
                }`}
              >
                {mapsEnabled ? 'Plugin Aktif' : 'Aktifkan Maps'}
              </button>
            </div>

            {mapsEnabled && (
              <>
                <SalesGoogleMap
                  currentPos={{
                    lat: outlets[0]?.lat ?? -6.595204,
                    lng: outlets[0]?.lng ?? 106.797781,
                  }}
                  outlets={outlets}
                  selectedOutlet={outlets[0] ?? null}
                  onSelectOutlet={() => {}}
                  heightClass="h-[240px]"
                />

                <form
                  onSubmit={handleSearchPlaces}
                  className="flex flex-col sm:flex-row gap-2"
                >
                  <div className="relative flex-1 min-w-0">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--color-text-muted)]" />
                    <input
                      type="text"
                      value={placesQuery}
                      onChange={(e) => setPlacesQuery(e.target.value)}
                      placeholder="Uji Places API (contoh: Minimarket Bogor)"
                      className="w-full rounded-xl border border-[var(--color-border-strong)] bg-[var(--color-surface)] pl-9 pr-3 py-2.5"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={placesLoading}
                    className="w-full sm:w-auto rounded-xl bg-[#194F70] hover:bg-[#123A54] px-4 py-2.5 font-bold text-white cursor-pointer"
                  >
                    {placesLoading ? 'Mencari...' : 'Cari via Places API'}
                  </button>
                </form>

                {placesError && (
                  <p className="rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 p-3 text-amber-800 dark:text-amber-300">
                    {placesError}
                  </p>
                )}

                {placesResults.length > 0 && (
                  <div className="space-y-2">
                    {placesResults.map((p) => (
                      <div
                        key={p.id}
                        className="flex items-center justify-between gap-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-3"
                      >
                        <div className="min-w-0">
                          <p className="font-bold truncate">
                            {p.displayName?.text || 'Outlet Terdaftar'}
                          </p>
                          <p className="text-[11px] text-[var(--color-text-secondary)] truncate">
                            {p.formattedAddress}
                          </p>
                          {p.nationalPhoneNumber && (
                            <p className="text-[11px] font-mono text-[#348CB2] mt-0.5">
                              {p.nationalPhoneNumber}
                            </p>
                          )}
                        </div>
                        {p.googleMapsUri && (
                          <a
                            href={p.googleMapsUri}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#348CB2] hover:underline shrink-0"
                          >
                            <span>Maps</span>
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* Tab 3: Gemini AI */}
        {tab === 'ai' && (
          <div className="space-y-4 text-xs">
            <div className="rounded-xl border border-[#ADD8E6] bg-[#F3FAFC] dark:bg-[#172438] p-4 flex flex-wrap items-center justify-between gap-3">
              <div className="min-w-0 flex-1">
                <p className="font-bold text-sm text-[#123A54] dark:text-white">
                  Unified AI Orchestrator (Gemini Server-Side Proxy)
                </p>
                <p className="text-[var(--color-text-secondary)] mt-0.5">
                  Kalkulasi stok, harga, dan komisi tetap dikendalikan business
                  rules deterministik. AI membantu analisis & rekomendasi.
                </p>
              </div>
              <span className="inline-flex items-center gap-1 rounded-md bg-[#ECFDF5] px-2.5 py-1 text-[11px] font-bold text-[#047857] shrink-0">
                <CheckCircle2 className="h-3.5 w-3.5" />
                <span>Terhubung</span>
              </span>
            </div>

            <div className="space-y-2">
              <label className="block font-bold">
                Uji Konsultasi Staff AI ({portalName})
              </label>
              <textarea
                rows={3}
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                className="w-full rounded-xl border border-[var(--color-border-strong)] bg-[var(--color-surface)] p-3"
              />
              <button
                type="button"
                onClick={handleTestAi}
                disabled={aiLoading}
                className="inline-flex items-center gap-2 rounded-xl bg-[#194F70] hover:bg-[#123A54] px-4 py-2.5 font-bold text-white cursor-pointer"
              >
                <Send className="h-3.5 w-3.5" />
                <span>{aiLoading ? 'Memproses...' : 'Kirim ke Gemini AI'}</span>
              </button>
            </div>

            {aiReply && (
              <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] p-4 whitespace-pre-line leading-relaxed">
                {aiReply}
              </div>
            )}
          </div>
        )}

        {/* Tab 4: Telegram & Webhook */}
        {tab === 'telegram' && (
          <div className="space-y-4 text-xs">
            <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] p-4 space-y-3">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <p className="font-bold text-sm">
                    Telegram Proactive Assistant (@SalesXAiBot)
                  </p>
                  <p className="text-[var(--color-text-secondary)]">
                    Gunakan One-Time Link Token untuk menghubungkan akun Anda.
                  </p>
                </div>
                <span className="rounded-md bg-[#ECFDF5] px-2 py-1 text-[11px] font-bold text-[#047857] shrink-0">
                  Siap Ditautkan
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <input
                  readOnly
                  value={`/start ${telegramToken}`}
                  className="min-w-0 w-full sm:flex-1 rounded-xl border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-3 py-2.5 font-mono text-[11px]"
                />
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <button
                    type="button"
                    onClick={handleCopyToken}
                    className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1 rounded-xl border border-[var(--color-border-strong)] px-3 py-2 font-semibold cursor-pointer"
                  >
                    {copiedToken ? (
                      <Check className="h-3.5 w-3.5 text-[#10B981]" />
                    ) : (
                      <Copy className="h-3.5 w-3.5" />
                    )}
                    <span>{copiedToken ? 'Disalin' : 'Salin'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setTelegramToken(
                        `SX-LINK-${Math.floor(1000 + Math.random() * 9000)}`
                      )
                    }
                    className="rounded-xl border border-[var(--color-border-strong)] p-2.5 text-[#348CB2] cursor-pointer"
                    title="Buat ulang token"
                  >
                    <RefreshCw className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                {[
                  {
                    key: 'orderUpdates' as const,
                    label: 'Notifikasi Order & Fulfillment',
                  },
                  {
                    key: 'stockLow' as const,
                    label: 'Alert Stok Menipis / Habis',
                  },
                  {
                    key: 'dailyDigest' as const,
                    label: 'Ringkasan Harian (/daily)',
                  },
                  {
                    key: 'gpsAlerts' as const,
                    label: 'Peringatan Shift & GPS Tim',
                  },
                ].map((opt) => (
                  <label
                    key={opt.key}
                    className="flex items-center justify-between rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2.5 cursor-pointer"
                  >
                    <span className="font-medium">{opt.label}</span>
                    <input
                      type="checkbox"
                      checked={proactiveAlerts[opt.key]}
                      onChange={(e) =>
                        setProactiveAlerts((prev) => ({
                          ...prev,
                          [opt.key]: e.target.checked,
                        }))
                      }
                      className="h-4 w-4 accent-[#348CB2]"
                    />
                  </label>
                ))}
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-[var(--color-border)]">
                <span className="text-[var(--color-text-muted)]">
                  Quiet Hours Aktif: <strong>{quietHours}</strong>
                </span>
                <select
                  value={quietHours}
                  onChange={(e) => setQuietHours(e.target.value)}
                  className="w-full sm:w-auto rounded-lg border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-2.5 py-2 text-[11px]"
                >
                  <option value="21:00 – 06:00 WIB">21:00 – 06:00 WIB</option>
                  <option value="22:00 – 05:30 WIB">22:00 – 05:30 WIB</option>
                  <option value="Nonaktif (24 Jam)">Nonaktif (24 Jam)</option>
                </select>
              </div>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}
