import http from 'http';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import app from './app.js';
import env from './config/env.js';
import logger from './config/logger.js';
import CareerService from './services/CareerService.js';

const server = http.createServer(app);
let mongoServer: MongoMemoryServer | null = null;

// Initialize Database Connection
const connectDatabase = async (): Promise<void> => {
  let mongoUri = env.MONGODB_URI;

  if (
    env.NODE_ENV === 'development' &&
    (mongoUri.includes('localhost') || mongoUri.includes('127.0.0.1'))
  ) {
    try {
      logger.info('Local MongoDB URI detected. Spinning up in-memory MongoMemoryServer...');
      mongoServer = await MongoMemoryServer.create();
      mongoUri = mongoServer.getUri();
      logger.info(`🟢 In-memory database started successfully on URI: ${mongoUri}`);
    } catch (error) {
      logger.error('❌ Failed to launch in-memory MongoMemoryServer:', error);
    }
  }

  logger.info('Initializing MongoDB connection...');
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
