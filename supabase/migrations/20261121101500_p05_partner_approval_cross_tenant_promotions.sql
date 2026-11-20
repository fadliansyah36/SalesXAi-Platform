begin;

alter table public.promotions
  add column if not exists max_redemptions integer,
  add column if not exists max_per_customer integer;
alter table public.promotions
  drop constraint if exists promotions_max_redemptions_check,
  add constraint promotions_max_redemptions_check check(max_redemptions is null or max_redemptions>0),
  drop constraint if exists promotions_max_per_customer_check,
  add constraint promotions_max_per_customer_check check(max_per_customer is null or max_per_customer>0);

alter table public.promotion_redemptions
  add column if not exists promotion_owner_organization_id uuid,
  add column if not exists customer_organization_id uuid;
update public.promotion_redemptions pr
set promotion_owner_organization_id=p.organization_id,
    customer_organization_id=coalesce(o.customer_organization_id,o.organization_id)
from public.promotions p, public.orders o
where p.id=pr.promotion_id and p.organization_id=pr.organization_id
  and o.id=pr.order_id and o.organization_id=pr.organization_id
  and (pr.promotion_owner_organization_id is null or pr.customer_organization_id is null);
alter table public.promotion_redemptions
  alter column promotion_owner_organization_id set not null,
  alter column customer_organization_id set not null;
alter table public.promotion_redemptions
  drop constraint if exists promotion_redemptions_promotion_fk,
  add constraint promotion_redemptions_promotion_owner_fk
    foreign key(promotion_owner_organization_id,promotion_id)
    references public.promotions(organization_id,id) on delete restrict,
  drop constraint if exists promotion_redemptions_organization_id_promotion_id_order_id_key;
create unique index if not exists promotion_redemptions_owner_order_uq
  on public.promotion_redemptions(promotion_owner_organization_id,promotion_id,order_id);
create index if not exists promotion_redemptions_customer_limit_idx
  on public.promotion_redemptions(promotion_owner_organization_id,promotion_id,customer_organization_id,status);
create index if not exists promotions_active_code_idx
  on public.promotions(upper(code),status,starts_at,ends_at);

create table if not exists public.order_partner_decisions(
 id uuid primary key default gen_random_uuid(),
 organization_id uuid not null,
 order_id uuid not null,
 partner_organization_id uuid not null references public.organizations(id) on delete restrict,
 decision text not null check(decision in ('accepted','rejected','revision_requested')),
 reason text,
 actor_user_id uuid not null references public.profiles(id) on delete restrict,
 idempotency_key text not null check(length(btrim(idempotency_key)) between 8 and 180),
 decided_at timestamptz not null default now(),
 constraint order_partner_decisions_order_fk
  foreign key(organization_id,order_id) references public.orders(organization_id,id) on delete restrict,
 constraint order_partner_decisions_idempotency_uq
  unique(organization_id,order_id,partner_organization_id,idempotency_key),
 constraint order_partner_decisions_reason_required
  check(decision='accepted' or length(btrim(coalesce(reason,'')))>=3)
);
create index if not exists order_partner_decisions_latest_idx
 on public.order_partner_decisions(organization_id,order_id,partner_organization_id,decided_at desc,id desc);
create index if not exists order_partner_decisions_partner_idx
 on public.order_partner_decisions(partner_organization_id,decided_at desc);
alter table public.order_partner_decisions enable row level security;
drop policy if exists order_partner_decisions_deny_client on public.order_partner_decisions;
create policy order_partner_decisions_deny_client on public.order_partner_decisions
 for all to anon,authenticated using(false) with check(false);
revoke all on table public.order_partner_decisions from anon,authenticated;
grant select,insert on table public.order_partner_decisions to service_role;
revoke update,delete on table public.order_partner_decisions from service_role;

create or replace function public.smartorder_partner_decision_broadcast()
returns trigger language plpgsql security definer set search_path=pg_catalog,public,realtime as $$
declare event_payload jsonb;
begin
 event_payload:=jsonb_build_object(
  'resource','order_partner_decisions',
  'record_id',new.order_id,
  'operation','INSERT',
  'status',new.decision,
  'occurred_at',new.decided_at
 );
 perform realtime.send(event_payload||jsonb_build_object('organization_id',new.organization_id),
  'smartorder.changed','tenant:'||new.organization_id::text||':smartorder',true);
 perform realtime.send(event_payload||jsonb_build_object('organization_id',new.partner_organization_id),
  'smartorder.changed','tenant:'||new.partner_organization_id::text||':smartorder',true);
 return new;
end $$;
revoke all on function public.smartorder_partner_decision_broadcast() from public,anon,authenticated;
drop trigger if exists smartorder_partner_decision_broadcast on public.order_partner_decisions;
create trigger smartorder_partner_decision_broadcast
 after insert on public.order_partner_decisions
 for each row execute function public.smartorder_partner_decision_broadcast();

drop policy if exists smartorder_private_read on realtime.messages;
create policy smartorder_private_read on realtime.messages
 for select to authenticated
 using (
  extension='broadcast'
  and realtime.topic() ~ '^tenant:[0-9a-fA-F-]{36}:smartorder$'
  and exists(
   select 1
   from public.organization_memberships m
   join public.user_role_assignments ura
    on ura.membership_id=m.id and ura.revoked_at is null
    and ura.starts_at<=now() and (ura.expires_at is null or ura.expires_at>now())
   join public.role_permissions rp on rp.role_id=ura.role_id
   where m.user_id=auth.uid() and m.status='active'
    and m.organization_id=split_part(realtime.topic(),':',2)::uuid
    and rp.permission_key=any(array[
      'commerce:catalog:read','commerce:order:read','commerce:order:approve',
      'commerce:order:operations:read','commerce:inventory:read','commerce:cart:read'
    ])
  )
 );

commit;