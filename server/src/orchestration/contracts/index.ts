import {
  ProfilingToSkillGapInputSchema,
  ProfilingToSkillGapOutputSchema,
  type ProfilingToSkillGapInput,
  type ProfilingToSkillGapOutput
} from './profiling-to-skill-gap.contract';

import {
  SkillGapToLearningInputSchema,
  SkillGapToLearningOutputSchema,
  type SkillGapToLearningInput,
  type SkillGapToLearningOutput
} from './skill-gap-to-learning.contract';

import {
  ProfilingAssessmentsToPredictiveInputSchema,
  ProfilingAssessmentsToPredictiveOutputSchema,
  type ProfilingAssessmentsToPredictiveInput,
  type ProfilingAssessmentsToPredictiveOutput
} from './profiling-assessments-to-predictive.contract';

import {
  MultiAgentToPlacementInputSchema,
  MultiAgentToPlacementOutputSchema,
  type MultiAgentToPlacementInput,
  type MultiAgentToPlacementOutput
} from './multi-agent-to-placement.contract';

export * from './profiling-to-skill-gap.contract';
export * from './skill-gap-to-learning.contract';
export * from './profiling-assessments-to-predictive.contract';
export * from './multi-agent-to-placement.contract';

/**
 * Validation helper functions for contracts
 */
export function validateProfilingToSkillGapInput(data: unknown): ProfilingToSkillGapInput {
  return ProfilingToSkillGapInputSchema.parse(data);
}

export function validateProfilingToSkillGapOutput(data: unknown): ProfilingToSkillGapOutput {
  return ProfilingToSkillGapOutputSchema.parse(data);
}

export function validateSkillGapToLearningInput(data: unknown): SkillGapToLearningInput {
  return SkillGapToLearningInputSchema.parse(data);
}

export function validateSkillGapToLearningOutput(data: unknown): SkillGapToLearningOutput {
  return SkillGapToLearningOutputSchema.parse(data);
}

export function validateProfilingAssessmentsToPredictiveInput(
  data: unknown
): ProfilingAssessmentsToPredictiveInput {
  return ProfilingAssessmentsToPredictiveInputSchema.parse(data);
}

export function validateProfilingAssessmentsToPredictiveOutput(
  data: unknown
): ProfilingAssessmentsToPredictiveOutput {
  return ProfilingAssessmentsToPredictiveOutputSchema.parse(data);
}

export function validateMultiAgentToPlacementInput(data: unknown): MultiAgentToPlacementInput {
  return MultiAgentToPlacementInputSchema.parse(data);
}

export function validateMultiAgentToPlacementOutput(data: unknown): MultiAgentToPlacementOutput {
  return MultiAgentToPlacementOutputSchema.parse(data);
}
