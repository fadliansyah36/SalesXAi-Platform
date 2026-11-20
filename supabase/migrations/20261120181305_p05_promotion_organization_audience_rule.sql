begin;
alter table public.promotion_rules drop constraint if exists promotion_rules_rule_type_check;
alter table public.promotion_rules add constraint promotion_rules_rule_type_check
 check (rule_type = any (array['minimum_value'::text,'minimum_quantity'::text,'product'::text,'category'::text,'customer'::text,'discount_percent'::text,'discount_amount'::text,'voucher'::text,'organization_type'::text]));
alter table public.promotion_rules drop constraint if exists promotion_rules_organization_type_audience_check;
alter table public.promotion_rules add constraint promotion_rules_organization_type_audience_check
 check (rule_type <> 'organization_type' or
  ((jsonb_typeof(rule_config->'organization_types')='array' and jsonb_array_length(rule_config->'organization_types') between 1 and 4
    and rule_config->'organization_types' <@ '["principal","distributor","company","customer"]'::jsonb)
   or rule_config->>'organization_type' = any(array['principal'::text,'distributor'::text,'company'::text,'customer'::text])));
commit;