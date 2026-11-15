/**
 * CarrerSync Recruiter & Placement Intelligence Client Service
 * Phase 11 — Recruiter Drive Orchestration & Placement Intelligence Dashboard
 *
 * Implements full REST API integration for:
 * 1. Company Management & Verification
 * 2. Job Requirement Lifecycle (Draft -> Submit -> TPO Review -> Active)
 * 3. Campus Placement Drive Scheduling & Timeline Conflict Detection
 * 4. Evidence-Based Explainable Candidate Discovery
 * 5. Candidate Shortlisting Workflow & TPO Endorsement Gating
 * 6. Assessment Coordination & Results Recording
 * 7. Multi-Stage Interview Management
 * 8. Offer Lifecycle Management & Audit Tracking
 * 9. Placement Intelligence Analytics & Funnels
 * 10. TPO Unified Approvals Queue
 * 11. Student Offer Acceptance Tracking
 */

import apiClient from './api';

export const recruiterService = {
  // 1. Companies
  async getCompanies() {
    return apiClient.get('/recruiter/companies');
  },

  async getCompany(companyId) {
    return apiClient.get(`/recruiter/companies/${companyId}`);
  },

  async createCompany(payload) {
    return apiClient.post('/recruiter/companies', payload);
  },

  async updateCompany(companyId, payload) {
    return apiClient.put(`/recruiter/companies/${companyId}`, payload);
  },

  // 2. Job Requirements
  async getJobs(params = {}) {
    return apiClient.get('/recruiter/jobs', { params });
  },

  async getJob(jobId) {
    return apiClient.get(`/recruiter/jobs/${jobId}`);
  },

  async createJob(payload) {
    return apiClient.post('/recruiter/jobs', payload);
  },

  async updateJob(jobId, payload) {
    return apiClient.put(`/recruiter/jobs/${jobId}`, payload);
  },

  async submitJob(jobId) {
    return apiClient.post(`/recruiter/jobs/${jobId}/submit`);
  },

  // 3. Placement Drives
  async getDrives(params = {}) {
    return apiClient.get('/recruiter/drives', { params });
  },

  async getDrive(driveId) {
    return apiClient.get(`/recruiter/drives/${driveId}`);
  },

  async createDrive(payload) {
    return apiClient.post('/recruiter/drives', payload);
  },

  async submitDrive(driveId) {
    return apiClient.post(`/recruiter/drives/${driveId}/submit`);
  },

  async getDriveSchedules(driveId) {
    return apiClient.get(`/recruiter/drives/${driveId}/schedules`);
  },

  async addDriveSchedule(driveId, payload) {
    return apiClient.post(`/recruiter/drives/${driveId}/schedules`, payload);
  },

  // 4. Candidate Discovery (Explainable Match)
  async discoverCandidates(params = {}) {
    return apiClient.get('/recruiter/candidates', { params });
  },

  async getCandidateProfile(candidateId, jobId = '') {
    return apiClient.get(`/recruiter/candidates/${candidateId}`, {
      params: jobId ? { jobId } : {}
    });
  },

  // 5. Shortlists
  async getShortlists(params = {}) {
    return apiClient.get('/recruiter/shortlists', { params });
  },

  async recommendCandidate(payload) {
    return apiClient.post('/recruiter/shortlists', payload);
  },

  async submitShortlist(shortlistId) {
    return apiClient.post(`/recruiter/shortlists/${shortlistId}/submit`);
  },

  // 6. Assessments
  async getAssessments(params = {}) {
    return apiClient.get('/recruiter/assessments', { params });
  },

  async createAssessment(payload) {
    return apiClient.post('/recruiter/assessments', payload);
  },

  async recordAssessmentResult(assessmentId, payload) {
    return apiClient.post(`/recruiter/assessments/${assessmentId}/results`, payload);
  },

  // 7. Interviews
  async getInterviews(params = {}) {
    return apiClient.get('/recruiter/interviews', { params });
  },

  async scheduleInterview(payload) {
    return apiClient.post('/recruiter/interviews', payload);
  },

  async recordInterviewFeedback(interviewId, payload) {
    return apiClient.post(`/recruiter/interviews/${interviewId}/feedback`, payload);
  },

  // 8. Offers
  async getOffers(params = {}) {
    return apiClient.get('/recruiter/offers', { params });
  },

  async createOffer(payload) {
    return apiClient.post('/recruiter/offers', payload);
  },

  async submitOffer(offerId) {
    return apiClient.post(`/recruiter/offers/${offerId}/submit`);
  },

  async getOfferHistory(offerId) {
    return apiClient.get(`/recruiter/offers/${offerId}/history`);
  },

  // 9. Analytics & Placement Intelligence
  async getAnalyticsOverview() {
    return apiClient.get('/recruiter/analytics/overview');
  },

  async getDriveAnalytics(driveId) {
    return apiClient.get(`/recruiter/analytics/drives/${driveId}`);
  }
};

export const tpoApprovalsService = {
  // Unified queue
  async getApprovalsQueue(category = '') {
    return apiClient.get('/tpo/approvals', {
      params: category ? { category } : {}
    });
  },

  // Review Company
  async reviewCompany(companyId, payload) {
    return apiClient.post(`/tpo/approvals/companies/${companyId}/review`, payload);
  },

  // Review Job
  async approveJob(jobId, payload) {
    return apiClient.post(`/tpo/approvals/jobs/${jobId}/approve`, payload);
  },

  async rejectJob(jobId, payload) {
    return apiClient.post(`/tpo/approvals/jobs/${jobId}/reject`, payload);
  },

  // Review Drive
  async approveDrive(driveId, payload) {
    return apiClient.post(`/tpo/approvals/drives/${driveId}/approve`, payload);
  },

  async rejectDrive(driveId, payload) {
    return apiClient.post(`/tpo/approvals/drives/${driveId}/reject`, payload);
  },

  // Review Shortlist
  async reviewShortlist(shortlistId, payload) {
    return apiClient.post(`/tpo/approvals/shortlists/${shortlistId}/review`, payload);
  },

  // Review Offer
  async reviewOffer(offerId, payload) {
    return apiClient.post(`/tpo/approvals/offers/${offerId}/review`, payload);
  }
};

export const studentOffersService = {
  async getMyOffers() {
    return apiClient.get('/student/offers');
  },

  async respondToOffer(offerId, payload) {
    return apiClient.post(`/student/offers/${offerId}/respond`, payload);
  }
};
