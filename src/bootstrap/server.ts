import { createPublicKey, createHash } from 'crypto'
import Fastify, { type FastifyBaseLogger } from 'fastify'
import { register } from 'prom-client'
import { createLogger, type ILogger } from '@distributed-social-platform/shared-kernel'
import { setupFastify } from './fastify'
import { setupSwagger } from './swagger'
import { config } from '@/config'
import { prisma } from '@/infrastructure/database/prisma/prisma.client'
import { type Application } from '@/container/application'
import { authRoutes } from '@/modules/auth/presentation/routes/auth.routes'
import { userRoutes } from '@/modules/user/presentation/routes/user.routes'
import { roleRoutes } from '@/modules/rbac/presentation/routes/role.routes'
import { permissionRoutes } from '@/modules/rbac/presentation/routes/permission.routes'

interface ServerDeps {
  CommandBus: Application['CommandBus']
  QueryBus: Application['QueryBus']
}

export async function buildServer(
  deps: ServerDeps,
  logger: ILogger = createLogger('auth-service'),
) {
  const isTest = process.env.NODE_ENV === 'test'
  const fastify = Fastify({
    ...(isTest ? { logger: false } : { loggerInstance: logger as unknown as FastifyBaseLogger }),
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

  fastify.get('/health', { config: { skipResponseWrapper: true } }, async (_req, reply) => {
    let dbOk = false
    try {
      await prisma.$queryRaw`SELECT 1`
      dbOk = true
    } catch {
      // health endpoint: db failure expected during cold start
    }
    reply.code(dbOk ? 200 : 503).send({
      status: dbOk ? 'ok' : 'degraded',
      service: 'auth-service',
      uptime: Math.floor(process.uptime()),
      timestamp: new Date().toISOString(),
      checks: { database: dbOk ? 'ok' : 'error' },
    })
  })

  fastify.get('/.well-known/jwks.json', () => {
    const keyObj = createPublicKey(config.jwt.publicKey)
    const jwk = keyObj.export({ format: 'jwk' }) as { n: string; e: string }
    const kid = createHash('sha256').update(config.jwt.publicKey).digest('hex').substring(0, 16)
    return {
      keys: [{ kty: 'RSA', use: 'sig', alg: 'RS256', kid, n: jwk.n, e: jwk.e }],
    }
  })

  fastify.get('/metrics', { config: { skipResponseWrapper: true } }, async (_req, reply) => {
    reply.header('Content-Type', register.contentType)
    reply.send(await register.metrics())
  })

  await fastify.register(
    async (api) => {
      await api.register(authRoutes, {
        prefix: '/auth',
        CommandBus: deps.CommandBus,
        QueryBus: deps.QueryBus,
      })
      await api.register(userRoutes, {
        prefix: '/users',
        QueryBus: deps.QueryBus,
        CommandBus: deps.CommandBus,
      })
      await api.register(roleRoutes, {
        prefix: '/roles',
        QueryBus: deps.QueryBus,
        CommandBus: deps.CommandBus,
      })
      await api.register(permissionRoutes, {
        prefix: '/permissions',
        QueryBus: deps.QueryBus,
        CommandBus: deps.CommandBus,
      })
    },
    { prefix: '/api/v1' },
  )

  return fastify
}
