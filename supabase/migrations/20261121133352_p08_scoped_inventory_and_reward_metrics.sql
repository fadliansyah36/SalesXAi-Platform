begin;
create or replace function public.analytics_refresh_scoped_aux_metrics(p_organization_id uuid,p_period_start date,p_period_end date)
returns bigint language plpgsql security definer set search_path=pg_catalog,public as $$
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
 (organization_id,metric_key,period_grain,period_start,period_end,scope_type,scope_id,metric_value,dimensions,source_watermark,calculated_at)
 select p_organization_id,'inventory.available','day',p_period_end,p_period_end,'branch',w.branch_id,
        sum(ib.available)::numeric,'{}'::jsonb,max(ib.updated_at),now()
 from public.inventory_balances ib
 join public.warehouses w on w.id=ib.warehouse_id and w.organization_id=ib.organization_id
 where ib.organization_id=p_organization_id and w.branch_id is not null
 group by w.branch_id;
 get diagnostics changed=row_count; affected:=affected+changed;
 with reward_events as (
  select l.occurred_at::date metric_day,'rewards.points_issued'::text metric_key,l.participant_user_id user_id,
         greatest(l.points_delta,0)::numeric metric_value,l.occurred_at watermark
  from public.reward_points_ledger l where l.organization_id=p_organization_id and l.participant_user_id is not null
    and l.occurred_at::date between p_period_start and p_period_end and l.points_delta>0
  union all
  select r.fulfilled_at::date,'rewards.points_redeemed',r.participant_user_id,r.points_reserved::numeric,r.updated_at
  from public.reward_redemptions r where r.organization_id=p_organization_id and r.participant_user_id is not null
    and r.fulfilled_at is not null and r.status='fulfilled' and r.fulfilled_at::date between p_period_start and p_period_end
 ), attributed as (
  select e.metric_day,e.metric_key,e.user_id,e.metric_value,e.watermark,m.branch_id,sp.team_id,sp.territory_id
  from reward_events e
  left join public.organization_memberships m on m.organization_id=p_organization_id and m.user_id=e.user_id and m.status='active'
  left join public.sales_profiles sp on sp.organization_id=p_organization_id and sp.user_id=e.user_id
 ), scoped as (
  select metric_day,metric_key,'user'::text scope_type,user_id scope_id,metric_value,watermark from attributed
  union all select metric_day,metric_key,'branch',branch_id,metric_value,watermark from attributed where branch_id is not null
  union all select metric_day,metric_key,'team',team_id,metric_value,watermark from attributed where team_id is not null
  union all select metric_day,metric_key,'territory',territory_id,metric_value,watermark from attributed where territory_id is not null
 )
 insert into public.analytics_metric_snapshots
 (organization_id,metric_key,period_grain,period_start,period_end,scope_type,scope_id,metric_value,dimensions,source_watermark,calculated_at)
 select p_organization_id,metric_key,'day',metric_day,metric_day,scope_type,scope_id,sum(metric_value),'{}'::jsonb,max(watermark),now()
 from scoped group by metric_day,metric_key,scope_type,scope_id;
 get diagnostics changed=row_count; affected:=affected+changed;
 return affected;
end; $$;
revoke all on function public.analytics_refresh_scoped_aux_metrics(uuid,date,date) from public,anon,authenticated;
grant execute on function public.analytics_refresh_scoped_aux_metrics(uuid,date,date) to service_role;
commit;