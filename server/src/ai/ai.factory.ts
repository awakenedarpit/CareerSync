/**
 * AI Service Factory & Hybrid Orchestrator
 * 
 * Provides unified access to AI profiling engines.
 * Implements the Zero-Cost & Deterministic Fallback principle:
 * - If Gemini is configured and accessible, runs Gemini primary.
 * - If Gemini is unconfigured, rate-limited, times out, or fails schema validation,
 *   seamlessly falls back to the deterministic RuleBasedAIProvider.
 * - Zero hard dependencies on external keys.
 */

import type { IAIService } from './ai.interface';
import type {
  ProfilingExtractionResult,
  DocumentAnalysisOptions,
  ExtractionWarning,
} from './ai.types';
import { GeminiAIProvider } from './providers/gemini.provider';
import { RuleBasedAIProvider } from './providers/rule-based.provider';
import { AIServiceError } from './ai.errors';

export class HybridAIService implements IAIService {
  private readonly geminiProvider: GeminiAIProvider;
  private readonly ruleBasedProvider: RuleBasedAIProvider;

  constructor(
    geminiProvider?: GeminiAIProvider,
    ruleBasedProvider?: RuleBasedAIProvider
  ) {
    this.geminiProvider = geminiProvider || new GeminiAIProvider();
    this.ruleBasedProvider = ruleBasedProvider || new RuleBasedAIProvider();
  }

  public async analyzeDocument(
    text: string,
    options?: DocumentAnalysisOptions
  ): Promise<ProfilingExtractionResult> {
    const force = options?.forceProvider;

    if (force === 'rule-based') {
      return this.ruleBasedProvider.analyzeDocument(text, options);
    }

    if (force === 'gemini') {
      return this.geminiProvider.analyzeDocument(text, options);
    }

    // Default Hybrid Execution Mode:
    // If Gemini is not configured, fall back immediately to rule-based
    if (!this.geminiProvider.isConfigured()) {
      return this.ruleBasedProvider.analyzeDocument(text, options);
    }

    // Attempt Gemini extraction with automatic graceful fallback
    try {
      return await this.geminiProvider.analyzeDocument(text, options);
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error ? err.message : 'Unknown AI extraction error';

      // Execute deterministic fallback
      const fallbackResult = await this.ruleBasedProvider.analyzeDocument(
        text,
        options
      );

      // Append notice to warnings
      const fallbackWarning: ExtractionWarning = {
        code: 'FALLBACK_TRIGGERED',
        message: `Primary Gemini AI provider unavailable (${errorMessage}). Executed deterministic rule-based fallback.`,
        severity: 'medium',
      };

      return {
        ...fallbackResult,
        warnings: [fallbackWarning, ...fallbackResult.warnings],
        metadata: {
          ...fallbackResult.metadata,
          provider: 'rule-based (fallback from gemini)',
        },
      };
    }
  }

  public getStatus() {
    return {
      geminiConfigured: this.geminiProvider.isConfigured(),
      fallbackAvailable: true,
      activeStrategy: this.geminiProvider.isConfigured()
        ? 'hybrid_gemini_with_fallback'
        : 'deterministic_rule_based_only',
    };
  }
}

export class AIFactory {
  private static cachedHybridInstance: HybridAIService | null = null;
  private static cachedRuleBasedInstance: RuleBasedAIProvider | null = null;
  private static cachedGeminiInstance: GeminiAIProvider | null = null;

  /**
   * Retrieves an AI service instance according to provider specification.
   * 
   * @param forceProvider Optional: 'gemini' | 'rule-based'
   * @returns IAIService implementation
   */
  public static getAIService(
    forceProvider?: 'gemini' | 'rule-based'
  ): IAIService {
    if (forceProvider === 'rule-based') {
      if (!this.cachedRuleBasedInstance) {
        this.cachedRuleBasedInstance = new RuleBasedAIProvider();
      }
      return this.cachedRuleBasedInstance;
    }

    if (forceProvider === 'gemini') {
      if (!this.cachedGeminiInstance) {
        this.cachedGeminiInstance = new GeminiAIProvider();
      }
      return this.cachedGeminiInstance;
    }

    if (!this.cachedHybridInstance) {
      this.cachedHybridInstance = new HybridAIService(
        new GeminiAIProvider(),
        new RuleBasedAIProvider()
      );
    }

    return this.cachedHybridInstance;
  }

  /**
   * Clears cached instances (useful for testing).
   */
  public static reset(): void {
    this.cachedHybridInstance = null;
    this.cachedRuleBasedInstance = null;
    this.cachedGeminiInstance = null;
  }
}

export const getAIService = (forceProvider?: 'gemini' | 'rule-based') =>
  AIFactory.getAIService(forceProvider);
