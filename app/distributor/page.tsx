import React, { Suspense } from 'react';
import type { Metadata } from 'next';
import { DistributorPortalApp } from '@/components/distributor/DistributorPortalApp';

export const metadata: Metadata = {
  title: 'Distributor Portal — SalesX-Ai',
  description:
    'Portal Distributor SalesX-Ai untuk pengelolaan stok gudang, pergerakan barang, pemrosesan order, fulfillment pengiriman, direktori outlet, tim sales, dan analitik distribusi.',
};

export default function DistributorPortalPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-[var(--color-background)] text-sm font-semibold text-[var(--color-text-secondary)]">
          Memuat SalesX-Ai Distributor Portal...
        </div>
      }
    >
      <DistributorPortalApp />
    </Suspense>
  );
}
