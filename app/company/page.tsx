import React, { Suspense } from 'react';
import type { Metadata } from 'next';
import { CompanyPortalApp } from '@/components/company/CompanyPortalApp';

export const metadata: Metadata = {
  title: 'Company Portal — SalesX-Ai',
  description:
    'Portal Manajemen Perusahaan SalesX-Ai untuk cabang, tim sales, teritori, analitik keuangan, GPS monitoring, dan integrasi Google Workspace.',
};

export default function CompanyPortalPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-[var(--color-background)] text-sm font-semibold text-[var(--color-text-secondary)]">
          Memuat SalesX-Ai Company Portal...
        </div>
      }
    >
      <CompanyPortalApp />
    </Suspense>
  );
}
