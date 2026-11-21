begin;
create index if not exists reward_point_lots_expiry_due_idx
 on public.reward_point_lots(expires_at,created_at,id)
 where expires_at is not null and points_remaining>0;
create index if not exists reward_ledger_rule_period_idx
 on public.reward_points_ledger(organization_id,participant_user_id,(metadata->>'rule_id'),occurred_at)
 where entry_type='earn';
create index if not exists reward_ledger_org_period_idx
 on public.reward_points_ledger(organization_id,occurred_at desc);
create index if not exists reward_redemptions_catalog_user_period_idx
 on public.reward_redemptions(organization_id,catalog_item_id,participant_user_id,requested_at)
 where status<>'rejected';
create index if not exists reward_redemptions_catalog_period_idx
 on public.reward_redemptions(organization_id,catalog_item_id,requested_at)
 where status<>'rejected';
commit;