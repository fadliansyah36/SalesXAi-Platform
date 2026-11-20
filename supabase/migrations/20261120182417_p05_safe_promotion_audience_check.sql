begin;
alter table public.promotion_rules drop constraint if exists promotion_rules_organization_type_audience_check;
alter table public.promotion_rules add constraint promotion_rules_organization_type_audience_check
 check (case
  when rule_type <> 'organization_type' then true
  when jsonb_typeof(rule_config->'organization_types')='array' then
   jsonb_array_length(rule_config->'organization_types') between 1 and 4
   and rule_config->'organization_types' <@ '["principal","distributor","company","customer"]'::jsonb
  when rule_config ? 'organization_type' then
   rule_config->>'organization_type' = any(array['principal'::text,'distributor'::text,'company'::text,'customer'::text])
  else false
 end);
commit;