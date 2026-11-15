/**
 * CarrerSync Phase 13 — Industry Skill Intelligence, Career Recommendation & Skill-Gap Analysis Engine Tests
 *
 * Comprehensive tests for:
 * 1. Standardized 8-Category Skill Taxonomy, Alias Resolution & Standards Mappings
 * 2. 14 Standard Target Roles & Curriculum Templates
 * 3. AI-Assisted JD Extraction Pipeline, Content Hashing Deduplication, & Human Review
 * 4. Industry Skill Demand Calculation & Emerging Trend Detection (Zero Fabricated Trends)
 * 5. 6-Tier Student Skill-Gap Diagnostics & Phase 12 Learning Task Integration
 * 6. Explainable Career Role Recommendation Engine & INSUFFICIENT_DATA Safeguard
 * 7. Company-Specific Skill Intelligence & Privacy Safeguards
 * 8. Cohort Skill-Gap Analytics & Institutional Training Interventions
 * 9. REST API Route Protection & RBAC Enforcement
 */

import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../src/app';
import { skillTaxonomyService } from '../src/industry/skill-taxonomy.service';
import { jdAnalyzerService } from '../src/industry/jd-analyzer.service';
import { industryIntelligenceService } from '../src/industry/industry-intelligence.service';
import { studentSkillGapService } from '../src/industry/student-skill-gap.service';
import { careerRecommendationService } from '../src/industry/career-recommendation.service';
import { cohortIntelligenceService } from '../src/industry/cohort-intelligence.service';
import { createJwtToken } from '../src/utils/crypto';
import env from '../src/config/env';

describe('Phase 13: Industry Skill Intelligence & Recommendation Engine', () => {
  const secret = env.JWT_SECRET || 'carrersync_jwt_default_secret_dev_key_32_chars';
  const tenantId = '00000000-0000-0000-0000-000000000001';

  let tpoToken: string;
  let studentToken: string;
  let recruiterToken: string;

  beforeEach(async () => {
    tpoToken = await createJwtToken(
      { sub: 'tpo-user-1', tenant_id: tenantId, role: 'TPO_ADMIN', email: 'tpo@college.edu' },
      secret
    );

    studentToken = await createJwtToken(
      { sub: 'student-user-1', tenant_id: tenantId, role: 'STUDENT', email: 'student@college.edu' },
      secret
    );

    recruiterToken = await createJwtToken(
      { sub: 'recruiter-user-1', tenant_id: tenantId, role: 'RECRUITER', email: 'recruiter@tech.com' },
      secret
    );
  });

  // -------------------------------------------------------------------------
  // 1. Skill Taxonomy Service Tests
  // -------------------------------------------------------------------------
  describe('Skill Taxonomy & Canonical Standards', () => {
    it('should pre-seed skills across all 8 canonical categories', () => {
      const skills = skillTaxonomyService.getAllSkills();
      expect(skills.length).toBeGreaterThanOrEqual(30);

      const categories = new Set(skills.map((s) => s.category));
      expect(categories.has('Programming Languages')).toBe(true);
      expect(categories.has('Frontend')).toBe(true);
      expect(categories.has('Backend')).toBe(true);
      expect(categories.has('Database')).toBe(true);
      expect(categories.has('Cloud & DevOps')).toBe(true);
      expect(categories.has('Data & AI')).toBe(true);
      expect(categories.has('Core Computer Science')).toBe(true);
      expect(categories.has('Professional Skills')).toBe(true);
    });

    it('should resolve various aliases to their canonical names', () => {
      expect(skillTaxonomyService.resolveCanonicalName('py')).toBe('Python');
      expect(skillTaxonomyService.resolveCanonicalName('python3')).toBe('Python');
      expect(skillTaxonomyService.resolveCanonicalName('k8s')).toBe('Kubernetes');
      expect(skillTaxonomyService.resolveCanonicalName('psql')).toBe('PostgreSQL');
      expect(skillTaxonomyService.resolveCanonicalName('postgres')).toBe('PostgreSQL');
      expect(skillTaxonomyService.resolveCanonicalName('reactjs')).toBe('React');
      expect(skillTaxonomyService.resolveCanonicalName('golang')).toBe('Go');
      expect(skillTaxonomyService.resolveCanonicalName('dsa')).toBe('Data Structures & Algorithms');
      expect(skillTaxonomyService.resolveCanonicalName('oop')).toBe('Object-Oriented Programming (OOP)');
      expect(skillTaxonomyService.resolveCanonicalName('llm')).toBe('Large Language Models (LLMs)');
    });

    it('should include external standard mappings (O*NET, ESCO, NSQF level)', () => {
      const pythonSkill = skillTaxonomyService.getSkillByCanonicalName('Python');
      expect(pythonSkill).toBeDefined();
      expect(pythonSkill?.externalMappings.onetCode).toBe('15-1252.00');
      expect(pythonSkill?.externalMappings.escoUri).toContain('data.europa.eu/esco');
      expect(pythonSkill?.externalMappings.nsqfLevel).toBeGreaterThanOrEqual(5);
    });

    it('should allow searching skills by keyword and alias', () => {
      const results = skillTaxonomyService.searchSkills('k8s');
      expect(results.some((r) => r.canonicalName === 'Kubernetes')).toBe(true);
    });
  });

  // -------------------------------------------------------------------------
  // 2. 14 Standard Target Roles & Curriculum Templates
  // -------------------------------------------------------------------------
  describe('14 Standard Target Roles', () => {
    it('should provide complete templates for exactly 14 standard placement roles', () => {
      const roles = industryIntelligenceService.getAllRoleTemplates();
      expect(roles.length).toBe(14);

      const expectedRoles = [
        'Software Engineer',
        'Frontend Developer',
        'Backend Developer',
        'Full Stack Developer',
        'Data Analyst',
        'Data Scientist',
        'Machine Learning Engineer',
        'DevOps Engineer',
        'Cloud Engineer',
        'Cybersecurity Analyst',
        'QA / Test Automation Engineer',
        'Mobile App Developer',
        'Java Software Engineer',
        'Python / Data Engineer'
      ];

      for (const expected of expectedRoles) {
        const found = roles.find((r) => r.roleName === expected);
        expect(found, `Expected role template for ${expected}`).toBeDefined();
        expect(found!.coreSkills.length).toBeGreaterThanOrEqual(3);
        expect(found!.foundationalSkills.length).toBeGreaterThanOrEqual(1);
        expect(found!.minimumPassReadinessScore).toBeGreaterThanOrEqual(60);
      }
    });

    it('should retrieve a role template by name or id', () => {
      const template = industryIntelligenceService.getRoleTemplate('role-frontend');
      expect(template).toBeDefined();
      expect(template?.roleName).toBe('Frontend Developer');
      expect(template?.coreSkills).toContain('React');
    });
  });

  // -------------------------------------------------------------------------
  // 3. JD Extraction, Hashing & Deduplication
  // -------------------------------------------------------------------------
  describe('JD Analyzer & Deduplication Engine', () => {
    it('should normalize text, classify role, and extract required vs preferred skills', async () => {
      const jdText = `
        We are seeking a Backend Developer for our core platform team.
        Must Have:
        - 2+ years of experience in Node.js, Express.js, and PostgreSQL.
        - Strong knowledge of RESTful APIs and Database Indexing & Query Tuning.
        Nice to Have:
        - Experience with Docker and Redis cache.
        - Exposure to AWS cloud.
      `;

      const analysis = await jdAnalyzerService.analyzeJobDescription({
        rawText: jdText,
        title: 'Backend Developer',
        companyName: 'FinTech Corp',
        forceProvider: 'rule-based'
      });

      expect(analysis.roleClassification).toBe('Backend Developer');
      expect(analysis.experienceYearsMin).toBe(2);
      expect(analysis.requiredSkills.some((s) => s.canonicalName === 'Node.js')).toBe(true);
      expect(analysis.requiredSkills.some((s) => s.canonicalName === 'PostgreSQL')).toBe(true);
      expect(analysis.preferredSkills.some((s) => s.canonicalName === 'Docker')).toBe(true);
      expect(analysis.confidenceScore).toBeGreaterThanOrEqual(70);
    });

    it('should compute deterministic SHA-256 hash and detect duplicates', async () => {
      const sampleText = 'Job posting text for full stack developer with React and Node.js';
      const hash1 = industryIntelligenceService.computeContentHash(sampleText);
      const hash2 = industryIntelligenceService.computeContentHash('  JOB POSTING text for full stack developer with React and Node.js   ');

      expect(hash1).toBe(hash2);

      const res1 = await industryIntelligenceService.ingestJobDescription({
        tenantId,
        title: 'Full Stack Engineer',
        companyName: 'Stripe',
        rawText: sampleText,
        createdBy: 'tpo-1'
      });
      expect(res1.isDuplicate).toBe(false);

      const res2 = await industryIntelligenceService.ingestJobDescription({
        tenantId,
        title: 'Full Stack Engineer',
        companyName: 'Stripe',
        rawText: sampleText,
        createdBy: 'tpo-1'
      });
      expect(res2.isDuplicate).toBe(true);
      expect(res2.jd.id).toBe(res1.jd.id);
    });

    it('should record human TPO review and apply skill corrections', async () => {
      const sample = await industryIntelligenceService.ingestJobDescription({
        tenantId,
        title: 'Junior Engineer',
        companyName: 'StartupXYZ',
        rawText: 'Looking for a junior coder with Python and SQL.',
        createdBy: 'tpo-1'
      });

      const reviewed = industryIntelligenceService.reviewStoredJobDescription({
        id: sample.jd.id,
        tenantId,
        reviewedBy: 'tpo-admin-1',
        reviewerName: 'Admin User',
        correctedRole: 'Python / Data Engineer',
        addedSkills: ['FastAPI', 'Pandas & NumPy'],
        notes: 'Verified curriculum fit for data engineering'
      });

      expect(reviewed.status).toBe('REVIEWED');
      expect(reviewed.analysis?.roleClassification).toBe('Python / Data Engineer');
      expect(reviewed.analysis?.humanReview?.isReviewed).toBe(true);
      expect(reviewed.analysis?.requiredSkills.some((s) => s.canonicalName === 'FastAPI')).toBe(true);
    });
  });

  // -------------------------------------------------------------------------
  // 4. Industry Demand & Emerging Trends Analytics
  // -------------------------------------------------------------------------
  describe('Industry Demand & Emerging Trends Analytics', () => {
    it('should compute skill frequencies and percentage of total JDs', () => {
      const demanded = industryIntelligenceService.calculateDemandedSkills(tenantId);
      expect(demanded.length).toBeGreaterThan(0);

      const top = demanded[0];
      expect(top.frequencyCount).toBeGreaterThan(0);
      expect(top.percentageOfTotalJDs).toBeGreaterThan(0);
      expect(top.sampleSize).toBeGreaterThan(0);
    });

    it('should calculate emerging trends with statistical significance flag', () => {
      const trends = industryIntelligenceService.calculateSkillTrends(tenantId);
      expect(trends.length).toBeGreaterThan(0);

      for (const trend of trends) {
        expect(['EMERGING', 'GROWING', 'STABLE', 'DECLINING']).toContain(trend.momentum);
        expect(typeof trend.isStatisticallySignificant).toBe('boolean');
      }
    });

    it('should provide overview analytics with zero-fabricated disclaimer and freshness attribution', () => {
      const overview = industryIntelligenceService.getIndustryOverview(tenantId);
      expect(overview.totalAnalyzedJDs).toBeGreaterThan(0);
      expect(overview.dataFreshnessLabel.zeroFabricatedDisclaimer).toContain('Zero synthetic statistics');
      expect(overview.roleDistribution.length).toBeGreaterThan(0);
      expect(overview.categoryBreakdown.length).toBeGreaterThan(0);
    });
  });

  // -------------------------------------------------------------------------
  // 5. 6-Tier Student Skill-Gap Diagnosis
  // -------------------------------------------------------------------------
  describe('6-Tier Student Skill-Gap Diagnostic Service', () => {
    it('should classify student skills across the 6 discrete tiers', async () => {
      const report = await studentSkillGapService.diagnoseStudentSkillGap({
        studentId: 'student-test-1',
        tenantId,
        roleIdOrName: 'Software Engineer'
      });

      expect(report.targetRole).toContain('Software Engineer');
      expect(report.skillItems.length).toBeGreaterThanOrEqual(4);

      // Verify that every skill item has one of the 6 valid tiers
      const validTiers = [
        'VERIFIED_MATCH',
        'EVIDENCE_AVAILABLE',
        'PENDING_VERIFICATION',
        'IMPROVEMENT_NEEDED',
        'MISSING_EVIDENCE',
        'NOT_ASSESSED'
      ];

      for (const item of report.skillItems) {
        expect(validTiers).toContain(item.tier);
        expect(item.actionableExplanation).toBeTruthy();
        expect(item.recommendedRemediationAction).toBeTruthy();
      }

      expect(report.overallMatchPercentage).toBeGreaterThanOrEqual(0);
      expect(report.overallMatchPercentage).toBeLessThanOrEqual(100);
    });

    it('should compute company-specific skill intelligence for target employer', async () => {
      const intel = await studentSkillGapService.getCompanySkillIntelligence({
        companyNameOrId: 'Amazon',
        studentId: 'student-test-1',
        tenantId
      });

      expect(intel.companyName).toBe('Amazon');
      expect(intel.topRequiredSkills.length).toBeGreaterThan(0);
      expect(intel.studentMatch).toBeDefined();
      expect(intel.studentMatch?.matchPercentage).toBeGreaterThanOrEqual(0);
    });
  });

  // -------------------------------------------------------------------------
  // 6. Career Role Recommendations & INSUFFICIENT_DATA Safeguard
  // -------------------------------------------------------------------------
  describe('Career Role Recommendation Engine', () => {
    it('should evaluate student across 14 roles and return sorted recommendations', async () => {
      const recs = await careerRecommendationService.generateRecommendations('student-test-1', tenantId);
      expect(recs.length).toBe(14);

      // Top recommendation should have highest matchScore
      expect(recs[0].matchScore).toBeGreaterThanOrEqual(recs[recs.length - 1].matchScore);
      expect(['STRONG_MATCH', 'GOOD_MATCH', 'MODERATE_MATCH', 'DEVELOPING']).toContain(recs[0].fitLevel);
      expect(recs[0].advisoryDisclaimer).toContain('Advisory Notice');
      expect(recs[0].suggestedProjects.length).toBeGreaterThan(0);
    });

    it('should support student changing recommendation status to PRIMARY_GOAL or SAVED', async () => {
      const recs = await careerRecommendationService.getRecommendations('student-test-1', tenantId);
      const target = recs[0];

      const updated = careerRecommendationService.updateRecommendationStatus({
        id: target.id,
        studentId: 'student-test-1',
        status: 'PRIMARY_GOAL'
      });

      expect(updated.status).toBe('PRIMARY_GOAL');
    });

    it('should reject status change attempt for another student recommendation', async () => {
      const recs = await careerRecommendationService.getRecommendations('student-test-1', tenantId);
      const target = recs[0];

      expect(() => {
        careerRecommendationService.updateRecommendationStatus({
          id: target.id,
          studentId: 'other-student-99',
          status: 'PRIMARY_GOAL'
        });
      }).toThrow(/Forbidden/);
    });
  });

  // -------------------------------------------------------------------------
  // 7. Cohort Skill-Gap Intelligence & Interventions
  // -------------------------------------------------------------------------
  describe('Cohort Intelligence Service', () => {
    it('should generate institutional common gaps with urgency levels', () => {
      const overview = cohortIntelligenceService.getCohortOverview({ tenantId });
      expect(overview.totalStudents).toBeGreaterThan(0);
      expect(overview.topInstitutionalGaps.length).toBeGreaterThan(0);

      for (const gap of overview.topInstitutionalGaps) {
        expect(['CRITICAL', 'HIGH', 'MEDIUM']).toContain(gap.urgency);
        expect(gap.gapPercentage).toBeGreaterThan(0);
        expect(gap.marketDemandPercentage).toBeGreaterThan(0);
      }
    });

    it('should generate concrete institutional training interventions', () => {
      const interventions = cohortIntelligenceService.getTrainingInterventions(tenantId);
      expect(interventions.length).toBeGreaterThanOrEqual(2);

      const first = interventions[0];
      expect(first.title).toBeTruthy();
      expect(first.affectedStudentsCount).toBeGreaterThan(0);
      expect(first.suggestedCurriculumTopics.length).toBeGreaterThan(0);
      expect(first.actionPlan).toBeTruthy();
    });
  });

  // -------------------------------------------------------------------------
  // 8. REST API RBAC & Endpoint Tests
  // -------------------------------------------------------------------------
  describe('REST API Routes & Authorization Boundaries', () => {
    // TPO Routes
    it('GET /api/v1/tpo/industry-intelligence/overview - allows TPO_ADMIN', async () => {
      const res = await request(app)
        .get('/api/v1/tpo/industry-intelligence/overview')
        .set('Authorization', `Bearer ${tpoToken}`)
        .set('x-tenant-id', tenantId);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.overview.totalAnalyzedJDs).toBeGreaterThan(0);
    });

    it('GET /api/v1/tpo/industry-intelligence/overview - blocks STUDENT with 403', async () => {
      const res = await request(app)
        .get('/api/v1/tpo/industry-intelligence/overview')
        .set('Authorization', `Bearer ${studentToken}`)
        .set('x-tenant-id', tenantId);

      expect(res.status).toBe(403);
      expect(res.body.code).toBe('FORBIDDEN_INSUFFICIENT_ROLE');
    });

    it('GET /api/v1/tpo/industry-intelligence/overview - blocks RECRUITER with 403', async () => {
      const res = await request(app)
        .get('/api/v1/tpo/industry-intelligence/overview')
        .set('Authorization', `Bearer ${recruiterToken}`)
        .set('x-tenant-id', tenantId);

      expect(res.status).toBe(403);
      expect(res.body.code).toBe('FORBIDDEN_INSUFFICIENT_ROLE');
    });

    it('GET /api/v1/tpo/industry-intelligence/skills - retrieves demanded skills', async () => {
      const res = await request(app)
        .get('/api/v1/tpo/industry-intelligence/skills')
        .set('Authorization', `Bearer ${tpoToken}`)
        .set('x-tenant-id', tenantId);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.skills)).toBe(true);
    });

    it('GET /api/v1/tpo/industry-intelligence/trends - retrieves trends', async () => {
      const res = await request(app)
        .get('/api/v1/tpo/industry-intelligence/trends')
        .set('Authorization', `Bearer ${tpoToken}`)
        .set('x-tenant-id', tenantId);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.trends)).toBe(true);
    });

    it('GET /api/v1/tpo/industry-intelligence/roles - retrieves 14 roles', async () => {
      const res = await request(app)
        .get('/api/v1/tpo/industry-intelligence/roles')
        .set('Authorization', `Bearer ${tpoToken}`)
        .set('x-tenant-id', tenantId);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.roles.length).toBe(14);
    });

    it('POST /api/v1/tpo/job-descriptions - uploads and analyzes new JD', async () => {
      const res = await request(app)
        .post('/api/v1/tpo/job-descriptions')
        .set('Authorization', `Bearer ${tpoToken}`)
        .set('x-tenant-id', tenantId)
        .send({
          title: 'Cloud DevOps Specialist',
          companyName: 'Atlassian',
          industryDomain: 'SaaS',
          rawText: 'Requirements: Docker, Kubernetes, AWS, and CI/CD Pipelines.'
        });

      expect([200, 201]).toContain(res.status);
      expect(res.body.success).toBe(true);
      expect(res.body.jobDescription).toBeDefined();
    });

    it('GET /api/v1/tpo/cohort-intelligence/overview - retrieves cohort snapshot', async () => {
      const res = await request(app)
        .get('/api/v1/tpo/cohort-intelligence/overview')
        .set('Authorization', `Bearer ${tpoToken}`)
        .set('x-tenant-id', tenantId);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.cohortOverview.totalStudents).toBeGreaterThan(0);
    });

    // Student Routes
    it('GET /api/v1/student/skill-gap - allows STUDENT and returns 6-tier breakdown', async () => {
      const res = await request(app)
        .get('/api/v1/student/skill-gap')
        .set('Authorization', `Bearer ${studentToken}`)
        .set('x-tenant-id', tenantId);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.skillGap.tierBreakdown).toBeDefined();
    });

    it('GET /api/v1/student/skill-gap - blocks RECRUITER with 403', async () => {
      const res = await request(app)
        .get('/api/v1/student/skill-gap')
        .set('Authorization', `Bearer ${recruiterToken}`)
        .set('x-tenant-id', tenantId);

      expect(res.status).toBe(403);
      expect(res.body.code).toBe('FORBIDDEN_ROLE');
    });

    it('POST /api/v1/student/skill-gap/recalculate - recalculates for a target role', async () => {
      const res = await request(app)
        .post('/api/v1/student/skill-gap/recalculate')
        .set('Authorization', `Bearer ${studentToken}`)
        .set('x-tenant-id', tenantId)
        .send({ roleId: 'role-backend' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.skillGap.targetRole).toContain('Backend');
    });

    it('GET /api/v1/student/career-recommendations - retrieves explainable recommendations', async () => {
      const res = await request(app)
        .get('/api/v1/student/career-recommendations')
        .set('Authorization', `Bearer ${studentToken}`)
        .set('x-tenant-id', tenantId);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.recommendations.length).toBe(14);
    });

    it('GET /api/v1/student/company-intelligence - retrieves corporate tech stack lists', async () => {
      const res = await request(app)
        .get('/api/v1/student/company-intelligence')
        .set('Authorization', `Bearer ${studentToken}`)
        .set('x-tenant-id', tenantId);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.companies)).toBe(true);
    });
  });
});
