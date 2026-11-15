import { describe, it, expect } from 'vitest';
import { RuleBasedAIProvider } from '../../src/ai/providers/rule-based.provider';

describe('RuleBasedAIProvider', () => {
  const provider = new RuleBasedAIProvider();

  const sampleResume = `
Rahul Sharma
Email: rahul@example.com
Phone: +91 9876543210

TECHNICAL SKILLS:
- Languages: Python, TypeScript, Java, SQL
- Frameworks: React, Node.js, Express.js, FastAPI
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

  it('should extract skills across multiple technical categories', async () => {
    const result = await provider.analyzeDocument(sampleResume, {
      documentId: 'doc-001',
      documentType: 'resume',
    });

    expect(result.skills.length).toBeGreaterThan(5);

    const categories = new Set(result.skills.map((s) => s.category));
    expect(categories.has('programming_languages')).toBe(true);
    expect(categories.has('frameworks')).toBe(true);
    expect(categories.has('databases')).toBe(true);
    expect(categories.has('cloud_devops')).toBe(true);
    expect(categories.has('tools')).toBe(true);
  });

  it('should assign PROJECT / EVIDENCE_FOUND with confidence 0.80 for skills used in projects', async () => {
    const result = await provider.analyzeDocument(sampleResume, {
      documentId: 'doc-001',
    });

    // React is used in E-Commerce project
    const reactSkill = result.skills.find((s) => s.name === 'React');
    expect(reactSkill).toBeDefined();
    expect(reactSkill?.verificationStatus).toBe('EVIDENCE_FOUND');
    expect(reactSkill?.evidence[0].evidenceType).toBe('PROJECT');
    expect(reactSkill?.confidence).toBe(0.8);
    expect(reactSkill?.explanation).toContain('evidenced through implementation in project');
  });

  it('should assign RESUME / PENDING_REVIEW for skills mentioned only in skills list', async () => {
    const result = await provider.analyzeDocument(sampleResume, {
      documentId: 'doc-001',
    });

    // Java is listed in skills list but not implemented in projects or certs
    const javaSkill = result.skills.find((s) => s.name === 'Java');
    expect(javaSkill).toBeDefined();
    expect(javaSkill?.verificationStatus).toBe('PENDING_REVIEW');
    expect(javaSkill?.evidence[0].evidenceType).toBe('RESUME');
    expect(javaSkill?.confidence).toBe(0.55);
    expect(javaSkill?.explanation).toContain('Stored as claim pending reviewer validation');
  });

  it('should assign CERTIFICATE / PENDING_REVIEW for skills backed by certifications', async () => {
    const result = await provider.analyzeDocument(sampleResume, {
      documentId: 'doc-001',
    });

    // AWS is backed by AWS Certified Cloud Practitioner
    const awsSkill = result.skills.find((s) => s.name === 'AWS');
    expect(awsSkill).toBeDefined();
    expect(awsSkill?.evidence[0].evidenceType).toBe('CERTIFICATE');
    expect(awsSkill?.verificationStatus).toBe('PENDING_REVIEW');
    expect(awsSkill?.confidence).toBe(0.75);
    expect(awsSkill?.explanation).toContain('evidenced by certification');
  });

  it('should extract projects with title, technologies, and URLs', async () => {
    const result = await provider.analyzeDocument(sampleResume);

    expect(result.projects.length).toBeGreaterThanOrEqual(1);
    const ecommerce = result.projects.find((p) => p.title.includes('E-Commerce'));
    expect(ecommerce).toBeDefined();
    expect(ecommerce?.technologies).toContain('React');
    expect(ecommerce?.technologies).toContain('TypeScript');
    expect(ecommerce?.technologies).toContain('Docker');
    expect(ecommerce?.repoUrl).toContain('github.com/rahul/ecommerce-platform');
  });

  it('should extract certifications', async () => {
    const result = await provider.analyzeDocument(sampleResume);

    expect(result.certifications.length).toBeGreaterThanOrEqual(1);
    const awsCert = result.certifications.find((c) => c.name.includes('AWS Certified'));
    expect(awsCert).toBeDefined();
  });

  it('should never assign "Verified" or "Validated" verification status', async () => {
    const result = await provider.analyzeDocument(sampleResume);

    for (const skill of result.skills) {
      expect(skill.verificationStatus.toLowerCase()).not.toBe('verified');
      expect(skill.verificationStatus.toLowerCase()).not.toBe('validated');
    }
  });

  it('should generate human-readable explanations for all extracted skills', async () => {
    const result = await provider.analyzeDocument(sampleResume);

    for (const skill of result.skills) {
      expect(typeof skill.explanation).toBe('string');
      expect(skill.explanation!.length).toBeGreaterThan(10);
    }
  });
});
