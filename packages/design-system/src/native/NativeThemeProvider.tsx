import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { useWindowDimensions } from 'react-native';
import { salesxTokens } from '@salesx-ai/design-tokens/native';

export type NativeTheme = 'light' | 'dark';
export type NativeThemeColors = { [K in keyof typeof salesxTokens.semanticLight.color]: string };
export type NativeBreakpoint = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';

const numberValue = (value: string | number) => typeof value === 'number' ? value : Number.parseFloat(value);
const dimensionMap = (group: Record<string, { $value: string | number }>) =>
  Object.fromEntries(Object.entries(group).map(([key, token]) => [key, numberValue(token.$value)])) as Record<string, number>;
const themeColors = (theme: NativeTheme): NativeThemeColors => {
  const semantic = theme === 'dark' ? salesxTokens.semanticDark.color : salesxTokens.semanticLight.color;
  return Object.fromEntries(Object.entries(semantic).map(([key, token]) => [key, token.$value])) as NativeThemeColors;
};
const sharedTokens = {
  fontFamily: { sans: salesxTokens.typography.fontFamily.sans.$value, mono: salesxTokens.typography.fontFamily.mono.$value },
  fontSize: dimensionMap(salesxTokens.typography.fontSize),
  lineHeight: dimensionMap(salesxTokens.typography.lineHeight),
  fontWeight: dimensionMap(salesxTokens.typography.fontWeight),
  spacing: dimensionMap(salesxTokens.spacing.spacing),
  radius: dimensionMap(salesxTokens.radius.radius),
  elevation: Object.fromEntries(Object.entries(salesxTokens.elevation.shadow).map(([key, token]) => [key, token.$value])),
  motion: {
    fast: numberValue(salesxTokens.motion.motion.fast.$value),
    normal: numberValue(salesxTokens.motion.motion.normal.$value),
    slow: numberValue(salesxTokens.motion.motion.slow.$value),
    easingStandard: salesxTokens.motion.motion.easingStandard.$value,
  },
  breakpoints: dimensionMap(salesxTokens.breakpoints.breakpoint),
} as const;
type NativeThemeContextValue = {
  theme: NativeTheme;
  colors: NativeThemeColors;
  tokens: typeof sharedTokens;
  setTheme: (theme: NativeTheme) => void;
  toggleTheme: () => void;
};
const NativeThemeContext = createContext<NativeThemeContextValue | null>(null);

export function NativeThemeProvider({ children, initialTheme = 'light' }: { children: React.ReactNode; initialTheme?: NativeTheme }) {
  const [theme, setTheme] = useState<NativeTheme>(initialTheme);
  const toggleTheme = useCallback(() => setTheme(current => current === 'light' ? 'dark' : 'light'), []);
  const colors = useMemo(() => themeColors(theme), [theme]);
  const value = useMemo(() => ({ theme, colors, tokens: sharedTokens, setTheme, toggleTheme }), [theme, colors, toggleTheme]);
  return <NativeThemeContext.Provider value={value}>{children}</NativeThemeContext.Provider>;
}
export function useNativeTheme(): NativeThemeContextValue {
  const context = useContext(NativeThemeContext);
  if (!context) throw new Error('useNativeTheme must be used inside NativeThemeProvider');
  return context;
}
export function useNativeBreakpoint(): NativeBreakpoint {
  const { width } = useWindowDimensions();
  const { tokens } = useNativeTheme();
  if (width >= tokens.breakpoints['2xl']) return '2xl';
  if (width >= tokens.breakpoints.xl) return 'xl';
  if (width >= tokens.breakpoints.lg) return 'lg';
  if (width >= tokens.breakpoints.md) return 'md';
  if (width >= tokens.breakpoints.sm) return 'sm';
  return 'xs';
}
