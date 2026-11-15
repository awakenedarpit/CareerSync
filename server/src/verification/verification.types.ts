/**
 * CarrerSync Skill Verification Engine — Type Definitions & State Transition Rules
 * Phase 10 — TPO Verification Portal & Placement Readiness Intelligence Engine
 *
 * Core Governance Rules:
 * 1. "AI extraction is not verification" — Human TPO_ADMIN or COLLEGE_ADMIN certification required.
 * 2. Strict State Machine — Invalid state jumps (e.g. SELF_DECLARED -> VERIFIED directly) are strictly forbidden.
 * 3. Immutable Audit Trails — Every transition preserves reviewer identity, timestamp, and justification.
 */

import type { ProfileVerificationStatus } from '../db/schema';

// ============================================================================
// Verification Decisions & Statuses
// ============================================================================

export type VerificationDecision = 'VERIFY' | 'REJECT' | 'REQUEST_EVIDENCE';

export { type ProfileVerificationStatus };

// ============================================================================
// State Transition Machine Rules
// ============================================================================

/**
 * Authoritative Map of Allowed State Transitions:
 * - PENDING_REVIEW -> VERIFIED, REJECTED, NEEDS_MORE_EVIDENCE
 * - EVIDENCE_FOUND -> VERIFIED, REJECTED, NEEDS_MORE_EVIDENCE
 * - SELF_DECLARED -> NEEDS_MORE_EVIDENCE, REJECTED (cannot jump to VERIFIED directly without evidence)
 * - NEEDS_MORE_EVIDENCE -> PENDING_REVIEW (on resubmission), REJECTED
 * - REJECTED -> PENDING_REVIEW (on formal appeal with new evidence)
 * - VERIFIED -> terminal verified state
 */
export const ALLOWED_VERIFICATION_TRANSITIONS: Record<
  ProfileVerificationStatus,
  readonly ProfileVerificationStatus[]
> = {
  PENDING_REVIEW: ['VERIFIED', 'REJECTED', 'NEEDS_MORE_EVIDENCE'],
  EVIDENCE_FOUND: ['VERIFIED', 'REJECTED', 'NEEDS_MORE_EVIDENCE'],
  SELF_DECLARED: ['NEEDS_MORE_EVIDENCE', 'REJECTED'],
  NEEDS_MORE_EVIDENCE: ['PENDING_REVIEW', 'REJECTED'],
  REJECTED: ['PENDING_REVIEW'],
  VERIFIED: []
};

/**
 * Validates whether a state transition from `currentStatus` to `targetStatus` is permitted.
 */
export function isValidVerificationTransition(
  currentStatus: ProfileVerificationStatus,
  targetStatus: ProfileVerificationStatus
): boolean {
  const allowed = ALLOWED_VERIFICATION_TRANSITIONS[currentStatus];
  if (!allowed) return false;
  return allowed.includes(targetStatus);
}

/**
 * Validates transition rules and throws an explicit 400 error when invalid.
 */
export function assertValidVerificationTransition(
  currentStatus: ProfileVerificationStatus,
  targetStatus: ProfileVerificationStatus
): void {
  if (currentStatus === 'SELF_DECLARED' && targetStatus === 'VERIFIED') {
    const err = new Error(
      `Invalid state transition: Cannot transition directly from SELF_DECLARED to VERIFIED without verifiable evidence`
    );
    (err as any).statusCode = 400;
    (err as any).code = 'INVALID_STATE_TRANSITION';
    throw err;
  }

  if (!isValidVerificationTransition(currentStatus, targetStatus)) {
    const err = new Error(
      `Invalid state transition: Cannot transition from ${currentStatus} to ${targetStatus}`
    );
    (err as any).statusCode = 400;
    (err as any).code = 'INVALID_STATE_TRANSITION';
    throw err;
  }
}

// ============================================================================
// Service Parameter Interfaces
// ============================================================================

export interface VerifyEvidenceParams {
  evidenceId: string;
  reviewerId: string;
  reviewerRole: string;
  tenantId: string;
  reason: string;
  reviewerNotes?: string | null;
  hasExplicitVerificationPermission?: boolean;
}

export interface RejectEvidenceParams {
  evidenceId: string;
  reviewerId: string;
  reviewerRole: string;
  tenantId: string;
  reason: string;
  reviewerNotes?: string | null;
  hasExplicitVerificationPermission?: boolean;
}

export interface RequestMoreEvidenceParams {
  evidenceId: string;
  reviewerId: string;
  reviewerRole: string;
  tenantId: string;
  reason: string;
  reviewerNotes?: string | null;
  hasExplicitVerificationPermission?: boolean;
}

export interface StudentResubmitParams {
  evidenceId: string;
  studentId: string;
  tenantId: string;
  notes: string;
  additionalDocumentId?: string;
}

export interface PendingQueueFilters {
  department?: string;
  category?: string;
  evidenceType?: string;
  search?: string;
  page?: number;
  limit?: number;
}

// ============================================================================
// Data Transfer Objects & Response Payloads
// ============================================================================

export interface VerificationSummary {
  totalStudents: number;
  totalEvidence: number;
  pendingCount: number;
  verifiedCount: number;
  rejectedCount: number;
  needsMoreEvidenceCount: number;
}

export interface StudentDetailsDTO {
  id: string;
  userId: string;
  fullName: string;
  email: string;
  rollNumber?: string | null;
  department?: string | null;
  batchYear?: number | null;
  cgpa?: string | number | null;
}

export interface DocumentDetailsDTO {
  id: string;
  originalFilename: string;
  documentType: string;
  storageKey?: string | null;
  mimeType?: string | null;
  fileSize?: number | null;
}

export interface PendingQueueItemDTO {
  id: string;
  tenantId: string;
  userId: string;
  skillName: string;
  category: string;
  proficiencyClaim?: string | null;
  evidenceType: string;
  documentId?: string | null;
  extractionId?: string | null;
  confidence: string | number;
  verificationStatus: ProfileVerificationStatus;
  reviewedBy?: string | null;
  reviewedAt?: Date | string | null;
  reviewNotes?: string | null;
  createdAt: Date | string;
  updatedAt: Date | string;
  student: StudentDetailsDTO | null;
  document: DocumentDetailsDTO | null;
}

export interface VerificationReviewRecordDTO {
  id: string;
  tenantId: string;
  studentId: string;
  evidenceId: string;
  reviewerId: string;
  reviewerName?: string | null;
  reviewerRole?: string | null;
  previousStatus: ProfileVerificationStatus;
  newStatus: ProfileVerificationStatus;
  reason: string;
  reviewerNotes?: string | null;
  createdAt: Date | string;
}

export interface VerificationActionResultDTO {
  success: boolean;
  evidenceId: string;
  previousStatus: ProfileVerificationStatus;
  newStatus: ProfileVerificationStatus;
  reviewedBy: string;
  reviewedAt: Date | string;
  reason: string;
  reviewerNotes?: string | null;
}
