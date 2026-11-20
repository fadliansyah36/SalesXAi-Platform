# ruff: noqa: E701, E702
from decimal import Decimal
from uuid import UUID, uuid4
import asyncpg
from app.errors import APIError
from app.repositories.smart_order import smart_order_repository as repo
from app.integrations.shipping import shipping_adapters, ShippingAdapterUnavailable
from app.schemas.smart_order import ProductImageWrite
from app.services.storage import supabase_storage

PRODUCT_MEDIA_BUCKET = 'smartorder-product-media'

class SmartOrderService:
 def _tenant(self, organization_id: UUID, tenant):
  if tenant.organization_id != organization_id:
   raise APIError(403,"forbidden","Cross-tenant SmartOrder access is denied.")

 async def list_products(self,db,organization_id,tenant,search,category,brand,sort_by,sort_order,page,page_size):
  self._tenant(organization_id,tenant)
  return await repo.list_products(db,organization_id,search,category,brand,sort_by,sort_order,page,page_size)

 async def get_product(self,db,organization_id,tenant,product_id):
  self._tenant(organization_id,tenant)
  row=await repo.get_product(db,organization_id,product_id)
  if row is None: raise APIError(404,"product_not_found","Product was not found in this tenant.")
  for image in row.get("images",[]):
   image["signed_url"]=await supabase_storage.signed_download_url(image["storage_path"],900,PRODUCT_MEDIA_BUCKET)
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

 async def quote(self,db,organization_id,tenant,product_id,variant_id,quantity,customer_organization_id=None,channel=None):
  self._tenant(organization_id,tenant)
  if customer_organization_id and customer_organization_id!=organization_id:
   linked=await db.fetchval("""select exists(select 1 from public.commerce_partner_links where organization_id=$1 and partner_organization_id=$2 and relationship_type='customer' and status='active' and starts_at<=now() and (ends_at is null or ends_at>now()))""",organization_id,customer_organization_id)
   if not linked:raise APIError(403,"customer_relationship_required","Customer pricing requires an active partner relationship.")
  region_id=await repo.resolve_region_id(db,organization_id,tenant.membership_id)
  return await repo.price_quote(db,organization_id,product_id,variant_id,quantity,customer_organization_id,channel,region_id)

 async def inventory(self,db,organization_id,tenant,variant_id=None,warehouse_id=None):
  self._tenant(organization_id,tenant)
  return await repo.list_inventory(db,organization_id,variant_id,warehouse_id)

 async def inventory_history(self,db,organization_id,tenant,page,page_size,variant_id=None,warehouse_id=None):
  self._tenant(organization_id,tenant)
  return await repo.list_stock_movements(db,organization_id,page,page_size,variant_id,warehouse_id)

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
  items=await db.fetch("""select ci.product_id,ci.variant_id,ci.quantity,p.category_id from public.cart_items ci join public.products p on p.organization_id=ci.product_owner_organization_id and p.id=ci.product_id where ci.organization_id=$1 and ci.cart_id=$2""",organization_id,cart_id)
  subtotal=Decimal("0");qty=Decimal("0");lines=[]
  for item in items:
   price=await repo.price_quote(db,organization_id,item["product_id"],item["variant_id"],item["quantity"],cart["customer_organization_id"])
   subtotal+=Decimal(price["unit_price"])*Decimal(item["quantity"]);qty+=Decimal(item["quantity"]);lines.append({"product_id":str(item["product_id"]),"category_id":str(item["category_id"]) if item["category_id"] else None,"subtotal":str(Decimal(price["unit_price"])*Decimal(item["quantity"]))})
  promotions,discount=await repo.evaluate_promotions(db,organization_id,codes,subtotal,qty,cart["customer_organization_id"],lines)
  return {"eligible_promotions":promotions,"subtotal":str(subtotal),"discount_total":str(discount),"total_after_discount":str(max(Decimal(0),subtotal-discount))}

 async def cart(self,db,organization_id,tenant,actor):
  self._tenant(organization_id,tenant)
  region_id=await repo.resolve_region_id(db,organization_id,tenant.membership_id)
  return await repo.get_cart(db,organization_id,actor,region_id)

 async def add_cart_item(self,db,organization_id,tenant,actor,payload):
  self._tenant(organization_id,tenant)
  region_id=await repo.resolve_region_id(db,organization_id,tenant.membership_id)
  return await repo.upsert_cart_item(db,organization_id,actor,payload,region_id)

 async def update_cart_item(self,db,organization_id,tenant,actor,item_id,payload):
  self._tenant(organization_id,tenant)
  region_id=await repo.resolve_region_id(db,organization_id,tenant.membership_id)
  return await repo.update_cart_item(db,organization_id,actor,item_id,payload,region_id)

 async def remove_cart_item(self,db,organization_id,tenant,actor,item_id):
  self._tenant(organization_id,tenant)
  return await repo.remove_cart_item(db,organization_id,actor,item_id)

 async def create_order(self,db,organization_id,tenant,actor,payload):
  self._tenant(organization_id,tenant)
  profile=await db.fetchrow("select display_name,email,phone from public.profiles where id=$1",actor)
  snapshot={"user_id":str(actor),"display_name":profile["display_name"] if profile else None,"email":profile["email"] if profile else None,"phone":profile["phone"] if profile else None}
  region_id=await repo.resolve_region_id(db,organization_id,tenant.membership_id)
  try:return await repo.create_order(db,organization_id,actor,payload,snapshot,region_id)
  except asyncpg.UniqueViolationError as exc: raise APIError(409,"order_idempotency_conflict","Order idempotency key or order number already exists.") from exc

 async def submit_order(self,db,organization_id,tenant,actor,order_id):
  self._tenant(organization_id,tenant)
  region_id=await repo.resolve_region_id(db,organization_id,tenant.membership_id)
  return await repo.submit_order(db,organization_id,actor,order_id,region_id)

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
  return await repo.decide_order(db,organization_id,actor,tenant.membership_id,order_id,payload)

 async def create_fulfillment(self,db,organization_id,tenant,actor,order_id,payload):
  self._tenant(organization_id,tenant)
  return await repo.create_fulfillment(db,organization_id,actor,order_id,payload)

 async def update_fulfillment(self,db,organization_id,tenant,actor,fulfillment_id,payload):
  self._tenant(organization_id,tenant)
  return await repo.update_fulfillment(db,organization_id,actor,fulfillment_id,payload)


 async def categories(self,db,organization_id,tenant):
  self._tenant(organization_id,tenant)
  return await repo.list_categories(db,organization_id)

 async def create_category(self,db,organization_id,tenant,actor,payload):
  self._tenant(organization_id,tenant)
  try:return await repo.create_category(db,organization_id,actor,payload)
  except asyncpg.UniqueViolationError as exc:raise APIError(409,"category_code_conflict","Category code already exists.") from exc

 async def brands(self,db,organization_id,tenant):
  self._tenant(organization_id,tenant)
  return await repo.list_brands(db,organization_id)

 async def units(self,db,organization_id,tenant):
  self._tenant(organization_id,tenant)
  return await repo.list_units(db,organization_id)

 async def create_brand(self,db,organization_id,tenant,actor,payload):
  self._tenant(organization_id,tenant)
  try:return await repo.create_brand(db,organization_id,actor,payload)
  except asyncpg.UniqueViolationError as exc:raise APIError(409,"brand_name_conflict","Brand already exists.") from exc

 async def create_unit(self,db,organization_id,tenant,actor,payload):
  self._tenant(organization_id,tenant)
  try:return await repo.create_unit(db,organization_id,actor,payload)
  except asyncpg.UniqueViolationError as exc:raise APIError(409,"unit_code_conflict","Unit code already exists.") from exc

 async def price_lists(self,db,organization_id,tenant):
  self._tenant(organization_id,tenant)
  return await repo.list_price_lists(db,organization_id)

 async def create_price_list(self,db,organization_id,tenant,actor,payload):
  self._tenant(organization_id,tenant)
  try:return await repo.create_price_list(db,organization_id,actor,payload)
  except asyncpg.UniqueViolationError as exc:raise APIError(409,"price_list_conflict","Price list code or price line conflicts with an existing record.") from exc
  except asyncpg.ForeignKeyViolationError as exc:raise APIError(422,"invalid_price_reference","Price list references an invalid product or SKU.") from exc

 async def warehouses(self,db,organization_id,tenant):
  self._tenant(organization_id,tenant)
  return await repo.list_warehouses(db,organization_id)

 async def create_warehouse(self,db,organization_id,tenant,actor,payload):
  self._tenant(organization_id,tenant)
  try:return await repo.create_warehouse(db,organization_id,actor,payload)
  except asyncpg.UniqueViolationError as exc:raise APIError(409,"warehouse_code_conflict","Warehouse code already exists.") from exc
  except asyncpg.ForeignKeyViolationError as exc:raise APIError(422,"invalid_branch_reference","Warehouse branch is not owned by this tenant.") from exc

 async def grant_catalog_access(self,db,organization_id,tenant,actor,payload):
  self._tenant(organization_id,tenant)
  return await repo.create_catalog_access(db,organization_id,actor,payload)

 async def upload_product_image(self,db,organization_id,tenant,actor,product_id,content_type,content,alt_text=None,sort_order=0,variant_id=None):
  self._tenant(organization_id,tenant)
  allowed={"image/jpeg":"jpg","image/png":"png","image/webp":"webp"}
  if content_type not in allowed:raise APIError(415,"product_image_type_unsupported","Only JPEG, PNG and WebP product images are accepted.")
  if not content or len(content)>10*1024*1024:raise APIError(413,"product_image_size_invalid","Product image must be between 1 byte and 10 MB.")
  if not await db.fetchval("select exists(select 1 from public.products where organization_id=$1 and id=$2)",organization_id,product_id):
   raise APIError(404,"product_not_found","Product was not found in this tenant.")
  path=f"{organization_id}/{product_id}/{uuid4().hex}.{allowed[content_type]}"
  await supabase_storage.upload(path,content,content_type,PRODUCT_MEDIA_BUCKET)
  payload=ProductImageWrite(product_id=product_id,variant_id=variant_id,storage_path=path,mime_type=content_type,size_bytes=len(content),alt_text=alt_text,sort_order=sort_order)
  try:
   image=await repo.create_product_image(db,organization_id,actor,payload)
  except Exception:
   await supabase_storage.delete(path,PRODUCT_MEDIA_BUCKET)
   raise
  return {**image,"signed_url":await supabase_storage.signed_download_url(path,900,PRODUCT_MEDIA_BUCKET)}

 async def create_product_image(self,db,organization_id,tenant,actor,payload):
  self._tenant(organization_id,tenant)
  return await repo.create_product_image(db,organization_id,actor,payload)

 async def transfer_stock(self,db,organization_id,tenant,actor,payload):
  self._tenant(organization_id,tenant)
  return await repo.transfer_stock(db,organization_id,actor,payload)

 async def cancel_order(self,db,organization_id,tenant,actor,order_id,reason):
  self._tenant(organization_id,tenant)
  return await repo.cancel_order(db,organization_id,actor,order_id,reason)


 async def partner_organizations(self,db,organization_id,tenant):
  self._tenant(organization_id,tenant)
  return await repo.list_partner_organizations(db,organization_id)

 async def create_partner_link(self,db,organization_id,tenant,actor,payload):
  self._tenant(organization_id,tenant)
  try:return await repo.create_partner_link(db,organization_id,actor,payload)
  except asyncpg.UniqueViolationError as exc:raise APIError(409,"partner_link_conflict","Partner relationship already exists.") from exc

 async def set_assisted_customer(self,db,organization_id,tenant,actor,payload):
  self._tenant(organization_id,tenant)
  return await repo.set_assisted_customer(db,organization_id,actor,payload)


 async def price_history(self,db,organization_id,tenant,price_list_id,page,page_size):
  self._tenant(organization_id,tenant)
  return await repo.list_price_history(db,organization_id,price_list_id,page,page_size)


 async def process_shipping_webhook(self,db,provider,headers,raw_body):
  try:adapter=shipping_adapters.resolve(provider)
  except ShippingAdapterUnavailable as exc:raise APIError(503,"shipping_provider_unavailable",str(exc)) from exc
  try:event=await adapter.verify_webhook(headers,raw_body)
  except Exception as exc:raise APIError(401,"shipping_webhook_signature_invalid","Shipping provider webhook signature verification failed.") from exc
  if not isinstance(event,dict) or not all(isinstance(event.get(key),str) and event.get(key).strip() for key in ("event_id","tracking_number","status")):
   raise APIError(422,"shipping_event_invalid","Verified shipping event must include event_id, tracking_number and status.")
  status=event["status"].strip().lower()
  if status not in {"delivered","failed"}:raise APIError(422,"shipping_event_status_unsupported","Only verified delivered or failed provider events are processed.")
  return await repo.process_shipping_event(db,provider.strip().lower(),{**event,"status":status})

 async def approval_policies(self,db,organization_id,tenant):
  self._tenant(organization_id,tenant)
  return await repo.list_approval_policies(db,organization_id)

 async def create_approval_policy(self,db,organization_id,tenant,actor,payload):
  self._tenant(organization_id,tenant)
  if payload.maximum_total is not None and payload.maximum_total<payload.minimum_total:
   raise APIError(422,"invalid_approval_policy_range","Maximum order total must be greater than or equal to minimum order total.")
  return await repo.create_approval_policy(db,organization_id,actor,payload)

smart_order_service=SmartOrderService()
