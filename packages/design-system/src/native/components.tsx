import React from 'react';
import { Platform, Pressable, Text, View, type PressableProps, type StyleProp, type TextStyle, type ViewProps, type ViewStyle } from 'react-native';
import { useNativeTheme } from './NativeThemeProvider';

type SpacingKey = keyof ReturnType<typeof useNativeTheme>['tokens']['spacing'];
type RadiusKey = keyof ReturnType<typeof useNativeTheme>['tokens']['radius'];
type ElevationKey = keyof ReturnType<typeof useNativeTheme>['tokens']['elevation'];

export function NativePageShell({ style, ...props }: ViewProps) {
  const { colors, tokens } = useNativeTheme();
  return <View {...props} style={[{ flex: 1, width: '100%', maxWidth: tokens.breakpoints.xl, alignSelf: 'center', paddingHorizontal: tokens.spacing[4], paddingVertical: tokens.spacing[4], backgroundColor: colors.background }, style]} />;
}
export function NativeStack({ gap = '4', style, ...props }: ViewProps & { gap?: SpacingKey }) {
  const { tokens } = useNativeTheme();
  return <View {...props} style={[{ flexDirection: 'column', gap: tokens.spacing[gap], minWidth: 0 }, style]} />;
}
export function NativeInline({ gap = '3', style, ...props }: ViewProps & { gap?: SpacingKey }) {
  const { tokens } = useNativeTheme();
  return <View {...props} style={[{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: tokens.spacing[gap], minWidth: 0 }, style]} />;
}
function nativeShadow(shadow: string): ViewStyle {
  const match = shadow.match(/(-?\d+)px\s+(-?\d+)px\s+(\d+)px\s+rgba\((\d+),\s*(\d+),\s*(\d+),\s*([\d.]+)\)/);
  if (!match) return {};
  const [, x, y, blur, red, green, blue, opacity] = match;
  return Platform.select({
    ios: { shadowColor: 'rgb(' + red + ', ' + green + ', ' + blue + ')', shadowOffset: { width: Number(x), height: Number(y) }, shadowOpacity: Number(opacity), shadowRadius: Number(blur) / 2 },
    android: { elevation: Math.max(1, Math.ceil(Number(blur) / 3)) },
    default: {},
  }) ?? {};
}
export function NativeSurface({ elevation = 'sm', radius = 'lg', style, ...props }: ViewProps & { elevation?: ElevationKey | 'none'; radius?: RadiusKey }) {
  const { colors, tokens } = useNativeTheme();
  const shadow = elevation === 'none' ? {} : nativeShadow(tokens.elevation[elevation]);
  return <View {...props} style={[{ backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1, borderRadius: tokens.radius[radius], padding: tokens.spacing[4] }, shadow, style]} />;
}
type NativeTextVariant = 'display' | 'heading' | 'title' | 'body' | 'caption';
type NativeTextWeight = 'regular' | 'medium' | 'semibold' | 'bold';
const variantSize: Record<NativeTextVariant, string> = { display: 'display2xl', heading: 'headingLg', title: 'titleLg', body: 'bodyMd', caption: 'caption' };
const fontFace = (mono: boolean, weight: NativeTextWeight) => {
  if (mono) return weight === 'semibold' ? 'JetBrainsMono_600SemiBold' : weight === 'medium' ? 'JetBrainsMono_500Medium' : 'JetBrainsMono_400Regular';
  return weight === 'bold' ? 'PlusJakartaSans_700Bold' : weight === 'semibold' ? 'PlusJakartaSans_600SemiBold' : weight === 'medium' ? 'PlusJakartaSans_500Medium' : 'PlusJakartaSans_400Regular';
};
export function NativeText({ variant = 'body', weight = 'regular', mono = false, color, style, ...props }: React.ComponentProps<typeof Text> & { variant?: NativeTextVariant; weight?: NativeTextWeight; mono?: boolean; color?: string }) {
  const { colors, tokens } = useNativeTheme();
  const size = tokens.fontSize[variantSize[variant]];
  const lineHeight = size * (variant === 'caption' ? tokens.lineHeight.normal : tokens.lineHeight.relaxed);
  return <Text {...props} style={[{ color: color ?? colors.textPrimary, fontFamily: fontFace(mono, weight), fontSize: size, lineHeight, includeFontPadding: false } as TextStyle, style]} />;
}
type NativeButtonProps = Omit<PressableProps, 'style'> & { children: React.ReactNode; style?: StyleProp<ViewStyle> };
export function NativeButton({ children, style, disabled, ...props }: NativeButtonProps) {
  const { colors, tokens } = useNativeTheme();
  return <Pressable {...props} disabled={disabled} accessibilityRole="button" accessibilityState={{ disabled }} style={[{ minHeight: 44, minWidth: 44, paddingHorizontal: tokens.spacing[4], paddingVertical: tokens.spacing[3], alignItems: 'center', justifyContent: 'center', borderRadius: tokens.radius.md, borderWidth: 1, borderColor: colors.borderStrong, backgroundColor: colors.surface, opacity: disabled ? 0.5 : 1 }, style]}>{children}</Pressable>;
}
export function NativeThemeToggle() {
  const { theme, toggleTheme, colors } = useNativeTheme();
  const next = theme === 'light' ? 'dark' : 'light';
  return <NativeButton onPress={toggleTheme} accessibilityLabel={'Switch to ' + next + ' theme'} accessibilityHint="Changes the app appearance">
    <Text style={{ color: colors.textPrimary, fontSize: 18 }} accessible={false}>{theme === 'light' ? '☾' : '☀'}</Text>
  </NativeButton>;
}
