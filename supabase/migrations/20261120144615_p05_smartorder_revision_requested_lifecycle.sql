begin;
alter table public.orders drop constraint if exists orders_status_check;
alter table public.orders add constraint orders_status_check check(status=any(array['draft','submitted','pending_approval','revision_requested','approved','rejected','processing','fulfilled','completed','cancelled']::text[]));
commit;
