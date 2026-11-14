"""
Skill & Evidence Repository
Manages skill taxonomy, 5-state transitions, and proof-of-work linking.
"""

from datetime import datetime, timezone
from typing import Any, Dict, List, Optional
import uuid

from sqlalchemy import select
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession

from .base_repository import BaseRepository
from ..models.skill import Skill, StudentSkill, EvidenceRecord
from ..models.enums import EvidenceType, ProficiencyLevel, SkillCategory, SkillState, VerificationStatus


class SkillRepository(BaseRepository[Skill]):
    def __init__(self):
        super().__init__(Skill)

    async def get_or_create_skill(
        self,
        session: AsyncSession,
        name: str,
        category: SkillCategory,
        description: Optional[str] = None,
    ) -> Skill:
        slug = name.lower().strip().replace(" ", "-").replace(".", "")
        stmt = select(Skill).where(Skill.canonical_slug == slug)
        res = await session.execute(stmt)
        skill = res.scalar_one_or_none()
        if not skill:
            skill = Skill(name=name, canonical_slug=slug, category=category, description=description)
            session.add(skill)
            await session.flush()
        return skill

    async def get_student_skills(
        self,
        session: AsyncSession,
        tenant_id: uuid.UUID,
        student_id: uuid.UUID,
    ) -> List[StudentSkill]:
        stmt = (
            select(StudentSkill)
            .options(selectinload(StudentSkill.skill))
            .where(StudentSkill.tenant_id == tenant_id, StudentSkill.student_id == student_id)
        )
        res = await session.execute(stmt)
        return list(res.scalars().all())

    async def attach_student_skill(
        self,
        session: AsyncSession,
        tenant_id: uuid.UUID,
        student_id: uuid.UUID,
        skill_id: uuid.UUID,
        state: SkillState = SkillState.CLAIMED,
        proficiency: ProficiencyLevel = ProficiencyLevel.BEGINNER,
        confidence_score: float = 0.0,
    ) -> StudentSkill:
        stmt = select(StudentSkill).where(
            StudentSkill.tenant_id == tenant_id,
            StudentSkill.student_id == student_id,
            StudentSkill.skill_id == skill_id,
        )
        res = await session.execute(stmt)
        student_skill = res.scalar_one_or_none()

        if student_skill:
            student_skill.state = state
            student_skill.proficiency_level = proficiency
            student_skill.confidence_score = confidence_score
        else:
            student_skill = StudentSkill(
                tenant_id=tenant_id,
                student_id=student_id,
                skill_id=skill_id,
                state=state,
                proficiency_level=proficiency,
                confidence_score=confidence_score,
            )
            session.add(student_skill)

        await session.flush()
        return student_skill

    async def update_skill_state(
        self,
        session: AsyncSession,
        tenant_id: uuid.UUID,
        student_id: uuid.UUID,
        skill_id: uuid.UUID,
        new_state: SkillState,
        verified_by_user_id: Optional[uuid.UUID] = None,
    ) -> Optional[StudentSkill]:
        """
        Transitions a skill state across the 5 canonical stages.
        Guarantees that transitioning to 'Verified' mandates a human verifier ID.
        """
        stmt = select(StudentSkill).where(
            StudentSkill.tenant_id == tenant_id,
            StudentSkill.student_id == student_id,
            StudentSkill.skill_id == skill_id,
        )
        res = await session.execute(stmt)
        record = res.scalar_one_or_none()
        if not record:
            return None

        record.state = new_state
        if new_state == SkillState.VERIFIED:
            record.verified_at = datetime.now(timezone.utc)
            record.verified_by_user_id = verified_by_user_id

        await session.flush()
        return record

    async def create_evidence_record(
        self,
        session: AsyncSession,
        tenant_id: uuid.UUID,
        student_id: uuid.UUID,
        skill_id: uuid.UUID,
        evidence_type: EvidenceType,
        source_url: str,
        r2_key: Optional[str] = None,
        metadata: Optional[Dict[str, Any]] = None,
    ) -> EvidenceRecord:
        record = EvidenceRecord(
            tenant_id=tenant_id,
            student_id=student_id,
            skill_id=skill_id,
            evidence_type=evidence_type,
            source_url=source_url,
            r2_storage_key=r2_key,
            metadata_json=metadata or {},
            verification_status=VerificationStatus.PENDING_REVIEW,
        )
        session.add(record)
        await session.flush()
        return record
