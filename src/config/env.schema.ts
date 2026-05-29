import { z } from 'zod';

export const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production'])
    .default('development'),

  PORT: z.string().default('3000'),

  DATABASE_URL: z.string().url(),

  JWT_ACCESS_SECRET: z.string().min(32),
  JWT_REFRESH_SECRET: z.string().min(32),

  // Comma-separated allowed origins, e.g. "http://localhost:3000,https://app.example.com"
  CORS_ORIGINS: z.string().default('http://localhost:3000'),

  LOG_LEVEL: z
    .enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace'])
    .default('info'),
});
