import asyncpg
from uuid import UUID

class AuditReadRepository:
 async def list_organization_audit(self,connection:asyncpg.Connection,organization_id:UUID,before:str|None,limit:int):
  return await connection.fetch("""select id,actor_user_id,organization_id,action,resource_type,resource_id,
   correlation_id,occurred_at,metadata from public.admin_audit_logs
   where organization_id=$1 and ($2::timestamptz is null or occurred_at<$2::timestamptz)
   order by occurred_at desc limit $3""",organization_id,before,limit)
