"""
SQLAlchemy 2.0 Declarative Base & Common Mixins
Enforces UUID primary keys, UTC timestamps, and mandatory multi-tenant scoping.
"""

from datetime import datetime, timezone
from typing import Any, Dict
import uuid

from sqlalchemy import DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
from sqlalchemy.ext.asyncio import AsyncAttrs
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


class Base(AsyncAttrs, DeclarativeBase):
    """Abstract declarative base for all CarrerSync models."""

    def to_dict(self) -> Dict[str, Any]:
        """Convert model instance attributes to a dictionary."""
        result = {}
        for c in self.__table__.columns:
            val = getattr(self, c.name)
            if isinstance(val, datetime):
                result[c.name] = val.isoformat()
            elif isinstance(val, uuid.UUID):
                result[c.name] = str(val)
            else:
                result[c.name] = val
        return result


class TimestampMixin:
    """Automatically tracks creation and update timestamps in UTC."""
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=utc_now,
        nullable=False,
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=utc_now,
        onupdate=utc_now,
        nullable=False,
    )


class TenantScopedMixin:
    """
    Mandatory tenant scoping mixin.
    Enforces multi-tenancy at database and RLS levels.
    Never trust client-supplied tenant IDs.
    """
    tenant_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("tenants.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
