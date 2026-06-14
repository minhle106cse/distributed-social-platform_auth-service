import { FastifyInstance } from 'fastify'
import cors from '@fastify/cors'
import helmet from '@fastify/helmet'
import compress from '@fastify/compress'
import rateLimit from '@fastify/rate-limit'
import fastifyJwt from '@fastify/jwt'
import fastifyCookie from '@fastify/cookie'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { serializerCompiler, validatorCompiler } from 'fastify-type-provider-zod'
import { config } from '@/config'
import { authenticate } from '@/infrastructure/http/decorators/authenticate.decorator'
import { authorize } from '@/infrastructure/http/decorators/authorize.decorator'
import { httpLoggingHook } from '@/infrastructure/http/hooks/http-logging.hook'
import { httpResponseHook } from '@/infrastructure/http/hooks/http-response.hook'
import { globalErrorHandler } from '@/infrastructure/http/filter/global-error-handler'

export async function setupFastify(fastify: FastifyInstance) {
  fastify.withTypeProvider<ZodTypeProvider>()

  await fastify.register(fastifyCookie)

  await fastify.register(cors, {
    origin: config.corsOrigins,
    credentials: true,
  })

  await fastify.register(rateLimit, {
    max: 100,
    timeWindow: '1 minute',
  })

  await fastify.register(helmet)

  await fastify.register(compress, {
    encodings: ['gzip', 'deflate', 'br'],
  })

  await fastify.register(fastifyJwt, {
    secret: config.jwt.accessSecret,
    cookie: {
      cookieName: 'accessToken',
      signed: false
    }
  })

  fastify.decorate('authenticate', authenticate)
  fastify.decorate('authorize', authorize)

  fastify.setValidatorCompiler(validatorCompiler)
  fastify.setSerializerCompiler(serializerCompiler)

  fastify.addHook('onRequest', (req, _reply, done) => {
    req.startTime = process.hrtime.bigint()
    done()
  })

  fastify.addHook('onResponse', httpLoggingHook)
  fastify.addHook('preSerialization', httpResponseHook)
  fastify.setErrorHandler(globalErrorHandler)
}
