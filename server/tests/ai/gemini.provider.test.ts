import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { GeminiAIProvider } from '../../src/ai/providers/gemini.provider';
import {
  AIServiceError,
  AIQuotaExceededError,
  AISchemaValidationError,
  AITimeoutError,
} from '../../src/ai/ai.errors';

describe('GeminiAIProvider', () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it('should throw AIServiceError when GEMINI_API_KEY is not configured', async () => {
    const unconfiguredProvider = new GeminiAIProvider({ apiKey: '' });
    expect(unconfiguredProvider.isConfigured()).toBe(false);

    await expect(
      unconfiguredProvider.analyzeDocument('Some resume text')
    ).rejects.toThrow(AIServiceError);
  });

  it('should successfully analyze document and validate schema when Gemini returns valid JSON', async () => {
    const mockGeminiResponse = {
      candidates: [
        {
          content: {
            parts: [
              {
                text: JSON.stringify({
                  skills: [
                    {
                      name: 'React',
                      category: 'frameworks',
                      confidence: 0.82,
                      verificationStatus: 'Observed',
                      evidence: [
                        {
                          evidenceType: 'project_description',
                          description: 'Built interactive dashboard.',
                        },
                      ],
                      explanation: 'Detected in dashboard project.',
                    },
                  ],
                  projects: [
                    {
                      title: 'Dashboard App',
                      technologies: ['React'],
                      highlights: ['Optimized rendering'],
                    },
                  ],
                  certifications: [],
                  coursework: [],
                  warnings: [],
                }),
              },
            ],
          },
        },
      ],
    };

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => mockGeminiResponse,
    });

    const provider = new GeminiAIProvider({ apiKey: 'mock-key-123' });
    const result = await provider.analyzeDocument(
      'Candidate Name: John Doe\nSkills: React\nAddress: 123 Main St',
      { documentId: 'doc-mock' }
    );

    expect(result.skills.length).toBe(1);
    expect(result.skills[0].name).toBe('React');
    expect(result.metadata.provider).toBe('gemini');
    expect(result.metadata.redactedEntitiesCount).toBeGreaterThanOrEqual(1);

    // Verify fetch call payload
    expect(global.fetch).toHaveBeenCalledTimes(1);
    const fetchArgs = (global.fetch as any).mock.calls[0];
    const url = fetchArgs[0];
    const requestBody = JSON.parse(fetchArgs[1].body);

    expect(url).toContain('key=mock-key-123');
    // Verify that the prompt sent to Gemini does NOT contain the candidate name or address
    const sentText = requestBody.contents[0].parts[0].text;
    expect(sentText).not.toContain('John Doe');
    expect(sentText).toContain('[REDACTED_NAME]');
  });

  it('should throw AIQuotaExceededError when Gemini API returns HTTP 429', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 429,
      statusText: 'Too Many Requests',
      text: async () => 'Resource exhausted: quota exceeded',
    });

    const provider = new GeminiAIProvider({ apiKey: 'mock-key-123' });
    await expect(
      provider.analyzeDocument('Resume content')
    ).rejects.toThrow(AIQuotaExceededError);
  });

  it('should throw AITimeoutError when fetch aborts due to timeout', async () => {
    global.fetch = vi.fn().mockImplementation(() => {
      const err = new Error('The operation was aborted');
      err.name = 'AbortError';
      return Promise.reject(err);
    });

    const provider = new GeminiAIProvider({ apiKey: 'mock-key-123', timeoutMs: 100 });
    await expect(
      provider.analyzeDocument('Resume content')
    ).rejects.toThrow(AITimeoutError);
  });

  it('should throw AISchemaValidationError when Gemini attempts to return "Verified" status', async () => {
    const invalidVerifiedResponse = {
      candidates: [
        {
          content: {
            parts: [
              {
                text: JSON.stringify({
                  skills: [
                    {
                      name: 'React',
                      category: 'frameworks',
                      confidence: 0.95,
                      verificationStatus: 'Verified', // DISALLOWED!
                      evidence: [],
                    },
                  ],
                  projects: [],
                  certifications: [],
                  coursework: [],
                  warnings: [],
                }),
              },
            ],
          },
        },
      ],
    };

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => invalidVerifiedResponse,
    });

    const provider = new GeminiAIProvider({ apiKey: 'mock-key-123' });
    await expect(
      provider.analyzeDocument('Resume content')
    ).rejects.toThrow(AISchemaValidationError);
  });
});
