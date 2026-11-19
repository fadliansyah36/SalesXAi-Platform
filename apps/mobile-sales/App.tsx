import React from 'react';
import { ScrollView, StatusBar, View } from 'react-native';
import { useFonts } from 'expo-font';
import { PlusJakartaSans_400Regular, PlusJakartaSans_500Medium, PlusJakartaSans_600SemiBold, PlusJakartaSans_700Bold } from '@expo-google-fonts/plus-jakarta-sans';
import { JetBrainsMono_400Regular, JetBrainsMono_500Medium, JetBrainsMono_600SemiBold } from '@expo-google-fonts/jetbrains-mono';
import { NativeInline, NativePageShell, NativeStack, NativeSurface, NativeText, NativeThemeProvider, NativeThemeToggle, useNativeTheme } from '@salesx-ai/design-system/native';

function SalesHome() {
  const { colors, theme } = useNativeTheme();
  return <>
    <StatusBar barStyle={theme === 'dark' ? 'light-content' : 'dark-content'} backgroundColor={colors.background} />
    <NativePageShell>
      <ScrollView contentContainerStyle={{ flexGrow: 1, paddingBottom: 32 }} showsVerticalScrollIndicator={false}>
        <NativeStack gap="6">
          <NativeInline gap="3" style={{ justifyContent: 'space-between' }}>
            <NativeStack gap="0">
              <NativeText variant="title" weight="bold">SalesX-Ai</NativeText>
              <NativeText variant="caption" color={colors.textSecondary}>MOBILE SALES PLATFORM</NativeText>
            </NativeStack>
            <NativeThemeToggle />
          </NativeInline>
          <NativeSurface elevation="sm" radius="2xl" style={{ padding: 24 }}>
            <NativeStack gap="4">
              <NativeText variant="caption" weight="bold" color={colors.primary}>FIELD OPERATIONS</NativeText>
              <NativeText variant="heading" weight="bold">Satu ekosistem untuk tim penjualan.</NativeText>
              <NativeText color={colors.textSecondary}>Aplikasi native SalesX-Ai menghubungkan aktivitas lapangan, outlet, pemesanan, dan operasional distribusi.</NativeText>
              <NativeInline gap="2">
                <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: colors.primary }} />
                <NativeText variant="caption" color={colors.textSecondary}>Native design system aktif</NativeText>
              </NativeInline>
            </NativeStack>
          </NativeSurface>
          <NativeStack gap="3">
            <NativeText variant="title" weight="semibold">Fondasi aplikasi</NativeText>
            <NativeSurface elevation="none" radius="lg">
              <NativeStack gap="2">
                <NativeText weight="semibold">Satu sumber design token</NativeText>
                <NativeText color={colors.textSecondary}>Warna, tipografi, spacing, radius, elevation, motion, dan breakpoint berasal dari packages/design-tokens.</NativeText>
              </NativeStack>
            </NativeSurface>
            <NativeSurface elevation="none" radius="lg">
              <NativeStack gap="2">
                <NativeText weight="semibold">Theme light dan dark</NativeText>
                <NativeText color={colors.textSecondary}>Tema dapat diganti melalui kontrol aksesibel pada header aplikasi.</NativeText>
              </NativeStack>
            </NativeSurface>
          </NativeStack>
        </NativeStack>
      </ScrollView>
    </NativePageShell>
  </>;
}
export default function App() {
  const [fontsLoaded] = useFonts({ PlusJakartaSans_400Regular, PlusJakartaSans_500Medium, PlusJakartaSans_600SemiBold, PlusJakartaSans_700Bold, JetBrainsMono_400Regular, JetBrainsMono_500Medium, JetBrainsMono_600SemiBold });
  if (!fontsLoaded) return null;
  return <NativeThemeProvider><SalesHome /></NativeThemeProvider>;
}
