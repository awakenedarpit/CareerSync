/**
 * CarrerSync AI Student Profiling Service
 * Phase 09 — Hybrid AI Student Profiling & Resilient Evidence Architecture
 *
 * Implements end-to-end document profiling, evidence extraction,
 * student approval workflows, review audit events, and immutable versioning.
 *
 * Core Principles Enforced:
 * 1. "Resume mention is not verification" — extracted skills receive PENDING_REVIEW or EVIDENCE_FOUND.
 *    Never auto-VERIFIED without explicit human reviewer certification.
 * 2. Zero-cost execution — leverages Google Gemini Free Tier with automatic fallback to RuleBasedAIProvider.
 * 3. Privacy by design — local PII scrubbing executed prior to external AI transmission.
 * 4. Multi-tenant isolation & offline test resilience with in-memory store fallbacks.
 */

import crypto from 'crypto';
import { eq, and, desc, sql } from 'drizzle-orm';
import { getDb } from '../db/client';
import {
  profileExtractions,
  profileSkillEvidence,
  profileReviewEvents,
  profileVersions,
  documents,
  type ProfileExtraction,
  type ProfileSkillEvidence,
  type ProfileReviewEvent,
  type ProfileVersion,
  type ExtractionStatus,
  type ProfileEvidenceType,
  type ProfileVerificationStatus
} from '../db/schema';
import { jobQueueService } from './job-queue.service';
import { ingestionService } from '../ingestion/ingestion.service';
import { AIFactory } from '../ai/ai.factory';
import { scrubPII } from '../ai/utils/pii-filter';
import { inMemoryDocuments } from '../routes/file.routes';
import type { ExtractedSkill, ExtractionWarning, ProfilingExtractionResult } from '../ai/ai.types';

export class ProfilingService {
  private static instance: ProfilingService | null = null;

  // In-memory fallback stores for offline testing
  private inMemoryExtractions = new Map<string, ProfileExtraction>();
  private inMemorySkillEvidence = new Map<string, ProfileSkillEvidence>();
  private inMemoryReviewEvents = new Map<string, ProfileReviewEvent>();
  private inMemoryVersions = new Map<string, ProfileVersion>();

  public static getInstance(): ProfilingService {
    if (!this.instance) {
      this.instance = new ProfilingService();
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
    this.inMemoryExtractions.clear();
    this.inMemorySkillEvidence.clear();
    this.inMemoryReviewEvents.clear();
    this.inMemoryVersions.clear();
  }

  constructor() {
    // Register processor with job queue service
    jobQueueService.registerProcessor(async (job) => {
      const result = await this.analyzeDocumentJob(job.id);
      return result as Record<string, unknown>;
    });
  }

  /**
   * Finds a document record from either in-memory registry or PostgreSQL.
   */
  private async findDocument(documentId: string): Promise<any | null> {
    const memDoc = inMemoryDocuments.get(documentId);
    if (memDoc) return memDoc;

    try {
      const db = getDb();
      const rows = await db.select().from(documents).where(eq(documents.id, documentId)).limit(1);
      if (rows && rows.length > 0) {
        return rows[0];
      }
    } catch {
      // DB offline fallback
    }

    return null;
  }

  /**
   * Processes a document analysis background job.
   * Downloads document from storage, ingests text, sanitizes PII, dispatches to AI,
   * persists proposed extraction, and logs completion.
   */
  public async analyzeDocumentJob(jobId: string): Promise<{ extractionId: string; [key: string]: any }> {
    const job = await jobQueueService.getJob(jobId);
    if (!job) {
      throw new Error(`Job ${jobId} not found`);
    }

    const doc = await this.findDocument(job.documentId);
    if (!doc) {
      throw new Error(`Document ${job.documentId} not found for job ${jobId}`);
    }

    // 1. Ingest document via IngestionService
    const ingestionResult = await ingestionService.ingestFromStorage(doc.storageKey, {
      mimeType: doc.mimeType,
      filename: doc.originalFilename
    });

    const extractionId = crypto.randomUUID();
    const now = new Date();

    // 2. Check if manual review is required (e.g. Scanned image or unreadable document)
    if (ingestionResult.requiresManualReview || !ingestionResult.text || ingestionResult.text.trim().length === 0) {
      const warningMessage =
        ingestionResult.warning ||
        'Document requires manual human review: no readable text layer detected.';

      const manualExtraction: ProfileExtraction = {
        id: extractionId,
        tenantId: job.tenantId,
        documentId: job.documentId,
        userId: job.userId,
        rawTextPreview: ingestionResult.text ? ingestionResult.text.slice(0, 500) : '',
        sanitizedText: '',
        extractedSkills: [],
        extractedProjects: [],
        extractedCertifications: [],
        warnings: [
          {
            code: 'MANUAL_REVIEW_REQUIRED',
            message: warningMessage,
            severity: 'high'
          }
        ],
        overallConfidence: '0.00',
        providerUsed: 'manual-review',
        status: 'PENDING_REVIEW' as ExtractionStatus,
        createdAt: now,
        updatedAt: now
      };

      this.inMemoryExtractions.set(extractionId, manualExtraction);

      try {
        const db = getDb();
        await db.insert(profileExtractions).values(manualExtraction as any);
      } catch {
        // DB offline fallback
      }

      return {
        extractionId,
        manualReviewRequired: true,
        warning: warningMessage,
        skillsCount: 0
      };
    }

    // 3. Sensitive Data Scrubber (PII Redaction)
    const piiScrubResult = scrubPII(ingestionResult.text);

    // 4. Dispatch to Hybrid AI Service (Gemini with Rule-Based Fallback)
    const aiService = AIFactory.getAIService();
    const extractionResult: ProfilingExtractionResult = await aiService.analyzeDocument(
      piiScrubResult.sanitizedText,
      {
        documentType: doc.documentType,
        documentId: doc.id
      }
    );

    // 5. Calculate calibrated overall confidence
    let overallConfidence = 0.65;
    if (extractionResult.skills && extractionResult.skills.length > 0) {
      const sum = extractionResult.skills.reduce((acc, s) => acc + (s.confidence || 0.6), 0);
      overallConfidence = sum / extractionResult.skills.length;
    }
    // Clamp to [0.10, 0.99]
    overallConfidence = Math.min(0.99, Math.max(0.1, overallConfidence));

    // Combine warnings
    const warnings: ExtractionWarning[] = [...extractionResult.warnings];
    if (piiScrubResult.redactedCount > 0) {
      warnings.push({
        code: 'PII_SCRUBBED',
        message: `Redacted ${piiScrubResult.redactedCount} sensitive PII entities before AI processing.`,
        severity: 'low'
      });
    }

    // 6. Create Profile Extraction Record
    const extractionRecord: ProfileExtraction = {
      id: extractionId,
      tenantId: job.tenantId,
      documentId: job.documentId,
      userId: job.userId,
      rawTextPreview: ingestionResult.text.slice(0, 500),
      sanitizedText: piiScrubResult.sanitizedText.slice(0, 2000),
      extractedSkills: extractionResult.skills,
      extractedProjects: extractionResult.projects,
      extractedCertifications: extractionResult.certifications,
      warnings,
      overallConfidence: overallConfidence.toFixed(2),
      providerUsed: extractionResult.metadata?.provider || 'rule-based',
      status: 'PENDING_REVIEW' as ExtractionStatus,
      createdAt: now,
      updatedAt: now
    };

    this.inMemoryExtractions.set(extractionId, extractionRecord);

    try {
      const db = getDb();
      await db.insert(profileExtractions).values(extractionRecord as any);
    } catch {
      // DB offline fallback
    }

    return {
      extractionId,
      manualReviewRequired: false,
      skillsCount: extractionResult.skills.length,
      providerUsed: extractionRecord.providerUsed
    };
  }

  /**
   * Retrieves an extraction record by ID, with optional tenant validation.
   */
  public async getExtraction(extractionId: string, tenantId?: string): Promise<ProfileExtraction | null> {
    const memExt = this.inMemoryExtractions.get(extractionId);
    if (memExt) {
      if (tenantId && memExt.tenantId !== tenantId) {
        return null;
      }
      return memExt;
    }

    try {
      const db = getDb();
      const query = tenantId
        ? and(eq(profileExtractions.id, extractionId), eq(profileExtractions.tenantId, tenantId))
        : eq(profileExtractions.id, extractionId);

      const rows = await db.select().from(profileExtractions).where(query).limit(1);
      if (rows.length > 0) {
        const ext = rows[0] as ProfileExtraction;
        this.inMemoryExtractions.set(ext.id, ext);
        return ext;
      }
    } catch {
      // DB offline fallback
    }

    return null;
  }

  /**
   * Approves extracted skills, converting them into profileSkillEvidence rows.
   * Guarantees that skills receive 'EVIDENCE_FOUND' or 'PENDING_REVIEW',
   * and are NEVER auto-marked as 'VERIFIED' without human reviewer certification.
   * Logs profileReviewEvents and saves an immutable profileVersion snapshot.
   */
  public async approveExtraction(
    extractionId: string,
    userId: string,
    tenantId: string,
    approvedSkillNames?: string[],
    reviewerRole: string = 'student'
  ): Promise<{
    success: boolean;
    extractionId: string;
    approvedCount: number;
    status: ExtractionStatus;
    versionNumber: number;
  }> {
    const extraction = await this.getExtraction(extractionId, tenantId);
    if (!extraction) {
      throw new Error(`Profile extraction not found: ${extractionId}`);
    }

    const allSkills = (extraction.extractedSkills as ExtractedSkill[]) || [];
    const skillsToApprove = approvedSkillNames && approvedSkillNames.length > 0
      ? allSkills.filter((s) => approvedSkillNames.includes(s.name))
      : allSkills;

    const now = new Date();
    const isFullApproval = skillsToApprove.length === allSkills.length;
    const newStatus: ExtractionStatus = isFullApproval ? 'APPROVED' : 'PARTIALLY_APPROVED';

    // 1. Convert approved skills to profileSkillEvidence rows
    for (const skill of skillsToApprove) {
      const evidenceId = crypto.randomUUID();

      // Determine evidence type mapping
      let evidenceType: ProfileEvidenceType = 'RESUME';
      const rawEvidenceType = skill.evidence?.[0]?.evidenceType?.toUpperCase();
      if (rawEvidenceType === 'PROJECT') evidenceType = 'PROJECT';
      else if (rawEvidenceType === 'CERTIFICATE' || rawEvidenceType === 'CERTIFICATION') evidenceType = 'CERTIFICATE';
      else if (rawEvidenceType === 'ASSESSMENT') evidenceType = 'ASSESSMENT';
      else if (rawEvidenceType === 'SELF_DECLARED') evidenceType = 'SELF_DECLARED';

      // Enforce strict verificationStatus rule:
      // Project mentions -> 'EVIDENCE_FOUND'
      // Resume mentions -> 'PENDING_REVIEW'
      // Certificate mentions -> 'PENDING_REVIEW'
      // NEVER auto-VERIFIED!
      let verificationStatus: ProfileVerificationStatus = 'PENDING_REVIEW';
      if (evidenceType === 'PROJECT') {
        verificationStatus = 'EVIDENCE_FOUND';
      } else if (evidenceType === 'RESUME') {
        verificationStatus = 'PENDING_REVIEW';
      } else if (evidenceType === 'CERTIFICATE') {
        verificationStatus = 'PENDING_REVIEW';
      } else if (evidenceType === 'SELF_DECLARED') {
        verificationStatus = 'SELF_DECLARED';
      }

      const evidenceRow: ProfileSkillEvidence = {
        id: evidenceId,
        tenantId: extraction.tenantId,
        userId: extraction.userId,
        skillName: skill.name,
        category: skill.category || 'tools',
        proficiencyClaim: (skill.proficiencyClaim as string) || 'intermediate',
        evidenceType,
        documentId: extraction.documentId,
        extractionId: extraction.id,
        confidence: (skill.confidence ?? 0.65).toFixed(2),
        verificationStatus,
        reviewedBy: reviewerRole !== 'student' ? userId : null,
        reviewedAt: reviewerRole !== 'student' ? now : null,
        reviewNotes: `Extracted via ${extraction.providerUsed}. Verification status: ${verificationStatus}.`,
        createdAt: now,
        updatedAt: now
      };

      this.inMemorySkillEvidence.set(evidenceId, evidenceRow);

      try {
        const db = getDb();
        await db.insert(profileSkillEvidence).values(evidenceRow as any);
      } catch {
        // DB offline fallback
      }
    }

    // 2. Log review event in profileReviewEvents
    const eventId = crypto.randomUUID();
    const reviewEvent: ProfileReviewEvent = {
      id: eventId,
      tenantId: extraction.tenantId,
      userId: extraction.userId,
      extractionId: extraction.id,
      skillId: null,
      action: 'APPROVE',
      reviewerId: userId,
      reviewerRole,
      previousState: { status: extraction.status },
      newState: {
        status: newStatus,
        approvedSkillCount: skillsToApprove.length,
        approvedSkills: skillsToApprove.map((s) => s.name)
      },
      comment: `Approved ${skillsToApprove.length} skills from extraction.`,
      createdAt: now
    };

    this.inMemoryReviewEvents.set(eventId, reviewEvent);

    try {
      const db = getDb();
      await db.insert(profileReviewEvents).values(reviewEvent as any);
    } catch {
      // DB offline fallback
    }

    // 3. Update profileExtractions status
    extraction.status = newStatus;
    extraction.updatedAt = now;
    this.inMemoryExtractions.set(extraction.id, extraction);

    try {
      const db = getDb();
      await db
        .update(profileExtractions)
        .set({ status: newStatus, updatedAt: now })
        .where(eq(profileExtractions.id, extraction.id));
    } catch {
      // DB offline fallback
    }

    // 4. Save immutable snapshot in profileVersions
    let nextVersion = 1;
    for (const v of this.inMemoryVersions.values()) {
      if (v.userId === extraction.userId && v.tenantId === extraction.tenantId) {
        if (v.versionNumber >= nextVersion) {
          nextVersion = v.versionNumber + 1;
        }
      }
    }

    try {
      const db = getDb();
      const existingVersions = await db
        .select({ versionNumber: profileVersions.versionNumber })
        .from(profileVersions)
        .where(
          and(
            eq(profileVersions.tenantId, extraction.tenantId),
            eq(profileVersions.userId, extraction.userId)
          )
        )
        .orderBy(desc(profileVersions.versionNumber))
        .limit(1);

      if (existingVersions.length > 0 && existingVersions[0].versionNumber >= nextVersion) {
        nextVersion = existingVersions[0].versionNumber + 1;
      }
    } catch {
      // DB offline fallback
    }

    const versionId = crypto.randomUUID();
    const versionRecord: ProfileVersion = {
      id: versionId,
      tenantId: extraction.tenantId,
      userId: extraction.userId,
      versionNumber: nextVersion,
      snapshot: {
        extractionId: extraction.id,
        approvedSkills: skillsToApprove,
        approvedAt: now.toISOString(),
        reviewerId: userId,
        reviewerRole
      },
      triggerEvent: 'EXTRACTION_APPROVED',
      createdBy: userId,
      createdAt: now
    };

    this.inMemoryVersions.set(versionId, versionRecord);

    try {
      const db = getDb();
      await db.insert(profileVersions).values(versionRecord as any);
    } catch {
      // DB offline fallback
    }

    return {
      success: true,
      extractionId: extraction.id,
      approvedCount: skillsToApprove.length,
      status: newStatus,
      versionNumber: nextVersion
    };
  }

  /**
   * Rejects an extraction, marking it REJECTED and logging a review event.
   */
  public async rejectExtraction(
    extractionId: string,
    userId: string,
    tenantId: string,
    rejectedSkillNames?: string[],
    reason: string = 'User rejected proposed extraction',
    reviewerRole: string = 'student'
  ): Promise<{
    success: boolean;
    extractionId: string;
    status: ExtractionStatus;
    reason: string;
  }> {
    const extraction = await this.getExtraction(extractionId, tenantId);
    if (!extraction) {
      throw new Error(`Profile extraction not found: ${extractionId}`);
    }

    const now = new Date();
    extraction.status = 'REJECTED';
    extraction.updatedAt = now;
    this.inMemoryExtractions.set(extraction.id, extraction);

    try {
      const db = getDb();
      await db
        .update(profileExtractions)
        .set({ status: 'REJECTED', updatedAt: now })
        .where(eq(profileExtractions.id, extraction.id));
    } catch {
      // DB offline fallback
    }

    // Log review event
    const eventId = crypto.randomUUID();
    const reviewEvent: ProfileReviewEvent = {
      id: eventId,
      tenantId: extraction.tenantId,
      userId: extraction.userId,
      extractionId: extraction.id,
      skillId: null,
      action: 'REJECT',
      reviewerId: userId,
      reviewerRole,
      previousState: { status: extraction.status },
      newState: { status: 'REJECTED', rejectedSkillNames: rejectedSkillNames || [] },
      comment: reason,
      createdAt: now
    };

    this.inMemoryReviewEvents.set(eventId, reviewEvent);

    try {
      const db = getDb();
      await db.insert(profileReviewEvents).values(reviewEvent as any);
    } catch {
      // DB offline fallback
    }

    return {
      success: true,
      extractionId: extraction.id,
      status: 'REJECTED',
      reason
    };
  }

  /**
   * Returns unapproved / pending extractions for a student within a tenant.
   */
  public async getStudentProposedProfile(
    studentId: string,
    tenantId: string
  ): Promise<ProfileExtraction[]> {
    const results: ProfileExtraction[] = [];

    // Check in-memory store
    for (const ext of this.inMemoryExtractions.values()) {
      if (
        ext.userId === studentId &&
        ext.tenantId === tenantId &&
        ext.status === 'PENDING_REVIEW'
      ) {
        results.push(ext);
      }
    }

    // Check PostgreSQL
    try {
      const db = getDb();
      const rows = await db
        .select()
        .from(profileExtractions)
        .where(
          and(
            eq(profileExtractions.tenantId, tenantId),
            eq(profileExtractions.userId, studentId),
            eq(profileExtractions.status, 'PENDING_REVIEW')
          )
        )
        .orderBy(desc(profileExtractions.createdAt));

      for (const row of rows) {
        const ext = row as ProfileExtraction;
        if (!results.some((r) => r.id === ext.id)) {
          results.push(ext);
          this.inMemoryExtractions.set(ext.id, ext);
        }
      }
    } catch {
      // DB offline fallback
    }

    return results;
  }

  /**
   * Returns all skill evidence records for a student within a tenant.
   */
  public async getStudentEvidence(
    studentId: string,
    tenantId: string
  ): Promise<ProfileSkillEvidence[]> {
    const results: ProfileSkillEvidence[] = [];

    // Check in-memory store
    for (const ev of this.inMemorySkillEvidence.values()) {
      if (ev.userId === studentId && ev.tenantId === tenantId) {
        results.push(ev);
      }
    }

    // Check PostgreSQL
    try {
      const db = getDb();
      const rows = await db
        .select()
        .from(profileSkillEvidence)
        .where(
          and(
            eq(profileSkillEvidence.tenantId, tenantId),
            eq(profileSkillEvidence.userId, studentId)
          )
        )
        .orderBy(desc(profileSkillEvidence.createdAt));

      for (const row of rows) {
        const ev = row as ProfileSkillEvidence;
        if (!results.some((r) => r.id === ev.id)) {
          results.push(ev);
          this.inMemorySkillEvidence.set(ev.id, ev);
        }
      }
    } catch {
      // DB offline fallback
    }

    return results;
  }
}

export const profilingService = ProfilingService.getInstance();
