# Deployment Boundary Registry

Each app/service has an independent release boundary. A commit does not imply deployment. Do not claim a deployment until runtime root, environment schema, build/start commands, health/readiness behavior, target and rollback metadata are implemented and verified.

| Unit | Canonical path | Runtime | Phase | Boundary status |
|---|---|---|---:|---|
| Existing Web app / portals | Root `app/`, `components/`, `lib/` | Next.js 15 / React 19 | Existing | Existing; preserved in place |
| Native Sales | `apps/mobile-sales/` | React Native Expo | 00–01 foundation; features by domain phase | Native token adapter established; Expo runtime bootstrap remains future app work |
| Business API | `services/api/` | Python 3.12 / FastAPI | 02+ | Documented; runtime not yet implemented |
| Location worker | `services/location-worker/` | Python | 07 | Documented; runtime not yet implemented |
| Analytics worker | `services/analytics-worker/` | Python | 08 | Documented; runtime not yet implemented |
| Notification worker | `services/notification-worker/` | Python | 09 | Documented; runtime not yet implemented |
| Remotion renderer | `services/remotion-renderer/` | Node.js | 10 | Documented; runtime not yet implemented |
| AI worker | `services/ai-worker/` | Python | 11 | Reserved for final AI phase |
| Telegram service | `services/telegram-service/` | Python | 12 | Reserved for final Telegram phase |

Deploy only the changed unit to its own target. Inject secrets from the platform secret store; never expose service-role/provider credentials to Web or Expo. Record commit SHA, deployment artifact/ID, target, environment and rollback reference. No staging environment/deployment is required.
