# CarrerSync Phase 15 — Cross-Agent API Contracts & Runtime Schemas
## Zod Schemas, Versioned Payloads, Runtime Validation Rules, and REST API Endpoints

**Document Version:** 1.0.0  
**Phase:** Phase 15 — Cross-Agent Integration, End-to-End Workflow & Platform Reliability  
**Date:** November 15, 2026  
**Audience:** Backend Engineers, API Consumers, Frontend Integrators, Security Auditors  
**Classification:** Canonical API Contract Specification  

---

## 1. Overview & Validation Framework

CarrerSync enforces strict runtime schema validation using **Zod** across all cross-agent boundaries, REST API endpoints, and event pipelines.

### Architectural Guarantees:
1. **Zero Runtime Data Corruption**: All incoming payloads are validated before pipeline execution begins; malformed requests are rejected immediately with HTTP `400 Bad Request` and descriptive path-based error summaries.
2. **Immutable Type Safety**: TypeScript types are inferred directly from Zod schemas using `z.infer<typeof Schema>`, guaranteeing complete parity between static typechecks and runtime validation.
3. **Multi-Tenant Scoping**: All contract payloads operating across agent boundaries require explicit `studentId` and `tenantId` UUIDs.

---

## 2. Cross-Agent Handshake Contracts

### 2.1 Contract 1: Student Profiling $\to$ Industry Skill-Gap

Located in `server/src/orchestration/contracts/profiling-to-skill-gap.contract.ts`.

#### Input Schema (`ProfilingToSkillGapInputSchema`):
```typescript
export const ProfilingToSkillGapInputSchema = z.object({
  studentId: z.string().uuid({ message: 'studentId must be a valid UUID' }),
  tenantId: z.string().uuid({ message: 'tenantId must be a valid UUID' }),
  approvedProfile: z.object({
    headline: z.string().min(1, 'Headline is required'),
    summary: z.string().optional().default(''),
    education: z.array(
      z.object({
        institution: z.string(),
        degree: z.string(),
        fieldOfStudy: z.string().optional(),
        cgpa: z.number().optional()
      })
    ).min(1, 'At least one education entry is required'),
    experience: z.array(z.record(z.any())).optional().default([]),
    projects: z.array(z.record(z.any())).optional().default([]),
    profileCompletenessScore: z.number().min(0).max(100)
  }),
  verifiedSkills: z.array(
    z.object({
      skillName: z.string().min(1),
      proficiency: z.enum(['BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'EXPERT']).or(z.string()),
      verifiedBy: z.string(),
      verifiedAt: z.string().or(z.date()),
      evidenceRefs: z.array(z.string()).default([])
    })
  ).min(1, 'At least one verified skill is required for skill gap analysis'),
  evidenceRefs: z.array(z.string()).default([]),
  targetRole: z.string().min(1, 'Target role is required')
});
```

#### Output Schema (`ProfilingToSkillGapOutputSchema`):
```typescript
export const ProfilingToSkillGapOutputSchema = z.object({
  matchedSkills: z.array(z.string()),
  missingEvidence: z.array(z.string()),
  skillGaps: z.array(
    z.object({
      skillName: z.string(),
      currentLevel: z.string().optional(),
      requiredLevel: z.string(),
      gapSeverity: z.enum(['CRITICAL', 'MODERATE', 'LOW'])
    })
  ),
  confidence: z.number().min(0).max(1),
  explanation: z.string().min(1)
});
```

---

### 2.2 Contract 2: Industry Skill-Gap $\to$ Learning Intelligence

Located in `server/src/orchestration/contracts/skill-gap-to-learning.contract.ts`.

#### Input Schema (`SkillGapToLearningInputSchema`):
```typescript
export const SkillGapToLearningInputSchema = z.object({
  targetRole: z.string().min(1, 'Target role is required'),
  skillRequirements: z.array(
    z.object({
      skillName: z.string().min(1),
      requiredProficiency: z.string().min(1)
    })
  ).min(1, 'At least one skill requirement is required'),
  studentSkillProfile: z.object({
    verifiedSkills: z.array(z.string()),
    gapSkills: z.array(z.string())
  }),
  assessmentResults: z.array(
    z.object({
      assessmentType: z.string(),
      score: z.number().min(0).max(100),
      evaluatedAt: z.string().or(z.date()).optional()
    })
  ).optional().default([])
});
```

#### Output Schema (`SkillGapToLearningOutputSchema`):
```typescript
export const SkillGapToLearningOutputSchema = z.object({
  recommendedTasks: z.array(
    z.object({
      taskId: z.string(),
      title: z.string().min(1),
      skillTarget: z.string().min(1),
      taskType: z.string(),
      estimatedHours: z.number().min(0),
      priority: z.enum(['HIGH', 'MEDIUM', 'LOW'])
    })
  ).min(1, 'At least one recommended learning task must be returned'),
  priority: z.enum(['HIGH', 'MEDIUM', 'LOW']),
  expectedOutcome: z.string().min(1),
  reason: z.string().min(1)
});
```

---

### 2.3 Contract 3: Profiling + Mock Assessments $\to$ Predictive Analytics

Located in `server/src/orchestration/contracts/profiling-assessments-to-predictive.contract.ts`.

#### Input Schema (`ProfilingAssessmentsToPredictiveInputSchema`):
```typescript
export const ProfilingAssessmentsToPredictiveInputSchema = z.object({
  verifiedSkills: z.array(
    z.object({
      skillName: z.string().min(1),
      proficiency: z.string().min(1)
    })
  ).default([]),
  evidenceCoverage: z.number().min(0).max(1),
  assessmentResults: z.array(
    z.object({
      assessmentType: z.string(),
      score: z.number().min(0).max(100),
      completedAt: z.string().or(z.date())
    })
  ).default([]),
  historicalOutcomes: z.array(
    z.object({
      driveType: z.string(),
      outcome: z.string()
    })
  ).optional().default([])
});
```

#### Output Schema (`ProfilingAssessmentsToPredictiveOutputSchema`):
```typescript
export const ProfilingAssessmentsToPredictiveOutputSchema = z.object({
  readinessIndicators: z.object({
    technicalScore: z.number().min(0).max(100),
    softSkillScore: z.number().min(0).max(100),
    overallReadiness: z.number().min(0).max(100),
    readinessClassification: z.enum([
      'HIGH_READINESS',
      'MODERATE_READINESS',
      'DEVELOPING_READINESS',
      'INSUFFICIENT_DATA'
    ])
  }),
  performanceTrends: z.array(
    z.object({
      period: z.string(),
      score: z.number(),
      metric: z.string()
    })
  ).default([]),
  supportRecommendations: z.array(
    z.object({
      category: z.string(),
      priority: z.enum(['CRITICAL', 'HIGH', 'MEDIUM', 'LOW']).or(z.string()),
      notes: z.string()
    })
  ).default([]),
  predictionAvailability: z.boolean()
});
```

---

### 2.4 Contract 4: Multi-Agent Collective $\to$ Placement Orchestration

Located in `server/src/orchestration/contracts/multi-agent-to-placement.contract.ts`.

#### Input Schema (`MultiAgentToPlacementInputSchema`):
```typescript
export const MultiAgentToPlacementInputSchema = z.object({
  jobRequirements: z.object({
    jobId: z.string().uuid({ message: 'jobId must be a valid UUID' }),
    title: z.string().min(1, 'Job title is required'),
    requiredSkills: z.array(z.string()).min(1, 'At least one required skill must be specified'),
    minCgpa: z.number().min(0).max(10).optional().default(0),
    allowedBranches: z.array(z.string()).optional().default([])
  }),
  administrativeCriteria: z.object({
    attendancePercentage: z.number().min(0).max(100),
    feeClearance: z.boolean(),
    disciplinaryClearance: z.boolean()
  }),
  skillMatches: z.array(
    z.object({
      studentId: z.string().uuid(),
      matchedSkillCount: z.number().min(0),
      totalSkillsRequired: z.number().min(1),
      matchPercentage: z.number().min(0).max(100)
    })
  ),
  studentConsent: z.boolean(),
  tpoApprovalState: z.object({
    isApproved: z.boolean(),
    approvedBy: z.string().optional(),
    approvedAt: z.string().or(z.date()).optional()
  })
});
```

#### Output Schema (`MultiAgentToPlacementOutputSchema`):
```typescript
export const MultiAgentToPlacementOutputSchema = z.object({
  candidateMatches: z.array(
    z.object({
      studentId: z.string().uuid(),
      matchScore: z.number().min(0).max(100),
      rank: z.number().int().positive()
    })
  ),
  eligibilityResult: z.object({
    isEligible: z.boolean(),
    rejectionReasons: z.array(z.string()).default([])
  }),
  reviewRequiredStatus: z.boolean(),
  auditRefs: z.array(z.string()).default([])
});
```

---

## 3. REST API Routes Reference

All endpoints are mounted under `/api/v1/` and enforce Bearer JWT authentication and anti-spoofing tenant isolation middleware.

### 3.1 Orchestration Endpoints (`/api/v1/orchestration`)

| Method | Endpoint | Allowed Roles | Description | Response Status |
| :--- | :--- | :--- | :--- | :---: |
| `GET` | `/registry` | All Authenticated | Returns all 7 registered workflow definitions with metadata | `200 OK` |
| `POST` | `/workflows` | Defined per workflow | Initiates workflow execution with idempotency & schema check | `201 Created` / `200 OK` |
| `GET` | `/workflows` | All Authenticated | Lists tenant workflows with status filter and pagination | `200 OK` |
| `GET` | `/workflows/:id` | All Authenticated | Gets workflow status, steps, execution events, and outputs | `200 OK` / `404 Not Found` |
| `POST` | `/workflows/:id/approve` | `TPO_ADMIN`, `SUPER_ADMIN`, Delegated | Submits human review decision (`APPROVED` / `REJECTED`) | `200 OK` / `403 Forbidden` |
| `POST` | `/workflows/:id/cancel` | `TPO_ADMIN`, `SUPER_ADMIN` | Cancels running or queued workflow instance | `200 OK` |
| `POST` | `/workflows/:id/retry` | `TPO_ADMIN`, `SUPER_ADMIN` | Retries a previously `FAILED` workflow instance | `200 OK` / `400 Bad Request` |
| `GET` | `/observability/stats` | `TPO_ADMIN`, `SUPER_ADMIN` | Returns platform metrics, success rates, and agent health | `200 OK` |
| `GET` | `/observability/events` | `TPO_ADMIN`, `SUPER_ADMIN` | Filterable tamper-evident execution event stream | `200 OK` |
| `GET` | `/delegation` | `TPO_ADMIN`, `SUPER_ADMIN` | Lists active delegated faculty reviewers for tenant | `200 OK` |
| `POST` | `/delegation` | `TPO_ADMIN`, `SUPER_ADMIN` | Delegates reviewer authority to faculty coordinator | `201 Created` |
| `DELETE` | `/delegation/:id` | `TPO_ADMIN`, `SUPER_ADMIN` | Revokes delegated reviewer authority immediately | `200 OK` |

### 3.2 In-App Notification Endpoints (`/api/v1/notifications`)

| Method | Endpoint | Allowed Roles | Description | Response Status |
| :--- | :--- | :--- | :--- | :---: |
| `GET` | `/` | All Authenticated | Retrieves paginated user notifications and unread counter | `200 OK` |
| `PATCH` | `/:id/read` | All Authenticated | Marks a single notification as read | `200 OK` |
| `POST` | `/read-all` | All Authenticated | Marks all notifications for current user as read | `200 OK` |
| `GET` | `/preferences` | All Authenticated | Retrieves categorized notification preferences | `200 OK` |
| `PUT` | `/preferences` | All Authenticated | Updates notification preferences | `200 OK` |

---

## 4. Standardized Error Response Formats

All error payloads strictly adhere to uniform JSON contracts:

```json
{
  "success": false,
  "error": "Descriptive error message",
  "code": "OPTIONAL_ERROR_CODE",
  "details": []
}
```

### Common HTTP Status Codes:
- `400 Bad Request`: Payload fails Zod validation or illegal state transition (e.g. retrying non-failed workflow).
- `401 Unauthorized`: Missing, invalid, or expired Bearer JWT token.
- `403 Forbidden`: Insufficient role authority, tenant spoofing detected (`TENANT_SPOOFING_REJECTED`), or missing reviewer delegation.
- `404 Not Found`: Workflow, delegation, or notification ID does not exist within tenant boundary.
- `500 Internal Server Error`: Unhandled system failure.
