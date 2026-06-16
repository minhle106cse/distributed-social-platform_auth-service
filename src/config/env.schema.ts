import { z } from 'zod';

export const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production'])
    .default('development'),

  AUTH_SERVICE_PORT: z.string().default('4001'),

  AUTH_DATABASE_URL: z.string().url(),

  JWT_ACCESS_SECRET: z.string().min(32),
  JWT_REFRESH_SECRET: z.string().min(32),

  // Comma-separated allowed origins, e.g. "http://localhost:3000,https://app.example.com"
  CORS_ORIGINS: z.string().default('http://localhost:3000'),

  LOG_LEVEL: z
    .enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace'])
    .default('info'),
});
