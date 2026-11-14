"""
Student & Academic Records Repository
"""

from typing import List, Optional
import uuid

from sqlalchemy import select
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession

from .base_repository import BaseRepository
from ..models.student import Student, AcademicSemester


class StudentRepository(BaseRepository[Student]):
    def __init__(self):
        super().__init__(Student)

    async def get_by_roll_number(
        self,
        session: AsyncSession,
        tenant_id: uuid.UUID,
        roll_number: str,
    ) -> Optional[Student]:
        stmt = (
            select(Student)
            .where(Student.tenant_id == tenant_id, Student.roll_number == roll_number)
        )
        res = await session.execute(stmt)
        return res.scalar_one_or_none()

    async def get_student_profile(
        self,
        session: AsyncSession,
        tenant_id: uuid.UUID,
        student_id: uuid.UUID,
    ) -> Optional[Student]:
        """Loads complete student profile with verified skills and academic semesters."""
        stmt = (
            select(Student)
            .options(
                selectinload(Student.skills),
                selectinload(Student.semesters),
                selectinload(Student.evidence),
            )
            .where(Student.id == student_id, Student.tenant_id == tenant_id)
        )
        res = await session.execute(stmt)
        return res.scalar_one_or_none()

    async def list_eligible_students(
        self,
        session: AsyncSession,
        tenant_id: uuid.UUID,
        min_cgpa: float,
        max_backlogs: int,
        department: Optional[str] = None,
    ) -> List[Student]:
        """Queries candidates meeting deterministic criteria without AI subjectivity."""
        stmt = (
            select(Student)
            .where(
                Student.tenant_id == tenant_id,
                Student.cgpa >= min_cgpa,
                Student.backlog_count <= max_backlogs,
            )
        )
        if department:
            stmt = stmt.where(Student.department == department)
        res = await session.execute(stmt)
        return list(res.scalars().all())
