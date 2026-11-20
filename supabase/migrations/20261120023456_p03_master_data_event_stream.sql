create or replace function private.broadcast_master_data_change()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, public, realtime
as $$
declare
  v_org_id uuid;
  v_record_id uuid;
  v_status text;
  v_topic text;
  v_payload jsonb;
begin
  if TG_OP = 'DELETE' then
    v_org_id := OLD.organization_id;
    v_record_id := OLD.id;
    v_status := null;
  else
    v_org_id := NEW.organization_id;
    v_record_id := NEW.id;
    v_status := to_jsonb(NEW)->>'status';
  end if;
  v_topic := 'tenant:' || v_org_id::text || ':master-data';
  v_payload := jsonb_build_object(
    'organization_id',v_org_id,
    'resource',TG_TABLE_NAME,
    'record_id',v_record_id,
    'operation',TG_OP,
    'status',v_status,
    'occurred_at',clock_timestamp()
  );
  perform pg_notify('salesx_master_data',v_payload::text);
  perform realtime.send(v_payload,'master_data.changed',v_topic,true);
  return null;
end;
$$;
revoke all on function private.broadcast_master_data_change() from public,anon,authenticated;
