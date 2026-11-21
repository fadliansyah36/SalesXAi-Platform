from datetime import datetime
from typing import Literal
from uuid import UUID
from pydantic import BaseModel, ConfigDict, Field, model_validator

class LocationSessionStart(BaseModel):
    model_config = ConfigDict(extra="forbid")
    device_id: str = Field(min_length=8, max_length=180)
    consent_policy_version: str = Field(min_length=1, max_length=80)
    shift_id: UUID | None = None

class LocationSessionAction(BaseModel):
    model_config = ConfigDict(extra="forbid")
    action: Literal["pause", "resume", "stop", "revoke"]
    reason: str | None = Field(default=None, max_length=500)

class LocationPointWrite(BaseModel):
    model_config = ConfigDict(extra="forbid")
    client_point_id: str = Field(min_length=8, max_length=180)
    recorded_at: datetime
    latitude: float = Field(ge=-90, le=90)
    longitude: float = Field(ge=-180, le=180)
    accuracy_m: float = Field(ge=0, le=10000)
    altitude_m: float | None = Field(default=None, ge=-12000, le=100000)
    speed_mps: float | None = Field(default=None, ge=0, le=500)
    heading_deg: float | None = Field(default=None, ge=0, le=360)
    source: Literal["gps", "network", "fused"] = "gps"
    metadata: dict[str, object] = Field(default_factory=dict)

class LocationPointBatch(BaseModel):
    model_config = ConfigDict(extra="forbid")
    points: list[LocationPointWrite] = Field(min_length=1, max_length=500)

class LocationGeofenceWrite(BaseModel):
    model_config = ConfigDict(extra="forbid")
    code: str = Field(min_length=2, max_length=80)
    name: str = Field(min_length=2, max_length=180)
    geofence_type: Literal["outlet", "territory", "custom"]
    outlet_id: UUID | None = None
    territory_id: UUID | None = None
    boundary_geojson: dict[str, object]
    event_types: list[Literal["enter", "exit", "dwell"]] = Field(default_factory=lambda: ["enter", "exit"])
    dwell_seconds: int = Field(default=0, ge=0, le=86400)
    accuracy_limit_m: float = Field(default=100, gt=0, le=10000)

    @model_validator(mode="after")
    def validate_scope(self):
        if self.geofence_type == "outlet" and (self.outlet_id is None or self.territory_id is not None):
            raise ValueError("Outlet geofence requires only outlet_id.")
        if self.geofence_type == "territory" and (self.territory_id is None or self.outlet_id is not None):
            raise ValueError("Territory geofence requires only territory_id.")
        if self.geofence_type == "custom" and (self.outlet_id is not None or self.territory_id is not None):
            raise ValueError("Custom geofence cannot reference outlet or territory.")
        if self.boundary_geojson.get("type") != "Polygon":
            raise ValueError("boundary_geojson must be a GeoJSON Polygon.")
        if not self.event_types:
            raise ValueError("At least one geofence event type is required.")
        return self
