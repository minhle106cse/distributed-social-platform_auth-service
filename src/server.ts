import type { FastifySchema, FastifySchemaCompiler, FastifySerializerCompiler } from 'fastify';
import Fastify from 'fastify'
import cors from '@fastify/cors'
import helmet from '@fastify/helmet'
import compress from '@fastify/compress'
import rateLimit from '@fastify/rate-limit'
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { serializerCompiler, validatorCompiler } from 'fastify-type-provider-zod';
import { authRoutes } from './modules/auth/presenstation/routes/auth.routes'
import { type UseCases } from './container/usecases'
import { createPinoLogger } from './common/logger/logger'
import { httpLoggingHook } from './common/hooks/http-logging.hook'
import { httpResponseHook } from './common/hooks/http-response.hook'
import { globalErrorHandler } from './common/filter/global-error-handler'
import { config } from './config'

interface ServerDeps {
  auth: UseCases['auth']
}

export function buildServer(deps: ServerDeps) {
  const fastify = Fastify({
    logger: createPinoLogger(config.nodeEnv || 'development'),
    genReqId: (req) => {
      return Array.isArray(req.headers['x-request-id'])
        ? req.headers['x-request-id'][0]
        : (req.headers['x-request-id'] ?? crypto.randomUUID())
    },
    disableRequestLogging: true,
    bodyLimit: 2 * 1024 * 1024,
  }).withTypeProvider<ZodTypeProvider>()

  fastify.register(cors, {
    origin: ['*'],
    credentials: true,
  })

  fastify.register(rateLimit, {
    max: 100,
    timeWindow: '1 minute',
  })

  fastify.register(helmet)

  fastify.register(compress, {
    encodings: ['gzip', 'deflate', 'br'],
  })

/*   fastify.register(fastifyJwt, {
    secret: config.jwt.secretKey
  }) */

  fastify.setValidatorCompiler(validatorCompiler as FastifySchemaCompiler<FastifySchema>);
  fastify.setSerializerCompiler(serializerCompiler as FastifySerializerCompiler<FastifySchema>);

  fastify.addHook('onRequest', (req, _reply, done) => {
    req.startTime = process.hrtime.bigint()
    done()
  })
  
  fastify.addHook('onResponse', httpLoggingHook)
  fastify.addHook('preSerialization', httpResponseHook)
  fastify.setErrorHandler(globalErrorHandler)

  fastify.get('/health', () => {
    return { status: 'ok' }
  })

  fastify.register(authRoutes, {
    prefix: '/auth',
    auth: deps.auth,
  })

  return fastify
}
