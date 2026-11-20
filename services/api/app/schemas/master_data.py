import json
from datetime import date, datetime
from typing import Any, Literal
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field, field_validator


class MasterDataWrite(BaseModel):
    model_config = ConfigDict(extra="forbid")
    code: str | None = Field(default=None, min_length=1, max_length=60)
    branch_type: Literal["head_office", "branch", "warehouse"] | None = None
    name: str | None = Field(default=None, min_length=2, max_length=180)
    status: Literal["active", "inactive", "archived", "suspended"] | None = None
    branch_id: UUID | None = None
    parent_team_id: UUID | None = None
    parent_territory_id: UUID | None = None
    supervisor_user_id: UUID | None = None
    territory_id: UUID | None = None
    category: str | None = Field(default=None, max_length=80)
    address: str | None = Field(default=None, max_length=500)
    city: str | None = Field(default=None, max_length=120)
    manager_name: str | None = Field(default=None, max_length=160)
    province: str | None = Field(default=None, max_length=120)
    postal_code: str | None = Field(default=None, max_length=20)
    phone: str | None = Field(default=None, max_length=40)
    pic_name: str | None = Field(default=None, max_length=160)
    latitude: float | None = Field(default=None, ge=-90, le=90)
    longitude: float | None = Field(default=None, ge=-180, le=180)
    boundary_geojson: dict[str, Any] | None = None

    @field_validator("boundary_geojson", mode="before")
    @classmethod
    def parse_boundary_geojson(cls, value: Any) -> Any:
        if isinstance(value, str):
            return json.loads(value)
        return value
    user_id: UUID | None = None
    employee_code: str | None = Field(default=None, max_length=60)
    team_id: UUID | None = None
    manager_user_id: UUID | None = None
    effective_from: date | None = None
    effective_until: date | None = None


class OutletAssignmentCreate(BaseModel):
    sales_profile_id: UUID
    note: str | None = Field(default=None, max_length=500)


class MasterDataImportRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")
    idempotency_key: str = Field(min_length=8, max_length=128)
    rows: list[dict[str, Any]] = Field(min_length=1, max_length=1000)


class MasterDataImportRowError(BaseModel):
    row: int
    code: str
    message: str


class MasterDataImportResult(BaseModel):
    batch_id: UUID
    resource: str
    total_rows: int
    imported_rows: int
    failed_rows: int
    errors: list[MasterDataImportRowError]


class MasterDataRecord(BaseModel):
    id: UUID
    organization_id: UUID
    created_at: datetime
    updated_at: datetime


class PlatformOrganizationStatusUpdate(BaseModel):
    model_config = ConfigDict(extra="forbid")
    status: Literal["active", "suspended", "archived"]
