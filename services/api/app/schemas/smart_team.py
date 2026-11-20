from datetime import date, datetime
from decimal import Decimal
from typing import Literal
from uuid import UUID
from pydantic import BaseModel, ConfigDict, Field, model_validator


class LocationCapture(BaseModel):
    latitude: float = Field(ge=-90, le=90)
    longitude: float = Field(ge=-180, le=180)
    accuracy_m: float = Field(ge=0, le=10000)
    source: Literal["gps", "network", "fused", "manual"] = "gps"
    captured_at: datetime | None = None


class VisitCreate(BaseModel):
    sales_profile_id: UUID
    outlet_id: UUID
    scheduled_at: datetime
    window_end_at: datetime | None = None
    notes: str | None = Field(default=None, max_length=4000)
    idempotency_key: str = Field(min_length=8, max_length=128)

    @model_validator(mode="after")
    def validate_window(self):
        if self.window_end_at and self.window_end_at < self.scheduled_at:
            raise ValueError("window_end_at must not precede scheduled_at")
        return self


class VisitUpdate(BaseModel):
    scheduled_at: datetime | None = None
    window_end_at: datetime | None = None
    notes: str | None = Field(default=None, max_length=4000)
    outcome: (
        Literal["productive", "not_productive", "order_taken", "follow_up", "closed", "no_contact"]
        | None
    ) = None


class VisitCancel(BaseModel):
    reason: str = Field(min_length=3, max_length=500)


class VisitExecution(BaseModel):
    location: LocationCapture
    idempotency_key: str = Field(min_length=8, max_length=128)
    notes: str | None = Field(default=None, max_length=4000)
    outcome: (
        Literal["productive", "not_productive", "order_taken", "follow_up", "closed", "no_contact"]
        | None
    ) = None


class ClockInRequest(BaseModel):
    location: LocationCapture
    idempotency_key: str = Field(min_length=8, max_length=128)


class ClockOutRequest(BaseModel):
    location: LocationCapture
    idempotency_key: str = Field(min_length=8, max_length=128)


class AttendanceCorrection(BaseModel):
    clock_in_at: datetime | None = None
    clock_out_at: datetime | None = None
    reason: str = Field(min_length=5, max_length=500)

    @model_validator(mode="after")
    def validate_time_range(self):
        if self.clock_in_at is not None and self.clock_out_at is not None and self.clock_out_at < self.clock_in_at:
            raise ValueError("clock_out_at must not precede clock_in_at")
        return self


class ActivityCreate(BaseModel):
    sales_profile_id: UUID
    visit_id: UUID | None = None
    activity_type: Literal["call", "meeting", "follow_up", "prospecting", "report", "other"]
    title: str = Field(min_length=2, max_length=180)
    description: str | None = Field(default=None, max_length=4000)
    due_at: datetime | None = None
    idempotency_key: str = Field(min_length=8, max_length=128)


class ActivityUpdate(BaseModel):
    title: str | None = Field(default=None, min_length=2, max_length=180)
    description: str | None = Field(default=None, max_length=4000)
    due_at: datetime | None = None
    status: Literal["open", "in_progress", "completed", "cancelled"] | None = None


class TargetWrite(BaseModel):
    sales_profile_id: UUID | None = None
    team_id: UUID | None = None
    branch_id: UUID | None = None
    metric_key: Literal["visits", "productive_visits", "activities", "orders", "sales_value"]
    period_start: date
    period_end: date
    target_value: Decimal = Field(ge=0, max_digits=18, decimal_places=2)

    @model_validator(mode="after")
    def validate_scope_and_period(self):
        if (
            sum(
                value is not None for value in (self.sales_profile_id, self.team_id, self.branch_id)
            )
            != 1
        ):
            raise ValueError("Exactly one target scope is required")
        if self.period_end < self.period_start:
            raise ValueError("period_end must not precede period_start")
        return self


class SmartTeamList(BaseModel):
    model_config = ConfigDict(extra="allow")


class TargetUpdate(BaseModel):
    period_start: date | None = None
    period_end: date | None = None
    target_value: Decimal | None = Field(default=None, ge=0, max_digits=18, decimal_places=2)

    @model_validator(mode="after")
    def validate_period(self):
        if (
            self.period_start is not None
            and self.period_end is not None
            and self.period_end < self.period_start
        ):
            raise ValueError("period_end must not precede period_start")
        return self
