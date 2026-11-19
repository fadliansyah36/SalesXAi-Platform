from collections.abc import AsyncIterator

import asyncpg
from fastapi import Request

from app.config import Settings
from app.errors import APIError


async def create_database_pool(settings: Settings) -> asyncpg.Pool:
    if not settings.database_configured or settings.database_url is None:
        raise APIError(
            503,
            "database_not_configured",
            "DATABASE_URL must reference the bound SalesX-Ai Supabase PostgreSQL project.",
        )
    return await asyncpg.create_pool(
        dsn=settings.database_url.get_secret_value(),
        min_size=settings.db_pool_min_size,
        max_size=settings.db_pool_max_size,
        timeout=settings.db_connect_timeout_seconds,
        command_timeout=settings.db_command_timeout_seconds,
        max_inactive_connection_lifetime=settings.db_max_inactive_connection_lifetime,
        statement_cache_size=0,
        ssl=True,
        server_settings={
            "application_name": "salesx-ai-api",
            "statement_timeout": str(settings.db_statement_timeout_ms),
            "idle_in_transaction_session_timeout": str(settings.db_statement_timeout_ms),
        },
    )


async def get_connection(request: Request) -> AsyncIterator[asyncpg.Connection]:
    pool: asyncpg.Pool | None = getattr(request.app.state, "db_pool", None)
    if pool is None:
        raise APIError(
            503,
            "database_not_ready",
            "FastAPI database integration is code-ready but DATABASE_URL has not been configured.",
        )
    async with pool.acquire() as connection:
        yield connection
