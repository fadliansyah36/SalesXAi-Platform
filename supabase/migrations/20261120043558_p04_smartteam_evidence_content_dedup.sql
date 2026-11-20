-- Phase 04 hardening: make evidence retries idempotent per visit and content digest.
-- A field client may retry after a lost response; the same evidence must not create duplicate rows.
create unique index if not exists smartteam_visit_evidence_content_uidx
  on public.smartteam_visit_evidence (organization_id, visit_id, sha256);

comment on index public.smartteam_visit_evidence_content_uidx is
  'Deduplicates repeated visit evidence uploads by tenant, visit and SHA-256 content digest.';
