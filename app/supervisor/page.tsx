import React, { Suspense } from 'react';
import type { Metadata } from 'next';
import { SupervisorPortalApp } from '@/components/supervisor/SupervisorPortalApp';

export const metadata: Metadata = {
  title: 'Supervisor Portal — SalesX-Ai',
  description:
    'Portal Supervisor SalesX-Ai untuk monitoring tim sales real-time, absensi shift geofence, live location GPS, replay rute, pencapaian target, peringatan tindak lanjut, dan AI Sales Coach.',
};

export default function SupervisorPortalPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-[var(--color-background)] text-sm font-semibold text-[var(--color-text-secondary)]">
          Memuat SalesX-Ai Supervisor Portal...
        </div>
      }
    >
      <SupervisorPortalApp />
    </Suspense>
  );
}
