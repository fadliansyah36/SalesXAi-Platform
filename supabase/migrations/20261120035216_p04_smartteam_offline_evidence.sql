-- Phase 04 hardening: durable offline action idempotency, attendance event history and private visit evidence.
alter table public.smartteam_visit_events
  add column if not exists idempotency_key text;

create unique index if not exists smartteam_visit_events_org_idempotency_uidx
  on public.smartteam_visit_events(organization_id,idempotency_key)
  where idempotency_key is not null;

alter table public.smartteam_shifts
  add column if not exists clock_out_idempotency_key text;

create unique index if not exists smartteam_shifts_clock_out_idempotency_uidx
  on public.smartteam_shifts(organization_id,clock_out_idempotency_key)
  where clock_out_idempotency_key is not null;

create table if not exists public.smartteam_attendance_events (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null,
  shift_id uuid not null,
  actor_user_id uuid not null references public.profiles(id) on delete restrict,
  event_type text not null check (event_type in ('clocked_in','clocked_out','corrected')),
  idempotency_key text,
  metadata jsonb not null default '{}'::jsonb check (jsonb_typeof(metadata)='object'),
  occurred_at timestamptz not null default now(),
  constraint smartteam_attendance_event_shift_fk
    foreign key (organization_id,shift_id)
    references public.smartteam_shifts(organization_id,id) on delete restrict,
  unique (organization_id,id)
);

create unique index if not exists smartteam_attendance_events_org_idempotency_uidx
  on public.smartteam_attendance_events(organization_id,idempotency_key)
  where idempotency_key is not null;

create index if not exists smartteam_attendance_events_shift_idx
  on public.smartteam_attendance_events(organization_id,shift_id,occurred_at desc);

alter table public.smartteam_attendance_events enable row level security;
revoke all on public.smartteam_attendance_events from anon,authenticated;
drop policy if exists smartteam_attendance_events_deny_client on public.smartteam_attendance_events;
create policy smartteam_attendance_events_deny_client
  on public.smartteam_attendance_events for all to anon,authenticated
  using (false) with check (false);
grant select,insert on public.smartteam_attendance_events to service_role;

insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values(
  'smartteam-visit-evidence',
  'smartteam-visit-evidence',
  false,
  10485760,
  array['image/jpeg','image/png','application/pdf']::text[]
)
on conflict (id) do update
set public=false,
    file_size_limit=10485760,
    allowed_mime_types=array['image/jpeg','image/png','application/pdf']::text[];
