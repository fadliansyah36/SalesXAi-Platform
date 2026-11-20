begin;
alter table public.orders
  add column if not exists expires_at timestamptz not null default (now() + interval '24 hours');
alter table public.orders drop constraint if exists orders_status_check;
alter table public.orders add constraint orders_status_check
  check(status=any(array['draft','submitted','pending_approval','revision_requested','approved','rejected','processing','fulfilled','completed','cancelled','expired']::text[]));
create index if not exists orders_draft_expiry_idx
  on public.orders(organization_id,expires_at) where status='draft';
commit;
