/**
 * Server Entry Point
 * Loads environment variables, connects to MongoDB, then starts the HTTP server.
 */

// Load .env variables before any other imports
require('dotenv').config();

const app = require('./src/app');
const connectDB = require('./src/config/db');
const config = require('./src/config/env');

/**
 * Starts the server after establishing a database connection.
 */
const startServer = async () => {
  // Connect to MongoDB first
  await connectDB();

  const server = app.listen(config.port, () => {
    console.log('');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('  🚀 Bridging Skills to Careers — Backend API');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`  🌍 Environment : ${config.nodeEnv}`);
    console.log(`  🔗 Server URL  : http://localhost:${config.port}`);
    console.log(`  ❤️  Health Check: http://localhost:${config.port}/health`);
    console.log(`  📡 API Base    : http://localhost:${config.port}/api`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('');
  });

  // ── Graceful Shutdown ──────────────────────────────────────────────────────
  const shutdown = (signal) => {
    console.log(`\n⚠️  ${signal} received. Shutting down gracefully...`);
    server.close(() => {
      console.log('✅ HTTP server closed.');
      process.exit(0);
    });
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));

  // Handle unhandled promise rejections
  process.on('unhandledRejection', (reason, promise) => {
    console.error('🔥 Unhandled Rejection at:', promise, 'reason:', reason);
    server.close(() => process.exit(1));
  });
};

startServer();
