-- Attribute order and reward events to the sales profile effective on the event date.
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
  join lateral (
    select sp.* from public.sales_profiles sp
    where sp.user_id=c.owner_user_id and sp.organization_id=o.organization_id
      and sp.effective_from<=o.created_at::date
      and (sp.effective_until is null or sp.effective_until>=o.created_at::date)
    order by sp.effective_from desc,sp.created_at desc limit 1
  ) sp on true
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
CREATE OR REPLACE FUNCTION public.analytics_refresh_scoped_aux_metrics(p_organization_id uuid, p_period_start date, p_period_end date)
 RETURNS bigint
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog', 'public'
AS $function$
declare affected bigint:=0; changed bigint:=0;
begin
 if p_organization_id is null or p_period_start is null or p_period_end is null
 or p_period_end<p_period_start or p_period_end-p_period_start>366 then
  raise exception 'invalid_scoped_aux_analytics_range' using errcode='22023';
 end if;
 delete from public.analytics_metric_snapshots where organization_id=p_organization_id
 and period_grain='day' and period_start between p_period_start and p_period_end
 and ((metric_key='inventory.available' and scope_type='branch')
   or metric_key in ('rewards.points_issued','rewards.points_redeemed'));

 insert into public.analytics_metric_snapshots
 (organization_id,metric_key,period_grain,period_start,period_end,scope_type,scope_id,
  metric_value,dimensions,source_watermark,calculated_at)
 select p_organization_id,'inventory.available','day',p_period_end,p_period_end,'branch',w.branch_id,
        sum(ib.available)::numeric,'{}'::jsonb,max(ib.updated_at),now()
 from public.inventory_balances ib
 join public.warehouses w on w.id=ib.warehouse_id and w.organization_id=ib.organization_id
 where ib.organization_id=p_organization_id and w.branch_id is not null
 group by w.branch_id;
 get diagnostics changed=row_count; affected:=affected+changed;

 with reward_events as (
  select l.occurred_at::date metric_day,'rewards.points_issued'::text metric_key,
         l.participant_user_id user_id,greatest(l.points_delta,0)::numeric metric_value,l.occurred_at watermark
  from public.reward_points_ledger l
  where l.organization_id=p_organization_id and l.participant_user_id is not null
    and l.occurred_at::date between p_period_start and p_period_end and l.points_delta>0
  union all
  select r.fulfilled_at::date,'rewards.points_redeemed',r.participant_user_id,
         r.points_reserved::numeric,r.updated_at
  from public.reward_redemptions r
  where r.organization_id=p_organization_id and r.participant_user_id is not null
    and r.fulfilled_at is not null and r.status='fulfilled'
    and r.fulfilled_at::date between p_period_start and p_period_end
 ), attributed as (
  select e.metric_day,e.metric_key,e.user_id,e.metric_value,e.watermark,
         m.branch_id,sp.team_id,sp.territory_id
  from reward_events e
  left join lateral (
    select sp.* from public.sales_profiles sp
    where sp.organization_id=p_organization_id and sp.user_id=e.user_id
      and sp.effective_from<=e.metric_day
      and (sp.effective_until is null or sp.effective_until>=e.metric_day)
    order by sp.effective_from desc,sp.created_at desc limit 1
  ) sp on true
  left join public.organization_memberships m
    on m.id=sp.membership_id and m.organization_id=p_organization_id
 ), scoped as (
  select metric_day,metric_key,'user'::text scope_type,user_id scope_id,metric_value,watermark from attributed
  union all
  select metric_day,metric_key,'branch',branch_id,metric_value,watermark from attributed where branch_id is not null
  union all
  select metric_day,metric_key,'team',team_id,metric_value,watermark from attributed where team_id is not null
  union all
  select metric_day,metric_key,'territory',territory_id,metric_value,watermark from attributed where territory_id is not null
 )
 insert into public.analytics_metric_snapshots
 (organization_id,metric_key,period_grain,period_start,period_end,scope_type,scope_id,
  metric_value,dimensions,source_watermark,calculated_at)
 select p_organization_id,metric_key,'day',metric_day,metric_day,scope_type,scope_id,
        sum(metric_value),'{}'::jsonb,max(watermark),now()
 from scoped group by metric_day,metric_key,scope_type,scope_id;
 get diagnostics changed=row_count; affected:=affected+changed;
 return affected;
end; $function$
;
revoke all on function public.analytics_refresh_scoped_aux_metrics(uuid,date,date) from public,anon,authenticated;
grant execute on function public.analytics_refresh_scoped_aux_metrics(uuid,date,date) to service_role;
commit;