-- Phase 02 hardening: explicit deny policies and role-scope integrity.
begin;

create policy roles_deny_client_access on public.roles
  for all to anon, authenticated using (false) with check (false);
create policy permissions_deny_client_access on public.permissions
  for all to anon, authenticated using (false) with check (false);
create policy role_permissions_deny_client_access on public.role_permissions
  for all to anon, authenticated using (false) with check (false);
create policy user_role_assignments_deny_client_access on public.user_role_assignments
  for all to anon, authenticated using (false) with check (false);
create policy session_devices_deny_client_access on public.session_devices
  for all to anon, authenticated using (false) with check (false);
create policy admin_audit_logs_deny_client_access on public.admin_audit_logs
  for all to anon, authenticated using (false) with check (false);

insert into public.role_permissions(role_id,permission_key)
select id,'role:assign' from public.roles where key='company_admin'
on conflict do nothing;

create or replace function app_private.validate_role_assignment_scope()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  v_role_scope text;
  v_organization_id uuid;
  v_membership_branch_id uuid;
begin
  select scope_type into v_role_scope from public.roles where id = new.role_id;
  if v_role_scope is null or v_role_scope <> new.scope_type then
    raise exception 'role scope does not match assignment scope';
  end if;

  if new.scope_type = 'platform' then
    if new.membership_id is not null or new.scope_id is not null then
      raise exception 'platform assignment cannot reference tenant membership or scope';
    end if;
    return new;
  end if;

  select organization_id, branch_id
    into v_organization_id, v_membership_branch_id
    from public.organization_memberships
    where id = new.membership_id and user_id = new.user_id;
  if v_organization_id is null then
    raise exception 'role assignment membership does not belong to user';
  end if;

  if new.scope_type = 'tenant' and new.scope_id <> v_organization_id then
    raise exception 'tenant role scope must match membership organization';
  end if;

  if new.scope_type = 'branch' then
    if not exists (
      select 1 from public.branches
      where id = new.scope_id and organization_id = v_organization_id
    ) then
      raise exception 'branch role scope must belong to membership organization';
    end if;
    if v_membership_branch_id is not null and v_membership_branch_id <> new.scope_id then
      raise exception 'branch role scope does not match assigned membership branch';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists user_role_assignment_scope_guard on public.user_role_assignments;
create trigger user_role_assignment_scope_guard
before insert or update of user_id, membership_id, role_id, scope_type, scope_id
on public.user_role_assignments
for each row execute function app_private.validate_role_assignment_scope();

revoke all on function app_private.validate_role_assignment_scope() from public, anon, authenticated;
commit;