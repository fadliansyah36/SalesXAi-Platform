import logging
import asyncpg
from contextlib import asynccontextmanager
from uuid import uuid4
from fastapi import FastAPI,Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from app.config import get_settings
from app.db import create_database_pool
from app.errors import APIError,api_error_handler
from app.routers import admin,audit,auth,organizations
from app.security.jwt import SupabaseJWTVerifier
from app.services.supabase_auth import SupabaseAuthService
from app.services.invitation_email import SMTPInvitationDelivery

logging.basicConfig(level=logging.INFO)
logger=logging.getLogger("salesx.api")

@asynccontextmanager
async def lifespan(app: FastAPI):
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

app=FastAPI(title="SalesX-Ai API",version="1.0.0",
  description="Identity, tenant context and authorization API.",
  openapi_url="/api/v1/openapi.json",docs_url="/api/v1/docs",redoc_url=None,lifespan=lifespan)
settings=get_settings()
if settings.allowed_origins:
    app.add_middleware(CORSMiddleware,allow_origins=settings.allowed_origins,allow_credentials=True,
      allow_methods=["GET","POST","PATCH","PUT","DELETE","OPTIONS"],
      allow_headers=["Authorization","Content-Type","X-Organization-ID","X-Correlation-ID","X-Resource-Branch-ID","X-Client-Platform"],
      expose_headers=["X-Correlation-ID"])

@app.middleware("http")
async def correlation_id_middleware(request: Request,call_next):
    correlation_id=request.headers.get("x-correlation-id") or str(uuid4())
    request.state.correlation_id=correlation_id
    content_length=request.headers.get("content-length")
    if content_length is not None:
        try:
            declared_length=int(content_length)
        except ValueError:
            response=JSONResponse(status_code=400,content={"error":{"code":"invalid_content_length",
              "message":"Content-Length must be a valid non-negative integer.","correlation_id":correlation_id}})
        else:
            if declared_length<0:
                response=JSONResponse(status_code=400,content={"error":{"code":"invalid_content_length",
                  "message":"Content-Length must be a valid non-negative integer.","correlation_id":correlation_id}})
            elif declared_length>settings.max_request_body_bytes:
                response=JSONResponse(status_code=413,content={"error":{"code":"request_too_large",
                  "message":"The request body exceeds the configured API limit.","correlation_id":correlation_id}})
            else:
                response=await call_next(request)
    else:
        response=await call_next(request)
    response.headers["X-Correlation-ID"]=correlation_id
    response.headers["Cache-Control"]="no-store"
    response.headers["X-Content-Type-Options"]="nosniff"
    response.headers["X-Frame-Options"]="DENY"
    response.headers["Referrer-Policy"]="no-referrer"
    response.headers["Permissions-Policy"]="camera=(), microphone=(), geolocation=()"
    response.headers["Cross-Origin-Resource-Policy"]="same-site"
    if request.url.scheme=="https":
        response.headers["Strict-Transport-Security"]="max-age=31536000; includeSubDomains"
    return response

@app.exception_handler(APIError)
async def handle_api_error(request: Request,exc: APIError):
    return await api_error_handler(request,exc)

@app.exception_handler(Exception)
async def handle_unexpected_error(request: Request,exc: Exception):
    logger.exception("Unhandled API exception")
    return JSONResponse(status_code=500,content={"error":{"code":"internal_error",
      "message":"An unexpected server error occurred.",
      "correlation_id":getattr(request.state,"correlation_id",None)}})

@app.get("/healthz",tags=["operations"])
async def healthz():
    return {"status":"ok"}

@app.get("/readyz",tags=["operations"])
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
        raise APIError(503, "database_unavailable", "Supabase PostgreSQL readiness check failed.") from exc
    return {"status":"ready","database":"connected"}

app.include_router(auth.router,prefix="/api/v1")
app.include_router(admin.router,prefix="/api/v1")
app.include_router(organizations.router,prefix="/api/v1")
app.include_router(audit.router,prefix="/api/v1")
