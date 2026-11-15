/**
 * CarrerSync Phase 14 — Institutional TPO Recommendation & Intervention Service
 *
 * Implements:
 * 1. Actionable institutional training interventions synthesized from aggregate cohort intelligence:
 *    - Cross-departmental bootcamps (e.g. SQL & Relational Databases for Core Engineering branches)
 *    - Conversational Mock Interview Clinics (Behavioral & STAR articulation)
 *    - High-velocity Aptitude Sprints
 *    - Recruiter Engagement alignment workshops
 * 2. Human Approval Lifecycle & Governance:
 *    - IDENTIFIED -> UNDER_TPO_REVIEW -> APPROVED -> IN_PROGRESS -> RESOLVED / DISMISSED
 *    - Explicit tracking of aggregate evidence rationale, objective, estimated impact, and reviewer sign-off.
 */

import { randomUUID as uuidv4 } from 'crypto';
import {
  TpoInstitutionalIntervention,
  InterventionStatus
} from './analytics.types';

export class TpoInterventionService {
  private static instance: TpoInterventionService;

  // In-memory store: id -> TpoInstitutionalIntervention
  private interventionStore = new Map<string, TpoInstitutionalIntervention>();

  private constructor() {
    this.seedDefaultInterventions();
  }

  public static getInstance(): TpoInterventionService {
    if (!TpoInterventionService.instance) {
      TpoInterventionService.instance = new TpoInterventionService();
    }
    return TpoInterventionService.instance;
  }

  /**
   * Lists institutional interventions with optional filtering.
   */
  public listInterventions(
    tenantId: string,
    filters?: { status?: InterventionStatus; priority?: string; department?: string }
  ): TpoInstitutionalIntervention[] {
    const list: TpoInstitutionalIntervention[] = [];

    const tenantRecords = Array.from(this.interventionStore.values()).filter((r) => r.tenantId === tenantId);
    const candidateList =
      tenantRecords.length > 0
        ? tenantRecords
        : Array.from(this.interventionStore.values()).filter((r) => r.tenantId === 'default');

    for (const item of candidateList) {
      if (filters?.status && item.status !== filters.status) continue;
      if (filters?.priority && item.priority !== filters.priority) continue;
      if (filters?.department && item.targetCohort.department?.toLowerCase() !== filters.department.toLowerCase()) {
        continue;
      }
      list.push(item);
    }

    return list;
  }

  /**
   * Retrieves single institutional intervention by ID.
   */
  public getInterventionById(id: string): TpoInstitutionalIntervention | null {
    return this.interventionStore.get(id) || null;
  }

  /**
   * Creates a new institutional intervention proposal.
   */
  public createIntervention(params: {
    tenantId: string;
    title: string;
    reason: string;
    aggregateEvidence: string;
    targetCohort: { department?: string; batchYear?: string; studentCount: number };
    objective: string;
    priority: 'HIGH' | 'MEDIUM' | 'LOW';
    estimatedImpact: string;
    suggestedActionPlan: string[];
    assignedLead?: string;
  }): TpoInstitutionalIntervention {
    const id = `tpo-int-${uuidv4().substring(0, 8)}`;
    const now = new Date().toISOString();

    const intervention: TpoInstitutionalIntervention = {
      id,
      tenantId: params.tenantId,
      title: params.title,
      reason: params.reason,
      aggregateEvidence: params.aggregateEvidence,
      targetCohort: params.targetCohort,
      objective: params.objective,
      priority: params.priority,
      status: 'IDENTIFIED',
      estimatedImpact: params.estimatedImpact,
      suggestedActionPlan: params.suggestedActionPlan,
      assignedLead: params.assignedLead,
      createdAt: now,
      updatedAt: now
    };

    this.interventionStore.set(id, intervention);
    return intervention;
  }

  /**
   * Updates intervention status across human approval lifecycle.
   */
  public updateInterventionStatus(
    id: string,
    params: {
      status: InterventionStatus;
      reviewerId: string;
      notes?: string;
    }
  ): TpoInstitutionalIntervention | null {
    const item = this.interventionStore.get(id);
    if (!item) return null;

    const now = new Date().toISOString();
    item.status = params.status;
    item.updatedAt = now;

    if (params.status === 'APPROVED') {
      item.approvedBy = params.reviewerId;
      item.approvedAt = now;
    }

    this.interventionStore.set(id, item);
    return item;
  }

  private seedDefaultInterventions() {
    const seeds: TpoInstitutionalIntervention[] = [
      {
        id: 'tpo-int-01',
        tenantId: 'default',
        title: 'Accelerated SQL & Database Querying Bootcamp for Non-CS Branches',
        reason:
          'High demand for cross-functional software and data analyst roles among core engineering cohorts.',
        aggregateEvidence:
          '64% of Mechanical & Civil students targeting software profiles demonstrated gaps in relational schema design and complex SQL queries during Phase 12 mock drives.',
        targetCohort: {
          department: 'Mechanical & Civil',
          batchYear: '2026',
          studentCount: 78
        },
        objective:
          'Elevate average database assessment scores by >= 25% and expand cross-branch software eligibility.',
        priority: 'HIGH',
        status: 'APPROVED',
        estimatedImpact:
          '+18% projected placement conversion across hybrid IT services drives.',
        suggestedActionPlan: [
          'Week 1: Schema design, primary/foreign keys, normalization (1NF-3NF).',
          'Week 2: Multi-table JOINs, GROUP BY, aggregations, and subqueries.',
          'Week 3: Indexing and query execution plans on PostgreSQL.',
          'Week 4: Capstone database project and Phase 12 coding challenge.'
        ],
        assignedLead: 'Prof. K. Venkatesh (Dept. of IT)',
        approvedBy: 'Dr. S. Mukherjee (Head TPO)',
        approvedAt: '2026-11-02T11:00:00.000Z',
        createdAt: '2026-11-01T09:00:00.000Z',
        updatedAt: '2026-11-02T11:00:00.000Z'
      },
      {
        id: 'tpo-int-02',
        tenantId: 'default',
        title: 'Intensive AI-Assisted Interview Simulation Clinic',
        reason:
          'Students clearing technical rounds face drop-offs in behavioral and architectural interview rounds.',
        aggregateEvidence:
          '184 students cleared Round 2 coding, but interview practice scores averaged 61.2% in System Design and STAR behavioral reasoning.',
        targetCohort: {
          department: 'CSE & IT',
          batchYear: '2026',
          studentCount: 110
        },
        objective:
          'Train students to structure answers using the STAR method and explain scalability trade-offs.',
        priority: 'HIGH',
        status: 'IN_PROGRESS',
        estimatedImpact:
          'Targeting > 75% final-round offer conversion for Tier-1 corporate visits.',
        suggestedActionPlan: [
          'Mandatory 2 AI-evaluated practice interviews per student on Phase 12 simulator.',
          'Alumni panel reviews on system architecture patterns.',
          'Feedback debrief sessions with institutional placement counselors.'
        ],
        assignedLead: 'Placement Cell Career Studio',
        approvedBy: 'Dr. S. Mukherjee (Head TPO)',
        approvedAt: '2026-11-05T14:30:00.000Z',
        createdAt: '2026-11-04T10:00:00.000Z',
        updatedAt: '2026-11-05T14:30:00.000Z'
      },
      {
        id: 'tpo-int-03',
        tenantId: 'default',
        title: 'Quantitative Logic & Speed Aptitude Sprints',
        reason:
          'Initial screening rounds for major recruiters require high-speed accuracy under time pressure.',
        aggregateEvidence:
          'Mock drive round 1 data shows 26.6% attrition in speed calculations (probability, permutations, and time-distance).',
        targetCohort: {
          department: 'All Departments',
          batchYear: '2026',
          studentCount: 140
        },
        objective:
          'Increase first-round screening clearance rate from 73.4% to > 85%.',
        priority: 'MEDIUM',
        status: 'UNDER_TPO_REVIEW',
        estimatedImpact:
          '+35 additional students advancing to technical assessment rounds per drive.',
        suggestedActionPlan: [
          'Daily 20-minute timed quiz series through platform aptitude engine.',
          'Shortcut calculation techniques masterclass with industry trainers.'
        ],
        assignedLead: 'Placement Training Division',
        createdAt: '2026-11-10T08:00:00.000Z',
        updatedAt: '2026-11-10T08:00:00.000Z'
      }
    ];

    for (const seed of seeds) {
      this.interventionStore.set(seed.id, seed);
    }
  }
}

export const tpoInterventionService = TpoInterventionService.getInstance();
