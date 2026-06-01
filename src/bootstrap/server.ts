import Fastify from 'fastify'
import { type UseCases } from '@/container/usecases'
import { createLogger } from '@distributed-social-platform/shared-kernel'
import { setupFastify } from './fastify'
import { setupSwagger } from './swagger'
import { authRoutes } from '@/modules/auth/presentation/routes/auth.routes'

interface ServerDeps {
  commandBus: UseCases['commandBus']
}

export async function buildServer(deps: ServerDeps) {
  const fastify = Fastify({
    logger: process.env.NODE_ENV === 'test' ? false : createLogger('auth-service'),
    genReqId: (req) => {
      return Array.isArray(req.headers['x-request-id'])
        ? req.headers['x-request-id'][0]
        : (req.headers['x-request-id'] ?? crypto.randomUUID())
    },
    disableRequestLogging: true,
    bodyLimit: 2 * 1024 * 1024,
  })

  await setupFastify(fastify)
  await setupSwagger(fastify)

  fastify.get('/health', async () => {
    return { status: 'ok' }
  })

  await fastify.register(async (api) => {
    await api.register(authRoutes, {
      prefix: '/auth',
      commandBus: deps.commandBus,
    })
  }, { prefix: '/api/v1' })

  return fastify
}
