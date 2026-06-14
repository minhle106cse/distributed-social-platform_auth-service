import { buildInfra } from './container/infra'
import { buildApplication } from './container/application'
import { buildServer } from './bootstrap/server'

export async function createApp() {
  const infra = buildInfra()
  const application = buildApplication(infra)

  return await buildServer(application)
}
