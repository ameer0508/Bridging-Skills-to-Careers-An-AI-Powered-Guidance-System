import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { z } from 'zod';

// Resolve directory of current module to robustly load backend/.env
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Explicitly load backend/.env relative to this file, then fallback to cwd .env
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config();

const envSchema = z
  .object({
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
  })
  .refine(
    data => {
      if (data.NODE_ENV === 'production') {
        const isDefaultAccess =
          data.JWT_ACCESS_SECRET === 'skillbridge_access_token_secret_development_key';
        const isDefaultRefresh =
          data.JWT_REFRESH_SECRET === 'skillbridge_refresh_token_secret_development_key';
        return !isDefaultAccess && !isDefaultRefresh;
      }
      return true;
    },
    {
      message:
        'In production mode (NODE_ENV=production), strong non-default values must be supplied for JWT_ACCESS_SECRET and JWT_REFRESH_SECRET.',
    }
  );

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
