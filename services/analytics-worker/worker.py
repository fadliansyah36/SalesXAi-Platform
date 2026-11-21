from __future__ import annotations

import asyncio
import csv
import io
import json
import logging
import os
import ssl
import urllib.error
import urllib.request
from datetime import date, datetime, timedelta, timezone
from pathlib import Path
from uuid import uuid4

import asyncpg

logging.basicConfig(level=os.getenv("LOG_LEVEL", "INFO"))
logger = logging.getLogger("salesx.analytics")
LOCK_ID = 88081208
BUCKET = "analytics-private"


def database_ssl_context() -> ssl.SSLContext:
    context = ssl.create_default_context(purpose=ssl.Purpose.SERVER_AUTH)
    ca_path = Path(os.getenv("SUPABASE_DATABASE_CA", "services/api/certs/supabase-prod-ca-2021.crt"))
    if ca_path.is_file():
        context.load_verify_locations(cafile=str(ca_path))
    context.check_hostname = True
    context.verify_mode = ssl.CERT_REQUIRED
    return context


def storage_request(method: str, path: str, payload: bytes | None = None, content_type: str = "application/json"):
    base = os.getenv("SUPABASE_URL", "https://eyofuiyxalbehbqoaeny.supabase.co").rstrip("/")
    key = os.getenv("SUPABASE_SECRET_KEY") or os.getenv("SUPABASE_SERVICE_ROLE_KEY")
    if not key:
        raise RuntimeError("SUPABASE_SECRET_KEY is required by the server-side analytics export worker.")
    request = urllib.request.Request(
        base + "/storage/v1/" + path.lstrip("/"),
        data=payload,
        method=method,
        headers={
            "Authorization": "Bearer " + key,
            "apikey": key,
            "Content-Type": content_type,
            "x-upsert": "true",
        },
    )
    with urllib.request.urlopen(request, timeout=30) as response:
        return response.read()


async def refresh_organization(connection: asyncpg.Connection, organization_id, lookback: int):
    timezone_name = await connection.fetchval(
        "select timezone from public.organizations where id=$1", organization_id
    ) or "UTC"
    end_date = await connection.fetchval(
        "select (now() at time zone $1)::date", timezone_name
    )
    start_date = end_date - timedelta(days=lookback - 1)
    async with connection.transaction():
        await connection.execute("select set_config('TimeZone',$1,true)", timezone_name)
        await connection.fetchval(
            "select public.analytics_refresh_daily_metrics($1,$2,$3)",
            organization_id, start_date, end_date,
        )
        await connection.fetchval(
            "select public.analytics_refresh_scoped_daily_metrics($1,$2,$3)",
            organization_id, start_date, end_date,
        )
        await connection.fetchval(
            "select public.analytics_refresh_scoped_aux_metrics($1,$2,$3)",
            organization_id, start_date, end_date,
        )
        await connection.fetchval(
            "select public.analytics_refresh_period_rollups($1,$2,$3)",
            organization_id, start_date, end_date,
        )
    return start_date, end_date


async def process_export(connection: asyncpg.Connection, job: asyncpg.Record):
    export_id = job["id"]
    run = await connection.fetchrow(
        """select r.* from public.analytics_report_runs r
           where r.id=$1 and r.organization_id=$2""",
        job["report_run_id"], job["organization_id"],
    )
    if not run:
        raise RuntimeError("report_run_not_found")
    rows = await connection.fetch(
        """select s.metric_key,d.display_name,s.period_grain,s.period_start,s.period_end,
                  s.scope_type,s.scope_id,s.metric_value,d.unit,s.source_watermark,s.calculated_at
           from public.analytics_metric_snapshots s
           join public.analytics_metric_definitions d on d.metric_key=s.metric_key
           where s.organization_id=$1 and s.period_grain=$2
             and s.period_end >= $3 and s.period_start <= $4
             and (($5='tenant' and s.scope_type='tenant') or
                  ($5<>'tenant' and s.scope_type=$5 and s.scope_id=$6))
           order by s.period_start,s.metric_key,s.scope_type,s.scope_id""",
        run["organization_id"], run["period_grain"], run["period_start"], run["period_end"],
        run["scope_type"], run["scope_id"],
    )
    output = io.StringIO(newline="")
    writer = csv.writer(output)
    writer.writerow([
        "metric_key", "metric_name", "period_grain", "period_start", "period_end",
        "scope_type", "scope_id", "value", "unit", "source_watermark", "calculated_at",
    ])
    for row in rows:
        writer.writerow([
            row["metric_key"], row["display_name"], row["period_grain"],
            row["period_start"].isoformat(), row["period_end"].isoformat(),
            row["scope_type"], str(row["scope_id"] or ""), str(row["metric_value"]),
            row["unit"], row["source_watermark"].isoformat() if row["source_watermark"] else "",
            row["calculated_at"].isoformat(),
        ])
    data = output.getvalue().encode("utf-8-sig")
    path = f"{job['organization_id']}/{run['id']}/{export_id}.csv"
    await asyncio.to_thread(
        storage_request, "POST", f"object/{BUCKET}/{path}", data, "text/csv"
    )
    await connection.execute(
        """update public.analytics_report_exports
           set status='completed',artifact_path=$2,artifact_bytes=$3,row_count=$4,
               data_as_of=(select max(calculated_at) from public.analytics_metric_snapshots
                 where organization_id=$5 and period_grain=$6 and period_end >= $7 and period_start <= $8),
               completed_at=now(),lease_owner=null,lease_expires_at=null,updated_at=now()
           where id=$1""",
        export_id, path, len(data), len(rows), run["organization_id"],
        run["period_grain"], run["period_start"], run["period_end"],
    )
    await connection.execute(
        """update public.analytics_report_runs set status='completed',completed_at=now(),
           row_count=$2,artifact_path=$3,data_as_of=now()
           where id=$1 and organization_id=$4""",
        run["id"], len(rows), path, run["organization_id"],
    )


async def claim_exports(connection: asyncpg.Connection, worker_id: str, limit: int = 5):
    async with connection.transaction():
        return await connection.fetch(
            """with picked as (
                 select id from public.analytics_report_exports
                 where (status='queued' or (status='failed' and next_attempt_at<=now())
                    or (status='running' and lease_expires_at<now()))
                   and next_attempt_at<=now() and attempt_count<max_attempts
                 order by requested_at for update skip locked limit $1
               )
               update public.analytics_report_exports e
               set status='running',attempt_count=attempt_count+1,lease_owner=$2,
                   lease_expires_at=now()+interval '5 minutes',started_at=coalesce(started_at,now()),
                   updated_at=now()
               from picked where e.id=picked.id returning e.*""",
            limit, worker_id,
        )


async def seed_schedules(connection: asyncpg.Connection):
    await connection.execute(
        """insert into public.analytics_scheduled_jobs
           (organization_id,job_key,job_type,schedule_kind,local_time,timezone,next_run_at)
           select o.id,'analytics.daily.refresh','refresh_daily','daily','00:15'::time,o.timezone,
                  ((now() at time zone o.timezone)::date + 1 + time '00:15') at time zone o.timezone
           from public.organizations o where o.status='active'
           on conflict(organization_id,job_key) do nothing"""
    )


async def claim_due_schedules(connection:asyncpg.Connection,worker_id: str, limit: int = 20):
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
                     when 'weekly' then (((now() at time zone j.timezone)::date
                       + ((j.day_of_week-extract(dow from (now() at time zone j.timezone)::date)::int+7)%7)
                       + case when ((now() at time zone j.timezone)::date
                         + ((j.day_of_week-extract(dow from (now() at time zone j.timezone)::date)::int+7)%7))
                         <= (now() at time zone j.timezone)::date then 7 else 0 end+j.local_time) at time zone j.timezone
                     when 'monthly' then (((date_trunc('month',now() at time zone j.timezone)::date
                       + interval '1 month'+(j.day_of_month-1)*interval '1 day')::date+j.local_time) at time zone j.timezone)
                   end
                 end
             from due where j.id=due.id returning j.*,due.scheduled_for
           ) select * from advanced""",
        worker_id,
    )

async def execute_schedule(connection: asyncpg.Connection, job: asyncpg.Record, worker_id: str):
    due_key = f"{job['id']}:{job['scheduled_for'].isoformat()}:{job['attempt_count']}"
    inserted = await connection.fetchval(
        """insert into public.analytics_job_executions
           (organization_id,scheduled_job_id,job_type,idempotency_key,status,attempt_count)
           values($1,$2,$3,$4,'running',$5)
           on conflict(organization_id,idempotency_key) do nothing returning id""",
        job["organization_id"], job["id"], job["job_type"], due_key, job["attempt_count"],
    )
    if not inserted:
        return
    try:
        if job["job_type"] in {"refresh_daily", "refresh_weekly", "refresh_monthly"}:
            lookback = int(job["parameters"].get("lookback_days", os.getenv("ANALYTICS_LOOKBACK_DAYS", "366")))
            if lookback < 1 or lookback > 366:
                raise ValueError("analytics_lookback_days_out_of_range")
            start, end = await refresh_organization(connection, job["organization_id"], lookback)
            metadata = {"period_start": str(start), "period_end": str(end)}
        else:
            metadata = {"status": "unsupported_schedule_job"}
            raise ValueError("unsupported_analytics_schedule_job")
        await connection.execute(
            """update public.analytics_job_executions set status='completed',completed_at=now(),metadata=$2::jsonb where id=$1""",
            inserted, json.dumps(metadata),
        )
        await connection.execute(
            """update public.analytics_scheduled_jobs set last_status='completed',last_error=null,attempt_count=0,retry_at=null,lease_owner=null,lease_expires_at=null where id=$1""",
            job["id"],
        )
    except Exception as exc:
        await connection.execute(
            """update public.analytics_job_executions set status='failed',completed_at=now(),
               error_code='analytics_job_failed',error_message=$2 where id=$1""",
            inserted, str(exc)[:1000],
        )
        await connection.execute(
            """update public.analytics_scheduled_jobs set last_status='failed',last_error=$2,
               retry_at=case when attempt_count<max_attempts then now()+make_interval(secs=>least((power(2,attempt_count))::int,3600)) else null end,lease_owner=null,lease_expires_at=null where id=$1""",
            job["id"], str(exc)[:1000],
        )
        raise


async def run_once() -> int:
    dsn = os.getenv("DATABASE_URL")
    if not dsn:
        raise RuntimeError("DATABASE_URL must point to the bound SalesX-Ai Supabase project.")
    lookback = int(os.getenv("ANALYTICS_LOOKBACK_DAYS", "366"))
    if not 1 <= lookback <= 366:
        raise ValueError("ANALYTICS_LOOKBACK_DAYS must be between 1 and 366.")
    connection = await asyncpg.connect(
        dsn=dsn, ssl=database_ssl_context(),
        command_timeout=float(os.getenv("ANALYTICS_DB_TIMEOUT_SECONDS", "120")),
        server_settings={"application_name": "salesx-analytics-worker"},
    )
    try:
        organizations = await connection.fetch("select id from public.organizations where status='active' order by id")
        completed = 0
        for organization in organizations:
            await refresh_organization(connection, organization["id"], lookback)
            completed += 1
        return completed
    finally:
        await connection.close()


async def run_daemon():
    dsn = os.getenv("DATABASE_URL")
    if not dsn:
        raise RuntimeError("DATABASE_URL must point to the bound SalesX-Ai Supabase project.")
    worker_id = os.getenv("RAILWAY_REPLICA_ID") or f"analytics-{uuid4()}"
    connection = await asyncpg.connect(
        dsn=dsn, ssl=database_ssl_context(),
        command_timeout=float(os.getenv("ANALYTICS_DB_TIMEOUT_SECONDS", "120")),
        server_settings={"application_name": "salesx-analytics-scheduler"},
    )
    try:
        locked = await connection.fetchval("select pg_try_advisory_lock($1)", LOCK_ID)
        if not locked:
            logger.info("analytics_scheduler_already_owned")
            return
        logger.info("analytics_scheduler_started", extra={"worker_id": worker_id})
        while True:
            try:
                await seed_schedules(connection)
                due = await claim_due_schedules(connection, worker_id)
                for job in due:
                    try:
                        await execute_schedule(connection, job, worker_id)
                    except Exception:
                        logger.exception("analytics_schedule_failed", extra={"job_id": str(job["id"])})
                exports = await claim_exports(connection, worker_id)
                for job in exports:
                    try:
                        await process_export(connection, job)
                    except Exception as exc:
                        attempts = job["attempt_count"]
                        terminal = attempts >= job["max_attempts"]
                        delay = min(2 ** min(attempts, 10), 3600)
                        await connection.execute(
                            """update public.analytics_report_exports
                               set status=$2,error_code='analytics_export_failed',error_message=$3,
                                   last_error_at=now(),next_attempt_at=now()+make_interval(secs=>$4),
                                   lease_owner=null,lease_expires_at=null,updated_at=now()
                               where id=$1""",
                            job["id"], "failed" if terminal else "queued", str(exc)[:1000], delay,
                        )
                        await connection.execute(
                            """update public.analytics_report_runs set status=$2,error_code='analytics_export_failed',
                               error_message=$3 where id=$1""",
                            job["report_run_id"], "failed" if terminal else "queued", str(exc)[:1000],
                        )
                        logger.exception("analytics_export_failed", extra={"export_id": str(job["id"])})
            except Exception:
                logger.exception("analytics_scheduler_iteration_failed")
            await asyncio.sleep(float(os.getenv("ANALYTICS_SCHEDULER_POLL_SECONDS", "30")))
    finally:
        try:
            await connection.execute("select pg_advisory_unlock($1)", LOCK_ID)
        finally:
            await connection.close()


if __name__ == "__main__":
    mode = os.getenv("ANALYTICS_WORKER_MODE", "daemon").lower()
    asyncio.run(run_once() if mode == "once" else run_daemon())
