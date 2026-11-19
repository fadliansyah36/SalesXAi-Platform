# SalesX-Ai Platform

Multi-portal sales, distribution and field-operations platform with a first-class native React Native Expo Sales application.

## Canonical documents
- [Master PRD](Docs/SalesX-Ai_Master_PRD_v1.0.md)
- [Engineering Execution Master Plan](Docs/SalesX-Ai_Engineering_Execution_Master_Plan_v1.0.md)
- [Cross-Platform Implementation Flow](Docs/SalesX-Ai_Cross-Platform_Implementation_Flow_v1.0.md)
- [Repository instructions](AGENTS.md)
- [Phase evidence](docs/implementation/phase-status.md)
- [Monorepo architecture](docs/architecture/monorepo.md)
- [Deployment boundaries](docs/deployment/README.md)
- [Repository governance](docs/engineering/repository-governance.md)
- [Bun workspace decision](docs/adr/0001-bun-workspaces.md)

## Runtime ownership
- Existing Web app: root Next.js App Router routes and components; preserve in place.
- Native Sales: \`apps/mobile-sales/\`, Expo SDK 58 / React Native.
- Business API: \`services/api/\`, Python FastAPI.
- Workers: independently deployable services under \`services/\`.
- Data: only Supabase project ref \`eyofuiyxalbehbqoaeny\`.
- Shared packages: \`packages/*\`; Web and Expo consume the same canonical token package.

## Canonical JavaScript toolchain
Bun is the only JavaScript package manager. The root \`bun.lock\` is the only lockfile. Root workspaces include \`apps/*\` and \`packages/*\`. Node.js 22.13+ is required for Expo SDK 58.

\`\`\`sh
bun install --frozen-lockfile
bun run tokens:build
bun run tokens:check
bun run lint
bun run typecheck
bun run build
bun run mobile:typecheck
bun run mobile:check-deps
bun run mobile:config
bun run mobile:verify-start
bun run mobile:export:android
bun run mobile:export:ios
\`\`\`

Use \`bun run build:all\` for Turborepo orchestration and \`bun run mobile:start\` for native development.

Supabase PostgreSQL owns durable business data. FastAPI owns business rules, authorization and business-critical mutations. Existing Web routes, UI hierarchy and responsive behavior are preserved.
