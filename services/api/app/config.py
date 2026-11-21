from functools import lru_cache
from urllib.parse import unquote, urlsplit
from pydantic import AnyHttpUrl, Field, SecretStr, field_validator, model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env", env_file_encoding="utf-8", extra="ignore", validate_default=True
    )
    supabase_url: AnyHttpUrl = "https://eyofuiyxalbehbqoaeny.supabase.co"
    database_url: SecretStr | None = None
    supabase_jwks_url: AnyHttpUrl | None = None
    supabase_jwt_issuer: str | None = None
    supabase_jwt_audience: str = "authenticated"
    supabase_jwt_secret: SecretStr | None = None
    supabase_publishable_key: SecretStr | None = None
    supabase_secret_key: SecretStr | None = None
    salesx_bff_shared_secret: SecretStr | None = None
    salesx_website_origin: str | None = Field(default=None, validation_alias="NEXT_PUBLIC_SALESX_WEBSITE_URL")
    salesx_customer_origin: str | None = Field(default=None, validation_alias="NEXT_PUBLIC_SALESX_CUSTOMER_URL")
    salesx_company_origin: str | None = Field(default=None, validation_alias="NEXT_PUBLIC_SALESX_COMPANY_URL")
    app_public_url: str | None = None
    auth_admin_timeout_seconds: float = 8.0
    db_pool_min_size: int = 1
    db_pool_max_size: int = 10
    db_command_timeout_seconds: float = 30.0
    db_connect_timeout_seconds: float = 10.0
    db_max_inactive_connection_lifetime: float = 300.0
    db_statement_timeout_ms: int = 30000
    max_request_body_bytes: int = 10485760
    rate_limit_enabled: bool = True
    rate_limit_fail_closed: bool = True
    cors_origins: str = ""
    jwt_clock_skew_seconds: int = 30
    smtp_host: str | None = None
    smtp_port: int = 587
    smtp_username: str | None = None
    smtp_password: SecretStr | None = None
    smtp_from_email: str | None = None
    smtp_from_name: str = "SalesX-Ai"
    smtp_starttls: bool = True
    smtp_timeout_seconds: float = 10.0
    maps_provider: str = "google"
    google_maps_server_api_key: SecretStr | None = None
    google_maps_places_api_key: SecretStr | None = None
    google_maps_language: str = "id"
    google_maps_region: str = "ID"

    @field_validator("supabase_url")
    @classmethod
    def validate_supabase_project(cls, value: AnyHttpUrl) -> AnyHttpUrl:
        if urlsplit(str(value)).hostname != "eyofuiyxalbehbqoaeny.supabase.co":
            raise ValueError(
                "SUPABASE_URL must reference the bound SalesX-Ai project eyofuiyxalbehbqoaeny"
            )
        return value

    @field_validator("salesx_website_origin","salesx_customer_origin","salesx_company_origin")
    @classmethod
    def validate_portal_origins(cls,value:str|None)->str|None:
        if value is None or not value.strip():
            return None
        parsed=urlsplit(value.strip().rstrip("/"))
        if parsed.scheme not in {"http","https"} or not parsed.netloc or parsed.path or parsed.query or parsed.fragment or parsed.username or parsed.password:
            raise ValueError("SalesX portal origins must be exact HTTP(S) origins without path, query or credentials")
        if parsed.scheme!="https" and parsed.hostname not in {"localhost","127.0.0.1","::1"}:
            raise ValueError("SalesX portal origins must use HTTPS outside local development")
        return f"{parsed.scheme}://{parsed.netloc}"

    @field_validator("app_public_url")
    @classmethod
    def validate_app_public_url(cls, value: str | None) -> str | None:
        if value is None or not value.strip():
            return None
        parsed = urlsplit(value.strip().rstrip("/"))
        if (
            parsed.scheme not in {"http", "https"}
            or not parsed.netloc
            or parsed.username
            or parsed.password
            or parsed.path
            or parsed.query
            or parsed.fragment
        ):
            raise ValueError(
                "APP_PUBLIC_URL must be an exact HTTP(S) origin without credentials, path, query or fragment"
            )
        if parsed.scheme != "https" and parsed.hostname not in {"localhost", "127.0.0.1", "::1"}:
            raise ValueError("APP_PUBLIC_URL must use HTTPS outside local development")
        return f"{parsed.scheme}://{parsed.netloc}"

    @field_validator("supabase_jwks_url")
    @classmethod
    def validate_jwks_project(cls, value: AnyHttpUrl | None) -> AnyHttpUrl | None:
        if value:
            parsed = urlsplit(str(value))
            if (
                parsed.hostname != "eyofuiyxalbehbqoaeny.supabase.co"
                or parsed.path.rstrip("/") != "/auth/v1/.well-known/jwks.json"
                or parsed.query
                or parsed.fragment
            ):
                raise ValueError(
                    "SUPABASE_JWKS_URL must use the bound SalesX-Ai project's canonical JWKS endpoint"
                )
        return value

    @field_validator("supabase_jwt_issuer")
    @classmethod
    def validate_jwt_issuer(cls, value: str | None) -> str | None:
        expected = "https://eyofuiyxalbehbqoaeny.supabase.co/auth/v1"
        if value and value.rstrip("/") != expected:
            raise ValueError("SUPABASE_JWT_ISSUER must match the bound SalesX-Ai Auth issuer")
        return value

    @field_validator("supabase_jwt_audience")
    @classmethod
    def validate_jwt_audience(cls, value: str) -> str:
        if value != "authenticated":
            raise ValueError(
                "SUPABASE_JWT_AUDIENCE must be authenticated for SalesX-Ai user sessions"
            )
        return value

    @field_validator("database_url")
    @classmethod
    def validate_database_project(cls, value: SecretStr | None) -> SecretStr | None:
        if value is None or not value.get_secret_value().strip():
            return None
        parsed = urlsplit(value.get_secret_value())
        if parsed.scheme not in {"postgres", "postgresql"}:
            raise ValueError("DATABASE_URL must use PostgreSQL")
        host = parsed.hostname or ""
        username = unquote(parsed.username or "")
        direct_target = host == "db.eyofuiyxalbehbqoaeny.supabase.co"
        pooler_target = host.endswith(".pooler.supabase.com") and username.endswith(
            ".eyofuiyxalbehbqoaeny"
        )
        if not (direct_target or pooler_target):
            raise ValueError(
                "DATABASE_URL must connect to the bound Supabase project eyofuiyxalbehbqoaeny"
            )
        return value

    @field_validator(
        "supabase_jwt_secret",
        "supabase_publishable_key",
        "supabase_secret_key",
        "salesx_bff_shared_secret",
        "smtp_password",
        "google_maps_server_api_key",
        "google_maps_places_api_key",
        mode="before",
    )
    @classmethod
    def empty_secret_to_none(cls, value):
        return None if value == "" else value

    @field_validator("salesx_bff_shared_secret")
    @classmethod
    def validate_bff_shared_secret(cls, value: SecretStr | None) -> SecretStr | None:
        if value is not None and len(value.get_secret_value()) < 32:
            raise ValueError("SALESX_BFF_SHARED_SECRET must contain at least 32 characters")
        return value

    @field_validator("auth_admin_timeout_seconds")
    @classmethod
    def validate_auth_timeout(cls, value: float) -> float:
        if value <= 0 or value > 60:
            raise ValueError("Auth admin timeout must be between 0 and 60 seconds")
        return value

    @field_validator("jwt_clock_skew_seconds")
    @classmethod
    def validate_clock_skew(cls, value: int) -> int:
        if value < 0 or value > 120:
            raise ValueError("JWT clock skew must be between 0 and 120 seconds")
        return value

    @field_validator("maps_provider")
    @classmethod
    def validate_maps_provider(cls, value: str) -> str:
        normalized = value.strip().lower()
        if normalized not in {"google", "none"}:
            raise ValueError("MAPS_PROVIDER must be google or none")
        return normalized

    @field_validator("google_maps_language", "google_maps_region")
    @classmethod
    def validate_maps_locale(cls, value: str) -> str:
        normalized = value.strip()
        if not normalized or len(normalized) > 16:
            raise ValueError("Google Maps language/region must contain 1 to 16 characters")
        return normalized

    @property
    def google_maps_routes_enabled(self) -> bool:
        return self.maps_provider == "google" and self.google_maps_server_api_key is not None

    @property
    def google_maps_places_enabled(self) -> bool:
        return self.maps_provider == "google" and self.google_maps_places_api_key is not None

    @field_validator("smtp_port")
    @classmethod
    def validate_smtp_port(cls, value: int) -> int:
        if value < 1 or value > 65535:
            raise ValueError("SMTP port must be between 1 and 65535")
        return value

    @field_validator("smtp_timeout_seconds")
    @classmethod
    def validate_smtp_timeout(cls, value: float) -> float:
        if value <= 0 or value > 60:
            raise ValueError("SMTP timeout must be between 0 and 60 seconds")
        return value

    @field_validator(
        "db_command_timeout_seconds",
        "db_connect_timeout_seconds",
        "db_max_inactive_connection_lifetime",
    )
    @classmethod
    def validate_db_timeouts(cls, value: float) -> float:
        if value <= 0 or value > 600:
            raise ValueError("Database timeouts must be between 0 and 600 seconds")
        return value

    @field_validator("cors_origins")
    @classmethod
    def validate_cors_origins(cls, value: str) -> str:
        origins = [origin.strip().rstrip("/") for origin in value.split(",") if origin.strip()]
        if "*" in origins:
            raise ValueError("Wildcard CORS origins are forbidden when credentials are enabled")
        for origin in origins:
            parsed = urlsplit(origin)
            if (
                parsed.scheme not in {"http", "https"}
                or not parsed.netloc
                or parsed.path
                or parsed.query
                or parsed.fragment
            ):
                raise ValueError("CORS_ORIGINS must contain exact HTTP(S) origins without paths")
        return ",".join(origins)

    @field_validator("db_statement_timeout_ms")
    @classmethod
    def validate_statement_timeout(cls, value: int) -> int:
        if value < 1000 or value > 300000:
            raise ValueError("Database statement timeout must be between 1000 and 300000 ms")
        return value

    @field_validator("max_request_body_bytes")
    @classmethod
    def validate_request_body_limit(cls, value: int) -> int:
        if value < 1024 or value > 10485760:
            raise ValueError("MAX_REQUEST_BODY_BYTES must be between 1 KiB and 10 MiB")
        return value

    @field_validator("db_pool_min_size", "db_pool_max_size")
    @classmethod
    def validate_pool_size(cls, value: int) -> int:
        if value < 1 or value > 50:
            raise ValueError("Database pool size must be between 1 and 50")
        return value

    @model_validator(mode="after")
    def validate_pool_bounds(self):
        if self.db_pool_min_size > self.db_pool_max_size:
            raise ValueError("DB_POOL_MIN_SIZE cannot exceed DB_POOL_MAX_SIZE")
        if (
            self.app_public_url
            and self.allowed_origins
            and self.app_public_url not in self.allowed_origins
        ):
            raise ValueError("APP_PUBLIC_URL must also be present in CORS_ORIGINS")
        return self

    @property
    def database_configured(self) -> bool:
        return self.database_url is not None and bool(self.database_url.get_secret_value().strip())

    @property
    def auth_issuer(self) -> str:
        return self.supabase_jwt_issuer or f"{str(self.supabase_url).rstrip('/')}/auth/v1"

    @property
    def jwks_url(self) -> str:
        return str(
            self.supabase_jwks_url
            or f"{str(self.supabase_url).rstrip('/')}/auth/v1/.well-known/jwks.json"
        )

    @property
    def allowed_origins(self) -> list[str]:
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()
