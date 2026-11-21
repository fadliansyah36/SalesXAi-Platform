-- Phase 08: materialize weekly and monthly rollups from canonical daily snapshots.
begin;
create or replace function public.analytics_refresh_period_rollups(
  p_organization_id uuid, p_period_start date, p_period_end date
) returns bigint
language plpgsql security definer set search_path=pg_catalog,public
as $$
declare
  affected bigint := 0;
  changed bigint := 0;
  weekly_start date;
  weekly_end date;
  monthly_start date;
  monthly_end date;
begin
  if p_organization_id is null or p_period_start is null or p_period_end is null
     or p_period_end < p_period_start or p_period_end-p_period_start > 366 then
    raise exception 'invalid_analytics_rollup_range' using errcode='22023';
  end if;
  weekly_start := date_trunc('week',p_period_start)::date;
  weekly_end := date_trunc('week',p_period_end)::date;
  monthly_start := date_trunc('month',p_period_start)::date;
  monthly_end := date_trunc('month',p_period_end)::date;

  delete from public.analytics_metric_snapshots
   where organization_id=p_organization_id and period_grain='week'
     and period_start between weekly_start and weekly_end;

  insert into public.analytics_metric_snapshots
    (organization_id,metric_key,period_grain,period_start,period_end,scope_type,scope_id,
     metric_value,dimensions,source_watermark,calculated_at)
  select p_organization_id,d.metric_key,'week',date_trunc('week',d.period_start)::date,
         date_trunc('week',d.period_start)::date+6,d.scope_type,d.scope_id,
         sum(d.metric_value),'{}'::jsonb,max(d.source_watermark),now()
  from public.analytics_metric_snapshots d
  where d.organization_id=p_organization_id and d.period_grain='day'
    and d.period_start between p_period_start and p_period_end
    and d.metric_key<>'inventory.available'
  group by d.metric_key,date_trunc('week',d.period_start)::date,d.scope_type,d.scope_id;
  get diagnostics changed = row_count;
  affected := affected + changed;

  insert into public.analytics_metric_snapshots
    (organization_id,metric_key,period_grain,period_start,period_end,scope_type,scope_id,
     metric_value,dimensions,source_watermark,calculated_at)
  select p_organization_id,'inventory.available','week',
         date_trunc('week',d.period_start)::date,date_trunc('week',d.period_start)::date+6,
         d.scope_type,d.scope_id,d.metric_value,'{}'::jsonb,d.source_watermark,now()
  from (
    select distinct on (date_trunc('week',period_start)::date,scope_type,scope_id)
           period_start,metric_value,scope_type,scope_id,source_watermark
    from public.analytics_metric_snapshots
    where organization_id=p_organization_id and period_grain='day'
      and metric_key='inventory.available'
      and period_start between p_period_start and p_period_end
    order by date_trunc('week',period_start)::date,scope_type,scope_id,period_start desc
  ) d;
  get diagnostics changed = row_count;
  affected := affected + changed;

  delete from public.analytics_metric_snapshots
   where organization_id=p_organization_id and period_grain='month'
     and period_start between monthly_start and monthly_end;

  insert into public.analytics_metric_snapshots
    (organization_id,metric_key,period_grain,period_start,period_end,scope_type,scope_id,
     metric_value,dimensions,source_watermark,calculated_at)
  select p_organization_id,d.metric_key,'month',date_trunc('month',d.period_start)::date,
         (date_trunc('month',d.period_start)::date+interval '1 month - 1 day')::date,
         d.scope_type,d.scope_id,sum(d.metric_value),'{}'::jsonb,max(d.source_watermark),now()
  from public.analytics_metric_snapshots d
  where d.organization_id=p_organization_id and d.period_grain='day'
    and d.period_start between p_period_start and p_period_end
    and d.metric_key<>'inventory.available'
  group by d.metric_key,date_trunc('month',d.period_start)::date,d.scope_type,d.scope_id;
  get diagnostics changed = row_count;
  affected := affected + changed;

  insert into public.analytics_metric_snapshots
    (organization_id,metric_key,period_grain,period_start,period_end,scope_type,scope_id,
     metric_value,dimensions,source_watermark,calculated_at)
  select p_organization_id,'inventory.available','month',
         date_trunc('month',d.period_start)::date,
         (date_trunc('month',d.period_start)::date+interval '1 month - 1 day')::date,
         d.scope_type,d.scope_id,d.metric_value,'{}'::jsonb,d.source_watermark,now()
  from (
    select distinct on (date_trunc('month',period_start)::date,scope_type,scope_id)
           period_start,metric_value,scope_type,scope_id,source_watermark
    from public.analytics_metric_snapshots
    where organization_id=p_organization_id and period_grain='day'
      and metric_key='inventory.available'
      and period_start between p_period_start and p_period_end
    order by date_trunc('month',period_start)::date,scope_type,scope_id,period_start desc
  ) d;
  get diagnostics changed = row_count;
  affected := affected + changed;
  return affected;
end;
$$;
revoke all on function public.analytics_refresh_period_rollups(uuid,date,date) from public,anon,authenticated;
grant execute on function public.analytics_refresh_period_rollups(uuid,date,date) to service_role;
commit;