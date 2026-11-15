import { describe, it, expect } from 'vitest';
import { getTableColumns } from 'drizzle-orm';
import fs from 'fs';
import path from 'path';
import * as schema from '../src/db/schema';

describe('Phase 13 Schema Extensions (Industry Skill Intelligence, Career Recommendation & Skill-Gap Engine)', () => {
  describe('1. Authoritative Domain Enums', () => {
    it('should export taxonomyCategoryEnum with 8 categories', () => {
      expect(schema.taxonomyCategoryEnum).toBeDefined();
      expect(schema.taxonomyCategoryEnum.enumValues).toEqual([
        'PROGRAMMING_LANGUAGES',
        'FRONTEND',
        'BACKEND',
        'DATABASE',
        'CLOUD_DEVOPS',
        'DATA_AI',
        'CORE_CS',
        'PROFESSIONAL_SKILLS'
      ]);
    });

    it('should export jdSourceTypeEnum with 5 ingestion channels', () => {
      expect(schema.jdSourceTypeEnum).toBeDefined();
      expect(schema.jdSourceTypeEnum.enumValues).toEqual([
        'RECRUITER_SUBMISSION',
        'MANUAL_UPLOAD',
        'INTERNAL_SYSTEM',
        'PUBLIC_DATASET',
        'PUBLIC_FEED'
      ]);
    });

    it('should export jdAnalysisStatusEnum with review gate statuses', () => {
      expect(schema.jdAnalysisStatusEnum).toBeDefined();
      expect(schema.jdAnalysisStatusEnum.enumValues).toEqual([
        'PENDING',
        'ANALYZED',
        'HUMAN_REVIEWED',
        'REJECTED'
      ]);
    });

    it('should export skillImportanceEnum with importance classifications', () => {
      expect(schema.skillImportanceEnum).toBeDefined();
      expect(schema.skillImportanceEnum.enumValues).toEqual([
        'MANDATORY',
        'PREFERRED',
        'OPTIONAL'
      ]);
    });

    it('should export studentSkillGapStatusEnum with 6-tier gap statuses', () => {
      expect(schema.studentSkillGapStatusEnum).toBeDefined();
      expect(schema.studentSkillGapStatusEnum.enumValues).toEqual([
        'VERIFIED_MATCH',
        'EVIDENCE_AVAILABLE',
        'PENDING_VERIFICATION',
        'IMPROVEMENT_NEEDED',
        'MISSING_EVIDENCE',
        'NOT_ASSESSED'
      ]);
    });

    it('should export careerRecommendationFitEnum with fit tier levels', () => {
      expect(schema.careerRecommendationFitEnum).toBeDefined();
      expect(schema.careerRecommendationFitEnum.enumValues).toEqual([
        'STRONG_MATCH',
        'GOOD_MATCH',
        'POTENTIAL_MATCH',
        'DEVELOPING',
        'INSUFFICIENT_DATA'
      ]);
    });
  });

  describe('2. Table Structure & Tenant Isolation Column Guarantees', () => {
    it('skillTaxonomy should define all required columns and tenant isolation', () => {
      expect(schema.skillTaxonomy).toBeDefined();
      const cols = getTableColumns(schema.skillTaxonomy);
      expect(cols.id).toBeDefined();
      expect(cols.tenantId).toBeDefined();
      expect(cols.skillName).toBeDefined();
      expect(cols.canonicalName).toBeDefined();
      expect(cols.category).toBeDefined();
      expect(cols.description).toBeDefined();
      expect(cols.parentSkillId).toBeDefined();
      expect(cols.externalMappingJson).toBeDefined();
      expect(cols.isActive).toBeDefined();
      expect(cols.createdAt).toBeDefined();
      expect(cols.updatedAt).toBeDefined();
    });

    it('skillAliases should define all required columns and foreign keys', () => {
      expect(schema.skillAliases).toBeDefined();
      const cols = getTableColumns(schema.skillAliases);
      expect(cols.id).toBeDefined();
      expect(cols.skillId).toBeDefined();
      expect(cols.tenantId).toBeDefined();
      expect(cols.aliasName).toBeDefined();
      expect(cols.normalizedAlias).toBeDefined();
      expect(cols.createdAt).toBeDefined();
    });

    it('jobDescriptionSources should define all required columns and source types', () => {
      expect(schema.jobDescriptionSources).toBeDefined();
      const cols = getTableColumns(schema.jobDescriptionSources);
      expect(cols.id).toBeDefined();
      expect(cols.tenantId).toBeDefined();
      expect(cols.sourceName).toBeDefined();
      expect(cols.sourceType).toBeDefined();
      expect(cols.sourceUrl).toBeDefined();
      expect(cols.description).toBeDefined();
      expect(cols.isActive).toBeDefined();
      expect(cols.createdAt).toBeDefined();
    });

    it('industryJobDescriptions should define all required columns, hashes, and deduplication', () => {
      expect(schema.industryJobDescriptions).toBeDefined();
      const cols = getTableColumns(schema.industryJobDescriptions);
      expect(cols.id).toBeDefined();
      expect(cols.tenantId).toBeDefined();
      expect(cols.sourceId).toBeDefined();
      expect(cols.companyName).toBeDefined();
      expect(cols.jobTitle).toBeDefined();
      expect(cols.targetRole).toBeDefined();
      expect(cols.industryDomain).toBeDefined();
      expect(cols.rawDescription).toBeDefined();
      expect(cols.location).toBeDefined();
      expect(cols.employmentType).toBeDefined();
      expect(cols.experienceMinYears).toBeDefined();
      expect(cols.experienceMaxYears).toBeDefined();
      expect(cols.educationRequirement).toBeDefined();
      expect(cols.publishedDate).toBeDefined();
      expect(cols.collectionTimestamp).toBeDefined();
      expect(cols.contentHash).toBeDefined();
      expect(cols.duplicateOfId).toBeDefined();
      expect(cols.verificationStatus).toBeDefined();
      expect(cols.createdAt).toBeDefined();
      expect(cols.updatedAt).toBeDefined();
    });

    it('jobDescriptionAnalyses should define all required columns and auditing fields', () => {
      expect(schema.jobDescriptionAnalyses).toBeDefined();
      const cols = getTableColumns(schema.jobDescriptionAnalyses);
      expect(cols.id).toBeDefined();
      expect(cols.jdId).toBeDefined();
      expect(cols.tenantId).toBeDefined();
      expect(cols.normalizedRole).toBeDefined();
      expect(cols.requiredSkillsJson).toBeDefined();
      expect(cols.preferredSkillsJson).toBeDefined();
      expect(cols.minExperienceYears).toBeDefined();
      expect(cols.educationRequirementsJson).toBeDefined();
      expect(cols.confidenceScore).toBeDefined();
      expect(cols.analysisMethod).toBeDefined();
      expect(cols.reviewStatus).toBeDefined();
      expect(cols.reviewedBy).toBeDefined();
      expect(cols.reviewedAt).toBeDefined();
      expect(cols.reviewerNotes).toBeDefined();
      expect(cols.createdAt).toBeDefined();
    });

    it('industrySkillDemand should define all required metrics and frequency fields', () => {
      expect(schema.industrySkillDemand).toBeDefined();
      const cols = getTableColumns(schema.industrySkillDemand);
      expect(cols.id).toBeDefined();
      expect(cols.tenantId).toBeDefined();
      expect(cols.skillId).toBeDefined();
      expect(cols.skillName).toBeDefined();
      expect(cols.category).toBeDefined();
      expect(cols.mentionCount).toBeDefined();
      expect(cols.requiredCount).toBeDefined();
      expect(cols.preferredCount).toBeDefined();
      expect(cols.frequencyPercentage).toBeDefined();
      expect(cols.analysisPeriod).toBeDefined();
      expect(cols.lastAnalyzedAt).toBeDefined();
      expect(cols.createdAt).toBeDefined();
    });

    it('industrySkillTrends should define all momentum, growth, and confidence fields', () => {
      expect(schema.industrySkillTrends).toBeDefined();
      const cols = getTableColumns(schema.industrySkillTrends);
      expect(cols.id).toBeDefined();
      expect(cols.tenantId).toBeDefined();
      expect(cols.skillId).toBeDefined();
      expect(cols.skillName).toBeDefined();
      expect(cols.currentPeriodMentions).toBeDefined();
      expect(cols.previousPeriodMentions).toBeDefined();
      expect(cols.percentageGrowth).toBeDefined();
      expect(cols.momentumStatus).toBeDefined();
      expect(cols.sampleSize).toBeDefined();
      expect(cols.confidenceLevel).toBeDefined();
      expect(cols.periodStart).toBeDefined();
      expect(cols.periodEnd).toBeDefined();
      expect(cols.createdAt).toBeDefined();
    });

    it('roleSkillRequirements should define role benchmark competencies and templates', () => {
      expect(schema.roleSkillRequirements).toBeDefined();
      const cols = getTableColumns(schema.roleSkillRequirements);
      expect(cols.id).toBeDefined();
      expect(cols.tenantId).toBeDefined();
      expect(cols.roleName).toBeDefined();
      expect(cols.category).toBeDefined();
      expect(cols.coreSkillsJson).toBeDefined();
      expect(cols.requiredFoundationsJson).toBeDefined();
      expect(cols.preferredSkillsJson).toBeDefined();
      expect(cols.practicalProjectExpectationsJson).toBeDefined();
      expect(cols.experienceExpectations).toBeDefined();
      expect(cols.isSystemTemplate).toBeDefined();
      expect(cols.isReviewed).toBeDefined();
      expect(cols.createdBy).toBeDefined();
      expect(cols.createdAt).toBeDefined();
      expect(cols.updatedAt).toBeDefined();
    });

    it('studentRolePreferences should define student target roles and priority ranks', () => {
      expect(schema.studentRolePreferences).toBeDefined();
      const cols = getTableColumns(schema.studentRolePreferences);
      expect(cols.id).toBeDefined();
      expect(cols.studentId).toBeDefined();
      expect(cols.tenantId).toBeDefined();
      expect(cols.targetRole).toBeDefined();
      expect(cols.preferenceRank).toBeDefined();
      expect(cols.isPrimary).toBeDefined();
      expect(cols.setByStudent).toBeDefined();
      expect(cols.createdAt).toBeDefined();
      expect(cols.updatedAt).toBeDefined();
    });

    it('studentSkillGapSnapshots should define granular gap diagnostic columns', () => {
      expect(schema.studentSkillGapSnapshots).toBeDefined();
      const cols = getTableColumns(schema.studentSkillGapSnapshots);
      expect(cols.id).toBeDefined();
      expect(cols.studentId).toBeDefined();
      expect(cols.tenantId).toBeDefined();
      expect(cols.targetRole).toBeDefined();
      expect(cols.skillId).toBeDefined();
      expect(cols.skillName).toBeDefined();
      expect(cols.category).toBeDefined();
      expect(cols.status).toBeDefined();
      expect(cols.confidenceScore).toBeDefined();
      expect(cols.verifiedEvidenceCount).toBeDefined();
      expect(cols.unverifiedEvidenceCount).toBeDefined();
      expect(cols.assessmentScore).toBeDefined();
      expect(cols.diagnosisRationale).toBeDefined();
      expect(cols.recommendedAction).toBeDefined();
      expect(cols.generatedAt).toBeDefined();
    });

    it('careerRecommendations should define explainable recommendation columns', () => {
      expect(schema.careerRecommendations).toBeDefined();
      const cols = getTableColumns(schema.careerRecommendations);
      expect(cols.id).toBeDefined();
      expect(cols.studentId).toBeDefined();
      expect(cols.tenantId).toBeDefined();
      expect(cols.recommendedRole).toBeDefined();
      expect(cols.fitLevel).toBeDefined();
      expect(cols.matchScorePercentage).toBeDefined();
      expect(cols.strengthsJson).toBeDefined();
      expect(cols.gapsJson).toBeDefined();
      expect(cols.suggestedProjectsJson).toBeDefined();
      expect(cols.suggestedLearningTasksJson).toBeDefined();
      expect(cols.rationaleText).toBeDefined();
      expect(cols.isDismissed).toBeDefined();
      expect(cols.generatedAt).toBeDefined();
    });

    it('cohortSkillGapSnapshots should define batch-level analytics and intervention columns', () => {
      expect(schema.cohortSkillGapSnapshots).toBeDefined();
      const cols = getTableColumns(schema.cohortSkillGapSnapshots);
      expect(cols.id).toBeDefined();
      expect(cols.tenantId).toBeDefined();
      expect(cols.department).toBeDefined();
      expect(cols.graduationYear).toBeDefined();
      expect(cols.totalStudentsAnalyzed).toBeDefined();
      expect(cols.mostCommonGapsJson).toBeDefined();
      expect(cols.verifiedSkillCoverageJson).toBeDefined();
      expect(cols.capabilityVsDemandJson).toBeDefined();
      expect(cols.recommendedInterventionsJson).toBeDefined();
      expect(cols.analyzedAt).toBeDefined();
      expect(cols.createdAt).toBeDefined();
    });
  });

  describe('3. Drizzle Relations Architecture', () => {
    it('should define all Phase 13 relations', () => {
      expect(schema.skillTaxonomyRelations).toBeDefined();
      expect(schema.skillAliasesRelations).toBeDefined();
      expect(schema.jobDescriptionSourcesRelations).toBeDefined();
      expect(schema.industryJobDescriptionsRelations).toBeDefined();
      expect(schema.jobDescriptionAnalysesRelations).toBeDefined();
      expect(schema.industrySkillDemandRelations).toBeDefined();
      expect(schema.industrySkillTrendsRelations).toBeDefined();
      expect(schema.roleSkillRequirementsRelations).toBeDefined();
      expect(schema.studentRolePreferencesRelations).toBeDefined();
      expect(schema.studentSkillGapSnapshotsRelations).toBeDefined();
      expect(schema.careerRecommendationsRelations).toBeDefined();
      expect(schema.cohortSkillGapSnapshotsRelations).toBeDefined();
    });
  });

  describe('4. Non-Destructive Migration File Verification', () => {
    it('should locate 0003_*.sql migration and verify 100% additive structure', () => {
      const drizzleDir = path.resolve(__dirname, '../drizzle');
      const files = fs.readdirSync(drizzleDir);
      const phase13Migration = files.find((f) => f.startsWith('0003_') && f.endsWith('.sql'));

      expect(phase13Migration).toBeDefined();
      const sqlContent = fs.readFileSync(path.join(drizzleDir, phase13Migration!), 'utf-8');

      // Zero destructive commands
      expect(sqlContent).not.toMatch(/DROP\s+TABLE/i);
      expect(sqlContent).not.toMatch(/DROP\s+COLUMN/i);
      expect(sqlContent).not.toMatch(/TRUNCATE/i);

      // Verify all 6 enums created
      expect(sqlContent).toContain('CREATE TYPE "public"."taxonomy_category_enum"');
      expect(sqlContent).toContain('CREATE TYPE "public"."jd_source_type_enum"');
      expect(sqlContent).toContain('CREATE TYPE "public"."jd_analysis_status_enum"');
      expect(sqlContent).toContain('CREATE TYPE "public"."skill_importance_enum"');
      expect(sqlContent).toContain('CREATE TYPE "public"."student_skill_gap_status_enum"');
      expect(sqlContent).toContain('CREATE TYPE "public"."career_recommendation_fit_enum"');

      // Verify all 12 tables created
      expect(sqlContent).toContain('CREATE TABLE "skill_taxonomy"');
      expect(sqlContent).toContain('CREATE TABLE "skill_aliases"');
      expect(sqlContent).toContain('CREATE TABLE "job_description_sources"');
      expect(sqlContent).toContain('CREATE TABLE "industry_job_descriptions"');
      expect(sqlContent).toContain('CREATE TABLE "job_description_analyses"');
      expect(sqlContent).toContain('CREATE TABLE "industry_skill_demand"');
      expect(sqlContent).toContain('CREATE TABLE "industry_skill_trends"');
      expect(sqlContent).toContain('CREATE TABLE "role_skill_requirements"');
      expect(sqlContent).toContain('CREATE TABLE "student_role_preferences"');
      expect(sqlContent).toContain('CREATE TABLE "student_skill_gap_snapshots"');
      expect(sqlContent).toContain('CREATE TABLE "career_recommendations"');
      expect(sqlContent).toContain('CREATE TABLE "cohort_skill_gap_snapshots"');

      // Verify multi-tenant isolation foreign keys
      expect(sqlContent).toContain('"skill_taxonomy_tenant_id_tenants_id_fk"');
      expect(sqlContent).toContain('"skill_aliases_tenant_id_tenants_id_fk"');
      expect(sqlContent).toContain('"job_description_sources_tenant_id_tenants_id_fk"');
      expect(sqlContent).toContain('"industry_job_descriptions_tenant_id_tenants_id_fk"');
      expect(sqlContent).toContain('"job_description_analyses_tenant_id_tenants_id_fk"');
      expect(sqlContent).toContain('"industry_skill_demand_tenant_id_tenants_id_fk"');
      expect(sqlContent).toContain('"industry_skill_trends_tenant_id_tenants_id_fk"');
      expect(sqlContent).toContain('"role_skill_requirements_tenant_id_tenants_id_fk"');
      expect(sqlContent).toContain('"student_role_preferences_tenant_id_tenants_id_fk"');
      expect(sqlContent).toContain('"student_skill_gap_snapshots_tenant_id_tenants_id_fk"');
      expect(sqlContent).toContain('"career_recommendations_tenant_id_tenants_id_fk"');
      expect(sqlContent).toContain('"cohort_skill_gap_snapshots_tenant_id_tenants_id_fk"');
    });
  });
});
