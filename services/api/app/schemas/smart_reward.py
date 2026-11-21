from decimal import Decimal
from typing import Any, Literal
from uuid import UUID
from pydantic import BaseModel, ConfigDict, Field, model_validator

class RewardProgramWrite(BaseModel):
 model_config=ConfigDict(extra="forbid")
 code:str=Field(min_length=2,max_length=60); name:str=Field(min_length=2,max_length=180)
 description:str|None=None; program_type:Literal["loyalty","incentive","campaign"]="loyalty"
 reward_type:Literal["points","tier","voucher"]="points"; starts_at:str; ends_at:str
 status:Literal["draft","active","paused","completed","archived"]="draft"
 audience:dict[str,Any]=Field(default_factory=dict); configuration:dict[str,Any]=Field(default_factory=dict)
 @model_validator(mode="after")
 def validate_period(self):
  from datetime import datetime
  a=datetime.fromisoformat(self.starts_at.replace("Z","+00:00")); b=datetime.fromisoformat(self.ends_at.replace("Z","+00:00"))
  if a.tzinfo is None or b.tzinfo is None or b<=a: raise ValueError("Timezone-aware period with ends_at after starts_at is required")
  return self

class RewardRuleWrite(BaseModel):
 model_config=ConfigDict(extra="forbid")
 code:str=Field(min_length=2,max_length=60); name:str=Field(min_length=2,max_length=180)
 event_key:Literal["order.completed","visit.completed","target.achieved","manual.approved"]
 priority:int=Field(default=100,ge=0,le=10000); rule_config:dict[str,Any]=Field(default_factory=dict)
 points_per_unit:Decimal=Field(default=Decimal(0),ge=0,max_digits=18,decimal_places=4)
 fixed_points:int=Field(default=0,ge=0,le=1000000000); max_points:int|None=Field(default=None,ge=0)
 requires_approval:bool=False; status:Literal["active","inactive","archived"]="active"

class RewardCatalogWrite(BaseModel):
 model_config=ConfigDict(extra="forbid")
 program_id:UUID|None=None; code:str=Field(min_length=2,max_length=60); name:str=Field(min_length=2,max_length=180)
 description:str|None=None; category:str=Field(min_length=2,max_length=80); points_cost:int=Field(gt=0,le=1000000000)
 quantity_total:int|None=Field(default=None,ge=0); starts_at:str|None=None; ends_at:str|None=None
 eligibility:dict[str,Any]=Field(default_factory=dict); metadata:dict[str,Any]=Field(default_factory=dict)
 status:Literal["draft","active","paused","out_of_stock","archived"]="draft"

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
