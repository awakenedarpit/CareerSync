"""
Repository Layer Package
Exports BaseRepository and specialized repositories.
"""

from .base_repository import BaseRepository
from .student_repository import StudentRepository
from .skill_repository import SkillRepository
from .placement_repository import PlacementRepository
from .audit_repository import AuditRepository

__all__ = [
    "BaseRepository",
    "StudentRepository",
    "SkillRepository",
    "PlacementRepository",
    "AuditRepository",
]
