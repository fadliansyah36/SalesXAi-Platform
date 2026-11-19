'use client';

import React, { useEffect, useState } from 'react';
import { ThemeProvider } from '@salesx-ai/design-system';
import { SalesXAuthProvider } from '@/components/providers/SalesXAuthProvider';
export { useSalesXAuth } from '@/components/providers/SalesXAuthProvider';
export { useTheme } from '@salesx-ai/design-system';

let gmpListenersInstalled = false;
function installGmpQuotaListeners() {
  if (typeof window === 'undefined' || gmpListenersInstalled) return;
  gmpListenersInstalled = true;
  (window as unknown as { gm_authFailure?: () => void }).gm_authFailure = () => window.dispatchEvent(new CustomEvent('gmp-quota-exceeded'));
  const originalError = console.error;
  console.error = (...args: unknown[]) => {
    originalError.apply(console, args);
    const message = args.map(value => String(value)).join(' ');
    if (message.includes('OverQuotaMapError') || message.includes('QuotaExceededError')) window.dispatchEvent(new CustomEvent('gmp-quota-exceeded'));
  };
}
export function AppProviders({ children }: { children: React.ReactNode }) {
  const [gmpQuotaExceeded, setGmpQuotaExceeded] = useState(false);
  useEffect(() => {
    installGmpQuotaListeners();
    if ('serviceWorker' in navigator) navigator.serviceWorker.register('/sw.js').catch(() => undefined);
    const handler = () => setGmpQuotaExceeded(true);
    window.addEventListener('gmp-quota-exceeded', handler);
    return () => window.removeEventListener('gmp-quota-exceeded', handler);
  }, []);
  return <ThemeProvider><SalesXAuthProvider>
    {gmpQuotaExceeded && <div className="sticky top-0 z-50 border-b border-amber-200 bg-amber-50 px-4 py-2.5 text-center text-xs text-amber-900 shadow-sm md:text-sm">
      Google Maps Platform quota reached. If you are the app owner, visit{' '}
      <a href="https://developers.google.com/maps/ai/ai-studio?utm_campaign=gmp_mcp_codeassist_v1_aistudio#quota_exceeded_errors" target="_blank" rel="noopener noreferrer" className="font-semibold text-amber-950 underline hover:text-amber-800">maps developer site</a>{' '}
      for instructions to update your account.
    </div>}
    {children}
  </SalesXAuthProvider></ThemeProvider>;
}
