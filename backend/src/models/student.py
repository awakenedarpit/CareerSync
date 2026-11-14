"""
Student Profiles & Academic Records Model
Enforces verifiable academic performance and student privacy.
"""

from datetime import date
from typing import List, TYPE_CHECKING
import uuid

from sqlalchemy import Date, ForeignKey, Index, Integer, Numeric, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .base import Base, TenantScopedMixin, TimestampMixin

if TYPE_CHECKING:
    from .tenant import Tenant
    from .user import User
    from .skill import StudentSkill, EvidenceRecord, SkillAssessment
    from .placement import Application
    from .analysis import SkillGapAnalysis, PlacementPrediction, LearningRecommendation


class Student(Base, TenantScopedMixin, TimestampMixin):
    __tablename__ = "students"
    __table_args__ = (
        UniqueConstraint("tenant_id", "roll_number", name="uq_students_tenant_roll"),
        Index("ix_students_tenant_batch_dept", "tenant_id", "batch_year", "department"),
        Index("ix_students_tenant_cgpa", "tenant_id", "cgpa"),
    )

    id: Mapped[uuid.UUID] = mapped_column(
        primary_key=True,
        default=uuid.uuid4,
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"),
        unique=True,
        nullable=False,
    )
    roll_number: Mapped[str] = mapped_column(String(50), nullable=False)
    department: Mapped[str] = mapped_column(String(100), nullable=False)
    batch_year: Mapped[int] = mapped_column(Integer, nullable=False)
    degree: Mapped[str] = mapped_column(String(50), default="B.Tech", nullable=False)
    cgpa: Mapped[float] = mapped_column(Numeric(4, 2), nullable=False)
    backlog_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)

    # Privacy & Ethical Guardrails
    date_of_birth: Mapped[date | None] = mapped_column(Date, nullable=True)
    resume_r2_url: Mapped[str | None] = mapped_column(String(512), nullable=True)
    readiness_score: Mapped[float] = mapped_column(Numeric(5, 2), default=0.00, nullable=False)

    # Relationships
    tenant: Mapped["Tenant"] = relationship("Tenant", back_populates="students")
    user: Mapped["User"] = relationship("User", back_populates="student")
    semesters: Mapped[List["AcademicSemester"]] = relationship("AcademicSemester", back_populates="student", cascade="all, delete-orphan")
    skills: Mapped[List["StudentSkill"]] = relationship("StudentSkill", back_populates="student", cascade="all, delete-orphan")
    evidence: Mapped[List["EvidenceRecord"]] = relationship("EvidenceRecord", back_populates="student", cascade="all, delete-orphan")
    assessments: Mapped[List["SkillAssessment"]] = relationship("SkillAssessment", back_populates="student", cascade="all, delete-orphan")
    applications: Mapped[List["Application"]] = relationship("Application", back_populates="student", cascade="all, delete-orphan")
    gap_analyses: Mapped[List["SkillGapAnalysis"]] = relationship("SkillGapAnalysis", back_populates="student", cascade="all, delete-orphan")
    predictions: Mapped[List["PlacementPrediction"]] = relationship("PlacementPrediction", back_populates="student", cascade="all, delete-orphan")
    recommendations: Mapped[List["LearningRecommendation"]] = relationship("LearningRecommendation", back_populates="student", cascade="all, delete-orphan")

    def __repr__(self) -> str:
        return f"<Student(id={self.id}, roll='{self.roll_number}', dept='{self.department}', cgpa={self.cgpa})>"


class AcademicSemester(Base, TenantScopedMixin, TimestampMixin):
    __tablename__ = "academic_semesters"
    __table_args__ = (
        UniqueConstraint("student_id", "semester_number", name="uq_semester_student_num"),
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
    semester_number: Mapped[int] = mapped_column(Integer, nullable=False)
    sgpa: Mapped[float] = mapped_column(Numeric(4, 2), nullable=False)
    credits_earned: Mapped[float] = mapped_column(Numeric(4, 1), nullable=False)
    backlogs_in_semester: Mapped[int] = mapped_column(Integer, default=0, nullable=False)

    student: Mapped["Student"] = relationship("Student", back_populates="semesters")
