import Fastify from 'fastify'
import { createLogger } from '@distributed-social-platform/shared-kernel'
import { setupFastify } from './fastify'
import { setupSwagger } from './swagger'
import { type Application } from '@/container/application'
import { authRoutes } from '@/modules/auth/presentation/routes/auth.routes'
import { userRoutes } from '@/modules/user/presentation/routes/user.routes'
import { roleRoutes } from '@/modules/rbac/presentation/routes/role.routes'
import { permissionRoutes } from '@/modules/rbac/presentation/routes/permission.routes'

interface ServerDeps {
  CommandBusService: Application['CommandBusService']
  QueryBusService: Application['QueryBusService']
}


export async function buildServer(deps: ServerDeps) {
  const isTest = process.env.NODE_ENV === 'test'
  const fastify = Fastify({
    logger: isTest ? false : undefined,
    loggerInstance: createLogger('auth-service') as any,
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

  fastify.get('/health', () => {
    return { status: 'ok' }
  })

  const client = await import('prom-client')
  client.collectDefaultMetrics()

  fastify.get('/metrics', async (req, reply) => {
    reply.header('Content-Type', client.register.contentType)
    return await client.register.metrics()
  })

  await fastify.register(async (api) => {
    await api.register(authRoutes, {
      prefix: '/auth',
      CommandBusService: deps.CommandBusService,
      QueryBusService: deps.QueryBusService
    })
    await api.register(userRoutes, {
      prefix: '/users',
      QueryBusService: deps.QueryBusService,
      CommandBusService: deps.CommandBusService
    })
    await api.register(roleRoutes, {
      prefix: '/roles',
      QueryBusService: deps.QueryBusService,
      CommandBusService: deps.CommandBusService
    })
    await api.register(permissionRoutes, {
      prefix: '/permissions', // NOTE: we might also mount them under /rbac or no prefix since the route has /permissions already, but wait, permissionRoutes has '/permissions', if we prefix it, it becomes /api/v1/permissions/permissions. Let's check what prefix is used.
      QueryBusService: deps.QueryBusService,
      CommandBusService: deps.CommandBusService
    })
  }, { prefix: '/api/v1' })

  return fastify
}
