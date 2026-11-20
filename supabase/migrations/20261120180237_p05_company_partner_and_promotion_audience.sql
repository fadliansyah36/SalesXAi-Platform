begin;
alter table public.commerce_partner_links
 drop constraint if exists commerce_partner_links_relationship_type_check;
alter table public.commerce_partner_links
 add constraint commerce_partner_links_relationship_type_check
 check (relationship_type = any (array['principal'::text,'distributor'::text,'company'::text,'customer'::text]));
commit;