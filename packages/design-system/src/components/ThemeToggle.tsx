'use client';

import React from 'react';
import { useTheme } from '../theme/ThemeProvider';

export function ThemeToggle({ className = '' }: { className?: string }) {
  const { theme, toggleTheme } = useTheme();
  const next = theme === 'light' ? 'dark' : 'light';
  return <button type="button" className={`salesx-theme-toggle ${className}`.trim()} onClick={toggleTheme}
    aria-label={`Switch to ${next} theme`} aria-pressed={theme === 'dark'} title={`Switch to ${next} theme`}>
    <span aria-hidden="true">{theme === 'light' ? '☾' : '☀'}</span>
  </button>;
}
