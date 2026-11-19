'use client';

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useSyncExternalStore,
} from 'react';

type Theme = 'light' | 'dark';

interface ThemeContextValue {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: 'light',
  toggleTheme: () => {},
  setTheme: () => {},
});

export function useTheme() {
  return useContext(ThemeContext);
}

function subscribeTheme(callback: () => void) {
  window.addEventListener('salesx-theme-change', callback);
  window.addEventListener('storage', callback);
  return () => {
    window.removeEventListener('salesx-theme-change', callback);
    window.removeEventListener('storage', callback);
  };
}

function getThemeSnapshot(): Theme {
  if (typeof window === 'undefined') return 'light';
  const saved = window.localStorage.getItem('salesx-theme');
  return saved === 'dark' ? 'dark' : 'light';
}

// Register Google Maps Demo Key Tier 1 quota listener at module/client root
let gmpListenersInstalled = false;
function installGmpQuotaListeners() {
  if (typeof window === 'undefined' || gmpListenersInstalled) return;
  gmpListenersInstalled = true;

  (window as unknown as { gm_authFailure?: () => void }).gm_authFailure =
    () => {
      window.dispatchEvent(new CustomEvent('gmp-quota-exceeded'));
    };

  const origError = console.error;
  console.error = (...args: unknown[]) => {
    origError.apply(console, args);
    const msg = args.map((a) => String(a)).join(' ');
    if (
      msg.includes('OverQuotaMapError') ||
      msg.includes('QuotaExceededError')
    ) {
      window.dispatchEvent(new CustomEvent('gmp-quota-exceeded'));
    }
  };
}

export function AppProviders({ children }: { children: React.ReactNode }) {
  const theme = useSyncExternalStore(
    subscribeTheme,
    getThemeSnapshot,
    () => 'light' as Theme
  );
  const [gmpQuotaExceeded, setGmpQuotaExceeded] = useState(false);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);

  useEffect(() => {
    installGmpQuotaListeners();

    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => {});
    }

    const handleQuotaExceeded = () => setGmpQuotaExceeded(true);
    window.addEventListener('gmp-quota-exceeded', handleQuotaExceeded);
    return () => {
      window.removeEventListener('gmp-quota-exceeded', handleQuotaExceeded);
    };
  }, []);

  const setTheme = useCallback((next: Theme) => {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('salesx-theme', next);
      document.documentElement.classList.toggle('dark', next === 'dark');
      window.dispatchEvent(new Event('salesx-theme-change'));
    }
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme(theme === 'light' ? 'dark' : 'light');
  }, [theme, setTheme]);

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setTheme }}>
      {gmpQuotaExceeded && (
        <div className="bg-amber-50 border-b border-amber-200 text-amber-900 px-4 py-2.5 text-xs md:text-sm text-center sticky top-0 z-50 shadow-sm">
          <span>
            Google Maps Platform quota reached. If you are the app owner, visit{' '}
            <a
              href="https://developers.google.com/maps/ai/ai-studio?utm_campaign=gmp_mcp_codeassist_v1_aistudio#quota_exceeded_errors"
              target="_blank"
              rel="noopener noreferrer"
              className="underline font-semibold text-amber-950 hover:text-amber-800"
            >
              maps developer site
            </a>{' '}
            for instructions to update your account.
          </span>
        </div>
      )}

      {children}
    </ThemeContext.Provider>
  );
}
