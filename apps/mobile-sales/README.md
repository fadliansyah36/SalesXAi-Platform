# Native Sales Application

Canonical location: `apps/mobile-sales/` (React Native Expo, Android/iOS).

Phase 00–01 establishes native ownership and canonical design-token consumption only; it does not implement business features early or create a second backend/database.

Import `mobileThemes` and `MobileThemeMode` from `./src/theme/tokens`. This adapter reads the generated native token export built from the same JSON sources as Web CSS.

Authentication, secure storage, feature modules, offline outbox, GPS and notifications are implemented in their designated domain phases. No Expo runtime deployment is claimed by this foundation.
