/**
 * CarrerSync AI Profiling Client Service
 * Phase 09 — Hybrid AI Student Profiling & Evidence Verification Integration
 */

import apiClient from './api';

export const profilingService = {
  /**
   * Initiates asynchronous AI profiling analysis for a document.
   * POST /api/v1/profiling/documents/:documentId/analyze
   * @param {string} documentId
   * @returns {Promise<{ success: boolean, jobId: string, message?: string }>}
   */
  async analyzeDocument(documentId) {
    return apiClient.post(`/profiling/documents/${documentId}/analyze`);
  },

  /**
   * Retrieves the current execution status of a profiling job.
   * GET /api/v1/profiling/jobs/:jobId
   * @param {string} jobId
   * @returns {Promise<{ id: string, status: string, extractionId?: string, error?: string }>}
   */
  async getJobStatus(jobId) {
    return apiClient.get(`/profiling/jobs/${jobId}`);
  },

  /**
   * Retrieves full AI extraction details by extraction ID.
   * GET /api/v1/profiling/extractions/:id
   * @param {string} extractionId
   * @returns {Promise<{ id: string, status: string, skills: Array<any>, projects?: Array<any>, certifications?: Array<any>, warnings?: Array<any>, metadata?: any }>}
   */
  async getExtraction(extractionId) {
    return apiClient.get(`/profiling/extractions/${extractionId}`);
  },

  /**
   * Retrieves pending or proposed profile extractions for a student.
   * GET /api/v1/profiling/students/:studentId/proposed-profile
   * @param {string} studentId
   * @returns {Promise<{ studentId: string, proposedExtractions: Array<any> }>}
   */
  async getProposedProfile(studentId) {
    return apiClient.get(`/profiling/students/${studentId}/proposed-profile`);
  },

  /**
   * Approves an extraction with optional selected skill names and comments.
   * POST /api/v1/profiling/extractions/:id/approve
   * @param {string} extractionId
   * @param {object} payload - { approvedSkillNames?: string[], reviewerNotes?: string }
   * @returns {Promise<{ success: boolean, approvedSkillsCount: number }>}
   */
  async approveExtraction(extractionId, payload = {}) {
    return apiClient.post(`/profiling/extractions/${extractionId}/approve`, payload);
  },

  /**
   * Rejects an extraction with optional rejected skill names and reason.
   * POST /api/v1/profiling/extractions/:id/reject
   * @param {string} extractionId
   * @param {object} payload - { rejectedSkillNames?: string[], reason?: string }
   * @returns {Promise<{ success: boolean, message: string }>}
   */
  async rejectExtraction(extractionId, payload = {}) {
    return apiClient.post(`/profiling/extractions/${extractionId}/reject`, payload);
  },

  /**
   * Retrieves all verified, evidence-found, and pending evidence records for a student.
   * GET /api/v1/profiling/students/:studentId/evidence
   * @param {string} studentId
   * @returns {Promise<{ studentId: string, evidence: Array<any> }>}
   */
  async getStudentEvidence(studentId) {
    return apiClient.get(`/profiling/students/${studentId}/evidence`);
  },

  /**
   * Helper utility to poll job status until completion or failure.
   * @param {string} jobId
   * @param {number} intervalMs - Polling interval in ms (default 1500)
   * @param {number} maxAttempts - Maximum polling iterations (default 30)
   * @param {function} onStatusUpdate - Callback on every poll update
   * @returns {Promise<any>}
   */
  async pollJobUntilComplete(jobId, intervalMs = 1500, maxAttempts = 30, onStatusUpdate = null) {
    let attempts = 0;
    while (attempts < maxAttempts) {
      attempts++;
      const job = await this.getJobStatus(jobId);
      if (onStatusUpdate) onStatusUpdate(job);

      if (job.status === 'COMPLETED') {
        return job;
      }
      if (job.status === 'FAILED' || job.status === 'CANCELLED') {
        throw new Error(job.error || `Profiling job ${job.status.toLowerCase()}`);
      }

      await new Promise((resolve) => setTimeout(resolve, intervalMs));
    }
    throw new Error('Profiling analysis timed out. The document may still be queued.');
  }
};

export default profilingService;
