# Repository Governance

Default code ownership is defined in `.github/CODEOWNERS`. Read root `AGENTS.md`, Master PRD, Engineering Execution Master Plan and Cross-Platform Implementation Flow before implementation. Preserve existing Web routes and UI. Use Bun and root `bun.lock` only. Keep changes scoped to the active phase. Database changes require ordered migrations applied only to Supabase ref `eyofuiyxalbehbqoaeny`, with RLS/grants/Realtime review and evidence. Never commit secrets. Distinguish implemented, migrated, integrated and deployed. No staging, field-test or Product Owner Acceptance gate. AI and Telegram remain reserved for Phases 11 and 12.

Python services target Python 3.12+, isolate runtime dependencies per service, validate environment configuration, and use Ruff-compatible linting and strict mypy settings from root `pyproject.toml`.
