-- Keep the canonical per-table broadcast trigger and remove the duplicate generic
-- trigger installed by the later master-data event migration. Both called the same
-- function, so each write was publishing the same tenant event twice.
DROP TRIGGER IF EXISTS salesx_master_data_broadcast ON public.branches;
DROP TRIGGER IF EXISTS salesx_master_data_broadcast ON public.teams;
DROP TRIGGER IF EXISTS salesx_master_data_broadcast ON public.territories;
DROP TRIGGER IF EXISTS salesx_master_data_broadcast ON public.outlets;
DROP TRIGGER IF EXISTS salesx_master_data_broadcast ON public.sales_profiles;
DROP TRIGGER IF EXISTS salesx_master_data_broadcast ON public.outlet_assignment_history;
