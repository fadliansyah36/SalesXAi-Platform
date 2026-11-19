from datetime import date,datetime
from typing import Any,Literal
from uuid import UUID
from pydantic import BaseModel,Field,ConfigDict

class MasterDataWrite(BaseModel):
 model_config=ConfigDict(extra="forbid")
 code:str|None=Field(default=None,min_length=1,max_length=60)
 name:str|None=Field(default=None,min_length=2,max_length=180)
 status:Literal["active","inactive","archived","suspended"]|None=None
 branch_id:UUID|None=None
 parent_team_id:UUID|None=None
 parent_territory_id:UUID|None=None
 supervisor_user_id:UUID|None=None
 territory_id:UUID|None=None
 category:str|None=Field(default=None,max_length=80)
 address:str|None=Field(default=None,max_length=500)
 city:str|None=Field(default=None,max_length=120)
 province:str|None=Field(default=None,max_length=120)
 postal_code:str|None=Field(default=None,max_length=20)
 phone:str|None=Field(default=None,max_length=40)
 pic_name:str|None=Field(default=None,max_length=160)
 latitude:float|None=Field(default=None,ge=-90,le=90)
 longitude:float|None=Field(default=None,ge=-180,le=180)
 boundary_geojson:dict[str,Any]|None=None
 user_id:UUID|None=None
 employee_code:str|None=Field(default=None,max_length=60)
 team_id:UUID|None=None
 manager_user_id:UUID|None=None
 effective_from:date|None=None
 effective_until:date|None=None

class OutletAssignmentCreate(BaseModel):
 sales_profile_id:UUID
 note:str|None=Field(default=None,max_length=500)

class MasterDataRecord(BaseModel):
 id:UUID
 organization_id:UUID
 created_at:datetime
 updated_at:datetime
