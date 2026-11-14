"""
Skills, Evidence & Assessments Models
Implements the 5-Stage Skill Verification Lifecycle:
Claimed -> Observed -> Evidence-linked -> Verified -> Expired
"""

from datetime import datetime
from typing import Any, Dict, List, Optional, TYPE_CHECKING
import uuid

from sqlalchemy import (
    DateTime,
    Enum as SQLEnum,
    ForeignKey,
    Index,
    JSON,
    Numeric,
    String,
    Text,
    UniqueConstraint,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .base import Base, TenantScopedMixin, TimestampMixin
from .enums import (
    EvidenceType,
    ProficiencyLevel,
    SkillCategory,
    SkillState,
    VerificationStatus,
)

if TYPE_CHECKING:
    from .student import Student
    from .user import User


class Skill(Base, TimestampMixin):
    """Authoritative standardized skill taxonomy."""
    __tablename__ = "skills"

    id: Mapped[uuid.UUID] = mapped_column(
        primary_key=True,
        default=uuid.uuid4,
    )
    name: Mapped[str] = mapped_column(String(150), unique=True, nullable=False, index=True)
    canonical_slug: Mapped[str] = mapped_column(String(150), unique=True, nullable=False, index=True)
    category: Mapped[SkillCategory] = mapped_column(
        SQLEnum(SkillCategory, name="skill_category_enum", native_enum=False),
        nullable=False,
    )
    description: Mapped[str | None] = mapped_column(Text, nullable=True)

    # Relationships
    student_skills: Mapped[List["StudentSkill"]] = relationship("StudentSkill", back_populates="skill")

    def __repr__(self) -> str:
        return f"<Skill(id={self.id}, name='{self.name}', cat='{self.category}')>"


class StudentSkill(Base, TenantScopedMixin, TimestampMixin):
    """
    Binding between a Student and a Skill with strict 5-State lifecycle tracking.
    State transitions:
    - Claimed (Self-reported)
    - Observed (Automated profiling heuristic)
    - Evidence-linked (Attached to inspected GitHub/R2 proof-of-work)
    - Verified (Human faculty/T&P validation; AI cannot independently certify)
    - Expired (Time-lapsed competence)
    """
    __tablename__ = "student_skills"
    __table_args__ = (
        UniqueConstraint("student_id", "skill_id", name="uq_student_skills_student_skill"),
        Index("ix_student_skills_tenant_state", "tenant_id", "state", "skill_id"),
    )

    id: Mapped[uuid.UUID] = mapped_column(
        primary_key=True,
        default=uuid.uuid4,
    )
    student_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("students.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    skill_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("skills.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    state: Mapped[SkillState] = mapped_column(
        SQLEnum(SkillState, name="skill_state_enum", native_enum=False),
        default=SkillState.CLAIMED,
        nullable=False,
    )
    proficiency_level: Mapped[ProficiencyLevel] = mapped_column(
        SQLEnum(ProficiencyLevel, name="proficiency_level_enum", native_enum=False),
        default=ProficiencyLevel.BEGINNER,
        nullable=False,
    )
    confidence_score: Mapped[float] = mapped_column(
        Numeric(4, 3),
        default=0.000,
        nullable=False,
    )
    verified_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    verified_by_user_id: Mapped[uuid.UUID | None] = mapped_column(
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
    )
    expiry_date: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    # Relationships
    student: Mapped["Student"] = relationship("Student", back_populates="skills")
    skill: Mapped["Skill"] = relationship("Skill", back_populates="student_skills")
    verified_by: Mapped[Optional["User"]] = relationship("User")

    def __repr__(self) -> str:
        return f"<StudentSkill(student={self.student_id}, skill={self.skill_id}, state='{self.state}')>"


class EvidenceRecord(Base, TenantScopedMixin, TimestampMixin):
    """
    Inspectable proofs-of-work (GitHub commits, PRs, project repos, R2 artifacts).
    """
    __tablename__ = "evidence_records"
    __table_args__ = (
        Index("ix_evidence_tenant_student_skill", "tenant_id", "student_id", "skill_id"),
    )

    id: Mapped[uuid.UUID] = mapped_column(
        primary_key=True,
        default=uuid.uuid4,
    )
    student_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("students.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    skill_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("skills.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    evidence_type: Mapped[EvidenceType] = mapped_column(
        SQLEnum(EvidenceType, name="evidence_type_enum", native_enum=False),
        nullable=False,
    )
    source_url: Mapped[str] = mapped_column(String(1024), nullable=False)
    r2_storage_key: Mapped[str | None] = mapped_column(String(512), nullable=True)
    metadata_json: Mapped[Dict[str, Any]] = mapped_column(JSON, default=dict, nullable=False)
    verification_status: Mapped[VerificationStatus] = mapped_column(
        SQLEnum(VerificationStatus, name="verification_status_enum", native_enum=False),
        default=VerificationStatus.PENDING_REVIEW,
        nullable=False,
    )
    validated_by: Mapped[uuid.UUID | None] = mapped_column(
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
    )

    # Relationships
    student: Mapped["Student"] = relationship("Student", back_populates="evidence")
    skill: Mapped["Skill"] = relationship("Skill")


class SkillAssessment(Base, TenantScopedMixin, TimestampMixin):
    """Standardized assessments evaluating student technical proficiency."""
    __tablename__ = "skill_assessments"

    id: Mapped[uuid.UUID] = mapped_column(
        primary_key=True,
        default=uuid.uuid4,
    )
    student_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("students.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    skill_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("skills.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    assessment_name: Mapped[str] = mapped_column(String(255), nullable=False)
    score: Mapped[float] = mapped_column(Numeric(5, 2), nullable=False)
    max_score: Mapped[float] = mapped_column(Numeric(5, 2), nullable=False)
    evaluation_metrics: Mapped[Dict[str, Any]] = mapped_column(JSON, default=dict, nullable=False)
    completed_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)

    student: Mapped["Student"] = relationship("Student", back_populates="assessments")
    skill: Mapped["Skill"] = relationship("Skill")
