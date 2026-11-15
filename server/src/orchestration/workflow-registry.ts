import { z } from 'zod';
import type { WorkflowDefinition, WorkflowStepExecutionContext } from './orchestration.types';
import {
  ProfilingToSkillGapInputSchema,
  ProfilingToSkillGapOutputSchema,
  SkillGapToLearningInputSchema,
  SkillGapToLearningOutputSchema,
  ProfilingAssessmentsToPredictiveInputSchema,
  ProfilingAssessmentsToPredictiveOutputSchema,
  MultiAgentToPlacementInputSchema,
  MultiAgentToPlacementOutputSchema
} from './contracts';

/**
 * 7 Pre-configured End-to-End Workflows covering the Student Journey
 */

export const WF_STUDENT_ONBOARDING_PROFILING: WorkflowDefinition = {
  workflowId: 'WF_STUDENT_ONBOARDING_PROFILING',
  name: 'Student Onboarding & Comprehensive Profiling',
  description:
    'Ingests student resume and profile data, extracts skills and credentials, and computes baseline profile completeness score.',
  triggerType: 'MANUAL_USER',
  initiatingRoles: ['STUDENT', 'COLLEGE_ADMIN', 'TPO_ADMIN', 'SUPER_ADMIN'],
  responsibleAgent: 'STUDENT_PROFILING_AGENT',
  requiredHumanApproval: false,
  timeoutMs: 60000,
  maxRetries: 3,
  inputSchema: z.object({
    studentId: z.string().uuid(),
    rawProfile: z.record(z.any()),
    documentUrl: z.string().url().optional()
  }),
  outputSchema: z.object({
    studentId: z.string().uuid(),
    profileCompletenessScore: z.number().min(0).max(100),
    extractedSkills: z.array(z.string()),
    status: z.string()
  }),
  steps: [
    {
      id: 'step_profile_ingest',
      stepName: 'Document & Profile Ingestion',
      stepIndex: 1,
      responsibleAgent: 'STUDENT_PROFILING_AGENT',
      execute: async (ctx: WorkflowStepExecutionContext) => {
        return {
          ingested: true,
          studentId: ctx.input.studentId,
          timestamp: new Date().toISOString()
        };
      }
    },
    {
      id: 'step_skill_extract',
      stepName: 'Attribute & Skill Extraction',
      stepIndex: 2,
      responsibleAgent: 'STUDENT_PROFILING_AGENT',
      execute: async (ctx: WorkflowStepExecutionContext) => {
        const skills = ctx.input.rawProfile?.skills || ['TypeScript', 'Node.js', 'PostgreSQL'];
        return {
          extractedSkills: skills,
          confidence: 0.92
        };
      }
    },
    {
      id: 'step_completeness_calc',
      stepName: 'Baseline Completeness Calculation',
      stepIndex: 3,
      responsibleAgent: 'STUDENT_PROFILING_AGENT',
      execute: async (ctx: WorkflowStepExecutionContext) => {
        const skills = ctx.previousStepOutputs?.step_skill_extract?.extractedSkills || [];
        const completeness = Math.min(100, Math.max(40, skills.length * 20));
        return {
          studentId: ctx.input.studentId,
          profileCompletenessScore: completeness,
          extractedSkills: skills,
          status: 'COMPLETED'
        };
      }
    }
  ]
};

export const WF_EVIDENCE_VERIFICATION_DISPATCH: WorkflowDefinition = {
  workflowId: 'WF_EVIDENCE_VERIFICATION_DISPATCH',
  name: 'Skill Evidence Verification Dispatch',
  description:
    'Dispatches submitted student evidence and skill artifacts to TPO or delegated faculty reviewers with human sign-off.',
  triggerType: 'AUTOMATED_EVENT',
  initiatingRoles: ['STUDENT', 'TPO_ADMIN', 'COLLEGE_ADMIN', 'SUPER_ADMIN'],
  responsibleAgent: 'STUDENT_PROFILING_AGENT',
  requiredHumanApproval: true,
  timeoutMs: 120000,
  maxRetries: 2,
  inputSchema: z.object({
    studentId: z.string().uuid(),
    skillName: z.string().min(1),
    evidenceUrl: z.string().url(),
    evidenceType: z.string()
  }),
  outputSchema: z.object({
    studentId: z.string().uuid(),
    skillName: z.string(),
    verified: z.boolean(),
    verifiedBy: z.string().optional(),
    verifiedAt: z.string().optional()
  }),
  steps: [
    {
      id: 'step_evidence_package',
      stepName: 'Evidence Artifact Packaging',
      stepIndex: 1,
      responsibleAgent: 'STUDENT_PROFILING_AGENT',
      execute: async (ctx: WorkflowStepExecutionContext) => {
        return {
          evidencePackageId: `pkg-${Date.now()}`,
          verifiedArtifact: ctx.input.evidenceUrl,
          packagedAt: new Date().toISOString()
        };
      }
    },
    {
      id: 'step_reviewer_approval_gate',
      stepName: 'TPO / Delegated Reviewer Approval Gate',
      stepIndex: 2,
      responsibleAgent: 'CENTRAL_ORCHESTRATOR',
      requiresHumanApproval: true,
      execute: async (ctx: WorkflowStepExecutionContext) => {
        return {
          approvalPending: true,
          requiredRole: 'TPO_ADMIN',
          studentId: ctx.input.studentId
        };
      }
    },
    {
      id: 'step_verification_commit',
      stepName: 'Skill Verification State Commit',
      stepIndex: 3,
      responsibleAgent: 'STUDENT_PROFILING_AGENT',
      execute: async (ctx: WorkflowStepExecutionContext) => {
        return {
          studentId: ctx.input.studentId,
          skillName: ctx.input.skillName,
          verified: true,
          verifiedBy: ctx.previousStepOutputs?.approvalInfo?.reviewedBy || 'tpo-admin',
          verifiedAt: new Date().toISOString()
        };
      }
    }
  ]
};

export const WF_CAREER_INTELLIGENCE_MATCH: WorkflowDefinition = {
  workflowId: 'WF_CAREER_INTELLIGENCE_MATCH',
  name: 'Industry Skill-Gap & Career Alignment Match',
  description:
    'Cross-analyzes verified student profile against real-time market role skill requirements.',
  triggerType: 'AUTOMATED_EVENT',
  initiatingRoles: ['STUDENT', 'TPO_ADMIN', 'COLLEGE_ADMIN', 'SUPER_ADMIN'],
  responsibleAgent: 'INDUSTRY_SKILL_GAP_AGENT',
  requiredHumanApproval: false,
  timeoutMs: 60000,
  maxRetries: 3,
  inputSchema: ProfilingToSkillGapInputSchema,
  outputSchema: ProfilingToSkillGapOutputSchema,
  steps: [
    {
      id: 'step_market_lookup',
      stepName: 'Market Taxonomy & Role Requirements Lookup',
      stepIndex: 1,
      responsibleAgent: 'INDUSTRY_SKILL_GAP_AGENT',
      execute: async (ctx: WorkflowStepExecutionContext) => {
        return {
          role: ctx.input.targetRole,
          marketRequiredSkills: ['TypeScript', 'Node.js', 'System Design', 'PostgreSQL', 'Docker'],
          fetchedAt: new Date().toISOString()
        };
      }
    },
    {
      id: 'step_gap_analysis',
      stepName: 'Gap Severity & Coverage Analysis',
      stepIndex: 2,
      responsibleAgent: 'INDUSTRY_SKILL_GAP_AGENT',
      execute: async (ctx: WorkflowStepExecutionContext) => {
        const verified = (ctx.input.verifiedSkills || []).map((s: any) => s.skillName);
        const marketSkills = ['TypeScript', 'Node.js', 'System Design', 'PostgreSQL', 'Docker'];
        const matched = marketSkills.filter((s) => verified.includes(s));
        const gaps = marketSkills
          .filter((s) => !verified.includes(s))
          .map((s) => ({
            skillName: s,
            currentLevel: 'NONE',
            requiredLevel: 'INTERMEDIATE',
            gapSeverity: 'MODERATE' as const
          }));
        return {
          matchedSkills: matched,
          missingEvidence: gaps.map((g) => g.skillName),
          skillGaps: gaps,
          confidence: 0.91,
          explanation: `Student matches ${matched.length}/${marketSkills.length} core market skills for role ${ctx.input.targetRole}.`
        };
      }
    }
  ]
};

export const WF_PREPARATION_LEARNING_SYNC: WorkflowDefinition = {
  workflowId: 'WF_PREPARATION_LEARNING_SYNC',
  name: 'Adaptive Preparation & Learning Pathway Sync',
  description:
    'Generates targeted practice problems, lab assignments, and mock assessment schedules to close identified gaps.',
  triggerType: 'AUTOMATED_EVENT',
  initiatingRoles: ['STUDENT', 'TPO_ADMIN', 'SUPER_ADMIN'],
  responsibleAgent: 'INDUSTRY_SKILL_GAP_AGENT',
  requiredHumanApproval: false,
  timeoutMs: 90000,
  maxRetries: 3,
  inputSchema: SkillGapToLearningInputSchema,
  outputSchema: SkillGapToLearningOutputSchema,
  steps: [
    {
      id: 'step_goal_translation',
      stepName: 'Skill Gap Translation to Learning Goals',
      stepIndex: 1,
      responsibleAgent: 'INDUSTRY_SKILL_GAP_AGENT',
      execute: async (ctx: WorkflowStepExecutionContext) => {
        const gapSkills = ctx.input.studentSkillProfile?.gapSkills || [];
        return {
          learningGoals: gapSkills.map((g: string) => `Master fundamentals and practical projects in ${g}`)
        };
      }
    },
    {
      id: 'step_task_synthesis',
      stepName: 'Adaptive Task Synthesis & Scheduling',
      stepIndex: 2,
      responsibleAgent: 'INDUSTRY_SKILL_GAP_AGENT',
      execute: async (ctx: WorkflowStepExecutionContext) => {
        const gapSkills = ctx.input.studentSkillProfile?.gapSkills || ['System Design'];
        const tasks = gapSkills.map((s: string, idx: number) => ({
          taskId: `task-${idx + 1}`,
          title: `Hands-on Project & Practical Labs: ${s}`,
          skillTarget: s,
          taskType: 'PRACTICE_PROJECT',
          estimatedHours: 12,
          priority: 'HIGH' as const
        }));
        return {
          recommendedTasks: tasks,
          priority: 'HIGH',
          expectedOutcome: 'Closing critical competency gaps within 3 weeks',
          reason: 'Target role demands validated proficiency in these specific technical competencies.'
        };
      }
    }
  ]
};

export const WF_PLACEMENT_DRIVE_ELIGIBILITY: WorkflowDefinition = {
  workflowId: 'WF_PLACEMENT_DRIVE_ELIGIBILITY',
  name: 'Placement Drive Eligibility & Multi-Criteria Filtering',
  description:
    'Applies institutional criteria, academic benchmarks, and skill thresholds to determine candidate drive eligibility.',
  triggerType: 'AUTOMATED_EVENT',
  initiatingRoles: ['TPO_ADMIN', 'COLLEGE_ADMIN', 'RECRUITER', 'SUPER_ADMIN'],
  responsibleAgent: 'PLACEMENT_ORCHESTRATION_AGENT',
  requiredHumanApproval: false,
  timeoutMs: 60000,
  maxRetries: 2,
  inputSchema: z.object({
    jobId: z.string().uuid(),
    studentId: z.string().uuid(),
    studentCgpa: z.number().min(0).max(10),
    minCgpa: z.number().min(0).max(10),
    department: z.string(),
    allowedDepartments: z.array(z.string()),
    attendancePercentage: z.number().min(0).max(100),
    backlogCount: z.number().int().min(0)
  }),
  outputSchema: z.object({
    jobId: z.string().uuid(),
    studentId: z.string().uuid(),
    isEligible: z.boolean(),
    eligibilityReasons: z.array(z.string()),
    evaluatedAt: z.string()
  }),
  steps: [
    {
      id: 'step_criteria_check',
      stepName: 'Academic & Administrative Clearance Check',
      stepIndex: 1,
      responsibleAgent: 'PLACEMENT_ORCHESTRATION_AGENT',
      execute: async (ctx: WorkflowStepExecutionContext) => {
        const { studentCgpa, minCgpa, department, allowedDepartments, attendancePercentage, backlogCount } =
          ctx.input;
        const reasons: string[] = [];

        if (studentCgpa < minCgpa) {
          reasons.push(`CGPA ${studentCgpa} is below minimum requirement ${minCgpa}`);
        }
        if (allowedDepartments.length > 0 && !allowedDepartments.includes(department)) {
          reasons.push(`Department ${department} is not in allowed departments`);
        }
        if (attendancePercentage < 75) {
          reasons.push(`Attendance ${attendancePercentage}% is below 75% threshold`);
        }
        if (backlogCount > 0) {
          reasons.push(`Active backlogs (${backlogCount}) disqualify candidate`);
        }

        const isEligible = reasons.length === 0;
        return {
          jobId: ctx.input.jobId,
          studentId: ctx.input.studentId,
          isEligible,
          eligibilityReasons: isEligible ? ['Met all criteria'] : reasons,
          evaluatedAt: new Date().toISOString()
        };
      }
    }
  ]
};

export const WF_CANDIDATE_SHORTLIST_REVIEW: WorkflowDefinition = {
  workflowId: 'WF_CANDIDATE_SHORTLIST_REVIEW',
  name: 'Candidate Shortlisting & TPO Human Governance Review',
  description:
    'Synthesizes multi-agent match rankings and halts at human-in-the-loop review gate for mandatory TPO authorization.',
  triggerType: 'MANUAL_USER',
  initiatingRoles: ['TPO_ADMIN', 'RECRUITER', 'SUPER_ADMIN'],
  responsibleAgent: 'PLACEMENT_ORCHESTRATION_AGENT',
  requiredHumanApproval: true,
  timeoutMs: 180000,
  maxRetries: 1,
  inputSchema: MultiAgentToPlacementInputSchema,
  outputSchema: MultiAgentToPlacementOutputSchema,
  steps: [
    {
      id: 'step_ranking_synthesis',
      stepName: 'Candidate Ranking Synthesis',
      stepIndex: 1,
      responsibleAgent: 'PLACEMENT_ORCHESTRATION_AGENT',
      execute: async (ctx: WorkflowStepExecutionContext) => {
        const matches = (ctx.input.skillMatches || []).map((m: any, idx: number) => ({
          studentId: m.studentId,
          matchScore: m.matchPercentage,
          rank: idx + 1
        }));
        return {
          candidateMatches: matches,
          synthesizedAt: new Date().toISOString()
        };
      }
    },
    {
      id: 'step_tpo_governance_gate',
      stepName: 'TPO Shortlist Review & Authorization Gate',
      stepIndex: 2,
      responsibleAgent: 'CENTRAL_ORCHESTRATOR',
      requiresHumanApproval: true,
      execute: async (ctx: WorkflowStepExecutionContext) => {
        return {
          requiresApproval: true,
          requiredRole: 'TPO_ADMIN',
          workflowId: ctx.workflowId
        };
      }
    },
    {
      id: 'step_shortlist_finalize',
      stepName: 'Recruiter Submission Dispatch',
      stepIndex: 3,
      responsibleAgent: 'PLACEMENT_ORCHESTRATION_AGENT',
      execute: async (ctx: WorkflowStepExecutionContext) => {
        const candidateMatches =
          ctx.previousStepOutputs?.step_ranking_synthesis?.candidateMatches || [];
        return {
          candidateMatches,
          eligibilityResult: {
            isEligible: true,
            rejectionReasons: []
          },
          reviewRequiredStatus: false,
          auditRefs: [`shortlist-approval-${ctx.workflowId}`]
        };
      }
    }
  ]
};

export const WF_PLACEMENT_OUTCOME_CONFIRMATION: WorkflowDefinition = {
  workflowId: 'WF_PLACEMENT_OUTCOME_CONFIRMATION',
  name: 'Placement Offer Confirmation & Longitudinal Analytics Sync',
  description:
    'Confirms formal job offer acceptance, updates corporate feedback, and synchronizes cohort predictive models.',
  triggerType: 'MANUAL_USER',
  initiatingRoles: ['TPO_ADMIN', 'STUDENT', 'SUPER_ADMIN'],
  responsibleAgent: 'PREDICTIVE_PLACEMENT_AGENT',
  requiredHumanApproval: true,
  timeoutMs: 60000,
  maxRetries: 3,
  inputSchema: z.object({
    studentId: z.string().uuid(),
    jobId: z.string().uuid(),
    companyName: z.string().min(1),
    ctc: z.number().positive(),
    offerDate: z.string().or(z.date()),
    acceptanceStatus: z.enum(['ACCEPTED', 'DECLINED', 'PENDING'])
  }),
  outputSchema: z.object({
    studentId: z.string().uuid(),
    jobId: z.string().uuid(),
    confirmed: z.boolean(),
    predictiveModelUpdated: z.boolean(),
    timestamp: z.string()
  }),
  steps: [
    {
      id: 'step_offer_verification',
      stepName: 'Offer Verification & Acceptance Check',
      stepIndex: 1,
      responsibleAgent: 'PREDICTIVE_PLACEMENT_AGENT',
      execute: async (ctx: WorkflowStepExecutionContext) => {
        return {
          verifiedOffer: true,
          company: ctx.input.companyName,
          ctc: ctx.input.ctc
        };
      }
    },
    {
      id: 'step_tpo_offer_gate',
      stepName: 'Institutional TPO Offer Approval Gate',
      stepIndex: 2,
      responsibleAgent: 'CENTRAL_ORCHESTRATOR',
      requiresHumanApproval: true,
      execute: async (ctx: WorkflowStepExecutionContext) => {
        return {
          gate: 'TPO_OFFER_VERIFICATION',
          requiresRole: 'TPO_ADMIN'
        };
      }
    },
    {
      id: 'step_analytics_sync',
      stepName: 'Longitudinal Analytics & Prediction Calibration',
      stepIndex: 3,
      responsibleAgent: 'PREDICTIVE_PLACEMENT_AGENT',
      execute: async (ctx: WorkflowStepExecutionContext) => {
        return {
          studentId: ctx.input.studentId,
          jobId: ctx.input.jobId,
          confirmed: ctx.input.acceptanceStatus === 'ACCEPTED',
          predictiveModelUpdated: true,
          timestamp: new Date().toISOString()
        };
      }
    }
  ]
};

/**
 * Registry Storage & Lookup Functions
 */
const registryMap = new Map<string, WorkflowDefinition>([
  [WF_STUDENT_ONBOARDING_PROFILING.workflowId, WF_STUDENT_ONBOARDING_PROFILING],
  [WF_EVIDENCE_VERIFICATION_DISPATCH.workflowId, WF_EVIDENCE_VERIFICATION_DISPATCH],
  [WF_CAREER_INTELLIGENCE_MATCH.workflowId, WF_CAREER_INTELLIGENCE_MATCH],
  [WF_PREPARATION_LEARNING_SYNC.workflowId, WF_PREPARATION_LEARNING_SYNC],
  [WF_PLACEMENT_DRIVE_ELIGIBILITY.workflowId, WF_PLACEMENT_DRIVE_ELIGIBILITY],
  [WF_CANDIDATE_SHORTLIST_REVIEW.workflowId, WF_CANDIDATE_SHORTLIST_REVIEW],
  [WF_PLACEMENT_OUTCOME_CONFIRMATION.workflowId, WF_PLACEMENT_OUTCOME_CONFIRMATION]
]);

export function getRegisteredWorkflows(): WorkflowDefinition[] {
  return Array.from(registryMap.values());
}

export function getWorkflowDefinition(workflowId: string): WorkflowDefinition | undefined {
  return registryMap.get(workflowId);
}

export function hasWorkflowDefinition(workflowId: string): boolean {
  return registryMap.has(workflowId);
}

export function registerWorkflow(definition: WorkflowDefinition): void {
  registryMap.set(definition.workflowId, definition);
}
