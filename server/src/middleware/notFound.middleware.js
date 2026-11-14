/**
 * 404 Not Found Middleware
 * Intercepts requests to unregistered endpoints and returns a consistent JSON payload.
 */

const notFoundHandler = (req, res, next) => {
  res.status(404).json({
    success: false,
    error: 'Route not found',
    path: req.originalUrl,
    method: req.method,
  });
};

module.exports = notFoundHandler;
