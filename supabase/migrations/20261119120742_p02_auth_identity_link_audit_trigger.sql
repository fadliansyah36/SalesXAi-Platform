-- Audit manual/automatic Supabase Auth identity link and unlink events.
begin;

create or replace function app_private.audit_auth_identity_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_identity_id uuid;
  v_user_id uuid;
  v_provider text;
  v_action text;
begin
  if tg_op='DELETE' then
    v_identity_id:=old.id;
    v_user_id:=old.user_id;
    v_provider:=old.provider;
    v_action:='auth.identity.unlinked';
  else
    v_identity_id:=new.id;
    v_user_id:=new.user_id;
    v_provider:=new.provider;
    v_action:=case when tg_op='INSERT' then 'auth.identity.linked' else 'auth.identity.updated' end;
  end if;
  insert into public.admin_audit_logs(actor_user_id,action,resource_type,resource_id,metadata)
  values (v_user_id,v_action,'auth_identity',v_identity_id::text,jsonb_build_object('provider',v_provider));
  if tg_op='DELETE' then return old; end if;
  return new;
end;
$$;

drop trigger if exists auth_identity_audit_trail on auth.identities;
create trigger auth_identity_audit_trail
after insert or delete or update of provider,user_id on auth.identities
for each row execute function app_private.audit_auth_identity_change();

revoke all on function app_private.audit_auth_identity_change() from public,anon,authenticated;
comment on function app_private.audit_auth_identity_change() is
  'Writes provider-only audit metadata for Auth identity link/unlink; never stores provider tokens or identity payloads.';

commit;
