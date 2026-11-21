'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Bell,
  Sun,
  Moon,
  LogOut,
  Menu,
  X,
  Puzzle,
  Sparkles,
  ShoppingCart,
} from 'lucide-react';
import { BrandLogo } from '@/components/common/BrandLogo';
import { PWAInstallButton } from '@/components/common/PWAInstallButton';
import { useTheme, useSalesXAuth } from '@/components/providers/AppProviders';
import type { PortalKey } from '@salesx-ai/shared-types';

export interface PortalNavItem<T extends string> {
  id: T;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

export interface PortalNavGroup<T extends string> {
  group: string;
  items: PortalNavItem<T>[];
}

export interface BottomNavItem<T extends string> {
  id: T;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

interface PortalShellProps<T extends string> {
  portalSubtitle: string;
  entityName: string;
  entityBadge?: string;
  activeTab: T;
  onSelectTab: (id: T) => void;
  navGroups: PortalNavGroup<T>[];
  bottomNavItems: BottomNavItem<T>[];
  unreadNotificationsCount: number;
  onOpenNotifications: () => void;
  onOpenPlugins: () => void;
  onOpenAiAssistant?: () => void;
  aiAssistantLabel?: string;
  onRequestLogout: () => void;
  currentPortalPath: '/distributor' | '/principal' | '/supervisor' | '/super-admin';
  children: React.ReactNode;
}

const PORTAL_SWITCHER = [
  { href: '/distributor', label: 'Distributor' },
  { href: '/principal', label: 'Principal' },
  { href: '/supervisor', label: 'Supervisor' },
  { href: '/company', label: 'Company' },
  { href: '/portal', label: 'Sales' },
  { href: '/customer', label: 'Customer' },
] as const;

const PORTAL_KEY_BY_PATH: Record<(typeof PORTAL_SWITCHER)[number]["href"], PortalKey> = {
  "/super-admin": "super_admin",
  "/distributor": "distributor",
  "/principal": "principal",
  "/supervisor": "supervisor",
  "/company": "company",
  "/portal": "sales",
  "/customer": "customer",
};

export function PortalShell<T extends string>({
  portalSubtitle,
  entityName,
  entityBadge,
  activeTab,
  onSelectTab,
  navGroups,
  bottomNavItems,
  unreadNotificationsCount,
  onOpenNotifications,
  onOpenPlugins,
  onOpenAiAssistant,
  aiAssistantLabel = 'Asisten AI',
  onRequestLogout,
  currentPortalPath,
  children,
}: PortalShellProps<T>) {
  const { theme, toggleTheme } = useTheme();
  const auth = useSalesXAuth();
  const availablePortals = PORTAL_SWITCHER.filter(item => auth.canAccessPortal(PORTAL_KEY_BY_PATH[item.href]));
  const [drawerOpen, setDrawerOpen] = useState(false);

  const currentTabLabel =
    navGroups.flatMap((g) => g.items).find((i) => i.id === activeTab)?.label ||
    portalSubtitle;

  return (
    <div className="min-h-screen overflow-x-hidden bg-[var(--color-background)] text-[var(--color-text-primary)] flex flex-col lg:flex-row">
      {/* Desktop Left Sidebar */}
      <aside className="hidden lg:flex lg:w-[260px] lg:shrink-0 lg:flex-col border-r border-[var(--color-border)] bg-[var(--color-surface)] sticky top-0 h-screen overflow-y-auto">
        <div className="flex h-16 items-center justify-between px-4 border-b border-[var(--color-border)] shrink-0">
          <Link href="/">
            <BrandLogo subtitle={portalSubtitle} compact />
          </Link>
        </div>

        <div className="p-3.5 space-y-5 flex-1">
          {navGroups.map((grp) => (
            <div key={grp.group}>
              <p className="px-2.5 text-[11px] font-bold uppercase tracking-wider text-[var(--color-text-muted)] mb-1.5">
                {grp.group}
              </p>
              <div className="space-y-0.5">
                {grp.items.map((item) => {
                  const Icon = item.icon;
                  const active = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => onSelectTab(item.id)}
                      className={`w-full flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-semibold transition-colors cursor-pointer ${
                        active
                          ? 'bg-[#194F70] dark:bg-[#348CB2] text-white shadow-xs'
                          : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-muted)] hover:text-[var(--color-text-primary)]'
                      }`}
                    >
                      <Icon className="h-4 w-4 shrink-0" />
                      <span className="truncate">{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
          {auth.canPerformApiAction("smartorder.catalog.products.read") && <Link href={currentPortalPath + "/smart-order"} className="mt-3 flex items-center gap-2.5 rounded-xl border border-[var(--color-border)] px-3 py-2.5 text-xs font-semibold text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-muted)]"><ShoppingCart className="h-4 w-4"/>SmartOrder</Link>}
          {auth.canPerformApiAction("smartreward.catalog.read") && <Link href={currentPortalPath + "/smart-reward"} className="mt-2 flex items-center gap-2.5 rounded-xl border border-[var(--color-border)] px-3 py-2.5 text-xs font-semibold text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-muted)]">SmartReward</Link>}
        </div>

        {/* Cross-portal switcher & Logout */}
        <div className="border-t border-[var(--color-border)] p-3.5 space-y-2.5 shrink-0">
          <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-text-muted)] px-1">
            Pindah Portal Ekosistem
          </p>
          <div className="grid grid-cols-3 gap-1.5 text-[11px] font-semibold">
            {availablePortals.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`rounded-lg border py-1.5 text-center transition-colors ${
                  item.href === currentPortalPath
                    ? 'border-[#348CB2] bg-[#E5F4F8] dark:bg-[#19394B] text-[#123A54] dark:text-[#87CEEB]'
                    : 'border-[var(--color-border)] hover:bg-[var(--color-surface-muted)] text-[var(--color-text-secondary)]'
                }`}
              >
                {item.label}
              </Link>
            ))}
          </div>
          <button
            type="button"
            onClick={onRequestLogout}
            className="w-full inline-flex items-center justify-center gap-1.5 rounded-xl border border-red-200 dark:border-red-900/50 py-2 text-xs font-semibold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 cursor-pointer"
          >
            <LogOut className="h-3.5 w-3.5" />
            <span>Keluar Portal</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 pb-24 lg:pb-8">
        {/* Top Sticky Header */}
        <header className="sticky top-0 z-30 border-b border-[var(--color-border)] bg-[var(--color-surface)]/95 backdrop-blur-md">
          <div className="flex h-16 items-center justify-between gap-2 sm:gap-3 px-3 sm:px-6">
            <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
              <button
                type="button"
                onClick={() => setDrawerOpen(true)}
                className="lg:hidden inline-flex min-h-[42px] min-w-[42px] shrink-0 items-center justify-center rounded-xl border border-[var(--color-border)] cursor-pointer"
                aria-label="Buka menu navigasi"
              >
                <Menu className="h-5 w-5" />
              </button>
              <div className="lg:hidden min-w-0 truncate">
                <BrandLogo subtitle={portalSubtitle} compact />
              </div>
              <div className="hidden lg:block min-w-0">
                <h1 className="text-base font-bold text-[#123A54] dark:text-white truncate">
                  {currentTabLabel}
                </h1>
                <p className="text-xs text-[var(--color-text-muted)] truncate">
                  {entityName}
                  {entityBadge ? ` · ${entityBadge}` : ''}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
              <div className="hidden sm:block">
                <PWAInstallButton variant="compact" />
              </div>

              {onOpenAiAssistant && (
                <button
                  type="button"
                  onClick={onOpenAiAssistant}
                  aria-label={aiAssistantLabel}
                  className="inline-flex min-h-[40px] min-w-[40px] sm:min-w-0 items-center justify-center gap-1.5 rounded-xl border border-[#ADD8E6] bg-[#F3FAFC] dark:bg-[#19394B] dark:border-[#348CB2] px-2.5 sm:px-3 py-2 text-xs font-semibold text-[#194F70] dark:text-[#87CEEB] hover:bg-[#E5F4F8] cursor-pointer whitespace-nowrap"
                >
                  <Sparkles className="h-4 w-4 sm:h-3.5 sm:w-3.5 text-[#348CB2]" />
                  <span className="hidden md:inline">{aiAssistantLabel}</span>
                </button>
              )}

              <button
                type="button"
                onClick={onOpenPlugins}
                aria-label="Plugin & Workspace"
                className="inline-flex min-h-[40px] min-w-[40px] sm:min-w-0 items-center justify-center gap-1.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-2.5 sm:px-3 py-2 text-xs font-semibold text-[var(--color-text-primary)] hover:bg-[var(--color-surface-muted)] cursor-pointer whitespace-nowrap"
                title="Plugin Google Workspace, Maps, AI & Telegram"
              >
                <Puzzle className="h-4 w-4 sm:h-3.5 sm:w-3.5 text-[#348CB2]" />
                <span className="hidden sm:inline">Plugin & Workspace</span>
              </button>

              <button
                type="button"
                onClick={onOpenNotifications}
                className="relative inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[var(--color-border)] hover:bg-[var(--color-surface-muted)] cursor-pointer"
                aria-label="Notifikasi Portal"
              >
                <Bell className="h-4 w-4" />
                {unreadNotificationsCount > 0 && (
                  <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-[#F97316] text-[10px] font-bold text-white tabular-nums">
                    {unreadNotificationsCount}
                  </span>
                )}
              </button>

              <button
                type="button"
                onClick={toggleTheme}
                className="hidden sm:inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[var(--color-border)] hover:bg-[var(--color-surface-muted)] cursor-pointer"
                aria-label="Ganti tema tampilan"
              >
                {theme === 'light' ? (
                  <Moon className="h-4 w-4" />
                ) : (
                  <Sun className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>
        </header>

        <main className="mx-auto w-full max-w-[1440px] flex-1 p-3.5 sm:p-6">
          {children}
        </main>
      </div>

      {/* Mobile Bottom Navigation (<=15% viewport height with safe area) */}
      <nav
        aria-label="Navigasi bawah mobile"
        className="lg:hidden fixed bottom-0 left-0 right-0 z-40 border-t border-[var(--color-border)] bg-[var(--color-surface)]/95 backdrop-blur-md pb-[env(safe-area-inset-bottom)]"
      >
        <div
          className={`grid h-16 ${
            bottomNavItems.length === 4 ? 'grid-cols-4' : 'grid-cols-5'
          }`}
        >
          {bottomNavItems.map((item) => {
            const Icon = item.icon;
            const active = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onSelectTab(item.id)}
                className={`flex min-w-0 flex-col items-center justify-center gap-0.5 px-1 text-[10px] font-semibold cursor-pointer ${
                  active
                    ? 'text-[#194F70] dark:text-[#87CEEB]'
                    : 'text-[var(--color-text-muted)]'
                }`}
              >
                <Icon className="h-5 w-5 shrink-0" />
                <span className="truncate max-w-full">{item.label}</span>
              </button>
            );
          })}
        </div>
      </nav>

      {/* Mobile Drawer */}
      {drawerOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-slate-950/50 backdrop-blur-xs"
            onClick={() => setDrawerOpen(false)}
          />
          <div className="relative z-10 w-72 max-w-[85vw] bg-[var(--color-surface)] h-full overflow-y-auto p-4 space-y-5 shadow-xl">
            <div className="flex items-center justify-between gap-2 border-b border-[var(--color-border)] pb-3">
              <BrandLogo subtitle={portalSubtitle} compact />
              <button
                type="button"
                onClick={() => setDrawerOpen(false)}
                className="min-h-[44px] min-w-[44px] inline-flex items-center justify-center rounded-xl border border-[var(--color-border)]"
                aria-label="Tutup menu"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="flex items-center justify-between gap-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] p-2.5">
              <button
                type="button"
                onClick={toggleTheme}
                className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-xs font-semibold cursor-pointer"
              >
                {theme === 'light' ? (
                  <>
                    <Moon className="h-3.5 w-3.5" />
                    <span>Mode Gelap</span>
                  </>
                ) : (
                  <>
                    <Sun className="h-3.5 w-3.5" />
                    <span>Mode Terang</span>
                  </>
                )}
              </button>
              <PWAInstallButton variant="compact" />
            </div>

            {navGroups.map((grp) => (
              <div key={grp.group}>
                <p className="px-2 text-[11px] font-bold uppercase tracking-wider text-[var(--color-text-muted)] mb-1">
                  {grp.group}
                </p>
                <div className="space-y-0.5">
                  {grp.items.map((item) => {
                    const Icon = item.icon;
                    const active = activeTab === item.id;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => {
                          onSelectTab(item.id);
                          setDrawerOpen(false);
                        }}
                        className={`w-full flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-xs font-semibold cursor-pointer ${
                          active
                            ? 'bg-[#194F70] dark:bg-[#348CB2] text-white'
                            : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-muted)]'
                        }`}
                      >
                        <Icon className="h-4 w-4 shrink-0" />
                        <span className="truncate">{item.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
            {auth.canPerformApiAction("smartorder.catalog.products.read") && <Link href={currentPortalPath + "/smart-order"} onClick={() => setDrawerOpen(false)} className="flex items-center gap-2.5 rounded-xl border border-[var(--color-border)] px-3 py-2.5 text-xs font-semibold text-[var(--color-text-secondary)]"><ShoppingCart className="h-4 w-4"/>SmartOrder</Link>}

            <div className="border-t border-[var(--color-border)] pt-3 space-y-2.5">
              <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-text-muted)]">
                Portal Lainnya
              </p>
              <div className="grid grid-cols-3 gap-1.5 text-[11px] font-semibold">
                {PORTAL_SWITCHER.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setDrawerOpen(false)}
                    className={`rounded-lg border py-2 px-1 text-center truncate ${
                      item.href === currentPortalPath
                        ? 'border-[#348CB2] bg-[#E5F4F8] dark:bg-[#19394B] text-[#123A54] dark:text-[#87CEEB]'
                        : 'border-[var(--color-border)] text-[var(--color-text-secondary)]'
                    }`}
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
              <button
                type="button"
                onClick={() => {
                  setDrawerOpen(false);
                  onRequestLogout();
                }}
                className="w-full inline-flex items-center justify-center gap-1.5 rounded-xl border border-red-200 dark:border-red-900/50 py-2.5 text-xs font-semibold text-red-600 dark:text-red-400 cursor-pointer"
              >
                <LogOut className="h-3.5 w-3.5" />
                <span>Keluar Portal</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
