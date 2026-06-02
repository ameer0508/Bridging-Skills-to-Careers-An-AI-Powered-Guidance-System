const config = {
  port: process.env.PORT || 5000,
  nodeEnv: process.env.NODE_ENV || 'development',
  mongoURI: process.env.MONGO_URI || 'mongodb://localhost:27017/bridging_skills_to_careers',
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  jwtSecret: process.env.JWT_SECRET || 'skillbridge_ai_secret_dev',
  jwtExpires: process.env.JWT_EXPIRES || '7d',
  apiVersion: process.env.API_VERSION || 'v1',
  isDevelopment: process.env.NODE_ENV !== 'production',
  isProduction: process.env.NODE_ENV === 'production',
};
module.exports = config;
