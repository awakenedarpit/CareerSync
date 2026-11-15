# CarrerSync Phase 15 — Unified Multi-Agent Orchestration Architecture
## System Architecture, End-to-End Pipeline Topology, Governance State Machine, and Relational Data Models

**Document Version:** 1.0.0  
**Phase:** Phase 15 — Cross-Agent Integration, End-to-End Workflow & Platform Reliability  
**Date:** November 15, 2026  
**Audience:** Platform Architects, Backend Engineers, Security Auditors, TPO Leadership  
**Classification:** Canonical Architecture Specification  

---

## 1. Architectural Overview & Design Philosophy

CarrerSync Phase 15 establishes the **Central Agent Orchestration Engine**, seamlessly integrating the four specialized autonomous agents developed across Phases 09 through 14 into a cohesive, deterministic, and auditable end-to-end recruitment intelligence platform.

### Core Architectural Principles:
1. **Deterministic Execution over Generative Ambiguity**:
   Authorization decisions, workflow transitions, eligibility gates, and data handoffs are strictly hardcoded in validated TypeScript code and Zod schemas. Non-deterministic Large Language Models (LLMs) are restricted to assistive advisory tasks (e.g. resume extraction assistance, qualitative JD parsing, mock interview simulations); they **never decide platform authorization or candidate eligibility**.
2. **Mandatory Human-in-the-Loop Governance Gates**:
   High-consequence placement decisions—including skill verification, recruiter candidate shortlists, mock practice reviews, and formal offer acceptance—halt at formal human approval gates (`WAITING_FOR_REVIEW`), requiring authorized Training and Placement Officer (TPO) or explicitly delegated faculty sign-off.
3. **Multi-Tenant Cryptographic Isolation**:
   Every workflow instance, step, event, notification, and reviewer delegation is strictly scoped to a validated institutional tenant UUID (`tenantId`). Cross-tenant access is rejected at the API boundary with `403 TENANT_SPOOFING_REJECTED` and at the database layer via PostgreSQL Row-Level Security (RLS) context helpers (`withTenantContext`).
4. **Idempotent & Self-Healing Pipeline**:
   All workflows accept a unique `idempotencyKey`. Duplicate submissions return the existing workflow instance without re-executing steps or re-emitting notifications. Transient step failures automatically execute exponential backoff retries within strict timeout bounds.
5. **Decentralized Revocable Reviewer Delegation (Stop-Gate 5 Resolution)**:
   TPO administrators can delegate granular evidence review and workflow authorization permissions to departmental faculty coordinators. Revocation is instantaneous, auditable, and immediately terminates review authority across all active and pending workflows.
6. **Zero-PII Platform Observability**:
   Platform telemetry tracks end-to-end execution latency, retry rates, correlation IDs (`corr-${uuid}`), and agent health while actively sanitizing and purging all student PII, credentials, resumes, and confidential recruiter notes.

---

## 2. Unified 4-Agent Collective Topology

```mermaid
flowchart TD
    subgraph ClientLayer["Frontend Application Shell (React 19 + Tailwind CSS)"]
        UI_Student["Student Portal (/student/*)"]
        UI_TPO["TPO Command Center (/tpo/orchestration)"]
        UI_Recruiter["Recruiter Portal (/recruiter/*)"]
        UI_SuperAdmin["Super Admin Observability (/super-admin/observability)"]
        UI_Drawer["Real-time Notification Drawer"]
    end

    subgraph OrchestrationLayer["Central Agent Orchestrator (Express v5 Engine)"]
        Router["REST API Router (/api/v1/orchestration/*)"]
        Registry["Workflow Registry (7 Pre-configured End-to-End Workflows)"]
        Engine["Agent Orchestration Engine (agent-orchestration.service.ts)"]
        Governance["Human Governance Gate (WAITING_FOR_REVIEW)"]
        Idempotency["Idempotency Cache & Deduplicator"]
        Delegation["Delegated Reviewer Registry (Stop-Gate 5)"]
        NotifCenter["Notification Center (notification.service.ts)"]
        Telemetry["Structured Observability (observability.service.ts)"]
    end

    subgraph AutonomousAgents["Autonomous Specialized Agents (Phases 09–14)"]
        Agent_Profiling["Student Profiling Agent (Phase 09)\n- Document Ingestion Pipeline\n- 6-Tier Evidence State Machine\n- Completeness Scoring"]
        Agent_SkillGap["Industry Skill-Gap Agent (Phase 13)\n- 8-Category ESCO/O*NET Taxonomy\n- JD Extraction & SHA-256 Deduplication\n- 6-Tier Gap Severity Diagnostic\n- Adaptive Learning Sync (Phase 12)"]
        Agent_Predictive["Predictive Placement Agent (Phase 14)\n- Calibrated Logistic Regression\n- 4 Readiness Tiers / 6 Dimensions\n- Non-Exclusion Guarantee\n- Small-Group Suppression (N < 5)"]
        Agent_Placement["Placement Orchestration Agent (Phases 10 & 11)\n- Declarative Job Requirements\n- 2-Stage Eligibility Filtering\n- Candidate Shortlist Review\n- Placement Offer Lifecycle"]
    end

    subgraph DataLayer["Persistence & Storage Subsystem (Neon PostgreSQL + Drizzle ORM)"]
        DB_Workflows[("agent_workflows\nagent_workflow_steps\nagent_execution_events\nagent_workflow_approvals")]
        DB_Governance[("delegated_reviewers\nnotification_events\naudit_events")]
        DB_Domain[("student_skills\njob_requirements\nplacement_offers\npredictive_runs")]
        Storage_Engine["Provider-Independent Storage\n(S3-Compatible / Local 0o600)"]
    end

    ClientLayer --> Router
    Router --> Engine
    Engine --> Registry
    Engine --> Idempotency
    Engine --> Governance
    Engine --> Delegation
    Engine --> NotifCenter
    Engine --> Telemetry

    Engine <--> Agent_Profiling
    Engine <--> Agent_SkillGap
    Engine <--> Agent_Predictive
    Engine <--> Agent_Placement

    Agent_Profiling -.->|Contract 1: ProfilingToSkillGap| Agent_SkillGap
    Agent_SkillGap -.->|Contract 2: SkillGapToLearning| Agent_Profiling
    Agent_Profiling -.->|Contract 3: ProfilingAssessmentsToPredictive| Agent_Predictive
    AutonomousAgents -.->|Contract 4: MultiAgentToPlacement| Agent_Placement

    Engine --> DB_Workflows
    Delegation --> DB_Governance
    NotifCenter --> DB_Governance
    Telemetry --> DB_Workflows
    AutonomousAgents --> DB_Domain
    Agent_Profiling --> Storage_Engine
```

---

## 3. End-to-End Student Journey Sequence

The following sequence diagram details the complete lifecycle of a student across the 7 integrated workflows from initial onboarding to verified placement confirmation.

```mermaid
sequenceDiagram
    autonumber
    actor Student as Student Candidate
    actor TPO as TPO Administrator
    actor Recruiter as Corporate Recruiter
    participant Orch as Central Orchestration Engine
    participant ProfAgent as Profiling Agent
    participant GapAgent as Skill-Gap Agent
    participant PredAgent as Predictive Agent
    participant PlaceAgent as Placement Agent
    participant Notif as Notification Center

    %% Stage 1: Onboarding
    Note over Student,ProfAgent: Phase 15 / WF 1: Student Onboarding & Profiling
    Student->>Orch: POST /orchestration/workflows (WF_STUDENT_ONBOARDING_PROFILING)
    Orch->>ProfAgent: Ingest resume, extract skills, compute completeness
    ProfAgent-->>Orch: Baseline score (80-100%), extracted skills
    Orch->>Notif: Dispatch WORKFLOW_COMPLETED notification
    Notif-->>Student: Alert: Profile successfully ingested

    %% Stage 2: Evidence Verification
    Note over Student,TPO: Phase 15 / WF 2: Evidence Verification Dispatch
    Student->>Orch: Submit skill evidence artifact (WF_EVIDENCE_VERIFICATION_DISPATCH)
    Orch->>Orch: Halt at step_reviewer_approval_gate (WAITING_FOR_REVIEW)
    Orch->>Notif: Alert TPO: Human approval required
    TPO->>Orch: POST /workflows/:id/approve (APPROVED + notes)
    Orch->>ProfAgent: Commit verified skill state (verified: true)
    Orch-->>Student: Skill verified notification

    %% Stage 3: Career Alignment
    Note over Student,GapAgent: Phase 15 / WF 3: Career Alignment & Skill-Gap Analysis
    Student->>Orch: Request career match (WF_CAREER_INTELLIGENCE_MATCH)
    Orch->>GapAgent: Evaluate verified skills vs market role taxonomy
    GapAgent-->>Orch: Matched skills, classified gaps (MODERATE/CRITICAL), confidence score

    %% Stage 4: Learning Sync
    Note over Student,GapAgent: Phase 15 / WF 4: Adaptive Preparation & Learning Pathway Sync
    Orch->>GapAgent: Dispatch WF_PREPARATION_LEARNING_SYNC
    GapAgent-->>Orch: Recommended practice projects, lab hours, priority assignments
    Orch-->>Student: Personalized learning roadmap ready

    %% Stage 5: Mock Assessment & Readiness Update
    Note over Student,PredAgent: Phase 15 / WF 5: Mock Drive Assessment & Readiness Update
    Student->>PredAgent: Complete aptitude, safe coding sandbox, & interview simulator
    PredAgent->>PredAgent: Calculate 4-tier readiness score (6 dimensions, calibrated regression)
    PredAgent-->>Orch: Non-exclusion guarantee (canExcludeStudent: false)

    %% Stage 6: Recruiter Job Posting & Activation
    Note over Recruiter,TPO: Phase 15 / Job Requirement Governance
    Recruiter->>Orch: POST /jobs (Creates Job Specification in DRAFT status)
    Note right of Recruiter: Recruiter cannot self-activate job
    TPO->>Orch: PUT /jobs/:id (TPO activates job to ACTIVE status)

    %% Stage 7: Drive Eligibility & Shortlisting
    Note over Student,PlaceAgent: Phase 15 / WF 6 & 7: Eligibility & Shortlist Governance
    Orch->>PlaceAgent: Dispatch WF_PLACEMENT_DRIVE_ELIGIBILITY (CGPA, department, attendance, backlogs)
    PlaceAgent-->>Orch: Candidate isEligible: true with explainable matching reasons
    Recruiter->>Orch: Initiate shortlist (WF_CANDIDATE_SHORTLIST_REVIEW)
    Orch->>Orch: Halt at step_tpo_governance_gate (WAITING_FOR_REVIEW)
    TPO->>Orch: Review rankings & authorize candidate shortlist
    Orch->>PlaceAgent: Dispatch authorized shortlist to Recruiter

    %% Stage 8: Placement Confirmation
    Note over Student,PredAgent: Phase 15 / WF 8: Placement Confirmation & Analytics Sync
    Recruiter->>Student: Release official employment offer
    Student->>Orch: Submit offer acceptance (WF_PLACEMENT_OUTCOME_CONFIRMATION)
    Orch->>Orch: Halt at step_tpo_offer_gate (WAITING_FOR_REVIEW)
    TPO->>Orch: Formally verify & approve offer documentation
    Orch->>PredAgent: Synchronize institutional cohort forecasting models
    Orch->>Notif: Broadcast offer confirmation
```

---

## 4. Human-in-the-Loop Governance State Machine

```mermaid
stateDiagram-v2
    [*] --> QUEUED: Workflow Initiated via API / Event
    QUEUED --> RUNNING: Engine Pipeline Start

    state RUNNING {
        [*] --> ExecuteStep
        ExecuteStep --> StepSuccess: Execution Valid
        ExecuteStep --> StepRetry: Transient Error (attempt < maxRetries)
        StepRetry --> ExecuteStep: Exponential Backoff (100ms * 2^attempt)
        StepRetry --> StepFailed: Attempt Exhaustion (attempt >= maxRetries)
        StepSuccess --> NextStepCheck: Step Output Recorded
        NextStepCheck --> ExecuteStep: More Automated Steps
    }

    RUNNING --> WAITING_FOR_REVIEW: Step requiresHumanApproval = true
    RUNNING --> FAILED: Step Execution Fails after Max Retries
    RUNNING --> COMPLETED: All Steps Successfully Executed

    state WAITING_FOR_REVIEW {
        [*] --> PendingReview
        PendingReview --> ReviewApproved: TPO / Delegated Faculty APPROVES
        PendingReview --> ReviewRejected: TPO / Delegated Faculty REJECTS
    }

    WAITING_FOR_REVIEW --> RUNNING: ReviewApproved (Step Output Updated, Pipeline Resumes)
    WAITING_FOR_REVIEW --> FAILED: ReviewRejected (Rejection Reason Recorded in errorDetailsJson)

    FAILED --> QUEUED: TPO / SuperAdmin Triggers Retry (retryCount++)
    RUNNING --> CANCELLED: Authorized User Cancels Workflow
    WAITING_FOR_REVIEW --> CANCELLED: Authorized User Cancels Workflow

    COMPLETED --> [*]
    FAILED --> [*]
    CANCELLED --> [*]
```

---

## 5. Relational Schema Architecture (Drizzle ORM)

The Phase 15 schema introduces 6 normalized relational tables and 5 PostgreSQL enum types, defined additively in `server/src/db/schema.ts` and generated in migration `server/drizzle/0005_nappy_ego.sql`.

### Relational Entity-Relationship Diagram:

```mermaid
erDiagram
    tenants ||--o{ agent_workflows : "scopes"
    tenants ||--o{ delegated_reviewers : "delegates"
    tenants ||--o{ notification_events : "notifies"
    tenants ||--o{ agent_execution_events : "logs"

    users ||--o{ agent_workflows : "initiates"
    users ||--o{ delegated_reviewers : "delegated to"
    users ||--o{ delegated_reviewers : "delegated by"
    users ||--o{ notification_events : "receives"
    users ||--o{ agent_workflow_approvals : "reviews"

    agent_workflows ||--o{ agent_workflow_steps : "contains"
    agent_workflows ||--o{ agent_workflow_approvals : "gates"
    agent_workflows ||--o{ agent_execution_events : "emits"

    agent_workflows {
        uuid id PK
        uuid tenant_id FK
        varchar workflow_definition_id
        varchar workflow_name
        workflowTriggerTypeEnum trigger_type
        uuid initiated_by FK
        varchar idempotency_key UK
        workflowStatusEnum status
        varchar priority
        jsonb input_payload_json
        jsonb output_result_json
        jsonb error_details_json
        integer execution_duration_ms
        integer timeout_ms
        integer retry_count
        integer max_retries
        timestamptz started_at
        timestamptz completed_at
        timestamptz created_at
        timestamptz updated_at
    }

    agent_workflow_steps {
        uuid id PK
        uuid workflow_id FK
        uuid tenant_id FK
        varchar step_name
        integer step_index
        agentNameEnum responsible_agent
        workflowStatusEnum status
        jsonb input_json
        jsonb output_json
        jsonb error_json
        timestamptz started_at
        timestamptz completed_at
        timestamptz created_at
    }

    agent_workflow_approvals {
        uuid id PK
        uuid workflow_id FK
        uuid tenant_id FK
        uuid step_id FK
        varchar action_type
        varchar required_role
        workflowApprovalStatusEnum status
        uuid reviewed_by FK
        text reviewer_notes
        timestamptz reviewed_at
        timestamptz created_at
    }

    delegated_reviewers {
        uuid id PK
        uuid tenant_id FK
        uuid user_id FK
        uuid delegated_by FK
        jsonb permissions_json
        boolean is_active
        timestamptz valid_until
        text notes
        timestamptz created_at
        timestamptz updated_at
    }

    notification_events {
        uuid id PK
        uuid tenant_id FK
        uuid recipient_user_id FK
        notificationEventTypeEnum event_type
        varchar title
        text message
        varchar reference_type
        uuid reference_id
        boolean is_read
        timestamptz read_at
        jsonb metadata_json
        timestamptz created_at
    }

    agent_execution_events {
        uuid id PK
        uuid workflow_id FK
        uuid tenant_id FK
        varchar event_type
        agentNameEnum agent_name
        jsonb payload_json
        varchar correlation_id
        integer execution_time_ms
        timestamptz created_at
    }
```

---

## 6. Execution Lifecycle, Retry & Idempotency Specifications

### 6.1 Idempotency Key Semantics
- When initiating a workflow, clients may supply an optional `idempotencyKey` string (e.g. `idem-profile-33333333-20261115`).
- The engine checks for an existing record with matching `tenantId` and `idempotencyKey`.
- If found, the existing hydrated workflow instance is immediately returned with HTTP `200 OK` and `{ isIdempotentReplay: true }`.
- Duplicate executions, duplicate steps, and duplicate in-app notifications are strictly prevented.

### 6.2 Exponential Backoff Retry Policy
- Each workflow definition specifies a `maxRetries` threshold (default 2 to 3) and `timeoutMs` (default 60,000ms to 180,000ms).
- When an automated step throws an unhandled exception:
  $$\text{Backoff Duration} = \min\left(100 \times 2^{\text{attempt}}, 1000\right) \text{ ms}$$
- If attempts exceed `maxRetries`, the step is marked `FAILED`, the workflow transitions to `FAILED`, an error payload is recorded in `errorDetailsJson`, and a `WORKFLOW_FAILED` notification is dispatched to the user.
- TPO or SuperAdmin users can manually recover failed workflows via `POST /api/v1/orchestration/workflows/:id/retry`, which increments `retryCount`, resets failed steps to `PENDING`, and re-triggers execution.

---

## 7. Compliance with Master Policies

| Policy Mandate | Implementation Guarantee |
| :--- | :--- |
| **Strict ₹0 Zero-Cost Architecture** | 100% free-tier and self-contained runtime: Node.js Express v5, Neon PostgreSQL Free Tier, in-memory resilient fallback repositories, and Vite React frontend. Zero paid third-party orchestrator APIs (e.g. Temporal Cloud, AWS Step Functions, or paid Zapier/Make APIs). |
| **Deterministic Rule-Based Governance** | Critical decisions (eligibility, verified skills, reviewer authorization) are executed via pure deterministic TypeScript code. LLMs provide assistive suggestions only. |
| **No Auto-Verification Policy** | Completing mock tests, assessment modules, or learning tasks *never* auto-promotes skills to `VERIFIED`. Human TPO verification remains mandatory. |
| **Zero PII Egress to AI Models** | Local regex filter (`pii-filter.ts`) scrub phone numbers, emails, addresses, and national IDs. Observability telemetry deeply sanitizes all payloads. |
| **Multi-Tenant RLS Compliance** | All relational tables include `tenant_id` foreign keys with cascade deletion and btree indexing. Express middleware and connection pool context enforce tenant boundary checks. |
