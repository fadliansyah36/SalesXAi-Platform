'use client';

import React from 'react';

interface KpiMetricCardProps {
  label: string;
  value: string;
  sublabel?: string;
  trend?: string;
  trendTone?: 'positive' | 'warning' | 'neutral';
  icon?: React.ReactNode;
  accentBgClass?: string;
  onClick?: () => void;
}

export function KpiMetricCard({
  label,
  value,
  sublabel,
  trend,
  trendTone = 'positive',
  icon,
  accentBgClass = 'bg-[#E5F4F8] dark:bg-[#19394B] text-[#348CB2] dark:text-[#87CEEB]',
  onClick,
}: KpiMetricCardProps) {
  const trendClass =
    trendTone === 'positive'
      ? 'text-[#047857] dark:text-[#34D399]'
      : trendTone === 'warning'
        ? 'text-[#B45309] dark:text-[#FBBF24]'
        : 'text-[var(--color-text-muted)]';

  const content = (
    <div className="flex flex-col sm:flex-row sm:items-start gap-2 sm:gap-3">
      {icon && (
        <div
          className={`flex h-8 w-8 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-xl ${accentBgClass}`}
        >
          {icon}
        </div>
      )}
      <div className="min-w-0 flex-1">
        <p className="text-[11px] sm:text-xs font-medium text-[var(--color-text-secondary)] line-clamp-1">
          {label}
        </p>
        <p className="mt-0.5 text-base sm:text-xl leading-tight font-bold tracking-tight text-[#123A54] dark:text-white font-mono tabular-nums break-words">
          {value}
        </p>
        {(trend || sublabel) && (
          <div className="mt-1 flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-[11px]">
            {trend && (
              <span className={`font-bold tabular-nums ${trendClass}`}>
                {trend}
              </span>
            )}
            {sublabel && (
              <span className="text-[var(--color-text-muted)] truncate">
                {sublabel}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        className="w-full h-full text-left rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-3.5 sm:p-4 hover:border-[#348CB2] transition-colors cursor-pointer"
      >
        {content}
      </button>
    );
  }

  return (
    <div className="h-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-3.5 sm:p-4">
      {content}
    </div>
  );
}
