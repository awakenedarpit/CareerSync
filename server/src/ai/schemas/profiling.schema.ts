/**
 * Profiling Extraction Schema
 * 
 * Strict Zod validation schemas for AI extraction payloads.
 * Enforces calibration constraints (0.0 <= confidence <= 1.0) and
 * verification boundaries (AI cannot self-certify as 'Verified').
 */

import { z } from 'zod';

export const ALLOWED_EVIDENCE_TYPES = [
  'resume_mention',
  'project_description',
  'certification',
  'coursework',
  'github_commit',
  'github_pr',
  'project_repository',
  'deployed_application',
  'coding_assessment',
  'portfolio_attachment',
  'RESUME',
  'PROJECT',
  'CERTIFICATE',
  'PORTFOLIO',
] as const;

export const ALLOWED_VERIFICATION_STATUSES = [
  'Claimed',
  'Observed',
  'Evidence-linked',
  'Pending_Review',
  'CLAIMED',
  'OBSERVED',
  'EVIDENCE_FOUND',
  'PENDING_REVIEW',
] as const;

export const EvidenceItemSchema = z.object({
  documentId: z.string().optional(),
  evidenceType: z
    .string()
    .trim()
    .min(1, 'evidenceType must not be empty')
    .refine(
      (val) =>
        (ALLOWED_EVIDENCE_TYPES as readonly string[]).includes(val) ||
        (ALLOWED_EVIDENCE_TYPES as readonly string[]).includes(val.toUpperCase()) ||
        (ALLOWED_EVIDENCE_TYPES as readonly string[]).includes(val.toLowerCase()),
      {
        message: `evidenceType must be one of: ${ALLOWED_EVIDENCE_TYPES.join(', ')}`,
      }
    ),
  description: z.string().trim().min(1, 'Evidence description must not be empty'),
});

export const ExtractedSkillSchema = z.object({
  name: z.string().trim().min(1, 'Skill name must not be empty'),
  category: z.string().trim().min(1, 'Skill category must not be empty'),
  proficiencyClaim: z.string().optional(),
  evidence: z.array(EvidenceItemSchema).default([]),
  confidence: z
    .number()
    .min(0.0, 'Confidence score must be >= 0.0')
    .max(1.0, 'Confidence score must be <= 1.0'),
  verificationStatus: z
    .string()
    .trim()
    .min(1, 'verificationStatus must not be empty')
    .refine(
      (status) => {
        const lower = status.toLowerCase();
        // Never allow 'verified' status from automated AI extraction
        if (lower === 'verified' || lower === 'validated') {
          return false;
        }
        return (ALLOWED_VERIFICATION_STATUSES as readonly string[]).some(
          (allowed) => allowed.toLowerCase() === lower
        );
      },
      {
        message:
          "verificationStatus must be one of ('Claimed', 'Observed', 'Evidence-linked', 'Pending_Review', 'PENDING_REVIEW', 'EVIDENCE_FOUND'). AI cannot issue final 'Verified' status.",
      }
    ),
  explanation: z.string().optional(),
});

export const ExtractedProjectSchema = z.object({
  title: z.string().trim().min(1, 'Project title must not be empty'),
  description: z.string().optional(),
  technologies: z.array(z.string().trim().min(1)).default([]),
  role: z.string().optional(),
  liveUrl: z.string().optional(),
  repoUrl: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  highlights: z.array(z.string()).default([]),
});

export const ExtractedCertificationSchema = z.object({
  name: z.string().trim().min(1, 'Certification name must not be empty'),
  issuer: z.string().optional(),
  issueDate: z.string().optional(),
  expiryDate: z.string().optional(),
  credentialId: z.string().optional(),
  verificationUrl: z.string().optional(),
});

export const CourseworkSchema = z.object({
  name: z.string().trim().min(1, 'Coursework name must not be empty'),
  institution: z.string().optional(),
  grade: z.string().optional(),
  skillsCovered: z.array(z.string()).default([]),
});

export const ExtractionWarningSchema = z.object({
  code: z.string().trim().min(1, 'Warning code must not be empty'),
  message: z.string().trim().min(1, 'Warning message must not be empty'),
  field: z.string().optional(),
  severity: z.enum(['low', 'medium', 'high']).default('low'),
});

export const ProfilingMetadataSchema = z.object({
  provider: z.string().trim().min(1, 'Provider must not be empty'),
  model: z.string().optional(),
  extractedAt: z.string(),
  processingTimeMs: z.number().nonnegative(),
  documentId: z.string().optional(),
  documentType: z.string().optional(),
  redactedEntitiesCount: z.number().int().nonnegative().optional(),
});

export const ProfilingExtractionResultSchema = z.object({
  skills: z.array(ExtractedSkillSchema).default([]),
  projects: z.array(ExtractedProjectSchema).default([]),
  certifications: z.array(ExtractedCertificationSchema).default([]),
  coursework: z.array(CourseworkSchema).default([]),
  warnings: z.array(ExtractionWarningSchema).default([]),
  metadata: ProfilingMetadataSchema,
});

export type ProfilingExtractionResultType = z.infer<typeof ProfilingExtractionResultSchema>;
