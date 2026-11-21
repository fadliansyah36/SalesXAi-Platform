-- Local Supabase test fixture only. Run with `supabase test db` against an isolated local database.
-- Every inserted record is rolled back. Never apply this fixture as a production migration.
begin;
do $$
declare
  v_user uuid := 'e060f2d1-9f2a-4bca-a0c1-000000000601';
  v_org uuid := 'e060f2d1-9f2a-4bca-a0c1-000000000602';
  v_other_org uuid := 'e060f2d1-9f2a-4bca-a0c1-000000000603';
  v_account uuid := 'e060f2d1-9f2a-4bca-a0c1-000000000604';
  v_earn uuid := 'e060f2d1-9f2a-4bca-a0c1-000000000605';
  v_redemption uuid := 'e060f2d1-9f2a-4bca-a0c1-000000000606';
  v_balance bigint;
  v_duplicate_blocked boolean := false;
  v_cross_tenant_blocked boolean := false;
begin
  insert into auth.users(id,aud,role,email,encrypted_password,email_confirmed_at,raw_app_meta_data,raw_user_meta_data,created_at,updated_at)
  values(v_user,'authenticated','authenticated','phase06-fixture@salesx.invalid','fixture-only-not-a-login-secret',now(),'{"provider":"email","providers":["email"]}'::jsonb,'{"display_name":"Phase 06 Fixture"}'::jsonb,now(),now())
  on conflict(id) do nothing;
  insert into public.profiles(id,email,display_name,status) values(v_user,'phase06-fixture@salesx.invalid','Phase 06 Fixture','active')
  on conflict(id) do nothing;
  insert into public.organizations(id,slug,name,status,created_by)
  values(v_org,'salesx-phase06-fixture','SalesX Phase 06 Fixture','active',v_user),
        (v_other_org,'salesx-phase06-other','SalesX Phase 06 Other Tenant','active',v_user)
  on conflict(id) do nothing;
  insert into public.organization_memberships(organization_id,user_id,status,joined_at)
  values(v_org,v_user,'active',now()),(v_other_org,v_user,'active',now())
  on conflict(organization_id,user_id) do update set status='active',joined_at=coalesce(public.organization_memberships.joined_at,now());
  insert into public.reward_accounts(id,organization_id,participant_user_id,points_balance,status)
  values(v_account,v_org,v_user,0,'active') on conflict(id) do nothing;

  insert into public.reward_points_ledger(id,organization_id,account_id,participant_user_id,entry_type,points_delta,balance_before,balance_after,source_type,source_id,actor_user_id,reversal_of,idempotency_key,reason,occurred_at,expires_at)
  values
   (v_earn,v_org,v_account,v_user,'earn',1000,0,1000,'incentive_rule','e060f2d1-9f2a-4bca-a0c1-000000000607',v_user,null,'fixture-earn-0001','Fixture earning entry',now(),now()+interval '365 days'),
   (v_redemption,v_org,v_account,v_user,'redemption',-250,1000,750,'redemption','e060f2d1-9f2a-4bca-a0c1-000000000608',v_user,null,'fixture-redeem-01','Fixture redemption entry',now(),null),
   ('e060f2d1-9f2a-4bca-a0c1-000000000609',v_org,v_account,v_user,'expiration',-100,750,650,'point_lot','e060f2d1-9f2a-4bca-a0c1-000000000610',v_user,null,'fixture-expire-001','Fixture expired points',now(),now()-interval '1 day'),
   ('e060f2d1-9f2a-4bca-a0c1-000000000611',v_org,v_account,v_user,'reversal',250,650,900,'ledger_reversal',v_redemption,v_user,v_redemption,'fixture-reverse-01','Fixture redemption reversal',now(),null),
   ('e060f2d1-9f2a-4bca-a0c1-000000000612',v_org,v_account,v_user,'adjustment',-50,900,850,'admin_adjustment','e060f2d1-9f2a-4bca-a0c1-000000000613',v_user,null,'fixture-adjust-001','Fixture manual adjustment',now(),null)
  on conflict(id) do nothing;

  select coalesce(sum(points_delta),0) into v_balance from public.reward_points_ledger
   where organization_id=v_org and account_id=v_account;
  if v_balance<>850 then raise exception 'Phase 06 fixture ledger sum mismatch: %',v_balance; end if;
  update public.reward_accounts set points_balance=0 where id=v_account;
  update public.reward_accounts set points_balance=v_balance,updated_at=now() where id=v_account;
  if (select points_balance from public.reward_accounts where id=v_account)<>v_balance then
    raise exception 'Phase 06 account reconciliation did not converge to ledger sum';
  end if;

  begin
    insert into public.reward_points_ledger(organization_id,account_id,participant_user_id,entry_type,points_delta,balance_before,balance_after,source_type,source_id,actor_user_id,idempotency_key,reason)
    values(v_org,v_account,v_user,'earn',10,850,860,'incentive_rule','e060f2d1-9f2a-4bca-a0c1-000000000614',v_user,'fixture-earn-0001','Duplicate idempotency fixture');
  exception when unique_violation then v_duplicate_blocked:=true;
  end;
  if not v_duplicate_blocked then raise exception 'Duplicate idempotency key was not blocked'; end if;

  begin
    insert into public.reward_points_ledger(organization_id,account_id,participant_user_id,entry_type,points_delta,balance_before,balance_after,source_type,source_id,actor_user_id,idempotency_key,reason)
    values(v_other_org,v_account,v_user,'earn',10,0,10,'incentive_rule','e060f2d1-9f2a-4bca-a0c1-000000000615',v_user,'fixture-cross-tenant','Cross tenant ownership fixture');
  exception when foreign_key_violation then v_cross_tenant_blocked:=true;
  end;
  if not v_cross_tenant_blocked then raise exception 'Cross-tenant account reference was not blocked'; end if;
end $$;
rollback;
