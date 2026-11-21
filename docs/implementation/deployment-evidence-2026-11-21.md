# SalesX-Ai Production Deployment Evidence — 2026-11-21

**Repository:** fadliansyah36/SalesXAi-Platform  
**Source branch:** main (not commit-pinned)  
**Latest successful runtime source:** 833235184befbc2ed7ac41d161d07ab0d6fc188e  
**Application code snapshot:** 27dc32b5984fac315a4027aecfe3ca3f8e3217d6  
**Latest main commit at evidence check:** 261b58841dc9a9af7da230b9e696232516348a61 (documentation-only after the deployed app snapshot)  
**Railway environment:** production  
**Supabase:** eyofuiyxalbehbqoaeny

## Four designated Railway services

| Service | Production domain | Latest successful deployment ID | Runtime source SHA | Status |
|---|---|---|---|---|
| salesx-api | https://salesx-api-production.up.railway.app | bb101799-8d7c-46bd-bf4b-ac1d864da8af | 833235184befbc2ed7ac41d161d07ab0d6fc188e | SUCCESS |
| salesx-website | https://salesx-website-production.up.railway.app | 491a7417-3825-418e-b319-1cfdd850405a | 833235184befbc2ed7ac41d161d07ab0d6fc188e | SUCCESS |
| salesx-customer | https://salesx-customer-production.up.railway.app | 760c94dc-9890-452c-ac1b-a14397bc6852 | 833235184befbc2ed7ac41d161d07ab0d6fc188e | SUCCESS |
| salesx-company | https://salesx-company-production.up.railway.app | 42af78b1-8aaa-4c5b-b3d1-8232708b0822 | 833235184befbc2ed7ac41d161d07ab0d6fc188e | SUCCESS |

All four services use repository fadliansyah36/SalesXAi-Platform, branch main, and have no commit pin. The application code has not changed since 27dc32b; 833235 and 261b are documentation-only commits. Per-service Railway watch patterns intentionally skip documentation-only changes, so the runtime remains on the latest application-code snapshot. No Railway service or database was created.

## Live runtime checks

- API GET /readyz: status=ready, database=connected, runtime source SHA 833235184befbc2ed7ac41d161d07ab0d6fc188e.
- Website GET /api/health: status=ok, API ready; Website and Sales portals each report root, deep link, JavaScript, stylesheet, manifest and service worker HTTP 200.
- Customer GET /api/health: status=ok, API ready; Customer portal reports all six runtime checks HTTP 200.
- Company GET /api/health: status=ok, API ready; Company, Distributor, Principal, Supervisor and Super Admin each report all six runtime checks HTTP 200.
- Public root HTML for Website, Customer and Company rendered application UI. Company Location page rendered the LocationWorkspace surface. No manual login/register with a real user account was performed.

The portal gateway readiness checks validate static JavaScript/CSS delivery and the canonical design-token stylesheet, not just an HTTP root response.

## GitHub CI

- 44899483509 — SalesX-Ai Phase 02 API Checks: SUCCESS on app-code snapshot 27dc32b. Includes 164 API tests, compileall, Ruff, isolated Phase 06 DB integration (7/7) and Expo mobile build.
- 44899182990 — Phase 04 Independent Portal Builds: SUCCESS for all eight portal apps on the immediately preceding code-equivalent snapshot 1cf969802c4043d0390ad203144e7c40c6293cab.
- Railway production Docker builds on 833235 subsequently built and started the four designated services; all eight portal group health probes passed.

## Scope boundaries / outstanding external gates

- The pre-existing extra Railway service @salesx-ai/mobile-sales is FAILED on an older source snapshot 18283df6e1002c645a9f9a255a470bffcaa50d09 at BUILD_IMAGE. It is not one of the four designated production services and was not created or removed. The Expo application build in GitHub CI passed.
- SmartReward and Location private realtime.messages owner policies remain prepared but unapplied; the live table owner is supabase_realtime_admin. No privilege escalation or ownership bypass was attempted.
- Physical-device Expo background lifecycle testing is not a phase prerequisite under the Engineering Execution Master Plan. The implementation and Expo build are evidenced; OS vendor scheduling, suspension and battery optimization remain platform limitations, not guaranteed tracking intervals.
- Google Maps keys and billing are intentionally absent. Provider-neutral adapters and fallback are active; Google map tiles/Routes/Places remain disabled until restricted credentials are supplied.
