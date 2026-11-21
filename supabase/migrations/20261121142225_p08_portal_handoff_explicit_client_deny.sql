begin;
drop policy if exists auth_portal_handoffs_deny_client on public.auth_portal_handoffs;
create policy auth_portal_handoffs_deny_client on public.auth_portal_handoffs
for all to anon,authenticated using(false) with check(false);
commit;