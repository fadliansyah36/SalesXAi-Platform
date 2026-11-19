-- Restrict audit receipt mutation privileges to the database owner only.
begin;
revoke update, delete, truncate on public.admin_audit_logs from service_role;
grant select, insert on public.admin_audit_logs to service_role;
commit;
