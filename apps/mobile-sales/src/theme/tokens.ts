import { salesxTokens } from '../../../../packages/design-tokens/generated/native';
const value = (token: { readonly $value: string | number }) => token.$value;
export const mobileThemes = {
  light: {
    background: value(salesxTokens.semanticLight.color.background),
    surface: value(salesxTokens.semanticLight.color.surface),
    surfaceRaised: value(salesxTokens.semanticLight.color.surfaceRaised),
    surfaceMuted: value(salesxTokens.semanticLight.color.surfaceMuted),
    textPrimary: value(salesxTokens.semanticLight.color.textPrimary),
    textSecondary: value(salesxTokens.semanticLight.color.textSecondary),
    textMuted: value(salesxTokens.semanticLight.color.textMuted),
    border: value(salesxTokens.semanticLight.color.border),
    primary: value(salesxTokens.semanticLight.color.primary),
    focus: value(salesxTokens.semanticLight.color.focus),
  },
  dark: {
    background: value(salesxTokens.semanticDark.color.background),
    surface: value(salesxTokens.semanticDark.color.surface),
    surfaceRaised: value(salesxTokens.semanticDark.color.surfaceRaised),
    surfaceMuted: value(salesxTokens.semanticDark.color.surfaceMuted),
    textPrimary: value(salesxTokens.semanticDark.color.textPrimary),
    textSecondary: value(salesxTokens.semanticDark.color.textSecondary),
    textMuted: value(salesxTokens.semanticDark.color.textMuted),
    border: value(salesxTokens.semanticDark.color.border),
    primary: value(salesxTokens.semanticDark.color.primary),
    focus: value(salesxTokens.semanticDark.color.focus),
  },
} as const;
export type MobileThemeMode = keyof typeof mobileThemes;
