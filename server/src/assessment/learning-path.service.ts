/**
 * CarrerSync Phase 12 — Personalized Learning Path Service
 *
 * Implements:
 * 1. Personalized roadmap generation based on target role and diagnosed mock-drive weaknesses.
 * 2. Task lifecycle management: RECOMMENDED -> IN_PROGRESS -> SUBMITTED_FOR_REVIEW -> COMPLETED / REJECTED / PAUSED.
 * 3. Evidence submission integration (Repositories, documentation, code, certificates).
 *
 * CRITICAL PLATFORM POLICY ENFORCED:
 * Learning task completion does NOT automatically grant VERIFIED skill status.
 * Skills extracted or evidenced through learning tasks remain EVIDENCE_FOUND / PENDING_REVIEW
 * until an authorized TPO/faculty reviewer explicitly certifies them.
 */

import { randomUUID as uuidv4 } from 'crypto';
import {
  LearningPath,
  LearningTask,
  TaskLifecycleStatus,
  LearningTaskEvidence,
  StandardTargetRole
} from './assessment.types';
import { mockDriveService } from './mock-drive.service';

export class LearningPathService {
  private static instance: LearningPathService;
  private learningPaths = new Map<string, LearningPath>();

  private constructor() {}

  public static getInstance(): LearningPathService {
    if (!LearningPathService.instance) {
      LearningPathService.instance = new LearningPathService();
    }
    return LearningPathService.instance;
  }

  /**
   * Retrieves active learning path for student, or creates an initial tailored one.
   */
  public async getLearningPath(studentId: string, tenantId: string): Promise<LearningPath> {
    const existing = this.learningPaths.get(studentId);
    if (existing) {
      return existing;
    }

    return this.generatePersonalizedPath({
      studentId,
      tenantId,
      targetRole: 'Software Engineer'
    });
  }

  /**
   * Generates a personalized learning roadmap based on target role & diagnosed assessment weaknesses.
   */
  public async generatePersonalizedPath(params: {
    studentId: string;
    tenantId: string;
    targetRole: StandardTargetRole | string;
  }): Promise<LearningPath> {
    const { studentId, tenantId, targetRole } = params;

    // 1. Retrieve weakness analysis from assessment engine
    const weaknessSummary = mockDriveService.getStudentWeaknessSummary(studentId, tenantId, targetRole);

    const pathId = uuidv4();
    const tasks: LearningTask[] = [];

    // 2. Generate remediation tasks for each identified weakness
    for (const weakness of weaknessSummary.improvementNeeded) {
      tasks.push({
        id: uuidv4(),
        pathId,
        skillName: weakness.skillName,
        targetRole,
        title: `Remediate ${weakness.skillName}: Core Competency Mastery`,
        description: weakness.recommendedRemediation,
        taskType: 'PROJECT',
        estimatedHours: 12,
        priority: 'HIGH',
        status: 'RECOMMENDED',
        learningResourceUrl: 'https://docs.carrersync.internal/curriculum/core-competencies',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
    }

    // 3. Generate standard role milestone tasks
    const roleTasks = this.getDefaultRoleTasks(pathId, targetRole);
    tasks.push(...roleTasks);

    const totalTasks = tasks.length;
    const completedTasks = tasks.filter((t) => t.status === 'COMPLETED').length;
    const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    const learningPath: LearningPath = {
      id: pathId,
      tenantId,
      studentId,
      targetRole,
      title: `${targetRole} Placement Acceleration Pathway`,
      description: `Personalized skill development roadmap formulated from your recent mock drive assessments and target job requirements.`,
      overallProgressPercentage: progress,
      totalTasks,
      completedTasks,
      tasks,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    this.learningPaths.set(studentId, learningPath);
    return learningPath;
  }

  /**
   * Transitions a learning task's lifecycle status.
   */
  public updateTaskStatus(params: {
    studentId: string;
    tenantId: string;
    taskId: string;
    status: TaskLifecycleStatus;
  }): LearningTask {
    const { studentId, taskId, status } = params;
    const path = this.learningPaths.get(studentId);
    if (!path) throw new Error('Learning path not found for student');

    const task = path.tasks.find((t) => t.id === taskId);
    if (!task) throw new Error('Task not found in learning path');

    // State machine validation
    const validTransitions: Record<TaskLifecycleStatus, TaskLifecycleStatus[]> = {
      RECOMMENDED: ['IN_PROGRESS', 'PAUSED'],
      IN_PROGRESS: ['SUBMITTED_FOR_REVIEW', 'PAUSED', 'RECOMMENDED'],
      PAUSED: ['IN_PROGRESS', 'RECOMMENDED'],
      SUBMITTED_FOR_REVIEW: ['COMPLETED', 'REJECTED', 'IN_PROGRESS'],
      COMPLETED: [],
      REJECTED: ['IN_PROGRESS', 'SUBMITTED_FOR_REVIEW']
    };

    if (task.status !== status && !validTransitions[task.status]?.includes(status)) {
      throw new Error(`Invalid status transition from ${task.status} to ${status}`);
    }

    task.status = status;
    task.updatedAt = new Date().toISOString();

    // Recalculate progress
    this.recalculatePathProgress(path);
    return task;
  }

  /**
   * Submits evidence for a learning task (Repository URL, Documentation, or Code).
   * Moves task status to SUBMITTED_FOR_REVIEW.
   * Adheres strictly to the platform policy: NEVER automatically marks as VERIFIED!
   */
  public submitTaskEvidence(params: {
    studentId: string;
    tenantId: string;
    taskId: string;
    submissionType: 'REPOSITORY' | 'DOCUMENTATION' | 'CODE' | 'CERTIFICATE';
    urlOrContent: string;
    notes?: string;
  }): LearningTask {
    const { studentId, taskId, submissionType, urlOrContent, notes } = params;
    const path = this.learningPaths.get(studentId);
    if (!path) throw new Error('Learning path not found for student');

    const task = path.tasks.find((t) => t.id === taskId);
    if (!task) throw new Error('Task not found in learning path');

    if (!urlOrContent || urlOrContent.trim().length === 0) {
      throw new Error('Evidence URL or content submission cannot be empty');
    }

    const evidence: LearningTaskEvidence = {
      submissionType,
      urlOrContent: urlOrContent.trim(),
      notes: notes?.trim(),
      submittedAt: new Date().toISOString(),
      status: 'PENDING_REVIEW' // NEVER AUTO-VERIFIED!
    };

    task.evidence = evidence;
    task.status = 'SUBMITTED_FOR_REVIEW';
    task.updatedAt = new Date().toISOString();

    this.recalculatePathProgress(path);
    return task;
  }

  private recalculatePathProgress(path: LearningPath): void {
    const total = path.tasks.length;
    const completed = path.tasks.filter((t) => t.status === 'COMPLETED').length;
    path.totalTasks = total;
    path.completedTasks = completed;
    path.overallProgressPercentage = total > 0 ? Math.round((completed / total) * 100) : 0;
    path.updatedAt = new Date().toISOString();
  }

  private getDefaultRoleTasks(pathId: string, role: string): LearningTask[] {
    const now = new Date().toISOString();
    return [
      {
        id: uuidv4(),
        pathId,
        skillName: 'Production Clean Architecture',
        targetRole: role,
        title: 'Architect a Modular Microservice with Unit Testing',
        description: 'Implement a layered service with strict boundary separation, dependency injection, and automated Vitest/Jest unit tests with >80% code coverage.',
        taskType: 'PROJECT',
        estimatedHours: 16,
        priority: 'HIGH',
        status: 'IN_PROGRESS',
        learningResourceUrl: 'https://docs.carrersync.internal/guides/clean-architecture',
        createdAt: now,
        updatedAt: now
      },
      {
        id: uuidv4(),
        pathId,
        skillName: 'Database Indexing & Query Tuning',
        targetRole: role,
        title: 'Query Optimization & EXPLAIN ANALYZE Workshop',
        description: 'Analyze slow relational queries, design composite B-Tree indexes, and eliminate N+1 database queries on high-traffic endpoints.',
        taskType: 'CONCEPT_STUDY',
        estimatedHours: 8,
        priority: 'MEDIUM',
        status: 'RECOMMENDED',
        learningResourceUrl: 'https://docs.carrersync.internal/guides/database-indexing',
        createdAt: now,
        updatedAt: now
      },
      {
        id: uuidv4(),
        pathId,
        skillName: 'System Design & Tradeoffs',
        targetRole: role,
        title: 'High-Concurrency Rate Limiter & Caching Design',
        description: 'Design a distributed token bucket rate limiter using Redis and express middleware, with graceful degradation under cluster load.',
        taskType: 'SYSTEM_DESIGN',
        estimatedHours: 10,
        priority: 'MEDIUM',
        status: 'RECOMMENDED',
        learningResourceUrl: 'https://docs.carrersync.internal/guides/system-design-patterns',
        createdAt: now,
        updatedAt: now
      }
    ];
  }
}

export const learningPathService = LearningPathService.getInstance();
