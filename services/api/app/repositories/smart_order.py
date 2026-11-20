# ruff: noqa: E701, E702
from __future__ import annotations
import json
from decimal import Decimal, ROUND_HALF_UP
from uuid import uuid4
import asyncpg
from app.errors import APIError

CENT=Decimal("0.01")
def money(v): return Decimal(str(v)).quantize(CENT,rounding=ROUND_HALF_UP)
def rowdict(r): return dict(r) if r is not None else None

class SmartOrderRepository:
 async def list_products(self,db,org,search,category,page,size):
  where=["p.status='published'","(p.organization_id=$1 or exists(select 1 from public.commerce_catalog_access ca where ca.owner_organization_id=p.organization_id and ca.consumer_organization_id=$1 and ca.access_type='catalog' and ca.starts_at<=now() and (ca.ends_at is null or ca.ends_at>now()) and (ca.product_id is null or ca.product_id=p.id)))"]; args=[org]
  if search: args.append(search); where.append(f"to_tsvector('simple',coalesce(p.name,'')||' '||coalesce(p.product_code,'')||' '||coalesce(p.description,'')) @@ plainto_tsquery('simple',${len(args)})")
  if category: args.append(category); where.append(f"p.category_id=${len(args)}")
  clause=" and ".join(where); total=await db.fetchval(f"select count(*) from public.products p where {clause}",*args)
  args.extend([size,(page-1)*size])
  rows=await db.fetch(f"""select p.id,p.organization_id,p.product_code,p.name,p.description,p.specifications,p.tax_rate,p.category_id,c.name category_name,b.name brand_name,
   coalesce((select jsonb_agg(jsonb_build_object('id',v.id,'sku',v.sku,'name',v.name,'attributes',v.attributes,'weight_grams',v.weight_grams)) from public.product_variants v where v.organization_id=p.organization_id and v.product_id=p.id and v.status='active'),'[]'::jsonb) variants
   from public.products p left join public.product_categories c on c.organization_id=p.organization_id and c.id=p.category_id
   left join public.product_brands b on b.organization_id=p.organization_id and b.id=p.brand_id where {clause}
   order by p.updated_at desc,p.name limit ${len(args)-1} offset ${len(args)}""",*args)
  return {"items":[dict(r) for r in rows],"page":page,"page_size":size,"total":total}

 async def get_product(self,db,org,pid):
  r=await db.fetchrow("""select p.*,c.name category_name,b.name brand_name,
   coalesce((select jsonb_agg(to_jsonb(v)-'organization_id') from public.product_variants v where v.organization_id=p.organization_id and v.product_id=p.id),'[]'::jsonb) variants,
   coalesce((select jsonb_agg(jsonb_build_object('id',i.id,'storage_path',i.storage_path,'mime_type',i.mime_type,'alt_text',i.alt_text)) from public.product_images i where i.organization_id=p.organization_id and i.product_id=p.id),'[]'::jsonb) images
   from public.products p left join public.product_categories c on c.organization_id=p.organization_id and c.id=p.category_id
   left join public.product_brands b on b.organization_id=p.organization_id and b.id=p.brand_id where p.organization_id=$1 and p.id=$2""",org,pid)
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

 async def update_product_status(self,db,org,actor,pid,status):
  async with db.transaction():
   r=await db.fetchrow("""update public.products set status=$3,published_at=case when $3='published' then coalesce(published_at,now()) else published_at end,updated_by=$4,updated_at=now()
     where organization_id=$1 and id=$2 returning id""",org,pid,status,actor)
   if not r:return None
   await self.audit(db,org,actor,"product.status.changed","product",pid,{"status":status})
  return await self.get_product(db,org,pid)

 async def price_quote(self,db,org,pid,vid,qty,customer=None):
  r=await db.fetchrow("""select pp.unit_price,pl.currency,pl.id price_list_id,pl.name price_list_name,pl.scope_type,p.tax_rate,v.sku,p.name product_name,v.name variant_name
   from public.product_prices pp join public.price_lists pl on pl.organization_id=pp.organization_id and pl.id=pp.price_list_id
   join public.products p on p.organization_id=pp.organization_id and p.id=pp.product_id
   join public.product_variants v on v.organization_id=pp.organization_id and v.id=pp.variant_id
   where pp.product_id=$2 and pp.variant_id=$3 and pl.status='active' and pl.effective_from<=now() and (pl.effective_until is null or pl.effective_until>now())
   and pp.effective_from<=now() and (pp.effective_until is null or pp.effective_until>now()) and pp.minimum_quantity<=$4 and (pp.maximum_quantity is null or pp.maximum_quantity>=$4)
   and ((pl.scope_type='tenant' and pl.scope_id is null) or (pl.scope_type='customer' and pl.scope_id=$5) or (pl.scope_type='distributor' and pl.scope_id=$1) or (pl.scope_type='contract' and pl.scope_id=$5))
   and (pp.organization_id=$1 or exists(select 1 from public.commerce_catalog_access ca where ca.owner_organization_id=pp.organization_id and ca.consumer_organization_id=$1 and ca.access_type='pricing' and ca.starts_at<=now() and (ca.ends_at is null or ca.ends_at>now())))
   order by case when pl.scope_id=$5 then 0 else 1 end,pl.priority asc,pl.effective_from desc limit 1""",org,pid,vid,qty,customer)
  if not r: raise APIError(409,"price_not_available","No effective server-side price exists for this SKU and quantity.")
  return dict(r)

 async def list_inventory(self,db,org,variant=None,warehouse=None):
  q="""select ib.id,ib.warehouse_id,w.code warehouse_code,w.name warehouse_name,ib.product_id,ib.variant_id,ib.on_hand,ib.reserved,ib.committed,ib.available,ib.version,ib.updated_at
   from public.inventory_balances ib join public.warehouses w on w.organization_id=ib.organization_id and w.id=ib.warehouse_id where ib.organization_id=$1"""
  args=[org]
  if variant: args.append(variant); q+=f" and ib.variant_id=${len(args)}"
  if warehouse: args.append(warehouse); q+=f" and ib.warehouse_id=${len(args)}"
  return [dict(r) for r in await db.fetch(q+" order by w.name",*args)]

 async def move_stock(self,db,org,actor,p):
  async with db.transaction():
   old=await db.fetchrow("select * from public.stock_movements where organization_id=$1 and idempotency_key=$2",org,p.idempotency_key)
   if old:return dict(old)
   valid=await db.fetchval("""select exists(select 1 from public.warehouses w join public.product_variants v on v.organization_id=w.organization_id and v.id=$4 and v.product_id=$3
     where w.organization_id=$1 and w.id=$2 and w.status='active' and v.status='active')""",org,p.warehouse_id,p.product_id,p.variant_id)
   if not valid: raise APIError(404,"inventory_reference_not_found","Warehouse, product or SKU is not active in this tenant.")
   await db.execute("insert into public.inventory_balances(organization_id,warehouse_id,product_id,variant_id) values($1,$2,$3,$4) on conflict do nothing",org,p.warehouse_id,p.product_id,p.variant_id)
   b=await db.fetchrow("select * from public.inventory_balances where organization_id=$1 and warehouse_id=$2 and variant_id=$3 for update",org,p.warehouse_id,p.variant_id)
   delta=p.quantity if p.movement_type=="stock_in" else (-p.quantity if p.movement_type=="stock_out" else p.adjustment_delta)
   new=Decimal(b["on_hand"])+delta
   if new<0 or new<Decimal(b["reserved"])+Decimal(b["committed"]): raise APIError(409,"stock_below_allocations","Movement would reduce on-hand below reserved and committed stock.")
   await db.execute("update public.inventory_balances set on_hand=$4,version=version+1,updated_at=now() where organization_id=$1 and warehouse_id=$2 and variant_id=$3",org,p.warehouse_id,p.variant_id,new)
   m=await db.fetchrow("""insert into public.stock_movements(organization_id,warehouse_id,product_id,variant_id,movement_type,quantity,on_hand_delta,reason,actor_user_id,idempotency_key)
    values($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) returning *""",org,p.warehouse_id,p.product_id,p.variant_id,p.movement_type,p.quantity,delta,p.reason,actor,p.idempotency_key)
   await self.audit(db,org,actor,"inventory.movement.recorded","stock_movement",m["id"],{"type":p.movement_type,"quantity":str(p.quantity)})
  return dict(m)

 async def list_promotions(self,db,org):
  rows=await db.fetch("""select p.id,p.code,p.name,p.description,p.priority,p.stackable,p.stacking_group,p.starts_at,p.ends_at,p.status,
   coalesce(jsonb_agg(jsonb_build_object('rule_type',r.rule_type,'rule_config',r.rule_config)) filter(where r.id is not null),'[]'::jsonb) rules
   from public.promotions p left join public.promotion_rules r on r.organization_id=p.organization_id and r.promotion_id=p.id
   where p.organization_id=$1 and p.status='active' and p.starts_at<=now() and p.ends_at>now() group by p.id order by p.priority""",org)
  return [dict(r) for r in rows]

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

 async def get_cart(self,db,org,actor):
  async with db.transaction():
   c=await db.fetchrow("select * from public.carts where organization_id=$1 and owner_user_id=$2 and status='active' and expires_at>now() for update",org,actor)
   if not c:c=await db.fetchrow("insert into public.carts(organization_id,owner_user_id) values($1,$2) returning *",org,actor)
  items=await db.fetch("""select ci.id,ci.product_id,ci.variant_id,ci.quantity,ci.notes,p.name product_name,p.product_code,v.sku,v.name variant_name
   from public.cart_items ci join public.products p on p.organization_id=ci.organization_id and p.id=ci.product_id
   join public.product_variants v on v.organization_id=ci.organization_id and v.id=ci.variant_id where ci.organization_id=$1 and ci.cart_id=$2 order by ci.created_at""",org,c["id"])
  result=[]
  for i in items:
   q=await self.price_quote(db,org,i["product_id"],i["variant_id"],i["quantity"])
   result.append({**dict(i),"price":q,"line_subtotal":money(Decimal(q["unit_price"])*Decimal(i["quantity"]))})
  return {"cart":dict(c),"items":result}

 async def upsert_cart_item(self,db,org,actor,p):
  async with db.transaction():
   c=await db.fetchrow("select * from public.carts where organization_id=$1 and owner_user_id=$2 and status='active' and expires_at>now() for update",org,actor)
   if not c:c=await db.fetchrow("insert into public.carts(organization_id,owner_user_id) values($1,$2) returning *",org,actor)
   ok=await db.fetchval("""select exists(select 1 from public.products p join public.product_variants v on v.organization_id=p.organization_id and v.product_id=p.id
    where p.organization_id=$1 and p.id=$2 and v.id=$3 and p.status='published' and v.status='active')""",org,p.product_id,p.variant_id)
   if not ok: raise APIError(404,"product_sku_not_found","Published product and active SKU were not found.")
   await self.price_quote(db,org,p.product_id,p.variant_id,p.quantity)
   r=await db.fetchrow("""insert into public.cart_items(organization_id,cart_id,product_id,variant_id,quantity,notes) values($1,$2,$3,$4,$5,$6)
    on conflict(cart_id,variant_id) do update set quantity=excluded.quantity,notes=excluded.notes,updated_at=now() returning *""",org,c["id"],p.product_id,p.variant_id,p.quantity,p.notes)
   await db.execute("update public.carts set version=version+1,updated_at=now() where id=$1",c["id"])
  return dict(r)

 async def update_cart_item(self,db,org,actor,iid,p):
  async with db.transaction():
   r=await db.fetchrow("""update public.cart_items ci set quantity=$4,notes=$5,updated_at=now() from public.carts c
    where ci.organization_id=$1 and ci.id=$2 and c.id=ci.cart_id and c.owner_user_id=$3 and c.status='active' returning ci.*""",org,iid,actor,p.quantity,p.notes)
   if not r: raise APIError(404,"cart_item_not_found","Cart item was not found.")
   await self.price_quote(db,org,r["product_id"],r["variant_id"],p.quantity)
   await db.execute("update public.carts set version=version+1,updated_at=now() where id=$1",r["cart_id"])
  return dict(r)

 async def remove_cart_item(self,db,org,actor,iid):
  async with db.transaction():
   r=await db.fetchrow("""delete from public.cart_items ci using public.carts c where ci.organization_id=$1 and ci.id=$2 and c.id=ci.cart_id and c.owner_user_id=$3 and c.status='active' returning ci.cart_id""",org,iid,actor)
   if not r: raise APIError(404,"cart_item_not_found","Cart item was not found.")
   await db.execute("update public.carts set version=version+1,updated_at=now() where id=$1",r["cart_id"])
  return {"removed":True}

 async def evaluate_promotions(self,db,org,codes,subtotal,qty,customer):
  if not codes:return [],Decimal("0")
  rows=await db.fetch("""select p.*,coalesce(jsonb_agg(jsonb_build_object('rule_type',r.rule_type,'rule_config',r.rule_config)) filter(where r.id is not null),'[]'::jsonb) rules
   from public.promotions p left join public.promotion_rules r on r.organization_id=p.organization_id and r.promotion_id=p.id
   where p.organization_id=$1 and upper(p.code)=any($2::text[]) and p.status='active' and p.starts_at<=now() and p.ends_at>now()
   group by p.id order by p.priority""",org,[x.upper() for x in codes])
  applied=[]; total=Decimal("0")
  for p in rows:
   eligible=True; disc=Decimal("0")
   for rule in p["rules"]:
    cfg=rule["rule_config"]; kind=rule["rule_type"]
    if kind=="minimum_value" and subtotal<Decimal(str(cfg.get("amount",0))):eligible=False
    elif kind=="minimum_quantity" and qty<Decimal(str(cfg.get("quantity",0))):eligible=False
    elif kind=="customer" and cfg.get("organization_id") and str(customer)!=str(cfg["organization_id"]):eligible=False
    elif kind=="discount_percent":disc=max(disc,money(subtotal*min(Decimal(str(cfg.get("percent",0))),Decimal("100"))/100))
    elif kind=="discount_amount":disc=max(disc,money(cfg.get("amount",0)))
    elif kind in {"product","category","voucher"}:eligible=False
   if eligible and disc>0:
    applied.append({"promotion_id":str(p["id"]),"code":p["code"],"discount_amount":str(disc),"priority":p["priority"]});total+=disc
    if not p["stackable"]:break
  return applied,min(money(total),money(subtotal))

 async def create_order(self,db,org,actor,p,snapshot):
  async with db.transaction():
   old=await db.fetchrow("select * from public.orders where organization_id=$1 and customer_user_id=$2 and idempotency_key=$3",org,actor,p.idempotency_key)
   if old:return dict(old)
   c=await db.fetchrow("select * from public.carts where organization_id=$1 and id=$2 and owner_user_id=$3 and status='active' and expires_at>now() for update",org,p.cart_id,actor)
   if not c:raise APIError(404,"active_cart_not_found","An active cart owned by this actor is required.")
   items=await db.fetch("""select ci.*,p.name product_name,p.product_code,p.tax_rate,p.specifications product_specs,v.sku,v.name variant_name,v.attributes variant_attributes
    from public.cart_items ci join public.products p on p.organization_id=ci.organization_id and p.id=ci.product_id
    join public.product_variants v on v.organization_id=ci.organization_id and v.id=ci.variant_id where ci.organization_id=$1 and ci.cart_id=$2 for update of ci""",org,p.cart_id)
   if not items:raise APIError(409,"empty_cart","An order cannot be created from an empty cart.")
   snaps=[];subtotal=Decimal("0");tax=Decimal("0");qty_total=Decimal("0")
   for i in items:
    q=await self.price_quote(db,org,i["product_id"],i["variant_id"],i["quantity"],c["customer_organization_id"])
    qty=Decimal(i["quantity"]);unit=money(q["unit_price"]);line=money(unit*qty);t=money(line*Decimal(i["tax_rate"])/100)
    subtotal+=line;tax+=t;qty_total+=qty
    snaps.append({"product_id":str(i["product_id"]),"variant_id":str(i["variant_id"]),"product_name":i["product_name"],"product_code":i["product_code"],"sku":i["sku"],"variant_name":i["variant_name"],"quantity":str(qty),"unit_price":str(unit),"line_subtotal":str(line),"tax_rate":str(i["tax_rate"]),"tax_amount":str(t),"price_list_id":str(q["price_list_id"]),"currency":q["currency"]})
   promos,discount=await self.evaluate_promotions(db,org,p.promotion_codes,subtotal,qty_total,c["customer_organization_id"])
   oid=uuid4();number="SO-"+oid.hex[:12].upper();grand=max(Decimal(0),subtotal-discount+tax)
   o=await db.fetchrow("""insert into public.orders(id,organization_id,order_number,cart_id,customer_organization_id,customer_user_id,channel,status,currency,subtotal,discount_total,tax_total,grand_total,price_snapshot,promotion_snapshot,customer_snapshot,shipping_snapshot,notes,idempotency_key)
    values($1,$2,$3,$4,$5,$6,$7,'draft','IDR',$8,$9,$10,$11,$12::jsonb,$13::jsonb,$14::jsonb,$15::jsonb,$16,$17) returning *""",
    oid,org,number,c["id"],c["customer_organization_id"],actor,c["channel"],money(subtotal),money(discount),money(tax),money(grand),json.dumps(snaps),json.dumps(promos),json.dumps(snapshot),json.dumps(p.shipping_snapshot),p.notes,p.idempotency_key)
   for i,s in zip(items,snaps,strict=True):
    await db.execute("""insert into public.order_items(organization_id,order_id,product_id,variant_id,product_snapshot,quantity,unit_price,tax_amount,line_total)
     values($1,$2,$3,$4,$5::jsonb,$6,$7,$8,$9)""",org,oid,i["product_id"],i["variant_id"],json.dumps(s),i["quantity"],s["unit_price"],s["tax_amount"],s["line_subtotal"])
   await db.execute("insert into public.order_status_history(organization_id,order_id,from_status,to_status,actor_user_id) values($1,$2,null,'draft',$3)",org,oid,actor)
   await db.execute("update public.carts set status='submitted',version=version+1,updated_at=now() where id=$1",c["id"])
   await self.audit(db,org,actor,"order.draft.created","order",oid,{"order_number":number,"total":str(money(grand))})
  return dict(o)

 async def submit_order(self,db,org,actor,oid):
  async with db.transaction():
   o=await db.fetchrow("select * from public.orders where organization_id=$1 and id=$2 and customer_user_id=$3 for update",org,oid,actor)
   if not o:raise APIError(404,"order_not_found","Order was not found.")
   if o["status"]!="draft":raise APIError(409,"invalid_order_transition","Only a draft order can be submitted.")
   items=await db.fetch("select * from public.order_items where organization_id=$1 and order_id=$2 order by id",org,oid);alloc=[]
   for i in items:
    b=await db.fetchrow("select * from public.inventory_balances where organization_id=$1 and variant_id=$2 and available >= $3 order by available desc limit 1 for update skip locked",org,i["variant_id"],i["quantity"])
    if not b:raise APIError(409,"insufficient_stock","One or more SKUs do not have sufficient available stock.")
    alloc.append((i,b))
   for i,b in alloc:
    await db.execute("update public.inventory_balances set reserved=reserved+$4,version=version+1,updated_at=now() where organization_id=$1 and id=$2 and version=$3",org,b["id"],b["version"],i["quantity"])
    await db.execute("""insert into public.stock_movements(organization_id,warehouse_id,product_id,variant_id,movement_type,quantity,reserved_delta,reference_type,reference_id,reason,actor_user_id,idempotency_key)
     values($1,$2,$3,$4,'reserve',$5,$5,'order',$6,'Order stock reservation',$7,$8)""",org,b["warehouse_id"],i["product_id"],i["variant_id"],i["quantity"],oid,actor,f"order:{oid}:reserve:{i['variant_id']}")
   await db.execute("update public.orders set status='pending_approval',submitted_at=now(),updated_at=now() where id=$1",oid)
   await db.execute("insert into public.order_status_history(organization_id,order_id,from_status,to_status,actor_user_id) values($1,$2,'draft','pending_approval',$3)",org,oid,actor)
   await self.audit(db,org,actor,"order.submitted","order",oid,{"reserved_skus":len(alloc)})
  return await self.get_order(db,org,actor,oid)

 async def decide_order(self,db,org,actor,oid,p):
  async with db.transaction():
   o=await db.fetchrow("select * from public.orders where organization_id=$1 and id=$2 for update",org,oid)
   if not o:raise APIError(404,"order_not_found","Order was not found.")
   if o["status"]!="pending_approval":raise APIError(409,"invalid_order_transition","Only pending approval orders can be decided.")
   moves=await db.fetch("select * from public.stock_movements where organization_id=$1 and reference_id=$2 and movement_type='reserve'",org,oid)
   target="approved" if p.decision=="approved" else "rejected"
   for m in moves:
    if target=="approved":
     await db.execute("update public.inventory_balances set reserved=reserved-$4,committed=committed+$4,version=version+1,updated_at=now() where organization_id=$1 and warehouse_id=$2 and variant_id=$3 and reserved >= $4",org,m["warehouse_id"],m["variant_id"],m["quantity"])
     await db.execute("""insert into public.stock_movements(organization_id,warehouse_id,product_id,variant_id,movement_type,quantity,reserved_delta,committed_delta,reference_type,reference_id,reason,actor_user_id,idempotency_key)
      values($1,$2,$3,$4,'commit',$5,-$5,$5,'order',$6,'Approved stock commitment',$7,$8)""",org,m["warehouse_id"],m["product_id"],m["variant_id"],m["quantity"],oid,actor,f"order:{oid}:commit:{m['variant_id']}")
    else:
     await db.execute("update public.inventory_balances set reserved=reserved-$4,version=version+1,updated_at=now() where organization_id=$1 and warehouse_id=$2 and variant_id=$3 and reserved >= $4",org,m["warehouse_id"],m["variant_id"],m["quantity"])
     await db.execute("""insert into public.stock_movements(organization_id,warehouse_id,product_id,variant_id,movement_type,quantity,reserved_delta,reference_type,reference_id,reason,actor_user_id,idempotency_key)
      values($1,$2,$3,$4,'release',$5,-$5,'order',$6,$7,$8,$9)""",org,m["warehouse_id"],m["product_id"],m["variant_id"],m["quantity"],oid,p.reason or "Order rejected; reservation released",actor,f"order:{oid}:release:{m['variant_id']}")
   await db.execute("insert into public.order_approvals(organization_id,order_id,decision,reason,actor_user_id) values($1,$2,$3,$4,$5)",org,oid,p.decision,p.reason,actor)
   await db.execute("update public.orders set status=$3,approved_at=case when $3='approved' then now() else approved_at end,updated_at=now() where id=$1 and organization_id=$2",oid,org,target)
   await db.execute("insert into public.order_status_history(organization_id,order_id,from_status,to_status,reason,actor_user_id) values($1,$2,'pending_approval',$3,$4,$5)",org,oid,target,p.reason,actor)
   await self.audit(db,org,actor,"order.approval."+p.decision,"order",oid,{"reason":p.reason})
  return await self.get_order(db,org,actor,oid,True)

 async def create_fulfillment(self,db,org,actor,oid,p):
  async with db.transaction():
   o=await db.fetchrow("select * from public.orders where organization_id=$1 and id=$2 for update",org,oid)
   if not o:raise APIError(404,"order_not_found","Order was not found.")
   if o["status"] not in {"approved","processing"}:raise APIError(409,"order_not_approved","Only approved orders can enter fulfillment.")
   r=await db.fetchrow("insert into public.fulfillments(organization_id,order_id,warehouse_id,assigned_to,created_by) values($1,$2,$3,$4,$5) returning *",org,oid,p.warehouse_id,p.assigned_to,actor)
   if o["status"]=="approved":
    await db.execute("update public.orders set status='processing',updated_at=now() where id=$1",oid)
    await db.execute("insert into public.order_status_history(organization_id,order_id,from_status,to_status,actor_user_id) values($1,$2,'approved','processing',$3)",org,oid,actor)
   await self.audit(db,org,actor,"fulfillment.created","fulfillment",r["id"],{"order_id":str(oid)})
  return dict(r)

 async def update_fulfillment(self,db,org,actor,fid,p):
  async with db.transaction():
   f=await db.fetchrow("select * from public.fulfillments where organization_id=$1 and id=$2 for update",org,fid)
   if not f:raise APIError(404,"fulfillment_not_found","Fulfillment was not found.")
   allowed={"queued":{"picking","cancelled"},"picking":{"packed","failed","cancelled"},"packed":{"handed_over","failed","cancelled"},"handed_over":{"delivered","failed"},"failed":{"picking"},"cancelled":set(),"delivered":set()}
   if p.status not in allowed.get(f["status"],set()):raise APIError(409,"invalid_fulfillment_transition","Fulfillment status transition is not allowed.")
   await db.execute("update public.fulfillments set status=$3,carrier=coalesce($4,carrier),tracking_number=coalesce($5,tracking_number),external_status_at=case when $3='delivered' then now() else external_status_at end,updated_at=now() where id=$1 and organization_id=$2",fid,org,p.status,p.carrier,p.tracking_number)
   if p.status=="delivered":
    moves=await db.fetch("select * from public.stock_movements where organization_id=$1 and reference_id=$2 and movement_type='commit'",org,f["order_id"])
    for m in moves:
     await db.execute("update public.inventory_balances set on_hand=on_hand-$4,committed=committed-$4,version=version+1,updated_at=now() where organization_id=$1 and warehouse_id=$2 and variant_id=$3 and on_hand >= $4 and committed >= $4",org,m["warehouse_id"],m["variant_id"],m["quantity"])
     await db.execute("""insert into public.stock_movements(organization_id,warehouse_id,product_id,variant_id,movement_type,quantity,on_hand_delta,committed_delta,reference_type,reference_id,reason,actor_user_id,idempotency_key)
      values($1,$2,$3,$4,'stock_out',$5,-$5,-$5,'fulfillment',$6,'Stock dispatched after delivery confirmation',$7,$8)""",org,m["warehouse_id"],m["product_id"],m["variant_id"],m["quantity"],f["order_id"],actor,f"fulfillment:{fid}:dispatch:{m['variant_id']}")
    await db.execute("update public.orders set status='completed',fulfilled_at=now(),updated_at=now() where id=$1",f["order_id"])
    await db.execute("insert into public.order_status_history(organization_id,order_id,from_status,to_status,actor_user_id) values($1,$2,'processing','completed',$3)",org,f["order_id"],actor)
   await self.audit(db,org,actor,"fulfillment.status.changed","fulfillment",fid,{"status":p.status})
   r=await db.fetchrow("select * from public.fulfillments where id=$1",fid)
  return dict(r)

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

 async def audit(self,db,org,actor,action,kind,rid,metadata):
  await db.execute("insert into public.commerce_audit_events(organization_id,actor_user_id,action,resource_type,resource_id,metadata) values($1,$2,$3,$4,$5,$6::jsonb)",org,actor,action,kind,rid,json.dumps(metadata,default=str))

smart_order_repository=SmartOrderRepository()
