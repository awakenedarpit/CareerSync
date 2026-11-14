"""
Placement Drives, Applications & Interviews Models
Orchestrates campus hiring campaigns and candidate evaluation progression.
"""

from datetime import datetime
from typing import Any, Dict, List, Optional, TYPE_CHECKING
import uuid

from sqlalchemy import (
    DateTime,
    Enum as SQLEnum,
    ForeignKey,
    Index,
    Integer,
    JSON,
    Numeric,
    Text,
    UniqueConstraint,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .base import Base, TenantScopedMixin, TimestampMixin
from .enums import ApplicationStatus, DriveStatus, InterviewRoundType, InterviewStatus

if TYPE_CHECKING:
    from .tenant import Tenant
    from .industry import JobRole
    from .student import Student
    from .user import User


class PlacementDrive(Base, TenantScopedMixin, TimestampMixin):
    __tablename__ = "placement_drives"
    __table_args__ = (
        Index("ix_drives_tenant_status_batch", "tenant_id", "status", "batch_year"),
    )

    id: Mapped[uuid.UUID] = mapped_column(
        primary_key=True,
        default=uuid.uuid4,
    )
    job_role_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("job_roles.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    batch_year: Mapped[int] = mapped_column(Integer, nullable=False)
    min_cgpa: Mapped[float] = mapped_column(Numeric(4, 2), default=6.00, nullable=False)
    max_backlogs_allowed: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    eligible_departments: Mapped[List[str]] = mapped_column(JSON, default=list, nullable=False)
    registration_start: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    registration_end: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    drive_date: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    status: Mapped[DriveStatus] = mapped_column(
        SQLEnum(DriveStatus, name="drive_status_enum", native_enum=False),
        default=DriveStatus.DRAFT,
        nullable=False,
    )

    # Relationships
    tenant: Mapped["Tenant"] = relationship("Tenant", back_populates="placement_drives")
    job_role: Mapped["JobRole"] = relationship("JobRole", back_populates="placement_drives")
    applications: Mapped[List["Application"]] = relationship("Application", back_populates="drive", cascade="all, delete-orphan")

    def __repr__(self) -> str:
        return f"<PlacementDrive(id={self.id}, role={self.job_role_id}, batch={self.batch_year}, status='{self.status}')>"


class Application(Base, TenantScopedMixin, TimestampMixin):
    __tablename__ = "applications"
    __table_args__ = (
        UniqueConstraint("drive_id", "student_id", name="uq_applications_drive_student"),
        Index("ix_applications_tenant_status", "tenant_id", "status", "drive_id"),
    )

    id: Mapped[uuid.UUID] = mapped_column(
        primary_key=True,
        default=uuid.uuid4,
    )
    drive_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("placement_drives.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    student_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("students.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    status: Mapped[ApplicationStatus] = mapped_column(
        SQLEnum(ApplicationStatus, name="application_status_enum", native_enum=False),
        default=ApplicationStatus.APPLIED,
        nullable=False,
    )
    # Ethical constraint: AI cannot make final candidacy decision; human decision_by required
    final_decision_by: Mapped[uuid.UUID | None] = mapped_column(
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
    )

    # Relationships
    drive: Mapped["PlacementDrive"] = relationship("PlacementDrive", back_populates="applications")
    student: Mapped["Student"] = relationship("Student", back_populates="applications")
    decision_maker: Mapped[Optional["User"]] = relationship("User")
    interviews: Mapped[List["Interview"]] = relationship("Interview", back_populates="application", cascade="all, delete-orphan")


class Interview(Base, TenantScopedMixin, TimestampMixin):
    __tablename__ = "interviews"

    id: Mapped[uuid.UUID] = mapped_column(
        primary_key=True,
        default=uuid.uuid4,
    )
    application_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("applications.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    round_number: Mapped[int] = mapped_column(Integer, nullable=False)
    round_type: Mapped[InterviewRoundType] = mapped_column(
        SQLEnum(InterviewRoundType, name="round_type_enum", native_enum=False),
        nullable=False,
    )
    scheduled_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    status: Mapped[InterviewStatus] = mapped_column(
        SQLEnum(InterviewStatus, name="interview_status_enum", native_enum=False),
        default=InterviewStatus.SCHEDULED,
        nullable=False,
    )
    interviewer_feedback: Mapped[str | None] = mapped_column(Text, nullable=True)

    application: Mapped["Application"] = relationship("Application", back_populates="interviews")
