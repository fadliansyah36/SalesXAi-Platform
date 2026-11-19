-- Phase 03: add branch contact and location metadata required by the existing Company Portal.
begin;
alter table public.branches
  add column if not exists city text,
  add column if not exists address text,
  add column if not exists manager_name text,
  add column if not exists phone text,
  add column if not exists latitude double precision,
  add column if not exists longitude double precision;
do $$ begin
  if not exists(select 1 from pg_constraint where conname='branches_latitude_range') then
    alter table public.branches add constraint branches_latitude_range check(latitude is null or latitude between -90 and 90);
  end if;
  if not exists(select 1 from pg_constraint where conname='branches_longitude_range') then
    alter table public.branches add constraint branches_longitude_range check(longitude is null or longitude between -180 and 180);
  end if;
end $$;
commit;