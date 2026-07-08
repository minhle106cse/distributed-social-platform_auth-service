import { join } from 'path'
import { config as dotenvConfig } from 'dotenv'
dotenvConfig({ path: join(process.cwd(), '../../.env') })
import { collectDefaultMetrics } from 'prom-client'
import { createLogger } from '@distributed-social-platform/shared-kernel'
import { createApp } from './app'
import { config } from './config'
import { buildInfra } from './container/infra'
import { buildApplication } from './container/application'
import { startGrpcServer } from './bootstrap/grpc'
import { prismaService } from './infrastructure/database/prisma/prisma.client'

collectDefaultMetrics()

const SHUTDOWN_TIMEOUT_MS = 10_000

async function bootstrap() {
  // Single composition root — one Application (CommandBus/QueryBus/EventBus +
  // every handler, built exactly once) shared by both transports below. The
  // previous version built a SEPARATE Application "just for gRPC", which
  // meant two independent CommandBus instances with their own handler
  // instances running in the same process — harmless only by accident
  // (prisma happens to be a module-level singleton underneath). Building it
  // once and passing it to both removes the duplication instead of relying
  // on that accident.
  const logger = createLogger('auth-service')
  const infra = buildInfra(logger)
  const application = buildApplication(infra)

  const app = await createApp(application, logger)

  await app.listen({
    port: config.port,
    host: '0.0.0.0',
  })

  app.log.info(`🚀 Server running on port ${config.port}`)

  const grpcServer = startGrpcServer(application.CommandBus, logger)

  // Graceful shutdown: stop accepting new work on both transports, let
  // in-flight HTTP requests/gRPC calls finish (bounded by
  // SHUTDOWN_TIMEOUT_MS), THEN close the DB connection — closing Prisma
  // first would break any request still in flight.
  const shutdown = (signal: string) => {
    logger.info(`${signal} received, shutting down gracefully...`)

    const forceExit = setTimeout(() => {
      logger.error('Graceful shutdown timed out, forcing exit')
      process.exit(1)
    }, SHUTDOWN_TIMEOUT_MS)
    forceExit.unref() // don't let this timer itself keep the process alive

    Promise.all([
      app.close(),
      new Promise<void>((resolve) => grpcServer.tryShutdown(() => resolve())),
    ])
      .then(() => prismaService.disconnect())
      .then(() => {
        clearTimeout(forceExit)
        logger.info('Shutdown complete')
        process.exit(0)
      })
      .catch((err) => {
        logger.error({ err }, 'Error during shutdown')
        process.exit(1)
      })
  }

  process.on('SIGTERM', () => shutdown('SIGTERM'))
  process.on('SIGINT', () => shutdown('SIGINT'))
}

bootstrap().catch((err) => {
  console.error('❌ Fatal error during bootstrap')
  console.error(err)
  process.exit(1)
})
