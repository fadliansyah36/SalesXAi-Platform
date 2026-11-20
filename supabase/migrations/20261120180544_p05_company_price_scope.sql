begin;
alter table public.price_lists drop constraint if exists price_lists_scope_type_check;
alter table public.price_lists add constraint price_lists_scope_type_check
 check (scope_type = any (array['tenant'::text,'principal'::text,'distributor'::text,'company'::text,'customer'::text,'region'::text,'channel'::text,'contract'::text]));
commit;