import React, { Suspense } from 'react';
import type { Metadata } from 'next';
import { CustomerPortalApp } from '@/components/customer/CustomerPortalApp';

export const metadata: Metadata = {
  title: 'Customer Portal — SalesX-Ai',
  description:
    'Portal Pelanggan & Outlet SalesX-Ai untuk pemesanan produk, daftar harga kontrak, promo outlet, pelacakan pengiriman, dan penukaran poin SmartReward.',
};

export default function CustomerPortalPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-[var(--color-background)] text-sm font-semibold text-[var(--color-text-secondary)]">
          Memuat SalesX-Ai Customer Portal...
        </div>
      }
    >
      <CustomerPortalApp />
    </Suspense>
  );
}
