begin;
alter table public.auth_portal_handoffs
 alter column organization_id set not null,
 alter column actor_user_id set not null;
do $$
begin
 if not exists (
  select 1 from pg_constraint
  where conrelid='public.auth_portal_handoffs'::regclass
    and conname='auth_portal_handoffs_actor_user_id_fkey'
 ) then
  alter table public.auth_portal_handoffs
   add constraint auth_portal_handoffs_actor_user_id_fkey
   foreign key(actor_user_id) references auth.users(id) on delete cascade;
 end if;
end $$;
commit;