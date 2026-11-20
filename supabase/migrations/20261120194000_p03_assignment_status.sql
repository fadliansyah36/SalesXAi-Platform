-- Explicit lifecycle status for each immutable outlet assignment-history record.
alter table public.outlet_assignment_history
  add column if not exists assignment_status text not null default 'active';
update public.outlet_assignment_history
set assignment_status = case when unassigned_at is null then 'active' else 'unassigned' end;
do $$
begin
  if not exists (select 1 from pg_constraint where conname='outlet_assignment_status_check') then
    alter table public.outlet_assignment_history
      add constraint outlet_assignment_status_check
      check (assignment_status in ('active','unassigned'));
  end if;
end $$;
create index if not exists outlet_assignment_active_status_idx
  on public.outlet_assignment_history(organization_id,outlet_id,assignment_status,assigned_at desc);
