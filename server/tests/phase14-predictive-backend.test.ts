/**
 * CarrerSync Phase 14 — Predictive Placement Analytics Backend Tests
 *
 * Comprehensive test suite validating:
 * 1. Statistical Formulas & Interpretability (Sigmoid, Log-Odds, Brier Score, Accuracy, Precision, Recall, F1, ECE, Linear Regression, WMA)
 * 2. Missing Data Safeguards (Missing Assessment != 0, Missing Evidence != Lack of Ability, Insufficient Data produces INSUFFICIENT_DATA)
 * 3. Model Validation Metrics & Class Imbalance Detection
 * 4. 4-Tier Student Placement Readiness Synthesis across 6 Dimensions
 * 5. Placement Forecasting Engine & Sparse History Safeguards (N < 3 returns FORECAST_UNAVAILABLE)
 * 6. Audit-Oriented Fairness Monitoring & Small-Group Suppression (N < 5, Zero Sensitive Attributes)
 * 7. Diagnostic Student Support Lifecycle & Non-Stigmatizing Phrasing
 * 8. Institutional TPO Interventions & Automated Audit Report Generation (JSON & Markdown)
 * 9. REST API Routes & Multi-Tenant Role-Based Access Control (RBAC)
 */

import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import app from '../src/app';
import { createJwtToken } from '../src/utils/crypto';

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
  placementReportService
} from '../src/analytics';

describe('Phase 14 — Predictive Placement Analytics Agent Backend Services & API', () => {
  const TENANT_ID = '22222222-2222-4222-8222-222222222222';

  const tpoAdminUser = {
    id: 't2222222-2222-4222-8222-222222222222',
    email: 'head.tpo@university.edu',
    role: 'tpo_admin',
    tenantId: TENANT_ID
  };

  const studentUser = {
    id: 's2222222-2222-4222-8222-222222222222',
    email: 'student.aarav@university.edu',
    role: 'student',
    tenantId: TENANT_ID
  };

  const recruiterUser = {
    id: 'r2222222-2222-4222-8222-222222222222',
    email: 'recruiter.talent@techcorp.com',
    role: 'recruiter',
    tenantId: TENANT_ID
  };

  let tpoToken: string;
  let studentToken: string;
  let recruiterToken: string;

  beforeAll(async () => {
    tpoToken = await createJwtToken({
      sub: tpoAdminUser.id,
      tenant_id: tpoAdminUser.tenantId,
      role: tpoAdminUser.role,
      email: tpoAdminUser.email
    });

    studentToken = await createJwtToken({
      sub: studentUser.id,
      tenant_id: studentUser.tenantId,
      role: studentUser.role,
      email: studentUser.email
    });

    recruiterToken = await createJwtToken({
      sub: recruiterUser.id,
      tenant_id: recruiterUser.tenantId,
      role: recruiterUser.role,
      email: recruiterUser.email
    });
  });

  // -------------------------------------------------------------------------
  // 1. Statistical Formulas & Validation Engine
  // -------------------------------------------------------------------------

  describe('1. Statistical Formulas & Prediction Engine', () => {
    it('should compute mathematically correct sigmoid probabilities and handle asymptotic limits', () => {
      // P = 1 / (1 + e^-z)
      expect(predictionEngineService.sigmoid(0)).toBeCloseTo(0.5, 4);
      expect(predictionEngineService.sigmoid(50)).toBe(1.0);
      expect(predictionEngineService.sigmoid(-50)).toBe(0.0);
      expect(predictionEngineService.sigmoid(2.197)).toBeCloseTo(0.9, 2);
    });

    it('should accurately calculate validation metrics: Accuracy, Precision, Recall, F1, and Brier Score', () => {
      // 10 predictions:
      // True Positives (pred >= 0.5 & actual=1): 4
      // False Positives (pred >= 0.5 & actual=0): 1
      // True Negatives (pred < 0.5 & actual=0): 4
      // False Negatives (pred < 0.5 & actual=1): 1
      const testPredictions = [
        { predictedProb: 0.8, actual: 1 as const }, // TP (diff 0.2, sq 0.04)
        { predictedProb: 0.9, actual: 1 as const }, // TP (diff 0.1, sq 0.01)
        { predictedProb: 0.7, actual: 1 as const }, // TP (diff 0.3, sq 0.09)
        { predictedProb: 0.6, actual: 1 as const }, // TP (diff 0.4, sq 0.16)
        { predictedProb: 0.75, actual: 0 as const }, // FP (diff 0.75, sq 0.5625)
        { predictedProb: 0.2, actual: 0 as const }, // TN (diff 0.2, sq 0.04)
        { predictedProb: 0.1, actual: 0 as const }, // TN (diff 0.1, sq 0.01)
        { predictedProb: 0.3, actual: 0 as const }, // TN (diff 0.3, sq 0.09)
        { predictedProb: 0.4, actual: 0 as const }, // TN (diff 0.4, sq 0.16)
        { predictedProb: 0.35, actual: 1 as const }  // FN (diff 0.65, sq 0.4225)
      ];

      const metrics = predictionEngineService.calculateValidationMetrics(testPredictions, 0.5);

      // Accuracy: (4 + 4) / 10 = 0.8
      expect(metrics.accuracy).toBe(0.8);
      // Precision: 4 / (4 + 1) = 0.8
      expect(metrics.precision).toBe(0.8);
      // Recall: 4 / (4 + 1) = 0.8
      expect(metrics.recall).toBe(0.8);
      // F1: 2 * (0.8 * 0.8) / (0.8 + 0.8) = 0.8
      expect(metrics.f1).toBe(0.8);
      // Confusion matrix verification
      expect(metrics.confusionMatrix).toEqual({
        truePositive: 4,
        falsePositive: 1,
        trueNegative: 4,
        falseNegative: 1
      });

      // Brier Score sum = 0.04 + 0.01 + 0.09 + 0.16 + 0.5625 + 0.04 + 0.01 + 0.09 + 0.16 + 0.4225 = 1.585 / 10 = 0.1585 -> 0.159
      expect(metrics.brierScore).toBeCloseTo(0.159, 2);
    });

    it('should detect severe class imbalance when minority class is below 20%', () => {
      // 20 predictions with only 2 positives (10% minority)
      const imbalancedData = Array.from({ length: 20 }, (_, i) => ({
        predictedProb: i < 2 ? 0.7 : 0.2,
        actual: (i < 2 ? 1 : 0) as 0 | 1
      }));

      const metrics = predictionEngineService.calculateValidationMetrics(imbalancedData);
      expect(metrics.classImbalanceRatio).toBe(0.1);
      expect(metrics.hasSevereClassImbalance).toBe(true);
    });

    it('should calculate ordinary least squares linear regression and trend predictions accurately', () => {
      // Perfect linear historical sequence: 70, 75, 80 (delta = +5 per period)
      // Period 4 should project exactly 85
      const forecast = placementForecastingService.generateForecast({
        tenantId: 'test-ols',
        targetPeriod: 'Batch 2026',
        method: 'LINEAR_REGRESSION',
        historicalData: [
          { period: '2023', actualRate: 70 },
          { period: '2024', actualRate: 75 },
          { period: '2025', actualRate: 80 }
        ]
      });

      expect(forecast.status).toBe('FORECAST_AVAILABLE');
      expect(forecast.forecastValue).toBe(85);
      expect(forecast.observationCount).toBe(3);
      expect(forecast.range).not.toBeNull();
    });

    it('should compute weighted moving average correctly with recent period bias', () => {
      // Historical: 70, 80, 90. Weights: 0.2, 0.3, 0.5
      // WMA = (70 * 0.2) + (80 * 0.3) + (90 * 0.5) = 14 + 24 + 45 = 83
      const forecast = placementForecastingService.generateForecast({
        tenantId: 'test-wma',
        targetPeriod: 'Batch 2026',
        method: 'WEIGHTED_MOVING_AVERAGE',
        historicalData: [
          { period: '2023', actualRate: 70 },
          { period: '2024', actualRate: 80 },
          { period: '2025', actualRate: 90 }
        ]
      });

      expect(forecast.status).toBe('FORECAST_AVAILABLE');
      expect(forecast.forecastValue).toBe(83);
    });
  });

  // -------------------------------------------------------------------------
  // 2. Missing Data Safeguards & Ethical Governance
  // -------------------------------------------------------------------------

  describe('2. Missing Data Safeguards & Ethical Governance', () => {
    it('should treat missing assessments as unobserved and strictly not penalize as zero', () => {
      const student = readinessAnalyticsService.evaluateStudentReadiness({
        studentId: 'test-missing-assess',
        studentName: 'Priya Sharma',
        tenantId: 'default',
        department: 'CSE',
        batchYear: '2026',
        targetRole: 'Backend Developer',
        verifiedSkillsCount: 6,
        verifiedSkillsScore: 85,
        evidenceCoverageRate: 0.8,
        aptitudeScore: null, // Unobserved assessment
        codingScore: null,
        cgpa: 8.5,
        activeBacklogs: 0,
        interviewScore: 80,
        mockInterviewsCompleted: 2,
        targetRoleSkillOverlapRate: 0.8
      });

      const assessDim = student.dimensions.assessmentScores;
      expect(assessDim.isObserved).toBe(false);
      expect(assessDim.rawScore).toBeNull();
      expect(assessDim.status).toBe('UNOBSERVED');
      // Composite score must still be strong because observed dimensions are re-weighted proportionally
      expect(student.readinessTier).toBe('HIGH_READINESS');
      expect(student.compositeScore).toBeGreaterThanOrEqual(75);
    });

    it('should strictly produce INSUFFICIENT_DATA tier when coverage is below 40% or fewer than 3 dimensions observed', () => {
      const student = readinessAnalyticsService.evaluateStudentReadiness({
        studentId: 'test-sparse-data',
        studentName: 'Sparse Profile',
        tenantId: 'default',
        department: 'Civil',
        batchYear: '2026',
        targetRole: 'Structural Engineer',
        verifiedSkillsCount: 1,
        verifiedSkillsScore: null, // Unobserved
        evidenceCoverageRate: null, // Unobserved
        aptitudeScore: null, // Unobserved
        codingScore: null, // Unobserved
        cgpa: 7.0, // Only 1 observed dimension
        activeBacklogs: 0,
        interviewScore: null,
        targetRoleSkillOverlapRate: null
      });

      expect(student.readinessTier).toBe('INSUFFICIENT_DATA');
      expect(student.compositeScore).toBeNull();
      expect(student.isDataSufficient).toBe(false);
      expect(student.limitations.length).toBeGreaterThan(0);
      expect(student.limitations[0]).toContain('unobserved dimensions');
    });

    it('should strictly return INSUFFICIENT_DATA and zero probability in Prediction Engine for sparse students', () => {
      const prediction = predictionEngineService.generatePrediction({
        studentId: 'test-sparse-data',
        tenantId: 'default'
      });

      expect(prediction.status).toBe('INSUFFICIENT_DATA');
      expect(prediction.estimatedProbability).toBeNull();
      expect(prediction.confidenceInterval).toBeNull();
      // Ethical guarantee: canExcludeStudent must strictly be false
      expect(prediction.canExcludeStudent).toBe(false);
    });

    it('should enforce ethical guarantee: canExcludeStudent is strictly false across all generated predictions', () => {
      const highReadyPrediction = predictionEngineService.generatePrediction({
        studentId: 'std-cse-01',
        tenantId: 'default'
      });

      expect(highReadyPrediction.status).toBe('COMPUTED');
      expect(highReadyPrediction.canExcludeStudent).toBe(false);
      expect(highReadyPrediction.limitations.some((l) => l.includes('NEVER be used to exclude or reject'))).toBe(true);
    });

    it('should return FORECAST_UNAVAILABLE when historical observations are sparse (N < 3)', () => {
      const sparseForecast = placementForecastingService.generateForecast({
        tenantId: 'test-sparse-history',
        historicalData: [
          { period: '2025', actualRate: 85 } // Only 1 historical point!
        ]
      });

      expect(sparseForecast.status).toBe('FORECAST_UNAVAILABLE');
      expect(sparseForecast.forecastValue).toBeNull();
      expect(sparseForecast.range).toBeNull();
      expect(sparseForecast.limitations.some((l) => l.includes('minimum 3 completed cohort observations'))).toBe(true);
    });
  });

  // -------------------------------------------------------------------------
  // 3. Multi-Dimensional Readiness & Cohort Analytics
  // -------------------------------------------------------------------------

  describe('3. Multi-Dimensional Readiness & Cohort Privacy Suppression', () => {
    it('should classify student across the 4 standard tiers accurately', () => {
      const high = readinessAnalyticsService.getStudentReadiness('std-cse-01', 'default');
      expect(high?.readinessTier).toBe('HIGH_READINESS');
      expect(high?.compositeScore).toBeGreaterThanOrEqual(75);

      const moderate = readinessAnalyticsService.getStudentReadiness('std-cse-02', 'default');
      expect(moderate?.readinessTier).toBe('MODERATE_READINESS');
      expect(moderate?.compositeScore).toBeGreaterThanOrEqual(50);
      expect(moderate?.compositeScore).toBeLessThan(75);

      const developing = readinessAnalyticsService.getStudentReadiness('std-mech-01', 'default');
      expect(developing?.readinessTier).toBe('DEVELOPING_READINESS');
      expect(developing?.compositeScore).toBeLessThan(50);

      const insufficient = readinessAnalyticsService.getStudentReadiness('std-civil-01', 'default');
      expect(insufficient?.readinessTier).toBe('INSUFFICIENT_DATA');
      expect(insufficient?.compositeScore).toBeNull();
    });

    it('should enforce small-group suppression (N < 5) and mask cohort metrics to protect student privacy', () => {
      // Testing cohort summary for a department with fewer than 5 students
      const summary = cohortBatchAnalyticsService.getDepartmentCohortSummary('default', 'Civil', '2026');

      expect(summary.isSuppressed).toBe(true);
      expect(summary.averageReadinessScore).toBeNull();
      expect(summary.placementRatePercentage).toBeNull();
      expect(summary.suppressionReason).toContain('below privacy threshold');
    });

    it('should produce unsuppressed aggregated metrics for large cohorts (N >= 5)', () => {
      // Seed 5 students in an artificial test department
      for (let i = 1; i <= 5; i++) {
        readinessAnalyticsService.evaluateStudentReadiness({
          studentId: `test-cohort-std-${i}`,
          studentName: `Student ${i}`,
          tenantId: 'test-large-cohort',
          department: 'CSE',
          batchYear: '2026',
          targetRole: 'Software Engineer',
          verifiedSkillsScore: 80,
          evidenceCoverageRate: 0.8,
          aptitudeScore: 75,
          codingScore: 80,
          cgpa: 8.0,
          interviewScore: 78,
          targetRoleSkillOverlapRate: 0.8
        });
      }

      const summary = cohortBatchAnalyticsService.getDepartmentCohortSummary('test-large-cohort', 'CSE', '2026');
      expect(summary.isSuppressed).toBe(false);
      expect(summary.totalStudents).toBe(5);
      expect(summary.averageReadinessScore).not.toBeNull();
      expect(summary.averageReadinessScore).toBeGreaterThan(70);
    });
  });

  // -------------------------------------------------------------------------
  // 4. Fairness Monitoring & Equity Auditing
  // -------------------------------------------------------------------------

  describe('4. Algorithmic Fairness Monitoring & Zero Sensitive Attributes', () => {
    it('should audit coverage across departments and verify zero sensitive attributes', () => {
      const audit = fairnessMonitoringService.runFairnessAudit('default');

      expect(audit.zeroSensitiveAttributesVerified).toBe(true);
      expect(audit.smallGroupSuppressionThreshold).toBe(5);
      expect(audit.coverageByDepartment).toBeDefined();
      expect(audit.coverageByDepartment['CSE']).toBeDefined();
      expect(audit.recommendations.length).toBeGreaterThan(0);
    });
  });

  // -------------------------------------------------------------------------
  // 5. Diagnostic Student Support & Longitudinal Skill Tracking
  // -------------------------------------------------------------------------

  describe('5. Diagnostic Student Support & Longitudinal Verification Policy', () => {
    it('should generate non-stigmatizing supportive phrasing across diagnostic categories', () => {
      const items = studentSupportService.listSupportItems('default');
      expect(items.length).toBeGreaterThan(0);

      for (const item of items) {
        // Enforce non-stigmatizing affirmative language
        const text = (item.title + ' ' + item.nonStigmatizingDescription).toLowerCase();
        expect(text).not.toContain('failing');
        expect(text).not.toContain('unemployable');
        expect(text).not.toContain('weak student');
        expect(text).not.toContain('bad candidate');
      }
    });

    it('should transition support item status across the TPO review workflow with audit logging', () => {
      const item = studentSupportService.createSupportItem({
        studentId: 'std-test-workflow',
        studentName: 'Ananya Roy',
        tenantId: 'default',
        department: 'IT',
        batchYear: '2026',
        targetRole: 'Cloud Architect',
        category: 'SKILL_DEVELOPMENT',
        title: 'Kubernetes Cluster Administration Growth Pathway',
        nonStigmatizingDescription: 'Recommended pathway to develop container orchestration and Helm chart authoring skills.',
        identifiedGaps: ['Kubernetes networking'],
        recommendedActions: ['Complete Docker to K8s tutorial track'],
        priority: 'MEDIUM'
      });

      expect(item.status).toBe('IDENTIFIED');
      expect(item.auditTrail.length).toBe(1);

      // TPO reviews and approves
      const approved = studentSupportService.reviewSupportItem(item.id, {
        status: 'APPROVED',
        reviewerId: 'head.tpo@university.edu',
        notes: 'Approved for lab certification reimbursement'
      });

      expect(approved?.status).toBe('APPROVED');
      expect(approved?.reviewedBy).toBe('head.tpo@university.edu');
      expect(approved?.auditTrail.length).toBe(2);
      expect(approved?.auditTrail[1].toStatus).toBe('APPROVED');
    });

    it('should enforce platform policy: learning tasks alone do not grant verified status without TPO authorization', () => {
      const progressList = skillImprovementService.getStudentSkillProgress('std-cse-02');
      const dockerProgress = progressList.find((s) => s.skillName.includes('Docker'));

      expect(dockerProgress).toBeDefined();
      expect(dockerProgress?.completedTasksCount).toBeGreaterThan(0);
      // Completed 6 tasks, but isVerified must remain false until TPO authorizes
      expect(dockerProgress?.isVerified).toBe(false);
      expect(dockerProgress?.verifiedByTpo).toBe(false);

      // Now authorize via TPO
      const verified = skillImprovementService.verifySkillWithTpo(
        'std-cse-02',
        dockerProgress!.skillName,
        'tpo-admin-01'
      );

      expect(verified?.isVerified).toBe(true);
      expect(verified?.verifiedByTpo).toBe(true);
      expect(verified?.verificationDate).toBeDefined();
    });
  });

  // -------------------------------------------------------------------------
  // 6. Placement Reports & Institutional Interventions
  // -------------------------------------------------------------------------

  describe('6. Automated Placement Reports & Institutional Interventions', () => {
    it('should create and update institutional interventions with human approval lifecycle', () => {
      const intervention = tpoInterventionService.createIntervention({
        tenantId: 'default',
        title: 'Full-Stack TypeScript & React Production Masterclass',
        reason: 'Increasing corporate requirements for TypeScript in web engineering roles.',
        aggregateEvidence: '72% of software applicants demonstrated proficiency in JavaScript but had gaps in TypeScript generics.',
        targetCohort: { department: 'IT', batchYear: '2026', studentCount: 45 },
        objective: 'Elevate frontend assessment scores by 20%.',
        priority: 'HIGH',
        estimatedImpact: '+15 offers in Tier-2 product drives.',
        suggestedActionPlan: ['Week 1: TypeScript typing system', 'Week 2: React hooks with TS']
      });

      expect(intervention.status).toBe('IDENTIFIED');

      const approved = tpoInterventionService.updateInterventionStatus(intervention.id, {
        status: 'APPROVED',
        reviewerId: 'head.tpo@university.edu'
      });

      expect(approved?.status).toBe('APPROVED');
      expect(approved?.approvedBy).toBe('head.tpo@university.edu');
    });

    it('should generate comprehensive placement audit reports in both structured JSON and GitHub-style Markdown', () => {
      const report = placementReportService.generatePlacementReport(
        'default',
        '2025-2026',
        'Head Placement Officer'
      );

      expect(report.id).toBeDefined();
      expect(report.overview.totalStudents).toBeGreaterThan(0);
      expect(report.departmentBreakdown.length).toBeGreaterThan(0);
      expect(report.markdownContent).toContain('# CarrerSync Institutional Placement Audit Report (2025-2026)');
      expect(report.markdownContent).toContain('## 1. Executive Summary');
      expect(report.markdownContent).toContain('## 2. Student Placement Readiness Distribution');
      expect(report.markdownContent).toContain('## 3. Departmental Readiness Breakdown & Privacy Suppression (N < 5)');
    });
  });

  // -------------------------------------------------------------------------
  // 7. REST API Endpoints & Role-Based Access Control (RBAC)
  // -------------------------------------------------------------------------

  describe('7. REST API Endpoints & RBAC Security Verification', () => {
    it('should reject unauthenticated requests with 401 Unauthorized', async () => {
      const res = await request(app).get('/api/v1/tpo/predictive-analytics/overview');
      expect(res.status).toBe(401);
      expect(res.body.code).toBe('MISSING_BEARER_TOKEN');
    });

    it('should deny recruiter access with 403 Forbidden', async () => {
      const res = await request(app)
        .get('/api/v1/tpo/predictive-analytics/overview')
        .set('Authorization', `Bearer ${recruiterToken}`)
        .set('x-tenant-id', TENANT_ID);

      expect(res.status).toBe(403);
      expect(res.body.code).toBe('FORBIDDEN_INSUFFICIENT_ROLE');
    });

    it('should deny student access with 403 Forbidden', async () => {
      const res = await request(app)
        .get('/api/v1/tpo/predictive-analytics/overview')
        .set('Authorization', `Bearer ${studentToken}`)
        .set('x-tenant-id', TENANT_ID);

      expect(res.status).toBe(403);
      expect(res.body.code).toBe('FORBIDDEN_INSUFFICIENT_ROLE');
    });

    it('should allow TPO admin to access GET /overview', async () => {
      const res = await request(app)
        .get('/api/v1/tpo/predictive-analytics/overview')
        .set('Authorization', `Bearer ${tpoToken}`)
        .set('x-tenant-id', TENANT_ID);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.overview.readiness).toBeDefined();
    });

    it('should allow TPO admin to access GET /readiness and GET /readiness/:studentId', async () => {
      const listRes = await request(app)
        .get('/api/v1/tpo/predictive-analytics/readiness')
        .set('Authorization', `Bearer ${tpoToken}`)
        .set('x-tenant-id', TENANT_ID);

      expect(listRes.status).toBe(200);
      expect(listRes.body.success).toBe(true);
      expect(Array.isArray(listRes.body.students)).toBe(true);

      const singleRes = await request(app)
        .get('/api/v1/tpo/predictive-analytics/readiness/std-cse-01')
        .set('Authorization', `Bearer ${tpoToken}`)
        .set('x-tenant-id', TENANT_ID);

      expect(singleRes.status).toBe(200);
      expect(singleRes.body.readiness.studentId).toBe('std-cse-01');
    });

    it('should allow TPO admin to execute POST /predictions/run and GET /predictions', async () => {
      const runRes = await request(app)
        .post('/api/v1/tpo/predictive-analytics/predictions/run')
        .set('Authorization', `Bearer ${tpoToken}`)
        .set('x-tenant-id', TENANT_ID)
        .send({ target: 'PLACEMENT_OFFER' });

      expect(runRes.status).toBe(200);
      expect(runRes.body.success).toBe(true);
      expect(runRes.body.totalEvaluated).toBeGreaterThan(0);

      const listRes = await request(app)
        .get('/api/v1/tpo/predictive-analytics/predictions')
        .set('Authorization', `Bearer ${tpoToken}`)
        .set('x-tenant-id', TENANT_ID);

      expect(listRes.status).toBe(200);
      expect(listRes.body.validationMetrics).toBeDefined();
      expect(Array.isArray(listRes.body.predictions)).toBe(true);
    });

    it('should allow TPO admin to access GET /student-support and review via POST', async () => {
      const listRes = await request(app)
        .get('/api/v1/tpo/predictive-analytics/student-support')
        .set('Authorization', `Bearer ${tpoToken}`)
        .set('x-tenant-id', TENANT_ID);

      expect(listRes.status).toBe(200);
      expect(Array.isArray(listRes.body.supportItems)).toBe(true);
      const targetId = listRes.body.supportItems[0].id;

      const reviewRes = await request(app)
        .post(`/api/v1/tpo/predictive-analytics/student-support/${targetId}/review`)
        .set('Authorization', `Bearer ${tpoToken}`)
        .set('x-tenant-id', TENANT_ID)
        .send({ status: 'IN_PROGRESS', notes: 'Review approved by TPO director' });

      expect(reviewRes.status).toBe(200);
      expect(reviewRes.body.supportItem.status).toBe('IN_PROGRESS');
    });

    it('should allow TPO admin to access cohort, mock drive, skill improvement, and trend endpoints', async () => {
      const batchesRes = await request(app)
        .get('/api/v1/tpo/predictive-analytics/batches')
        .set('Authorization', `Bearer ${tpoToken}`)
        .set('x-tenant-id', TENANT_ID);
      expect(batchesRes.status).toBe(200);
      expect(batchesRes.body.batches.length).toBeGreaterThan(0);

      const deptsRes = await request(app)
        .get('/api/v1/tpo/predictive-analytics/departments')
        .set('Authorization', `Bearer ${tpoToken}`)
        .set('x-tenant-id', TENANT_ID);
      expect(deptsRes.status).toBe(200);
      expect(deptsRes.body.departments.length).toBeGreaterThan(0);

      const mockRes = await request(app)
        .get('/api/v1/tpo/predictive-analytics/mock-drives')
        .set('Authorization', `Bearer ${tpoToken}`)
        .set('x-tenant-id', TENANT_ID);
      expect(mockRes.status).toBe(200);
      expect(mockRes.body.mockDrives.practiceDistinctionNotice).toBeDefined();

      const skillsRes = await request(app)
        .get('/api/v1/tpo/predictive-analytics/skill-improvement')
        .set('Authorization', `Bearer ${tpoToken}`)
        .set('x-tenant-id', TENANT_ID);
      expect(skillsRes.status).toBe(200);
      expect(skillsRes.body.skillImprovement.policyNotice).toBeDefined();

      const trendsRes = await request(app)
        .get('/api/v1/tpo/predictive-analytics/trends')
        .set('Authorization', `Bearer ${tpoToken}`)
        .set('x-tenant-id', TENANT_ID);
      expect(trendsRes.status).toBe(200);
      expect(trendsRes.body.trends.length).toBeGreaterThan(0);

      const recruitersRes = await request(app)
        .get('/api/v1/tpo/predictive-analytics/recruiters')
        .set('Authorization', `Bearer ${tpoToken}`)
        .set('x-tenant-id', TENANT_ID);
      expect(recruitersRes.status).toBe(200);
      expect(recruitersRes.body.pipelineSummary).toBeDefined();
    });

    it('should allow TPO admin to run and retrieve forecasts and fairness audit', async () => {
      const forecastRunRes = await request(app)
        .post('/api/v1/tpo/predictive-analytics/forecasts/run')
        .set('Authorization', `Bearer ${tpoToken}`)
        .set('x-tenant-id', TENANT_ID)
        .send({ targetPeriod: 'Batch 2026', method: 'LINEAR_REGRESSION' });
      expect(forecastRunRes.status).toBe(200);
      expect(forecastRunRes.body.forecast.status).toBe('FORECAST_AVAILABLE');

      const forecastGetRes = await request(app)
        .get('/api/v1/tpo/predictive-analytics/forecasts')
        .set('Authorization', `Bearer ${tpoToken}`)
        .set('x-tenant-id', TENANT_ID);
      expect(forecastGetRes.status).toBe(200);

      const fairnessRes = await request(app)
        .get('/api/v1/tpo/predictive-analytics/fairness')
        .set('Authorization', `Bearer ${tpoToken}`)
        .set('x-tenant-id', TENANT_ID);
      expect(fairnessRes.status).toBe(200);
      expect(fairnessRes.body.fairness.zeroSensitiveAttributesVerified).toBe(true);
    });

    it('should allow TPO admin to manage institutional interventions and generate reports', async () => {
      const postIntRes = await request(app)
        .post('/api/v1/tpo/predictive-analytics/interventions')
        .set('Authorization', `Bearer ${tpoToken}`)
        .set('x-tenant-id', TENANT_ID)
        .send({
          title: 'Advanced Git & CI/CD Pipelines Lab',
          reason: 'Identified gaps in version control workflows during mock drives',
          aggregateEvidence: '55% of students lacked branch merging experience in coding assessments',
          targetCohort: { department: 'CSE', batchYear: '2026', studentCount: 60 },
          objective: 'Ensure all students have verified CI/CD workflows',
          priority: 'HIGH'
        });

      expect(postIntRes.status).toBe(201);
      const intId = postIntRes.body.intervention.id;

      const patchIntRes = await request(app)
        .patch(`/api/v1/tpo/predictive-analytics/interventions/${intId}/status`)
        .set('Authorization', `Bearer ${tpoToken}`)
        .set('x-tenant-id', TENANT_ID)
        .send({ status: 'APPROVED', notes: 'Approved by departmental TPO committee' });

      expect(patchIntRes.status).toBe(200);
      expect(patchIntRes.body.intervention.status).toBe('APPROVED');

      const genRepRes = await request(app)
        .post('/api/v1/tpo/predictive-analytics/reports/generate')
        .set('Authorization', `Bearer ${tpoToken}`)
        .set('x-tenant-id', TENANT_ID)
        .send({ academicYear: '2025-2026' });

      expect(genRepRes.status).toBe(201);
      expect(genRepRes.body.report.id).toBeDefined();

      const getRepRes = await request(app)
        .get('/api/v1/tpo/predictive-analytics/reports')
        .set('Authorization', `Bearer ${tpoToken}`)
        .set('x-tenant-id', TENANT_ID);

      expect(getRepRes.status).toBe(200);
      expect(Array.isArray(getRepRes.body.reports)).toBe(true);
    });
  });
});
