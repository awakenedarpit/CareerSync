"""
Student Profile & Skill State Management Service
Enforces domain rules, the 5-state lifecycle, and ethical constraints.
"""

from typing import Any, Dict, List, Optional
import uuid

from sqlalchemy.ext.asyncio import AsyncSession

from ..models.enums import EvidenceType, ProficiencyLevel, SkillState, UserRole
from ..models.student import Student
from ..models.skill import StudentSkill, EvidenceRecord
from ..repositories.student_repository import StudentRepository
from ..repositories.skill_repository import SkillRepository
from ..repositories.audit_repository import AuditRepository


class StudentService:
    def __init__(self):
        self.student_repo = StudentRepository()
        self.skill_repo = SkillRepository()
        self.audit_repo = AuditRepository()

    async def update_skill_state(
        self,
        session: AsyncSession,
        tenant_id: uuid.UUID,
        student_id: uuid.UUID,
        skill_id: uuid.UUID,
        new_state: SkillState,
        actor_id: Optional[uuid.UUID] = None,
        actor_role: Optional[UserRole] = None,
    ) -> StudentSkill:
        """
        Transitions student skill across the 5 canonical states:
        Claimed -> Observed -> Evidence-linked -> Verified -> Expired.
        
        ETHICAL RULE ENFORCEMENT:
        - The 'Verified' state CANNOT be set automatically by AI.
        - It strictly requires a human validator (faculty or college admin).
        """
        if new_state == SkillState.VERIFIED:
            if not actor_role or actor_role not in (UserRole.COLLEGE_ADMIN, UserRole.FACULTY_COORDINATOR, UserRole.SUPERADMIN):
                raise PermissionError("Only faculty coordinators or college administrators can verify skills.")

        updated = await self.skill_repo.update_skill_state(
            session=session,
            tenant_id=tenant_id,
            student_id=student_id,
            skill_id=skill_id,
            new_state=new_state,
            verified_by_user_id=actor_id if new_state == SkillState.VERIFIED else None,
        )
        if not updated:
            raise ValueError(f"Student skill record not found for student {student_id} and skill {skill_id}")

        # Recalculate student placement readiness score
        await self.recalculate_readiness_score(session, tenant_id, student_id)

        # Audit log state transition
        await self.audit_repo.record_audit_event(
            session=session,
            tenant_id=tenant_id,
            actor_id=actor_id,
            action="SKILL_STATE_TRANSITION",
            resource_type="student_skill",
            resource_id=str(updated.id),
            changes_diff={"skill_id": str(skill_id), "new_state": new_state.value},
        )
        return updated

    async def recalculate_readiness_score(
        self,
        session: AsyncSession,
        tenant_id: uuid.UUID,
        student_id: uuid.UUID,
    ) -> float:
        """
        Calculates a deterministic, explainable readiness index (0 - 100):
        - Academic CGPA: 35% weight
        - Verified & Evidence-linked Skills: 45% weight
        - Project & Code Artifacts: 20% weight
        """
        student = await self.student_repo.get_by_id(session, student_id, tenant_id=tenant_id)
        if not student:
            return 0.0

        skills = await self.skill_repo.get_student_skills(session, tenant_id, student_id)
        
        # Calculate components
        academic_score = min((float(student.cgpa) / 10.0) * 35.0, 35.0)
        
        verified_count = sum(1 for s in skills if s.state == SkillState.VERIFIED)
        evidence_count = sum(1 for s in skills if s.state == SkillState.EVIDENCE_LINKED)
        skill_score = min((verified_count * 10.0) + (evidence_count * 5.0), 45.0)

        # Base project depth estimation
        project_score = min(len(skills) * 4.0, 20.0)

        total_score = round(academic_score + skill_score + project_score, 2)
        student.readiness_score = total_score
        await session.flush()
        return total_score
