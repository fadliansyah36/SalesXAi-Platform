from datetime import datetime
import asyncpg
from fastapi import Request
from app.repositories.platform_reads import PlatformReadRepository
from app.security.dependencies import Principal
from app.services.audit import write_audit

class PlatformReadService:
 def __init__(self,repository:PlatformReadRepository|None=None):
  self.repository=repository or PlatformReadRepository()
 async def list_users(self,connection:asyncpg.Connection,q:str|None,limit:int,offset:int)->list[dict]:
  rows=await self.repository.list_users(connection,q.strip() if q and q.strip() else None,limit,offset)
  return [{"id":str(row["id"]),"name":row["name"],"email":row["email"],"tenant_id":row["tenant_id"],
   "tenant_name":row["tenant_name"],"role":row["role"],"status":row["status"],
   "mfa_enabled":row["mfa_enabled"],"last_active":row["last_active"].isoformat() if row["last_active"] else None}
   for row in rows]
 async def list_roles(self,connection:asyncpg.Connection)->list[dict]:
  rows=await self.repository.list_roles(connection)
  return [{"id":str(row["id"]),"key":row["key"],"name":row["name"],"scope_type":row["scope_type"],
   "hierarchy_level":row["hierarchy_level"],"permissions":list(row["permissions"]),"assigned_users":row["assigned_users"]}
   for row in rows]
 async def list_audit_logs(self,connection:asyncpg.Connection,request:Request,principal:Principal,
  before:datetime|None,limit:int)->list[dict]:
  async with connection.transaction():
   rows=await self.repository.list_audit_logs(connection,before,limit)
   await write_audit(connection,request,principal,"platform.audit.read","admin_audit_log",None,
    metadata={"before":before.isoformat() if before else None,"limit":limit,"returned":len(rows)})
  return [dict(row) for row in rows]

platform_read_service=PlatformReadService()
