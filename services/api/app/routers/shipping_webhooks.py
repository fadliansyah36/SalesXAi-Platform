from fastapi import APIRouter, Depends, Request
import asyncpg

from app.db import get_connection
from app.errors import APIError
from app.services.smart_order import smart_order_service

router = APIRouter()


@router.post("/webhooks/shipping/{provider}")
async def shipping_provider_webhook(
    provider: str,
    request: Request,
    db: asyncpg.Connection = Depends(get_connection),
):
    raw_body = await request.body()
    if len(raw_body) > 1_048_576:
        raise APIError(413, "shipping_webhook_too_large", "Shipping webhook payload exceeds 1 MB.")
    headers = {key.lower(): value for key, value in request.headers.items()}
    return await smart_order_service.process_shipping_webhook(
        db, provider, headers, raw_body
    )
