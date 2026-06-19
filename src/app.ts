import { createLogger } from '@distributed-social-platform/shared-kernel'
import { buildInfra } from './container/infra'
import { buildApplication } from './container/application'
import { buildServer } from './bootstrap/server'

export async function createApp() {
  const logger = createLogger('auth-service')
  const infra = buildInfra(logger)
  const application = buildApplication(infra)

  return await buildServer(application, logger)
}
