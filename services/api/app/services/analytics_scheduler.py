from __future__ import annotations

import asyncio
import csv
import io
import json
import logging
import urllib.request
from datetime import timedelta
from uuid import uuid4

import asyncpg

from app.config import Settings

logger=logging.getLogger("salesx.analytics.scheduler")
LOCK_ID=88081208
BUCKET="analytics-private"


def _delete(settings:Settings,path:str)->None:
    if settings.supabase_secret_key is None:
        raise RuntimeError("SUPABASE_SECRET_KEY is required for private analytics export cleanup.")
    key=settings.supabase_secret_key.get_secret_value()
    request=urllib.request.Request(
        f"{str(settings.supabase_url).rstrip('/')}/storage/v1/object/{BUCKET}/{path}",
        method="DELETE",
        headers={"Authorization":"Bearer "+key,"apikey":key},
    )
    with urllib.request.urlopen(request,timeout=20) as response:
        response.read()


def _upload(settings:Settings,path:str,data:bytes)->None:
    if settings.supabase_secret_key is None:
        raise RuntimeError("SUPABASE_SECRET_KEY is required for private analytics export storage.")
    key=settings.supabase_secret_key.get_secret_value()
    request=urllib.request.Request(
        f"{str(settings.supabase_url).rstrip('/')}/storage/v1/object/{BUCKET}/{path}",
        data=data,method="POST",
        headers={"Authorization":"Bearer "+key,"apikey":key,"Content-Type":"text/csv","x-upsert":"true"},
    )
    with urllib.request.urlopen(request,timeout=30) as response:
        response.read()


async def _seed_schedules(connection:asyncpg.Connection)->None:
    await connection.execute(
        """insert into public.analytics_scheduled_jobs
           (organization_id,job_key,job_type,schedule_kind,local_time,timezone,next_run_at)
           select o.id,'analytics.daily.refresh','refresh_daily','daily','00:15'::time,o.timezone,
             now()
           from public.organizations o where o.status='active'
           on conflict(organization_id,job_key) do nothing"""
    )


async def _claim_schedules(connection:asyncpg.Connection,worker_id:str):
    return await connection.fetch(
        """with due as (
             select id,coalesce(retry_at,last_run_at,next_run_at) scheduled_for,
                    (retry_at is not null or lease_expires_at is not null) retrying
             from public.analytics_scheduled_jobs
             where enabled
               and (coalesce(retry_at,next_run_at)<=now() or lease_expires_at<now())
               and (lease_owner is null or lease_expires_at<now())
             order by coalesce(retry_at,last_run_at,next_run_at)
             for update skip locked limit 20
           ), advanced as (
             update public.analytics_scheduled_jobs j
             set last_run_at=now(),updated_at=now(),
                 attempt_count=case when due.retrying then j.attempt_count+1 else 1 end,
                 retry_at=null,lease_owner=$1,lease_expires_at=now()+interval '5 minutes',
                 next_run_at=case when due.retrying then j.next_run_at else
                   case j.schedule_kind
                     when 'interval' then now()+make_interval(mins=>j.interval_minutes)
                     when 'daily' then ((now() at time zone j.timezone)::date+1+j.local_time) at time zone j.timezone
                     when 'weekly' then (
                       ((now() at time zone j.timezone)::date
                         + ((j.day_of_week-extract(dow from (now() at time zone j.timezone))::int+7)%7)
                         + case when (
                           ((now() at time zone j.timezone)::date
                             + ((j.day_of_week-extract(dow from (now() at time zone j.timezone))::int+7)%7)
                             + j.local_time) <= (now() at time zone j.timezone)
                           ) then 7 else 0 end
                         + j.local_time
                       ) at time zone j.timezone
                     )
                     when 'monthly' then (((date_trunc('month',now() at time zone j.timezone)::date
                       + interval '1 month'+(j.day_of_month-1)*interval '1 day')::date+j.local_time) at time zone j.timezone)
                   end
                 end
             from due where j.id=due.id returning j.*,due.scheduled_for
           ) select * from advanced""",
        worker_id,
    )

async def _refresh(connection:asyncpg.Connection,organization_id,lookback:int)->dict:
    tz=await connection.fetchval("select timezone from public.organizations where id=$1",organization_id) or "UTC"
    end=await connection.fetchval("select (now() at time zone $1)::date",tz)
    start=end-timedelta(days=lookback-1)
    async with connection.transaction():
        await connection.execute("select set_config('TimeZone',$1,true)",tz)
        await connection.fetchval("select public.analytics_refresh_daily_metrics($1,$2,$3)",organization_id,start,end)
        await connection.fetchval("select public.analytics_refresh_scoped_daily_metrics($1,$2,$3)",organization_id,start,end)
        await connection.fetchval("select public.analytics_refresh_scoped_aux_metrics($1,$2,$3)",organization_id,start,end)
        await connection.fetchval("select public.analytics_refresh_period_rollups($1,$2,$3)",organization_id,start,end)
    return {"period_start":str(start),"period_end":str(end),"timezone":tz}


async def _run_schedule(connection:asyncpg.Connection,job:asyncpg.Record)->None:
    key=f"{job['id']}:{job['scheduled_for'].isoformat()}:{job['attempt_count']}"
    execution=await connection.fetchval(
        """insert into public.analytics_job_executions
           (organization_id,scheduled_job_id,job_type,idempotency_key,status,attempt_count)
           values($1,$2,$3,$4,'running',$5) on conflict(organization_id,idempotency_key)
           do nothing returning id""",
        job["organization_id"],job["id"],job["job_type"],key,job["attempt_count"],
    )
    if not execution:
        return
    try:
        if job["job_type"] not in {"refresh_daily","refresh_weekly","refresh_monthly"}:
            raise RuntimeError("unsupported_analytics_schedule_job")
        lookback=int((job["parameters"] or {}).get("lookback_days",366))
        if not 1<=lookback<=366:
            raise ValueError("analytics_lookback_days_out_of_range")
        metadata=await _refresh(connection,job["organization_id"],lookback)
        await connection.execute(
            "update public.analytics_job_executions set status='completed',completed_at=now(),metadata=$2::jsonb where id=$1",
            execution,json.dumps(metadata),
        )
        await connection.execute(
            "update public.analytics_scheduled_jobs set last_status='completed',last_error=null,attempt_count=0,retry_at=null,lease_owner=null,lease_expires_at=null where id=$1",job["id"]
        )
    except Exception as exc:
        await connection.execute(
            """update public.analytics_job_executions set status='failed',completed_at=now(),
               error_code='analytics_job_failed',error_message=$2 where id=$1""",execution,str(exc)[:1000]
        )
        await connection.execute(
            "update public.analytics_scheduled_jobs set last_status='failed',last_error=$2,
               retry_at=case when attempt_count<max_attempts then now()+make_interval(secs=>least((power(2,attempt_count))::int,3600)) else null end,lease_owner=null,lease_expires_at=null where id=$1",
            job["id"],str(exc)[:1000],
        )
        raise


async def _claim_exports(connection:asyncpg.Connection,worker_id:str):
    return await connection.fetch(
        """with picked as (
             select id from public.analytics_report_exports
             where ((status='queued') or (status='failed' and next_attempt_at<=now())
               or (status='running' and lease_expires_at<now()))
               and next_attempt_at<=now() and attempt_count<max_attempts
             order by requested_at for update skip locked limit 5
           )
           update public.analytics_report_exports e
           set status='running',attempt_count=attempt_count+1,lease_owner=$1,
               lease_expires_at=now()+interval '5 minutes',started_at=coalesce(started_at,now()),updated_at=now()
           from picked where e.id=picked.id returning e.*""",worker_id
    )


async def _run_export(connection:asyncpg.Connection,settings:Settings,job:asyncpg.Record)->None:
    run=await connection.fetchrow(
        "select * from public.analytics_report_runs where id=$1 and organization_id=$2",
        job["report_run_id"],job["organization_id"],
    )
    if not run:
        raise RuntimeError("report_run_not_found")
    rows=await connection.fetch(
        """select s.metric_key,d.display_name,s.period_grain,s.period_start,s.period_end,s.scope_type,
                  s.scope_id,s.metric_value,d.unit,s.source_watermark,s.calculated_at
           from public.analytics_metric_snapshots s
           join public.analytics_metric_definitions d on d.metric_key=s.metric_key
           where s.organization_id=$1 and s.period_grain=$2 and s.period_end >= $3 and s.period_start <= $4
             and (($5='tenant' and s.scope_type='tenant') or ($5<>'tenant' and s.scope_type=$5 and s.scope_id=$6))
           order by s.period_start,s.metric_key,s.scope_type,s.scope_id""",
        run["organization_id"],run["period_grain"],run["period_start"],run["period_end"],run["scope_type"],run["scope_id"],
    )
    output=io.StringIO(newline="")
    writer=csv.writer(output)
    writer.writerow(["metric_key","metric_name","period_grain","period_start","period_end","scope_type","scope_id","value","unit","source_watermark","calculated_at"])
    for row in rows:
        writer.writerow([row["metric_key"],row["display_name"],row["period_grain"],row["period_start"].isoformat(),
          row["period_end"].isoformat(),row["scope_type"],str(row["scope_id"] or ""),str(row["metric_value"]),row["unit"],
          row["source_watermark"].isoformat() if row["source_watermark"] else "",row["calculated_at"].isoformat()])
    data=output.getvalue().encode("utf-8-sig")
    artifact=f"{job['organization_id']}/{run['id']}/{job['id']}.csv"
    await asyncio.to_thread(_upload,settings,artifact,data)
    await connection.execute(
        """update public.analytics_report_exports set status='completed',artifact_path=$2,artifact_bytes=$3,
           row_count=$4,data_as_of=(select max(calculated_at) from public.analytics_metric_snapshots
             where organization_id=$5 and period_grain=$6 and period_end >= $7 and period_start <= $8),
           completed_at=now(),lease_owner=null,lease_expires_at=null,updated_at=now() where id=$1""",
        job["id"],artifact,len(data),len(rows),run["organization_id"],run["period_grain"],run["period_start"],run["period_end"],
    )
    await connection.execute(
        """update public.analytics_report_runs set status='completed',completed_at=now(),row_count=$2,
           artifact_path=$3,data_as_of=now() where id=$1 and organization_id=$4""",
        run["id"],len(rows),artifact,run["organization_id"],
    )


async def _cleanup_expired_exports(connection:asyncpg.Connection,settings:Settings)->None:
    rows=await connection.fetch(
        """select id,organization_id,report_run_id,artifact_path
           from public.analytics_report_exports
           where status='completed' and artifact_path is not null and expires_at<=now()
           order by expires_at limit 20"""
    )
    for row in rows:
        try:
            await asyncio.to_thread(_delete,settings,row["artifact_path"])
            await connection.execute(
                """update public.analytics_report_exports
                   set artifact_path=null,artifact_deleted_at=now(),updated_at=now()
                   where id=$1 and artifact_path=$2""",row["id"],row["artifact_path"]
            )
            await connection.execute(
                """update public.analytics_report_runs set artifact_path=null
                   where id=$1 and organization_id=$2""",row["report_run_id"],row["organization_id"]
            )
        except Exception:
            await connection.execute(
                "update public.analytics_report_exports set cleanup_attempt_count=cleanup_attempt_count+1,updated_at=now() where id=$1",
                row["id"],
            )
            logger.exception("analytics_export_cleanup_failed",extra={"export_id":str(row["id"])})


async def _export_iteration(connection:asyncpg.Connection,settings:Settings,worker_id:str)->None:
    for job in await _claim_exports(connection,worker_id):
        try:
            await _run_export(connection,settings,job)
        except Exception as exc:
            attempts=job["attempt_count"]
            terminal=attempts>=job["max_attempts"]
            delay=min(2**min(attempts,10),3600)
            await connection.execute(
                """update public.analytics_report_exports set status=$2,error_code='analytics_export_failed',
                   error_message=$3,last_error_at=now(),next_attempt_at=now()+make_interval(secs=>$4),
                   lease_owner=null,lease_expires_at=null,updated_at=now() where id=$1""",
                job["id"],"failed" if terminal else "queued",str(exc)[:1000],delay,
            )
            await connection.execute(
                "update public.analytics_report_runs set status=$2,error_code='analytics_export_failed',error_message=$3 where id=$1",
                job["report_run_id"],"failed" if terminal else "queued",str(exc)[:1000],
            )
            logger.exception("analytics_export_failed",extra={"export_id":str(job["id"])})


async def analytics_scheduler_loop(pool:asyncpg.Pool,settings:Settings)->None:
    worker_id=f"api-{uuid4()}"
    while True:
        try:
            async with pool.acquire() as connection:
                locked=await connection.fetchval("select pg_try_advisory_lock($1)",LOCK_ID)
                if not locked:
                    await asyncio.sleep(30)
                    continue
                logger.info("analytics_scheduler_started",extra={"worker_id":worker_id})
                try:
                    while True:
                        try:
                            await _seed_schedules(connection)
                            for job in await _claim_schedules(connection,worker_id):
                                try:
                                    await _run_schedule(connection,job)
                                except Exception:
                                    logger.exception("analytics_schedule_failed",extra={"job_id":str(job["id"])})
                            await _export_iteration(connection,settings,worker_id)
                            await _cleanup_expired_exports(connection,settings)
                        except (asyncpg.PostgresConnectionError,asyncpg.InterfaceError):
                            logger.exception("analytics_scheduler_connection_lost")
                            break
                        except Exception:
                            logger.exception("analytics_scheduler_iteration_failed")
                        await asyncio.sleep(30)
                finally:
                    if not connection.is_closed():
                        await connection.execute("select pg_advisory_unlock($1)",LOCK_ID)
        except asyncio.CancelledError:
            raise
        except Exception:
            logger.exception("analytics_scheduler_reconnect_failed")
        await asyncio.sleep(10)
