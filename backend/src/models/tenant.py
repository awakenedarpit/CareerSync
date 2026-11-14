"""
Tenant & Institution Model
Represents participating universities, colleges, or autonomous hiring entities.
"""

from typing import List, TYPE_CHECKING
import uuid

from sqlalchemy import String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .base import Base, TimestampMixin

if TYPE_CHECKING:
    from .user import User
    from .student import Student
    from .placement import PlacementDrive


class Tenant(Base, TimestampMixin):
    __tablename__ = "tenants"

    id: Mapped[uuid.UUID] = mapped_column(
        primary_key=True,
        default=uuid.uuid4,
    )
    name: Mapped[str] = mapped_column(String(255), unique=True, nullable=False, index=True)
    slug: Mapped[str] = mapped_column(String(100), unique=True, nullable=False, index=True)
    domain: Mapped[str | None] = mapped_column(String(255), nullable=True)
    is_active: Mapped[bool] = mapped_column(default=True, nullable=False)

    # Relationships
    users: Mapped[List["User"]] = relationship("User", back_populates="tenant", cascade="all, delete-orphan")
    students: Mapped[List["Student"]] = relationship("Student", back_populates="tenant", cascade="all, delete-orphan")
    placement_drives: Mapped[List["PlacementDrive"]] = relationship("PlacementDrive", back_populates="tenant", cascade="all, delete-orphan")

    def __repr__(self) -> str:
        return f"<Tenant(id={self.id}, slug='{self.slug}', name='{self.name}')>"
