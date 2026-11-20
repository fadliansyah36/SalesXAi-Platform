from decimal import Decimal
from uuid import UUID
import asyncpg
from app.errors import APIError
from app.repositories.smart_order import smart_order_repository as repo

class SmartOrderService:
 def _tenant(self, organization_id: UUID, tenant):
  if tenant.organization_id != organization_id:
   raise APIError(403,"forbidden","Cross-tenant SmartOrder access is denied.")

 async def list_products(self,db,organization_id,tenant,search,category,page,page_size):
  self._tenant(organization_id,tenant)
  return await repo.list_products(db,organization_id,search,category,page,page_size)

 async def get_product(self,db,organization_id,tenant,product_id):
  self._tenant(organization_id,tenant)
  row=await repo.get_product(db,organization_id,product_id)
  if row is None: raise APIError(404,"product_not_found","Product was not found in this tenant.")
  return row

 async def create_product(self,db,organization_id,tenant,actor,payload):
  self._tenant(organization_id,tenant)
  try:return await repo.create_product(db,organization_id,actor,payload)
  except asyncpg.UniqueViolationError as exc: raise APIError(409,"product_code_or_sku_conflict","Product code, SKU or barcode already exists.") from exc
  except asyncpg.ForeignKeyViolationError as exc: raise APIError(422,"invalid_product_reference","Category, brand or unit is not owned by this tenant.") from exc

 async def update_product_status(self,db,organization_id,tenant,actor,product_id,status):
  self._tenant(organization_id,tenant)
  row=await repo.update_product_status(db,organization_id,actor,product_id,status)
  if row is None: raise APIError(404,"product_not_found","Product was not found.")
  return row

 async def quote(self,db,organization_id,tenant,product_id,variant_id,quantity,customer_organization_id=None):
  self._tenant(organization_id,tenant)
  return await repo.price_quote(db,organization_id,product_id,variant_id,quantity,customer_organization_id)

 async def inventory(self,db,organization_id,tenant,variant_id=None,warehouse_id=None):
  self._tenant(organization_id,tenant)
  return await repo.list_inventory(db,organization_id,variant_id,warehouse_id)

 async def move_stock(self,db,organization_id,tenant,actor,payload):
  self._tenant(organization_id,tenant)
  try:return await repo.move_stock(db,organization_id,actor,payload)
  except asyncpg.UniqueViolationError as exc: raise APIError(409,"stock_idempotency_conflict","Stock movement key was already used.") from exc

 async def promotions(self,db,organization_id,tenant):
  self._tenant(organization_id,tenant)
  return await repo.list_promotions(db,organization_id)

 async def create_promotion(self,db,organization_id,tenant,actor,payload):
  self._tenant(organization_id,tenant)
  try:return await repo.create_promotion(db,organization_id,actor,payload)
  except asyncpg.UniqueViolationError as exc: raise APIError(409,"promotion_code_conflict","Promotion code already exists.") from exc

 async def evaluate_promotions(self,db,organization_id,tenant,cart_id,codes,actor):
  self._tenant(organization_id,tenant)
  cart=await db.fetchrow("select * from public.carts where organization_id=$1 and id=$2 and owner_user_id=$3 and status='active'",organization_id,cart_id,actor)
  if not cart: raise APIError(404,"active_cart_not_found","Active cart was not found.")
  items=await db.fetch("select product_id,variant_id,quantity from public.cart_items where organization_id=$1 and cart_id=$2",organization_id,cart_id)
  subtotal=Decimal("0");qty=Decimal("0")
  for item in items:
   price=await repo.price_quote(db,organization_id,item["product_id"],item["variant_id"],item["quantity"],cart["customer_organization_id"])
   subtotal+=Decimal(price["unit_price"])*Decimal(item["quantity"]);qty+=Decimal(item["quantity"])
  promotions,discount=await repo.evaluate_promotions(db,organization_id,codes,subtotal,qty,cart["customer_organization_id"])
  return {"eligible_promotions":promotions,"subtotal":str(subtotal),"discount_total":str(discount),"total_after_discount":str(max(Decimal(0),subtotal-discount))}

 async def cart(self,db,organization_id,tenant,actor):
  self._tenant(organization_id,tenant)
  return await repo.get_cart(db,organization_id,actor)

 async def add_cart_item(self,db,organization_id,tenant,actor,payload):
  self._tenant(organization_id,tenant)
  return await repo.upsert_cart_item(db,organization_id,actor,payload)

 async def update_cart_item(self,db,organization_id,tenant,actor,item_id,payload):
  self._tenant(organization_id,tenant)
  return await repo.update_cart_item(db,organization_id,actor,item_id,payload)

 async def remove_cart_item(self,db,organization_id,tenant,actor,item_id):
  self._tenant(organization_id,tenant)
  return await repo.remove_cart_item(db,organization_id,actor,item_id)

 async def create_order(self,db,organization_id,tenant,actor,payload):
  self._tenant(organization_id,tenant)
  profile=await db.fetchrow("select display_name,email,phone from public.profiles where id=$1",actor)
  snapshot={"user_id":str(actor),"display_name":profile["display_name"] if profile else None,"email":profile["email"] if profile else None,"phone":profile["phone"] if profile else None}
  try:return await repo.create_order(db,organization_id,actor,payload,snapshot)
  except asyncpg.UniqueViolationError as exc: raise APIError(409,"order_idempotency_conflict","Order idempotency key or order number already exists.") from exc

 async def submit_order(self,db,organization_id,tenant,actor,order_id):
  self._tenant(organization_id,tenant)
  return await repo.submit_order(db,organization_id,actor,order_id)

 async def list_orders(self,db,organization_id,tenant,actor,page,page_size,status,tenant_scope=False):
  self._tenant(organization_id,tenant)
  return await repo.list_orders(db,organization_id,actor,page,page_size,status,tenant_scope)

 async def get_order(self,db,organization_id,tenant,actor,order_id,tenant_scope=False):
  self._tenant(organization_id,tenant)
  row=await repo.get_order(db,organization_id,actor,order_id,tenant_scope)
  if row is None: raise APIError(404,"order_not_found","Order was not found.")
  return row

 async def decide_order(self,db,organization_id,tenant,actor,order_id,payload):
  self._tenant(organization_id,tenant)
  return await repo.decide_order(db,organization_id,actor,order_id,payload)

 async def create_fulfillment(self,db,organization_id,tenant,actor,order_id,payload):
  self._tenant(organization_id,tenant)
  return await repo.create_fulfillment(db,organization_id,actor,order_id,payload)

 async def update_fulfillment(self,db,organization_id,tenant,actor,fulfillment_id,payload):
  self._tenant(organization_id,tenant)
  return await repo.update_fulfillment(db,organization_id,actor,fulfillment_id,payload)

smart_order_service=SmartOrderService()
