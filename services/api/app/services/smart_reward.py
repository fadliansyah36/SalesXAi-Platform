from __future__ import annotations
import asyncpg
import json
from decimal import Decimal, ROUND_FLOOR
from app.repositories.smart_reward import SmartRewardRepository
from app.errors import APIError

class SmartRewardService:
 def _tenant(self,org,tenant):
  if tenant.organization_id!=org: raise APIError(403,"tenant_scope_mismatch","Reward access is restricted to the active organization.")
 async def _audit(self,db:SmartRewardRepository,org,actor,action,kind,rid,reason=None,meta=None):
  await db.execute("insert into public.reward_audit_events(organization_id,actor_user_id,action,resource_type,resource_id,reason,metadata) values($1,$2,$3,$4,$5,$6,$7::jsonb)",org,actor,action,kind,rid,reason,json.dumps(meta or {}))
 async def _account(self,db:SmartRewardRepository,org,user):
  await db.fetchval("select public.process_reward_expirations(250)")
  if not await db.fetchval("select exists(select 1 from public.organization_memberships where organization_id=$1 and user_id=$2 and status='active')",org,user):
   raise APIError(422,"reward_participant_not_member","Participant must be an active organization member.")
  await db.execute("insert into public.reward_accounts(organization_id,participant_user_id) values($1,$2) on conflict do nothing",org,user)
  a=await db.fetchrow("select * from public.reward_accounts where organization_id=$1 and participant_user_id=$2 for update",org,user)
  if a["status"]!="active": raise APIError(409,"reward_account_inactive","Reward account is inactive.")
  bal=int(await db.fetchval("select coalesce(sum(points_delta),0)::bigint from public.reward_points_ledger where organization_id=$1 and account_id=$2",org,a["id"]))
  if bal<0: raise APIError(500,"reward_ledger_integrity_error","Ledger balance cannot be negative.")
  if int(a["points_balance"])!=bal: await db.execute("update public.reward_accounts set points_balance=$3,updated_at=now() where organization_id=$1 and id=$2",org,a["id"],bal)
  return a,bal
 async def programs(self,db:SmartRewardRepository,org,page,size):
  total=await db.fetchval("select count(*) from public.reward_programs where organization_id=$1",org)
  rows=await db.fetch("select * from public.reward_programs where organization_id=$1 order by created_at desc limit $2 offset $3",org,size,(page-1)*size)
  return {"items":[dict(r) for r in rows],"page":page,"page_size":size,"total":total}
 async def create_program(self,db:SmartRewardRepository,org,actor,p):
  try:
   r=await db.fetchrow("""insert into public.reward_programs(organization_id,code,name,description,program_type,reward_type,starts_at,ends_at,status,audience,configuration,created_by,updated_by)
    values($1,$2,$3,$4,$5,$6,$7::timestamptz,$8::timestamptz,$9,$10::jsonb,$11::jsonb,$12,$12) returning *""",org,p.code.upper(),p.name,p.description,p.program_type,p.reward_type,p.starts_at,p.ends_at,p.status,json.dumps(p.audience),json.dumps(p.configuration),actor)
  except asyncpg.UniqueViolationError as e: raise APIError(409,"reward_program_code_conflict","Program code already exists.") from e
  await self._audit(db,org,actor,"program.created","reward_program",r["id"]); return dict(r)
 async def update_program(self,db:SmartRewardRepository,org,actor,pid,p):
  r=await db.fetchrow("""update public.reward_programs set code=$3,name=$4,description=$5,program_type=$6,reward_type=$7,starts_at=$8::timestamptz,ends_at=$9::timestamptz,status=$10,audience=$11::jsonb,configuration=$12::jsonb,updated_by=$13,updated_at=now() where organization_id=$1 and id=$2 returning *""",org,pid,p.code.upper(),p.name,p.description,p.program_type,p.reward_type,p.starts_at,p.ends_at,p.status,json.dumps(p.audience),json.dumps(p.configuration),actor)
  if not r: raise APIError(404,"reward_program_not_found","Program not found.")
  await self._audit(db,org,actor,"program.updated","reward_program",pid); return dict(r)
 async def rules(self,db:SmartRewardRepository,org,pid):
  return [dict(r) for r in await db.fetch("select * from public.reward_incentive_rules where organization_id=$1 and ($2::uuid is null or program_id=$2) order by priority,created_at",org,pid)]
 async def create_rule(self,db:SmartRewardRepository,org,actor,p,pid):
  r=await db.fetchrow("""insert into public.reward_incentive_rules(organization_id,program_id,code,name,event_key,priority,rule_config,points_per_unit,fixed_points,max_points,requires_approval,status,created_by,updated_by)
   values($1,$2,$3,$4,$5,$6,$7::jsonb,$8,$9,$10,$11,$12,$13,$13) returning *""",org,pid,p.code.upper(),p.name,p.event_key,p.priority,json.dumps(p.rule_config),p.points_per_unit,p.fixed_points,p.max_points,p.requires_approval,p.status,actor)
  await self._audit(db,org,actor,"rule.created","reward_incentive_rule",r["id"]); return dict(r)
 async def update_rule(self,db:SmartRewardRepository,org,actor,rid,p):
  r=await db.fetchrow("""update public.reward_incentive_rules set code=$3,name=$4,event_key=$5,priority=$6,rule_config=$7::jsonb,points_per_unit=$8,fixed_points=$9,max_points=$10,requires_approval=$11,status=$12,updated_by=$13,updated_at=now() where organization_id=$1 and id=$2 returning *""",org,rid,p.code.upper(),p.name,p.event_key,p.priority,json.dumps(p.rule_config),p.points_per_unit,p.fixed_points,p.max_points,p.requires_approval,p.status,actor)
  if not r: raise APIError(404,"reward_rule_not_found","Rule not found.")
  await self._audit(db,org,actor,"rule.updated","reward_incentive_rule",rid); return dict(r)
 async def catalog(self,db:SmartRewardRepository,org,page,size,category,actor):
  async with db.transaction():
   member=await db.fetchrow("select branch_id from public.organization_memberships where organization_id=$1 and user_id=$2 and status='active'",org,actor)
   role_rows=await db.fetch("""select r.key from public.user_role_assignments ura join public.roles r on r.id=ura.role_id
    join public.organization_memberships m on m.id=ura.membership_id where m.organization_id=$1 and m.user_id=$2
     and m.status='active' and ura.revoked_at is null and ura.starts_at<=now() and (ura.expires_at is null or ura.expires_at>now())""",org,actor)
   role_keys={x["key"] for x in role_rows}
   account=await db.fetchrow("select id from public.reward_accounts where organization_id=$1 and participant_user_id=$2",org,actor) if member else None
   balance=0
   if account:
    _,balance=await self._account(db,org,actor)
   total=await db.fetchval("select count(*) from public.reward_catalog_items where organization_id=$1 and ($2::text is null or category=$2)",org,category)
   rows=await db.fetch("select *,now() db_now from public.reward_catalog_items where organization_id=$1 and ($2::text is null or category=$2) order by created_at desc limit $3 offset $4",org,category,size,(page-1)*size)
   items=[]
   for row in rows:
    item=dict(row);elig=item.get("eligibility") or {};program_audience={}
    reason=None
    if not member: reason="membership_required"
    elif item["status"]!="active": reason="catalog_inactive"
    elif item["starts_at"] is not None and item["starts_at"]>item["db_now"]: reason="catalog_not_started"
    elif item["ends_at"] is not None and item["ends_at"]<=item["db_now"]: reason="catalog_expired"
    available=None if item["quantity_total"] is None else max(0,int(item["quantity_total"])-int(item["quantity_reserved"])-int(item["quantity_fulfilled"]))
    if reason is None and available is not None and available<=0: reason="out_of_stock"
    if reason is None and item["program_id"] is not None:
     program=await db.fetchrow("select audience,status,starts_at,ends_at,now() db_now from public.reward_programs where organization_id=$1 and id=$2",org,item["program_id"])
     if not program or program["status"]!="active" or program["starts_at"]>program["db_now"] or program["ends_at"]<=program["db_now"]:
      reason="reward_program_inactive"
     else: program_audience=program["audience"] or {}
    allowed_roles=set(elig.get("roles",[]))|set(program_audience.get("roles",[]))
    allowed_branches=set(elig.get("branch_ids",[]))|set(program_audience.get("branch_ids",[]))
    allowed_users=set(elig.get("user_ids",[]))|set(program_audience.get("user_ids",[]))
    if reason is None and allowed_roles and not role_keys.intersection(allowed_roles): reason="role_ineligible"
    if reason is None and allowed_branches and (member["branch_id"] is None or str(member["branch_id"]) not in allowed_branches): reason="branch_ineligible"
    if reason is None and allowed_users and str(actor) not in allowed_users: reason="participant_ineligible"
    if reason is None and int(elig.get("minimum_balance",0))>balance: reason="insufficient_minimum_balance"
    period_days=max(1,min(int(elig.get("period_days",30)),366))
    period_remaining=None
    if elig.get("max_per_user_per_period") is not None:
     used=int(await db.fetchval("""select coalesce(sum(quantity),0) from public.reward_redemptions
      where organization_id=$1 and participant_user_id=$2 and catalog_item_id=$3 and status not in ('rejected','cancelled')
       and requested_at>=now()-make_interval(days=>$4)""",org,actor,item["id"],period_days) or 0)
     period_remaining=max(0,int(elig["max_per_user_per_period"])-used)
     if reason is None and period_remaining<=0: reason="participant_period_limit"
    if elig.get("max_total_per_period") is not None:
     used_total=int(await db.fetchval("""select coalesce(sum(quantity),0) from public.reward_redemptions
      where organization_id=$1 and catalog_item_id=$2 and status not in ('rejected','cancelled')
       and requested_at>=now()-make_interval(days=>$3)""",org,item["id"],period_days) or 0)
     if reason is None and used_total>=int(elig["max_total_per_period"]): reason="catalog_period_limit"
    if reason is None and balance<int(item["points_cost"]): reason="insufficient_points"
    item.pop("db_now",None);item.update({"eligible":reason is None,"eligibility_reason":reason,
     "available_stock":available,"points_balance":balance,"period_remaining":period_remaining})
    items.append(item)
   return {"items":items,"page":page,"page_size":size,"total":total}
 async def create_catalog_item(self,db:SmartRewardRepository,org,actor,p):
  r=await db.fetchrow("""insert into public.reward_catalog_items(organization_id,program_id,code,name,description,category,points_cost,quantity_total,starts_at,ends_at,eligibility,metadata,status,created_by,updated_by)
   values($1,$2,$3,$4,$5,$6,$7,$8,$9::timestamptz,$10::timestamptz,$11::jsonb,$12::jsonb,$13,$14,$14) returning *""",org,p.program_id,p.code.upper(),p.name,p.description,p.category,p.points_cost,p.quantity_total,p.starts_at,p.ends_at,json.dumps(p.eligibility),json.dumps(p.metadata),p.status,actor)
  await self._audit(db,org,actor,"catalog.created","reward_catalog_item",r["id"]); return dict(r)
 async def update_catalog_item(self,db:SmartRewardRepository,org,actor,iid,p):
  r=await db.fetchrow("""update public.reward_catalog_items set program_id=$3,code=$4,name=$5,description=$6,category=$7,points_cost=$8,quantity_total=$9,starts_at=$10::timestamptz,ends_at=$11::timestamptz,eligibility=$12::jsonb,metadata=$13::jsonb,status=$14,updated_by=$15,updated_at=now() where organization_id=$1 and id=$2 and (quantity_total is null or quantity_total>=quantity_reserved+quantity_fulfilled) returning *""",org,iid,p.program_id,p.code.upper(),p.name,p.description,p.category,p.points_cost,p.quantity_total,p.starts_at,p.ends_at,json.dumps(p.eligibility),json.dumps(p.metadata),p.status,actor)
  if not r: raise APIError(404,"reward_catalog_item_not_found","Item not found or committed stock would be violated.")
  await self._audit(db,org,actor,"catalog.updated","reward_catalog_item",iid); return dict(r)
 async def balance(self,db:SmartRewardRepository,org,user):
  a,b=await self._account(db,org,user)
  expiry=await db.fetchrow("select min(expires_at) next_expiration_at,coalesce(sum(points_remaining) filter(where expires_at<=now()+interval '30 days'),0)::bigint expiring_points_30d from public.reward_point_lots where organization_id=$1 and account_id=$2 and points_remaining>0",org,a["id"])
  return {"account_id":str(a["id"]),"organization_id":str(org),"participant_user_id":str(user),"points_balance":b,"next_expiration_at":expiry["next_expiration_at"],"expiring_points_30d":int(expiry["expiring_points_30d"])}
 async def progress(self,db:SmartRewardRepository,org,user):
  async with db.transaction():
   await self._account(db,org,user)
   membership=await db.fetchrow("select branch_id from public.organization_memberships where organization_id=$1 and user_id=$2 and status='active'",org,user)
   if not membership: raise APIError(403,"reward_participant_not_member","Active organization membership is required.")
   role_rows=await db.fetch("""select r.key from public.user_role_assignments ura
    join public.roles r on r.id=ura.role_id join public.organization_memberships m on m.id=ura.membership_id
    where m.organization_id=$1 and m.user_id=$2 and m.status='active' and ura.revoked_at is null
     and ura.starts_at<=now() and (ura.expires_at is null or ura.expires_at>now())""",org,user)
   role_keys={x["key"] for x in role_rows}
   rules=await db.fetch("""select p.id program_id,p.name program_name,p.audience,r.id rule_id,r.name rule_name,
    r.event_key,r.rule_config,r.max_points,r.requires_approval
    from public.reward_programs p join public.reward_incentive_rules r
     on r.organization_id=p.organization_id and r.program_id=p.id
    where p.organization_id=$1 and p.status='active' and p.starts_at<=now() and p.ends_at>now()
     and r.status='active' order by p.name,r.priority,r.name""",org)
   items=[]
   for rule in rules:
    audience=rule["audience"] or {};cfg=rule["rule_config"] or {}
    allowed_roles=set(audience.get("roles",[]))|set(cfg.get("eligible_roles",[]))
    allowed_users=set(audience.get("user_ids",[]))
    allowed_branches=set(audience.get("branch_ids",[]))|set(cfg.get("eligible_branch_ids",[]))
    if allowed_roles and not role_keys.intersection(allowed_roles): continue
    if allowed_users and str(user) not in allowed_users: continue
    if allowed_branches and (membership["branch_id"] is None or str(membership["branch_id"]) not in allowed_branches): continue
    period_days=max(1,min(int(cfg.get("period_days",30)),366))
    totals=await db.fetchrow("""select
     coalesce(sum(case when l.entry_type='earn' then l.points_delta
      when l.entry_type='reversal' and original.metadata->>'rule_id'=$3 and original.occurred_at>=now()-make_interval(days=>$4) then l.points_delta else 0 end),0)::bigint points_earned,
     coalesce(sum(case when l.entry_type='earn' and l.metadata->>'rule_id'=$3
       then coalesce(nullif(l.metadata->>'metric','')::numeric,0)
      when l.entry_type='reversal' and original.metadata->>'rule_id'=$3 and original.occurred_at>=now()-make_interval(days=>$4)
       then -coalesce(nullif(original.metadata->>'metric','')::numeric,0) else 0 end),0) metric_achieved
     from public.reward_points_ledger l left join public.reward_points_ledger original on original.id=l.reversal_of
     where l.organization_id=$1 and l.participant_user_id=$2
      and l.occurred_at>=now()-make_interval(days=>$4)
      and (l.metadata->>'rule_id'=$3 or original.metadata->>'rule_id'=$3)""",org,user,str(rule["rule_id"]),period_days)
    points=int(totals["points_earned"] or 0);metric=Decimal(str(totals["metric_achieved"] or 0))
    points_limit=cfg.get("max_per_user_per_period")
    target_metric=cfg.get("minimum_metric",cfg.get("target_metric"))
    progress=None
    if target_metric is not None and Decimal(str(target_metric))>0:
     progress=max(Decimal(0),min(Decimal(100),metric/Decimal(str(target_metric))*Decimal(100)))
    elif points_limit is not None and int(points_limit)>0:
     progress=max(Decimal(0),min(Decimal(100),Decimal(points)/Decimal(int(points_limit))*Decimal(100)))
    items.append({
     "program_id":str(rule["program_id"]),"program_name":rule["program_name"],
     "rule_id":str(rule["rule_id"]),"rule_name":rule["rule_name"],"event_key":rule["event_key"],
     "period_days":period_days,"points_earned":points,
     "points_limit":int(points_limit) if points_limit is not None else None,
     "points_remaining":max(0,int(points_limit)-points) if points_limit is not None else None,
     "metric_achieved":metric,"target_metric":Decimal(str(target_metric)) if target_metric is not None else None,
     "progress_percent":progress,"requires_approval":rule["requires_approval"]
    })
   return {"organization_id":str(org),"participant_user_id":str(user),"items":items}

 async def ledger(self,db:SmartRewardRepository,org,user,page,size):
  a=await db.fetchrow("select id from public.reward_accounts where organization_id=$1 and participant_user_id=$2",org,user)
  if not a:return {"items":[],"page":page,"page_size":size,"total":0}
  total=await db.fetchval("select count(*) from public.reward_points_ledger where organization_id=$1 and account_id=$2",org,a["id"])
  rows=await db.fetch("select id,entry_type,points_delta,balance_before,balance_after,source_type,source_id,reference_type,reference_id,actor_user_id,reason,occurred_at,expires_at,metadata from public.reward_points_ledger where organization_id=$1 and account_id=$2 order by occurred_at desc,id desc limit $3 offset $4",org,a["id"],size,(page-1)*size)
  return {"items":[dict(r) for r in rows],"page":page,"page_size":size,"total":total}
 async def _source_metric(self,db:SmartRewardRepository,org,t,sid,user,metric):
  if t=="visit":
   visit=await db.fetchrow("select sales_profile_id from public.smartteam_visits where organization_id=$1 and id=$2 and status='completed'",org,sid)
   if not visit: raise APIError(422,"reward_source_not_eligible","Visit must be completed in this organization.")
   owner=await db.fetchval("select user_id from public.sales_profiles where organization_id=$1 and id=$2",org,visit["sales_profile_id"])
   if owner!=user: raise APIError(403,"reward_source_owner_mismatch","Visit belongs to another participant.")
   return Decimal(1)
  if t=="order":
   r=await db.fetchrow("select grand_total,customer_user_id,channel,cart_id from public.orders where organization_id=$1 and id=$2 and status in ('fulfilled','completed')",org,sid)
   if not r: raise APIError(422,"reward_source_not_eligible","Order must be fulfilled or completed.")
   if r["channel"]=="customer":
    if r["customer_user_id"]!=user: raise APIError(403,"reward_source_owner_mismatch","Order belongs to another customer.")
   else:
    owner=await db.fetchval("select owner_user_id from public.carts where organization_id=$1 and id=$2",org,r["cart_id"]) if r["cart_id"] else None
    if owner!=user: raise APIError(403,"reward_source_owner_mismatch","Sales order does not belong to this participant.")
   return Decimal(str(r["grand_total"]))
  if t=="target":
   r=await db.fetchrow("select sales_profile_id,metric_key,target_value,period_start,period_end from public.smartteam_targets where organization_id=$1 and id=$2",org,sid)
   if not r: raise APIError(422,"reward_source_not_eligible","Target not found.")
   owner=await db.fetchval("select user_id from public.sales_profiles where organization_id=$1 and id=$2",org,r["sales_profile_id"])
   if owner!=user: raise APIError(403,"reward_source_owner_mismatch","Target belongs to another participant.")
   if r["metric_key"] not in ("visits","productive_visits"): raise APIError(422,"reward_target_metric_unsupported","Only visit targets can issue rewards in this version.")
   value=await db.fetchval("""select count(*) from public.smartteam_visits where organization_id=$1 and sales_profile_id=$2 and status='completed' and scheduled_at::date between $3 and $4 and ($5::boolean=false or outcome in ('productive','order_taken'))""",org,r["sales_profile_id"],r["period_start"],r["period_end"],r["metric_key"]=="productive_visits")
   if Decimal(value)<Decimal(str(r["target_value"])): raise APIError(409,"reward_target_not_achieved","Target is not achieved.")
   return Decimal(value)
  if t=="manual": raise APIError(409,"manual_earning_requires_approval_record","Manual earning is disabled until an independently approved source record exists.")
  raise APIError(422,"reward_source_invalid","Unsupported source type.")
 async def issue_points(self,db:SmartRewardRepository,org,actor,p):
  async with db.transaction():
   old=await db.fetchrow("select * from public.reward_points_ledger where organization_id=$1 and participant_user_id=$2 and idempotency_key=$3",org,p.participant_user_id,p.idempotency_key)
   if old:return dict(old)
   program=await db.fetchrow("select audience,configuration,status,starts_at,ends_at,now() db_now from public.reward_programs where organization_id=$1 and id=$2 for share",org,p.program_id)
   if not program or program["status"]!="active" or program["starts_at"]>program["db_now"] or program["ends_at"]<=program["db_now"]: raise APIError(409,"reward_program_inactive","Program is not active.")
   rule=await db.fetchrow("select * from public.reward_incentive_rules where organization_id=$1 and id=$2 and program_id=$3 and status='active' for update",org,p.rule_id,p.program_id)
   if not rule: raise APIError(404,"reward_rule_not_found","Active rule not found.")
   membership=await db.fetchrow("select branch_id from public.organization_memberships where organization_id=$1 and user_id=$2 and status='active'",org,p.participant_user_id)
   if not membership: raise APIError(422,"reward_participant_not_member","Participant must be an active organization member.")
   roles=await db.fetch("select r.key from public.user_role_assignments ura join public.roles r on r.id=ura.role_id join public.organization_memberships m on m.id=ura.membership_id where m.organization_id=$1 and m.user_id=$2 and m.status='active' and ura.revoked_at is null and ura.starts_at<=now() and (ura.expires_at is null or ura.expires_at>now())",org,p.participant_user_id)
   role_keys={x["key"] for x in roles}; audience=program["audience"] or {}; cfg=rule["rule_config"] or {}
   allowed_roles=set(audience.get("roles",[]))|set(cfg.get("eligible_roles",[]))
   allowed_users=set(audience.get("user_ids",[])); allowed_branches=set(audience.get("branch_ids",[]))|set(cfg.get("eligible_branch_ids",[]))
   if allowed_roles and not role_keys.intersection(allowed_roles): raise APIError(403,"reward_role_ineligible","Participant role is outside the program audience.")
   if allowed_users and str(p.participant_user_id) not in allowed_users: raise APIError(403,"reward_user_ineligible","Participant is outside the program audience.")
   if allowed_branches and (membership["branch_id"] is None or str(membership["branch_id"]) not in allowed_branches): raise APIError(403,"reward_branch_ineligible","Participant branch is outside the program audience.")
   if {"order.completed":"order","visit.completed":"visit","target.achieved":"target","manual.approved":"manual"}[rule["event_key"]]!=p.source_type: raise APIError(422,"reward_event_mismatch","Source does not match incentive rule.")
   metric=await self._source_metric(db,org,p.source_type,p.source_id,p.participant_user_id,p.metric_value)
   if metric<Decimal(str(cfg.get("minimum_metric",0))): raise APIError(409,"reward_rule_not_satisfied","Source metric is below rule threshold.")
   points=int(rule["fixed_points"])+int((metric*Decimal(str(rule["points_per_unit"]))).to_integral_value(rounding=ROUND_FLOOR))
   if rule["max_points"] is not None: points=min(points,int(rule["max_points"]))
   if points<=0 or rule["requires_approval"]: raise APIError(409,"reward_approval_or_points_required","Rule requires approval or calculates zero points.")
   period_days=max(1,min(int(cfg.get("period_days",30)),366))
   per_user=cfg.get("max_per_user_per_period")
   if per_user is not None:
    used=await db.fetchval("select coalesce(sum(points_delta),0) from public.reward_points_ledger where organization_id=$1 and participant_user_id=$2 and entry_type='earn' and metadata->>'rule_id'=$3 and occurred_at>=now()-make_interval(days=>$4)",org,p.participant_user_id,str(p.rule_id),period_days)
    if int(used or 0)+points>int(per_user): raise APIError(409,"reward_user_period_limit","Participant incentive limit has been reached.")
   total_limit=cfg.get("max_total_per_period")
   if total_limit is not None:
    used=await db.fetchval("select coalesce(sum(points_delta),0) from public.reward_points_ledger where organization_id=$1 and entry_type='earn' and metadata->>'rule_id'=$2 and occurred_at>=now()-make_interval(days=>$3)",org,str(p.rule_id),period_days)
    if int(used or 0)+points>int(total_limit): raise APIError(409,"reward_program_period_limit","Program incentive limit has been reached.")
   a,b=await self._account(db,org,p.participant_user_id)
   old=await db.fetchrow("select * from public.reward_points_ledger where organization_id=$1 and participant_user_id=$2 and idempotency_key=$3",org,p.participant_user_id,p.idempotency_key)
   if old:return dict(old)
   row=await db.fetchrow("""insert into public.reward_points_ledger(organization_id,account_id,participant_user_id,entry_type,points_delta,balance_before,balance_after,source_type,source_id,actor_user_id,idempotency_key,reason,metadata)
    values($1,$2,$3,'earn',$4,$5,$6,$7,$8,$9,$10,$11,$12::jsonb) returning *""",org,a["id"],p.participant_user_id,points,b,b+points,p.source_type,p.source_id,actor,p.idempotency_key,p.reason,json.dumps({"program_id":str(p.program_id),"rule_id":str(p.rule_id),"metric":str(metric)}))
   await db.execute("update public.reward_accounts set points_balance=$3,updated_at=now() where organization_id=$1 and id=$2",org,a["id"],b+points)
   await self._audit(db,org,actor,"points.earned","reward_points_ledger",row["id"],p.reason,{"points":points}); return dict(row)
 async def redeem(self,db:SmartRewardRepository,org,actor,p):
  async with db.transaction():
   old=await db.fetchrow("select * from public.reward_redemptions where organization_id=$1 and participant_user_id=$2 and idempotency_key=$3",org,actor,p.idempotency_key)
   if old:return dict(old)
   a,b=await self._account(db,org,actor)
   old=await db.fetchrow("select * from public.reward_redemptions where organization_id=$1 and participant_user_id=$2 and idempotency_key=$3",org,actor,p.idempotency_key)
   if old:return dict(old)
   item=await db.fetchrow("select * from public.reward_catalog_items where organization_id=$1 and id=$2 and status='active' and (starts_at is null or starts_at<=now()) and (ends_at is null or ends_at>now()) for update",org,p.catalog_item_id)
   if not item:raise APIError(404,"reward_item_unavailable","Reward item is unavailable.")
   elig=item["eligibility"] or {}
   if elig.get("minimum_balance") and b<int(elig["minimum_balance"]):raise APIError(403,"reward_eligibility_denied","Minimum balance is not met.")
   member=await db.fetchrow("select branch_id from public.organization_memberships where organization_id=$1 and user_id=$2 and status='active'",org,actor)
   if not member: raise APIError(422,"reward_participant_not_member","Participant must be an active organization member.")
   roles=await db.fetch("select r.key from public.user_role_assignments ura join public.roles r on r.id=ura.role_id join public.organization_memberships m on m.id=ura.membership_id where m.organization_id=$1 and m.user_id=$2 and m.status='active' and ura.revoked_at is null and ura.starts_at<=now() and (ura.expires_at is null or ura.expires_at>now())",org,actor)
   role_keys={x["key"] for x in roles}
   program_audience={}
   if item["program_id"] is not None:
    program=await db.fetchrow("select audience,status,starts_at,ends_at,now() db_now from public.reward_programs where organization_id=$1 and id=$2 for share",org,item["program_id"])
    if not program or program["status"]!="active" or program["starts_at"]>program["db_now"] or program["ends_at"]<=program["db_now"]:
     raise APIError(409,"reward_program_inactive","Linked reward program is not active.")
    program_audience=program["audience"] or {}
   allowed_roles=set(elig.get("roles",[]))|set(program_audience.get("roles",[]))
   allowed_branches=set(elig.get("branch_ids",[]))|set(program_audience.get("branch_ids",[]))
   allowed_users=set(elig.get("user_ids",[]))|set(program_audience.get("user_ids",[]))
   if allowed_roles and not role_keys.intersection(allowed_roles): raise APIError(403,"reward_role_ineligible","Participant role is not eligible for this catalog item.")
   if allowed_branches and (member["branch_id"] is None or str(member["branch_id"]) not in allowed_branches): raise APIError(403,"reward_branch_ineligible","Participant branch is not eligible for this catalog item.")
   if allowed_users and str(actor) not in allowed_users: raise APIError(403,"reward_user_ineligible","Participant is not eligible for this catalog item.")
   period_days=max(1,min(int(elig.get("period_days",30)),366))
   if elig.get("max_per_user_per_period") is not None:
    used=await db.fetchval("select coalesce(sum(quantity),0) from public.reward_redemptions where organization_id=$1 and participant_user_id=$2 and catalog_item_id=$3 and status not in ('rejected','cancelled') and requested_at>=now()-make_interval(days=>$4)",org,actor,item["id"],period_days)
    if int(used or 0)+p.quantity>int(elig["max_per_user_per_period"]): raise APIError(409,"reward_redemption_limit","Participant redemption limit has been reached.")
   if elig.get("max_total_per_period") is not None:
    used_total=await db.fetchval("select coalesce(sum(quantity),0) from public.reward_redemptions where organization_id=$1 and catalog_item_id=$2 and status not in ('rejected','cancelled') and requested_at>=now()-make_interval(days=>$3)",org,item["id"],period_days)
    if int(used_total or 0)+p.quantity>int(elig["max_total_per_period"]): raise APIError(409,"reward_catalog_period_limit","Catalog item redemption limit has been reached.")
   cost=int(item["points_cost"])*p.quantity
   if b<cost:raise APIError(409,"insufficient_reward_points","Insufficient reward points.")
   if item["quantity_total"] is not None and int(item["quantity_total"])-int(item["quantity_reserved"])-int(item["quantity_fulfilled"])<p.quantity:raise APIError(409,"reward_out_of_stock","Reward is out of stock.")
   red=await db.fetchrow("insert into public.reward_redemptions(organization_id,account_id,catalog_item_id,participant_user_id,quantity,points_reserved,idempotency_key,requested_by) values($1,$2,$3,$4,$5,$6,$7,$4) returning *",org,a["id"],item["id"],actor,p.quantity,cost,p.idempotency_key)
   led=await db.fetchrow("""insert into public.reward_points_ledger(organization_id,account_id,participant_user_id,entry_type,points_delta,balance_before,balance_after,source_type,source_id,reference_type,reference_id,actor_user_id,idempotency_key,reason)
    values($1,$2,$3,'redemption',$4,$5,$6,'redemption',$7,'redemption',$7,$3,$8,'Reward redemption') returning id""",org,a["id"],actor,-cost,b,b-cost,red["id"],"redeem:"+p.idempotency_key)
   await db.execute("update public.reward_accounts set points_balance=$3,updated_at=now() where organization_id=$1 and id=$2",org,a["id"],b-cost)
   await db.execute("update public.reward_catalog_items set quantity_reserved=quantity_reserved+$3,updated_at=now() where organization_id=$1 and id=$2",org,item["id"],p.quantity)
   await db.execute("insert into public.reward_redemption_history(organization_id,redemption_id,to_status,actor_user_id,metadata) values($1,$2,'requested',$3,$4::jsonb)",org,red["id"],actor,json.dumps({"ledger_id":str(led["id"])}))
   await self._audit(db,org,actor,"redemption.requested","reward_redemption",red["id"],meta={"points":cost}); return dict(red)
 async def redemptions(self,db:SmartRewardRepository,org,user,page,size):
  scopes=await db.fetch("""select r.key role_key,ura.scope_type,ura.scope_id from public.organization_memberships m
   join public.user_role_assignments ura on ura.membership_id=m.id join public.roles r on r.id=ura.role_id
   where m.organization_id=$1 and m.user_id=$2 and m.status='active' and ura.revoked_at is null
    and ura.starts_at<=now() and (ura.expires_at is null or ura.expires_at>now())""",org,user)
  roles={x["role_key"] for x in scopes}
  if roles.intersection({"tenant_owner","company_admin","principal_user","distributor_user"}):
   where="organization_id=$1";args=[org]
  elif "supervisor" in roles:
   branches=[x["scope_id"] for x in scopes if x["role_key"]=="supervisor" and x["scope_type"]=="branch"]
   if branches:
    where="organization_id=$1 and participant_user_id in (select user_id from public.organization_memberships where organization_id=$1 and branch_id=any($2::uuid[]))";args=[org,branches]
   else: where="organization_id=$1 and participant_user_id=$2";args=[org,user]
  else:
   where="organization_id=$1 and participant_user_id=$2";args=[org,user]
  total=await db.fetchval("select count(*) from public.reward_redemptions where "+where,*args)
  rows=await db.fetch("select r.*,c.code catalog_code,c.name catalog_name,c.category from public.reward_redemptions r join public.reward_catalog_items c on c.organization_id=r.organization_id and c.id=r.catalog_item_id where "+where+" order by r.requested_at desc limit $"+str(len(args)+1)+" offset $"+str(len(args)+2),*args,size,(page-1)*size)
  return {"items":[dict(r) for r in rows],"page":page,"page_size":size,"total":total}
 async def _refund(self,db:SmartRewardRepository,org,actor,row,reason,key):
  original=await db.fetchrow("select * from public.reward_points_ledger where organization_id=$1 and reference_type='redemption' and reference_id=$2 and entry_type='redemption' for update",org,row["id"])
  if not original:raise APIError(500,"reward_redemption_ledger_missing","Redemption debit is missing.")
  if await db.fetchval("select exists(select 1 from public.reward_points_ledger where reversal_of=$1)",original["id"]):return
  a,b=await self._account(db,org,row["participant_user_id"]); delta=-int(original["points_delta"])
  await db.execute("""insert into public.reward_points_ledger(organization_id,account_id,participant_user_id,entry_type,points_delta,balance_before,balance_after,source_type,source_id,reference_type,reference_id,actor_user_id,idempotency_key,reason,reversal_of)
   values($1,$2,$3,'reversal',$4,$5,$6,'redemption',$7,'redemption',$7,$8,$9,$10,$11)""",org,a["id"],row["participant_user_id"],delta,b,b+delta,row["id"],actor,key,reason,original["id"])
  await db.execute("update public.reward_accounts set points_balance=$3,updated_at=now() where organization_id=$1 and id=$2",org,a["id"],b+delta)
 async def decide_redemption(self,db:SmartRewardRepository,org,actor,rid,p):
  async with db.transaction():
   row=await db.fetchrow("select * from public.reward_redemptions where organization_id=$1 and id=$2 for update",org,rid)
   if not row: raise APIError(404,"reward_redemption_not_found","Redemption not found.")
   scopes=await db.fetch("""select r.key role_key,ura.scope_type,ura.scope_id from public.organization_memberships m
    join public.user_role_assignments ura on ura.membership_id=m.id join public.roles r on r.id=ura.role_id
    where m.organization_id=$1 and m.user_id=$2 and m.status='active' and ura.revoked_at is null
     and ura.starts_at<=now() and (ura.expires_at is null or ura.expires_at>now())""",org,actor)
   roles={x["role_key"] for x in scopes}
   if not roles.intersection({"tenant_owner","company_admin","supervisor","principal_user"}): raise APIError(403,"reward_redemption_decision_forbidden","Redemption approver role is required.")
   if "supervisor" in roles and not roles.intersection({"tenant_owner","company_admin","principal_user"}):
    branches={x["scope_id"] for x in scopes if x["role_key"]=="supervisor" and x["scope_type"]=="branch"}
    participant_branch=await db.fetchval("select branch_id from public.organization_memberships where organization_id=$1 and user_id=$2 and status='active'",org,row["participant_user_id"])
    if participant_branch not in branches: raise APIError(403,"reward_redemption_scope_forbidden","Redemption is outside the supervisor branch scope.")
   if row["status"]!="requested":raise APIError(409,"reward_redemption_transition_invalid","Only requested redemption can be decided.")
   if p.decision=="rejected":
    await self._refund(db,org,actor,row,p.reason or "Rejected","reject:"+str(rid))
    await db.execute("update public.reward_catalog_items set quantity_reserved=quantity_reserved-$3 where organization_id=$1 and id=$2",org,row["catalog_item_id"],row["quantity"])
   await db.execute("update public.reward_redemptions set status=$3,decided_by=$4,decided_at=now(),reason=$5,updated_at=now() where organization_id=$1 and id=$2",org,rid,p.decision,actor,p.reason)
   await db.execute("insert into public.reward_redemption_history(organization_id,redemption_id,from_status,to_status,actor_user_id,reason) values($1,$2,$3,$4,$5,$6)",org,rid,row["status"],p.decision,actor,p.reason)
   await self._audit(db,org,actor,"redemption."+p.decision,"reward_redemption",rid,p.reason)
   return dict(await db.fetchrow("select * from public.reward_redemptions where organization_id=$1 and id=$2",org,rid))
 async def cancel_redemption(self,db:SmartRewardRepository,org,actor,rid):
  async with db.transaction():
   row=await db.fetchrow("select * from public.reward_redemptions where organization_id=$1 and id=$2 for update",org,rid)
   if not row or row["participant_user_id"]!=actor:raise APIError(404,"reward_redemption_not_found","Redemption not found.")
   if row["status"] not in ("requested","approved"):raise APIError(409,"reward_redemption_transition_invalid","Redemption cannot be cancelled.")
   await self._refund(db,org,actor,row,"Participant cancellation","cancel:"+str(rid))
   await db.execute("update public.reward_catalog_items set quantity_reserved=quantity_reserved-$3 where organization_id=$1 and id=$2",org,row["catalog_item_id"],row["quantity"])
   await db.execute("update public.reward_redemptions set status='cancelled',updated_at=now() where organization_id=$1 and id=$2",org,rid)
   await db.execute("insert into public.reward_redemption_history(organization_id,redemption_id,from_status,to_status,actor_user_id,reason) values($1,$2,$3,'cancelled',$4,'Participant cancellation')",org,rid,row["status"],actor)
   await self._audit(db,org,actor,"redemption.cancelled","reward_redemption",rid);return {"id":str(rid),"status":"cancelled"}
 async def fulfill_redemption(self,db:SmartRewardRepository,org,actor,rid,p):
  async with db.transaction():
   row=await db.fetchrow("select * from public.reward_redemptions where organization_id=$1 and id=$2 for update",org,rid)
   if not row or row["status"]!="approved":raise APIError(409,"reward_redemption_transition_invalid","Only approved redemption can be fulfilled.")
   await db.execute("update public.reward_catalog_items set quantity_reserved=quantity_reserved-$3,quantity_fulfilled=quantity_fulfilled+$3,updated_at=now() where organization_id=$1 and id=$2",org,row["catalog_item_id"],row["quantity"])
   await db.execute("update public.reward_redemptions set status='fulfilled',fulfilled_by=$3,fulfilled_at=now(),fulfillment_reference=$4,reason=$5,updated_at=now() where organization_id=$1 and id=$2",org,rid,actor,p.fulfillment_reference,p.reason)
   await db.execute("insert into public.reward_redemption_history(organization_id,redemption_id,from_status,to_status,actor_user_id,reason) values($1,$2,$3,'fulfilled',$4,$5)",org,rid,row["status"],actor,p.reason)
   await self._audit(db,org,actor,"redemption.fulfilled","reward_redemption",rid,p.reason);return dict(await db.fetchrow("select * from public.reward_redemptions where organization_id=$1 and id=$2",org,rid))
 async def adjust(self,db:SmartRewardRepository,org,actor,p):
  async with db.transaction():
   a,b=await self._account(db,org,p.participant_user_id);after=b+p.points_delta
   if after<0:raise APIError(409,"insufficient_reward_points","Adjustment cannot create a negative balance.")
   old=await db.fetchrow("select * from public.reward_points_ledger where organization_id=$1 and participant_user_id=$2 and idempotency_key=$3",org,p.participant_user_id,p.idempotency_key)
   if old:return dict(old)
   r=await db.fetchrow("""insert into public.reward_points_ledger(organization_id,account_id,participant_user_id,entry_type,points_delta,balance_before,balance_after,source_type,source_id,reference_type,reference_id,actor_user_id,idempotency_key,reason)
    values($1,$2,$3,'adjustment',$4,$5,$6,'manual',$7,$8,$9,$10,$11,$12) returning *""",org,a["id"],p.participant_user_id,p.points_delta,b,after,p.reference_id,p.reference_type,p.reference_id,actor,p.idempotency_key,p.reason)
   await db.execute("update public.reward_accounts set points_balance=$3,updated_at=now() where organization_id=$1 and id=$2",org,a["id"],after)
   await self._audit(db,org,actor,"points.adjusted","reward_points_ledger",r["id"],p.reason,{"delta":p.points_delta});return dict(r)
 async def reverse(self,db:SmartRewardRepository,org,actor,eid,p):
  async with db.transaction():
   old=await db.fetchrow("select * from public.reward_points_ledger where organization_id=$1 and id=$2 for update",org,eid)
   if not old:raise APIError(404,"reward_ledger_entry_not_found","Ledger entry not found.")
   replay=await db.fetchrow("select * from public.reward_points_ledger where organization_id=$1 and participant_user_id=$2 and idempotency_key=$3",org,old["participant_user_id"],p.idempotency_key)
   if replay:return dict(replay)
   if await db.fetchval("select exists(select 1 from public.reward_points_ledger where reversal_of=$1)",eid):raise APIError(409,"reward_entry_already_reversed","Entry already reversed.")
   a,b=await self._account(db,org,old["participant_user_id"]);delta=-int(old["points_delta"]);after=b+delta
   if after<0:raise APIError(409,"reward_reversal_insufficient_balance","Reversal would make balance negative.")
   r=await db.fetchrow("""insert into public.reward_points_ledger(organization_id,account_id,participant_user_id,entry_type,points_delta,balance_before,balance_after,source_type,source_id,reference_type,reference_id,actor_user_id,idempotency_key,reason,reversal_of)
    values($1,$2,$3,'reversal',$4,$5,$6,'ledger',$7,'ledger',$7,$8,$9,$10,$11) returning *""",org,a["id"],old["participant_user_id"],delta,b,after,eid,actor,p.idempotency_key,p.reason,eid)
   await db.execute("update public.reward_accounts set points_balance=$3,updated_at=now() where organization_id=$1 and id=$2",org,a["id"],after)
   await self._audit(db,org,actor,"points.reversed","reward_points_ledger",r["id"],p.reason,{"reversed_entry_id":str(eid)});return dict(r)

 async def platform_overview(self,db:SmartRewardRepository,start_at=None,end_at=None,limit=100,offset=0):
  await db.fetchval("select public.process_reward_expirations(1000)")
  total=await db.fetchval("select count(*) from public.organizations where status='active'")
  rows=await db.fetch("""with ledger as (
    select organization_id,
     coalesce(sum(points_delta) filter(where entry_type='earn' and points_delta>0),0)::bigint earned_points,
     coalesce(sum(-points_delta) filter(where entry_type='redemption'),0)::bigint redeemed_points,
     coalesce(sum(-points_delta) filter(where entry_type='expiration'),0)::bigint expired_points,
     coalesce(sum(points_delta) filter(where entry_type='adjustment'),0)::bigint adjusted_points,
     coalesce(sum(points_delta) filter(where entry_type='reversal'),0)::bigint reversed_points,
     count(*) filter(where entry_type='earn' and metadata ? 'rule_id')::bigint incentive_achievements
    from public.reward_points_ledger where ($1::timestamptz is null or occurred_at>=$1)
     and ($2::timestamptz is null or occurred_at<$2) group by organization_id
   ), accounts as (
    select organization_id,coalesce(sum(points_balance),0)::bigint outstanding_points,
     count(distinct participant_user_id)::bigint participants from public.reward_accounts
    where status='active' group by organization_id
   ), redemptions as (
    select organization_id,count(*) filter(where status in ('requested','approved'))::bigint pending_redemptions
    from public.reward_redemptions where ($1::timestamptz is null or requested_at>=$1)
     and ($2::timestamptz is null or requested_at<$2) group by organization_id
   ), approvals as (
    select organization_id,count(*) filter(where status='pending')::bigint pending_approvals
    from public.reward_approval_requests where ($1::timestamptz is null or created_at>=$1)
     and ($2::timestamptz is null or created_at<$2) group by organization_id
   )
   select o.id organization_id,o.name organization_name,coalesce(l.earned_points,0) earned_points,
    coalesce(l.redeemed_points,0) redeemed_points,coalesce(a.outstanding_points,0) outstanding_points,
    coalesce(l.expired_points,0) expired_points,coalesce(l.adjusted_points,0) adjusted_points,
    coalesce(l.reversed_points,0) reversed_points,coalesce(l.incentive_achievements,0) incentive_achievements,
    coalesce(r.pending_redemptions,0) pending_redemptions,coalesce(p.pending_approvals,0) pending_approvals,
    coalesce(a.participants,0) participants
   from public.organizations o left join ledger l on l.organization_id=o.id
   left join accounts a on a.organization_id=o.id left join redemptions r on r.organization_id=o.id
   left join approvals p on p.organization_id=o.id where o.status='active'
   order by o.name,o.id limit $3 offset $4""",start_at,end_at,limit,offset)
  return {"items":[dict(x) for x in rows],"total":int(total or 0),"limit":limit,"offset":offset}

 async def report(self,db:SmartRewardRepository,org,page,size,start_at=None,end_at=None,branch_id=None,actor=None):
  await db.fetchval("select public.process_reward_expirations(500)")
  if actor is not None:
   scopes=await db.fetch("""select r.key role_key,ura.scope_type,ura.scope_id from public.organization_memberships m
    join public.user_role_assignments ura on ura.membership_id=m.id join public.roles r on r.id=ura.role_id
    where m.organization_id=$1 and m.user_id=$2 and m.status='active' and ura.revoked_at is null
     and ura.starts_at<=now() and (ura.expires_at is null or ura.expires_at>now())""",org,actor)
   roles={x["role_key"] for x in scopes}
   if "supervisor" in roles and not roles.intersection({"tenant_owner","company_admin","principal_user"}):
    allowed={x["scope_id"] for x in scopes if x["role_key"]=="supervisor" and x["scope_type"]=="branch"}
    if not allowed: raise APIError(403,"reward_report_scope_forbidden","Supervisor branch scope is required.")
    if branch_id is not None and branch_id not in allowed: raise APIError(403,"reward_report_scope_forbidden","Requested report branch is outside supervisor scope.")
    if branch_id is None:
     if len(allowed)!=1: raise APIError(422,"reward_report_branch_required","Select one authorized branch for this report.")
     branch_id=next(iter(allowed))
   elif not roles.intersection({"tenant_owner","company_admin","principal_user","distributor_user"}):
    raise APIError(403,"reward_report_scope_forbidden","Organization reward report permission is required.")
  r=await db.fetchrow("""select
   coalesce(sum(case when entry_type='earn' then points_delta else 0 end),0)::bigint earned_points,
   coalesce(sum(case when entry_type='redemption' then -points_delta else 0 end),0)::bigint redeemed_points,
   coalesce(sum(case when entry_type='expiration' then -points_delta else 0 end),0)::bigint expired_points,
   coalesce(sum(case when entry_type='adjustment' then points_delta else 0 end),0)::bigint adjusted_points,
   coalesce(sum(case when entry_type='reversal' then points_delta else 0 end),0)::bigint reversed_points,
   count(*) ledger_entries,count(distinct l.participant_user_id) participants,
   count(*) filter(where entry_type='earn' and metadata ? 'rule_id')::bigint incentive_achievements
   from public.reward_points_ledger l
   left join public.organization_memberships m on m.organization_id=l.organization_id and m.user_id=l.participant_user_id
   where l.organization_id=$1 and ($2::timestamptz is null or l.occurred_at>=$2) and ($3::timestamptz is null or l.occurred_at<$3) and ($4::uuid is null or m.branch_id=$4)""",org,start_at,end_at,branch_id)
  pending=await db.fetchval("""select count(*) from public.reward_redemptions r join public.organization_memberships m on m.organization_id=r.organization_id and m.user_id=r.participant_user_id
   where r.organization_id=$1 and r.status in ('requested','approved') and ($2::uuid is null or m.branch_id=$2)""",org,branch_id)
  approvals=await db.fetchval("""select count(*) from public.reward_approval_requests a join public.organization_memberships m on m.organization_id=a.organization_id and m.user_id=a.participant_user_id
   where a.organization_id=$1 and a.status='pending' and ($2::uuid is null or m.branch_id=$2)""",org,branch_id)
  outstanding=await db.fetchval("""select coalesce(sum(a.points_balance),0)::bigint from public.reward_accounts a join public.organization_memberships m on m.organization_id=a.organization_id and m.user_id=a.participant_user_id
   where a.organization_id=$1 and a.status='active' and ($2::uuid is null or m.branch_id=$2)""",org,branch_id)
  by_branch=await db.fetch("""select m.branch_id,coalesce(sum(case when l.entry_type='earn' then l.points_delta else 0 end),0)::bigint earned_points,
   coalesce(sum(case when l.entry_type='redemption' then -l.points_delta else 0 end),0)::bigint redeemed_points,
   coalesce(sum(case when l.entry_type='expiration' then -l.points_delta else 0 end),0)::bigint expired_points,
   count(distinct l.participant_user_id)::bigint participants
   from public.reward_points_ledger l join public.organization_memberships m on m.organization_id=l.organization_id and m.user_id=l.participant_user_id
   where l.organization_id=$1 and ($2::timestamptz is null or l.occurred_at>=$2) and ($3::timestamptz is null or l.occurred_at<$3) and ($4::uuid is null or m.branch_id=$4)
   group by m.branch_id order by m.branch_id limit $5 offset $6""",org,start_at,end_at,branch_id,size,(page-1)*size)
  return {**dict(r),"outstanding_points":int(outstanding or 0),"pending_redemptions":pending,"pending_approvals":approvals,"by_branch":[dict(x) for x in by_branch],"page":page,"page_size":size,"period_start":start_at,"period_end":end_at}
smart_reward_service=SmartRewardService()
