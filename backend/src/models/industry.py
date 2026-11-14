"""
Industry, Companies & Job Requirements Models
Represents hiring organizations and their technical competency demands.
"""

from typing import List, TYPE_CHECKING
import uuid

from sqlalchemy import (
    Boolean,
    Enum as SQLEnum,
    ForeignKey,
    Numeric,
    String,
    Text,
    UniqueConstraint,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .base import Base, TimestampMixin
from .enums import ProficiencyLevel

if TYPE_CHECKING:
    from .skill import Skill
    from .placement import PlacementDrive


class Company(Base, TimestampMixin):
    __tablename__ = "companies"

    id: Mapped[uuid.UUID] = mapped_column(
        primary_key=True,
        default=uuid.uuid4,
    )
    name: Mapped[str] = mapped_column(String(255), unique=True, nullable=False, index=True)
    industry_domain: Mapped[str | None] = mapped_column(String(150), nullable=True)
    website: Mapped[str | None] = mapped_column(String(512), nullable=True)

    job_roles: Mapped[List["JobRole"]] = relationship("JobRole", back_populates="company", cascade="all, delete-orphan")

    def __repr__(self) -> str:
        return f"<Company(id={self.id}, name='{self.name}')>"


class JobRole(Base, TimestampMixin):
    __tablename__ = "job_roles"

    id: Mapped[uuid.UUID] = mapped_column(
        primary_key=True,
        default=uuid.uuid4,
    )
    company_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("companies.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    experience_level: Mapped[str] = mapped_column(String(50), default="Fresher / Entry Level", nullable=False)
    ctc_lpa: Mapped[float | None] = mapped_column(Numeric(6, 2), nullable=True)

    # Relationships
    company: Mapped["Company"] = relationship("Company", back_populates="job_roles")
    requirements: Mapped[List["JobRequirement"]] = relationship("JobRequirement", back_populates="job_role", cascade="all, delete-orphan")
    placement_drives: Mapped[List["PlacementDrive"]] = relationship("PlacementDrive", back_populates="job_role")

    def __repr__(self) -> str:
        return f"<JobRole(id={self.id}, title='{self.title}', company_id={self.company_id})>"


class JobRequirement(Base, TimestampMixin):
    __tablename__ = "job_requirements"
    __table_args__ = (
        UniqueConstraint("job_role_id", "skill_id", name="uq_job_req_role_skill"),
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
    skill_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("skills.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    is_mandatory: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    min_proficiency: Mapped[ProficiencyLevel] = mapped_column(
        SQLEnum(ProficiencyLevel, name="min_proficiency_enum", native_enum=False),
        default=ProficiencyLevel.INTERMEDIATE,
        nullable=False,
    )
    weight: Mapped[float] = mapped_column(Numeric(3, 2), default=1.00, nullable=False)

    # Relationships
    job_role: Mapped["JobRole"] = relationship("JobRole", back_populates="requirements")
    skill: Mapped["Skill"] = relationship("Skill")
