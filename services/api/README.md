# FastAPI Business API

Runtime: Python 3.12+ / FastAPI. Canonical path: `services/api/`. Expose versioned REST under `/api/v1`, publish OpenAPI and shared typed contracts, verify Supabase Auth JWT, resolve tenant context, enforce RBAC/ABAC and audit business-critical mutations. Use the bound Supabase project only. Web and Expo business reads/writes use this API; no client-side privileged database access.

When implemented, this service must include environment validation, dependency declarations, entrypoint, health/readiness endpoint, structured logs, correlation IDs, stable error envelopes, bounded timeouts and an independent deployment target. Service implementation is outside Phase 00–01; Phase 02 establishes identity/authorization first.
