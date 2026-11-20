begin;
create table if not exists public.shipping_provider_events (
 id uuid primary key default gen_random_uuid(),
 organization_id uuid not null references public.organizations(id) on delete restrict,
 provider text not null,
 provider_event_id text not null,
 tracking_number text not null,
 event_type text not null check(event_type in ('delivered','failed')),
 payload jsonb not null default '{}'::jsonb check(jsonb_typeof(payload)='object'),
 received_at timestamptz not null default now(),
 processed_at timestamptz,
 unique(provider,provider_event_id),
 unique(organization_id,id)
);
create index if not exists shipping_provider_events_order_idx
 on public.shipping_provider_events(organization_id,tracking_number,received_at desc);
grant select,insert,update on public.shipping_provider_events to service_role;
commit;
