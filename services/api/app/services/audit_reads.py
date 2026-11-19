import asyncpg
from uuid import UUID
from app.errors import APIError
from app.repositories.audit_reads import AuditReadRepository
from app.security.dependencies import TenantContext

class AuditReadService:
 def __init__(self,repository:AuditReadRepository|None=None):
  self.repository=repository or AuditReadRepository()
 async def list_organization_audit(self,connection:asyncpg.Connection,organization_id:UUID,
  tenant:TenantContext,before:str|None,limit:int)->list[dict]:
  if tenant.organization_id!=organization_id:
   raise APIError(403,"forbidden","Cross-tenant audit access is denied.")
  rows=await self.repository.list_organization_audit(connection,organization_id,before,limit)
  return [dict(row) for row in rows]

audit_read_service=AuditReadService()
