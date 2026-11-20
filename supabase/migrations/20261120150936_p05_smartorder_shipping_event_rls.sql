begin;
alter table public.shipping_provider_events enable row level security;
drop policy if exists shipping_provider_events_deny_client on public.shipping_provider_events;
create policy shipping_provider_events_deny_client
 on public.shipping_provider_events for all to anon,authenticated
 using (false) with check (false);
revoke all on table public.shipping_provider_events from anon,authenticated;
grant select,insert,update on table public.shipping_provider_events to service_role;
commit;
