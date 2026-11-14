"""
Skill Gap Analysis, Placement Predictions & Recommendations Models
Shared structures for AI Agents 2 & 3.
"""

from typing import Any, Dict, List, Optional, TYPE_CHECKING
import uuid

from sqlalchemy import (
    Boolean,
    Enum as SQLEnum,
    ForeignKey,
    Index,
    Integer,
    JSON,
    Numeric,
    String,
    Text,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .base import Base, TenantScopedMixin, TimestampMixin
from .enums import RecommendationActionType, RiskTier

if TYPE_CHECKING:
    from .student import Student
    from .industry import JobRole
    from .skill import Skill
    from .placement import PlacementDrive


class SkillGapAnalysis(Base, TenantScopedMixin, TimestampMixin):
    """
    Output of Industry Skill-Gap Agent.
    Evaluates student competencies against target job descriptions.
    """
    __tablename__ = "skill_gap_analyses"
    __table_args__ = (
        Index("ix_gap_analysis_tenant_student_role", "tenant_id", "student_id", "job_role_id"),
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
    job_role_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("job_roles.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    match_percentage: Mapped[float] = mapped_column(Numeric(5, 2), nullable=False)
    missing_skills_json: Mapped[List[Dict[str, Any]]] = mapped_column(JSON, default=list, nullable=False)
    matching_skills_json: Mapped[List[Dict[str, Any]]] = mapped_column(JSON, default=list, nullable=False)
    analysis_mode: Mapped[str] = mapped_column(String(50), default="deterministic_rule_engine", nullable=False)

    # Relationships
    student: Mapped["Student"] = relationship("Student", back_populates="gap_analyses")
    job_role: Mapped["JobRole"] = relationship("JobRole")


class PlacementPrediction(Base, TenantScopedMixin, TimestampMixin):
    """
    Output of Predictive Placement Analytics Agent.
    Predicts drive success probabilities and highlights early-intervention risks.
    """
    __tablename__ = "placement_predictions"
    __table_args__ = (
        Index("ix_predictions_tenant_student", "tenant_id", "student_id"),
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
    drive_id: Mapped[uuid.UUID | None] = mapped_column(
        ForeignKey("placement_drives.id", ondelete="CASCADE"),
        nullable=True,
    )
    probability_score: Mapped[float] = mapped_column(Numeric(5, 2), nullable=False)
    risk_tier: Mapped[RiskTier] = mapped_column(
        SQLEnum(RiskTier, name="risk_tier_enum", native_enum=False),
        default=RiskTier.MODERATE_RISK,
        nullable=False,
    )
    contributing_factors_json: Mapped[Dict[str, Any]] = mapped_column(JSON, default=dict, nullable=False)
    
    # Ethical constraint: predictions are advisory only, cannot be used to penalize or auto-reject
    is_advisory_only: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    # Relationships
    student: Mapped["Student"] = relationship("Student", back_populates="predictions")
    drive: Mapped[Optional["PlacementDrive"]] = relationship("PlacementDrive")


class LearningRecommendation(Base, TenantScopedMixin, TimestampMixin):
    """
    Tailored skill remediation paths recommended to close identified gaps.
    """
    __tablename__ = "learning_recommendations"

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
    target_role_id: Mapped[uuid.UUID | None] = mapped_column(
        ForeignKey("job_roles.id", ondelete="SET NULL"),
        nullable=True,
    )
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    action_type: Mapped[RecommendationActionType] = mapped_column(
        SQLEnum(RecommendationActionType, name="action_type_enum", native_enum=False),
        nullable=False,
    )
    description: Mapped[str] = mapped_column(Text, nullable=False)
    estimated_hours: Mapped[int] = mapped_column(Integer, default=10, nullable=False)
    is_completed: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    # Relationships
    student: Mapped["Student"] = relationship("Student", back_populates="recommendations")
    skill: Mapped["Skill"] = relationship("Skill")
    target_role: Mapped[Optional["JobRole"]] = relationship("JobRole")
