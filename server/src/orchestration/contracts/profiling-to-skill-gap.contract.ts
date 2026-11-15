import { z } from 'zod';

/**
 * Contract 1: Student Profiling Agent -> Industry Skill-Gap Agent
 * Validates cross-agent handoff of approved student profiles and verified skills
 * for market alignment and skill-gap identification.
 */

export const ProfilingToSkillGapInputSchema = z.object({
  studentId: z.string().uuid({ message: 'studentId must be a valid UUID' }),
  tenantId: z.string().uuid({ message: 'tenantId must be a valid UUID' }),
  approvedProfile: z.object({
    headline: z.string().min(1, 'Headline is required'),
    summary: z.string().optional().default(''),
    education: z.array(
      z.object({
        institution: z.string(),
        degree: z.string(),
        fieldOfStudy: z.string().optional(),
        cgpa: z.number().optional()
      })
    ).min(1, 'At least one education entry is required'),
    experience: z.array(z.record(z.any())).optional().default([]),
    projects: z.array(z.record(z.any())).optional().default([]),
    profileCompletenessScore: z.number().min(0).max(100)
  }),
  verifiedSkills: z.array(
    z.object({
      skillName: z.string().min(1),
      proficiency: z.enum(['BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'EXPERT']).or(z.string()),
      verifiedBy: z.string(),
      verifiedAt: z.string().or(z.date()),
      evidenceRefs: z.array(z.string()).default([])
    })
  ).min(1, 'At least one verified skill is required for skill gap analysis'),
  evidenceRefs: z.array(z.string()).default([]),
  targetRole: z.string().min(1, 'Target role is required')
});

export const ProfilingToSkillGapOutputSchema = z.object({
  matchedSkills: z.array(z.string()),
  missingEvidence: z.array(z.string()),
  skillGaps: z.array(
    z.object({
      skillName: z.string(),
      currentLevel: z.string().optional(),
      requiredLevel: z.string(),
      gapSeverity: z.enum(['CRITICAL', 'MODERATE', 'LOW'])
    })
  ),
  confidence: z.number().min(0).max(1),
  explanation: z.string().min(1)
});

export type ProfilingToSkillGapInput = z.infer<typeof ProfilingToSkillGapInputSchema>;
export type ProfilingToSkillGapOutput = z.infer<typeof ProfilingToSkillGapOutputSchema>;
