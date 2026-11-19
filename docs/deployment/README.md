# Deployment Boundary Registry

Each application and service is independently buildable/deployable while sharing one repository, API contract family and Supabase data platform.

| Unit | Canonical path | Runtime | Status |
|---|---|---|---|
| Existing Web portals | Existing root Next.js app and routes | Next.js | Existing; preserve |
| Native Sales | `apps/mobile-sales/` | React Native Expo | Planned |
| Business API | `services/api/` | Python FastAPI | Planned |
| Location worker | `services/location-worker/` | Python | Planned |
| Notification worker | `services/notification-worker/` | Python | Planned |
| Analytics worker | `services/analytics-worker/` | Python | Planned |
| Remotion renderer | `services/remotion-renderer/` | Node.js | Planned |
| AI worker | `services/ai-worker/` | Python | Final AI phase |
| Telegram service | `services/telegram-service/` | Python | Final Telegram phase |

Do not configure or claim a deployment until its root, build command, environment contract, health check and target are implemented and verified.
