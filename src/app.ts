import { buildInfra } from './container/infra'
import { buildUseCases } from './container/usecases'
import { buildServer } from './bootstrap/server'

export async function createApp() {
  const infra = buildInfra()
  const useCases = buildUseCases(infra)

  return await buildServer(useCases)
}
