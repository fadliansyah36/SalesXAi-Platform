from __future__ import annotations

from dataclasses import dataclass
from typing import Any, Protocol


@dataclass(frozen=True)
class ShippingQuoteRequest:
    order_id: str
    destination: dict[str, Any]
    packages: list[dict[str, Any]]


@dataclass(frozen=True)
class ShippingQuote:
    provider: str
    service_code: str
    amount: str
    currency: str
    estimated_delivery: str | None
    provider_quote_id: str


@dataclass(frozen=True)
class ShipmentRequest:
    order_id: str
    quote_id: str
    recipient: dict[str, Any]
    packages: list[dict[str, Any]]


class ShippingAdapter(Protocol):
    async def quote(self, request: ShippingQuoteRequest) -> ShippingQuote: ...
    async def create_shipment(self, request: ShipmentRequest) -> dict[str, Any]: ...
    async def verify_webhook(self, headers: dict[str, str], raw_body: bytes) -> dict[str, Any]: ...


class ShippingAdapterUnavailable(RuntimeError):
    pass


class ShippingAdapterRegistry:
    def __init__(self) -> None:
        self._adapters: dict[str, ShippingAdapter] = {}

    def register(self, provider: str, adapter: ShippingAdapter) -> None:
        key = provider.strip().lower()
        if not key:
            raise ValueError("Shipping provider key is required.")
        if key in self._adapters:
            raise ValueError(f"Shipping provider '{key}' is already registered.")
        self._adapters[key] = adapter

    def resolve(self, provider: str | None) -> ShippingAdapter:
        key = (provider or "").strip().lower()
        if not key:
            raise ShippingAdapterUnavailable("No shipping provider is configured.")
        adapter = self._adapters.get(key)
        if adapter is None:
            raise ShippingAdapterUnavailable(f"Shipping provider '{key}' has no installed adapter.")
        return adapter


shipping_adapters = ShippingAdapterRegistry()
