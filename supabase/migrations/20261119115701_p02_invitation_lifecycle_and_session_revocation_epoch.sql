-- Phase 02 invitation lifecycle and server-side session revocation epoch.
-- Idempotent source mirror for the already-applied SalesXAi migration.
begin;

alter table public.profiles
  add column if not exists session_revoked_at timestamptz;

alter table public.session_devices
  add column if not exists revoked_at timestamptz;

create table if not exists public.organization_invitations (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  email text not null check (email=lower(trim(email)) and length(email) between 3 and 320),
  title text,
  branch_id uuid,
  role_key text not null references public.roles(key) on update cascade on delete restrict,
  token_hash text not null unique check (length(token_hash)=64),
  status text not null default 'pending'
    check (status in ('pending','accepted','rejected','expired','revoked')),
  invited_by uuid references auth.users(id) on delete set null,
  accepted_by uuid references auth.users(id) on delete set null,
  expires_at timestamptz not null,
  accepted_at timestamptz,
  rejected_at timestamptz,
  revoked_at timestamptz,
  resent_at timestamptz,
  resend_count integer not null default 0 check (resend_count>=0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  foreign key (organization_id,branch_id)
    references public.branches(organization_id,id) on delete restrict
);

create index if not exists organization_invitations_email_status_idx
  on public.organization_invitations(email,status,expires_at);
create unique index if not exists organization_invitations_one_pending_email
  on public.organization_invitations(organization_id,email) where status='pending';
create index if not exists organization_invitations_org_created_idx
  on public.organization_invitations(organization_id,created_at desc);
create index if not exists session_devices_user_active_idx
  on public.session_devices(user_id,last_seen_at desc) where revoked_at is null;

alter table public.organization_invitations enable row level security;
drop policy if exists organization_invitations_deny_client_access on public.organization_invitations;
create policy organization_invitations_deny_client_access
  on public.organization_invitations for all to anon,authenticated
  using (false) with check (false);

comment on column public.profiles.session_revoked_at is
  'JWT issue-time revocation epoch enforced by FastAPI for every protected request.';
comment on column public.session_devices.revoked_at is
  'Server-side per-session deny-list timestamp; distinct from Supabase refresh-token revocation.';

commit;
