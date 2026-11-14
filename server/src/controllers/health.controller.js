/**
 * Health Controller
 * Provides system status and database connectivity reporting.
 */

const { getDatabaseStatus } = require('../config/db');

const getHealthStatus = (req, res) => {
  const dbStatus = getDatabaseStatus();

  return res.status(200).json({
    success: true,
    message: 'CarrerSync API is running',
    database: dbStatus,
  });
};

module.exports = {
  getHealthStatus,
};
