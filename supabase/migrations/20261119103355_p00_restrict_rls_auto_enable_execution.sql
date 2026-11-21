-- Phase 00 security baseline: create the postgres-owned DDL event-trigger
-- function before restricting its direct invocation. The project may already
-- have this function from a pre-migration bootstrap; CREATE OR REPLACE is safe.
-- Application roles do not require direct EXECUTE privilege on it.
CREATE OR REPLACE FUNCTION public.rls_auto_enable()
RETURNS event_trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog
AS $function$
DECLARE
  cmd record;
  tbl name;
BEGIN
  FOR cmd IN
    SELECT *
    FROM pg_event_trigger_ddl_commands()
    WHERE command_tag IN ('CREATE TABLE', 'CREATE TABLE AS', 'SELECT INTO')
      AND object_type IN ('table', 'partitioned table')
  LOOP
    IF cmd.schema_name IS NOT NULL
       AND cmd.schema_name = 'public'
       AND cmd.schema_name NOT IN ('pg_catalog', 'information_schema')
       AND cmd.schema_name NOT LIKE 'pg_toast%'
       AND cmd.schema_name NOT LIKE 'pg_temp%' THEN
      BEGIN
        SELECT c.relname INTO tbl
        FROM pg_catalog.pg_class c
        WHERE c.oid = cmd.objid;

        EXECUTE format(
          'ALTER TABLE IF EXISTS %I.%I ENABLE ROW LEVEL SECURITY',
          cmd.schema_name,
          tbl
        );
        RAISE LOG 'rls_auto_enable: enabled RLS on %', cmd.object_identity;
      EXCEPTION
        WHEN OTHERS THEN
          RAISE LOG 'rls_auto_enable: failed to enable RLS on %', cmd.object_identity;
      END;
    ELSE
      RAISE LOG 'rls_auto_enable: skip % (outside enforced schema scope)', cmd.object_identity;
    END IF;
  END LOOP;
END;
$function$;

REVOKE EXECUTE ON FUNCTION public.rls_auto_enable() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.rls_auto_enable() FROM anon, authenticated;
