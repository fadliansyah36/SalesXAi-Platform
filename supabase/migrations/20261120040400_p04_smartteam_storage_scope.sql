drop policy if exists smartteam_visit_evidence_read_scoped on storage.objects;
create policy smartteam_visit_evidence_read_scoped
on storage.objects
for select
to authenticated
using (
 bucket_id='smartteam-visit-evidence'
 and exists (
  select 1
  from public.smartteam_visits v
  join public.sales_profiles sp on sp.organization_id=v.organization_id and sp.id=v.sales_profile_id
  where v.organization_id=split_part(name,'/',1)::uuid
    and v.id=split_part(name,'/',2)::uuid
    and (
      sp.user_id=(select auth.uid())
      or sp.manager_user_id=(select auth.uid())
      or exists(select 1 from public.teams t where t.organization_id=sp.organization_id and t.id=sp.team_id and t.supervisor_user_id=(select auth.uid()))
      or exists(
        select 1 from public.organization_memberships m
        join public.user_role_assignments ura on ura.membership_id=m.id and ura.revoked_at is null
        join public.roles r on r.id=ura.role_id
        where m.organization_id=v.organization_id and m.user_id=(select auth.uid()) and m.status='active'
          and r.key in ('company_admin','tenant_owner','platform_admin')
      )
    )
 )
);
