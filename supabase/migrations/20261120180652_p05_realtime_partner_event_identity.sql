begin;
create or replace function public.smartorder_partner_decision_broadcast()
returns trigger language plpgsql security definer set search_path=pg_catalog,public,realtime as $$
declare event_payload jsonb;
begin
 event_payload:=jsonb_build_object('event_id',gen_random_uuid(),'resource','order_partner_decisions','record_id',new.order_id,
  'operation','INSERT','status',new.decision,'occurred_at',new.decided_at);
 perform realtime.send(event_payload||jsonb_build_object('organization_id',new.organization_id),
  'smartorder.changed','tenant:'||new.organization_id::text||':smartorder',true);
 perform realtime.send(event_payload||jsonb_build_object('organization_id',new.partner_organization_id),
  'smartorder.changed','tenant:'||new.partner_organization_id::text||':smartorder',true);
 return new;
end $$;
revoke all on function public.smartorder_partner_decision_broadcast() from public,anon,authenticated;
commit;