# Phase 04 — SmartTeam Portal Integration

## Runtime source of truth

`components/smart-team/SmartTeamConsole.tsx` is the single operational UI for Phase 04 SmartTeam actions. It uses the shared typed API client from `AppProviders`, the active organization context and server-enforced permission checks. There is no local/mock fallback for the mounted Phase 04 screens.

## Portal tab mapping

| Portal | Existing navigation | Live API view |
|---|---|---|
| Sales (`/sales`) | Aktivitas → Planner, Schedule, History | Visits |
| Sales (`/sales`) | Aktivitas → GPS, Attendance | Attendance with location capture |
| Sales (`/sales`) | Aktivitas → SmartTeam | Full SmartTeam console |
| Supervisor (`/supervisor`) | Visits | Visits |
| Supervisor (`/supervisor`) | Shifts | Attendance |
| Supervisor (`/supervisor`) | Targets | Targets |
| Supervisor (`/supervisor`) | SmartTeam | Full SmartTeam console |
| Company (`/`) | Visits | Visits |
| Company (`/`) | Attendance | Attendance |
| Company (`/`) | Targets | Targets |
| Company (`/`) | SmartTeam | Full SmartTeam console |

The legacy local-state/demo panels for those Phase 04 tabs are disabled at render time. Existing portal navigation and page shells remain intact. Other non-Phase-04 modules remain governed by their own phase tracker entries and are not represented as complete by this cutover.

## Typed API operations

The console uses the shared API client for:
- SmartTeam dashboard and tenant-scoped visits, visit history, assignment, check-in/out, cancellation and updates.
- Attendance listing, GPS clock-in/out and attendance correction with reason.
- Daily activity listing, creation and updates.
- Sales target listing, creation and updates.
- Sales profile and outlet lookup plus the current user's assignment context.
- Private evidence upload, progress/cancellation and signed evidence retrieval.
- SmartTeam event stream through the Website/Company Auth BFF and FastAPI SSE endpoint.

All business mutations follow Portal → shared typed API client → FastAPI router/application service/repository → Supabase. No portal-side direct business mutation to Supabase is introduced.

## Security and evidence

- Organization context is taken from the authenticated session; tenant scope and resource ownership are checked server-side.
- UI actions are gated by the relevant SmartTeam permission and the API repeats authorization (default-deny).
- Visit and attendance location captures include the device geolocation metadata.
- Evidence is uploaded through FastAPI to the private evidence bucket; the browser receives only the authorized signed retrieval path.
- Realtime updates are delivered from the FastAPI event stream through the service's BFF proxy.

## Expo

The Expo Sales application continues to use the same typed API client and production API configuration. Its SmartTeam home retains attendance, visit, assignment and evidence lifecycle with native document/photo selection, upload progress and cancellation. It does not access Supabase with a service-role key.
