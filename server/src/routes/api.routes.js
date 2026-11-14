/**
 * Central API Router
 * Aggregates all versioned /api sub-routes.
 */

const express = require('express');
const healthRoutes = require('./health.routes');

const router = express.Router();

// Mount Health Check on /api/health
router.use('/health', healthRoutes);

module.exports = router;
