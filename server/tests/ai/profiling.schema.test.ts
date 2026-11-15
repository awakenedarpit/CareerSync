import { describe, it, expect } from 'vitest';
import {
  ProfilingExtractionResultSchema,
  ExtractedSkillSchema,
} from '../../src/ai/schemas/profiling.schema';

describe('Profiling Schema Validation', () => {
  it('should accept valid ProfilingExtractionResult', () => {
    const validData = {
      skills: [
        {
          name: 'TypeScript',
          category: 'programming_languages',
          proficiencyClaim: 'intermediate',
          evidence: [
            {
              documentId: 'doc-123',
              evidenceType: 'project_description',
              description: 'Used TypeScript to build REST APIs in backend project.',
            },
          ],
          confidence: 0.85,
          verificationStatus: 'Evidence-linked',
          explanation: 'Demonstrated in backend API project.',
        },
      ],
      projects: [
        {
          title: 'CareerSync Portal',
          technologies: ['React', 'TypeScript', 'Node.js'],
          description: 'Placement automation platform.',
        },
      ],
      certifications: [
        {
          name: 'AWS Certified Cloud Practitioner',
          issuer: 'Amazon Web Services',
        },
      ],
      coursework: [
        {
          name: 'Data Structures and Algorithms',
          skillsCovered: ['Data Structures', 'Algorithms'],
        },
      ],
      warnings: [],
      metadata: {
        provider: 'rule-based',
        model: 'taxonomy-v1',
        extractedAt: new Date().toISOString(),
        processingTimeMs: 42,
        documentId: 'doc-123',
        documentType: 'resume',
        redactedEntitiesCount: 1,
      },
    };

    const parseResult = ProfilingExtractionResultSchema.safeParse(validData);
    expect(parseResult.success).toBe(true);
  });

  it('should reject confidence values outside [0.0, 1.0]', () => {
    const invalidSkillLow = {
      name: 'Python',
      category: 'programming_languages',
      evidence: [],
      confidence: -0.1,
      verificationStatus: 'Claimed',
    };
    expect(ExtractedSkillSchema.safeParse(invalidSkillLow).success).toBe(false);

    const invalidSkillHigh = {
      name: 'Python',
      category: 'programming_languages',
      evidence: [],
      confidence: 1.05,
      verificationStatus: 'Claimed',
    };
    expect(ExtractedSkillSchema.safeParse(invalidSkillHigh).success).toBe(false);
  });

  it('should reject auto-verified status ("Verified" or "Validated")', () => {
    const autoVerifiedSkill = {
      name: 'React',
      category: 'frameworks',
      evidence: [],
      confidence: 0.9,
      verificationStatus: 'Verified', // Strictly disallowed for AI extraction!
    };
    const parseResult = ExtractedSkillSchema.safeParse(autoVerifiedSkill);
    expect(parseResult.success).toBe(false);
    if (!parseResult.success) {
      expect(parseResult.error.issues[0].message).toContain('AI cannot issue final');
    }

    const validatedSkill = {
      name: 'React',
      category: 'frameworks',
      evidence: [],
      confidence: 0.9,
      verificationStatus: 'Validated',
    };
    expect(ExtractedSkillSchema.safeParse(validatedSkill).success).toBe(false);
  });

  it('should allow valid non-verified statuses (Claimed, Observed, Evidence-linked, Pending_Review)', () => {
    const validStatuses = [
      'Claimed',
      'Observed',
      'Evidence-linked',
      'Pending_Review',
      'PENDING_REVIEW',
      'EVIDENCE_FOUND',
      'CLAIMED',
      'OBSERVED',
    ];

    for (const status of validStatuses) {
      const skill = {
        name: 'Docker',
        category: 'cloud_devops',
        evidence: [
          {
            evidenceType: 'project_description',
            description: 'Containerized microservices.',
          },
        ],
        confidence: 0.75,
        verificationStatus: status,
      };
      const result = ExtractedSkillSchema.safeParse(skill);
      expect(result.success).toBe(true);
    }
  });

  it('should reject empty skill name', () => {
    const emptyNameSkill = {
      name: '   ',
      category: 'databases',
      evidence: [],
      confidence: 0.5,
      verificationStatus: 'Claimed',
    };
    expect(ExtractedSkillSchema.safeParse(emptyNameSkill).success).toBe(false);
  });

  it('should reject unknown evidence types', () => {
    const invalidEvidenceSkill = {
      name: 'MongoDB',
      category: 'databases',
      evidence: [
        {
          evidenceType: 'unverified_rumor',
          description: 'Friend told me they know Mongo.',
        },
      ],
      confidence: 0.5,
      verificationStatus: 'Claimed',
    };
    expect(ExtractedSkillSchema.safeParse(invalidEvidenceSkill).success).toBe(false);
  });
});
