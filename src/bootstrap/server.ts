import { createPublicKey, createHash } from 'crypto'
import Fastify, { type FastifyBaseLogger } from 'fastify'
import { register } from 'prom-client'
import {
  type ILogger,
  runWithTraceContext,
  startTraceContext,
} from '@distributed-social-platform/shared-kernel'
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

export async function buildServer(deps: ServerDeps, logger?: ILogger) {
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

  // Registered before setupFastify() so it's the FIRST onRequest hook — every
  // hook/handler after it (including the ones setupFastify adds) runs inside
  // the trace-context ALS scope. Reuses the traceId of an inbound
  // `traceparent` header (e.g. a request core-api forwarded) or starts a new
  // trace otherwise (auth-service is also a first-hop entry for login/register).
  fastify.addHook('onRequest', (req, _reply, done) => {
    const header = req.headers['traceparent']
    const inbound = Array.isArray(header) ? header[0] : header
    runWithTraceContext(startTraceContext(inbound), () => done())
  })

  await setupFastify(fastify)
  await setupSwagger(fastify)

  // infra endpoints (scraped by monitoring, e.g. Prometheus every 15s) must not
  // be rate-limited — same convention as core-api/notification-service/
  // search-service's @SkipThrottle() health controllers. compress:false because
  // @fastify/compress's gzip pipeline (pump + end-of-stream) was intermittently
  // truncating these responses to 0 bytes under concurrent/rapid scrape requests
  // (reproduced deterministically on /metrics: 5/5 gzip requests -> content-length
  // 0, "premature close" logged) — these payloads are small/low-traffic, not
  // worth compressing anyway.
  fastify.get(
    '/health',
    { config: { skipResponseWrapper: true, rateLimit: false, compress: false } },
    async (_req, reply) => {
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
    },
  )

  // JWKS (RFC 7517) must return the raw { keys: [...] } shape — external JWT
  // verifiers read this directly, not the app's {success,data} envelope.
  // skipResponseWrapper=true so httpResponseHook passes the plain object
  // through instead of throwing ResponseFormatError (payload isn't an
  // ApiResponse instance). compress:false to match /health and /metrics —
  // avoids the same @fastify/compress gzip-truncation issue fixed there.
  fastify.get(
    '/.well-known/jwks.json',
    { config: { skipResponseWrapper: true, compress: false } },
    () => {
      const keyObj = createPublicKey(config.jwt.publicKey)
      const jwk = keyObj.export({ format: 'jwk' }) as { n: string; e: string }
      const kid = createHash('sha256').update(config.jwt.publicKey).digest('hex').substring(0, 16)
      return {
        keys: [{ kty: 'RSA', use: 'sig', alg: 'RS256', kid, n: jwk.n, e: jwk.e }],
      }
    },
  )

  fastify.get(
    '/metrics',
    { config: { skipResponseWrapper: true, rateLimit: false, compress: false } },
    async (_req, reply) => {
      reply.header('Content-Type', register.contentType)
      reply.send(await register.metrics())
    },
  )

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
