import dotenv from 'dotenv';
import { z } from 'zod';

// Load environment variables from .env file
dotenv.config();

const envSchema = z.object({
  PORT: z.coerce.number().default(5000),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  MONGODB_URI: z.string().default('mongodb://localhost:27017/skillbridge'),
  AI_SERVICE_URL: z.string().url().default('http://127.0.0.1:8000'),
  JWT_ACCESS_SECRET: z.string().default('skillbridge_access_token_secret_development_key'),
  JWT_REFRESH_SECRET: z.string().default('skillbridge_refresh_token_secret_development_key'),
  JWT_ACCESS_EXPIRATION: z.string().default('15m'),
  JWT_REFRESH_EXPIRATION: z.string().default('7d'),
  UPLOAD_MAX_SIZE: z.coerce.number().default(5242880), // 5MB in bytes
  UPLOAD_DIR: z.string().default('uploads/resumes'),

  // Frontend Integration Configuration
  FRONTEND_URL: z.string().default('http://localhost:3000'),

  // External Opportunity Provider Configuration
  RAPIDAPI_KEY: z.string().optional().default(''),
  JSEARCH_API_KEY: z.string().optional().default(''),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  // Use console.error directly at startup configuration failure
  // eslint-disable-next-line no-console
  console.error(
    '❌ Environment validation failed:',
    JSON.stringify(parsed.error.format(), null, 2)
  );
  process.exit(1);
}

export const env = parsed.data;
export default env;
