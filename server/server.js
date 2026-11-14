/**
 * CarrerSync Server Entrypoint
 * Bootstraps the database connection and launches the HTTP listener.
 */

const app = require('./src/app');
const env = require('./src/config/env');
const { connectDB } = require('./src/config/db');
const logger = require('./src/utils/logger');

const startServer = async () => {
  // Connect to database without blocking server start if disconnected
  await connectDB();

  const server = app.listen(env.PORT, () => {
    logger.info(`CarrerSync API server is running on port ${env.PORT} in [${env.NODE_ENV}] mode`);
    logger.info(`Health check available at: http://localhost:${env.PORT}/api/health`);
    logger.info(`Accepted CORS origin: ${env.CLIENT_URL}`);
  });

  // Graceful shutdown handlers
  const gracefulShutdown = (signal) => {
    logger.info(`Received ${signal}. Shutting down CarrerSync API gracefully...`);
    server.close(() => {
      logger.info('HTTP server closed.');
      process.exit(0);
    });
  };

  process.on('SIGINT', () => gracefulShutdown('SIGINT'));
  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
};

startServer();
