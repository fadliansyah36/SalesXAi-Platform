-- Phase 03: distinguish head office, branches, and regional warehouses.
begin;
alter table public.branches add column if not exists branch_type text not null default 'branch';
do $$ begin
 if not exists(select 1 from pg_constraint where conname='branches_branch_type_check') then
  alter table public.branches add constraint branches_branch_type_check check(branch_type in ('head_office','branch','warehouse'));
 end if;
end $$;
commit;