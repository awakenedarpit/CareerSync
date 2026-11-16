/**
 * CarrerSync Phase 17 — Institutional Intelligence, Governance & Accreditation Test Suite
 *
 * Comprehensive tests covering:
 * 1. Institutional KPI Service & Empirical Formulas (Placement Rate, Denominators, Engagement Score)
 * 2. Data Quality Observability & Missing Data Handling (INSUFFICIENT_DATA safeguards, N < 5)
 * 3. Cohort Skill Intelligence & Interactive Heatmaps across 5 dimensions
 * 4. Training Intervention Lifecycle & Mastery Verification (Attendance != Mastery)
 * 5. Supportive Non-Stigmatizing Student Classifications
 * 6. Algorithmic Fairness Governance & EEOC Four-Fifths Benchmarking
 * 7. Small-Group Privacy Suppression (N < 5)
 * 8. Accreditation Reporting & Evidence Traceability across 14 Categories
 * 9. Recruiter Outreach Campaign Lifecycle, Mandatory Human Approval & ₹0 Fallback
 * 10. Express 5 REST API Endpoints & Role-Based Access Control (RBAC)
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

describe('Phase 17 — Institutional Intelligence, Governance & Accreditation Suite', () => {
  const TENANT_A = '11111111-1111-4111-8111-111111111111';
  const TENANT_B = '22222222-2222-4222-8222-222222222222';

  // Test User Contexts
  const tpoAdminUser = {
    id: 'tpo-admin-1',
    email: 'tpo.head@institution.edu',
    role: 'TPO_ADMIN',
    tenantId: TENANT_A
  };

  const collegeAdminUser = {
    id: 'college-admin-1',
    email: 'principal@institution.edu',
    role: 'COLLEGE_ADMIN',
    tenantId: TENANT_A
  };

  const superAdminUser = {
    id: 'super-admin-1',
    email: 'admin@carrersync.com',
    role: 'SUPER_ADMIN',
    tenantId: TENANT_A
  };

  const studentUser = {
    id: 'student-user-1',
    email: 'student@institution.edu',
    role: 'STUDENT',
    tenantId: TENANT_A
  };

  const recruiterUser = {
    id: 'recruiter-user-1',
    email: 'hr@globaltech.com',
    role: 'RECRUITER',
    tenantId: TENANT_A
  };

  // JWT Tokens
  let tpoToken: string;
  let collegeAdminToken: string;
  let superAdminToken: string;
  let studentToken: string;
  let recruiterToken: string;

  beforeEach(async () => {
    // Reset and seed in-memory stores
    institutionalKpiService.resetStore();
    institutionalKpiService.seedCohort(TENANT_A, 2025);

    cohortSkillIntelligenceService.resetStore();
    cohortSkillIntelligenceService.seedDefaultData(TENANT_A);

    fairnessGovernanceService.resetStore();
    fairnessGovernanceService.seedDefaultData(TENANT_A);

    accreditationReportingService.resetStore();

    recruiterOutreachService.resetStore();
    recruiterOutreachService.seedDefaultData(TENANT_A);

    // Generate authenticated JWT tokens
    tpoToken = await createJwtToken({
      sub: tpoAdminUser.id,
      tenant_id: tpoAdminUser.tenantId,
      role: tpoAdminUser.role,
      email: tpoAdminUser.email
    });

    collegeAdminToken = await createJwtToken({
      sub: collegeAdminUser.id,
      tenant_id: collegeAdminUser.tenantId,
      role: collegeAdminUser.role,
      email: collegeAdminUser.email
    });

    superAdminToken = await createJwtToken({
      sub: superAdminUser.id,
      tenant_id: superAdminUser.tenantId,
      role: superAdminUser.role,
      email: superAdminUser.email
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

  // ===========================================================================
  // 1. Institutional KPI Service Tests
  // ===========================================================================
  describe('1. Institutional KPI Service & Formulas', () => {
    it('calculates real empirical placement rate with explicit denominator (N_placed / N_eligible)', () => {
      const overview = institutionalKpiService.getInstitutionalOverview(TENANT_A, { batchYear: 2025 });

      expect(overview.placementRate).toBeDefined();
      expect(overview.placementRate.numerator).toBe(72); // 72 placed
      expect(overview.placementRate.denominator).toBe(90); // 90 eligible
      expect(overview.placementRate.value).toBe(80.0); // 80%
      expect(overview.placementRate.status).toBe('SUFFICIENT_DATA');
      expect(overview.placementRate.explanation).toContain('72 placed students out of 90 eligible candidates');
    });

    it('calculates verified skill coverage (students with >= 1 verified skill / population)', () => {
      const overview = institutionalKpiService.getInstitutionalOverview(TENANT_A, { batchYear: 2025 });

      expect(overview.verifiedSkillCoverage).toBeDefined();
      expect(overview.verifiedSkillCoverage.numerator).toBe(85); // 85 students with verified skill
      expect(overview.verifiedSkillCoverage.denominator).toBe(100); // 100 total enrolled
      expect(overview.verifiedSkillCoverage.value).toBe(85.0);
      expect(overview.verifiedSkillCoverage.averageVerifiedSkillsPerStudent).toBeGreaterThan(0);
      expect(overview.verifiedSkillCoverage.status).toBe('SUFFICIENT_DATA');
    });

    it('calculates skill-gap closure rate correctly', () => {
      const overview = institutionalKpiService.getInstitutionalOverview(TENANT_A, { batchYear: 2025 });

      expect(overview.skillGapClosureRate).toBeDefined();
      expect(overview.skillGapClosureRate.denominator).toBeGreaterThan(0);
      expect(overview.skillGapClosureRate.numerator).toBeLessThanOrEqual(overview.skillGapClosureRate.denominator);
      expect(overview.skillGapClosureRate.value).toBeGreaterThan(0);
      expect(overview.skillGapClosureRate.status).toBe('SUFFICIENT_DATA');
    });

    it('calculates shortlist-to-offer ratio and time-to-shortlist', () => {
      const overview = institutionalKpiService.getInstitutionalOverview(TENANT_A, { batchYear: 2025 });

      // Shortlist to offer
      expect(overview.shortlistToOfferRatio).toBeDefined();
      expect(overview.shortlistToOfferRatio.numerator).toBeGreaterThan(0);
      expect(overview.shortlistToOfferRatio.denominator).toBeGreaterThan(0);
      expect(overview.shortlistToOfferRatio.value).toBeGreaterThan(0);

      // Time to shortlist
      expect(overview.timeToShortlist).toBeDefined();
      expect(overview.timeToShortlist.averageDays).toBeGreaterThan(0);
      expect(overview.timeToShortlist.medianDays).toBeGreaterThan(0);
      expect(overview.timeToShortlist.evaluatedDrivesCount).toBe(10);
    });

    it('computes transparent and explainable Recruiter Engagement Score (0-100)', () => {
      const overview = institutionalKpiService.getInstitutionalOverview(TENANT_A, { batchYear: 2025 });

      const eng = overview.recruiterEngagement;
      expect(eng).toBeDefined();
      expect(eng.overallScore).toBeGreaterThanOrEqual(0);
      expect(eng.overallScore).toBeLessThanOrEqual(100);
      expect(eng.formulaExplanation).toContain('Active Recruiters');
      expect(eng.components.activeRecruiters.weight).toBe(0.25);
      expect(eng.components.drivesConducted.weight).toBe(0.20);
      expect(eng.components.studentParticipation.weight).toBe(0.20);
      expect(eng.components.feedbackCompletion.weight).toBe(0.15);
      expect(eng.components.offersPerDrive.weight).toBe(0.20);
    });

    it('returns INSUFFICIENT_DATA and explicit nulls when data is sparse (N < 5) with zero fabricated statistics', () => {
      institutionalKpiService.resetStore();

      // Seed only 2 students for Tenant B
      institutionalKpiService.addStudent({
        id: 'std-sparse-1',
        tenantId: TENANT_B,
        rollNumber: 'CS-2025-001',
        department: 'Computer Science',
        batchYear: 2025,
        isEligibleForPlacement: true,
        hasOffer: false,
        offerCount: 0,
        verifiedSkillCount: 0,
        totalIdentifiedGaps: 1,
        closedGaps: 0
      });
      institutionalKpiService.addStudent({
        id: 'std-sparse-2',
        tenantId: TENANT_B,
        rollNumber: 'CS-2025-002',
        department: 'Computer Science',
        batchYear: 2025,
        isEligibleForPlacement: true,
        hasOffer: true,
        offerCount: 1,
        verifiedSkillCount: 1,
        totalIdentifiedGaps: 1,
        closedGaps: 1
      });

      const overview = institutionalKpiService.getInstitutionalOverview(TENANT_B, { batchYear: 2025 });

      expect(overview.dataQuality.status).toBe('INSUFFICIENT_DATA');
      expect(overview.dataQuality.warnings).toContain('Cohort sample size N < 5. Small-group suppression active.');
      expect(overview.placementRate.status).toBe('INSUFFICIENT_DATA');
      expect(overview.dataQuality.zeroFabricatedDataGuaranteed).toBe(true);
    });

    it('enforces multi-tenant isolation (Tenant A data does not leak into Tenant B)', () => {
      const overviewB = institutionalKpiService.getInstitutionalOverview(TENANT_B, { batchYear: 2025 });
      expect(overviewB.dataQuality.observationCount).toBe(0);
      expect(overviewB.placementRate.denominator).toBe(0);
      expect(overviewB.placementRate.value).toBeNull();
      expect(overviewB.placementRate.status).toBe('INSUFFICIENT_DATA');
    });
  });

  // ===========================================================================
  // 2. Cohort Skill Intelligence & Training Interventions Tests
  // ===========================================================================
  describe('2. Cohort Skill Intelligence & Interventions', () => {
    it('generates heatmaps across all 5 analytical dimensions', () => {
      const dims: Array<'department_vs_skill' | 'batch_vs_skill' | 'target_role_vs_skill' | 'verified_vs_missing' | 'gap_vs_intervention'> = [
        'department_vs_skill',
        'batch_vs_skill',
        'target_role_vs_skill',
        'verified_vs_missing',
        'gap_vs_intervention'
      ];

      for (const d of dims) {
        const heatmap = cohortSkillIntelligenceService.generateHeatmap(TENANT_A, d);
        expect(heatmap.heatmapType).toBe(d);
        expect(heatmap.dimensions.rows.length).toBeGreaterThan(0);
        expect(heatmap.dimensions.cols.length).toBeGreaterThan(0);
        expect(heatmap.cells.length).toBe(heatmap.dimensions.rows.length * heatmap.dimensions.cols.length);
        expect(heatmap.summary.topIdentifiedGaps.length).toBeGreaterThan(0);
        expect(heatmap.summary.topVerifiedStrengths.length).toBeGreaterThan(0);
      }
    });

    it('manages training intervention lifecycle and enforces that course attendance alone != skill mastery', () => {
      // 1. Create intervention
      const intervention = cohortSkillIntelligenceService.createIntervention(TENANT_A, 'tpo-user-1', {
        title: 'Cloud DevOps Intensive Clinic',
        description: 'Hands-on Kubernetes and Terraform project lab',
        targetSkill: 'Kubernetes',
        targetDepartment: 'Computer Science & Engineering',
        targetBatch: 2025,
        startDate: '2025-01-10',
        endDate: '2025-02-28',
        actionPlan: 'Deploy multi-service microservices to AWS EKS with ArgoCD'
      });

      expect(intervention.id).toBeDefined();
      expect(intervention.status).toBe('PROPOSED');
      expect(intervention.attendanceOnlyDoesNotEqualMasteryRuleEnforced).toBe(true);

      // 2. Approve intervention
      const approved = cohortSkillIntelligenceService.updateIntervention(
        TENANT_A,
        intervention.id,
        'tpo-user-1',
        { status: 'APPROVED' }
      );
      expect(approved.status).toBe('APPROVED');
      expect(approved.approvedBy).toBe('tpo-user-1');

      // 3. Submit participant evidence
      const withEvidence = cohortSkillIntelligenceService.submitParticipantEvidence(TENANT_A, intervention.id, {
        studentId: 'std-p1',
        rollNumber: 'CS-2025-050',
        department: 'Computer Science & Engineering',
        projectEvidenceUrl: 'https://github.com/student/eks-gitops',
        projectEvidenceDescription: 'Production-ready Helm charts and ArgoCD manifests'
      });
      expect(withEvidence.participantCount).toBe(1);
      expect(withEvidence.participants[0].projectEvidenceSubmitted).toBe(true);
      expect(withEvidence.participants[0].tpoVerified).toBe(false);

      // 4. Verify participant evidence by TPO
      const verified = cohortSkillIntelligenceService.verifyParticipantEvidence(
        TENANT_A,
        intervention.id,
        'std-p1',
        'tpo-admin-1',
        true
      );
      expect(verified.participants[0].tpoVerified).toBe(true);
      expect(verified.participants[0].verifiedSkillGainRecorded).toBe(true);
      expect(verified.verifiedImprovementRate).toBe(100.0);

      // 5. Attempting to verify a student who only attended without project evidence throws Policy violation
      verified.participants.push({
        studentId: 'std-p2-attendance-only',
        rollNumber: 'CS-2025-051',
        department: 'Computer Science & Engineering',
        attendanceVerified: true,
        projectEvidenceSubmitted: false, // NO project evidence
        tpoVerified: false,
        verifiedSkillGainRecorded: false
      });

      expect(() => {
        cohortSkillIntelligenceService.verifyParticipantEvidence(
          TENANT_A,
          intervention.id,
          'std-p2-attendance-only',
          'tpo-admin-1',
          true
        );
      }).toThrow(/Policy violation: Course attendance alone cannot certify skill mastery/);
    });

    it('assigns supportive, non-stigmatizing student classifications without public rankings', () => {
      const profiles = cohortSkillIntelligenceService.getStudentSupportOverview(TENANT_A);

      expect(profiles.length).toBeGreaterThan(0);
      for (const p of profiles) {
        expect([
          'SUPPORT_RECOMMENDED',
          'ADDITIONAL_PRACTICE_SUGGESTED',
          'INSUFFICIENT_DATA',
          'PROGRESSING',
          'NO_ACTION_REQUIRED'
        ]).toContain(p.classification);
        expect(p.isStigmatizingRankingPrevented).toBe(true);
        expect(p.reason.length).toBeGreaterThan(10);
      }
    });
  });

  // ===========================================================================
  // 3. Fairness Governance & Four-Fifths Benchmarking Tests
  // ===========================================================================
  describe('3. Algorithmic Fairness Governance & Four-Fifths Benchmark', () => {
    it('analyzes selection funnel stage-by-stage conversions', () => {
      const funnel = fairnessGovernanceService.getSelectionFunnel(TENANT_A);

      expect(funnel.stages.eligible).toBe(500);
      expect(funnel.stages.applications).toBe(420);
      expect(funnel.stages.shortlisted).toBe(210);
      expect(funnel.stages.assessmentsPassed).toBe(140);
      expect(funnel.stages.interviewsPassed).toBe(80);
      expect(funnel.stages.offers).toBe(65);
      expect(funnel.stages.confirmed).toBe(60);

      expect(funnel.conversionRates.applicationRate).toBe(84.0);
      expect(funnel.conversionRates.shortlistRate).toBe(50.0);
      expect(funnel.conversionRates.offerRate).toBe(81.25);
    });

    it('evaluates EEOC Four-Fifths rule and flags disparities below 0.80', () => {
      const result = fairnessGovernanceService.evaluateDisparities(TENANT_A);

      expect(result.evaluations.length).toBeGreaterThan(0);
      expect(result.flaggedCount).toBeGreaterThan(0);
      expect(result.disclaimer).toContain('NOT constitute an automated finding of bias or unlawful discrimination');

      // Check a flagged group
      const ecGroup = result.evaluations.find((e) => e.groupName === 'Electronics & Communication');
      expect(ecGroup).toBeDefined();
      expect(ecGroup!.disparityRatio).toBeLessThan(0.80);
      expect(ecGroup!.requiresHumanReview).toBe(true);
      expect(ecGroup!.fourFifthsThresholdMet).toBe(false);
      expect(ecGroup!.reviewFlagReason).toContain('below the 0.80 EEOC Four-Fifths benchmark');
    });

    it('strictly enforces small-group privacy suppression for N < 5', () => {
      const result = fairnessGovernanceService.evaluateDisparities(TENANT_A);

      const suppressedGroup = result.evaluations.find((e) => e.groupName === 'Biotechnology');
      expect(suppressedGroup).toBeDefined();
      expect(suppressedGroup!.sampleSize).toBe(4); // N = 4 < 5
      expect(suppressedGroup!.isSuppressed).toBe(true);
      expect(suppressedGroup!.groupSelectionRate).toBeNull();
      expect(suppressedGroup!.disparityRatio).toBeNull();
      expect(suppressedGroup!.requiresHumanReview).toBe(false); // Small samples do not trigger false statistical alerts
      expect(suppressedGroup!.reviewFlagReason).toContain('Sample size N < 5 is suppressed');
    });

    it('manages fairness review case workflow with complete audit trail', () => {
      // 1. Create case
      const reviewCase = fairnessGovernanceService.createFairnessCase(TENANT_A, 'tpo-user-1', {
        metricName: 'Technical Assessment Screening Disparity',
        affectedGroup: 'Mechanical Engineering',
        referenceGroup: 'Computer Science & Engineering',
        groupSelectionRate: 35.0,
        referenceGroupSelectionRate: 75.0,
        disparityRatio: 0.47,
        reviewerNotes: 'Noticeable gap in coding round scores.'
      });

      expect(reviewCase.id).toBeDefined();
      expect(reviewCase.status).toBe('FLAGGED');
      expect(reviewCase.disparityRatio).toBe(0.47);

      // 2. Transition through workflow
      const underReview = fairnessGovernanceService.updateFairnessCase(
        TENANT_A,
        reviewCase.id,
        'tpo-admin-1',
        { status: 'UNDER_REVIEW', assignedReviewerId: 'tpo-admin-1' }
      );
      expect(underReview.status).toBe('UNDER_REVIEW');
      expect(underReview.assignedReviewerId).toBe('tpo-admin-1');

      // 3. Request explanation
      const explanationRequested = fairnessGovernanceService.updateFairnessCase(
        TENANT_A,
        reviewCase.id,
        'tpo-admin-1',
        {
          status: 'EXPLANATION_REQUESTED',
          explanation: 'Department chair noted lack of prerequisite data structures module in semester 4.'
        }
      );
      expect(explanationRequested.status).toBe('EXPLANATION_REQUESTED');
      expect(explanationRequested.explanation).toBeDefined();

      // 4. Resolve with remedial action
      const resolved = fairnessGovernanceService.updateFairnessCase(
        TENANT_A,
        reviewCase.id,
        'tpo-admin-1',
        {
          status: 'RESOLVED',
          resolutionReason: 'Approved targeted 4-week algorithmic bootcamp intervention for semester 5.'
        }
      );
      expect(resolved.status).toBe('RESOLVED');
      expect(resolved.resolutionReason).toContain('algorithmic bootcamp');
      expect(resolved.auditTrail.length).toBe(4);
    });
  });

  // ===========================================================================
  // 4. Accreditation Reporting & Traceability Tests
  // ===========================================================================
  describe('4. Accreditation Reporting & Evidence Traceability', () => {
    it('provides 14 configured templates with mandatory regulatory disclaimers', () => {
      const templates = accreditationReportingService.listTemplates();

      expect(templates.length).toBe(14);

      const codes = templates.map((t) => t.code);
      expect(codes).toContain('NAAC_5_2_1');
      expect(codes).toContain('NIRF_GO_OUTCOMES');
      expect(codes).toContain('BRANCH_WISE_SUMMARY');
      expect(codes).toContain('VERIFIED_SKILL_COVERAGE');
      expect(codes).toContain('SKILL_GAP_CLOSURE');
      expect(codes).toContain('TRAINING_INTERVENTIONS');
      expect(codes).toContain('MOCK_ASSESSMENT_PERFORMANCE');
      expect(codes).toContain('ACADEMIC_YEAR_COMPARISON');

      for (const t of templates) {
        expect(t.disclaimer.length).toBeGreaterThan(20);
      }
    });

    it('generates report preview with completeness scores, warnings, and evidence traceability', () => {
      const preview = accreditationReportingService.previewReport(TENANT_A, 'NAAC_5_2_1', {
        batchYear: 2025
      });

      expect(preview.templateCode).toBe('NAAC_5_2_1');
      expect(preview.completenessScore).toBeGreaterThanOrEqual(75);
      expect(preview.regulatoryDisclaimer).toContain('Institutional Reporting Aid');
      expect(preview.evidenceTraceability.length).toBeGreaterThan(0);

      // Check evidence traceability links to database tables and row IDs
      const placementEvidence = preview.evidenceTraceability.find((e) => e.metricKey === 'placementRate');
      expect(placementEvidence).toBeDefined();
      expect(placementEvidence!.sourceTable).toBe('placement_offers');
      expect(placementEvidence!.sampleRecordIds.length).toBeGreaterThan(0);
    });

    it('exports report in multiple formats (JSON, CSV, formatted text/PDF)', () => {
      // JSON
      const jsonExport = accreditationReportingService.exportReport(TENANT_A, 'NAAC_5_2_1', { batchYear: 2025 }, 'JSON');
      expect(jsonExport.format).toBe('JSON');
      expect(jsonExport.contentType).toBe('application/json');
      expect(typeof jsonExport.content).toBe('string');
      expect(JSON.parse(jsonExport.content as string).templateCode).toBe('NAAC_5_2_1');

      // CSV
      const csvExport = accreditationReportingService.exportReport(TENANT_A, 'NAAC_5_2_1', { batchYear: 2025 }, 'CSV');
      expect(csvExport.format).toBe('CSV');
      expect(csvExport.contentType).toBe('text/csv');
      expect(csvExport.content).toContain('Metric Key,Metric Label,Value,Source Table');

      // PDF representation
      const pdfExport = accreditationReportingService.exportReport(TENANT_A, 'NAAC_5_2_1', { batchYear: 2025 }, 'PDF');
      expect(pdfExport.format).toBe('PDF');
      expect(pdfExport.contentType).toBe('application/pdf');
      expect(pdfExport.content).toContain('INSTITUTIONAL ACCREDITATION REPORT');
    });
  });

  // ===========================================================================
  // 5. Recruiter Outreach Campaign Tests
  // ===========================================================================
  describe('5. Recruiter Outreach & ₹0 Cardless Engine', () => {
    it('manages contact directory, verification, and unsubscribed / suppression filtering', () => {
      const contacts = recruiterOutreachService.listContacts(TENANT_A);
      expect(contacts.length).toBe(5);

      // Suresh Patel is unsubscribed
      expect(recruiterOutreachService.isEmailSuppressed('suresh@optedout.example.com')).toBe(true);
      expect(recruiterOutreachService.isEmailSuppressed('ananya.sharma@google-recruiting.example.com')).toBe(false);
    });

    it('previews campaign with recipient deduplication and suppression filtering', () => {
      const preview = recruiterOutreachService.previewCampaign(TENANT_A, 'camp-0000-01');

      expect(preview.campaignId).toBe('camp-0000-01');
      expect(preview.suppressedContactsCount).toBe(1); // Suresh Patel excluded
      expect(preview.totalEligibleContacts).toBe(3); // Matches IT and Consulting filters
      expect(preview.sampleRenderedBody).toContain('Dear ');
      expect(preview.warnings.some((w) => w.includes('excluded due to active unsubscribe'))).toBe(true);
    });

    it('strictly enforces mandatory human approval gate before dispatch', () => {
      // 1. Attempting to dispatch a DRAFT campaign fails immediately
      expect(() => {
        recruiterOutreachService.sendCampaign(TENANT_A, 'camp-0000-01', 'tpo-user-1');
      }).toThrow(/CAMPAIGN_NOT_APPROVED: Campaign status is 'DRAFT'/);

      // 2. Explicit human approval
      const approved = recruiterOutreachService.approveCampaign(
        TENANT_A,
        'camp-0000-01',
        'tpo-admin-1',
        'Confirmed Batch 2025 recruiter list and email template.'
      );
      expect(approved.status).toBe('APPROVED');
      expect(approved.approvedBy).toBe('tpo-admin-1');

      // 3. Dispatch succeeds after approval
      const dispatchResult = recruiterOutreachService.sendCampaign(TENANT_A, 'camp-0000-01', 'tpo-user-1');
      expect(dispatchResult.campaign.status).toBe('SENT');
      expect(dispatchResult.summary.sentCount).toBe(3);
      expect(dispatchResult.summary.skippedCount).toBe(1);
    });

    it('generates ₹0 cardless CSV mail merge export as a fallback', () => {
      const csv = recruiterOutreachService.generateCampaignCsvExport(TENANT_A, 'camp-0000-01');

      expect(csv).toContain('Contact ID,Company Name,Contact Person,Email,Subject,Personalized Body');
      expect(csv).toContain('Google Cloud India');
      expect(csv).toContain('Tata Consultancy Services');
    });
  });

  // ===========================================================================
  // 6. REST API Endpoints & RBAC Integration Tests
  // ===========================================================================
  describe('6. REST API Endpoints & RBAC Integration', () => {
    // A. Institutional Overview Routes
    it('GET /api/v1/tpo/institutional/overview allows TPO_ADMIN and rejects unauthenticated/students', async () => {
      // 1. TPO Admin -> 200 OK
      const resTpo = await request(app)
        .get('/api/v1/tpo/institutional/overview?batchYear=2025')
        .set('Authorization', `Bearer ${tpoToken}`)
        .set('x-tenant-id', TENANT_A);

      expect(resTpo.status).toBe(200);
      expect(resTpo.body.success).toBe(true);
      expect(resTpo.body.data.placementRate).toBeDefined();

      // 2. Student -> 403 Forbidden
      const resStudent = await request(app)
        .get('/api/v1/tpo/institutional/overview')
        .set('Authorization', `Bearer ${studentToken}`)
        .set('x-tenant-id', TENANT_A);

      expect(resStudent.status).toBe(403);
      expect(resStudent.body.code).toBe('FORBIDDEN_INSUFFICIENT_ROLE');

      // 3. Recruiter -> 403 Forbidden
      const resRecruiter = await request(app)
        .get('/api/v1/tpo/institutional/overview')
        .set('Authorization', `Bearer ${recruiterToken}`)
        .set('x-tenant-id', TENANT_A);

      expect(resRecruiter.status).toBe(403);

      // 4. Missing Token -> 401 Unauthorized
      const resAnon = await request(app).get('/api/v1/tpo/institutional/overview');
      expect(resAnon.status).toBe(401);
    });

    it('GET /api/v1/tpo/institutional/cohort, /skills, /placements, /recruiters return 200 for TPO', async () => {
      const resCohort = await request(app)
        .get('/api/v1/tpo/institutional/cohort')
        .set('Authorization', `Bearer ${tpoToken}`)
        .set('x-tenant-id', TENANT_A);
      expect(resCohort.status).toBe(200);
      expect(Array.isArray(resCohort.body.data)).toBe(true);

      const resSkills = await request(app)
        .get('/api/v1/tpo/institutional/skills?type=department_vs_skill')
        .set('Authorization', `Bearer ${tpoToken}`)
        .set('x-tenant-id', TENANT_A);
      expect(resSkills.status).toBe(200);
      expect(resSkills.body.data.cells).toBeDefined();

      const resPlacements = await request(app)
        .get('/api/v1/tpo/institutional/placements')
        .set('Authorization', `Bearer ${tpoToken}`)
        .set('x-tenant-id', TENANT_A);
      expect(resPlacements.status).toBe(200);
      expect(resPlacements.body.data.placementRate).toBeDefined();

      const resRecruiters = await request(app)
        .get('/api/v1/tpo/institutional/recruiters')
        .set('Authorization', `Bearer ${tpoToken}`)
        .set('x-tenant-id', TENANT_A);
      expect(resRecruiters.status).toBe(200);
      expect(resRecruiters.body.data.recruiterEngagement).toBeDefined();
    });

    it('GET /api/v1/college-admin/institutional/overview allows College Admin and rejects TPO', async () => {
      // 1. College Admin -> 200 OK
      const resAdmin = await request(app)
        .get('/api/v1/college-admin/institutional/overview')
        .set('Authorization', `Bearer ${collegeAdminToken}`)
        .set('x-tenant-id', TENANT_A);

      expect(resAdmin.status).toBe(200);
      expect(resAdmin.body.data.placementRate).toBeDefined();

      // 2. Super Admin -> 200 OK
      const resSuper = await request(app)
        .get('/api/v1/college-admin/institutional/overview')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .set('x-tenant-id', TENANT_A);

      expect(resSuper.status).toBe(200);

      // 3. TPO Admin -> 403 Forbidden
      const resTpo = await request(app)
        .get('/api/v1/college-admin/institutional/overview')
        .set('Authorization', `Bearer ${tpoToken}`)
        .set('x-tenant-id', TENANT_A);

      expect(resTpo.status).toBe(403);
      expect(resTpo.body.code).toBe('FORBIDDEN_INSUFFICIENT_ROLE');
    });

    // B. Training Interventions Routes
    it('tests Interventions CRUD endpoints via REST API', async () => {
      // 1. List
      const resList = await request(app)
        .get('/api/v1/tpo/interventions')
        .set('Authorization', `Bearer ${tpoToken}`)
        .set('x-tenant-id', TENANT_A);
      expect(resList.status).toBe(200);
      expect(Array.isArray(resList.body.data)).toBe(true);

      // 2. Create
      const resCreate = await request(app)
        .post('/api/v1/tpo/interventions')
        .set('Authorization', `Bearer ${tpoToken}`)
        .set('x-tenant-id', TENANT_A)
        .send({
          title: 'Advanced AI & Machine Learning Workshop',
          description: 'Deep Learning with PyTorch',
          targetSkill: 'Deep Learning',
          targetDepartment: 'Computer Science & Engineering',
          targetBatch: 2025,
          startDate: '2025-03-01',
          endDate: '2025-04-15',
          actionPlan: 'Transformer architecture coding project'
        });

      expect(resCreate.status).toBe(201);
      const newId = resCreate.body.data.id;

      // 3. Get by ID
      const resGet = await request(app)
        .get(`/api/v1/tpo/interventions/${newId}`)
        .set('Authorization', `Bearer ${tpoToken}`)
        .set('x-tenant-id', TENANT_A);
      expect(resGet.status).toBe(200);
      expect(resGet.body.data.targetSkill).toBe('Deep Learning');

      // 4. Patch
      const resPatch = await request(app)
        .patch(`/api/v1/tpo/interventions/${newId}`)
        .set('Authorization', `Bearer ${tpoToken}`)
        .set('x-tenant-id', TENANT_A)
        .send({ status: 'APPROVED', notes: 'Approved for Q1' });
      expect(resPatch.status).toBe(200);
      expect(resPatch.body.data.status).toBe('APPROVED');
    });

    // C. Fairness Routes
    it('tests Fairness Governance REST API endpoints', async () => {
      // 1. GET fairness overview
      const resGet = await request(app)
        .get('/api/v1/tpo/fairness')
        .set('Authorization', `Bearer ${tpoToken}`)
        .set('x-tenant-id', TENANT_A);

      expect(resGet.status).toBe(200);
      expect(resGet.body.data.funnel).toBeDefined();
      expect(resGet.body.data.disparities).toBeDefined();

      // 2. POST review case
      const resPost = await request(app)
        .post('/api/v1/tpo/fairness/reviews')
        .set('Authorization', `Bearer ${tpoToken}`)
        .set('x-tenant-id', TENANT_A)
        .send({
          metricName: 'Shortlist Disparity in Data Science Role',
          affectedGroup: 'Civil Engineering',
          referenceGroup: 'Computer Science',
          groupSelectionRate: 25.0,
          referenceGroupSelectionRate: 70.0,
          disparityRatio: 0.36,
          reviewerNotes: 'Requires syllabus audit'
        });

      expect(resPost.status).toBe(201);
      const caseId = resPost.body.data.id;

      // 3. PATCH review case
      const resPatch = await request(app)
        .patch(`/api/v1/tpo/fairness/reviews/${caseId}`)
        .set('Authorization', `Bearer ${tpoToken}`)
        .set('x-tenant-id', TENANT_A)
        .send({
          status: 'UNDER_REVIEW',
          reviewerNotes: 'Investigating curriculum differences'
        });

      expect(resPatch.status).toBe(200);
      expect(resPatch.body.data.status).toBe('UNDER_REVIEW');
    });

    // D. Accreditation Routes
    it('tests Accreditation templates, preview, and export via REST API', async () => {
      // 1. Templates
      const resTemplates = await request(app)
        .get('/api/v1/tpo/accreditation/templates')
        .set('Authorization', `Bearer ${tpoToken}`)
        .set('x-tenant-id', TENANT_A);

      expect(resTemplates.status).toBe(200);
      expect(resTemplates.body.data.length).toBe(14);

      // 2. Preview
      const resPreview = await request(app)
        .post('/api/v1/tpo/accreditation/reports/preview')
        .set('Authorization', `Bearer ${tpoToken}`)
        .set('x-tenant-id', TENANT_A)
        .send({
          templateCode: 'NIRF_GO_OUTCOMES',
          filters: { batchYear: 2025 }
        });

      expect(resPreview.status).toBe(200);
      expect(resPreview.body.data.templateCode).toBe('NIRF_GO_OUTCOMES');
      expect(resPreview.body.data.evidenceTraceability.length).toBeGreaterThan(0);

      // 3. Export
      const resExport = await request(app)
        .post('/api/v1/tpo/accreditation/reports/export')
        .set('Authorization', `Bearer ${tpoToken}`)
        .set('x-tenant-id', TENANT_A)
        .send({
          templateCode: 'NIRF_GO_OUTCOMES',
          filters: { batchYear: 2025 },
          format: 'CSV'
        });

      expect(resExport.status).toBe(201);
      expect(resExport.body.data.format).toBe('CSV');
      const repId = resExport.body.data.reportId;

      // 4. Retrieve Export
      const resGetRep = await request(app)
        .get(`/api/v1/tpo/accreditation/reports/${repId}`)
        .set('Authorization', `Bearer ${tpoToken}`)
        .set('x-tenant-id', TENANT_A);

      expect(resGetRep.status).toBe(200);
      expect(resGetRep.body.data.reportId).toBe(repId);
    });

    // E. Outreach Routes
    it('tests Recruiter Outreach campaign lifecycle and approval gating via REST API', async () => {
      // 1. Create campaign
      const resCreate = await request(app)
        .post('/api/v1/tpo/outreach/campaigns')
        .set('Authorization', `Bearer ${tpoToken}`)
        .set('x-tenant-id', TENANT_A)
        .send({
          title: 'Spring 2025 Placement Drive Call',
          subject: 'Exclusive Invitation: Hire Top Engineers from Class of 2025',
          bodyTemplate: 'Dear {{contactName}},\n\nWe invite {{companyName}} to our campus.'
        });

      expect(resCreate.status).toBe(201);
      const campId = resCreate.body.data.id;
      expect(resCreate.body.data.status).toBe('DRAFT');

      // 2. Preview campaign
      const resPreview = await request(app)
        .post(`/api/v1/tpo/outreach/campaigns/${campId}/preview`)
        .set('Authorization', `Bearer ${tpoToken}`)
        .set('x-tenant-id', TENANT_A);

      expect(resPreview.status).toBe(200);
      expect(resPreview.body.data.eligibleRecipients.length).toBeGreaterThan(0);

      // 3. Attempt to dispatch while in DRAFT -> 422 Unprocessable Entity
      const resPrematureSend = await request(app)
        .post(`/api/v1/tpo/outreach/campaigns/${campId}/send`)
        .set('Authorization', `Bearer ${tpoToken}`)
        .set('x-tenant-id', TENANT_A);

      expect(resPrematureSend.status).toBe(422);
      expect(resPrematureSend.body.error).toContain('CAMPAIGN_NOT_APPROVED');

      // 4. Approve campaign
      const resApprove = await request(app)
        .post(`/api/v1/tpo/outreach/campaigns/${campId}/approve`)
        .set('Authorization', `Bearer ${tpoToken}`)
        .set('x-tenant-id', TENANT_A)
        .send({ notes: 'TPO verified template and contact list.' });

      expect(resApprove.status).toBe(200);
      expect(resApprove.body.data.status).toBe('APPROVED');

      // 5. Send campaign after approval
      const resSend = await request(app)
        .post(`/api/v1/tpo/outreach/campaigns/${campId}/send`)
        .set('Authorization', `Bearer ${tpoToken}`)
        .set('x-tenant-id', TENANT_A);

      expect(resSend.status).toBe(200);
      expect(resSend.body.data.campaign.status).toBe('SENT');
      expect(resSend.body.data.summary.sentCount).toBeGreaterThan(0);

      // 6. CSV Export fallback
      const resExport = await request(app)
        .get(`/api/v1/tpo/outreach/campaigns/${campId}/export`)
        .set('Authorization', `Bearer ${tpoToken}`)
        .set('x-tenant-id', TENANT_A);

      expect(resExport.status).toBe(200);
      expect(resExport.headers['content-type']).toContain('text/csv');
      expect(resExport.text).toContain('Contact ID,Company Name,Contact Person');
    });
  });
});
