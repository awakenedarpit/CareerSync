/**
 * CarrerSync Placement Readiness Client Service
 * Phase 10 — Explainable Placement Readiness Scoring & Skill Gap Diagnostics
 */

import apiClient from './api';

export const readinessService = {
  /**
   * Retrieves an individual student's readiness breakdown and dimension scores.
   * GET /api/v1/readiness/students/:studentId
   * @param {string} studentId
   * @returns {Promise<{
   *   studentId: string,
   *   readinessScore: number,
   *   category: 'READY' | 'DEVELOPING' | 'NEEDS_SUPPORT' | 'INSUFFICIENT_DATA',
   *   dataCompleteness: number,
   *   dimensions: {
   *     verifiedSkills: number,
   *     evidenceCoverage: number,
   *     projectDepth: number,
   *     academics: number
   *   },
   *   strengths: Array<string>,
   *   gaps: Array<string>
   * }>}
   */
  async getStudentReadiness(studentId) {
    return apiClient.get(`/readiness/students/${studentId}`);
  },

  /**
   * Retrieves cohort-wide readiness distribution and metrics for TPO.
   * GET /api/v1/tpo/readiness/cohort
   * @returns {Promise<{
   *   totalStudents: number,
   *   averageScore: number,
   *   distribution: {
   *     READY: number,
   *     DEVELOPING: number,
   *     NEEDS_SUPPORT: number,
   *     INSUFFICIENT_DATA: number
   *   },
   *   topSkillGaps: Array<{ skill: string, count: number, category: string, severity: 'HIGH' | 'MEDIUM' | 'LOW' }>,
   *   studentsNeedingSupport: Array<any>
   * }>}
   */
  async getCohortReadiness() {
    return apiClient.get('/tpo/readiness/cohort');
  },

  /**
   * Retrieves department-wise readiness metrics breakdown.
   * GET /api/v1/tpo/readiness/departments
   * @returns {Promise<{ departments: Array<{
   *   department: string,
   *   totalStudents: number,
   *   averageScore: number,
   *   readyPercentage: number,
   *   developingPercentage: number,
   *   needsSupportPercentage: number,
   *   averageCompleteness: number
   * }> }>}
   */
  async getDepartmentReadiness() {
    return apiClient.get('/tpo/readiness/departments');
  },

  /**
   * Diagnoses deterministic skill gaps between student skills and job requirements.
   * POST /api/v1/readiness/students/:studentId/skill-gap
   * @param {string} studentId
   * @param {{ requiredSkills: Array<string>, preferredSkills?: Array<string>, targetRole?: string }} payload
   * @returns {Promise<{
   *   studentId: string,
   *   targetRole?: string,
   *   matches: Array<{ skill: string, status: 'VERIFIED_MATCH' | 'EVIDENCE_MATCH' | 'PENDING_VERIFICATION' | 'MISSING_SKILL' }>,
   *   summary: { verifiedMatchCount: number, evidenceMatchCount: number, missingCount: number, matchPercentage: number }
   * }>}
   */
  async diagnoseSkillGaps(studentId, payload) {
    return apiClient.post(`/readiness/students/${studentId}/skill-gap`, payload);
  },
};

export default readinessService;
