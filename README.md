# SalesX-Ai Platform

Multi-portal sales, distribution and field-operations platform with a native React Native Expo Sales application.

## Canonical documents
- [Master PRD](Docs/SalesX-Ai_Master_PRD_v1.0.md)
- [Engineering Execution Master Plan](Docs/SalesX-Ai_Engineering_Execution_Master_Plan_v1.0.md)
- [Cross-Platform Implementation Flow](Docs/SalesX-Ai_Cross-Platform_Implementation_Flow_v1.0.md)
- [Repository instructions](AGENTS.md)
- [Phase evidence](docs/implementation/phase-status.md)
- [Monorepo architecture](docs/architecture/monorepo.md)
- [Deployment boundaries](docs/deployment/README.md)
- [Repository governance](docs/engineering/repository-governance.md)
- [Supabase migrations](docs/engineering/supabase-migrations.md)

## Runtime ownership
- Existing Web app: current root Next.js App Router routes and components; preserve in place.
- Native Sales: `apps/mobile-sales/`, React Native Expo.
- Business API: `services/api/`, Python FastAPI.
- Workers: independently deployable services under `services/`.
- Data: only Supabase project ref `eyofuiyxalbehbqoaeny`.
- Shared code: Bun workspaces under `packages/*`.

## Package management
Bun is the only JavaScript package manager and `bun.lock` is the only JS lockfile.
```sh
bun install --frozen-lockfile
bun run tokens:build
bun run tokens:check
bun run lint
bun run build
```

Supabase PostgreSQL owns durable business data. FastAPI owns business rules, authorization and business-critical mutations. Existing Web routes, UI hierarchy and responsive behavior are retained.
