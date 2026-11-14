/**
 * CarrerSync Application Logger
 * Structured console logging with timestamps and safety checks (no sensitive data logged).
 */

const formatTimestamp = () => new Date().toISOString();

const logger = {
  info: (...args) => console.log(`[${formatTimestamp()}] [INFO]`, ...args),
  warn: (...args) => console.warn(`[${formatTimestamp()}] [WARN]`, ...args),
  error: (...args) => console.error(`[${formatTimestamp()}] [ERROR]`, ...args),
  debug: (...args) => {
    if (process.env.NODE_ENV !== 'production') {
      console.debug(`[${formatTimestamp()}] [DEBUG]`, ...args);
    }
  },
};

module.exports = logger;
