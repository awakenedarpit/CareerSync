/**
 * Centralized Error Handling Middleware
 * Catches all unhandled errors, formats a uniform JSON response,
 * and hides sensitive internal stack traces in production.
 */

const env = require('../config/env');
const logger = require('../utils/logger');

const errorHandler = (err, req, res, next) => {
  const statusCode = err.statusCode || (res.statusCode !== 200 ? res.statusCode : 500);

  logger.error(`[Unhandled Error] ${req.method} ${req.originalUrl} - ${err.message}`);

  const response = {
    success: false,
    error: err.message || 'Internal Server Error',
  };

  // Only expose stack trace in development
  if (env.isDevelopment && err.stack) {
    response.stack = err.stack;
  }

  res.status(statusCode).json(response);
};

module.exports = errorHandler;
