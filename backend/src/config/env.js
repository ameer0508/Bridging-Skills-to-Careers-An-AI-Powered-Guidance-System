/**
 * Environment Configuration
 * Centralizes all environment variable access with defaults and validation.
 */

const config = {
  // Server
  port: process.env.PORT || 5000,
  nodeEnv: process.env.NODE_ENV || 'development',

  // Database
  mongoURI: process.env.MONGO_URI || 'mongodb://localhost:27017/bridging_skills_to_careers',

  // CORS
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:3000',

  // API
  apiVersion: process.env.API_VERSION || 'v1',

  // Helpers
  isDevelopment: process.env.NODE_ENV === 'development',
  isProduction: process.env.NODE_ENV === 'production',
};

module.exports = config;
