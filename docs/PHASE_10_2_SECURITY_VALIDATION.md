# Phase 10.2 Security Validation Report: Skill Verification & Job Activation Authorization Hardening

## Executive Summary

During the Phase 10 implementation of the **TPO Verification Portal & Placement Readiness Intelligence Engine**, an in-depth security audit revealed two critical authorization vulnerabilities:
1. **Critical Vulnerability A (Client-Supplied Header Trust in Verification Decisions)**: The server accepted and trusted a client-supplied HTTP header (`x-verification-permission: true`) to confer verification decision authority to users (`COLLEGE_ADMIN`, `SUPER_ADMIN`), allowing potential client-side spoofing and bypassing the principle of least privilege.
2. **Critical Vulnerability B (Job Activation RBAC & Cross-Tenant Gating Gaps)**: The `POST /api/v1/jobs/:jobId/activate` endpoint lacked strict cross-tenant verification (returning 400 instead of 403 upon tenant mismatch) and did not enforce that recruiters can only edit drafts or that critical changes to active jobs transition back to draft status for mandatory TPO re-review.

In Phase 10.2, both vulnerabilities were comprehensively remediated with defense-in-depth controls at both HTTP routing and domain service layers. Client-controlled permission headers were completely purged. Verification authority is now strictly derived from trusted server-side authorization state (native `TPO_ADMIN` role or explicit tenant-scoped server delegation).

---

## 1. Vulnerability Analysis & Threat Models

### 1.1 Vulnerability A: Client-Supplied Verification Header Injection (CWE-285, CWE-639)

#### Before (Vulnerable State)
In `server/src/routes/tpo.routes.ts`:
```typescript
// VULNERABLE CODE (Pre-Phase 10.2)
function assertVerificationDecisionAuthority(req: Request, res: Response): boolean {
  if (!assertTpoReviewerRole(req, res)) return false;

  const user = req.user!;
  const canonical = normalizeRole(user.role);

  // VULNERABILITY: Inspects client-controlled header
  const hasExplicitPermission =
    Boolean((user as any).hasVerificationPermission) ||
    req.headers['x-verification-permission'] === 'true';

  if (canonical === 'COLLEGE_ADMIN' || canonical === 'SUPER_ADMIN') {
    if (!hasExplicitPermission) {
      res.status(403).json(...);
      return false;
    }
    return true; // Any client passing the header was granted authority!
  }
  ...
}
```

#### Threat Model A:
- **Attacker Profile**: A malicious or unauthorized institutional user (e.g. non-delegated College Admin, or untrusted actor attempting header tampering).
- **Attack Vector**: Attacker sends a POST request to `/api/v1/tpo/verification/:evidenceId/verify` injecting `x-verification-permission: true`.
- **Impact**: Bypassed human TPO oversight, falsely certifying unverified student skill evidence and degrading placement credibility.

#### Remediated State (Phase 10.2)
- **Elimination of Header Trust**: `req.headers['x-verification-permission']` is completely eradicated from authorization decisions and never trusted.
- **Server-Side Authorization Registry**: Verification authority must come exclusively from:
  1. `TPO_ADMIN` role for the tenant.
  2. Server-side delegated reviewer registry (`verificationService.isDelegatedReviewer(tenantId, userId)`).
  3. Trusted cryptographic claims in verified JWT tokens (`payload.hasVerificationPermission`).
- **Strict Role Gating**: Students and recruiters are strictly barred from verification decisions with `403 Forbidden` (`FORBIDDEN_INSUFFICIENT_ROLE`).

---

### 1.2 Vulnerability B: Cross-Tenant Job Activation & Recruiter Lifecycle Gaps (CWE-284, CWE-639)

#### Before (Vulnerable State)
1. In `POST /api/v1/jobs/:jobId/activate`:
   - Looking up a job in another tenant returned `null` from `getJobById(jobId, user.tenantId)`.
   - `updateJob` threw a generic error, returning `400 Bad Request` instead of `403 Forbidden` (`FORBIDDEN_TENANT_MISMATCH`).
2. In `PUT /api/v1/jobs/:jobId`:
   - Recruiters could modify active job criteria directly without resetting the posting to draft status.
   - Critical eligibility changes (CGPA, required skills, eligible departments) on an active job remained immediately live without institutional TPO re-review.

#### Threat Model B:
- **Attacker Profile**:
  - College A TPO attempting to activate College B's private placement drive.
  - Recruiter modifying eligibility cutoffs post-approval to bypass TPO placement policy.
- **Attack Vector**:
  - `POST /api/v1/jobs/:tenantBJobId/activate` with Tenant A bearer token.
  - `PUT /api/v1/jobs/:activeJobId` altering `minimumCgpa` or `requiredSkills`.
- **Impact**: Cross-tenant data tampering and unvetted job requirement publications.

#### Remediated State (Phase 10.2)
- **Cross-Tenant Detection**: The service queries `findJobById(jobId)` across all tenants; if `job.tenantId !== user.tenantId`, the request is immediately rejected with `403 Forbidden` (`FORBIDDEN_TENANT_MISMATCH`).
- **Recruiter Draft-Only Policy**: Recruiters can only edit jobs in `DRAFT` status (`FORBIDDEN_RECRUITER_DRAFT_ONLY`).
- **Mandatory Re-Review**: When critical eligibility criteria (`eligibleDepartments`, `graduationYear`, `minimumCgpa`, `requiredSkills`) are modified on an `ACTIVE` job, its status is automatically reset to `DRAFT`, mandating explicit TPO re-activation.

---

## 2. Summary of Applied Fixes

| Component | File | Changes Implemented |
|---|---|---|
| **Auth Types** | `server/src/types.ts` | Added `hasVerificationPermission` and `isDelegatedReviewer` to `AuthUserContext`. |
| **Crypto Utilities** | `server/src/utils/crypto.ts` | Supported server-side JWT claims for verification delegation in `createJwtToken`. |
| **JWT Middleware** | `server/src/middleware/auth.ts` | Populated server-side delegation flags on `req.user` from verified token payload; headers ignored. |
| **Verification Service** | `server/src/verification/verification.service.ts` | Added server-side tenant-scoped `delegatedReviewers` registry; enhanced `validateReviewerRole` with multi-tier checks. |
| **TPO Routes** | `server/src/routes/tpo.routes.ts` | Purged `x-verification-permission` header consumption; made `assertVerificationDecisionAuthority` async with server delegation checks. |
| **Eligibility Service** | `server/src/eligibility/eligibility.service.ts` | Added `findJobById` for tenant boundary verification; updated `updateJob` to throw 403 on tenant mismatch and reset status to DRAFT on critical updates. |
| **Job Routes** | `server/src/routes/job.routes.ts` | Added explicit cross-tenant verification (`403 FORBIDDEN_TENANT_MISMATCH`), blocked recruiter edits to active jobs, and strictly restricted activation to institutional reviewers. |
| **Test Suite** | `server/tests/verification.test.ts` | Updated legacy test to use server-side `verificationService.delegateReviewer()` instead of header injection. |
| **Regression Tests** | `server/tests/verification-security.test.ts` | Added comprehensive automated regression tests covering all 8 required threat scenarios. |

---

## 3. Threat Matrix & Regression Verification Evidence

| Scenario / Threat Vector | Expected Result | Actual Result | Test Status |
|---|---|---|---|
| Student sends `x-verification-permission: true` | `403 Forbidden` (`FORBIDDEN_INSUFFICIENT_ROLE`) | `403 Forbidden` | PASS |
| Recruiter sends `x-verification-permission: true` | `403 Forbidden` (`FORBIDDEN_INSUFFICIENT_ROLE`) | `403 Forbidden` | PASS |
| College Admin sends header without server delegation | `403 Forbidden` (`FORBIDDEN_INSUFFICIENT_ROLE`) | `403 Forbidden` | PASS |
| Super Admin sends header without server delegation | `403 Forbidden` (`FORBIDDEN_INSUFFICIENT_ROLE`) | `403 Forbidden` | PASS |
| Authorized TPO reviewer verifies evidence | `200 OK` (`status: VERIFIED`) | `200 OK` | PASS |
| Explicitly server-delegated reviewer verifies evidence | `200 OK` (`status: VERIFIED`) | `200 OK` | PASS |
| Cross-tenant job activation attempt | `403 Forbidden` (`FORBIDDEN_TENANT_MISMATCH`) | `403 Forbidden` | PASS |
| Recruiter attempts to activate job | `403 Forbidden` (`FORBIDDEN_INSUFFICIENT_ROLE`) | `403 Forbidden` | PASS |
| Student attempts to activate job | `403 Forbidden` (`FORBIDDEN_INSUFFICIENT_ROLE`) | `403 Forbidden` | PASS |
| Recruiter attempts to edit active job | `403 Forbidden` (`FORBIDDEN_RECRUITER_DRAFT_ONLY`) | `403 Forbidden` | PASS |
| Critical updates to active job criteria | Status resets to `DRAFT` for re-review | Status: `DRAFT` | PASS |
| Cross-tenant job update via PUT | `403 Forbidden` (`FORBIDDEN_TENANT_MISMATCH`) | `403 Forbidden` | PASS |
| Audit trail persistence (reviewer, reason, timestamp) | Immutable record in `skillVerificationReviews` | Verified in DB/store | PASS |
