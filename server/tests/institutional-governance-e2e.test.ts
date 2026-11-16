/**
 * CarrerSync Phase 17 — End-to-End Institutional Governance & Regression Verification Test Suite
 *
 * Verifies all 20 mandatory regression scenarios from Phase 17 Section 15:
 *  1. Cross-tenant institutional analytics isolation.
 *  2. Correct placement rate calculation with explicit denominator (N_placed / N_eligible).
 *  3. Verified skill coverage calculation (students with >= 1 verified skill / population).
 *  4. Skill-gap closure calculation (resolved previously identified gaps).
 *  5. Shortlist-to-offer ratio calculation.
 *  6. Time-to-shortlist average calculation.
 *  7. Missing-data handling returning INSUFFICIENT_DATA rather than zero.
 *  8. Historical comparison consistency and warning flags on incompatible cohorts.
 *  9. Report export permissions (TPO/Admin only, 403 on students/recruiters).
 * 10. Report data traceability to underlying database rows.
 * 11. Unauthorized report access rejection.
 * 12. Fairness sample-size suppression for groups with N < 5.
 * 13. Four-fifths benchmark calculation (disparity ratio < 0.8 triggers review flag).
 * 14. Human review requirement for fairness flags and training interventions.
 * 15. No sensitive attribute use in candidate ranking or selection.
 * 16. Outreach campaign human approval requirement before sending.
 * 17. Duplicate email recipient prevention within outreach campaigns.
 * 18. Unsubscribe and suppression list handling.
 * 19. Export data isolation strictly scoped to caller's tenant.
 * 20. Zero fabricated placement records or synthetic numbers.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../src/app';
import { createJwtToken } from '../src/utils/crypto';
import {
  institutionalKpiService,
  cohortSkillIntelligenceService,
  fairnessGovernanceService,
  accreditationReportingService,
  recruiterOutreachService
} from '../src/institutional';

describe('Phase 17 — Institutional Governance E2E & 20-Scenario Regression Suite', () => {
  const TENANT_A = '11111111-1111-4111-8111-111111111111';
  const TENANT_B = '22222222-2222-4222-8222-222222222222';

  // Role identities for Tenant A
  const tpoAdminUser = {
    id: 'tpo-admin-1',
    email: 'tpo.head@tenant-a.edu',
    role: 'TPO_ADMIN',
    tenantId: TENANT_A
  };

  const collegeAdminUser = {
    id: 'college-admin-1',
    email: 'principal@tenant-a.edu',
    role: 'COLLEGE_ADMIN',
    tenantId: TENANT_A
  };

  const studentUser = {
    id: 'student-user-1',
    email: 'student@tenant-a.edu',
    role: 'STUDENT',
    tenantId: TENANT_A
  };

  const recruiterUser = {
    id: 'recruiter-user-1',
    email: 'recruiter@techcorp.example.com',
    role: 'RECRUITER',
    tenantId: TENANT_A
  };

  // Role identities for Tenant B
  const tpoAdminUserB = {
    id: 'tpo-admin-2',
    email: 'tpo.lead@tenant-b.edu',
    role: 'TPO_ADMIN',
    tenantId: TENANT_B
  };

  // JWT Tokens
  let tpoTokenA: string;
  let collegeAdminTokenA: string;
  let studentTokenA: string;
  let recruiterTokenA: string;
  let tpoTokenB: string;

  beforeEach(async () => {
    // Reset all domain service in-memory data
    institutionalKpiService.resetStore();
    cohortSkillIntelligenceService.resetStore();
    fairnessGovernanceService.resetStore();
    accreditationReportingService.resetStore();
    recruiterOutreachService.resetStore();

    // Seed comprehensive baseline for Tenant A
    institutionalKpiService.seedCohort(TENANT_A, 2025);
    cohortSkillIntelligenceService.seedDefaultData(TENANT_A);
    fairnessGovernanceService.seedDefaultData(TENANT_A);
    recruiterOutreachService.seedDefaultData(TENANT_A);

    // Generate JWT tokens
    tpoTokenA = await createJwtToken({
      sub: tpoAdminUser.id,
      tenant_id: tpoAdminUser.tenantId,
      role: tpoAdminUser.role,
      email: tpoAdminUser.email
    });

    collegeAdminTokenA = await createJwtToken({
      sub: collegeAdminUser.id,
      tenant_id: collegeAdminUser.tenantId,
      role: collegeAdminUser.role,
      email: collegeAdminUser.email
    });

    studentTokenA = await createJwtToken({
      sub: studentUser.id,
      tenant_id: studentUser.tenantId,
      role: studentUser.role,
      email: studentUser.email
    });

    recruiterTokenA = await createJwtToken({
      sub: recruiterUser.id,
      tenant_id: recruiterUser.tenantId,
      role: recruiterUser.role,
      email: recruiterUser.email
    });

    tpoTokenB = await createJwtToken({
      sub: tpoAdminUserB.id,
      tenant_id: tpoAdminUserB.tenantId,
      role: tpoAdminUserB.role,
      email: tpoAdminUserB.email
    });
  });

  // ===========================================================================
  // Scenario 1: Cross-Tenant Institutional Analytics Isolation
  // ===========================================================================
  it('Scenario 1: Cross-tenant institutional analytics isolation', async () => {
    // Tenant A has 100 students and 10 drives seeded
    const resA = await request(app)
      .get('/api/v1/tpo/institutional/overview?batchYear=2025')
      .set('Authorization', `Bearer ${tpoTokenA}`)
      .set('x-tenant-id', TENANT_A);

    expect(resA.status).toBe(200);
    expect(resA.body.success).toBe(true);
    expect(resA.body.data.tenantId).toBe(TENANT_A);
    expect(resA.body.data.placementRate.numerator).toBe(72);
    expect(resA.body.data.placementRate.denominator).toBe(90);
    expect(resA.body.data.placementRate.value).toBe(80.0);

    // Tenant B has zero records seeded
    const resB = await request(app)
      .get('/api/v1/tpo/institutional/overview?batchYear=2025')
      .set('Authorization', `Bearer ${tpoTokenB}`)
      .set('x-tenant-id', TENANT_B);

    expect(resB.status).toBe(200);
    expect(resB.body.success).toBe(true);
    expect(resB.body.data.tenantId).toBe(TENANT_B);
    expect(resB.body.data.placementRate.numerator).toBe(0);
    expect(resB.body.data.placementRate.denominator).toBe(0);
    expect(resB.body.data.placementRate.value).toBeNull();
    expect(resB.body.data.placementRate.status).toBe('INSUFFICIENT_DATA');
    expect(resB.body.data.dataQuality.observationCount).toBe(0);
  });

  // ===========================================================================
  // Scenario 2: Correct Placement Rate Calculation with Explicit Denominator
  // ===========================================================================
  it('Scenario 2: Correct placement rate calculation with explicit denominator (N_placed / N_eligible)', async () => {
    const res = await request(app)
      .get('/api/v1/tpo/institutional/overview?batchYear=2025')
      .set('Authorization', `Bearer ${tpoTokenA}`)
      .set('x-tenant-id', TENANT_A);

    expect(res.status).toBe(200);
    const pr = res.body.data.placementRate;

    // Strict mathematical verification: N_placed / N_eligible
    expect(pr.numerator).toBe(72);
    expect(pr.denominator).toBe(90); // 100 enrolled - 10 ineligible = 90 eligible
    expect(pr.value).toBe(80.0);
    expect(pr.status).toBe('SUFFICIENT_DATA');
    expect(pr.explanation).toContain('72 placed students out of 90 eligible candidates');

    // Confirm that ineligible students are strictly excluded from the denominator
    const directCalc = (pr.numerator / pr.denominator) * 100;
    expect(pr.value).toBeCloseTo(directCalc, 2);
  });

  // ===========================================================================
  // Scenario 3: Verified Skill Coverage Calculation
  // ===========================================================================
  it('Scenario 3: Verified skill coverage calculation (students with >= 1 verified skill / population)', async () => {
    const res = await request(app)
      .get('/api/v1/tpo/institutional/overview?batchYear=2025')
      .set('Authorization', `Bearer ${tpoTokenA}`)
      .set('x-tenant-id', TENANT_A);

    expect(res.status).toBe(200);
    const coverage = res.body.data.verifiedSkillCoverage;

    expect(coverage.numerator).toBe(85); // 85 students with verified skill
    expect(coverage.denominator).toBe(100); // 100 total enrolled population
    expect(coverage.value).toBe(85.0);
    expect(coverage.averageVerifiedSkillsPerStudent).toBeGreaterThan(0);
    expect(coverage.status).toBe('SUFFICIENT_DATA');
    expect(coverage.explanation).toContain('hold at least one TPO-verified skill');
  });

  // ===========================================================================
  // Scenario 4: Skill-Gap Closure Calculation
  // ===========================================================================
  it('Scenario 4: Skill-gap closure calculation (resolved previously identified gaps)', async () => {
    const res = await request(app)
      .get('/api/v1/tpo/institutional/overview?batchYear=2025')
      .set('Authorization', `Bearer ${tpoTokenA}`)
      .set('x-tenant-id', TENANT_A);

    expect(res.status).toBe(200);
    const gapClosure = res.body.data.skillGapClosureRate;

    expect(gapClosure.numerator).toBe(160); // 160 closed gaps
    expect(gapClosure.denominator).toBe(200); // 200 total identified gaps
    expect(gapClosure.value).toBe(80.0);
    expect(gapClosure.status).toBe('SUFFICIENT_DATA');
    expect(gapClosure.explanation).toContain('160 resolved skill gaps out of 200 historically identified gaps');
  });

  // ===========================================================================
  // Scenario 5: Shortlist-to-Offer Ratio Calculation
  // ===========================================================================
  it('Scenario 5: Shortlist-to-offer ratio calculation', async () => {
    const res = await request(app)
      .get('/api/v1/tpo/institutional/overview?batchYear=2025')
      .set('Authorization', `Bearer ${tpoTokenA}`)
      .set('x-tenant-id', TENANT_A);

    expect(res.status).toBe(200);
    const stor = res.body.data.shortlistToOfferRatio;

    expect(stor.numerator).toBe(88); // 88 offers across drives
    expect(stor.denominator).toBe(205); // 205 total shortlists across drives
    expect(stor.value).toBe(42.93);
    expect(stor.status).toBe('SUFFICIENT_DATA');
    expect(stor.explanation).toContain('88 offers secured from 205 candidate shortlists');
  });

  // ===========================================================================
  // Scenario 6: Time-to-Shortlist Average Calculation
  // ===========================================================================
  it('Scenario 6: Time-to-shortlist average calculation', async () => {
    const res = await request(app)
      .get('/api/v1/tpo/institutional/overview?batchYear=2025')
      .set('Authorization', `Bearer ${tpoTokenA}`)
      .set('x-tenant-id', TENANT_A);

    expect(res.status).toBe(200);
    const tts = res.body.data.timeToShortlist;

    expect(tts.evaluatedDrivesCount).toBe(10);
    expect(tts.averageDays).toBeGreaterThan(0);
    expect(tts.medianDays).toBeGreaterThan(0);
    expect(tts.minDays).toBeGreaterThanOrEqual(1);
    expect(tts.maxDays).toBeGreaterThanOrEqual(tts.minDays);
    expect(tts.status).toBe('SUFFICIENT_DATA');
  });

  // ===========================================================================
  // Scenario 7: Missing-Data Handling Returning INSUFFICIENT_DATA
  // ===========================================================================
  it('Scenario 7: Missing-data handling returning INSUFFICIENT_DATA rather than zero', async () => {
    // 1. Seed only 2 students for Tenant B (N = 2 < 5 threshold)
    institutionalKpiService.addStudent({
      id: 'std-b-1',
      tenantId: TENANT_B,
      rollNumber: 'B-2025-01',
      department: 'Electrical Engineering',
      batchYear: 2025,
      isEligibleForPlacement: true,
      hasOffer: false,
      offerCount: 0,
      verifiedSkillCount: 0,
      totalIdentifiedGaps: 1,
      closedGaps: 0
    });
    institutionalKpiService.addStudent({
      id: 'std-b-2',
      tenantId: TENANT_B,
      rollNumber: 'B-2025-02',
      department: 'Electrical Engineering',
      batchYear: 2025,
      isEligibleForPlacement: true,
      hasOffer: true,
      offerCount: 1,
      verifiedSkillCount: 1,
      totalIdentifiedGaps: 1,
      closedGaps: 1
    });

    const res = await request(app)
      .get('/api/v1/tpo/institutional/overview?batchYear=2025')
      .set('Authorization', `Bearer ${tpoTokenB}`)
      .set('x-tenant-id', TENANT_B);

    expect(res.status).toBe(200);
    const data = res.body.data;

    // Verify INSUFFICIENT_DATA is returned rather than misleading confidence
    expect(data.dataQuality.status).toBe('INSUFFICIENT_DATA');
    expect(data.dataQuality.warnings).toContain('Cohort sample size N < 5. Small-group suppression active.');
    expect(data.placementRate.status).toBe('INSUFFICIENT_DATA');
    expect(data.verifiedSkillCoverage.status).toBe('INSUFFICIENT_DATA');
    expect(data.skillGapClosureRate.status).toBe('INSUFFICIENT_DATA');
    expect(data.dataQuality.zeroFabricatedDataGuaranteed).toBe(true);

    // 2. Unseeded cohort (N = 0) returns explicit null
    const resEmpty = await request(app)
      .get('/api/v1/tpo/institutional/overview?batchYear=2020')
      .set('Authorization', `Bearer ${tpoTokenB}`)
      .set('x-tenant-id', TENANT_B);

    expect(resEmpty.status).toBe(200);
    expect(resEmpty.body.data.placementRate.value).toBeNull();
    expect(resEmpty.body.data.placementRate.status).toBe('INSUFFICIENT_DATA');
  });

  // ===========================================================================
  // Scenario 8: Historical Comparison Consistency & Warning Flags on Incompatible Cohorts
  // ===========================================================================
  it('Scenario 8: Historical comparison consistency and warning flags on incompatible cohorts', async () => {
    // 1. Preview ACADEMIC_YEAR_COMPARISON with missing academicYear parameter
    const resIncomplete = await request(app)
      .post('/api/v1/tpo/accreditation/reports/preview')
      .set('Authorization', `Bearer ${tpoTokenA}`)
      .set('x-tenant-id', TENANT_A)
      .send({
        templateCode: 'ACADEMIC_YEAR_COMPARISON',
        filters: {} // Missing required academicYear
      });

    expect(resIncomplete.status).toBe(200);
    expect(resIncomplete.body.data.missingFields).toContain('academicYear');
    expect(resIncomplete.body.data.warnings.some((w: string) => w.includes('academicYear'))).toBe(true);

    // 2. Querying an incompatible / sparse cohort in overview raises warnings
    const resSparseCohort = await request(app)
      .get('/api/v1/tpo/institutional/overview?batchYear=2019') // non-existent cohort
      .set('Authorization', `Bearer ${tpoTokenA}`)
      .set('x-tenant-id', TENANT_A);

    expect(resSparseCohort.status).toBe(200);
    expect(resSparseCohort.body.data.dataQuality.status).toBe('INSUFFICIENT_DATA');
    expect(resSparseCohort.body.data.dataQuality.warnings.length).toBeGreaterThan(0);
  });

  // ===========================================================================
  // Scenario 9: Report Export Permissions (TPO/Admin Only, 403 on Students/Recruiters)
  // ===========================================================================
  it('Scenario 9: Report export permissions (TPO/Admin only, 403 on students/recruiters)', async () => {
    const payload = {
      templateCode: 'NAAC_5_2_1',
      filters: { batchYear: 2025 },
      format: 'PDF'
    };

    // 1. Student -> 403 Forbidden
    const resStudent = await request(app)
      .post('/api/v1/tpo/accreditation/reports/export')
      .set('Authorization', `Bearer ${studentTokenA}`)
      .set('x-tenant-id', TENANT_A)
      .send(payload);

    expect(resStudent.status).toBe(403);
    expect(resStudent.body.code).toBe('FORBIDDEN_INSUFFICIENT_ROLE');

    // 2. Recruiter -> 403 Forbidden
    const resRecruiter = await request(app)
      .post('/api/v1/tpo/accreditation/reports/export')
      .set('Authorization', `Bearer ${recruiterTokenA}`)
      .set('x-tenant-id', TENANT_A)
      .send(payload);

    expect(resRecruiter.status).toBe(403);

    // 3. TPO Admin -> 201 Created
    const resTpo = await request(app)
      .post('/api/v1/tpo/accreditation/reports/export')
      .set('Authorization', `Bearer ${tpoTokenA}`)
      .set('x-tenant-id', TENANT_A)
      .send(payload);

    expect(resTpo.status).toBe(201);
    expect(resTpo.body.success).toBe(true);

    // 4. College Admin -> 201 Created
    const resCollegeAdmin = await request(app)
      .post('/api/v1/tpo/accreditation/reports/export')
      .set('Authorization', `Bearer ${collegeAdminTokenA}`)
      .set('x-tenant-id', TENANT_A)
      .send(payload);

    expect(resCollegeAdmin.status).toBe(201);
    expect(resCollegeAdmin.body.success).toBe(true);
  });

  // ===========================================================================
  // Scenario 10: Report Data Traceability to Underlying Database Rows
  // ===========================================================================
  it('Scenario 10: Report data traceability to underlying database rows', async () => {
    const res = await request(app)
      .post('/api/v1/tpo/accreditation/reports/preview')
      .set('Authorization', `Bearer ${tpoTokenA}`)
      .set('x-tenant-id', TENANT_A)
      .send({
        templateCode: 'NAAC_5_2_1',
        filters: { batchYear: 2025 }
      });

    expect(res.status).toBe(200);
    const traceability = res.body.data.evidenceTraceability;

    expect(Array.isArray(traceability)).toBe(true);
    expect(traceability.length).toBeGreaterThan(0);

    for (const item of traceability) {
      expect(item.metricKey).toBeDefined();
      expect(item.metricLabel).toBeDefined();
      expect(item.sourceTable).toBeDefined();
      // Verifies source tables link to relational schema
      expect([
        'placement_offers',
        'students',
        'student_skills',
        'training_interventions',
        'placement_drives'
      ]).toContain(item.sourceTable);
      expect(Array.isArray(item.sampleRecordIds)).toBe(true);
      expect(item.sampleRecordIds.length).toBeGreaterThan(0);
    }
  });

  // ===========================================================================
  // Scenario 11: Unauthorized Report Access Rejection
  // ===========================================================================
  it('Scenario 11: Unauthorized report access rejection', async () => {
    // Generate a report first
    const exportRes = await request(app)
      .post('/api/v1/tpo/accreditation/reports/export')
      .set('Authorization', `Bearer ${tpoTokenA}`)
      .set('x-tenant-id', TENANT_A)
      .send({
        templateCode: 'NAAC_5_2_1',
        filters: { batchYear: 2025 },
        format: 'JSON'
      });

    expect(exportRes.status).toBe(201);
    const reportId = exportRes.body.data.reportId;

    // 1. Unauthenticated request -> 401 Unauthorized
    const resAnon = await request(app).get(`/api/v1/tpo/accreditation/reports/${reportId}`);
    expect(resAnon.status).toBe(401);

    // 2. Student access -> 403 Forbidden
    const resStudent = await request(app)
      .get(`/api/v1/tpo/accreditation/reports/${reportId}`)
      .set('Authorization', `Bearer ${studentTokenA}`)
      .set('x-tenant-id', TENANT_A);
    expect(resStudent.status).toBe(403);

    // 3. Recruiter access -> 403 Forbidden
    const resRecruiter = await request(app)
      .get(`/api/v1/tpo/accreditation/reports/${reportId}`)
      .set('Authorization', `Bearer ${recruiterTokenA}`)
      .set('x-tenant-id', TENANT_A);
    expect(resRecruiter.status).toBe(403);

    // 4. Non-existent report -> 404 Not Found
    const resNotFound = await request(app)
      .get('/api/v1/tpo/accreditation/reports/rep-non-existent-999')
      .set('Authorization', `Bearer ${tpoTokenA}`)
      .set('x-tenant-id', TENANT_A);
    expect(resNotFound.status).toBe(404);
  });

  // ===========================================================================
  // Scenario 12: Fairness Sample-Size Suppression for Groups with N < 5
  // ===========================================================================
  it('Scenario 12: Fairness sample-size suppression for groups with N < 5', async () => {
    const res = await request(app)
      .get('/api/v1/tpo/fairness')
      .set('Authorization', `Bearer ${tpoTokenA}`)
      .set('x-tenant-id', TENANT_A);

    expect(res.status).toBe(200);
    const disparities = res.body.data.disparities;

    // Find the small cohort (Biotechnology with N = 4)
    const biotech = disparities.find((e: any) => e.groupName === 'Biotechnology');
    expect(biotech).toBeDefined();
    expect(biotech.sampleSize).toBe(4);
    expect(biotech.isSuppressed).toBe(true);
    expect(biotech.groupSelectionRate).toBeNull();
    expect(biotech.disparityRatio).toBeNull();
    expect(biotech.requiresHumanReview).toBe(false);
    expect(biotech.reviewFlagReason).toContain('Sample size N < 5 is suppressed pursuant to small-group privacy protection standards');
  });

  // ===========================================================================
  // Scenario 13: Four-Fifths Benchmark Calculation (Disparity Ratio < 0.8 Triggers Flag)
  // ===========================================================================
  it('Scenario 13: Four-fifths benchmark calculation (disparity ratio < 0.8 triggers review flag)', async () => {
    const res = await request(app)
      .get('/api/v1/tpo/fairness')
      .set('Authorization', `Bearer ${tpoTokenA}`)
      .set('x-tenant-id', TENANT_A);

    expect(res.status).toBe(200);
    const disparities = res.body.data.disparities;

    // Reference group is Computer Science (60% selection rate)
    const ece = disparities.find((e: any) => e.groupName === 'Electronics & Communication');
    expect(ece).toBeDefined();
    expect(ece.sampleSize).toBe(80);
    expect(ece.groupSelectionRate).toBe(45.0);
    expect(ece.referenceGroupSelectionRate).toBe(60.0);

    // Disparity ratio: 45 / 60 = 0.75 (< 0.80 benchmark)
    expect(ece.disparityRatio).toBe(0.75);
    expect(ece.fourFifthsThresholdMet).toBe(false);
    expect(ece.requiresHumanReview).toBe(true);
    expect(ece.reviewFlagReason).toContain('below the 0.80 EEOC Four-Fifths benchmark');

    // Advisory disclaimer present: statistical alert, not legal discrimination finding
    expect(res.body.data.fourFifthsSummary.disclaimer).toContain('NOT constitute an automated finding of bias or unlawful discrimination');
  });

  // ===========================================================================
  // Scenario 14: Human Review Requirement for Fairness Flags & Interventions
  // ===========================================================================
  it('Scenario 14: Human review requirement for fairness flags and training interventions', async () => {
    // Part A: Fairness Review Workflow requires explicit human review transitions
    const caseRes = await request(app)
      .post('/api/v1/tpo/fairness/reviews')
      .set('Authorization', `Bearer ${tpoTokenA}`)
      .set('x-tenant-id', TENANT_A)
      .send({
        metricName: 'Shortlist Disparity in ECE',
        affectedGroup: 'Electronics & Communication',
        referenceGroup: 'Computer Science',
        groupSelectionRate: 45.0,
        referenceGroupSelectionRate: 60.0,
        disparityRatio: 0.75,
        reviewerNotes: 'Investigating core electronics curriculum alignment.'
      });

    expect(caseRes.status).toBe(201);
    const caseId = caseRes.body.data.id;
    expect(caseRes.body.data.status).toBe('FLAGGED');

    // Transition to UNDER_REVIEW
    const underReviewRes = await request(app)
      .patch(`/api/v1/tpo/fairness/reviews/${caseId}`)
      .set('Authorization', `Bearer ${tpoTokenA}`)
      .set('x-tenant-id', TENANT_A)
      .send({
        status: 'UNDER_REVIEW',
        reviewerNotes: 'Faculty board meeting scheduled.'
      });
    expect(underReviewRes.status).toBe(200);
    expect(underReviewRes.body.data.status).toBe('UNDER_REVIEW');

    // Part B: Training Interventions rule: Course attendance alone != skill mastery
    const intervention = cohortSkillIntelligenceService.createIntervention(TENANT_A, tpoAdminUser.id, {
      title: 'Full-Stack TypeScript Bootcamp',
      description: 'Hands-on project work',
      targetSkill: 'TypeScript',
      targetDepartment: 'Information Technology',
      targetBatch: 2025,
      startDate: '2025-02-01',
      endDate: '2025-03-15',
      actionPlan: 'Build production REST API with tests'
    });

    // Add participant who only attended without project evidence
    intervention.participants.push({
      studentId: 'std-attendee-only',
      rollNumber: 'IT-2025-099',
      department: 'Information Technology',
      attendanceVerified: true,
      projectEvidenceSubmitted: false, // NO project evidence
      tpoVerified: false,
      verifiedSkillGainRecorded: false
    });

    // Attempting to verify mastery without project evidence throws Policy violation
    expect(() => {
      cohortSkillIntelligenceService.verifyParticipantEvidence(
        TENANT_A,
        intervention.id,
        'std-attendee-only',
        tpoAdminUser.id,
        true
      );
    }).toThrow(/Policy violation: Course attendance alone cannot certify skill mastery/);
  });

  // ===========================================================================
  // Scenario 15: No Sensitive Attribute Use in Candidate Ranking or Selection
  // ===========================================================================
  it('Scenario 15: No sensitive attribute use in candidate ranking or selection', async () => {
    // 1. Verify student support classifications use only supportive, non-stigmatizing labels
    const profiles = cohortSkillIntelligenceService.getStudentSupportOverview(TENANT_A);
    expect(profiles.length).toBeGreaterThan(0);

    const allowedClassifications = [
      'SUPPORT_RECOMMENDED',
      'ADDITIONAL_PRACTICE_SUGGESTED',
      'INSUFFICIENT_DATA',
      'PROGRESSING',
      'NO_ACTION_REQUIRED'
    ];

    for (const p of profiles) {
      expect(allowedClassifications).toContain(p.classification);
      expect(p.isStigmatizingRankingPrevented).toBe(true);
      // Ensure no sensitive or demographic labels are attached
      expect((p as any).gender).toBeUndefined();
      expect((p as any).caste).toBeUndefined();
      expect((p as any).religion).toBeUndefined();
      expect((p as any).ethnicity).toBeUndefined();
    }

    // 2. Verify fairness evaluations only evaluate academic department cohorts
    const disparities = fairnessGovernanceService.evaluateDisparities(TENANT_A);
    for (const e of disparities.evaluations) {
      expect(e.groupCategory).toBe('Department Cohort');
      expect((e as any).gender).toBeUndefined();
      expect((e as any).caste).toBeUndefined();
    }
  });

  // ===========================================================================
  // Scenario 16: Outreach Campaign Human Approval Requirement Before Sending
  // ===========================================================================
  it('Scenario 16: Outreach campaign human approval requirement before sending', async () => {
    // 1. Create a campaign in DRAFT
    const createRes = await request(app)
      .post('/api/v1/tpo/outreach/campaigns')
      .set('Authorization', `Bearer ${tpoTokenA}`)
      .set('x-tenant-id', TENANT_A)
      .send({
        title: 'Fall 2025 Tier-1 Recruiter Drive Invitation',
        subject: 'Invitation: Class of 2025 Campus Placements',
        bodyTemplate: 'Dear {{contactName}},\n\nWe cordially invite {{companyName}} to our campus drive.'
      });

    expect(createRes.status).toBe(201);
    const campaignId = createRes.body.data.id;
    expect(createRes.body.data.status).toBe('DRAFT');

    // 2. Dispatching while DRAFT is strictly blocked -> 422 Unprocessable Entity
    const sendBeforeApprovalRes = await request(app)
      .post(`/api/v1/tpo/outreach/campaigns/${campaignId}/send`)
      .set('Authorization', `Bearer ${tpoTokenA}`)
      .set('x-tenant-id', TENANT_A);

    expect(sendBeforeApprovalRes.status).toBe(422);
    expect(sendBeforeApprovalRes.body.error).toContain('CAMPAIGN_NOT_APPROVED');

    // 3. Explicit human approval by authenticated TPO
    const approveRes = await request(app)
      .post(`/api/v1/tpo/outreach/campaigns/${campaignId}/approve`)
      .set('Authorization', `Bearer ${tpoTokenA}`)
      .set('x-tenant-id', TENANT_A)
      .send({ notes: 'TPO verified recruiter roster and dynamic copy placeholders.' });

    expect(approveRes.status).toBe(200);
    expect(approveRes.body.data.status).toBe('APPROVED');

    // 4. Dispatching succeeds after human approval
    const sendAfterApprovalRes = await request(app)
      .post(`/api/v1/tpo/outreach/campaigns/${campaignId}/send`)
      .set('Authorization', `Bearer ${tpoTokenA}`)
      .set('x-tenant-id', TENANT_A);

    expect(sendAfterApprovalRes.status).toBe(200);
    expect(sendAfterApprovalRes.body.data.campaign.status).toBe('SENT');
  });

  // ===========================================================================
  // Scenario 17: Duplicate Email Recipient Prevention Within Outreach Campaigns
  // ===========================================================================
  it('Scenario 17: Duplicate email recipient prevention within outreach campaigns', async () => {
    // Add two recruiter contacts sharing the exact same email
    const duplicateEmail = 'duplicate.hr@enterprise.example.com';
    recruiterOutreachService.addContact(TENANT_A, {
      companyName: 'Enterprise Alpha',
      contactName: 'HR Contact 1',
      email: duplicateEmail,
      designation: 'Campus Recruiter',
      industry: 'Information Technology',
      verificationStatus: 'VERIFIED',
      isUnsubscribed: false,
      pastDriveCount: 1
    });
    recruiterOutreachService.addContact(TENANT_A, {
      companyName: 'Enterprise Beta',
      contactName: 'HR Contact 2',
      email: duplicateEmail, // SAME EMAIL
      designation: 'Talent Acquisition Lead',
      industry: 'Information Technology',
      verificationStatus: 'VERIFIED',
      isUnsubscribed: false,
      pastDriveCount: 2
    });

    // Preview campaign and verify deduplication
    const preview = recruiterOutreachService.previewCampaign(TENANT_A, 'camp-0000-01');

    expect(preview.duplicateContactsCount).toBeGreaterThan(0);
    const matchedRecipients = preview.eligibleRecipients.filter(
      (r) => r.email.toLowerCase() === duplicateEmail.toLowerCase()
    );
    expect(matchedRecipients.length).toBe(1); // Exactly 1 recipient retained
  });

  // ===========================================================================
  // Scenario 18: Unsubscribe and Suppression List Handling
  // ===========================================================================
  it('Scenario 18: Unsubscribe and suppression list handling', async () => {
    // In seedDefaultData, Suresh Patel (suresh@optedout.example.com) is marked isUnsubscribed: true
    const suppressedEmail = 'suresh@optedout.example.com';
    expect(recruiterOutreachService.isEmailSuppressed(suppressedEmail)).toBe(true);

    const preview = recruiterOutreachService.previewCampaign(TENANT_A, 'camp-0000-01');

    expect(preview.suppressedContactsCount).toBeGreaterThan(0);
    expect(preview.eligibleRecipients.some((r) => r.email === suppressedEmail)).toBe(false);
    expect(preview.warnings.some((w) => w.includes('excluded due to active unsubscribe'))).toBe(true);
  });

  // ===========================================================================
  // Scenario 19: Export Data Isolation Strictly Scoped to Caller's Tenant
  // ===========================================================================
  it('Scenario 19: Export data isolation strictly scoped to caller\'s tenant', async () => {
    // Tenant A exports a report
    const exportResA = await request(app)
      .post('/api/v1/tpo/accreditation/reports/export')
      .set('Authorization', `Bearer ${tpoTokenA}`)
      .set('x-tenant-id', TENANT_A)
      .send({
        templateCode: 'NAAC_5_2_1',
        filters: { batchYear: 2025 },
        format: 'JSON'
      });

    expect(exportResA.status).toBe(201);
    const reportIdA = exportResA.body.data.reportId;
    expect(exportResA.body.data.tenantId).toBe(TENANT_A);

    // Tenant A can retrieve its own report -> 200 OK
    const getResA = await request(app)
      .get(`/api/v1/tpo/accreditation/reports/${reportIdA}`)
      .set('Authorization', `Bearer ${tpoTokenA}`)
      .set('x-tenant-id', TENANT_A);
    expect(getResA.status).toBe(200);
    expect(getResA.body.data.tenantId).toBe(TENANT_A);

    // Tenant B attempts to retrieve Tenant A's report -> 403 Forbidden
    const getResB = await request(app)
      .get(`/api/v1/tpo/accreditation/reports/${reportIdA}`)
      .set('Authorization', `Bearer ${tpoTokenB}`)
      .set('x-tenant-id', TENANT_B);

    expect(getResB.status).toBe(403);
    expect(getResB.body.code).toBe('FORBIDDEN_TENANT_ACCESS');
    expect(getResB.body.error).toContain('Cannot access reports belonging to another tenant');
  });

  // ===========================================================================
  // Scenario 20: Zero Fabricated Placement Records or Synthetic Numbers
  // ===========================================================================
  it('Scenario 20: Zero fabricated placement records or synthetic numbers', async () => {
    // Check Tenant A overview: guaranteed empirical calculation flag
    const resA = await request(app)
      .get('/api/v1/tpo/institutional/overview?batchYear=2025')
      .set('Authorization', `Bearer ${tpoTokenA}`)
      .set('x-tenant-id', TENANT_A);

    expect(resA.status).toBe(200);
    const dqA = resA.body.data.dataQuality;
    expect(dqA.zeroFabricatedDataGuaranteed).toBe(true);
    expect(dqA.sourceRecords).toBeDefined();
    expect(dqA.sourceRecords.students).toBe(100);
    expect(dqA.sourceRecords.offers).toBe(88); // 88 offers across 10 placement drives
    expect(dqA.sourceRecords.drives).toBe(10);

    // Check Tenant B where no records exist: must NOT fabricate synthetic numbers
    const resB = await request(app)
      .get('/api/v1/tpo/institutional/overview?batchYear=2025')
      .set('Authorization', `Bearer ${tpoTokenB}`)
      .set('x-tenant-id', TENANT_B);

    expect(resB.status).toBe(200);
    const dqB = resB.body.data.dataQuality;
    expect(dqB.zeroFabricatedDataGuaranteed).toBe(true);
    expect(dqB.observationCount).toBe(0);
    expect(resB.body.data.placementRate.value).toBeNull();
    expect(resB.body.data.verifiedSkillCoverage.value).toBeNull();
    expect(resB.body.data.skillGapClosureRate.value).toBeNull();
    expect(resB.body.data.shortlistToOfferRatio.value).toBeNull();
  });
});
