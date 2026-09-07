import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import helmet from 'helmet';
import requestLogger from './middlewares/requestLogger.js';
import errorHandler from './middlewares/errorHandler.js';
import authRouter from './routes/auth.js';
import userRouter from './routes/user.js';
import resumeRouter from './routes/resume.js';
import skillsRouter from './routes/skills.js';
import careerRouter from './routes/career.js';
import readinessRouter from './routes/readiness.js';
import recommendationsRouter from './routes/recommendations.js';
import roadmapRouter from './routes/roadmap.js';
import analyticsRouter from './routes/analytics.js';
import conversationRouter from './routes/conversation.js';
import opportunitiesRouter from './routes/opportunities.js';
import interviewRouter from './routes/interview.js';
import env from './config/env.js';

import rateLimit from 'express-rate-limit';

const app = express();

const allowedOrigins = [
  env.FRONTEND_URL,
  'http://localhost:3000',
  'http://localhost:5173',
  'http://127.0.0.1:3000',
  'http://127.0.0.1:5173',
];

// Security and Hardening Middlewares
app.use(helmet());
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps or curl) or if origin is in whitelist
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('CORS policy does not allow access from this origin.'));
      }
    },
    credentials: true,
  })
);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Rate Limiting
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // Limit each IP to 1000 requests per window
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests from this IP, please try again after 15 minutes' },
});
app.use('/api/', apiLimiter);
app.use(requestLogger);

// Health check endpoint
app.get('/health', (_req, res) => {
  const dbStatus = mongoose.connection.readyState === 1 ? 'UP' : 'DOWN';
  const statusCode = dbStatus === 'UP' ? 200 : 503;

  res.status(statusCode).json({
    status: dbStatus,
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    services: {
      database: dbStatus,
    },
  });
});

// Root API V1 metadata response
app.get('/api/v1', (_req, res) => {
  res.status(200).json({
    success: true,
    message: 'SkillBridge API Foundation Active',
    version: '0.1.0-alpha',
  });
});

// API Route Registrations
app.use('/api/v1/auth', authRouter);
app.use('/api/v1/users', userRouter);
app.use('/api/v1/resumes', resumeRouter);
app.use('/api/v1/skills', skillsRouter);
app.use('/api/v1/careers', careerRouter);
app.use('/api/v1/readiness', readinessRouter);
app.use('/api/v1/recommendations', recommendationsRouter);
app.use('/api/v1/roadmap', roadmapRouter);
app.use('/api/v1/analytics', analyticsRouter);
app.use('/api/v1/ai', conversationRouter);
app.use('/api/v1/opportunities', opportunitiesRouter);
app.use('/api/v1/interviews', interviewRouter);

// Error handling middleware
app.use(errorHandler);

export default app;
