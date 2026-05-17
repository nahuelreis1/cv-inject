import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  PORT: z.string().default('3000'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  AI_PROVIDER: z.enum(['gemini', 'deepseek', 'openai-compatible']).default('gemini'),
  GEMINI_API_KEY: z.string().default(''),
  DEEPSEEK_API_KEY: z.string().optional(),
  OPENAI_API_KEY: z.string().optional(),
  OPENAI_BASE_URL: z.string().optional(),
  OPENAI_MODEL: z.string().optional(),
  SUPABASE_URL: z.string().optional(),
  SUPABASE_ANON_KEY: z.string().optional(),
  SUPABASE_SERVICE_KEY: z.string().optional(),
  GEMINI_MOCK: z.string().transform((val) => val === 'true').default('true'),
  STORAGE_BUCKET_CV_UPLOADS: z.string().default('cv-uploads'),
  STORAGE_BUCKET_CV_OUTPUTS: z.string().default('cv-outputs'),
  MAX_FILE_SIZE_MB: z.string().transform(Number).default('10'),
  RATE_LIMIT_WINDOW_MS: z.string().transform(Number).default('900000'),
  RATE_LIMIT_MAX: z.string().transform(Number).default('30'),
});

const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
  console.error('❌ Invalid environment variables:', parsedEnv.error.format());
  process.exit(1);
}

export const env = parsedEnv.data;
