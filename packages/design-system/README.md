# SalesX-Ai Shared Design System

Shared Web design foundation with theme state and responsive semantic primitives.

## Public API
- `ThemeProvider`, `useTheme`: light/dark theme state; light is default and browser preference is stored locally.
- `ThemeToggle`: keyboard-accessible 44px control.
- `PageShell`, `Stack`, `Inline`, `Surface`: responsive layout primitives using canonical semantic variables.
- `styles.css`: focus, responsive and reduced-motion primitives.

The existing root Next.js app resolves this package through TypeScript workspace paths. Native clients consume generated tokens from `@salesx-ai/design-tokens/native` and the adapter under `apps/mobile-sales/src/theme`. Static theme state does not create Supabase tables, APIs or Realtime channels.

## Native exports

Import from `@salesx-ai/design-system/native`: `NativeThemeProvider`, `useNativeTheme`, `useNativeBreakpoint`, `NativePageShell`, `NativeStack`, `NativeInline`, `NativeSurface`, `NativeText`, `NativeButton`, and `NativeThemeToggle`. Native semantic colors and typography/spacing/radius/elevation/motion/breakpoints derive from generated canonical tokens. The host app bundles Plus Jakarta Sans and JetBrains Mono font assets. The Web entrypoint does not import React Native modules.
