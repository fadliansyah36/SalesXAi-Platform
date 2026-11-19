'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  Home,
  Users,
  MapPin,
  BarChart3,
  Menu as MenuIcon,
  Clock,
  Navigation,
  Play,
  Pause,
  RotateCcw,
  Target,
  AlertTriangle,
  Bot,
  Settings,
  Search,
  Plus,
  ChevronRight,
  Mail,
  Lock,
  Eye,
  EyeOff,
  BatteryCharging,
  Gauge,
  Compass,
  Award,
  Sparkles,
  UserCheck,
  ShieldCheck,
  Bell,
  Info,
  LogOut,
  Sun,
  Moon,
  Puzzle,
  ShoppingCart,
  Route,
  CalendarClock,
  Edit3,
  Phone,
} from 'lucide-react';
import { BrandLogo } from '@/components/common/BrandLogo';
import { useTheme } from '@/components/providers/AppProviders';
import { SalesGoogleMap } from '@/components/maps/SalesGoogleMap';
import { PortalShell, type PortalNavGroup } from '@/components/design-system/PortalShell';
import { KpiMetricCard } from '@/components/design-system/KpiMetricCard';
import { StatusTag } from '@/components/design-system/StatusTag';
import { PluginActivationModal } from '@/components/design-system/PluginActivationModal';
import { PortalAiCoachModal } from '@/components/design-system/PortalAiCoachModal';
import { useSalesXAuth } from '@/components/providers/AppProviders';
import { PortalSignupAction } from '@/components/auth/PortalSignupAction';
import { SupabaseOtpLoginModal } from '@/components/auth/SupabaseOtpLoginModal';
import {
  formatRupiah,
  INITIAL_NOTIFICATIONS,
  INITIAL_OUTLETS,
  type NotificationItem,
  type Outlet,
} from '@/lib/salesx-data';
import {
  SUPERVISOR_PROFILE,
  SUPERVISOR_VISIT_TREND,
  INITIAL_SUPERVISOR_TEAM,
  INITIAL_SUPERVISOR_VISITS,
  ROUTE_REPLAY_BY_REP,
  SUPERVISOR_TEAM_GROUPS,
  AREA_COVERAGE_STATS,
  TEAM_TARGET_PROGRESS_BARS,
  INITIAL_SUPERVISOR_TIMELINE,
  INITIAL_SUPERVISOR_ALERTS,
  SUPERVISOR_REPORTS_LIST,
  type SupervisorTeamRep,
  type SupervisorVisitItem,
  type SupervisorAlertItem,
} from '@/lib/salesx-portals-data';
import {
  AddTeamRosterModal,
  ShiftDetailModal,
  VisitEvidenceSupervisorModal,
  CreateFollowUpModal,
  SupervisorReportModal,
  SupervisorSettingsModal,
  SupervisorNotificationsModal,
  SupervisorRepDetailModal,
  AllVisitsModal,
  FullRankingModal,
  SupervisorProfileModal,
  SupervisorSecurityModal,
  AboutSalesXModal,
} from './SupervisorModals';

export type SupervisorTab =
  | 'dashboard'
  | 'team'
  | 'shifts'
  | 'live_map'
  | 'visits'
  | 'route_replay'
  | 'coverage'
  | 'performance'
  | 'targets'
  | 'timeline'
  | 'alerts'
  | 'reports'
  | 'settings';

export function SupervisorPortalApp() {
  const auth = useSalesXAuth();
  const { theme, toggleTheme } = useTheme();

  // Auth
  const authenticated = auth.status === 'authenticated';
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [authNotice, setAuthNotice] = useState<string | null>(null);
  const [oauthBusy, setOauthBusy] = useState(false);
  const [otpModalOpen, setOtpModalOpen] = useState(false);

  // Navigation
  const [activeTab, setActiveTab] = useState<SupervisorTab>('dashboard');
  const [dateFilter, setDateFilter] = useState('Hari ini, 24 Jun 2025');

  // Domain state
  const [supervisorProfile, setSupervisorProfile] = useState({
    name: SUPERVISOR_PROFILE.name,
    roleTitle: SUPERVISOR_PROFILE.roleTitle,
    phone: SUPERVISOR_PROFILE.phone,
    email: SUPERVISOR_PROFILE.email,
  });
  const [teamReps, setTeamReps] = useState<SupervisorTeamRep[]>(
    INITIAL_SUPERVISOR_TEAM
  );
  const [visits, setVisits] = useState<SupervisorVisitItem[]>(
    INITIAL_SUPERVISOR_VISITS
  );
  const [alerts, setAlerts] = useState<SupervisorAlertItem[]>(
    INITIAL_SUPERVISOR_ALERTS
  );
  const [notifications, setNotifications] = useState<NotificationItem[]>(
    INITIAL_NOTIFICATIONS
  );

  // Screen filters
  const [teamSearch, setTeamSearch] = useState('');
  const [teamFilter, setTeamFilter] = useState<'Semua' | 'Aktif' | 'Nonaktif'>('Semua');
  const [shiftPeriod, setShiftPeriod] = useState<'Hari Ini' | 'Minggu Ini' | 'Bulan Ini'>(
    'Hari Ini'
  );
  const [shiftStatusFilter, setShiftStatusFilter] = useState<
    'Semua' | 'Dalam Shift' | 'Terlambat' | 'Belum Masuk'
  >('Semua');
  const [liveTeamScope, setLiveTeamScope] = useState<'Semua Tim' | 'Online Saja'>(
    'Semua Tim'
  );
  const [liveAreaFilter, setLiveAreaFilter] = useState<string>('Area Bogor');
  const [selectedLiveRepId, setSelectedLiveRepId] = useState('sup-rep-1');
  const [visitSubTab, setVisitSubTab] = useState<'Berlangsung' | 'Selesai' | 'Rencana'>(
    'Berlangsung'
  );

  // Route Replay interactive player
  const [replayRepId, setReplayRepId] = useState('sup-rep-1');
  const [replayPlaying, setReplayPlaying] = useState(false);
  const [replayStepIdx, setReplayStepIdx] = useState(1);
  const [replaySpeed, setReplaySpeed] = useState<1 | 2 | 4>(1);

  const [coverageTab, setCoverageTab] = useState<'Peta Cakupan' | 'Daftar Outlet'>(
    'Peta Cakupan'
  );
  const [selectedCoverageOutlet, setSelectedCoverageOutlet] = useState<Outlet>(
    INITIAL_OUTLETS[0]
  );
  const [perfTab, setPerfTab] = useState<'Individu' | 'Tim' | 'Ranking'>('Individu');
  const [targetPeriod, setTargetPeriod] = useState<'Bulan Ini' | 'Kuartal Ini'>('Bulan Ini');
  const [timelineRepId, setTimelineRepId] = useState('sup-rep-1');
  const [alertFilter, setAlertFilter] = useState<'Semua' | 'Penting' | 'Follow-up'>(
    'Semua'
  );

  // Modals
  const [addTeamOpen, setAddTeamOpen] = useState(false);
  const [editingRep, setEditingRep] = useState<SupervisorTeamRep | null>(null);
  const [shiftDetailRep, setShiftDetailRep] = useState<SupervisorTeamRep | null>(null);
  const [visitEvidence, setVisitEvidence] = useState<SupervisorVisitItem | null>(null);
  const [allVisitsOpen, setAllVisitsOpen] = useState(false);
  const [fullRankingOpen, setFullRankingOpen] = useState(false);
  const [createFollowUpOpen, setCreateFollowUpOpen] = useState(false);
  const [activeReportModal, setActiveReportModal] = useState<{
    title: string;
    subtitle: string;
    metric: string;
  } | null>(null);
  const [settingsModalSection, setSettingsModalSection] = useState<string | null>(null);
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [securityModalOpen, setSecurityModalOpen] = useState(false);
  const [aboutModalOpen, setAboutModalOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [pluginsModalOpen, setPluginsModalOpen] = useState(false);
  const [pluginDefaultTab, setPluginDefaultTab] = useState<
    'workspace' | 'maps' | 'ai' | 'telegram'
  >('workspace');
  const [aiCoachOpen, setAiCoachOpen] = useState(false);
  const [aiInitialPrompt, setAiInitialPrompt] = useState<string | undefined>(undefined);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3200);
  };

  const activeReplayRoute =
    ROUTE_REPLAY_BY_REP[replayRepId] || ROUTE_REPLAY_BY_REP['sup-rep-1'];
  const replayWaypoints = activeReplayRoute.waypoints;

  useEffect(() => {
    if (!replayPlaying) return;
    const intervalMs = Math.round(1800 / replaySpeed);
    const len = replayWaypoints.length;
    const timer = setInterval(() => {
      setReplayStepIdx((prev) => (prev >= len - 1 ? 0 : prev + 1));
    }, intervalMs);
    return () => clearInterval(timer);
  }, [replayPlaying, replaySpeed, replayWaypoints.length]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const navGroups: PortalNavGroup<SupervisorTab>[] = [
    {
      group: 'Ringkasan',
      items: [
        { id: 'dashboard', label: 'Beranda Supervisor', icon: Home },
        { id: 'team', label: 'Team Roster', icon: Users },
        { id: 'shifts', label: 'Shift & Kehadiran', icon: Clock },
      ],
    },
    {
      group: 'Lapangan & GPS',
      items: [
        { id: 'live_map', label: 'Live Location Tim', icon: MapPin },
        { id: 'visits', label: 'Kunjungan Hari Ini', icon: Navigation },
        { id: 'route_replay', label: 'Replay Rute', icon: Route },
        { id: 'coverage', label: 'Cakupan Outlet', icon: Compass },
      ],
    },
    {
      group: 'Performa & Tindak Lanjut',
      items: [
        { id: 'performance', label: 'Performa Tim', icon: Award },
        { id: 'targets', label: 'Target & Realisasi', icon: Target },
        { id: 'timeline', label: 'Timeline Aktivitas', icon: CalendarClock },
        { id: 'alerts', label: 'Peringatan & Tindak Lanjut', icon: AlertTriangle },
        { id: 'reports', label: 'Laporan & AI Coach', icon: BarChart3 },
      ],
    },
    {
      group: 'Akun',
      items: [{ id: 'settings', label: 'Profil & Pengaturan', icon: Settings }],
    },
  ];

  const bottomNavItems = [
    { id: 'dashboard' as SupervisorTab, label: 'Beranda', icon: Home },
    { id: 'team' as SupervisorTab, label: 'Tim', icon: Users },
    { id: 'live_map' as SupervisorTab, label: 'Peta', icon: MapPin },
    { id: 'reports' as SupervisorTab, label: 'Laporan', icon: BarChart3 },
    { id: 'settings' as SupervisorTab, label: 'Lainnya', icon: MenuIcon },
  ];

  const filteredTeam = useMemo(() => {
    return teamReps.filter((r) => {
      const matchSearch =
        r.name.toLowerCase().includes(teamSearch.toLowerCase()) ||
        r.areaLabel.toLowerCase().includes(teamSearch.toLowerCase());
      const matchFilter =
        teamFilter === 'Semua' || r.status === teamFilter;
      return matchSearch && matchFilter;
    });
  }, [teamReps, teamSearch, teamFilter]);

  const activeLiveRep =
    teamReps.find((r) => r.id === selectedLiveRepId) || teamReps[0];

  const liveFilteredReps = useMemo(() => {
    return teamReps.filter((r) => {
      if (liveTeamScope === 'Online Saja' && !r.online) return false;
      if (liveAreaFilter !== 'Semua Area' && r.cityArea !== liveAreaFilter)
        return false;
      return true;
    });
  }, [teamReps, liveTeamScope, liveAreaFilter]);

  const activeWaypoint = replayWaypoints[replayStepIdx] || replayWaypoints[0];
  const activeReplayRep =
    teamReps.find((r) => r.id === replayRepId) || teamReps[0];

  const timelineEvents = useMemo(() => {
    const list = INITIAL_SUPERVISOR_TIMELINE.filter(
      (ev) => ev.repId === timelineRepId
    );
    return list.length > 0 ? list : INITIAL_SUPERVISOR_TIMELINE.slice(0, 6);
  }, [timelineRepId]);

  const filteredAlerts = useMemo(() => {
    if (alertFilter === 'Semua') return alerts;
    return alerts.filter((a) => a.severity === alertFilter);
  }, [alerts, alertFilter]);

  const handleGoogleLogin = async () => {
    setOauthBusy(true);
    setAuthNotice(null);
    try { await auth.signInWithOAuth('google'); }
    catch (err) { setAuthNotice(err instanceof Error ? err.message : 'Autentikasi Google Supabase gagal.'); setOauthBusy(false); }
  };

  /* -------------------- SCREEN 1: LOGIN / MASUK -------------------- */
  if (authenticated && !auth.canAccessPortal('supervisor')) {
    return <main className="flex min-h-screen items-center justify-center p-6"><section className="max-w-md rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 text-center"><h1 className="text-lg font-bold">Akses portal tidak tersedia</h1><p className="mt-2 text-sm text-[var(--color-text-secondary)]">Role aktif tidak memiliki permission untuk portal ini.</p><button onClick={() => void auth.signOut('local')} className="mt-4 rounded-lg bg-[#236D91] px-4 py-2 text-white">Keluar</button></section></main>;
  }
  if (!authenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#F3FAFC] via-[#E5F4F8] to-white dark:from-[#0B1220] dark:via-[#111C2D] dark:to-[#0B1220] flex flex-col justify-between p-4 sm:p-8">
        <div className="mx-auto w-full max-w-md flex items-center justify-between">
          <Link href="/">
            <BrandLogo subtitle="SUPERVISOR PORTAL" compact />
          </Link>
          <button
            type="button"
            onClick={toggleTheme}
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] cursor-pointer"
            aria-label="Ganti tema"
          >
            {theme === 'light' ? (
              <Moon className="h-4 w-4" />
            ) : (
              <Sun className="h-4 w-4" />
            )}
          </button>
        </div>

        <div className="mx-auto w-full max-w-md my-8 rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 sm:p-8 shadow-sm">
          <div className="flex flex-col items-center text-center">
            <BrandLogo subtitle="SUPERVISOR PORTAL" />
            <h1 className="mt-5 text-2xl font-bold text-[#123A54] dark:text-white">
              Portal Supervisor SalesX-Ai
            </h1>
            <p className="mt-1.5 text-xs sm:text-sm text-[var(--color-text-secondary)]">
              Monitoring tim sales, kunjungan, lokasi, target, dan performa wilayah secara realtime.
            </p>
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!loginEmail.trim() || !loginPassword.trim()) {
                setAuthNotice('Mohon isi Email/No. HP dan Password Anda.');
                return;
              }
              setAuthNotice(null);
              try { await auth.signInWithPassword(loginEmail, loginPassword); }
    catch (err) { setAuthNotice(err instanceof Error ? err.message : 'Login gagal.'); }
            }}
            className="mt-6 space-y-3.5 text-sm"
          >
            <div className="relative">
              <Mail className="pointer-events-none absolute left-3.5 top-3.5 h-4 w-4 text-[var(--color-text-muted)]" />
              <input
                type="text"
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                placeholder="Email / No. HP"
                className="w-full rounded-xl border border-[var(--color-border-strong)] bg-[var(--color-background)] pl-10 pr-4 py-3 text-xs sm:text-sm"
              />
            </div>

            <div className="relative">
              <Lock className="pointer-events-none absolute left-3.5 top-3.5 h-4 w-4 text-[var(--color-text-muted)]" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                placeholder="Password"
                className="w-full rounded-xl border border-[var(--color-border-strong)] bg-[var(--color-background)] pl-10 pr-10 py-3 text-xs sm:text-sm"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3 top-3 text-[var(--color-text-muted)] cursor-pointer"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>

            <div className="flex items-center justify-between text-xs">
              <label className="inline-flex items-center gap-2 cursor-pointer text-[var(--color-text-secondary)]">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="h-4 w-4 accent-[#348CB2]"
                />
                <span>Ingat saya</span>
              </label>
              <button
                type="button"
                onClick={() => { void auth.requestPasswordReset(loginEmail).then(() => setAuthNotice('Instruksi pemulihan dikirim jika email terdaftar.')).catch(err => setAuthNotice(err instanceof Error ? err.message : 'Reset password gagal.')); }}
                className="font-semibold text-[#348CB2] hover:underline cursor-pointer"
              >
                Lupa password?
              </button>
            </div>

            {authNotice && (
              <div className="rounded-xl border border-[#ADD8E6] bg-[#F3FAFC] dark:bg-[#172438] p-3 text-xs text-[#194F70] dark:text-[#87CEEB]">
                {authNotice}
              </div>
            )}

            <button
              type="submit"
              className="w-full rounded-xl bg-[#194F70] hover:bg-[#123A54] py-3 text-sm font-bold text-white cursor-pointer"
            >
              Masuk
            </button>

            <div className="flex items-center gap-3 text-xs text-[var(--color-text-muted)]">
              <span className="h-px flex-1 bg-[var(--color-border)]" />
              <span>atau</span>
              <span className="h-px flex-1 bg-[var(--color-border)]" />
            </div>

            <button
              type="button"
              onClick={() => setOtpModalOpen(true)}
              className="w-full rounded-xl border border-[#348CB2] py-2.5 text-sm font-bold text-[#194F70] dark:text-[#87CEEB] cursor-pointer"
            >
              Masuk dengan Kode OTP
            </button>

            <button
              type="button"
              disabled={oauthBusy}
              onClick={handleGoogleLogin}
              className="w-full inline-flex items-center justify-center gap-2 rounded-xl border border-[var(--color-border-strong)] py-2.5 text-xs font-semibold cursor-pointer"
            >
              <Mail className="h-4 w-4 text-[#348CB2]" />
              <span>
                {oauthBusy ? 'Menghubungkan...' : 'Masuk dengan Google Workspace'}
              </span>
            </button>
          
            <PortalSignupAction email={loginEmail} password={loginPassword} onMessage={setAuthNotice} />
</form>
        </div>

        <p className="text-center text-xs text-[var(--color-text-muted)]">
          © 2026 SalesX-Ai · Supervisor Portal
        </p>

        <SupabaseOtpLoginModal
          open={otpModalOpen}
          onClose={() => setOtpModalOpen(false)}
          onSuccess={() => setAuthNotice('OTP pada modal ini belum terhubung ke Supabase Auth. Gunakan metode OTP terverifikasi melalui endpoint Auth.')}
        />
      </div>
    );
  }

  return (
    <PortalShell<SupervisorTab>
      portalSubtitle="SUPERVISOR PORTAL"
      entityName={supervisorProfile.name}
      entityBadge={supervisorProfile.roleTitle}
      activeTab={activeTab}
      onSelectTab={setActiveTab}
      navGroups={navGroups}
      bottomNavItems={bottomNavItems}
      unreadNotificationsCount={unreadCount}
      onOpenNotifications={() => setNotificationsOpen(true)}
      onOpenPlugins={() => {
        setPluginDefaultTab('workspace');
        setPluginsModalOpen(true);
      }}
      onOpenAiAssistant={() => {
        setAiInitialPrompt(undefined);
        setAiCoachOpen(true);
      }}
      aiAssistantLabel="AI Sales Coach"
      onRequestLogout={() => void auth.signOut('local')}
      currentPortalPath="/supervisor"
    >
      {toastMsg && (
        <div className="mb-4 rounded-xl border border-[#A7F3D0] bg-[#ECFDF5] dark:bg-[#064E3B]/50 px-4 py-2.5 text-xs font-semibold text-[#047857] dark:text-[#34D399] flex items-center justify-between">
          <span>{toastMsg}</span>
          <button
            type="button"
            onClick={() => setToastMsg(null)}
            className="text-[11px] underline cursor-pointer"
          >
            Tutup
          </button>
        </div>
      )}

      {/* -------------------- SCREEN 2: SUPERVISOR DASHBOARD -------------------- */}
      {activeTab === 'dashboard' && (
        <div className="space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-[#123A54] dark:text-white">
                Halo, {supervisorProfile.name}
              </h2>
              <p className="text-xs sm:text-sm text-[var(--color-text-secondary)]">
                {supervisorProfile.roleTitle}
              </p>
            </div>
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="rounded-xl border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-3.5 py-2 text-xs font-semibold"
            >
              <option value="Hari ini, 24 Jun 2025">Hari ini, 24 Jun 2025</option>
              <option value="Minggu ini, Jun 2025">Minggu ini, Jun 2025</option>
              <option value="Bulan ini, Jun 2025">Bulan ini, Jun 2025</option>
            </select>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
            <KpiMetricCard
              label="Tim Aktif"
              value={`${teamReps.filter((r) => r.status === 'Aktif').length + 8} / ${teamReps.length + 10}`}
              sublabel="Dalam shift"
              trendTone="positive"
              icon={<Users className="h-5 w-5" />}
              onClick={() => setActiveTab('shifts')}
            />
            <KpiMetricCard
              label="Kunjungan"
              value={
                dateFilter === 'Hari ini, 24 Jun 2025'
                  ? `${SUPERVISOR_PROFILE.visitsTodayCount}`
                  : dateFilter === 'Minggu ini, Jun 2025'
                  ? '492'
                  : '2.140'
              }
              trend={SUPERVISOR_PROFILE.visitsGrowth}
              trendTone="positive"
              accentBgClass="bg-[#ECFDF5] dark:bg-[#064E3B]/50 text-[#047857]"
              icon={<MapPin className="h-5 w-5" />}
              onClick={() => setActiveTab('visits')}
            />
            <KpiMetricCard
              label="Order"
              value={
                dateFilter === 'Hari ini, 24 Jun 2025'
                  ? `Rp ${SUPERVISOR_PROFILE.ordersValueJt.toFixed(1).replace('.', ',')} jt`
                  : dateFilter === 'Minggu ini, Jun 2025'
                  ? 'Rp 498,5 jt'
                  : 'Rp 1.942,0 jt'
              }
              trend={SUPERVISOR_PROFILE.ordersGrowth}
              trendTone="positive"
              icon={<ShoppingCart className="h-5 w-5" />}
              onClick={() => setActiveTab('performance')}
            />
            <KpiMetricCard
              label="Target"
              value={
                dateFilter === 'Hari ini, 24 Jun 2025'
                  ? `${SUPERVISOR_PROFILE.targetPct.toString().replace('.', ',')}%`
                  : dateFilter === 'Minggu ini, Jun 2025'
                  ? '79,2%'
                  : '84,6%'
              }
              sublabel={
                dateFilter === 'Hari ini, 24 Jun 2025'
                  ? 'Realisasi Rp 382 jt'
                  : dateFilter === 'Minggu ini, Jun 2025'
                  ? 'Realisasi Rp 498,5 jt'
                  : 'Realisasi Rp 1,94 M'
              }
              trendTone="warning"
              accentBgClass="bg-[#FFFBEB] dark:bg-[#451A03]/40 text-[#B45309]"
              icon={<Target className="h-5 w-5" />}
              onClick={() => setActiveTab('targets')}
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            {/* Tren Kunjungan Tim Chart */}
            <div className="lg:col-span-7 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-[#123A54] dark:text-white">
                    Tren Kunjungan Tim
                  </h3>
                  <p className="text-xs text-[var(--color-text-muted)]">
                    Rata-rata kunjungan efektif harian per bulan
                  </p>
                </div>
                <span className="text-xs font-bold text-[#047857] font-mono tabular-nums">
                  +14,6%
                </span>
              </div>
              <div className="grid grid-cols-6 gap-2.5 items-end h-44 pt-4">
                {SUPERVISOR_VISIT_TREND.map((row) => (
                  <div
                    key={row.month}
                    className="flex flex-col items-center gap-2 h-full justify-end"
                  >
                    <span className="text-[10px] font-mono font-semibold text-[var(--color-text-muted)] tabular-nums">
                      {row.visits}
                    </span>
                    <div
                      className="w-full max-w-[44px] rounded-t-lg bg-gradient-to-t from-[#194F70] via-[#348CB2] to-[#87CEEB]"
                      style={{ height: `${Math.round((row.visits / 36) * 100)}%` }}
                    />
                    <span className="text-xs font-semibold text-[var(--color-text-secondary)]">
                      {row.month}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* 4 Quick Shortcuts from Screen 2 */}
            <div className="lg:col-span-5 space-y-4">
              <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5">
                <h3 className="text-sm font-bold text-[#123A54] dark:text-white mb-3">
                  Kontrol Lapangan Cepat
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: 'Lokasi Tim', sub: 'Live GPS Map', tab: 'live_map' as SupervisorTab, icon: MapPin },
                    { label: 'Kunjungan', sub: 'History & Replay', tab: 'visits' as SupervisorTab, icon: Navigation },
                    { label: 'Target Tim', sub: '76,4% Tercapai', tab: 'targets' as SupervisorTab, icon: Target },
                    { label: 'Laporan & AI', sub: 'AI Sales Coach', tab: 'reports' as SupervisorTab, icon: BarChart3 },
                  ].map((item) => {
                    const Icon = item.icon;
                    return (
                      <button
                        key={item.label}
                        type="button"
                        onClick={() => setActiveTab(item.tab)}
                        className="flex flex-col items-start gap-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] p-3.5 text-left hover:border-[#348CB2] cursor-pointer"
                      >
                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#E5F4F8] dark:bg-[#19394B] text-[#348CB2]">
                          <Icon className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="text-xs font-bold">{item.label}</p>
                          <p className="text-[11px] text-[var(--color-text-muted)]">{item.sub}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="rounded-2xl bg-gradient-to-r from-[#194F70] to-[#348CB2] p-4 text-white flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-bold flex items-center gap-1.5">
                    <AlertTriangle className="h-4 w-4 text-[#FBBF24]" />
                    <span>{alerts.filter((a) => !a.resolved).length} Peringatan Tim Aktif</span>
                  </p>
                  <p className="text-[11px] text-white/85 mt-0.5">
                    Cek status GPS nonaktif, keterlambatan shift & target area Bekasi.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveTab('alerts')}
                  className="rounded-xl bg-white px-3 py-2 text-xs font-bold text-[#123A54] shrink-0 cursor-pointer"
                >
                  Tindak Lanjut
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* -------------------- SCREEN 3: TEAM ROSTER -------------------- */}
      {activeTab === 'team' && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-[#123A54] dark:text-white">
                Team Roster
              </h2>
              <p className="text-xs text-[var(--color-text-secondary)]">
                Daftar seluruh anggota tim sales di bawah pengawasan Anda
              </p>
            </div>
            <button
              type="button"
              onClick={() => setAddTeamOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-xl bg-[#194F70] hover:bg-[#123A54] px-4 py-2 text-xs font-bold text-white cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              <span>+ Tambah Anggota</span>
            </button>
          </div>

          <div className="flex flex-wrap gap-2">
            {(
              [
                { id: 'Semua', label: `Semua (${10 + teamReps.length})` },
                {
                  id: 'Aktif',
                  label: `Aktif (${8 + teamReps.filter((r) => r.status === 'Aktif').length})`,
                },
                {
                  id: 'Nonaktif',
                  label: `Nonaktif (${2 + teamReps.filter((r) => r.status === 'Nonaktif').length})`,
                },
              ] as const
            ).map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setTeamFilter(f.id)}
                className={`rounded-xl px-3.5 py-2 text-xs font-semibold cursor-pointer ${
                  teamFilter === f.id
                    ? 'bg-[#194F70] text-white'
                    : 'border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-secondary)]'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--color-text-muted)]" />
            <input
              type="text"
              value={teamSearch}
              onChange={(e) => setTeamSearch(e.target.value)}
              placeholder="Cari nama tim..."
              className="w-full rounded-xl border border-[var(--color-border-strong)] bg-[var(--color-surface)] pl-10 pr-4 py-2.5 text-xs sm:text-sm"
            />
          </div>

          <div className="space-y-2.5">
            {filteredTeam.map((rep) => (
              <div
                key={rep.id}
                className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 flex flex-wrap items-center justify-between gap-3 hover:border-[#348CB2] transition-colors"
              >
                <button
                  type="button"
                  onClick={() => {
                    setTimelineRepId(rep.id);
                    setActiveTab('timeline');
                  }}
                  className="flex flex-1 items-center gap-3 min-w-0 text-left cursor-pointer"
                >
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#194F70] text-white font-bold text-xs">
                    {rep.name
                      .split(' ')
                      .map((n) => n[0])
                      .join('')
                      .slice(0, 2)}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-bold truncate">{rep.name}</p>
                    <p className="text-xs text-[var(--color-text-muted)]">
                      {rep.areaLabel} · {rep.phone}
                    </p>
                  </div>
                </button>
                <div className="flex items-center gap-2 shrink-0">
                  <StatusTag label={rep.status} showIcon />
                  <button
                    type="button"
                    onClick={() => setEditingRep(rep)}
                    className="inline-flex items-center gap-1 rounded-lg border border-[var(--color-border-strong)] px-2.5 py-1 text-[11px] font-semibold hover:bg-[var(--color-surface-muted)] cursor-pointer"
                  >
                    <Edit3 className="h-3 w-3" />
                    <span>Kelola</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setTimelineRepId(rep.id);
                      setActiveTab('timeline');
                    }}
                    aria-label={`Timeline ${rep.name}`}
                    className="p-1 text-[var(--color-text-muted)] cursor-pointer"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* -------------------- SCREEN 4: SHIFT & KEHADIRAN TIM -------------------- */}
      {activeTab === 'shifts' && (
        <div className="space-y-4">
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-[#123A54] dark:text-white">
              Shift & Kehadiran Tim
            </h2>
            <p className="text-xs text-[var(--color-text-secondary)]">
              Rekap absensi geofence & ketepatan waktu mulai shift
            </p>
          </div>

          <div className="grid grid-cols-3 gap-1 rounded-xl bg-[var(--color-surface-muted)] p-1 max-w-md text-xs font-semibold">
            {(['Hari Ini', 'Minggu Ini', 'Bulan Ini'] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setShiftPeriod(t)}
                className={`rounded-lg py-2 cursor-pointer ${
                  shiftPeriod === t
                    ? 'bg-[#194F70] text-white'
                    : 'text-[var(--color-text-secondary)]'
                }`}
              >
                {t}
              </button>
            ))}
          </div>

          {/* Summary Row: Masuk 12 | Terlambat 1 | Belum Masuk 2 (Clickable Filters) */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div
              className={`rounded-2xl transition-all ${
                shiftStatusFilter === 'Dalam Shift' ? 'ring-2 ring-[#348CB2]' : ''
              }`}
            >
              <KpiMetricCard
                label="Masuk"
                value={shiftPeriod === 'Hari Ini' ? '12' : shiftPeriod === 'Minggu Ini' ? '68' : '276'}
                sublabel="Dalam shift"
                trendTone="positive"
                accentBgClass="bg-[#ECFDF5] text-[#047857]"
                icon={<UserCheck className="h-5 w-5" />}
                onClick={() =>
                  setShiftStatusFilter((f) =>
                    f === 'Dalam Shift' ? 'Semua' : 'Dalam Shift'
                  )
                }
              />
            </div>
            <div
              className={`rounded-2xl transition-all ${
                shiftStatusFilter === 'Terlambat' ? 'ring-2 ring-[#348CB2]' : ''
              }`}
            >
              <KpiMetricCard
                label="Terlambat"
                value={shiftPeriod === 'Hari Ini' ? '1' : shiftPeriod === 'Minggu Ini' ? '4' : '11'}
                sublabel="> 08:15 WIB"
                trendTone="warning"
                accentBgClass="bg-[#FFFBEB] text-[#B45309]"
                icon={<Clock className="h-5 w-5" />}
                onClick={() =>
                  setShiftStatusFilter((f) =>
                    f === 'Terlambat' ? 'Semua' : 'Terlambat'
                  )
                }
              />
            </div>
            <div
              className={`rounded-2xl transition-all ${
                shiftStatusFilter === 'Belum Masuk' ? 'ring-2 ring-[#348CB2]' : ''
              }`}
            >
              <KpiMetricCard
                label="Belum Masuk"
                value={shiftPeriod === 'Hari Ini' ? '2' : shiftPeriod === 'Minggu Ini' ? '3' : '5'}
                sublabel="Belum absen"
                trendTone="neutral"
                icon={<AlertTriangle className="h-5 w-5" />}
                onClick={() =>
                  setShiftStatusFilter((f) =>
                    f === 'Belum Masuk' ? 'Semua' : 'Belum Masuk'
                  )
                }
              />
            </div>
          </div>

          {shiftStatusFilter !== 'Semua' && (
            <div className="flex items-center justify-between text-xs text-[var(--color-text-secondary)]">
              <span>
                Menampilkan status shift: <strong>{shiftStatusFilter}</strong>
              </span>
              <button
                type="button"
                onClick={() => setShiftStatusFilter('Semua')}
                className="font-bold text-[#348CB2] hover:underline cursor-pointer"
              >
                Tampilkan Semua
              </button>
            </div>
          )}

          <div className="space-y-2.5">
            {teamReps
              .filter(
                (r) =>
                  shiftStatusFilter === 'Semua' || r.shiftStatus === shiftStatusFilter
              )
              .map((rep) => (
                <button
                  key={rep.id}
                  type="button"
                  onClick={() => setShiftDetailRep(rep)}
                  className="w-full text-left rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 flex items-center justify-between gap-3 hover:border-[#348CB2] cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#348CB2] text-white font-bold text-xs">
                      {rep.name
                        .split(' ')
                        .map((n) => n[0])
                        .join('')
                        .slice(0, 2)}
                    </div>
                    <div>
                      <p className="text-sm font-bold">{rep.name}</p>
                      <p className="text-xs font-mono text-[var(--color-text-muted)]">
                        {rep.clockInTime} · {rep.cityArea}
                      </p>
                    </div>
                  </div>
                  <StatusTag label={rep.shiftStatus} showIcon />
                </button>
              ))}
          </div>
        </div>
      )}

      {/* -------------------- SCREEN 5: LIVE LOCATION TIM -------------------- */}
      {activeTab === 'live_map' && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-[#123A54] dark:text-white">
                Live Location Tim
              </h2>
              <p className="text-xs text-[var(--color-text-secondary)]">
                Pemantauan koordinat GPS tim sales aktif via Google Maps Platform
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() =>
                  setLiveTeamScope((s) =>
                    s === 'Semua Tim' ? 'Online Saja' : 'Semua Tim'
                  )
                }
                className="rounded-xl bg-[#194F70] px-3.5 py-2 text-xs font-bold text-white cursor-pointer"
              >
                {liveTeamScope}
              </button>
              <select
                value={liveAreaFilter}
                onChange={(e) => setLiveAreaFilter(e.target.value)}
                className="rounded-xl border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-3.5 py-2 text-xs font-semibold"
              >
                <option value="Semua Area">Semua Area</option>
                <option value="Area Bogor">Area Bogor</option>
                <option value="Area Depok">Area Depok</option>
                <option value="Area Tangerang">Area Tangerang</option>
                <option value="Area Bekasi">Area Bekasi</option>
              </select>
            </div>
          </div>

          <SalesGoogleMap
            currentPos={{
              lat: activeLiveRep?.lat || -6.597147,
              lng: activeLiveRep?.lng || 106.806039,
            }}
            currentPosLabel={
              activeLiveRep
                ? `Posisi Live: ${activeLiveRep.name} (${activeLiveRep.cityArea})`
                : 'Posisi Live Tim'
            }
            outlets={INITIAL_OUTLETS}
            selectedOutlet={INITIAL_OUTLETS[0]}
            onSelectOutlet={() => {}}
            heightClass="h-[340px]"
          />

          {/* Rep Selector Chips */}
          <div className="flex flex-wrap gap-2">
            {liveFilteredReps.map((r) => (
              <button
                key={r.id}
                type="button"
                onClick={() => setSelectedLiveRepId(r.id)}
                className={`rounded-xl border px-3 py-2 text-xs font-semibold cursor-pointer ${
                  activeLiveRep?.id === r.id
                    ? 'border-[#348CB2] bg-[#E5F4F8] dark:bg-[#19394B] text-[#123A54] dark:text-white'
                    : 'border-[var(--color-border)] bg-[var(--color-surface)]'
                }`}
              >
                {r.name} ({r.online ? 'Online' : 'Offline'})
              </button>
            ))}
          </div>

          {/* Active Rep Telemetry Card matching Screen 5 */}
          {activeLiveRep && (
            <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--color-border)] pb-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#194F70] text-white font-bold text-xs">
                    {activeLiveRep.name
                      .split(' ')
                      .map((n) => n[0])
                      .join('')
                      .slice(0, 2)}
                  </div>
                  <div>
                    <p className="text-sm font-bold">{activeLiveRep.name}</p>
                    <p className="text-xs text-[var(--color-text-muted)]">
                      {activeLiveRep.shiftStatus} · {activeLiveRep.lastSeenLabel}
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <StatusTag label={activeLiveRep.online ? 'Online' : 'Offline'} showIcon />
                  <button
                    type="button"
                    onClick={() => {
                      setPluginDefaultTab('workspace');
                      setPluginsModalOpen(true);
                    }}
                    className="inline-flex items-center gap-1 rounded-xl border border-[var(--color-border-strong)] px-3 py-1.5 text-xs font-semibold cursor-pointer"
                  >
                    <Phone className="h-3.5 w-3.5 text-[#348CB2]" />
                    <span>Hubungi</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (ROUTE_REPLAY_BY_REP[activeLiveRep.id]) {
                        setReplayRepId(activeLiveRep.id);
                        setReplayStepIdx(0);
                      }
                      setActiveTab('route_replay');
                    }}
                    className="rounded-xl border border-[#348CB2] px-3 py-1.5 text-xs font-bold text-[#194F70] dark:text-[#87CEEB] cursor-pointer"
                  >
                    Replay Rute
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className="rounded-xl bg-[var(--color-background)] p-3">
                  <p className="text-[var(--color-text-muted)] flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5 text-[#348CB2]" />
                    <span>Lokasi</span>
                  </p>
                  <p className="font-bold mt-1">{activeLiveRep.locationLabel}</p>
                </div>
                <div className="rounded-xl bg-[var(--color-background)] p-3">
                  <p className="text-[var(--color-text-muted)] flex items-center gap-1">
                    <Gauge className="h-3.5 w-3.5 text-[#348CB2]" />
                    <span>Kecepatan</span>
                  </p>
                  <p className="font-bold font-mono mt-1">{activeLiveRep.speedKmh} km/jam</p>
                </div>
                <div className="rounded-xl bg-[var(--color-background)] p-3">
                  <p className="text-[var(--color-text-muted)] flex items-center gap-1">
                    <BatteryCharging className="h-3.5 w-3.5 text-[#10B981]" />
                    <span>Baterai</span>
                  </p>
                  <p className="font-bold font-mono mt-1">{activeLiveRep.batteryPct}%</p>
                </div>
                <div className="rounded-xl bg-[var(--color-background)] p-3">
                  <p className="text-[var(--color-text-muted)] flex items-center gap-1">
                    <Compass className="h-3.5 w-3.5 text-[#348CB2]" />
                    <span>Akurasi GPS</span>
                  </p>
                  <p className="font-bold font-mono mt-1">±{activeLiveRep.accuracyM} m</p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* -------------------- SCREEN 7: KUNJUNGAN HARI INI & ROUTE HISTORY -------------------- */}
      {activeTab === 'visits' && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-[#123A54] dark:text-white">
                Kunjungan Hari Ini
              </h2>
              <p className="text-xs text-[var(--color-text-secondary)]">
                Pantau check-in outlet berlangsung, kunjungan selesai, dan rencana hari ini
              </p>
            </div>
            <button
              type="button"
              onClick={() => setActiveTab('route_replay')}
              className="rounded-xl bg-[#194F70] hover:bg-[#123A54] px-4 py-2 text-xs font-bold text-white cursor-pointer"
            >
              Replay Rute Tim
            </button>
          </div>

          <div className="grid grid-cols-3 gap-1 rounded-xl bg-[var(--color-surface-muted)] p-1 max-w-md text-xs font-semibold">
            {(['Berlangsung', 'Selesai', 'Rencana'] as const).map((tab) => {
              const count = visits.filter((v) => v.status === tab).length;
              return (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setVisitSubTab(tab)}
                  className={`rounded-lg py-2 cursor-pointer ${
                    visitSubTab === tab
                      ? 'bg-[#194F70] text-white'
                      : 'text-[var(--color-text-secondary)]'
                  }`}
                >
                  {tab} ({count})
                </button>
              );
            })}
          </div>

          <div className="space-y-2.5">
            {visits
              .filter((v) => v.status === visitSubTab)
              .map((v) => (
                <button
                  key={v.id}
                  type="button"
                  onClick={() => setVisitEvidence(v)}
                  className="w-full text-left rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 flex items-center justify-between gap-3 hover:border-[#348CB2] cursor-pointer"
                >
                  <div>
                    <p className="text-sm font-bold">{v.repName}</p>
                    <p className="text-xs font-semibold text-[#194F70] dark:text-[#87CEEB]">
                      {v.outletName}
                    </p>
                    <p className="text-[11px] font-mono text-[var(--color-text-muted)] mt-0.5">
                      {v.checkInTime} · Durasi: {v.durationLabel}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <StatusTag label={v.shiftTag} />
                    <ChevronRight className="h-4 w-4 text-[var(--color-text-muted)]" />
                  </div>
                </button>
              ))}
          </div>

          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => setAllVisitsOpen(true)}
              className="w-full sm:w-auto rounded-xl bg-[#194F70] hover:bg-[#123A54] px-5 py-2.5 text-xs font-bold text-white cursor-pointer"
            >
              Lihat Semua Kunjungan ({visits.length})
            </button>
          </div>
        </div>
      )}

      {/* -------------------- SCREEN 8: ROUTE REPLAY -------------------- */}
      {activeTab === 'route_replay' && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-[#123A54] dark:text-white">
                Replay Rute — {activeReplayRep?.name || 'Budi Santoso'}
              </h2>
              <p className="text-xs text-[var(--color-text-secondary)]">
                24 Jun 2025 · Putar ulang jejak pergerakan ({activeReplayRoute.totalDurationLabel}) ·{' '}
                <strong className="font-mono">{activeReplayRoute.totalDistanceKm}</strong>
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <select
                value={replayRepId}
                onChange={(e) => {
                  setReplayPlaying(false);
                  setReplayStepIdx(0);
                  setReplayRepId(e.target.value);
                }}
                className="rounded-xl border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-3 py-1.5 text-xs font-semibold"
                aria-label="Pilih sales rep untuk replay rute"
              >
                {teamReps
                  .filter((r) => ROUTE_REPLAY_BY_REP[r.id])
                  .map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name} ({r.cityArea})
                    </option>
                  ))}
              </select>
              {([1, 2, 4] as const).map((spd) => (
                <button
                  key={spd}
                  type="button"
                  onClick={() => setReplaySpeed(spd)}
                  className={`rounded-lg px-2.5 py-1.5 text-xs font-mono font-bold cursor-pointer ${
                    replaySpeed === spd
                      ? 'bg-[#194F70] text-white'
                      : 'border border-[var(--color-border)] bg-[var(--color-surface)]'
                  }`}
                >
                  {spd}.0x
                </button>
              ))}
            </div>
          </div>

          <SalesGoogleMap
            currentPos={{ lat: activeWaypoint.lat, lng: activeWaypoint.lng }}
            currentPosLabel={`${activeReplayRep?.name || 'Sales Rep'} · ${activeWaypoint.time} (${activeWaypoint.label})`}
            outlets={INITIAL_OUTLETS.slice(0, 4)}
            selectedOutlet={INITIAL_OUTLETS[Math.min(replayStepIdx, 3)]}
            onSelectOutlet={() => {}}
            heightClass="h-[320px]"
          />

          {/* Playback Scrubber Card matching Screen 8 */}
          <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 space-y-4">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setReplayPlaying((p) => !p)}
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#194F70] text-white hover:bg-[#123A54] cursor-pointer"
                aria-label={replayPlaying ? 'Jeda replay' : 'Putar replay'}
              >
                {replayPlaying ? (
                  <Pause className="h-5 w-5" />
                ) : (
                  <Play className="h-5 w-5 ml-0.5" />
                )}
              </button>
              <div className="flex-1 space-y-1">
                <input
                  type="range"
                  min={0}
                  max={replayWaypoints.length - 1}
                  value={Math.min(replayStepIdx, replayWaypoints.length - 1)}
                  onChange={(e) => setReplayStepIdx(Number(e.target.value))}
                  className="w-full accent-[#348CB2] cursor-pointer"
                />
                <div className="flex justify-between text-[11px] font-mono text-[var(--color-text-muted)]">
                  <span>{replayWaypoints[0]?.time}</span>
                  <span className="font-bold text-[#194F70] dark:text-[#87CEEB]">
                    {activeWaypoint.time} · {activeWaypoint.label}
                  </span>
                  <span>{replayWaypoints[replayWaypoints.length - 1]?.time}</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setReplayPlaying(false);
                  setReplayStepIdx(0);
                }}
                className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-[var(--color-border)] cursor-pointer"
                title="Ulangi dari awal"
              >
                <RotateCcw className="h-4 w-4" />
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {replayWaypoints.map((wp, idx) => (
                <button
                  key={wp.id}
                  type="button"
                  onClick={() => setReplayStepIdx(idx)}
                  className={`rounded-xl border p-3 text-left text-xs cursor-pointer ${
                    replayStepIdx === idx
                      ? 'border-[#348CB2] bg-[#F3FAFC] dark:bg-[#172438]'
                      : 'border-[var(--color-border)] bg-[var(--color-background)]'
                  }`}
                >
                  <p className="font-mono font-bold text-[#348CB2]">{wp.time}</p>
                  <p className="font-bold mt-0.5 truncate">{wp.label}</p>
                  <p className="text-[11px] text-[var(--color-text-muted)] truncate">
                    {wp.speedKmh} km/jam
                  </p>
                </button>
              ))}
            </div>
          </div>

          {activeReplayRep && (
            <button
              type="button"
              onClick={() => {
                setTimelineRepId(activeReplayRep.id);
                setActiveTab('timeline');
              }}
              className="w-full text-left rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 flex items-center justify-between gap-3 hover:border-[#348CB2] cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#194F70] text-white font-bold text-xs">
                  {activeReplayRep.name
                    .split(' ')
                    .map((n) => n[0])
                    .join('')
                    .slice(0, 2)}
                </div>
                <div>
                  <p className="text-sm font-bold">{activeReplayRep.name}</p>
                  <p className="text-xs font-mono text-[var(--color-text-muted)]">
                    24 Jun 2025 · Total Jarak {activeReplayRoute.totalDistanceKm}
                  </p>
                </div>
              </div>
              <ChevronRight className="h-4 w-4 text-[var(--color-text-muted)]" />
            </button>
          )}
        </div>
      )}

      {/* -------------------- SCREEN 9: CAKUPAN OUTLET -------------------- */}
      {activeTab === 'coverage' && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-[#123A54] dark:text-white">
                Cakupan Outlet Wilayah
              </h2>
              <p className="text-xs text-[var(--color-text-secondary)]">
                Sebaran geografis & persentase cakupan tiap area binaan
              </p>
            </div>
            <div className="grid grid-cols-2 gap-1 rounded-xl bg-[var(--color-surface-muted)] p-1 text-xs font-semibold">
              {(['Peta Cakupan', 'Daftar Outlet'] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setCoverageTab(t)}
                  className={`rounded-lg px-3 py-2 cursor-pointer ${
                    coverageTab === t
                      ? 'bg-[#194F70] text-white'
                      : 'text-[var(--color-text-secondary)]'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {coverageTab === 'Peta Cakupan' ? (
            <SalesGoogleMap
              currentPos={{ lat: -6.595204, lng: 106.797781 }}
              outlets={INITIAL_OUTLETS}
              selectedOutlet={selectedCoverageOutlet}
              onSelectOutlet={setSelectedCoverageOutlet}
              heightClass="h-[320px]"
            />
          ) : (
            <div className="space-y-2.5">
              {INITIAL_OUTLETS.map((o) => (
                <div
                  key={o.id}
                  className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 flex items-center justify-between"
                >
                  <div>
                    <p className="text-sm font-bold">{o.name}</p>
                    <p className="text-xs text-[var(--color-text-muted)]">
                      {o.city} · {o.address}
                    </p>
                  </div>
                  <StatusTag label={o.status} />
                </div>
              ))}
            </div>
          )}

          {/* Area Coverage Breakdown matching Screen 9 */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {AREA_COVERAGE_STATS.map((a) => (
              <div
                key={a.id}
                className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <span
                    className="h-3.5 w-3.5 rounded-sm shrink-0"
                    style={{ backgroundColor: a.colorHex }}
                  />
                  <div>
                    <p className="text-sm font-bold">{a.area}</p>
                    <p className="text-xs text-[var(--color-text-muted)]">
                      {a.outletCount} Outlet
                    </p>
                  </div>
                </div>
                <span className="text-sm font-bold font-mono tabular-nums text-[#047857] dark:text-[#34D399]">
                  {a.coveragePct.toString().replace('.', ',')}%
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* -------------------- SCREEN 10: PERFORMA TIM -------------------- */}
      {activeTab === 'performance' && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-[#123A54] dark:text-white">
                Performa Tim Sales
              </h2>
              <p className="text-xs text-[var(--color-text-secondary)]">
                Leaderboard pencapaian nilai order & target individu/tim
              </p>
            </div>
            <div className="grid grid-cols-3 gap-1 rounded-xl bg-[var(--color-surface-muted)] p-1 text-xs font-semibold">
              {(['Individu', 'Tim', 'Ranking'] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setPerfTab(t)}
                  className={`rounded-lg px-3 py-2 cursor-pointer ${
                    perfTab === t
                      ? 'bg-[#194F70] text-white'
                      : 'text-[var(--color-text-secondary)]'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {perfTab === 'Individu' && (
            <div className="space-y-2.5">
              {teamReps.map((rep, idx) => (
                <div
                  key={rep.id}
                  className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={`flex h-8 w-8 items-center justify-center rounded-full font-bold text-xs ${
                        idx === 0
                          ? 'bg-[#FEF3C7] text-[#B45309]'
                          : idx === 1
                            ? 'bg-slate-200 text-slate-700'
                            : idx === 2
                              ? 'bg-orange-100 text-orange-800'
                              : 'bg-[var(--color-surface-muted)] text-[var(--color-text-muted)]'
                      }`}
                    >
                      {idx + 1}
                    </span>
                    <div>
                      <p className="text-sm font-bold">{rep.name}</p>
                      <p className="text-xs font-mono text-[var(--color-text-secondary)]">
                        Rp {rep.monthlySalesJt.toFixed(1).replace('.', ',')} jt · {rep.cityArea}
                      </p>
                    </div>
                  </div>
                  <span className="text-sm font-bold font-mono tabular-nums text-[#047857] dark:text-[#34D399]">
                    {rep.targetPct.toFixed(1).replace('.', ',')}%
                  </span>
                </div>
              ))}
            </div>
          )}

          {perfTab === 'Tim' && (
            <div className="space-y-2.5">
              {SUPERVISOR_TEAM_GROUPS.map((grp) => (
                <div
                  key={grp.id}
                  className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 space-y-2.5"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <p className="text-sm font-bold">{grp.teamName}</p>
                      <p className="text-xs text-[var(--color-text-muted)]">
                        {grp.area} · Lead: {grp.leadName} ({grp.activeToday}/{grp.memberCount} aktif)
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-bold font-mono tabular-nums text-[#123A54] dark:text-white">
                        Rp {grp.realizationJt.toFixed(1).replace('.', ',')} jt /{' '}
                        {grp.targetJt.toFixed(0)} jt
                      </p>
                      <p className="text-xs font-bold font-mono text-[#047857] dark:text-[#34D399]">
                        {grp.targetPct.toFixed(1).replace('.', ',')}%
                      </p>
                    </div>
                  </div>
                  <div className="h-2.5 w-full rounded-full bg-[var(--color-surface-muted)] overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-[#194F70] to-[#348CB2]"
                      style={{ width: `${Math.min(100, grp.targetPct)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}

          {perfTab === 'Ranking' && (
            <div className="overflow-x-auto rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)]">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead className="bg-[var(--color-surface-muted)] text-[var(--color-text-secondary)] text-xs">
                  <tr>
                    <th className="px-4 py-3">Rank</th>
                    <th className="px-4 py-3">Sales Rep</th>
                    <th className="px-4 py-3">Kunjungan</th>
                    <th className="px-4 py-3">Realisasi</th>
                    <th className="px-4 py-3 text-right">% Target</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--color-border)]">
                  {[...teamReps]
                    .sort((a, b) => b.targetPct - a.targetPct)
                    .map((rep, i) => (
                      <tr key={rep.id}>
                        <td className="px-4 py-3 font-bold">#{i + 1}</td>
                        <td className="px-4 py-3 font-bold">{rep.name}</td>
                        <td className="px-4 py-3 font-mono tabular-nums">
                          {rep.visitsToday}/{rep.targetVisits}
                        </td>
                        <td className="px-4 py-3 font-mono tabular-nums">
                          Rp {rep.monthlySalesJt.toFixed(1).replace('.', ',')} jt
                        </td>
                        <td className="px-4 py-3 text-right font-mono font-bold text-[#047857] dark:text-[#34D399] tabular-nums">
                          {rep.targetPct.toFixed(1).replace('.', ',')}%
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="flex flex-wrap justify-end gap-2">
            <button
              type="button"
              onClick={() => setActiveTab('targets')}
              className="rounded-xl border border-[#348CB2] px-4 py-2.5 text-xs font-bold text-[#194F70] dark:text-[#87CEEB] cursor-pointer"
            >
              Target & Realisasi
            </button>
            <button
              type="button"
              onClick={() => setFullRankingOpen(true)}
              className="rounded-xl bg-[#194F70] hover:bg-[#123A54] px-5 py-2.5 text-xs font-bold text-white cursor-pointer"
            >
              Lihat Ranking Lengkap
            </button>
          </div>
        </div>
      )}

      {/* -------------------- SCREEN 11: TARGET & REALISASI -------------------- */}
      {activeTab === 'targets' && (
        <div className="space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-[#123A54] dark:text-white">
                Target & Realisasi
              </h2>
              <p className="text-xs text-[var(--color-text-secondary)]">
                Pemantauan pencapaian target penjualan keseluruhan & per tim wilayah
              </p>
            </div>
            <select
              value={targetPeriod}
              onChange={(e) =>
                setTargetPeriod(e.target.value as 'Bulan Ini' | 'Kuartal Ini')
              }
              className="rounded-xl border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-3.5 py-2 text-xs font-semibold"
            >
              <option value="Bulan Ini">Periode: Bulan Ini</option>
              <option value="Kuartal Ini">Periode: Kuartal Ini</option>
            </select>
          </div>

          {(() => {
            const isQuarter = targetPeriod === 'Kuartal Ini';
            const pctValue = isQuarter ? 81.2 : 76.4;
            const targetAmount = isQuarter
              ? 1_500_000_000
              : SUPERVISOR_PROFILE.monthlyTarget;
            const realizedAmount = isQuarter
              ? 1_218_000_000
              : SUPERVISOR_PROFILE.monthlyRealized;
            const remainingAmount = targetAmount - realizedAmount;
            return (
              <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
                {/* Circular Progress Donut Ring */}
                <div className="md:col-span-5 flex flex-col items-center justify-center">
                  <div className="relative h-44 w-44">
                    <svg viewBox="0 0 120 120" className="h-full w-full -rotate-90">
                      <circle
                        cx="60"
                        cy="60"
                        r="50"
                        fill="none"
                        stroke="currentColor"
                        className="text-[var(--color-surface-muted)]"
                        strokeWidth="12"
                      />
                      <circle
                        cx="60"
                        cy="60"
                        r="50"
                        fill="none"
                        stroke="#348CB2"
                        strokeWidth="12"
                        strokeLinecap="round"
                        strokeDasharray={`${2 * Math.PI * 50}`}
                        strokeDashoffset={`${2 * Math.PI * 50 * (1 - pctValue / 100)}`}
                      />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                      <span className="text-2xl font-bold font-mono tabular-nums text-[#123A54] dark:text-white">
                        {pctValue.toFixed(1).replace('.', ',')}%
                      </span>
                      <span className="text-xs text-[var(--color-text-muted)]">Realisasi</span>
                    </div>
                  </div>
                </div>

                <div className="md:col-span-7 space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-3">
                    <div className="rounded-xl bg-[var(--color-background)] p-3.5">
                      <p className="text-[11px] text-[var(--color-text-muted)]">Target</p>
                      <p className="text-sm font-bold font-mono tabular-nums mt-0.5">
                        {formatRupiah(targetAmount)}
                      </p>
                    </div>
                    <div className="rounded-xl bg-[var(--color-background)] p-3.5">
                      <p className="text-[11px] text-[var(--color-text-muted)]">Realisasi</p>
                      <p className="text-sm font-bold font-mono tabular-nums text-[#047857] mt-0.5">
                        {formatRupiah(realizedAmount)}
                      </p>
                    </div>
                    <div className="rounded-xl bg-[var(--color-background)] p-3.5">
                      <p className="text-[11px] text-[var(--color-text-muted)]">Sisa Target</p>
                      <p className="text-sm font-bold font-mono tabular-nums text-[#B45309] mt-0.5">
                        {formatRupiah(remainingAmount)}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <p className="text-xs font-bold">Progress per Tim</p>
                    {TEAM_TARGET_PROGRESS_BARS.map((bar) => {
                      const adjPct = isQuarter
                        ? Math.min(98, Number((bar.pct + 4.8).toFixed(1)))
                        : bar.pct;
                      return (
                        <div key={bar.team} className="space-y-1">
                          <div className="flex justify-between text-xs font-semibold">
                            <span>{bar.team}</span>
                            <span className="font-mono tabular-nums">
                              {adjPct.toString().replace('.', ',')}%
                            </span>
                          </div>
                          <div className="h-2.5 w-full rounded-full bg-[var(--color-surface-muted)] overflow-hidden">
                            <div
                              className="h-full rounded-full bg-gradient-to-r from-[#194F70] to-[#348CB2]"
                              style={{ width: `${adjPct}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          })()}
        </div>
      )}

      {/* -------------------- SCREEN 12: TIMELINE AKTIVITAS -------------------- */}
      {activeTab === 'timeline' && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-[#123A54] dark:text-white">
                Timeline Aktivitas
              </h2>
              <p className="text-xs text-[var(--color-text-secondary)]">
                24 Jun 2025 · Log kronologis absensi, kunjungan outlet, dan pembuatan order
              </p>
            </div>
            <select
              value={timelineRepId}
              onChange={(e) => setTimelineRepId(e.target.value)}
              className="rounded-xl border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-3.5 py-2 text-xs font-semibold"
            >
              {teamReps.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name} ({r.cityArea})
                </option>
              ))}
            </select>
          </div>

          <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 space-y-4">
            {timelineEvents.map((ev, idx) => (
              <div key={ev.id} className="flex items-start gap-4">
                <span className="w-12 shrink-0 text-xs font-mono font-bold text-[var(--color-text-muted)] pt-1.5">
                  {ev.time}
                </span>
                <div className="flex flex-col items-center">
                  <span
                    className="flex h-7 w-7 items-center justify-center rounded-full text-white text-xs font-bold"
                    style={{ backgroundColor: ev.toneColor }}
                  >
                    {idx + 1}
                  </span>
                  {idx < timelineEvents.length - 1 && (
                    <div className="h-8 w-0.5 bg-[var(--color-border)] my-1" />
                  )}
                </div>
                <div className="pb-2">
                  <p className="text-sm font-bold">{ev.title}</p>
                  <p className="text-xs text-[var(--color-text-secondary)]">
                    {ev.subtitle}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* -------------------- SCREEN 13: PERINGATAN & TINDAK LANJUT -------------------- */}
      {activeTab === 'alerts' && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-[#123A54] dark:text-white">
                Peringatan & Tindak Lanjut
              </h2>
              <p className="text-xs text-[var(--color-text-secondary)]">
                Deteksi anomali GPS, keterlambatan shift, dan deviasi target tim
              </p>
            </div>
            <button
              type="button"
              onClick={() => setCreateFollowUpOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-xl bg-[#194F70] hover:bg-[#123A54] px-4 py-2 text-xs font-bold text-white cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              <span>Buat Tindak Lanjut</span>
            </button>
          </div>

          <div className="grid grid-cols-3 gap-1 rounded-xl bg-[var(--color-surface-muted)] p-1 max-w-md text-xs font-semibold">
            {(['Semua', 'Penting', 'Follow-up'] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setAlertFilter(t)}
                className={`rounded-lg py-2 cursor-pointer ${
                  alertFilter === t
                    ? 'bg-[#194F70] text-white'
                    : 'text-[var(--color-text-secondary)]'
                }`}
              >
                {t} (
                {t === 'Semua'
                  ? alerts.length
                  : alerts.filter((a) => a.severity === t).length}
                )
              </button>
            ))}
          </div>

          <div className="space-y-2.5">
            {filteredAlerts.map((alt) => (
              <div
                key={alt.id}
                className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 flex flex-wrap items-center justify-between gap-3"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-bold">{alt.title}</p>
                    <StatusTag label={alt.resolved ? 'Selesai' : alt.severity} />
                  </div>
                  <p className="text-xs text-[var(--color-text-secondary)]">{alt.subtitle}</p>
                  <p className="text-[11px] text-[#348CB2]">{alt.recommendedAction}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setPluginDefaultTab('workspace');
                      setPluginsModalOpen(true);
                    }}
                    className="rounded-xl border border-[#348CB2] px-3 py-1.5 text-xs font-semibold text-[#194F70] dark:text-[#87CEEB] cursor-pointer"
                  >
                    Jadwalkan Meet
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setAlerts((prev) =>
                        prev.map((a) =>
                          a.id === alt.id ? { ...a, resolved: !a.resolved } : a
                        )
                      )
                    }
                    className="rounded-xl bg-[#194F70] px-3 py-1.5 text-xs font-bold text-white cursor-pointer"
                  >
                    {alt.resolved ? 'Buka Lagi' : 'Tandai Selesai'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* -------------------- SCREEN 14: LAPORAN TIM & AI SALES COACH -------------------- */}
      {activeTab === 'reports' && (
        <div className="space-y-5">
          {/* AI Sales Coach Hero Card matching Screen 14 */}
          <div className="rounded-2xl border border-[#ADD8E6] bg-gradient-to-br from-[#F3FAFC] via-white to-[#E5F4F8] dark:from-[#172438] dark:via-[#111C2D] dark:to-[#19394B] p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[#194F70] text-white">
                  <Bot className="h-7 w-7" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-[#123A54] dark:text-white">
                    AI Sales Coach
                  </h2>
                  <p className="text-xs sm:text-sm text-[var(--color-text-secondary)]">
                    Pendamping cerdas untuk meningkatkan performa dan target tim Anda.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setAiInitialPrompt(undefined);
                  setAiCoachOpen(true);
                }}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#194F70] hover:bg-[#123A54] px-5 py-3 text-xs sm:text-sm font-bold text-white cursor-pointer shrink-0"
              >
                <Sparkles className="h-4 w-4" />
                <span>Mulai Konsultasi AI</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {[
                'Analisis Performa Tim',
                'Rekomendasi Kunjungan',
                'Strategi Pencapaian Target',
                'Insight Outlet & Potensi Order',
              ].map((shortcut) => (
                <button
                  key={shortcut}
                  type="button"
                  onClick={() => {
                    setAiInitialPrompt(shortcut);
                    setAiCoachOpen(true);
                  }}
                  className="flex items-center justify-between rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-3.5 text-left text-xs sm:text-sm font-semibold hover:border-[#348CB2] cursor-pointer"
                >
                  <span>{shortcut}</span>
                  <ChevronRight className="h-4 w-4 text-[#348CB2]" />
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2.5">
            <h3 className="text-sm font-bold text-[#123A54] dark:text-white">
              Unduh Laporan Operasional Tim
            </h3>
            {SUPERVISOR_REPORTS_LIST.map((rep) => (
              <button
                key={rep.id}
                type="button"
                onClick={() => setActiveReportModal(rep)}
                className="w-full text-left rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 flex items-center justify-between gap-3 hover:border-[#348CB2] cursor-pointer"
              >
                <div>
                  <p className="text-sm font-bold">{rep.title}</p>
                  <p className="text-xs text-[var(--color-text-muted)]">{rep.subtitle}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-bold text-[#194F70] dark:text-[#87CEEB]">
                    {rep.metric}
                  </span>
                  <ChevronRight className="h-4 w-4 text-[var(--color-text-muted)]" />
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* -------------------- SCREEN 16: PROFIL & PENGATURAN -------------------- */}
      {activeTab === 'settings' && (
        <div className="space-y-4">
          <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#194F70] text-white font-bold">
                {supervisorProfile.name
                  .split(' ')
                  .map((n) => n[0])
                  .join('')
                  .slice(0, 2)}
              </div>
              <div>
                <h2 className="text-lg font-bold">{supervisorProfile.name}</h2>
                <p className="text-xs text-[var(--color-text-secondary)]">
                  {supervisorProfile.roleTitle}
                </p>
                <div className="mt-1">
                  <StatusTag label="Supervisor" tone="brand" />
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setPluginsModalOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-xl border border-[#348CB2] bg-[#F3FAFC] dark:bg-[#19394B] px-3.5 py-2 text-xs font-bold text-[#194F70] dark:text-[#87CEEB] cursor-pointer"
            >
              <Puzzle className="h-4 w-4 text-[#348CB2]" />
              <span>Plugin Workspace & Maps</span>
            </button>
          </div>

          <div className="divide-y divide-[var(--color-border)] rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)]">
            {[
              {
                title: 'Profil Saya',
                subtitle: `${supervisorProfile.email} · ${supervisorProfile.phone}`,
                icon: UserCheck,
                action: () => setProfileModalOpen(true),
              },
              {
                title: 'Pengaturan Notifikasi',
                subtitle: 'Alert GPS nonaktif, keterlambatan absensi, & Telegram Bot',
                icon: Bell,
                action: () => {
                  setPluginDefaultTab('telegram');
                  setPluginsModalOpen(true);
                },
              },
              {
                title: 'Pengaturan Lokasi & GPS',
                subtitle: 'Izin lokasi, interval refresh, dan radius geofence 100 m',
                icon: MapPin,
                action: () => setSettingsModalSection('Pengaturan Lokasi & GPS'),
              },
              {
                title: 'Pengaturan Akun',
                subtitle: 'Keamanan, ganti password, dan autentikasi OTP',
                icon: ShieldCheck,
                action: () => setSecurityModalOpen(true),
              },
              {
                title: 'Tentang SalesX-Ai',
                subtitle: 'SalesX-Ai Platform v1.0 · Kepatuhan Privasi GPS',
                icon: Info,
                action: () => setAboutModalOpen(true),
              },
            ].map((row) => {
              const Icon = row.icon;
              return (
                <button
                  key={row.title}
                  type="button"
                  onClick={row.action}
                  className="w-full flex items-center justify-between gap-3 p-4 text-left hover:bg-[var(--color-surface-muted)] cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#E5F4F8] dark:bg-[#19394B] text-[#348CB2]">
                      <Icon className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-sm font-bold">{row.title}</p>
                      <p className="text-xs text-[var(--color-text-muted)]">
                        {row.subtitle}
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-[var(--color-text-muted)]" />
                </button>
              );
            })}
          </div>

          <button
            type="button"
            onClick={() => void auth.signOut('local')}
            className="w-full inline-flex items-center justify-center gap-2 rounded-2xl border border-red-200 dark:border-red-900/60 bg-[var(--color-surface)] py-3 text-sm font-bold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 cursor-pointer"
          >
            <LogOut className="h-4 w-4" />
            <span>Keluar</span>
          </button>
        </div>
      )}

      {/* Modals */}
      <AddTeamRosterModal
        open={addTeamOpen}
        onClose={() => setAddTeamOpen(false)}
        onAddRep={(r) => {
          setTeamReps((prev) => [r, ...prev]);
          showToast(`${r.name} ditambahkan ke Team Roster.`);
        }}
      />
      <SupervisorRepDetailModal
        rep={editingRep}
        onClose={() => setEditingRep(null)}
        onSaveRep={(id, patch) => {
          setTeamReps((prev) =>
            prev.map((r) => (r.id === id ? { ...r, ...patch } : r))
          );
          showToast('Data & penugasan anggota tim diperbarui.');
        }}
        onOpenTimeline={(id) => {
          setTimelineRepId(id);
          setActiveTab('timeline');
        }}
      />
      <ShiftDetailModal
        rep={shiftDetailRep}
        onClose={() => setShiftDetailRep(null)}
      />
      <VisitEvidenceSupervisorModal
        visit={visitEvidence}
        onClose={() => setVisitEvidence(null)}
        onUpdateVisitStatus={(visitId, status, shiftTag) => {
          setVisits((prev) =>
            prev.map((v) =>
              v.id === visitId ? { ...v, status, shiftTag } : v
            )
          );
          showToast(`Status kunjungan diperbarui menjadi "${status}".`);
        }}
      />
      <AllVisitsModal
        open={allVisitsOpen}
        onClose={() => setAllVisitsOpen(false)}
        visits={visits}
        onSelectVisit={(v) => setVisitEvidence(v)}
      />
      <FullRankingModal
        open={fullRankingOpen}
        onClose={() => setFullRankingOpen(false)}
        teamReps={teamReps}
      />
      <CreateFollowUpModal
        open={createFollowUpOpen}
        onClose={() => setCreateFollowUpOpen(false)}
        teamReps={teamReps}
        onCreateFollowUp={(alt) => {
          setAlerts((prev) => [alt, ...prev]);
          showToast(`Tindak lanjut "${alt.title}" dibuat.`);
        }}
        onOpenWorkspaceForFollowUp={() => {
          setPluginDefaultTab('workspace');
          setPluginsModalOpen(true);
        }}
      />
      <SupervisorReportModal
        report={activeReportModal}
        onClose={() => setActiveReportModal(null)}
      />
      <SupervisorSettingsModal
        open={!!settingsModalSection}
        onClose={() => setSettingsModalSection(null)}
        sectionTitle={settingsModalSection || 'Pengaturan'}
      />
      <SupervisorProfileModal
        open={profileModalOpen}
        onClose={() => setProfileModalOpen(false)}
        profile={supervisorProfile}
        onSaveProfile={(next) => {
          setSupervisorProfile(next);
          showToast('Profil Supervisor Area berhasil disimpan.');
        }}
      />
      <SupervisorSecurityModal
        open={securityModalOpen}
        onClose={() => setSecurityModalOpen(false)}
      />
      <AboutSalesXModal
        open={aboutModalOpen}
        onClose={() => setAboutModalOpen(false)}
      />
      <SupervisorNotificationsModal
        open={notificationsOpen}
        onClose={() => setNotificationsOpen(false)}
        notifications={notifications}
        onMarkAllRead={() =>
          setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
        }
      />
      <PluginActivationModal
        open={pluginsModalOpen}
        onClose={() => setPluginsModalOpen(false)}
        portalName={`Supervisor Portal (${supervisorProfile.roleTitle})`}
        outlets={INITIAL_OUTLETS}
        defaultTab={pluginDefaultTab}
        prefillEmailTo={supervisorProfile.email}
      />
      <PortalAiCoachModal
        open={aiCoachOpen}
        onClose={() => setAiCoachOpen(false)}
        title="AI Sales Coach Supervisor"
        subtitle="Coaching tim sales, optimasi kunjungan, dan strategi target wilayah"
        contextSummary={`Supervisor: ${supervisorProfile.name} (${supervisorProfile.roleTitle}). Tim aktif: 12/15. Kunjungan hari ini: 98 (+14,6%). Realisasi target: Rp 382 jt dari Rp 500 jt (76,4%). Top rep: Budi Santoso (104,6%). Perhatian khusus: Fajar Hidayat (GPS tidak aktif 32 menit, Tim Bekasi 66,8%), Siti Rahma terlambat 08:32.`}
        quickPrompts={[
          'Analisis Performa Tim & prioritas coaching minggu ini',
          'Rekomendasi Kunjungan untuk menutup sisa target Rp 118 jt',
          'Strategi Pencapaian Target Tim Bekasi (saat ini 66,8%)',
          'Insight Outlet & Potensi Order di Area Bogor & Depok',
        ]}
        initialPrompt={aiInitialPrompt}
      />
    </PortalShell>
  );
}
