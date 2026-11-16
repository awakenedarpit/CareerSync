# Database Persistence Validation Report: CareerSync
**Audit Date:** 2026-11-16  
**Auditor:** Database Persistence Verifier (`@db-verifier`)  
**Scope:** Neon PostgreSQL + Drizzle ORM Schema, Migrations, Connection Infrastructure, and In-Memory Stores  
**Target:** Read-Only Verification of Database Persistence Integrity  

---

## Executive Summary

CareerSync is architected on **Neon PostgreSQL Serverless** utilizing **Drizzle ORM** (v0.38.4) with `@neondatabase/serverless` (v0.10.4). The database schema contains **106 domain tables** spanning institutional multi-tenancy, RBAC, 5-stage skill verification lifecycles, placement drive orchestration, mock testing, predictive analytics, autonomous agent workflows, alumni mentorship, and institutional accreditation.

All 106 tables defined in Drizzle ORM are fully materialized in 9 chronological SQL migrations (`0000` through `0008`) tracked in `server/drizzle/meta/_journal.json`.

However, the audit identified **critical architectural duality**: multiple core routes and services (`auth.routes.ts`, `superadmin.routes.ts`, `student-profile.service.ts`, `file.routes.ts`, and `job-queue.service.ts`) implement "silent fallback" or dual-mode memory stores. If a database operation fails or `DATABASE_URL` is intermittently unreachable, these services catch errors and silently write to or read from in-memory `Map` and `Array` objects. This masks database faults and leads to phantom identities and dropped background jobs upon server restart.

---

## 1. Database Configuration Status

| Component | Status | Details |
| :--- | :--- | :--- |
| **Active DB Config File** | **Configured** | `.env.local` at repository root `/Users/user/CarrerSync/.env.local` contains `DATABASE_URL`. |
| **Env Var Key Name** | `DATABASE_URL` | Pooled connection string (`ep-weathered-boat-a1z9wdl8-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require`). |
| **Unpooled Migration Key** | `DATABASE_URL_UNPOOLED` | Supported in scripts and `server/.env.example` for direct DDL migrations. |
| **Env Loader Architecture** | **Multi-tier** | `server/src/config/env.ts` traverses `cwd` and parent directories checking `.env.local` and `.env` via `dotenv` and validates with `zod`. |
| **Protocol Compatibility** | **Handled** | `server/src/db/client.ts` implements `normalizeDbUrl()` to convert legacy `postgresql+asyncpg://` prefixes to `postgresql://` so `@neondatabase/serverless` can connect without protocol mismatch errors. |
| **Connection Pooling & RLS** | **Hardened** | `server/src/db/client.ts` implements cached HTTP clients (`neon(url)`) for stateless queries and `Pool` (`@neondatabase/serverless`) for transactions. Implements `withTenantContext()` executing `SET LOCAL app.current_tenant_id` with strict cleanup. |

---

## 2. Schema Summary Table (106 Tables in Drizzle ORM)

All tables are defined in `server/src/db/schema.ts` and exported alongside their Drizzle relations. Below is the domain mapping:

| Table Name | Primary Keys & Key Foreign Keys | Key Relationship / Purpose | Migration Applied? |
| :--- | :--- | :--- | :---: |
| **tenants** | `id` (PK) | Platform & College Tenants, Multi-tenant root authority | ✅ `0000` |
| **users** | `id` (PK), `tenant_id` (FK → tenants) | Multi-tenant RBAC Users (superadmin, college_admin, tpo_admin, faculty, recruiter, student) | ✅ `0000` |
| **students** | `id` (PK), `tenant_id` (FK), `user_id` (FK → users) | Student profiles, academic details, readiness score, dual resume URLs | ✅ `0000` |
| **skills** | `id` (PK), `canonical_slug` (UQ) | Standardized taxonomy master list | ✅ `0000` |
| **student_skills** | `id` (PK), `student_id` (FK), `skill_id` (FK) | 5-stage verification state (Claimed, Observed, Evidence-linked, Verified, Expired) | ✅ `0000` |
| **evidence_records** | `id` (PK), `student_id` (FK), `skill_id` (FK) | Proof-of-work inspectable evidence (GitHub commits, PRs, project artifacts) | ✅ `0000` |
| **skill_assessments** | `id` (PK), `student_id` (FK), `skill_id` (FK) | Standardized assessment test evaluations & scores | ✅ `0000` |
| **academic_semesters** | `id` (PK), `student_id` (FK) | Semester-wise SGPA, backlogs, earned credits | ✅ `0000` |
| **companies** | `id` (PK), `name` (UQ) | Recruiting partner company registry | ✅ `0000` |
| **job_roles** | `id` (PK), `company_id` (FK) | Job postings / company profiles with CTC LPA | ✅ `0000` |
| **job_requirements** | `id` (PK), `job_role_id` (FK), `skill_id` (FK) | Role mandatory skills and proficiency weights | ✅ `0000` |
| **placement_drives** | `id` (PK), `tenant_id` (FK), `job_role_id` (FK) | Placement drives, eligibility criteria, dates, approvals | ✅ `0000` |
| **applications** | `id` (PK), `drive_id` (FK), `student_id` (FK) | Student job drive applications and pipeline status | ✅ `0000` |
| **interviews** | `id` (PK), `application_id` (FK) | Technical, HR, and Managerial interview rounds & feedback | ✅ `0000` |
| **audit_events** | `id` (PK), `tenant_id` (FK), `actor_id` (FK) | Tamper-proof compliance and security audit logs | ✅ `0000` |
| **notifications** | `id` (PK), `recipient_user_id` (FK) | In-app user notifications and alerts | ✅ `0000` |
| **invitations** | `id` (PK), `tenant_id` (FK), `token` (UQ) | Expiring single-use invitation tokens | ✅ `0000` |
| **skill_gap_analyses** | `id` (PK), `student_id` (FK), `job_role_id` (FK) | AI & deterministic match percentage & skill delta | ✅ `0000` |
| **learning_recommendations**| `id` (PK), `student_id` (FK), `skill_id` (FK) | Remediation milestones, labs, and courses | ✅ `0000` |
| **agent_execution_logs** | `id` (PK), `tenant_id` (FK), `triggered_by` (FK) | LLM token usage, latency ms, agent execution audit | ✅ `0000` |
| **documents** | `id` (PK), `tenant_id` (FK), `owner_user_id` (FK) | S3/Local document storage metadata & checksums | ✅ `0000` |
| **document_processing_jobs**| `id` (PK), `document_id` (FK), `user_id` (FK) | Document profiling background jobs & status | ✅ `0000` |
| **profile_extractions** | `id` (PK), `document_id` (FK), `user_id` (FK) | Raw AI resume extraction results and warnings | ✅ `0000` |
| **profile_skill_evidence** | `id` (PK), `user_id` (FK), `document_id` (FK) | Granular extracted skill claims & verification | ✅ `0000` |
| **profile_review_events** | `id` (PK), `user_id` (FK), `reviewer_id` (FK) | Faculty/TPO human-in-the-loop audit reviews | ✅ `0000` |
| **profile_versions** | `id` (PK), `user_id` (FK) | Immutable version snapshots of student profiles | ✅ `0000` |
| **skill_verification_reviews**| `id` (PK), `student_id` (FK), `evidence_id` (FK) | Formal verification approvals/rejections | ✅ `0000` |
| **student_readiness_snapshots**| `id` (PK), `student_id` (FK) | Deterministic readiness scores & radar dimensions | ✅ `0000` |
| **recruitment_job_requirements**| `id` (PK), `tenant_id` (FK), `created_by` (FK) | Recruiter job listings with detailed skill requirements | ✅ `0000` |
| **job_eligibility_evaluations**| `id` (PK), `student_id` (FK), `job_id` (FK) | Automated student criteria evaluations | ✅ `0000` |
| **candidate_shortlists** | `id` (PK), `drive_id` (FK), `student_id` (FK) | Recruiter shortlisted candidates for drives | ✅ `0001` |
| **recruiter_company_memberships**| `id` (PK), `user_id` (FK), `company_id` (FK) | Recruiter organization affiliation bindings | ✅ `0001` |
| **company_verification_reviews**| `id` (PK), `company_id` (FK), `reviewer_id` (FK) | Institutional vetting of hiring partners | ✅ `0001` |
| **drive_schedules** | `id` (PK), `drive_id` (FK) | Detailed drive stage schedule milestones | ✅ `0001` |
| **drive_assessments** | `id` (PK), `drive_id` (FK) | Drive-linked screening assessments | ✅ `0001` |
| **candidate_assessment_results**| `id` (PK), `drive_assessment_id` (FK) | Candidate test scores and percentile ranks | ✅ `0001` |
| **drive_interview_rounds** | `id` (PK), `drive_id` (FK) | Round-specific interview configurations | ✅ `0001` |
| **placement_offers** | `id` (PK), `drive_id` (FK), `student_id` (FK) | Job offers, CTC, acceptance status | ✅ `0001` |
| **offer_status_history** | `id` (PK), `offer_id` (FK) | Audit trail of offer transitions | ✅ `0001` |
| **assessment_question_banks**| `id` (PK), `tenant_id` (FK) | Institutional question banks | ✅ `0002` |
| **assessment_questions** | `id` (PK), `bank_id` (FK) | MCQs and coding problem formulations | ✅ `0002` |
| **mock_drive_configurations**| `id` (PK), `tenant_id` (FK) | AI simulated practice drive setups | ✅ `0002` |
| **mock_drive_rounds** | `id` (PK), `mock_drive_id` (FK) | Aptitude, Coding, and AI Interview rounds | ✅ `0002` |
| **assessment_reports** | `id` (PK), `student_id` (FK) | Student performance diagnostics and scores | ✅ `0002` |
| **mock_drive_participants** | `id` (PK), `mock_drive_id` (FK), `student_id` (FK) | Student enrollments in practice drives | ✅ `0002` |
| **assessment_attempts** | `id` (PK), `student_id` (FK) | Live exam timer sessions & attempts | ✅ `0002` |
| **assessment_responses** | `id` (PK), `attempt_id` (FK) | Granular question answers and logs | ✅ `0002` |
| **coding_submissions** | `id` (PK), `attempt_id` (FK) | Sandboxed code submissions, verdicts, testcases | ✅ `0002` |
| **interview_practice_sessions**| `id` (PK), `student_id` (FK) | AI mock interview session transcripts | ✅ `0002` |
| **interview_practice_feedback**| `id` (PK), `session_id` (FK) | Dimension scores (technical, clarity, tone) | ✅ `0002` |
| **learning_paths** | `id` (PK), `student_id` (FK) | Personalized learning roadmap containers | ✅ `0002` |
| **learning_tasks** | `id` (PK), `path_id` (FK) | Actionable modules, coding challenges | ✅ `0002` |
| **learning_task_submissions**| `id` (PK), `task_id` (FK) | Student submissions and links | ✅ `0002` |
| **learning_evidence_links**| `id` (PK), `submission_id` (FK) | Verification links for completed learning | ✅ `0002` |
| **skill_taxonomy** | `id` (PK) | Standardized skill taxonomy definitions | ✅ `0003` |
| **skill_aliases** | `id` (PK), `skill_id` (FK) | Synonym & variation mappings (e.g. k8s → Kubernetes) | ✅ `0003` |
| **job_description_sources**| `id` (PK) | Registry of crawled/uploaded job feeds | ✅ `0003` |
| **industry_job_descriptions**| `id` (PK), `source_id` (FK) | External and internal JD repository | ✅ `0003` |
| **job_description_analyses**| `id` (PK), `jd_id` (FK) | Parsed skills, weights, and seniority levels | ✅ `0003` |
| **industry_skill_demand** | `id` (PK), `skill_id` (FK) | Real-time market demand metrics | ✅ `0003` |
| **industry_skill_trends** | `id` (PK), `skill_id` (FK) | Historical trajectory & emerging tech trends | ✅ `0003` |
| **role_skill_requirements**| `id` (PK), `skill_id` (FK) | Standardized role requirements matrix | ✅ `0003` |
| **student_role_preferences**| `id` (PK), `student_id` (FK) | Preferred career roles & industries | ✅ `0003` |
| **student_skill_gap_snapshots**| `id` (PK), `student_id` (FK) | Individual student match vs target roles | ✅ `0003` |
| **career_recommendations** | `id` (PK), `student_id` (FK) | AI suggested job profiles and trajectory | ✅ `0003` |
| **cohort_skill_gap_snapshots**| `id` (PK), `tenant_id` (FK) | Department/batch aggregate skill deficit reports | ✅ `0003` |
| **placement_prediction_runs**| `id` (PK), `tenant_id` (FK) | Predictive analytics model execution batches | ✅ `0004` |
| **student_readiness_history**| `id` (PK), `student_id` (FK) | Historical longitudinal readiness trajectory | ✅ `0004` |
| **placement_predictions** | `id` (PK), `student_id` (FK) | Probability of offer, risk tier, contributing factors | ✅ `0004` |
| **student_support_recommendations**| `id` (PK), `student_id` (FK) | High-risk student intervention suggestions | ✅ `0004` |
| **tpo_intervention_records**| `id` (PK), `tenant_id` (FK) | Faculty/TPO counseling and support actions | ✅ `0004` |
| **placement_forecast_snapshots**| `id` (PK), `tenant_id` (FK) | Cohort placement probability projections | ✅ `0004` |
| **analytics_snapshots** | `id` (PK), `tenant_id` (FK) | Cached institutional placement metrics | ✅ `0004` |
| **analytics_audit_events** | `id` (PK), `tenant_id` (FK) | Audit log for ML analytics access & runs | ✅ `0004` |
| **agent_workflows** | `id` (PK), `tenant_id` (FK) | Multi-agent autonomous workflow coordinator state | ✅ `0005` |
| **agent_workflow_steps** | `id` (PK), `workflow_id` (FK) | Individual agent action step states | ✅ `0005` |
| **agent_execution_events** | `id` (PK), `step_id` (FK) | Event stream for agent handoffs & execution | ✅ `0005` |
| **agent_workflow_approvals**| `id` (PK), `workflow_id` (FK) | Human-in-the-loop review approvals | ✅ `0005` |
| **notification_events** | `id` (PK), `tenant_id` (FK) | Event hub for platform notifications | ✅ `0005` |
| **delegated_reviewers** | `id` (PK), `tenant_id` (FK) | Delegation of verification authority to faculty | ✅ `0005` |
| **alumni_profiles** | `id` (PK), `user_id` (FK) | Verified alumni profiles, companies, designations | ✅ `0006` |
| **mentor_availability** | `id` (PK), `alumni_id` (FK) | Mentorship recurring & one-off availability slots | ✅ `0006` |
| **mentorship_requests** | `id` (PK), `student_id` (FK), `alumni_id` (FK) | Student requests for 1:1 guidance | ✅ `0006` |
| **mentorship_sessions** | `id` (PK), `request_id` (FK) | Confirmed video/audio mentorship sessions | ✅ `0006` |
| **mentorship_feedback** | `id` (PK), `session_id` (FK) | Mutual ratings, reviews, and qualitative feedback | ✅ `0006` |
| **peer_interview_rooms** | `id` (PK), `tenant_id` (FK) | WebRTC peer mock interview session rooms | ✅ `0006` |
| **peer_interview_participants**| `id` (PK), `room_id` (FK), `student_id` (FK) | Interviewer/interviewee roles and attendance | ✅ `0006` |
| **peer_interview_questions**| `id` (PK), `room_id` (FK) | Question prompts selected for peer session | ✅ `0006` |
| **peer_interview_feedback**| `id` (PK), `room_id` (FK) | Rubric-based peer evaluations | ✅ `0006` |
| **collaboration_rooms** | `id` (PK), `tenant_id` (FK) | Study groups, coding collaboration rooms | ✅ `0006` |
| **collaboration_participants**| `id` (PK), `room_id` (FK), `user_id` (FK) | Study group member list & roles | ✅ `0006` |
| **collaboration_messages** | `id` (PK), `room_id` (FK), `sender_id` (FK) | Real-time chat messages inside study groups | ✅ `0006` |
| **collaboration_tasks** | `id` (PK), `room_id` (FK) | Group study milestones and checklists | ✅ `0006` |
| **moderation_reports** | `id` (PK), `tenant_id` (FK), `reporter_id` (FK) | Student safety, toxic behavior, code reports | ✅ `0006` |
| **moderation_actions** | `id` (PK), `report_id` (FK), `moderator_id` (FK) | Admin warnings, kicks, suspensions | ✅ `0006` |
| **institutional_metric_snapshots**| `id` (PK), `tenant_id` (FK) | NAAC/NIRF accreditation placement analytics | ✅ `0007` |
| **training_interventions** | `id` (PK), `tenant_id` (FK) | Institutional bootcamp, workshop initiatives | ✅ `0007` |
| **training_intervention_participants**| `id` (PK), `intervention_id` (FK) | Student attendance & pre/post assessment delta | ✅ `0007` |
| **fairness_review_cases** | `id` (PK), `tenant_id` (FK) | AI algorithmic bias & fairness reviews | ✅ `0007` |
| **institutional_report_templates**| `id` (PK), `tenant_id` (FK) | PDF/Excel reporting schemas | ✅ `0007` |
| **institutional_report_runs**| `id` (PK), `template_id` (FK) | Generated reports, execution records, download URLs | ✅ `0007` |
| **outreach_campaigns** | `id` (PK), `tenant_id` (FK) | Recruiter engagement & invitation campaigns | ✅ `0007` |
| **outreach_campaign_recipients**| `id` (PK), `campaign_id` (FK) | Company contact delivery status & opens | ✅ `0007` |
| **institutional_data_quality_events**| `id` (PK), `tenant_id` (FK) | Data anomaly logs (e.g. CGPA outlier) | ✅ `0007` |
| **academic_correction_requests**| `id` (PK), `student_id` (FK), `tenant_id` (FK) | Student requests to correct locked academic records | ✅ `0008` |
| **student_custom_links** | `id` (PK), `student_id` (FK), `tenant_id` (FK) | Portfolio, Behance, Blog custom URLs | ✅ `0008` |

---

## 3. Migration History & Drizzle Journal

The migration journal (`server/drizzle/meta/_journal.json`) is at **version 7**, PostgreSQL dialect. All 9 migrations are generated and applied in sequence:

| Index | Migration Tag | Applied Timestamp | Tables Created | Key Milestone Covered |
| :---: | :--- | :--- | :---: | :--- |
| `0` | `0000_shocking_echo.sql` | 1794728746170 | 32 | Core Multi-Tenancy, Users, Profiling, Readiness, Drives |
| `1` | `0001_married_wind_dancer.sql` | 1794735033575 | 9 | Recruiter Drive Orchestration & Placement Offers |
| `2` | `0002_military_blazing_skull.sql` | 1794749631045 | 15 | Mock Drives, Code Sandbox, Learning Paths |
| `3` | `0003_salty_kulan_gath.sql` | 1794751660151 | 12 | Industry Skills, Taxonomy, JD Scraper & Trends |
| `4` | `0004_yellow_firelord.sql` | 1794757317164 | 7 | Predictive Placement Analytics & Forecasting |
| `5` | `0005_nappy_ego.sql` | 1794759719701 | 5 | Autonomous Multi-Agent Workflows & State Machine |
| `6` | `0006_previous_eternity.sql` | 1794762662332 | 15 | Alumni Mentorship, Peer Mock Interviews, Moderation |
| `7` | `0007_hot_human_fly.sql` | 1794767299384 | 9 | Institutional Intelligence, NAAC/NIRF Reports, Outreach |
| `8` | `0008_numerous_morg.sql` | 1794769483514 | 2 | Academic Correction Requests & Student Custom Links |

**Migration Delta:**  
- Tables in `schema.ts`: **106**  
- Tables in migrations: **106**  
- Unmigrated Tables: **0** (100% migration coverage)  

---

## 4. In-Memory Store Inventory

The following in-memory stores and mutable caches were identified across `server/src/routes/` and `server/src/services/`:

| Source File | Variable Name | Structure / Type | Severity | Failure Behavior |
| :--- | :--- | :--- | :---: | :--- |
| `server/src/routes/superadmin.routes.ts` | `mockColleges` | `MockCollege[]` | **HIGH** | If DB is offline or `DATABASE_URL` missing, super admin college creations unshift to this memory array. Data is lost upon restart. |
| `server/src/routes/superadmin.routes.ts` | `mockUsers` | `MockUser[]` | **HIGH** | User CRUD queries fallback to filtering this array. |
| `server/src/routes/superadmin.routes.ts` | `mockInvitations` | `MockInvitation[]` | **HIGH** | Invitations issued in mock mode only exist in this memory array. |
| `server/src/routes/superadmin.routes.ts` | `mockAuditLogs` | `MockAuditLog[]` | **LOW** | Compliance audit logs dropped if DB query fails. |
| `server/src/services/student-profile.service.ts` | `inMemoryStudents` | `Map<string, any>` | **HIGH** | Acts as dual cache. In `updateStudentProfile`, updates write to Map and `try { db.update() } catch {}`. If DB throws, mutation remains in memory only! |
| `server/src/services/student-profile.service.ts` | `inMemoryUsers` | `Map<string, any>` | **MEDIUM** | User profile overrides cached in memory. |
| `server/src/services/student-profile.service.ts` | `inMemoryCustomLinks` | `Map<string, StudentCustomLink[]>` | **HIGH** | Custom links (GitHub, Behance, Blog) cached here. Replaced on update; if DB is offline, links only persist in memory. |
| `server/src/services/student-profile.service.ts` | `inMemoryCorrectionRequests` | `Map<string, AcademicCorrectionRequest[]>` | **HIGH** | Student academic change requests are placed in memory first; if DB insert fails, request exists only in RAM. |
| `server/src/services/student-profile.service.ts` | `inMemoryVerifiedSkills` | `Map<string, Set<string>>` | **MEDIUM** | Cache of student verified skills. |
| `server/src/services/job-queue.service.ts` | `inMemoryJobs` | `Map<string, DocumentProcessingJob>` | **HIGH** | Document parsing and extraction queue is held entirely in Node.js process RAM. All pending/active jobs vanish on process exit. |
| `server/src/services/profiling.service.ts` | `inMemoryExtractions` | `Map<string, ProfileExtraction>` | **MEDIUM** | Resume extraction records cached in memory. |
| `server/src/services/profiling.service.ts` | `inMemorySkillEvidence` | `Map<string, ProfileSkillEvidence>` | **MEDIUM** | Extracted skill evidence cached in memory. |
| `server/src/services/profiling.service.ts` | `inMemoryReviewEvents` | `Map<string, ProfileReviewEvent>` | **LOW** | Human review event logs cached in memory. |
| `server/src/services/profiling.service.ts` | `inMemoryVersions` | `Map<string, ProfileVersion>` | **LOW** | Profile version snapshots cached in memory. |
| `server/src/routes/file.routes.ts` | `inMemoryDocuments` | `Map<string, InMemDocRecord>` | **MEDIUM** | File uploads record in RAM first, then sync to DB. |
| `server/src/routes/auth.routes.ts` | Silent catch-block fallback | Dynamic variable assignment | **CRITICAL** | In `/register` and `/login`, if DB throws an error, the error is logged and execution falls through to generate a synthetic user with `crypto.randomUUID()` and a valid JWT token. The user believes they are registered/logged in, but no DB record exists. |

---

## 5. Persistence Gap Analysis

### What IS Persisted to PostgreSQL
When `DATABASE_URL` is configured and online:
1. **Institutional Tenancy & Auth**: Tenants, Users, Passwords (bcrypt), Invitations.
2. **Student & Academic Core**: Students, Semesters, SGPA, Backlogs, Verification Records.
3. **Placements Pipeline**: Companies, Roles, Drives, Applications, Interviews, Offers.
4. **Skills & Evidence**: Skills Taxonomy, Student Skills, Proof-of-work Evidence.
5. **AI Analytics & Tracking**: Prediction Runs, Readiness Snapshots, Agent Workflow States.

### What is NOT Persisted to PostgreSQL (The Gaps)
1. **Background Job Queue**: `job-queue.service.ts` does not enqueue into PostgreSQL table `document_processing_jobs` (despite the table existing in `schema.ts`). If the server restarts during a PDF resume parse, the job is permanently lost.
2. **Error Recovery for Profile Updates**: `student-profile.service.ts` uses `try { ... } catch { // DB offline fallback }` without a persistent outbox or retry queue. Any DB glitch leads to silent split-brain where in-memory state differs from the database.
3. **Registration Fallthrough**: `auth.routes.ts` fallback mode allows registration/login to succeed in memory without writing to PostgreSQL when the DB connection is interrupted.

---

## 6. Seed Script Status

| Script Location | Scope | Idempotency | Completeness | Registered in npm? |
| :--- | :--- | :---: | :---: | :---: |
| `scripts/seed_pilot_demo_data.ts` | Full synthetic pilot data (Apex Institute, 5 user roles, skills, CloudScale company, SDE role, 3 students) | **Yes** (checks `SELECT ... LIMIT 1` before insert) | **Complete for pilot testing** | ❌ Missing npm script `db:seed:demo` |
| `scripts/provision_superadmin.ts` | Super Admin account (`admin@carrersync.internal`) bootstrap | **Yes** (supports `--force` and `--dry-run`) | **Production Ready** | ❌ Manual execution via node |

Both scripts directly import `@neondatabase/serverless` and execute SQL queries against `DATABASE_URL`. However:
- Neither script is exposed as `npm run db:seed:demo` in `server/package.json` or root `package.json`.
- The demo credentials seeded by `seed_pilot_demo_data.ts` are:
  - Super Admin: `admin@carrersync.internal` / `DemoPassword@123`
  - College Admin: `admin@apex.edu` / `DemoPassword@123`
  - TPO Admin: `tpo@apex.edu` / `DemoPassword@123`
  - Recruiter: `recruiter@cloudscale.example.com` / `DemoPassword@123`
  - Students: `{aditya.sharma, priya.nair, rohit.verma}@apex.edu` / `DemoPassword@123`

---

## 7. Recommendations

1. **Remove Silent Auth Fallthrough**: In `server/src/routes/auth.routes.ts`, if the database fails, return a proper `503 Service Unavailable` or `500 Internal Server Error` with `DATABASE_UNAVAILABLE`. Do not issue ephemeral JWT tokens for nonexistent users.
2. **Persist the Job Queue**: Update `server/src/services/job-queue.service.ts` to write and poll jobs directly against the existing `document_processing_jobs` table in PostgreSQL.
3. **Register Demo Seeding Script**: Add `"db:seed:demo": "tsx ../scripts/seed_pilot_demo_data.ts"` to `server/package.json` and root `package.json` so demo users across all 6 roles can be deterministically seeded into any new Neon database branch.
4. **Standardize Environment Synchronization**: Ensure `server/.env` is linked or configured so that developers or container environments running solely from within `server/` don't accidentally run in offline fallback mode.
5. **Enforce Database Health Check in `/health`**: Update `server/src/routes/health.routes.ts` to execute a lightweight `SELECT 1` ping against Neon rather than merely inspecting if `DATABASE_URL` string is defined.
