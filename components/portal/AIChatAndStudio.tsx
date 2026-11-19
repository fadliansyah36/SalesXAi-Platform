'use client';

import React, { useState, useRef, useEffect } from 'react';
import Markdown from 'react-markdown';
import {
  Bot,
  Send,
  Mic,
  Square,
  Sparkles,
  Image as ImageIcon,
  FileText,
  Video,
  MapPin,
  ExternalLink,
  Copy,
  Check,
  Download,
  Wand2,
  AlertCircle,
  Loader2,
  Share2,
  Pencil,
} from 'lucide-react';
import { Modal } from '@/components/common/Modal';
import { useVoiceRecorder } from '@/components/portal/SalesWorkspaceModals';
import {
  formatRupiah,
  SALES_REP_PROFILE,
  type Outlet,
  type OrderRecord,
} from '@/lib/salesx-data';

interface MapsLink {
  title: string;
  uri: string;
  snippets?: string[];
}

interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  modelUsed?: string;
  mapsLinks?: MapsLink[];
}

interface StudioAsset {
  id: string;
  kind: 'Poster' | 'Caption' | 'Video';
  title: string;
  prompt: string;
  status: 'DRAFT' | 'READY_FOR_PREVIEW' | 'COMPLETED';
  imageUrl?: string;
  videoUrl?: string;
  captionText?: string;
  metaLabel: string;
  createdAt: string;
}

const QUICK_AI_PROMPTS = [
  'Rekomendasi produk untuk outlet',
  'Rencana kunjungan harian',
  'Analisis performa saya',
  'Rekomendasi outlet & rute sekitar Bogor Tengah',
];

function createUniqueId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
}

export function AIChatAndStudio({
  initialMode = 'chat',
  currentPos,
  outlets,
  orders,
  onSwitchMode,
}: {
  initialMode?: 'chat' | 'studio';
  currentPos: { lat: number; lng: number };
  outlets: Outlet[];
  orders: OrderRecord[];
  onSwitchMode?: (mode: 'chat' | 'studio') => void;
}) {
  const [localMode, setLocalMode] = useState<'chat' | 'studio'>(initialMode);
  const activeMode = onSwitchMode ? initialMode : localMode;

  // --- AI Sales Assistant State ---
  const [selectedModel, setSelectedModel] = useState<string>('gemini-4-hydrogen');
  const [useMapsGrounding, setUseMapsGrounding] = useState<boolean>(false);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const [chatError, setChatError] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome-1',
      role: 'model',
      text: `Halo **${SALES_REP_PROFILE.name}**! Saya **Staff AI SalesX-Ai**. Saya siap membantu rekomendasi produk per outlet, menyusun rencana kunjungan harian, menganalisis pencapaian target (${formatRupiah(
        SALES_REP_PROFILE.monthlyRealized
      )} dari ${formatRupiah(
        SALES_REP_PROFILE.monthlyTarget
      )}), serta pencarian lokasi outlet dengan Google Maps.`,
      modelUsed: 'gemini-4-hydrogen',
    },
  ]);
  const chatEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, chatLoading]);

  const chatVoice = useVoiceRecorder((transcript) => {
    setChatInput((prev) => (prev ? `${prev} ${transcript}` : transcript));
  });

  const buildContextSummary = () => {
    const realized = orders
      .filter((o) => o.status !== 'Batal')
      .reduce((acc, o) => acc + o.total, SALES_REP_PROFILE.monthlyRealized);
    const outletSummary = outlets
      .slice(0, 6)
      .map(
        (o) =>
          `- ${o.name} (${o.city}, ${o.distanceKm} km, ${o.isPriority ? 'Prioritas' : 'Reguler'}, Order terakhir ${formatRupiah(o.lastOrderTotal)})`
      )
      .join('\n');
    return `Sales Rep: ${SALES_REP_PROFILE.name} (${SALES_REP_PROFILE.area})\nRealisasi Bulan Ini: ${formatRupiah(realized)} / Target ${formatRupiah(SALES_REP_PROFILE.monthlyTarget)}\nDaftar Outlet:\n${outletSummary}`;
  };

  const handleSendChat = async (overridePrompt?: string) => {
    const promptText = (overridePrompt ?? chatInput).trim();
    if (!promptText || chatLoading) return;

    const userMsg: ChatMessage = {
      id: createUniqueId('user'),
      role: 'user',
      text: promptText,
    };

    const historyForApi = messages
      .filter((m) => m.id !== 'welcome-1')
      .map((m) => ({ role: m.role, text: m.text }));

    setMessages((prev) => [...prev, userMsg]);
    if (!overridePrompt) setChatInput('');
    setChatLoading(true);
    setChatError(null);

    try {
      const res = await fetch('/api/gemini/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: promptText,
          history: historyForApi,
          model: selectedModel,
          useMapsGrounding,
          latLng: {
            latitude: currentPos.lat,
            longitude: currentPos.lng,
          },
          contextSummary: buildContextSummary(),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setChatError(data.error || 'Terjadi kendala saat menghubungi Staff AI.');
      } else {
        const aiMsg: ChatMessage = {
          id: createUniqueId('model'),
          role: 'model',
          text: data.text || 'Maaf, respons tidak tersedia.',
          modelUsed: data.model || selectedModel,
          mapsLinks: data.mapsLinks || [],
        };
        setMessages((prev) => [...prev, aiMsg]);
      }
    } catch {
      setChatError('Koneksi ke server AI gagal. Periksa jaringan Anda.');
    } finally {
      setChatLoading(false);
    }
  };

  // --- AI Content Studio State ---
  const [studioKind, setStudioKind] = useState<'Poster' | 'Caption' | 'Video'>(
    'Poster'
  );
  const [studioPrompt, setStudioPrompt] = useState(
    'Poster promosi Minuman Energi 250 ml diskon 25% untuk toko retail di Bogor dengan nuansa segar cerah.'
  );
  const [imageSize, setImageSize] = useState<'1K' | '2K' | '4K'>('1K');
  const [posterRatio, setPosterRatio] = useState<
    '1:1' | '3:4' | '4:3' | '9:16' | '16:9'
  >('1:1');
  const [videoRatio, setVideoRatio] = useState<'16:9' | '9:16'>('16:9');
  const [studioLoading, setStudioLoading] = useState(false);
  const [studioError, setStudioError] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [shareAsset, setShareAsset] = useState<StudioAsset | null>(null);
  const promptBoxRef = useRef<HTMLTextAreaElement | null>(null);

  const studioVoice = useVoiceRecorder((transcript) => {
    setStudioPrompt((prev) => (prev ? `${prev} ${transcript}` : transcript));
  });

  const [assets, setAssets] = useState<StudioAsset[]>([
    {
      id: 'sample-caption-1',
      kind: 'Caption',
      title: 'Promo Minuman Energi 250 ml',
      prompt: 'Caption WhatsApp promo outlet Bogor',
      status: 'COMPLETED',
      captionText:
        'Stok Minuman Energi 250 ml makin laris! Pesan minimal 5 karton hari ini via SalesX-Ai dan nikmati diskon 20% + poin SmartReward x2.',
      metaLabel: 'Caption · Siap Dibagikan',
      createdAt: 'Hari ini · 09:10',
    },
  ]);

  const handleGenerateStudio = async () => {
    if (!studioPrompt.trim() || studioLoading) return;
    setStudioLoading(true);
    setStudioError(null);

    try {
      if (studioKind === 'Poster') {
        const res = await fetch('/api/gemini/image', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            prompt: studioPrompt,
            imageSize,
            aspectRatio: posterRatio,
          }),
        });
        const data = await res.json();
        if (!res.ok) {
          setStudioError(data.error || 'Gagal membuat poster promosi.');
        } else {
          const newAsset: StudioAsset = {
            id: createUniqueId('img'),
            kind: 'Poster',
            title: studioPrompt.slice(0, 42),
            prompt: studioPrompt,
            status: 'READY_FOR_PREVIEW',
            imageUrl: data.imageUrl,
            captionText: data.caption || undefined,
            metaLabel: `${imageSize} · ${posterRatio} · gemini-3-pro-image-preview`,
            createdAt: 'Baru saja',
          };
          setAssets((prev) => [newAsset, ...prev]);
        }
      } else if (studioKind === 'Caption') {
        const res = await fetch('/api/gemini/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model: 'gemini-4-hydrogen',
            message: `Buatkan 2 variasi caption promosi WhatsApp & Instagram yang persuasif, profesional, berbahasa Indonesia, lengkap dengan ajakan order untuk outlet retail berdasarkan brief: ${studioPrompt}`,
          }),
        });
        const data = await res.json();
        if (!res.ok) {
          setStudioError(data.error || 'Gagal membuat caption promosi.');
        } else {
          const newAsset: StudioAsset = {
            id: createUniqueId('cap'),
            kind: 'Caption',
            title: studioPrompt.slice(0, 42),
            prompt: studioPrompt,
            status: 'READY_FOR_PREVIEW',
            captionText: data.text,
            metaLabel: 'Caption · gemini-4-hydrogen',
            createdAt: 'Baru saja',
          };
          setAssets((prev) => [newAsset, ...prev]);
        }
      } else {
        const res = await fetch('/api/gemini/video', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            prompt: studioPrompt,
            aspectRatio: videoRatio,
          }),
        });
        const data = await res.json();
        if (!res.ok) {
          setStudioError(data.error || 'Gagal menghasilkan video promosi.');
        } else {
          const newAsset: StudioAsset = {
            id: createUniqueId('vid'),
            kind: 'Video',
            title: studioPrompt.slice(0, 42),
            prompt: studioPrompt,
            status: 'READY_FOR_PREVIEW',
            videoUrl: data.videoUrl,
            metaLabel: `Video 8s · ${videoRatio} · gemini-omni-1.2-flash`,
            createdAt: 'Baru saja',
          };
          setAssets((prev) => [newAsset, ...prev]);
        }
      }
    } catch {
      setStudioError('Koneksi ke server Content Studio gagal.');
    } finally {
      setStudioLoading(false);
    }
  };

  const handleMarkCompleted = (id: string) => {
    setAssets((prev) =>
      prev.map((a) => (a.id === id ? { ...a, status: 'COMPLETED' } : a))
    );
  };

  return (
    <div className="space-y-5">
      {/* Mode Switcher */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="inline-flex rounded-xl bg-[var(--color-surface-muted)] p-1">
          <button
            type="button"
            onClick={() => {
              setLocalMode('chat');
              onSwitchMode?.('chat');
            }}
            className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-xs sm:text-sm font-semibold cursor-pointer transition-colors ${
              activeMode === 'chat'
                ? 'bg-[#348CB2] text-white shadow-xs'
                : 'text-[var(--color-text-secondary)]'
            }`}
          >
            <Bot className="h-4 w-4" />
            <span>AI Sales Assistant</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setLocalMode('studio');
              onSwitchMode?.('studio');
            }}
            className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-xs sm:text-sm font-semibold cursor-pointer transition-colors ${
              activeMode === 'studio'
                ? 'bg-[#7C3AED] text-white shadow-xs'
                : 'text-[var(--color-text-secondary)]'
            }`}
          >
            <Wand2 className="h-4 w-4" />
            <span>Content Studio</span>
          </button>
        </div>
      </div>

      {activeMode === 'chat' ? (
        <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] overflow-hidden shadow-xs">
          {/* Header */}
          <div className="border-b border-[var(--color-border)] bg-gradient-to-r from-[#E5F4F8] to-[#F3FAFC] dark:from-[#172438] dark:to-[#111C2D] p-4 sm:p-5 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#348CB2] text-white shadow-xs shrink-0">
                <Bot className="h-6 w-6" />
              </div>
              <div>
                <h2 className="text-base font-bold text-[#123A54] dark:text-white">
                  Halo, saya AI SalesX-Ai
                </h2>
                <p className="text-xs text-[var(--color-text-secondary)]">
                  Siap membantu analisis target, rekomendasi SKU, dan rute
                  kunjungan Anda.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <select
                value={selectedModel}
                onChange={(e) => setSelectedModel(e.target.value)}
                disabled={useMapsGrounding}
                aria-label="Pilih Model Gemini"
                className="rounded-lg border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-2.5 py-1.5 text-xs font-semibold text-[var(--color-text-primary)] disabled:opacity-60"
              >
                <option value="gemini-4-hydrogen">gemini-4-hydrogen (Cerdas)</option>
                <option value="gemini-4-neon">gemini-4-neon (Analitik)</option>
                <option value="gemini-4-carbon">gemini-4-carbon (Cepat)</option>
                <option value="gemini-3.1-flash-lite">
                  gemini-3.1-flash-lite (Ringan)
                </option>
              </select>

              <label className="inline-flex items-center gap-2 rounded-lg border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-3 py-1.5 text-xs font-semibold cursor-pointer">
                <input
                  type="checkbox"
                  checked={useMapsGrounding}
                  onChange={(e) => setUseMapsGrounding(e.target.checked)}
                  className="h-3.5 w-3.5 accent-[#348CB2]"
                />
                <MapPin className="h-3.5 w-3.5 text-[#348CB2]" />
                <span>Google Maps Grounding</span>
              </label>
            </div>
          </div>

          {/* Quick Prompts */}
          <div className="border-b border-[var(--color-border)] bg-[var(--color-background)] px-4 py-3 flex flex-wrap gap-2">
            {QUICK_AI_PROMPTS.map((q) => (
              <button
                key={q}
                type="button"
                onClick={() => handleSendChat(q)}
                className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-1.5 text-xs font-medium text-[#236D91] dark:text-[#87CEEB] hover:border-[#348CB2] hover:bg-[#F3FAFC] dark:hover:bg-[#19394B] cursor-pointer transition-colors"
              >
                {q}
              </button>
            ))}
          </div>

          {/* Chat Thread */}
          <div className="max-h-[420px] overflow-y-auto p-4 sm:p-5 space-y-4">
            {messages.map((m) => (
              <div
                key={m.id}
                className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-3 text-xs sm:text-sm ${
                    m.role === 'user'
                      ? 'bg-[#348CB2] text-white'
                      : 'border border-[var(--color-border)] bg-[var(--color-background)] text-[var(--color-text-primary)]'
                  }`}
                >
                  {m.role === 'model' ? (
                    <div className="prose prose-sm dark:prose-invert max-w-none prose-p:my-1.5 prose-ul:my-1.5">
                      <Markdown>{m.text}</Markdown>
                    </div>
                  ) : (
                    <p className="whitespace-pre-line">{m.text}</p>
                  )}

                  {m.mapsLinks && m.mapsLinks.length > 0 && (
                    <div className="mt-3 pt-2.5 border-t border-[var(--color-border)] space-y-1.5">
                      <p className="text-[11px] font-bold text-[#236D91] dark:text-[#87CEEB]">
                        Referensi Lokasi Google Maps:
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {m.mapsLinks.map((link, idx) => (
                          <a
                            key={`${link.uri}-${idx}`}
                            href={link.uri}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 rounded-lg border border-[#ADD8E6] bg-[var(--color-surface)] px-2.5 py-1 text-[11px] font-semibold text-[#348CB2] hover:underline"
                          >
                            <MapPin className="h-3 w-3" />
                            <span>{link.title}</span>
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        ))}
                      </div>
                    </div>
                  )}

                  {m.modelUsed && (
                    <p className="mt-2 text-[10px] font-mono text-[var(--color-text-muted)]">
                      Model: {m.modelUsed}
                    </p>
                  )}
                </div>
              </div>
            ))}

            {chatLoading && (
              <div className="flex items-center gap-2 text-xs text-[var(--color-text-muted)]">
                <Loader2 className="h-4 w-4 animate-spin text-[#348CB2]" />
                <span>Staff AI sedang menyusun jawaban...</span>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {chatError && (
            <div className="mx-4 mb-3 flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 dark:border-red-900/50 dark:bg-red-950/40 px-3.5 py-2.5 text-xs text-red-700 dark:text-red-300">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{chatError}</span>
            </div>
          )}

          {/* Input Bar */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendChat();
            }}
            className="border-t border-[var(--color-border)] bg-[var(--color-surface)] p-3 sm:p-4 flex items-center gap-2"
          >
            <button
              type="button"
              onClick={chatVoice.recording ? chatVoice.stop : chatVoice.start}
              disabled={chatVoice.transcribing}
              title="Rekam pertanyaan dengan suara"
              className={`inline-flex h-10 w-10 items-center justify-center rounded-xl shrink-0 cursor-pointer transition-colors ${
                chatVoice.recording
                  ? 'bg-red-600 text-white'
                  : 'border border-[var(--color-border-strong)] bg-[var(--color-background)] text-[var(--color-text-primary)] hover:bg-[var(--color-surface-muted)]'
              }`}
            >
              {chatVoice.recording ? (
                <Square className="h-4 w-4" />
              ) : chatVoice.transcribing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Mic className="h-4 w-4" />
              )}
            </button>
            <input
              type="text"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              placeholder={
                chatVoice.transcribing
                  ? 'Mentranskripsikan suara Anda...'
                  : 'Tulis pertanyaan atau rekam suara...'
              }
              className="flex-1 rounded-xl border border-[var(--color-border-strong)] bg-[var(--color-background)] px-3.5 py-2.5 text-xs sm:text-sm focus:border-[#348CB2] focus:outline-none"
            />
            <button
              type="submit"
              disabled={chatLoading || !chatInput.trim()}
              className="inline-flex h-10 items-center justify-center gap-1.5 rounded-xl bg-[#348CB2] hover:bg-[#236D91] disabled:opacity-50 px-4 text-xs sm:text-sm font-bold text-white cursor-pointer shrink-0"
            >
              <Send className="h-4 w-4" />
              <span className="hidden sm:inline">Kirim</span>
            </button>
          </form>
          {chatVoice.error && (
            <p className="px-4 pb-3 text-[11px] text-red-600">
              {chatVoice.error}
            </p>
          )}
        </div>
      ) : (
        /* AI Content Studio (Screen 15 & Mobile 17) */
        <div className="space-y-5">
          {/* Top Gradient Banner & Quick Cards */}
          <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-xs space-y-4">
            <div className="rounded-xl bg-gradient-to-r from-[#7C3AED] via-[#6D28D9] to-[#348CB2] p-5 text-white">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-violet-100">
                <Sparkles className="h-4 w-4" />
                <span>SalesX-Ai Content Studio</span>
              </div>
              <h2 className="mt-1.5 text-lg sm:text-xl font-bold">
                Buat Materi Promosi Outlet dalam Hitungan Detik
              </h2>
              <p className="mt-1 text-xs sm:text-sm text-violet-100">
                Hasilkan Poster resolusi hingga 4K, Caption Media Sosial, dan
                Video Promosi 8 detik untuk dibagikan ke outlet mitra.
              </p>
            </div>

            {/* 4 Quick Template Cards matching UI/UX Screen 15 */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                {
                  label: 'Poster Promosi',
                  kind: 'Poster' as const,
                  prompt:
                    'Poster promosi Minuman Energi 250 ml diskon 25% untuk toko retail modern di Bogor, gaya bersih dan cerah.',
                  icon: ImageIcon,
                },
                {
                  label: 'Caption Media Sosial',
                  kind: 'Caption' as const,
                  prompt:
                    'Caption promosi paket Biskuit Cokelat 100 g Beli 5 Gratis 1 dan poin x2 untuk WhatsApp Broadcast outlet.',
                  icon: FileText,
                },
                {
                  label: 'Flyer / Brosur',
                  kind: 'Poster' as const,
                  prompt:
                    'Flyer katalog harga promo distributor SalesX-Ai untuk produk minuman, biskuit, dan perawatan diri.',
                  icon: Sparkles,
                },
                {
                  label: 'Video Singkat',
                  kind: 'Video' as const,
                  prompt:
                    'Video showcase produk minuman energi dingin segar di rak minimarket dengan tampilan modern dan cerah.',
                  icon: Video,
                },
              ].map((tpl) => {
                const Icon = tpl.icon;
                return (
                  <button
                    key={tpl.label}
                    type="button"
                    onClick={() => {
                      setStudioKind(tpl.kind);
                      setStudioPrompt(tpl.prompt);
                    }}
                    className="flex flex-col items-start gap-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] p-3.5 text-left hover:border-[#7C3AED] hover:bg-[#F5F3FF] dark:hover:bg-[#2E1065]/30 cursor-pointer transition-colors"
                  >
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#EDE9FE] dark:bg-[#4C1D95]/50 text-[#7C3AED] dark:text-[#C4B5FD]">
                      <Icon className="h-4 w-4" />
                    </div>
                    <span className="text-xs font-bold text-[var(--color-text-primary)]">
                      {tpl.label}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Mode Selector (Poster | Caption | Video) */}
            <div className="grid grid-cols-3 gap-2 rounded-xl bg-[var(--color-surface-muted)] p-1">
              {(['Poster', 'Caption', 'Video'] as const).map((kind) => (
                <button
                  key={kind}
                  type="button"
                  onClick={() => setStudioKind(kind)}
                  className={`rounded-lg py-2 text-xs sm:text-sm font-semibold cursor-pointer transition-colors ${
                    studioKind === kind
                      ? 'bg-[#7C3AED] text-white shadow-xs'
                      : 'text-[var(--color-text-secondary)]'
                  }`}
                >
                  {kind}
                </button>
              ))}
            </div>

            {/* Prompt Box */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-[var(--color-text-primary)]">
                  Deskripsi Konten
                </label>
                <button
                  type="button"
                  onClick={
                    studioVoice.recording ? studioVoice.stop : studioVoice.start
                  }
                  disabled={studioVoice.transcribing}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-[#EDE9FE] dark:bg-[#4C1D95]/50 px-2.5 py-1 text-[11px] font-semibold text-[#6D28D9] dark:text-[#DDD6FE] cursor-pointer"
                >
                  {studioVoice.recording ? (
                    <>
                      <Square className="h-3 w-3" />
                      <span>Berhenti</span>
                    </>
                  ) : (
                    <>
                      <Mic className="h-3 w-3" />
                      <span>
                        {studioVoice.transcribing
                          ? 'Mentranskripsi...'
                          : 'Dikte Suara'}
                      </span>
                    </>
                  )}
                </button>
              </div>
              <textarea
                ref={promptBoxRef}
                rows={3}
                value={studioPrompt}
                onChange={(e) => setStudioPrompt(e.target.value)}
                placeholder="Buat poster promosi Minuman Energi diskon 25% untuk outlet..."
                className="w-full rounded-xl border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-3.5 py-2.5 text-xs sm:text-sm focus:border-[#7C3AED] focus:outline-none"
              />
            </div>

            {/* Format / Size Controls */}
            {studioKind === 'Poster' && (
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[var(--color-text-primary)] mb-1.5">
                    Resolusi Gambar
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {(['1K', '2K', '4K'] as const).map((size) => (
                      <button
                        key={size}
                        type="button"
                        onClick={() => setImageSize(size)}
                        className={`rounded-lg border py-2 text-xs font-bold cursor-pointer ${
                          imageSize === size
                            ? 'border-[#7C3AED] bg-[#EDE9FE] text-[#6D28D9] dark:bg-[#4C1D95]/60 dark:text-[#DDD6FE]'
                            : 'border-[var(--color-border)] text-[var(--color-text-secondary)]'
                        }`}
                      >
                        {size}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-[var(--color-text-primary)] mb-1.5">
                    Rasio Aspek
                  </label>
                  <div className="grid grid-cols-5 gap-1.5">
                    {(['1:1', '3:4', '4:3', '9:16', '16:9'] as const).map(
                      (ratio) => (
                        <button
                          key={ratio}
                          type="button"
                          onClick={() => setPosterRatio(ratio)}
                          className={`rounded-lg border py-2 text-xs font-bold tabular-nums cursor-pointer ${
                            posterRatio === ratio
                              ? 'border-[#7C3AED] bg-[#EDE9FE] text-[#6D28D9] dark:bg-[#4C1D95]/60 dark:text-[#DDD6FE]'
                              : 'border-[var(--color-border)] text-[var(--color-text-secondary)]'
                          }`}
                        >
                          {ratio}
                        </button>
                      )
                    )}
                  </div>
                </div>
              </div>
            )}

            {studioKind === 'Video' && (
              <div>
                <label className="block text-xs font-bold text-[var(--color-text-primary)] mb-1.5">
                  Format Rasio Video (8 detik · 720p)
                </label>
                <div className="grid grid-cols-2 gap-2 max-w-xs">
                  {(['16:9', '9:16'] as const).map((ratio) => (
                    <button
                      key={ratio}
                      type="button"
                      onClick={() => setVideoRatio(ratio)}
                      className={`rounded-lg border py-2 text-xs font-bold tabular-nums cursor-pointer ${
                        videoRatio === ratio
                          ? 'border-[#7C3AED] bg-[#EDE9FE] text-[#6D28D9] dark:bg-[#4C1D95]/60 dark:text-[#DDD6FE]'
                          : 'border-[var(--color-border)] text-[var(--color-text-secondary)]'
                      }`}
                    >
                      {ratio === '16:9' ? '16:9 Lanskap' : '9:16 Vertikal'}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {studioError && (
              <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 dark:border-red-900/50 dark:bg-red-950/40 px-4 py-2.5 text-xs text-red-700 dark:text-red-300">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{studioError}</span>
              </div>
            )}

            <button
              type="button"
              onClick={handleGenerateStudio}
              disabled={studioLoading || !studioPrompt.trim()}
              className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-[#7C3AED] hover:bg-[#6D28D9] disabled:opacity-60 py-3 text-sm font-bold text-white shadow-sm cursor-pointer transition-colors"
            >
              {studioLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>
                    {studioKind === 'Video'
                      ? 'Sedang merender video (dapat memakan waktu ~1-2 menit)...'
                      : 'Menghasilkan Konten AI...'}
                  </span>
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  <span>Generate {studioKind}</span>
                </>
              )}
            </button>
          </div>

          {/* Kreasi Terbaru */}
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-sm font-bold text-[#123A54] dark:text-white">
                Kreasi Terbaru ({assets.length})
              </h3>
              <button
                type="button"
                onClick={() => {
                  setStudioPrompt('');
                  promptBoxRef.current?.focus();
                  promptBoxRef.current?.scrollIntoView({
                    behavior: 'smooth',
                    block: 'center',
                  });
                }}
                className="inline-flex items-center gap-1.5 rounded-xl bg-[#348CB2] hover:bg-[#236D91] px-3.5 py-1.5 text-xs font-bold text-white cursor-pointer"
              >
                <Sparkles className="h-3.5 w-3.5" />
                <span>Buat Konten Baru</span>
              </button>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              {assets.map((asset) => (
                <div
                  key={asset.id}
                  className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 space-y-3 shadow-xs"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-xs font-bold text-[var(--color-text-primary)]">
                        {asset.title}
                      </p>
                      <p className="text-[11px] text-[var(--color-text-muted)] mt-0.5">
                        {asset.metaLabel} · {asset.createdAt}
                      </p>
                    </div>
                    <span className="text-[11px] font-bold text-[#7C3AED] dark:text-[#C4B5FD] shrink-0">
                      {asset.status}
                    </span>
                  </div>

                  {asset.imageUrl && (
                    <div className="overflow-hidden rounded-xl border border-[var(--color-border)] bg-[var(--color-background)]">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={asset.imageUrl}
                        alt={asset.title}
                        className="w-full max-h-72 object-contain"
                      />
                    </div>
                  )}

                  {asset.videoUrl && (
                    <video
                      src={asset.videoUrl}
                      controls
                      className="w-full rounded-xl border border-[var(--color-border)] bg-black max-h-72"
                    />
                  )}

                  {asset.captionText && (
                    <div className="rounded-xl bg-[var(--color-background)] p-3 text-xs text-[var(--color-text-secondary)] whitespace-pre-line">
                      {asset.captionText}
                    </div>
                  )}

                  <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                    <div className="flex flex-wrap items-center gap-1.5">
                      {asset.imageUrl && (
                        <a
                          href={asset.imageUrl}
                          download={`salesx-ai-${asset.id}.png`}
                          className="inline-flex items-center gap-1 rounded-lg border border-[var(--color-border)] px-2.5 py-1.5 text-xs font-semibold hover:bg-[var(--color-surface-muted)]"
                        >
                          <Download className="h-3.5 w-3.5" />
                          <span>Unduh</span>
                        </a>
                      )}
                      {asset.captionText && (
                        <button
                          type="button"
                          onClick={() => {
                            navigator.clipboard?.writeText(
                              asset.captionText || ''
                            );
                            setCopiedId(asset.id);
                            setTimeout(() => setCopiedId(null), 2000);
                          }}
                          className="inline-flex items-center gap-1 rounded-lg border border-[var(--color-border)] px-2.5 py-1.5 text-xs font-semibold hover:bg-[var(--color-surface-muted)] cursor-pointer"
                        >
                          {copiedId === asset.id ? (
                            <Check className="h-3.5 w-3.5 text-emerald-600" />
                          ) : (
                            <Copy className="h-3.5 w-3.5" />
                          )}
                          <span>
                            {copiedId === asset.id ? 'Tersalin' : 'Salin Teks'}
                          </span>
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => setShareAsset(asset)}
                        className="inline-flex items-center gap-1 rounded-lg border border-[var(--color-border)] px-2.5 py-1.5 text-xs font-semibold hover:bg-[var(--color-surface-muted)] cursor-pointer"
                      >
                        <Share2 className="h-3.5 w-3.5 text-[#348CB2]" />
                        <span>Bagikan</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setStudioKind(asset.kind);
                          setStudioPrompt(asset.prompt);
                          promptBoxRef.current?.focus();
                          promptBoxRef.current?.scrollIntoView({
                            behavior: 'smooth',
                            block: 'center',
                          });
                        }}
                        className="inline-flex items-center gap-1 rounded-lg border border-[var(--color-border)] px-2.5 py-1.5 text-xs font-semibold hover:bg-[var(--color-surface-muted)] cursor-pointer"
                      >
                        <Pencil className="h-3.5 w-3.5 text-[#7C3AED]" />
                        <span>Edit</span>
                      </button>
                    </div>

                    {asset.status !== 'COMPLETED' && (
                      <button
                        type="button"
                        onClick={() => handleMarkCompleted(asset.id)}
                        className="rounded-lg bg-[#348CB2] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#236D91] cursor-pointer"
                      >
                        Selesaikan Aset
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Modal Bagikan Aset Konten */}
      <Modal
        open={Boolean(shareAsset)}
        onClose={() => setShareAsset(null)}
        title="Bagikan Materi Promosi"
        subtitle={shareAsset?.title || ''}
        maxWidthClass="max-w-md"
      >
        {shareAsset && (
          <div className="space-y-4 text-xs">
            <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] p-3.5 space-y-1">
              <p className="font-bold text-[var(--color-text-primary)]">
                {shareAsset.kind} · {shareAsset.metaLabel}
              </p>
              <p className="text-[var(--color-text-secondary)]">
                {shareAsset.captionText || shareAsset.prompt}
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2.5">
              <a
                href={`https://wa.me/?text=${encodeURIComponent(
                  `${shareAsset.title}\n\n${shareAsset.captionText || shareAsset.prompt}`
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 py-2.5 font-bold text-white"
              >
                <span>Kirim ke WhatsApp</span>
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard?.writeText(
                    shareAsset.captionText || shareAsset.prompt
                  );
                  setShareAsset(null);
                }}
                className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-[#348CB2] text-[#348CB2] py-2.5 font-bold cursor-pointer"
              >
                <Copy className="h-3.5 w-3.5" />
                <span>Salin Teks Promo</span>
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
