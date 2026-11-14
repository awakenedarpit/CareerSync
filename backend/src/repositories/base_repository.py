"""
Base Repository Layer
Generic CRUD abstraction with multi-tenant filtering defense-in-depth.
"""

from typing import Generic, List, Optional, Type, TypeVar
import uuid

from sqlalchemy import delete, select
from sqlalchemy.ext.asyncio import AsyncSession

from ..models.base import Base

ModelType = TypeVar("ModelType", bound=Base)


class BaseRepository(Generic[ModelType]):
    """Generic repository providing standardized async persistence operations."""

    def __init__(self, model: Type[ModelType]):
        self.model = model

    async def get_by_id(
        self,
        session: AsyncSession,
        entity_id: uuid.UUID,
        tenant_id: Optional[uuid.UUID] = None,
    ) -> Optional[ModelType]:
        stmt = select(self.model).where(self.model.id == entity_id)
        if tenant_id and hasattr(self.model, "tenant_id"):
            stmt = stmt.where(self.model.tenant_id == tenant_id)
        result = await session.execute(stmt)
        return result.scalar_one_or_none()

    async def list_all(
        self,
        session: AsyncSession,
        tenant_id: Optional[uuid.UUID] = None,
        limit: int = 100,
        offset: int = 0,
    ) -> List[ModelType]:
        stmt = select(self.model)
        if tenant_id and hasattr(self.model, "tenant_id"):
            stmt = stmt.where(self.model.tenant_id == tenant_id)
        stmt = stmt.limit(limit).offset(offset)
        result = await session.execute(stmt)
        return list(result.scalars().all())

    async def create(self, session: AsyncSession, instance: ModelType) -> ModelType:
        session.add(instance)
        await session.flush()
        return instance

    async def update(self, session: AsyncSession, instance: ModelType) -> ModelType:
        await session.flush()
        return instance

    async def delete(self, session: AsyncSession, instance: ModelType) -> None:
        await session.delete(instance)
        await session.flush()
