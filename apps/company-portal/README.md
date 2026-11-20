# @salesx-ai/company-portal

Independently deployable Next.js portal using the canonical SalesX-Ai UI routes and shared workspace packages. The existing page and component source remains in the repository's shared root to avoid UI duplication.

Run from repository root:

- `bun install --frozen-lockfile`
- `bun run --filter @salesx-ai/company-portal dev`
- `bun run --filter @salesx-ai/company-portal build`
- `bun run --filter @salesx-ai/company-portal start`

Railway must retain the repository root as its build context so the root Bun lockfile and shared packages remain resolvable; this app is the selected build/runtime target.
