from decimal import Decimal, InvalidOperation
from typing import Any, Literal
from uuid import UUID
from pydantic import BaseModel, ConfigDict, Field, model_validator


class VariantWrite(BaseModel):
    sku: str = Field(min_length=1, max_length=100)
    name: str = Field(min_length=1, max_length=180)
    barcode: str | None = Field(default=None, max_length=100)
    attributes: dict[str, Any] = Field(default_factory=dict)
    specifications: dict[str, Any] = Field(default_factory=dict)
    weight_grams: int | None = Field(default=None, ge=0)


class ProductWrite(BaseModel):
    model_config = ConfigDict(extra="forbid")
    product_code: str = Field(min_length=1, max_length=80)
    name: str = Field(min_length=2, max_length=240)
    description: str | None = None
    category_id: UUID | None = None
    brand_id: UUID | None = None
    unit_id: UUID | None = None
    tax_rate: Decimal = Field(default=Decimal("0"), ge=0, le=100)
    specifications: dict[str, Any] = Field(default_factory=dict)
    status: Literal["draft", "published", "inactive", "archived"] = "draft"
    variants: list[VariantWrite] = Field(default_factory=list, max_length=100)


class ProductStatusWrite(BaseModel):
    status: Literal["draft", "published", "inactive", "archived"]


class CartItemWrite(BaseModel):
    product_id: UUID
    variant_id: UUID
    quantity: Decimal = Field(gt=0, max_digits=18, decimal_places=3)
    notes: str | None = Field(default=None, max_length=1000)


class CartItemUpdate(BaseModel):
    quantity: Decimal = Field(gt=0, max_digits=18, decimal_places=3)
    notes: str | None = Field(default=None, max_length=1000)


class StockMovementWrite(BaseModel):
    warehouse_id: UUID
    product_id: UUID
    variant_id: UUID
    movement_type: Literal["stock_in", "stock_out", "adjustment"]
    quantity: Decimal = Field(gt=0, max_digits=18, decimal_places=3)
    adjustment_delta: Decimal | None = Field(default=None, max_digits=18, decimal_places=3)
    reason: str = Field(min_length=3, max_length=500)
    idempotency_key: str = Field(min_length=8, max_length=128)

    @model_validator(mode="after")
    def validate_adjustment(self):
        if self.movement_type == "adjustment" and self.adjustment_delta is None:
            raise ValueError("adjustment_delta is required for adjustment movements")
        if self.movement_type == "adjustment":
            if self.adjustment_delta is None:
                raise ValueError("adjustment_delta is required for adjustment movements")
            if self.adjustment_delta == 0 or self.quantity != abs(self.adjustment_delta):
                raise ValueError("adjustment quantity must equal the absolute non-zero adjustment delta")
        if self.movement_type != "adjustment" and self.adjustment_delta is not None:
            raise ValueError("adjustment_delta is only valid for adjustment movements")
        return self


class PromotionWrite(BaseModel):
    model_config = ConfigDict(extra="forbid")
    code: str = Field(min_length=2, max_length=60)
    name: str = Field(min_length=2, max_length=180)
    description: str | None = None
    starts_at: str
    ends_at: str
    priority: int = 100
    stackable: bool = False
    stacking_group: str | None = None
    max_redemptions: int | None = Field(default=None, gt=0, le=10000000)
    max_per_customer: int | None = Field(default=None, gt=0, le=1000000)
    rules: list[dict[str, Any]] = Field(min_length=1, max_length=20)

    @model_validator(mode="after")
    def validate_rules(self):
        from datetime import datetime
        try:
            starts = datetime.fromisoformat(self.starts_at.replace("Z", "+00:00"))
            ends = datetime.fromisoformat(self.ends_at.replace("Z", "+00:00"))
        except ValueError as exc:
            raise ValueError("Promotion validity dates must be ISO-8601 timestamps") from exc
        if starts.tzinfo is None or ends.tzinfo is None or ends <= starts:
            raise ValueError("Promotion end must be later than start and both timestamps must include timezone")
        allowed = {"minimum_value", "minimum_quantity", "product", "category", "customer", "discount_percent", "discount_amount", "voucher", "organization_type"}
        for rule in self.rules:
            kind = rule.get("rule_type")
            config = rule.get("rule_config")
            if kind not in allowed or not isinstance(config, dict):
                raise ValueError("Every promotion rule requires a supported rule_type and object rule_config")
            try:
                percent = Decimal(str(config.get("percent", 0)))
                amount = Decimal(str(config.get("amount", 0)))
                quantity = Decimal(str(config.get("quantity", 0)))
            except (InvalidOperation, TypeError, ValueError) as exc:
                raise ValueError("Promotion numeric rule values must be valid decimals") from exc
            if kind == "discount_percent" and not Decimal("0") < percent <= Decimal("100"):
                raise ValueError("discount_percent requires percent between 0 and 100")
            if kind == "discount_amount" and amount <= 0:
                raise ValueError("discount_amount requires a positive amount")
            if kind == "minimum_value" and amount < 0:
                raise ValueError("minimum_value amount cannot be negative")
            if kind == "minimum_quantity" and quantity <= 0:
                raise ValueError("minimum_quantity requires a positive quantity")
            if kind == "product" and not (config.get("product_id") or config.get("product_ids")):
                raise ValueError("product rule requires a target id")
            if kind == "category" and not (config.get("category_id") or config.get("category_ids")):
                raise ValueError("category rule requires a target id")
            if kind == "customer" and not config.get("organization_id"):
                raise ValueError("customer rule requires organization_id")
            if kind == "organization_type":
                audience = config.get("organization_types") or ([config.get("organization_type")] if config.get("organization_type") else [])
                allowed_audiences = {"principal", "distributor", "company", "customer"}
                if not audience or any(value not in allowed_audiences for value in audience):
                    raise ValueError("organization_type requires organization_types from principal, distributor, company, customer")
            if kind == "voucher" and not config.get("code"):
                raise ValueError("voucher rule requires code")
        return self


class PromotionEvaluation(BaseModel):
    cart_id: UUID
    codes: list[str] = Field(default_factory=list, max_length=10)


class OrderCreate(BaseModel):
    cart_id: UUID
    idempotency_key: str = Field(min_length=8, max_length=128)
    promotion_codes: list[str] = Field(default_factory=list, max_length=10)
    shipping_snapshot: dict[str, Any] = Field(default_factory=dict)
    notes: str | None = Field(default=None, max_length=2000)


class OrderDecision(BaseModel):
    decision: Literal["approved", "rejected", "revision_requested"]
    reason: str | None = Field(default=None, max_length=1000)


class PartnerOrderDecision(BaseModel):
    model_config = ConfigDict(extra="forbid")
    decision: Literal["accepted", "rejected", "revision_requested"]
    reason: str | None = Field(default=None, min_length=3, max_length=1000)
    idempotency_key: str = Field(min_length=8, max_length=180)


class FulfillmentCreate(BaseModel):
    warehouse_id: UUID | None = None
    assigned_to: UUID | None = None


class FulfillmentUpdate(BaseModel):
    status: Literal["picking", "packed", "handed_over", "failed", "cancelled"]
    carrier: str | None = Field(default=None, max_length=120)
    tracking_number: str | None = Field(default=None, max_length=180)

    @model_validator(mode="after")
    def require_carrier_tracking_on_handover(self):
        if self.status == "handed_over" and (not self.carrier or not self.carrier.strip() or not self.tracking_number or not self.tracking_number.strip()):
            raise ValueError("Carrier and tracking_number are required before handover")
        return self


class PageResponse(BaseModel):
    items: list[dict[str, Any]]
    page: int
    page_size: int
    total: int


class PriceListLineWrite(BaseModel):
    product_id: UUID
    variant_id: UUID
    unit_price: Decimal = Field(ge=0, max_digits=18, decimal_places=2)
    minimum_quantity: Decimal = Field(default=Decimal("1"), gt=0, max_digits=18, decimal_places=3)
    maximum_quantity: Decimal | None = Field(default=None, gt=0, max_digits=18, decimal_places=3)


class PromotionUpdate(PromotionWrite):
    status: Literal["active", "inactive", "archived"] = "active"


class PriceListWrite(BaseModel):
    model_config = ConfigDict(extra="forbid")
    name: str = Field(min_length=2, max_length=180)
    code: str = Field(min_length=2, max_length=80)
    currency: str = Field(default="IDR", min_length=3, max_length=3)
    scope_type: Literal["tenant", "principal", "distributor", "company", "customer", "region", "channel", "contract"] = "tenant"
    scope_id: UUID | None = None
    channel: str | None = None
    priority: int = 100
    effective_from: str
    effective_until: str | None = None
    status: Literal["draft", "active", "inactive", "archived"] = "draft"
    prices: list[PriceListLineWrite] = Field(min_length=1, max_length=1000)

    @model_validator(mode="after")
    def validate_scope_and_lines(self):
        from datetime import datetime
        try:
            starts = datetime.fromisoformat(self.effective_from.replace("Z", "+00:00"))
            ends = datetime.fromisoformat(self.effective_until.replace("Z", "+00:00")) if self.effective_until else None
        except ValueError as exc:
            raise ValueError("Price list validity dates must be ISO-8601 timestamps") from exc
        if starts.tzinfo is None or (ends is not None and (ends.tzinfo is None or ends <= starts)):
            raise ValueError("Price list timestamps must include timezone and effective_until must be later than effective_from")
        if self.scope_type == "tenant" and self.scope_id is not None:
            raise ValueError("tenant price lists cannot have scope_id")
        if self.scope_type == "channel":
            if not self.channel or not self.channel.strip():
                raise ValueError("channel price lists require channel")
            if self.scope_id is not None:
                raise ValueError("channel price lists do not use scope_id")
        elif self.scope_type != "tenant" and self.scope_id is None:
            raise ValueError("non-tenant price lists require scope_id")
        if self.effective_until and self.effective_until <= self.effective_from:
            raise ValueError("effective_until must be later than effective_from")
        price_keys = [(line.product_id, line.variant_id, line.minimum_quantity) for line in self.prices]
        if len(price_keys) != len(set(price_keys)):
            raise ValueError("A price list cannot contain duplicate product/SKU/minimum-quantity rows")
        for line in self.prices:
            if line.maximum_quantity is not None and line.maximum_quantity < line.minimum_quantity:
                raise ValueError("maximum_quantity must be greater than or equal to minimum_quantity")
        return self


class WarehouseWrite(BaseModel):
    model_config = ConfigDict(extra="forbid")
    code: str = Field(min_length=1, max_length=60)
    name: str = Field(min_length=2, max_length=180)
    branch_id: UUID | None = None
    address: str | None = None


class CategoryWrite(BaseModel):
    model_config = ConfigDict(extra="forbid")
    code: str = Field(min_length=1, max_length=80)
    name: str = Field(min_length=2, max_length=160)
    parent_id: UUID | None = None
    description: str | None = None
    sort_order: int = 0


class BrandWrite(BaseModel):
    name: str = Field(min_length=2, max_length=160)


class UnitWrite(BaseModel):
    code: str = Field(min_length=1, max_length=20)
    name: str = Field(min_length=2, max_length=80)
    symbol: str | None = Field(default=None, max_length=20)
    decimal_places: int = Field(default=0, ge=0, le=6)


class CatalogAccessWrite(BaseModel):
    consumer_organization_id: UUID
    product_id: UUID | None = None
    access_type: Literal["catalog", "pricing", "inventory", "ordering"] = "catalog"
    starts_at: str
    ends_at: str | None = None


class StockTransferWrite(BaseModel):
    from_warehouse_id: UUID
    to_warehouse_id: UUID
    product_id: UUID
    variant_id: UUID
    quantity: Decimal = Field(gt=0, max_digits=18, decimal_places=3)
    reason: str = Field(min_length=3, max_length=500)
    idempotency_key: str = Field(min_length=8, max_length=128)


class OrderCancel(BaseModel):
    reason: str = Field(min_length=3, max_length=1000)


class ProductImageWrite(BaseModel):
    product_id: UUID
    variant_id: UUID | None = None
    storage_path: str = Field(min_length=3, max_length=500)
    mime_type: Literal["image/jpeg", "image/png", "image/webp"]
    size_bytes: int = Field(gt=0, le=10485760)
    alt_text: str | None = Field(default=None, max_length=240)
    sort_order: int = 0

class PartnerLinkWrite(BaseModel):
    partner_organization_id: UUID
    relationship_type: Literal["principal", "distributor", "company", "customer"]
    starts_at: str
    ends_at: str | None = None


class AssistedCartWrite(BaseModel):
    customer_organization_id: UUID


class OrderApprovalPolicyWrite(BaseModel):
    model_config = ConfigDict(extra="forbid")
    name: str = Field(min_length=2, max_length=160)
    minimum_total: Decimal = Field(default=Decimal("0"), ge=0, max_digits=18, decimal_places=2)
    maximum_total: Decimal | None = Field(default=None, ge=0, max_digits=18, decimal_places=2)
    required_approval_count: int = Field(default=1, ge=1, le=5)
    required_roles: list[str] = Field(default_factory=list, max_length=12)
    auto_approve_below: bool = False
    status: Literal["active", "inactive"] = "active"
