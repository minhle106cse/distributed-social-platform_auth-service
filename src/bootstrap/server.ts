import Fastify from 'fastify'
import { type UseCases } from '@/container/usecases'
import { createLogger } from '@distributed-social-platform/shared-kernel'
import { setupFastify } from './fastify'
import { setupSwagger } from './swagger'
import { authRoutes } from '@/modules/auth/presentation/routes/auth.routes'

interface ServerDeps {
  auth: UseCases['auth']
}

export async function buildServer(deps: ServerDeps) {
  const fastify = Fastify({
    logger: createLogger('auth-service'),
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

  await fastify.register(authRoutes, {
    prefix: '/auth',
    auth: deps.auth,
  })

  return fastify
}
