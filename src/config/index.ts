import { env } from './env';

export const config = {
  nodeEnv: env.NODE_ENV,
  port: Number(env.AUTH_SERVICE_PORT),

  databaseUrl: env.AUTH_DATABASE_URL,

  jwt: {
    accessSecret: env.JWT_ACCESS_SECRET,
    refreshSecret: env.JWT_REFRESH_SECRET,
  },

  // Parse comma-separated origins into an array
  corsOrigins: env.CORS_ORIGINS.split(',').map((o) => o.trim()),

  /* google: {
    clientId: env.GOOGLE_CLIENT_ID,
    clientSecret: env.GOOGLE_CLIENT_SECRET,
  }, */

  logLevel: env.LOG_LEVEL,
};