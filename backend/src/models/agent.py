"""
Agent Execution Logs & Workflow History Models
Tracks multi-agent reasoning, latency, zero-cost token consumption, and state machines.
"""

from datetime import datetime
from typing import Any, Dict, List, TYPE_CHECKING
import uuid

from sqlalchemy import (
    DateTime,
    Enum as SQLEnum,
    ForeignKey,
    Index,
    Integer,
    JSON,
    String,
    Text,
)
from sqlalchemy.orm import Mapped, mapped_column

from .base import Base, TenantScopedMixin, TimestampMixin, utc_now
from .enums import AgentExecutionStatus, AgentType

if TYPE_CHECKING:
    from .user import User


class AgentExecutionLog(Base, TenantScopedMixin):
    """
    Audit log of AI Agent operations.
    Monitors token consumption against free-tier quotas and tracks fallback invocations.
    """
    __tablename__ = "agent_execution_logs"
    __table_args__ = (
        Index("ix_agent_logs_tenant_type_status", "tenant_id", "agent_type", "status"),
    )

    id: Mapped[uuid.UUID] = mapped_column(
        primary_key=True,
        default=uuid.uuid4,
    )
    agent_type: Mapped[AgentType] = mapped_column(
        SQLEnum(AgentType, name="agent_type_enum", native_enum=False),
        nullable=False,
    )
    triggered_by: Mapped[uuid.UUID | None] = mapped_column(
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
    )
    execution_mode: Mapped[str] = mapped_column(String(50), nullable=False)
    input_payload_digest: Mapped[str | None] = mapped_column(String(64), nullable=True)
    tokens_consumed: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    latency_ms: Mapped[int] = mapped_column(Integer, nullable=False)
    status: Mapped[AgentExecutionStatus] = mapped_column(
        SQLEnum(AgentExecutionStatus, name="agent_exec_status_enum", native_enum=False),
        nullable=False,
    )
    error_message: Mapped[str | None] = mapped_column(Text, nullable=True)
    executed_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now, nullable=False)


class AgentWorkflow(Base, TenantScopedMixin, TimestampMixin):
    """
    State machine tracking long-running agentic placement workflows.
    """
    __tablename__ = "agent_workflows"
    __table_args__ = (
        Index("ix_workflows_tenant_entity", "tenant_id", "target_entity_type", "target_entity_id"),
    )

    id: Mapped[uuid.UUID] = mapped_column(
        primary_key=True,
        default=uuid.uuid4,
    )
    workflow_name: Mapped[str] = mapped_column(String(150), nullable=False)
    target_entity_type: Mapped[str] = mapped_column(String(50), nullable=False)
    target_entity_id: Mapped[uuid.UUID] = mapped_column(nullable=False)
    current_stage: Mapped[str] = mapped_column(String(100), nullable=False)
    state_history: Mapped[List[Dict[str, Any]]] = mapped_column(JSON, default=list, nullable=False)
