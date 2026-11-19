# Services

All server-side services are independently deployable and use the one bound Supabase PostgreSQL project. FastAPI is the sole business API and owns authorization and business mutations.

| Service | Runtime | Phase | Boundary |
|---|---|---:|---|
| api | Python / FastAPI | 02+ | Canonical business API |
| location-worker | Python | 07 | GPS ingestion and spatial processing |
| analytics-worker | Python | 08 | Deterministic KPI aggregation |
| notification-worker | Python | 09 | Durable notification delivery |
| remotion-renderer | Node.js | 10 | Isolated Remotion rendering |
| ai-worker | Python | 11 | Final AI phase only |
| telegram-service | Python | 12 | Final Telegram phase only |

Service README files document ownership and conventions. No service is claimed operational until runtime code, environment schema, health checks and deployment configuration exist.
