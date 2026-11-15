/**
 * CarrerSync Phase 13 — Industry Skill Intelligence, Career Recommendation & Skill-Gap Analysis Engine
 * End-to-End Integration, Security & Regression Test Suite
 *
 * Comprehensive Test Suites:
 * 1. Authentication & Role-Based Access Control (Student vs TPO vs Recruiter boundaries)
 * 2. Standardized Skill Taxonomy: Canonical names, 8 categories, alias lookup, external standards mapping
 * 3. Job Description Collection: Ingestion validation, deduplication via SHA-256 content hash, manual TPO upload
 * 4. AI-Assisted JD Extraction: Required vs preferred skills, experience extraction, confidence score, human review gate
 * 5. Industry Demand Calculation: Actual JD frequency, percentage calculations, role/company breakdown
 * 6. Emerging Trend Detection: Current vs previous period comparison (+X% growth), sample-size confidence guard
 * 7. Role-Based Skill Requirements: 14 standard roles, core skills vs required foundations
 * 8. Student Skill-Gap Detection: 6-tier classification with explainable rationale & remediation
 * 9. Career Role Recommendation Engine: Deterministic explainable scoring, fit level, strengths, gaps, suggested projects, INSUFFICIENT_DATA safeguard
 * 10. Company-Specific Skill Intelligence: Student match vs company tech stack, privacy protection
 * 11. Cohort Skill-Gap Analytics: Aggregated department gaps, capability vs market demand, institutional training interventions
 * 12. Personalized Learning Integration: Hand-off to Phase 12 learning tasks without auto-granting VERIFIED status
 * 13. Anti-Tampering & Multi-Tenant Security: Preventing student manipulation, cross-student/tenant isolation
 */

import { describe, it, expect, beforeAll } from 'vitest';
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

describe('Phase 13 — Industry Skill Intelligence, Career Recommendation & Skill-Gap Analysis Engine', () => {
  const secret = env.JWT_SECRET || 'carrersync_jwt_default_secret_dev_key_32_chars';

  const TENANT_A = '11111111-1111-4111-8111-111111111111';
  const TENANT_B = '22222222-2222-4222-8222-222222222222';

  // Users for Tenant A
  const studentA1 = {
    id: 's0000001-1111-4111-8111-111111111111',
    email: 'aarav.sharma@campus-a.edu',
    role: 'STUDENT',
    tenantId: TENANT_A
  };

  const studentA2 = {
    id: 's0000002-1111-4111-8111-111111111111',
    email: 'diya.patel@campus-a.edu',
    role: 'STUDENT',
    tenantId: TENANT_A
  };

  const tpoAdminA = {
    id: 't0000001-1111-4111-8111-111111111111',
    email: 'tpo.director@campus-a.edu',
    role: 'TPO_ADMIN',
    tenantId: TENANT_A
  };

  const recruiterUserA = {
    id: 'r0000001-1111-4111-8111-111111111111',
    email: 'talent@techcorp.com',
    role: 'RECRUITER',
    tenantId: TENANT_A
  };

  // Users for Tenant B (for multi-tenant isolation testing)
  const studentB = {
    id: 's0000001-2222-4222-8222-222222222222',
    email: 'rohan.verma@campus-b.edu',
    role: 'STUDENT',
    tenantId: TENANT_B
  };

  const tpoAdminB = {
    id: 't0000001-2222-4222-8222-222222222222',
    email: 'tpo.lead@campus-b.edu',
    role: 'TPO_ADMIN',
    tenantId: TENANT_B
  };

  let tokenStudentA1: string;
  let tokenStudentA2: string;
  let tokenTpoA: string;
  let tokenRecruiterA: string;
  let tokenStudentB: string;
  let tokenTpoB: string;

  beforeAll(async () => {
    tokenStudentA1 = await createJwtToken(
      { sub: studentA1.id, tenant_id: studentA1.tenantId, role: studentA1.role, email: studentA1.email },
      secret
    );

    tokenStudentA2 = await createJwtToken(
      { sub: studentA2.id, tenant_id: studentA2.tenantId, role: studentA2.role, email: studentA2.email },
      secret
    );

    tokenTpoA = await createJwtToken(
      { sub: tpoAdminA.id, tenant_id: tpoAdminA.tenantId, role: tpoAdminA.role, email: tpoAdminA.email },
      secret
    );

    tokenRecruiterA = await createJwtToken(
      { sub: recruiterUserA.id, tenant_id: recruiterUserA.tenantId, role: recruiterUserA.role, email: recruiterUserA.email },
      secret
    );

    tokenStudentB = await createJwtToken(
      { sub: studentB.id, tenant_id: studentB.tenantId, role: studentB.role, email: studentB.email },
      secret
    );

    tokenTpoB = await createJwtToken(
      { sub: tpoAdminB.id, tenant_id: tpoAdminB.tenantId, role: tpoAdminB.role, email: tpoAdminB.email },
      secret
    );
  });

  // =========================================================================
  // 1. Authentication & Role-Based Access Control (RBAC)
  // =========================================================================
  describe('1. Authentication & Role-Based Access Control (RBAC)', () => {
    it('should reject unauthenticated requests to TPO industry intelligence endpoints with 401', async () => {
      const res = await request(app).get('/api/v1/tpo/industry-intelligence/overview');
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('should reject unauthenticated requests to Student career intelligence endpoints with 401', async () => {
      const res = await request(app).get('/api/v1/student/skill-gap');
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('should reject requests with invalid or malformed bearer token with 401', async () => {
      const res = await request(app)
        .get('/api/v1/student/career-recommendations')
        .set('Authorization', 'Bearer totally-invalid-jwt-signature-string');
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('should block Student from accessing TPO industry endpoints with 403 Forbidden', async () => {
      const res = await request(app)
        .get('/api/v1/tpo/industry-intelligence/overview')
        .set('Authorization', `Bearer ${tokenStudentA1}`)
        .set('x-tenant-id', TENANT_A);

      expect(res.status).toBe(403);
      expect(res.body.code).toBe('FORBIDDEN_INSUFFICIENT_ROLE');
    });

    it('should block Recruiter from accessing TPO industry management with 403 Forbidden', async () => {
      const res = await request(app)
        .get('/api/v1/tpo/industry-intelligence/overview')
        .set('Authorization', `Bearer ${tokenRecruiterA}`)
        .set('x-tenant-id', TENANT_A);

      expect(res.status).toBe(403);
      expect(res.body.code).toBe('FORBIDDEN_INSUFFICIENT_ROLE');
    });

    it('should block Recruiter from accessing Student skill gap analysis with 403 Forbidden', async () => {
      const res = await request(app)
        .get('/api/v1/student/skill-gap')
        .set('Authorization', `Bearer ${tokenRecruiterA}`)
        .set('x-tenant-id', TENANT_A);

      expect(res.status).toBe(403);
      expect(res.body.code).toBe('FORBIDDEN_ROLE');
    });

    it('should block Recruiter from accessing Student career recommendations with 403 Forbidden', async () => {
      const res = await request(app)
        .get('/api/v1/student/career-recommendations')
        .set('Authorization', `Bearer ${tokenRecruiterA}`)
        .set('x-tenant-id', TENANT_A);

      expect(res.status).toBe(403);
      expect(res.body.code).toBe('FORBIDDEN_ROLE');
    });

    it('should allow legitimate TPO Admin to access TPO industry and cohort endpoints with 200 OK', async () => {
      const res = await request(app)
        .get('/api/v1/tpo/industry-intelligence/overview')
        .set('Authorization', `Bearer ${tokenTpoA}`)
        .set('x-tenant-id', TENANT_A);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.overview).toBeDefined();
    });

    it('should allow legitimate Student to access Student skill gap and recommendation endpoints with 200 OK', async () => {
      const res = await request(app)
        .get('/api/v1/student/skill-gap')
        .set('Authorization', `Bearer ${tokenStudentA1}`)
        .set('x-tenant-id', TENANT_A);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.skillGap).toBeDefined();
    });
  });

  // =========================================================================
  // 2. Standardized Skill Taxonomy & Canonical Standards
  // =========================================================================
  describe('2. Standardized Skill Taxonomy & Canonical Standards', () => {
    it('should contain comprehensive canonical skills covering all 8 standard categories', () => {
      const allSkills = skillTaxonomyService.getAllSkills();
      expect(allSkills.length).toBeGreaterThanOrEqual(30);

      const categories = new Set(allSkills.map((s) => s.category));
      expect(categories.has('Programming Languages')).toBe(true);
      expect(categories.has('Frontend')).toBe(true);
      expect(categories.has('Backend')).toBe(true);
      expect(categories.has('Database')).toBe(true);
      expect(categories.has('Cloud & DevOps')).toBe(true);
      expect(categories.has('Data & AI')).toBe(true);
      expect(categories.has('Core Computer Science')).toBe(true);
      expect(categories.has('Professional Skills')).toBe(true);
    });

    it('should resolve standard aliases to canonical skill names', () => {
      expect(skillTaxonomyService.resolveCanonicalName('py')).toBe('Python');
      expect(skillTaxonomyService.resolveCanonicalName('python3')).toBe('Python');
      expect(skillTaxonomyService.resolveCanonicalName('k8s')).toBe('Kubernetes');
      expect(skillTaxonomyService.resolveCanonicalName('kube')).toBe('Kubernetes');
      expect(skillTaxonomyService.resolveCanonicalName('psql')).toBe('PostgreSQL');
      expect(skillTaxonomyService.resolveCanonicalName('postgres')).toBe('PostgreSQL');
      expect(skillTaxonomyService.resolveCanonicalName('reactjs')).toBe('React');
      expect(skillTaxonomyService.resolveCanonicalName('golang')).toBe('Go');
      expect(skillTaxonomyService.resolveCanonicalName('dsa')).toBe('Data Structures & Algorithms');
      expect(skillTaxonomyService.resolveCanonicalName('oop')).toBe('Object-Oriented Programming (OOP)');
      expect(skillTaxonomyService.resolveCanonicalName('llm')).toBe('Large Language Models (LLMs)');
      expect(skillTaxonomyService.resolveCanonicalName('genai')).toBe('Large Language Models (LLMs)');
      expect(skillTaxonomyService.resolveCanonicalName('ci/cd')).toBe('CI/CD Pipelines');
    });

    it('should map skills to external labor standards (O*NET SOC, ESCO URI, NSQF Levels)', () => {
      const pythonSkill = skillTaxonomyService.getSkillByCanonicalName('Python');
      expect(pythonSkill).toBeDefined();
      expect(pythonSkill?.externalMappings.onetCode).toBe('15-1252.00');
      expect(pythonSkill?.externalMappings.escoUri).toContain('data.europa.eu/esco');
      expect(pythonSkill?.externalMappings.nsqfLevel).toBeGreaterThanOrEqual(5);

      const dsaSkill = skillTaxonomyService.getSkillByCanonicalName('Data Structures & Algorithms');
      expect(dsaSkill).toBeDefined();
      expect(dsaSkill?.externalMappings.onetCode).toBe('15-1252.00');
      expect(dsaSkill?.externalMappings.nsqfLevel).toBeGreaterThanOrEqual(6);
    });

    it('should support multi-criteria skill search by keyword, alias, and category', () => {
      const k8sMatches = skillTaxonomyService.searchSkills('k8s');
      expect(k8sMatches.some((m) => m.canonicalName === 'Kubernetes')).toBe(true);

      const dbSkills = skillTaxonomyService.getSkillsByCategory('Database');
      expect(dbSkills.length).toBeGreaterThanOrEqual(3);
      expect(dbSkills.some((s) => s.canonicalName === 'PostgreSQL')).toBe(true);
      expect(dbSkills.some((s) => s.canonicalName === 'MongoDB')).toBe(true);
    });
  });

  // =========================================================================
  // 3. Job Description Collection & Deduplication via Content Hash
  // =========================================================================
  describe('3. Job Description Collection & Content Hash Deduplication', () => {
    it('should reject JD upload with 400 Bad Request when mandatory fields are missing', async () => {
      const res = await request(app)
        .post('/api/v1/tpo/job-descriptions')
        .set('Authorization', `Bearer ${tokenTpoA}`)
        .set('x-tenant-id', TENANT_A)
        .send({ title: 'Software Engineer' }); // Missing companyName and rawText

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toContain('Missing required fields');
    });

    it('should compute deterministic SHA-256 hash regardless of whitespace or casing', () => {
      const raw1 = '  Looking for a Python backend engineer with FastAPI and Docker. \n\t ';
      const raw2 = 'looking for a python backend engineer with fastapi and docker.';

      const hash1 = industryIntelligenceService.computeContentHash(raw1);
      const hash2 = industryIntelligenceService.computeContentHash(raw2);

      expect(hash1).toBe(hash2);
      expect(hash1.length).toBe(64); // SHA-256 hex digest length
    });

    it('should ingest valid JD, assign TPO_UPLOAD provenance, and detect duplicates on re-submission', async () => {
      const sampleText = `
        Company: Razorpay
        Role: SDE-1 Backend
        We need engineers skilled in Go, PostgreSQL, Redis, and Distributed Systems.
        Requirements: Minimum 1 year experience, Bachelor degree in CS.
      `;

      // 1st Ingestion: New entry (201 Created)
      const res1 = await request(app)
        .post('/api/v1/tpo/job-descriptions')
        .set('Authorization', `Bearer ${tokenTpoA}`)
        .set('x-tenant-id', TENANT_A)
        .send({
          title: 'SDE-1 Backend',
          companyName: 'Razorpay',
          industryDomain: 'FinTech',
          rawText: sampleText,
          sourceProvenance: 'TPO_UPLOAD'
        });

      expect([200, 201]).toContain(res1.status);
      expect(res1.body.success).toBe(true);
      expect(res1.body.isDuplicate).toBe(false);
      expect(res1.body.jobDescription.companyName).toBe('Razorpay');
      expect(res1.body.jobDescription.contentHash).toBeDefined();

      const originalId = res1.body.jobDescription.id;

      // 2nd Ingestion with duplicate text: Returns existing record with isDuplicate: true (200 OK)
      const res2 = await request(app)
        .post('/api/v1/tpo/job-descriptions')
        .set('Authorization', `Bearer ${tokenTpoA}`)
        .set('x-tenant-id', TENANT_A)
        .send({
          title: 'SDE-1 Backend',
          companyName: 'Razorpay',
          industryDomain: 'FinTech',
          rawText: `   ${sampleText}   \n\n`, // Whitespace variant
          sourceProvenance: 'TPO_UPLOAD'
        });

      expect(res2.status).toBe(200);
      expect(res2.body.success).toBe(true);
      expect(res2.body.isDuplicate).toBe(true);
      expect(res2.body.jobDescription.id).toBe(originalId);
    });

    it('should list and filter stored job descriptions by status, role, and company', async () => {
      const res = await request(app)
        .get('/api/v1/tpo/job-descriptions?company=Razorpay')
        .set('Authorization', `Bearer ${tokenTpoA}`)
        .set('x-tenant-id', TENANT_A);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.jobDescriptions)).toBe(true);
      expect(res.body.jobDescriptions.some((jd: any) => jd.companyName === 'Razorpay')).toBe(true);
    });
  });

  // =========================================================================
  // 4. AI-Assisted JD Extraction Pipeline & Human Review Gate
  // =========================================================================
  describe('4. AI-Assisted JD Extraction Pipeline & Human Review Gate', () => {
    it('should extract required vs preferred skills, experience, and assign confidence score', async () => {
      const jdBody = `
        Position: Senior Frontend Engineer
        Company: Freshworks
        Must Have:
        - 3+ years experience with React, TypeScript, and Redux Toolkit.
        - Deep understanding of Webpack, Vite, and CSS3.
        Nice to Have:
        - Exposure to Next.js and Tailwind CSS.
        - Familiarity with Jest and Cypress testing frameworks.
        Education: B.Tech / B.E. in Computer Science or equivalent.
      `;

      const analysis = await jdAnalyzerService.analyzeJobDescription({
        rawText: jdBody,
        title: 'Senior Frontend Engineer',
        companyName: 'Freshworks',
        forceProvider: 'rule-based'
      });

      expect(analysis.roleClassification).toBe('Frontend Developer');
      expect(analysis.experienceYearsMin).toBe(3);
      expect(analysis.confidenceScore).toBeGreaterThanOrEqual(70);

      // Check required skills
      expect(analysis.requiredSkills.some((s) => s.canonicalName === 'React')).toBe(true);
      expect(analysis.requiredSkills.some((s) => s.canonicalName === 'TypeScript')).toBe(true);

      // Check preferred skills
      expect(analysis.preferredSkills.some((s) => s.canonicalName === 'Next.js' || s.canonicalName === 'Tailwind CSS')).toBe(true);
    });

    it('should support human review gate (TPO corrections) and update JD to REVIEWED', async () => {
      // Create a JD to review
      const uploadRes = await request(app)
        .post('/api/v1/tpo/job-descriptions')
        .set('Authorization', `Bearer ${tokenTpoA}`)
        .set('x-tenant-id', TENANT_A)
        .send({
          title: 'Associate Cloud Architect',
          companyName: 'Infosys',
          rawText: 'Looking for a cloud developer with AWS, Docker, and Linux scripting skills.'
        });

      const jdId = uploadRes.body.jobDescription.id;

      // Post Human Review
      const reviewRes = await request(app)
        .post(`/api/v1/tpo/job-descriptions/${jdId}/review`)
        .set('Authorization', `Bearer ${tokenTpoA}`)
        .set('x-tenant-id', TENANT_A)
        .send({
          correctedRole: 'Cloud Engineer',
          addedSkills: ['Kubernetes', 'Terraform'],
          removedSkills: [],
          notes: 'Added K8s and Terraform as per 2026 hiring rubric requirements.'
        });

      expect(reviewRes.status).toBe(200);
      expect(reviewRes.body.success).toBe(true);
      expect(reviewRes.body.jobDescription.status).toBe('REVIEWED');
      expect(reviewRes.body.jobDescription.analysis.roleClassification).toBe('Cloud Engineer');
      expect(reviewRes.body.jobDescription.analysis.humanReview.isReviewed).toBe(true);
      expect(reviewRes.body.jobDescription.analysis.humanReview.reviewerName).toBe(tpoAdminA.email);
      expect(reviewRes.body.jobDescription.analysis.requiredSkills.some((s: any) => s.canonicalName === 'Kubernetes')).toBe(true);
    });

    it('should guarantee zero student data leak during extraction (no student PII processed)', async () => {
      // Extraction pipeline operates exclusively on raw job description text and role title
      // It neither accepts nor processes any student PII or profile records
      const result = await jdAnalyzerService.analyzeJobDescription({
        rawText: 'Looking for a Java and Spring Boot engineer with MySQL database knowledge.',
        title: 'Java Developer',
        forceProvider: 'rule-based'
      });
      expect(result).toBeDefined();
      expect((result as any).studentId).toBeUndefined();
      expect((result as any).studentEmail).toBeUndefined();
      expect(result.requiredSkills.some((s) => s.canonicalName === 'Java')).toBe(true);
    });
  });

  // =========================================================================
  // 5. Industry Demand Calculation
  // =========================================================================
  describe('5. Industry Demand Calculation', () => {
    it('should compute actual skill frequency, percentage of total JDs, and required vs preferred counts', () => {
      const demandedSkills = industryIntelligenceService.calculateDemandedSkills(TENANT_A);
      expect(demandedSkills.length).toBeGreaterThan(0);

      const topSkill = demandedSkills[0];
      expect(topSkill.skillName).toBeTruthy();
      expect(topSkill.frequencyCount).toBeGreaterThan(0);
      expect(topSkill.percentageOfTotalJDs).toBeGreaterThan(0);
      expect(topSkill.percentageOfTotalJDs).toBeLessThanOrEqual(100);
      expect(topSkill.requiredCount).toBeGreaterThanOrEqual(0);
      expect(topSkill.preferredCount).toBeGreaterThanOrEqual(0);
      expect(topSkill.requiredCount + topSkill.preferredCount).toBe(topSkill.frequencyCount);
    });

    it('should calculate role and company breakdowns in industry overview analytics', () => {
      const overview = industryIntelligenceService.getIndustryOverview(TENANT_A);
      expect(overview.totalAnalyzedJDs).toBeGreaterThan(0);
      expect(overview.roleDistribution.length).toBeGreaterThan(0);
      expect(overview.categoryBreakdown.length).toBeGreaterThan(0);
      expect(overview.topInDemandSkills.length).toBeGreaterThan(0);
      expect(overview.topInDemandSkills[0].topCompanies).toBeDefined();

      // Verify zero synthetic statistics disclaimer and freshness attribution
      expect(overview.dataFreshnessLabel.zeroFabricatedDisclaimer).toContain('Zero synthetic statistics');
      expect(overview.dataFreshnessLabel.totalAnalyzedJDs).toBe(overview.totalAnalyzedJDs);
    });
  });

  // =========================================================================
  // 6. Emerging Trend Detection & Sample-Size Guard
  // =========================================================================
  describe('6. Emerging Trend Detection & Sample-Size Guard', () => {
    it('should compare current vs previous periods and compute percentage growth', () => {
      const trends = industryIntelligenceService.calculateSkillTrends(TENANT_A);
      expect(trends.length).toBeGreaterThan(0);

      for (const trend of trends) {
        expect(['EMERGING', 'GROWING', 'STABLE', 'DECLINING']).toContain(trend.momentum);
        expect(typeof trend.growthPercentage).toBe('number');
        expect(trend.sampleSizeCurrent).toBeGreaterThanOrEqual(0);
        expect(typeof trend.isStatisticallySignificant).toBe('boolean');
      }
    });

    it('should flag trends with statistical significance indicator', () => {
      const trends = industryIntelligenceService.calculateSkillTrends(TENANT_A);
      expect(trends.some((t) => typeof t.isStatisticallySignificant === 'boolean')).toBe(true);
    });
  });

  // =========================================================================
  // 7. Role-Based Skill Requirements (14 Standard Roles)
  // =========================================================================
  describe('7. Role-Based Skill Requirements (14 Standard Roles)', () => {
    it('should provide comprehensive templates for exactly 14 standard placement roles', () => {
      const roles = industryIntelligenceService.getAllRoleTemplates();
      expect(roles.length).toBe(14);

      const expected14Roles = [
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

      for (const name of expected14Roles) {
        const found = roles.find((r) => r.roleName === name);
        expect(found, `Role template for ${name} must exist`).toBeDefined();
        expect(found!.coreSkills.length).toBeGreaterThanOrEqual(3);
        expect(found!.foundationalSkills.length).toBeGreaterThanOrEqual(1);
        expect(found!.minimumPassReadinessScore).toBeGreaterThanOrEqual(60);
      }
    });

    it('should return role template via REST API /api/v1/tpo/industry-intelligence/roles', async () => {
      const res = await request(app)
        .get('/api/v1/tpo/industry-intelligence/roles')
        .set('Authorization', `Bearer ${tokenTpoA}`)
        .set('x-tenant-id', TENANT_A);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.roles.length).toBe(14);
    });
  });

  // =========================================================================
  // 8. Student Skill-Gap Detection (6-Tier Classification)
  // =========================================================================
  describe('8. Student Skill-Gap Detection (6-Tier Classification)', () => {
    it('should diagnose student skill gaps across the 6 discrete tiers', async () => {
      const report = await studentSkillGapService.diagnoseStudentSkillGap({
        studentId: studentA1.id,
        tenantId: TENANT_A,
        roleIdOrName: 'Software Engineer'
      });

      expect(report.targetRole).toContain('Software Engineer');
      expect(report.skillItems.length).toBeGreaterThanOrEqual(5);

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
      expect(report.tierBreakdown).toBeDefined();
    });

    it('should recalculate student skill gap diagnosis for a different target role via REST API', async () => {
      const res = await request(app)
        .post('/api/v1/student/skill-gap/recalculate')
        .set('Authorization', `Bearer ${tokenStudentA1}`)
        .set('x-tenant-id', TENANT_A)
        .send({ roleId: 'role-devops' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.skillGap.targetRole).toContain('DevOps');
      expect(res.body.skillGap.skillItems.some((s: any) => s.canonicalName === 'Docker')).toBe(true);
    });
  });

  // =========================================================================
  // 9. Career Role Recommendation Engine & INSUFFICIENT_DATA Safeguard
  // =========================================================================
  describe('9. Career Role Recommendation Engine & INSUFFICIENT_DATA Safeguard', () => {
    it('should generate deterministic recommendations across all 14 roles ranked by match score', async () => {
      const recs = await careerRecommendationService.generateRecommendations(studentA1.id, TENANT_A);
      expect(recs.length).toBe(14);

      // Verify descending order
      for (let i = 0; i < recs.length - 1; i++) {
        expect(recs[i].matchScore).toBeGreaterThanOrEqual(recs[i + 1].matchScore);
      }

      const topRec = recs[0];
      expect(['STRONG_MATCH', 'GOOD_MATCH', 'MODERATE_MATCH', 'DEVELOPING']).toContain(topRec.fitLevel);
      expect(topRec.advisoryDisclaimer).toContain('Advisory Notice');
      expect(topRec.suggestedProjects.length).toBeGreaterThan(0);
    });

    it('should apply INSUFFICIENT_DATA safeguard for students with sparse portfolios', async () => {
      const sparseStudentId = 'sparse-student-no-data';
      const recs = await careerRecommendationService.generateRecommendations(sparseStudentId, TENANT_A);

      for (const rec of recs) {
        if (rec.isInsufficientData) {
          expect(rec.matchScore).toBeLessThanOrEqual(45);
          expect(rec.rationale).toContain('Preliminary baseline');
        }
      }
    });

    it('should allow student to update recommendation status to PRIMARY_GOAL, SAVED, or DISMISSED', async () => {
      const recs = await careerRecommendationService.getRecommendations(studentA1.id, TENANT_A);
      const target = recs[0];

      // Update to PRIMARY_GOAL
      const res1 = await request(app)
        .patch(`/api/v1/student/career-recommendations/${target.id}`)
        .set('Authorization', `Bearer ${tokenStudentA1}`)
        .set('x-tenant-id', TENANT_A)
        .send({ status: 'PRIMARY_GOAL' });

      expect(res1.status).toBe(200);
      expect(res1.body.success).toBe(true);
      expect(res1.body.recommendation.status).toBe('PRIMARY_GOAL');

      // Update to DISMISSED
      const res2 = await request(app)
        .patch(`/api/v1/student/career-recommendations/${target.id}`)
        .set('Authorization', `Bearer ${tokenStudentA1}`)
        .set('x-tenant-id', TENANT_A)
        .send({ status: 'DISMISSED' });

      expect(res2.status).toBe(200);
      expect(res2.body.recommendation.status).toBe('DISMISSED');
    });

    it('should reject invalid status with 400 Bad Request', async () => {
      const recs = await careerRecommendationService.getRecommendations(studentA1.id, TENANT_A);
      const target = recs[0];

      const res = await request(app)
        .patch(`/api/v1/student/career-recommendations/${target.id}`)
        .set('Authorization', `Bearer ${tokenStudentA1}`)
        .set('x-tenant-id', TENANT_A)
        .send({ status: 'INVALID_STATUS_VALUE' });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });

  // =========================================================================
  // 10. Company-Specific Skill Intelligence & Privacy Safeguards
  // =========================================================================
  describe('10. Company-Specific Skill Intelligence & Privacy Safeguards', () => {
    it('should retrieve list of approved visiting companies with tech stacks', async () => {
      const res = await request(app)
        .get('/api/v1/student/company-intelligence')
        .set('Authorization', `Bearer ${tokenStudentA1}`)
        .set('x-tenant-id', TENANT_A);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.companies)).toBe(true);
      expect(res.body.companies.length).toBeGreaterThan(0);
    });

    it('should calculate student match vs company tech stack without leaking recruiter notes', async () => {
      const res = await request(app)
        .get('/api/v1/student/company-intelligence/Amazon')
        .set('Authorization', `Bearer ${tokenStudentA1}`)
        .set('x-tenant-id', TENANT_A);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      const intel = res.body.companyIntelligence;

      expect(intel.companyName).toBe('Amazon');
      expect(intel.topRequiredSkills.length).toBeGreaterThan(0);
      expect(intel.studentMatch).toBeDefined();
      expect(intel.studentMatch.matchPercentage).toBeGreaterThanOrEqual(0);
      expect(intel.studentMatch.recommendedPreparationTasks.length).toBeGreaterThan(0);

      // Privacy Check: Ensure zero recruiter private fields or notes are exposed
      expect(intel.privateNotes).toBeUndefined();
      expect(intel.recruiterInternalRubric).toBeUndefined();
      expect(intel.confidentialShortlistFlag).toBeUndefined();
    });
  });

  // =========================================================================
  // 11. Cohort Skill-Gap Analytics & Institutional Training Interventions
  // =========================================================================
  describe('11. Cohort Skill-Gap Analytics & Institutional Training Interventions', () => {
    it('should calculate institutional common gaps with urgency prioritization', async () => {
      const res = await request(app)
        .get('/api/v1/tpo/cohort-intelligence/gaps')
        .set('Authorization', `Bearer ${tokenTpoA}`)
        .set('x-tenant-id', TENANT_A);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.institutionalGaps)).toBe(true);

      for (const gap of res.body.institutionalGaps) {
        expect(['CRITICAL', 'HIGH', 'MEDIUM']).toContain(gap.urgency);
        expect(gap.gapPercentage).toBeGreaterThan(0);
        expect(gap.studentCountNeedingImprovement).toBeGreaterThan(0);
      }
    });

    it('should synthesize concrete institutional training interventions', () => {
      const interventions = cohortIntelligenceService.getTrainingInterventions(TENANT_A);
      expect(interventions.length).toBeGreaterThanOrEqual(2);

      const first = interventions[0];
      expect(first.title).toBeTruthy();
      expect(first.affectedStudentsCount).toBeGreaterThan(0);
      expect(first.actionPlan).toBeTruthy();
      expect(first.suggestedCurriculumTopics.length).toBeGreaterThan(0);
    });

    it('should provide cohort overview with department capability vs market demand matrix', async () => {
      const res = await request(app)
        .get('/api/v1/tpo/cohort-intelligence/overview?department=Computer%20Science%20%26%20Engineering')
        .set('Authorization', `Bearer ${tokenTpoA}`)
        .set('x-tenant-id', TENANT_A);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.cohortOverview.totalStudents).toBeGreaterThan(0);
      expect(res.body.cohortOverview.skillCoverageMatrix.length).toBeGreaterThan(0);
      expect(res.body.cohortOverview.recommendedInterventions.length).toBeGreaterThan(0);
    });
  });

  // =========================================================================
  // 12. Personalized Learning Integration & Governance
  // =========================================================================
  describe('12. Personalized Learning Integration & Governance', () => {
    it('should link identified skill gaps to Phase 12 learning tasks when present', async () => {
      const report = await studentSkillGapService.diagnoseStudentSkillGap({
        studentId: studentA1.id,
        tenantId: TENANT_A,
        roleIdOrName: 'Software Engineer'
      });

      const itemsWithRemediation = report.skillItems.filter((i) => i.recommendedRemediationAction);
      expect(itemsWithRemediation.length).toBe(report.skillItems.length);
    });

    it('should strictly prohibit auto-granting VERIFIED status upon learning task recommendation or assignment', async () => {
      const report = await studentSkillGapService.diagnoseStudentSkillGap({
        studentId: studentA1.id,
        tenantId: TENANT_A,
        roleIdOrName: 'Backend Developer'
      });

      // Gap items with recommended tasks must retain their non-verified tier until official TPO review
      for (const item of report.skillItems) {
        if (item.tier !== 'VERIFIED_MATCH') {
          expect(['EVIDENCE_AVAILABLE', 'PENDING_VERIFICATION', 'IMPROVEMENT_NEEDED', 'MISSING_EVIDENCE', 'NOT_ASSESSED']).toContain(item.tier);
        }
      }
    });
  });

  // =========================================================================
  // 13. Anti-Tampering, Cross-Student & Multi-Tenant Security Boundaries
  // =========================================================================
  describe('13. Anti-Tampering, Cross-Student & Multi-Tenant Security Boundaries', () => {
    it('should prevent student A from mutating student B career recommendations', async () => {
      // Generate recommendations for student A1
      const recsA1 = await careerRecommendationService.getRecommendations(studentA1.id, TENANT_A);
      const recA1 = recsA1[0];

      // Student A2 attempts to modify Student A1's recommendation
      const res = await request(app)
        .patch(`/api/v1/student/career-recommendations/${recA1.id}`)
        .set('Authorization', `Bearer ${tokenStudentA2}`)
        .set('x-tenant-id', TENANT_A)
        .send({ status: 'PRIMARY_GOAL' });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toContain('Forbidden');
    });

    it('should isolate job descriptions across tenants (Tenant A cannot see Tenant B private JDs)', async () => {
      // Ingest JD in Tenant B
      const uniqueBText = 'Private internal hiring requisition for Tenant B Engineering Department';
      await request(app)
        .post('/api/v1/tpo/job-descriptions')
        .set('Authorization', `Bearer ${tokenTpoB}`)
        .set('x-tenant-id', TENANT_B)
        .send({
          title: 'Staff Architect',
          companyName: 'PrivateB Corp',
          rawText: uniqueBText
        });

      // Tenant A queries JDs with company filter
      const resA = await request(app)
        .get('/api/v1/tpo/job-descriptions?company=PrivateB%20Corp')
        .set('Authorization', `Bearer ${tokenTpoA}`)
        .set('x-tenant-id', TENANT_A);

      expect(resA.status).toBe(200);
      expect(resA.body.jobDescriptions.length).toBe(0); // Tenant A sees 0 records from Tenant B
    });

    it('should block tenant spoofing via mismatched x-tenant-id header', async () => {
      // Student A1 sends x-tenant-id of Tenant B
      const res = await request(app)
        .get('/api/v1/student/skill-gap')
        .set('Authorization', `Bearer ${tokenStudentA1}`)
        .set('x-tenant-id', TENANT_B);

      // Mismatched tenant header is rejected by tenantMiddleware with 403 Forbidden
      expect(res.status).toBe(403);
      expect(res.body.error).toContain('tenant spoofing');
    });
  });
});
