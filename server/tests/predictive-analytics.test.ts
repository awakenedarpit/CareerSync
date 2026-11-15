/**
 * CarrerSync Phase 14 — Predictive Placement Analytics End-to-End Integration Test Suite
 *
 * Comprehensive End-to-End Integration, Security & Regression Suite covering all 14 Phase 14 Modules:
 * Suite 1: RBAC & Multi-Tenant Isolation (TPO authority required, 403 on recruiter/student/unauthenticated, cross-tenant isolation, tenant spoofing prevention)
 * Suite 2: Student Readiness Analysis (4-tier classification: HIGH, MODERATE, DEVELOPING, INSUFFICIENT_DATA; transparent factor breakdown; missing assessment != 0)
 * Suite 3: Statistical Placement Outcome Prediction (model evaluation metrics: accuracy, precision, recall, F1, Brier score; probability bounds [0, 1]; INSUFFICIENT_DATA safeguard; no automatic rejection)
 * Suite 4: Student Support Identification (7 categories, non-stigmatizing language, TPO review & status updates)
 * Suite 5: Batch-Wise & Department-Wise Analytics (aggregations, sample size, data coverage)
 * Suite 6: Mock Drive Intelligence (Phase 12 results integration, practice vs actual recruitment distinction)
 * Suite 7: Skill Improvement Tracking (longitudinal progress, completed learning tasks != verified mastery)
 * Suite 8: Placement Trend Analysis (YoY, conversion rates, denominators & sample sizes)
 * Suite 9: Recruiter Engagement Analytics (corporate pipeline, access restricted to TPO/admin)
 * Suite 10: Placement Forecasting (moving averages, uncertainty ranges, data freshness, FORECAST_UNAVAILABLE fallback)
 * Suite 11: Fairness & Bias Monitoring (coverage parity across departments, small-group suppression for N < 5, zero sensitive attribute inference)
 * Suite 12: TPO Intervention Recommendations & Governance (actionable recommendations, human approval gate)
 * Suite 13: Automated Placement Reporting (report generation, audit trail)
 */

import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import app from '../src/app';
import { createJwtToken } from '../src/utils/crypto';
import env from '../src/config/env';

import {
  readinessAnalyticsService,
  predictionEngineService,
  studentSupportService,
  cohortBatchAnalyticsService,
  mockDriveAnalyticsService,
  skillImprovementService,
  placementTrendsService,
  recruiterAnalyticsService,
  placementForecastingService,
  fairnessMonitoringService,
  tpoInterventionService,
  placementReportService,
  READINESS_TIERS,
  READINESS_DIMENSIONS,
  PREDICTION_TARGETS
} from '../src/analytics';

describe('Phase 14 — Predictive Placement Analytics End-to-End Integration Test Suite', () => {
  const secret = env.JWT_SECRET || 'carrersync_jwt_default_secret_dev_key_32_chars';

  // Multi-tenant IDs
  const TENANT_A = '11111111-1111-4111-8111-111111111111';
  const TENANT_B = '22222222-2222-4222-8222-222222222222';

  // Users for Tenant A
  const tpoAdminA = {
    id: 't0000001-1111-4111-8111-111111111111',
    email: 'tpo.director@campus-a.edu',
    role: 'TPO_ADMIN',
    tenantId: TENANT_A
  };

  const collegeAdminA = {
    id: 'c0000001-1111-4111-8111-111111111111',
    email: 'dean.placement@campus-a.edu',
    role: 'COLLEGE_ADMIN',
    tenantId: TENANT_A
  };

  const superAdminUser = {
    id: 'sa000001-1111-4111-8111-111111111111',
    email: 'root.superadmin@carrersync.com',
    role: 'SUPER_ADMIN',
    tenantId: TENANT_A
  };

  const studentA = {
    id: 's0000001-1111-4111-8111-111111111111',
    email: 'student.aarav@campus-a.edu',
    role: 'STUDENT',
    tenantId: TENANT_A
  };

  const recruiterA = {
    id: 'r0000001-1111-4111-8111-111111111111',
    email: 'recruiter.talent@techcorp.com',
    role: 'RECRUITER',
    tenantId: TENANT_A
  };

  // Users for Tenant B
  const tpoAdminB = {
    id: 't0000001-2222-4222-8222-222222222222',
    email: 'tpo.lead@campus-b.edu',
    role: 'TPO_ADMIN',
    tenantId: TENANT_B
  };

  let tokenTpoA: string;
  let tokenCollegeAdminA: string;
  let tokenSuperAdmin: string;
  let tokenStudentA: string;
  let tokenRecruiterA: string;
  let tokenTpoB: string;

  beforeAll(async () => {
    tokenTpoA = await createJwtToken(
      { sub: tpoAdminA.id, tenant_id: tpoAdminA.tenantId, role: tpoAdminA.role, email: tpoAdminA.email },
      secret
    );

    tokenCollegeAdminA = await createJwtToken(
      { sub: collegeAdminA.id, tenant_id: collegeAdminA.tenantId, role: collegeAdminA.role, email: collegeAdminA.email },
      secret
    );

    tokenSuperAdmin = await createJwtToken(
      { sub: superAdminUser.id, tenant_id: superAdminUser.tenantId, role: superAdminUser.role, email: superAdminUser.email },
      secret
    );

    tokenStudentA = await createJwtToken(
      { sub: studentA.id, tenant_id: studentA.tenantId, role: studentA.role, email: studentA.email },
      secret
    );

    tokenRecruiterA = await createJwtToken(
      { sub: recruiterA.id, tenant_id: recruiterA.tenantId, role: recruiterA.role, email: recruiterA.email },
      secret
    );

    tokenTpoB = await createJwtToken(
      { sub: tpoAdminB.id, tenant_id: tpoAdminB.tenantId, role: tpoAdminB.role, email: tpoAdminB.email },
      secret
    );
  });

  // =========================================================================
  // Suite 1: RBAC & Multi-Tenant Isolation
  // =========================================================================
  describe('Suite 1: RBAC & Multi-Tenant Isolation', () => {
    it('should reject unauthenticated request with 401 MISSING_BEARER_TOKEN', async () => {
      const res = await request(app).get('/api/v1/tpo/predictive-analytics/overview');
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.code).toBe('MISSING_BEARER_TOKEN');
    });

    it('should reject malformed Bearer token with 401 TOKEN_VERIFICATION_FAILED', async () => {
      const res = await request(app)
        .get('/api/v1/tpo/predictive-analytics/overview')
        .set('Authorization', 'Bearer invalid.token.payload');
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.code).toBe('TOKEN_VERIFICATION_FAILED');
    });

    it('should deny Student access with 403 FORBIDDEN_INSUFFICIENT_ROLE', async () => {
      const res = await request(app)
        .get('/api/v1/tpo/predictive-analytics/overview')
        .set('Authorization', `Bearer ${tokenStudentA}`)
        .set('x-tenant-id', TENANT_A);
      expect(res.status).toBe(403);
      expect(res.body.code).toBe('FORBIDDEN_INSUFFICIENT_ROLE');
    });

    it('should deny Recruiter access with 403 FORBIDDEN_INSUFFICIENT_ROLE', async () => {
      const res = await request(app)
        .get('/api/v1/tpo/predictive-analytics/overview')
        .set('Authorization', `Bearer ${tokenRecruiterA}`)
        .set('x-tenant-id', TENANT_A);
      expect(res.status).toBe(403);
      expect(res.body.code).toBe('FORBIDDEN_INSUFFICIENT_ROLE');
    });

    it('should allow TPO_ADMIN with 200 OK', async () => {
      const res = await request(app)
        .get('/api/v1/tpo/predictive-analytics/overview')
        .set('Authorization', `Bearer ${tokenTpoA}`)
        .set('x-tenant-id', TENANT_A);
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.overview).toBeDefined();
    });

    it('should allow COLLEGE_ADMIN with 200 OK', async () => {
      const res = await request(app)
        .get('/api/v1/tpo/predictive-analytics/overview')
        .set('Authorization', `Bearer ${tokenCollegeAdminA}`)
        .set('x-tenant-id', TENANT_A);
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('should allow SUPER_ADMIN with 200 OK', async () => {
      const res = await request(app)
        .get('/api/v1/tpo/predictive-analytics/overview')
        .set('Authorization', `Bearer ${tokenSuperAdmin}`)
        .set('x-tenant-id', TENANT_A);
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('should reject tenant spoofing attempts when JWT tenantId does not match x-tenant-id', async () => {
      // User belongs to TENANT_A, attempts to query TENANT_B
      const res = await request(app)
        .get('/api/v1/tpo/predictive-analytics/overview')
        .set('Authorization', `Bearer ${tokenTpoA}`)
        .set('x-tenant-id', TENANT_B);
      expect(res.status).toBe(403);
      expect(res.body.code).toBe('TENANT_SPOOFING_REJECTED');
    });

    it('should enforce data isolation between distinct tenants (TENANT_A vs TENANT_B)', async () => {
      // Create a support item in TENANT_A
      const itemA = studentSupportService.createSupportItem({
        studentId: 'std-tenant-a-01',
        studentName: 'Student in Tenant A',
        tenantId: TENANT_A,
        department: 'CSE',
        batchYear: '2026',
        targetRole: 'Software Engineer',
        category: 'SKILL_DEVELOPMENT',
        title: 'Tenant A Specific Python Track',
        nonStigmatizingDescription: 'Dedicated pathway for Tenant A engineering cohort.',
        identifiedGaps: ['Data structures'],
        recommendedActions: ['Complete modules'],
        priority: 'MEDIUM'
      });

      // Create a support item in TENANT_B
      const itemB = studentSupportService.createSupportItem({
        studentId: 'std-tenant-b-01',
        studentName: 'Student in Tenant B',
        tenantId: TENANT_B,
        department: 'ECE',
        batchYear: '2026',
        targetRole: 'Embedded Engineer',
        category: 'PROJECT_GUIDANCE',
        title: 'Tenant B Specific Embedded Track',
        nonStigmatizingDescription: 'Dedicated pathway for Tenant B electronics cohort.',
        identifiedGaps: ['Microcontrollers'],
        recommendedActions: ['Lab hardware sessions'],
        priority: 'HIGH'
      });

      // TPO A requests support items -> must include itemA, never itemB
      const resA = await request(app)
        .get('/api/v1/tpo/predictive-analytics/student-support')
        .set('Authorization', `Bearer ${tokenTpoA}`)
        .set('x-tenant-id', TENANT_A);
      expect(resA.status).toBe(200);
      const itemsA = resA.body.supportItems;
      expect(itemsA.some((i: any) => i.id === itemA.id)).toBe(true);
      expect(itemsA.some((i: any) => i.id === itemB.id)).toBe(false);

      // TPO B requests support items -> must include itemB, never itemA
      const resB = await request(app)
        .get('/api/v1/tpo/predictive-analytics/student-support')
        .set('Authorization', `Bearer ${tokenTpoB}`)
        .set('x-tenant-id', TENANT_B);
      expect(resB.status).toBe(200);
      const itemsB = resB.body.supportItems;
      expect(itemsB.some((i: any) => i.id === itemB.id)).toBe(true);
      expect(itemsB.some((i: any) => i.id === itemA.id)).toBe(false);
    });
  });

  // =========================================================================
  // Suite 2: Student Placement Readiness Analysis
  // =========================================================================
  describe('Suite 2: Student Readiness Analysis', () => {
    it('should expose all 4 standardized readiness tiers and 6 dimensions', () => {
      expect(READINESS_TIERS).toEqual([
        'HIGH_READINESS',
        'MODERATE_READINESS',
        'DEVELOPING_READINESS',
        'INSUFFICIENT_DATA'
      ]);
      expect(READINESS_DIMENSIONS).toEqual([
        'verifiedSkills',
        'evidenceCoverage',
        'assessmentScores',
        'academicRecords',
        'interviewPractice',
        'targetRoleAlignment'
      ]);
    });

    it('should classify student into HIGH_READINESS when compositeScore >= 75 with transparent factor breakdown', () => {
      const student = readinessAnalyticsService.evaluateStudentReadiness({
        studentId: 'qa-high-ready-01',
        studentName: 'Aarav Gupta',
        tenantId: TENANT_A,
        department: 'CSE',
        batchYear: '2026',
        targetRole: 'Backend Engineer',
        verifiedSkillsCount: 8,
        verifiedSkillsScore: 90,
        evidenceCoverageRate: 0.85,
        aptitudeScore: 82,
        codingScore: 88,
        cgpa: 8.9,
        activeBacklogs: 0,
        interviewScore: 85,
        mockInterviewsCompleted: 3,
        targetRoleSkillOverlapRate: 0.9
      });

      expect(student.readinessTier).toBe('HIGH_READINESS');
      expect(student.compositeScore).toBeGreaterThanOrEqual(75);
      expect(student.isDataSufficient).toBe(true);
      expect(student.dataCoveragePercentage).toBe(100);

      // Verify all 6 dimensions are observed and weighted
      for (const dim of READINESS_DIMENSIONS) {
        const d = student.dimensions[dim];
        expect(d).toBeDefined();
        expect(d.isObserved).toBe(true);
        expect(d.weight).toBeGreaterThan(0);
        expect(d.weightedContribution).toBeGreaterThan(0);
        expect(typeof d.explanation).toBe('string');
      }

      // Transparent contributing factors
      expect(student.contributingFactors.length).toBeGreaterThan(0);
      expect(student.contributingFactors.some((cf) => cf.impact === 'POSITIVE')).toBe(true);
    });

    it('should classify student into MODERATE_READINESS (50-74) and DEVELOPING_READINESS (<50)', () => {
      const moderate = readinessAnalyticsService.evaluateStudentReadiness({
        studentId: 'qa-mod-ready-01',
        studentName: 'Diya Sen',
        tenantId: TENANT_A,
        department: 'IT',
        batchYear: '2026',
        targetRole: 'Frontend Developer',
        verifiedSkillsCount: 4,
        verifiedSkillsScore: 65,
        evidenceCoverageRate: 0.6,
        aptitudeScore: 62,
        codingScore: 68,
        cgpa: 7.2,
        activeBacklogs: 0,
        interviewScore: 64,
        mockInterviewsCompleted: 1,
        targetRoleSkillOverlapRate: 0.65
      });

      expect(moderate.readinessTier).toBe('MODERATE_READINESS');
      expect(moderate.compositeScore).toBeGreaterThanOrEqual(50);
      expect(moderate.compositeScore).toBeLessThan(75);

      const developing = readinessAnalyticsService.evaluateStudentReadiness({
        studentId: 'qa-dev-ready-01',
        studentName: 'Vikram Joshi',
        tenantId: TENANT_A,
        department: 'Mech',
        batchYear: '2026',
        targetRole: 'Design Engineer',
        verifiedSkillsCount: 1,
        verifiedSkillsScore: 40,
        evidenceCoverageRate: 0.45,
        aptitudeScore: 42,
        codingScore: 38,
        cgpa: 6.1,
        activeBacklogs: 1,
        interviewScore: 45,
        mockInterviewsCompleted: 1,
        targetRoleSkillOverlapRate: 0.4
      });

      expect(developing.readinessTier).toBe('DEVELOPING_READINESS');
      expect(developing.compositeScore).toBeLessThan(50);
    });

    it('should strictly NOT penalize missing assessments as 0 (missing assessment != 0)', () => {
      const student = readinessAnalyticsService.evaluateStudentReadiness({
        studentId: 'qa-unobserved-assess',
        studentName: 'Neha Verma',
        tenantId: TENANT_A,
        department: 'ECE',
        batchYear: '2026',
        targetRole: 'Firmware Engineer',
        verifiedSkillsCount: 6,
        verifiedSkillsScore: 88,
        evidenceCoverageRate: 0.8,
        aptitudeScore: null, // Assessment not taken yet
        codingScore: null,
        cgpa: 8.6,
        activeBacklogs: 0,
        interviewScore: 82,
        mockInterviewsCompleted: 2,
        targetRoleSkillOverlapRate: 0.85
      });

      const assess = student.dimensions.assessmentScores;
      expect(assess.isObserved).toBe(false);
      expect(assess.rawScore).toBeNull();
      expect(assess.status).toBe('UNOBSERVED');
      expect(assess.explanation).toContain('Assessments not yet taken');
      expect(assess.explanation).toContain('strictly not scored as zero');
      // Composite score remains HIGH because unobserved dimensions are proportionally re-weighted
      expect(student.readinessTier).toBe('HIGH_READINESS');
      expect(student.compositeScore).toBeGreaterThanOrEqual(75);
    });

    it('should enforce missing evidence != lack of ability and flag INSUFFICIENT_DATA when coverage is sparse (<40%)', () => {
      const sparseStudent = readinessAnalyticsService.evaluateStudentReadiness({
        studentId: 'qa-sparse-student',
        studentName: 'Rohan Bannerjee',
        tenantId: TENANT_A,
        department: 'Civil',
        batchYear: '2026',
        targetRole: 'Structural Engineer',
        cgpa: 7.5 // Only 1 observed dimension
      });

      expect(sparseStudent.readinessTier).toBe('INSUFFICIENT_DATA');
      expect(sparseStudent.compositeScore).toBeNull();
      expect(sparseStudent.isDataSufficient).toBe(false);
      expect(sparseStudent.dataCoveragePercentage).toBeLessThan(40);
      expect(sparseStudent.missingDimensions.length).toBeGreaterThanOrEqual(3);
      expect(sparseStudent.limitations.length).toBeGreaterThan(0);
      expect(sparseStudent.limitations.some((l) => l.includes('unobserved dimensions'))).toBe(true);
    });

    it('should fetch readiness list and single student via API endpoints', async () => {
      const listRes = await request(app)
        .get('/api/v1/tpo/predictive-analytics/readiness')
        .set('Authorization', `Bearer ${tokenTpoA}`)
        .set('x-tenant-id', TENANT_A);
      expect(listRes.status).toBe(200);
      expect(listRes.body.overview.totalEvaluated).toBeGreaterThan(0);
      expect(Array.isArray(listRes.body.students)).toBe(true);

      const studentId = listRes.body.students[0].studentId;
      const singleRes = await request(app)
        .get(`/api/v1/tpo/predictive-analytics/readiness/${studentId}`)
        .set('Authorization', `Bearer ${tokenTpoA}`)
        .set('x-tenant-id', TENANT_A);
      expect(singleRes.status).toBe(200);
      expect(singleRes.body.readiness.studentId).toBe(studentId);
    });
  });

  // =========================================================================
  // Suite 3: Statistical Placement Outcome Prediction
  // =========================================================================
  describe('Suite 3: Statistical Placement Outcome Prediction', () => {
    it('should calculate mathematically sound validation metrics: Accuracy, Precision, Recall, F1, and Brier Score', () => {
      const samplePredictions = [
        { predictedProb: 0.85, actual: 1 as const }, // TP (diff 0.15, sq 0.0225)
        { predictedProb: 0.90, actual: 1 as const }, // TP (diff 0.10, sq 0.0100)
        { predictedProb: 0.70, actual: 1 as const }, // TP (diff 0.30, sq 0.0900)
        { predictedProb: 0.65, actual: 1 as const }, // TP (diff 0.35, sq 0.1225)
        { predictedProb: 0.80, actual: 0 as const }, // FP (diff 0.80, sq 0.6400)
        { predictedProb: 0.20, actual: 0 as const }, // TN (diff 0.20, sq 0.0400)
        { predictedProb: 0.10, actual: 0 as const }, // TN (diff 0.10, sq 0.0100)
        { predictedProb: 0.30, actual: 0 as const }, // TN (diff 0.30, sq 0.0900)
        { predictedProb: 0.40, actual: 0 as const }, // TN (diff 0.40, sq 0.1600)
        { predictedProb: 0.30, actual: 1 as const }  // FN (diff 0.70, sq 0.4900)
      ];

      const metrics = predictionEngineService.calculateValidationMetrics(samplePredictions, 0.5);

      // Confusion matrix: 4 TP, 1 FP, 4 TN, 1 FN (total 10)
      expect(metrics.confusionMatrix).toEqual({
        truePositive: 4,
        falsePositive: 1,
        trueNegative: 4,
        falseNegative: 1
      });

      // Accuracy = (4 + 4) / 10 = 0.80
      expect(metrics.accuracy).toBe(0.8);
      // Precision = 4 / (4 + 1) = 0.80
      expect(metrics.precision).toBe(0.8);
      // Recall = 4 / (4 + 1) = 0.80
      expect(metrics.recall).toBe(0.8);
      // F1 = 2 * (0.8 * 0.8) / (0.8 + 0.8) = 0.80
      expect(metrics.f1).toBe(0.8);
      // Brier Score = sum of squared errors / 10 = 1.675 / 10 = 0.1675
      expect(metrics.brierScore).toBeCloseTo(0.168, 2);
    });

    it('should enforce probability bounds [0, 1] for all calibrated predictions', () => {
      // Test extreme log-odds inputs
      expect(predictionEngineService.sigmoid(-100)).toBe(0.0);
      expect(predictionEngineService.sigmoid(0)).toBeCloseTo(0.5, 4);
      expect(predictionEngineService.sigmoid(100)).toBe(1.0);

      const prediction = predictionEngineService.generatePrediction({
        studentId: 'std-cse-01',
        tenantId: TENANT_A
      });

      expect(prediction.status).toBe('COMPUTED');
      expect(prediction.estimatedProbability).not.toBeNull();
      expect(prediction.estimatedProbability!).toBeGreaterThanOrEqual(0.0);
      expect(prediction.estimatedProbability!).toBeLessThanOrEqual(1.0);
      expect(prediction.confidenceInterval).not.toBeNull();
      expect(Array.isArray(prediction.confidenceInterval)).toBe(true);
      expect(prediction.confidenceInterval![0]).toBeGreaterThanOrEqual(0.0);
      expect(prediction.confidenceInterval![1]).toBeLessThanOrEqual(1.0);
      expect(prediction.confidenceInterval![0]).toBeLessThanOrEqual(prediction.confidenceInterval![1]);
    });

    it('should strictly return INSUFFICIENT_DATA and null probability when student data is sparse', () => {
      const sparsePrediction = predictionEngineService.generatePrediction({
        studentId: 'qa-sparse-student',
        tenantId: TENANT_A
      });

      expect(sparsePrediction.status).toBe('INSUFFICIENT_DATA');
      expect(sparsePrediction.estimatedProbability).toBeNull();
      expect(sparsePrediction.confidenceInterval).toBeNull();
      expect(sparsePrediction.limitations.length).toBeGreaterThan(0);
      expect(sparsePrediction.canExcludeStudent).toBe(false);
    });

    it('should enforce ethical guarantee: canExcludeStudent is strictly false (no automatic rejection)', () => {
      const pred = predictionEngineService.generatePrediction({
        studentId: 'std-cse-02',
        tenantId: TENANT_A
      });

      expect(pred.canExcludeStudent).toBe(false);
      expect(pred.limitations.some((lim) => lim.includes('NEVER be used to exclude or reject'))).toBe(true);
    });

    it('should execute batch predictions and retrieve via API endpoints', async () => {
      const runRes = await request(app)
        .post('/api/v1/tpo/predictive-analytics/predictions/run')
        .set('Authorization', `Bearer ${tokenTpoA}`)
        .set('x-tenant-id', TENANT_A)
        .send({ target: 'PLACEMENT_OFFER' });

      expect(runRes.status).toBe(200);
      expect(runRes.body.success).toBe(true);
      expect(runRes.body.totalEvaluated).toBeGreaterThan(0);
      expect(runRes.body.computedCount).toBeGreaterThanOrEqual(0);

      const listRes = await request(app)
        .get('/api/v1/tpo/predictive-analytics/predictions')
        .set('Authorization', `Bearer ${tokenTpoA}`)
        .set('x-tenant-id', TENANT_A);

      expect(listRes.status).toBe(200);
      expect(listRes.body.validationMetrics.accuracy).toBeGreaterThan(0.7);
      expect(listRes.body.validationMetrics.brierScore).toBeLessThan(0.25);
      expect(listRes.body.predictions.length).toBeGreaterThan(0);

      const firstId = listRes.body.predictions[0].id;
      const getSingleRes = await request(app)
        .get(`/api/v1/tpo/predictive-analytics/predictions/${firstId}`)
        .set('Authorization', `Bearer ${tokenTpoA}`)
        .set('x-tenant-id', TENANT_A);

      expect(getSingleRes.status).toBe(200);
      expect(getSingleRes.body.prediction.id).toBe(firstId);
    });
  });

  // =========================================================================
  // Suite 4: Student Support Identification
  // =========================================================================
  describe('Suite 4: Student Support Identification', () => {
    it('should identify student support across all 7 standardized categories', () => {
      const categories = [
        'SKILL_DEVELOPMENT',
        'ASSESSMENT_PRACTICE',
        'PROJECT_GUIDANCE',
        'PROFILE_COMPLETION',
        'INTERVIEW_PREPARATION',
        'ADDITIONAL_REVIEW',
        'INSUFFICIENT_DATA'
      ];

      for (const cat of categories) {
        const item = studentSupportService.createSupportItem({
          studentId: `qa-supp-std-${cat}`,
          studentName: `Student ${cat}`,
          tenantId: TENANT_A,
          department: 'CSE',
          batchYear: '2026',
          targetRole: 'Full Stack Engineer',
          category: cat as any,
          title: `Pathway for ${cat}`,
          nonStigmatizingDescription: `Supportive pathway designed to expand proficiency in ${cat}.`,
          identifiedGaps: [`Area ${cat}`],
          recommendedActions: [`Practice ${cat}`],
          priority: 'MEDIUM'
        });

        expect(item.id).toBeDefined();
        expect(item.category).toBe(cat);
      }
    });

    it('should strictly use non-stigmatizing affirmative language and zero deficit terms', () => {
      const items = studentSupportService.listSupportItems(TENANT_A);
      expect(items.length).toBeGreaterThan(0);

      const forbiddenDeficitTerms = ['failing', 'unemployable', 'hopeless', 'weak student', 'bad candidate', 'subpar'];
      for (const item of items) {
        const combinedText = `${item.title} ${item.nonStigmatizingDescription}`.toLowerCase();
        for (const term of forbiddenDeficitTerms) {
          expect(combinedText).not.toContain(term);
        }
      }
    });

    it('should transition support item status through the TPO review workflow with audit logging', async () => {
      const item = studentSupportService.createSupportItem({
        studentId: 'qa-workflow-student',
        studentName: 'Kavita Menon',
        tenantId: TENANT_A,
        department: 'IT',
        batchYear: '2026',
        targetRole: 'Data Engineer',
        category: 'ASSESSMENT_PRACTICE',
        title: 'SQL Query Optimization Practice Track',
        nonStigmatizingDescription: 'Recommended pathway for mastering relational database queries.',
        identifiedGaps: ['Indexed queries'],
        recommendedActions: ['Complete 5 practice problem sets'],
        priority: 'HIGH'
      });

      expect(item.status).toBe('IDENTIFIED');
      expect(item.auditTrail.length).toBe(1);

      // TPO marks UNDER_TPO_REVIEW via API
      const review1 = await request(app)
        .post(`/api/v1/tpo/predictive-analytics/student-support/${item.id}/review`)
        .set('Authorization', `Bearer ${tokenTpoA}`)
        .set('x-tenant-id', TENANT_A)
        .send({ status: 'UNDER_TPO_REVIEW', notes: 'Scheduled for counseling review' });

      expect(review1.status).toBe(200);
      expect(review1.body.supportItem.status).toBe('UNDER_TPO_REVIEW');

      // TPO approves
      const review2 = await request(app)
        .post(`/api/v1/tpo/predictive-analytics/student-support/${item.id}/review`)
        .set('Authorization', `Bearer ${tokenTpoA}`)
        .set('x-tenant-id', TENANT_A)
        .send({ status: 'APPROVED', notes: 'Approved for institutional coaching' });

      expect(review2.status).toBe(200);
      expect(review2.body.supportItem.status).toBe('APPROVED');
      expect(review2.body.supportItem.auditTrail.length).toBe(3);
    });
  });

  // =========================================================================
  // Suite 5: Batch-Wise & Department-Wise Analytics
  // =========================================================================
  describe('Suite 5: Batch-Wise & Department-Wise Analytics', () => {
    it('should aggregate batch comparisons with explicit sample size and data coverage', async () => {
      const res = await request(app)
        .get('/api/v1/tpo/predictive-analytics/batches')
        .set('Authorization', `Bearer ${tokenTpoA}`)
        .set('x-tenant-id', TENANT_A);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.batches)).toBe(true);
      expect(res.body.batches.length).toBeGreaterThan(0);

      for (const batch of res.body.batches) {
        expect(batch.batchYear).toBeDefined();
        expect(batch.totalStudents).toBeGreaterThanOrEqual(0);
        expect(batch.sampleSize).toBeDefined();
        expect(batch.coveragePercentage).toBeGreaterThanOrEqual(0);
      }

      expect(res.body.yoyTrends).toBeDefined();
      expect(Array.isArray(res.body.yoyTrends)).toBe(true);
    });

    it('should provide departmental capability matrices for CSE, IT, ECE, EEE, Mech, Civil', async () => {
      const res = await request(app)
        .get('/api/v1/tpo/predictive-analytics/departments?batchYear=2026')
        .set('Authorization', `Bearer ${tokenTpoA}`)
        .set('x-tenant-id', TENANT_A);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.departments)).toBe(true);

      const deptNames = res.body.departments.map((d: any) => d.department);
      expect(deptNames).toContain('CSE');
      expect(deptNames).toContain('IT');
    });
  });

  // =========================================================================
  // Suite 6: Mock Drive Intelligence (Phase 12 Integration)
  // =========================================================================
  describe('Suite 6: Mock Drive Intelligence', () => {
    it('should integrate Phase 12 mock test round progression (Aptitude -> Coding -> Interview)', async () => {
      const res = await request(app)
        .get('/api/v1/tpo/predictive-analytics/mock-drives')
        .set('Authorization', `Bearer ${tokenTpoA}`)
        .set('x-tenant-id', TENANT_A);

      expect(res.status).toBe(200);
      const mocks = res.body.mockDrives;
      expect(mocks.totalMockDrives).toBeGreaterThan(0);
      expect(mocks.aptitudePassRatePercentage).toBeGreaterThan(0);
      expect(mocks.codingSubmissionPassRatePercentage).toBeGreaterThan(0);
      expect(mocks.interviewAverageScore).toBeGreaterThan(0);

      // Verify round progression funnel
      expect(mocks.roundProgression.length).toBe(3);
      expect(mocks.roundProgression[0].round).toContain('Aptitude');
      expect(mocks.roundProgression[1].round).toContain('Coding');
      expect(mocks.roundProgression[2].round).toContain('Interview');

      // Verify topic weaknesses
      expect(mocks.topicWiseWeaknesses.length).toBeGreaterThan(0);
      expect(mocks.topicWiseWeaknesses[0].topic).toBeDefined();
    });

    it('should strictly feature practice vs actual recruitment distinction notice', async () => {
      const res = await request(app)
        .get('/api/v1/tpo/predictive-analytics/mock-drives')
        .set('Authorization', `Bearer ${tokenTpoA}`)
        .set('x-tenant-id', TENANT_A);

      expect(res.status).toBe(200);
      const notice = res.body.mockDrives.practiceDistinctionNotice;
      expect(notice).toBeDefined();
      expect(notice).toContain('CRITICAL POLICY SAFEGUARD');
      expect(notice).toContain('NEVER be utilized for automatic placement drive exclusions');
    });
  });

  // =========================================================================
  // Suite 7: Skill Improvement Tracking
  // =========================================================================
  describe('Suite 7: Skill Improvement Tracking', () => {
    it('should track longitudinal skill delta improvements and completions', async () => {
      const res = await request(app)
        .get('/api/v1/tpo/predictive-analytics/skill-improvement?department=CSE')
        .set('Authorization', `Bearer ${tokenTpoA}`)
        .set('x-tenant-id', TENANT_A);

      expect(res.status).toBe(200);
      const summary = res.body.skillImprovement;
      expect(summary.totalTrackedSkills).toBeGreaterThan(0);
      expect(summary.averageDeltaScore).toBeGreaterThan(0);
      expect(summary.skillsWithMostGrowth.length).toBeGreaterThan(0);
      expect(summary.policyNotice).toBeDefined();
    });

    it('should strictly enforce policy: completed learning tasks alone DO NOT grant verified mastery without TPO verification', () => {
      const progress = skillImprovementService.getStudentSkillProgress('std-cse-02');
      const docker = progress.find((p) => p.skillName.toLowerCase().includes('docker'));

      expect(docker).toBeDefined();
      expect(docker!.completedTasksCount).toBeGreaterThan(0);
      // Completed tasks exist, but isVerified remains false until TPO verifies
      expect(docker!.isVerified).toBe(false);
      expect(docker!.verifiedByTpo).toBe(false);

      // Now TPO verifies the skill
      const verified = skillImprovementService.verifySkillWithTpo(
        'std-cse-02',
        docker!.skillName,
        'tpo.director@campus-a.edu'
      );

      expect(verified?.isVerified).toBe(true);
      expect(verified?.verifiedByTpo).toBe(true);
      expect(verified?.verificationDate).toBeDefined();
    });
  });

  // =========================================================================
  // Suite 8: Placement Trend Analysis
  // =========================================================================
  describe('Suite 8: Placement Trend Analysis', () => {
    it('should report longitudinal trends with explicit conversion rates, denominators, and sample sizes', async () => {
      const res = await request(app)
        .get('/api/v1/tpo/predictive-analytics/trends')
        .set('Authorization', `Bearer ${tokenTpoA}`)
        .set('x-tenant-id', TENANT_A);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.trends)).toBe(true);
      expect(res.body.trends.length).toBeGreaterThan(0);

      for (const year of res.body.trends) {
        expect(year.academicYear).toBeDefined();
        expect(year.eligibleStudents).toBeGreaterThan(0);
        expect(year.totalOffers).toBeGreaterThan(0);
        expect(year.uniqueStudentsPlaced).toBeGreaterThan(0);
        // Conversion rate check: placed <= eligible
        expect(year.placementRatePercentage).toBeLessThanOrEqual(100);
        expect(year.sampleSize).toBeGreaterThan(0);
        expect(year.salaryDistribution).toBeDefined();
        expect(year.salaryDistribution.medianLpa).toBeGreaterThan(0);
      }
    });
  });

  // =========================================================================
  // Suite 9: Recruiter Engagement Analytics
  // =========================================================================
  describe('Suite 9: Recruiter Engagement Analytics', () => {
    it('should restrict corporate recruiter pipeline analytics strictly to TPO/Admin (RBAC verification)', async () => {
      // Recruiter denied
      const recRes = await request(app)
        .get('/api/v1/tpo/predictive-analytics/recruiters')
        .set('Authorization', `Bearer ${tokenRecruiterA}`)
        .set('x-tenant-id', TENANT_A);
      expect(recRes.status).toBe(403);

      // Student denied
      const stdRes = await request(app)
        .get('/api/v1/tpo/predictive-analytics/recruiters')
        .set('Authorization', `Bearer ${tokenStudentA}`)
        .set('x-tenant-id', TENANT_A);
      expect(stdRes.status).toBe(403);

      // TPO allowed
      const tpoRes = await request(app)
        .get('/api/v1/tpo/predictive-analytics/recruiters')
        .set('Authorization', `Bearer ${tokenTpoA}`)
        .set('x-tenant-id', TENANT_A);
      expect(tpoRes.status).toBe(200);
      expect(tpoRes.body.totalCompaniesOnboarded).toBeGreaterThan(0);
      expect(tpoRes.body.pipelineSummary).toBeDefined();
      expect(tpoRes.body.pipelineSummary.applied).toBeGreaterThan(0);
      expect(tpoRes.body.pipelineSummary.offered).toBeGreaterThan(0);
    });
  });

  // =========================================================================
  // Suite 10: Placement Forecasting
  // =========================================================================
  describe('Suite 10: Placement Forecasting', () => {
    it('should generate forecast with linear regression and uncertainty ranges', async () => {
      const res = await request(app)
        .post('/api/v1/tpo/predictive-analytics/forecasts/run')
        .set('Authorization', `Bearer ${tokenTpoA}`)
        .set('x-tenant-id', TENANT_A)
        .send({
          targetPeriod: 'Batch 2026',
          method: 'LINEAR_REGRESSION',
          historicalData: [
            { period: '2023', actualRate: 72 },
            { period: '2024', actualRate: 78 },
            { period: '2025', actualRate: 84 }
          ]
        });

      expect(res.status).toBe(200);
      const f = res.body.forecast;
      expect(f.status).toBe('FORECAST_AVAILABLE');
      expect(f.forecastValue).toBe(90);
      expect(f.range).not.toBeNull();
      expect(Array.isArray(f.range)).toBe(true);
      expect(f.range[0]).toBeLessThanOrEqual(f.forecastValue);
      expect(f.range[1]).toBeGreaterThanOrEqual(f.forecastValue);
      expect(f.freshnessTimestamp).toBeDefined();
    });

    it('should strictly return FORECAST_UNAVAILABLE when historical observations are sparse (N < 3)', async () => {
      const res = await request(app)
        .post('/api/v1/tpo/predictive-analytics/forecasts/run')
        .set('Authorization', `Bearer ${tokenTpoA}`)
        .set('x-tenant-id', TENANT_A)
        .send({
          targetPeriod: 'Batch 2026',
          method: 'LINEAR_REGRESSION',
          historicalData: [
            { period: '2025', actualRate: 85 } // Only 1 observation!
          ]
        });

      expect(res.status).toBe(200);
      const f = res.body.forecast;
      expect(f.status).toBe('FORECAST_UNAVAILABLE');
      expect(f.forecastValue).toBeNull();
      expect(f.range).toBeNull();
      expect(f.limitations.some((l: string) => l.includes('minimum 3 completed cohort observations'))).toBe(true);
    });
  });

  // =========================================================================
  // Suite 11: Fairness & Bias Monitoring
  // =========================================================================
  describe('Suite 11: Fairness & Bias Monitoring', () => {
    it('should enforce small-group privacy suppression for N < 5', () => {
      const summary = cohortBatchAnalyticsService.getDepartmentCohortSummary(TENANT_A, 'Civil', '2026');
      expect(summary.isSuppressed).toBe(true);
      expect(summary.averageReadinessScore).toBeNull();
      expect(summary.placementRatePercentage).toBeNull();
      expect(summary.suppressionReason).toContain('below privacy threshold');
    });

    it('should verify coverage parity across departments and confirm zero sensitive attribute inference', async () => {
      const res = await request(app)
        .get('/api/v1/tpo/predictive-analytics/fairness')
        .set('Authorization', `Bearer ${tokenTpoA}`)
        .set('x-tenant-id', TENANT_A);

      expect(res.status).toBe(200);
      const audit = res.body.fairness;
      expect(audit.zeroSensitiveAttributesVerified).toBe(true);
      expect(audit.disparateImpactRatio).toBeGreaterThanOrEqual(0.8);
      expect(audit.coverageByDepartment).toBeDefined();
      expect(audit.smallGroupSuppressionThreshold).toBe(5);
    });
  });

  // =========================================================================
  // Suite 12: TPO Intervention Recommendations & Governance
  // =========================================================================
  describe('Suite 12: TPO Intervention Recommendations & Governance', () => {
    it('should allow proposing new actionable interventions with human approval lifecycle', async () => {
      const postRes = await request(app)
        .post('/api/v1/tpo/predictive-analytics/interventions')
        .set('Authorization', `Bearer ${tokenTpoA}`)
        .set('x-tenant-id', TENANT_A)
        .send({
          title: 'System Design & Distributed Data Clinics',
          reason: 'Identified gaps in scalable architecture questions during mock interviews',
          aggregateEvidence: '62% of applicants scored below 60 on distributed caching prompts',
          targetCohort: { department: 'CSE', batchYear: '2026', studentCount: 75 },
          objective: 'Elevate interview technical rounds clearance by 25%',
          priority: 'CRITICAL',
          estimatedImpact: '+18 Tier-1 offers',
          suggestedActionPlan: ['Week 1: Scalability primitives', 'Week 2: Mock system design whiteboard']
        });

      expect(postRes.status).toBe(201);
      const intId = postRes.body.intervention.id;
      expect(postRes.body.intervention.status).toBe('IDENTIFIED');

      // TPO approves intervention
      const patchRes = await request(app)
        .patch(`/api/v1/tpo/predictive-analytics/interventions/${intId}/status`)
        .set('Authorization', `Bearer ${tokenTpoA}`)
        .set('x-tenant-id', TENANT_A)
        .send({ status: 'APPROVED', notes: 'Budget allocated for external system design architect' });

      expect(patchRes.status).toBe(200);
      expect(patchRes.body.intervention.status).toBe('APPROVED');
      expect(patchRes.body.intervention.approvedBy).toBe(tpoAdminA.email);
    });

    it('should validate mandatory fields when creating an intervention', async () => {
      const res = await request(app)
        .post('/api/v1/tpo/predictive-analytics/interventions')
        .set('Authorization', `Bearer ${tokenTpoA}`)
        .set('x-tenant-id', TENANT_A)
        .send({ title: 'Incomplete' });

      expect(res.status).toBe(400);
      expect(res.body.code).toBe('MISSING_INTERVENTION_FIELDS');
    });
  });

  // =========================================================================
  // Suite 13: Automated Placement Reporting
  // =========================================================================
  describe('Suite 13: Automated Placement Reporting', () => {
    it('should generate comprehensive placement audit report in structured JSON and GitHub-style Markdown', async () => {
      const genRes = await request(app)
        .post('/api/v1/tpo/predictive-analytics/reports/generate')
        .set('Authorization', `Bearer ${tokenTpoA}`)
        .set('x-tenant-id', TENANT_A)
        .send({ academicYear: '2025-2026' });

      expect(genRes.status).toBe(201);
      const report = genRes.body.report;
      expect(report.id).toBeDefined();
      expect(report.academicYear).toBe('2025-2026');
      expect(report.overview.totalStudents).toBeGreaterThan(0);
      expect(report.departmentBreakdown.length).toBeGreaterThan(0);

      // Verify Markdown content
      expect(report.markdownContent).toContain('# CarrerSync Institutional Placement Audit Report (2025-2026)');
      expect(report.markdownContent).toContain('## 1. Executive Summary');
      expect(report.markdownContent).toContain('## 2. Student Placement Readiness Distribution');
      expect(report.markdownContent).toContain('## 3. Departmental Readiness Breakdown');
      expect(report.markdownContent).toContain('## 4. Empirical Placement Forecasting');
      expect(report.markdownContent).toContain('## 5. Algorithmic Fairness & Equity Audit');
      expect(report.markdownContent).toContain('## 6. Actionable Institutional Interventions');

      // Verify listing reports
      const listRes = await request(app)
        .get('/api/v1/tpo/predictive-analytics/reports')
        .set('Authorization', `Bearer ${tokenTpoA}`)
        .set('x-tenant-id', TENANT_A);

      expect(listRes.status).toBe(200);
      expect(Array.isArray(listRes.body.reports)).toBe(true);
      expect(listRes.body.reports.some((r: any) => r.id === report.id)).toBe(true);
    });
  });
});
