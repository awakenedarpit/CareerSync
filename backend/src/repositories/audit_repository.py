"""
Audit Events & Agent Execution Logs Repository
"""

from typing import Any, Dict, List, Optional
import uuid

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from .base_repository import BaseRepository
from ..models.audit import AuditEvent, Notification
from ..models.agent import AgentExecutionLog
from ..models.enums import AgentExecutionStatus, AgentType, NotificationType


class AuditRepository:
    """Manages immutable audit logging and AI Agent metrics."""

    async def record_audit_event(
        self,
        session: AsyncSession,
        tenant_id: uuid.UUID,
        action: str,
        resource_type: str,
        actor_id: Optional[uuid.UUID] = None,
        actor_email: Optional[str] = None,
        resource_id: Optional[str] = None,
        changes_diff: Optional[Dict[str, Any]] = None,
        ip_address: Optional[str] = None,
    ) -> AuditEvent:
        event = AuditEvent(
            tenant_id=tenant_id,
            actor_id=actor_id,
            actor_email=actor_email,
            action=action,
            resource_type=resource_type,
            resource_id=resource_id,
            changes_diff=changes_diff or {},
            ip_address=ip_address,
        )
        session.add(event)
        await session.flush()
        return event

    async def log_agent_execution(
        self,
        session: AsyncSession,
        tenant_id: uuid.UUID,
        agent_type: AgentType,
        execution_mode: str,
        latency_ms: int,
        status: AgentExecutionStatus,
        tokens_consumed: int = 0,
        triggered_by: Optional[uuid.UUID] = None,
        error_message: Optional[str] = None,
    ) -> AgentExecutionLog:
        log = AgentExecutionLog(
            tenant_id=tenant_id,
            agent_type=agent_type,
            execution_mode=execution_mode,
            latency_ms=latency_ms,
            status=status,
            tokens_consumed=tokens_consumed,
            triggered_by=triggered_by,
            error_message=error_message,
        )
        session.add(log)
        await session.flush()
        return log

    async def create_notification(
        self,
        session: AsyncSession,
        tenant_id: uuid.UUID,
        recipient_user_id: uuid.UUID,
        title: str,
        message: str,
        notification_type: NotificationType = NotificationType.SYSTEM,
    ) -> Notification:
        notif = Notification(
            tenant_id=tenant_id,
            recipient_user_id=recipient_user_id,
            title=title,
            message=message,
            type=notification_type,
        )
        session.add(notif)
        await session.flush()
        return notif
