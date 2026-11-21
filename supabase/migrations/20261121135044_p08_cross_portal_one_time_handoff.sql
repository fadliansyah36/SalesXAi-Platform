begin;
create table if not exists public.auth_portal_handoffs (
 id uuid primary key default gen_random_uuid(),
 token_hash text not null unique,
 target_portal text not null check(target_portal in ('sales','customer','company','distributor','principal','supervisor')),
 target_origin text not null,
 encrypted_session text not null,
 expires_at timestamptz not null,
 consumed_at timestamptz,
 created_at timestamptz not null default now()
);
create index if not exists auth_portal_handoffs_expiry_idx on public.auth_portal_handoffs(expires_at) where consumed_at is null;
alter table public.auth_portal_handoffs enable row level security;
revoke all on public.auth_portal_handoffs from anon,authenticated;
grant all on public.auth_portal_handoffs to service_role;
commit;