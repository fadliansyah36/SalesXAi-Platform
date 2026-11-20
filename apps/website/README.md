# @salesx-ai/website

Independent Next.js workspace for the SalesX-Ai @salesx-ai/website portal. Its source tree, route handlers, layout, permissions and build target remain separate from the other portal workspaces. Shared UI primitives and canonical domain components remain in their existing shared packages/root modules; no portal source is copied into another app.

## Local development and independent build

Run from repository root:

- `bun install --frozen-lockfile`
- `bun run --filter @salesx-ai/website dev`
- `bun run --filter @salesx-ai/website build`
- `bun run --filter @salesx-ai/website start`

## Production routing

This workspace is built independently and included in the Website + Sales Railway service bundle. Its production route prefix is `/`; the group gateway routes the complete request (including Next.js assets, API routes, cookies and deep links) to this app's own standalone Next.js server. Railway keeps the repository root as build context for the shared Bun lockfile and workspace packages.
