# CARRERSYNC — PHASE 10.1 INITIAL AUDIT REPORT
## Security, Eligibility & Architecture Baseline Audit

**Date:** 2026-11-15  
**Auditor:** Senior Backend Security Engineer & Database Architect  
**Scope:** Phase 10 Implementation Verification, Permissions, Role Normalization, Eligibility Fairness, Readiness Scoring, Database Migrations, and Cloudflare Removal Status  

---

### 1. Executive Summary
An initial comprehensive audit was performed on the CarrerSync codebase following the Phase 10 delivery. The audit identified five critical areas requiring correction to meet production-grade security, algorithmic fairness, and architectural standards:
1. **Verification Permissions Discrepancy:** In Phase 10, `COLLEGE_ADMIN` and `SUPERADMIN` were permitted to execute evidence verification decisions alongside `TPO_ADMIN`. Per Prompt 10.1 policy, evidence verification authority must be strictly restricted to `TPO_ADMIN` (or explicitly authorized verification reviewers). `STUDENT`, `RECRUITER`, `COLLEGE_ADMIN`, and `SUPER_ADMIN` must not automatically receive verification authority.
2. **Eligibility Engine Fairness Gap:** The Phase 10 eligibility engine evaluated required skills in the same rule evaluation pipeline as hard administrative constraints. Consequently, a student who met all department, graduation year, and academic criteria was marked `INELIGIBLE` overall if a required skill lacked verified evidence. This violates the core rule: **"Missing skill evidence must not automatically make a student administratively INELIGIBLE."**
3. **Readiness Score Reweighting Incompleteness:** The readiness calculation dynamically reweighted only when academic data was absent ($0.80$ denominator). When other dimensions (such as project evidence or verified skills) were missing, they were imputed as 0 without generalized reweighting.
4. **Role Representation Inconsistency:** The codebase exhibited multiple representations of roles: lowercase (`'superadmin'`, `'college_admin'`, `'tpo_admin'`) in `server/src/types.ts` and `userRoleEnum`, legacy uppercase `'SUPERADMIN'` in test mocks and route comments, and canonical `'SUPER_ADMIN'` in prompt specifications.
5. **Database Migration Disconnect:** Drizzle schemas in `server/src/db/schema.ts` were maintained in code and in-memory test mocks, but `server/` lacked a `drizzle.config.ts` and generated SQL migration files in `server/drizzle/`.
6. **Cloudflare Workers Deployment Reference:** While the active Node.js + Express 5 server in `server/` has zero runtime dependencies on Cloudflare, `workers/` contains a legacy `wrangler.toml` that must be verified as strictly isolated and non-deployable in production CI/CD.

---

### 2. Verification Permissions Audit

#### 2.1 Existing Code Analysis (`server/src/verification/verification.service.ts`)
Lines 129–140 currently state:
```typescript
if (
  normalized !== 'TPO_ADMIN' &&
  normalized !== 'COLLEGE_ADMIN' &&
  normalized !== 'SUPERADMIN'
) {
  const err = new Error(
    `Forbidden: Only TPO_ADMIN and COLLEGE_ADMIN can perform verification decisions (received: ${role})`
  );
  (err as any).statusCode = 403;
  (err as any).code = 'FORBIDDEN_INSUFFICIENT_ROLE';
  throw err;
}
```
And in `server/src/routes/tpo.routes.ts`:
```typescript
tpoVerificationRoutes.post(
  '/:evidenceId/verify',
  requireAuth,
  requireRole(['tpo_admin', 'college_admin', 'superadmin'] as any),
  ...
);
```

#### 2.2 Finding & Required Correction
- **Discrepancy:** `COLLEGE_ADMIN` and `SUPER_ADMIN` currently receive automatic verification rights.
- **Required Policy:** Only `TPO_ADMIN` (or explicitly designated reviewers with `hasVerificationPermission: true`) may verify or reject evidence. Calls from `COLLEGE_ADMIN`, `SUPER_ADMIN`, `RECRUITER`, and `STUDENT` without explicit verification delegation must be rejected with `403 Forbidden` (`FORBIDDEN_INSUFFICIENT_ROLE`).
- **UI Update:** The TPO Verification Portal (`client/src/pages/tpo/VerificationPortal.jsx`) must hide or disable verification action buttons when viewed by non-TPO roles, displaying an advisory notice: *"Verification authority reserved for authorized TPO reviewers."*

---

### 3. Eligibility Engine Fairness Audit

#### 3.1 Existing Code Analysis (`server/src/eligibility/eligibility.service.ts`)
In `evaluateStudent`:
```typescript
if (missingSkillsCount > 0) {
  ruleEvaluations.push({
    ruleName: 'Required Skills Match',
    status: 'FAILED',
    details: `${missingSkillsCount} of ${job.requiredSkills.length} required skill(s) are completely missing...`
  });
}
...
const hasFailedRule = ruleEvaluations.some((r) => r.status === 'FAILED');
if (hasFailedRule) {
  finalResult = 'INELIGIBLE';
}
```

#### 3.2 Finding & Required Correction
- **Flaw:** A student who qualifies on department, graduation year, and CGPA but has no verified evidence for a required programming skill receives `finalResult: 'INELIGIBLE'`.
- **Fairness Principle:** Missing skill evidence is a readiness gap, not an administrative disqualification.
- **Correction:** Separate the evaluation into distinct fields:
  - `administrativeEligibility`: `'ELIGIBLE' | 'INELIGIBLE' | 'NEEDS_REVIEW'` (based strictly on Department, Graduation Year, CGPA).
  - `skillMatchStatus`: `'VERIFIED_MATCH' | 'EVIDENCE_MATCH' | 'PENDING_VERIFICATION' | 'MISSING_SKILL' | 'NOT_ASSESSED'`.
  - `overallReviewStatus`: `'ELIGIBLE' | 'NEEDS_REVIEW' | 'INELIGIBLE'`.
  - Missing skill evidence results in `administrativeEligibility: 'ELIGIBLE'`, `skillMatchStatus: 'MISSING_SKILL'`, and `overallReviewStatus: 'NEEDS_REVIEW'`. It must never mark the student administratively `INELIGIBLE`.
- **Recruiter Job Activation Guard:** When recruiters create job requirements, the job must default to `DRAFT` status. Only an authorized TPO/College Admin reviewer may approve and activate the job to `ACTIVE`.

---

### 4. Readiness Score Formula Audit

#### 4.1 Existing Code Analysis (`server/src/readiness/readiness.service.ts`)
Lines 215–232:
```typescript
if (hasAcademicData) {
  score = verifiedSkillsScore * 0.35 + evidenceCoverageScore * 0.25 + projectScore * 0.20 + academicScore * 0.20;
} else {
  const activeWeightSum = 0.35 + 0.25 + 0.20; // 0.80
  score = (verifiedSkillsScore * 0.35 + evidenceCoverageScore * 0.25 + projectScore * 0.20) / activeWeightSum;
}
```

#### 4.2 Finding & Required Correction
- **Flaw:** Only the academic dimension was reweighted dynamically. If a student was missing project evidence or had no skills yet recorded, the formula did not track missingness across those dimensions, imputing 0 into the weighted sum.
- **Generalized Formula:**
  $$\text{Adjusted Score} = \frac{\sum_{i \in \text{available}} w_i \times S_i}{\sum_{i \in \text{available}} w_i}$$
  where available dimensions are tracked dynamically with their canonical weights:
  - Verified Skills: $w = 0.35$
  - Evidence Coverage: $w = 0.25$
  - Project Evidence: $w = 0.20$
  - Academic Records: $w = 0.20$
- **Safeguard:** If $\sum_{i \in \text{available}} w_i < 0.40$ or overall data completeness $C < 0.40$, the student receives `category: 'INSUFFICIENT_DATA'` rather than a misleading partial score.

---

### 5. Role Normalization Audit

#### 5.1 Canonical Roles
The canonical role enumeration required by Prompt 10.1 is:
1. `SUPER_ADMIN`
2. `COLLEGE_ADMIN`
3. `TPO_ADMIN`
4. `RECRUITER`
5. `STUDENT`

#### 5.2 Discrepancies Found
- In `server/src/types.ts`: Defined as lowercase `'student' | 'college_admin' | 'tpo_admin' | 'faculty_coordinator' | 'recruiter' | 'superadmin'`.
- In `server/src/routes/tpo.routes.ts`, `server/src/routes/job.routes.ts`: Comments and some string checks referenced `'SUPERADMIN'`.
- In `workers/tests/auth.test.ts` and `server/tests/auth.test.ts`: Test mocks passed `'superadmin'` or `'super_admin'`.
- **Correction:** Create a single canonical role mapping utility (`server/src/utils/roles.ts`) supporting canonical uppercase (`SUPER_ADMIN`, etc.) with safe, backward-compatible normalization of legacy lowercase tokens.

---

### 6. Database Migration Audit

#### 6.1 Status
- `server/src/db/schema.ts` defines all Phase 07, 08, 09, and 10 tables, enums, relations, and types.
- However, `server/` lacked `drizzle.config.ts` and no SQL migration files existed in `server/drizzle/`.
- **Action Required:**
  1. Create `server/drizzle.config.ts`.
  2. Generate migration files using `drizzle-kit generate`.
  3. Verify SQL output for non-destructive operations, foreign key cascades, tenant isolation, and indexes.
  4. Document the live database status in `docs/PHASE_10_1_DATABASE_MIGRATION_AUDIT.md`.

---

### 7. Cloudflare Exclusion Status
- Active production runtime: **Node.js + Express 5** (`server/src/server.ts`).
- Production build scripts in root `package.json` and `server/package.json` have zero calls to `wrangler` or Cloudflare services.
- The `workers/` directory is isolated as a secondary test reference and is not deployed or referenced by Render or Vercel.

---

### 8. Audit Conclusion & Next Steps
All findings are recorded. Implementation of Phase 10.1 corrections will proceed in controlled stages:
1. Role normalization utility (`server/src/utils/roles.ts`).
2. Strict verification permissions enforcement in `verification.service.ts`, `tpo.routes.ts`, and frontend.
3. Two-stage eligibility engine fairness separation in `eligibility.service.ts`, `eligibility.types.ts`, and `job.routes.ts`.
4. Generalized dynamic reweighting and completeness checks in `readiness.service.ts`.
5. Drizzle migration generation and verification.
6. Multi-tier regression testing and documentation.
