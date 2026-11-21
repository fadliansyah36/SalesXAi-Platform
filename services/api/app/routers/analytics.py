from datetime import date
from typing import Literal
from uuid import UUID

import asyncpg
from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel, Field

from app.db import get_connection
from app.security.dependencies import (
    Principal,
    TenantContext,
    get_current_principal,
    require_api_action,
)
from app.services.analytics import analytics_service

router = APIRouter(prefix="/organizations", tags=["analytics"])


class ReportRunCreate(BaseModel):
    report_key: str = Field(min_length=2, max_length=100, pattern=r"^[a-z0-9._-]+$")
    period_start: date
    period_end: date
    period_grain: Literal["day", "week", "month"] = "day"
    scope_type: Literal["tenant"] = "tenant"
    scope_id: None = None
    idempotency_key: str = Field(min_length=8, max_length=128)
    parameters: dict = Field(default_factory=dict)


@router.get("/{organization_id}/analytics/dashboard")
async def analytics_dashboard(
    organization_id: UUID,
    period_start: date = Query(...),
    period_end: date = Query(...),
    grain: Literal["day", "week", "month"] = "day",
    principal: Principal = Depends(get_current_principal),
    tenant: TenantContext = Depends(require_api_action("analytics.dashboard.read")),
    connection: asyncpg.Connection = Depends(get_connection),
):
    return await analytics_service.dashboard(
        connection, organization_id, tenant, principal, period_start, period_end, grain
    )


@router.get("/{organization_id}/analytics/reports")
async def list_analytics_reports(
    organization_id: UUID,
    limit: int = Query(default=50, ge=1, le=200),
    principal: Principal = Depends(get_current_principal),
    tenant: TenantContext = Depends(require_api_action("analytics.reports.read")),
    connection: asyncpg.Connection = Depends(get_connection),
):
    rows = await analytics_service.list_reports(connection, organization_id, tenant, principal, limit)
    return [dict(row) for row in rows]


@router.post("/{organization_id}/analytics/reports", status_code=202)
async def create_analytics_report(
    organization_id: UUID,
    payload: ReportRunCreate,
    principal: Principal = Depends(get_current_principal),
    tenant: TenantContext = Depends(require_api_action("analytics.reports.create")),
    connection: asyncpg.Connection = Depends(get_connection),
):
    return await analytics_service.create_report(
        connection, organization_id, tenant, principal, payload.model_dump()
    )
