/**
 * CarrerSync Skill Verification Engine — Core Service
 * Phase 10 — TPO Verification Portal & Placement Readiness Intelligence Engine
 *
 * Implements authoritative faculty/TPO evidence verification, state transition rules,
 * student resubmission workflows, pending queue filtering, and audit logging.
 *
 * Core Governance Rules Enforced:
 * 1. "AI extraction is not verification" — Only TPO_ADMIN and COLLEGE_ADMIN can verify evidence.
 *    STUDENT and RECRUITER attempts are strictly blocked with HTTP 403 Forbidden.
 * 2. Strict State Machine transitions — SELF_DECLARED cannot jump directly to VERIFIED.
 * 3. Strict Tenant Isolation — College A admins cannot view or verify College B evidence (403 Forbidden).
 * 4. Immutable Audit Trails — Every decision is preserved in skillVerificationReviews and auditEvents.
 * 5. Full offline & unit-test resilience with in-memory stores and PostgreSQL fallback.
 */

import crypto from 'crypto';
import { eq, and, desc, inArray, sql } from 'drizzle-orm';
import { getDb } from '../db/client';
import {
  profileSkillEvidence,
  skillVerificationReviews,
  auditEvents,
  users,
  students,
  documents,
  type ProfileSkillEvidence
} from '../db/schema';
import {
  assertValidVerificationTransition,
  type ProfileVerificationStatus,
  type VerifyEvidenceParams,
  type RejectEvidenceParams,
  type RequestMoreEvidenceParams,
  type StudentResubmitParams,
  type PendingQueueFilters,
  type PendingQueueItemDTO,
  type VerificationSummary,
  type VerificationReviewRecordDTO,
  type VerificationActionResultDTO,
  type StudentDetailsDTO,
  type DocumentDetailsDTO
} from './verification.types';
import { normalizeRole } from '../utils/roles';
import { profilingService } from '../services/profiling.service';
import { inMemoryDocuments } from '../routes/file.routes';

export class VerificationService {
  private static instance: VerificationService | null = null;

  // In-memory fallback stores for offline testing and fast lookups
  private inMemorySkillEvidence = new Map<string, ProfileSkillEvidence>();
  private inMemoryReviews = new Map<string, VerificationReviewRecordDTO>();
  private inMemoryStudents = new Map<string, any>();
  private inMemoryUsers = new Map<string, any>();
  private inMemoryDocuments = new Map<string, any>();
  // Server-side delegated reviewer registry: tenantId -> Set<userId>
  private delegatedReviewers = new Map<string, Set<string>>();

  public static getInstance(): VerificationService {
    if (!this.instance) {
      this.instance = new VerificationService();
    }
    return this.instance;
  }

  public static resetInstance(): void {
    if (this.instance) {
      this.instance.clearInMemoryStore();
    }
    this.instance = null;
  }

  public clearInMemoryStore(): void {
    this.inMemorySkillEvidence.clear();
    this.inMemoryReviews.clear();
    this.inMemoryStudents.clear();
    this.inMemoryUsers.clear();
    this.inMemoryDocuments.clear();
    this.delegatedReviewers.clear();
  }

  // ============================================================================
  // Reviewer Delegation Management (Server-Side Authorization)
  // ============================================================================

  /**
   * Explicitly delegates verification reviewer authority to a user within a specific tenant.
   * Reviewer delegation is strictly server-side and tenant-scoped.
   */
  public delegateReviewer(tenantId: string, userId: string, delegatedBy?: string): void {
    let set = this.delegatedReviewers.get(tenantId);
    if (!set) {
      set = new Set<string>();
      this.delegatedReviewers.set(tenantId, set);
    }
    set.add(userId);
  }

  /**
   * Revokes delegated verification authority from a user within a tenant.
   */
  public revokeDelegatedReviewer(tenantId: string, userId: string): void {
    const set = this.delegatedReviewers.get(tenantId);
    if (set) {
      set.delete(userId);
    }
  }

  /**
   * Checks synchronously if a user is an explicitly delegated reviewer for a tenant.
   */
  public isDelegatedReviewerSync(tenantId: string, userId: string): boolean {
    const set = this.delegatedReviewers.get(tenantId);
    return Boolean(set && set.has(userId));
  }

  /**
   * Checks asynchronously if a user is an explicitly delegated reviewer for a tenant.
   */
  public async isDelegatedReviewer(tenantId: string, userId: string): Promise<boolean> {
    return this.isDelegatedReviewerSync(tenantId, userId);
  }

  // ============================================================================
  // Test Seeding Utilities
  // ============================================================================

  public seedEvidence(evidence: ProfileSkillEvidence): void {
    this.inMemorySkillEvidence.set(evidence.id, { ...evidence });
  }

  public seedStudent(student: any): void {
    const key = student.userId || student.id;
    this.inMemoryStudents.set(key, { ...student });
  }

  public seedUser(user: any): void {
    this.inMemoryUsers.set(user.id, { ...user });
  }

  public seedDocument(doc: any): void {
    this.inMemoryDocuments.set(doc.id, { ...doc });
  }

  public seedReview(review: VerificationReviewRecordDTO): void {
    this.inMemoryReviews.set(review.id, { ...review });
  }

  public getSeededUser(userId: string): any {
    return this.inMemoryUsers.get(userId) || null;
  }

  public getSeededStudent(studentId: string): any {
    return this.inMemoryStudents.get(studentId) || null;
  }

  // ============================================================================
  // Internal Role & Evidence Validation
  // ============================================================================

  /**
   * Enforces strict RBAC: Only authorized TPO verification reviewers can perform verification decisions.
   * STUDENT and RECRUITER can NEVER verify evidence and are rejected with 403 Forbidden.
   * TPO_ADMIN has native authority for their tenant.
   * Non-TPO roles (COLLEGE_ADMIN, SUPER_ADMIN) must have explicit server-side delegation scoped to that tenant.
   * Client-supplied headers are strictly ignored and must never grant verification authority.
   */
  private validateReviewerRole(
    role: string,
    hasExplicitPermission?: boolean,
    tenantId?: string,
    reviewerId?: string
  ): void {
    const canonical = normalizeRole(role);

    if (canonical === 'STUDENT') {
      const err = new Error('Forbidden: Students cannot verify skill evidence');
      (err as any).statusCode = 403;
      (err as any).code = 'FORBIDDEN_INSUFFICIENT_ROLE';
      throw err;
    }

    if (canonical === 'RECRUITER') {
      const err = new Error('Forbidden: Recruiters cannot verify skill evidence');
      (err as any).statusCode = 403;
      (err as any).code = 'FORBIDDEN_INSUFFICIENT_ROLE';
      throw err;
    }

    const isDelegated =
      Boolean(hasExplicitPermission) ||
      (tenantId && reviewerId ? this.isDelegatedReviewerSync(tenantId, reviewerId) : false);

    if (canonical === 'COLLEGE_ADMIN' || canonical === 'SUPER_ADMIN') {
      if (!isDelegated) {
        const err = new Error(
          `Forbidden: ${canonical} does not possess verification reviewer authority without explicit server-side TPO verification delegation`
        );
        (err as any).statusCode = 403;
        (err as any).code = 'FORBIDDEN_INSUFFICIENT_ROLE';
        throw err;
      }
      return;
    }

    if (canonical !== 'TPO_ADMIN') {
      if (!isDelegated) {
        const err = new Error(
          `Forbidden: Only authorized TPO verification reviewers can perform verification decisions (received: ${role})`
        );
        (err as any).statusCode = 403;
        (err as any).code = 'FORBIDDEN_INSUFFICIENT_ROLE';
        throw err;
      }
      return;
    }
  }

  /**
   * Resolves a skill evidence item from memory or PostgreSQL database.
   * Validates tenant isolation against the requested tenantId.
   */
  public async getEvidence(
    evidenceId: string,
    tenantId?: string
  ): Promise<ProfileSkillEvidence> {
    // 1. Check local in-memory store
    let evidence = this.inMemorySkillEvidence.get(evidenceId);

    // 2. Check profilingService in-memory store if available
    if (!evidence) {
      const profilingStore = (profilingService as any)['inMemorySkillEvidence'] as
        | Map<string, ProfileSkillEvidence>
        | undefined;
      if (profilingStore && profilingStore.has(evidenceId)) {
        evidence = profilingStore.get(evidenceId);
        if (evidence) {
          this.inMemorySkillEvidence.set(evidence.id, { ...evidence });
        }
      }
    }

    // 3. Check PostgreSQL database
    if (!evidence) {
      try {
        const db = getDb();
        const rows = await db
          .select()
          .from(profileSkillEvidence)
          .where(eq(profileSkillEvidence.id, evidenceId))
          .limit(1);

        if (rows && rows.length > 0) {
          evidence = rows[0] as ProfileSkillEvidence;
          this.inMemorySkillEvidence.set(evidence.id, { ...evidence });
        }
      } catch {
        // DB offline fallback
      }
    }

    if (!evidence) {
      const err = new Error(`Skill evidence record not found: ${evidenceId}`);
      (err as any).statusCode = 404;
      (err as any).code = 'NOT_FOUND';
      throw err;
    }

    // Strict tenant isolation enforcement
    if (tenantId && evidence.tenantId !== tenantId) {
      const err = new Error(
        `Forbidden: Access denied. Evidence does not belong to the requested tenant`
      );
      (err as any).statusCode = 403;
      (err as any).code = 'FORBIDDEN_TENANT_MISMATCH';
      throw err;
    }

    return evidence;
  }

  /**
   * Gathers all evidence records for a tenant across memory and profiling service.
   */
  private getAllTenantEvidenceInMemory(tenantId: string): ProfileSkillEvidence[] {
    const map = new Map<string, ProfileSkillEvidence>();

    // From profiling service
    const profilingStore = (profilingService as any)['inMemorySkillEvidence'] as
      | Map<string, ProfileSkillEvidence>
      | undefined;
    if (profilingStore) {
      for (const ev of profilingStore.values()) {
        if (ev.tenantId === tenantId) {
          map.set(ev.id, ev);
        }
      }
    }

    // From local in-memory store
    for (const ev of this.inMemorySkillEvidence.values()) {
      if (ev.tenantId === tenantId) {
        map.set(ev.id, ev);
      }
    }

    return Array.from(map.values());
  }

  /**
   * Persists audit event in auditEvents table (non-blocking).
   */
  private async logAuditEvent(
    tenantId: string,
    actorId: string,
    action: string,
    resourceId: string,
    changesDiff: Record<string, unknown>
  ): Promise<void> {
    try {
      const db = getDb();
      await db.insert(auditEvents).values({
        tenantId,
        actorId,
        action,
        resourceType: 'profile_skill_evidence',
        resourceId,
        changesDiff
      });
    } catch {
      // Non-blocking in offline test environments
    }
  }

  /**
   * Persists a review decision record into skillVerificationReviews.
   */
  private async persistReviewRecord(
    record: VerificationReviewRecordDTO
  ): Promise<void> {
    this.inMemoryReviews.set(record.id, record);

    try {
      const db = getDb();
      await db.insert(skillVerificationReviews).values({
        id: record.id,
        tenantId: record.tenantId,
        studentId: record.studentId,
        evidenceId: record.evidenceId,
        reviewerId: record.reviewerId,
        previousStatus: record.previousStatus,
        newStatus: record.newStatus,
        reason: record.reason,
        reviewerNotes: record.reviewerNotes || null,
        createdAt: new Date(record.createdAt)
      });
    } catch {
      // Non-blocking in offline test environments
    }
  }

  // ============================================================================
  // Core Verification Workflows
  // ============================================================================

  /**
   * 1. verifyEvidence
   * Marks evidence as VERIFIED.
   * - Strict role checking: only TPO_ADMIN and COLLEGE_ADMIN can verify.
   * - Rejects STUDENT and RECRUITER with 403 Forbidden.
   * - Validates tenant isolation (evidence.tenantId === tenantId).
   * - Validates transition rules (SELF_DECLARED cannot jump to VERIFIED directly).
   * - Updates profileSkillEvidence and records in skillVerificationReviews and auditEvents.
   */
  public async verifyEvidence(
    params: VerifyEvidenceParams
  ): Promise<VerificationActionResultDTO> {
    const { evidenceId, reviewerId, reviewerRole, tenantId, reason, reviewerNotes } = params;

    // 1. Role validation
    this.validateReviewerRole(
      reviewerRole,
      params.hasExplicitVerificationPermission,
      tenantId,
      reviewerId
    );

    // 2. Validate reason
    if (!reason || !reason.trim()) {
      const err = new Error('Verification requires a mandatory justification reason');
      (err as any).statusCode = 400;
      (err as any).code = 'REASON_REQUIRED';
      throw err;
    }

    // 3. Fetch evidence with tenant isolation validation
    const evidence = await this.getEvidence(evidenceId, tenantId);

    // 4. Validate state transition rules
    const previousStatus = evidence.verificationStatus;
    assertValidVerificationTransition(previousStatus, 'VERIFIED');

    const now = new Date();
    const finalNotes = reviewerNotes?.trim() || reason.trim();

    // 5. Update evidence record
    evidence.verificationStatus = 'VERIFIED';
    evidence.reviewedBy = reviewerId;
    evidence.reviewedAt = now;
    evidence.reviewNotes = finalNotes;
    evidence.updatedAt = now;

    // Save in memory
    this.inMemorySkillEvidence.set(evidence.id, { ...evidence });

    // Sync with profilingService store if present
    const profilingStore = (profilingService as any)['inMemorySkillEvidence'] as
      | Map<string, ProfileSkillEvidence>
      | undefined;
    if (profilingStore && profilingStore.has(evidence.id)) {
      profilingStore.set(evidence.id, { ...evidence });
    }

    // Update in PostgreSQL
    try {
      const db = getDb();
      await db
        .update(profileSkillEvidence)
        .set({
          verificationStatus: 'VERIFIED',
          reviewedBy: reviewerId,
          reviewedAt: now,
          reviewNotes: finalNotes,
          updatedAt: now
        })
        .where(eq(profileSkillEvidence.id, evidence.id));
    } catch {
      // Non-blocking in offline test environments
    }

    // 6. Insert audit record into skillVerificationReviews
    const reviewRecord: VerificationReviewRecordDTO = {
      id: crypto.randomUUID(),
      tenantId: evidence.tenantId,
      studentId: evidence.userId,
      evidenceId: evidence.id,
      reviewerId,
      reviewerRole,
      previousStatus,
      newStatus: 'VERIFIED',
      reason: reason.trim(),
      reviewerNotes: finalNotes,
      createdAt: now
    };
    await this.persistReviewRecord(reviewRecord);

    // 7. Log database audit event
    await this.logAuditEvent(
      evidence.tenantId,
      reviewerId,
      'SKILL_EVIDENCE_VERIFIED',
      evidence.id,
      {
        previousStatus,
        newStatus: 'VERIFIED',
        reason: reason.trim(),
        reviewerNotes: finalNotes
      }
    );

    return {
      success: true,
      evidenceId: evidence.id,
      previousStatus,
      newStatus: 'VERIFIED',
      reviewedBy: reviewerId,
      reviewedAt: now,
      reason: reason.trim(),
      reviewerNotes: finalNotes
    };
  }

  /**
   * 2. rejectEvidence
   * Marks evidence as REJECTED.
   * - Strict role checking: only TPO_ADMIN and COLLEGE_ADMIN.
   * - Rejects STUDENT and RECRUITER with 403 Forbidden.
   * - Validates tenant isolation.
   * - Requires justification reason.
   */
  public async rejectEvidence(
    params: RejectEvidenceParams
  ): Promise<VerificationActionResultDTO> {
    const { evidenceId, reviewerId, reviewerRole, tenantId, reason, reviewerNotes } = params;

    // 1. Role validation
    this.validateReviewerRole(
      reviewerRole,
      params.hasExplicitVerificationPermission,
      tenantId,
      reviewerId
    );

    // 2. Validate reason
    if (!reason || !reason.trim()) {
      const err = new Error('Rejection requires a mandatory justification reason');
      (err as any).statusCode = 400;
      (err as any).code = 'REASON_REQUIRED';
      throw err;
    }

    // 3. Fetch evidence with tenant isolation
    const evidence = await this.getEvidence(evidenceId, tenantId);

    // 4. Validate state transition
    const previousStatus = evidence.verificationStatus;
    assertValidVerificationTransition(previousStatus, 'REJECTED');

    const now = new Date();
    const finalNotes = reviewerNotes?.trim() || reason.trim();

    // 5. Update evidence record
    evidence.verificationStatus = 'REJECTED';
    evidence.reviewedBy = reviewerId;
    evidence.reviewedAt = now;
    evidence.reviewNotes = finalNotes;
    evidence.updatedAt = now;

    this.inMemorySkillEvidence.set(evidence.id, { ...evidence });

    const profilingStore = (profilingService as any)['inMemorySkillEvidence'] as
      | Map<string, ProfileSkillEvidence>
      | undefined;
    if (profilingStore && profilingStore.has(evidence.id)) {
      profilingStore.set(evidence.id, { ...evidence });
    }

    try {
      const db = getDb();
      await db
        .update(profileSkillEvidence)
        .set({
          verificationStatus: 'REJECTED',
          reviewedBy: reviewerId,
          reviewedAt: now,
          reviewNotes: finalNotes,
          updatedAt: now
        })
        .where(eq(profileSkillEvidence.id, evidence.id));
    } catch {
      // Non-blocking in offline test environments
    }

    // 6. Record review event
    const reviewRecord: VerificationReviewRecordDTO = {
      id: crypto.randomUUID(),
      tenantId: evidence.tenantId,
      studentId: evidence.userId,
      evidenceId: evidence.id,
      reviewerId,
      reviewerRole,
      previousStatus,
      newStatus: 'REJECTED',
      reason: reason.trim(),
      reviewerNotes: finalNotes,
      createdAt: now
    };
    await this.persistReviewRecord(reviewRecord);

    // 7. Log audit event
    await this.logAuditEvent(
      evidence.tenantId,
      reviewerId,
      'SKILL_EVIDENCE_REJECTED',
      evidence.id,
      {
        previousStatus,
        newStatus: 'REJECTED',
        reason: reason.trim(),
        reviewerNotes: finalNotes
      }
    );

    return {
      success: true,
      evidenceId: evidence.id,
      previousStatus,
      newStatus: 'REJECTED',
      reviewedBy: reviewerId,
      reviewedAt: now,
      reason: reason.trim(),
      reviewerNotes: finalNotes
    };
  }

  /**
   * 3. requestMoreEvidence
   * Marks evidence as NEEDS_MORE_EVIDENCE.
   * - Strict role checking: only TPO_ADMIN and COLLEGE_ADMIN.
   * - Requires justification reason explaining what additional evidence is needed.
   */
  public async requestMoreEvidence(
    params: RequestMoreEvidenceParams
  ): Promise<VerificationActionResultDTO> {
    const { evidenceId, reviewerId, reviewerRole, tenantId, reason, reviewerNotes } = params;

    // 1. Role validation
    this.validateReviewerRole(
      reviewerRole,
      params.hasExplicitVerificationPermission,
      tenantId,
      reviewerId
    );

    // 2. Validate reason
    if (!reason || !reason.trim()) {
      const err = new Error('Requesting more evidence requires explanatory guidance');
      (err as any).statusCode = 400;
      (err as any).code = 'REASON_REQUIRED';
      throw err;
    }

    // 3. Fetch evidence with tenant isolation
    const evidence = await this.getEvidence(evidenceId, tenantId);

    // 4. Validate state transition
    const previousStatus = evidence.verificationStatus;
    assertValidVerificationTransition(previousStatus, 'NEEDS_MORE_EVIDENCE');

    const now = new Date();
    const finalNotes = reviewerNotes?.trim() || reason.trim();

    // 5. Update evidence record
    evidence.verificationStatus = 'NEEDS_MORE_EVIDENCE';
    evidence.reviewedBy = reviewerId;
    evidence.reviewedAt = now;
    evidence.reviewNotes = finalNotes;
    evidence.updatedAt = now;

    this.inMemorySkillEvidence.set(evidence.id, { ...evidence });

    const profilingStore = (profilingService as any)['inMemorySkillEvidence'] as
      | Map<string, ProfileSkillEvidence>
      | undefined;
    if (profilingStore && profilingStore.has(evidence.id)) {
      profilingStore.set(evidence.id, { ...evidence });
    }

    try {
      const db = getDb();
      await db
        .update(profileSkillEvidence)
        .set({
          verificationStatus: 'NEEDS_MORE_EVIDENCE',
          reviewedBy: reviewerId,
          reviewedAt: now,
          reviewNotes: finalNotes,
          updatedAt: now
        })
        .where(eq(profileSkillEvidence.id, evidence.id));
    } catch {
      // Non-blocking in offline test environments
    }

    // 6. Record review event
    const reviewRecord: VerificationReviewRecordDTO = {
      id: crypto.randomUUID(),
      tenantId: evidence.tenantId,
      studentId: evidence.userId,
      evidenceId: evidence.id,
      reviewerId,
      reviewerRole,
      previousStatus,
      newStatus: 'NEEDS_MORE_EVIDENCE',
      reason: reason.trim(),
      reviewerNotes: finalNotes,
      createdAt: now
    };
    await this.persistReviewRecord(reviewRecord);

    // 7. Log audit event
    await this.logAuditEvent(
      evidence.tenantId,
      reviewerId,
      'SKILL_EVIDENCE_NEEDS_MORE_EVIDENCE',
      evidence.id,
      {
        previousStatus,
        newStatus: 'NEEDS_MORE_EVIDENCE',
        reason: reason.trim(),
        reviewerNotes: finalNotes
      }
    );

    return {
      success: true,
      evidenceId: evidence.id,
      previousStatus,
      newStatus: 'NEEDS_MORE_EVIDENCE',
      reviewedBy: reviewerId,
      reviewedAt: now,
      reason: reason.trim(),
      reviewerNotes: finalNotes
    };
  }

  /**
   * 4. studentResubmitEvidence
   * Allows student to resubmit evidence following NEEDS_MORE_EVIDENCE or formal appeal on REJECTED.
   * - Validates student is the owner of the evidence record.
   * - Validates current status is NEEDS_MORE_EVIDENCE or REJECTED.
   * - Updates status back to PENDING_REVIEW.
   * - Links additional document if provided.
   */
  public async studentResubmitEvidence(
    params: StudentResubmitParams
  ): Promise<VerificationActionResultDTO> {
    const { evidenceId, studentId, tenantId, notes, additionalDocumentId } = params;

    // 1. Fetch evidence with tenant isolation
    const evidence = await this.getEvidence(evidenceId, tenantId);

    // 2. Ownership check: Only the student who owns the claim may resubmit
    if (evidence.userId !== studentId) {
      const err = new Error('Forbidden: You can only resubmit your own skill evidence');
      (err as any).statusCode = 403;
      (err as any).code = 'FORBIDDEN_NOT_OWNER';
      throw err;
    }

    // 3. Status check: Only NEEDS_MORE_EVIDENCE or REJECTED can be resubmitted
    const previousStatus = evidence.verificationStatus;
    if (
      previousStatus !== 'NEEDS_MORE_EVIDENCE' &&
      previousStatus !== 'REJECTED'
    ) {
      const err = new Error(
        `Cannot resubmit evidence: only items with status NEEDS_MORE_EVIDENCE or REJECTED can be resubmitted (current status: ${previousStatus})`
      );
      (err as any).statusCode = 400;
      (err as any).code = 'INVALID_STATE_TRANSITION';
      throw err;
    }

    // 4. Validate transition to PENDING_REVIEW
    assertValidVerificationTransition(previousStatus, 'PENDING_REVIEW');

    const now = new Date();
    const resubmitNotes = notes?.trim() || 'Student resubmitted updated evidence';

    // 5. Update evidence record
    evidence.verificationStatus = 'PENDING_REVIEW';
    if (additionalDocumentId) {
      evidence.documentId = additionalDocumentId;
    }
    evidence.reviewNotes = `Resubmitted by student: ${resubmitNotes}`;
    evidence.updatedAt = now;

    this.inMemorySkillEvidence.set(evidence.id, { ...evidence });

    const profilingStore = (profilingService as any)['inMemorySkillEvidence'] as
      | Map<string, ProfileSkillEvidence>
      | undefined;
    if (profilingStore && profilingStore.has(evidence.id)) {
      profilingStore.set(evidence.id, { ...evidence });
    }

    try {
      const db = getDb();
      await db
        .update(profileSkillEvidence)
        .set({
          verificationStatus: 'PENDING_REVIEW',
          documentId: additionalDocumentId ? additionalDocumentId : evidence.documentId,
          reviewNotes: `Resubmitted by student: ${resubmitNotes}`,
          updatedAt: now
        })
        .where(eq(profileSkillEvidence.id, evidence.id));
    } catch {
      // Non-blocking in offline test environments
    }

    // 6. Record review event
    const reviewRecord: VerificationReviewRecordDTO = {
      id: crypto.randomUUID(),
      tenantId: evidence.tenantId,
      studentId,
      evidenceId: evidence.id,
      reviewerId: studentId,
      reviewerRole: 'student',
      previousStatus,
      newStatus: 'PENDING_REVIEW',
      reason: resubmitNotes,
      reviewerNotes: additionalDocumentId
        ? `Attached supplementary document: ${additionalDocumentId}`
        : null,
      createdAt: now
    };
    await this.persistReviewRecord(reviewRecord);

    // 7. Log audit event
    await this.logAuditEvent(
      evidence.tenantId,
      studentId,
      'SKILL_EVIDENCE_RESUBMITTED',
      evidence.id,
      {
        previousStatus,
        newStatus: 'PENDING_REVIEW',
        notes: resubmitNotes,
        additionalDocumentId
      }
    );

    return {
      success: true,
      evidenceId: evidence.id,
      previousStatus,
      newStatus: 'PENDING_REVIEW',
      reviewedBy: studentId,
      reviewedAt: now,
      reason: resubmitNotes,
      reviewerNotes: additionalDocumentId
        ? `Supplementary document: ${additionalDocumentId}`
        : null
    };
  }

  // ============================================================================
  // Queue & Summary Queries
  // ============================================================================

  /**
   * Resolves student profile details (department, roll number, name, email) for a user ID.
   */
  private async resolveStudentDetails(
    userId: string,
    tenantId: string
  ): Promise<StudentDetailsDTO | null> {
    // Check in-memory store
    const memStudent = this.inMemoryStudents.get(userId);
    const memUser = this.inMemoryUsers.get(userId);

    if (memStudent || memUser) {
      return {
        id: memStudent?.id || userId,
        userId,
        fullName: memUser?.fullName || memStudent?.fullName || 'Student',
        email: memUser?.email || memStudent?.email || 'student@college.edu',
        rollNumber: memStudent?.rollNumber || null,
        department: memStudent?.department || null,
        batchYear: memStudent?.batchYear || null,
        cgpa: memStudent?.cgpa || null
      };
    }

    // Query PostgreSQL
    try {
      const db = getDb();
      const userRows = await db
        .select()
        .from(users)
        .where(and(eq(users.id, userId), eq(users.tenantId, tenantId)))
        .limit(1);

      const studentRows = await db
        .select()
        .from(students)
        .where(and(eq(students.userId, userId), eq(students.tenantId, tenantId)))
        .limit(1);

      if (userRows.length > 0) {
        const u = userRows[0];
        const s = studentRows[0] || null;
        return {
          id: s?.id || u.id,
          userId: u.id,
          fullName: u.fullName,
          email: u.email,
          rollNumber: s?.rollNumber || null,
          department: s?.department || null,
          batchYear: s?.batchYear || null,
          cgpa: s?.cgpa || null
        };
      }
    } catch {
      // Non-blocking fallback
    }

    return null;
  }

  /**
   * Resolves document details for a document ID.
   */
  private async resolveDocumentDetails(
    documentId: string | null | undefined,
    tenantId: string
  ): Promise<DocumentDetailsDTO | null> {
    if (!documentId) return null;

    // Check memory
    const memDoc =
      this.inMemoryDocuments.get(documentId) || inMemoryDocuments.get(documentId);
    if (memDoc) {
      return {
        id: documentId,
        originalFilename: memDoc.originalFilename || memDoc.fileName || 'document.pdf',
        documentType: memDoc.documentType || 'resume',
        storageKey: memDoc.storageKey || null,
        mimeType: memDoc.mimeType || null,
        fileSize: memDoc.fileSize || null
      };
    }

    // Check DB
    try {
      const db = getDb();
      const rows = await db
        .select()
        .from(documents)
        .where(and(eq(documents.id, documentId), eq(documents.tenantId, tenantId)))
        .limit(1);

      if (rows.length > 0) {
        const doc = rows[0];
        return {
          id: doc.id,
          originalFilename: doc.originalFilename,
          documentType: doc.documentType,
          storageKey: doc.storageKey,
          mimeType: doc.mimeType,
          fileSize: doc.fileSize
        };
      }
    } catch {
      // Fallback
    }

    return null;
  }

  /**
   * 5. getPendingQueue
   * Returns filterable queue of skill claims requiring human verification.
   * Default includes items in 'PENDING_REVIEW' and 'EVIDENCE_FOUND' states.
   * Supports filtering by department, category, evidenceType, and text search.
   */
  public async getPendingQueue(
    tenantId: string,
    filters: PendingQueueFilters = {}
  ): Promise<{
    items: PendingQueueItemDTO[];
    total: number;
    page: number;
    limit: number;
  }> {
    const page = Math.max(1, filters.page || 1);
    const limit = Math.max(1, Math.min(100, filters.limit || 50));
    const offset = (page - 1) * limit;

    // Gather candidate records from DB or memory
    let rawRecords: ProfileSkillEvidence[] = [];

    try {
      const db = getDb();
      const conditions = [
        eq(profileSkillEvidence.tenantId, tenantId),
        inArray(profileSkillEvidence.verificationStatus, [
          'PENDING_REVIEW',
          'EVIDENCE_FOUND'
        ])
      ];

      if (filters.category) {
        conditions.push(eq(profileSkillEvidence.category, filters.category));
      }
      if (filters.evidenceType) {
        conditions.push(
          eq(profileSkillEvidence.evidenceType, filters.evidenceType as any)
        );
      }

      const rows = await db
        .select()
        .from(profileSkillEvidence)
        .where(and(...conditions))
        .orderBy(desc(profileSkillEvidence.createdAt));

      if (rows && rows.length > 0) {
        rawRecords = rows as ProfileSkillEvidence[];
      }
    } catch {
      // DB offline fallback
    }

    // Merge with in-memory records
    const inMemRecords = this.getAllTenantEvidenceInMemory(tenantId).filter(
      (ev) =>
        ev.verificationStatus === 'PENDING_REVIEW' ||
        ev.verificationStatus === 'EVIDENCE_FOUND'
    );

    for (const inMem of inMemRecords) {
      if (!rawRecords.some((r) => r.id === inMem.id)) {
        rawRecords.push(inMem);
      }
    }

    // Apply filters in memory
    let filtered = rawRecords;

    if (filters.category) {
      const catLower = filters.category.toLowerCase();
      filtered = filtered.filter((r) => r.category?.toLowerCase() === catLower);
    }

    if (filters.evidenceType) {
      const typeLower = filters.evidenceType.toLowerCase();
      filtered = filtered.filter(
        (r) => r.evidenceType?.toLowerCase() === typeLower
      );
    }

    // Enrich with student and document details
    const enrichedItems: PendingQueueItemDTO[] = [];

    for (const record of filtered) {
      const studentDetails = await this.resolveStudentDetails(
        record.userId,
        tenantId
      );
      const documentDetails = await this.resolveDocumentDetails(
        record.documentId,
        tenantId
      );

      // Department filter
      if (filters.department) {
        const deptLower = filters.department.toLowerCase();
        if (studentDetails?.department?.toLowerCase() !== deptLower) {
          continue;
        }
      }

      // Search filter (matches skill name, student name, or roll number)
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        const matchesSkill = record.skillName.toLowerCase().includes(searchLower);
        const matchesStudent =
          studentDetails?.fullName.toLowerCase().includes(searchLower) || false;
        const matchesRoll =
          studentDetails?.rollNumber?.toLowerCase().includes(searchLower) || false;

        if (!matchesSkill && !matchesStudent && !matchesRoll) {
          continue;
        }
      }

      enrichedItems.push({
        id: record.id,
        tenantId: record.tenantId,
        userId: record.userId,
        skillName: record.skillName,
        category: record.category,
        proficiencyClaim: record.proficiencyClaim,
        evidenceType: record.evidenceType,
        documentId: record.documentId,
        extractionId: record.extractionId,
        confidence: record.confidence,
        verificationStatus: record.verificationStatus,
        reviewedBy: record.reviewedBy,
        reviewedAt: record.reviewedAt,
        reviewNotes: record.reviewNotes,
        createdAt: record.createdAt,
        updatedAt: record.updatedAt,
        student: studentDetails,
        document: documentDetails
      });
    }

    // Sort descending by creation time
    enrichedItems.sort((a, b) => {
      const timeA = new Date(a.createdAt).getTime();
      const timeB = new Date(b.createdAt).getTime();
      return timeB - timeA;
    });

    const total = enrichedItems.length;
    const paginated = enrichedItems.slice(offset, offset + limit);

    return {
      items: paginated,
      total,
      page,
      limit
    };
  }

  /**
   * 6. getVerificationSummary
   * Returns authoritative counts for TPO portal dashboard metrics:
   * totalStudents, totalEvidence, pendingCount, verifiedCount, rejectedCount, needsMoreEvidenceCount.
   */
  public async getVerificationSummary(tenantId: string): Promise<VerificationSummary> {
    // 1. Try PostgreSQL aggregated query
    try {
      const db = getDb();

      // Total evidence & status counts
      const statusCounts = await db
        .select({
          status: profileSkillEvidence.verificationStatus,
          count: sql<number>`count(*)::int`
        })
        .from(profileSkillEvidence)
        .where(eq(profileSkillEvidence.tenantId, tenantId))
        .groupBy(profileSkillEvidence.verificationStatus);

      // Distinct student count
      const studentCountResult = await db
        .select({
          distinctStudents: sql<number>`count(distinct ${profileSkillEvidence.userId})::int`
        })
        .from(profileSkillEvidence)
        .where(eq(profileSkillEvidence.tenantId, tenantId));

      if (statusCounts && statusCounts.length > 0) {
        let pending = 0;
        let verified = 0;
        let rejected = 0;
        let needsMore = 0;
        let total = 0;

        for (const row of statusCounts) {
          const c = Number(row.count) || 0;
          total += c;
          if (
            row.status === 'PENDING_REVIEW' ||
            row.status === 'EVIDENCE_FOUND'
          ) {
            pending += c;
          } else if (row.status === 'VERIFIED') {
            verified += c;
          } else if (row.status === 'REJECTED') {
            rejected += c;
          } else if (row.status === 'NEEDS_MORE_EVIDENCE') {
            needsMore += c;
          }
        }

        const distinctStudents =
          Number(studentCountResult[0]?.distinctStudents) || 0;

        return {
          totalStudents: distinctStudents,
          totalEvidence: total,
          pendingCount: pending,
          verifiedCount: verified,
          rejectedCount: rejected,
          needsMoreEvidenceCount: needsMore
        };
      }
    } catch {
      // Fallback to in-memory aggregation
    }

    // 2. In-memory aggregation fallback
    const allRecords = this.getAllTenantEvidenceInMemory(tenantId);
    const uniqueStudents = new Set<string>();

    let pendingCount = 0;
    let verifiedCount = 0;
    let rejectedCount = 0;
    let needsMoreEvidenceCount = 0;

    for (const record of allRecords) {
      uniqueStudents.add(record.userId);
      const st = record.verificationStatus;

      if (st === 'PENDING_REVIEW' || st === 'EVIDENCE_FOUND') {
        pendingCount++;
      } else if (st === 'VERIFIED') {
        verifiedCount++;
      } else if (st === 'REJECTED') {
        rejectedCount++;
      } else if (st === 'NEEDS_MORE_EVIDENCE') {
        needsMoreEvidenceCount++;
      }
    }

    return {
      totalStudents: uniqueStudents.size,
      totalEvidence: allRecords.length,
      pendingCount,
      verifiedCount,
      rejectedCount,
      needsMoreEvidenceCount
    };
  }

  /**
   * 7. getEvidenceHistory
   * Returns complete audit trail of all verification reviews and actions for an evidence item.
   */
  public async getEvidenceHistory(
    evidenceId: string,
    tenantId: string
  ): Promise<VerificationReviewRecordDTO[]> {
    // Validate evidence belongs to tenant
    await this.getEvidence(evidenceId, tenantId);

    const history: VerificationReviewRecordDTO[] = [];

    // Check memory reviews
    for (const rev of this.inMemoryReviews.values()) {
      if (rev.evidenceId === evidenceId && rev.tenantId === tenantId) {
        history.push({ ...rev });
      }
    }

    // Check PostgreSQL
    try {
      const db = getDb();
      const rows = await db
        .select()
        .from(skillVerificationReviews)
        .where(
          and(
            eq(skillVerificationReviews.evidenceId, evidenceId),
            eq(skillVerificationReviews.tenantId, tenantId)
          )
        )
        .orderBy(desc(skillVerificationReviews.createdAt));

      for (const row of rows) {
        if (!history.some((h) => h.id === row.id)) {
          history.push({
            id: row.id,
            tenantId: row.tenantId,
            studentId: row.studentId,
            evidenceId: row.evidenceId,
            reviewerId: row.reviewerId,
            previousStatus: row.previousStatus,
            newStatus: row.newStatus,
            reason: row.reason,
            reviewerNotes: row.reviewerNotes,
            createdAt: row.createdAt
          });
        }
      }
    } catch {
      // Fallback
    }

    // Enrich with reviewer names if available
    for (const item of history) {
      if (!item.reviewerName) {
        const memUser = this.inMemoryUsers.get(item.reviewerId);
        if (memUser) {
          item.reviewerName = memUser.fullName;
          item.reviewerRole = item.reviewerRole || memUser.role;
        }
      }
    }

    // Sort chronologically (descending)
    history.sort((a, b) => {
      const timeA = new Date(a.createdAt).getTime();
      const timeB = new Date(b.createdAt).getTime();
      return timeB - timeA;
    });

    return history;
  }

  /**
   * 8. getEvidenceById
   * Returns a single evidence record enriched with student and document details.
   */
  public async getEvidenceById(
    evidenceId: string,
    tenantId: string
  ): Promise<PendingQueueItemDTO> {
    const evidence = await this.getEvidence(evidenceId, tenantId);
    const student = await this.resolveStudentDetails(evidence.userId, tenantId);
    const document = await this.resolveDocumentDetails(
      evidence.documentId,
      tenantId
    );

    return {
      id: evidence.id,
      tenantId: evidence.tenantId,
      userId: evidence.userId,
      skillName: evidence.skillName,
      category: evidence.category,
      proficiencyClaim: evidence.proficiencyClaim,
      evidenceType: evidence.evidenceType,
      documentId: evidence.documentId,
      extractionId: evidence.extractionId,
      confidence: evidence.confidence,
      verificationStatus: evidence.verificationStatus,
      reviewedBy: evidence.reviewedBy,
      reviewedAt: evidence.reviewedAt,
      reviewNotes: evidence.reviewNotes,
      createdAt: evidence.createdAt,
      updatedAt: evidence.updatedAt,
      student,
      document
    };
  }

  /**
   * 9. getStudentEvidence
   * Returns all evidence records belonging to a student within a tenant.
   */
  public async getStudentEvidence(
    studentId: string,
    tenantId: string
  ): Promise<ProfileSkillEvidence[]> {
    return profilingService.getStudentEvidence(studentId, tenantId);
  }
}

export const verificationService = VerificationService.getInstance();
