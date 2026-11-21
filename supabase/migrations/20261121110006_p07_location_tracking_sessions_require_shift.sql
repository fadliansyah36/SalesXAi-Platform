-- Location sessions are valid only inside an authenticated active SmartTeam shift.
-- Existing production table was empty when this constraint was applied. FastAPI
-- also requires shift_id and validates session/shift ownership before insert.
alter table public.location_tracking_sessions
  alter column shift_id set not null;
