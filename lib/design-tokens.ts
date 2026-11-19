/**
 * SalesX-Ai Canonical Design Tokens
 * Derived directly from Master PRD v1.0 & Engineering Execution Master Plan.
 */

export const primitiveTokens = {
  color: {
    brand: {
      50: '#F3FAFC',
      100: '#E5F4F8',
      200: '#ADD8E6', // Light Blue identity
      300: '#B0E0E6', // Powder Blue identity
      400: '#87CEEB', // Sky Blue identity
      500: '#5BAFD0',
      600: '#348CB2', // Accessible primary action
      700: '#236D91',
      800: '#194F70',
      900: '#123A54',
    },
    neutral: {
      0: '#FFFFFF',
      50: '#F8FAFC',
      100: '#F1F5F9',
      200: '#E2E8F0',
      300: '#CBD5E1',
      400: '#94A3B8',
      500: '#64748B',
      600: '#475569',
      700: '#334155',
      800: '#1E293B',
      900: '#0F172A',
    },
    accent: {
      ctaOrange: '#F97316',
      ctaOrangeHover: '#EA580C',
      aiViolet: '#7C3AED',
      aiVioletHover: '#6D28D9',
    },
    success: {
      50: '#ECFDF5',
      500: '#10B981',
      700: '#047857',
    },
    warning: {
      50: '#FFFBEB',
      500: '#F59E0B',
      700: '#B45309',
    },
    danger: {
      50: '#FEF2F2',
      500: '#EF4444',
      700: '#B91C1C',
    },
    info: {
      50: '#EFF6FF',
      500: '#3B82F6',
      700: '#1D4ED8',
    },
  },
  spacing: {
    0: '0px',
    1: '4px',
    2: '8px',
    3: '12px',
    4: '16px',
    5: '20px',
    6: '24px',
    8: '32px',
    10: '40px',
    12: '48px',
    16: '64px',
    20: '80px',
    24: '96px',
  },
  radius: {
    none: '0px',
    sm: '4px',
    md: '8px',
    lg: '12px',
    xl: '16px',
    '2xl': '20px',
    '3xl': '24px',
    full: '9999px',
  },
  motion: {
    fast: '120ms',
    normal: '200ms',
    slow: '300ms',
  },
} as const;

export const semanticLightTokens = {
  background: primitiveTokens.color.neutral[50],
  surface: primitiveTokens.color.neutral[0],
  surfaceRaised: primitiveTokens.color.neutral[0],
  surfaceMuted: primitiveTokens.color.neutral[100],
  textPrimary: primitiveTokens.color.neutral[900],
  textSecondary: primitiveTokens.color.neutral[600],
  textMuted: primitiveTokens.color.neutral[500],
  border: primitiveTokens.color.neutral[200],
  borderStrong: primitiveTokens.color.neutral[300],
  primary: primitiveTokens.color.brand[600],
  primaryHover: primitiveTokens.color.brand[700],
  primarySubtle: primitiveTokens.color.brand[50],
  focus: primitiveTokens.color.brand[600],
  success: primitiveTokens.color.success[500],
  warning: primitiveTokens.color.warning[500],
  danger: primitiveTokens.color.danger[500],
  info: primitiveTokens.color.info[500],
} as const;

export const semanticDarkTokens = {
  background: '#0B1220',
  surface: '#111C2D',
  surfaceRaised: '#172438',
  surfaceMuted: '#1A2A3F',
  textPrimary: '#F8FAFC',
  textSecondary: '#CBD5E1',
  textMuted: '#94A3B8',
  border: '#26374B',
  borderStrong: '#3A506A',
  primary: '#87CEEB',
  primaryHover: '#ADD8E6',
  primarySubtle: '#19394B',
  focus: '#87CEEB',
  success: '#34D399',
  warning: '#FBBF24',
  danger: '#F87171',
  info: '#60A5FA',
} as const;
