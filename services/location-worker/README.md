# Location Worker

Python worker boundary for Phase 07 GPS ingestion, PostGIS projections, geofence processing and route-history jobs. It consumes durable server-side jobs/events, is idempotent and tenant-scoped, and never accepts direct client writes to business tables. Runtime code, queue lifecycle, environment schema, health checks and deployment are delivered in Phase 07.
