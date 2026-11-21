from decimal import Decimal
from datetime import datetime
from typing import Any, Generic, Literal, TypeVar
from uuid import UUID
from pydantic import BaseModel, ConfigDict, Field, model_validator

class RewardProgramWrite(BaseModel):
 model_config=ConfigDict(extra="forbid")
 code:str=Field(min_length=2,max_length=60); name:str=Field(min_length=2,max_length=180)
 description:str|None=None; program_type:Literal["loyalty","incentive","campaign"]="loyalty"
 reward_type:Literal["points","tier","voucher"]="points"; starts_at:str; ends_at:str
 status:Literal["draft","active","paused","completed","archived"]="draft"
 audience:dict[str,Any]=Field(default_factory=dict); configuration:dict[str,Any]=Field(default_factory=dict); customer_segment_id:UUID|None=None
 @model_validator(mode="after")
 def validate_period(self):
  from datetime import datetime
  a=datetime.fromisoformat(self.starts_at.replace("Z","+00:00")); b=datetime.fromisoformat(self.ends_at.replace("Z","+00:00"))
  if a.tzinfo is None or b.tzinfo is None or b<=a: raise ValueError("Timezone-aware period with ends_at after starts_at is required")
  return self

class RewardProgramPatch(BaseModel):
 model_config=ConfigDict(extra="forbid")
 code:str|None=None; name:str|None=None; description:str|None=None
 program_type:Literal["loyalty","incentive","campaign"]|None=None
 reward_type:Literal["points","tier","voucher"]|None=None
 starts_at:str|None=None; ends_at:str|None=None
 status:Literal["draft","active","paused","completed","archived"]|None=None
 audience:dict[str,Any]|None=None; configuration:dict[str,Any]|None=None
 customer_segment_id:UUID|None=None

class RewardRuleWrite(BaseModel):
 model_config=ConfigDict(extra="forbid")
 code:str=Field(min_length=2,max_length=60); name:str=Field(min_length=2,max_length=180)
 event_key:Literal["order.completed","visit.completed","target.achieved","manual.approved"]
 priority:int=Field(default=100,ge=0,le=10000); rule_config:dict[str,Any]=Field(default_factory=dict)
 points_per_unit:Decimal=Field(default=Decimal(0),ge=0,max_digits=18,decimal_places=4)
 fixed_points:int=Field(default=0,ge=0,le=1000000000); max_points:int|None=Field(default=None,ge=0)
 requires_approval:bool=False; status:Literal["active","inactive","archived"]="active"; customer_segment_id:UUID|None=None

class RewardRulePatch(BaseModel):
 model_config=ConfigDict(extra="forbid")
 code:str|None=None; name:str|None=None
 event_key:Literal["order.completed","visit.completed","target.achieved","manual.approved"]|None=None
 priority:int|None=Field(default=None,ge=0,le=10000)
 rule_config:dict[str,Any]|None=None
 points_per_unit:Decimal|None=Field(default=None,ge=0,max_digits=18,decimal_places=4)
 fixed_points:int|None=Field(default=None,ge=0,le=1000000000)
 max_points:int|None=None; requires_approval:bool|None=None
 status:Literal["active","inactive","archived"]|None=None
 customer_segment_id:UUID|None=None

class RewardCatalogWrite(BaseModel):
 model_config=ConfigDict(extra="forbid")
 program_id:UUID|None=None; code:str=Field(min_length=2,max_length=60); name:str=Field(min_length=2,max_length=180)
 description:str|None=None; category:str=Field(min_length=2,max_length=80); points_cost:int=Field(gt=0,le=1000000000)
 quantity_total:int|None=Field(default=None,ge=0); starts_at:str|None=None; ends_at:str|None=None
 eligibility:dict[str,Any]=Field(default_factory=dict); metadata:dict[str,Any]=Field(default_factory=dict); customer_segment_id:UUID|None=None
 status:Literal["draft","active","paused","out_of_stock","archived"]="draft"

class RewardCatalogPatch(BaseModel):
 model_config=ConfigDict(extra="forbid")
 program_id:UUID|None=None; code:str|None=None; name:str|None=None
 description:str|None=None; category:str|None=None
 points_cost:int|None=Field(default=None,gt=0,le=1000000000)
 quantity_total:int|None=Field(default=None,ge=0)
 starts_at:str|None=None; ends_at:str|None=None
 eligibility:dict[str,Any]|None=None; metadata:dict[str,Any]|None=None
 customer_segment_id:UUID|None=None
 status:Literal["draft","active","paused","out_of_stock","archived"]|None=None

class RewardEarnWrite(BaseModel):
 model_config=ConfigDict(extra="forbid")
 program_id:UUID; rule_id:UUID; participant_user_id:UUID
 source_type:Literal["order","visit","target","manual"]; source_id:UUID
 idempotency_key:str=Field(min_length=8,max_length=180); reason:str=Field(min_length=3,max_length=1000)
 metric_value:Decimal=Field(default=Decimal(1),ge=0,max_digits=18,decimal_places=4)

class RewardRedemptionWrite(BaseModel):
 model_config=ConfigDict(extra="forbid")
 catalog_item_id:UUID; quantity:int=Field(default=1,gt=0,le=100); idempotency_key:str=Field(min_length=8,max_length=180)

class RewardRedemptionDecision(BaseModel):
 model_config=ConfigDict(extra="forbid")
 decision:Literal["approved","rejected"]; reason:str=Field(min_length=5,max_length=1000)

class RewardFulfillmentWrite(BaseModel):
 model_config=ConfigDict(extra="forbid")
 fulfillment_reference:str=Field(min_length=2,max_length=180); reason:str|None=Field(default=None,max_length=1000)

class RewardAdjustmentWrite(BaseModel):
 model_config=ConfigDict(extra="forbid")
 participant_user_id:UUID; points_delta:int=Field(ne=0,ge=-1000000000,le=1000000000)
 reference_type:str=Field(min_length=2,max_length=80); reference_id:UUID
 idempotency_key:str=Field(min_length=8,max_length=180); reason:str=Field(min_length=5,max_length=1000)

class RewardReverseWrite(BaseModel):
 model_config=ConfigDict(extra="forbid")
 idempotency_key:str=Field(min_length=8,max_length=180); reason:str=Field(min_length=5,max_length=1000)

class RewardApprovalWrite(BaseModel):
 model_config=ConfigDict(extra="forbid")
 request_type:Literal["manual_earning","rule_earning"]
 participant_user_id:UUID
 program_id:UUID
 rule_id:UUID
 source_type:Literal["order","visit","target","manual"]="manual"
 source_id:UUID|None=None
 manual_points:int|None=Field(default=None,gt=0,le=1000000000)
 metric_value:Decimal=Field(default=Decimal(1),ge=0,max_digits=18,decimal_places=4)
 idempotency_key:str=Field(min_length=8,max_length=180)
 reason:str=Field(min_length=5,max_length=1000)

class RewardApprovalDecision(BaseModel):
 model_config=ConfigDict(extra="forbid")
 decision:Literal["approved","rejected"]
 reason:str=Field(min_length=5,max_length=1000)


ResponseT = TypeVar("ResponseT")

class RewardPageResponse(BaseModel, Generic[ResponseT]):
 model_config=ConfigDict(extra="allow")
 items:list[ResponseT]
 page:int
 page_size:int
 total:int

class RewardProgramResponse(BaseModel):
 model_config=ConfigDict(extra="allow")
 id:UUID; organization_id:UUID; code:str; name:str; description:str|None=None
 program_type:str; reward_type:str; starts_at:datetime; ends_at:datetime; status:str
 audience:dict[str,Any]; configuration:dict[str,Any]
 created_by:UUID; updated_by:UUID; created_at:datetime; updated_at:datetime

class RewardRuleResponse(BaseModel):
 model_config=ConfigDict(extra="allow")
 id:UUID; organization_id:UUID; program_id:UUID; code:str; name:str; event_key:str
 priority:int; rule_config:dict[str,Any]; points_per_unit:Decimal; fixed_points:int
 max_points:int|None=None; requires_approval:bool; status:str
 created_by:UUID; updated_by:UUID; created_at:datetime; updated_at:datetime

class RewardCatalogItemResponse(BaseModel):
 model_config=ConfigDict(extra="allow")
 id:UUID; organization_id:UUID; program_id:UUID|None=None; code:str; name:str
 description:str|None=None; category:str; points_cost:int; quantity_total:int|None=None
 quantity_reserved:int=0; quantity_fulfilled:int=0; starts_at:datetime|None=None
 ends_at:datetime|None=None; eligibility:dict[str,Any]; metadata:dict[str,Any]
 status:str; created_by:UUID; updated_by:UUID; created_at:datetime; updated_at:datetime
 eligible:bool|None=None; eligibility_reason:str|None=None; available_stock:int|None=None; points_balance:int|None=None; period_remaining:int|None=None; catalog_period_remaining:int|None=None

class RewardBalanceResponse(BaseModel):
 model_config=ConfigDict(extra="allow")
 account_id:UUID; organization_id:UUID; participant_user_id:UUID
 points_balance:int; next_expiration_at:datetime|None=None; expiring_points_30d:int=0

class RewardLedgerEntryResponse(BaseModel):
 model_config=ConfigDict(extra="allow")
 id:UUID; entry_type:str; points_delta:int; balance_before:int; balance_after:int
 source_type:str; source_id:UUID; reference_type:str|None=None; reference_id:UUID|None=None
 actor_user_id:UUID; reason:str; occurred_at:datetime; expires_at:datetime|None=None
 metadata:dict[str,Any]=Field(default_factory=dict); reversal_of:UUID|None=None

class RewardRedemptionResponse(BaseModel):
 model_config=ConfigDict(extra="allow")
 id:UUID; organization_id:UUID; account_id:UUID; catalog_item_id:UUID
 participant_user_id:UUID; quantity:int; points_reserved:int; status:str
 idempotency_key:str; requested_by:UUID; decided_by:UUID|None=None; fulfilled_by:UUID|None=None
 fulfillment_reference:str|None=None; reason:str|None=None; requested_at:datetime
 decided_at:datetime|None=None; fulfilled_at:datetime|None=None; updated_at:datetime
 catalog_code:str|None=None; catalog_name:str|None=None; category:str|None=None

class RewardApprovalHistoryResponse(BaseModel):
 model_config=ConfigDict(extra="allow")
 id:UUID; from_status:str|None=None; to_status:str; actor_user_id:UUID
 reason:str; occurred_at:datetime

class RewardApprovalRequestResponse(BaseModel):
 model_config=ConfigDict(extra="allow")
 id:UUID; organization_id:UUID; request_type:str; participant_user_id:UUID
 program_id:UUID|None=None; rule_id:UUID|None=None; source_type:str|None=None
 source_id:UUID|None=None; points_requested:int; metric_value:Decimal; requested_by:UUID
 status:str; request_reason:str; decision_reason:str|None=None; decided_by:UUID|None=None
 decided_at:datetime|None=None; ledger_entry_id:UUID|None=None
 history:list[RewardApprovalHistoryResponse]=Field(default_factory=list)
 created_at:datetime; updated_at:datetime

class RewardBranchReportResponse(BaseModel):
 model_config=ConfigDict(extra="allow")
 branch_id:UUID|None=None; earned_points:int=0; redeemed_points:int=0
 expired_points:int=0; participants:int=0

class RewardReportResponse(BaseModel):
 model_config=ConfigDict(extra="allow")
 earned_points:int=0; redeemed_points:int=0; expired_points:int=0
 adjusted_points:int=0; reversed_points:int=0; ledger_entries:int=0; participants:int=0
 incentive_achievements:int=0; outstanding_points:int=0; pending_redemptions:int=0
 pending_approvals:int=0; by_branch:list[RewardBranchReportResponse]=Field(default_factory=list)
 page:int; page_size:int; period_start:datetime|None=None; period_end:datetime|None=None

class PlatformSmartRewardOverviewRowResponse(BaseModel):
 model_config=ConfigDict(extra="allow")
 organization_id:UUID; organization_name:str; earned_points:int=0; redeemed_points:int=0
 outstanding_points:int=0; expired_points:int=0; adjusted_points:int=0; reversed_points:int=0
 incentive_achievements:int=0; pending_redemptions:int=0; pending_approvals:int=0; participants:int=0

class PlatformSmartRewardOverviewResponse(BaseModel):
 model_config=ConfigDict(extra="allow")
 items:list[PlatformSmartRewardOverviewRowResponse]; total:int; limit:int; offset:int

class RewardProgressItemResponse(BaseModel):
 model_config=ConfigDict(extra="allow")
 program_id:UUID; program_name:str; rule_id:UUID; rule_name:str; event_key:str
 period_days:int; points_earned:int; points_limit:int|None=None; points_remaining:int|None=None
 metric_achieved:Decimal=Decimal(0); target_metric:Decimal|None=None
 progress_percent:Decimal|None=None; requires_approval:bool

class RewardProgressResponse(BaseModel):
 model_config=ConfigDict(extra="allow")
 organization_id:UUID; participant_user_id:UUID; items:list[RewardProgressItemResponse]


class RewardCustomerSegmentCriteria(BaseModel):
 model_config=ConfigDict(extra="forbid")
 roles:list[str]=Field(default_factory=list,max_length=50)
 branch_ids:list[UUID]=Field(default_factory=list,max_length=500)
 user_ids:list[UUID]=Field(default_factory=list,max_length=500)
 minimum_points_balance:int=Field(default=0,ge=0,le=1000000000)

class RewardCustomerSegmentWrite(BaseModel):
 model_config=ConfigDict(extra="forbid")
 code:str=Field(min_length=2,max_length=60)
 name:str=Field(min_length=2,max_length=180)
 description:str|None=None
 status:Literal["draft","active","paused","archived"]="draft"
 membership_mode:Literal["manual","rule_based","hybrid"]="hybrid"
 criteria:RewardCustomerSegmentCriteria=Field(default_factory=RewardCustomerSegmentCriteria)
 starts_at:datetime|None=None
 ends_at:datetime|None=None
 @model_validator(mode="after")
 def validate_period(self):
  for value in (self.starts_at,self.ends_at):
   if value is not None and (value.tzinfo is None or value.utcoffset() is None):
    raise ValueError("Segment period timestamps must include a timezone")
  if self.starts_at and self.ends_at and self.ends_at<=self.starts_at:
   raise ValueError("ends_at must be after starts_at")
  return self

class RewardCustomerSegmentMemberWrite(BaseModel):
 model_config=ConfigDict(extra="forbid")
 participant_user_id:UUID
 expires_at:datetime|None=None

class RewardCustomerSegmentResponse(BaseModel):
 model_config=ConfigDict(extra="allow")
 id:UUID
 organization_id:UUID
 code:str
 name:str
 description:str|None=None
 status:str
 membership_mode:str
 criteria:dict[str,Any]
 starts_at:datetime|None=None
 ends_at:datetime|None=None
 created_by:UUID
 updated_by:UUID
 created_at:datetime
 updated_at:datetime

class RewardCustomerSegmentEvaluationResponse(BaseModel):
 model_config=ConfigDict(extra="forbid")
 segment_id:UUID
 matched_members:int=Field(ge=0)
 evaluated_members:int=Field(ge=0)

class RewardCustomerSegmentReportResponse(BaseModel):
 model_config=ConfigDict(extra="forbid")
 active_members:int=Field(ge=0)
 inactive_members:int=Field(ge=0)
 removed_members:int=Field(ge=0)
 ledger_entries:int=Field(ge=0)
 earned_points:int
 redeemed_points:int=Field(ge=0)
 expired_points:int=Field(ge=0)
 adjusted_points:int

class RewardCustomerSegmentMemberResponse(BaseModel):
 model_config=ConfigDict(extra="allow")
 id:UUID
 organization_id:UUID
 segment_id:UUID
 participant_user_id:UUID
 membership_source:str
 status:str
 matched_criteria:dict[str,Any]
 joined_at:datetime
 expires_at:datetime|None=None
 updated_at:datetime
