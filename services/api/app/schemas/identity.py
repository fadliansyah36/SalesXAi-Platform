from datetime import datetime
from typing import Literal
from uuid import UUID
from pydantic import BaseModel, Field

class ProfileResponse(BaseModel):
    id: UUID
    email: str | None
    display_name: str | None
    status: str

class MembershipResponse(BaseModel):
    id: UUID
    organization_id: UUID
    organization_name: str
    status: str
    branch_id: UUID | None
    roles: list[str] = Field(default_factory=list)
    permissions: list[str] = Field(default_factory=list)

class AuthContextResponse(BaseModel):
    user: ProfileResponse
    session_id: UUID
    memberships: list[MembershipResponse]

class SessionRegistration(BaseModel):
    device_id: str | None = Field(default=None,max_length=160)
    device_name: str | None = Field(default=None,max_length=160)
    platform: Literal["web","android","ios","unknown"] = "unknown"
    user_agent: str | None = Field(default=None,max_length=512)

class OrganizationCreate(BaseModel):
    name: str = Field(min_length=2,max_length=160)
    slug: str = Field(pattern=r"^[a-z0-9][a-z0-9-]{1,61}[a-z0-9]$",min_length=3,max_length=63)
    legal_name: str | None = Field(default=None,max_length=200)

class OrganizationResponse(BaseModel):
    id: UUID
    slug: str
    name: str
    status: str
    created_at: datetime

class MemberCreate(BaseModel):
    user_id: UUID
    title: str | None = Field(default=None,max_length=120)

class MemberStatusUpdate(BaseModel):
    status: Literal["active","suspended","removed"]

class RoleAssignmentCreate(BaseModel):
    role_key: str = Field(min_length=2,max_length=80)
    branch_id: UUID | None = None
