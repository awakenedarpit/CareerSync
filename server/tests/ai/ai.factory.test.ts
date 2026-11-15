import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { AIFactory, HybridAIService } from '../../src/ai/ai.factory';
import { RuleBasedAIProvider } from '../../src/ai/providers/rule-based.provider';
import { GeminiAIProvider } from '../../src/ai/providers/gemini.provider';

describe('AIFactory & HybridAIService', () => {
  beforeEach(() => {
    AIFactory.reset();
    vi.restoreAllMocks();
  });

  it('should return RuleBasedAIProvider when forceProvider is "rule-based"', () => {
    const service = AIFactory.getAIService('rule-based');
    expect(service).toBeInstanceOf(RuleBasedAIProvider);
  });

  it('should return GeminiAIProvider when forceProvider is "gemini"', () => {
    const service = AIFactory.getAIService('gemini');
    expect(service).toBeInstanceOf(GeminiAIProvider);
  });

  it('should return HybridAIService by default', () => {
    const service = AIFactory.getAIService();
    expect(service).toBeInstanceOf(HybridAIService);
  });

  it('should seamlessly execute rule-based extraction when Gemini is unconfigured', async () => {
    const geminiMock = new GeminiAIProvider({ apiKey: '' });
    const ruleBasedMock = new RuleBasedAIProvider();
    const hybrid = new HybridAIService(geminiMock, ruleBasedMock);

    expect(hybrid.getStatus().geminiConfigured).toBe(false);

    const result = await hybrid.analyzeDocument('Skills: Python, Docker\nProjects: Web App using Python');
    expect(result.skills.length).toBeGreaterThanOrEqual(1);
    expect(result.metadata.provider).toBe('rule-based');
  });

  it('should seamlessly fall back to rule-based when Gemini fails with quota error', async () => {
    const geminiMock = new GeminiAIProvider({ apiKey: 'mock-key' });
    vi.spyOn(geminiMock, 'analyzeDocument').mockRejectedValue(
      new Error('Resource exhausted: quota exceeded (HTTP 429)')
    );

    const ruleBasedMock = new RuleBasedAIProvider();
    const hybrid = new HybridAIService(geminiMock, ruleBasedMock);

    const result = await hybrid.analyzeDocument(
      'TECHNICAL SKILLS: JavaScript, React, Node.js\nPROJECTS:\nTask Manager using React and Node.js'
    );

    // Extraction should still succeed completely!
    expect(result.skills.length).toBeGreaterThanOrEqual(2);
    expect(result.metadata.provider).toContain('fallback');

    // Should include a FALLBACK_TRIGGERED warning
    const fallbackWarning = result.warnings.find(
      (w) => w.code === 'FALLBACK_TRIGGERED'
    );
    expect(fallbackWarning).toBeDefined();
    expect(fallbackWarning?.message).toContain('quota exceeded');
  });

  it('should force rule-based extraction when option forceProvider="rule-based" is passed to Hybrid service', async () => {
    const geminiMock = new GeminiAIProvider({ apiKey: 'mock-key' });
    const geminiSpy = vi.spyOn(geminiMock, 'analyzeDocument');

    const ruleBasedMock = new RuleBasedAIProvider();
    const hybrid = new HybridAIService(geminiMock, ruleBasedMock);

    const result = await hybrid.analyzeDocument('Skills: Python', {
      forceProvider: 'rule-based',
    });

    expect(geminiSpy).not.toHaveBeenCalled();
    expect(result.metadata.provider).toBe('rule-based');
  });
});
