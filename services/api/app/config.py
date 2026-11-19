from functools import lru_cache
from pydantic import AnyHttpUrl, SecretStr, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")
    supabase_url: AnyHttpUrl
    database_url: SecretStr
    supabase_jwks_url: AnyHttpUrl | None = None
    supabase_jwt_issuer: str | None = None
    supabase_jwt_audience: str = "authenticated"
    supabase_jwt_secret: SecretStr | None = None
    supabase_publishable_key: SecretStr | None = None
    supabase_secret_key: SecretStr | None = None
    app_public_url: str | None = None
    auth_admin_timeout_seconds: float = 8.0
    db_pool_min_size: int = 1
    db_pool_max_size: int = 10
    db_command_timeout_seconds: float = 30.0
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

    @field_validator("supabase_jwt_secret","supabase_publishable_key","supabase_secret_key",mode="before")
    @classmethod
    def empty_secret_to_none(cls,value):
        return None if value == "" else value

    @field_validator("auth_admin_timeout_seconds")
    @classmethod
    def validate_auth_timeout(cls,value:float)->float:
        if value <= 0 or value > 60:
            raise ValueError("Auth admin timeout must be between 0 and 60 seconds")
        return value

    @field_validator("jwt_clock_skew_seconds")
    @classmethod
    def validate_clock_skew(cls, value: int) -> int:
        if value < 0 or value > 120:
            raise ValueError("JWT clock skew must be between 0 and 120 seconds")
        return value

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

    @field_validator("db_pool_min_size", "db_pool_max_size")
    @classmethod
    def validate_pool_size(cls, value: int) -> int:
        if value < 1 or value > 50:
            raise ValueError("Database pool size must be between 1 and 50")
        return value

    @property
    def auth_issuer(self) -> str:
        return self.supabase_jwt_issuer or f"{str(self.supabase_url).rstrip('/')}/auth/v1"

    @property
    def jwks_url(self) -> str:
        return str(self.supabase_jwks_url or f"{str(self.supabase_url).rstrip('/')}/auth/v1/.well-known/jwks.json")

    @property
    def allowed_origins(self) -> list[str]:
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]

@lru_cache
def get_settings() -> Settings:
    return Settings()
