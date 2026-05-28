import { FastifyInstance } from 'fastify'
import cors from '@fastify/cors'
import helmet from '@fastify/helmet'
import compress from '@fastify/compress'
import rateLimit from '@fastify/rate-limit'
import fastifyJwt from '@fastify/jwt'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { serializerCompiler, validatorCompiler } from 'fastify-type-provider-zod'
import { config } from '@/config'
import { authenticate } from '@/common/decorators/authenticate.decorator'
import { authorize } from '@/common/decorators/authorize.decorator'
import { httpLoggingHook } from '@/common/hooks/http-logging.hook'
import { httpResponseHook } from '@/common/hooks/http-response.hook'
import { globalErrorHandler } from '@/common/filter/global-error-handler'

export async function setupFastify(fastify: FastifyInstance) {
  fastify.withTypeProvider<ZodTypeProvider>()

  await fastify.register(cors, {
    origin: ['*'],
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
    secret: config.jwt.accessSecret
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
