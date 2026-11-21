import logging
from os import getenv
import asyncpg
from contextlib import asynccontextmanager
from uuid import uuid4
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from app.config import get_settings
from app.db import create_database_pool
from app.errors import APIError, api_error_handler
from app.routers import admin, audit, auth, master_data, organizations, security, smart_team, smart_order, smart_reward, location, maps, shipping_webhooks
from app.security.jwt import SupabaseJWTVerifier
from app.services.supabase_auth import SupabaseAuthService
from app.services.invitation_email import SMTPInvitationDelivery
from app.services.rate_limit import enforce_request_rate_limit
from app.security.action_matrix import validate_api_action_matrix

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("salesx.api")


@asynccontextmanager
async def lifespan(app: FastAPI):
    validate_api_action_matrix(app.routes)
    settings = get_settings()
    app.state.settings = settings
    app.state.db_pool = None
    app.state.jwt_verifier = SupabaseJWTVerifier(settings)
    app.state.supabase_auth = SupabaseAuthService(settings)
    app.state.invitation_delivery = SMTPInvitationDelivery(settings)
    pool = None
    if settings.database_configured:
        pool = await create_database_pool(settings)
        app.state.db_pool = pool
    try:
        yield
    finally:
        if pool is not None:
            await pool.close()


app = FastAPI(
    title="SalesX-Ai API",
    version="1.0.0",
    description="Identity, tenant context and authorization API.",
    openapi_url="/api/v1/openapi.json",
    docs_url="/api/v1/docs",
    redoc_url=None,
    lifespan=lifespan,
)
settings = get_settings()
if settings.allowed_origins:
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.allowed_origins,
        allow_credentials=True,
        allow_methods=["GET", "POST", "PATCH", "PUT", "DELETE", "OPTIONS"],
        allow_headers=[
            "Authorization",
            "Content-Type",
            "X-Organization-ID",
            "X-Correlation-ID",
            "X-Resource-Branch-ID",
            "X-Client-Platform",
            "X-File-Name",
        ],
        expose_headers=["X-Correlation-ID"],
    )


@app.middleware("http")
async def correlation_id_middleware(request: Request, call_next):
    correlation_id = request.headers.get("x-correlation-id") or str(uuid4())
    request.state.correlation_id = correlation_id
    try:
        await enforce_request_rate_limit(request)
    except APIError as exc:
        response = JSONResponse(
            status_code=exc.status_code,
            headers=exc.headers,
            content={
                "error": {
                    "code": exc.code,
                    "message": exc.message,
                    "correlation_id": correlation_id,
                }
            },
        )
    else:
        content_length = request.headers.get("content-length")
        if content_length is None and request.headers.get("transfer-encoding"):
            response = JSONResponse(
                status_code=411,
                content={
                    "error": {
                        "code": "content_length_required",
                        "message": "Chunked request bodies are not accepted by this API.",
                        "correlation_id": correlation_id,
                    }
                },
            )
        elif content_length is not None:
            try:
                declared_length = int(content_length)
            except ValueError:
                response = JSONResponse(
                    status_code=400,
                    content={
                        "error": {
                            "code": "invalid_content_length",
                            "message": "Content-Length must be a valid non-negative integer.",
                            "correlation_id": correlation_id,
                        }
                    },
                )
            else:
                if declared_length < 0:
                    response = JSONResponse(
                        status_code=400,
                        content={
                            "error": {
                                "code": "invalid_content_length",
                                "message": "Content-Length must be a valid non-negative integer.",
                                "correlation_id": correlation_id,
                            }
                        },
                    )
                elif declared_length > settings.max_request_body_bytes:
                    response = JSONResponse(
                        status_code=413,
                        content={
                            "error": {
                                "code": "request_too_large",
                                "message": "The request body exceeds the configured API limit.",
                                "correlation_id": correlation_id,
                            }
                        },
                    )
                else:
                    response = await call_next(request)
        else:
            response = await call_next(request)
    response.headers["X-Correlation-ID"] = correlation_id
    response.headers["Cache-Control"] = "no-store"
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["Referrer-Policy"] = "no-referrer"
    response.headers["Permissions-Policy"] = "camera=(), microphone=(), geolocation=(self)"
    response.headers["Cross-Origin-Resource-Policy"] = "same-site"
    if request.url.scheme == "https":
        response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
    return response


@app.exception_handler(APIError)
async def handle_api_error(request: Request, exc: APIError):
    if exc.status_code == 403 and not getattr(request.state, "authorization_denial_audited", False):
        principal = getattr(request.state, "principal", None)
        pool = getattr(request.app.state, "db_pool", None)
        if principal is not None and pool is not None:
            try:
                async with pool.acquire() as connection:
                    import json

                    tenant = getattr(request.state, "tenant_context", None)
                    await connection.execute(
                        """insert into public.admin_audit_logs
                          (actor_user_id,organization_id,action,resource_type,resource_id,correlation_id,user_agent,metadata)
                          values ($1,$2,'authorization.denied','api_action',$3,$4,$5,$6::jsonb)""",
                        principal.user_id,
                        tenant.organization_id if tenant else None,
                        request.url.path[:512],
                        getattr(request.state, "correlation_id", None),
                        request.headers.get("user-agent", "")[:512],
                        json.dumps(
                            {
                                "method": request.method,
                                "permission": getattr(request.state, "required_permission", None),
                                "outcome": "denied",
                            }
                        ),
                    )
            except Exception:
                logger.exception(
                    "authorization_denial_audit_failed",
                    extra={"correlation_id": getattr(request.state, "correlation_id", None)},
                )
    return await api_error_handler(request, exc)


@app.exception_handler(Exception)
async def handle_unexpected_error(request: Request, exc: Exception):
    logger.exception("Unhandled API exception")
    return JSONResponse(
        status_code=500,
        content={
            "error": {
                "code": "internal_error",
                "message": "An unexpected server error occurred.",
                "correlation_id": getattr(request.state, "correlation_id", None),
            }
        },
    )


@app.get("/healthz", tags=["operations"])
async def healthz():
    return {"status": "ok"}


@app.get("/readyz", tags=["operations"])
async def readyz(request: Request):
    pool = getattr(request.app.state, "db_pool", None)
    if pool is None:
        raise APIError(
            503,
            "database_not_ready",
            "DATABASE_URL is not configured for the bound Supabase PostgreSQL project.",
        )
    try:
        async with pool.acquire() as connection:
            await connection.fetchval("select 1")
    except (asyncpg.PostgresError, TimeoutError, OSError) as exc:
        raise APIError(
            503, "database_unavailable", "Supabase PostgreSQL readiness check failed."
        ) from exc
    return {"status": "ready", "database": "connected", "source_commit": getenv("RAILWAY_GIT_COMMIT_SHA", "unknown")}


app.include_router(auth.router, prefix="/api/v1")
app.include_router(admin.router, prefix="/api/v1")
app.include_router(organizations.router, prefix="/api/v1")
app.include_router(master_data.router, prefix="/api/v1")
app.include_router(smart_team.router, prefix="/api/v1")
app.include_router(smart_order.router, prefix="/api/v1")
app.include_router(smart_reward.router, prefix="/api/v1")
app.include_router(location.router, prefix="/api/v1")
app.include_router(maps.router, prefix="/api/v1")
app.include_router(audit.router, prefix="/api/v1")
app.include_router(security.router, prefix="/api/v1")
app.include_router(shipping_webhooks.router)
