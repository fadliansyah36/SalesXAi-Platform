-- Phase 08 deterministic daily aggregation refresh.
create or replace function public.analytics_refresh_daily_metrics(
  p_organization_id uuid,
  p_period_start date,
  p_period_end date
) returns bigint
language plpgsql
security definer
set search_path=pg_catalog,public
as $$
declare
  affected bigint := 0;
begin
  if p_organization_id is null or p_period_start is null or p_period_end is null
     or p_period_end < p_period_start or p_period_end-p_period_start > 366 then
    raise exception 'invalid_analytics_refresh_range' using errcode='22023';
  end if;

  delete from public.analytics_metric_snapshots
   where organization_id=p_organization_id
     and period_grain='day'
     and period_start between p_period_start and p_period_end
     and scope_type='tenant';

  insert into public.analytics_metric_snapshots
    (organization_id,metric_key,period_grain,period_start,period_end,scope_type,scope_id,
     metric_value,dimensions,source_watermark,calculated_at)
  with days as (
    select d::date as day_start from generate_series(p_period_start,p_period_end,interval '1 day') d
  ), metric_rows as (
    select d.day_start,'orders.count'::text metric_key,
      count(o.id)::numeric metric_value,
      max(coalesce(o.updated_at,o.created_at)) source_watermark
    from days d left join public.orders o
      on o.organization_id=p_organization_id
     and o.created_at>=d.day_start::timestamptz
     and o.created_at<(d.day_start+1)::timestamptz
     and o.status not in ('cancelled','expired','draft')
    group by d.day_start
    union all
    select d.day_start,'orders.gross_value',
      coalesce(sum(o.grand_total),0)::numeric,max(coalesce(o.updated_at,o.created_at))
    from days d left join public.orders o
      on o.organization_id=p_organization_id
     and o.created_at>=d.day_start::timestamptz
     and o.created_at<(d.day_start+1)::timestamptz
     and o.status not in ('cancelled','expired','draft')
    group by d.day_start
    union all
    select d.day_start,'visits.scheduled',count(v.id)::numeric,max(v.updated_at)
    from days d left join public.smartteam_visits v
      on v.organization_id=p_organization_id
     and v.scheduled_at>=d.day_start::timestamptz
     and v.scheduled_at<(d.day_start+1)::timestamptz
    group by d.day_start
    union all
    select d.day_start,'visits.completed',count(v.id)::numeric,max(v.updated_at)
    from days d left join public.smartteam_visits v
      on v.organization_id=p_organization_id
     and v.check_out_at>=d.day_start::timestamptz
     and v.check_out_at<(d.day_start+1)::timestamptz
    group by d.day_start
    union all
    select d.day_start,'visits.productive',count(v.id)::numeric,max(v.updated_at)
    from days d left join public.smartteam_visits v
      on v.organization_id=p_organization_id
     and v.check_out_at>=d.day_start::timestamptz
     and v.check_out_at<(d.day_start+1)::timestamptz
     and v.outcome='productive'
    group by d.day_start
    union all
    select d.day_start,'outlets.covered',count(distinct v.outlet_id)::numeric,max(v.updated_at)
    from days d left join public.smartteam_visits v
      on v.organization_id=p_organization_id
     and v.check_in_at>=d.day_start::timestamptz
     and v.check_in_at<(d.day_start+1)::timestamptz
     and v.check_out_at is not null
    group by d.day_start
    union all
    select d.day_start,'rewards.points_issued',
      coalesce(sum(greatest(l.points_delta,0)),0)::numeric,max(l.occurred_at)
    from days d left join public.reward_points_ledger l
      on l.organization_id=p_organization_id
     and l.occurred_at>=d.day_start::timestamptz
     and l.occurred_at<(d.day_start+1)::timestamptz
    group by d.day_start
    union all
    select d.day_start,'rewards.points_redeemed',
      coalesce(sum(r.points_reserved),0)::numeric,max(r.updated_at)
    from days d left join public.reward_redemptions r
      on r.organization_id=p_organization_id
     and r.fulfilled_at>=d.day_start::timestamptz
     and r.fulfilled_at<(d.day_start+1)::timestamptz
     and r.status='fulfilled'
    group by d.day_start
  )
  select p_organization_id,m.metric_key,'day',m.day_start,m.day_start,'tenant',null,
         m.metric_value,'{}'::jsonb,m.source_watermark,now()
  from metric_rows m;

  get diagnostics affected = row_count;

  insert into public.analytics_metric_snapshots
    (organization_id,metric_key,period_grain,period_start,period_end,scope_type,scope_id,
     metric_value,dimensions,source_watermark,calculated_at)
  select p_organization_id,'inventory.available','day',p_period_end,p_period_end,'tenant',null,
         coalesce(sum(ib.available),0)::numeric,'{}'::jsonb,max(ib.updated_at),now()
  from public.inventory_balances ib
  where ib.organization_id=p_organization_id
  on conflict do nothing;

  return affected+1;
end;
$$;

revoke all on function public.analytics_refresh_daily_metrics(uuid,date,date) from public,anon,authenticated;
grant execute on function public.analytics_refresh_daily_metrics(uuid,date,date) to service_role;
