/**
 * CarrerSync Fairness & Algorithmic Governance Service
 * Phase 17 Client Integration Service
 * 
 * Provides APIs and fallback structures for:
 * - Multi-stage selection disparity analysis (Eligible -> Applications -> Shortlists -> Assessments -> Interviews -> Offers)
 * - EEOC Four-Fifths Benchmark: Disparity Ratio = (Group Selection Rate / Reference Selection Rate)
 * - Review Flag when Disparity Ratio < 0.80 (Human Review Required — Never an automated finding of discrimination)
 * - Small-Group Privacy Suppression (N < 5 masked with explicit guard tags)
 * - Fairness Review Cases Queue & Adjudication Lifecycle: FLAGGED -> UNDER_REVIEW -> EXPLANATION_REQUESTED -> RESOLVED / ESCALATED
 * - Zero demographic attribute inference; candidates are never ranked or filtered by sensitive attributes
 */

import apiClient from './api';

export const CASE_STATUSES = {
  FLAGGED: { id: 'FLAGGED', label: 'Flagged for Review', badgeVariant: 'amber', description: 'Four-fifths threshold disparity detected in stage conversion.' },
  UNDER_REVIEW: { id: 'UNDER_REVIEW', label: 'Under Review', badgeVariant: 'purple', description: 'Assigned to TPO Committee for contextual evaluation.' },
  EXPLANATION_REQUESTED: { id: 'EXPLANATION_REQUESTED', label: 'Explanation Requested', badgeVariant: 'indigo', description: 'Recruiter or Department asked for criteria justification.' },
  RESOLVED: { id: 'RESOLVED', label: 'Resolved (No Bias)', badgeVariant: 'emerald', description: 'Legitimate prerequisite criteria verified (e.g. specialized hardware course).' },
  ESCALATED: { id: 'ESCALATED', label: 'Escalated to Head', badgeVariant: 'rose', description: 'Referred to Institutional Dean / Governing Board for corrective policy.' },
};

export const SELECTION_STAGES = [
  'ELIGIBLE_POOL',
  'DRIVE_APPLICATION',
  'TECHNICAL_SHORTLIST',
  'ASSESSMENT_COMPLETION',
  'TECHNICAL_INTERVIEW',
  'OFFER_ISSUANCE',
];

export const FALLBACK_FAIRNESS_ANALYSIS = {
  academicYear: '2025-2026',
  placementSeason: 'Main Season 2025-26',
  overallBenchmarkStatus: 'COMPLIANT_WITH_ADVISORIES',
  referenceGroup: 'Computer Science & Engineering (High-Volume Reference)',
  stagesAnalysis: [
    {
      stage: 'Eligible -> Drive Applications',
      referenceRate: 95.3,
      groups: [
        { groupName: 'Computer Science (CSE)', sampleSize: 172, selectedCount: 164, rate: 95.3, disparityRatio: 1.00, flag: 'OPTIMAL', isSuppressed: false },
        { groupName: 'Information Technology (IT)', sampleSize: 114, selectedCount: 108, rate: 94.7, disparityRatio: 0.99, flag: 'OPTIMAL', isSuppressed: false },
        { groupName: 'Electronics & Comm (ECE)', sampleSize: 102, selectedCount: 96, rate: 94.1, disparityRatio: 0.98, flag: 'OPTIMAL', isSuppressed: false },
        { groupName: 'Electrical & Electronics (EEE)', sampleSize: 56, selectedCount: 51, rate: 91.0, disparityRatio: 0.95, flag: 'OPTIMAL', isSuppressed: false },
        { groupName: 'Mechanical Eng (MECH)', sampleSize: 44, selectedCount: 40, rate: 90.9, disparityRatio: 0.95, flag: 'OPTIMAL', isSuppressed: false },
        { groupName: 'Civil Eng (CIVIL)', sampleSize: 12, selectedCount: 11, rate: 91.6, disparityRatio: 0.96, flag: 'OPTIMAL', isSuppressed: false },
      ],
    },
    {
      stage: 'Applications -> Technical Shortlists',
      referenceRate: 82.3,
      groups: [
        { groupName: 'Computer Science (CSE)', sampleSize: 164, selectedCount: 135, rate: 82.3, disparityRatio: 1.00, flag: 'OPTIMAL', isSuppressed: false },
        { groupName: 'Information Technology (IT)', sampleSize: 108, selectedCount: 86, rate: 79.6, disparityRatio: 0.96, flag: 'OPTIMAL', isSuppressed: false },
        { groupName: 'Electronics & Comm (ECE)', sampleSize: 96, selectedCount: 71, rate: 73.9, disparityRatio: 0.89, flag: 'OPTIMAL', isSuppressed: false },
        { groupName: 'Electrical & Electronics (EEE)', sampleSize: 51, selectedCount: 34, rate: 66.6, disparityRatio: 0.80, flag: 'OPTIMAL', isSuppressed: false },
        { groupName: 'Mechanical Eng (MECH)', sampleSize: 40, selectedCount: 22, rate: 55.0, disparityRatio: 0.66, flag: 'REVIEW_RECOMMENDED', isSuppressed: false },
        { groupName: 'Civil Eng (CIVIL)', sampleSize: 11, selectedCount: 5, rate: 45.4, disparityRatio: 0.55, flag: 'REVIEW_RECOMMENDED', isSuppressed: false },
      ],
    },
    {
      stage: 'Shortlists -> Technical Interviews',
      referenceRate: 85.1,
      groups: [
        { groupName: 'Computer Science (CSE)', sampleSize: 135, selectedCount: 115, rate: 85.1, disparityRatio: 1.00, flag: 'OPTIMAL', isSuppressed: false },
        { groupName: 'Information Technology (IT)', sampleSize: 86, selectedCount: 72, rate: 83.7, disparityRatio: 0.98, flag: 'OPTIMAL', isSuppressed: false },
        { groupName: 'Electronics & Comm (ECE)', sampleSize: 71, selectedCount: 58, rate: 81.6, disparityRatio: 0.95, flag: 'OPTIMAL', isSuppressed: false },
        { groupName: 'Electrical & Electronics (EEE)', sampleSize: 34, selectedCount: 26, rate: 76.4, disparityRatio: 0.89, flag: 'OPTIMAL', isSuppressed: false },
        { groupName: 'Mechanical Eng (MECH)', sampleSize: 22, selectedCount: 16, rate: 72.7, disparityRatio: 0.85, flag: 'OPTIMAL', isSuppressed: false },
        { groupName: 'Civil Eng (CIVIL)', sampleSize: 5, selectedCount: 3, rate: 60.0, disparityRatio: 0.70, flag: 'REVIEW_RECOMMENDED', isSuppressed: false },
        { groupName: 'Biomedical Cohort (Pilot)', sampleSize: 4, selectedCount: null, rate: null, disparityRatio: null, flag: 'SUPPRESSED', isSuppressed: true },
      ],
    },
    {
      stage: 'Interviews -> Final Placement Offers',
      referenceRate: 88.6,
      groups: [
        { groupName: 'Computer Science (CSE)', sampleSize: 115, selectedCount: 102, rate: 88.6, disparityRatio: 1.00, flag: 'OPTIMAL', isSuppressed: false },
        { groupName: 'Information Technology (IT)', sampleSize: 72, selectedCount: 62, rate: 86.1, disparityRatio: 0.97, flag: 'OPTIMAL', isSuppressed: false },
        { groupName: 'Electronics & Comm (ECE)', sampleSize: 58, selectedCount: 48, rate: 82.7, disparityRatio: 0.93, flag: 'OPTIMAL', isSuppressed: false },
        { groupName: 'Electrical & Electronics (EEE)', sampleSize: 26, selectedCount: 21, rate: 80.7, disparityRatio: 0.91, flag: 'OPTIMAL', isSuppressed: false },
        { groupName: 'Mechanical Eng (MECH)', sampleSize: 16, selectedCount: 12, rate: 75.0, disparityRatio: 0.84, flag: 'OPTIMAL', isSuppressed: false },
        { groupName: 'Civil Eng (CIVIL)', sampleSize: 3, selectedCount: null, rate: null, disparityRatio: null, flag: 'SUPPRESSED', isSuppressed: true },
      ],
    },
  ],
  governanceSummary: {
    totalEvaluations: 24,
    optimalRatiosCount: 20,
    reviewFlagsCount: 3,
    smallGroupSuppressionCount: 2,
    guidance: 'Four-fifths rule (80% benchmark) flags disparity for human committee review. A flag is an investigative prompt, NOT an automated legal conclusion of unfair bias.',
  },
};

export const FALLBACK_REVIEW_CASES = [
  {
    id: 'FC-2026-001',
    caseTitle: 'Mechanical Engineering Software Shortlist Disparity',
    driveOrStage: 'Applications -> Technical Shortlists',
    companyOrCohort: 'Global Cloud Systems Drive (Nov 2026)',
    affectedGroup: 'Mechanical Engineering (MECH)',
    referenceGroup: 'Computer Science (CSE)',
    selectionRateGroup: '55.0%',
    selectionRateReference: '82.3%',
    disparityRatio: 0.66,
    impactedCount: 18,
    status: 'UNDER_REVIEW',
    assignedReviewer: 'Dr. Rajiv Menon (TPO Head)',
    assignedDate: '2026-11-12',
    flagType: 'FOUR_FIFTHS_BENCHMARK_FLAG',
    resolutionNotes: 'Review in progress. Evaluating if recruiter criteria strictly required Distributed Systems course or if equivalent practical projects were overlooked.',
    auditLog: [
      { timestamp: '2026-11-12T10:00:00Z', action: 'Flagged by Governance Engine (Ratio 0.66 < 0.80)', actor: 'System' },
      { timestamp: '2026-11-12T14:30:00Z', action: 'Assigned to Dr. Rajiv Menon for manual syllabus review', actor: 'TPO Authority' },
    ],
  },
  {
    id: 'FC-2026-002',
    caseTitle: 'Civil Engineering Data Engineering Interview Conversion',
    driveOrStage: 'Shortlists -> Technical Interviews',
    companyOrCohort: 'Fintech Analytics Drive',
    affectedGroup: 'Civil Engineering (CIVIL)',
    referenceGroup: 'Computer Science (CSE)',
    selectionRateGroup: '45.4%',
    selectionRateReference: '82.3%',
    disparityRatio: 0.55,
    impactedCount: 6,
    status: 'EXPLANATION_REQUESTED',
    assignedReviewer: 'Prof. Anjali Saxena',
    assignedDate: '2026-11-10',
    flagType: 'FOUR_FIFTHS_BENCHMARK_FLAG',
    resolutionNotes: 'Inquiry dispatched to corporate campus team regarding SQL benchmark criteria.',
    auditLog: [
      { timestamp: '2026-11-10T11:00:00Z', action: 'Flagged by Governance Engine (Ratio 0.55 < 0.80)', actor: 'System' },
      { timestamp: '2026-11-11T09:15:00Z', action: 'Formal explanation requested from Recruiter Talent Lead', actor: 'Prof. Anjali Saxena' },
    ],
  },
  {
    id: 'FC-2026-003',
    caseTitle: 'EEE Embedded Firmware Selection Ratio Review',
    driveOrStage: 'Applications -> Technical Shortlists',
    companyOrCohort: 'Automotive Core Systems Drive',
    affectedGroup: 'Electrical & Electronics (EEE)',
    referenceGroup: 'Electronics & Comm (ECE)',
    selectionRateGroup: '76.4%',
    selectionRateReference: '85.1%',
    disparityRatio: 0.89,
    impactedCount: 8,
    status: 'RESOLVED',
    assignedReviewer: 'Dr. Vikram Sethi',
    assignedDate: '2026-11-04',
    flagType: 'BENCHMARK_RESTORED',
    resolutionNotes: 'Resolved. Disparity ratio within safe zone (0.89 >= 0.80). Verified that RTOS lab elective was the legitimate distinguishing competency.',
    auditLog: [
      { timestamp: '2026-11-04T12:00:00Z', action: 'Advisory review opened', actor: 'System' },
      { timestamp: '2026-11-06T15:30:00Z', action: 'Case resolved with verified curriculum justification', actor: 'Dr. Vikram Sethi' },
    ],
  },
];

// ==========================================
// FAIRNESS SERVICE IMPLEMENTATION
// ==========================================

export const fairnessService = {
  // 1. Get Complete Selection Stage Disparity Analysis & Ratios
  async getFairnessAnalysis(params = {}) {
    try {
      const res = await apiClient.get('/tpo/fairness', { params });
      return res.data || res;
    } catch (err) {
      console.warn('Backend unavailable, using fairness analysis fallback:', err.message);
      return {
        ...FALLBACK_FAIRNESS_ANALYSIS,
        reviewCases: FALLBACK_REVIEW_CASES,
      };
    }
  },

  // 2. Get Fairness Review Cases Queue
  async getReviewCases(params = {}) {
    try {
      const res = await apiClient.get('/tpo/fairness/reviews', { params });
      return res.data || res;
    } catch (err) {
      console.warn('Backend unavailable, using review cases fallback:', err.message);
      return FALLBACK_REVIEW_CASES;
    }
  },

  // 3. Create Fairness Review Case Manually
  async createReviewCase(payload) {
    try {
      const res = await apiClient.post('/tpo/fairness/reviews', payload);
      return res.data || res;
    } catch (err) {
      console.warn('Backend unavailable, creating review case locally:', err.message);
      const newCase = {
        id: `FC-${Date.now()}`,
        caseTitle: payload.caseTitle || 'Fairness Review Investigation',
        driveOrStage: payload.driveOrStage || 'Selection Stage',
        companyOrCohort: payload.companyOrCohort || 'Campus Drive',
        affectedGroup: payload.affectedGroup || 'Candidate Group',
        referenceGroup: payload.referenceGroup || 'Reference Group',
        selectionRateGroup: payload.selectionRateGroup || 'N/A',
        selectionRateReference: payload.selectionRateReference || 'N/A',
        disparityRatio: payload.disparityRatio || 0.75,
        impactedCount: payload.impactedCount || 5,
        status: 'UNDER_REVIEW',
        assignedReviewer: payload.assignedReviewer || 'Dr. Rajiv Menon',
        assignedDate: new Date().toISOString().split('T')[0],
        flagType: 'MANUAL_TPO_FLAG',
        resolutionNotes: payload.initialNotes || 'Initiated manual investigation',
        auditLog: [
          { timestamp: new Date().toISOString(), action: 'Case manually created', actor: 'TPO Authority' },
        ],
      };
      return newCase;
    }
  },

  // 4. Update Case Status & Resolution Notes (with Escalation)
  async updateReviewCase(caseId, payload) {
    try {
      const res = await apiClient.patch(`/tpo/fairness/reviews/${caseId}`, payload);
      return res.data || res;
    } catch (err) {
      console.warn(`Backend unavailable for case ${caseId}, updating locally:`, err.message);
      return {
        id: caseId,
        ...payload,
        updatedAt: new Date().toISOString(),
      };
    }
  },
};

export default fairnessService;
