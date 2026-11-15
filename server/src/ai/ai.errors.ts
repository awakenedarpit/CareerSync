/**
 * AI Module Errors
 * 
 * Custom error hierarchy for handling failure modes across external AI APIs
 * and rule-based extractors, supporting graceful fallback triggers.
 */

export class AIServiceError extends Error {
  public readonly code: string;
  public readonly provider: string;
  public readonly statusCode?: number;
  public readonly cause?: unknown;

  constructor(
    message: string,
    options?: {
      code?: string;
      provider?: string;
      statusCode?: number;
      cause?: unknown;
    }
  ) {
    super(message);
    this.name = 'AIServiceError';
    this.code = options?.code || 'AI_SERVICE_ERROR';
    this.provider = options?.provider || 'unknown';
    this.statusCode = options?.statusCode;
    this.cause = options?.cause;

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

export class AIQuotaExceededError extends AIServiceError {
  public readonly retryAfterSeconds?: number;

  constructor(
    message = 'AI provider quota exceeded or rate limit reached',
    options?: {
      provider?: string;
      statusCode?: number;
      retryAfterSeconds?: number;
      cause?: unknown;
    }
  ) {
    super(message, {
      code: 'AI_QUOTA_EXCEEDED',
      provider: options?.provider || 'gemini',
      statusCode: options?.statusCode || 429,
      cause: options?.cause,
    });
    this.name = 'AIQuotaExceededError';
    this.retryAfterSeconds = options?.retryAfterSeconds;
  }
}

export class AISchemaValidationError extends AIServiceError {
  public readonly validationErrors: unknown[];

  constructor(
    message = 'AI extraction output failed schema validation',
    options?: {
      provider?: string;
      validationErrors?: unknown[];
      cause?: unknown;
    }
  ) {
    super(message, {
      code: 'AI_SCHEMA_VALIDATION_ERROR',
      provider: options?.provider || 'unknown',
      statusCode: 422,
      cause: options?.cause,
    });
    this.name = 'AISchemaValidationError';
    this.validationErrors = options?.validationErrors || [];
  }
}

export class AITimeoutError extends AIServiceError {
  public readonly timeoutMs?: number;

  constructor(
    message = 'AI request exceeded configured timeout',
    options?: {
      provider?: string;
      timeoutMs?: number;
      cause?: unknown;
    }
  ) {
    super(message, {
      code: 'AI_TIMEOUT_ERROR',
      provider: options?.provider || 'gemini',
      statusCode: 504,
      cause: options?.cause,
    });
    this.name = 'AITimeoutError';
    this.timeoutMs = options?.timeoutMs;
  }
}
