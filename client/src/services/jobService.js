/**
 * CarrerSync Job Eligibility & Evaluation Client Service
 * Phase 10 — Declarative Job Requirements & Eligibility Evaluation Engine
 */

import apiClient from './api';

export const jobService = {
  /**
   * Creates a new job requirement with declarative eligibility criteria.
   * POST /api/v1/jobs
   * @param {{
   *   title: string,
   *   company: string,
   *   departments: Array<string>,
   *   minCgpa?: number,
   *   graduationYear?: number,
   *   requiredSkills: Array<string>,
   *   preferredSkills?: Array<string>,
   *   jobType?: string,
   *   location?: string,
   *   description?: string
   * }} payload
   * @returns {Promise<{ id: string, title: string, company: string }>}
   */
  async createJob(payload) {
    return apiClient.post('/jobs', payload);
  },

  /**
   * Retrieves active job postings for the current college tenant.
   * GET /api/v1/jobs
   * @param {Object} [filters={}]
   * @returns {Promise<{ jobs: Array<any>, total: number }>}
   */
  async getJobs(filters = {}) {
    return apiClient.get('/jobs', { params: filters });
  },

  /**
   * Retrieves full details of a specific job requirement.
   * GET /api/v1/jobs/:jobId
   * @param {string} jobId
   * @returns {Promise<any>}
   */
  async getJob(jobId) {
    return apiClient.get(`/jobs/${jobId}`);
  },

  /**
   * Triggers an automated eligibility evaluation for the student cohort against this job.
   * POST /api/v1/jobs/:jobId/evaluate
   * @param {string} jobId
   * @param {Object} [payload={}]
   * @returns {Promise<{ evaluatedCount: number, eligibleCount: number, ineligibleCount: number, needsReviewCount: number }>}
   */
  async evaluateJob(jobId, payload = {}) {
    return apiClient.post(`/jobs/${jobId}/evaluate`, payload);
  },

  /**
   * Retrieves candidate eligibility evaluation matrix and rule breakdowns for a job.
   * GET /api/v1/jobs/:jobId/eligibility
   * @param {string} jobId
   * @returns {Promise<{
   *   jobId: string,
   *   job: any,
   *   summary: { totalEvaluated: number, eligible: number, ineligible: number, needsReview: number, insufficientData: number },
   *   candidates: Array<{
   *     studentId: string,
   *     studentName: string,
   *     rollNumber: string,
   *     department: string,
   *     graduationYear: number,
   *     cgpa?: number,
   *     status: 'ELIGIBLE' | 'INELIGIBLE' | 'NEEDS_REVIEW' | 'INSUFFICIENT_DATA',
   *     rules: {
   *       department: { passed: boolean, expected: Array<string>, actual: string },
   *       graduationYear: { passed: boolean, expected: number, actual: number },
   *       cgpa: { passed: boolean, expected: number, actual?: number, status: 'PASS' | 'FAIL' | 'NEEDS_REVIEW' },
   *       requiredSkills: { passed: boolean, required: Array<string>, matchedVerified: Array<string>, matchedEvidence: Array<string>, missing: Array<string> }
   *     },
   *     override?: {
   *       overridden: boolean,
   *       originalStatus: string,
   *       reviewerId: string,
   *       reason: string,
   *       createdAt: string
   *     }
   *   }>
   * }>}
   */
  async getJobEligibility(jobId) {
    return apiClient.get(`/jobs/${jobId}/eligibility`);
  },

  /**
   * Records a human-in-the-loop TPO override of student eligibility with mandatory reason.
   * POST /api/v1/jobs/:jobId/eligibility/:studentId/review
   * @param {string} jobId
   * @param {string} studentId
   * @param {{ status: 'ELIGIBLE' | 'INELIGIBLE' | 'NEEDS_REVIEW', reason: string, notes?: string }} payload
   * @returns {Promise<{ success: boolean, studentId: string, updatedStatus: string }>}
   */
  async overrideEligibility(jobId, studentId, payload) {
    return apiClient.post(`/jobs/${jobId}/eligibility/${studentId}/review`, payload);
  },
};

export default jobService;
