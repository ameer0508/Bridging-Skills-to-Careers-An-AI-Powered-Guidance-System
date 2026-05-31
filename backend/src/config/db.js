/**
 * MongoDB Connection Configuration
 * Handles Mongoose connection setup, logging, and error handling.
 */

const mongoose = require('mongoose');

/**
 * Connects to MongoDB using the URI from environment variables.
 * Logs connection status and exits the process on fatal errors.
 */
const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGO_URI;

    if (!mongoURI) {
      throw new Error('MONGO_URI is not defined in environment variables.');
    }

    const conn = await mongoose.connect(mongoURI, {
      // Mongoose 8.x uses these options by default; listed for clarity
      serverSelectionTimeoutMS: 5000, // Timeout after 5s if no server found
    });

    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    console.log(`📦 Database: ${conn.connection.name}`);
  } catch (error) {
    console.error(`❌ MongoDB Connection Error: ${error.message}`);
    // Exit process with failure — server cannot run without DB
    process.exit(1);
  }
};

// Mongoose connection event listeners for runtime monitoring
mongoose.connection.on('disconnected', () => {
  console.warn('⚠️  MongoDB disconnected.');
});

mongoose.connection.on('reconnected', () => {
  console.log('🔄 MongoDB reconnected.');
});

module.exports = connectDB;
