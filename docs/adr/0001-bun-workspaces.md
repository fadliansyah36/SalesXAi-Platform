# ADR 0001 — Bun Workspaces for the JavaScript Monorepo

- Status: Accepted
- Date: 2026-11-19
- Scope: Phase 00 repository bootstrap

## Context

The repository already uses Bun and has a committed root \`bun.lock\`. The Engineering Execution Master Plan describes pnpm as recommended tooling. The execution mandate requires retaining Bun and avoiding a second package manager or lockfile.

## Decision

Use Bun as the only JavaScript package manager and workspace resolver. Root workspaces are \`apps/*\` and \`packages/*\`; the existing root Next.js app remains the root workspace. Internal packages use \`workspace:*\`. Keep only the root \`bun.lock\`.

Use Turborepo for task graph/build orchestration. Turborepo is not a package manager and does not create a second lockfile.

## Consequences

- Install with \`bun install --frozen-lockfile\`.
- Add dependencies through Bun and commit the updated root \`bun.lock\`.
- Expo SDK 58 requires Node.js 22.13 or newer.
- Do not add pnpm, npm or Yarn lockfiles.
