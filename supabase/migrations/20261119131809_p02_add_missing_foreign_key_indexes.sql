-- SalesX-Ai Phase 02 — missing foreign-key lookup indexes
-- Target: eyofuiyxalbehbqoaeny
-- Additive only; no row data or authorization semantics are changed.
create index if not exists organization_invitations_accepted_by_idx
  on public.organization_invitations (accepted_by);
create index if not exists organization_invitations_invited_by_idx
  on public.organization_invitations (invited_by);
create index if not exists organization_invitations_org_branch_idx
  on public.organization_invitations (organization_id, branch_id);
create index if not exists organization_invitations_role_key_idx
  on public.organization_invitations (role_key);
create index if not exists organization_memberships_org_branch_idx
  on public.organization_memberships (organization_id, branch_id);
create index if not exists organizations_created_by_idx
  on public.organizations (created_by);
create index if not exists role_permissions_permission_key_idx
  on public.role_permissions (permission_key);
create index if not exists roles_parent_role_id_idx
  on public.roles (parent_role_id);
create index if not exists user_identities_user_id_idx
  on public.user_identities (user_id);
create index if not exists user_role_assignments_assigned_by_idx
  on public.user_role_assignments (assigned_by);
create index if not exists user_role_assignments_membership_user_idx
  on public.user_role_assignments (membership_id, user_id);
create index if not exists user_role_assignments_role_id_idx
  on public.user_role_assignments (role_id);
