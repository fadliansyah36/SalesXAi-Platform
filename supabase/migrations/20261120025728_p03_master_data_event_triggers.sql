-- Deliver only minimal tenant/resource identifiers to private Realtime Broadcast
-- and the authenticated FastAPI SSE invalidation bridge after committed writes.
do $$
declare
  target_table text;
begin
  foreach target_table in array array['branches','teams','territories','outlets','sales_profiles','outlet_assignment_history']
  loop
    execute format('drop trigger if exists %I on public.%I', 'salesx_master_data_broadcast', target_table);
    execute format(
      'create trigger %I after insert or update or delete on public.%I for each row execute function private.broadcast_master_data_change()',
      'salesx_master_data_broadcast', target_table
    );
  end loop;
end $$;
