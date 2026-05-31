/**
 * Express Application Setup
 * Configures middleware, routes, and error handlers.
 * Exported for use in server.js (and for testing).
 */

const express = require('express');
const cors = require('cors');
const config = require('./config/env');
const requestLogger = require('./middleware/requestLogger');
const { notFound, errorHandler } = require('./middleware/errorHandler');
const apiRoutes = require('./routes/index');

const app = express();

// ── Security & CORS ────────────────────────────────────────────────────────────
app.use(
  cors({
    origin: config.corsOrigin,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  })
);

// ── Body Parsing ───────────────────────────────────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ── Request Logging ────────────────────────────────────────────────────────────
if (config.isDevelopment) {
  app.use(requestLogger);
}

// ── Health Check ───────────────────────────────────────────────────────────────
/**
 * @route   GET /health
 * @desc    Server health check — confirms the API is running
 * @access  Public
 */
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'running',
    environment: config.nodeEnv,
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '1.0.0',
  });
});

// ── API Routes ─────────────────────────────────────────────────────────────────
app.use('/api', apiRoutes);

// ── 404 Handler ────────────────────────────────────────────────────────────────
app.use(notFound);

// ── Global Error Handler ───────────────────────────────────────────────────────
// Must be last middleware registered
app.use(errorHandler);

module.exports = app;
