# SalesX-Ai --- Engineering Execution Master Plan

## AGENTS.md, Canonical Design Tokens, Application & Service Backlog, dan Phase Implementation

  Metadata        Value
  --------------- -----------------------------------
  Product         **SalesX-Ai**
  Baseline        `SalesX-Ai_Master_PRD_v1.0.md`
  Dokumen         Engineering Execution Master Plan
  Versi           1.0
  Status          Baseline implementasi repository
  Repository      Single GitHub Monorepo
  Web             Next.js, React, TypeScript, PWA
  Mobile          React Native Expo
  Backend         Python FastAPI
  Database        Supabase PostgreSQL
  Realtime        Supabase Realtime
  Spatial         PostGIS
  Vector          pgvector
  AI & Telegram   Ditempatkan pada phase akhir
  Format          Markdown

------------------------------------------------------------------------

# 1. Mandat Dokumen

Dokumen ini menurunkan `SalesX-Ai_Master_PRD_v1.0.md` menjadi pedoman
eksekusi repository yang mencakup:

1.  `AGENTS.md` sebagai instruksi engineering lintas repository.
2.  Canonical Design Token JSON sebagai satu-satunya sumber token
    visual.
3.  Struktur monorepo dan ownership setiap aplikasi/service.
4.  Implementation backlog per aplikasi dan service.
5.  Urutan phase implementasi.
6.  Database migration dan Supabase Realtime pada setiap phase.
7.  Aturan deployment independen per aplikasi/service.
8.  Aturan integrasi, keamanan, dan bukti implementasi.

**Master PRD v1.0 tetap menjadi baseline product.** Dokumen ini tidak
mengubah visi, modul bisnis, atau keputusan arsitektur utamanya. Dokumen
ini menjabarkan urutan dan cara implementasinya.

## 1.1 Instruksi ruang lingkup yang berlaku

Untuk execution plan ini:

-   Tidak ada tahapan *Product Owner Acceptance*.
-   Tidak ada pengujian nyata / real-world testing sebagai prasyarat
    phase.
-   Tidak ada staging environment atau staging deployment.
-   Tidak ada proses pemeriksaan lisensi sebagai gate implementasi
    fitur.
-   Tidak ada deployment staging.
-   AI Platform, AI Agents, AI Sales Intelligence, AI Content
    Generation, Telegram Bot, dan proactive Telegram ditempatkan pada
    phase akhir.
-   Setiap phase wajib memiliki pekerjaan database migration ke
    Supabase.
-   Setiap phase wajib meninjau kebutuhan Supabase Realtime:
    publication, private channel, broadcast, authorization, dan event
    delivery sesuai kebutuhan domain.
-   Setiap phase harus meninggalkan database dalam keadaan kompatibel
    dengan aplikasi/service yang telah diimplementasikan.
-   Deployment dilakukan ke target environment yang ditentukan, dengan
    perubahan terkontrol dan rollback plan. Tidak ada kewajiban staging.
-   Pemeriksaan statis, validasi konfigurasi, type checking, lint,
    build, schema consistency, migration review, dan pemeriksaan kontrak
    dapat digunakan sebagai kontrol engineering. Dokumen ini tidak
    menetapkan real-world testing atau staging sebagai acceptance gate.

> Catatan: menghilangkan real-world testing dan staging tidak berarti
> menghilangkan keamanan perubahan. Gunakan migration yang
> backward-compatible, backup/restore policy, deployment bertahap per
> service bila tersedia, observability, dan rollback plan. Jangan
> menyebut fitur telah terbukti pada kondisi lapangan jika memang tidak
> dilakukan pengujian lapangan.

## 1.2 Arti "database migration ke Supabase secara realtime" pada setiap phase

Setiap phase wajib menjalankan siklus database berikut:

1.  Definisikan perubahan schema yang dibutuhkan phase.
2.  Buat migration SQL yang version-controlled di
    `supabase/migrations/`.
3.  Terapkan migration ke Supabase target yang ditentukan.
4.  Pastikan objek database yang dibutuhkan tersedia.
5.  Terapkan grants, RLS, indexes, constraints, functions, triggers, dan
    policies yang relevan.
6.  Jika data perlu disinkronkan, gunakan backfill atau data migration
    yang idempotent.
7.  Daftarkan tabel/event yang memang membutuhkan realtime delivery.
8.  Gunakan Supabase Realtime Broadcast untuk event
    sensitif/high-frequency bila sesuai; gunakan Postgres Changes hanya
    untuk kebutuhan yang tepat.
9.  Atur private channel authorization dan tenant/role scope.
10. Simpan migration ID, commit SHA, target Supabase project, waktu
    penerapan, dan hasil pemeriksaan schema.

**Realtime bukan berarti semua tabel harus disiarkan ke semua client.**
Realtime harus selektif, private, tenant-scoped, dan sesuai kebutuhan
produk. Untuk data yang tidak memerlukan push, gunakan API/query biasa.

## 1.3 Batasan eksekusi Supabase

-   Jangan membuat Supabase project atau database baru jika target
    project sudah ditetapkan.
-   Jangan mengubah data produksi secara destruktif tanpa migration dan
    rencana pemulihan.
-   Jangan menaruh `service_role` key di web/mobile.
-   FastAPI menjadi jalur utama business mutation.
-   Supabase Auth, PostgreSQL, Storage, Realtime, PostGIS, dan pgvector
    digunakan sesuai kebutuhan.
-   Migration adalah sumber kebenaran schema, bukan perubahan manual
    dashboard yang tidak tercatat.
-   Setiap phase tetap harus menyiapkan migration meskipun migration
    tersebut hanya menambahkan policy, index, enum, function, trigger,
    atau publication configuration.

------------------------------------------------------------------------

# 2. Repository Baseline

## 2.1 Repository identity

``` text
Repository: salesx-ai
Default branch: main
Architecture: Domain-oriented monorepo
Web runtime: Next.js
Mobile runtime: Expo
Backend runtime: FastAPI
Data platform: Supabase
```

## 2.2 Canonical repository structure

``` text
salesx-ai/
├── AGENTS.md
├── README.md
├── package.json
├── pnpm-workspace.yaml
├── pnpm-lock.yaml
├── turbo.json
├── pyproject.toml
├── .nvmrc
├── .editorconfig
├── .gitignore
│
├── apps/
│   ├── website/
│   ├── customer-portal/
│   ├── company-portal/
│   ├── sales-portal/
│   ├── distributor-portal/
│   ├── principal-portal/
│   ├── supervisor-portal/
│   ├── super-admin/
│   └── mobile-sales/
│
├── services/
│   ├── api/
│   ├── location-worker/
│   ├── notification-worker/
│   ├── analytics-worker/
│   ├── ai-worker/
│   ├── telegram-service/
│   └── remotion-renderer/
│
├── packages/
│   ├── design-tokens/
│   ├── design-system/
│   ├── shared-types/
│   ├── api-contracts/
│   ├── api-client/
│   ├── event-contracts/
│   ├── auth-client/
│   ├── permissions/
│   ├── validation/
│   ├── maps/
│   ├── ai-contracts/
│   ├── content-contracts/
│   └── config/
│
├── supabase/
│   ├── config.toml
│   ├── migrations/
│   ├── seed/
│   ├── functions/
│   └── tests/
│
├── infrastructure/
│   ├── docker/
│   ├── deployment/
│   ├── environments/
│   ├── monitoring/
│   ├── scripts/
│   └── backup/
│
├── .github/
│   ├── workflows/
│   ├── CODEOWNERS
│   └── PULL_REQUEST_TEMPLATE.md
│
└── docs/
    ├── master-prd/
    ├── architecture/
    ├── design-system/
    ├── api/
    ├── database/
    ├── security/
    ├── implementation/
    ├── deployment/
    ├── operations/
    └── adr/
```

## 2.3 Deployment boundary

Setiap folder dalam `apps/*` dan `services/*` merupakan unit
build/deployment mandiri.

  --------------------------------------------------------------------------------------
  Unit              Root directory                   Runtime           Deployment unit
  ----------------- -------------------------------- ----------------- -----------------
  Website           `apps/website`                   Next.js           Independent

  Customer          `apps/customer-portal`           Next.js           Independent

  Company           `apps/company-portal`            Next.js           Independent

  Sales             `apps/sales-portal`              Next.js           Independent

  Distributor       `apps/distributor-portal`        Next.js           Independent

  Principal         `apps/principal-portal`          Next.js           Independent

  Supervisor        `apps/supervisor-portal`         Next.js           Independent

  Super Admin       `apps/super-admin`               Next.js           Independent

  Sales Mobile      `apps/mobile-sales`              Expo              Independent
                                                                       mobile release

  API               `services/api`                   FastAPI           Independent

  Location Worker   `services/location-worker`       Python            Independent

  Notification      `services/notification-worker`   Python            Independent
  Worker                                                               

  Analytics Worker  `services/analytics-worker`      Python            Independent

  AI Worker         `services/ai-worker`             Python            Independent

  Telegram Service  `services/telegram-service`      Python            Independent

  Remotion Renderer `services/remotion-renderer`     Node.js           Independent
  --------------------------------------------------------------------------------------

Aplikasi boleh berbagi package, tetapi tidak boleh mengimpor source
internal aplikasi lain.

------------------------------------------------------------------------

# 3. AGENTS.md --- Repository Engineering Instructions

Bagian ini merupakan isi canonical untuk file root `AGENTS.md`.

## 3.1 AGENTS.md

``` md
# SalesX-Ai — Repository Agent & Engineering Instructions

## 1. Mission

Build and maintain SalesX-Ai as an AI-enabled sales, distribution,
field operations, location intelligence, and content platform.

The canonical product baseline is:
- docs/master-prd/SalesX-Ai_Master_PRD_v1.0.md
- docs/implementation/SALESX_AI_EXECUTION_MASTER_PLAN.md

Do not silently change product scope, architecture, design language,
service boundaries, database ownership, or deployment topology.

## 2. Architecture

- Use one GitHub monorepo.
- Keep every portal under its own apps/<app-name> directory.
- Keep every backend/worker under services/<service-name>.
- Keep reusable code under packages/.
- Web portals use Next.js, React, TypeScript, and PWA capabilities.
- Mobile uses React Native Expo.
- Backend uses Python FastAPI.
- Supabase PostgreSQL is the primary business data platform.
- Supabase Auth is the identity provider.
- Supabase Storage stores private business files and media.
- Supabase Realtime delivers authorized live updates.
- PostGIS supports geospatial data.
- pgvector supports vector retrieval when required.
- Remotion rendering runs in its own Node.js service.

## 3. Independent Applications

Each app/service must own:
- package/dependency configuration;
- runtime entrypoint;
- environment variable schema;
- build command;
- start command;
- health check where applicable;
- deployment configuration;
- README;
- logs and operational metadata.

Never import an app's internal source from another app.
Shared behavior belongs in a package with a clear public API.

## 4. Backend Ownership

FastAPI owns:
- business rules;
- authorization;
- tenant scope;
- data validation;
- order and pricing rules;
- inventory rules;
- reward ledger rules;
- location ingestion;
- AI tool execution authorization;
- Telegram account linking;
- content job lifecycle;
- audit logging.

Frontend applications must not bypass FastAPI to mutate business-critical data.
Supabase client usage on frontend is limited to approved identity/session flows
and explicitly authorized read/realtime use cases. Do not use frontend database
access to bypass domain services or authorization.

## 5. Database Rules

- All schema changes must be represented by SQL migrations.
- Store migrations in supabase/migrations/.
- Never rely on undocumented manual dashboard schema edits.
- Preserve tenant ownership and referential integrity.
- Enable RLS on exposed tables.
- Apply least-privilege grants and policies.
- Keep service-role credentials server-side only.
- Use indexes for actual query patterns.
- Use PostGIS for spatial columns and indexes.
- Use pgvector only where semantic retrieval is required.
- Use private Storage buckets for sensitive business content.
- Make data migrations repeatable/idempotent where practical.
- Prefer backward-compatible expand/migrate/contract changes.

## 6. Mandatory Supabase Work in Every Phase

Every implementation phase must include:
1. Database impact analysis.
2. Versioned migration SQL, including policy/index/function/trigger changes.
3. Supabase migration application to the designated target.
4. RLS and grants review for affected objects.
5. Realtime impact decision.
6. Private Broadcast / Postgres Changes configuration where needed.
7. Tenant and role authorization for realtime channels.
8. Migration evidence: migration filename, commit SHA, target project, applied status.

Do not broadcast every database table by default.
Realtime subscriptions must be private and limited to required events/data.

## 7. Realtime Rules

- Prefer private Supabase Realtime Broadcast for high-frequency updates.
- Use Postgres Changes only where its trade-offs are appropriate.
- Never expose another tenant's events.
- Validate channel membership and resource access.
- Avoid broadcasting secrets, credentials, raw sensitive data, or unnecessary PII.
- Include tenant scope and correlation identifiers in server-generated events.
- Unsubscribe on screen exit and handle reconnect/replay where required.

## 8. Design System

- Canonical tokens live in packages/design-tokens/tokens/.
- Do not hardcode brand colors where tokens exist.
- Brand identity colors:
  - Light Blue: #ADD8E6
  - Sky Blue: #87CEEB
  - Powder Blue: #B0E0E6
- Light theme is default; dark theme is supported.
- Use semantic tokens for UI roles.
- Check contrast for text and controls.
- Maintain responsive behavior and accessible focus states.
- Do not introduce unrelated gradients, visual styles, or inconsistent radii.

## 9. Frontend Rules

- TypeScript strict mode.
- Feature-oriented folder structure.
- Keep components focused and reusable.
- Use typed API clients generated from or aligned with OpenAPI contracts.
- Provide loading, empty, error, disabled, and success states.
- Keep server state separate from local UI state.
- Avoid duplicated business rules in the client.
- Never put secrets in browser bundles.
- Mobile layouts must respect safe areas and touch target sizing.

## 10. Mobile GPS Rules

- Use Expo Location and TaskManager for approved location capture.
- Register background task at module scope.
- Explain location use and request permissions transparently.
- Track only under the configured work/session policy.
- Support offline buffering and idempotent batch upload.
- Record accuracy, recorded_at, received_at, and session ownership.
- Stop tracking when the work session/policy ends.
- Never claim uninterrupted GPS delivery on every OS/device.
- Do not attempt to silently retrieve a user's personal Google Maps Timeline.

## 11. AI Rules

AI features are implemented only in the designated final AI phases.
Use one Unified AI Orchestrator, Model Router, Memory Coordinator,
Agent Registry, Skill Registry, and Tool Gateway.

- LLM output is untrusted.
- Every tool call must validate schema, identity, tenant, permission,
  resource scope, idempotency, timeout, and audit.
- The model must not receive database credentials.
- Business facts must come from authorized application data.
- AI must not invent prices, stock, discounts, orders, reward balances,
  or performance metrics.
- High-impact actions require deterministic policy and/or approval.
- AI responses should disclose missing data and relevant source period.

## 12. Telegram Rules

Telegram is a communication channel, not the source of truth.
- Link accounts using one-time, expiring tokens.
- Use Telegram numeric user ID as external identity.
- Verify webhook secret.
- Deduplicate Telegram update IDs.
- Enforce tenant and role permissions for every command.
- Respect quiet hours, opt-out, frequency limits, and preferences.
- Do not send sensitive tenant data to unauthorized groups.
- Store bot token only in server-side secrets.

## 13. Remotion Rules

- Remotion preview and rendering are separate concerns.
- Run final rendering in services/remotion-renderer.
- FastAPI owns project/job authorization and lifecycle.
- Use queue-based rendering with concurrency limits.
- Support idempotency, retry, cancellation, timeout, status, and output validation.
- Store final media in private Supabase Storage.
- Revalidate product price, discount, and availability before final render.
- Do not let generated content fabricate product claims.

## 14. Security

- Least privilege.
- Tenant isolation.
- RLS.
- RBAC and ABAC.
- Server-side secret management.
- Input validation.
- Rate limits.
- Audit trail.
- Webhook verification.
- Safe logging; do not log credentials or sensitive payloads.
- Do not expose service_role keys.

## 15. Phase Execution

- Follow the phase sequence in the execution master plan.
- Do not pull AI/Telegram implementation forward into early phases.
- Every phase includes Supabase migrations and realtime impact handling.
- Do not create a Product Owner Acceptance gate.
- Do not create staging environments or staging deployments.
- Do not make real-world testing a phase prerequisite.
- Do not make license review a phase gate.
- Engineering may perform static checks, schema validation, type checks,
  lint, builds, contract consistency checks, and configuration validation.
- Do not claim real-world validation if it was not performed.
- Keep changes scoped to the active phase.
- Update phase backlog and implementation evidence.

## 16. Documentation

Update relevant docs when changing:
- architecture;
- API contracts;
- database schema;
- realtime events;
- design tokens;
- deployment mapping;
- security policy;
- operational behavior.

Record major decisions in docs/adr/.

## 17. Completion Evidence

A task is complete only when:
- implementation exists in the correct app/service;
- relevant contracts are updated;
- required migrations exist and are applied to the designated Supabase target;
- RLS/grants/realtime changes are accounted for;
- configuration and deployment metadata are present;
- relevant static/build/schema checks are recorded where applicable;
- docs and backlog status are updated.

Do not mark incomplete work as complete.
```

------------------------------------------------------------------------

# 4. Canonical Design Token JSON

## 4.1 Single source of truth

Canonical token files:

``` text
packages/design-tokens/
├── tokens/
│   ├── primitives.json
│   ├── semantic-light.json
│   ├── semantic-dark.json
│   ├── typography.json
│   ├── spacing.json
│   ├── radius.json
│   ├── elevation.json
│   ├── motion.json
│   ├── breakpoints.json
│   └── index.json
├── generated/
│   ├── web.css
│   ├── native.ts
│   └── tokens.d.ts
├── scripts/
│   └── build-tokens.ts
├── package.json
└── README.md
```

**Aturan:** token primitive dan semantic disimpan sebagai JSON. File
CSS/TypeScript adalah hasil generate. Jangan mengedit file generated
secara manual.

## 4.2 `primitives.json`

``` json
{
  "$schema": "https://design-tokens.github.io/community-group/format/",
  "name": "SalesX-Ai Primitives",
  "version": "1.0.0",
  "color": {
    "brand": {
      "50": { "$type": "color", "$value": "#F3FAFC" },
      "100": { "$type": "color", "$value": "#E5F4F8" },
      "200": { "$type": "color", "$value": "#ADD8E6" },
      "300": { "$type": "color", "$value": "#B0E0E6" },
      "400": { "$type": "color", "$value": "#87CEEB" },
      "500": { "$type": "color", "$value": "#5BAFD0" },
      "600": { "$type": "color", "$value": "#348CB2" },
      "700": { "$type": "color", "$value": "#236D91" },
      "800": { "$type": "color", "$value": "#194F70" },
      "900": { "$type": "color", "$value": "#123A54" }
    },
    "neutral": {
      "0": { "$type": "color", "$value": "#FFFFFF" },
      "50": { "$type": "color", "$value": "#F8FAFC" },
      "100": { "$type": "color", "$value": "#F1F5F9" },
      "200": { "$type": "color", "$value": "#E2E8F0" },
      "300": { "$type": "color", "$value": "#CBD5E1" },
      "400": { "$type": "color", "$value": "#94A3B8" },
      "500": { "$type": "color", "$value": "#64748B" },
      "600": { "$type": "color", "$value": "#475569" },
      "700": { "$type": "color", "$value": "#334155" },
      "800": { "$type": "color", "$value": "#1E293B" },
      "900": { "$type": "color", "$value": "#0F172A" }
    },
    "success": {
      "50": { "$type": "color", "$value": "#ECFDF5" },
      "500": { "$type": "color", "$value": "#10B981" },
      "700": { "$type": "color", "$value": "#047857" }
    },
    "warning": {
      "50": { "$type": "color", "$value": "#FFFBEB" },
      "500": { "$type": "color", "$value": "#F59E0B" },
      "700": { "$type": "color", "$value": "#B45309" }
    },
    "danger": {
      "50": { "$type": "color", "$value": "#FEF2F2" },
      "500": { "$type": "color", "$value": "#EF4444" },
      "700": { "$type": "color", "$value": "#B91C1C" }
    },
    "info": {
      "50": { "$type": "color", "$value": "#EFF6FF" },
      "500": { "$type": "color", "$value": "#3B82F6" },
      "700": { "$type": "color", "$value": "#1D4ED8" }
    }
  },
  "fontFamily": {
    "sans": {
      "$type": "fontFamily",
      "$value": ["Inter", "system-ui", "-apple-system", "Segoe UI", "sans-serif"]
    }
  },
  "fontSize": {
    "caption": { "$type": "dimension", "$value": "12px" },
    "bodySm": { "$type": "dimension", "$value": "13px" },
    "bodyMd": { "$type": "dimension", "$value": "14px" },
    "bodyLg": { "$type": "dimension", "$value": "16px" },
    "titleMd": { "$type": "dimension", "$value": "16px" },
    "titleLg": { "$type": "dimension", "$value": "18px" },
    "headingSm": { "$type": "dimension", "$value": "20px" },
    "headingMd": { "$type": "dimension", "$value": "24px" },
    "headingLg": { "$type": "dimension", "$value": "28px" },
    "headingXl": { "$type": "dimension", "$value": "32px" },
    "displayXl": { "$type": "dimension", "$value": "40px" },
    "display2xl": { "$type": "dimension", "$value": "48px" }
  },
  "lineHeight": {
    "tight": { "$type": "number", "$value": 1.2 },
    "normal": { "$type": "number", "$value": 1.5 },
    "relaxed": { "$type": "number", "$value": 1.65 }
  },
  "fontWeight": {
    "regular": { "$type": "fontWeight", "$value": 400 },
    "medium": { "$type": "fontWeight", "$value": 500 },
    "semibold": { "$type": "fontWeight", "$value": 600 },
    "bold": { "$type": "fontWeight", "$value": 700 }
  },
  "spacing": {
    "0": { "$type": "dimension", "$value": "0px" },
    "1": { "$type": "dimension", "$value": "4px" },
    "2": { "$type": "dimension", "$value": "8px" },
    "3": { "$type": "dimension", "$value": "12px" },
    "4": { "$type": "dimension", "$value": "16px" },
    "5": { "$type": "dimension", "$value": "20px" },
    "6": { "$type": "dimension", "$value": "24px" },
    "8": { "$type": "dimension", "$value": "32px" },
    "10": { "$type": "dimension", "$value": "40px" },
    "12": { "$type": "dimension", "$value": "48px" },
    "16": { "$type": "dimension", "$value": "64px" },
    "20": { "$type": "dimension", "$value": "80px" },
    "24": { "$type": "dimension", "$value": "96px" }
  },
  "radius": {
    "none": { "$type": "dimension", "$value": "0px" },
    "sm": { "$type": "dimension", "$value": "4px" },
    "md": { "$type": "dimension", "$value": "8px" },
    "lg": { "$type": "dimension", "$value": "12px" },
    "xl": { "$type": "dimension", "$value": "16px" },
    "2xl": { "$type": "dimension", "$value": "20px" },
    "3xl": { "$type": "dimension", "$value": "24px" },
    "full": { "$type": "dimension", "$value": "9999px" }
  },
  "shadow": {
    "xs": { "$type": "shadow", "$value": "0 1px 2px rgba(15,23,42,0.04)" },
    "sm": { "$type": "shadow", "$value": "0 2px 8px rgba(15,23,42,0.06)" },
    "md": { "$type": "shadow", "$value": "0 8px 24px rgba(15,23,42,0.08)" },
    "lg": { "$type": "shadow", "$value": "0 16px 40px rgba(15,23,42,0.12)" }
  },
  "motion": {
    "fast": { "$type": "duration", "$value": "120ms" },
    "normal": { "$type": "duration", "$value": "200ms" },
    "slow": { "$type": "duration", "$value": "300ms" }
  },
  "breakpoint": {
    "xs": { "$type": "dimension", "$value": "360px" },
    "sm": { "$type": "dimension", "$value": "640px" },
    "md": { "$type": "dimension", "$value": "768px" },
    "lg": { "$type": "dimension", "$value": "1024px" },
    "xl": { "$type": "dimension", "$value": "1280px" },
    "2xl": { "$type": "dimension", "$value": "1536px" }
  }
}
```

## 4.3 `semantic-light.json`

``` json
{
  "name": "SalesX-Ai Semantic Light",
  "color": {
    "background": { "$type": "color", "$value": "{color.neutral.50}" },
    "surface": { "$type": "color", "$value": "{color.neutral.0}" },
    "surfaceRaised": { "$type": "color", "$value": "{color.neutral.0}" },
    "surfaceMuted": { "$type": "color", "$value": "{color.neutral.100}" },
    "textPrimary": { "$type": "color", "$value": "{color.neutral.900}" },
    "textSecondary": { "$type": "color", "$value": "{color.neutral.600}" },
    "textMuted": { "$type": "color", "$value": "{color.neutral.500}" },
    "border": { "$type": "color", "$value": "{color.neutral.200}" },
    "borderStrong": { "$type": "color", "$value": "{color.neutral.300}" },
    "primary": { "$type": "color", "$value": "{color.brand.600}" },
    "primaryHover": { "$type": "color", "$value": "{color.brand.700}" },
    "primarySubtle": { "$type": "color", "$value": "{color.brand.50}" },
    "focus": { "$type": "color", "$value": "{color.brand.600}" },
    "success": { "$type": "color", "$value": "{color.success.500}" },
    "warning": { "$type": "color", "$value": "{color.warning.500}" },
    "danger": { "$type": "color", "$value": "{color.danger.500}" },
    "info": { "$type": "color", "$value": "{color.info.500}" }
  }
}
```

## 4.4 `semantic-dark.json`

``` json
{
  "name": "SalesX-Ai Semantic Dark",
  "color": {
    "background": { "$type": "color", "$value": "#0B1220" },
    "surface": { "$type": "color", "$value": "#111C2D" },
    "surfaceRaised": { "$type": "color", "$value": "#172438" },
    "surfaceMuted": { "$type": "color", "$value": "#1A2A3F" },
    "textPrimary": { "$type": "color", "$value": "#F8FAFC" },
    "textSecondary": { "$type": "color", "$value": "#CBD5E1" },
    "textMuted": { "$type": "color", "$value": "#94A3B8" },
    "border": { "$type": "color", "$value": "#26374B" },
    "borderStrong": { "$type": "color", "$value": "#3A506A" },
    "primary": { "$type": "color", "$value": "#87CEEB" },
    "primaryHover": { "$type": "color", "$value": "#ADD8E6" },
    "primarySubtle": { "$type": "color", "$value": "#19394B" },
    "focus": { "$type": "color", "$value": "#87CEEB" },
    "success": { "$type": "color", "$value": "#34D399" },
    "warning": { "$type": "color", "$value": "#FBBF24" },
    "danger": { "$type": "color", "$value": "#F87171" },
    "info": { "$type": "color", "$value": "#60A5FA" }
  }
}
```

## 4.5 Token usage rules

-   `primitives.json` defines raw values.
-   `semantic-light.json` and `semantic-dark.json` define UI meaning.
-   Components consume semantic tokens, not raw hex values.
-   Exceptions require a documented token extension.
-   Brand identity colors remain exactly:
    -   `#ADD8E6`
    -   `#87CEEB`
    -   `#B0E0E6`
-   Do not use pale blue as body text on white.
-   Text contrast must meet WCAG AA targets.
-   Web and Native tokens must be generated from the same source.

------------------------------------------------------------------------

# 5. Application Backlog

Status convention: - `[ ]` Not started - `[~]` In progress - `[x]`
Implemented and recorded - `[!]` Blocked

No status should be marked `[x]` without implementation evidence and the
required Supabase migration record.

## 5.1 `apps/website`

### Foundation

-   [ ] Initialize independent Next.js application.
-   [ ] Configure TypeScript strict mode.
-   [ ] Configure app-specific environment schema.
-   [ ] Consume shared design tokens.
-   [ ] Consume shared design system.
-   [ ] Configure SEO metadata and sitemap.
-   [ ] Configure independent deployment root.

### Features

-   [ ] Home.
-   [ ] Product overview.
-   [ ] Product detail pages.
-   [ ] Solutions / industries.
-   [ ] Pricing / contact CTA.
-   [ ] Lead/contact form.
-   [ ] Login links to the correct portal.
-   [ ] Legal and privacy pages.
-   [ ] Support information.

### Supabase per phase

-   [ ] Create lead/contact schema migration when lead capture is
    implemented.
-   [ ] Define tenant/platform scope if leads are tenant-owned.
-   [ ] Add RLS and insert policy.
-   [ ] Add server-side API submission path.
-   [ ] Add realtime only if a live lead inbox is required; use private
    event channel.
-   [ ] Record migration and deployment metadata.

## 5.2 `apps/customer-portal`

### Foundation

-   [ ] Independent Next.js PWA.
-   [ ] Auth/session integration.
-   [ ] Shared design system.
-   [ ] Typed API client.
-   [ ] Customer route guards.
-   [ ] PWA manifest and install behavior.

### Features

-   [ ] Customer dashboard.
-   [ ] Profile and addresses.
-   [ ] Product catalog.
-   [ ] Search/filter/category.
-   [ ] Product details.
-   [ ] Customer-specific pricing display.
-   [ ] Promotion listing.
-   [ ] Cart.
-   [ ] Order creation.
-   [ ] Order history.
-   [ ] Order status timeline.
-   [ ] Reward/loyalty view when enabled.
-   [ ] Notifications.
-   [ ] Support entry point.

### Supabase per phase

-   [ ] Customer profile/relationship migrations.
-   [ ] Catalog and price read model migrations if required.
-   [ ] Cart/order schema migrations.
-   [ ] Order status history and constraints.
-   [ ] RLS and tenant/customer ownership policies.
-   [ ] Private realtime order status channel.
-   [ ] Realtime event payload must not leak other customers' orders.
-   [ ] Apply and record each migration.

## 5.3 `apps/company-portal`

### Foundation

-   [ ] Independent Next.js PWA.
-   [ ] Company auth and tenant context.
-   [ ] Shared design system.
-   [ ] Permission-aware navigation.

### Features

-   [ ] Company overview.
-   [ ] Organization and branch management.
-   [ ] User management.
-   [ ] Team management.
-   [ ] Territory management.
-   [ ] Outlet management.
-   [ ] Sales assignment.
-   [ ] Sales target management.
-   [ ] Attendance overview.
-   [ ] Visit overview.
-   [ ] Order overview.
-   [ ] Promotion management according to permission.
-   [ ] Reports and exports.
-   [ ] Integration settings.

### Supabase per phase

-   [ ] Organization/branch/team/territory migrations.
-   [ ] User assignment and target migrations.
-   [ ] Constraints and tenant relationship policies.
-   [ ] RLS for company scope.
-   [ ] Realtime events for assignment/status updates where useful.
-   [ ] Apply and record migrations.

## 5.4 `apps/sales-portal`

### Foundation

-   [ ] Independent Next.js PWA.
-   [ ] Sales identity and team context.
-   [ ] Shared design system.
-   [ ] API client and route protection.

### Features

-   [ ] Sales home dashboard.
-   [ ] Assigned outlet list.
-   [ ] Visit planner.
-   [ ] Visit details.
-   [ ] Visit history.
-   [ ] Sales target progress.
-   [ ] Product catalog.
-   [ ] Promotion visibility.
-   [ ] Order history.
-   [ ] Daily activity.
-   [ ] Profile and settings.
-   [ ] Mobile-app handoff for background tracking.

### Supabase per phase

-   [ ] Sales profile and assignment migrations.
-   [ ] Visit and activity migrations.
-   [ ] Target migrations.
-   [ ] RLS by sales ownership/team.
-   [ ] Realtime for visit/assignment changes where required.
-   [ ] Apply and record migrations.

## 5.5 `apps/distributor-portal`

### Features

-   [ ] Distributor dashboard.
-   [ ] Product catalog access.
-   [ ] Inventory visibility.
-   [ ] Incoming orders.
-   [ ] Order processing.
-   [ ] Fulfillment status.
-   [ ] Outlet directory.
-   [ ] Sales team overview.
-   [ ] Distributor reports.
-   [ ] Promotion participation.
-   [ ] Account and configuration.

### Supabase per phase

-   [ ] Distributor organization relationship migration.
-   [ ] Inventory and stock movement migrations.
-   [ ] Order fulfillment migrations.
-   [ ] Tenant/distributor RLS.
-   [ ] Realtime order fulfillment and stock event channels where
    appropriate.
-   [ ] Apply and record migrations.

## 5.6 `apps/principal-portal`

### Features

-   [ ] Principal dashboard.
-   [ ] Product master management.
-   [ ] Product categories and variants.
-   [ ] Price list management.
-   [ ] Promotion campaign.
-   [ ] Distributor relationship.
-   [ ] Distributor order visibility.
-   [ ] Sales-through analytics when source data exists.
-   [ ] Campaign reporting.
-   [ ] Account and access management.

### Supabase per phase

-   [ ] Principal and distributor relationship migrations.
-   [ ] Product/pricing/promotion migrations.
-   [ ] Audit trail for price and campaign changes.
-   [ ] RLS for principal scope.
-   [ ] Realtime campaign/order events with explicit audience.
-   [ ] Apply and record migrations.

## 5.7 `apps/supervisor-portal`

### Features

-   [ ] Supervisor dashboard.
-   [ ] Team roster.
-   [ ] Shift status.
-   [ ] Live location map.
-   [ ] Location freshness indicator.
-   [ ] Visit monitoring.
-   [ ] Route history.
-   [ ] Route replay.
-   [ ] Outlet coverage.
-   [ ] Sales performance.
-   [ ] Target progress.
-   [ ] Activity timeline.
-   [ ] Alerts.
-   [ ] Report views.

### Supabase per phase

-   [ ] Supervisor/team/territory scope migrations.
-   [ ] Location projection/read model migrations.
-   [ ] Route and visit relationship migrations.
-   [ ] RLS and private channel policies.
-   [ ] Realtime Broadcast channels scoped by tenant/team/region.
-   [ ] Apply and record migrations.

## 5.8 `apps/super-admin`

### Features

-   [ ] Platform overview.
-   [ ] Tenant management.
-   [ ] Organization registry.
-   [ ] User administration.
-   [ ] Role and permission governance.
-   [ ] Service registry.
-   [ ] Domain registry.
-   [ ] Feature flags.
-   [ ] Subscription/package configuration.
-   [ ] Integration registry.
-   [ ] Platform audit log.
-   [ ] Security events.
-   [ ] Usage overview.
-   [ ] System health.
-   [ ] AI governance screens (final AI phase).
-   [ ] Telegram bot configuration screens (final Telegram phase).

### Supabase per phase

-   [ ] Platform tenant and configuration migrations.
-   [ ] Admin role/permission migrations.
-   [ ] Audit/security event migrations.
-   [ ] Restrictive RLS and grants.
-   [ ] Private admin event channels only where needed.
-   [ ] Apply and record migrations.

## 5.9 `apps/mobile-sales`

### Foundation

-   [ ] Initialize Expo app.
-   [ ] Configure app scheme and environments.
-   [ ] Configure EAS build profiles.
-   [ ] Consume shared native tokens.
-   [ ] Configure secure session storage.
-   [ ] Configure API client.
-   [ ] Configure offline persistence.

### Features

-   [ ] Login and session.
-   [ ] Home dashboard.
-   [ ] Shift start/end.
-   [ ] Attendance.
-   [ ] Assigned outlets.
-   [ ] Visit planner.
-   [ ] Check-in/check-out.
-   [ ] Visit evidence capture.
-   [ ] Product catalog.
-   [ ] Order creation.
-   [ ] Promotion view.
-   [ ] Target progress.
-   [ ] GPS permission onboarding.
-   [ ] Background GPS task.
-   [ ] Offline GPS queue.
-   [ ] Offline visit/order draft queue.
-   [ ] Sync status.
-   [ ] Notification inbox.
-   [ ] AI entry points only in final AI phase.
-   [ ] Telegram linking entry point only in final Telegram phase.

### Supabase per phase

-   [ ] Mobile user/device/session metadata migrations where required.
-   [ ] Attendance and visit migrations.
-   [ ] Location session/point migrations.
-   [ ] Idempotency keys and upload receipt schema.
-   [ ] RLS for user-owned sessions and visit evidence.
-   [ ] Realtime status updates for shift/visit sync where required.
-   [ ] Apply and record migrations.

------------------------------------------------------------------------

# 6. Service Backlog

## 6.1 `services/api` --- FastAPI

### Foundation

-   [ ] FastAPI application entrypoint.
-   [ ] Configuration and secret loading.
-   [ ] Supabase/PostgreSQL connection strategy.
-   [ ] Supabase Auth JWT verification.
-   [ ] Tenant context middleware/dependency.
-   [ ] RBAC/ABAC authorization.
-   [ ] Standard error envelope.
-   [ ] Request/correlation ID.
-   [ ] Structured logging.
-   [ ] OpenAPI versioning.
-   [ ] Health/readiness endpoints.

### Domain modules

-   [ ] Identity and tenant.
-   [ ] Organization and branch.
-   [ ] Sales and visits.
-   [ ] Customer and outlet.
-   [ ] Product and catalog.
-   [ ] Pricing and promotion.
-   [ ] Inventory.
-   [ ] Order.
-   [ ] Reward.
-   [ ] Location ingestion.
-   [ ] Route query.
-   [ ] Analytics query.
-   [ ] Content job lifecycle.
-   [ ] Workflow.
-   [ ] Integrations.
-   [ ] Audit.

### Supabase per phase

-   [ ] Migrations for each new domain.
-   [ ] RLS/grants and database constraints.
-   [ ] Realtime publication/private channel policies.
-   [ ] Transactional outbox when event reliability is required.
-   [ ] Migration application record.

## 6.2 `services/location-worker`

-   [ ] Worker entrypoint.
-   [ ] Queue consumer.
-   [ ] Location point normalization.
-   [ ] Timestamp and accuracy validation.
-   [ ] Duplicate detection.
-   [ ] Latest location projection.
-   [ ] Route segmentation.
-   [ ] Geofence processing.
-   [ ] Visit proximity event generation.
-   [ ] Stale location detection.
-   [ ] Retry and dead-letter handling.
-   [ ] Tenant-scoped event publishing.
-   [ ] Metrics and structured logs.

Supabase: - \[ \] PostGIS migrations. - \[ \] GiST indexes. - \[ \]
Location partition strategy if needed. - \[ \] Latest location
projection. - \[ \] Private Realtime Broadcast authorization. - \[ \]
Retention and cleanup functions/policies. - \[ \] Apply and record
migrations.

## 6.3 `services/notification-worker`

-   [ ] Notification event consumer.
-   [ ] In-app notification delivery.
-   [ ] Email/push provider adapter when enabled.
-   [ ] User preference resolution.
-   [ ] Quiet hours.
-   [ ] Retry and deduplication.
-   [ ] Delivery log.
-   [ ] Template registry.
-   [ ] Notification metrics.

Supabase: - \[ \] Notification schema. - \[ \] Preference schema. - \[
\] Outbox/delivery log migrations. - \[ \] RLS for recipient
ownership. - \[ \] Private realtime notification channel. - \[ \] Apply
and record migrations.

## 6.4 `services/analytics-worker`

-   [ ] Scheduled aggregation runner.
-   [ ] Sales daily aggregation.
-   [ ] Visit performance aggregation.
-   [ ] Outlet coverage aggregation.
-   [ ] Order aggregation.
-   [ ] Promotion aggregation.
-   [ ] Report snapshot generation.
-   [ ] Data freshness metadata.
-   [ ] Export job lifecycle.
-   [ ] Retry and idempotency.

Supabase: - \[ \] Metric definitions. - \[ \] Aggregation
tables/materialized views. - \[ \] Report run tables. - \[ \] Indexes
and refresh functions. - \[ \] Realtime report-ready event if needed. -
\[ \] Apply and record migrations.

## 6.5 `services/ai-worker` --- FINAL AI PHASE

Do not implement before the designated AI phase.

-   [ ] Unified AI Orchestrator.
-   [ ] Model Router.
-   [ ] Provider adapters.
-   [ ] Context Engine.
-   [ ] Memory Coordinator.
-   [ ] Agent Registry.
-   [ ] Skill Registry.
-   [ ] Tool Gateway.
-   [ ] RAG / knowledge retrieval.
-   [ ] Sales Assistant.
-   [ ] Sales Coach.
-   [ ] Visit Planner.
-   [ ] Promotion Advisor.
-   [ ] Report narrative generation.
-   [ ] AI usage metering.
-   [ ] AI audit and policy enforcement.

Supabase: - \[ \] Provider/model configuration tables. - \[ \]
Agent/skill/tool registry migrations. - \[ \] Conversation/memory
schema. - \[ \] Knowledge document/chunk schema. - \[ \] pgvector
extension/index configuration where needed. - \[ \] AI usage ledger. -
\[ \] AI approval/audit tables. - \[ \] Private AI job/status
channels. - \[ \] Apply and record migrations.

## 6.6 `services/telegram-service` --- FINAL TELEGRAM PHASE

Do not implement before the designated Telegram phase.

-   [ ] Telegram Bot API adapter.
-   [ ] Webhook endpoint.
-   [ ] Webhook secret validation.
-   [ ] Update ID deduplication.
-   [ ] Account linking.
-   [ ] Command router.
-   [ ] Authorization adapter.
-   [ ] Daily report command.
-   [ ] Sales analysis command.
-   [ ] Promotion recommendation command.
-   [ ] Content generation command.
-   [ ] Proactive scheduler integration.
-   [ ] Quiet hours and notification caps.
-   [ ] Delivery retry and logs.
-   [ ] Group authorization and scope.

Supabase: - \[ \] Bot registry. - \[ \] Telegram account binding. - \[
\] One-time link token schema. - \[ \] Update inbox. - \[ \] Message
outbox. - \[ \] Notification preferences. - \[ \] Delivery log. - \[ \]
Private bot job/status events where needed. - \[ \] Apply and record
migrations.

## 6.7 `services/remotion-renderer` --- FINAL CONTENT PHASE

-   [ ] Node.js renderer runtime.
-   [ ] Remotion compositions.
-   [ ] Template registry.
-   [ ] Product showcase template.
-   [ ] Promotion template.
-   [ ] Testimonial template.
-   [ ] Product education template.
-   [ ] Sales activity recap template.
-   [ ] Asset resolver.
-   [ ] Font and media handling.
-   [ ] Render queue consumer.
-   [ ] Render progress.
-   [ ] Cancellation.
-   [ ] Retry.
-   [ ] Output validation.
-   [ ] Supabase Storage upload.
-   [ ] Render metadata callback to FastAPI.

Supabase: - \[ \] Content project and asset schema. - \[ \] Template
version schema. - \[ \] Render job/output schema. - \[ \] Approval
schema. - \[ \] Usage ledger. - \[ \] Private render progress event
channel. - \[ \] Apply and record migrations.

------------------------------------------------------------------------

# 7. Shared Package Backlog

## 7.1 `packages/design-tokens`

-   [ ] Canonical primitive JSON.
-   [ ] Semantic light JSON.
-   [ ] Semantic dark JSON.
-   [ ] Typography, spacing, radius, elevation, motion, breakpoint JSON.
-   [ ] Token schema validation.
-   [ ] CSS generator.
-   [ ] Native TypeScript generator.
-   [ ] Versioning and changelog.

## 7.2 `packages/design-system`

-   [ ] Button and form controls.
-   [ ] Navigation primitives.
-   [ ] Data display components.
-   [ ] Status and feedback components.
-   [ ] Modal/drawer/popover.
-   [ ] Business components.
-   [ ] AI components (final AI phase).
-   [ ] Content components (final content phase).
-   [ ] Map components.
-   [ ] Accessibility documentation.

## 7.3 `packages/shared-types`

-   [ ] IDs and timestamps.
-   [ ] Tenant and organization types.
-   [ ] User and permission types.
-   [ ] Pagination.
-   [ ] Error contracts.
-   [ ] Common enums.

## 7.4 `packages/api-contracts`

-   [ ] API request schemas.
-   [ ] API response schemas.
-   [ ] Error envelope.
-   [ ] Pagination contracts.
-   [ ] Versioning policy.

## 7.5 `packages/api-client`

-   [ ] Typed HTTP client.
-   [ ] Auth token injection.
-   [ ] Refresh handling.
-   [ ] Correlation ID.
-   [ ] Error normalization.
-   [ ] Retry policy for safe requests only.

## 7.6 `packages/event-contracts`

-   [ ] Event envelope.
-   [ ] Domain event schemas.
-   [ ] Event versioning.
-   [ ] Tenant scope fields.
-   [ ] Correlation IDs.

## 7.7 `packages/permissions`

-   [ ] Permission identifiers.
-   [ ] UI permission helpers.
-   [ ] Route guard helpers.
-   [ ] No client-side authorization authority.

## 7.8 `packages/maps`

-   [ ] Map provider abstraction.
-   [ ] Marker types.
-   [ ] Route geometry types.
-   [ ] Geofence geometry types.
-   [ ] Map configuration contracts.

## 7.9 `packages/ai-contracts` and `content-contracts`

-   [ ] Agent request/response contracts.
-   [ ] Tool invocation contract.
-   [ ] Usage metadata.
-   [ ] Content brief contract.
-   [ ] Storyboard contract.
-   [ ] Render job contract.
-   [ ] Template props schema.

------------------------------------------------------------------------

# 8. Phase Implementation Sequence

## Phase 00 --- Repository Bootstrap & Governance

**Goal:** menyiapkan monorepo dan governance dasar sebelum aplikasi
dibangun.

### Implementation

-   [ ] Create repository structure.
-   [ ] Add root AGENTS.md.
-   [ ] Add README and contribution conventions.
-   [ ] Configure pnpm workspace.
-   [ ] Configure Turborepo.
-   [ ] Configure Python workspace conventions.
-   [ ] Configure shared lint/type configuration.
-   [ ] Configure path ownership and CODEOWNERS.
-   [ ] Add documentation structure.
-   [ ] Add per-app/service README placeholders.
-   [ ] Add deployment boundary registry.

### Supabase migration/realtime

-   [ ] Create initial platform schema migration.
-   [ ] Create migration tracking convention.
-   [ ] Create tenant foundation tables if in scope.
-   [ ] Define RLS baseline.
-   [ ] Define realtime policy baseline.
-   [ ] Apply initial migration to designated Supabase project.
-   [ ] Record applied migration and commit SHA.

### Phase output

-   Monorepo ready.
-   AGENTS.md active.
-   Workspace and service boundaries established.
-   Supabase migration workflow established.

## Phase 01 --- Canonical Design System & Design Tokens

**Goal:** menyelesaikan token canonical dan UI foundation lintas
Web/Mobile.

### Implementation

-   [ ] Add `packages/design-tokens`.
-   [ ] Add primitive token JSON.
-   [ ] Add semantic light/dark token JSON.
-   [ ] Add typography/spacing/radius/elevation/motion/breakpoint
    tokens.
-   [ ] Build token generator.
-   [ ] Generate CSS variables.
-   [ ] Generate React Native token exports.
-   [ ] Add `packages/design-system`.
-   [ ] Build foundation components.
-   [ ] Add theme provider.
-   [ ] Add responsive shell primitives.
-   [ ] Add component usage documentation.

### Supabase migration/realtime

-   [ ] Add tenant theme preference schema only if user-configurable
    themes are required.
-   [ ] Add theme preference API contract.
-   [ ] Add RLS for user/tenant theme settings.
-   [ ] Realtime is not required for static tokens; if tenant theme
    configuration is live-updated, publish a private
    `tenant.theme.updated` event.
-   [ ] Apply and record migration.

### Phase output

-   Canonical tokens.
-   Web/native generated tokens.
-   Shared component foundation.

## Phase 02 --- Identity, Tenant & Authorization Foundation

**Goal:** menyediakan identity, multi-tenant scope, role, permission,
and audit.

### Implementation

-   [ ] Supabase Auth integration.
-   [ ] FastAPI JWT verification.
-   [ ] Tenant context.
-   [ ] Organization and branch model.
-   [ ] User profile.
-   [ ] Roles and permissions.
-   [ ] RBAC/ABAC policy layer.
-   [ ] Session lifecycle.
-   [ ] Admin audit foundation.
-   [ ] Shared auth client.

### Supabase migration/realtime

-   [ ] Tenant and organization migrations.
-   [ ] User profile and role migrations.
-   [ ] Permission and role-permission migrations.
-   [ ] Audit table migrations.
-   [ ] RLS and grants.
-   [ ] Private realtime events for account/tenant status only where
    required.
-   [ ] Apply and record migrations.

### Phase output

-   Authentication and authorization foundations used by all portals.

## Phase 03 --- Core Master Data & Company Administration

**Goal:** menyelesaikan company, branch, team, territory, outlet, user
assignment.

### Implementation

-   [x] Company Portal shell.
-   [x] Super Admin tenant management foundation.
-   [x] Branch CRUD.
-   [x] Team and supervisor hierarchy.
-   [x] Territory management.
-   [x] Outlet master.
-   [x] Sales profile and assignment.
-   [x] Import/export foundation.
-   [x] API endpoints and contracts.

### Supabase migration/realtime

-   [x] Organization/branch/team/territory migrations.
-   [x] Outlet and sales profile migrations.
-   [x] Assignment history migrations.
-   [x] Constraints, indexes, RLS.
-   [x] Private realtime events for assignment and master-data updates
    where needed.
-   [x] Apply and record migrations.

### Phase output

-   Company administration and master data ready.

## Phase 04 --- SmartTeam: Visit, Attendance & Sales Operations

**Goal:** menyelesaikan operational workflow sales sebelum GPS
intelligence.

### Implementation

-   [x] Sales Portal shell.
-   [x] Mobile Sales shell.
-   [x] Shift start/end.
-   [x] Attendance.
-   [x] Visit planning.
-   [x] Visit assignment.
-   [x] Check-in/check-out API.
-   [x] Visit evidence upload.
-   [x] Daily activity.
-   [x] Target management.
-   [x] Supervisor visit overview.
-   [x] Visit timeline.

### Supabase migration/realtime

-   [x] Attendance and shift migrations.
-   [x] Visit and visit evidence migrations.
-   [x] Sales activity and target migrations.
-   [x] RLS and storage policies.
-   [x] Private realtime events for shift/visit status.
-   [x] Apply and record migrations.

### Phase output

-   Sales operations can be managed through Web and Mobile.

## Phase 05 --- SmartOrder: Product, Pricing, Inventory & Orders

**Goal:** membangun transaksi order deterministik dan konsisten.

### Implementation

-   [ ] Product master.
-   [ ] Product category and variant.
-   [ ] Price list.
-   [ ] Promotion rules.
-   [ ] Inventory model.
-   [ ] Customer catalog.
-   [ ] Cart/order draft.
-   [ ] Order creation.
-   [ ] Order approval/status.
-   [ ] Fulfillment.
-   [ ] Customer Portal commerce.
-   [ ] Distributor order operations.
-   [ ] Principal product/pricing views.
-   [ ] Idempotency and order snapshots.

### Supabase migration/realtime

-   [ ] Product and category migrations.
-   [ ] Pricing and promotion migrations.
-   [ ] Inventory and stock movement migrations.
-   [ ] Order/order item/status history migrations.
-   [ ] Constraints, indexes, RLS.
-   [ ] Private realtime order status events.
-   [ ] Apply and record migrations.

### Phase output

-   Customer, sales, distributor, and principal commerce workflows
    connected to FastAPI.

## Phase 06 --- SmartReward & Incentive

**Goal:** membangun reward/incentive dengan ledger yang dapat diaudit.

### Implementation

-   [ ] Reward program.
-   [ ] Incentive rules.
-   [ ] Points ledger.
-   [ ] Reward catalog.
-   [ ] Eligibility calculation.
-   [ ] Redemption workflow.
-   [ ] Reversal/adjustment.
-   [ ] Customer reward view.
-   [ ] Company and principal reporting.

### Supabase migration/realtime

-   [ ] Reward program and catalog migrations.
-   [ ] Ledger and redemption migrations.
-   [ ] Audit and constraints.
-   [ ] RLS.
-   [ ] Private realtime reward balance/status event where needed.
-   [ ] Apply and record migrations.

### Phase output

-   Reward and incentive domain integrated.

## Phase 07 --- Realtime Location & Route History

**Goal:** first-party GPS capture, live map, route history, and replay.

### Implementation

-   [ ] Expo Location integration.
-   [ ] Expo TaskManager background task.
-   [ ] Location permission onboarding.
-   [ ] Work-session-bound tracking.
-   [ ] Local offline GPS queue.
-   [ ] FastAPI batch ingestion.
-   [ ] Deduplication and validation.
-   [ ] Latest location projection.
-   [ ] PostGIS point storage.
-   [ ] Route segmentation.
-   [ ] Geofence processing.
-   [ ] Supervisor live map.
-   [ ] Route history and replay.
-   [ ] Location access audit.
-   [ ] Stale location indicator.

### Supabase migration/realtime

-   [ ] Enable PostGIS in approved schema.
-   [ ] Create location sessions/points.
-   [ ] Create latest locations.
-   [ ] Create route segments.
-   [ ] Create geofence tables.
-   [ ] Add spatial indexes.
-   [ ] Add time indexes/partition strategy where justified.
-   [ ] Add location policies and access audit.
-   [ ] Configure private Broadcast channels scoped by
    tenant/team/region.
-   [ ] Apply and record migrations.

### Phase output

-   SalesX-Ai owns its operational GPS history; Google Maps is a
    map/routing provider, not the source of personal Timeline history.

## Phase 08 --- Analytics & Operational Reporting

**Goal:** menyediakan reports deterministik sebelum AI-generated
analysis.

### Implementation

-   [ ] Metric definitions.
-   [ ] Sales aggregation.
-   [ ] Visit aggregation.
-   [ ] Outlet coverage.
-   [ ] Order performance.
-   [ ] Inventory reporting.
-   [ ] Reward reporting.
-   [ ] Territory dashboards.
-   [ ] Daily/weekly/monthly report generation.
-   [ ] Export jobs.
-   [ ] Data freshness metadata.

### Supabase migration/realtime

-   [ ] Report definitions and run tables.
-   [ ] Metric snapshot tables.
-   [ ] Aggregate tables/materialized views.
-   [ ] Indexes and refresh functions.
-   [ ] RLS.
-   [ ] Private `report.ready` event if UI needs immediate notification.
-   [ ] Apply and record migrations.

### Phase output

-   Business reporting is data-backed and available without AI narrative
    generation.

## Phase 09 --- Workflow, Scheduling & Notification Foundation

**Goal:** menyediakan event-driven workflow dan notification
infrastructure sebagai fondasi fase AI/Telegram.

### Implementation

-   [ ] Event envelope and versioning.
-   [ ] Transactional outbox.
-   [ ] Idempotent consumers.
-   [ ] Workflow definitions.
-   [ ] Workflow runs and steps.
-   [ ] Scheduled job registry.
-   [ ] Approval records.
-   [ ] Notification preferences.
-   [ ] In-app notifications.
-   [ ] Retry and dead-letter handling.
-   [ ] Worker observability.

### Supabase migration/realtime

-   [ ] Outbox/inbox migrations.
-   [ ] Workflow definition/run/step migrations.
-   [ ] Scheduled job migrations.
-   [ ] Notification and preference migrations.
-   [ ] Delivery log migrations.
-   [ ] RLS.
-   [ ] Private realtime workflow and notification channels.
-   [ ] Apply and record migrations.

### Phase output

-   Reliable event and notification infrastructure ready for final
    AI/Telegram integrations.

## Phase 10 --- Remotion Foundation & Content Studio Core

**Goal:** membangun programmatic video rendering foundation. AI content
generation remains disabled until final AI phase; this phase can provide
template-based/manual brief workflow.

### Implementation

-   [ ] Node.js Remotion renderer service.
-   [ ] Remotion Player in relevant portal.
-   [ ] Composition registry.
-   [ ] Template versioning.
-   [ ] Product showcase template.
-   [ ] Promotion template.
-   [ ] Testimonial template.
-   [ ] Product education template.
-   [ ] Manual content brief.
-   [ ] Asset selection/upload.
-   [ ] Preview.
-   [ ] Approval workflow.
-   [ ] Render queue.
-   [ ] Render status and cancellation.
-   [ ] Storage output.

### Supabase migration/realtime

-   [ ] Content project/brief schema.
-   [ ] Template and template version schema.
-   [ ] Asset schema.
-   [ ] Render job/output schema.
-   [ ] Approval schema.
-   [ ] Usage ledger baseline.
-   [ ] Private render progress Broadcast channel.
-   [ ] Storage policies.
-   [ ] Apply and record migrations.

### Phase output

-   Template-driven content creation and rendering works without
    AI-generated script dependency.

## Phase 11 --- Unified AI Platform & Sales Intelligence (FINAL AI PHASE)

**Goal:** implement all AI capabilities after business domains,
reporting, workflow, and content foundation are available.

### Implementation

-   [ ] Unified AI Gateway.
-   [ ] Unified AI Orchestrator.
-   [ ] Model Router.
-   [ ] Context Engine.
-   [ ] Memory Coordinator.
-   [ ] Agent Registry.
-   [ ] Skill Registry.
-   [ ] Tool Gateway.
-   [ ] RAG and knowledge ingestion.
-   [ ] AI Sales Assistant.
-   [ ] AI Sales Coach.
-   [ ] AI Visit Planner.
-   [ ] AI Outlet Intelligence.
-   [ ] AI Promotion Advisor.
-   [ ] AI Report Analysis.
-   [ ] AI daily/weekly narrative.
-   [ ] AI usage and cost metering.
-   [ ] AI audit and approval.
-   [ ] AI Content Brief/Script/Storyboard generation.
-   [ ] Connect AI-generated storyboard to Remotion templates.
-   [ ] Notify relevant app users through in-app notification.

### Supabase migration/realtime

-   [ ] Provider/model config migrations.
-   [ ] Agent/skill/tool registry migrations.
-   [ ] Conversation and memory migrations.
-   [ ] Knowledge documents/chunks and pgvector migrations.
-   [ ] Usage ledger.
-   [ ] AI action/audit/approval migrations.
-   [ ] Content script/storyboard generation fields/tables.
-   [ ] RLS and tenant-aware retrieval policy.
-   [ ] Private AI job and result Broadcast channels.
-   [ ] Apply and record migrations.

### Phase output

-   Unified AI capabilities are integrated with real business data and
    existing workflows.

## Phase 12 --- Telegram Bot & Proactive AI (FINAL TELEGRAM PHASE)

**Goal:** implement Telegram after AI Orchestrator and reporting
capabilities are ready.

### Implementation

-   [ ] Create Telegram bot.
-   [ ] Configure webhook endpoint.
-   [ ] Verify webhook secret.
-   [ ] Account linking with one-time token.
-   [ ] Command router.
-   [ ] `/start`, `/link`, `/help`.
-   [ ] `/today` daily briefing.
-   [ ] `/daily` daily report.
-   [ ] `/weekly` weekly report.
-   [ ] `/monthly` monthly report.
-   [ ] `/sales` sales summary.
-   [ ] `/target` target progress.
-   [ ] `/visit` visit plan/status.
-   [ ] `/promotion` promotion recommendation.
-   [ ] `/analysis` AI analysis.
-   [ ] `/content` AI content generation.
-   [ ] `/ask` SalesX-Ai assistant.
-   [ ] Proactive scheduler.
-   [ ] Start-of-day briefing.
-   [ ] Visit reminders.
-   [ ] Target alerts.
-   [ ] End-of-day report.
-   [ ] Weekly insight.
-   [ ] Quiet hours and frequency cap.
-   [ ] Opt-out and unlink.
-   [ ] Group authorization.
-   [ ] Delivery retry and audit.

### Supabase migration/realtime

-   [ ] Telegram bot registry.
-   [ ] Telegram account binding.
-   [ ] Link token table.
-   [ ] Update inbox/deduplication.
-   [ ] Message outbox.
-   [ ] Preferences/quiet hours.
-   [ ] Delivery logs.
-   [ ] Proactive schedule state.
-   [ ] AI content job linkage.
-   [ ] RLS and private access.
-   [ ] Private Telegram delivery/status event where needed.
-   [ ] Apply and record migrations.

### Phase output

-   Telegram becomes an authorized proactive AI companion connected to
    SalesX-Ai business workflows.

## Phase 13 --- Super Admin Governance & Platform Operations

**Goal:** consolidate global platform governance after core services are
integrated.

### Implementation

-   [ ] Tenant governance.
-   [ ] Service registry.
-   [ ] Domain registry.
-   [ ] Feature flags.
-   [ ] Usage and cost overview.
-   [ ] AI provider/model governance.
-   [ ] Agent/skill governance.
-   [ ] Telegram integration governance.
-   [ ] Content template governance.
-   [ ] Security and audit center.
-   [ ] System health dashboard.
-   [ ] Operational runbooks.
-   [ ] Backup and recovery procedures.

### Supabase migration/realtime

-   [ ] Platform configuration migrations.
-   [ ] Feature flag migrations.
-   [ ] Service/domain registry migrations.
-   [ ] Usage aggregation migrations.
-   [ ] Security event migrations.
-   [ ] RLS and admin-only policies.
-   [ ] Private admin event channels.
-   [ ] Apply and record migrations.

### Phase output

-   Platform-wide governance and operations are integrated.

------------------------------------------------------------------------

# 9. Phase-by-Phase Supabase Migration Register

Every phase must update this register. A phase is not marked complete
while its required migration record is missing.

  ------------------------------------------------------------------------------
  Phase             Database domain   Supabase          Realtime handling
                                      migration         
                                      required          
  ----------------- ----------------- ----------------- ------------------------
  00                Platform/tenant   Yes               Baseline policies; no
                    foundation                          broad broadcast

  01                Theme             Yes               Only if live theme
                    preferences, if                     updates required
                    persisted                           

  02                Identity, tenant, Yes               Private account/status
                    roles, audit                        events if needed

  03                Organization,     Yes               Assignment/master-data
                    team, outlet                        events

  04                Shift,            Yes               Private shift/visit
                    attendance,                         updates
                    visits                              

  05                Product, pricing, Yes               Private
                    inventory, orders                   order/fulfillment events

  06                Rewards,          Yes               Private reward status
                    incentives,                         events
                    ledger                              

  07                Location,         Yes               Private Broadcast
                    PostGIS, routes,                    location channels
                    geofence                            

  08                Reports,          Yes               Private report-ready
                    aggregates,                         events
                    metrics                             

  09                Workflow, outbox, Yes               Private
                    notification                        workflow/notification
                                                        events

  10                Content,          Yes               Private render progress
                    templates, render                   events
                    jobs                                

  11                AI agents,        Yes               Private AI job/result
                    memory, RAG,                        events
                    usage                               

  12                Telegram          Yes               Private Telegram
                    bindings,                           delivery status
                    inbox/outbox                        

  13                Platform          Yes               Private admin events
                    governance,                         
                    feature flags                       
  ------------------------------------------------------------------------------

## 9.1 Migration naming convention

``` text
YYYYMMDDHHMMSS_<phase>_<domain>_<change>.sql
```

Examples:

``` text
20261120090000_p00_platform_create_tenants.sql
20261120100000_p02_identity_create_roles_permissions.sql
20261121100000_p04_sales_create_visits_attendance.sql
20261122100000_p07_location_enable_postgis_and_points.sql
20261123100000_p11_ai_create_agent_memory_registry.sql
20261124100000_p12_telegram_create_bot_bindings.sql
```

## 9.2 Required migration metadata

For each phase record:

``` text
Phase:
Migration file(s):
Commit SHA:
Supabase project reference:
Applied at:
Schema objects changed:
RLS/grants changed:
Realtime publication/channel changed:
Backfill performed:
Rollback/forward-fix notes:
```

## 9.3 Realtime pattern

For high-frequency GPS and private domain events:

``` text
Client
  -> FastAPI
  -> Supabase PostgreSQL transaction
  -> Outbox / projection
  -> Event publisher
  -> Supabase Realtime Broadcast
  -> Authorized subscribers
```

Do not publish an event before the corresponding database transaction is
committed. Event payloads should contain identifiers and minimal state;
clients fetch full authorized detail from FastAPI.

------------------------------------------------------------------------

# 10. Cross-Application Integration Matrix

  --------------------------------------------------------------------------------------------------------------------------
  Capability            Customer       Company       Sales   Distributor   Principal     Supervisor        Admin      Mobile
  ---------------- ------------- ------------- ----------- ------------- ----------- -------------- ------------ -----------
  Authentication               ✓             ✓           ✓             ✓           ✓              ✓            ✓           ✓

  Product catalog              ✓             ✓           ✓             ✓           ✓           View   Governance           ✓

  Order              Create/view   View/manage      Create       Process        View           View   Governance      Create

  Visit                      ---        Manage         Own           ---         ---         Manage        Audit      Manage

  GPS                        ---           ---      Status           ---         ---   Live/history        Audit     Capture

  Promotion                 View        Manage        View   Participate      Manage           View   Governance        View

  Reward                    View        Manage        View           ---   Configure           View   Governance        View

  Analytics                  Own       Company         Own   Distributor   Principal           Team     Platform     Summary

  AI                    Customer      Business       Sales   Distributor   Principal     Team coach   Governance   Assistant
                          helper       insight   assistant       insight     insight                             

  Telegram              Optional      Optional   Proactive      Optional    Optional      Proactive   Governance        Link

  Content                   View        Manage     Request       Request      Manage          Recap   Governance     Request
  --------------------------------------------------------------------------------------------------------------------------

All capability access is permission-based. The table is a default
product map, not a substitute for server-side authorization policy.

------------------------------------------------------------------------

# 11. Independent Deployment Backlog

## 11.1 Web deployment projects

  ---------------------------------------------------------------------------------
  Deployment project      Root directory              Example domain
  ----------------------- --------------------------- -----------------------------
  salesx-website          `apps/website`              `www.salesx-ai.com`

  salesx-customer         `apps/customer-portal`      `customer.salesx-ai.com`

  salesx-company          `apps/company-portal`       `company.salesx-ai.com`

  salesx-sales            `apps/sales-portal`         `sales.salesx-ai.com`

  salesx-distributor      `apps/distributor-portal`   `distributor.salesx-ai.com`

  salesx-principal        `apps/principal-portal`     `principal.salesx-ai.com`

  salesx-supervisor       `apps/supervisor-portal`    `supervisor.salesx-ai.com`

  salesx-admin            `apps/super-admin`          `admin.salesx-ai.com`
  ---------------------------------------------------------------------------------

Each project: - \[ \] Connected to the same GitHub monorepo. - \[ \]
Configured with its own root directory. - \[ \] Uses the repository
lockfile and workspace dependency graph. - \[ \] Has app-specific
environment variables. - \[ \] Has an independent domain. - \[ \] Has
path-aware deployment triggers. - \[ \] Has its own deployment logs and
rollback target.

## 11.2 Backend service deployment

  Service               Runtime          Independent deployment
  --------------------- ---------------- ---------------------------
  API                   Python/FastAPI   Yes
  Location Worker       Python           Yes
  Notification Worker   Python           Yes
  Analytics Worker      Python           Yes
  AI Worker             Python           Yes, final AI phase
  Telegram Service      Python           Yes, final Telegram phase
  Remotion Renderer     Node.js          Yes

## 11.3 Path-aware CI/CD rules

-   A portal-only change should deploy only that portal.
-   A worker-only change should deploy only that worker.
-   API changes deploy API and identify affected client contracts.
-   Design token changes rebuild affected apps but do not automatically
    deploy every app unless the release policy says so.
-   Shared contract changes identify consumers and preserve
    compatibility.
-   Supabase migration changes run through the database migration
    workflow.
-   A database migration deployment is not coupled to all frontend
    deployments.
-   No all-portal deployment should occur merely because the monorepo
    changed.

------------------------------------------------------------------------

# 12. Environment & Configuration Matrix

No staging environment is required by this plan.

  Environment class   Purpose
  ------------------- -------------------------------------
  Local development   Developer machine and local tooling
  Production          Designated live environment

Use separate environment configuration per app/service even when
multiple units share a provider.

Required secret/config categories: - Supabase URL. - Supabase
anon/public key for approved client use. - Server-only database/API
credentials. - JWT verification configuration. - Storage
configuration. - Realtime configuration. - Map provider key with
domain/app restrictions. - Redis/queue connection. - AI provider keys
(final AI phase). - Telegram bot token and webhook secret (final
Telegram phase). - Remotion renderer configuration. - Observability
endpoint.

Secrets must be configured in the relevant deployment platform's secret
store, never committed.

------------------------------------------------------------------------

# 13. Execution Governance & Progress Tracking

## 13.1 Phase tracking template

Use this template in `docs/implementation/phase-status.md`:

``` md
# SalesX-Ai Phase Status

## Phase XX — <Name>

Status: NOT_STARTED | IN_PROGRESS | BLOCKED | IMPLEMENTED

### Implementation
- [ ] Task
- [ ] Task

### Applications / Services
- App/service:
- App/service:

### Supabase
- [ ] Migration created
- [ ] Migration applied
- [ ] RLS/grants addressed
- [ ] Realtime impact addressed
- [ ] Migration evidence recorded

### Integration
- [ ] API contract updated
- [ ] Shared types updated
- [ ] Event contract updated
- [ ] Consumer applications updated

### Deployment
- [ ] Build/deployment configuration updated
- [ ] Target deployment metadata recorded

### Evidence
- Commit:
- Migration:
- Files/modules:
- Deployment:
- Notes:
```

## 13.2 Phase completion conditions

A phase can be marked `IMPLEMENTED` when: - All scoped implementation
tasks are present. - Required applications/services are wired to the
correct API. - Supabase migrations for the phase are created and
applied. - RLS/grants and tenant scope are addressed. - Realtime
requirements are implemented or explicitly recorded as not applicable. -
API and event contracts are aligned. - Deployment configuration for
affected units is present. - Documentation and phase status are
updated. - Remaining work is explicitly listed rather than hidden.

This is engineering completion tracking, not a Product Owner Acceptance
process.

## 13.3 Prohibited status claims

Do not state: - "Production-ready and proven in the field" without field
evidence. - "GPS always tracks" because OS background execution is not
guaranteed. - "All portals are integrated" when only shared
authentication exists. - "Realtime complete" when only a database table
has been added. - "Migration complete" when SQL exists but was not
applied. - "AI integrated" when only a chat UI exists. - "Telegram
proactive complete" when only a bot webhook exists. - "Video generation
complete" when only a Remotion preview exists.

------------------------------------------------------------------------

# 14. Final Phase Sequence Summary

  ---------------------------------------------------------------------------
                  Order Phase            Main output         AI/Telegram
  --------------------- ---------------- ------------------- ----------------
                     00 Repository       Monorepo and AGENTS Not yet
                        Bootstrap                            

                     01 Design System    Canonical           Not yet
                                         tokens/components   

                     02 Identity &       Auth, roles,        Not yet
                        Tenant           permissions         

                     03 Master Data      Company, branch,    Not yet
                                         team, outlet        

                     04 SmartTeam        Attendance and      Not yet
                        Operations       visits              

                     05 SmartOrder       Catalog, inventory, Not yet
                                         orders              

                     06 SmartReward      Reward/incentive    Not yet
                                         ledger              

                     07 Location         GPS, live map,      Not yet
                        Intelligence     route history       

                     08 Analytics        Deterministic       Not yet
                                         reporting           

                     09 Workflow &       Event and           Not yet
                        Notifications    scheduling          
                                         foundation          

                     10 Remotion         Template-based      AI generation
                        Foundation       video rendering     deferred

                     11 Unified AI       AI agents, sales    **AI starts
                        Platform         intelligence, AI    here**
                                         content             

                     12 Telegram AI      Bot, proactive      **Telegram
                                         reports,            starts here**
                                         recommendations     

                     13 Governance       Super Admin         AI/Telegram
                                         platform governance governance
  ---------------------------------------------------------------------------

------------------------------------------------------------------------

# 15. Final Engineering Directives

1.  `SalesX-Ai_Master_PRD_v1.0.md` remains the product baseline.
2.  Root `AGENTS.md` is mandatory for all engineering work.
3.  Canonical Design Token JSON is the only source of visual token
    values.
4.  All portals and services remain in one GitHub monorepo.
5.  Every portal/service keeps its own deployment boundary.
6.  FastAPI owns business logic and business authorization.
7.  Supabase is the primary data platform.
8.  Every phase must include and apply the relevant Supabase migration.
9.  Every phase must explicitly address Supabase Realtime impact.
10. Realtime is private and scoped; do not broadcast all tables.
11. AI and Telegram implementation are reserved for the final phases.
12. Remotion renderer remains a separate Node.js service.
13. No Product Owner Acceptance gate.
14. No staging environment or staging deployment.
15. No real-world testing requirement.
16. No license review gate in this execution plan.
17. Engineering configuration, static validation, migration discipline,
    observability, backup, and rollback remain required controls.
18. Do not claim completion without implementation and migration
    evidence.

**Target architecture:** one repository, independently deployable
portals and services, one canonical design system, one FastAPI business
backend, one Supabase data platform, and a final-stage unified AI +
Telegram intelligence layer.
