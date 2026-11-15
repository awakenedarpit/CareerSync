/**
 * CarrerSync Phase 12 — Assessment Backend & Learning Intelligence Tests
 *
 * Comprehensive test suite validating:
 * 1. Safe Multi-Language Coding Execution Adapter (Security, AST/Syntax, Timeout, Sandboxed Runner, Hidden Masking)
 * 2. Hybrid AI Interview Practice Evaluator (12 Roles, 9 Categories, 5-Dimension Scoring, Zero-Surveillance)
 * 3. Mock Drive Service & Aptitude Engine (Sanitization, Expiry, Negative Marking, Topic Breakdown)
 * 4. Personalized Learning Path Service (Weakness-driven Roadmap, Task Lifecycle, Evidence Review Policy)
 * 5. Complete Student & TPO REST API Routes (RBAC, Multi-tenancy, Status Codes, Request Validation)
 */

import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import app from '../src/app';
import { createJwtToken } from '../src/utils/crypto';
import { codingExecutionAdapter } from '../src/assessment/coding-execution.adapter';
import { interviewEvaluator } from '../src/assessment/interview-evaluator';
import { mockDriveService } from '../src/assessment/mock-drive.service';
import { learningPathService } from '../src/assessment/learning-path.service';

describe('Phase 12 — Student Mock Drive, Assessment Engine & Learning Intelligence', () => {
  const TENANT_ID = '11111111-1111-4111-8111-111111111111';

  const studentUser = {
    id: 's1111111-1111-4111-8111-111111111111',
    email: 'student.aarav@university.edu',
    role: 'student',
    tenantId: TENANT_ID
  };

  const tpoAdminUser = {
    id: 't1111111-1111-4111-8111-111111111111',
    email: 'tpo.director@university.edu',
    role: 'tpo_admin',
    tenantId: TENANT_ID
  };

  const recruiterUser = {
    id: 'r1111111-1111-4111-8111-111111111111',
    email: 'recruiter.jane@techcorp.com',
    role: 'recruiter',
    tenantId: TENANT_ID
  };

  let studentToken: string;
  let tpoToken: string;
  let recruiterToken: string;

  beforeAll(async () => {
    studentToken = await createJwtToken({
      sub: studentUser.id,
      tenant_id: studentUser.tenantId,
      role: studentUser.role,
      email: studentUser.email
    });

    tpoToken = await createJwtToken({
      sub: tpoAdminUser.id,
      tenant_id: tpoAdminUser.tenantId,
      role: tpoAdminUser.role,
      email: tpoAdminUser.email
    });

    recruiterToken = await createJwtToken({
      sub: recruiterUser.id,
      tenant_id: recruiterUser.tenantId,
      role: recruiterUser.role,
      email: recruiterUser.email
    });
  });

  // -------------------------------------------------------------------------
  // 1. Coding Execution Adapter Tests (Security, Sandboxing, Masking)
  // -------------------------------------------------------------------------

  describe('1. Safe Coding Execution Adapter', () => {
    it('should block dangerous shell / RCE commands across supported languages', () => {
      // JS security violations
      expect(codingExecutionAdapter.validateCode('require("child_process").exec("rm -rf /")', 'javascript').isValid).toBe(false);
      expect(codingExecutionAdapter.validateCode('process.exit(1)', 'javascript').isValid).toBe(false);
      expect(codingExecutionAdapter.validateCode('const fs = require("fs")', 'javascript').isValid).toBe(false);
      expect(codingExecutionAdapter.validateCode('eval("2 + 2")', 'javascript').isValid).toBe(false);

      // Python security violations
      expect(codingExecutionAdapter.validateCode('import os\nos.system("ls")', 'python').isValid).toBe(false);
      expect(codingExecutionAdapter.validateCode('import subprocess', 'python').isValid).toBe(false);
      expect(codingExecutionAdapter.validateCode('exec("print(1)")', 'python').isValid).toBe(false);

      // Java security violations
      expect(codingExecutionAdapter.validateCode('Runtime.getRuntime().exec("sh")', 'java').isValid).toBe(false);
      expect(codingExecutionAdapter.validateCode('java.lang.reflect.Method m;', 'java').isValid).toBe(false);

      // C++ security violations
      expect(codingExecutionAdapter.validateCode('#include <sys/socket.h>', 'cpp').isValid).toBe(false);
      expect(codingExecutionAdapter.validateCode('system("whoami");', 'cpp').isValid).toBe(false);
    });

    it('should catch unbalanced brackets and syntax errors before execution', () => {
      const invalidJs = 'function test() { return (5 + 3; }';
      const val = codingExecutionAdapter.validateCode(invalidJs, 'javascript');
      expect(val.isValid).toBe(false);
      expect(val.verdict).toBe('SYNTAX_ERROR');
    });

    it('should correctly evaluate Two Sum algorithmic solution and mask hidden test cases', async () => {
      const problem = mockDriveService.getCodingProblem('code-prob-01');
      expect(problem).toBeDefined();

      const validSolution = `
        function twoSum(nums, target) {
          const map = new Map();
          for (let i = 0; i < nums.length; i++) {
            const comp = target - nums[i];
            if (map.has(comp)) return [map.get(comp), i];
            map.set(nums[i], i);
          }
        }
      `;

      // Full submission with hidden test cases
      const fullProblem = (mockDriveService as any).codingProblems.get('code-prob-01');
      const result = await codingExecutionAdapter.evaluateCode({
        problemId: 'code-prob-01',
        code: validSolution,
        language: 'javascript',
        testCases: fullProblem.testCases,
        maxScore: 100,
        isSubmission: true
      });

      expect(result.verdict).toBe('ACCEPTED');
      expect(result.passedCount).toBe(fullProblem.testCases.length);
      expect(result.score).toBe(100);

      // Verify hidden test cases NEVER expose expected output
      for (const res of result.results) {
        if (res.isHidden) {
          expect(res.expectedOutput).toBeUndefined();
          expect(res.input).toBe('[HIDDEN INPUT]');
        }
      }
    });

    it('should enforce execution timeout on infinite loops', async () => {
      const infiniteLoopCode = `
        function test() {
          while (true) {
            // infinite loop
          }
        }
      `;

      const result = await codingExecutionAdapter.evaluateCode({
        problemId: 'code-prob-01',
        code: infiniteLoopCode,
        language: 'javascript',
        testCases: [
          { id: 'tc-test', input: '10', expectedOutput: '10', isHidden: false }
        ],
        maxScore: 100,
        timeoutMs: 200
      });

      expect(result.verdict).toBe('TIME_LIMIT_EXCEEDED');
      expect(result.results[0].passed).toBe(false);
      expect(result.results[0].errorMessage).toContain('timeout');
    });
  });

  // -------------------------------------------------------------------------
  // 2. Hybrid Interview Practice Evaluator Tests
  // -------------------------------------------------------------------------

  describe('2. Hybrid Interview Practice Evaluator', () => {
    it('should support all 12 standard target roles and 9 categories', () => {
      const roles = interviewEvaluator.getSupportedRoles();
      expect(roles).toHaveLength(12);
      expect(roles).toContain('Software Engineer');
      expect(roles).toContain('Full Stack Developer');
      expect(roles).toContain('DevOps Engineer');
      expect(roles).toContain('Cybersecurity Analyst');

      const categories = interviewEvaluator.getSupportedCategories();
      expect(categories).toHaveLength(9);
      expect(categories).toContain('Data Structures and Algorithms');
      expect(categories).toContain('Operating Systems');
      expect(categories).toContain('HR and Communication');
    });

    it('should perform 5-dimension deterministic scoring on technical answers', async () => {
      const questions = interviewEvaluator.getQuestionsForRole('Software Engineer', 1);
      expect(questions.length).toBeGreaterThan(0);
      const question = questions[0];

      const richAnswer = `
        Arrays allocate contiguous blocks of memory allowing O(1) constant time random access.
        However, inserting at the start requires shifting all subsequent elements O(n).
        Linked lists use non-contiguous nodes linked by pointer storage, providing O(1) insertion at head
        but requiring O(n) sequential traversal to search for an element.
      `;

      const evalResult = await interviewEvaluator.evaluateAnswer(question, richAnswer);

      expect(evalResult.dimensions).toBeDefined();
      expect(evalResult.dimensions.correctness).toBeGreaterThanOrEqual(70);
      expect(evalResult.dimensions.conceptUnderstanding).toBeGreaterThanOrEqual(70);
      expect(evalResult.dimensions.completeness).toBeGreaterThanOrEqual(70);
      expect(evalResult.dimensions.relevance).toBeGreaterThanOrEqual(70);
      expect(evalResult.dimensions.clarity).toBeGreaterThanOrEqual(70);
      expect(evalResult.dimensions.overallScore).toBeGreaterThanOrEqual(70);
      expect(evalResult.strengths.length).toBeGreaterThan(0);
      expect(evalResult.suggestedAnswerModel).toBeDefined();
    });

    it('should generate an aggregated session report with dimensional averages', () => {
      const session = mockDriveService.startInterviewPractice({
        studentId: studentUser.id,
        tenantId: TENANT_ID,
        targetRole: 'Software Engineer',
        questionCount: 3
      });

      expect(session.questions).toHaveLength(3);
      expect(session.status).toBe('IN_PROGRESS');

      const report = mockDriveService.submitInterviewSession(session.id, studentUser.id);
      expect(report.sessionId).toBe(session.id);
      expect(report.targetRole).toBe('Software Engineer');
      expect(report.dimensionAverages).toBeDefined();
    });
  });

  // -------------------------------------------------------------------------
  // 3. Mock Drive & Aptitude Engine Tests
  // -------------------------------------------------------------------------

  describe('3. Mock Drive Service & Aptitude Engine', () => {
    it('should never leak correctOptionId or explanation to students in questions', () => {
      const sanitized = mockDriveService.getSanitizedAptitudeQuestions(undefined, 5);
      expect(sanitized.length).toBeGreaterThan(0);

      for (const q of sanitized) {
        expect((q as any).correctOptionId).toBeUndefined();
        expect((q as any).explanation).toBeUndefined();
        expect(q.options.length).toBeGreaterThanOrEqual(2);
      }
    });

    it('should accurately calculate aptitude score with negative marking and topic breakdown', () => {
      const attempt = mockDriveService.startAptitudeAttempt({
        studentId: studentUser.id,
        tenantId: TENANT_ID,
        durationMinutes: 30,
        questionCount: 4
      });

      expect(attempt.status).toBe('IN_PROGRESS');
      expect(attempt.questions).toHaveLength(4);

      // Answer first 2 questions correctly, 1 incorrectly, 1 unattempted
      const originalQ1 = (mockDriveService as any).mcqQuestions.get(attempt.questions[0].id);
      const originalQ2 = (mockDriveService as any).mcqQuestions.get(attempt.questions[1].id);
      const originalQ3 = (mockDriveService as any).mcqQuestions.get(attempt.questions[2].id);

      const wrongOpt = originalQ3.options.find((o: any) => o.id !== originalQ3.correctOptionId)!.id;

      const submission = mockDriveService.submitAptitudeAttempt({
        attemptId: attempt.id,
        studentId: studentUser.id,
        tenantId: TENANT_ID,
        finalAnswers: {
          [originalQ1.id]: originalQ1.correctOptionId,
          [originalQ2.id]: originalQ2.correctOptionId,
          [originalQ3.id]: wrongOpt
        }
      });

      expect(submission.status).toBe('SUBMITTED');
      expect(submission.score).toBeGreaterThan(0);
      expect(submission.topicBreakdown).toBeDefined();
      expect(submission.reviewDetails).toHaveLength(4);
    });

    it('should generate performance reports and map skill weaknesses correctly', () => {
      const report = mockDriveService.generatePerformanceReport({
        studentId: studentUser.id,
        tenantId: TENANT_ID,
        driveId: 'mock-drive-standard-01'
      });

      expect(report.overallCompositeScore).toBeGreaterThanOrEqual(0);
      expect(report.roundScores.aptitude).toBeDefined();
      expect(report.roundScores.coding).toBeDefined();
      expect(report.roundScores.interview).toBeDefined();
      expect(report.skillVerdicts.length).toBeGreaterThan(0);

      const weakness = mockDriveService.getStudentWeaknessSummary(studentUser.id, TENANT_ID);
      expect(weakness.studentId).toBe(studentUser.id);
      expect(weakness.assessedStrengths).toBeDefined();
      expect(weakness.improvementNeeded).toBeDefined();
    });
  });

  // -------------------------------------------------------------------------
  // 4. Personalized Learning Path Tests
  // -------------------------------------------------------------------------

  describe('4. Personalized Learning Path Service', () => {
    it('should synthesize a tailored roadmap based on target role and weaknesses', async () => {
      const path = await learningPathService.generatePersonalizedPath({
        studentId: studentUser.id,
        tenantId: TENANT_ID,
        targetRole: 'Full Stack Developer'
      });

      expect(path.studentId).toBe(studentUser.id);
      expect(path.targetRole).toBe('Full Stack Developer');
      expect(path.tasks.length).toBeGreaterThan(0);
      expect(path.tasks[0].status).toBe('RECOMMENDED');
    });

    it('should transition task lifecycle statuses cleanly', async () => {
      const path = await learningPathService.getLearningPath(studentUser.id, TENANT_ID);
      const taskId = path.tasks[0].id;

      // RECOMMENDED -> IN_PROGRESS
      const inProgressTask = learningPathService.updateTaskStatus({
        studentId: studentUser.id,
        tenantId: TENANT_ID,
        taskId,
        status: 'IN_PROGRESS'
      });
      expect(inProgressTask.status).toBe('IN_PROGRESS');

      // IN_PROGRESS -> PAUSED
      const pausedTask = learningPathService.updateTaskStatus({
        studentId: studentUser.id,
        tenantId: TENANT_ID,
        taskId,
        status: 'PAUSED'
      });
      expect(pausedTask.status).toBe('PAUSED');
    });

    it('should submit evidence and enforce policy: task remains PENDING_REVIEW (never auto-VERIFIED)', async () => {
      const path = await learningPathService.getLearningPath(studentUser.id, TENANT_ID);
      const taskId = path.tasks[0].id;

      // Set to IN_PROGRESS first
      learningPathService.updateTaskStatus({
        studentId: studentUser.id,
        tenantId: TENANT_ID,
        taskId,
        status: 'IN_PROGRESS'
      });

      const submittedTask = learningPathService.submitTaskEvidence({
        studentId: studentUser.id,
        tenantId: TENANT_ID,
        taskId,
        submissionType: 'REPOSITORY',
        urlOrContent: 'https://github.com/aarav/carrersync-microservice-clean-arch',
        notes: 'Implemented clean architecture with 85% test coverage.'
      });

      expect(submittedTask.status).toBe('SUBMITTED_FOR_REVIEW');
      expect(submittedTask.evidence).toBeDefined();
      expect(submittedTask.evidence?.status).toBe('PENDING_REVIEW'); // NEVER auto-VERIFIED!
    });
  });

  // -------------------------------------------------------------------------
  // 5. REST API Integration Tests
  // -------------------------------------------------------------------------

  describe('5. REST API Routes & RBAC Integration', () => {
    // A. Student Aptitude Assessment API
    it('GET /api/v1/student/assessments/aptitude/questions should return sanitized questions', async () => {
      const res = await request(app)
        .get('/api/v1/student/assessments/aptitude/questions')
        .set('Authorization', `Bearer ${studentToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.questions)).toBe(true);
      // Ensure answer leak prevention
      expect(res.body.questions[0].correctOptionId).toBeUndefined();
    });

    it('POST /api/v1/student/assessments/aptitude/start and submit workflow', async () => {
      const startRes = await request(app)
        .post('/api/v1/student/assessments/aptitude/start')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({ durationMinutes: 15, questionCount: 3 });

      expect(startRes.status).toBe(201);
      expect(startRes.body.success).toBe(true);
      const attemptId = startRes.body.attempt.id;

      // Save intermediate progress
      const saveRes = await request(app)
        .post(`/api/v1/student/assessments/aptitude/${attemptId}/save`)
        .set('Authorization', `Bearer ${studentToken}`)
        .send({ answers: { 'apt-quant-01': 'opt-2' } });

      expect(saveRes.status).toBe(200);
      expect(saveRes.body.success).toBe(true);

      // Submit attempt
      const submitRes = await request(app)
        .post(`/api/v1/student/assessments/aptitude/${attemptId}/submit`)
        .set('Authorization', `Bearer ${studentToken}`)
        .send({ answers: { 'apt-quant-01': 'opt-2' } });

      expect(submitRes.status).toBe(200);
      expect(submitRes.body.success).toBe(true);
      expect(submitRes.body.score).toBeDefined();
      expect(submitRes.body.topicBreakdown).toBeDefined();
    });

    // B. Student Coding Assessment API
    it('GET /api/v1/student/assessments/coding/problems should return problem list with sanitized test cases', async () => {
      const res = await request(app)
        .get('/api/v1/student/assessments/coding/problems')
        .set('Authorization', `Bearer ${studentToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.problems.length).toBeGreaterThan(0);
      expect(res.body.problems[0].visibleTestCases).toBeDefined();
      expect(res.body.problems[0].testCases).toBeUndefined(); // Hidden cases omitted
    });

    it('POST /api/v1/student/assessments/coding/problems/:problemId/run dry runs code', async () => {
      const res = await request(app)
        .post('/api/v1/student/assessments/coding/problems/code-prob-01/run')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          code: 'function twoSum(nums, target) { return [0,1]; }',
          language: 'javascript'
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.result.verdict).toBeDefined();
    });

    // C. Student Interview Practice API
    it('GET /api/v1/student/interviews/practice/roles should list supported roles', async () => {
      const res = await request(app)
        .get('/api/v1/student/interviews/practice/roles')
        .set('Authorization', `Bearer ${studentToken}`);

      expect(res.status).toBe(200);
      expect(res.body.roles).toHaveLength(12);
      expect(res.body.categories).toHaveLength(9);
    });

    it('POST /api/v1/student/interviews/practice/start, answer, and submit', async () => {
      const startRes = await request(app)
        .post('/api/v1/student/interviews/practice/start')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({ targetRole: 'Backend Developer', questionCount: 2 });

      expect(startRes.status).toBe(201);
      const sessionId = startRes.body.session.id;
      const questionId = startRes.body.session.questions[0].id;

      // Answer question
      const answerRes = await request(app)
        .post(`/api/v1/student/interviews/practice/${sessionId}/answer`)
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          questionId,
          answerText: 'ACID properties guarantee atomicity, consistency, isolation, and durability. PostgreSQL uses MVCC and WAL logs.'
        });

      expect(answerRes.status).toBe(200);
      expect(answerRes.body.evaluation.dimensions).toBeDefined();

      // Submit session
      const submitRes = await request(app)
        .post(`/api/v1/student/interviews/practice/${sessionId}/submit`)
        .set('Authorization', `Bearer ${studentToken}`);

      expect(submitRes.status).toBe(200);
      expect(submitRes.body.report).toBeDefined();
    });

    // D. Mock Drives & Reports API
    it('GET /api/v1/student/mock-drives lists available placement simulations', async () => {
      const res = await request(app)
        .get('/api/v1/student/mock-drives')
        .set('Authorization', `Bearer ${studentToken}`);

      expect(res.status).toBe(200);
      expect(res.body.drives.length).toBeGreaterThan(0);
    });

    it('GET /api/v1/student/mock-drives/reports returns student performance history', async () => {
      const res = await request(app)
        .get('/api/v1/student/mock-drives/reports')
        .set('Authorization', `Bearer ${studentToken}`);

      expect(res.status).toBe(200);
      expect(res.body.reports.length).toBeGreaterThan(0);
    });

    it('GET /api/v1/student/mock-drives/weaknesses returns diagnosed strengths and gaps', async () => {
      const res = await request(app)
        .get('/api/v1/student/mock-drives/weaknesses?targetRole=Software%20Engineer')
        .set('Authorization', `Bearer ${studentToken}`);

      expect(res.status).toBe(200);
      expect(res.body.weaknesses.assessedStrengths).toBeDefined();
      expect(res.body.weaknesses.improvementNeeded).toBeDefined();
    });

    // E. Student Learning Path API
    it('GET /api/v1/student/learning-path returns personalized roadmap', async () => {
      const res = await request(app)
        .get('/api/v1/student/learning-path')
        .set('Authorization', `Bearer ${studentToken}`);

      expect(res.status).toBe(200);
      expect(res.body.learningPath).toBeDefined();
      expect(res.body.learningPath.tasks.length).toBeGreaterThan(0);
    });

    // F. TPO Mock Drive Management API
    it('GET /api/v1/tpo/mock-drives/question-banks lists institutional question banks', async () => {
      const res = await request(app)
        .get('/api/v1/tpo/mock-drives/question-banks')
        .set('Authorization', `Bearer ${tpoToken}`);

      expect(res.status).toBe(200);
      expect(res.body.questionBanks.length).toBeGreaterThan(0);
    });

    it('POST /api/v1/tpo/mock-drives creates a new mock placement drive', async () => {
      const res = await request(app)
        .post('/api/v1/tpo/mock-drives')
        .set('Authorization', `Bearer ${tpoToken}`)
        .send({
          title: 'Spring Product Engineering Simulation',
          description: 'Tier-1 algorithmic & system mock placement drive',
          companyName: 'Institutional Mock Placement Drive',
          targetRoles: ['Software Engineer', 'Backend Developer'],
          startDate: '2026-11-20T09:00:00Z',
          endDate: '2026-11-30T18:00:00Z'
        });

      expect(res.status).toBe(201);
      expect(res.body.mockDrive.id).toBeDefined();
      expect(res.body.mockDrive.rounds).toHaveLength(3);
    });

    it('GET /api/v1/tpo/mock-drives/:id/analytics returns institutional drive metrics', async () => {
      const res = await request(app)
        .get('/api/v1/tpo/mock-drives/mock-drive-standard-01/analytics')
        .set('Authorization', `Bearer ${tpoToken}`);

      expect(res.status).toBe(200);
      expect(res.body.analytics.totalRegistered).toBeGreaterThan(0);
      expect(res.body.analytics.roundAnalytics).toHaveLength(3);
    });

    // G. RBAC Security Gating Tests
    it('should block Recruiter from accessing student assessment endpoints (403 Forbidden)', async () => {
      const res = await request(app)
        .get('/api/v1/student/assessments/aptitude/questions')
        .set('Authorization', `Bearer ${recruiterToken}`);

      expect(res.status).toBe(403);
      expect(res.body.error).toContain('Forbidden');
    });

    it('should block Student from accessing TPO mock drive management endpoints (403 Forbidden)', async () => {
      const res = await request(app)
        .get('/api/v1/tpo/mock-drives')
        .set('Authorization', `Bearer ${studentToken}`);

      expect(res.status).toBe(403);
      expect(res.body.error).toContain('Forbidden');
    });
  });
});
