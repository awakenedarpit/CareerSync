import type { Request, Response, NextFunction } from 'express';
import env from '../config/env';

/**
 * Centralized error handler returning consistent JSON responses without leaking credentials.
 */
export function errorHandler(
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) {
  if (res.headersSent) {
    return next(err);
  }

  // Handle malformed JSON body from express.json()
  if (err instanceof SyntaxError && 'status' in err && (err as any).status === 400 && 'body' in err) {
    return res.status(400).json({
      success: false,
      error: 'Malformed JSON payload'
    });
  }

  const status =
    typeof err.status === 'number' && err.status >= 400 && err.status < 600
      ? err.status
      : typeof err.statusCode === 'number' && err.statusCode >= 400 && err.statusCode < 600
      ? err.statusCode
      : 500;

  const code = err.code || (status === 500 ? 'INTERNAL_SERVER_ERROR' : 'ERROR');
  const rawMessage = err.message || 'An unexpected error occurred';

  // Ensure credentials, tokens, or connection strings are never leaked
  const sanitizedMessage = rawMessage.replace(
    /(password|secret|token|api_key|authorization|database_url)([:=])([^\s&]+)/gi,
    '$1$2***'
  );

  const body: Record<string, unknown> = {
    success: false,
    error: sanitizedMessage,
    code
  };

  if (env.NODE_ENV === 'development' && err.stack) {
    body.stack = err.stack;
  }

  return res.status(status).json(body);
}

/**
 * 404 Route Not Found handler.
 */
export function notFoundHandler(req: Request, res: Response) {
  return res.status(404).json({
    success: false,
    error: `Route not found: ${req.method} ${req.originalUrl || req.url}`,
    code: 'NOT_FOUND'
  });
}
