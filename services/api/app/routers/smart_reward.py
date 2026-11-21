from uuid import UUID
from fastapi import APIRouter, Depends, Query
import asyncpg
from app.db import get_connection
from app.security.dependencies import Principal,TenantContext,get_current_principal,require_api_action
from app.schemas.smart_reward import RewardProgramWrite,RewardRuleWrite,RewardCatalogWrite,RewardEarnWrite,RewardRedemptionWrite,RewardRedemptionDecision,RewardFulfillmentWrite,RewardAdjustmentWrite,RewardReverseWrite
from app.services.smart_reward import smart_reward_service
router=APIRouter(prefix="/organizations",tags=["smart-reward"])

@router.get("/{organization_id}/smart-reward/programs")
async def programs(organization_id:UUID,page:int=Query(1,ge=1),page_size:int=Query(25,ge=1,le=100),tenant:TenantContext=Depends(require_api_action("smartreward.programs.read")),db:asyncpg.Connection=Depends(get_connection)):
 smart_reward_service._tenant(organization_id,tenant); return await smart_reward_service.programs(db,organization_id,page,page_size)
@router.post("/{organization_id}/smart-reward/programs",status_code=201)
async def create_program(organization_id:UUID,payload:RewardProgramWrite,principal:Principal=Depends(get_current_principal),tenant:TenantContext=Depends(require_api_action("smartreward.programs.create")),db:asyncpg.Connection=Depends(get_connection)):
 smart_reward_service._tenant(organization_id,tenant); return await smart_reward_service.create_program(db,organization_id,principal.user_id,payload)
@router.patch("/{organization_id}/smart-reward/programs/{program_id}")
async def update_program(organization_id:UUID,program_id:UUID,payload:RewardProgramWrite,principal:Principal=Depends(get_current_principal),tenant:TenantContext=Depends(require_api_action("smartreward.programs.update")),db:asyncpg.Connection=Depends(get_connection)):
 smart_reward_service._tenant(organization_id,tenant); return await smart_reward_service.update_program(db,organization_id,principal.user_id,program_id,payload)
@router.get("/{organization_id}/smart-reward/rules")
async def rules(organization_id:UUID,program_id:UUID|None=None,tenant:TenantContext=Depends(require_api_action("smartreward.rules.read")),db:asyncpg.Connection=Depends(get_connection)):
 smart_reward_service._tenant(organization_id,tenant); return await smart_reward_service.rules(db,organization_id,program_id)
@router.post("/{organization_id}/smart-reward/programs/{program_id}/rules",status_code=201)
async def create_rule(organization_id:UUID,program_id:UUID,payload:RewardRuleWrite,principal:Principal=Depends(get_current_principal),tenant:TenantContext=Depends(require_api_action("smartreward.rules.create")),db:asyncpg.Connection=Depends(get_connection)):
 smart_reward_service._tenant(organization_id,tenant); return await smart_reward_service.create_rule(db,organization_id,principal.user_id,payload,program_id)
@router.patch("/{organization_id}/smart-reward/rules/{rule_id}")
async def update_rule(organization_id:UUID,rule_id:UUID,payload:RewardRuleWrite,principal:Principal=Depends(get_current_principal),tenant:TenantContext=Depends(require_api_action("smartreward.rules.update")),db:asyncpg.Connection=Depends(get_connection)):
 smart_reward_service._tenant(organization_id,tenant); return await smart_reward_service.update_rule(db,organization_id,principal.user_id,rule_id,payload)
@router.get("/{organization_id}/smart-reward/catalog")
async def catalog(organization_id:UUID,page:int=Query(1,ge=1),page_size:int=Query(24,ge=1,le=100),category:str|None=None,tenant:TenantContext=Depends(require_api_action("smartreward.catalog.read")),db:asyncpg.Connection=Depends(get_connection)):
 smart_reward_service._tenant(organization_id,tenant); return await smart_reward_service.catalog(db,organization_id,page,page_size,category)
@router.post("/{organization_id}/smart-reward/catalog",status_code=201)
async def create_catalog(organization_id:UUID,payload:RewardCatalogWrite,principal:Principal=Depends(get_current_principal),tenant:TenantContext=Depends(require_api_action("smartreward.catalog.create")),db:asyncpg.Connection=Depends(get_connection)):
 smart_reward_service._tenant(organization_id,tenant); return await smart_reward_service.create_catalog_item(db,organization_id,principal.user_id,payload)
@router.patch("/{organization_id}/smart-reward/catalog/{item_id}")
async def update_catalog(organization_id:UUID,item_id:UUID,payload:RewardCatalogWrite,principal:Principal=Depends(get_current_principal),tenant:TenantContext=Depends(require_api_action("smartreward.catalog.update")),db:asyncpg.Connection=Depends(get_connection)):
 smart_reward_service._tenant(organization_id,tenant); return await smart_reward_service.update_catalog_item(db,organization_id,principal.user_id,item_id,payload)
@router.get("/{organization_id}/smart-reward/balance")
async def balance(organization_id:UUID,principal:Principal=Depends(get_current_principal),tenant:TenantContext=Depends(require_api_action("smartreward.balance.read")),db:asyncpg.Connection=Depends(get_connection)):
 smart_reward_service._tenant(organization_id,tenant); return await smart_reward_service.balance(db,organization_id,principal.user_id)
@router.get("/{organization_id}/smart-reward/ledger")
async def ledger(organization_id:UUID,page:int=Query(1,ge=1),page_size:int=Query(25,ge=1,le=100),principal:Principal=Depends(get_current_principal),tenant:TenantContext=Depends(require_api_action("smartreward.ledger.read")),db:asyncpg.Connection=Depends(get_connection)):
 smart_reward_service._tenant(organization_id,tenant); return await smart_reward_service.ledger(db,organization_id,principal.user_id,page,page_size)
@router.post("/{organization_id}/smart-reward/earnings",status_code=201)
async def issue_points(organization_id:UUID,payload:RewardEarnWrite,principal:Principal=Depends(get_current_principal),tenant:TenantContext=Depends(require_api_action("smartreward.earnings.issue")),db:asyncpg.Connection=Depends(get_connection)):
 smart_reward_service._tenant(organization_id,tenant); return await smart_reward_service.issue_points(db,organization_id,principal.user_id,payload)
@router.post("/{organization_id}/smart-reward/redemptions",status_code=201)
async def redeem(organization_id:UUID,payload:RewardRedemptionWrite,principal:Principal=Depends(get_current_principal),tenant:TenantContext=Depends(require_api_action("smartreward.redemptions.create")),db:asyncpg.Connection=Depends(get_connection)):
 smart_reward_service._tenant(organization_id,tenant); return await smart_reward_service.redeem(db,organization_id,principal.user_id,payload)
@router.get("/{organization_id}/smart-reward/redemptions")
async def redemptions(organization_id:UUID,page:int=Query(1,ge=1),page_size:int=Query(25,ge=1,le=100),principal:Principal=Depends(get_current_principal),tenant:TenantContext=Depends(require_api_action("smartreward.redemptions.read")),db:asyncpg.Connection=Depends(get_connection)):
 smart_reward_service._tenant(organization_id,tenant); return await smart_reward_service.redemptions(db,organization_id,principal.user_id,page,page_size)
@router.patch("/{organization_id}/smart-reward/redemptions/{redemption_id}")
async def decide(organization_id:UUID,redemption_id:UUID,payload:RewardRedemptionDecision,principal:Principal=Depends(get_current_principal),tenant:TenantContext=Depends(require_api_action("smartreward.redemptions.decide")),db:asyncpg.Connection=Depends(get_connection)):
 smart_reward_service._tenant(organization_id,tenant); return await smart_reward_service.decide_redemption(db,organization_id,principal.user_id,redemption_id,payload)
@router.post("/{organization_id}/smart-reward/redemptions/{redemption_id}/fulfill")
async def fulfill(organization_id:UUID,redemption_id:UUID,payload:RewardFulfillmentWrite,principal:Principal=Depends(get_current_principal),tenant:TenantContext=Depends(require_api_action("smartreward.redemptions.fulfill")),db:asyncpg.Connection=Depends(get_connection)):
 smart_reward_service._tenant(organization_id,tenant); return await smart_reward_service.fulfill_redemption(db,organization_id,principal.user_id,redemption_id,payload)
@router.post("/{organization_id}/smart-reward/redemptions/{redemption_id}/cancel")
async def cancel(organization_id:UUID,redemption_id:UUID,principal:Principal=Depends(get_current_principal),tenant:TenantContext=Depends(require_api_action("smartreward.redemptions.cancel")),db:asyncpg.Connection=Depends(get_connection)):
 smart_reward_service._tenant(organization_id,tenant); return await smart_reward_service.cancel_redemption(db,organization_id,principal.user_id,redemption_id)
@router.post("/{organization_id}/smart-reward/adjustments",status_code=201)
async def adjust(organization_id:UUID,payload:RewardAdjustmentWrite,principal:Principal=Depends(get_current_principal),tenant:TenantContext=Depends(require_api_action("smartreward.adjustments.create")),db:asyncpg.Connection=Depends(get_connection)):
 smart_reward_service._tenant(organization_id,tenant); return await smart_reward_service.adjust(db,organization_id,principal.user_id,payload)
@router.post("/{organization_id}/smart-reward/ledger/{entry_id}/reverse",status_code=201)
async def reverse(organization_id:UUID,entry_id:UUID,payload:RewardReverseWrite,principal:Principal=Depends(get_current_principal),tenant:TenantContext=Depends(require_api_action("smartreward.ledger.reverse")),db:asyncpg.Connection=Depends(get_connection)):
 smart_reward_service._tenant(organization_id,tenant); return await smart_reward_service.reverse(db,organization_id,principal.user_id,entry_id,payload)
@router.get("/{organization_id}/smart-reward/reports")
async def report(organization_id:UUID,page:int=Query(1,ge=1),page_size:int=Query(25,ge=1,le=100),tenant:TenantContext=Depends(require_api_action("smartreward.reports.read")),db:asyncpg.Connection=Depends(get_connection)):
 smart_reward_service._tenant(organization_id,tenant); return await smart_reward_service.report(db,organization_id,page,page_size)
