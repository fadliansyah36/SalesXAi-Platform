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
    cors_origins: str = ""
    jwt_clock_skew_seconds: int = 30

    @field_validator("jwt_clock_skew_seconds")
    @classmethod
    def validate_clock_skew(cls, value: int) -> int:
        if value < 0 or value > 120:
            raise ValueError("JWT clock skew must be between 0 and 120 seconds")
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
