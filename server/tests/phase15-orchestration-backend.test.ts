/**
 * CarrerSync Phase 15 — Autonomous Placement Orchestration & Multi-Agent Backend Tests
 *
 * Comprehensive test suite validating:
 * 1. Cross-Agent Zod Contracts & Boundary Validation
 * 2. Central Workflow Registry (All 7 End-to-End Registered Workflows)
 * 3. Agent Orchestration Engine (RBAC, Deterministic Routing, Idempotency)
 * 4. Human-in-the-Loop Governance Gates (WAITING_FOR_REVIEW, TPO Approvals & Rejections)
 * 5. Delegated Reviewer Registry (Stop-Gate 5: Persistent, Tenant-Scoped, Revocable)
 * 6. In-App Notification Center (Isolation, Read Markers, Deduplication, Preferences)
 * 7. Structured Platform Observability (Sanitization, Zero PII, Correlation IDs, Aggregations)
 * 8. REST API Endpoints for Orchestration & Notifications
 */

import { describe, it, expect, beforeAll, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../src/app';
import { createJwtToken } from '../src/utils/crypto';

import {
  agentOrchestrationService,
  delegationService,
  notificationService,
  observabilityService,
  getRegisteredWorkflows,
  getWorkflowDefinition,
  validateProfilingToSkillGapInput,
  validateProfilingToSkillGapOutput,
  validateSkillGapToLearningInput,
  validateSkillGapToLearningOutput,
  validateProfilingAssessmentsToPredictiveInput,
  validateProfilingAssessmentsToPredictiveOutput,
  validateMultiAgentToPlacementInput,
  validateMultiAgentToPlacementOutput,
  sanitizeTelemetryPayload
} from '../src/orchestration';

describe('Phase 15 — Agent Orchestration Engine, Contracts, Delegation & Observability', () => {
  const TENANT_A = '11111111-1111-4111-8111-111111111111';
  const TENANT_B = '22222222-2222-4222-8222-222222222222';

  const tpoUserA = {
    id: 'a1111111-1111-4111-8111-111111111111',
    email: 'tpo.alpha@college.edu',
    role: 'TPO_ADMIN',
    tenantId: TENANT_A
  };

  const facultyUserA = {
    id: 'f1111111-1111-4111-8111-111111111111',
    email: 'faculty.coordinator@college.edu',
    role: 'COLLEGE_ADMIN',
    tenantId: TENANT_A
  };

  const studentUserA = {
    id: 's1111111-1111-4111-8111-111111111111',
    email: 'student.aarav@college.edu',
    role: 'STUDENT',
    tenantId: TENANT_A
  };

  const recruiterUserA = {
    id: 'r1111111-1111-4111-8111-111111111111',
    email: 'recruiter.tech@corp.com',
    role: 'RECRUITER',
    tenantId: TENANT_A
  };

  const tpoUserB = {
    id: 'b2222222-2222-4222-8222-222222222222',
    email: 'tpo.beta@university.edu',
    role: 'TPO_ADMIN',
    tenantId: TENANT_B
  };

  let tpoTokenA: string;
  let facultyTokenA: string;
  let studentTokenA: string;
  let recruiterTokenA: string;
  let tpoTokenB: string;

  beforeAll(async () => {
    tpoTokenA = await createJwtToken({
      sub: tpoUserA.id,
      tenant_id: tpoUserA.tenantId,
      role: tpoUserA.role,
      email: tpoUserA.email
    });

    facultyTokenA = await createJwtToken({
      sub: facultyUserA.id,
      tenant_id: facultyUserA.tenantId,
      role: facultyUserA.role,
      email: facultyUserA.email
    });

    studentTokenA = await createJwtToken({
      sub: studentUserA.id,
      tenant_id: studentUserA.tenantId,
      role: studentUserA.role,
      email: studentUserA.email
    });

    recruiterTokenA = await createJwtToken({
      sub: recruiterUserA.id,
      tenant_id: recruiterUserA.tenantId,
      role: recruiterUserA.role,
      email: recruiterUserA.email
    });

    tpoTokenB = await createJwtToken({
      sub: tpoUserB.id,
      tenant_id: tpoUserB.tenantId,
      role: tpoUserB.role,
      email: tpoUserB.email
    });
  });

  beforeEach(() => {
    agentOrchestrationService.clear();
    delegationService.clear();
    notificationService.clear();
    observabilityService.clear();
  });

  // =========================================================================
  // Suite 1: Cross-Agent Contracts & Zod Schemas
  // =========================================================================
  describe('Suite 1: Cross-Agent Contracts & Zod Schemas', () => {
    it('validates profiling-to-skill-gap contract input and output', () => {
      const validInput = {
        studentId: '11111111-1111-4111-8111-111111111111',
        tenantId: '22222222-2222-4222-8222-222222222222',
        approvedProfile: {
          headline: 'Full Stack Engineer in Training',
          summary: 'CS senior specialized in distributed systems',
          education: [
            { institution: 'Tech Institute', degree: 'B.Tech CS', cgpa: 8.8 }
          ],
          profileCompletenessScore: 85
        },
        verifiedSkills: [
          {
            skillName: 'TypeScript',
            proficiency: 'INTERMEDIATE',
            verifiedBy: 'tpo-admin-1',
            verifiedAt: '2026-11-15T10:00:00Z',
            evidenceRefs: ['ev-1']
          }
        ],
        evidenceRefs: ['ev-1'],
        targetRole: 'Full Stack Developer'
      };

      const parsedInput = validateProfilingToSkillGapInput(validInput);
      expect(parsedInput.targetRole).toBe('Full Stack Developer');
      expect(parsedInput.verifiedSkills[0].skillName).toBe('TypeScript');

      // Invalid input check (missing targetRole)
      expect(() => {
        validateProfilingToSkillGapInput({ ...validInput, targetRole: '' });
      }).toThrow();

      const validOutput = {
        matchedSkills: ['TypeScript'],
        missingEvidence: ['Docker'],
        skillGaps: [
          {
            skillName: 'Docker',
            currentLevel: 'NONE',
            requiredLevel: 'INTERMEDIATE',
            gapSeverity: 'MODERATE' as const
          }
        ],
        confidence: 0.95,
        explanation: 'Strong frontend alignment, containerization requires lab practice'
      };

      const parsedOutput = validateProfilingToSkillGapOutput(validOutput);
      expect(parsedOutput.matchedSkills).toContain('TypeScript');
      expect(parsedOutput.confidence).toBe(0.95);
    });

    it('validates skill-gap-to-learning contract input and output', () => {
      const validInput = {
        targetRole: 'Backend Engineer',
        skillRequirements: [
          { skillName: 'PostgreSQL', requiredProficiency: 'ADVANCED' },
          { skillName: 'Docker', requiredProficiency: 'INTERMEDIATE' }
        ],
        studentSkillProfile: {
          verifiedSkills: ['TypeScript', 'Node.js'],
          gapSkills: ['Docker', 'PostgreSQL']
        }
      };

      const parsedInput = validateSkillGapToLearningInput(validInput);
      expect(parsedInput.targetRole).toBe('Backend Engineer');

      const validOutput = {
        recommendedTasks: [
          {
            taskId: 'task-docker-1',
            title: 'Containerize Express & PostgreSQL microservices',
            skillTarget: 'Docker',
            taskType: 'HANDS_ON_LAB',
            estimatedHours: 8,
            priority: 'HIGH' as const
          }
        ],
        priority: 'HIGH' as const,
        expectedOutcome: 'Containerized deployment readiness',
        reason: 'Required for technical screening interview'
      };

      const parsedOutput = validateSkillGapToLearningOutput(validOutput);
      expect(parsedOutput.recommendedTasks.length).toBe(1);
      expect(parsedOutput.priority).toBe('HIGH');
    });

    it('validates profiling-assessments-to-predictive contract input and output', () => {
      const validInput = {
        verifiedSkills: [{ skillName: 'TypeScript', proficiency: 'ADVANCED' }],
        evidenceCoverage: 0.85,
        assessmentResults: [
          { assessmentType: 'CODING_PRACTICE', score: 92, completedAt: '2026-11-15T12:00:00Z' }
        ]
      };

      const parsedInput = validateProfilingAssessmentsToPredictiveInput(validInput);
      expect(parsedInput.evidenceCoverage).toBe(0.85);

      const validOutput = {
        readinessIndicators: {
          technicalScore: 88,
          softSkillScore: 82,
          overallReadiness: 85,
          readinessClassification: 'HIGH_READINESS' as const
        },
        performanceTrends: [
          { period: '2026-Q4', score: 85, metric: 'READINESS' }
        ],
        supportRecommendations: [
          { category: 'ASSESSMENT_PRACTICE', priority: 'MEDIUM', notes: 'Maintain mock interview rhythm' }
        ],
        predictionAvailability: true
      };

      const parsedOutput = validateProfilingAssessmentsToPredictiveOutput(validOutput);
      expect(parsedOutput.readinessIndicators.readinessClassification).toBe('HIGH_READINESS');
      expect(parsedOutput.predictionAvailability).toBe(true);
    });

    it('validates multi-agent-to-placement contract input and output', () => {
      const validInput = {
        jobRequirements: {
          jobId: '11111111-1111-4111-8111-111111111111',
          title: 'Software Development Engineer I',
          requiredSkills: ['TypeScript', 'Node.js', 'PostgreSQL'],
          minCgpa: 7.5,
          allowedBranches: ['CSE', 'IT']
        },
        administrativeCriteria: {
          attendancePercentage: 88,
          feeClearance: true,
          disciplinaryClearance: true
        },
        skillMatches: [
          {
            studentId: '22222222-2222-4222-8222-222222222222',
            matchedSkillCount: 3,
            totalSkillsRequired: 3,
            matchPercentage: 100
          }
        ],
        studentConsent: true,
        tpoApprovalState: {
          isApproved: true,
          approvedBy: 'tpo-head'
        }
      };

      const parsedInput = validateMultiAgentToPlacementInput(validInput);
      expect(parsedInput.studentConsent).toBe(true);

      const validOutput = {
        candidateMatches: [
          {
            studentId: '22222222-2222-4222-8222-222222222222',
            matchScore: 100,
            rank: 1
          }
        ],
        eligibilityResult: {
          isEligible: true,
          rejectionReasons: []
        },
        reviewRequiredStatus: false,
        auditRefs: ['audit-sde1-shortlist']
      };

      const parsedOutput = validateMultiAgentToPlacementOutput(validOutput);
      expect(parsedOutput.candidateMatches[0].rank).toBe(1);
      expect(parsedOutput.eligibilityResult.isEligible).toBe(true);
    });
  });

  // =========================================================================
  // Suite 2: Central Workflow Registry
  // =========================================================================
  describe('Suite 2: Central Workflow Registry Catalog', () => {
    it('registers all 7 student journey workflows with explicit schemas and policies', () => {
      const workflows = getRegisteredWorkflows();
      expect(workflows.length).toBe(7);

      const expectedIds = [
        'WF_STUDENT_ONBOARDING_PROFILING',
        'WF_EVIDENCE_VERIFICATION_DISPATCH',
        'WF_CAREER_INTELLIGENCE_MATCH',
        'WF_PREPARATION_LEARNING_SYNC',
        'WF_PLACEMENT_DRIVE_ELIGIBILITY',
        'WF_CANDIDATE_SHORTLIST_REVIEW',
        'WF_PLACEMENT_OUTCOME_CONFIRMATION'
      ];

      for (const id of expectedIds) {
        const def = getWorkflowDefinition(id);
        expect(def).toBeDefined();
        expect(def?.workflowId).toBe(id);
        expect(def?.initiatingRoles.length).toBeGreaterThan(0);
        expect(def?.steps.length).toBeGreaterThan(0);
        expect(def?.timeoutMs).toBeGreaterThan(0);
        expect(def?.maxRetries).toBeGreaterThanOrEqual(1);
      }
    });

    it('verifies human-in-the-loop requirement flag consistency', () => {
      const verificationWf = getWorkflowDefinition('WF_EVIDENCE_VERIFICATION_DISPATCH');
      expect(verificationWf?.requiredHumanApproval).toBe(true);

      const shortlistWf = getWorkflowDefinition('WF_CANDIDATE_SHORTLIST_REVIEW');
      expect(shortlistWf?.requiredHumanApproval).toBe(true);

      const profilingWf = getWorkflowDefinition('WF_STUDENT_ONBOARDING_PROFILING');
      expect(profilingWf?.requiredHumanApproval).toBe(false);
    });
  });

  // =========================================================================
  // Suite 3: Agent Orchestration Engine Execution & Idempotency
  // =========================================================================
  describe('Suite 3: Agent Orchestration Engine Execution & Idempotency', () => {
    it('executes automated workflow end-to-end to COMPLETED status', async () => {
      const result = await agentOrchestrationService.initiateWorkflow({
        tenantId: TENANT_A,
        initiatedBy: studentUserA.id,
        initiatingRole: studentUserA.role,
        workflowDefinitionId: 'WF_STUDENT_ONBOARDING_PROFILING',
        inputPayload: {
          studentId: '11111111-1111-4111-8111-111111111111',
          rawProfile: {
            skills: ['TypeScript', 'Node.js', 'PostgreSQL', 'Docker']
          }
        }
      });

      expect(result.isIdempotentReplay).toBe(false);
      expect(result.workflow.status).toBe('COMPLETED');
      expect(result.workflow.completedAt).toBeDefined();
      expect(result.workflow.steps?.length).toBe(3);
      expect(result.workflow.steps?.every((s) => s.status === 'COMPLETED')).toBe(true);
    });

    it('enforces idempotency: duplicate initiate with same idempotencyKey returns existing workflow without re-execution', async () => {
      const idempotencyKey = 'idempotent-onboarding-test-key-1';

      const first = await agentOrchestrationService.initiateWorkflow({
        tenantId: TENANT_A,
        initiatedBy: studentUserA.id,
        initiatingRole: studentUserA.role,
        workflowDefinitionId: 'WF_STUDENT_ONBOARDING_PROFILING',
        inputPayload: {
          studentId: '11111111-1111-4111-8111-111111111111',
          rawProfile: { skills: ['TypeScript', 'React'] }
        },
        idempotencyKey
      });

      expect(first.isIdempotentReplay).toBe(false);
      const originalId = first.workflow.id;

      // Re-trigger with same idempotencyKey
      const second = await agentOrchestrationService.initiateWorkflow({
        tenantId: TENANT_A,
        initiatedBy: studentUserA.id,
        initiatingRole: studentUserA.role,
        workflowDefinitionId: 'WF_STUDENT_ONBOARDING_PROFILING',
        inputPayload: {
          studentId: '11111111-1111-4111-8111-111111111111',
          rawProfile: { skills: ['TypeScript', 'React'] }
        },
        idempotencyKey
      });

      expect(second.isIdempotentReplay).toBe(true);
      expect(second.workflow.id).toBe(originalId);
    });

    it('rejects unauthorized role from initiating restricted workflow (Deterministic RBAC)', async () => {
      // Student is NOT authorized to initiate WF_PLACEMENT_DRIVE_ELIGIBILITY (only TPO/Admin/Recruiter)
      // Note: initiatingRoles for WF_PLACEMENT_DRIVE_ELIGIBILITY: ['TPO_ADMIN', 'COLLEGE_ADMIN', 'RECRUITER', 'SUPER_ADMIN']
      await expect(
        agentOrchestrationService.initiateWorkflow({
          tenantId: TENANT_A,
          initiatedBy: studentUserA.id,
          initiatingRole: studentUserA.role,
          workflowDefinitionId: 'WF_PLACEMENT_DRIVE_ELIGIBILITY',
          inputPayload: {
            jobId: '11111111-1111-4111-8111-111111111111',
            studentId: '22222222-2222-4222-8222-222222222222',
            studentCgpa: 8.5,
            minCgpa: 7.0,
            department: 'CSE',
            allowedDepartments: ['CSE'],
            attendancePercentage: 90,
            backlogCount: 0
          }
        })
      ).rejects.toThrow(/not authorized to initiate workflow/);
    });
  });

  // =========================================================================
  // Suite 4: Human-in-the-Loop Governance Gates
  // =========================================================================
  describe('Suite 4: Human-in-the-Loop Governance Gates', () => {
    it('halts workflow at WAITING_FOR_REVIEW when human approval is required', async () => {
      const result = await agentOrchestrationService.initiateWorkflow({
        tenantId: TENANT_A,
        initiatedBy: studentUserA.id,
        initiatingRole: studentUserA.role,
        workflowDefinitionId: 'WF_EVIDENCE_VERIFICATION_DISPATCH',
        inputPayload: {
          studentId: '11111111-1111-4111-8111-111111111111',
          skillName: 'TypeScript',
          evidenceUrl: 'https://storage.carrersync.com/artifacts/cert.pdf',
          evidenceType: 'CERTIFICATION'
        }
      });

      expect(result.workflow.status).toBe('WAITING_FOR_REVIEW');
      expect(result.workflow.approvals?.length).toBe(1);
      expect(result.workflow.approvals?.[0].status).toBe('PENDING');
      expect(result.workflow.approvals?.[0].requiredRole).toBe('TPO_ADMIN');
    });

    it('resumes and completes workflow when authorized TPO approves', async () => {
      const initiated = await agentOrchestrationService.initiateWorkflow({
        tenantId: TENANT_A,
        initiatedBy: studentUserA.id,
        initiatingRole: studentUserA.role,
        workflowDefinitionId: 'WF_EVIDENCE_VERIFICATION_DISPATCH',
        inputPayload: {
          studentId: '11111111-1111-4111-8111-111111111111',
          skillName: 'TypeScript',
          evidenceUrl: 'https://storage.carrersync.com/artifacts/cert.pdf',
          evidenceType: 'CERTIFICATION'
        }
      });

      const approved = await agentOrchestrationService.approveWorkflow(
        TENANT_A,
        initiated.workflow.id,
        tpoUserA.id,
        tpoUserA.role,
        'APPROVED',
        'Evidence verified against official credential registry'
      );

      expect(approved.status).toBe('COMPLETED');
      expect(approved.approvals?.[0].status).toBe('APPROVED');
      expect(approved.approvals?.[0].reviewedBy).toBe(tpoUserA.id);
    });

    it('marks workflow as FAILED when TPO rejects approval', async () => {
      const initiated = await agentOrchestrationService.initiateWorkflow({
        tenantId: TENANT_A,
        initiatedBy: studentUserA.id,
        initiatingRole: studentUserA.role,
        workflowDefinitionId: 'WF_EVIDENCE_VERIFICATION_DISPATCH',
        inputPayload: {
          studentId: '11111111-1111-4111-8111-111111111111',
          skillName: 'TypeScript',
          evidenceUrl: 'https://storage.carrersync.com/artifacts/cert.pdf',
          evidenceType: 'CERTIFICATION'
        }
      });

      const rejected = await agentOrchestrationService.approveWorkflow(
        TENANT_A,
        initiated.workflow.id,
        tpoUserA.id,
        tpoUserA.role,
        'REJECTED',
        'Certificate lacks cryptographic verification signature'
      );

      expect(rejected.status).toBe('FAILED');
      expect(rejected.approvals?.[0].status).toBe('REJECTED');
      expect(rejected.errorDetailsJson?.rejectionReason).toContain('cryptographic');
    });

    it('blocks student or unauthorized user from approving workflow', async () => {
      const initiated = await agentOrchestrationService.initiateWorkflow({
        tenantId: TENANT_A,
        initiatedBy: studentUserA.id,
        initiatingRole: studentUserA.role,
        workflowDefinitionId: 'WF_EVIDENCE_VERIFICATION_DISPATCH',
        inputPayload: {
          studentId: '11111111-1111-4111-8111-111111111111',
          skillName: 'TypeScript',
          evidenceUrl: 'https://storage.carrersync.com/artifacts/cert.pdf',
          evidenceType: 'CERTIFICATION'
        }
      });

      // Student tries to self-approve
      await expect(
        agentOrchestrationService.approveWorkflow(
          TENANT_A,
          initiated.workflow.id,
          studentUserA.id,
          studentUserA.role,
          'APPROVED',
          'Self-approval attempt'
        )
      ).rejects.toThrow(/does not possess TPO authority/);
    });
  });

  // =========================================================================
  // Suite 5: Delegated Reviewer Registry (Stop-Gate 5 Resolution)
  // =========================================================================
  describe('Suite 5: Delegated Reviewer Registry (Stop-Gate 5)', () => {
    it('grants, verifies, and revokes reviewer delegation with immediate invalidation', async () => {
      // 1. Grant delegation to faculty user in Tenant A
      const delegation = await delegationService.delegateReviewer(TENANT_A, tpoUserA.id, {
        userId: facultyUserA.id,
        permissions: ['VERIFY_SKILLS', 'REVIEW_EVIDENCE'],
        notes: 'Faculty Coordinator for CSE Department'
      });

      expect(delegation.isActive).toBe(true);
      expect(delegation.userId).toBe(facultyUserA.id);

      // 2. Check reviewer is delegated in Tenant A
      const isDelegated = delegationService.isReviewerDelegatedSync(TENANT_A, facultyUserA.id);
      expect(isDelegated).toBe(true);

      // 3. Delegated reviewer can approve workflow
      const initiated = await agentOrchestrationService.initiateWorkflow({
        tenantId: TENANT_A,
        initiatedBy: studentUserA.id,
        initiatingRole: studentUserA.role,
        workflowDefinitionId: 'WF_EVIDENCE_VERIFICATION_DISPATCH',
        inputPayload: {
          studentId: '11111111-1111-4111-8111-111111111111',
          skillName: 'PostgreSQL',
          evidenceUrl: 'https://storage.carrersync.com/artifacts/sql.pdf',
          evidenceType: 'PROJECT_SUBMISSION'
        }
      });

      const approvedByFaculty = await agentOrchestrationService.approveWorkflow(
        TENANT_A,
        initiated.workflow.id,
        facultyUserA.id,
        facultyUserA.role,
        'APPROVED',
        'Verified by Delegated Faculty Coordinator'
      );
      expect(approvedByFaculty.status).toBe('COMPLETED');

      // 4. Revoke delegation
      const revokeResult = await delegationService.revokeDelegation(
        TENANT_A,
        delegation.id,
        tpoUserA.id
      );
      expect(revokeResult.success).toBe(true);

      // 5. Verification check immediately returns false
      const isStillDelegated = delegationService.isReviewerDelegatedSync(TENANT_A, facultyUserA.id);
      expect(isStillDelegated).toBe(false);
    });

    it('enforces multi-tenant isolation on delegation: Tenant A delegation does not grant rights in Tenant B', async () => {
      // Grant delegation in Tenant A
      await delegationService.delegateReviewer(TENANT_A, tpoUserA.id, {
        userId: facultyUserA.id,
        permissions: ['VERIFY_SKILLS']
      });

      // Query in Tenant B must return false
      const isDelegatedInTenantB = delegationService.isReviewerDelegatedSync(
        TENANT_B,
        facultyUserA.id
      );
      expect(isDelegatedInTenantB).toBe(false);
    });
  });

  // =========================================================================
  // Suite 6: In-App Notification Center
  // =========================================================================
  describe('Suite 6: In-App Notification Center', () => {
    it('dispatches notification, updates unread count, and supports single and bulk mark as read', async () => {
      // Dispatch 2 notifications
      await notificationService.dispatchNotification(TENANT_A, {
        recipientUserId: studentUserA.id,
        eventType: 'SKILL_VERIFIED',
        title: 'Skill Verified: TypeScript',
        message: 'Your TypeScript credential has been verified.'
      });

      await notificationService.dispatchNotification(TENANT_A, {
        recipientUserId: studentUserA.id,
        eventType: 'ROADMAP_UPDATED',
        title: 'Roadmap Updated',
        message: 'New practice tasks available.'
      });

      // Query
      const initial = await notificationService.getNotifications(TENANT_A, studentUserA.id);
      expect(initial.unreadCount).toBe(2);
      expect(initial.notifications.length).toBe(2);

      // Mark single read
      const firstId = initial.notifications[0].id;
      const readOne = await notificationService.markAsRead(TENANT_A, studentUserA.id, firstId);
      expect(readOne?.isRead).toBe(true);

      const afterOne = await notificationService.getNotifications(TENANT_A, studentUserA.id);
      expect(afterOne.unreadCount).toBe(1);

      // Mark all read
      const bulkResult = await notificationService.markAllAsRead(TENANT_A, studentUserA.id);
      expect(bulkResult.count).toBe(1);

      const afterBulk = await notificationService.getNotifications(TENANT_A, studentUserA.id);
      expect(afterBulk.unreadCount).toBe(0);
    });

    it('prevents duplicate notifications within deduplication window', async () => {
      const first = await notificationService.dispatchNotification(TENANT_A, {
        recipientUserId: studentUserA.id,
        eventType: 'DRIVE_PUBLISHED',
        title: 'New Drive: TechCorp',
        message: 'TechCorp published a drive',
        referenceType: 'DRIVE',
        referenceId: 'drive-techcorp-101'
      });
      expect(first.dispatched).toBe(true);
      expect(first.isDuplicate).toBe(false);

      // Attempt duplicate dispatch
      const second = await notificationService.dispatchNotification(TENANT_A, {
        recipientUserId: studentUserA.id,
        eventType: 'DRIVE_PUBLISHED',
        title: 'New Drive: TechCorp',
        message: 'TechCorp published a drive',
        referenceType: 'DRIVE',
        referenceId: 'drive-techcorp-101'
      });
      expect(second.dispatched).toBe(false);
      expect(second.isDuplicate).toBe(true);
    });

    it('manages user notification preferences', async () => {
      const defaultPref = await notificationService.getPreferences(TENANT_A, studentUserA.id);
      expect(defaultPref.inAppNotifications).toBe(true);

      const updated = await notificationService.updatePreferences(TENANT_A, studentUserA.id, {
        driveAnnouncements: false
      });
      expect(updated.driveAnnouncements).toBe(false);
      expect(updated.inAppNotifications).toBe(true);
    });
  });

  // =========================================================================
  // Suite 7: Platform Observability & Sanitized Telemetry
  // =========================================================================
  describe('Suite 7: Platform Observability & Telemetry Sanitization', () => {
    it('sanitizes telemetry payload to guarantee ZERO PII and ZERO secrets', () => {
      const rawPayload = {
        studentName: 'Aarav Sharma',
        email: 'aarav.sharma@example.com',
        phoneNumber: '+91 9876543210',
        password: 'SuperSecretPassword123!',
        jwt: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.doNotLeakThisSignature1234567890',
        metadata: {
          apiKey: 'key_live_998877665544332211',
          technicalScore: 92
        }
      };

      const sanitized = sanitizeTelemetryPayload(rawPayload);
      expect(sanitized.email).toBe('[REDACTED]');
      expect(sanitized.password).toBe('[REDACTED]');
      expect(sanitized.phoneNumber).toBe('[REDACTED]');
      expect(sanitized.jwt).toBe('[REDACTED]');
      expect(sanitized.metadata.apiKey).toBe('[REDACTED]');
      expect(sanitized.metadata.technicalScore).toBe(92);
    });

    it('records execution events with correlation ID and computes platform stats', async () => {
      const corrId = observabilityService.generateCorrelationId();
      expect(corrId.startsWith('corr-')).toBe(true);

      await observabilityService.recordEvent(TENANT_A, {
        workflowId: 'wf-obs-1',
        eventType: 'AGENT_TASK_EXECUTED',
        agentName: 'STUDENT_PROFILING_AGENT',
        payloadJson: { processedDocuments: 3 },
        correlationId: corrId,
        executionTimeMs: 120
      });

      observabilityService.recordExecutionMetric({
        status: 'COMPLETED',
        durationMs: 120
      });

      const stats = await observabilityService.getStats(TENANT_A);
      expect(stats.totalExecutions).toBe(1);
      expect(stats.successfulExecutions).toBe(1);
      expect(stats.successRate).toBe(100);
      expect(stats.agentHealth.STUDENT_PROFILING_AGENT.status).toBe('HEALTHY');
      expect(stats.agentHealth.STUDENT_PROFILING_AGENT.totalCalls).toBe(1);

      const events = await observabilityService.getEvents(TENANT_A, {
        correlationId: corrId
      });
      expect(events.events.length).toBe(1);
      expect(events.events[0].agentName).toBe('STUDENT_PROFILING_AGENT');
    });
  });

  // =========================================================================
  // Suite 8: REST API Integration Endpoints
  // =========================================================================
  describe('Suite 8: REST API Integration Endpoints', () => {
    it('GET /api/v1/orchestration/registry returns all registered workflows', async () => {
      const res = await request(app)
        .get('/api/v1/orchestration/registry')
        .set('Authorization', `Bearer ${tpoTokenA}`)
        .set('x-tenant-id', TENANT_A);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBe(7);
    });

    it('POST /api/v1/orchestration/workflows initiates workflow via API', async () => {
      const res = await request(app)
        .post('/api/v1/orchestration/workflows')
        .set('Authorization', `Bearer ${studentTokenA}`)
        .set('x-tenant-id', TENANT_A)
        .send({
          workflowDefinitionId: 'WF_STUDENT_ONBOARDING_PROFILING',
          inputPayload: {
            studentId: '11111111-1111-4111-8111-111111111111',
            rawProfile: { skills: ['Node.js', 'Express', 'Vitest'] }
          }
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe('COMPLETED');
    });

    it('GET /api/v1/orchestration/workflows lists tenant workflows', async () => {
      // Seed a workflow first
      await agentOrchestrationService.initiateWorkflow({
        tenantId: TENANT_A,
        initiatedBy: studentUserA.id,
        initiatingRole: studentUserA.role,
        workflowDefinitionId: 'WF_STUDENT_ONBOARDING_PROFILING',
        inputPayload: {
          studentId: '11111111-1111-4111-8111-111111111111',
          rawProfile: { skills: ['Python', 'Django'] }
        }
      });

      const res = await request(app)
        .get('/api/v1/orchestration/workflows')
        .set('Authorization', `Bearer ${tpoTokenA}`)
        .set('x-tenant-id', TENANT_A);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBeGreaterThanOrEqual(1);
    });

    it('POST /api/v1/orchestration/workflows/:id/approve processes human approval via API', async () => {
      const initiated = await agentOrchestrationService.initiateWorkflow({
        tenantId: TENANT_A,
        initiatedBy: studentUserA.id,
        initiatingRole: studentUserA.role,
        workflowDefinitionId: 'WF_EVIDENCE_VERIFICATION_DISPATCH',
        inputPayload: {
          studentId: '11111111-1111-4111-8111-111111111111',
          skillName: 'Docker',
          evidenceUrl: 'https://storage.carrersync.com/artifacts/docker.pdf',
          evidenceType: 'CERTIFICATION'
        }
      });

      const res = await request(app)
        .post(`/api/v1/orchestration/workflows/${initiated.workflow.id}/approve`)
        .set('Authorization', `Bearer ${tpoTokenA}`)
        .set('x-tenant-id', TENANT_A)
        .send({
          action: 'APPROVED',
          reviewerNotes: 'Official Docker certification confirmed'
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe('COMPLETED');
    });

    it('POST, GET, and DELETE /api/v1/orchestration/delegation manages reviewer delegation', async () => {
      // 1. Delegate
      const postRes = await request(app)
        .post('/api/v1/orchestration/delegation')
        .set('Authorization', `Bearer ${tpoTokenA}`)
        .set('x-tenant-id', TENANT_A)
        .send({
          userId: facultyUserA.id,
          permissions: ['VERIFY_SKILLS', 'REVIEW_EVIDENCE'],
          notes: 'Department Reviewer'
        });

      expect(postRes.status).toBe(201);
      expect(postRes.body.success).toBe(true);
      const delegationId = postRes.body.data.id;

      // 2. List
      const getRes = await request(app)
        .get('/api/v1/orchestration/delegation')
        .set('Authorization', `Bearer ${tpoTokenA}`)
        .set('x-tenant-id', TENANT_A);

      expect(getRes.status).toBe(200);
      expect(getRes.body.data.length).toBeGreaterThanOrEqual(1);

      // 3. Revoke
      const deleteRes = await request(app)
        .delete(`/api/v1/orchestration/delegation/${delegationId}`)
        .set('Authorization', `Bearer ${tpoTokenA}`)
        .set('x-tenant-id', TENANT_A);

      expect(deleteRes.status).toBe(200);
      expect(deleteRes.body.success).toBe(true);
      expect(deleteRes.body.data.isActive).toBe(false);
    });

    it('GET, PATCH, and POST /api/v1/notifications operates in-app notification center', async () => {
      // Seed a notification
      const dispatch = await notificationService.dispatchNotification(TENANT_A, {
        recipientUserId: studentUserA.id,
        eventType: 'SKILL_VERIFIED',
        title: 'Skill Approved',
        message: 'Your PostgreSQL skill was verified.'
      });

      // 1. Get
      const listRes = await request(app)
        .get('/api/v1/notifications')
        .set('Authorization', `Bearer ${studentTokenA}`)
        .set('x-tenant-id', TENANT_A);

      expect(listRes.status).toBe(200);
      expect(listRes.body.unreadCount).toBeGreaterThanOrEqual(1);

      // 2. Mark Read
      const patchRes = await request(app)
        .patch(`/api/v1/notifications/${dispatch.notification.id}/read`)
        .set('Authorization', `Bearer ${studentTokenA}`)
        .set('x-tenant-id', TENANT_A);

      expect(patchRes.status).toBe(200);
      expect(patchRes.body.data.isRead).toBe(true);

      // 3. Preferences
      const prefRes = await request(app)
        .get('/api/v1/notifications/preferences')
        .set('Authorization', `Bearer ${studentTokenA}`)
        .set('x-tenant-id', TENANT_A);

      expect(prefRes.status).toBe(200);
      expect(prefRes.body.data.inAppNotifications).toBe(true);
    });

    it('GET /api/v1/orchestration/observability/stats and /events returns telemetry data', async () => {
      const statsRes = await request(app)
        .get('/api/v1/orchestration/observability/stats')
        .set('Authorization', `Bearer ${tpoTokenA}`)
        .set('x-tenant-id', TENANT_A);

      expect(statsRes.status).toBe(200);
      expect(statsRes.body.success).toBe(true);
      expect(statsRes.body.data.agentHealth).toBeDefined();

      const eventsRes = await request(app)
        .get('/api/v1/orchestration/observability/events')
        .set('Authorization', `Bearer ${tpoTokenA}`)
        .set('x-tenant-id', TENANT_A);

      expect(eventsRes.status).toBe(200);
      expect(eventsRes.body.success).toBe(true);
    });
  });
});
