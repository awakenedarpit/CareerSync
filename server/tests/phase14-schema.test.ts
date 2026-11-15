import { describe, it, expect } from 'vitest';
import { getTableColumns } from 'drizzle-orm';
import fs from 'fs';
import path from 'path';
import * as schema from '../src/db/schema';

describe('Phase 14 Schema Extensions (Predictive Placement Analytics Engine)', () => {
  describe('1. Authoritative Domain Enums', () => {
    it('should export readinessClassificationEnum with 4 tiers', () => {
      expect(schema.readinessClassificationEnum).toBeDefined();
      expect(schema.readinessClassificationEnum.enumValues).toEqual([
        'HIGH_READINESS',
        'MODERATE_READINESS',
        'DEVELOPING_READINESS',
        'INSUFFICIENT_DATA'
      ]);
    });

    it('should export predictionTargetEnum with 4 prediction targets', () => {
      expect(schema.predictionTargetEnum).toBeDefined();
      expect(schema.predictionTargetEnum.enumValues).toEqual([
        'SHORTLIST_PROGRESSION',
        'INTERVIEW_COMPLETION',
        'OFFER_CONVERSION',
        'COHORT_OUTCOME'
      ]);
    });

    it('should export predictionModelTypeEnum with 5 model families', () => {
      expect(schema.predictionModelTypeEnum).toBeDefined();
      expect(schema.predictionModelTypeEnum.enumValues).toEqual([
        'LOGISTIC_REGRESSION',
        'DECISION_TREE',
        'HISTORICAL_CONVERSION',
        'CALIBRATED_PROBABILITY',
        'INSUFFICIENT_DATA_BASELINE'
      ]);
    });

    it('should export studentSupportCategoryEnum with 7 supportive diagnostic categories', () => {
      expect(schema.studentSupportCategoryEnum).toBeDefined();
      expect(schema.studentSupportCategoryEnum.enumValues).toEqual([
        'SKILL_DEVELOPMENT',
        'ASSESSMENT_PRACTICE',
        'PROJECT_GUIDANCE',
        'PROFILE_COMPLETION',
        'INTERVIEW_PREPARATION',
        'ADDITIONAL_REVIEW',
        'INSUFFICIENT_DATA'
      ]);
    });

    it('should export supportInterventionStatusEnum with 6 review lifecycle statuses', () => {
      expect(schema.supportInterventionStatusEnum).toBeDefined();
      expect(schema.supportInterventionStatusEnum.enumValues).toEqual([
        'IDENTIFIED',
        'UNDER_TPO_REVIEW',
        'APPROVED',
        'IN_PROGRESS',
        'RESOLVED',
        'DISMISSED'
      ]);
    });

    it('should export interventionPriorityEnum with 4 priority levels', () => {
      expect(schema.interventionPriorityEnum).toBeDefined();
      expect(schema.interventionPriorityEnum.enumValues).toEqual([
        'CRITICAL',
        'HIGH',
        'MEDIUM',
        'LOW'
      ]);
    });

    it('should export forecastMethodEnum with 5 forecasting methods', () => {
      expect(schema.forecastMethodEnum).toBeDefined();
      expect(schema.forecastMethodEnum.enumValues).toEqual([
        'MOVING_AVERAGE',
        'HISTORICAL_AVERAGE',
        'LINEAR_TREND',
        'SEASONAL_TREND',
        'FORECAST_UNAVAILABLE'
      ]);
    });
  });

  describe('2. Table Structure & Multi-Tenant Isolation Guarantees', () => {
    it('placementPredictionRuns should define all required statistical training, metrics, and isolation fields', () => {
      expect(schema.placementPredictionRuns).toBeDefined();
      const cols = getTableColumns(schema.placementPredictionRuns);
      expect(cols.id).toBeDefined();
      expect(cols.tenantId).toBeDefined();
      expect(cols.runName).toBeDefined();
      expect(cols.target).toBeDefined();
      expect(cols.modelType).toBeDefined();
      expect(cols.status).toBeDefined();
      expect(cols.sampleSize).toBeDefined();
      expect(cols.trainingSplitRatio).toBeDefined();
      expect(cols.accuracy).toBeDefined();
      expect(cols.precision).toBeDefined();
      expect(cols.recall).toBeDefined();
      expect(cols.f1Score).toBeDefined();
      expect(cols.brierScore).toBeDefined();
      expect(cols.confusionMatrixJson).toBeDefined();
      expect(cols.featureWeightsJson).toBeDefined();
      expect(cols.hyperparametersJson).toBeDefined();
      expect(cols.executedBy).toBeDefined();
      expect(cols.notes).toBeDefined();
      expect(cols.createdAt).toBeDefined();
      expect(cols.updatedAt).toBeDefined();
    });

    it('studentReadinessHistory should define multidimensional breakdown and missing data fields', () => {
      expect(schema.studentReadinessHistory).toBeDefined();
      const cols = getTableColumns(schema.studentReadinessHistory);
      expect(cols.id).toBeDefined();
      expect(cols.tenantId).toBeDefined();
      expect(cols.studentId).toBeDefined();
      expect(cols.readinessClassification).toBeDefined();
      expect(cols.overallScore).toBeDefined();
      expect(cols.academicScore).toBeDefined();
      expect(cols.technicalSkillScore).toBeDefined();
      expect(cols.assessmentScore).toBeDefined();
      expect(cols.interviewScore).toBeDefined();
      expect(cols.profileCompletenessScore).toBeDefined();
      expect(cols.verifiedEvidenceCount).toBeDefined();
      expect(cols.missingDataFlagsJson).toBeDefined();
      expect(cols.factorsBreakdownJson).toBeDefined();
      expect(cols.evaluationDate).toBeDefined();
      expect(cols.evaluatedBy).toBeDefined();
      expect(cols.createdAt).toBeDefined();
    });

    it('placementPredictions should define confidence bounds, model attribution, and ethical safeguards', () => {
      expect(schema.placementPredictions).toBeDefined();
      const cols = getTableColumns(schema.placementPredictions);
      expect(cols.id).toBeDefined();
      expect(cols.tenantId).toBeDefined();
      expect(cols.studentId).toBeDefined();
      expect(cols.driveId).toBeDefined();
      expect(cols.probabilityScore).toBeDefined();
      expect(cols.riskTier).toBeDefined();
      expect(cols.contributingFactorsJson).toBeDefined();
      expect(cols.isAdvisoryOnly).toBeDefined();
      expect(cols.runId).toBeDefined();
      expect(cols.predictionTarget).toBeDefined();
      expect(cols.predictedProbability).toBeDefined();
      expect(cols.confidenceIntervalLower).toBeDefined();
      expect(cols.confidenceIntervalUpper).toBeDefined();
      expect(cols.readinessClassification).toBeDefined();
      expect(cols.modelUsed).toBeDefined();
      expect(cols.dataCoverageScore).toBeDefined();
      expect(cols.limitationsNotes).toBeDefined();
      expect(cols.isInsufficientData).toBeDefined();
      expect(cols.createdAt).toBeDefined();
      expect(cols.updatedAt).toBeDefined();
    });

    it('studentSupportRecommendations should define diagnostic categories, evidence, and review workflow', () => {
      expect(schema.studentSupportRecommendations).toBeDefined();
      const cols = getTableColumns(schema.studentSupportRecommendations);
      expect(cols.id).toBeDefined();
      expect(cols.tenantId).toBeDefined();
      expect(cols.studentId).toBeDefined();
      expect(cols.category).toBeDefined();
      expect(cols.priority).toBeDefined();
      expect(cols.status).toBeDefined();
      expect(cols.title).toBeDefined();
      expect(cols.supportRationale).toBeDefined();
      expect(cols.recommendedActionsJson).toBeDefined();
      expect(cols.evidenceJson).toBeDefined();
      expect(cols.reviewedBy).toBeDefined();
      expect(cols.reviewedAt).toBeDefined();
      expect(cols.reviewNotes).toBeDefined();
      expect(cols.createdAt).toBeDefined();
      expect(cols.updatedAt).toBeDefined();
    });

    it('tpoInterventionRecords should define actionable intervention plans, cohorts, and status tracking', () => {
      expect(schema.tpoInterventionRecords).toBeDefined();
      const cols = getTableColumns(schema.tpoInterventionRecords);
      expect(cols.id).toBeDefined();
      expect(cols.tenantId).toBeDefined();
      expect(cols.recommendationId).toBeDefined();
      expect(cols.studentId).toBeDefined();
      expect(cols.department).toBeDefined();
      expect(cols.batchYear).toBeDefined();
      expect(cols.title).toBeDefined();
      expect(cols.interventionType).toBeDefined();
      expect(cols.priority).toBeDefined();
      expect(cols.status).toBeDefined();
      expect(cols.scheduledDate).toBeDefined();
      expect(cols.completedDate).toBeDefined();
      expect(cols.actionNotes).toBeDefined();
      expect(cols.targetStudentCount).toBeDefined();
      expect(cols.assignedTo).toBeDefined();
      expect(cols.approvedBy).toBeDefined();
      expect(cols.createdAt).toBeDefined();
      expect(cols.updatedAt).toBeDefined();
    });

    it('placementForecastSnapshots should define projections, historical baselines, and uncertainty intervals', () => {
      expect(schema.placementForecastSnapshots).toBeDefined();
      const cols = getTableColumns(schema.placementForecastSnapshots);
      expect(cols.id).toBeDefined();
      expect(cols.tenantId).toBeDefined();
      expect(cols.forecastPeriod).toBeDefined();
      expect(cols.batchYear).toBeDefined();
      expect(cols.department).toBeDefined();
      expect(cols.forecastMethod).toBeDefined();
      expect(cols.projectedPlacementRate).toBeDefined();
      expect(cols.lowerBoundRate).toBeDefined();
      expect(cols.upperBoundRate).toBeDefined();
      expect(cols.projectedOfferCount).toBeDefined();
      expect(cols.historicalSampleSize).toBeDefined();
      expect(cols.parametersJson).toBeDefined();
      expect(cols.scenarioVariablesJson).toBeDefined();
      expect(cols.isForecastUnavailable).toBeDefined();
      expect(cols.forecastTimestamp).toBeDefined();
      expect(cols.generatedBy).toBeDefined();
      expect(cols.createdAt).toBeDefined();
    });

    it('analyticsSnapshots should define pre-aggregated cohort summaries and small-group suppression', () => {
      expect(schema.analyticsSnapshots).toBeDefined();
      const cols = getTableColumns(schema.analyticsSnapshots);
      expect(cols.id).toBeDefined();
      expect(cols.tenantId).toBeDefined();
      expect(cols.snapshotType).toBeDefined();
      expect(cols.batchYear).toBeDefined();
      expect(cols.department).toBeDefined();
      expect(cols.cohortSize).toBeDefined();
      expect(cols.isSuppressed).toBeDefined();
      expect(cols.metricsJson).toBeDefined();
      expect(cols.snapshotTimestamp).toBeDefined();
      expect(cols.capturedBy).toBeDefined();
      expect(cols.createdAt).toBeDefined();
    });

    it('analyticsAuditEvents should define immutable audit logging for model and governance decisions', () => {
      expect(schema.analyticsAuditEvents).toBeDefined();
      const cols = getTableColumns(schema.analyticsAuditEvents);
      expect(cols.id).toBeDefined();
      expect(cols.tenantId).toBeDefined();
      expect(cols.userId).toBeDefined();
      expect(cols.eventType).toBeDefined();
      expect(cols.targetResourceType).toBeDefined();
      expect(cols.targetResourceId).toBeDefined();
      expect(cols.detailsJson).toBeDefined();
      expect(cols.ipAddress).toBeDefined();
      expect(cols.userAgent).toBeDefined();
      expect(cols.createdAt).toBeDefined();
    });
  });

  describe('3. Drizzle Relations Architecture', () => {
    it('should define all Phase 14 relations linking tenants, students, users, and runs', () => {
      expect(schema.placementPredictionRunsRelations).toBeDefined();
      expect(schema.studentReadinessHistoryRelations).toBeDefined();
      expect(schema.placementPredictionsRelations).toBeDefined();
      expect(schema.studentSupportRecommendationsRelations).toBeDefined();
      expect(schema.tpoInterventionRecordsRelations).toBeDefined();
      expect(schema.placementForecastSnapshotsRelations).toBeDefined();
      expect(schema.analyticsSnapshotsRelations).toBeDefined();
      expect(schema.analyticsAuditEventsRelations).toBeDefined();
    });
  });

  describe('4. Non-Destructive Migration File Verification (0004_*.sql)', () => {
    it('should locate 0004_*.sql migration and verify 100% additive structure', () => {
      const drizzleDir = path.resolve(__dirname, '../drizzle');
      const files = fs.readdirSync(drizzleDir);
      const phase14Migration = files.find((f) => f.startsWith('0004_') && f.endsWith('.sql'));

      expect(phase14Migration).toBeDefined();
      const sqlContent = fs.readFileSync(path.join(drizzleDir, phase14Migration!), 'utf-8');

      // Zero destructive commands
      expect(sqlContent).not.toMatch(/DROP\s+TABLE/i);
      expect(sqlContent).not.toMatch(/DROP\s+COLUMN/i);
      expect(sqlContent).not.toMatch(/TRUNCATE/i);

      // Verify all 7 enums created
      expect(sqlContent).toContain('CREATE TYPE "public"."readiness_classification_enum"');
      expect(sqlContent).toContain('CREATE TYPE "public"."prediction_target_enum"');
      expect(sqlContent).toContain('CREATE TYPE "public"."prediction_model_type_enum"');
      expect(sqlContent).toContain('CREATE TYPE "public"."student_support_category_enum"');
      expect(sqlContent).toContain('CREATE TYPE "public"."support_intervention_status_enum"');
      expect(sqlContent).toContain('CREATE TYPE "public"."intervention_priority_enum"');
      expect(sqlContent).toContain('CREATE TYPE "public"."forecast_method_enum"');

      // Verify all Phase 14 tables created
      expect(sqlContent).toContain('CREATE TABLE "placement_prediction_runs"');
      expect(sqlContent).toContain('CREATE TABLE "student_readiness_history"');
      expect(sqlContent).toContain('CREATE TABLE "student_support_recommendations"');
      expect(sqlContent).toContain('CREATE TABLE "tpo_intervention_records"');
      expect(sqlContent).toContain('CREATE TABLE "placement_forecast_snapshots"');
      expect(sqlContent).toContain('CREATE TABLE "analytics_snapshots"');
      expect(sqlContent).toContain('CREATE TABLE "analytics_audit_events"');

      // Verify placement_predictions table extended non-destructively
      expect(sqlContent).toContain('ALTER TABLE "placement_predictions" ADD COLUMN "run_id" uuid');
      expect(sqlContent).toContain('ALTER TABLE "placement_predictions" ADD COLUMN "prediction_target"');
      expect(sqlContent).toContain('ALTER TABLE "placement_predictions" ADD COLUMN "predicted_probability"');
      expect(sqlContent).toContain('ALTER TABLE "placement_predictions" ADD COLUMN "confidence_interval_lower"');
      expect(sqlContent).toContain('ALTER TABLE "placement_predictions" ADD COLUMN "confidence_interval_upper"');
      expect(sqlContent).toContain('ALTER TABLE "placement_predictions" ADD COLUMN "readiness_classification"');
      expect(sqlContent).toContain('ALTER TABLE "placement_predictions" ADD COLUMN "model_used"');
      expect(sqlContent).toContain('ALTER TABLE "placement_predictions" ADD COLUMN "data_coverage_score"');
      expect(sqlContent).toContain('ALTER TABLE "placement_predictions" ADD COLUMN "limitations_notes"');
      expect(sqlContent).toContain('ALTER TABLE "placement_predictions" ADD COLUMN "is_insufficient_data"');

      // Verify multi-tenant isolation foreign keys
      expect(sqlContent).toContain('"placement_prediction_runs_tenant_id_tenants_id_fk"');
      expect(sqlContent).toContain('"student_readiness_history_tenant_id_tenants_id_fk"');
      expect(sqlContent).toContain('"student_support_recommendations_tenant_id_tenants_id_fk"');
      expect(sqlContent).toContain('"tpo_intervention_records_tenant_id_tenants_id_fk"');
      expect(sqlContent).toContain('"placement_forecast_snapshots_tenant_id_tenants_id_fk"');
      expect(sqlContent).toContain('"analytics_snapshots_tenant_id_tenants_id_fk"');
      expect(sqlContent).toContain('"analytics_audit_events_tenant_id_tenants_id_fk"');
    });
  });
});
