from __future__ import annotations
from typing import Any
import asyncpg

class SmartRewardRepository:
    """Persistence boundary for SmartReward application services.

    Services receive this adapter rather than depending on the FastAPI connection
    dependency or a Supabase client. SQL execution remains server-side on the
    bound PostgreSQL connection and transaction scope.
    """
    def __init__(self, connection: asyncpg.Connection):
        self._connection = connection

    def transaction(self, *args: Any, **kwargs: Any):
        return self._connection.transaction(*args, **kwargs)

    async def fetch(self, query: str, *args: Any):
        return await self._connection.fetch(query, *args)

    async def fetchrow(self, query: str, *args: Any):
        return await self._connection.fetchrow(query, *args)

    async def fetchval(self, query: str, *args: Any):
        return await self._connection.fetchval(query, *args)

    async def execute(self, query: str, *args: Any):
        return await self._connection.execute(query, *args)
