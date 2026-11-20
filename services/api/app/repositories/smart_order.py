# ruff: noqa: E701, E702
from __future__ import annotations
import json
from decimal import Decimal
from datetime import UTC, datetime, timedelta
from uuid import uuid4
from app.errors import APIError
from app.domain.smart_order_rules import money as money_value, line_totals, evaluate_promotion_candidates, can_transition_fulfillment, can_cancel_order

def money(v): return money_value(v)
def rowdict(r): return dict(r) if r is not None else None

class SmartOrderRepository:
 async def list_products(self,db,org,search,category,brand,sort_by,sort_order,page,size):
  where=["(p.organization_id=$1 or p.status='published')","(p.organization_id=$1 or exists(select 1 from public.commerce_catalog_access ca where ca.owner_organization_id=p.organization_id and ca.consumer_organization_id=$1 and ca.access_type='catalog' and ca.starts_at<=now() and (ca.ends_at is null or ca.ends_at>now()) and (ca.product_id is null or ca.product_id=p.id)))"]; args=[org]
  if search: args.append(search); where.append(f"to_tsvector('simple',coalesce(p.name,'')||' '||coalesce(p.product_code,'')||' '||coalesce(p.description,'')) @@ plainto_tsquery('simple',${len(args)})")
  if category: args.append(category); where.append(f"p.category_id=${len(args)}")
  if brand: args.append(brand); where.append(f"p.brand_id=${len(args)}")
  sort_columns={"name":"p.name","code":"p.product_code","updated_at":"p.updated_at"}
  sort_column=sort_columns.get(sort_by,"p.updated_at")
  sort_direction="ASC" if sort_order=="asc" else "DESC"
  clause=" and ".join(where); total=await db.fetchval(f"select count(*) from public.products p where {clause}",*args)
  args.extend([size,(page-1)*size])
  rows=await db.fetch(f"""select p.id,p.organization_id,p.product_code,p.name,p.description,p.specifications,p.tax_rate,p.category_id,p.brand_id,p.unit_id,c.name category_name,b.name brand_name,
   coalesce((select jsonb_agg(jsonb_build_object('id',v.id,'sku',v.sku,'name',v.name,'barcode',v.barcode,'attributes',v.attributes,'specifications',v.specifications,'weight_grams',v.weight_grams)) from public.product_variants v where v.organization_id=p.organization_id and v.product_id=p.id and v.status='active'),'[]'::jsonb) variants,
   coalesce((select jsonb_agg(jsonb_build_object('id',i.id,'storage_path',i.storage_path,'mime_type',i.mime_type,'alt_text',i.alt_text,'sort_order',i.sort_order) order by i.sort_order) from public.product_images i where i.organization_id=p.organization_id and i.product_id=p.id),'[]'::jsonb) images
   from public.products p left join public.product_categories c on c.organization_id=p.organization_id and c.id=p.category_id
   left join public.product_brands b on b.organization_id=p.organization_id and b.id=p.brand_id where {clause}
   order by {sort_column} {sort_direction},p.name asc limit ${len(args)-1} offset ${len(args)}""",*args)
  return {"items":[dict(r) for r in rows],"page":page,"page_size":size,"total":total}

 async def get_product(self,db,org,pid):
  r=await db.fetchrow("""select p.*,c.name category_name,b.name brand_name,
   coalesce((select jsonb_agg(to_jsonb(v)-'organization_id') from public.product_variants v where v.organization_id=p.organization_id and v.product_id=p.id),'[]'::jsonb) variants,
   coalesce((select jsonb_agg(jsonb_build_object('id',i.id,'storage_path',i.storage_path,'mime_type',i.mime_type,'alt_text',i.alt_text)) from public.product_images i where i.organization_id=p.organization_id and i.product_id=p.id),'[]'::jsonb) images
   from public.products p left join public.product_categories c on c.organization_id=p.organization_id and c.id=p.category_id
   left join public.product_brands b on b.organization_id=p.organization_id and b.id=p.brand_id where p.id=$2 and (p.organization_id=$1 or (p.status='published' and exists(select 1 from public.commerce_catalog_access ca where ca.owner_organization_id=p.organization_id and ca.consumer_organization_id=$1 and ca.access_type='catalog' and ca.starts_at<=now() and (ca.ends_at is null or ca.ends_at>now()) and (ca.product_id is null or ca.product_id=p.id))))""",org,pid)
  return rowdict(r)

 async def create_product(self,db,org,actor,p):
  async with db.transaction():
   r=await db.fetchrow("""insert into public.products(organization_id,category_id,brand_id,unit_id,product_code,name,description,specifications,tax_rate,status,published_at,created_by,updated_by)
    values($1,$2,$3,$4,$5,$6,$7,$8::jsonb,$9,$10,case when $10='published' then now() end,$11,$11) returning id""",
    org,p.category_id,p.brand_id,p.unit_id,p.product_code.strip(),p.name.strip(),p.description,json.dumps(p.specifications),p.tax_rate,p.status,actor)
   for v in p.variants:
    await db.execute("""insert into public.product_variants(organization_id,product_id,sku,name,barcode,attributes,specifications,weight_grams)
      values($1,$2,$3,$4,$5,$6::jsonb,$7::jsonb,$8)""",org,r["id"],v.sku.strip(),v.name.strip(),v.barcode,json.dumps(v.attributes),json.dumps(v.specifications),v.weight_grams)
   await self.audit(db,org,actor,"product.created","product",r["id"],{"variants":len(p.variants)})
  return await self.get_product(db,org,r["id"])

 async def update_product(self,db,org,actor,pid,p):
  async with db.transaction():
   current=await db.fetchrow("select id from public.products where organization_id=$1 and id=$2 for update",org,pid)
   if not current:raise APIError(404,"product_not_found","Product was not found in this organization.")
   r=await db.fetchrow("""update public.products set product_code=$3,name=$4,description=$5,category_id=$6,brand_id=$7,unit_id=$8,tax_rate=$9,
    specifications=$10::jsonb,status=$11,published_at=case when $11='published' then coalesce(published_at,now()) else published_at end,
    updated_by=$12,updated_at=now() where organization_id=$1 and id=$2 returning id""",
    org,pid,p.product_code.strip(),p.name.strip(),p.description,p.category_id,p.brand_id,p.unit_id,p.tax_rate,json.dumps(p.specifications),p.status,actor)
   sku_keys=[v.sku.strip() for v in p.variants]
   if len(sku_keys)!=len(set(sku_keys)):raise APIError(422,"duplicate_product_sku","A product update cannot contain duplicate SKU codes.")
   for v in p.variants:
    existing=await db.fetchrow("select id from public.product_variants where organization_id=$1 and product_id=$2 and sku=$3 for update",org,pid,v.sku.strip())
    if existing:
     await db.execute("""update public.product_variants set name=$4,barcode=$5,attributes=$6::jsonb,specifications=$7::jsonb,weight_grams=$8,updated_at=now()
      where organization_id=$1 and product_id=$2 and id=$3""",org,pid,existing["id"],v.name.strip(),v.barcode,json.dumps(v.attributes),json.dumps(v.specifications),v.weight_grams)
    else:
     await db.execute("""insert into public.product_variants(organization_id,product_id,sku,name,barcode,attributes,specifications,weight_grams)
      values($1,$2,$3,$4,$5,$6::jsonb,$7::jsonb,$8)""",org,pid,v.sku.strip(),v.name.strip(),v.barcode,json.dumps(v.attributes),json.dumps(v.specifications),v.weight_grams)
   await db.execute("update public.product_variants set status='archived',updated_at=now() where organization_id=$1 and product_id=$2 and not (sku=any($3::text[])) and status<>'archived'",org,pid,sku_keys)
   await self.audit(db,org,actor,"product.updated","product",pid,{"variants":len(p.variants),"status":p.status})
  return await self.get_product(db,org,pid)

 async def update_product_status(self,db,org,actor,pid,status):
  async with db.transaction():
   r=await db.fetchrow("""update public.products set status=$3,published_at=case when $3='published' then coalesce(published_at,now()) else published_at end,updated_by=$4,updated_at=now()
     where organization_id=$1 and id=$2 returning id""",org,pid,status,actor)
   if not r:return None
   await self.audit(db,org,actor,"product.status.changed","product",pid,{"status":status})
  return await self.get_product(db,org,pid)

 async def resolve_region_id(self,db,org,membership_id):
  if not membership_id:return None
  row=await db.fetchrow("""select coalesce(sp.territory_id,
    (select t.id from public.territories t where t.organization_id=m.organization_id and t.branch_id=m.branch_id and t.status='active' order by t.code limit 1)) region_id
   from public.organization_memberships m left join public.sales_profiles sp
    on sp.organization_id=m.organization_id and sp.membership_id=m.id and sp.user_id=m.user_id and sp.status='active'
   where m.organization_id=$1 and m.id=$2 and m.status='active'""",org,membership_id)
  return row["region_id"] if row else None

 async def price_quote(self,db,org,pid,vid,qty,customer=None,channel=None,region_id=None):
  r=await db.fetchrow("""select pp.unit_price,pl.currency,pl.id price_list_id,pl.name price_list_name,pl.scope_type,p.tax_rate,v.sku,p.name product_name,v.name variant_name
   from public.product_prices pp join public.price_lists pl on pl.organization_id=pp.organization_id and pl.id=pp.price_list_id
   join public.products p on p.organization_id=pp.organization_id and p.id=pp.product_id
   join public.product_variants v on v.organization_id=pp.organization_id and v.id=pp.variant_id
   where pp.product_id=$2 and pp.variant_id=$3 and pl.status='active' and pl.effective_from<=now() and (pl.effective_until is null or pl.effective_until>now())
   and pp.effective_from<=now() and (pp.effective_until is null or pp.effective_until>now()) and pp.minimum_quantity<=$4 and (pp.maximum_quantity is null or pp.maximum_quantity>=$4)
   and ((pl.scope_type='tenant' and pl.scope_id is null) or (pl.scope_type='customer' and pl.scope_id=$5) or (pl.scope_type='distributor' and pl.scope_id=$1) or (pl.scope_type='principal' and pl.scope_id=$1) or (pl.scope_type='region' and pl.scope_id=$7) or (pl.scope_type='channel' and pl.channel=$6) or (pl.scope_type='contract' and pl.scope_id=$5))
   and (pl.channel is null or pl.channel=$6)
   and (pp.organization_id=$1 or exists(select 1 from public.commerce_catalog_access ca where ca.owner_organization_id=pp.organization_id and ca.consumer_organization_id=$1 and ca.access_type='pricing' and (ca.product_id is null or ca.product_id=pp.product_id) and ca.starts_at<=now() and (ca.ends_at is null or ca.ends_at>now())))
   order by case when pl.scope_type='customer' and pl.scope_id=$5 then 0 when pl.scope_type='contract' and pl.scope_id=$5 then 1 when pl.scope_type in ('principal','distributor') and pl.scope_id=$1 then 2 when pl.scope_type='region' and pl.scope_id=$7 then 3 when pl.scope_type='channel' and pl.channel=$6 then 4 else 5 end,pl.priority asc,pl.effective_from desc limit 1""",org,pid,vid,qty,customer,channel,region_id)
  if not r: raise APIError(409,"price_not_available","No effective server-side price exists for this SKU and quantity.")
  return dict(r)

 async def list_inventory(self,db,org,variant=None,warehouse=None):
  q="""select ib.id,ib.organization_id inventory_owner_organization_id,ib.product_owner_organization_id,ib.warehouse_id,w.code warehouse_code,w.name warehouse_name,ib.product_id,p.name product_name,ib.variant_id,v.sku,ib.on_hand,ib.reserved,ib.committed,ib.available,ib.version,ib.updated_at
   from public.inventory_balances ib join public.warehouses w on w.organization_id=ib.organization_id and w.id=ib.warehouse_id
   join public.products p on p.organization_id=ib.product_owner_organization_id and p.id=ib.product_id
   join public.product_variants v on v.organization_id=ib.product_owner_organization_id and v.id=ib.variant_id where ib.organization_id=$1"""
  args=[org]
  if variant: args.append(variant); q+=f" and ib.variant_id=${len(args)}"
  if warehouse: args.append(warehouse); q+=f" and ib.warehouse_id=${len(args)}"
  return [dict(r) for r in await db.fetch(q+" order by w.name,p.name,v.sku",*args)]
 async def list_stock_movements(self,db,org,page,size,variant=None,warehouse=None):
  where=["sm.organization_id=$1"];args=[org]
  if variant:args.append(variant);where.append(f"sm.variant_id=${len(args)}")
  if warehouse:args.append(warehouse);where.append(f"sm.warehouse_id=${len(args)}")
  clause=" and ".join(where)
  total=await db.fetchval(f"select count(*) from public.stock_movements sm where {clause}",*args)
  args.extend([size,(page-1)*size])
  rows=await db.fetch(f"""select sm.id,sm.organization_id inventory_owner_organization_id,sm.product_owner_organization_id,sm.warehouse_id,w.code warehouse_code,w.name warehouse_name,sm.product_id,p.name product_name,
   sm.variant_id,v.sku,sm.movement_type,sm.quantity,sm.on_hand_delta,sm.reserved_delta,sm.committed_delta,sm.reference_type,
   sm.reference_id,sm.reason,sm.actor_user_id,sm.idempotency_key,sm.occurred_at
   from public.stock_movements sm join public.warehouses w on w.organization_id=sm.organization_id and w.id=sm.warehouse_id
   join public.products p on p.organization_id=sm.product_owner_organization_id and p.id=sm.product_id
   join public.product_variants v on v.organization_id=sm.product_owner_organization_id and v.id=sm.variant_id
   where {clause} order by sm.occurred_at desc limit ${len(args)-1} offset ${len(args)}""",*args)
  return {"items":[dict(x) for x in rows],"page":page,"page_size":size,"total":total}
 async def move_stock(self,db,org,actor,p):
  async with db.transaction():
   old=await db.fetchrow("select * from public.stock_movements where organization_id=$1 and idempotency_key=$2",org,p.idempotency_key)
   if old:return dict(old)
   owner=await db.fetchval("""select p.organization_id from public.products p
    join public.product_variants v on v.organization_id=p.organization_id and v.product_id=p.id
    join public.warehouses w on w.organization_id=$1 and w.id=$2 and w.status='active'
    where p.id=$3 and v.id=$4 and p.status='published' and v.status='active'
     and (p.organization_id=$1 or exists(select 1 from public.commerce_catalog_access ca
      where ca.owner_organization_id=p.organization_id and ca.consumer_organization_id=$1
       and ca.access_type='inventory' and (ca.product_id is null or ca.product_id=p.id)
       and ca.starts_at<=now() and (ca.ends_at is null or ca.ends_at>now())))""",org,p.warehouse_id,p.product_id,p.variant_id)
   if not owner:raise APIError(404,"inventory_reference_not_found","Warehouse, product or SKU is not available for inventory operations in this organization.")
   await db.execute("insert into public.inventory_balances(organization_id,warehouse_id,product_id,variant_id,product_owner_organization_id) values($1,$2,$3,$4,$5) on conflict do nothing",org,p.warehouse_id,p.product_id,p.variant_id,owner)
   b=await db.fetchrow("select * from public.inventory_balances where organization_id=$1 and warehouse_id=$2 and variant_id=$3 for update",org,p.warehouse_id,p.variant_id)
   if not b or b["product_owner_organization_id"]!=owner:raise APIError(409,"inventory_owner_mismatch","Inventory SKU ownership does not match the authorized catalog owner.")
   delta=p.quantity if p.movement_type=="stock_in" else (-p.quantity if p.movement_type=="stock_out" else p.adjustment_delta)
   new=Decimal(b["on_hand"])+delta
   if new<0 or new<Decimal(b["reserved"])+Decimal(b["committed"]):raise APIError(409,"stock_below_allocations","Movement would reduce on-hand below reserved and committed stock.")
   await db.execute("update public.inventory_balances set on_hand=$4,version=version+1,updated_at=now() where organization_id=$1 and warehouse_id=$2 and variant_id=$3",org,p.warehouse_id,p.variant_id,new)
   m=await db.fetchrow("""insert into public.stock_movements(organization_id,warehouse_id,product_id,variant_id,movement_type,quantity,on_hand_delta,reason,actor_user_id,idempotency_key,product_owner_organization_id)
    values($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) returning *""",org,p.warehouse_id,p.product_id,p.variant_id,p.movement_type,p.quantity,delta,p.reason,actor,p.idempotency_key,owner)
   await self.audit(db,org,actor,"inventory.movement.recorded","stock_movement",m["id"],{"type":p.movement_type,"quantity":str(p.quantity),"product_owner_organization_id":str(owner)})
  return dict(m)
 async def list_promotions(self,db,org):
  rows=await db.fetch("""select p.id,p.code,p.name,p.description,p.priority,p.stackable,p.stacking_group,p.starts_at,p.ends_at,p.status,
   coalesce(jsonb_agg(jsonb_build_object('rule_type',r.rule_type,'rule_config',r.rule_config)) filter(where r.id is not null),'[]'::jsonb) rules
   from public.promotions p left join public.promotion_rules r on r.organization_id=p.organization_id and r.promotion_id=p.id
   where p.organization_id=$1 group by p.id order by p.priority,p.created_at desc""",org)
  return [dict(r) for r in rows]

 async def update_promotion(self,db,org,actor,promotion_id,p):
  async with db.transaction():
   current=await db.fetchrow("select id from public.promotions where organization_id=$1 and id=$2 for update",org,promotion_id)
   if not current:raise APIError(404,"promotion_not_found","Promotion was not found in this organization.")
   row=await db.fetchrow("""update public.promotions set code=$3,name=$4,description=$5,priority=$6,stackable=$7,stacking_group=$8,
    starts_at=$9::timestamptz,ends_at=$10::timestamptz,status=$11,updated_at=now()
    where organization_id=$1 and id=$2 returning *""",org,promotion_id,p.code.upper(),p.name,p.description,p.priority,p.stackable,p.stacking_group,p.starts_at,p.ends_at,p.status)
   await db.execute("delete from public.promotion_rules where organization_id=$1 and promotion_id=$2",org,promotion_id)
   for rule in p.rules:
    if rule.get("rule_type") not in {"minimum_value","minimum_quantity","product","category","customer","discount_percent","discount_amount","voucher"} or not isinstance(rule.get("rule_config",{}),dict):
     raise APIError(422,"invalid_promotion_rule","Promotion rule type or configuration is invalid.")
    await db.execute("insert into public.promotion_rules(organization_id,promotion_id,rule_type,rule_config) values($1,$2,$3,$4::jsonb)",org,promotion_id,rule["rule_type"],json.dumps(rule.get("rule_config",{})))
   await self.audit(db,org,actor,"promotion.updated","promotion",promotion_id,{"code":p.code,"status":p.status,"rules":len(p.rules)})
  return dict(row)

 async def create_promotion(self,db,org,actor,p):
  async with db.transaction():
   r=await db.fetchrow("""insert into public.promotions(organization_id,code,name,description,priority,stackable,stacking_group,starts_at,ends_at,status,created_by)
    values($1,$2,$3,$4,$5,$6,$7,$8::timestamptz,$9::timestamptz,'active',$10) returning *""",org,p.code.upper(),p.name,p.description,p.priority,p.stackable,p.stacking_group,p.starts_at,p.ends_at,actor)
   for rule in p.rules:
    if rule.get("rule_type") not in {"minimum_value","minimum_quantity","product","category","customer","discount_percent","discount_amount","voucher"} or not isinstance(rule.get("rule_config",{}),dict):
     raise APIError(422,"invalid_promotion_rule","Promotion rule type or configuration is invalid.")
    await db.execute("insert into public.promotion_rules(organization_id,promotion_id,rule_type,rule_config) values($1,$2,$3,$4::jsonb)",org,r["id"],rule["rule_type"],json.dumps(rule.get("rule_config",{})))
   await self.audit(db,org,actor,"promotion.created","promotion",r["id"],{"code":p.code})
  return dict(r)

 async def get_cart(self,db,org,actor,region_id=None):
  async with db.transaction():
   await db.execute("update public.carts set status='expired',version=version+1,updated_at=now() where organization_id=$1 and owner_user_id=$2 and status='active' and expires_at<=now()",org,actor)
   c=await db.fetchrow("select * from public.carts where organization_id=$1 and owner_user_id=$2 and status='active' and expires_at>now() for update",org,actor)
   if not c:c=await db.fetchrow("insert into public.carts(organization_id,owner_user_id,customer_organization_id) values($1,$2,$1) returning *",org,actor)
  items=await db.fetch("""select ci.id,ci.product_id,ci.variant_id,ci.quantity,ci.notes,p.name product_name,p.product_code,v.sku,v.name variant_name
   from public.cart_items ci join public.products p on p.organization_id=ci.product_owner_organization_id and p.id=ci.product_id
   join public.product_variants v on v.organization_id=ci.product_owner_organization_id and v.id=ci.variant_id where ci.organization_id=$1 and ci.cart_id=$2 order by ci.created_at""",org,c["id"])
  result=[]
  for i in items:
   q=await self.price_quote(db,org,i["product_id"],i["variant_id"],i["quantity"],(c["customer_organization_id"] or org),c["channel"],region_id)
   result.append({**dict(i),"price":q,"line_subtotal":money(Decimal(q["unit_price"])*Decimal(i["quantity"]))})
  return {"cart":dict(c),"items":result}

 async def upsert_cart_item(self,db,org,actor,p,region_id=None):
  async with db.transaction():
   await db.execute("update public.carts set status='expired',version=version+1,updated_at=now() where organization_id=$1 and owner_user_id=$2 and status='active' and expires_at<=now()",org,actor)
   c=await db.fetchrow("select * from public.carts where organization_id=$1 and owner_user_id=$2 and status='active' and expires_at>now() for update",org,actor)
   if not c:c=await db.fetchrow("insert into public.carts(organization_id,owner_user_id) values($1,$2) returning *",org,actor)
   owner=await db.fetchrow("""select p.organization_id from public.products p join public.product_variants v on v.organization_id=p.organization_id and v.product_id=p.id
    where p.id=$2 and v.id=$3 and p.status='published' and v.status='active'
    and (p.organization_id=$1 or (
      exists(select 1 from public.commerce_catalog_access ca where ca.owner_organization_id=p.organization_id and ca.consumer_organization_id=$1 and ca.access_type='catalog' and (ca.product_id is null or ca.product_id=p.id) and ca.starts_at<=now() and (ca.ends_at is null or ca.ends_at>now()))
      and exists(select 1 from public.commerce_catalog_access ca where ca.owner_organization_id=p.organization_id and ca.consumer_organization_id=$1 and ca.access_type='ordering' and (ca.product_id is null or ca.product_id=p.id) and ca.starts_at<=now() and (ca.ends_at is null or ca.ends_at>now()))
    ))""",org,p.product_id,p.variant_id)
   if not owner: raise APIError(404,"product_sku_not_found","Published product and active SKU are not available to this organization.")
   await self.price_quote(db,org,p.product_id,p.variant_id,p.quantity,c["customer_organization_id"],c["channel"],region_id)
   r=await db.fetchrow("""insert into public.cart_items(organization_id,cart_id,product_id,variant_id,quantity,notes,product_owner_organization_id) values($1,$2,$3,$4,$5,$6,$7)
    on conflict(cart_id,variant_id) do update set quantity=excluded.quantity,notes=excluded.notes,product_owner_organization_id=excluded.product_owner_organization_id,updated_at=now() returning *""",org,c["id"],p.product_id,p.variant_id,p.quantity,p.notes,owner["organization_id"])
   await db.execute("update public.carts set version=version+1,updated_at=now() where id=$1",c["id"])
  return dict(r)

 async def update_cart_item(self,db,org,actor,iid,p,region_id=None):
  async with db.transaction():
   await db.execute("update public.carts set status='expired',version=version+1,updated_at=now() where organization_id=$1 and owner_user_id=$2 and status='active' and expires_at<=now()",org,actor)
   r=await db.fetchrow("""update public.cart_items ci set quantity=$4,notes=$5,updated_at=now() from public.carts c
    where ci.organization_id=$1 and ci.id=$2 and c.id=ci.cart_id and c.owner_user_id=$3 and c.status='active' and c.expires_at>now() returning ci.*""",org,iid,actor,p.quantity,p.notes)
   if not r: raise APIError(404,"cart_item_not_found","Cart item was not found.")
   cart=await db.fetchrow("select customer_organization_id,channel from public.carts where organization_id=$1 and id=$2",org,r["cart_id"])
   await self.price_quote(db,org,r["product_id"],r["variant_id"],p.quantity,(cart["customer_organization_id"] or org),cart["channel"],region_id)
   await db.execute("update public.carts set version=version+1,updated_at=now() where id=$1",r["cart_id"])
  return dict(r)

 async def remove_cart_item(self,db,org,actor,iid):
  async with db.transaction():
   r=await db.fetchrow("""delete from public.cart_items ci using public.carts c where ci.organization_id=$1 and ci.id=$2 and c.id=ci.cart_id and c.owner_user_id=$3 and c.status='active' returning ci.cart_id""",org,iid,actor)
   if not r: raise APIError(404,"cart_item_not_found","Cart item was not found.")
   await db.execute("update public.carts set version=version+1,updated_at=now() where id=$1",r["cart_id"])
  return {"removed":True}

 async def evaluate_promotions(self,db,org,codes,subtotal,qty,customer,lines=None):
  if not codes:return [],Decimal("0")
  rows=await db.fetch("""select p.*,coalesce(jsonb_agg(jsonb_build_object('rule_type',r.rule_type,'rule_config',r.rule_config) order by r.created_at,r.id) filter(where r.id is not null),'[]'::jsonb) rules
   from public.promotions p left join public.promotion_rules r on r.organization_id=p.organization_id and r.promotion_id=p.id
   where p.organization_id=$1 and upper(p.code)=any($2::text[]) and p.status='active' and p.starts_at<=now() and p.ends_at>now()
   group by p.id order by p.priority asc,p.created_at asc,p.id asc""",org,[x.upper() for x in codes])
  return evaluate_promotion_candidates([dict(row) for row in rows],subtotal,qty,customer,lines or [])

 async def create_order(self,db,org,actor,p,snapshot,region_id=None):
  async with db.transaction():
   await db.execute("select pg_advisory_xact_lock(hashtextextended($1,0))",f"{org}:{actor}:{p.idempotency_key}")
   old=await db.fetchrow("select * from public.orders where organization_id=$1 and customer_user_id=$2 and idempotency_key=$3",org,actor,p.idempotency_key)
   if old:return dict(old)
   c=await db.fetchrow("select * from public.carts where organization_id=$1 and id=$2 and owner_user_id=$3 and status='active' and expires_at>now() for update",org,p.cart_id,actor)
   if not c:raise APIError(404,"active_cart_not_found","An active cart owned by this actor is required.")
   items=await db.fetch("""select ci.*,p.name product_name,p.product_code,p.tax_rate,p.category_id,p.specifications product_specs,v.sku,v.name variant_name,v.attributes variant_attributes
    from public.cart_items ci join public.products p on p.organization_id=ci.product_owner_organization_id and p.id=ci.product_id
    join public.product_variants v on v.organization_id=ci.product_owner_organization_id and v.id=ci.variant_id where ci.organization_id=$1 and ci.cart_id=$2 for update of ci""",org,p.cart_id)
   if not items:raise APIError(409,"empty_cart","An order cannot be created from an empty cart.")
   snaps=[];subtotal=Decimal("0");tax=Decimal("0");qty_total=Decimal("0")
   for i in items:
    q=await self.price_quote(db,org,i["product_id"],i["variant_id"],i["quantity"],c["customer_organization_id"],c["channel"],region_id)
    qty=Decimal(i["quantity"]);totals=line_totals(q["unit_price"],qty,i["tax_rate"]);unit=totals["unit_price"];line=totals["subtotal"];t=totals["tax"]
    subtotal+=line;tax+=t;qty_total+=qty
    snaps.append({"product_owner_organization_id":str(i["product_owner_organization_id"]),"product_id":str(i["product_id"]),"variant_id":str(i["variant_id"]),"product_name":i["product_name"],"product_code":i["product_code"],"category_id":str(i["category_id"]) if i["category_id"] else None,"sku":i["sku"],"variant_name":i["variant_name"],"quantity":str(qty),"unit_price":str(unit),"line_subtotal":str(line),"tax_rate":str(i["tax_rate"]),"tax_amount":str(t),"price_list_id":str(q["price_list_id"]),"currency":q["currency"]})
   promo_lines=[{"product_id":x["product_id"],"category_id":x["category_id"],"subtotal":x["line_subtotal"]} for x in snaps]
   promos,discount=await self.evaluate_promotions(db,org,p.promotion_codes,subtotal,qty_total,(c["customer_organization_id"] or org),promo_lines)
   oid=uuid4();number="SO-"+oid.hex[:12].upper();grand=max(Decimal(0),subtotal-discount+tax)
   o=await db.fetchrow("""insert into public.orders(id,organization_id,order_number,cart_id,customer_organization_id,customer_user_id,channel,status,currency,subtotal,discount_total,tax_total,grand_total,price_snapshot,promotion_snapshot,customer_snapshot,shipping_snapshot,notes,idempotency_key)
    values($1,$2,$3,$4,$5,$6,$7,'draft','IDR',$8,$9,$10,$11,$12::jsonb,$13::jsonb,$14::jsonb,$15::jsonb,$16,$17) returning *""",
    oid,org,number,c["id"],(c["customer_organization_id"] or org),actor,c["channel"],money(subtotal),money(discount),money(tax),money(grand),json.dumps(snaps),json.dumps(promos),json.dumps(snapshot),json.dumps(p.shipping_snapshot),p.notes,p.idempotency_key)
   for i,s in zip(items,snaps,strict=True):
    await db.execute("""insert into public.order_items(organization_id,order_id,product_id,variant_id,product_snapshot,quantity,unit_price,tax_amount,line_total,product_owner_organization_id)
     values($1,$2,$3,$4,$5::jsonb,$6,$7,$8,$9,$10)""",org,oid,i["product_id"],i["variant_id"],json.dumps(s),i["quantity"],s["unit_price"],s["tax_amount"],s["line_subtotal"],i["product_owner_organization_id"])
   for promo in promos:
    await db.execute("insert into public.promotion_redemptions(organization_id,promotion_id,order_id,customer_user_id,discount_amount) values($1,$2,$3,$4,$5)",org,promo["promotion_id"],oid,actor,promo["discount_amount"])
   await db.execute("insert into public.order_status_history(organization_id,order_id,from_status,to_status,actor_user_id) values($1,$2,null,'draft',$3)",org,oid,actor)
   await db.execute("update public.carts set status='submitted',version=version+1,updated_at=now() where id=$1",c["id"])
   await self.audit(db,org,actor,"order.draft.created","order",oid,{"order_number":number,"total":str(money(grand))})
  return dict(o)

 async def submit_order(self,db,org,actor,oid,region_id=None):
  revalidation_error=None
  result=None
  async with db.transaction():
   o=await db.fetchrow("select * from public.orders where organization_id=$1 and id=$2 and customer_user_id=$3 for update",org,oid,actor)
   if not o:raise APIError(404,"order_not_found","Order was not found.")
   if o["status"] in {"pending_approval","approved","processing","fulfilled","completed"}:
    result=await self.get_order(db,org,actor,oid)
   elif o["status"]!="draft":
    raise APIError(409,"invalid_order_transition","Only a draft order can be submitted.")
   elif o["expires_at"] is not None and o["expires_at"]<=datetime.now(UTC):
    await db.execute("update public.orders set status='expired',updated_at=now() where organization_id=$1 and id=$2",org,oid)
    await db.execute("update public.carts set status='active',version=version+1,updated_at=now() where organization_id=$1 and id=$2 and expires_at>now()",org,o["cart_id"])
    await db.execute("update public.promotion_redemptions set status='reversed',reversed_at=now() where organization_id=$1 and order_id=$2 and status='reserved'",org,oid)
    await db.execute("insert into public.order_status_history(organization_id,order_id,from_status,to_status,reason,actor_user_id) values($1,$2,'draft','expired','Order draft expired before submission',$3)",org,oid,actor)
    await self.audit(db,org,actor,"order.draft.expired","order",oid,{"expires_at":o["expires_at"].isoformat()})
    revalidation_error="Order draft has expired. Review the active cart and create a new draft."
   else:
    items=await db.fetch("select * from public.order_items where organization_id=$1 and order_id=$2 order by id for update",org,oid)
    price_changed=False
    for item in items:
     snapshot=item["product_snapshot"]
     try:
      current=await self.price_quote(db,org,item["product_id"],item["variant_id"],item["quantity"],(o["customer_organization_id"] or org),o["channel"],region_id)
      if money(current["unit_price"])!=money(snapshot["unit_price"]) or current["currency"]!=snapshot["currency"]:
       price_changed=True
       break
     except APIError:
      price_changed=True
      break
    if price_changed:
     await db.execute("update public.orders set status='revision_requested',updated_at=now() where organization_id=$1 and id=$2",org,oid)
     await db.execute("update public.carts set status='active',version=version+1,updated_at=now() where organization_id=$1 and id=$2 and expires_at>now()",org,o["cart_id"])
     await db.execute("update public.promotion_redemptions set status='reversed',reversed_at=now() where organization_id=$1 and order_id=$2 and status='reserved'",org,oid)
     await db.execute("insert into public.order_status_history(organization_id,order_id,from_status,to_status,reason,actor_user_id) values($1,$2,'draft','revision_requested','Price changed after draft creation; revalidation required',$3)",org,oid,actor)
     await self.audit(db,org,actor,"order.draft.revalidation_failed","order",oid,{"reason":"price_changed"})
     revalidation_error="Product pricing changed after draft creation. Cart was reopened; create a refreshed order draft."
    else:
     alloc=[]
     for i in items:
      b=await db.fetchrow("""select ib.*,ib.organization_id inventory_owner_organization_id
       from public.inventory_balances ib
       where ib.product_owner_organization_id=$2 and ib.variant_id=$3 and ib.available >= $4
       and (ib.organization_id=$1 or exists(
         select 1 from public.commerce_catalog_access ca
         where ca.owner_organization_id=ib.organization_id and ca.consumer_organization_id=$1
          and ca.access_type='inventory' and (ca.product_id is null or ca.product_id=ib.product_id)
          and ca.starts_at<=now() and (ca.ends_at is null or ca.ends_at>now())
       ))
       and (ib.organization_id=$1 or exists(
         select 1 from public.commerce_catalog_access ca
         where ca.owner_organization_id=ib.organization_id and ca.consumer_organization_id=$1
          and ca.access_type='ordering' and (ca.product_id is null or ca.product_id=ib.product_id)
          and ca.starts_at<=now() and (ca.ends_at is null or ca.ends_at>now())
       ))
       order by case when ib.organization_id=$1 then 0 else 1 end,ib.available desc
       limit 1 for update skip locked""",org,i["product_owner_organization_id"],i["variant_id"],i["quantity"])
      if not b:
       revalidation_error="No authorized partner warehouse has sufficient available stock for one or more order items."
       break
      alloc.append((i,b))
     if revalidation_error:
      await db.execute("update public.orders set status='revision_requested',updated_at=now() where organization_id=$1 and id=$2",org,oid)
      await db.execute("update public.carts set status='active',version=version+1,updated_at=now() where organization_id=$1 and id=$2 and expires_at>now()",org,o["cart_id"])
      await db.execute("update public.promotion_redemptions set status='reversed',reversed_at=now() where organization_id=$1 and order_id=$2 and status='reserved'",org,oid)
      await db.execute("insert into public.order_status_history(organization_id,order_id,from_status,to_status,reason,actor_user_id) values($1,$2,'draft','revision_requested','Partner inventory availability changed or is not authorized',$3)",org,oid,actor)
      await self.audit(db,org,actor,"order.draft.revalidation_failed","order",oid,{"reason":"partner_stock_unavailable"})
     else:
      auto_policy=await db.fetchrow("""select * from public.order_approval_policies where organization_id=$1 and status='active'
       and auto_approve_below=true and $2<minimum_total order by minimum_total asc limit 1""",org,o["grand_total"])
      for i,b in alloc:
       owner=b["inventory_owner_organization_id"]
       await db.execute("update public.inventory_balances set reserved=reserved+$4,version=version+1,updated_at=now() where organization_id=$1 and id=$2 and version=$3",owner,b["id"],b["version"],i["quantity"])
       await db.execute("""insert into public.stock_movements(organization_id,warehouse_id,product_id,variant_id,movement_type,quantity,reserved_delta,reference_type,reference_id,reason,actor_user_id,idempotency_key,product_owner_organization_id)
        values($1,$2,$3,$4,'reserve',$5,$5,'order',$6,'Order stock reservation',$7,$8,$9)""",owner,b["warehouse_id"],i["product_id"],i["variant_id"],i["quantity"],oid,actor,f"order:{oid}:reserve:{i['id']}",i["product_owner_organization_id"])
       if auto_policy:
        await db.execute("update public.inventory_balances set reserved=reserved-$4,committed=committed+$4,version=version+1,updated_at=now() where organization_id=$1 and id=$2 and reserved >= $4",owner,b["id"],i["quantity"])
        await db.execute("""insert into public.stock_movements(organization_id,warehouse_id,product_id,variant_id,movement_type,quantity,reserved_delta,committed_delta,reference_type,reference_id,reason,actor_user_id,idempotency_key,product_owner_organization_id)
         values($1,$2,$3,$4,'commit',$5,-$5,$5,'order',$6,'Auto-approved by order policy',$7,$8,$9)""",owner,b["warehouse_id"],i["product_id"],i["variant_id"],i["quantity"],oid,actor,f"order:{oid}:commit:{i['id']}",i["product_owner_organization_id"])
      target="approved" if auto_policy else "pending_approval"
      await db.execute("update public.orders set status=$2,submitted_at=now(),approved_at=case when $2='approved' then now() else approved_at end,updated_at=now() where organization_id=$1 and id=$3",org,target,oid)
      await db.execute("insert into public.order_status_history(organization_id,order_id,from_status,to_status,actor_user_id) values($1,$2,'draft',$3,$4)",org,oid,target,actor)
      if auto_policy:
       await db.execute("update public.promotion_redemptions set status='redeemed',redeemed_at=now() where organization_id=$1 and order_id=$2 and status='reserved'",org,oid)
      await self.audit(db,org,actor,"order.submitted","order",oid,{"reserved_skus":len(alloc),"inventory_owner_organizations":len({str(b['inventory_owner_organization_id']) for _,b in alloc}),"auto_approved":bool(auto_policy)})
      result=await self.get_order(db,org,actor,oid,True)
  if revalidation_error:raise APIError(409,"order_revalidation_required",revalidation_error)
  return result or await self.get_order(db,org,actor,oid,True)
 async def decide_order(self,db,org,actor,membership_id,oid,p):
  async with db.transaction():
   o=await db.fetchrow("select * from public.orders where organization_id=$1 and id=$2 for update",org,oid)
   if not o:raise APIError(404,"order_not_found","Order was not found.")
   prior=await db.fetchrow("select decision from public.order_approvals where organization_id=$1 and order_id=$2 and actor_user_id=$3",org,oid,actor)
   if prior:
    if prior["decision"]!=p.decision:raise APIError(409,"approval_already_recorded","This actor has already recorded a different approval decision.")
    return await self.get_order(db,org,actor,oid,True)
   if o["status"]!="pending_approval":raise APIError(409,"invalid_order_transition","Only pending approval orders can be decided.")
   policy=await db.fetchrow("""select * from public.order_approval_policies where organization_id=$1 and status='active'
    and minimum_total<=$2 and (maximum_total is null or maximum_total>=$2) order by minimum_total desc limit 1""",org,o["grand_total"])
   required_count=int(policy["required_approval_count"]) if policy else 1
   if policy and policy["required_roles"]:
    roles=await db.fetch("""select r.key from public.user_role_assignments ura join public.roles r on r.id=ura.role_id
     where ura.user_id=$1 and ura.membership_id=$2 and ura.revoked_at is null and ura.starts_at<=now()
     and (ura.expires_at is null or ura.expires_at>now())""",actor,membership_id)
    if not {role["key"] for role in roles}.intersection(set(policy["required_roles"])):
     raise APIError(403,"approval_role_not_allowed","Actor role does not satisfy this order approval policy.")
   await db.execute("insert into public.order_approvals(organization_id,order_id,decision,reason,actor_user_id) values($1,$2,$3,$4,$5)",org,oid,p.decision,p.reason,actor)
   if p.decision=="approved":
    approved_count=await db.fetchval("select count(*) from public.order_approvals where organization_id=$1 and order_id=$2 and decision='approved'",org,oid)
    if approved_count<required_count:
     await self.audit(db,org,actor,"order.approval.vote_recorded","order",oid,{"approved_votes":approved_count,"required_votes":required_count})
     return await self.get_order(db,org,actor,oid,True)
    moves=await db.fetch("select * from public.stock_movements where reference_type='order' and reference_id=$1 and movement_type='reserve'",oid)
    for m in moves:
     await db.execute("update public.inventory_balances set reserved=reserved-$4,committed=committed+$4,version=version+1,updated_at=now() where organization_id=$1 and warehouse_id=$2 and variant_id=$3 and reserved >= $4",m["organization_id"],m["warehouse_id"],m["variant_id"],m["quantity"])
     await db.execute("""insert into public.stock_movements(organization_id,warehouse_id,product_id,variant_id,movement_type,quantity,reserved_delta,committed_delta,reference_type,reference_id,reason,actor_user_id,idempotency_key,product_owner_organization_id)
      values($1,$2,$3,$4,'commit',$5,-$5,$5,'order',$6,'Approved stock commitment',$7,$8,$9)""",m["organization_id"],m["warehouse_id"],m["product_id"],m["variant_id"],m["quantity"],oid,actor,f"order:{oid}:commit:{m['id']}",m["product_owner_organization_id"])
    target="approved"
   else:
    moves=await db.fetch("select * from public.stock_movements where reference_type='order' and reference_id=$1 and movement_type='reserve'",oid)
    for m in moves:
     await db.execute("update public.inventory_balances set reserved=reserved-$4,version=version+1,updated_at=now() where organization_id=$1 and warehouse_id=$2 and variant_id=$3 and reserved >= $4",m["organization_id"],m["warehouse_id"],m["variant_id"],m["quantity"])
     await db.execute("""insert into public.stock_movements(organization_id,warehouse_id,product_id,variant_id,movement_type,quantity,reserved_delta,reference_type,reference_id,reason,actor_user_id,idempotency_key,product_owner_organization_id)
      values($1,$2,$3,$4,'release',$5,-$5,'order',$6,$7,$8,$9,$10)""",m["organization_id"],m["warehouse_id"],m["product_id"],m["variant_id"],m["quantity"],oid,p.reason or "Order rejected; reservation released",actor,f"order:{oid}:release:{m['id']}",m["product_owner_organization_id"])
    target="revision_requested" if p.decision=="revision_requested" else "rejected"
    if target=="revision_requested":
     await db.execute("update public.carts set status='active',version=version+1,updated_at=now() where organization_id=$1 and id=$2",org,o["cart_id"])
   if target=="approved":
    await db.execute("update public.promotion_redemptions set status='redeemed',redeemed_at=now() where organization_id=$1 and order_id=$2 and status='reserved'",org,oid)
   elif target in {"rejected","revision_requested"}:
    await db.execute("update public.promotion_redemptions set status='reversed',reversed_at=now() where organization_id=$1 and order_id=$2 and status in ('reserved','redeemed')",org,oid)
   await db.execute("update public.orders set status=$3,approved_at=case when $3='approved' then now() else approved_at end,updated_at=now() where id=$1 and organization_id=$2",oid,org,target)
   await db.execute("insert into public.order_status_history(organization_id,order_id,from_status,to_status,reason,actor_user_id) values($1,$2,'pending_approval',$3,$4,$5)",org,oid,target,p.reason,actor)
   await self.audit(db,org,actor,"order.approval."+p.decision,"order",oid,{"reason":p.reason,"required_approvals":required_count})
  return await self.get_order(db,org,actor,oid,True)
 async def create_fulfillment(self,db,org,actor,oid,p):
  async with db.transaction():
   o=await db.fetchrow("select * from public.orders where organization_id=$1 and id=$2 for update",org,oid)
   if not o:raise APIError(404,"order_not_found","Order was not found.")
   if o["status"] not in {"approved","processing"}:raise APIError(409,"order_not_approved","Only approved orders can enter fulfillment.")
   if p.warehouse_id is None:raise APIError(422,"fulfillment_warehouse_required","A partner warehouse must be selected for each fulfillment.")
   warehouse=await db.fetchrow("""select w.organization_id,w.id from public.warehouses w
    where w.id=$1 and w.status='active' and exists(
     select 1 from public.stock_movements sm where sm.reference_type='order' and sm.reference_id=$2
      and sm.movement_type='commit' and sm.organization_id=w.organization_id and sm.warehouse_id=w.id
      and not exists(select 1 from public.order_item_fulfillment_allocations a where a.order_item_id in
       (select oi.id from public.order_items oi where oi.organization_id=$3 and oi.order_id=$2 and oi.product_owner_organization_id=sm.product_owner_organization_id and oi.variant_id=sm.variant_id))
    )""",p.warehouse_id,oid,org)
   if not warehouse:raise APIError(409,"fulfillment_stock_allocation_missing","Selected warehouse has no unallocated committed stock for this order.")
   owner=warehouse["organization_id"]
   if p.assigned_to:
    assigned=await db.fetchval("select exists(select 1 from public.organization_memberships where organization_id=$1 and user_id=$2 and status='active')",owner,p.assigned_to)
    if not assigned:raise APIError(422,"fulfillment_assignee_not_member","Fulfillment assignee must be an active member of the warehouse-owning organization.")
   r=await db.fetchrow("insert into public.fulfillments(organization_id,order_id,warehouse_id,fulfillment_organization_id,assigned_to,created_by) values($1,$2,$3,$4,$5,$6) returning *",org,oid,p.warehouse_id,owner,p.assigned_to,actor)
   movements=await db.fetch("select * from public.stock_movements where reference_type='order' and reference_id=$1 and movement_type='commit' and organization_id=$2 and warehouse_id=$3",oid,owner,p.warehouse_id)
   for m in movements:
    item=await db.fetchrow("select id,quantity from public.order_items where organization_id=$1 and order_id=$2 and product_owner_organization_id=$3 and variant_id=$4 for update",org,oid,m["product_owner_organization_id"],m["variant_id"])
    if not item:raise APIError(409,"fulfillment_order_item_missing","Committed inventory does not map to an order item.")
    already=await db.fetchval("select coalesce(sum(quantity),0) from public.order_item_fulfillment_allocations where order_item_id=$1",item["id"])
    if Decimal(already)+Decimal(m["quantity"])>Decimal(item["quantity"]):raise APIError(409,"fulfillment_overallocation","Fulfillment allocation exceeds the order item quantity.")
    await db.execute("""insert into public.order_item_fulfillment_allocations(buyer_organization_id,order_id,order_item_id,fulfillment_id,inventory_owner_organization_id,warehouse_id,quantity)
     values($1,$2,$3,$4,$5,$6,$7)""",org,oid,item["id"],r["id"],owner,p.warehouse_id,m["quantity"])
   if o["status"]=="approved":
    await db.execute("update public.orders set status='processing',updated_at=now() where id=$1 and organization_id=$2",oid,org)
    await db.execute("insert into public.order_status_history(organization_id,order_id,from_status,to_status,actor_user_id) values($1,$2,'approved','processing',$3)",org,oid,actor)
   await self.audit(db,org,actor,"fulfillment.created","fulfillment",r["id"],{"order_id":str(oid),"fulfillment_organization_id":str(owner),"warehouse_id":str(p.warehouse_id)})
  return dict(r)
 async def update_fulfillment(self,db,org,actor,fid,p):
  async with db.transaction():
   f=await db.fetchrow("select * from public.fulfillments where organization_id=$1 and id=$2 for update",org,fid)
   if not f:raise APIError(404,"fulfillment_not_found","Fulfillment was not found.")
   if not can_transition_fulfillment(f["status"],p.status):raise APIError(409,"invalid_fulfillment_transition","Fulfillment status transition is not allowed.")
   allocations=await db.fetch("""select a.*,oi.product_id,oi.variant_id,oi.product_owner_organization_id
    from public.order_item_fulfillment_allocations a join public.order_items oi on oi.organization_id=a.buyer_organization_id and oi.id=a.order_item_id
    where a.buyer_organization_id=$1 and a.fulfillment_id=$2 for update of a""",org,fid)
   if p.status=="handed_over":
    if not allocations:raise APIError(409,"fulfillment_allocation_missing","Fulfillment has no committed order-item allocation.")
    for a in allocations:
     await db.execute("update public.inventory_balances set on_hand=on_hand-$4,committed=committed-$4,version=version+1,updated_at=now() where organization_id=$1 and warehouse_id=$2 and variant_id=$3 and on_hand >= $4 and committed >= $4",a["inventory_owner_organization_id"],a["warehouse_id"],a["variant_id"],a["quantity"])
     await db.execute("""insert into public.stock_movements(organization_id,warehouse_id,product_id,variant_id,movement_type,quantity,on_hand_delta,committed_delta,reference_type,reference_id,reason,actor_user_id,idempotency_key,product_owner_organization_id)
      values($1,$2,$3,$4,'stock_out',$5,-$5,-$5,'fulfillment',$6,'Stock handed over to carrier',$7,$8,$9)""",a["inventory_owner_organization_id"],a["warehouse_id"],a["product_id"],a["variant_id"],a["quantity"],fid,actor,f"fulfillment:{fid}:dispatch:{a['order_item_id']}",a["product_owner_organization_id"])
    pending_fulfillments=await db.fetchval("select count(*) from public.fulfillments where organization_id=$1 and order_id=$2 and status not in ('handed_over','delivered','cancelled') and id<>$3",org,f["order_id"],fid)
    unallocated_items=await db.fetchval("""select count(*) from public.order_items oi
     where oi.organization_id=$1 and oi.order_id=$2
      and coalesce((select sum(a.quantity) from public.order_item_fulfillment_allocations a where a.order_item_id=oi.id),0)<oi.quantity""",org,f["order_id"])
    if pending_fulfillments==0 and unallocated_items==0:
     await db.execute("update public.orders set status='fulfilled',fulfilled_at=now(),updated_at=now() where organization_id=$1 and id=$2 and status='processing'",org,f["order_id"])
     await db.execute("insert into public.order_status_history(organization_id,order_id,from_status,to_status,actor_user_id) values($1,$2,'processing','fulfilled',$3)",org,f["order_id"],actor)
   elif p.status in {"failed","cancelled"} and f["status"] in {"queued","picking","packed"}:
    for a in allocations:
     await db.execute("update public.inventory_balances set committed=committed-$4,version=version+1,updated_at=now() where organization_id=$1 and warehouse_id=$2 and variant_id=$3 and committed >= $4",a["inventory_owner_organization_id"],a["warehouse_id"],a["variant_id"],a["quantity"])
     await db.execute("""insert into public.stock_movements(organization_id,warehouse_id,product_id,variant_id,movement_type,quantity,committed_delta,reference_type,reference_id,reason,actor_user_id,idempotency_key,product_owner_organization_id)
      values($1,$2,$3,$4,'release',$5,-$5,'fulfillment',$6,$7,$8,$9,$10)""",a["inventory_owner_organization_id"],a["warehouse_id"],a["product_id"],a["variant_id"],a["quantity"],fid,p.status+" before carrier handover",actor,f"fulfillment:{fid}:release:{a['order_item_id']}",a["product_owner_organization_id"])
    await db.execute("update public.orders set status='approved',updated_at=now() where organization_id=$1 and id=$2 and status='processing'",org,f["order_id"])
    await db.execute("insert into public.order_status_history(organization_id,order_id,from_status,to_status,reason,actor_user_id) values($1,$2,'processing','approved',$3,$4)",org,f["order_id"],p.status+" before carrier handover",actor)
   await db.execute("update public.fulfillments set status=$3,carrier=coalesce($4,carrier),tracking_number=coalesce($5,tracking_number),updated_at=now() where id=$1 and organization_id=$2",fid,org,p.status,p.carrier,p.tracking_number)
   await self.audit(db,org,actor,"fulfillment.status.changed","fulfillment",fid,{"status":p.status,"fulfillment_organization_id":str(f["fulfillment_organization_id"])})
   row=await db.fetchrow("select * from public.fulfillments where id=$1 and organization_id=$2",fid,org)
  return dict(row)
 async def process_shipping_event(self,db,provider,event):
  event_id=str(event["event_id"]);tracking=str(event["tracking_number"]);status=str(event["status"])
  async with db.transaction():
   f=await db.fetchrow("select * from public.fulfillments where lower(carrier)=lower($1) and tracking_number=$2 for update",provider,tracking)
   if not f:raise APIError(404,"shipping_tracking_not_found","No fulfillment matches this provider and tracking number.")
   prior=await db.fetchrow("select id from public.shipping_provider_events where provider=$1 and provider_event_id=$2",provider,event_id)
   if prior:return {"accepted":True,"duplicate":True,"fulfillment_id":str(f["id"]),"status":f["status"]}
   if status=="delivered" and f["status"]!="handed_over":
    raise APIError(409,"shipping_status_transition_invalid","A signed delivery event is only accepted after carrier handover.")
   if status=="failed" and f["status"] not in {"handed_over","picking","packed"}:
    raise APIError(409,"shipping_status_transition_invalid","Provider failure event does not match the current fulfillment state.")
   await db.execute("""insert into public.shipping_provider_events(organization_id,provider,provider_event_id,tracking_number,event_type,payload,processed_at)
    values($1,$2,$3,$4,$5,$6::jsonb,now())""",f["organization_id"],provider,event_id,tracking,status,json.dumps({"event_id":event_id,"tracking_number":tracking,"status":status}))
   if status=="delivered":
    await db.execute("update public.fulfillments set status='delivered',external_status_at=now(),updated_at=now() where organization_id=$1 and id=$2",f["organization_id"],f["id"])
    await db.execute("update public.orders set status='completed',updated_at=now() where organization_id=$1 and id=$2 and status='fulfilled'",f["organization_id"],f["order_id"])
    await db.execute("insert into public.order_status_history(organization_id,order_id,from_status,to_status,reason) values($1,$2,'fulfilled','completed','Verified carrier delivery webhook')",f["organization_id"],f["order_id"])
   elif status=="failed":
    await db.execute("update public.fulfillments set status='failed',external_status_at=now(),updated_at=now() where organization_id=$1 and id=$2",f["organization_id"],f["id"])
   await self.audit(db,f["organization_id"],None,"shipping.provider_event.processed","fulfillment",f["id"],{"provider":provider,"event_id":event_id,"status":status})
  return {"accepted":True,"duplicate":False,"fulfillment_id":str(f["id"]),"status":status}

 async def partner_order_buyer(self,db,partner_org,order_id):
  return await db.fetchval("""select o.organization_id from public.orders o
   where o.id=$2 and o.status not in ('draft','expired','cancelled') and exists(
    select 1 from public.order_items oi
    where oi.organization_id=o.organization_id and oi.order_id=o.id
     and (oi.product_owner_organization_id=$1 or exists(
      select 1 from public.stock_movements sm
      where sm.reference_type='order' and sm.reference_id=o.id
       and sm.organization_id=$1 and sm.product_owner_organization_id=oi.product_owner_organization_id
       and sm.variant_id=oi.variant_id
     ))
   ) and exists(
    select 1 from public.commerce_catalog_access ca
    where ca.owner_organization_id=$1 and ca.consumer_organization_id=o.organization_id
     and ca.access_type in ('ordering','inventory')
     and (ca.product_id is null or exists(select 1 from public.order_items oi where oi.organization_id=o.organization_id and oi.order_id=o.id and oi.product_id=ca.product_id))
     and ca.starts_at<=now() and (ca.ends_at is null or ca.ends_at>now())
   )""",partner_org,order_id)

 async def partner_fulfillment_buyer(self,db,partner_org,fulfillment_id):
  return await db.fetchval("""select f.organization_id from public.fulfillments f
   join public.orders o on o.organization_id=f.organization_id and o.id=f.order_id
   where f.id=$2 and f.fulfillment_organization_id=$1 and exists(
    select 1 from public.commerce_catalog_access ca
    where ca.owner_organization_id=$1 and ca.consumer_organization_id=o.organization_id
     and ca.access_type in ('ordering','inventory')
     and (ca.product_id is null or exists(select 1 from public.order_items oi where oi.organization_id=o.organization_id and oi.order_id=o.id and oi.product_id=ca.product_id))
     and ca.starts_at<=now() and (ca.ends_at is null or ca.ends_at>now())
   )""",partner_org,fulfillment_id)

 async def list_partner_orders(self,db,partner_org,page,size,status=None):
  where=["exists(select 1 from public.order_items oi where oi.organization_id=o.organization_id and oi.order_id=o.id and (oi.product_owner_organization_id=$1 or exists(select 1 from public.stock_movements sm where sm.reference_type='order' and sm.reference_id=o.id and sm.organization_id=$1 and sm.product_owner_organization_id=oi.product_owner_organization_id and sm.variant_id=oi.variant_id)))",
   "exists(select 1 from public.commerce_catalog_access ca where ca.owner_organization_id=$1 and ca.consumer_organization_id=o.organization_id and ca.access_type in ('ordering','inventory') and (ca.product_id is null or exists(select 1 from public.order_items oi where oi.organization_id=o.organization_id and oi.order_id=o.id and oi.product_id=ca.product_id)) and ca.starts_at<=now() and (ca.ends_at is null or ca.ends_at>now()))"]
  args=[partner_org]
  if status:
   args.append(status)
   where.append(f"o.status=${len(args)}")
  clause=" and ".join(where)
  total=await db.fetchval(f"select count(*) from public.orders o where {clause}",*args)
  args.extend([size,(page-1)*size])
  rows=await db.fetch(f"""select o.id,o.organization_id buyer_organization_id,o.order_number,o.status,o.currency,
   count(distinct oi.id) partner_item_count,coalesce(sum(oi.line_total),0) partner_item_total,o.created_at,o.updated_at
   from public.orders o join public.order_items oi on oi.organization_id=o.organization_id and oi.order_id=o.id
   where o.status not in ('draft','expired','cancelled') and {clause} and (oi.product_owner_organization_id=$1 or exists(
    select 1 from public.stock_movements sm where sm.reference_type='order' and sm.reference_id=o.id
     and sm.organization_id=$1 and sm.product_owner_organization_id=oi.product_owner_organization_id and sm.variant_id=oi.variant_id
   ))
   group by o.id order by o.created_at desc limit ${len(args)-1} offset ${len(args)}""",*args)
  return {"items":[dict(r) for r in rows],"page":page,"page_size":size,"total":total}

 async def get_partner_order(self,db,partner_org,order_id):
  o=await db.fetchrow("""select o.id,o.organization_id buyer_organization_id,o.order_number,o.status,o.currency,o.created_at,o.updated_at
   from public.orders o where o.id=$2 and o.status not in ('draft','expired','cancelled') and exists(
    select 1 from public.order_items oi where oi.organization_id=o.organization_id and oi.order_id=o.id
     and (oi.product_owner_organization_id=$1 or exists(select 1 from public.stock_movements sm where sm.reference_type='order' and sm.reference_id=o.id and sm.organization_id=$1 and sm.product_owner_organization_id=oi.product_owner_organization_id and sm.variant_id=oi.variant_id))
   ) and exists(select 1 from public.commerce_catalog_access ca where ca.owner_organization_id=$1 and ca.consumer_organization_id=o.organization_id and ca.access_type in ('ordering','inventory') and (ca.product_id is null or exists(select 1 from public.order_items oi where oi.organization_id=o.organization_id and oi.order_id=o.id and oi.product_id=ca.product_id)) and ca.starts_at<=now() and (ca.ends_at is null or ca.ends_at>now()))""",partner_org,order_id)
  if not o:return None
  d=dict(o)
  d["items"]=[dict(x) for x in await db.fetch("""select oi.id,oi.product_id,oi.variant_id,oi.product_owner_organization_id,oi.product_snapshot,oi.quantity,oi.unit_price,oi.discount_amount,oi.tax_amount,oi.line_total
   from public.order_items oi where oi.organization_id=$1 and oi.order_id=$2 and (oi.product_owner_organization_id=$3 or exists(
    select 1 from public.stock_movements sm where sm.reference_type='order' and sm.reference_id=$2 and sm.organization_id=$3 and sm.product_owner_organization_id=oi.product_owner_organization_id and sm.variant_id=oi.variant_id
   )) order by oi.created_at""",o["buyer_organization_id"],order_id,partner_org)]
  d["fulfillments"]=[dict(x) for x in await db.fetch("select * from public.fulfillments where organization_id=$1 and order_id=$2 and fulfillment_organization_id=$3 order by created_at",o["buyer_organization_id"],order_id,partner_org)]
  return d

 async def list_orders(self,db,org,actor,page,size,status=None,tenant_scope=False):
  where=["organization_id=$1"] if tenant_scope else ["organization_id=$1","customer_user_id=$2"]
  args=[org] if tenant_scope else [org,actor]
  if status:args.append(status);where.append(f"status=${len(args)}")
  clause=" and ".join(where); total=await db.fetchval(f"select count(*) from public.orders where {clause}",*args)
  args.extend([size,(page-1)*size])
  rows=await db.fetch(f"select id,order_number,status,currency,subtotal,discount_total,tax_total,grand_total,created_at,updated_at from public.orders where {clause} order by created_at desc limit ${len(args)-1} offset ${len(args)}",*args)
  return {"items":[dict(r) for r in rows],"page":page,"page_size":size,"total":total}

 async def get_order(self,db,org,actor,oid,allow_tenant=False):
  q="select * from public.orders where organization_id=$1 and id=$2"+("" if allow_tenant else " and customer_user_id=$3")
  args=(org,oid) if allow_tenant else (org,oid,actor)
  r=await db.fetchrow(q,*args)
  if not r:return None
  d=dict(r)
  for key,sql in [("items","select * from public.order_items where organization_id=$1 and order_id=$2 order by created_at"),("history","select * from public.order_status_history where organization_id=$1 and order_id=$2 order by occurred_at"),("approvals","select * from public.order_approvals where organization_id=$1 and order_id=$2 order by decided_at"),("fulfillments","select * from public.fulfillments where organization_id=$1 and order_id=$2 order by created_at")]:
   d[key]=[dict(x) for x in await db.fetch(sql,org,oid)]
  return d


 async def list_categories(self,db,org):
  rows=await db.fetch("select id,parent_id,code,name,description,sort_order,status from public.product_categories where organization_id=$1 and status='active' order by sort_order,name",org)
  return [dict(x) for x in rows]

 async def create_category(self,db,org,actor,p):
  async with db.transaction():
   r=await db.fetchrow("insert into public.product_categories(organization_id,parent_id,code,name,description,sort_order) values($1,$2,$3,$4,$5,$6) returning *",org,p.parent_id,p.code,p.name,p.description,p.sort_order)
   await self.audit(db,org,actor,"product.category.created","product_category",r["id"],{"code":p.code})
  return dict(r)

 async def list_brands(self,db,org):
  rows=await db.fetch("select id,name,status from public.product_brands where organization_id=$1 and status='active' order by name",org)
  return [dict(x) for x in rows]

 async def list_units(self,db,org):
  rows=await db.fetch("select id,code,name,symbol,decimal_places,status from public.units_of_measure where organization_id=$1 and status='active' order by name",org)
  return [dict(x) for x in rows]

 async def create_brand(self,db,org,actor,p):
  async with db.transaction():
   r=await db.fetchrow("insert into public.product_brands(organization_id,name) values($1,$2) returning *",org,p.name)
   await self.audit(db,org,actor,"product.brand.created","product_brand",r["id"],{"name":p.name})
  return dict(r)

 async def create_unit(self,db,org,actor,p):
  async with db.transaction():
   r=await db.fetchrow("insert into public.units_of_measure(organization_id,code,name,symbol,decimal_places) values($1,$2,$3,$4,$5) returning *",org,p.code,p.name,p.symbol,p.decimal_places)
   await self.audit(db,org,actor,"product.unit.created","unit_of_measure",r["id"],{"code":p.code})
  return dict(r)

 async def list_price_lists(self,db,org):
  rows=await db.fetch("""select pl.*,
   coalesce((select jsonb_agg(jsonb_build_object('id',pp.id,'product_id',pp.product_id,'variant_id',pp.variant_id,'unit_price',pp.unit_price,'minimum_quantity',pp.minimum_quantity,'maximum_quantity',pp.maximum_quantity,'effective_from',pp.effective_from,'effective_until',pp.effective_until)) from public.product_prices pp where pp.organization_id=pl.organization_id and pp.price_list_id=pl.id),'[]'::jsonb) prices
   from public.price_lists pl where pl.organization_id=$1 order by pl.priority,pl.created_at desc""",org)
  return [dict(x) for x in rows]

 async def update_price_list(self,db,org,actor,price_list_id,p):
  async with db.transaction():
   await db.execute("select set_config('app.actor_id',$1,true)",str(actor))
   current=await db.fetchrow("select * from public.price_lists where organization_id=$1 and id=$2 for update",org,price_list_id)
   if not current:raise APIError(404,"price_list_not_found","Price list was not found in this organization.")
   await db.execute("""update public.price_lists set name=$3,code=$4,currency=$5,scope_type=$6,scope_id=$7,channel=$8,priority=$9,
    effective_from=$10::timestamptz,effective_until=$11::timestamptz,status=$12,updated_at=now()
    where organization_id=$1 and id=$2""",org,price_list_id,p.name,p.code.upper(),p.currency.upper(),p.scope_type,p.scope_id,p.channel,p.priority,p.effective_from,p.effective_until,p.status)
   wanted={(str(line.product_id),str(line.variant_id),str(line.minimum_quantity)) for line in p.prices}
   old_lines=await db.fetch("select * from public.product_prices where organization_id=$1 and price_list_id=$2 for update",org,price_list_id)
   for old in old_lines:
    key=(str(old["product_id"]),str(old["variant_id"]),str(old["minimum_quantity"]))
    if key not in wanted:
     end=max(datetime.now(UTC),old["effective_from"]+timedelta(microseconds=1))
     await db.execute("update public.product_prices set effective_until=$3 where organization_id=$1 and id=$2 and (effective_until is null or effective_until>now())",org,old["id"],end)
   for line in p.prices:
    valid=await db.fetchval("""select exists(select 1 from public.products p join public.product_variants v on v.organization_id=p.organization_id and v.product_id=p.id
      where p.organization_id=$1 and p.id=$2 and v.id=$3 and p.status<>'archived' and v.status<>'archived')""",org,line.product_id,line.variant_id)
    if not valid:raise APIError(422,"invalid_price_product","Every price line must reference a product and SKU owned by this tenant.")
    existing=await db.fetchrow("""select id from public.product_prices where organization_id=$1 and price_list_id=$2 and product_id=$3 and variant_id=$4 and minimum_quantity=$5
     order by effective_from desc limit 1 for update""",org,price_list_id,line.product_id,line.variant_id,line.minimum_quantity)
    if existing:
     await db.execute("""update public.product_prices set unit_price=$3,maximum_quantity=$4,effective_from=$5::timestamptz,effective_until=$6::timestamptz
      where organization_id=$1 and id=$2""",org,existing["id"],line.unit_price,line.maximum_quantity,p.effective_from,p.effective_until)
    else:
     await db.execute("""insert into public.product_prices(organization_id,price_list_id,product_id,variant_id,unit_price,minimum_quantity,maximum_quantity,effective_from,effective_until)
      values($1,$2,$3,$4,$5,$6,$7,$8::timestamptz,$9::timestamptz)""",org,price_list_id,line.product_id,line.variant_id,line.unit_price,line.minimum_quantity,line.maximum_quantity,p.effective_from,p.effective_until)
   await self.audit(db,org,actor,"pricing.price_list.updated","price_list",price_list_id,{"status":p.status,"price_count":len(p.prices)})
  return dict(await db.fetchrow("select * from public.price_lists where organization_id=$1 and id=$2",org,price_list_id))

 async def create_price_list(self,db,org,actor,p):
  async with db.transaction():
   await db.execute("select set_config('app.actor_id',$1,true)",str(actor))
   pl=await db.fetchrow("""insert into public.price_lists(organization_id,name,code,currency,scope_type,scope_id,channel,priority,effective_from,effective_until,status,created_by)
    values($1,$2,$3,$4,$5,$6,$7,$8,$9::timestamptz,$10::timestamptz,$11,$12) returning *""",
    org,p.name,p.code.upper(),p.currency.upper(),p.scope_type,p.scope_id,p.channel,p.priority,p.effective_from,p.effective_until,p.status,actor)
   for line in p.prices:
    valid=await db.fetchval("""select exists(select 1 from public.products p join public.product_variants v on v.organization_id=p.organization_id and v.product_id=p.id
      where p.organization_id=$1 and p.id=$2 and v.id=$3 and p.status<>'archived' and v.status<>'archived')""",org,line.product_id,line.variant_id)
    if not valid:raise APIError(422,"invalid_price_product","Every price line must reference a product and SKU owned by this tenant.")
    await db.execute("""insert into public.product_prices(organization_id,price_list_id,product_id,variant_id,unit_price,minimum_quantity,maximum_quantity,effective_from,effective_until)
      values($1,$2,$3,$4,$5,$6,$7,$8::timestamptz,$9::timestamptz)""",
      org,pl["id"],line.product_id,line.variant_id,line.unit_price,line.minimum_quantity,line.maximum_quantity,p.effective_from,p.effective_until)
   await self.audit(db,org,actor,"pricing.price_list.created","price_list",pl["id"],{"code":p.code,"price_count":len(p.prices)})
  return dict(pl)

 async def list_warehouses(self,db,org):
  rows=await db.fetch("select id,branch_id,code,name,address,status,created_at from public.warehouses where organization_id=$1 and status='active' order by name",org)
  return [dict(x) for x in rows]

 async def create_warehouse(self,db,org,actor,p):
  async with db.transaction():
   r=await db.fetchrow("insert into public.warehouses(organization_id,branch_id,code,name,address) values($1,$2,$3,$4,$5) returning *",org,p.branch_id,p.code.upper(),p.name,p.address)
   await self.audit(db,org,actor,"inventory.warehouse.created","warehouse",r["id"],{"code":p.code})
  return dict(r)

 async def create_catalog_access(self,db,org,actor,p):
  if p.consumer_organization_id==org:raise APIError(422,"invalid_catalog_consumer","Catalog access consumer must be another organization.")
  linked=await db.fetchval("""select exists(select 1 from public.commerce_partner_links where organization_id=$1 and partner_organization_id=$2 and status='active' and starts_at<=now() and (ends_at is null or ends_at>now()))""",org,p.consumer_organization_id)
  if not linked:raise APIError(403,"partner_relationship_required","An active principal/distributor/customer relationship is required before catalog access can be granted.")
  async with db.transaction():
   r=await db.fetchrow("""insert into public.commerce_catalog_access(owner_organization_id,consumer_organization_id,product_id,access_type,starts_at,ends_at,created_by)
    values($1,$2,$3,$4,$5::timestamptz,$6::timestamptz,$7) returning *""",org,p.consumer_organization_id,p.product_id,p.access_type,p.starts_at,p.ends_at,actor)
   await self.audit(db,org,actor,"catalog.access.granted","commerce_catalog_access",r["id"],{"consumer_organization_id":str(p.consumer_organization_id),"access_type":p.access_type})
  return dict(r)

 async def create_product_image(self,db,org,actor,p):
  if not p.storage_path.startswith(str(org)+"/"+str(p.product_id)+"/"):
   raise APIError(422,"invalid_product_image_path","Product image must be stored under the tenant/product private bucket path.")
  async with db.transaction():
   exists=await db.fetchval("select exists(select 1 from public.products where organization_id=$1 and id=$2)",org,p.product_id)
   if not exists:raise APIError(404,"product_not_found","Product was not found.")
   r=await db.fetchrow("""insert into public.product_images(organization_id,product_id,variant_id,storage_path,mime_type,size_bytes,alt_text,sort_order)
    values($1,$2,$3,$4,$5,$6,$7,$8) returning *""",org,p.product_id,p.variant_id,p.storage_path,p.mime_type,p.size_bytes,p.alt_text,p.sort_order)
   await self.audit(db,org,actor,"product.image.registered","product_image",r["id"],{"storage_path":p.storage_path})
  return dict(r)

 async def transfer_stock(self,db,org,actor,p):
  async with db.transaction():
   old=await db.fetchrow("select * from public.stock_transfers where organization_id=$1 and idempotency_key=$2",org,p.idempotency_key)
   if old:return dict(old)
   if p.from_warehouse_id==p.to_warehouse_id:raise APIError(422,"same_transfer_warehouse","Source and destination warehouses must differ.")
   owner=await db.fetchval("""select p.organization_id from public.products p
    join public.product_variants v on v.organization_id=p.organization_id and v.product_id=p.id
    where p.id=$2 and v.id=$3 and p.status='published' and v.status='active'
     and (p.organization_id=$1 or exists(select 1 from public.commerce_catalog_access ca
      where ca.owner_organization_id=p.organization_id and ca.consumer_organization_id=$1
       and ca.access_type='inventory' and (ca.product_id is null or ca.product_id=p.id)
       and ca.starts_at<=now() and (ca.ends_at is null or ca.ends_at>now())))""",org,p.product_id,p.variant_id)
   if not owner:raise APIError(404,"inventory_reference_not_found","Product or SKU is not available for inventory operations in this organization.")
   await db.execute("insert into public.inventory_balances(organization_id,warehouse_id,product_id,variant_id,product_owner_organization_id) values($1,$2,$4,$5,$6),($1,$3,$4,$5,$6) on conflict do nothing",org,p.from_warehouse_id,p.to_warehouse_id,p.product_id,p.variant_id,owner)
   balances=await db.fetch("select * from public.inventory_balances where organization_id=$1 and variant_id=$2 and warehouse_id=any($3::uuid[]) order by warehouse_id for update",org,p.variant_id,[p.from_warehouse_id,p.to_warehouse_id])
   source=next((b for b in balances if b["warehouse_id"]==p.from_warehouse_id),None)
   target=next((b for b in balances if b["warehouse_id"]==p.to_warehouse_id),None)
   if source is None or target is None or source["product_owner_organization_id"]!=owner or target["product_owner_organization_id"]!=owner or Decimal(source["available"])<p.quantity:raise APIError(409,"insufficient_transfer_stock","Source warehouse has insufficient authorized available stock.")
   await db.execute("update public.inventory_balances set on_hand=on_hand-$4,version=version+1,updated_at=now() where organization_id=$1 and warehouse_id=$2 and variant_id=$3",org,p.from_warehouse_id,p.variant_id,p.quantity)
   await db.execute("update public.inventory_balances set on_hand=on_hand+$4,version=version+1,updated_at=now() where organization_id=$1 and warehouse_id=$2 and variant_id=$3",org,p.to_warehouse_id,p.variant_id,p.quantity)
   transfer=await db.fetchrow("""insert into public.stock_transfers(organization_id,from_warehouse_id,to_warehouse_id,product_id,variant_id,quantity,reason,actor_user_id,idempotency_key,product_owner_organization_id)
    values($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) returning *""",org,p.from_warehouse_id,p.to_warehouse_id,p.product_id,p.variant_id,p.quantity,p.reason,actor,p.idempotency_key,owner)
   await db.execute("""insert into public.stock_movements(organization_id,warehouse_id,product_id,variant_id,movement_type,quantity,on_hand_delta,reference_type,reference_id,reason,actor_user_id,idempotency_key,product_owner_organization_id)
    values($1,$2,$4,$5,'transfer_out',$6,-$6,'stock_transfer',$7,$8,$9,$10,$12),($1,$3,$4,$5,'transfer_in',$6,$6,'stock_transfer',$7,$8,$9,$11,$12)""",
    org,p.from_warehouse_id,p.to_warehouse_id,p.product_id,p.variant_id,p.quantity,transfer["id"],p.reason,actor,p.idempotency_key+":out",p.idempotency_key+":in",owner)
   await self.audit(db,org,actor,"inventory.stock.transferred","stock_transfer",transfer["id"],{"quantity":str(p.quantity),"product_owner_organization_id":str(owner)})
  return dict(transfer)
 async def cancel_order(self,db,org,actor,oid,reason):
  async with db.transaction():
   o=await db.fetchrow("select * from public.orders where organization_id=$1 and id=$2 for update",org,oid)
   if not o:raise APIError(404,"order_not_found","Order was not found.")
   if o["status"]=="cancelled":return dict(o)
   if not can_cancel_order(o["status"]):raise APIError(409,"order_cannot_be_cancelled","Order cannot be cancelled after fulfillment processing has started.")
   movement_type="reserve" if o["status"]=="pending_approval" else "commit" if o["status"]=="approved" else None
   if movement_type:
    movements=await db.fetch("select * from public.stock_movements where reference_type='order' and reference_id=$1 and movement_type=$2",oid,movement_type)
    for m in movements:
     owner=m["organization_id"]
     if movement_type=="reserve":
      await db.execute("update public.inventory_balances set reserved=reserved-$4,version=version+1,updated_at=now() where organization_id=$1 and warehouse_id=$2 and variant_id=$3 and reserved >= $4",owner,m["warehouse_id"],m["variant_id"],m["quantity"])
      await db.execute("""insert into public.stock_movements(organization_id,warehouse_id,product_id,variant_id,movement_type,quantity,reserved_delta,reference_type,reference_id,reason,actor_user_id,idempotency_key,product_owner_organization_id)
       values($1,$2,$3,$4,'release',$5,-$5,'order',$6,$7,$8,$9,$10)""",owner,m["warehouse_id"],m["product_id"],m["variant_id"],m["quantity"],oid,reason,actor,f"order:{oid}:cancel:{m['id']}",m["product_owner_organization_id"])
     else:
      await db.execute("update public.inventory_balances set committed=committed-$4,version=version+1,updated_at=now() where organization_id=$1 and warehouse_id=$2 and variant_id=$3 and committed >= $4",owner,m["warehouse_id"],m["variant_id"],m["quantity"])
      await db.execute("""insert into public.stock_movements(organization_id,warehouse_id,product_id,variant_id,movement_type,quantity,committed_delta,reference_type,reference_id,reason,actor_user_id,idempotency_key,product_owner_organization_id)
       values($1,$2,$3,$4,'release',$5,-$5,'order',$6,$7,$8,$9,$10)""",owner,m["warehouse_id"],m["product_id"],m["variant_id"],m["quantity"],oid,reason,actor,f"order:{oid}:cancel:{m['id']}",m["product_owner_organization_id"])
   await db.execute("update public.promotion_redemptions set status='reversed',reversed_at=now() where organization_id=$1 and order_id=$2 and status in ('reserved','redeemed')",org,oid)
   await db.execute("update public.orders set status='cancelled',cancelled_at=now(),updated_at=now() where organization_id=$1 and id=$2",org,oid)
   await db.execute("insert into public.order_status_history(organization_id,order_id,from_status,to_status,reason,actor_user_id) values($1,$2,$3,'cancelled',$4,$5)",org,oid,o["status"],reason,actor)
   await self.audit(db,org,actor,"order.cancelled","order",oid,{"reason":reason})
  return await self.get_order(db,org,actor,oid,True)
 async def list_partner_organizations(self,db,org):
  rows=await db.fetch("""select o.id,o.slug,o.name,pl.relationship_type,pl.starts_at,pl.ends_at
   from public.commerce_partner_links pl join public.organizations o on o.id=pl.partner_organization_id
   where pl.organization_id=$1 and pl.relationship_type='customer' and pl.status='active'
   and pl.starts_at<=now() and (pl.ends_at is null or pl.ends_at>now()) and o.status='active' order by o.name""",org)
  return [dict(x) for x in rows]

 async def create_partner_link(self,db,org,actor,p):
  if p.partner_organization_id==org:raise APIError(422,"invalid_partner","Partner organization must differ from current tenant.")
  async with db.transaction():
   active=await db.fetchval("select exists(select 1 from public.organizations where id=$1 and status='active')",p.partner_organization_id)
   if not active:raise APIError(404,"partner_organization_not_found","Partner organization is not active.")
   r=await db.fetchrow("""insert into public.commerce_partner_links(organization_id,partner_organization_id,relationship_type,status,starts_at,ends_at,created_by)
    values($1,$2,$3,'active',$4::timestamptz,$5::timestamptz,$6) returning *""",org,p.partner_organization_id,p.relationship_type,p.starts_at,p.ends_at,actor)
   await self.audit(db,org,actor,"commerce.partner_link.created","commerce_partner_link",r["id"],{"partner_organization_id":str(p.partner_organization_id),"relationship_type":p.relationship_type})
  return dict(r)

 async def set_assisted_customer(self,db,org,actor,p):
  if p.customer_organization_id==org:raise APIError(422,"invalid_customer_organization","Assisted customer must be a different organization.")
  linked=await db.fetchval("""select exists(select 1 from public.commerce_partner_links where organization_id=$1 and partner_organization_id=$2 and relationship_type='customer' and status='active' and starts_at<=now() and (ends_at is null or ends_at>now()))""",org,p.customer_organization_id)
  if not linked:raise APIError(403,"customer_relationship_required","Customer must be an active linked partner organization.")
  async with db.transaction():
   await db.execute("update public.carts set status='expired',version=version+1,updated_at=now() where organization_id=$1 and owner_user_id=$2 and status='active' and expires_at<=now()",org,actor)
   cart=await db.fetchrow("select * from public.carts where organization_id=$1 and owner_user_id=$2 and status='active' and expires_at>now() for update",org,actor)
   if cart is None:
    cart=await db.fetchrow("""insert into public.carts(organization_id,owner_user_id,customer_organization_id,channel)
      values($1,$2,$3,'sales_assisted') returning *""",org,actor,p.customer_organization_id)
   else:
    if await db.fetchval("select exists(select 1 from public.cart_items where organization_id=$1 and cart_id=$2)",org,cart["id"]):
     raise APIError(409,"cart_not_empty","Customer context cannot change after items are added to the cart.")
    cart=await db.fetchrow("""update public.carts set customer_organization_id=$3,channel='sales_assisted',version=version+1,updated_at=now()
      where organization_id=$1 and id=$2 returning *""",org,cart["id"],p.customer_organization_id)
   await self.audit(db,org,actor,"cart.assisted_customer.set","cart",cart["id"],{"customer_organization_id":str(p.customer_organization_id)})
  return dict(cart)


 async def list_price_history(self,db,org,price_list_id,page,size):
  exists=await db.fetchval("select exists(select 1 from public.price_lists where organization_id=$1 and id=$2)",org,price_list_id)
  if not exists:raise APIError(404,"price_list_not_found","Price list was not found.")
  total=await db.fetchval("select count(*) from public.price_list_history where organization_id=$1 and price_list_id=$2",org,price_list_id)
  rows=await db.fetch("""select id,entity_type,entity_id,action,before_snapshot,after_snapshot,actor_user_id,occurred_at
   from public.price_list_history where organization_id=$1 and price_list_id=$2 order by occurred_at desc limit $3 offset $4""",org,price_list_id,size,(page-1)*size)
  return {"items":[dict(x) for x in rows],"page":page,"page_size":size,"total":total}


 async def list_approval_policies(self,db,org):
  rows=await db.fetch("select * from public.order_approval_policies where organization_id=$1 order by minimum_total desc,created_at desc",org)
  return [dict(x) for x in rows]

 async def create_approval_policy(self,db,org,actor,p):
  async with db.transaction():
   r=await db.fetchrow("""insert into public.order_approval_policies(organization_id,name,minimum_total,maximum_total,required_approval_count,required_roles,auto_approve_below,status)
    values($1,$2,$3,$4,$5,$6,$7,$8) returning *""",org,p.name,p.minimum_total,p.maximum_total,p.required_approval_count,p.required_roles,p.auto_approve_below,p.status)
   await self.audit(db,org,actor,"order.approval_policy.created","order_approval_policy",r["id"],{"name":p.name,"required_approval_count":p.required_approval_count})
  return dict(r)

 async def audit(self,db,org,actor,action,kind,rid,metadata):
  await db.execute("insert into public.commerce_audit_events(organization_id,actor_user_id,action,resource_type,resource_id,metadata) values($1,$2,$3,$4,$5,$6::jsonb)",org,actor,action,kind,rid,json.dumps(metadata,default=str))

smart_order_repository=SmartOrderRepository()
