from __future__ import annotations
import json
from decimal import Decimal, ROUND_FLOOR
from uuid import UUID
import asyncpg
from app.errors import APIError
from app.services.smart_reward import smart_reward_service

class SmartRewardApprovalService:
 async def list(self,db:asyncpg.Connection,org:UUID,actor:UUID,page:int,size:int):
  scopes=await db.fetch("""select ura.scope_type,ura.scope_id,r.key role_key from public.organization_memberships m
   join public.user_role_assignments ura on ura.membership_id=m.id
   join public.roles r on r.id=ura.role_id
   join public.role_permissions rp on rp.role_id=ura.role_id and rp.permission_key='smartreward:approval:read'
   where m.organization_id=$1 and m.user_id=$2 and m.status='active' and ura.revoked_at is null
    and ura.starts_at<=now() and (ura.expires_at is null or ura.expires_at>now())""",org,actor)
  if not scopes: raise APIError(403,"reward_approval_read_forbidden","Approval inbox permission is required.")
  role_keys={x["role_key"] for x in scopes}
  tenant_scope=bool(role_keys.intersection({"tenant_owner","company_admin","principal_user"}))
  branch_ids=[x["scope_id"] for x in scopes if x["scope_type"]=="branch" and x["role_key"]=="supervisor"]
  if tenant_scope:
   where="organization_id=$1"; args=[org]
  elif branch_ids and "supervisor" in role_keys:
   where="organization_id=$1 and (requested_by=$2 or participant_user_id in (select user_id from public.organization_memberships where organization_id=$1 and branch_id=any($3::uuid[])))"
   args=[org,actor,branch_ids]
  else:
   where="organization_id=$1 and (requested_by=$2 or participant_user_id=$2)";args=[org,actor]
  total=await db.fetchval("select count(*) from public.reward_approval_requests where "+where,*args)
  rows=await db.fetch("select * from public.reward_approval_requests where "+where+" order by created_at desc limit $"+str(len(args)+1)+" offset $"+str(len(args)+2),*args,size,(page-1)*size)
  return {"items":[dict(x) for x in rows],"page":page,"page_size":size,"total":total}
 async def request(self,db:asyncpg.Connection,org:UUID,actor:UUID,p):
  async with db.transaction():
   actor_roles=await db.fetch("""select r.key from public.organization_memberships m join public.user_role_assignments ura on ura.membership_id=m.id
    join public.roles r on r.id=ura.role_id where m.organization_id=$1 and m.user_id=$2 and m.status='active'
    and ura.revoked_at is null and ura.starts_at<=now() and (ura.expires_at is null or ura.expires_at>now())""",org,actor)
   actor_keys={x["key"] for x in actor_roles}
   if not actor_keys.intersection({"tenant_owner","company_admin","supervisor","principal_user"}) and p.participant_user_id!=actor:
    raise APIError(403,"reward_request_ownership_forbidden","Participants may request points only for their own account.")
   old=await db.fetchrow("select * from public.reward_approval_requests where organization_id=$1 and requested_by=$2 and idempotency_key=$3",org,actor,p.idempotency_key)
   if old:return dict(old)
   membership=await db.fetchrow("select id,branch_id from public.organization_memberships where organization_id=$1 and user_id=$2 and status='active'",org,p.participant_user_id)
   if not membership: raise APIError(422,"reward_participant_not_member","Participant must be an active organization member.")
   program=await db.fetchrow("select * from public.reward_programs where organization_id=$1 and id=$2 and status='active' and starts_at<=now() and ends_at>now()",org,p.program_id)
   if not program: raise APIError(409,"reward_program_inactive","Program is not active.")
   rule=await db.fetchrow("select * from public.reward_incentive_rules where organization_id=$1 and id=$2 and program_id=$3 and status='active' for share",org,p.rule_id,p.program_id)
   if not rule: raise APIError(404,"reward_rule_not_found","Active incentive rule not found.")
   if p.request_type=="manual_earning":
    if rule["event_key"]!="manual.approved" or not rule["requires_approval"] or not p.manual_points:
     raise APIError(422,"manual_reward_approval_invalid","Manual requests require an active manual.approved rule and a positive points request.")
    points=int(p.manual_points);metric=Decimal(str(p.metric_value));source_type="manual";source_id=p.source_id
   else:
    expected={"order.completed":"order","visit.completed":"visit","target.achieved":"target"}.get(rule["event_key"])
    if expected!=p.source_type or not p.source_id: raise APIError(422,"reward_event_mismatch","Source does not match the incentive rule.")
    metric=await smart_reward_service._source_metric(db,org,p.source_type,p.source_id,p.participant_user_id,p.metric_value)
    cfg=rule["rule_config"] or {}
    if metric<Decimal(str(cfg.get("minimum_metric",0))): raise APIError(409,"reward_rule_not_satisfied","Source metric is below rule threshold.")
    points=int(rule["fixed_points"])+int((metric*Decimal(str(rule["points_per_unit"]))).to_integral_value(rounding=ROUND_FLOOR))
    if rule["max_points"] is not None: points=min(points,int(rule["max_points"]))
    if points<=0: raise APIError(409,"reward_points_zero","The incentive rule calculates zero points.")
    source_type=p.source_type;source_id=p.source_id
    if not rule["requires_approval"]: raise APIError(409,"reward_approval_not_required","This rule does not require an approval request.")
   audience=program["audience"] or {};cfg=rule["rule_config"] or {}
   role_rows=await db.fetch("""select r.key from public.user_role_assignments ura join public.roles r on r.id=ura.role_id
    join public.organization_memberships m on m.id=ura.membership_id
    where m.organization_id=$1 and m.user_id=$2 and m.status='active' and ura.revoked_at is null
    and ura.starts_at<=now() and (ura.expires_at is null or ura.expires_at>now())""",org,p.participant_user_id)
   roles={x["key"] for x in role_rows};branch=membership["branch_id"]
   allowed_roles=set(audience.get("roles",[]))|set(cfg.get("eligible_roles",[]))
   allowed_users=set(audience.get("user_ids",[]));allowed_branches=set(audience.get("branch_ids",[]))|set(cfg.get("eligible_branch_ids",[]))
   if allowed_roles and not roles.intersection(allowed_roles): raise APIError(403,"reward_role_ineligible","Participant role is outside the program audience.")
   if allowed_users and str(p.participant_user_id) not in allowed_users: raise APIError(403,"reward_user_ineligible","Participant is outside the program audience.")
   if allowed_branches and (branch is None or str(branch) not in allowed_branches): raise APIError(403,"reward_branch_ineligible","Participant branch is outside the program audience.")
   period_days=int(cfg.get("period_days",30));period_days=max(1,min(period_days,366))
   per_user=cfg.get("max_per_user_per_period")
   if per_user is not None:
    used=await db.fetchval("""select coalesce(sum(points_delta),0) from public.reward_points_ledger where organization_id=$1 and participant_user_id=$2
     and entry_type='earn' and metadata->>'rule_id'=$3 and occurred_at>=now()-make_interval(days=>$4)""",org,p.participant_user_id,str(p.rule_id),period_days)
    if int(used or 0)+points>int(per_user): raise APIError(409,"reward_user_period_limit","Participant incentive limit has been reached.")
   total_limit=cfg.get("max_total_per_period")
   if total_limit is not None:
    used=await db.fetchval("""select coalesce(sum(points_delta),0) from public.reward_points_ledger where organization_id=$1
     and entry_type='earn' and metadata->>'rule_id'=$2 and occurred_at>=now()-make_interval(days=>$3)""",org,str(p.rule_id),period_days)
    if int(used or 0)+points>int(total_limit): raise APIError(409,"reward_program_period_limit","Program incentive limit has been reached.")
   row=await db.fetchrow("""insert into public.reward_approval_requests(organization_id,request_type,participant_user_id,program_id,rule_id,source_type,source_id,points_requested,metric_value,requested_by,idempotency_key,request_reason,metadata)
    values($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13::jsonb) returning *""",org,p.request_type,p.participant_user_id,p.program_id,p.rule_id,source_type,source_id,points,metric,actor,p.idempotency_key,p.reason,json.dumps({"participant_roles":sorted(roles),"branch_id":str(branch) if branch else None}))
   await db.execute("insert into public.reward_approval_history(organization_id,approval_request_id,to_status,actor_user_id,reason) values($1,$2,'pending',$3,$4)",org,row["id"],actor,p.reason)
   await smart_reward_service._audit(db,org,actor,"approval.requested","reward_approval_request",row["id"],p.reason,{"points":points,"request_type":p.request_type})
   return dict(row)
 async def decide(self,db:asyncpg.Connection,org:UUID,actor:UUID,approval_id:UUID,p):
  async with db.transaction():
   row=await db.fetchrow("select * from public.reward_approval_requests where organization_id=$1 and id=$2 for update",org,approval_id)
   if not row: raise APIError(404,"reward_approval_not_found","Approval request not found.")
   if row["status"]!="pending": raise APIError(409,"reward_approval_transition_invalid","Only pending approval requests can be decided.")
   if row["requested_by"]==actor: raise APIError(403,"reward_self_approval_forbidden","A requester cannot approve their own reward request.")
   actor_scopes=await db.fetch("""select ura.scope_type,ura.scope_id,r.key role_key from public.organization_memberships m
    join public.user_role_assignments ura on ura.membership_id=m.id join public.roles r on r.id=ura.role_id
    join public.role_permissions rp on rp.role_id=ura.role_id and rp.permission_key='smartreward:approval:decide'
    where m.organization_id=$1 and m.user_id=$2 and m.status='active' and ura.revoked_at is null
     and ura.starts_at<=now() and (ura.expires_at is null or ura.expires_at>now())""",org,actor)
   keys={x["role_key"] for x in actor_scopes}
   if not keys.intersection({"tenant_owner","company_admin","supervisor","principal_user"}):
    raise APIError(403,"reward_approval_decision_forbidden","Approver role is required.")
   if "supervisor" in keys and not keys.intersection({"tenant_owner","company_admin","principal_user"}):
    allowed={x["scope_id"] for x in actor_scopes if x["scope_type"]=="branch"}
    participant_branch=await db.fetchval("select branch_id from public.organization_memberships where organization_id=$1 and user_id=$2 and status='active'",org,row["participant_user_id"])
    if participant_branch not in allowed: raise APIError(403,"reward_approval_scope_forbidden","Approval request is outside the supervisor branch scope.")
   if p.decision=="approved":
    a,b=await smart_reward_service._account(db,org,row["participant_user_id"]);after=b+int(row["points_requested"])
    ledger=await db.fetchrow("""insert into public.reward_points_ledger(organization_id,account_id,participant_user_id,entry_type,points_delta,balance_before,balance_after,source_type,source_id,reference_type,reference_id,actor_user_id,idempotency_key,reason,metadata)
     values($1,$2,$3,'earn',$4,$5,$6,$7,$8,'reward_approval',$9,$10,$11,$12,$13::jsonb) returning *""",org,a["id"],row["participant_user_id"],row["points_requested"],b,after,row["source_type"] or "manual",row["source_id"] or row["id"],row["id"],actor,"approval:"+str(row["id"]),p.reason, json.dumps({"program_id":str(row["program_id"]),"rule_id":str(row["rule_id"]),"approval_request_id":str(row["id"]),"metric_value":str(row["metric_value"])}))
    await db.execute("update public.reward_accounts set points_balance=$3,updated_at=now() where organization_id=$1 and id=$2",org,a["id"],after)
    ledger_id=ledger["id"]
   else: ledger_id=None
   await db.execute("update public.reward_approval_requests set status=$3,decision_reason=$4,decided_by=$5,decided_at=now(),ledger_entry_id=$6,updated_at=now() where organization_id=$1 and id=$2",org,approval_id,p.decision,p.reason,actor,ledger_id)
   await db.execute("insert into public.reward_approval_history(organization_id,approval_request_id,from_status,to_status,actor_user_id,reason) values($1,$2,'pending',$3,$4,$5)",org,approval_id,p.decision,actor,p.reason)
   await smart_reward_service._audit(db,org,actor,"approval."+p.decision,"reward_approval_request",approval_id,p.reason,{"ledger_entry_id":str(ledger_id) if ledger_id else None})
   return dict(await db.fetchrow("select * from public.reward_approval_requests where organization_id=$1 and id=$2",org,approval_id))
smart_reward_approval_service=SmartRewardApprovalService()
