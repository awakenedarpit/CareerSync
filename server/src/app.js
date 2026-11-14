/**
 * CarrerSync Express Application Configuration
 * REST API architecture with CORS, parsing, routing, and centralized error handling.
 */

const express = require('express');
const cors = require('cors');
const env = require('./config/env');
const apiRoutes = require('./routes/api.routes');
const notFoundHandler = require('./middleware/notFound.middleware');
const errorHandler = require('./middleware/error.middleware');

const app = express();

// Security & Cross-Origin Configuration
app.use(cors({
  origin: env.CLIENT_URL,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Tenant-ID'],
}));

// Body Parsing Middleware
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// Root Information Endpoint
app.get('/', (req, res) => {
  res.status(200).json({
    name: 'CarrerSync API',
    description: 'Agentic Placement Intelligence Platform',
    version: '1.0.0',
    documentation: '/docs',
    health: '/api/health',
  });
});

// Mount Main API Routes (/api/...)
app.use('/api', apiRoutes);

// Catch Unhandled Routes (404)
app.use(notFoundHandler);

// Centralized Error Handling
app.use(errorHandler);

module.exports = app;
