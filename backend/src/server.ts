import http from 'http';
import mongoose from 'mongoose';
import type { MongoMemoryServer } from 'mongodb-memory-server';
import fs from 'fs';
import path from 'path';
import app from './app.js';
import env from './config/env.js';
import logger from './config/logger.js';
import CareerService from './services/CareerService.js';

const server = http.createServer(app);
let mongoServer: MongoMemoryServer | null = null;

// Initialize Database Connection with Persistent Storage Support
const connectDatabase = async (): Promise<void> => {
  let mongoUri = env.MONGODB_URI;

  const isCloudUri =
    mongoUri.startsWith('mongodb+srv://') ||
    (!mongoUri.includes('localhost') && !mongoUri.includes('127.0.0.1'));

  if (isCloudUri) {
    logger.info('External MongoDB URI configured. Connecting directly...');
  } else if (env.NODE_ENV === 'development') {
    // Development convenience: run an embedded MongoDB whose files persist under data/local_db.
    // The package is a devDependency, so it is loaded lazily and never required in production.
    const dbDir = path.resolve(process.cwd(), 'data', 'local_db');
    try {
      if (!fs.existsSync(dbDir)) {
        fs.mkdirSync(dbDir, { recursive: true });
      }
      const { MongoMemoryServer: EmbeddedMongo } = await import('mongodb-memory-server');

      logger.info(`Persisted Local MongoDB storage path: ${dbDir}`);
      mongoServer = await EmbeddedMongo.create({
        instance: {
          dbPath: dbDir,
          storageEngine: 'wiredTiger',
          dbName: 'skillbridge',
        },
      });
      mongoUri = mongoServer.getUri();
      logger.info(`🟢 Persistent local database active on URI: ${mongoUri}`);
    } catch (error) {
      // Never fall back to an empty throwaway database silently: existing accounts would
      // appear to have vanished. Opt in explicitly with ALLOW_EPHEMERAL_DB=true.
      if (process.env.ALLOW_EPHEMERAL_DB !== 'true') {
        logger.error(
          `❌ Could not open the persistent local database at ${dbDir}. ` +
            'Another backend instance may still be running, or a stale lock file may remain. ' +
            'Stop other instances and retry, point MONGODB_URI at a real MongoDB server, ' +
            'or set ALLOW_EPHEMERAL_DB=true to start with a temporary empty database.',
          error
        );
        process.exit(1);
      }
      logger.warn('ALLOW_EPHEMERAL_DB=true: starting with a TEMPORARY EMPTY database. Data will not persist.');
      const { MongoMemoryServer: EmbeddedMongo } = await import('mongodb-memory-server');
      mongoServer = await EmbeddedMongo.create();
      mongoUri = mongoServer.getUri();
    }
  }

  logger.info('Initializing MongoDB connection pool...');
  try {
    await mongoose.connect(mongoUri);
    logger.info('Successfully established MongoDB connection pool.');
    await CareerService.seedInitialTaxonomy();
    const RecommendationService = (await import('./services/RecommendationService.js')).default;
    await RecommendationService.seedInitialResources();
  } catch (error) {
    logger.error(
      'Failed to establish MongoDB connection on startup. API will remain active but degraded:',
      error
    );
  }
};

connectDatabase();

// Start HTTP Server
server.listen(env.PORT, () => {
  logger.info(`🚀 Server running in [${env.NODE_ENV}] mode on port ${env.PORT}`);
  logger.info(`🟢 Health endpoint: http://localhost:${env.PORT}/health`);
  logger.info(`🟢 API root: http://localhost:${env.PORT}/api/v1`);
});

// Central Graceful Shutdown Routine
const gracefulShutdown = (signal: string) => {
  logger.info(`⚠️ Received [${signal}] signal. Initiating graceful shutdown...`);

  // Step 1: Stop accepting new connection requests
  server.close(() => {
    logger.info('🟢 Closed HTTP server connection listener.');

    // Step 2: Clean up active database connection pool
    mongoose.connection
      .close()
      .then(async () => {
        logger.info('🟢 Mongoose connection pool closed successfully.');
        if (mongoServer) {
          await mongoServer.stop();
          logger.info('🟢 MongoMemoryServer stopped successfully.');
        }
        process.exit(0);
      })
      .catch(error => {
        logger.error('❌ Mongoose connection pool close failure:', error);
        process.exit(1);
      });
  });

  // Step 3: Enforce hard termination if connections take too long to close
  setTimeout(() => {
    logger.error('❌ Graceful shutdown timeout exceeded. Enforcing process exit.');
    process.exit(1);
  }, 10000);
};

// Listen to System Termination Signals
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
