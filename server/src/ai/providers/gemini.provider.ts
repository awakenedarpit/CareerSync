/**
 * Google Gemini AI Profiling Provider
 * 
 * Invokes Google Gemini Free Tier models (gemini-1.5-flash / gemini-2.0-flash)
 * via standard fetch HTTP endpoint.
 * 
 * Features:
 * - Automatic PII redaction before transmission
 * - AbortController timeout enforcement
 * - Structured JSON schema validation with Zod
 * - Typed error mapping (Quota, Timeout, SchemaValidation, ServiceError)
 * - Zero hard crashes: Graceful throws allow AIFactory fallback
 */

import type {
  ProfilingExtractionResult,
  DocumentAnalysisOptions,
} from '../ai.types';
import type { IAIService } from '../ai.interface';
import {
  AIServiceError,
  AIQuotaExceededError,
  AISchemaValidationError,
  AITimeoutError,
} from '../ai.errors';
import { ProfilingExtractionResultSchema } from '../schemas/profiling.schema';
import { scrubPII } from '../utils/pii-filter';
import {
  PROFILING_SYSTEM_PROMPT,
  buildProfilingUserPrompt,
} from '../prompts/profiling.prompts';

export interface GeminiProviderOptions {
  apiKey?: string;
  model?: string;
  timeoutMs?: number;
}

export class GeminiAIProvider implements IAIService {
  private readonly apiKey: string;
  private readonly model: string;
  private readonly defaultTimeoutMs: number;

  constructor(options?: GeminiProviderOptions) {
    this.apiKey = options?.apiKey || process.env.GEMINI_API_KEY || '';
    this.model = options?.model || process.env.GEMINI_MODEL || 'gemini-1.5-flash';
    this.defaultTimeoutMs =
      options?.timeoutMs ||
      (process.env.AI_REQUEST_TIMEOUT_MS
        ? parseInt(process.env.AI_REQUEST_TIMEOUT_MS, 10)
        : 15000);
  }

  public isConfigured(): boolean {
    return Boolean(this.apiKey && this.apiKey.trim().length > 0);
  }

  public async analyzeDocument(
    text: string,
    options?: DocumentAnalysisOptions
  ): Promise<ProfilingExtractionResult> {
    const startTime = Date.now();

    if (!this.isConfigured()) {
      throw new AIServiceError('GEMINI_API_KEY is not configured in environment', {
        code: 'API_KEY_MISSING',
        provider: 'gemini',
        statusCode: 401,
      });
    }

    const documentId = options?.documentId || 'doc-unknown';
    const documentType = options?.documentType || 'resume';
    const timeoutMs = options?.timeoutMs || this.defaultTimeoutMs;

    // 1. PII Scrubbing
    let sanitizedText = text;
    let redactedCount = 0;
    if (!options?.skipPIIFilter) {
      const scrubResult = scrubPII(text);
      sanitizedText = scrubResult.sanitizedText;
      redactedCount = scrubResult.redactedCount;
    }

    // 2. Build Prompt
    const userPrompt = buildProfilingUserPrompt({
      text: sanitizedText,
      documentId,
      documentType,
    });

    // 3. Dispatch to Gemini API with timeout
    const controller = new AbortController();
    const timeoutHandle = setTimeout(() => controller.abort(), timeoutMs);

    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${this.model}:generateContent?key=${this.apiKey}`;

    const requestPayload = {
      contents: [
        {
          role: 'user',
          parts: [
            {
              text: `${PROFILING_SYSTEM_PROMPT}\n\n${userPrompt}`,
            },
          ],
        },
      ],
      generationConfig: {
        responseMimeType: 'application/json',
        temperature: 0.1,
        maxOutputTokens: 4096,
      },
    };

    let response: Response;
    try {
      response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestPayload),
        signal: controller.signal,
      });
    } catch (err: unknown) {
      clearTimeout(timeoutHandle);
      if (err instanceof Error && err.name === 'AbortError') {
        throw new AITimeoutError(
          `Gemini API request timed out after ${timeoutMs}ms`,
          {
            provider: 'gemini',
            timeoutMs,
            cause: err,
          }
        );
      }
      throw new AIServiceError(
        `Gemini network communication failed: ${err instanceof Error ? err.message : String(err)}`,
        {
          code: 'NETWORK_ERROR',
          provider: 'gemini',
          cause: err,
        }
      );
    } finally {
      clearTimeout(timeoutHandle);
    }

    // 4. Handle HTTP response status
    if (!response.ok) {
      let errorBody = '';
      try {
        errorBody = await response.text();
      } catch {
        // ignore body read error
      }

      const status = response.status;
      if (
        status === 429 ||
        errorBody.toLowerCase().includes('resource_exhausted') ||
        errorBody.toLowerCase().includes('quota')
      ) {
        throw new AIQuotaExceededError(
          `Gemini API rate limit or quota exceeded: ${errorBody || response.statusText}`,
          {
            provider: 'gemini',
            statusCode: status,
          }
        );
      }

      throw new AIServiceError(
        `Gemini API request failed with HTTP ${status}: ${errorBody || response.statusText}`,
        {
          code: 'API_ERROR',
          provider: 'gemini',
          statusCode: status,
        }
      );
    }

    // 5. Parse response body
    let responseData: any;
    try {
      responseData = await response.json();
    } catch (parseErr) {
      throw new AISchemaValidationError(
        'Gemini returned malformed response JSON payload',
        {
          provider: 'gemini',
          cause: parseErr,
        }
      );
    }

    const candidateText =
      responseData?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!candidateText || typeof candidateText !== 'string') {
      throw new AISchemaValidationError(
        'Gemini response candidate text is missing or empty',
        {
          provider: 'gemini',
          validationErrors: [{ message: 'No content parts in candidate response' }],
        }
      );
    }

    // 6. Clean and parse JSON text
    let parsedJson: any;
    try {
      const cleanJsonStr = candidateText
        .trim()
        .replace(/^```(?:json)?\s*/i, '')
        .replace(/```\s*$/i, '')
        .trim();
      parsedJson = JSON.parse(cleanJsonStr);
    } catch (jsonErr) {
      throw new AISchemaValidationError(
        `Failed to parse JSON from Gemini text response: ${jsonErr instanceof Error ? jsonErr.message : String(jsonErr)}`,
        {
          provider: 'gemini',
          cause: jsonErr,
        }
      );
    }

    // 7. Inject metadata before schema validation
    const processingTimeMs = Date.now() - startTime;
    const finalPayload = {
      skills: Array.isArray(parsedJson?.skills) ? parsedJson.skills : [],
      projects: Array.isArray(parsedJson?.projects) ? parsedJson.projects : [],
      certifications: Array.isArray(parsedJson?.certifications)
        ? parsedJson.certifications
        : [],
      coursework: Array.isArray(parsedJson?.coursework)
        ? parsedJson.coursework
        : [],
      warnings: Array.isArray(parsedJson?.warnings) ? parsedJson.warnings : [],
      metadata: {
        provider: 'gemini',
        model: this.model,
        extractedAt: new Date().toISOString(),
        processingTimeMs,
        documentId,
        documentType,
        redactedEntitiesCount: redactedCount,
      },
    };

    // 8. Validate against Zod schema
    const validationResult =
      ProfilingExtractionResultSchema.safeParse(finalPayload);

    if (!validationResult.success) {
      throw new AISchemaValidationError(
        'Gemini extraction result failed Zod schema validation',
        {
          provider: 'gemini',
          validationErrors: validationResult.error.issues,
        }
      );
    }

    return validationResult.data as ProfilingExtractionResult;
  }
}
