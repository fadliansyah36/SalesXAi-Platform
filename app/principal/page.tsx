import React, { Suspense } from 'react';
import type { Metadata } from 'next';
import { PrincipalPortalApp } from '@/components/principal/PrincipalPortalApp';

export const metadata: Metadata = {
  title: 'Principal Portal — SalesX-Ai',
  description:
    'Portal Principal SalesX-Ai untuk pengelolaan produk master, varian SKU, price list distributor, pricing policy, campaign promosi nasional, jaringan distributor, dan AI Business Insight.',
};

export default function PrincipalPortalPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-[var(--color-background)] text-sm font-semibold text-[var(--color-text-secondary)]">
          Memuat SalesX-Ai Principal Portal...
        </div>
      }
    >
      <PrincipalPortalApp />
    </Suspense>
  );
}
