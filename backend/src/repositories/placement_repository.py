"""
Placement Drives & Applications Repository
"""

from typing import List, Optional
import uuid

from sqlalchemy import select
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession

from .base_repository import BaseRepository
from ..models.placement import PlacementDrive, Application, Interview
from ..models.enums import ApplicationStatus, DriveStatus


class PlacementRepository(BaseRepository[PlacementDrive]):
    def __init__(self):
        super().__init__(PlacementDrive)

    async def list_active_drives(
        self,
        session: AsyncSession,
        tenant_id: uuid.UUID,
        batch_year: Optional[int] = None,
    ) -> List[PlacementDrive]:
        stmt = (
            select(PlacementDrive)
            .options(selectinload(PlacementDrive.job_role))
            .where(
                PlacementDrive.tenant_id == tenant_id,
                PlacementDrive.status.in_([DriveStatus.PUBLISHED, DriveStatus.ONGOING]),
            )
        )
        if batch_year:
            stmt = stmt.where(PlacementDrive.batch_year == batch_year)
        res = await session.execute(stmt)
        return list(res.scalars().all())

    async def get_drive_details(
        self,
        session: AsyncSession,
        tenant_id: uuid.UUID,
        drive_id: uuid.UUID,
    ) -> Optional[PlacementDrive]:
        stmt = (
            select(PlacementDrive)
            .options(
                selectinload(PlacementDrive.job_role),
                selectinload(PlacementDrive.applications),
            )
            .where(PlacementDrive.id == drive_id, PlacementDrive.tenant_id == tenant_id)
        )
        res = await session.execute(stmt)
        return res.scalar_one_or_none()

    async def create_application(
        self,
        session: AsyncSession,
        tenant_id: uuid.UUID,
        drive_id: uuid.UUID,
        student_id: uuid.UUID,
    ) -> Application:
        app = Application(
            tenant_id=tenant_id,
            drive_id=drive_id,
            student_id=student_id,
            status=ApplicationStatus.APPLIED,
        )
        session.add(app)
        await session.flush()
        return app

    async def update_application_status(
        self,
        session: AsyncSession,
        tenant_id: uuid.UUID,
        application_id: uuid.UUID,
        status: ApplicationStatus,
        decision_by_user_id: Optional[uuid.UUID] = None,
    ) -> Optional[Application]:
        stmt = select(Application).where(
            Application.id == application_id,
            Application.tenant_id == tenant_id,
        )
        res = await session.execute(stmt)
        app = res.scalar_one_or_none()
        if not app:
            return None

        app.status = status
        if decision_by_user_id:
            app.final_decision_by = decision_by_user_id

        await session.flush()
        return app
