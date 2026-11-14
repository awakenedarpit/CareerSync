"""
Domain Enums for CarrerSync
Defines all authoritative system enums, including the 5 mandatory skill states.
"""

from enum import Enum


class UserRole(str, Enum):
    SUPERADMIN = "superadmin"
    COLLEGE_ADMIN = "college_admin"
    FACULTY_COORDINATOR = "faculty_coordinator"
    RECRUITER = "recruiter"
    STUDENT = "student"


class SkillCategory(str, Enum):
    PROGRAMMING_LANGUAGES = "programming_languages"
    FRAMEWORKS = "frameworks"
    DATABASES = "databases"
    CLOUD_DEVOPS = "cloud_devops"
    CORE_CS = "core_cs"
    DATA_AI = "data_ai"
    SOFT_SKILLS = "soft_skills"


class SkillState(str, Enum):
    """
    Mandatory 5-Stage Skill Verification Lifecycle:
    1. Claimed: Self-reported by student, no inspectable evidence attached.
    2. Observed: Automatically detected from repository commits/artifacts by Profiling Agent.
    3. Evidence_linked: Directly bound to verifiable GitHub commit, PR, or artifact in R2.
    4. Verified: Validated by human faculty/placement admin or verified assessment.
       (AI cannot independently verify or issue final verified status).
    5. Expired: Lapsed without ongoing activity/recertification over defined threshold.
    """
    CLAIMED = "Claimed"
    OBSERVED = "Observed"
    EVIDENCE_LINKED = "Evidence-linked"
    VERIFIED = "Verified"
    EXPIRED = "Expired"


class ProficiencyLevel(str, Enum):
    BEGINNER = "beginner"
    INTERMEDIATE = "intermediate"
    ADVANCED = "advanced"
    EXPERT = "expert"


class EvidenceType(str, Enum):
    GITHUB_COMMIT = "github_commit"
    GITHUB_PR = "github_pr"
    PROJECT_REPOSITORY = "project_repository"
    DEPLOYED_APPLICATION = "deployed_application"
    CODING_ASSESSMENT = "coding_assessment"
    CERTIFICATION = "certification"


class VerificationStatus(str, Enum):
    PENDING_REVIEW = "pending_review"
    VALIDATED = "validated"
    REJECTED = "rejected"


class DriveStatus(str, Enum):
    DRAFT = "draft"
    PUBLISHED = "published"
    ONGOING = "ongoing"
    COMPLETED = "completed"
    CANCELLED = "cancelled"


class ApplicationStatus(str, Enum):
    APPLIED = "applied"
    ELIGIBLE = "eligible"
    SHORTLISTED = "shortlisted"
    INTERVIEW_SCHEDULED = "interview_scheduled"
    OFFERED = "offered"
    REJECTED = "rejected"
    WITHDRAWN = "withdrawn"


class InterviewRoundType(str, Enum):
    ONLINE_TEST = "online_test"
    TECHNICAL_1 = "technical_1"
    TECHNICAL_2 = "technical_2"
    HR = "hr"
    MANAGEMENT = "management"


class InterviewStatus(str, Enum):
    SCHEDULED = "scheduled"
    CLEARED = "cleared"
    FAILED = "failed"
    CANCELLED = "cancelled"


class RiskTier(str, Enum):
    LOW_RISK = "low_risk"
    MODERATE_RISK = "moderate_risk"
    HIGH_RISK = "high_risk"


class RecommendationActionType(str, Enum):
    PROJECT_MILESTONE = "project_milestone"
    HANDS_ON_LAB = "hands_on_lab"
    COURSE_MODULE = "course_module"
    PRACTICE_PROBLEM = "practice_problem"


class AgentType(str, Enum):
    STUDENT_PROFILING = "student_profiling"
    INDUSTRY_SKILL_GAP = "industry_skill_gap"
    PREDICTIVE_ANALYTICS = "predictive_analytics"
    PLACEMENT_ORCHESTRATION = "placement_orchestration"


class AgentExecutionStatus(str, Enum):
    SUCCESS = "success"
    FALLBACK_USED = "fallback_used"
    FAILED = "failed"


class NotificationType(str, Enum):
    DRIVE_ANNOUNCEMENT = "drive_announcement"
    SKILL_VERIFIED = "skill_verified"
    GAP_ALERT = "gap_alert"
    INTERVIEW_CALL = "interview_call"
    SYSTEM = "system"
