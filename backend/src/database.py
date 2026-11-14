"""
CarrerSync Async Database Engine & Session Management
SQLAlchemy 2.0 + asyncpg + PostgreSQL Row-Level Security (RLS) Context
"""

import logging
from contextlib import asynccontextmanager
from typing import AsyncGenerator, Optional
import uuid

from sqlalchemy.ext.asyncio import (
    AsyncSession,
    AsyncEngine,
    async_sessionmaker,
    create_async_engine,
)
from sqlalchemy import text
from sqlalchemy.pool import NullPool, AsyncAdaptedQueuePool

from .config import settings

logger = logging.getLogger("carrersync.db")
logging.basicConfig(level=logging.INFO)

# Determine connection pool strategy
is_sqlite = settings.DATABASE_URL.startswith("sqlite")

# Neon Free Tier Connection Pooling
# Uses AsyncAdaptedQueuePool with conservative limits to protect free tier quotas
pool_kwargs = {}
if is_sqlite:
    pool_kwargs = {"poolclass": NullPool}
else:
    pool_kwargs = {
        "poolclass": AsyncAdaptedQueuePool,
        "pool_size": settings.DB_POOL_SIZE,
        "max_overflow": settings.DB_MAX_OVERFLOW,
        "pool_timeout": settings.DB_POOL_TIMEOUT,
        "pool_recycle": settings.DB_POOL_RECYCLE,
        "pool_pre_ping": True,  # Verifies connection liveness before checkout
    }

engine: AsyncEngine = create_async_engine(
    settings.DATABASE_URL,
    echo=settings.DB_ECHO,
    **pool_kwargs,
)

async_session_factory = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autocommit=False,
    autoflush=False,
)


@asynccontextmanager
async def session_scope(
    tenant_id: Optional[uuid.UUID] = None,
    enforce_rls: bool = True
) -> AsyncGenerator[AsyncSession, None]:
    """
    Context manager providing a transactional AsyncSession.
    Enforces PostgreSQL Row-Level Security (RLS) by binding `app.current_tenant_id`
    to the active transaction when running against PostgreSQL.
    """
    session: AsyncSession = async_session_factory()
    try:
        if tenant_id and not is_sqlite and enforce_rls:
            # Set transaction-local tenant context for RLS policies
            await session.execute(
                text("SET LOCAL app.current_tenant_id = :tid"),
                {"tid": str(tenant_id)},
            )
            logger.debug(f"[RLS Context] Bound session to tenant_id={tenant_id}")

        yield session
        await session.commit()
    except Exception as exc:
        await session.rollback()
        logger.error(f"[Database Error] Transaction rolled back due to: {exc}", exc_info=True)
        raise
    finally:
        await session.close()


async def check_db_connectivity() -> dict:
    """
    Health check utility to verify database responsiveness and dialect info.
    Does not raise exceptions; returns structured health dictionary.
    """
    try:
        async with engine.connect() as conn:
            result = await conn.execute(text("SELECT 1"))
            val = result.scalar()
            return {
                "status": "connected" if val == 1 else "degraded",
                "dialect": engine.dialect.name,
                "driver": engine.dialect.driver,
                "pool_size": getattr(engine.pool, "size", lambda: None)(),
            }
    except Exception as exc:
        logger.warning(f"[DB Health Check Failed] Error: {exc}")
        return {
            "status": "disconnected",
            "error": str(exc),
            "dialect": engine.dialect.name if hasattr(engine, "dialect") else "unknown",
        }


async def dispose_engine():
    """Closes all pooled connections gracefully during shutdown."""
    await engine.dispose()
    logger.info("[Database] Engine pool disposed gracefully.")
