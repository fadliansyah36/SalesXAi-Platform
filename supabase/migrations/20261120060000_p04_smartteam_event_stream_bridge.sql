create or replace function public.smartteam_broadcast_change()
returns trigger
language plpgsql
security definer
set search_path=pg_catalog,public,realtime
as $$
declare
 org_id uuid;
 record_id uuid;
 record_status text;
 resource_name text;
 event_payload jsonb;
begin
 if TG_OP='DELETE' then
  org_id:=old.organization_id;
  record_id:=old.id;
  record_status:=null;
 else
  org_id:=new.organization_id;
  record_id:=new.id;
  if TG_TABLE_NAME='smartteam_shifts' then record_status:=new.status;
  elsif TG_TABLE_NAME='smartteam_visits' then record_status:=new.status;
  elsif TG_TABLE_NAME='smartteam_activities' then record_status:=new.status;
  else record_status:=null; end if;
 end if;
 resource_name:=TG_TABLE_NAME;
 event_payload:=jsonb_build_object(
  'organization_id',org_id,
  'resource',resource_name,
  'record_id',record_id,
  'operation',TG_OP,
  'status',record_status,
  'occurred_at',now()
 );
 perform realtime.send(event_payload,'smartteam.changed','tenant:'||org_id::text||':smartteam',true);
 perform pg_notify('salesx_smartteam',event_payload::text);
 if TG_OP='DELETE' then return old; end if;
 return new;
end $$;
revoke all on function public.smartteam_broadcast_change() from public,anon,authenticated;
