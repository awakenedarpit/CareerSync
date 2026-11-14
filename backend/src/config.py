"""
CarrerSync Database & Infrastructure Configuration
Handles environment loading, connection strings, connection pooling parameters,
and zero-cost resource budgeting.
"""

import os
from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import Field, field_validator


class DatabaseSettings(BaseSettings):
    """
    Application & Database Configuration.
    Supports Neon PostgreSQL (Free Tier) via asyncpg.
    """
    model_config = SettingsConfigDict(
        env_file=(".env.local", ".env", "../.env.local", "../.env", "backend/.env"),
        env_file_encoding="utf-8",
        extra="ignore",
    )

    # Database URL
    DATABASE_URL: str = Field(
        default="sqlite+aiosqlite:///./test_carrersync.db",
        description="PostgreSQL async connection string (e.g., postgresql+asyncpg://...)"
    )
    DATABASE_URL_UNPOOLED: str | None = Field(
        default=None,
        description="Direct non-pooled PostgreSQL async connection string for migrations"
    )

    # Neon Free Tier Connection Pooling Configuration
    DB_POOL_SIZE: int = Field(default=5, description="Maximum pooled connections (keep low for Neon Free Tier)")
    DB_MAX_OVERFLOW: int = Field(default=5, description="Max overflow connections")
    DB_POOL_TIMEOUT: int = Field(default=30, description="Pool acquisition timeout in seconds")
    DB_POOL_RECYCLE: int = Field(default=300, description="Recycle idle connections every 5 minutes")
    DB_ECHO: bool = Field(default=False, description="Log raw SQL queries for debugging")

    # Application & Environment
    ENVIRONMENT: str = Field(default="development", description="development | staging | production")
    APP_NAME: str = "CarrerSync Database Layer"
    SECRET_KEY: str = Field(default="carrersync_dev_secret_key_minimum_32_characters_change_in_prod")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 120

    @field_validator("DATABASE_URL", "DATABASE_URL_UNPOOLED", mode="before")
    @classmethod
    def sanitize_database_url(cls, v: str | None) -> str | None:
        """
        Ensures proper asyncpg driver prefix for PostgreSQL URLs and removes
        unsupported libpq query parameters (like channel_binding).
        Converts standard postgres:// or postgresql:// to postgresql+asyncpg://.
        """
        if not v:
            return v
        url = v
        if url.startswith("postgres://"):
            url = url.replace("postgres://", "postgresql+asyncpg://", 1)
        elif url.startswith("postgresql://") and not url.startswith("postgresql+asyncpg://"):
            url = url.replace("postgresql://", "postgresql+asyncpg://", 1)

        # Convert libpq parameters to asyncpg equivalents
        if "?" in url:
            base, query = url.split("?", 1)
            params = []
            for p in query.split("&"):
                if p.startswith("channel_binding="):
                    continue
                if p.startswith("sslmode="):
                    val = p.split("=", 1)[1]
                    params.append(f"ssl={val}")
                else:
                    params.append(p)
            url = f"{base}?{'&'.join(params)}" if params else base

        return url


settings = DatabaseSettings()
