import React, { Suspense } from 'react';
import { SalesPortalApp } from '@/components/portal/SalesPortalApp';

export default function PortalPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-[var(--color-background)] text-sm font-semibold text-[var(--color-text-secondary)]">
          Memuat SalesX-Ai Sales Portal...
        </div>
      }
    >
      <SalesPortalApp />
    </Suspense>
  );
}
