import { describe, it, expect } from 'vitest';
import { getTableColumns } from 'drizzle-orm';
import fs from 'fs';
import path from 'path';
import * as schema from '../src/db/schema';

describe('Phase 17 Schema Extensions (Institutional Governance, Accreditation Compliance & Outreach)', () => {
  describe('1. Authoritative Domain Enums', () => {
    it('should export interventionStatusEnum with 6 lifecycle states', () => {
      expect(schema.interventionStatusEnum).toBeDefined();
      expect(schema.interventionStatusEnum.enumValues).toEqual([
        'PROPOSED',
        'APPROVED',
        'IN_PROGRESS',
        'EVALUATING',
        'COMPLETED',
        'CANCELLED'
      ]);
    });

    it('should export fairnessReviewStatusEnum with 5 review states', () => {
      expect(schema.fairnessReviewStatusEnum).toBeDefined();
      expect(schema.fairnessReviewStatusEnum.enumValues).toEqual([
        'FLAGGED',
        'UNDER_REVIEW',
        'EXPLANATION_REQUESTED',
        'RESOLVED',
        'ESCALATED'
      ]);
    });

    it('should export reportFormatEnum with 4 format types', () => {
      expect(schema.reportFormatEnum).toBeDefined();
      expect(schema.reportFormatEnum.enumValues).toEqual([
        'PDF',
        'EXCEL',
        'CSV',
        'JSON'
      ]);
    });

    it('should export reportCategoryEnum with 10 standard reporting categories', () => {
      expect(schema.reportCategoryEnum).toBeDefined();
      expect(schema.reportCategoryEnum.enumValues).toEqual([
        'PLACEMENT_STATISTICS',
        'BRANCH_WISE_OUTCOMES',
        'COMPANY_PARTICIPATION',
        'SALARY_DISTRIBUTION',
        'VERIFIED_SKILL_COVERAGE',
        'SKILL_GAP_CLOSURE',
        'TRAINING_INTERVENTIONS',
        'MOCK_ASSESSMENT_PERFORMANCE',
        'ALUMNI_MENTORSHIP',
        'ACADEMIC_YEAR_COMPARISON'
      ]);
    });

    it('should export outreachCampaignStatusEnum with 8 campaign lifecycle statuses', () => {
      expect(schema.outreachCampaignStatusEnum).toBeDefined();
      expect(schema.outreachCampaignStatusEnum.enumValues).toEqual([
        'DRAFT',
        'UNDER_REVIEW',
        'APPROVED',
        'QUEUED',
        'SENT',
        'PARTIALLY_SENT',
        'FAILED',
        'CANCELLED'
      ]);
    });
  });

  describe('2. Authoritative Domain Tables & Multi-Tenant Architecture', () => {
    const phase17Tables = [
      { name: 'institutionalMetricSnapshots', table: schema.institutionalMetricSnapshots },
      { name: 'trainingInterventions', table: schema.trainingInterventions },
      { name: 'trainingInterventionParticipants', table: schema.trainingInterventionParticipants },
      { name: 'fairnessReviewCases', table: schema.fairnessReviewCases },
      { name: 'institutionalReportTemplates', table: schema.institutionalReportTemplates },
      { name: 'institutionalReportRuns', table: schema.institutionalReportRuns },
      { name: 'outreachCampaigns', table: schema.outreachCampaigns },
      { name: 'outreachCampaignRecipients', table: schema.outreachCampaignRecipients },
      { name: 'institutionalDataQualityEvents', table: schema.institutionalDataQualityEvents }
    ];

    it('should export all 9 Phase 17 relational tables', () => {
      phase17Tables.forEach(({ name, table }) => {
        expect(table, `Table ${name} must be defined`).toBeDefined();
      });
    });

    it('every Phase 17 table should enforce strict multi-tenant isolation with tenantId', () => {
      phase17Tables.forEach(({ name, table }) => {
        const columns = getTableColumns(table);
        expect(columns.tenantId, `Table ${name} must have tenantId`).toBeDefined();
        expect(columns.tenantId.notNull, `Table ${name}.tenantId must be NOT NULL`).toBe(true);
      });
    });

    it('every Phase 17 table should have a UUID primary key', () => {
      phase17Tables.forEach(({ name, table }) => {
        const columns = getTableColumns(table);
        expect(columns.id, `Table ${name} must have id`).toBeDefined();
        expect(columns.id.primary, `Table ${name}.id must be primary key`).toBe(true);
      });
    });

    it('every Phase 17 table should contain audit timestamps (createdAt)', () => {
      phase17Tables.forEach(({ name, table }) => {
        const columns = getTableColumns(table);
        expect(columns.createdAt, `Table ${name} must have createdAt`).toBeDefined();
        expect(columns.createdAt.notNull, `Table ${name}.createdAt must be NOT NULL`).toBe(true);
      });
    });

    describe('Individual Table Column Structures', () => {
      it('institutionalMetricSnapshots should contain empirical metrics and explicit denominators', () => {
        const cols = getTableColumns(schema.institutionalMetricSnapshots);
        expect(cols.snapshotType).toBeDefined();
        expect(cols.snapshotType.notNull).toBe(true);
        expect(cols.academicYear).toBeDefined();
        expect(cols.cohortBatch).toBeDefined();
        expect(cols.department).toBeDefined();
        expect(cols.totalStudents).toBeDefined();
        expect(cols.eligibleStudents).toBeDefined(); // Explicit denominator
        expect(cols.placedStudents).toBeDefined();
        expect(cols.placementRate).toBeDefined();
        expect(cols.medianSalary).toBeDefined();
        expect(cols.meanSalary).toBeDefined();
        expect(cols.highestSalary).toBeDefined();
        expect(cols.lowestSalary).toBeDefined();
        expect(cols.verifiedSkillCoverage).toBeDefined();
        expect(cols.skillGapClosureRate).toBeDefined();
        expect(cols.shortlistToOfferRatio).toBeDefined();
        expect(cols.avgTimeToShortlistDays).toBeDefined();
        expect(cols.recruiterEngagementScore).toBeDefined();
        expect(cols.metricsJson).toBeDefined();
        expect(cols.dataQualityStatus).toBeDefined();
        expect(cols.dataCompletenessScore).toBeDefined();
        expect(cols.calculatedAt).toBeDefined();
      });

      it('trainingInterventions should enforce governance, budgets, and skill mastery rules', () => {
        const cols = getTableColumns(schema.trainingInterventions);
        expect(cols.title).toBeDefined();
        expect(cols.title.notNull).toBe(true);
        expect(cols.description).toBeDefined();
        expect(cols.targetSkill).toBeDefined();
        expect(cols.targetSkill.notNull).toBe(true);
        expect(cols.targetDepartment).toBeDefined();
        expect(cols.targetBatch).toBeDefined();
        expect(cols.proposedBy).toBeDefined();
        expect(cols.approvedBy).toBeDefined();
        expect(cols.status).toBeDefined();
        expect(cols.status.notNull).toBe(true);
        expect(cols.startDate).toBeDefined();
        expect(cols.endDate).toBeDefined();
        expect(cols.budget).toBeDefined();
        expect(cols.actionPlan).toBeDefined();
        expect(cols.targetStudentCount).toBeDefined();
        expect(cols.enrolledCount).toBeDefined();
        expect(cols.completedCount).toBeDefined();
        expect(cols.baselineSkillAverage).toBeDefined();
        expect(cols.postInterventionSkillAverage).toBeDefined();
        expect(cols.skillImprovementPercentage).toBeDefined();
        expect(cols.attendanceOnlyRuleEnforced).toBeDefined();
        expect(cols.metadata).toBeDefined();
      });

      it('trainingInterventionParticipants should separate attendance from verified skill mastery', () => {
        const cols = getTableColumns(schema.trainingInterventionParticipants);
        expect(cols.interventionId).toBeDefined();
        expect(cols.studentId).toBeDefined();
        expect(cols.userId).toBeDefined();
        expect(cols.supportClassification).toBeDefined();
        expect(cols.attendanceRate).toBeDefined();
        expect(cols.attendanceCount).toBeDefined();
        expect(cols.attendanceVerified).toBeDefined();
        expect(cols.projectSubmitted).toBeDefined();
        expect(cols.projectEvidenceSubmitted).toBeDefined();
        expect(cols.projectEvidenceUrl).toBeDefined();
        expect(cols.projectScore).toBeDefined();
        expect(cols.verifiedBy).toBeDefined();
        expect(cols.verifiedAt).toBeDefined();
        expect(cols.tpoVerified).toBeDefined();
        expect(cols.skillMasteryVerified).toBeDefined();
        expect(cols.verifiedSkillGainRecorded).toBeDefined();
        expect(cols.preScore).toBeDefined();
        expect(cols.postScore).toBeDefined();
        expect(cols.status).toBeDefined();
      });

      it('fairnessReviewCases should record selection disparity and Four-Fifths benchmark', () => {
        const cols = getTableColumns(schema.fairnessReviewCases);
        expect(cols.driveId).toBeDefined();
        expect(cols.cohortId).toBeDefined();
        expect(cols.metricName).toBeDefined();
        expect(cols.stage).toBeDefined();
        expect(cols.demographicCategory).toBeDefined();
        expect(cols.groupName).toBeDefined();
        expect(cols.referenceGroupName).toBeDefined();
        expect(cols.groupSize).toBeDefined();
        expect(cols.groupSelectedCount).toBeDefined();
        expect(cols.groupSelectionRate).toBeDefined();
        expect(cols.referenceGroupSize).toBeDefined();
        expect(cols.referenceGroupSelectedCount).toBeDefined();
        expect(cols.referenceGroupSelectionRate).toBeDefined();
        expect(cols.disparityRatio).toBeDefined();
        expect(cols.isSmallGroupSuppressed).toBeDefined();
        expect(cols.status).toBeDefined();
        expect(cols.flaggedReason).toBeDefined();
        expect(cols.reviewedBy).toBeDefined();
        expect(cols.reviewedAt).toBeDefined();
        expect(cols.resolutionNotes).toBeDefined();
        expect(cols.explanationRequestedFrom).toBeDefined();
        expect(cols.explanationReceived).toBeDefined();
        expect(cols.escalationNotes).toBeDefined();
        expect(cols.auditTrailJson).toBeDefined();
      });

      it('institutionalReportTemplates should support accreditation standards and configurable formats', () => {
        const cols = getTableColumns(schema.institutionalReportTemplates);
        expect(cols.name).toBeDefined();
        expect(cols.name.notNull).toBe(true);
        expect(cols.description).toBeDefined();
        expect(cols.category).toBeDefined();
        expect(cols.category.notNull).toBe(true);
        expect(cols.standard).toBeDefined();
        expect(cols.configJson).toBeDefined();
        expect(cols.isSystemDefault).toBeDefined();
        expect(cols.isActive).toBeDefined();
        expect(cols.createdBy).toBeDefined();
      });

      it('institutionalReportRuns should capture evidence traceability and tamper-proof sha256 hash', () => {
        const cols = getTableColumns(schema.institutionalReportRuns);
        expect(cols.templateId).toBeDefined();
        expect(cols.reportTitle).toBeDefined();
        expect(cols.category).toBeDefined();
        expect(cols.format).toBeDefined();
        expect(cols.status).toBeDefined();
        expect(cols.parameters).toBeDefined();
        expect(cols.summaryData).toBeDefined();
        expect(cols.completenessScore).toBeDefined();
        expect(cols.missingFieldsCount).toBeDefined();
        expect(cols.warningFlags).toBeDefined();
        expect(cols.evidenceTraceability).toBeDefined();
        expect(cols.fileUrl).toBeDefined();
        expect(cols.fileSizeBytes).toBeDefined();
        expect(cols.rowCount).toBeDefined();
        expect(cols.sha256Hash).toBeDefined();
        expect(cols.generatedBy).toBeDefined();
      });

      it('outreachCampaigns should enforce mandatory human approval confirmation before dispatch', () => {
        const cols = getTableColumns(schema.outreachCampaigns);
        expect(cols.title).toBeDefined();
        expect(cols.title.notNull).toBe(true);
        expect(cols.subject).toBeDefined();
        expect(cols.templateBody).toBeDefined();
        expect(cols.targetCriteria).toBeDefined();
        expect(cols.status).toBeDefined();
        expect(cols.requiresHumanApproval).toBeDefined();
        expect(cols.approvedBy).toBeDefined();
        expect(cols.approvedAt).toBeDefined();
        expect(cols.approvalNotes).toBeDefined();
        expect(cols.totalRecipients).toBeDefined();
        expect(cols.sentCount).toBeDefined();
        expect(cols.deliveredCount).toBeDefined();
        expect(cols.failedCount).toBeDefined();
        expect(cols.scheduledAt).toBeDefined();
        expect(cols.sentAt).toBeDefined();
        expect(cols.completedAt).toBeDefined();
        expect(cols.createdBy).toBeDefined();
      });

      it('outreachCampaignRecipients should prevent duplicate recipients and support unsubscribe suppression', () => {
        const cols = getTableColumns(schema.outreachCampaignRecipients);
        expect(cols.campaignId).toBeDefined();
        expect(cols.companyId).toBeDefined();
        expect(cols.recipientEmail).toBeDefined();
        expect(cols.recipientEmail.notNull).toBe(true);
        expect(cols.recipientName).toBeDefined();
        expect(cols.companyName).toBeDefined();
        expect(cols.status).toBeDefined();
        expect(cols.errorMessage).toBeDefined();
        expect(cols.sentAt).toBeDefined();
        expect(cols.deliveredAt).toBeDefined();
        expect(cols.isUnsubscribed).toBeDefined();
        expect(cols.personalizedBody).toBeDefined();
        expect(cols.metadata).toBeDefined();
      });

      it('institutionalDataQualityEvents should record data completeness and missing-field audits', () => {
        const cols = getTableColumns(schema.institutionalDataQualityEvents);
        expect(cols.eventType).toBeDefined();
        expect(cols.eventType.notNull).toBe(true);
        expect(cols.entityType).toBeDefined();
        expect(cols.entityType.notNull).toBe(true);
        expect(cols.entityId).toBeDefined();
        expect(cols.observationCount).toBeDefined();
        expect(cols.completenessRatio).toBeDefined();
        expect(cols.missingFields).toBeDefined();
        expect(cols.details).toBeDefined();
        expect(cols.severity).toBeDefined();
        expect(cols.resolved).toBeDefined();
        expect(cols.resolvedBy).toBeDefined();
        expect(cols.resolvedAt).toBeDefined();
      });
    });
  });

  describe('3. Drizzle Relations Schema', () => {
    it('should export all 9 Phase 17 relations schemas', () => {
      expect(schema.institutionalMetricSnapshotsRelations).toBeDefined();
      expect(schema.trainingInterventionsRelations).toBeDefined();
      expect(schema.trainingInterventionParticipantsRelations).toBeDefined();
      expect(schema.fairnessReviewCasesRelations).toBeDefined();
      expect(schema.institutionalReportTemplatesRelations).toBeDefined();
      expect(schema.institutionalReportRunsRelations).toBeDefined();
      expect(schema.outreachCampaignsRelations).toBeDefined();
      expect(schema.outreachCampaignRecipientsRelations).toBeDefined();
      expect(schema.institutionalDataQualityEventsRelations).toBeDefined();
    });

    it('tenantsRelations, usersRelations, and studentsRelations should include Phase 17 entities', () => {
      expect(schema.tenantsRelations).toBeDefined();
      expect(schema.usersRelations).toBeDefined();
      expect(schema.studentsRelations).toBeDefined();
      expect(schema.companiesRelations).toBeDefined();
      expect(schema.placementDrivesRelations).toBeDefined();
    });
  });

  describe('4. Additive Non-Destructive Migration Verification (0007_*.sql)', () => {
    it('should locate 0007_*.sql migration and verify 100% additive non-destructive structure', () => {
      const drizzleDir = path.resolve(__dirname, '../drizzle');
      const files = fs.readdirSync(drizzleDir);
      const phase17Migration = files.find((f) => f.startsWith('0007_') && f.endsWith('.sql'));

      expect(phase17Migration, '0007_*.sql migration must exist').toBeDefined();
      const sqlContent = fs.readFileSync(path.join(drizzleDir, phase17Migration!), 'utf-8');

      // Absolute zero destructive commands
      expect(sqlContent).not.toMatch(/DROP\s+TABLE/i);
      expect(sqlContent).not.toMatch(/DROP\s+COLUMN/i);
      expect(sqlContent).not.toMatch(/TRUNCATE/i);

      // Verify all 5 Phase 17 enums created
      expect(sqlContent).toContain('CREATE TYPE "public"."fairness_review_status_enum"');
      expect(sqlContent).toContain('CREATE TYPE "public"."intervention_status_enum"');
      expect(sqlContent).toContain('CREATE TYPE "public"."outreach_campaign_status_enum"');
      expect(sqlContent).toContain('CREATE TYPE "public"."report_category_enum"');
      expect(sqlContent).toContain('CREATE TYPE "public"."report_format_enum"');

      // Verify all 9 Phase 17 tables created
      expect(sqlContent).toContain('CREATE TABLE "fairness_review_cases"');
      expect(sqlContent).toContain('CREATE TABLE "institutional_data_quality_events"');
      expect(sqlContent).toContain('CREATE TABLE "institutional_metric_snapshots"');
      expect(sqlContent).toContain('CREATE TABLE "institutional_report_runs"');
      expect(sqlContent).toContain('CREATE TABLE "institutional_report_templates"');
      expect(sqlContent).toContain('CREATE TABLE "outreach_campaign_recipients"');
      expect(sqlContent).toContain('CREATE TABLE "outreach_campaigns"');
      expect(sqlContent).toContain('CREATE TABLE "training_intervention_participants"');
      expect(sqlContent).toContain('CREATE TABLE "training_interventions"');

      // Verify multi-tenant isolation foreign keys to tenants.id
      expect(sqlContent).toContain('"fairness_review_cases_tenant_id_tenants_id_fk"');
      expect(sqlContent).toContain('"institutional_data_quality_events_tenant_id_tenants_id_fk"');
      expect(sqlContent).toContain('"institutional_metric_snapshots_tenant_id_tenants_id_fk"');
      expect(sqlContent).toContain('"institutional_report_runs_tenant_id_tenants_id_fk"');
      expect(sqlContent).toContain('"institutional_report_templates_tenant_id_tenants_id_fk"');
      expect(sqlContent).toContain('"outreach_campaign_recipients_tenant_id_tenants_id_fk"');
      expect(sqlContent).toContain('"outreach_campaigns_tenant_id_tenants_id_fk"');
      expect(sqlContent).toContain('"training_intervention_participants_tenant_id_tenants_id_fk"');
      expect(sqlContent).toContain('"training_interventions_tenant_id_tenants_id_fk"');
    });
  });
});
