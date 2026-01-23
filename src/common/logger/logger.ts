import type { LoggerOptions } from 'pino';
import pino from 'pino';

export function createPinoLogger(env: string): LoggerOptions {
  const isLambda = Boolean(
    process.env.AWS_LAMBDA_FUNCTION_NAME || process.env.LAMBDA_TASK_ROOT
  );

  const isProd = env === 'production';
  const usePretty = !isProd && !isLambda;

  let transport: LoggerOptions['transport'] | undefined;

  if (usePretty) {
    try {
      // kiểm tra có cài pino-pretty chưa
      require.resolve('pino-pretty');

      transport = {
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'yyyy-mm-dd HH:MM:ss',
          singleLine: true,
          ignore: 'pid,hostname',
        },
      };
    } catch {
      // fallback: không dùng pretty nếu chưa cài
      transport = undefined;
    }
  }

  return {
    level: isProd ? 'info' : 'debug',

    messageKey: 'message',

    timestamp: pino.stdTimeFunctions.isoTime,

    base: {
      service: 'auth-service',
      env,
    },

    formatters: {
      level(label: string) {
        return { level: label };
      },
    },

    serializers: {
      err: pino.stdSerializers.err,
    },

    ...(transport && { transport }),
  };
}