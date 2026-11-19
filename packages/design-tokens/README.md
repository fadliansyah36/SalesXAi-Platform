# SalesX-Ai Canonical Design Tokens

This package is the single visual-token source for existing Web portals and the React Native Expo Sales application.

## Canonical sources

Edit only JSON files in `tokens/`:
- primitives and brand colors;
- semantic light and dark colors;
- typography, spacing, radius, elevation, motion and breakpoints.

Brand identity colors remain:
- Light Blue: `#ADD8E6`
- Powder Blue: `#B0E0E6`
- Sky Blue: `#87CEEB`

## Generate

Run from this directory:

```sh
bun run build
# or
node ./scripts/build-tokens.mjs
```

The generator uses Node.js built-ins only and writes:
- `generated/web.css`
- `generated/native.ts`

Generated files must never be edited manually. Web and native consumers must import these outputs rather than creating independent token values. Semantic aliases are resolved by the generator and unresolved/circular references fail generation.

## Integration

- Web: import `@salesx-ai/design-tokens/web.css` from the existing application stylesheet when wiring the shared package.
- Expo: import `salesxTokens` from `@salesx-ai/design-tokens/native`.

No Supabase schema is needed for static design tokens. Persisted tenant/user theme preferences, if later approved, belong to the Identity/settings phase and require an API, migration and RLS.
