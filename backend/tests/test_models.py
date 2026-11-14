"""
Tests for SQLAlchemy 2.0 Declarative Models & Constraints
"""

from datetime import date, datetime, timezone
import uuid
import pytest
from sqlalchemy.exc import IntegrityError

from src.models import (
    Tenant,
    User,
    UserRole,
    Student,
    AcademicSemester,
    Skill,
    SkillCategory,
    StudentSkill,
    SkillState,
    ProficiencyLevel,
    EvidenceRecord,
    EvidenceType,
    Company,
    JobRole,
    PlacementDrive,
    Application,
    ApplicationStatus,
    SkillGapAnalysis,
    PlacementPrediction,
    RiskTier,
)


@pytest.mark.asyncio
async def test_tenant_creation(db_session):
    tenant = Tenant(
        id=uuid.uuid4(),
        name="Test Technical University",
        slug="test-tech",
        domain="test.edu",
    )
    db_session.add(tenant)
    await db_session.flush()

    assert tenant.id is not None
    assert tenant.name == "Test Technical University"
    assert tenant.slug == "test-tech"
    assert tenant.is_active is True


@pytest.mark.asyncio
async def test_user_tenant_unique_constraint(db_session):
    tenant = Tenant(id=uuid.uuid4(), name="College A", slug="college-a")
    db_session.add(tenant)
    await db_session.flush()

    user1 = User(
        id=uuid.uuid4(),
        tenant_id=tenant.id,
        email="test@college.edu",
        password_hash="hashed_secret",
        full_name="User One",
        role=UserRole.STUDENT,
    )
    db_session.add(user1)
    await db_session.flush()

    # Attempt duplicate email in same tenant
    user2 = User(
        id=uuid.uuid4(),
        tenant_id=tenant.id,
        email="test@college.edu",
        password_hash="hashed_secret_2",
        full_name="User Two",
        role=UserRole.STUDENT,
    )
    db_session.add(user2)

    with pytest.raises(IntegrityError):
        await db_session.flush()

    await db_session.rollback()


@pytest.mark.asyncio
async def test_five_skill_states(db_session):
    tenant = Tenant(id=uuid.uuid4(), name="College B", slug="college-b")
    user = User(
        id=uuid.uuid4(),
        tenant_id=tenant.id,
        email="student@college.edu",
        password_hash="hash",
        full_name="A Student",
        role=UserRole.STUDENT,
    )
    student = Student(
        id=uuid.uuid4(),
        tenant_id=tenant.id,
        user_id=user.id,
        roll_number="CS-001",
        department="Computer Science",
        batch_year=2026,
        cgpa=8.5,
    )
    db_session.add_all([tenant, user, student])
    await db_session.flush()

    # Test all 5 states explicitly
    states_to_test = [
        SkillState.CLAIMED,
        SkillState.OBSERVED,
        SkillState.EVIDENCE_LINKED,
        SkillState.VERIFIED,
        SkillState.EXPIRED,
    ]

    for state in states_to_test:
        skill = Skill(
            id=uuid.uuid4(),
            name=f"Skill for {state.value}",
            canonical_slug=f"skill-{state.value.lower()}",
            category=SkillCategory.PROGRAMMING_LANGUAGES,
        )
        db_session.add(skill)
        await db_session.flush()

        student_skill = StudentSkill(
            tenant_id=tenant.id,
            student_id=student.id,
            skill_id=skill.id,
            state=state,
            proficiency_level=ProficiencyLevel.INTERMEDIATE,
            confidence_score=0.85,
        )
        db_session.add(student_skill)
        await db_session.flush()

        assert student_skill.state == state
        assert student_skill.state.value in [
            "Claimed", "Observed", "Evidence-linked", "Verified", "Expired"
        ]


@pytest.mark.asyncio
async def test_placement_prediction_advisory_constraint(db_session):
    tenant = Tenant(id=uuid.uuid4(), name="College C", slug="college-c")
    user = User(id=uuid.uuid4(), tenant_id=tenant.id, email="s@c.edu", password_hash="h", full_name="S", role=UserRole.STUDENT)
    student = Student(id=uuid.uuid4(), tenant_id=tenant.id, user_id=user.id, roll_number="R1", department="IT", batch_year=2026, cgpa=9.0)
    db_session.add_all([tenant, user, student])
    await db_session.flush()

    prediction = PlacementPrediction(
        tenant_id=tenant.id,
        student_id=student.id,
        probability_score=92.5,
        risk_tier=RiskTier.LOW_RISK,
        contributing_factors_json={"academic": 32.0},
        is_advisory_only=True,
    )
    db_session.add(prediction)
    await db_session.flush()

    assert prediction.is_advisory_only is True
    assert prediction.risk_tier == RiskTier.LOW_RISK
