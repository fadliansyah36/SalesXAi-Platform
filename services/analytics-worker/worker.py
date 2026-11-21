from __future__ import annotations

import asyncio
import logging
import os
import ssl
from datetime import date, timedelta
from pathlib import Path

import asyncpg

logging.basicConfig(level=os.getenv("LOG_LEVEL", "INFO"))
logger = logging.getLogger("salesx.analytics")


def database_ssl_context() -> ssl.SSLContext:
    context = ssl.create_default_context(purpose=ssl.Purpose.SERVER_AUTH)
    ca_path = Path(os.getenv("SUPABASE_DATABASE_CA", "services/api/certs/supabase-prod-ca-2021.crt"))
    if ca_path.is_file():
        context.load_verify_locations(cafile=str(ca_path))
    context.check_hostname = True
    context.verify_mode = ssl.CERT_REQUIRED
    return context


async def run_once() -> int:
    dsn = os.getenv("DATABASE_URL")
    if not dsn:
        raise RuntimeError("DATABASE_URL must point to the bound SalesX-Ai Supabase project.")
    lookback = int(os.getenv("ANALYTICS_LOOKBACK_DAYS", "35"))
    if lookback < 1 or lookback > 366:
        raise ValueError("ANALYTICS_LOOKBACK_DAYS must be between 1 and 366.")
    end_date = date.today()
    start_date = end_date - timedelta(days=lookback - 1)
    connection = await asyncpg.connect(
        dsn=dsn,
        ssl=database_ssl_context(),
        command_timeout=float(os.getenv("ANALYTICS_DB_TIMEOUT_SECONDS", "120")),
        server_settings={"application_name": "salesx-analytics-worker"},
    )
    try:
        organizations = await connection.fetch(
            "select id from public.organizations where status='active' order by id"
        )
        completed = 0
        for organization in organizations:
            async with connection.transaction():
                await connection.fetchval(
                    "select public.analytics_refresh_daily_metrics($1,$2,$3)",
                    organization["id"],
                    start_date,
                    end_date,
                )
            completed += 1
        logger.info(
            "analytics_refresh_completed",
            extra={"organizations_processed": completed, "period_start": str(start_date), "period_end": str(end_date)},
        )
        return completed
    finally:
        await connection.close()


if __name__ == "__main__":
    asyncio.run(run_once())
