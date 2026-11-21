begin;
update public.analytics_metric_definitions
set description='Points reserved for fulfilled reward redemptions',
    aggregation='sum',
    source_tables=array['reward_redemptions']::text[],
    updated_at=now()
where metric_key='rewards.points_redeemed';
commit;