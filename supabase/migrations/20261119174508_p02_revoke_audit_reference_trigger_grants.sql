-- The application service role only reads and appends audit receipts.
begin;
revoke references, trigger on public.admin_audit_logs from service_role;
commit;
