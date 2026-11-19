# SalesX-Ai

SalesX-Ai is a multi-portal sales, distribution and field-operations platform with a native React Native Expo Sales application.

## Architecture

- Existing Web product: Next.js App Router in the current repository structure.
- Native Sales: `apps/mobile-sales/` (React Native + Expo; Android/iOS).
- Business API: Python FastAPI under `services/api/`.
- Primary data platform: the bound Supabase project `eyofuiyxalbehbqoaeny`.
- Shared contracts and packages: `packages/`.
- Canonical product and engineering documents: `Docs/`.

## Source of truth

Supabase PostgreSQL owns durable business data. FastAPI owns business rules, authorization and business-critical mutations. Web and native clients consume versioned API contracts; local mobile storage is limited to cache and offline outbox.

## Existing application preservation

The existing Next.js routes, components, design and visual behavior are retained. Do not move or redesign the current UI as part of repository bootstrap.

## Engineering entry points

- [Master PRD](Docs/SalesX-Ai_Master_PRD_v1.0.md)
- [Engineering Execution Plan](Docs/SalesX-Ai_Engineering_Execution_Master_Plan_v1.0.md)
- [Cross-Platform Implementation Flow](Docs/SalesX-Ai_Cross-Platform_Implementation_Flow_v1.0.md)
- [Repository instructions](AGENTS.md)
- [Phase status](docs/implementation/phase-status.md)

## Current repository reality

This repository currently uses a Bun lockfile and an existing root Next.js application. Workspace/tooling changes must preserve that working application and must not introduce a second lockfile/package-manager authority without an explicit migration plan.
