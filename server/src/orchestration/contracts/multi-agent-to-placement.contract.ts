import { z } from 'zod';

/**
 * Contract 4: Multi-Agent Collective Synthesis -> Placement Orchestration Agent
 * Validates cross-agent synthesis of job requirements, academic filters, skill match percentages,
 * explicit student consent, and institutional TPO governance state.
 */

export const MultiAgentToPlacementInputSchema = z.object({
  jobRequirements: z.object({
    jobId: z.string().uuid({ message: 'jobId must be a valid UUID' }),
    title: z.string().min(1, 'Job title is required'),
    requiredSkills: z.array(z.string()).min(1, 'At least one required skill must be specified'),
    minCgpa: z.number().min(0).max(10).optional().default(0),
    allowedBranches: z.array(z.string()).optional().default([])
  }),
  administrativeCriteria: z.object({
    attendancePercentage: z.number().min(0).max(100),
    feeClearance: z.boolean(),
    disciplinaryClearance: z.boolean()
  }),
  skillMatches: z.array(
    z.object({
      studentId: z.string().uuid(),
      matchedSkillCount: z.number().min(0),
      totalSkillsRequired: z.number().min(1),
      matchPercentage: z.number().min(0).max(100)
    })
  ),
  studentConsent: z.boolean(),
  tpoApprovalState: z.object({
    isApproved: z.boolean(),
    approvedBy: z.string().optional(),
    approvedAt: z.string().or(z.date()).optional()
  })
});

export const MultiAgentToPlacementOutputSchema = z.object({
  candidateMatches: z.array(
    z.object({
      studentId: z.string().uuid(),
      matchScore: z.number().min(0).max(100),
      rank: z.number().int().positive()
    })
  ),
  eligibilityResult: z.object({
    isEligible: z.boolean(),
    rejectionReasons: z.array(z.string()).default([])
  }),
  reviewRequiredStatus: z.boolean(),
  auditRefs: z.array(z.string()).default([])
});

export type MultiAgentToPlacementInput = z.infer<typeof MultiAgentToPlacementInputSchema>;
export type MultiAgentToPlacementOutput = z.infer<typeof MultiAgentToPlacementOutputSchema>;
