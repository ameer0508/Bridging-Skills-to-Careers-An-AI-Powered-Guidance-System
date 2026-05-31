/**
 * MongoDB Connection Configuration
 * - In production: connects to MONGO_URI from environment variables.
 * - In development (fallback): spins up an in-memory MongoDB instance
 *   via mongodb-memory-server so the server runs without a local MongoDB install.
 */

const mongoose = require('mongoose');

let memoryServer = null; // holds the MongoMemoryServer instance if used

/**
 * Attempts to connect to MongoDB.
 * Falls back to an in-memory server in development if the real DB is unreachable.
 */
const connectDB = async () => {
  const mongoURI = process.env.MONGO_URI;
  const isDev = process.env.NODE_ENV !== 'production';

  if (!mongoURI) {
    throw new Error('MONGO_URI is not defined in environment variables.');
  }

  // First, try the configured URI
  try {
    const conn = await mongoose.connect(mongoURI, {
      serverSelectionTimeoutMS: 3000, // Fail fast so fallback kicks in quickly
    });
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    console.log(`📦 Database: ${conn.connection.name}`);
    return;
  } catch (primaryError) {
    if (!isDev) {
      // In production, a DB failure is fatal
      console.error(`❌ MongoDB Connection Error: ${primaryError.message}`);
      process.exit(1);
    }
    console.warn(`⚠️  Could not connect to MongoDB at ${mongoURI}`);
    console.warn('   Falling back to in-memory MongoDB for development...');
  }

  // Development fallback: use mongodb-memory-server
  try {
    const { MongoMemoryServer } = require('mongodb-memory-server');
    memoryServer = await MongoMemoryServer.create();
    const memoryURI = memoryServer.getUri();

    await mongoose.connect(memoryURI);
    console.log('✅ MongoDB (In-Memory) Connected — data resets on restart');
    console.log(`📦 Memory URI: ${memoryURI}`);
  } catch (fallbackError) {
    console.error(`❌ In-memory MongoDB also failed: ${fallbackError.message}`);
    process.exit(1);
  }
};

/**
 * Gracefully closes the DB connection and stops the memory server if running.
 */
const disconnectDB = async () => {
  await mongoose.connection.close();
  if (memoryServer) {
    await memoryServer.stop();
    console.log('🛑 In-memory MongoDB stopped.');
  }
};

// Runtime connection event listeners
mongoose.connection.on('disconnected', () => {
  console.warn('⚠️  MongoDB disconnected.');
});

mongoose.connection.on('reconnected', () => {
  console.log('🔄 MongoDB reconnected.');
});

module.exports = connectDB;
module.exports.disconnectDB = disconnectDB;
