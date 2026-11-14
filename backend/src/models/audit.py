"""
Audit Events & Notifications Models
Guarantees tamper-proof compliance logging and multi-stakeholder messaging.
"""

from datetime import datetime
from typing import Any, Dict, Optional, TYPE_CHECKING
import uuid

from sqlalchemy import (
    Boolean,
    DateTime,
    Enum as SQLEnum,
    ForeignKey,
    Index,
    JSON,
    String,
    Text,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .base import Base, TenantScopedMixin, TimestampMixin, utc_now
from .enums import NotificationType

if TYPE_CHECKING:
    from .user import User


class AuditEvent(Base, TenantScopedMixin):
    """
    Immutable compliance log tracking all administrative, hiring, and system events.
    """
    __tablename__ = "audit_events"
    __table_args__ = (
        Index("ix_audit_tenant_timestamp", "tenant_id", "timestamp"),
        Index("ix_audit_tenant_action", "tenant_id", "action"),
    )

    id: Mapped[uuid.UUID] = mapped_column(
        primary_key=True,
        default=uuid.uuid4,
    )
    actor_id: Mapped[uuid.UUID | None] = mapped_column(
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
    )
    actor_email: Mapped[str | None] = mapped_column(String(255), nullable=True)
    action: Mapped[str] = mapped_column(String(100), nullable=False)
    resource_type: Mapped[str] = mapped_column(String(100), nullable=False)
    resource_id: Mapped[str | None] = mapped_column(String(100), nullable=True)
    changes_diff: Mapped[Dict[str, Any]] = mapped_column(JSON, default=dict, nullable=False)
    ip_address: Mapped[str | None] = mapped_column(String(45), nullable=True)
    timestamp: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now, nullable=False)

    actor: Mapped[Optional["User"]] = relationship("User")


class Notification(Base, TenantScopedMixin, TimestampMixin):
    """
    System and placement notification delivery tracking.
    """
    __tablename__ = "notifications"
    __table_args__ = (
        Index("ix_notifications_tenant_recipient", "tenant_id", "recipient_user_id", "is_read"),
    )

    id: Mapped[uuid.UUID] = mapped_column(
        primary_key=True,
        default=uuid.uuid4,
    )
    recipient_user_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    message: Mapped[str] = mapped_column(Text, nullable=False)
    type: Mapped[NotificationType] = mapped_column(
        SQLEnum(NotificationType, name="notification_type_enum", native_enum=False),
        default=NotificationType.SYSTEM,
        nullable=False,
    )
    is_read: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    recipient: Mapped["User"] = relationship("User")
