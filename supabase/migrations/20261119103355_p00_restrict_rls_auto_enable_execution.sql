-- Phase 00 security baseline: the postgres-owned DDL event trigger
-- "ensure_rls" invokes this SECURITY DEFINER event-trigger function.
-- Application roles do not require direct EXECUTE privilege on it.
REVOKE EXECUTE ON FUNCTION public.rls_auto_enable() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.rls_auto_enable() FROM anon, authenticated;
