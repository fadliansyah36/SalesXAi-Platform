# SalesX-Ai Production Deployment Evidence — 2026-11-21

**Repository:** fadliansyah36/SalesXAi-Platform  
**Branch:** main  
**Verified source snapshot:** 27dc32b5984fac315a4027aecfe3ca3f8e3217d6  
**Railway environment:** production  
**Supabase:** eyofuiyxalbehbqoaeny

## Four designated Railway services

| Service | Production domain | Deployment ID | Source SHA | Status |
|---|---|---|---|---|
| salesx-api | https://salesx-api-production.up.railway.app | 4137e021-a9b4-4353-a381-999329145086 | 27dc32b | SUCCESS |
| salesx-website | https://salesx-website-production.up.railway.app | 6180c517-d014-4623-876b-ed1cd80d8996 | 27dc32b | SUCCESS |
| salesx-customer | https://salesx-customer-production.up.railway.app | 024c12cb-0f89-4949-8ab4-983c344a8f5f | 27dc32b | SUCCESS |
| salesx-company | https://salesx-company-production.up.railway.app | adadd312-f1a6-4f00-9406-6762fb1bb453 | 27dc32b | SUCCESS |

All four deployment records identify branch main and the same source snapshot. No Railway service or database was created by this execution.

## Live runtime checks

- API GET /readyz: status=ready, database=connected, source SHA 27dc32b5984fac315a4027aecfe3ca3f8e3217d6.
- Website GET /api/health: status=ok, API ready; Website and Sales portals each report root, deep link, JavaScript, stylesheet, manifest and service worker HTTP 200.
- Customer GET /api/health: status=ok, API ready; Customer portal reports all six runtime checks HTTP 200.
- Company GET /api/health: status=ok, API ready; Company, Distributor, Principal, Supervisor and Super Admin each report all six runtime checks HTTP 200.
- Public root HTML for Website, Customer and Company rendered application UI. Company Location page rendered the LocationWorkspace surface. No manual login/register with a real user account was performed.

The portal gateway readiness checks validate static JavaScript/CSS delivery and the canonical design-token stylesheet, not just an HTTP root response.

## GitHub CI

- 44899483509 — SalesX-Ai Phase 02 API Checks: SUCCESS. Includes 164 API tests, compileall, Ruff, isolated Phase 06 DB integration (7/7) and Expo mobile build.
- 44899182990 — Phase 04 Independent Portal Builds: SUCCESS for all eight portal apps on the immediately preceding code-equivalent source snapshot 1cf969802c4043d0390ad203144e7c40c6293cab.
- Railway production container builds on 27dc32b subsequently built and started the four designated services; all eight portal group health probes passed.

## Scope boundaries / outstanding external gates

- The pre-existing extra Railway service @salesx-ai/mobile-sales is FAILED on an older source snapshot and is not one of the four designated production services. The Expo application build in GitHub CI passed. This extra service was not created or removed.
- SmartReward and Location private realtime.messages owner policies remain prepared but unapplied; the live table owner is supabase_realtime_admin. No privilege escalation or ownership bypass was attempted.
- Physical-device Expo background lifecycle verification remains outstanding.
- Google Maps keys and billing are intentionally absent. Provider-neutral adapters and fallback are active; Google map tiles/Routes/Places remain disabled until restricted credentials are supplied.
