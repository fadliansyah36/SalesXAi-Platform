begin;
do $$
declare c record;
begin
 for c in
  select conname from pg_constraint
  where conrelid='public.reward_points_ledger'::regclass
   and contype='c'
   and pg_get_constraintdef(oid) ilike '%entry_type%'
   and pg_get_constraintdef(oid) ilike '%points_delta%'
 loop
  execute format('alter table public.reward_points_ledger drop constraint %I',c.conname);
 end loop;
end $$;
alter table public.reward_points_ledger
 add constraint reward_points_ledger_sign_check check (
  (entry_type='earn' and points_delta>0)
  or (entry_type in ('debit','redemption','expiration') and points_delta<0)
  or (entry_type in ('reversal','adjustment') and points_delta<>0)
 );
commit;