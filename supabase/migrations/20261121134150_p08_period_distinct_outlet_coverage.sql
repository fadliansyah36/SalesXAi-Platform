-- Correct weekly/monthly outlet coverage to use period-level distinct outlet counts.
begin;
CREATE OR REPLACE FUNCTION public.analytics_refresh_period_rollups(p_organization_id uuid, p_period_start date, p_period_end date)
 RETURNS bigint
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog', 'public'
AS $function$
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
    and d.metric_key not in ('inventory.available','outlets.covered')
  group by d.metric_key,date_trunc('week',d.period_start)::date,d.scope_type,d.scope_id;
  get diagnostics changed = row_count;
  affected := affected + changed;

  insert into public.analytics_metric_snapshots
    (organization_id,metric_key,period_grain,period_start,period_end,scope_type,scope_id,
     metric_value,dimensions,source_watermark,calculated_at)
  with visit_scopes as (
    select date_trunc('week',v.check_in_at)::date period_start,'tenant'::text scope_type,
           null::uuid scope_id,v.outlet_id,v.updated_at
    from public.smartteam_visits v
    where v.organization_id=p_organization_id and v.check_in_at is not null and v.check_out_at is not null
      and v.check_in_at::date between p_period_start and p_period_end
    union all
    select date_trunc('week',v.check_in_at)::date,'branch',coalesce(v.branch_id,m.branch_id),v.outlet_id,v.updated_at
    from public.smartteam_visits v
    join public.sales_profiles sp on sp.id=v.sales_profile_id and sp.organization_id=v.organization_id
    left join public.organization_memberships m on m.id=sp.membership_id and m.organization_id=sp.organization_id
    where v.organization_id=p_organization_id and v.check_in_at is not null and v.check_out_at is not null
      and v.check_in_at::date between p_period_start and p_period_end and coalesce(v.branch_id,m.branch_id) is not null
    union all
    select date_trunc('week',v.check_in_at)::date,'team',v.team_id,v.outlet_id,v.updated_at
    from public.smartteam_visits v where v.organization_id=p_organization_id and v.check_in_at is not null
      and v.check_out_at is not null and v.team_id is not null and v.check_in_at::date between p_period_start and p_period_end
    union all
    select date_trunc('week',v.check_in_at)::date,'territory',sp.territory_id,v.outlet_id,v.updated_at
    from public.smartteam_visits v join public.sales_profiles sp on sp.id=v.sales_profile_id and sp.organization_id=v.organization_id
    where v.organization_id=p_organization_id and v.check_in_at is not null and v.check_out_at is not null
      and sp.territory_id is not null and v.check_in_at::date between p_period_start and p_period_end
    union all
    select date_trunc('week',v.check_in_at)::date,'user',sp.user_id,v.outlet_id,v.updated_at
    from public.smartteam_visits v join public.sales_profiles sp on sp.id=v.sales_profile_id and sp.organization_id=v.organization_id
    where v.organization_id=p_organization_id and v.check_in_at is not null and v.check_out_at is not null
      and sp.user_id is not null and v.check_in_at::date between p_period_start and p_period_end
  )
  select p_organization_id,'outlets.covered','week',period_start,period_start+6,scope_type,scope_id,
         count(distinct outlet_id)::numeric,'{}'::jsonb,max(updated_at),now()
  from visit_scopes group by period_start,scope_type,scope_id;
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
    and d.metric_key not in ('inventory.available','outlets.covered')
  group by d.metric_key,date_trunc('month',d.period_start)::date,d.scope_type,d.scope_id;
  get diagnostics changed = row_count;
  affected := affected + changed;

  insert into public.analytics_metric_snapshots
    (organization_id,metric_key,period_grain,period_start,period_end,scope_type,scope_id,
     metric_value,dimensions,source_watermark,calculated_at)
  with visit_scopes as (
    select date_trunc('month',v.check_in_at)::date period_start,'tenant'::text scope_type,
           null::uuid scope_id,v.outlet_id,v.updated_at
    from public.smartteam_visits v
    where v.organization_id=p_organization_id and v.check_in_at is not null and v.check_out_at is not null
      and v.check_in_at::date between p_period_start and p_period_end
    union all
    select date_trunc('month',v.check_in_at)::date,'branch',coalesce(v.branch_id,m.branch_id),v.outlet_id,v.updated_at
    from public.smartteam_visits v
    join public.sales_profiles sp on sp.id=v.sales_profile_id and sp.organization_id=v.organization_id
    left join public.organization_memberships m on m.id=sp.membership_id and m.organization_id=sp.organization_id
    where v.organization_id=p_organization_id and v.check_in_at is not null and v.check_out_at is not null
      and v.check_in_at::date between p_period_start and p_period_end and coalesce(v.branch_id,m.branch_id) is not null
    union all
    select date_trunc('month',v.check_in_at)::date,'team',v.team_id,v.outlet_id,v.updated_at
    from public.smartteam_visits v where v.organization_id=p_organization_id and v.check_in_at is not null
      and v.check_out_at is not null and v.team_id is not null and v.check_in_at::date between p_period_start and p_period_end
    union all
    select date_trunc('month',v.check_in_at)::date,'territory',sp.territory_id,v.outlet_id,v.updated_at
    from public.smartteam_visits v join public.sales_profiles sp on sp.id=v.sales_profile_id and sp.organization_id=v.organization_id
    where v.organization_id=p_organization_id and v.check_in_at is not null and v.check_out_at is not null
      and sp.territory_id is not null and v.check_in_at::date between p_period_start and p_period_end
    union all
    select date_trunc('month',v.check_in_at)::date,'user',sp.user_id,v.outlet_id,v.updated_at
    from public.smartteam_visits v join public.sales_profiles sp on sp.id=v.sales_profile_id and sp.organization_id=v.organization_id
    where v.organization_id=p_organization_id and v.check_in_at is not null and v.check_out_at is not null
      and sp.user_id is not null and v.check_in_at::date between p_period_start and p_period_end
  )
  select p_organization_id,'outlets.covered','month',period_start,
         (period_start+interval '1 month - 1 day')::date,scope_type,scope_id,
         count(distinct outlet_id)::numeric,'{}'::jsonb,max(updated_at),now()
  from visit_scopes group by period_start,scope_type,scope_id;
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
$function$

revoke all on function public.analytics_refresh_period_rollups(uuid,date,date) from public,anon,authenticated;
grant execute on function public.analytics_refresh_period_rollups(uuid,date,date) to service_role;
commit;