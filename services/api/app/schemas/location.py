from datetime import datetime
from typing import Literal
from uuid import UUID
from pydantic import BaseModel, ConfigDict, Field

class LocationSessionStart(BaseModel):
    model_config = ConfigDict(extra='forbid')
    device_id: str = Field(min_length=8, max_length=180)
    consent_policy_version: str = Field(min_length=1, max_length=80)
    shift_id: UUID | None = None

class LocationSessionAction(BaseModel):
    model_config = ConfigDict(extra='forbid')
    action: Literal['pause', 'resume', 'stop', 'revoke']
    reason: str | None = Field(default=None, max_length=500)

class LocationPointWrite(BaseModel):
    model_config = ConfigDict(extra='forbid')
    client_point_id: str = Field(min_length=8, max_length=180)
    recorded_at: datetime
    latitude: float = Field(ge=-90, le=90)
    longitude: float = Field(ge=-180, le=180)
    accuracy_m: float = Field(ge=0, le=10000)
    altitude_m: float | None = Field(default=None, ge=-12000, le=100000)
    speed_mps: float | None = Field(default=None, ge=0, le=500)
    heading_deg: float | None = Field(default=None, ge=0, le=360)
    source: Literal['gps', 'network', 'fused'] = 'gps'
    metadata: dict[str, object] = Field(default_factory=dict)

class LocationPointBatch(BaseModel):
    model_config = ConfigDict(extra='forbid')
    points: list[LocationPointWrite] = Field(min_length=1, max_length=500)
