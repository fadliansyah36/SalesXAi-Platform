# Monorepo Architecture

- Root `app/`, `components/`, `hooks/`, `lib/`: existing Next.js Web application; preserved in place.
- `apps/mobile-sales/`: React Native Expo boundary and native design-token adapter.
- `services/`: FastAPI business API and independent workers.
- `packages/`: Bun workspaces for shared code, including canonical design tokens and design system.
- `supabase/migrations/`: ordered database source of truth.
- `Docs/`: canonical product and engineering specifications; `docs/`: operational documentation.

Web and Expo consume shared contracts/packages. Apps do not import each other's private source. FastAPI owns business rules and authorization. Supabase PostgreSQL owns durable data. Workers process durable jobs; Realtime is a scoped delivery mechanism, not data authority.

Bun is the sole JS package manager; root `bun.lock` is the only lockfile. Bun workspaces cover `packages/*`; root Next.js remains the root workspace. Python services target Python 3.12+, keep dependencies per service, and follow Ruff/mypy configuration in root `pyproject.toml`.
