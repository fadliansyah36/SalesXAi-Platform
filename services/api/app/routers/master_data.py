from uuid import UUID
from fastapi import APIRouter,Depends,Query,Request
import asyncpg
from app.errors import APIError
from app.db import get_connection
from app.schemas.master_data import MasterDataWrite,OutletAssignmentCreate
from app.security.dependencies import Principal,TenantContext,get_current_principal,require_api_action
from app.services.master_data import master_data_service

router=APIRouter(prefix="/organizations",tags=["master-data"])

async def _list(resource:str,organization_id:UUID,tenant:TenantContext,connection:asyncpg.Connection,limit:int,offset:int):
 return await master_data_service.list(connection,resource,organization_id,tenant,limit,offset)
async def _create(resource:str,organization_id:UUID,payload:MasterDataWrite,request:Request,principal:Principal,tenant:TenantContext,connection:asyncpg.Connection):
 return await master_data_service.create(connection,request,principal,tenant,resource,organization_id,payload.model_dump(exclude_unset=True))
async def _update(resource:str,organization_id:UUID,record_id:UUID,payload:MasterDataWrite,request:Request,principal:Principal,tenant:TenantContext,connection:asyncpg.Connection):
 return await master_data_service.update(connection,request,principal,tenant,resource,organization_id,record_id,payload.model_dump(exclude_unset=True))

@router.get("/{organization_id}/branches")
async def list_branches(organization_id:UUID,tenant:TenantContext=Depends(require_api_action("master.branches.read")),connection:asyncpg.Connection=Depends(get_connection),limit:int=Query(100,ge=1,le=500),offset:int=Query(0,ge=0)):
 return await _list("branches",organization_id,tenant,connection,limit,offset)
@router.post("/{organization_id}/branches",status_code=201)
async def create_branch(organization_id:UUID,payload:MasterDataWrite,request:Request,principal:Principal=Depends(get_current_principal),tenant:TenantContext=Depends(require_api_action("master.branches.create")),connection:asyncpg.Connection=Depends(get_connection)):
 return await _create("branches",organization_id,payload,request,principal,tenant,connection)
@router.patch("/{organization_id}/branches/{record_id}")
async def update_branch(organization_id:UUID,record_id:UUID,payload:MasterDataWrite,request:Request,principal:Principal=Depends(get_current_principal),tenant:TenantContext=Depends(require_api_action("master.branches.update")),connection:asyncpg.Connection=Depends(get_connection)):
 return await _update("branches",organization_id,record_id,payload,request,principal,tenant,connection)

@router.get("/{organization_id}/teams")
async def list_teams(organization_id:UUID,tenant:TenantContext=Depends(require_api_action("master.teams.read")),connection:asyncpg.Connection=Depends(get_connection),limit:int=Query(100,ge=1,le=500),offset:int=Query(0,ge=0)):
 return await _list("teams",organization_id,tenant,connection,limit,offset)
@router.post("/{organization_id}/teams",status_code=201)
async def create_team(organization_id:UUID,payload:MasterDataWrite,request:Request,principal:Principal=Depends(get_current_principal),tenant:TenantContext=Depends(require_api_action("master.teams.create")),connection:asyncpg.Connection=Depends(get_connection)):
 return await _create("teams",organization_id,payload,request,principal,tenant,connection)
@router.patch("/{organization_id}/teams/{record_id}")
async def update_team(organization_id:UUID,record_id:UUID,payload:MasterDataWrite,request:Request,principal:Principal=Depends(get_current_principal),tenant:TenantContext=Depends(require_api_action("master.teams.update")),connection:asyncpg.Connection=Depends(get_connection)):
 return await _update("teams",organization_id,record_id,payload,request,principal,tenant,connection)

@router.get("/{organization_id}/territories")
async def list_territories(organization_id:UUID,tenant:TenantContext=Depends(require_api_action("master.territories.read")),connection:asyncpg.Connection=Depends(get_connection),limit:int=Query(100,ge=1,le=500),offset:int=Query(0,ge=0)):
 return await _list("territories",organization_id,tenant,connection,limit,offset)
@router.post("/{organization_id}/territories",status_code=201)
async def create_territory(organization_id:UUID,payload:MasterDataWrite,request:Request,principal:Principal=Depends(get_current_principal),tenant:TenantContext=Depends(require_api_action("master.territories.create")),connection:asyncpg.Connection=Depends(get_connection)):
 return await _create("territories",organization_id,payload,request,principal,tenant,connection)
@router.patch("/{organization_id}/territories/{record_id}")
async def update_territory(organization_id:UUID,record_id:UUID,payload:MasterDataWrite,request:Request,principal:Principal=Depends(get_current_principal),tenant:TenantContext=Depends(require_api_action("master.territories.update")),connection:asyncpg.Connection=Depends(get_connection)):
 return await _update("territories",organization_id,record_id,payload,request,principal,tenant,connection)

@router.get("/{organization_id}/outlets")
async def list_outlets(organization_id:UUID,tenant:TenantContext=Depends(require_api_action("master.outlets.read")),connection:asyncpg.Connection=Depends(get_connection),limit:int=Query(100,ge=1,le=500),offset:int=Query(0,ge=0)):
 return await _list("outlets",organization_id,tenant,connection,limit,offset)
@router.post("/{organization_id}/outlets",status_code=201)
async def create_outlet(organization_id:UUID,payload:MasterDataWrite,request:Request,principal:Principal=Depends(get_current_principal),tenant:TenantContext=Depends(require_api_action("master.outlets.create")),connection:asyncpg.Connection=Depends(get_connection)):
 return await _create("outlets",organization_id,payload,request,principal,tenant,connection)
@router.patch("/{organization_id}/outlets/{record_id}")
async def update_outlet(organization_id:UUID,record_id:UUID,payload:MasterDataWrite,request:Request,principal:Principal=Depends(get_current_principal),tenant:TenantContext=Depends(require_api_action("master.outlets.update")),connection:asyncpg.Connection=Depends(get_connection)):
 return await _update("outlets",organization_id,record_id,payload,request,principal,tenant,connection)

@router.get("/{organization_id}/sales-profiles")
async def list_sales_profiles(organization_id:UUID,tenant:TenantContext=Depends(require_api_action("master.sales_profiles.read")),connection:asyncpg.Connection=Depends(get_connection),limit:int=Query(100,ge=1,le=500),offset:int=Query(0,ge=0)):
 return await _list("sales_profiles",organization_id,tenant,connection,limit,offset)
@router.post("/{organization_id}/sales-profiles",status_code=201)
async def create_sales_profile(organization_id:UUID,payload:MasterDataWrite,request:Request,principal:Principal=Depends(get_current_principal),tenant:TenantContext=Depends(require_api_action("master.sales_profiles.create")),connection:asyncpg.Connection=Depends(get_connection)):
 return await _create("sales_profiles",organization_id,payload,request,principal,tenant,connection)
@router.patch("/{organization_id}/sales-profiles/{record_id}")
async def update_sales_profile(organization_id:UUID,record_id:UUID,payload:MasterDataWrite,request:Request,principal:Principal=Depends(get_current_principal),tenant:TenantContext=Depends(require_api_action("master.sales_profiles.update")),connection:asyncpg.Connection=Depends(get_connection)):
 return await _update("sales_profiles",organization_id,record_id,payload,request,principal,tenant,connection)

@router.get("/{organization_id}/outlet-assignments")
async def list_outlet_assignments(organization_id:UUID,tenant:TenantContext=Depends(require_api_action("master.assignments.read")),connection:asyncpg.Connection=Depends(get_connection),limit:int=Query(100,ge=1,le=500),offset:int=Query(0,ge=0)):
 if tenant.organization_id!=organization_id:
     raise APIError(403,"forbidden","Cross-tenant assignment access is denied.")
 return await master_data_service.list_assignments(connection,organization_id,tenant,limit,offset)
@router.post("/{organization_id}/outlets/{outlet_id}/assignments",status_code=201)
async def assign_outlet(organization_id:UUID,outlet_id:UUID,payload:OutletAssignmentCreate,request:Request,principal:Principal=Depends(get_current_principal),tenant:TenantContext=Depends(require_api_action("master.assignments.manage")),connection:asyncpg.Connection=Depends(get_connection)):
 return await master_data_service.assign_outlet(connection,request,principal,tenant,organization_id,outlet_id,payload.sales_profile_id,payload.note)
