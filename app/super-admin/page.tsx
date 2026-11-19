import React, { Suspense } from 'react';
import type { Metadata } from 'next';
import { SuperAdminPortalApp } from '@/components/super-admin/SuperAdminPortalApp';

export const metadata: Metadata = {
  title: 'Super Admin Portal — SalesX-Ai',
  description:
    'Pusat Kendali Platform SalesX-Ai untuk manajemen multi-tenant, organisasi, user administration, master data CRUD, analitik platform, service registry, RBAC, domain registry, feature flags, subscription, integrasi, AI provider, Telegram bot, usage cost, security events, dan audit logs.',
};

export default function SuperAdminPortalPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-[var(--color-background)] text-sm font-semibold text-[var(--color-text-secondary)]">
          Memuat SalesX-Ai Super Admin Portal...
        </div>
      }
    >
      <SuperAdminPortalApp />
    </Suspense>
  );
}
