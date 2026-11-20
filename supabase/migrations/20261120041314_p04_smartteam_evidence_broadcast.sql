drop trigger if exists smartteam_visit_evidence_broadcast on public.smartteam_visit_evidence;
create trigger smartteam_visit_evidence_broadcast
after insert or update or delete on public.smartteam_visit_evidence
for each row execute function public.smartteam_broadcast_change();