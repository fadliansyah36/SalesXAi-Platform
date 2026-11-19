# SalesX-Ai Mobile Sales

Runnable React Native application using Expo SDK 58, React Native 0.88 and React 19.3. It is a first-class Bun workspace at `apps/mobile-sales/`.

## Run

From repository root: `bun install --frozen-lockfile` then `bun run mobile:start` (or `mobile:android` / `mobile:ios`). Node.js 22.13+ is required by Expo SDK 58.

## Engineering checks

From this directory run `bun run typecheck`, `bun run check-deps`, `bun run config`, `bun run export:android`, `bun run export:ios`, and `bun run verify-start`.

## Native design system

The app imports `@salesx-ai/design-system/native`, which reads the generated `@salesx-ai/design-tokens/native` export. The same canonical JSON files generate Web CSS and Native TypeScript. Do not duplicate token values in this app.

The Native foundation includes semantic light/dark colors, Plus Jakarta Sans and JetBrains Mono font assets, typography scales, spacing, radius, elevation adapters, motion durations/easing and responsive breakpoints. Theme defaults to light and can be toggled through an accessible control.

Authentication, secure session storage, API client, offline outbox, GPS and business feature modules remain in their assigned domain phases.
