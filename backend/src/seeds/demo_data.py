"""
CarrerSync Synthetic Demo Data Seeder
Populates realistic, compliant sample data across multi-tenant institutions.
Guarantees:
- Purely synthetic records (no real PII).
- Explicit age >= 18 (zero behavioral monitoring for minors).
- Exercises all 5 Skill States (Claimed, Observed, Evidence-linked, Verified, Expired).
- Populates all four AI agent models and multi-stage placement workflows.
"""

import asyncio
from datetime import date, datetime, timedelta, timezone
import logging
import uuid

from sqlalchemy.ext.asyncio import AsyncSession

from ..config import settings
from ..database import session_scope, engine
from ..models import (
    Tenant,
    User,
    UserRole,
    Student,
    AcademicSemester,
    Skill,
    SkillCategory,
    StudentSkill,
    SkillState,
    ProficiencyLevel,
    EvidenceRecord,
    EvidenceType,
    VerificationStatus,
    Company,
    JobRole,
    JobRequirement,
    PlacementDrive,
    DriveStatus,
    Application,
    ApplicationStatus,
    Interview,
    InterviewRoundType,
    InterviewStatus,
    SkillGapAnalysis,
    PlacementPrediction,
    RiskTier,
    LearningRecommendation,
    RecommendationActionType,
    AgentExecutionLog,
    AgentType,
    AgentExecutionStatus,
    AuditEvent,
    Notification,
    NotificationType,
)
from ..services.auth_service import AuthService

logger = logging.getLogger("carrersync.seeder")
logging.basicConfig(level=logging.INFO)


async def seed_demo_data():
    """Seeds rich, multi-tenant synthetic data into the database."""
    logger.info("[Seeder] Commencing CarrerSync synthetic data seeding...")

    async with session_scope(enforce_rls=False) as session:
        # 1. Create College Tenants
        tenant_apex = Tenant(
            id=uuid.uuid4(),
            name="Apex Institute of Technology",
            slug="apex-tech",
            domain="apex.edu",
        )
        tenant_horizon = Tenant(
            id=uuid.uuid4(),
            name="Horizon Engineering University",
            slug="horizon-univ",
            domain="horizon.edu",
        )
        session.add_all([tenant_apex, tenant_horizon])
        await session.flush()
        logger.info(f"[Seeder] Created 2 Tenants: {tenant_apex.name}, {tenant_horizon.name}")

        # 2. Standardized Skill Catalog
        skills_data = [
            ("React", "react", SkillCategory.FRAMEWORKS, "Component-based UI library"),
            ("Node.js", "nodejs", SkillCategory.FRAMEWORKS, "Asynchronous event-driven JavaScript runtime"),
            ("Python", "python", SkillCategory.PROGRAMMING_LANGUAGES, "General-purpose programming language"),
            ("PostgreSQL", "postgresql", SkillCategory.DATABASES, "Advanced open-source relational database"),
            ("Docker", "docker", SkillCategory.CLOUD_DEVOPS, "Containerization platform"),
            ("Data Structures & Algorithms", "dsa", SkillCategory.CORE_CS, "Foundational algorithmic problem solving"),
            ("TypeScript", "typescript", SkillCategory.PROGRAMMING_LANGUAGES, "Typed superset of JavaScript"),
            ("Machine Learning", "machine-learning", SkillCategory.DATA_AI, "Statistical learning & predictive models"),
        ]
        created_skills = {}
        for name, slug, cat, desc in skills_data:
            skill = Skill(id=uuid.uuid4(), name=name, canonical_slug=slug, category=cat, description=desc)
            session.add(skill)
            created_skills[slug] = skill
        await session.flush()
        logger.info(f"[Seeder] Created {len(created_skills)} canonical skills.")

        # 3. Create Companies & Job Roles
        company_cloudscale = Company(
            id=uuid.uuid4(),
            name="CloudScale Systems",
            industry_domain="Cloud & Enterprise Software",
            website="https://cloudscale.example.com",
        )
        company_fintech = Company(
            id=uuid.uuid4(),
            name="Apex FinTech Global",
            industry_domain="Banking & Payments",
            website="https://apexfintech.example.com",
        )
        session.add_all([company_cloudscale, company_fintech])
        await session.flush()

        role_sde = JobRole(
            id=uuid.uuid4(),
            company_id=company_cloudscale.id,
            title="Full Stack Software Development Engineer",
            description="Designs scalable microservices and responsive web applications.",
            experience_level="Fresher (2026 Batch)",
            ctc_lpa=14.5,
        )
        role_backend = JobRole(
            id=uuid.uuid4(),
            company_id=company_fintech.id,
            title="Backend Platforms Engineer",
            description="Builds distributed ledger, transaction processing, and PostgreSQL architectures.",
            experience_level="Fresher (2026 Batch)",
            ctc_lpa=16.0,
        )
        session.add_all([role_sde, role_backend])
        await session.flush()

        # Job Requirements for SDE
        reqs = [
            JobRequirement(job_role_id=role_sde.id, skill_id=created_skills["react"].id, min_proficiency=ProficiencyLevel.INTERMEDIATE, weight=1.0),
            JobRequirement(job_role_id=role_sde.id, skill_id=created_skills["nodejs"].id, min_proficiency=ProficiencyLevel.INTERMEDIATE, weight=1.0),
            JobRequirement(job_role_id=role_sde.id, skill_id=created_skills["postgresql"].id, min_proficiency=ProficiencyLevel.INTERMEDIATE, weight=0.8),
            JobRequirement(job_role_id=role_backend.id, skill_id=created_skills["python"].id, min_proficiency=ProficiencyLevel.ADVANCED, weight=1.0),
            JobRequirement(job_role_id=role_backend.id, skill_id=created_skills["postgresql"].id, min_proficiency=ProficiencyLevel.ADVANCED, weight=1.0),
        ]
        session.add_all(reqs)
        await session.flush()

        # 4. Users & Roles for Tenant 1 (Apex)
        password_hash = AuthService.hash_password("DemoPassword@123")

        admin_user = User(
            id=uuid.uuid4(),
            tenant_id=tenant_apex.id,
            email="admin@apex.edu",
            password_hash=password_hash,
            full_name="Dr. Rajesh Sharma",
            role=UserRole.COLLEGE_ADMIN,
            is_active=True,
            is_verified=True,
        )
        faculty_user = User(
            id=uuid.uuid4(),
            tenant_id=tenant_apex.id,
            email="coordinator@apex.edu",
            password_hash=password_hash,
            full_name="Prof. Sunita Rao",
            role=UserRole.FACULTY_COORDINATOR,
            is_active=True,
            is_verified=True,
        )
        recruiter_user = User(
            id=uuid.uuid4(),
            tenant_id=tenant_apex.id,
            email="recruiter@cloudscale.example.com",
            password_hash=password_hash,
            full_name="Vikram Mehta",
            role=UserRole.RECRUITER,
            is_active=True,
            is_verified=True,
        )
        session.add_all([admin_user, faculty_user, recruiter_user])
        await session.flush()

        # 5. Students (Apex Institute) - All ages explicitly >= 20 years old
        student_users_data = [
            ("aditya.sharma@apex.edu", "Aditya Sharma", "APEX-2022-CS041", "Computer Science", 2026, 8.85, 0, date(2003, 5, 14)),
            ("priya.nair@apex.edu", "Priya Nair", "APEX-2022-IT019", "Information Technology", 2026, 9.15, 0, date(2003, 8, 22)),
            ("rohit.verma@apex.edu", "Rohit Verma", "APEX-2022-CS102", "Computer Science", 2026, 7.20, 1, date(2002, 11, 3)),
        ]

        created_students = []
        for email, name, roll, dept, batch, cgpa, backlogs, dob in student_users_data:
            s_user = User(
                id=uuid.uuid4(),
                tenant_id=tenant_apex.id,
                email=email,
                password_hash=password_hash,
                full_name=name,
                role=UserRole.STUDENT,
                is_active=True,
                is_verified=True,
            )
            session.add(s_user)
            await session.flush()

            student = Student(
                id=uuid.uuid4(),
                tenant_id=tenant_apex.id,
                user_id=s_user.id,
                roll_number=roll,
                department=dept,
                batch_year=batch,
                degree="B.Tech",
                cgpa=cgpa,
                backlog_count=backlogs,
                date_of_birth=dob,
                resume_r2_url=f"r2://resumes/{tenant_apex.slug}/{roll}_resume.pdf",
                readiness_score=84.0 if cgpa > 8.0 else 58.0,
            )
            session.add(student)
            created_students.append(student)

            # Add Academic Semesters
            for sem in range(1, 7):
                sem_record = AcademicSemester(
                    tenant_id=tenant_apex.id,
                    student_id=student.id,
                    semester_number=sem,
                    sgpa=min(cgpa + (sem * 0.05) - 0.15, 9.8),
                    credits_earned=22.0,
                    backlogs_in_semester=0,
                )
                session.add(sem_record)

        await session.flush()
        logger.info(f"[Seeder] Created {len(created_students)} student profiles with semester records.")

        # 6. Student Skills Demonstrating All 5 States
        s1 = created_students[0] # Aditya
        student_skills = [
            # State 4: Verified (Human verified by Faculty Coordinator)
            StudentSkill(
                tenant_id=tenant_apex.id,
                student_id=s1.id,
                skill_id=created_skills["react"].id,
                state=SkillState.VERIFIED,
                proficiency_level=ProficiencyLevel.ADVANCED,
                confidence_score=0.940,
                verified_at=datetime.now(timezone.utc) - timedelta(days=5),
                verified_by_user_id=faculty_user.id,
            ),
            # State 3: Evidence-linked (Attached to inspected GitHub commit)
            StudentSkill(
                tenant_id=tenant_apex.id,
                student_id=s1.id,
                skill_id=created_skills["nodejs"].id,
                state=SkillState.EVIDENCE_LINKED,
                proficiency_level=ProficiencyLevel.INTERMEDIATE,
                confidence_score=0.880,
            ),
            # State 2: Observed (Detected by Student Profiling Agent from repo inspection)
            StudentSkill(
                tenant_id=tenant_apex.id,
                student_id=s1.id,
                skill_id=created_skills["docker"].id,
                state=SkillState.OBSERVED,
                proficiency_level=ProficiencyLevel.BEGINNER,
                confidence_score=0.720,
            ),
            # State 1: Claimed (Self-reported by student, no evidence yet)
            StudentSkill(
                tenant_id=tenant_apex.id,
                student_id=s1.id,
                skill_id=created_skills["machine-learning"].id,
                state=SkillState.CLAIMED,
                proficiency_level=ProficiencyLevel.BEGINNER,
                confidence_score=0.300,
            ),
            # State 5: Expired (Certification lapsed over 18 months ago)
            StudentSkill(
                tenant_id=tenant_apex.id,
                student_id=s1.id,
                skill_id=created_skills["python"].id,
                state=SkillState.EXPIRED,
                proficiency_level=ProficiencyLevel.INTERMEDIATE,
                confidence_score=0.500,
                expiry_date=datetime.now(timezone.utc) - timedelta(days=60),
            ),
        ]
        session.add_all(student_skills)
        await session.flush()
        logger.info("[Seeder] Successfully mapped skills across all 5 states (Claimed, Observed, Evidence-linked, Verified, Expired).")

        # 7. Evidence Records (GitHub proof-of-work)
        ev1 = EvidenceRecord(
            tenant_id=tenant_apex.id,
            student_id=s1.id,
            skill_id=created_skills["react"].id,
            evidence_type=EvidenceType.PROJECT_REPOSITORY,
            source_url="https://github.com/aditya-sharma/campus-events-frontend",
            r2_storage_key="r2://evidence/apex-tech/aditya_react_app.tar.gz",
            metadata_json={"commits_count": 48, "pr_merged": 12, "lighthouse_score": 96},
            verification_status=VerificationStatus.VALIDATED,
            validated_by=faculty_user.id,
        )
        ev2 = EvidenceRecord(
            tenant_id=tenant_apex.id,
            student_id=s1.id,
            skill_id=created_skills["nodejs"].id,
            evidence_type=EvidenceType.GITHUB_COMMIT,
            source_url="https://github.com/aditya-sharma/event-sync-api/commit/a8f9c12",
            metadata_json={"lines_added": 420, "test_coverage": "85%"},
            verification_status=VerificationStatus.VALIDATED,
            validated_by=faculty_user.id,
        )
        session.add_all([ev1, ev2])
        await session.flush()

        # 8. Placement Drive & Applications
        drive = PlacementDrive(
            id=uuid.uuid4(),
            tenant_id=tenant_apex.id,
            job_role_id=role_sde.id,
            batch_year=2026,
            min_cgpa=7.50,
            max_backlogs_allowed=0,
            eligible_departments=["Computer Science", "Information Technology"],
            registration_start=datetime.now(timezone.utc) - timedelta(days=10),
            registration_end=datetime.now(timezone.utc) + timedelta(days=5),
            drive_date=datetime.now(timezone.utc) + timedelta(days=12),
            status=DriveStatus.ONGOING,
        )
        session.add(drive)
        await session.flush()

        app1 = Application(
            id=uuid.uuid4(),
            tenant_id=tenant_apex.id,
            drive_id=drive.id,
            student_id=s1.id,
            status=ApplicationStatus.SHORTLISTED,
            final_decision_by=recruiter_user.id,
        )
        session.add(app1)
        await session.flush()

        interview1 = Interview(
            id=uuid.uuid4(),
            tenant_id=tenant_apex.id,
            application_id=app1.id,
            round_number=1,
            round_type=InterviewRoundType.TECHNICAL_1,
            scheduled_at=datetime.now(timezone.utc) + timedelta(days=3),
            status=InterviewStatus.SCHEDULED,
            interviewer_feedback="Pre-verified code evidence on GitHub confirmed high proficiency in React and Node.js.",
        )
        session.add(interview1)
        await session.flush()

        # 9. AI Agent Outputs (Shared Models)
        # Agent 2: Skill Gap Analysis
        gap_analysis = SkillGapAnalysis(
            id=uuid.uuid4(),
            tenant_id=tenant_apex.id,
            student_id=s1.id,
            job_role_id=role_sde.id,
            match_percentage=82.50,
            missing_skills_json=[{"skill": "PostgreSQL", "required_level": "intermediate"}],
            matching_skills_json=[{"skill": "React", "level": "advanced"}, {"skill": "Node.js", "level": "intermediate"}],
            analysis_mode="hybrid_gemini",
        )
        session.add(gap_analysis)

        # Agent 3: Placement Prediction (Advisory Only)
        prediction = PlacementPrediction(
            id=uuid.uuid4(),
            tenant_id=tenant_apex.id,
            student_id=s1.id,
            drive_id=drive.id,
            probability_score=86.50,
            risk_tier=RiskTier.LOW_RISK,
            contributing_factors_json={
                "cgpa_contribution": 31.0,
                "verified_skills_contribution": 40.0,
                "code_quality_contribution": 15.5,
            },
            is_advisory_only=True,
        )
        session.add(prediction)

        # Learning Recommendation
        rec = LearningRecommendation(
            id=uuid.uuid4(),
            tenant_id=tenant_apex.id,
            student_id=s1.id,
            skill_id=created_skills["postgresql"].id,
            target_role_id=role_sde.id,
            title="Complete PostgreSQL Query Optimization Lab",
            action_type=RecommendationActionType.HANDS_ON_LAB,
            description="Build 3 complex queries with indexing and analyze EXPLAIN outputs to close target role gap.",
            estimated_hours=6,
            is_completed=False,
        )
        session.add(rec)

        # Agent 1 & 4 Execution Logs
        agent_log = AgentExecutionLog(
            id=uuid.uuid4(),
            tenant_id=tenant_apex.id,
            agent_type=AgentType.STUDENT_PROFILING,
            execution_mode="gemini_free_tier",
            latency_ms=840,
            status=AgentExecutionStatus.SUCCESS,
            tokens_consumed=412,
            triggered_by=faculty_user.id,
        )
        session.add(agent_log)

        # Audit Event
        audit = AuditEvent(
            id=uuid.uuid4(),
            tenant_id=tenant_apex.id,
            actor_id=faculty_user.id,
            actor_email=faculty_user.email,
            action="VERIFIED_STUDENT_SKILL",
            resource_type="student_skill",
            resource_id=str(created_skills["react"].id),
            changes_diff={"state": "Verified", "student": s1.roll_number},
            ip_address="192.168.1.10",
        )
        session.add(audit)

        # Notification
        notif = Notification(
            id=uuid.uuid4(),
            tenant_id=tenant_apex.id,
            recipient_user_id=s1.user_id,
            title="Technical Interview Scheduled",
            message=f"You have been shortlisted for Round 1 with {company_cloudscale.name}.",
            type=NotificationType.INTERVIEW_CALL,
        )
        session.add(notif)

        await session.commit()
        logger.info("[Seeder] CarrerSync demo data seeding successfully completed!")


if __name__ == "__main__":
    asyncio.run(seed_demo_data())
