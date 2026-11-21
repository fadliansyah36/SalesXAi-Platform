import asyncio
import json
from datetime import datetime
from uuid import UUID
from fastapi import APIRouter, Depends, Query
from fastapi.responses import StreamingResponse
import asyncpg
from app.db import get_connection
from app.errors import APIError
from app.security.dependencies import Principal,TenantContext,get_current_principal,require_api_action
from app.schemas.smart_reward import RewardProgramWrite,RewardRuleWrite,RewardCatalogWrite,RewardEarnWrite,RewardRedemptionWrite,RewardRedemptionDecision,RewardFulfillmentWrite,RewardAdjustmentWrite,RewardReverseWrite
from app.repositories.smart_reward import SmartRewardRepository
from app.services.smart_reward import smart_reward_service
from app.services.smart_reward_approval import smart_reward_approval_service
from app.schemas.smart_reward import (
 RewardApprovalWrite,RewardApprovalDecision,RewardPageResponse,RewardProgramResponse,
 RewardRuleResponse,RewardCatalogItemResponse,RewardBalanceResponse,RewardLedgerEntryResponse,
 RewardRedemptionResponse,RewardApprovalRequestResponse,RewardReportResponse
)
router=APIRouter(prefix="/organizations",tags=["smart-reward"])

async def get_smart_reward_repository(connection:asyncpg.Connection=Depends(get_connection))->SmartRewardRepository:
 return SmartRewardRepository(connection)

@router.get("/{organization_id}/smart-reward/programs",response_model=RewardPageResponse[RewardProgramResponse])
async def programs(organization_id:UUID,page:int=Query(1,ge=1),page_size:int=Query(25,ge=1,le=100),tenant:TenantContext=Depends(require_api_action("smartreward.programs.read")),db:SmartRewardRepository=Depends(get_smart_reward_repository)):
 smart_reward_service._tenant(organization_id,tenant); return await smart_reward_service.programs(db,organization_id,page,page_size)
@router.post("/{organization_id}/smart-reward/programs",status_code=201,response_model=RewardProgramResponse)
async def create_program(organization_id:UUID,payload:RewardProgramWrite,principal:Principal=Depends(get_current_principal),tenant:TenantContext=Depends(require_api_action("smartreward.programs.create")),db:SmartRewardRepository=Depends(get_smart_reward_repository)):
 smart_reward_service._tenant(organization_id,tenant); return await smart_reward_service.create_program(db,organization_id,principal.user_id,payload)
@router.patch("/{organization_id}/smart-reward/programs/{program_id}",response_model=RewardProgramResponse)
async def update_program(organization_id:UUID,program_id:UUID,payload:RewardProgramWrite,principal:Principal=Depends(get_current_principal),tenant:TenantContext=Depends(require_api_action("smartreward.programs.update")),db:SmartRewardRepository=Depends(get_smart_reward_repository)):
 smart_reward_service._tenant(organization_id,tenant); return await smart_reward_service.update_program(db,organization_id,principal.user_id,program_id,payload)
@router.get("/{organization_id}/smart-reward/rules",response_model=list[RewardRuleResponse])
async def rules(organization_id:UUID,program_id:UUID|None=None,tenant:TenantContext=Depends(require_api_action("smartreward.rules.read")),db:SmartRewardRepository=Depends(get_smart_reward_repository)):
 smart_reward_service._tenant(organization_id,tenant); return await smart_reward_service.rules(db,organization_id,program_id)
@router.post("/{organization_id}/smart-reward/programs/{program_id}/rules",status_code=201,response_model=RewardRuleResponse)
async def create_rule(organization_id:UUID,program_id:UUID,payload:RewardRuleWrite,principal:Principal=Depends(get_current_principal),tenant:TenantContext=Depends(require_api_action("smartreward.rules.create")),db:SmartRewardRepository=Depends(get_smart_reward_repository)):
 smart_reward_service._tenant(organization_id,tenant); return await smart_reward_service.create_rule(db,organization_id,principal.user_id,payload,program_id)
@router.patch("/{organization_id}/smart-reward/rules/{rule_id}",response_model=RewardRuleResponse)
async def update_rule(organization_id:UUID,rule_id:UUID,payload:RewardRuleWrite,principal:Principal=Depends(get_current_principal),tenant:TenantContext=Depends(require_api_action("smartreward.rules.update")),db:SmartRewardRepository=Depends(get_smart_reward_repository)):
 smart_reward_service._tenant(organization_id,tenant); return await smart_reward_service.update_rule(db,organization_id,principal.user_id,rule_id,payload)
@router.get("/{organization_id}/smart-reward/catalog",response_model=RewardPageResponse[RewardCatalogItemResponse])
async def catalog(organization_id:UUID,page:int=Query(1,ge=1),page_size:int=Query(24,ge=1,le=100),category:str|None=None,tenant:TenantContext=Depends(require_api_action("smartreward.catalog.read")),db:SmartRewardRepository=Depends(get_smart_reward_repository)):
 smart_reward_service._tenant(organization_id,tenant); return await smart_reward_service.catalog(db,organization_id,page,page_size,category)
@router.post("/{organization_id}/smart-reward/catalog",status_code=201,response_model=RewardCatalogItemResponse)
async def create_catalog(organization_id:UUID,payload:RewardCatalogWrite,principal:Principal=Depends(get_current_principal),tenant:TenantContext=Depends(require_api_action("smartreward.catalog.create")),db:SmartRewardRepository=Depends(get_smart_reward_repository)):
 smart_reward_service._tenant(organization_id,tenant); return await smart_reward_service.create_catalog_item(db,organization_id,principal.user_id,payload)
@router.patch("/{organization_id}/smart-reward/catalog/{item_id}",response_model=RewardCatalogItemResponse)
async def update_catalog(organization_id:UUID,item_id:UUID,payload:RewardCatalogWrite,principal:Principal=Depends(get_current_principal),tenant:TenantContext=Depends(require_api_action("smartreward.catalog.update")),db:SmartRewardRepository=Depends(get_smart_reward_repository)):
 smart_reward_service._tenant(organization_id,tenant); return await smart_reward_service.update_catalog_item(db,organization_id,principal.user_id,item_id,payload)
@router.get("/{organization_id}/smart-reward/balance",response_model=RewardBalanceResponse)
async def balance(organization_id:UUID,principal:Principal=Depends(get_current_principal),tenant:TenantContext=Depends(require_api_action("smartreward.balance.read")),db:SmartRewardRepository=Depends(get_smart_reward_repository)):
 smart_reward_service._tenant(organization_id,tenant); return await smart_reward_service.balance(db,organization_id,principal.user_id)
@router.get("/{organization_id}/smart-reward/ledger",response_model=RewardPageResponse[RewardLedgerEntryResponse])
async def ledger(organization_id:UUID,page:int=Query(1,ge=1),page_size:int=Query(25,ge=1,le=100),principal:Principal=Depends(get_current_principal),tenant:TenantContext=Depends(require_api_action("smartreward.ledger.read")),db:SmartRewardRepository=Depends(get_smart_reward_repository)):
 smart_reward_service._tenant(organization_id,tenant); return await smart_reward_service.ledger(db,organization_id,principal.user_id,page,page_size)
@router.post("/{organization_id}/smart-reward/earnings",status_code=201,response_model=RewardLedgerEntryResponse)
async def issue_points(organization_id:UUID,payload:RewardEarnWrite,principal:Principal=Depends(get_current_principal),tenant:TenantContext=Depends(require_api_action("smartreward.earnings.issue")),db:SmartRewardRepository=Depends(get_smart_reward_repository)):
 smart_reward_service._tenant(organization_id,tenant); return await smart_reward_service.issue_points(db,organization_id,principal.user_id,payload)
@router.post("/{organization_id}/smart-reward/redemptions",status_code=201,response_model=RewardRedemptionResponse)
async def redeem(organization_id:UUID,payload:RewardRedemptionWrite,principal:Principal=Depends(get_current_principal),tenant:TenantContext=Depends(require_api_action("smartreward.redemptions.create")),db:SmartRewardRepository=Depends(get_smart_reward_repository)):
 smart_reward_service._tenant(organization_id,tenant); return await smart_reward_service.redeem(db,organization_id,principal.user_id,payload)
@router.get("/{organization_id}/smart-reward/redemptions",response_model=RewardPageResponse[RewardRedemptionResponse])
async def redemptions(organization_id:UUID,page:int=Query(1,ge=1),page_size:int=Query(25,ge=1,le=100),principal:Principal=Depends(get_current_principal),tenant:TenantContext=Depends(require_api_action("smartreward.redemptions.read")),db:SmartRewardRepository=Depends(get_smart_reward_repository)):
 smart_reward_service._tenant(organization_id,tenant); return await smart_reward_service.redemptions(db,organization_id,principal.user_id,page,page_size)
@router.patch("/{organization_id}/smart-reward/redemptions/{redemption_id}",response_model=RewardRedemptionResponse)
async def decide(organization_id:UUID,redemption_id:UUID,payload:RewardRedemptionDecision,principal:Principal=Depends(get_current_principal),tenant:TenantContext=Depends(require_api_action("smartreward.redemptions.decide")),db:SmartRewardRepository=Depends(get_smart_reward_repository)):
 smart_reward_service._tenant(organization_id,tenant); return await smart_reward_service.decide_redemption(db,organization_id,principal.user_id,redemption_id,payload)
@router.post("/{organization_id}/smart-reward/redemptions/{redemption_id}/fulfill",response_model=RewardRedemptionResponse)
async def fulfill(organization_id:UUID,redemption_id:UUID,payload:RewardFulfillmentWrite,principal:Principal=Depends(get_current_principal),tenant:TenantContext=Depends(require_api_action("smartreward.redemptions.fulfill")),db:SmartRewardRepository=Depends(get_smart_reward_repository)):
 smart_reward_service._tenant(organization_id,tenant); return await smart_reward_service.fulfill_redemption(db,organization_id,principal.user_id,redemption_id,payload)
@router.post("/{organization_id}/smart-reward/redemptions/{redemption_id}/cancel",response_model=RewardRedemptionResponse)
async def cancel(organization_id:UUID,redemption_id:UUID,principal:Principal=Depends(get_current_principal),tenant:TenantContext=Depends(require_api_action("smartreward.redemptions.cancel")),db:SmartRewardRepository=Depends(get_smart_reward_repository)):
 smart_reward_service._tenant(organization_id,tenant); return await smart_reward_service.cancel_redemption(db,organization_id,principal.user_id,redemption_id)
@router.post("/{organization_id}/smart-reward/adjustments",status_code=201,response_model=RewardLedgerEntryResponse)
async def adjust(organization_id:UUID,payload:RewardAdjustmentWrite,principal:Principal=Depends(get_current_principal),tenant:TenantContext=Depends(require_api_action("smartreward.adjustments.create")),db:SmartRewardRepository=Depends(get_smart_reward_repository)):
 smart_reward_service._tenant(organization_id,tenant); return await smart_reward_service.adjust(db,organization_id,principal.user_id,payload)
@router.post("/{organization_id}/smart-reward/ledger/{entry_id}/reverse",status_code=201,response_model=RewardLedgerEntryResponse)
async def reverse(organization_id:UUID,entry_id:UUID,payload:RewardReverseWrite,principal:Principal=Depends(get_current_principal),tenant:TenantContext=Depends(require_api_action("smartreward.ledger.reverse")),db:SmartRewardRepository=Depends(get_smart_reward_repository)):
 smart_reward_service._tenant(organization_id,tenant); return await smart_reward_service.reverse(db,organization_id,principal.user_id,entry_id,payload)
@router.get("/{organization_id}/smart-reward/reports",response_model=RewardReportResponse)
async def report(organization_id:UUID,page:int=Query(1,ge=1),page_size:int=Query(25,ge=1,le=100),start_at:datetime|None=None,end_at:datetime|None=None,branch_id:UUID|None=None,principal:Principal=Depends(get_current_principal),tenant:TenantContext=Depends(require_api_action("smartreward.reports.read")),db:SmartRewardRepository=Depends(get_smart_reward_repository)):
 smart_reward_service._tenant(organization_id,tenant); return await smart_reward_service.report(db,organization_id,page,page_size,start_at,end_at,branch_id,principal.user_id)

@router.get("/{organization_id}/smart-reward/approvals",response_model=RewardPageResponse[RewardApprovalRequestResponse])
async def approvals(organization_id:UUID,page:int=Query(1,ge=1),page_size:int=Query(25,ge=1,le=100),principal:Principal=Depends(get_current_principal),tenant:TenantContext=Depends(require_api_action("smartreward.approvals.read")),db:SmartRewardRepository=Depends(get_smart_reward_repository)):
 smart_reward_service._tenant(organization_id,tenant); return await smart_reward_approval_service.list(db,organization_id,principal.user_id,page,page_size)
@router.post("/{organization_id}/smart-reward/approvals",status_code=201,response_model=RewardApprovalRequestResponse)
async def request_approval(organization_id:UUID,payload:RewardApprovalWrite,principal:Principal=Depends(get_current_principal),tenant:TenantContext=Depends(require_api_action("smartreward.approvals.create")),db:SmartRewardRepository=Depends(get_smart_reward_repository)):
 smart_reward_service._tenant(organization_id,tenant); return await smart_reward_approval_service.request(db,organization_id,principal.user_id,payload)
@router.patch("/{organization_id}/smart-reward/approvals/{approval_id}",response_model=RewardApprovalRequestResponse)
async def decide_approval(organization_id:UUID,approval_id:UUID,payload:RewardApprovalDecision,principal:Principal=Depends(get_current_principal),tenant:TenantContext=Depends(require_api_action("smartreward.approvals.decide")),db:SmartRewardRepository=Depends(get_smart_reward_repository)):
 smart_reward_service._tenant(organization_id,tenant); return await smart_reward_approval_service.decide(db,organization_id,principal.user_id,approval_id,payload)

@router.get("/{organization_id}/smart-reward/events")
async def reward_events(organization_id:UUID,after:str|None=None,principal:Principal=Depends(get_current_principal),tenant:TenantContext=Depends(require_api_action("smartreward.events.read")),db:SmartRewardRepository=Depends(get_smart_reward_repository)):
 smart_reward_service._tenant(organization_id,tenant)
 scopes=await db.fetch("""select r.key role_key,ura.scope_type,ura.scope_id from public.organization_memberships m
  join public.user_role_assignments ura on ura.membership_id=m.id join public.roles r on r.id=ura.role_id
  join public.role_permissions rp on rp.role_id=ura.role_id
  where m.organization_id=$1 and m.user_id=$2 and m.status='active' and ura.revoked_at is null
   and ura.starts_at<=now() and (ura.expires_at is null or ura.expires_at>now())
   and rp.permission_key in ('smartreward:ledger:read','smartreward:redemption:read','smartreward:approval:read')""",organization_id,principal.user_id)
 if not scopes: raise APIError(403,"reward_event_scope_forbidden","Reward event subscription is not authorized.")
 role_keys={x["role_key"] for x in scopes}
 tenant_scope=bool(role_keys.intersection({"tenant_owner","company_admin","principal_user","distributor_user"}))
 branch_ids=[str(x["scope_id"]) for x in scopes if x["role_key"]=="supervisor" and x["scope_type"]=="branch"]
 actor_id=str(principal.user_id)
 cursor_time=await db.fetchval("select now()");cursor_id=UUID(int=0)
 if after:
  try:
   raw_time,raw_id=after.split("|",1);cursor_time=datetime.fromisoformat(raw_time.replace("Z","+00:00"));cursor_id=UUID(raw_id)
  except (ValueError,TypeError): raise APIError(400,"reward_event_cursor_invalid","Realtime event cursor is invalid.") from None
 async def stream():
  nonlocal cursor_time,cursor_id
  while True:
   rows=await db.fetch("""select id,occurred_at,payload from public.reward_event_outbox where organization_id=$1
    and event_type='smartreward.changed' and (occurred_at>$2 or (occurred_at=$2 and id>$3))
    and ($4::boolean or payload->>'participant_user_id'=$5 or payload->>'requested_by'=$5 or payload->>'branch_id'=any($6::text[]))
    order by occurred_at,id limit 100""",organization_id,cursor_time,cursor_id,tenant_scope,actor_id,branch_ids)
   if not rows:
    yield ": keepalive\n\n";await asyncio.sleep(3);continue
   for row in rows:
    cursor_time=row["occurred_at"];cursor_id=row["id"]
    payload=row["payload"]
    if isinstance(payload,str): payload=json.loads(payload)
    payload={k:v for k,v in payload.items() if k not in ("participant_user_id","requested_by","branch_id")}
    event_id=cursor_time.isoformat()+"|"+str(cursor_id)
    yield "id: "+event_id+"\nevent: smartreward.changed\ndata: "+json.dumps(payload,default=str)+"\n\n"
 return StreamingResponse(stream(),media_type="text/event-stream",headers={"Cache-Control":"no-cache, no-transform","X-Accel-Buffering":"no","Connection":"keep-alive"})
