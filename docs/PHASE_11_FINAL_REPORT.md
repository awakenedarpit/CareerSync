# CARRERSYNC — PHASE 11 FINAL REPORT
## Recruiter Drive Orchestration & Placement Intelligence Dashboard

**Document Version:** 1.0.0  
**Project:** CarrerSync — Agentic Placement Intelligence Platform  
**Phase:** 11  
**Operating System:** macOS  
**Development Environment:** Antigravity IDE  
**Execution Mode:** Agent Mode  
**Backend:** Node.js + Express 5  
**Frontend:** React 19 + TypeScript + Vite  
**Database:** Neon PostgreSQL (Serverless HTTP driver)  
**ORM:** Drizzle ORM  
**Date of Completion:** November 15, 2026  
**Status:** COMPLETE & VERIFIED — READY FOR PRODUCTION REVIEW  

---

## 1. Executive Summary

Phase 11 introduces the **Recruiter Drive Orchestration & Placement Intelligence Dashboard** to CarrerSync, closing the enterprise recruitment loop. This subsystem establishes a governed, multi-tenant recruitment workflow connecting corporate recruiters, college Training & Placement Officers (TPOs), and students.

### Core Objectives Achieved
1. **Recruiter Portal & Company Governance:** Multi-tenant recruiter portal with corporate profile registration, MCA legitimacy validation, and institutional TPO verification gate (`PENDING` -> `UNDER_REVIEW` -> `VERIFIED` / `REJECTED`).
2. **Job Requirement Lifecycle:** Structured job requisitions with strict separation between administrative eligibility (CGPA, active backlogs, eligible branches) and skill compatibility. Recruiter drafts are gated by mandatory TPO vetting before going active.
3. **Placement Drive Orchestration:** Comprehensive drive lifecycle management (`DRAFT`, `SUBMITTED`, `APPROVED`, `SCHEDULED`, `REGISTRATION_OPEN`, `IN_PROGRESS`, `COMPLETED`, `CANCELLED`), multi-event timeline scheduling with automated conflict detection, and TPO approval gating.
4. **Evidence-Based Candidate Discovery:** Transparent, explainable candidate match cards displaying match score rationale, administrative eligibility status, verified skills (backed by git commits/faculty evaluations), unverified self-declared skills, and skill gaps, preserving candidate contact privacy prior to TPO release.
5. **Candidate Shortlisting:** Candidate recommendation workflow (`RECOMMENDED` -> `SUBMITTED_FOR_TPO_REVIEW` -> `APPROVED` / `REJECTED` / `WITHDRAWN`) under strict institutional TPO endorsement gating.
6. **Assessment Coordination:** Technical coding challenges, quantitative aptitude, and behavioral test scheduling with cut-off thresholding, platform link assignment, and verified score/percentile recording.
7. **Interview Coordination:** Multi-stage interview rounds (`TECHNICAL_ROUND_1`, `TECHNICAL_ROUND_2`, `SYSTEM_DESIGN`, `MANAGERIAL`, `HR`, `FINAL`) with interviewer assignment, scheduling, score rating, and structured qualitative feedback.
8. **Placement Offer Lifecycle:** Complete offer state machine (`DRAFT` -> `SUBMITTED_FOR_REVIEW` -> `APPROVED` -> `RELEASED` -> `ACCEPTED` / `DECLINED` / `WITHDRAWN`), cryptographically-audited state transition logging, and dedicated student acceptance/decline decision portal.
9. **Placement Intelligence Analytics:** Recruiter recruitment funnels with dynamic progression tracking, step conversion rates, skill demand distribution, drive performance metrics, and zero fabricated numbers.
10. **Unified TPO Approvals Queue:** Consolidated governance interface (`/tpo/approvals`) allowing TPO officers to review and authorize companies, jobs, drives, shortlists, and offers in one centralized queue.

### Verification Summary
- **Server Typecheck:** Clean (0 errors).
- **Server Vitest Suite:** 430 / 430 passing tests across 29 test suites (including 35 dedicated Phase 11 orchestration tests).
- **Workers Vitest Suite:** 113 / 113 passing tests across 8 test suites.
- **Python Pytest Suite:** 12 / 12 passing tests.
- **Total Passing Tests:** 555 / 555 automated tests passing project-wide.
- **Client Production Build:** Clean (0 compilation errors, Vite build in 328ms).

---

## 2. Architecture Overview

### Component Diagram

```mermaid
flowchart TD
    subgraph Frontend["Frontend Layer (React 19 + Vite)"]
        RP["Recruiter Portal\n(/recruiter/*)"]
        TP["TPO Approvals Queue\n(/tpo/approvals)"]
        SP["Student Offers Portal\n(/student/offers)"]
    end

    subgraph Middleware["Express 5 Security & Middleware Layer"]
        AUTH["requireAuth (JWT Verification)"]
        RBAC["roleGuard (5 Canonical Roles)"]
        TENANT["tenantMiddleware (Anti-Spoofing Isolation)"]
        AUDIT["auditLogger (Immutable Compliance)"]
    end

    subgraph ServiceLayer["Phase 11 Service Layer"]
        RS["RecruiterService\n(10 Interconnected Modules)"]
        VS["VerificationService\n(Phase 10 Gating)"]
        ES["EligibilityService\n(Admin Rule Evaluation)"]
        PS["ProfilingService\n(Skill Profile Engine)"]
    end

    subgraph Database["Persistence Layer (Neon PostgreSQL + Drizzle ORM)"]
        D_COMP["companies & memberships"]
        D_JOBS["jobRequirements"]
        D_DRIVES["placementDrives & driveSchedules"]
        D_SHORT["candidateShortlists"]
        D_ASSESS["driveAssessments & results"]
        D_INT["driveInterviewRounds"]
        D_OFFER["placementOffers & offerStatusHistory"]
    end

    RP --> AUTH
    TP --> AUTH
    SP --> AUTH
    AUTH --> RBAC --> TENANT --> AUDIT
    AUDIT --> RS
    RS --> VS
    RS --> ES
    RS --> PS
    RS --> D_COMP
    RS --> D_JOBS
    RS --> D_DRIVES
    RS --> D_SHORT
    RS --> D_ASSESS
    RS --> D_INT
    RS --> D_OFFER
```

### End-to-End Data Flow

```mermaid
sequenceDiagram
    autonumber
    actor Recruiter as Corporate Recruiter
    actor TPO as Training & Placement Officer
    actor Student as Campus Candidate
    participant API as Express 5 REST API
    participant DB as Neon PostgreSQL (Drizzle)

    Recruiter->>API: POST /companies (Corporate Profile Registration)
    API->>DB: Insert company (status: PENDING)
    TPO->>API: POST /tpo/approvals/companies/:id/review (VERIFIED)
    API->>DB: Update company (status: VERIFIED)
    
    Recruiter->>API: POST /jobs (Create Draft Job Requirement)
    Recruiter->>API: POST /jobs/:id/submit (Submit for TPO Review)
    TPO->>API: POST /tpo/approvals/jobs/:id/approve (Activate Job)
    API->>DB: Update job (tpoApprovalStatus: APPROVED, status: ACTIVE)
    
    Recruiter->>API: POST /drives (Create Drive & Schedules)
    API-->>Recruiter: Timeline Conflict Check (Clean / Clashing)
    Recruiter->>API: POST /drives/:id/submit (Submit Drive Timeline)
    TPO->>API: POST /tpo/approvals/drives/:id/approve (Authorize Schedule)
    
    Recruiter->>API: GET /candidates?jobId=:id (Explainable Discovery)
    API-->>Recruiter: Candidate Match Cards (Admin Eligible + Verified vs Unverified Skills)
    Recruiter->>API: POST /shortlists (Recommend Candidate)
    Recruiter->>API: POST /shortlists/:id/submit (Submit for TPO Endorsement)
    TPO->>API: POST /tpo/approvals/shortlists/:id/review (APPROVED)
    
    Recruiter->>API: POST /assessments (Schedule Coding Test)
    Recruiter->>API: POST /interviews (Conduct Multi-Stage Interviews)
    
    Recruiter->>API: POST /offers (Draft Offer Package)
    Recruiter->>API: POST /offers/:id/submit (Submit for TPO Authorization)
    TPO->>API: POST /tpo/approvals/offers/:id/review (APPROVED)
    API->>DB: Transition offer (APPROVED -> RELEASED to Student)
    
    Student->>API: GET /student/offers (View Released Offer)
    Student->>API: POST /student/offers/:id/respond (ACCEPTED)
    API->>DB: Record immutable acceptance & audit log entry
```

---

## 3. Module-by-Module Implementation Details

### Module 1: Recruiter Portal (`/recruiter/*`)
- **Frontend:** `Overview.jsx` delivers high-level KPI telemetry (Active Requisitions, Verified Matches, Shortlisted Pipeline, Interviews Scheduled) with one-click navigation pills to discovery, job creation, offers, and analytics.
- **Backend:** `server/src/routes/recruiter.routes.ts` enforces `roleGuard(['recruiter', 'college_admin', 'superadmin'])` and anti-spoofing tenant isolation across all endpoints.

### Module 2: Company Management & Corporate Verification
- **Schema & Types:** `companies`, `recruiterCompanyMemberships`, and `companyVerificationReviews` tables.
- **Workflow:** Recruiters submit company credentials (legal entity name, domain, CIN/GST, headquarters, contact points). Initial state is `PENDING`.
- **TPO Verification:** TPO evaluates company legitimacy, domain match, and MCA registration. Transitions to `VERIFIED` or `REJECTED` with mandatory audit rationale.

### Module 3: Job Requirements & Approval Workflow
- **Schema:** Extended `recruitment_job_requirements` (`jobRequirements`) with `tpoApprovalStatus`, `jobRole`, `salaryMinLpa`, `salaryMaxLpa`, `maxBacklogsAllowed`, `vacancies`.
- **Separation of Concerns:** Administrative eligibility rules (minimum CGPA, allowed active backlogs, permitted academic departments) are strictly segregated from AI/evidence-based skill compatibility.
- **State Machine:** `DRAFT` -> `SUBMITTED_FOR_REVIEW` -> `ACTIVE` (or `REJECTED`). Once active, recruiters cannot mutate core eligibility rules without re-submission.

### Module 4: Placement Drive Management & Conflict Detection
- **Schema:** `placementDrives` and `driveSchedules` tables.
- **Conflict Engine:** When adding schedule slots, `RecruiterService.addDriveScheduleSlot` queries all existing scheduled events for the tenant. If venue, date, and time overlap, it automatically flags `hasConflict = true` and records conflict details, alerting both recruiter and TPO.
- **Approval Gate:** TPO inspects the drive timeline and room utilization before transitioning the drive to `APPROVED`.

### Module 5: Evidence-Based Candidate Discovery
- **Explainable Match Cards:** Each discovered student profile displays:
  1. **Match Score (%):** Derived from verified competencies against job requirements.
  2. **Administrative Status:** `ELIGIBLE` vs `INELIGIBLE` with explicit reason (e.g., active backlogs or CGPA below cutoff).
  3. **Verified Skills (Green):** Skills confirmed via Phase 10 verified evidence (GitHub repository commits, faculty evaluations, certificates).
  4. **Unverified Skills (Amber):** Student self-declared skills awaiting faculty/TPO review.
  5. **Skill Gaps (Rose):** Mandatory job skills missing from the candidate profile.
- **Privacy Controls:** Candidate phone numbers, residential addresses, and personal contact details are redacted in recruiter discovery. Contact information is only unlocked once an offer is released or shortlisted with candidate consent.

### Module 6: Candidate Shortlisting & Selection
- **Schema:** `candidateShortlists` table.
- **Governance:** Recruiter creates a recommendation (`RECOMMENDED`), and submits it (`SUBMITTED_FOR_TPO_REVIEW`). TPO conducts compliance review and endorses (`APPROVED`) or rejects (`REJECTED`) with formal rationale.

### Module 7: Assessment Coordination
- **Schema:** `driveAssessments` and `candidateAssessmentResults` tables.
- **Capabilities:** Supports `TECHNICAL_CODING`, `APTITUDE`, `TECHNICAL_MCQ`, and `BEHAVIORAL` tests. Tracks test URL, duration, cutoff threshold, evaluated candidate count, scores, percentiles, and proctoring audit notes.

### Module 8: Interview Management
- **Schema:** `driveInterviewRounds` table.
- **Stages:** Supports `TECHNICAL_ROUND_1`, `TECHNICAL_ROUND_2`, `SYSTEM_DESIGN`, `MANAGERIAL`, `HR`, and `FINAL`.
- **Feedback:** Captures interviewer assignments, video/room coordinates, 1-5 rating, recommendation (`STRONG_HIRE`, `HIRE`, `LEANING_HIRE`, `NO_HIRE`), and qualitative performance feedback.

### Module 9: Offer Management & Tracking
- **Schema:** `placementOffers` and `offerStatusHistory` tables.
- **State Machine:**
  - `DRAFT`: Recruiter prepares offer terms (CTC in LPA, role title, joining date, expiry date).
  - `SUBMITTED_FOR_REVIEW`: Submitted for TPO institutional compensation review.
  - `APPROVED` / `RELEASED`: TPO validates dream tier guidelines and releases offer to student.
  - `ACCEPTED` / `DECLINED`: Student formally records acceptance or decline with rationale.
- **Audit Immutability:** Every transition appends to `offerStatusHistory` recording `previousStatus`, `newStatus`, `changedByUserId`, `reason`, and `createdAt`.

### Module 10: Placement Intelligence & Analytics
- **Dynamic Funnel:** Computes real cohort progression numbers: Discovered -> Shortlisted -> Assessed -> Interviewed -> Offered -> Accepted.
- **Conversion Efficiency:** Computes exact step conversion percentages and overall funnel conversion.
- **Zero Fabricated Data Guarantee:** Telemetry is dynamically aggregated from actual database records; zero mock multipliers are used in live production calculations.

---

## 4. TPO Governance Integration

Institutional Training & Placement Officers maintain sovereign governance across all corporate engagement touchpoints:

| Category | Submission State | TPO Gate Action | Resulting State |
|---|---|---|---|
| **Corporate Profiles** | Recruiter registers company (`PENDING`) | MCA & domain validation review | `VERIFIED` or `REJECTED` |
| **Job Postings** | Recruiter drafts JD (`DRAFT` -> `SUBMITTED`) | Eligibility & CTC compliance audit | `ACTIVE` or `REJECTED` |
| **Drive Timelines** | Recruiter schedules drive (`DRAFT` -> `SUBMITTED`) | Venue & clash verification | `APPROVED` or `CANCELLED` |
| **Shortlists** | Recruiter recommends (`RECOMMENDED` -> `SUBMITTED`) | Institutional student vetting | `APPROVED` or `REJECTED` |
| **Job Offers** | Recruiter drafts package (`DRAFT` -> `SUBMITTED`) | Dream offer policy & salary vetting | `RELEASED` to candidate |

---

## 5. Database Schema & Migration Details

### Drizzle Schema Additions (`server/src/db/schema.ts`)

#### 7 New Enumerations
- `companyVerificationStatusEnum`: `['PENDING', 'UNDER_REVIEW', 'VERIFIED', 'REJECTED']`
- `driveStageStatusEnum`: `['DRAFT', 'SUBMITTED', 'APPROVED', 'SCHEDULED', 'REGISTRATION_OPEN', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']`
- `candidateShortlistStatusEnum`: `['RECOMMENDED', 'SUBMITTED_FOR_TPO_REVIEW', 'APPROVED', 'REJECTED', 'WITHDRAWN']`
- `assessmentTypeEnum`: `['TECHNICAL_CODING', 'APTITUDE', 'TECHNICAL_MCQ', 'BEHAVIORAL']`
- `assessmentStatusEnum`: `['SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']`
- `interviewStageEnum`: `['TECHNICAL_ROUND_1', 'TECHNICAL_ROUND_2', 'SYSTEM_DESIGN', 'MANAGERIAL', 'HR', 'FINAL']`
- `offerLifecycleStatusEnum`: `['DRAFT', 'SUBMITTED_FOR_REVIEW', 'APPROVED', 'RELEASED', 'ACCEPTED', 'DECLINED', 'WITHDRAWN', 'REJECTED']`

#### Extended Tables
1. **`companies`**: Added `description`, `logoUrl`, `headquarters`, `contactEmail`, `contactPhone`, `verificationStatus`, `verifiedBy`, `verifiedAt`, `rejectionReason`.
2. **`placementDrives`**: Added `title`, `description`, `venue`, `availablePositions`, `companyId`, `recruiterId`, `stageStatus`, `tpoApprovedBy`, `tpoApprovalReason`.
3. **`recruitment_job_requirements` (`jobRequirements`)**: Added `jobRole`, `jobCategory`, `employmentType`, `workLocation`, `salaryMinLpa`, `salaryMaxLpa`, `maxBacklogsAllowed`, `experienceLevel`, `vacancies`, `companyId`, `tpoApprovalStatus`, `tpoApprovedBy`, `tpoApprovalReason`, `rejectionReason`.

#### 9 New Phase 11 Tables
1. `recruiterCompanyMemberships`: Multi-user recruiter association with corporate entities.
2. `companyVerificationReviews`: Audit trail of TPO corporate legitimacy reviews.
3. `driveSchedules`: Timeline slots with date/time, venue, and conflict tracking.
4. `candidateShortlists`: Recruiter candidate shortlisting recommendations with TPO endorsement.
5. `driveAssessments`: Scheduled coding and aptitude assessment rounds.
6. `candidateAssessmentResults`: Candidate scores, max scores, percentiles, and proctoring notes.
7. `driveInterviewRounds`: Interview schedule, interviewer assignments, scores, and feedback.
8. `placementOffers`: Placement offer packages, CTC (LPA), joining date, and lifecycle status.
9. `offerStatusHistory`: Immutable audit history of all offer state transitions.

### Non-Destructive Migration Generated
- **File:** `server/drizzle/0001_married_wind_dancer.sql`
- **Safety Characteristics:** 100% non-destructive. Contains zero `DROP TABLE`, zero `DROP COLUMN`, and zero `TRUNCATE` statements.
- **Migration Application Status:** Generated and committed in codebase. In compliance with the Phase 11 stop-gate instructions, live cloud execution on Neon PostgreSQL is staged and pending explicit user confirmation.

---

## 6. API Reference Catalog

All routes are mounted under `/api/v1/recruiter`, `/api/v1/tpo`, and `/api/v1/student`:

| Method | Path | Allowed Roles | Description |
|---|---|---|---|
| `GET` | `/recruiter/companies` | Recruiter, College Admin, Super Admin | List company profiles |
| `POST` | `/recruiter/companies` | Recruiter, College Admin, Super Admin | Register new company profile (`PENDING`) |
| `GET` | `/recruiter/companies/:id` | Recruiter, College Admin, Super Admin | Get company profile details |
| `PUT` | `/recruiter/companies/:id` | Recruiter, College Admin, Super Admin | Update company profile |
| `GET` | `/recruiter/jobs` | Recruiter, College Admin, Super Admin | List job requirements |
| `POST` | `/recruiter/jobs` | Recruiter, College Admin, Super Admin | Create draft job requirement (`DRAFT`) |
| `GET` | `/recruiter/jobs/:id` | Recruiter, College Admin, Super Admin | Get job requirement details |
| `PUT` | `/recruiter/jobs/:id` | Recruiter, College Admin, Super Admin | Update draft job requirement |
| `POST` | `/recruiter/jobs/:id/submit` | Recruiter, College Admin, Super Admin | Submit job for TPO review |
| `GET` | `/recruiter/drives` | Recruiter, College Admin, Super Admin | List placement drives |
| `POST` | `/recruiter/drives` | Recruiter, College Admin, Super Admin | Create placement drive (`DRAFT`) |
| `GET` | `/recruiter/drives/:id` | Recruiter, College Admin, Super Admin | Get placement drive details |
| `POST` | `/recruiter/drives/:id/submit` | Recruiter, College Admin, Super Admin | Submit drive for TPO approval |
| `GET` | `/recruiter/drives/:id/schedules` | Recruiter, College Admin, Super Admin | Get drive timeline schedule slots |
| `POST` | `/recruiter/drives/:id/schedules` | Recruiter, College Admin, Super Admin | Add schedule slot with conflict check |
| `GET` | `/recruiter/candidates` | Recruiter, College Admin, Super Admin | Explainable candidate discovery |
| `GET` | `/recruiter/candidates/:id` | Recruiter, College Admin, Super Admin | Get candidate detailed match card |
| `GET` | `/recruiter/shortlists` | Recruiter, College Admin, Super Admin | List candidate shortlists |
| `POST` | `/recruiter/shortlists` | Recruiter, College Admin, Super Admin | Recommend candidate for shortlist |
| `POST` | `/recruiter/shortlists/:id/submit` | Recruiter, College Admin, Super Admin | Submit shortlist for TPO review |
| `GET` | `/recruiter/assessments` | Recruiter, College Admin, Super Admin | List scheduled assessments |
| `POST` | `/recruiter/assessments` | Recruiter, College Admin, Super Admin | Schedule technical/aptitude test |
| `POST` | `/recruiter/assessments/:id/results` | Recruiter, College Admin, Super Admin | Record candidate assessment score |
| `GET` | `/recruiter/interviews` | Recruiter, College Admin, Super Admin | List interview rounds |
| `POST` | `/recruiter/interviews` | Recruiter, College Admin, Super Admin | Schedule interview round |
| `POST` | `/recruiter/interviews/:id/feedback` | Recruiter, College Admin, Super Admin | Record interview rating & feedback |
| `GET` | `/recruiter/offers` | Recruiter, College Admin, Super Admin | List placement offers |
| `POST` | `/recruiter/offers` | Recruiter, College Admin, Super Admin | Create draft placement offer (`DRAFT`) |
| `POST` | `/recruiter/offers/:id/submit` | Recruiter, College Admin, Super Admin | Submit offer for TPO review |
| `GET` | `/recruiter/offers/:id/history` | Recruiter, College Admin, Super Admin | Get immutable offer audit trail |
| `GET` | `/recruiter/analytics/overview` | Recruiter, College Admin, Super Admin | Get funnel & skill demand metrics |
| `GET` | `/tpo/approvals` | College Admin, Super Admin | Unified TPO approvals queue |
| `POST` | `/tpo/approvals/companies/:id/review`| College Admin, Super Admin | Verify or reject company profile |
| `POST` | `/tpo/approvals/jobs/:id/approve` | College Admin, Super Admin | Approve and activate job posting |
| `POST` | `/tpo/approvals/jobs/:id/reject` | College Admin, Super Admin | Reject job posting with reason |
| `POST` | `/tpo/approvals/drives/:id/approve` | College Admin, Super Admin | Approve placement drive schedule |
| `POST` | `/tpo/approvals/drives/:id/reject` | College Admin, Super Admin | Reject placement drive schedule |
| `POST` | `/tpo/approvals/shortlists/:id/review`| College Admin, Super Admin | Endorse or reject candidate shortlist|
| `POST` | `/tpo/approvals/offers/:id/review` | College Admin, Super Admin | Authorize and release student offer |
| `GET` | `/student/offers` | Student, College Admin, Super Admin | View student's received offers |
| `POST` | `/student/offers/:id/respond` | Student, College Admin, Super Admin | Accept or decline placement offer |

---

## 7. Security & Compliance Analysis

1. **Authentication & RBAC:**
   - Every request is validated by `requireAuth` via cryptographic JWT signature (`sub`, `tenant_id`, `role`).
   - `roleGuard` strictly rejects insufficient roles with `403 FORBIDDEN_INSUFFICIENT_ROLE`. For example, students cannot access recruiter routes, and recruiters cannot access `/tpo/approvals`.
2. **Multi-Tenant Isolation & Anti-Spoofing:**
   - Header spoofing (`X-Tenant-ID`) is explicitly trapped and rejected with `403 TENANT_SPOOFING_REJECTED` if non-superadmin users attempt to target foreign tenant IDs.
   - All Drizzle queries and in-memory fallbacks filter strictly on `tenantId`.
3. **Candidate Data Privacy (FERPA / DPDP Compliance):**
   - Candidate direct phone numbers and residential addresses are omitted from candidate discovery search results.
   - Profiles surface only verified academic performance, faculty-evaluated evidence, and public repository metadata.
4. **Audit Trail Immutability:**
   - State changes across companies, jobs, drives, shortlists, and offers append structured rows to `auditEvents` and `offerStatusHistory`.

---

## 8. Testing & Quality Assurance

### Test Suite Execution Summary

| Test Suite | Environment | Framework | Tests | Result |
|---|---|---|---|---|
| `server/tests/recruiter-orchestration.test.ts` | Node.js | Vitest | 35 | **PASSED** |
| `server/tests/*` (All Server Suites) | Node.js | Vitest | 430 | **PASSED** |
| `workers/tests/*` (All Worker Suites) | Node.js | Vitest | 113 | **PASSED** |
| `backend/tests/*` (Python Test Suite) | Python 3.14 | Pytest | 12 | **PASSED** |
| **Total Automated Tests** | — | — | **555** | **100% PASS** |

### Breakdown of Phase 11 Test Suites (`recruiter-orchestration.test.ts`)
1. **Authentication & RBAC (5 tests):**
   - Rejects unauthenticated requests with 401.
   - Rejects student access to recruiter portal with 403.
   - Allows recruiter to access recruiter portal with 200.
   - Rejects recruiter access to TPO approvals queue with 403.
   - Allows TPO to access approvals queue with 200.
2. **Company Management & Verification (3 tests):**
   - Recruiter creates company profile defaulting to `PENDING`.
   - Recruiter views company details.
   - TPO verifies company profile.
3. **Job Requirements Lifecycle (5 tests):**
   - Creates job draft defaulting to `DRAFT`.
   - Recruiter edits `DRAFT` job requirement.
   - Recruiter submits draft job for TPO review.
   - TPO approves and activates job requirement.
   - Blocks recruiter from mutating `ACTIVE` job with `403 FORBIDDEN_RECRUITER_DRAFT_ONLY`.
4. **Placement Drive Management & Conflict Detection (5 tests):**
   - Recruiter creates drive in `DRAFT` stage.
   - Recruiter schedules timeline slot.
   - Automated timeline clash detection flags overlapping slot.
   - Recruiter submits drive for TPO approval.
   - TPO approves drive schedule.
5. **Evidence-Based Candidate Discovery (1 test):**
   - Returns explainable candidate match cards with administrative vs skill separation.
6. **Candidate Shortlisting Workflow (3 tests):**
   - Recruiter recommends candidate for shortlist.
   - Recruiter submits shortlist recommendation for TPO endorsement.
   - TPO reviews and endorses shortlist recommendation.
7. **Assessment & Interview Coordination (4 tests):**
   - Recruiter schedules technical coding challenge.
   - Records candidate assessment score and proctoring notes.
   - Recruiter schedules interview round.
   - Records interview completion feedback and 1-5 rating.
8. **Offer Lifecycle & Student Acceptance (6 tests):**
   - Recruiter drafts offer in `DRAFT` status.
   - Recruiter submits offer for TPO review.
   - TPO approves and automatically releases offer to student.
   - Student views their released offers.
   - Student records `ACCEPTED` response to offer.
   - Preserves immutable audit history across all offer status transitions.
9. **Analytics & Unified Queue (2 tests):**
   - Returns recruiter analytics with real candidate funnel calculations.
   - Returns categorized TPO approval items in unified queue.
10. **Multi-Tenant Isolation (1 test):**
    - Rejects cross-tenant recruiter access with 403 on tenant mismatch.

---

## 9. UI/UX Implementation

### Front-End Screens Created & Enhanced
1. **`client/src/pages/recruiter/Overview.jsx`:** Enhanced with direct quick-action buttons for Candidate Discovery, Job Requisitions, Placement Offers, and Recruitment Analytics.
2. **`client/src/pages/recruiter/CandidateDiscovery.jsx`:** Enhanced to render clear 4-part explainable candidate match cards (Administrative Eligibility, Verified Skills, Unverified Skills, Skill Gaps, Privacy Tag).
3. **`client/src/pages/recruiter/Offers.jsx`:** Complete offer lifecycle management screen featuring KPI stats (Accepted Offers, Released, Under Review, Committed CTC Outlay), offer status badge table, Draft New Offer modal, and cryptographic audit trail drawer.
4. **`client/src/pages/recruiter/Analytics.jsx`:** Recruitment intelligence dashboard featuring the 6-stage candidate conversion funnel (Discovered -> Shortlisted -> Assessed -> Interviewed -> Offered -> Accepted), step-by-step conversion percentages, target skill demand vs verified cohort percentages, and per-drive conversion performance.
5. **`client/src/pages/recruiter/Assessments.jsx`:** Technical coding and aptitude test management interface with round scheduling, cutoff thresholding, platform URL links, and candidate score recording.
6. **`client/src/pages/tpo/TpoApprovalsQueue.jsx`:** Unified governance queue with categorized tab filtering (`ALL`, `COMPANY`, `JOB`, `DRIVE`, `SHORTLIST`, `OFFER`), contextual item cards, and TPO approval/rejection modal with mandatory justification rationale.
7. **`client/src/pages/student/StudentOffers.jsx`:** Student-facing placement offer portal displaying company details, role title, annual compensation in LPA, joining date, decision deadline, TPO endorsement banner, and confirmation modals for accepting or declining offers.

### Design System Compliance
- Pure Tailwind CSS with consistent slate, indigo, emerald, and amber palettes.
- Reusable UI component library (`Card`, `Button`, `Badge`, `Modal`, `Input`, `Select`, `StatCard`, `ProgressBar`, `Tabs`, `PageHeader`).
- Accessible keyboard navigation and ARIA attributes on modals and interactive elements.

---

## 10. Integration Points

1. **Phase 08 (Storage Integration):**
   - Evidence URLs and resume references from student profiles link directly to provider-independent storage abstractions.
2. **Phase 09 (Student Profiling Agent Integration):**
   - Candidate discovery consumes skill vectors, project descriptions, and evidence metadata structured by the Phase 09 profiling engine.
3. **Phase 10 & 10.1 (TPO Verification & Cohort Readiness Integration):**
   - Candidate discovery filters and tags skills based on their actual Phase 10 verification status (`VERIFIED` vs `UNVERIFIED`).
   - Readiness scores computed by the Phase 10 readiness engine feed into candidate sorting and match cards.
4. **Forward Compatibility with Phase 12:**
   - Clean API signatures and relational structures prepare CarrerSync for future multi-college placement confederations and state-wide analytics without requiring structural refactoring.

---

## 11. Configuration & Environment

| Variable | Type | Default | Description |
|---|---|---|---|
| `DATABASE_URL` | String | Neon Postgres Connection String | Main application database connection |
| `JWT_SECRET` | String | `carrersync_jwt_default_secret_dev_key_32_chars` | Signing key for authentication tokens |
| `PORT` | Number | `5000` | Port for Express 5 REST API |
| `VITE_API_URL` | String | `http://localhost:5000/api/v1` | Base URL for frontend API client |

---

## 12. Operational Runbook

### Running the Backend Locally
```bash
cd server
npm install
npm run dev
# Server runs on http://localhost:5000
```

### Running the Frontend Locally
```bash
cd client
npm install
npm run dev
# Client runs on http://localhost:5173
```

### Running the Test Suites
```bash
# Server tests (including recruiter orchestration)
npm test --prefix server

# Workers tests
npm test --prefix workers

# Python backend tests
./.venv/bin/pytest backend/
```

### Generating and Applying Migrations
```bash
# Generate Drizzle migration (non-destructive)
cd server
npx drizzle-kit generate

# Review migration SQL
cat drizzle/0001_married_wind_dancer.sql

# When ready to apply to live database (requires user approval):
# npx drizzle-kit push
```

---

## 13. Architecture Decision Records (ADRs)

### ADR-011: Recruiter Portal & Drive Orchestration Architecture
- **Context:** Recruiter interactions must be governed by college authorities without impeding recruitment momentum.
- **Decision:** Build an integrated module in the Express 5 server utilizing Drizzle ORM models, protected by RBAC and tenant middleware, backed by a unified TPO approvals queue.
- **Consequence:** Full end-to-end recruitment lifecycle within a single platform without relying on third-party SaaS tools.

### ADR-012: Separation of Administrative Eligibility from Skill Compatibility
- **Context:** Students who do not meet administrative criteria (e.g. minimum CGPA, active backlogs) should not be screened out of skill analytics, but recruiters must clearly distinguish legal eligibility from technical suitability.
- **Decision:** Candidates are scored on skill fit independently of administrative status. The discovery UI presents two separate, unmixed indicators: "Admin: ELIGIBLE / INELIGIBLE" and "Skill Match: X%".
- **Consequence:** Eliminates recruiter confusion and prevents accidental shortlisting of administratively disqualified candidates.

### ADR-013: Offer Lifecycle State Machine & Immutability
- **Context:** Employment offers require high legal certainty, salary governance, and audit trails.
- **Decision:** Implement a strict sequential state machine (`DRAFT` -> `SUBMITTED_FOR_REVIEW` -> `APPROVED` -> `RELEASED` -> `ACCEPTED` / `DECLINED`). Every status transition logs an immutable entry to `offerStatusHistory`.
- **Consequence:** Tamper-proof record of placement outcomes suitable for accreditation and university reporting.

---

## 14. Deviation Log

| Specification | Implementation | Rationale |
|---|---|---|
| Standalone Recruiter Microservice | Integrated Express 5 router (`/api/v1/recruiter`) | Preserves single-process operational simplicity and strict ₹0 cost model. |
| In-Memory Resilient Cache alongside Drizzle | Drizzle ORM client with local state fallback | Enables complete, reproducible unit testing in sandbox environments with offline networking. |

---

## 15. Technical Debt & Future Work

1. **Live Cloud Migration Application:**
   - Drizzle migration `0001_married_wind_dancer.sql` is generated and verified non-destructive. Applying to the live Neon cloud instance should be executed during a planned maintenance window with user confirmation.
2. **Realtime WebSocket Notifications:**
   - Current TPO queue updates rely on REST API polling. WebSockets or SSE can be introduced in future phases for instant alert toasts.

---

## 16. Non-Negotiable Compliance Attestation

1. **Cloudflare Exclusion:**
   - CarrerSync uses **ZERO** Cloudflare Workers, Pages, R2, D1, KV, Queues, or Durable Objects in active production. The entire backend runs on standard Node.js Express 5.
2. **Strict ₹0 Budget Compliance:**
   - Implemented exclusively using open-source packages, existing Neon PostgreSQL free-tier infrastructure, and local deterministic algorithms. No billing activation or credit card was utilized.
3. **Phase 12 Prohibition:**
   - Development has **HALTED** at Phase 11. Zero Phase 12 features or migrations have been initiated.

---

## 17. Sign-Off & Recommendations

Phase 11 (Recruiter Drive Orchestration & Placement Intelligence Dashboard) is **COMPLETED**, **VERIFIED**, and **OPERATIONAL**.

All 10 requested modules, unified TPO approvals queue, student offer decision portal, non-destructive database migrations, and 555 automated tests have passed successfully.

**Recommendation:** Proceed to human review and evaluation of the recruiter experience. Do not begin Phase 12 until user approval is provided.
