-- Indexes added after Supabase performance advisor identified unindexed Phase 06/07 foreign keys.
create index if not exists idx_location_access_audit_actor on public.location_access_audit(actor_user_id);
create index if not exists idx_location_geofence_events_org_point on public.location_geofence_events(organization_id,location_point_id);
create index if not exists idx_location_geofence_events_org_session on public.location_geofence_events(organization_id,session_id);
create index if not exists idx_location_geofence_presence_org_point on public.location_geofence_presence(organization_id,last_point_id);
create index if not exists idx_location_geofences_created_by on public.location_geofences(created_by);
create index if not exists idx_location_geofences_org_outlet on public.location_geofences(organization_id,outlet_id);
create index if not exists idx_location_geofences_org_territory on public.location_geofences(organization_id,territory_id);
create index if not exists idx_location_latest_org_point on public.location_latest_positions(organization_id,point_id);
create index if not exists idx_location_latest_org_profile on public.location_latest_positions(organization_id,sales_profile_id);
create index if not exists idx_location_latest_org_session on public.location_latest_positions(organization_id,session_id);
create index if not exists idx_location_latest_user on public.location_latest_positions(user_id);
create index if not exists idx_location_points_user on public.location_points(user_id);
create index if not exists idx_location_sessions_shift on public.location_tracking_sessions(shift_id);
create index if not exists idx_location_sessions_user on public.location_tracking_sessions(user_id);
create index if not exists idx_reward_segment_members_participant on public.reward_customer_segment_members(participant_user_id);
create index if not exists idx_reward_segments_created_by on public.reward_customer_segments(created_by);
create index if not exists idx_reward_segments_updated_by on public.reward_customer_segments(updated_by);
