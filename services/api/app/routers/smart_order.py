from uuid import UUID
from decimal import Decimal
import asyncio
import json
from fastapi import APIRouter, Depends, Query, Request
from fastapi.responses import StreamingResponse
from app.errors import APIError
import asyncpg
from app.db import get_connection
from app.security.dependencies import Principal, TenantContext, get_current_principal, require_api_action
from app.schemas.smart_order import ProductWrite, ProductStatusWrite, CartItemWrite, CartItemUpdate, StockMovementWrite, PromotionWrite, PromotionEvaluation, OrderCreate, OrderDecision, FulfillmentCreate, FulfillmentUpdate, PriceListWrite, WarehouseWrite, CategoryWrite, BrandWrite, UnitWrite, CatalogAccessWrite, StockTransferWrite, OrderCancel, PartnerLinkWrite, AssistedCartWrite, OrderApprovalPolicyWrite
from app.services.smart_order import smart_order_service

router=APIRouter(prefix="/organizations",tags=["smart-order"])


@router.get("/{organization_id}/smart-order/partner-organizations")
async def list_partner_organizations(organization_id:UUID,principal:Principal=Depends(get_current_principal),tenant:TenantContext=Depends(require_api_action("smartorder.partners.read")),db:asyncpg.Connection=Depends(get_connection)):
 return await smart_order_service.partner_organizations(db,organization_id,tenant)

@router.post("/{organization_id}/smart-order/partner-links",status_code=201)
async def create_partner_link(organization_id:UUID,payload:PartnerLinkWrite,principal:Principal=Depends(get_current_principal),tenant:TenantContext=Depends(require_api_action("smartorder.partners.create")),db:asyncpg.Connection=Depends(get_connection)):
 return await smart_order_service.create_partner_link(db,organization_id,tenant,principal.user_id,payload)

@router.post("/{organization_id}/smart-order/cart/assisted-customer")
async def set_assisted_customer(organization_id:UUID,payload:AssistedCartWrite,principal:Principal=Depends(get_current_principal),tenant:TenantContext=Depends(require_api_action("smartorder.cart.assisted_customer")),db:asyncpg.Connection=Depends(get_connection)):
 return await smart_order_service.set_assisted_customer(db,organization_id,tenant,principal.user_id,payload)

@router.get("/{organization_id}/smart-order/catalog/products")
async def list_products(organization_id:UUID,search:str|None=None,category_id:UUID|None=None,page:int=Query(1,ge=1),page_size:int=Query(24,ge=1,le=100),principal:Principal=Depends(get_current_principal),tenant:TenantContext=Depends(require_api_action("smartorder.catalog.products.read")),db:asyncpg.Connection=Depends(get_connection)):
 return await smart_order_service.list_products(db,organization_id,tenant,search,category_id,page,page_size)

@router.get("/{organization_id}/smart-order/catalog/products/{product_id}")
async def get_product(organization_id:UUID,product_id:UUID,principal:Principal=Depends(get_current_principal),tenant:TenantContext=Depends(require_api_action("smartorder.catalog.product.read")),db:asyncpg.Connection=Depends(get_connection)):
 return await smart_order_service.get_product(db,organization_id,tenant,product_id)

@router.post("/{organization_id}/smart-order/products",status_code=201)
async def create_product(organization_id:UUID,payload:ProductWrite,principal:Principal=Depends(get_current_principal),tenant:TenantContext=Depends(require_api_action("smartorder.catalog.product.create")),db:asyncpg.Connection=Depends(get_connection)):
 return await smart_order_service.create_product(db,organization_id,tenant,principal.user_id,payload)

@router.patch("/{organization_id}/smart-order/products/{product_id}/status")
async def update_product_status(organization_id:UUID,product_id:UUID,payload:ProductStatusWrite,principal:Principal=Depends(get_current_principal),tenant:TenantContext=Depends(require_api_action("smartorder.catalog.product.status")),db:asyncpg.Connection=Depends(get_connection)):
 return await smart_order_service.update_product_status(db,organization_id,tenant,principal.user_id,product_id,payload.status)



@router.get("/{organization_id}/smart-order/events")
async def stream_smart_order_events(
    organization_id: UUID,
    request: Request,
    principal: Principal = Depends(get_current_principal),
    tenant: TenantContext = Depends(require_api_action("smartorder.events.read")),
):
    if str(tenant.organization_id) != str(organization_id):
        raise APIError(403, "tenant_scope_mismatch", "The requested organization is outside the active tenant.")
    pool = getattr(request.app.state, "db_pool", None)
    if pool is None:
        raise APIError(503, "database_not_ready", "SmartOrder event stream requires the configured database pool.")
    queue: asyncio.Queue[dict] = asyncio.Queue(maxsize=128)

    def on_notify(connection, pid, channel, payload):
        try:
            event = json.loads(payload)
        except (TypeError, ValueError):
            return
        if event.get("organization_id") != str(organization_id):
            return
        if queue.full():
            try:
                queue.get_nowait()
            except asyncio.QueueEmpty:
                pass
        queue.put_nowait(event)

    async def stream():
        async with pool.acquire() as connection:
            await connection.add_listener("smartorder_events", on_notify)
            try:
                yield "retry: 5000\n\n"
                while not await request.is_disconnected():
                    try:
                        event = await asyncio.wait_for(queue.get(), timeout=15)
                    except TimeoutError:
                        yield ": keep-alive\n\n"
                        continue
                    yield "event: smartorder.changed\ndata: " + json.dumps(event, separators=(",", ":")) + "\n\n"
            finally:
                try:
                    await connection.remove_listener("smartorder_events", on_notify)
                except Exception:
                    pass

    return StreamingResponse(
        stream(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache, no-transform",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )


@router.get("/{organization_id}/smart-order/catalog/categories")
async def list_categories(organization_id:UUID,principal:Principal=Depends(get_current_principal),tenant:TenantContext=Depends(require_api_action("smartorder.catalog.categories.read")),db:asyncpg.Connection=Depends(get_connection)):
 return await smart_order_service.categories(db,organization_id,tenant)

@router.post("/{organization_id}/smart-order/catalog/categories",status_code=201)
async def create_category(organization_id:UUID,payload:CategoryWrite,principal:Principal=Depends(get_current_principal),tenant:TenantContext=Depends(require_api_action("smartorder.catalog.category.create")),db:asyncpg.Connection=Depends(get_connection)):
 return await smart_order_service.create_category(db,organization_id,tenant,principal.user_id,payload)

@router.get("/{organization_id}/smart-order/catalog/brands")
async def list_brands(organization_id:UUID,principal:Principal=Depends(get_current_principal),tenant:TenantContext=Depends(require_api_action("smartorder.catalog.brands.read")),db:asyncpg.Connection=Depends(get_connection)):
 return await smart_order_service.brands(db,organization_id,tenant)

@router.get("/{organization_id}/smart-order/catalog/units")
async def list_units(organization_id:UUID,principal:Principal=Depends(get_current_principal),tenant:TenantContext=Depends(require_api_action("smartorder.catalog.units.read")),db:asyncpg.Connection=Depends(get_connection)):
 return await smart_order_service.units(db,organization_id,tenant)

@router.post("/{organization_id}/smart-order/catalog/brands",status_code=201)
async def create_brand(organization_id:UUID,payload:BrandWrite,principal:Principal=Depends(get_current_principal),tenant:TenantContext=Depends(require_api_action("smartorder.catalog.brand.create")),db:asyncpg.Connection=Depends(get_connection)):
 return await smart_order_service.create_brand(db,organization_id,tenant,principal.user_id,payload)

@router.post("/{organization_id}/smart-order/catalog/units",status_code=201)
async def create_unit(organization_id:UUID,payload:UnitWrite,principal:Principal=Depends(get_current_principal),tenant:TenantContext=Depends(require_api_action("smartorder.catalog.unit.create")),db:asyncpg.Connection=Depends(get_connection)):
 return await smart_order_service.create_unit(db,organization_id,tenant,principal.user_id,payload)

@router.post("/{organization_id}/smart-order/products/{product_id}/images",status_code=201)
async def register_product_image(organization_id:UUID,product_id:UUID,request:Request,principal:Principal=Depends(get_current_principal),tenant:TenantContext=Depends(require_api_action("smartorder.catalog.image.create")),db:asyncpg.Connection=Depends(get_connection)):
 content=await request.body()
 content_type=request.headers.get("content-type","").split(";")[0].strip().lower()
 try:
  sort_order=int(request.headers.get("x-sort-order","0"))
 except ValueError as exc:
  raise APIError(422,"invalid_image_sort_order","X-Sort-Order must be an integer.") from exc
 variant_id=request.headers.get("x-variant-id")
 return await smart_order_service.upload_product_image(db,organization_id,tenant,principal.user_id,product_id,content_type,content,request.headers.get("x-alt-text"),sort_order,UUID(variant_id) if variant_id else None)

@router.post("/{organization_id}/smart-order/catalog/access",status_code=201)
async def grant_catalog_access(organization_id:UUID,payload:CatalogAccessWrite,principal:Principal=Depends(get_current_principal),tenant:TenantContext=Depends(require_api_action("smartorder.catalog.access.grant")),db:asyncpg.Connection=Depends(get_connection)):
 return await smart_order_service.grant_catalog_access(db,organization_id,tenant,principal.user_id,payload)

@router.get("/{organization_id}/smart-order/pricing/price-lists")
async def list_price_lists(organization_id:UUID,principal:Principal=Depends(get_current_principal),tenant:TenantContext=Depends(require_api_action("smartorder.pricing.lists.read")),db:asyncpg.Connection=Depends(get_connection)):
 return await smart_order_service.price_lists(db,organization_id,tenant)


@router.get("/{organization_id}/smart-order/pricing/price-lists/{price_list_id}/history")
async def list_price_history(organization_id:UUID,price_list_id:UUID,page:int=Query(1,ge=1),page_size:int=Query(50,ge=1,le=200),principal:Principal=Depends(get_current_principal),tenant:TenantContext=Depends(require_api_action("smartorder.pricing.history.read")),db:asyncpg.Connection=Depends(get_connection)):
 return await smart_order_service.price_history(db,organization_id,tenant,price_list_id,page,page_size)

@router.post("/{organization_id}/smart-order/pricing/price-lists",status_code=201)
async def create_price_list(organization_id:UUID,payload:PriceListWrite,principal:Principal=Depends(get_current_principal),tenant:TenantContext=Depends(require_api_action("smartorder.pricing.list.create")),db:asyncpg.Connection=Depends(get_connection)):
 return await smart_order_service.create_price_list(db,organization_id,tenant,principal.user_id,payload)

@router.get("/{organization_id}/smart-order/warehouses")
async def list_warehouses(organization_id:UUID,principal:Principal=Depends(get_current_principal),tenant:TenantContext=Depends(require_api_action("smartorder.warehouses.read")),db:asyncpg.Connection=Depends(get_connection)):
 return await smart_order_service.warehouses(db,organization_id,tenant)

@router.post("/{organization_id}/smart-order/warehouses",status_code=201)
async def create_warehouse(organization_id:UUID,payload:WarehouseWrite,principal:Principal=Depends(get_current_principal),tenant:TenantContext=Depends(require_api_action("smartorder.warehouses.create")),db:asyncpg.Connection=Depends(get_connection)):
 return await smart_order_service.create_warehouse(db,organization_id,tenant,principal.user_id,payload)

@router.post("/{organization_id}/smart-order/inventory/transfers",status_code=201)
async def transfer_stock(organization_id:UUID,payload:StockTransferWrite,principal:Principal=Depends(get_current_principal),tenant:TenantContext=Depends(require_api_action("smartorder.inventory.transfer")),db:asyncpg.Connection=Depends(get_connection)):
 return await smart_order_service.transfer_stock(db,organization_id,tenant,principal.user_id,payload)

@router.post("/{organization_id}/smart-order/orders/{order_id}/cancel")
async def cancel_order(organization_id:UUID,order_id:UUID,payload:OrderCancel,principal:Principal=Depends(get_current_principal),tenant:TenantContext=Depends(require_api_action("smartorder.orders.cancel")),db:asyncpg.Connection=Depends(get_connection)):
 return await smart_order_service.cancel_order(db,organization_id,tenant,principal.user_id,order_id,payload.reason)

@router.get("/{organization_id}/smart-order/pricing/quote")
async def price_quote(organization_id:UUID,product_id:UUID,variant_id:UUID,quantity:Decimal=Query(Decimal("1"),gt=0),customer_organization_id:UUID|None=None,principal:Principal=Depends(get_current_principal),tenant:TenantContext=Depends(require_api_action("smartorder.pricing.quote")),db:asyncpg.Connection=Depends(get_connection)):
 return await smart_order_service.quote(db,organization_id,tenant,product_id,variant_id,quantity,customer_organization_id)

@router.get("/{organization_id}/smart-order/inventory")
async def list_inventory(organization_id:UUID,variant_id:UUID|None=None,warehouse_id:UUID|None=None,principal:Principal=Depends(get_current_principal),tenant:TenantContext=Depends(require_api_action("smartorder.inventory.read")),db:asyncpg.Connection=Depends(get_connection)):
 return await smart_order_service.inventory(db,organization_id,tenant,variant_id,warehouse_id)

@router.get("/{organization_id}/smart-order/inventory/movements")
async def list_stock_movements(organization_id:UUID,page:int=Query(1,ge=1),page_size:int=Query(50,ge=1,le=200),variant_id:UUID|None=None,warehouse_id:UUID|None=None,principal:Principal=Depends(get_current_principal),tenant:TenantContext=Depends(require_api_action("smartorder.inventory.movements.read")),db:asyncpg.Connection=Depends(get_connection)):
 return await smart_order_service.inventory_history(db,organization_id,tenant,page,page_size,variant_id,warehouse_id)

@router.post("/{organization_id}/smart-order/inventory/movements",status_code=201)
async def create_stock_movement(organization_id:UUID,payload:StockMovementWrite,principal:Principal=Depends(get_current_principal),tenant:TenantContext=Depends(require_api_action("smartorder.inventory.movement.create")),db:asyncpg.Connection=Depends(get_connection)):
 return await smart_order_service.move_stock(db,organization_id,tenant,principal.user_id,payload)

@router.get("/{organization_id}/smart-order/promotions")
async def list_promotions(organization_id:UUID,principal:Principal=Depends(get_current_principal),tenant:TenantContext=Depends(require_api_action("smartorder.promotions.read")),db:asyncpg.Connection=Depends(get_connection)):
 return await smart_order_service.promotions(db,organization_id,tenant)

@router.post("/{organization_id}/smart-order/promotions",status_code=201)
async def create_promotion(organization_id:UUID,payload:PromotionWrite,principal:Principal=Depends(get_current_principal),tenant:TenantContext=Depends(require_api_action("smartorder.promotions.create")),db:asyncpg.Connection=Depends(get_connection)):
 return await smart_order_service.create_promotion(db,organization_id,tenant,principal.user_id,payload)

@router.post("/{organization_id}/smart-order/promotions/evaluate")
async def evaluate_promotions(organization_id:UUID,payload:PromotionEvaluation,principal:Principal=Depends(get_current_principal),tenant:TenantContext=Depends(require_api_action("smartorder.promotions.evaluate")),db:asyncpg.Connection=Depends(get_connection)):
 return await smart_order_service.evaluate_promotions(db,organization_id,tenant,payload.cart_id,payload.codes,principal.user_id)

@router.get("/{organization_id}/smart-order/cart")
async def get_cart(organization_id:UUID,principal:Principal=Depends(get_current_principal),tenant:TenantContext=Depends(require_api_action("smartorder.cart.read")),db:asyncpg.Connection=Depends(get_connection)):
 return await smart_order_service.cart(db,organization_id,tenant,principal.user_id)

@router.post("/{organization_id}/smart-order/cart/items",status_code=201)
async def add_cart_item(organization_id:UUID,payload:CartItemWrite,principal:Principal=Depends(get_current_principal),tenant:TenantContext=Depends(require_api_action("smartorder.cart.item.upsert")),db:asyncpg.Connection=Depends(get_connection)):
 return await smart_order_service.add_cart_item(db,organization_id,tenant,principal.user_id,payload)

@router.patch("/{organization_id}/smart-order/cart/items/{item_id}")
async def update_cart_item(organization_id:UUID,item_id:UUID,payload:CartItemUpdate,principal:Principal=Depends(get_current_principal),tenant:TenantContext=Depends(require_api_action("smartorder.cart.item.update")),db:asyncpg.Connection=Depends(get_connection)):
 return await smart_order_service.update_cart_item(db,organization_id,tenant,principal.user_id,item_id,payload)

@router.delete("/{organization_id}/smart-order/cart/items/{item_id}")
async def remove_cart_item(organization_id:UUID,item_id:UUID,principal:Principal=Depends(get_current_principal),tenant:TenantContext=Depends(require_api_action("smartorder.cart.item.delete")),db:asyncpg.Connection=Depends(get_connection)):
 return await smart_order_service.remove_cart_item(db,organization_id,tenant,principal.user_id,item_id)

@router.post("/{organization_id}/smart-order/orders",status_code=201)
async def create_order(organization_id:UUID,payload:OrderCreate,principal:Principal=Depends(get_current_principal),tenant:TenantContext=Depends(require_api_action("smartorder.orders.create")),db:asyncpg.Connection=Depends(get_connection)):
 return await smart_order_service.create_order(db,organization_id,tenant,principal.user_id,payload)

@router.get("/{organization_id}/smart-order/orders")
async def list_my_orders(organization_id:UUID,page:int=Query(1,ge=1),page_size:int=Query(20,ge=1,le=100),status:str|None=None,principal:Principal=Depends(get_current_principal),tenant:TenantContext=Depends(require_api_action("smartorder.orders.mine.read")),db:asyncpg.Connection=Depends(get_connection)):
 return await smart_order_service.list_orders(db,organization_id,tenant,principal.user_id,page,page_size,status,False)


@router.get("/{organization_id}/smart-order/approval-policies")
async def list_approval_policies(organization_id:UUID,principal:Principal=Depends(get_current_principal),tenant:TenantContext=Depends(require_api_action("smartorder.orders.approval_policies.read")),db:asyncpg.Connection=Depends(get_connection)):
 return await smart_order_service.approval_policies(db,organization_id,tenant)

@router.post("/{organization_id}/smart-order/approval-policies",status_code=201)
async def create_approval_policy(organization_id:UUID,payload:OrderApprovalPolicyWrite,principal:Principal=Depends(get_current_principal),tenant:TenantContext=Depends(require_api_action("smartorder.orders.approval_policies.create")),db:asyncpg.Connection=Depends(get_connection)):
 return await smart_order_service.create_approval_policy(db,organization_id,tenant,principal.user_id,payload)

@router.get("/{organization_id}/smart-order/orders/operations")
async def list_order_operations(organization_id:UUID,page:int=Query(1,ge=1),page_size:int=Query(20,ge=1,le=100),status:str|None=None,principal:Principal=Depends(get_current_principal),tenant:TenantContext=Depends(require_api_action("smartorder.orders.operations.read")),db:asyncpg.Connection=Depends(get_connection)):
 return await smart_order_service.list_orders(db,organization_id,tenant,principal.user_id,page,page_size,status,True)

@router.get("/{organization_id}/smart-order/orders/{order_id}")
async def get_order(organization_id:UUID,order_id:UUID,principal:Principal=Depends(get_current_principal),tenant:TenantContext=Depends(require_api_action("smartorder.orders.read")),db:asyncpg.Connection=Depends(get_connection)):
 return await smart_order_service.get_order(db,organization_id,tenant,principal.user_id,order_id,False)

@router.post("/{organization_id}/smart-order/orders/{order_id}/submit")
async def submit_order(organization_id:UUID,order_id:UUID,principal:Principal=Depends(get_current_principal),tenant:TenantContext=Depends(require_api_action("smartorder.orders.submit")),db:asyncpg.Connection=Depends(get_connection)):
 return await smart_order_service.submit_order(db,organization_id,tenant,principal.user_id,order_id)

@router.post("/{organization_id}/smart-order/orders/{order_id}/decision")
async def decide_order(organization_id:UUID,order_id:UUID,payload:OrderDecision,principal:Principal=Depends(get_current_principal),tenant:TenantContext=Depends(require_api_action("smartorder.orders.decision")),db:asyncpg.Connection=Depends(get_connection)):
 return await smart_order_service.decide_order(db,organization_id,tenant,principal.user_id,order_id,payload)

@router.post("/{organization_id}/smart-order/orders/{order_id}/fulfillments",status_code=201)
async def create_fulfillment(organization_id:UUID,order_id:UUID,payload:FulfillmentCreate,principal:Principal=Depends(get_current_principal),tenant:TenantContext=Depends(require_api_action("smartorder.fulfillment.create")),db:asyncpg.Connection=Depends(get_connection)):
 return await smart_order_service.create_fulfillment(db,organization_id,tenant,principal.user_id,order_id,payload)

@router.patch("/{organization_id}/smart-order/fulfillments/{fulfillment_id}")
async def update_fulfillment(organization_id:UUID,fulfillment_id:UUID,payload:FulfillmentUpdate,principal:Principal=Depends(get_current_principal),tenant:TenantContext=Depends(require_api_action("smartorder.fulfillment.update")),db:asyncpg.Connection=Depends(get_connection)):
 return await smart_order_service.update_fulfillment(db,organization_id,tenant,principal.user_id,fulfillment_id,payload)
