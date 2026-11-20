from decimal import Decimal
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
        if self.movement_type != "adjustment" and self.adjustment_delta is not None:
            raise ValueError("adjustment_delta is only valid for adjustment movements")
        return self


class PromotionWrite(BaseModel):
    code: str = Field(min_length=2, max_length=60)
    name: str = Field(min_length=2, max_length=180)
    description: str | None = None
    starts_at: str
    ends_at: str
    priority: int = 100
    stackable: bool = False
    stacking_group: str | None = None
    rules: list[dict[str, Any]] = Field(min_length=1, max_length=20)


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


class FulfillmentCreate(BaseModel):
    warehouse_id: UUID | None = None
    assigned_to: UUID | None = None


class FulfillmentUpdate(BaseModel):
    status: Literal["picking", "packed", "handed_over", "delivered", "failed", "cancelled"]
    carrier: str | None = Field(default=None, max_length=120)
    tracking_number: str | None = Field(default=None, max_length=180)


class PageResponse(BaseModel):
    items: list[dict[str, Any]]
    page: int
    page_size: int
    total: int
