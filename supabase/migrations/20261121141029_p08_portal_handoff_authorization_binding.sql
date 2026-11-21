begin;
alter table public.auth_portal_handoffs
 add column if not exists organization_id uuid references public.organizations(id) on delete cascade,
 add column if not exists actor_user_id uuid;
create index if not exists auth_portal_handoffs_actor_org_idx
 on public.auth_portal_handoffs(actor_user_id,organization_id,expires_at);
commit;