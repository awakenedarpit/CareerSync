# CarrerSync Phase 15 — Central Workflow Registry Catalog
## Specification of All 7 Pre-Configured End-to-End Orchestrated Workflows

**Document Version:** 1.0.0  
**Phase:** Phase 15 — Cross-Agent Integration, End-to-End Workflow & Platform Reliability  
**Date:** November 15, 2026  
**Audience:** Platform Architects, Workflow Authors, QA Engineers, Integration Developers  
**Classification:** Canonical Workflow Specification  

---

## 1. Catalog Summary Table

| Workflow ID | Workflow Name | Trigger Type | Initiating Roles | Responsible Agent | Human Gate? | Timeout SLA | Max Retries |
| :--- | :--- | :---: | :--- | :---: | :---: | :---: | :---: |
| `WF_STUDENT_ONBOARDING_PROFILING` | Student Onboarding & Profiling | `MANUAL_USER` | `STUDENT`, `COLLEGE_ADMIN`, `TPO_ADMIN`, `SUPER_ADMIN` | `STUDENT_PROFILING_AGENT` | No | 60,000 ms | 3 |
| `WF_EVIDENCE_VERIFICATION_DISPATCH` | Skill Evidence Verification Dispatch | `AUTOMATED_EVENT` | `STUDENT`, `TPO_ADMIN`, `COLLEGE_ADMIN`, `SUPER_ADMIN` | `STUDENT_PROFILING_AGENT` | **Yes** | 120,000 ms | 2 |
| `WF_CAREER_INTELLIGENCE_MATCH` | Skill-Gap & Career Alignment Match | `AUTOMATED_EVENT` | `STUDENT`, `TPO_ADMIN`, `COLLEGE_ADMIN`, `SUPER_ADMIN` | `INDUSTRY_SKILL_GAP_AGENT` | No | 60,000 ms | 3 |
| `WF_PREPARATION_LEARNING_SYNC` | Adaptive Preparation & Learning Sync | `AUTOMATED_EVENT` | `STUDENT`, `TPO_ADMIN`, `SUPER_ADMIN` | `INDUSTRY_SKILL_GAP_AGENT` | No | 90,000 ms | 3 |
| `WF_PLACEMENT_DRIVE_ELIGIBILITY` | Placement Drive Eligibility Filtering | `AUTOMATED_EVENT` | `TPO_ADMIN`, `COLLEGE_ADMIN`, `RECRUITER`, `SUPER_ADMIN` | `PLACEMENT_ORCHESTRATION_AGENT` | No | 60,000 ms | 2 |
| `WF_CANDIDATE_SHORTLIST_REVIEW` | Candidate Shortlist & TPO Review | `MANUAL_USER` | `TPO_ADMIN`, `RECRUITER`, `SUPER_ADMIN` | `PLACEMENT_ORCHESTRATION_AGENT` | **Yes** | 180,000 ms | 1 |
| `WF_PLACEMENT_OUTCOME_CONFIRMATION` | Offer Confirmation & Analytics Sync | `MANUAL_USER` | `TPO_ADMIN`, `STUDENT`, `SUPER_ADMIN` | `PREDICTIVE_PLACEMENT_AGENT` | **Yes** | 60,000 ms | 3 |

---

## 2. Detailed Workflow Specifications

### 2.1 `WF_STUDENT_ONBOARDING_PROFILING`
- **Workflow ID**: `WF_STUDENT_ONBOARDING_PROFILING`
- **Name**: Student Onboarding & Comprehensive Profiling
- **Description**: Ingests student resume and profile data, extracts skills and credentials, and computes baseline profile completeness score.
- **Trigger Type**: `MANUAL_USER`
- **Initiating Roles**: `STUDENT`, `COLLEGE_ADMIN`, `TPO_ADMIN`, `SUPER_ADMIN`
- **Responsible Agent**: `STUDENT_PROFILING_AGENT`
- **Human Approval Required**: `false`
- **Timeout SLA**: 60,000 ms (60 seconds)
- **Max Retries**: 3
- **Step Pipeline**:
  1. `step_profile_ingest` (Index 1) — `STUDENT_PROFILING_AGENT`: Document & profile ingestion.
  2. `step_skill_extract` (Index 2) — `STUDENT_PROFILING_AGENT`: Attribute & skill extraction.
  3. `step_completeness_calc` (Index 3) — `STUDENT_PROFILING_AGENT`: Baseline completeness calculation.
- **Input Schema**:
  ```typescript
  z.object({
    studentId: z.string().uuid(),
    rawProfile: z.record(z.any()),
    documentUrl: z.string().url().optional()
  })
  ```
- **Output Schema**:
  ```typescript
  z.object({
    studentId: z.string().uuid(),
    profileCompletenessScore: z.number().min(0).max(100),
    extractedSkills: z.array(z.string()),
    status: z.string()
  })
  ```

---

### 2.2 `WF_EVIDENCE_VERIFICATION_DISPATCH`
- **Workflow ID**: `WF_EVIDENCE_VERIFICATION_DISPATCH`
- **Name**: Skill Evidence Verification Dispatch
- **Description**: Dispatches submitted student evidence and skill artifacts to TPO or delegated faculty reviewers with mandatory human sign-off.
- **Trigger Type**: `AUTOMATED_EVENT`
- **Initiating Roles**: `STUDENT`, `TPO_ADMIN`, `COLLEGE_ADMIN`, `SUPER_ADMIN`
- **Responsible Agent**: `STUDENT_PROFILING_AGENT`
- **Human Approval Required**: `true` (Halts at Step 2)
- **Timeout SLA**: 120,000 ms (2 minutes)
- **Max Retries**: 2
- **Step Pipeline**:
  1. `step_evidence_package` (Index 1) — `STUDENT_PROFILING_AGENT`: Evidence artifact packaging.
  2. `step_reviewer_approval_gate` (Index 2) — `CENTRAL_ORCHESTRATOR`: **Human-in-the-loop TPO review gate (`WAITING_FOR_REVIEW`)**. Requires `TPO_ADMIN` or delegated faculty reviewer.
  3. `step_verification_commit` (Index 3) — `STUDENT_PROFILING_AGENT`: Commits verified skill state upon approval.
- **Input Schema**:
  ```typescript
  z.object({
    studentId: z.string().uuid(),
    skillName: z.string().min(1),
    evidenceUrl: z.string().url(),
    evidenceType: z.string()
  })
  ```
- **Output Schema**:
  ```typescript
  z.object({
    studentId: z.string().uuid(),
    skillName: z.string(),
    verified: z.boolean(),
    verifiedBy: z.string().optional(),
    verifiedAt: z.string().optional()
  })
  ```

---

### 2.3 `WF_CAREER_INTELLIGENCE_MATCH`
- **Workflow ID**: `WF_CAREER_INTELLIGENCE_MATCH`
- **Name**: Industry Skill-Gap & Career Alignment Match
- **Description**: Cross-analyzes verified student profile against real-time market role skill requirements using international taxonomies.
- **Trigger Type**: `AUTOMATED_EVENT`
- **Initiating Roles**: `STUDENT`, `TPO_ADMIN`, `COLLEGE_ADMIN`, `SUPER_ADMIN`
- **Responsible Agent**: `INDUSTRY_SKILL_GAP_AGENT`
- **Human Approval Required**: `false`
- **Timeout SLA**: 60,000 ms (60 seconds)
- **Max Retries**: 3
- **Step Pipeline**:
  1. `step_market_lookup` (Index 1) — `INDUSTRY_SKILL_GAP_AGENT`: Market taxonomy & role requirements lookup.
  2. `step_gap_analysis` (Index 2) — `INDUSTRY_SKILL_GAP_AGENT`: Gap severity and coverage analysis.
- **Input Contract**: `ProfilingToSkillGapInputSchema`
- **Output Contract**: `ProfilingToSkillGapOutputSchema`

---

### 2.4 `WF_PREPARATION_LEARNING_SYNC`
- **Workflow ID**: `WF_PREPARATION_LEARNING_SYNC`
- **Name**: Adaptive Preparation & Learning Pathway Sync
- **Description**: Generates targeted practice problems, lab assignments, and mock assessment schedules to close identified gaps.
- **Trigger Type**: `AUTOMATED_EVENT`
- **Initiating Roles**: `STUDENT`, `TPO_ADMIN`, `SUPER_ADMIN`
- **Responsible Agent**: `INDUSTRY_SKILL_GAP_AGENT`
- **Human Approval Required**: `false`
- **Timeout SLA**: 90,000 ms (90 seconds)
- **Max Retries**: 3
- **Step Pipeline**:
  1. `step_goal_translation` (Index 1) — `INDUSTRY_SKILL_GAP_AGENT`: Skill gap translation to learning goals.
  2. `step_task_synthesis` (Index 2) — `INDUSTRY_SKILL_GAP_AGENT`: Adaptive task synthesis and scheduling.
- **Input Contract**: `SkillGapToLearningInputSchema`
- **Output Contract**: `SkillGapToLearningOutputSchema`

---

### 2.5 `WF_PLACEMENT_DRIVE_ELIGIBILITY`
- **Workflow ID**: `WF_PLACEMENT_DRIVE_ELIGIBILITY`
- **Name**: Placement Drive Eligibility & Multi-Criteria Filtering
- **Description**: Applies institutional criteria, academic benchmarks, and skill thresholds to determine candidate drive eligibility with explainable reasons.
- **Trigger Type**: `AUTOMATED_EVENT`
- **Initiating Roles**: `TPO_ADMIN`, `COLLEGE_ADMIN`, `RECRUITER`, `SUPER_ADMIN`
- **Responsible Agent**: `PLACEMENT_ORCHESTRATION_AGENT`
- **Human Approval Required**: `false`
- **Timeout SLA**: 60,000 ms (60 seconds)
- **Max Retries**: 2
- **Step Pipeline**:
  1. `step_criteria_check` (Index 1) — `PLACEMENT_ORCHESTRATION_AGENT`: Academic & administrative clearance check (CGPA, backlogs, department, attendance).
- **Input Schema**:
  ```typescript
  z.object({
    jobId: z.string().uuid(),
    studentId: z.string().uuid(),
    studentCgpa: z.number().min(0).max(10),
    minCgpa: z.number().min(0).max(10),
    department: z.string(),
    allowedDepartments: z.array(z.string()),
    attendancePercentage: z.number().min(0).max(100),
    backlogCount: z.number().int().min(0)
  })
  ```
- **Output Schema**:
  ```typescript
  z.object({
    jobId: z.string().uuid(),
    studentId: z.string().uuid(),
    isEligible: z.boolean(),
    eligibilityReasons: z.array(z.string()),
    evaluatedAt: z.string()
  })
  ```

---

### 2.6 `WF_CANDIDATE_SHORTLIST_REVIEW`
- **Workflow ID**: `WF_CANDIDATE_SHORTLIST_REVIEW`
- **Name**: Candidate Shortlisting & TPO Human Governance Review
- **Description**: Synthesizes multi-agent match rankings and halts at human-in-the-loop review gate for mandatory TPO authorization.
- **Trigger Type**: `MANUAL_USER`
- **Initiating Roles**: `TPO_ADMIN`, `RECRUITER`, `SUPER_ADMIN`
- **Responsible Agent**: `PLACEMENT_ORCHESTRATION_AGENT`
- **Human Approval Required**: `true` (Halts at Step 2)
- **Timeout SLA**: 180,000 ms (3 minutes)
- **Max Retries**: 1
- **Step Pipeline**:
  1. `step_ranking_synthesis` (Index 1) — `PLACEMENT_ORCHESTRATION_AGENT`: Candidate ranking synthesis.
  2. `step_tpo_governance_gate` (Index 2) — `CENTRAL_ORCHESTRATOR`: **TPO Shortlist Review & Authorization Gate (`WAITING_FOR_REVIEW`)**.
  3. `step_shortlist_finalize` (Index 3) — `PLACEMENT_ORCHESTRATION_AGENT`: Recruiter submission dispatch.
- **Input Contract**: `MultiAgentToPlacementInputSchema`
- **Output Contract**: `MultiAgentToPlacementOutputSchema`

---

### 2.7 `WF_PLACEMENT_OUTCOME_CONFIRMATION`
- **Workflow ID**: `WF_PLACEMENT_OUTCOME_CONFIRMATION`
- **Name**: Placement Offer Confirmation & Longitudinal Analytics Sync
- **Description**: Confirms formal job offer acceptance, updates corporate feedback, and synchronizes cohort predictive models.
- **Trigger Type**: `MANUAL_USER`
- **Initiating Roles**: `TPO_ADMIN`, `STUDENT`, `SUPER_ADMIN`
- **Responsible Agent**: `PREDICTIVE_PLACEMENT_AGENT`
- **Human Approval Required**: `true` (Halts at Step 2)
- **Timeout SLA**: 60,000 ms (60 seconds)
- **Max Retries**: 3
- **Step Pipeline**:
  1. `step_offer_verification` (Index 1) — `PREDICTIVE_PLACEMENT_AGENT`: Offer verification & acceptance check.
  2. `step_tpo_offer_gate` (Index 2) — `CENTRAL_ORCHESTRATOR`: **Institutional TPO Offer Approval Gate (`WAITING_FOR_REVIEW`)**.
  3. `step_analytics_sync` (Index 3) — `PREDICTIVE_PLACEMENT_AGENT`: Longitudinal analytics & prediction calibration sync.
- **Input Schema**:
  ```typescript
  z.object({
    studentId: z.string().uuid(),
    jobId: z.string().uuid(),
    companyName: z.string().min(1),
    ctc: z.number().positive(),
    offerDate: z.string().or(z.date()),
    acceptanceStatus: z.enum(['ACCEPTED', 'DECLINED', 'PENDING'])
  })
  ```
- **Output Schema**:
  ```typescript
  z.object({
    studentId: z.string().uuid(),
    jobId: z.string().uuid(),
    confirmed: z.boolean(),
    predictiveModelUpdated: z.boolean(),
    timestamp: z.string()
  })
  ```
