import { z } from 'zod';

/**
 * Contract 3: Profiling + Mock Assessments -> Predictive Analytics Agent
 * Validates synthesized student profile, verified skills, and mock drive assessment outcomes
 * to compute multi-factor placement readiness and forecast indicators.
 */

export const ProfilingAssessmentsToPredictiveInputSchema = z.object({
  verifiedSkills: z.array(
    z.object({
      skillName: z.string().min(1),
      proficiency: z.string().min(1)
    })
  ).default([]),
  evidenceCoverage: z.number().min(0).max(1),
  assessmentResults: z.array(
    z.object({
      assessmentType: z.string(),
      score: z.number().min(0).max(100),
      completedAt: z.string().or(z.date())
    })
  ).default([]),
  historicalOutcomes: z.array(
    z.object({
      driveType: z.string(),
      outcome: z.string()
    })
  ).optional().default([])
});

export const ProfilingAssessmentsToPredictiveOutputSchema = z.object({
  readinessIndicators: z.object({
    technicalScore: z.number().min(0).max(100),
    softSkillScore: z.number().min(0).max(100),
    overallReadiness: z.number().min(0).max(100),
    readinessClassification: z.enum([
      'HIGH_READINESS',
      'MODERATE_READINESS',
      'DEVELOPING_READINESS',
      'INSUFFICIENT_DATA'
    ])
  }),
  performanceTrends: z.array(
    z.object({
      period: z.string(),
      score: z.number(),
      metric: z.string()
    })
  ).default([]),
  supportRecommendations: z.array(
    z.object({
      category: z.string(),
      priority: z.enum(['CRITICAL', 'HIGH', 'MEDIUM', 'LOW']).or(z.string()),
      notes: z.string()
    })
  ).default([]),
  predictionAvailability: z.boolean()
});

export type ProfilingAssessmentsToPredictiveInput = z.infer<
  typeof ProfilingAssessmentsToPredictiveInputSchema
>;
export type ProfilingAssessmentsToPredictiveOutput = z.infer<
  typeof ProfilingAssessmentsToPredictiveOutputSchema
>;
