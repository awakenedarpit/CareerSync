import { z } from 'zod';

/**
 * Contract 2: Industry Skill-Gap Agent -> Learning Intelligence Agent
 * Validates cross-agent handoff of identified skill gaps to generate personalized
 * learning pathways, tasks, and adaptive practice recommendations.
 */

export const SkillGapToLearningInputSchema = z.object({
  targetRole: z.string().min(1, 'Target role is required'),
  skillRequirements: z.array(
    z.object({
      skillName: z.string().min(1),
      requiredProficiency: z.string().min(1)
    })
  ).min(1, 'At least one skill requirement is required'),
  studentSkillProfile: z.object({
    verifiedSkills: z.array(z.string()),
    gapSkills: z.array(z.string())
  }),
  assessmentResults: z.array(
    z.object({
      assessmentType: z.string(),
      score: z.number().min(0).max(100),
      evaluatedAt: z.string().or(z.date()).optional()
    })
  ).optional().default([])
});

export const SkillGapToLearningOutputSchema = z.object({
  recommendedTasks: z.array(
    z.object({
      taskId: z.string(),
      title: z.string().min(1),
      skillTarget: z.string().min(1),
      taskType: z.string(),
      estimatedHours: z.number().min(0),
      priority: z.enum(['HIGH', 'MEDIUM', 'LOW'])
    })
  ).min(1, 'At least one recommended learning task must be returned'),
  priority: z.enum(['HIGH', 'MEDIUM', 'LOW']),
  expectedOutcome: z.string().min(1),
  reason: z.string().min(1)
});

export type SkillGapToLearningInput = z.infer<typeof SkillGapToLearningInputSchema>;
export type SkillGapToLearningOutput = z.infer<typeof SkillGapToLearningOutputSchema>;
