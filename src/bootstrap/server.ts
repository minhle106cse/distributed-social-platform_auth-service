import { createPublicKey, createHash } from 'crypto'
import Fastify, { type FastifyBaseLogger } from 'fastify'
import { createLogger, type ILogger } from '@distributed-social-platform/shared-kernel'
import { setupFastify } from './fastify'
import { setupSwagger } from './swagger'
import { config } from '@/config'
import { type Application } from '@/container/application'
import { authRoutes } from '@/modules/auth/presentation/routes/auth.routes'
import { userRoutes } from '@/modules/user/presentation/routes/user.routes'
import { roleRoutes } from '@/modules/rbac/presentation/routes/role.routes'
import { permissionRoutes } from '@/modules/rbac/presentation/routes/permission.routes'

interface ServerDeps {
  CommandBus: Application['CommandBus']
  QueryBus: Application['QueryBus']
}


export async function buildServer(deps: ServerDeps, logger: ILogger = createLogger('auth-service')) {
  const isTest = process.env.NODE_ENV === 'test'
  const fastify = Fastify({
    logger: isTest ? false : undefined,
    loggerInstance: logger as unknown as FastifyBaseLogger,
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

  fastify.get('/.well-known/jwks.json', () => {
    const keyObj = createPublicKey(config.jwt.publicKey)
    const jwk = keyObj.export({ format: 'jwk' }) as { n: string; e: string }
    const kid = createHash('sha256').update(config.jwt.publicKey).digest('hex').substring(0, 16)
    return {
      keys: [{ kty: 'RSA', use: 'sig', alg: 'RS256', kid, n: jwk.n, e: jwk.e }],
    }
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
      CommandBus: deps.CommandBus,
      QueryBus: deps.QueryBus
    })
    await api.register(userRoutes, {
      prefix: '/users',
      QueryBus: deps.QueryBus,
      CommandBus: deps.CommandBus
    })
    await api.register(roleRoutes, {
      prefix: '/roles',
      QueryBus: deps.QueryBus,
      CommandBus: deps.CommandBus
    })
    await api.register(permissionRoutes, {
      prefix: '/permissions', // NOTE: we might also mount them under /rbac or no prefix since the route has /permissions already, but wait, permissionRoutes has '/permissions', if we prefix it, it becomes /api/v1/permissions/permissions. Let's check what prefix is used.
      QueryBus: deps.QueryBus,
      CommandBus: deps.CommandBus
    })
  }, { prefix: '/api/v1' })

  return fastify
}
