-- Cover every foreign key introduced or exposed by Phase 03 master-data completion.
create index if not exists master_data_import_batches_created_by_idx
  on public.master_data_import_batches(created_by);
create index if not exists outlet_assignment_assigned_supervisor_idx
  on public.outlet_assignment_history(assigned_supervisor_user_id);
create index if not exists outlet_assignment_assigned_by_idx
  on public.outlet_assignment_history(assigned_by);
create index if not exists outlet_assignment_unassigned_by_idx
  on public.outlet_assignment_history(unassigned_by);
create index if not exists outlet_assignment_previous_assignment_idx
  on public.outlet_assignment_history(previous_assignment_id);
create index if not exists outlet_assignment_previous_sales_profile_idx
  on public.outlet_assignment_history(organization_id,previous_sales_profile_id);
create index if not exists outlet_assignment_previous_supervisor_idx
  on public.outlet_assignment_history(previous_supervisor_user_id);
create index if not exists outlet_assignment_previous_team_idx
  on public.outlet_assignment_history(organization_id,previous_team_id);
create index if not exists outlet_assignment_previous_territory_idx
  on public.outlet_assignment_history(organization_id,previous_territory_id);
create index if not exists sales_profiles_manager_user_idx
  on public.sales_profiles(manager_user_id);
create index if not exists sales_profiles_user_idx
  on public.sales_profiles(user_id);
create index if not exists teams_parent_same_org_idx
  on public.teams(organization_id,parent_team_id);
create index if not exists teams_supervisor_user_idx
  on public.teams(supervisor_user_id);
create index if not exists territories_parent_same_org_idx
  on public.territories(organization_id,parent_territory_id);
