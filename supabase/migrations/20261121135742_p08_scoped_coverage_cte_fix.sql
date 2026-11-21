-- Fix scoped daily coverage CTE lifetime by recomputing coverage rows for the second insert.
begin;
CREATE OR REPLACE FUNCTION public.analytics_refresh_scoped_daily_metrics(p_organization_id uuid, p_period_start date, p_period_end date)
 RETURNS bigint
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog', 'public'
AS $function$
declare affected bigint:=0; changed bigint:=0;
begin
 if p_organization_id is null or p_period_start is null or p_period_end is null
 or p_period_end<p_period_start or p_period_end-p_period_start>366 then
  raise exception 'invalid_scoped_analytics_range' using errcode='22023';
 end if;
 delete from public.analytics_metric_snapshots where organization_id=p_organization_id
 and period_grain='day' and period_start between p_period_start and p_period_end and scope_type<>'tenant';

 with visit_events as (
  select v.organization_id,v.scheduled_at::date metric_day,'visits.scheduled'::text metric_key,
         coalesce(v.branch_id,m.branch_id) branch_id,v.team_id,sp.territory_id,sp.user_id,
         1::numeric metric_value,v.updated_at watermark
  from public.smartteam_visits v
  join public.sales_profiles sp on sp.id=v.sales_profile_id and sp.organization_id=v.organization_id
  left join public.organization_memberships m on m.id=sp.membership_id and m.organization_id=sp.organization_id
  where v.organization_id=p_organization_id and v.scheduled_at::date between p_period_start and p_period_end
  union all
  select v.organization_id,v.check_out_at::date,'visits.completed',
         coalesce(v.branch_id,m.branch_id),v.team_id,sp.territory_id,sp.user_id,1::numeric,v.updated_at
  from public.smartteam_visits v
  join public.sales_profiles sp on sp.id=v.sales_profile_id and sp.organization_id=v.organization_id
  left join public.organization_memberships m on m.id=sp.membership_id and m.organization_id=sp.organization_id
  where v.organization_id=p_organization_id and v.check_out_at is not null
  and v.check_out_at::date between p_period_start and p_period_end
  union all
  select v.organization_id,v.check_out_at::date,'visits.productive',
         coalesce(v.branch_id,m.branch_id),v.team_id,sp.territory_id,sp.user_id,1::numeric,v.updated_at
  from public.smartteam_visits v
  join public.sales_profiles sp on sp.id=v.sales_profile_id and sp.organization_id=v.organization_id
  left join public.organization_memberships m on m.id=sp.membership_id and m.organization_id=sp.organization_id
  where v.organization_id=p_organization_id and v.check_out_at is not null and v.outcome='productive'
  and v.check_out_at::date between p_period_start and p_period_end
 ), visit_scopes as (
  select organization_id,metric_day,metric_key,'branch'::text scope_type,branch_id scope_id,metric_value,watermark from visit_events where branch_id is not null
  union all select organization_id,metric_day,metric_key,'team',team_id,metric_value,watermark from visit_events where team_id is not null
  union all select organization_id,metric_day,metric_key,'territory',territory_id,metric_value,watermark from visit_events where territory_id is not null
  union all select organization_id,metric_day,metric_key,'user',user_id,metric_value,watermark from visit_events where user_id is not null
 ), coverage_events as (
  select v.organization_id,v.check_in_at::date metric_day,v.outlet_id,coalesce(v.branch_id,m.branch_id) branch_id,
         v.team_id,sp.territory_id,sp.user_id,v.updated_at watermark
  from public.smartteam_visits v
  join public.sales_profiles sp on sp.id=v.sales_profile_id and sp.organization_id=v.organization_id
  left join public.organization_memberships m on m.id=sp.membership_id and m.organization_id=sp.organization_id
  where v.organization_id=p_organization_id and v.check_in_at is not null and v.check_out_at is not null
  and v.check_in_at::date between p_period_start and p_period_end
 ), coverage_scopes as (
  select organization_id,metric_day,'outlets.covered'::text metric_key,'branch'::text scope_type,branch_id scope_id,outlet_id,watermark from coverage_events where branch_id is not null
  union all select organization_id,metric_day,'outlets.covered','team',team_id,outlet_id,watermark from coverage_events where team_id is not null
  union all select organization_id,metric_day,'outlets.covered','territory',territory_id,outlet_id,watermark from coverage_events where territory_id is not null
  union all select organization_id,metric_day,'outlets.covered','user',user_id,outlet_id,watermark from coverage_events where user_id is not null
 ), order_events as (
  select o.organization_id,o.created_at::date metric_day,o.grand_total,m.branch_id,sp.team_id,sp.territory_id,sp.user_id,
         coalesce(o.updated_at,o.created_at) watermark
  from public.orders o join public.carts c on c.id=o.cart_id and c.organization_id=o.organization_id
  join public.sales_profiles sp on sp.user_id=c.owner_user_id and sp.organization_id=o.organization_id
  left join public.organization_memberships m on m.id=sp.membership_id and m.organization_id=sp.organization_id
  where o.organization_id=p_organization_id and o.created_at::date between p_period_start and p_period_end
  and o.status not in ('cancelled','expired','draft')
 ), order_scopes as (
  select organization_id,metric_day,'orders.count'::text metric_key,'branch'::text scope_type,branch_id scope_id,1::numeric metric_value,watermark from order_events where branch_id is not null
  union all select organization_id,metric_day,'orders.count','team',team_id,1::numeric,watermark from order_events where team_id is not null
  union all select organization_id,metric_day,'orders.count','territory',territory_id,1::numeric,watermark from order_events where territory_id is not null
  union all select organization_id,metric_day,'orders.count','user',user_id,1::numeric,watermark from order_events where user_id is not null
  union all select organization_id,metric_day,'orders.gross_value','branch',branch_id,grand_total,watermark from order_events where branch_id is not null
  union all select organization_id,metric_day,'orders.gross_value','team',team_id,grand_total,watermark from order_events where team_id is not null
  union all select organization_id,metric_day,'orders.gross_value','territory',territory_id,grand_total,watermark from order_events where territory_id is not null
  union all select organization_id,metric_day,'orders.gross_value','user',user_id,grand_total,watermark from order_events where user_id is not null
 ), summed as (
  select metric_day,metric_key,scope_type,scope_id,sum(metric_value) metric_value,max(watermark) watermark
  from (select metric_day,metric_key,scope_type,scope_id,metric_value,watermark from visit_scopes
        union all select metric_day,metric_key,scope_type,scope_id,metric_value,watermark from order_scopes) x
  group by metric_day,metric_key,scope_type,scope_id
 )
 insert into public.analytics_metric_snapshots
 (organization_id,metric_key,period_grain,period_start,period_end,scope_type,scope_id,metric_value,dimensions,source_watermark,calculated_at)
 select p_organization_id,metric_key,'day',metric_day,metric_day,scope_type,scope_id,metric_value,'{}'::jsonb,watermark,now() from summed;
 get diagnostics changed=row_count; affected:=affected+changed;

 with coverage_events as (
  select v.organization_id,v.check_in_at::date metric_day,v.outlet_id,coalesce(v.branch_id,m.branch_id) branch_id,
         v.team_id,sp.territory_id,sp.user_id,v.updated_at watermark
  from public.smartteam_visits v
  join public.sales_profiles sp on sp.id=v.sales_profile_id and sp.organization_id=v.organization_id
  left join public.organization_memberships m on m.id=sp.membership_id and m.organization_id=sp.organization_id
  where v.organization_id=p_organization_id and v.check_in_at is not null and v.check_out_at is not null
    and v.check_in_at::date between p_period_start and p_period_end
 ), coverage_scopes as (
  select organization_id,metric_day,'outlets.covered'::text metric_key,'branch'::text scope_type,branch_id scope_id,outlet_id,watermark from coverage_events where branch_id is not null
  union all select organization_id,metric_day,'outlets.covered','team',team_id,outlet_id,watermark from coverage_events where team_id is not null
  union all select organization_id,metric_day,'outlets.covered','territory',territory_id,outlet_id,watermark from coverage_events where territory_id is not null
  union all select organization_id,metric_day,'outlets.covered','user',user_id,outlet_id,watermark from coverage_events where user_id is not null
 )
 insert into public.analytics_metric_snapshots
 (organization_id,metric_key,period_grain,period_start,period_end,scope_type,scope_id,metric_value,dimensions,source_watermark,calculated_at)
 select p_organization_id,metric_key,'day',metric_day,metric_day,scope_type,scope_id,
        count(distinct outlet_id)::numeric,'{}'::jsonb,max(watermark),now()
 from coverage_scopes group by metric_key,metric_day,scope_type,scope_id;
 get diagnostics changed=row_count; affected:=affected+changed;
 return affected;
end; $function$
;
revoke all on function public.analytics_refresh_scoped_daily_metrics(uuid,date,date) from public,anon,authenticated;
grant execute on function public.analytics_refresh_scoped_daily_metrics(uuid,date,date) to service_role;
commit;