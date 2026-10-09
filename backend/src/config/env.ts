import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  PORT: z.string().default('5000').transform((val) => parseInt(val, 10)),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  MONGODB_URI: z
    .string()
    .default('mongodb://localhost:27017/fintrace-ai')
    .transform((val) => {
      // Clean up accidental duplicate key prefix if present (e.g. MONGODB_URI=mongodb+srv://...)
      if (val.startsWith('MONGODB_URI=')) {
        return val.substring('MONGODB_URI='.length);
      }
      return val;
    }),
  CORS_ORIGIN: z.string().default('http://localhost:5173'),
  GEMINI_API_KEY: z.string().optional().default(''),
  GEMINI_MODEL: z.string().optional().default('gemini-3.5-flash')
});

const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
  console.error('❌ Invalid environment variables:', parsedEnv.error.format());
  process.exit(1);
}

export const env = parsedEnv.data;
