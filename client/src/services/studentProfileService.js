/**
 * CarrerSync Student Profile Client Service
 * Phase 18 — Comprehensive Student Profile Management
 */

import apiClient from './api';

export const studentProfileService = {
  /**
   * Retrieves full student profile including completeness score,
   * user metadata, social links, custom links, and academic correction requests.
   * GET /api/v1/student/profile
   * @returns {Promise<any>}
   */
  async getProfile() {
    return apiClient.get('/student/profile');
  },

  /**
   * Updates personal information (bio, professional summary, objective, avatar, location, etc.).
   * PATCH /api/v1/student/profile
   * @param {Object} data
   * @returns {Promise<any>}
   */
  async updatePersonalInfo(data) {
    return apiClient.patch('/student/profile', data);
  },

  /**
   * Updates contact information (phone, alternate phone, personal email, contact method).
   * Note: Login email cannot be changed without verification.
   * PATCH /api/v1/student/profile/contact
   * @param {Object} data
   * @returns {Promise<any>}
   */
  async updateContactInfo(data) {
    return apiClient.patch('/student/profile/contact', data);
  },

  /**
   * Updates professional and social links plus custom links.
   * PATCH /api/v1/student/profile/social-links
   * @param {Object} data
   * @returns {Promise<any>}
   */
  async updateSocialLinks(data) {
    return apiClient.patch('/student/profile/social-links', data);
  },

  /**
   * Updates career preferences (target roles, industries, locations) and privacy visibility flags.
   * PATCH /api/v1/student/profile/preferences
   * @param {Object} data
   * @returns {Promise<any>}
   */
  async updatePreferences(data) {
    return apiClient.patch('/student/profile/preferences', data);
  },

  /**
   * Submits a formal request to correct locked academic records (department, CGPA, etc.).
   * POST /api/v1/student/profile/academic-correction-request
   * @param {{ fieldName: string, currentValue?: string, requestedValue: string, reason: string }} data
   * @returns {Promise<any>}
   */
  async submitAcademicCorrection(data) {
    return apiClient.post('/student/profile/academic-correction-request', data);
  },

  /**
   * Retrieves student's submitted academic correction requests and their statuses.
   * GET /api/v1/student/profile/academic-correction-requests
   * @returns {Promise<any>}
   */
  async getCorrectionRequests() {
    return apiClient.get('/student/profile/academic-correction-requests');
  },
};

export default studentProfileService;
