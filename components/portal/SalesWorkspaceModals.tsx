'use client';

import React, { useState, useRef } from 'react';
import {
  Mail,
  Calendar,
  Video,
  CheckCircle2,
  Send,
  ExternalLink,
  RefreshCw,
  LogOut,
  MapPin,
  Phone,
  ShoppingCart,
  Navigation,
  Camera,
  Mic,
  Square,
  Plus,
  Copy,
  Check,
  Clock,
  Store,
  AlertCircle,
  X,
  Gift,
  Award,
  ShieldCheck,
  HelpCircle,
  MessageSquare,
  Tag,
  Package,
  Info,
} from 'lucide-react';
import { Modal } from '@/components/common/Modal';
import { SalesGoogleMap } from '@/components/maps/SalesGoogleMap';
import {
  formatRupiah,
  type Outlet,
  type OrderRecord,
  type VisitItem,
  type Product,
  type PromotionItem,
  type RewardItem,
  type RewardLedgerEntry,
} from '@/lib/salesx-data';
import {
  signInWithGoogleWorkspace,
  signOutGoogleWorkspace,
  getWorkspaceAccessToken,
  getCurrentWorkspaceUser,
} from '@/lib/firebase-workspace';

// Helper to record microphone audio and send to /api/gemini/transcribe
export function useVoiceRecorder(onTranscript: (text: string) => void) {
  const [recording, setRecording] = useState(false);
  const [transcribing, setTranscribing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const start = async () => {
    setError(null);
    if (
      typeof navigator === 'undefined' ||
      !navigator.mediaDevices?.getUserMedia
    ) {
      setError('Mikrofon tidak didukung pada peramban ini.');
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      chunksRef.current = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      recorder.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(chunksRef.current, {
          type: recorder.mimeType || 'audio/webm',
        });
        setTranscribing(true);
        try {
          const buffer = await blob.arrayBuffer();
          const bytes = new Uint8Array(buffer);
          let binary = '';
          for (let i = 0; i < bytes.byteLength; i++) {
            binary += String.fromCharCode(bytes[i]);
          }
          const audioBase64 = btoa(binary);
          const res = await fetch('/api/gemini/transcribe', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              audioBase64,
              mimeType: blob.type || 'audio/webm',
            }),
          });
          const data = await res.json();
          if (!res.ok) {
            setError(data.error || 'Gagal mentranskripsikan suara.');
          } else if (data.transcript) {
            onTranscript(data.transcript);
          }
        } catch {
          setError('Gagal menghubungi layanan transkripsi.');
        } finally {
          setTranscribing(false);
        }
      };
      recorderRef.current = recorder;
      recorder.start();
      setRecording(true);
    } catch {
      setError('Izin mikrofon ditolak atau tidak tersedia.');
    }
  };

  const stop = () => {
    if (recorderRef.current && recorderRef.current.state !== 'inactive') {
      recorderRef.current.stop();
    }
    setRecording(false);
  };

  return { recording, transcribing, error, start, stop };
}

/* ============================================================================
 * 1. GOOGLE WORKSPACE HUB (Gmail, Calendar, Meet)
 * ============================================================================ */
interface GmailMessageItem {
  id: string;
  subject: string;
  from: string;
  date: string;
  snippet: string;
}

interface CalendarEventItem {
  id: string;
  summary?: string;
  location?: string;
  htmlLink?: string;
  start?: { dateTime?: string; date?: string };
}

export function WorkspaceHubView({
  outlets,
  prefillEmailTo,
  prefillCalendarOutlet,
}: {
  outlets: Outlet[];
  prefillEmailTo?: string;
  prefillCalendarOutlet?: Outlet | null;
}) {
  const [wsTab, setWsTab] = useState<'gmail' | 'calendar' | 'meet'>('gmail');
  const [token, setToken] = useState<string | null>(() =>
    getWorkspaceAccessToken()
  );
  const [userDisplay, setUserDisplay] = useState<{
    name: string;
    email: string;
  } | null>(() => {
    const u = getCurrentWorkspaceUser();
    return u
      ? {
          name: u.displayName || 'SalesX-Ai User',
          email: u.email || '',
        }
      : null;
  });
  const [authLoading, setAuthLoading] = useState(false);
  const [wsError, setWsError] = useState<string | null>(null);
  const [wsNotice, setWsNotice] = useState<string | null>(null);

  // Gmail State
  const [gmailMessages, setGmailMessages] = useState<GmailMessageItem[]>([]);
  const [gmailLoading, setGmailLoading] = useState(false);
  const [emailTo, setEmailTo] = useState(
    prefillEmailTo || outlets[0]?.email || 'toko.makmurjaya@example.com'
  );
  const [emailSubject, setEmailSubject] = useState(
    'Ringkasan Order & Promo SalesX-Ai Area Bogor'
  );
  const [emailBody, setEmailBody] = useState(
    'Halo Bapak/Ibu PIC Outlet,\n\nBerikut ringkasan kunjungan serta penawaran promo Minuman Energi 250 ml (diskon 20%) minggu ini. Silakan konfirmasi kebutuhan restock Anda.\n\nSalam,\nBudi Santoso — SalesX-Ai'
  );
  const [confirmEmailModal, setConfirmEmailModal] = useState(false);
  const [sendingEmail, setSendingEmail] = useState(false);

  // Calendar State
  const [events, setEvents] = useState<CalendarEventItem[]>([]);
  const [calendarLoading, setCalendarLoading] = useState(false);
  const [eventSummary, setEventSummary] = useState(
    prefillCalendarOutlet
      ? `Kunjungan Sales: ${prefillCalendarOutlet.name}`
      : 'Kunjungan Sales: Toko Makmur Jaya'
  );
  const [eventLocation, setEventLocation] = useState(
    prefillCalendarOutlet?.address || outlets[0]?.address || 'Bogor'
  );
  const [eventDate, setEventDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().slice(0, 10);
  });
  const [eventTime, setEventTime] = useState('09:30');
  const [eventDesc, setEventDesc] = useState(
    'Follow-up reorder produk Best Seller & cek display rak program Q4.'
  );
  const [confirmCalendarModal, setConfirmCalendarModal] = useState(false);
  const [creatingEvent, setCreatingEvent] = useState(false);

  // Meet State
  const [meetUrl, setMeetUrl] = useState<string | null>(null);
  const [creatingMeet, setCreatingMeet] = useState(false);
  const [copiedMeet, setCopiedMeet] = useState(false);

  const handleConnectGoogle = async () => {
    setAuthLoading(true);
    setWsError(null);
    try {
      const { user, accessToken } = await signInWithGoogleWorkspace();
      setToken(accessToken);
      setUserDisplay({
        name: user.displayName || 'SalesX-Ai Representative',
        email: user.email || '',
      });
      setWsNotice('Akun Google Workspace berhasil terhubung.');
    } catch (err) {
      setWsError(
        err instanceof Error
          ? err.message
          : 'Gagal menghubungkan akun Google Workspace.'
      );
    } finally {
      setAuthLoading(false);
    }
  };

  const handleDisconnect = async () => {
    await signOutGoogleWorkspace();
    setToken(null);
    setUserDisplay(null);
    setGmailMessages([]);
    setEvents([]);
    setMeetUrl(null);
  };

  const fetchGmailInbox = async () => {
    if (!token) return;
    setGmailLoading(true);
    setWsError(null);
    try {
      const res = await fetch('/api/workspace/gmail', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) {
        setWsError(data.error || 'Gagal memuat kotak masuk Gmail.');
      } else {
        setGmailMessages(data.messages || []);
      }
    } catch {
      setWsError('Koneksi ke Gmail API gagal.');
    } finally {
      setGmailLoading(false);
    }
  };

  const executeSendEmail = async () => {
    if (!token) return;
    setSendingEmail(true);
    setWsError(null);
    try {
      const res = await fetch('/api/workspace/gmail', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to: emailTo,
          subject: emailSubject,
          body: emailBody,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setWsError(data.error || 'Gagal mengirim email Gmail.');
      } else {
        setWsNotice(`Email berhasil dikirim ke ${emailTo}.`);
        setConfirmEmailModal(false);
      }
    } catch {
      setWsError('Koneksi saat mengirim email gagal.');
    } finally {
      setSendingEmail(false);
    }
  };

  const fetchCalendarEvents = async () => {
    if (!token) return;
    setCalendarLoading(true);
    setWsError(null);
    try {
      const res = await fetch('/api/workspace/calendar', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) {
        setWsError(data.error || 'Gagal memuat jadwal Google Calendar.');
      } else {
        setEvents(data.items || []);
      }
    } catch {
      setWsError('Koneksi ke Google Calendar API gagal.');
    } finally {
      setCalendarLoading(false);
    }
  };

  const executeCreateEvent = async () => {
    if (!token) return;
    setCreatingEvent(true);
    setWsError(null);
    try {
      const startIso = `${eventDate}T${eventTime}:00+07:00`;
      const startDateObj = new Date(startIso);
      const endDateObj = new Date(startDateObj.getTime() + 45 * 60 * 1000);
      const res = await fetch('/api/workspace/calendar', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          summary: eventSummary,
          location: eventLocation,
          description: eventDesc,
          startIso: startDateObj.toISOString(),
          endIso: endDateObj.toISOString(),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setWsError(data.error || 'Gagal membuat acara Google Calendar.');
      } else {
        setWsNotice(`Jadwal "${eventSummary}" berhasil ditambahkan ke Calendar.`);
        setConfirmCalendarModal(false);
        fetchCalendarEvents();
      }
    } catch {
      setWsError('Gagal menghubungi Google Calendar API.');
    } finally {
      setCreatingEvent(false);
    }
  };

  const handleCreateMeet = async () => {
    if (!token) return;
    setCreatingMeet(true);
    setWsError(null);
    try {
      const res = await fetch('/api/workspace/meet', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) {
        setWsError(data.error || 'Gagal membuat ruang Google Meet.');
      } else {
        setMeetUrl(data.space?.meetingUri || null);
        setWsNotice('Ruang rapat Google Meet baru berhasil dibuat.');
      }
    } catch {
      setWsError('Koneksi ke Google Meet API gagal.');
    } finally {
      setCreatingMeet(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* Connection Card */}
      <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-[#123A54] dark:text-white">
              Integrasi Google Workspace
            </h2>
            <p className="text-xs sm:text-sm text-[var(--color-text-secondary)] mt-0.5">
              Hubungkan Gmail, Google Calendar, dan Google Meet langsung dari
              Sales Portal.
            </p>
          </div>

          {!token ? (
            <button
              type="button"
              onClick={handleConnectGoogle}
              disabled={authLoading}
              className="gsi-material-button"
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
                {authLoading ? 'Menghubungkan...' : 'Sign in with Google'}
              </span>
            </button>
          ) : (
            <div className="flex items-center gap-3">
              <div className="text-right">
                <p className="text-xs font-bold text-[var(--color-text-primary)]">
                  {userDisplay?.name}
                </p>
                <p className="text-[11px] text-[var(--color-text-muted)]">
                  {userDisplay?.email}
                </p>
              </div>
              <button
                type="button"
                onClick={handleDisconnect}
                className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 dark:border-red-900/60 px-3 py-2 text-xs font-semibold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 cursor-pointer"
              >
                <LogOut className="h-3.5 w-3.5" />
                <span>Putuskan</span>
              </button>
            </div>
          )}
        </div>

        {wsError && (
          <div className="mt-4 rounded-xl border border-red-200 bg-red-50 dark:border-red-900/50 dark:bg-red-950/40 px-4 py-2.5 text-xs text-red-700 dark:text-red-300">
            {wsError}
          </div>
        )}
        {wsNotice && (
          <div className="mt-4 flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 dark:border-emerald-900/50 dark:bg-emerald-950/40 px-4 py-2.5 text-xs text-emerald-700 dark:text-emerald-300">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            <span>{wsNotice}</span>
          </div>
        )}
      </div>

      {/* Sub-tabs */}
      <div className="grid grid-cols-3 gap-2 rounded-xl bg-[var(--color-surface-muted)] p-1.5">
        {[
          { id: 'gmail' as const, label: 'Gmail', icon: Mail },
          { id: 'calendar' as const, label: 'Calendar', icon: Calendar },
          { id: 'meet' as const, label: 'Google Meet', icon: Video },
        ].map((item) => {
          const Icon = item.icon;
          const active = wsTab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setWsTab(item.id)}
              className={`inline-flex items-center justify-center gap-2 rounded-lg py-2.5 text-xs sm:text-sm font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                active
                  ? 'bg-[#348CB2] text-white shadow-xs'
                  : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
              }`}
            >
              <Icon className="h-4 w-4 shrink-0" />
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>

      {!token ? (
        <div className="rounded-2xl border border-dashed border-[var(--color-border-strong)] bg-[var(--color-surface)] p-8 text-center">
          <p className="text-sm font-semibold text-[var(--color-text-primary)]">
            Masuk dengan Akun Google Anda untuk Mengaktifkan Workspace
          </p>
          <p className="mt-1 text-xs text-[var(--color-text-secondary)] max-w-md mx-auto">
            Setelah masuk menggunakan tombol Sign in with Google di atas, Anda
            dapat membaca/mengirim Gmail, menjadwalkan kunjungan ke Google
            Calendar, dan membuat link Google Meet instan.
          </p>
        </div>
      ) : (
        <>
          {wsTab === 'gmail' && (
            <div className="grid gap-5 lg:grid-cols-2">
              {/* Inbox */}
              <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-[var(--color-text-primary)]">
                    Kotak Masuk Terbaru
                  </h3>
                  <button
                    type="button"
                    onClick={fetchGmailInbox}
                    disabled={gmailLoading}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--color-border)] px-3 py-1.5 text-xs font-semibold hover:bg-[var(--color-surface-muted)] cursor-pointer"
                  >
                    <RefreshCw
                      className={`h-3.5 w-3.5 ${gmailLoading ? 'animate-spin' : ''}`}
                    />
                    <span>Muat Email</span>
                  </button>
                </div>

                {gmailMessages.length === 0 ? (
                  <p className="rounded-xl bg-[var(--color-background)] p-4 text-xs text-[var(--color-text-muted)]">
                    Klik &ldquo;Muat Email&rdquo; untuk membaca 5 pesan terbaru
                    dari kotak masuk Gmail Anda.
                  </p>
                ) : (
                  <div className="space-y-2.5">
                    {gmailMessages.map((msg) => (
                      <div
                        key={msg.id}
                        className="rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] p-3"
                      >
                        <p className="text-xs font-bold text-[var(--color-text-primary)] line-clamp-1">
                          {msg.subject}
                        </p>
                        <p className="text-[11px] text-[#348CB2] dark:text-[#87CEEB] mt-0.5 line-clamp-1">
                          {msg.from}
                        </p>
                        <p className="text-xs text-[var(--color-text-secondary)] mt-1 line-clamp-2">
                          {msg.snippet}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Compose Gmail */}
              <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 space-y-3.5">
                <h3 className="text-sm font-bold text-[var(--color-text-primary)]">
                  Kirim Email Follow-up Outlet
                </h3>
                <div>
                  <label className="block text-xs font-semibold text-[var(--color-text-secondary)] mb-1">
                    Kepada (Email Outlet)
                  </label>
                  <input
                    type="email"
                    value={emailTo}
                    onChange={(e) => setEmailTo(e.target.value)}
                    className="w-full rounded-xl border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-3 py-2 text-xs sm:text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[var(--color-text-secondary)] mb-1">
                    Subjek
                  </label>
                  <input
                    type="text"
                    value={emailSubject}
                    onChange={(e) => setEmailSubject(e.target.value)}
                    className="w-full rounded-xl border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-3 py-2 text-xs sm:text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[var(--color-text-secondary)] mb-1">
                    Isi Pesan
                  </label>
                  <textarea
                    rows={4}
                    value={emailBody}
                    onChange={(e) => setEmailBody(e.target.value)}
                    className="w-full rounded-xl border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-3 py-2 text-xs sm:text-sm"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => setConfirmEmailModal(true)}
                  className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-[#348CB2] hover:bg-[#236D91] py-2.5 text-sm font-bold text-white cursor-pointer"
                >
                  <Send className="h-4 w-4" />
                  <span>Tinjau & Kirim Email</span>
                </button>
              </div>
            </div>
          )}

          {wsTab === 'calendar' && (
            <div className="grid gap-5 lg:grid-cols-2">
              <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-[var(--color-text-primary)]">
                    Agenda Google Calendar Mendatang
                  </h3>
                  <button
                    type="button"
                    onClick={fetchCalendarEvents}
                    disabled={calendarLoading}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--color-border)] px-3 py-1.5 text-xs font-semibold hover:bg-[var(--color-surface-muted)] cursor-pointer"
                  >
                    <RefreshCw
                      className={`h-3.5 w-3.5 ${calendarLoading ? 'animate-spin' : ''}`}
                    />
                    <span>Sinkronkan</span>
                  </button>
                </div>

                {events.length === 0 ? (
                  <p className="rounded-xl bg-[var(--color-background)] p-4 text-xs text-[var(--color-text-muted)]">
                    Klik &ldquo;Sinkronkan&rdquo; untuk menampilkan daftar jadwal
                    kunjungan dari Google Calendar Anda.
                  </p>
                ) : (
                  <div className="space-y-2.5">
                    {events.map((ev) => (
                      <div
                        key={ev.id}
                        className="rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] p-3 flex items-start justify-between gap-2"
                      >
                        <div>
                          <p className="text-xs font-bold text-[var(--color-text-primary)]">
                            {ev.summary || '(Acara Tanpa Judul)'}
                          </p>
                          <p className="text-[11px] text-[var(--color-text-secondary)] mt-0.5 tabular-nums">
                            {ev.start?.dateTime
                              ? new Date(ev.start.dateTime).toLocaleString(
                                  'id-ID'
                                )
                              : ev.start?.date}
                          </p>
                          {ev.location && (
                            <p className="text-[11px] text-[var(--color-text-muted)] mt-0.5">
                              {ev.location}
                            </p>
                          )}
                        </div>
                        {ev.htmlLink && (
                          <a
                            href={ev.htmlLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs font-semibold text-[#348CB2] hover:underline shrink-0"
                          >
                            Buka
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Create Calendar Event */}
              <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 space-y-3.5">
                <h3 className="text-sm font-bold text-[var(--color-text-primary)]">
                  Jadwalkan Kunjungan di Google Calendar
                </h3>
                <div>
                  <label className="block text-xs font-semibold text-[var(--color-text-secondary)] mb-1">
                    Judul Kunjungan
                  </label>
                  <input
                    type="text"
                    value={eventSummary}
                    onChange={(e) => setEventSummary(e.target.value)}
                    className="w-full rounded-xl border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-3 py-2 text-xs sm:text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[var(--color-text-secondary)] mb-1">
                    Lokasi Outlet
                  </label>
                  <input
                    type="text"
                    value={eventLocation}
                    onChange={(e) => setEventLocation(e.target.value)}
                    className="w-full rounded-xl border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-3 py-2 text-xs sm:text-sm"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-[var(--color-text-secondary)] mb-1">
                      Tanggal
                    </label>
                    <input
                      type="date"
                      value={eventDate}
                      onChange={(e) => setEventDate(e.target.value)}
                      className="w-full rounded-xl border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-3 py-2 text-xs sm:text-sm tabular-nums"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[var(--color-text-secondary)] mb-1">
                      Jam Mulai (WIB)
                    </label>
                    <input
                      type="time"
                      value={eventTime}
                      onChange={(e) => setEventTime(e.target.value)}
                      className="w-full rounded-xl border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-3 py-2 text-xs sm:text-sm tabular-nums"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[var(--color-text-secondary)] mb-1">
                    Agenda
                  </label>
                  <textarea
                    rows={2}
                    value={eventDesc}
                    onChange={(e) => setEventDesc(e.target.value)}
                    className="w-full rounded-xl border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-3 py-2 text-xs sm:text-sm"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => setConfirmCalendarModal(true)}
                  className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-[#348CB2] hover:bg-[#236D91] py-2.5 text-sm font-bold text-white cursor-pointer"
                >
                  <Calendar className="h-4 w-4" />
                  <span>Tinjau & Buat Jadwal</span>
                </button>
              </div>
            </div>
          )}

          {wsTab === 'meet' && (
            <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h3 className="text-base font-bold text-[var(--color-text-primary)]">
                    Ruang Rapat Google Meet Instan
                  </h3>
                  <p className="text-xs sm:text-sm text-[var(--color-text-secondary)] mt-0.5">
                    Buat tautan pertemuan video cepat untuk koordinasi dengan PIC
                    outlet atau supervisor area.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleCreateMeet}
                  disabled={creatingMeet}
                  className="inline-flex items-center gap-2 rounded-xl bg-[#348CB2] hover:bg-[#236D91] px-4 py-2.5 text-sm font-bold text-white cursor-pointer"
                >
                  <Video className="h-4 w-4" />
                  <span>
                    {creatingMeet
                      ? 'Membuat Ruang...'
                      : 'Buat Ruang Google Meet'}
                  </span>
                </button>
              </div>

              {meetUrl && (
                <div className="rounded-xl border border-[#ADD8E6] bg-[#F3FAFC] dark:bg-[#172438] p-4 flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold text-[#236D91] dark:text-[#87CEEB]">
                      Tautan Google Meet Aktif
                    </p>
                    <p className="text-sm font-mono font-semibold text-[var(--color-text-primary)] break-all mt-0.5">
                      {meetUrl}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard?.writeText(meetUrl);
                        setCopiedMeet(true);
                        setTimeout(() => setCopiedMeet(false), 2000);
                      }}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-3 py-2 text-xs font-semibold cursor-pointer"
                    >
                      {copiedMeet ? (
                        <Check className="h-3.5 w-3.5 text-emerald-600" />
                      ) : (
                        <Copy className="h-3.5 w-3.5" />
                      )}
                      <span>{copiedMeet ? 'Tersalin' : 'Salin'}</span>
                    </button>
                    <a
                      href={meetUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 rounded-lg bg-[#348CB2] px-3.5 py-2 text-xs font-bold text-white hover:bg-[#236D91]"
                    >
                      <span>Gabung Meet</span>
                      <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  </div>
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* Mandatory Confirmation Modal for Gmail Send */}
      <Modal
        open={confirmEmailModal}
        onClose={() => setConfirmEmailModal(false)}
        title="Konfirmasi Kirim Email Gmail"
        subtitle="Pastikan penerima dan isi pesan sudah sesuai sebelum dikirim"
        maxWidthClass="max-w-md"
      >
        <div className="space-y-4">
          <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] p-3.5 text-xs space-y-1.5">
            <p>
              <strong>Kepada:</strong> {emailTo}
            </p>
            <p>
              <strong>Subjek:</strong> {emailSubject}
            </p>
            <p className="whitespace-pre-line text-[var(--color-text-secondary)] pt-1 border-t border-[var(--color-border)]">
              {emailBody}
            </p>
          </div>
          <div className="flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={() => setConfirmEmailModal(false)}
              className="rounded-lg border border-[var(--color-border)] px-4 py-2 text-xs font-semibold cursor-pointer"
            >
              Batal
            </button>
            <button
              type="button"
              onClick={executeSendEmail}
              disabled={sendingEmail}
              className="rounded-lg bg-[#348CB2] px-4 py-2 text-xs font-bold text-white hover:bg-[#236D91] cursor-pointer"
            >
              {sendingEmail ? 'Mengirim...' : 'Konfirmasi & Kirim Email'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Mandatory Confirmation Modal for Calendar Event */}
      <Modal
        open={confirmCalendarModal}
        onClose={() => setConfirmCalendarModal(false)}
        title="Konfirmasi Jadwal Google Calendar"
        subtitle="Acara akan dibuat di kalender utama akun Google Anda"
        maxWidthClass="max-w-md"
      >
        <div className="space-y-4">
          <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] p-3.5 text-xs space-y-1.5">
            <p>
              <strong>Agenda:</strong> {eventSummary}
            </p>
            <p>
              <strong>Lokasi:</strong> {eventLocation}
            </p>
            <p className="tabular-nums">
              <strong>Waktu:</strong> {eventDate} pukul {eventTime} WIB (45
              menit)
            </p>
          </div>
          <div className="flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={() => setConfirmCalendarModal(false)}
              className="rounded-lg border border-[var(--color-border)] px-4 py-2 text-xs font-semibold cursor-pointer"
            >
              Batal
            </button>
            <button
              type="button"
              onClick={executeCreateEvent}
              disabled={creatingEvent}
              className="rounded-lg bg-[#348CB2] px-4 py-2 text-xs font-bold text-white hover:bg-[#236D91] cursor-pointer"
            >
              {creatingEvent ? 'Menyimpan...' : 'Konfirmasi & Simpan Jadwal'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

/* ============================================================================
 * 2. OUTLET DETAIL MODAL (Screen 4)
 * ============================================================================ */
export function OutletDetailModal({
  outlet,
  orders,
  visits,
  onClose,
  onStartVisit,
  onCreateOrder,
  onOpenWorkspace,
}: {
  outlet: Outlet | null;
  orders: OrderRecord[];
  visits: VisitItem[];
  onClose: () => void;
  onStartVisit: (outlet: Outlet) => void;
  onCreateOrder: (outlet: Outlet) => void;
  onOpenWorkspace: () => void;
}) {
  const [tab, setTab] = useState<'info' | 'history' | 'sales'>('info');

  if (!outlet) return null;

  const outletOrders = orders.filter((o) => o.outletId === outlet.id);
  const outletVisits = visits.filter((v) => v.outletId === outlet.id);

  return (
    <Modal
      open={Boolean(outlet)}
      onClose={onClose}
      title={outlet.name}
      subtitle={`${outlet.city} · ${outlet.status}${outlet.isPriority ? ' · Prioritas' : ''}`}
      maxWidthClass="max-w-lg"
    >
      <div className="space-y-4">
        {/* Visual Storefront Banner */}
        <div className="relative overflow-hidden rounded-2xl border border-[var(--color-border)] bg-gradient-to-r from-[#E5F4F8] to-[#F3FAFC] dark:from-[#172438] dark:to-[#111C2D] p-4 flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#348CB2] text-white shrink-0">
            <Store className="h-7 w-7" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold text-[var(--color-text-primary)] truncate">
              {outlet.name}
            </p>
            <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">
              {outlet.address}
            </p>
            <p className="text-xs font-semibold text-[#236D91] dark:text-[#87CEEB] mt-1 tabular-nums">
              Jarak {outlet.distanceKm} km · Order Terakhir{' '}
              {formatRupiah(outlet.lastOrderTotal)}
            </p>
          </div>
        </div>

        {/* Action Buttons matching Screen 4 (Kunjungi, Buat Order, Telepon) + Workspace */}
        <div className="grid grid-cols-4 gap-2">
          <button
            type="button"
            onClick={() => onStartVisit(outlet)}
            className="flex flex-col items-center justify-center gap-1 rounded-xl border border-[#348CB2]/30 bg-[#F3FAFC] dark:bg-[#19394B] py-2.5 text-xs font-semibold text-[#236D91] dark:text-[#87CEEB] hover:bg-[#E5F4F8] cursor-pointer"
          >
            <MapPin className="h-4 w-4" />
            <span>Kunjungi</span>
          </button>
          <button
            type="button"
            onClick={() => onCreateOrder(outlet)}
            className="flex flex-col items-center justify-center gap-1 rounded-xl border border-[#F97316]/30 bg-[#FFF7ED] dark:bg-[#431407]/40 py-2.5 text-xs font-semibold text-[#C2410C] dark:text-[#FB923C] hover:bg-[#FFEDD5] cursor-pointer"
          >
            <ShoppingCart className="h-4 w-4" />
            <span>Buat Order</span>
          </button>
          <a
            href={`tel:${outlet.phone}`}
            className="flex flex-col items-center justify-center gap-1 rounded-xl border border-emerald-200 dark:border-emerald-900/50 bg-emerald-50 dark:bg-emerald-950/30 py-2.5 text-xs font-semibold text-emerald-700 dark:text-emerald-300"
          >
            <Phone className="h-4 w-4" />
            <span>Telepon</span>
          </a>
          <button
            type="button"
            onClick={() => {
              onClose();
              onOpenWorkspace();
            }}
            className="flex flex-col items-center justify-center gap-1 rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] py-2.5 text-xs font-semibold text-[var(--color-text-primary)] hover:bg-[var(--color-surface-muted)] cursor-pointer"
          >
            <Calendar className="h-4 w-4 text-[#348CB2]" />
            <span>Gmail / Cal</span>
          </button>
        </div>

        {/* Mini GPS Location Strip */}
        <div className="flex items-center justify-between gap-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] px-3.5 py-2 text-[11px]">
          <span className="font-mono text-[var(--color-text-secondary)] tabular-nums">
            GPS: {outlet.lat.toFixed(5)}, {outlet.lng.toFixed(5)}
          </span>
          <a
            href={`https://www.google.com/maps/search/?api=1&query=${outlet.lat},${outlet.lng}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 font-bold text-[#348CB2] hover:underline"
          >
            <span>Lihat di Peta</span>
            <ExternalLink className="h-3 w-3" />
          </a>
        </div>

        {/* Sub-tabs */}
        <div className="grid grid-cols-3 gap-1.5 rounded-xl bg-[var(--color-surface-muted)] p-1">
          {[
            { id: 'info' as const, label: 'Informasi' },
            { id: 'history' as const, label: 'Riwayat' },
            { id: 'sales' as const, label: 'Sales' },
          ].map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setTab(item.id)}
              className={`rounded-lg py-2 text-xs font-semibold cursor-pointer transition-colors ${
                tab === item.id
                  ? 'bg-[#348CB2] text-white'
                  : 'text-[var(--color-text-secondary)]'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        {tab === 'info' && (
          <div className="divide-y divide-[var(--color-border)] rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] text-xs">
            <div className="flex items-center justify-between px-4 py-3">
              <span className="text-[var(--color-text-muted)]">PIC Outlet</span>
              <span className="font-semibold text-[var(--color-text-primary)]">
                {outlet.picName}
              </span>
            </div>
            <div className="flex items-center justify-between px-4 py-3">
              <span className="text-[var(--color-text-muted)]">No. Kontak</span>
              <a
                href={`tel:${outlet.phone}`}
                className="inline-flex items-center gap-1.5 font-semibold text-[#348CB2] tabular-nums"
              >
                <Phone className="h-3.5 w-3.5" />
                <span>{outlet.phone}</span>
              </a>
            </div>
            <div className="flex items-center justify-between px-4 py-3 gap-4">
              <span className="text-[var(--color-text-muted)] shrink-0">
                Alamat
              </span>
              <span className="font-medium text-right text-[var(--color-text-primary)]">
                {outlet.address}
              </span>
            </div>
            <div className="flex items-center justify-between px-4 py-3">
              <span className="text-[var(--color-text-muted)]">Kategori</span>
              <span className="font-semibold text-[var(--color-text-primary)]">
                {outlet.category}
              </span>
            </div>
            <div className="flex items-center justify-between px-4 py-3">
              <span className="text-[var(--color-text-muted)]">Status</span>
              <span className="font-semibold text-[#10B981]">
                {outlet.status}
              </span>
            </div>
          </div>
        )}

        {tab === 'history' && (
          <div className="space-y-2">
            {outletVisits.length === 0 ? (
              <p className="rounded-xl bg-[var(--color-background)] p-4 text-xs text-[var(--color-text-muted)]">
                Belum ada catatan kunjungan minggu ini.
              </p>
            ) : (
              outletVisits.map((v) => (
                <div
                  key={v.id}
                  className="rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] p-3 text-xs"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-[var(--color-text-primary)] tabular-nums">
                      {v.timeRange}
                    </span>
                    <span className="font-semibold text-[#348CB2]">
                      {v.status}
                    </span>
                  </div>
                  {v.notes && (
                    <p className="mt-1 text-[var(--color-text-secondary)]">
                      {v.notes}
                    </p>
                  )}
                </div>
              ))
            )}
          </div>
        )}

        {tab === 'sales' && (
          <div className="space-y-2">
            {outletOrders.length === 0 ? (
              <p className="rounded-xl bg-[var(--color-background)] p-4 text-xs text-[var(--color-text-muted)]">
                Belum ada order baru tercatat pada sesi ini.
              </p>
            ) : (
              outletOrders.map((ord) => (
                <div
                  key={ord.id}
                  className="rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] p-3 text-xs flex items-center justify-between"
                >
                  <div>
                    <p className="font-mono font-bold text-[var(--color-text-primary)]">
                      {ord.id}
                    </p>
                    <p className="text-[var(--color-text-muted)] tabular-nums">
                      {ord.dateLabel}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-[var(--color-text-primary)] tabular-nums">
                      {formatRupiah(ord.total)}
                    </p>
                    <p className="text-[#10B981] font-semibold">{ord.status}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </Modal>
  );
}

/* ============================================================================
 * 3. VISIT CHECK-IN & EVIDENCE MODAL (Mobile Screen 12)
 * ============================================================================ */
export function VisitEvidenceModal({
  visit,
  onClose,
  onSubmitEvidence,
}: {
  visit: VisitItem | null;
  onClose: () => void;
  onSubmitEvidence: (visitId: string, notes: string, photoCount: number) => void;
}) {
  const [notes, setNotes] = useState(
    visit?.notes ||
      'Display produk sesuai program promosi. Stok Minuman Energi tersedia.'
  );
  const [photos, setPhotos] = useState<Array<{ label: string; previewUrl?: string }>>([
    { label: 'Rak Display Utama' },
    { label: 'Banner Promo Outlet' },
  ]);
  const [error, setError] = useState<string | null>(null);

  const {
    recording,
    transcribing,
    error: micError,
    start,
    stop,
  } = useVoiceRecorder((transcript) => {
    setNotes((prev) => (prev ? `${prev} ${transcript}` : transcript));
  });

  if (!visit) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const uploaded = Array.from(files).map((f) => ({
      label: f.name,
      previewUrl: URL.createObjectURL(f),
    }));
    setPhotos((prev) => [...prev, ...uploaded]);
    setError(null);
  };

  const handleRemovePhoto = (index: number) => {
    setPhotos((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleSave = () => {
    if (photos.length === 0) {
      setError('Minimal 1 foto kunjungan wajib dilampirkan.');
      return;
    }
    onSubmitEvidence(visit.id, notes.trim(), photos.length);
  };

  return (
    <Modal
      open={Boolean(visit)}
      onClose={onClose}
      title="Check-in & Bukti Kunjungan"
      subtitle={`${visit.outletName} · ${visit.city}`}
      maxWidthClass="max-w-md"
    >
      <div className="space-y-4">
        <div className="flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 dark:border-emerald-900/50 dark:bg-emerald-950/40 p-3.5">
          <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
          <div className="text-xs">
            <p className="font-bold text-emerald-800 dark:text-emerald-300">
              Dalam Area Geofence
            </p>
            <p className="text-emerald-700 dark:text-emerald-400 tabular-nums">
              Radius: 100 meter · {visit.address}
            </p>
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-[var(--color-text-primary)] mb-2">
            Foto Kunjungan (Wajib · {photos.length} terlampir)
          </label>
          <div className="grid grid-cols-3 gap-2">
            {photos.map((photo, idx) => (
              <div
                key={`${photo.label}-${idx}`}
                className="relative overflow-hidden rounded-xl border border-[var(--color-border)] bg-gradient-to-br from-[#E5F4F8] to-[#F3FAFC] dark:from-[#172438] dark:to-[#111C2D] p-2 text-center"
              >
                <button
                  type="button"
                  onClick={() => handleRemovePhoto(idx)}
                  aria-label={`Hapus ${photo.label}`}
                  className="absolute right-1 top-1 z-10 flex h-5 w-5 items-center justify-center rounded-full bg-red-600 text-white shadow-xs hover:bg-red-700 cursor-pointer"
                >
                  <X className="h-3 w-3" />
                </button>
                {photo.previewUrl ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={photo.previewUrl}
                    alt={photo.label}
                    className="h-14 w-full rounded-lg object-cover"
                  />
                ) : (
                  <div className="flex h-14 w-full flex-col items-center justify-center rounded-lg bg-white/70 dark:bg-[#19394B]/60">
                    <Camera className="h-5 w-5 text-[#348CB2]" />
                    <span className="mt-0.5 text-[9px] font-bold text-[#236D91] dark:text-[#87CEEB]">
                      TERVERIFIKASI
                    </span>
                  </div>
                )}
                <p className="mt-1 text-[10px] font-medium text-[var(--color-text-secondary)] truncate">
                  {photo.label}
                </p>
              </div>
            ))}
            <label className="flex flex-col items-center justify-center rounded-xl border border-dashed border-[#348CB2] bg-[var(--color-background)] p-2.5 text-center text-[#348CB2] hover:bg-[#F3FAFC] cursor-pointer min-h-[86px]">
              <Plus className="h-5 w-5" />
              <span className="mt-1 text-[10px] font-semibold">Tambah Foto</span>
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handleFileUpload}
                className="sr-only"
              />
            </label>
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-bold text-[var(--color-text-primary)]">
              Catatan Kunjungan
            </label>
            <button
              type="button"
              onClick={recording ? stop : start}
              disabled={transcribing}
              className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-[11px] font-semibold cursor-pointer transition-colors ${
                recording
                  ? 'bg-red-600 text-white'
                  : 'bg-[#E5F4F8] dark:bg-[#19394B] text-[#236D91] dark:text-[#87CEEB]'
              }`}
            >
              {recording ? (
                <>
                  <Square className="h-3 w-3" />
                  <span>Berhenti Rekam</span>
                </>
              ) : (
                <>
                  <Mic className="h-3 w-3" />
                  <span>
                    {transcribing ? 'Mentranskripsi...' : 'Rekam Catatan Suara'}
                  </span>
                </>
              )}
            </button>
          </div>
          <textarea
            rows={3}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Contoh: produk sesuai program. Stok Minuman Energi tersedia."
            className="w-full rounded-xl border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-3.5 py-2.5 text-xs sm:text-sm"
          />
          {micError && (
            <p className="mt-1 text-[11px] text-red-600">{micError}</p>
          )}
        </div>

        {error && (
          <div className="flex items-center gap-2 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <button
          type="button"
          onClick={handleSave}
          className="w-full rounded-xl bg-[#348CB2] hover:bg-[#236D91] py-3 text-sm font-bold text-white shadow-sm cursor-pointer"
        >
          Simpan Bukti Kunjungan
        </button>
      </div>
    </Modal>
  );
}

/* ============================================================================
 * 4. ORDER DETAIL & ROUTE REPLAY MODALS
 * ============================================================================ */
export function OrderDetailModal({
  order,
  onClose,
  onOpenWorkspace,
}: {
  order: OrderRecord | null;
  onClose: () => void;
  onOpenWorkspace?: () => void;
}) {
  if (!order) return null;

  const timelineSteps =
    order.status === 'Batal'
      ? [
          { label: 'Order Dibuat Sales', done: true },
          { label: 'Dibatalkan Sebelum Pengiriman', done: true },
        ]
      : [
          { label: 'Order Dibuat Sales', done: true },
          {
            label: 'Validasi Distributor',
            done: order.status === 'Diproses' || order.status === 'Dikirim' || order.status === 'Selesai',
          },
          {
            label: 'Dalam Pengiriman',
            done: order.status === 'Dikirim' || order.status === 'Selesai',
          },
          { label: 'Diterima Outlet', done: order.status === 'Selesai' },
        ];

  return (
    <Modal
      open={Boolean(order)}
      onClose={onClose}
      title={order.id}
      subtitle={`${order.outletName} · ${order.dateLabel}`}
      maxWidthClass="max-w-md"
    >
      <div className="space-y-4">
        <div className="flex items-center justify-between rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] px-4 py-3 text-xs">
          <span className="text-[var(--color-text-muted)]">Status Order</span>
          <span className="font-bold text-[#348CB2]">{order.status}</span>
        </div>

        {/* Status Timeline */}
        <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] p-3.5 space-y-2">
          <p className="text-[11px] font-bold text-[var(--color-text-muted)] uppercase tracking-wider">
            Linimasa Proses Order
          </p>
          <div className="grid grid-cols-2 gap-2 text-xs">
            {timelineSteps.map((st) => (
              <div key={st.label} className="flex items-center gap-1.5">
                <CheckCircle2
                  className={`h-3.5 w-3.5 shrink-0 ${
                    st.done
                      ? 'text-emerald-600'
                      : 'text-[var(--color-text-muted)] opacity-40'
                  }`}
                />
                <span
                  className={
                    st.done
                      ? 'font-semibold text-[var(--color-text-primary)]'
                      : 'text-[var(--color-text-muted)]'
                  }
                >
                  {st.label}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          {order.items.map((item) => (
            <div
              key={item.sku}
              className="flex items-center justify-between rounded-xl border border-[var(--color-border)] p-3 text-xs"
            >
              <div>
                <p className="font-bold text-[var(--color-text-primary)]">
                  {item.name}
                </p>
                <p className="font-mono text-[11px] text-[var(--color-text-muted)]">
                  {item.sku} · {formatRupiah(item.unitPrice)} × {item.qty}
                </p>
              </div>
              <p className="font-bold text-[var(--color-text-primary)] tabular-nums">
                {formatRupiah(item.unitPrice * item.qty)}
              </p>
            </div>
          ))}
        </div>

        <div className="rounded-xl bg-[#F3FAFC] dark:bg-[#172438] p-4 space-y-1.5 text-xs">
          <div className="flex justify-between">
            <span className="text-[var(--color-text-secondary)]">Subtotal</span>
            <span className="font-semibold tabular-nums">
              {formatRupiah(order.subtotal)}
            </span>
          </div>
          <div className="flex justify-between text-emerald-700 dark:text-emerald-400">
            <span>Diskon Promo</span>
            <span className="font-semibold tabular-nums">
              -{formatRupiah(order.discount)}
            </span>
          </div>
          <div className="flex justify-between pt-2 border-t border-[var(--color-border)] text-sm font-bold text-[#123A54] dark:text-white">
            <span>Total Order</span>
            <span className="tabular-nums">{formatRupiah(order.total)}</span>
          </div>
        </div>

        {onOpenWorkspace && (
          <button
            type="button"
            onClick={() => {
              onClose();
              onOpenWorkspace();
            }}
            className="w-full inline-flex items-center justify-center gap-2 rounded-xl border border-[#348CB2] py-2.5 text-xs font-bold text-[#348CB2] hover:bg-[#F3FAFC] cursor-pointer"
          >
            <Mail className="h-3.5 w-3.5" />
            <span>Kirim Ringkasan Faktur via Gmail</span>
          </button>
        )}
      </div>
    </Modal>
  );
}

export function RouteReplayModal({
  open,
  onClose,
  currentPos,
  outlets,
  selectedOutlet,
  onSelectOutlet,
}: {
  open: boolean;
  onClose: () => void;
  currentPos: { lat: number; lng: number };
  outlets: Outlet[];
  selectedOutlet: Outlet | null;
  onSelectOutlet: (o: Outlet) => void;
}) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Riwayat Perjalanan & Rute Real-time"
      subtitle="Pelacakan rute kunjungan aktif selama jam kerja (08:00 – 17:00 WIB)"
      maxWidthClass="max-w-2xl"
    >
      <div className="space-y-4">
        <SalesGoogleMap
          currentPos={currentPos}
          outlets={outlets}
          selectedOutlet={selectedOutlet}
          onSelectOutlet={onSelectOutlet}
          heightClass="h-[280px] sm:h-[340px]"
        />
        <div className="grid sm:grid-cols-3 gap-2.5 text-xs">
          {[
            { time: '08:01 WIB', place: 'Kantor Area Bogor (Check-in Shift)' },
            { time: '08:30 WIB', place: 'Toko Makmur Jaya (Selesai)' },
            { time: '09:15 WIB', place: 'Toko Sentosa (Aktif Saat Ini)' },
          ].map((cp) => (
            <div
              key={cp.time}
              className="rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] p-3"
            >
              <div className="flex items-center gap-1.5 font-mono font-bold text-[#348CB2] tabular-nums">
                <Clock className="h-3.5 w-3.5" />
                <span>{cp.time}</span>
              </div>
              <p className="mt-1 font-medium text-[var(--color-text-primary)]">
                {cp.place}
              </p>
            </div>
          ))}
        </div>
      </div>
    </Modal>
  );
}

/* ============================================================================
 * 5. NAVIGATION PREVIEW MODAL (Mobile Screen 9)
 * ============================================================================ */
export function NavigationPreviewModal({
  visit,
  currentPos,
  outlets,
  onClose,
  onOpenEvidence,
}: {
  visit: VisitItem | null;
  currentPos: { lat: number; lng: number };
  outlets: Outlet[];
  onClose: () => void;
  onOpenEvidence: (visit: VisitItem) => void;
}) {
  if (!visit) return null;

  const targetOutlet =
    outlets.find((o) => o.id === visit.outletId) || outlets[0];

  return (
    <Modal
      open={Boolean(visit)}
      onClose={onClose}
      title="Navigasi ke Outlet"
      subtitle={`${visit.outletName} · ${visit.address}`}
      maxWidthClass="max-w-lg"
    >
      <div className="space-y-4">
        <SalesGoogleMap
          currentPos={currentPos}
          outlets={[targetOutlet]}
          selectedOutlet={targetOutlet}
          onSelectOutlet={() => {}}
          heightClass="h-[260px]"
        />

        <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] p-3.5 text-xs space-y-1">
          <p className="font-bold text-sm text-[var(--color-text-primary)]">
            {visit.outletName}
          </p>
          <p className="text-[var(--color-text-secondary)]">
            {visit.address}, {visit.city}
          </p>
          <p className="font-semibold text-[#236D91] dark:text-[#87CEEB] tabular-nums">
            Jarak: {targetOutlet.distanceKm} km · Estimasi: 12 menit
          </p>
        </div>

        <div className="grid grid-cols-2 gap-2.5">
          <a
            href={`https://www.google.com/maps/dir/?api=1&origin=${currentPos.lat},${currentPos.lng}&destination=${targetOutlet.lat},${targetOutlet.lng}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-[#348CB2] hover:bg-[#236D91] py-2.5 text-xs font-bold text-white"
          >
            <Navigation className="h-3.5 w-3.5" />
            <span>Buka di Peta Perangkat</span>
          </a>
          <button
            type="button"
            onClick={() => {
              onClose();
              onOpenEvidence(visit);
            }}
            className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-[#123A54] hover:bg-[#194F70] py-2.5 text-xs font-bold text-white cursor-pointer"
          >
            <CheckCircle2 className="h-3.5 w-3.5" />
            <span>Sudah Tiba / Check-in</span>
          </button>
        </div>
      </div>
    </Modal>
  );
}

/* ============================================================================
 * 6. SMARTREWARD LOYALTY & INCENTIVE MODAL (Master PRD Section 5.3)
 * ============================================================================ */
export function SmartRewardModal({
  open,
  onClose,
  pointsBalance,
  catalog,
  ledger,
  onRedeem,
}: {
  open: boolean;
  onClose: () => void;
  pointsBalance: number;
  catalog: RewardItem[];
  ledger: RewardLedgerEntry[];
  onRedeem: (item: RewardItem) => void;
}) {
  const [tab, setTab] = useState<'catalog' | 'ledger'>('catalog');

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="SmartReward — Poin & Insentif Sales"
      subtitle="Program loyalitas dan pencapaian performa lapangan"
      maxWidthClass="max-w-lg"
    >
      <div className="space-y-4">
        <div className="rounded-2xl bg-gradient-to-r from-[#F97316] to-[#EA580C] p-4 text-white flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold text-orange-100">
              Saldo Poin SmartReward Anda
            </p>
            <p className="mt-1 font-mono text-2xl font-bold tabular-nums">
              {pointsBalance.toLocaleString('id-ID')} pts
            </p>
          </div>
          <Award className="h-10 w-10 text-orange-100 shrink-0" />
        </div>

        <div className="grid grid-cols-2 gap-1.5 rounded-xl bg-[var(--color-surface-muted)] p-1">
          <button
            type="button"
            onClick={() => setTab('catalog')}
            className={`rounded-lg py-2 text-xs font-semibold cursor-pointer ${
              tab === 'catalog'
                ? 'bg-[#348CB2] text-white'
                : 'text-[var(--color-text-secondary)]'
            }`}
          >
            Katalog Penukaran
          </button>
          <button
            type="button"
            onClick={() => setTab('ledger')}
            className={`rounded-lg py-2 text-xs font-semibold cursor-pointer ${
              tab === 'ledger'
                ? 'bg-[#348CB2] text-white'
                : 'text-[var(--color-text-secondary)]'
            }`}
          >
            Riwayat Poin ({ledger.length})
          </button>
        </div>

        {tab === 'catalog' ? (
          <div className="space-y-2.5">
            {catalog.map((item) => {
              const affordable = pointsBalance >= item.pointsCost;
              return (
                <div
                  key={item.id}
                  className="rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] p-3.5 flex items-center justify-between gap-3"
                >
                  <div>
                    <p className="text-[11px] font-bold text-[#F97316]">
                      {item.category} · {item.stockLabel}
                    </p>
                    <p className="text-xs sm:text-sm font-bold text-[var(--color-text-primary)]">
                      {item.title}
                    </p>
                    <p className="text-[11px] text-[var(--color-text-muted)] mt-0.5">
                      {item.description}
                    </p>
                  </div>
                  <button
                    type="button"
                    disabled={!affordable}
                    onClick={() => onRedeem(item)}
                    className="rounded-xl bg-[#348CB2] hover:bg-[#236D91] disabled:opacity-40 px-3 py-2 text-xs font-bold text-white cursor-pointer shrink-0 tabular-nums"
                  >
                    Tukar {item.pointsCost.toLocaleString('id-ID')}
                  </button>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {ledger.map((entry) => (
              <div
                key={entry.id}
                className="flex items-center justify-between rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] p-3 text-xs"
              >
                <div>
                  <p className="font-bold text-[var(--color-text-primary)]">
                    {entry.title}
                  </p>
                  <p className="text-[11px] text-[var(--color-text-muted)] tabular-nums">
                    {entry.dateLabel}
                  </p>
                </div>
                <span
                  className={`font-mono font-bold tabular-nums ${
                    entry.type === 'Perolehan'
                      ? 'text-emerald-600'
                      : 'text-[#F97316]'
                  }`}
                >
                  {entry.pointsDelta > 0 ? `+${entry.pointsDelta}` : entry.pointsDelta}{' '}
                  pts
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </Modal>
  );
}

/* ============================================================================
 * 7. PRODUCT, PROMO & VISIT HISTORY DETAIL MODALS
 * ============================================================================ */
export function ProductDetailModal({
  product,
  onClose,
  onAddToOrder,
}: {
  product: Product | null;
  onClose: () => void;
  onAddToOrder: (sku: string) => void;
}) {
  if (!product) return null;

  return (
    <Modal
      open={Boolean(product)}
      onClose={onClose}
      title={product.name}
      subtitle={`${product.sku} · Kategori ${product.category}`}
      maxWidthClass="max-w-md"
    >
      <div className="space-y-4">
        <div className="flex items-center gap-4 rounded-2xl border border-[var(--color-border)] bg-[var(--color-background)] p-4">
          <div
            className="flex h-16 w-16 items-center justify-center rounded-2xl text-white font-mono text-sm font-bold shrink-0"
            style={{ backgroundColor: product.accentHex }}
          >
            <Package className="h-7 w-7" />
          </div>
          <div>
            <p className="text-xs font-bold text-[#F97316]">{product.tag}</p>
            <p className="text-lg font-bold text-[#123A54] dark:text-white tabular-nums">
              {formatRupiah(product.price)} / {product.unit}
            </p>
            <p className="text-xs text-[var(--color-text-muted)] tabular-nums">
              Stok gudang aktif: {product.stock} {product.unit}
            </p>
          </div>
        </div>

        {product.promoDiscountPct && (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 dark:border-emerald-900/50 dark:bg-emerald-950/30 p-3 text-xs font-semibold text-emerald-700 dark:text-emerald-300">
            Promo Aktif: Diskon otomatis {product.promoDiscountPct}% pada sistem
            SmartOrder.
          </div>
        )}

        <div className="flex justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-[var(--color-border)] px-4 py-2 text-xs font-semibold cursor-pointer"
          >
            Tutup
          </button>
          <button
            type="button"
            onClick={() => {
              onAddToOrder(product.sku);
              onClose();
            }}
            className="inline-flex items-center gap-1.5 rounded-xl bg-[#348CB2] hover:bg-[#236D91] px-4 py-2 text-xs font-bold text-white cursor-pointer"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Tambah 5 {product.unit} ke Order</span>
          </button>
        </div>
      </div>
    </Modal>
  );
}

export function PromoDetailModal({
  promo,
  onClose,
  onApplyToOrder,
}: {
  promo: PromotionItem | null;
  onClose: () => void;
  onApplyToOrder: (sku?: string) => void;
}) {
  if (!promo) return null;

  return (
    <Modal
      open={Boolean(promo)}
      onClose={onClose}
      title={promo.title}
      subtitle={`${promo.type} · Berlaku s/d ${promo.validUntil}`}
      maxWidthClass="max-w-md"
    >
      <div className="space-y-4 text-xs sm:text-sm">
        <p className="text-[var(--color-text-secondary)]">{promo.subtitle}</p>
        <div className="rounded-xl border border-[#ADD8E6] bg-[#F3FAFC] dark:bg-[#172438] p-3.5 flex items-center gap-2.5">
          <Tag className="h-4 w-4 text-[#348CB2] shrink-0" />
          <span className="font-bold text-[#123A54] dark:text-[#87CEEB]">
            Aturan Mekanisme: {promo.discountRule}
          </span>
        </div>

        {promo.terms && promo.terms.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs font-bold text-[var(--color-text-primary)]">
              Syarat & Ketentuan:
            </p>
            <ul className="space-y-1.5 text-xs text-[var(--color-text-secondary)]">
              {promo.terms.map((t) => (
                <li key={t} className="flex items-start gap-2">
                  <CheckCircle2 className="h-3.5 w-3.5 text-[#10B981] shrink-0 mt-0.5" />
                  <span>{t}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="flex justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-[var(--color-border)] px-4 py-2 text-xs font-semibold cursor-pointer"
          >
            Tutup
          </button>
          <button
            type="button"
            onClick={() => {
              onApplyToOrder(promo.targetSku);
              onClose();
            }}
            className="rounded-xl bg-[#F97316] hover:bg-[#EA580C] px-4 py-2 text-xs font-bold text-white cursor-pointer"
          >
            Terapkan ke Buat Order
          </button>
        </div>
      </div>
    </Modal>
  );
}

export function VisitHistoryDetailModal({
  visit,
  onClose,
}: {
  visit: VisitItem | null;
  onClose: () => void;
}) {
  if (!visit) return null;

  return (
    <Modal
      open={Boolean(visit)}
      onClose={onClose}
      title={`Detail Kunjungan: ${visit.outletName}`}
      subtitle={`${visit.city} · ${visit.timeRange}`}
      maxWidthClass="max-w-md"
    >
      <div className="space-y-3.5 text-xs">
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 dark:border-emerald-900/50 dark:bg-emerald-950/30 p-3 flex items-center justify-between">
          <span className="font-bold text-emerald-800 dark:text-emerald-300">
            Status Kunjungan Tervalidasi
          </span>
          <span className="font-bold text-emerald-700">{visit.status}</span>
        </div>
        <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] p-3.5 space-y-1.5">
          <p>
            <strong>Alamat:</strong> {visit.address}
          </p>
          <p className="tabular-nums">
            <strong>Koordinat Check-in:</strong> {visit.lat.toFixed(5)},{' '}
            {visit.lng.toFixed(5)}
          </p>
          <p className="tabular-nums">
            <strong>Jumlah Foto Bukti:</strong> {visit.photoCount || 2} lampiran
          </p>
          <p className="pt-1 border-t border-[var(--color-border)] text-[var(--color-text-secondary)]">
            <strong>Catatan Lapangan:</strong>{' '}
            {visit.notes || 'Display produk sesuai program promosi aktif.'}
          </p>
        </div>
      </div>
    </Modal>
  );
}

/* ============================================================================
 * 8. TELEGRAM ASSISTANT BOT LINK MODAL (Master PRD Section 8)
 * ============================================================================ */
export function TelegramBotModal({
  open,
  onClose,
  linked,
  onToggleLink,
}: {
  open: boolean;
  onClose: () => void;
  linked: boolean;
  onToggleLink: (next: boolean) => void;
}) {
  const [copiedCmd, setCopiedCmd] = useState(false);
  const linkTokenCmd = '/start sx_link_budi_bogor_2025';

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="SalesX-Ai Telegram Assistant Bot"
      subtitle="Integrasi perintah cepat & ringkasan laporan via Telegram"
      maxWidthClass="max-w-md"
    >
      <div className="space-y-4 text-xs">
        <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] p-3.5 flex items-center justify-between">
          <div>
            <p className="font-bold text-sm text-[var(--color-text-primary)]">
              @SalesXAi_FieldBot
            </p>
            <p className="text-[var(--color-text-muted)]">
              Status Akun:{' '}
              <strong className={linked ? 'text-emerald-600' : 'text-[#F97316]'}>
                {linked ? 'Terhubung (@budi_salesbogor)' : 'Belum Terhubung'}
              </strong>
            </p>
          </div>
          <MessageSquare className="h-6 w-6 text-[#348CB2]" />
        </div>

        <div className="space-y-2">
          <p className="font-bold text-[var(--color-text-primary)]">
            Token Tautan Sekali Pakai (One-Time Token):
          </p>
          <div className="flex items-center justify-between gap-2 rounded-xl border border-[#ADD8E6] bg-[#F3FAFC] dark:bg-[#172438] px-3 py-2.5">
            <code className="font-mono text-[11px] font-bold text-[#123A54] dark:text-[#87CEEB] break-all">
              {linkTokenCmd}
            </code>
            <button
              type="button"
              onClick={() => {
                navigator.clipboard?.writeText(linkTokenCmd);
                setCopiedCmd(true);
                setTimeout(() => setCopiedCmd(false), 2000);
              }}
              className="rounded-lg border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-2.5 py-1 text-[11px] font-semibold cursor-pointer shrink-0"
            >
              {copiedCmd ? 'Tersalin' : 'Salin'}
            </button>
          </div>
        </div>

        <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] p-3.5 space-y-1.5">
          <p className="font-bold text-[var(--color-text-primary)]">
            Perintah Bot Tersedia:
          </p>
          <p className="font-mono text-[11px] text-[var(--color-text-secondary)]">
            <strong>/today</strong> — Daftar kunjungan outlet hari ini
          </p>
          <p className="font-mono text-[11px] text-[var(--color-text-secondary)]">
            <strong>/sales</strong> — Ringkasan omzet & realisasi target
          </p>
          <p className="font-mono text-[11px] text-[var(--color-text-secondary)]">
            <strong>/outlet [nama]</strong> — Cari profil outlet & status order
          </p>
        </div>

        <button
          type="button"
          onClick={() => onToggleLink(!linked)}
          className={`w-full rounded-xl py-2.5 text-xs font-bold text-white cursor-pointer ${
            linked
              ? 'bg-red-600 hover:bg-red-700'
              : 'bg-[#348CB2] hover:bg-[#236D91]'
          }`}
        >
          {linked ? 'Putuskan Tautan Bot Telegram' : 'Verifikasi & Hubungkan Bot'}
        </button>
      </div>
    </Modal>
  );
}

/* ============================================================================
 * 9. SETTINGS MODALS (Pengaturan Akun, Keamanan, Bantuan, Tentang - Screen 16 & Mobile 23)
 * ============================================================================ */
export function PortalAccountModal({
  mode,
  onClose,
  onToast,
}: {
  mode: 'account' | 'security' | 'help' | 'about' | null;
  onClose: () => void;
  onToast: (msg: string) => void;
}) {
  const [pinEnabled, setPinEnabled] = useState(true);
  const [biometricEnabled, setBiometricEnabled] = useState(true);
  const [phoneInput, setPhoneInput] = useState('0812-9000-4510');

  if (!mode) return null;

  const titleMap = {
    account: 'Pengaturan Akun Sales',
    security: 'Keamanan Akun & Biometrik',
    help: 'Bantuan & Dukungan Lapangan',
    about: 'Tentang SalesX-Ai PWA',
  };

  return (
    <Modal
      open={Boolean(mode)}
      onClose={onClose}
      title={titleMap[mode]}
      subtitle="SalesX-Ai Enterprise Platform v1.0.0"
      maxWidthClass="max-w-md"
    >
      {mode === 'account' && (
        <div className="space-y-3 text-xs">
          <div>
            <label className="block font-bold mb-1">Nama Lengkap</label>
            <input
              type="text"
              defaultValue="Budi Santoso"
              className="w-full rounded-xl border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-3 py-2"
            />
          </div>
          <div>
            <label className="block font-bold mb-1">No. HP / WhatsApp</label>
            <input
              type="tel"
              value={phoneInput}
              onChange={(e) => setPhoneInput(e.target.value)}
              className="w-full rounded-xl border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-3 py-2 tabular-nums"
            />
          </div>
          <div>
            <label className="block font-bold mb-1">Wilayah Penugasan</label>
            <input
              type="text"
              disabled
              value="Area Bogor & Depok (Kantor Area Bogor)"
              className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 opacity-75"
            />
          </div>
          <button
            type="button"
            onClick={() => {
              onToast('Profil akun Sales berhasil diperbarui.');
              onClose();
            }}
            className="w-full rounded-xl bg-[#348CB2] py-2.5 font-bold text-white cursor-pointer"
          >
            Simpan Perubahan Akun
          </button>
        </div>
      )}

      {mode === 'security' && (
        <div className="space-y-3 text-xs">
          <label className="flex items-center justify-between rounded-xl border border-[var(--color-border)] p-3.5 cursor-pointer">
            <div>
              <p className="font-bold text-sm">Kunci PIN Portal (6 Digit)</p>
              <p className="text-[var(--color-text-muted)]">
                Wajib saat membuka antrean offline order
              </p>
            </div>
            <input
              type="checkbox"
              checked={pinEnabled}
              onChange={(e) => setPinEnabled(e.target.checked)}
              className="h-4 w-4 accent-[#348CB2]"
            />
          </label>
          <label className="flex items-center justify-between rounded-xl border border-[var(--color-border)] p-3.5 cursor-pointer">
            <div>
              <p className="font-bold text-sm">Autentikasi Biometrik Perangkat</p>
              <p className="text-[var(--color-text-muted)]">
                Sidik jari / pengenalan wajah saat absensi geofence
              </p>
            </div>
            <input
              type="checkbox"
              checked={biometricEnabled}
              onChange={(e) => setBiometricEnabled(e.target.checked)}
              className="h-4 w-4 accent-[#348CB2]"
            />
          </label>
          <button
            type="button"
            onClick={() => {
              onToast('Pengaturan keamanan & kata sandi diperbarui.');
              onClose();
            }}
            className="w-full rounded-xl bg-[#348CB2] py-2.5 font-bold text-white cursor-pointer"
          >
            Simpan Keamanan
          </button>
        </div>
      )}

      {mode === 'help' && (
        <div className="space-y-3 text-xs">
          {[
            {
              q: 'Bagaimana jika GPS tidak terbaca saat Check-in?',
              a: 'Tekan tombol Perbarui Lokasi GPS di tab Lokasi & GPS dan pastikan izin lokasi browser aktif serta berada dalam radius 100 meter outlet.',
            },
            {
              q: 'Apakah order tetap tersimpan saat sinyal hilang?',
              a: 'Ya. Antrean lokal PWA menyimpan order & bukti foto kunjungan sementara dan menyinkronkannya otomatis saat internet kembali aktif.',
            },
          ].map((faq) => (
            <div
              key={faq.q}
              className="rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] p-3.5 space-y-1"
            >
              <p className="font-bold flex items-center gap-1.5 text-[var(--color-text-primary)]">
                <HelpCircle className="h-3.5 w-3.5 text-[#348CB2]" />
                <span>{faq.q}</span>
              </p>
              <p className="text-[var(--color-text-secondary)]">{faq.a}</p>
            </div>
          ))}
        </div>
      )}

      {mode === 'about' && (
        <div className="space-y-3 text-xs">
          <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] p-4 space-y-1.5">
            <p className="font-bold text-sm flex items-center gap-1.5 text-[#123A54] dark:text-white">
              <Info className="h-4 w-4 text-[#348CB2]" />
              <span>SalesX-Ai Smart Sales Platform</span>
            </p>
            <p className="font-mono text-[var(--color-text-muted)]">
              Versi Aplikasi: v1.0.0 (PWA Web & Mobile Ready)
            </p>
            <p className="text-[var(--color-text-secondary)] pt-1">
              Seluruh pelacakan lokasi GPS hanya berjalan selama sesi shift kerja
              aktif dengan enkripsi data standar industri.
            </p>
          </div>
          <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-300 font-semibold">
            <ShieldCheck className="h-4 w-4 shrink-0" />
            <span>Kepatuhan Privasi Lokasi & Geofence Aktif</span>
          </div>
        </div>
      )}
    </Modal>
  );
}
