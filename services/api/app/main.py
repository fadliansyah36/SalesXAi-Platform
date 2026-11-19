import logging
from contextlib import asynccontextmanager
from uuid import uuid4
from fastapi import FastAPI,Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from app.config import get_settings
from app.errors import APIError,api_error_handler
from app.routers import audit,auth,organizations
from app.security.jwt import SupabaseJWTVerifier

logging.basicConfig(level=logging.INFO)
logger=logging.getLogger("salesx.api")

@asynccontextmanager
async def lifespan(app: FastAPI):
    settings=get_settings()
    pool=await asyncpg.create_pool(dsn=settings.database_url.get_secret_value(),
      min_size=1,max_size=10,command_timeout=30,ssl=True,
      server_settings={"application_name":"salesx-ai-api"})
    app.state.settings=settings
    app.state.db_pool=pool
    app.state.jwt_verifier=SupabaseJWTVerifier(settings)
    try:
        yield
    finally:
        await pool.close()

app=FastAPI(title="SalesX-Ai API",version="1.0.0",
  description="Identity, tenant context and authorization API.",
  openapi_url="/api/v1/openapi.json",docs_url="/api/v1/docs",redoc_url=None,lifespan=lifespan)
settings=get_settings()
if settings.allowed_origins:
    app.add_middleware(CORSMiddleware,allow_origins=settings.allowed_origins,allow_credentials=True,
      allow_methods=["GET","POST","PATCH","PUT","DELETE","OPTIONS"],
      allow_headers=["Authorization","Content-Type","X-Organization-ID","X-Correlation-ID","X-Resource-Branch-ID"],
      expose_headers=["X-Correlation-ID"])

@app.middleware("http")
async def correlation_id_middleware(request: Request,call_next):
    correlation_id=request.headers.get("x-correlation-id") or str(uuid4())
    request.state.correlation_id=correlation_id
    response=await call_next(request)
    response.headers["X-Correlation-ID"]=correlation_id
    response.headers["Cache-Control"]="no-store"
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
    async with request.app.state.db_pool.acquire() as connection:
        await connection.fetchval("select 1")
    return {"status":"ready"}

app.include_router(auth.router,prefix="/api/v1")
app.include_router(organizations.router,prefix="/api/v1")
app.include_router(audit.router,prefix="/api/v1")
