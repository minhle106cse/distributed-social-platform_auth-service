import { env } from './env';

export const config = {
  nodeEnv: env.NODE_ENV,
  port: Number(env.PORT),

  databaseUrl: env.DATABASE_URL,

  jwt: {
    accessSecret: env.JWT_ACCESS_SECRET,
    refreshSecret: env.JWT_REFRESH_SECRET,
  },

  /* google: {
    clientId: env.GOOGLE_CLIENT_ID,
    clientSecret: env.GOOGLE_CLIENT_SECRET,
  }, */

  logLevel: env.LOG_LEVEL,
};