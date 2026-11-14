"""
Tests for CarrerSync Service Layer & Business Logic
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
    StudentSkill,
    SkillState,
    ProficiencyLevel,
)
from src.services.auth_service import AuthService
from src.services.student_service import StudentService
from src.services.rls_service import RLSService


def test_auth_password_hashing():
    pwd = "SecurePassword@123"
    hashed = AuthService.hash_password(pwd)
    assert hashed != pwd
    assert AuthService.verify_password(pwd, hashed) is True
    assert AuthService.verify_password("WrongPassword", hashed) is False


def test_jwt_token_lifecycle():
    user_id = uuid.uuid4()
    tenant_id = uuid.uuid4()
    token = AuthService.create_access_token(user_id=user_id, tenant_id=tenant_id, role=UserRole.STUDENT)
    assert isinstance(token, str)

    payload = AuthService.decode_token(token)
    assert payload["sub"] == str(user_id)
    assert payload["tenant_id"] == str(tenant_id)
    assert payload["role"] == UserRole.STUDENT.value


@pytest.mark.asyncio
async def test_student_service_permission_enforcement(db_session):
    service = StudentService()
    tenant = Tenant(id=uuid.uuid4(), name="Service Test College", slug="srv-test")
    user = User(id=uuid.uuid4(), tenant_id=tenant.id, email="srv_s@test.edu", password_hash="h", full_name="Student", role=UserRole.STUDENT)
    admin_user = User(id=uuid.uuid4(), tenant_id=tenant.id, email="srv_a@test.edu", password_hash="h", full_name="Admin", role=UserRole.COLLEGE_ADMIN)
    student = Student(id=uuid.uuid4(), tenant_id=tenant.id, user_id=user.id, roll_number="CS-999", department="CS", batch_year=2026, cgpa=8.5)
    skill = Skill(id=uuid.uuid4(), name="SQL", canonical_slug="sql", category=SkillCategory.DATABASES)
    db_session.add_all([tenant, user, admin_user, student, skill])
    await db_session.flush()

    # Student starts with Claimed skill
    ss = StudentSkill(
        tenant_id=tenant.id,
        student_id=student.id,
        skill_id=skill.id,
        state=SkillState.CLAIMED,
        proficiency_level=ProficiencyLevel.BEGINNER,
    )
    db_session.add(ss)
    await db_session.flush()

    # Attempt 1: Student tries to mark their own skill as Verified -> Must Raise PermissionError
    with pytest.raises(PermissionError):
        await service.update_skill_state(
            db_session,
            tenant_id=tenant.id,
            student_id=student.id,
            skill_id=skill.id,
            new_state=SkillState.VERIFIED,
            actor_id=user.id,
            actor_role=UserRole.STUDENT,
        )

    # Attempt 2: Admin verifies the skill -> Must Succeed
    updated = await service.update_skill_state(
        db_session,
        tenant_id=tenant.id,
        student_id=student.id,
        skill_id=skill.id,
        new_state=SkillState.VERIFIED,
        actor_id=admin_user.id,
        actor_role=UserRole.COLLEGE_ADMIN,
    )
    assert updated.state == SkillState.VERIFIED
    assert updated.verified_by_user_id == admin_user.id
    assert updated.verified_at is not None

    # Readiness score recalculated
    await db_session.refresh(student)
    assert student.readiness_score > 0.0


def test_rls_sql_generation():
    sqls = RLSService.get_enable_rls_sql()
    assert len(sqls) > 0
    # Must contain enable RLS for tenant-scoped tables
    assert any("ALTER TABLE students ENABLE ROW LEVEL SECURITY;" in s for s in sqls)
    assert any("ALTER TABLE users ENABLE ROW LEVEL SECURITY;" in s for s in sqls)
    assert any("ALTER TABLE applications ENABLE ROW LEVEL SECURITY;" in s for s in sqls)
