from __future__ import annotations
import json
from uuid import UUID
import asyncpg
from app.errors import APIError
from app.repositories.smart_reward import SmartRewardRepository

class SmartRewardSegmentService:
 async def _audit(self,db,org,actor,action,kind,rid,reason=None,meta=None):
  await db.execute("""insert into public.reward_audit_events
   (organization_id,actor_user_id,action,resource_type,resource_id,reason,metadata)
   values($1,$2,$3,$4,$5,$6,$7::jsonb)""",org,actor,action,kind,rid,reason,json.dumps(meta or {}))
 async def _get(self,db,org,sid,lock=False):
  suffix=" for update" if lock else ""
  row=await db.fetchrow("select * from public.reward_customer_segments where organization_id=$1 and id=$2"+suffix,org,sid)
  if not row: raise APIError(404,"reward_customer_segment_not_found","Customer segment not found in this organization.")
  return row
 async def list(self,db,org,page,size,status=None):
  total=await db.fetchval("select count(*) from public.reward_customer_segments where organization_id=$1 and ($2::text is null or status=$2)",org,status)
  rows=await db.fetch("""select s.*,
   (select count(*) from public.reward_customer_segment_members m where m.organization_id=s.organization_id and m.segment_id=s.id and m.status='active' and (m.expires_at is null or m.expires_at>now())) member_count
   from public.reward_customer_segments s where s.organization_id=$1 and ($2::text is null or s.status=$2)
   order by s.created_at desc limit $3 offset $4""",org,status,size,(page-1)*size)
  return {"items":[dict(x) for x in rows],"page":page,"page_size":size,"total":int(total or 0)}
 async def create(self,db,org,actor,p):
  try:
   row=await db.fetchrow("""insert into public.reward_customer_segments
    (organization_id,code,name,description,status,membership_mode,criteria,starts_at,ends_at,created_by,updated_by)
    values($1,$2,$3,$4,$5,$6,$7::jsonb,$8,$9,$10,$10) returning *""",
    org,p.code.upper(),p.name,p.description,p.status,p.membership_mode,
    json.dumps(p.criteria.model_dump(mode="json")),p.starts_at,p.ends_at,actor)
  except asyncpg.UniqueViolationError as exc:
   raise APIError(409,"reward_customer_segment_code_conflict","A segment with this code already exists.") from exc
  await self._audit(db,org,actor,"customer_segment.created","reward_customer_segment",row["id"])
  return dict(row)
 async def update(self,db,org,actor,sid,p):
  await self._get(db,org,sid)
  row=await db.fetchrow("""update public.reward_customer_segments set
   code=$3,name=$4,description=$5,status=$6,membership_mode=$7,criteria=$8::jsonb,
   starts_at=$9,ends_at=$10,updated_by=$11,updated_at=now()
   where organization_id=$1 and id=$2 returning *""",org,sid,p.code.upper(),p.name,p.description,
   p.status,p.membership_mode,json.dumps(p.criteria.model_dump(mode="json")),p.starts_at,p.ends_at,actor)
  await self._audit(db,org,actor,"customer_segment.updated","reward_customer_segment",sid)
  return dict(row)
 async def members(self,db,org,sid,page,size):
  await self._get(db,org,sid)
  total=await db.fetchval("select count(*) from public.reward_customer_segment_members where organization_id=$1 and segment_id=$2",org,sid)
  rows=await db.fetch("""select * from public.reward_customer_segment_members
   where organization_id=$1 and segment_id=$2 order by joined_at desc limit $3 offset $4""",org,sid,size,(page-1)*size)
  return {"items":[dict(x) for x in rows],"page":page,"page_size":size,"total":int(total or 0)}
 async def add_member(self,db,org,actor,sid,p):
  async with db.transaction():
   segment=await self._get(db,org,sid,True)
   if segment["status"]!="active": raise APIError(409,"reward_customer_segment_inactive","Only active segments accept membership changes.")
   if segment["membership_mode"]=="rule_based": raise APIError(409,"reward_customer_segment_rule_based","Rule-based segments are managed by evaluation, not manual membership.")
   active=await db.fetchval("select exists(select 1 from public.organization_memberships where organization_id=$1 and user_id=$2 and status='active')",org,p.participant_user_id)
   if not active: raise APIError(422,"reward_segment_participant_not_member","Participant must be an active member of this organization.")
   row=await db.fetchrow("""insert into public.reward_customer_segment_members
    (organization_id,segment_id,participant_user_id,membership_source,status,matched_criteria,expires_at)
    values($1,$2,$3,'manual','active','{}'::jsonb,$4)
    on conflict(organization_id,segment_id,participant_user_id) do update
    set membership_source='manual',status='active',expires_at=excluded.expires_at,updated_at=now()
    returning *""",org,sid,p.participant_user_id,p.expires_at)
   await self._audit(db,org,actor,"customer_segment.member_added","reward_customer_segment_member",row["id"])
   return dict(row)
 async def remove_member(self,db,org,actor,sid,uid):
  await self._get(db,org,sid)
  row=await db.fetchrow("""update public.reward_customer_segment_members set status='removed',updated_at=now()
   where organization_id=$1 and segment_id=$2 and participant_user_id=$3 returning *""",org,sid,uid)
  if not row: raise APIError(404,"reward_customer_segment_member_not_found","Segment membership not found.")
  await self._audit(db,org,actor,"customer_segment.member_removed","reward_customer_segment_member",row["id"])
  return dict(row)
 async def evaluate(self,db,org,actor,sid):
  async with db.transaction():
   segment=await self._get(db,org,sid,True)
   if segment["status"]!="active": raise APIError(409,"reward_customer_segment_inactive","Only active segments can be evaluated.")
   if segment["membership_mode"]=="manual": raise APIError(409,"reward_customer_segment_manual_only","Manual segments cannot be rule-evaluated.")
   criteria=segment["criteria"] or {}
   rows=await db.fetch("""select m.user_id participant_user_id,m.branch_id,
    coalesce(a.points_balance,0)::bigint points_balance
    from public.organization_memberships m
    left join public.reward_accounts a on a.organization_id=m.organization_id and a.participant_user_id=m.user_id and a.status='active'
    where m.organization_id=$1 and m.status='active'""",org)
   role_rows=await db.fetch("""select m.user_id participant_user_id,r.key role_key
    from public.organization_memberships m join public.user_role_assignments ura on ura.membership_id=m.id
    join public.roles r on r.id=ura.role_id
    where m.organization_id=$1 and m.status='active' and ura.revoked_at is null
     and ura.starts_at<=now() and (ura.expires_at is null or ura.expires_at>now())""",org)
   roles={}
   for item in role_rows: roles.setdefault(item["participant_user_id"],set()).add(item["role_key"])
   allowed_roles=set(criteria.get("roles") or [])
   allowed_branches={str(x) for x in criteria.get("branch_ids") or []}
   allowed_users={str(x) for x in criteria.get("user_ids") or []}
   minimum=int(criteria.get("minimum_points_balance") or 0)
   matched=0
   matched_user_ids=[]
   for member in rows:
    uid=member["participant_user_id"]
    if allowed_roles and not roles.get(uid,set()).intersection(allowed_roles): continue
    if allowed_branches and (member["branch_id"] is None or str(member["branch_id"]) not in allowed_branches): continue
    if allowed_users and str(uid) not in allowed_users: continue
    if int(member["points_balance"])<minimum: continue
    await db.execute("""insert into public.reward_customer_segment_members
     (organization_id,segment_id,participant_user_id,membership_source,status,matched_criteria)
     values($1,$2,$3,'rule','active',$4::jsonb)
     on conflict(organization_id,segment_id,participant_user_id) do update
     set membership_source='rule',status='active',matched_criteria=excluded.matched_criteria,updated_at=now()""",
     org,sid,uid,json.dumps({"roles":sorted(roles.get(uid,set()).intersection(allowed_roles)) if allowed_roles else [],
      "branch_id":str(member["branch_id"]) if member["branch_id"] else None,
      "points_balance":int(member["points_balance"])}))
    matched+=1
    matched_user_ids.append(uid)
   await db.execute("""update public.reward_customer_segment_members set status='inactive',updated_at=now()
    where organization_id=$1 and segment_id=$2 and membership_source='rule' and status='active'
    and not (participant_user_id=any($3::uuid[]))""",org,sid,matched_user_ids)
   await self._audit(db,org,actor,"customer_segment.evaluated","reward_customer_segment",sid,
    meta={"matched_members":matched})
   return {"segment_id":sid,"matched_members":matched,"evaluated_members":len(rows)}
smart_reward_segment_service=SmartRewardSegmentService()
