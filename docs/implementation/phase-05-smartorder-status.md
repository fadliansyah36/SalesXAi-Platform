# Phase 05 — SmartOrder execution status

Date: 2026-11-20  
Repository: `fadliansyah36/SalesXAi-Platform`  
Branch: `main`  
Supabase project: `eyofuiyxalbehbqoaeny`

## Status

**IN_PROGRESS — NOT COMPLETED.** Phase 05 remains the active phase. Phase 06 stays locked. The implementation already contains the SmartOrder domain and a broad same-tenant workflow, but cross-tenant commerce relationships and several lifecycle management operations still prevent a full end-to-end completion claim.

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
- Added focused tests for promotion calculation and SmartOrder request-schema validation.
- Added `20261120155706_p05_smartorder_foreign_key_indexes.sql` with 48 covering indexes for all Phase 05 foreign keys flagged by Performance Advisor. It is applied remotely and committed; existing historical migrations remain unchanged.

## Definition-of-done blockers

1. **Cross-tenant catalog-to-order/fulfillment path is not complete.** Catalog list visibility can include a product through `commerce_catalog_access`, but `cart_items` and `order_items` still use composite foreign keys tying product/SKU ownership to the cart/order organization. The cart insertion query also validates product ownership against the buyer tenant. `inventory_balances` and `fulfillments.warehouse_id` similarly bind product/warehouse to the order tenant. Consequently, a customer/distributor tenant cannot reliably order a principal-owned catalog SKU and fulfill it from a separate distributor warehouse. This requires an additive schema and service design for product-owner identity, inventory-owner/fulfillment organization, partner access checks, and order operations across the buyer/seller boundary.
2. Product/SKU master has create/publication lifecycle but not complete edit/archive APIs and portal workflows for all product and variant attributes.
3. Price lists and promotions have create/read/evaluation/history, but no complete update/deactivate lifecycle API and UI. Existing history triggers are present, but the complete management workflow is not.
4. Stock transfer and same-tenant order allocation are implemented; allocation across a separate distributor inventory owner is part of blocker 1.

These are implementation gaps inside Phase 05, not work deferred to Phase 06. Therefore Phase 05 must not be marked COMPLETED and Phase 06 must not be unlocked yet.

## Validation evidence and limitations

- Before this continuation, GitHub Actions API static job on commit `7dc325f9bcde7e1da7cc8e75d8f53ecb2da90e6e` passed **79 API tests**, Python compileall and Ruff. Portal build matrix and Expo foundation checks passed on the preceding SmartOrder source commit.
- This continuation adds 4 promotion-rule tests and 5 request-schema tests. Fresh CI for the final commit is required before claiming those checks passed.
- No live customer login/order, provider shipment, inventory movement, or real-world workflow test is claimed. No staging environment was created. No SMTP, Google OAuth, or shipping provider secret was added.
- Railway deployment was not triggered by this code continuation; do not infer that production services are running this new commit.

## Next execution

Continue Phase 05 with the cross-tenant catalog/cart/inventory/fulfillment data model and authorization path first, then complete product/SKU, price-list and promotion update/deactivation workflows. Keep the existing four Railway services and Supabase project. Do not start Phase 06 until these gaps are closed and final CI passes.
