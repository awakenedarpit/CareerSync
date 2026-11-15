/**
 * CarrerSync TPO & Evidence Verification Client Service
 * Phase 10 — Multi-Tier Evidence Governance & Verification System
 */

import apiClient from './api';

export const tpoService = {
  /**
   * Retrieves high-level verification dashboard metrics.
   * GET /api/v1/tpo/verification/summary
   * @returns {Promise<{ totalStudents: number, totalEvidence: number, pending: number, verified: number, rejected: number, needsInfo: number }>}
   */
  async getVerificationSummary() {
    return apiClient.get('/tpo/verification/summary');
  },

  /**
   * Retrieves the pending evidence queue with filtering options.
   * GET /api/v1/tpo/verification/pending
   * @param {Object} [filters={}]
   * @param {string} [filters.department]
   * @param {string} [filters.category]
   * @param {string} [filters.evidenceType]
   * @param {string} [filters.status]
   * @param {string} [filters.search]
   * @param {number} [filters.page]
   * @param {number} [filters.limit]
   * @returns {Promise<{ items: Array<any>, total: number, page: number, totalPages: number }>}
   */
  async getPendingQueue(filters = {}) {
    return apiClient.get('/tpo/verification/pending', { params: filters });
  },

  /**
   * Retrieves single evidence details with audit history.
   * GET /api/v1/tpo/verification/:evidenceId
   * @param {string} evidenceId
   * @returns {Promise<any>}
   */
  async getEvidenceDetail(evidenceId) {
    return apiClient.get(`/tpo/verification/${evidenceId}`);
  },

  /**
   * Verifies a student evidence record (TPO only).
   * POST /api/v1/tpo/verification/:evidenceId/verify
   * @param {string} evidenceId
   * @param {{ reason: string, notes?: string }} payload
   * @returns {Promise<{ success: boolean, evidenceId: string, status: string }>}
   */
  async verifyEvidence(evidenceId, payload) {
    return apiClient.post(`/tpo/verification/${evidenceId}/verify`, payload);
  },

  /**
   * Rejects a student evidence record with mandatory documented reason.
   * POST /api/v1/tpo/verification/:evidenceId/reject
   * @param {string} evidenceId
   * @param {{ reason: string, notes?: string }} payload
   * @returns {Promise<{ success: boolean, evidenceId: string, status: string }>}
   */
  async rejectEvidence(evidenceId, payload) {
    return apiClient.post(`/tpo/verification/${evidenceId}/reject`, payload);
  },

  /**
   * Requests additional evidence from the student.
   * POST /api/v1/tpo/verification/:evidenceId/request-evidence
   * @param {string} evidenceId
   * @param {{ reason: string, notes?: string, requestedArtifacts?: Array<string> }} payload
   * @returns {Promise<{ success: boolean, evidenceId: string, status: string }>}
   */
  async requestMoreEvidence(evidenceId, payload) {
    return apiClient.post(`/tpo/verification/${evidenceId}/request-evidence`, payload);
  },

  /**
   * Retrieves the full verification review history and audit trail for an evidence item.
   * GET /api/v1/tpo/verification/:evidenceId/history
   * @param {string} evidenceId
   * @returns {Promise<{ evidenceId: string, history: Array<any> }>}
   */
  async getEvidenceHistory(evidenceId) {
    return apiClient.get(`/tpo/verification/${evidenceId}/history`);
  },

  /**
   * Retrieves the current authenticated student's verification records and status.
   * GET /api/v1/students/me/verification
   * @returns {Promise<{ studentId: string, summary: any, items: Array<any> }>}
   */
  async getStudentVerification() {
    return apiClient.get('/students/me/verification');
  },

  /**
   * Triggers a student correction request for an evidence record.
   * POST /api/v1/students/me/evidence/:evidenceId/correction-request
   * @param {string} evidenceId
   * @param {{ reason: string, requestedCorrection: string }} payload
   * @returns {Promise<{ success: boolean, message: string }>}
   */
  async requestCorrection(evidenceId, payload) {
    return apiClient.post(`/students/me/evidence/${evidenceId}/correction-request`, payload);
  },

  /**
   * Resubmits new or updated evidence for an item marked NEEDS_MORE_EVIDENCE or REJECTED.
   * POST /api/v1/students/me/evidence/:evidenceId/resubmit
   * @param {string} evidenceId
   * @param {{ documentId?: string, documentUrl?: string, notes?: string }} payload
   * @returns {Promise<{ success: boolean, evidenceId: string, status: string }>}
   */
  async resubmitEvidence(evidenceId, payload) {
    return apiClient.post(`/students/me/evidence/${evidenceId}/resubmit`, payload);
  },
};

export default tpoService;
