/**
 * Express Application Setup
 * Production-ready configuration with security, CORS, and error handling.
 */

const express = require('express');
const cors = require('cors');
const config = require('./config/env');
const requestLogger = require('./middleware/requestLogger');
const { notFound, errorHandler } = require('./middleware/errorHandler');
const apiRoutes = require('./routes/index');

const app = express();

// ── Security & CORS ────────────────────────────────────────────────────────────
const ALLOWED_ORIGINS = [
  'http://localhost:5173',  // Vite dev server
  'http://localhost:3000',  // CRA / fallback
  'http://localhost:4173',  // Vite preview
  config.corsOrigin,
].filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (mobile apps, curl, Postman)
      if (!origin) return callback(null, true);
      if (ALLOWED_ORIGINS.includes(origin)) return callback(null, true);
      callback(new Error(`CORS: Origin ${origin} not allowed`));
    },
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
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
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'running',
    environment: config.nodeEnv,
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '1.0.0',
    uptime: Math.floor(process.uptime()),
  });
});

// ── API Routes ─────────────────────────────────────────────────────────────────
app.use('/api', apiRoutes);

// ── 404 Handler ────────────────────────────────────────────────────────────────
app.use(notFound);

// ── Global Error Handler ───────────────────────────────────────────────────────
app.use(errorHandler);

module.exports = app;
