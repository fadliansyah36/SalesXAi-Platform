'use client';

import React, { useState } from 'react';
import {
  CheckCircle2,
  KeyRound,
  UserPlus,
  Clock,
  MapPin,
  Download,
  Bell,
  ShieldCheck,
  Send,
  Edit3,
  Trophy,
  Lock,
  Info,
  CalendarClock,
} from 'lucide-react';
import { Modal } from '@/components/common/Modal';
import { StatusTag } from '@/components/design-system/StatusTag';
import type { NotificationItem } from '@/lib/salesx-data';
import type {
  SupervisorTeamRep,
  SupervisorVisitItem,
  SupervisorAlertItem,
} from '@/lib/salesx-portals-data';

/* 1. OTP Login Modal */
export function OtpLoginModal({
  open,
  onClose,
  onSuccess,
}: {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [phone, setPhone] = useState('0812-9000-4455');
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState('482910');

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Masuk dengan Kode OTP"
      subtitle="Verifikasi akses cepat Supervisor Area via SMS / WhatsApp"
    >
      <div className="space-y-4 text-xs sm:text-sm">
        <div>
          <label className="block font-semibold mb-1">Nomor HP Terdaftar</label>
          <div className="flex gap-2">
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="flex-1 rounded-xl border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-3.5 py-2.5 font-mono"
            />
            <button
              type="button"
              onClick={() => setOtpSent(true)}
              className="rounded-xl border border-[#348CB2] px-3.5 py-2 text-xs font-bold text-[#194F70] dark:text-[#87CEEB] cursor-pointer"
            >
              {otpSent ? 'Kirim Ulang' : 'Kirim OTP'}
            </button>
          </div>
        </div>

        {otpSent && (
          <div>
            <label className="block font-semibold mb-1">Masukkan Kode 6-Digit</label>
            <input
              type="text"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              className="w-full rounded-xl border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-3.5 py-2.5 font-mono text-center tracking-widest text-base font-bold"
            />
            <p className="text-[11px] text-[#047857] mt-1">
              Kode OTP simulasi telah dikirim ke {phone}.
            </p>
          </div>
        )}

        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-[var(--color-border)] px-4 py-2 text-xs font-semibold cursor-pointer"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={() => {
              onSuccess();
              onClose();
            }}
            className="inline-flex items-center gap-1.5 rounded-xl bg-[#194F70] px-4 py-2 text-xs font-bold text-white cursor-pointer"
          >
            <KeyRound className="h-3.5 w-3.5" />
            <span>Verifikasi & Masuk</span>
          </button>
        </div>
      </div>
    </Modal>
  );
}

/* 2. Add Team Roster Modal */
export function AddTeamRosterModal({
  open,
  onClose,
  onAddRep,
}: {
  open: boolean;
  onClose: () => void;
  onAddRep: (rep: SupervisorTeamRep) => void;
}) {
  const [name, setName] = useState('');
  const [cityArea, setCityArea] =
    useState<SupervisorTeamRep['cityArea']>('Area Bogor');
  const [phone, setPhone] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onAddRep({
      id: `sup-rep-${Date.now()}`,
      name: name.trim(),
      areaLabel: `Sales - ${cityArea.replace('Area ', '')}`,
      cityArea,
      status: 'Aktif',
      shiftStatus: 'Dalam Shift',
      clockInTime: 'Masuk 08:00',
      online: true,
      lastSeenLabel: 'Baru saja',
      locationLabel: `Jl. Utama ${cityArea}`,
      speedKmh: 0,
      batteryPct: 95,
      accuracyM: 5,
      lat: -6.596,
      lng: 106.801,
      monthlySalesJt: 0,
      targetPct: 0,
      visitsToday: 0,
      targetVisits: 7,
      phone: phone.trim() || '0812-3344-5566',
    });
    setName('');
    setPhone('');
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Tambah Anggota Tim Sales"
      subtitle="Tambahkan sales representative ke tim monitoring Supervisor"
    >
      <form onSubmit={handleSubmit} className="space-y-3 text-xs sm:text-sm">
        <div>
          <label className="block font-semibold mb-1">Nama Sales Rep</label>
          <input
            required
            type="text"
            placeholder="Contoh: Rizky Pratama"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-xl border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-3.5 py-2.5"
          />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block font-semibold mb-1">Area Penugasan</label>
            <select
              value={cityArea}
              onChange={(e) =>
                setCityArea(e.target.value as SupervisorTeamRep['cityArea'])
              }
              className="w-full rounded-xl border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-3.5 py-2.5"
            >
              <option value="Area Bogor">Area Bogor</option>
              <option value="Area Depok">Area Depok</option>
              <option value="Area Bekasi">Area Bekasi</option>
              <option value="Area Tangerang">Area Tangerang</option>
            </select>
          </div>
          <div>
            <label className="block font-semibold mb-1">No. Telepon</label>
            <input
              type="tel"
              placeholder="0812-xxxx-xxxx"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full rounded-xl border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-3.5 py-2.5"
            />
          </div>
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-[var(--color-border)] px-4 py-2 text-xs font-semibold cursor-pointer"
          >
            Batal
          </button>
          <button
            type="submit"
            className="inline-flex items-center gap-1.5 rounded-xl bg-[#194F70] px-4 py-2 text-xs font-bold text-white cursor-pointer"
          >
            <UserPlus className="h-3.5 w-3.5" />
            <span>Simpan Anggota</span>
          </button>
        </div>
      </form>
    </Modal>
  );
}

/* 3. Shift Detail Modal */
export function ShiftDetailModal({
  rep,
  onClose,
}: {
  rep: SupervisorTeamRep | null;
  onClose: () => void;
}) {
  if (!rep) return null;

  return (
    <Modal
      open={!!rep}
      onClose={onClose}
      title={`Detail Shift — ${rep.name}`}
      subtitle={`${rep.areaLabel} · ${rep.cityArea}`}
    >
      <div className="space-y-4 text-xs sm:text-sm">
        <div className="flex items-center justify-between rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] p-4">
          <div>
            <p className="font-bold flex items-center gap-1.5">
              <Clock className="h-4 w-4 text-[#348CB2]" />
              <span>{rep.clockInTime}</span>
            </p>
            <p className="text-[11px] text-[var(--color-text-muted)] mt-0.5">
              Jadwal Shift Standar: 08:00 – 17:00 WIB (Radius Geofence 100 m)
            </p>
          </div>
          <StatusTag label={rep.shiftStatus} showIcon />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-xl border border-[var(--color-border)] p-3.5">
            <p className="text-[11px] text-[var(--color-text-muted)]">Lokasi Terakhir</p>
            <p className="font-bold mt-0.5 flex items-center gap-1">
              <MapPin className="h-3.5 w-3.5 text-[#348CB2]" />
              <span>{rep.locationLabel}</span>
            </p>
          </div>
          <div className="rounded-xl border border-[var(--color-border)] p-3.5">
            <p className="text-[11px] text-[var(--color-text-muted)]">Baterai & Akurasi GPS</p>
            <p className="font-bold font-mono mt-0.5">
              {rep.batteryPct}% · Akurasi ±{rep.accuracyM} m
            </p>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl bg-[#194F70] px-4 py-2 text-xs font-bold text-white cursor-pointer"
          >
            Tutup
          </button>
        </div>
      </div>
    </Modal>
  );
}

/* 4. Visit Evidence Supervisor Modal */
export function VisitEvidenceSupervisorModal({
  visit,
  onClose,
  onUpdateVisitStatus,
}: {
  visit: SupervisorVisitItem | null;
  onClose: () => void;
  onUpdateVisitStatus?: (
    visitId: string,
    status: 'Berlangsung' | 'Selesai' | 'Rencana',
    shiftTag: 'Dalam Shift' | 'Selesai' | 'Terjadwal'
  ) => void;
}) {
  if (!visit) return null;

  return (
    <Modal
      open={!!visit}
      onClose={onClose}
      title={`Kunjungan — ${visit.outletName}`}
      subtitle={`${visit.repName} · ${visit.checkInTime} · Durasi ${visit.durationLabel}`}
    >
      <div className="space-y-4 text-xs sm:text-sm">
        <div className="flex items-center justify-between rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] p-4">
          <div>
            <p className="font-bold">Status Kunjungan</p>
            <p className="text-[11px] text-[var(--color-text-muted)] font-mono">
              Koordinat GPS: {visit.lat.toFixed(5)}, {visit.lng.toFixed(5)}
            </p>
          </div>
          <StatusTag label={visit.shiftTag} showIcon />
        </div>
        <div className="rounded-xl border border-[var(--color-border)] p-4">
          <p className="font-semibold text-[var(--color-text-secondary)]">
            Catatan Lapangan Sales
          </p>
          <p className="mt-1 font-medium">{visit.notes}</p>
        </div>
        <div className="flex flex-wrap justify-end gap-2">
          {onUpdateVisitStatus && visit.status === 'Rencana' && (
            <button
              type="button"
              onClick={() => {
                onUpdateVisitStatus(visit.id, 'Berlangsung', 'Dalam Shift');
                onClose();
              }}
              className="rounded-xl bg-[#348CB2] px-4 py-2 text-xs font-bold text-white cursor-pointer"
            >
              Mulai Kunjungan (Berlangsung)
            </button>
          )}
          {onUpdateVisitStatus && visit.status === 'Berlangsung' && (
            <button
              type="button"
              onClick={() => {
                onUpdateVisitStatus(visit.id, 'Selesai', 'Selesai');
                onClose();
              }}
              className="inline-flex items-center gap-1.5 rounded-xl bg-[#10B981] px-4 py-2 text-xs font-bold text-white cursor-pointer"
            >
              <CheckCircle2 className="h-3.5 w-3.5" />
              <span>Tandai Kunjungan Selesai</span>
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl bg-[#194F70] px-4 py-2 text-xs font-bold text-white cursor-pointer"
          >
            Tutup
          </button>
        </div>
      </div>
    </Modal>
  );
}

/* 5. Create Follow-up Alert Modal */
export function CreateFollowUpModal({
  open,
  onClose,
  teamReps,
  onCreateFollowUp,
  onOpenWorkspaceForFollowUp,
}: {
  open: boolean;
  onClose: () => void;
  teamReps: SupervisorTeamRep[];
  onCreateFollowUp: (alert: SupervisorAlertItem) => void;
  onOpenWorkspaceForFollowUp: () => void;
}) {
  const [repName, setRepName] = useState(teamReps[0]?.name || 'Budi Santoso');
  const [title, setTitle] = useState('Evaluasi Target & Kunjungan Outlet');
  const [severity, setSeverity] = useState<'Penting' | 'Follow-up'>('Follow-up');
  const [action, setAction] = useState('Jadwalkan coaching 1-on-1 via Google Meet sore ini.');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const rep = teamReps.find((r) => r.name === repName);
    onCreateFollowUp({
      id: `alt-${Date.now()}`,
      title: title.trim(),
      subtitle: `${repName} – Baru dibuat`,
      severity,
      repName,
      area: rep?.cityArea || 'Area Bogor',
      resolved: false,
      recommendedAction: action,
    });
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Buat Tindak Lanjut Tim"
      subtitle="Tetapkan instruksi perbaikan atau jadwalkan coaching via Google Workspace"
    >
      <form onSubmit={handleSubmit} className="space-y-3 text-xs sm:text-sm">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block font-semibold mb-1">Anggota Tim / Sales</label>
            <select
              value={repName}
              onChange={(e) => setRepName(e.target.value)}
              className="w-full rounded-xl border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-3.5 py-2.5"
            >
              {teamReps.map((r) => (
                <option key={r.id} value={r.name}>
                  {r.name} ({r.cityArea})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block font-semibold mb-1">Prioritas</label>
            <select
              value={severity}
              onChange={(e) => setSeverity(e.target.value as 'Penting' | 'Follow-up')}
              className="w-full rounded-xl border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-3.5 py-2.5"
            >
              <option value="Follow-up">Follow-up</option>
              <option value="Penting">Penting (Segera)</option>
            </select>
          </div>
        </div>
        <div>
          <label className="block font-semibold mb-1">Judul Tindak Lanjut</label>
          <input
            required
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full rounded-xl border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-3.5 py-2.5"
          />
        </div>
        <div>
          <label className="block font-semibold mb-1">Rencana Aksi Supervisor</label>
          <textarea
            rows={2}
            value={action}
            onChange={(e) => setAction(e.target.value)}
            className="w-full rounded-xl border border-[var(--color-border-strong)] bg-[var(--color-surface)] p-3"
          />
        </div>
        <div className="flex flex-wrap justify-between gap-2 pt-2">
          <button
            type="button"
            onClick={() => {
              onClose();
              onOpenWorkspaceForFollowUp();
            }}
            className="rounded-xl border border-[#348CB2] px-3.5 py-2 text-xs font-bold text-[#194F70] dark:text-[#87CEEB] cursor-pointer"
          >
            Jadwalkan via Calendar / Meet
          </button>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-[var(--color-border)] px-4 py-2 text-xs font-semibold cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 rounded-xl bg-[#194F70] px-4 py-2 text-xs font-bold text-white cursor-pointer"
            >
              <Send className="h-3.5 w-3.5" />
              <span>Simpan Tindak Lanjut</span>
            </button>
          </div>
        </div>
      </form>
    </Modal>
  );
}

/* 6. Supervisor Report CSV Modal */
export function SupervisorReportModal({
  report,
  onClose,
}: {
  report: { title: string; subtitle: string; metric: string } | null;
  onClose: () => void;
}) {
  if (!report) return null;

  const handleDownload = () => {
    const csv = [
      'Sales_Rep,Area,Penjualan_Juta,Pencapaian_Target,Kunjungan_Hari_Ini',
      '"Budi Santoso","Area Bogor",125.8,"104,6%",6',
      '"Rina Amelia","Area Depok",98.4,"98,2%",5',
      '"Dedi Kurniawan","Area Bogor",87.5,"92,1%",5',
      '"Siti Rahma","Area Tangerang",76.2,"88,4%",4',
      '"Fajar Hidayat","Area Bekasi",62.0,"81,3%",2',
    ].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${report.title.toLowerCase().replace(/\s+/g, '-')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Modal
      open={!!report}
      onClose={onClose}
      title={report.title}
      subtitle={report.subtitle}
    >
      <div className="space-y-4 text-xs sm:text-sm">
        <div className="rounded-xl border border-[#ADD8E6] bg-[#F3FAFC] dark:bg-[#172438] p-4">
          <p className="text-[11px] text-[var(--color-text-muted)]">Ringkasan Metrik</p>
          <p className="text-lg font-bold font-mono text-[#123A54] dark:text-white mt-0.5">
            {report.metric}
          </p>
        </div>
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-[var(--color-border)] px-4 py-2 text-xs font-semibold cursor-pointer"
          >
            Tutup
          </button>
          <button
            type="button"
            onClick={handleDownload}
            className="inline-flex items-center gap-1.5 rounded-xl bg-[#194F70] px-4 py-2 text-xs font-bold text-white cursor-pointer"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Unduh Laporan CSV</span>
          </button>
        </div>
      </div>
    </Modal>
  );
}

/* 7. Supervisor GPS & Account Policy Modal */
export function SupervisorSettingsModal({
  open,
  onClose,
  sectionTitle,
}: {
  open: boolean;
  onClose: () => void;
  sectionTitle: string;
}) {
  const [geofenceM, setGeofenceM] = useState('100');
  const [refreshSec, setRefreshSec] = useState('30');
  const [saved, setSaved] = useState(false);

  return (
    <Modal
      open={open}
      onClose={() => {
        setSaved(false);
        onClose();
      }}
      title={sectionTitle}
      subtitle="Kepatuhan privasi GPS hanya saat jam shift kerja (08:00–17:00 WIB)"
    >
      <div className="space-y-4 text-xs sm:text-sm">
        <div className="rounded-xl border border-[#ADD8E6] bg-[#F3FAFC] dark:bg-[#172438] p-3.5 flex items-start gap-2.5 text-[#194F70] dark:text-[#87CEEB]">
          <ShieldCheck className="h-4 w-4 shrink-0 mt-0.5" />
          <span>
            Pelacakan lokasi otomatis berhenti di luar shift kerja dan setiap
            akses lokasi oleh Supervisor tercatat di log audit.
          </span>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block font-semibold mb-1">Radius Geofence (m)</label>
            <input
              type="number"
              value={geofenceM}
              onChange={(e) => setGeofenceM(e.target.value)}
              className="w-full rounded-xl border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-3.5 py-2 font-mono"
            />
          </div>
          <div>
            <label className="block font-semibold mb-1">Interval Refresh (detik)</label>
            <input
              type="number"
              value={refreshSec}
              onChange={(e) => setRefreshSec(e.target.value)}
              className="w-full rounded-xl border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-3.5 py-2 font-mono"
            />
          </div>
        </div>

        {saved && (
          <p className="text-xs font-semibold text-[#047857] flex items-center gap-1.5">
            <CheckCircle2 className="h-4 w-4" />
            <span>Konfigurasi berhasil diperbarui.</span>
          </p>
        )}

        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-[var(--color-border)] px-4 py-2 text-xs font-semibold cursor-pointer"
          >
            Tutup
          </button>
          <button
            type="button"
            onClick={() => setSaved(true)}
            className="rounded-xl bg-[#194F70] px-4 py-2 text-xs font-bold text-white cursor-pointer"
          >
            Simpan Pengaturan
          </button>
        </div>
      </div>
    </Modal>
  );
}

/* 8. Notifications Modal */
export function SupervisorNotificationsModal({
  open,
  onClose,
  notifications,
  onMarkAllRead,
}: {
  open: boolean;
  onClose: () => void;
  notifications: NotificationItem[];
  onMarkAllRead: () => void;
}) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Notifikasi Supervisor"
      subtitle="Alert keterlambatan shift, GPS nonaktif, dan capaian target tim"
    >
      <div className="space-y-3 text-xs sm:text-sm">
        <div className="flex justify-end">
          <button
            type="button"
            onClick={onMarkAllRead}
            className="text-xs font-semibold text-[#348CB2] hover:underline cursor-pointer"
          >
            Tandai Semua Dibaca
          </button>
        </div>
        <div className="space-y-2 max-h-[320px] overflow-y-auto">
          {notifications.map((n) => (
            <div
              key={n.id}
              className={`rounded-xl border p-3.5 ${
                n.read
                  ? 'border-[var(--color-border)] bg-[var(--color-background)]'
                  : 'border-[#348CB2] bg-[#F3FAFC] dark:bg-[#172438]'
              }`}
            >
              <div className="flex items-center justify-between">
                <p className="font-bold flex items-center gap-1.5">
                  <Bell className="h-3.5 w-3.5 text-[#348CB2]" />
                  <span>{n.title}</span>
                </p>
                <span className="text-[11px] text-[var(--color-text-muted)]">
                  {n.timeAgo}
                </span>
              </div>
              <p className="mt-1 text-xs text-[var(--color-text-secondary)]">
                {n.detail}
              </p>
            </div>
          ))}
        </div>
      </div>
    </Modal>
  );
}

function SupervisorRepDetailForm({
  rep,
  onClose,
  onSaveRep,
  onOpenTimeline,
}: {
  rep: SupervisorTeamRep;
  onClose: () => void;
  onSaveRep: (id: string, patch: Partial<SupervisorTeamRep>) => void;
  onOpenTimeline: (id: string) => void;
}) {
  const [cityArea, setCityArea] = useState<SupervisorTeamRep['cityArea']>(rep.cityArea);
  const [targetVisits, setTargetVisits] = useState(String(rep.targetVisits));
  const [phone, setPhone] = useState(rep.phone);
  const [status, setStatus] = useState<'Aktif' | 'Nonaktif'>(rep.status);

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSaveRep(rep.id, {
          cityArea,
          areaLabel: `Sales - ${cityArea.replace('Area ', '')}`,
          targetVisits: Math.max(1, Number(targetVisits) || rep.targetVisits),
          phone: phone.trim() || rep.phone,
          status,
        });
        onClose();
      }}
      className="space-y-3 text-xs sm:text-sm"
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block font-semibold mb-1">Wilayah Penugasan</label>
          <select
            value={cityArea}
            onChange={(e) =>
              setCityArea(e.target.value as SupervisorTeamRep['cityArea'])
            }
            className="w-full rounded-xl border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-3.5 py-2.5"
          >
            <option value="Area Bogor">Area Bogor</option>
            <option value="Area Depok">Area Depok</option>
            <option value="Area Bekasi">Area Bekasi</option>
            <option value="Area Tangerang">Area Tangerang</option>
          </select>
        </div>
        <div>
          <label className="block font-semibold mb-1">Target Kunjungan / Hari</label>
          <input
            type="number"
            min={1}
            value={targetVisits}
            onChange={(e) => setTargetVisits(e.target.value)}
            className="w-full rounded-xl border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-3.5 py-2.5 font-mono"
          />
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block font-semibold mb-1">Nomor HP Sales</label>
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="w-full rounded-xl border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-3.5 py-2.5 font-mono"
          />
        </div>
        <div>
          <label className="block font-semibold mb-1">Status Keaktifan</label>
          <div className="flex gap-2">
            {(['Aktif', 'Nonaktif'] as const).map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setStatus(s)}
                className={`flex-1 rounded-xl py-2.5 text-xs font-bold cursor-pointer ${
                  status === s
                    ? 'bg-[#194F70] text-white'
                    : 'border border-[var(--color-border)] bg-[var(--color-background)]'
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      </div>
      <div className="flex flex-wrap justify-between gap-2 pt-2 border-t border-[var(--color-border)]">
        <button
          type="button"
          onClick={() => {
            onClose();
            onOpenTimeline(rep.id);
          }}
          className="inline-flex items-center gap-1.5 rounded-xl border border-[#348CB2] px-3.5 py-2 text-xs font-bold text-[#194F70] dark:text-[#87CEEB] cursor-pointer"
        >
          <CalendarClock className="h-3.5 w-3.5" />
          <span>Buka Timeline Aktivitas</span>
        </button>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-[var(--color-border)] px-4 py-2 text-xs font-semibold cursor-pointer"
          >
            Batal
          </button>
          <button
            type="submit"
            className="inline-flex items-center gap-1.5 rounded-xl bg-[#194F70] px-4 py-2 text-xs font-bold text-white cursor-pointer"
          >
            <Edit3 className="h-3.5 w-3.5" />
            <span>Simpan Perubahan</span>
          </button>
        </div>
      </div>
    </form>
  );
}

/* 9. Supervisor Rep Detail & Edit Modal (Screen 3) */
export function SupervisorRepDetailModal({
  rep,
  onClose,
  onSaveRep,
  onOpenTimeline,
}: {
  rep: SupervisorTeamRep | null;
  onClose: () => void;
  onSaveRep: (id: string, patch: Partial<SupervisorTeamRep>) => void;
  onOpenTimeline: (id: string) => void;
}) {
  if (!rep) return null;

  return (
    <Modal
      open={!!rep}
      onClose={onClose}
      title={`Kelola Anggota — ${rep.name}`}
      subtitle={`${rep.areaLabel} · Realisasi Rp ${rep.monthlySalesJt.toFixed(1).replace('.', ',')} jt`}
    >
      <SupervisorRepDetailForm
        key={rep.id}
        rep={rep}
        onClose={onClose}
        onSaveRep={onSaveRep}
        onOpenTimeline={onOpenTimeline}
      />
    </Modal>
  );
}

/* 10. All Visits Modal (Screen 7: Lihat Semua Kunjungan) */
export function AllVisitsModal({
  open,
  onClose,
  visits,
  onSelectVisit,
}: {
  open: boolean;
  onClose: () => void;
  visits: SupervisorVisitItem[];
  onSelectVisit: (v: SupervisorVisitItem) => void;
}) {
  const [filter, setFilter] = useState<'Semua' | 'Berlangsung' | 'Selesai' | 'Rencana'>('Semua');
  const filtered =
    filter === 'Semua' ? visits : visits.filter((v) => v.status === filter);

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Semua Kunjungan Hari Ini"
      subtitle={`Total ${visits.length} kunjungan tercatat di seluruh area binaan`}
      maxWidthClass="max-w-2xl"
    >
      <div className="space-y-3 text-xs sm:text-sm">
        <div className="flex flex-wrap gap-1.5">
          {(['Semua', 'Berlangsung', 'Selesai', 'Rencana'] as const).map((st) => (
            <button
              key={st}
              type="button"
              onClick={() => setFilter(st)}
              className={`rounded-xl px-3 py-1.5 text-xs font-semibold cursor-pointer ${
                filter === st
                  ? 'bg-[#194F70] text-white'
                  : 'border border-[var(--color-border)] bg-[var(--color-background)]'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
        <div className="space-y-2 max-h-[340px] overflow-y-auto pr-1">
          {filtered.map((v) => (
            <button
              key={v.id}
              type="button"
              onClick={() => {
                onClose();
                onSelectVisit(v);
              }}
              className="w-full text-left rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] p-3 flex items-center justify-between gap-2 hover:border-[#348CB2] cursor-pointer"
            >
              <div>
                <p className="font-bold">
                  {v.repName} · {v.outletName}
                </p>
                <p className="text-[11px] font-mono text-[var(--color-text-muted)]">
                  {v.checkInTime} · Durasi {v.durationLabel}
                </p>
              </div>
              <StatusTag label={v.shiftTag} />
            </button>
          ))}
        </div>
        <div className="flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl bg-[#194F70] px-4 py-2 text-xs font-bold text-white cursor-pointer"
          >
            Tutup
          </button>
        </div>
      </div>
    </Modal>
  );
}

/* 11. Full Ranking Modal (Screen 10: Lihat Ranking Lengkap) */
export function FullRankingModal({
  open,
  onClose,
  teamReps,
}: {
  open: boolean;
  onClose: () => void;
  teamReps: SupervisorTeamRep[];
}) {
  const ranked = [...teamReps].sort((a, b) => b.targetPct - a.targetPct);

  const handleDownloadCsv = () => {
    const csv = [
      'Rank,Nama,Area,Kunjungan,Target_Kunjungan,Omzet_Juta,Pencapaian_Pct',
      ...ranked.map(
        (r, i) =>
          `${i + 1},"${r.name}","${r.cityArea}",${r.visitsToday},${r.targetVisits},${r.monthlySalesJt.toFixed(1)},${r.targetPct.toFixed(1)}%`
      ),
    ].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'ranking-performa-tim-sales.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Ranking Lengkap Performa Tim"
      subtitle="Urutan berdasarkan pencapaian target bulanan dan produktivitas kunjungan"
      maxWidthClass="max-w-2xl"
    >
      <div className="space-y-4 text-xs sm:text-sm">
        <div className="overflow-x-auto rounded-xl border border-[var(--color-border)]">
          <table className="w-full text-left text-xs">
            <thead className="bg-[var(--color-surface-muted)] text-[var(--color-text-secondary)]">
              <tr>
                <th className="px-3 py-2.5">Rank</th>
                <th className="px-3 py-2.5">Sales Rep</th>
                <th className="px-3 py-2.5">Area</th>
                <th className="px-3 py-2.5">Kunjungan</th>
                <th className="px-3 py-2.5">Omzet</th>
                <th className="px-3 py-2.5 text-right">% Target</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-border)]">
              {ranked.map((r, idx) => (
                <tr key={r.id}>
                  <td className="px-3 py-2.5 font-bold">
                    <span className="inline-flex items-center gap-1">
                      {idx === 0 && <Trophy className="h-3.5 w-3.5 text-[#D97706]" />}
                      #{idx + 1}
                    </span>
                  </td>
                  <td className="px-3 py-2.5 font-bold">{r.name}</td>
                  <td className="px-3 py-2.5 text-[var(--color-text-muted)]">{r.cityArea}</td>
                  <td className="px-3 py-2.5 font-mono tabular-nums">
                    {r.visitsToday}/{r.targetVisits}
                  </td>
                  <td className="px-3 py-2.5 font-mono tabular-nums">
                    Rp {r.monthlySalesJt.toFixed(1).replace('.', ',')} jt
                  </td>
                  <td className="px-3 py-2.5 text-right font-mono font-bold text-[#047857] dark:text-[#34D399] tabular-nums">
                    {r.targetPct.toFixed(1).replace('.', ',')}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="flex flex-wrap justify-between gap-2">
          <button
            type="button"
            onClick={handleDownloadCsv}
            className="inline-flex items-center gap-1.5 rounded-xl border border-[#348CB2] px-4 py-2 text-xs font-bold text-[#194F70] dark:text-[#87CEEB] cursor-pointer"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Unduh Ranking CSV</span>
          </button>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl bg-[#194F70] px-4 py-2 text-xs font-bold text-white cursor-pointer"
          >
            Tutup
          </button>
        </div>
      </div>
    </Modal>
  );
}

function SupervisorProfileForm({
  profile,
  onClose,
  onSaveProfile,
}: {
  profile: { name: string; roleTitle: string; phone: string; email: string };
  onClose: () => void;
  onSaveProfile: (next: {
    name: string;
    roleTitle: string;
    phone: string;
    email: string;
  }) => void;
}) {
  const [name, setName] = useState(profile.name);
  const [roleTitle, setRoleTitle] = useState(profile.roleTitle);
  const [phone, setPhone] = useState(profile.phone);
  const [email, setEmail] = useState(profile.email);

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSaveProfile({
          name: name.trim() || profile.name,
          roleTitle: roleTitle.trim() || profile.roleTitle,
          phone: phone.trim() || profile.phone,
          email: email.trim() || profile.email,
        });
        onClose();
      }}
      className="space-y-3 text-xs sm:text-sm"
    >
      <div>
        <label className="block font-semibold mb-1">Nama Lengkap</label>
        <input
          type="text"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full rounded-xl border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-3.5 py-2.5"
        />
      </div>
      <div>
        <label className="block font-semibold mb-1">Jabatan &amp; Area Binaan</label>
        <input
          type="text"
          required
          value={roleTitle}
          onChange={(e) => setRoleTitle(e.target.value)}
          className="w-full rounded-xl border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-3.5 py-2.5"
        />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block font-semibold mb-1">No. HP / WhatsApp</label>
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="w-full rounded-xl border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-3.5 py-2.5 font-mono"
          />
        </div>
        <div>
          <label className="block font-semibold mb-1">Email Supervisor</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-xl border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-3.5 py-2.5"
          />
        </div>
      </div>
      <div className="flex justify-end gap-2 pt-2">
        <button
          type="button"
          onClick={onClose}
          className="rounded-xl border border-[var(--color-border)] px-4 py-2 text-xs font-semibold cursor-pointer"
        >
          Batal
        </button>
        <button
          type="submit"
          className="rounded-xl bg-[#194F70] px-4 py-2 text-xs font-bold text-white cursor-pointer"
        >
          Simpan Profil
        </button>
      </div>
    </form>
  );
}

/* 12. Supervisor Profile Modal (Screen 16: Profil Saya) */
export function SupervisorProfileModal({
  open,
  onClose,
  profile,
  onSaveProfile,
}: {
  open: boolean;
  onClose: () => void;
  profile: { name: string; roleTitle: string; phone: string; email: string };
  onSaveProfile: (next: {
    name: string;
    roleTitle: string;
    phone: string;
    email: string;
  }) => void;
}) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Profil Supervisor Area"
      subtitle="Perbarui biodata dan kontak koordinasi tim lapangan"
    >
      {open && (
        <SupervisorProfileForm
          key={`${profile.name}-${profile.email}`}
          profile={profile}
          onClose={onClose}
          onSaveProfile={onSaveProfile}
        />
      )}
    </Modal>
  );
}

/* 13. Supervisor Security Modal (Screen 16: Pengaturan Akun) */
export function SupervisorSecurityModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [otpEnabled, setOtpEnabled] = useState(true);
  const [saved, setSaved] = useState(false);

  return (
    <Modal
      open={open}
      onClose={() => {
        setSaved(false);
        onClose();
      }}
      title="Keamanan & Autentikasi Akun"
      subtitle="Kelola proteksi login OTP, kata sandi, dan sesi perangkat Supervisor"
    >
      <div className="space-y-4 text-xs sm:text-sm">
        <label className="flex items-center justify-between rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] p-3.5 cursor-pointer">
          <div>
            <p className="font-bold flex items-center gap-1.5">
              <Lock className="h-4 w-4 text-[#348CB2]" />
              <span>Verifikasi 2-Langkah (Kode OTP)</span>
            </p>
            <p className="text-[11px] text-[var(--color-text-muted)]">
              Wajibkan kode OTP 6-digit saat masuk dari perangkat baru
            </p>
          </div>
          <input
            type="checkbox"
            checked={otpEnabled}
            onChange={(e) => setOtpEnabled(e.target.checked)}
            className="h-4 w-4 accent-[#194F70]"
          />
        </label>
        <div className="rounded-xl border border-[var(--color-border)] p-3.5 space-y-1">
          <p className="font-bold">Sesi Aktif Saat Ini</p>
          <p className="text-[11px] text-[var(--color-text-muted)]">
            Web Browser (SalesX-Ai Supervisor Portal) · Terakhir aktif: Sekarang
          </p>
        </div>
        {saved && (
          <p className="text-xs font-semibold text-[#047857] flex items-center gap-1.5">
            <CheckCircle2 className="h-4 w-4" />
            <span>Pengaturan keamanan akun disimpan.</span>
          </p>
        )}
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-[var(--color-border)] px-4 py-2 text-xs font-semibold cursor-pointer"
          >
            Tutup
          </button>
          <button
            type="button"
            onClick={() => setSaved(true)}
            className="rounded-xl bg-[#194F70] px-4 py-2 text-xs font-bold text-white cursor-pointer"
          >
            Simpan Keamanan
          </button>
        </div>
      </div>
    </Modal>
  );
}

/* 14. About SalesX-Ai Modal (Screen 16: Tentang SalesX-Ai) */
export function AboutSalesXModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Tentang SalesX-Ai Platform"
      subtitle="Versi v1.0 · Field Operations & Location Intelligence"
    >
      <div className="space-y-3 text-xs sm:text-sm">
        <div className="rounded-xl border border-[#ADD8E6] bg-[#F3FAFC] dark:bg-[#172438] p-4 flex items-start gap-2.5">
          <Info className="h-4 w-4 text-[#348CB2] shrink-0 mt-0.5" />
          <p className="text-[var(--color-text-secondary)]">
            SalesX-Ai mengintegrasikan pemantauan lapangan berbasis Google Maps Platform,
            jadwal coaching tim via Google Workspace, serta analisis target bertenaga AI.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-2.5 text-xs">
          <div className="rounded-xl border border-[var(--color-border)] p-3">
            <p className="text-[var(--color-text-muted)]">Kepatuhan GPS</p>
            <p className="font-bold mt-0.5">Hanya Jam Shift Aktif</p>
          </div>
          <div className="rounded-xl border border-[var(--color-border)] p-3">
            <p className="text-[var(--color-text-muted)]">Edisi Portal</p>
            <p className="font-bold mt-0.5">Supervisor · Enterprise</p>
          </div>
        </div>
        <div className="flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl bg-[#194F70] px-4 py-2 text-xs font-bold text-white cursor-pointer"
          >
            Mengerti
          </button>
        </div>
      </div>
    </Modal>
  );
}

