# SalesX-Ai Canonical Design Tokens

This package is the single visual-token source for existing Web portals and the React Native Expo Sales app.

Edit only the nine JSON files declared by \`tokens/index.json\`: color primitives, semantic light/dark, typography, spacing/layout, radius, elevation, motion and breakpoints.

Brand identity: Light Blue \`#ADD8E6\`, Powder Blue \`#B0E0E6\`, Sky Blue \`#87CEEB\`.

## Generate and verify

\`\`\`sh
bun run tokens:build
bun run tokens:check
\`\`\`

The Node.js generator validates the source manifest, semantic roles, brand values, token groups, references and duplicate CSS variable names. It writes \`generated/web.css\`, \`generated/native.ts\`, and \`generated/tokens.d.ts\`. Generated files must never be edited manually.

Web imports generated CSS in \`app/globals.css\`. Native imports \`@salesx-ai/design-tokens/native\` through the shared Native design system. Static tokens do not require a Supabase migration or Realtime.
