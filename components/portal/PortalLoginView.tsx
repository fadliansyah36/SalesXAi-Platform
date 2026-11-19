'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  ShieldCheck,
  MapPin,
  Calendar,
  Clock,
  CheckCircle2,
  Navigation,
  ArrowLeft,
  Smartphone,
  Play,
} from 'lucide-react';
import { BrandLogo } from '@/components/common/BrandLogo';
import { Modal } from '@/components/common/Modal';
import { SALES_REP_PROFILE } from '@/lib/salesx-data';
import { useSalesXAuth } from '@/components/providers/AppProviders';

export type OnboardingStep = 'login' | 'gps' | 'shift';

interface PortalLoginViewProps {
  onCompleteLogin: (options: {
    gpsGranted: boolean;
    shiftStarted: boolean;
    coords?: { lat: number; lng: number };
    workspaceConnected?: boolean;
    workspaceUserName?: string;
    workspaceUserEmail?: string;
  }) => void;
}

export function PortalLoginView({ onCompleteLogin }: PortalLoginViewProps) {
  const auth = useSalesXAuth();
  const [step, setStep] = useState<OnboardingStep>('login');
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [loginError, setLoginError] = useState<string | null>(null);

  // Onboarding transient states
  const [gpsGranted, setGpsGranted] = useState(false);
  const [gpsCoords, setGpsCoords] = useState<{ lat: number; lng: number }>({
    lat: SALES_REP_PROFILE.officeLat,
    lng: SALES_REP_PROFILE.officeLng,
  });
  const [gpsLoading, setGpsLoading] = useState(false);
  const [workspaceLoading, setWorkspaceLoading] = useState(false);
  const [workspaceInfo, setWorkspaceInfo] = useState<{
    name: string;
    email: string;
  } | null>(null);

  // Modals for OTP & Forgot Password
  const [otpModalOpen, setOtpModalOpen] = useState(false);
  const [otpPhone, setOtpPhone] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [forgotModalOpen, setForgotModalOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotSubmitted, setForgotSubmitted] = useState(false);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier.trim() || !password.trim()) {
      setLoginError('Masukkan email dan kata sandi Anda.');
      return;
    }
    setLoginError(null);
    try {
      await auth.signInWithPassword(identifier, password);
      setStep('gps');
    } catch (err) {
      setLoginError(err instanceof Error ? err.message : 'Login gagal. Periksa kredensial Anda.');
    }
  };

  const handleGoogleSignIn = async () => {
    setWorkspaceLoading(true);
    setLoginError(null);
    try {
      await auth.signInWithOAuth('google');
    } catch (err) {
      setLoginError(err instanceof Error ? err.message : 'Autentikasi Google Supabase gagal.');
      setWorkspaceLoading(false);
    }
  };

  const handleSendOtp = async () => {
    if (!otpPhone.trim()) { setLoginError('Masukkan nomor telepon dengan kode negara.'); return; }
    try { await auth.signInWithOtp(otpPhone); setOtpSent(true); setLoginError(null); }
    catch (err) { setLoginError(err instanceof Error ? err.message : 'OTP tidak dapat dikirim.'); }
  };

  const handleVerifyOtp = async () => {
    try {
      await auth.verifyOtp(otpPhone, otpCode);
      setOtpModalOpen(false);
      setStep('gps');
      setLoginError(null);
    } catch (err) { setLoginError(err instanceof Error ? err.message : 'OTP tidak valid.'); }
  };

  const handleRequestGps = () => {
    setGpsLoading(true);
    if (typeof navigator !== 'undefined' && 'geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setGpsCoords({
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
          });
          setGpsGranted(true);
          setGpsLoading(false);
          setStep('shift');
        },
        () => {
          // Even if browser denies permission, allow smooth progression while preserving default office coordinates
          setGpsGranted(false);
          setGpsLoading(false);
          setStep('shift');
        },
        { enableHighAccuracy: true, timeout: 6000 }
      );
    } else {
      setGpsGranted(false);
      setGpsLoading(false);
      setStep('shift');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#E5F4F8] via-[#F3FAFC] to-[#F8FAFC] dark:from-[#0B1220] dark:via-[#111C2D] dark:to-[#0B1220] flex flex-col justify-between px-4 py-6 sm:px-6">
      {/* Top Bar */}
      <div className="mx-auto flex w-full max-w-md flex-wrap items-center justify-between gap-2">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-[#236D91] dark:text-[#87CEEB] hover:bg-white/60 dark:hover:bg-[#172438] transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Beranda</span>
        </Link>
        <div className="flex flex-wrap items-center justify-end gap-x-2 gap-y-1 text-xs font-semibold">
          <Link
            href="/company"
            className="text-[#348CB2] dark:text-[#87CEEB] hover:underline"
          >
            Company
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
          <span className="text-[var(--color-text-muted)]">·</span>
          <span className="text-[var(--color-text-muted)] tabular-nums">
            {step === 'login' ? '1/3' : step === 'gps' ? '2/3' : '3/3'}
          </span>
        </div>
      </div>

      {/* Main Card */}
      <div className="mx-auto my-6 w-full max-w-md rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 sm:p-8 shadow-lg">
        {step === 'login' && (
          <div>
            <div className="flex flex-col items-center text-center">
              <BrandLogo subtitle="SALES PORTAL" />
              <p className="mt-4 text-sm text-[var(--color-text-secondary)] max-w-xs leading-relaxed">
                Portal Sales untuk kunjungan, order, target, dan aktivitas
                lapangan secara real-time.
              </p>
            </div>

            {loginError && (
              <div className="mt-4 rounded-xl border border-red-200 bg-red-50 dark:border-red-900/50 dark:bg-red-950/40 px-3.5 py-2.5 text-xs font-medium text-red-700 dark:text-red-300">
                {loginError}
              </div>
            )}

            <form onSubmit={handleLoginSubmit} className="mt-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[var(--color-text-primary)] mb-1.5">
                  Email / No. HP
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--color-text-muted)]" />
                  <input
                    type="text"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    placeholder="nama@perusahaan.co.id atau 0812..."
                    className="w-full rounded-xl border border-[var(--color-border-strong)] bg-[var(--color-surface)] pl-10 pr-4 py-2.5 text-sm text-[var(--color-text-primary)] focus:border-[#348CB2] focus:outline-none"
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
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Masukkan kata sandi"
                    className="w-full rounded-xl border border-[var(--color-border-strong)] bg-[var(--color-surface)] pl-10 pr-10 py-2.5 text-sm text-[var(--color-text-primary)] focus:border-[#348CB2] focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    aria-label={
                      showPassword ? 'Sembunyikan sandi' : 'Lihat sandi'
                    }
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] cursor-pointer"
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
                    className="h-4 w-4 rounded border-[var(--color-border-strong)] text-[#348CB2]"
                  />
                  <span>Ingat saya</span>
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setForgotSubmitted(false);
                    setForgotModalOpen(true);
                  }}
                  className="font-semibold text-[#348CB2] dark:text-[#87CEEB] hover:underline cursor-pointer"
                >
                  Lupa password?
                </button>
              </div>

              <button
                type="submit"
                className="w-full rounded-xl bg-[#348CB2] hover:bg-[#236D91] py-3 text-sm font-bold text-white shadow-sm transition-colors cursor-pointer"
              >
                Masuk
              </button>
              <button
                type="button"
                disabled={!identifier.includes('@') || password.length < 12}
                onClick={async () => {
                  try {
                    const verificationRequired = await auth.signUp(identifier, password);
                    setLoginError(verificationRequired
                      ? 'Akun dibuat. Periksa email untuk verifikasi sebelum masuk.'
                      : 'Akun dibuat. Pilih organisasi atau terima undangan setelah verifikasi.');
                  } catch (err) {
                    setLoginError(err instanceof Error ? err.message : 'Pendaftaran gagal.');
                  }
                }}
                className="w-full rounded-xl border border-[#348CB2] py-2.5 text-sm font-semibold text-[#236D91] dark:text-[#87CEEB] disabled:opacity-40 cursor-pointer"
              >
                Buat akun baru
              </button>
            </form>

            <div className="my-4 flex items-center gap-3 text-xs text-[var(--color-text-muted)]">
              <div className="h-px flex-1 bg-[var(--color-border)]" />
              <span>atau</span>
              <div className="h-px flex-1 bg-[var(--color-border)]" />
            </div>

            <div className="space-y-2.5">
              <button
                type="button"
                onClick={() => {
                  setOtpSent(false);
                  setOtpCode('');
                  setOtpModalOpen(true);
                }}
                className="w-full inline-flex items-center justify-center gap-2 rounded-xl border border-[#348CB2] bg-[var(--color-surface)] py-2.5 text-sm font-semibold text-[#236D91] dark:text-[#87CEEB] hover:bg-[#F3FAFC] dark:hover:bg-[#19394B] transition-colors cursor-pointer"
              >
                <Smartphone className="h-4 w-4" />
                <span>Masuk dengan Kode OTP</span>
              </button>

              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={workspaceLoading}
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
                  {workspaceLoading
                    ? 'Menghubungkan Google Workspace...'
                    : 'Sign in with Google Workspace'}
                </span>
              </button>
            </div>

            <div className="mt-6 flex items-center justify-center gap-2 rounded-xl bg-[#F3FAFC] dark:bg-[#172438] px-3 py-2 text-xs text-[var(--color-text-secondary)]">
              <ShieldCheck className="h-4 w-4 text-[#348CB2] shrink-0" />
              <span>Akses aman dengan enkripsi SalesX-Ai</span>
            </div>

            <p className="mt-4 text-center text-xs text-[var(--color-text-muted)]">
              Bergabung sebagai Sales? Hubungi Admin Perusahaan Anda atau{' '}
              <Link
                href="/#daftar"
                className="font-semibold text-[#348CB2] hover:underline"
              >
                Daftar Langganan
              </Link>
              .
            </p>
          </div>
        )}

        {step === 'gps' && (
          <div className="text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[#E5F4F8] dark:bg-[#19394B] text-[#348CB2] dark:text-[#87CEEB]">
              <MapPin className="h-8 w-8" />
            </div>
            <h2 className="mt-4 text-xl font-bold text-[#123A54] dark:text-white">
              Akses Lokasi Diperlukan
            </h2>
            <p className="mt-2 text-sm text-[var(--color-text-secondary)] leading-relaxed">
              SalesX-Ai membutuhkan akses lokasi selama jam kerja aktif untuk:
            </p>

            <ul className="mt-5 space-y-2.5 text-left rounded-2xl border border-[var(--color-border)] bg-[var(--color-background)] p-4 text-xs sm:text-sm text-[var(--color-text-primary)]">
              {[
                'Absensi & validasi geofence kantor/outlet',
                'Monitoring bukti kunjungan outlet akurat',
                'Pengiriman lokasi real-time saat shift aktif',
                'Pencatatan rute aktivitas lapangan otomatis',
              ].map((item) => (
                <li key={item} className="flex items-start gap-2.5">
                  <CheckCircle2 className="h-4 w-4 text-[#10B981] shrink-0 mt-0.5" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>

            <div className="mt-6 space-y-2.5">
              <button
                type="button"
                onClick={handleRequestGps}
                disabled={gpsLoading}
                className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-[#348CB2] hover:bg-[#236D91] py-3 text-sm font-bold text-white shadow-sm transition-colors cursor-pointer"
              >
                <Navigation className="h-4 w-4" />
                <span>
                  {gpsLoading
                    ? 'Memverifikasi GPS...'
                    : 'Izinkan Akses Lokasi'}
                </span>
              </button>
              <button
                type="button"
                onClick={() => setStep('shift')}
                className="w-full rounded-xl border border-[var(--color-border-strong)] bg-[var(--color-surface)] py-2.5 text-sm font-semibold text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-muted)] transition-colors cursor-pointer"
              >
                Nanti
              </button>
            </div>
          </div>
        )}

        {step === 'shift' && (
          <div className="text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[#E5F4F8] dark:bg-[#19394B] text-[#348CB2] dark:text-[#87CEEB]">
              <Calendar className="h-8 w-8" />
            </div>
            <h2 className="mt-4 text-xl font-bold text-[#123A54] dark:text-white">
              Mulai Sesi Kerja
            </h2>
            <p className="mt-2 text-sm text-[var(--color-text-secondary)]">
              Halo, <strong>{workspaceInfo?.name || SALES_REP_PROFILE.name}</strong>.
              Mulai sesi kerja untuk mengaktifkan absensi geofence dan fitur
              pelacakan rute selama jam kerja.
            </p>

            <div className="mt-5 space-y-3 text-left">
              <div className="flex items-center gap-3 rounded-2xl border border-[var(--color-border)] bg-[var(--color-background)] p-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#E5F4F8] dark:bg-[#19394B] text-[#348CB2] shrink-0">
                  <Clock className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-[var(--color-text-muted)]">
                    Jadwal Hari Ini
                  </p>
                  <p className="text-sm font-bold text-[var(--color-text-primary)] tabular-nums">
                    Senin · {SALES_REP_PROFILE.shiftSchedule}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 rounded-2xl border border-[var(--color-border)] bg-[var(--color-background)] p-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#ECFDF5] dark:bg-[#064E3B]/50 text-[#10B981] shrink-0">
                  <MapPin className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-[var(--color-text-muted)]">
                    Geofence {SALES_REP_PROFILE.officeName}
                  </p>
                  <p className="text-sm font-bold text-[var(--color-text-primary)] tabular-nums">
                    Radius {SALES_REP_PROFILE.geofenceRadiusM} meter ·{' '}
                    {gpsGranted ? 'GPS Terhubung' : 'Koordinat Area Bogor'}
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-6 space-y-2.5">
              <button
                type="button"
                onClick={() =>
                  onCompleteLogin({
                    gpsGranted,
                    shiftStarted: true,
                    coords: gpsCoords,
                    workspaceConnected: Boolean(workspaceInfo),
                    workspaceUserName: workspaceInfo?.name,
                    workspaceUserEmail: workspaceInfo?.email,
                  })
                }
                className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-[#348CB2] hover:bg-[#236D91] py-3 text-sm font-bold text-white shadow-sm transition-colors cursor-pointer"
              >
                <Play className="h-4 w-4" />
                <span>Mulai Sesi Kerja</span>
              </button>
              <button
                type="button"
                onClick={() =>
                  onCompleteLogin({
                    gpsGranted,
                    shiftStarted: false,
                    coords: gpsCoords,
                    workspaceConnected: Boolean(workspaceInfo),
                    workspaceUserName: workspaceInfo?.name,
                    workspaceUserEmail: workspaceInfo?.email,
                  })
                }
                className="w-full rounded-xl border border-[var(--color-border-strong)] bg-[var(--color-surface)] py-2.5 text-sm font-semibold text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-muted)] transition-colors cursor-pointer"
              >
                Masuk Dashboard Tanpa Memulai Shift
              </button>
            </div>
          </div>
        )}
      </div>

      <p className="text-center text-xs text-[var(--color-text-muted)]">
        SalesX-Ai Smart Sales Portal · PWA v1.0.0
      </p>

      {/* OTP Login Modal */}
      <Modal
        open={otpModalOpen}
        onClose={() => setOtpModalOpen(false)}
        title="Masuk dengan Kode OTP"
        subtitle="Verifikasi cepat melalui nomor WhatsApp atau SMS terdaftar"
        maxWidthClass="max-w-sm"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-[var(--color-text-primary)] mb-1.5">
              Nomor HP / WhatsApp
            </label>
            <input
              type="tel"
              value={otpPhone}
              onChange={(e) => setOtpPhone(e.target.value)}
              className="w-full rounded-xl border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-3.5 py-2.5 text-sm tabular-nums"
            />
          </div>
          {!otpSent ? (
            <button
              type="button"
              onClick={() => void handleSendOtp()}
              className="w-full rounded-xl bg-[#348CB2] py-2.5 text-sm font-bold text-white hover:bg-[#236D91] cursor-pointer"
            >
              Kirim Kode OTP
            </button>
          ) : (
            <div className="space-y-3">
              <p className="rounded-lg bg-[#E5F4F8] dark:bg-[#19394B] px-3 py-2 text-xs text-[#236D91] dark:text-[#87CEEB]">
                Kode OTP 6 digit telah dikirim ke {otpPhone}. Masukkan kode
                verifikasi untuk melanjutkan.
              </p>
              <input
                type="text"
                maxLength={6}
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value)}
                placeholder="Masukkan 6 digit OTP (cth: 482910)"
                className="w-full rounded-xl border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-3.5 py-2.5 text-center font-mono text-base tracking-widest"
              />
              <button
                type="button"
                onClick={() => void handleVerifyOtp()}
                disabled={otpCode.trim().length < 4}
                className="w-full rounded-xl bg-[#348CB2] disabled:opacity-50 py-2.5 text-sm font-bold text-white hover:bg-[#236D91] cursor-pointer"
              >
                Verifikasi & Lanjutkan
              </button>
            </div>
          )}
        </div>
      </Modal>

      {/* Forgot Password Modal */}
      <Modal
        open={forgotModalOpen}
        onClose={() => setForgotModalOpen(false)}
        title="Reset Kata Sandi"
        subtitle="Tautan pemulihan akan dikirim ke email perusahaan Anda"
        maxWidthClass="max-w-sm"
      >
        {!forgotSubmitted ? (
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-[var(--color-text-primary)] mb-1.5">
                Email Terdaftar
              </label>
              <input
                type="email"
                value={forgotEmail}
                onChange={(e) => setForgotEmail(e.target.value)}
                className="w-full rounded-xl border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-3.5 py-2.5 text-sm"
              />
            </div>
            <button
              type="button"
              onClick={() => { void auth.requestPasswordReset(forgotEmail).then(() => setForgotSubmitted(true)).catch(err => setLoginError(err instanceof Error ? err.message : 'Permintaan reset gagal.')); }}
              className="w-full rounded-xl bg-[#348CB2] py-2.5 text-sm font-bold text-white hover:bg-[#236D91] cursor-pointer"
            >
              Kirim Tautan Reset
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="rounded-xl bg-[#ECFDF5] dark:bg-[#064E3B]/50 p-3.5 text-xs text-[#047857] dark:text-[#34D399]">
              Permintaan pemulihan kata sandi telah dikirim ke{' '}
              <strong>{forgotEmail}</strong>. Silakan periksa kotak masuk Anda.
            </p>
            <button
              type="button"
              onClick={() => setForgotModalOpen(false)}
              className="w-full rounded-xl border border-[var(--color-border)] py-2.5 text-sm font-semibold cursor-pointer"
            >
              Tutup
            </button>
          </div>
        )}
      </Modal>
    </div>
  );
}
