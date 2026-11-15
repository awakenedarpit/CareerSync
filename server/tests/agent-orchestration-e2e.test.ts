/**
 * CarrerSync Phase 15 — Autonomous Placement Orchestration & End-to-End Multi-Agent Integration Tests
 *
 * Exhaustive verification covering the 12 required integration test scenarios:
 * 1. Student onboarding through profile approval workflow (WF_STUDENT_ONBOARDING_PROFILING).
 * 2. Evidence submission through TPO verification with verified skill update (WF_EVIDENCE_VERIFICATION_DISPATCH).
 * 3. Career selection through skill-gap analysis and learning roadmap generation (WF_CAREER_INTELLIGENCE_MATCH).
 * 4. Learning recommendation through progress tracking (WF_PREPARATION_LEARNING_SYNC).
 * 5. Mock assessment completion through readiness indicators update (profiling-assessments-to-predictive contract).
 * 6. Recruiter job submission through TPO opportunity activation (Draft -> TPO Activation RBAC).
 * 7. Student drive eligibility evaluation with explainable matching (WF_PLACEMENT_DRIVE_ELIGIBILITY).
 * 8. Candidate shortlisting through TPO review and approval (WF_CANDIDATE_SHORTLIST_REVIEW).
 * 9. Offer workflow through placement confirmation and analytics update (WF_PLACEMENT_OUTCOME_CONFIRMATION).
 * 10. Agent failure handling, timeout, and safe retry recovery.
 * 11. Duplicate event and workflow execution prevention via idempotency key.
 * 12. Cross-tenant isolation and revocable reviewer delegation security (Stop-Gate 5).
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
  registerWorkflow,
  validateProfilingToSkillGapInput,
  validateProfilingToSkillGapOutput,
  validateSkillGapToLearningInput,
  validateSkillGapToLearningOutput,
  validateProfilingAssessmentsToPredictiveInput,
  validateProfilingAssessmentsToPredictiveOutput,
  validateMultiAgentToPlacementInput,
  validateMultiAgentToPlacementOutput,
  type WorkflowDefinition,
  type WorkflowStepExecutionContext
} from '../src/orchestration';
import { z } from 'zod';

describe('Phase 15 — End-to-End Agent Orchestration & Platform Reliability', () => {
  const TENANT_ALPHA = 'aaaaaaaa-1111-4111-8111-aaaaaaaaaaaa';
  const TENANT_BETA = 'bbbbbbbb-2222-4222-8222-bbbbbbbbbbbb';

  // Tenant Alpha Actors
  const tpoAlpha = {
    id: '11111111-aaaa-4111-8111-111111111111',
    email: 'tpo.director@alpha.edu',
    role: 'TPO_ADMIN',
    tenantId: TENANT_ALPHA
  };

  const facultyAlpha = {
    id: '22222222-aaaa-4111-8111-222222222222',
    email: 'faculty.lead@alpha.edu',
    role: 'FACULTY_COORDINATOR',
    tenantId: TENANT_ALPHA
  };

  const studentAlpha = {
    id: '33333333-aaaa-4111-8111-333333333333',
    email: 'aarav.patel@student.alpha.edu',
    role: 'STUDENT',
    tenantId: TENANT_ALPHA
  };

  const recruiterAlpha = {
    id: '44444444-aaaa-4111-8111-444444444444',
    email: 'talent.scout@innovate.io',
    role: 'RECRUITER',
    tenantId: TENANT_ALPHA
  };

  // Tenant Beta Actors (Cross-Tenant Boundary Verification)
  const tpoBeta = {
    id: '99999999-bbbb-4222-8222-999999999999',
    email: 'tpo.head@beta.ac.in',
    role: 'TPO_ADMIN',
    tenantId: TENANT_BETA
  };

  let tokenTpoAlpha: string;
  let tokenFacultyAlpha: string;
  let tokenStudentAlpha: string;
  let tokenRecruiterAlpha: string;
  let tokenTpoBeta: string;

  beforeAll(async () => {
    tokenTpoAlpha = await createJwtToken({
      sub: tpoAlpha.id,
      tenant_id: tpoAlpha.tenantId,
      role: tpoAlpha.role,
      email: tpoAlpha.email
    });

    tokenFacultyAlpha = await createJwtToken({
      sub: facultyAlpha.id,
      tenant_id: facultyAlpha.tenantId,
      role: facultyAlpha.role,
      email: facultyAlpha.email
    });

    tokenStudentAlpha = await createJwtToken({
      sub: studentAlpha.id,
      tenant_id: studentAlpha.tenantId,
      role: studentAlpha.role,
      email: studentAlpha.email
    });

    tokenRecruiterAlpha = await createJwtToken({
      sub: recruiterAlpha.id,
      tenant_id: recruiterAlpha.tenantId,
      role: recruiterAlpha.role,
      email: recruiterAlpha.email
    });

    tokenTpoBeta = await createJwtToken({
      sub: tpoBeta.id,
      tenant_id: tpoBeta.tenantId,
      role: tpoBeta.role,
      email: tpoBeta.email
    });
  });

  beforeEach(() => {
    agentOrchestrationService.clear();
    delegationService.clear();
    notificationService.clear();
    observabilityService.clear();
  });

  // ==========================================================================
  // Scenario 1: Student Onboarding Through Profile Approval Workflow
  // ==========================================================================
  describe('Scenario 1: Student onboarding through profile approval workflow', () => {
    it('executes WF_STUDENT_ONBOARDING_PROFILING pipeline from ingestion to completeness scoring', async () => {
      const payload = {
        workflowDefinitionId: 'WF_STUDENT_ONBOARDING_PROFILING',
        inputPayload: {
          studentId: studentAlpha.id,
          rawProfile: {
            fullName: 'Aarav Patel',
            skills: ['TypeScript', 'Node.js', 'PostgreSQL', 'Docker', 'React'],
            projects: ['Cloud Orchestrator', 'Microservice Auth']
          },
          documentUrl: 'https://storage.carrersync.internal/resumes/aarav.pdf'
        }
      };

      const res = await request(app)
        .post('/api/v1/orchestration/workflows')
        .set('Authorization', `Bearer ${tokenStudentAlpha}`)
        .send(payload);

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.workflowDefinitionId).toBe('WF_STUDENT_ONBOARDING_PROFILING');
      expect(res.body.data.status).toBe('COMPLETED');
      expect(res.body.data.outputResultJson).toBeDefined();

      const output = res.body.data.outputResultJson?.stepOutputs?.step_completeness_calc ||
        res.body.data.steps?.find((s: any) => s.stepIndex === 3)?.outputJson;
      expect(output.studentId).toBe(studentAlpha.id);
      expect(output.profileCompletenessScore).toBeGreaterThanOrEqual(80);
      expect(output.extractedSkills).toContain('TypeScript');
      expect(output.status).toBe('COMPLETED');

      // Verify in-app notification delivered
      const notifsRes = await request(app)
        .get('/api/v1/notifications')
        .set('Authorization', `Bearer ${tokenStudentAlpha}`);

      expect(notifsRes.status).toBe(200);
      expect(notifsRes.body.total).toBeGreaterThanOrEqual(1);
      expect(notifsRes.body.data[0].eventType).toBe('WORKFLOW_COMPLETED');
    });

    it('rejects onboarding workflow if input fails Zod schema validation', async () => {
      const res = await request(app)
        .post('/api/v1/orchestration/workflows')
        .set('Authorization', `Bearer ${tokenStudentAlpha}`)
        .send({
          workflowDefinitionId: 'WF_STUDENT_ONBOARDING_PROFILING',
          inputPayload: {
            studentId: 'not-a-valid-uuid',
            rawProfile: {}
          }
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toContain('validation failed');
    });
  });

  // ==========================================================================
  // Scenario 2: Evidence Submission Through TPO Verification with Verified Skill Update
  // ==========================================================================
  describe('Scenario 2: Evidence submission through TPO verification with verified skill update', () => {
    it('halts at TPO approval gate and completes only upon explicit human authorization', async () => {
      // Step A: Student dispatches evidence verification
      const submitRes = await request(app)
        .post('/api/v1/orchestration/workflows')
        .set('Authorization', `Bearer ${tokenStudentAlpha}`)
        .send({
          workflowDefinitionId: 'WF_EVIDENCE_VERIFICATION_DISPATCH',
          inputPayload: {
            studentId: studentAlpha.id,
            skillName: 'Distributed Systems',
            evidenceUrl: 'https://github.com/aarav/raft-consensus-impl',
            evidenceType: 'GITHUB_REPOSITORY'
          }
        });

      expect(submitRes.status).toBe(201);
      const workflowId = submitRes.body.data.id;
      expect(submitRes.body.data.status).toBe('WAITING_FOR_REVIEW');

      // Step B: Student cannot self-approve their own evidence
      const studentAttemptRes = await request(app)
        .post(`/api/v1/orchestration/workflows/${workflowId}/approve`)
        .set('Authorization', `Bearer ${tokenStudentAlpha}`)
        .send({
          action: 'APPROVED',
          reviewerNotes: 'Attempting self verification'
        });

      expect(studentAttemptRes.status).toBe(403);

      // Step C: TPO Admin reviews and formally approves evidence
      const approveRes = await request(app)
        .post(`/api/v1/orchestration/workflows/${workflowId}/approve`)
        .set('Authorization', `Bearer ${tokenTpoAlpha}`)
        .send({
          action: 'APPROVED',
          reviewerNotes: 'Verified clean Raft leader election and log replication implementation.'
        });

      expect(approveRes.status).toBe(200);
      expect(approveRes.body.data.status).toBe('COMPLETED');

      // Step D: Verify output commit reflects verified skill state
      const finalWf = await agentOrchestrationService.getWorkflow(TENANT_ALPHA, workflowId);
      const commitOutput = finalWf?.outputResultJson?.stepOutputs?.step_verification_commit;
      expect(commitOutput?.verified).toBe(true);
      expect(commitOutput?.skillName).toBe('Distributed Systems');
      expect(commitOutput?.studentId).toBe(studentAlpha.id);
    });

    it('marks workflow failed when TPO rejects evidence with explanatory feedback', async () => {
      const submitRes = await request(app)
        .post('/api/v1/orchestration/workflows')
        .set('Authorization', `Bearer ${tokenStudentAlpha}`)
        .send({
          workflowDefinitionId: 'WF_EVIDENCE_VERIFICATION_DISPATCH',
          inputPayload: {
            studentId: studentAlpha.id,
            skillName: 'Kubernetes',
            evidenceUrl: 'https://storage.carrersync.internal/certs/k8s-fake.pdf',
            evidenceType: 'CERTIFICATION'
          }
        });

      const workflowId = submitRes.body.data.id;

      const rejectRes = await request(app)
        .post(`/api/v1/orchestration/workflows/${workflowId}/approve`)
        .set('Authorization', `Bearer ${tokenTpoAlpha}`)
        .send({
          action: 'REJECTED',
          reviewerNotes: 'Certificate ID could not be validated with issuing authority.'
        });

      expect(rejectRes.status).toBe(200);
      expect(rejectRes.body.data.status).toBe('FAILED');
      expect(rejectRes.body.data.errorDetailsJson.rejectionReason).toContain('Certificate ID could not be validated');
    });
  });

  // ==========================================================================
  // Scenario 3: Career Selection Through Skill-Gap Analysis and Roadmap Generation
  // ==========================================================================
  describe('Scenario 3: Career selection through skill-gap analysis and learning roadmap generation', () => {
    it('validates contract and executes WF_CAREER_INTELLIGENCE_MATCH', async () => {
      const contractInput = {
        studentId: studentAlpha.id,
        tenantId: TENANT_ALPHA,
        approvedProfile: {
          headline: 'Full Stack Systems Engineer',
          summary: 'Passionate about scalable distributed architecture and cloud platforms.',
          education: [
            {
              institution: 'Alpha Institute of Technology',
              degree: 'Bachelor of Technology',
              fieldOfStudy: 'Computer Science & Engineering',
              cgpa: 8.8
            }
          ],
          experience: [],
          projects: [
            { title: 'Cloud Orchestrator', tech: ['TypeScript', 'Node.js'] }
          ],
          profileCompletenessScore: 92
        },
        verifiedSkills: [
          {
            skillName: 'TypeScript',
            proficiency: 'ADVANCED',
            verifiedBy: tpoAlpha.id,
            verifiedAt: new Date().toISOString(),
            evidenceRefs: ['evidence-ts-01']
          },
          {
            skillName: 'Node.js',
            proficiency: 'INTERMEDIATE',
            verifiedBy: tpoAlpha.id,
            verifiedAt: new Date().toISOString(),
            evidenceRefs: ['evidence-node-02']
          },
          {
            skillName: 'PostgreSQL',
            proficiency: 'INTERMEDIATE',
            verifiedBy: tpoAlpha.id,
            verifiedAt: new Date().toISOString(),
            evidenceRefs: ['evidence-pg-03']
          }
        ],
        evidenceRefs: ['evidence-ts-01', 'evidence-node-02', 'evidence-pg-03'],
        targetRole: 'Backend Engineer'
      };

      // Direct contract boundary verification
      const parsed = validateProfilingToSkillGapInput(contractInput);
      expect(parsed.targetRole).toBe('Backend Engineer');

      const res = await request(app)
        .post('/api/v1/orchestration/workflows')
        .set('Authorization', `Bearer ${tokenStudentAlpha}`)
        .send({
          workflowDefinitionId: 'WF_CAREER_INTELLIGENCE_MATCH',
          inputPayload: contractInput
        });

      expect(res.status).toBe(201);
      expect(res.body.data.status).toBe('COMPLETED');

      const gapOutput = res.body.data.outputResultJson.stepOutputs.step_gap_analysis;
      expect(gapOutput.matchedSkills).toEqual(
        expect.arrayContaining(['TypeScript', 'Node.js', 'PostgreSQL'])
      );
      expect(gapOutput.missingEvidence).toContain('System Design');
      expect(gapOutput.missingEvidence).toContain('Docker');
      expect(gapOutput.confidence).toBeGreaterThan(0.85);

      // Verify output conforms to Zod contract
      const validatedOutput = validateProfilingToSkillGapOutput(gapOutput);
      expect(validatedOutput.skillGaps.length).toBeGreaterThan(0);
    });
  });

  // ==========================================================================
  // Scenario 4: Learning Recommendation Through Progress Tracking
  // ==========================================================================
  describe('Scenario 4: Learning recommendation through progress tracking', () => {
    it('translates identified skill gaps into prioritized adaptive learning tasks', async () => {
      const learningInput = {
        targetRole: 'Cloud Architect',
        skillRequirements: [
          { skillName: 'Kubernetes', requiredProficiency: 'ADVANCED' },
          { skillName: 'Terraform', requiredProficiency: 'INTERMEDIATE' }
        ],
        studentSkillProfile: {
          verifiedSkills: ['Docker', 'Linux'],
          gapSkills: ['Kubernetes', 'Terraform']
        },
        assessmentResults: [
          { assessmentType: 'CODING', score: 45, evaluatedAt: new Date().toISOString() }
        ]
      };

      // Zod contract check
      validateSkillGapToLearningInput(learningInput);

      const res = await request(app)
        .post('/api/v1/orchestration/workflows')
        .set('Authorization', `Bearer ${tokenStudentAlpha}`)
        .send({
          workflowDefinitionId: 'WF_PREPARATION_LEARNING_SYNC',
          inputPayload: learningInput
        });

      expect(res.status).toBe(201);
      expect(res.body.data.status).toBe('COMPLETED');

      const taskOutput = res.body.data.outputResultJson.stepOutputs.step_task_synthesis;
      expect(taskOutput.recommendedTasks.length).toBe(2);
      expect(taskOutput.priority).toBe('HIGH');
      expect(taskOutput.recommendedTasks[0].estimatedHours).toBeGreaterThan(0);

      // Verify output against contract
      const validatedOutput = validateSkillGapToLearningOutput(taskOutput);
      expect(validatedOutput.recommendedTasks[0].skillTarget).toBe('Kubernetes');
    });
  });

  // ==========================================================================
  // Scenario 5: Mock Assessment Completion Through Readiness Indicators Update
  // ==========================================================================
  describe('Scenario 5: Mock assessment completion through readiness indicators update', () => {
    it('validates contract synthesizing assessments and profiling into predictive readiness signals', async () => {
      const contractInput = {
        verifiedSkills: [
          { skillName: 'TypeScript', proficiency: 'ADVANCED' },
          { skillName: 'PostgreSQL', proficiency: 'INTERMEDIATE' },
          { skillName: 'Go', proficiency: 'INTERMEDIATE' }
        ],
        evidenceCoverage: 0.85,
        assessmentResults: [
          { assessmentType: 'CODING', score: 88, completedAt: new Date().toISOString() },
          { assessmentType: 'SYSTEM_DESIGN', score: 78, completedAt: new Date().toISOString() },
          { assessmentType: 'INTERVIEW_PRACTICE', score: 82, completedAt: new Date().toISOString() }
        ],
        historicalOutcomes: [
          { driveType: 'CAMPUS', outcome: 'PLACED' }
        ]
      };

      const parsedInput = validateProfilingAssessmentsToPredictiveInput(contractInput);
      expect(parsedInput.verifiedSkills.length).toBe(3);

      const predictiveOutcome = {
        readinessIndicators: {
          technicalScore: 88,
          softSkillScore: 82,
          overallReadiness: 84.5,
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

      const parsedOutput = validateProfilingAssessmentsToPredictiveOutput(predictiveOutcome);
      expect(parsedOutput.readinessIndicators.readinessClassification).toBe('HIGH_READINESS');
      expect(parsedOutput.predictionAvailability).toBe(true);
    });
  });

  // ==========================================================================
  // Scenario 6: Recruiter Job Submission Through TPO Opportunity Activation
  // ==========================================================================
  describe('Scenario 6: Recruiter job submission through TPO opportunity activation', () => {
    it('enforces recruiter job initial DRAFT status and requires TPO activation', async () => {
      const jobPayload = {
        companyName: 'Apex Cloud Systems',
        jobTitle: 'Senior Systems Engineer',
        jobDescription: 'Building resilient low-latency distributed messaging backends.',
        departments: ['Computer Science', 'Information Technology'],
        minCgpa: 7.5,
        allowedBacklogs: 0,
        requiredSkills: [
          { name: 'Distributed Systems', importance: 'MANDATORY', minimumProficiency: 'INTERMEDIATE' },
          { name: 'Rust', importance: 'PREFERRED', minimumProficiency: 'INTERMEDIATE' }
        ]
      };

      // 1. Recruiter submits job posting
      const createRes = await request(app)
        .post('/api/v1/jobs')
        .set('Authorization', `Bearer ${tokenRecruiterAlpha}`)
        .send(jobPayload);

      expect(createRes.status).toBe(201);
      const jobId = createRes.body.id || createRes.body.job.id;
      expect(createRes.body.job.status).toBe('DRAFT');

      // 2. Student cannot view draft job postings
      const studentJobsRes = await request(app)
        .get('/api/v1/jobs')
        .set('Authorization', `Bearer ${tokenStudentAlpha}`);

      expect(studentJobsRes.status).toBe(200);
      const studentVisibleJobIds = (studentJobsRes.body.jobs || []).map((j: any) => j.id);
      expect(studentVisibleJobIds).not.toContain(jobId);

      // 3. Recruiter cannot self-activate the job posting
      const recruiterActivateRes = await request(app)
        .put(`/api/v1/jobs/${jobId}`)
        .set('Authorization', `Bearer ${tokenRecruiterAlpha}`)
        .send({ status: 'ACTIVE' });

      // Recruiter edits always force status back to DRAFT or reject activation
      if (recruiterActivateRes.status === 200) {
        expect(recruiterActivateRes.body.job.status).toBe('DRAFT');
      }

      // 4. TPO Admin activates the job opportunity
      const tpoActivateRes = await request(app)
        .put(`/api/v1/jobs/${jobId}`)
        .set('Authorization', `Bearer ${tokenTpoAlpha}`)
        .send({ status: 'ACTIVE' });

      expect(tpoActivateRes.status).toBe(200);
      expect(tpoActivateRes.body.job.status).toBe('ACTIVE');

      // 5. Now student can view the activated job posting
      const studentJobsActiveRes = await request(app)
        .get('/api/v1/jobs')
        .set('Authorization', `Bearer ${tokenStudentAlpha}`);

      expect(studentJobsActiveRes.status).toBe(200);
      const activeJob = (studentJobsActiveRes.body.jobs || []).find((j: any) => j.id === jobId);
      expect(activeJob).toBeDefined();
    });
  });

  // ==========================================================================
  // Scenario 7: Student Drive Eligibility Evaluation with Explainable Matching
  // ==========================================================================
  describe('Scenario 7: Student drive eligibility evaluation with explainable matching', () => {
    const jobId = '88888888-8888-4888-8888-888888888888';

    it('evaluates eligible candidate meeting all institutional and academic criteria', async () => {
      const res = await request(app)
        .post('/api/v1/orchestration/workflows')
        .set('Authorization', `Bearer ${tokenTpoAlpha}`)
        .send({
          workflowDefinitionId: 'WF_PLACEMENT_DRIVE_ELIGIBILITY',
          inputPayload: {
            jobId,
            studentId: studentAlpha.id,
            studentCgpa: 8.8,
            minCgpa: 7.5,
            department: 'Computer Science',
            allowedDepartments: ['Computer Science', 'Information Technology'],
            attendancePercentage: 88,
            backlogCount: 0
          }
        });

      expect(res.status).toBe(201);
      expect(res.body.data.status).toBe('COMPLETED');
      const output = res.body.data.outputResultJson.stepOutputs.step_criteria_check;
      expect(output.isEligible).toBe(true);
      expect(output.eligibilityReasons).toContain('Met all criteria');
    });

    it('evaluates ineligible candidate with comprehensive explainable diagnostic reasons', async () => {
      const res = await request(app)
        .post('/api/v1/orchestration/workflows')
        .set('Authorization', `Bearer ${tokenTpoAlpha}`)
        .send({
          workflowDefinitionId: 'WF_PLACEMENT_DRIVE_ELIGIBILITY',
          inputPayload: {
            jobId,
            studentId: studentAlpha.id,
            studentCgpa: 6.8, // Below 7.5
            minCgpa: 7.5,
            department: 'Mechanical Engineering', // Not allowed
            allowedDepartments: ['Computer Science', 'Information Technology'],
            attendancePercentage: 68, // Below 75%
            backlogCount: 2 // Has backlogs
          }
        });

      expect(res.status).toBe(201);
      const output = res.body.data.outputResultJson.stepOutputs.step_criteria_check;
      expect(output.isEligible).toBe(false);
      expect(output.eligibilityReasons.length).toBe(4);
      expect(output.eligibilityReasons[0]).toContain('CGPA 6.8 is below minimum requirement 7.5');
      expect(output.eligibilityReasons[1]).toContain('Department Mechanical Engineering is not in allowed departments');
      expect(output.eligibilityReasons[2]).toContain('Attendance 68% is below 75% threshold');
      expect(output.eligibilityReasons[3]).toContain('Active backlogs (2) disqualify candidate');
    });
  });

  // ==========================================================================
  // Scenario 8: Candidate Shortlisting Through TPO Review and Approval
  // ==========================================================================
  describe('Scenario 8: Candidate shortlisting through TPO review and approval', () => {
    it('synthesizes multi-agent matches, halts for mandatory TPO review, and finalizes upon approval', async () => {
      const shortlistContractInput = {
        jobRequirements: {
          jobId: '77777777-7777-4777-8777-777777777777',
          title: 'Fullstack Architect',
          requiredSkills: ['TypeScript', 'React', 'Node.js'],
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
            studentId: studentAlpha.id,
            matchedSkillCount: 3,
            totalSkillsRequired: 3,
            matchPercentage: 92
          },
          {
            studentId: '55555555-5555-4555-8555-555555555555',
            matchedSkillCount: 2,
            totalSkillsRequired: 3,
            matchPercentage: 84
          }
        ],
        studentConsent: true,
        tpoApprovalState: {
          isApproved: true,
          approvedBy: 'tpo-director'
        }
      };

      // Contract validation
      validateMultiAgentToPlacementInput(shortlistContractInput);

      // 1. Recruiter/TPO initiates shortlisting workflow
      const initRes = await request(app)
        .post('/api/v1/orchestration/workflows')
        .set('Authorization', `Bearer ${tokenRecruiterAlpha}`)
        .send({
          workflowDefinitionId: 'WF_CANDIDATE_SHORTLIST_REVIEW',
          inputPayload: shortlistContractInput
        });

      expect(initRes.status).toBe(201);
      const workflowId = initRes.body.data.id;
      expect(initRes.body.data.status).toBe('WAITING_FOR_REVIEW');

      // 2. TPO inspects pending human approvals
      const wfDetailsRes = await request(app)
        .get(`/api/v1/orchestration/workflows/${workflowId}`)
        .set('Authorization', `Bearer ${tokenTpoAlpha}`);

      expect(wfDetailsRes.status).toBe(200);
      expect(wfDetailsRes.body.data.status).toBe('WAITING_FOR_REVIEW');
      expect(wfDetailsRes.body.data.approvals.length).toBe(1);
      expect(wfDetailsRes.body.data.approvals[0].status).toBe('PENDING');

      // 3. TPO authorizes candidate shortlist
      const approveRes = await request(app)
        .post(`/api/v1/orchestration/workflows/${workflowId}/approve`)
        .set('Authorization', `Bearer ${tokenTpoAlpha}`)
        .send({
          action: 'APPROVED',
          reviewerNotes: 'Candidate rankings verified against verified competencies and academic standing.'
        });

      expect(approveRes.status).toBe(200);
      expect(approveRes.body.data.status).toBe('COMPLETED');

      const step3Output = approveRes.body.data.outputResultJson.stepOutputs.step_shortlist_finalize;
      expect(step3Output.candidateMatches.length).toBe(2);
      expect(step3Output.candidateMatches[0].rank).toBe(1);
      expect(step3Output.reviewRequiredStatus).toBe(false);

      // Validate output contract
      validateMultiAgentToPlacementOutput(step3Output);
    });
  });

  // ==========================================================================
  // Scenario 9: Offer Workflow Through Placement Confirmation and Analytics Update
  // ==========================================================================
  describe('Scenario 9: Offer workflow through placement confirmation and analytics update', () => {
    it('processes placement confirmation through mandatory TPO verification and updates predictive models', async () => {
      const offerInput = {
        studentId: studentAlpha.id,
        jobId: '66666666-6666-4666-8666-666666666666',
        companyName: 'Apex Cloud Systems',
        ctc: 2400000,
        offerDate: new Date().toISOString(),
        acceptanceStatus: 'ACCEPTED' as const
      };

      // 1. Initiate offer confirmation workflow
      const initRes = await request(app)
        .post('/api/v1/orchestration/workflows')
        .set('Authorization', `Bearer ${tokenStudentAlpha}`)
        .send({
          workflowDefinitionId: 'WF_PLACEMENT_OUTCOME_CONFIRMATION',
          inputPayload: offerInput
        });

      expect(initRes.status).toBe(201);
      const workflowId = initRes.body.data.id;
      expect(initRes.body.data.status).toBe('WAITING_FOR_REVIEW');

      // 2. TPO formally confirms the placement offer
      const approveRes = await request(app)
        .post(`/api/v1/orchestration/workflows/${workflowId}/approve`)
        .set('Authorization', `Bearer ${tokenTpoAlpha}`)
        .send({
          action: 'APPROVED',
          reviewerNotes: 'Verified formal appointment letter and terms of employment.'
        });

      expect(approveRes.status).toBe(200);
      expect(approveRes.body.data.status).toBe('COMPLETED');

      const finalOutput = approveRes.body.data.outputResultJson.stepOutputs.step_analytics_sync;
      expect(finalOutput.confirmed).toBe(true);
      expect(finalOutput.predictiveModelUpdated).toBe(true);
      expect(finalOutput.studentId).toBe(studentAlpha.id);
    });
  });

  // ==========================================================================
  // Scenario 10: Agent Failure Handling, Timeout, and Safe Retry Recovery
  // ==========================================================================
  describe('Scenario 10: Agent failure handling, timeout, and safe retry recovery', () => {
    let transientFailCount = 0;

    const WF_TRANSIENT_FAILURE_TEST: WorkflowDefinition = {
      workflowId: 'WF_TRANSIENT_FAILURE_TEST',
      name: 'Transient Failure & Retry Test Workflow',
      description: 'Tests exponential backoff retries and explicit failure recovery.',
      triggerType: 'MANUAL_USER',
      initiatingRoles: ['TPO_ADMIN', 'SUPER_ADMIN'],
      responsibleAgent: 'CENTRAL_ORCHESTRATOR',
      requiredHumanApproval: false,
      timeoutMs: 15000,
      maxRetries: 2,
      inputSchema: z.object({
        testId: z.string()
      }),
      outputSchema: z.object({
        recovered: z.boolean(),
        attemptsTaken: z.number()
      }),
      steps: [
        {
          id: 'step_flake',
          stepName: 'Transient Flaky Step',
          stepIndex: 1,
          responsibleAgent: 'CENTRAL_ORCHESTRATOR',
          execute: async (_ctx: WorkflowStepExecutionContext) => {
            transientFailCount++;
            if (transientFailCount < 4) {
              throw new Error(`Upstream subsystem timeout (attempt ${transientFailCount})`);
            }
            return {
              recovered: true,
              attemptsTaken: transientFailCount
            };
          }
        }
      ]
    };

    beforeAll(() => {
      registerWorkflow(WF_TRANSIENT_FAILURE_TEST);
    });

    it('records step failure on exhaustion and recovers cleanly when retried', async () => {
      transientFailCount = 0;

      // 1. Initial execution fails because transientFailCount < 4 exceeds maxRetries (2)
      const initRes = await request(app)
        .post('/api/v1/orchestration/workflows')
        .set('Authorization', `Bearer ${tokenTpoAlpha}`)
        .send({
          workflowDefinitionId: 'WF_TRANSIENT_FAILURE_TEST',
          inputPayload: { testId: 'flake-01' }
        });

      expect(initRes.status).toBe(201);
      const workflowId = initRes.body.data.id;
      expect(initRes.body.data.status).toBe('FAILED');
      expect(initRes.body.data.errorDetailsJson.error).toContain('Upstream subsystem timeout');

      // Verify failure event telemetry recorded
      const eventsRes = await request(app)
        .get('/api/v1/orchestration/observability/events')
        .set('Authorization', `Bearer ${tokenTpoAlpha}`);

      expect(eventsRes.status).toBe(200);
      const failEvent = eventsRes.body.data.find(
        (e: any) => e.workflowId === workflowId && e.eventType === 'WORKFLOW_STEP_FAILED'
      );
      expect(failEvent).toBeDefined();

      // 2. TPO triggers retry
      const retryRes = await request(app)
        .post(`/api/v1/orchestration/workflows/${workflowId}/retry`)
        .set('Authorization', `Bearer ${tokenTpoAlpha}`);

      expect(retryRes.status).toBe(200);
      expect(retryRes.body.data.status).toBe('COMPLETED');
      expect(retryRes.body.data.retryCount).toBe(1);

      const stepOutput = retryRes.body.data.outputResultJson.stepOutputs.step_flake;
      expect(stepOutput.recovered).toBe(true);
    });

    it('rejects retrying a workflow that is not in FAILED status', async () => {
      const initRes = await request(app)
        .post('/api/v1/orchestration/workflows')
        .set('Authorization', `Bearer ${tokenStudentAlpha}`)
        .send({
          workflowDefinitionId: 'WF_STUDENT_ONBOARDING_PROFILING',
          inputPayload: {
            studentId: studentAlpha.id,
            rawProfile: { skills: ['Go'] }
          }
        });

      const workflowId = initRes.body.data.id;
      expect(initRes.body.data.status).toBe('COMPLETED');

      const retryRes = await request(app)
        .post(`/api/v1/orchestration/workflows/${workflowId}/retry`)
        .set('Authorization', `Bearer ${tokenTpoAlpha}`);

      expect(retryRes.status).toBe(400);
      expect(retryRes.body.error).toContain('Only failed workflows can be retried');
    });
  });

  // ==========================================================================
  // Scenario 11: Duplicate Event and Workflow Execution Prevention Via Idempotency Key
  // ==========================================================================
  describe('Scenario 11: Duplicate event and workflow execution prevention via idempotency key', () => {
    it('returns existing workflow instance and skips duplicate step execution for matching key', async () => {
      const idempotencyKey = 'idem-unique-key-99999';

      const payload = {
        workflowDefinitionId: 'WF_STUDENT_ONBOARDING_PROFILING',
        idempotencyKey,
        inputPayload: {
          studentId: studentAlpha.id,
          rawProfile: {
            skills: ['Java', 'Spring Boot']
          }
        }
      };

      // First invocation
      const res1 = await request(app)
        .post('/api/v1/orchestration/workflows')
        .set('Authorization', `Bearer ${tokenStudentAlpha}`)
        .send(payload);

      expect(res1.status).toBe(201);
      expect(res1.body.isIdempotentReplay).toBe(false);
      const originalWorkflowId = res1.body.data.id;

      // Duplicate invocation with identical idempotencyKey
      const res2 = await request(app)
        .post('/api/v1/orchestration/workflows')
        .set('Authorization', `Bearer ${tokenStudentAlpha}`)
        .send(payload);

      expect(res2.status).toBe(200);
      expect(res2.body.isIdempotentReplay).toBe(true);
      expect(res2.body.data.id).toBe(originalWorkflowId);

      // Verify no duplicate notifications or multiple workflow records
      const listRes = await request(app)
        .get('/api/v1/orchestration/workflows')
        .set('Authorization', `Bearer ${tokenTpoAlpha}`);

      const matching = listRes.body.data.filter((w: any) => w.idempotencyKey === idempotencyKey);
      expect(matching.length).toBe(1);
    });
  });

  // ==========================================================================
  // Scenario 12: Cross-Tenant Isolation and Revocable Reviewer Delegation Security
  // ==========================================================================
  describe('Scenario 12: Cross-tenant isolation and revocable reviewer delegation security', () => {
    it('strictly isolates workflows between Tenant Alpha and Tenant Beta', async () => {
      // 1. Alpha student creates workflow
      const initAlpha = await request(app)
        .post('/api/v1/orchestration/workflows')
        .set('Authorization', `Bearer ${tokenStudentAlpha}`)
        .send({
          workflowDefinitionId: 'WF_EVIDENCE_VERIFICATION_DISPATCH',
          inputPayload: {
            studentId: studentAlpha.id,
            skillName: 'System Architecture',
            evidenceUrl: 'https://alpha.internal/evidence/sys-arch.pdf',
            evidenceType: 'PORTFOLIO'
          }
        });

      const alphaWfId = initAlpha.body.data.id;

      // 2. Beta TPO cannot view Alpha workflow
      const betaViewRes = await request(app)
        .get(`/api/v1/orchestration/workflows/${alphaWfId}`)
        .set('Authorization', `Bearer ${tokenTpoBeta}`);

      expect(betaViewRes.status).toBe(404);

      // 3. Beta TPO cannot approve Alpha workflow
      const betaApproveRes = await request(app)
        .post(`/api/v1/orchestration/workflows/${alphaWfId}/approve`)
        .set('Authorization', `Bearer ${tokenTpoBeta}`)
        .send({
          action: 'APPROVED',
          reviewerNotes: 'Attempting cross-tenant approval'
        });

      expect(betaApproveRes.status).toBe(404);
    });

    it('rejects tenant spoofing when client headers contradict signed JWT token', async () => {
      const spoofRes = await request(app)
        .post('/api/v1/orchestration/workflows')
        .set('Authorization', `Bearer ${tokenStudentAlpha}`)
        .set('x-tenant-id', TENANT_BETA) // Spoofing Beta tenant while signed token is Alpha
        .send({
          workflowDefinitionId: 'WF_STUDENT_ONBOARDING_PROFILING',
          inputPayload: {
            studentId: studentAlpha.id,
            rawProfile: { skills: ['Python'] }
          }
        });

      expect(spoofRes.status).toBe(403);
      expect(spoofRes.body.error).toContain('tenant spoofing detected');
      expect(spoofRes.body.code).toBe('TENANT_SPOOFING_REJECTED');
    });

    it('enforces Stop-Gate 5: persistent reviewer delegation grant and instantaneous revocation', async () => {
      // 1. Alpha student submits evidence requiring approval
      const wfRes = await request(app)
        .post('/api/v1/orchestration/workflows')
        .set('Authorization', `Bearer ${tokenStudentAlpha}`)
        .send({
          workflowDefinitionId: 'WF_EVIDENCE_VERIFICATION_DISPATCH',
          inputPayload: {
            studentId: studentAlpha.id,
            skillName: 'Machine Learning',
            evidenceUrl: 'https://alpha.internal/ml-project.pdf',
            evidenceType: 'PROJECT'
          }
        });

      const workflowId = wfRes.body.data.id;
      expect(wfRes.body.data.status).toBe('WAITING_FOR_REVIEW');

      // 2. Before delegation, faculty coordinator cannot approve workflow
      const preDelegateRes = await request(app)
        .post(`/api/v1/orchestration/workflows/${workflowId}/approve`)
        .set('Authorization', `Bearer ${tokenFacultyAlpha}`)
        .send({
          action: 'APPROVED',
          reviewerNotes: 'Attempting approval before delegation'
        });

      expect(preDelegateRes.status).toBe(403);
      expect(preDelegateRes.body.error).toContain('does not possess TPO authority or active faculty delegation');

      // 3. TPO delegates review authority to Faculty Member
      const delegateRes = await request(app)
        .post('/api/v1/orchestration/delegation')
        .set('Authorization', `Bearer ${tokenTpoAlpha}`)
        .send({
          userId: facultyAlpha.id,
          permissions: ['VERIFY_SKILLS', 'REVIEW_EVIDENCE'],
          notes: 'Delegated for Semester 7 Capstone Evidence Verifications'
        });

      expect(delegateRes.status).toBe(201);
      const delegationId = delegateRes.body.data.id;
      expect(delegateRes.body.data.isActive).toBe(true);

      // 4. With active delegation, Faculty Member can approve workflow
      const delegatedApproveRes = await request(app)
        .post(`/api/v1/orchestration/workflows/${workflowId}/approve`)
        .set('Authorization', `Bearer ${tokenFacultyAlpha}`)
        .send({
          action: 'APPROVED',
          reviewerNotes: 'Approved under delegated TPO faculty authority.'
        });

      expect(delegatedApproveRes.status).toBe(200);
      expect(delegatedApproveRes.body.data.status).toBe('COMPLETED');

      // 5. Submit another workflow to test immediate revocation
      const wf2Res = await request(app)
        .post('/api/v1/orchestration/workflows')
        .set('Authorization', `Bearer ${tokenStudentAlpha}`)
        .send({
          workflowDefinitionId: 'WF_EVIDENCE_VERIFICATION_DISPATCH',
          inputPayload: {
            studentId: studentAlpha.id,
            skillName: 'Computer Vision',
            evidenceUrl: 'https://alpha.internal/cv-project.pdf',
            evidenceType: 'PROJECT'
          }
        });

      const wf2Id = wf2Res.body.data.id;

      // 6. TPO immediately revokes delegation
      const revokeRes = await request(app)
        .delete(`/api/v1/orchestration/delegation/${delegationId}`)
        .set('Authorization', `Bearer ${tokenTpoAlpha}`);

      expect(revokeRes.status).toBe(200);
      expect(revokeRes.body.success).toBe(true);

      // 7. Revocation takes immediate effect: Faculty Member is instantly blocked with 403
      const postRevokeRes = await request(app)
        .post(`/api/v1/orchestration/workflows/${wf2Id}/approve`)
        .set('Authorization', `Bearer ${tokenFacultyAlpha}`)
        .send({
          action: 'APPROVED',
          reviewerNotes: 'Attempting approval post-revocation'
        });

      expect(postRevokeRes.status).toBe(403);
      expect(postRevokeRes.body.error).toContain('does not possess TPO authority or active faculty delegation');
    });
  });
});
