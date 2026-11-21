-- Applied migration version: 20261121085755.
-- Enforce session ownership and same-tenant assignment relationships at the database boundary.
alter table public.location_tracking_sessions
 add constraint location_sessions_org_id_user_device_key unique(organization_id,id,user_id,device_id);
alter table public.location_points
 add constraint location_points_session_owner_device_fk
 foreign key(organization_id,session_id,user_id,device_id)
 references public.location_tracking_sessions(organization_id,id,user_id,device_id) on delete cascade;
alter table public.location_latest_positions
 add constraint location_latest_session_owner_device_fk
 foreign key(organization_id,session_id,user_id,device_id)
 references public.location_tracking_sessions(organization_id,id,user_id,device_id) on delete cascade;
alter table public.location_latest_positions
 add constraint location_latest_branch_fk foreign key(organization_id,branch_id)
 references public.branches(organization_id,id);
alter table public.location_latest_positions
 add constraint location_latest_team_fk foreign key(organization_id,team_id)
 references public.teams(organization_id,id);
alter table public.location_latest_positions
 add constraint location_latest_territory_fk foreign key(organization_id,territory_id)
 references public.territories(organization_id,id);
alter table public.location_tracking_sessions
 add constraint location_sessions_org_shift_fk foreign key(organization_id,shift_id)
 references public.smartteam_shifts(organization_id,id);
create index if not exists idx_location_points_owner_device on public.location_points(organization_id,session_id,user_id,device_id);
create index if not exists idx_location_latest_owner_device on public.location_latest_positions(organization_id,session_id,user_id,device_id);
create index if not exists idx_location_sessions_org_shift on public.location_tracking_sessions(organization_id,shift_id);
