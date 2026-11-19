# SalesX-Ai — Repository Agent & Engineering Instructions

## 1. Mission

Build and maintain SalesX-Ai as an AI-enabled sales, distribution,
field operations, location intelligence, and content platform.

The canonical product baseline is:
- `public/assets/aistudio/SalesX-Ai_Master_PRD_v1.0_95ef09b5.md`
- `public/assets/aistudio/SalesX-Ai_Engineering_Execution_Master_Plan_v1.0_e7c41694.md`

Do not silently change product scope, architecture, design language,
service boundaries, database ownership, or deployment topology.

## 2. Design System & Canonical Tokens

- Canonical tokens live in `packages/design-tokens/tokens/` and `lib/design-tokens.ts`.
- Brand identity colors:
  - Light Blue: `#ADD8E6`
  - Sky Blue: `#87CEEB`
  - Powder Blue: `#B0E0E6`
  - Primary Action: `#348CB2` / Deep Navy-Teal `#194F70` / `#123A54`
- Light theme is default; dark theme is supported via `.dark` semantic variables.
- Use tabular numerals (`tabular-nums`) for all financial figures, metrics, and timestamps.

## 3. Application Portals

- `/` — Public Website (`components/landing/`)
- `/portal` — Sales Portal (`components/portal/`)
- `/company` — Company Portal (`components/company/`)
- `/customer` — Customer Portal (`components/customer/`)
- `/distributor` — Distributor Portal (`components/distributor/`)
- `/principal` — Principal Portal (`components/principal/`)
- `/supervisor` — Supervisor Portal (`components/supervisor/`)
- `/super-admin` — Super Admin Portal (`components/super-admin/`)

## 4. Integrations & Compliance

- **Google Maps Platform**: Use `@vis.gl/react-google-maps` with `internalUsageAttributionIds={['gmp_mcp_codeassist_v1_aistudio']}` and server-side Places API proxy `/api/maps/places-search`.
- **Google Workspace**: Client-side Firebase OAuth (`lib/firebase-workspace.ts`) with in-memory token caching and explicit confirmation dialogs before mutating Gmail/Calendar/Meet data.
- **Gemini AI**: Server-side only via `/api/gemini/*` (`lib/gemini-server.ts`). Business metrics and pricing remain deterministic.
