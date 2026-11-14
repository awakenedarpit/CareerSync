/**
 * CarrerSync Server Configuration & Environment Variable Validation
 * Enforces zero-cost defaults and safe fallbacks.
 */

const dotenv = require('dotenv');
const path = require('path');

// Load .env if present
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const NODE_ENV = process.env.NODE_ENV || 'development';
const PORT = parseInt(process.env.PORT, 10) || 5000;
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';
const MONGODB_URI = process.env.MONGODB_URI || '';
const JWT_SECRET = process.env.JWT_SECRET || (NODE_ENV === 'production' ? null : 'carrersync_dev_jwt_secret_change_in_prod');

// Warn about missing optional/production configuration
if (!MONGODB_URI) {
  console.warn('[Config Warning] MONGODB_URI is not set. Database will run in disconnected state until configured.');
}

if (NODE_ENV === 'production' && !JWT_SECRET) {
  console.error('[Config Error] JWT_SECRET must be set in production mode.');
}

const env = {
  NODE_ENV,
  PORT,
  CLIENT_URL,
  MONGODB_URI,
  JWT_SECRET,
  isProduction: NODE_ENV === 'production',
  isDevelopment: NODE_ENV === 'development',
};

module.exports = env;
