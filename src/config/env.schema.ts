import { z } from 'zod'

export const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),

  AUTH_SERVICE_PORT: z.string().default('4001'),
  AUTH_GRPC_PORT: z.string().default('50051'),

  AUTH_DATABASE_URL: z.string().url(),

  // M2M auth for the internal gRPC contract (org provisioning) — not an
  // end-user JWT. Same value required in core-api's env.
  INTERNAL_GRPC_SHARED_SECRET: z.string().min(16),

  JWT_PRIVATE_KEY: z.string().min(200),
  JWT_PUBLIC_KEY: z.string().min(100),
  JWT_REFRESH_SECRET: z.string().min(32),

  // Comma-separated allowed origins, e.g. "http://localhost:3001,https://app.example.com"
  // 3001 matches apps/web's Vite dev server port (vite.config.ts).
  CORS_ORIGINS: z.string().default('http://localhost:3001'),

  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']).default('info'),
})
