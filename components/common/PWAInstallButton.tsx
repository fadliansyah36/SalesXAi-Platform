'use client';

import React, { useState } from 'react';
import { Download, Share, X } from 'lucide-react';
import { usePWAInstall } from '@/hooks/usePWAInstall';

interface PWAInstallButtonProps {
  variant?: 'default' | 'compact';
}

export function PWAInstallButton({ variant = 'default' }: PWAInstallButtonProps) {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  if (isInstalled) {
    return null;
  }

  if (isInstallable) {
    return (
      <button
        type="button"
        onClick={install}
        className={`inline-flex items-center justify-center gap-2 rounded-lg font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
          variant === 'compact'
            ? 'bg-[#E5F4F8] dark:bg-[#19394B] text-[#236D91] dark:text-[#87CEEB] px-3 py-2 text-xs hover:bg-[#ADD8E6]/50'
            : 'bg-[#348CB2] text-white px-4 py-2 text-xs hover:bg-[#236D91]'
        }`}
      >
        <Download className="h-3.5 w-3.5" />
        <span>Install PWA</span>
      </button>
    );
  }

  if (isIOS) {
    return (
      <>
        <button
          type="button"
          onClick={() => setShowIOSGuide(true)}
          className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-3 py-2 text-xs font-medium text-[var(--color-text-primary)] hover:bg-[var(--color-surface-muted)] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
        >
          <Download className="h-3.5 w-3.5" />
          <span>Install di iOS</span>
        </button>

        {showIOSGuide && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-xs">
            <div className="w-full max-w-sm rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-xl">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-[var(--color-text-primary)]">
                  Install SalesX-Ai di iPhone / iPad
                </h3>
                <button
                  type="button"
                  onClick={() => setShowIOSGuide(false)}
                  aria-label="Tutup panduan instalasi"
                  className="rounded-lg p-1.5 text-[var(--color-text-muted)] hover:bg-[var(--color-surface-muted)]"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <ol className="mt-3 space-y-2 text-sm text-[var(--color-text-secondary)]">
                <li className="flex items-start gap-2">
                  <span className="font-semibold text-[#348CB2]">1.</span>
                  <span>
                    Ketuk tombol <Share className="inline h-3.5 w-3.5 mx-0.5" />{' '}
                    <strong>Bagikan (Share)</strong> pada toolbar Safari.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="font-semibold text-[#348CB2]">2.</span>
                  <span>
                    Gulir ke bawah lalu pilih{' '}
                    <strong>Tambah ke Layar Utama (Add to Home Screen)</strong>.
                  </span>
                </li>
              </ol>
              <button
                type="button"
                onClick={() => setShowIOSGuide(false)}
                className="mt-5 w-full rounded-lg bg-[#348CB2] py-2.5 text-sm font-semibold text-white hover:bg-[#236D91] transition-colors"
              >
                Mengerti
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  return null;
}
