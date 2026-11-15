/**
 * CarrerSync Phase 14 — Diagnostic Student Support & TPO Intervention Workflow Service
 *
 * Implements:
 * 1. Diagnostic support identification across 7 standardized categories:
 *    - SKILL_DEVELOPMENT
 *    - ASSESSMENT_PRACTICE
 *    - PROJECT_GUIDANCE
 *    - PROFILE_COMPLETION
 *    - INTERVIEW_PREPARATION
 *    - ADDITIONAL_REVIEW
 *    - INSUFFICIENT_DATA
 * 2. Strict non-stigmatizing supportive language:
 *    - Constructs affirmative growth pathways and skill scaffolding.
 *    - Strictly eliminates deficit labels ("failing", "weak student", "unemployable").
 * 3. Formal TPO review & approval workflow:
 *    - IDENTIFIED -> UNDER_TPO_REVIEW -> APPROVED -> IN_PROGRESS -> RESOLVED / DISMISSED
 *    - Complete immutable audit trail capturing status transitions, reviewer IDs, notes, and timestamps.
 */

import { randomUUID as uuidv4 } from 'crypto';
import {
  SupportCategory,
  InterventionStatus,
  StudentSupportItem,
  AnalyticsQueryFilters
} from './analytics.types';
import { readinessAnalyticsService } from './readiness-analytics.service';

export class StudentSupportService {
  private static instance: StudentSupportService;

  // In-memory store: id -> StudentSupportItem
  private supportStore = new Map<string, StudentSupportItem>();

  private constructor() {
    this.seedDefaultSupportItems();
  }

  public static getInstance(): StudentSupportService {
    if (!StudentSupportService.instance) {
      StudentSupportService.instance = new StudentSupportService();
    }
    return StudentSupportService.instance;
  }

  /**
   * Lists diagnostic support items with optional filtering.
   */
  public listSupportItems(tenantId: string, filters?: AnalyticsQueryFilters): StudentSupportItem[] {
    const items: StudentSupportItem[] = [];

    const tenantRecords = Array.from(this.supportStore.values()).filter((r) => r.tenantId === tenantId);
    const candidateList =
      tenantRecords.length > 0
        ? tenantRecords
        : Array.from(this.supportStore.values()).filter((r) => r.tenantId === 'default');

    for (const item of candidateList) {
      if (filters?.department && item.department.toLowerCase() !== filters.department.toLowerCase()) continue;
      if (filters?.batchYear && item.batchYear !== filters.batchYear) continue;
      if (filters?.supportCategory && item.category !== filters.supportCategory) continue;
      if (filters?.interventionStatus && item.status !== filters.interventionStatus) continue;
      items.push(item);
    }

    return items;
  }

  /**
   * Retrieves single support item by ID.
   */
  public getSupportItemById(id: string): StudentSupportItem | null {
    return this.supportStore.get(id) || null;
  }

  /**
   * Creates a new student support item with initial IDENTIFIED status.
   */
  public createSupportItem(params: {
    studentId: string;
    studentName: string;
    tenantId: string;
    department: string;
    batchYear: string;
    targetRole: string;
    category: SupportCategory;
    title: string;
    nonStigmatizingDescription: string;
    identifiedGaps: string[];
    recommendedActions: string[];
    priority?: 'HIGH' | 'MEDIUM' | 'LOW';
    createdBy?: string;
  }): StudentSupportItem {
    const id = `supp-${uuidv4().substring(0, 8)}`;
    const now = new Date().toISOString();

    const item: StudentSupportItem = {
      id,
      studentId: params.studentId,
      studentName: params.studentName,
      tenantId: params.tenantId,
      department: params.department,
      batchYear: params.batchYear,
      targetRole: params.targetRole,
      category: params.category,
      title: params.title,
      nonStigmatizingDescription: params.nonStigmatizingDescription,
      identifiedGaps: params.identifiedGaps,
      recommendedActions: params.recommendedActions,
      status: 'IDENTIFIED',
      priority: params.priority || 'MEDIUM',
      auditTrail: [
        {
          fromStatus: 'IDENTIFIED',
          toStatus: 'IDENTIFIED',
          changedBy: params.createdBy || 'System Analytics Engine',
          notes: 'Support pathway diagnostic initialized with non-stigmatizing scaffolding.',
          timestamp: now
        }
      ],
      createdAt: now,
      updatedAt: now
    };

    this.supportStore.set(id, item);
    return item;
  }

  /**
   * Reviews or updates the status of a student support item (TPO review workflow).
   */
  public reviewSupportItem(
    id: string,
    params: {
      status: InterventionStatus;
      reviewerId: string;
      notes?: string;
    }
  ): StudentSupportItem | null {
    const item = this.supportStore.get(id);
    if (!item) return null;

    const previousStatus = item.status;
    const now = new Date().toISOString();

    item.status = params.status;
    item.tpoReviewNotes = params.notes || item.tpoReviewNotes;
    item.reviewedBy = params.reviewerId;
    item.reviewedAt = now;
    item.updatedAt = now;

    item.auditTrail.push({
      fromStatus: previousStatus,
      toStatus: params.status,
      changedBy: params.reviewerId,
      notes: params.notes,
      timestamp: now
    });

    this.supportStore.set(id, item);
    return item;
  }

  /**
   * Diagnoses and synthesizes support items directly from a student's readiness record.
   */
  public diagnoseStudentSupport(studentId: string, tenantId: string): StudentSupportItem[] {
    const readiness = readinessAnalyticsService.getStudentReadiness(studentId, tenantId);
    if (!readiness) return [];

    const generatedItems: StudentSupportItem[] = [];

    // Case 1: Insufficient Data
    if (readiness.readinessTier === 'INSUFFICIENT_DATA') {
      const item = this.createSupportItem({
        studentId: readiness.studentId,
        studentName: readiness.studentName,
        tenantId: readiness.tenantId,
        department: readiness.department,
        batchYear: readiness.batchYear,
        targetRole: readiness.targetRole,
        category: 'INSUFFICIENT_DATA',
        title: 'Diagnostic Profile Completion Opportunity',
        nonStigmatizingDescription:
          'Baseline profile evidence is currently unobserved. Completing skill assessments and linking projects will unlock accurate placement readiness insights.',
        identifiedGaps: readiness.missingDimensions.map((d) => `Unobserved dimension: ${d}`),
        recommendedActions: [
          'Schedule diagnostic aptitude assessment session.',
          'Upload technical capstone project artifacts.'
        ],
        priority: 'MEDIUM'
      });
      generatedItems.push(item);
      return generatedItems;
    }

    // Case 2: Assessment Practice
    const assessDim = readiness.dimensions.assessmentScores;
    if (assessDim.isObserved && assessDim.status === 'NEEDS_ATTENTION') {
      const item = this.createSupportItem({
        studentId: readiness.studentId,
        studentName: readiness.studentName,
        tenantId: readiness.tenantId,
        department: readiness.department,
        batchYear: readiness.batchYear,
        targetRole: readiness.targetRole,
        category: 'ASSESSMENT_PRACTICE',
        title: 'Targeted Aptitude & Coding Scaffolding',
        nonStigmatizingDescription:
          'Opportunity to enhance assessment confidence through guided practice sets and timed coding problem simulations.',
        identifiedGaps: ['Timed problem-solving accuracy', 'Core algorithmic edge-case coverage'],
        recommendedActions: [
          'Enroll in 30-minute daily speed aptitude sprint.',
          'Complete guided data structures practice module.'
        ],
        priority: 'HIGH'
      });
      generatedItems.push(item);
    }

    // Case 3: Interview Preparation
    const interviewDim = readiness.dimensions.interviewPractice;
    if (!interviewDim.isObserved || interviewDim.status === 'NEEDS_ATTENTION') {
      const item = this.createSupportItem({
        studentId: readiness.studentId,
        studentName: readiness.studentName,
        tenantId: readiness.tenantId,
        department: readiness.department,
        batchYear: readiness.batchYear,
        targetRole: readiness.targetRole,
        category: 'INTERVIEW_PREPARATION',
        title: 'Behavioral & Technical Interview Simulation Clinic',
        nonStigmatizingDescription:
          'Structured conversational practice designed to help articulate project experiences and system architecture reasoning.',
        identifiedGaps: ['Mock interview experience count', 'Technical communication articulation'],
        recommendedActions: [
          'Book mock interview session with AI simulated recruiter.',
          'Review STAR-format responses for recent capstone project.'
        ],
        priority: 'MEDIUM'
      });
      generatedItems.push(item);
    }

    // Case 4: Project Guidance
    const evidenceDim = readiness.dimensions.evidenceCoverage;
    if (evidenceDim.isObserved && evidenceDim.status === 'NEEDS_ATTENTION') {
      const item = this.createSupportItem({
        studentId: readiness.studentId,
        studentName: readiness.studentName,
        tenantId: readiness.tenantId,
        department: readiness.department,
        batchYear: readiness.batchYear,
        targetRole: readiness.targetRole,
        category: 'PROJECT_GUIDANCE',
        title: 'Portfolio & Artifact Demonstration Mentorship',
        nonStigmatizingDescription:
          'Mentorship pathway to curate deployable GitHub repositories and documented architecture diagrams that substantiate claimed skills.',
        identifiedGaps: ['Public repository documentation', 'Live deployment verification'],
        recommendedActions: [
          'Submit project README with architecture walkthrough.',
          'Deploy working web application demo.'
        ],
        priority: 'MEDIUM'
      });
      generatedItems.push(item);
    }

    return generatedItems;
  }

  // ---------------------------------------------------------------------------
  // Default Seed Data
  // ---------------------------------------------------------------------------

  private seedDefaultSupportItems() {
    const seeds = [
      {
        id: 'supp-001',
        studentId: 'std-ece-01',
        studentName: 'Neha Nair',
        tenantId: 'default',
        department: 'ECE',
        batchYear: '2026',
        targetRole: 'Embedded Systems Engineer',
        category: 'ASSESSMENT_PRACTICE' as SupportCategory,
        title: 'Embedded C & RTOS Assessment Practice Track',
        nonStigmatizingDescription:
          'Recommended practice modules to reinforce microcontroller memory management and interrupt handling prior to core electronics drives.',
        identifiedGaps: ['RTOS concurrency practice', 'Pointer arithmetic edge cases'],
        recommendedActions: [
          'Complete Phase 12 Embedded C mock assessments.',
          'Attend faculty-led firmware debugging lab.'
        ],
        status: 'UNDER_TPO_REVIEW' as InterventionStatus,
        priority: 'HIGH' as const,
        tpoReviewNotes: 'Scheduled review with Prof. Ramanathan for lab assignment credit.'
      },
      {
        id: 'supp-002',
        studentId: 'std-mech-01',
        studentName: 'Aditya Patil',
        tenantId: 'default',
        department: 'Mechanical',
        batchYear: '2026',
        targetRole: 'Design Engineer',
        category: 'SKILL_DEVELOPMENT' as SupportCategory,
        title: 'Advanced SolidWorks & FEA Simulation Growth Pathway',
        nonStigmatizingDescription:
          'Specialized pathway to build competency in finite element analysis and structural modeling matching current automotive requirements.',
        identifiedGaps: ['FEA boundary conditions', 'Thermal simulation workflows'],
        recommendedActions: [
          'Engage with SolidWorks stress analysis tutorial modules.',
          'Submit 3D CAD suspension assembly project for verification.'
        ],
        status: 'APPROVED' as InterventionStatus,
        priority: 'MEDIUM' as const,
        tpoReviewNotes: 'Approved for institutional workshop sponsorship.'
      },
      {
        id: 'supp-003',
        studentId: 'std-civil-01',
        studentName: 'Pooja Verma',
        tenantId: 'default',
        department: 'Civil',
        batchYear: '2026',
        targetRole: 'Structural Engineer',
        category: 'INSUFFICIENT_DATA' as SupportCategory,
        title: 'Diagnostic Readiness Portfolio Onboarding',
        nonStigmatizingDescription:
          'Initial profile onboarding to document project work and complete the baseline aptitude mock assessment.',
        identifiedGaps: ['Unobserved diagnostic aptitude score', 'Portfolio documentation pending'],
        recommendedActions: [
          'Schedule first diagnostic assessment test.',
          'Upload AutoCAD / STAAD.Pro project models.'
        ],
        status: 'IDENTIFIED' as InterventionStatus,
        priority: 'MEDIUM' as const
      },
      {
        id: 'supp-004',
        studentId: 'std-cse-02',
        studentName: 'Rhea Sen',
        tenantId: 'default',
        department: 'CSE',
        batchYear: '2026',
        targetRole: 'Backend Engineer',
        category: 'INTERVIEW_PREPARATION' as SupportCategory,
        title: 'System Design Interview Simulation Clinic',
        nonStigmatizingDescription:
          'Opportunity for interview simulation focused on database sharding, caching strategies, and REST API design discussions.',
        identifiedGaps: ['System design trade-off articulation', 'Distributed caching nuances'],
        recommendedActions: [
          'Participate in simulated technical round with AI interview agent.',
          'Read high-scalability architecture case studies.'
        ],
        status: 'IN_PROGRESS' as InterventionStatus,
        priority: 'HIGH' as const,
        tpoReviewNotes: 'Student completed session 1; session 2 scheduled for next Tuesday.'
      }
    ];

    const now = new Date().toISOString();
    for (const seed of seeds) {
      this.supportStore.set(seed.id, {
        ...seed,
        auditTrail: [
          {
            fromStatus: 'IDENTIFIED',
            toStatus: seed.status,
            changedBy: 'TPO Review Board',
            notes: seed.tpoReviewNotes || 'Initial baseline assignment',
            timestamp: now
          }
        ],
        createdAt: now,
        updatedAt: now
      });
    }
  }
}

export const studentSupportService = StudentSupportService.getInstance();
