from __future__ import annotations
import json
from decimal import Decimal, ROUND_FLOOR
from uuid import UUID
import asyncpg
from app.errors import APIError

class SmartRewardService:
 def _tenant(self,org,tenant):
  if tenant.organization_id!=org: raise APIError(403,"tenant_scope_mismatch","Reward access is restricted to the active organization.")
 async def _audit(self,db,org,actor,action,kind,rid,reason=None,meta=None):
  await db.execute("insert into public.reward_audit_events(organization_id,actor_user_id,action,resource_type,resource_id,reason,metadata) values($1,$2,$3,$4,$5,$6,$7::jsonb)",org,actor,action,kind,rid,reason,json.dumps(meta or {}))
 async def _account(self,db,org,user):
  if not await db.fetchval("select exists(select 1 from public.organization_memberships where organization_id=$1 and user_id=$2 and status='active')",org,user):
   raise APIError(422,"reward_participant_not_member","Participant must be an active organization member.")
  await db.execute("insert into public.reward_accounts(organization_id,participant_user_id) values($1,$2) on conflict do nothing",org,user)
  a=await db.fetchrow("select * from public.reward_accounts where organization_id=$1 and participant_user_id=$2 for update",org,user)
  if a["status"]!="active": raise APIError(409,"reward_account_inactive","Reward account is inactive.")
  bal=int(await db.fetchval("select coalesce(sum(points_delta),0)::bigint from public.reward_points_ledger where organization_id=$1 and account_id=$2",org,a["id"]))
  if bal<0: raise APIError(500,"reward_ledger_integrity_error","Ledger balance cannot be negative.")
  if int(a["points_balance"])!=bal: await db.execute("update public.reward_accounts set points_balance=$3,updated_at=now() where organization_id=$1 and id=$2",org,a["id"],bal)
  return a,bal
 async def programs(self,db,org,page,size):
  total=await db.fetchval("select count(*) from public.reward_programs where organization_id=$1",org)
  rows=await db.fetch("select * from public.reward_programs where organization_id=$1 order by created_at desc limit $2 offset $3",org,size,(page-1)*size)
  return {"items":[dict(r) for r in rows],"page":page,"page_size":size,"total":total}
 async def create_program(self,db,org,actor,p):
  try:
   r=await db.fetchrow("""insert into public.reward_programs(organization_id,code,name,description,program_type,reward_type,starts_at,ends_at,status,audience,configuration,created_by,updated_by)
    values($1,$2,$3,$4,$5,$6,$7::timestamptz,$8::timestamptz,$9,$10::jsonb,$11::jsonb,$12,$12) returning *""",org,p.code.upper(),p.name,p.description,p.program_type,p.reward_type,p.starts_at,p.ends_at,p.status,json.dumps(p.audience),json.dumps(p.configuration),actor)
  except asyncpg.UniqueViolationError as e: raise APIError(409,"reward_program_code_conflict","Program code already exists.") from e
  await self._audit(db,org,actor,"program.created","reward_program",r["id"]); return dict(r)
 async def update_program(self,db,org,actor,pid,p):
  r=await db.fetchrow("""update public.reward_programs set code=$3,name=$4,description=$5,program_type=$6,reward_type=$7,starts_at=$8::timestamptz,ends_at=$9::timestamptz,status=$10,audience=$11::jsonb,configuration=$12::jsonb,updated_by=$13,updated_at=now() where organization_id=$1 and id=$2 returning *""",org,pid,p.code.upper(),p.name,p.description,p.program_type,p.reward_type,p.starts_at,p.ends_at,p.status,json.dumps(p.audience),json.dumps(p.configuration),actor)
  if not r: raise APIError(404,"reward_program_not_found","Program not found.")
  await self._audit(db,org,actor,"program.updated","reward_program",pid); return dict(r)
 async def rules(self,db,org,pid):
  return [dict(r) for r in await db.fetch("select * from public.reward_incentive_rules where organization_id=$1 and ($2::uuid is null or program_id=$2) order by priority,created_at",org,pid)]
 async def create_rule(self,db,org,actor,p,pid):
  r=await db.fetchrow("""insert into public.reward_incentive_rules(organization_id,program_id,code,name,event_key,priority,rule_config,points_per_unit,fixed_points,max_points,requires_approval,status,created_by,updated_by)
   values($1,$2,$3,$4,$5,$6,$7::jsonb,$8,$9,$10,$11,$12,$13,$13) returning *""",org,pid,p.code.upper(),p.name,p.event_key,p.priority,json.dumps(p.rule_config),p.points_per_unit,p.fixed_points,p.max_points,p.requires_approval,p.status,actor)
  await self._audit(db,org,actor,"rule.created","reward_incentive_rule",r["id"]); return dict(r)
 async def update_rule(self,db,org,actor,rid,p):
  r=await db.fetchrow("""update public.reward_incentive_rules set code=$3,name=$4,event_key=$5,priority=$6,rule_config=$7::jsonb,points_per_unit=$8,fixed_points=$9,max_points=$10,requires_approval=$11,status=$12,updated_by=$13,updated_at=now() where organization_id=$1 and id=$2 returning *""",org,rid,p.code.upper(),p.name,p.event_key,p.priority,json.dumps(p.rule_config),p.points_per_unit,p.fixed_points,p.max_points,p.requires_approval,p.status,actor)
  if not r: raise APIError(404,"reward_rule_not_found","Rule not found.")
  await self._audit(db,org,actor,"rule.updated","reward_incentive_rule",rid); return dict(r)
 async def catalog(self,db,org,page,size,category):
  total=await db.fetchval("select count(*) from public.reward_catalog_items where organization_id=$1 and ($2::text is null or category=$2)",org,category)
  rows=await db.fetch("select * from public.reward_catalog_items where organization_id=$1 and ($2::text is null or category=$2) order by created_at desc limit $3 offset $4",org,category,size,(page-1)*size)
  return {"items":[dict(r) for r in rows],"page":page,"page_size":size,"total":total}
 async def create_catalog_item(self,db,org,actor,p):
  r=await db.fetchrow("""insert into public.reward_catalog_items(organization_id,program_id,code,name,description,category,points_cost,quantity_total,starts_at,ends_at,eligibility,metadata,status,created_by,updated_by)
   values($1,$2,$3,$4,$5,$6,$7,$8,$9::timestamptz,$10::timestamptz,$11::jsonb,$12::jsonb,$13,$14,$14) returning *""",org,p.program_id,p.code.upper(),p.name,p.description,p.category,p.points_cost,p.quantity_total,p.starts_at,p.ends_at,json.dumps(p.eligibility),json.dumps(p.metadata),p.status,actor)
  await self._audit(db,org,actor,"catalog.created","reward_catalog_item",r["id"]); return dict(r)
 async def update_catalog_item(self,db,org,actor,iid,p):
  r=await db.fetchrow("""update public.reward_catalog_items set program_id=$3,code=$4,name=$5,description=$6,category=$7,points_cost=$8,quantity_total=$9,starts_at=$10::timestamptz,ends_at=$11::timestamptz,eligibility=$12::jsonb,metadata=$13::jsonb,status=$14,updated_by=$15,updated_at=now() where organization_id=$1 and id=$2 and (quantity_total is null or quantity_total>=quantity_reserved+quantity_fulfilled) returning *""",org,iid,p.program_id,p.code.upper(),p.name,p.description,p.category,p.points_cost,p.quantity_total,p.starts_at,p.ends_at,json.dumps(p.eligibility),json.dumps(p.metadata),p.status,actor)
  if not r: raise APIError(404,"reward_catalog_item_not_found","Item not found or committed stock would be violated.")
  await self._audit(db,org,actor,"catalog.updated","reward_catalog_item",iid); return dict(r)
 async def balance(self,db,org,user):
  a,b=await self._account(db,org,user); return {"account_id":str(a["id"]),"organization_id":str(org),"participant_user_id":str(user),"points_balance":b}
 async def ledger(self,db,org,user,page,size):
  a=await db.fetchrow("select id from public.reward_accounts where organization_id=$1 and participant_user_id=$2",org,user)
  if not a:return {"items":[],"page":page,"page_size":size,"total":0}
  total=await db.fetchval("select count(*) from public.reward_points_ledger where organization_id=$1 and account_id=$2",org,a["id"])
  rows=await db.fetch("select id,entry_type,points_delta,balance_before,balance_after,source_type,source_id,reference_type,reference_id,actor_user_id,reason,occurred_at,metadata from public.reward_points_ledger where organization_id=$1 and account_id=$2 order by occurred_at desc,id desc limit $3 offset $4",org,a["id"],size,(page-1)*size)
  return {"items":[dict(r) for r in rows],"page":page,"page_size":size,"total":total}
 async def _source_metric(self,db,org,t,sid,user,metric):
  if t=="visit":
   if not await db.fetchval("select exists(select 1 from public.smartteam_visits where organization_id=$1 and id=$2 and status='completed')",org,sid): raise APIError(422,"reward_source_not_eligible","Visit must be completed in this organization.")
   return Decimal(1)
  if t=="order":
   r=await db.fetchrow("select grand_total,customer_user_id,channel from public.orders where organization_id=$1 and id=$2 and status in ('fulfilled','completed')",org,sid)
   if not r: raise APIError(422,"reward_source_not_eligible","Order must be fulfilled or completed.")
   if r["channel"]=="customer" and r["customer_user_id"]!=user: raise APIError(403,"reward_source_owner_mismatch","Order belongs to another customer.")
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
  if t=="manual": return Decimal(str(metric))
  raise APIError(422,"reward_source_invalid","Unsupported source type.")
 async def issue_points(self,db,org,actor,p):
  async with db.transaction():
   if not await db.fetchval("select exists(select 1 from public.reward_programs where organization_id=$1 and id=$2 and status='active' and starts_at<=now() and ends_at>now())",org,p.program_id): raise APIError(409,"reward_program_inactive","Program is not active.")
   rule=await db.fetchrow("select * from public.reward_incentive_rules where organization_id=$1 and id=$2 and program_id=$3 and status='active' for share",org,p.rule_id,p.program_id)
   if not rule: raise APIError(404,"reward_rule_not_found","Active rule not found.")
   if {"order.completed":"order","visit.completed":"visit","target.achieved":"target","manual.approved":"manual"}[rule["event_key"]]!=p.source_type: raise APIError(422,"reward_event_mismatch","Source does not match incentive rule.")
   metric=await self._source_metric(db,org,p.source_type,p.source_id,p.participant_user_id,p.metric_value)
   if metric<Decimal(str((rule["rule_config"] or {}).get("minimum_metric",0))): raise APIError(409,"reward_rule_not_satisfied","Source metric is below rule threshold.")
   points=int(rule["fixed_points"])+int((metric*Decimal(str(rule["points_per_unit"]))).to_integral_value(rounding=ROUND_FLOOR))
   if rule["max_points"] is not None: points=min(points,int(rule["max_points"]))
   if points<=0 or rule["requires_approval"]: raise APIError(409,"reward_approval_or_points_required","Rule requires approval or calculates zero points.")
   a,b=await self._account(db,org,p.participant_user_id)
   old=await db.fetchrow("select * from public.reward_points_ledger where organization_id=$1 and participant_user_id=$2 and idempotency_key=$3",org,p.participant_user_id,p.idempotency_key)
   if old:return dict(old)
   row=await db.fetchrow("""insert into public.reward_points_ledger(organization_id,account_id,participant_user_id,entry_type,points_delta,balance_before,balance_after,source_type,source_id,actor_user_id,idempotency_key,reason,metadata)
    values($1,$2,$3,'earn',$4,$5,$6,$7,$8,$9,$10,$11,$12::jsonb) returning *""",org,a["id"],p.participant_user_id,points,b,b+points,p.source_type,p.source_id,actor,p.idempotency_key,p.reason,json.dumps({"program_id":str(p.program_id),"rule_id":str(p.rule_id),"metric":str(metric)}))
   await db.execute("update public.reward_accounts set points_balance=$3,updated_at=now() where organization_id=$1 and id=$2",org,a["id"],b+points)
   await self._audit(db,org,actor,"points.earned","reward_points_ledger",row["id"],p.reason,{"points":points}); return dict(row)
 async def redeem(self,db,org,actor,p):
  async with db.transaction():
   old=await db.fetchrow("select * from public.reward_redemptions where organization_id=$1 and participant_user_id=$2 and idempotency_key=$3",org,actor,p.idempotency_key)
   if old:return dict(old)
   a,b=await self._account(db,org,actor)
   item=await db.fetchrow("select * from public.reward_catalog_items where organization_id=$1 and id=$2 and status='active' and (starts_at is null or starts_at<=now()) and (ends_at is null or ends_at>now()) for update",org,p.catalog_item_id)
   if not item:raise APIError(404,"reward_item_unavailable","Reward item is unavailable.")
   elig=item["eligibility"] or {}
   if elig.get("minimum_balance") and b<int(elig["minimum_balance"]):raise APIError(403,"reward_eligibility_denied","Minimum balance is not met.")
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
 async def redemptions(self,db,org,user,page,size):
  total=await db.fetchval("select count(*) from public.reward_redemptions where organization_id=$1 and participant_user_id=$2",org,user)
  rows=await db.fetch("select r.*,c.code catalog_code,c.name catalog_name,c.category from public.reward_redemptions r join public.reward_catalog_items c on c.organization_id=r.organization_id and c.id=r.catalog_item_id where r.organization_id=$1 and r.participant_user_id=$2 order by r.requested_at desc limit $3 offset $4",org,user,size,(page-1)*size)
  return {"items":[dict(r) for r in rows],"page":page,"page_size":size,"total":total}
 async def _refund(self,db,org,actor,row,reason,key):
  original=await db.fetchrow("select * from public.reward_points_ledger where organization_id=$1 and reference_type='redemption' and reference_id=$2 and entry_type='redemption' for update",org,row["id"])
  if not original:raise APIError(500,"reward_redemption_ledger_missing","Redemption debit is missing.")
  if await db.fetchval("select exists(select 1 from public.reward_points_ledger where reversal_of=$1)",original["id"]):return
  a,b=await self._account(db,org,row["participant_user_id"]); delta=-int(original["points_delta"])
  await db.execute("""insert into public.reward_points_ledger(organization_id,account_id,participant_user_id,entry_type,points_delta,balance_before,balance_after,source_type,source_id,reference_type,reference_id,actor_user_id,idempotency_key,reason,reversal_of)
   values($1,$2,$3,'reversal',$4,$5,$6,'redemption',$7,'redemption',$7,$8,$9,$10,$11)""",org,a["id"],row["participant_user_id"],delta,b,b+delta,row["id"],actor,key,reason,original["id"])
  await db.execute("update public.reward_accounts set points_balance=$3,updated_at=now() where organization_id=$1 and id=$2",org,a["id"],b+delta)
 async def decide_redemption(self,db,org,actor,rid,p):
  async with db.transaction():
   row=await db.fetchrow("select * from public.reward_redemptions where organization_id=$1 and id=$2 for update",org,rid)
   if not row or row["status"]!="requested":raise APIError(409,"reward_redemption_transition_invalid","Only requested redemption can be decided.")
   if p.decision=="rejected":
    await self._refund(db,org,actor,row,p.reason or "Rejected","reject:"+str(rid))
    await db.execute("update public.reward_catalog_items set quantity_reserved=quantity_reserved-$3 where organization_id=$1 and id=$2",org,row["catalog_item_id"],row["quantity"])
   await db.execute("update public.reward_redemptions set status=$3,decided_by=$4,decided_at=now(),reason=$5,updated_at=now() where organization_id=$1 and id=$2",org,rid,p.decision,actor,p.reason)
   await db.execute("insert into public.reward_redemption_history(organization_id,redemption_id,from_status,to_status,actor_user_id,reason) values($1,$2,$3,$4,$5,$6)",org,rid,row["status"],p.decision,actor,p.reason)
   await self._audit(db,org,actor,"redemption."+p.decision,"reward_redemption",rid,p.reason)
   return dict(await db.fetchrow("select * from public.reward_redemptions where organization_id=$1 and id=$2",org,rid))
 async def cancel_redemption(self,db,org,actor,rid):
  async with db.transaction():
   row=await db.fetchrow("select * from public.reward_redemptions where organization_id=$1 and id=$2 for update",org,rid)
   if not row or row["participant_user_id"]!=actor:raise APIError(404,"reward_redemption_not_found","Redemption not found.")
   if row["status"] not in ("requested","approved"):raise APIError(409,"reward_redemption_transition_invalid","Redemption cannot be cancelled.")
   await self._refund(db,org,actor,row,"Participant cancellation","cancel:"+str(rid))
   await db.execute("update public.reward_catalog_items set quantity_reserved=quantity_reserved-$3 where organization_id=$1 and id=$2",org,row["catalog_item_id"],row["quantity"])
   await db.execute("update public.reward_redemptions set status='cancelled',updated_at=now() where organization_id=$1 and id=$2",org,rid)
   await db.execute("insert into public.reward_redemption_history(organization_id,redemption_id,from_status,to_status,actor_user_id,reason) values($1,$2,$3,'cancelled',$4,'Participant cancellation')",org,rid,row["status"],actor)
   await self._audit(db,org,actor,"redemption.cancelled","reward_redemption",rid);return {"id":str(rid),"status":"cancelled"}
 async def fulfill_redemption(self,db,org,actor,rid,p):
  async with db.transaction():
   row=await db.fetchrow("select * from public.reward_redemptions where organization_id=$1 and id=$2 for update",org,rid)
   if not row or row["status"]!="approved":raise APIError(409,"reward_redemption_transition_invalid","Only approved redemption can be fulfilled.")
   await db.execute("update public.reward_catalog_items set quantity_reserved=quantity_reserved-$3,quantity_fulfilled=quantity_fulfilled+$3,updated_at=now() where organization_id=$1 and id=$2",org,row["catalog_item_id"],row["quantity"])
   await db.execute("update public.reward_redemptions set status='fulfilled',fulfilled_by=$3,fulfilled_at=now(),fulfillment_reference=$4,reason=$5,updated_at=now() where organization_id=$1 and id=$2",org,rid,actor,p.fulfillment_reference,p.reason)
   await db.execute("insert into public.reward_redemption_history(organization_id,redemption_id,from_status,to_status,actor_user_id,reason) values($1,$2,$3,'fulfilled',$4,$5)",org,rid,row["status"],actor,p.reason)
   await self._audit(db,org,actor,"redemption.fulfilled","reward_redemption",rid,p.reason);return dict(await db.fetchrow("select * from public.reward_redemptions where organization_id=$1 and id=$2",org,rid))
 async def adjust(self,db,org,actor,p):
  async with db.transaction():
   a,b=await self._account(db,org,p.participant_user_id);after=b+p.points_delta
   if after<0:raise APIError(409,"insufficient_reward_points","Adjustment cannot create a negative balance.")
   old=await db.fetchrow("select * from public.reward_points_ledger where organization_id=$1 and participant_user_id=$2 and idempotency_key=$3",org,p.participant_user_id,p.idempotency_key)
   if old:return dict(old)
   r=await db.fetchrow("""insert into public.reward_points_ledger(organization_id,account_id,participant_user_id,entry_type,points_delta,balance_before,balance_after,source_type,source_id,reference_type,reference_id,actor_user_id,idempotency_key,reason)
    values($1,$2,$3,'adjustment',$4,$5,$6,'manual',$7,$8,$9,$10,$11,$12) returning *""",org,a["id"],p.participant_user_id,p.points_delta,b,after,p.reference_id,p.reference_type,p.reference_id,actor,p.idempotency_key,p.reason)
   await db.execute("update public.reward_accounts set points_balance=$3,updated_at=now() where organization_id=$1 and id=$2",org,a["id"],after)
   await self._audit(db,org,actor,"points.adjusted","reward_points_ledger",r["id"],p.reason,{"delta":p.points_delta});return dict(r)
 async def reverse(self,db,org,actor,eid,p):
  async with db.transaction():
   old=await db.fetchrow("select * from public.reward_points_ledger where organization_id=$1 and id=$2 for update",org,eid)
   if not old:raise APIError(404,"reward_ledger_entry_not_found","Ledger entry not found.")
   if await db.fetchval("select exists(select 1 from public.reward_points_ledger where reversal_of=$1)",eid):raise APIError(409,"reward_entry_already_reversed","Entry already reversed.")
   a,b=await self._account(db,org,old["participant_user_id"]);delta=-int(old["points_delta"]);after=b+delta
   if after<0:raise APIError(409,"reward_reversal_insufficient_balance","Reversal would make balance negative.")
   r=await db.fetchrow("""insert into public.reward_points_ledger(organization_id,account_id,participant_user_id,entry_type,points_delta,balance_before,balance_after,source_type,source_id,reference_type,reference_id,actor_user_id,idempotency_key,reason,reversal_of)
    values($1,$2,$3,'reversal',$4,$5,$6,'ledger',$7,'ledger',$7,$8,$9,$10,$11) returning *""",org,a["id"],old["participant_user_id"],delta,b,after,eid,actor,p.idempotency_key,p.reason,eid)
   await db.execute("update public.reward_accounts set points_balance=$3,updated_at=now() where organization_id=$1 and id=$2",org,a["id"],after)
   await self._audit(db,org,actor,"points.reversed","reward_points_ledger",r["id"],p.reason,{"reversed_entry_id":str(eid)});return dict(r)
 async def report(self,db,org,page,size):
  r=await db.fetchrow("""select coalesce(sum(case when entry_type='earn' then points_delta else 0 end),0)::bigint earned_points,
   coalesce(sum(case when entry_type='redemption' then -points_delta else 0 end),0)::bigint redeemed_points,
   coalesce(sum(case when entry_type='adjustment' then points_delta else 0 end),0)::bigint adjusted_points,
   count(*) ledger_entries,count(distinct participant_user_id) participants from public.reward_points_ledger where organization_id=$1""",org)
  pending=await db.fetchval("select count(*) from public.reward_redemptions where organization_id=$1 and status in ('requested','approved')",org)
  return {**dict(r),"pending_redemptions":pending,"page":page,"page_size":size}
smart_reward_service=SmartRewardService()
