begin;
alter table public.promotion_redemptions
  add column if not exists status text not null default 'redeemed',
  add column if not exists reversed_at timestamptz;
alter table public.promotion_redemptions
  alter column status set default 'reserved';
alter table public.promotion_redemptions
  drop constraint if exists promotion_redemptions_status_check;
alter table public.promotion_redemptions
  add constraint promotion_redemptions_status_check check(status in ('reserved','redeemed','reversed'));
create index if not exists promotion_redemptions_order_status_idx
  on public.promotion_redemptions(organization_id,order_id,status);
commit;
