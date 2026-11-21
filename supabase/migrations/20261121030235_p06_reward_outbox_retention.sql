begin;
create or replace function public.prune_reward_event_outbox(
 p_retention interval default interval '30 days',
 p_limit integer default 10000
)
returns integer
language plpgsql
security definer
set search_path=pg_catalog,public
as $$
declare removed integer:=0;
begin
 with doomed as (
  select id from public.reward_event_outbox
  where occurred_at<now()-greatest(p_retention,interval '7 days')
  order by occurred_at,id
  for update skip locked
  limit greatest(1,least(p_limit,50000))
 )
 delete from public.reward_event_outbox e using doomed d where e.id=d.id;
 get diagnostics removed=row_count;
 return removed;
end
$$;
revoke all on function public.prune_reward_event_outbox(interval,integer) from public,anon,authenticated;
grant execute on function public.prune_reward_event_outbox(interval,integer) to service_role;
select cron.unschedule(jobid) from cron.job where jobname='salesx_reward_outbox_retention';
select cron.schedule('salesx_reward_outbox_retention','30 0 * * *',
 $$select public.prune_reward_event_outbox(interval '30 days',10000)$$);
commit;