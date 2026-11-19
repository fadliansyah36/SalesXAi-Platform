'use client';

import React from 'react';
import {
  CheckCircle2,
  Clock,
  AlertTriangle,
  XCircle,
  Truck,
  Sparkles,
} from 'lucide-react';

export type StatusTone =
  | 'success'
  | 'info'
  | 'warning'
  | 'danger'
  | 'neutral'
  | 'brand';

const TONE_CLASSES: Record<StatusTone, string> = {
  success:
    'bg-[#ECFDF5] text-[#047857] border-[#A7F3D0] dark:bg-[#064E3B]/40 dark:text-[#34D399] dark:border-[#065F46]',
  info: 'bg-[#EFF6FF] text-[#1D4ED8] border-[#BFDBFE] dark:bg-[#172554]/50 dark:text-[#60A5FA] dark:border-[#1E3A8A]',
  warning:
    'bg-[#FFFBEB] text-[#B45309] border-[#FDE68A] dark:bg-[#451A03]/50 dark:text-[#FBBF24] dark:border-[#78350F]',
  danger:
    'bg-[#FEF2F2] text-[#B91C1C] border-[#FECACA] dark:bg-[#450A0A]/50 dark:text-[#F87171] dark:border-[#7F1D1D]',
  brand:
    'bg-[#E5F4F8] text-[#194F70] border-[#ADD8E6] dark:bg-[#19394B] dark:text-[#87CEEB] dark:border-[#348CB2]/40',
  neutral:
    'bg-[var(--color-surface-muted)] text-[var(--color-text-secondary)] border-[var(--color-border)]',
};

export function inferStatusTone(status: string): StatusTone {
  const s = status.toLowerCase();
  if (
    s.includes('aktif') && !s.includes('non') && !s.includes('tidak') ||
    s.includes('aman') ||
    s.includes('selesai') ||
    s.includes('dalam shift') ||
    s.includes('online') ||
    s.includes('siap kirim') ||
    s.includes('masuk') && !s.includes('belum')
  ) {
    return 'success';
  }
  if (
    s.includes('habis') ||
    s.includes('nonaktif') ||
    s.includes('penting') ||
    s.includes('batal') ||
    s.includes('tidak aktif')
  ) {
    return 'danger';
  }
  if (
    s.includes('rendah') ||
    s.includes('menipis') ||
    s.includes('terlambat') ||
    s.includes('terjadwal') ||
    s.includes('follow-up') ||
    s.includes('pending')
  ) {
    return 'warning';
  }
  if (
    s.includes('diproses') ||
    s.includes('dikirim') ||
    s.includes('dalam pengiriman') ||
    s.includes('baru') ||
    s.includes('berlangsung')
  ) {
    return 'info';
  }
  return 'neutral';
}

export function StatusTag({
  label,
  tone,
  showIcon = false,
}: {
  label: string;
  tone?: StatusTone;
  showIcon?: boolean;
}) {
  const resolvedTone = tone || inferStatusTone(label);
  const Icon =
    resolvedTone === 'success'
      ? CheckCircle2
      : resolvedTone === 'warning'
        ? AlertTriangle
        : resolvedTone === 'danger'
          ? XCircle
          : resolvedTone === 'info'
            ? Truck
            : resolvedTone === 'brand'
              ? Sparkles
              : Clock;

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[11px] font-semibold whitespace-nowrap shrink-0 ${TONE_CLASSES[resolvedTone]}`}
    >
      {showIcon && <Icon className="h-3 w-3 shrink-0" />}
      <span>{label}</span>
    </span>
  );
}
