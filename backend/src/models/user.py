"""
User, Authentication & RBAC Model
Secures role-based access across students, faculty, T&P admins, and recruiters.
"""

from typing import Optional, TYPE_CHECKING
import uuid

from sqlalchemy import Enum as SQLEnum, Index, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .base import Base, TenantScopedMixin, TimestampMixin
from .enums import UserRole

if TYPE_CHECKING:
    from .tenant import Tenant
    from .student import Student


class User(Base, TenantScopedMixin, TimestampMixin):
    __tablename__ = "users"
    __table_args__ = (
        UniqueConstraint("tenant_id", "email", name="uq_users_tenant_email"),
        Index("ix_users_tenant_role", "tenant_id", "role"),
    )

    id: Mapped[uuid.UUID] = mapped_column(
        primary_key=True,
        default=uuid.uuid4,
    )
    email: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    full_name: Mapped[str] = mapped_column(String(255), nullable=False)
    role: Mapped[UserRole] = mapped_column(
        SQLEnum(UserRole, name="user_role_enum", native_enum=False),
        nullable=False,
        default=UserRole.STUDENT,
    )
    is_active: Mapped[bool] = mapped_column(default=True, nullable=False)
    is_verified: Mapped[bool] = mapped_column(default=False, nullable=False)

    # Relationships
    tenant: Mapped["Tenant"] = relationship("Tenant", back_populates="users")
    student: Mapped[Optional["Student"]] = relationship("Student", back_populates="user", uselist=False)

    def __repr__(self) -> str:
        return f"<User(id={self.id}, email='{self.email}', role='{self.role}')>"
