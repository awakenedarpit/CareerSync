"""
Tests for CarrerSync Repository Layer
"""

import uuid
import pytest

from src.models import (
    Tenant,
    User,
    UserRole,
    Student,
    Skill,
    SkillCategory,
    SkillState,
    ProficiencyLevel,
    EvidenceType,
    Company,
    JobRole,
    PlacementDrive,
    DriveStatus,
    ApplicationStatus,
    AgentType,
    AgentExecutionStatus,
)
from src.repositories import (
    StudentRepository,
    SkillRepository,
    PlacementRepository,
    AuditRepository,
)


@pytest.mark.asyncio
async def test_student_repository(db_session):
    repo = StudentRepository()
    tenant = Tenant(id=uuid.uuid4(), name="Repo Test College", slug="repo-test")
    user = User(id=uuid.uuid4(), tenant_id=tenant.id, email="repo@test.edu", password_hash="h", full_name="Student", role=UserRole.STUDENT)
    student = Student(id=uuid.uuid4(), tenant_id=tenant.id, user_id=user.id, roll_number="CS-101", department="CS", batch_year=2026, cgpa=8.4, backlog_count=0)
    db_session.add_all([tenant, user, student])
    await db_session.flush()

    found = await repo.get_by_roll_number(db_session, tenant.id, "CS-101")
    assert found is not None
    assert found.roll_number == "CS-101"

    # Eligible query
    eligible = await repo.list_eligible_students(db_session, tenant.id, min_cgpa=7.5, max_backlogs=0)
    assert len(eligible) == 1

    ineligible = await repo.list_eligible_students(db_session, tenant.id, min_cgpa=9.0, max_backlogs=0)
    assert len(ineligible) == 0


@pytest.mark.asyncio
async def test_skill_repository_lifecycle(db_session):
    repo = SkillRepository()
    tenant = Tenant(id=uuid.uuid4(), name="Skill Test College", slug="skill-test")
    user = User(id=uuid.uuid4(), tenant_id=tenant.id, email="skill_user@test.edu", password_hash="h", full_name="User", role=UserRole.STUDENT)
    student = Student(id=uuid.uuid4(), tenant_id=tenant.id, user_id=user.id, roll_number="CS-202", department="CS", batch_year=2026, cgpa=8.0)
    db_session.add_all([tenant, user, student])
    await db_session.flush()

    # Get or create skill
    skill = await repo.get_or_create_skill(db_session, "FastAPI", SkillCategory.FRAMEWORKS, "High performance Python framework")
    assert skill.canonical_slug == "fastapi"

    # Attach skill as Claimed
    ss = await repo.attach_student_skill(db_session, tenant.id, student.id, skill.id, SkillState.CLAIMED, ProficiencyLevel.BEGINNER)
    assert ss.state == SkillState.CLAIMED

    # Update to Evidence-linked
    updated = await repo.update_skill_state(db_session, tenant.id, student.id, skill.id, SkillState.EVIDENCE_LINKED)
    assert updated.state == SkillState.EVIDENCE_LINKED

    # Add evidence record
    ev = await repo.create_evidence_record(
        db_session,
        tenant_id=tenant.id,
        student_id=student.id,
        skill_id=skill.id,
        evidence_type=EvidenceType.PROJECT_REPOSITORY,
        source_url="https://github.com/test/fastapi-app",
    )
    assert ev.id is not None
    assert ev.source_url == "https://github.com/test/fastapi-app"


@pytest.mark.asyncio
async def test_audit_repository(db_session):
    repo = AuditRepository()
    tenant = Tenant(id=uuid.uuid4(), name="Audit College", slug="audit-coll")
    db_session.add(tenant)
    await db_session.flush()

    audit = await repo.record_audit_event(
        db_session,
        tenant_id=tenant.id,
        action="TEST_ACTION",
        resource_type="student",
        resource_id="123",
        changes_diff={"field": "value"},
    )
    assert audit.action == "TEST_ACTION"

    agent_log = await repo.log_agent_execution(
        db_session,
        tenant_id=tenant.id,
        agent_type=AgentType.PREDICTIVE_ANALYTICS,
        execution_mode="rule_engine",
        latency_ms=120,
        status=AgentExecutionStatus.SUCCESS,
        tokens_consumed=0,
    )
    assert agent_log.status == AgentExecutionStatus.SUCCESS
