alter table public.smartteam_activities drop constraint if exists smartteam_activities_activity_type_check;
alter table public.smartteam_activities add constraint smartteam_activities_activity_type_check
check (activity_type = any (array['task','call','meeting','follow_up','prospecting','report','other']::text[]));