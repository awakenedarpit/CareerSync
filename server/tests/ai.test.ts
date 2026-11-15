/**
 * CarrerSync AI Profiling Subsystem Test Suite
 * Phase 09 — Hybrid AI Architecture, Rule-Based Extraction, PII Redaction & Schema Validation
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { RuleBasedAIProvider } from '../src/ai/providers/rule-based.provider';
import { GeminiAIProvider } from '../src/ai/providers/gemini.provider';
import { AIFactory, HybridAIService } from '../src/ai/ai.factory';
import { scrubPII, PIIFilter } from '../src/ai/utils/pii-filter';
import {
  ProfilingExtractionResultSchema,
  ExtractedSkillSchema,
} from '../src/ai/schemas/profiling.schema';
import {
  AIServiceError,
  AIQuotaExceededError,
  AISchemaValidationError,
} from '../src/ai/ai.errors';

describe('Phase 09 — AI Profiling Subsystem', () => {
  const sampleResumeText = `
RAHUL SHARMA
Email: rahul.sharma@example.com
Phone: +91 98765 43210
Aadhaar: 2345 6789 0123
Location: Bangalore, Karnataka, India

PROFESSIONAL SUMMARY
Passionate Full-Stack Developer with experience in building scalable microservices and web apps.

TECHNICAL SKILLS:
- Languages: TypeScript, JavaScript, Python, Java, SQL
- Frameworks & Libraries: React, Node.js, Express, Next.js, Django
- Databases: PostgreSQL, MongoDB, Redis
- Cloud & DevOps: Docker, AWS, GitHub Actions, Linux
- Tools: Git, Postman

PROJECTS:
E-Commerce Microservices Platform
Developed an end-to-end shopping engine using React and TypeScript for frontend,
with Node.js and PostgreSQL for backend services. Packaged services with Docker.
GitHub: https://github.com/rahul/ecommerce-platform
Live: https://ecommerce.example.com

AI Chatbot Assistant
Built a natural language query assistant using Python and FastAPI connected to Redis cache.

CERTIFICATIONS:
- AWS Certified Cloud Practitioner
- HackerRank SQL Advanced Certificate

EDUCATION:
Relevant Coursework: Data Structures, Operating Systems, Computer Networks
`.trim();

  // =========================================================================
  // 1. Rule-Based AI Provider Tests
  // =========================================================================
  describe('Rule-Based AI Provider', () => {
    let provider: RuleBasedAIProvider;

    beforeEach(() => {
      provider = new RuleBasedAIProvider();
    });

    it('extracts skills deterministically across language, framework, db, cloud, and tool categories', async () => {
      const result = await provider.analyzeDocument(sampleResumeText, {
        documentId: 'doc-001',
        documentType: 'resume',
      });

      expect(result.skills.length).toBeGreaterThan(5);

      const skillNames = result.skills.map((s) => s.name);
      expect(skillNames).toContain('TypeScript');
      expect(skillNames).toContain('React');
      expect(skillNames).toContain('PostgreSQL');
      expect(skillNames).toContain('Docker');

      const categories = new Set(result.skills.map((s) => s.category));
      expect(categories.has('programming_languages')).toBe(true);
      expect(categories.has('frameworks')).toBe(true);
      expect(categories.has('databases')).toBe(true);
      expect(categories.has('cloud_devops')).toBe(true);
      expect(categories.has('tools')).toBe(true);
    });

    it('identifies projects, technologies used, and project repositories', async () => {
      const result = await provider.analyzeDocument(sampleResumeText);

      expect(result.projects.length).toBeGreaterThanOrEqual(2);
      const ecommerceProject = result.projects.find((p) => p.title.includes('E-Commerce'));
      expect(ecommerceProject).toBeDefined();
      expect(ecommerceProject?.technologies).toContain('React');
      expect(ecommerceProject?.technologies).toContain('TypeScript');
      expect(ecommerceProject?.technologies).toContain('Docker');
      expect(ecommerceProject?.repoUrl).toContain('github.com/rahul/ecommerce-platform');
    });

    it('calculates confidence strictly within the range [0.0, 1.0]', async () => {
      const result = await provider.analyzeDocument(sampleResumeText);

      for (const skill of result.skills) {
        expect(skill.confidence).toBeGreaterThanOrEqual(0.0);
        expect(skill.confidence).toBeLessThanOrEqual(1.0);
      }
    });

    it('enforces evidentiary rules: project skills get PROJECT/EVIDENCE_FOUND (0.80), resume claims get RESUME/PENDING_REVIEW (0.55)', async () => {
      const result = await provider.analyzeDocument(sampleResumeText, {
        documentId: 'doc-001',
      });

      // React is used in E-Commerce project
      const reactSkill = result.skills.find((s) => s.name === 'React');
      expect(reactSkill).toBeDefined();
      expect(reactSkill?.verificationStatus).toBe('EVIDENCE_FOUND');
      expect(reactSkill?.evidence[0].evidenceType).toBe('PROJECT');
      expect(reactSkill?.confidence).toBe(0.8);

      // Java is only listed in skills list
      const javaSkill = result.skills.find((s) => s.name === 'Java');
      expect(javaSkill).toBeDefined();
      expect(javaSkill?.verificationStatus).toBe('PENDING_REVIEW');
      expect(javaSkill?.evidence[0].evidenceType).toBe('RESUME');
      expect(javaSkill?.confidence).toBe(0.55);

      // Cert-backed skill
      const awsSkill = result.skills.find((s) => s.name === 'AWS');
      expect(awsSkill).toBeDefined();
      expect(awsSkill?.verificationStatus).toBe('PENDING_REVIEW');
      expect(awsSkill?.evidence[0].evidenceType).toBe('CERTIFICATE');
      expect(awsSkill?.confidence).toBe(0.75);
    });

    it('never assigns final VERIFIED or VALIDATED status from AI extraction alone', async () => {
      const result = await provider.analyzeDocument(sampleResumeText);

      for (const skill of result.skills) {
        expect(skill.verificationStatus.toUpperCase()).not.toBe('VERIFIED');
        expect(skill.verificationStatus.toUpperCase()).not.toBe('VALIDATED');
      }
    });
  });

  // =========================================================================
  // 2. Zod Schema Validation Tests
  // =========================================================================
  describe('Zod Schema Validation', () => {
    it('validates structured output conforming strictly to ProfilingExtractionResultSchema', () => {
      const validResult = {
        skills: [
          {
            name: 'Python',
            category: 'programming_languages',
            proficiencyClaim: 'proficient',
            evidence: [
              {
                documentId: '11111111-1111-4111-8111-111111111111',
                evidenceType: 'project_description',
                description: 'Implemented backend data scraper in Python',
              },
            ],
            confidence: 0.85,
            verificationStatus: 'Evidence-linked',
            explanation: 'Demonstrated in data scraper project',
          },
        ],
        projects: [
          {
            title: 'Data Scraper',
            technologies: ['Python', 'BeautifulSoup'],
            description: 'Automated job listing extractor',
          },
        ],
        certifications: [
          {
            name: 'Python for Data Science',
            issuer: 'Coursera',
          },
        ],
        coursework: [],
        warnings: [],
        metadata: {
          provider: 'rule-based',
          model: 'taxonomy-v1',
          extractedAt: new Date().toISOString(),
          processingTimeMs: 25,
          documentId: '11111111-1111-4111-8111-111111111111',
          documentType: 'resume',
          redactedEntitiesCount: 0,
        },
      };

      const parsed = ProfilingExtractionResultSchema.safeParse(validResult);
      expect(parsed.success).toBe(true);
    });

    it('rejects out-of-range confidence (>1.0 or <0.0)', () => {
      const skillAboveOne = {
        name: 'Node.js',
        category: 'frameworks',
        evidence: [],
        confidence: 1.25,
        verificationStatus: 'Claimed',
      };
      const resultAboveOne = ExtractedSkillSchema.safeParse(skillAboveOne);
      expect(resultAboveOne.success).toBe(false);

      const skillBelowZero = {
        name: 'Node.js',
        category: 'frameworks',
        evidence: [],
        confidence: -0.15,
        verificationStatus: 'Claimed',
      };
      const resultBelowZero = ExtractedSkillSchema.safeParse(skillBelowZero);
      expect(resultBelowZero.success).toBe(false);
    });

    it('rejects forbidden verification statuses such as "Verified" or "Validated"', () => {
      const verifiedSkill = {
        name: 'React',
        category: 'frameworks',
        evidence: [],
        confidence: 0.95,
        verificationStatus: 'Verified',
      };
      const verifiedParse = ExtractedSkillSchema.safeParse(verifiedSkill);
      expect(verifiedParse.success).toBe(false);

      const validatedSkill = {
        name: 'React',
        category: 'frameworks',
        evidence: [],
        confidence: 0.95,
        verificationStatus: 'Validated',
      };
      const validatedParse = ExtractedSkillSchema.safeParse(validatedSkill);
      expect(validatedParse.success).toBe(false);
    });

    it('rejects empty or whitespace-only skill names', () => {
      const emptySkill = {
        name: '',
        category: 'frameworks',
        evidence: [],
        confidence: 0.5,
        verificationStatus: 'Claimed',
      };
      expect(ExtractedSkillSchema.safeParse(emptySkill).success).toBe(false);

      const whitespaceSkill = {
        name: '   ',
        category: 'frameworks',
        evidence: [],
        confidence: 0.5,
        verificationStatus: 'Claimed',
      };
      expect(ExtractedSkillSchema.safeParse(whitespaceSkill).success).toBe(false);
    });
  });

  // =========================================================================
  // 3. PII Filter & Student Privacy Tests
  // =========================================================================
  describe('PII Filter & Student Privacy Scrubber', () => {
    it('redacts email addresses before transmission', () => {
      const input = 'Contact student at john.doe@mit.edu and alt_email@gmail.com.';
      const output = scrubPII(input);

      expect(output.sanitizedText).not.toContain('john.doe@mit.edu');
      expect(output.sanitizedText).not.toContain('alt_email@gmail.com');
      expect(output.sanitizedText).toContain('[REDACTED_EMAIL]');
      expect(output.redactedCount).toBeGreaterThanOrEqual(2);
      expect(output.redactions.some((r) => r.type === 'email')).toBe(true);
    });

    it('redacts Indian mobile numbers (+91, prefixes, 10 digits)', () => {
      const input = 'Call +91 9876543210 or 09876543210 or +91-91234-56789.';
      const output = scrubPII(input);

      expect(output.sanitizedText).not.toContain('9876543210');
      expect(output.sanitizedText).not.toContain('91234-56789');
      expect(output.sanitizedText).toContain('[REDACTED_PHONE]');
      expect(output.redactions.some((r) => r.type === 'phone')).toBe(true);
    });

    it('redacts international phone numbers', () => {
      const input = 'US phone +1 (415) 555-2671 or UK +44 20 7946 0958.';
      const output = scrubPII(input);

      expect(output.sanitizedText).not.toContain('555-2671');
      expect(output.sanitizedText).toContain('[REDACTED_PHONE]');
    });

    it('redacts Indian Aadhaar, PAN card, and US SSN formats', () => {
      const input = 'Aadhaar: 4532 8901 2345, PAN: ABCDE1234F, SSN: 123-45-6789.';
      const output = scrubPII(input);

      expect(output.sanitizedText).not.toContain('4532 8901 2345');
      expect(output.sanitizedText).not.toContain('ABCDE1234F');
      expect(output.sanitizedText).not.toContain('123-45-6789');
      expect(output.sanitizedText).toContain('[REDACTED_AADHAAR]');
      expect(output.sanitizedText).toContain('[REDACTED_PAN]');
      expect(output.sanitizedText).toContain('[REDACTED_SSN]');
    });

    it('redacts explicit candidate names while preserving technical skills', () => {
      const input = 'Candidate Name: Rahul Sharma\nSkills: React, Node.js, PostgreSQL';
      const output = scrubPII(input);

      expect(output.sanitizedText).not.toContain('Rahul Sharma');
      expect(output.sanitizedText).toContain('[REDACTED_NAME]');
      expect(output.sanitizedText).toContain('React, Node.js, PostgreSQL');
    });

    it('handles empty input gracefully without errors', () => {
      const output = scrubPII('');
      expect(output.sanitizedText).toBe('');
      expect(output.redactedCount).toBe(0);
      expect(output.redactions).toEqual([]);
    });
  });

  // =========================================================================
  // 4. Gemini Provider Fallback & Graceful Degradation Tests
  // =========================================================================
  describe('Gemini Provider Fallback & Resilience', () => {
    beforeEach(() => {
      AIFactory.reset();
      vi.restoreAllMocks();
    });

    it('falls back to rule-based provider seamlessly when GEMINI_API_KEY is missing', async () => {
      const unconfiguredGemini = new GeminiAIProvider({ apiKey: '' });
      const ruleBased = new RuleBasedAIProvider();
      const hybrid = new HybridAIService(unconfiguredGemini, ruleBased);

      expect(hybrid.getStatus().geminiConfigured).toBe(false);

      const result = await hybrid.analyzeDocument('Skills: Python, Docker\nProjects: Web Portal with Python');
      expect(result.skills.length).toBeGreaterThanOrEqual(1);
      expect(result.metadata.provider).toBe('rule-based');
    });

    it('falls back to rule-based provider when Gemini throws quota exceeded (429) or API error', async () => {
      const mockGemini = new GeminiAIProvider({ apiKey: 'test-gemini-key' });
      vi.spyOn(mockGemini, 'analyzeDocument').mockRejectedValue(
        new Error('Resource exhausted: quota exceeded (HTTP 429)')
      );

      const ruleBased = new RuleBasedAIProvider();
      const hybrid = new HybridAIService(mockGemini, ruleBased);

      const result = await hybrid.analyzeDocument(
        'TECHNICAL SKILLS: React, Node.js\nPROJECTS: Task Tracker in React and Node.js'
      );

      // Verify analysis succeeded via rule-based fallback without crash
      expect(result.skills.length).toBeGreaterThanOrEqual(2);
      expect(result.metadata.provider).toContain('fallback');

      // Verify fallback warning was recorded
      const warning = result.warnings.find((w) => w.code === 'FALLBACK_TRIGGERED');
      expect(warning).toBeDefined();
      expect(warning?.message).toContain('quota exceeded');
    });

    it('falls back to rule-based provider when Gemini API times out', async () => {
      const mockGemini = new GeminiAIProvider({ apiKey: 'test-gemini-key' });
      vi.spyOn(mockGemini, 'analyzeDocument').mockRejectedValue(
        new Error('Gemini API request timed out after 30000ms')
      );

      const ruleBased = new RuleBasedAIProvider();
      const hybrid = new HybridAIService(mockGemini, ruleBased);

      const result = await hybrid.analyzeDocument('Skills: TypeScript, PostgreSQL');
      expect(result.skills.length).toBeGreaterThanOrEqual(2);
      expect(result.metadata.provider).toContain('fallback');
      expect(result.warnings.some((w) => w.code === 'FALLBACK_TRIGGERED')).toBe(true);
    });

    it('allows forcing rule-based provider directly via options', async () => {
      const mockGemini = new GeminiAIProvider({ apiKey: 'test-gemini-key' });
      const geminiSpy = vi.spyOn(mockGemini, 'analyzeDocument');

      const ruleBased = new RuleBasedAIProvider();
      const hybrid = new HybridAIService(mockGemini, ruleBased);

      const result = await hybrid.analyzeDocument('Skills: Python', {
        forceProvider: 'rule-based',
      });

      expect(geminiSpy).not.toHaveBeenCalled();
      expect(result.metadata.provider).toBe('rule-based');
    });
  });
});
