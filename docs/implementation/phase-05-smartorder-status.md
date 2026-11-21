# Phase 05 — SmartOrder execution status

Date: 2026-11-20  
Repository: `fadliansyah36/SalesXAi-Platform`  
Branch: `main`  
Supabase project: `eyofuiyxalbehbqoaeny`

## Status

**IN_PROGRESS — NOT COMPLETED.** Phase 05 remains the active phase and Phase 06 stays locked. The latest continuation has implemented the cross-tenant commerce model, promotion ownership/redemption, partner approvals, product/SKU and price/promotion management workflows, multi-warehouse fulfillment, authorized Realtime fan-out, and Web/Expo integration. The remaining completion gate is the final latest-commit engineering workflow and confirmation that the four required Railway services finish their automatic rollout. Historical blocker lists below describe the earlier state and are superseded by the 2026-11-21 continuation record at the end of this file.

## Implemented domain

- Product master, categories/subcategories, brands, units, product variants/SKU, product images in private Storage, publication/status, search and catalog visibility.
- Central price-list and SKU pricing resolution with effective dates, quantity tiers, tenant/principal/distributor/customer/region/channel/contract scopes, price snapshots and price-history trigger.
- Inventory balances, immutable stock-movement ledger, stock-in/out/adjustment, transfers, order reservation/release/commit and cancellation reversal.
- Promotion/campaign rules for minimum value/quantity, product/category/customer/voucher eligibility, percentage/fixed discounts, priority and stacking.
- Persistent multi-item cart, server-side price and promotion calculation, order drafts, expiry and revalidation.
- Idempotent order number and order creation, product/price/tax/customer/shipping snapshots, order history and audit.
- Approval policies, multi-actor approvals, rejection/revision, fulfillment assignment, picking/packing/handover and verified provider webhook interface for delivered/failed events.
- Shipping provider adapter registry and webhook endpoint fail closed when a provider adapter is not configured. Provider secrets are intentionally deferred to deployment as instructed.
- Private Realtime broadcast: tenant-scoped channel, 27 database broadcast triggers, server notification event, and private channel authorization policies.

## API and application coverage

- FastAPI SmartOrder router: **44 endpoints**.
- SmartOrder application service methods: **44**.
- SmartOrder repository methods: **45**.
- SmartOrder typed API contract declarations: **40**.
- Shared API client SmartOrder methods: **45**.
- Web portals use the shared SmartOrder workspace: Customer, Sales, Distributor, Principal, Company and Super Admin. The Expo Sales application has a native SmartOrder catalog/cart/order/tracking module.
- Business mutations remain on the FastAPI path; no frontend direct Supabase business writes are introduced.

## Supabase evidence

- **11/11 Phase 05 migrations** exist in the repository and are applied remotely:
  - `20261120141558_p05_smartorder_core`
  - `20261120142956_p05_smartorder_history_transfers_returns`
  - `20261120143219_p05_smartorder_permissions_immutable_ledgers`
  - `20261120144057_p05_smartorder_assisted_sales_permission`
  - `20261120144615_p05_smartorder_revision_requested_lifecycle`
  - `20261120145619_p05_smartorder_promotion_redemption_lifecycle`
  - `20261120150545_p05_smartorder_shipping_provider_events`
  - `20261120150936_p05_smartorder_shipping_event_rls`
  - `20261120151134_p05_smartorder_order_draft_expiry`
  - `20261120151703_p05_smartorder_realtime_stream`
  - `20261120155706_p05_smartorder_foreign_key_indexes`
- Repository and remote migration ledger: **47/47 exact version/name matches**, no local-only or remote-only migration.
- Public database: **55 tables, 55 with RLS enabled, 55 policies, 281 indexes**.
- SmartOrder domain: **30 tables with RLS and explicit policies**, **27 broadcast triggers**, **3 private Realtime message policies**. Supabase Security Advisor: **0 lints**. Performance Advisor: **0 unindexed foreign keys** after the new index migration; 152 unused-index notices remain informational while the commerce tables have no seeded production records.
- No demo or seed commerce records were inserted. Empty live business tables are not represented as fake inventory/catalog/order data.

## Engineering continuation in this commit

- Deterministic promotion evaluator now applies product/category selectors before discounts, enforces customer/voucher eligibility, stable priority order and stacking groups.
- Product catalog API now accepts brand filter, whitelisted sorting and pagination; shared API client and shared portal workspace expose those controls.
- Portal workspace now selects explicit SKU/variant for price list and stock movement operations; supports stock-in/out/adjustment and inter-warehouse transfer, price-list scope/effective dates, promotion eligibility/validity rules, shipping snapshot, fulfillment assignment, and carrier/tracking details before handover.
- Backend validation rejects malformed promotion rules, invalid price-list scopes/date ranges, mismatched adjustment quantities, and handover without carrier/tracking. Fulfillment assignment is checked against active organization membership.
- Product detail lookup honors an active catalog grant, matching catalog list visibility.
- Added focused tests for promotion calculation, SmartOrder request-schema validation, and the 48-index migration.
- Added `20261120155706_p05_smartorder_foreign_key_indexes.sql` with 48 covering indexes for all Phase 05 foreign keys flagged by Performance Advisor. It is applied remotely and committed; existing historical migrations remain unchanged.

## Cross-tenant API continuation — 2026-11-20

- Product-owner identity is now persisted from partner catalog selection through cart items and immutable order-item snapshots. Partner product pricing checks the product-scoped pricing grant; cart insertion requires active catalog and ordering grants.
- Promotion evaluation and cart/order draft joins now resolve the product through `product_owner_organization_id` rather than assuming buyer and product owner are identical.
- Order submission now searches authorized partner-owned inventory balances, locks the selected balance row, and records reservation/commit/release movements against the inventory-owning organization. Approval decisions use the inventory owner recorded on each movement.
- Fulfillment creation now binds the fulfillment to the warehouse-owning organization and records item-level allocations. Dispatch/release applies to the allocated partner inventory and order state waits for the remaining fulfillment groups.
- API source commits: `328972cbd4a45e2397ecf39abf719e385983e5b0`, `d48ea239072f8c3144becd76655324691b3a479a`, `63021217c72c6cb939c84a3aff0e953a687132de`, `cd1b457dc26191497b5223183742e7997a5afe1b`.
- Railway `salesx-api` deployment for `cd1b457dc26191497b5223183742e7997a5afe1b` completed SUCCESS; build completed and `/readyz` returned HTTP 200. This is deployment/readiness evidence, not proof of live authenticated partner-order transactions.
- Local and remote migration ledgers are reconciled at 49/49 exact version/name pairs after aligning the new migration filenames with the applied Supabase versions.

### Still outstanding — Phase 05 remains IN_PROGRESS

- Distributor/principal partner-order inbox and seller-side read/decision/fulfillment authorization must be connected so a partner organization can operate its own items without seeing unrelated buyer order data.
- End-to-end tenant/role/ownership checks for cross-organization approval and fulfillment actors still need to be completed in the API action matrix and route contracts.
- Product and SKU edit/archive APIs and workflows; price-list update/deactivate; promotion update/deactivate.
- Existing Web portal actions and Expo screens must be reconciled with the new partner-owned product and split-fulfillment contracts; no claim of full cross-surface integration is made.
- Relevant focused API tests, static checks and complete portal/Expo builds for this continuation have not yet been recorded. The Railway image build and readiness check alone are not substitutes.

## Cross-tenant inventory, partner portal and CRUD continuation — 2026-11-20

- Added inventory-owner scoping for stock movements and stock transfers. Inventory and transfer operations now derive product ownership from active inventory grants; stock movement and transfer history joins resolve product metadata through product owner rather than warehouse owner.
- Added owner-aware order cancellation reversal, partner inventory reservation/approval commit/release, and item-level split fulfillment allocations across partner warehouses.
- Added partner order inbox/detail and partner fulfillment API routes; the shared SmartOrder workspace now exposes partner orders, warehouse selection and fulfillment progression. Partner warehouse creation is restricted to the active partner organization.
- Added product edit, price-list update/deactivation, and promotion update/deactivation APIs and typed client methods. The shared workspace now exposes product edit, price-list edit/deactivation and promotion edit/deactivation controls.
- Added indexes for the new owner-scoped composite foreign keys. Performance Advisor now reports zero unindexed foreign keys; unused-index notices remain informational.
- Railway `salesx-api` deployment for commit `d1c14d4244d074f3622630344ced546804c32c44` reached SUCCESS; build and readiness completed. The later `timedelta` import, catalog projection, and product visibility changes are in the follow-on deployment queue and are not yet claimed deployed.

### Remaining Phase 05 completion blockers

- Confirm the latest queued API and portal builds complete successfully after all recent source changes; run focused API/schema/action-matrix checks and relevant Web/Expo typecheck/build workflows.
- Complete seller-side partner order access tests, item-level grant isolation and multi-warehouse fulfillment/cancellation consistency validation.
- Finish UI editing for all price-list line items and full promotion rule editing; ensure all relevant portal actions and Expo workflows are connected to the updated contracts.
- Complete cross-tenant promotion ownership/redemption integration where promotion owner differs from buyer organization.
- No live authenticated partner order/stock transaction has been executed. Do not mark Phase 05 COMPLETED until the above gaps are closed.

## Definition-of-done blockers

1. **Cross-tenant catalog-to-order/fulfillment path is not complete.** Catalog list visibility can include a product through `commerce_catalog_access`, but `cart_items` and `order_items` still use composite foreign keys tying product/SKU ownership to the cart/order organization. The cart insertion query also validates product ownership against the buyer tenant. `inventory_balances` and `fulfillments.warehouse_id` similarly bind product/warehouse to the order tenant. Consequently, a customer/distributor tenant cannot reliably order a principal-owned catalog SKU and fulfill it from a separate distributor warehouse. This requires an additive schema and service design for product-owner identity, inventory-owner/fulfillment organization, partner access checks, and order operations across the buyer/seller boundary.
2. Product/SKU master has create/publication lifecycle but not complete edit/archive APIs and portal workflows for all product and variant attributes.
3. Price lists and promotions have create/read/evaluation/history, but no complete update/deactivate lifecycle API and UI. Existing history triggers are present, but the complete management workflow is not.
4. Stock transfer and same-tenant order allocation are implemented; allocation across a separate distributor inventory owner is part of blocker 1.

These are implementation gaps inside Phase 05, not work deferred to Phase 06. Therefore Phase 05 must not be marked COMPLETED and Phase 06 must not be unlocked yet.

## Validation evidence and limitations

- Final GitHub Actions API workflow on commit `d79a01c9b9cb6d7b6d57b200d931030f0702da48` passed **89 API tests**, Python compileall, Ruff, FastAPI container build, Web typecheck and lint. Portal build matrix passed **8/8** on source commit `fc35ebcfa51617d62b36dc99d753b1df489004fa`; Expo foundation verification passed **20/20** on the same application-source commit, including Expo config, Metro startup, Android/iOS bundle exports and Turborepo workspace build. The final commit after `fc35` only adds the applied SQL index migration, its static migration test and phase documentation.
- This continuation adds 4 promotion-rule tests, 5 request-schema tests and 1 migration-index test; all are included in the 89-test passing API workflow.
- Supabase Security Advisor reports **0 lints**. Performance Advisor reports **0 unindexed foreign keys** after the 48-index migration; 152 unused-index notices remain informational because the new commerce schema has no seeded production traffic.
- No live customer login/order, provider shipment, inventory movement, or real-world workflow test is claimed. No staging environment was created. No SMTP, Google OAuth, or shipping provider secret was added.
- Railway deployment was not triggered by this code continuation; do not infer that production services are running this new commit.

## Next execution

Continue Phase 05 with the cross-tenant catalog/cart/inventory/fulfillment data model and authorization path first, then complete product/SKU, price-list and promotion update/deactivation workflows. Keep the existing four Railway services and Supabase project. Do not start Phase 06 until these gaps are closed and final CI passes.


## Latest source and validation record

- Latest implementation source commit: `70d964bb6310879d16357581b9e0f89868c32821` (branch `main`).
- Latest applied migration: `20261120164113_p05_cross_tenant_fk_indexes`, bound project `eyofuiyxalbehbqoaeny`.
- The API/Web/Company deployment set for the latest continuation commit is still queued; the earlier successful workflows below are historical Phase 05 baseline evidence and do not validate the latest cross-tenant/CRUD changes.
- API workflow: `44768553662` — success, 89 tests.
- Portal matrix: `44768148073` — success, 8/8 portal builds.
- Foundation/Expo workflow: `44768148161` — success, 20/20 steps.


## Authoritative continuation — 2026-11-21

### Implemented in the latest continuation

- **Cross-tenant promotion:** promotion ownership is preserved separately from buyer organization; active Principal/Distributor/Company/Customer partner relationships and organization-audience rules are evaluated. Promotion evaluation serializes competing redemption attempts with transaction advisory locks and checks total/per-customer redemption limits. Draft creation is idempotent; redemption rows store promotion owner, buyer, customer, order and discount amount. Order price and promotion snapshots are protected by immutable database triggers. Approval marks redemptions redeemed; rejection, revision, expiry and cancellation reverse reserved/redemption state. Redemption audit events are append-only traceable commerce audit records.
- **Partner approval:** partner inbox/detail/decision APIs are available to the active partner tenant. Principal/Distributor acceptance, rejection and revision decisions require an idempotency key; rejection/revision requires a reason. The buyer approval path is blocked until every active product-owner and inventory-owner partner has accepted. Rejection/revision releases reserved stock and reverses promotion redemption state; decision history is returned to the UI.
- **Product/SKU management:** full product master fields, category/brand/unit, tax, specifications, image metadata and all SKU attributes are editable. SKU update now carries stable variant IDs, so renaming a SKU updates the same variant rather than inserting a replacement that breaks price references. Removed variants are archived, archived variants are not silently reactivated, and archived SKUs are excluded from the active product editor projection.
- **Price-list management:** the editor handles every price line, add/edit/remove, product/SKU selection, quantity bands, validity dates, priority, currency and organization scope. The API closes superseded lines through price history instead of physically deleting immutable commercial history; status supports inactive/archive.
- **Promotion management:** the editor handles all typed common rules and additional advanced eligibility rules through validated JSON rule objects, including audience, voucher, stacking, discount, limits, period and lifecycle status. Update/archive keeps prior order redemption snapshots intact.
- **Multi-warehouse / multi-partner fulfillment:** order-item allocations identify buyer order item, inventory owner, warehouse and fulfillment. Fulfillments can be created for multiple partner warehouses; available inventory is recommitted with row-level conflict checks when replacement fulfillment is needed. Cancellation and pre-handover carrier failure release net committed quantities; order completion waits until all fulfillment groups are delivered. Fulfillment and partner-decision audit history is exposed in the Web and Expo detail views.
- **Realtime:** private tenant topics are permission-scoped by current active membership and role permissions. Database fan-out sends minimal order/stock/fulfillment/promotion notifications to the buyer and active partner tenants with a relevant grant. FastAPI SSE consumes database notifications and filters events by current tenant/resource permissions. Clients refresh authorized API state rather than treating event payloads as business truth; duplicate/reconnect paths refresh state. The RLS initplan warning was fixed by evaluating `auth.uid()` once per policy statement.
- **Cross-platform:** shared Web SmartOrder workspace is consumed by Customer, Sales, Distributor, Principal, Company and Super Admin surfaces under their action permissions. Native Expo Sales uses the shared typed API client for catalog, price/promotion view, cart, order lifecycle, cancellation, tracking and authorized Realtime refresh. Business mutations remain FastAPI-only; Expo local persistence is not an alternate business database.

### Current source, migration and database evidence

- Latest SmartOrder implementation/test source commit before this documentation update: `2848e2778a8fbc340fe18fa7676885cd0ae81fd0` on `main`.
- Phase 05 migration ledger: **31 local / 31 remote applied**; total repository ledger: **67 / 67 exact version/name matches**.
- Latest Phase 05 migration: `20261121005322_p05_realtime_auth_rls_initplan`, applied to Supabase project `eyofuiyxalbehbqoaeny`.
- Live database inventory: **57 public tables, 57 RLS-enabled tables, 57 public policies, 306 public indexes**; **27 SmartOrder broadcast triggers** and **3 private Realtime message policies**.
- Supabase Security Advisor: **0 lints**. Performance Advisor: **0 WARN findings** (including unindexed-FK and auth-RLS-initplan warnings); 172 unused-index INFO notices remain and are not treated as a schema blocker on the new low-volume domain.
- FastAPI and TypeScript action registries: **130/130 matching action IDs**, no missing or extra IDs. SmartOrder router exposes **52 routes**.

### Engineering validation evidence and current rollout state

- API workflow `44846960218` passed: **100 Python tests**, Python compileall, Ruff, FastAPI container build, Web auth typecheck/lint, and Expo Sales typecheck/build.
- Portal workflow `44846605135` passed **8/8**: Customer, Principal, Supervisor, Super Admin, Company, Distributor, Sales and Website.
- Expo foundation workflow `44846605092` completed successfully, including Expo config resolution, Metro startup, Android/iOS bundle exports and the final Turborepo workspace build.
- Latest-code API workflow `44847089631` on commit `2848e2778a8fbc340fe18fa7676885cd0ae81fd0` passed **100 tests**, Python compileall, Ruff, Web auth typecheck/lint, and Expo Sales typecheck/build. The earlier intermediate migration-rename run that failed was superseded by the corrected filename/test commit and the successful latest run.
- Railway automatic rollout: `salesx-api` is `SUCCESS` on commit `2848e2778a8fbc340fe18fa7676885cd0ae81fd0`; runtime startup completed and `GET /readyz` returned **200 OK**. `salesx-customer` and `salesx-website` are `SUCCESS` on UI commit `0286cfe3b179d94c3e7767c4794c17ced94de1f5`. `salesx-company` is still `BUILDING` on that same UI commit; build logs show all included portal build commands progressing through image export, but there is no final deployment success yet. The four required Railway services remain the existing `salesx-api`, `salesx-website`, `salesx-customer` and `salesx-company`; no manual deployment or new service was created.
- No staging, Product Owner Acceptance, real-world test, demo data, or fabricated credentials were introduced. SMTP and Google OAuth provider secrets remain deferred to deployment as instructed.

### Remaining gate — Phase 05 stays IN_PROGRESS

1. Let the latest API workflow finish on the latest `main` commit and repair any newly surfaced implementation error.
2. Confirm the latest automatic Railway deployments for the four required services reach SUCCESS and API readiness is healthy.
3. Reconcile the phase tracker with the final workflow/deployment evidence.

No Phase 06 work is authorized by this status. Phase 06 — SmartReward remains LOCKED until Phase 05 meets its Definition of Done.
